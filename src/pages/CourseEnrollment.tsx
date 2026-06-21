import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  fetchCourses,
  submitEnrollment,
  type Course,
} from '../utils/api';
import type { LearnerProfile } from '../utils/auth';
import { useLanguage } from '../i18n/LanguageContext';
import { normalizeZambiaPhone, sanitizePhoneInput, ZAMBIA_PHONE_PREFIX } from '../utils/phone';

type CourseEnrollmentProps = {
  learnerProfile: LearnerProfile;
  onEnrollmentComplete: (course: Course, description: string, response: unknown) => void;
  onAlreadyEnrolled?: (courseName: string, duration: string, description: string) => void;
  onBackToLogin: () => void;
};

type PaymentStep = 'course' | 'payment' | 'processing' | 'receipt';
type PaymentMethod = 'mobile_money' | 'card' | 'voucher';

const COURSE_ICONS: Record<string, string> = {
  default: '📚', agric: '🌱', business: '💼',
  tech: '💻', finance: '📊', health: '🏥',
};

function getCourseIcon(name: string): string {
  const l = name.toLowerCase();
  if (l.includes('agric') || l.includes('farm') || l.includes('soybean')) return COURSE_ICONS.agric;
  if (l.includes('business') || l.includes('enterprise')) return COURSE_ICONS.business;
  if (l.includes('tech') || l.includes('ict') || l.includes('computer')) return COURSE_ICONS.tech;
  if (l.includes('finance') || l.includes('account')) return COURSE_ICONS.finance;
  if (l.includes('health') || l.includes('nurse')) return COURSE_ICONS.health;
  return COURSE_ICONS.default;
}

function getCourseFee(course: Course | null): number {
  if (!course) return 0;
  const m = course.duration?.toLowerCase().match(/\d+/);
  const d = m ? Number(m[0]) : 4;
  const base = course.name.toLowerCase().includes('pilot') ? 250 : 350;
  return Math.min(base + d * 25, 850);
}

function formatKwacha(amount: number): string {
  return `K ${amount.toLocaleString('en-ZM')}`;
}

const PAYMENT_METHODS = [
  {
    value: 'mobile_money' as PaymentMethod,
    label: 'Mobile Money',
    detail: 'MTN, Airtel or Zamtel',
    icon: '📱',
  },
  {
    value: 'card' as PaymentMethod,
    label: 'Bank Card',
    detail: 'Visa or Mastercard',
    icon: '💳',
  },
  {
    value: 'voucher' as PaymentMethod,
    label: 'Sponsor Voucher',
    detail: 'Partner-funded learner',
    icon: '🎟️',
  },
];

