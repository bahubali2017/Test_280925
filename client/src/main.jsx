import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
// eslint-disable-next-line no-unused-vars
import { AuthAvailabilityProvider } from './contexts/AuthAvailabilityContext.jsx';
// eslint-disable-next-line no-unused-vars
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary.jsx';

/**
 * Main entry point for the application
 * Renders the App component into the DOM with error boundary and auth availability context
 */
ReactDOM.createRoot(document.getElementById('root')).render(
  <AuthAvailabilityProvider>
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  </AuthAvailabilityProvider>
);