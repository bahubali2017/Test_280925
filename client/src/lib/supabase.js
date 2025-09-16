/**
 * @file Supabase client for the Anamnesis Medical AI Assistant
 * This is a browser-specific adapter. It validates and returns a singleton client.
 */

import { createClient } from '@supabase/supabase-js';

// Load and validate config from environment variables
// Properly access environment variables through import.meta.env in Vite
// @ts-ignore - Vite handles this at build time
const VITE_SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL;
// @ts-ignore - Vite handles this at build time
const VITE_SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY;

// Simple helper to get environment variables from either Vite or Node.js
/**
 * @param {string} key - The environment variable key
 * @returns {string | undefined} The environment variable value
 */
const getEnvVariable = (key) => {
  if (key === 'VITE_SUPABASE_URL') return VITE_SUPABASE_URL;
  if (key === 'VITE_SUPABASE_ANON_KEY') return VITE_SUPABASE_ANON_KEY;
  
  // Fallback for other environment variables
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  
  return undefined;
};

const SUPABASE_URL = getEnvVariable('VITE_SUPABASE_URL');
const SUPABASE_ANON_KEY = getEnvVariable('VITE_SUPABASE_ANON_KEY');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing required Supabase configuration. Check your environment variables.');
}

/**
 * Validates a Supabase URL
 * @param {string} url - The URL to validate
 * @returns {boolean} - True if the URL is valid
 */
function isValidUrl(url) {
  try {
    // Use a safer URL check that doesn't rely on the global URL constructor
    return Boolean(url && 
           typeof url === 'string' && 
           url.startsWith('https://') && 
           url.includes('.'));
  } catch {
    return false;
  }
}

/**
 * Validates Supabase anon key format
 * @param {string} key
 * @returns {boolean}
 */
function isValidKey(key) {
  return typeof key === 'string' && key.length > 20 && key.split('.').length === 3;
}

/**
 * Creates a dummy Supabase client that throws useful errors if used before initialization
 * @param {string} errorMessage - The error message to show when methods are called
 * @returns {import('@supabase/supabase-js').SupabaseClient} - A proxy object that throws errors when accessed
 */
function createDummyClient(errorMessage) {
  return /** @type {import('@supabase/supabase-js').SupabaseClient} */ (new Proxy({}, {
    get() {
      return () => {
        throw new Error(`[Supabase Error] ${errorMessage}`);
      };
    }
  }));
}

/**
 * Initialize and return the Supabase client singleton
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
/** @type {import('@supabase/supabase-js').SupabaseClient | null} */
let _supabaseClient = null;

function getSupabaseClient() {
  if (_supabaseClient) return _supabaseClient;

  if (!SUPABASE_URL || !isValidUrl(SUPABASE_URL)) {
    const msg = 'Invalid or missing VITE_SUPABASE_URL in environment.';
    console.error(msg);
    return createDummyClient(msg);
  }

  if (!SUPABASE_ANON_KEY || !isValidKey(SUPABASE_ANON_KEY)) {
    const msg = 'Invalid or missing VITE_SUPABASE_ANON_KEY in environment.';
    console.error(msg);
    return createDummyClient(msg);
  }

  _supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: true,
      persistSession: true
    }
  });

  return _supabaseClient;
}

/**
 * Initialized Supabase client instance
 * @type {import('@supabase/supabase-js').SupabaseClient}
 */
export const supabaseClient = getSupabaseClient();

/**
 * Sign up a new user
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @param {object} [metadata={}] - Additional user metadata
 * @returns {Promise<{data: any, error: Error|null}>} Supabase signup result
 */
export async function signUp(email, password, metadata = {}) {
  return supabaseClient.auth.signUp({
    email,
    password,
    options: { data: metadata }
  });
}

/**
 * Sign in with email/password
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @returns {Promise<{data: any, error: Error|null}>} Supabase signin result
 */
export async function signIn(email, password) {
  return supabaseClient.auth.signInWithPassword({ email, password });
}

/**
 * Sign in with OAuth provider
 * @param {'google'|'github'|'apple'|'azure'|'twitter'|'discord'|'facebook'} provider - The OAuth provider name
 * @returns {Promise<{data: any, error: Error|null}>} Supabase OAuth signin result
 */
export async function signInWithProvider(provider) {
  const redirectTo = typeof window !== 'undefined'
    ? `${window.location.origin}/auth/callback`
    : undefined;

  // Use proper typing for the provider parameter
  return supabaseClient.auth.signInWithOAuth({
    provider: provider,
    options: { redirectTo }
  });
}

/**
 * Sign out the current user
 * @returns {Promise<{error: Error|null}>} Supabase signout result
 */
export async function signOut() {
  return supabaseClient.auth.signOut();
}

/**
 * Get current session
 * @returns {Promise<{data: {session: any}, error: Error|null}>} Supabase session result
 */
export async function getSession() {
  return supabaseClient.auth.getSession();
}

/**
 * Get current user
 * @returns {Promise<{data: {user: any}, error: Error|null}>} Supabase user result
 */
export async function getUser() {
  return supabaseClient.auth.getUser();
}

/**
 * Export the initialized Supabase client as default export
 * @returns {import('@supabase/supabase-js').SupabaseClient} The Supabase client instance
 */
export default supabaseClient;
