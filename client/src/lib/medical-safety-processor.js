/**
 * @file Medical safety processing integration layer
 * Phase 9: Medical Safety Guidelines - Central safety processing system
 */

import { performEnhancedTriage } from './medical-layer/triage-engine.js';
import { detectEmergency } from './medical-layer/emergency-detector.js';
import { routeToProvider } from './medical-layer/atd-router.js';
import { processAIResponseForSafety, generateFallbackResponse } from './medical-layer/fallback-engine.js';
import { sanitizeForPrivacy } from './config/safety-rules.js';
import { createLayerContext } from './layer-context.js';
import { AI_FLAGS } from '../config/ai-flags.js';

/**
 * @typedef {object} Demographics
 * @property {string} [role] - User role (public, healthcare_professional, etc.)
 */

/**
 * @typedef {object} ProcessingOptions
 * @property {string} [region] - User's region for emergency contacts
 * @property {Demographics} [demographics] - User demographics
 * @property {string} [sessionId] - Session identifier
 */

/**
 * @typedef {object} TriageResult
 * @property {string} level - Triage level (NON_URGENT, URGENT, EMERGENCY)
 * @property {string[]} reasons - Triage reasoning
 * @property {string[]} safetyFlags - Safety flags detected
 * @property {boolean} emergencyProtocol - Whether emergency protocol is active
 * @property {boolean} mentalHealthCrisis - Whether mental health crisis detected
 * @property {string[]} [symptomNames] - Detected symptom names
 */

/**
 * @typedef {object} EmergencyDetection
 * @property {boolean} isEmergency - Whether emergency detected
 * @property {string} [emergencyType] - Type of emergency (mental_health, etc.)
 * @property {string} [emergencyMessage] - Emergency message
 * @property {string} [immediateActions] - Immediate actions needed
 * @property {object[]} [emergencyContacts] - Emergency contact information
 * @property {string} [severity] - Emergency severity level
 */

/**
 * @typedef {object} ATDRouting
 * @property {boolean} routeToProvider - Whether to route to healthcare provider
 * @property {string} [patientGuidance] - Patient guidance message
 * @property {number} [priorityScore] - Priority score for routing
 * @property {object} [structuredData] - Structured routing data
 * @property {string[]} [structuredData.recommendedActions] - Recommended actions
 */

/**
 * @typedef {object} SafetyContext
 * @property {TriageResult} triageResult - Triage assessment result
 * @property {EmergencyDetection} emergencyDetection - Emergency detection result
 * @property {ATDRouting} atdRouting - ATD routing decision
 * @property {Demographics} demographics - User demographics
 * @property {string} region - User's region
 * @property {string} userInput - Sanitized user input
 * @property {string} timestamp - Processing timestamp
 */

/**
 * @typedef {object} SafetyNotice
 * @property {string} type - Notice type (emergency, mental_health, general)
 * @property {string} message - Notice message
 * @property {boolean} isVisible - Whether notice should be visible
 * @property {string[]} [recommendedActions] - Recommended actions
 * @property {object[]} [emergencyContacts] - Emergency contacts
 */

/**
 * @typedef {object} TriageWarning
 * @property {string} triageLevel - Triage level
 * @property {string[]} reasons - Triage reasons
 * @property {string[]} safetyFlags - Safety flags
 * @property {boolean} emergencyProtocol - Emergency protocol status
 * @property {boolean} mentalHealthCrisis - Mental health crisis status
 * @property {string[]} recommendedActions - Recommended actions
 * @property {object[]} emergencyContacts - Emergency contacts
 * @property {boolean} showActions - Whether to show actions
 */

/**
 * @typedef {object} FallbackResponse
 * @property {string} response - Fallback response content
 * @property {string} [reason] - Reason for fallback
 * @property {object} [emergencyContext] - Emergency context
 * @property {string[]} [followUpQuestions] - Follow-up questions
 */

