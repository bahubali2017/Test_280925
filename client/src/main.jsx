import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { AuthAvailabilityProvider } from './contexts/AuthAvailabilityContext.jsx';
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary.jsx';

/**
 * Main entry point for the application
 * Renders the App component into the DOM with error boundary and auth availability context
 */
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(rootElement).render(
  <AuthAvailabilityProvider>
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  </AuthAvailabilityProvider>
);