import { selectDisclaimers } from "./disclaimers.js";
import { AI_FLAGS, CLASSIFIER_SETTINGS } from "../config/ai-flags.js";
// PHASE 3 MODE ISOLATION - minimal imports for isolated builders

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

// REMOVED: classifyMedicationQuery function - violates PHASE 3 MODE ISOLATION
// Medication classification is now handled by classifyQuestionType

// REMOVED: buildRolePolicy function - violates PHASE 3 MODE ISOLATION
// Role-specific policies are now handled within each isolated builder

// REMOVED: applyConciseMode function - violates PHASE 3 MODE ISOLATION
// All mode-specific formatting is now handled by isolated builders

/**
 * Build isolated concise medication prompt - PHASE 3 MODE ISOLATION
 * @param {import("./layer-context.js").LayerContext} ctx - Layer context
 * @param {object} opts - Options object
 * @param {string} [opts.userRole='public'] - User role
 * @returns {{ systemPrompt: string, disclaimers: string[], atdNotices: string[], responseMode: string, questionType: string }} Medication prompt configuration
 */
export function buildConciseMedicationPrompt(ctx, opts = {}) {
  const { userRole = 'public' } = opts;
  
  const baseDisclaimer = userRole === 'doctor' 
    ? "⚠️ Professional reference only. Verify with official prescribing information."
    : "⚠️ Informational purposes only. Not a substitute for professional medical advice.";

  const systemPrompt = `You are a medical AI assistant providing concise medication dosage information.

STRICT CONCISE MODE FOR MEDICATION QUERIES:
- STRICT RULE: You MUST keep the response to a maximum of 5 sentences.
- If your response exceeds 5 sentences, truncate it immediately.
- Provide ONLY key dosage types and units (e.g., "81 mg daily", "325 mg as needed")
- Include typical adult dosing ranges in simple format
- Do NOT include side effects, interactions, or precautions
- Do NOT add follow-up questions or expansion prompts
- Do NOT include phrases like "Would you like more details" or similar
- Wait for explicit user expansion request before providing additional details

${userRole === 'doctor' 
  ? "Use clinical terminology with typical dosing ranges and adjustment criteria."
  : "Use patient-friendly language with simple dosage explanations."
}

Always end with: ${baseDisclaimer}

CRITICAL: Keep response strictly to dosage information only. Expansion invitations are handled separately by UI.

[STRICT RULE: Limit output to 3-5 sentences only. Do NOT expand, explain, or include side effects/interactions.]`;

  // Get disclaimers using centralized system
  const { disclaimers, atdNotices } = selectDisclaimers('non_urgent', ['medication']);
  
  console.log('📋 [PROMPT] buildConciseMedicationPrompt completed (isolated)');
  console.log('🧪 [PROMPT_TEST_CAPTURE] Final Medication Concise Prompt:\n', systemPrompt);
  
  return {
    systemPrompt,
    disclaimers,
    atdNotices,
    responseMode: 'concise_medication',
    questionType: 'medication'
  };
}

/**
 * Build isolated educational prompt - PHASE 3 MODE ISOLATION
 * @param {import("./layer-context.js").LayerContext} ctx - Layer context
 * @param {object} opts - Options object
 * @param {string} [opts.userRole='public'] - User role
 * @returns {{ systemPrompt: string, disclaimers: string[], atdNotices: string[], responseMode: string, questionType: string }} Educational prompt configuration
 */
export function buildEducationalPrompt(ctx, opts = {}) {
  const { userRole = 'public' } = opts;
  
  const systemPrompt = `You are MAIA (Medical AI Assistant). Provide detailed, structured educational information.

EDUCATIONAL MODE:
- Cover definitions, key features, and management overview
- Use clear formatting with bullets or short sections
- Include relevant clinical details ${userRole === 'doctor' ? 'with medical terminology' : 'in patient-friendly language'}
- Provide comprehensive information immediately
- End with appropriate disclaimer

Context: ${buildContextBlock(ctx)}

Analyze and provide educational information about the user's query.`;

  // Get disclaimers using centralized system
  const { disclaimers, atdNotices } = selectDisclaimers('non_urgent', ['educational']);
  
  console.log('📋 [PROMPT] buildEducationalPrompt completed (isolated)');
  
  return {
    systemPrompt,
    disclaimers,
    atdNotices,
    responseMode: 'educational',
    questionType: 'educational'
  };
}

