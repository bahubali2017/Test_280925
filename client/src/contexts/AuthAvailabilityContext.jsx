// client/src/contexts/AuthAvailabilityContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthAvailabilityContext = createContext({ supabaseUp: true });

/**
 * Provides Supabase availability to descendants.
 * @param {{ children: React.ReactNode }} props
 * @returns {JSX.Element}
 */
export function AuthAvailabilityProvider({ children }) {
  const [supabaseUp, setUp] = useState(true);

  useEffect(() => {
    let canceled = false;
    
    const checkHealth = async () => {
      try {
        const response = await fetch('/api/health');
        if (!response.ok) throw new Error('Health check failed');
        const data = await response.json();
        if (!canceled) {
          setUp(data?.supabase === 'up');
        }
      } catch (error) {
        console.warn('Health check failed:', error.message);
        if (!canceled) {
          setUp(false);
        }
      }
    };

    checkHealth();
    
    return () => { 
      canceled = true; 
    };
  }, []);

  return (
    <AuthAvailabilityContext.Provider value={{ supabaseUp }}>
      {children}
    </AuthAvailabilityContext.Provider>
  );
}

/**
 * Hook to read Supabase availability.
 * @returns {{ supabaseUp: boolean }}
 */
export const useAuthAvailability = () => useContext(AuthAvailabilityContext);