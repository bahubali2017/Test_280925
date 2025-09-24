/**
 * @file Medical AI Assistant API Interface
 * Unified, production-ready interface for communicating with the chat API
 * Features: streaming support, proper error handling, medical safety integration
 */

/* eslint-env browser */
/* global TextDecoder, AbortController, setTimeout */

import { processMedicalSafety, postProcessAIResponse, validateSafetyProcessing } from './medical-safety-processor.js';
import { buildPromptsForQuery } from './prompt-enhancer.js';
// OLD expansion-handler.js imports removed - using new expansion-state.js system
import { 
  setLastExpandable, 
  clearLastExpandable, 
  markPendingExpansion, 
  getExpansionState, 
  isAffirmativeExpansion 
} from './expansion-state.js';
import { buildExpansionPrompt } from './expansion-prompts.js';
import { AI_FLAGS } from '../config/ai-flags.js';
import { isDebug, trace } from './debug-flag.js';

/**
 * @typedef {object} Message
 * @property {string} role - The message role (system, user, assistant)
 * @property {string} content - The message content
 */

/**
 * @typedef {object} MedicalSafetyMetadata
 * @property {boolean} [blocked] - Whether AI was blocked
 * @property {string} [reason] - Blocking reason
 * @property {boolean} [hasWarnings] - Whether there are warnings
 * @property {boolean} [emergencyProtocol] - Whether emergency protocol is active
 */

/**
 * @typedef {object} APIMetadata
 * @property {number} requestTime - Request time in milliseconds
 * @property {string} modelName - Model name used
 * @property {boolean} [isStreaming] - Whether response was streamed
 * @property {MedicalSafetyMetadata} medicalSafety - Medical safety information
 * @property {string} [triageLevel] - Triage level assessment
 * @property {string} [triageWarning] - Triage warning message
 * @property {string[]} [safetyNotices] - Safety notices
 * @property {string[]} [followUpQuestions] - Follow-up questions
 * @property {object} [queryIntent] - Query intent analysis
 * @property {string} [responseMode] - Response mode (concise, detailed, etc.)
 * @property {string} [questionType] - Question type classification
 * @property {boolean} [canExpand] - Whether response can be expanded
 */

/**
 * @typedef {object} APIResponse
 * @property {string} content - The response content
 * @property {APIMetadata} metadata - Response metadata
 */

/**
 * @typedef {object} APIError
 * @property {string} type - Error type (network, api, timeout, validation, abort)
 * @property {string} message - Human-readable error message
 * @property {number} [status] - HTTP status code if available
 * @property {Error} [originalError] - The original error object
 */

/**
 * @typedef {object} Demographics
 * @property {string} [role] - User role (public, healthcare_professional, etc.)
 */

/**
 * @typedef {object} SendMessageOptions
 * @property {AbortSignal} [abortSignal] - Abort signal for cancellation
 * @property {Function} [onStreamingUpdate] - Callback for streaming updates
 * @property {string} [region] - User's region for medical safety processing
 * @property {Demographics} [demographics] - User demographics for safety processing
 * @property {string} [sessionId] - Session identifier
 */

/**
 * @typedef {object} StreamUpdateData
 * @property {boolean} streaming - Whether currently streaming
 * @property {string} fullContent - Full accumulated content
 * @property {object} [metadata] - Optional metadata for final update
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
 * @typedef {object} SafetyResult
 * @property {boolean} shouldBlockAI - Whether AI should be blocked
 * @property {FallbackResponse|null} [fallbackResponse] - Fallback response if blocked
 * @property {object} safetyContext - Safety processing context (using imported SafetyContext type)
 * @property {boolean} [emergencyProtocol] - Whether emergency protocol is active
 * @property {boolean} [routeToProvider] - Whether to route to healthcare provider
 * @property {string} [triageWarning] - Triage warning message
 * @property {string[]} [safetyNotices] - Safety notices
 * @property {boolean} [requiresHumanReview] - Whether human review required
 * @property {number} [priorityScore] - Priority score for processing
 */

/**
 * @typedef {object} FallbackResponse
 * @property {string} response - Fallback response content
 * @property {string} [reason] - Reason for fallback
 * @property {object} [emergencyContext] - Emergency context information
 * @property {string[]} [followUpQuestions] - Follow-up questions
 */

