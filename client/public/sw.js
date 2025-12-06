const CACHE_NAME = 'lifeos-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/favicon.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});

self.addEventListener('push', (event) => {
    const data = event.data.json();
    const options = {
        body: data.body,
        icon: '/favicon.png',
        badge: '/favicon.png'
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});
