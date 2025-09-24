/**
 * @file Enhanced medical triage engine with conservative safety bias
 * Phase 9: Medical Safety Guidelines - Clinical-grade triage with safety-first approach
 */

import { EMERGENCY_SYMPTOMS, URGENT_SYMPTOMS, assessMentalHealthCrisis, applyConservativeBias, isEmergencySymptom } from '../config/safety-rules.js';

/**
 * @type {Record<string, unknown>}
 */
let atd = { red_flags: [] };

/**
 * Initialize ATD conditions - loads asynchronously
 * @returns {Promise<void>}
 */
async function initATDConditions() {
  try {
    const fs = await import('fs');
    const path = 'client/src/rules/atd-conditions.json';
    
    if (fs.existsSync(path)) {
      const content = fs.readFileSync(path, 'utf8');
      atd = JSON.parse(content);
    } else {
      // Fallback ATD conditions for critical symptoms
      atd = {
        red_flags: [
          { pattern: "chest pain", triage: "EMERGENCY", reason: "Chest pain requires immediate evaluation" },
          { pattern: "difficulty breathing", triage: "EMERGENCY", reason: "Breathing difficulty requires immediate evaluation" },
          { pattern: "severe pain", triage: "URGENT", reason: "Severe pain requires urgent evaluation" }
        ]
      };
    }
  } catch {
    // Fallback to minimal red flags if loading fails
    atd = {
      red_flags: [
        { pattern: "chest pain", triage: "EMERGENCY", reason: "Chest pain requires immediate evaluation" },
        { pattern: "difficulty breathing", triage: "EMERGENCY", reason: "Breathing difficulty requires immediate evaluation" }
      ]
    };
  }
}

// Initialize ATD conditions when module loads
initATDConditions().catch(() => {
  // Silent fallback on initialization failure
});

/**
 * Triage level enumeration
 * @typedef {"EMERGENCY" | "URGENT" | "NON_URGENT"} TriageLevel
 */

/**
 * Symptom structure with severity assessment
 * @typedef {{
 *   name: string;
 *   severity: "mild" | "moderate" | "severe" | "emergency";
 *   category: string;
 * }} SymptomWithSeverity
 */

/**
 * Enhanced triage result structure
 * @typedef {{
 *   level: TriageLevel;
 *   reasons: string[];
 *   isHighRisk: boolean;
 *   symptomNames: string[];
 *   severityAssessment: {
 *     emergencyCount: number;
 *     severeCount: number;
 *     moderateCount: number;
 *     totalSymptoms: number;
 *     highestSeverity: string;
 *   };
 *   safetyFlags: string[];
 *   emergencyProtocol: boolean;
 *   mentalHealthCrisis: boolean;
 * }} EnhancedTriageResult
 */

/**
 * Triage summary structure for ATD routing
 * @typedef {{
 *   triageLevel: TriageLevel;
 *   emergencyProtocol: boolean;
 *   mentalHealthCrisis: boolean;
 *   safetyFlags: string[];
 *   flaggedSymptoms: string[];
 *   severityBreakdown: object;
 *   recommendedActions: string[];
 *   riskFactors: string[];
 *   conservativeBias: boolean;
 *   timestamp: string;
 *   inputSanitized: string;
 * }} TriageSummary
 */

/**
 * Red flag structure from ATD conditions
 * @typedef {{
 *   pattern: string;
 *   triage: string;
 *   reason: string;
 * }} RedFlag
 */

/**
 * Enhanced symptom extraction with safety-focused pattern matching
 * @param {string} text - Lowercase user input
 * @returns {SymptomWithSeverity[]} Detected symptoms with severity
 */
