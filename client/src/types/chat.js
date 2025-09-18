/**
 * @file Comprehensive JSDoc type definitions for chat functionality
 * @description Type definitions for AI chat functionality using JSDoc
 */

/**
 * Query intent analysis metadata
 * @typedef {object} QueryIntent
 * @property {string} type - Intent type
 * @property {number} [confidence] - Confidence score
 * @property {string[]} [disclaimers] - Disclaimers array
 * @property {string} [userDemographic] - User demographic information
 * @property {boolean} [isComplete] - Whether the intent analysis is complete
 */

/**
 * Layer processing status
 * @typedef {object} LayerStatus
 * @property {string} [parseIntent] - Parse intent status
 * @property {string} [triage] - Triage status
 * @property {string} [enhancePrompt] - Enhance prompt status
 * @property {string} [llmCall] - LLM call status
 */

/**
 * Message metadata containing analysis and processing information
 * @typedef {object} MessageMetadata
 * @property {QueryIntent} [queryIntent] - Query analysis metadata
 * @property {'emergency'|'urgent'|'non_urgent'} [triageLevel] - Triage classification
 * @property {boolean} [isHighRisk] - High risk flag
 * @property {LayerStatus} [layerStatus] - Layer processing metadata
 * @property {number} [layerProcessingTime] - Layer processing time
 * @property {number} [requestTime] - Request timestamp
 * @property {number} [attemptCount] - Retry count
 * @property {boolean} [isTimeout] - Timeout flag
 * @property {boolean} [isCancelled] - Cancelled flag
 * @property {boolean} [isStreaming] - Streaming status
 * @property {string} [fallbackReason] - Fallback reason
 * @property {boolean} [delivered] - Delivery status
 * @property {number} [processingTime] - Processing timing
 * @property {number} [intentConfidence] - Intent confidence score
 * @property {string} [bodySystem] - Body system
 * @property {string[]} [symptoms] - Symptoms array
 * @property {Record<string, number>} [stageTimings] - Stage timings
 */

/**
 * Core message structure for chat messages
 * @typedef {object} Message
 * @property {string} id - Unique identifier for the message
 * @property {string} content - The message text content
 * @property {boolean} isUser - Whether the message is from the user (true) or AI (false)
 * @property {Date} timestamp - When the message was created
 * @property {boolean} [isError] - Whether this is an error message
 * @property {'sent'|'delivered'|'pending'|'failed'|'stopped'} [status] - Message status
 * @property {boolean} [isHighRisk] - Whether this message contains high-risk content
 * @property {MessageMetadata} [metadata] - Additional metadata about the message
 * @property {string} [originalMessage] - Original message text (for error messages)
 * @property {boolean} [isStreaming] - Whether this message is currently streaming
 * @property {string} [sessionId] - Session ID for this message
 * @property {boolean} [isRetry] - Whether this message is a retry attempt
 * @property {boolean} [isCancelled] - Whether this message was cancelled
 */

/**
 * Props for the MessageBubble component
 * @typedef {object} MessageBubbleProps
 * @property {string} message - The message content
 * @property {boolean} isUser - Whether the message is from the user
 * @property {Date} [timestamp] - When the message was sent
 * @property {boolean} [isError] - Whether this is an error message
 * @property {boolean} [isHighRisk] - Whether this is a high-risk medical query
 * @property {MessageMetadata} [metadata] - Additional message metadata
 * @property {string} [originalMessage] - The original message that failed (for error messages)
 * @property {(messageToRetry?: string) => void} [onRetry] - Function to call when retry button is clicked
 * @property {(suggestion: string) => void} [onFollowUpClick] - Function to call when a follow-up suggestion is clicked
 * @property {(event: React.MouseEvent<HTMLButtonElement>) => void} [onStopAI] - Function to call when stopping AI response
 * @property {boolean} [isStoppingAI] - Whether the AI response is being stopped
 * @property {boolean} [showFollowUps] - Whether to show follow-up suggestions
 * @property {boolean} [isFirst] - Whether this is the first message in a sequence
 * @property {boolean} [isLast] - Whether this is the last message in a sequence
 * @property {string} [className] - Additional CSS classes
 * @property {boolean} [isStreaming] - Whether this message is being streamed character by character
 * @property {string} [partialContent] - Partial content during streaming
 * @property {string} [status] - Message status
 * @property {string} [sessionId] - Session ID
 * @property {string} [messageId] - Message ID
 * @property {string} [streamingMessageId] - Streaming message ID
 * @property {string} [userQuery] - User query
 * @property {string} [userRole] - User role
 */

/**
 * Streaming callback function type
 * @typedef {(content?: string, metadata?: MessageMetadata) => void} StreamingCallback
 */

/**
 * API error response structure
 * @typedef {object} APIErrorResponse
 * @property {string} type - Error type
 * @property {string} message - Error message
 * @property {number} [status] - HTTP status code
 * @property {any} [originalError] - Original error object
 */

/**
 * Button click event handler
 * @typedef {(event: React.MouseEvent<HTMLButtonElement>) => void} ButtonClickHandler
 */

/**
 * Input change event handler
 * @typedef {(event: React.ChangeEvent<HTMLInputElement>) => void} InputChangeHandler
 */

/**
 * Form submit event handler
 * @typedef {(event: React.FormEvent<HTMLFormElement>) => void} FormSubmitHandler
 */

/**
 * LLM API module interface
 * @typedef {object} LLMApiModule
 * @property {(query: string, conversationHistory: ConversationHistory, onStreamCallback: StreamingCallback, sessionId: string) => Promise<void>} sendMessageClientSide - Send message to LLM API
 */

/**
 * Array of messages
 * @typedef {Message[]} MessageList
 */

/**
 * Conversation history format
 * @typedef {Array<{role: string, content: string}>} ConversationHistory
 */

// Export types for ES6 imports (these are just comments for JSDoc, actual exports don't exist in pure JS)
/**
 *
 */
export {};