import { BODY_LOCATIONS } from "./constants.js";
import { makeNegationPredicate } from "./nlp/negation-detector.js";

// (Removed unused helpers/imports to satisfy ESLint)

/**
 * Enhanced symptom and intent parser with duration, condition types, and contextual disambiguation.
 * Implements Phase 1 requirements: duration parsing, condition types, regex + keywords + synonyms,
 * fallback NLP handler, and contextual correction.
 * @param {string} userInput
 * @returns {{ intent: import("./layer-context.js").Intent, symptoms: import("./layer-context.js").Symptom[] }}
 */
export function parseIntent(userInput) {
  const text = String(userInput || "").trim();
  const neg = makeNegationPredicate(text);
  
  // Phase 1: Enhanced parsing with multiple strategies
  const parseResult = enhancedSymptomParsing(text, neg);
  
  return {
    intent: parseResult.intent,
    symptoms: parseResult.symptoms
  };
}

/**
 * Phase 1 Enhanced symptom parsing with multiple analysis layers
 * @param {string} text - User input text
 * @param {Function} neg - Negation predicate function
 * @returns {{ intent: import("./layer-context.js").Intent, symptoms: import("./layer-context.js").Symptom[] }}
 */
function enhancedSymptomParsing(text, neg) {
  const lowerText = text.toLowerCase();
  
  // Phase 1.1: Duration parsing
  const duration = parseDuration(text);
  
  // Phase 1.2: Condition types detection
  const conditionType = detectConditionType(lowerText);
  
  // Phase 1.3: Regex + Keyword + Synonyms engine
  const symptoms = parseSymptoms(text, lowerText, neg, duration);
  
  // Phase 1.4: Intent classification with enhanced confidence
  const intent = classifyIntent(lowerText, symptoms, conditionType);
  
  // Phase 1.5: Contextual correction and disambiguation  
  const correctedSymptoms = applyContextualCorrection(symptoms, intent, text);
  
  return { intent, symptoms: correctedSymptoms };
}

/**
 * Phase 1.1: Duration parsing - extract time references from input
 * @param {string} text - Input text
 * @returns {{ value: number, unit: string, raw: string } | null}
 */
function parseDuration(text) {
  // Duration patterns: "3 days", "2 weeks", "since yesterday", "for hours"
  const durationPatterns = [
    // Numeric + unit: "3 days", "2 weeks", "5 minutes"
    /(\d+)\s*(minute|hour|day|week|month|year)s?/i,
    // Relative: "since yesterday", "for hours"
    /(since\s+)?(yesterday|today|last\s+night|this\s+morning)/i,
    // Vague: "recently", "lately", "ongoing"
    /(recently|lately|ongoing|chronic|persistent)/i
  ];
  
  for (const pattern of durationPatterns) {
    const match = text.match(pattern);
    if (match) {
      const value = parseInt(match[1]) || 1;
      const unit = match[2] || "unknown";
      return { value, unit: unit.toLowerCase(), raw: match[0] };
    }
  }
  
  return null;
}

/**
 * Phase 1.2: Condition types detection - map to medical categories
 * @param {string} lowerText - Lowercase input text
 * @returns {string}
 */
function detectConditionType(lowerText) {
  const conditionIndicators = {
    ACUTE: ["sudden", "sharp", "severe", "intense", "stabbing", "emergency"],
    CHRONIC: ["ongoing", "persistent", "long-term", "months", "years", "chronic"],
    PREVENTIVE: ["prevent", "avoid", "screening", "checkup", "vaccine", "healthy"],
    INFORMATIONAL: ["what is", "how does", "explain", "tell me about", "learn"],
    MEDICATION: ["prescription", "medication", "medicine", "drug", "dosage", "pills"]
  };
  
  for (const [type, keywords] of Object.entries(conditionIndicators)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      return type;
    }
  }
  
  return "GENERAL";
}

/**
 * Phase 1.3: Advanced symptom parsing with regex + keywords + synonyms
 * @param {string} text - Original text
 * @param {string} lowerText - Lowercase text
 * @param {Function} neg - Negation function
 * @param {object | null} duration - Parsed duration object
 * @returns {import("./layer-context.js").Symptom[]}
 */
