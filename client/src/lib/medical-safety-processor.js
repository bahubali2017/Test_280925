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
 * Process user input through complete medical safety pipeline
 * @param {string} userInput - User's medical query
 * @param {object} options - Processing options
 * @param {string} [options.region='US'] - User's region for emergency contacts
 * @param {object} [options.demographics] - User demographics
 * @param {string} [options.sessionId] - Session identifier
 * @returns {Promise<object>} Safety processing result
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
    const triageResult = performEnhancedTriage(context);
    
    // 2. EMERGENCY DETECTION - Check for emergency situations
    const emergencyDetection = detectEmergency(userInput, region, demographics);
    
    // 3. ATD ROUTING DECISION - Determine if provider referral needed
    const atdRouting = routeToProvider(
      triageResult, 
      emergencyDetection, 
      userInput, 
      { ...demographics, sessionId }
    );
    
    // 4. SAFETY CONTEXT COMPILATION
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
    const fallbackResponse = shouldBlock ? generateFallbackResponse({
      originalQuery: userInput,
      reason: emergencyDetection.isEmergency ? 'safety_concern' : 'ambiguous_input',
      triageLevel: triageResult.level,
      isEmergency: emergencyDetection.isEmergency,
      isMentalHealth: triageResult.mentalHealthCrisis
    }) : null;
    
    return {
      safetyContext,
      safetyNotices,
      triageWarning,
      fallbackResponse,
      shouldBlockAI: shouldBlock,
      requiresHumanReview: atdRouting.routeToProvider,
      emergencyProtocol: triageResult.emergencyProtocol || emergencyDetection.isEmergency,
      routeToProvider: atdRouting.routeToProvider,
      priorityScore: atdRouting.priorityScore
    };
    
  } catch (error) {
    console.error('Medical safety processing error:', error);
    
    // Safe fallback on processing errors
    return {
      safetyContext: { userInput: sanitizeForPrivacy(userInput), region },
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
        isMentalHealth: false
      }),
      shouldBlockAI: true,
      requiresHumanReview: true,
      emergencyProtocol: false,
      routeToProvider: false,
      priorityScore: 1
    };
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
 * @param {object} safetyContext - Safety context from processMedicalSafety
 * @param {string} [systemPrompt] - System prompt to check for existing disclaimers
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
 * @param {object} safetyContext - Safety context from processMedicalSafety
 * @param {string} [systemPrompt] - System prompt to check for existing disclaimers
 * @returns {string} Safety-processed response with disclaimers
 */
