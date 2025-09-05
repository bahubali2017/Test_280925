/**
 * @file Regional medical terminology and disclaimer adaptation
 * Phase 8: Localization infrastructure for different regions
 */

/**
 * Regional medical terminology mappings
 * @type {Record<string, Record<string, string[]>>}
 */
export const REGIONAL_TERMINOLOGY = {
  "US": {
    "fever_reducer": ["acetaminophen", "ibuprofen", "aspirin"],
    "emergency_number": ["911"],
    "primary_care": ["primary care physician", "family doctor", "PCP"],
    "specialist_referral": ["see a specialist", "get a referral"],
    "urgent_care": ["urgent care center", "walk-in clinic"],
    "emergency_room": ["emergency room", "ER", "emergency department"]
  },
  "UK": {
    "fever_reducer": ["paracetamol", "ibuprofen"],
    "emergency_number": ["999", "111 for non-emergency"],
    "primary_care": ["GP", "general practitioner", "family doctor"],
    "specialist_referral": ["see a consultant", "get referred"],
    "urgent_care": ["walk-in centre", "urgent care centre"],
    "emergency_room": ["A&E", "accident and emergency", "casualty"]
  },
  "AU": {
    "fever_reducer": ["paracetamol", "ibuprofen"],
    "emergency_number": ["000"],
    "primary_care": ["GP", "general practitioner"],
    "specialist_referral": ["see a specialist", "get a referral"],
    "urgent_care": ["medical centre", "after-hours clinic"],
    "emergency_room": ["emergency department", "ED"]
  },
  "CA": {
    "fever_reducer": ["acetaminophen", "ibuprofen"],
    "emergency_number": ["911"],
    "primary_care": ["family doctor", "GP", "primary care provider"],
    "specialist_referral": ["see a specialist", "get a referral"],
    "urgent_care": ["walk-in clinic", "urgent care centre"],
    "emergency_room": ["emergency room", "ER", "emergency department"]
  },
  "EU": {
    "fever_reducer": ["paracetamol", "ibuprofen"],
    "emergency_number": ["112"],
    "primary_care": ["family doctor", "general practitioner"],
    "specialist_referral": ["see a specialist"],
    "urgent_care": ["medical centre", "urgent care"],
    "emergency_room": ["emergency department", "casualty"]
  }
};

/**
 * Regional medical disclaimers and legal notices
 * @type {Record<string, Record<string, string>>}
 */
export const REGIONAL_DISCLAIMERS = {
  "US": {
    "general": "This information is for educational purposes only and not a substitute for professional medical advice. Consult your healthcare provider for medical concerns. In emergencies, call 911.",
    "emergency": "If this is a medical emergency, call 911 immediately. Do not delay seeking emergency medical care.",
    "medication": "Consult your pharmacist or healthcare provider before taking any medications. Follow FDA guidelines for medication safety.",
    "mental_health": "For mental health crises, call 988 (Suicide & Crisis Lifeline) or 911. You are not alone - help is available.",
    "data_privacy": "Your health information is protected under HIPAA regulations. We do not store personal health information."
  },
  "UK": {
    "general": "This information is for guidance only and not a substitute for professional medical advice. Contact your GP or NHS 111 for medical concerns. For emergencies, call 999.",
    "emergency": "If this is a medical emergency, call 999 immediately. For urgent but non-emergency care, call NHS 111.",
    "medication": "Consult your GP or pharmacist before taking any medications. Follow MHRA guidelines for medication safety.",
    "mental_health": "For mental health support, contact Samaritans (116 123) or your local mental health services. In emergencies, call 999.",
    "data_privacy": "Your information is protected under GDPR and NHS data protection standards."
  },
  "AU": {
    "general": "This information is for educational purposes only. Contact your GP or call 13 HEALTH (13 43 25 84) for medical advice. For emergencies, call 000.",
    "emergency": "If this is a medical emergency, call 000 immediately. Do not delay seeking emergency medical care.",
    "medication": "Consult your GP or pharmacist before taking medications. Follow TGA guidelines for medication safety.",
    "mental_health": "For mental health support, contact Lifeline (13 11 14) or Beyond Blue (1300 22 4636). In emergencies, call 000.",
    "data_privacy": "Your privacy is protected under Australian Privacy Principles and healthcare privacy laws."
  },
  "CA": {
    "general": "This information is educational only and not medical advice. Contact your healthcare provider or call 811 (Health Link) for guidance. For emergencies, call 911.",
    "emergency": "If this is a medical emergency, call 911 immediately. Do not delay seeking emergency medical care.",
    "medication": "Consult your healthcare provider or pharmacist before taking medications. Follow Health Canada guidelines.",
    "mental_health": "For mental health support, contact Crisis Services Canada (1-833-456-4566) or 911 for emergencies.",
    "data_privacy": "Your health information is protected under provincial health information privacy laws."
  },
  "EU": {
    "general": "This information is for educational purposes only. Contact your healthcare provider or local emergency services number 112 for medical concerns.",
    "emergency": "For medical emergencies, call 112 immediately. Follow your country's specific emergency protocols.",
    "medication": "Consult healthcare providers before taking medications. Follow EMA (European Medicines Agency) guidelines where applicable.",
    "mental_health": "Contact local mental health services or emergency services (112) for immediate support.",
    "data_privacy": "Your data is protected under GDPR and local health data protection regulations."
  }
};

