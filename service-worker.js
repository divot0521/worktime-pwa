/**
 * Service Worker für die Arbeitszeiterfassung.
 * Strategie: Cache-First für alle statischen Assets.
 * Cache-Name beim Hinzufügen neuer Assets erhöhen (worktime-v1 → worktime-v2).
 */

const CACHE_NAME = 'worktime-v2';

/** Liste aller zu cachenden statischen Assets. */
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/app.css',
  '/css/print.css',
  '/js/storage.js',
  '/js/ui.js',
  '/js/app.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

/**
 * Install-Event: Alle Assets in den Cache laden.
 */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

/**
 * Activate-Event: Alte Cache-Versionen löschen.
 */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

/**
 * Fetch-Event: Cache-First – bei Cache-Miss Netzwerk verwenden.
 * @param {FetchEvent} event
 */
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request))
  );
});
