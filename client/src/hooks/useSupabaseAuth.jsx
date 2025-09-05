import { createContext, useContext, useState, useEffect } from 'react';
import { 
  supabaseClient, 
  signIn, 
  signUp, 
  signOut as supabaseSignOut, 
  getSession 
} from '../lib/supabase.js';

/**
 * User object structure
 * @typedef {object} User
 * @property {string} id - User's unique ID
 * @property {string} email - User's email
 * @property {string} [name] - User's name
 */

/**
 * Authentication context value type
 * @typedef {object} AuthContextType
 * @property {User|null} user - The current user
 * @property {boolean} isAuthenticated - Whether user is authenticated
 * @property {boolean} isLoading - Whether authentication is being loaded
 * @property {(email: string, password: string) => Promise<boolean>} login - Login function
 * @property {(email: string, password: string, name: string) => Promise<boolean>} register - Registration function
 * @property {() => Promise<void>} logout - Logout function
 * @property {string|null} error - Current authentication error
 * @property {() => void} clearError - Clear the current error
 */

/**
 * Authentication context with default values
 * @type {React.Context<AuthContextType>}
 */
const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => false,
  register: async () => false,
  logout: async () => {},
  error: null,
  clearError: () => {},
});

/**
 * Provider component for Supabase authentication context 
 * @param {object} props - The props
 * @param {import('react').ReactNode} props.children - Child components
 * @returns {JSX.Element} The SupabaseAuthProvider component
 */
export const SupabaseAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Clear the current error
   * @returns {void} No return value
   */
  const clearError = () => setError(null);

  /**
   * Check if there's a stored auth session on component mount
   * @returns {Function|undefined} Cleanup function when component unmounts
   */
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data, error } = await getSession();
        
        if (error) {
          console.error('Session retrieval error:', error.message);
          return;
        }
        
        if (data.session) {
          const { user } = data.session;
          setUser({
            id: user.id,
            email: user.email,
            name: user.user_metadata?.name || ''
          });
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error('Error checking session:', err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSession();
    
    // Set up auth state change listener
    // @returns {Object} Auth subscription object with unsubscribe method
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          setUser({
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.name || ''
          });
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
      
      const { data, error } = await signIn(email, password);
      
      if (error) {
        setError(error.message);
        return false;
      }
      
      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name || ''
        });
        setIsAuthenticated(true);
        return true;
      }
      
      return false;
    } catch (err) {
      setError(err.message);
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
      
      const { data, error } = await signUp(email, password, { name });
      
      if (error) {
        setError(error.message);
        return false;
      }
      
      if (data.user) {
        // For email confirmation flow, we don't immediately log in
        setError('Please check your email to confirm your account.');
        return true;
      }
      
      return false;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Logout function using Supabase
   * @returns {Promise<void>} No specific return value
   */
  const logout = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabaseSignOut();
      
      if (error) {
        setError(error.message);
        return;
      }
      
      setUser(null);
      setIsAuthenticated(false);
    } catch (err) {
      setError(err.message);
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