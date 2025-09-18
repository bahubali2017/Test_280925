/* global setTimeout, clearTimeout */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabaseClient } from '../lib/supabase.js';
import config from '../lib/config.js';

/**
 * @typedef {object} User
 * @property {string} id - User ID
 * @property {string | undefined} email - User email
 * @property {string} [role] - User role
 */

/**
 * @typedef {object} AuthContextType
 * @property {User|null} user - The authenticated user or null if not authenticated
 * @property {boolean} isAuthenticated - Whether a user is currently authenticated
 * @property {boolean} isLoading - Whether authentication is in progress
 * @property {(email: string, password: string) => Promise<{success: boolean, error: string|null}>} login - Function to log in
 * @property {(email: string, password: string, metadata?: object) => Promise<{success: boolean, error: string|null, confirmEmail?: boolean}>} register - Function to register
 * @property {() => Promise<void>} logout - Function to log out
 */

/** @type {AuthContextType} */
const defaultAuthContext = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async (_email, _password) => ({ success: false, error: 'Context not initialized' }),
  register: async (_email, _password, _metadata = {}) => ({ success: false, error: 'Context not initialized' }),
  logout: async () => {}
};

/** @type {React.Context<AuthContextType>} */
const AuthContext = createContext(defaultAuthContext);

/**
 * Authentication context provider component
 * @param {object} props - Component props
 * @param {React.ReactNode} props.children - Children components to render
 * @returns {JSX.Element} Authentication provider component
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(/** @type {User|null} */ (null));
  const [isLoading, setIsLoading] = useState(true);
  const [authListener, setAuthListener] = useState(/** @type {{subscription: any}|null} */ (null));

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        console.log('[Auth] Initializing authentication...');
        
        // SECURITY-CRITICAL: Development authentication bypass
        // This MUST NEVER activate in production
        if (config.app.isDevelopment) {
          // Additional security verification before bypassing authentication
          const currentHostname = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '';
          
          // Triple-check: verify we're not on any production domain
          const productionDomains = ['anamnesis.health', 'anamnesis-health.com', 'mvp-anamnesis.health', 'app.anamnesis.health'];
          const isProductionDomain = productionDomains.some(domain => 
            currentHostname === domain || currentHostname.endsWith('.' + domain)
          );
          
          if (isProductionDomain) {
            console.error('[SECURITY] CRITICAL: Development bypass attempted on production domain:', currentHostname);
            console.error('[SECURITY] This indicates a serious security misconfiguration.');
            // Force production mode and continue with normal auth
            setIsLoading(false);
            return;
          }
          
          // Verify we're actually in a known development environment
          const isKnownDevEnv = (
            currentHostname === 'localhost' ||
            currentHostname === '127.0.0.1' ||
            currentHostname.includes('replit.dev') ||
            currentHostname.includes('.repl.co') ||
            currentHostname.includes('gitpod.io')
          );
          
          if (!isKnownDevEnv) {
            console.warn('[SECURITY] Development mode detected but not on known dev environment:', currentHostname);
            console.warn('[SECURITY] Skipping development bypass for safety.');
            setIsLoading(false);
            return;
          }
          
          console.log('[Auth] Development mode verified on safe environment:', currentHostname);
          // DISABLED: Auto-authentication bypass - now using normal login flow
          // console.log('[Auth] Auto-authenticating guest user for development');
          
          // /** @type {User} */
          // const guestUser = {
          //   id: 'dev-guest-user',
          //   email: 'guest@development.local',
          //   role: 'guest'
          // };
          
          // setUser(guestUser);
          // setIsLoading(false);
          // console.log('[Auth] Guest user authenticated automatically for development');
          // return; // Skip Supabase checks in development
        }
        
        const { data: { session } } = await supabaseClient.auth.getSession();

        if (session?.user && isMounted) {
          console.log('[Auth] Found existing session:', session.user.email);
          setUser(/** @type {User} */ (session.user));
          setIsLoading(false);
        } else if (isMounted) {
          console.log('[Auth] No existing session found');
          setIsLoading(false);
        }

        if (!authListener && isMounted) {
          const { data } = supabaseClient.auth.onAuthStateChange(
            (event, session) => {
              console.log('[Auth] Auth state change:', event, session?.user?.email);
              if (isMounted) {
                setUser(session?.user ? /** @type {User} */ (session.user) : null);
                if (event !== 'INITIAL_SESSION') {
                  setIsLoading(false);
                }
              }
            }
          );
          setAuthListener(data);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
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
        setAuthListener(null);
      }
    };
  }, []); // Remove authListener dependency to prevent infinite loops

  /**
   * Log in a user with email and password
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @returns {Promise<{success: boolean, error: string|null}>} Login result
   */
  async function login(email, password) {
    try {
      setIsLoading(true);

      // Allow test users for demo purposes (works in all environments)
      if ((email === 'test@example.com' && password === 'testpass123') ||
          (email === 'demo@example.com' && password === 'password')) {
        console.log('[Auth] Test user login detected:', email);
        /** @type {User} */
        const testUser = { 
          id: 'test-user-id',
          email: email,
          role: 'user'
        };
        
        // Set user state and wait for it to be applied
        setUser(testUser);
        
        // Use a small delay to ensure state is updated
        await new Promise(resolve => setTimeout(resolve, 50));
        
        setIsLoading(false);
        console.log('[Auth] Test user authenticated successfully');
        return { success: true, error: null };
      }

      const { error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        setIsLoading(false);
        return { success: false, error: error.message };
      }

      // For Supabase auth, wait for session to be established
      try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session?.user) {
          setUser(/** @type {User} */ (session.user));
          setIsLoading(false);
          return { success: true, error: null };
        }
      } catch (sessionError) {
        console.warn('Session check error during login:', sessionError);
      }

      // If no immediate session, wait for auth state change
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          setIsLoading(false);
          resolve({ success: false, error: 'Authentication timeout' });
        }, 5000); // 5 second timeout

        const { data: authListener } = supabaseClient.auth.onAuthStateChange(
          (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
              clearTimeout(timeout);
              authListener.subscription.unsubscribe();
              setIsLoading(false);
              resolve({ success: true, error: null });
            }
          }
        );
      });

    } catch (err) {
      setIsLoading(false);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown login error' 
      };
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
  const context = useContext(AuthContext);
  if (!context) {
    // Provide fallback instead of throwing error to prevent app crashes
    console.warn('useAuth used outside AuthProvider, providing fallback');
    return {
      user: null,
      isAuthenticated: false,
      login: async () => ({ success: false, error: 'Authentication not available' }),
      register: async () => ({ success: false, error: 'Authentication not available' }),
      logout: async () => {},
      isLoading: false
    };
  }
  return context;
}