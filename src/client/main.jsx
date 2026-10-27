import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    const swUrl = import.meta.env.BASE_URL + 'sw.js';
    navigator.serviceWorker.register(swUrl).catch((err) => {
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
