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
  | 'dashboard';

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
};

export function getPageFromHash(hash: string): PageKey {
  switch (hash.replace('#', '').toLowerCase()) {
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
    default:
      return 'home';
  }
}

export function getPageUrl(page: PageKey): string {
  return `${window.location.pathname}${window.location.search}${pageHashMap[page]}`;
}
