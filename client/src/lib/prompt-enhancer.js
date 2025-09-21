import { selectDisclaimers } from "./disclaimers.js";
import { AI_FLAGS, CONCISE_SETTINGS, CLASSIFIER_SETTINGS } from "../config/ai-flags.js";
import { isDebug } from "./debug-flag.js";
// OLD expansion-handler.js imports removed - using new expansion-state.js system

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
/**
 * Normalize query text for robust classification
 * @param {string} text - Raw query text
 * @returns {string} - Normalized text
 */
function normalizeQueryText(text) {
  return text
    .toLowerCase()
    .trim()
    // Expand contractions (handle various punctuation)
    .replace(/what['';,]?s\b/g, 'what is')
    .replace(/\bwhats\b/g, 'what is')
    .replace(/how['';,]?s\b/g, 'how is')
    .replace(/why['';,]?s\b/g, 'why is')
    .replace(/where['';,]?s\b/g, 'where is')
    // Remove punctuation but preserve spaces
    .replace(/[^\w\s]/g, ' ')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Classify question type for intelligent response mode selection
 * @param {string} query - User input text
 * @returns {"educational"|"medication"|"symptom"|"general"} Question type classification
 */
export function classifyQuestionType(query) {
  if (!CLASSIFIER_SETTINGS.ENABLE_INTELLIGENT_CLASSIFIER) return "general";

  const normalizedQuery = normalizeQueryText(query);
  
  // Educational patterns - prioritize these for clear informational queries
  const educationalPatterns = [
    /\bwhat\s+(?:is|are)\b/,           // "what is", "what are"
    /\bexplain\b/,                     // "explain"
    /\bhow\s+does\b/,                  // "how does"
    /\bwhy\s+(?:is|are|does|do)?\b/,   // "why", "why is", "why does"
    /\bdefine\b/,                      // "define"
    /\btell\s+me\s+about\b/            // "tell me about"
  ];
  
  const isEducational = educationalPatterns.some(pattern => pattern.test(normalizedQuery));
  
  // Check for specific medical terms
  const hasMedicationTerms = CLASSIFIER_SETTINGS.CATEGORIES.MEDICATION.some(k => normalizedQuery.includes(k));
  const hasSymptomTerms = CLASSIFIER_SETTINGS.CATEGORIES.SYMPTOM.some(k => normalizedQuery.includes(k));
  
  // For educational patterns like "What is IBS?", check if it's mixed with specific medication/dosage questions
  if (isEducational) {
    // Only override to medication if asking specifically about medication details
    if (hasMedicationTerms && (normalizedQuery.includes("dosage") || normalizedQuery.includes("dose") || normalizedQuery.includes("mg") || normalizedQuery.includes("side effect"))) {
      return "medication";
    }
    
    // Return educational for pure informational queries
    return "educational";
  }

  // Non-educational queries: check for medication/symptom classification
  if (hasMedicationTerms) {
    return "medication";
  }

  if (hasSymptomTerms) {
    return "symptom";
  }

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
 * Apply concise mode formatting with context-aware expansion prompts
 * @param {string} template - Base template
 * @param {string} [_userRole="public"] - User role for role-specific expansion prompts (unused)
 * @param {string} [questionType="general"] - Question type for context-aware prompts
 * @returns {string}
 */
function applyConciseMode(template, _userRole = "public", questionType = "general") {
  if (!AI_FLAGS.ENABLE_CONCISE_MODE) return template;
  
  // Context-aware expansion prompts removed - handled by new expansion-state.js system

  // CRITICAL FIX: Never inject any expansion instructions in system prompt
  // This prevents expansion bleed and maintains clean separation between concise and expansion modes
  let expansionInstruction = "";
  
  if (questionType === "medication") {
    // For medication queries, enforce strict concise format with NO expansion instructions
    expansionInstruction = `\n- For medication dosage queries: provide ONLY essential dosing information. Do NOT add follow-up questions or expansion prompts. Keep responses to 3-5 sentences maximum.`;
  }

  // For medication queries, skip all expansion-related template additions
  if (questionType === "medication") {
    return template + `

CONCISE MEDICATION MODE ACTIVE:
- Keep answers <= 3-5 sentences maximum
- Provide ONLY essential dosing information
- Use direct, actionable format
- No side effects, interactions, or expansion prompts
- Include appropriate medical disclaimer only${expansionInstruction}`;
  }

  return template + `

CONCISE MODE ACTIVE:
- Keep answers <= ${CONCISE_SETTINGS.MAX_BULLETS} bullets OR ${CONCISE_SETTINGS.MAX_SENTENCES} sentences
- Stay under ${CONCISE_SETTINGS.MAX_TOKENS} tokens
- Use exam-style, high-yield formatting
- Prioritize highest-yield information first
- Be direct and actionable${expansionInstruction}
- Ensure disclaimers appear BEFORE any expansion question`;
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
 * Build prompts for a query with proper classification routing
 * @param {object} params - Parameters
 * @param {string} params.query - User query
 * @param {string} [params.userRole='public'] - User role
 * @param {object} params.flags - AI flags configuration
 * @returns {object} Prompt configuration with mode information
 */
export function buildPromptsForQuery({ query, userRole = 'public', flags }) {
  const questionType = classifyQuestionType(query);
  console.log('📊 [CLASSIFIER] Question classified as:', questionType, 'for query:', query);
  
  // TRACE: Classification result (non-intrusive)
  if (isDebug()) {
    console.log('[TRACE] classifyQuestionType ->', { questionType, query });
  }
  
  let systemPrompt = buildBaseSystemPrompt(userRole);
  let mode = "normal";

  if (questionType === "medication" && flags.ENABLE_CONCISE_MODE) {
    // SPECIALIZED MEDICATION CONCISE PROMPT - NO EXPANSION TEXT
    systemPrompt = buildConciseMedicationPrompt(userRole);
    mode = "concise";
    console.log('🔵 [PROMPT] Using buildConciseMedicationPrompt → concise');
    console.log('🔵 [PROMPT] Built for medication (concise) - expansion handled by UI only');
  } else if (questionType === "educational") {
    // Detailed path: do not inject concise or expansion text
    mode = "detailed";
  } else if (questionType === "symptom") {
    // Triage template path
    mode = "triage";
  }

  // TRACE: Prompt building result (non-intrusive)
  if (isDebug()) {
    console.log('[TRACE] buildPromptsForQuery ->', { mode, questionType });
    
    const systemPromptHead = systemPrompt.substring(0, 400);
    console.log('[TRACE] systemPrompt(head) ->', systemPromptHead);
    
    // Audit for expansion keywords leaking into prompt
    const hasSideEffects = /side effects|interactions|contraindications/i.test(systemPromptHead);
    const hasExpandWords = /expand|more details/i.test(systemPromptHead);
    console.log('[TRACE] promptAudit ->', { hasSideEffects, hasExpandWords });
  }

  console.log('🎯 [PROMPT] buildPromptsForQuery result:', { questionType, mode, userRole });
  return { systemPrompt, questionType, mode };
}

/**
 * Build base system prompt for a user role
 * @param {string} [userRole='public'] - User role
 * @returns {string} Base system prompt
 */
function buildBaseSystemPrompt(userRole = 'public') {
  return `You are a medical AI assistant providing helpful, accurate medical information.
${userRole === 'doctor' ? 'Assume healthcare professional audience.' : 'Assume general public audience.'}
Always include appropriate medical disclaimers and safety guidance.`;
}

/**
 * Build specialized concise medication prompt without expansion text
 * @param {string} [userRole='public'] - User role
 * @returns {string} Concise medication system prompt
 */
function buildConciseMedicationPrompt(userRole = 'public') {
  const baseDisclaimer = userRole === 'doctor' 
    ? "⚠️ Professional reference only. Verify with official prescribing information."
    : "⚠️ Informational purposes only. Not a substitute for professional medical advice.";

  const prompt = `You are a medical AI assistant providing concise medication dosage information.

STRICT CONCISE MODE FOR MEDICATION QUERIES:
- Response length: maximum 3-5 sentences only
- Provide ONLY key dosage types and units (e.g., "81 mg daily", "325 mg as needed")
- Include typical adult dosing ranges in simple format
- Do NOT expand, explain, or include side effects, interactions, or precautions
- Do NOT add follow-up questions or expansion prompts
- Do NOT include phrases like "Would you like more details" or similar
- Wait for explicit user expansion request before providing additional details

${userRole === 'doctor' 
  ? "Use clinical terminology with typical dosing ranges and adjustment criteria."
  : "Use patient-friendly language with simple dosage explanations."
}

Always end with: ${baseDisclaimer}

CRITICAL: Keep response strictly to dosage information only. Expansion invitations are handled separately by UI.`;

  console.log('📋 [PROMPT] Final medication system prompt (should contain NO expansion text):', prompt);
  return prompt;
}

/**
 * Main enhancer: selects template, injects context, and prefixes disclaimers/ATD for high risk.
 * @param {import("./layer-context.js").LayerContext} ctx
 * @param {string} [userRole="public"] - User role for role-based responses
 * @param {Array} [_conversationHistory=[]] - Previous conversation messages (unused)
 * @returns {{ systemPrompt: string, enhancedPrompt: string, atdNotices: string[], disclaimers: string[], suggestions: string[], expansionPrompt: string }}
 */
export function enhancePrompt(ctx, userRole = "public", _conversationHistory = []) {
  // OLD expansion detection removed - handled by new expansion-state.js system in llm-api.jsx
  
  // Classify question type for intelligent response mode selection
  const questionType = classifyQuestionType(ctx.userInput);
  
  
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
    // Medication questions: Use concise mode with medication-specific expansion option
    systemPrompt = applyConciseMode(systemPrompt, userRole, "medication");
  } else if (questionType === "symptom") {
    // Symptom questions: Use existing triage templates with symptom-specific expansion
    systemPrompt = applyConciseMode(systemPrompt, userRole, "symptom");
  } else {
    // Fallback: Apply concise mode with general expansion
    systemPrompt = applyConciseMode(systemPrompt, userRole, "general");
  }

  // Prefix severe with ATD block
  const header = (triageLevel === "EMERGENCY" || triageLevel === "URGENT")
    ? `IMPORTANT:\n${atdNotices.join("\n")}\n\n`
    : "";

  const enhancedPrompt = `${header}${contextBlock}\n\nPlease analyze and respond within the policy above.`;

  // Generate context-aware suggestions ONLY if expansion is enabled
  // CRITICAL FIX: Don't generate suggestions when expansion is disabled
  const suggestions = AI_FLAGS.ENABLE_EXPANSION_PROMPT
    ? generateFollowUpSuggestions(ctx) 
    : [];
  
  // Generate expansion prompt ONLY if expansion is globally enabled
  // CRITICAL: ALL expansion must respect the master flag
  let expansionPrompt = "";
  if (AI_FLAGS.ENABLE_EXPANSION_PROMPT) {
    if (questionType === "medication") {
      expansionPrompt = generateExpansionPrompt(userRole, true); // true for medication
    } else if (questionType === "symptom") {
      expansionPrompt = generateExpansionPrompt(userRole, false); // false for non-medication
    }
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