/**
 * @file Medical response fallback engine with safety disclaimers
 * Phase 9: Medical Safety Guidelines - Fallback handling and disclaimer enforcement
 */

import { SAFETY_DISCLAIMERS, filterOverconfidentLanguage } from '../config/safety-rules.js';

/**
 * Generate context-aware emergency response based on symptoms
 * @param {string} originalQuery - User's original query
 * @param {object} context - Emergency context
 * @returns {FallbackResponse} Context-specific emergency response
 */
function generateContextAwareEmergencyResponse(originalQuery, context) {
  const queryLower = originalQuery.toLowerCase();
  
  // Chest pain specific emergency response
  if (queryLower.includes('chest pain') || queryLower.includes('chest hurt') || queryLower.includes('heart pain')) {
    return {
      response: generateChestPainEmergencyResponse(),
      type: "emergency",
      disclaimer: SAFETY_DISCLAIMERS.emergency,
      requiresHumanIntervention: true,
      recommendedActions: [
        "Call emergency services (911) immediately if experiencing severe symptoms",
        "Sit down and remain calm",
        "Chew aspirin if not allergic (only if directed by emergency services)",
        "Monitor for worsening symptoms"
      ],
      followUpQuestions: [
        "What are the warning signs for future chest pain episodes?",
        "When should I call 911 again?",
        "How do I properly take aspirin for chest pain emergencies?",
        "What heart attack prevention steps should I know?"
      ],
      emergencyContext: {
        symptom: 'chest_pain',
        severity: 'emergency',
        originalQuery: originalQuery
      },
      fallbackReason: "Chest pain emergency detected"
    };
  }
  
  // Breathing difficulty emergency response
  if (queryLower.includes('can\'t breathe') || queryLower.includes('difficulty breathing') || queryLower.includes('shortness of breath')) {
    return {
      response: generateBreathingEmergencyResponse(),
      type: "emergency", 
      disclaimer: SAFETY_DISCLAIMERS.emergency,
      requiresHumanIntervention: true,
      recommendedActions: [
        "Call emergency services (911) immediately",
        "Sit upright in a comfortable position",
        "Loosen tight clothing",
        "Stay calm and breathe slowly"
      ],
      followUpQuestions: [
        "What breathing techniques can help?",
        "How can I prevent breathing difficulties?",
        "What are the warning signs?",
        "What treatment options exist?"
      ],
      emergencyContext: {
        symptom: 'breathing_difficulty',
        severity: 'emergency',
        originalQuery: originalQuery
      },
      fallbackReason: "Breathing emergency detected"
    };
  }
  
  // Generic emergency fallback for other emergencies
  return {
    response: "I've detected that this may be a medical emergency. I cannot provide adequate guidance for emergency situations.",
    type: "emergency",
    disclaimer: SAFETY_DISCLAIMERS.emergency,
    requiresHumanIntervention: true,
    recommendedActions: [
      "Call emergency services immediately",
      "Seek immediate medical attention",
      "Do not rely on AI assistance for emergency care"
    ],
    followUpQuestions: [
      "What are the warning signs?",
      "How can I get immediate help?",
      "What should I do while waiting for help?"
    ],
    emergencyContext: {
      symptom: 'general_emergency',
      severity: 'emergency',
      originalQuery: originalQuery
    },
    fallbackReason: "Emergency situation detected"
  };
}

/**
 * Generate specific chest pain emergency response with immediate red flags
 * @returns {string} Detailed chest pain emergency guidance
 */
