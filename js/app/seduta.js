/**
 * GymTracker 2.0 — area SEDUTA: avvio (anche libera), sessione salvata a ogni modifica,
 * esercizio corrente, serie, recupero (barra nel dock), superset, riscaldamento, defaticamento,
 * fine e riepilogo.
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
                <header class="topbar workout-header-bar" id="workout-header-bar">
                    <button type="button" class="btn btn--ghost btn--icon" id="end-workout-btn" aria-label="Termina la seduta">${this.ico('close')}</button>
                    <div class="topbar__title">
                        <b id="workout-title">Seduta</b>
                        <span><span class="num" id="workout-timer" role="timer" aria-label="Durata della seduta">00:00:00</span></span>
                    </div>
                    <button type="button" class="btn btn--ghost btn--icon" id="session-more-btn" aria-label="Altre azioni della seduta">${this.ico('more')}</button>
                </header>

                <div class="seduta__body">
                    <!-- Riscaldamento (apri/chiudi) -->
                    <div class="card warmup-section" id="warmup-section">
                        <h2 class="warmup-heading">
                            <button type="button" class="warmup-header" id="warmup-header" aria-expanded="true" aria-controls="warmup-content">
                                ${this.ico('warmup')}
                                <span id="warmup-title">Riscaldamento</span>
                                <span class="warmup-toggle" id="warmup-toggle">${this.ico('chevron-down')}</span>
                            </button>
                        </h2>
                        <div class="warmup-content" id="warmup-content">
                            <div class="warmup-exercises" id="warmup-exercises"></div>
                            <button type="button" class="btn btn--secondary btn--block" id="skip-warmup">${this.ico('check')}Riscaldamento fatto</button>
                        </div>
                    </div>

                    <!-- Esercizio corrente: lo disegna displayCurrentExercise() -->
                    <div class="exercise-list-container" id="exercise-list-container">
                        <div class="current-exercise" id="current-exercise"></div>
                    </div>
                </div>

                <!-- Dock: il recupero (stati is-warning · is-done · is-transition li mette _renderRestBar) -->
                <div class="dock" role="region" aria-label="Recupero">
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
                </div>
            </div>
        `;
    },

    // Fogli dell'area: defaticamento, seduta libera, altre azioni della seduta
    sheetsSeduta() {
        return `
            <div class="modal" id="cooldown-modal" style="display: none;">
                <section class="sheet cooldown-content" role="dialog" aria-modal="true" aria-labelledby="cooldown-title">
                    <span class="sheet__grip" aria-hidden="true"></span>
                    <div class="sheet__head"><h2 id="cooldown-title">Defaticamento</h2></div>
                    <div class="cooldown-info" id="cooldown-info"></div>
                    <div class="cooldown-exercises" id="cooldown-exercises"></div>
                    <div class="sheet__actions">
                        <button type="button" class="btn btn--primary btn--xl" id="complete-cooldown">${this.ico('check')}Fatto, salva la seduta</button>
                        <button type="button" class="btn btn--ghost btn--block" id="skip-cooldown">Salta il defaticamento</button>
                    </div>
                </section>
            </div>

            <div class="modal" id="free-workout-modal">
                <section class="sheet sheet--tall" role="dialog" aria-modal="true" aria-labelledby="free-workout-modal-title">
                    <span class="sheet__grip" aria-hidden="true"></span>
                    <div class="sheet__head">
                        <h2 id="free-workout-modal-title">Seduta libera</h2>
                        <button type="button" class="btn btn--ghost btn--icon sheet__close" onclick="App.closeFreeWorkoutModal()" aria-label="Chiudi la seduta libera">${this.ico('close')}</button>
                    </div>
                    <div class="search">
                        ${this.ico('search')}
                        <input type="search" id="free-workout-search" class="input" placeholder="Cerca un esercizio" aria-label="Cerca un esercizio" autocomplete="off" oninput="App.freeWorkoutSearch(this.value)">
                    </div>
                    <div id="free-workout-results" class="builder-exercise-results free-workout-results">
                        <p class="muted">Cerca un esercizio</p>
                    </div>
                    <h3 class="cap">Scelti</h3>
                    <div id="free-workout-selected" class="free-workout-selected">
                        <p class="muted">Nessun esercizio</p>
                    </div>
                    <div class="sheet__actions">
                        <button type="button" class="btn btn--primary btn--xl" onclick="App.freeWorkoutStart()">${this.ico('play')}Inizia la seduta</button>
                        <button type="button" class="btn btn--ghost btn--block" onclick="App.closeFreeWorkoutModal()">Annulla</button>
                    </div>
                </section>
            </div>

            <div class="modal" id="session-more-modal">
                <section class="sheet" role="dialog" aria-modal="true" aria-labelledby="session-more-title">
                    <span class="sheet__grip" aria-hidden="true"></span>
                    <div class="sheet__head">
                        <h2 id="session-more-title">Seduta</h2>
                        <button type="button" class="btn btn--ghost btn--icon sheet__close" id="session-more-close" aria-label="Chiudi le azioni della seduta">${this.ico('close')}</button>
                    </div>
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
        `;
    },

    bindSeduta() {
        const on = (id, ev, fn) => this._on(id, ev, fn);

        // Allenamento libero
        this._closeOnBackdrop('free-workout-modal', () => this.closeFreeWorkoutModal());

        // Barra della seduta: × termina, ⋯ altre azioni
        on('end-workout-btn', 'click', () => this.endWorkout());
        on('session-more-btn', 'click', () => this._openModal('session-more-modal'));
        on('session-more-close', 'click', () => this._closeModal('session-more-modal'));
        this._closeOnBackdrop('session-more-modal', () => this._closeModal('session-more-modal'));
        on('session-library-btn', 'click', () => {
            this._closeModal('session-more-modal');
            this.navigateTo('esercizi');
        });
        on('cancel-workout-btn', 'click', () => {
            this._closeModal('session-more-modal');
            this.cancelWorkout();
        });

        // Riscaldamento: finito = nascosto; header = apri/chiudi
        on('skip-warmup', 'click', () => {
            const section = document.getElementById('warmup-section');
            if (section) section.style.display = 'none';
            if (this.activeWorkout) {
                this.activeWorkout.warmupHidden = true;
                this._persistSession();
            }
        });
        on('warmup-header', 'click', () => {
            const section = document.getElementById('warmup-section');
            if (!section) return;
            this._setWarmupCollapsed(!section.classList.contains('collapsed'));
            this._persistSession();
        });

        // Barra di recupero fissa
        on('rest-bar-minus', 'click', () => this._adjustRest(-15));
        on('rest-bar-plus', 'click', () => this._adjustRest(15));
        on('rest-bar-skip', 'click', () => this._skipRest());

        // Defaticamento: si chiude e si salva, senza seconda conferma (C13)
        on('skip-cooldown', 'click', () => this.finishWorkout());
        on('complete-cooldown', 'click', () => this.finishWorkout());
    },

    // La seduta si apre solo se ce n'è una in corso
    canSeduta() {
        return !!this.activeWorkout;
    },

    enterSeduta() {
        this._setText('workout-title', this.activeWorkout?.name || 'Seduta');
    },

    // Il riepilogo (#riepilogo, ancora da costruire) ha senso solo dopo una seduta
    canRiepilogo() {
        return !!this.lastWorkoutSummary;
    },

    // ========================================
    // SESSIONE: avvio, ripresa, salvataggio continuo
    // ========================================

    _completedSetsCount(workout = this.activeWorkout) {
        if (!workout?.exercises) return 0;
        return workout.exercises.reduce((n, ex) => n + (ex.setsData || []).filter(s => s.completed).length, 0);
    },

    // C2: con una sessione aperta "Inizia" chiede se riprenderla o terminarla, mai la sovrascrive
    _promptActiveSession() {
        const w = this.activeWorkout;
        if (!w) return false;
        const done = this._completedSetsCount();
        if (confirm(`${w.name} in corso (${done} serie). Riprendere?`)) {
            this.navigateTo('seduta');
            return true;
        }
        if (confirm(`Terminare ${w.name}? ${done} serie fatte`)) {
            this.navigateTo('seduta');
            this.endWorkout(true);
        }
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

    startFreeWorkout() {
        if (this.activeWorkout) {
            this._promptActiveSession();
            return;
        }
        this.freeWorkoutExercises = [];
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
        this.freeWorkoutSearchResults(searchExercises(query).filter(ex => !ex.hidden).slice(0, 15));
    },

    freeWorkoutSearchResults(results) {
        const container = document.getElementById('free-workout-results');
        if (!container) return;
        if (!results.length) {
            container.innerHTML = '<p class="empty-state-mini">Cerca un esercizio...</p>';
            return;
        }
        const addedIds = (this.freeWorkoutExercises || []).map(e => e.id);
        container.innerHTML = results.map(ex => {
            const already = addedIds.includes(ex.id);
            return `
                <div class="builder-search-result ${already ? 'already-added' : ''}" data-id="${GT.esc(ex.id)}">
                    <div>
                        <strong>${GT.esc(ex.name)}</strong>
                        <small>${GT.esc((ex.primaryMuscles || []).join(', '))}</small>
                    </div>
                    ${already ? '<span class="added-badge">Aggiunto</span>' : `<button type="button" class="btn btn--sm btn--primary" data-add="${GT.esc(ex.id)}" aria-label="Aggiungi ${GT.esc(ex.name)}">+</button>`}
                </div>
            `;
        }).join('');
        container.querySelectorAll('[data-add]').forEach(btn => {
            btn.addEventListener('click', () => this.freeWorkoutAddExercise(btn.dataset.add));
        });
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
            container.innerHTML = '<p class="empty-state-mini">Nessun esercizio selezionato</p>';
            return;
        }
        container.innerHTML = this.freeWorkoutExercises.map((ex, i) => `
            <div class="builder-exercise-item">
                <div class="builder-exercise-info">
                    <span class="builder-exercise-name">${GT.esc(ex.name)}</span>
                    <div class="builder-exercise-params">
                        <label>Serie<input type="number" min="1" max="10" value="${GT.esc(ex.sets)}" onchange="App.freeWorkoutUpdateExercise(${i},'sets',this.value)"></label>
                        <label>Reps<input type="text" value="${GT.esc(ex.reps)}" maxlength="9" onchange="App.freeWorkoutUpdateExercise(${i},'reps',this.value)" style="width:60px"></label>
                        <label>Rec<input type="number" min="15" max="600" step="15" value="${GT.esc(ex.rest)}" onchange="App.freeWorkoutUpdateExercise(${i},'rest',this.value)">s</label>
                    </div>
                </div>
                <button type="button" class="btn btn--sm btn--danger" onclick="App.freeWorkoutRemoveExercise(${i})" aria-label="Rimuovi ${GT.esc(ex.name)}">${this.ico('close')}</button>
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
            type: 'Allenamento Libero',
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
        this.startWorkout(workout);
    },

    closeFreeWorkoutModal() {
        this._closeModal('free-workout-modal');
    },

    /**
     * Avvia una sessione.
     * @param {Object} workout - giorno della scheda, allenamento libero o simulazione
     * @param {{dayIndex?:number, isSimulation?:boolean}} meta
     */
    startWorkout(workout, meta = {}) {
        if (this.activeWorkout) {
            this._promptActiveSession();
            return;
        }
        if (!workout?.exercises?.length) {
            this.showNotification('Nessun esercizio in questo giorno', 'warning');
            return;
        }

        const isFree = !!workout.isFreeWorkout;
        const isSimulation = !!meta.isSimulation;
        const program = (!isFree && !isSimulation) ? Storage.getActiveProgram() : null;
        const cycleInfo = program?.metadata?.cycle ? Storage.getCycleInfo() : null;
        const isDeload = cycleInfo ? Storage.isDeloadActive() : false;
        const phase = cycleInfo ? this._currentPhase(cycleInfo, isDeload) : null;
        const day = phase ? this._applyPhase(workout, phase) : workout;
        const name = workout.type || workout.name || 'Allenamento';

        const exercises = day.exercises.map((ex, i) => {
            const original = workout.exercises[i] || ex;
            const originalSets = this._clampInt(original.sets, 3, 1, 10);
            const sets = this._clampInt(ex.sets, originalSets, 1, 10);
            const reps = this._cleanReps(ex.targetReps || ex.reps, '8-12');
            return {
                ...ex,
                type: ex.type || EXERCISES_DB[ex.exerciseId]?.type || 'compound',
                rest: this._clampInt(ex.rest, this._defaultRest(ex.exerciseId), 10, 900),
                reps,
                targetReps: reps,
                originalSets,
                targetSets: sets,
                sets,
                setsData: Array.from({ length: sets }, () => ({ weight: '', reps: '', completed: false }))
            };
        });

        const activeWorkout = {
            name,
            type: name,
            focus: workout.focus || '',
            warmup: workout.warmup || null,
            dayIndex: Number.isInteger(meta.dayIndex) ? meta.dayIndex : null,
            programId: program?.metadata?.programId ?? null,
            cycleNumber: cycleInfo ? (program.metadata.cycleNumber || 1) : null,
            cycleWeek: cycleInfo ? cycleInfo.currentWeek : null,
            isFreeWorkout: isFree,
            isSimulation,
            startTime: Date.now(),
            cycleInfo: cycleInfo ? { currentWeek: cycleInfo.currentWeek, duration: cycleInfo.duration } : null,
            phase: phase ? {
                phase: phase.phase,
                phaseName: phase.phaseName,
                rirTarget: phase.rirTarget || null,
                volumeMultiplier: phase.volumeMultiplier ?? 1
            } : null,
            isDeload,
            warmupHidden: false,
            warmupCollapsed: false,
            exercises
        };

        this._enterWorkout(activeWorkout, null);
    },

    // Entra nella sessione (nuova o ripresa): interfaccia, orologio, schermo acceso
    _enterWorkout(workout, session) {
        this.activeWorkout = workout;
        const max = workout.exercises.length - 1;
        this.currentExerciseIndex = Math.max(0, Math.min(max, parseInt(session?.currentExerciseIndex) || 0));
        this._supersetPrepShown = session?.supersetPrepShown || {};
        this._ctxCache = {};
        this._restMeta = null;
        this._renderedExercise = null;
        this._buildSupersetMap();

        document.getElementById('workout-not-started').style.display = 'none';
        document.getElementById('workout-preview').style.display = 'none';
        document.getElementById('workout-active').style.display = 'block';
        const cooldown = document.getElementById('cooldown-modal');
        if (cooldown) cooldown.style.display = 'none';

        this._bindBeforeUnload();
        this._startWorkoutClock();
        this._setKeepAwake(true);
        this.displayPhaseBanner();
        this.displayWarmup(workout.warmup);
        this.displayCurrentExercise();

        // Riposo ancora in corso quando l'app si è chiusa: riparte da dove era
        const rest = session?.rest;
        if (rest?.endAt && !rest.expired && rest.endAt - Date.now() > -300000) {
            this._startRest({ ...rest, seconds: Math.round((rest.endAt - Date.now()) / 1000), resumeEndAt: rest.endAt });
        }

        this.navigateTo('seduta');
        this._persistSession();
        this.updateQuickAction();
    },

    _buildSupersetMap() {
        this._supersetGroupMap = {};
        (this.activeWorkout?.exercises || []).forEach((ex, i) => {
            if (!ex.supersetGroup) return;
            (this._supersetGroupMap[ex.supersetGroup] = this._supersetGroupMap[ex.supersetGroup] || []).push(i);
        });
    },

    // Sessione salvata a ogni modifica (C6): se iOS chiude la PWA non si perde nulla
    _persistSession() {
        if (!this.activeWorkout) return;
        try {
            const saved = Storage.saveActiveSession({
                version: 1,
                workout: this.activeWorkout,
                currentExerciseIndex: this.currentExerciseIndex,
                supersetPrepShown: this._supersetPrepShown || {},
                rest: this._restMeta ? { ...this._restMeta } : null,
                touchedAt: Date.now()
            });
            if (saved === false && !this._sessionSaveWarned) {
                this._sessionSaveWarned = true;
                this.showNotification('Memoria piena: la sessione non si salva', 'warning');
            } else if (saved !== false) {
                this._sessionSaveWarned = false;
            }
        } catch (e) {
            console.warn('Sessione non salvata', e);
        }
    },

    // All'avvio: riprende la sessione rimasta aperta. Se è vecchia (>12 h) chiede cosa farne.
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
        w.exercises.forEach(ex => {
            if (!Array.isArray(ex.setsData)) {
                ex.setsData = Array.from({ length: this._clampInt(ex.targetSets || ex.sets, 3, 1, 10) }, () => ({ weight: '', reps: '', completed: false }));
            }
        });
        w.name = w.name || w.type || 'Allenamento';
        w.startTime = Number(w.startTime) || Date.now();

        const lastTouch = Number(session.touchedAt) || Date.parse(session.savedAt) || w.startTime;
        const ageHours = (Date.now() - lastTouch) / 3600000;
        if (ageHours > 12) {
            const done = this._completedSetsCount(w);
            const when = GT.formatRelativeDay(new Date(lastTouch));
            if (!confirm(`${w.name} (${when}) ancora aperto. Riprendere?`)) {
                if (done > 0 && confirm(`Salvare ${w.name} (${when})? ${done} serie fatte`)) {
                    this._enterWorkout(w, session);
                    this.finishWorkout({ date: new Date(lastTouch), endTime: lastTouch });
                    return true;
                }
                Storage.clearActiveSession();
                this.showNotification('Sessione scartata', 'info');
                return false;
            }
        }

        this._enterWorkout(w, session);
        this.showNotification(`${w.name} ripreso`, 'info');
        return true;
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
            el.textContent = this._fmtClock(Math.floor((Date.now() - this.activeWorkout.startTime) / 1000));
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
    // di visibilità (style.display) — C1
    _teardownWorkout() {
        this._stopRest();
        this._stopWorkoutClock();
        this._unbindBeforeUnload();
        try { Storage.clearActiveSession(); } catch (e) { /* no-op */ }
        this.activeWorkout = null;
        if (!this.conditioningState.startedAt) this._setKeepAwake(false);
        this.currentExerciseIndex = 0;
        this._supersetGroupMap = {};
        this._supersetPrepShown = {};
        this._ctxCache = null;
        this._renderedExercise = null;

        document.getElementById('workout-active').style.display = 'none';
        document.getElementById('workout-preview').style.display = 'none';
        document.getElementById('workout-not-started').style.display = 'block';
        const cooldown = document.getElementById('cooldown-modal');
        if (cooldown) cooldown.style.display = 'none';
        document.getElementById('phase-banner')?.remove();
        const current = document.getElementById('current-exercise');
        if (current) current.innerHTML = '';
        this.updateQuickAction();
        // La seduta è a tutto schermo: chiusa, non resta una pagina vuota (si torna a Oggi)
        if (this.currentPage === 'seduta') this.navigateTo('oggi', { replace: true });
    },

    /**
     * Annulla la sessione senza salvare
     */
    cancelWorkout() {
        const w = this.activeWorkout;
        if (!w) return;
        const done = this._completedSetsCount();
        const message = done > 0 ? `Annullare ${w.name}? ${done} serie non salvate` : `Annullare ${w.name}?`;
        if (!confirm(message)) return;
        this._teardownWorkout();
        this.showNotification('Sessione annullata', 'info');
    },

    displayPhaseBanner() {
        document.getElementById('phase-banner')?.remove();
        const w = this.activeWorkout;
        if (!w?.phase || !w.cycleInfo) return;

        const p = w.phase;
        const phaseClass = w.isDeload ? 'deload' : String(p.phase || '').replace(/[^a-z-]/gi, '');
        const vol = typeof p.volumeMultiplier === 'number' && p.volumeMultiplier < 1 ? Math.round(p.volumeMultiplier * 100) : null;

        const html = `
            <div id="phase-banner" class="phase-banner phase-${phaseClass}">
                <div class="phase-banner-content">
                    <span class="phase-label">${GT.esc(String(p.phaseName || '').toUpperCase())}</span>
                    <span class="phase-separator">•</span>
                    <span class="phase-week">Sett. ${GT.esc(w.cycleInfo.currentWeek)}/${GT.esc(w.cycleInfo.duration)}</span>
                    ${p.rirTarget ? `<span class="phase-separator">•</span><span class="phase-rir">RIR ${GT.esc(p.rirTarget.min)}-${GT.esc(p.rirTarget.max)}</span>` : ''}
                    ${vol ? `<span class="phase-separator">•</span><span class="phase-volume">Vol. ${vol}%</span>` : ''}
                </div>
            </div>
        `;

        // Il banner va sotto la barra della sessione (A7: la classe vera è .workout-header-bar)
        const header = document.querySelector('#workout-active .workout-header-bar');
        if (header) header.insertAdjacentHTML('afterend', html);
    },

    displayWarmup(warmupKey) {
        const section = document.getElementById('warmup-section');
        const container = document.getElementById('warmup-exercises');
        if (!section || !container) return;

        const w = this.activeWorkout;
        const warmup = (warmupKey && Warmups.getWarmupByMuscle(warmupKey)) || Warmups.WARMUPS_DB['full-body'];
        if (!warmup) {
            section.style.display = 'none';
            return;
        }

        container.innerHTML = (warmup.exercises || []).map(ex => {
            const dose = ex.sets > 1 ? `${ex.sets} × ${ex.duration || ''}` : (ex.duration || '');
            return `
            <div class="warmup-exercise warmup-exercise-item" style="display:flex;justify-content:space-between;align-items:center;gap:10px;">
                <div class="warmup-exercise-content" style="flex:1;">
                    <span class="name">${GT.esc(ex.name)}</span>
                    ${ex.description ? `<small class="description">${GT.esc(ex.description)}</small>` : ''}
                </div>
                <div class="warmup-exercise-actions" style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
                    ${dose ? `<span class="duration">${GT.esc(dose)}</span>` : ''}
                    <button type="button" class="btn btn--ghost btn--icon exercise-info-btn" data-exercise-name="${GT.esc(ex.name)}" aria-label="Come si esegue: ${GT.esc(ex.name)}">
                        ${this.ico('info')}
                    </button>
                </div>
            </div>
        `;
        }).join('');

        container.querySelectorAll('.exercise-info-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showExerciseInfoModal(null, btn.dataset.exerciseName, 'warmup');
            });
        });

        section.style.display = w?.warmupHidden ? 'none' : 'block';
        this._setWarmupCollapsed(!!w?.warmupCollapsed);

        // Titolo con la durata (F4)
        let minutes = null;
        try { minutes = Warmups.getWarmupDurationMin(warmupKey || 'full-body'); } catch (e) { minutes = null; }
        const duration = Number(minutes) > 0 ? `${Math.round(minutes)} min` : (warmup.duration || '');
        this._setText('warmup-title', duration ? `${warmup.name} · ${duration}` : warmup.name);
    },

    _setWarmupCollapsed(collapsed) {
        const section = document.getElementById('warmup-section');
        if (section) section.classList.toggle('collapsed', collapsed);
        document.getElementById('warmup-header')?.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
        if (this.activeWorkout) this.activeWorkout.warmupCollapsed = collapsed;
    },

    _currentExercise() {
        return this.activeWorkout?.exercises?.[this.currentExerciseIndex] || null;
    },

    _isBodyweight(exerciseId) {
        try {
            return !!Storage.isBodyweightExercise(exerciseId);
        } catch (e) {
            const data = EXERCISES_DB[exerciseId];
            return data?.category === 'corpo-libero' || !!data?.equipment?.includes('corpo-libero');
        }
    },

    _effectiveBodyweight(exercise, bodyWeight) {
        const mod = Math.abs(GT.num(exercise.bwModifier));
        if (exercise.bwMode === 'assisted') return Math.max(0, bodyWeight - mod);
        if (exercise.bwMode === 'weighted') return bodyWeight + mod;
        return bodyWeight;
    },

    // Dati storici dell'esercizio (letti una volta per sessione) + stato corpo libero
    _exerciseContext(exercise) {
        const id = exercise.exerciseId;
        if (!this._ctxCache) this._ctxCache = {};
        let cached = this._ctxCache[id];
        if (!cached) {
            const program = Storage.getActiveProgram();
            const goal = program?.metadata?.goal || Storage.getProfile().goal || 'hypertrophy';
            let suggestion = null;
            try {
                suggestion = Storage.getProgressionSuggestion(id, exercise.targetReps, goal);
            } catch (e) {
                console.warn('getProgressionSuggestion', e);
            }
            cached = {
                lastPerformance: Storage.getLastPerformance(id),
                pr: Storage.getExercisePR(id),
                suggestion
            };
            this._ctxCache[id] = cached;
        }
        const isBodyweight = this._isBodyweight(id);
        const bodyWeight = parseFloat(Storage.getProfile().weight) || 0;
        return {
            ...cached,
            data: EXERCISES_DB[id],
            isBodyweight,
            bodyWeight,
            effectiveWeight: isBodyweight ? this._effectiveBodyweight(exercise, bodyWeight) : null
        };
    },

    // Peso di partenza: quello suggerito dalla progressione (C8/N15), non l'ultimo
    _suggestedWeight(ctx) {
        const sw = parseFloat(ctx.suggestion?.suggestedWeight);
        if (Number.isFinite(sw) && sw > 0) return sw;
        const last = parseFloat(ctx.lastPerformance?.weight);
        return Number.isFinite(last) && last > 0 ? last : null;
    },

    _prefillSets(exercise, ctx) {
        if (ctx.isBodyweight && !exercise.bwMode) {
            exercise.bwMode = 'solo';
            exercise.bwModifier = 0;
        }
        const suggested = this._suggestedWeight(ctx);
        exercise.setsData.forEach(set => {
            if (set.completed || set.autoFilled) return;
            if (ctx.isBodyweight) {
                set.weight = ctx.effectiveWeight || '';
                set.isBodyweight = true;
            } else if ((set.weight === '' || set.weight == null) && suggested != null) {
                set.weight = suggested;
            }
            set.autoFilled = true;
        });
    },

    // Ripetizioni proposte per la serie idx (placeholder e partenza dello stepper)
    _repsHint(exercise, idx) {
        const ctx = this._exerciseContext(exercise);
        const sr = ctx.suggestion?.suggestedRepsPerSet || ctx.suggestion?.suggestedReps;
        const v = Array.isArray(sr) ? sr[Math.min(idx, sr.length - 1)] : sr;
        if (Number.isFinite(parseInt(v))) return parseInt(v);
        const range = Storage.parseRepRange(exercise.targetReps);
        return range?.min || '';
    },

    showCurrentExerciseInfo() {
        const ex = this._currentExercise();
        if (ex) this.showExerciseInfoModal(ex.exerciseId, ex.name, 'workout');
    },

    displayCurrentExercise() {
        const w = this.activeWorkout;
        if (!w) return;
        const exercise = this._currentExercise();
        const container = document.getElementById('current-exercise');
        if (!exercise || !container) return;

        // Primo arrivo su un superset: scheda "prepara la postazione"
        const group = exercise.supersetGroup ? this._supersetGroupMap[exercise.supersetGroup] : null;
        if (group?.length > 1 && exercise.supersetOrder === 1 && !this._supersetPrepShown[exercise.supersetGroup]) {
            this._renderSupersetPrep(exercise, group, container);
            return;
        }

        const ctx = this._exerciseContext(exercise);
        this._prefillSets(exercise, ctx);
        const data = ctx.data;
        const gifUrl = getExerciseGif(exercise.exerciseId);
        const g = exercise.supersetGroup ? GT.esc(exercise.supersetGroup) : null;

        let lastPerfHTML = '';
        if (ctx.lastPerformance) {
            const when = GT.formatRelativeDay(new Date(ctx.lastPerformance.date));
            lastPerfHTML = `
                <div class="last-performance">
                    <span class="last-perf-label">Ultima (${GT.esc(when.toLowerCase())}):</span>
                    <span class="last-perf-value">${GT.esc(ctx.lastPerformance.weight)} kg × ${GT.esc(ctx.lastPerformance.reps)}</span>
                </div>
            `;
        }

        const pr = ctx.pr;
        const prHTML = pr?.maxWeight ? `
            <div class="pr-info">
                <span class="pr-badge">PR</span>
                <span class="pr-value">${GT.esc(pr.maxWeight)} kg × ${GT.esc(pr.maxWeightReps || pr.maxReps || '?')}</span>
            </div>
        ` : '';

        let progressionHTML = '';
        const sug = ctx.suggestion;
        if (sug?.message) {
            const statusClass = (sug.status === 'detraining' || sug.status === 'refamiliarize') ? 'suggestion-detraining' :
                sug.action === 'weight_up' ? 'suggestion-up' :
                sug.action === 'reps_up' ? 'suggestion-reps' : 'suggestion-maintain';
            progressionHTML = `
                <div class="progression-suggestion ${statusClass}">
                    <span class="progression-message">${GT.esc(sug.message)}</span>
                </div>
            `;
        }

        const bwHTML = ctx.isBodyweight ? `
            <div class="bw-mode-selector">
                <div class="bw-mode-header">
                    <span class="bw-icon">${this.ico('bodyweight')}</span>
                    <span class="bw-label">Corpo libero (${GT.esc(ctx.bodyWeight || '—')} kg)</span>
                </div>
                <div class="bw-mode-options">
                    <button type="button" class="bw-mode-btn ${exercise.bwMode === 'solo' ? 'active' : ''}" onclick="App.setBwMode('solo')">Solo</button>
                    <button type="button" class="bw-mode-btn ${exercise.bwMode === 'assisted' ? 'active' : ''}" onclick="App.setBwMode('assisted')">Assistito</button>
                    <button type="button" class="bw-mode-btn ${exercise.bwMode === 'weighted' ? 'active' : ''}" onclick="App.setBwMode('weighted')">Zavorra</button>
                </div>
                ${exercise.bwMode !== 'solo' ? `
                    <div class="bw-modifier-row">
                        <span class="bw-modifier-label">${exercise.bwMode === 'assisted' ? 'Assistenza:' : 'Zavorra:'}</span>
                        <div class="bw-modifier-input">
                            <button type="button" class="bw-mod-btn" onclick="App.adjustBwModifier(-2.5)" aria-label="Meno 2,5 kg">−</button>
                            <input type="number" value="${GT.esc(Math.abs(GT.num(exercise.bwModifier)))}"
                                onchange="App.setBwModifier(this.value)" min="0" step="any" inputmode="decimal" aria-label="Chili">
                            <button type="button" class="bw-mod-btn" onclick="App.adjustBwModifier(2.5)" aria-label="Più 2,5 kg">+</button>
                            <span class="bw-mod-unit">kg</span>
                        </div>
                        <div class="bw-effective">
                            <span class="bw-eff-label">Peso effettivo:</span>
                            <span class="bw-eff-value ${exercise.bwMode === 'assisted' ? 'assisted' : 'weighted'}">${GT.esc(ctx.effectiveWeight)} kg</span>
                        </div>
                    </div>
                ` : ''}
            </div>
        ` : '';

        const reduced = exercise.originalSets && exercise.originalSets !== exercise.targetSets;
        const isLast = this.currentExerciseIndex === w.exercises.length - 1;

        container.innerHTML = `
            <div class="exercise-header-mobile current-exercise-header" style="display:flex;justify-content:space-between;align-items:center;gap:15px;margin-bottom:15px;">
                <div class="current-exercise-title" style="flex:1;">
                    <div class="exercise-progress-badge">
                        ${this.currentExerciseIndex + 1}/${w.exercises.length}
                        ${g ? `<span class="superset-badge superset-badge-${g}">${exercise.isGiantSet ? 'Giant' : 'Super'} ${g}${GT.esc(exercise.supersetOrder || '')}</span>` : ''}
                    </div>
                    <h3 class="exercise-title-mobile">${GT.esc(exercise.name)}</h3>
                    <div class="exercise-muscles-mobile">
                        ${(data?.primaryMuscles || []).map(m => `<span class="muscle-tag-sm">${GT.esc(m)}</span>`).join('')}
                    </div>
                </div>
                <button type="button" class="btn btn--ghost btn--icon exercise-info-btn" onclick="App.showCurrentExerciseInfo()" aria-label="Come si esegue: ${GT.esc(exercise.name)}">
                    ${this.ico('info')}
                </button>
            </div>
            ${gifUrl ? `
                <div class="exercise-gif-preview">
                    <img src="${GT.esc(gifUrl)}" alt="" loading="lazy" onerror="this.parentElement.style.display='none'">
                </div>
            ` : ''}
            ${bwHTML}
            ${lastPerfHTML || prHTML ? `
                <div class="exercise-info-bar">
                    ${lastPerfHTML}
                    ${prHTML}
                </div>
            ` : ''}
            ${progressionHTML}
            <div class="exercise-target-mobile">
                <div class="target-item">
                    <span class="target-label">Serie</span>
                    <span class="target-value">${exercise.targetSets}${reduced ? ` <small style="opacity:0.6">(${exercise.originalSets})</small>` : ''}</span>
                </div>
                <div class="target-item">
                    <span class="target-label">Reps</span>
                    <span class="target-value">${GT.esc(exercise.targetReps)}</span>
                </div>
                <div class="target-item">
                    <span class="target-label">${g ? 'Cambio' : 'Pausa'}</span>
                    <span class="target-value">${GT.esc(g ? (exercise.transitionTime || 10) : exercise.rest)}s</span>
                </div>
            </div>
            ${reduced ? `
                <div class="deload-sets-notice">
                    Serie ${exercise.originalSets} → ${exercise.targetSets} (${GT.esc(w.phase?.phaseName || 'fase')})
                </div>
            ` : ''}
            <div id="exercise-dynamic">${this._exerciseDynamicHTML(exercise, ctx)}</div>
            <div class="exercise-nav-mobile">
                <button type="button" class="nav-btn prev" onclick="App.previousExercise()" ${this.currentExerciseIndex === 0 ? 'disabled' : ''}>
                    <span>‹</span> Prec
                </button>
                <button type="button" class="nav-btn next" onclick="App.nextExercise()" ${isLast ? 'disabled' : ''}>
                    Succ <span>›</span>
                </button>
            </div>
        `;
        this._renderedExercise = this.currentExerciseIndex;
    },

    _renderSupersetPrep(exercise, group, container) {
        const g = GT.esc(exercise.supersetGroup);
        const groupExercises = group.map(i => this.activeWorkout.exercises[i]);
        container.innerHTML = `
            <div class="superset-prep-card">
                <div class="superset-prep-header">
                    <span class="superset-badge superset-badge-${g}">${exercise.isGiantSet ? 'Giant Set' : 'Superset'} ${g}</span>
                    Prepara la postazione
                </div>
                <div class="superset-prep-exercises">
                    ${groupExercises.map((ex, order) => {
                        const ctx = this._exerciseContext(ex);
                        const w = this._suggestedWeight(ctx);
                        return `
                            <div class="superset-prep-exercise">
                                <div class="superset-prep-order order-${g}">${order + 1}</div>
                                <div class="superset-prep-info">
                                    <div class="superset-prep-name">${GT.esc(ex.name)}</div>
                                    <div class="superset-prep-weight">${w != null ? `${GT.esc(w)} kg · ` : ''}${ex.targetSets}×${GT.esc(ex.targetReps)}</div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div style="font-size:0.8rem;color:var(--text-secondary);margin-bottom:1rem;text-align:center;">
                    Cambio ${GT.esc(exercise.transitionTime || 10)}s · recupero ${GT.esc(exercise.supersetRest || exercise.rest || 90)}s a fine giro
                </div>
                <button type="button" class="superset-prep-btn" onclick="App.supersetReady()">Sono pronto</button>
            </div>
        `;
        this._renderedExercise = null;
    },

    supersetReady() {
        const ex = this._currentExercise();
        if (ex?.supersetGroup) this._supersetPrepShown[ex.supersetGroup] = true;
        this.displayCurrentExercise();
        this._persistSession();
    },

    // Parte variabile della card (serie, giri, barra serie): si ridisegna senza toccare la GIF (N15)
    _exerciseDynamicHTML(exercise, ctx) {
        const completedSets = exercise.setsData.filter(s => s.completed).length;
        const total = exercise.targetSets || exercise.setsData.length || 1;

        let roundHTML = '';
        const group = exercise.supersetGroup ? this._supersetGroupMap[exercise.supersetGroup] : null;
        if (group?.length > 1) {
            const totalRounds = Math.max(...group.map(i => this.activeWorkout.exercises[i].targetSets || 0));
            const currentRound = Math.min(...group.map(i => this.activeWorkout.exercises[i].setsData.filter(s => s.completed).length));
            roundHTML = `
                <div class="superset-round-indicator">
                    <span>Giro</span>
                    ${Array.from({ length: totalRounds }, (_, r) => `
                        <span class="superset-round-dot ${r < currentRound ? 'completed' : r === currentRound ? 'active' : ''}"></span>
                    `).join('')}
                    <span>${Math.min(currentRound, totalRounds)}/${totalRounds}</span>
                </div>
            `;
        }

        const rows = exercise.setsData.map((set, idx) => {
            const repsHint = this._repsHint(exercise, idx);
            const weightHint = ctx.isBodyweight ? (ctx.effectiveWeight || '') : '';
            return `
                <div class="set-row-mobile ${set.completed ? 'completed' : ''} ${set.isNewPR ? 'new-pr' : ''}" data-set="${idx}">
                    <div class="set-row-top">
                        <div class="set-number-mobile">${idx + 1}</div>
                        <div class="set-inputs-mobile">
                            <div class="input-stepper">
                                <button class="step-btn" type="button" tabindex="-1" aria-label="Meno peso, serie ${idx + 1}" onclick="App.adjustSet(${idx}, 'weight', -1)">−</button>
                                <div class="input-group">
                                    <input id="set-${idx}-weight" type="number" inputmode="decimal" step="any" min="0"
                                        value="${GT.esc(set.weight)}" placeholder="${GT.esc(weightHint)}"
                                        aria-label="Peso serie ${idx + 1} in kg"
                                        oninput="App.updateSet(${idx}, 'weight', this.value)"
                                        onfocus="this.select()">
                                    <span class="input-suffix">kg</span>
                                </div>
                                <button class="step-btn" type="button" tabindex="-1" aria-label="Più peso, serie ${idx + 1}" onclick="App.adjustSet(${idx}, 'weight', 1)">+</button>
                            </div>
                            <div class="input-stepper">
                                <button class="step-btn" type="button" tabindex="-1" aria-label="Meno ripetizioni, serie ${idx + 1}" onclick="App.adjustSet(${idx}, 'reps', -1)">−</button>
                                <div class="input-group">
                                    <input id="set-${idx}-reps" type="number" inputmode="numeric" step="1" min="0"
                                        value="${GT.esc(set.reps)}" placeholder="${GT.esc(repsHint)}"
                                        aria-label="Ripetizioni serie ${idx + 1}"
                                        oninput="App.updateSet(${idx}, 'reps', this.value)"
                                        onfocus="this.select()">
                                    <span class="input-suffix">reps</span>
                                </div>
                                <button class="step-btn" type="button" tabindex="-1" aria-label="Più ripetizioni, serie ${idx + 1}" onclick="App.adjustSet(${idx}, 'reps', 1)">+</button>
                            </div>
                        </div>
                        <button type="button" class="set-done-btn ${set.completed ? 'done' : ''}" aria-pressed="${set.completed ? 'true' : 'false'}"
                            aria-label="Serie ${idx + 1} fatta" onclick="App.completeSet(${idx})">
                            ${set.completed ? this.ico('check') : ''}${set.isNewPR ? this.ico('trophy') : ''}
                        </button>
                    </div>
                    ${set.completed ? `
                    <div class="set-row-bottom">
                        <div class="rir-selector" title="Quante ripetizioni avevi ancora?">
                            <span class="rir-label">RIR:</span>
                            <div class="rir-buttons">
                                ${[0, 1, 2, 3, 4].map(rir => `
                                    <button type="button" class="rir-btn ${set.rir === rir ? 'active' : ''}" data-rir="${rir}"
                                        aria-pressed="${set.rir === rir ? 'true' : 'false'}"
                                        onclick="App.setRir(${idx}, ${rir})">${rir}${rir === 4 ? '+' : ''}</button>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                    ` : ''}
                </div>
            `;
        }).join('');

        return `
            ${roundHTML}
            <div class="sets-progress-bar">
                <div class="sets-progress-fill" style="width: ${Math.min(100, (completedSets / total) * 100)}%"></div>
                <span class="sets-progress-text">${completedSets}/${total} fatte</span>
            </div>
            <div class="sets-container-mobile">${rows}</div>
        `;
    },

    _renderExerciseDynamic() {
        const el = document.getElementById('exercise-dynamic');
        const exercise = this._currentExercise();
        if (!el || !exercise || this._renderedExercise !== this.currentExerciseIndex) {
            this.displayCurrentExercise();
            return;
        }
        el.innerHTML = this._exerciseDynamicHTML(exercise, this._exerciseContext(exercise));
    },

    // Corpo libero
    setBwMode(mode) {
        const exercise = this._currentExercise();
        if (!exercise) return;
        exercise.bwMode = mode;
        if (mode === 'solo') exercise.bwModifier = 0;
        this._applyBodyweightToSets(exercise);
    },

    setBwModifier(value) {
        const exercise = this._currentExercise();
        if (!exercise) return;
        exercise.bwModifier = Math.abs(GT.num(value));
        this._applyBodyweightToSets(exercise);
    },

    adjustBwModifier(delta) {
        const exercise = this._currentExercise();
        if (!exercise) return;
        this.setBwModifier(Math.max(0, GT.num(exercise.bwModifier) + delta));
    },

    _applyBodyweightToSets(exercise) {
        const bodyWeight = parseFloat(Storage.getProfile().weight) || 0;
        const eff = this._effectiveBodyweight(exercise, bodyWeight);
        exercise.setsData.forEach(set => {
            if (!set.completed) set.weight = eff || '';
        });
        this.displayCurrentExercise();
        this._persistSession();
    },

    updateSet(setIndex, field, value) {
        const exercise = this._currentExercise();
        const set = exercise?.setsData[setIndex];
        if (!set) return;
        const old = set[field];
        set[field] = value;
        set.autoFilled = true;
        if (field === 'weight') this._propagateWeight(exercise, setIndex, old, value);
        this._persistSession();
    },

    // Cambiando il peso di una serie, le serie successive non fatte con lo stesso peso lo seguono
    _propagateWeight(exercise, fromIdx, oldValue, newValue) {
        for (let i = fromIdx + 1; i < exercise.setsData.length; i++) {
            const s = exercise.setsData[i];
            if (s.completed || String(s.weight) !== String(oldValue)) continue;
            s.weight = newValue;
            const input = document.getElementById(`set-${i}-weight`);
            if (input) input.value = newValue;
        }
    },

    // Stepper − / +: passo dal tipo di attrezzo (Storage.getLoadStep), partenza dal peso suggerito,
    // aggiorna solo l'input senza ridisegnare la card (N15)
    adjustSet(setIndex, field, dir) {
        const exercise = this._currentExercise();
        const set = exercise?.setsData[setIndex];
        if (!set) return;
        const sign = dir < 0 ? -1 : 1;
        const isEmpty = set[field] === '' || set[field] == null;
        const cur = isEmpty ? NaN : GT.num(set[field]);
        let val;

        if (field === 'weight') {
            if (!Number.isFinite(cur)) {
                const base = this._suggestedWeight(this._exerciseContext(exercise));
                val = base != null ? base : 0;
            } else {
                let step = 0;
                try {
                    // scendendo si usa il passo del peso di arrivo (manubri: 10 → 8, 8 → 7)
                    step = Storage.getLoadStep(exercise.exerciseId, sign > 0 ? cur : Math.max(0, cur - 0.01));
                } catch (e) {
                    step = 0;
                }
                if (!(step > 0)) step = this._isBodyweight(exercise.exerciseId) ? 1 : 2.5;
                val = Math.max(0, Math.round((cur + sign * step) * 100) / 100);
            }
        } else {
            if (!Number.isFinite(cur)) {
                const hint = parseInt(this._repsHint(exercise, setIndex));
                val = Number.isFinite(hint) ? hint : (sign > 0 ? 1 : 0);
            } else {
                val = Math.max(0, Math.round(cur) + sign);
            }
        }

        const old = set[field];
        set[field] = val;
        set.autoFilled = true;
        const input = document.getElementById(`set-${setIndex}-${field}`);
        if (input) input.value = val;
        if (field === 'weight') this._propagateWeight(exercise, setIndex, old, val);
        this._persistSession();
    },

    setRir(setIndex, rir) {
        const exercise = this._currentExercise();
        const set = exercise?.setsData[setIndex];
        if (!set) return;
        set.rir = set.rir === rir ? undefined : rir;   // secondo tocco = togli
        this._renderExerciseDynamic();
        this._persistSession();

        if (set.rir === 0) this.showNotification('RIR 0: cedimento', 'warning');
        else if (set.rir === 4) this.showNotification('RIR 4+: puoi caricare di più', 'info');
    },

    completeSet(setIndex) {
        const w = this.activeWorkout;
        const exIdx = this.currentExerciseIndex;
        const exercise = this._currentExercise();
        const set = exercise?.setsData[setIndex];
        if (!w || !set) return;

        // Valori ancora nel campo (es. tastiera iOS aperta) prima di chiudere la serie
        const wIn = document.getElementById(`set-${setIndex}-weight`);
        const rIn = document.getElementById(`set-${setIndex}-reps`);
        if (wIn && wIn.value !== String(set.weight ?? '')) set.weight = wIn.value;
        if (rIn && rIn.value !== String(set.reps ?? '')) set.reps = rIn.value;

        set.completed = !set.completed;

        if (set.completed) {
            // Ripetizioni vuote = quelle proposte
            if (set.reps === '' || set.reps == null) {
                const hint = parseInt(this._repsHint(exercise, setIndex));
                if (Number.isFinite(hint)) set.reps = hint;
            }

            const weight = GT.num(set.weight);
            const reps = Math.round(GT.num(set.reps));
            set.isNewPR = false;
            if (weight > 0 && reps > 0) {
                const earlier = [];
                w.exercises.forEach((ex, i) => {
                    if (ex.exerciseId !== exercise.exerciseId) return;
                    ex.setsData.forEach((s, j) => {
                        if (s.completed && !(i === exIdx && j === setIndex)) {
                            earlier.push({ weight: GT.num(s.weight), reps: Math.round(GT.num(s.reps)) });
                        }
                    });
                });
                let prCheck = null;
                try {
                    prCheck = Storage.checkForNewPR(exercise.exerciseId, weight, reps, earlier);
                } catch (e) {
                    console.warn('checkForNewPR', e);
                }
                if (prCheck?.isNewPR) {
                    set.isNewPR = true;
                    this.showNotification(prCheck.type === 'weight' ? `Record di peso: ${weight} kg` : `Record: ${weight} kg × ${reps}`, 'success', { icon: 'trophy' });
                }
            }

            // Tutte le serie fatte e al massimo del range: la prossima volta si sale
            // (stessa logica del riepilogo e del suggerimento: Storage.evaluateSets)
            const allDone = exercise.setsData.every(s => s.completed);
            if (allDone && !exercise.topRangeNotified) {
                let ev = null;
                try { ev = Storage.evaluateSets(exercise.exerciseId, exercise.setsData, exercise.targetReps); } catch (e) { ev = null; }
                if (ev?.action === 'up' && ev.increment > 0) {
                    exercise.topRangeNotified = true;
                    setTimeout(() => this.showNotification(`Prossima volta ${ev.nextWeight} kg (+${ev.increment})`, 'success', { icon: 'target' }), 500);
                }
            }

            const warmupSection = document.getElementById('warmup-section');
            if (warmupSection && !warmupSection.classList.contains('collapsed')) this._setWarmupCollapsed(true);
        } else {
            set.isNewPR = false;
            // Spunta tolta sulla serie che aveva fatto partire il riposo: il riposo si ferma (N10)
            const src = this._restMeta?.source;
            if (src && src.ex === exIdx && src.set === setIndex) this._stopRest();
        }

        this._renderExerciseDynamic();
        if (set.completed) this._startRestAfterSet(exIdx, setIndex);
        this._persistSession();
    },

    _hasIncomplete(exIdx) {
        return !!this.activeWorkout?.exercises[exIdx]?.setsData.some(s => !s.completed);
    },

    // Dopo una serie: riposo normale, cambio nel superset o recupero di fine giro.
    // Anche dopo l'ultima serie di un esercizio (N11): il riposo continua sull'esercizio dopo.
    _startRestAfterSet(exIdx, setIndex) {
        const w = this.activeWorkout;
        const exercise = w.exercises[exIdx];
        const source = { ex: exIdx, set: setIndex };
        const anyLeft = w.exercises.some((_, i) => this._hasIncomplete(i));
        if (!anyLeft) {
            this._stopRest();   // allenamento finito: niente riposo
            return;
        }

        const nextWithWork = (from) => {
            for (let k = 1; k <= w.exercises.length; k++) {
                const i = (from + k) % w.exercises.length;
                if (this._hasIncomplete(i)) return i;
            }
            return null;
        };

        const group = exercise.supersetGroup ? this._supersetGroupMap[exercise.supersetGroup] : null;
        if (group?.length > 1) {
            const pos = group.indexOf(exIdx);
            const laterInRound = group.slice(pos + 1).find(i => this._hasIncomplete(i));
            if (laterInRound != null) {
                const next = w.exercises[laterInRound];
                this._startRest({
                    seconds: exercise.transitionTime || 10,
                    kind: 'transition',
                    label: `Cambio: ${next.name}`,
                    target: laterInRound,
                    source
                });
                return;
            }
            const firstWithLeft = group.find(i => this._hasIncomplete(i));
            if (firstWithLeft != null) {
                this._startRest({
                    seconds: exercise.supersetRest || exercise.rest || 90,
                    kind: 'rest',
                    label: `Poi: ${w.exercises[firstWithLeft].name}`,
                    target: firstWithLeft,
                    source
                });
                return;
            }
            // Superset finito: recupero verso l'esercizio dopo il gruppo
            const after = nextWithWork(group[group.length - 1]);
            this._startRest({
                seconds: exercise.supersetRest || exercise.rest || 90,
                kind: 'rest',
                label: after != null ? `Poi: ${w.exercises[after].name}` : 'Recupero',
                target: null,
                source
            });
            return;
        }

        const left = this._hasIncomplete(exIdx);
        const after = left ? null : nextWithWork(exIdx);
        this._startRest({
            seconds: exercise.rest || this._defaultRest(exercise.exerciseId),
            kind: 'rest',
            label: left || after == null ? 'Recupero' : `Poi: ${w.exercises[after].name}`,
            target: null,
            source
        });
    },

    // ========================================
    // RECUPERO: barra fissa #rest-bar, stessa macchina (Timer.startRest) per riposo e cambio
    // ========================================

    // resumeEndAt: riposo ripreso dopo una ricarica (può essere già in overtime: niente segnali doppi)
    _startRest({ seconds, kind = 'rest', label = 'Recupero', target = null, source = null, total = null, resumeEndAt = null }) {
        const resumed = Number(resumeEndAt) > 0;
        const secs = resumed ? Math.round(seconds) : Math.max(1, Math.round(seconds));
        const meta = {
            kind,
            label,
            target,
            source,
            total: Math.max(1, secs, Math.round(total || secs)),
            endAt: resumed ? Number(resumeEndAt) : Date.now() + secs * 1000
        };
        this._restMeta = meta;
        this._setRestAdjustEnabled(true);
        try {
            Timer.startRest({
                seconds: Math.max(0, secs),
                kind,
                endTime: meta.endAt,
                total: meta.total,
                onTick: (remaining, tot) => {
                    if (this._restMeta === meta) this._renderRestBar(remaining, tot);
                },
                onZero: () => this._onRestZero(meta),
                onStop: (reason) => {
                    // Dopo +5:00 il timer si ferma da solo: resta "Pronto", ±15 non servono più
                    if (reason === 'overtime' && this._restMeta === meta) {
                        meta.expired = true;
                        this._setText('rest-bar-label', 'Pronto');
                        this._setRestAdjustEnabled(false);
                        this._persistSession();
                    }
                }
            });
        } catch (e) {
            console.error('Timer.startRest', e);
        }
        this._renderRestBar(secs, meta.total);
        this._persistSession();
    },

    _onRestZero(meta) {
        if (this._restMeta !== meta) return;
        // Cambio nel superset e fine giro: si passa da soli all'esercizio giusto,
        // ma solo se si è ancora sull'esercizio che ha fatto partire il riposo
        if (meta.target != null && this.activeWorkout && this.currentExerciseIndex === meta.source?.ex) {
            this._goToExercise(meta.target);
        }
        if (meta.kind === 'transition') this._stopRest();
    },

    _renderRestBar(remaining, tot) {
        const bar = document.getElementById('rest-bar');
        if (!bar) return;
        const meta = this._restMeta || {};
        const total = Math.max(meta.total || 0, tot || 0, 1);
        const fmt = (s) => this._fmtSec(s);

        this._showRestBar(true);
        bar.classList.toggle('is-transition', meta.kind === 'transition');
        bar.classList.toggle('is-warning', remaining > 0 && remaining <= 10);
        bar.classList.toggle('is-done', remaining <= 0);

        this._setText('rest-bar-label', remaining > 0 ? (meta.label || 'Recupero') : 'Pronto');
        this._setText('rest-bar-time', remaining > 0 ? fmt(remaining) : `+${fmt(-remaining)}`);
        const fill = document.getElementById('rest-bar-fill');
        if (fill) fill.style.width = remaining > 0 ? `${Math.max(0, Math.min(100, (remaining / total) * 100))}%` : '100%';

        // Segnale visivo (iPhone in silenzioso non suona né vibra): lampo a 3, 2, 1 e allo zero
        if (remaining <= 3 && remaining >= 0 && meta.flashedAt !== remaining) {
            meta.flashedAt = remaining;
            this._flashRestBar(bar, remaining === 0);
        }
    },

    _flashRestBar(bar, strong) {
        bar.classList.add('is-flash');
        setTimeout(() => bar.classList.remove('is-flash'), strong ? 700 : 350);
        const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        if (reduce || typeof bar.animate !== 'function') return;
        try {
            bar.animate(
                [{ filter: 'brightness(1)' }, { filter: strong ? 'brightness(1.9)' : 'brightness(1.5)' }, { filter: 'brightness(1)' }],
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

    _showRestBar(on) {
        const bar = document.getElementById('rest-bar');
        if (!bar) return;
        bar.hidden = !on;
        bar.classList.toggle('hidden', !on);
        bar.classList.toggle('is-active', on);
        if (!on) bar.classList.remove('is-warning', 'is-done', 'is-transition');
    },

    _adjustRest(delta) {
        if (!this._restMeta || this._restMeta.expired) return;
        try {
            Timer.adjustRest(delta);
        } catch (e) {
            console.warn('Timer.adjustRest', e);
        }
        this._restMeta.endAt += delta * 1000;
        const remaining = Math.round((this._restMeta.endAt - Date.now()) / 1000);
        if (remaining > this._restMeta.total) this._restMeta.total = remaining;
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
        this._showRestBar(false);
        if (had) this._persistSession();
    },

    _skipRest() {
        const meta = this._restMeta;
        this._stopRest();
        if (meta?.target != null && this.activeWorkout && this.currentExerciseIndex === meta.source?.ex) {
            this._goToExercise(meta.target);
        }
    },

    _goToExercise(index) {
        const w = this.activeWorkout;
        if (!w || index < 0 || index >= w.exercises.length) return;
        this.currentExerciseIndex = index;
        this.displayCurrentExercise();
        this._persistSession();
        document.getElementById('current-exercise')?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
    },

    // Avanti/Indietro non fermano il riposo (N11)
    previousExercise() {
        if (this.currentExerciseIndex > 0) this._goToExercise(this.currentExerciseIndex - 1);
    },

    nextExercise() {
        if (this.activeWorkout && this.currentExerciseIndex < this.activeWorkout.exercises.length - 1) {
            this._goToExercise(this.currentExerciseIndex + 1);
        }
    },

    endWorkout(skipConfirm = false) {
        const w = this.activeWorkout;
        if (!w) return;
        const done = this._completedSetsCount();
        if (!skipConfirm && !confirm(`Terminare ${w.name}? ${done} serie fatte`)) return;

        this._stopRest();
        if (done === 0) {
            this._teardownWorkout();
            this.showNotification('Nessuna serie fatta: non salvato', 'info');
            return;
        }
        this.showCooldown();
    },

    showCooldown() {
        const w = this.activeWorkout;
        if (!w) return;
        let cooldown = null;
        try {
            if (w.warmup) cooldown = Warmups.getCooldownByKey(w.warmup);
        } catch (e) {
            cooldown = null;
        }
        if (!cooldown) cooldown = Warmups.getCooldownForWorkout(w.type || 'full-body');
        if (!cooldown) {
            this.finishWorkout();
            return;
        }

        const infoEl = document.getElementById('cooldown-info');
        if (infoEl) {
            infoEl.innerHTML = cooldown.duration ? `
                <div class="cooldown-duration">
                    <span class="duration-icon">${this.ico('timer')}</span>
                    <span class="duration-text">${GT.esc(cooldown.duration)}</span>
                </div>
            ` : '';
        }

        const exercisesEl = document.getElementById('cooldown-exercises');
        if (exercisesEl) {
            exercisesEl.innerHTML = (cooldown.exercises || []).map((ex, index) => `
                <div class="cooldown-exercise cooldown-exercise-item" style="display:flex;align-items:center;gap:12px;">
                    <div class="cooldown-exercise-number">${index + 1}</div>
                    <div class="cooldown-exercise-content" style="flex:1;">
                        <div class="cooldown-exercise-name">${GT.esc(ex.name)}</div>
                        ${ex.duration ? `<div class="cooldown-exercise-duration">${GT.esc(ex.sets > 1 ? `${ex.sets} × ${ex.duration}` : ex.duration)}</div>` : ''}
                        ${ex.description ? `<div class="cooldown-exercise-description">${GT.esc(ex.description)}</div>` : ''}
                    </div>
                    <button type="button" class="btn btn--ghost btn--icon exercise-info-btn" data-exercise-name="${GT.esc(ex.name)}" aria-label="Come si esegue: ${GT.esc(ex.name)}">
                        ${this.ico('info')}
                    </button>
                </div>
            `).join('');

            exercisesEl.querySelectorAll('.exercise-info-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.showExerciseInfoModal(null, btn.dataset.exerciseName, 'cooldown');
                });
            });
        }

        const modal = document.getElementById('cooldown-modal');
        if (modal) {
            this._modalFocusStack.push(document.activeElement);
            modal.style.display = 'flex';
            this._focusFirst(modal, '#complete-cooldown');
        }
    },

    // Serie da salvare: numeri veri, senza i campi di servizio della sessione
    _cleanSet(s) {
        const out = {
            weight: s.weight === '' || s.weight == null ? '' : Math.max(0, GT.num(s.weight)),
            reps: s.reps === '' || s.reps == null ? '' : Math.max(0, Math.round(GT.num(s.reps))),
            completed: !!s.completed
        };
        if (s.rir !== undefined && s.rir !== null) out.rir = s.rir;
        if (s.isNewPR) out.isNewPR = true;
        if (s.isBodyweight) out.isBodyweight = true;
        return out;
    },

    /**
     * Chiude e salva la sessione.
     * @param {{date?: Date, endTime?: number}} opts - per salvare una sessione rimasta aperta (data vera)
     */
    finishWorkout(opts = {}) {
        const w = this.activeWorkout;
        if (!w) return;

        const endMs = opts.endTime || Date.now();
        const duration = Math.max(0, Math.round((endMs - w.startTime) / 1000));
        const exercises = w.exercises.map(ex => ({
            exerciseId: ex.exerciseId,
            name: ex.name,
            sets: ex.setsData.map(s => this._cleanSet(s))
        }));

        let totalVolume = 0;
        let totalSets = 0;
        exercises.forEach(ex => ex.sets.forEach(s => {
            if (s.completed && s.reps > 0) {
                totalSets++;
                totalVolume += GT.num(s.weight) * s.reps;
            }
        }));

        // Nessuna serie: non si salva, la pagina torna allo stato iniziale (C1)
        if (totalSets === 0) {
            this._teardownWorkout();
            this.showNotification('Nessuna serie fatta: non salvato', 'info');
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
        if (opts.date) workoutData.date = opts.date.toISOString();

        if (!w.isSimulation) {
            try {
                Storage.saveWorkout(workoutData);
            } catch (e) {
                console.error('saveWorkout', e);
                // La sessione resta aperta e salvata in active_session: nulla va perso
                this.showNotification(e?.code === 'QUOTA'
                    ? 'Memoria piena: NON salvato. Esporta i dati e riprova'
                    : 'Salvataggio non riuscito: riprova', 'error');
                return;
            }
        }

        this.lastWorkoutSummary = {
            name: w.name,
            volume: Math.round(totalVolume),
            sets: totalSets,
            duration,
            isSimulation: !!w.isSimulation,
            exercises: w.exercises.map(ex => ({ name: ex.name, setsData: ex.setsData.map(s => this._cleanSet(s)) })),
            progressions: w.isSimulation ? [] : this._buildProgressions(w)
        };

        this._teardownWorkout();
        this._safe(() => this.showWorkoutCompletionSummary());
        this.navigateTo('oggi');
        this._safe(() => this.loadProgress());

        if (w.isSimulation) {
            this.showNotification('Simulazione finita: nulla salvato', 'info');
        } else {
            this.showNotification(`Allenamento salvato · ${GT.formatVolume(totalVolume)}`, 'success');
        }
    },

    // Cosa fare la prossima volta: stessa logica dell'avviso in seduta (Storage.evaluateSets, C7)
    _buildProgressions(w) {
        const byId = new Map();
        w.exercises.forEach(ex => {
            const entry = byId.get(ex.exerciseId) || { name: ex.name, sets: [], targetReps: ex.targetReps };
            entry.sets.push(...ex.setsData);
            byId.set(ex.exerciseId, entry);
        });
        const out = [];
        byId.forEach((entry, id) => {
            let ev = null;
            try { ev = Storage.evaluateSets(id, entry.sets, entry.targetReps); } catch (e) { ev = null; }
            if (!ev?.action) return;
            const bw = this._isBodyweight(id);
            let text;
            if (ev.action === 'up') text = `↑ ${ev.nextWeight} kg`;
            else if (ev.action === 'reps') text = bw ? '+1 rep' : `${ev.topWeight} kg · +1 rep`;
            else text = bw ? '=' : `${ev.topWeight} kg`;
            out.push({ name: entry.name, action: ev.action === 'up' ? 'up' : ev.action === 'reps' ? 'reps' : 'maintain', text });
        });
        return out;
    },

    showWorkoutCompletionSummary() {
        const summary = this.lastWorkoutSummary;
        if (!summary) return;

        const durationMin = Math.round((summary.duration || 0) / 60);
        const progressions = summary.progressions || [];
        const upCount = progressions.filter(p => p.action === 'up').length;

        const exercisesHTML = (summary.exercises || []).length ? `
            <h4>Esercizi</h4>
            <div class="workout-detail-exercises">
                ${summary.exercises.map(ex => `
                    <div class="workout-detail-exercise">
                        <div class="workout-detail-ex-header">
                            <span class="workout-detail-ex-name">${GT.esc(ex.name)}</span>
                            <span class="workout-detail-ex-vol">${GT.esc(GT.formatVolume(this._setsVolume(ex.setsData)))}</span>
                        </div>
                        <div class="workout-detail-sets">${this._setsChips(ex.setsData)}</div>
                    </div>
                `).join('')}
            </div>
        ` : '';

        const progressionHTML = progressions.length ? `
            <h4>Prossima volta</h4>
            <div class="progression-list">
                ${progressions.map(p => `
                    <div class="progression-item ${GT.esc(p.action)}">
                        <span class="prog-name">${GT.esc(p.name)}</span>
                        <span class="prog-action">${GT.esc(p.text)}</span>
                    </div>
                `).join('')}
            </div>
        ` : '';

        const html = `
            <div class="progression-summary-modal" id="workout-completion-modal">
                <div class="progression-summary-content">
                    <h3>${this.ico('check')} ${GT.esc(summary.name || 'Allenamento')} fatto</h3>
                    <div class="summary-stats">
                        <div class="summary-stat">
                            <span class="stat-value">${GT.esc(GT.formatVolume(summary.volume))}</span>
                            <span class="stat-label">volume</span>
                        </div>
                        <div class="summary-stat">
                            <span class="stat-value">${summary.sets}</span>
                            <span class="stat-label">serie</span>
                        </div>
                        <div class="summary-stat">
                            <span class="stat-value">${durationMin}</span>
                            <span class="stat-label">minuti</span>
                        </div>
                        ${progressions.length ? `
                        <div class="summary-stat">
                            <span class="stat-value">${upCount}</span>
                            <span class="stat-label">↑ peso</span>
                        </div>` : ''}
                    </div>
                    ${exercisesHTML}
                    ${progressionHTML}
                    <button type="button" class="btn btn--primary" onclick="App.closeWorkoutCompletionSummary()">Chiudi</button>
                </div>
            </div>
        `;

        this._showDynamicModal('workout-completion-modal', html);
    },

    closeWorkoutCompletionSummary() {
        const wasSimulation = !!this.lastWorkoutSummary?.isSimulation;
        this._removeDynamicModal('workout-completion-modal');
        if (!wasSimulation) this._safe(() => this._afterWorkoutPrompts());
    },
});
