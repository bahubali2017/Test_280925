/* global setTimeout */
import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '../lib/utils';
import { getContextualFollowups, getProfessionalFollowups } from '../lib/suggestions';
import { isDebug, trace } from '../lib/debug-flag.js';
import { selectDisclaimers } from '../lib/disclaimers.js';
import { submitFeedback } from '../lib/feedback-api.js';

/**
 * @typedef {'user'|'assistant'|'system'} RoleType
 */

/**
 * @typedef {object} QueryIntent
 * @property {string} [type] - Intent type
 * @property {number} [confidence] - Confidence score
 * @property {string[]} [disclaimers] - Disclaimers
 * @property {string[]} [suggestions] - Follow-up suggestions
 * @property {boolean} [isProfessionalQuery] - Whether this is a professional query
 * @property {object} [atd] - Advice to doctor data
 * @property {string} [atd.atdReason] - ATD reason
 */

/**
 * @typedef {object} MessageMetadata
 * @property {QueryIntent} [queryIntent] - Query analysis results
 * @property {'emergency'|'urgent'|'non_urgent'} [triageLevel] - Triage classification
 * @property {boolean} [isHighRisk] - High risk flag
 * @property {object} [layerStatus] - Layer processing status
 * @property {number} [layerProcessingTime] - Processing time
 * @property {string} [fallbackReason] - Fallback reason
 * @property {number} [requestTime] - Request timestamp
 * @property {number} [attemptCount] - Retry count
 * @property {boolean} [isCancelled] - Cancelled flag
 * @property {boolean} [isTimeout] - Timeout flag
 * @property {boolean} [delivered] - Delivery status
 * @property {boolean} [isStreaming] - Streaming status
 * @property {boolean} [canExpand] - Whether message can be expanded
 * @property {string} [questionType] - Question type
 * @property {string} [responseMode] - Response mode
 * @property {boolean} [forceShowDisclaimers] - Force show disclaimers
 */

/**
 * @typedef {object} Message
 * @property {string} id - Message identifier
 * @property {RoleType} role - Message role
 * @property {string} content - Message content
 * @property {Date} [timestamp] - Message timestamp
 * @property {boolean} [isStreaming] - Whether streaming
 * @property {MessageMetadata} [metadata] - Message metadata
 * @property {string[]} [safetyFlags] - Safety flags
 * @property {boolean} [disclaimerShown] - Whether disclaimer was shown
 */

/**
 * @typedef {object} MessageBubbleProps
 * @property {string} message - The message content
 * @property {boolean} isUser - Whether the message is from the user
 * @property {Date} [timestamp] - When the message was sent
 * @property {boolean} [isError] - Whether this is an error message
 * @property {boolean} [isHighRisk] - Whether this is a high-risk medical query
 * @property {MessageMetadata} [metadata] - Additional message metadata
 * @property {string} [originalMessage] - The original message that failed
 * @property {() => void} [onRetry] - Function to call when retry button is clicked
 * @property {(suggestion: string) => void} [onFollowUpClick] - Function to call when follow-up clicked
 * @property {(event: React.MouseEvent<HTMLButtonElement>) => void} [onStopAI] - Function to call when stopping AI
 * @property {boolean} [isStoppingAI] - Whether the AI response is being stopped
 * @property {boolean} [showFollowUps] - Whether to show follow-up suggestions
 * @property {boolean} [isFirst] - Whether this is the first message in a sequence
 * @property {boolean} [isLast] - Whether this is the last message in a sequence
 * @property {string} [className] - Additional CSS classes
 * @property {boolean} [isStreaming] - Whether this message is being streamed
 * @property {string} [partialContent] - Partial content during streaming
 * @property {'sent'|'delivered'|'failed'|'stopped'|'stopping'|'cancelled'} [status] - Message status
 * @property {string} [sessionId] - Session identifier
 * @property {string} [messageId] - Message identifier
 * @property {string} [streamingMessageId] - Streaming message identifier
 * @property {string} [userQuery] - User query text
 * @property {string} [userRole] - User role
 * @property {boolean} [isCollapsed] - Whether message is collapsed
 */

