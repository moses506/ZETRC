import { useCallback, useEffect, useRef, useState } from 'react';
import RootLayout from './layout/RootLayout';
import Home from './pages/Home';
import Training from './pages/Training';
import Dashboard from './pages/dasboard';
import Login from './pages/Login';
import Register from './pages/Register';
import CourseEnrollment from './pages/CourseEnrollment';
import {
  clearStoredLearnerData,
  getStoredLearnerEnrollment,
  getStoredLearnerProfile,
  hasStoredLearnerSession,
  type LearnerEnrollment,
  type LearnerProfile,
} from './utils/auth';
import type { Course } from './utils/api';
import { useLanguage } from './i18n/LanguageContext';

type PageKey = 'home' | 'training' | 'login' | 'register' | 'course-enrollment' | 'dashboard';

const pageHashMap: Record<PageKey, string> = {
  home: '',
  training: '#training',
  login: '#login',
  register: '#register',
  'course-enrollment': '#course-enrollment',
  dashboard: '#dashboard',
};

function getPageFromHash(hash: string): PageKey {
  switch (hash.replace('#', '').toLowerCase()) {
    case 'training':
      return 'training';
    case 'login':
      return 'login';
    case 'register':
      return 'register';
    case 'course-enrollment':
      return 'course-enrollment';
    case 'dashboard':
      return 'dashboard';
    default:
      return 'home';
  }
}

function getPageUrl(page: PageKey): string {
  return `${window.location.pathname}${window.location.search}${pageHashMap[page]}`;
}

