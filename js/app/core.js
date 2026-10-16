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
        this._safe(() => this.loadSettings());
        this._safe(() => this.loadProfile());
        this._safe(() => this.loadPrograms());
        this._safe(() => this.renderExercises());

        // Chiede al browser di non cancellare i dati (Safari non installato li cancella dopo 7 giorni)
        this._safe(() => Storage.requestPersistence());

        // Sessione rimasta aperta (iOS che chiude la PWA, ricarica): si riprende
        let resumed = false;
        this._safe(() => { resumed = this.restoreActiveSession(); });

        this.loadDashboard();
        this._safe(() => this.loadProgress());

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
            const link = e.target.closest('[data-page]');
            if (!link) return;
            e.preventDefault();
            const page = this._resolvePage(link.dataset.page);
            // Tocco sulla scheda già aperta: si torna in cima
            if (page === this.currentPage) window.scrollTo?.({ top: 0, behavior: 'smooth' });
            else this.navigateTo(page);
        });
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

    _closeTopModal() {
        const dynamicClose = {
            'workout-edit-modal': () => this.closeWorkoutEdit(),
            'workout-detail-modal': () => this.closeWorkoutDetail(),
            'rotation-detail-modal': () => this._removeDynamicModal('rotation-detail-modal'),
            'cycle-summary-modal': () => this.closeCycleSummary(),
            'week-advance-modal': () => this.dismissWeekAdvancement(),
            'deload-suggestion-modal': () => this.dismissDeloadSuggestion(),
            'workout-completion-modal': () => this.closeWorkoutCompletionSummary(),
            'confirm-sheet': () => this._confirmResolve?.(false)
        };
        // Il più in alto è l'ultimo inserito nel body
        const open = [...document.querySelectorAll(Object.keys(dynamicClose).map(id => '#' + id).join(','))];
        const top = open[open.length - 1];
        if (top) {
            dynamicClose[top.id]();
            return;
        }

        // Fogli statici: il più in alto è l'ultimo aperto nel DOM
        const sheets = this._openSheets().filter(m => !m.classList.contains('modal--dyn'));
        const topSheet = sheets[sheets.length - 1];
        if (!topSheet) return;
        const id = topSheet.id;
        if (id === 'conditioning-modal') this.closeConditioningModal();
        else if (id === 'manual-builder-modal') this.closeManualBuilder();
        else if (id === 'cooldown-modal') {
            topSheet.style.display = 'none';
            this._syncSheets();
            this._restoreFocus();
        } else this._closeModal(id);
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
        return Number.isFinite(v) ? v.toLocaleString('it-IT', { maximumFractionDigits: digits }) : '';
    },

    _setText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
        return el;
    },

    _splitLabel(value) {
        const labels = { 'upper-lower': 'Upper/Lower', 'push-pull-legs': 'Push/Pull/Legs', 'full-body': 'Full Body' };
        return labels[value] || value;
    },

    _goalLabel(value) {
        const labels = { hypertrophy: 'Ipertrofia', strength: 'Forza', recomp: 'Ricomposizione', endurance: 'Resistenza', toning: 'Tonificazione' };
        return labels[value] || value;
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
            const settings = Storage.getSettings();
            settings.theme = value;
            Storage.saveSettings(settings);
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
        timer = setTimeout(remove, opts.duration || (opts.action ? 6000 : 4000));
        return toast;
    },
};
