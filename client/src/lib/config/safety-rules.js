/**
 * @file Centralized medical safety rules and high-risk symptom patterns
 * Phase 9: Medical Safety Guidelines - Clinical-grade safety framework
 */

/**
 * Critical emergency symptoms that always escalate to emergency level
 * @type {Array<{pattern: string, category: 'cardiovascular'|'respiratory'|'neurological'|'mental_health'|'trauma', urgency: 'emergency', description: string}>}
 */
export const EMERGENCY_SYMPTOMS = [
  // Cardiovascular emergencies
  { pattern: "chest pain", category: "cardiovascular", urgency: "emergency", description: "Potential cardiac event" },
  { pattern: "heart attack", category: "cardiovascular", urgency: "emergency", description: "Acute myocardial infarction" },
  { pattern: "crushing chest pain", category: "cardiovascular", urgency: "emergency", description: "Severe cardiac symptoms" },
  { pattern: "radiating pain to arm", category: "cardiovascular", urgency: "emergency", description: "Classic cardiac pain pattern" },
  { pattern: "cardiac arrest", category: "cardiovascular", urgency: "emergency", description: "Life-threatening emergency" },

  // Respiratory emergencies
  { pattern: "can't breathe", category: "respiratory", urgency: "emergency", description: "Severe respiratory distress" },
  { pattern: "difficulty breathing", category: "respiratory", urgency: "emergency", description: "Respiratory compromise" },
  { pattern: "shortness of breath", category: "respiratory", urgency: "emergency", description: "Dyspnea requiring evaluation" },
  { pattern: "choking", category: "respiratory", urgency: "emergency", description: "Airway obstruction" },
  { pattern: "blue lips", category: "respiratory", urgency: "emergency", description: "Cyanosis indicating hypoxia" },

  // Neurological emergencies
  { pattern: "loss of consciousness", category: "neurological", urgency: "emergency", description: "Altered mental status" },
  { pattern: "unconscious", category: "neurological", urgency: "emergency", description: "Loss of consciousness" },
  { pattern: "severe headache", category: "neurological", urgency: "emergency", description: "Potential intracranial issue" },
  { pattern: "worst headache of my life", category: "neurological", urgency: "emergency", description: "Classic subarachnoid hemorrhage presentation" },
  { pattern: "stroke", category: "neurological", urgency: "emergency", description: "Cerebrovascular emergency" },
  { pattern: "seizure", category: "neurological", urgency: "emergency", description: "Neurological emergency" },
  { pattern: "paralysis", category: "neurological", urgency: "emergency", description: "Acute neurological deficit" },

  // Mental health emergencies
  { pattern: "want to kill myself", category: "mental_health", urgency: "emergency", description: "Active suicidal ideation" },
  { pattern: "suicide", category: "mental_health", urgency: "emergency", description: "Suicidal thoughts or behavior" },
  { pattern: "ending my life", category: "mental_health", urgency: "emergency", description: "Suicidal ideation" },
  { pattern: "want to harm myself", category: "mental_health", urgency: "emergency", description: "Self-harm risk" },
  { pattern: "overdose", category: "mental_health", urgency: "emergency", description: "Potential poisoning emergency" },

  // Trauma emergencies
  { pattern: "severe bleeding", category: "trauma", urgency: "emergency", description: "Hemorrhagic emergency" },
  { pattern: "broken bone", category: "trauma", urgency: "emergency", description: "Potential fracture requiring evaluation" },
  { pattern: "head injury", category: "trauma", urgency: "emergency", description: "Potential traumatic brain injury" }
];

/**
 * Urgent symptoms requiring medical attention within hours
 * @type {Array<{pattern: string, category: string, urgency: 'urgent', description: string}>}
 */
export const URGENT_SYMPTOMS = [
  { pattern: "high fever", category: "infection", urgency: "urgent", description: "Fever requiring evaluation" },
  { pattern: "persistent vomiting", category: "gastrointestinal", urgency: "urgent", description: "Risk of dehydration" },
  { pattern: "severe pain", category: "pain", urgency: "urgent", description: "Pain requiring evaluation" },
  { pattern: "vision changes", category: "neurological", urgency: "urgent", description: "Visual disturbances" },
  { pattern: "rash with fever", category: "dermatological", urgency: "urgent", description: "Potential systemic infection" }
];

