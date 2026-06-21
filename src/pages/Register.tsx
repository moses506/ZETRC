import { FormEvent, useState } from 'react';
import { getApiMessage, submitLearnerRegistration } from '../utils/api';
import { normalizeZambiaPhone, sanitizePhoneInput, ZAMBIA_PHONE_PREFIX } from '../utils/phone';
import { useLanguage } from '../i18n/LanguageContext';
import '../styles/auth.css';

type RegisterProps = {
  onBackHome: () => void;
  onRegister: (message?: string) => void;
  onGoLogin: () => void;
};

function Register({ onBackHome, onRegister, onGoLogin }: RegisterProps) {
  const { t } = useLanguage();
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [organization, setOrganization] = useState('');
  const [province, setProvince] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [agreeToUpdates, setAgreeToUpdates] = useState(false);
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
      const formattedPhone = normalizeZambiaPhone(phoneNumber);

      const response = await submitLearnerRegistration({
        firstName: firstName.trim(),
        middleName: middleName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        contactNo: formattedPhone,
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
            phoneNumber: formattedPhone,
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
    <section className="auth-page auth-page--register">
      <div className="auth-register-wrap">
        <div className="auth-register-topbar">
          <button type="button" className="auth-back-link" onClick={onBackHome}>
            {t('backHome')}
          </button>
          <span className="auth-topbar-badge">{t('registerPageBadge')}</span>
        </div>

        <header className="auth-register-head">
          <h1 className="auth-title auth-title--register">{t('registerProfile')}</h1>
          <p className="auth-copy auth-copy--register">{t('registerIntro')}</p>
        </header>

        <div className="auth-card auth-card--register">
          <header className="auth-card-header auth-card-header--compact">
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
            <button type="button" className="auth-link-btn" onClick={() => onGoLogin()}>
              {t('signIn')}
            </button>
          </header>

          <form className="auth-form auth-form--compact" onSubmit={handleSubmit}>
            {errorMessage ? (
              <div className="auth-feedback auth-feedback-error" role="alert" aria-live="assertive">
                {errorMessage}
              </div>
            ) : null}

            <div className="auth-form-section auth-form-section--compact">
              <h3 className="auth-form-section-title">{t('authPersonalDetails')}</h3>
              <div className="auth-form-grid auth-form-grid--names">
                <label className="auth-field">
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
                <label className="auth-field">
                  <span>{t('middleName')}</span>
                  <input
                    type="text"
                    placeholder={t('optional')}
                    value={middleName}
                    onChange={(event) => setMiddleName(event.target.value)}
                    autoComplete="additional-name"
                    disabled={isSubmitting}
                  />
                </label>
                <label className="auth-field">
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
              </div>
            </div>

            <div className="auth-form-section auth-form-section--compact">
              <h3 className="auth-form-section-title">{t('authContactLocation')}</h3>
              <div className="auth-form-grid auth-form-grid--duo">
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
                  <span>{t('phoneNumber')}</span>
                  <div className="phone-input-group phone-input-group--light">
                    <span className="phone-input-prefix">{ZAMBIA_PHONE_PREFIX}</span>
                    <input
                      type="tel"
                      inputMode="tel"
                      placeholder={t('phoneLocalPlaceholder')}
                      value={phoneNumber}
                      onChange={(event) => setPhoneNumber(sanitizePhoneInput(event.target.value))}
                      autoComplete="tel-national"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </label>
                <label className="auth-field">
                  <span>{t('organization')}</span>
                  <input
                    type="text"
                    placeholder={t('optional')}
                    value={organization}
                    onChange={(event) => setOrganization(event.target.value)}
                    disabled={isSubmitting}
                  />
                </label>
                <label className="auth-field">
                  <span>{t('provinceDistrict')}</span>
                  <input
                    type="text"
                    placeholder={t('placeholderProvince')}
                    value={province}
                    onChange={(event) => setProvince(event.target.value)}
                    disabled={isSubmitting}
                  />
                </label>
              </div>
            </div>

            <div className="auth-form-section auth-form-section--compact">
              <h3 className="auth-form-section-title">{t('authAccountSecurity')}</h3>
              <div className="auth-form-grid auth-form-grid--duo">
                <label className="auth-field">
                  <span>{t('createPassword')}</span>
                  <input
                    type="password"
                    placeholder={t('placeholderPasswordMin')}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="new-password"
                    minLength={8}
                    required
                    disabled={isSubmitting}
                  />
                </label>
                <label className="auth-field">
                  <span>{t('confirmPassword')}</span>
                  <input
                    type="password"
                    placeholder={t('placeholderRepeatPassword')}
                    value={passwordConfirmation}
                    onChange={(event) => setPasswordConfirmation(event.target.value)}
                    autoComplete="new-password"
                    minLength={8}
                    required
                    disabled={isSubmitting}
                  />
                </label>
              </div>
            </div>

            <div className="auth-register-footer">
              <label className="auth-remember">
                <input
                  type="checkbox"
                  checked={agreeToUpdates}
                  onChange={(event) => setAgreeToUpdates(event.target.checked)}
                  disabled={isSubmitting}
                />
                <span>{t('updatesAgreement')}</span>
              </label>
              <button type="submit" className="auth-submit auth-submit--inline" disabled={isSubmitting}>
                {isSubmitting ? t('creatingAccount') : t('createAccountArrow')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

export default Register;
