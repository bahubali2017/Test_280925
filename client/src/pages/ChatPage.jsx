import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../hooks/useAuth';
import { MessageBubble } from '../components/MessageBubble';
import AnimatedNeuralLogo from '../components/AnimatedNeuralLogo.jsx';
import { ThemeToggle } from '../components/ThemeToggle.jsx';
import { apiRequest } from '../lib/queryClient';
import { getRandomStarterQuestions } from '../lib/suggestions';

/**
 * Simple UUID generator using crypto API with fallback
 * @returns {string} Generated UUID string
 */
const generateUUID = () => {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * Message structure for chat conversations
 * @typedef {{
 *   id: string;
 *   content: string;
 *   isUser: boolean;
 *   timestamp: Date;
 *   isError?: boolean;
 *   status?: string;
 *   isHighRisk?: boolean;
 *   metadata?: Record<string, unknown>;
 *   originalMessage?: string;
 *   sessionId?: string;
 *   isRetry?: boolean;
 *   isCancelled?: boolean;
 *   isStreaming?: boolean;
 * }} Message
 */

/**
 * API error response structure
 * @typedef {{
 *   type: string;
 *   message?: string;
 *   details?: string;
 * }} APIErrorResponse
 */

/**
 * User authentication structure
 * @typedef {{
 *   id: string;
 *   email?: string;
 *   name?: string;
 * }} User
 */

/**
 * Authentication hook return type
 * @typedef {{
 *   user: User | null;
 *   logout: () => void;
 *   isLoading: boolean;
 * }} AuthHookResult
 */

/**
 * Location hook return type
 * @typedef {[string, (path: string) => void]} LocationHookResult
 */

/**
 * LLM API result structure
 * @typedef {{
 *   content?: string;
 *   metadata?: Record<string, unknown>;
 * }} LLMApiResult
 */

/**
 * Streaming update callback parameters
 * @typedef {{
 *   fullContent?: string;
 *   streaming?: boolean;
 *   metadata?: Record<string, unknown>;
 * }} StreamingInfo
 */

/**
 * Direct import to prevent caching issues during development
 * @returns {Promise<{sendMessage: Function}>}
 */
const getLLMApi = async () => {
  // Always fresh import to prevent module cache conflicts
  return import('../lib/llm-api');
};

/**
 * Type guard to check if an error is an API error response
 * @param {unknown} error - The error to check
 * @returns {error is APIErrorResponse}
 */
function isAPIErrorResponse(error) {
  return typeof error === 'object' &&
         error !== null &&
         'type' in error &&
         typeof error.type === 'string';
}

/**
 * Type guard to check if target is an HTMLTextAreaElement
 * @param {EventTarget | null} target - The event target
 * @returns {target is HTMLTextAreaElement}
 */
function isHTMLTextAreaElement(target) {
  return target !== null && 
         typeof target === 'object' && 
         'tagName' in target && 
         target.tagName === 'TEXTAREA';
}

/**
 * Type guard to check if an object has the required properties for message metadata
 * @param {unknown} obj - Object to check
 * @returns {obj is Record<string, unknown>}
 */
function hasMessageMetadata(obj) {
  return obj !== null && typeof obj === 'object';
}

/**
 * ChatPage component that displays the chat interface
 * @returns {JSX.Element} The ChatPage component
 */
export default function ChatPage() {
  
  /** @type {[Message[], React.Dispatch<React.SetStateAction<Message[]>>]} */
  const [messages, setMessages] = useState(/** @type {Message[]} */([]));
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
  /** @type {[string[], React.Dispatch<React.SetStateAction<string[]>>]} */
  const [starterQuestions, setStarterQuestions] = useState(/** @type {string[]} */([]));
  /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} */
  const [hasError, setHasError] = useState(false);

  const { user, logout, isLoading: authLoading } = /** @type {AuthHookResult} */ (useAuth());
  const [, setLocation] = /** @type {LocationHookResult} */ (useLocation());

  // Reset error state when user changes
  useEffect(() => {
    setHasError(false);
  }, [user]);

  /** @type {React.RefObject<HTMLDivElement>} */
  const messagesEndRef = useRef(null);
  /** @type {React.RefObject<HTMLTextAreaElement>} */
  const inputRef = useRef(null);

  /**
   * Scrolls to the bottom of the chat container
   * @returns {void}
   */
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  /**
   * Fetches message history from the server
   * @returns {Promise<void>}
   */
  const fetchMessageHistory = useCallback(async () => {
    if (!user?.id) return;

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
        /** @type {Message[]} */
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
    if (inputRef.current) {
      inputRef.current.focus();
    }

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
   * @param {Message[]} messageList - List of messages
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
   * Get error message based on error type
   * @param {APIErrorResponse|Error|unknown} error - Error object
   * @returns {string} User-friendly error message
   */
  const getErrorMessage = (error) => {
    const defaultMessage = "I'm sorry, I encountered an error processing your request. Please try again later.";

    if (!error) return defaultMessage;

    // Check if it's our standardized error format
    if (isAPIErrorResponse(error)) {
      switch (error.type) {
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
      const result = /** @type {LLMApiResult|undefined} */ (await sendMessage(
        messageContent,
        conversationHistory,
        {
          /**
           * @param {string} chunk - Content chunk from stream
           * @param {StreamingInfo} info - Streaming info with fullContent
           */
          onStreamingUpdate: (chunk, info) => {
            // Update the message content in real-time as chunks arrive
            setMessages(prev => prev.map(msg =>
              msg.id === `${retryId}_response`
                ? {
                    ...msg,
                    content: (info.fullContent || msg.content + chunk),
                    isStreaming: true,
                    status: 'streaming',
                    metadata: { ...msg.metadata, ...(info.metadata || {}) }
                  }
                : msg
            ));
          },
          sessionId: retryId
        }
      ));

      // CRITICAL FIX: Update the placeholder message with the actual AI response
      if (result?.content) {
        setMessages(prev => prev.map(msg =>
          msg.id === `${retryId}_response`
            ? {
                ...msg,
                content: result.content || '',
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
          const wasManuallyAborted = (originalMessage?.metadata && 
                                    hasMessageMetadata(originalMessage.metadata) &&
                                    ('manuallyAborted' in originalMessage.metadata ||
                                     'cancelledByUser' in originalMessage.metadata)) ||
                                   originalMessage?.isCancelled || 
                                   originalMessage?.status === 'stopped' ||
                                   originalMessage?.status === 'stopping';
          
          if (wasManuallyAborted) {
            return prev; // Don't add error message, user already stopped it
          }

          // Check if this was a deliberate abort/stop action (from AbortController)
          const isAbortError = error &&
            ((typeof error === 'object' && error !== null && 'type' in error && error.type === 'abort') ||
             (typeof error === 'object' && error !== null && 'name' in error && error.name === 'AbortError') ||
             (typeof error === 'object' && error !== null && 'message' in error &&
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
  }, [messages, lastUserMessage, retryCount, currentStreamingId]);

  /**
   * Handles sending a new message
   * @param {React.FormEvent<HTMLFormElement>|{preventDefault: () => void}} e - The form event or synthetic event
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

    // Store the user message content before clearing
    const userMessageContent = newMessage;

    // Clear input and focus it for next message
    setNewMessage('');
    if (inputRef.current) {
      inputRef.current.focus();
    }

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
      const result = /** @type {LLMApiResult|undefined} */ (await sendMessage(
        userMessageContent,
        conversationHistory,
        {
          /**
           * @param {string} chunk - Content chunk from stream
           * @param {StreamingInfo} info - Streaming info with fullContent
           */
          onStreamingUpdate: (chunk, info) => {
            setMessages(prev => prev.map(msg =>
              msg.id === assistantMessageId
                ? {
                    ...msg,
                    content: (info.fullContent || msg.content + chunk),
                    isStreaming: true,
                    status: 'streaming',
                    metadata: { ...msg.metadata, ...(info.metadata || {}) }
                  }
                : msg
            ));
          },
          sessionId: sessionId
        }
      ));

      // CRITICAL FIX: Update the placeholder message with the actual AI response
      if (result?.content) {
        setMessages(prev => prev.map(msg =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: result.content || '',
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
        name: error && typeof error === 'object' && error !== null && 'name' in error ? error.name : 'unknown',
        message: error && typeof error === 'object' && error !== null && 'message' in error ? error.message : String(error),
        stack: error && typeof error === 'object' && error !== null && 'stack' in error ? error.stack : undefined,
        type: error && typeof error === 'object' && error !== null && 'type' in error ? error.type : 'unknown'
      });

      // Get appropriate user-friendly error message
      const errorMessage = getErrorMessage(typedError);

      // If we have a streaming message in progress, check if it was already delivered
      if (currentStreamingId) {
        setMessages((prev) => {
          // Check if this message was already manually stopped by user  
          const originalMessage = prev.find(msg => msg.id === currentStreamingId);
          const wasManuallyAborted = (originalMessage?.metadata && 
                                    hasMessageMetadata(originalMessage.metadata) &&
                                    ('manuallyAborted' in originalMessage.metadata ||
                                     'cancelledByUser' in originalMessage.metadata)) ||
                                   originalMessage?.isCancelled || 
                                   originalMessage?.status === 'stopped' ||
                                   originalMessage?.status === 'stopping';
          
          if (wasManuallyAborted) {
            return prev; // Don't add error message, user already stopped it
          }

          // Check if this was a deliberate abort/stop action (from AbortController)
          const isAbortError = error && typeof error === 'object' && error !== null && 
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
                  originalMessage: userMessageContent
                }
              : msg
          );
        });

        // Clear streaming state
        setCurrentStreamingId(null);
  
      } else {
        // Add error message
        setMessages(prev => [...prev, {
          id: generateUUID(),
          content: errorMessage,
          isUser: false,
          timestamp: new Date(),
          isError: true,
          status: 'failed',
          sessionId: sessionId
        }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles clicking on a follow-up question
   * @param {string} question - The follow-up question text
   * @returns {void}
   */
  const handleFollowUpClick = (question) => {
    setNewMessage(question);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  /**
   * Get a stop handler for a specific message
   * @param {string} messageId - The message ID to stop
   * @returns {() => Promise<void>} The stop handler function
   */
  const getStopHandler = (messageId) => {
    return async () => {
      if (!currentStreamingId || currentStreamingId !== messageId) {
        return; // Only allow stopping the current streaming message
      }

      setIsStoppingAI(true);

      try {
        // Get the LLM API module to access the stop function
        const llmApi = await getLLMApi();
        
        // Call the stop streaming function if it exists
        if ('stopStreaming' in llmApi && typeof llmApi.stopStreaming === 'function') {
          await llmApi.stopStreaming(messageId);
        }

        // Update the message to show it was stopped by user
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? {
                ...msg,
                isStreaming: false,
                status: 'stopped',
                isCancelled: true,
                content: msg.content || 'Response stopped by user',
                metadata: {
                  ...msg.metadata,
                  cancelledByUser: true,
                  manuallyAborted: true
                }
              }
            : msg
        ));

        // Clear the current streaming ID
        setCurrentStreamingId(null);

        console.info(`[ChatPage] Successfully stopped AI response for message ${messageId}`);

      } catch (error) {
        console.error('Error stopping AI response:', error);
        
        // Still try to mark the message as stopped in the UI
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? {
                ...msg,
                isStreaming: false,
                status: 'stopped',
                isCancelled: true,
                content: msg.content || 'Response stopped',
                metadata: {
                  ...msg.metadata,
                  cancelledByUser: true,
                  manuallyAborted: true,
                  stopError: true
                }
              }
            : msg
        ));

        setCurrentStreamingId(null);
      } finally {
        setIsStoppingAI(false);
      }
    };
  };

  /**
   * Handles clicking on a starter question
   * @param {string} question - The starter question text
   * @returns {void}
   */
  const handleStarterClick = (question) => {
    setNewMessage(question);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  /**
   * Handle input event for auto-resize
   * @param {React.FormEvent<HTMLTextAreaElement>} e - Input event
   */
  const handleTextareaInput = (e) => {
    const target = e.target;
    if (isHTMLTextAreaElement(target)) {
      // Auto-resize textarea based on content
      target.style.height = 'auto';
      target.style.height = Math.min(target.scrollHeight, 128) + 'px';
    }
  };

  // Show loading state during authentication
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-pulse">
            <AnimatedNeuralLogo />
          </div>
          <p className="text-muted-foreground">Loading your medical AI assistant...</p>
        </div>
      </div>
    );
  }

  // Show error state if something went wrong
  if (hasError && !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="text-6xl">⚠️</div>
          <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
          <p className="text-muted-foreground max-w-md">
            We're having trouble loading your medical AI assistant. Please refresh the page or try again later.
          </p>
          <button
            onClick={() => {
              setHasError(false);
              if (user) {
                fetchMessageHistory();
              }
            }}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-6 p-6">
          <div className="mb-8">
            <AnimatedNeuralLogo />
          </div>
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-foreground">Welcome to Anamnesis</h1>
            <p className="text-lg text-muted-foreground max-w-md">
              Your AI-powered medical consultation assistant. Get personalized health insights and medical guidance.
            </p>
            <button
              onClick={() => setLocation('/login')}
              className="px-8 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all duration-200 font-medium text-lg shadow-lg"
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8">
            <AnimatedNeuralLogo />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Anamnesis</h1>
            <p className="text-xs text-muted-foreground">Medical AI Assistant</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <ThemeToggle />
          
          {user && (
            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-foreground">{user.name || user.email}</p>
                <p className="text-xs text-muted-foreground">Authenticated</p>
              </div>
              <button
                onClick={logout}
                className="text-sm px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Chat Container */}
      <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-4 space-y-4 overflow-hidden">
        
        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto rounded-lg bg-muted/30 backdrop-blur-sm">
          <div 
            className="p-4 space-y-4 min-h-full" 
            role="log" 
            aria-live="polite" 
            aria-label="Chat conversation"
          >
            
            {/* Loading state for fetching history */}
            {isFetchingHistory && (
              <div className="text-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading your conversation history...</p>
              </div>
            )}
            
            {/* Welcome message with starter questions */}
            {messages.length === 0 && !isFetchingHistory && (
              <div className="text-center py-12 space-y-6">
                <div className="mb-6">
                  <div className="w-16 h-16 mx-auto mb-4">
                    <AnimatedNeuralLogo />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    Hello, {user?.name ? user.name.split(' ')[0] : 'there'}!
                  </h2>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    I'm your AI medical assistant. Ask me about symptoms, conditions, medications, or general health questions.
                  </p>
                </div>

                {/* Starter Questions */}
                <div className="max-w-2xl mx-auto">
                  <h3 className="text-lg font-medium text-foreground mb-4">Popular questions to get started:</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {starterQuestions.map((question, index) => (
                      <button
                        key={index}
                        onClick={() => handleStarterClick(question)}
                        className="p-3 text-left rounded-lg bg-card hover:bg-accent hover:text-accent-foreground transition-colors duration-200 border border-border text-sm"
                      >
                        <span className="text-primary mr-2">💬</span>
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Message list */}
            {messages.length > 0 && messages.map((msg, index) => {
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
                  isHighRisk={Boolean(msg.isHighRisk || (hasMessageMetadata(msg.metadata) && 'isHighRisk' in msg.metadata && msg.metadata.isHighRisk))}
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
                  status={/** @type {'sent'|'delivered'|'failed'|'stopped'|'stopping'|'cancelled'} */(msg.status || 'sent')}
                  sessionId={msg.sessionId || ''}
                  userQuery={msg.content || ''}
                  userRole={'user'}
                />
              );
            })}

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
              if (e.key === 'Enter' && !e.shiftKey && newMessage.trim()) {
                e.preventDefault();
                // Instead of passing the keyboard event, just call the handler directly
                // We already prevented the default above
                if (inputRef.current?.form) {
                  inputRef.current.form.requestSubmit();
                }
              }
            }}
            onInput={handleTextareaInput}
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