/**
 * @typedef {object} SafetyProcessingResult
 * @property {SafetyContext} safetyContext - Safety processing context
 * @property {SafetyNotice[]} safetyNotices - Generated safety notices
 * @property {TriageWarning|null} triageWarning - Triage warning if applicable
 * @property {FallbackResponse|null} fallbackResponse - Fallback response if AI blocked
 * @property {boolean} shouldBlockAI - Whether AI should be blocked
 * @property {boolean} requiresHumanReview - Whether human review required
 * @property {boolean} emergencyProtocol - Whether emergency protocol active
 * @property {boolean} routeToProvider - Whether to route to provider
 * @property {number} priorityScore - Priority score for processing
 */

/**
 * @typedef {object} ResponseContext
 * @property {string} [triageLevel] - Triage level
 * @property {boolean} [isEmergency] - Whether emergency detected
 * @property {boolean} [isMentalHealth] - Whether mental health crisis
 * @property {string[]} detectedSymptoms - Detected symptoms
 */

/**
 * @typedef {object} SafetyLogData
 * @property {string} timestamp - Processing timestamp
 * @property {string} sessionId - Session identifier
 * @property {string} [triageLevel] - Triage level
 * @property {boolean} emergencyDetected - Whether emergency detected
 * @property {boolean} routedToProvider - Whether routed to provider
 * @property {number} [priorityScore] - Priority score
 * @property {number} safetyFlags - Number of safety flags
 * @property {boolean} aiBlocked - Whether AI was blocked
 */

/**
 * Process user input through complete medical safety pipeline
 * @param {string} userInput - User's medical query
 * @param {ProcessingOptions} [options={}] - Processing options
 * @returns {Promise<SafetyProcessingResult>} Safety processing result
 */
export async function processMedicalSafety(userInput, options = {}) {
  const { region = 'US', demographics = {}, sessionId = null } = options;
  
  // Create medical context for processing
  const context = createLayerContext(userInput);
  if (demographics) {
    context.demographics = demographics;
  }
  
  try {
    // 1. TRIAGE ASSESSMENT - Enhanced triage with safety bias
    /** @type {TriageResult} */
    const triageResult = performEnhancedTriage(context);
    
    // 2. EMERGENCY DETECTION - Check for emergency situations
    /** @type {EmergencyDetection} */
    const emergencyDetection = detectEmergency(userInput, region, demographics);
    
    // 3. ATD ROUTING DECISION - Determine if provider referral needed
    /** @type {ATDRouting} */
    const atdRouting = routeToProvider(
      triageResult, 
      emergencyDetection, 
      userInput, 
      { ...demographics, sessionId }
    );
    
    // 4. SAFETY CONTEXT COMPILATION
    /** @type {SafetyContext} */
    const safetyContext = {
      triageResult,
      emergencyDetection,
      atdRouting,
      demographics,
      region,
      userInput: sanitizeForPrivacy(userInput),
      timestamp: new Date().toISOString()
    };
    
    // 5. GENERATE SAFETY NOTICES AND WARNINGS
    const safetyNotices = generateSafetyNotices(safetyContext);
    const triageWarning = generateTriageWarning(safetyContext);
    
    // 6. DETERMINE PROCESSING OUTCOME
    const shouldBlock = determineIfShouldBlockAI(safetyContext);
    /** @type {FallbackResponse|null} */
    const fallbackResponse = shouldBlock ? generateFallbackResponse({
      originalQuery: userInput,
      reason: emergencyDetection.isEmergency ? 'safety_concern' : 'ambiguous_input',
      triageLevel: triageResult.level,
      isEmergency: emergencyDetection.isEmergency,
      isMentalHealth: triageResult.mentalHealthCrisis,
      existingDisclaimers: [] // Pass empty array to prevent duplication in this path
    }) : null;
    
    /** @type {SafetyProcessingResult} */
    const result = {
      safetyContext,
      safetyNotices,
      triageWarning,
      fallbackResponse,
      shouldBlockAI: shouldBlock,
      requiresHumanReview: atdRouting.routeToProvider,
      emergencyProtocol: triageResult.emergencyProtocol || emergencyDetection.isEmergency,
      routeToProvider: atdRouting.routeToProvider,
      priorityScore: atdRouting.priorityScore || 1
    };
    
    return result;
    
  } catch (error) {
    console.error('Medical safety processing error:', error);
    
    // Safe fallback on processing errors
    /** @type {SafetyProcessingResult} */
    const fallbackResult = {
      safetyContext: { 
        userInput: sanitizeForPrivacy(userInput), 
        region,
        triageResult: { level: 'NON_URGENT', reasons: [], safetyFlags: [], emergencyProtocol: false, mentalHealthCrisis: false },
        emergencyDetection: { isEmergency: false },
        atdRouting: { routeToProvider: false, priorityScore: 1 },
        demographics: demographics || {},
        timestamp: new Date().toISOString()
      },
      safetyNotices: [{
        type: 'general',
        message: 'Unable to perform medical safety assessment. Please consult a healthcare provider.',
        isVisible: true
      }],
      triageWarning: null,
      fallbackResponse: generateFallbackResponse({
        originalQuery: userInput,
        reason: 'technical_error',
        triageLevel: 'NON_URGENT',
        isEmergency: false,
        isMentalHealth: false,
        existingDisclaimers: [] // Pass empty array to prevent duplication in this path
      }),
      shouldBlockAI: true,
      requiresHumanReview: true,
      emergencyProtocol: false,
      routeToProvider: false,
      priorityScore: 1
    };
    
    return fallbackResult;
  }
}

