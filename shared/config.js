/**
 * @file Configuration loading module for the Anamnesis Medical AI Assistant
 * Securely loads environment variables with proper validation
 */

/**
 * @typedef {object} SupabaseConfig
 * @property {string} url - Supabase project URL
 * @property {string} anonKey - Supabase anonymous public key
 * @property {string} serviceKey - Supabase service role key (server-side only)
 */

/**
 * @typedef {object} AppConfig
 * @property {string} env - Current environment (development/production)
 * @property {string} apiUrl - Backend API URL
 * @property {boolean} isDev - Whether the app is running in development mode
 */

/**
 * @typedef {object} Config
 * @property {SupabaseConfig} supabase - Supabase configuration
 * @property {AppConfig} app - Application configuration
 */

/**
 * Gets the required environment variable or throws a clear error
 * @param {string} name - Name of the environment variable
 * @param {string|null} [defaultValue=null] - Optional default value if not found
 * @param {boolean} [isRequired=true] - Whether the environment variable is required
 * @returns {string} The environment variable value
 * @throws {Error} If the required environment variable is missing
 */
function getEnvVar(name, defaultValue = null, isRequired = true) {
  const value = process.env[name] || defaultValue;

  if (isRequired && !value) {
    throw new Error(
      `Environment variable ${name} is required but not set. ` +
      `Please set it in your Replit Secrets tab or in a .env file.`
    );
  }

  return value;
}

/**
 * Loads configuration from environment variables
 * @returns {Config} Application configuration
 */
export function loadConfig() {
  const isDev = getEnvVar('NODE_ENV', 'development') === 'development';

  // Default test credentials for development
  const supabaseUrl = getEnvVar('SUPABASE_URL', 'https://ppwaeyekzpyqqlddfmeb.supabase.co');
  const supabaseAnonKey = getEnvVar('SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
  const supabaseServiceKey = getEnvVar('SUPABASE_SERVICE_KEY', isDev ? 'test-service-key' : undefined);

  // Enhanced debugging output to verify env visibility with safer logging
  console.log('Configuration loaded successfully', {
    url: supabaseUrl,
    hasAnonKey: !!supabaseAnonKey,
    hasServiceKey: !!supabaseServiceKey,
    environment: isDev ? 'development' : 'production'
  });
  
  // Validate all keys explicitly to provide better error messages
  if (!supabaseUrl) {
    throw new Error('SUPABASE_URL is required but not set in environment variables');
  }
  
  if (!supabaseAnonKey) {
    throw new Error('SUPABASE_ANON_KEY is required but not set in environment variables');
  }
  
  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_KEY is required but not set in environment variables');
  }

  /** @type {Config} */
  const config = {
    supabase: {
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
      serviceKey: supabaseServiceKey
    },
    app: {
      env: getEnvVar('NODE_ENV', 'development'),
      apiUrl: getEnvVar('API_URL', isDev ? 'http://localhost:5000' : '', false),
      isDev
    }
  };

  return config;
}

/**
 * Validates that all required configuration is present
 * @param {Config} config - The loaded configuration
 * @returns {boolean} Whether the configuration is valid
 * @throws {Error} If the configuration is invalid
 */
export function validateConfig(config) {
  if (!config.supabase.url || !config.supabase.url.includes('supabase.co')) {
    throw new Error('Invalid SUPABASE_URL. Must be a valid Supabase project URL.');
  }

  if (!config.supabase.anonKey || config.supabase.anonKey.length < 20) {
    throw new Error('Invalid SUPABASE_ANON_KEY. Must be a valid Supabase key.');
  }

  if (!config.supabase.serviceKey || config.supabase.serviceKey.length < 20) {
    throw new Error('Invalid SUPABASE_SERVICE_KEY. Must be a valid Supabase service role key.');
  }

  return true;
}

/**
 * Gets the validated configuration
 * @returns {Config} The validated configuration
 */
export function getConfig() {
  const config = loadConfig();
  validateConfig(config);
  return config;
}

/**
 *
 */
export default getConfig();
