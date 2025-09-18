/**
 * @file Comprehensive TypeScript definitions for chat functionality
 * @description Fixes critical type errors blocking AI chat functionality
 */

// Core message and metadata types
export interface MessageMetadata {
  // Query analysis metadata
  queryIntent?: {
    type: string;
    confidence?: number;
    disclaimers?: string[];
    userDemographic?: string;
    isComplete?: boolean;
  };
  
  // Triage and medical assessment
  triageLevel?: 'emergency' | 'urgent' | 'non_urgent';
  isHighRisk?: boolean;
  
  // Layer processing metadata
  layerStatus?: {
    parseIntent?: string;
    triage?: string;
    enhancePrompt?: string;
    llmCall?: string;
  };
  layerProcessingTime?: number;
  
  // Request and response metadata
  requestTime?: number;
  attemptCount?: number;
  isTimeout?: boolean;
  isCancelled?: boolean;
  isStreaming?: boolean;
  
  // Fallback and error handling
  fallbackReason?: string;
  delivered?: boolean;
  
  // Processing timing
  processingTime?: number;
  intentConfidence?: number;
  bodySystem?: string;
  symptoms?: string[];
  stageTimings?: Record<string, number>;
}

// Complete Message interface extending the existing structure
export interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  isError?: boolean;
  status?: 'sent' | 'delivered' | 'pending' | 'failed' | 'stopped';
  isHighRisk?: boolean;
  metadata?: MessageMetadata;
  originalMessage?: string;
  isStreaming?: boolean;
  sessionId?: string; // Fixed: should be string, not object
  isRetry?: boolean;
  isCancelled?: boolean;
}

// Component prop types
export interface MessageBubbleProps {
  message: string;
  isUser: boolean;
  timestamp?: Date;
  isError?: boolean;
  isHighRisk?: boolean;
  metadata?: MessageMetadata;
  originalMessage?: string;
  onRetry?: (messageToRetry?: string) => void;
  onFollowUpClick?: (suggestion: string) => void;
  onStopAI?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  isStoppingAI?: boolean;
  showFollowUps?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
  className?: string;
  isStreaming?: boolean;
  partialContent?: string;
  status?: string;
  sessionId?: string;
  messageId?: string;
  streamingMessageId?: string;
  userQuery?: string;
  userRole?: string;
}

// Streaming callback type
export type StreamingCallback = (content?: string, metadata?: MessageMetadata) => void;

// API and callback types
export interface APIErrorResponse {
  type: string;
  message: string;
  status?: number;
  originalError?: any;
}

// Event handler types
export type ButtonClickHandler = (event: React.MouseEvent<HTMLButtonElement>) => void;
export type InputChangeHandler = (event: React.ChangeEvent<HTMLInputElement>) => void;
export type FormSubmitHandler = (event: React.FormEvent<HTMLFormElement>) => void;

// LLM API types
export interface LLMApiModule {
  sendMessageClientSide: (
    query: string,
    conversationHistory: Array<{role: string, content: string}>,
    onStreamCallback: StreamingCallback,
    sessionId: string
  ) => Promise<void>;
}

// Utility types for component state
export type MessageList = Message[];
export type ConversationHistory = Array<{role: string, content: string}>;

// HTML Element event types for proper typing
export type HTMLButtonElement = globalThis.HTMLButtonElement;
export type HTMLInputElement = globalThis.HTMLInputElement;
export type HTMLFormElement = globalThis.HTMLFormElement;

// Export the main types for easy import
export type {
  Message as ChatMessage,
  MessageMetadata as ChatMetadata,
  MessageBubbleProps as BubbleProps
};