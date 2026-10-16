/**
 * GymTracker 2.0 — area CARDIO (HIIT/LISS): consiglio in Oggi, foglio con scelta del tipo, protocollo ed
 * esercizi, timer a intervalli grande (come il recupero della seduta), salvataggio con kcal misurate e note.
 * Il tempo si calcola sempre dal timestamp di partenza (E3): giusto anche se iOS sospende l'app.
 *
 * Si apre con App.openConditioningModal() (alias App.openConditioning) o con un clic su
 * #conditioning-btn / [data-action="cardio"] in qualunque pagina.
 */

Object.assign(App, {
    // ========================================
    // GUSCIO DELL'AREA: foglio del cardio e listener
    // ========================================

    sheetsConditioning() {
        return `
            <div class="modal" id="conditioning-modal">
                <section class="sheet sheet--tall cd" role="dialog" aria-modal="true" aria-labelledby="conditioning-title-sheet">
                    <span class="sheet__grip" aria-hidden="true"></span>
                    <div class="sheet__head">
                        <button type="button" class="btn btn--ghost btn--icon cd-back" id="conditioning-back" aria-label="Indietro: scegli il tipo" hidden>${this.ico('back')}</button>
                        <h2 id="conditioning-title-sheet">Cardio</h2>
                        <button type="button" class="btn btn--ghost btn--icon sheet__close" id="close-conditioning-modal" aria-label="Chiudi il cardio">${this.ico('close')}</button>
                    </div>

                    <!-- Passo 1: tipo -->
                    <div class="conditioning-step cd-step" id="conditioning-step-1">
                        <p class="muted" id="conditioning-week-status"></p>
                        <div class="choices">
                            <button type="button" class="choice" id="choose-hiit">
                                <span class="choice__icon">${this.ico('bolt')}</span>
                                <span class="choice__body"><b>HIIT</b><span>Intervalli intensi · <span class="num">15-20</span> min</span></span>
                                <span class="row__end">${this.ico('next')}</span>
                            </button>
                            <button type="button" class="choice" id="choose-liss">
                                <span class="choice__icon">${this.ico('steps')}</span>
                                <span class="choice__body"><b>LISS</b><span>Ritmo costante · <span class="num">20-30</span> min</span></span>
                                <span class="row__end">${this.ico('next')}</span>
                            </button>
                        </div>
                        <p class="faint cd-tip" id="conditioning-tip"></p>
                    </div>

                    <!-- Passo 2: HIIT -->
                    <div class="conditioning-step cd-step" id="conditioning-step-hiit" hidden>
                        <p class="cd-meta" id="hiit-meta"></p>
                        <section class="section" aria-labelledby="cd-proto-t">
                            <h3 class="cap" id="cd-proto-t">Protocollo</h3>
                            <div class="choices" id="hiit-protocol-list" role="radiogroup" aria-labelledby="cd-proto-t"></div>
                        </section>
                        <section class="section" aria-labelledby="cd-ex-t">
                            <div class="section__head"><h3 class="cap" id="cd-ex-t">Esercizi</h3><span class="count" id="hiit-ex-count" aria-live="polite"></span></div>
                            <ul class="group cd-exs" id="hiit-exercises-list" aria-labelledby="cd-ex-t"></ul>
                        </section>
                        <div class="cd-foot">
                            <button type="button" class="btn btn--primary btn--xl btn--block" id="start-hiit-btn">${this.ico('play')}Inizia HIIT</button>
                        </div>
                    </div>

                    <!-- Passo 2b: LISS -->
                    <div class="conditioning-step cd-step" id="conditioning-step-liss" hidden>
                        <p class="cd-meta" id="liss-meta"></p>
                        <div class="choices" id="liss-activities-list" role="radiogroup" aria-label="Attività"></div>
                        <div class="cd-foot">
                            <button type="button" class="btn btn--primary btn--xl btn--block" id="start-liss-btn">${this.ico('play')}Inizia LISS</button>
                        </div>
                    </div>

                    <!-- Passo 3: in corso -->
                    <div class="conditioning-step cd-step" id="conditioning-step-active" hidden>
                        <div class="cd-int" id="conditioning-interval">
                            <span class="cd-int__phase" id="conditioning-interval-phase" aria-live="polite">Lavoro</span>
                            <span class="cd-int__time num" id="conditioning-interval-time" role="timer" aria-label="Tempo dell'intervallo">0:30</span>
                            <span class="cd-int__round" id="conditioning-interval-round"></span>
                            <span class="cd-int__track" aria-hidden="true"><span class="cd-int__fill" id="conditioning-interval-fill"></span></span>
                        </div>
                        <div class="cd-now" id="conditioning-active-info"></div>
                        <div class="cd-total">
                            <span class="cap">Tempo totale</span>
                            <span class="num cd-total__v" id="conditioning-timer" role="timer" aria-label="Tempo totale">00:00</span>
                        </div>
                        <div class="cd-foot">
                            <button type="button" class="btn btn--secondary btn--xl btn--block btn--danger-text" id="end-conditioning-btn">${this.ico('stop')}Termina</button>
                        </div>
                    </div>

                    <!-- Passo 4: fatto -->
                    <div class="conditioning-step cd-step" id="conditioning-step-complete" hidden>
                        <p class="cd-done">${this.ico('check')}<span id="cd-done-title">Cardio fatto</span></p>
                        <div class="stats cd-stats" style="--n: 2">
                            <div class="stat"><span class="stat__v num" id="summary-duration">0<small>min</small></span><span class="stat__k">durata</span></div>
                            <div class="stat"><span class="stat__v num" id="summary-calories">0<small>kcal</small></span><span class="stat__k">stimate</span></div>
                        </div>
                        <div class="field">
                            <label for="manual-calories">kcal misurate (es. Apple Watch) · facoltativo</label>
                            <input class="input num" type="text" id="manual-calories" inputmode="numeric" autocomplete="off">
                        </div>
                        <div class="field">
                            <label for="conditioning-notes">Note · facoltativo</label>
                            <textarea class="input" id="conditioning-notes" rows="2" maxlength="500"></textarea>
                        </div>
                        <div class="cd-foot">
                            <button type="button" class="btn btn--primary btn--xl btn--block" id="save-conditioning-btn">${this.ico('check')}Salva cardio</button>
                        </div>
                    </div>
                </section>
            </div>
        `;
    },

    bindConditioning() {
        const on = (id, ev, fn) => this._on(id, ev, fn);

        // Apertura da qualunque pagina (la riga "Cardio" di Oggi la disegna l'area Oggi)
        document.addEventListener('click', (e) => {
            const t = e.target.closest('#conditioning-btn, [data-action="cardio"]');
            if (!t || e.defaultPrevented) return;
            e.preventDefault();
            this.openConditioningModal();
        });

        on('close-conditioning-modal', 'click', () => this.closeConditioningModal());
        this._closeOnBackdrop('conditioning-modal', () => this.closeConditioningModal());
        on('conditioning-back', 'click', () => this.showConditioningStep('1'));
        on('choose-hiit', 'click', () => this.chooseConditioningType('hiit'));
        on('choose-liss', 'click', () => this.chooseConditioningType('liss'));

        on('hiit-protocol-list', 'click', (e) => {
            const b = e.target.closest('[data-protocol]');
            if (!b) return;
            this.conditioningState.protocol = b.dataset.protocol;
            document.querySelectorAll('#hiit-protocol-list [data-protocol]').forEach(x => x.setAttribute('aria-checked', String(x === b)));
            this.updateHIITInfo();
        });
        on('hiit-exercises-list', 'click', (e) => {
            const b = e.target.closest('[data-exercise-id]');
            if (!b) return;
            const st = this.conditioningState;
            const set = new Set(st.exercises);
            const id = b.dataset.exerciseId;
            if (set.has(id)) set.delete(id); else set.add(id);
            st.exercises = [...set];
            b.setAttribute('aria-pressed', String(set.has(id)));
            this.updateHIITInfo();
        });
        on('liss-activities-list', 'click', (e) => {
            const b = e.target.closest('[data-activity]');
            if (!b) return;
            this.conditioningState.lissActivity = b.dataset.activity;
            document.querySelectorAll('#liss-activities-list [data-activity]').forEach(x => x.setAttribute('aria-checked', String(x === b)));
            this.updateLISSInfo();
        });

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
    // CONSIGLIO PER L'OBIETTIVO
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
            const s = TrainingAlgorithm.generateConditioningSuggestions(goal, program, Storage.getProfile());
            if (s) return s;
        } catch (e) {
            console.warn('generateConditioningSuggestions', e);
        }
        const cfg = typeof CONDITIONING_BY_GOAL !== 'undefined' ? CONDITIONING_BY_GOAL[goal] : null;
        return cfg ? { enabled: cfg.frequency > 0, frequency: cfg.frequency, preferredType: cfg.preferredType, protocol: cfg.protocol } : null;
    },

    // Riga "Cardio" di Oggi (markup dell'area Oggi: #conditioning-card, -title, -subtitle)
    updateConditioningCard() {
        const card = document.getElementById('conditioning-card');
        const titleEl = document.getElementById('conditioning-title');
        const subtitleEl = document.getElementById('conditioning-subtitle');
        if (!card) return;
        const program = Storage.getActiveProgram();
        const suggestion = this._conditioningSuggestion();
        const target = suggestion?.frequency || 0;
        if (!program || !suggestion?.enabled || target <= 0) {
            card.hidden = true;
            return;
        }
        card.hidden = false;
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
        if (subtitleEl) subtitleEl.textContent = `${done} di ${target} questa settimana`;
    },

    // ========================================
    // FOGLIO: passi
    // ========================================

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
            lastTick: null,
            finalDurationSec: 0,
            finalCalories: 0
        };
    },

    openConditioningModal() {
        if (!document.getElementById('conditioning-modal')) return;
        // Un cardio in corso non si azzera: si riapre dov'era
        if (this.conditioningState.startedAt || this.conditioningState.step === 'complete') {
            this._openModal('conditioning-modal');
            return;
        }
        this._resetConditioningState();
        const suggestion = this._conditioningSuggestion();
        const target = suggestion?.frequency || 0;
        const done = Storage.getConditioningThisWeek().length;
        this._setText('conditioning-week-status', target > 0 ? `${done} di ${target} questa settimana` : `${done} questa settimana`);
        const type = String(suggestion?.preferredType || '').toLowerCase();
        const tip = target > 0 && done < target
            ? (type === 'mixed' ? (done % 2 === 0 ? 'Oggi tocca all\'HIIT' : 'Oggi tocca al LISS') : type === 'liss' ? 'Per il tuo obiettivo: LISS' : type === 'hiit' ? 'Per il tuo obiettivo: HIIT' : '')
            : '';
        this._setText('conditioning-tip', tip);
        this.showConditioningStep('1');
        this._openModal('conditioning-modal', '#choose-hiit');
    },

    openConditioning() {
        this.openConditioningModal();
    },

    async closeConditioningModal(force = false) {
        const st = this.conditioningState;
        const label = st.type === 'liss' ? 'il LISS' : 'l\'HIIT';
        if (!force) {
            if (st.step === 'active' && st.startedAt) {
                const min = Math.max(1, Math.round((Date.now() - st.startedAt) / 60000));
                const ok = await this.confirmSheet({ title: `Interrompere ${label}?`, text: `${min} min non salvati.`, ok: 'Interrompi senza salvare', cancel: 'Continua', danger: true });
                if (!ok) return;
            } else if (st.step === 'complete') {
                const ok = await this.confirmSheet({ title: 'Chiudere senza salvare?', text: `${Math.max(1, Math.round((st.finalDurationSec || 60) / 60))} min di cardio non salvati.`, ok: 'Chiudi senza salvare', cancel: 'Torna al salvataggio', danger: true });
                if (!ok) return;
            }
        }
        this._stopConditioningTimer();
        this.conditioningState.startedAt = null;
        this.conditioningState.step = '1';
        if (!this.activeWorkout) this._safe(() => this._setKeepAwake(false));
        this._closeModal('conditioning-modal');
    },

    showConditioningStep(stepId) {
        document.querySelectorAll('#conditioning-modal .conditioning-step').forEach(s => { s.hidden = true; });
        const step = document.getElementById(`conditioning-step-${stepId}`);
        if (step) step.hidden = false;
        this.conditioningState.step = stepId;
        const back = document.getElementById('conditioning-back');
        if (back) back.hidden = !(stepId === 'hiit' || stepId === 'liss');
        const titles = { 1: 'Cardio', hiit: 'HIIT', liss: 'LISS', complete: 'Cardio fatto' };
        if (titles[stepId]) this._setText('conditioning-title-sheet', titles[stepId]);
        const sheet = document.querySelector('#conditioning-modal .sheet');
        if (sheet) sheet.scrollTop = 0;
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
            this._focusFirst(document.getElementById('conditioning-step-hiit'), '[data-protocol][aria-checked="true"]');
        } else {
            st.protocol = null;
            this.showConditioningStep('liss');
            this.populateLISSActivities();
            this.updateLISSInfo();
            this._focusFirst(document.getElementById('conditioning-step-liss'), '[data-activity]');
        }
    },

    _recommendedProtocolKey() {
        if (typeof HIIT_PROTOCOLS === 'undefined') return null;
        const keys = Object.keys(HIIT_PROTOCOLS);
        if (!keys.length) return null;
        const suggestion = this._conditioningSuggestion();
        let key = typeof suggestion?.protocol === 'string' ? suggestion.protocol : null;
        if (!key && suggestion?.protocol?.name) key = keys.find(k => HIIT_PROTOCOLS[k].name === suggestion.protocol.name) || null;
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
            const work = p.work ?? p.workTime;
            const rest = p.rest ?? p.restTime;
            const giri = p.order === 'emom' ? `${p.intervals || p.rounds} minuti` : p.order === 'block' ? `${p.rounds} giri per esercizio` : `${p.rounds} giri`;
            return `<button type="button" class="choice cd-proto" role="radio" aria-checked="${key === st.protocol}" data-protocol="${GT.esc(key)}">
                    <span class="choice__body"><b>${GT.esc(p.name || key)}</b><span><span class="num">${GT.esc(work)}</span> s lavoro · <span class="num">${GT.esc(rest)}</span> s recupero · ${GT.esc(giri)}</span></span>
                    <span class="choice__mark">${this.ico('check')}</span>
                </button>`;
        }).join('');
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
        const st = this.conditioningState;
        const minutes = Math.max(1, Math.round(plan.totalSec / 60));
        const meta = document.getElementById('hiit-meta');
        if (meta) meta.innerHTML = `<span class="num">~${minutes}</span> min · <span class="num">~${this._estimateCalories('hiit', minutes)}</span> kcal`;
        const want = plan.p.exercisesCount || 4;
        const count = document.getElementById('hiit-ex-count');
        if (count) count.innerHTML = `<span class="num">${st.exercises.length}</span> scelti · consigliati <span class="num">${want}</span>`;
    },

    updateLISSInfo() {
        const st = this.conditioningState;
        const a = typeof LISS_ACTIVITIES !== 'undefined' ? LISS_ACTIVITIES[st.lissActivity] : null;
        const cfg = typeof CONDITIONING_BY_GOAL !== 'undefined' ? CONDITIONING_BY_GOAL[this._conditioningGoal()] : null;
        const minutes = cfg?.lissDuration || cfg?.duration || 25;
        const meta = document.getElementById('liss-meta');
        if (meta) meta.innerHTML = a ? `<span class="num">${minutes}</span> min · <span class="num">~${this._estimateCalories('liss', minutes)}</span> kcal` : `Consigliati <span class="num">${minutes}</span> min a ritmo costante`;
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
        container.innerHTML = list.map(ex => `<li>
                <button type="button" class="row cd-ex" aria-pressed="${st.exercises.includes(ex.id)}" data-exercise-id="${GT.esc(ex.id)}">
                    ${this._thumbHTML(ex.gifUrl, 'bolt', ' thumb--sm')}
                    <span class="row__body"><span class="row__title">${GT.esc(ex.name)}</span><span class="row__sub">${GT.esc(this.formatDifficulty(ex.difficulty))}</span></span>
                    <span class="choice__mark">${this.ico('check')}</span>
                </button></li>`).join('');
        this._bindThumbFallback(container);
    },

    formatDifficulty(difficulty) {
        return { beginner: 'Facile', intermediate: 'Medio', advanced: 'Avanzato' }[difficulty] || difficulty || '';
    },

    populateLISSActivities() {
        const container = document.getElementById('liss-activities-list');
        if (!container || typeof LISS_ACTIVITIES === 'undefined') return;
        const st = this.conditioningState;
        container.innerHTML = Object.entries(LISS_ACTIVITIES).map(([id, a]) => `
            <button type="button" class="choice" role="radio" aria-checked="${st.lissActivity === id}" data-activity="${GT.esc(id)}">
                <span class="choice__icon">${this.getLissIcon(id)}</span>
                <span class="choice__body"><b>${GT.esc(a.name)}</b></span>
                <span class="choice__mark">${this.ico('check')}</span>
            </button>`).join('');
    },

    getLissIcon(activityId) {
        // Icone dello sprite (niente emoji): camminate e scale = passi, il resto = cuore
        const icons = { 'walking-incline': 'steps', 'outdoor-walk': 'steps', 'stair-climber': 'steps' };
        return this.ico(icons[activityId] || 'heart');
    },

    // ========================================
    // SESSIONE A TEMPO
    // ========================================

    startConditioningSession() {
        const st = this.conditioningState;
        st.startedAt = Date.now();
        st.lastCue = null;
        st.lastTick = null;
        this.showConditioningStep('active');
        this._setText('conditioning-title-sheet', st.type === 'hiit'
            ? `HIIT · ${this._hiitPlan()?.p.name || ''}`
            : `LISS · ${(typeof LISS_ACTIVITIES !== 'undefined' && LISS_ACTIVITIES[st.lissActivity]?.name) || ''}`);
        this.updateConditioningActiveInfo();
        const box = document.getElementById('conditioning-interval');
        if (box) {
            box.classList.remove('is-work', 'is-rest', 'is-done');
            box.classList.toggle('is-liss', st.type !== 'hiit');
        }
        this._safe(() => this._setKeepAwake(true));
        this._stopConditioningTimer();
        this._conditioningTick();
        st.timerInterval = setInterval(() => this._conditioningTick(), 250);
        this._focusFirst(document.getElementById('conditioning-step-active'), '#end-conditioning-btn');
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
        const clock = elapsed >= 3600 ? this._fmtClock(elapsed) : `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;
        this._setText('conditioning-timer', clock);
        if (st.type === 'hiit') this._renderHiitInterval(elapsed);
        else {
            // LISS: il numero grande è il tempo che passa
            this._setText('conditioning-interval-phase', 'In corso');
            this._setText('conditioning-interval-time', clock);
            this._setText('conditioning-interval-round', '');
        }
    },

    _renderHiitInterval(elapsed) {
        const st = this.conditioningState;
        const plan = this._hiitPlan();
        const box = document.getElementById('conditioning-interval');
        const fill = document.getElementById('conditioning-interval-fill');
        if (!plan || !box) return;

        const cycle = plan.work + plan.rest;
        const idx = Math.floor(elapsed / cycle);
        const exIndexAt = (k) => plan.isBlock ? Math.floor(k / plan.rounds) % plan.n : k % plan.n;
        const rounds = plan.isEmom ? plan.intervals : plan.rounds;

        if (idx >= plan.intervals) {
            if (st.lastCue !== 'done') {
                st.lastCue = 'done';
                this._cue('done');
                box.classList.remove('is-work', 'is-rest', 'is-last');
                box.classList.add('is-done');
                this._setText('conditioning-interval-phase', 'Fatto');
                this._setText('conditioning-interval-time', 'Fine');
                this._setText('conditioning-interval-round', `Giro ${rounds} di ${rounds}`);
                if (fill) fill.style.setProperty('--p', '100%');
                const now = document.getElementById('hiit-current-exercise');
                if (now) { now.dataset.current = ''; now.innerHTML = '<p class="cd-now__name">Tocca Termina e salva</p>'; }
            }
            return;
        }

        const within = elapsed - idx * cycle;
        const isWork = within < plan.work;
        const remaining = isWork ? plan.work - within : cycle - within;
        const total = isWork ? plan.work : plan.rest;
        const round = plan.isEmom ? idx + 1 : plan.isBlock ? (idx % plan.rounds) + 1 : Math.floor(idx / plan.n) + 1;

        // Segnali: inizio lavoro, inizio recupero, 3-2-1 prima di ripartire.
        // In recupero si vede già l'esercizio che viene dopo.
        const cueKey = `${idx}-${isWork ? 'w' : 'r'}`;
        if (st.lastCue !== cueKey) {
            st.lastCue = cueKey;
            this._cue(isWork ? 'work' : 'rest');
            const nextIdx = isWork ? idx : Math.min(idx + 1, plan.intervals - 1);
            this._showHiitExercise(st.exercises[exIndexAt(nextIdx)], !isWork && idx + 1 < plan.intervals);
            const t = document.getElementById('conditioning-interval-time');
            if (t) t.setAttribute('aria-label', `${isWork ? 'Lavoro' : 'Recupero'}: ${total} secondi`);
        } else if (!isWork && remaining <= 3 && remaining > 0 && st.lastTick !== `${cueKey}-${remaining}`) {
            st.lastTick = `${cueKey}-${remaining}`;
            this._cue('tick');
        }

        box.classList.remove('is-done');
        box.classList.toggle('is-work', isWork);
        box.classList.toggle('is-rest', !isWork);
        box.classList.toggle('is-last', !isWork && remaining <= 3);
        this._setText('conditioning-interval-phase', isWork ? 'Lavoro' : 'Recupero');
        this._setText('conditioning-interval-time', this._fmtSec(remaining));
        this._setText('conditioning-interval-round', plan.isEmom ? `Minuto ${round} di ${rounds}` : `Giro ${round} di ${rounds}`);
        if (fill) fill.style.setProperty('--p', `${Math.max(0, Math.min(100, (remaining / Math.max(1, total)) * 100))}%`);
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
        const box = document.getElementById('conditioning-active-info');
        if (!box) return;
        if (st.type === 'hiit') {
            box.innerHTML = '<div class="cd-now__ex" id="hiit-current-exercise"></div>';
            this._showHiitExercise(st.exercises[0]);
        } else {
            const a = typeof LISS_ACTIVITIES !== 'undefined' ? LISS_ACTIVITIES[st.lissActivity] : null;
            box.innerHTML = `<div class="cd-now__ex">
                    <span class="thumb thumb--md thumb--ico">${this.getLissIcon(st.lissActivity)}</span>
                    <span class="cd-now__body"><b class="cd-now__name">${GT.esc(a?.name || 'Cardio leggero')}</b>
                    <span class="cd-now__desc">${GT.esc(a?.description || 'Ritmo costante e moderato')}</span></span>
                </div>`;
        }
    },

    // GIF e nome dell'esercizio HIIT in corso (si cambia solo quando cambia esercizio)
    _showHiitExercise(id, isNext = false) {
        const box = document.getElementById('hiit-current-exercise');
        const ex = typeof HIIT_EXERCISES !== 'undefined' ? HIIT_EXERCISES[id] : null;
        if (!box || !ex) return;
        const key = `${id}|${isNext}`;
        if (box.dataset.current === key) return;
        const sameGif = box.dataset.current?.split('|')[0] === id;
        box.dataset.current = key;
        const title = `<span class="cd-now__label">${isNext ? 'Poi' : 'Adesso'}</span><b class="cd-now__name">${GT.esc(ex.name)}</b>`;
        const head = box.querySelector('.cd-now__head');
        if (sameGif && head) {
            head.innerHTML = title;   // stessa GIF: non si ricarica
            return;
        }
        box.innerHTML = `
            ${this._thumbHTML(ex.gifUrl, 'bolt', ' thumb--lg')}
            <span class="cd-now__body"><span class="cd-now__head">${title}</span>
            <span class="cd-now__desc">${GT.esc(ex.description || '')}</span></span>`;
        this._bindThumbFallback(box);
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
        if (!this.activeWorkout) this._safe(() => this._setKeepAwake(false));
        const durationSec = Math.max(1, Math.round((Date.now() - st.startedAt) / 1000));
        const minutes = Math.max(1, Math.round(durationSec / 60));
        st.finalDurationSec = durationSec;
        st.finalCalories = this._estimateCalories(st.type, durationSec / 60);
        st.startedAt = null;

        const dur = document.getElementById('summary-duration');
        if (dur) dur.innerHTML = `${minutes}<small>min</small>`;
        const cal = document.getElementById('summary-calories');
        if (cal) cal.innerHTML = `${st.finalCalories}<small>kcal</small>`;
        this._setText('cd-done-title', `${st.type === 'liss' ? 'LISS' : 'HIIT'} fatto`);
        const manual = document.getElementById('manual-calories');
        if (manual) manual.value = '';
        const notes = document.getElementById('conditioning-notes');
        if (notes) notes.value = '';
        this.showConditioningStep('complete');
        this._focusFirst(document.getElementById('conditioning-step-complete'), '#save-conditioning-btn');
    },

    saveConditioningSession() {
        const st = this.conditioningState;
        const manualRaw = Math.round(GT.num(document.getElementById('manual-calories')?.value));
        const manualCalories = manualRaw > 0 && manualRaw < 5000 ? manualRaw : null;
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
            this.showNotification('Cardio NON salvato: memoria piena', 'error');
            return;
        }
        this.showNotification(`${isHiit ? 'HIIT' : 'LISS'} salvato · ${session.duration} min`, 'success', { icon: isHiit ? 'bolt' : 'steps' });
        this.closeConditioningModal(true);
        this._resetConditioningState();
        this._safe(() => this.loadDashboard());
        this._safe(() => this.loadProgress());
    },
});
