import { FormEvent, useState } from 'react';
import { getApiMessage, submitLearnerRegistration } from '../utils/api';
import { useLanguage } from '../i18n/LanguageContext';

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
  const { t, tList } = useLanguage();
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
      setErrorMessage(t('passwordMismatch'));
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

      onRegister(getApiMessage(response, t('registerSuccess')));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t('unableCreate');
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
            {t('backLanding')}
          </button>

          <span className="hero-badge">
            <span className="badge-dot" />
            {t('enrollmentPilotAccess')}
          </span>

          <h1 className="login-title">
            {t('registerProfile')}
          </h1>

          <p className="login-copy">
            {t('registerCopy')}
          </p>

          <div className="login-feature-panel glass-card">
            <div className="login-panel-header">
              <span className="card-tag">{t('practicalOnboarding')}</span>
              <span className="login-status">{t('cohortReady')}</span>
            </div>

            <div className="register-role-grid">
              <div className="register-role-card">
                <strong>{t('farmersTrainees')}</strong>
                <span>{t('farmersTraineesDesc')}</span>
              </div>
              <div className="register-role-card">
                <strong>{t('cooperativesNgos')}</strong>
                <span>{t('cooperativesNgosDesc')}</span>
              </div>
            </div>

            <div className="login-trust-list">
              {tList('partnerHighlights').map((point) => (
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
                <span className="brand-sub">{t('brandSub')}</span>
              </div>
            </div>

            <div className="login-kicker">{t('createAccount')}</div>
          </div>

          <div className="login-card-copy">
            <h2>{t('startRegistration')}</h2>
            <p>{t('registerIntro')}</p>
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
                <span>{t('firstName')}</span>
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
                <span>{t('middleName')}</span>
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
                <span>{t('lastName')}</span>
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

              <label className="login-field">
                <span>{t('phoneNumber')}</span>
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
                <span>{t('organization')}</span>
                <input
                  type="text"
                  placeholder="Optional but useful for cohort setup"
                  value={organization}
                  onChange={(event) => setOrganization(event.target.value)}
                  disabled={isSubmitting}
                />
              </label>

              <label className="login-field">
                <span>{t('provinceDistrict')}</span>
                <input
                  type="text"
                  placeholder="Lusaka, Kasama, Chipata..."
                  value={province}
                  onChange={(event) => setProvince(event.target.value)}
                  disabled={isSubmitting}
                />
              </label>

              <label className="login-field">
                <span>{t('createPassword')}</span>
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
                <span>{t('confirmPassword')}</span>
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
                <span>{t('updatesAgreement')}</span>
              </label>
            </div>

            <button type="submit" className="btn-hero-teal login-submit" disabled={isSubmitting}>
              {isSubmitting ? t('creatingAccount') : t('createAccountArrow')}
            </button>
          </form>

          <div className="auth-switch">
            {t('alreadyRegistered')}
            <button type="button" className="login-link-btn" onClick={() => onGoLogin()}>
              {t('signIn')}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Register;
