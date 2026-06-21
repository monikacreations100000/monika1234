import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ShopContextProvider } from './context/ShopContext';
import App from './App';
import './index.css';

// Intercept global fetch to detect HTML responses where JSON is expected
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  try {
    const response = await originalFetch(...args);
    const url = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url) || '';
    
    if (url.includes('/api/') || url.includes('/api')) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        const cloned = response.clone();
        const text = await cloned.text();
        console.error(`[FETCH ERROR] Received HTML response instead of JSON from URL: ${url}. Response snippet:`, text.substring(0, 500));
        
        const errorBody = JSON.stringify({
          message: 'API server returned HTML page instead of JSON. The backend server might be offline or misconfigured.',
          isHtmlError: true,
          htmlSnippet: text.substring(0, 200)
        });
        return new Response(errorBody, {
          status: 500,
          statusText: 'Internal Server Error',
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    return response;
  } catch (error) {
    console.error('[FETCH NETWORK ERROR]', error);
    const errorBody = JSON.stringify({
      message: `Network error: ${error.message || 'API server unreachable.'}`,
      isNetworkError: true
    });
    return new Response(errorBody, {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ShopContextProvider>
        <App />
      </ShopContextProvider>
    </BrowserRouter>
  </React.StrictMode>
);
