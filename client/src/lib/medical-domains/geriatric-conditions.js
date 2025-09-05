/**
 * @file Geriatric conditions recognition and age-aware triage logic
 * Phase 8: Specialized medical domain for geriatric care
 */

/**
 * Geriatric condition patterns with age-specific considerations
 * @type {Record<string, {patterns: RegExp[], symptoms: string[], riskFactors: string[], complications: string[], followUp: string[], urgencyModifiers: string[]}>}
 */
export const GERIATRIC_CONDITIONS = {
  "falls": {
    patterns: [/fell/i, /fall/i, /tripped/i, /lost.*balance/i, /tumbled/i],
    symptoms: ["bruising", "pain after fall", "difficulty walking", "confusion", "head injury"],
    riskFactors: ["medications", "dizziness", "weakness", "poor vision", "home hazards"],
    complications: ["hip fracture", "head injury", "loss of confidence", "functional decline"],
    urgencyModifiers: ["head trauma", "inability to bear weight", "severe pain"],
    followUp: [
      "Did you hit your head when you fell?",
      "Are you able to walk normally after the fall?",
      "Any new pain, especially in your hip or back?",
      "Have you been having more falls recently?"
    ]
  },
  "confusion": {
    patterns: [/confused/i, /memory.*problems/i, /disoriented/i, /not.*thinking.*clearly/i, /dementia/i],
    symptoms: ["memory loss", "disorientation", "personality changes", "difficulty concentrating", "wandering"],
    riskFactors: ["medications", "infection", "dehydration", "sleep disruption", "new environment"],
    complications: ["safety risks", "functional decline", "social isolation", "caregiver burden"],
    urgencyModifiers: ["sudden onset", "fever", "severe agitation", "safety concerns"],
    followUp: [
      "When did you first notice the confusion?",
      "Has this come on suddenly or gradually?",
      "Any recent changes in medications or health?",
      "Are there any safety concerns at home?"
    ]
  },
  "medication_issues": {
    patterns: [/medication.*problem/i, /side.*effect/i, /drug.*interaction/i, /too.*many.*pills/i],
    symptoms: ["dizziness", "nausea", "confusion", "falls", "new symptoms"],
    riskFactors: ["multiple medications", "multiple doctors", "kidney problems", "liver problems"],
    complications: ["adverse reactions", "drug interactions", "non-adherence", "hospitalization"],
    urgencyModifiers: ["severe reaction", "breathing problems", "chest pain", "loss of consciousness"],
    followUp: [
      "What medications are you currently taking?",
      "Have you started any new medications recently?",
      "Are you seeing multiple doctors who prescribe medications?",
      "Do you use a pill organizer or have help managing medications?"
    ]
  },
  "frailty": {
    patterns: [/weak/i, /frail/i, /losing.*strength/i, /can.*t.*do.*things/i, /declining/i],
    symptoms: ["weakness", "weight loss", "fatigue", "slow walking", "difficulty with activities"],
    riskFactors: ["advanced age", "multiple conditions", "poor nutrition", "social isolation"],
    complications: ["functional decline", "increased falls", "hospitalization", "loss of independence"],
    urgencyModifiers: ["rapid decline", "inability to care for self", "severe weakness"],
    followUp: [
      "How long have you been experiencing this weakness?",
      "Are you having trouble with daily activities like bathing or dressing?",
      "Have you lost weight recently without trying?",
      "Do you have support at home or family nearby?"
    ]
  },
  "multiple_comorbidities": {
    patterns: [/multiple.*conditions/i, /many.*health.*problems/i, /chronic.*diseases/i],
    symptoms: ["multiple symptoms", "frequent appointments", "many medications", "declining health"],
    riskFactors: ["diabetes", "heart disease", "kidney disease", "COPD", "arthritis"],
    complications: ["drug interactions", "treatment conflicts", "functional decline", "frequent hospitalizations"],
    urgencyModifiers: ["worsening of multiple conditions", "new symptoms", "medication conflicts"],
    followUp: [
      "What chronic conditions are you managing?",
      "Are you working with multiple specialists?",
      "How are you managing all your medications?",
      "Have any of your conditions gotten worse recently?"
    ]
  },
  "social_isolation": {
    patterns: [/lonely/i, /isolated/i, /no.*one.*to.*talk.*to/i, /depression/i, /sad/i],
    symptoms: ["loneliness", "depression", "anxiety", "poor self-care", "cognitive decline"],
    riskFactors: ["living alone", "limited mobility", "loss of spouse", "financial constraints"],
    complications: ["mental health decline", "poor medication adherence", "safety risks", "functional decline"],
    urgencyModifiers: ["suicidal thoughts", "severe depression", "self-neglect", "safety concerns"],
    followUp: [
      "Do you live alone or have family nearby?",
      "How often do you get out or see other people?",
      "Are you feeling sad or depressed?",
      "Do you have support for daily activities if needed?"
    ]
  }
};

/**
 * Detect geriatric conditions from user input
 * @param {string} text - User input text (lowercase)
 * @param {number|null} patientAge - Patient's age (optional)
 * @returns {{condition: string|null, symptoms: string[], riskFactors: string[], urgency: 'emergency'|'urgent'|'non_urgent', complications: string[], followUp: string[]}}
 */
