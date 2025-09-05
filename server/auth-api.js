/**
 * @file Authentication API for the Anamnesis Medical AI Assistant
 * Handles user authentication through Supabase
 */

import { supabaseAdmin } from '../shared/supabase.js';

/**
 * @typedef {object} AuthResult
 * @property {boolean} success - Whether the operation was successful
 * @property {object|null} user - The authenticated user object (if successful)
 * @property {string|null} error - Error message (if unsuccessful)
 * @property {string|null} token - Authentication token (if successful)
 */

/**
 * Validates a user's credentials and returns an auth result
 * @param {string} email - The user's email address
 * @param {string} password - The user's password
 * @returns {Promise<AuthResult>} The authentication result
 */
export async function authenticateUser(email, password) {
  try {
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      return {
        success: false,
        user: null,
        error: error.message,
        token: null
      };
    }
    
    return {
      success: true,
      user: data.user,
      error: null,
      token: data.session.access_token
    };
  } catch (error) {
    console.error('Authentication error:', error.message);
    
    return {
      success: false,
      user: null, 
      error: 'Server error during authentication',
      token: null
    };
  }
}

/**
 * Creates a new user account
 * @param {string} email - The user's email address
 * @param {string} password - The user's password
 * @param {object} [metadata={}] - Additional user metadata
 * @returns {Promise<AuthResult>} The registration result
 */
export async function createUser(email, password, metadata = {}) {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for MVP
      user_metadata: metadata
    });
    
    if (error) {
      return {
        success: false,
        user: null,
        error: error.message,
        token: null
      };
    }
    
    return {
      success: true,
      user: data.user,
      error: null,
      token: null // No token on creation, user must sign in
    };
  } catch (error) {
    console.error('User creation error:', error.message);
    
    return {
      success: false,
      user: null,
      error: 'Server error during user creation',
      token: null
    };
  }
}

/**
 * Verifies an authentication token and returns the associated user
 * @param {string} token - The authentication token to verify
 * @returns {Promise<AuthResult>} The verification result
 */
export async function verifyToken(token) {
  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error) {
      return {
        success: false,
        user: null,
        error: error.message,
        token: null
      };
    }
    
    return {
      success: true,
      user: data.user,
      error: null,
      token
    };
  } catch (error) {
    console.error('Token verification error:', error.message);
    
    return {
      success: false,
      user: null,
      error: 'Server error during token verification',
      token: null
    };
  }
}

/**
 * Gets a user by their ID
 * @param {string} userId - The user's ID
 * @returns {Promise<object|null>} The user object or null
 */
export async function getUserById(userId) {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Get user error:', error.message);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Get user error:', error.message);
    return null;
  }
}

/**
 * Updates a user's metadata
 * @param {string} userId - The user's ID
 * @param {object} metadata - The metadata to update
 * @returns {Promise<boolean>} Whether the update was successful
 */
export async function updateUserMetadata(userId, metadata) {
  try {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { user_metadata: metadata }
    );
    
    if (error) {
      console.error('Update user metadata error:', error.message);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Update user metadata error:', error.message);
    return false;
  }
}