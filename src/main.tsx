import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import App from './App.tsx';
import './index.css';
import './lib/firebase';

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
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </HelmetProvider>
  </StrictMode>,
);