/**
 * Cultural symptom description variations and mappings
 * @type {Record<string, string[]>}
 */
export const CULTURAL_SYMPTOM_VARIANTS = {
  // Digestive system
  "abdominal_pain": ["stomach pain", "belly pain", "tummy pain", "gut pain", "wind in belly"],
  "nausea": ["feeling sick", "queasy", "sick to stomach", "bilious"],
  "diarrhea": ["loose stools", "running stomach", "upset tummy", "the runs"],
  
  // Pain descriptions
  "severe_pain": ["excruciating", "unbearable", "terrible", "awful pain", "killing me"],
  "mild_pain": ["slight discomfort", "a bit sore", "tender", "aching"],
  
  // Respiratory
  "shortness_of_breath": ["can't catch breath", "puffed", "winded", "out of breath"],
  "cough": ["tickly cough", "chesty cough", "dry cough", "hacking cough"],
  
  // Mental health
  "anxious": ["worried", "stressed", "on edge", "nervous", "uptight"],
  "depressed": ["low", "down", "blue", "feeling rough", "not right"],
  
  // General
  "tired": ["knackered", "exhausted", "worn out", "done in", "fatigued"],
  "dizzy": ["lightheaded", "woozy", "off balance", "spinning"],
  
  // Children-specific
  "pediatric_fever": ["hot", "burning up", "temperature", "poorly with heat"],
  "pediatric_pain": ["sore", "hurting", "ouch", "poorly"],
  
  // Elderly-specific  
  "geriatric_confusion": ["muddled", "not with it", "mixed up", "vague"],
  "geriatric_weakness": ["no strength", "feeble", "wobbly", "unsteady"]
};

/**
 * Determine user's region from various indicators
 * @param {string} userInput - User's input text
 * @param {string} [ipCountry] - Country from IP geolocation
 * @param {string} [userLocale] - Browser locale setting
 * @returns {string} Detected region code
 */
export function detectUserRegion(userInput, ipCountry = null, userLocale = null) {
  // Priority: explicit mentions > IP country > locale > default
  
  // Check for explicit regional indicators in text
  const regionalIndicators = {
    "US": ["911", "emergency room", "ER", "primary care physician", "PCP", "acetaminophen"],
    "UK": ["999", "111", "NHS", "GP", "A&E", "paracetamol", "casualty", "chemist"],
    "AU": ["000", "GP", "chemist", "paracetamol"],
    "CA": ["911", "Health Link", "family doctor", "acetaminophen"],
    "EU": ["112", "paracetamol"]
  };
  
  for (const [region, indicators] of Object.entries(regionalIndicators)) {
    if (indicators.some(indicator => userInput.toLowerCase().includes(indicator.toLowerCase()))) {
      return region;
    }
  }
  
  // Use IP country if available
  if (ipCountry) {
    const countryToRegion = {
      "US": "US", "USA": "US",
      "GB": "UK", "UK": "UK", "England": "UK", "Scotland": "UK", "Wales": "UK",
      "AU": "AU", "Australia": "AU",
      "CA": "CA", "Canada": "CA",
      "DE": "EU", "FR": "EU", "IT": "EU", "ES": "EU", "NL": "EU", "BE": "EU"
    };
    
    const region = countryToRegion[ipCountry.toUpperCase()];
    if (region) return region;
  }
  
  // Use browser locale as fallback
  if (userLocale) {
    const localeToRegion = {
      "en-US": "US",
      "en-GB": "UK", "en-UK": "UK",
      "en-AU": "AU",
      "en-CA": "CA",
      "de": "EU", "fr": "EU", "es": "EU", "it": "EU", "nl": "EU"
    };
    
    const region = localeToRegion[userLocale];
    if (region) return region;
  }
  
  // Default to US
  return "US";
}

