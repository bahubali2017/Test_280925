/**
 * @file Medical AI Assistant API Interface
 * Unified, production-ready interface for communicating with the chat API
 * Features: streaming support, proper error handling, medical safety integration
 */

/* eslint-env browser */
/* global TextDecoder, AbortController, setTimeout */

import { processMedicalSafety, postProcessAIResponse, validateSafetyProcessing } from './medical-safety-processor.js';
import { enhancePrompt, classifyQuestionType } from './prompt-enhancer.js';
import { createLayerContext } from './layer-context.js';
import { 
  handleExpansionRequest, 
  updateLastExpandableQuery, 
  validateExpansionContext 
} from './expansion-handler.js';

/**
 * @typedef {object} Message
 * @property {string} role - The message role (system, user, assistant)
 * @property {string} content - The message content
 */

/**
 * @typedef {object} APIResponse
 * @property {string} content - The response content
 * @property {object} metadata - Response metadata
 * @property {number} metadata.requestTime - Request time in milliseconds
 * @property {string} metadata.modelName - Model name used
 * @property {boolean} [metadata.isStreaming] - Whether response was streamed
 * @property {object} metadata.medicalSafety - Medical safety information
 * @property {boolean} [metadata.medicalSafety.blocked] - Whether AI was blocked
 * @property {string} [metadata.medicalSafety.reason] - Blocking reason
 * @property {boolean} [metadata.medicalSafety.hasWarnings] - Whether there are warnings
 * @property {boolean} [metadata.medicalSafety.emergencyProtocol] - Whether emergency protocol is active
 */

/**
 * @typedef {object} APIError
 * @property {string} type - Error type (network, api, timeout, validation, abort)
 * @property {string} message - Human-readable error message
 * @property {number} [status] - HTTP status code if available
 * @property {Error} [originalError] - The original error object
 */

/**
 * @typedef {object} SendMessageOptions
 * @property {AbortSignal} [abortSignal] - Abort signal for cancellation
 * @property {Function} [onStreamingUpdate] - Callback for streaming updates
 * @property {string} [region] - User's region for medical safety processing
 * @property {object} [demographics] - User demographics for safety processing
 * @property {string} [sessionId] - Session identifier
 */

/**
 * High-risk medical terms that indicate emergencies
 */
const HIGH_RISK_TERMS = [
  "heart attack", "stroke", "seizure", "suicide", "emergency", 
  "severe bleeding", "unconscious", "not breathing", "overdose", 
  "poison", "dying", "chest pain", "difficulty breathing", "choking",
  "collapsed", "unresponsive", "severe pain", "head trauma", "gunshot"
];

