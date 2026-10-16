/**
 * GymTracker 2.0 — area SEDUTA: avvio (anche libera e "ho poco tempo"), sessione salvata a ogni
 * modifica e ripresa dopo una ricarica, esercizio corrente con UNA serie aperta, recupero nel dock
 * (stessa macchina a timestamp di Timer), superset (con la riga del compagno da preparare), rampa di
 * riscaldamento, "Trova il peso", calcolatore dischi, Scambia, nota per esercizio, riscaldamento e
 * defaticamento, fine e riepilogo a pagina intera (#riepilogo).
 *
 * Dati della sessione (App.activeWorkout, salvata in gymtracker_active_session):
 *   esercizio: { exerciseId, name, sets, reps, rest, targetReps, targetSets, originalSets, targetRir,
 *                role, metric, substitutedFrom, supersetGroup?, supersetOrder?, supersetRest?,
 *                setsData[], openSet (serie aperta a mano | null), prefilled, wantsRamp, rampBuilt,
 *                calib ({tests, testReps, seedKg, done} | null), presetKg? }
 *   serie:     { weight, reps, completed, rir?, isWarmup?, isCalibration?, isNewPR?, prType?,
 *                prOld?, prNew?, touched? }
 * Convenzione del peso (ALGORITMO-V2 §2.4): corpo libero = zavorra (0 se non c'è); assistite =
 * assistenza; manubri = un manubrio; macchine a dischi = solo i dischi. Con metric 'time' il campo
 * reps contiene i secondi.
 */

