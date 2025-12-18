// GymTracker Pro - Service Worker
// Cambia questa versione ad ogni deploy per forzare l'aggiornamento
const CACHE_VERSION = 'v1.0.6';
const CACHE_NAME = `gymtracker-${CACHE_VERSION}`;

// File da cachare
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/app.js',
    '/js/modules/storage.js',
    '/js/modules/timer.js',
    '/js/modules/algorithm.js',
    '/js/modules/exerciseMedia.js',
    '/js/data/exercises.js',
    '/js/data/warmups.js',
    '/manifest.json'
];

// Installazione: cacha i file essenziali
self.addEventListener('install', (event) => {
    console.log(`[SW] Installazione ${CACHE_VERSION}`);

    // Forza l'attivazione immediata (non aspetta che le tab vengano chiuse)
    self.skipWaiting();

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching assets');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .catch((err) => {
                console.error('[SW] Errore caching:', err);
            })
    );
});

// Attivazione: elimina le cache vecchie
self.addEventListener('activate', (event) => {
    console.log(`[SW] Attivazione ${CACHE_VERSION}`);

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME && cacheName.startsWith('gymtracker-')) {
                        console.log(`[SW] Eliminazione cache vecchia: ${cacheName}`);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            // Prende il controllo di tutte le tab aperte immediatamente
            return self.clients.claim();
        }).then(() => {
            // Notifica tutte le tab che c'è un aggiornamento
            return self.clients.matchAll().then((clients) => {
                clients.forEach((client) => {
                    client.postMessage({
                        type: 'SW_UPDATED',
                        version: CACHE_VERSION
                    });
                });
            });
        })
    );
});

// Fetch: Network First per HTML/JS/CSS, Cache First per immagini/GIF
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Ignora richieste non-GET
    if (event.request.method !== 'GET') return;

    // Ignora richieste esterne (come le GIF da fitnessprogramer.com)
    if (!url.origin.includes(self.location.origin)) {
        // Per le GIF esterne, usa cache con fallback a network
        if (url.pathname.endsWith('.gif')) {
            event.respondWith(
                caches.match(event.request).then((cached) => {
                    if (cached) return cached;

                    return fetch(event.request).then((response) => {
                        // Cacha la GIF per uso futuro
                        if (response.ok) {
                            const responseClone = response.clone();
                            caches.open(CACHE_NAME).then((cache) => {
                                cache.put(event.request, responseClone);
                            });
                        }
                        return response;
                    }).catch(() => {
                        // Se offline, ritorna un placeholder
                        return new Response('', { status: 404 });
                    });
                })
            );
        }
        return;
    }

    // Per file dell'app: Network First (sempre aggiornato)
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Aggiorna la cache con la nuova versione
                if (response.ok) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => {
                // Se offline, usa la cache
                return caches.match(event.request);
            })
    );
});

// Gestione messaggi dalla pagina
self.addEventListener('message', (event) => {
    if (event.data === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
