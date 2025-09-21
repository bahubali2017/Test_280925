/**
 * @file AI Feature Flags Configuration
 * Controls rollout of enhanced medical AI features
 * All flags default to OFF for safe incremental testing
 * Version: 1.1 - Concise mode enabled
 */

// AI feature flags configuration loaded

/**
 *
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
  ENABLE_CONCISE_MODE: true,
  
  /**
   * Enable expansion prompts for additional detail opt-ins
   * Adds "Want more details?" style prompts at end of responses
   */
  ENABLE_EXPANSION_PROMPT: false,
};

/**
 * Concise mode configuration settings
 * Controls exam-style, high-yield response formatting
 */
export const CONCISE_SETTINGS = {
  MAX_BULLETS: 5,
  MAX_SENTENCES: 3,
  MAX_TOKENS: 200,
  EXAM_STYLE: true,
  ALWAYS_ADD_EXPANSION: false  // Fixed: Don't force expansion when it's disabled
};

/**
 * Expansion flow configuration settings
 * Controls automatic expansion from concise to detailed responses
 */
export const EXPANSION_SETTINGS = {
  ENABLE_AUTO_EXPANSION: false,   // Fixed: Respect the main expansion flag
  EXPANSION_KEYWORDS: ["yes", "expand", "more", "details"], // triggers for text input
};

/**
 * Intelligent question classification settings
 * Controls automatic question type detection for response mode selection
 */
export const CLASSIFIER_SETTINGS = {
  ENABLE_INTELLIGENT_CLASSIFIER: true,
  CATEGORIES: {
    EDUCATIONAL: ["what is", "explain", "how does", "why", "what are", "define"],
    MEDICATION: ["dosage", "dose", "mg", "milligram", "tablet", "capsule",
                 "iu", "side effect", "interaction", "contraindication", "prescription"],
    SYMPTOM: ["pain", "fever", "cough", "rash", "vomit", "dizzy", "symptom", "hurt", "ache"]
  }
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