function parseSymptoms(text, lowerText, neg, duration) {
  /** @type {import("./layer-context.js").Symptom[]} */
  const symptoms = [];
  
  // Enhanced symptom database with synonyms
  const symptomDatabase = {
    "headache": {
      patterns: [/head\s*ache/i, /migraine/i, /head\s*pain/i, /head\s*hurt/i],
      location: /** @type {keyof typeof BODY_LOCATIONS} */ ("HEAD"),
      synonyms: ["migraine", "head pain", "head hurts", "cranial pain"]
    },
    "chest pain": {
      patterns: [/chest\s*pain/i, /chest\s*hurt/i, /heart\s*pain/i, /chest\s*tight/i],
      location: /** @type {keyof typeof BODY_LOCATIONS} */ ("CHEST"), 
      synonyms: ["chest hurts", "heart pain", "chest tightness", "chest discomfort"]
    },
    "stomach pain": {
      patterns: [/stomach\s*pain/i, /belly\s*pain/i, /abdom\w*\s*pain/i, /stomach\s*ache/i],
      location: /** @type {keyof typeof BODY_LOCATIONS} */ ("ABDOMEN"),
      synonyms: ["belly pain", "stomach ache", "abdominal pain", "gut pain"]
    },
    "back pain": {
      patterns: [/back\s*pain/i, /back\s*ache/i, /spine\s*pain/i, /back\s*hurt/i],
      location: /** @type {keyof typeof BODY_LOCATIONS} */ ("UNSPECIFIED"),
      synonyms: ["back ache", "spine pain", "back hurts", "lower back pain"]
    },
    "fatigue": {
      patterns: [/tired/i, /fatigue/i, /exhausted/i, /weak/i, /energy/i],
      location: /** @type {keyof typeof BODY_LOCATIONS} */ ("GENERAL"),
      synonyms: ["tiredness", "exhaustion", "weakness", "low energy"]
    },
    "fever": {
      patterns: [/fever/i, /hot/i, /temperature/i, /burning\s*up/i],
      location: /** @type {keyof typeof BODY_LOCATIONS} */ ("GENERAL"),
      synonyms: ["high temperature", "burning up", "feverish", "hot"]
    },
    "nausea": {
      patterns: [/nausea/i, /nauseous/i, /sick/i, /vomit/i, /throw\s*up/i],
      location: /** @type {keyof typeof BODY_LOCATIONS} */ ("GENERAL"),
      synonyms: ["feel sick", "want to vomit", "queasy", "throw up"]
    }
  };
  
  // Parse each symptom with enhanced matching
  for (const [symptomName, symptomData] of Object.entries(symptomDatabase)) {
    const isPresent = symptomData.patterns.some(pattern => pattern.test(text));
    
    if (isPresent) {
      const symptom = {
        name: symptomName,
        location: symptomData.location,
        negated: neg(symptomName),
        ...(duration && { duration })
      };
      
      symptoms.push(symptom);
    }
  }
  
  // Fallback: look for body part + pain combinations
  if (symptoms.length === 0) {
    symptoms.push(...fallbackSymptomParsing(text, lowerText, neg, duration));
  }
  
  return symptoms;
}


/**
 * Phase 1.4: Fallback NLP handler for unmatched symptoms
 * @param {string} text - Original text
 * @param {string} lowerText - Lowercase text
 * @param {Function} neg - Negation function
 * @param {object | null} duration - Duration object
 * @returns {import("./layer-context.js").Symptom[]}
 */
function fallbackSymptomParsing(text, lowerText, neg, duration) {
  /** @type {import("./layer-context.js").Symptom[]} */
  const fallbackSymptoms = [];
  
  // Look for body parts + descriptors
  const bodyPartPatterns = Object.keys(BODY_LOCATIONS).map(location => ({
    location: /** @type {keyof typeof BODY_LOCATIONS} */ (location),
    pattern: new RegExp(`\\b${location.toLowerCase()}\\b`, 'i')
  }));
  
  for (const bodyPart of bodyPartPatterns) {
    if (bodyPart.pattern.test(text)) {
      // Look for pain/discomfort words near the body part
      const painWords = ["pain", "hurt", "ache", "sore", "tender", "discomfort"];
      const hasPain = painWords.some(word => lowerText.includes(word));
      
      if (hasPain) {
        fallbackSymptoms.push({
          name: `${bodyPart.location.toLowerCase()} pain`,
          location: bodyPart.location,
          negated: neg(`${bodyPart.location.toLowerCase()} pain`),
          ...(duration && { duration })
        });
      }
    }
  }
  
  return fallbackSymptoms;
}

/**
 * Phase 1.4: Enhanced intent classification
 * @param {string} lowerText - Lowercase text
 * @param {import("./layer-context.js").Symptom[]} symptoms - Parsed symptoms
 * @param {string} conditionType - Detected condition type
 * @returns {import("./layer-context.js").Intent}
 */
function classifyIntent(lowerText, symptoms, conditionType) {
  let intentType = "general_inquiry";
  let confidence = 0.3;
  
  // Symptom-based queries
  if (symptoms.length > 0) {
    intentType = "symptom_check";
    confidence = 0.7 + (symptoms.length * 0.1); // More symptoms = higher confidence
  }
  
  // Emergency indicators
  const emergencyWords = ["emergency", "urgent", "serious", "911", "help", "critical"];
  if (emergencyWords.some(word => lowerText.includes(word))) {
    intentType = "emergency";
    confidence = 0.9;
  }
  
  // Information seeking
  const infoWords = ["what is", "tell me", "explain", "how does", "why"];
  if (infoWords.some(phrase => lowerText.includes(phrase))) {
    intentType = "information_request";
    confidence = 0.6;
  }
  
  // Prevention/wellness
  if (conditionType === "PREVENTIVE") {
    intentType = "prevention_inquiry";
    confidence = 0.8;
  }
  
  // Medication queries
  if (conditionType === "MEDICATION") {
    intentType = "medication_inquiry";
    confidence = 0.7;
  }
  
  return { type: intentType, confidence: Math.min(confidence, 0.95) };
}

/**
 * Phase 1.5: Contextual correction and disambiguation
 * @param {import("./layer-context.js").Symptom[]} symptoms - Parsed symptoms
 * @param {import("./layer-context.js").Intent} _intent - Parsed intent (unused)
 * @param {string} _originalText - Original text for context (unused)
 * @returns {import("./layer-context.js").Symptom[]}
 */
function applyContextualCorrection(symptoms, _intent, _originalText) {
  // Remove duplicate symptoms (same name + location)
  const uniqueSymptoms = symptoms.reduce((acc, symptom) => {
    const key = `${symptom.name}:${symptom.location}`;
    if (!acc.some(s => `${s.name}:${s.location}` === key)) {
      acc.push(symptom);
    }
    return acc;
  }, []);
  
  // Normalize locations to ensure they exist in BODY_LOCATIONS
  uniqueSymptoms.forEach(symptom => {
    if (!BODY_LOCATIONS[symptom.location]) {
      symptom.location = "UNSPECIFIED";
    }
    
    // Ensure negated field exists
    if (!("negated" in symptom)) {
      symptom.negated = false;
    }
  });
  
  return uniqueSymptoms;
}