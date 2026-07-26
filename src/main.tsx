import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { PrivacyAnalytics } from './components/PrivacyAnalytics.tsx';
import App from './App.tsx';
import './index.css';
import { bootstrapAccessibilityPreferences } from './lib/accessibilityPreferences.ts';

bootstrapAccessibilityPreferences();

const preloadRecoveryKey = 'wersee:vite-preload-recovery';
const preloadRecoveryWindowMs = 30_000;

const recoverFromStaleBundle = () => {
  try {
    const previousAttempt = Number(window.sessionStorage.getItem(preloadRecoveryKey) || 0);
    if (Date.now() - previousAttempt < preloadRecoveryWindowMs) return false;
    window.sessionStorage.setItem(preloadRecoveryKey, String(Date.now()));
    window.location.reload();
    return true;
  } catch {
    // Avoid a reload loop when a mobile/private browser blocks session storage.
    return false;
  }
};

window.addEventListener('vite:preloadError', (event) => {
  if (recoverFromStaleBundle()) event.preventDefault();
});

// A page that remains healthy for this long may recover again after a later deploy.
window.setTimeout(() => {
  try {
    window.sessionStorage.removeItem(preloadRecoveryKey);
  } catch {
    // Session storage is optional for recovery.
  }
}, preloadRecoveryWindowMs);

// Suppress Vite WebSocket errors in development
if (import.meta.env.DEV) {
  const originalError = console.error;
  const originalWarn = console.warn;
  
  console.error = (...args) => {
    const msg = args[0]?.toString() || '';
    if (msg.includes('failed to connect to websocket') || msg.includes('WebSocket closed without opened')) {
      return;
    }
    originalError.apply(console, args);
  };

  console.warn = (...args) => {
    const msg = args[0]?.toString() || '';
    if (msg.includes('failed to connect to websocket') || msg.includes('WebSocket closed without opened')) {
      return;
    }
    originalWarn.apply(console, args);
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <App />
      <PrivacyAnalytics />
    </HelmetProvider>
  </StrictMode>,
);
