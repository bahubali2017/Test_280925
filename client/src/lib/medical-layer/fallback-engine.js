/**
 * @file Medical response fallback engine with safety disclaimers
 * Phase 9: Medical Safety Guidelines - Fallback handling and disclaimer enforcement
 */

import { filterOverconfidentLanguage } from '../config/safety-rules.js';

/**
 * Fallback response structure for medical safety system
 * @typedef {{
 *   response: string;
 *   type: "emergency" | "general" | "mental_health" | "medication" | "technical_error";
 *   disclaimer: string | null;
 *   disclaimerPack?: { disclaimers: string[]; atdNotices: string[]; };
 *   requiresHumanIntervention: boolean;
 *   recommendedActions: string[];
 *   followUpQuestions?: string[];
 *   emergencyContext?: {
 *     symptom: string;
 *     severity: string;
 *     originalQuery: string;
 *   };
 *   fallbackReason: string;
 * }} FallbackResponse
 */

/**
 * Safety validation result structure
 * @typedef {{
 *   isValid: boolean;
 *   violations: string[];
 *   riskLevel: 'low' | 'medium' | 'high';
 * }} SafetyValidationResult
 */

/**
 * Fallback context structure
 * @typedef {{
 *   originalQuery?: string;
 *   reason: "ai_failure" | "safety_concern" | "ambiguous_input" | "technical_error";
 *   triageLevel?: string;
 *   isEmergency?: boolean;
 *   isMentalHealth?: boolean;
 *   detectedSymptoms?: string[];
 * }} FallbackContext
 */

/**
 * Response processing context structure
 * @typedef {{
 *   triageLevel?: string;
 *   isEmergency?: boolean;
 *   isMentalHealth?: boolean;
 *   detectedSymptoms?: string[];
 * }} ResponseContext
 */

/**
 * Generate context-aware emergency response based on symptoms
 * @param {string} originalQuery - User's original query
 * @param {FallbackContext} _context - Emergency context (unused)
 * @returns {FallbackResponse} Context-specific emergency response
 */
function generateContextAwareEmergencyResponse(originalQuery, _context) {
  const queryLower = originalQuery.toLowerCase();
  
  // Chest pain specific emergency response
  if (queryLower.includes('chest pain') || queryLower.includes('chest hurt') || queryLower.includes('heart pain')) {
    return {
      response: generateChestPainEmergencyResponse(),
      type: "emergency",
      disclaimer: null,
      // PHASE 6.3: Centralized disclaimer source - only UI renders disclaimers
      disclaimerPack: { disclaimers: [], atdNotices: [] },
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
      disclaimer: null,
      // PHASE 6.3: Centralized disclaimer source - only UI renders disclaimers
      disclaimerPack: { disclaimers: [], atdNotices: [] },
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
    disclaimer: null,
    // PHASE 6.3: Centralized disclaimer source - only UI renders disclaimers
    disclaimerPack: { disclaimers: [], atdNotices: [] },
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
 * Generate appropriate fallback response based on context
 * @param {FallbackContext} context - Fallback context
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
      disclaimer: null, // Let medical safety processor handle disclaimers to avoid duplication
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
      disclaimer: null, // Let medical safety processor handle disclaimers to avoid duplication
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
      disclaimer: null,
      // PHASE 6.3: Centralized disclaimer source - only UI renders disclaimers
      disclaimerPack: { disclaimers: [], atdNotices: [] },
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
      disclaimer: null, // Let medical safety processor handle disclaimers to avoid duplication
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
    disclaimer: null, // Let medical safety processor handle disclaimers to avoid duplication
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
 * @param {ResponseContext} context - Response context
 * @returns {string} Safety-compliant response with disclaimers
 */
export function processAIResponseForSafety(aiResponse, context) {
  let processedResponse = aiResponse;
  
  // 1. Filter overconfident language
  processedResponse = filterOverconfidentLanguage(processedResponse);
  
  // 2. Add cautionary language for medical statements
  processedResponse = addCautionaryLanguage(processedResponse);
  
  // 3. Ensure appropriate disclaimer based on context
  selectAppropriateDisclaimer(context);
  
  // 4. Add emergency notice if needed
  let emergencyNotice = "";
  if (context.isEmergency) {
    // PHASE 6.3: Emergency notices without disclaimer injection - UI handles disclaimers
    emergencyNotice = "\n\n🚨 **EMERGENCY NOTICE**: Seek immediate medical attention.";
  } else if (context.isMentalHealth) {
    // PHASE 6.3: Mental health notices without disclaimer injection - UI handles disclaimers
    emergencyNotice = "\n\n💙 **MENTAL HEALTH NOTICE**: Contact crisis support immediately.";
  }
  
  // 5. Combine response with safety elements
  // PHASE 6.3: Removed disclaimer injection - UI handles all disclaimers
  const finalResponse = `${processedResponse}${emergencyNotice}`;
  
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
 * Select appropriate disclaimer pack based on context
 * @param {ResponseContext} context - Response context
 * @returns {{ disclaimers: string[]; atdNotices: string[]; }} Appropriate disclaimer pack from selectDisclaimers()
 */
function selectAppropriateDisclaimer(context) {
  // PHASE 6.3: Return empty pack - UI handles all disclaimers
  if (context.isEmergency) {
    return { disclaimers: [], atdNotices: [] };
  }
  
  if (context.isMentalHealth) {
    return { disclaimers: [], atdNotices: [] };
  }
  
  // PHASE 6.3: Always return empty - UI handles all disclaimers
  return { disclaimers: [], atdNotices: [] };
}

/**
 * Validate response meets safety standards
 * @param {string} response - Response to validate
 * @returns {SafetyValidationResult} Validation result
 */
export function validateResponseSafety(response) {
  /** @type {string[]} */
  const violations = [];
  let riskLevel = /** @type {'low' | 'medium' | 'high'} */ ("low");
  
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
  
  // PHASE 6.3: Validation without disclaimer content injection - UI handles all disclaimers
  // Skip disclaimer presence check as UI handles disclaimer rendering
  /** @type {string[]} */
  const allDisclaimers = [];
  const hasDisclaimer = allDisclaimers.some(disclaimer => 
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
    riskLevel
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
  
  return `${fallback.response}\n\n**Safety Note**: The original response was replaced due to safety concerns.\n\n${fallback.disclaimer || ''}`;
}

/**
 * Check if response requires human review
 * @param {string} response - Response to check
 * @param {ResponseContext} context - Response context
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