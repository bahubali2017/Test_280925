import { selectDisclaimers } from "./disclaimers.js";
import { AI_FLAGS, CONCISE_SETTINGS, CLASSIFIER_SETTINGS } from "../config/ai-flags.js";
import { detectExpansionRequest, buildExpansionPrompt, extractOriginalQuery } from "./expansion-handler.js";

/** Inline fallbacks if templates cannot be loaded from disk */
const FALLBACK_TEMPLATES = {
  mild: `SYSTEM POLICY:
- Educational, cautious guidance.
- Avoid definitive diagnoses; use "possible", "may", "consider".
- Include: (1) Summary, (2) Common causes, (3) Self-care, (4) When to seek care, (5) Sources tier.

CONTEXT:
{{CONTEXT}}

INSTRUCTION:
Provide concise, clear, low-risk guidance and ask 2–3 follow-up questions if useful.`,
  moderate: `SYSTEM POLICY:
- Conservative medical guidance for non-urgent but notable issues.
- Avoid definitive diagnoses; use "possible", "may", "consider".
- Include: (1) Summary, (2) Differential considerations, (3) Precautions, (4) When to seek care soon, (5) Sources tier.

CONTEXT:
{{CONTEXT}}

INSTRUCTION:
Provide structured advice, note red flags to monitor, and propose next steps.`,
  severe: `SYSTEM POLICY:
- Prioritize safety; potential high-risk scenario.
- Start with ATD (Advice to Doctor) and urgency level.
- Avoid definitive diagnoses; use "possible", "may", "consider".
- Include: (1) Summary, (2) Risk flags, (3) Immediate actions, (4) Urgent next steps, (5) Sources tier.

CONTEXT:
{{CONTEXT}}

INSTRUCTION:
Be concise and directive. State urgent actions first, then brief rationale.`
};

/**
 * Template chooser: triage + severity → mild/moderate/severe
 * @param {"EMERGENCY"|"URGENT"|"NON_URGENT"} triage
 * @param {Array<import("./layer-context.js").Symptom>} symptoms
 * @returns {"mild"|"moderate"|"severe"}
 */
function chooseTemplateKey(triage, symptoms = []) {
  if (triage === "EMERGENCY") return "severe";
  if (triage === "URGENT") return "moderate";

  // check any explicit severe symptom severity
  const hasSevere = symptoms.some(s => s.severity === "SEVERE" || s.severity === "SHARP");
  if (hasSevere) return "moderate";

  return "mild";
}

/**
 * Build CONTEXT block from LayerContext safely.
 * @param {import("./layer-context.js").LayerContext} ctx
 * @returns {string}
 */
function buildContextBlock(ctx) {
  const lines = [];

  lines.push(`User input: ${ctx.userInput}`);

  if (Array.isArray(ctx.symptoms) && ctx.symptoms.length) {
    const parts = ctx.symptoms.map(s => {
      const bits = [s.name];
      if (s.location) bits.push(`@${s.location.toLowerCase()}`);
      if (s.severity) bits.push(`[${s.severity.toLowerCase()}]`);
      if (s.duration && (s.duration.unit || s.duration.raw)) {
        bits.push(`~${s.duration.raw || `${s.duration.value ?? ""} ${s.duration.unit}`}`.trim());
      }
      if (s.negated) bits.push("(negated)");
      return bits.filter(Boolean).join(" ");
    });
    lines.push(`Symptoms: ${parts.join("; ")}`);
  } else {
    lines.push("Symptoms: unspecified");
  }

  if (ctx.triage) {
    lines.push(`Triage: ${ctx.triage.level}${ctx.triage.reasons?.length ? ` (${ctx.triage.reasons.join("; ")})` : ""}`);
  } else {
    lines.push("Triage: pending");
  }

  // Room for body system inference later
  if (ctx.metadata?.bodySystem) {
    lines.push(`Body system: ${ctx.metadata.bodySystem}`);
  }

  return lines.join("\n");
}

/**
 * Render the selected template with {{CONTEXT}} injected.
 * @param {"mild"|"moderate"|"severe"} key
 * @param {string} contextBlock
 * @returns {string}
 */
