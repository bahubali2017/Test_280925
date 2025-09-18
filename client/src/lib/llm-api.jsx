/**
* @file Interface for communicating with DeepSeek API
* Enhanced for Phase 4 with conversation context support, retry mechanism, and advanced error handling
* Unified with medical safety processing from Phase 9
*/
import { apiRequest } from "./queryClient.jsx";
import { routeMedicalQuery } from "./router.js";
import { processMedicalSafety, postProcessAIResponse, validateSafetyProcessing } from './medical-safety-processor.js';
/* global setTimeout */
/**
* Returns a reference to the global object safely across environments
* @returns {any} The global object
*/
const getGlobalThis = () => {
if (typeof globalThis !== 'undefined') return globalThis;
if (typeof window !== 'undefined') return window;
return { };
};
/**
* Extended AbortSignal type with custom properties for message delivery status
* @typedef {object} CustomAbortSignal
* @property {boolean} aborted - Whether the signal has been aborted
* @property {boolean} [messageDelivered] - Whether the message was delivered before abort
* @property {string} [reason] - The reason for the abort
* @property {(type: string, listener: EventListenerOrEventListenerObject) => void} addEventListener - Add event listener function
* @property {(type: string, listener: EventListenerOrEventListenerObject) => void} removeEventListener - Remove event listener function
* @property {(event: Event) => boolean} dispatchEvent - Dispatch event function
* @property {((event: Event) => void) | null} onabort - Abort event handler
* @property {() => void} throwIfAborted - Throws if aborted
*/
/**
* Type guard to check if an object is an Error
* @param {unknown} obj - The object to check
* @returns {obj is Error} Whether the object is an Error
*/
function isError(obj) {
return obj instanceof Error;
}
/**
* Type guard to check if an object is an AbortError
* @param {unknown} obj - The object to check
* @returns {boolean} Whether the object is an AbortError
*/
function isAbortError(obj) {
return isError(obj) && obj.name === 'AbortError';
}
/**
* Type guard to check if an object has our API error shape
* @param {unknown} obj - The object to check
* @returns {boolean} Whether the object is an API error
*/
function isAPIError(obj) {
return Boolean(
obj && 
typeof obj === 'object' &&
'type' in obj &&
'message' in obj &&
typeof obj.type === 'string' &&
typeof obj.message === 'string'
);
}
/**
* @typedef {object} CustomAbortController
* @property {CustomAbortSignal} signal - The abort signal
* @property {(reason?: string) => void} abort - Abort function
*/
/**
* Mock AbortController implementation
* @class
*/
function MockAbortController() {
/** @type {CustomAbortSignal} */
this.signal = { 
aborted: false,
messageDelivered: false,
reason: '',
addEventListener: () => {},
removeEventListener: () => {},
dispatchEvent: () => false,
onabort: null,
throwIfAborted: () => { 
if (this.signal.aborted) throw new Error(this.signal.reason || 'Aborted'); 
}
};
/**
* Aborts the operation with an optional reason
* @param {string} [reason] - The reason for aborting
*/
this.abort = (reason) => { 
this.signal.aborted = true;
this.signal.reason = reason || 'abort';
};
}
// Safe AbortController implementation that works across environments
/** @type {any} */
const GlobalAbortController = (() => {
const globals = getGlobalThis();
// Safely access AbortController from global scope
if (typeof globals === 'object' && globals && 'AbortController' in globals) {
return globals.AbortController;
}
// Fallback to mock implementation
return MockAbortController;
})();
/**
* Safe timeout functions interface
* @typedef {object} TimeoutFunctions
* @property {(callback: (...args: any[]) => void, ms?: number, ...args: any[]) => number|unknown} setTimeout - setTimeout function
* @property {(id: number|unknown) => void} clearTimeout - clearTimeout function
*/
/**
* Gets safe timeout functions for cross-environment usage
* @returns {TimeoutFunctions} Object containing setTimeout and clearTimeout functions
*/
const getTimeoutFunctions = () => {
const globals = getGlobalThis();
return {
setTimeout: typeof globals === 'object' && globals && 'setTimeout' in globals 
? /** @type {TimeoutFunctions['setTimeout']} */ (globals.setTimeout)
: ((_fn, _ms) => { /* Fallback implementation */ return 0; }),
clearTimeout: typeof globals === 'object' && globals && 'clearTimeout' in globals
? /** @type {TimeoutFunctions['clearTimeout']} */ (globals.clearTimeout)
: ((_id) => { /* Fallback implementation */ })
};
};
/**
* Gets safe timeout functions that work in both browser and Node environments
* @returns {TimeoutFunctions} Object containing setTimeout and clearTimeout functions
*/
export function getSafeTimeoutFunctions() {
return getTimeoutFunctions();
}
// Extract functions for use within this module
const { clearTimeout: safeClearTimeout } = getTimeoutFunctions();
/**
* DeepSeek API configuration
* @typedef {object} DeepSeekConfig
* @property {string} apiKey - API key for DeepSeek
* @property {string} model - Model identifier
* @property {number} temperature - Temperature for generation
* @property {number} maxTokens - Maximum tokens to generate
* @property {string} endpoint - API endpoint URL
* @property {number} maxRetries - Maximum number of retry attempts
* @property {number} retryDelay - Delay between retries in milliseconds
*/
/**
* Message object for conversation history
* @typedef {object} Message
* @property {string} role - The message role (system, user, assistant)
* @property {string} content - The message content
*/
/**
* API Error response with detailed information
* @typedef {object} APIErrorDetails
* @property {string} type - The error type (network, api, timeout, validation)
* @property {string} message - Human-readable error message
* @property {number} [status] - HTTP status code if available
* @property {object} [originalError] - The original error object
* @property {boolean} [isHighRisk] - Whether the error is related to a high-risk query
* @property {boolean} [messageDelivered] - Whether message was delivered before error
* @property {string} [deliveredContent] - Content that was delivered before error
*/
/**
* API Response with metadata
* @typedef {object} APIResponse
* @property {string} content - The response content
* @property {object} metadata - Response metadata
* @property {number} metadata.requestTime - Request time in milliseconds
* @property {number} metadata.promptTokens - Number of prompt tokens
* @property {number} metadata.completionTokens - Number of completion tokens
* @property {number} metadata.totalTokens - Total tokens used
* @property {string} metadata.modelName - Model name used
* @property {boolean} [metadata.isHighRisk] - Whether the response is for a high-risk query
*/
/**
* List of high-risk medical terms that might indicate emergencies
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
* Medical disclaimer for emergency situations
* @type {string}
*/
const EMERGENCY_DISCLAIMER = 
"IMPORTANT: If you're experiencing a medical emergency, please seek immediate medical attention " +
"by contacting your local emergency services (911 in the US) or go to your nearest emergency room. " +
"I cannot provide emergency medical assistance, and delays in care may result in serious harm. " +
"The information provided here is for general educational purposes only, not a substitute for professional medical advice.";
/**
* Interface for detected query characteristics
* @typedef {object} QueryIntent
* @property {boolean} isHighRisk - Whether query contains high-risk medical terms
* @property {boolean} isMentalHealthCrisis - Whether query indicates a mental health crisis
* @property {boolean} isOffTopic - Whether query is off-topic or inappropriate
* @property {boolean} containsPII - Whether query contains personal identifying information
* @property {boolean} isProfessionalQuery - Whether query uses professional medical terminology
* @property {boolean} isSymptomBased - Whether query is about symptoms vs. general information
* @property {boolean} isChronicCondition - Whether query relates to chronic condition management
* @property {boolean} isPreventionFocused - Whether query relates to preventative healthcare
* @property {boolean} hasColdExtremities - Whether query mentions cold sensations in extremities
* @property {string} [symptomLocation] - Body part mentioned in symptom description
* @property {string} [symptomType] - Type of symptom mentioned (e.g., temperature, pain, etc.)
* @property {string} [disclaimer] - Appropriate disclaimer based on detected characteristics
*/
/**
* Message response interface for AI-generated responses
* @typedef {object} MessageResponse
* @property {string} content - The message content text
* @property {any} metadata - Additional metadata about the message
* @property {boolean} [isCancelled] - Whether this message was cancelled by user
* @property {boolean} [cancelled] - Alternative property for cancellation status
* @property {string} [status] - Status of the message (delivered, cancelled, etc.)
*/
/**
* Base response object shape
* @typedef {object} BaseResponse
* @property {string} content - The response content
* @property {any} metadata - The response metadata
*/
/**
* @typedef {MessageResponse} ExtendedMessageResponse
*/
// (Removed unused analyzeQueryIntent function to satisfy ESLint)
/**
* Gets the DeepSeek API configuration from environment variables
* @returns {DeepSeekConfig} The DeepSeek configuration
*/
function getDeepSeekConfig() {
// Simple config object with API key
return {
apiKey: "", // This will be set via server-side context
model: "deepseek-chat",
temperature: 0.4,
maxTokens: 3000,
endpoint: "https://api.deepseek.com/v1/chat/completions",
maxRetries: 3,
retryDelay: 1000
};
}
/**
* Creates a standardized response metadata object
* @param {number} requestTime - Time taken for the request in milliseconds
* @param {object} data - Response data from the API
* @param {QueryIntent|null} queryIntent - Query intent analysis results
* @param {object} [options={}] - Additional options for metadata
* @returns {object} Standardized metadata object
*/
function createResponseMetadata(requestTime, data, queryIntent, options = {}) {
return {
requestTime,
promptTokens: data?.usage?.prompt_tokens || 0,
completionTokens: data?.usage?.completion_tokens || 0,
totalTokens: data?.usage?.total_tokens || 0,
modelName: data?.model || options.modelName || "deepseek-chat",
...(queryIntent ? { queryIntent: extractQueryIntentMetadata(queryIntent) } : {}),
...options
};
}
/**
* Basic version of disclaimer addition (legacy)
* @param {string} content - The content to add disclaimers to
* @param {QueryIntent} queryIntent - Query intent analysis results
* @returns {string} Content with appropriate disclaimers
* @deprecated Use enhanced addDisclaimers function below
*
* Note: This function is kept for backward compatibility but should not be used in new code.
*/
// Exported to avoid unused variable warning while preserving for backward compatibility
function _addBasicDisclaimers(content, queryIntent) {
if (!queryIntent) return content;
let result = content;
if (queryIntent.disclaimer) {
result = `${queryIntent.disclaimer}\n\n${result}`;
}
return result;
}
// The extractQueryIntentMetadata function is defined later in the file (line ~538)
// This duplicate declaration has been removed for code stability
/**
* Adds appropriate disclaimers to response content based on query intent
* @param {string} content - The response content
* @param {QueryIntent} queryIntent - The query intent analysis results
* @param {boolean} [isHighRisk=false] - Whether message is high risk (fallback)
* @returns {string} Response with added disclaimers if needed
*/
function addDisclaimers(content, queryIntent, isHighRisk = false) {
if (!content) return '';
// Add specific disclaimer if available in query intent
if (queryIntent?.disclaimer) {
return `${queryIntent.disclaimer}\n\n${content}`;
} 
// Add emergency disclaimer for high-risk content
if (queryIntent?.isHighRisk || isHighRisk) {
return `${EMERGENCY_DISCLAIMER}\n\n${content}`;
}
// Return original content if no disclaimers needed
return content;
}
/**
* Gets follow-up suggestions based on query intent
* @param {QueryIntent} queryIntent - Query intent analysis results
* @returns {string[]} Array of suggested follow-up questions
*/
function getFollowUpSuggestions(queryIntent) {
if (!queryIntent) {
return [
"What other medical information can I help with?",
"Do you have any other questions?",
"Is there anything else you'd like to know?"
];
}
// Default medical-focused follow-up suggestions
const defaultSuggestions = [
"What symptoms should I watch for?",
"Are there any home remedies?",
"When should I see a doctor?",
"Is this condition contagious?"
];
// If this is a symptom-based query, suggest more specific follow-ups
if (queryIntent.isSymptomBased) {
return [
"What could be causing these symptoms?",
"How long should I expect this to last?",
"Are there any warning signs I should watch for?",
"What tests might a doctor recommend?"
];
}
// If this is a chronic condition management query
if (queryIntent.isChronicCondition) {
return [
"What lifestyle changes can help manage this condition?",
"How often should I monitor this condition?",
"What are common complications to watch for?",
"Are there support groups for this condition?"
];
}
// If this is a prevention-focused query
if (queryIntent.isPreventionFocused) {
return [
"What screening tests are recommended?",
"How effective is this preventative measure?",
"Are there any risks to this prevention strategy?",
"How often should I get this preventative care?"
];
}
// If this is a professional query, suggest more clinical follow-ups
if (queryIntent.isProfessionalQuery) {
return [
"What are the diagnostic criteria?",
"Are there any recent treatment guideline updates?",
"What's the typical prognosis?",
"Are there any significant drug interactions?"
];
}
return defaultSuggestions;
}
/**
* Implements exponential backoff for retrying failed API requests
* @param {Function} apiCall - Async function to call the API
* @param {number} [maxRetries=3] - Maximum number of retry attempts
* @param {number} [initialDelay=1000] - Initial delay in milliseconds
* @param {Function} [onRetry] - Optional callback to execute on each retry
* @returns {Promise<any>} Result of the successful API call
* @throws {Error} If all retries fail
*/
async function withExponentialBackoff(apiCall, maxRetries = 3, initialDelay = 1000, onRetry = null) {
let lastError = null;
let delay = initialDelay;
for (let attempt = 0; attempt <= maxRetries; attempt++) {
try {
// Execute the API call
const result = await apiCall(attempt);
return result;
} catch (error) {
lastError = error;
// On the last attempt, don't retry
if (attempt === maxRetries) break;
// Execute optional retry callback
if (onRetry) onRetry(error, attempt, delay);
// Wait for the calculated delay
await new Promise(resolve => window.setTimeout(resolve, delay));
// Exponential backoff: double the delay for next attempt
delay *= 2;
}
}
// If we get here, all attempts failed
throw lastError;
}
/**
* Checks if a message contains high-risk medical terms
* @param {string} message - The message to check
* @returns {boolean} Whether the message contains high-risk terms
* @private Internal utility function
*/
// Exported to avoid unused variable warning while preserving for backward compatibility
function _containsHighRiskTerms(message) {
const lowerCaseMessage = message.toLowerCase();
return HIGH_RISK_TERMS.some(term => lowerCaseMessage.includes(term));
}
/**
* Creates a standardized error object with detailed information
* @param {string} type - The error type
* @param {string} message - Human-readable error message
* @param {object} [details={}] - Additional error details
* @returns {APIErrorDetails} Standardized error object
*/
function createAPIError(type, message, details = {}) {
// Ensure required properties have the correct types
const safeType = typeof type === 'string' ? type : 'unknown';
const safeMessage = typeof message === 'string' ? message : 'Unknown error';
// Ensure details is an object
const safeDetails = typeof details === 'object' && details !== null ? details : {};
return {
type: safeType,
message: safeMessage,
...safeDetails
};
}
/**
* Extracts query intent metadata from a queryIntent object for consistent usage
* @param {QueryIntent} queryIntent - The query intent object to extract metadata from
* @returns {object} Standardized metadata object
*/
function extractQueryIntentMetadata(queryIntent) {
if (!queryIntent) {
return {
isHighRisk: false,
isMentalHealthCrisis: false,
isOffTopic: false,
containsPII: false,
isProfessionalQuery: false,
isSymptomBased: false,
isChronicCondition: false,
isPreventionFocused: false,
hasColdExtremities: false,
symptomLocation: '',
symptomType: ''
};
}
return {
isHighRisk: queryIntent.isHighRisk,
isMentalHealthCrisis: queryIntent.isMentalHealthCrisis,
isOffTopic: queryIntent.isOffTopic,
containsPII: queryIntent.containsPII,
isProfessionalQuery: queryIntent.isProfessionalQuery,
isSymptomBased: queryIntent.isSymptomBased,
isChronicCondition: queryIntent.isChronicCondition,
isPreventionFocused: queryIntent.isPreventionFocused,
hasColdExtremities: queryIntent.hasColdExtremities || false,
symptomLocation: queryIntent.symptomLocation || '',
symptomType: queryIntent.symptomType || ''
};
}
/**
* Prepares messages array for API request, including conversation history if available
* @param {string} message - The current user message
* @param {Array<Message>} [history=[]] - Previous conversation history
* @param {boolean} [includeSystemPrompt=true] - Whether to include the system prompt
* @param {string} [customPrompt=''] - Optional custom prompt instructions to add to system message
* @returns {Array<Message>} Messages array for API request
*/
function prepareMessages(message, history = [], includeSystemPrompt = true, customPrompt = '') {
const messages = [];
if (includeSystemPrompt) {
const medicalContext = `You are MAIA (Medical AI Assistant) from Anamnesis, a sophisticated medical assistant designed to provide accurate, 
evidence-based health information while maintaining a compassionate, professional tone.
## Core Guidelines:
1. Always clarify that you are not providing medical advice and users should consult healthcare professionals for diagnosis and treatment.
2. Be thorough, accurate, and cite trustworthy medical information from established sources when possible.
3. Use plain language and avoid jargon when speaking to non-professionals.
4. Adapt your language to match the technical level of the question (clinical language for professional queries).
5. Structure your answers in a clear, organized way with appropriate paragraphs and bullet points when helpful.
## Safety & Disclaimers:
- For any potentially serious symptoms (chest pain, difficulty breathing, severe bleeding, loss of consciousness), begin your response with a clear emergency disclaimer.
- Never suggest specific medications, dosages, or treatments; instead discuss general treatment approaches mentioned in medical guidelines.
- If a query relates to mental health crisis, always emphasize the importance of immediate professional help.
## Response Style:
- Begin with a brief, direct answer to the main question (1-2 sentences)
- Follow with 3-5 key points in clear, organized format
- **Use bold formatting for section titles and important headings** (e.g., **Main Causes**, **Treatment Options**, **When to Seek Care**)
- Include practical recommendations and next steps
- Add "When to Seek Care" guidance for medical consultation
- Show empathy and understanding, especially for sensitive health topics
- Prioritize most important information first in case of length constraints
- Format responses with clear sections using **bold titles** for better readability
## Symptom Analysis:
- Pay close attention to the anatomical context of symptoms (e.g., "cold feet" vs "common cold")
- Distinguish between temperature-related symptoms in extremities and infectious conditions
- When users mention symptoms in specific body locations, focus responses on that location
- Consider circulatory issues when extremities (hands, feet) are described as cold, numb, or tingling
## What to Avoid:
- Do not collect or request personal identifying information (name, address, etc.)
- Avoid definitive diagnostic statements like "you have X condition"
- Do not claim to replace proper medical consultation
- Refrain from commenting on the efficacy of alternative/unproven treatments
Remember that your purpose is to inform and educate, not diagnose or treat. Focus on providing factual, 
evidence-based information presented in a way that's helpful and easy to understand.
${customPrompt ? `\n\n## Query-Specific Instructions:\n${customPrompt}` : ''}`;
messages.push({ role: "system", content: medicalContext });
}
// Include conversation history if available (limited to last 10 messages)
if (history.length > 0) {
messages.push(...history.slice(-10));
}
// Add current message
messages.push({ role: "user", content: message });
return messages;
}
/**
* Creates a customized prompt based on detected query intent
* @param {QueryIntent} queryIntent - The detected intent of the user's query
* @returns {string} Customized prompt to prepend to the system message
*/
function createCustomPrompt(queryIntent) {
const promptParts = [];
// Add specific instructions based on query intent
if (queryIntent.isOffTopic) {
promptParts.push(
"The user has asked about a topic outside of medical and health information. " +
"Politely redirect them to health-related topics only."
);
}
if (queryIntent.containsPII) {
promptParts.push(
"The user has shared what appears to be personal identifying information. " +
"Do not acknowledge, repeat, or store this information in your response."
);
}
if (queryIntent.isHighRisk) {
promptParts.push(
"The user is asking about a potentially high-risk medical situation. " +
"Begin your response with an emergency disclaimer and emphasize the importance " +
"of seeking immediate professional medical attention."
);
}
if (queryIntent.isMentalHealthCrisis) {
promptParts.push(
"The user may be experiencing a mental health crisis. " +
"Begin with a supportive, non-judgmental tone. " +
"Emphasize the importance of speaking with a mental health professional immediately " +
"and provide crisis hotline information."
);
}
// Adapt tone based on professional vs layperson language
if (queryIntent.isProfessionalQuery) {
promptParts.push(
"The user appears to be a healthcare professional or is using medical terminology. " +
"You may use more technical language and clinical details in your response, while still " +
"ensuring accuracy and evidence-based information."
);
} else {
promptParts.push(
"Respond using clear, plain language without medical jargon. " +
"Define any necessary medical terms clearly."
);
}
// Adapt response for symptom-based vs informational queries
if (queryIntent.isSymptomBased) {
promptParts.push(
"The user is describing personal symptoms. " +
"Be empathetic and informative without making specific diagnostic claims. " +
"Clearly state that your information is educational only and encourage appropriate " +
"medical consultation. Describe possible causes in general terms while emphasizing the " +
"importance of professional diagnosis."
);
}
// Adapt response for chronic condition management
if (queryIntent.isChronicCondition) {
promptParts.push(
"The user is asking about chronic condition management. " +
"Focus on evidence-based self-management strategies, lifestyle modifications, " +
"and the importance of regular medical monitoring. " +
"Include information about potential complications to watch for " +
"and when to seek medical attention for changes in condition."
);
}
// Adapt response for prevention-focused health queries
if (queryIntent.isPreventionFocused) {
promptParts.push(
"The user is asking about preventative healthcare. " +
"Focus on evidence-based prevention strategies, lifestyle modifications, " +
"and appropriate screening recommendations based on general guidelines. " +
"Emphasize the importance of consistent preventative care and regular check-ups " +
"with healthcare providers."
);
}
// Special handling for cold extremities
if (queryIntent.hasColdExtremities) {
promptParts.push(
"The user is describing cold extremities (cold hands, feet, fingers, toes, etc). " +
"This is NOT about the common cold respiratory infection. " +
"Focus on circulatory issues, Raynaud's phenomenon, peripheral vascular conditions, " +
"and other causes of cold sensations in extremities. " +
"Discuss potential cardiovascular, neurological, and endocrine factors that can " +
"affect temperature regulation in hands and feet."
);
}
// Add specific guidance based on symptom location if available
if (queryIntent.symptomLocation && queryIntent.symptomType) {
promptParts.push(
`The user is describing ${queryIntent.symptomType}-related symptoms in their ${queryIntent.symptomLocation}. ` +
`Focus your response on this specific anatomical location and symptom type. ` +
`Include information about common conditions affecting the ${queryIntent.symptomLocation} ` +
`that present with ${queryIntent.symptomType} sensations.`
);
}
// Default case - if none of the specific categories apply
if (!queryIntent.isSymptomBased && !queryIntent.isChronicCondition && 
!queryIntent.isPreventionFocused && !queryIntent.isProfessionalQuery) {
promptParts.push(
"Provide comprehensive, educational information on the topic. " +
"Include relevant context about prevalence, mechanisms, and general approaches to management when appropriate."
);
}
return promptParts.join("\n\n");
}
/**
* Sends a message to the LLM API with enhanced error handling and retry logic
* @param {string} message - The user message to send
* @param {Array<Message>} [history=[]] - Previous conversation history
* @returns {Promise<APIResponse>} The AI response with metadata
* @throws {APIErrorDetails} Standardized error object if request fails
*/
/**
* Sends a message to the Medical AI Assistant with optional streaming support
* @param {string} message - The message to send
* @param {Array<{role: string, content: string}>} [history=[]] - Previous conversation history
* @param {object} [_options={}] - Additional options for the request (unused, kept for API compatibility)
* @param options
* @param {Function} [onStreamingUpdate=null] - Callback for streaming updates
* @returns {Promise<{content: string, metadata: object}>} The AI response
*/
async function sendMessage(message, history = [], options = {}, onStreamingUpdate = null) {
// Validate input
if (!message || typeof message !== "string" || message.trim() === "") {
throw createAPIError("validation", "Message cannot be empty");
}

console.debug('[AI] Sending message directly to backend API:', message.substring(0, 100) + '...');

const startTime = Date.now();
const isHighRisk = _containsHighRiskTerms(message);

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
// Handle streaming response
console.debug('[AI] Using streaming endpoint');
// CRITICAL FIX: Reset stream state completely before starting new stream
      currentStream.controller = null;
      currentStream.sessionId = null;
      currentStream.messageId = null;
      currentStream.isActive = false;
      currentStream.startTime = null;
      currentStream.lastActivity = null;
return await handleStreamingResponse(endpoint, requestBody, onStreamingUpdate, options);
} else {
// Handle regular response  
console.debug('[AI] Using standard endpoint');
// FIX: Handle streaming response properly - don't parse as JSON for SSE
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "text/event-stream",
      },
      body: JSON.stringify(requestBody),
      credentials: "include",
      signal: options.abortSignal // Use the provided abortSignal
    });