export function detectGeriatricConditions(text, patientAge = null) {
  // Only apply geriatric logic for patients 65 and older
  const isGeriatric = patientAge === null || patientAge >= 65;
  
  for (const [conditionName, config] of Object.entries(GERIATRIC_CONDITIONS)) {
    // Check if any pattern matches
    const hasPatternMatch = config.patterns.some(pattern => pattern.test(text));
    
    // Check for symptom combinations
    const symptomMatches = config.symptoms.filter(symptom => 
      text.includes(symptom.toLowerCase())
    );
    
    // Check for risk factors
    const riskFactorMatches = config.riskFactors.filter(factor => 
      text.includes(factor.toLowerCase())
    );
    
    // Check for urgency modifiers
    const urgencyModifiers = config.urgencyModifiers.filter(modifier => 
      text.includes(modifier.toLowerCase())
    );
    
    if (hasPatternMatch || symptomMatches.length >= 1 || riskFactorMatches.length >= 2) {
      // Determine urgency - geriatric patients often need higher level of care
      /** @type {'emergency'|'urgent'|'non_urgent'} */
      let urgency = "non_urgent";
      if (urgencyModifiers.length > 0) {
        urgency = "urgent";
      }
      
      // Special urgent scenarios for geriatric patients
      if (isGeriatric) {
        if (conditionName === "falls" && symptomMatches.includes("head injury")) {
          urgency = "urgent";
        }
        if (conditionName === "confusion" && urgencyModifiers.includes("sudden onset")) {
          urgency = "urgent";
        }
        if (conditionName === "medication_issues" && urgencyModifiers.length > 0) {
          urgency = "urgent";
        }
      }
      
      return {
        condition: conditionName,
        symptoms: symptomMatches,
        riskFactors: riskFactorMatches,
        urgency,
        complications: config.complications,
        followUp: config.followUp
      };
    }
  }
  
  return {
    condition: null,
    symptoms: [],
    riskFactors: [],
    urgency: "non_urgent",
    complications: [],
    followUp: []
  };
}

/**
 * Assess frailty indicators from user input
 * @param {string} text - User input text (lowercase)
 * @returns {{frailtyScore: number, indicators: string[], riskLevel: 'low'|'moderate'|'high'}}
 */
export function assessFrailty(text) {
  const frailtyIndicators = {
    "unintentional weight loss": /weight.*loss/i,
    "exhaustion": /tired|exhausted|no.*energy/i,
    "weakness": /weak|strength.*loss|can.*t.*lift/i,
    "slow walking speed": /walk.*slow|difficulty.*walking|shuffle/i,
    "low physical activity": /not.*active|can.*t.*exercise|sedentary/i
  };
  
  const indicators = [];
  let frailtyScore = 0;
  
  for (const [indicator, pattern] of Object.entries(frailtyIndicators)) {
    if (pattern.test(text)) {
      indicators.push(indicator);
      frailtyScore++;
    }
  }
  
  /** @type {'low'|'moderate'|'high'} */
  let riskLevel = "low";
  if (frailtyScore >= 3) {
    riskLevel = "high";
  } else if (frailtyScore >= 1) {
    riskLevel = "moderate";
  }
  
  return {
    frailtyScore,
    indicators,
    riskLevel
  };
}

/**
 * Get geriatric-specific medication considerations
 * @param {string[]} symptoms - Detected symptoms
 * @param {string[]} riskFactors - Risk factors identified
 * @returns {string[]} Medication considerations
 */
export function getGeriatricMedicationConsiderations(symptoms, riskFactors) {
  const considerations = [];
  
  if (symptoms.includes("dizziness") || symptoms.includes("falls")) {
    considerations.push("Review medications that may cause dizziness or increase fall risk");
  }
  
  if (symptoms.includes("confusion") || symptoms.includes("memory loss")) {
    considerations.push("Evaluate medications with anticholinergic effects");
  }
  
  if (riskFactors.includes("kidney problems")) {
    considerations.push("Adjust medication doses for reduced kidney function");
  }
  
  if (riskFactors.includes("liver problems")) {
    considerations.push("Consider hepatic metabolism changes in older adults");
  }
  
  if (riskFactors.includes("multiple medications")) {
    considerations.push("Conduct comprehensive medication review for interactions");
  }
  
  return considerations;
}

/**
 * Get geriatric-specific triage recommendations
 * @param {string} condition - Detected geriatric condition
 * @param {string[]} symptoms - Detected symptoms
 * @param {string[]} riskFactors - Risk factors identified
 * @param {number} patientAge - Patient's age
 * @returns {string[]} Triage recommendations
 */
export function getGeriatricTriageRecommendations(condition, symptoms, riskFactors, patientAge) {
  const recommendations = [];
  
  // Falls in elderly - higher risk
  if (condition === "falls") {
    recommendations.push("Falls in older adults require careful evaluation even if no obvious injury");
    if (symptoms.includes("head injury")) {
      recommendations.push("Head injuries in older adults may have delayed complications");
    }
    if (symptoms.includes("hip pain")) {
      recommendations.push("Hip fractures are common after falls in older adults");
    }
  }
  
  // Confusion - could indicate serious underlying issue
  if (condition === "confusion") {
    recommendations.push("New confusion in older adults often indicates underlying medical issue");
    if (symptoms.includes("fever")) {
      recommendations.push("Confusion with fever may indicate serious infection");
    }
    if (riskFactors.includes("medications")) {
      recommendations.push("Medication-related confusion requires urgent review");
    }
  }
  
  // Medication issues - higher risk in elderly
  if (condition === "medication_issues") {
    recommendations.push("Medication problems in older adults can have serious consequences");
    if (symptoms.includes("falls") || symptoms.includes("dizziness")) {
      recommendations.push("Medication-related falls require immediate intervention");
    }
  }
  
  // Frailty - needs comprehensive care
  if (condition === "frailty") {
    recommendations.push("Frailty requires comprehensive geriatric assessment");
    if (symptoms.includes("weight loss")) {
      recommendations.push("Unintentional weight loss in older adults needs evaluation");
    }
  }
  
  // Age-specific considerations
  if (patientAge >= 85) {
    recommendations.push("Patients over 85 may need more intensive monitoring and support");
  }
  
  return recommendations;
}