/**
 * @typedef {object} PromptResult
 * @property {string} systemPrompt - Generated system prompt
 * @property {string} questionType - Question type classification
 * @property {string} mode - Response mode
 */

/**
 * @typedef {object} ExpansionPrompt
 * @property {string} systemPrompt - System prompt for expansion
 * @property {string} userPrompt - User prompt for expansion
 */

/**
 * @typedef {object} LastExpandable
 * @property {string} messageId - Message identifier
 * @property {string} questionType - Question type
 * @property {string} query - Original query
 * @property {string} role - User role
 */

/**
 * @typedef {object} ExpansionState
 * @property {LastExpandable} [lastExpandable] - Last expandable message
 */

/**
 * High-risk medical terms that indicate emergencies
 * @type {string[]}
 */
const HIGH_RISK_TERMS = [
  "heart attack", "stroke", "seizure", "suicide", "emergency", 
  "severe bleeding", "unconscious", "not breathing", "overdose", 
  "poison", "dying", "chest pain", "difficulty breathing", "choking",
  "collapsed", "unresponsive", "severe pain", "head trauma", "gunshot"
];

/**
 * Emergency medical disclaimer
 * @type {string}
 */
const EMERGENCY_DISCLAIMER = 
  "⚠️ MEDICAL EMERGENCY: If you're experiencing a medical emergency, please seek immediate medical attention " +
  "by contacting emergency services (911 in the US) or go to your nearest emergency room. " +
  "This AI assistant cannot provide emergency medical care.";

/**
 * Checks if a message contains high-risk medical terms
 * @param {string} message - The message to check
 * @returns {boolean} Whether the message contains high-risk terms
 */
function containsHighRiskTerms(message) {
  if (!message || typeof message !== 'string') return false;
  const lowerCaseMessage = message.toLowerCase();
  return HIGH_RISK_TERMS.some(term => lowerCaseMessage.includes(term));
}

/**
 * Creates a standardized error object
 * @param {string} type - The error type
 * @param {string} message - Human-readable error message
 * @param {object} [details={}] - Additional error details
 * @returns {APIError} Standardized error object
 */
function createAPIError(type, message, details = {}) {
  return {
    type: typeof type === 'string' ? type : 'unknown',
    message: typeof message === 'string' ? message : 'Unknown error occurred',
    ...details
  };
}

/**
 * Type guard to check if error is an abort error
 * @param {unknown} error - Error to check
 * @returns {boolean} Whether error is an AbortError
 */
function isAbortError(error) {
  return error instanceof Error && error.name === 'AbortError';
}

/**
 * Adds appropriate medical disclaimers to response content
 * @param {string} content - The response content
 * @param {boolean} isHighRisk - Whether content is high-risk
 * @returns {string} Content with disclaimers if needed
 */
function addMedicalDisclaimers(content, isHighRisk) {
  if (!content || typeof content !== 'string') return '';
  
  if (isHighRisk) {
    return `${EMERGENCY_DISCLAIMER}\n\n${content}`;
  }
  
  return content;
}

/**
 * @typedef {object} SSEData
 * @property {boolean} [done] - Whether the stream is complete
 * @property {string} [content] - Content chunk
 * @property {string} [text] - Content chunk (alternative format)
 * @property {string} [error] - Error message if any
 * @property {object} [metadata] - Optional metadata
 */

/**
 * Parses Server-Sent Events (SSE) data
 * @param {string} data - Raw SSE data
 * @returns {SSEData|null} Parsed data or null if invalid
 */
