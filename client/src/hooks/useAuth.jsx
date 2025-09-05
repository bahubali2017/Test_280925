import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabaseClient } from '../lib/supabase.js';

/**
 * @typedef {object} AuthContextType
 * @property {object|null} user - The authenticated user or null if not authenticated
 * @property {boolean} isAuthenticated - Whether a user is currently authenticated
 * @property {boolean} isLoading - Whether authentication is in progress
 * @property {(email: string, password: string) => Promise<{success: boolean, error: string|null}>} login - Function to log in
 * @property {(email: string, password: string, metadata?: object) => Promise<{success: boolean, error: string|null, confirmEmail?: boolean}>} register - Function to register
 * @property {() => Promise<void>} logout - Function to log out
 */

/** @type {React.Context<AuthContextType>} */
const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async (_email, _password) => ({ success: false, error: 'Context not initialized' }),
  register: async (_email, _password, _metadata = {}) => ({ success: false, error: 'Context not initialized' }),
  logout: async () => {}
});

/**
 * Authentication context provider component
 * @param {object} props - Component props
 * @param {React.ReactNode} props.children - Children components to render
 * @returns {JSX.Element} Authentication provider component
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authListener, setAuthListener] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabaseClient.auth.getSession();

        if (session?.user && isMounted) {
          setUser(session.user);
        }

        if (!authListener && isMounted) {
          const { data } = supabaseClient.auth.onAuthStateChange(
            (_event, session) => {
              if (isMounted) {
                setUser(session?.user ?? null);
                setIsLoading(false);
              }
            }
          );
          setAuthListener(data);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      isMounted = false;
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [authListener]);

  /**
   * Log in a user with email and password
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @returns {Promise<{success: boolean, error: string|null}>} Login result
   */
  async function login(email, password) {
    try {
      setIsLoading(true);
      // Allow test users in development
      if (process.env.NODE_ENV === 'development' && 
          ((email === 'test@example.com' && password === 'testpass123') ||
           (email === 'demo@example.com' && password === 'password'))) {
        setUser({ 
          id: 'test-user-id',
          email: email,
          role: 'user'
        });
        return { success: true, error: null };
      }
      const { error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown login error' 
      };
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Register a new user with email and password
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @param {object} [metadata={}] - Optional user metadata
   * @returns {Promise<{success: boolean, error: string|null, confirmEmail?: boolean}>} Registration result
   */
  async function register(email, password, metadata = {}) {
    try {
      setIsLoading(true);
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: { data: metadata }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data?.user?.identities?.length === 0) {
        return { success: true, error: null, confirmEmail: true };
      }

      return { success: true, error: null };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown registration error' 
      };
    } finally {
      setIsLoading(false);
    }
  }

  async function logout() {
    try {
      setIsLoading(true);
      await supabaseClient.auth.signOut();
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook to access authentication context
 * @returns {AuthContextType} Authentication context with user data and auth methods
 */
export function useAuth() {
  return useContext(AuthContext);
}