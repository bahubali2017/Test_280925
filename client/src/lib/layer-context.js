import { validateLayerSchema } from "./utils/schema-validator.js";
import { TRIAGE_FLAGS, SEVERITY_TAGS, CONDITION_TYPES, BODY_LOCATIONS } from "./constants.js";

/**
 * @typedef {object} Duration
 * @property {number | null} [value]    // numeric value when available (e.g., 3)
 * @property {string} unit              // "day"|"week"|"hour"|"yesterday"|"ongoing"|...
 * @property {string} raw               // original matched text (e.g., "for 3 days", "since yesterday", "ongoing")
 */

/**
 * @typedef {object} Symptom
 * @property {string} name
 * @property {keyof typeof BODY_LOCATIONS} [location]
 * @property {keyof typeof SEVERITY_TAGS} [severity]
 * @property {Duration} [duration]
 * @property {boolean} [negated] // true if user denies the symptom
 */

/**
 * @typedef {object} Intent
 * @property {string} type // e.g., "symptom_check", "followup", "general_info"
 * @property {number} [confidence] // 0..1
 */

/**
 * @typedef {object} Triage
 * @property {keyof typeof TRIAGE_FLAGS} level
 * @property {boolean} isHighRisk
 * @property {string[]} [reasons]
 * @property {string[]} [symptomNames] - Optional list of symptom names detected
 */

/**
 * @typedef {object} LayerContext
 * @property {string} userInput
 * @property {Intent} [intent]
 * @property {Symptom[]} [symptoms]
 * @property {Triage} [triage]
 * @property {{ systemPrompt?: string, enhancedPrompt?: string }} [prompt]
 * @property {{ processingTime?: number, intentConfidence?: number, bodySystem?: string }} [metadata]
 * @property {{ age?: number, sex?: 'male'|'female'|'other' }} [demographics]
 */

/**
 * @param userInput
 * @returns {LayerContext}
 */
export function createLayerContext(userInput) {
  return {
    userInput: String(userInput ?? "").trim(),
    intent: undefined,
    symptoms: [],
    triage: undefined,
    prompt: {},
    metadata: {},
  };
}

/**
 * @param {LayerContext} ctx
 * @param {Partial<LayerContext>} patch
 * @returns {LayerContext}
 */
export function updateLayerContext(ctx, patch) {
  return Object.assign(ctx, patch);
}

/**
 * Validate context progressively.
 * @param {LayerContext} ctx
 * @param {{strict?: boolean}} [opts]
 * @returns {{ok: boolean, errors: import("./utils/schema-validator.js").ValidationError[]}}
 */
export function validateLayerContext(ctx, opts) {
  return validateLayerSchema(ctx, opts);
}

/**
 *
 */
export const ENUMS = { TRIAGE_FLAGS, SEVERITY_TAGS, CONDITION_TYPES, BODY_LOCATIONS };