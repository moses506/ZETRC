import { FormEvent, useState } from 'react';
import { getApiMessage, submitLearnerRegistration } from '../utils/api';

type RegisterProps = {
  onBackHome: () => void;
  onRegister: (message?: string) => void;
  onGoLogin: () => void;
};

const partnerHighlights = [
  'Structured onboarding for pilot trainees and learning cohorts',
  'Profiles for farmers, cooperatives, NGOs, and partner institutions',
  'Registration details that support training delivery and field coordination',
];

function Register({ onBackHome, onRegister, onGoLogin }: RegisterProps) {
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [organization, setOrganization] = useState('');
  const [province, setProvince] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [agreeToUpdates, setAgreeToUpdates] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (password !== passwordConfirmation) {
      setErrorMessage('Password confirmation does not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await submitLearnerRegistration({
        firstName: firstName.trim(),
        middleName: middleName.trim(),  
        lastName: lastName.trim(),
        email: email.trim(),
        contactNo: phoneNumber.trim(),
        password,
        passwordConfirmation,
      });

      localStorage.setItem(
        'zetrcLastRegistration',
        JSON.stringify({
          response,
          profile: {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim(),
            phoneNumber: phoneNumber.trim(),
            organization: organization.trim(),
            province: province.trim(),
            agreeToUpdates,
          },
        }),
      );

      onRegister(getApiMessage(response, 'Registration successful. Sign in to continue.'));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to create your account right now.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="login-page register-page">
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      <div className="login-shell register-shell">
        <div className="login-intro">
          <button className="login-back" onClick={onBackHome}>
            ← Back to landing page
          </button>

          <span className="hero-badge">
            <span className="badge-dot" />
            Enrollment For Pilot Access
          </span>

          <h1 className="login-title">
            Register your
            <span className="hero-accent"> training profile</span>
          </h1>

          <p className="login-copy">
            Create a ZETRC account for pilot training, advisory programs, and institution-supported learning. This setup helps us place each learner in the right cohort and support flow.
          </p>

          <div className="login-feature-panel glass-card">
            <div className="login-panel-header">
              <span className="card-tag">Built for practical onboarding</span>
              <span className="login-status">Cohort-ready</span>
            </div>

            <div className="register-role-grid">
              <div className="register-role-card">
                <strong>Farmers & trainees</strong>
                <span>Join learning tracks, assignments, and certification pathways.</span>
              </div>
              <div className="register-role-card">
                <strong>Cooperatives & NGOs</strong>
                <span>Register teams for supported delivery and coordinated reporting.</span>
              </div>
            </div>

            <div className="login-trust-list">
              {partnerHighlights.map((point) => (
                <div className="login-trust-item" key={point}>
                  <span className="login-check">✓</span>
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="login-card glass-card register-card">
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

            <div className="login-kicker">Create Account</div>
          </div>

          <div className="login-card-copy">
            <h2>Start your registration</h2>
            <p>Tell us who you are so we can assign the right learning path and support team.</p>
          </div>

          <form
            className="login-form register-form"
            onSubmit={handleSubmit}
          >
            {errorMessage ? (
              <div className="auth-feedback auth-feedback-error" role="alert" aria-live="assertive">
                {errorMessage}
              </div>
            ) : null}

            <div className="register-grid">
              <label className="login-field">
                <span>First name</span>
                <input
                  type="text"
                  placeholder="Chanda"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  autoComplete="given-name"
                  required
                  disabled={isSubmitting}
                />
              </label>
               <label className="login-field">
                <span>Middle name</span>
                <input
                  type="text"
                  placeholder="Chileshe (optional)"
                  value={middleName}
                  onChange={(event) => setMiddleName(event.target.value)}
                  autoComplete="additional-name"
                  disabled={isSubmitting}
                />
              </label>

              <label className="login-field">
                <span>Last name</span>
                <input
                  type="text"
                  placeholder="Mwale"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  autoComplete="family-name"
                  required
                  disabled={isSubmitting}
                />
              </label>

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
                <span>Phone number</span>
                <input
                  type="tel"
                  placeholder="+260..."
                  value={phoneNumber}
                  onChange={(event) => setPhoneNumber(event.target.value)}
                  autoComplete="tel"
                  required
                  disabled={isSubmitting}
                />
              </label>

              <label className="login-field">
                <span>Organization or cooperative</span>
                <input
                  type="text"
                  placeholder="Optional but useful for cohort setup"
                  value={organization}
                  onChange={(event) => setOrganization(event.target.value)}
                  disabled={isSubmitting}
                />
              </label>

              <label className="login-field">
                <span>Province / district</span>
                <input
                  type="text"
                  placeholder="Lusaka, Kasama, Chipata..."
                  value={province}
                  onChange={(event) => setProvince(event.target.value)}
                  disabled={isSubmitting}
                />
              </label>

              <label className="login-field">
                <span>Create password</span>
                <input
                  type="password"
                  placeholder="Choose a secure password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  required
                  disabled={isSubmitting}
                />
              </label>

              <label className="login-field">
                <span>Confirm password</span>
                <input
                  type="password"
                  placeholder="Repeat your password"
                  value={passwordConfirmation}
                  onChange={(event) => setPasswordConfirmation(event.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  required
                  disabled={isSubmitting}
                />
              </label>
            </div>

            <div className="login-row">
              <label className="login-remember">
                <input
                  type="checkbox"
                  checked={agreeToUpdates}
                  onChange={(event) => setAgreeToUpdates(event.target.checked)}
                  disabled={isSubmitting}
                />
                <span>I agree to be contacted about enrollment and training updates</span>
              </label>
            </div>

            <button type="submit" className="btn-hero-teal login-submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating account...' : 'Create Account →'}
            </button>
          </form>

          <div className="auth-switch">
            Already registered?
            <button type="button" className="login-link-btn" onClick={() => onGoLogin()}>
              Sign in
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Register;