/**
 * Clean stray markers from AI response
 * @param {string} text - Text to clean
 * @returns {string} Cleaned text without stray markers
 */
export function cleanStrayMarkers(text) {
  return text
    .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, " ")   // invisible → space
    .replace(/^[\s]*[•◦●▣*]+/gm, "-")               // bullets → "-"
    .replace(/-\s*[-–]{2,}/g, "-")                  // "- --" → "-"
    .replace(/^\s*[-–]{2,}\s*$/gm, "")              // dash-only lines
    .replace(/\n{3,}/g, "\n\n")                     // normalize extra breaks
    .replace(/[ \t]{2,}/g, " ")                     // collapse long runs, keep one space
    .trimEnd();                                      // only trim end; keep leading spaces/newlines
}

/**
 * Process final response with cleanup and safety processing
 * @param {string} aiOutput - AI response output
 * @param {SafetyContext} safetyContext - Safety context from processMedicalSafety
 * @param {string} [systemPrompt=''] - System prompt to check for existing disclaimers
 * @returns {string} Final processed response
 */
export function processFinalResponse(aiOutput, safetyContext, systemPrompt = "") {
  // Apply safety processing first
  let safeOutput = postProcessAIResponse(aiOutput, safetyContext, systemPrompt);
  // Clean stray markers
  safeOutput = cleanStrayMarkers(safeOutput);
  return safeOutput;
}

/**
 * Post-process AI response through safety filters
 * @param {string} aiResponse - Original AI response
 * @param {SafetyContext} safetyContext - Safety context from processMedicalSafety
 * @param {string} [systemPrompt=''] - System prompt to check for existing disclaimers
 * @returns {string} Safety-processed response with disclaimers
 */
export function postProcessAIResponse(aiResponse, safetyContext, systemPrompt = "") {
  /** @type {ResponseContext} */
  const responseContext = {
    triageLevel: safetyContext.triageResult && safetyContext.triageResult.level ? safetyContext.triageResult.level : undefined,
    isEmergency: safetyContext.emergencyDetection && safetyContext.emergencyDetection.isEmergency ? safetyContext.emergencyDetection.isEmergency : undefined,
    isMentalHealth: safetyContext.triageResult && safetyContext.triageResult.mentalHealthCrisis ? safetyContext.triageResult.mentalHealthCrisis : undefined,
    detectedSymptoms: (safetyContext.triageResult && safetyContext.triageResult.symptomNames) ? safetyContext.triageResult.symptomNames : []
  };
  
  // Process response and check if we need to add general disclaimers
  let processedResponse = processAIResponseForSafety(aiResponse, responseContext);
  
  // If role-based disclaimers are present, avoid adding duplicate general disclaimers
  if (hasRoleBasedDisclaimers(systemPrompt, aiResponse)) {
    // Role-based disclaimers are already in the response/prompt, don't add general ones
    return processedResponse;
  }
  
  return processedResponse;
}

