import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app';
import { LanguageProvider } from './i18n/LanguageContext';
import './styles/global.css';
import './styles/offline.css';
import OfflineBanner from './components/OfflineBanner';
import { registerServiceWorker } from './utils/offline';

registerServiceWorker();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <LanguageProvider>
      <App />
      <OfflineBanner />
    </LanguageProvider>
  </React.StrictMode>,
);
