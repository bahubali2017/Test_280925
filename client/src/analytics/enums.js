/**
 * Analytics Enums and Constants for Anamnesis Medical AI Assistant
 * 
 * Privacy Notice: All enums support anonymized data collection only.
 * No personally identifiable information should be associated with these categories.
 * 
 * @file Defines categorization enums for medical query analytics
 */

/**
 * @typedef {"educational" | "generic" | "flagged" | "fallback"} LLMResponseCategory
 */

/**
 * LLM Response categorization for analytics and training data collection
 */
export const LLMResponseCategory = /** @type {const} */ ({
  /** Educational medical information responses */
  EDUCATIONAL: "educational",
  /** General conversational or non-medical responses */
  GENERIC: "generic", 
  /** Responses flagged for manual review or safety concerns */
  FLAGGED: "flagged",
  /** Fallback responses when processing fails */
  FALLBACK: "fallback"
});

/**
 * @typedef {"low" | "medium" | "high" | "critical"} SamplingPriority
 */

/**
 * Data sampling priority levels for query collection
 */
export const SamplingPriority = /** @type {const} */ ({
  /** Low priority - general queries */
  LOW: "low",
  /** Medium priority - medical but non-urgent */
  MEDIUM: "medium", 
  /** High priority - urgent medical queries */
  HIGH: "high",
  /** Critical priority - emergency or crisis situations */
  CRITICAL: "critical"
});

/**
 * @typedef {"hourly" | "daily" | "weekly"} LogRotation
 */

/**
 * Log rotation intervals for metadata logging
 */
export const LogRotation = /** @type {const} */ ({
  /** Rotate logs every hour */
  HOURLY: "hourly",
  /** Rotate logs daily */
  DAILY: "daily",
  /** Rotate logs weekly */
  WEEKLY: "weekly"
});

/**
 * @typedef {"symptom_focused" | "informational" | "preventive" | "crisis" | "unclear"} QueryCategory
 */

/**
 * Query analysis categories for pattern detection
 */
export const QueryCategory = /** @type {const} */ ({
  /** Queries focused on specific symptoms */
  SYMPTOM_FOCUSED: "symptom_focused",
  /** Information-seeking queries */
  INFORMATIONAL: "informational",
  /** Prevention and wellness queries */
  PREVENTIVE: "preventive",
  /** Crisis or emergency queries */
  CRISIS: "crisis",
  /** Unclear or ambiguous queries */
  UNCLEAR: "unclear"
});