Object.assign(App, {
    // ========================================
    // GUSCIO DELL'AREA: markup della pagina e dei fogli, listener, ingresso nella pagina
    // ========================================

    // Pagina #seduta, a tutto schermo (body.session, niente tab bar). #workout-active lo
    // mostrano/nascondono _enterWorkout e _teardownWorkout con style.display.
    htmlSeduta() {
        return `
            <div id="workout-active" class="seduta" style="display: none;">
                <header class="topbar" id="workout-header-bar">
                    <button type="button" class="btn btn--ghost btn--icon" id="end-workout-btn" aria-label="Termina la seduta">${this.ico('close')}</button>
                    <div class="topbar__title">
                        <b id="workout-title">Seduta</b>
                        <span><span class="num" id="workout-timer" role="timer" aria-label="Durata della seduta">0:00</span> · <span id="workout-pos"></span></span>
                    </div>
                    <button type="button" class="btn btn--ghost btn--icon" id="session-more-btn" aria-label="Altre azioni della seduta">${this.ico('more')}</button>
                </header>

                <div class="seduta__body">
                    <div class="seduta__progress">
                        <div class="track" id="seduta-track" role="img" aria-label="Avanzamento della seduta"></div>
                        <p class="seduta__phase" id="seduta-phase" hidden></p>
                    </div>

                    <!-- Riscaldamento generale: apri/chiudi; "Riscaldamento fatto" è nel dock (R2-11); si chiude da solo alla prima serie -->
                    <section class="warm" id="warmup-section" aria-labelledby="warmup-title" hidden>
                        <h2 class="warm__h">
                            <button type="button" class="warm__head" id="warmup-header" aria-expanded="true" aria-controls="warmup-content">
                                <span class="warm__icon">${this.ico('warmup')}</span>
                                <span class="warm__titles"><span class="warm__title" id="warmup-title">Riscaldamento</span><span class="warm__sub" id="warmup-sub"></span></span>
                                <span class="warm__chev">${this.ico('chevron-down')}</span>
                            </button>
                        </h2>
                        <div class="warm__body" id="warmup-content">
                            <ol class="warm__list" id="warmup-exercises"></ol>
                        </div>
                    </section>

                    <!-- Esercizio corrente: intestazione (_renderHead) + serie (_renderSets) -->
                    <div class="wide" id="current-exercise">
                        <section class="ex col" id="ex-head" aria-labelledby="ex-name"></section>
                        <div class="col ex-sets" id="ex-sets"></div>
                    </div>
                </div>

                <p class="sr-only" id="seduta-status" role="status" aria-live="polite"></p>

                <!-- Dock: il prossimo gesto, sempre qui. Recupero (in corso, ultimi 10 s), finito, superset, azione -->
                <div class="dock seduta-dock" id="seduta-dock" role="region" aria-label="Serie e recupero">
                    <div class="rest" id="rest-bar" role="timer" aria-label="Recupero" hidden>
                        <button type="button" class="rest__btn" id="rest-bar-minus" aria-label="Togli 15 secondi">−15</button>
                        <div class="rest__mid">
                            <span class="rest__time num" id="rest-bar-time">0:00</span>
                            <span class="rest__label" id="rest-bar-label">Recupero</span>
                        </div>
                        <button type="button" class="rest__btn" id="rest-bar-plus" aria-label="Aggiungi 15 secondi">+15</button>
                        <button type="button" class="rest__btn rest__skip" id="rest-bar-skip">${this.ico('skip', 'ico--sm')}Salta</button>
                        <span class="rest__track" aria-hidden="true"><span class="rest__fill" id="rest-bar-fill"></span></span>
                    </div>
                    <div class="rest-over" id="rest-over" role="timer" hidden>${this.ico('play')}<span id="rest-over-label">Vai</span><span class="num" id="rest-over-time">+0:00</span></div>
                    <div class="rest-ss" id="rest-ss" hidden>${this.ico('superset')}<span id="rest-ss-label"></span></div>
                    <div class="dock__row" id="dock-row">
                        <button type="button" class="btn btn--secondary btn--icon btn--xl" id="dock-undo" hidden>${this.ico('undo')}</button>
                        <button type="button" class="btn btn--primary btn--xl" id="dock-main">${this.ico('check')}<span id="dock-main-label">Serie 1 fatta</span></button>
                    </div>
                </div>
            </div>
        `;
    },

    // Riepilogo a pagina intera: lo riempie enterRiepilogo() da App.lastWorkoutSummary
    htmlRiepilogo() {
        return `
            <div class="riep" id="riepilogo-body"></div>
            <div class="dock" role="region" aria-label="Fine seduta">
                <div class="dock__row">
                    <button type="button" class="btn btn--secondary btn--icon btn--xl" id="riep-share" aria-label="Condividi il riepilogo">${this.ico('share')}</button>
                    <button type="button" class="btn btn--primary btn--xl" id="riep-done">Fine</button>
                </div>
            </div>
        `;
    },

    // Fogli dell'area: defaticamento, seduta libera, azioni, scambia, nota, dischi
    sheetsSeduta() {
        const head = (id, title, closeId, closeLabel) => `
            <span class="sheet__grip" aria-hidden="true"></span>
            <div class="sheet__head">
                <h2 id="${id}">${title}</h2>
                <button type="button" class="btn btn--secondary btn--icon sheet__close" id="${closeId}" aria-label="${closeLabel}">${this.ico('close')}</button>
            </div>`;
        return `
            <div class="modal" id="cooldown-modal">
                <section class="sheet" role="dialog" aria-modal="true" aria-labelledby="cooldown-title">
                    <span class="sheet__grip" aria-hidden="true"></span>
                    <div class="sheet__head"><h2 id="cooldown-title">Defaticamento</h2></div>
                    <p class="muted" id="cooldown-info"></p>
                    <ol class="warm__list" id="cooldown-exercises"></ol>
                    <div class="sheet__actions">
                        <button type="button" class="btn btn--primary btn--xl" id="complete-cooldown">${this.ico('check')}Fatto, salva la seduta</button>
                        <button type="button" class="btn btn--ghost btn--block" id="skip-cooldown">Salta il defaticamento</button>
                    </div>
                </section>
            </div>

            <div class="modal" id="free-workout-modal">
                <section class="sheet sheet--tall" role="dialog" aria-modal="true" aria-labelledby="free-workout-modal-title">
                    ${head('free-workout-modal-title', 'Seduta libera', 'free-workout-close', 'Chiudi la seduta libera')}
                    <div class="search">
                        ${this.ico('search')}
                        <input type="search" id="free-workout-search" class="input" placeholder="Cerca un esercizio" aria-label="Cerca un esercizio" autocomplete="off">
                    </div>
                    <div id="free-workout-results" class="free-list"></div>
                    <h3 class="cap">Scelti</h3>
                    <div id="free-workout-selected" class="free-list"></div>
                    <div class="sheet__actions">
                        <button type="button" class="btn btn--primary btn--xl" id="free-workout-start">${this.ico('play')}Inizia la seduta</button>
                    </div>
                </section>
            </div>

            <div class="modal" id="session-more-modal">
                <section class="sheet" role="dialog" aria-modal="true" aria-labelledby="session-more-title">
                    ${head('session-more-title', 'Seduta', 'session-more-close', 'Chiudi le azioni della seduta')}
                    <div class="group" id="session-ex-list" aria-label="Esercizi della seduta"></div>
                    <div class="group">
                        <button type="button" class="row" id="session-library-btn">
                            <span class="row__icon">${this.ico('search')}</span>
                            <span class="row__body"><span class="row__title">Libreria esercizi</span></span>
                            <span class="row__end">${this.ico('next')}</span>
                        </button>
                        <button type="button" class="row" id="cancel-workout-btn">
                            <span class="row__icon">${this.ico('trash')}</span>
                            <span class="row__body"><span class="row__title">Annulla la seduta</span><span class="row__sub">Non si salva niente</span></span>
                        </button>
                    </div>
                </section>
            </div>

            <div class="modal" id="swap-modal">
                <section class="sheet" role="dialog" aria-modal="true" aria-labelledby="swap-title">
                    ${head('swap-title', 'Scambia', 'swap-close', 'Chiudi Scambia')}
                    <div id="swap-body" class="swap"></div>
                </section>
            </div>

            <div class="modal" id="note-modal">
                <section class="sheet" role="dialog" aria-modal="true" aria-labelledby="note-title">
                    ${head('note-title', 'Nota', 'note-close', 'Chiudi la nota')}
                    <div class="field">
                        <label for="note-text" id="note-label">Resta per le prossime volte</label>
                        <textarea class="input note__text" id="note-text" maxlength="140" rows="3" placeholder="Sedile 4, schienale 2"></textarea>
                    </div>
                    <div class="sheet__actions">
                        <button type="button" class="btn btn--primary btn--xl" id="note-save">${this.ico('check')}Salva la nota</button>
                        <button type="button" class="btn btn--ghost btn--block btn--danger-text" id="note-clear">Cancella la nota</button>
                    </div>
                </section>
            </div>

            <div class="modal" id="plates-modal">
                <section class="sheet" role="dialog" aria-modal="true" aria-labelledby="plates-title">
                    ${head('plates-title', 'Dischi', 'plates-close', 'Chiudi il calcolatore')}
                    <div id="plates-body" class="plates"></div>
                </section>
            </div>

            <div class="modal" id="ex-history-modal">
                <section class="sheet" role="dialog" aria-modal="true" aria-labelledby="ex-history-title">
                    ${head('ex-history-title', 'Ultime sedute', 'ex-history-close', 'Chiudi le ultime sedute')}
                    <div id="ex-history-body" class="hist"></div>
                </section>
            </div>
        `;
    },

    bindSeduta() {
        const on = (id, ev, fn) => this._on(id, ev, fn);
        const backdrop = (id) => this._closeOnBackdrop(id, () => this._closeModal(id));

        // Barra della seduta: × termina, ⋯ altre azioni
        on('end-workout-btn', 'click', () => this.endWorkout());
        on('session-more-btn', 'click', () => this._openMore());
        on('session-more-close', 'click', () => this._closeModal('session-more-modal'));
        backdrop('session-more-modal');
        on('session-library-btn', 'click', () => {
            this._closeModal('session-more-modal');
            this.navigateTo('esercizi');
        });
        on('cancel-workout-btn', 'click', () => {
            this._closeModal('session-more-modal');
            this.cancelWorkout();
        });
        on('session-ex-list', 'click', (e) => {
            const row = e.target.closest('[data-goto]');
            if (!row) return;
            this._closeModal('session-more-modal');
            this._goToExercise(parseInt(row.dataset.goto, 10));
        });

        // Riscaldamento: intestazione = apri/chiudi (il dock segue: R2-11)
        on('warmup-header', 'click', () => {
            const section = document.getElementById('warmup-section');
            if (!section) return;
            this._setWarmupCollapsed(!section.classList.contains('collapsed'));
            this._persistSession();
            if (this.activeWorkout) this._renderDock();
        });
        on('warmup-exercises', 'click', (e) => {
            const btn = e.target.closest('[data-info-name]');
            if (btn) this._openRoutineInfo(btn.dataset.infoName, 'warmup');
        });

        // Recupero nel dock
        on('rest-bar-minus', 'click', () => this._adjustRest(-15));
        on('rest-bar-plus', 'click', () => this._adjustRest(15));
        on('rest-bar-skip', 'click', () => this._skipRest());

        // Dock: azione principale e "segna da fare" (correzione). Subito dopo un cambio di serie o di
        // esercizio il dock non risponde (~500 ms): il doppio tocco non registra la serie dopo (R1-08)
        on('dock-main', 'click', () => { if (!this._dockLocked()) this._dockMain(); });
        on('dock-undo', 'click', () => { if (!this._dockLocked()) this._uncompleteOpen(); });

        // Pagina: righe serie, stepper, RIR, strumenti, miniatura, "Poi", "Trova il peso"
        const page = document.getElementById('page-seduta');
        if (page) {
            page.addEventListener('click', (e) => this._onSedutaClick(e));
            page.addEventListener('input', (e) => {
                const input = e.target.closest('.stepper__val');
                if (input) this._inputField(parseInt(input.dataset.set, 10), input.dataset.field, input.value);
            });
            page.addEventListener('focusout', (e) => {
                const input = e.target.closest('.stepper__val');
                if (input) this._normalizeInput(input);
            });
            page.addEventListener('focusin', (e) => {
                const input = e.target.closest('.stepper__val');
                if (input) setTimeout(() => { try { input.select(); } catch (x) { /* no-op */ } }, 0);
            });
            page.addEventListener('keydown', (e) => {
                const input = e.target.closest('.stepper__val');
                if (input && e.key === 'Enter') { e.preventDefault(); input.blur(); }
            });
        }

        // Defaticamento: si chiude e si salva, senza seconda conferma (C13)
        on('skip-cooldown', 'click', () => { this._hideCooldown(); this.finishWorkout(); });
        on('complete-cooldown', 'click', () => { this._hideCooldown(); this.finishWorkout(); });
        on('cooldown-exercises', 'click', (e) => {
            const btn = e.target.closest('[data-info-name]');
            if (btn) this._openRoutineInfo(btn.dataset.infoName, 'cooldown');
        });

        // Seduta libera
        on('free-workout-close', 'click', () => this.closeFreeWorkoutModal());
        backdrop('free-workout-modal');
        on('free-workout-search', 'input', (e) => this.freeWorkoutSearch(e.target.value));
        on('free-workout-start', 'click', () => this.freeWorkoutStart());
        on('free-workout-results', 'click', (e) => {
            const btn = e.target.closest('[data-add]');
            if (btn) this.freeWorkoutAddExercise(btn.dataset.add);
        });
        on('free-workout-selected', 'click', (e) => {
            const btn = e.target.closest('[data-remove]');
            if (btn) this.freeWorkoutRemoveExercise(parseInt(btn.dataset.remove, 10));
        });
        on('free-workout-selected', 'change', (e) => {
            const input = e.target.closest('[data-field]');
            if (input) this.freeWorkoutUpdateExercise(parseInt(input.dataset.index, 10), input.dataset.field, input.value);
        });

        // Scambia, nota, dischi
        on('swap-close', 'click', () => this._closeModal('swap-modal'));
        backdrop('swap-modal');
        on('swap-body', 'click', (e) => this._onSwapClick(e));
        // Nota: × scarta; il velo non chiude se il testo è cambiato (R2-06); Esc tiene la bozza
        on('note-close', 'click', () => { this._noteDraft = null; this._closeModal('note-modal'); });
        this._closeOnBackdrop('note-modal', () => {
            if (this._noteChanged()) {
                document.getElementById('note-save')?.focus({ preventScroll: true });
                return;
            }
            this._closeModal('note-modal');
        });
        on('note-text', 'input', (e) => { if (this._noteFor) this._noteDraft = { id: this._noteFor, text: e.target.value }; });
        on('note-save', 'click', () => this._saveNote(document.getElementById('note-text')?.value || ''));
        on('note-clear', 'click', () => this._saveNote(''));
        // Ultime sedute dell'esercizio (tocco sul nome)
        on('ex-history-close', 'click', () => this._closeModal('ex-history-modal'));
        backdrop('ex-history-modal');
        on('plates-close', 'click', () => this._closeModal('plates-modal'));
        backdrop('plates-modal');
        on('plates-body', 'click', (e) => {
            const bar = e.target.closest('[data-bar]');
            if (!bar) return;
            this._platesBar = parseFloat(bar.dataset.bar);
            this._renderPlates();
        });

        // Riepilogo
        on('riep-done', 'click', () => this.closeWorkoutCompletionSummary());
        on('riep-share', 'click', () => this._shareSummary());

        // App rimasta in background ore (la PWA non si è ricaricata): si chiede, come all'avvio (R1-06)
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                this._hiddenAt = Date.now();
                return;
            }
            const since = this._hiddenAt;
            this._hiddenAt = null;
            const w = this.activeWorkout;
            if (!w || !since || !this._isStale(since)) return;
            this._askAboutOldSession(w, null, since, { live: true });
        });
    },

    // La seduta si apre solo se ce n'è una in corso
    canSeduta() {
        return !!this.activeWorkout;
    },

    enterSeduta() {
        if (!this.activeWorkout) return;
        this._setText('workout-title', this.activeWorkout.name || 'Seduta');
        this._renderAll();
    },

    // Il riepilogo ha senso solo dopo una seduta (o aperto per una seduta salvata)
    canRiepilogo() {
        return !!this.lastWorkoutSummary;
    },

    enterRiepilogo() {
        this._renderSummary();
    },

    // ========================================
    // UTILITÀ DELL'AREA
    // ========================================

    _algoFn(name) {
        try {
            return typeof TrainingAlgorithm !== 'undefined' && TrainingAlgorithm && typeof TrainingAlgorithm[name] === 'function';
        } catch (e) {
            return false;
        }
    },

    _storeFn(name) {
        return typeof Storage !== 'undefined' && typeof Storage[name] === 'function';
    },

    _gym() {
        try { return this._storeFn('getGymConfig') ? Storage.getGymConfig() : undefined; } catch (e) { return undefined; }
    },

    _exMeta(exerciseId) {
        if (this._algoFn('getExerciseMeta')) {
            try {
                const m = TrainingAlgorithm.getExerciseMeta(exerciseId);
                if (m) return m;
            } catch (e) { /* ripiego sotto */ }
        }
        return EXERCISES_DB[exerciseId] || null;
    },

    // Tipo di carico (§2.4); senza tag: corpo libero riconosciuto dalla v1.26, altrimenti null
    _loadType(exerciseId) {
        const m = this._exMeta(exerciseId);
        if (m?.loadType) return m.loadType;
        return this._isBodyweight(exerciseId) ? 'bodyweight' : null;
    },

    _isBodyweight(exerciseId) {
        const m = EXERCISES_DB[exerciseId];
        if (m?.loadType) return m.loadType === 'bodyweight' || m.loadType === 'bodyweight-loadable';
        try {
            return !!Storage.isBodyweightExercise(exerciseId);
        } catch (e) {
            return m?.category === 'corpo-libero' || !!m?.equipment?.includes('corpo-libero');
        }
    },

    _isTimed(exerciseId) {
        return this._exMeta(exerciseId)?.metric === 'time';
    },

    // Etichetta e unità del campo peso (ALGORITMO-V2 §2.4)
    _weightLabels(exerciseId) {
        switch (this._loadType(exerciseId)) {
            case 'barbell':
            case 'ez-bar': return { label: 'Peso', unit: 'kg totali' };
            case 'dumbbell-pair': return { label: 'Peso', unit: 'kg × 2' };
            case 'machine-plate': return { label: 'Dischi', unit: 'kg' };
            case 'bodyweight':
            case 'bodyweight-loadable': return { label: 'Zavorra', unit: '+ kg' };
            case 'assisted': return { label: 'Assistenza', unit: 'kg' };
            default: return { label: 'Peso', unit: 'kg' };
        }
    },

    _exLetter(ex) {
        return ex?.supersetGroup ? `${ex.supersetGroup}${ex.supersetOrder || ''}` : '';
    },

    _capFirst(s) {
        const t = String(s || '');
        return t.charAt(0).toUpperCase() + t.slice(1);
    },

    // Secondi → "1:29" (sempre minuti:secondi: si legge da lontano)
    _clock(total) {
        const s = Math.max(0, Math.round(total));
        return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    },

    // Durata della seduta → "24:13" o "1:02:05"
    _duration(total) {
        const s = Math.max(0, Math.floor(total));
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const x = String(s % 60).padStart(2, '0');
        return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${x}` : `${m}:${x}`;
    },

    // Interi con il punto delle migliaia anche a 4 cifre ("8.420"): it-IT non raggruppa sotto 10.000
    _fmtInt(n) {
        const v = Math.round(Number(n) || 0);
        return String(Math.abs(v)).replace(/\B(?=(\d{3})+(?!\d))/g, '.').replace(/^/, v < 0 ? '−' : '');
    },

    // Peso del bilanciere vuoto dell'esercizio (per dire "bilanciere" nella rampa), 0 se non c'è
    _barOf(exerciseId) {
        try { return this._storeFn('getPlates') ? Number(Storage.getPlates(exerciseId, 100)?.barKg) || 0 : 0; } catch (e) { return 0; }
    },

    _announce(text) {
        const el = document.getElementById('seduta-status');
        if (!el) return;
        el.textContent = '';
        setTimeout(() => { el.textContent = text; }, 30);
    },

    _reduceMotion() {
        return !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    },

    _range(ex) {
        try {
            const r = Storage.parseRepRange(ex?.targetReps);
            if (r?.min > 0) return r;
        } catch (e) { /* ripiego */ }
        return { min: 8, max: 12 };
    },

    _setKind(s) {
        return s?.isWarmup ? 'warm' : (s?.isCalibration ? 'calib' : 'work');
    },

    _isWork(s) {
        return !!s && !s.isWarmup && !s.isCalibration;
    },

    // ========================================
    // SESSIONE: avvio, ripresa, salvataggio continuo
    // ========================================

    // Serie di lavoro fatte (riscaldamento e prove escluse)
    _completedSetsCount(workout = this.activeWorkout) {
        if (!workout?.exercises) return 0;
        return workout.exercises.reduce((n, ex) => n + (ex.setsData || []).filter(s => s.completed && this._isWork(s)).length, 0);
    },

    _leftSetsCount(workout = this.activeWorkout) {
        if (!workout?.exercises) return 0;
        return workout.exercises.reduce((n, ex) => n + (ex.setsData || []).filter(s => !s.completed && this._isWork(s)).length, 0);
    },

    // C2: con una sessione aperta "Inizia" chiede se riprenderla o terminarla, mai la sovrascrive.
    // Restituisce true subito (la scelta arriva in un foglio).
    _promptActiveSession() {
        const w = this.activeWorkout;
        if (!w) return false;
        const done = this._completedSetsCount();
        (async () => {
            const resume = await this.confirmSheet({
                title: `${w.name} in corso`,
                text: `${done} ${done === 1 ? 'serie fatta' : 'serie fatte'}`,
                ok: 'Riprendi', cancel: 'Termina la seduta', icon: 'play'
            });
            if (resume) {
                this._closeDynamicSheets();   // R1-07: niente fogli di Oggi sopra la seduta
                this.navigateTo('seduta');
                return;
            }
            const end = await this.confirmSheet({
                title: `Terminare ${w.name}?`,
                text: `${done} ${done === 1 ? 'serie fatta' : 'serie fatte'}. Si salva quello che hai fatto.`,
                ok: 'Termina e salva', cancel: 'Continua', danger: true
            });
            if (!end || this.activeWorkout !== w) return;
            this.navigateTo('seduta');
            this.endWorkout(true);
        })();
        return true;
    },

    // Recupero di default per esercizi senza `rest` (libero, scheda manuale): dalle impostazioni
    _defaultRest(exerciseId) {
        try {
            const r = parseInt(Storage.getDefaultRest(exerciseId));
            if (r > 0) return r;
        } catch (e) { /* ripiego sotto */ }
        const s = Storage.getSettings();
        const isIsolation = EXERCISES_DB[exerciseId]?.type === 'isolation';
        return isIsolation ? (parseInt(s.restTimeIsolation) || 75) : (parseInt(s.restTimeCompound) || 120);
    },

    // ---------- seduta libera ----------

    startFreeWorkout() {
        if (this.activeWorkout) {
            this._promptActiveSession();
            return;
        }
        // La lista scelta resta se il foglio si è chiuso col velo (R2-10): si svuota solo all'avvio
        if (!Array.isArray(this.freeWorkoutExercises)) this.freeWorkoutExercises = [];
        const search = document.getElementById('free-workout-search');
        if (search) search.value = '';
        this.freeWorkoutRenderSelected();
        this.freeWorkoutSearchResults([]);
        this._openModal('free-workout-modal', '#free-workout-search');
    },

    freeWorkoutSearch(query) {
        if (!query || query.length < 2) {
            this.freeWorkoutSearchResults([]);
            return;
        }
        let found = [];
        try {
            found = typeof searchExercises === 'function' ? searchExercises(query) : Object.values(EXERCISES_DB)
                .filter(ex => String(ex.name).toLowerCase().includes(query.toLowerCase()));
        } catch (e) { found = []; }
        this.freeWorkoutSearchResults(found.filter(ex => !ex.hidden).slice(0, 15));
    },

    freeWorkoutSearchResults(results) {
        const container = document.getElementById('free-workout-results');
        if (!container) return;
        if (!results.length) {
            container.innerHTML = '<p class="faint free-list__empty">Scrivi almeno 2 lettere</p>';
            return;
        }
        const addedIds = (this.freeWorkoutExercises || []).map(e => e.id);
        container.innerHTML = results.map(ex => {
            const already = addedIds.includes(ex.id);
            return `
                <div class="row free-row">
                    <span class="row__body">
                        <span class="row__title">${GT.esc(ex.name)}</span>
                        <span class="row__sub">${GT.esc((ex.primaryMuscles || []).map(m => this._capFirst(m)).join(' · '))}</span>
                    </span>
                    ${already ? `<span class="tag tag--ok">${this.ico('check')}Scelto</span>`
                        : `<button type="button" class="btn btn--secondary btn--icon" data-add="${GT.esc(ex.id)}" aria-label="Aggiungi ${GT.esc(ex.name)}">${this.ico('plus')}</button>`}
                </div>
            `;
        }).join('');
    },

    freeWorkoutAddExercise(exerciseId) {
        const exercise = EXERCISES_DB[exerciseId];
        if (!exercise) return;
        if (this.freeWorkoutExercises.find(e => e.id === exerciseId)) return;
        const isCompound = exercise.type === 'compound';
        this.freeWorkoutExercises.push({
            id: exerciseId,
            name: exercise.name,
            sets: isCompound ? 4 : 3,
            reps: isCompound ? '6-10' : '10-15',
            rest: this._defaultRest(exerciseId)
        });
        this.freeWorkoutRenderSelected();
        const query = document.getElementById('free-workout-search')?.value;
        if (query) this.freeWorkoutSearch(query);
    },

    freeWorkoutRemoveExercise(index) {
        this.freeWorkoutExercises.splice(index, 1);
        this.freeWorkoutRenderSelected();
        const query = document.getElementById('free-workout-search')?.value;
        if (query) this.freeWorkoutSearch(query);
    },

    freeWorkoutRenderSelected() {
        const container = document.getElementById('free-workout-selected');
        if (!container) return;
        if (!this.freeWorkoutExercises?.length) {
            container.innerHTML = '<p class="faint free-list__empty">Nessun esercizio</p>';
            return;
        }
        container.innerHTML = this.freeWorkoutExercises.map((ex, i) => `
            <div class="free-sel">
                <div class="free-sel__top">
                    <span class="row__title">${GT.esc(ex.name)}</span>
                    <button type="button" class="btn btn--ghost btn--icon" data-remove="${i}" aria-label="Togli ${GT.esc(ex.name)}">${this.ico('close')}</button>
                </div>
                <div class="free-sel__params">
                    <label class="field"><span class="label">Serie</span><input class="input" type="number" inputmode="numeric" min="1" max="10" value="${GT.esc(ex.sets)}" data-index="${i}" data-field="sets"></label>
                    <label class="field"><span class="label">Ripetizioni</span><input class="input" type="text" inputmode="text" autocomplete="off" maxlength="9" value="${GT.esc(ex.reps)}" data-index="${i}" data-field="reps"></label>
                    <label class="field"><span class="label">Recupero s</span><input class="input" type="number" inputmode="numeric" min="15" max="600" step="15" value="${GT.esc(ex.rest)}" data-index="${i}" data-field="rest"></label>
                </div>
            </div>
        `).join('');
    },

    freeWorkoutUpdateExercise(index, field, value) {
        const ex = this.freeWorkoutExercises[index];
        if (!ex) return;
        if (field === 'sets') ex.sets = this._clampInt(value, 3, 1, 10);
        else if (field === 'rest') ex.rest = this._clampInt(value, this._defaultRest(ex.id), 15, 600);
        else if (field === 'reps') ex.reps = this._cleanReps(value, ex.reps || '8-12');
        this.freeWorkoutRenderSelected();
    },

    freeWorkoutStart() {
        if (!this.freeWorkoutExercises?.length) {
            this.showNotification('Aggiungi almeno un esercizio', 'warning');
            return;
        }
        const workout = {
            type: 'Seduta libera',
            isFreeWorkout: true,
            exercises: this.freeWorkoutExercises.map(ex => ({
                exerciseId: ex.id,
                name: ex.name,
                sets: this._clampInt(ex.sets, 3, 1, 10),
                reps: this._cleanReps(ex.reps, '8-12'),
                rest: this._clampInt(ex.rest, this._defaultRest(ex.id), 15, 600),
                type: EXERCISES_DB[ex.id]?.type
            }))
        };
        this._closeModal('free-workout-modal');
        this.freeWorkoutExercises = [];
        this.startWorkout(workout);
    },

    closeFreeWorkoutModal() {
        this._closeModal('free-workout-modal');
    },

    // ---------- fase del ciclo ----------

    // Fase di oggi (scarico manuale compreso): Storage v2, poi il calcolo di Oggi, poi il ciclo
    _sessionPhase(cycleInfo, isDeload) {
        if (!cycleInfo) return null;
        try {
            if (this._storeFn('getCurrentPhase')) {
                const p = Storage.getCurrentPhase();
                if (p) return p;
            }
        } catch (e) { /* ripiego */ }
        if (typeof this._currentPhase === 'function') return this._currentPhase(cycleInfo, isDeload);
        return cycleInfo.currentPhase || null;
    },

    _phaseKey(phase) {
        const p = String(phase?.phase || phase || '').toLowerCase();
        if (p.startsWith('deload') || p.startsWith('scarico')) return 'deload';
        if (p.startsWith('intens')) return 'intensification';
        if (p.startsWith('accum')) return 'accumulation';
        return p || null;
    },

    // Copia del giorno con le serie e il RIR della fase (applyPhaseToDay v2, ripiego v1.26)
    _phaseDay(day, phase) {
        if (!day || !phase) return day;
        if (this._algoFn('applyPhaseToDay')) {
            try {
                const profile = Storage.getProfile();
                const out = TrainingAlgorithm.applyPhaseToDay(day, phase, { painAreas: profile.painAreas || [] });
                if (out && Array.isArray(out.exercises)) return out;
            } catch (e) {
                console.warn('applyPhaseToDay', e);
            }
        }
        if (typeof this._applyPhase === 'function') return this._applyPhase(day, phase);
        return day;
    },

    _phaseRir(phase, exerciseId) {
        if (!phase) return null;
        if (this._phaseKey(phase) === 'deload') return 4;
        const compound = EXERCISES_DB[exerciseId]?.type === 'compound';
        if (phase.rir && Number.isFinite(Number(compound ? phase.rir.compound : phase.rir.isolation))) {
            return Number(compound ? phase.rir.compound : phase.rir.isolation);
        }
        const min = Number(phase.rirTarget?.min);
        return Number.isFinite(min) ? min : null;
    },

    // Ruolo dal giorno generato; per le schede vecchie: primo multiarticolare = main
    _assignRoles(exercises) {
        let mainSeen = exercises.some(ex => ex.role === 'main');
        exercises.forEach(ex => {
            if (['main', 'secondary', 'accessory', 'core'].includes(ex.role)) return;
            const data = EXERCISES_DB[ex.exerciseId] || {};
            const core = ex.isCore || (data.primaryMuscles || []).includes('addome');
            if (core) { ex.role = 'core'; return; }
            const compound = (ex.type || data.type) === 'compound';
            if (compound && !mainSeen) { ex.role = 'main'; mainSeen = true; return; }
            ex.role = compound ? 'secondary' : 'accessory';
        });
    },

    // ---------- avvio ----------

    /**
     * Avvia una sessione.
     * @param {Object} workout - giorno della scheda, seduta libera o simulazione
     * @param {{dayIndex?:number, minutes?:number, isSimulation?:boolean}} opts
     *   minutes: "ho poco tempo" → la seduta viene compressa a quei minuti (TrainingAlgorithm.compressDay)
     */
    startWorkout(workout, opts = {}) {
        if (this.activeWorkout) {
            this._promptActiveSession();
            return;
        }
        if (!workout?.exercises?.length) {
            this.showNotification('Nessun esercizio in questo giorno', 'warning');
            return;
        }
        const meta = opts || {};
        const isFree = !!workout.isFreeWorkout;
        const isSimulation = !!meta.isSimulation;
        const profile = Storage.getProfile();
        const program = (!isFree && !isSimulation) ? Storage.getActiveProgram() : null;
        const cycleInfo = program?.metadata?.cycle ? Storage.getCycleInfo() : null;
        const isDeload = cycleInfo ? Storage.isDeloadActive() : false;
        const phase = cycleInfo ? this._sessionPhase(cycleInfo, isDeload) : null;
        const goal = program?.metadata?.goal || workout.goal || profile.goal || 'hypertrophy';
        let day = phase ? this._phaseDay(workout, phase) : workout;

        // "Ho poco tempo": seduta compressa ai minuti scelti
        const minutes = parseInt(meta.minutes, 10);
        let compressed = false;
        let compressInfo = null;
        if (minutes > 0 && this._algoFn('compressDay')) {
            try {
                const coreDaysElsewhere = (program?.days || []).filter((d, i) => i !== meta.dayIndex &&
                    (d.exercises || []).some(ex => ex.isCore || ex.role === 'core' || (EXERCISES_DB[ex.exerciseId]?.primaryMuscles || []).includes('addome'))).length;
                const ctx = { goal, emphasis: profile.emphasis || program?.metadata?.emphasis || '', coreDaysElsewhere };
                if (day.warmupMin != null) ctx.warmupMin = day.warmupMin;
                const res = TrainingAlgorithm.compressDay(day, minutes, ctx);
                if (res?.day && Array.isArray(res.day.exercises) && res.day.exercises.length) {
                    day = res.day;
                    compressed = !!(res.changes && res.changes.length);
                    compressInfo = { estimatedMinutes: res.estimatedMinutes, fits: res.fits !== false };
                }
            } catch (e) {
                console.warn('compressDay', e);
            }
        }
        const sessionMinutes = minutes > 0 ? minutes : (parseInt(program?.metadata?.sessionDuration, 10) || parseInt(profile.sessionTime, 10) || 60);
        const name = workout.type || workout.name || 'Seduta';

        const exercises = day.exercises.map(ex => {
            const original = workout.exercises.find(o => o.exerciseId === ex.exerciseId) || ex;
            const originalSets = this._clampInt(original.sets, 3, 1, 10);
            const sets = this._clampInt(ex.sets, originalSets, 1, 10);
            const reps = this._cleanReps(ex.targetReps || ex.reps, '8-12');
            const rir = Number(ex.targetRir);
            const metaEx = this._exMeta(ex.exerciseId);
            return {
                ...ex,
                type: ex.type || EXERCISES_DB[ex.exerciseId]?.type || 'compound',
                rest: this._clampInt(ex.rest, this._defaultRest(ex.exerciseId), 10, 900),
                reps,
                targetReps: reps,
                originalSets,
                targetSets: sets,
                sets,
                targetRir: ex.targetRir !== undefined && ex.targetRir !== null && Number.isFinite(rir) ? rir : this._phaseRir(phase, ex.exerciseId),
                metric: ex.metric || metaEx?.metric || 'reps',
                substitutedFrom: ex.substitutedFrom || null,
                openSet: null,
                setsData: Array.from({ length: sets }, () => ({ weight: '', reps: '', completed: false }))
            };
        });
        this._assignRoles(exercises);

        // Rampa di riscaldamento (§11, R3-09): il fondamentale con la rampa intera; il primo
        // multiarticolare di un'altra regione con una sola serie d'avvicinamento (getRampPlan di G5)
        let plan = null;
        if (this._algoFn('getRampPlan')) {
            try { plan = TrainingAlgorithm.getRampPlan(exercises); } catch (e) { plan = null; }
        }
        if (Array.isArray(plan)) {
            plan.forEach(p => {
                const ex = exercises[p?.index];
                if (ex && (!p.exerciseId || p.exerciseId === ex.exerciseId)) ex.wantsRamp = p.kind === 'single' ? 'single' : 'full';
            });
        } else {
            const rampAt = exercises.findIndex(ex => ex.role === 'main' && !ex.supersetGroup);
            if (rampAt >= 0) exercises[rampAt].wantsRamp = 'full';
        }

        const activeWorkout = {
            name,
            type: name,
            focus: workout.focus || '',
            warmup: day.warmup || workout.warmup || null,
            dayIndex: Number.isInteger(meta.dayIndex) ? meta.dayIndex : null,
            programId: program?.metadata?.programId ?? null,
            cycleNumber: cycleInfo ? (program.metadata.cycleNumber || 1) : null,
            cycleWeek: cycleInfo ? cycleInfo.currentWeek : null,
            isFreeWorkout: isFree,
            isSimulation,
            goal,
            startTime: Date.now(),
            sessionMinutes,
            compressed,
            cycleInfo: cycleInfo ? { currentWeek: cycleInfo.currentWeek, duration: cycleInfo.duration } : null,
            phase: phase ? {
                phase: phase.phase,
                phaseName: phase.phaseName,
                rirTarget: phase.rirTarget || null,
                volumeMultiplier: phase.volumeMultiplier ?? 1
            } : null,
            cyclePhase: phase ? this._phaseKey(phase) : null,
            isDeload,
            warmupHidden: false,
            warmupCollapsed: false,
            exercises
        };

        this._enterWorkout(activeWorkout, null);
        if (compressInfo) {
            const est = Math.round(compressInfo.estimatedMinutes || minutes);
            this.showNotification(compressInfo.fits ? `Seduta da circa ${est} min` : `Circa ${est} min: più di ${minutes}`, compressInfo.fits ? 'info' : 'warning', { icon: 'timer' });
        }
    },

    // Entra nella sessione (nuova o ripresa): interfaccia, orologio, schermo acceso
    _enterWorkout(workout, session) {
        // Fogli al volo di altre pagine (es. "Ciclo 1 fatto") non restano sopra la seduta (R1-07)
        this._closeDynamicSheets();
        this.activeWorkout = workout;
        const max = workout.exercises.length - 1;
        this.currentExerciseIndex = Math.max(0, Math.min(max, parseInt(session?.currentExerciseIndex) || 0));
        this._ctxCache = {};
        this._restMeta = null;
        this._mediaOpen = false;
        this._renderedHeadFor = null;
        this._dockLockUntil = 0;
        this._buildSupersetMap();
        if (!Array.isArray(workout.calibPlan)) this._planCalibration(workout);

        document.getElementById('workout-active').style.display = 'block';
        this._hideCooldown();

        this._bindBeforeUnload();
        this._startWorkoutClock();
        this._setKeepAwake(true);
        this.displayWarmup();
        this._renderAll();

        // Recupero ancora in corso quando l'app si è chiusa: riparte da dove era
        const rest = session?.rest;
        if (rest?.endAt && !rest.expired && rest.endAt - Date.now() > -300000) {
            this._startRest({ ...rest, seconds: Math.round((rest.endAt - Date.now()) / 1000), resumeEndAt: rest.endAt });
        }

        this.navigateTo('seduta');
        this._persistSession();
        if (typeof this.updateQuickAction === 'function') this._safe(() => this.updateQuickAction());
    },

    _buildSupersetMap() {
        this._supersetGroupMap = {};
        (this.activeWorkout?.exercises || []).forEach((ex, i) => {
            if (!ex.supersetGroup) return;
            (this._supersetGroupMap[ex.supersetGroup] = this._supersetGroupMap[ex.supersetGroup] || []).push(i);
        });
        Object.keys(this._supersetGroupMap).forEach(g => {
            if (this._supersetGroupMap[g].length < 2) delete this._supersetGroupMap[g];
        });
    },

    _group(exIdx) {
        const ex = this.activeWorkout?.exercises?.[exIdx];
        return ex?.supersetGroup ? (this._supersetGroupMap[ex.supersetGroup] || null) : null;
    },

    // Sessione salvata a ogni modifica (C6): se iOS chiude la PWA non si perde nulla
    _persistSession() {
        if (!this.activeWorkout) return;
        try {
            const saved = Storage.saveActiveSession({
                version: 2,
                workout: this.activeWorkout,
                currentExerciseIndex: this.currentExerciseIndex,
                rest: this._restMeta ? { ...this._restMeta } : null,
                touchedAt: Date.now()
            });
            if (saved === false && !this._sessionSaveWarned) {
                this._sessionSaveWarned = true;
                this.showNotification('Memoria piena: la seduta non si salva', 'warning');
            } else if (saved !== false) {
                this._sessionSaveWarned = false;
            }
        } catch (e) {
            console.warn('Sessione non salvata', e);
        }
    },

    // Sessione della v1.26 o rotta: campi mancanti e convenzione del corpo libero (zavorra)
    _normalizeSession(w) {
        w.name = w.name || w.type || 'Seduta';
        w.startTime = Number(w.startTime) || Date.now();
        w.exercises.forEach(ex => {
            if (!Array.isArray(ex.setsData)) {
                ex.setsData = Array.from({ length: this._clampInt(ex.targetSets || ex.sets, 3, 1, 10) }, () => ({ weight: '', reps: '', completed: false }));
            }
            ex.targetReps = this._cleanReps(ex.targetReps || ex.reps, '8-12');
            ex.targetSets = this._clampInt(ex.targetSets, ex.setsData.filter(s => this._isWork(s)).length || 3, 1, 12);
            if (!Number.isInteger(ex.openSet)) ex.openSet = null;
            const lt = this._loadType(ex.exerciseId);
            if (lt === 'bodyweight' || lt === 'bodyweight-loadable') {
                ex.setsData.forEach(s => {
                    if (!s.completed && s.isBodyweight) { s.weight = 0; delete s.isBodyweight; }
                });
            }
        });
        if (!w.exercises.some(ex => ex.role)) this._assignRoles(w.exercises);
    },

    // All'avvio: riprende la sessione rimasta aperta. Se è vecchia (>12 h) chiede cosa farne (in un foglio).
    restoreActiveSession() {
        let session = null;
        try {
            session = Storage.getActiveSession();
        } catch (e) {
            return false;
        }
        const w = session?.workout;
        if (!w || !Array.isArray(w.exercises) || !w.exercises.length) {
            if (session) Storage.clearActiveSession();
            return false;
        }
        this._normalizeSession(w);

        const lastTouch = Number(session.touchedAt) || Date.parse(session.savedAt) || w.startTime;
        if (this._isStale(lastTouch)) {
            setTimeout(() => this._askAboutOldSession(w, session, lastTouch), 0);
            return false;
        }

        this._enterWorkout(w, session);
        this.showNotification(`${w.name} ripresa`, 'info', { icon: 'play' });
        return true;
    },

    // Seduta "vecchia" (R1-06): toccata ieri (o prima) o ferma da più di 2 ore → si chiede cosa farne
    _isStale(lastTouch) {
        const t = Number(lastTouch);
        if (!(t > 0)) return false;
        const now = Date.now();
        return now - t > 2 * 3600000 || new Date(t).toDateString() !== new Date(now).toDateString();
    },

    /**
     * Seduta rimasta aperta: Riprendi (il tempo fermo non conta nella durata) o Chiudi (si salva com'era,
     * con la data e l'ora dell'ultimo tocco). opts.live: la seduta è già in memoria (app tornata in primo piano).
     */
    async _askAboutOldSession(w, session, lastTouch, opts = {}) {
        const live = !!opts.live;
        if (live ? this.activeWorkout !== w : this.activeWorkout) return;
        const still = () => (live ? this.activeWorkout === w : !this.activeWorkout);
        const done = this._completedSetsCount(w);
        const when = String(GT.formatRelativeDay(new Date(lastTouch)) || '').toLowerCase();
        const resume = await this.confirmSheet({
            title: `${w.name} di ${when} è ancora aperta`,
            text: `${done} ${done === 1 ? 'serie fatta' : 'serie fatte'}`,
            ok: 'Riprendi', cancel: 'Chiudi la seduta', icon: 'play'
        });
        if (!still()) return;
        if (resume) {
            // le ore ferme non sono seduta: l'orologio riparte da dove era
            const gap = Date.now() - Number(lastTouch);
            if (gap > 0) w.startTime = Math.min(Date.now(), (Number(w.startTime) || Number(lastTouch)) + gap);
            if (live) {
                this._startWorkoutClock();
                this._persistSession();
            } else {
                this._enterWorkout(w, session);
            }
            return;
        }
        if (done > 0) {
            const save = await this.confirmSheet({
                title: `Salvare ${w.name} di ${when}?`,
                text: `${done} ${done === 1 ? 'serie fatta' : 'serie fatte'}`,
                ok: 'Salva', cancel: 'Scarta'
            });
            if (!still()) return;
            if (save) {
                if (!live) this._enterWorkout(w, session);
                this.finishWorkout({ date: new Date(lastTouch), endTime: lastTouch });
                return;
            }
        }
        if (live) this._teardownWorkout();
        else Storage.clearActiveSession();
        this.showNotification('Seduta scartata', 'info');
    },

    // Fogli creati al volo da altre pagine (fine ciclo, conferme): chiusi quando si entra in seduta
    _closeDynamicSheets() {
        if (this._confirmResolve) this._safe(() => this._confirmResolve(false));
        document.querySelectorAll('.modal--dyn').forEach(m => {
            if (m.id) this._removeDynamicModal(m.id);
            else m.remove();
        });
        this._syncSheets?.();
    },

    // ---------- dock: niente doppio tocco (R1-08) ----------

    _lockDock(ms = 500) {
        this._dockLockUntil = Date.now() + ms;
    },

    _dockLocked() {
        return Number(this._dockLockUntil) > Date.now();
    },

    // ---------- "Trova il peso" distribuito (R3-06): al massimo 2-3 esercizi per seduta ----------

    /**
     * Quali esercizi calibrare in questa seduta: Storage.planCalibration di G5 se c'è; altrimenti i
     * primi 2 multiarticolari senza storico che lo chiedono. Gli altri partono dalla stima.
     */
    _planCalibration(workout) {
        const exs = workout?.exercises || [];
        let ids = null;
        let extra = null;
        if (this._storeFn('planCalibration')) {
            try {
                const res = Storage.planCalibration({ ...workout, exercises: exs }, {
                    goal: workout.goal, minutes: workout.sessionMinutes, compressed: !!workout.compressed
                });
                const list = Array.isArray(res) ? res : (res?.exerciseIds || res?.ids || res?.calibrate || res?.exercises);
                if (Array.isArray(list)) {
                    ids = list.map(x => (typeof x === 'string' ? x : (Number.isInteger(x) ? exs[x]?.exerciseId : (x?.exerciseId ?? exs[x?.index]?.exerciseId)))).filter(Boolean);
                    extra = Number(res?.extraMinutes ?? res?.extraMin ?? res?.minutes);
                }
            } catch (e) {
                console.warn('planCalibration', e);
                ids = null;
            }
        }
        if (!ids) {
            ids = [];
            exs.forEach(ex => {
                if (ids.length >= 2 || ids.includes(ex.exerciseId)) return;
                if ((ex.type || EXERCISES_DB[ex.exerciseId]?.type) !== 'compound') return;
                const sug = this._exerciseContext(ex).suggestion;
                if (sug?.calibrate) ids.push(ex.exerciseId);
            });
        }
        workout.calibPlan = [...new Set(ids)];
        if (Number.isFinite(extra) && extra > 0) workout.calibExtraMin = extra;
        return workout.calibPlan;
    },

    _calibPlanned(exercise) {
        const plan = this.activeWorkout?.calibPlan;
        return !Array.isArray(plan) || plan.includes(exercise.exerciseId);
    },

    _bindBeforeUnload() {
        if (this._beforeUnloadHandler) return;
        this._beforeUnloadHandler = (e) => {
            this._persistSession();
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', this._beforeUnloadHandler);
    },

    _unbindBeforeUnload() {
        if (!this._beforeUnloadHandler) return;
        window.removeEventListener('beforeunload', this._beforeUnloadHandler);
        this._beforeUnloadHandler = null;
    },

    // Orologio della sessione calcolato da startTime: esatto anche dopo una ripresa
    _startWorkoutClock() {
        this._stopWorkoutClock();
        const el = document.getElementById('workout-timer');
        const tick = () => {
            if (!this.activeWorkout || !el) return;
            el.textContent = this._duration((Date.now() - this.activeWorkout.startTime) / 1000);
        };
        tick();
        this._workoutClock = setInterval(tick, 1000);
    },

    _stopWorkoutClock() {
        if (this._workoutClock) {
            clearInterval(this._workoutClock);
            this._workoutClock = null;
        }
    },

    _setKeepAwake(on) {
        try {
            const want = !!on && Storage.getSettings().keepAwake !== false;
            Timer.keepScreenOn(want);
        } catch (e) {
            /* wake lock non disponibile: nessun problema */
        }
    },

    // Chiude la sessione in ogni caso (fine, annullo, 0 serie): un solo punto, un solo sistema
    // di visibilità (style.display) — C1. opts.to: pagina dove andare (Oggi se non indicata).
    _teardownWorkout(opts = {}) {
        this._stopRest();
        this._stopWorkoutClock();
        this._unbindBeforeUnload();
        try { Storage.clearActiveSession(); } catch (e) { /* no-op */ }
        this.activeWorkout = null;
        if (!this.conditioningState.startedAt) this._setKeepAwake(false);
        this.currentExerciseIndex = 0;
        this._supersetGroupMap = {};
        this._ctxCache = null;
        this._renderedHeadFor = null;
        this._mediaOpen = false;
        this._swapUndo = null;

        document.getElementById('workout-active').style.display = 'none';
        this._hideCooldown();
        ['session-more-modal', 'swap-modal', 'note-modal', 'plates-modal', 'ex-history-modal'].forEach(id => this._closeModal(id));
        this._dismissToast('_rirToast');
        this._noteDraft = null;
        ['ex-head', 'ex-sets'].forEach(id => { const el = document.getElementById(id); if (el) el.innerHTML = ''; });
        if (typeof this.updateQuickAction === 'function') this._safe(() => this.updateQuickAction());
        // La seduta è a tutto schermo: chiusa, non resta una pagina vuota
        if (this.currentPage === 'seduta') this.navigateTo(opts.to || 'oggi', { replace: true });
    },

    /** Annulla la sessione senza salvare (conferma che nomina cosa si perde) */
    async cancelWorkout() {
        const w = this.activeWorkout;
        if (!w) return;
        const done = this._completedSetsCount();
        const ok = await this.confirmSheet({
            title: `Annullare ${w.name}?`,
            text: done > 0 ? `${done} ${done === 1 ? 'serie fatta' : 'serie fatte'}: non si salvano` : 'Non si salva niente.',
            ok: 'Annulla la seduta', cancel: 'Continua', danger: true
        });
        if (!ok || this.activeWorkout !== w) return;
        this._teardownWorkout();
        this.showNotification(`${w.name} annullata`, 'info');
    },

    // ========================================
    // RISCALDAMENTO GENERALE (routine ridotta alla durata della seduta, se Warmups lo sa fare)
    // ========================================

    // "60 sec" → "60 s", "15 reps" → "15 rip.": stessa lingua del resto della seduta
    _routineDose(ex) {
        const d = String(ex.duration || (ex.durationSec ? `${ex.durationSec} s` : ''))
            .replace(/\bsec(ondi)?\b/gi, 's').replace(/\breps?\b/gi, 'rip.').replace(/\bper lato\b/gi, 'per lato');
        return ex.sets > 1 ? `${ex.sets} × ${d}` : d;
    },

    _routineRows(exercises) {
        return (exercises || []).map(ex => `
            <li class="warm__item">
                <span class="warm__name">${GT.esc(ex.name)}</span>
                <span class="warm__dose num">${GT.esc(this._routineDose(ex))}</span>
                <button type="button" class="btn btn--ghost btn--icon warm__info" data-info-name="${GT.esc(ex.name)}" aria-label="Come si fa: ${GT.esc(ex.name)}">${this.ico('info')}</button>
            </li>
        `).join('');
    },

    displayWarmup() {
        const section = document.getElementById('warmup-section');
        const container = document.getElementById('warmup-exercises');
        if (!section || !container) return;
        const w = this.activeWorkout;
        const key = w?.warmup || 'full-body';
        let routine = null;
        try {
            if (typeof Warmups.getWarmupForDuration === 'function') routine = Warmups.getWarmupForDuration(key, w?.sessionMinutes || 60);
        } catch (e) { routine = null; }
        if (!routine) {
            try { routine = Warmups.getWarmupByMuscle(key) || Warmups.WARMUPS_DB?.['full-body']; } catch (e) { routine = null; }
        }
        if (!routine || !routine.exercises?.length) {
            section.hidden = true;
            return;
        }
        container.innerHTML = this._routineRows(routine.exercises);
        let minutes = Number(routine.durationMin);
        if (!(minutes > 0)) {
            try { minutes = Warmups.getWarmupDurationMin(key); } catch (e) { minutes = null; }
        }
        const n = routine.exercises.length;
        this._setText('warmup-sub', `${minutes > 0 ? `${Math.round(minutes)} min · ` : ''}${n} ${n === 1 ? 'esercizio' : 'esercizi'}`);
        section.hidden = !!w?.warmupHidden;
        this._setWarmupCollapsed(!!w?.warmupCollapsed);
    },

    // Il riscaldamento generale è la cosa da fare adesso: aperto, nessuna serie ancora fatta e nessuna
    // serie aperta a mano (chi tocca una serie vuole registrare quella)
    _warmupPending() {
        const w = this.activeWorkout;
        const section = document.getElementById('warmup-section');
        if (!w || !section || section.hidden || w.warmupHidden || w.warmupCollapsed) return false;
        if (w.exercises.some(ex => (ex.setsData || []).some(s => s.completed))) return false;
        return !Number.isInteger(this._currentExercise()?.openSet);
    },

    // "Riscaldamento fatto" nel dock: il riquadro sparisce, il dock passa alla prima serie
    _warmupDone() {
        const section = document.getElementById('warmup-section');
        if (section) section.hidden = true;
        if (!this.activeWorkout) return;
        this.activeWorkout.warmupHidden = true;
        this._lockDock();
        this._persistSession();
        this._renderDock();
        this._announce('Riscaldamento fatto');
    },

    _setWarmupCollapsed(collapsed) {
        const section = document.getElementById('warmup-section');
        if (section) section.classList.toggle('collapsed', collapsed);
        document.getElementById('warmup-header')?.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
        if (this.activeWorkout) this.activeWorkout.warmupCollapsed = collapsed;
    },

    _openRoutineInfo(name, type) {
        if (typeof this.showExerciseInfoModal === 'function') this.showExerciseInfoModal(null, name, type);
    },

    // ========================================
    // CONTESTO DELL'ESERCIZIO: suggerimento, volta scorsa, pesi registrati (letti una volta)
    // ========================================

    _currentExercise() {
        return this.activeWorkout?.exercises?.[this.currentExerciseIndex] || null;
    },

    // Serie di lavoro dell'ultima seduta salvata con quell'esercizio (per la "volta scorsa" per posizione)
    _lastSessionSets(exerciseId) {
        try {
            for (const w of Storage.getWorkouts()) {
                if (!Array.isArray(w.exercises)) continue;
                const sets = [];
                w.exercises.forEach(ex => {
                    if (ex?.exerciseId !== exerciseId || !Array.isArray(ex.sets)) return;
                    ex.sets.forEach(s => {
                        if (s?.completed && !s.isWarmup && !s.isCalibration && GT.num(s.reps) > 0) {
                            sets.push({ weight: s.isBodyweight ? 0 : Math.max(0, GT.num(s.weight)), reps: Math.round(GT.num(s.reps)), rir: s.rir });
                        }
                    });
                });
                if (sets.length) return { date: w.date, sets };
            }
        } catch (e) { /* storico illeggibile: niente volta scorsa */ }
        return null;
    },

    _exerciseContext(exercise) {
        const id = exercise.exerciseId;
        if (!this._ctxCache) this._ctxCache = {};
        let cached = this._ctxCache[id];
        if (!cached) {
            const w = this.activeWorkout;
            const goal = w?.goal || Storage.getActiveProgram()?.metadata?.goal || Storage.getProfile().goal || 'hypertrophy';
            let suggestion = null;
            try {
                const opts = { level: Storage.getProfile().level };
                if (Number.isFinite(Number(exercise.targetRir)) && exercise.targetRir !== null) opts.targetRir = Number(exercise.targetRir);
                suggestion = Storage.getProgressionSuggestion(id, exercise.targetReps, goal, opts);
            } catch (e) {
                console.warn('getProgressionSuggestion', e);
            }
            cached = { suggestion, last: this._lastSessionSets(id) };
            this._ctxCache[id] = cached;
        }
        return cached;
    },

    // Peso di partenza: quello suggerito dalla progressione (C8/N15), non l'ultimo
    _suggestedWeight(exercise) {
        if (Number.isFinite(Number(exercise.presetKg)) && exercise.presetKg !== null) return Math.max(0, Number(exercise.presetKg));
        const ctx = this._exerciseContext(exercise);
        const sw = Number(ctx.suggestion?.suggestedWeight);
        if (Number.isFinite(sw) && sw >= 0 && ctx.suggestion?.suggestedWeight !== null && ctx.suggestion?.suggestedWeight !== '') return sw;
        const lastTop = ctx.last?.sets?.reduce((m, s) => Math.max(m, s.weight), 0);
        if (lastTop > 0) return lastTop;
        return this._isBodyweight(exercise.exerciseId) ? 0 : null;
    },

    // Ripetizioni (o secondi) proposte per la serie di lavoro n (0 = la prima)
    _suggestedReps(exercise, n) {
        const sug = this._exerciseContext(exercise).suggestion;
        const per = sug?.suggestedRepsPerSet;
        const v = Array.isArray(per) && per.length ? per[Math.min(n, per.length - 1)] : sug?.suggestedReps;
        if (Number.isFinite(parseInt(v, 10)) && parseInt(v, 10) > 0) return parseInt(v, 10);
        return this._range(exercise).min;
    },

    _targetRir(exercise) {
        const t = Number(exercise.targetRir);
        if (exercise.targetRir !== null && exercise.targetRir !== undefined && Number.isFinite(t)) return Math.max(0, Math.min(4, t));
        const s = Number(this._exerciseContext(exercise).suggestion?.targetRir);
        return Number.isFinite(s) ? Math.max(0, Math.min(4, s)) : 2;
    },

    // Prima volta che l'esercizio si vede: peso e ripetizioni proposti, poi "Trova il peso" o rampa
    _prefill(exercise) {
        if (exercise.prefilled) return;
        exercise.prefilled = true;
        const w0 = this._suggestedWeight(exercise);
        let n = 0;
        exercise.setsData.forEach(s => {
            if (!this._isWork(s)) return;
            const k = n++;
            if (s.completed || s.touched) return;
            if ((s.weight === '' || s.weight == null) && w0 != null) s.weight = w0;
            if (s.reps === '' || s.reps == null) s.reps = this._suggestedReps(exercise, k);
        });
        if (exercise.targetRir === null || exercise.targetRir === undefined) {
            const t = Number(this._exerciseContext(exercise).suggestion?.targetRir);
            if (Number.isFinite(t)) exercise.targetRir = t;
        }
        const sug = this._exerciseContext(exercise).suggestion;
        const anyDone = exercise.setsData.some(s => s.completed);
        // "Trova il peso" solo sugli esercizi scelti per questa seduta (R3-06); gli altri partono dalla stima
        if (!anyDone && sug?.calibrate && !exercise.calib && !Number.isFinite(Number(exercise.presetKg)) && this._calibPlanned(exercise)) {
            if (this._startCalibration(exercise, { seedKg: w0, testReps: sug.testReps })) return;
        }
        if (!anyDone && exercise.wantsRamp && !exercise.rampBuilt && !exercise.calib) this._buildRamp(exercise);
    },

    // ========================================
    // RAMPA DI RISCALDAMENTO (§11): serie grigie isWarmup, recupero 60 s
    // ========================================

    // Rampa per il peso di lavoro W con le ripetizioni proposte oggi (non il minimo del range, R3-09):
    // al massimo 4 serie (il bilanciere e le 3 più vicine), 2 nella seduta corta, 1 per "single"
    _rampSets(exercise, workingKg) {
        const W = Number(workingKg);
        if (!(W > 0)) return [];
        const goal = this.activeWorkout?.goal || 'hypertrophy';
        const single = exercise.wantsRamp === 'single';
        const reps = this._suggestedReps(exercise, 0);
        const target = Number.isFinite(reps) && reps > 0 ? reps : exercise.targetReps;
        let ramp = [];
        try {
            if (this._storeFn('getWarmupSets')) ramp = Storage.getWarmupSets(exercise.exerciseId, W, target, goal, { single }) || [];
            else if (this._algoFn('buildWarmupSets')) ramp = TrainingAlgorithm.buildWarmupSets(exercise.exerciseId, W, target, goal, this._gym(), { single }) || [];
        } catch (e) {
            console.warn('rampa', e);
            ramp = [];
        }
        if (!Array.isArray(ramp)) return [];
        if (single && ramp.length > 1) ramp = ramp.slice(-1);
        if (this.activeWorkout?.compressed && ramp.length > 2) ramp = ramp.slice(-2);
        if (ramp.length > 4) ramp = [ramp[0], ...ramp.slice(-3)];
        return ramp;
    },

    _buildRamp(exercise) {
        exercise.rampBuilt = true;
        const first = exercise.setsData.find(s => this._isWork(s));
        const ramp = this._rampSets(exercise, GT.num(first?.weight));
        if (!ramp.length) return;
        const sets = ramp.map(r => ({ weight: Number(r.kg), reps: parseInt(r.reps, 10) || 5, completed: false, isWarmup: true, pct: r.pct }));
        const at = exercise.setsData.findIndex(s => this._isWork(s));
        exercise.setsData.splice(at < 0 ? 0 : at, 0, ...sets);
    },

    // Peso di lavoro cambiato prima di iniziare la rampa: la rampa lo segue (stesso numero di serie)
    _maybeRefreshRamp(exercise, idx) {
        if (!exercise.rampBuilt || exercise.setsData.some(s => s.isWarmup && s.completed)) return false;
        const firstWork = exercise.setsData.findIndex(s => this._isWork(s));
        if (idx !== firstWork) return false;
        const warm = exercise.setsData.filter(s => s.isWarmup && !s.touched);
        if (!warm.length) return false;
        const ramp = this._rampSets(exercise, GT.num(exercise.setsData[idx].weight));
        if (ramp.length !== warm.length) return false;
        warm.forEach((s, k) => { s.weight = Number(ramp[k].kg); s.reps = parseInt(ramp[k].reps, 10) || s.reps; s.pct = ramp[k].pct; });
        return true;
    },

    // ========================================
    // "TROVA IL PESO" (§10.2): al massimo 3 serie di prova con RIR, recupero 90 s
    // ========================================

    _calibrationAvailable() {
        return this._storeFn('nextCalibrationStep') || this._algoFn('nextCalibrationStep');
    },

    _startCalibration(exercise, { seedKg = null, testReps = null } = {}) {
        if (!this._calibrationAvailable()) return false;
        if (exercise.setsData.some(s => s.completed && !s.isWarmup)) return false;
        exercise.setsData = exercise.setsData.filter(s => !(s.isWarmup && !s.completed));
        const r = this._range(exercise);
        const reps = parseInt(testReps, 10) > 0 ? parseInt(testReps, 10) : Math.round((r.min + r.max) / 2);
        let seed = Number(seedKg);
        if (!Number.isFinite(seed) || seedKg === null) {
            try { seed = this._storeFn('getStartingLoad') ? Number(Storage.getStartingLoad(exercise.exerciseId).kg) : NaN; } catch (e) { seed = NaN; }
        }
        if (!Number.isFinite(seed)) seed = GT.num(exercise.setsData.find(s => this._isWork(s))?.weight);
        exercise.calib = { tests: [], testReps: reps, seedKg: seed, done: false };
        const at = exercise.setsData.findIndex(s => this._isWork(s) && !s.completed);
        exercise.setsData.splice(at < 0 ? exercise.setsData.length : at, 0, { weight: seed, reps, completed: false, isCalibration: true });
        exercise.openSet = null;
        return true;
    },

    _calibrationStep(exercise, idx) {
        const s = exercise.setsData[idx];
        const c = exercise.calib;
        if (!c) return;
        c.tests.push({ kg: GT.num(s.weight), reps: Math.round(GT.num(s.reps)), rir: Number(s.rir) });
        const state = {
            tests: c.tests,
            testReps: c.testReps,
            targetReps: c.testReps,
            targetRir: this._targetRir(exercise),
            lo: this._range(exercise).min,
            seedKg: c.seedKg,
            level: Storage.getProfile().level
        };
        let res = null;
        try {
            res = this._storeFn('nextCalibrationStep') ? Storage.nextCalibrationStep(exercise.exerciseId, state)
                : TrainingAlgorithm.nextCalibrationStep(exercise.exerciseId, state, this._gym());
        } catch (e) {
            console.warn('nextCalibrationStep', e);
        }
        if (res && !res.done && Number.isFinite(Number(res.nextKg)) && c.tests.length < 3) {
            exercise.setsData.splice(idx + 1, 0, { weight: Number(res.nextKg), reps: c.testReps, completed: false, isCalibration: true });
            return;
        }
        const wk = Number.isFinite(Number(res?.workingKg)) ? Number(res.workingKg) : GT.num(s.weight);
        c.done = true;
        c.workingKg = wk;
        // la prova vicina al peso giusto conta come prima serie di lavoro
        if (res?.lastIsWorkSet) {
            s.isCalibration = false;
            const lastTodo = exercise.setsData.map((x, j) => (this._isWork(x) && !x.completed && j !== idx) ? j : -1).filter(j => j >= 0).pop();
            if (lastTodo != null && lastTodo >= 0) exercise.setsData.splice(lastTodo, 1);
        }
        exercise.setsData = exercise.setsData.filter(x => !(x.isCalibration && !x.completed));
        // il peso è quello giusto per le ripetizioni della prova: si propongono quelle (R3-15)
        const testReps = parseInt(c.testReps, 10) > 0 ? parseInt(c.testReps, 10) : null;
        exercise.setsData.forEach(x => {
            if (this._isWork(x) && !x.completed) {
                x.weight = wk;
                if (testReps) x.reps = testReps;
                x.touched = false;
            }
        });
        this.showNotification(`Peso di lavoro: ${this.fmt(wk)} kg`, 'success', { icon: 'target' });
    },

    // ========================================
    // SERIE: quale è aperta, valori, completamento, correzione
    // ========================================

    // Serie aperta: quella scelta a mano, altrimenti la prima da fare dopo l'ultima fatta
    // (rampa e prove lasciate indietro non si riaprono), altrimenti la prima di lavoro da fare
    _openIndex(ex) {
        if (!ex) return null;
        if (Number.isInteger(ex.openSet) && ex.setsData[ex.openSet]) return ex.openSet;
        let last = -1;
        ex.setsData.forEach((s, i) => { if (s.completed) last = i; });
        for (let i = last + 1; i < ex.setsData.length; i++) if (!ex.setsData[i].completed) return i;
        const w = ex.setsData.findIndex(s => !s.completed && this._isWork(s));
        return w >= 0 ? w : null;
    },

    _hasIncompleteWork(exIdx) {
        return !!this.activeWorkout?.exercises?.[exIdx]?.setsData.some(s => !s.completed && this._isWork(s));
    },

    _nextWithWork(from) {
        const w = this.activeWorkout;
        if (!w) return null;
        for (let k = 1; k <= w.exercises.length; k++) {
            const i = (from + k) % w.exercises.length;
            if (this._hasIncompleteWork(i)) return i;
        }
        return null;
    },

    // Numero della serie nel suo tipo: "Serie 2 di 3", "Avvicinamento 1 di 2" (rampa), "Prova 1"
    _setOrdinal(ex, idx) {
        const kind = this._setKind(ex.setsData[idx]);
        let n = 0;
        let total = 0;
        ex.setsData.forEach((s, i) => {
            if (this._setKind(s) !== kind) return;
            total++;
            if (i <= idx) n = total;
        });
        return { kind, n, total };
    },

    _setName(ex, idx, lower = false) {
        const { kind, n } = this._setOrdinal(ex, idx);
        const name = kind === 'warm' ? `Avvicinamento ${n}` : (kind === 'calib' ? `Prova ${n}` : `Serie ${n}`);
        return lower ? name.toLowerCase() : name;
    },

    _fmtWeightValue(v) {
        return v === '' || v == null || !Number.isFinite(Number(v)) ? '' : this.fmt(Number(v));
    },

    _openSetAt(idx) {
        const ex = this._currentExercise();
        if (!ex || !ex.setsData[idx]) return;
        ex.openSet = idx;
        this._renderSets();
        this._renderDock();
        this._persistSession();
        this._revealActive();
    },

    _inputField(idx, field, raw) {
        const ex = this._currentExercise();
        const s = ex?.setsData[idx];
        if (!s || !['weight', 'reps'].includes(field)) return;
        const str = String(raw ?? '').trim();
        const old = s[field];
        s[field] = str === '' ? '' : (field === 'weight' ? Math.max(0, GT.num(str)) : Math.max(0, Math.round(GT.num(str))));
        s.touched = true;
        if (field === 'weight') this._afterWeightChange(ex, idx, old);
        this._persistSession();
    },

    _normalizeInput(input) {
        const ex = this._currentExercise();
        const s = ex?.setsData[parseInt(input.dataset.set, 10)];
        if (!s) return;
        const v = s[input.dataset.field];
        input.value = input.dataset.field === 'weight' ? this._fmtWeightValue(v) : (v === '' || v == null ? '' : String(v));
    },

    // Peso sul gradino vero della palestra (manubri 10 → 12): Storage.stepWeight (scala di G5).
    // Corpo libero puro (scala [0]): la zavorra sale a passi di 2,5. Senza G5: stepLoad, poi passo v1.26.
    _stepWeight(exerciseId, cur, dir) {
        const sign = dir < 0 ? -1 : 1;
        let v = NaN;
        try {
            if (this._storeFn('stepWeight')) v = Number(Storage.stepWeight(exerciseId, cur, sign));
            else if (this._algoFn('stepLoad')) {
                const rec = this._storeFn('getRecordedWeights') ? Storage.getRecordedWeights(exerciseId) : [];
                v = Number(TrainingAlgorithm.stepLoad(exerciseId, cur, sign, this._gym(), rec));
            } else {
                const step = Number(Storage.getLoadStep(exerciseId, cur)) || 2.5;
                v = cur + sign * step;
            }
        } catch (e) {
            v = NaN;
        }
        if (!Number.isFinite(v)) v = cur;
        if (Math.abs(v - cur) < 1e-9 && this._loadType(exerciseId) === 'bodyweight') v = cur + sign * 2.5;
        return Math.max(0, Math.round(v * 100) / 100);
    },

    _stepField(idx, field, dir) {
        const ex = this._currentExercise();
        const s = ex?.setsData[idx];
        if (!s) return;
        const sign = dir < 0 ? -1 : 1;
        const empty = s[field] === '' || s[field] == null;
        const cur = empty ? NaN : GT.num(s[field]);
        let val;
        if (field === 'weight') {
            if (!Number.isFinite(cur)) {
                const base = this._suggestedWeight(ex);
                val = base != null ? base : 0;
            } else {
                val = this._stepWeight(ex.exerciseId, cur, sign);
            }
        } else {
            const step = this._isTimed(ex.exerciseId) ? 5 : 1;
            if (!Number.isFinite(cur)) val = this._suggestedReps(ex, 0);
            else val = Math.max(0, Math.round(cur) + sign * step);
        }
        const old = s[field];
        s[field] = val;
        s.touched = true;
        const input = document.getElementById(`set-${idx}-${field}`);
        if (input) input.value = field === 'weight' ? this._fmtWeightValue(val) : String(val);
        if (field === 'weight') this._afterWeightChange(ex, idx, old);
        this._persistSession();
    },

    // Le serie dopo, non toccate e dello stesso tipo, seguono il peso; la rampa segue il peso di lavoro
    _afterWeightChange(ex, idx, old) {
        const s = ex.setsData[idx];
        const kind = this._setKind(s);
        const changed = [];
        if (kind === 'work') {
            for (let j = idx + 1; j < ex.setsData.length; j++) {
                const t = ex.setsData[j];
                if (t.completed || t.touched || this._setKind(t) !== 'work') continue;
                t.weight = s.weight;
                changed.push(j);
            }
            if (this._maybeRefreshRamp(ex, idx)) ex.setsData.forEach((t, j) => { if (t.isWarmup && !t.completed) changed.push(j); });
        }
        changed.forEach(j => this._refreshRow(ex, j));
    },

    // Ridisegna una riga chiusa (fatta o da fare) senza toccare la serie aperta
    _refreshRow(ex, j) {
        const li = document.querySelector(`#ex-sets li[data-row="${j}"]`);
        if (li && !li.classList.contains('set--active')) li.outerHTML = this._rowHTML(ex, j, this._openIndex(ex));
    },

    setRir(idx, rir) {
        const ex = this._currentExercise();
        const s = ex?.setsData[idx];
        if (!s) return;
        s.rir = s.rir === rir ? undefined : rir;   // secondo tocco = togli
        document.querySelectorAll(`#rir-opts-${idx} .rir__opt`).forEach(b => {
            b.setAttribute('aria-checked', String(Number(b.dataset.rir) === s.rir));
        });
        this._persistSession();
        // RIR scelto: l'avviso "Scegli il RIR" non serve più (R2-17)
        this._dismissToast('_rirToast');
        if (s.rir === 0 && this._isWork(s)) this.showNotification('RIR 0: cedimento', 'warning');
        else if (s.rir === 4 && this._isWork(s)) this.showNotification('RIR 4+: carica di più', 'info');
    },

    // Chiude subito un avviso tenuto da parte (il tocco sull'avviso lo chiude: stessa strada)
    _dismissToast(key) {
        const t = this[key];
        this[key] = null;
        if (t && t.isConnected && !t.classList.contains('is-leaving')) t.click();
    },

    // Valori ancora nel campo (tastiera iOS aperta) prima di chiudere la serie
    _syncInputs(idx) {
        const ex = this._currentExercise();
        const s = ex?.setsData[idx];
        if (!s) return;
        ['weight', 'reps'].forEach(field => {
            const input = document.getElementById(`set-${idx}-${field}`);
            if (!input) return;
            const str = input.value.trim();
            const v = str === '' ? '' : (field === 'weight' ? Math.max(0, GT.num(str)) : Math.max(0, Math.round(GT.num(str))));
            if (String(v) !== String(s[field] ?? '')) { s[field] = v; s.touched = true; }
        });
    },

    // Record: solo serie di lavoro (riscaldamento e prove non contano)
    _checkPR(ex, exIdx, idx) {
        const s = ex.setsData[idx];
        s.isNewPR = false;
        delete s.prType; delete s.prOld; delete s.prNew;
        if (!this._isWork(s) || !s.completed) return;
        const weight = GT.num(s.weight);
        const reps = Math.round(GT.num(s.reps));
        const timed = this._isTimed(ex.exerciseId);
        if (!(reps > 0) || (!(weight > 0) && !timed)) return;
        const earlier = [];
        this.activeWorkout.exercises.forEach((e, i) => {
            if (e.exerciseId !== ex.exerciseId) return;
            e.setsData.forEach((x, j) => {
                if (x.completed && this._isWork(x) && !(i === exIdx && j === idx)) {
                    earlier.push({ weight: GT.num(x.weight), reps: Math.round(GT.num(x.reps)), completed: true });
                }
            });
        });
        let pr = null;
        try { pr = Storage.checkForNewPR(ex.exerciseId, weight, reps, earlier); } catch (e) { console.warn('checkForNewPR', e); }
        if (!pr?.isNewPR) return;
        s.isNewPR = true;
        s.prType = pr.type || null;
        if (Number.isFinite(Number(pr.oldValue))) s.prOld = Number(pr.oldValue);
        if (Number.isFinite(Number(pr.newValue))) s.prNew = Number(pr.newValue);
        const text = pr.type === 'weight' ? `Record di peso: ${this.fmt(weight)} kg`
            : (pr.type === 'time' ? `Record: ${reps} s` : `Record: ${this.fmt(weight)} kg × ${reps}`);
        this.showNotification(text, 'success', { icon: 'trophy' });
    },

    // Azione principale del dock: serie fatta · correzione salvata · Avanti · Fine
    _dockMain() {
        const ex = this._currentExercise();
        if (!ex) return;
        // Riscaldamento generale aperto a inizio seduta: il dock lo chiude, non registra 20 kg (R2-11)
        if (this._warmupPending()) {
            this._warmupDone();
            return;
        }
        const idx = this._openIndex(ex);
        if (idx == null) {
            const next = this._nextWithWork(this.currentExerciseIndex);
            if (next == null) this._finishFlow();
            else this._goToExercise(next);
            return;
        }
        this.completeSet(idx);
    },

    completeSet(idx) {
        const w = this.activeWorkout;
        const exIdx = this.currentExerciseIndex;
        const ex = this._currentExercise();
        const s = ex?.setsData[idx];
        if (!w || !s) return;
        this._syncInputs(idx);

        // Correzione di una serie già fatta
        if (s.completed) {
            this._checkPR(ex, exIdx, idx);
            ex.openSet = null;
            this._lockDock();
            this._renderSets();
            this._renderTrack();
            this._renderDock();
            this._persistSession();
            this._announce(`${this._setName(ex, idx)} corretta`);
            return;
        }

        if (s.isCalibration && (s.rir === undefined || s.rir === null || s.rir === '' || !Number.isFinite(Number(s.rir)))) {
            this._dismissToast('_rirToast');
            this._rirToast = this.showNotification('Scegli il RIR della prova', 'warning', { icon: 'help' });
            document.querySelector(`#rir-opts-${idx} .rir__opt`)?.focus();
            return;
        }
        if (s.reps === '' || s.reps == null) {
            const { n } = this._setOrdinal(ex, idx);
            s.reps = s.isWarmup ? 5 : this._suggestedReps(ex, n - 1);
        }
        if (s.weight === '' || s.weight == null) s.weight = this._isBodyweight(ex.exerciseId) ? 0 : '';

        s.completed = true;
        const name = this._setName(ex, idx);
        const wasCalib = !!s.isCalibration;
        this._checkPR(ex, exIdx, idx);
        if (wasCalib) this._calibrationStep(ex, idx);

        // La serie dopo (non toccata, dello stesso tipo) prende il peso appena usato; le ripetizioni
        // restano quelle proposte per lei (9/10/11/12 non diventa 9/9/9/9: R1-16)
        if (this._isWork(s) && !wasCalib) {
            const nextIdx = ex.setsData.findIndex((t, j) => j > idx && !t.completed && this._isWork(t));
            const t = ex.setsData[nextIdx];
            if (t && !t.touched) {
                t.weight = s.weight;
                if (t.reps === '' || t.reps == null) t.reps = s.reps;
            }
        }

        // Tutte le serie fatte e al massimo del range: la prossima volta si sale
        const work = ex.setsData.filter(x => this._isWork(x));
        if (this._isWork(s) && work.length && work.every(x => x.completed) && !ex.topRangeNotified) {
            let ev = null;
            try { ev = Storage.evaluateSets(ex.exerciseId, work, ex.targetReps, { targetRir: this._targetRir(ex) }); } catch (e) { ev = null; }
            if (ev?.action === 'up' && ev.increment > 0) {
                ex.topRangeNotified = true;
                setTimeout(() => this.showNotification(`Prossima volta ${this.fmt(ev.nextWeight)} kg (+${this.fmt(ev.increment)})`, 'success', { icon: 'target' }), 500);
            }
        }

        const warmupSection = document.getElementById('warmup-section');
        if (warmupSection && !warmupSection.classList.contains('collapsed')) this._setWarmupCollapsed(true);

        ex.openSet = null;
        this._lockDock();
        this._dismissToast('_rirToast');
        this._announce(`${name} fatta`);
        this._startRestAfterSet(exIdx, idx);
        if (this.currentExerciseIndex === exIdx) {
            if (wasCalib) this._renderHead();   // il suggerimento "Trova il peso" cambia
            this._renderSets();
            this._renderTrack();
            this._renderDock();
            this._revealActive();
        }
        this._persistSession();
    },

    // La serie aperta resta in vista fra la barra in alto e il dock (scorrimento immediato, niente coreografia)
    _revealActive() {
        const el = document.querySelector('#ex-sets .set--active');
        if (!el) return;
        const r = el.getBoundingClientRect();
        // il bordo alto vero del dock (su desktop galleggia sopra il fondo della finestra)
        const dr = document.getElementById('seduta-dock')?.getBoundingClientRect();
        const dockTop = dr && dr.height > 0 ? dr.top : window.innerHeight;
        const topH = document.getElementById('workout-header-bar')?.getBoundingClientRect().bottom || 56;
        const bottomLimit = dockTop - 12;
        let delta = 0;
        if (r.bottom > bottomLimit) delta = r.bottom - bottomLimit;
        if (r.top - delta < topH + 8) delta = r.top - (topH + 8);
        if (Math.abs(delta) > 1) window.scrollBy?.(0, delta);
    },

    // Correzione: la serie torna da fare (ferma il recupero che aveva fatto partire, N10)
    _uncompleteOpen() {
        const ex = this._currentExercise();
        const idx = this._openIndex(ex);
        const s = ex?.setsData[idx];
        if (!s || !s.completed) return;
        s.completed = false;
        s.isNewPR = false;
        delete s.prType; delete s.prOld; delete s.prNew;
        const src = this._restMeta?.source;
        if (src && src.ex === this.currentExerciseIndex && src.set === idx) this._stopRest();
        ex.openSet = idx;
        this._lockDock();
        this._renderSets();
        this._renderTrack();
        this._renderDock();
        this._persistSession();
        this._announce(`${this._setName(ex, idx)} da fare`);
    },

    // Dopo una serie: recupero normale, superset senza pausa fra A1 e A2, recupero di fine giro.
    // Anche dopo l'ultima serie di un esercizio (N11): il recupero continua sull'esercizio dopo.
    _startRestAfterSet(exIdx, idx) {
        const w = this.activeWorkout;
        const ex = w.exercises[exIdx];
        const s = ex.setsData[idx];
        const source = { ex: exIdx, set: idx };
        const anyLeft = w.exercises.some((_, i) => this._hasIncompleteWork(i));
        if (!anyLeft) {
            this._stopRest();   // seduta finita: niente recupero, il dock dice "Fine"
            return;
        }
        if (s.isWarmup) {
            this._startRest({ seconds: 60, source });
            return;
        }
        if (s.isCalibration || (ex.calib && !ex.calib.done)) {
            this._startRest({ seconds: 90, source });
            return;
        }
        const group = this._group(exIdx);
        if (group) {
            const pos = group.indexOf(exIdx);
            const later = group.slice(pos + 1).find(i => this._hasIncompleteWork(i));
            if (later != null) {
                // Superset: subito il prossimo esercizio del giro, niente pausa
                this._stopRest();
                this._goToExercise(later, { keepScroll: false });
                const next = w.exercises[later];
                this._announce(`Subito ${this._exLetter(next)} ${next.name}`);
                return;
            }
            const first = group.find(i => this._hasIncompleteWork(i));
            const restSec = ex.supersetRest || ex.rest || 90;
            if (first != null) {
                this._startRest({ seconds: restSec, source });
                this._goToExercise(first, { keepScroll: false });
                return;
            }
            this._startRest({ seconds: restSec, source });
            return;
        }
        this._startRest({ seconds: ex.rest || this._defaultRest(ex.exerciseId), source });
    },

    _goToExercise(index, opts = {}) {
        const w = this.activeWorkout;
        if (!w || !Number.isInteger(index) || index < 0 || index >= w.exercises.length) return;
        const changed = index !== this.currentExerciseIndex;
        this.currentExerciseIndex = index;
        if (changed) {
            this._mediaOpen = false;
            this._lockDock();
        }
        this._renderAll();
        this._persistSession();
        if (changed && !opts.keepScroll) window.scrollTo?.({ top: 0, behavior: this._reduceMotion() ? 'auto' : 'smooth' });
    },

    // Fine: tutto fatto → defaticamento senza conferma; altrimenti la conferma di endWorkout
    _finishFlow() {
        if (this._leftSetsCount() > 0) this.endWorkout();
        else {
            this._stopRest();
            this.showCooldown();
        }
    },

    async endWorkout(skipConfirm = false) {
        const w = this.activeWorkout;
        if (!w) return;
        const done = this._completedSetsCount();
        const left = this._leftSetsCount();
        if (!skipConfirm) {
            const ok = done === 0
                ? await this.confirmSheet({ title: `Uscire da ${w.name}?`, text: 'Nessuna serie fatta: non si salva niente.', ok: 'Esci', cancel: 'Continua', danger: true })
                : await this.confirmSheet({
                    title: `Terminare ${w.name}?`,
                    text: `${done} ${done === 1 ? 'serie fatta' : 'serie fatte'}${left ? `, ${left} da fare` : ''}. Si salva quello che hai fatto.`,
                    ok: 'Termina e salva', cancel: 'Continua', danger: true
                });
            if (!ok || this.activeWorkout !== w) return;
        }
        this._stopRest();
        if (done === 0) {
            this._teardownWorkout();
            this.showNotification('Nessuna serie fatta: non salvata', 'info');
            return;
        }
        this.showCooldown();
    },

    // ========================================
    // DISEGNO: intestazione, serie, avanzamento, dock
    // ========================================

    _renderAll() {
        const w = this.activeWorkout;
        const ex = this._currentExercise();
        if (!w || !ex) return;
        this._prefill(ex);
        this._setText('workout-title', w.name || 'Seduta');
        this._setText('workout-pos', `${this.currentExerciseIndex + 1} di ${w.exercises.length}`);
        this._renderPhase();
        this._renderHead();
        this._renderSets();
        this._renderTrack();
        this._renderDock();
    },

    _renderPhase() {
        const el = document.getElementById('seduta-phase');
        const w = this.activeWorkout;
        if (!el) return;
        const key = w?.cyclePhase || this._phaseKey(w?.phase);
        const ph = { accumulation: ['acc', 'Accumulo'], intensification: ['int', 'Intensificazione'], deload: ['del', 'Scarico'] }[key];
        if (!ph || !w.cycleInfo) {
            el.hidden = true;
            return;
        }
        el.hidden = false;
        el.innerHTML = `<span class="phase" data-ph="${ph[0]}">${ph[1]}</span><span class="faint"> · settimana <span class="num">${GT.esc(w.cycleInfo.currentWeek)}</span> di <span class="num">${GT.esc(w.cycleInfo.duration)}</span></span>`;
    },

    _renderTrack() {
        const el = document.getElementById('seduta-track');
        const w = this.activeWorkout;
        if (!el || !w) return;
        const seg = (i) => {
            const cls = i === this.currentExerciseIndex ? ' is-now' : (!this._hasIncompleteWork(i) ? ' is-done' : '');
            return `<i class="track__seg${cls}"></i>`;
        };
        let html = '';
        let doneCount = 0;
        for (let i = 0; i < w.exercises.length; i++) {
            if (!this._hasIncompleteWork(i)) doneCount++;
            const g = this._group(i);
            if (g && g[0] === i) {
                html += `<span class="track__group" style="flex:${g.length}">${g.map(seg).join('')}</span>`;
                i = Math.max(i, g[g.length - 1]);
                for (let k = 1; k < g.length; k++) if (!this._hasIncompleteWork(g[k])) doneCount++;
                continue;
            }
            html += seg(i);
        }
        el.innerHTML = html;
        el.setAttribute('aria-label', `Esercizio ${this.currentExerciseIndex + 1} di ${w.exercises.length}, ${doneCount} ${doneCount === 1 ? 'fatto' : 'fatti'}`);
    },

    _plateable(exerciseId) {
        if (this._storeFn('getPlates')) {
            try { return Storage.getPlates(exerciseId, 20) !== null; } catch (e) { return false; }
        }
        const lt = this._loadType(exerciseId);
        return ['barbell', 'ez-bar', 'machine-plate'].includes(lt) && exerciseId !== 't-bar-row';
    },

    _gifUrl(exerciseId) {
        try { return typeof getExerciseGif === 'function' ? getExerciseGif(exerciseId) : null; } catch (e) { return null; }
    },

    _equipIcon(exerciseId) {
        const lt = this._loadType(exerciseId);
        return { barbell: 'barbell', 'ez-bar': 'barbell', 'dumbbell-pair': 'dumbbell', 'dumbbell-single': 'dumbbell', cable: 'cable',
            'machine-stack': 'machine', 'machine-plate': 'machine', bodyweight: 'bodyweight', 'bodyweight-loadable': 'pullup', assisted: 'pullup' }[lt] || 'dumbbell';
    },

    _exerciseNote(exerciseId) {
        try {
            const n = Storage.getProfile().exerciseNotes;
            return n && typeof n === 'object' && typeof n[exerciseId] === 'string' ? n[exerciseId] : '';
        } catch (e) {
            return '';
        }
    },

    // Intestazione: miniatura (si ingrandisce sul posto), nome, muscoli, obiettivo, suggerimento, nota, strumenti
    _renderHead() {
        const el = document.getElementById('ex-head');
        const w = this.activeWorkout;
        const ex = this._currentExercise();
        if (!el || !ex) return;
        const data = EXERCISES_DB[ex.exerciseId] || {};
        const name = GT.esc(ex.name || data.name || ex.exerciseId);
        const muscles = (data.primaryMuscles || []).map(m => GT.esc(this._capFirst(m))).join(' · ');
        const gif = this._gifUrl(ex.exerciseId);
        const group = this._group(this.currentExerciseIndex);
        const letter = group ? this._exLetter(ex) : '';
        // superset: il badge dice solo il tipo, i compagni hanno la loro riga sotto l'intestazione
        const ssBadge = group ? `<span class="ss-badge">${this.ico('superset')}${ex.isGiantSet || group.length > 2 ? 'Giant set' : 'Superset'}</span>` : '';
        const mates = group ? this._sedMatesHTML(group) : '';
        const lastLetter = group ? this._exLetter(w.exercises[group[group.length - 1]]) : '';
        const restSec = group ? (ex.supersetRest || ex.rest || 90) : (ex.rest || this._defaultRest(ex.exerciseId));
        const rir = this._targetRir(ex);
        const timed = this._isTimed(ex.exerciseId);
        const goalLabel = `Obiettivo: ${ex.targetSets} serie da ${GT.esc(ex.targetReps)} ${timed ? 'secondi' : 'ripetizioni'}, RIR ${rir}, recupero ${this._clock(restSec)}${group ? ` dopo ${lastLetter}` : ''}`;

        const thumb = gif
            ? `<button type="button" class="thumb thumb--md" data-expand aria-expanded="false" aria-label="Guarda l'esecuzione: ${name}">
                    <img src="${GT.esc(gif)}" alt="" loading="lazy" decoding="async">
                    <span class="thumb__expand" aria-hidden="true">${this.ico('expand')}</span>
               </button>`
            : `<span class="thumb thumb--md thumb--icon" aria-hidden="true">${this.ico(this._equipIcon(ex.exerciseId), 'ico--lg')}</span>`;

        let steps = [];
        try { steps = (typeof getExerciseDetails === 'function' ? getExerciseDetails(ex.exerciseId)?.execution?.steps : null) || []; } catch (e) { steps = []; }
        // Nome toccabile → ultime 3 sedute di questo esercizio (solo se ce ne sono)
        const hasHistory = !!this._exerciseContext(ex).last;

        const top = this._mediaOpen && gif ? `
            <div class="ex__media">
                <div class="ex__title">
                    <span class="cap">Esercizio <span class="num">${this.currentExerciseIndex + 1}</span> di <span class="num">${w.exercises.length}</span></span>
                    <h1 id="ex-name">${letter ? `<span class="ex-letter">${GT.esc(letter)}</span>` : ''}${name}</h1>
                </div>
                <figure class="media-full"><img src="${GT.esc(gif)}" alt="${name}: esecuzione"></figure>
                ${steps.length ? `<ol class="steps-list">${steps.slice(0, 3).map(t => `<li>${GT.esc(t)}</li>`).join('')}</ol>` : ''}
                <button type="button" class="btn btn--secondary" data-collapse>${this.ico('chevron-up')}Riduci</button>
            </div>` : `
            <div class="ex__top">
                ${thumb}
                <div class="ex__title">
                    ${ssBadge}
                    <h1 id="ex-name">${letter ? `<span class="ex-letter">${GT.esc(letter)}</span>` : ''}${hasHistory
                        ? `<button type="button" class="ex__name" data-history aria-haspopup="dialog" aria-describedby="ex-name-hint">${name}${this.ico('clock', 'ico--sm ex__name-ico')}</button>`
                        : name}</h1>
                    ${hasHistory ? '<span class="sr-only" id="ex-name-hint">Ultime sedute</span>' : ''}
                    ${muscles ? `<p class="ex__muscles">${muscles}</p>` : ''}
                </div>
            </div>
            ${gif ? `<figure class="media-full desk-only"><img src="${GT.esc(gif)}" alt="${name}: esecuzione" loading="lazy"></figure>` : ''}`;

        // Una riga di suggerimento: "Trova il peso", messaggio della progressione, sostituzione
        const sug = this._exerciseContext(ex).suggestion;
        let hint = '';
        if (ex.calib && !ex.calib.done) {
            hint = `<p class="ex__hint">${this.ico('target', 'ico--sm')}<span class="ell">Trova il peso: al massimo 3 prove con il RIR</span></p>`;
        } else if (ex.calib?.done && Number.isFinite(Number(ex.calib.workingKg))) {
            // calibrazione chiusa: il risultato, non più la proposta di prova (R2-07)
            hint = `<p class="ex__hint">${this.ico('target', 'ico--sm')}<span class="ell">Peso di lavoro <span class="num">${GT.esc(this.fmt(Number(ex.calib.workingKg)))}</span> kg</span></p>`;
        } else if (ex.substitutedFrom && !ex.setsData.some(s => s.completed)) {
            hint = `<p class="ex__hint">${this.ico('swap', 'ico--sm')}<span class="ell">Al posto di ${GT.esc(EXERCISES_DB[ex.substitutedFrom]?.name || ex.substitutedFrom)}</span></p>`;
        } else if (sug?.message) {
            const free = !ex.calib && !ex.setsData.some(s => s.completed && !s.isWarmup) && this._calibrationAvailable() &&
                !['bodyweight', 'bodyweight-loadable'].includes(this._loadType(ex.exerciseId));
            const icon = sug.status === 'deload' || sug.status === 'detraining' ? 'deload' : (/increase|up|add/.test(sug.status || sug.action || '') ? 'trend-up' : 'target');
            if (free && sug.recalibrate) {
                // tutte le serie oltre il range con RIR 4+: la stima era troppo prudente
                hint = `<p class="ex__hint">${this.ico('target', 'ico--sm')}<span class="ell">Troppo facile?</span><button type="button" class="ex__find" data-calib>Trova il peso</button></p>`;
            } else {
                // "Trova il peso" non previsto oggi per questo esercizio (R3-06): parte dalla stima, la
                // prova resta a richiesta
                const deferred = !!sug.calibrate && !this._calibPlanned(ex);
                const canFind = free && (sug.status === 'new' || sug.calibrate) && (!sug.calibrate || deferred);
                let msg = sug.message;
                if (deferred) {
                    const kg = GT.num(ex.setsData.find(s => this._isWork(s))?.weight);
                    msg = kg > 0 ? `Prima volta: ${this.fmt(kg)} kg, ${ex.targetReps} ${timed ? 's' : 'rip.'}` : 'Prima volta: peso stimato';
                }
                hint = `<p class="ex__hint">${this.ico(icon, 'ico--sm')}<span class="ell">${GT.esc(msg)}</span>${canFind ? `<button type="button" class="ex__find" data-calib>Trova il peso</button>` : ''}</p>`;
            }
        } else if (sug?.recalibrate && !ex.calib && !ex.setsData.some(s => s.completed && !s.isWarmup) && this._calibrationAvailable()) {
            hint = `<p class="ex__hint">${this.ico('target', 'ico--sm')}<span class="ell">Troppo facile?</span><button type="button" class="ex__find" data-calib>Trova il peso</button></p>`;
        }
        const note = this._exerciseNote(ex.exerciseId);
        const noteHTML = note ? `<p class="ex__note">${this.ico('note', 'ico--sm')}<span>${GT.esc(note)}</span></p>` : '';

        const tools = [
            `<button type="button" class="tool" data-tool="swap">${this.ico('swap')}Scambia</button>`,
            `<button type="button" class="tool" data-tool="note">${this.ico('note')}Nota</button>`,
            this._plateable(ex.exerciseId) ? `<button type="button" class="tool" data-tool="plates">${this.ico('plate')}Dischi</button>` : '',
            `<button type="button" class="tool" data-tool="info">${this.ico('info')}Come si fa</button>`
        ].join('');

        el.innerHTML = `
            ${top}
            ${mates}
            <div class="ex__goal" role="group" aria-label="${goalLabel}">
                <span class="tag"><span class="num">${ex.targetSets} × ${GT.esc(ex.targetReps)}</span>${timed ? '<small>s</small>' : ''}</span>
                <span class="tag"><small>RIR</small><span class="num">${rir}</span></span>
                <span class="tag">${this.ico('timer')}<span class="num">${this._clock(restSec)}</span>${group ? ` dopo ${GT.esc(lastLetter)}` : ''}</span>
            </div>
            ${hint}${noteHTML}
            <div class="tools">${tools}</div>
        `;
        el.querySelectorAll('img').forEach(img => img.addEventListener('error', () => {
            if (img.closest('.sed-mate')) return this._sedMateImgError(img);
            const box = img.closest('.thumb, .media-full');
            if (box?.classList.contains('thumb')) {
                box.outerHTML = `<span class="thumb thumb--md thumb--icon" aria-hidden="true">${this.ico(this._equipIcon(ex.exerciseId), 'ico--lg')}</span>`;
            } else if (box) box.remove();
        }, { once: true }));
        this._renderedHeadFor = this.currentExerciseIndex;
    },

    // ---------- superset: il compagno da preparare (una riga per compagno, anche nel giant set) ----------

    // Righe dei compagni dell'esercizio corrente, nell'ordine del giro
    _sedMatesHTML(group) {
        const rows = group.filter(i => i !== this.currentExerciseIndex).map(i => this._sedMateHTML(i)).join('');
        return rows ? `<ul class="sed-mates" aria-label="${group.length > 2 ? 'Giant set' : 'Superset'}">${rows}</ul>` : '';
    },

    // Serie che il compagno farà al suo turno: la prima da fare dopo l'ultima fatta (come _openIndex,
    // senza la serie aperta a mano per correggere), altrimenti la prima di lavoro da fare; null = finito
    _sedMateSet(mate) {
        const sets = mate?.setsData || [];
        let last = -1;
        sets.forEach((s, i) => { if (s.completed) last = i; });
        for (let i = last + 1; i < sets.length; i++) if (!sets[i].completed) return sets[i];
        return sets.find(s => !s.completed && this._isWork(s)) || null;
    },

    // Dischi per lato del peso previsto, come nel foglio Dischi ("20 + 5"); null se non si carica a dischi
    _sedMatePlates(exerciseId, kg) {
        if (!(kg > 0) || !this._storeFn('getPlates')) return null;
        let res = null;
        try { res = Storage.getPlates(exerciseId, kg); } catch (e) { res = null; }
        if (!res || res.belowBar) return null;
        const per = (res.perSide || []).map(p => this.fmt(p));
        if (!per.length) return Number(res.barKg) > 0 ? { html: 'solo bilanciere', spoken: 'solo bilanciere' } : null;
        // peso che i dischi non fanno esatto: i dischi più vicini, detto (il foglio Dischi spiega il resto)
        const near = res.exact === false;
        return {
            html: `per lato <span class="num">${near ? '≈ ' : ''}${per.map(p => GT.esc(p)).join(' + ')}</span>`,
            spoken: `per lato ${near ? 'circa ' : ''}${per.join(' più ')}`
        };
    },

    // Una riga: miniatura (→ esecuzione grande) e, toccando il resto, si passa al compagno.
    // Lettera, nome, peso × ripetizioni della sua prossima serie, dischi per lato. Niente giallo: non è "adesso".
    _sedMateHTML(idx) {
        const mate = this.activeWorkout?.exercises?.[idx];
        if (!mate) return '';
        // stessa precompilazione di quando lo si apre (peso suggerito o ultimo, prova, rampa): i numeri coincidono
        this._prefill(mate);
        const rawName = mate.name || EXERCISES_DB[mate.exerciseId]?.name || mate.exerciseId;
        const name = GT.esc(rawName);
        const letter = this._exLetter(mate);
        const gif = this._gifUrl(mate.exerciseId);
        const s = this._sedMateSet(mate);
        let line;
        let spoken;
        if (!s) {
            line = `<span class="sed-mate__done">${this.ico('check', 'ico--sm')}Fatto</span>`;
            spoken = 'fatto';
        } else {
            const kind = this._setKind(s);
            const plates = this._sedMatePlates(mate.exerciseId, GT.num(s.weight));
            const tag = kind === 'warm' ? 'avvicinamento' : (kind === 'calib' ? 'prova' : '');
            line = `<span class="sed-mate__val">${this._valHTML(mate, s, false)}</span>` +
                (plates ? `<span class="sed-mate__plates">${plates.html}</span>` : '') +
                (tag ? `<span class="set__tag">${tag}</span>` : '');
            spoken = `${tag ? `${tag}, ` : ''}${this._valSpoken(mate, s, false)}${plates ? `, ${plates.spoken}` : ''}`;
        }
        const thumb = gif
            ? `<img src="${GT.esc(gif)}" alt="" loading="lazy" decoding="async">`
            : this.ico(this._equipIcon(mate.exerciseId), 'sed-mate__equip');
        return `<li class="sed-mate">
            <button type="button" class="thumb sed-mate__thumb${gif ? '' : ' thumb--icon'}" data-sed-info="${idx}" data-equip="${GT.esc(this._equipIcon(mate.exerciseId))}" aria-haspopup="dialog" aria-label="Come si fa: ${name}">
                ${thumb}<span class="sed-mate__zoom" aria-hidden="true">${this.ico('expand')}</span>
            </button>
            <button type="button" class="sed-mate__go" data-sed-goto="${idx}" aria-label="${GT.esc(`Con ${letter} ${rawName}: ${spoken}. Apri ${letter}`)}">
                <span class="sed-mate__body">
                    <span class="sed-mate__title"><span class="sed-mate__con">Con</span> <span class="sed-mate__letter">${GT.esc(letter)}</span> <span class="sed-mate__name">${name}</span></span>
                    <span class="sed-mate__line">${line}</span>
                </span>
                ${this.ico('next', 'ico--sm sed-mate__chev')}
            </button>
        </li>`;
    },

    // GIF del compagno che non si carica: resta il bottone, con l'icona dell'attrezzo
    _sedMateImgError(img) {
        const btn = img.closest('.sed-mate__thumb');
        img.remove();
        if (!btn || btn.classList.contains('thumb--icon')) return;
        btn.classList.add('thumb--icon');
        btn.insertAdjacentHTML('afterbegin', this.ico(btn.dataset.equip || 'dumbbell', 'sed-mate__equip'));
    },

    // Esecuzione grande del compagno (foglio sopra la seduta): chiudendo si resta dove si era
    _sedShowMate(idx) {
        const mate = this.activeWorkout?.exercises?.[idx];
        if (!mate) return;
        if (typeof this.openExercise === 'function' && EXERCISES_DB[mate.exerciseId]) this.openExercise(mate.exerciseId);
        else if (typeof this.showExerciseInfoModal === 'function') this.showExerciseInfoModal(mate.exerciseId, mate.name, 'workout');
    },

    // "Volta scorsa" alla stessa posizione (o l'ultima serie disponibile)
    _prevFor(ex, workN) {
        const last = this._exerciseContext(ex).last;
        if (!last?.sets?.length) return null;
        const p = last.sets[Math.min(workN, last.sets.length - 1)];
        return p || null;
    },

    _prevText(ex, p) {
        if (!p) return '';
        if (this._isTimed(ex.exerciseId)) return `${p.reps} s`;
        return p.weight > 0 ? `${this.fmt(p.weight)} × ${p.reps}` : `× ${p.reps}`;
    },

    _prevSpoken(ex, p) {
        if (!p) return '';
        if (this._isTimed(ex.exerciseId)) return `${p.reps} secondi`;
        return p.weight > 0 ? `${this.fmt(p.weight)} per ${p.reps}` : `${p.reps} ripetizioni`;
    },

    // Valore di una riga chiusa: "102,5 kg × 10", "+5 kg × 8", "corpo libero × 12", "45 s"
    _valHTML(ex, s, planned) {
        const lt = this._loadType(ex.exerciseId);
        const bw = lt === 'bodyweight' || lt === 'bodyweight-loadable';
        const timed = this._isTimed(ex.exerciseId);
        const w = s.weight === '' || s.weight == null ? null : GT.num(s.weight);
        let wPart;
        if (w == null) wPart = '<small>—</small>';
        else if (bw && !(w > 0)) wPart = timed ? '' : '<small>corpo libero</small>';
        else if (bw) wPart = `<span class="num">+${this.fmt(w)}</span><small>kg</small>`;
        else if (lt === 'assisted') wPart = `<small>assist.</small><span class="num">${this.fmt(w)}</span><small>kg</small>`;
        else wPart = `<span class="num">${this.fmt(w)}</span><small>kg</small>`;
        const reps = planned && this._isWork(s) ? ex.targetReps : (s.reps === '' || s.reps == null ? '—' : s.reps);
        const rPart = timed ? `<span class="num">${GT.esc(reps)}</span><small>s</small>` : `<span class="num">× ${GT.esc(reps)}</span>`;
        return `${wPart}${rPart}`;
    },

    _valSpoken(ex, s, planned) {
        const lt = this._loadType(ex.exerciseId);
        const timed = this._isTimed(ex.exerciseId);
        const w = s.weight === '' || s.weight == null ? null : GT.num(s.weight);
        const reps = planned && this._isWork(s) ? ex.targetReps : s.reps;
        let wTxt = '';
        if (w != null && w > 0) wTxt = lt === 'assisted' ? `assistenza ${this.fmt(w)} kg` : ((lt === 'bodyweight' || lt === 'bodyweight-loadable') ? `zavorra ${this.fmt(w)} kg` : `${this.fmt(w)} kg`);
        else if (w != null && (lt === 'bodyweight' || lt === 'bodyweight-loadable')) wTxt = 'corpo libero';
        const rTxt = timed ? `${reps} secondi` : `${reps} ripetizioni`;
        return wTxt ? `${wTxt} per ${rTxt}` : rTxt;
    },

    _workIndex(ex, idx) {
        let n = -1;
        for (let i = 0; i <= idx; i++) if (this._isWork(ex.setsData[i])) n++;
        return Math.max(0, n);
    },

    // Fine riga della rampa: "bilanciere" per il vuoto, altrimenti la percentuale del peso di lavoro
    _warmEnd(ex, s) {
        const bar = this._barOf(ex.exerciseId);
        if (bar > 0 && Math.abs(GT.num(s.weight) - bar) < 0.01) return '<span class="set__pct">bilanciere</span>';
        return s.pct ? `<span class="set__pct num">${Math.round(s.pct * 100)}%</span>` : '';
    },

    _rowHTML(ex, i, openIdx) {
        const s = ex.setsData[i];
        if (i === openIdx) return this._activeHTML(ex, i);
        const kind = this._setKind(s);
        const { n } = this._setOrdinal(ex, i);
        const name = this._setName(ex, i);
        const warm = kind === 'warm';
        const cls = `${warm ? ' set--warm' : ''}${kind === 'calib' ? ' set--calib' : ''}`;
        if (s.completed) {
            const rir = Number.isFinite(Number(s.rir)) && s.rir !== null && s.rir !== '' ? Number(s.rir) : null;
            const rirTxt = rir === 4 ? '4+' : rir;
            const end = [
                s.isNewPR ? this.ico('trophy', 'ico--sm set__pr') : '',
                kind === 'calib' ? '<span class="set__tag">prova</span>' : '',
                warm ? this._warmEnd(ex, s) : '',
                rir != null ? `<span class="rir-dot" data-rir="${rir}">RIR ${rirTxt}</span>` : ''
            ].join('');
            const label = `${name}: ${this._valSpoken(ex, s, false)}${rir != null ? `, RIR ${rirTxt}` : ''}${s.isNewPR ? ', record' : ''}. Modifica`;
            return `<li data-row="${i}"><button class="set set--done${cls}" type="button" data-set="${i}" aria-label="${GT.esc(label)}">
                <span class="set__n">${this.ico('check')}</span>
                <span class="set__val">${this._valHTML(ex, s, false)}</span>
                <span class="set__end">${end}</span>
            </button></li>`;
        }
        const p = kind === 'work' ? this._prevFor(ex, this._workIndex(ex, i)) : null;
        const prevTxt = this._prevText(ex, p);
        const label = `${name}: previsti ${this._valSpoken(ex, s, true)}${p ? `. Volta scorsa ${this._prevSpoken(ex, p)}` : ''}`;
        const mark = warm ? this.ico('warmup', 'ico--sm') : (kind === 'calib' ? this.ico('target', 'ico--sm') : `<span class="num">${n}</span>`);
        const end = warm ? this._warmEnd(ex, s) : (kind === 'calib' ? '<span class="set__tag">prova</span>' : (prevTxt ? `<span class="num">${GT.esc(prevTxt)}</span>` : ''));
        return `<li data-row="${i}"><button class="set set--todo${cls}" type="button" data-set="${i}" aria-label="${GT.esc(label)}">
            <span class="set__n">${mark}</span>
            <span class="set__val">${this._valHTML(ex, s, true)}</span>
            <span class="set__end set__prev">${end}</span>
        </button></li>`;
    },

    _stepperHTML(i, field, value, label, unit, minusLabel, plusLabel, inputmode) {
        const id = `set-${i}-${field}`;
        return `
            <div class="stepper">
                <label class="stepper__label" for="${id}"><span>${label}</span><span>${GT.esc(unit)}</span></label>
                <div class="stepper__box">
                    <button class="stepper__btn" type="button" data-step="${field}" data-dir="-1" data-set="${i}" aria-label="${GT.esc(minusLabel)}">${this.ico('minus')}</button>
                    <input class="stepper__val" id="${id}" type="text" inputmode="${inputmode}" autocomplete="off" enterkeyhint="done"
                        value="${GT.esc(value)}" data-set="${i}" data-field="${field}">
                    <button class="stepper__btn" type="button" data-step="${field}" data-dir="1" data-set="${i}" aria-label="${GT.esc(plusLabel)}">${this.ico('plus')}</button>
                </div>
            </div>`;
    },

    // La serie aperta: intestazione, stepper peso e ripetizioni, RIR con l'obiettivo tratteggiato
    _activeHTML(ex, i) {
        const s = ex.setsData[i];
        const kind = this._setKind(s);
        const { n, total } = this._setOrdinal(ex, i);
        const timed = this._isTimed(ex.exerciseId);
        const wl = this._weightLabels(ex.exerciseId);
        const correcting = !!s.completed;
        let head;
        let right = '';
        if (kind === 'warm') {
            head = `Avvicinamento ${n} <span class="faint">di ${total}</span>`;
            const bar = this._barOf(ex.exerciseId);
            if (bar > 0 && Math.abs(GT.num(s.weight) - bar) < 0.01) right = 'Bilanciere vuoto';
            else if (s.pct) right = `<span class="num">${Math.round(s.pct * 100)}%</span> del peso`;
        } else if (kind === 'calib') {
            head = `Prova ${n} <span class="faint">· trova il peso</span>`;
            right = `Fai <span class="num">${GT.esc(s.reps || ex.calib?.testReps || '')}</span>, poi il RIR`;
        } else {
            const workTotal = ex.setsData.filter(x => this._isWork(x)).length;
            head = `Serie ${n} <span class="faint">di ${workTotal}</span>`;
            const p = this._prevFor(ex, this._workIndex(ex, i));
            if (p) right = `Volta scorsa <span class="num">${GT.esc(this._prevText(ex, p))}</span>`;
        }
        if (correcting) head += ' <span class="faint">· correggi</span>';
        const repsUnit = timed ? 's' : (kind === 'work' ? ex.targetReps : '');
        const repsLabel = timed ? 'Secondi' : 'Ripetizioni';
        const rir = this._targetRir(ex);
        const rirHTML = kind === 'warm' ? '' : `
            <div class="rir">
                <div class="rir__head"><span id="rir-l-${i}">RIR <button class="help" type="button" data-help="rir" aria-label="Cos'è il RIR: le ripetizioni che avresti ancora potuto fare">${this.ico('help')}</button></span>${kind === 'calib' ? '<span>obbligatorio</span>' : `<span>obiettivo <b class="num">${rir}</b></span>`}</div>
                <div class="rir__opts" id="rir-opts-${i}" role="radiogroup" aria-labelledby="rir-l-${i}">
                    ${[0, 1, 2, 3, 4].map(r => `<button class="rir__opt${r === rir && kind !== 'calib' ? ' is-target' : ''}" type="button" role="radio" aria-checked="${Number(s.rir) === r && s.rir !== null && s.rir !== undefined && s.rir !== ''}" data-rir="${r}" data-set="${i}"${r === 4 ? ' aria-label="4 o più"' : ''}>${r === 4 ? '4+' : r}</button>`).join('')}
                </div>
            </div>`;
        return `<li class="set set--active${kind === 'warm' ? ' set--warm' : ''}" data-row="${i}" aria-current="step">
            <div class="set__head"><b>${head}</b>${right ? `<span class="set__prev">${right}</span>` : ''}</div>
            <div class="steppers">
                ${this._stepperHTML(i, 'weight', this._fmtWeightValue(s.weight), wl.label, wl.unit, `Meno peso, ${this._setName(ex, i, true)}`, `Più peso, ${this._setName(ex, i, true)}`, 'decimal')}
                ${this._stepperHTML(i, 'reps', s.reps === '' || s.reps == null ? '' : String(s.reps), repsLabel, repsUnit, timed ? '5 secondi in meno' : 'Una ripetizione in meno', timed ? '5 secondi in più' : 'Una ripetizione in più', 'numeric')}
            </div>
            ${rirHTML}
        </li>`;
    },

    // Esercizio dopo (o compagno di superset): anticipa senza distrarre
    _nextExerciseIndex() {
        const w = this.activeWorkout;
        const i = this.currentExerciseIndex;
        const g = this._group(i);
        if (g) {
            const pos = g.indexOf(i);
            if (pos < g.length - 1) return g[pos + 1];
            const after = g[g.length - 1] + 1;
            return after < w.exercises.length ? after : null;
        }
        return i + 1 < w.exercises.length ? i + 1 : null;
    },

    _renderSets() {
        const el = document.getElementById('ex-sets');
        const w = this.activeWorkout;
        const ex = this._currentExercise();
        if (!el || !ex) return;
        const open = this._openIndex(ex);
        const rows = ex.setsData.map((_, i) => this._rowHTML(ex, i, open)).join('');
        let ni = this._nextExerciseIndex();
        // il compagno di superset ha già la sua riga sotto l'intestazione: "Poi" è l'esercizio dopo il giro
        const grp = this._group(this.currentExerciseIndex);
        if (grp && ni != null && grp.includes(ni)) ni = grp[grp.length - 1] + 1 < w.exercises.length ? grp[grp.length - 1] + 1 : null;
        let next = '';
        if (ni != null) {
            const nx = w.exercises[ni];
            const gif = this._gifUrl(nx.exerciseId);
            const letter = this._group(ni) ? this._exLetter(nx) : '';
            next = `
                <button type="button" class="row next-row" data-goto="${ni}">
                    ${gif ? `<span class="thumb thumb--sm"><img src="${GT.esc(gif)}" alt="" loading="lazy"></span>` : `<span class="thumb thumb--sm thumb--icon">${this.ico(this._equipIcon(nx.exerciseId), 'ico--sm')}</span>`}
                    <span class="row__body"><span class="cap">Poi</span><span class="row__title">${letter ? `${GT.esc(letter)} · ` : ''}${GT.esc(nx.name)} <span class="faint num">${nx.targetSets} × ${GT.esc(nx.targetReps)}</span></span></span>
                    <span class="row__end">${this.ico('next')}</span>
                </button>`;
        }
        el.innerHTML = `<ol class="sets" aria-label="Serie: ${GT.esc(ex.name)}">${rows}</ol>${next}`;
        el.querySelectorAll('.next-row img').forEach(img => img.addEventListener('error', () => img.remove(), { once: true }));
    },

    // Superset a metà giro: c'è un compagno prima di me che ha già fatto la serie di questo giro
    _supersetPending() {
        const i = this.currentExerciseIndex;
        const g = this._group(i);
        if (!g) return null;
        const pos = g.indexOf(i);
        if (pos <= 0 || !this._hasIncompleteWork(i)) return null;
        const doneOf = (j) => this.activeWorkout.exercises[j].setsData.filter(s => s.completed && this._isWork(s)).length;
        if (doneOf(g[pos - 1]) <= doneOf(i)) return null;
        const ex = this._currentExercise();
        const restAfter = this._exLetter(this.activeWorkout.exercises[g[g.length - 1]]);
        const after = pos < g.length - 1 ? `poi ${this._exLetter(this.activeWorkout.exercises[g[pos + 1]])}` : `recupero dopo ${restAfter}`;
        return { letter: this._exLetter(ex), after };
    },

    // Secondi rimasti con la stessa regola di Timer: per eccesso prima dello 0, per difetto dopo
    _remainingNow() {
        const m = this._restMeta;
        if (!m) return 0;
        const ms = m.endAt - Date.now();
        return ms > 0 ? Math.ceil(ms / 1000) : (-Math.floor(-ms / 1000) || 0);
    },

    // Stato del recupero adesso: none | run | last | over | gone
    _restState(remaining = null) {
        const m = this._restMeta;
        if (!m) return 'none';
        const r = remaining != null ? remaining : this._remainingNow();
        if (m.expired) return 'gone';
        if (r > 10) return 'run';
        if (r > 0) return 'last';
        return -r < 120 ? 'over' : 'gone';
    },

    // Testo di "Vai": la prossima cosa da fare
    _nextActionText() {
        const ex = this._currentExercise();
        if (!ex) return '';
        const idx = this._openIndex(ex);
        if (idx != null && !ex.setsData[idx].completed) {
            const letter = this._group(this.currentExerciseIndex) ? `${this._exLetter(ex)} · ` : '';
            return `${letter}${this._setName(ex, idx, true)}`;
        }
        const next = this._nextWithWork(this.currentExerciseIndex);
        return next != null ? this.activeWorkout.exercises[next].name : 'fine';
    },

    _renderDock() {
        const ex = this._currentExercise();
        if (!ex) return;
        const st = this._restState();
        const idx = this._openIndex(ex);
        const s = idx != null ? ex.setsData[idx] : null;
        const correcting = !!s?.completed;
        const running = st === 'run' || st === 'last';
        const ss = !running ? this._supersetPending() : null;

        const bar = document.getElementById('rest-bar');
        const over = document.getElementById('rest-over');
        const ssEl = document.getElementById('rest-ss');
        const row = document.getElementById('dock-row');
        if (bar) bar.hidden = !running;
        if (over) over.hidden = st !== 'over';
        if (ssEl) {
            ssEl.hidden = !ss;
            if (ss) document.getElementById('rest-ss-label').innerHTML = `Subito <b>${GT.esc(ss.letter)}</b> · ${GT.esc(ss.after)}`;
        }
        // Il bottone resta anche durante il recupero (R2-15): chi riparte prima fa un tocco solo,
        // la serie si registra e il recupero riparte da capo. Durante il recupero è secondario.
        if (row) row.hidden = false;
        const resting = running && !correcting;
        document.getElementById('seduta-dock')?.classList.toggle('is-resting', resting);
        const warm = !correcting && this._warmupPending();

        // Azione principale
        let label;
        let icon = 'check';
        if (warm) label = 'Riscaldamento fatto';
        else if (s && correcting) label = `Salva ${this._setName(ex, idx, true)}`;
        else if (s) {
            const kind = this._setKind(s);
            const base = this._setName(ex, idx);
            const letter = this._group(this.currentExerciseIndex) && kind === 'work' ? `${this._exLetter(ex)} · ` : '';
            label = kind === 'warm' ? `${base} fatto` : `${letter}${letter ? base.toLowerCase() : base} fatta`;
        } else if (this._nextWithWork(this.currentExerciseIndex) != null) {
            label = 'Avanti';
            icon = 'next';
        } else {
            label = 'Fine';
        }
        const main = document.getElementById('dock-main');
        if (main) {
            main.innerHTML = `${this.ico(icon)}<span id="dock-main-label">${GT.esc(label)}</span>`;
            main.dataset.action = warm ? 'warmup' : (s ? (correcting ? 'save' : 'done') : (icon === 'next' ? 'next' : 'finish'));
            main.classList.toggle('btn--primary', !resting);
            main.classList.toggle('btn--secondary', resting);
        }
        const undo = document.getElementById('dock-undo');
        if (undo) {
            undo.hidden = !correcting;
            if (correcting) undo.setAttribute('aria-label', `Segna ${this._setName(ex, idx, true)} da fare`);
        }
        if (st === 'over' && this._restMeta) this._renderOver(this._remainingNow());
        this._lastRestState = st;
    },

    // ========================================
    // CLIC NELLA PAGINA (delegati)
    // ========================================

    _onSedutaClick(e) {
        const t = e.target;
        const step = t.closest('[data-step]');
        if (step) {
            this._stepField(parseInt(step.dataset.set, 10), step.dataset.step, parseInt(step.dataset.dir, 10));
            return;
        }
        const rir = t.closest('.rir__opt');
        if (rir) {
            this.setRir(parseInt(rir.dataset.set, 10), parseInt(rir.dataset.rir, 10));
            return;
        }
        const row = t.closest('[data-set].set');
        if (row && !row.classList.contains('set--active')) {
            this._openSetAt(parseInt(row.dataset.set, 10));
            return;
        }
        const tool = t.closest('[data-tool]');
        if (tool) {
            const k = tool.dataset.tool;
            if (k === 'swap') this._openSwap();
            else if (k === 'note') this._openNote();
            else if (k === 'plates') this._openPlates();
            else if (k === 'info') this.showCurrentExerciseInfo();
            return;
        }
        if (t.closest('[data-history]')) {
            this._openHistory();
            return;
        }
        const mateInfo = t.closest('[data-sed-info]');
        if (mateInfo) {
            this._sedShowMate(parseInt(mateInfo.dataset.sedInfo, 10));
            return;
        }
        const mateGo = t.closest('[data-sed-goto]');
        if (mateGo) {
            this._goToExercise(parseInt(mateGo.dataset.sedGoto, 10));
            return;
        }
        if (t.closest('[data-expand]')) {
            this._mediaOpen = true;
            this._renderHead();
            document.querySelector('#ex-head [data-collapse]')?.focus({ preventScroll: true });
            return;
        }
        if (t.closest('[data-collapse]')) {
            this._mediaOpen = false;
            this._renderHead();
            document.querySelector('#ex-head [data-expand]')?.focus({ preventScroll: true });
            return;
        }
        const go = t.closest('.next-row[data-goto]');
        if (go) {
            this._goToExercise(parseInt(go.dataset.goto, 10));
            return;
        }
        if (t.closest('[data-calib]')) {
            const ex = this._currentExercise();
            if (ex && this._startCalibration(ex, { seedKg: this._suggestedWeight(ex) })) {
                this._renderHead();
                this._renderSets();
                this._renderDock();
                this._persistSession();
            }
            return;
        }
        if (t.closest('[data-help="rir"]')) {
            this.showNotification('RIR: le ripetizioni che avresti ancora potuto fare', 'info', { icon: 'help' });
        }
    },

    showCurrentExerciseInfo() {
        const ex = this._currentExercise();
        if (!ex) return;
        if (typeof this.openExercise === 'function') this.openExercise(ex.exerciseId);
        else if (typeof this.showExerciseInfoModal === 'function') this.showExerciseInfoModal(ex.exerciseId, ex.name, 'workout');
    },

    // ========================================
    // RECUPERO: barra nel dock, stessa macchina (Timer.startRest) a timestamp
    // ========================================

    // resumeEndAt: recupero ripreso dopo una ricarica (può essere già finito: niente segnali doppi)
    _startRest({ seconds, source = null, total = null, resumeEndAt = null }) {
        const resumed = Number(resumeEndAt) > 0;
        const secs = resumed ? Math.round(seconds) : Math.max(1, Math.round(seconds));
        const meta = {
            kind: 'rest',
            source,
            total: Math.max(1, secs, Math.round(total || secs)),
            endAt: resumed ? Number(resumeEndAt) : Date.now() + secs * 1000
        };
        this._restMeta = meta;
        this._lastAria = 0;
        this._setRestAdjustEnabled(true);
        try {
            Timer.startRest({
                seconds: Math.max(0, secs),
                kind: 'rest',
                endTime: meta.endAt,
                total: meta.total,
                onTick: (remaining, tot) => {
                    if (this._restMeta === meta) this._onRestTick(remaining, tot);
                },
                onZero: () => {
                    if (this._restMeta === meta) this._announce(`Recupero finito: vai, ${this._nextActionText()}`);
                },
                onStop: (reason) => {
                    // Dopo +5:00 il timer si ferma da solo: "Vai" sparisce, resta l'azione principale
                    if (reason === 'overtime' && this._restMeta === meta) {
                        meta.expired = true;
                        this._renderDock();
                        this._persistSession();
                    }
                }
            });
        } catch (e) {
            console.error('Timer.startRest', e);
        }
        this._onRestTick(this._remainingNow(), meta.total);
        if (!resumed) this._announce(`Recupero ${this._clock(secs)}`);
        this._persistSession();
    },

    _onRestTick(remaining, tot) {
        const meta = this._restMeta;
        if (!meta) return;
        const total = Math.max(meta.total || 0, tot || 0, 1);
        const st = this._restState(remaining);
        if (st !== this._lastRestState) {
            this._renderDock();
            if (st === 'last') this._announce(`${remaining} secondi`);
        }
        const bar = document.getElementById('rest-bar');
        if (st === 'run' || st === 'last') {
            if (bar) {
                bar.classList.toggle('is-last', st === 'last');
                const ex = this._currentExercise();
                const nextName = ex && this._openIndex(ex) == null && this._nextWithWork(this.currentExerciseIndex) != null
                    ? `Poi ${this.activeWorkout.exercises[this._nextWithWork(this.currentExerciseIndex)].name}` : 'Recupero';
                this._setText('rest-bar-label', st === 'last' ? 'Pronto' : nextName);
                // ultimi 10 s: solo i secondi ("6", non "0:06"): a 80 px stanno fra −15 e +15 anche a 360 px
                this._setText('rest-bar-time', st === 'last' ? String(Math.max(0, remaining)) : this._clock(remaining));
                const fill = document.getElementById('rest-bar-fill');
                if (fill) fill.style.setProperty('--p', `${Math.max(0, Math.min(100, (remaining / total) * 100))}%`);
                // aria-label del timer al massimo ogni 15 s (niente annunci ogni secondo)
                const now = Date.now();
                if (!this._lastAria || now - this._lastAria >= 15000 || st === 'last') {
                    this._lastAria = now;
                    const m = Math.floor(remaining / 60);
                    const sec = remaining % 60;
                    bar.setAttribute('aria-label', `Recupero: ${m ? `${m} ${m === 1 ? 'minuto' : 'minuti'} e ` : ''}${sec} secondi`);
                }
            }
        } else if (st === 'over') {
            this._renderOver(remaining);
        }
        // Segnale visivo (iPhone in silenzioso non suona né vibra): lampo a 3, 2, 1 e allo zero
        if (remaining <= 3 && remaining >= 0 && meta.flashedAt !== remaining) {
            meta.flashedAt = remaining;
            const target = remaining === 0 ? document.getElementById('rest-over') : bar;
            if (target) this._flashRestBar(target, remaining === 0);
        }
    },

    _renderOver(remaining) {
        const label = document.getElementById('rest-over-label');
        if (label) label.textContent = `Vai, ${this._nextActionText()}`;
        this._setText('rest-over-time', `+${this._clock(-remaining)}`);
        document.getElementById('rest-over')?.setAttribute('aria-label', `Recupero finito da ${-remaining} secondi`);
    },

    _flashRestBar(el, strong) {
        el.classList.add('is-flash');
        setTimeout(() => el.classList.remove('is-flash'), strong ? 700 : 350);
        if (this._reduceMotion() || typeof el.animate !== 'function') return;
        try {
            el.animate(
                [{ filter: 'brightness(1)' }, { filter: strong ? 'brightness(1.6)' : 'brightness(1.35)' }, { filter: 'brightness(1)' }],
                { duration: strong ? 600 : 300, iterations: strong ? 2 : 1 }
            );
        } catch (e) { /* no-op */ }
    },

    _setRestAdjustEnabled(on) {
        ['rest-bar-minus', 'rest-bar-plus'].forEach(id => {
            const b = document.getElementById(id);
            if (b) b.disabled = !on;
        });
    },

    _adjustRest(delta) {
        if (!this._restMeta || this._restMeta.expired) return;
        this._restMeta.endAt += delta * 1000;
        const remaining = this._remainingNow();
        if (remaining > this._restMeta.total) this._restMeta.total = remaining;
        if (remaining > 3) this._restMeta.flashedAt = null;
        try {
            Timer.adjustRest(delta);
        } catch (e) {
            console.warn('Timer.adjustRest', e);
        }
        this._onRestTick(remaining, this._restMeta.total);
        this._persistSession();
    },

    _stopRest() {
        try {
            Timer.stopRest();
        } catch (e) {
            /* no-op */
        }
        const had = !!this._restMeta;
        this._restMeta = null;
        const bar = document.getElementById('rest-bar');
        if (bar) bar.classList.remove('is-last', 'is-flash');
        if (this.activeWorkout) this._renderDock();
        if (had) this._persistSession();
    },

    _skipRest() {
        this._stopRest();
        this._announce('Recupero saltato');
    },

    // ========================================
    // ⋯ AZIONI: elenco degli esercizi (per saltare), libreria, annulla
    // ========================================

    _openMore() {
        const list = document.getElementById('session-ex-list');
        const w = this.activeWorkout;
        if (list && w) {
            list.innerHTML = w.exercises.map((ex, i) => {
                const work = ex.setsData.filter(s => this._isWork(s));
                const done = work.filter(s => s.completed).length;
                const complete = work.length > 0 && done === work.length;
                const letter = this._group(i) ? `${this._exLetter(ex)} · ` : '';
                return `
                    <button type="button" class="row" data-goto="${i}"${i === this.currentExerciseIndex ? ' aria-current="step"' : ''}>
                        <span class="row__icon${complete ? ' row__icon--ok' : ''}">${complete ? this.ico('check') : `<span class="num">${i + 1}</span>`}</span>
                        <span class="row__body"><span class="row__title">${GT.esc(letter)}${GT.esc(ex.name)}</span><span class="row__sub"><span class="num">${done}</span> di <span class="num">${work.length}</span> serie</span></span>
                        <span class="row__end">${this.ico('next')}</span>
                    </button>`;
            }).join('');
        }
        this._openModal('session-more-modal');
    },

    // ========================================
    // SCAMBIA: macchina occupata → alternative con il peso convertito, o scelta dalla libreria
    // ========================================

    _swapAlternatives(ex) {
        const w = this.activeWorkout;
        // Si converte sempre dal peso di lavoro, mai da un avvicinamento o da una prova (R2-01)
        const kg = this._workKg(ex);
        const opts = { reason: 'busy', sessionExerciseIds: w.exercises.map(e => e.exerciseId), kg, targetReps: ex.targetReps, limit: 5 };
        try {
            if (this._storeFn('getAlternatives')) return Storage.getAlternatives(ex.exerciseId, opts) || [];
            if (this._algoFn('getAlternatives')) return TrainingAlgorithm.getAlternatives(ex.exerciseId, Storage.getProfile(), { ...opts, gym: this._gym() }) || [];
        } catch (e) {
            console.warn('getAlternatives', e);
        }
        return [];
    },

    // Peso di lavoro dell'esercizio: la serie aperta se è di lavoro, altrimenti la prima di lavoro
    // (fatta o da fare); 0 se non c'è
    _workKg(ex) {
        const idx = this._openIndex(ex);
        const open = idx != null ? ex.setsData[idx] : null;
        if (open && this._isWork(open) && GT.num(open.weight) > 0) return GT.num(open.weight);
        const first = ex.setsData.find(s => this._isWork(s) && GT.num(s.weight) > 0);
        return first ? GT.num(first.weight) : 0;
    },

    _weightHint(alt) {
        const m = alt.weight || {};
        if (m.mode === 'bodyweight') return 'Corpo libero';
        if (m.mode === 'find' || m.kg == null) return 'Trova il peso';
        return `${this.fmt(m.kg)} kg${m.mode === 'history' ? ' · come l\'ultima volta' : ''}`;
    },

    _openSwap() {
        const ex = this._currentExercise();
        const body = document.getElementById('swap-body');
        if (!ex || !body) return;
        this._setText('swap-title', `Scambia ${ex.name}`);
        const alts = this._swapAlternatives(ex);
        this._swapAlts = alts;
        const rows = alts.map((a, k) => {
            const data = EXERCISES_DB[a.exerciseId] || {};
            const gif = this._gifUrl(a.exerciseId);
            return `
                <button type="button" class="row swap__row" data-alt="${k}">
                    ${gif ? `<span class="thumb thumb--sm"><img src="${GT.esc(gif)}" alt="" loading="lazy"></span>` : `<span class="thumb thumb--sm thumb--icon">${this.ico(this._equipIcon(a.exerciseId), 'ico--sm')}</span>`}
                    <span class="row__body"><span class="row__title">${GT.esc(data.name || a.exerciseId)}</span><span class="row__sub">${GT.esc(this._weightHint(a))}</span></span>
                    <span class="row__end">${this.ico('swap')}</span>
                </button>`;
        }).join('');
        const lib = typeof this.pickExercise === 'function'
            ? `<button type="button" class="btn btn--secondary btn--block" data-swap-lib>${this.ico('search')}Cerca nella libreria</button>` : '';
        body.innerHTML = alts.length
            ? `<p class="muted">Esercizi simili, con il peso</p><div class="group">${rows}</div>${lib}`
            : `<div class="empty"><span class="empty__icon">${this.ico('swap', 'ico--xl')}</span><p>Nessuna alternativa con la tua attrezzatura</p>${lib}</div>`;
        body.querySelectorAll('img').forEach(img => img.addEventListener('error', () => img.remove(), { once: true }));
        this._openModal('swap-modal');
    },

    _onSwapClick(e) {
        const row = e.target.closest('[data-alt]');
        if (row) {
            const alt = this._swapAlts?.[parseInt(row.dataset.alt, 10)];
            this._closeModal('swap-modal');
            if (alt) this._applySwap(alt.exerciseId, alt.weight || {});
            return;
        }
        if (e.target.closest('[data-swap-lib]')) {
            const ex = this._currentExercise();
            this._closeModal('swap-modal');
            if (!ex || typeof this.pickExercise !== 'function') return;
            const fromId = ex.exerciseId;
            const kg = this._workKg(ex);
            this.pickExercise({
                title: `Al posto di ${ex.name}`,
                filter: { exclude: this.activeWorkout.exercises.map(x => x.exerciseId) },
                onPick: (id) => {
                    if (!id || !EXERCISES_DB[id] || !this.activeWorkout) return;
                    this.navigateTo('seduta');
                    this._applySwap(id, this._convertFor(fromId, id, kg));
                }
            });
        }
    },

    // Peso per un esercizio scelto dalla libreria: storico → suggerimento; altrimenti conversione o "Trova il peso"
    _convertFor(fromId, toId, kg) {
        try {
            if (this._storeFn('getExerciseSessions') && Storage.getExerciseSessions(toId, { limit: 1, excludeDeload: false }).length) {
                return { kg: null, mode: 'history', confidence: 'alta' };
            }
            if (this._algoFn('convertLoad')) {
                const c = TrainingAlgorithm.convertLoad(fromId, toId, kg, this._gym()) || {};
                if (c.mode === 'find') c.seedKg = this._storeFn('getStartingLoad') ? Storage.getStartingLoad(toId).kg : null;
                return c;
            }
        } catch (e) { /* ripiego */ }
        return { kg: null, mode: 'history' };
    },

    _applySwap(newId, weight = {}) {
        const w = this.activeWorkout;
        const exIdx = this.currentExerciseIndex;
        const ex = w?.exercises?.[exIdx];
        const data = EXERCISES_DB[newId];
        if (!ex || !data || newId === ex.exerciseId) return;
        const snapshot = JSON.parse(JSON.stringify({ exercises: w.exercises, idx: exIdx }));
        // Restano all'esercizio di prima solo se c'è almeno una serie di lavoro fatta: avvicinamenti e
        // prove di un esercizio lasciato a metà non sono una seduta di quell'esercizio
        const done = ex.setsData.some(s => s.completed && this._isWork(s)) ? ex.setsData.filter(s => s.completed) : [];
        const remaining = Math.max(1, ex.setsData.filter(s => this._isWork(s) && !s.completed).length);
        const metaNew = this._exMeta(newId);
        const rirAdj = Number(weight.rirAdjust) > 0 ? Number(weight.rirAdjust) : 0;
        const baseRir = ex.targetRir !== null && ex.targetRir !== undefined && Number.isFinite(Number(ex.targetRir)) ? Number(ex.targetRir) : null;
        const fresh = {
            exerciseId: newId,
            name: data.name,
            type: data.type || 'compound',
            sets: remaining,
            reps: ex.targetReps,
            rest: ex.rest,
            targetReps: ex.targetReps,
            targetSets: remaining,
            originalSets: ex.originalSets,
            targetRir: baseRir != null ? Math.min(4, baseRir + rirAdj) : null,
            role: ex.role,
            metric: metaNew?.metric || 'reps',
            substitutedFrom: ex.substitutedFrom || ex.exerciseId,
            openSet: null,
            // rampa solo se non c'è lavoro fatto; già scaldato su quello di prima: un solo avvicinamento
            wantsRamp: !done.length && ex.wantsRamp ? (ex.setsData.some(s => s.isWarmup && s.completed) ? 'single' : ex.wantsRamp) : false,
            setsData: Array.from({ length: remaining }, () => ({ weight: '', reps: '', completed: false }))
        };
        ['supersetGroup', 'supersetOrder', 'supersetRest', 'transitionTime', 'isGiantSet'].forEach(k => { if (ex[k] !== undefined) fresh[k] = ex[k]; });
        if (Number.isFinite(Number(weight.kg)) && weight.kg !== null && weight.mode !== 'history') fresh.presetKg = Number(weight.kg);

        if (done.length) {
            // Le serie già fatte restano all'esercizio di prima; il resto passa al nuovo, subito dopo
            ex.setsData = done;
            ex.targetSets = done.filter(s => this._isWork(s)).length || 1;
            ex.openSet = null;
            ['supersetGroup', 'supersetOrder', 'supersetRest', 'transitionTime', 'isGiantSet'].forEach(k => { delete ex[k]; });
            w.exercises.splice(exIdx + 1, 0, fresh);
            this.currentExerciseIndex = exIdx + 1;
        } else {
            w.exercises[exIdx] = fresh;
        }
        if (this._ctxCache) delete this._ctxCache[newId];
        this._buildSupersetMap();
        this._mediaOpen = false;
        this._prefill(fresh);
        if (weight.mode === 'find' && !fresh.calib) this._startCalibration(fresh, { seedKg: weight.seedKg });
        this._renderAll();
        this._persistSession();
        this._swapUndo = snapshot;
        // una riga: il nome nuovo basta, l'icona dice "scambiato"; i nomi lunghi finiscono coi puntini
        // (il nome intero è nel titolo appena sotto) — R2-17
        const toast = this.showNotification(`Ora ${data.name}`, 'info', {
            icon: 'swap',
            action: { label: 'Annulla', onClick: () => this._undoSwap(snapshot) }
        });
        toast?.classList?.add('toast--one');
    },

    _undoSwap(snapshot) {
        if (!this.activeWorkout || this._swapUndo !== snapshot) return;
        this.activeWorkout.exercises = snapshot.exercises;
        this.currentExerciseIndex = snapshot.idx;
        this._swapUndo = null;
        this._buildSupersetMap();
        this._renderAll();
        this._persistSession();
    },

    // ========================================
    // NOTA PER ESERCIZIO (profilo.exerciseNotes[exerciseId]): resta per le prossime volte
    // ========================================

    _openNote() {
        const ex = this._currentExercise();
        if (!ex) return;
        const note = this._exerciseNote(ex.exerciseId);
        this._setText('note-title', `Nota · ${ex.name}`);
        const ta = document.getElementById('note-text');
        // bozza rimasta da una chiusura con Esc: si ritrova (R2-06)
        const draft = this._noteDraft?.id === ex.exerciseId ? this._noteDraft.text : null;
        if (ta) ta.value = draft != null ? draft : note;
        const clear = document.getElementById('note-clear');
        if (clear) clear.hidden = !note;
        this._noteFor = ex.exerciseId;
        this._openModal('note-modal', '#note-text');
    },

    // Testo nel campo diverso dalla nota salvata (spazi a parte)
    _noteChanged() {
        const ta = document.getElementById('note-text');
        if (!ta || !this._noteFor) return false;
        return ta.value.trim() !== this._exerciseNote(this._noteFor).trim();
    },

    _saveNote(text) {
        const id = this._noteFor;
        if (!id) return;
        this._noteDraft = null;
        const t = String(text || '').trim().slice(0, 140);
        const p = Storage.getProfile();
        const notes = { ...(p.exerciseNotes && typeof p.exerciseNotes === 'object' ? p.exerciseNotes : {}) };
        if (t) notes[id] = t;
        else delete notes[id];
        const ok = Storage.saveProfile({ exerciseNotes: notes });
        this._closeModal('note-modal');
        if (ok === false) {
            this.showNotification('Memoria piena: nota non salvata', 'warning');
            return;
        }
        if (this.activeWorkout) this._renderHead();
        this.showNotification(t ? 'Nota salvata' : 'Nota cancellata', 'success', { icon: 'note' });
    },

    // ========================================
    // ULTIME SEDUTE DELL'ESERCIZIO (tocco sul nome): data, serie peso × ripetizioni, RIR
    // ========================================

    _historySessions(exerciseId, limit = 3) {
        let list = [];
        try {
            if (this._storeFn('getExerciseSessions')) list = Storage.getExerciseSessions(exerciseId, { limit, excludeDeload: false }) || [];
        } catch (e) { list = []; }
        if (!list.length) {
            try {
                for (const w of Storage.getWorkouts()) {
                    if (list.length >= limit) break;
                    if (!Array.isArray(w?.exercises)) continue;
                    const sets = w.exercises.filter(e => e?.exerciseId === exerciseId && Array.isArray(e.sets)).flatMap(e => e.sets);
                    if (sets.length) list.push({ date: w.date, phase: w.cyclePhase || null, sets });
                }
            } catch (e) { list = []; }
        }
        return list.map(s => ({
            date: s.date,
            phase: s.phase || null,
            sets: (s.sets || []).filter(x => x && x.completed && !x.isWarmup && !x.isCalibration && GT.num(x.reps) > 0).map(x => ({
                weight: x.isBodyweight ? 0 : Math.max(0, GT.num(x.weight)),
                reps: Math.round(GT.num(x.reps)),
                rir: x.rir === undefined || x.rir === null || x.rir === '' || !Number.isFinite(Number(x.rir)) ? null : Number(x.rir)
            }))
        })).filter(s => s.sets.length).slice(0, limit);
    },

    _openHistory() {
        const ex = this._currentExercise();
        const body = document.getElementById('ex-history-body');
        if (!ex || !body) return;
        const sessions = this._historySessions(ex.exerciseId, 3);
        this._setText('ex-history-title', ex.name);
        if (!sessions.length) {
            body.innerHTML = `<div class="empty"><span class="empty__icon">${this.ico('clock', 'ico--xl')}</span><p>Nessuna seduta salvata</p></div>`;
        } else {
            body.innerHTML = `<p class="muted">${sessions.length === 1 ? 'Ultima seduta' : `Ultime <span class="num">${sessions.length}</span> sedute`}</p>
                <ol class="hist__list">${sessions.map(s => {
                    const d = new Date(s.date);
                    const day = Number.isNaN(d.getTime()) ? '' : this._capFirst(d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' }));
                    const rel = Number.isNaN(d.getTime()) ? '' : String(GT.formatRelativeDay(d) || '');
                    const relHTML = /^(oggi|ieri)$|giorni fa$/i.test(rel) ? `<span class="faint">${GT.esc(rel)}</span>` : '';
                    const deload = /^(deload|scarico)/i.test(String(s.phase || '')) ? '<span class="phase" data-ph="del">Scarico</span>' : '';
                    const rows = s.sets.map((x, k) => {
                        const rirTxt = x.rir === 4 ? '4+' : x.rir;
                        return `<li class="hist__set">
                            <span class="hist__n num">${k + 1}</span>
                            <span class="set__val">${this._valHTML(ex, x, false)}</span>
                            ${x.rir != null ? `<span class="rir-dot" data-rir="${x.rir}">RIR ${rirTxt}</span>` : '<span></span>'}
                        </li>`;
                    }).join('');
                    return `<li class="hist__s">
                        <h3 class="hist__head"><span>${GT.esc(day)}</span>${relHTML}${deload}</h3>
                        <ol class="hist__sets">${rows}</ol>
                    </li>`;
                }).join('')}</ol>`;
        }
        this._openModal('ex-history-modal', '#ex-history-close');
    },

    // ========================================
    // CALCOLATORE DISCHI (§3.5): bilanciere disegnato, colori IWF, somma per lato
    // ========================================

    _openPlates() {
        const ex = this._currentExercise();
        if (!ex) return;
        const idx = this._openIndex(ex);
        const s = ex.setsData[idx ?? -1] || ex.setsData.find(x => this._isWork(x) && !x.completed) || ex.setsData[0];
        this._platesFor = { exerciseId: ex.exerciseId, kg: GT.num(s?.weight) };
        let bar = 20;
        try {
            if (this._storeFn('getPlates')) bar = Number(Storage.getPlates(ex.exerciseId, this._platesFor.kg)?.barKg);
            else bar = this._loadType(ex.exerciseId) === 'machine-plate' ? 0 : (this._loadType(ex.exerciseId) === 'ez-bar' ? 10 : 20);
        } catch (e) { bar = 20; }
        this._platesBar = Number.isFinite(bar) ? bar : 20;
        this._renderPlates();
        this._openModal('plates-modal', '#plates-close');
    },

    _calcPlates(kg, barKg) {
        const gym = this._gym() || {};
        if (this._algoFn('calcPlates')) {
            try { return TrainingAlgorithm.calcPlates(kg, { barKg, plates: gym.plates, plateCounts: gym.plateCounts }); } catch (e) { /* ripiego */ }
        }
        // Ripiego: avido dal disco più grande, per difetto
        const plates = (gym.plates || [25, 20, 15, 10, 5, 2.5, 1.25]).slice().sort((a, b) => b - a);
        if (!(kg >= barKg)) return { perSide: [], achieved: barKg, exact: false, belowBar: true };
        let rem = Math.floor(Math.round((kg - barKg) * 4) / 2);
        const perSide = [];
        plates.forEach(p => { const u = Math.round(p * 4); while (u > 0 && u <= rem) { perSide.push(p); rem -= u; } });
        const achieved = barKg + 2 * perSide.reduce((a, p) => a + p, 0);
        return { perSide, achieved, exact: Math.abs(achieved - kg) < 0.001, belowBar: false };
    },

    _renderPlates() {
        const body = document.getElementById('plates-body');
        const f = this._platesFor;
        if (!body || !f) return;
        const lt = this._loadType(f.exerciseId);
        const bar = lt === 'machine-plate' ? 0 : this._platesBar;
        const res = this._calcPlates(f.kg, bar);
        const per = res.perSide || [];
        this._setText('plates-title', `Dischi per ${this.fmt(f.kg)} kg`);
        const counts = [];
        per.forEach(p => {
            const last = counts[counts.length - 1];
            if (last && last.p === p) last.n++;
            else counts.push({ p, n: 1 });
        });
        const word = (n) => ['', 'un disco', 'due dischi', 'tre dischi', 'quattro dischi', 'cinque dischi'][n] || `${n} dischi`;
        const spoken = per.length ? `Su ogni lato: ${counts.map(c => `${word(c.n)} da ${this.fmt(c.p)}`).join(', ')} kg` : 'Nessun disco: solo il bilanciere';
        const known = [25, 20, 15, 10, 5, 2.5, 1.25];
        const platesHTML = per.map(p => `<span class="plate" data-kg="${known.includes(p) ? p : 'x'}">${p === 1.25 ? '' : GT.esc(this.fmt(p))}</span>`).join('');
        const sum = per.length ? per.map(p => `<span>${GT.esc(this.fmt(p))}</span>`).join('<span class="op">+</span>') : '<span class="faint">Niente dischi</span>';
        const perSideKg = per.reduce((a, p) => a + p, 0);
        let note = '';
        if (res.belowBar) note = `<p class="plates__note">${this.ico('alert', 'ico--sm')}Meno del bilanciere: <span class="num">${this.fmt(bar)}</span>&nbsp;kg</p>`;
        else if (!res.exact) note = `<p class="plates__note">${this.ico('alert', 'ico--sm')}<span class="num">${this.fmt(res.achieved)}</span>&nbsp;kg: <span class="num">${this.fmt(f.kg)}</span> non si può fare</p>`;
        const seg = lt === 'machine-plate' ? '' : `
            <div class="field">
                <span class="label" id="bar-l">Bilanciere</span>
                <div class="seg" role="radiogroup" aria-labelledby="bar-l">
                    ${[20, 15, 10].map(b => `<button type="button" role="radio" aria-checked="${b === bar}" data-bar="${b}"><span class="num">${b}</span>&nbsp;kg</button>`).join('')}
                </div>
            </div>`;
        body.innerHTML = `
            <div class="plates__bar" role="img" aria-label="${GT.esc(spoken)}">
                <span class="plates__sleeve-in"></span><span class="plates__collar"></span>
                ${platesHTML}
                <span class="plates__sleeve"></span>
            </div>
            <div>
                <p class="cap">Su ogni lato</p>
                <p class="plates__sum num">${sum}</p>
            </div>
            ${note}
            ${seg}
            <p class="faint num plates__formula">${GT.esc(this.fmt(res.achieved))} = ${bar ? `${GT.esc(this.fmt(bar))} + ` : ''}2 × ${GT.esc(this.fmt(perSideKg))}</p>
        `;
    },

    // ========================================
    // DEFATICAMENTO (foglio) E FINE
    // ========================================

    _hideCooldown() {
        const modal = document.getElementById('cooldown-modal');
        if (!modal) return;
        if (modal.classList.contains('active')) this._closeModal('cooldown-modal');
        modal.style.display = '';
        modal.classList.remove('active');
        this._syncSheets?.();
    },

    showCooldown() {
        const w = this.activeWorkout;
        if (!w) return;
        let cooldown = null;
        const key = w.warmup || 'full-body';
        try {
            if (typeof Warmups.getCooldownForDuration === 'function') cooldown = Warmups.getCooldownForDuration(key, w.sessionMinutes || 60);
            if (!cooldown && w.warmup) cooldown = Warmups.getCooldownByKey(w.warmup);
            if (!cooldown) cooldown = Warmups.getCooldownForWorkout(w.type || 'full-body');
        } catch (e) {
            cooldown = null;
        }
        if (!cooldown || !cooldown.exercises?.length) {
            this.finishWorkout();
            return;
        }
        const n = cooldown.exercises.length;
        const minutes = Number(cooldown.durationMin);
        this._setText('cooldown-info', `${minutes > 0 ? `${Math.round(minutes)} min · ` : ''}${n} ${n === 1 ? 'esercizio' : 'esercizi'}`);
        const list = document.getElementById('cooldown-exercises');
        if (list) list.innerHTML = this._routineRows(cooldown.exercises);
        const modal = document.getElementById('cooldown-modal');
        if (modal) {
            modal.style.display = '';
            modal.classList.remove('active');
            this._openModal('cooldown-modal', '#complete-cooldown');
        }
    },

    // Serie da salvare: numeri veri, senza i campi di servizio della sessione
    _cleanSet(s) {
        const out = {
            weight: s.weight === '' || s.weight == null ? '' : Math.max(0, GT.num(s.weight)),
            reps: s.reps === '' || s.reps == null ? '' : Math.max(0, Math.round(GT.num(s.reps))),
            completed: !!s.completed
        };
        if (s.rir !== undefined && s.rir !== null && s.rir !== '' && Number.isFinite(Number(s.rir))) out.rir = Number(s.rir);
        if (s.isNewPR) out.isNewPR = true;
        if (s.isWarmup) out.isWarmup = true;
        if (s.isCalibration) out.isCalibration = true;
        if (s.isBodyweight) out.isBodyweight = true;   // solo serie della v1.26 riprese
        return out;
    },

    /**
     * Chiude e salva la sessione, poi apre il riepilogo.
     * @param {{date?: Date, endTime?: number}} opts - per salvare una sessione rimasta aperta (data vera)
     */
    finishWorkout(opts = {}) {
        const w = this.activeWorkout;
        if (!w) return;
        this._hideCooldown();

        const endMs = opts.endTime || Date.now();
        const duration = Math.max(0, Math.round((endMs - w.startTime) / 1000));
        const exercises = w.exercises.map(ex => {
            const out = {
                exerciseId: ex.exerciseId,
                name: ex.name,
                targetReps: ex.targetReps,
                targetSets: ex.targetSets,
                role: ex.role || null,
                metric: ex.metric || 'reps',
                substitutedFrom: ex.substitutedFrom || null,
                // rampa e prove lasciate da fare non si salvano; le serie di lavoro non fatte restano
                // vuote (i valori proposti non sono serie vere: R1-02)
                sets: ex.setsData.filter(s => s.completed || this._isWork(s))
                    .map(s => (s.completed ? this._cleanSet(s) : { weight: '', reps: '', completed: false }))
            };
            if (ex.targetRir !== null && ex.targetRir !== undefined && Number.isFinite(Number(ex.targetRir))) out.targetRir = Number(ex.targetRir);
            return out;
        });

        // Volume = kg × ripetizioni: non per gli esercizi a tempo (secondi) né per le assistite
        // (il peso è un aiuto, non un carico: R1-14)
        let totalVolume = 0;
        let totalSets = 0;
        exercises.forEach(ex => {
            const noVolume = ex.metric === 'time' || this._isTimed(ex.exerciseId) || this._loadType(ex.exerciseId) === 'assisted';
            ex.sets.forEach(s => {
                if (s.completed && s.reps > 0 && !s.isWarmup && !s.isCalibration) {
                    totalSets++;
                    if (!noVolume) totalVolume += GT.num(s.weight) * s.reps;
                }
            });
        });

        // Nessuna serie: non si salva, la pagina torna allo stato iniziale (C1)
        if (totalSets === 0) {
            this._teardownWorkout();
            this.showNotification('Nessuna serie fatta: non salvata', 'info');
            return;
        }

        const workoutData = {
            name: w.name,
            type: w.type,
            dayIndex: w.dayIndex ?? null,
            programId: w.programId ?? null,
            cycleNumber: w.cycleNumber ?? null,
            cycleWeek: w.cycleWeek ?? null,
            isFreeWorkout: !!w.isFreeWorkout,
            exercises,
            duration,
            totalVolume: Math.round(totalVolume),
            totalSets
        };
        if (w.cyclePhase) workoutData.cyclePhase = w.cyclePhase;
        if (w.compressed) workoutData.compressed = true;
        if (opts.date) workoutData.date = opts.date.toISOString();

        // Il confronto si fa con lo storico di PRIMA del salvataggio
        let previous = [];
        try { previous = Storage.getWorkouts(); } catch (e) { previous = []; }
        const summary = this._buildSummary({ ...workoutData, date: workoutData.date || new Date(endMs).toISOString() }, previous, {
            liveExercises: w.exercises, isSimulation: !!w.isSimulation
        });

        if (!w.isSimulation) {
            try {
                const saved = Storage.saveWorkout(workoutData);
                if (saved?.id != null) summary.workoutId = saved.id;
            } catch (e) {
                console.error('saveWorkout', e);
                // La sessione resta aperta e salvata in active_session: nulla va perso
                this.showNotification(e?.code === 'QUOTA'
                    ? 'Memoria piena: NON salvata. Esporta i dati e riprova'
                    : 'Salvataggio non riuscito: riprova', 'error');
                return;
            }
        }
        summary.progressions = w.isSimulation ? [] : this._buildProgressions(w);
        this.lastWorkoutSummary = summary;

        this._teardownWorkout({ to: 'riepilogo' });
        if (this.currentPage !== 'riepilogo') this.navigateTo('riepilogo', { replace: true });
        this._safe(() => this.loadProgress());
        if (w.isSimulation) this.showNotification('Simulazione finita: nulla salvato', 'info');
    },

    // Cosa fare la prossima volta: stessa logica dell'avviso in seduta (Storage.evaluateSets, C7)
    _buildProgressions(w) {
        const byId = new Map();
        w.exercises.forEach(ex => {
            const entry = byId.get(ex.exerciseId) || { name: ex.name, sets: [], targetReps: ex.targetReps, targetRir: ex.targetRir };
            entry.sets.push(...ex.setsData.filter(s => this._isWork(s)));
            byId.set(ex.exerciseId, entry);
        });
        const out = [];
        byId.forEach((entry, id) => {
            let ev = null;
            try { ev = Storage.evaluateSets(id, entry.sets, entry.targetReps, { targetRir: entry.targetRir }); } catch (e) { ev = null; }
            if (!ev?.action) return;
            out.push({ exerciseId: id, name: entry.name, action: ev.action === 'up' ? 'up' : (ev.action === 'reps' ? 'reps' : 'maintain'), nextWeight: ev.nextWeight ?? null });
        });
        return out;
    },

    // ========================================
    // RIEPILOGO (#riepilogo): durata, volume, serie, record, confronto con l'ultima volta
    // ========================================

    // Serie migliore: più peso (a parità più ripetizioni); a corpo libero e a tempo, più ripetizioni/secondi
    _bestSet(sets) {
        let best = null;
        sets.forEach(s => {
            const w = s.isBodyweight ? 0 : GT.num(s.weight);
            const r = Math.round(GT.num(s.reps));
            if (!(r > 0)) return;
            if (!best || w > best.weight + 1e-9 || (Math.abs(w - best.weight) < 1e-9 && r > best.reps)) best = { weight: w, reps: r };
        });
        return best;
    },

    _workSetsOf(ex) {
        return (ex?.sets || []).filter(s => s && s.completed && !s.isWarmup && !s.isCalibration && GT.num(s.reps) > 0);
    },

    /**
     * Riepilogo da una seduta (appena finita o salvata) e dallo storico precedente.
     * opts.liveExercises: esercizi della sessione con i dettagli dei record (tipo e valore di prima).
     */
    _buildSummary(workout, previous = [], opts = {}) {
        const exercises = workout.exercises || [];
        const t = Date.parse(workout.date) || Date.now();
        const prev = (previous || []).filter(p => p && p.id !== workout.id && (Date.parse(p.date) || 0) <= t);
        const live = opts.liveExercises || null;

        // Record (uno per esercizio: il peso più alto batte il massimale stimato)
        const records = [];
        exercises.forEach((ex, i) => {
            const liveSets = live?.[i]?.exerciseId === ex.exerciseId ? live[i].setsData.filter(s => s.completed && this._isWork(s)) : null;
            const sets = liveSets || this._workSetsOf(ex);
            const prs = sets.filter(s => s.isNewPR);
            if (!prs.length) return;
            const pick = prs.find(s => s.prType === 'weight') || prs.find(s => s.prType === 'e1rm') || prs[0];
            const best = prs.reduce((b, s) => (!b || GT.num(s.weight) > GT.num(b.weight) ? s : b), null);
            const s = pick.prType === 'weight' ? best : pick;
            const already = records.find(r => r.exerciseId === ex.exerciseId);
            if (already) return;
            records.push({
                exerciseId: ex.exerciseId,
                name: ex.name,
                type: s.prType || null,
                weight: GT.num(s.weight),
                reps: Math.round(GT.num(s.reps)),
                newValue: Number.isFinite(Number(s.prNew)) ? Number(s.prNew) : null,
                oldValue: Number.isFinite(Number(s.prOld)) ? Number(s.prOld) : null,
                timed: this._isTimed(ex.exerciseId)
            });
        });

        // Confronto con l'ultima volta (la seduta salvata più recente con quell'esercizio)
        const seen = new Set();
        const cmp = [];
        exercises.forEach(ex => {
            if (seen.has(ex.exerciseId)) return;
            seen.add(ex.exerciseId);
            const allNow = exercises.filter(e => e.exerciseId === ex.exerciseId).flatMap(e => this._workSetsOf(e));
            const now = this._bestSet(allNow);
            if (!now) return;
            let was = null;
            for (const p of prev) {
                const sets = (p.exercises || []).filter(e => e?.exerciseId === ex.exerciseId).flatMap(e => this._workSetsOf(e));
                if (sets.length) { was = this._bestSet(sets); break; }
            }
            cmp.push({ exerciseId: ex.exerciseId, name: ex.name, now, was, timed: this._isTimed(ex.exerciseId) });
        });

        // Volume rispetto all'ultima seduta dello stesso giorno della scheda (o con lo stesso nome)
        let volumeDelta = null;
        const same = prev.find(p => !p.isFreeWorkout && (
            (workout.dayIndex != null && p.dayIndex === workout.dayIndex && (workout.programId == null || p.programId === workout.programId)) ||
            (workout.dayIndex == null && p.name === workout.name)));
        if (same && GT.num(same.totalVolume) > 0) volumeDelta = Math.round((GT.num(workout.totalVolume) - GT.num(same.totalVolume)) / GT.num(same.totalVolume) * 100);

        return {
            name: workout.name,
            date: new Date(t).toISOString(),
            duration: workout.duration || 0,
            volume: Math.round(GT.num(workout.totalVolume)),
            sets: workout.totalSets || 0,
            isSimulation: !!opts.isSimulation,
            isFreeWorkout: !!workout.isFreeWorkout,
            dayIndex: workout.dayIndex ?? null,
            workoutId: workout.id ?? null,
            exercises: exercises.map(ex => ({ exerciseId: ex.exerciseId, name: ex.name, setsData: ex.sets })),
            records,
            cmp,
            volumeDelta
        };
    },

    /** Apre il riepilogo di una seduta salvata (per "Ultima seduta" in Oggi o lo storico). */
    openWorkoutSummary(workoutId) {
        let all = [];
        try { all = Storage.getWorkouts(); } catch (e) { all = []; }
        const w = all.find(x => String(x.id) === String(workoutId)) || all[0];
        if (!w) return false;
        this.lastWorkoutSummary = this._buildSummary(w, all, {});
        this._summaryFromHistory = true;
        this.navigateTo('riepilogo');
        return true;
    },

    _deltaHTML(kind, value, unit) {
        const icon = kind === 'up' ? 'arrow-up' : (kind === 'down' ? 'arrow-down' : 'equal');
        return `<span class="delta delta--${kind === 'same' ? 'same' : kind}">${this.ico(icon)}${GT.esc(value)}${unit ? ` ${GT.esc(unit)}` : ''}</span>`;
    },

    _cmpDelta(c) {
        if (!c.was) return '<span class="delta delta--same">nuovo</span>';
        const dw = Math.round((c.now.weight - c.was.weight) * 100) / 100;
        if (Math.abs(dw) >= 0.01 && (c.now.weight > 0 || c.was.weight > 0)) {
            return this._deltaHTML(dw > 0 ? 'up' : 'down', `${dw > 0 ? '+' : '−'}${this.fmt(Math.abs(dw))}`, 'kg');
        }
        const dr = c.now.reps - c.was.reps;
        if (dr !== 0) return this._deltaHTML(dr > 0 ? 'up' : 'down', `${dr > 0 ? '+' : '−'}${Math.abs(dr)}`, c.timed ? 's' : 'rip.');
        return this._deltaHTML('same', 'uguale', '');
    },

    _setText2(c, s) {
        if (c.timed) return `${s.reps} s`;
        return s.weight > 0 ? `${this.fmt(s.weight)} × ${s.reps}` : `${s.reps}`;
    },

    _nextDayLabel(sum) {
        if (sum.isSimulation || sum.isFreeWorkout || sum.dayIndex == null) return '';
        try {
            const program = Storage.getActiveProgram();
            if (!program?.days?.length) return '';
            let idx = null;
            if (typeof this.getSuggestedDayIndex === 'function') idx = this.getSuggestedDayIndex(program);
            else if (this._algoFn('getNextDayIndex')) idx = TrainingAlgorithm.getNextDayIndex(program, Storage.getWorkouts());
            const day = program.days[idx];
            return day ? (day.type || day.name || '') : '';
        } catch (e) {
            return '';
        }
    },

    _renderSummary() {
        const el = document.getElementById('riepilogo-body');
        const sum = this.lastWorkoutSummary;
        if (!el || !sum) return;
        const d = new Date(sum.date);
        const day = this._capFirst(d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' }));
        const time = d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
        const vd = sum.volumeDelta;
        const vDelta = Number.isFinite(vd) && vd !== 0
            ? `<span class="delta delta--${vd > 0 ? 'up' : 'down'}">${this.ico(vd > 0 ? 'arrow-up' : 'arrow-down')}${Math.abs(vd)}%</span>` : '';

        const recs = (sum.records || []).map(r => {
            let value;
            let what;
            let delta = '';
            if (r.type === 'e1rm' && r.newValue) {
                value = `${this.fmt(Math.round(r.newValue))} kg`;
                what = `Massimale stimato · <span class="num">${GT.esc(this.fmt(r.weight))} × ${r.reps}</span>`;
                if (r.oldValue > 0) delta = this._deltaHTML('up', `+${this.fmt(Math.round(r.newValue - r.oldValue))}`, 'kg');
            } else if (r.type === 'time' || r.timed) {
                value = `${r.reps} s`;
                what = 'Tempo più lungo';
                if (r.oldValue > 0) delta = this._deltaHTML('up', `+${Math.round(r.reps - r.oldValue)}`, 's');
            } else {
                value = r.weight > 0 ? `${this.fmt(r.weight)} × ${r.reps}` : `${r.reps}`;
                what = r.type === 'weight' ? 'Peso più alto' : 'Record';
                if (r.type === 'weight' && r.oldValue > 0) delta = this._deltaHTML('up', `+${this.fmt(Math.round((r.weight - r.oldValue) * 100) / 100)}`, 'kg');
            }
            return `
                <div class="record">
                    <span class="record__name">${GT.esc(r.name)}</span>
                    <span class="record__v"><span class="num">${GT.esc(value)}</span>${delta}</span>
                    <span class="record__what">${what}</span>
                </div>`;
        }).join('');
        const nRec = (sum.records || []).length;
        const records = nRec ? `
            <section class="records" aria-labelledby="riep-rec">
                <div class="records__head">${this.ico('trophy', 'ico--lg')}<h2 id="riep-rec"><span class="num">${nRec}</span> ${nRec === 1 ? 'record' : 'record'}</h2></div>
                ${recs}
            </section>` : '';

        const cmpRows = (sum.cmp || []).map(c => `
            <div class="cmp">
                <span class="cmp__name">${GT.esc(c.name)}</span><span class="cmp__now num">${GT.esc(this._setText2(c, c.now))}</span>
                ${this._cmpDelta(c)}
                <span class="cmp__was">${c.was ? `prima <span class="num">${GT.esc(this._setText2(c, c.was))}</span>` : 'prima volta'}</span>
            </div>`).join('');
        const next = this._nextDayLabel(sum);

        el.innerHTML = `
            <div class="wide">
                <div class="col">
                    <header class="done-hero">
                        <span class="done-hero__kicker">${this.ico('check')}${sum.isSimulation ? 'Simulazione' : 'Fatto'}</span>
                        <h1>${GT.esc(sum.name || 'Seduta')}</h1>
                        <p class="muted">${GT.esc(day)} · <span class="num">${GT.esc(time)}</span></p>
                    </header>
                    <div class="stats" style="--n:3">
                        <div class="stat"><span class="stat__v num">${GT.esc(this._duration(sum.duration))}</span><span class="stat__k">durata</span></div>
                        <div class="stat"><span class="stat__v num">${GT.esc(this._fmtInt(sum.volume))}<small>kg</small></span><span class="stat__k">volume ${vDelta}</span></div>
                        <div class="stat"><span class="stat__v num">${sum.sets}</span><span class="stat__k">serie</span></div>
                    </div>
                    ${records}
                </div>
                <div class="col">
                    ${cmpRows ? `
                    <section class="section" aria-labelledby="riep-cmp">
                        <div class="section__head"><h2 id="riep-cmp">Rispetto all'ultima volta</h2></div>
                        <div>${cmpRows}</div>
                    </section>` : ''}
                    ${next ? `<p class="faint riep__next">Prossima: <b>${GT.esc(next)}</b></p>` : ''}
                </div>
            </div>
        `;
        const share = document.getElementById('riep-share');
        if (share) share.hidden = !(navigator.share || navigator.clipboard?.writeText);
    },

    async _shareSummary() {
        const s = this.lastWorkoutSummary;
        if (!s) return;
        const text = `${s.name} · ${this._duration(s.duration)} · ${this._fmtInt(s.volume)} kg · ${s.sets} serie${s.records?.length ? ` · ${s.records.length} record` : ''}`;
        try {
            if (navigator.share) {
                await navigator.share({ title: `${s.name} · GymTracker`, text });
                return;
            }
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(text);
                this.showNotification('Riepilogo copiato', 'success', { icon: 'check' });
            }
        } catch (e) { /* condivisione annullata: niente */ }
    },

    // Compatibilità: chi chiamava il vecchio riepilogo modale apre la pagina
    showWorkoutCompletionSummary() {
        if (this.lastWorkoutSummary) this.navigateTo('riepilogo');
    },

    // "Fine" del riepilogo: Oggi, poi gli avvisi di fine ciclo / settimana / scarico (come prima)
    closeWorkoutCompletionSummary() {
        const sum = this.lastWorkoutSummary;
        const fromHistory = !!this._summaryFromHistory;
        this._summaryFromHistory = false;
        this.navigateTo('oggi', { replace: true });
        if (sum && !sum.isSimulation && !fromHistory && typeof this._afterWorkoutPrompts === 'function') {
            this._safe(() => this._afterWorkoutPrompts());
        }
    },
});
