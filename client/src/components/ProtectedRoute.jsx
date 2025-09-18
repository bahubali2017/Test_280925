import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../hooks/useAuth';
// Use native timeout functions directly
const safeSetTimeout = window.setTimeout;
const safeClearTimeout = window.clearTimeout;

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
  const { isAuthenticated, isLoading, user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    console.log('[ProtectedRoute] Auth state changed:', { 
      isAuthenticated, 
      isLoading, 
      user: user?.email,
      timestamp: new Date().toISOString()
    });
    
    // Only redirect if we're not loading and definitely not authenticated
    if (!isLoading && !isAuthenticated) {
      console.log('[ProtectedRoute] Redirecting to login - not authenticated');
      setLocation('/login');
    }
  }, [isAuthenticated, isLoading, setLocation, user]);

  // Show loading spinner while determining auth state
  if (isLoading) {
    console.log('[ProtectedRoute] Still loading auth state');
    return <LoadingSpinner />;
  }

  // If not authenticated, don't render anything (redirect will happen in useEffect)
  if (!isAuthenticated) {
    console.log('[ProtectedRoute] Not authenticated, returning null');
    return null;
  }

  // Authenticated - render the protected content
  console.log('[ProtectedRoute] Rendering protected content for user:', user?.email);
  return <>{children}</>;
}