/**
 * Helper to format message content using ReactMarkdown
 * @param {string} content - The message content
 * @param {boolean} [isStreaming=false] - Whether content is being streamed
 * @param {'sent'|'delivered'|'failed'|'stopped'|'stopping'|'cancelled'} [status='sent'] - Message status
 * @returns {React.ReactNode} Formatted content with proper Markdown rendering
 */
function formatMessageContent(content, isStreaming = false, status = 'sent') {
  const rawContent = content;

  if (!rawContent) return null;

  // For streaming, show content as it updates, otherwise show full content
  const displayContent = isStreaming ? rawContent : rawContent;


  return (
    <div className="relative" data-status={status}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children, ...props }) => (
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white" {...props}>{children}</h1>
          ),
          h2: ({ children, ...props }) => (
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white" {...props}>{children}</h2>
          ),
          h3: ({ children, ...props }) => (
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white" {...props}>{children}</h3>
          ),
          p: ({ children, ...props }) => (
            <p className="text-foreground dark:text-foreground" {...props}>{children}</p>
          ),
          ul: ({ children, ...props }) => (
            <ul className="list-disc ml-6" {...props}>{children}</ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className="list-decimal ml-6" {...props}>{children}</ol>
          ),
          li: ({ children, ...props }) => (
            <li className="text-foreground dark:text-foreground" {...props}>{children}</li>
          ),
          strong: ({ children, ...props }) => (
            <strong className="font-bold text-gray-900 dark:text-white" {...props}>{children}</strong>
          ),
          em: ({ children, ...props }) => (
            <em className="italic text-foreground dark:text-foreground" {...props}>{children}</em>
          ),
          blockquote: ({ children, ...props }) => (
            <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600 dark:text-gray-300" {...props}>{children}</blockquote>
          ),
          code: ({ children, className, ...props }) => {
            const isInline = !className || !className.includes('language-');
            return isInline ? (
              <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono" {...props}>{children}</code>
            ) : (
              <code className="block bg-gray-100 dark:bg-gray-800 p-3 rounded-md text-sm font-mono overflow-x-auto" {...props}>{children}</code>
            );
          },
        }}
      >
        {displayContent}
      </ReactMarkdown>
    </div>
  );
}

/**
 * Format a timestamp into a readable format
 * @param {Date} date - The date to format
 * @returns {string} The formatted date string
 */
