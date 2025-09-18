// client/src/components/GlobalErrorBoundary.jsx
import React, { Component } from 'react';

/**
 *
 */
export class GlobalErrorBoundary extends Component {
  /**
   *
   * @param props
   */
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  /**
   * React lifecycle: update state after an error.
   * @returns {{ hasError: boolean }}
   */
  static getDerivedStateFromError() {
    return { hasError: true };
  }

  /**
   *
   * @param err
   * @param info
   * @param error
   * @param errorInfo
   */
  componentDidCatch(error, errorInfo) {
    console.error('UI error boundary caught:', error, errorInfo);

    // Check if error is related to authentication
    if (error.message?.includes('useAuth') || error.message?.includes('AuthProvider')) {
      console.warn('Authentication-related error detected, will attempt recovery');
    }
  }

  /**
   * Render fallback UI when an error has occurred, else children.
   * @returns {JSX.Element}
   */
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center p-6 max-w-md mx-auto">
            <div className="mb-4">
              <svg
                className="w-16 h-16 mx-auto text-destructive"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-destructive mb-2">
              Something went wrong
            </h1>
            <p className="text-muted-foreground mb-4">
              The application encountered an error. This might be a temporary issue.
            </p>
            <div className="space-y-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4"
              >
                Reload Page
              </button>
              <button
                onClick={() => {
                  localStorage.clear();
                  sessionStorage.clear();
                  window.location.href = '/login';
                }}
                className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 py-2 px-4"
              >
                Clear Data & Login
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}