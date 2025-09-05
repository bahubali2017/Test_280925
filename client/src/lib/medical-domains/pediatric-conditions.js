/**
 * @file Pediatric conditions recognition and age-aware triage logic
 * Phase 8: Specialized medical domain for pediatric care
 */

/**
 * Age group definitions for pediatric triage
 * @type {Record<string, {minAge: number, maxAge: number, description: string}>}
 */
export const AGE_GROUPS = {
  "neonate": { minAge: 0, maxAge: 0.08, description: "0-28 days" },
  "infant": { minAge: 0.08, maxAge: 1, description: "1 month - 1 year" },
  "toddler": { minAge: 1, maxAge: 3, description: "1-3 years" },
  "preschool": { minAge: 3, maxAge: 6, description: "3-6 years" },
  "school_age": { minAge: 6, maxAge: 12, description: "6-12 years" },
  "adolescent": { minAge: 12, maxAge: 18, description: "12-18 years" }
};

/**
 * Pediatric condition patterns with age-specific urgency modifiers
 * @type {Record<string, {patterns: RegExp[], symptoms: string[], ageModifiers: Record<string, 'emergency'|'urgent'|'non_urgent'>, followUp: string[], redFlags: string[]}>}
 */
export const PEDIATRIC_CONDITIONS = {
  "fever": {
    patterns: [/fever/i, /temperature/i, /hot/i, /burning.*up/i],
    symptoms: ["high temperature", "chills", "flushed", "irritability", "poor feeding"],
    ageModifiers: {
      "neonate": "emergency", // Any fever in neonates is emergency
      "infant": "urgent",     // Fever in infants under 3 months is urgent
      "toddler": "non_urgent",
      "preschool": "non_urgent",
      "school_age": "non_urgent",
      "adolescent": "non_urgent"
    },
    redFlags: ["febrile seizure", "lethargy", "poor feeding", "rash with fever"],
    followUp: [
      "What is the child's age?",
      "What was the highest temperature recorded?",
      "Is the child eating/drinking normally?",
      "Any signs of difficulty breathing or unusual sleepiness?"
    ]
  },
  "respiratory_distress": {
    patterns: [/difficulty.*breathing/i, /can.*t.*breathe/i, /wheezing/i, /cough/i],
    symptoms: ["difficulty breathing", "wheezing", "retractions", "blue lips", "rapid breathing"],
    ageModifiers: {
      "neonate": "emergency",
      "infant": "emergency",
      "toddler": "urgent",
      "preschool": "urgent",
      "school_age": "urgent",
      "adolescent": "urgent"
    },
    redFlags: ["cyanosis", "severe retractions", "inability to speak", "stridor"],
    followUp: [
      "Is the child able to speak in full sentences?",
      "Are you seeing any blue color around the lips or face?",
      "Is the child using extra muscles to breathe?",
      "When did the breathing difficulty start?"
    ]
  },
  "dehydration": {
    patterns: [/dehydration/i, /not.*drinking/i, /dry.*mouth/i, /no.*wet.*diaper/i],
    symptoms: ["poor feeding", "dry mouth", "sunken eyes", "lethargy", "decreased urination"],
    ageModifiers: {
      "neonate": "emergency",
      "infant": "urgent",
      "toddler": "urgent",
      "preschool": "non_urgent",
      "school_age": "non_urgent",
      "adolescent": "non_urgent"
    },
    redFlags: ["sunken fontanelle", "no tears when crying", "severe lethargy"],
    followUp: [
      "How long has the child been refusing fluids?",
      "When was the last wet diaper or urination?",
      "Is the child unusually sleepy or difficult to wake?",
      "Any ongoing vomiting or diarrhea?"
    ]
  },
  "growth_concerns": {
    patterns: [/not.*growing/i, /weight.*loss/i, /failure.*to.*thrive/i, /developmental.*delay/i],
    symptoms: ["poor weight gain", "developmental delays", "feeding difficulties", "short stature"],
    ageModifiers: {
      "neonate": "urgent",
      "infant": "urgent",
      "toddler": "non_urgent",
      "preschool": "non_urgent",
      "school_age": "non_urgent",
      "adolescent": "non_urgent"
    },
    redFlags: ["significant weight loss", "loss of milestones", "feeding refusal"],
    followUp: [
      "What specific growth or developmental concerns do you have?",
      "Has the child lost any previously acquired skills?",
      "Are there feeding difficulties or food refusal?",
      "When was the last pediatric checkup?"
    ]
  },
  "rash": {
    patterns: [/rash/i, /spots/i, /red.*patches/i, /skin.*irritation/i],
    symptoms: ["red spots", "itching", "fever with rash", "spreading rash", "blistering"],
    ageModifiers: {
      "neonate": "urgent",
      "infant": "urgent",
      "toddler": "non_urgent",
      "preschool": "non_urgent",
      "school_age": "non_urgent",
      "adolescent": "non_urgent"
    },
    redFlags: ["fever with petechial rash", "rapidly spreading", "difficulty breathing"],
    followUp: [
      "When did the rash first appear?",
      "Is the rash accompanied by fever?",
      "Is the rash spreading or getting worse?",
      "Any recent new medications or exposures?"
    ]
  }
};

