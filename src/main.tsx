import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app';
import { LanguageProvider } from './i18n/LanguageContext';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </React.StrictMode>,
);