function extractSymptomsWithSeverity(text) {
  /** @type {SymptomWithSeverity[]} */
  const symptoms = [];
  
  // Check emergency symptoms first (highest priority)
  for (const emergencySymptom of EMERGENCY_SYMPTOMS) {
    if (text.includes(emergencySymptom.pattern)) {
      symptoms.push({
        name: emergencySymptom.pattern,
        severity: /** @type {"emergency"} */ ('emergency'),
        category: emergencySymptom.category
      });
    }
  }
  
  // Check urgent symptoms
  for (const urgentSymptom of URGENT_SYMPTOMS) {
    if (text.includes(urgentSymptom.pattern)) {
      symptoms.push({
        name: urgentSymptom.pattern,
        severity: /** @type {"severe"} */ ('severe'),
        category: urgentSymptom.category
      });
    }
  }
  
  // Additional symptom patterns with severity assessment
  const symptomPatterns = [
    // Chest symptoms - always treat as serious
    { patterns: ["chest discomfort", "chest tightness", "chest pressure"], severity: /** @type {"severe"} */ ('severe'), category: 'cardiovascular' },
    { patterns: ["mild chest pain"], severity: /** @type {"severe"} */ ('severe'), category: 'cardiovascular' }, // Conservative: even "mild" chest pain is severe
    
    // Breathing symptoms - conservative approach
    { patterns: ["wheezing", "tight chest", "hard to breathe"], severity: 'severe', category: 'respiratory' },
    { patterns: ["cough", "congestion"], severity: 'moderate', category: 'respiratory' },
    
    // Neurological symptoms
    { patterns: ["dizziness", "lightheaded", "dizzy"], severity: 'moderate', category: 'neurological' },
    { patterns: ["headache"], severity: 'moderate', category: 'neurological' },
    { patterns: ["migraine"], severity: 'severe', category: 'neurological' },
    
    // Mental health symptoms - err on side of caution
    { patterns: ["anxious", "anxiety", "worried"], severity: 'moderate', category: 'mental_health' },
    { patterns: ["depressed", "sad", "down"], severity: 'moderate', category: 'mental_health' },
    { patterns: ["panic", "panic attack"], severity: 'severe', category: 'mental_health' },
    
    // Pain symptoms
    { patterns: ["severe pain", "excruciating", "unbearable"], severity: 'emergency', category: 'pain' },
    { patterns: ["sharp pain", "stabbing"], severity: 'severe', category: 'pain' },
    { patterns: ["aching", "sore", "discomfort"], severity: 'moderate', category: 'pain' },
    
    // Fever and infection
    { patterns: ["high fever", "fever over 103", "burning up"], severity: 'severe', category: 'infection' },
    { patterns: ["fever", "temperature", "hot"], severity: 'moderate', category: 'infection' },
    
    // Gastrointestinal
    { patterns: ["severe vomiting", "can't keep food down"], severity: 'severe', category: 'gastrointestinal' },
    { patterns: ["nausea", "stomach ache", "upset stomach"], severity: 'moderate', category: 'gastrointestinal' },
    
    // General symptoms
    { patterns: ["fatigue", "tired", "exhausted"], severity: 'mild', category: 'general' }
  ];
  
  for (const patternGroup of symptomPatterns) {
    for (const pattern of patternGroup.patterns) {
      if (text.includes(pattern)) {
        symptoms.push({
          name: pattern,
          severity: /** @type {"mild"|"moderate"|"severe"|"emergency"} */ (patternGroup.severity),
          category: patternGroup.category
        });
      }
    }
  }
  
  // Remove duplicates by name
  const uniqueSymptoms = symptoms.filter((symptom, index, self) => 
    index === self.findIndex(s => s.name === symptom.name)
  );
  
  return uniqueSymptoms;
}

/**
 * Enhanced triage assessment with conservative safety bias
 * @param {import("../layer-context.js").LayerContext} ctx - Medical context
 * @returns {EnhancedTriageResult} Enhanced triage result with detailed assessment
 */
