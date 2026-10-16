/**
 * GymTracker 2.0 — core: crea l'oggetto App (stato condiviso), avvio, router a hash,
 * fogli (modali), avvisi, tema, utilità. Le aree aggiungono i loro metodi con Object.assign(App, {...})
 * nei file js/app/<area>.js; js/app/main.js avvia tutto su DOMContentLoaded.
 *
 * Convenzioni delle aree (il core le chiama se esistono, per nome):
 *   html<Pagina>()   markup statico della pagina, montato una volta in <section id="page-<pagina>">
 *   sheets<Area>()   markup dei fogli statici dell'area, montato una volta in #sheets
 *   bind<Area>()     listener dell'area, chiamato una volta dopo il montaggio
 *   enter<Pagina>()  chiamato dal router ogni volta che la pagina diventa visibile
 *   can<Pagina>()    false = la pagina non si può aprire adesso (il router va a Oggi)
 * Pagine: oggi scheda progressi profilo esercizi seduta riepilogo onboarding.
 * Aree:   Oggi Seduta Scheda Progressi Profilo Esercizi Conditioning.
 *
 * Dipendenze (caricate prima): GT (utils.js), EXERCISES_DB, Warmups, Storage,
 * TrainingAlgorithm, Timer, funzioni globali di exerciseMedia, conditioningExercises.
 * Ogni testo che viene da dati salvati/importati passa da GT.esc prima di finire in innerHTML.
 */

