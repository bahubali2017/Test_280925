/** Core enums/constants used across the Interpretation Layer. */

/**
 *
 */
export const TRIAGE_FLAGS = Object.freeze({
  EMERGENCY: "emergency",
  URGENT: "urgent",
  NON_URGENT: "non_urgent",
});

/**
 *
 */
export const SEVERITY_TAGS = Object.freeze({
  MILD: "mild",
  MODERATE: "moderate",
  SEVERE: "severe",
  SHARP: "sharp",
  DULL: "dull",
  UNSPECIFIED: "unspecified",
});

/**
 *
 */
export const CONDITION_TYPES = Object.freeze({
  ACUTE: "acute",
  CHRONIC: "chronic",
  MENTAL: "mental",
  PHYSICAL: "physical",
  UNSPECIFIED: "unspecified",
});

/**
 *
 */
export const BODY_LOCATIONS = Object.freeze({
  CHEST: "chest",
  HEAD: "head",
  ABDOMEN: "abdomen",
  LIMB: "limb",
  GENERAL: "general",
  UNSPECIFIED: "unspecified",
});