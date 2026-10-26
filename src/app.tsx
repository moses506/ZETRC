import { useCallback, useEffect, useRef, useState } from 'react';
import RootLayout from './layout/RootLayout';
import Home from './pages/Home';
import About from './pages/About';
import Impact from './pages/Impact';
import Team from './pages/Team';
import Services from './pages/Services';
import Articles from './pages/Articles';
import Partners from './pages/Partners';
import Contact from './pages/Contact';
import Dashboard from './pages/dasboard';
import Login from './pages/Login';
import Register from './pages/Register';
import CourseEnrollment from './pages/CourseEnrollment';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import LecturerDashboard from './pages/lecturer/LecturerDashboard';
import CertificatePage from './pages/CertificatePage';
import {
  clearStoredLearnerData,
  getStoredLearnerEnrollment,
  getStoredLearnerProfile,
  hasStoredLearnerSession,
  clearStoredAdminData,
  getStoredAdminProfile,
  hasStoredAdminSession,
  promoteLearnerSessionToStaff,
  hasStoredLecturerSession,
  getStoredLecturerProfile,
  clearStoredLecturerData,
  type LearnerEnrollment,
  type LearnerProfile,
} from './utils/auth';
import type { Course } from './utils/api';
import { useLanguage } from './i18n/LanguageContext';
import {
  getPageFromHash,
  getPageUrl,
  pageHashMap,
  PUBLIC_PAGES,
  type PageKey,
} from './types/pages';

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
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => hasStoredAdminSession());
  const [adminProfile, setAdminProfile] = useState(() => getStoredAdminProfile());
  const [isLecturerAuthenticated, setIsLecturerAuthenticated] = useState(() => hasStoredLecturerSession());
  const [lecturerProfile, setLecturerProfile] = useState(() => getStoredLecturerProfile());
  const pageRef = useRef(page);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  useEffect(() => {
    const syncPageWithHash = () => {
      const nextPage = getPageFromHash(window.location.hash);
      const hasSession = hasStoredLearnerSession();

      const isAdminPage = [
        'admin-login',
        'admin-dashboard',
        'lecturer-login',
        'lecturer-dashboard',
        'certificate',
      ].includes(nextPage);

      if (pageRef.current === 'dashboard' && hasSession && nextPage !== 'dashboard' && !isAdminPage) {
        window.history.pushState(null, '', getPageUrl('dashboard'));
        setPage('dashboard');
        return;
      }

      setIsAuthenticated(hasSession);
      setLearnerProfile(getStoredLearnerProfile());
      setLearnerEnrollment(getStoredLearnerEnrollment());
      setIsAdminAuthenticated(hasStoredAdminSession());
      setAdminProfile(getStoredAdminProfile());
      setIsLecturerAuthenticated(hasStoredLecturerSession());
      setLecturerProfile(getStoredLecturerProfile());
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleJoinPilot = () => navigateToPage('register');
  const handleGoHome = () => navigateToPage('home');
  const handleGoAbout = () => navigateToPage('about');
  const handleGoImpact = () => navigateToPage('impact');
  const handleGoTeam = () => navigateToPage('team');
  const handleGoServices = () => navigateToPage('services');
  const handleGoArticles = () => navigateToPage('articles');
  const handleGoPartners = () => navigateToPage('partners');
  const handleGoContact = () => navigateToPage('contact');

  const handleLogin = () => {
    const staffScope = promoteLearnerSessionToStaff();
    if (staffScope) {
      setIsAuthenticated(false);
      setLearnerEnrollment(null);
      setAuthNotice(null);

      if (staffScope === 'admin') {
        setAdminProfile(getStoredAdminProfile());
        setIsAdminAuthenticated(true);
        navigateToPage('admin-dashboard', true);
      } else {
        setLecturerProfile(getStoredLecturerProfile());
        setIsLecturerAuthenticated(true);
        navigateToPage('lecturer-dashboard', true);
      }
      return;
    }

    setLearnerProfile(getStoredLearnerProfile());
    setIsAuthenticated(hasStoredLearnerSession());
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
    navigateToPage('contact');
  };

  const handleAdminLogin = () => {
    setAdminProfile(getStoredAdminProfile());
    setIsAdminAuthenticated(hasStoredAdminSession());
    navigateToPage('admin-dashboard', true);
  };

  const handleLecturerLogin = () => {
    setLecturerProfile(getStoredLecturerProfile());
    setIsLecturerAuthenticated(hasStoredLecturerSession());
    navigateToPage('lecturer-dashboard', true);
  };

  const handleLecturerLogout = () => {
    clearStoredLecturerData();
    setIsLecturerAuthenticated(false);
    setLecturerProfile(getStoredLecturerProfile());
    navigateToPage('home', true);
  };

  const handleAdminLogout = () => {
    clearStoredAdminData();
    setIsAdminAuthenticated(false);
    setAdminProfile(getStoredAdminProfile());
    navigateToPage('home', true);
  };

  return (
    <RootLayout
      currentPage={page}
      showChrome={PUBLIC_PAGES.includes(page)}
      onJoinPilot={handleJoinPilot}
      onGoLogin={() => handleGoLogin()}
      onGoHome={handleGoHome}
      onGoAbout={handleGoAbout}
      onGoImpact={handleGoImpact}
      onGoTeam={handleGoTeam}
      onGoServices={handleGoServices}
      onGoArticles={handleGoArticles}
      onGoPartners={handleGoPartners}
      onGoContact={handleGoContact}
      onRequestProposal={handleRequestProposal}
    >
      {page === 'home' && (
        <Home onJoinPilot={handleJoinPilot} onRequestProposal={handleRequestProposal} />
      )}
      {page === 'about' && <About />}
      {page === 'impact' && <Impact />}
      {page === 'team' && <Team />}
      {page === 'services' && (
        <Services onJoinTraining={handleJoinPilot} />
      )}
      {page === 'articles' && <Articles />}
      {page === 'partners' && <Partners />}
      {page === 'contact' && <Contact />}
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
      {page === 'admin-login' && !isAdminAuthenticated && (
        <AdminLogin onBackHome={handleGoHome} onLogin={handleAdminLogin} />
      )}
      {page === 'admin-login' && isAdminAuthenticated && (
        <AdminDashboard adminProfile={adminProfile} onLogout={handleAdminLogout} />
      )}
      {page === 'admin-dashboard' && isAdminAuthenticated && (
        <AdminDashboard adminProfile={adminProfile} onLogout={handleAdminLogout} />
      )}
      {page === 'admin-dashboard' && !isAdminAuthenticated && (
        <AdminLogin onBackHome={handleGoHome} onLogin={handleAdminLogin} />
      )}
      {page === 'certificate' && <CertificatePage onBackHome={handleGoHome} />}
      {(page === 'lecturer-login' || page === 'lecturer-dashboard') && isLecturerAuthenticated && (
        <LecturerDashboard profile={lecturerProfile} onLogout={handleLecturerLogout} />
      )}
      {(page === 'lecturer-login' || page === 'lecturer-dashboard') && !isLecturerAuthenticated && (
        <AdminLogin variant="lecturer" onBackHome={handleGoHome} onLogin={handleLecturerLogin} />
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
