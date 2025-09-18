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
 * Known production domains that should NEVER activate development mode
 * This is a security-critical whitelist
 */
const PRODUCTION_DOMAINS = [
  'anamnesis.health',
  'anamnesis-health.com',
  'mvp-anamnesis.health',
  'app.anamnesis.health',
  'anamnesis.app',
  'anamnesis.ai'
];

/**
 * Environment detection for the application
 * SECURITY-CRITICAL: This function determines if development authentication bypass is allowed
 * @returns {boolean} Whether the application is running in development mode
 */
function detectDevelopmentMode() {
  try {
    // SECURITY CHECK #1: Explicit production domain blocking
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname.toLowerCase();
      
      // CRITICAL: Block development mode for any production domain
      for (const prodDomain of PRODUCTION_DOMAINS) {
        if (hostname === prodDomain || hostname.endsWith('.' + prodDomain)) {
          console.log(`[SECURITY] Production domain detected: ${hostname}. Development mode BLOCKED.`);
          return false;
        }
      }
      
      // SECURITY CHECK #2: Block if hostname looks like a production domain
      if (hostname.includes('anamnesis') && !hostname.includes('replit') && !hostname.includes('localhost')) {
        console.log(`[SECURITY] Production-like domain detected: ${hostname}. Development mode BLOCKED.`);
        return false;
      }
    }
    
    // SECURITY CHECK #3: Node.js environment check (must be explicit 'development')
    if (typeof process !== 'undefined' && process.env) {
      const nodeEnv = process.env.NODE_ENV;
      if (nodeEnv && nodeEnv.toLowerCase() === 'development') {
        console.log(`[SECURITY] NODE_ENV=development detected. Development mode allowed.`);
        return true;
      }
      // If NODE_ENV is set to anything other than 'development', block dev mode
      if (nodeEnv && nodeEnv.toLowerCase() !== 'development') {
        console.log(`[SECURITY] NODE_ENV=${nodeEnv} detected. Development mode BLOCKED.`);
        return false;
      }
    }
    
    // SECURITY CHECK #4: Browser development indicators (restrictive whitelist)
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname.toLowerCase();
      const port = window.location.port;
      
      // Only allow development mode for known safe development environments
      const isDevHostname = (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname.endsWith('.replit.dev') ||
        hostname.endsWith('.repl.co') ||
        hostname.includes('gitpod.io')
      );
      
      const isDevPort = (
        port === '3000' ||
        port === '5173' ||
        port === '4173'
      );
      
      if (isDevHostname || isDevPort) {
        console.log(`[SECURITY] Development environment detected: ${hostname}:${port}. Development mode allowed.`);
        return true;
      }
    }
  } catch (e) {
    console.error('[SECURITY] Error in development mode detection:', e);
    // On error, default to production mode (safer)
    return false;
  }
  
  // Default to production mode for security
  console.log('[SECURITY] No development indicators found. Development mode BLOCKED.');
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