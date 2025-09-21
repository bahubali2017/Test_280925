/* global setTimeout */
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '../lib/utils';
import { getContextualFollowups, getProfessionalFollowups } from '../lib/suggestions';
import { processFinalResponse } from '../lib/medical-safety-processor';

/**
 * @typedef {object} MessageMetadata
 * @property {object} [queryIntent] - Query analysis results
 * @property {string} [queryIntent.type] - Intent type
 * @property {number} [queryIntent.confidence] - Confidence score
 * @property {string[]} [queryIntent.disclaimers] - Disclaimers
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
 */


/**
 * Helper to format message content using ReactMarkdown
 * @param {string} content - The message content
 * @param {boolean} [isStreaming=false] - Whether content is being streamed
 * @param {string} [partialContent=''] - Partial content for streaming display
 * @param _partialContent
 * @param status
 * @returns {JSX.Element|null} Formatted content with proper Markdown rendering
 */
function formatMessageContent(content, isStreaming = false, _partialContent = '', status = 'sent') {
  // For streaming, always show the content as it updates in real-time
  const rawContent = content;

  if (!rawContent) return null;

  // For ReactMarkdown, we don't want aggressive text cleanup that destroys markdown
  // Only apply basic safety processing without the stray marker cleaning
  const displayContent = isStreaming 
    ? rawContent // Preserve formatting during streaming
    : rawContent; // Let ReactMarkdown handle the formatting - skip processFinalResponse

  // Only show typing indicator if streaming is active and message is not delivered
  const showTypingIndicator = isStreaming && status !== 'delivered';

  return (
    <div className="relative" data-status={status}>
      <ReactMarkdown
        className="markdown-compact"
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node, ...props }) => (
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white" {...props} />
          ),
          p: ({ node, ...props }) => (
            <p className="text-foreground dark:text-foreground" {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul className="list-disc ml-6" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal ml-6" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="text-foreground dark:text-foreground" {...props} />
          ),
          strong: ({ node, ...props }) => (
            <strong className="font-bold text-gray-900 dark:text-white" {...props} />
          ),
          em: ({ node, ...props }) => (
            <em className="italic text-foreground dark:text-foreground" {...props} />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600 dark:text-gray-300" {...props} />
          ),
          code: ({ node, inline, ...props }) => (
            inline ? (
              <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono" {...props} />
            ) : (
              <code className="block bg-gray-100 dark:bg-gray-800 p-3 rounded-md text-sm font-mono overflow-x-auto" {...props} />
            )
          ),
        }}
      >
        {displayContent}
      </ReactMarkdown>
      {showTypingIndicator && (
        <span className="typing-indicator ml-1">
          <span className="dot"></span>
          <span className="dot"></span>
          <span className="dot"></span>
        </span>
      )}
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
 * Props for the MessageBubble component
 * @typedef {object} MessageBubbleProps
 * @property {string} message - The message content
 * @property {boolean} isUser - Whether the message is from the user
 * @property {Date} [timestamp] - When the message was sent
 * @property {boolean} [isError] - Whether this is an error message
 * @property {boolean} [isHighRisk] - Whether this is a high-risk medical query
 * @property {object} [metadata] - Additional message metadata
 * @property {object} [metadata.queryIntent] - Query intent analysis results
 * @property {string} [originalMessage] - The original message that failed (for error messages)
 * @property {Function} [onRetry] - Function to call when retry button is clicked
 * @property {Function} [onFollowUpClick] - Function to call when a follow-up suggestion is clicked
 * @property {boolean} [showFollowUps=false] - Whether to show follow-up suggestions
 * @property {boolean} [isFirst=false] - Whether this is the first message in a sequence 
 * @property {boolean} [isLast=false] - Whether this is the last message in a sequence
 * @property {string} [className] - Additional CSS classes
 * @property {boolean} [isStreaming=false] - Whether this message is being streamed character by character
 * @property {string} [partialContent] - Partial content during streaming
 * @property {string} [status] - Message status (sent, delivered, failed)
 */

