import { createContext, useContext, useState, useEffect } from 'react';
import { 
  supabaseClient, 
  signIn, 
  signUp, 
  signOut as supabaseSignOut, 
  getSession 
} from '../lib/supabase.js';

/**
 * User object structure matching actual implementation
 * @typedef {{
 *   id: string;
 *   email: string;
 *   name?: string;
 * }} User
 */

/**
 * Supabase session structure used internally
 * @typedef {{
 *   user: {
 *     id: string;
 *     email: string;
 *     user_metadata?: Record<string, unknown>;
 *   };
 *   access_token: string;
 *   refresh_token?: string;
 *   expires_at?: number;
 * }} SupabaseSession
 */

/**
 * Supabase authentication response structure
 * @typedef {{
 *   data: {
 *     user: {
 *       id: string;
 *       email: string;
 *       user_metadata?: Record<string, unknown>;
 *     } | null;
 *     session: SupabaseSession | null;
 *   };
 *   error: { message: string } | null;
 * }} SupabaseAuthResponse
 */

/**
 * Authentication context value type matching actual implementation
 * @typedef {{
 *   user: User | null;
 *   isAuthenticated: boolean;
 *   isLoading: boolean;
 *   login: (email: string, password: string) => Promise<boolean>;
 *   register: (email: string, password: string, name: string) => Promise<boolean>;
 *   logout: () => Promise<void>;
 *   error: string | null;
 *   clearError: () => void;
 * }} AuthContextType
 */

/**
 * Type guard to check if error is an Error instance
 * @param {unknown} error - The error to check
 * @returns {error is Error}
 */
function isError(error) {
  return error instanceof Error;
}

/**
 * Handle authentication errors with proper logging and typing
 * @param {unknown} error - The error to handle
 * @param {(error: string) => void} setError - Error setter function
 * @returns {void}
 */
function handleAuthError(error, setError) {
  let errorMessage = 'An unknown error occurred';
  
  if (isError(error)) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    errorMessage = error.message;
  }
  
  console.error('Authentication error:', errorMessage);
  setError(errorMessage);
}

/**
 * Extract user data from Supabase user object
 * @param {{
 *   id: string;
 *   email: string;
 *   user_metadata?: Record<string, unknown>;
 * }} supabaseUser - Supabase user object
 * @returns {User} Formatted user object
 */
function extractUserData(supabaseUser) {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email,
    name: (supabaseUser.user_metadata && typeof supabaseUser.user_metadata.name === 'string') ? supabaseUser.user_metadata.name : ''
  };
}

/**
 * Authentication context with properly typed default values
 * @type {import('react').Context<AuthContextType>}
 */
const AuthContext = createContext(/** @type {AuthContextType} */({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => false,
  register: async () => false,
  logout: async () => {},
  error: null,
  clearError: () => {},
}));

/**
 * Provider component for Supabase authentication context 
 * @param {object} props - The props
 * @param {import('react').ReactNode} props.children - Child components
 * @returns {JSX.Element} The SupabaseAuthProvider component
 */
export const SupabaseAuthProvider = ({ children }) => {
  /** @type {[User|null, import('react').Dispatch<import('react').SetStateAction<User|null>>]} */
  const [user, setUser] = useState(/** @type {User|null} */(null));
  /** @type {[boolean, import('react').Dispatch<import('react').SetStateAction<boolean>>]} */
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  /** @type {[boolean, import('react').Dispatch<import('react').SetStateAction<boolean>>]} */
  const [isLoading, setIsLoading] = useState(true);
  /** @type {[string|null, import('react').Dispatch<import('react').SetStateAction<string|null>>]} */
  const [error, setError] = useState(/** @type {string|null} */(null));

  /**
   * Clear the current error
   * @returns {void}
   */
  const clearError = () => setError(null);

  /**
   * Check if there's a stored auth session on component mount
   * Sets up auth state change listener and returns cleanup function
   * @returns {Function|undefined} Cleanup function when component unmounts
   */
  useEffect(() => {
    /**
     * Check for existing session on mount
     * @returns {Promise<void>}
     */
    const checkSession = async () => {
      try {
        const response = /** @type {SupabaseAuthResponse} */ (await getSession());
        
        if (response.error) {
          console.error('Session retrieval error:', response.error.message);
          return;
        }
        
        if (response.data.session && response.data.session.user) {
          const userData = extractUserData(response.data.session.user);
          setUser(userData);
          setIsAuthenticated(true);
        }
      } catch (err) {
        handleAuthError(err, setError);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSession();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      /**
       * @param {import('@supabase/supabase-js').AuthChangeEvent} event - Auth event type
       * @param {import('@supabase/supabase-js').Session|null} session - Session data
       */
      (event, session) => {
        if (event === 'SIGNED_IN' && session && session.user) {
          const userData = extractUserData({
            id: session.user.id,
            email: session.user.email || '',
            user_metadata: session.user.user_metadata
          });
          setUser(userData);
          setIsAuthenticated(true);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsAuthenticated(false);
        }
        setIsLoading(false);
      }
    );
    
    // Clean up subscription on unmount
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  /**
   * Login function using Supabase
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<boolean>} Success status
   */
  const login = async (email, password) => {
    try {
      setIsLoading(true);
      clearError();
      
      const response = /** @type {SupabaseAuthResponse} */ (await signIn(email, password));
      
      if (response.error) {
        setError(response.error.message);
        return false;
      }
      
      if (response.data.user) {
        const userData = extractUserData(response.data.user);
        setUser(userData);
        setIsAuthenticated(true);
        return true;
      }
      
      return false;
    } catch (err) {
      handleAuthError(err, setError);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Register function using Supabase
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} name - User name
   * @returns {Promise<boolean>} Success status
   */
  const register = async (email, password, name) => {
    try {
      setIsLoading(true);
      clearError();
      
      const response = /** @type {SupabaseAuthResponse} */ (await signUp(email, password, { name }));
      
      if (response.error) {
        setError(response.error.message);
        return false;
      }
      
      if (response.data.user) {
        // For email confirmation flow, we don't immediately log in
        setError('Please check your email to confirm your account.');
        return true;
      }
      
      return false;
    } catch (err) {
      handleAuthError(err, setError);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Logout function using Supabase
   * @returns {Promise<void>}
   */
  const logout = async () => {
    try {
      setIsLoading(true);
      const response = /** @type {{ error: { message: string } | null }} */ (await supabaseSignOut());
      
      if (response.error) {
        setError(response.error.message);
        return;
      }
      
      setUser(null);
      setIsAuthenticated(false);
    } catch (err) {
      handleAuthError(err, setError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isAuthenticated, 
        isLoading,
        login, 
        register,
        logout,
        error,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to use the Supabase authentication context
 * @returns {AuthContextType} The auth context value
 */
function useSupabaseAuth() {
  return useContext(AuthContext);
}

/**
 * Export the hook for the Supabase authentication context
 * @module useSupabaseAuth
 */
export { useSupabaseAuth };