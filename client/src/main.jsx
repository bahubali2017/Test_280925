import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { AuthAvailabilityProvider } from './contexts/AuthAvailabilityContext.jsx';
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary.jsx';
import { initializeVersionChecking } from './lib/versionChecker.js';

/**
 * Main entry point for the application
 * Renders the App component into the DOM with error boundary and auth availability context
 * Also initializes the version checking system for automatic cache invalidation
 */
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

// Initialize version checking system before rendering the app
// This ensures we catch version mismatches as early as possible
console.log('[App] Initializing version checking system...');
initializeVersionChecking();

ReactDOM.createRoot(rootElement).render(
  <AuthAvailabilityProvider>
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  </AuthAvailabilityProvider>
);