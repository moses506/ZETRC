import { ReactNode } from 'react';
import { languages, useLanguage } from '../i18n/LanguageContext';
import '../styles/global.css';

type RootLayoutProps = {
  children: ReactNode;
  onJoinPilot: () => void;
  onGoHome: () => void;
  onGoTraining: () => void;
  onRequestProposal: () => void;
  showChrome?: boolean;
  currentPage?: 'home' | 'training' | 'login' | 'register' | 'course-enrollment' | 'dashboard';
};

function RootLayout({
  children,
  onJoinPilot,
  onGoHome,
  onGoTraining,
  onRequestProposal,
  showChrome = true,
  currentPage = 'home',
}: RootLayoutProps) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="app-shell">
      {showChrome && (
        <header className="app-header">
          <div className="header-inner">
            <div className="brand" onClick={onGoHome} style={{ cursor: 'pointer' }}>
              <div className="brand-icon">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <rect width="22" height="22" rx="6" fill="#032b14" />
                  <path d="M11 3 L19 11 L11 19 L3 11 Z" stroke="#d9a51f" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
                  <circle cx="11" cy="11" r="2.5" fill="#d9a51f" />
                </svg>
              </div>
              <div className="brand-text">
                <span className="brand-mark">ZETRC</span>
                <span className="brand-sub">{t('brandSub')}</span>
              </div>
            </div>

            <nav className="main-nav">
              <button
                type="button"
                className={`nav-link-btn ${currentPage === 'home' ? 'nav-link-active' : ''}`}
                onClick={onGoHome}
              >
                {t('navHome')}
              </button>
              <a href="#services">{t('navServices')}</a>
              <button
                type="button"
                className={`nav-link-btn ${currentPage === 'training' ? 'nav-link-active' : ''}`}
                onClick={onGoTraining}
              >
                {t('navTraining')}
              </button>
              <a href="#academy">{t('navAcademy')}</a>
              <a href="#about">{t('navAbout')}</a>
              <a href="#contact">{t('navContact')}</a>
            </nav>

            <div className="header-ctas">
              <button className="btn-ghost" onClick={onJoinPilot}>{t('joinPilot')}</button>
              <button className="btn-teal" onClick={onRequestProposal}>{t('requestProposal')}</button>
            </div>
          </div>
        </header>
      )}

      <div className="language-switcher" aria-label={t('language')}>
        <label htmlFor="language-select">{t('language')}</label>
        <select
          id="language-select"
          value={language}
          onChange={(event) => setLanguage(event.target.value as typeof language)}
        >
          {languages.map((item) => (
            <option key={item.code} value={item.code}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      <main className="app-content">{children}</main>

      {showChrome && (
        <footer className="app-footer">
          <div className="footer-inner">
            <div className="footer-brand-col">
              <div className="brand" style={{marginBottom: '1rem'}}>
                <div className="brand-icon">
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <rect width="22" height="22" rx="6" fill="#032b14" />
                    <path d="M11 3 L19 11 L11 19 L3 11 Z" stroke="#d9a51f" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
                    <circle cx="11" cy="11" r="2.5" fill="#d9a51f" />
                  </svg>
                </div>
                <span className="brand-mark">ZETRC</span>
              </div>
              <p className="footer-tagline">{t('footerTagline')}</p>
            </div>

            <div className="footer-col">
              <h4>{t('footerExplore')}</h4>
              {[t('navHome'), t('navServices'), t('footerPilotTraining'), t('navAcademy'), t('navAbout')].map(l => <a key={l} href="#">{l}</a>)}
            </div>

            <div className="footer-col">
              <h4>{t('navContact')}</h4>
              <span>✉ info@zetrc.org</span>
              <span>📞 +260 97 9885086</span>
              <span>📍 Lusaka, Zambia</span>
            </div>

            <div className="footer-cta-box">
              <p className="footer-cta-title">{t('footerReady')}</p>
              <p className="footer-cta-sub">{t('footerReadySub')}</p>
              <button className="btn-teal" style={{width:'100%', marginBottom:'0.6rem'}} onClick={onRequestProposal}>{t('requestProposal')}</button>
              <button className="btn-ghost-sm" style={{width:'100%'}}>{t('footerWhatsApp')}</button>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} ZETRC — Zambia Environmental Training & Research Centre</span>
          </div>
        </footer>
      )}
    </div>
  );
}

export default RootLayout;