function renderTemplate(key, contextBlock) {
  const tpl = FALLBACK_TEMPLATES[key] || FALLBACK_TEMPLATES.mild;
  return tpl.replace("{{CONTEXT}}", contextBlock);
}

/**
 * Classify question type for intelligent response mode selection
 * @param {string} query - User input text
 * @returns {"educational"|"medication"|"symptom"|"general"} - Question type
 */
export function classifyQuestionType(query) {
  console.log('[DEBUG] classifyQuestionType called with:', query);
  console.log('[DEBUG] CLASSIFIER_SETTINGS:', CLASSIFIER_SETTINGS);
  
  if (!CLASSIFIER_SETTINGS.ENABLE_INTELLIGENT_CLASSIFIER) {
    console.log('[DEBUG] Classifier disabled, returning general');
    return "general";
  }

  const q = query.toLowerCase().trim();
  
  // Debug logging for classification
  console.log('[DEBUG] Classification check:', {
    query: query,
    normalizedQuery: q,
    classifierEnabled: CLASSIFIER_SETTINGS.ENABLE_INTELLIGENT_CLASSIFIER,
    educationalKeywords: CLASSIFIER_SETTINGS.CATEGORIES.EDUCATIONAL
  });

  // Educational questions (immediate detailed response)
  const isEducational = CLASSIFIER_SETTINGS.CATEGORIES.EDUCATIONAL.some(k => {
    const matches = q.startsWith(k) || q.includes(k);
    console.log(`[DEBUG] Checking "${k}" against "${q}": startsWith=${q.startsWith(k)}, includes=${q.includes(k)}, matches=${matches}`);
    return matches;
  });
  
  if (isEducational) {
    console.log('[DEBUG] Classified as EDUCATIONAL');
    return "educational";
  }

  // Medication / treatment questions (concise first, expand on request)
  if (CLASSIFIER_SETTINGS.CATEGORIES.MEDICATION.some(k => q.includes(k))) {
    console.log('[DEBUG] Classified as MEDICATION');
    return "medication";
  }

  // Symptom / risk assessment (triage workflow)
  if (CLASSIFIER_SETTINGS.CATEGORIES.SYMPTOM.some(k => q.includes(k))) {
    console.log('[DEBUG] Classified as SYMPTOM');
    return "symptom";
  }

  console.log('[DEBUG] Classified as GENERAL (fallback)');
  return "general";
}

/**
 * Classify if query is medication-related (legacy function for compatibility)
 * @param {string} input - User input text
 * @returns {boolean}
 */
function classifyMedicationQuery(input) {
  if (!AI_FLAGS.ENABLE_MED_QUERY_CLASSIFIER) return false;
  
  const medKeywords = [
    "dosage", "dose", "mg", "ml", "iu",
    "contraindication", "interaction", "interactions",
    "side effect", "side effects", "pharmacology", 
    "prescribe", "prescription", "tablet", "capsule",
    "medication", "medicine", "drug", "pill"
  ];
  
  const lowered = input.toLowerCase();
  return medKeywords.some(keyword => lowered.includes(keyword));
}

/**
 * Build role-based medical policy
 * @param {"doctor"|"public"|string} userRole - User role
 * @param {boolean} isMedicationQuery - Whether this is a medication query
 * @returns {string}
 */
function buildRolePolicy(userRole, isMedicationQuery) {
  if (!AI_FLAGS.ENABLE_ROLE_MODE || !isMedicationQuery) return "";
  
  if (userRole === "doctor" || userRole === "verified_healthcare") {
    return `ROLE POLICY (Healthcare Professional):
- Provide concise bullets including dosages, algorithms, and clinical pearls
- Include typical dosing ranges, adjustment criteria, and monitoring parameters  
- Use clinical terminology and structured format
- Add disclaimer: "⚠️ Professional reference only. Verify with official prescribing information."

`;
  } else {
    return `ROLE POLICY (Public):
- Provide concise bullets including typical dosage ranges in simple format
- Focus on practical takeaways and key safety information
- Use patient-friendly language and clear explanations
- Add disclaimer: "⚠️ Informational purposes only. Not a substitute for professional medical advice."

`;
  }
}

/**
 * Apply concise mode formatting with role-specific expansion prompts
 * @param {string} template - Base template
 * @param {string} [userRole="public"] - User role for role-specific expansion prompts
 * @returns {string}
 */