export function performEnhancedTriage(ctx) {
  const text = ctx.userInput.toLowerCase();
  
  /** @type {string[]} */
  const reasons = [];
  
  /** @type {string[]} */
  const safetyFlags = [];
  
  /** @type {TriageLevel} */
  let level = "NON_URGENT";
  
  // Extract symptoms with severity assessment
  const detectedSymptoms = extractSymptomsWithSeverity(text);
  
  /** @type {string[]} */
  const symptomNames = detectedSymptoms.map(s => s.name);
  
  // Collect normalized symptom names from parser if available
  if (Array.isArray(ctx.symptoms) && ctx.symptoms.length > 0) {
    const parserSymptoms = ctx.symptoms.map(s => String(s.name || "").toLowerCase()).filter(Boolean);
    symptomNames.push(...parserSymptoms);
  }
  
  // 1. EMERGENCY TRIAGE - Check for immediate emergency symptoms
  if (isEmergencySymptom(text)) {
    level = "EMERGENCY";
    reasons.push("Emergency symptoms detected requiring immediate medical attention");
    safetyFlags.push("EMERGENCY_SYMPTOMS_DETECTED");
  }
  
  // 2. MENTAL HEALTH CRISIS ASSESSMENT
  const mentalHealthAssessment = assessMentalHealthCrisis(text);
  if (mentalHealthAssessment.isCrisis) {
    level = "EMERGENCY"; // All mental health crises are treated as emergency
    reasons.push(`Mental health crisis detected: ${mentalHealthAssessment.triggers.join(', ')}`);
    safetyFlags.push("MENTAL_HEALTH_CRISIS");
    if (mentalHealthAssessment.severity === "high") {
      safetyFlags.push("SUICIDE_RISK");
    }
  }
  
  // 3. SEVERITY-BASED ESCALATION
  const emergencySymptoms = detectedSymptoms.filter(s => s.severity === 'emergency');
  const severeSymptoms = detectedSymptoms.filter(s => s.severity === 'severe');
  const moderateSymptoms = detectedSymptoms.filter(s => s.severity === 'moderate');
  
  if (emergencySymptoms.length > 0 && level !== "EMERGENCY") {
    level = "EMERGENCY";
    reasons.push(`Critical symptoms detected: ${emergencySymptoms.map(s => s.name).join(', ')}`);
    safetyFlags.push("CRITICAL_SYMPTOMS");
  } else if (severeSymptoms.length > 0 && level === "NON_URGENT") {
    level = "URGENT";
    reasons.push(`Severe symptoms requiring urgent evaluation: ${severeSymptoms.map(s => s.name).join(', ')}`);
    safetyFlags.push("SEVERE_SYMPTOMS");
  } else if (moderateSymptoms.length >= 2 && level === "NON_URGENT") {
    // Multiple moderate symptoms together escalate to urgent
    level = "URGENT";
    reasons.push(`Multiple concerning symptoms: ${moderateSymptoms.map(s => s.name).join(', ')}`);
    safetyFlags.push("MULTIPLE_SYMPTOMS");
  }
  
  // 4. RED FLAG PATTERN MATCHING (existing ATD logic)
  if (atd && typeof atd === 'object' && 'red_flags' in atd && Array.isArray(atd.red_flags)) {
    for (const rf of /** @type {RedFlag[]} */ (atd.red_flags)) {
      if (text.includes(rf.pattern)) {
        if (rf.triage === "EMERGENCY" && level !== "EMERGENCY") {
          level = "EMERGENCY";
          safetyFlags.push("ATD_RED_FLAG_EMERGENCY");
        } else if (rf.triage === "URGENT" && level === "NON_URGENT") {
          level = "URGENT";
          safetyFlags.push("ATD_RED_FLAG_URGENT");
        }
        reasons.push(rf.reason);
      }
    }
  }
  
  // 5. APPLY CONSERVATIVE BIAS
  const contextData = {
    age: ctx.demographics?.age,
    symptomCount: symptomNames.length,
    hasChestSymptoms: symptomNames.some(s => s.includes('chest')),
    hasBreathingSymptoms: symptomNames.some(s => s.includes('breath') || s.includes('breathing'))
  };
  
  const biasedLevel = applyConservativeBias(level, text, contextData);
  if (biasedLevel !== level) {
    level = /** @type {TriageLevel} */ (biasedLevel);
    reasons.push("Triage level escalated due to conservative safety bias");
    safetyFlags.push("CONSERVATIVE_ESCALATION");
  }
  
  // 6. DEMOGRAPHIC-SPECIFIC ESCALATIONS
  if (ctx.demographics?.age) {
    if (ctx.demographics.age < 18 && level === "NON_URGENT" && symptomNames.length > 0) {
      level = "URGENT";
      reasons.push("Pediatric symptoms require urgent evaluation");
      safetyFlags.push("PEDIATRIC_ESCALATION");
    } else if (ctx.demographics.age >= 65 && level === "NON_URGENT" && symptomNames.length > 1) {
      level = "URGENT";
      reasons.push("Multiple symptoms in elderly patient require urgent evaluation");
      safetyFlags.push("GERIATRIC_ESCALATION");
    }
  }
  
  // 7. SAFETY VALIDATIONS
  const emergencyProtocol = level === "EMERGENCY";
  const mentalHealthCrisis = mentalHealthAssessment.isCrisis;
  
  if (emergencyProtocol) {
    safetyFlags.push("EMERGENCY_PROTOCOL_ACTIVATED");
  }
  
  // Severity assessment summary
  const severityAssessment = {
    emergencyCount: emergencySymptoms.length,
    severeCount: severeSymptoms.length,
    moderateCount: moderateSymptoms.length,
    totalSymptoms: detectedSymptoms.length,
    highestSeverity: emergencySymptoms.length > 0 ? 'emergency' : 
                    severeSymptoms.length > 0 ? 'severe' :
                    moderateSymptoms.length > 0 ? 'moderate' : 'mild'
  };
  
  // Remove duplicates manually to avoid Set spread operator issues
  /** @type {string[]} */
  const uniqueSymptomNames = [];
  for (const name of symptomNames) {
    if (!uniqueSymptomNames.includes(name)) {
      uniqueSymptomNames.push(name);
    }
  }
  
  return {
    level,
    reasons,
    isHighRisk: level === "EMERGENCY" || level === "URGENT",
    symptomNames: uniqueSymptomNames,
    severityAssessment,
    safetyFlags,
    emergencyProtocol,
    mentalHealthCrisis
  };
}

