import { FormEvent, useEffect, useState } from 'react';
import { authenticateLearner } from '../utils/api';

type LoginProps = {
  onBackHome: () => void;
  onLogin: (response: unknown) => void;
  onGoRegister: () => void;
  notice?: string | null;
};

const trustPoints = [
  'Mobile-friendly learning built for field access',
  'Certification-ready pilot modules and assignments',
  'Direct support for trainees, cooperatives, and partner teams',
];

function Login({ onBackHome, onLogin, onGoRegister, notice }: LoginProps) {
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
        error instanceof Error ? error.message : 'Unable to sign in right now.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="login-page">
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      <div className="login-shell">
        <div className="login-intro">
          <button className="login-back" onClick={onBackHome}>
            ← Back to landing page
          </button>

          <span className="hero-badge">
            <span className="badge-dot" />
            Pilot Training Access
          </span>

          <h1 className="login-title">
            Welcome back to the
            <span className="hero-accent"> ZETRC Academy</span>
          </h1>

          <p className="login-copy">
            Sign in to continue your pilot training, track assignments, and access climate-smart agriculture resources built for real field work.
          </p>

          <div className="login-feature-panel glass-card">
            <div className="login-panel-header">
              <span className="card-tag">Why trainees use this portal</span>
              <span className="login-status">Live cohort</span>
            </div>

            <div className="login-metrics">
              <div className="login-metric">
                <strong>5 modules</strong>
                <span>Structured pilot pathway</span>
              </div>
              <div className="login-metric">
                <strong>Weekly tasks</strong>
                <span>Simple progress tracking</span>
              </div>
            </div>

            <div className="login-trust-list">
              {trustPoints.map((point) => (
                <div className="login-trust-item" key={point}>
                  <span className="login-check">✓</span>
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="login-card glass-card">
          <div className="login-card-top">
            <div className="brand">
              <div className="brand-icon">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <rect width="22" height="22" rx="6" fill="#032b14" />
                  <path d="M11 3 L19 11 L11 19 L3 11 Z" stroke="#d9a51f" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
                  <circle cx="11" cy="11" r="2.5" fill="#d9a51f" />
                </svg>
              </div>
              <div className="brand-text">
                <span className="brand-mark">ZETRC</span>
                <span className="brand-sub">Training + Research</span>
              </div>
            </div>

            <div className="login-kicker">Member Login</div>
          </div>

          <div className="login-card-copy">
            <h2>Continue your learning journey</h2>
            <p>Use your pilot access details to open your training dashboard.</p>
          </div>

          <form
            className="login-form"
            onSubmit={handleSubmit}
          >
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

            <label className="login-field">
              <span>Email address</span>
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

            <label className="login-field">
              <span>Password</span>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
                disabled={isSubmitting}
              />
            </label>

            <div className="login-row">
              <label className="login-remember">
                <input
                  type="checkbox"
                  checked={keepSignedIn}
                  onChange={(event) => setKeepSignedIn(event.target.checked)}
                  disabled={isSubmitting}
                />
                <span>Keep me signed in</span>
              </label>
              <button type="button" className="login-link-btn">Need help?</button>
            </div>

            <button type="submit" className="btn-hero-teal login-submit" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'Enter Dashboard →'}
            </button>
          </form>

          <div className="auth-switch">
            New to ZETRC?
            <button type="button" className="login-link-btn" onClick={onGoRegister}>
              Create an account
            </button>
          </div>

          <div className="login-footer-note">
            <span className="trust-dot" />
            Protected access for registered ZETRC pilot trainees and partners
          </div>
        </div>
      </div>
    </section>
  );
}

export default Login;