function applyConciseMode(template, userRole = "public") {
  if (!AI_FLAGS.ENABLE_CONCISE_MODE) return template;
  
  const expansionLine = (userRole === "doctor" || userRole === "verified_healthcare")
    ? "Would you like me to expand with further clinical details (algorithms, monitoring, pearls)?"
    : "Would you like me to provide further detailed information (side effects, interactions, precautions)?";

  return template + `

CONCISE MODE ACTIVE:
- Keep answers <= ${CONCISE_SETTINGS.MAX_BULLETS} bullets OR ${CONCISE_SETTINGS.MAX_SENTENCES} sentences
- Stay under ${CONCISE_SETTINGS.MAX_TOKENS} tokens
- Use exam-style, high-yield formatting
- Prioritize highest-yield information first
- Be direct and actionable
- At the end of EVERY answer, add: "${expansionLine}"
- Ensure disclaimers appear BEFORE the expansion question`;
}

/**
 * Generate expansion prompt based on role and context
 * @param {"doctor"|"public"|string} userRole - User role
 * @param {boolean} isMedicationQuery - Whether this is a medication query
 * @returns {string}
 */
function generateExpansionPrompt(userRole, isMedicationQuery) {
  // If concise mode is active, expansion prompts are already included
  if (AI_FLAGS.ENABLE_CONCISE_MODE && CONCISE_SETTINGS.ALWAYS_ADD_EXPANSION) {
    return "";
  }
  
  if (!AI_FLAGS.ENABLE_EXPANSION_PROMPT) return "";
  
  if (!isMedicationQuery) {
    return "\n\nWould you like more detailed information about this topic?";
  }
  
  if (userRole === "doctor" || userRole === "verified_healthcare") {
    return "\n\nExpand with algorithms / monitoring protocols / clinical pearls?";
  } else {
    return "\n\nWould you like side effects / interactions / precautions?";
  }
}

/**
 * Generate context-aware follow-up suggestions
 * @param {import("./layer-context.js").LayerContext} ctx
 * @returns {string[]}
 */
function generateFollowUpSuggestions(ctx) {
  const suggestions = [];
  const triageLevel = ctx.triage?.level || "NON_URGENT";
  
  if (triageLevel === "EMERGENCY") {
    return [
      "If symptoms worsen or you feel unsafe, call emergency services immediately.",
      "Consider having someone stay with you or transport you to emergency care."
    ];
  }
  
  if (triageLevel === "URGENT") {
    return [
      "Schedule urgent medical evaluation within 24 hours if possible.",
      "Monitor symptoms closely and seek emergency care if they worsen."
    ];
  }

  // Generate dynamic suggestions based on symptoms
  if (ctx.symptoms?.length) {
    const hasLocation = ctx.symptoms.some(s => s.location);
    const hasDuration = ctx.symptoms.some(s => s.duration?.raw || s.duration?.value);
    
    if (!hasLocation) suggestions.push("Where exactly are you experiencing these symptoms?");
    if (!hasDuration) suggestions.push("How long have you been experiencing these symptoms?");
    
    suggestions.push("Have these symptoms gotten better, worse, or stayed the same?");
    suggestions.push("Are there any activities that make the symptoms better or worse?");
  } else {
    suggestions.push("Can you describe your main symptoms in more detail?");
    suggestions.push("When did you first notice these symptoms?");
  }

  return suggestions.slice(0, 3); // Limit to 3 suggestions
}

/**
 * Main enhancer: selects template, injects context, and prefixes disclaimers/ATD for high risk.
 * @param {import("./layer-context.js").LayerContext} ctx
 * @param {string} [userRole="public"] - User role for role-based responses
 * @param {Array} [conversationHistory=[]] - Previous conversation messages
 * @returns {{ systemPrompt: string, enhancedPrompt: string, atdNotices: string[], disclaimers: string[], suggestions: string[], expansionPrompt: string }}
 */
