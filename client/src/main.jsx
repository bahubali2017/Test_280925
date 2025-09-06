// Debug: Test if JavaScript is executing
console.log('🚀 Main.jsx loading...');
console.log('Document ready state:', document.readyState);

// Test 1: Basic DOM manipulation without React
const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('❌ Root element not found!');
  document.body.innerHTML = '<h1 style="color: red;">ERROR: Root element not found!</h1>';
} else {
  console.log('✅ Root element found:', rootElement);
  
  // Test 2: Direct DOM manipulation first
  rootElement.innerHTML = `
    <div style="padding: 20px; font-family: sans-serif; background: #f0f0f0; margin: 20px;">
      <h1 style="color: #06b6d4;">🧠 Anamnesis Test</h1>
      <p style="color: #333;">✅ JavaScript is working!</p>
      <p style="color: #333;">✅ DOM manipulation is working!</p>
      <p style="color: #666;">Timestamp: ${new Date().toISOString()}</p>
    </div>
  `;
  
  console.log('✅ Direct DOM content inserted');
}

// Test 3: Try React after a delay
setTimeout(() => {
  console.log('🔄 Attempting React load...');
  
  try {
    import('react-dom/client').then(({ default: ReactDOM }) => {
      import('react').then(({ default: React }) => {
        const element = React.createElement('div', 
          { style: { padding: '20px', fontFamily: 'sans-serif', background: '#e0f7fa' } },
          React.createElement('h2', { style: { color: '#00796b' } }, '🚀 React Loaded Successfully!'),
          React.createElement('p', null, 'React is now working!')
        );
        
        ReactDOM.createRoot(rootElement).render(element);
        console.log('✅ React render successful!');
      });
    });
  } catch (error) {
    console.error('❌ React loading failed:', error);
    rootElement.innerHTML += `<p style="color: red;">React Error: ${error.message}</p>`;
  }
}, 1000);