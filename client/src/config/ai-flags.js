/**
 * @file AI Feature Flags Configuration
 * Controls rollout of enhanced medical AI features
 * All flags default to OFF for safe incremental testing
 */

export const AI_FLAGS = {
  /**
   * Enable medication query classification and high-yield med responses
   * Detects dosage, interaction, contraindication queries
   */
  ENABLE_MED_QUERY_CLASSIFIER: false,
  
  /**
   * Enable role-based response formatting
   * Differentiates between doctor vs public user responses
   */
  ENABLE_ROLE_MODE: false,
  
  /**
   * Enable concise mode for short-answer-first responses
   * Caps responses to 1-5 bullets or ≤3 sentences
   */
  ENABLE_CONCISE_MODE: false,
  
  /**
   * Enable expansion prompts for additional detail opt-ins
   * Adds "Want more details?" style prompts at end of responses
   */
  ENABLE_EXPANSION_PROMPT: false,
};

/**
 * Check if any medication enhancement flags are enabled
 * @returns {boolean}
 */
export function isMedicationEnhancementEnabled() {
  return AI_FLAGS.ENABLE_MED_QUERY_CLASSIFIER || AI_FLAGS.ENABLE_ROLE_MODE;
}

/**
 * Check if response formatting flags are enabled
 * @returns {boolean}
 */
export function isResponseFormatEnabled() {
  return AI_FLAGS.ENABLE_CONCISE_MODE || AI_FLAGS.ENABLE_EXPANSION_PROMPT;
}