function parseSSEData(data) {
  if (!data || typeof data !== 'string') return null;
  
  try {
    // Handle SSE format: "data: {...}"
    if (data.startsWith('data: ')) {
      const jsonStr = data.slice(6).trim();
      if (jsonStr === '[DONE]') return { done: true };
      return JSON.parse(jsonStr);
    }
    
    // Handle direct JSON
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * Processes streaming response from the server
 * @param {ReadableStream} stream - Response stream
 * @param {Function} onUpdate - Callback for content updates
 * @param {AbortSignal} [abortSignal] - Abort signal
 * @returns {Promise<string>} Complete response content
 */
async function processStream(stream, onUpdate, abortSignal) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let fullContent = '';
  let firstChunkReceived = false;
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  
  try {
    while (true) {
      // Check abort signal before each iteration for faster response
      if (abortSignal && abortSignal.aborted) {
        throw new Error('Stream aborted by user');
      }
      
      const { done, value } = await reader.read();
      
      if (done) break;
      
      // Check abort signal after reading data
      if (abortSignal && abortSignal.aborted) {
        throw new Error('Stream aborted by user');
      }
      
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (!line && line !== '') continue; // Only skip completely null/undefined lines, preserve empty strings
        
        // Check abort signal during line processing for immediate response
        if (abortSignal && abortSignal.aborted) {
          throw new Error('Stream aborted by user');
        }
        
        const data = parseSSEData(line);
        if (!data) continue;
        
        if (data.done) {
          /** @type {StreamUpdateData} */
          const updateData = data.metadata ? 
            { streaming: false, fullContent, metadata: data.metadata } :
            { streaming: false, fullContent };
          onUpdate('', updateData);
          
          // TRACE: Stream completion (non-intrusive)
          if (isDebug()) {
            trace('[TRACE] streamComplete', {
              messageId, responseMode: 'streaming', length: fullContent ? fullContent.length : 0
            });
          }
          return fullContent;
        }
        
        // Handle both 'content' and 'text' properties for compatibility
        const chunkContent = data.content || data.text || '';
        if (chunkContent) {
          // TRACE: First chunk received (stream start, non-intrusive)
          if (!firstChunkReceived && isDebug()) {
            trace('[TRACE] streamStart', { messageId, ts: Date.now() });
            firstChunkReceived = true;
          }
          
          fullContent += chunkContent;
          /** @type {StreamUpdateData} */
          const updateData = { streaming: true, fullContent };
          onUpdate(chunkContent, updateData);
        }
        
        if (data.error) {
          throw new Error(data.error);
        }
      }
    }
    
    return fullContent;
  } catch (error) {
    // Handle AbortError as clean cancellation
    if (error instanceof Error && error.name === 'AbortError') {
      console.info('[LLM] Request aborted by user');
      return ''; // Clean exit
    }
    throw error;
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // Reader already released or error releasing
    }
  }
}

// Global AbortController for active streaming requests
/** @type {AbortController|null} */
let activeAbortController = null;

/**
 * Makes API request to the chat endpoint
 * @param {string} endpoint - API endpoint (/api/chat or /api/chat/stream)
 * @param {object} requestBody - Request payload
 * @param {string} [sessionId] - Session ID to include in headers
 * @returns {Promise<Response>} Fetch response
 */
export function makeAPIRequest(endpoint, requestBody, sessionId) {
  // Reset active controller and create new one for this request
  if (activeAbortController) {
    activeAbortController.abort();
  }
  activeAbortController = new AbortController();
  const { signal } = activeAbortController;
  
  /** @type {Record<string, string>} */
  const headers = {
    'Content-Type': 'application/json',
  };
  
  // Add session ID if provided
  if (sessionId) {
    headers['X-Session-Id'] = sessionId;
  }
  
  return fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
    signal,
  });
}

// Global session ID for current active session
/** @type {string|null} */
let currentSessionId = null;

/**
 * Main function to send messages to the AI assistant
 * @param {string} message - User message
 * @param {Message[]} [history=[]] - Conversation history
 * @param {SendMessageOptions} [options={}] - Additional options
 * @returns {Promise<APIResponse>} AI response
 * @throws {APIError} If request fails
 */
