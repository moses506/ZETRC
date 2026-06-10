import { FormEvent, useEffect, useState } from 'react';
import {
  fetchCourses,
  submitEnrollment,
  type Course,
} from '../utils/api';
import type { LearnerProfile } from '../utils/auth';

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
          error instanceof Error ? error.message : 'Unable to load courses right now.',
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
      setErrorMessage('Please select a course before continuing.');
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
          : 'Unable to submit your enrollment right now.',
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
            ← Back to sign in
          </button>

          <span className="hero-badge">
            <span className="badge-dot" />
            First-Time Enrollment
          </span>

          <h1 className="login-title">
            Choose your
            <span className="hero-accent"> learning course</span>
          </h1>

          <p className="login-copy">
            Welcome, {learnerProfile.firstName || 'Learner'}. Before entering your dashboard,
            select the course you want to enroll in so we can prepare your training path.
          </p>

          <div className="login-feature-panel glass-card">
            <div className="login-panel-header">
              <span className="card-tag">Enrollment details</span>
              <span className="login-status">Required</span>
            </div>

            <div className="login-trust-list">
              <div className="login-trust-item">
                <span className="login-check">✓</span>
                <span>Your name and email will be used from your learner account.</span>
              </div>
              <div className="login-trust-item">
                <span className="login-check">✓</span>
                <span>You only need to do this once before accessing the dashboard.</span>
              </div>
              <div className="login-trust-item">
                <span className="login-check">✓</span>
                <span>You can tell us what you hope to learn in the short note below.</span>
              </div>
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
                <span className="brand-sub">Training + Research</span>
              </div>
            </div>

            <div className="login-kicker">Enroll</div>
          </div>

          <div className="login-card-copy">
            <h2>Complete course enrollment</h2>
            <p>Pick a course to unlock your learner dashboard and training resources.</p>
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
                <span className="course-summary-label">Learner</span>
                <strong>{learnerProfile.fullName}</strong>
              </div>
              <div>
                <span className="course-summary-label">Email</span>
                <strong>{learnerProfile.email || 'No email provided'}</strong>
              </div>
            </div>

            <label className="login-field">
              <span>Select course</span>
              <select
                value={selectedCourseName}
                onChange={(event) => setSelectedCourseName(event.target.value)}
                disabled={isLoadingCourses || isSubmitting || courses.length === 0}
                required
              >
                {isLoadingCourses ? (
                  <option value="">Loading courses...</option>
                ) : courses.length === 0 ? (
                  <option value="">No courses available</option>
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
                  <span className="card-tag">Selected course</span>
                  {selectedCourse.duration ? (
                    <span className="course-duration-pill">{selectedCourse.duration}</span>
                  ) : null}
                </div>
                <h3>{selectedCourse.name}</h3>
                <p>{selectedCourse.description || 'No course description is available yet.'}</p>
              </div>
            ) : null}

            <label className="login-field">
              <span>Why are you interested in this course?</span>
              <textarea
                className="login-textarea"
                rows={5}
                placeholder="Share what you want to learn or the outcomes you want from this course."
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
              {isSubmitting ? 'Submitting enrollment...' : 'Enroll and Continue →'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

export default CourseEnrollment;
