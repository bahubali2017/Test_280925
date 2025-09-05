/**
 * @file Neurological conditions recognition and triage logic
 * Phase 8: Specialized medical domain for neurological disorders
 */

/**
 * Neurological condition patterns and recognition logic
 * @type {Record<string, {patterns: RegExp[], symptoms: string[], urgency: 'emergency'|'urgent'|'non_urgent', redFlags: string[], followUp: string[]}>}
 */
export const NEUROLOGICAL_CONDITIONS = {
  "seizure": {
    patterns: [/seizure/i, /convulsion/i, /epileptic.*fit/i, /grand.*mal/i, /petit.*mal/i],
    symptoms: ["loss of consciousness", "jerking movements", "confusion", "tongue biting", "incontinence"],
    urgency: "emergency",
    redFlags: ["status epilepticus", "prolonged seizure", "first seizure", "head trauma"],
    followUp: [
      "How long did the seizure last?",
      "Was there loss of consciousness or memory gaps?",
      "Any recent head trauma or changes in medication?"
    ]
  },
  "migraine": {
    patterns: [/migraine/i, /severe.*headache/i, /throbbing.*headache/i],
    symptoms: ["severe headache", "nausea", "light sensitivity", "sound sensitivity", "visual aura"],
    urgency: "non_urgent",
    redFlags: ["worst headache of life", "sudden onset", "fever with headache", "neck stiffness"],
    followUp: [
      "Did the headache come on suddenly or gradually?",
      "Any nausea, vomiting, or sensitivity to light?",
      "Have you experienced similar headaches before?"
    ]
  },
  "stroke": {
    patterns: [/stroke/i, /tia/i, /transient.*ischemic/i, /mini.*stroke/i],
    symptoms: ["facial weakness", "arm weakness", "speech problems", "sudden confusion", "vision loss"],
    urgency: "emergency",
    redFlags: ["FAST symptoms", "sudden onset", "speech slurring", "facial drooping"],
    followUp: [
      "When did the symptoms start exactly?",
      "Are you experiencing facial drooping or arm weakness?",
      "Any problems with speech or understanding?"
    ]
  },
  "vertigo": {
    patterns: [/vertigo/i, /dizziness/i, /spinning.*sensation/i, /balance.*problems/i],
    symptoms: ["spinning sensation", "nausea", "balance problems", "hearing changes", "tinnitus"],
    urgency: "non_urgent",
    redFlags: ["sudden hearing loss", "severe headache", "neurological symptoms"],
    followUp: [
      "Does the room feel like it's spinning around you?",
      "Any hearing changes or ringing in your ears?",
      "What triggers or worsens the symptoms?"
    ]
  },
  "neuropathy": {
    patterns: [/neuropathy/i, /nerve.*damage/i, /peripheral.*nerve/i, /numbness.*tingling/i],
    symptoms: ["numbness", "tingling", "burning pain", "weakness", "loss of sensation"],
    urgency: "non_urgent",
    redFlags: ["rapid progression", "severe weakness", "bowel/bladder problems"],
    followUp: [
      "Where exactly are you experiencing numbness or tingling?",
      "Is the sensation constant or intermittent?",
      "Any weakness or difficulty with fine motor tasks?"
    ]
  },
  "neuralgia": {
    patterns: [/neuralgia/i, /trigeminal.*neuralgia/i, /nerve.*pain/i, /sharp.*shooting.*pain/i],
    symptoms: ["sharp pain", "shooting pain", "electric shock sensation", "face pain", "jaw pain"],
    urgency: "urgent",
    redFlags: ["severe pain", "medication ineffective", "facial weakness"],
    followUp: [
      "Can you describe the exact nature of the pain?",
      "What triggers the pain episodes?",
      "How long do the pain episodes typically last?"
    ]
  }
};

/**
 * Detect neurological conditions from user input
 * @param {string} text - User input text (lowercase)
 * @returns {{condition: string|null, symptoms: string[], urgency: 'emergency'|'urgent'|'non_urgent', redFlags: string[], followUp: string[]}}
 */
