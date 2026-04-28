import { useEffect, useState } from 'react';
import RootLayout from './layout/RootLayout';
import Home from './pages/Home';
import Training from './pages/Training';
import Dashboard from './pages/dasboard';
import Login from './pages/Login';
import Register from './pages/Register';
import CourseEnrollment from './pages/CourseEnrollment';
import {
  getStoredLearnerEnrollment,
  getStoredLearnerProfile,
  type LearnerEnrollment,
  type LearnerProfile,
} from './utils/auth';
import type { Course } from './utils/api';

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

function App() {
  const [page, setPage] = useState<PageKey>(() => getPageFromHash(window.location.hash));
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [learnerProfile, setLearnerProfile] = useState<LearnerProfile>(() => getStoredLearnerProfile());
  const [learnerEnrollment, setLearnerEnrollment] = useState<LearnerEnrollment | null>(
    () => getStoredLearnerEnrollment(),
  );

  useEffect(() => {
    const syncPageWithHash = () => {
      setPage(getPageFromHash(window.location.hash));
    };

    window.addEventListener('hashchange', syncPageWithHash);

    return () => {
      window.removeEventListener('hashchange', syncPageWithHash);
    };
  }, []);

  useEffect(() => {
    const nextHash = pageHashMap[page];

    if (window.location.hash !== nextHash) {
      if (nextHash) {
        window.location.hash = nextHash;
      } else {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    }
  }, [page]);

  const handleJoinPilot = () => setPage('training');
  const handleGoHome = () => setPage('home');
  const handleGoTraining = () => setPage('training');
  const handleLogin = () => {
    setLearnerProfile(getStoredLearnerProfile());
    const savedEnrollment = getStoredLearnerEnrollment();
    setLearnerEnrollment(savedEnrollment);
    setAuthNotice(null);
    setPage(savedEnrollment ? 'dashboard' : 'course-enrollment');
  };
  const handleGoRegister = () => {
    setAuthNotice(null);
    setPage('register');
  };
  const handleGoLogin = (notice?: string) => {
    setAuthNotice(typeof notice === 'string' ? notice : null);
    setPage('login');
  };
  const handleRegister = (notice?: string) => {
    setAuthNotice(notice ?? 'Registration successful. Sign in to continue.');
    setPage('login');
  };
  const handleLogout = () => {
    localStorage.removeItem('zetrcAuthSession');
    localStorage.removeItem('zetrcRememberUser');
    setLearnerProfile(getStoredLearnerProfile());
    setLearnerEnrollment(getStoredLearnerEnrollment());
    setPage('home');
  };
  const handleEnrollmentComplete = (course: Course, description: string, response: unknown) => {
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
    setPage('dashboard');
  };
  const handleRequestProposal = () => {
    setPage('home');

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
      {page === 'home' && <Home onJoinPilot={handleJoinPilot} onRequestProposal={handleRequestProposal} />}
      {page === 'training' && (
        <Training onApplyNow={handleGoRegister} onSignIn={handleGoLogin} />
      )}
      {page === 'login' && (
        <Login
          onBackHome={handleGoHome}
          onLogin={handleLogin}
          onGoRegister={handleGoRegister}
          notice={authNotice}
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
    </RootLayout>
  );
}

export default App;