/**
 * Emergency medical disclaimer
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
  
  try {
    while (true) {
      // Check abort signal before each iteration for faster response
      if (abortSignal?.aborted) {
        throw new Error('Stream aborted by user');
      }
      
      const { done, value } = await reader.read();
      
      if (done) break;
      
      // Check abort signal after reading data
      if (abortSignal?.aborted) {
        throw new Error('Stream aborted by user');
      }
      
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (!line && line !== '') continue; // Only skip completely null/undefined lines, preserve empty strings
        
        // Check abort signal during line processing for immediate response
        if (abortSignal?.aborted) {
          throw new Error('Stream aborted by user');
        }
        
        const data = parseSSEData(line);
        if (!data) continue;
        
        if (data.done) return fullContent;
        
        // Handle both 'content' and 'text' properties for compatibility
        const chunkContent = data.content || data.text || '';
        if (chunkContent) {
          fullContent += chunkContent;
          onUpdate(chunkContent, { streaming: true, fullContent });
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
    const conversationHistory = Array.isArray(history) ? history.filter(msg => 
      msg && 
      typeof msg === 'object' && 
      typeof msg.role === 'string' && 
      typeof msg.content === 'string' &&
      msg.content.trim()
    ) : [];

    // CRITICAL: Run medical safety processing FIRST before any AI processing
    const safetyResult = await processMedicalSafety(message, {
      region,
      demographics,
      sessionId: currentSession
    });

    // If medical safety determines AI should be blocked (emergency/high-risk), return fallback immediately
    if (safetyResult.shouldBlockAI && safetyResult.fallbackResponse) {
      // Extract content as string from fallback response
      const fallback = safetyResult.fallbackResponse;
      const content = typeof fallback === 'string' ? fallback : 
                     (fallback?.response ?? 'Please seek emergency medical care immediately. Call your local emergency services.');
      
      return {
        content,
        metadata: {
          requestTime: Date.now() - startTime,
          modelName: 'medical-safety-fallback',
          isStreaming: false,
          medicalSafety: {
            blocked: true,
            reason: safetyResult.safetyContext.emergencyDetection?.isEmergency ? 'emergency_detected' : 'safety_concern',
            hasWarnings: true,
            emergencyProtocol: safetyResult.emergencyProtocol
          },
          triageLevel: safetyResult.safetyContext.triageResult?.level,
          triageWarning: safetyResult.triageWarning,
          safetyNotices: safetyResult.safetyNotices,
          queryIntent: {
            isEmergency: safetyResult.emergencyProtocol,
            atd: safetyResult.routeToProvider ? safetyResult.safetyContext.atdRouting : null
          }
        }
      };
    }

    // Only proceed with expansion handling if safety checks pass
    const expansionResult = handleExpansionRequest(message, conversationHistory, userRole);
    
    let systemPrompt, enhancedPrompt;
    
    if (expansionResult.isExpansion) {
      // Handle expansion request with the tracked context
      enhancedPrompt = expansionResult.prompt;
      systemPrompt = "You are providing a detailed expansion based on the user's previous query.";
    } else {
      // Regular query processing
      // Create layer context for prompt enhancement
      const layerContext = createLayerContext(message.trim());
      
      // Generate enhanced prompts using the prompt enhancer
      const enhancementResult = enhancePrompt(layerContext, userRole, conversationHistory);
      systemPrompt = enhancementResult.systemPrompt;
      enhancedPrompt = enhancementResult.enhancedPrompt;
      
      // Classify and track this query for potential future expansion
      const questionType = classifyQuestionType(message);
      const responseId = `response_${currentSession}_${Date.now()}`;
      
      // Update conversation state for expansion tracking
      updateLastExpandableQuery(message, questionType, responseId);
    }
    
    
    // Prepare request body with enhanced prompts
    const requestBody = {
      message: message.trim(),
      conversationHistory, // Use the already filtered conversation history
      isHighRisk,
      // Include enhanced prompts for concise mode and other features
      systemPrompt,
      enhancedPrompt,
      userRole,
      ...(sessionId && { sessionId })
    };

    // Choose endpoint based on streaming requirement
    const endpoint = isStreaming ? '/api/chat/stream' : '/api/chat';
    
    // Make API request using the global controller with session ID
    const response = await makeAPIRequest(endpoint, requestBody, currentSession);
    
    // Check if aborted immediately after fetch
    if (activeAbortController?.signal.aborted) {
      throw new Error('Request was cancelled');
    }
    
    if (!response.ok) {
      let errorMessage;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || `HTTP ${response.status}`;
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
        activeAbortController?.signal
      );
      
    } else {
      // Handle regular response
      const data = await response.json();
      
      if (!data.success) {
        throw createAPIError('api', data.message || 'API request failed');
      }
      
      content = data.content || data.response || '';
      metadata = { ...metadata, ...data.metadata };
    }

    // Add medical disclaimers if needed
    content = addMedicalDisclaimers(content, isHighRisk);

    // Apply post-processing with the safety result we obtained earlier
    if (safetyResult) {
      try {
        // Post-process the AI response through safety filters
        content = postProcessAIResponse(content, safetyResult.safetyContext);

        if (validateSafetyProcessing(safetyResult)) {
          const safetyData = safetyResult;
          if (safetyData && typeof safetyData === 'object' && 
              'shouldBlockAI' in safetyData && safetyData.shouldBlockAI &&
              'fallbackResponse' in safetyData && safetyData.fallbackResponse &&
              typeof safetyData.fallbackResponse === 'object' &&
              'response' in safetyData.fallbackResponse) {
            content = String(safetyData.fallbackResponse.response);
            metadata.medicalSafety.blocked = true;
            metadata.medicalSafety.reason = 'reason' in safetyData.fallbackResponse ? 
              String(safetyData.fallbackResponse.reason || 'Safety fallback') : 'Safety fallback';
          } else if (content) {
            try {
              const safetyContext = ('safetyContext' in safetyData && 
                                   safetyData.safetyContext && 
                                   typeof safetyData.safetyContext === 'object') ? 
                                   safetyData.safetyContext : {};
              const postProcessed = await postProcessAIResponse(content, safetyContext);
              
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
            } catch (postProcessError) {
              console.warn('[Medical Safety] Post-processing failed:', postProcessError);
            }
            
            metadata.medicalSafety.hasWarnings = 'triageWarning' in safetyData && !!safetyData.triageWarning;
            metadata.medicalSafety.emergencyProtocol = 'emergencyProtocol' in safetyData ? 
              Boolean(safetyData.emergencyProtocol) : false;
          }
        }
      } catch (safetyError) {
        console.warn('[Medical Safety] Processing failed:', safetyError);
        // Continue with regular response if safety processing fails
      }
    }

    metadata.requestTime = Date.now() - startTime;

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
    
    const errorMessage = error instanceof Error && error.message ? 
      error.message : 'An unexpected error occurred';
    
    throw createAPIError('unknown', errorMessage, { originalError: error });
  } finally {
    // Clear the active abort controller when streaming completes/fails
    if (isStreaming && activeAbortController) {
      activeAbortController = null;
    }
  }
}

// Global session ID for current active session
/** @type {string|null} */
let currentSessionId = null;

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