import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register service worker for offline caching and PWA installation
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => console.log('Karobar Khata Service Worker Registered:', reg.scope))
      .catch((err) => console.warn('SW registration notice:', err));
  });
}

createRoot(document.getElementById('root')!).render(<App />);