// eslint-disable-next-line no-unused-vars
const App = {
    currentPage: null,          // pagina visibile: la decide il router (hash dell'URL)
    activeWorkout: null,        // sessione in corso (salvata in Storage a ogni modifica)
    currentExerciseIndex: 0,
    charts: {},

    // Conditioning state
    conditioningState: {
        type: null,          // 'hiit' o 'liss'
        protocol: null,      // chiave di HIIT_PROTOCOLS
        lissActivity: null,  // chiave di LISS_ACTIVITIES
        exercises: [],       // id HIIT selezionati (senza doppioni)
        step: '1',
        startedAt: null,     // timestamp di inizio: il tempo si calcola sempre da qui
        timerInterval: null,
        lastCue: null,
        finalDurationSec: 0,
        finalCalories: 0
    },

    // Recupero in corso sulla barra fissa #rest-bar:
    // {kind:'rest'|'transition', label, total, endAt, target, source:{ex,set}}
    _restMeta: null,
    _supersetGroupMap: {},
    _supersetPrepShown: {},
    _ctxCache: null,
    _modalFocusStack: [],
    _cycleSummaryDismissed: false,
    _scrollMemo: {},
    _booting: false,

    // ========================================
    // PAGINE E GUSCIO
    // ========================================

    // shell: 'tabs' = con la barra delle schede · 'sub' = sottopagina con topbar e Indietro
    //        'session' = seduta a tutto schermo (body.session) · 'full' = a tutto schermo senza barre
    PAGES: {
        oggi: { shell: 'tabs', title: 'Oggi' },
        scheda: { shell: 'tabs', title: 'Scheda' },
        progressi: { shell: 'tabs', title: 'Progressi' },
        profilo: { shell: 'tabs', title: 'Profilo' },
        esercizi: { shell: 'sub', title: 'Esercizi', parent: 'scheda' },
        seduta: { shell: 'session', title: 'Seduta' },
        riepilogo: { shell: 'full', title: 'Riepilogo' },
        onboarding: { shell: 'full', title: 'Benvenuto' }
    },

    // Nomi della v1 ancora accettati da navigateTo (Impostazioni ora sta dentro Profilo)
    PAGE_ALIASES: {
        dashboard: 'oggi', programs: 'scheda', progress: 'progressi', profile: 'profilo',
        settings: 'profilo', exercises: 'esercizi', workout: 'seduta'
    },

    AREAS: ['Oggi', 'Seduta', 'Scheda', 'Progressi', 'Profilo', 'Esercizi', 'Conditioning'],

    // ========================================
    // INITIALIZATION
    // ========================================

    init() {
        this._booting = true;   // durante l'avvio la navigazione sostituisce l'hash, non aggiunge passi
        try {
            this._boot();
        } finally {
            // Qualunque cosa sia andata storta, una pagina deve essere visibile
            if (!this.currentPage) this._safe(() => this._routeFromHash());
            this._booting = false;
        }
    },

    _boot() {
        this._safe(() => this._mountShell());
        this._safe(() => this.setupNavigation());
        this._safe(() => this.setupEventListeners());
        this._safe(() => this.loadTheme());
        // Le pagine si disegnano solo quando si aprono (enter<Pagina>): niente lavoro per quelle non viste (R1-10)

        // Chiede al browser di non cancellare i dati (Safari non installato li cancella dopo 7 giorni)
        this._safe(() => Storage.requestPersistence());

        // Sessione rimasta aperta (iOS che chiude la PWA, ricarica): si riprende
        let resumed = false;
        this._safe(() => { resumed = this.restoreActiveSession(); });
        // Cardio rimasto in corso: riprende dal suo orario di partenza (R1-20)
        if (!resumed && typeof this.restoreConditioning === 'function') this._safe(() => this.restoreConditioning());
        // Stato del ciclo allineato al calendario anche se si apre direttamente un'altra pagina
        if (typeof this.syncAppState === 'function') this._safe(() => this.syncAppState());

        if (Array.isArray(Storage.corruptionLog) && Storage.corruptionLog.length) {
            this.showNotification('Alcuni dati erano danneggiati: copia di sicurezza salvata', 'warning');
        }

        // Senza nome o senza scheda (e senza seduta da riprendere) si apre il primo avvio
        if (!resumed && typeof this._oggiNeedsOnboarding === 'function' && this._oggiNeedsOnboarding()
            && typeof this.openOnboarding === 'function') {
            this.openOnboarding({ replace: true, auto: true });
        } else if (!this.currentPage) {
            this._routeFromHash();
        }
    },

    // Esegue fn senza far cadere tutto il resto se fallisce
    _safe(fn) {
        try {
            return fn();
        } catch (e) {
            console.error('GymTracker:', e);
            return undefined;
        }
    },

    _cap(name) {
        return String(name).charAt(0).toUpperCase() + String(name).slice(1);
    },

    // Pagine e fogli statici vengono dai template delle aree (html<Pagina>, sheets<Area>):
    // ogni area possiede il suo markup e index.html resta il guscio
    _mountShell() {
        Object.keys(this.PAGES).forEach(name => {
            const page = document.getElementById(`page-${name}`);
            const html = this['html' + this._cap(name)];
            if (page && typeof html === 'function') this._safe(() => { page.innerHTML = html.call(this); });
        });
        const sheets = document.getElementById('sheets');
        if (sheets) {
            sheets.innerHTML = this.AREAS.map(area => {
                const fn = this['sheets' + area];
                return typeof fn === 'function' ? (this._safe(() => fn.call(this)) || '') : '';
            }).join('');
        }
    },

    // ========================================
    // ROUTER: #oggi #scheda #progressi #profilo #esercizi #seduta #riepilogo #onboarding
    // ========================================

    setupNavigation() {
        // Indietro/Avanti del browser e hash scritto a mano
        window.addEventListener('hashchange', () => this._routeFromHash());

        // Link interni: data-page="scheda" naviga, data-back torna indietro (o alla pagina indicata)
        document.addEventListener('click', (e) => {
            if (e.defaultPrevented || e.button > 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
            const back = e.target.closest('[data-back]');
            if (back) {
                e.preventDefault();
                this.goBack(back.dataset.back || undefined);
                return;
            }
            // "?" accanto a un termine (RIR, fasi, protocolli): spiegazione in un foglio, una riga per voce
            const help = e.target.closest('[data-help]');
            if (help) {
                e.preventDefault();
                this.helpSheet(help.dataset.help);
                return;
            }
            const link = e.target.closest('[data-page]');
            if (!link) return;
            e.preventDefault();
            const page = this._resolvePage(link.dataset.page);
            // Tocco sulla scheda già aperta: si torna in cima (senza animazione se il sistema la riduce)
            if (page === this.currentPage) window.scrollTo?.({ top: 0, behavior: this._scrollBehavior() });
            else this.navigateTo(page);
        });
    },

    // 'smooth', o 'auto' con "riduci movimento" (R2-21)
    _scrollBehavior() {
        try {
            return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
        } catch (e) {
            return 'auto';
        }
    },

    // Nome (anche della v1) → pagina apribile adesso
    _resolvePage(name) {
        let page = this.PAGE_ALIASES[name] || name;
        if (!this.PAGES[page]) page = 'oggi';
        const section = document.getElementById(`page-${page}`);
        // Pagina ancora vuota (nessun template) o chiusa dalla sua area (can<Pagina>() === false)
        if (!section || !section.firstElementChild) return 'oggi';
        const can = this['can' + this._cap(page)];
        if (typeof can === 'function' && this._safe(() => can.call(this)) === false) return 'oggi';
        return page;
    },

    _routeFromHash() {
        const raw = decodeURIComponent((location.hash || '').replace(/^#\/?/, ''));
        const page = this._resolvePage(raw || 'oggi');
        // Indietro (gesto di Safari, tasto di Android) con un foglio aperto: si chiude il foglio e si
        // resta sulla pagina; il passo tolto dalla cronologia si rimette (R2-02)
        if (this.currentPage && page !== this.currentPage && this._openSheets().length) {
            this._closeTopModal();
            this._setHash(this.currentPage);
            return;
        }
        if (page !== raw) this._setHash(page, true);
        if (page !== this.currentPage) this.showPage(page, { restoreScroll: true });
    },

    // Ogni passo nell'app è una voce della cronologia: il tasto Indietro torna alla pagina prima
    _setHash(page, replace = false) {
        const hash = `#${page}`;
        if (location.hash === hash) return;
        const depth = (history.state && history.state.gtDepth) || 0;
        try {
            if (replace) history.replaceState({ gtPage: page, gtDepth: depth }, '', hash);
            else history.pushState({ gtPage: page, gtDepth: depth + 1 }, '', hash);
        } catch (e) {
            location.hash = hash;
        }
    },

    showPage(pageName, opts = {}) {
        const page = document.getElementById(`page-${pageName}`);
        if (!page) return;
        if (this.currentPage && this.currentPage !== pageName) this._scrollMemo[this.currentPage] = window.scrollY || 0;
        document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p === page));
        this.currentPage = pageName;
        this._applyShell(pageName);

        // Ogni pagina si ridisegna con i dati aggiornati quando si apre: App.enter<Pagina>()
        const enter = this['enter' + this._cap(pageName)];
        if (typeof enter === 'function') this._safe(() => enter.call(this));
        this.refreshShell();

        const title = this.PAGES[pageName]?.title;
        document.title = title ? `${title} · GymTracker` : 'GymTracker';
        if (opts.restoreScroll) window.scrollTo?.(0, this._scrollMemo[pageName] || 0);
    },

    /**
     * Va a una pagina: la mostra subito e aggiunge un passo alla cronologia.
     * @param {string} pageName - nome nuovo ('scheda') o della v1 ('programs')
     * @param {{replace?: boolean}} opts - replace: sostituisce il passo corrente (niente Indietro)
     */
    navigateTo(pageName, opts = {}) {
        const page = this._resolvePage(pageName);
        const changed = page !== this.currentPage;
        if (changed) this.showPage(page);
        this._setHash(page, !!opts.replace || this._booting);
        if (changed) window.scrollTo?.(0, 0);
        return page;
    },

    // Indietro dentro l'app se il passo prima è nostro, altrimenti la pagina "genitore"
    goBack(fallback) {
        const depth = (history.state && history.state.gtDepth) || 0;
        if (depth > 0) {
            history.back();
            return;
        }
        this.navigateTo(fallback || this.PAGES[this.currentPage]?.parent || 'oggi', { replace: true });
    },

    // Classi del guscio per la pagina: tab bar, topbar, seduta a tutto schermo
    _applyShell(pageName) {
        const shell = this.PAGES[pageName]?.shell || 'tabs';
        const app = document.getElementById('app');
        if (app) {
            app.classList.toggle('app--tabs', shell === 'tabs');
            app.classList.toggle('app--sub', shell === 'sub');
            app.classList.toggle('app--session', shell === 'session');
            app.classList.toggle('app--full', shell === 'full');
        }
        document.body.classList.toggle('session', shell === 'session');
        document.querySelectorAll('.tabbar .tab').forEach(tab => {
            if (tab.dataset.page === pageName) tab.setAttribute('aria-current', 'page');
            else tab.removeAttribute('aria-current');
        });
    },

    // Il dock (azione principale in basso) della pagina attiva: c'è? quanto è alto?
    // Lo segue un ResizeObserver: un dock che si svuota (display:none) o si riempie (recupero che
    // parte) aggiorna da solo .app--dock e --dock-space. Da richiamare se una pagina cambia dock.
    refreshShell() {
        const app = document.getElementById('app');
        if (!app) return;
        if (this._dockObserver) this._dockObserver.disconnect();
        this._dockObserver = null;
        const page = document.querySelector('.page.active');
        const dock = page ? [...page.querySelectorAll('.dock')]
            .find(d => !d.hidden && d.parentElement && d.parentElement.getClientRects().length > 0) : null;
        const measure = () => {
            const h = dock ? Math.ceil(dock.getBoundingClientRect().height) : 0;
            app.classList.toggle('app--dock', h > 0);
            if (h > 0) app.style.setProperty('--dock-space', `${h}px`);
            else app.style.removeProperty('--dock-space');
        };
        measure();
        if (dock && typeof ResizeObserver !== 'undefined') {
            this._dockObserver = new ResizeObserver(measure);
            this._dockObserver.observe(dock);
        }
    },

    // ========================================
    // EVENT LISTENERS
    // ========================================

    // Ogni area lega i suoi (bind<Area>); qui solo quelli globali
    setupEventListeners() {
        this.AREAS.forEach(area => {
            const bind = this['bind' + area];
            if (typeof bind === 'function') this._safe(() => bind.call(this));
        });

        // Esc chiude il foglio più in alto (H10); Tab resta dentro il foglio aperto
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' || e.key === 'Esc') this._closeTopModal();
            else if (e.key === 'Tab') this._trapFocus(e);
        });

        // Fogli aperti da qualunque strada (anche style.display): fondo bloccato e inerte
        const watch = new MutationObserver(() => this._syncSheets());
        watch.observe(document.body, { childList: true });
        const sheets = document.getElementById('sheets');
        if (sheets) watch.observe(sheets, { subtree: true, attributes: true, attributeFilter: ['class', 'style'] });

        // La sessione si salva anche quando l'app va in background o si chiude
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                this._persistSession();
            } else if (this.conditioningState.startedAt) {
                this._conditioningTick();
            }
        });
        window.addEventListener('pagehide', () => this._persistSession());
    },

    // Scorciatoie per i bind<Area>()
    _on(id, ev, fn) {
        document.getElementById(id)?.addEventListener(ev, fn);
    },

    _closeOnBackdrop(id, fn) {
        this._on(id, 'click', (e) => { if (e.target.id === id) fn(); });
    },

    // Rende "cliccabile" da tastiera un elemento non-bottone
    _makeKeyboardClickable(el) {
        if (/^(BUTTON|A|INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) return;
        if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
        if (!el.hasAttribute('role')) el.setAttribute('role', 'button');
        if (el._gtKeyBound) return;
        el._gtKeyBound = true;
        el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                el.click();
            }
        });
    },

    // ========================================
    // FOGLI (ex modali): dal basso su telefono, centrati su desktop.
    // Statici: <div class="modal" id="x-modal"><section class="sheet" role="dialog">…</section></div>
    // aperti con _openModal(id) e chiusi con _closeModal(id). Al volo: _showDynamicModal(id, html).
    // Focus al primo controllo, Tab intrappolato, Esc e tocco sul velo chiudono, focus restituito.
    // ========================================

    _openModal(id, focusSelector = null) {
        const modal = document.getElementById(id);
        if (!modal) return;
        if (!modal.classList.contains('active')) {
            this._modalFocusStack.push(document.activeElement);
        }
        modal.classList.add('active');
        if (!modal.querySelector('[role="dialog"]')) {
            modal.setAttribute('role', 'dialog');
            modal.setAttribute('aria-modal', 'true');
        }
        this._syncSheets();
        this._focusFirst(modal, focusSelector);
    },

    _closeModal(id) {
        const modal = document.getElementById(id);
        if (!modal || !modal.classList.contains('active')) return;
        modal.classList.remove('active');
        this._syncSheets();
        this._restoreFocus();
    },

    _focusFirst(container, selector = null) {
        setTimeout(() => {
            const el = (selector && container.querySelector(selector)) ||
                container.querySelector('[data-autofocus], .sheet__close, .modal-close, button:not([disabled]), [href], input, select, textarea, [tabindex="0"]');
            try { el?.focus({ preventScroll: true }); } catch (e) { /* no-op */ }
        }, 30);
    },

    _restoreFocus() {
        const el = this._modalFocusStack.pop();
        if (el && document.contains(el) && typeof el.focus === 'function') {
            try { el.focus({ preventScroll: true }); } catch (e) { /* no-op */ }
        }
    },

    // Fogli visibili adesso, dal più basso al più alto (ordine nel DOM)
    _openSheets() {
        return [...document.querySelectorAll('.modal')].filter(m => m.getClientRects().length > 0);
    },

    // Con un foglio aperto la pagina sotto non scorre e non si raggiunge (inert)
    _syncSheets() {
        const open = this._openSheets().length > 0;
        document.body.classList.toggle('has-sheet', open);
        const app = document.getElementById('app');
        if (app && app.inert !== open) app.inert = open;
    },

    _trapFocus(e) {
        const sheets = this._openSheets();
        const top = sheets[sheets.length - 1];
        if (!top) return;
        const items = [...top.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
            .filter(el => el.getClientRects().length > 0);
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (!top.contains(document.activeElement)) {
            e.preventDefault();
            first.focus();
        } else if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    },

    // Un modale creato al volo (markup della v1: contenitore > contenuto) diventa un foglio
    _sheetify(root) {
        if (!root) return null;
        root.classList.add('modal', 'active', 'modal--dyn');
        root.removeAttribute('role');
        root.removeAttribute('aria-modal');
        const sheet = root.querySelector(':scope > .sheet') || root.firstElementChild;
        if (sheet) {
            sheet.classList.add('sheet');
            sheet.setAttribute('role', 'dialog');
            sheet.setAttribute('aria-modal', 'true');
            const heading = sheet.querySelector('h1, h2, h3');
            if (heading) {
                if (!heading.id) heading.id = `${root.id}-title`;
                sheet.setAttribute('aria-labelledby', heading.id);
            }
            if (!sheet.querySelector(':scope > .sheet__grip')) {
                sheet.insertAdjacentHTML('afterbegin', '<span class="sheet__grip" aria-hidden="true"></span>');
            }
        }
        if (!root._gtBackdrop) {
            root._gtBackdrop = true;
            root.addEventListener('click', (e) => { if (e.target === root) this._closeTopModal(); });
        }
        this._syncSheets();
        return root;
    },

    // Modali creati al volo (riepiloghi, dettaglio, modifica): stesso comportamento dei fissi
    _showDynamicModal(id, html) {
        document.getElementById(id)?.remove();
        this._modalFocusStack.push(document.activeElement);
        document.body.insertAdjacentHTML('beforeend', html);
        const modal = document.getElementById(id);
        if (!modal) return null;
        this._sheetify(modal);
        this._focusFirst(modal, '[data-autofocus], .btn--primary');
        return modal;
    },

    _removeDynamicModal(id) {
        const modal = document.getElementById(id);
        if (!modal) return false;
        modal.remove();
        this._syncSheets();
        this._restoreFocus();
        return true;
    },

    /**
     * Conferma in un foglio, al posto di confirm(): il titolo nomina cosa si conferma,
     * il bottone dice l'azione, il focus va sulla scelta sicura.
     * @param {{title:string, text?:string, ok?:string, cancel?:string, danger?:boolean, icon?:string}} o
     * @returns {Promise<boolean>} true = azione confermata
     */
    confirmSheet({ title, text = '', ok = 'Conferma', cancel = 'Annulla', danger = false, icon = null } = {}) {
        if (this._confirmResolve) this._confirmResolve(false);
        return new Promise((resolve) => {
            const id = 'confirm-sheet';
            const finish = (value) => {
                if (this._confirmResolve !== finish) return;
                this._confirmResolve = null;
                this._removeDynamicModal(id);
                resolve(value);
            };
            this._confirmResolve = finish;
            const okBtn = danger
                ? `<button type="button" class="btn btn--secondary btn--xl btn--danger-text" data-confirm="1">${GT.esc(ok)}</button>`
                : `<button type="button" class="btn btn--primary btn--xl" data-confirm="1">${icon ? this.ico(icon) : ''}${GT.esc(ok)}</button>`;
            const cancelBtn = danger
                ? `<button type="button" class="btn btn--primary btn--xl" data-confirm="0" data-autofocus>${GT.esc(cancel)}</button>`
                : `<button type="button" class="btn btn--ghost btn--block" data-confirm="0" data-autofocus>${GT.esc(cancel)}</button>`;
            const modal = this._showDynamicModal(id, `
                <div id="${id}">
                    <section class="sheet">
                        <div class="sheet__head"><h2>${GT.esc(title)}</h2></div>
                        ${text ? `<p class="muted">${GT.esc(text)}</p>` : ''}
                        <div class="sheet__actions">${okBtn}${cancelBtn}</div>
                    </section>
                </div>`);
            modal?.querySelectorAll('[data-confirm]').forEach(btn => {
                btn.addEventListener('click', () => finish(btn.dataset.confirm === '1'));
            });
        });
    },

    /**
     * Chiusura propria di un foglio (Esc, velo, Indietro del telefono passano tutti da qui).
     * Serve ai fogli che non si chiudono e basta: es. una nota con testo non salvato.
     * @param {string} id - id del .modal (statico o al volo)
     * @param {Function|null} fn - null toglie la regola
     */
    onSheetClose(id, fn) {
        this._sheetClosers = this._sheetClosers || {};
        if (typeof fn === 'function') this._sheetClosers[id] = fn;
        else delete this._sheetClosers[id];
    },

    // Chiude il foglio più in alto con la sua regola. true = c'era un foglio
    _closeTopModal() {
        const sheets = this._openSheets();
        // Il più in alto è l'ultimo nel DOM: i fogli al volo stanno in fondo al body, dopo #sheets
        const top = sheets[sheets.length - 1];
        if (!top) return false;
        const id = top.id;
        const custom = (this._g4Close && this._g4Close[id]) || (this._sheetClosers && this._sheetClosers[id]);
        if (custom) {
            custom();
            return true;
        }
        const dynamicClose = {
            'workout-edit-modal': () => this.closeWorkoutEdit(),
            'workout-detail-modal': () => this.closeWorkoutDetail(),
            'cycle-summary-modal': () => this.closeCycleSummary(),
            'week-advance-modal': () => this.dismissWeekAdvancement(),
            'deload-suggestion-modal': () => this.dismissDeloadSuggestion(),
            'workout-completion-modal': () => this.closeWorkoutCompletionSummary(),
            'confirm-sheet': () => this._confirmResolve?.(false)
        };
        if (dynamicClose[id]) dynamicClose[id]();
        else if (top.classList.contains('modal--dyn')) this._removeDynamicModal(id);
        else if (id === 'conditioning-modal') this.closeConditioningModal();
        else if (id === 'manual-builder-modal') this.closeManualBuilder();
        else if (id === 'cooldown-modal') {
            top.style.display = 'none';
            this._syncSheets();
            this._restoreFocus();
        } else this._closeModal(id);
        return true;
    },

    // ========================================
    // AIUTO "?": una riga per termine (R2-22)
    // ========================================

    HELP: {
        ciclo: ['Ciclo', 'Settimane in salita, poi lo scarico'],
        acc: ['Accumulo', 'Più serie, lontano dal cedimento'],
        int: ['Intensificazione', 'Meno serie, più vicino al cedimento'],
        del: ['Scarico', 'Metà serie, carichi più leggeri'],
        rir: ['RIR', 'Ripetizioni che avresti ancora fatto'],
        hiit: ['HIIT', 'Intervalli intensi con pause brevi'],
        liss: ['LISS', 'Ritmo costante: riesci a parlare'],
        circuit: ['Circuito', 'Esercizi in fila, poi si ripete il giro'],
        emom: ['EMOM', 'Ogni minuto un esercizio, poi pausa'],
        block: ['Tabata', '20 s a tutta, 10 s di pausa, 8 volte']
    },

    HELP_GROUPS: {
        ciclo: { title: 'Ciclo', intro: 'ciclo', keys: ['acc', 'int', 'del', 'rir'] },
        cardio: { title: 'Cardio', keys: ['hiit', 'liss'] },
        protocolli: { title: 'Protocolli', keys: ['circuit', 'emom', 'block'] }
    },

    /** Foglio d'aiuto: "ciclo" | "cardio" | "protocolli" (gruppi) o un termine di HELP. */
    helpSheet(key) {
        const group = this.HELP_GROUPS[key] || (this.HELP[key] ? { title: this.HELP[key][0], keys: [key] } : null);
        if (!group) return null;
        const rows = group.keys.filter(k => this.HELP[k]).map(k => `
            <div class="row help-row"><span class="row__body"><span class="row__title">${GT.esc(this.HELP[k][0])}</span><span class="row__sub">${GT.esc(this.HELP[k][1])}</span></span></div>`).join('');
        const intro = group.intro && this.HELP[group.intro] ? `<p class="muted help-intro">${GT.esc(this.HELP[group.intro][1])}</p>` : '';
        const modal = this._showDynamicModal('help-sheet', `
            <div id="help-sheet">
                <section class="sheet">
                    <div class="sheet__head"><h2>${GT.esc(group.title)}</h2>
                        <button type="button" class="btn btn--ghost btn--icon sheet__close" data-help-close aria-label="Chiudi l'aiuto">${this.ico('close')}</button></div>
                    ${intro}
                    <div class="group">${rows}</div>
                </section>
            </div>`);
        modal?.querySelector('[data-help-close]')?.addEventListener('click', () => this._removeDynamicModal('help-sheet'));
        return modal;
    },

    // Bottone "?" (44 px) da mettere accanto a un titolo
    _helpBtn(key, label) {
        return `<button type="button" class="btn btn--ghost btn--icon btn--sm help-btn" data-help="${key}" aria-label="${GT.esc(label)}">${this.ico('help')}</button>`;
    },

    // ========================================
    // UTILITIES
    // ========================================

    // Icona dello sprite (#i-<name> in index.html). Decorativa: il nome va sul bottone (aria-label).
    // cls: 'ico--sm' 20 · 'ico--lg' 28 · 'ico--xl' 40 (più eventuali classi proprie)
    ico(name, cls = '') {
        return `<svg class="ico${cls ? ' ' + cls : ''}" aria-hidden="true" focusable="false"><use href="#i-${name}"/></svg>`;
    },

    // Numero all'italiana: 102,5 · 8.420 (DESIGN.md §3)
    fmt(n, digits = 2) {
        const v = Number(n);
        if (!Number.isFinite(v)) return '';
        // it-IT non raggruppa sotto 10.000 ("8420"): il punto delle migliaia si mette a mano
        let s = Math.abs(v).toFixed(Math.max(0, digits));
        if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
        const [int, dec] = s.split('.');
        const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        return (v < 0 ? '−' : '') + grouped + (dec ? ',' + dec : '');
    },

    _setText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
        return el;
    },

    // ========================================
    // ETICHETTE: una tabella sola per primo avvio, Profilo, Scheda, Oggi (R2-13)
    // ========================================

    LABELS: {
        // [valore, nome, una riga, icona]
        goals: [
            ['toning', 'Tonificazione', 'Glutei e gambe in primo piano', 'm-glutes'],
            ['hypertrophy', 'Ipertrofia', 'Più muscolo', 'm-arms'],
            ['recomp', 'Ricomposizione', 'Meno grasso, più muscolo', 'scale'],
            ['strength', 'Forza', 'Carichi più alti, poche ripetizioni', 'barbell'],
            ['endurance', 'Resistenza', 'Tante ripetizioni, recuperi brevi', 'heart']
        ],
        // [valore, nome, da quanto (per esteso), da quanto (breve)]
        levels: [
            ['beginner', 'Principiante', 'meno di 1 anno', '0-1 anni'],
            ['intermediate', 'Intermedio', 'da 1 a 3 anni', '1-3 anni'],
            ['advanced', 'Avanzato', 'da 3 a 5 anni', '3-5 anni'],
            ['expert', 'Esperto', 'più di 5 anni', '5+ anni']
        ],
        // [valore, nome, icona]
        equipment: [
            ['bilanciere', 'Bilanciere', 'barbell'], ['manubri', 'Manubri', 'dumbbell'], ['macchine', 'Macchine', 'machine'],
            ['cavi', 'Cavi', 'cable'], ['panca', 'Panca', 'bench'], ['sbarra', 'Sbarra', 'pullup'],
            ['parallele', 'Parallele', 'bodyweight'], ['accessori', 'Accessori', 'band']
        ],
        pain: [['shoulder', 'Spalle'], ['elbow', 'Gomiti'], ['knee', 'Ginocchia'], ['lowBack', 'Zona lombare']],
        splits: { 'upper-lower': 'Upper/Lower', 'push-pull-legs': 'Push/Pull/Legs', 'full-body': 'Full body' },
        // giorni della settimana come in profile.trainingDays: 1 = lunedì … 7 = domenica
        weekdays: [[1, 'Lunedì', 'L'], [2, 'Martedì', 'M'], [3, 'Mercoledì', 'M'], [4, 'Giovedì', 'G'], [5, 'Venerdì', 'V'], [6, 'Sabato', 'S'], [7, 'Domenica', 'D']]
    },

    _splitLabel(value) {
        return this.LABELS.splits[value] || value;
    },

    _goalLabel(value) {
        return (this.LABELS.goals.find(g => g[0] === value) || [])[1] || value;
    },

    _levelLabel(value, short = false) {
        const l = this.LABELS.levels.find(x => x[0] === value);
        return l ? (short ? l[3] : l[1]) : '';
    },

    // ========================================
    // GIORNI FISSI DELLA SETTIMANA (profile.trainingDays, 1 = lunedì … 7 = domenica)
    // ========================================

    // Proposta ben distribuita per N giorni a settimana
    TRAINING_DAYS_DEFAULT: { 1: [1], 2: [1, 4], 3: [1, 3, 5], 4: [1, 2, 4, 5], 5: [1, 2, 4, 5, 6], 6: [1, 2, 3, 5, 6, 7], 7: [1, 2, 3, 4, 5, 6, 7] },

    _defaultTrainingDays(n) {
        return (this.TRAINING_DAYS_DEFAULT[Math.max(1, Math.min(7, parseInt(n, 10) || 3))] || [1, 3, 5]).slice();
    },

    // Giorni fissi del profilo (validi, ordinati) o [] = nessun giorno fisso
    _trainingDays(profile = Storage.getProfile()) {
        const raw = Array.isArray(profile?.trainingDays) ? profile.trainingDays : [];
        return [...new Set(raw.map(Number).filter(d => Number.isInteger(d) && d >= 1 && d <= 7))].sort((a, b) => a - b);
    },

    // 1 = lunedì … 7 = domenica
    _isoWeekday(d = new Date()) {
        return ((d.getDay() + 6) % 7) + 1;
    },

    _weekdayName(n, lower = true) {
        const w = this.LABELS.weekdays.find(x => x[0] === n);
        if (!w) return '';
        return lower ? w[1].toLowerCase() : w[1];
    },

    // Chip L M M G V S D (aria-pressed); attrs: attributi in più per il gruppo
    _weekdayChips(selected, dataAttr) {
        const on = new Set(selected || []);
        return this.LABELS.weekdays.map(([n, name, ini]) => `<button type="button" class="chip wd-chip" aria-pressed="${on.has(n)}" ${dataAttr}="${n}" aria-label="${name}"><span aria-hidden="true">${ini}</span></button>`).join('');
    },

    // ========================================
    // SALVATAGGI CHE NON DEVONO FALLIRE IN SILENZIO (R1-09, R1-20)
    // ========================================

    // Perché la memoria non accetta dati: Storage.lastWriteError.code QUOTA | SECURITY | WRITE (R1-20);
    // senza codice si deduce: errore di spazio con pochi dati salvati = navigazione privata
    _storageWhy(err = Storage.lastError) {
        const code = (err && err.code) || (Storage.lastWriteError && Storage.lastWriteError.code) || '';
        const cause = err && (err.cause || err);
        if (code === 'SECURITY' || (cause && cause.name === 'SecurityError')) return 'bloccato dal browser';
        if (code === 'QUOTA') return 'memoria piena';
        if (code === 'WRITE') return 'memoria non disponibile';
        let used = 0;
        try {
            for (let i = 0; i < localStorage.length; i++) used += (localStorage.getItem(localStorage.key(i)) || '').length;
        } catch (e) {
            return 'bloccato dal browser';
        }
        return used > 200000 ? 'memoria piena' : 'memoria non disponibile';
    },

    /**
     * Esegue un salvataggio; se lancia o restituisce false mostra "<msg>: memoria piena".
     * @returns {*} il risultato (true se fn non restituisce nulla), false se non è riuscito
     */
    _save(fn, msg) {
        let res;
        try {
            Storage.lastError = null;
            res = fn();
        } catch (e) {
            console.error('GymTracker:', msg, e);
            if (!Storage.lastError) Storage.lastError = e;
            res = false;
        }
        // false senza errore di scrittura = niente da fare (es. nessun ciclo): nessun avviso
        if ((res === false || res === null) && Storage.lastError) {
            this.showNotification(`${msg}: ${this._storageWhy()}`, 'error');
            return false;
        }
        return res === undefined ? true : res;
    },

    // Valori sempre validi: serie 1-10, recupero 15-600 s, reps "8-12" o "10"
    _clampInt(value, def, min, max) {
        const n = parseInt(value);
        if (!Number.isFinite(n)) return def;
        return Math.max(min, Math.min(max, n));
    },

    _cleanReps(value, def = '8-12') {
        const s = String(value ?? '').trim().replace(/\s+/g, '').replace(/[–—]/g, '-');
        return /^\d{1,3}(-\d{1,3})?$/.test(s) ? s : def;
    },

    _setsChips(setsData) {
        return (setsData || []).map((s, i) => `
            <span class="workout-detail-set ${s.completed ? 'completed' : 'skipped'}">
                ${s.completed ? `${GT.esc(s.weight === '' ? '—' : s.weight)} kg × ${GT.esc(s.reps)}` : `Serie ${i + 1}: saltata`}
            </span>
        `).join('');
    },

    _setsVolume(setsData) {
        return (setsData || []).filter(s => s.completed)
            .reduce((sum, s) => sum + GT.num(s.weight) * Math.round(GT.num(s.reps)), 0);
    },

    // ========================================
    // TEMA: data-theme = dark (predefinito) | light | auto (segue il sistema, lo fa il CSS)
    // ========================================

    loadTheme() {
        this.setTheme(Storage.getSettings().theme || 'dark', false);
        if (!this._themeMq && window.matchMedia) {
            this._themeMq = window.matchMedia('(prefers-color-scheme: light)');
            const onChange = () => {
                if (document.documentElement.getAttribute('data-theme') !== 'auto') return;
                this._syncThemeColor();
                if (this.currentPage === 'progressi') this._safe(() => this.initCharts());
            };
            if (this._themeMq.addEventListener) this._themeMq.addEventListener('change', onChange);
            else if (this._themeMq.addListener) this._themeMq.addListener(onChange);
        }
    },

    setTheme(theme, save = true) {
        const value = ['dark', 'light', 'auto'].includes(theme) ? theme : 'dark';
        document.documentElement.setAttribute('data-theme', value);
        this._syncThemeColor();

        if (save) {
            // Il tema si vede subito; se non si salva lo si dice (alla prossima apertura tornerebbe quello di prima)
            this._save(() => Storage.saveSettings({ theme: value }), 'Tema non salvato');
            if (this.currentPage === 'progressi') this._safe(() => this.initCharts());
        }
    },

    // Tema effettivo (auto risolto): 'dark' | 'light'
    _effectiveTheme() {
        const t = document.documentElement.getAttribute('data-theme');
        if (t === 'light' || t === 'dark') return t;
        return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    },

    // Barra di stato del sistema dello stesso colore del fondo
    _syncThemeColor() {
        const color = this._effectiveTheme() === 'light' ? '#F6F4EF' : '#0F0E0B';
        document.querySelectorAll('meta[name="theme-color"]').forEach(m => m.setAttribute('content', color));
    },

    // Secondi → "45" o "1:30"
    _fmtSec(total) {
        const s = Math.max(0, Math.round(total));
        const m = Math.floor(s / 60);
        const x = s % 60;
        return m > 0 ? `${m}:${String(x).padStart(2, '0')}` : String(x);
    },

    // Secondi → "00:12:34"
    _fmtClock(total) {
        const s = Math.max(0, Math.floor(total));
        const pad = (n) => String(n).padStart(2, '0');
        return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
    },

    // ========================================
    // AVVISI (toast): una riga in alto che nomina l'oggetto, al massimo 3, si chiudono da soli
    // o al tocco. opts: { icon: 'trophy', action: { label: 'Annulla', onClick() {} }, duration: ms }
    // ========================================

    showNotification(message, type = 'info', opts = {}) {
        let stack = document.getElementById('toast-stack');
        if (!stack) {
            stack = document.createElement('div');
            stack.id = 'toast-stack';
            stack.className = 'toast-stack';
            stack.setAttribute('role', 'status');
            stack.setAttribute('aria-live', 'polite');
            document.body.appendChild(stack);
        }

        // Al massimo 3 avvisi a schermo
        while (stack.children.length >= 3) stack.firstElementChild.remove();

        const icon = opts.icon || { success: 'check', warning: 'alert', error: 'alert' }[type] || 'info';
        const toast = document.createElement('div');
        toast.className = `toast toast--${['success', 'warning', 'error'].includes(type) ? type : 'info'}`;
        toast.innerHTML = this.ico(icon);   // markup fisso: il testo entra sotto come TESTO
        const msg = document.createElement('span');
        msg.textContent = message;
        toast.appendChild(msg);

        let timer = null;
        const remove = () => {
            clearTimeout(timer);
            if (!toast.isConnected || toast.classList.contains('is-leaving')) return;
            toast.classList.add('is-leaving');
            setTimeout(() => toast.remove(), 200);
        };
        if (opts.action) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'btn';
            btn.textContent = opts.action.label || 'Annulla';
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                remove();
                this._safe(() => opts.action.onClick?.());
            });
            toast.appendChild(btn);
        }
        toast.addEventListener('click', remove);
        stack.appendChild(toast);
        // Una riga (R2-17): se il testo non ci sta si rimpicciolisce; solo se ancora non basta va a capo
        // (meglio due righe che una parola tagliata)
        try {
            if (msg.scrollWidth > msg.clientWidth + 1) {
                toast.classList.add('toast--fit');
                if (msg.scrollWidth > msg.clientWidth + 1) toast.classList.add('toast--wrap');
            }
        } catch (e) { /* no-op */ }
        timer = setTimeout(remove, opts.duration || (opts.action ? 6000 : 4000));
        toast._gtRemove = remove;
        return toast;
    },

    // Chiude un avviso prima del tempo (es. quello che chiedeva una scelta appena fatta)
    closeNotification(toast) {
        if (toast && typeof toast._gtRemove === 'function') toast._gtRemove();
    },
};
