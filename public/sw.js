/* ZETRC service worker — offline support for learners in low-connectivity areas.
 *
 *  - App shell: the site loads offline after the first visit (production build).
 *  - Lesson files: PDFs and audio saved with "Save for offline" are served from cache.
 *  - Learner data: course content, results and notifications fall back to the last
 *    copy when the network is down.
 */
const SHELL_CACHE = 'zetrc-shell-v1';
const LESSON_CACHE = 'zetrc-lessons-v1';
const DATA_CACHE = 'zetrc-data-v1';
const SHELL_URLS = ['/', '/index.html', '/manifest.webmanifest', '/favicon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_URLS).catch(() => undefined))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  const keep = [SHELL_CACHE, LESSON_CACHE, DATA_CACHE];
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !keep.includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

/** Cache key without our "_=" cache-busting parameter. */
function normalized(request) {
  const url = new URL(request.url);
  url.searchParams.delete('_');
  return url.toString();
}

function isDevModule(url) {
  return url.pathname.startsWith('/@') || url.pathname.startsWith('/src/') || url.pathname.startsWith('/node_modules/');
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // Lesson files saved for offline (served cache-first).
  if (url.pathname.includes('/uploads/')) {
    event.respondWith(
      caches.open(LESSON_CACHE).then((cache) =>
        cache.match(url.toString(), { ignoreSearch: true }).then((hit) => hit || fetch(request)),
      ),
    );
    return;
  }

  // Learner data: network first, fall back to the last good copy.
  const isData =
    url.pathname.includes('/api/get-data') ||
    /\/portal\/(my-|quizzes|announcements|notifications|me$|discussions)/.test(url.pathname);
  if (isData) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(DATA_CACHE).then((cache) => cache.put(normalized(request), copy));
          }
          return response;
        })
        .catch(() =>
          caches.open(DATA_CACHE).then(
            (cache) =>
              cache.match(normalized(request)) ||
              new Response(JSON.stringify({ error: "You're offline and this hasn't been saved yet." }), {
                status: 503,
                headers: { 'Content-Type': 'application/json' },
              }),
          ),
        ),
    );
    return;
  }

  if (url.origin !== self.location.origin || isDevModule(url)) return;

  // Page navigations: network first, offline fallback to the cached app.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put('/index.html', copy));
          return response;
        })
        .catch(() => caches.match('/index.html').then((hit) => hit || caches.match('/'))),
    );
    return;
  }

  // Built assets (JS/CSS/images): serve from cache, refresh in the background.
  if (url.pathname.startsWith('/assets/') || SHELL_URLS.includes(url.pathname)) {
    event.respondWith(
      caches.open(SHELL_CACHE).then((cache) =>
        cache.match(request).then((hit) => {
          const network = fetch(request)
            .then((response) => {
              if (response.ok) cache.put(request, response.clone());
              return response;
            })
            .catch(() => hit);
          return hit || network;
        }),
      ),
    );
  }
});