export async function sendMessage(message, history = [], options = {}) {
  // Validate input
  if (!message || typeof message !== 'string' || !message.trim()) {
    throw createAPIError('validation', 'Message cannot be empty');
  }

  const {
    onStreamingUpdate,
    region = 'US',
    demographics = {},
    sessionId
  } = options;
  
  // Generate session ID if not provided
  const currentSession = sessionId || `session_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  currentSessionId = currentSession;

  const startTime = Date.now();
  const isHighRisk = containsHighRiskTerms(message);
  const isStreaming = typeof onStreamingUpdate === 'function';

  // AbortController is created automatically in makeAPIRequest

  try {
    // Get user role from demographics or default to public
    const userRole = demographics.role || "public";
    
    // Filter and validate conversation history
    /** @type {Message[]} */
    const conversationHistory = Array.isArray(history) ? history.filter(msg => 
      msg && 
      typeof msg === 'object' && 
      typeof msg.role === 'string' && 
      typeof msg.content === 'string' &&
      msg.content.trim()
    ) : [];

    // CRITICAL: Run medical safety processing FIRST before any AI processing
    const safetyProcessingResult = await processMedicalSafety(message, {
      region,
      demographics,
      sessionId: currentSession
    });
    
    // Convert SafetyProcessingResult to SafetyResult for compatibility
    /** @type {SafetyResult} */
    const safetyResult = {
      shouldBlockAI: safetyProcessingResult.shouldBlockAI,
      fallbackResponse: safetyProcessingResult.fallbackResponse,
      safetyContext: safetyProcessingResult.safetyContext,
      emergencyProtocol: safetyProcessingResult.emergencyProtocol,
      routeToProvider: safetyProcessingResult.routeToProvider,
      triageWarning: safetyProcessingResult.triageWarning && typeof safetyProcessingResult.triageWarning === 'object' 
        ? JSON.stringify(safetyProcessingResult.triageWarning) 
        : safetyProcessingResult.triageWarning ? String(safetyProcessingResult.triageWarning) : undefined,
      safetyNotices: safetyProcessingResult.safetyNotices?.map(notice => 
        typeof notice === 'object' && notice && 'message' in notice ? String(notice.message) : String(notice)
      ) || [],
      requiresHumanReview: safetyProcessingResult.requiresHumanReview,
      priorityScore: safetyProcessingResult.priorityScore
    };

    // If medical safety determines AI should be blocked (emergency/high-risk), return fallback immediately
    if (safetyResult.shouldBlockAI && safetyResult.fallbackResponse) {
      // Extract content as string from fallback response
      const fallback = safetyResult.fallbackResponse;
      const content = typeof fallback === 'string' ? fallback : 
                     (fallback && typeof fallback === 'object' && 'response' in fallback ? 
                      String(fallback.response) : 'Please seek emergency medical care immediately. Call your local emergency services.');
      
      // Track emergency context for follow-up expansion if available
      if (fallback && typeof fallback === 'object' && 'emergencyContext' in fallback && fallback.emergencyContext) {
        const responseId = `emergency_${currentSession}_${Date.now()}`;
        // Use new expansion state for emergency context tracking
        setLastExpandable({
          messageId: responseId,
          questionType: 'emergency',
          query: (fallback.emergencyContext && typeof fallback.emergencyContext === 'object' && 'originalQuery' in fallback.emergencyContext ? 
                  String(fallback.emergencyContext.originalQuery) : null) || message,
          role: userRole
        });
      }
      
      /** @type {APIResponse} */
      const emergencyResponse = {
        content,
        metadata: {
          requestTime: Date.now() - startTime,
          modelName: 'medical-safety-fallback',
          isStreaming: false,
          medicalSafety: {
            blocked: true,
            reason: (safetyResult.safetyContext && 
                    typeof safetyResult.safetyContext === 'object' && 
                    'emergencyDetection' in safetyResult.safetyContext &&
                    safetyResult.safetyContext.emergencyDetection &&
                    typeof safetyResult.safetyContext.emergencyDetection === 'object' &&
                    'isEmergency' in safetyResult.safetyContext.emergencyDetection &&
                    safetyResult.safetyContext.emergencyDetection.isEmergency) ? 'emergency_detected' : 'safety_concern',
            hasWarnings: true,
            emergencyProtocol: safetyResult.emergencyProtocol
          },
          triageLevel: (safetyResult.safetyContext && 
                       typeof safetyResult.safetyContext === 'object' && 
                       'triageResult' in safetyResult.safetyContext &&
                       safetyResult.safetyContext.triageResult &&
                       typeof safetyResult.safetyContext.triageResult === 'object' &&
                       'level' in safetyResult.safetyContext.triageResult) ? 
                       String(safetyResult.safetyContext.triageResult.level) : undefined,
          triageWarning: typeof safetyResult.triageWarning === 'string' ? safetyResult.triageWarning : undefined,
          safetyNotices: safetyResult.safetyNotices,
          followUpQuestions: (fallback && typeof fallback === 'object' && 'followUpQuestions' in fallback && Array.isArray(fallback.followUpQuestions)) ? 
                            fallback.followUpQuestions.map(q => String(q)) : [],
          queryIntent: {
            isEmergency: safetyResult.emergencyProtocol,
            emergencyContext: (fallback && typeof fallback === 'object' && 'emergencyContext' in fallback) ? 
                             fallback.emergencyContext : undefined,
            atd: safetyResult.routeToProvider ? 
                 (safetyResult.safetyContext && typeof safetyResult.safetyContext === 'object' && 'atdRouting' in safetyResult.safetyContext ? 
                  safetyResult.safetyContext.atdRouting : null) : null
          }
        }
      };
      return emergencyResponse;
    }

    // NEW EXPANSION STATE MACHINE LOGIC
    /** @type {ExpansionState} */
    const expansionState = getExpansionState();
    const { lastExpandable } = expansionState;
    
    let systemPrompt, enhancedPrompt, questionType, mode;
    const responseId = `response_${currentSession}_${Date.now()}`;
    
    // 1) Handle pure expansion replies like "yes", "more", "expand"
    if (isAffirmativeExpansion(message) && lastExpandable) {
      // Build detailed expansion using the lastExpandable context
      const expPrompt = /** @type {ExpansionPrompt} */ (buildExpansionPrompt({
        questionType: lastExpandable.questionType,
        query: lastExpandable.query,
        role: lastExpandable.role || userRole
      }));
      
      systemPrompt = expPrompt.systemPrompt;
      enhancedPrompt = expPrompt.userPrompt;
      questionType = lastExpandable.questionType;
      mode = "expansion";
      
      // Consume expansion state
      clearLastExpandable();
    } else {
      // 2) Fresh question: clear previous expansion state
      clearLastExpandable();
      
      // 3) Classify and build prompts using new routing system
      const promptResult = /** @type {PromptResult} */ (buildPromptsForQuery({ 
        query: message, 
        userRole, 
        flags: AI_FLAGS 
      }));
      
      systemPrompt = promptResult.systemPrompt;
      enhancedPrompt = message.trim(); // Simple user prompt for fresh queries
      questionType = promptResult.questionType;
      mode = promptResult.mode;
      
      console.info('🎯 [LLM-API] New system routing:', { message, questionType, mode, userRole });
      
      // For concise medication answers, we'll arm expansion after successful completion
    }
    
    
    // Prepare request body with enhanced prompts
    /** @type {object} */
    const requestBody = {
      message: message.trim(),
      conversationHistory, // Use the already filtered conversation history
      isHighRisk,
      // Include enhanced prompts for concise mode and other features
      systemPrompt,
      enhancedPrompt,
      userRole,
      // Add mode information for downstream processing
      mode,
      questionType,
      ...(sessionId && { sessionId })
    };

    // Choose endpoint based on streaming requirement
    const endpoint = isStreaming ? '/api/chat/stream' : '/api/chat';
    
    // TRACE: Request envelope before streaming (non-intrusive)
    if (isDebug()) {
      trace('[TRACE] beforeRequestEnvelope', { endpoint, requestBodyKeys: Object.keys(requestBody) });
      try {
        trace('[TRACE] requestEnvelope', {
          questionType: String(questionType), 
          mode: String(mode), 
          userRole: String(userRole),
          canExpand: false // Simplified to avoid errors
        });
      } catch (e) {
        trace('[TRACE] requestEnvelopeError', { error: String(e) });
      }
    }
    
    // TRACE: About to make API request
    if (isDebug()) {
      trace('[TRACE] aboutToMakeRequest', { endpoint, currentSession });
    }
    
    // AUDIT TRACE: Capture final request payload before API call
    if (isDebug()) {
      const typedBody = /** @type {{ systemPrompt?: string, mode?: string, questionType?: string, enhancedPrompt?: string }} */ (requestBody);
      console.info('🚨 [FINAL_REQUEST_PAYLOAD] Complete systemPrompt before API call:\n', typedBody.systemPrompt);
      console.info('🚨 [FINAL_REQUEST_PAYLOAD] mode:', typedBody.mode, 'questionType:', typedBody.questionType);
      console.info('🚨 [FINAL_REQUEST_PAYLOAD] enhancedPrompt:', typedBody.enhancedPrompt);
    }
    
    // Make API request using the global controller with session ID
    const response = await makeAPIRequest(endpoint, requestBody, currentSession);
    
    // TRACE: API request completed
    if (isDebug()) {
      trace('[TRACE] apiRequestComplete', { status: response.status, ok: response.ok });
    }
    
    // Check if aborted immediately after fetch
    if (activeAbortController && activeAbortController.signal.aborted) {
      throw new Error('Request was cancelled');
    }
    
    if (!response.ok) {
      let errorMessage;
      try {
        const errorData = await response.json();
        errorMessage = (errorData && typeof errorData === 'object' && 'message' in errorData && errorData.message) ? 
                      String(errorData.message) : 
                      (errorData && typeof errorData === 'object' && 'error' in errorData && errorData.error ? 
                       String(errorData.error) : `HTTP ${response.status}`);
      } catch {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      
      throw createAPIError(
        response.status >= 500 ? 'server' : 'api',
        errorMessage,
        { status: response.status }
      );
    }
    
    let content;
    /** @type {APIMetadata} */
    let metadata = {
      requestTime: Date.now() - startTime,
      modelName: 'deepseek-chat',
      isStreaming,
      medicalSafety: {
        blocked: false,
        reason: '',
        hasWarnings: false,
        emergencyProtocol: false
      }
    };

    if (isStreaming) {
      // Handle streaming response
      if (!response.body) {
        throw createAPIError('api', 'Streaming response has no body');
      }
      
      content = await processStream(
        response.body,
        onStreamingUpdate,
        activeAbortController ? activeAbortController.signal : undefined
      );
      
    } else {
      // Handle regular response
      const data = await response.json();
      
      if (!data || typeof data !== 'object' || !data.success) {
        const errorMsg = (data && typeof data === 'object' && 'message' in data && data.message) ? 
                        String(data.message) : 'API request failed';
        throw createAPIError('api', errorMsg);
      }
      
      content = (data && typeof data === 'object' && 'content' in data && data.content) ? 
                String(data.content) : 
                (data && typeof data === 'object' && 'response' in data && data.response ? 
                 String(data.response) : '');
      metadata = { ...metadata, ...(data && typeof data === 'object' && 'metadata' in data ? data.metadata : {}) };
    }

    // Add medical disclaimers if needed
    content = addMedicalDisclaimers(content, isHighRisk);

    // Apply post-processing with the safety result we obtained earlier
    if (safetyResult) {
      try {
        // Post-process the AI response through safety filters
        content = postProcessAIResponse(content, /** @type {any} */ (safetyResult.safetyContext));

        if (validateSafetyProcessing(safetyProcessingResult)) {
          const safetyData = safetyResult;
          if (safetyData && typeof safetyData === 'object' && 
              'shouldBlockAI' in safetyData && safetyData.shouldBlockAI &&
              'fallbackResponse' in safetyData && safetyData.fallbackResponse &&
              typeof safetyData.fallbackResponse === 'object' &&
              'response' in safetyData.fallbackResponse) {
            content = String(safetyData.fallbackResponse.response);
            metadata.medicalSafety.blocked = true;
            metadata.medicalSafety.reason = ('reason' in safetyData.fallbackResponse && safetyData.fallbackResponse.reason) ? 
              String(safetyData.fallbackResponse.reason) : 'Safety fallback';
          } else if (content) {
            try {
              if ('safetyContext' in safetyData && 
                  safetyData.safetyContext && 
                  typeof safetyData.safetyContext === 'object') {
                const postProcessed = await postProcessAIResponse(content, /** @type {any} */ (safetyData.safetyContext));
                
                if (postProcessed && typeof postProcessed === 'string') {
                  content = postProcessed;
                } else if (postProcessed && 
                          typeof postProcessed === 'object' && 
                          postProcessed !== null && 
                          'processedContent' in postProcessed) {
                  const processed = /** @type {{ processedContent: string }} */ (postProcessed);
                  if (typeof processed.processedContent === 'string') {
                    content = processed.processedContent;
                  }
                }
              }
            } catch (postProcessError) {
              console.warn('[Medical Safety] Post-processing failed:', postProcessError);
            }
            
            metadata.medicalSafety.hasWarnings = ('triageWarning' in safetyData && !!safetyData.triageWarning);
            metadata.medicalSafety.emergencyProtocol = ('emergencyProtocol' in safetyData) ? 
              Boolean(safetyData.emergencyProtocol) : false;
          }
        }
      } catch (safetyError) {
        console.warn('[Medical Safety] Processing failed:', safetyError);
        // Continue with regular response if safety processing fails
      }
    }

    metadata.requestTime = Date.now() - startTime;

    // 5) If concise medication answer completed successfully → arm expansion
    if (mode === "concise" && content && content.trim() && !metadata.medicalSafety.blocked) {
      setLastExpandable({
        messageId: responseId,
        questionType,
        query: message.trim(),
        role: userRole
      });
      markPendingExpansion(true);
      
      // Add mode information to metadata for UI handling
      metadata.responseMode = mode;
      metadata.questionType = questionType;
      metadata.canExpand = true;
      
      console.info('⚡ [LLM-API] Arming expansion:', { responseId, questionType, mode, canExpand: true });
      console.info('🔵 [LLM-API] Expansion armed: true (but NOT injected into system prompt)');
      console.info('🔵 [LLM-API] Final metadata for UI:', { responseMode: mode, questionType, canExpand: true });
    } else {
      // For non-concise responses, don't arm expansion
      metadata.responseMode = mode;
      metadata.questionType = questionType;
      metadata.canExpand = false;
      
      console.info('❌ [LLM-API] Not arming expansion:', { mode, hasContent: !!content, blocked: metadata.medicalSafety.blocked });
      console.info('🔵 [LLM-API] Final metadata for UI:', { responseMode: mode, questionType, canExpand: false });
    }

    return {
      content: content || '',
      metadata
    };

  } catch (error) {
    // Handle different error types
    if (isAbortError(error)) {
      console.info('[LLM] Request aborted by user');
      throw createAPIError('abort', 'Request was cancelled', { originalError: error });
    }
    
    if (error && typeof error === 'object' && 'type' in error) {
      // Already a standardized API error
      throw error;
    }
    
    if (error instanceof TypeError && error.message && error.message.includes('fetch')) {
      throw createAPIError('network', 'Network error - please check your connection', { originalError: error });
    }
    
    const errorMessage = (error instanceof Error && error.message) ? 
      error.message : 'An unexpected error occurred';
    
    throw createAPIError('unknown', errorMessage, { originalError: error });
  } finally {
    // Clear the active abort controller when streaming completes/fails
    if (isStreaming && activeAbortController) {
      activeAbortController = null;
    }
  }
}

/**
 * Stops any active streaming request (both client and server)
 * @returns {Promise<boolean>} Whether a stream was stopped
 */
export async function stopStreaming() {
  let stopped = false;
  
  // Client-side abort
  if (activeAbortController) {
    activeAbortController.abort();
    activeAbortController = null;
    stopped = true;
  }
  
  // Server-side cancel
  if (currentSessionId) {
    try {
      await fetch(`/api/chat/cancel/${currentSessionId}`, { method: "POST" });
    } catch (error) {
      console.warn('Failed to cancel server session:', error);
    }
    currentSessionId = null;
  }
  
  return stopped;
}

/**
 * Gets follow-up suggestions based on medical context
 * @param {boolean} [isHighRisk=false] - Whether the query was high-risk
 * @returns {string[]} Array of suggested follow-up questions
 */
export function getFollowUpSuggestions(isHighRisk = false) {
  if (isHighRisk) {
    return [
      "What should I do while waiting for medical help?",
      "What warning signs should I watch for?",
      "How can I prepare for emergency situations?"
    ];
  }
  
  return [
    "What symptoms should I watch for?",
    "When should I see a doctor?",
    "Are there any prevention strategies?",
    "What lifestyle changes might help?"
  ];
}

/**
 * Creates an AbortController for request cancellation
 * @param {number} [timeoutMs] - Optional timeout in milliseconds
 * @returns {AbortController} Configured abort controller
 */
export function createAbortController(timeoutMs) {
  const controller = new AbortController();
  
  if (timeoutMs && timeoutMs > 0) {
    setTimeout(() => {
      controller.abort(new Error('Request timeout'));
    }, timeoutMs);
  }
  
  return controller;
}