// Original non-streaming handling code:
    // const response = await apiRequest('POST', endpoint, requestBody);
    // const data = await response.json();

    // Check for streaming errors (e.g., HTML response)
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Streaming API error:", errorText);
      throw createAPIError('api', `API error: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("text/html")) {
      console.error("Received HTML instead of streaming data:", contentType);
      throw createAPIError('api', "Server returned HTML instead of streaming data. The API route may be misconfigured.");
    }

    // If streaming is enabled, the response is handled by handleStreamingResponse
    // This part of the code should only execute for non-streaming requests
    if (!shouldStream) {
      const data = await response.json(); // Parse JSON only for non-streaming
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
    }
}
} catch (error) {
console.error('[AI] Error in sendMessage:', error);
throw error;
}
} // Close sendMessage function

/**
* Handle streaming response from the API
* @param {string} endpoint - API endpoint
* @param {object} requestBody - Request body
* @param {Function} onStreamingUpdate - Streaming callback
* @param {object} options - Additional options
* @returns {Promise<{content: string, metadata: object}>} The AI response
*/
async function handleStreamingResponse(endpoint, requestBody, onStreamingUpdate, options) {
console.debug('[AI] Starting streaming request to', endpoint);

let accumulatedText = '';
let metadata = {};
// CRITICAL FIX: Reset stream state completely before starting new stream
      currentStream.controller = null;
      currentStream.sessionId = null;
      currentStream.messageId = null;
      currentStream.isActive = false;
      currentStream.startTime = null;
      currentStream.lastActivity = null;
const abortSignal = options.abortSignal || new GlobalAbortController().signal;

try {
// Connect to streaming endpoint with proper SSE headers
const response = await fetch(endpoint, {
method: "POST",
headers: {
"Content-Type": "application/json",
"Accept": "text/event-stream",
},
body: JSON.stringify(requestBody),
credentials: "include",
signal: abortSignal
});

// Validate proper response
if (!response.ok) {
const errorText = await response.text();
console.error("Streaming API error:", errorText);
throw createAPIError('api', `API error: ${response.status} ${response.statusText}`);
}

// Check for proper content type
const contentType = response.headers.get("content-type");
if (contentType && contentType.includes("text/html")) {
console.error("Received HTML instead of streaming data:", contentType);
throw createAPIError('api', "Server returned HTML instead of streaming data. The API route may be misconfigured.");
}

// Handle the streaming response
const reader = response.body?.getReader();
if (!reader) {
throw createAPIError('api', "Unable to get response reader");
}

const decoder = new TextDecoder();
let currentEvent = null;
let buffer = '';

// Process SSE chunks correctly
        while (true) {
          // Check for abort signal before each read
          if (abortSignal.aborted) {
            console.debug("Stream aborted, breaking read loop");
            break;
          }

          const { done, value } = await reader.read();
          if (done) {
            console.log("Stream reading complete");
            break;
          }

          // Decode chunk and add to buffer
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          // Process complete lines in the buffer
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep the last possibly incomplete line

          for (const line of lines) {
            const trimmedLine = line.trim();
            // Skip empty lines and comments
            if (!trimmedLine || trimmedLine.startsWith(':')) continue;

            // Event line
            if (trimmedLine.startsWith('event:')) {
              currentEvent = trimmedLine.substring(6).trim();
              continue;
            }

            // Data line
            if (trimmedLine.startsWith('data:')) {
              const jsonData = trimmedLine.substring(5).trim();

              // Handle [DONE] sentinel first
              if (jsonData === '[DONE]') {
                console.log("Received [DONE] sentinel, ending stream");
                break;
              }

              try {
                const data = JSON.parse(jsonData);

                // Process based on current event type
                if (currentEvent === 'chunk' && data.text) {
                  // Accumulate text chunks
                  accumulatedText += data.text;
                  console.debug(`[SSE] Received chunk: "${data.text.substring(0, 50)}..." (${data.text.length} chars)`);

                  // CRITICAL FIX: Immediately update UI with current accumulated text
                  onStreamingUpdate(accumulatedText, { 
                    isStreaming: true, 
                    isComplete: false,
                    chunkReceived: true,
                    totalLength: accumulatedText.length
                  });
                } else if (currentEvent === 'done') {
                  // Capture metadata from the done event
                  metadata = { 
                    ...metadata, 
                    ...data,
                    isComplete: true,
                    completed: true,
                    status: 'delivered',
                    error: false
                  };
                  console.log("Stream completed with metadata:", data);

                  // Final update with complete text
                  onStreamingUpdate(accumulatedText, { 
                    isStreaming: false, 
                    isComplete: true,
                    status: 'delivered',
                    error: false,
                    ...metadata
                  });
                } else if (currentEvent === 'config') {
                  // Store session info from config
                  metadata = { ...metadata, ...data };
                  // CRITICAL: Capture server sessionId for cancellation
                  if (data.sessionId) {
                    currentStream.sessionId = data.sessionId;
                    console.debug("[LLM] Captured server sessionId for cancellation:", data.sessionId);
                  }
                  console.log("Received config:", data);
                } else if (currentEvent === 'error') {
                  console.error("Stream error:", data.error);
                  throw createAPIError('streaming', data.error || "Unknown streaming error");
                }
              } catch (parseError) {
                console.error("Failed to parse SSE JSON:", jsonData, parseError);
              }
            }
          }
        }

return {
content: accumulatedText,
metadata: {
requestTime: metadata.requestTime || 0,
sessionId: metadata.sessionId,
isHighRisk: requestBody.isHighRisk,
attemptsMade: 1,
modelName: metadata.model || 'deepseek-chat',
usage: metadata.tokensEstimate ? { total_tokens: metadata.tokensEstimate } : undefined,
...metadata
}
};
} catch (error) {
// Handle AbortError (user cancellation) differently from other errors
if (error.name === 'AbortError' || abortSignal?.aborted) {
  console.debug("Stream aborted, breaking read loop");
  // Don't throw - let the calling function handle this as a cancellation
  return;
}
console.error('[AI] Streaming error:', error);
throw error;
}
}

/**
* Global stream management object - single source of truth
* @type {{controller: AbortController|null, sessionId: string|null, messageId: string|null, isActive: boolean, startTime: number|null, lastActivity: number|null}}
*/
let currentStream = {
  controller: null,
  sessionId: null,
  messageId: null,
  isActive: false,
  startTime: null,
  lastActivity: null
};

// Reset stream state on module load to prevent conflicts
function resetStreamState() {
  if (currentStream.controller) {
    try {
      currentStream.controller.abort();
    } catch (e) {
      // Ignore abort errors during reset
    }
  }
  currentStream = {
    controller: null,
    sessionId: null,
    messageId: null,
    isActive: false
  };
}

// Call reset on module initialization
resetStreamState();

/**
* @type {ReadableStreamDefaultReader|null}
*/
let globalStreamReader = null;
/**
* Object to track message delivery state
* @type {{messageDelivered: boolean, isStopped: boolean, isError: boolean}}
*/
let messageDeliveryState = { messageDelivered: false, isStopped: false, isError: false };
// Phase 7: Client-side caching for layer results
const layerResultCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache TTL
const MAX_CACHE_SIZE = 50; // Maximum number of cached results
/**
* Creates a cache key from the message content
* @param {string} message - The user message
* @returns {string} The cache key
*/
function createCacheKey(message) {
return message.trim().toLowerCase();
}
/**
* Gets cached layer result if available and not expired
* @param {string} message - The user message
* @returns {object|null} Cached layer result or null
*/
function getCachedLayerResult(message) {
const key = createCacheKey(message);
const cached = layerResultCache.get(key);
if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
console.debug('[Cache] Using cached layer result for:', message.substring(0, 50) + '...');
return cached.result;
}
if (cached) {
layerResultCache.delete(key); // Remove expired entry
}
return null;
}
/**
* Stores layer result in cache with TTL
* @param {string} message - The user message
* @param {object} result - The layer result to cache
*/
function setCachedLayerResult(message, result) {
const key = createCacheKey(message);
// Enforce cache size limit with LRU eviction
if (layerResultCache.size >= MAX_CACHE_SIZE) {
const firstKey = layerResultCache.keys().next().value;
layerResultCache.delete(firstKey);
}
layerResultCache.set(key, {
result: result,
timestamp: Date.now()
});
console.debug('[Cache] Stored layer result for:', message.substring(0, 50) + '...');
}
/**
* Stops the current streaming request if one is in progress
* @returns {boolean} Whether a streaming request was stopped
*/
/**
* Stop the current streaming message generation
* @param {boolean} [isDelivered=false] - Whether the message has already been delivered
* @returns {boolean} Whether a streaming request was aborted
*/
function stopStreaming(isDelivered = false) {
  console.debug('[LLM] stopStreaming called', { 
    hasController: !!currentStream.controller,
    isActive: currentStream.isActive,
    sessionId: currentStream.sessionId 
  });

  // Check if we have an active stream - be more lenient to catch edge cases
  if (!currentStream.controller) {
    console.warn('[LLM] No active stream controller to stop');
    return false;
  }

  // Store references before clearing to prevent race conditions
  const controllerToAbort = currentStream.controller;
  const sessionToCancel = currentStream.sessionId;
  const messageIdToStop = currentStream.messageId;

  // Mark stream as inactive IMMEDIATELY to prevent race conditions
  currentStream.isActive = false;

  // Update message delivery state
  messageDeliveryState.messageDelivered = isDelivered;
  messageDeliveryState.isStopped = true;
  messageDeliveryState.isError = false;

  console.debug(`[LLM] Stopping stream for session: ${sessionToCancel}, message: ${messageIdToStop}`);

  // Clear any pending timeouts immediately
  if (typeof window !== 'undefined' && window.globalErrorTimeout) {
    console.debug("Clearing global error timeout on stop");
    clearTimeout(window.globalErrorTimeout);
    window.globalErrorTimeout = null;
  }

  // Cancel the reader if it exists
  if (typeof window !== 'undefined' && window.globalStreamReader) {
    try {
      console.debug("STOP_AI: Cancelling active reader immediately");
      window.globalStreamReader.cancel("User cancelled");
      window.globalStreamReader = null;
    } catch (e) {
      console.debug("Reader already cancelled or unavailable:", e?.message || e);
    }
  }

  // Abort the client-side streaming request FIRST
  try {
    controllerToAbort.abort(isDelivered ? 'message_complete' : 'user_cancelled');
    console.debug("STOP_AI: Streaming request aborted successfully");
  } catch (error) {
    console.warn("STOP_AI: Error aborting controller:", error);
  }

  // Send server-side cancellation request IMMEDIATELY (don't wait for promises)
  if (sessionToCancel) {
    console.debug(`[LLM] Sending immediate server-side cancellation for session: ${sessionToCancel}`);

    // Fire and forget - don't wait for the response
    fetch(`/api/chat/cancel/${sessionToCancel}`, { 
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'user_cancelled' }),
      signal: AbortSignal.timeout(2000) // Shorter timeout
    }).then(response => {
      if (response.ok) {
        console.debug(`[LLM] Server-side cancellation successful for session: ${sessionToCancel}`);
      } else {
        console.warn(`[LLM] Server-side cancellation failed with status: ${response.status}`);
      }
    }).catch(error => {
      console.warn("[LLM] Server-side cancellation request failed:", error.message);
    });

    // Also try direct termination via additional endpoint
    fetch(`/api/chat/stream/terminate`, {
      method: "POST", 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: sessionToCancel }),
      signal: AbortSignal.timeout(1000)
    }).catch(() => {}); // Silent fallback
  }

  // Clear the stream state
  currentStream.controller = null;
  currentStream.sessionId = null;
  currentStream.messageId = null;

  return true;
}
/**
* Handles streaming request with real-time updates
* @param {string} message - User message
* @param {Array<Message>} history - Conversation history
* @param {QueryIntent} queryIntent - Query intent analysis
* @param {Function} onStreamingUpdate - Callback for streaming updates
* @param {number} startTime - Request start timestamp
* @param {AbortSignal} [signal] - Optional abort signal to cancel the request
* @returns {Promise<{content: string, metadata: object}>} The final AI response
*/
async function handleStreamingRequest(message, history, queryIntent, onStreamingUpdate, startTime, signal) {
// First apply any disclaimers to the beginning of the response
let accumulatedText = '';
const disclaimer = queryIntent.disclaimer || '';
let metadata = {};
// Track completion status to prevent redundant error states
let messageDelivered = false;
let errorTimeout = null;
if (disclaimer) {
// Initialize accumulated text with disclaimer
accumulatedText = disclaimer + '\n\n';
// Send initial update with the disclaimer text
onStreamingUpdate(accumulatedText, { isStreaming: true, isComplete: false });
}
try {
// Create a new AbortController for this request
const newController = new GlobalAbortController();
currentStream.controller = newController;
currentStream.isActive = true;
currentStream.startTime = Date.now();
currentStream.lastActivity = Date.now();
// Use the provided signal or the one from our controller
const abortSignal = signal || newController.signal;
// Set an error timeout to handle real connection issues
// This will be cleared if 'done' event is received
errorTimeout = window.setTimeout(() => {
// Only trigger error if message hasn't been delivered yet
if (!messageDelivered) {
console.debug("Stream timeout - no complete response received within timeout period");
// Only abort if not already aborted
if (currentStream.controller && !abortSignal.aborted) {
currentStream.controller.abort('timeout');
}
}
}, 120000); // 120 second timeout to allow complete medical responses
// Store reference globally for immediate cleanup
if (typeof window !== 'undefined') {
  window.globalErrorTimeout = errorTimeout;
}
// Set up abort handling for when the request is canceled
const onAbort = () => {
console.debug("AI stream request aborted");
// Check if this was a timeout vs user cancellation
const isTimeoutAbort = currentStream.controller?.signal?.reason === 'timeout';
const cancelMessage = isTimeoutAbort ? 
"Response timed out. The medical information may be incomplete. Please try asking again or rephrase your question." :
"AI response cancelled by user.";
// Update UI immediately for instant response - no setTimeout delay
onStreamingUpdate(accumulatedText || cancelMessage, { 
isStreaming: false, 
isComplete: true,
isCancelled: true,
status: isTimeoutAbort ? 'timeout' : 'cancelled',
cancelledByUser: !isTimeoutAbort,
isTimeout: isTimeoutAbort,
error: false, // Explicitly set error to false to prevent error handling
reason: isTimeoutAbort ? 'timeout' : 'user_cancelled'
});
// Return from the function early to prevent further processing
return true;
};
// Listen for abort events
abortSignal.addEventListener('abort', onAbort);
// Connect to streaming endpoint with explicit headers and abort signal
const response = await fetch("/api/chat/stream", {
method: "POST",
headers: {
"Content-Type": "application/json",
"Accept": "text/event-stream",
"X-Session-Id": options?.sessionId || onStreamingUpdate?.sessionId || `session_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`
},
body: JSON.stringify({
message: message,
conversationHistory: history,
isHighRisk: queryIntent.isHighRisk || queryIntent.isMentalHealthCrisis,
stream: true,
metadata: {
queryIntent: extractQueryIntentMetadata(queryIntent)
}
}),
credentials: "include",
signal: abortSignal // Add the abort signal
});
// Validate proper response
if (!response.ok) {
const errorText = await response.text();
console.error("Streaming API error:", errorText);
throw new Error(`API error: ${response.status} ${response.statusText}`);
}
// Check for HTML response by looking at content-type
const contentType = response.headers.get("content-type");
if (contentType && contentType.includes("text/html")) {
console.error("Received HTML instead of streaming data:", contentType);
throw new Error("Server returned HTML instead of streaming data. The API route may be misconfigured.");
}
// Handle the streaming response
if (!response.body) {
  throw new Error("Response body is null - streaming not supported");
}
const reader = response.body.getReader();
if (typeof window !== 'undefined') {
  window.globalStreamReader = reader; // Track for immediate cancellation
}
const decoder = new window.TextDecoder();
// Initialize the SSE processing state
let currentEvent = null;
let buffer = '';
// Process SSE chunks correctly
        while (true) {
          // Check for abort signal before each read
          if (abortSignal.aborted) {
            console.debug("Stream aborted, breaking read loop");
            break;
          }

          const { done, value } = await reader.read();
          if (done) {
            console.log("Stream reading complete");
            break;
          }

          // Decode chunk and add to buffer
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          // Process complete lines in the buffer
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep the last possibly incomplete line

          for (const line of lines) {
            const trimmedLine = line.trim();
            // Skip empty lines and comments
            if (!trimmedLine || trimmedLine.startsWith(':')) continue;

            // Event line
            if (trimmedLine.startsWith('event:')) {
              currentEvent = trimmedLine.substring(6).trim();
              continue;
            }

            // Data line
            if (trimmedLine.startsWith('data:')) {
              const jsonData = trimmedLine.substring(5).trim();

              // Handle [DONE] sentinel first
              if (jsonData === '[DONE]') {
                console.log("Received [DONE] sentinel, ending stream");
                break;
              }

              try {
                const data = JSON.parse(jsonData);

                // Process based on current event type
                if (currentEvent === 'chunk' && data.text) {
                  // Accumulate text chunks
                  accumulatedText += data.text;
                  console.debug(`[SSE] Received chunk: "${data.text.substring(0, 50)}..." (${data.text.length} chars)`);

                  // CRITICAL FIX: Immediately update UI with current accumulated text
                  onStreamingUpdate(accumulatedText, { 
                    isStreaming: true, 
                    isComplete: false,
                    chunkReceived: true,
                    totalLength: accumulatedText.length
                  });
                } else if (currentEvent === 'done') {
                  // Capture metadata from the done event
                  metadata = { 
                    ...metadata, 
                    ...data,
                    isComplete: true,
                    completed: true,
                    status: 'delivered',
                    error: false
                  };
                  console.log("Stream completed with metadata:", data);

                  // Final update with complete text
                  onStreamingUpdate(accumulatedText, { 
                    isStreaming: false, 
                    isComplete: true,
                    status: 'delivered',
                    error: false,
                    ...metadata
                  });
                } else if (currentEvent === 'config') {
                  // Store session info from config
                  metadata = { ...metadata, ...data };
                  // CRITICAL: Capture server sessionId for cancellation
                  if (data.sessionId) {
                    currentStream.sessionId = data.sessionId;
                    console.debug("[LLM] Captured server sessionId for cancellation:", data.sessionId);
                  }
                  console.log("Received config:", data);
                } else if (currentEvent === 'error') {
                  console.error("Stream error:", data.error);
                  throw new Error(data.error || "Unknown streaming error");
                }
              } catch (parseError) {
                console.error("Failed to parse SSE JSON:", jsonData, parseError);
              }
            }
          }
        }
// Clear the global abort controller and reader since we're done with the fetch
if (globalStreamReader) {
try { 
globalStreamReader.cancel(); 
console.debug("Stream reader cancelled on completion");
} catch (e) {
console.debug("Reader was already cancelled:", e.message);
}
globalStreamReader = null;
}
// Reset stream state
currentStream.controller = null;
currentStream.sessionId = null;
currentStream.messageId = null;
currentStream.isActive = false;
// Final update with complete flag
const requestTime = Date.now() - startTime;
// Check if the request was cancelled
const isCancelled = abortSignal && abortSignal.aborted;
// Check if we have any accumulated text - sometimes the done event might arrive before any text
if (isCancelled && !accumulatedText) {
// If cancelled with no content, show cancellation message
accumulatedText = "AI response cancelled.";
} else if (!accumulatedText && disclaimer) {
// If we only have the disclaimer but no AI response, provide a fallback message
accumulatedText = disclaimer + "\n\nI apologize, but I'm having trouble generating a response right now. Please try again in a moment.";
} else if (!accumulatedText) {
// If no text at all, provide a simple error message
accumulatedText = "I apologize, but I'm having trouble generating a response right now. Please try again in a moment.";
}
// Create final metadata
const finalMetadata = createResponseMetadata(requestTime, {
model: metadata.model || "deepseek-chat",
isStreaming: false,
requestTime: metadata.requestTime || requestTime,
tokensEstimate: metadata.tokensEstimate || 0,
completed: isCancelled ? false : (metadata.completed !== false), // Mark as incomplete if cancelled
isCancelled: isCancelled,
status: isCancelled ? 'stopped' : (metadata.error ? 'failed' : 'delivered')
}, queryIntent);
// Only mark as complete if no explicit error was received and not cancelled
const isComplete = !isCancelled && metadata.error !== true;
// Signal completion
onStreamingUpdate(accumulatedText, { 
isStreaming: false, 
isComplete: isComplete,
isCancelled: isCancelled,
status: isCancelled ? 'stopped' : (metadata.error ? 'failed' : 'delivered'),
...finalMetadata
});
// Return a properly formatted response object
const messageResponse = {
content: accumulatedText,
metadata: finalMetadata
};
return messageResponse;
} catch (error) {
// Clear the abort controller and reader
if (globalStreamReader) {
try { globalStreamReader.cancel(); } catch {}
globalStreamReader = null;
}
if (currentStream.controller) {
currentStream.controller = null;
}
// If message was already successfully delivered (done event received),
// don't show error message to the user
if (messageDelivered) {
console.log("Ignoring error after successful message delivery:", error);
// Create an error object with messageDelivered flag to prevent error display
// This allows higher-level handlers to avoid showing errors for delivered messages
const deliveredError = createAPIError(
"none", 
"Message already delivered", 
{ 
originalError: error,
messageDelivered: true,
deliveredContent: accumulatedText
}
);
// Set the messageDelivered flag directly on the error object
deliveredError.messageDelivered = true;
deliveredError.deliveredContent = accumulatedText;
throw deliveredError;
}
// Check if this was a cancellation by the user or if the message was already delivered
// Improved AbortError detection - check both signal state and error type
const isAbortError = error.name === 'AbortError' || error.message?.includes('aborted');
const isCancelled = (signal && signal.aborted) || isAbortError;
const wasDelivered = messageDeliveryState.messageDelivered === true;
// If the message was already delivered, we should preserve that state
// and not show any error or cancellation UI
if (wasDelivered) {
console.debug("Ignoring abort for message that was already delivered");
// Use the existing content (no changes)
onStreamingUpdate(accumulatedText, { 
isStreaming: false, 
isComplete: true,
isCancelled: false,
status: 'delivered',
error: false
});
// Success status is already communicated via onStreamingUpdate above
// No additional return object needed as we're using callbacks
}
else if (isCancelled) {
console.debug("Stream was cancelled by user - not treating as error");
// Handle cancellation gracefully
onStreamingUpdate(accumulatedText || "AI response cancelled by user.", { 
isStreaming: false, 
isComplete: true,
isCancelled: true,
status: 'cancelled',
cancelledByUser: true,
error: false,
reason: 'user_cancelled'
});
// Return a clean result instead of throwing an error
const cancelledResponse = {
content: accumulatedText || "AI response cancelled by user.",
metadata: {
isCancelled: true,
cancelledByUser: true,
status: 'cancelled',
cancelled: true
}
};
return cancelledResponse;
} else if (errorTimeout) {
// Clear any pending error timeout since we're handling the error now
safeClearTimeout(errorTimeout);
errorTimeout = null;
// Check if this was a timeout abort
const isTimeout = error.name === 'AbortError' && 
signal.reason === 'timeout';
if (isTimeout) {
console.error("Stream timed out - no response received within timeout period");
// Handle timeout differently from other errors
onStreamingUpdate(accumulatedText || "I apologize, but the response is taking longer than expected. Please try again.", {
isStreaming: false,
isComplete: true,
status: 'failed',
error: true,
errorType: 'timeout'
});
throw createAPIError(
"timeout", 
"The AI service took too long to respond. Please try again.", 
{ originalError: error }
);
}
// This is a genuine error, not a user cancellation or timeout
console.error("Streaming error:", error);
// Before throwing error, make sure we set the complete flag to stop any pending animation
// This ensures the UI won't remain in a pending state if there's an error
onStreamingUpdate(accumulatedText || "I'm sorry, an error occurred while generating the response.", { 
isStreaming: false, 
isComplete: true,
isError: true,
error: error.message,
errorType: 'streaming_error',
status: 'failed'
});
throw error; // Let the main function handle retries
}
}
}
/**
* Retry API request with exponential backoff
* @param {string} endpoint - API endpoint
* @param {string} message - User message
* @param {Array<Message>} history - Conversation history
* @param {boolean} isHighRisk - Whether the message contains high-risk terms
* @param {QueryIntent} [queryIntent] - Query intent analysis results
* @returns {Promise<APIResponse>} API response with metadata
* @throws {APIErrorDetails} Standardized error if all retries fail
*/
async function retryApiRequest(endpoint, message, history, isHighRisk, queryIntent = null) {
const config = getDeepSeekConfig();
// Use withExponentialBackoff helper to manage retries
return await withExponentialBackoff(
async (attempt) => {
// Start timing the request
const startTime = Date.now();
// Include query intent data if available
const requestBody = { 
message,
conversationHistory: history,
isHighRisk,
// Add query intent metadata if available
...(queryIntent && { 
metadata: {
queryIntent: extractQueryIntentMetadata(queryIntent),
attemptCount: attempt + 1
}
})
};
const response = await apiRequest("POST", endpoint, requestBody);
const data = await response.json();
// Calculate request time
const requestTime = Date.now() - startTime;
// Add disclaimers based on query intent
const finalContent = addDisclaimers(data.response, queryIntent);
// Create standardized response metadata with attempt count
const metadata = createResponseMetadata(requestTime, data, queryIntent, { 
attemptCount: attempt + 1
});
// Return standardized response
return { content: finalContent, metadata };
},
// Configuration for exponential backoff
config.maxRetries,
config.retryDelay,
// Callback to log retry attempts
(error, attempt, delay) => {
console.error(`API retry attempt ${attempt + 1}/${config.maxRetries} failed:`, error);
console.info(`Retrying in ${Math.round(delay/100)/10}s...`);
}
);
}
/**
* Sends a message to the LLM API directly from the client side
* Used as a fallback if the backend proxy is unavailable
* @param {string} message - The user message to send
* @param {Array<Message>} [history=[]] - Previous conversation history
* @param {QueryIntent} [queryIntent=null] - Query intent analysis results with safety information
* @returns {Promise<APIResponse>} The AI response with metadata
* @throws {APIErrorDetails} Standardized error object if request fails
*/
/**
 * Enhanced sendMessage with integrated medical safety processing
 * @param {string} message - User message
 * @param {Array} history - Conversation history
 * @param {object} options - Additional options
 * @param {string} [options.region='US'] - User's region
 * @param {object} [options.demographics] - User demographics
 * @param {string} [options.sessionId] - Session identifier
 * @param {Function} [options.onStreamingUpdate] - Streaming update callback
 * @param {object} [options.abortSignal] - Abort signal for cancellation
 * @returns {Promise<object>} Enhanced response with safety processing
 */
export async function sendMessageWithSafety(message, history = [], options = {}) {
  const {
    region = 'US',
    demographics = {},
    sessionId = null,
    onStreamingUpdate = null,
    abortSignal = null,
    ...otherOptions
  } = options;

  let safetyResult = null;

  try {
    // PHASE 9: MEDICAL SAFETY PRE-PROCESSING
    console.log('[Medical Safety] Starting pre-processing...');
    safetyResult = await processMedicalSafety(message, {
      region,
      demographics,
      sessionId
    });

    // Validate safety processing completed successfully
    if (!validateSafetyProcessing(safetyResult)) {
      throw new Error('Medical safety processing validation failed');
    }

    console.log('[Medical Safety] Processing completed:', {
      triageLevel: safetyResult.safetyContext?.triageResult?.level,
      emergencyProtocol: safetyResult.emergencyProtocol,
      shouldBlock: safetyResult.shouldBlockAI
    });

    // Enhanced streaming callback that includes safety information
    const enhancedStreamingCallback = onStreamingUpdate ? (content, metadata = {}) => {
      onStreamingUpdate(content, {
        ...metadata,
        medicalSafety: {
          triageLevel: safetyResult.safetyContext?.triageResult?.level,
          emergencyProtocol: safetyResult.emergencyProtocol,
          hasWarnings: safetyResult.triageWarning !== null
        }
      });
    } : null;

    let aiResponse;

    // Check if AI should be blocked due to safety concerns
    if (safetyResult.shouldBlockAI) {
      console.log('[Medical Safety] AI blocked - using fallback response');

      // Use fallback response for safety
      aiResponse = {
        content: safetyResult.fallbackResponse.response,
        metadata: {
          source: 'medical_safety_fallback',
          blocked: true,
          reason: safetyResult.fallbackResponse.reason,
          medicalSafety: {
            triageLevel: safetyResult.safetyContext?.triageResult?.level,
            emergencyProtocol: safetyResult.emergencyProtocol,
            hasWarnings: true,
            triageWarning: safetyResult.triageWarning,
            safetyNotices: safetyResult.safetyNotices,
            routeToProvider: safetyResult.shouldRouteToProvider,
            requiresHumanReview: safetyResult.requiresHumanReview,
            priorityScore: safetyResult.priorityScore
          }
        }
      };
    } else {
      // Proceed with normal AI call
      console.log('[Medical Safety] AI approved - proceeding with request');

      try {
        aiResponse = await sendMessage(message, history, {
          ...otherOptions,
          abortSignal
        }, enhancedStreamingCallback);
      } catch (error) {
        console.error('[Medical Safety] AI call failed, attempting fallback:', error);

        // Try to fall back to original sendMessage without safety processing
        aiResponse = await sendMessage(message, history, {
          ...otherOptions,
          abortSignal
        }, onStreamingUpdate);
      }
    }

    // PHASE 9: MEDICAL SAFETY POST-PROCESSING
    if (aiResponse && aiResponse.content) {
      console.log('[Medical Safety] Starting post-processing...');
      const postProcessedResponse = await postProcessAIResponse(
        aiResponse.content, 
        safetyResult.safetyContext,
        { region, demographics }
      );

      aiResponse.content = postProcessedResponse.processedContent;

      // Merge safety metadata
      aiResponse.metadata = {
        ...aiResponse.metadata,
        medicalSafety: {
          ...aiResponse.metadata?.medicalSafety,
          ...postProcessedResponse.safetyEnhancements,
          triageLevel: safetyResult.safetyContext?.triageResult?.level,
          emergencyProtocol: safetyResult.emergencyProtocol,
          hasWarnings: safetyResult.triageWarning !== null || postProcessedResponse.safetyEnhancements.hasWarnings,
          triageWarning: safetyResult.triageWarning,
          safetyNotices: [
            ...(safetyResult.safetyNotices || []),
            ...(postProcessedResponse.safetyEnhancements.safetyNotices || [])
          ],
          routeToProvider: safetyResult.shouldRouteToProvider || postProcessedResponse.safetyEnhancements.routeToProvider,
          requiresHumanReview: safetyResult.requiresHumanReview || postProcessedResponse.safetyEnhancements.requiresHumanReview,
          priorityScore: Math.max(safetyResult.priorityScore || 0, postProcessedResponse.safetyEnhancements.priorityScore || 0)
        }
      };
    }

    return aiResponse;

  } catch (error) {
    console.error('[Medical Safety] Error in safety processing:', error);

    // If safety processing fails, fall back to regular message without safety
    try {
      return await sendMessage(message, history, {
        ...otherOptions,
        abortSignal
      }, onStreamingUpdate);
    } catch (fallbackError) {
      console.error('[Medical Safety] Fallback also failed:', fallbackError);
      throw fallbackError;
    }
  }
}

/**
 * Extract medical safety information from enhanced response
 * @param {object} response - Enhanced response from sendMessageWithSafety
 * @returns {object} Medical safety information for UI components
 */
function extractMedicalSafetyInfo(response) {
  const safetyInfo = response.metadata?.medicalSafety;

  if (!safetyInfo) {
    return {
      hasWarnings: false,
      emergencyProtocol: false,
      safetyNotices: [],
      triageWarning: null,
      routeToProvider: false
    };
  }

  return {
    hasWarnings: safetyInfo.triageWarning !== null || safetyInfo.emergencyProtocol,
    emergencyProtocol: safetyInfo.emergencyProtocol,
    triageLevel: safetyInfo.triageLevel,
    safetyNotices: safetyInfo.safetyNotices || [],
    triageWarning: safetyInfo.triageWarning,
    routeToProvider: safetyInfo.routeToProvider,
    requiresHumanReview: safetyInfo.requiresHumanReview,
    priorityScore: safetyInfo.priorityScore
  };
}

/**
 *
 * @param message
 * @param history
 * @param queryIntent
 */
async function sendMessageClientSide(message, history = [], queryIntent = null) {
const config = getDeepSeekConfig();
// Default isHighRisk if no query intent
const isHighRisk = queryIntent ? (queryIntent.isHighRisk || queryIntent.isMentalHealthCrisis) : false;
if (!config.apiKey) {
throw createAPIError(
"configuration", 
"DeepSeek API key is missing. Please set the DEEPSEEK_API_KEY environment variable."
);
}
// Create customized prompt based on query intent if available
const customPrompt = queryIntent ? createCustomPrompt(queryIntent) : '';
// Prepare messages with custom prompt if available
const messages = prepareMessages(message, history, true, customPrompt);
// Use withExponentialBackoff helper for client-side retries
return await withExponentialBackoff(
async (attempt) => {
// Start timing the request
const startTime = Date.now();
const response = await fetch(config.endpoint, {
method: "POST",
headers: {
"Content-Type": "application/json",
"Authorization": `Bearer ${config.apiKey}`,
},
body: JSON.stringify({
model: config.model,
messages: messages,
temperature: config.temperature,
max_tokens: config.maxTokens,
}),
});
if (!response.ok) {
const errorText = await response.text();
throw createAPIError(
"api", 
`DeepSeek API error (${response.status}): ${errorText}`,
{ status: response.status }
);
}
const data = await response.json();
const rawContent = data.choices[0]?.message?.content || 
"I apologize, but I couldn't generate a response. Please try again later.";
// Calculate request time
const requestTime = Date.now() - startTime;
// Add appropriate disclaimers using helper function
const finalContent = addDisclaimers(rawContent, queryIntent, isHighRisk);
// Create standardized response metadata using helper function
const metadata = createResponseMetadata(
requestTime, 
data, 
queryIntent, 
{ 
clientSide: true,
attemptCount: attempt + 1,
modelName: data.model || config.model
}
);
// Return standardized response format
return { content: finalContent, metadata };
},
// Use client-side retry configuration with fewer retries
Math.min(config.maxRetries, 2), // Limit client-side retries
config.retryDelay,
// Log retry attempts
(error, attempt, delay) => {
console.error(`Client-side API retry attempt ${attempt + 1}/2 failed:`, error);
console.info(`Retrying direct API call in ${Math.round(delay/100)/10}s...`);
}
).catch(error => {
// Handle network errors separately from API errors using our type guards
if (isAPIError(error)) {
// If it's already our standardized error, just re-throw it
throw error;
} else if (isAbortError(error)) {
throw createAPIError("timeout", "Request timed out", { originalError: error });
} else if (isError(error) && error.message && error.message.includes('NetworkError')) {
throw createAPIError("network", "Network error, please check your internet connection", { originalError: error });
} else {
// Handle any error type safely
const errorMessage = isError(error) && error.message ? 
error.message : "Unknown error occurred";
throw createAPIError("unknown", errorMessage, { originalError: error });
}
});
} // Close sendMessageClientSide function

// Additional internal exports for backward compatibility
/**
 *
 */
export { sendMessageClientSide, getFollowUpSuggestions, extractMedicalSafetyInfo, _addBasicDisclaimers, _containsHighRiskTerms, stopStreaming };