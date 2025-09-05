import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../hooks/useAuth';
import { getSafeTimeoutFunctions } from '../lib/llm-api';

// Get safe timeout functions
const { setTimeout: safeSetTimeout, clearTimeout: safeClearTimeout } = getSafeTimeoutFunctions();

/**
 * Loading spinner component shown during authentication checks
 * @returns {JSX.Element} The loading spinner component
 */
export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
}

/**
 * Protected route component that redirects unauthenticated users to login
 * @param {object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render when authenticated
 * @returns {JSX.Element|null} The protected content or loading spinner
 */
export function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    let redirectTimeout;
    if (!isLoading && !isAuthenticated) {
      setIsRedirecting(true);
      redirectTimeout = safeSetTimeout(() => {
        setLocation('/login');
      }, 100);
    }
    return () => {
      if (redirectTimeout) safeClearTimeout(redirectTimeout);
    };
  }, [isAuthenticated, isLoading, setLocation]);

  if (isLoading || isRedirecting) {
    return <LoadingSpinner />;
  }

  return isAuthenticated ? <>{children}</> : null;
}