/**
 * Mental health crisis detection patterns
 * @type {Array<{pattern: string, severity: 'high'|'medium', response: string}>}
 */
export const MENTAL_HEALTH_TRIGGERS = [
  { pattern: "kill myself", severity: "high", response: "immediate_crisis_intervention" },
  { pattern: "end my life", severity: "high", response: "immediate_crisis_intervention" },
  { pattern: "suicide", severity: "high", response: "immediate_crisis_intervention" },
  { pattern: "self harm", severity: "high", response: "crisis_support" },
  { pattern: "cutting myself", severity: "high", response: "crisis_support" },
  { pattern: "want to die", severity: "high", response: "immediate_crisis_intervention" },
  { pattern: "no reason to live", severity: "medium", response: "mental_health_support" },
  { pattern: "hopeless", severity: "medium", response: "mental_health_support" },
  { pattern: "can't go on", severity: "medium", response: "mental_health_support" }
];

/**
 * Phrases that suggest overconfident diagnosis - to be filtered/modified
 * @type {Array<{phrase: string, replacement: string}>}
 */
export const OVERCONFIDENT_PHRASES = [
  { phrase: "You have", replacement: "You may be experiencing" },
  { phrase: "This is", replacement: "This could possibly be" },
  { phrase: "You definitely have", replacement: "Your symptoms may suggest" },
  { phrase: "The diagnosis is", replacement: "These symptoms could indicate" },
  { phrase: "You're suffering from", replacement: "You may be experiencing symptoms consistent with" },
  { phrase: "It is", replacement: "It may be" },
  { phrase: "This indicates", replacement: "This may suggest" },
  { phrase: "You need", replacement: "You may benefit from" },
  { phrase: "Take this medication", replacement: "Discuss with your doctor whether this medication is appropriate" }
];

/**
 * Conservative triage bias rules - when in doubt, escalate
 * @type {Array<{condition: string, biasRule: string, action: 'escalate'|'flag'}>}
 */
export const CONSERVATIVE_BIAS_RULES = [
  { condition: "ambiguous_chest_symptoms", biasRule: "Any chest-related symptoms escalate to urgent", action: "escalate" },
  { condition: "breathing_concerns", biasRule: "Any breathing difficulty escalates to urgent", action: "escalate" },
  { condition: "mental_health_indicators", biasRule: "Any mental health crisis indicators escalate to emergency", action: "escalate" },
  { condition: "pediatric_symptoms", biasRule: "Children's symptoms escalate one level higher", action: "escalate" },
  { condition: "elderly_symptoms", biasRule: "Elderly symptoms (65+) escalate one level higher", action: "escalate" },
  { condition: "multiple_symptoms", biasRule: "Multiple concerning symptoms together escalate", action: "escalate" }
];

/**
 * Emergency contact information by region
 * @type {Record<string, {emergency: string, crisis: string, poison: string}>}
 */
export const EMERGENCY_CONTACTS = {
  "US": {
    emergency: "911",
    crisis: "988", // National Suicide Prevention Lifeline
    poison: "1-800-222-1222"
  },
  "UK": {
    emergency: "999",
    crisis: "116 123", // Samaritans
    poison: "0344 892 0111"
  },
  "EU": {
    emergency: "112",
    crisis: "116 123", // European crisis line
    poison: "Local poison control"
  },
  "AU": {
    emergency: "000",
    crisis: "13 11 14", // Lifeline Australia
    poison: "13 11 26"
  },
  "CA": {
    emergency: "911",
    crisis: "1-833-456-4566", // Talk Suicide Canada
    poison: "1-844-764-7669"
  }
};

// SAFETY_DISCLAIMERS removed - now centralized in disclaimers.js via selectDisclaimers()
// All disclaimer text now comes from the unified disclaimer system

/**
 * Privacy compliance patterns - data to exclude from logging
 * @type {Array<{pattern: RegExp, type: 'pii'|'phi'|'sensitive'}>}
 */