export function postProcessAIResponse(aiResponse, safetyContext, systemPrompt = "") {
  const responseContext = {
    triageLevel: safetyContext.triageResult?.level,
    isEmergency: safetyContext.emergencyDetection?.isEmergency,
    isMentalHealth: safetyContext.triageResult?.mentalHealthCrisis,
    detectedSymptoms: safetyContext.triageResult?.symptomNames || []
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
 * @param {string} [systemPrompt] - System prompt that might contain disclaimers
 * @param {string} [aiResponse] - AI response that might contain disclaimers  
 * @returns {boolean}
 */
function hasRoleBasedDisclaimers(systemPrompt = "", aiResponse = "") {
  if (!AI_FLAGS.ENABLE_ROLE_MODE) return false;
  
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
 * @param {object} safetyContext - Safety processing context
 * @param {string} [systemPrompt] - System prompt to check for existing disclaimers
 * @param {string} [aiResponse] - AI response to check for existing disclaimers
 * @returns {Array} Array of safety notice props
 */
function generateSafetyNotices(safetyContext, systemPrompt = "", aiResponse = "") {
  const notices = [];
  const { emergencyDetection, atdRouting } = safetyContext;
  
  // Emergency notice
  if (emergencyDetection.isEmergency) {
    notices.push({
      type: emergencyDetection.emergencyType === 'mental_health' ? 'mental_health' : 'emergency',
      message: emergencyDetection.emergencyMessage,
      isVisible: true,
      recommendedActions: emergencyDetection.immediateActions.split('\n').filter(Boolean),
      emergencyContacts: emergencyDetection.emergencyContacts
    });
  }
  
  // Provider referral notice
  if (atdRouting.routeToProvider && !emergencyDetection.isEmergency) {
    notices.push({
      type: 'general',
      message: atdRouting.patientGuidance,
      isVisible: true,
      recommendedActions: atdRouting.structuredData.recommendedActions
    });
  }
  
  // General medical disclaimer (add only if role-based disclaimers are not present)
  if (!hasRoleBasedDisclaimers(systemPrompt, aiResponse)) {
    notices.push({
      type: 'general',
      message: '⚠️ This is not a medical diagnosis. Always consult a licensed healthcare provider for medical decisions.',
      isVisible: true
    });
  }
  
  return notices;
}

/**
 * Generate triage warning for UI display
 * @param {object} safetyContext - Safety processing context
 * @returns {object|null} Triage warning props or null
 */
function generateTriageWarning(safetyContext) {
  const { triageResult, emergencyDetection, atdRouting } = safetyContext;
  
  // Only show triage warning for urgent/emergency cases
  if (triageResult.level === 'NON_URGENT' && !emergencyDetection.isEmergency) {
    return null;
  }
  
  return {
    triageLevel: triageResult.level,
    reasons: triageResult.reasons,
    safetyFlags: triageResult.safetyFlags,
    emergencyProtocol: triageResult.emergencyProtocol || emergencyDetection.isEmergency,
    mentalHealthCrisis: triageResult.mentalHealthCrisis,
    recommendedActions: atdRouting.structuredData.recommendedActions,
    emergencyContacts: emergencyDetection.emergencyContacts,
    showActions: true
  };
}

/**
 * Determine if AI response should be blocked in favor of fallback
 * @param {object} safetyContext - Safety processing context
 * @returns {boolean} Whether to block AI and use fallback
 */
function determineIfShouldBlockAI(safetyContext) {
  const { triageResult, emergencyDetection } = safetyContext;
  
  // Block AI for emergencies - use fallback with emergency instructions
  if (emergencyDetection.isEmergency) {
    return true;
  }
  
  // Block AI for high-risk mental health situations
  if (triageResult.mentalHealthCrisis && emergencyDetection.severity === 'critical') {
    return true;
  }
  
  // Block AI if multiple critical safety flags are present
  const criticalFlags = triageResult.safetyFlags?.filter(flag => 
    flag.includes('EMERGENCY') || flag.includes('CRISIS') || flag.includes('SUICIDE')
  ).length || 0;
  
  if (criticalFlags >= 2) {
    return true;
  }
  
  return false;
}

/**
 * Validate that medical safety processing completed successfully
 * @param {object} processingResult - Result from processMedicalSafety
 * @returns {boolean} Whether processing was successful and safe
 */
export function validateSafetyProcessing(processingResult) {
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
 * @param {object} processingResult - Safety processing result
 * @param {string} sessionId - Session identifier
 */
export function logSafetyProcessing(processingResult, sessionId) {
  // Only log non-PII data for analytics
  const logData = {
    timestamp: new Date().toISOString(),
    sessionId: sessionId || 'anonymous',
    triageLevel: processingResult.safetyContext?.triageResult?.level,
    emergencyDetected: processingResult.emergencyProtocol,
    routedToProvider: processingResult.routeToProvider,
    priorityScore: processingResult.priorityScore,
    safetyFlags: processingResult.safetyContext?.triageResult?.safetyFlags?.length || 0,
    aiBlocked: processingResult.shouldBlockAI
  };
  
  // Send to analytics system (implementation depends on analytics backend)
  if (typeof window !== 'undefined' && (/** @type {any} */ (window)).medicalAnalytics) {
    (/** @type {any} */ (window)).medicalAnalytics.logSafetyEvent(logData);
  }
  
  console.log('Medical safety processing completed:', logData);
}