/**
 * Check if role-based disclaimers are enabled and might be already present
 * @param {string} [systemPrompt=''] - System prompt that might contain disclaimers
 * @param {string} [aiResponse=''] - AI response that might contain disclaimers  
 * @returns {boolean} Whether role-based disclaimers are present
 */
function hasRoleBasedDisclaimers(systemPrompt = "", aiResponse = "") {
  if (!AI_FLAGS.ENABLE_ROLE_MODE) return false;
  
  /** @type {string[]} */
  const roleDisclaimerIndicators = [
    "⚠️ Professional reference only",
    "⚠️ Informational purposes only",
    "ROLE POLICY"
  ];
  
  const textToCheck = `${systemPrompt} ${aiResponse}`;
  return roleDisclaimerIndicators.some(indicator => textToCheck.includes(indicator));
}

/**
 * Generate safety notices for UI display
 * @param {SafetyContext} safetyContext - Safety processing context
 * @param {string} [systemPrompt=''] - System prompt to check for existing disclaimers
 * @param {string} [aiResponse=''] - AI response to check for existing disclaimers
 * @returns {SafetyNotice[]} Array of safety notice props
 */
function generateSafetyNotices(safetyContext, systemPrompt = "", aiResponse = "") {
  /** @type {SafetyNotice[]} */
  const notices = [];
  const { emergencyDetection, atdRouting } = safetyContext;
  
  // Emergency notice
  if (emergencyDetection && emergencyDetection.isEmergency) {
    /** @type {SafetyNotice} */
    const emergencyNotice = {
      type: (emergencyDetection.emergencyType === 'mental_health') ? 'mental_health' : 'emergency',
      message: emergencyDetection.emergencyMessage || 'Emergency detected - seek immediate medical attention',
      isVisible: true,
      recommendedActions: emergencyDetection.immediateActions ? emergencyDetection.immediateActions.split('\n').filter(Boolean) : [],
      emergencyContacts: emergencyDetection.emergencyContacts || []
    };
    notices.push(emergencyNotice);
  }
  
  // Provider referral notice
  if (atdRouting && atdRouting.routeToProvider && !(emergencyDetection && emergencyDetection.isEmergency)) {
    /** @type {SafetyNotice} */
    const providerNotice = {
      type: 'general',
      message: atdRouting.patientGuidance || 'Consider consulting a healthcare provider',
      isVisible: true,
      recommendedActions: (atdRouting.structuredData && atdRouting.structuredData.recommendedActions) ? atdRouting.structuredData.recommendedActions : []
    };
    notices.push(providerNotice);
  }
  
  // General medical disclaimer (add only if role-based disclaimers are not present)
  if (!hasRoleBasedDisclaimers(systemPrompt, aiResponse)) {
    /** @type {SafetyNotice} */
    const generalNotice = {
      type: 'general',
      message: '⚠️ This is not a medical diagnosis. Always consult a licensed healthcare provider for medical decisions.',
      isVisible: true
    };
    notices.push(generalNotice);
  }
  
  return notices;
}

/**
 * Generate triage warning for UI display
 * @param {SafetyContext} safetyContext - Safety processing context
 * @returns {TriageWarning|null} Triage warning props or null
 */
function generateTriageWarning(safetyContext) {
  const { triageResult, emergencyDetection, atdRouting } = safetyContext;
  
  // Only show triage warning for urgent/emergency cases
  if (triageResult && triageResult.level === 'NON_URGENT' && !(emergencyDetection && emergencyDetection.isEmergency)) {
    return null;
  }
  
  /** @type {TriageWarning} */
  const warning = {
    triageLevel: triageResult ? triageResult.level : 'UNKNOWN',
    reasons: triageResult ? triageResult.reasons : [],
    safetyFlags: triageResult ? triageResult.safetyFlags : [],
    emergencyProtocol: (triageResult && triageResult.emergencyProtocol) || (emergencyDetection && emergencyDetection.isEmergency) || false,
    mentalHealthCrisis: triageResult ? triageResult.mentalHealthCrisis : false,
    recommendedActions: (atdRouting && atdRouting.structuredData && atdRouting.structuredData.recommendedActions) ? atdRouting.structuredData.recommendedActions : [],
    emergencyContacts: (emergencyDetection && emergencyDetection.emergencyContacts) ? emergencyDetection.emergencyContacts : [],
    showActions: true
  };
  
  return warning;
}

