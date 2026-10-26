export type PageKey =
  | 'home'
  | 'about'
  | 'impact'
  | 'team'
  | 'services'
  | 'articles'
  | 'partners'
  | 'contact'
  | 'training'
  | 'login'
  | 'register'
  | 'course-enrollment'
  | 'dashboard'
  | 'admin-login'
  | 'admin-dashboard'
  | 'lecturer-login'
  | 'lecturer-dashboard'
  | 'certificate';

export const PUBLIC_PAGES: PageKey[] = [
  'home',
  'about',
  'impact',
  'team',
  'services',
  'articles',
  'partners',
  'contact',
];

export const pageHashMap: Record<PageKey, string> = {
  home: '',
  about: '#about',
  impact: '#impact',
  team: '#team',
  services: '#services',
  articles: '#articles',
  partners: '#partners',
  contact: '#contact',
  training: '#training',
  login: '#login',
  register: '#register',
  'course-enrollment': '#course-enrollment',
  dashboard: '#dashboard',
  'admin-login': '#admin-login',
  'admin-dashboard': '#admin-dashboard',
  'lecturer-login': '#lecturer-login',
  'lecturer-dashboard': '#lecturer-dashboard',
  certificate: '#certificate',
};

export function getPageFromHash(hash: string): PageKey {
  // "#certificate/ZET-XXXX" carries a code after the page name.
  switch (hash.replace('#', '').split('/')[0].toLowerCase()) {
    case 'about':
      return 'about';
    case 'impact':
      return 'impact';
    case 'team':
      return 'team';
    case 'services':
      return 'services';
    case 'articles':
    case 'news':
    case 'news-feeds':
      return 'articles';
    case 'partners':
      return 'partners';
    case 'contact':
      return 'contact';
    case 'training':
      return 'register';
    case 'login':
      return 'login';
    case 'register':
      return 'register';
    case 'course-enrollment':
      return 'course-enrollment';
    case 'dashboard':
      return 'dashboard';
    case 'admin-login':
      return 'admin-login';
    case 'admin-dashboard':
      return 'admin-dashboard';
    case 'lecturer':
    case 'lecturer-login':
      return 'lecturer-login';
    case 'lecturer-dashboard':
      return 'lecturer-dashboard';
    case 'certificate':
    case 'verify':
      return 'certificate';
    default:
      return 'home';
  }
}

export function getPageUrl(page: PageKey): string {
  return `${window.location.pathname}${window.location.search}${pageHashMap[page]}`;
}