/**
 * Determine age group from user input or age value
 * @param {string} text - User input text
 * @param {number|null} providedAge - Explicitly provided age in years
 * @returns {string|null} Age group identifier
 */
export function determineAgeGroup(text, providedAge = null) {
  if (providedAge !== null) {
    for (const [group, config] of Object.entries(AGE_GROUPS)) {
      if (providedAge >= config.minAge && providedAge <= config.maxAge) {
        return group;
      }
    }
  }
  
  // Pattern-based age detection
  const agePatterns = {
    "neonate": [/newborn/i, /baby.*days.*old/i, /just.*born/i],
    "infant": [/baby/i, /infant/i, /months.*old/i],
    "toddler": [/toddler/i, /2.*year.*old/i, /3.*year.*old/i],
    "preschool": [/preschooler/i, /4.*year.*old/i, /5.*year.*old/i],
    "school_age": [/school.*age/i, /child/i, /kid/i, /\d+.*year.*old/i],
    "adolescent": [/teenager/i, /teen/i, /adolescent/i, /13.*year/i, /14.*year/i, /15.*year/i, /16.*year/i, /17.*year/i]
  };
  
  for (const [group, patterns] of Object.entries(agePatterns)) {
    if (patterns.some(pattern => pattern.test(text))) {
      return group;
    }
  }
  
  return null;
}

/**
 * Detect pediatric conditions with age-aware triage
 * @param {string} text - User input text (lowercase)
 * @param {number|null} childAge - Child's age in years (optional)
 * @returns {{condition: string|null, ageGroup: string|null, symptoms: string[], urgency: 'emergency'|'urgent'|'non_urgent', redFlags: string[], followUp: string[]}}
 */
export function detectPediatricConditions(text, childAge = null) {
  const ageGroup = determineAgeGroup(text, childAge);
  
  for (const [conditionName, config] of Object.entries(PEDIATRIC_CONDITIONS)) {
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
    
    if (hasPatternMatch || symptomMatches.length >= 1 || redFlagMatches.length > 0) {
      // Determine urgency based on age group
      /** @type {'emergency'|'urgent'|'non_urgent'} */
      let urgency = "non_urgent";
      if (ageGroup && config.ageModifiers[ageGroup]) {
        urgency = /** @type {'emergency'|'urgent'|'non_urgent'} */ (config.ageModifiers[ageGroup]);
      }
      
      // Red flags override age-based urgency
      if (redFlagMatches.length > 0) {
        urgency = "emergency";
      }
      
      return {
        condition: conditionName,
        ageGroup,
        symptoms: symptomMatches,
        urgency,
        redFlags: redFlagMatches,
        followUp: config.followUp
      };
    }
  }
  
  return {
    condition: null,
    ageGroup,
    symptoms: [],
    urgency: "non_urgent",
    redFlags: [],
    followUp: []
  };
}

