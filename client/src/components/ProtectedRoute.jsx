/* global setTimeout */
import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../hooks/useAuth';

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
    
    // Only redirect if we're certain user is not authenticated
    if (!isLoading && !isAuthenticated && !user) {
      console.log('[ProtectedRoute] Redirecting to login - not authenticated');
      // Use a small delay to ensure state has settled
      setTimeout(() => {
        setLocation('/login');
      }, 100);
    }
  }, [isAuthenticated, isLoading, setLocation, user]);

  // Show loading spinner while determining auth state
  if (isLoading) {
    console.log('[ProtectedRoute] Still loading auth state');
    return <LoadingSpinner />;
  }

  // If authenticated, render the protected content immediately
  if (isAuthenticated && user) {
    console.log('[ProtectedRoute] Rendering protected content for user:', user?.email);
    return <>{children}</>;
  }

  // If clearly not authenticated, show loading while redirecting
  if (!isAuthenticated && !user) {
    console.log('[ProtectedRoute] Not authenticated, showing loading before redirect');
    return <LoadingSpinner />;
  }

  // Fallback: show loading for any uncertain state
  console.log('[ProtectedRoute] Uncertain auth state, showing loading');
  return <LoadingSpinner />;
}