/**
 * Message bubble component for chat messages
 * @param {object} props - The message bubble props
 * @param {string} props.message - The message content
 * @param {boolean} props.isUser - Whether the message is from the user
 * @param {Date} [props.timestamp] - When the message was sent
 * @param {boolean} [props.isError=false] - Whether this is an error message
 * @param {boolean} [props.isHighRisk=false] - Whether this is a high-risk medical query
 * @param {object} [props.metadata] - Additional message metadata
 * @param {string} [props.originalMessage] - The original message that failed (for error messages)
 * @param {Function} [props.onRetry] - Function to call when retry button is clicked
 * @param {Function} [props.onFollowUpClick] - Function to call when a follow-up suggestion is clicked
 * @param {(event: React.MouseEvent<HTMLButtonElement>) => void} [props.onStopAI] - Function to call when stopping AI response
 * @param {boolean} [props.isStoppingAI=false] - Whether the AI response is being stopped
 * @param {boolean} [props.showFollowUps=false] - Whether to show follow-up suggestions
 * @param {boolean} [props.isFirst=false] - Whether this is the first message in a sequence
 * @param {boolean} [props.isLast=false] - Whether this is the last message in a sequence
 * @param {string} [props.className] - Additional CSS classes
 * @param {boolean} [props.isStreaming=false] - Whether this message is being streamed character by character
 * @param {string} [props.partialContent] - Partial content during streaming
 * @param {string} [props.status] - Message status (sent, delivered, failed)
 * @param props.sessionId
 * @param props._streamingMessageId
 * @param props.userQuery
 * @param props.userRole
 * @param props._partialContent
 * @returns {JSX.Element} The rendered message bubble component
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
  _partialContent = '',
  status = 'sent',
  sessionId = '',
  messageId = '',
  _streamingMessageId = '',
  userQuery = '',
  userRole = 'general_public'
}) {
  
  // State for feedback status
  const [feedbackStatus, setFeedbackStatus] = React.useState('');
  const [feedbackType, setFeedbackType] = React.useState('');

  
  // Create stop click handler
  const handleStopClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onStopAI?.(e);
  };

  // Create simple feedback handler
  const handleFeedback = async (type) => {
    console.log(`[Feedback] Button clicked: ${type}`);
    setFeedbackStatus('submitting');
    setFeedbackType(type);
    
    try {
      const payload = {
        messageId: messageId || `msg_${Date.now()}`,
        sessionId: sessionId || 'unknown_session',
        feedbackType: type,
        userQuery: userQuery || 'Unknown query',
        aiResponse: message,
        userRole: userRole || 'general_public',
        responseMetadata: metadata || {}
      };
      
      console.log('[Feedback] Sending payload:', payload);
      
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      console.log('[Feedback] Response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('[Feedback] Success:', result);
        setFeedbackStatus('success');
        // Clear the message after 3 seconds
        setTimeout(() => setFeedbackStatus(''), 3000);
      } else {
        const errorText = await response.text();
        console.error('[Feedback] Failed to submit feedback:', errorText);
        setFeedbackStatus('error');
        setTimeout(() => setFeedbackStatus(''), 3000);
      }
    } catch (error) {
      console.error('[Feedback] Error submitting feedback:', error);
      setFeedbackStatus('error');
      setTimeout(() => setFeedbackStatus(''), 3000);
    }
  };
  
  // Determine role for accessibility
  const roleAttribute = isUser 
    ? 'user message' 
    : isError 
      ? 'error message'
      : 'assistant message';

  // Determine if we should show the full disclaimer alert
  const showHighRiskAlert = !isUser && metadata?.isHighRisk;

  // Message styling is applied directly in the JSX below rather than storing in a variable

  // Phase 7: Enhanced follow-up suggestions using layer processing results
  // Memoize suggestions so they don't change while user is typing
  const followUpSuggestions = React.useMemo(() => {
    // Use medical layer suggestions if available
    if (metadata?.queryIntent?.suggestions && metadata.queryIntent.suggestions.length > 0) {
      return metadata.queryIntent.suggestions.slice(0, 4);
    }

    // If this is a professional query, use professional follow-ups
    if (metadata?.queryIntent?.isProfessionalQuery) {
      return getProfessionalFollowups(4);
    }

    // Use contextual follow-ups based on the original message content
    // For AI responses, we want to use the originalMessage (user's question), not the AI response
    const userQuestion = originalMessage || (isUser ? message : '') || '';
    const suggestions = getContextualFollowups(userQuestion, [], 4);
    
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
  }, [metadata?.queryIntent?.suggestions, metadata?.queryIntent?.isProfessionalQuery, originalMessage, isUser, message]);

  // Determine bubble styling based on sequence position
  const bubbleRounding = isUser
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

  // Y-padding based on position in sequence with enhanced spacing
  const yPadding = isFirst && !isLast
    ? "pt-3 pb-2.5"
    : !isFirst && isLast
      ? "pt-2.5 pb-3"
      : isFirst && isLast
        ? "py-3"
        : "py-2.5";

  // Add animation classes based on message state and status
  // Avoid using pulse animation on the whole bubble to prevent flickering
  const animationClass = isFirst 
    ? "animate-slide-in" 
    : "animate-fade-in";

  // Add a data attribute for styling/debugging
  const bubbleStatus = isStreaming && status !== 'delivered'
    ? 'streaming'
    : status;

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
              `bg-gradient-to-r from-cyan-500 to-blue-600 text-white ${bubbleRounding} px-4 ${yPadding} max-w-[85%] md:max-w-[75%] text-body relative transition-all duration-200 ${animationClass} shadow-md shadow-cyan-500/25`,
              isStreaming && status !== 'delivered' ? 'bubble--streaming' : '',
              className
            )}
            data-bubble-status={bubbleStatus}
          >
            <div className="whitespace-pre-wrap break-words">
              {formatMessageContent(message, isStreaming, _partialContent, status)}
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
                ? `bg-secondary/80 dark:bg-secondary/30 text-foreground dark:text-foreground shadow-sm border-l-2 border-amber-500 ${bubbleRounding} px-4 ${yPadding} max-w-[85%] md:max-w-[80%] text-body relative transition-all duration-200 ${animationClass}`
                : `bg-secondary/80 dark:bg-secondary/30 text-foreground dark:text-foreground shadow-sm ${bubbleRounding} px-4 ${yPadding} max-w-[85%] md:max-w-[80%] text-body relative transition-all duration-200 ${animationClass}`,
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

            {/* Enhanced Phase 7: Display triage level and medical layer information */}
            {!isUser && metadata?.queryIntent && (
              <div className="mb-3">
                {/* High-risk alert with triage information */}
                {showHighRiskAlert && (
                  <div className="mb-3 p-3 bg-destructive/10 dark:bg-destructive/20 text-destructive dark:text-destructive-foreground border border-destructive/30 rounded-md text-sm animate-fade-in">
                    <p className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-destructive mt-0.5 flex-shrink-0">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/>
                        <line x1="12" y1="17" x2="12.01" y2="17"/>
                      </svg>
                      <span><strong>Medical Emergency Alert:</strong> {metadata?.queryIntent?.atd?.atdReason || 'If this is a medical emergency, please contact emergency services immediately.'}</span>
                    </p>
                  </div>
                )}

                {/* Triage level indicator for non-emergency cases */}
                {metadata?.triageLevel && metadata.triageLevel !== 'non_urgent' && !showHighRiskAlert && (
                  <div className={`mb-2 p-2 rounded-md text-xs font-medium flex items-center ${
                    metadata.triageLevel === 'urgent' 
                      ? 'bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800/50'
                      : metadata.triageLevel === 'emergency'
                        ? 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800/50'
                        : 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800/50'
                  }`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                    </svg>
                    Triage Level: {metadata.triageLevel.replace('_', ' ').toUpperCase()}
                  </div>
                )}

                {/* Display specific disclaimers from layer processing */}
                {metadata?.queryIntent?.disclaimers && metadata.queryIntent.disclaimers.length > 0 && !showHighRiskAlert && (
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
                          {metadata.queryIntent.disclaimers.map((disclaimer, index) => (
                            <li key={index} className="text-xs list-disc list-inside">{disclaimer}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* ATD (Advice to Doctor) notice for urgent/emergency cases */}
                {metadata?.queryIntent?.atd && (
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
                        <p className="text-xs mt-1 font-medium">{metadata.queryIntent.atd.atdReason}</p>
                        <p className="text-xs mt-1 opacity-75">This guidance should be considered in clinical decision-making.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Phase 7: Enhanced Emergency Alert with visual prominence */}
                {metadata?.triageLevel === 'emergency' && !showHighRiskAlert && (
                  <div className="mb-3 p-3 bg-red-100 text-red-800 border-2 border-red-300 rounded-md text-sm dark:bg-red-900/30 dark:text-red-200 dark:border-red-700/50 animate-pulse">
                    <div className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 mt-0.5 flex-shrink-0 text-red-600 dark:text-red-400">
                        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                      </svg>
                      <div>
                        <strong className="text-red-900 dark:text-red-100">🚨 EMERGENCY LEVEL CONDITION</strong>
                        <p className="text-xs mt-1 font-medium">This appears to require immediate medical attention. Please seek emergency care.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Phase 7: Real-time medical layer processing indicator */}
            {!isUser && metadata?.layerStatus && !['completed', 'fallback'].includes(metadata.layerStatus) && (
              <div className="mb-3 p-2 bg-cyan-50 border border-cyan-200 rounded-md text-sm dark:bg-cyan-900/20 dark:border-cyan-800/50 animate-pulse">
                <div className="flex items-center text-cyan-700 dark:text-cyan-300">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 animate-spin">
                    <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    <path d="m9 12 2 2 4-4"/>
                  </svg>
                  <span className="font-medium">
                    {metadata.layerStatus === 'parsing' && 'Analyzing medical query...'}
                    {metadata.layerStatus === 'triaging' && 'Assessing urgency level...'}
                    {metadata.layerStatus === 'enhancing' && 'Preparing specialized guidance...'}
                    {!['parsing', 'triaging', 'enhancing'].includes(metadata.layerStatus) && 'Processing medical information...'}
                  </span>
                  {metadata.layerProcessingTime && (
                    <span className="ml-2 text-xs opacity-70">
                      {Math.round(metadata.layerProcessingTime)}ms
                    </span>
                  )}
                </div>
                {/* Estimated time indicator */}
                <div className="mt-1 text-xs text-cyan-600 dark:text-cyan-400 opacity-80">
                  Expected completion: {metadata.layerStatus === 'parsing' ? '1-2s' : metadata.layerStatus === 'triaging' ? '2-3s' : '3-4s'}
                </div>
              </div>
            )}

            {/* Phase 7: Fallback notification for failed medical layer processing */}
            {!isUser && metadata?.layerStatus === 'fallback' && metadata?.fallbackReason && (
              <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded-md text-sm dark:bg-amber-900/20 dark:border-amber-800/50">
                <div className="flex items-center text-amber-700 dark:text-amber-300">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  <span className="font-medium">{metadata.fallbackReason}</span>
                </div>
              </div>
            )}

            <div className="whitespace-pre-wrap break-words">
              {formatMessageContent(message, isStreaming, _partialContent, status)}
            </div>

            {/* Show metadata if available in non-user messages */}
            {/* Show Stop AI button when streaming is active */}
            {!isUser && isStreaming && status === 'streaming' && onStopAI && (
              <div className="mt-2 flex justify-start">
                <button
                  data-testid="button-stop-ai"
                  type="button"
                  onClick={handleStopClick}
                  disabled={isStoppingAI || status === 'stopping'}
                  className={cn(
                    "flex items-center text-xs py-1 px-2.5 rounded-full font-medium transition-all duration-300 shadow-sm",
                    (isStoppingAI || status === 'stopping')
                      ? "bg-amber-50 text-amber-600 cursor-not-allowed opacity-70 border border-amber-200"
                      : "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 hover:border-red-300 hover:shadow-md active:scale-95 cursor-pointer"
                  )}
                  title={(isStoppingAI || status === 'stopping') ? "Stopping AI response..." : "Stop the AI response"}
                  aria-label={(isStoppingAI || status === 'stopping') ? "Stopping AI response" : "Stop AI response"}
                >
                  {(isStoppingAI || status === 'stopping') ? (
                    <span className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 animate-spin">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M12 6v6l4 2"></path>
                      </svg>
                      Stopping...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                        <rect x="6" y="6" width="12" height="12"></rect>
                      </svg>
                      Stop AI
                    </span>
                  )}
                </button>
              </div>
            )}

            {/* Show response metadata for completed non-error messages */}
            {!isUser && metadata && metadata.requestTime && !isError && !isStreaming && (
              <div className="text-xs text-muted-foreground dark:text-muted-foreground/80 mt-2 flex items-center gap-1.5">
                <span className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  Response time: {Math.round(metadata.requestTime/100)/10}s
                  {status === 'stopped' && ' (stopped)'}
                </span>
                {metadata.attemptCount > 1 && (
                  <span className="ml-1 opacity-80">(after {metadata.attemptCount} attempts)</span>
                )}
              </div>
            )}

            {/* Only show timestamp and status if message is not cancelled/stopped */}
            {(timestamp || (status !== 'sent' && status !== 'cancelled' && status !== 'stopped' && !metadata?.isCancelled)) && (
              <div className="text-xs text-muted-foreground dark:text-muted-foreground/80 mt-2 flex items-center gap-1.5 opacity-80">
                {timestamp && formatTimestamp(timestamp)}
                {status !== 'sent' && status !== 'cancelled' && status !== 'stopped' && !metadata?.isCancelled && (
                  <span className={cn(
                    "inline-flex items-center text-xs font-medium",
                    status === 'delivered' ? "text-success dark:text-success/90" : 
                    status === 'failed' ? "text-destructive dark:text-destructive/90" : "text-muted-foreground"
                  )}>
                    {status === 'delivered' ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-0.5">
                        <path d="M20 6L9 17l-5-5"/>
                      </svg>
                    ) : status === 'failed' ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-0.5">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-0.5 animate-spin">
                        <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    )}
                    {status}
                  </span>
                )}
              </div>
            )}

            {/* Show cancelled message notice - this takes priority over regular status display */}
            {!isUser && (status === 'cancelled' || status === 'stopped' || status === 'timeout' || metadata?.isCancelled) && (
              <div className="mt-3 text-sm text-muted-foreground dark:text-muted-foreground/80 flex items-center bg-secondary/20 p-2 rounded-md">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
                  <rect x="6" y="6" width="12" height="12"></rect>
                </svg>
                <span className="font-medium">
                  {status === 'timeout' || metadata?.isTimeout ? 
                    'Response timed out - may be incomplete' : 
                    'AI response stopped by user'}
                </span>
                {timestamp && (
                  <span className="ml-2 text-xs opacity-70">{formatTimestamp(timestamp)}</span>
                )}
              </div>
            )}

            {/* Unified error handling and retry logic */}
            {(isError && status === 'failed' && !metadata?.delivered) && (
              <div className="mt-3 text-sm">
                <div className="mb-2 text-destructive">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block mr-1.5">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {message || 'An error occurred while processing your request'}
                </div>
                <button 
                  className="flex items-center text-primary hover:text-primary-900 dark:hover:text-primary-500 transition-colors duration-200 px-3 py-1.5 rounded-md bg-primary/5 hover:bg-primary/10 dark:bg-primary/10 dark:hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  onClick={() => onRetry && onRetry(originalMessage)}
                  aria-label="Try sending the message again"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                    <path d="M21 3v5h-5"/>
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                    <path d="M8 16H3v5"/>
                  </svg>
                  Try again
                </button>
              </div>
            )}

            {/* Follow-up suggestions - show when response is finished (delivered, completed, or stopped) */}
            {!isUser && isLast && showFollowUps && !isStreaming && (status === 'delivered' || status === 'completed' || status === 'stopped' || status === 'cancelled') && (
              <div className="mt-4 pt-3 border-t border-border dark:border-border/70 animate-fade-in">
                <p className="text-xs font-medium text-foreground/70 dark:text-foreground/60 mb-2.5 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
                    <polyline points="15 14 20 9 15 4"/>
                    <path d="M4 20v-7a4 4 0 0 1 4-4h12"/>
                  </svg>
                  Suggested follow-up questions:
                </p>
                <div className="flex flex-wrap gap-2">
                  {followUpSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => onFollowUpClick && onFollowUpClick(suggestion)}
                      className="px-3 py-2 bg-gradient-to-r from-cyan-50 to-cyan-100 hover:from-cyan-100 hover:to-cyan-200 text-cyan-800 dark:from-cyan-900/30 dark:to-cyan-800/30 dark:hover:from-cyan-800/40 dark:hover:to-cyan-700/40 dark:text-cyan-300 text-sm rounded-full transition-all duration-200 shadow-sm hover:shadow-md border border-cyan-200 dark:border-cyan-700/50 hover:border-cyan-300 dark:hover:border-cyan-600/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                      aria-label={`Ask follow-up question: ${suggestion}`}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
                
              </div>
            )}

            {/* Phase 7: Medical Layer Feedback System - Independent of follow-ups */}
            {(!isUser && !isError && isLast && (metadata?.queryIntent || status === 'timeout' || status === 'delivered')) && (
              <div className="mt-4 pt-3 border-t border-border/30 dark:border-border/20">
                <p className="text-xs text-foreground/60 dark:text-foreground/50 mb-2 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
                    <path d="M9 12l2 2 4-4"/>
                    <path d="M21 12c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z"/>
                    <path d="M3 12c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z"/>
                  </svg>
                  Was this medical guidance helpful?
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => {
                      e.target.style.transform = 'scale(0.95)';
                      e.target.style.opacity = '0.7';
                      setTimeout(() => {
                        e.target.style.transform = 'scale(1)';
                        e.target.style.opacity = '1';
                      }, 150);
                      handleFeedback('helpful');
                    }}
                    disabled={feedbackStatus === 'submitting'}
                    className="flex items-center text-xs text-green-700 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 transition-all duration-150 px-2 py-1 rounded-md bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 active:scale-95 disabled:opacity-50"
                    aria-label="Mark this guidance as helpful"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                      <path d="M7 10v12"/>
                      <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h3.73a2 2 0 0 1 1.92 2.56z"/>
                    </svg>
                    Helpful
                  </button>
                  <button
                    onClick={(e) => {
                      e.target.style.transform = 'scale(0.95)';
                      e.target.style.opacity = '0.7';
                      setTimeout(() => {
                        e.target.style.transform = 'scale(1)';
                        e.target.style.opacity = '1';
                      }, 150);
                      handleFeedback('could_improve');
                    }}
                    disabled={feedbackStatus === 'submitting'}
                    className="flex items-center text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 transition-all duration-150 px-2 py-1 rounded-md bg-gray-50 dark:bg-gray-900/20 hover:bg-gray-100 dark:hover:bg-gray-900/30 active:scale-95 disabled:opacity-50"
                    aria-label="Mark this guidance as not helpful"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 rotate-180">
                      <path d="M7 10v12"/>
                      <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h3.73a2 2 0 0 1 1.92 2.56z"/>
                    </svg>
                    Could improve
                  </button>
                  
                  {/* Inline feedback status message */}
                  {feedbackStatus && (
                    <div className={`flex items-center text-xs px-2 py-1 rounded-md transition-all duration-300 ${
                      feedbackStatus === 'success' 
                        ? 'text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30' 
                        : feedbackStatus === 'error'
                        ? 'text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30'
                        : 'text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30'
                    }`}>
                      {feedbackStatus === 'submitting' && (
                        <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      )}
                      {feedbackStatus === 'success' && (
                        <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                      {feedbackStatus === 'error' && (
                        <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      )}
                      {feedbackStatus === 'submitting' && 'Submitting...'}
                      {feedbackStatus === 'success' && `Thank you for your ${feedbackType === 'helpful' ? 'positive' : 'improvement'} feedback!`}
                      {feedbackStatus === 'error' && 'Failed to submit. Please try again.'}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}