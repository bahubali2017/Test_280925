/**
 * @file Autoimmune conditions recognition and triage logic
 * Phase 8: Specialized medical domain for autoimmune disorders
 */

/**
 * Autoimmune condition patterns and recognition logic
 * @type {Record<string, {patterns: RegExp[], symptoms: string[], urgency: 'emergency'|'urgent'|'non_urgent', followUp: string[]}>}
 */
export const AUTOIMMUNE_CONDITIONS = {
  "lupus": {
    patterns: [/systemic.*lupus/i, /\blupus\b/i, /sle\b/i],
    symptoms: ["joint pain", "facial rash", "butterfly rash", "kidney problems", "fatigue"],
    urgency: "urgent",
    followUp: [
      "Are you experiencing joint pain or swelling?",
      "Have you noticed any skin rashes, especially on your face?",
      "Any changes in urination or kidney function?"
    ]
  },
  "rheumatoid_arthritis": {
    patterns: [/rheumatoid.*arthritis/i, /\bra\b/i, /joint.*inflammation/i],
    symptoms: ["joint pain", "morning stiffness", "swollen joints", "symmetric joint involvement"],
    urgency: "non_urgent",
    followUp: [
      "How long does your morning stiffness typically last?",
      "Are the same joints affected on both sides of your body?",
      "Have you noticed any joint deformity or reduced range of motion?"
    ]
  },
  "multiple_sclerosis": {
    patterns: [/multiple.*sclerosis/i, /\bms\b/i, /demyelinating/i],
    symptoms: ["vision problems", "weakness", "numbness", "balance issues", "cognitive changes"],
    urgency: "urgent",
    followUp: [
      "Are you experiencing any vision changes or double vision?",
      "Have you noticed weakness or numbness in your limbs?",
      "Any problems with balance, coordination, or walking?"
    ]
  },
  "inflammatory_bowel_disease": {
    patterns: [/crohn.*disease/i, /ulcerative.*colitis/i, /\bibd\b/i, /inflammatory.*bowel/i],
    symptoms: ["abdominal pain", "diarrhea", "blood in stool", "weight loss", "fatigue"],
    urgency: "urgent",
    followUp: [
      "Are you experiencing persistent abdominal pain or cramping?",
      "Have you noticed blood or mucus in your stool?",
      "Any unexplained weight loss or changes in appetite?"
    ]
  },
  "psoriasis": {
    patterns: [/psoriasis/i, /psoriatic.*arthritis/i, /plaque.*psoriasis/i],
    symptoms: ["skin plaques", "red patches", "scaling", "joint pain", "nail changes"],
    urgency: "non_urgent",
    followUp: [
      "Are you experiencing red, scaly patches on your skin?",
      "Any joint pain or stiffness along with skin symptoms?",
      "Have you noticed changes in your fingernails or toenails?"
    ]
  }
};

/**
 * Detect autoimmune conditions from user input
 * @param {string} text - User input text (lowercase)
 * @returns {{condition: string|null, symptoms: string[], urgency: 'emergency'|'urgent'|'non_urgent', followUp: string[]}}
 */
export function detectAutoimmunConditions(text) {
  for (const [conditionName, config] of Object.entries(AUTOIMMUNE_CONDITIONS)) {
    // Check if any pattern matches
    const hasPatternMatch = config.patterns.some(pattern => pattern.test(text));
    
    // Check for symptom combinations
    const symptomMatches = config.symptoms.filter(symptom => 
      text.includes(symptom.toLowerCase())
    );
    
    if (hasPatternMatch || symptomMatches.length >= 2) {
      return {
        condition: conditionName,
        symptoms: symptomMatches,
        urgency: config.urgency,
        followUp: config.followUp
      };
    }
  }
  
  return {
    condition: null,
    symptoms: [],
    urgency: "non_urgent",
    followUp: []
  };
}

/**
 * Get autoimmune-specific triage recommendations
 * @param {string} condition - Detected autoimmune condition
 * @param {string[]} symptoms - Detected symptoms
 * @returns {string[]} Triage recommendations
 */
export function getAutoimmunTriageRecommendations(condition, symptoms) {
  const recommendations = [];
  
  // Lupus-specific urgent warnings
  if (condition === "lupus") {
    if (symptoms.includes("kidney problems")) {
      recommendations.push("Kidney involvement in lupus requires urgent evaluation");
    }
    if (symptoms.includes("butterfly rash")) {
      recommendations.push("New or worsening facial rash may indicate disease flare");
    }
  }
  
  // MS-specific urgent warnings
  if (condition === "multiple_sclerosis") {
    if (symptoms.includes("vision problems")) {
      recommendations.push("New vision changes in MS require urgent neurological assessment");
    }
    if (symptoms.includes("weakness")) {
      recommendations.push("New weakness may indicate relapse requiring prompt treatment");
    }
  }
  
  // IBD-specific urgent warnings
  if (condition === "inflammatory_bowel_disease") {
    if (symptoms.includes("blood in stool")) {
      recommendations.push("Blood in stool with IBD history requires urgent evaluation");
    }
    if (symptoms.includes("severe abdominal pain")) {
      recommendations.push("Severe abdominal pain may indicate complications requiring urgent care");
    }
  }
  
  return recommendations;
}