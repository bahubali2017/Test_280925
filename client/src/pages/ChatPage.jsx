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
 * Enhanced medical chat interface with conversation management
 * Provides streaming AI responses, message history, and medical disclaimers
 */
export function ChatPage() {
  // Core state management
  const [, setLocation] = useLocation();
  const { user, logout, isLoading: authLoading } = useAuth();
  const [messages, setMessages] = useState(/** @type {Message[]} */ ([]));
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);
  const [starterQuestions] = useState(() => getRandomStarterQuestions(4));
  const [sessionId] = useState(() => generateUUID());

  // Refs for auto-scroll and event source
  const messagesEndRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const eventSourceRef = useRef(/** @type {EventSource | null} */ (null));
  const inputRef = useRef(/** @type {HTMLTextAreaElement | null} */ (null));
  const abortControllerRef = useRef(/** @type {AbortController | null} */ (null));

  /**
   * Scrolls to the bottom of the chat container
   */
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  /**
   * Handles metadata detection for high-risk assessments
   * @param {Record<string, unknown>} metadata - Message metadata object
   * @returns {boolean} Whether the message has metadata
   */
  const hasMessageMetadata = (metadata) => {
    return metadata != null && typeof metadata === 'object';
  };

  /**
   * Fetches conversation history from the server
   */
  const fetchMessageHistory = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsFetchingHistory(true);
      const response = await apiRequest('/api/chat/history', {
        method: 'GET',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.messages && Array.isArray(data.messages)) {
          const formattedMessages = data.messages.map((/** @type {any} */ msg) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
            id: msg.id || generateUUID()
          }));
          setMessages(formattedMessages);
        }
      }
    } catch (/** @type {any} */ error) {
      console.error('Failed to fetch message history:', error);
    } finally {
      setIsFetchingHistory(false);
    }
  }, [user?.id]);

  /**
   * Handles starter question clicks
   */
  const handleStarterClick = useCallback((/** @type {string} */ question) => {
    setInput(question);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  /**
   * Handles follow-up suggestion clicks
   */
  const handleFollowUpClick = useCallback((/** @type {string} */ suggestion) => {
    setInput(suggestion);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  /**
   * Cleans up active connections and controllers
   */
  const cleanupConnections = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  /**
   * Handles message retry functionality
   */
  const handleRetryMessage = useCallback(async (/** @type {string} */ messageId) => {
    const messageToRetry = messages.find(msg => msg.id === messageId);
    if (!messageToRetry || !messageToRetry.originalMessage) return;

    // Remove the failed message and any subsequent messages
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    if (messageIndex !== -1) {
      setMessages(prev => prev.slice(0, messageIndex));
    }

    // Retry with the original message
    await handleSubmit(null, messageToRetry.originalMessage);
  }, [messages]);

  /**
   * Handles form submission and message sending
   */
  const handleSubmit = useCallback(async (/** @type {React.FormEvent | null} */ e, /** @type {string | null} */ messageText = null) => {
    if (e) e.preventDefault();
    
    const messageToSend = messageText || input.trim();
    if (!messageToSend || isLoading || !user) return;

    setInput('');
    setIsLoading(true);
    setIsTyping(true);
    setHasError(false);

    // Clean up any existing connections
    cleanupConnections();

    const userMessage = {
      id: generateUUID(),
      content: messageToSend,
      isUser: true,
      timestamp: new Date(),
      sessionId
    };

    const assistantMessage = {
      id: generateUUID(),
      content: '',
      isUser: false,
      timestamp: new Date(),
      sessionId,
      originalMessage: messageToSend,
      isStreaming: true
    };

    setMessages(prev => [...prev, userMessage, assistantMessage]);

    try {
      // Create abort controller for this request
      abortControllerRef.current = new AbortController();

      const response = await apiRequest('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageToSend,
          sessionId,
          userId: user.id
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Handle streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { value, done } = await reader.read();
          
          if (done) {
            setIsTyping(false);
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              
              if (data === '[DONE]') {
                setIsTyping(false);
                continue;
              }

              try {
                const parsed = JSON.parse(data);
                
                if (parsed.content) {
                  setMessages(prev => prev.map(msg => 
                    msg.id === assistantMessage.id 
                      ? { 
                          ...msg, 
                          content: msg.content + parsed.content,
                          isStreaming: true
                        }
                      : msg
                  ));
                }

                if (parsed.metadata) {
                  setMessages(prev => prev.map(msg => 
                    msg.id === assistantMessage.id 
                      ? { 
                          ...msg, 
                          metadata: parsed.metadata,
                          isHighRisk: Boolean(parsed.metadata.isHighRisk)
                        }
                      : msg
                  ));
                }

                if (parsed.done) {
                  setMessages(prev => prev.map(msg => 
                    msg.id === assistantMessage.id 
                      ? { ...msg, isStreaming: false }
                      : msg
                  ));
                  setIsTyping(false);
                }
              } catch (parseError) {
                console.error('Error parsing streaming data:', parseError);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

    } catch (/** @type {any} */ error) {
      console.error('Chat API error:', error);
      
      if (error.name === 'AbortError') {
        console.log('Request was cancelled');
        return;
      }
      
      setHasError(true);
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessage.id 
          ? { 
              ...msg, 
              content: 'I apologize, but I encountered an error processing your request. Please try again.',
              isError: true,
              isStreaming: false
            }
          : msg
      ));
    } finally {
      setIsLoading(false);
      setIsTyping(false);
      abortControllerRef.current = null;
    }
  }, [input, isLoading, user, sessionId, cleanupConnections]);

  /**
   * Handles textarea auto-resize
   */
  const handleInputChange = useCallback((/** @type {React.ChangeEvent<HTMLTextAreaElement>} */ e) => {
    setInput(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 128)}px`;
  }, []);

  /**
   * Handles keyboard shortcuts
   */
  const handleKeyPress = useCallback((/** @type {React.KeyboardEvent<HTMLTextAreaElement>} */ e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }, [handleSubmit]);

  // Effect for fetching message history
  useEffect(() => {
    if (user && !isFetchingHistory) {
      fetchMessageHistory();
    }
  }, [user, fetchMessageHistory, isFetchingHistory]);

  // Effect for auto-scrolling
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupConnections();
    };
  }, [cleanupConnections]);

  // Show loading state during authentication
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-pulse">
            <div className="w-12 h-12 bg-primary/20 rounded-full animate-pulse"></div>
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
      {/* HEADER (Navbar) - Exact specifications */}
      <header className="bg-card dark:bg-sidebar-background border-b border-border shadow-sm py-3 px-4 md:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="hidden md:block">
              <AnimatedNeuralLogo size={56} />
            </div>
            <div className="md:hidden">
              <AnimatedNeuralLogo size={48} />
            </div>
            <div>
              <h1 className="bg-neural-gradient-primary bg-clip-text text-transparent text-lg font-bold">
                Anamnesis
              </h1>
              <p className="text-muted-foreground text-sm dark:text-gray-300">
                Medical AI Assistant
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <ThemeToggle />
            {user && (
              <button
                onClick={logout}
                className="text-primary border-primary border inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors px-3 py-1.5 hover:bg-primary hover:text-primary-foreground dark:hover:text-primary-foreground"
              >
                Log Out
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Chat Container */}
      <main className="flex-1 flex flex-col overflow-hidden p-4">
        
        {/* Chat Container */}
        <div 
          className="flex-1 overflow-y-auto p-3 sm:p-4 rounded-lg border border-border mb-4 bg-card shadow-sm dark:shadow-md"
          role="log" 
          aria-live="polite" 
          aria-atomic="false"
        >
          
          {/* Loading state for fetching history */}
          {isFetchingHistory && (
            <div className="text-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Loading your conversation history...</p>
            </div>
          )}
          
          {/* WELCOME / EMPTY CHAT STATE - Exact specifications */}
          {messages.length === 0 && !isFetchingHistory && (
            <div className="text-center py-10 px-4 text-muted-foreground animate-fade-in">
              <h1 className="text-lg md:text-xl font-medium mb-3 text-foreground">
                Welcome to Anamnesis Medical AI Assistant
              </h1>
              <p className="text-sm sm:text-base">
                Ask me anything about medical symptoms, conditions, or general health questions.
              </p>
              
              {/* Security note box */}
              <div className="mt-6 p-3 bg-secondary/50 dark:bg-secondary/30 rounded-lg max-w-md mx-auto">
                <div className="text-sm text-foreground/80 flex items-center justify-center">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  Your chat is private and secure
                </div>
              </div>

              {/* SUGGESTION CHIPS - Exact cyan pill specifications */}
              <div className="mt-8 space-y-2">
                <p className="text-sm font-medium text-foreground/70 mb-3">Try asking:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {starterQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleStarterClick(question)}
                      aria-label={`Ask: ${question}`}
                      className="px-3 py-2 bg-gradient-to-r from-cyan-50 to-cyan-100 hover:from-cyan-100 hover:to-cyan-200 text-cyan-800 dark:from-cyan-900/30 dark:to-cyan-800/30 dark:hover:from-cyan-800/40 dark:hover:to-cyan-700/40 dark:text-cyan-300 text-sm rounded-full transition-all duration-200 shadow-sm hover:shadow-md border border-cyan-200 dark:border-cyan-700/50 hover:border-cyan-300 dark:hover:border-cyan-600/50"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Messages list */}
          <div className="space-y-1">
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
                  messageId={msg.id}
                  isFirst={isFirst}
                  isLast={isLast}
                  showFollowUps={isLastAiMessage && !msg.isError && !msg.isStreaming}
                  onFollowUpClick={handleFollowUpClick}
                  isStreaming={msg.isStreaming}
                />
              );
            })}
          </div>

          {/* Typing indicator */}
          {isTyping && (
            <div className="bg-primary/10 text-primary rounded-lg p-3 max-w-[80%]">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span className="text-sm">AI is thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* MESSAGE INPUT - Exact specifications */}
        <form onSubmit={(e) => handleSubmit(e)} className="flex space-x-2 relative">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type your medical question..."
              aria-label="Message input"
              className="flex-1 min-h-[3rem] sm:min-h-[3.5rem] max-h-32 w-full px-4 py-3 rounded-2xl border border-border shadow-sm focus:ring-2 focus:ring-primary/30 focus:border-primary bg-background dark:bg-sidebar-background text-foreground resize-none"
              disabled={isLoading}
              rows={1}
            />
            <div className="sr-only" aria-live="polite">
              Press Enter to send • Shift+Enter for new line
            </div>
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            aria-label="Send"
            className="rounded-full h-12 sm:h-14 w-12 sm:w-14 bg-primary hover:bg-primary-900 disabled:bg-primary/50 text-primary-foreground transition-colors focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 flex items-center justify-center"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </main>
    </div>
  );
}

// Default export for compatibility
export default ChatPage;