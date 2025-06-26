// SwipeSite Service Worker

const CACHE_NAME = 'swipesite-v1';
const STATIC_CACHE_NAME = 'swipesite-static-v1';
const DYNAMIC_CACHE_NAME = 'swipesite-dynamic-v1';

// Files to cache on install
const STATIC_FILES = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/app.js',
    '/manifest.json',
    '/offline.html'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE_NAME)
            .then(cache => {
                console.log('Caching static assets');
                return cache.addAll(STATIC_FILES);
            })
            .catch(err => {
                console.error('Failed to cache static assets:', err);
            })
    );
    
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');
    
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(cacheName => cacheName.startsWith('swipesite-'))
                    .filter(cacheName => cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME)
                    .map(cacheName => caches.delete(cacheName))
            );
        })
    );
    
    self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Handle API requests differently
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(networkFirst(request));
        return;
    }
    
    // Handle video requests with network-first strategy
    if (request.url.includes('.mp4') || request.url.includes('video')) {
        event.respondWith(networkFirst(request));
        return;
    }
    
    // For everything else, use cache-first strategy
    event.respondWith(cacheFirst(request));
});

// Cache-first strategy
async function cacheFirst(request) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }
    
    try {
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(DYNAMIC_CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('Fetch failed:', error);
        
        // Return offline page for navigation requests
        if (request.destination === 'document') {
            return caches.match('/offline.html');
        }
        
        // Return a fallback response for other requests
        return new Response('Offline', { status: 503 });
    }
}

// Network-first strategy
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(DYNAMIC_CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('Network request failed:', error);
        
        // Try to return cached response
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return error response
        return new Response(JSON.stringify({ error: 'Offline' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// Background sync for offline video uploads
self.addEventListener('sync', (event) => {
    if (event.tag === 'upload-video') {
        event.waitUntil(uploadPendingVideos());
    }
});

async function uploadPendingVideos() {
    // TODO: Implement background sync for video uploads
    console.log('Syncing pending video uploads...');
}

// Push notifications
self.addEventListener('push', (event) => {
    const options = {
        body: event.data ? event.data.text() : 'New content available!',
        icon: '/icon-192.png',
        badge: '/icon-badge.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        }
    };
    
    event.waitUntil(
        self.registration.showNotification('SwipeSite', options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    event.waitUntil(
        clients.openWindow('/')
    );
});