function generateChestPainEmergencyResponse() {
  return `🚨 **CHEST PAIN EMERGENCY DETECTED**

**CALL 911 IMMEDIATELY IF YOU HAVE:**
• Pain radiating to left shoulder, arm, neck, or jaw
• Difficulty breathing or shortness of breath  
• Heart palpitations or irregular heartbeat
• Sweating, nausea, or lightheadedness
• Crushing or pressure sensation in chest

**IMMEDIATE ACTIONS:**
1. **CALL 911 NOW** if experiencing severe symptoms
2. Sit down and rest immediately
3. If conscious and not allergic, chew 1 aspirin (only if emergency services advise)
4. Loosen tight clothing
5. Stay calm and monitor symptoms

⚠️ **This could be a heart attack or other life-threatening condition. Do not wait - seek emergency care immediately.**`;
}

/**
 * Generate specific breathing difficulty emergency response
 * @returns {string} Detailed breathing emergency guidance  
 */
function generateBreathingEmergencyResponse() {
  return `🚨 **BREATHING EMERGENCY DETECTED**

**CALL 911 IMMEDIATELY - This is a medical emergency**

**IMMEDIATE ACTIONS:**
1. **CALL 911 NOW**
2. Sit upright in the most comfortable position
3. Loosen any tight clothing around neck/chest
4. Stay as calm as possible
5. Breathe slowly and deeply if able

**CRITICAL SIGNS:** Difficulty breathing can indicate serious conditions like heart attack, asthma attack, allergic reaction, or pulmonary embolism.

⚠️ **Do not delay emergency care - breathing difficulties require immediate medical attention.**`;
}

/**
 * Fallback response when AI systems fail or provide inadequate responses
 * @typedef {object} FallbackResponse
 * @property {string} response - Fallback response text
 * @property {'general'|'emergency'|'mental_health'|'medication'|'technical_error'} type - Fallback type
 * @property {string} disclaimer - Safety disclaimer text
 * @property {boolean} requiresHumanIntervention - Whether human assistance is needed
 * @property {string[]} recommendedActions - Suggested next steps for user
 * @property {string} fallbackReason - Reason for fallback activation
 */

/**
 * Generate appropriate fallback response based on context
 * @param {object} context - Fallback context
 * @param {string} context.originalQuery - User's original query
 * @param {'ai_failure'|'safety_concern'|'ambiguous_input'|'technical_error'} context.reason - Reason for fallback
 * @param {string} context.triageLevel - Triage level if available
 * @param {boolean} context.isEmergency - Whether emergency was detected
 * @param {boolean} context.isMentalHealth - Whether mental health concern
 * @returns {FallbackResponse} Appropriate fallback response
 */
export function generateFallbackResponse(context) {
  const { originalQuery, reason, triageLevel, isEmergency, isMentalHealth } = context;
  
  // Emergency fallback - highest priority with context-aware responses
  if (isEmergency) {
    return generateContextAwareEmergencyResponse(originalQuery || '', context);
  }
  
  // Mental health crisis fallback
  if (isMentalHealth) {
    return {
      response: "I understand you may be going through a difficult time. Mental health concerns require specialized care that I cannot provide.",
      type: "mental_health",
      disclaimer: SAFETY_DISCLAIMERS.mental_health,
      requiresHumanIntervention: true,
      recommendedActions: [
        "Reach out to a mental health professional",
        "Contact a crisis hotline if needed",
        "Talk to someone you trust",
        "Consider visiting a mental health facility"
      ],
      fallbackReason: "Mental health crisis detected"
    };
  }
  
  // High urgency medical fallback
  if (triageLevel === "URGENT" || triageLevel === "EMERGENCY") {
    return {
      response: "Your symptoms suggest you may need urgent medical attention. I cannot provide adequate guidance for potentially serious conditions.",
      type: "general",
      disclaimer: SAFETY_DISCLAIMERS.general,
      requiresHumanIntervention: true,
      recommendedActions: [
        "Contact your healthcare provider immediately",
        "Visit an urgent care center or emergency room",
        "Monitor your symptoms closely",
        "Seek professional medical evaluation"
      ],
      fallbackReason: "High urgency medical situation"
    };
  }
  
  // AI system failure fallback
  if (reason === "ai_failure" || reason === "technical_error") {
    return {
      response: "I'm experiencing technical difficulties and cannot provide reliable medical guidance at this time.",
      type: "technical_error",
      disclaimer: SAFETY_DISCLAIMERS.fallback,
      requiresHumanIntervention: true,
      recommendedActions: [
        "Try again in a few minutes",
        "Contact your healthcare provider for medical questions",
        "Use other reliable medical resources",
        "Seek professional medical advice if symptoms persist"
      ],
      fallbackReason: "Technical system failure"
    };
  }
  
  // Safety concern fallback
  if (reason === "safety_concern") {
    return {
      response: "I cannot provide appropriate guidance for this medical situation due to safety considerations.",
      type: "general",
      disclaimer: SAFETY_DISCLAIMERS.general,
      requiresHumanIntervention: true,
      recommendedActions: [
        "Consult with a healthcare professional",
        "Provide complete symptom information to your doctor",
        "Seek appropriate medical evaluation",
        "Use established medical resources"
      ],
      fallbackReason: "Safety guidelines prevent AI response"
    };
  }
  
  // Ambiguous input fallback
  return {
    response: "I wasn't able to understand your medical question clearly enough to provide safe guidance.",
    type: "general",
    disclaimer: SAFETY_DISCLAIMERS.general,
    requiresHumanIntervention: false,
    recommendedActions: [
      "Try rephrasing your question with more specific symptoms",
      "Include relevant details like duration and severity",
      "Consult a healthcare provider for complex concerns",
      "Use clear, descriptive language for symptoms"
    ],
    fallbackReason: "Input too ambiguous for safe processing"
  };
}