/**
 * Generate safety-focused triage summary for ATD routing
 * @param {EnhancedTriageResult} triageResult - Result from performEnhancedTriage
 * @param {string} userInput - Original user input
 * @returns {TriageSummary} ATD-ready triage summary
 */
export function generateTriageSummary(triageResult, userInput) {
  return {
    triageLevel: triageResult.level,
    emergencyProtocol: triageResult.emergencyProtocol,
    mentalHealthCrisis: triageResult.mentalHealthCrisis,
    safetyFlags: triageResult.safetyFlags,
    flaggedSymptoms: triageResult.symptomNames,
    severityBreakdown: triageResult.severityAssessment,
    recommendedActions: generateRecommendedActions(triageResult),
    riskFactors: triageResult.reasons,
    conservativeBias: false, // Property removed from triageResult but preserved for compatibility
    timestamp: new Date().toISOString(),
    inputSanitized: userInput.length > 200 ? userInput.substring(0, 200) + "..." : userInput
  };
}

/**
 * Generate recommended actions based on triage results
 * @param {EnhancedTriageResult} triageResult - Enhanced triage result
 * @returns {string[]} Array of recommended actions
 */
function generateRecommendedActions(triageResult) {
  /** @type {string[]} */
  const actions = [];
  
  if (triageResult.level === "EMERGENCY") {
    if (triageResult.mentalHealthCrisis) {
      actions.push("Call emergency services or crisis hotline immediately");
      actions.push("Do not leave person alone");
      actions.push("Remove any potential means of self-harm");
    } else {
      actions.push("Call emergency services immediately");
      actions.push("Do not drive yourself to hospital");
      actions.push("Bring list of current medications");
      actions.push("Have someone accompany you if possible");
    }
  } else if (triageResult.level === "URGENT") {
    actions.push("Seek medical attention within 2-4 hours");
    actions.push("Monitor symptoms for worsening");
    actions.push("Prepare list of symptoms and medications");
    actions.push("Consider urgent care or emergency room");
  } else {
    actions.push("Schedule appointment with healthcare provider");
    actions.push("Monitor symptoms and seek care if they worsen");
    actions.push("Document symptom progression");
  }
  
  // Add specific safety actions based on detected symptoms
  if (triageResult.safetyFlags.includes("CHEST_SYMPTOMS")) {
    actions.push("Avoid physical exertion");
    actions.push("Take aspirin if not allergic (chew 325mg)");
  }
  
  if (triageResult.safetyFlags.includes("BREATHING_SYMPTOMS")) {
    actions.push("Sit upright and rest");
    actions.push("Use prescribed inhaler if available");
  }
  
  return actions;
}