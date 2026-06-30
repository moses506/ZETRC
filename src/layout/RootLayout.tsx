import { ReactNode } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import type { PageKey } from '../types/pages';
import { ZETRC_WHATSAPP_DISPLAY, openWhatsApp } from '../utils/whatsapp';
import '../styles/global.css';

type RootLayoutProps = {
  children: ReactNode;
  onJoinPilot: () => void;
  onGoLogin: () => void;
  onGoHome: () => void;
  onGoAbout: () => void;
  onGoImpact: () => void;
  onGoTeam: () => void;
  onGoServices: () => void;
  onGoArticles: () => void;
  onGoPartners: () => void;
  onGoContact: () => void;
  onRequestProposal: () => void;
  showChrome?: boolean;
  currentPage?: PageKey;
};

function RootLayout({
  children,
  onJoinPilot,
  onGoLogin,
  onGoHome,
  onGoAbout,
  onGoImpact,
  onGoTeam,
  onGoServices,
  onGoArticles,
  onGoPartners,
  onGoContact,
  onRequestProposal,
  showChrome = true,
  currentPage = 'home',
}: RootLayoutProps) {
  const { t } = useLanguage();

  const navLink = (page: PageKey, label: string, onClick: () => void) => (
    <button
      type="button"
      className={`nav-link-btn ${currentPage === page ? 'nav-link-active' : ''}`}
      onClick={onClick}
    >
      {label}
    </button>
  );

  const footerLinks: { page: PageKey; label: string; onClick: () => void }[] = [
    { page: 'home', label: t('navHome'), onClick: onGoHome },
    { page: 'services', label: t('navServices'), onClick: onGoServices },
    { page: 'partners', label: t('navPartners'), onClick: onGoPartners },
    { page: 'about', label: t('navAbout'), onClick: onGoAbout },
    { page: 'impact', label: t('navImpact'), onClick: onGoImpact },
    { page: 'team', label: t('navTeam'), onClick: onGoTeam },
    { page: 'articles', label: t('navNewsFeeds'), onClick: onGoArticles },
    { page: 'login', label: t('logIn'), onClick: onGoLogin },
    { page: 'contact', label: t('navContact'), onClick: onGoContact },
  ];

  return (
    <div className={`app-shell${currentPage === 'home' ? ' app-shell--landing' : ''}`}>
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
              {navLink('home', t('navHome'), onGoHome)}
              {navLink('services', t('navServices'), onGoServices)}
              {navLink('partners', t('navPartners'), onGoPartners)}
              {navLink('articles', t('navNewsFeeds'), onGoArticles)}
              {navLink('about', t('navAbout'), onGoAbout)}
              {navLink('impact', t('navImpact'), onGoImpact)}
              {navLink('team', t('navTeam'), onGoTeam)}
              {navLink('contact', t('navContact'), onGoContact)}
            </nav>

            <div className="header-ctas">
              <button type="button" className="btn-ghost" onClick={onGoLogin}>{t('logIn')}</button>
              <button type="button" className="btn-ghost" onClick={onJoinPilot}>{t('joinPilot')}</button>
              <button type="button" className="btn-teal" onClick={onRequestProposal}>{t('requestProposal')}</button>
            </div>
          </div>
        </header>
      )}

      <LanguageSwitcher />

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
              {footerLinks.map((link) => (
                <button
                  key={link.label}
                  type="button"
                  className="footer-link-btn"
                  onClick={link.onClick}
                >
                  {link.label}
                </button>
              ))}
            </div>

            <div className="footer-col">
              <h4>{t('navContact')}</h4>
              <span>✉ info@zetrc.org</span>
              <span>📞 {ZETRC_WHATSAPP_DISPLAY}</span>
              <span>📍 Lusaka, Zambia</span>
            </div>

            <div className="footer-cta-box">
              <p className="footer-cta-title">{t('footerReady')}</p>
              <p className="footer-cta-sub">{t('footerReadySub')}</p>
              <button type="button" className="btn-teal" style={{width:'100%', marginBottom:'0.6rem'}} onClick={onRequestProposal}>{t('requestProposal')}</button>
              <button
                type="button"
                className="btn-ghost-sm"
                style={{ width: '100%' }}
                onClick={() => openWhatsApp(t('whatsappMsgPartnership'))}
              >
                {t('footerWhatsApp')}
              </button>
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
