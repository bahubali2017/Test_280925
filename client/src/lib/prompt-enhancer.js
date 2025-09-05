import { selectDisclaimers } from "./disclaimers.js";

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
 * @returns {{ systemPrompt: string, enhancedPrompt: string, atdNotices: string[], disclaimers: string[], suggestions: string[] }}
 */
export function enhancePrompt(ctx) {
  const triageLevel = ctx.triage?.level || "NON_URGENT";
  // Convert to lowercase for disclaimer system compatibility  
  const disclaimerLevel = triageLevel.toLowerCase().replace("_", "_");
  const templateKey = chooseTemplateKey(triageLevel, ctx.symptoms || []);
  const contextBlock = buildContextBlock(ctx);

  const { disclaimers, atdNotices } = selectDisclaimers(
    /** @type {"emergency"|"urgent"|"non_urgent"} */ (disclaimerLevel),
    (ctx.triage && "symptomNames" in ctx.triage) ? /** @type {any} */(ctx.triage).symptomNames : (ctx.symptoms || []).map(s => s.name?.toLowerCase()).filter(Boolean)
  );

  const systemPrompt = renderTemplate(templateKey, contextBlock);

  // Prefix severe with ATD block
  const header = (triageLevel === "EMERGENCY" || triageLevel === "URGENT")
    ? `IMPORTANT:\n${atdNotices.join("\n")}\n\n`
    : "";

  const enhancedPrompt = `${header}${contextBlock}\n\nPlease analyze and respond within the policy above.`;

  // Generate context-aware suggestions
  const suggestions = generateFollowUpSuggestions(ctx);

  return { systemPrompt, enhancedPrompt, atdNotices, disclaimers, suggestions };
}