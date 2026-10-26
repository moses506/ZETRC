import { FormEvent, useState } from 'react';
import { authenticateAdmin, authenticateLecturer } from '../../utils/api';
import { getStaffSessionKey, type StaffScope } from '../../utils/auth';
import '../../styles/auth.css';
import '../../styles/admin.css';

type AdminLoginProps = {
  onBackHome: () => void;
  onLogin: (response: unknown) => void;
  variant?: StaffScope;
};

const COPY: Record<StaffScope, {
  eyebrow: string;
  title: string;
  blurb: string;
  sub: string;
  kicker: string;
  heading: string;
  intro: string;
  footer: string;
}> = {
  admin: {
    eyebrow: 'Staff access',
    title: 'ZETRC Admin',
    blurb: 'Manage students, lecturers, courses, enrollments, certificates and inbound leads.',
    sub: 'Admin console',
    kicker: 'Admin login',
    heading: 'Sign in to the admin console',
    intro: 'This area is restricted to administrator accounts.',
    footer: 'Admin sessions are separate from learner accounts.',
  },
  lecturer: {
    eyebrow: 'Lecturer access',
    title: 'ZETRC Lecturer Portal',
    blurb: 'Run your courses: publish modules and lessons, set assignments, mark submissions and track your students.',
    sub: 'Lecturer portal',
    kicker: 'Lecturer login',
    heading: 'Sign in to the lecturer portal',
    intro: 'Use the lecturer account your administrator created for you.',
    footer: 'Lecturer sessions are separate from learner accounts.',
  },
};

function AdminLogin({ onBackHome, onLogin, variant = 'admin' }: AdminLoginProps) {
  const copy = COPY[variant];
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const authenticate = variant === 'lecturer' ? authenticateLecturer : authenticateAdmin;
      const response = await authenticate({
        email: email.trim(),
        password,
      });

      localStorage.setItem(
        getStaffSessionKey(variant),
        JSON.stringify({
          response,
          login_email: email.trim(),
        }),
      );
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
    <section className="auth-page admin-login-page">
      <div className="auth-layout">
        <aside className="auth-aside">
          <button type="button" className="auth-back-link" onClick={onBackHome}>
            ← Back to site
          </button>

          <span className="auth-eyebrow">
            <span className="auth-eyebrow-dot" aria-hidden="true" />
            {copy.eyebrow}
          </span>

          <h1 className="auth-title">{copy.title}</h1>
          <p className="auth-copy">{copy.blurb}</p>
        </aside>

        <div className="auth-card">
          <header className="auth-card-header">
            <div className="brand">
              <div className="brand-icon">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                  <rect width="22" height="22" rx="6" fill="#032b14" />
                  <path d="M11 3 L19 11 L11 19 L3 11 Z" stroke="#d9a51f" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
                  <circle cx="11" cy="11" r="2.5" fill="#d9a51f" />
                </svg>
              </div>
              <div className="brand-text">
                <span className="brand-mark">ZETRC</span>
                <span className="brand-sub">{copy.sub}</span>
              </div>
            </div>
            <span className="auth-kicker">{copy.kicker}</span>
          </header>

          <div className="auth-card-intro">
            <h2>{copy.heading}</h2>
            <p>{copy.intro}</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {errorMessage ? (
              <div className="auth-feedback auth-feedback-error" role="alert" aria-live="assertive">
                {errorMessage}
              </div>
            ) : null}

            <label className="auth-field">
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

            <label className="auth-field">
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

            <button type="submit" className="auth-submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="admin-spinner admin-spinner-light" aria-hidden="true" /> Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <div className="auth-footer-note">
            <span className="auth-footer-dot" aria-hidden="true" />
            {copy.footer}
          </div>
        </div>
      </div>
    </section>
  );
}

export default AdminLogin;