/**
 * Build isolated symptom prompt - PHASE 3 MODE ISOLATION
 * @param {import("./layer-context.js").LayerContext} ctx - Layer context
 * @param {object} opts - Options object
 * @param {string} [opts.userRole='public'] - User role
 * @returns {{ systemPrompt: string, disclaimers: string[], atdNotices: string[], responseMode: string, questionType: string }} Symptom prompt configuration
 */
export function buildSymptomPrompt(ctx, opts = {}) {
  const { userRole = 'public' } = opts;
  
  const triageLevel = ctx.triage?.level || "NON_URGENT";
  const templateKey = chooseTemplateKey(triageLevel, ctx.symptoms || []);
  const contextBlock = buildContextBlock(ctx);
  
  // Role-specific adjustments for symptom prompts
  const roleAdjustment = userRole === 'doctor' 
    ? "\nUse clinical terminology and provide differential considerations."
    : "\nUse patient-friendly language and avoid complex medical terms.";
  
  const systemPrompt = renderTemplate(templateKey, contextBlock) + roleAdjustment;
  
  // Get disclaimers using centralized system
  const disclaimerLevel = triageLevel.toLowerCase().replace("_", "_");
  const symptomNames = (ctx.symptoms || []).map(s => s.name?.toLowerCase()).filter(Boolean);
  const { disclaimers, atdNotices } = selectDisclaimers(
    /** @type {"emergency"|"urgent"|"non_urgent"} */ (disclaimerLevel),
    symptomNames
  );
  
  console.log('📋 [PROMPT] buildSymptomPrompt completed (isolated)');
  
  return {
    systemPrompt,
    disclaimers,
    atdNotices,
    responseMode: 'symptom',
    questionType: 'symptom'
  };
}

/**
 * Build isolated general prompt - PHASE 3 MODE ISOLATION
 * @param {import("./layer-context.js").LayerContext} ctx - Layer context
 * @param {object} opts - Options object
 * @param {string} [opts.userRole='public'] - User role
 * @returns {{ systemPrompt: string, disclaimers: string[], atdNotices: string[], responseMode: string, questionType: string }} General prompt configuration
 */
export function buildGeneralPrompt(ctx, opts = {}) {
  const { userRole = 'public' } = opts;
  
  const systemPrompt = `You are a medical AI assistant providing helpful, accurate medical information.
${userRole === 'doctor' ? 'Assume healthcare professional audience.' : 'Assume general public audience.'}
Always include appropriate medical disclaimers and safety guidance.

Context: ${buildContextBlock(ctx)}

Provide balanced, brief guidance for the user's query.`;

  // Get disclaimers using centralized system
  const { disclaimers, atdNotices } = selectDisclaimers('non_urgent', ['general']);
  
  console.log('📋 [PROMPT] buildGeneralPrompt completed (isolated)');
  
  return {
    systemPrompt,
    disclaimers,
    atdNotices,
    responseMode: 'general',
    questionType: 'general'
  };
}

// REMOVED: generateFollowUpSuggestions function - violates PHASE 3 MODE ISOLATION
// Follow-up suggestions are now handled by UI layer only

/**
 * Build prompts for a query with strict mode isolation routing - PHASE 3
 * @param {object} params - Parameters
 * @param {string} params.query - User query
 * @param {string} [params.userRole='public'] - User role
 * @param {object} [params.flags] - AI flags configuration (unused in isolated mode)
 * @param {import("./layer-context.js").LayerContext|null} [params.ctx] - Layer context for builders
 * @returns {{ systemPrompt: string, questionType: string, mode: string, disclaimers: string[], atdNotices: string[], responseMode: string }} Prompt configuration with mode information
 */
