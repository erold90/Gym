// GymTracker 2.0 - Service Worker
// Versione: si cambia SOLO con `scripts/versione.sh X.Y.Z` (aggiorna anche index.html, utils.js, main.js).
// CSS e JS hanno ?v=<versione> nell'URL: così una pagina nuova non può mai ricevere uno script
// vecchio da una cache precedente (R1-01: HTML v2 con storage.js v1.25 = seduta persa).
const APP_VERSION = '2.0.0';
const CACHE_VERSION = `v${APP_VERSION}`;
const CACHE_NAME = `gymtracker-${CACHE_VERSION}`;
const VERSIONED = /\.(?:js|css)$/;

// GIF degli esercizi: cache a parte che sopravvive agli aggiornamenti, con un tetto.
// fitnessprogramer.com e static.exercisedb.dev NON mandano Access-Control-Allow-Origin
// (verificato con curl il 15/10/2026): la risposta a un <img> è opaca (status 0, ok=false).
// Si mette in cache lo stesso, al massimo GIF_MAX voci, la più vecchia esce per prima.
const GIF_CACHE = 'gymtracker-gif';
// Tetto basso: Chromium conta ogni risposta opaca ~7 MB di quota (80 voci = ~500 MB, R1-19).
// 30 GIF coprono gli esercizi di una scheda intera.
const GIF_MAX = 30;

// File da cachare. Percorsi RELATIVI: il SW è registrato nella cartella dell'app
// (es. /Gym/sw.js), quindi questi risolvono a /Gym/... e l'app resta portabile —
// chi la forka la serve dal suo GitHub Pages senza toccare nulla.
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    // stile: token, base, guscio, componenti, pagine
    './css/tokens.css',
    './css/tokens-colors.css',
    './css/base.css',
    './css/layout.css',
    './css/components.css',
    './css/pages/oggi.css',
    './css/pages/onboarding.css',
    './css/pages/seduta.css',
    './css/pages/riepilogo.css',
    './css/pages/scheda.css',
    './css/pages/progressi.css',
    './css/pages/profilo.css',
    './css/pages/esercizi.css',
    './css/pages/conditioning.css',
    // font (Archivo, OFL) e licenza
    './fonts/Archivo-var-latin.woff2',
    './fonts/OFL.txt',
    // dati e moduli
    './js/modules/utils.js',
    './js/data/exercises.js',
    './js/data/warmups.js',
    './js/modules/storage.js',
    './js/modules/algorithm.js',
    './js/modules/timer.js',
    './js/modules/exerciseMedia.js',
    './js/modules/conditioningExercises.js',
    // app: core, aree, avvio
    './js/app/core.js',
    './js/app/oggi.js',
    './js/app/seduta.js',
    './js/app/scheda.js',
    './js/app/progressi.js',
    './js/app/profilo.js',
    './js/app/esercizi.js',
    './js/app/conditioning.js',
    './js/app/main.js',
    // installazione
    './manifest.json',
    './icons/icon.svg',
    './icons/icon-192.png',
    './icons/icon-512.png',
    './icons/icon-maskable-192.png',
    './icons/icon-maskable-512.png',
    './icons/apple-touch-icon.png'
].map((url) => (VERSIONED.test(url) ? `${url}?v=${APP_VERSION}` : url));

// Installazione: cacha i file essenziali.
// cache: 'reload' salta la cache HTTP del browser (GitHub Pages manda max-age=600),
// così la versione nuova non si porta dietro file vecchi.
self.addEventListener('install', (event) => {
    console.log(`[SW] Installazione ${CACHE_VERSION}`);

    // Forza l'attivazione immediata (non aspetta che le tab vengano chiuse)
    self.skipWaiting();

    event.waitUntil((async () => {
        const cache = await caches.open(CACHE_NAME);
        try {
            await cache.addAll(ASSETS_TO_CACHE.map((url) => new Request(url, { cache: 'reload' })));
        } catch (err) {
            // Mai ingoiare l'errore: un precache a metà = app offline rotta.
            // L'installazione fallisce, resta la versione precedente e il browser riprova.
            console.error(`[SW] Precache ${CACHE_VERSION} fallito, installazione annullata:`, err);
            throw err;
        }
    })());
});

