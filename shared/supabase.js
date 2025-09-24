/**
 * @file Supabase client module for the Anamnesis Medical AI Assistant
 * Provides authenticated Supabase clients for frontend and backend
 */

import { createClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase client with the provided credentials
 * @param {string} supabaseUrl - The Supabase project Ufi
 * @param {string} supabaseKey - The Supabase API key (anon or service role)
 * @param {object} [options={}] - Additional client options
 * @returns {import('@supabase/supabase-js').SupabaseClient} The Supabase client
 */
export function createSupabaseClient(supabaseUrl, supabaseKey, options = {}) {
  return createClient(supabaseUrl, supabaseKey, options);
}

// Load credentials from environment
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Fixed variable name to match config.js

/**
 * The frontend Supabase client using the anonymous key
 * Safe to use in browser code
 */
export const supabaseClient = createSupabaseClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true
    }
  }
);

/**
 * The admin Supabase client using the service role key
 * WARNING: Only use on the server side, never expose to the client
 */
export const supabaseAdmin = createSupabaseClient(
  supabaseUrl,
  supabaseServiceKey
);

/**
 * Helper function to sign up with email and password
 * @param email
 * @param password
 * @param metadata
 */
export async function signUp(email, password, metadata = {}) {
  return supabaseClient.auth.signUp({
    email,
    password,
    options: { data: metadata }
  });
}

/**
 * Helper function to sign in with email and password
 * @param email
 * @param password
 */
export async function signIn(email, password) {
  return supabaseClient.auth.signInWithPassword({ email, password });
}

/**
 * Helper function to sign in with a third-party provider
 * @param provider
 */
export async function signInWithProvider(provider) {
  return supabaseClient.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${process.env.APP_URL || 'http://localhost:5000'}/auth/callback`
    }
  });
}

/**
 * Helper function to sign out the current user
 */
export async function signOut() {
  return supabaseClient.auth.signOut();
}

/**
 * Helper function to get the current user session
 */
export async function getSession() {
  return supabaseClient.auth.getSession();
}

/**
 * Helper function to get the current user
 */
export async function getUser() {
  return supabaseClient.auth.getUser();
}

/**
 *
 */
export default supabaseClient;