/**
 * Determine if AI response should be blocked in favor of fallback
 * @param {SafetyContext} safetyContext - Safety processing context
 * @returns {boolean} Whether to block AI and use fallback
 */
function determineIfShouldBlockAI(safetyContext) {
  const { triageResult, emergencyDetection } = safetyContext;
  
  // Block AI for emergencies - use fallback with emergency instructions
  if (emergencyDetection && emergencyDetection.isEmergency) {
    return true;
  }
  
  // Block AI for high-risk mental health situations
  if (triageResult && triageResult.mentalHealthCrisis && emergencyDetection && emergencyDetection.severity === 'critical') {
    return true;
  }
  
  // Block AI if multiple critical safety flags are present
  const criticalFlags = (triageResult && triageResult.safetyFlags) ? triageResult.safetyFlags.filter(flag => 
    flag.includes('EMERGENCY') || flag.includes('CRISIS') || flag.includes('SUICIDE')
  ).length : 0;
  
  if (criticalFlags >= 2) {
    return true;
  }
  
  return false;
}

/**
 * Validate that medical safety processing completed successfully
 * @param {SafetyProcessingResult} processingResult - Result from processMedicalSafety
 * @returns {boolean} Whether processing was successful and safe
 */
export function validateSafetyProcessing(processingResult) {
  /** @type {string[]} */
  const required = [
    'safetyContext',
    'safetyNotices',
    'shouldBlockAI',
    'requiresHumanReview',
    'emergencyProtocol',
    'routeToProvider'
  ];
  
  // Check all required fields are present
  const hasRequiredFields = required.every(field => 
    Object.prototype.hasOwnProperty.call(processingResult, field)
  );
  
  if (!hasRequiredFields) {
    console.error('Medical safety processing incomplete - missing required fields');
    return false;
  }
  
  // Validate emergency protocol consistency
  if (processingResult.emergencyProtocol) {
    const hasEmergencyNotice = processingResult.safetyNotices.some(notice => 
      notice.type === 'emergency' || notice.type === 'mental_health'
    );
    
    if (!hasEmergencyNotice) {
      console.error('Emergency protocol active but no emergency notice generated');
      return false;
    }
  }
  
  return true;
}

/**
 * Log medical safety processing for analytics (privacy-compliant)
 * @param {SafetyProcessingResult} processingResult - Safety processing result
 * @param {string} [sessionId] - Session identifier
 */
export function logSafetyProcessing(processingResult, sessionId) {
  // Only log non-PII data for analytics
  /** @type {SafetyLogData} */
  const logData = {
    timestamp: new Date().toISOString(),
    sessionId: sessionId || 'anonymous',
    triageLevel: (processingResult.safetyContext && processingResult.safetyContext.triageResult) ? processingResult.safetyContext.triageResult.level : undefined,
    emergencyDetected: processingResult.emergencyProtocol,
    routedToProvider: processingResult.routeToProvider,
    priorityScore: processingResult.priorityScore,
    safetyFlags: (processingResult.safetyContext && processingResult.safetyContext.triageResult && processingResult.safetyContext.triageResult.safetyFlags) ? processingResult.safetyContext.triageResult.safetyFlags.length : 0,
    aiBlocked: processingResult.shouldBlockAI
  };
  
  // Send to analytics system (implementation depends on analytics backend)
  if (typeof window !== 'undefined' && (/** @type {any} */ (window)).medicalAnalytics) {
    (/** @type {any} */ (window)).medicalAnalytics.logSafetyEvent(logData);
  }
  
  // Analytics logged to medical tracking system
}