export function detectNeurologicalConditions(text) {
  for (const [conditionName, config] of Object.entries(NEUROLOGICAL_CONDITIONS)) {
    // Check if any pattern matches
    const hasPatternMatch = config.patterns.some(pattern => pattern.test(text));
    
    // Check for symptom combinations
    const symptomMatches = config.symptoms.filter(symptom => 
      text.includes(symptom.toLowerCase())
    );
    
    // Check for red flags
    const redFlagMatches = config.redFlags.filter(flag => 
      text.includes(flag.toLowerCase())
    );
    
    if (hasPatternMatch || symptomMatches.length >= 2 || redFlagMatches.length > 0) {
      return {
        condition: conditionName,
        symptoms: symptomMatches,
        urgency: redFlagMatches.length > 0 ? "emergency" : config.urgency,
        redFlags: redFlagMatches,
        followUp: config.followUp
      };
    }
  }
  
  return {
    condition: null,
    symptoms: [],
    urgency: "non_urgent",
    redFlags: [],
    followUp: []
  };
}

/**
 * Apply FAST stroke assessment
 * @param {string} text - User input text (lowercase)
 * @returns {{isFastPositive: boolean, fastComponents: string[], urgency: 'emergency'|'urgent'|'non_urgent'}}
 */
export function assessFastCriteria(text) {
  const fastComponents = [];
  let isFastPositive = false;
  
  // F - Face drooping
  if (text.includes("face") && (text.includes("droop") || text.includes("asymmetric") || text.includes("lopsided"))) {
    fastComponents.push("Face drooping detected");
    isFastPositive = true;
  }
  
  // A - Arm weakness
  if ((text.includes("arm") || text.includes("hand")) && (text.includes("weak") || text.includes("numb") || text.includes("can't move"))) {
    fastComponents.push("Arm weakness detected");
    isFastPositive = true;
  }
  
  // S - Speech problems
  if (text.includes("speech") && (text.includes("slurred") || text.includes("garbled") || text.includes("can't speak"))) {
    fastComponents.push("Speech problems detected");
    isFastPositive = true;
  }
  
  // T - Time is critical
  if (text.includes("sudden") || text.includes("all of a sudden") || text.includes("came on quickly")) {
    fastComponents.push("Sudden onset - time critical");
    isFastPositive = true;
  }
  
  return {
    isFastPositive,
    fastComponents,
    urgency: isFastPositive ? "emergency" : "non_urgent"
  };
}

/**
 * Get neurological-specific triage recommendations
 * @param {string} condition - Detected neurological condition
 * @param {string[]} symptoms - Detected symptoms
 * @param {string[]} redFlags - Detected red flags
 * @returns {string[]} Triage recommendations
 */
export function getNeurologicalTriageRecommendations(condition, symptoms, redFlags) {
  const recommendations = [];
  
  // Emergency conditions
  if (condition === "seizure") {
    recommendations.push("Seizures require immediate medical evaluation");
    if (redFlags.includes("first seizure")) {
      recommendations.push("First-time seizures need urgent neurological assessment");
    }
  }
  
  if (condition === "stroke") {
    recommendations.push("Call emergency services immediately - stroke is a medical emergency");
    recommendations.push("Time is critical - every minute counts for stroke treatment");
  }
  
  // Urgent conditions with specific guidance
  if (condition === "migraine" && redFlags.length > 0) {
    recommendations.push("Red flag headache symptoms require urgent evaluation");
    if (redFlags.includes("worst headache of life")) {
      recommendations.push("'Worst headache of life' may indicate serious underlying condition");
    }
  }
  
  if (condition === "neuralgia") {
    recommendations.push("Severe nerve pain may require specialized neurological care");
    if (symptoms.includes("facial weakness")) {
      recommendations.push("Facial weakness with pain requires urgent assessment");
    }
  }
  
  return recommendations;
}