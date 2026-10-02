import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// 100% Offline self-hosted typography (zero Google Fonts CDN dependency)
import '@fontsource/chivo/400.css'
import '@fontsource/chivo/600.css'
import '@fontsource/chivo/700.css'
import '@fontsource/chivo/800.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/600.css'
import '@fontsource/jetbrains-mono/700.css'

// 100% Offline Leaflet stylesheet (zero unpkg CDN dependency)
import 'leaflet/dist/leaflet.css'

import App from './App.jsx'

// Register service worker for PWA offline caching & Web Push notifications
// Note: In development (Vite), registering a service worker intercepts dynamic HMR/ESM modules,
// causing broken React dispatchers and false offline failures.
// True offline PWA execution runs on production builds (npm run preview or deployed PWA).
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    if (import.meta.env.PROD) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[PWA] Production Service Worker registered with scope:', reg.scope);
        })
        .catch((err) => {
          console.warn('[PWA] Service Worker registration failed:', err);
        });
    } else {
      // In dev mode, unregister any active service worker so Vite HMR stays pristine
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
      });
    }
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
