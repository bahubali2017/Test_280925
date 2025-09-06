import React from 'react';
import ReactDOM from 'react-dom/client';

/**
 * Main entry point for the application - step by step debugging
 */
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

console.log('🧪 Testing React step by step...');

// Step 1: Test basic React rendering
try {
  ReactDOM.createRoot(rootElement).render(
    <div style={{padding: '20px', fontFamily: 'sans-serif'}}>
      <h1 style={{color: '#06b6d4'}}>🧠 Anamnesis Medical AI</h1>
      <p>✅ Basic React is working!</p>
      <p>Loading components...</p>
    </div>
  );
  console.log('✅ Step 1: Basic React render successful');
  
  // Step 2: Try loading CSS
  setTimeout(async () => {
    try {
      await import('./index.css');
      console.log('✅ Step 2: CSS loaded successfully');
      
      // Step 3: Try loading AuthAvailabilityProvider
      const { AuthAvailabilityProvider } = await import('./contexts/AuthAvailabilityContext.jsx');
      console.log('✅ Step 3: AuthAvailabilityProvider loaded');
      
      // Step 4: Try loading GlobalErrorBoundary  
      const { GlobalErrorBoundary } = await import('./components/GlobalErrorBoundary.jsx');
      console.log('✅ Step 4: GlobalErrorBoundary loaded');
      
      // Step 5: Try loading App
      const App = (await import('./App')).default;
      console.log('✅ Step 5: App component loaded');
      
      // Step 6: Render full app
      ReactDOM.createRoot(rootElement).render(
        <AuthAvailabilityProvider>
          <GlobalErrorBoundary>
            <App />
          </GlobalErrorBoundary>
        </AuthAvailabilityProvider>
      );
      console.log('✅ Step 6: Full app rendered successfully!');
      
    } catch (error) {
      console.error('❌ Error in step-by-step loading:', error);
      rootElement.innerHTML += `<p style="color: red; background: #ffe6e6; padding: 10px; margin: 10px 0;">Error: ${error.message}</p>`;
    }
  }, 1000);
  
} catch (error) {
  console.error('❌ Step 1 failed:', error);
  rootElement.innerHTML = `<h1 style="color: red;">React Error: ${error.message}</h1>`;
}