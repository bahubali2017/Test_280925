/**
 * @file Utility for logging and managing message data with metadata
 * Supports message logging for admin review as part of Phase 4.5
 */

/* global navigator, sessionStorage */

import { apiRequest } from '../queryClient.jsx';

/**
 * @typedef {object} MessageMetadata
 * @property {boolean} [isHighRisk] - Whether the message contains high-risk content
 * @property {object} [layerContext] - Layer context information from the layered AI system
 * @property {string} [sessionId] - Unique identifier for the chat session
 * @property {string} [timestamp] - ISO timestamp when the message was created
 * @property {object} [device] - Information about the user's device
 */

/**
 * @typedef {object} MessageLogOptions
 * @property {string} userId - User ID associated with the message
 * @property {string} content - Content of the message
 * @property {boolean} [isUser=true] - Whether message is from user (vs AI)
 * @property {MessageMetadata} [metadata={}] - Additional message metadata
 */

/**
 * Logs a message with detailed metadata for admin review
 * Part of Phase 4.5 implementation for comprehensive message logging
 * 
 * @param {MessageLogOptions} options - Message logging options
 * @returns {Promise<object>} The logged message data
 */
export async function logMessage({ userId, content, isUser = true, metadata = {} }) {
  try {
    // Ensure metadata is an object
    const messageMetadata = typeof metadata === 'object' && metadata !== null
      ? { ...metadata }
      : {};
      
    // Add timestamp if not already present
    if (!messageMetadata.timestamp) {
      messageMetadata.timestamp = new Date().toISOString();
    }
    
    // Add basic browser/device info for analytics
    if (!messageMetadata.device && typeof window !== 'undefined') {
      messageMetadata.device = {
        userAgent: navigator.userAgent,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        language: navigator.language
      };
    }
    
    // Prepare data for the API request
    const data = {
      userId,
      content,
      isUser,
      metadata: messageMetadata
    };
    
    // Save the message with its metadata
    const response = await apiRequest('POST', '/api/messages', data);
    const responseData = await response.json();
    
    return responseData;
  } catch (error) {
    console.error('Failed to log message:', error);
    throw new Error(`Message logging failed: ${error.message}`);
  }
}

/**
 * Retrieves logged messages for a specified user
 * Used for conversation history and admin review
 * 
 * @param {string} userId - User ID to retrieve messages for
 * @param {number} [limit=50] - Maximum number of messages to retrieve
 * @returns {Promise<Array>} Array of message objects
 */
export async function getLoggedMessages(userId, limit = 50) {
  try {
    const response = await apiRequest('GET', `/api/messages/${userId}?limit=${limit}`);
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Failed to retrieve logged messages:', error);
    return [];
  }
}

/**
 * Clears message history for a user
 * Used for privacy controls and conversation resets
 * 
 * @param {string} userId - User ID to clear messages for
 * @returns {Promise<boolean>} Whether the operation was successful
 */
export async function clearMessageHistory(userId) {
  try {
    await apiRequest('DELETE', `/api/messages/clear/${userId}`);
    return true;
  } catch (error) {
    console.error('Failed to clear message history:', error);
    return false;
  }
}

/**
 * Prepares a message object with metadata for saving
 * Utility function for preparing message data before sending to API
 * 
 * @param {string} content - Message content
 * @param {boolean} isUser - Whether the message is from the user
 * @param {object} contextData - Additional context data to include as metadata
 * @returns {object} Prepared message object
 */
export function prepareMessageWithMetadata(content, isUser, contextData = {}) {
  // Extract risk assessment if available
  const isHighRisk = contextData.isHighRisk || false;
  
  // Create metadata object with context and session info
  const metadata = {
    isHighRisk,
    sessionId: contextData.sessionId || generateSessionId(),
    timestamp: new Date().toISOString(),
    layerContext: contextData.layerContext || null
  };
  
  return {
    content,
    isUser,
    metadata
  };
}

/**
 * Generates a unique session ID if one doesn't exist
 * @returns {string} A unique session identifier
 */
function generateSessionId() {
  // Use existing session ID from sessionStorage if available
  if (typeof window !== 'undefined' && window.sessionStorage) {
    const existingId = sessionStorage.getItem('anamnesis_session_id');
    if (existingId) return existingId;
    
    // Create new session ID
    const newId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('anamnesis_session_id', newId);
    return newId;
  }
  
  // Fallback if sessionStorage not available
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}