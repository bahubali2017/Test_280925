/**
 * @file Demographic-aware medical calibrations and risk adjustments
 * Phase 8: Age, sex, and demographic-specific medical logic modifiers
 */

/**
 * Age-based medical risk adjustments and considerations
 * @type {Record<string, {ageRanges: {min: number, max: number}[], riskMultipliers: Record<string, Record<string, number>>, specialConsiderations: Record<string, string[]>}>}
 */
export const AGE_RISK_PROFILES = {
  "cardiovascular": {
    "ageRanges": [
      { min: 0, max: 40 },    // Low risk
      { min: 41, max: 65 },   // Moderate risk  
      { min: 66, max: 120 }   // High risk
    ],
    "riskMultipliers": {
      "chest_pain": { "0-40": 0.5, "41-65": 1.0, "66+": 1.5 },
      "hypertension": { "0-40": 0.3, "41-65": 1.0, "66+": 2.0 },
      "heart_attack": { "0-40": 0.1, "41-65": 1.0, "66+": 3.0 }
    },
    "specialConsiderations": {
      "0-40": ["Consider recreational drug use", "Evaluate for congenital conditions"],
      "41-65": ["Assess cardiovascular risk factors", "Consider stress testing"],
      "66+": ["High index of suspicion", "Consider atypical presentations"]
    }
  },
  "neurological": {
    "ageRanges": [
      { min: 0, max: 50 },
      { min: 51, max: 75 },
      { min: 76, max: 120 }
    ],
    "riskMultipliers": {
      "stroke": { "0-50": 0.2, "51-75": 1.0, "76+": 2.5 },
      "dementia": { "0-50": 0.1, "51-75": 0.5, "76+": 2.0 },
      "seizure": { "0-50": 1.0, "51-75": 1.2, "76+": 1.5 }
    },
    "specialConsiderations": {
      "0-50": ["Consider metabolic causes", "Evaluate for substance use"],
      "51-75": ["Assess vascular risk factors", "Consider degenerative changes"],
      "76+": ["High stroke risk", "Consider medication effects", "Assess cognitive baseline"]
    }
  },
  "mental_health": {
    "ageRanges": [
      { min: 12, max: 25 },   // Adolescent/Young adult
      { min: 26, max: 65 },   // Adult
      { min: 66, max: 120 }   // Elderly
    ],
    "riskMultipliers": {
      "depression": { "12-25": 1.5, "26-65": 1.0, "66+": 1.3 },
      "anxiety": { "12-25": 2.0, "26-65": 1.0, "66+": 0.8 },
      "suicidal_ideation": { "12-25": 2.5, "26-65": 1.0, "66+": 1.8 }
    },
    "specialConsiderations": {
      "12-25": ["Higher suicide risk", "Academic/social stressors", "Identity formation"],
      "26-65": ["Work/family stressors", "Life transitions", "Substance use assessment"],
      "66+": ["Social isolation", "Medical comorbidities", "Medication effects"]
    }
  }
};

/**
 * Sex-based medical considerations and risk adjustments
 * @type {Record<string, Record<'male'|'female'|'other', {riskFactors: string[], symptoms: string[], considerations: string[]}>>}
 */
export const SEX_BASED_CONSIDERATIONS = {
  "cardiovascular": {
    "male": {
      "riskFactors": ["family history", "smoking", "diabetes", "hypertension"],
      "symptoms": ["classic chest pain", "left arm radiation", "jaw pain"],
      "considerations": ["Higher risk after age 45", "Classic presentation more common"]
    },
    "female": {
      "riskFactors": ["diabetes", "hypertension", "family history", "pregnancy complications"],
      "symptoms": ["atypical chest pain", "nausea", "fatigue", "back pain"],
      "considerations": ["Risk increases after menopause", "Atypical presentations common", "Pregnancy-related risks"]
    },
    "other": {
      "riskFactors": ["hormone therapy effects", "baseline medical conditions"],
      "symptoms": ["variable presentation patterns"],
      "considerations": ["Individual risk assessment needed", "Consider hormone effects"]
    }
  },
  "mental_health": {
    "male": {
      "riskFactors": ["social isolation", "substance use", "job stress"],
      "symptoms": ["anger", "irritability", "substance use", "risk-taking"],
      "considerations": ["Less likely to seek help", "Higher suicide completion rate", "Masked depression"]
    },
    "female": {
      "riskFactors": ["hormonal changes", "pregnancy/postpartum", "domestic violence"],
      "symptoms": ["tearfulness", "anxiety", "mood swings", "eating changes"],
      "considerations": ["Hormonal influences", "Perinatal mental health", "Higher anxiety rates"]
    },
    "other": {
      "riskFactors": ["discrimination", "identity stress", "social support"],
      "symptoms": ["anxiety", "depression", "identity concerns"],
      "considerations": ["Unique stressors", "Support system assessment", "Cultural sensitivity"]
    }
  },
  "autoimmune": {
    "male": {
      "riskFactors": ["later onset", "more severe disease"],
      "symptoms": ["joint involvement", "systemic features"],
      "considerations": ["Later diagnosis common", "Different disease patterns"]
    },
    "female": {
      "riskFactors": ["hormonal influences", "pregnancy effects", "earlier onset"],
      "symptoms": ["fatigue", "joint pain", "skin involvement"],
      "considerations": ["Higher prevalence", "Hormonal fluctuations", "Pregnancy planning"]
    },
    "other": {
      "riskFactors": ["individual assessment needed"],
      "symptoms": ["variable presentations"],
      "considerations": ["Personalized approach required"]
    }
  }
};

