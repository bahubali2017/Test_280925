/**
 * @file Type definitions using JSDoc for the Anamnesis Medical AI Assistant
 * @description Contains all shared type definitions used throughout the application
 */

/**
 * @typedef {object} User
 * @property {string} email - User's email address
 */

/**
 * @typedef {object} Message
 * @property {string} id - Unique ID for the message
 * @property {string} content - Message content
 * @property {boolean} isUser - Whether the message is from the user
 * @property {Date} timestamp - When the message was sent
 * @property {boolean} [isError] - Whether this is an error message
 * @property {string} [status] - Message status (sent, delivered, pending, failed, stopped)
 * @property {boolean} [isHighRisk] - Whether this message contains high-risk content
 * @property {object} [metadata] - Additional metadata about the message
 * @property {string} [originalMessage] - Original message text (for error messages)
 */

/**
 * @typedef {object} AuthContextType
 * @property {User|null} user - The current user
 * @property {boolean} isAuthenticated - Whether user is authenticated
 * @property {Function} login - Login function that takes email and password
 * @property {Function} logout - Logout function
 */

/**
 * @typedef {object} DeepSeekConfig
 * @property {string} apiKey - API key for DeepSeek
 * @property {string} model - Model identifier
 * @property {number} temperature - Temperature for generation
 * @property {number} maxTokens - Maximum tokens to generate
 */

/**
 * Export empty object to indicate this file only contains type definitions.
 * This pattern is commonly used for files that solely provide type declarations.
 * @module types
 */
export {};