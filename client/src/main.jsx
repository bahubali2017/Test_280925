import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initializeVersionChecking } from './lib/versionChecker.js';

/**
 * Main entry point for the application
 * Renders the App component into the DOM with error boundary and auth availability context
 * Version checking system DISABLED to prevent infinite reload loops
 */
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

// Initialize version checking system before rendering the app
initializeVersionChecking();

ReactDOM.createRoot(rootElement).render(
  <App />
);