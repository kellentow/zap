import manifestData from './manifest.json';

const CACHE_NAME = 'my-cache-v1';
const FILES_TO_CACHE = [
    'https://cdn-icons-png.flaticon.com/512/1237/1237946.png',// add server image
    'https://cdn-icons-png.flaticon.com/512/3682/3682321.png',// send button image
    'https://cdn.quilljs.com/1.3.6/quill.snow.css',           //quill stuff for msg input
];
const BLOBS_TO_CACHE = {
    'manifest.json': new Response(JSON.stringify(manifestData), {
        headers: { 'Content-Type': 'application/json' }
    })
}

// Install event - cache files
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(FILES_TO_CACHE))
            .then(() => self.skipWaiting())
    );
    caches.open('my-image-cache').then(cache => {
        BLOBS_TO_CACHE.keys().forEach(key => {
            cache.put('/' + String(key), BLOBS_TO_CACHE[key]);
        });
    });
});

// Activate event - cleanup old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.map(key => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            )
        ).then(() => self.clients.claim())
    );
});

// Fetch event - respond with cache or network
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) return cachedResponse;
                return fetch(event.request);
            })
    );
});
