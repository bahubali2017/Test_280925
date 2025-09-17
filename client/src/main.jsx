import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { AuthAvailabilityProvider } from './contexts/AuthAvailabilityContext.jsx';
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary.jsx';
// DISABLED: Version checking system causing infinite reload loops
// import { initializeVersionChecking } from './lib/versionChecker.js';

/**
 * Main entry point for the application
 * Renders the App component into the DOM with error boundary and auth availability context
 * Version checking system DISABLED to prevent infinite reload loops
 */
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

// DISABLED: Version checking system causing infinite reload loops
// Initialize version checking system before rendering the app
// This ensures we catch version mismatches as early as possible
// console.log('[App] Initializing version checking system...');
// initializeVersionChecking();

ReactDOM.createRoot(rootElement).render(
  <AuthAvailabilityProvider>
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  </AuthAvailabilityProvider>
);