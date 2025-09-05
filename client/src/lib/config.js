/**
 * @file Configuration loading module for the Anamnesis Medical AI Assistant
 * Securely loads environment variables with proper validation
 */

/**
 * @typedef {object} AppConfig - Application configuration
 * @property {boolean} isDevelopment - Whether the app is running in development mode
 * @property {string} apiUrl - The API URL for backend requests
 */

/**
 * @typedef {object} Config - Complete application configuration
 * @property {AppConfig} app - Application configuration
 */

/**
 * Environment detection for the application
 * @returns {boolean} Whether the application is running in development mode
 */
function detectDevelopmentMode() {
  let isDev = false;
  
  try {
    // Check for Node.js environment first
    if (typeof process !== 'undefined' && process.env) {
      isDev = process.env.NODE_ENV === 'development';
      if (isDev) return true;
    }
    
    // Check for browser environment next
    if (typeof window !== 'undefined') {
      // Check for common development indicators
      isDev = (
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.includes('gitpod.io') ||
        window.location.hostname.includes('replit.dev') ||
        window.location.hostname.includes('.repl.co') ||
        window.location.port === '3000' ||
        window.location.port === '5173'
      );
      if (isDev) return true;
    }
  } catch (e) {
    console.warn('Error detecting environment:', e);
  }
  
  return false;
}

/**
 * Safe environment indicator
 */
const isDevelopment = detectDevelopmentMode();

/**
 * Gets an environment variable with validation
 * @param {string} key - The environment variable key
 * @param {string} [fallback='/api'] - Optional fallback value
 * @param {boolean} [warn=true] - Whether to log a warning if the value is missing
 * @returns {string} The environment variable value or fallback
 */
function getEnvVar(key, fallback = '/api', warn = true) {
  // Ensure key is a valid string
  const safeKey = typeof key === 'string' ? key : '';
  let value = null;
  
  try {
    // Try to access variables from different sources
    if (typeof process !== 'undefined' && process.env) {
      // Node.js environment
      if (safeKey in process.env) {
        value = process.env[safeKey];
      }
    }
    
    // Use window for browser environments
    if (value === null && typeof window !== 'undefined') {
      // Use a safer approach without accessing window properties directly
      try {
        // Check for browser-specific environment variables
        if (safeKey === 'VITE_API_URL') {
          // First try to access native location to detect current domain
          const locationOrigin = window.location.origin;
          if (locationOrigin && typeof locationOrigin === 'string') {
            // In development, we often use relative paths anyway
            if (isDevelopment) {
              // Just use the default API URL in development mode
              value = '/api';
            }
          }
        }
      } catch (e) {
        // Ignore errors accessing window properties
        console.warn(`Error detecting environment in browser:`, e);
      }
    }
    
    // Warning logic for development mode
    if (isDevelopment && warn && value === null) {
      console.warn(`Environment variable ${safeKey} is missing. Using fallback value: ${fallback}`);
    }
  } catch (e) {
    console.warn(`Error accessing environment variable ${safeKey}:`, e);
  }
  
  // Ensure we always return a valid string
  return value !== null && value !== undefined && value !== '' ? String(value) : String(fallback);
}

/**
 * Gets application configuration
 * @returns {AppConfig} Application configuration
 */
function getAppConfig() {
  return {
    isDevelopment: isDevelopment,
    apiUrl: getEnvVar('VITE_API_URL', '/api')
  };
}

/**
 * Gets the complete application configuration
 * @returns {Config} The complete configuration
 */
export function getConfig() {
  return {
    app: getAppConfig()
  };
}

/**
 * The loaded application configuration
 * @type {Config}
 */
const config = getConfig();

/**
 * Export the configuration
 * @module config
 */
export default config;