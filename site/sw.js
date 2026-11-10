const CACHE_NAME = 'patternlab-shell-v1';
const SHELL_FILES = [
  './',
  './index.html',
  './practice.html',
  './patterns.html',
  './progress.html',
  './cloud-setup.html',
  './styles.css',
  './app.js',
  './challenges.js',
  './challenges.json',
  './roadmap.js',
  './tutor-guides.js',
  './javascript-worker.js',
  './supabase-config.js?v=cloud-sync-setup',
  './manifest.webmanifest',
  './icons/patternlab.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(
    SHELL_FILES.map(path => new URL(path, self.registration.scope).href)
  )).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith('patternlab-shell-') && key !== CACHE_NAME)
      .map(key => caches.delete(key))
  )).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then(response => {
      if (response.ok) return caches.open(CACHE_NAME)
        .then(cache => cache.put(request, response.clone()))
        .then(() => response);
      return response;
    }).catch(async () => (await caches.match(request, { ignoreSearch: true }))
      || (await caches.match(new URL('./index.html', self.registration.scope).href))));
    return;
  }

  event.respondWith(caches.open(CACHE_NAME).then(async cache => {
    const cached = await cache.match(request);
    const refresh = fetch(request).then(response => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    }).catch(error => {
      if (cached) return cached;
      throw error;
    });
    return cached || refresh;
  }));
});
