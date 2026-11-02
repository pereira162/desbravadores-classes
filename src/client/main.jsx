import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

// Limpeza garantida de caches e Service Workers legados
if (typeof window !== 'undefined') {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const reg of registrations) {
        reg.unregister().catch(() => {});
      }
    });
  }
  if ('caches' in window) {
    caches.keys().then((keys) => {
      keys.forEach((key) => {
        caches.delete(key).catch(() => {});
      });
    });
  }
}

const rootEl = document.getElementById('root');
createRoot(rootEl).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
