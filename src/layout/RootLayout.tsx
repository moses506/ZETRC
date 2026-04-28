import { ReactNode } from 'react';
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
  return (
    <div className="app-shell">
      {showChrome && (
        <header className="app-header">
          <div className="header-inner">
            <div className="brand" onClick={onGoHome} style={{ cursor: 'pointer' }}>
              <div className="brand-icon">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <rect width="22" height="22" rx="6" fill="#071a14" />
                  <path d="M11 3 L19 11 L11 19 L3 11 Z" stroke="#2dd4aa" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
                  <circle cx="11" cy="11" r="2.5" fill="#2dd4aa" />
                </svg>
              </div>
              <div className="brand-text">
                <span className="brand-mark">ZETRC</span>
                <span className="brand-sub">Training + Research</span>
              </div>
            </div>

            <nav className="main-nav">
              <button
                type="button"
                className={`nav-link-btn ${currentPage === 'home' ? 'nav-link-active' : ''}`}
                onClick={onGoHome}
              >
                Home
              </button>
              <a href="#services">Services</a>
              <button
                type="button"
                className={`nav-link-btn ${currentPage === 'training' ? 'nav-link-active' : ''}`}
                onClick={onGoTraining}
              >
                Training
              </button>
              <a href="#academy">Academy</a>
              <a href="#about">About</a>
              <a href="#contact">Contact</a>
            </nav>

            <div className="header-ctas">
              <button className="btn-ghost" onClick={onJoinPilot}>Join Pilot</button>
              <button className="btn-teal" onClick={onRequestProposal}>Request Proposal</button>
            </div>
          </div>
        </header>
      )}

      <main className="app-content">{children}</main>

      {showChrome && (
        <footer className="app-footer">
          <div className="footer-inner">
            <div className="footer-brand-col">
              <div className="brand" style={{marginBottom: '1rem'}}>
                <div className="brand-icon">
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <rect width="22" height="22" rx="6" fill="#071a14" />
                    <path d="M11 3 L19 11 L11 19 L3 11 Z" stroke="#2dd4aa" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
                    <circle cx="11" cy="11" r="2.5" fill="#2dd4aa" />
                  </svg>
                </div>
                <span className="brand-mark">ZETRC</span>
              </div>
              <p className="footer-tagline">Turning agricultural and environmental knowledge into real-world impact through practical training, advisory, and research-driven action.</p>
            </div>

            <div className="footer-col">
              <h4>Explore</h4>
              {['Home','Services','Pilot Training','Academy','About'].map(l => <a key={l} href="#">{l}</a>)}
            </div>

            <div className="footer-col">
              <h4>Contact</h4>
              <span>✉ info@zetrc.org</span>
              <span>📞 +260 97 9885086</span>
              <span>📍 Lusaka, Zambia</span>
            </div>

            <div className="footer-cta-box">
              <p className="footer-cta-title">Ready to partner?</p>
              <p className="footer-cta-sub">For organizations and development partners seeking practical impact.</p>
              <button className="btn-teal" style={{width:'100%', marginBottom:'0.6rem'}} onClick={onRequestProposal}>Request Proposal</button>
              <button className="btn-ghost-sm" style={{width:'100%'}}>WhatsApp</button>
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
