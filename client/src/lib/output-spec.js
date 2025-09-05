/**
 * @typedef {object} LayeredMetadata
 * @property {number} processingTime - Total processing time in milliseconds
 * @property {number} [intentConfidence] - Intent parsing confidence (0-1), higher = more certain
 * @property {"emergency"|"urgent"|"non_urgent"} [triageLevel] - Medical triage classification
 * @property {string} [bodySystem] - Affected body system (e.g., "cardiovascular", "respiratory")
 * @property {string[]} [symptoms] - Detected symptoms from triage analysis
 * @property {Record<string, number>} [stageTimings] - Per-stage processing times in ms
 */

/**
 * Standardized Router Output Structure (LayeredResponse)
 * 
 * This is the guaranteed output format from routeMedicalQuery() for frontend consumption.
 * All fields are always present with proper types, even in error/fallback scenarios.
 * 
 * @typedef {object} LayeredResponse
 * @property {string} userInput - Canonicalized user input (guaranteed non-empty string)
 * @property {string} enhancedPrompt - AI system prompt with medical context (guaranteed non-empty)
 * @property {boolean} isHighRisk - High-risk flag from medical triage (true = needs urgent attention)
 * @property {string[]} disclaimers - Medical disclaimers to display (always array, may be empty)
 * @property {string[]} suggestions - Follow-up questions for user (always array, may be empty)
 * @property {LayeredMetadata} metadata - Processing metadata and performance metrics
 * @property {string[]} [atd] - Optional "Advice to Doctor" notices (array if present, undefined if not)
 * 
 * @example
 * // Emergency case example:
 * {
 *   userInput: "I have severe chest pain for 20 minutes",
 *   enhancedPrompt: "User input: severe chest pain...\nTriage: EMERGENCY\n...",
 *   isHighRisk: true,
 *   disclaimers: ["This may be a medical emergency. Contact emergency services immediately."],
 *   suggestions: ["Call 911 or emergency services now", "Do not delay seeking medical attention"],
 *   metadata: {
 *     processingTime: 78,
 *     intentConfidence: 0.92,
 *     triageLevel: "emergency",
 *     bodySystem: "cardiovascular",
 *     stageTimings: { parseIntent: 12, triage: 8, enhancePrompt: 15 }
 *   },
 *   atd: ["Immediate cardiology consultation recommended", "Consider acute coronary syndrome"]
 * }
 * 
 * @example
 * // Non-urgent case example:
 * {
 *   userInput: "I have a mild headache since yesterday",
 *   enhancedPrompt: "User input: mild headache...\nTriage: NON_URGENT\n...",
 *   isHighRisk: false,
 *   disclaimers: ["This assistant is informational and not a diagnostic tool."],
 *   suggestions: ["Can you describe the type of pain?", "Any triggers or relieving factors?"],
 *   metadata: {
 *     processingTime: 45,
 *     intentConfidence: 0.75,
 *     triageLevel: "non_urgent",
 *     stageTimings: { parseIntent: 8, triage: 3, enhancePrompt: 12 }
 *   }
 * }
 */

/**
 * Normalize and validate a tentative router output.
 * Ensures arrays/strings/booleans are present and properly typed.
 *
 * @param {Partial<LayeredResponse>} v
 * @returns {{ ok: boolean, errors: string[], result: LayeredResponse }}
 */
export function normalizeRouterResult(v) {
  /** @type {string[]} */
  const errors = [];
  const str = (x) => (typeof x === "string" ? x : String(x ?? ""));
  const arr = (x) => (Array.isArray(x) ? x.filter(Boolean).map(String) : []);
  const bool = (x) => !!x;

  /** @type {LayeredMetadata} */
  const meta = {
    processingTime: typeof v?.metadata?.processingTime === "number" ? v.metadata.processingTime : 0,
    intentConfidence: typeof v?.metadata?.intentConfidence === "number" ? v.metadata.intentConfidence : undefined,
    triageLevel:
      v?.metadata?.triageLevel === "emergency" || v?.metadata?.triageLevel === "urgent" || v?.metadata?.triageLevel === "non_urgent"
        ? v.metadata.triageLevel
        : undefined,
    bodySystem: typeof v?.metadata?.bodySystem === "string" ? v.metadata.bodySystem : undefined,
    symptoms: Array.isArray(v?.metadata?.symptoms) ? v.metadata.symptoms : undefined,
    stageTimings: (v?.metadata?.stageTimings && typeof v.metadata.stageTimings === "object") ? v.metadata.stageTimings : undefined
  };

  if (typeof meta.processingTime !== "number" || meta.processingTime < 0) errors.push("metadata.processingTime invalid");

  /** @type {LayeredResponse} */
  const result = {
    userInput: str(v?.userInput),
    enhancedPrompt: str(v?.enhancedPrompt || "System fallback: Provide general, low‑risk educational guidance."),
    isHighRisk: bool(v?.isHighRisk),
    disclaimers: arr(v?.disclaimers),
    suggestions: arr(v?.suggestions),
    metadata: meta,
    atd: v?.atd ? arr(v.atd) : undefined
  };

  if (!result.userInput) errors.push("userInput required");
  if (!result.enhancedPrompt) errors.push("enhancedPrompt required");
  if (!Array.isArray(result.disclaimers)) errors.push("disclaimers must be array");
  if (!Array.isArray(result.suggestions)) errors.push("suggestions must be array");

  return { ok: errors.length === 0, errors, result };
}