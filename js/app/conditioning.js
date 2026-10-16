/**
 * GymTracker 2.0 — area CARDIO (HIIT/LISS): consiglio in Oggi, foglio di scelta, sessione a tempo, salvataggio.
 */

Object.assign(App, {
    // ========================================
    // GUSCIO DELL'AREA: foglio del cardio e listener (la riga "Cardio" sta nella pagina Oggi)
    // ========================================

    sheetsConditioning() {
        const back = (id) => `<button type="button" class="btn btn--ghost btn--icon" id="${id}" aria-label="Indietro">${this.ico('back')}</button>`;
        return `
            <div class="modal" id="conditioning-modal">
                <section class="sheet sheet--tall conditioning-modal-content" role="dialog" aria-modal="true" aria-labelledby="conditioning-title-sheet">
                    <span class="sheet__grip" aria-hidden="true"></span>
                    <div class="sheet__head">
                        <h2 id="conditioning-title-sheet">Cardio</h2>
                        <button type="button" class="btn btn--ghost btn--icon sheet__close" id="close-conditioning-modal" aria-label="Chiudi il cardio">${this.ico('close')}</button>
                    </div>

                    <!-- Passo 1: tipo -->
                    <div class="conditioning-step" id="conditioning-step-1">
                        <p class="conditioning-week-status muted" id="conditioning-week-status"></p>
                        <div class="choices conditioning-type-grid">
                            <button type="button" class="choice conditioning-type-card" id="choose-hiit">
                                <span class="choice__icon type-icon">${this.ico('bolt')}</span>
                                <span class="choice__body"><b class="type-name">HIIT</b><span class="type-desc">Alta intensità · <span class="type-time num">15-20</span> min</span></span>
                                <span class="row__end">${this.ico('next')}</span>
                            </button>
                            <button type="button" class="choice conditioning-type-card" id="choose-liss">
                                <span class="choice__icon type-icon">${this.ico('steps')}</span>
                                <span class="choice__body"><b class="type-name">LISS</b><span class="type-desc">Bassa intensità · <span class="type-time num">20-30</span> min</span></span>
                                <span class="row__end">${this.ico('next')}</span>
                            </button>
                        </div>
                    </div>

                    <!-- Passo 2: HIIT -->
                    <div class="conditioning-step" id="conditioning-step-hiit" style="display: none;">
                        <div class="conditioning-header head">${back('conditioning-back-hiit')}<h3 id="hiit-protocol-name">HIIT</h3></div>
                        <p class="conditioning-meta muted" id="hiit-meta"></p>
                        <!-- Protocolli: app.js lo riempie da HIIT_PROTOCOLS con
                             <button type="button" class="protocol-option" role="radio" aria-checked="true|false" data-protocol="…"> -->
                        <div class="protocol-list" id="hiit-protocol-list" role="radiogroup" aria-label="Protocollo"></div>
                        <div class="conditioning-exercises-list" id="hiit-exercises-list"></div>
                        <div class="conditioning-protocol-info"><p id="hiit-protocol-desc" class="muted"></p></div>
                        <button type="button" class="btn btn--primary btn--xl btn--block" id="start-hiit-btn">${this.ico('play')}Inizia HIIT</button>
                    </div>

                    <!-- Passo 2b: LISS -->
                    <div class="conditioning-step" id="conditioning-step-liss" style="display: none;">
                        <div class="conditioning-header head">${back('conditioning-back-liss')}<h3>LISS</h3></div>
                        <p class="conditioning-meta muted" id="liss-meta"></p>
                        <div class="liss-activities-list" id="liss-activities-list"></div>
                        <button type="button" class="btn btn--primary btn--xl btn--block" id="start-liss-btn">${this.ico('play')}Inizia LISS</button>
                    </div>

                    <!-- Passo 3: in corso -->
                    <div class="conditioning-step" id="conditioning-step-active" style="display: none;">
                        <h3 class="conditioning-header" id="active-session-title">Seduta in corso</h3>
                        <!-- Intervallo HIIT: visibile solo con .is-work o .is-rest (lo pilota conditioning.js) -->
                        <div class="conditioning-interval" id="conditioning-interval">
                            <span class="interval-phase" id="conditioning-interval-phase" aria-live="assertive">Lavoro</span>
                            <span class="interval-time num" id="conditioning-interval-time" role="timer">0:20</span>
                            <span class="interval-round num" id="conditioning-interval-round"></span>
                        </div>
                        <div class="conditioning-timer-display">
                            <span class="timer-value num" id="conditioning-timer" role="timer" aria-label="Tempo totale">00:00</span>
                        </div>
                        <div class="conditioning-active-info" id="conditioning-active-info"></div>
                        <button type="button" class="btn btn--secondary btn--xl btn--block btn--danger-text" id="end-conditioning-btn">${this.ico('stop')}Termina</button>
                    </div>

                    <!-- Passo 4: fatto -->
                    <div class="conditioning-step" id="conditioning-step-complete" style="display: none;">
                        <h3>Cardio fatto</h3>
                        <div class="stats conditioning-summary" style="--n: 2">
                            <div class="stat summary-item"><span class="stat__v num summary-value" id="summary-duration">00:00</span><span class="stat__k summary-label">Durata</span></div>
                            <div class="stat summary-item"><span class="stat__v num summary-value" id="summary-calories">0</span><span class="stat__k summary-label">kcal stimate</span></div>
                        </div>
                        <div class="field conditioning-manual-input">
                            <label for="manual-calories">kcal misurate (es. Apple Watch)</label>
                            <input class="input" type="number" id="manual-calories" inputmode="numeric" min="0">
                        </div>
                        <div class="field conditioning-notes">
                            <label for="conditioning-notes">Note</label>
                            <textarea class="input" id="conditioning-notes" rows="2"></textarea>
                        </div>
                        <button type="button" class="btn btn--primary btn--xl btn--block" id="save-conditioning-btn">${this.ico('check')}Salva</button>
                    </div>
                </section>
            </div>
        `;
    },

    bindConditioning() {
        const on = (id, ev, fn) => this._on(id, ev, fn);

        // Conditioning
        on('conditioning-btn', 'click', () => this.openConditioningModal());
        on('close-conditioning-modal', 'click', () => this.closeConditioningModal());
        this._closeOnBackdrop('conditioning-modal', () => this.closeConditioningModal());
        on('choose-hiit', 'click', () => this.chooseConditioningType('hiit'));
        on('choose-liss', 'click', () => this.chooseConditioningType('liss'));
        ['choose-hiit', 'choose-liss'].forEach(id => {
            const el = document.getElementById(id);
            if (el) this._makeKeyboardClickable(el);
        });
        on('conditioning-back-hiit', 'click', () => this.showConditioningStep('1'));
        on('conditioning-back-liss', 'click', () => this.showConditioningStep('1'));
        on('start-hiit-btn', 'click', () => {
            if (this.conditioningState.exercises.length === 0) {
                this.showNotification('Scegli almeno un esercizio', 'warning');
                return;
            }
            this.startConditioningSession();
        });
        on('start-liss-btn', 'click', () => {
            if (!this.conditioningState.lissActivity) {
                this.showNotification('Scegli un\'attività', 'warning');
                return;
            }
            this.startConditioningSession();
        });
        on('end-conditioning-btn', 'click', () => this.finishConditioningSession());
        on('save-conditioning-btn', 'click', () => this.saveConditioningSession());
    },

    // ========================================
    // CONDITIONING (HIIT/LISS)
    // ========================================

    _conditioningGoal() {
        const program = Storage.getActiveProgram();
        return program?.metadata?.goal || Storage.getProfile().goal || 'hypertrophy';
    },

    // Consiglio di cardio per l'obiettivo della scheda attiva (B12: toning compreso)
    _conditioningSuggestion() {
        const program = Storage.getActiveProgram();
        const goal = this._conditioningGoal();
        try {
            const s = TrainingAlgorithm.generateConditioningSuggestions(goal, program);
            if (s) return s;
        } catch (e) {
            console.warn('generateConditioningSuggestions', e);
        }
        const cfg = typeof CONDITIONING_BY_GOAL !== 'undefined' ? CONDITIONING_BY_GOAL[goal] : null;
        return cfg ? { enabled: cfg.frequency > 0, frequency: cfg.frequency, preferredType: cfg.preferredType, protocol: cfg.protocol } : null;
    },

    updateConditioningCard() {
        const card = document.getElementById('conditioning-card');
        const titleEl = document.getElementById('conditioning-title');
        const subtitleEl = document.getElementById('conditioning-subtitle');
        if (!card) return;

        const program = Storage.getActiveProgram();
        const suggestion = this._conditioningSuggestion();
        const target = suggestion?.frequency || 0;
        if (!program || !suggestion?.enabled || target <= 0) {
            card.style.display = 'none';
            return;
        }

        card.style.display = 'flex';
        const done = Storage.getConditioningThisWeek().length;
        let title;
        if (done >= target) {
            title = 'Cardio fatto';
        } else {
            const type = String(suggestion.preferredType || 'HIIT').toLowerCase();
            const pick = type === 'mixed' ? (done % 2 === 0 ? 'hiit' : 'liss') : type;
            title = pick === 'liss' ? 'LISS consigliato' : 'HIIT consigliato';
        }
        if (titleEl) titleEl.textContent = title;
        if (subtitleEl) subtitleEl.textContent = `${done}/${target} questa settimana`;
    },

    _resetConditioningState() {
        this._stopConditioningTimer();
        this.conditioningState = {
            type: null,
            protocol: null,
            lissActivity: null,
            exercises: [],
            step: '1',
            startedAt: null,
            timerInterval: null,
            lastCue: null,
            finalDurationSec: 0,
            finalCalories: 0
        };
    },

    openConditioningModal() {
        if (!document.getElementById('conditioning-modal')) return;
        this._resetConditioningState();

        const suggestion = this._conditioningSuggestion();
        const target = suggestion?.frequency || 0;
        const done = Storage.getConditioningThisWeek().length;
        this._setText('conditioning-week-status', target > 0 ? `${done}/${target} questa settimana` : `${done} questa settimana`);

        this.showConditioningStep('1');
        this._openModal('conditioning-modal', '#choose-hiit');
    },

    closeConditioningModal(force = false) {
        const st = this.conditioningState;
        if (!force) {
            if (st.step === 'active' && st.startedAt) {
                const min = Math.round((Date.now() - st.startedAt) / 60000);
                if (!confirm(`Interrompere ${String(st.type).toUpperCase()}? ${min} min non salvati`)) return;
            } else if (st.step === 'complete') {
                if (!confirm(`Chiudere senza salvare ${String(st.type).toUpperCase()}?`)) return;
            }
        }
        this._stopConditioningTimer();
        this.conditioningState.startedAt = null;
        if (!this.activeWorkout) this._setKeepAwake(false);
        this._closeModal('conditioning-modal');
    },

    showConditioningStep(stepId) {
        document.querySelectorAll('.conditioning-step').forEach(s => { s.style.display = 'none'; });
        const step = document.getElementById(`conditioning-step-${stepId}`);
        if (step) step.style.display = 'block';
        this.conditioningState.step = stepId;
    },

    // HIIT o LISS: ogni scelta riparte pulita (E17: niente selezioni fantasma)
    chooseConditioningType(type) {
        const st = this.conditioningState;
        st.type = type;
        st.exercises = [];
        st.lissActivity = null;
        if (type === 'hiit') {
            st.protocol = this._recommendedProtocolKey();
            this.showConditioningStep('hiit');
            this.populateHIITProtocols();
            this.populateHIITExercises();
            this.updateHIITInfo();
        } else {
            st.protocol = null;
            this.showConditioningStep('liss');
            this.populateLISSActivities();
        }
    },

    _recommendedProtocolKey() {
        if (typeof HIIT_PROTOCOLS === 'undefined') return null;
        const keys = Object.keys(HIIT_PROTOCOLS);
        if (!keys.length) return null;
        const suggestion = this._conditioningSuggestion();
        let key = typeof suggestion?.protocol === 'string' ? suggestion.protocol : null;
        if (!key && suggestion?.protocol?.name) {
            key = keys.find(k => HIIT_PROTOCOLS[k].name === suggestion.protocol.name) || null;
        }
        if (!key && typeof CONDITIONING_BY_GOAL !== 'undefined') key = CONDITIONING_BY_GOAL[this._conditioningGoal()]?.protocol || null;
        if (!key || !HIIT_PROTOCOLS[key]) key = HIIT_PROTOCOLS.circuit30 ? 'circuit30' : keys[0];

        // Mai un protocollo sopra il livello della persona
        const levels = { beginner: 1, intermediate: 2, advanced: 3, expert: 3 };
        const userLevel = levels[Storage.getProfile().level] || 1;
        if ((levels[HIIT_PROTOCOLS[key].level || HIIT_PROTOCOLS[key].difficulty] || 2) > userLevel) {
            key = userLevel === 1 && HIIT_PROTOCOLS.beginner ? 'beginner' : (HIIT_PROTOCOLS.circuit30 ? 'circuit30' : key);
        }
        return key;
    },

    populateHIITProtocols() {
        const list = document.getElementById('hiit-protocol-list');
        if (!list || typeof HIIT_PROTOCOLS === 'undefined') return;
        const st = this.conditioningState;

        list.innerHTML = Object.entries(HIIT_PROTOCOLS).map(([key, p]) => {
            const selected = key === st.protocol;
            return `
                <button type="button" class="protocol-option ${selected ? 'selected' : ''}" role="radio" aria-checked="${selected ? 'true' : 'false'}" data-protocol="${GT.esc(key)}">
                    <span class="protocol-name">${GT.esc(p.name || key)}</span>
                    <span class="protocol-meta">${GT.esc(p.work ?? p.workTime)}/${GT.esc(p.rest ?? p.restTime)} s</span>
                </button>
            `;
        }).join('');

        list.querySelectorAll('[data-protocol]').forEach(btn => {
            btn.addEventListener('click', () => {
                st.protocol = btn.dataset.protocol;
                list.querySelectorAll('[data-protocol]').forEach(b => {
                    const on = b === btn;
                    b.classList.toggle('selected', on);
                    b.setAttribute('aria-checked', on ? 'true' : 'false');
                });
                this.updateHIITInfo();
            });
        });
    },

    // Piano HIIT: intervalli lavoro/recupero. Circuiti: giri su tutti gli esercizi.
    // Tabata: 8 giri per esercizio, uno alla volta. EMOM: un intervallo al minuto, esercizi a turno.
    _hiitPlan() {
        const st = this.conditioningState;
        const p = typeof HIIT_PROTOCOLS !== 'undefined' ? HIIT_PROTOCOLS[st.protocol] : null;
        if (!p) return null;
        const n = Math.max(1, st.exercises.length || p.exercisesCount || 1);
        const work = parseInt(p.work ?? p.workTime) || 30;
        const rest = Math.max(0, parseInt(p.rest ?? p.restTime) || 0);
        const rounds = Math.max(1, parseInt(p.rounds) || 3);
        const order = p.order || 'circuit';
        const isEmom = order === 'emom';
        const isBlock = order === 'block';
        // EMOM: intervalli fissi del protocollo; circuito e blocco: giri × esercizi SCELTI
        const intervals = isEmom ? (parseInt(p.intervals) || rounds) : rounds * n;
        return { p, n, work, rest, rounds, isEmom, isBlock, intervals, totalSec: intervals * (work + rest) };
    },

    updateHIITInfo() {
        const plan = this._hiitPlan();
        if (!plan) return;
        const minutes = Math.max(1, Math.round(plan.totalSec / 60));
        this._setText('hiit-protocol-name', `HIIT · ${plan.p.name || ''}`);
        this._setText('hiit-meta', `~${minutes} min · ~${this._estimateCalories('hiit', minutes)} kcal`);
        this._setText('hiit-protocol-desc', plan.p.description || '');
    },

    populateHIITExercises() {
        const container = document.getElementById('hiit-exercises-list');
        if (!container || typeof HIIT_EXERCISES === 'undefined') return;
        const st = this.conditioningState;

        const levels = { beginner: 1, intermediate: 2, advanced: 3, expert: 3 };
        const userLevel = levels[Storage.getProfile().level] || 1;
        const list = Object.entries(HIIT_EXERCISES)
            .map(([id, ex]) => ({ id, ...ex }))
            .filter(ex => (levels[ex.difficulty] || 2) <= userLevel && !(ex.equipment || []).length);

        // Restano selezionati solo esercizi visibili, senza doppioni
        const visible = new Set(list.map(ex => ex.id));
        st.exercises = [...new Set(st.exercises)].filter(id => visible.has(id));

        const placeholder = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect fill=%22%232a2a3e%22 width=%22100%22 height=%22100%22/%3E%3C/svg%3E';
        container.innerHTML = list.map(ex => {
            const selected = st.exercises.includes(ex.id);
            return `
            <div class="conditioning-exercise-card ${selected ? 'selected' : ''}" data-exercise-id="${GT.esc(ex.id)}" tabindex="0" role="button" aria-pressed="${selected ? 'true' : 'false'}">
                <img class="exercise-gif-thumb" src="${GT.esc(ex.gifUrl || placeholder)}" alt="" loading="lazy"
                     onerror="this.onerror=null;this.src='${placeholder}'">
                <div class="exercise-info">
                    <div class="exercise-name">${GT.esc(ex.name)}</div>
                    <div class="exercise-category">${GT.esc(this.formatDifficulty(ex.difficulty))}</div>
                </div>
                <div class="exercise-check">${this.ico('check')}</div>
            </div>
        `;
        }).join('');

        container.querySelectorAll('.conditioning-exercise-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = card.dataset.exerciseId;
                const set = new Set(st.exercises);
                if (set.has(id)) set.delete(id); else set.add(id);
                st.exercises = [...set];
                const on = set.has(id);
                card.classList.toggle('selected', on);
                card.setAttribute('aria-pressed', on ? 'true' : 'false');
                this.updateHIITInfo();
            });
            this._makeKeyboardClickable(card);
        });
    },

    formatDifficulty(difficulty) {
        return { beginner: 'Facile', intermediate: 'Medio', advanced: 'Avanzato' }[difficulty] || difficulty || '';
    },

    populateLISSActivities() {
        const container = document.getElementById('liss-activities-list');
        if (!container || typeof LISS_ACTIVITIES === 'undefined') return;
        const st = this.conditioningState;

        container.innerHTML = Object.entries(LISS_ACTIVITIES).map(([id, activity]) => `
            <div class="liss-activity-card ${st.lissActivity === id ? 'selected' : ''}" data-activity="${GT.esc(id)}" tabindex="0" role="button">
                <span class="activity-icon">${this.getLissIcon(id)}</span>
                <span class="activity-name">${GT.esc(activity.name)}</span>
            </div>
        `).join('');

        container.querySelectorAll('.liss-activity-card').forEach(card => {
            card.addEventListener('click', () => {
                container.querySelectorAll('.liss-activity-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                st.lissActivity = card.dataset.activity;
            });
            this._makeKeyboardClickable(card);
        });
    },

    getLissIcon(activityId) {
        // Icone dello sprite (niente emoji): camminate e scale = passi, il resto = cuore
        const icons = {
            'walking-incline': 'steps',
            'cycling-steady': 'heart',
            'elliptical': 'heart',
            'rowing-steady': 'heart',
            'swimming': 'heart',
            'outdoor-walk': 'steps',
            'stair-climber': 'steps'
        };
        return this.ico(icons[activityId] || 'heart', 'ico--lg');
    },

    startConditioningSession() {
        const st = this.conditioningState;
        st.startedAt = Date.now();
        st.lastCue = null;

        this.showConditioningStep('active');
        this.updateConditioningActiveInfo();

        const interval = document.getElementById('conditioning-interval');
        if (interval) interval.classList.remove('is-work', 'is-rest', 'is-done');

        this._setKeepAwake(true);
        this._stopConditioningTimer();
        this._conditioningTick();
        st.timerInterval = setInterval(() => this._conditioningTick(), 250);
    },

    _stopConditioningTimer() {
        if (this.conditioningState?.timerInterval) {
            clearInterval(this.conditioningState.timerInterval);
            this.conditioningState.timerInterval = null;
        }
    },

    // Tempo dal timestamp di partenza: giusto anche se il telefono ha sospeso l'app (E3)
    _conditioningTick() {
        const st = this.conditioningState;
        if (!st.startedAt) return;
        const elapsed = Math.max(0, Math.floor((Date.now() - st.startedAt) / 1000));
        const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
        const ss = String(elapsed % 60).padStart(2, '0');
        this._setText('conditioning-timer', `${mm}:${ss}`);
        if (st.type === 'hiit') this._renderHiitInterval(elapsed);
    },

    _renderHiitInterval(elapsed) {
        const st = this.conditioningState;
        const plan = this._hiitPlan();
        const box = document.getElementById('conditioning-interval');
        if (!plan || !box) return;

        const cycle = plan.work + plan.rest;
        const idx = Math.floor(elapsed / cycle);
        const exIndexAt = (k) => plan.isBlock ? Math.floor(k / plan.rounds) % plan.n : k % plan.n;
        const rounds = plan.isEmom ? plan.intervals : plan.rounds;

        if (idx >= plan.intervals) {
            if (st.lastCue !== 'done') {
                st.lastCue = 'done';
                this._cue('done');
                box.classList.remove('is-work');
                box.classList.add('is-rest', 'is-done');
                this._setText('conditioning-interval-phase', 'Fatto');
                this._setText('conditioning-interval-time', 'Fine');
                this._setText('conditioning-interval-round', `${rounds}/${rounds}`);
            }
            return;
        }

        const within = elapsed - idx * cycle;
        const isWork = within < plan.work;
        const remaining = isWork ? plan.work - within : cycle - within;
        const round = plan.isEmom ? idx + 1 : plan.isBlock ? (idx % plan.rounds) + 1 : Math.floor(idx / plan.n) + 1;

        // Segnali: inizio lavoro, inizio recupero, 3-2-1 prima di ripartire.
        // In recupero si vede già l'esercizio che viene dopo.
        const cueKey = `${idx}-${isWork ? 'w' : 'r'}`;
        if (st.lastCue !== cueKey) {
            st.lastCue = cueKey;
            this._cue(isWork ? 'work' : 'rest');
            const nextIdx = isWork ? idx : Math.min(idx + 1, plan.intervals - 1);
            this._showHiitExercise(st.exercises[exIndexAt(nextIdx)], !isWork && idx + 1 < plan.intervals);
        } else if (!isWork && remaining <= 3 && remaining > 0 && st.lastTick !== `${cueKey}-${remaining}`) {
            st.lastTick = `${cueKey}-${remaining}`;
            this._cue('tick');
        }

        box.classList.remove('is-done');
        box.classList.toggle('is-work', isWork);
        box.classList.toggle('is-rest', !isWork);
        this._setText('conditioning-interval-phase', isWork ? 'Lavoro' : 'Recupero');
        this._setText('conditioning-interval-time', this._fmtSec(remaining));
        this._setText('conditioning-interval-round', `${round}/${rounds}`);
    },

    _cue(kind) {
        try {
            if (kind === 'work') {
                Timer.playBeep(988, 0.18);
                Timer.vibrate([150]);
            } else if (kind === 'rest') {
                Timer.playBeep(523, 0.25);
                Timer.vibrate([80, 60, 80]);
            } else if (kind === 'tick') {
                Timer.playBeep(660, 0.08);
            } else if (kind === 'done') {
                Timer.playCompletionSound();
                Timer.vibrate([200, 100, 200]);
            }
        } catch (e) {
            /* audio/vibrazione non disponibili */
        }
    },

    updateConditioningActiveInfo() {
        const st = this.conditioningState;
        const infoContainer = document.getElementById('conditioning-active-info');
        if (!infoContainer) return;

        if (st.type === 'hiit') {
            const plan = this._hiitPlan();
            this._setText('active-session-title', `HIIT · ${plan?.p.name || ''}`);
            infoContainer.innerHTML = `
                <div class="selected-exercises-list">
                    ${st.exercises.map(id => HIIT_EXERCISES?.[id] ? `<span class="selected-exercise-tag">${GT.esc(HIIT_EXERCISES[id].name)}</span>` : '').join('')}
                </div>
                <div id="hiit-current-exercise"></div>
            `;
            this._showHiitExercise(st.exercises[0]);
        } else {
            const activity = typeof LISS_ACTIVITIES !== 'undefined' ? LISS_ACTIVITIES[st.lissActivity] : null;
            this._setText('active-session-title', `LISS · ${activity?.name || 'Cardio'}`);
            infoContainer.innerHTML = `
                <div class="liss-activity-display">
                    <span class="activity-icon-large">${this.getLissIcon(st.lissActivity)}</span>
                    <span class="activity-name-large">${GT.esc(activity?.name || 'Cardio leggero')}</span>
                </div>
                <p class="conditioning-description">${GT.esc(activity?.description || 'Ritmo costante e moderato')}</p>
            `;
        }
    },

    // GIF e descrizione dell'esercizio HIIT in corso (si cambia solo quando cambia esercizio)
    _showHiitExercise(id, isNext = false) {
        const box = document.getElementById('hiit-current-exercise');
        const ex = typeof HIIT_EXERCISES !== 'undefined' ? HIIT_EXERCISES[id] : null;
        if (!box || !ex) return;
        const key = `${id}|${isNext}`;
        if (box.dataset.current === key) return;
        const sameGif = box.dataset.current?.split('|')[0] === id;
        box.dataset.current = key;
        const title = `<p class="hiit-exercise-name"><strong>${isNext ? 'Poi: ' : ''}${GT.esc(ex.name)}</strong></p>`;
        const titleEl = box.querySelector('.hiit-exercise-name');
        if (sameGif && titleEl) {
            titleEl.outerHTML = title;   // stessa GIF: non si ricarica
            return;
        }
        box.innerHTML = `
            ${title}
            ${ex.gifUrl ? `<img class="conditioning-exercise-gif" src="${GT.esc(ex.gifUrl)}" alt="" onerror="this.style.display='none'">` : ''}
            <p class="conditioning-description">${GT.esc(ex.description || '')}</p>
        `;
    },

    _estimateCalories(type, minutes) {
        const st = this.conditioningState;
        const weight = parseFloat(Storage.getProfile().weight) || 70;
        let met;
        if (type === 'hiit') {
            const ids = st.exercises || [];
            met = ids.length && typeof HIIT_EXERCISES !== 'undefined'
                ? ids.reduce((sum, id) => sum + (HIIT_EXERCISES[id]?.metValue || 8), 0) / ids.length
                : 8;
        } else {
            const activity = typeof LISS_ACTIVITIES !== 'undefined' ? LISS_ACTIVITIES[st.lissActivity] : null;
            met = activity?.metValue || 4;
        }
        return Math.round((met * 3.5 * weight) / 200 * minutes);
    },

    finishConditioningSession() {
        const st = this.conditioningState;
        if (!st.startedAt) return;
        this._stopConditioningTimer();
        if (!this.activeWorkout) this._setKeepAwake(false);

        const durationSec = Math.max(1, Math.round((Date.now() - st.startedAt) / 1000));
        const minutes = Math.max(1, Math.round(durationSec / 60));
        st.finalDurationSec = durationSec;
        st.finalCalories = this._estimateCalories(st.type, durationSec / 60);
        st.startedAt = null;

        this._setText('summary-duration', `${minutes} min`);
        this._setText('summary-calories', `${st.finalCalories} kcal`);
        const manual = document.getElementById('manual-calories');
        if (manual) manual.value = '';
        const notes = document.getElementById('conditioning-notes');
        if (notes) notes.value = '';

        this.showConditioningStep('complete');
    },

    saveConditioningSession() {
        const st = this.conditioningState;
        const manualRaw = parseInt(document.getElementById('manual-calories')?.value);
        const manualCalories = Number.isFinite(manualRaw) && manualRaw > 0 ? manualRaw : null;
        const notes = (document.getElementById('conditioning-notes')?.value || '').trim().slice(0, 500);
        const durationSec = st.finalDurationSec || 60;
        const isHiit = st.type === 'hiit';

        const session = {
            type: isHiit ? 'hiit' : 'liss',
            protocol: isHiit ? st.protocol : null,
            activity: isHiit ? null : st.lissActivity,
            exercises: isHiit ? [...new Set(st.exercises)] : [],
            durationSec,
            duration: Math.max(1, Math.round(durationSec / 60)),
            estimatedCalories: st.finalCalories || 0,
            manualCalories,
            calories: manualCalories ?? (st.finalCalories || 0),
            notes
        };

        try {
            Storage.saveConditioningSession(session);
        } catch (e) {
            console.error('saveConditioningSession', e);
            this.showNotification('Sessione NON salvata: memoria piena', 'error');
            return;
        }

        this.showNotification('Sessione salvata', 'success');
        this.closeConditioningModal(true);
        this._resetConditioningState();
        this.loadDashboard();
        this._safe(() => this.loadConditioningProgress());
    },
});