export function enhancePrompt(ctx, userRole = "public", conversationHistory = []) {
  // Check if this is an expansion request
  if (detectExpansionRequest(ctx.userInput)) {
    const originalQuery = extractOriginalQuery(conversationHistory);
    if (originalQuery) {
      // Build expansion prompt instead of normal triage flow
      const expansionPrompt = buildExpansionPrompt(originalQuery, userRole);
      
      // Return expansion-specific response structure
      return {
        systemPrompt: `EXPANSION MODE: Provide detailed follow-up information for the original query.`,
        enhancedPrompt: expansionPrompt,
        atdNotices: [],
        disclaimers: ["⚠️ Informational purposes only. Not a substitute for professional medical advice."],
        suggestions: [],
        expansionPrompt: ""
      };
    }
  }
  
  // Classify question type for intelligent response mode selection
  const questionType = classifyQuestionType(ctx.userInput);
  
  // Debug logging for classification
  console.log('[DEBUG] Question classification:', {
    userInput: ctx.userInput.substring(0, 100),
    questionType,
    classifierEnabled: CLASSIFIER_SETTINGS.ENABLE_INTELLIGENT_CLASSIFIER
  });
  
  const triageLevel = ctx.triage?.level || "NON_URGENT";
  // Convert to lowercase for disclaimer system compatibility  
  const disclaimerLevel = triageLevel.toLowerCase().replace("_", "_");
  const templateKey = chooseTemplateKey(triageLevel, ctx.symptoms || []);
  const contextBlock = buildContextBlock(ctx);

  // Check if this is a medication query
  const isMedicationQuery = classifyMedicationQuery(ctx.userInput);

  const { disclaimers, atdNotices } = selectDisclaimers(
    /** @type {"emergency"|"urgent"|"non_urgent"} */ (disclaimerLevel),
    (ctx.triage && "symptomNames" in ctx.triage) ? /** @type {any} */(ctx.triage).symptomNames : (ctx.symptoms || []).map(s => s.name?.toLowerCase()).filter(Boolean)
  );

  // Get base template and apply enhancements
  let systemPrompt = renderTemplate(templateKey, contextBlock);
  
  // Add role-based policy for medication queries
  const rolePolicy = buildRolePolicy(userRole, isMedicationQuery);
  if (rolePolicy) {
    systemPrompt = rolePolicy + systemPrompt;
  }
  
  // Apply intelligent classification logic for response mode
  if (questionType === "educational" || questionType === "general") {
    // Educational/general questions: Skip concise mode, provide detailed response immediately
    const educationalPrompt = `You are MAIA (Medical AI Assistant). Provide a detailed, structured explanation suitable for ${userRole === "doctor" ? "healthcare professionals" : "general public"}.

- Cover definitions, key features, and management overview
- Use clear formatting with bullets or short sections
- Include relevant clinical details ${userRole === "doctor" ? "with medical terminology" : "in patient-friendly language"}
- End with appropriate disclaimer

EDUCATIONAL MODE: Provide comprehensive information immediately.`;
    
    systemPrompt = educationalPrompt;
  } else if (questionType === "medication") {
    // Medication questions: Use concise mode with expansion option
    systemPrompt = applyConciseMode(systemPrompt, userRole);
  } else if (questionType === "symptom") {
    // Symptom questions: Use existing triage templates (already handled above)
    systemPrompt = applyConciseMode(systemPrompt, userRole);
  } else {
    // Fallback: Apply concise mode
    systemPrompt = applyConciseMode(systemPrompt, userRole);
  }

  // Prefix severe with ATD block
  const header = (triageLevel === "EMERGENCY" || triageLevel === "URGENT")
    ? `IMPORTANT:\n${atdNotices.join("\n")}\n\n`
    : "";

  const enhancedPrompt = `${header}${contextBlock}\n\nPlease analyze and respond within the policy above.`;

  // Generate context-aware suggestions
  const suggestions = generateFollowUpSuggestions(ctx);
  
  // Generate expansion prompt based on question type (not for educational questions)
  let expansionPrompt = "";
  if (questionType === "medication") {
    expansionPrompt = generateExpansionPrompt(userRole, true); // true for medication
  } else if (questionType === "symptom") {
    expansionPrompt = generateExpansionPrompt(userRole, false); // false for non-medication
  }
  // Educational and general questions get no expansion prompt (detailed immediately)

  return { 
    systemPrompt, 
    enhancedPrompt, 
    atdNotices, 
    disclaimers, 
    suggestions,
    expansionPrompt
  };
}