/**
 * Socioeconomic and cultural risk modifiers
 * @type {Record<string, {indicators: string[], riskAdjustments: Record<string, number>, considerations: string[]}>}
 */
export const SOCIOECONOMIC_MODIFIERS = {
  "low_access": {
    "indicators": ["no insurance", "can't afford", "no transportation", "rural area"],
    "riskAdjustments": {
      "emergency_threshold": 0.8,  // Lower threshold for emergency recommendations
      "urgent_threshold": 0.7,     // More aggressive urgent care recommendations
      "follow_up_intensity": 1.5   // More intensive follow-up recommendations
    },
    "considerations": [
      "Emphasize free/low-cost resources",
      "Provide telemedicine options",
      "Consider transportation barriers",
      "Lower threshold for urgent care recommendations"
    ]
  },
  "high_access": {
    "indicators": ["private insurance", "regular doctor", "specialist care"],
    "riskAdjustments": {
      "emergency_threshold": 1.0,
      "urgent_threshold": 1.0,
      "follow_up_intensity": 1.0
    },
    "considerations": [
      "Coordinate with existing providers",
      "Consider specialist referrals",
      "Emphasize continuity of care"
    ]
  },
  "cultural_barriers": {
    "indicators": ["language barrier", "cultural concerns", "traditional medicine"],
    "riskAdjustments": {
      "communication_clarity": 1.5,  // Increase clarity of communication
      "cultural_sensitivity": 1.5    // Enhanced cultural considerations
    },
    "considerations": [
      "Use culturally appropriate language",
      "Acknowledge traditional healing practices",
      "Provide interpreter resources",
      "Respect cultural beliefs while ensuring safety"
    ]
  }
};

/**
 * Apply demographic-based risk calibration
 * @param {string} condition - Medical condition being assessed
 * @param {number|null} age - Patient age in years
 * @param {'male'|'female'|'other'|null} sex - Patient sex
 * @param {string[]} socioeconomicIndicators - Indicators of socioeconomic status
 * @param {'emergency'|'urgent'|'non_urgent'} baseUrgency - Base urgency level
 * @returns {{adjustedUrgency: 'emergency'|'urgent'|'non_urgent', riskMultiplier: number, considerations: string[], recommendations: string[]}}
 */
export function applyDemographicCalibration(condition, age, sex, socioeconomicIndicators, baseUrgency) {
  let riskMultiplier = 1.0;
  const considerations = [];
  const recommendations = [];
  
  // Age-based adjustments
  if (age !== null && AGE_RISK_PROFILES[condition]) {
    const profile = AGE_RISK_PROFILES[condition];
    
    // Determine age range
    let ageGroup = "41-65"; // default
    if (age <= 40) ageGroup = "0-40";
    else if (age >= 66) ageGroup = "66+";
    else if (age >= 51 && age <= 75) ageGroup = "51-75";
    else if (age >= 76) ageGroup = "76+";
    else if (age >= 12 && age <= 25) ageGroup = "12-25";
    else if (age >= 26 && age <= 65) ageGroup = "26-65";
    
    // Apply risk multipliers for specific conditions
    for (const [, multipliers] of Object.entries(profile.riskMultipliers)) {
      if (multipliers[ageGroup]) {
        riskMultiplier *= multipliers[ageGroup];
        break;
      }
    }
    
    // Add age-specific considerations
    const ageConsiderations = profile.specialConsiderations[ageGroup] || [];
    considerations.push(...ageConsiderations);
  }
  
  // Sex-based adjustments
  if (sex && SEX_BASED_CONSIDERATIONS[condition] && SEX_BASED_CONSIDERATIONS[condition][sex]) {
    const sexProfile = SEX_BASED_CONSIDERATIONS[condition][sex];
    considerations.push(...sexProfile.considerations);
    
    // Add sex-specific recommendations
    recommendations.push(`Consider ${sex}-specific risk factors: ${sexProfile.riskFactors.join(', ')}`);
    if (sexProfile.symptoms.length > 0) {
      recommendations.push(`Watch for ${sex}-typical symptoms: ${sexProfile.symptoms.join(', ')}`);
    }
  }
  
  // Socioeconomic adjustments
  for (const indicator of socioeconomicIndicators) {
    for (const [, config] of Object.entries(SOCIOECONOMIC_MODIFIERS)) {
      if (config.indicators.some(ind => indicator.toLowerCase().includes(ind))) {
        considerations.push(...config.considerations);
        
        // Apply risk adjustments
        if (config.riskAdjustments.emergency_threshold < 1.0 && baseUrgency === "non_urgent") {
          riskMultiplier *= 1.2; // Increase urgency for low-access populations
        }
      }
    }
  }
  
  // Determine adjusted urgency level
  let adjustedUrgency = baseUrgency;
  
  if (riskMultiplier >= 1.5 && baseUrgency === "non_urgent") {
    adjustedUrgency = "urgent";
  } else if (riskMultiplier >= 2.0 && baseUrgency === "urgent") {
    adjustedUrgency = "emergency";
  }
  
  return {
    adjustedUrgency,
    riskMultiplier,
    considerations,
    recommendations
  };
}

