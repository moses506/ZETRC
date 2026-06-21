import { FormEvent, useEffect, useState } from 'react';
import { authenticateLearner } from '../utils/api';
import { useLanguage } from '../i18n/LanguageContext';
import '../styles/auth.css';

type LoginProps = {
  onBackHome: () => void;
  onLogin: (response: unknown) => void;
  onGoRegister: () => void;
  notice?: string | null;
};

function Login({ onBackHome, onLogin, onGoRegister, notice }: LoginProps) {
  const { t, tList } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setErrorMessage(null);
  }, [notice]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const response = await authenticateLearner({
        email: email.trim(),
        password,
      });

      localStorage.setItem(
        'zetrcAuthSession',
        JSON.stringify({
          response,
          login_email: email.trim(),
        }),
      );
      localStorage.setItem('zetrcRememberUser', String(keepSignedIn));
      onLogin(response);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t('unableSignIn');
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-layout">
        <aside className="auth-aside">
          <button type="button" className="auth-back-link" onClick={onBackHome}>
            {t('backHome')}
          </button>

          <span className="auth-eyebrow">
            <span className="auth-eyebrow-dot" aria-hidden="true" />
            {t('pilotTrainingAccess')}
          </span>

          <h1 className="auth-title">{t('welcomeAcademy')}</h1>
          <p className="auth-copy">{t('loginCopy')}</p>

          <ul className="auth-highlights">
            {tList('trustPoints').map((point) => (
              <li className="auth-highlight" key={point}>
                <span className="auth-highlight-mark" aria-hidden="true">✓</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </aside>

        <div className="auth-card">
          <header className="auth-card-header">
            <div className="brand">
              <div className="brand-icon">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
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
            <span className="auth-kicker">{t('memberLogin')}</span>
          </header>

          <div className="auth-card-intro">
            <h2>{t('continueJourney')}</h2>
            <p>{t('useAccess')}</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {notice ? (
              <div className="auth-feedback auth-feedback-success" role="status" aria-live="polite">
                {notice}
              </div>
            ) : null}

            {errorMessage ? (
              <div className="auth-feedback auth-feedback-error" role="alert" aria-live="assertive">
                {errorMessage}
              </div>
            ) : null}

            <label className="auth-field">
              <span>{t('emailAddress')}</span>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
                disabled={isSubmitting}
              />
            </label>

            <label className="auth-field">
              <span>{t('password')}</span>
              <input
                type="password"
                placeholder={t('enterPassword')}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
                disabled={isSubmitting}
              />
            </label>

            <div className="auth-row">
              <label className="auth-remember">
                <input
                  type="checkbox"
                  checked={keepSignedIn}
                  onChange={(event) => setKeepSignedIn(event.target.checked)}
                  disabled={isSubmitting}
                />
                <span>{t('keepSignedIn')}</span>
              </label>
              <button type="button" className="auth-link-btn">{t('needHelp')}</button>
            </div>

            <button type="submit" className="auth-submit" disabled={isSubmitting}>
              {isSubmitting ? t('signingIn') : t('enterDashboard')}
            </button>
          </form>

          <div className="auth-switch">
            {t('newToZetrc')}
            <button type="button" className="auth-link-btn" onClick={onGoRegister}>
              {t('createAccount')}
            </button>
          </div>

          <div className="auth-footer-note">
            <span className="auth-footer-dot" aria-hidden="true" />
            {t('protectedAccess')}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Login;
