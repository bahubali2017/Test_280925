/**
 * @file Simplified LLM API interface for direct backend communication
 * This version bypasses complex medical layer processing and directly calls the working backend API
 */

import { apiRequest } from "./queryClient.jsx";

/**
 * High-risk medical terms that might indicate emergencies
 * @type {string[]}
 */
const HIGH_RISK_TERMS = [
  "heart attack", "stroke", "seizure", "suicide", "emergency", 
  "severe bleeding", "unconscious", "not breathing", "overdose", 
  "poison", "dying", "chest pain", "difficulty breathing", "choking",
  "collapsed", "unresponsive", "severe pain", "head trauma", "gunshot",
  "bleeding heavily", "vomiting blood", "anaphylaxis", "allergic reaction",
  "drowning", "suffocating", "suicidal", "self-harm", "911"
];

/**
 * Creates a standardized error object
 * @param {string} type - The error type
 * @param {string} message - Human-readable error message
 * @param {object} [details={}] - Additional error details
 * @returns {object} Standardized error object
 */
function createAPIError(type, message, details = {}) {
  return {
    type: typeof type === 'string' ? type : 'unknown',
    message: typeof message === 'string' ? message : 'Unknown error',
    ...details
  };
}

/**
 * Checks if a message contains high-risk medical terms
 * @param {string} message - The message to check
 * @returns {boolean} Whether the message contains high-risk terms
 */
function containsHighRiskTerms(message) {
  const lowerCaseMessage = message.toLowerCase();
  return HIGH_RISK_TERMS.some(term => lowerCaseMessage.includes(term));
}

/**
 * Simplified sendMessage function that directly calls the backend API
 * @param {string} message - The user message to send
 * @param {Array} [history=[]] - Previous conversation history
 * @param {object} [options={}] - Additional options for the request
 * @param {Function} [onStreamingUpdate=null] - Callback for streaming updates
 * @returns {Promise<{content: string, metadata: object}>} The AI response
 */
export async function sendMessage(message, history = [], options = {}, onStreamingUpdate = null) {
  // Validate input
  if (!message || typeof message !== "string" || message.trim() === "") {
    throw createAPIError("validation", "Message cannot be empty");
  }

  console.debug('[AI-Simple] Sending message directly to backend API:', message.substring(0, 100) + '...');

  const startTime = Date.now();
  const isHighRisk = containsHighRiskTerms(message);

  try {
    // Prepare the request body for the backend API
    const requestBody = {
      message: message.trim(),
      conversationHistory: history,
      isHighRisk: isHighRisk
    };

    // Check if streaming is supported and requested
    const shouldStream = onStreamingUpdate && typeof onStreamingUpdate === 'function';
    const endpoint = shouldStream ? '/api/chat/stream' : '/api/chat';

    if (shouldStream) {
      // For streaming, call the streaming endpoint but handle the response simply
      console.debug('[AI-Simple] Using streaming endpoint');
      
      try {
        const response = await apiRequest('POST', endpoint, requestBody);
        const data = await response.json();

        if (!data.success) {
          throw createAPIError('api', data.message || 'Streaming API request failed');
        }

        // Call the streaming callback with the final result
        if (onStreamingUpdate) {
          onStreamingUpdate(data.response, { 
            isComplete: true,
            isStreaming: false,
            status: 'delivered'
          });
        }

        const requestTime = Date.now() - startTime;
        return {
          content: data.response,
          metadata: {
            requestTime,
            sessionId: data.metadata?.sessionId,
            isHighRisk: data.metadata?.isHighRisk,
            attemptsMade: data.metadata?.attemptsMade || 1,
            modelName: data.metadata?.modelName || 'deepseek-chat',
            usage: data.usage
          }
        };
      } catch (streamError) {
        console.warn('[AI-Simple] Streaming failed, falling back to standard endpoint:', streamError);
        // Fall back to standard endpoint
      }
    }

    // Handle regular response  
    console.debug('[AI-Simple] Using standard endpoint');
    const response = await apiRequest('POST', '/api/chat', requestBody);
    const data = await response.json();

    if (!data.success) {
      throw createAPIError('api', data.message || 'API request failed');
    }

    const requestTime = Date.now() - startTime;
    return {
      content: data.response,
      metadata: {
        requestTime,
        sessionId: data.metadata?.sessionId,
        isHighRisk: data.metadata?.isHighRisk,
        attemptsMade: data.metadata?.attemptsMade || 1,
        modelName: data.metadata?.modelName || 'deepseek-chat',
        usage: data.usage
      }
    };

  } catch (error) {
    console.error('[AI-Simple] Error in sendMessage:', error);
    
    // If it's already a standardized error, just re-throw it
    if (error && typeof error === 'object' && error.type && error.message) {
      throw error;
    }
    
    // Create a user-friendly error
    throw createAPIError(
      'api',
      'Unable to get a response from the AI service. Please try again later.',
      { originalError: error }
    );
  }
}

/**
 * Simple stopStreaming function (placeholder for compatibility)
 * @param {boolean} [isDelivered=false] - Whether the message has already been delivered
 * @returns {boolean} Whether a streaming request was stopped
 */
export function stopStreaming(isDelivered = false) {
  console.debug('[AI-Simple] stopStreaming called with isDelivered:', isDelivered);
  // For the simplified version, we don't have complex streaming to stop
  return false;
}

/**
 * Safe timeout functions for cross-environment usage
 * @returns {object} Object containing setTimeout and clearTimeout functions
 */
export function getSafeTimeoutFunctions() {
  return {
    setTimeout: (fn, delay) => window.setTimeout(fn, delay),
    clearTimeout: (id) => window.clearTimeout(id)
  };
}