function App() {
  const { t } = useLanguage();
  const [page, setPage] = useState<PageKey>(() => getPageFromHash(window.location.hash));
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [learnerProfile, setLearnerProfile] = useState<LearnerProfile>(
    () => getStoredLearnerProfile(),
  );
  const [learnerEnrollment, setLearnerEnrollment] = useState<LearnerEnrollment | null>(
    () => getStoredLearnerEnrollment(),
  );
  const [isAuthenticated, setIsAuthenticated] = useState(() => hasStoredLearnerSession());
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const pageRef = useRef(page);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  useEffect(() => {
    const syncPageWithHash = () => {
      const nextPage = getPageFromHash(window.location.hash);
      const hasSession = hasStoredLearnerSession();

      if (pageRef.current === 'dashboard' && hasSession && nextPage !== 'dashboard') {
        window.history.pushState(null, '', getPageUrl('dashboard'));
        setPage('dashboard');
        return;
      }

      setIsAuthenticated(hasSession);
      setLearnerProfile(getStoredLearnerProfile());
      setLearnerEnrollment(getStoredLearnerEnrollment());
      setPage(nextPage);
    };

    window.addEventListener('hashchange', syncPageWithHash);
    window.addEventListener('popstate', syncPageWithHash);

    return () => {
      window.removeEventListener('hashchange', syncPageWithHash);
      window.removeEventListener('popstate', syncPageWithHash);
    };
  }, []);

  const navigateToPage = useCallback((nextPage: PageKey, replace = false) => {
    const nextHash = pageHashMap[nextPage];

    if (window.location.hash !== nextHash) {
      const nextUrl = getPageUrl(nextPage);

      if (replace) {
        window.history.replaceState(null, '', nextUrl);
      } else {
        window.history.pushState(null, '', nextUrl);
      }
    }

    setPage(nextPage);
  }, []);

  const handleJoinPilot = () => navigateToPage('training');
  const handleGoHome = () => navigateToPage('home');
  const handleGoTraining = () => navigateToPage('training');

  const handleLogin = () => {
    setLearnerProfile(getStoredLearnerProfile());
    setIsAuthenticated(hasStoredLearnerSession());
    // Always clear any stale enrollment from a previous session so
    // CourseEnrollment re-checks the backend for the newly logged-in user.
    setLearnerEnrollment(null);
    setAuthNotice(null);
    navigateToPage('course-enrollment', true);
  };

  const handleGoRegister = () => {
    setAuthNotice(null);
    navigateToPage('register');
  };

  const handleGoLogin = (notice?: string) => {
    setAuthNotice(typeof notice === 'string' ? notice : null);

    if (hasStoredLearnerSession()) {
      setIsAuthenticated(true);
      setLearnerProfile(getStoredLearnerProfile());
      setLearnerEnrollment(getStoredLearnerEnrollment());
      navigateToPage('dashboard', true);
      return;
    }

    navigateToPage('login');
  };

  const handleRegister = (notice?: string) => {
    setAuthNotice(notice ?? t('registerSuccess'));
    navigateToPage('login', true);
  };

  const handleLogout = () => {
    setIsLogoutConfirmOpen(true);
  };

  const handleCancelLogout = () => {
    setIsLogoutConfirmOpen(false);
  };

  const handleConfirmLogout = () => {
    clearStoredLearnerData();
    setIsLogoutConfirmOpen(false);
    setIsAuthenticated(false);
    setLearnerProfile(getStoredLearnerProfile());
    setLearnerEnrollment(null);
    navigateToPage('home', true);
  };

  // Called by CourseEnrollment when the API confirms the user is already enrolled.
  // We persist it to localStorage so the dashboard has something to read, then
  // skip the form entirely.
  const handleAlreadyEnrolled = (
    courseName: string,
    duration: string,
    description: string,
  ) => {
    const nextEnrollment: LearnerEnrollment = { courseName, duration, description };

    localStorage.setItem('zetrcEnrollment', JSON.stringify(nextEnrollment));

    setLearnerEnrollment(nextEnrollment);
    setIsAuthenticated(hasStoredLearnerSession());
    navigateToPage('dashboard', true);
  };

  // Called by CourseEnrollment after a successful new enrollment submission.
  const handleEnrollmentComplete = (
    course: Course,
    description: string,
    response: unknown,
  ) => {
    const nextEnrollment: LearnerEnrollment = {
      courseName: course.name,
      duration: course.duration,
      description,
    };

    localStorage.setItem(
      'zetrcEnrollment',
      JSON.stringify({
        courseName: nextEnrollment.courseName,
        duration: nextEnrollment.duration,
        description: nextEnrollment.description,
        response,
      }),
    );

    setLearnerEnrollment(nextEnrollment);
    setIsAuthenticated(hasStoredLearnerSession());
    navigateToPage('dashboard', true);
  };

  const handleRequestProposal = () => {
    navigateToPage('home');

    window.setTimeout(() => {
      const contactSection = document.getElementById('contact');
      contactSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  };

  return (
    <RootLayout
      currentPage={page}
      showChrome={page === 'home' || page === 'training'}
      onJoinPilot={handleJoinPilot}
      onGoHome={handleGoHome}
      onGoTraining={handleGoTraining}
      onRequestProposal={handleRequestProposal}
    >
      {page === 'home' && (
        <Home onJoinPilot={handleJoinPilot} onRequestProposal={handleRequestProposal} />
      )}
      {page === 'training' && (
        <Training onApplyNow={handleGoRegister} onSignIn={handleGoLogin} />
      )}
      {page === 'login' && !isAuthenticated && (
        <Login
          onBackHome={handleGoHome}
          onLogin={handleLogin}
          onGoRegister={handleGoRegister}
          notice={authNotice}
        />
      )}
      {page === 'login' && isAuthenticated && (
        <Dashboard
          learnerEnrollment={learnerEnrollment}
          learnerProfile={learnerProfile}
          onLogout={handleLogout}
          onRequestProposal={handleRequestProposal}
        />
      )}
      {page === 'register' && (
        <Register
          onBackHome={handleGoHome}
          onRegister={handleRegister}
          onGoLogin={handleGoLogin}
        />
      )}
      {page === 'course-enrollment' && (
        <CourseEnrollment
          learnerProfile={learnerProfile}
          onEnrollmentComplete={handleEnrollmentComplete}
          onAlreadyEnrolled={handleAlreadyEnrolled}
          onBackToLogin={handleGoLogin}
        />
      )}
      {page === 'dashboard' && (
        <Dashboard
          learnerEnrollment={learnerEnrollment}
          learnerProfile={learnerProfile}
          onLogout={handleLogout}
          onRequestProposal={handleRequestProposal}
        />
      )}
      {isLogoutConfirmOpen && (
        <div className="logout-confirm-backdrop" role="presentation">
          <div className="logout-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="logout-confirm-title">
            <p className="logout-confirm-kicker">Confirm logout</p>
            <h2 id="logout-confirm-title">Log out of your dashboard?</h2>
            <p>
              Your saved session will be cleared on this device. Browser Back will not log you out.
            </p>
            <div className="logout-confirm-actions">
              <button type="button" className="logout-confirm-cancel" onClick={handleCancelLogout}>
                Cancel
              </button>
              <button type="button" className="logout-confirm-danger" onClick={handleConfirmLogout}>
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </RootLayout>
  );
}

export default App;