/**
 * Get demographic-specific follow-up recommendations
 * @param {number|null} age - Patient age
 * @param {'male'|'female'|'other'|null} sex - Patient sex
 * @param {string} condition - Medical condition
 * @param {string[]} socioeconomicFactors - Socioeconomic indicators
 * @returns {string[]} Demographic-specific recommendations
 */
export function getDemographicFollowUpRecommendations(age, sex, condition, socioeconomicFactors) {
  const recommendations = [];
  
  // Age-specific recommendations
  if (age !== null) {
    if (age < 18) {
      recommendations.push("Pediatric patients require specialized care - consider pediatric emergency services if needed");
    } else if (age >= 65) {
      recommendations.push("Older adults may have atypical symptom presentations - maintain high index of suspicion");
      recommendations.push("Consider medication interactions and multiple comorbidities");
    }
  }
  
  // Sex-specific recommendations
  if (sex === "female" && (condition === "cardiovascular" || condition === "mental_health")) {
    recommendations.push("Consider pregnancy status and hormonal influences on symptoms");
    if (condition === "cardiovascular") {
      recommendations.push("Women may present with atypical cardiac symptoms - consider non-chest pain presentations");
    }
  }
  
  if (sex === "male" && condition === "mental_health") {
    recommendations.push("Men may underreport emotional symptoms - consider indirect indicators of distress");
  }
  
  // Socioeconomic recommendations
  const hasAccessConcerns = socioeconomicFactors.some(factor => 
    ["no insurance", "can't afford", "transportation"].some(indicator => 
      factor.toLowerCase().includes(indicator)
    )
  );
  
  if (hasAccessConcerns) {
    recommendations.push("Consider community health centers, free clinics, or telemedicine options");
    recommendations.push("Provide resource information for low-cost healthcare access");
  }
  
  return recommendations;
}

/**
 * Extract demographic indicators from user input
 * @param {string} userInput - User's input text
 * @returns {{age: number|null, sex: 'male'|'female'|'other'|null, socioeconomicFactors: string[], culturalIndicators: string[]}}
 */
export function extractDemographicIndicators(userInput) {
  const text = userInput.toLowerCase();
  
  // Age extraction
  let age = null;
  const agePatterns = [
    /(?:i am|i'm)\s+(\d+)\s+years?\s+old/i,
    /(?:age|aged)\s+(\d+)/i,
    /(\d+)\s*(?:yo|y\.o\.|year old|years old)/i
  ];
  
  for (const pattern of agePatterns) {
    const match = text.match(pattern);
    if (match) {
      age = parseInt(match[1]);
      break;
    }
  }
  
  // Sex/gender extraction
  /** @type {'male'|'female'|'other'|null} */
  let sex = null;
  if (text.includes("i am a woman") || text.includes("i'm a woman") || text.includes("female")) {
    sex = "female";
  } else if (text.includes("i am a man") || text.includes("i'm a man") || text.includes("male")) {
    sex = "male";
  } else if (text.includes("non-binary") || text.includes("transgender") || text.includes("other gender")) {
    sex = "other";
  }
  
  // Socioeconomic indicators
  const socioeconomicFactors = [];
  const socialIndicators = [
    "no insurance", "uninsured", "can't afford", "no money", "medicaid", "medicare",
    "rural area", "no transportation", "no car", "live alone", "retired", "unemployed",
    "on disability", "food stamps", "housing assistance"
  ];
  
  for (const indicator of socialIndicators) {
    if (text.includes(indicator)) {
      socioeconomicFactors.push(indicator);
    }
  }
  
  // Cultural indicators
  const culturalIndicators = [];
  const culturalMarkers = [
    "english is not my first language", "speak spanish", "speak mandarin", "traditional medicine",
    "home remedies", "cultural beliefs", "religious concerns", "family traditions"
  ];
  
  for (const marker of culturalMarkers) {
    if (text.includes(marker)) {
      culturalIndicators.push(marker);
    }
  }
  
  return {
    age,
    sex,
    socioeconomicFactors,
    culturalIndicators
  };
}