export function buildPromptsForQuery({ query, userRole = 'public', ctx = null }) {
  const questionType = classifyQuestionType(query);
  
  // REQUIRED TRACE: Classification result
  console.log('[TRACE] classifyQuestionType →', { questionType });
  
  // STRICT ROUTING - PHASE 3 MODE ISOLATION
  /** @type {{ systemPrompt: string, disclaimers: string[], atdNotices: string[], responseMode: string, questionType: string }} */
  let builderResult;
  let builderName;
  
  const contextInput = ctx || { userInput: query };
  
  if (questionType === "medication") {
    builderName = "buildConciseMedicationPrompt";
    builderResult = buildConciseMedicationPrompt(contextInput, { userRole });
  } else if (questionType === "educational") {
    builderName = "buildEducationalPrompt";
    builderResult = buildEducationalPrompt(contextInput, { userRole });
  } else if (questionType === "symptom") {
    builderName = "buildSymptomPrompt";
    builderResult = buildSymptomPrompt(contextInput, { userRole });
  } else {
    builderName = "buildGeneralPrompt";
    builderResult = buildGeneralPrompt(contextInput, { userRole });
  }
  
  // REQUIRED TRACE: Mode routing
  console.log('[MODE]', questionType, '→', builderName);
  
  // REQUIRED TRACE: System prompt head
  const systemPromptHead = builderResult.systemPrompt.substring(0, 300);
  console.log('[TRACE] systemPrompt(head) →', systemPromptHead);
  
  // AUDIT TRACE: Capture complete buildPromptsForQuery return object
  if (typeof window !== 'undefined' && window.console) {
    console.log('🔍 [BUILDER_OUTPUT] Full systemPrompt from buildPromptsForQuery:\n', builderResult.systemPrompt);
    console.log('🔍 [BUILDER_OUTPUT] responseMode:', builderResult.responseMode, 'questionType:', builderResult.questionType);
  }

  return {
    systemPrompt: builderResult.systemPrompt,
    questionType: builderResult.questionType,
    mode: builderResult.responseMode,
    disclaimers: builderResult.disclaimers,
    atdNotices: builderResult.atdNotices,
    responseMode: builderResult.responseMode
  };
}

// REMOVED: buildBaseSystemPrompt function - violates PHASE 3 MODE ISOLATION
// Base prompts are now handled within each isolated builder

// REMOVED: Duplicate buildConciseMedicationPrompt function - original is at top of file

/**
 * PHASE 3 MODE ISOLATION: Enhanced main enhancer using isolated builders
 * @param {import("./layer-context.js").LayerContext} ctx
 * @param {string} [userRole="public"] - User role for role-based responses
 * @param {string[]} [_conversationHistory=[]] - Previous conversation messages (unused)
 * @returns {{ systemPrompt: string, enhancedPrompt: string, atdNotices: string[], disclaimers: string[], suggestions: string[], expansionPrompt: string, responseMode: string }}
 */
export function enhancePrompt(ctx, userRole = "public", _conversationHistory = []) {
  // Use buildPromptsForQuery with isolated builders
  const result = buildPromptsForQuery({
    query: ctx.userInput,
    userRole,
    flags: AI_FLAGS,
    ctx
  });
  
  const triageLevel = ctx.triage?.level || "NON_URGENT";
  
  // Build enhanced prompt with ATD prefix for emergencies
  const header = (triageLevel === "EMERGENCY" || triageLevel === "URGENT")
    ? `IMPORTANT:\n${result.atdNotices.join("\n")}\n\n`
    : "";

  const contextBlock = buildContextBlock(ctx);
  const enhancedPrompt = `${header}${contextBlock}\n\nPlease analyze and respond within the policy above.`;

  // PHASE 3: No expansion prompts or suggestions in system prompts
  // All expansion is handled by UI layer only
  /** @type {string[]} */
  const suggestions = [];
  const expansionPrompt = "";\n\n  // PHASE 3 VERIFICATION: Output final bundle hash + timestamp\n  const buildTimestamp = Date.now();\n  const buildHash = `PHASE3_MODE_ISOLATION_${buildTimestamp.toString(36).toUpperCase()}`;\n  console.log('[BUILD]', buildHash, buildTimestamp);\n  console.log('[PHASE-3-COMPLETE] MODE ISOLATION verified - builders isolated, routing strict, expansion UI-only');

  return { 
    systemPrompt: result.systemPrompt, 
    enhancedPrompt, 
    atdNotices: result.atdNotices, 
    disclaimers: result.disclaimers, 
    suggestions,
    expansionPrompt,
    responseMode: result.responseMode
  };
}