function formatTimestamp(date) {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return '';
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Format time as HH:MM
  const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (date >= today) {
    return `Today, ${timeString}`;
  } else if (date >= yesterday) {
    return `Yesterday, ${timeString}`;
  } else {
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

/**
 * Get bubble styling classes based on role and position
 * @param {RoleType} role - Message role
 * @param {boolean} isFirst - Whether first in sequence
 * @param {boolean} isLast - Whether last in sequence
 * @returns {{rounding: string, padding: string, animation: string}} Styling classes
 */
function getBubbleClasses(role, isFirst, isLast) {
  const isUser = role === 'user';
  
  // Determine bubble rounding based on sequence position
  const rounding = isUser
    ? isFirst && isLast
      ? "rounded-lg"
      : isFirst
        ? "rounded-t-lg rounded-bl-lg rounded-br-sm"
        : isLast
          ? "rounded-b-lg rounded-tl-lg rounded-tr-sm"
          : "rounded-l-lg rounded-tr-sm rounded-br-sm"
    : isFirst && isLast
      ? "rounded-lg"
      : isFirst
        ? "rounded-t-lg rounded-br-lg rounded-bl-sm"
        : isLast
          ? "rounded-b-lg rounded-tr-lg rounded-tl-sm"
          : "rounded-r-lg rounded-tl-sm rounded-bl-sm";

  // Y-padding based on position in sequence
  const padding = isFirst && !isLast
    ? "pt-3 pb-2.5"
    : !isFirst && isLast
      ? "pt-2.5 pb-3"
      : isFirst && isLast
        ? "py-3"
        : "py-2.5";

  // Animation classes
  const animation = isFirst 
    ? "animate-slide-in" 
    : "animate-fade-in";

  return { rounding, padding, animation };
}

/**
 * Render medical safety notices using consolidated disclaimer system
 * @param {MessageMetadata} metadata - Message metadata
 * @param {'sent'|'delivered'|'failed'|'stopped'|'stopping'|'cancelled'} status - Message status
 * @returns {React.ReactNode} Safety notices JSX
 */
function renderSafetyNotices(metadata, status) {
  if (!metadata || status === "stopped") return null;

  // Use consolidated disclaimer system
  const triageLevel = metadata.triageLevel || 'non_urgent';
  /** @type {string[]} */
  const symptoms = [];  // Empty for now to avoid TypeScript errors  
  const disclaimerPack = selectDisclaimers(triageLevel, symptoms);
  
  const showHighRiskAlert = metadata.isHighRisk || triageLevel === 'emergency';
  const hasDisclaimers = disclaimerPack.disclaimers.length > 0;
  const hasATDNotices = disclaimerPack.atdNotices.length > 0;

  if (!showHighRiskAlert && !hasDisclaimers && !hasATDNotices) {
    return null;
  }

  return (
    <div className="mb-3">
      {/* Emergency/High-risk alert */}
      {triageLevel === 'emergency' && (
        <div className="mb-3 p-3 bg-red-100 border-2 border-red-300 rounded-md text-sm animate-pulse">
          <div className="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 mt-0.5 text-red-600 flex-shrink-0">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
            <div className="text-red-700">
              <strong>🚨 Emergency Medical Situation</strong>
              <p className="mt-1 text-sm">This appears to be an emergency. Please call emergency services immediately or go to your nearest emergency room.</p>
            </div>
          </div>
        </div>
      )}

      {/* High-risk alert */}
      {showHighRiskAlert && triageLevel !== 'emergency' && (
        <div className="mb-3 p-3 bg-destructive/10 dark:bg-destructive/20 border border-destructive/30 rounded-md text-sm">
          <div className="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 mt-0.5 text-destructive dark:text-destructive-foreground flex-shrink-0">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <div className="text-destructive dark:text-destructive-foreground">
              <strong>⚠️ High-Risk Medical Alert</strong>
              <p className="mt-1 text-sm">This appears to be a high-risk medical situation. Please seek immediate medical attention if experiencing severe symptoms.</p>
            </div>
          </div>
        </div>
      )}

      {/* Urgent triage level indicator */}
      {triageLevel === 'urgent' && (
        <div className="mb-2 p-2 rounded-md text-xs font-medium flex items-center bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800/50">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
          </svg>
          Triage Level: URGENT
        </div>
      )}

      {/* Consolidated disclaimers */}
      {hasDisclaimers && (
        <div className="mb-2 p-3 bg-amber-50 text-amber-800 border border-amber-200 rounded-md text-sm dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800/50">
          <div className="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 mt-0.5 flex-shrink-0">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 16v-4"/>
              <path d="m12 8 .01 0"/>
            </svg>
            <div>
              <strong>Medical Notice:</strong>
              <ul className="mt-1 ml-2">
                {disclaimerPack.disclaimers.map((/** @type {string} */ disclaimer, /** @type {number} */ index) => (
                  <li key={index} className="text-xs list-disc list-inside">{disclaimer}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Consolidated ATD notices */}
      {hasATDNotices && (
        <div className="mb-3 p-3 bg-blue-50 text-blue-800 border border-blue-200 rounded-md text-sm dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800/50 animate-fade-in">
          <div className="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 mt-0.5 flex-shrink-0">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10,9 9,9 8,9"/>
            </svg>
            <div>
              <strong>🩺 Healthcare Provider Notice:</strong>
              <ul className="mt-1 ml-2">
                {disclaimerPack.atdNotices.map((/** @type {string} */ notice, /** @type {number} */ index) => (
                  <li key={index} className="text-xs list-disc list-inside">{notice}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


/**
 * Get follow-up suggestions in a centralized way
 * @param {MessageMetadata} [metadata] - Message metadata
 * @param {string} originalMessage - Original message
 * @param {boolean} isUser - Whether message is from user
 * @param {string} message - Message content
 * @returns {string[]} Follow-up suggestions
 */
function getFollowUpSuggestions(metadata, originalMessage = '', isUser = false, message = '') {
  // Use medical layer suggestions if available
  if (metadata && metadata.queryIntent && metadata.queryIntent.suggestions && metadata.queryIntent.suggestions.length > 0) {
    return metadata.queryIntent.suggestions.slice(0, 4);
  }

  // If this is a professional query, use professional follow-ups
  if (metadata && metadata.queryIntent && metadata.queryIntent.isProfessionalQuery) {
    return getProfessionalFollowups(4);
  }

  // Use contextual follow-ups based on the original message content
  const userQuestion = originalMessage || (isUser ? message : '') || '';
  const suggestions = getContextualFollowups(userQuestion, [], 4) || [];
  
  // Fallback to generic medical suggestions if contextual ones aren't available
  if (!suggestions || suggestions.length === 0) {
    return [
      "What symptoms should I watch for?",
      "When should I see a doctor?",
      "Are there any home remedies?",
      "Is this condition serious?"
    ];
  }
  
  return suggestions;
}

/**
 * Message bubble component for chat messages
 * @param {MessageBubbleProps} props - The message bubble props
 * @returns {React.ReactElement} The rendered message bubble component
 */
export function MessageBubble({
  message,
  isUser,
  timestamp,
  isError = false,
  isHighRisk = false,
  metadata = {},
  originalMessage,
  onRetry,
  onFollowUpClick,
  onStopAI,
  isStoppingAI = false,
  showFollowUps = false,
  isFirst = false,
  isLast = false,
  className,
  isStreaming = false,
  partialContent: _partialContent = '',
  status = 'sent',
  sessionId = '',
  messageId = '',
  streamingMessageId: _streamingMessageId = '',
  userQuery = '',
  userRole = 'general_public'
}) {
  
  // State for feedback status
  const [feedbackStatus, setFeedbackStatus] = React.useState('');
  const [, setFeedbackType] = React.useState('');

  // Create centralized handlers
  const handleStopClick = React.useCallback((/** @type {React.MouseEvent<HTMLButtonElement>} */ e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onStopAI) onStopAI(e);
  }, [onStopAI]);

  // Centralized feedback handler using submitFeedback API
  const handleFeedback = React.useCallback(async (/** @type {string} */ feedbackType) => {
    console.log(`[Feedback] Button clicked: ${feedbackType}`);
    setFeedbackStatus('submitting');
    
    try {
      await submitFeedback({
        messageId: messageId || `msg_${Date.now()}`,
        sessionId: sessionId || 'unknown_session',
        feedbackType,
        userQuery: userQuery || 'Unknown query',
        aiResponse: message,
        userRole: userRole || 'general_public',
        responseMetadata: metadata || {}
      });
      
      console.log('[Feedback] Success via submitFeedback API');
      setFeedbackStatus('success');
      setTimeout(() => setFeedbackStatus(''), 3000);
    } catch (error) {
      console.error('[Feedback] Error submitting feedback:', error);
      setFeedbackStatus('error');
      setTimeout(() => setFeedbackStatus(''), 3000);
    }
  }, [messageId, sessionId, userQuery, message, userRole, metadata]);

  // Determine role for accessibility
  const roleAttribute = isUser 
    ? 'user message' 
    : isError 
      ? 'error message'
      : 'assistant message';

  // Get bubble styling
  const role = /** @type {RoleType} */ (isUser ? 'user' : isError ? 'system' : 'assistant');
  const { rounding, padding, animation } = getBubbleClasses(role, isFirst, isLast);

  // Memoize follow-up suggestions
  const followUpSuggestions = React.useMemo(() => 
    getFollowUpSuggestions(metadata, originalMessage, isUser, message), 
    [metadata, originalMessage, isUser, message]
  );

  // Add a data attribute for styling/debugging
  const bubbleStatus = isStreaming && status !== 'delivered' ? 'streaming' : status;

  // TRACE: Render bubble (non-intrusive)
  if (isDebug()) {
    trace('[TRACE] renderBubble', {
      status, 
      canExpand: metadata && metadata.canExpand, 
      questionType: metadata && metadata.questionType, 
      responseMode: metadata && metadata.responseMode
    });
  }

  return (
    <div 
      className={cn(
        isFirst ? "mt-3" : "mt-1.5", 
        isLast ? "mb-3" : "mb-1.5", 
        className
      )}
      role="listitem"
      aria-label={roleAttribute}
      data-status={bubbleStatus}
    >
      {isUser ? (
        <div className="flex justify-end">
          <div
            className={cn(
              `bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/25 ${rounding} px-4 ${padding} max-w-[85%] md:max-w-[75%] text-body relative transition-all duration-200 ${animation}`,
              isStreaming && status !== 'delivered' ? 'bubble--streaming' : '',
              className
            )}
            data-bubble-status={bubbleStatus}
          >
            <div className="whitespace-pre-wrap break-words">
              {formatMessageContent(message, isStreaming, status)}
            </div>

            {(timestamp || status !== 'sent') && (
              <div className="text-xs opacity-80 mt-1 text-right flex items-center justify-end gap-1">
                {status !== 'sent' && (
                  <span className={cn(
                    "inline-block text-xs font-medium",
                    status === 'delivered' ? "text-green-500" : 
                    status === 'failed' ? "text-red-500" : "text-gray-400"
                  )}>
                    {status === 'delivered' ? '✓' : 
                     status === 'failed' ? '✕' : '⋯'}
                  </span>
                )}
                {timestamp && formatTimestamp(timestamp)}
              </div>
            )}

            {isHighRisk && (
              <div className="absolute top-0 right-0 transform translate-x-1/3 -translate-y-1/3">
                <span className="inline-flex items-center justify-center w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full">
                  !
                </span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex justify-start">
          <div
            className={cn(
              status === 'cancelled' 
                ? `bg-secondary/80 dark:bg-secondary/30 text-foreground dark:text-foreground shadow-sm border-l-2 border-amber-500 ${rounding} px-4 ${padding} max-w-[85%] md:max-w-[80%] text-body relative transition-all duration-200 ${animation}`
                : `bg-secondary/80 dark:bg-secondary/30 text-foreground dark:text-foreground shadow-sm ${rounding} px-4 ${padding} max-w-[85%] md:max-w-[80%] text-body relative transition-all duration-200 ${animation}`,
              isStreaming && status !== 'delivered' ? 'bubble--streaming' : '',
              className
            )}
            data-bubble-status={bubbleStatus}
          >
            <p className="font-medium mb-2 text-foreground dark:text-foreground/90 flex items-center">
              {isError && status !== 'delivered' ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5 text-destructive">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  System Message
                </>
              ) : (
                <>
                  <img 
                    src="/favicon-32x32.png" 
                    alt="Anamnesis Neural Logo" 
                    className="mr-3 w-8 h-8" 
                    style={{ 
                      filter: 'drop-shadow(0 0 6px rgba(6, 182, 212, 0.5)) brightness(1.1)',
                      animation: 'neural-pulse 2.5s ease-in-out infinite'
                    }}
                  />
                  Medical AI Assistant
                </>
              )}
            </p>


            {/* Centralized safety notices rendering */}
            {!isUser && renderSafetyNotices(metadata, status)}

            <div className="whitespace-pre-wrap break-words">
              {formatMessageContent(message, isStreaming, status)}
            </div>

            {/* Retry button for error messages */}
            {isError && onRetry && (
              <div className="mt-3 flex justify-start">
                <button
                  onClick={onRetry}
                  className="flex items-center text-primary hover:text-primary-900 dark:hover:text-primary-500 px-3 py-1.5 rounded-md bg-primary/5 hover:bg-primary/10 dark:bg-primary/10 dark:hover:bg-primary/20 focus:ring-2 focus:ring-primary/20 transition-colors"
                  data-testid="button-retry"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Stop button for streaming responses */}
            {isStreaming && onStopAI && status !== 'stopped' && status !== 'delivered' && (
              <div className="mt-3 flex justify-start">
                <button
                  onClick={handleStopClick}
                  disabled={isStoppingAI}
                  className="flex items-center text-xs py-1 px-2.5 rounded-md bg-destructive/20 hover:bg-destructive/30 text-destructive font-medium transition-colors disabled:opacity-50"
                  data-testid="button-stop-ai"
                >
                  {isStoppingAI || status === 'stopping' ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Stopping...
                    </>
                  ) : (
                    <>
                      <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                        <rect x="6" y="6" width="12" height="12" rx="2"/>
                      </svg>
                      Stop AI
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Follow-up suggestions */}
            {showFollowUps && onFollowUpClick && !isStreaming && status !== 'stopped' && (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-medium text-foreground/70 dark:text-foreground/60">Suggested follow-ups:</p>
                <div className="flex flex-wrap gap-2">
                  {followUpSuggestions.map((/** @type {string} */ suggestion, /** @type {number} */ index) => (
                    <button
                      key={index}
                      onClick={() => onFollowUpClick(suggestion)}
                      className="px-3 py-2 bg-gradient-to-r from-cyan-50 to-cyan-100 hover:from-cyan-100 hover:to-cyan-200 dark:from-cyan-900/30 dark:to-cyan-800/30 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-700/50 hover:border-cyan-300 dark:hover:border-cyan-600/50 text-sm rounded-full transition-all duration-200 shadow-sm hover:shadow-md"
                      data-testid={`button-followup-${index}`}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Feedback buttons */}
            {!isUser && !isError && !isStreaming && status !== 'stopped' && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Was this helpful?</span>
                <div className="inline-flex gap-2">
                  <button
                    onClick={() => handleFeedback('helpful')}
                    disabled={feedbackStatus === 'submitting'}
                    className="text-green-700 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 px-2 py-1 rounded-md text-xs flex items-center active:scale-95 disabled:opacity-50 transition-all"
                    data-testid="button-feedback-helpful"
                  >
                    👍
                    <span className="ml-1">Helpful</span>
                  </button>
                  <button
                    onClick={() => handleFeedback('could_improve')}
                    disabled={feedbackStatus === 'submitting'}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 bg-gray-50 dark:bg-gray-900/20 hover:bg-gray-100 dark:hover:bg-gray-900/30 px-2 py-1 rounded-md text-xs flex items-center active:scale-95 disabled:opacity-50 transition-all"
                    data-testid="button-feedback-could-improve"
                  >
                    👎
                    <span className="ml-1">Could improve</span>
                  </button>
                </div>
                {feedbackStatus && (
                  <span className={cn(
                    "text-xs ml-2 flex items-center",
                    feedbackStatus === 'success' ? "text-green-600" :
                    feedbackStatus === 'error' ? "text-red-600" : "text-blue-600"
                  )}>
                    {feedbackStatus === 'submitting' ? (
                      <>
                        <svg className="animate-spin h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Submitting...
                      </>
                    ) : feedbackStatus === 'success' ? (
                      <>✅ Thank you for your feedback!</>
                    ) : feedbackStatus === 'error' ? (
                      <>❌ Failed to submit. Please try again.</>
                    ) : ''}
                  </span>
                )}
              </div>
            )}

            {(timestamp || status !== 'sent') && (
              <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                {status !== 'sent' && (
                  <span className={cn(
                    "inline-block text-xs font-medium",
                    status === 'delivered' ? "text-green-500" : 
                    status === 'failed' ? "text-red-500" : "text-gray-400"
                  )}>
                    {status === 'delivered' ? '✓' : 
                     status === 'failed' ? '✕' : '⋯'}
                  </span>
                )}
                {timestamp && formatTimestamp(timestamp)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}