/**
 * Post-process AI response to ensure safety compliance
 * @param {string} aiResponse - Original AI response
 * @param {object} context - Response context
 * @param {string} context.triageLevel - Triage level
 * @param {boolean} context.isEmergency - Emergency status
 * @param {boolean} context.isMentalHealth - Mental health concern
 * @param {string[]} context.detectedSymptoms - Detected symptoms
 * @returns {string} Safety-compliant response with disclaimers
 */
export function processAIResponseForSafety(aiResponse, context) {
  let processedResponse = aiResponse;
  
  // 1. Filter overconfident language
  processedResponse = filterOverconfidentLanguage(processedResponse);
  
  // 2. Add cautionary language for medical statements
  processedResponse = addCautionaryLanguage(processedResponse);
  
  // 3. Ensure appropriate disclaimer based on context
  const disclaimer = selectAppropriateDisclaimer(context);
  
  // 4. Add emergency notice if needed
  let emergencyNotice = "";
  if (context.isEmergency) {
    emergencyNotice = "\n\n🚨 **EMERGENCY NOTICE**: " + SAFETY_DISCLAIMERS.emergency + "\n";
  } else if (context.isMentalHealth) {
    emergencyNotice = "\n\n💙 **MENTAL HEALTH NOTICE**: " + SAFETY_DISCLAIMERS.mental_health + "\n";
  }
  
  // 5. Combine response with safety elements
  const finalResponse = `${processedResponse}${emergencyNotice}\n\n${disclaimer}`;
  
  return finalResponse;
}

/**
 * Add cautionary language to medical statements
 * @param {string} response - Response text
 * @returns {string} Response with added caution
 */
function addCautionaryLanguage(response) {
  let cautionaryResponse = response;
  
  // Add caution to medical terms and conditions
  const medicalTerms = [
    { term: /\b(infection|pneumonia|bronchitis|flu|cold)\b/gi, replacement: "possible $1" },
    { term: /\b(diagnosis|condition|disease)\b/gi, replacement: "potential $1" },
    { term: /\b(treatment|therapy|medication)\b/gi, replacement: "$1 (as prescribed by your doctor)" },
    { term: /\b(you should|you need to|you must)\b/gi, replacement: "you may want to consider" },
    { term: /\b(this is definitely|certainly|obviously)\b/gi, replacement: "this may be" }
  ];
  
  for (const { term, replacement } of medicalTerms) {
    cautionaryResponse = cautionaryResponse.replace(term, replacement);
  }
  
  return cautionaryResponse;
}

