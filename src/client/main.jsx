import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

if ('serviceWorker' in navigator) {
  // Limpa caches antigos do navegador automaticamente
  if ('caches' in window) {
    caches.keys().then((keys) => {
      keys.forEach((key) => {
        if (key !== 'sgc-classes-cache-v3') {
          caches.delete(key);
        }
      });
    });
  }

  window.addEventListener('load', () => {
    const swUrl = (import.meta.env.BASE_URL || '/desbravadores-classes/') + 'sw.js';
    navigator.serviceWorker
      .register(swUrl)
      .then((reg) => {
        reg.update().catch(() => {});
      })
      .catch((err) => {
        console.warn('Falha ao registrar Service Worker:', err);
      });
  });
}

const rootEl = document.getElementById('root');
createRoot(rootEl).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
