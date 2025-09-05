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
   */
  componentDidCatch(err, info) { 
    console.error('UI error boundary caught:', err, info); 
  }
  
  /**
   * Render fallback UI when an error has occurred, else children.
   * @returns {JSX.Element}
   */
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="p-6 text-center">
            <h1 className="text-red-600 font-semibold text-lg mb-2">Something went wrong.</h1>
            <p className="text-gray-600 mb-4">The application encountered an error.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}