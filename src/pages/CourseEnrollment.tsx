import { FormEvent, useEffect, useState } from 'react';
import {
  fetchCourses,
  submitEnrollment,
  type Course,
} from '../utils/api';
import type { LearnerProfile } from '../utils/auth';
import { useLanguage } from '../i18n/LanguageContext';

type CourseEnrollmentProps = {
  learnerProfile: LearnerProfile;
  onEnrollmentComplete: (course: Course, description: string, response: unknown) => void;
  onAlreadyEnrolled?: (courseName: string, duration: string, description: string) => void;
  onBackToLogin: () => void;
};

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadCourses = async () => {
      setIsLoadingCourses(true);
      setErrorMessage(null);

      try {
        const result = await fetchCourses();

        if (cancelled) return;

        setCourses(result);
        setSelectedCourseName(result[0]?.name ?? '');
      } catch (error) {
        if (cancelled) return;

        setErrorMessage(
          error instanceof Error ? error.message : t('unableCourses'),
        );
      } finally {
        if (!cancelled) {
          setIsLoadingCourses(false);
        }
      }
    };

    loadCourses();

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedCourse =
    courses.find((course) => course.name === selectedCourseName) ?? null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedCourse) {
      setErrorMessage(t('selectCourseError'));
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const response = await submitEnrollment({
        firstName: learnerProfile.firstName,
        lastName: learnerProfile.lastName,
        email: learnerProfile.email,
        description: description.trim(),
        course: selectedCourse,
      });

      onEnrollmentComplete(selectedCourse, description.trim(), response);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : t('unableEnroll'),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="login-page course-enrollment-page">
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      <div className="login-shell course-enrollment-shell">
        <div className="login-intro">
          <button className="login-back" onClick={onBackToLogin}>
            {t('backSignIn')}
          </button>

          <span className="hero-badge">
            <span className="badge-dot" />
            {t('firstTimeEnrollment')}
          </span>

          <h1 className="login-title">
            {t('chooseCourse')}
          </h1>

          <p className="login-copy">
            {t('welcomeLearner')}, {learnerProfile.firstName || t('learnerFallback')}. {t('courseIntro')}
          </p>

          <div className="login-feature-panel glass-card">
            <div className="login-panel-header">
              <span className="card-tag">{t('enrollmentDetails')}</span>
              <span className="login-status">{t('required')}</span>
            </div>

            <div className="login-trust-list">
              {tList('enrollmentPoints').map((point) => (
                <div className="login-trust-item" key={point}>
                  <span className="login-check">✓</span>
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="login-card glass-card course-enrollment-card">
          <div className="login-card-top">
            <div className="brand">
              <div className="brand-icon">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <rect width="22" height="22" rx="6" fill="#032b14" />
                  <path
                    d="M11 3 L19 11 L11 19 L3 11 Z"
                    stroke="#d9a51f"
                    strokeWidth="1.5"
                    fill="none"
                    strokeLinejoin="round"
                  />
                  <circle cx="11" cy="11" r="2.5" fill="#d9a51f" />
                </svg>
              </div>
              <div className="brand-text">
                <span className="brand-mark">ZETRC</span>
                <span className="brand-sub">{t('brandSub')}</span>
              </div>
            </div>

            <div className="login-kicker">{t('enroll')}</div>
          </div>

          <div className="login-card-copy">
            <h2>{t('completeEnrollment')}</h2>
            <p>{t('pickCourse')}</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            {errorMessage ? (
              <div
                className="auth-feedback auth-feedback-error"
                role="alert"
                aria-live="assertive"
              >
                {errorMessage}
              </div>
            ) : null}

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

            <label className="login-field">
              <span>{t('selectCourse')}</span>
              <select
                value={selectedCourseName}
                onChange={(event) => setSelectedCourseName(event.target.value)}
                disabled={isLoadingCourses || isSubmitting || courses.length === 0}
                required
              >
                {isLoadingCourses ? (
                  <option value="">{t('loadingCourses')}</option>
                ) : courses.length === 0 ? (
                  <option value="">{t('noCourses')}</option>
                ) : (
                  courses.map((course) => (
                    <option key={course.name} value={course.name}>
                      {course.name}
                    </option>
                  ))
                )}
              </select>
            </label>

            {selectedCourse ? (
              <div className="course-preview-card">
                <div className="course-preview-top">
                  <span className="card-tag">{t('selectedCourse')}</span>
                  {selectedCourse.duration ? (
                    <span className="course-duration-pill">{selectedCourse.duration}</span>
                  ) : null}
                </div>
                <h3>{selectedCourse.name}</h3>
                <p>{selectedCourse.description || t('noCourseDesc')}</p>
              </div>
            ) : null}

            <label className="login-field">
              <span>{t('courseInterest')}</span>
              <textarea
                className="login-textarea"
                rows={5}
                placeholder={t('courseInterestPlaceholder')}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                disabled={isSubmitting}
              />
            </label>

            <button
              type="submit"
              className="btn-hero-teal login-submit"
              disabled={isLoadingCourses || isSubmitting || !selectedCourse}
            >
              {isSubmitting ? t('submittingEnrollment') : t('enrollContinue')}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

export default CourseEnrollment;