export const PRIVACY_EXCLUSIONS = [
  { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, type: "pii" }, // SSN
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, type: "pii" }, // Email
  { pattern: /\b\d{3}-\d{3}-\d{4}\b/g, type: "pii" }, // Phone number
  { pattern: /\b(?:my name is|i'm|i am)\s+[A-Z][a-z]+/gi, type: "pii" }, // Names
  { pattern: /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g, type: "phi" }, // Dates
  { pattern: /\b(?:insurance|policy|member)\s*(?:number|id)?\s*:?\s*\w+/gi, type: "phi" } // Insurance info
];

/**
 * Validate if a symptom triggers emergency protocol
 * @param {string} text - User input text
 * @returns {boolean} Whether emergency protocol should be triggered
 */
export function isEmergencySymptom(text) {
  const lowercaseText = text.toLowerCase();
  return EMERGENCY_SYMPTOMS.some(symptom => lowercaseText.includes(symptom.pattern));
}

/**
 * Check for mental health crisis indicators
 * @param {string} text - User input text
 * @returns {{isCrisis: boolean, severity: string|null, triggers: string[]}} Crisis assessment
 */
export function assessMentalHealthCrisis(text) {
  const lowercaseText = text.toLowerCase();
  const triggers = [];
  let maxSeverity = null;

  for (const trigger of MENTAL_HEALTH_TRIGGERS) {
    if (lowercaseText.includes(trigger.pattern)) {
      triggers.push(trigger.pattern);
      if (!maxSeverity || trigger.severity === "high") {
        maxSeverity = trigger.severity;
      }
    }
  }

  return {
    isCrisis: triggers.length > 0,
    severity: maxSeverity,
    triggers
  };
}

/**
 * Apply conservative bias to triage level
 * @param {string} baseLevel - Original triage level
 * @param {string} text - User input text
 * @param {object} context - Additional context (age, symptoms, etc.)
 * @returns {string} Escalated triage level if bias rules apply
 */
export function applyConservativeBias(baseLevel, text, context = {}) {
  let escalatedLevel = baseLevel;
  const lowercaseText = text.toLowerCase();

  // Check each conservative bias rule
  for (const rule of CONSERVATIVE_BIAS_RULES) {
    let shouldEscalate = false;

    switch (rule.condition) {
      case "ambiguous_chest_symptoms":
        shouldEscalate = lowercaseText.includes("chest") && !lowercaseText.includes("chest pain");
        break;
      case "breathing_concerns":
        shouldEscalate = lowercaseText.includes("breath") || lowercaseText.includes("breathing");
        break;
      case "mental_health_indicators":
        shouldEscalate = assessMentalHealthCrisis(text).isCrisis;
        break;
      case "pediatric_symptoms":
        shouldEscalate = context.age && context.age < 18;
        break;
      case "elderly_symptoms":
        shouldEscalate = context.age && context.age >= 65;
        break;
      case "multiple_symptoms":
        shouldEscalate = context.symptomCount && context.symptomCount >= 3;
        break;
    }

    if (shouldEscalate && rule.action === "escalate") {
      if (escalatedLevel === "NON_URGENT") escalatedLevel = "URGENT";
      else if (escalatedLevel === "URGENT") escalatedLevel = "EMERGENCY";
    }
  }

  return escalatedLevel;
}

/**
 * Filter overconfident language from AI responses
 * @param {string} response - AI response text
 * @returns {string} Filtered response with cautious language
 */
export function filterOverconfidentLanguage(response) {
  let filteredResponse = response;

  for (const { phrase, replacement } of OVERCONFIDENT_PHRASES) {
    const regex = new RegExp(phrase, 'gi');
    filteredResponse = filteredResponse.replace(regex, replacement);
  }

  return filteredResponse;
}

/**
 * Get emergency contact for region
 * @param {string} region - User's region
 * @returns {object} Emergency contact information
 */
export function getEmergencyContact(region) {
  return EMERGENCY_CONTACTS[region] || EMERGENCY_CONTACTS["US"];
}

/**
 * Sanitize text for privacy compliance (remove PII/PHI)
 * @param {string} text - Text to sanitize
 * @returns {string} Sanitized text
 */
export function sanitizeForPrivacy(text) {
  let sanitizedText = text;

  for (const exclusion of PRIVACY_EXCLUSIONS) {
    sanitizedText = sanitizedText.replace(exclusion.pattern, `[${exclusion.type.toUpperCase()}_REDACTED]`);
  }

  return sanitizedText;
}