// Attivazione: elimina le cache vecchie (non quella delle GIF)
self.addEventListener('activate', (event) => {
    console.log(`[SW] Attivazione ${CACHE_VERSION}`);

    event.waitUntil((async () => {
        const names = await caches.keys();
        await Promise.all(names
            .filter((name) => name.startsWith('gymtracker-') && name !== CACHE_NAME && name !== GIF_CACHE)
            .map((name) => {
                console.log(`[SW] Eliminazione cache vecchia: ${name}`);
                return caches.delete(name);
            }));

        // Prende il controllo di tutte le tab aperte immediatamente
        await self.clients.claim();

        // La pagina mostra il banner solo se era già controllata da un SW (aggiornamento vero)
        const clients = await self.clients.matchAll({ type: 'window' });
        clients.forEach((client) => client.postMessage({ type: 'SW_UPDATED', version: CACHE_VERSION }));
    })());
});

self.addEventListener('fetch', (event) => {
    const request = event.request;
    if (request.method !== 'GET') return;

    const url = new URL(request.url);

    if (url.origin !== self.location.origin) {
        // Esterni: solo le GIF degli esercizi passano dalla cache
        if (/\.gif$/i.test(url.pathname)) {
            event.respondWith(gifCacheFirst(event));
        }
        return;
    }

    // CSS e JS con ?v=: non cambiano mai a parità di URL → prima la cache, niente riscrittura
    if (url.searchParams.has('v') && VERSIONED.test(url.pathname)) {
        event.respondWith(versionedCacheFirst(event));
        return;
    }

    event.respondWith(staleWhileRevalidate(event));
});

async function versionedCacheFirst(event) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(event.request);
    if (cached) return cached;
    try {
        const response = await fetch(event.request);
        if (response.ok && response.type === 'basic') {
            event.waitUntil(cache.put(event.request, response.clone()).catch(() => {}));
        }
        return response;
    } catch (err) {
        return new Response('', { status: 504, statusText: 'Offline' });
    }
}

// File dell'app: la cache risponde SUBITO, la rete aggiorna la cache in background.
// Le versioni nuove arrivano col bump di CACHE_VERSION e col banner "Nuova versione".
async function staleWhileRevalidate(event) {
    const request = event.request;
    const cache = await caches.open(CACHE_NAME);
    const isPage = request.mode === 'navigate';

    // Una navigazione con ?query o #ancora deve comunque trovare l'app offline
    // Navigazioni: sempre la voce index.html (è quella che la rete tiene aggiornata)
    const cached = isPage
        ? (await cache.match('./index.html')) || (await cache.match(request, { ignoreSearch: true }))
        : await cache.match(request);

    const fromNetwork = fetch(request)
        .then((response) => {
            if (response.ok && response.type === 'basic') {
                const clone = response.clone();
                // Le navigazioni (anche con ?query) vivono tutte sotto index.html: una voce sola (R1-19)
                const key = isPage ? './index.html' : request;
                event.waitUntil(cache.put(key, clone).catch((err) => console.warn('[SW] cache.put', err)));
            }
            return response;
        })
        .catch(() => null);

    if (cached) {
        event.waitUntil(fromNetwork);
        return cached;
    }

    const response = await fromNetwork;
    return response || new Response('Offline', { status: 503, statusText: 'Offline', headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}

async function gifCacheFirst(event) {
    const request = event.request;
    const cache = await caches.open(GIF_CACHE);
    const cached = await cache.match(request);
    if (cached) return cached;

    try {
        const response = await fetch(request);
        // ok (risposta CORS) oppure opaca (<img> senza CORS): entrambe utilizzabili da <img>
        if (response.ok || response.type === 'opaque') {
            event.waitUntil(cache.put(request, response.clone())
                .then(() => trimCache(cache, GIF_MAX))
                .catch((err) => console.warn('[SW] GIF non salvata in cache:', err)));
        }
        return response;
    } catch (err) {
        // Offline e GIF mai vista: l'app mostra l'animazione SVG (onerror dell'<img>)
        return new Response('', { status: 504, statusText: 'Offline' });
    }
}

// FIFO: cache.keys() restituisce le voci in ordine di inserimento
async function trimCache(cache, max) {
    const keys = await cache.keys();
    for (let i = 0; i < keys.length - max; i++) {
        await cache.delete(keys[i]);
    }
}

// Tocco sulla notifica di fine recupero: riporta in primo piano l'app (o la apre)
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil((async () => {
        const scope = self.registration.scope;
        const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        const client = windows.find((c) => c.url.startsWith(scope));
        if (client) return client.focus();
        return self.clients.openWindow(scope);
    })());
});

// Gestione messaggi dalla pagina
self.addEventListener('message', (event) => {
    if (event.data === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