/**
 * Get pediatric-specific vital sign thresholds
 * @param {string} ageGroup - Age group identifier
 * @returns {{heartRate: {normal: string, concerning: string}, temperature: {fever: string, highFever: string}, respiratoryRate: {normal: string, concerning: string}}}
 */
export function getPediatricVitalThresholds(ageGroup) {
  const thresholds = {
    "neonate": {
      heartRate: { normal: "120-160 bpm", concerning: ">180 or <100 bpm" },
      temperature: { fever: ">100.4°F (38°C)", highFever: ">102°F (38.9°C)" },
      respiratoryRate: { normal: "30-60/min", concerning: ">60/min" }
    },
    "infant": {
      heartRate: { normal: "80-140 bpm", concerning: ">160 or <80 bpm" },
      temperature: { fever: ">100.4°F (38°C)", highFever: ">102°F (38.9°C)" },
      respiratoryRate: { normal: "20-40/min", concerning: ">50/min" }
    },
    "toddler": {
      heartRate: { normal: "80-130 bpm", concerning: ">150 or <70 bpm" },
      temperature: { fever: ">100.4°F (38°C)", highFever: ">103°F (39.4°C)" },
      respiratoryRate: { normal: "20-30/min", concerning: ">40/min" }
    },
    "preschool": {
      heartRate: { normal: "80-120 bpm", concerning: ">140 or <70 bpm" },
      temperature: { fever: ">100.4°F (38°C)", highFever: ">103°F (39.4°C)" },
      respiratoryRate: { normal: "20-25/min", concerning: ">35/min" }
    },
    "school_age": {
      heartRate: { normal: "70-110 bpm", concerning: ">130 or <60 bpm" },
      temperature: { fever: ">100.4°F (38°C)", highFever: ">103°F (39.4°C)" },
      respiratoryRate: { normal: "15-20/min", concerning: ">30/min" }
    },
    "adolescent": {
      heartRate: { normal: "60-100 bpm", concerning: ">120 or <50 bpm" },
      temperature: { fever: ">100.4°F (38°C)", highFever: ">103°F (39.4°C)" },
      respiratoryRate: { normal: "12-18/min", concerning: ">25/min" }
    }
  };
  
  return thresholds[ageGroup] || thresholds["school_age"];
}

/**
 * Get pediatric-specific triage recommendations
 * @param {string} condition - Detected pediatric condition
 * @param {string} ageGroup - Age group identifier
 * @param {string[]} symptoms - Detected symptoms
 * @param {string[]} redFlags - Detected red flags
 * @returns {string[]} Triage recommendations
 */
export function getPediatricTriageRecommendations(condition, ageGroup, symptoms, redFlags) {
  const recommendations = [];
  
  // Age-specific fever guidance
  if (condition === "fever") {
    if (ageGroup === "neonate") {
      recommendations.push("Any fever in a newborn (0-28 days) requires immediate emergency evaluation");
    } else if (ageGroup === "infant") {
      recommendations.push("Fever in infants under 3 months requires urgent medical assessment");
    }
    
    if (redFlags.includes("febrile seizure")) {
      recommendations.push("Febrile seizures require immediate medical evaluation");
    }
  }
  
  // Respiratory distress guidance
  if (condition === "respiratory_distress") {
    if (["neonate", "infant"].includes(ageGroup)) {
      recommendations.push("Breathing difficulties in infants are always concerning - seek immediate care");
    }
    
    if (symptoms.includes("blue lips") || redFlags.includes("cyanosis")) {
      recommendations.push("Blue discoloration indicates oxygen deficiency - call emergency services");
    }
  }
  
  // Dehydration guidance
  if (condition === "dehydration") {
    if (["neonate", "infant"].includes(ageGroup)) {
      recommendations.push("Dehydration progresses rapidly in young children - seek urgent care");
    }
    
    if (redFlags.includes("sunken fontanelle")) {
      recommendations.push("Sunken soft spot indicates significant dehydration requiring immediate care");
    }
  }
  
  return recommendations;
}