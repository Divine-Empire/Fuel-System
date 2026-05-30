import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Global fetch interceptor to prevent CORS/Account Chooser issues with Google Apps Script
const originalFetch = window.fetch;
window.fetch = function (input, init) {
  let isGoogleScript = false;
  if (typeof input === 'string') {
    isGoogleScript = input.includes('script.google.com');
  } else if (input instanceof URL) {
    isGoogleScript = input.href.includes('script.google.com');
  } else if (input && typeof input === 'object' && 'url' in input) {
    isGoogleScript = input.url.includes('script.google.com');
  }

  if (isGoogleScript) {
    init = init || {};
    init.credentials = 'omit';
  }
  return originalFetch.call(this, input, init);
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);