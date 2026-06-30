import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  fetchCourses,
  submitEnrollment,
  type Course,
} from '../utils/api';
import type { LearnerProfile } from '../utils/auth';
import { useLanguage } from '../i18n/LanguageContext';
import { normalizeZambiaPhone, sanitizePhoneInput, ZAMBIA_PHONE_PREFIX } from '../utils/phone';
import '../styles/auth.css';
import '../styles/course-enrollment.css';

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

const STEPS = ['course', 'payment', 'receipt'] as const;

function CourseEnrollment({
  learnerProfile,
  onEnrollmentComplete,
  onBackToLogin,
}: CourseEnrollmentProps) {
  const { t, tList } = useLanguage();

  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseName, setSelectedCourseName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
  }, [t]);

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

  const handleCardNumber = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 16);
    setCardNumber(digits.replace(/(.{4})/g, '$1 ').trim());
  };

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

  const stepKicker = step === 'course'
    ? t('enroll')
    : step === 'payment'
    ? 'Payment'
    : step === 'processing'
    ? 'Processing'
    : 'Confirmed';

  const currentStepNum = stepMeta[step].num;

  return (
    <section className="auth-page ce-page">
      <div className="ce-layout">
        <aside className="auth-aside">
          <button type="button" className="auth-back-link" onClick={onBackToLogin}>
            {t('backSignIn')}
          </button>

          <span className="auth-eyebrow">
            <span className="auth-eyebrow-dot" aria-hidden="true" />
            {t('firstTimeEnrollment')}
          </span>

          <h1 className="auth-title">{t('chooseCourse')}</h1>
          <p className="auth-copy">
            {t('welcomeLearner')}, {learnerProfile.firstName || t('learnerFallback')}. {t('courseIntro')}
          </p>

          <ul className="auth-highlights">
            {tList('enrollmentPoints').map((point) => (
              <li className="auth-highlight" key={point}>
                <span className="auth-highlight-mark" aria-hidden="true">✓</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </aside>

        <div className="auth-card ce-card">
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
                <span className="brand-sub">{t('brandSub')}</span>
              </div>
            </div>
            <span className="auth-kicker">{stepKicker}</span>
          </header>

          <nav className="ce-steps" aria-label="Enrollment progress">
            {STEPS.map((s, i) => {
              const done = currentStepNum > i + 1;
              const active = currentStepNum === i + 1 || (s === 'receipt' && step === 'processing');
              const labels = { course: 'Choose course', payment: 'Payment', receipt: 'Confirmed' };
              return (
                <div
                  key={s}
                  className={`ce-step${active ? ' ce-step--active' : ''}${done ? ' ce-step--done' : ''}`}
                >
                  <div className="ce-step-dot">{done ? '✓' : i + 1}</div>
                  <span className="ce-step-label">{labels[s]}</span>
                </div>
              );
            })}
          </nav>

          {step === 'course' && (
            <form className="auth-form" onSubmit={handleCourseSubmit}>
              <div className="auth-card-intro">
                <h2>{t('completeEnrollment')}</h2>
                <p>{t('pickCourse')}</p>
              </div>

              {errorMessage && (
                <div className="auth-feedback auth-feedback-error" role="alert">{errorMessage}</div>
              )}

              <div className="ce-learner-strip">
                <div>
                  <span className="ce-learner-label">{t('learner')}</span>
                  <strong>{learnerProfile.fullName}</strong>
                </div>
                <div>
                  <span className="ce-learner-label">{t('email')}</span>
                  <strong>{learnerProfile.email || t('noEmail')}</strong>
                </div>
              </div>

              <div className="ce-section-head">
                <span>{t('selectCourse')}</span>
                {!isLoadingCourses && courses.length > 0 && (
                  <span className="ce-course-count">{courses.length} available</span>
                )}
              </div>

              {isLoadingCourses ? (
                <div className="ce-loading-grid">
                  {[1, 2, 3, 4].map((n) => <div key={n} className="ce-course-skeleton" />)}
                </div>
              ) : courses.length === 0 ? (
                <div className="ce-empty">
                  <span className="ce-empty-icon" aria-hidden="true">📭</span>
                  <p>{t('noCourses')}</p>
                </div>
              ) : (
                <div className="ce-courses-grid" role="listbox" aria-label={t('selectCourse')}>
                  {courses.map((course) => {
                    const isSelected = course.name === selectedCourseName;
                    const fee = getCourseFee(course);
                    return (
                      <button
                        key={course.name}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        className={`ce-course-card${isSelected ? ' ce-course-card--selected' : ''}`}
                        onClick={() => setSelectedCourseName(course.name)}
                      >
                        <div className="ce-course-card-top">
                          <span className="ce-course-icon" aria-hidden="true">{getCourseIcon(course.name)}</span>
                          {course.duration && (
                            <span className="ce-duration-pill">{course.duration}</span>
                          )}
                          {isSelected && <span className="ce-selected-check" aria-hidden="true">✓</span>}
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

              <label className="auth-field">
                <span>{t('courseInterest')}</span>
                <textarea
                  rows={3}
                  placeholder={t('courseInterestPlaceholder')}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </label>

              <button
                type="submit"
                className="auth-submit"
                disabled={isLoadingCourses || !selectedCourse}
              >
                Continue to payment →
              </button>
            </form>
          )}

          {step === 'payment' && (
            <div className="auth-form">
              <div className="auth-card-intro">
                <h2>Payment simulation</h2>
                <p>No real money is charged — this simulates the payment flow.</p>
              </div>

              {errorMessage && (
                <div className="auth-feedback auth-feedback-error" role="alert">{errorMessage}</div>
              )}

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

              <div className="ce-method-grid" role="radiogroup" aria-label="Payment method">
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    role="radio"
                    aria-checked={paymentMethod === m.value}
                    className={`ce-method-btn${paymentMethod === m.value ? ' ce-method-btn--active' : ''}`}
                    onClick={() => setPaymentMethod(m.value)}
                  >
                    <span className="ce-method-icon" aria-hidden="true">{m.icon}</span>
                    <span className="ce-method-label">{m.label}</span>
                    <span className="ce-method-detail">{m.detail}</span>
                    {paymentMethod === m.value && <span className="ce-method-check" aria-hidden="true">✓</span>}
                  </button>
                ))}
              </div>

              {paymentMethod === 'mobile_money' && (
                <div className="ce-payment-fields">
                  <label className="auth-field">
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
                  <label className="auth-field">
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
                  <div className="ce-card-preview">
                    <div className="ce-card-preview-chip" aria-hidden="true">💳</div>
                    <div className="ce-card-preview-number">
                      {cardNumber || '•••• •••• •••• ••••'}
                    </div>
                    <div className="ce-card-preview-bottom">
                      <span>{cardName || 'CARDHOLDER NAME'}</span>
                      <span>{cardExpiry || 'MM/YY'}</span>
                    </div>
                  </div>

                  <label className="auth-field">
                    <span>Cardholder name</span>
                    <input
                      type="text"
                      placeholder="As on card"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value.toUpperCase())}
                    />
                  </label>
                  <label className="auth-field">
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
                    <label className="auth-field">
                      <span>Expiry</span>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) => handleExpiry(e.target.value)}
                        inputMode="numeric"
                      />
                    </label>
                    <label className="auth-field">
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
                  <div className="ce-field-hint">Demo only — no real card data is stored.</div>
                </div>
              )}

              {paymentMethod === 'voucher' && (
                <div className="ce-payment-fields">
                  <label className="auth-field">
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
                  className="auth-submit ce-pay-btn"
                  onClick={handlePaymentSubmit}
                >
                  Pay {formatKwacha(totalDue)}
                </button>
              </div>

              <div className="ce-sim-notice">
                Simulation mode — this flow is for testing only
              </div>
            </div>
          )}

          {step === 'processing' && (
            <div className="ce-processing">
              <div className="ce-processing-ring">
                <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
                  <circle cx="32" cy="32" r="28" stroke="rgba(6,67,31,0.12)" strokeWidth="4" />
                  <circle
                    cx="32" cy="32" r="28"
                    stroke="#d9a51f" strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray="60 116"
                    className="ce-spinner-arc"
                  />
                </svg>
                <span className="ce-processing-icon" aria-hidden="true">
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

          {step === 'receipt' && (
            <div className="ce-receipt">
              <div className="ce-receipt-badge" aria-hidden="true">✓</div>
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
                  <strong className="ce-receipt-status">Paid (Simulated)</strong>
                </div>
              </div>

              <button
                type="button"
                className="auth-submit"
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