/**
 * Get region-appropriate medical terminology
 * @param {string} region - Detected region
 * @param {string} termCategory - Category of medical term
 * @returns {string[]} Array of region-appropriate terms
 */
export function getRegionalTerminology(region, termCategory) {
  const regionalTerms = REGIONAL_TERMINOLOGY[region];
  if (!regionalTerms || !regionalTerms[termCategory]) {
    // Fallback to US terminology
    return REGIONAL_TERMINOLOGY["US"][termCategory] || [];
  }
  
  return regionalTerms[termCategory];
}

/**
 * Get region-appropriate disclaimer text
 * @param {string} region - Detected region
 * @param {'general'|'emergency'|'medication'|'mental_health'|'data_privacy'} disclaimerType - Type of disclaimer
 * @returns {string} Region-appropriate disclaimer text
 */
export function getRegionalDisclaimer(region, disclaimerType) {
  const regionalDisclaimers = REGIONAL_DISCLAIMERS[region];
  if (!regionalDisclaimers || !regionalDisclaimers[disclaimerType]) {
    // Fallback to US disclaimers
    return REGIONAL_DISCLAIMERS["US"][disclaimerType] || "";
  }
  
  return regionalDisclaimers[disclaimerType];
}

/**
 * Normalize cultural symptom descriptions to standard medical terms
 * @param {string} userInput - User input containing cultural symptom descriptions
 * @param {string} _region - User's region for cultural context (unused)
 * @returns {string} Normalized text with standard medical terminology
 */
export function normalizeCulturalSymptoms(userInput, _region) {
  let normalizedText = userInput;
  
  for (const [standardTerm, variants] of Object.entries(CULTURAL_SYMPTOM_VARIANTS)) {
    for (const variant of variants) {
      const regex = new RegExp(`\\b${variant.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      normalizedText = normalizedText.replace(regex, standardTerm.replace('_', ' '));
    }
  }
  
  return normalizedText;
}

/**
 * Get culturally appropriate response language for a region
 * @param {string} region - User's detected region
 * @param {string} responseType - Type of response (formal, casual, emergency)
 * @returns {object} Language preferences for the region
 */
export function getRegionalLanguagePreferences(region, responseType = "formal") {
  const preferences = {
    "US": {
      "formal": { politeness: "professional", directness: "moderate", formality: "high" },
      "casual": { politeness: "friendly", directness: "high", formality: "moderate" },
      "emergency": { politeness: "direct", directness: "very high", formality: "low" }
    },
    "UK": {
      "formal": { politeness: "polite", directness: "low", formality: "very high" },
      "casual": { politeness: "courteous", directness: "moderate", formality: "high" },
      "emergency": { politeness: "professional", directness: "high", formality: "moderate" }
    },
    "AU": {
      "formal": { politeness: "straightforward", directness: "high", formality: "moderate" },
      "casual": { politeness: "friendly", directness: "very high", formality: "low" },
      "emergency": { politeness: "direct", directness: "very high", formality: "low" }
    },
    "CA": {
      "formal": { politeness: "polite", directness: "moderate", formality: "high" },
      "casual": { politeness: "friendly", directness: "moderate", formality: "moderate" },
      "emergency": { politeness: "direct", directness: "high", formality: "low" }
    },
    "EU": {
      "formal": { politeness: "formal", directness: "low", formality: "very high" },
      "casual": { politeness: "polite", directness: "moderate", formality: "high" },
      "emergency": { politeness: "professional", directness: "high", formality: "moderate" }
    }
  };
  
  return preferences[region]?.[responseType] || preferences["US"][responseType];
}