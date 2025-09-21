/* global setTimeout */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../hooks/useAuth';
import { MessageBubble } from '../components/MessageBubble';
import AnimatedNeuralLogo from '../components/AnimatedNeuralLogo.jsx'; // eslint-disable-line no-unused-vars
import { ThemeToggle } from '../components/ThemeToggle.jsx'; // eslint-disable-line no-unused-vars
import { apiRequest } from '../lib/queryClient';
import { getRandomStarterQuestions } from '../lib/suggestions';

// Simple UUID generator using crypto API with fallback
const generateUUID = () => {
  if (window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * @typedef {object} Message
 * @property {string} id - Unique identifier for the message
 * @property {string} content - The message text content
 * @property {boolean} isUser - Whether the message is from the user (true) or AI (false)
 * @property {Date} timestamp - When the message was created
 * @property {boolean} [isError] - Whether this is an error message
 * @property {string} [status] - Message status (sent, delivered, pending, failed, stopped)
 * @property {boolean} [isHighRisk] - Whether this message contains high-risk content
 * @property {object} [metadata] - Additional metadata about the message
 * @property {string} [originalMessage] - Original message text (for error messages)
 * @property {string} [sessionId] - Session ID for this message
 * @property {boolean} [isRetry] - Whether this message is a retry attempt
 * @property {boolean} [isCancelled] - Whether this message was cancelled
 */

/**
 * @typedef {object} MessageWithMetadata
 * @property {string} id - Message ID
 * @property {string} content - Message content
 * @property {boolean} isUser - Whether the message is from the user
 * @property {Date|string} timestamp - Message timestamp
 * @property {object} [metadata] - Message metadata
 */

/**
 * @typedef {object} APIErrorResponse
 * @property {string} type - Type of error (network, timeout, validation, api)
 * @property {string} [message] - Error message
 * @property {string} [details] - Error details
 */

// Cache for llm-api module to avoid repeated dynamic imports
/** @type {Promise<typeof import('../lib/llm-api')> | null} */
let llmApiModule = null;
const getLLMApi = async () => {
  if (!llmApiModule) {
    llmApiModule = import('../lib/llm-api');
  }
  return llmApiModule;
};

// APIErrorResponse type defined above

/**
 * ChatPage component that displays the chat interface
 * @returns {JSX.Element} The ChatPage component
 */
export default function ChatPage() {
  
  /** @type {[Array<Message>, React.Dispatch<React.SetStateAction<Array<Message>>>]} */
  const [messages, setMessages] = useState(/** @type {Array<Message>} */([]));
  /** @type {[string, React.Dispatch<React.SetStateAction<string>>]} */
  const [newMessage, setNewMessage] = useState('');
  /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} */
  const [isLoading, setIsLoading] = useState(false);
  /** @type {[string, React.Dispatch<React.SetStateAction<string>>]} */
  const [lastUserMessage, setLastUserMessage] = useState('');
  /** @type {[number, React.Dispatch<React.SetStateAction<number>>]} */
  const [retryCount, setRetryCount] = useState(0);
  /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} */
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);
  /** @type {[string|null, React.Dispatch<React.SetStateAction<string|null>>]} */
  const [currentStreamingId, setCurrentStreamingId] = useState(/** @type {string|null} */(null));
  /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} */
  const [isStoppingAI, setIsStoppingAI] = useState(false);
  /** @type {[Array<string>, React.Dispatch<React.SetStateAction<Array<string>>>]} */
  const [starterQuestions, setStarterQuestions] = useState(/** @type {Array<string>} */([]));

  const { user, logout, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Add error boundary state
  const [hasError, setHasError] = useState(false);

  // Reset error state when user changes
  useEffect(() => {
    setHasError(false);
  }, [user]);

  /** @type {React.RefObject<HTMLDivElement>} */
  const messagesEndRef = useRef(null);
  /** @type {React.RefObject<HTMLInputElement>} */
  const inputRef = useRef(null);

  /**
   * Scrolls to the bottom of the chat container
   * @returns {void}
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  /**
   * Fetches message history from the server
   * @returns {Promise<void>}
   */
  const fetchMessageHistory = useCallback(async () => {
    if (!user || !user.id) return;

    try {
      setIsFetchingHistory(true);
      const response = await apiRequest('GET', `/api/messages/${user.id}`);
      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        // Sort messages by timestamp
        const sortedMessages = [...data.data].sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        // Format the messages to match our client-side structure
        /** @type {Array<Message>} */
        const formattedMessages = sortedMessages.map(msg => ({
          id: msg.id,
          content: msg.content,
          isUser: msg.isUser,
          timestamp: new Date(msg.timestamp)
        }));

        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Failed to fetch message history:', error);
      // Set hasError to true if fetching history fails
      setHasError(true);
    } finally {
      setIsFetchingHistory(false);
    }
  }, [user]);

  /**
   * Auto-focus the input field and fetch message history on component mount
   */
  useEffect(() => {
    // Auto-focus the input field for better UX
    inputRef.current?.focus();

    // Initialize random starter questions
    setStarterQuestions(getRandomStarterQuestions(4));

    // Fetch message history if user is logged in
    fetchMessageHistory();
  }, [fetchMessageHistory]);

  /**
   * Scroll to bottom when messages change
   */
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /**
   * Convert messages to conversation history format for API
   * @param {Array<Message>} messageList - List of messages
   * @returns {Array<{role: string, content: string}>} Conversation history
   */
  const prepareConversationHistory = (messageList) => {
    return messageList
      .filter(msg => {
        // Skip error messages in conversation history
        if (msg.isError) return false;

        // Include all user messages
        if (msg.isUser) return true;

        // For assistant messages, only include if:
        // - Status is 'delivered' (not pending/streaming)
        // - Not cancelled
        // - Has actual content (not empty/whitespace)
        return (
          msg.status === 'delivered' &&
          !msg.isCancelled &&
          msg.content &&
          msg.content.trim().length > 0
        );
      })
      .map(msg => ({
        role: msg.isUser ? 'user' : 'assistant',
        content: msg.content
      }))
      .filter(entry => entry.content && entry.content.trim().length > 0); // Final safety filter
  };

  /**
   * Retry sending the last failed message
   * @param {string} [messageToRetry] - The message to retry sending
   * @returns {Promise<void>}
   */
  const handleRetryMessage = useCallback(async (messageToRetry = '') => {
    // Use either the provided message or the last saved user message
    const messageContent = messageToRetry || lastUserMessage;

    if (!messageContent) {
      return;
    }

    // Add retry count limit
    if (retryCount >= 3) {
      setMessages(prev => [...prev, {
        id: `retry_limit_${Date.now()}`,
        content: "Maximum retry attempts reached. Please try again later.",
        isUser: false,
        timestamp: new Date(),
        isError: true,
        status: 'failed'
      }]);
      return;
    }

    setRetryCount(prev => prev + 1);

    // Create a retry ID by appending retry count to make it unique
    const retryId = `retry_${Date.now()}_${retryCount}`;

    // Find and remove the previous error message if it exists
    setMessages(prev => {
      const currentTime = Date.now();
      // Keep only non-error messages or those older than 30 seconds
      const filteredMessages = prev.filter(msg => {
        if (!msg.isError) return true;

        // Safely handle timestamp comparison
        const msgTime = msg.timestamp instanceof Date ?
          msg.timestamp.getTime() :
          new Date(msg.timestamp).getTime();

        return msgTime < (currentTime - 30000);
      });

      return filteredMessages;
    });

    // Add a new user message for the retry
    const userMessage = {
      id: retryId,
      content: messageContent,
      isUser: true,
      timestamp: new Date(),
      isRetry: true
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Prepare conversation history from previous valid messages
      const recentMessages = messages
        .filter(msg => !msg.isError)
        .slice(-6); // Use last 6 valid messages for context

      const conversationHistory = prepareConversationHistory(recentMessages);

      // Get cached llm-api module
      const { sendMessage } = await getLLMApi();

      // CRITICAL FIX: Immediately push placeholder assistant message
      // This ensures MessageBubble exists instantly so Stop AI button can render
      setMessages(prev => [
        ...prev,
        {
          id: `${retryId}_response`,
          content: '',
          isUser: false,
          timestamp: new Date(),
          sessionId: retryId,
          isStreaming: true,
          status: 'pending',
          metadata: {
            isStreaming: true,
            isRetry: true,
            messageId: `${retryId}_response`
          }
        }
      ]);

      // Set as current streaming message for display
      setCurrentStreamingId(`${retryId}_response`);



      // Note: Streaming handled internally by sendMessageClientSide

      // Call the enhanced API with streaming support
      const result = await sendMessage(
        messageContent,
        conversationHistory,
        {
          /**
           * @param {string} chunk - Content chunk from stream
           * @param {{fullContent?: string, streaming?: boolean}} info - Streaming info with fullContent
           */
          onStreamingUpdate: (chunk, info) => {
            // Update the message content in real-time as chunks arrive
            setMessages(prev => prev.map(msg =>
              msg.id === `${retryId}_response`
                ? {
                    ...msg,
                    content: info.fullContent || msg.content + chunk,
                    isStreaming: true,
                    status: 'streaming'
                  }
                : msg
            ));
          },
          sessionId: retryId
        }
      );


      // CRITICAL FIX: Update the placeholder message with the actual AI response
      if (result && result.content) {
        setMessages(prev => prev.map(msg =>
          msg.id === `${retryId}_response`
            ? {
                ...msg,
                content: result.content,
                isStreaming: false,
                status: 'delivered',
                metadata: { ...msg.metadata, ...result.metadata }
              }
            : msg
        ));
        setCurrentStreamingId(null);
      }
    } catch (error) {
      console.error('Error during retry:', error);

      // Get appropriate user-friendly error message
      const errorMessage = getErrorMessage(/** @type {Error|unknown} */(error));

      // If we have a streaming message in progress, convert it to an error
      if (currentStreamingId) {
        setMessages((prev) => {
          // Check if this message was already manually stopped by user (for retry case)
          const originalMessage = prev.find(msg => msg.id === currentStreamingId);
          const wasManuallyAborted = originalMessage?.metadata?.manuallyAborted || 
                                   originalMessage?.metadata?.cancelledByUser ||
                                   originalMessage?.isCancelled || 
                                   originalMessage?.status === 'stopped' ||
                                   originalMessage?.status === 'stopping';
          
          if (wasManuallyAborted) {
            return prev; // Don't add error message, user already stopped it
          }

          // Check if this was a deliberate abort/stop action (from AbortController)
          const isAbortError = error &&
            ((typeof error === 'object' && 'type' in error && error.type === 'abort') ||
             (typeof error === 'object' && 'name' in error && error.name === 'AbortError') ||
             (typeof error === 'object' && 'message' in error &&
              typeof error.message === 'string' &&
              (error.message.includes('Request was cancelled') ||
               error.message.includes('Stream stopped by user') ||
               error.message.includes('Stream aborted by user'))));
               
          if (isAbortError) {
            // For abort errors, don't add any error message - the user intentionally stopped it
            return prev;
          }

          // Otherwise, convert it to an error
          return prev.map(msg =>
            msg.id === currentStreamingId
              ? {
                  ...msg,
                  content: errorMessage,
                  isStreaming: false,
                  isError: true,
                  status: 'failed',
                  originalMessage: messageContent
                }
              : msg
          );
        });

        // Clear streaming state
        setCurrentStreamingId(null);
  
      } else {
        // Add error message
        setMessages(prev => [...prev, {
          id: `${retryId}_error`,
          content: errorMessage,
          isUser: false,
          timestamp: new Date(),
          isError: true,
          status: 'failed',
          sessionId: retryId
        }]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [messages, lastUserMessage, retryCount]);

  /**
   * Get error message based on error type
   * @param {APIErrorResponse|Error|unknown} error - Error object
   * @returns {string} User-friendly error message
   */
  const getErrorMessage = (error) => {
    const defaultMessage = "I'm sorry, I encountered an error processing your request. Please try again later.";

    if (!error) return defaultMessage;

    /**
     * Type guard to check if it's our standardized API error format
     * @param {unknown} err - The error to check
     * @returns {err is APIErrorResponse} Whether it's an API error response
     */
    const isApiErrorResponse = (err) => {
      return typeof err === 'object' &&
             err !== null &&
             'type' in err &&
             typeof err.type === 'string';
    };

    // Check if it's our standardized error format
    if (isApiErrorResponse(error)) {
      // TypeScript narrowing - we now know error has a type property
      const apiError = /** @type {APIErrorResponse} */ (error);
      switch (apiError.type) {
        case 'network':
          return "I couldn't connect to the medical knowledge system. Please check your internet connection and try again.";
        case 'timeout':
          return "It's taking longer than expected to process your medical query. Please try again or consider asking a shorter question.";
        case 'validation':
          return "Your message couldn't be processed. Please try a different question.";
        case 'api':
          return "The medical AI system is currently unavailable. Please try again in a few moments.";
        default:
          return defaultMessage;
      }
    }

    // Generic error
    return defaultMessage;
  };

  /**
   * Handles sending a new message
   * @param {React.FormEvent<HTMLFormElement>|{preventDefault: () => void, target: any}} e - The form event or synthetic event
   * @returns {Promise<void>}
   */
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || isLoading) return;

    // Save the message for potential retries
    setLastUserMessage(newMessage);

    // Create a unique ID for this message pair using browser-compatible UUID generation
    const messageId = generateUUID();
    const assistantMessageId = generateUUID();
    const sessionId = user?.id ? `user_${user.id}_${messageId}` : `anon_${messageId}`;

    // Add user message
    const userMessage = {
      id: messageId,
      content: newMessage,
      isUser: true,
      timestamp: new Date(),
      sessionId
    };

    setMessages((prev) => [...prev, userMessage]);

    // Clear input and focus it for next message
    setNewMessage('');
    inputRef.current?.focus();

    // Connect to the DeepSeek LLM API
    setIsLoading(true);

    try {
      // Prepare conversation history from previous messages
      const recentMessages = messages.slice(-6); // Use last 6 messages for context
      const conversationHistory = prepareConversationHistory(recentMessages);

      // Get cached llm-api module
      const { sendMessage } = await getLLMApi();

      // CRITICAL FIX: Immediately push placeholder assistant message
      // This ensures MessageBubble exists instantly so Stop AI button can render
      setMessages(prev => [
        ...prev,
        {
          id: assistantMessageId,
          content: '',
          isUser: false,
          timestamp: new Date(),
          sessionId: sessionId,
          isStreaming: true,
          status: 'pending',
          metadata: {
            isStreaming: true,
            messageId: assistantMessageId
          }
        }
      ]);

      // Set as current streaming message for display using stable assistantMessageId
      setCurrentStreamingId(assistantMessageId);



      // Note: streaming handled internally by sendMessageClientSide

      // Call the enhanced API with streaming support
      const result = await sendMessage(
        newMessage,
        conversationHistory,
        {
          /**
           * @param {string} chunk - Content chunk from stream
           * @param {{fullContent?: string, streaming?: boolean}} info - Streaming info with fullContent
           */
          onStreamingUpdate: (chunk, info) => {
            setMessages(prev => prev.map(msg =>
              msg.id === assistantMessageId
                ? {
                    ...msg,
                    content: info.fullContent || msg.content + chunk,
                    isStreaming: true,
                    status: 'streaming'
                  }
                : msg
            ));
          },
          sessionId: sessionId
        }
      );


      // CRITICAL FIX: Update the placeholder message with the actual AI response
      if (result && result.content) {
        setMessages(prev => prev.map(msg =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: result.content,
                isStreaming: false,
                status: 'delivered',
                metadata: { ...msg.metadata, ...result.metadata }
              }
            : msg
        ));
        setCurrentStreamingId(null);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      const typedError = /** @type {Error|unknown} */ (error);
      console.error('Error details:', {
        name: error && typeof error === 'object' && 'name' in error ? error.name : 'unknown',
        message: error && typeof error === 'object' && 'message' in error ? error.message : String(error),
        stack: error && typeof error === 'object' && 'stack' in error ? error.stack : undefined,
        type: error && typeof error === 'object' && 'type' in error ? error.type : 'unknown'
      });

      // Get appropriate user-friendly error message
      const errorMessage = getErrorMessage(typedError);

      // If we have a streaming message in progress, check if it was already delivered
      if (currentStreamingId) {
        setMessages((prev) => {
          // Check if this message was already manually stopped by user  
          const originalMessage = prev.find(msg => msg.id === currentStreamingId);
          const wasManuallyAborted = originalMessage?.metadata?.manuallyAborted || 
                                   originalMessage?.metadata?.cancelledByUser ||
                                   originalMessage?.isCancelled || 
                                   originalMessage?.status === 'stopped' ||
                                   originalMessage?.status === 'stopping';
          
          if (wasManuallyAborted) {
            return prev; // Don't add error message, user already stopped it
          }

          // Check if this was a deliberate abort/stop action (from AbortController)
          const isAbortError = error && typeof error === 'object' && 
            (('type' in error && error.type === 'abort') ||
             ('name' in error && error.name === 'AbortError') || 
             ('message' in error && typeof error.message === 'string' && 
              (error.message.includes('Request was cancelled') ||
               error.message.includes('Stream stopped by user') ||
               error.message.includes('Stream aborted by user') ||
               error.message.includes('Request aborted by user') ||
               error.message.includes('cancelled'))));
               
          if (isAbortError) {
            // For abort errors, don't add any error message - the user intentionally stopped it
            // The Stop AI handler should have already updated the UI appropriately
            console.info('[ChatPage] Abort error detected - no error message will be shown');
            return prev;
          }

          // Otherwise, convert it to an error
          return prev.map(msg =>
            msg.id === currentStreamingId
              ? {
                  ...msg,
                  content: errorMessage,
                  isStreaming: false,
                  isError: true,
                  status: 'failed',
                  originalMessage: newMessage
                }
              : msg
          );
        });

        // Clear streaming state
        setCurrentStreamingId(null);
  
      } else {
        // Add error message
        setMessages((prev) => [
          ...prev,
          {
            id: `${messageId}_error`,
            content: errorMessage,
            isUser: false,
            timestamp: new Date(),
            isError: true,
            status: 'failed',
            sessionId,
            originalMessage: newMessage // Store original message for retry functionality
          }
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles follow-up suggestion clicks
   * @param {string} suggestion - The suggested follow-up message
   */
  const handleFollowUpClick = (suggestion) => {
    // Set the suggestion as the new message
    setNewMessage(suggestion);

    // Auto-focus the input for better UX
    inputRef.current?.focus();

    // Auto-submit the follow-up question for better UX
    setTimeout(() => {
      handleSendMessage({ preventDefault: () => {}, target: inputRef.current });
    }, 100);
  };

  /**
   * Handles stopping an in-progress AI response - Enhanced with proper state management
   */
  const handleStopAI = useCallback(async () => {
    // CRITICAL FIX: Check if we have an active streaming message
    if (!currentStreamingId) {
      return;
    }

    // CRITICAL FIX: Prevent multiple simultaneous stop operations
    if (isStoppingAI) {
      return;
    }

    setIsStoppingAI(true);

    try {
      // Store the current streaming message ID to prevent race conditions
      const activeStreamingId = currentStreamingId;

      // Note: Current message status no longer needed for stopping function

      // IMMEDIATE UI UPDATE: Mark message as stopping
      setMessages(prev =>
        prev.map(msg =>
          msg.id === activeStreamingId
            ? {
                ...msg,
                isStreaming: false,
                status: 'stopping',
                metadata: {
                  ...msg.metadata,
                  isStreaming: false,
                  status: 'stopping'
                }
              }
            : msg
        )
      );

      // Get stopStreaming from cached module and call it immediately
      const { stopStreaming } = await getLLMApi();
      stopStreaming();

      // FINAL UI UPDATE: Update message with final stopped state
      setMessages(prev => {
        const targetMessage = prev.find(msg => msg.id === activeStreamingId);

        if (!targetMessage) {
          return prev;
        }

        // Get the latest partial content from either the message or the ref
        const latestContent = targetMessage.content || '';

        // If there's no content at all (stream just started), remove the message
        if (!latestContent || latestContent.trim().length === 0) {
          return prev.filter(msg => msg.id !== currentStreamingId);
        }

        // Preserve the partial content and mark as stopped
        return prev.map(msg =>
          msg.id === currentStreamingId
            ? {
                ...msg,
                isStreaming: false,
                content: latestContent + "\n\n*AI response stopped by user.*",
                status: 'stopped',
                isCancelled: true,
                isError: false,
                metadata: {
                  ...msg.metadata,
                  isStreaming: false,
                  isCancelled: true,
                  status: 'stopped',
                  cancelledByUser: true,
                  manuallyAborted: true,
                  partialContentLength: latestContent.length,
                  stoppedAt: new Date().toISOString()
                }
              }
            : msg
        );
      });

    } catch (error) {
      
      const typedError = /** @type {Error|unknown} */ (error);

      // Error handling: Mark message as failed to stop
      setMessages(prev =>
        prev.map(msg =>
          msg.id === currentStreamingId
            ? {
                ...msg,
                isStreaming: false,
                status: 'failed',
                isError: true,
                content: (msg.content || '') + "\n\n*Failed to stop AI response.*",
                metadata: {
                  ...msg.metadata,
                  isStreaming: false,
                  status: 'failed',
                  stopError: typedError && typeof typedError === 'object' && 'message' in typedError ? typedError.message : String(typedError)
                }
              }
            : msg
        )
      );
    } finally {
      // CRITICAL FIX: Always clear streaming state, even if there was an error
      setCurrentStreamingId(null);

      setIsStoppingAI(false);
      setIsLoading(false);
    }
  }, [currentStreamingId, isStoppingAI, messages]);

  /**
   * Create stable reference for onStopAI prop to prevent race conditions
   * @param {string} messageId - The message ID to check for stop handler
   * @returns {Function | undefined} Stop handler function or undefined
   */
  const getStopHandler = useCallback((messageId) => {
    if (currentStreamingId && messageId === currentStreamingId) {
      return handleStopAI;
    }
    return undefined; // Use undefined instead of null to prevent conditional rendering issues
  }, [currentStreamingId, handleStopAI]);

  /**
   * Handles user logout
   * @returns {void}
   */
  const handleLogout = () => {
    logout();
    setLocation('/login');
  };

  // Show loading while auth is being determined
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Handle error state
  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h2 className="text-xl font-semibold mb-2 text-destructive">Something went wrong</h2>
          <p className="text-muted-foreground mb-4">The application encountered an error.</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return <div>Loading user...</div>;
  }


  return (
    <div className="min-h-screen flex flex-col bg-background transition-colors duration-300">

      {/* Header */}
      <header className="bg-card dark:bg-sidebar-background py-3 px-4 md:px-6 shadow-md border-b border-border transition-colors duration-300">
        <div className="container-xl">
          {/* Mobile Layout */}
          <div className="block sm:hidden">
            <div className="flex items-start justify-between">
              {/* Logo and Brand */}
              <div className="flex items-center space-x-3">
                <AnimatedNeuralLogo
                  size={48}
                  className=""
                  alt="Anamnesis Medical AI Assistant Logo"
                />
                <div className="border-l border-border pl-3 ml-1">
                  <h1 className="bg-neural-gradient-primary bg-clip-text text-transparent text-lg font-bold">Anamnesis</h1>
                  <p className="text-muted-foreground text-sm dark:text-gray-300">Medical AI Assistant</p>
                </div>
              </div>

              {/* Right side controls - horizontal layout */}
              <div className="flex items-center gap-2">
                {/* Theme Toggle */}
                <ThemeToggle />

                {/* Logout Button */}
                <button
                  type="button"
                  className="text-primary border-primary border inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors px-3 py-1.5 hover:bg-primary hover:text-primary-foreground dark:hover:text-primary-foreground font-medium transition-colors duration-200"
                  onClick={handleLogout}
                  aria-label="Log out of your account"
                >
                  Log Out
                </button>
              </div>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden sm:flex justify-between items-center">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-3">
              <AnimatedNeuralLogo
                size={56}
                className=""
                alt="Anamnesis Medical AI Assistant Logo"
              />
              <div className="border-l border-border pl-3 ml-1">
                <h1 className="bg-neural-gradient-primary bg-clip-text text-transparent text-lg font-bold">Anamnesis</h1>
                <p className="text-muted-foreground text-sm dark:text-gray-300">Medical AI Assistant</p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-2 md:space-x-4">
              {/* User Email */}
              {user && (
                <span className="text-muted-foreground dark:text-gray-300 mr-2 text-sm">
                  {user.email}
                </span>
              )}

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Logout Button */}
              <button
                type="button"
                className="text-primary border-primary border inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors px-3 py-1.5 hover:bg-primary hover:text-primary-foreground dark:hover:text-primary-foreground font-medium transition-colors duration-200"
                onClick={handleLogout}
                aria-label="Log out of your account"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Container */}
      <main className="flex-1 container-xl p-3 sm:p-4 flex flex-col overflow-hidden">
        <div
          className="flex-1 overflow-y-auto p-3 sm:p-4 rounded-lg border border-border mb-4 bg-card shadow-sm dark:shadow-md transition-all duration-300"
          aria-live="polite"
          aria-atomic="false"
          aria-relevant="additions"
        >
          <div className="space-y-1" role="list" aria-label="Chat messages">
            {isFetchingHistory ? (
              <div className="text-center py-10 text-muted-foreground">
                <div className="inline-flex items-center justify-center space-x-2 mb-2">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" aria-hidden="true"></div>
                  <span>Loading conversation history...</span>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-10 px-4 text-muted-foreground animate-fade-in">
                <h3 className="text-lg md:text-xl font-medium mb-3 text-foreground">Welcome to Anamnesis Medical AI Assistant</h3>
                <p className="mb-2 text-sm sm:text-base">Ask me anything about medical symptoms, conditions, or general health questions.</p>
                <div className="mt-6 p-3 bg-secondary/50 dark:bg-secondary/30 rounded-lg max-w-md mx-auto">
                  <p className="text-sm text-foreground/80 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                      <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
                      <path d="M3 9h18"></path>
                      <path d="M9 21V9"></path>
                    </svg>
                    Your chat is private and secure
                  </p>
                </div>

                {/* Suggested starter questions */}
                <div className="mt-8 space-y-2">
                  <p className="text-sm font-medium text-foreground/70 mb-3">Try asking:</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {starterQuestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleFollowUpClick(suggestion)}
                        className="px-3 py-2 bg-gradient-to-r from-cyan-50 to-cyan-100 hover:from-cyan-100 hover:to-cyan-200 text-cyan-800 dark:from-cyan-900/30 dark:to-cyan-800/30 dark:hover:from-cyan-800/40 dark:hover:to-cyan-700/40 dark:text-cyan-300 text-sm rounded-full transition-all duration-200 shadow-sm hover:shadow-md border border-cyan-200 dark:border-cyan-700/50 hover:border-cyan-300 dark:hover:border-cyan-600/50"
                        aria-label={`Ask: ${suggestion}`}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              messages.map((msg, index) => {
                // Determine if this message is part of a sequence of messages from the same sender
                const prevMsg = index > 0 ? messages[index - 1] : null;
                const nextMsg = index < messages.length - 1 ? messages[index + 1] : null;

                // Check if message is first or last in a sequence from the same sender
                const isFirst = !prevMsg || prevMsg.isUser !== msg.isUser || prevMsg.isError;
                const isLast = !nextMsg || nextMsg.isUser !== msg.isUser;

                // Only show follow-up suggestions for the last AI message in the chat
                const isLastAiMessage = !msg.isUser &&
                  (index === messages.length - 1 || messages.slice(index + 1).every(m => m.isUser));

                return (
                  <MessageBubble
                    key={msg.id}
                    message={msg.content}
                    isUser={msg.isUser}
                    timestamp={msg.timestamp}
                    isError={msg.isError}
                    isHighRisk={Boolean(msg.isHighRisk || (msg.metadata && typeof msg.metadata === 'object' && 'isHighRisk' in msg.metadata && msg.metadata.isHighRisk))}
                    metadata={msg.metadata}
                    originalMessage={msg.originalMessage}
                    onRetry={handleRetryMessage}
                    onFollowUpClick={handleFollowUpClick}
                    showFollowUps={isLastAiMessage}
                    isFirst={isFirst}
                    isLast={isLast}
                    onStopAI={getStopHandler(msg.id)}
                    isStoppingAI={isStoppingAI}
                    isStreaming={msg.status === 'streaming'}
                    status={msg.status || 'sent'}
                    currentStreamingId={currentStreamingId}
                    sessionId={msg.sessionId || ''}
                    userQuery={msg.content || ''}
                    userRole={'user'}
                  />
                );
              })
            )}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-primary/10 text-primary rounded-lg p-3 max-w-[80%]">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce"></div>
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>


        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="flex space-x-2 relative">
          <textarea
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your medical question..."
            className="flex-1 min-h-[3rem] sm:min-h-[3.5rem] max-h-32 px-4 py-3 rounded-2xl border-border shadow-sm focus:ring-2 focus:ring-primary/30 bg-background dark:bg-sidebar-background text-foreground dark:text-foreground placeholder:text-muted-foreground transition-all duration-200 resize-none"
            disabled={isLoading || isFetchingHistory}
            aria-label="Message input"
            maxLength={1000}
            rows={1}
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'var(--primary) transparent'
            }}
            onKeyDown={(e) => {
              /** @type {React.KeyboardEvent<HTMLTextAreaElement>} */
              const keyEvent = e;
              if (keyEvent.key === 'Enter' && !keyEvent.shiftKey && newMessage.trim()) {
                e.preventDefault();
                // Instead of passing the keyboard event, just call the handler directly
                // We already prevented the default above
                if (inputRef.current && inputRef.current.form) {
                  inputRef.current.form.requestSubmit();
                }
              }
            }}
            onInput={(e) => {
              // Auto-resize textarea based on content
              const textarea = e.target;
              textarea.style.height = 'auto';
              textarea.style.height = Math.min(textarea.scrollHeight, 128) + 'px';
            }}
          />
          <button
            type="submit"
            disabled={isLoading || isFetchingHistory || !newMessage.trim()}
            aria-label="Send message"
            className="h-12 sm:h-14 px-5 sm:px-6 rounded-full bg-primary hover:bg-primary-900 focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 transition-all duration-200 text-primary-foreground font-medium"
          >
            {isLoading ? (
              <div className="typing-indicator" aria-label="Message is being sent">
                <span></span>
                <span></span>
                <span></span>
              </div>
            ) : (
              <span className="flex items-center">
                <span className="mr-1">Send</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                  <path d="m22 2-7 20-4-9-9-4Z" />
                  <path d="M22 2 11 13" />
                </svg>
              </span>
            )}
          </button>
        </form>

        {/* Accessibility hint */}
        <div className="text-center mt-3 text-xs text-muted-foreground opacity-70 hidden sm:block" aria-hidden="true">
          Press Enter to send • Shift+Enter for new line
        </div>
      </main>
    </div>
  );
}