/**
 * Select appropriate disclaimer based on context
 * @param {object} context - Response context
 * @returns {string} Appropriate disclaimer text
 */
function selectAppropriateDisclaimer(context) {
  if (context.isEmergency) {
    return SAFETY_DISCLAIMERS.emergency;
  }
  
  if (context.isMentalHealth) {
    return SAFETY_DISCLAIMERS.mental_health;
  }
  
  // Check if response mentions medication
  if (context.detectedSymptoms?.some(s => s.includes('medication') || s.includes('drug') || s.includes('pill'))) {
    return SAFETY_DISCLAIMERS.medication;
  }
  
  return SAFETY_DISCLAIMERS.general;
}

/**
 * Validate response meets safety standards
 * @param {string} response - Response to validate
 * @returns {{isValid: boolean, violations: string[], riskLevel: 'low'|'medium'|'high'}} Validation result
 */
export function validateResponseSafety(response) {
  const violations = [];
  let riskLevel = "low";
  
  // Check for prohibited diagnostic language
  const prohibitedPhrases = [
    "you have", "you definitely have", "the diagnosis is", "you're suffering from",
    "this is", "take this medication", "don't worry", "it's nothing serious"
  ];
  
  for (const phrase of prohibitedPhrases) {
    if (response.toLowerCase().includes(phrase.toLowerCase())) {
      violations.push(`Contains prohibited diagnostic phrase: "${phrase}"`);
      riskLevel = "high";
    }
  }
  
  // Check for missing disclaimers
  const hasDisclaimer = Object.values(SAFETY_DISCLAIMERS).some(disclaimer => 
    response.includes(disclaimer.substring(0, 20)) // Check first 20 chars of disclaimer
  );
  
  if (!hasDisclaimer) {
    violations.push("Missing required medical disclaimer");
    if (riskLevel === "low") riskLevel = "medium";
  }
  
  // Check for emergency content without proper warnings
  const emergencyKeywords = ["emergency", "911", "call doctor", "seek help"];
  const hasEmergencyContent = emergencyKeywords.some(keyword => 
    response.toLowerCase().includes(keyword)
  );
  
  if (hasEmergencyContent && !response.includes("🚨")) {
    violations.push("Emergency content without proper warning formatting");
    riskLevel = "high";
  }
  
  return {
    isValid: violations.length === 0,
    violations,
    riskLevel: /** @type {'low'|'medium'|'high'} */ (riskLevel)
  };
}

/**
 * Create safe fallback when response validation fails
 * @param {string} _originalResponse - Original response that failed validation
 * @param {string[]} _violations - Validation violations
 * @returns {string} Safe replacement response
 */
export function createSafeFallback(_originalResponse, _violations) {
  const fallback = generateFallbackResponse({
    originalQuery: "Response validation failed",
    reason: "safety_concern",
    triageLevel: "NON_URGENT",
    isEmergency: false,
    isMentalHealth: false
  });
  
  return `${fallback.response}\n\n**Safety Note**: The original response was replaced due to safety concerns.\n\n${fallback.disclaimer}`;
}

/**
 * Check if response requires human review
 * @param {string} response - Response to check
 * @param {object} context - Response context
 * @returns {boolean} Whether human review is required
 */
export function requiresHumanReview(response, context) {
  // Always require human review for emergencies
  if (context.isEmergency || context.isMentalHealth) {
    return true;
  }
  
  // Require review for high-risk medical content
  const highRiskKeywords = [
    "surgery", "hospital", "medication", "prescription", "dosage",
    "treatment plan", "diagnosis", "serious condition"
  ];
  
  return highRiskKeywords.some(keyword => 
    response.toLowerCase().includes(keyword.toLowerCase())
  );
}