function CourseEnrollment({
  learnerProfile,
  onEnrollmentComplete,
  onBackToLogin,
}: CourseEnrollmentProps) {
  const { t, tList } = useLanguage();

  // Core state
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseName, setSelectedCourseName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Payment state
  const [step, setStep] = useState<PaymentStep>('course');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mobile_money');
  const [mobileNumber, setMobileNumber] = useState('');
  const [mobileNetwork, setMobileNetwork] = useState('MTN');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [voucherCode, setVoucherCode] = useState('');
  const [processingDots, setProcessingDots] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoadingCourses(true);
      setErrorMessage(null);
      try {
        const result = await fetchCourses();
        if (cancelled) return;
        setCourses(result);
        setSelectedCourseName(result[0]?.name ?? '');
      } catch (e) {
        if (!cancelled) setErrorMessage(e instanceof Error ? e.message : t('unableCourses'));
      } finally {
        if (!cancelled) setIsLoadingCourses(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  // Animate the processing dots
  useEffect(() => {
    if (step !== 'processing') return;
    const id = window.setInterval(() => setProcessingDots((d) => (d + 1) % 4), 420);
    return () => window.clearInterval(id);
  }, [step]);

  const selectedCourse = courses.find((c) => c.name === selectedCourseName) ?? null;
  const paymentReference = useMemo(
    () => `ZETRC-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    [selectedCourseName],
  );
  const courseFee = getCourseFee(selectedCourse);
  const totalDue = courseFee;

  // Format card number with spaces
  const handleCardNumber = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 16);
    setCardNumber(digits.replace(/(.{4})/g, '$1 ').trim());
  };

  // Format expiry MM/YY
  const handleExpiry = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 4);
    setCardExpiry(digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits);
  };

  const handleCourseSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) { setErrorMessage(t('selectCourseError')); return; }
    setErrorMessage(null);
    setStep('payment');
  };

  const handlePaymentSubmit = async () => {
    if (!selectedCourse) return;
    setErrorMessage(null);
    setStep('processing');
    try {
      await new Promise((res) => window.setTimeout(res, 2800));
      await submitEnrollment({
        firstName: learnerProfile.firstName,
        lastName: learnerProfile.lastName,
        email: learnerProfile.email,
        description: `${description.trim()} | Payment simulation: ${paymentReference} via ${paymentMethod}.`,
        course: selectedCourse,
      });
      setStep('receipt');
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : t('unableEnroll'));
      setStep('payment');
    }
  };

  const stepMeta: Record<PaymentStep, { label: string; num: number }> = {
    course:     { label: 'Choose course', num: 1 },
    payment:    { label: 'Payment',       num: 2 },
    processing: { label: 'Processing',    num: 3 },
    receipt:    { label: 'Confirmed',     num: 3 },
  };

  return (
    <section className="login-page course-enrollment-page">
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      <div className="login-shell ce-shell">

        {/* ── LEFT ── */}
        <div className="login-intro">
          <div className="course-enrollment-heading-row">
            <button className="login-back" onClick={onBackToLogin}>
              {t('backSignIn')}
            </button>
            <span className="hero-badge">
              <span className="badge-dot" />
              {t('firstTimeEnrollment')}
            </span>
          </div>

          <h1 className="login-title" style={{ marginTop: '1.25rem' }}>
            {t('chooseCourse')}
          </h1>
          <p className="login-copy">
            {t('welcomeLearner')}, {learnerProfile.firstName || t('learnerFallback')}. {t('courseIntro')}
          </p>

          {/* Step tracker */}
          <div className="ce-step-tracker">
            {(['course', 'payment', 'receipt'] as const).map((s, i) => {
              const done = stepMeta[step].num > i + 1;
              const active = stepMeta[step].num === i + 1 || (s === 'receipt' && step === 'processing');
              return (
                <div key={s} className={`ce-step${active ? ' ce-step--active' : ''}${done ? ' ce-step--done' : ''}`}>
                  <div className="ce-step-dot">
                    {done ? '✓' : i + 1}
                  </div>
                  <span>{stepMeta[s].label}</span>
                  {i < 2 && <div className="ce-step-line" />}
                </div>
              );
            })}
          </div>

          <div className="login-feature-panel glass-card" style={{ marginTop: '2rem' }}>
            <div className="login-panel-header">
              <span className="card-tag">{t('enrollmentDetails')}</span>
              <span className="login-status">{t('required')}</span>
            </div>
            <div className="login-trust-list" style={{ marginTop: '1rem' }}>
              {tList('enrollmentPoints').map((point) => (
                <div className="login-trust-item" key={point}>
                  <span className="login-check">✓</span>
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT CARD ── */}
        <div className="login-card glass-card ce-card">
          {/* Brand header */}
          <div className="login-card-top">
            <div className="brand">
              <div className="brand-icon">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <rect width="22" height="22" rx="6" fill="#032b14" />
                  <path d="M11 3 L19 11 L11 19 L3 11 Z" stroke="#d9a51f" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
                  <circle cx="11" cy="11" r="2.5" fill="#d9a51f" />
                </svg>
              </div>
              <div className="brand-text">
                <span className="brand-mark">ZETRC</span>
                <span className="brand-sub">{t('brandSub')}</span>
              </div>
            </div>
            <div className="login-kicker">
              {step === 'course' ? t('enroll') : step === 'payment' ? 'Payment' : step === 'processing' ? 'Processing' : 'Confirmed'}
            </div>
          </div>

          {/* ── STEP: COURSE SELECTION ── */}
          {step === 'course' && (
            <form className="login-form" onSubmit={handleCourseSubmit}>
              <div className="login-card-copy">
                <h2>{t('completeEnrollment')}</h2>
                <p>{t('pickCourse')}</p>
              </div>

              {errorMessage && (
                <div className="auth-feedback auth-feedback-error" role="alert">{errorMessage}</div>
              )}

              <div className="course-summary-card">
                <div>
                  <span className="course-summary-label">{t('learner')}</span>
                  <strong>{learnerProfile.fullName}</strong>
                </div>
                <div>
                  <span className="course-summary-label">{t('email')}</span>
                  <strong>{learnerProfile.email || t('noEmail')}</strong>
                </div>
              </div>

              <div className="ce-picker-label">
                <span>{t('selectCourse')}</span>
                {!isLoadingCourses && courses.length > 0 && (
                  <span className="ce-course-count">{courses.length} courses available</span>
                )}
              </div>

              {isLoadingCourses ? (
                <div className="ce-loading-grid">
                  {[1, 2, 3].map((n) => <div key={n} className="ce-course-skeleton" />)}
                </div>
              ) : courses.length === 0 ? (
                <div className="ce-empty"><span>📭</span><p>{t('noCourses')}</p></div>
              ) : (
                <div className="ce-courses-grid">
                  {courses.map((course) => {
                    const isSelected = course.name === selectedCourseName;
                    const fee = getCourseFee(course);
                    return (
                      <button
                        key={course.name}
                        type="button"
                        className={`ce-course-card${isSelected ? ' ce-course-card--selected' : ''}`}
                        onClick={() => setSelectedCourseName(course.name)}
                      >
                        <div className="ce-course-card-top">
                          <span className="ce-course-icon">{getCourseIcon(course.name)}</span>
                          {course.duration && (
                            <span className="ce-duration-pill">{course.duration}</span>
                          )}
                          {isSelected && <span className="ce-selected-check">✓</span>}
                        </div>
                        <div className="ce-course-name">{course.name}</div>
                        {course.description && (
                          <div className="ce-course-desc">{course.description}</div>
                        )}
                        <div className="ce-course-fee">{formatKwacha(fee)}</div>
                      </button>
                    );
                  })}
                </div>
              )}

              <label className="login-field">
                <span>{t('courseInterest')}</span>
                <textarea
                  className="login-textarea"
                  rows={3}
                  placeholder={t('courseInterestPlaceholder')}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </label>

              <button
                type="submit"
                className="btn-hero-teal login-submit"
                disabled={isLoadingCourses || !selectedCourse}
              >
                Continue to payment →
              </button>
            </form>
          )}

          {/* ── STEP: PAYMENT ── */}
          {step === 'payment' && (
            <div className="login-form">
              <div className="login-card-copy">
                <h2>Payment simulation</h2>
                <p>No real money is charged — this simulates the payment flow.</p>
              </div>

              {errorMessage && (
                <div className="auth-feedback auth-feedback-error" role="alert">{errorMessage}</div>
              )}

              {/* Order summary */}
              <div className="ce-order-summary">
                <div className="ce-order-row">
                  <span>{getCourseIcon(selectedCourse?.name ?? '')} {selectedCourse?.name}</span>
                  <span>{selectedCourse?.duration ?? 'Flexible'}</span>
                </div>
                <div className="ce-order-divider" />
                <div className="ce-order-row ce-order-total">
                  <span>Total due</span>
                  <strong>{formatKwacha(totalDue)}</strong>
                </div>
                <div className="ce-order-ref">Ref: {paymentReference}</div>
              </div>

              {/* Method picker */}
              <div className="ce-method-grid" role="radiogroup">
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    className={`ce-method-btn${paymentMethod === m.value ? ' ce-method-btn--active' : ''}`}
                    onClick={() => setPaymentMethod(m.value)}
                  >
                    <span className="ce-method-icon">{m.icon}</span>
                    <span className="ce-method-label">{m.label}</span>
                    <span className="ce-method-detail">{m.detail}</span>
                    {paymentMethod === m.value && <span className="ce-method-check">✓</span>}
                  </button>
                ))}
              </div>

              {/* Method-specific fields */}
              {paymentMethod === 'mobile_money' && (
                <div className="ce-payment-fields">
                  <label className="login-field">
                    <span>Network</span>
                    <select
                      value={mobileNetwork}
                      onChange={(e) => setMobileNetwork(e.target.value)}
                    >
                      <option>MTN</option>
                      <option>Airtel</option>
                      <option>Zamtel</option>
                    </select>
                  </label>
                  <label className="login-field">
                    <span>Mobile number</span>
                    <div className="phone-input-group">
                      <span className="phone-input-prefix">{ZAMBIA_PHONE_PREFIX}</span>
                      <input
                        type="tel"
                        inputMode="tel"
                        placeholder={t('phoneLocalPlaceholder')}
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(sanitizePhoneInput(e.target.value))}
                        maxLength={12}
                      />
                    </div>
                  </label>
                  <div className="ce-field-hint">
                    A USSD push prompt will appear on {mobileNetwork} in a real integration.
                  </div>
                </div>
              )}

              {paymentMethod === 'card' && (
                <div className="ce-payment-fields">
                  {/* Visual card preview */}
                  <div className="ce-card-preview">
                    <div className="ce-card-preview-chip">💳</div>
                    <div className="ce-card-preview-number">
                      {cardNumber || '•••• •••• •••• ••••'}
                    </div>
                    <div className="ce-card-preview-bottom">
                      <span>{cardName || 'CARDHOLDER NAME'}</span>
                      <span>{cardExpiry || 'MM/YY'}</span>
                    </div>
                  </div>

                  <label className="login-field">
                    <span>Cardholder name</span>
                    <input
                      type="text"
                      placeholder="As on card"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value.toUpperCase())}
                    />
                  </label>
                  <label className="login-field">
                    <span>Card number</span>
                    <input
                      type="text"
                      placeholder="0000 0000 0000 0000"
                      value={cardNumber}
                      onChange={(e) => handleCardNumber(e.target.value)}
                      inputMode="numeric"
                    />
                  </label>
                  <div className="ce-card-row">
                    <label className="login-field">
                      <span>Expiry</span>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) => handleExpiry(e.target.value)}
                        inputMode="numeric"
                      />
                    </label>
                    <label className="login-field">
                      <span>CVV</span>
                      <input
                        type="password"
                        placeholder="•••"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        inputMode="numeric"
                      />
                    </label>
                  </div>
                  <div className="ce-field-hint">🔒 Demo only — no real card data is stored.</div>
                </div>
              )}

              {paymentMethod === 'voucher' && (
                <div className="ce-payment-fields">
                  <label className="login-field">
                    <span>Voucher code</span>
                    <input
                      type="text"
                      placeholder="e.g. ZETRC-SPONSOR-2025"
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                    />
                  </label>
                  <div className="ce-field-hint">
                    Enter the code provided by your sponsoring organisation.
                  </div>
                </div>
              )}

              <div className="ce-payment-actions">
                <button
                  type="button"
                  className="ce-back-btn"
                  onClick={() => { setStep('course'); setErrorMessage(null); }}
                >
                  ← Edit course
                </button>
                <button
                  type="button"
                  className="btn-hero-teal ce-pay-btn"
                  onClick={handlePaymentSubmit}
                >
                  Pay {formatKwacha(totalDue)}
                </button>
              </div>

              <div className="ce-sim-notice">
                🧪 Simulation mode — this flow is for testing only
              </div>
            </div>
          )}

          {/* ── STEP: PROCESSING ── */}
          {step === 'processing' && (
            <div className="ce-processing">
              <div className="ce-processing-ring">
                <svg viewBox="0 0 64 64" fill="none">
                  <circle cx="32" cy="32" r="28" stroke="rgba(217,165,31,0.15)" strokeWidth="4" />
                  <circle
                    cx="32" cy="32" r="28"
                    stroke="#d9a51f" strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray="60 116"
                    className="ce-spinner-arc"
                  />
                </svg>
                <span className="ce-processing-icon">
                  {paymentMethod === 'mobile_money' ? '📱' : paymentMethod === 'card' ? '💳' : '🎟️'}
                </span>
              </div>

              <h3>Processing payment{'.'.repeat(processingDots)}</h3>
              <p>
                {paymentMethod === 'mobile_money'
                  ? `Awaiting ${mobileNetwork} confirmation on ${normalizeZambiaPhone(mobileNumber) || 'your number'}`
                  : paymentMethod === 'card'
                  ? 'Verifying card details with issuing bank'
                  : 'Validating sponsor voucher code'}
              </p>

              <div className="ce-processing-steps">
                {['Verifying identity', 'Processing payment', 'Activating dashboard'].map((s, i) => (
                  <div key={s} className={`ce-proc-step${processingDots > i ? ' ce-proc-step--done' : ''}`}>
                    <span>{processingDots > i ? '✓' : `${i + 1}`}</span>
                    {s}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP: RECEIPT ── */}
          {step === 'receipt' && (
            <div className="ce-receipt">
              <div className="ce-receipt-badge">✓</div>
              <h3>Payment confirmed!</h3>
              <p>Your learner dashboard is now active. Welcome to ZETRC.</p>

              <div className="ce-receipt-details">
                <div className="ce-receipt-row">
                  <span>Course</span>
                  <strong>{selectedCourse?.name}</strong>
                </div>
                <div className="ce-receipt-row">
                  <span>Duration</span>
                  <strong>{selectedCourse?.duration ?? 'Flexible'}</strong>
                </div>
                <div className="ce-receipt-row">
                  <span>Amount paid</span>
                  <strong>{formatKwacha(totalDue)}</strong>
                </div>
                <div className="ce-receipt-row">
                  <span>Method</span>
                  <strong>
                    {PAYMENT_METHODS.find((m) => m.value === paymentMethod)?.label}
                  </strong>
                </div>
                <div className="ce-receipt-row">
                  <span>Reference</span>
                  <strong className="ce-receipt-ref">{paymentReference}</strong>
                </div>
                <div className="ce-receipt-row">
                  <span>Status</span>
                  <strong className="ce-receipt-status">✓ Paid (Simulated)</strong>
                </div>
              </div>

              <button
                type="button"
                className="btn-hero-teal login-submit"
                style={{ marginTop: '1.5rem' }}
                onClick={() => onEnrollmentComplete(selectedCourse!, description, {})}
              >
                Go to my dashboard →
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default CourseEnrollment;