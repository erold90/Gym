/**
 * GymTracker 2.0 — area OGGI: la seduta di oggi, settimana, ciclo, costanza, ultima seduta,
 * cardio, promemoria del backup, scarico anticipato; foglio "scegli il giorno" (con "Ho poco
 * tempo"); proposte dopo la seduta (settimana, scarico, fine ciclo con rotazione);
 * PRIMO AVVIO (#onboarding, 4 passi) che crea profilo e scheda e serve anche per "Rigenera".
 */

Object.assign(App, {
    // ========================================
    // GUSCIO DELL'AREA
    // ========================================

    // Pagina #oggi: struttura fissa, i contenuti li riempie loadDashboard()
    htmlOggi() {
        return `
            <div class="wide">
                <div class="col">
                    <section class="today" id="quick-action" aria-labelledby="quick-action-title">
                        <button type="button" class="oggi-now" id="oggi-now" hidden>
                            <span class="oggi-now__ico">${this.ico('pill')}</span>
                            <span class="oggi-now__txt" id="oggi-now-txt"></span>
                            <span class="oggi-now__mark">${this.ico('check')}</span>
                        </button>
                        <div class="today__eyebrow"><span class="cap" id="today-date"></span></div>
                        <div>
                            <h1 class="today__name" id="quick-action-title">Oggi</h1>
                            <p class="today__focus" id="quick-action-subtitle"></p>
                            <div class="today__time" id="oggi-time" hidden></div>
                        </div>
                        <p class="today__meta muted" id="today-meta"></p>
                        <ul class="thumbs" id="today-thumbs" aria-label="Primi esercizi"></ul>
                    </section>

                    <div class="empty oggi-empty" id="oggi-empty" hidden>
                        <span class="empty__icon">${this.ico('plan', 'ico--xl')}</span>
                        <h1 class="oggi-empty__title">Nessuna scheda</h1>
                        <p>Quattro domande e la crei.</p>
                    </div>

                    <div class="dock" role="region" aria-label="Seduta di oggi">
                        <div class="dock__row">
                            <button type="button" class="btn btn--primary btn--xl" id="quick-start-btn">${this.ico('play')}<span id="quick-start-label">Inizia</span></button>
                            <button type="button" class="btn btn--secondary btn--icon btn--xl" id="quick-daypicker-btn" aria-label="Scegli un altro giorno">${this.ico('calendar')}</button>
                        </div>
                        <div class="oggi-short" id="oggi-short" hidden>
                            <span class="oggi-short__label" id="oggi-short-l">${this.ico('clock', 'ico--sm')}Poco tempo</span>
                            ${[30, 40, 45].map(m => `<button type="button" class="chip oggi-short__chip" aria-pressed="false" data-oggi-min="${m}" aria-describedby="oggi-short-l"><span class="num">${m}</span>min</button>`).join('')}
                        </div>
                    </div>

                    <section class="section" id="oggi-week" aria-labelledby="oggi-week-title">
                        <div class="section__head">
                            <h2 id="oggi-week-title">Settimana</h2>
                            <span class="muted" id="weekly-workout-count"></span>
                        </div>
                        <ol class="week" id="week-days"></ol>
                    </section>
                </div>

                <div class="col">
                    <div class="notice notice--deload" id="oggi-deload" role="status" hidden>
                        ${this.ico('deload')}
                        <p id="oggi-deload-text"></p>
                        <button type="button" class="btn btn--ghost btn--icon btn--sm" id="oggi-deload-no" aria-label="Non ora: niente scarico anticipato">${this.ico('close')}</button>
                        <button type="button" class="btn btn--secondary btn--sm" id="oggi-deload-yes">Inizia lo scarico</button>
                    </div>

                    <section class="section" id="oggi-cycle" aria-labelledby="oggi-cycle-title" hidden>
                        <div class="section__head">
                            <span class="head-help"><h2 id="oggi-cycle-title">Ciclo</h2>${this._helpBtn('ciclo', 'Cosa sono ciclo, fasi e RIR')}</span>
                            <span class="phase" id="oggi-cycle-phase"></span>
                        </div>
                        <div class="meso" id="oggi-meso" role="img"></div>
                        <p class="muted oggi-note" id="oggi-cycle-note"></p>
                        <button type="button" class="btn btn--secondary btn--block" id="oggi-cycle-close" hidden>${this.ico('cycle')}Chiudi il ciclo</button>
                    </section>

                    <section class="section" id="oggi-streak" aria-labelledby="oggi-streak-title">
                        <div class="section__head">
                            <h2 id="oggi-streak-title">Costanza</h2>
                            <a class="link" href="#progressi" data-page="progressi">Storico${this.ico('next', 'ico--sm')}</a>
                        </div>
                        <div id="oggi-streak-body"></div>
                    </section>

                    <div class="group" id="oggi-rows">
                        <button type="button" class="row" id="oggi-last" hidden>
                            <span class="row__icon">${this.ico('check')}</span>
                            <span class="row__body"><span class="row__title" id="oggi-last-title"></span><span class="row__sub" id="oggi-last-sub"></span></span>
                            <span class="row__end">${this.ico('next')}</span>
                        </button>
                        <div class="row" id="conditioning-card" hidden>
                            <span class="row__icon" id="conditioning-icon">${this.ico('steps')}</span>
                            <span class="row__body">
                                <span class="row__title" id="conditioning-title">Cardio</span>
                                <span class="row__sub" id="conditioning-subtitle"></span>
                            </span>
                            <button type="button" class="btn btn--secondary btn--sm" id="conditioning-btn" data-action="cardio">Inizia</button>
                            <span class="oggi-cd-note" id="conditioning-note" hidden></span>
                        </div>
                        <button type="button" class="row" id="oggi-supp" hidden>
                            <span class="row__icon">${this.ico('pill')}</span>
                            <span class="row__body"><span class="row__title" id="oggi-supp-title">Integratori</span><span class="row__sub" id="oggi-supp-sub"></span></span>
                            <span class="row__end">${this.ico('next')}</span>
                        </button>
                    </div>

                    <div class="notice" id="oggi-backup" role="status" hidden>
                        ${this.ico('shield')}
                        <p><span id="oggi-backup-text"></span><small>I dati stanno solo su questo telefono</small></p>
                        <button type="button" class="btn btn--secondary btn--sm" id="oggi-backup-btn">Salva</button>
                    </div>
                </div>
            </div>
        `;
    },

    // Foglio "Quale seduta?": giorni della scheda, "Ho poco tempo", seduta libera
    sheetsOggi() {
        return `
            <div class="modal" id="day-picker-modal">
                <section class="sheet og-sheet" role="dialog" aria-modal="true" aria-labelledby="day-picker-title">
                    <span class="sheet__grip" aria-hidden="true"></span>
                    <div class="sheet__head">
                        <h2 id="day-picker-title">Quale seduta?</h2>
                        <button type="button" class="btn btn--ghost btn--icon sheet__close" id="day-picker-close" aria-label="Chiudi la scelta del giorno">${this.ico('close')}</button>
                    </div>
                    <div class="dp-short">
                        <span class="label dp-short__label" id="dp-short-label">${this.ico('clock', 'ico--sm')}Ho poco tempo</span>
                        <div class="seg" role="group" aria-labelledby="dp-short-label" id="day-picker-short">
                            <button type="button" aria-pressed="false" data-min="30"><span class="num">30</span>min</button>
                            <button type="button" aria-pressed="false" data-min="40"><span class="num">40</span>min</button>
                            <button type="button" aria-pressed="false" data-min="45"><span class="num">45</span>min</button>
                        </div>
                    </div>
                    <div id="day-picker-list" class="choices dp-list"></div>
                    <button type="button" class="btn btn--ghost btn--block" id="day-picker-free">${this.ico('dumbbell')}Seduta libera</button>
                </section>
            </div>
        `;
    },

    bindOggi() {
        const on = (id, ev, fn) => this._on(id, ev, fn);
        on('quick-start-btn', 'click', () => this._oggiQuickStart());
        on('quick-daypicker-btn', 'click', () => this.startScheduledWorkout());
        // "Poco tempo" sotto Inizia: 30 · 40 · 45 min (secondo tocco = toglie)
        on('oggi-short', 'click', (e) => {
            const chip = e.target.closest('[data-oggi-min]');
            if (!chip) return;
            const min = parseInt(chip.dataset.oggiMin, 10);
            this._oggiMin = this._oggiMin === min ? null : min;
            this._safe(() => this.updateQuickAction());
        });

        // Foglio del giorno
        this._closeOnBackdrop('day-picker-modal', () => this.closeDayPicker());
        on('day-picker-close', 'click', () => this.closeDayPicker());
        on('day-picker-free', 'click', () => {
            this.closeDayPicker();
            this.startFreeWorkout();
        });
        on('day-picker-list', 'click', (e) => {
            const item = e.target.closest('[data-day]');
            if (item && !item.disabled) this.selectWorkoutDay(parseInt(item.dataset.day, 10));
        });
        on('day-picker-short', 'click', (e) => {
            const btn = e.target.closest('[data-min]');
            if (!btn) return;
            const min = parseInt(btn.dataset.min, 10);
            this._dpMinutes = this._dpMinutes === min ? null : min;
            this._renderDayPickerList();
        });

        // Righe e avvisi
        on('oggi-last', 'click', () => {
            const id = document.getElementById('oggi-last')?.dataset.workoutId;
            if (id && typeof this.showWorkoutDetail === 'function') this.showWorkoutDetail(id);
            else this.navigateTo('progressi');
        });
        on('oggi-backup-btn', 'click', () => this._oggiOpenBackup());
        on('oggi-supp', 'click', () => this._oggiSuppOpen());
        on('oggi-time', 'click', (e) => this._oggiTimeClick(e));
        on('oggi-now', 'click', () => this._oggiNowTake());
        // Di ritorno nell'app: la riga "Adesso" segue l'ora
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && this.currentPage === 'oggi') this._safe(() => this._oggiNowRow());
        });
        on('oggi-deload-yes', 'click', () => this._oggiAcceptEarly());
        on('oggi-deload-no', 'click', () => this._oggiDismissEarly());
        on('oggi-cycle-close', 'click', () => {
            this._cycleSummaryDismissed = false;
            this.completeCycleWithSummary();
        });

        // Miniature: GIF che non arriva (offline, 404) → icona dell'attrezzo
        ['page-oggi', 'page-scheda', 'sheets'].forEach(id => {
            document.getElementById(id)?.addEventListener('error', (e) => this._oggiThumbFallback(e.target), true);
        });

        this.bindOnboarding();

        // Primo avvio: senza nome o senza scheda si apre da solo (dopo che il core ha scelto la pagina)
        setTimeout(() => this._safe(() => this._oggiBootCheck()), 0);
    },

    // Ogni volta che si apre Oggi: dati aggiornati ("Poco tempo" riparte da zero)
    enterOggi() {
        this._oggiMin = null;
        this.loadDashboard();
    },

    // ========================================
    // OGGI
    // ========================================

    // Si disegna solo se Oggi è aperta: le altre aree la chiamano dopo un salvataggio, ma se Oggi
    // non si vede il lavoro lo fa enterOggi alla prossima apertura (R1-10)
    loadDashboard() {
        if (this.currentPage !== 'oggi') return;
        [
            () => this.syncAppState(),
            () => this.updateQuickAction(),
            () => this.updateWeekDays(),
            () => this.updateCycleCard(),
            () => this.updateStats(),
            () => this.updateRecentActivity(),
            () => this.updateOggiConditioning(),
            () => this._oggiSuppRow(),
            () => this._oggiNowRow(),
            () => this.updateBackupReminder(),
            () => this.updateEarlyDeload(),
            () => this._maybePromptCycleEnd()
        ].forEach(fn => this._safe(fn));
    },

    // Rientro dopo una pausa e settimana del ciclo dal calendario (idempotente: anche all'avvio)
    syncAppState() {
        this._safe(() => this.checkReturnFromLayoff());
        this._safe(() => this.syncCycleWeekWithCalendar());
    },

    // "Venerdì 16 ottobre"
    _oggiTodayLabel(d = new Date()) {
        const s = d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
        return s.charAt(0).toUpperCase() + s.slice(1);
    },

    // Focus del giorno in una riga: "Quadricipiti & Glutei" → "Quadricipiti e glutei"
    _oggiFocus(day) {
        let s = String(day?.focus || '').trim();
        if (!s || s === day?.type || s === day?.name) return '';
        s = s.replace(/\s*&\s*/g, ' e ');
        return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
    },

    _oggiSupersetCount(day) {
        return new Set((day?.exercises || []).filter(e => e && e.supersetGroup).map(e => e.supersetGroup)).size;
    },

    // Riquadro della seduta di oggi + dock (lo richiamano anche la seduta e la scheda).
    // Stati: seduta in corso · nessuna scheda · seduta libera · fatto oggi (R2-05) · riposo (giorni fissi) · da fare
    updateQuickAction() {
        const titleEl = document.getElementById('quick-action-title');
        const btn = document.getElementById('quick-start-btn');
        if (!titleEl || !btn) return;
        const today = document.getElementById('quick-action');
        const empty = document.getElementById('oggi-empty');
        const picker = document.getElementById('quick-daypicker-btn');
        const focusEl = document.getElementById('quick-action-subtitle');
        const metaEl = document.getElementById('today-meta');
        const thumbsEl = document.getElementById('today-thumbs');
        const short = document.getElementById('oggi-short');
        const setBtn = (icon, label, primary = true) => {
            btn.innerHTML = `${icon ? this.ico(icon) : ''}<span id="quick-start-label">${GT.esc(label)}</span>`;
            btn.classList.toggle('btn--primary', primary);
            btn.classList.toggle('btn--secondary', !primary);
        };
        this._setText('today-date', this._oggiTodayLabel());
        titleEl.classList.remove('today__name--done');
        focusEl.hidden = false;
        today.hidden = false;
        empty.hidden = true;
        picker.hidden = false;
        if (short) short.hidden = true;
        this._oggiTimeLine(false);
        this._quickWorkoutId = null;

        // Sessione in corso: il dock la riprende
        if (this.activeWorkout) {
            const w = this.activeWorkout;
            const done = typeof this._completedSetsCount === 'function' ? this._completedSetsCount() : 0;
            const min = Math.max(0, Math.round((Date.now() - (w.startTime || Date.now())) / 60000));
            titleEl.textContent = w.name || 'Seduta';
            focusEl.textContent = 'In corso';
            metaEl.innerHTML = `<span class="num">${done}</span>&nbsp;${done === 1 ? 'serie fatta' : 'serie fatte'} · <span class="num">${min}</span>&nbsp;min`;
            thumbsEl.innerHTML = this._oggiThumbs(w.exercises || []);
            setBtn('play', `Riprendi ${w.name || 'la seduta'}`);
            picker.hidden = true;
            this._quickAction = 'resume';
            return;
        }

        const program = Storage.getActiveProgram();
        if (!program || !program.days?.length) {
            today.hidden = true;
            empty.hidden = false;
            setBtn('plan', 'Crea la mia scheda');
            picker.hidden = true;
            this._quickAction = 'create';
            return;
        }

        const idx = this.getSuggestedDayIndex(program);
        const day = program.days[idx];
        if (!day || !day.exercises?.length) {
            titleEl.textContent = 'Seduta libera';
            focusEl.textContent = 'Scegli tu gli esercizi';
            metaEl.textContent = '';
            thumbsEl.innerHTML = '';
            setBtn('dumbbell', 'Seduta libera');
            this._quickAction = 'free';
            return;
        }
        const dayName = day.type || day.name || `Giorno ${idx + 1}`;
        this._quickDayIndex = idx;

        // Fatta la seduta di oggi: niente "Inizia" in evidenza, si vede quando tocca la prossima (R2-05)
        const doneToday = this._oggiDoneToday();
        const td = this._trainingDays();
        const restDay = td.length > 0 && !td.includes(this._isoWeekday());
        if (doneToday || restDay) {
            const next = this._oggiNextWhen(program, td);
            titleEl.innerHTML = doneToday
                ? `<span class="today__ok">${this.ico('check')}</span>Fatto oggi`
                : 'Riposo';
            titleEl.classList.toggle('today__name--done', !!doneToday);
            focusEl.textContent = `Prossima: ${dayName}, ${next.label}`;
            thumbsEl.innerHTML = '';
            if (doneToday) {
                const w = doneToday;
                const min = Math.round((Number(w.duration) || 0) / 60);
                const prs = this._oggiRealPRs(w);
                metaEl.innerHTML = [
                    GT.esc(w.name || w.type || 'Seduta'),
                    min > 0 ? `<span class="num">${min}</span>&nbsp;min` : '',
                    prs ? `<span class="oggi-accent"><span class="num">${prs}</span>&nbsp;record</span>` : ''
                ].filter(Boolean).join(' · ');
                this._quickWorkoutId = w.id != null ? String(w.id) : null;
                setBtn('', `Vedi ${w.name || w.type || 'la seduta'}`, false);
                btn.setAttribute('aria-label', `Dettaglio di ${w.name || w.type || 'la seduta'} di oggi`);
                this._quickAction = 'detail';
            } else {
                metaEl.textContent = '';
                // Il riposo è il piano, ma si può sempre allenarsi lo stesso
                setBtn('play', `Inizia ${dayName}`, false);
                btn.removeAttribute('aria-label');
                this._quickAction = 'start';
            }
            return;
        }
        btn.removeAttribute('aria-label');

        // Seduta di oggi; con "Poco tempo" la stima è quella della seduta compressa
        const phased = this._applyPhase(day);
        let duration = this._estimateDuration(phased, program);
        let n = day.exercises.length;
        let shown = day.exercises;
        let warn = '';
        const minutes = this._oggiMin || null;
        if (minutes && typeof TrainingAlgorithm.compressDay === 'function') {
            try {
                const md = program.metadata || {};
                const c = TrainingAlgorithm.compressDay(phased, minutes, { goal: md.goal || day.goal, emphasis: Storage.getProfile().emphasis || '', warmupMin: day.warmupMin });
                if (c && Number.isFinite(c.estimatedMinutes)) duration = c.estimatedMinutes;
                const exs = c?.day?.exercises || c?.exercises;
                if (Array.isArray(exs) && exs.length) { n = exs.length; shown = exs; }
                if (c && c.fits === false) warn = `non sta in <span class="num">${minutes}</span>`;
            } catch (e) {
                console.warn('compressDay', e);
            }
        }
        const ss = this._oggiSupersetCount(day);
        titleEl.textContent = dayName;
        focusEl.textContent = this._oggiFocus(day);
        focusEl.hidden = !focusEl.textContent;
        metaEl.innerHTML = [
            `<span class="num">${n}</span>&nbsp;${n === 1 ? 'esercizio' : 'esercizi'}`,
            duration ? `<span class="num">~${duration}</span>&nbsp;min` : '',
            warn ? `<span class="dp-warn">${warn}</span>` : '',
            ss && !minutes ? `${ss} superset` : ''
        ].filter(Boolean).join(' · ');
        thumbsEl.innerHTML = this._oggiThumbs(shown);
        setBtn('play', `Inizia ${dayName}`);
        if (short) {
            short.hidden = false;
            short.querySelectorAll('[data-oggi-min]').forEach(c => c.setAttribute('aria-pressed', String(parseInt(c.dataset.oggiMin, 10) === minutes)));
        }
        this._oggiTimeLine(true);
        this._quickAction = 'start';
    },

    _oggiQuickStart() {
        const action = this._quickAction;
        if (this.activeWorkout || action === 'resume') {
            if (this.activeWorkout) this.navigateTo('seduta');
            return;
        }
        if (action === 'create') {
            this.openOnboarding();
            return;
        }
        if (action === 'free') {
            this.startFreeWorkout();
            return;
        }
        if (action === 'detail') {
            if (this._quickWorkoutId && typeof this.showWorkoutDetail === 'function') this.showWorkoutDetail(this._quickWorkoutId);
            else this.navigateTo('progressi');
            return;
        }
        const program = Storage.getActiveProgram();
        const idx = this.getSuggestedDayIndex(program);
        if (program?.days?.[idx]?.exercises?.length) {
            const minutes = this._oggiMin || null;
            this.startWorkout(program.days[idx], minutes ? { dayIndex: idx, minutes } : { dayIndex: idx });
        } else this.startScheduledWorkout();
    },

    // Seduta salvata oggi (la più recente), o null
    _oggiDoneToday() {
        const key = GT.dateKey(new Date());
        return Storage.getRecentWorkouts(5).find(w => w && GT.dateKey(new Date(w.date)) === key) || null;
    },

    // Record veri di una seduta (i flag isNewPR della v1.25 erano gonfiati: R1-13)
    _oggiRealPRs(w) {
        if (typeof Storage.countRealPRs === 'function') {
            const n = this._safe(() => Storage.countRealPRs([w]));
            if (Number.isFinite(n)) return n;
        }
        let prs = 0;
        (w.exercises || []).forEach(ex => (ex?.sets || []).forEach(st => { if (st?.isNewPR && st.completed !== false) prs++; }));
        return prs;
    },

    /**
     * Quando tocca la prossima seduta (da domani): con i giorni fissi il primo giorno fisso, senza il
     * primo giorno previsto della settimana (o lunedì). → {days, label: 'domani' | 'giovedì' | 'lunedì prossimo'}
     */
    _oggiNextWhen(program, td = this._trainingDays()) {
        const now = new Date();
        const wd = this._isoWeekday(now);
        let k = 0;
        if (td.length) {
            for (let i = 1; i <= 7; i++) {
                const d = ((wd - 1 + i) % 7) + 1;
                if (td.includes(d)) { k = i; break; }
            }
        } else {
            const plan = this._oggiWeekPlan(program);
            const after = [...plan.planned].filter(o => o > plan.todayOffset).sort((a, b) => a - b);
            k = after.length ? after[0] - plan.todayOffset : 7 - plan.todayOffset;
        }
        k = Math.max(1, k || 1);
        const date = GT.addDays(GT.startOfDay(now), k);
        const n = this._isoWeekday(date);
        let label = this._weekdayName(n);
        if (k === 1) label = 'domani';
        else if (k >= 7) label += n === 7 ? ' prossima' : ' prossimo';
        return { days: k, date, label };
    },

    // Miniature dei primi 4 esercizi + "+N"
    _oggiThumbs(exercises) {
        const list = (exercises || []).filter(e => e && e.exerciseId);
        const shown = list.slice(0, 4).map(ex => `<li class="thumb">${this._oggiThumb(ex.exerciseId, ex.name || EXERCISES_DB[ex.exerciseId]?.name || '')}</li>`).join('');
        const more = list.length - 4;
        return shown + (more > 0 ? `<li class="more-thumbs"><span class="num" aria-hidden="true">+${more}</span><span class="sr-only">altri ${more}</span></li>` : '');
    },

    // Icona dell'attrezzo principale (ripiego delle GIF)
    _oggiEquipIcon(exerciseId) {
        const eq = EXERCISES_DB[exerciseId]?.equipment || [];
        if (eq.includes('bilanciere')) return 'barbell';
        if (eq.includes('manubri')) return 'dumbbell';
        if (eq.includes('cavi')) return 'cable';
        if (eq.includes('macchine')) return 'machine';
        if (eq.includes('sbarra')) return 'pullup';
        if (eq.includes('panca')) return 'bench';
        return 'bodyweight';
    },

    // Contenuto di una .thumb: la GIF sulla lastra chiara, o l'icona dell'attrezzo
    _oggiThumb(exerciseId, alt = '') {
        let url = null;
        try { url = typeof getExerciseGif === 'function' ? getExerciseGif(exerciseId) : null; } catch (e) { url = null; }
        const icon = this._oggiEquipIcon(exerciseId);
        if (!url) return `<span class="thumb__ico" ${alt ? `role="img" aria-label="${GT.esc(alt)}"` : 'aria-hidden="true"'}>${this.ico(icon)}</span>`;
        return `<img src="${GT.esc(url)}" alt="${GT.esc(alt)}" loading="lazy" decoding="async" data-ico="${icon}">`;
    },

    _oggiThumbFallback(img) {
        if (!img || img.tagName !== 'IMG' || !img.dataset.ico || !img.parentElement) return;
        const alt = img.getAttribute('alt') || '';
        const span = document.createElement('span');
        span.className = 'thumb__ico';
        if (alt) { span.setAttribute('role', 'img'); span.setAttribute('aria-label', alt); } else span.setAttribute('aria-hidden', 'true');
        span.innerHTML = this.ico(img.dataset.ico);
        img.replaceWith(span);
    },

    /**
     * Piano della settimana (lunedì = 0): giorni fatti, giorni previsti dopo oggi.
     * Con i giorni fissi (profile.trainingDays) i previsti sono quelli; senza, le sedute che mancano
     * distribuite sui giorni rimasti con un riposo in mezzo.
     */
    _oggiWeekPlan(program, td = this._trainingDays()) {
        const monday = GT.startOfWeek(new Date());
        const todayKey = GT.dateKey(new Date());
        const weekWorkouts = Storage.getWorkoutsThisWeek();
        const doneBy = new Map();
        weekWorkouts.forEach(w => {
            const k = GT.dateKey(new Date(w.date));
            if (!doneBy.has(k)) doneBy.set(k, []);
            doneBy.get(k).push(w.name || w.type || 'Seduta');
        });
        const target = this._oggiWeekTarget(program);
        const done = weekWorkouts.length;
        const todayOffset = (new Date().getDay() + 6) % 7;
        const todayDone = doneBy.has(todayKey);
        const planned = new Set();
        if (td.length) {
            td.forEach(d => { if (d - 1 > todayOffset) planned.add(d - 1); });
        } else {
            let remaining = Math.max(0, target - done);
            if (remaining > 0 && !todayDone) remaining--;
            const avail = 6 - todayOffset;
            if (remaining >= avail) for (let i = 1; i <= avail; i++) planned.add(todayOffset + i);
            else for (let i = 0; i < remaining; i++) planned.add(todayOffset + 1 + Math.floor((i + 1) * avail / (remaining + 1)));
        }
        return { monday, todayKey, doneBy, target, done, todayOffset, todayDone, planned };
    },

    // Settimana da lunedì a domenica: fatto ✓, oggi (anello), previsto (tratteggio), riposo (punto)
    updateWeekDays() {
        const list = document.getElementById('week-days');
        const section = document.getElementById('oggi-week');
        if (!list) return;
        const program = Storage.getActiveProgram();
        if (!program?.days?.length) {
            section.hidden = true;
            return;
        }
        section.hidden = false;

        const td = this._trainingDays();
        const plan = this._oggiWeekPlan(program, td);
        const todayRest = td.length > 0 && !td.includes(plan.todayOffset + 1);

        // Nomi dei prossimi giorni della scheda (per chi legge con lo screen reader)
        const order = [];
        let k = this.getSuggestedDayIndex(program);
        for (let i = 0; i < 7; i++) {
            const d = program.days[k % program.days.length];
            order.push(d?.type || d?.name || '');
            k++;
        }
        let nextName = 0;
        // Giorni fissi passati senza seduta: "non fatto" solo se la scheda c'era già
        const md = program.metadata || {};
        const born = new Date(md.createdAt || md.generatedAt || (Number(md.programId) > 1e12 ? Number(md.programId) : 0)).getTime() || 0;
        list.innerHTML = this.LABELS.weekdays.map(([n, name, ini], i) => {
            const key = GT.dateKey(GT.addDays(plan.monday, i));
            const isToday = key === plan.todayKey;
            const names = plan.doneBy.get(key);
            let cls = 'day--rest';
            let label = 'riposo';
            let dot = '';
            if (names) {
                cls = 'day--done';
                label = `${names.join(', ')} fatto`;
                dot = this.ico('check');
            } else if (isToday) {
                if (todayRest) label = 'oggi, riposo';
                else {
                    label = `oggi${order[nextName] ? ', ' + order[nextName] : ''}`;
                    nextName++;
                }
            } else if (plan.planned.has(i)) {
                cls = 'day--plan';
                label = `previsto${order[nextName] ? ' ' + order[nextName] : ''}`;
                nextName++;
            } else if (td.includes(n) && i < plan.todayOffset && GT.addDays(plan.monday, i + 1).getTime() > born) {
                label = 'non fatto';
            }
            return `<li class="day ${cls}${isToday ? ' day--today' : ''}"${isToday ? ' aria-current="date"' : ''}><span class="day__dot">${dot}</span><span aria-hidden="true">${ini}</span><span class="sr-only">${name}: ${GT.esc(label)}</span></li>`;
        }).join('');

        const count = document.getElementById('weekly-workout-count');
        if (count) count.innerHTML = `<b class="num oggi-strong">${plan.done}</b> di <span class="num">${plan.target}</span>`;
    },

    _oggiWeekTarget(program) {
        const n = parseInt(program?.metadata?.daysPerWeek, 10) || program?.days?.length || parseInt(Storage.getProfile().daysPerWeek, 10) || 3;
        return Math.max(1, Math.min(7, n));
    },

    // Nome storico (v1): la vecchia riga "x/4 sessioni" ora sta nella sezione Settimana
    updateWeeklyCount() {
        this.updateWeekDays();
    },

    // Costanza a settimane: serie attuale, record, colonne delle ultime 12 settimane
    updateStats() {
        const body = document.getElementById('oggi-streak-body');
        if (!body) return;
        const workouts = Storage.getWorkouts();
        if (!workouts.length) {
            body.innerHTML = '<p class="muted oggi-note">Qui le tue settimane, dalla prima seduta</p>';
            return;
        }
        const s = Storage.getStreak() || {};
        const target = Math.max(1, s.target || 1);
        const perWeek = new Map();
        workouts.forEach(w => {
            const t = new Date(w.date);
            if (isNaN(t.getTime())) return;
            const wk = GT.dateKey(GT.startOfWeek(t));
            if (!perWeek.has(wk)) perWeek.set(wk, new Set());
            perWeek.get(wk).add(GT.dateKey(t));
        });
        const monday = GT.startOfWeek(new Date());
        const counts = [];
        for (let i = 11; i >= 0; i--) counts.push((perWeek.get(GT.dateKey(GT.addDays(monday, -7 * i))) || { size: 0 }).size);
        const program = Storage.getActiveProgram();
        const scale = Math.max(this._oggiWeekTarget(program) + 1, target + 1, ...counts, 4);
        const bars = counts.map((c, i) => {
            const now = i === counts.length - 1;
            return `<i class="streak__bar${now ? ' is-now' : (c >= target ? ' is-hit' : '')}" style="--v:${(c / scale).toFixed(3)}"></i>`;
        }).join('');
        const cur = s.current || 0;
        // Prima settimana: la serie non è ancora "di fila", ma è in corso (R2-12)
        const thisWeek = counts[counts.length - 1];
        const big = cur === 0 && thisWeek > 0
            ? `${this.ico('fire', 'ico--lg oggi-fire')}1<small>settimana, in corso</small>`
            : `${this.ico('fire', 'ico--lg oggi-fire')}${cur}<small>${cur === 1 ? 'settimana di fila' : 'settimane di fila'}</small>`;
        body.innerHTML = `
            <div class="kv">
                <p class="kv__big num">${big}</p>
                ${(s.best || cur) > 0 ? `<span class="faint oggi-record">record <span class="num">${s.best || cur}</span></span>` : ''}
            </div>
            <div class="streak" style="--n:12" role="img" aria-label="Sedute nelle ultime 12 settimane, obiettivo almeno ${target}: ${counts.join(', ')} finora">
                <span class="streak__goal" style="--g:${(target / scale).toFixed(3)}"></span>${bars}
            </div>`;
    },

    // Ultima seduta: nome, quando, durata, record → dettaglio
    updateRecentActivity() {
        const row = document.getElementById('oggi-last');
        if (!row) return;
        const w = Storage.getRecentWorkouts(1)[0];
        // Fatta oggi: la apre già il dock ("Vedi …"), la riga sarebbe un doppione
        if (!w || (!this.activeWorkout && GT.dateKey(new Date(w.date)) === GT.dateKey(new Date()) && Storage.getActiveProgram()?.days?.length)) {
            row.hidden = true;
            this._syncOggiRows();
            return;
        }
        const date = new Date(w.date);
        const diff = GT.calendarDaysBetween(date, new Date());
        const inWeek = date >= GT.startOfWeek(new Date());
        let when = GT.formatRelativeDay(date);
        if (inWeek && diff > 1) {
            when = date.toLocaleDateString('it-IT', { weekday: 'long' });
            when = when.charAt(0).toUpperCase() + when.slice(1);
        }
        const min = Math.round((Number(w.duration) || 0) / 60);
        const prs = this._oggiRealPRs(w);
        this._setText('oggi-last-title', w.name || w.type || 'Seduta');
        const sub = document.getElementById('oggi-last-sub');
        if (sub) {
            sub.innerHTML = [
                GT.esc(when),
                min > 0 ? `<span class="num">${min}</span>&nbsp;min` : '',
                prs ? `<span class="oggi-accent"><span class="num">${prs}</span>&nbsp;record</span>` : ''
            ].filter(Boolean).join(' · ');
        }
        row.dataset.workoutId = w.id != null ? String(w.id) : '';
        row.setAttribute('aria-label', `Ultima seduta: ${w.name || w.type || 'Seduta'}, ${when}. Dettaglio`);
        row.hidden = false;
        this._syncOggiRows();
    },

    // Riga del cardio: "Cardio 0 di 3", il tipo che tocca con la sua durata, una regola in una riga (R3-14)
    updateOggiConditioning() {
        const row = document.getElementById('conditioning-card');
        if (!row) return;
        const program = Storage.getActiveProgram();
        let plan = null;
        try { plan = typeof this._cardioPlan === 'function' ? this._cardioPlan() : null; } catch (e) { plan = null; }
        if (!program || !plan || plan.target <= 0) {
            row.hidden = true;
            this._syncOggiRows();
            return;
        }
        const { done, target, next } = plan;
        const finished = done >= target || !next;
        const title = document.getElementById('conditioning-title');
        if (title) {
            title.innerHTML = finished
                ? `Cardio fatto <span class="oggi-ok">${this.ico('check', 'ico--sm')}</span>`
                : `Cardio <span class="num">${done}</span> di <span class="num">${target}</span>`;
        }
        const label = next ? next.type.toUpperCase() : '';
        const sub = document.getElementById('conditioning-subtitle');
        if (sub) {
            sub.innerHTML = finished
                ? `<span class="num">${done}</span> di <span class="num">${target}</span> questa settimana`
                : `${label} · <span class="num">${next.minutes}</span>&nbsp;min`;
        }
        const note = document.getElementById('conditioning-note');
        if (note) {
            note.textContent = finished ? '' : (plan.note || '');
            note.hidden = !note.textContent;
        }
        const icon = document.getElementById('conditioning-icon');
        if (icon) icon.innerHTML = this.ico(next && next.type === 'hiit' ? 'bolt' : 'steps');
        const btn = document.getElementById('conditioning-btn');
        if (btn) btn.setAttribute('aria-label', finished ? 'Inizia un altro cardio' : `Inizia il cardio: ${label} ${next.minutes} minuti`);
        row.style.removeProperty('display');
        row.hidden = false;
        this._syncOggiRows();
    },

    // Il gruppo delle righe sparisce se è vuoto
    _syncOggiRows() {
        const group = document.getElementById('oggi-rows');
        if (!group) return;
        group.hidden = ![...group.children].some(el => !el.hidden);
    },

    // Promemoria del backup (contratto settings.lastBackupAt, lo scrive Profilo)
    updateBackupReminder() {
        const box = document.getElementById('oggi-backup');
        if (!box) return;
        const info = this._oggiBackupState();
        if (!info) {
            box.hidden = true;
            return;
        }
        const text = document.getElementById('oggi-backup-text');
        if (text) {
            text.innerHTML = info.last
                ? `Backup di <span class="num">${info.days}</span>&nbsp;giorni fa`
                : 'Nessun backup dei dati';
        }
        box.hidden = false;
    },

    // null = nessun promemoria. Serve: ≥14 giorni dall'ultimo backup (o dalla prima seduta) e una seduta dopo
    _oggiBackupState() {
        const workouts = Storage.getWorkouts();
        if (!workouts.length) return null;
        const raw = Storage.getSettings().lastBackupAt;
        const last = raw ? new Date(raw) : null;
        const lastOk = last && !isNaN(last.getTime()) ? last : null;
        const after = lastOk ? workouts.filter(w => new Date(w.date) > lastOk) : workouts;
        if (!after.length) return null;
        const ref = lastOk || new Date(Math.min(...workouts.map(w => new Date(w.date).getTime()).filter(Number.isFinite)));
        const days = GT.calendarDaysBetween(ref, new Date());
        if (!Number.isFinite(days) || days < 14) return null;
        return { last: lastOk, days };
    },

    _oggiOpenBackup() {
        if (typeof this.openBackup === 'function') {
            this.openBackup();
            return;
        }
        this.navigateTo('profilo');
        setTimeout(() => {
            const target = document.querySelector('#pf-backup, #profilo-backup, #page-profilo .backup');
            try { target?.scrollIntoView({ block: 'start', behavior: this._scrollBehavior() }); } catch (e) { /* no-op */ }
        }, 60);
    },

    // ========================================
    // SCARICO ANTICIPATO (al massimo un avviso a settimana)
    // ========================================

    _oggiEarlySuggestion() {
        try {
            if (typeof Storage.getEarlyDeloadSuggestion === 'function') return Storage.getEarlyDeloadSuggestion();
            if (typeof TrainingAlgorithm.detectEarlyDeload === 'function') {
                return TrainingAlgorithm.detectEarlyDeload(Storage.getWorkouts(), Storage.getActiveProgram(), new Date());
            }
        } catch (e) {
            console.warn('scarico anticipato', e);
        }
        return null;
    },

    _oggiWeekKey() {
        return GT.dateKey(GT.startOfWeek(new Date()));
    },

    // Stato dell'avviso di questa settimana: null | 'shown' | 'dismissed' | 'accepted'
    _oggiEarlyState() {
        const rec = Storage.getSettings().earlyDeloadNotice;
        return rec && rec.week === this._oggiWeekKey() ? rec.state : null;
    },

    _oggiSetEarlyState(state) {
        Storage.saveSettings({ earlyDeloadNotice: { week: this._oggiWeekKey(), state } });
    },

    updateEarlyDeload() {
        const box = document.getElementById('oggi-deload');
        if (!box) return;
        box.hidden = true;
        if (!Storage.getCycleInfo() || Storage.isDeloadActive() || this.activeWorkout) return;
        const state = this._oggiEarlyState();
        if (state === 'dismissed' || state === 'accepted') return;
        const s = this._oggiEarlySuggestion();
        if (!s?.suggest) return;
        if (!state) this._oggiSetEarlyState('shown');
        const rir = (s.reasons || []).includes('rir_too_low') && !(s.reasons || []).includes('performance_drop');
        const text = document.getElementById('oggi-deload-text');
        if (text) {
            text.innerHTML = `${rir ? 'Serie più dure del previsto' : 'Prestazioni in calo'}<small>7 giorni: metà serie, carichi −10%</small>`;
        }
        box.hidden = false;
    },

    _oggiAcceptEarly() {
        if (!Storage.getCycleInfo()) return;
        if (this._save(() => Storage.startManualDeload(), 'Scarico NON salvato') === false) return;
        this._oggiSetEarlyState('accepted');
        this.showNotification('Scarico per 7 giorni', 'info', { icon: 'deload' });
        this.loadDashboard();
    },

    _oggiDismissEarly() {
        this._oggiSetEarlyState('dismissed');
        const box = document.getElementById('oggi-deload');
        if (box) box.hidden = true;
        this.showNotification('Scarico rimandato', 'info', {
            icon: 'deload',
            action: { label: 'Annulla', onClick: () => { this._oggiSetEarlyState('shown'); this.updateEarlyDeload(); } }
        });
    },

    // ========================================
    // CICLO (mesociclo): fasi, linea delle settimane, scarico, chiusura con rotazione
    // ========================================

    // 'acc' | 'int' | 'del' (classi della linea del ciclo)
    _oggiPhaseKey(phase) {
        const p = typeof phase === 'string' ? phase : phase?.phase;
        return p === 'intensification' ? 'int' : p === 'deload' ? 'del' : 'acc';
    },

    // Nomi dell'interfaccia ("Deload" diventa "Scarico")
    _oggiPhaseLabel(phase) {
        return { acc: 'Accumulo', int: 'Intensificazione', del: 'Scarico' }[this._oggiPhaseKey(phase)];
    },

    // RIR della fase come testo: "2-3" (v2: rir multiarticolari/isolamenti; v1: rirTarget)
    _oggiPhaseRir(phase) {
        if (!phase) return '';
        let lo = null;
        let hi = null;
        if (phase.rir && Number.isFinite(Number(phase.rir.compound))) {
            const c = Number(phase.rir.compound);
            const i = Number.isFinite(Number(phase.rir.isolation)) ? Number(phase.rir.isolation) : c;
            lo = Math.min(c, i);
            hi = Math.max(c, i);
        } else if (phase.rirTarget) {
            lo = Number(phase.rirTarget.min);
            hi = Number(phase.rirTarget.max);
        }
        if (!Number.isFinite(lo)) return '';
        return lo === hi || !Number.isFinite(hi) ? `${lo}` : `${lo}-${hi}`;
    },

    // Fase da applicare oggi: con lo scarico manuale attivo vale la fase di scarico
    _currentPhase(cycleInfo, isDeload) {
        if (!cycleInfo) return null;
        const phase = cycleInfo.currentPhase || cycleInfo.phases?.[0] || null;
        if (!isDeload || phase?.phase === 'deload') return phase;
        const deload = (cycleInfo.phases || []).find(p => p.phase === 'deload');
        return {
            ...(deload || {}),
            week: cycleInfo.currentWeek,
            phase: 'deload',
            phaseName: deload?.phaseName || 'Deload',
            rirTarget: deload?.rirTarget || { min: 4, max: 5 },
            volumeMultiplier: deload?.volumeMultiplier ?? 0.5
        };
    },

    // Copia del giorno con le serie della fase. Seduta libera e simulazione: nessuna fase.
    _applyPhase(day, phase = undefined) {
        if (!day) return day;
        if (phase === undefined) {
            const cycleInfo = Storage.getCycleInfo();
            phase = this._currentPhase(cycleInfo, Storage.isDeloadActive());
        }
        if (!phase) return day;
        try {
            const out = TrainingAlgorithm.applyPhaseToDay(day, phase);
            if (out && Array.isArray(out.exercises)) return out;
        } catch (e) {
            console.warn('applyPhaseToDay non disponibile, uso il calcolo locale', e);
        }
        const mult = typeof phase.volumeMultiplier === 'number' ? phase.volumeMultiplier : 1;
        if (mult === 1) return day;
        return {
            ...day,
            exercises: (day.exercises || []).map(ex => {
                const sets = parseInt(ex.sets) || 3;
                return { ...ex, sets: Math.max(Math.min(2, sets), Math.round(sets * mult)) };
            })
        };
    },

    // Minuti stimati del giorno (per le schede vecchie conta la durata scelta), con la rampa e il tempo
    // in più di "Trova il peso" quando l'algoritmo li sa dire (ripiego: la stima di prima)
    _estimateDuration(day, program = undefined) {
        try {
            const md = (program === undefined ? Storage.getActiveProgram() : program)?.metadata || {};
            const ctx = {};
            if (md.goal) ctx.goal = md.goal;
            if (parseInt(md.sessionDuration, 10) > 0) ctx.minutes = parseInt(md.sessionDuration, 10);
            const exs = (day?.exercises || []).filter(Boolean);
            // Scheda vecchia senza rampa scritta sugli esercizi: le serie d'avvicinamento dal piano
            const hasRamp = exs.some(e => Array.isArray(e.warmupSets) || parseInt(e.rampSets, 10) > 0);
            if (!hasRamp && typeof TrainingAlgorithm.getRampPlan === 'function') {
                const plan = this._safe(() => TrainingAlgorithm.getRampPlan(exs));
                if (Array.isArray(plan)) ctx.rampSets = plan.reduce((n, r) => n + (Number(r?.count) || 0), 0);
            }
            if (typeof Storage.planCalibration === 'function') {
                // dryRun: solo la stima, senza mettere in coda le calibrazioni rimandate
                const cal = this._safe(() => Storage.planCalibration(day, { dryRun: true }));
                if (cal && Number(cal.extraMin) > 0) ctx.calibExtraMin = Number(cal.extraMin);
            }
            return TrainingAlgorithm.estimateWorkoutDuration(day, ctx) || 0;
        } catch (e) {
            return 0;
        }
    },

    _shouldCompleteCycle() {
        try {
            return !!Storage.shouldCompleteCycle();
        } catch (e) {
            return false;
        }
    },

    // Linea del ciclo (comune a Oggi e Scheda): settimane colorate per fase, quella corrente con l'anello
    _oggiMesoHtml(info) {
        const n = Math.max(1, info.duration || info.phases?.length || 1);
        let html = '';
        for (let w = 1; w <= n; w++) {
            const ph = (info.phases || []).find(p => p && p.week === w) || info.phases?.[w - 1];
            const cls = w === info.currentWeek ? ' is-now' : w > info.currentWeek ? ' is-future' : '';
            html += `<i class="meso__wk${cls}" data-ph="${this._oggiPhaseKey(ph)}"></i>`;
        }
        return html;
    },

    _oggiMesoLabel(info, phase) {
        const deload = (info.phases || []).find(p => p && p.phase === 'deload');
        return `Settimana ${info.currentWeek} di ${info.duration}: ${this._oggiPhaseLabel(phase).toLowerCase()}.` +
            (deload && deload.week > info.currentWeek ? ` Scarico in settimana ${deload.week}.` : '');
    },

    _oggiDeloadUntil(info) {
        const t = info?.manualDeloadUntil ? new Date(info.manualDeloadUntil) : null;
        if (!t || isNaN(t.getTime())) return '';
        return t.toLocaleDateString('it-IT', { weekday: 'long' });
    },

    updateCycleCard() {
        const section = document.getElementById('oggi-cycle');
        if (!section) return;
        const info = Storage.getCycleInfo();
        if (!info || !Storage.getActiveProgram()?.days?.length) {
            section.hidden = true;
            return;
        }
        section.hidden = false;
        const isDeload = Storage.isDeloadActive();
        let phase = null;
        try { phase = typeof Storage.getCurrentPhase === 'function' ? Storage.getCurrentPhase() : null; } catch (e) { phase = null; }
        if (!phase) phase = this._currentPhase(info, isDeload);
        const key = isDeload ? 'del' : this._oggiPhaseKey(phase);

        const tag = document.getElementById('oggi-cycle-phase');
        if (tag) {
            tag.dataset.ph = key;
            tag.innerHTML = `Sett. <span class="num">${info.currentWeek}/${info.duration}</span> · ${this._oggiPhaseLabel(key === 'del' ? 'deload' : phase)}`;
        }
        const meso = document.getElementById('oggi-meso');
        if (meso) {
            meso.style.setProperty('--weeks', String(info.duration));
            meso.innerHTML = this._oggiMesoHtml(info);
            meso.setAttribute('aria-label', this._oggiMesoLabel(info, key === 'del' ? 'deload' : phase));
        }
        const note = document.getElementById('oggi-cycle-note');
        if (note) {
            const deload = (info.phases || []).find(p => p && p.phase === 'deload');
            if (isDeload) {
                const until = info.isManualDeload ? this._oggiDeloadUntil(info) : '';
                note.innerHTML = `Metà serie, carichi −10%${until ? ` · fino a ${GT.esc(until)}` : ''}`;
            } else {
                const rir = this._oggiPhaseRir(this._currentPhase(info, false) || phase);
                note.innerHTML = [
                    rir ? `RIR <span class="num">${rir}</span>` : '',
                    deload && deload.week > info.currentWeek ? `scarico in settimana <span class="num">${deload.week}</span>` : ''
                ].filter(Boolean).join(' · ');
            }
        }
        const close = document.getElementById('oggi-cycle-close');
        if (close) close.hidden = !this._shouldCompleteCycle();
    },

    // Rientro dopo ≥21 giorni senza allenarsi (pesi o cardio): il ciclo interrotto si chiude
    // davvero (storico, rotazione, cycleNumber+1) e si riparte dalla settimana 1.
    // Idempotente: se il ciclo è ripartito dopo l'ultimo allenamento non fa nulla.
    checkReturnFromLayoff() {
        if (this.activeWorkout) return;
        const cycleInfo = Storage.getCycleInfo();
        if (!cycleInfo) return;

        const daysAgo = Storage.getDaysSinceLastWorkout();
        if (daysAgo == null || daysAgo < 21) return;

        const lastActivityDay = GT.startOfDay(new Date());
        lastActivityDay.setDate(lastActivityDay.getDate() - daysAgo);
        const cycleStartDay = GT.startOfDay(new Date(cycleInfo.startDate || 0));
        if (cycleStartDay > lastActivityDay) return;   // già ripartito dopo la pausa

        const stats = Storage.getCycleStatistics();
        let closed = false;
        if (stats && stats.totalWorkouts > 0) {
            try {
                closed = !!Storage.completeCycle();
            } catch (e) {
                console.error('completeCycle al rientro', e);
            }
        }
        if (!closed) Storage.resetCycle();

        this.showNotification(`Bentornato dopo ${Math.round(daysAgo / 7)} settimane: ciclo da capo, pesi più leggeri`, 'info', { icon: 'cycle' });
    },

    // Settimana del ciclo dal calendario (stessa regola di Storage.shouldCompleteCycle); non va oltre l'ultima
    syncCycleWeekWithCalendar() {
        let res = null;
        try {
            res = Storage.syncCycleWeek();
        } catch (e) {
            return;
        }
        if (!res?.changed) return;
        const info = Storage.getCycleInfo();
        if (!info) return;
        const phase = this._currentPhase(info, Storage.isDeloadActive());
        this.showNotification(`Settimana ${info.currentWeek} di ${info.duration} · ${this._oggiPhaseLabel(phase)}`, 'info', { icon: 'cycle' });
    },

    async advanceCycleWeek() {
        const info = Storage.getCycleInfo();
        if (!info) return;
        if (info.currentWeek >= info.duration) {
            this.completeCycleWithSummary();
            return;
        }
        const next = (info.phases || []).find(p => p.week === info.currentWeek + 1);
        const ok = await this.confirmSheet({
            title: `Passare alla settimana ${info.currentWeek + 1}?`,
            text: next ? `${this._oggiPhaseLabel(next)}${this._oggiPhaseRir(next) ? ', RIR ' + this._oggiPhaseRir(next) : ''}` : '',
            ok: `Passa alla settimana ${info.currentWeek + 1}`,
            cancel: `Resta in settimana ${info.currentWeek}`
        });
        if (!ok) return;
        const res = this._save(() => Storage.advanceCycleWeek(), 'Settimana NON salvata');
        if (res && res !== true) this.showNotification(`Settimana ${res.currentWeek} · ${this._oggiPhaseLabel(res.currentPhase)}`, 'success', { icon: 'cycle' });
        this._oggiAfterCycle();
    },

    // Scarico anticipato: 7 giorni, poi scade da solo
    async startDeloadNow() {
        if (!Storage.getCycleInfo()) return;
        const ok = await this.confirmSheet({
            title: 'Scarico per 7 giorni?',
            text: 'Metà serie, carichi −10%, RIR 4. Poi il ciclo riprende.',
            ok: 'Inizia lo scarico',
            cancel: 'Non ora',
            icon: 'deload'
        });
        if (!ok) return;
        if (this._save(() => Storage.startManualDeload(), 'Scarico NON salvato') === false) return;
        this.showNotification('Scarico per 7 giorni', 'info', { icon: 'deload' });
        this._oggiAfterCycle();
    },

    async stopDeloadNow() {
        const ok = await this.confirmSheet({
            title: 'Terminare lo scarico?',
            text: 'Da oggi tornano serie e carichi del ciclo.',
            ok: 'Termina lo scarico',
            cancel: 'Continua lo scarico'
        });
        if (!ok) return;
        if (typeof Storage.stopManualDeload === 'function' && this._save(() => Storage.stopManualDeload(), 'Scarico NON terminato') === false) return;
        this.showNotification('Scarico terminato', 'info', { icon: 'deload' });
        this._oggiAfterCycle();
    },

    // Dopo un cambio del ciclo: si ridisegna solo la pagina aperta (Oggi o Scheda); le altre all'apertura
    _oggiAfterCycle() {
        if (this.currentPage === 'oggi') {
            this._safe(() => this.updateCycleCard());
            this._safe(() => this.updateQuickAction());
            this._safe(() => this.updateEarlyDeload());
        }
        this._safe(() => this.loadPrograms());
        this._safe(() => this.loadProgressCycleInfo());
    },

    // Riepilogo di fine ciclo quando serve: al massimo una volta al giorno (R1-04), mai sopra una
    // seduta in corso o salvata da riprendere (R1-07), mai sopra un altro foglio
    _maybePromptCycleEnd() {
        if (this.activeWorkout || this._cycleSummaryDismissed || this.currentPage !== 'oggi') return;
        if (this._safe(() => Storage.getActiveSession())) return;
        if (this._openSheets().length) return;
        if (!this._cycleEndPromptAllowed()) return;
        this.completeCycleWithSummary();
    },

    /**
     * Proporre adesso la fine del ciclo? Storage.shouldPromptCycleEnd decide e registra il giorno
     * (una volta al giorno, mai con una seduta aperta); ripiego: shouldCompleteCycle + il giorno nei settings.
     */
    _cycleEndPromptAllowed() {
        if (typeof Storage.shouldPromptCycleEnd === 'function') {
            const r = this._safe(() => Storage.shouldPromptCycleEnd());
            if (typeof r === 'boolean') return r;
        }
        if (!this._shouldCompleteCycle()) return false;
        const today = GT.dateKey(new Date());
        if (Storage.getSettings().cycleEndPromptDay === today) return false;
        this._safe(() => Storage.saveSettings({ cycleEndPromptDay: today }));
        return true;
    },

    completeCycleWithSummary() {
        if (document.getElementById('cycle-summary-modal')) return;
        const cycleInfo = Storage.getCycleInfo();
        if (!cycleInfo) return;

        const stats = Storage.getCycleStatistics() || {};
        let progress = null;
        try { progress = Storage.getCycleProgressMetrics(); } catch (e) { progress = null; }
        const program = Storage.getActiveProgram();
        const goalLabel = this._goalLabel(program?.metadata?.goal) || '';
        const n = cycleInfo.cycleNumber || program?.metadata?.cycleNumber || 1;
        const stat = (v, k) => `<div class="stat"><span class="stat__v num">${v}</span><span class="stat__k">${k}</span></div>`;
        const pct = Number(progress?.volumeChangePercent);
        const delta = Number.isFinite(pct) && progress?.firstWeekVolume > 0
            ? `<span class="delta ${pct > 0 ? 'delta--up' : pct < 0 ? 'delta--down' : 'delta--same'}">${this.ico(pct > 0 ? 'arrow-up' : pct < 0 ? 'arrow-down' : 'equal')}${pct === 0 ? 'uguale' : `${pct > 0 ? '+' : '−'}${Math.abs(Math.round(pct))}%`}</span>`
            : '';

        const html = `
            <div id="cycle-summary-modal">
                <section class="sheet og-sheet">
                    <div class="sheet__head"><h2>Ciclo ${GT.esc(n)} fatto</h2></div>
                    <p class="muted"><span class="num">${GT.esc(cycleInfo.duration)}</span> settimane${goalLabel ? ' · ' + GT.esc(goalLabel) : ''}</p>
                    <div class="cs-stats">
                        ${stat(stats.totalWorkouts || 0, 'sedute')}
                        ${stat(stats.totalSets || 0, 'serie')}
                        ${stat(GT.esc(GT.formatVolume(stats.totalVolume || 0)), 'volume')}
                        ${stat(stats.prsAchieved || 0, 'record')}
                    </div>
                    ${progress && progress.firstWeekVolume > 0 ? `
                        <div class="group">
                            <div class="row"><span class="row__body"><span class="row__title">Volume della prima settimana</span></span><span class="num">${GT.esc(GT.formatVolume(progress.firstWeekVolume || 0))}</span></div>
                            <div class="row"><span class="row__body"><span class="row__title">Ultima settimana</span></span><span class="num">${GT.esc(GT.formatVolume(progress.currentWeekVolume || 0))}</span>${delta}</div>
                            ${stats.avgRir != null ? `<div class="row"><span class="row__body"><span class="row__title">RIR medio</span></span><span class="num">${GT.esc(this.fmt(stats.avgRir, 1))}</span></div>` : ''}
                        </div>` : ''}
                    <div class="sheet__actions">
                        <button type="button" class="btn btn--primary btn--xl" data-cs="new">${this.ico('cycle')}Inizia il ciclo ${GT.esc(Number(n) + 1)}</button>
                        <button type="button" class="btn btn--ghost btn--block" data-cs="later">Dopo</button>
                    </div>
                </section>
            </div>
        `;

        const modal = this._showDynamicModal('cycle-summary-modal', html);
        modal?.querySelector('[data-cs="new"]')?.addEventListener('click', () => this.confirmCompleteCycle());
        modal?.querySelector('[data-cs="later"]')?.addEventListener('click', () => this.closeCycleSummary());
    },

    confirmCompleteCycle() {
        this._removeDynamicModal('cycle-summary-modal');
        let result = null;
        try {
            result = Storage.completeCycle();
        } catch (e) {
            console.error('completeCycle', e);
        }
        if (!result) {
            this.showNotification('Ciclo non chiuso: riprova', 'error');
            return;
        }

        this._cycleSummaryDismissed = false;
        const cycleNumber = Storage.getActiveProgram()?.metadata?.cycleNumber || '';
        const rotation = result.rotation;
        const changed = (rotation?.added?.length || 0) + (rotation?.removed?.length || 0);
        if (changed > 0) {
            this.showRotationDetail(rotation, cycleNumber);
        } else {
            this.showNotification(`Ciclo ${cycleNumber} iniziato`, 'success', { icon: 'cycle' });
        }

        this._safe(() => this.loadPrograms());
        this._safe(() => this.loadDashboard());
    },

    // Nome leggibile di una voce della rotazione (id oppure {id, name})
    _oggiRotationName(item) {
        if (item == null) return '';
        if (typeof item === 'string') return EXERCISES_DB[item]?.name || item;
        return item.name || EXERCISES_DB[item.id || item.exerciseId]?.name || item.id || item.exerciseId || '';
    },

    showRotationDetail(rotation, cycleNumber) {
        const row = (e, icon) => `<div class="row"><span class="row__icon">${this.ico(icon)}</span><span class="row__body"><span class="row__title">${GT.esc(this._oggiRotationName(e))}</span></span></div>`;
        const added = (rotation?.added || []).map(e => row(e, 'plus')).join('');
        const removed = (rotation?.removed || []).map(e => row(e, 'minus')).join('');
        const html = `
            <div id="rotation-detail-modal">
                <section class="sheet og-sheet">
                    <div class="sheet__head"><h2>Ciclo ${GT.esc(cycleNumber)}: esercizi nuovi</h2></div>
                    ${added ? `<h3 class="cap">Entrano</h3><div class="group">${added}</div>` : ''}
                    ${removed ? `<h3 class="cap">Escono</h3><div class="group">${removed}</div>` : ''}
                    <div class="sheet__actions">
                        <button type="button" class="btn btn--primary btn--xl" data-rd="plan">${this.ico('plan')}Vedi la scheda</button>
                        <button type="button" class="btn btn--ghost btn--block" data-rd="close">Chiudi</button>
                    </div>
                </section>
            </div>
        `;
        const modal = this._showDynamicModal('rotation-detail-modal', html);
        modal?.querySelector('[data-rd="plan"]')?.addEventListener('click', () => {
            this._removeDynamicModal('rotation-detail-modal');
            this.navigateTo('scheda');
        });
        modal?.querySelector('[data-rd="close"]')?.addEventListener('click', () => this._removeDynamicModal('rotation-detail-modal'));
    },

    closeCycleSummary() {
        this._removeDynamicModal('cycle-summary-modal');
        this._cycleSummaryDismissed = true;   // non riproporlo a ogni ritorno in Oggi
    },

    // ========================================
    // SCELTA DEL GIORNO
    // ========================================

    startScheduledWorkout() {
        if (this.activeWorkout) {
            this._promptActiveSession();
            return;
        }
        const program = Storage.getActiveProgram();
        if (!program?.days?.length) {
            this.openOnboarding();
            return;
        }
        this.openDayPicker(program);
    },

    openDayPicker(program = Storage.getActiveProgram()) {
        if (this.activeWorkout) {
            this._promptActiveSession();
            return;
        }
        if (!program?.days?.length) return;
        this._dpMinutes = null;
        this._renderDayPickerList(program);
        this._openModal('day-picker-modal', '.dp-day[data-suggested], .dp-day:not([disabled])');
    },

    // Lista dei giorni: consigliato, fatti questa settimana, vuoti disattivati; minuti con "Ho poco tempo"
    _renderDayPickerList(program = Storage.getActiveProgram()) {
        const container = document.getElementById('day-picker-list');
        if (!container || !program?.days?.length) return;
        const minutes = this._dpMinutes || null;
        document.querySelectorAll('#day-picker-short [data-min]').forEach(b => {
            b.setAttribute('aria-pressed', String(parseInt(b.dataset.min, 10) === minutes));
        });
        const suggested = this.getSuggestedDayIndex(program);
        const cycleInfo = Storage.getCycleInfo();
        const phase = this._currentPhase(cycleInfo, Storage.isDeloadActive());
        const md = program.metadata || {};
        const profile = Storage.getProfile();
        const doneIdx = this._oggiDoneSet(program);
        const canCompress = typeof TrainingAlgorithm.compressDay === 'function';
        const hadFocus = container.contains(document.activeElement) ? document.activeElement.dataset.day : null;

        container.innerHTML = program.days.map((day, i) => {
            const n = day.exercises ? day.exercises.length : 0;
            const label = day.type || day.name || `Giorno ${i + 1}`;
            if (!n) {
                return `<button type="button" class="choice dp-day" data-day="${i}" disabled aria-disabled="true">
                    <span class="choice__icon num">${i + 1}</span>
                    <span class="choice__body"><b>${GT.esc(label)}</b><span>Nessun esercizio</span></span>
                </button>`;
            }
            const phased = this._applyPhase(day, phase);
            let est = this._estimateDuration(phased, program);
            let warn = '';
            if (minutes && canCompress) {
                try {
                    const c = TrainingAlgorithm.compressDay(phased, minutes, { goal: md.goal || day.goal, emphasis: profile.emphasis || '', warmupMin: day.warmupMin });
                    if (c && Number.isFinite(c.estimatedMinutes)) est = c.estimatedMinutes;
                    if (c && c.fits === false) warn = `non sta in <span class="num">${minutes}</span>`;
                } catch (e) {
                    console.warn('compressDay', e);
                }
            }
            const isSug = i === suggested;
            const done = doneIdx.has(i);
            const tag = isSug ? '<span class="tag tag--accent">consigliato</span>'
                : done ? `<span class="tag tag--ok">${this.ico('check')}fatto</span>` : '';
            return `<button type="button" class="choice dp-day" data-day="${i}" tabindex="0"${isSug ? ' data-suggested' : ''}>
                <span class="choice__icon num">${i + 1}</span>
                <span class="choice__body"><b>${GT.esc(label)}</b><span><span class="num">${n}</span> ${n === 1 ? 'esercizio' : 'esercizi'}${est ? ` · <span class="num">~${est}</span> min` : ''}${warn ? ` · <span class="dp-warn">${warn}</span>` : ''}</span></span>
                ${tag}
            </button>`;
        }).join('');
        if (hadFocus != null) container.querySelector(`[data-day="${hadFocus}"]`)?.focus({ preventScroll: true });
    },

    // Indici dei giorni della scheda già fatti questa settimana
    _oggiDoneSet(program) {
        const out = new Set();
        const pid = program?.metadata?.programId;
        const days = program?.days || [];
        Storage.getWorkoutsThisWeek().forEach(w => {
            if (!w || w.isFreeWorkout) return;
            let idx = -1;
            if (pid != null && w.programId != null && String(w.programId) === String(pid) && Number.isInteger(parseInt(w.dayIndex, 10))) idx = parseInt(w.dayIndex, 10);
            if (idx < 0 || idx >= days.length) idx = days.findIndex(d => d.type && d.type === w.type);
            if (idx >= 0) out.add(idx);
        });
        return out;
    },

    // Giorno consigliato = quello dopo l'ultimo fatto di QUESTA scheda (salta i giorni vuoti)
    getSuggestedDayIndex(program) {
        const days = program?.days || [];
        if (!days.length) return 0;
        let idx = 0;
        try {
            idx = TrainingAlgorithm.getNextDayIndex(program, Storage.getWorkouts());
        } catch (e) {
            console.warn('getNextDayIndex', e);
            idx = Storage.getWorkoutsThisWeek().length % days.length;
        }
        if (!Number.isInteger(idx) || idx < 0 || idx >= days.length) idx = 0;
        for (let k = 0; k < days.length; k++) {
            const j = (idx + k) % days.length;
            if (days[j]?.exercises?.length) return j;
        }
        return idx;
    },

    selectWorkoutDay(dayIndex) {
        const program = Storage.getActiveProgram();
        const day = program?.days?.[dayIndex];
        if (!day) return;
        if (!day.exercises?.length) {
            this.showNotification('Giorno senza esercizi', 'warning');
            return;
        }
        const minutes = this._dpMinutes || null;
        this.closeDayPicker();
        this.startWorkout(day, minutes ? { dayIndex, minutes } : { dayIndex });
    },

    closeDayPicker() {
        this._closeModal('day-picker-modal');
    },

    // ========================================
    // DOPO LA SEDUTA: fine ciclo, avanzamento settimana, scarico (una proposta alla volta)
    // ========================================

    _afterWorkoutPrompts() {
        if (this.activeWorkout) return;
        if (this._shouldCompleteCycle()) {
            // Ciclo finito: la proposta una volta al giorno, non dopo ogni seduta (R1-04)
            if (!this._openSheets().length && this._cycleEndPromptAllowed()) {
                this._cycleSummaryDismissed = false;
                this.completeCycleWithSummary();
            }
            return;
        }
        if (this.checkWeekAdvancement()) return;
        this.checkDeloadSuggestion();
    },

    // true se ha mostrato la proposta di avanzare
    checkWeekAdvancement() {
        let should = false;
        try {
            should = Storage.shouldAdvanceWeek();
        } catch (e) {
            should = false;
        }
        if (!should) return false;
        const cycleInfo = Storage.getCycleInfo();
        if (!cycleInfo || cycleInfo.isLastWeek) return false;
        const nextPhase = (cycleInfo.phases || []).find(p => p.week === cycleInfo.currentWeek + 1);
        this.showWeekAdvancementSuggestion(cycleInfo, nextPhase);
        return true;
    },

    async showWeekAdvancementSuggestion(cycleInfo, nextPhase) {
        const next = cycleInfo.currentWeek + 1;
        const rir = this._oggiPhaseRir(nextPhase);
        const ok = await this.confirmSheet({
            title: `Settimana ${cycleInfo.currentWeek} fatta. Passare alla ${next}?`,
            text: nextPhase ? `${this._oggiPhaseLabel(nextPhase)}${nextPhase.phase === 'deload' ? ': metà serie, carichi −10%' : (rir ? ', RIR ' + rir : '')}` : '',
            ok: `Passa alla settimana ${next}`,
            cancel: `Resta in settimana ${cycleInfo.currentWeek}`,
            icon: 'cycle'
        });
        if (ok) this.confirmWeekAdvancement();
    },

    confirmWeekAdvancement() {
        const cycleInfo = this._save(() => Storage.advanceCycleWeek(), 'Settimana NON salvata');
        if (cycleInfo && cycleInfo !== true) this.showNotification(`Settimana ${cycleInfo.currentWeek} · ${this._oggiPhaseLabel(cycleInfo.currentPhase)}`, 'success', { icon: 'cycle' });
        this._oggiAfterCycle();
    },

    // Compatibilità (il core la chiama con Esc se trova il vecchio foglio)
    dismissWeekAdvancement() {
        this._removeDynamicModal('week-advance-modal');
    },

    checkDeloadSuggestion() {
        const cycleInfo = Storage.getCycleInfo();
        if (!cycleInfo || Storage.isDeloadActive()) return;

        // Una proposta per settimana di ciclo, non a ogni seduta
        const key = `${Storage.getActiveProgram()?.metadata?.programId || ''}-${cycleInfo.cycleNumber || ''}-${cycleInfo.currentWeek}`;
        if (this._deloadSuggestedKey === key) return;

        const nextDeload = (cycleInfo.phases || []).find(p => p.week > cycleInfo.currentWeek && p.phase === 'deload');
        const weeksToDeload = nextDeload ? nextDeload.week - cycleInfo.currentWeek : null;
        if (weeksToDeload === 1) {
            this._deloadSuggestedKey = key;
            this.showDeloadSuggestion('prossima', 'La settimana prossima è di scarico. Anticiparla?');
            return;
        }

        // Scarico anticipato: prestazioni in calo (v2) o RIR molto bassi (v1.26), al massimo una volta a settimana
        const state = this._oggiEarlyState();
        if (state === 'dismissed' || state === 'accepted') return;
        const s = this._oggiEarlySuggestion();
        let suggest = !!s?.suggest;
        if (!s && cycleInfo.currentPhase?.phase === 'intensification') {
            const low = Storage.getRecentWorkouts(3).filter(w => {
                const rirs = [];
                (w.exercises || []).forEach(ex => (ex.sets || []).forEach(st => {
                    if (st.completed !== false && Number.isFinite(st.rir)) rirs.push(st.rir);
                }));
                return rirs.length && rirs.reduce((a, b) => a + b, 0) / rirs.length <= 1;
            }).length;
            suggest = low >= 2;
        }
        if (suggest) {
            this._deloadSuggestedKey = key;
            this._oggiSetEarlyState('shown');
            this.showDeloadSuggestion('anticipato', 'Prestazioni in calo nelle ultime sedute.');
        }
    },

    async showDeloadSuggestion(type, message) {
        const early = type !== 'prossima';
        const ok = await this.confirmSheet({
            title: early ? 'Scarico per 7 giorni?' : 'Anticipare lo scarico?',
            text: early ? `${message} Metà serie, carichi −10%.` : message,
            ok: early ? 'Inizia lo scarico' : 'Passa allo scarico',
            cancel: 'Non ora',
            icon: 'deload'
        });
        if (ok) this.acceptDeloadSuggestion(early ? 'anticipato' : 'prossima');
        else if (early) this._oggiSetEarlyState('dismissed');
    },

    // 'prossima': si passa subito alla settimana di scarico del ciclo. 'anticipato': 7 giorni, scade da solo.
    acceptDeloadSuggestion(type = 'anticipato') {
        if (type === 'prossima') {
            const info = this._save(() => Storage.advanceCycleWeek(), 'Settimana NON salvata');
            if (info === false) return;
            this.showNotification(`Settimana ${info?.currentWeek || ''} · Scarico`, 'info', { icon: 'deload' });
        } else {
            if (this._save(() => Storage.startManualDeload(), 'Scarico NON salvato') === false) return;
            this._oggiSetEarlyState('accepted');
            this.showNotification('Scarico per 7 giorni', 'info', { icon: 'deload' });
        }
        this._oggiAfterCycle();
    },

    // Compatibilità (il core la chiama con Esc se trova il vecchio foglio)
    dismissDeloadSuggestion() {
        this._removeDynamicModal('deload-suggestion-modal');
    },

    // ========================================
    // PRIMO AVVIO (#onboarding): 4 passi, poi profilo + scheda → Oggi.
    // App.openOnboarding({fromStep:'goal'}) = "Rigenera": parte dall'obiettivo, tiene nome, sesso,
    // attrezzatura, e prima di sostituire la scheda chiede conferma.
    // ========================================

    // Etichette: la tabella unica del core (App.LABELS), le stesse di Profilo (R2-13)
    OB_GOALS: App.LABELS.goals,

    OB_PLACES: {
        gym: { label: 'Palestra completa', sub: 'Macchine, cavi, bilancieri', icon: 'machine', eq: ['bilanciere', 'manubri', 'macchine', 'cavi', 'panca', 'sbarra'] },
        home: { label: 'A casa con manubri', sub: 'Manubri, panca, accessori', icon: 'dumbbell', eq: ['manubri', 'panca', 'accessori'] },
        body: { label: 'Corpo libero', sub: 'Niente attrezzi', icon: 'bodyweight', eq: [] }
    },

    OB_EQUIP: App.LABELS.equipment,

    OB_PAIN: App.LABELS.pain,

    // [valore, "da quanti anni"]: la stessa scala di Profilo
    OB_LEVELS: App.LABELS.levels.map(l => [l[0], l[3]]),

    htmlOnboarding() {
        return `
            <div class="ob" id="ob-body"></div>
            <div class="dock ob-dock" role="region" aria-label="Avanti">
                <div class="dock__row">
                    <button type="button" class="btn btn--primary btn--xl" id="ob-next">Avanti${this.ico('arrow-right')}</button>
                </div>
            </div>
        `;
    },

    // Ricaricando su #onboarding (es. dopo un import) senza niente da chiedere si va a Oggi
    canOnboarding() {
        return !!this._ob || this._oggiNeedsOnboarding();
    },

    enterOnboarding() {
        if (!this._ob) this._obInit({});
        this._obRender(false);
    },

    _oggiHasName(profile = Storage.getProfile()) {
        return !!String(profile?.name || '').trim();
    },

    _oggiNeedsOnboarding() {
        const program = Storage.getActiveProgram();
        return !this._oggiHasName() || !program?.days?.length;
    },

    // All'avvio: senza nome o senza scheda (e senza seduta da riprendere) si apre il primo avvio
    _oggiBootCheck() {
        if (this.activeWorkout || this.currentPage === 'seduta' || this.currentPage === 'onboarding') return;
        if (!this._oggiNeedsOnboarding()) return;
        // Il vecchio invito del core ("Benvenuto! …" + Profilo) non serve più
        document.querySelectorAll('#toast-stack .toast').forEach(t => {
            if (/^Benvenuto/.test((t.textContent || '').trim())) t.remove();
        });
        this.openOnboarding({ replace: true, auto: true });
    },

    /**
     * Apre il primo avvio.
     * @param {{fromStep?: 'goal', replace?: boolean}} opts - fromStep 'goal' = Rigenera (da Scheda e Profilo)
     */
    openOnboarding(opts = {}) {
        if (this.activeWorkout && opts.fromStep === 'goal') {
            this._promptActiveSession();
            return;
        }
        this._obInit(opts);
        if (this.currentPage === 'onboarding') this._obRender(false);
        else this.navigateTo('onboarding', { replace: !!opts.replace });
    },

    _obInit(opts = {}) {
        const profile = Storage.getProfile();
        const program = Storage.getActiveProgram();
        const md = program?.metadata || {};
        const hasName = this._oggiHasName(profile);
        const regen = opts.fromStep === 'goal' && hasName;
        const goals = this.OB_GOALS.map(g => g[0]);
        const goal0 = regen ? (goals.includes(md.goal) ? md.goal : profile.goal) : (hasName && goals.includes(profile.goal) ? profile.goal : null);
        const days0 = regen ? parseInt(md.daysPerWeek || program?.days?.length, 10) : null;
        const td0 = this._trainingDays(profile);
        const min0 = regen ? parseInt(md.sessionDuration, 10) : null;
        const eq = Array.isArray(profile.equipment) ? profile.equipment.filter(e => this.OB_EQUIP.some(x => x[0] === e)) : this.OB_PLACES.gym.eq.slice();
        this._ob = {
            first: regen ? 2 : 1,
            step: regen ? 2 : 1,
            regen,
            hasName,
            name: String(profile.name || ''),
            gender: ['male', 'female'].includes(profile.gender) ? profile.gender : '',
            level: this.OB_LEVELS.some(l => l[0] === profile.level) ? profile.level : 'beginner',
            // giorni fissi: quelli del profilo se ci sono (Rigenera), altrimenti la proposta per N giorni
            wdays: hasName && Array.isArray(profile.trainingDays) ? td0 : null,
            goal: goal0,
            goal0,
            days: [2, 3, 4, 5, 6].includes(days0) ? days0 : null,
            days0: [2, 3, 4, 5, 6].includes(days0) ? days0 : null,
            minutes: [45, 60, 75, 90].includes(min0) ? min0 : null,
            minutes0: [45, 60, 75, 90].includes(min0) ? min0 : null,
            touched: {},
            equipment: new Set(hasName ? eq : this.OB_PLACES.gym.eq),
            place: null,
            pain: new Set(Array.isArray(profile.painAreas) ? profile.painAreas : []),
            errors: {}
        };
        this._ob.place = this._obGuessPlace(this._ob.equipment);
    },

    _obGuessPlace(eq) {
        const same = (list) => list.length === eq.size && list.every(e => eq.has(e));
        const hit = Object.keys(this.OB_PLACES).find(k => same(this.OB_PLACES[k].eq));
        if (hit) return hit;
        if (eq.has('macchine') || eq.has('bilanciere') || eq.has('cavi')) return 'gym';
        if (eq.has('manubri')) return 'home';
        return 'body';
    },

    _obRecs(goal) {
        return (this.WIZARD_RECOMMENDATIONS && this.WIZARD_RECOMMENDATIONS[goal]) || null;
    },

    // Valori di giorni e minuti: quelli scelti, quelli della scheda (stesso obiettivo) o i consigliati
    _obResolveTime() {
        const s = this._ob;
        const recs = this._obRecs(s.goal);
        if (!s.touched.days) s.days = (s.goal === s.goal0 && s.days0) ? s.days0 : (recs?.days?.recommended || 3);
        if (!s.touched.minutes) s.minutes = (s.goal === s.goal0 && s.minutes0) ? s.minutes0 : (recs?.duration?.recommended || 60);
        if (![2, 3, 4, 5, 6].includes(s.days)) s.days = 3;
        if (![45, 60, 75, 90].includes(s.minutes)) s.minutes = 60;
        // Giorni fissi: la proposta ben distribuita finché non li si tocca (e se non tornano col numero)
        if (!s.touched.wdays && (!Array.isArray(s.wdays) || (s.wdays.length && s.wdays.length !== s.days))) s.wdays = this._defaultTrainingDays(s.days);
    },

    // Divisione proposta: quella consigliata per obiettivo e giorni (2 giorni: full body)
    _obSplit(goal, days) {
        if (days <= 2) return 'full-body';
        return this._obRecs(goal)?.split?.[days]?.recommended || (days === 3 ? 'full-body' : 'upper-lower');
    },

    _obSplitInfo(goal, days) {
        const split = this._obSplit(goal, days);
        const toning = goal === 'toning';
        if (split === 'full-body') {
            return { split, title: `Full body · ${days} giorni`, sub: toning ? 'Tutto il corpo ogni volta, glutei in ogni seduta' : 'Tutto il corpo ogni volta' };
        }
        if (split === 'push-pull-legs') return { split, title: `Push/Pull/Legs · ${days} giorni`, sub: 'Spinta, tirata e gambe, due volte' };
        let sub = 'Parte alta e parte bassa alternate';
        if (toning) sub = `Glutei e gambe in ${days >= 5 ? 3 : 2} sedute su ${days}`;
        else if (days === 3) sub = 'Parte alta, parte bassa e un giorno completo';
        else if (days === 5) sub = 'Alta e bassa alternate, più braccia e spalle';
        return { split, title: `Upper/Lower · ${days} giorni`, sub };
    },

    _obTop() {
        const s = this._ob;
        const total = 4 - (s.first - 1);
        const cur = s.step - s.first + 1;
        let lead = '';
        if (s.step > s.first) {
            lead = `<button type="button" class="btn btn--ghost btn--icon ob__lead" data-ob-act="back" aria-label="Indietro">${this.ico('back')}</button>`;
        } else if (s.regen) {
            lead = `<button type="button" class="btn btn--ghost btn--icon ob__lead" data-ob-act="exit" aria-label="Indietro, tieni la scheda">${this.ico('back')}</button>`;
        } else if (s.hasName) {
            lead = `<button type="button" class="btn btn--ghost btn--icon ob__lead" data-ob-act="exit" aria-label="Chiudi, crea la scheda dopo">${this.ico('close')}</button>`;
        }
        const bar = Array.from({ length: total }, (_, i) => `<i class="${i + 1 < cur ? 'is-done' : i + 1 === cur ? 'is-now' : ''}"></i>`).join('');
        const count = `<span class="ob__count"><span class="num">${cur}</span> di <span class="num">${total}</span></span>`;
        if (s.step === 1 && !lead) {
            return `<div class="ob__top"><span class="brand">${this.ico('barbell')}GymTracker</span><span class="ob__fill"></span>${count}</div>
                <div class="steps" style="--n:${total}" aria-hidden="true">${bar}</div>`;
        }
        if (s.step === 1) {
            return `<div class="ob__top">${lead}<span class="brand">${this.ico('barbell')}GymTracker</span><span class="ob__fill"></span>${count}</div>
                <div class="steps" style="--n:${total}" aria-hidden="true">${bar}</div>`;
        }
        return `<div class="ob__top">${lead}<div class="steps" style="--n:${total}" aria-hidden="true">${bar}</div>${count}</div>`;
    },

    // Gruppo di scelte esclusive (role=radio, frecce per spostarsi)
    _obRadio(group, current, items, render) {
        const sel = items.some(it => it[0] === current) ? current : null;
        return items.map((it, i) => {
            const on = it[0] === sel;
            const tab = on || (!sel && i === 0) ? '0' : '-1';
            return render(it, `role="radio" aria-checked="${on}" tabindex="${tab}" data-ob-group="${group}" data-v="${GT.esc(it[0])}"`);
        }).join('');
    },

    _obErr(key, text) {
        const on = !!this._ob.errors[key];
        return `<p class="ob__err" id="ob-err-${key}"${on ? '' : ' hidden'}>${this.ico('alert', 'ico--sm')}${text}</p>`;
    },

    _obStepHtml() {
        const s = this._ob;
        const choice = (it, attrs, opts = {}) => `<button class="choice${opts.cls || ''}" type="button" ${attrs}>
            <span class="choice__icon">${this.ico(it[3] || it[2])}</span>
            <span class="choice__body"><b>${it[1]}</b>${opts.sub !== false && it[2] && it[3] ? `<span>${it[2]}</span>` : ''}</span>
            ${opts.mark === false ? '' : `<span class="choice__mark">${this.ico('check')}</span>`}
        </button>`;

        if (s.step === 1) {
            return `
                <div class="ob__q"><h1 tabindex="-1" id="ob-title">Chi si allena?</h1><p>Serve per i carichi di partenza.</p></div>
                <div class="field">
                    <label for="ob-name">Nome</label>
                    <input class="input" id="ob-name" type="text" value="${GT.esc(s.name)}" maxlength="30" autocomplete="given-name" autocapitalize="words" enterkeyhint="next"${s.errors.name ? ' aria-invalid="true"' : ''} aria-describedby="ob-err-name">
                    ${this._obErr('name', 'Scrivi il tuo nome')}
                </div>
                <div class="field">
                    <span class="label" id="ob-sex-l">Sesso</span>
                    <div class="choices choices--2" role="radiogroup" aria-labelledby="ob-sex-l" aria-describedby="ob-err-gender"${s.errors.gender ? ' aria-invalid="true"' : ''}>
                        ${this._obRadio('gender', s.gender, [['male', 'Uomo', 'male'], ['female', 'Donna', 'female']], (it, a) => `<button class="choice" type="button" ${a}><span class="choice__icon">${this.ico(it[2])}</span><span class="choice__body"><b>${it[1]}</b></span></button>`)}
                    </div>
                    ${this._obErr('gender', 'Scegli uomo o donna')}
                </div>
                <div class="field">
                    <span class="label" id="ob-lv-l">Da quanto ti alleni</span>
                    <div class="seg" role="radiogroup" aria-labelledby="ob-lv-l">
                        ${this._obRadio('level', s.level, this.OB_LEVELS, (it, a) => `<button type="button" ${a}>${it[1]}</button>`)}
                    </div>
                </div>
                ${s.hasName ? '' : `<button type="button" class="btn btn--ghost ob__import" data-ob-act="import">${this.ico('upload')}Hai un backup? Importa</button>`}`;
        }

        if (s.step === 2) {
            return `
                <div class="ob__q"><h1 tabindex="-1" id="ob-title">Cosa vuoi ottenere?</h1></div>
                <div class="choices" role="radiogroup" aria-labelledby="ob-title">
                    ${this._obRadio('goal', s.goal, this.OB_GOALS, (it, a) => choice(it, a))}
                </div>`;
        }

        if (s.step === 3) {
            this._obResolveTime();
            const info = this._obSplitInfo(s.goal, s.days);
            return `
                <div class="ob__q"><h1 tabindex="-1" id="ob-title">Quanto tempo hai?</h1></div>
                <div class="field">
                    <span class="label" id="ob-days-l">Giorni a settimana</span>
                    <div class="pick" style="--n:5" role="radiogroup" aria-labelledby="ob-days-l">
                        ${this._obRadio('days', String(s.days), [['2'], ['3'], ['4'], ['5'], ['6']], (it, a) => `<button type="button" ${a}>${it[0]}</button>`)}
                    </div>
                </div>
                <div class="field">
                    <span class="label" id="ob-wd-l">Quali giorni</span>
                    <div class="wd" role="group" aria-labelledby="ob-wd-l" aria-describedby="ob-err-wdays" id="ob-wdays">${this._weekdayChips(s.wdays, 'data-ob-wd')}</div>
                    <p class="ob__hint" id="ob-wd-hint"${s.wdays && !s.wdays.length ? '' : ' hidden'}>Nessun giorno fisso: decidi tu</p>
                    ${this._obErr('wdays', 'Da 2 a 6 giorni, o nessuno')}
                </div>
                <div class="field">
                    <span class="label" id="ob-min-l">Minuti per seduta</span>
                    <div class="pick" style="--n:4" role="radiogroup" aria-labelledby="ob-min-l">
                        ${this._obRadio('minutes', String(s.minutes), [['45'], ['60'], ['75'], ['90']], (it, a) => `<button type="button" ${a} aria-label="${it[0]} minuti">${it[0]}<small aria-hidden="true">min</small></button>`)}
                    </div>
                </div>
                <div class="group" aria-live="polite">
                    <div class="row">
                        <span class="row__icon">${this.ico('plan')}</span>
                        <span class="row__body"><span class="row__title" id="ob-split-title">${GT.esc(info.title)}</span><span class="row__sub" id="ob-split-sub">${GT.esc(info.sub)}</span></span>
                    </div>
                </div>`;
        }

        // 4. Dove ti alleni
        const places = Object.keys(this.OB_PLACES).map(k => [k, this.OB_PLACES[k].label, this.OB_PLACES[k].sub, this.OB_PLACES[k].icon]);
        return `
            <div class="ob__q"><h1 tabindex="-1" id="ob-title">Dove ti alleni?</h1></div>
            <div class="choices" role="radiogroup" aria-labelledby="ob-title">
                ${this._obRadio('place', s.place, places, (it, a) => choice(it, a))}
            </div>
            <div class="field">
                <span class="label" id="ob-eq-l">Attrezzi che hai: tocca per cambiare</span>
                <div class="chips" role="group" aria-labelledby="ob-eq-l" id="ob-equip">${this._obEquipChips()}</div>
            </div>
            <div class="field">
                <span class="label" id="ob-pain-l">Fastidi? Facoltativo</span>
                <div class="ob__pain" role="group" aria-labelledby="ob-pain-l">
                    ${this.OB_PAIN.map(([v, l]) => `<button class="chip" type="button" aria-pressed="${s.pain.has(v)}" data-ob-pain="${v}">${l}</button>`).join('')}
                </div>
            </div>`;
    },

    _obEquipChips() {
        const s = this._ob;
        return this.OB_EQUIP.map(([v, l, icon]) => `<button class="chip" type="button" aria-pressed="${s.equipment.has(v)}" data-ob-eq="${v}">${this.ico(icon)}${l}</button>`).join('');
    },

    _obRender(moveFocus = true) {
        const body = document.getElementById('ob-body');
        const next = document.getElementById('ob-next');
        if (!body || !this._ob) return;
        const s = this._ob;
        if (s.step === 2 && !s.goal) s.goal = s.gender === 'female' ? 'toning' : 'hypertrophy';
        body.innerHTML = this._obTop() + this._obStepHtml();
        if (next) {
            if (s.step < 4) next.innerHTML = `Avanti${this.ico('arrow-right')}`;
            else next.innerHTML = Storage.getActiveProgram()?.days?.length ? `${this.ico('cycle')}Rigenera scheda` : 'Crea la mia scheda';
        }
        if (moveFocus) {
            window.scrollTo?.(0, 0);
            setTimeout(() => { try { document.getElementById('ob-title')?.focus({ preventScroll: true }); } catch (e) { /* no-op */ } }, 30);
        }
        this.refreshShell();
    },

    bindOnboarding() {
        const page = document.getElementById('page-onboarding');
        if (!page) return;
        page.addEventListener('click', (e) => {
            if (!this._ob) return;
            const act = e.target.closest('[data-ob-act]');
            if (act) {
                if (act.dataset.obAct === 'back') this._obBack();
                else if (act.dataset.obAct === 'import') this._obImport();
                else this._obExit();
                return;
            }
            const wd = e.target.closest('[data-ob-wd]');
            if (wd) {
                this._obToggleWeekday(parseInt(wd.dataset.obWd, 10));
                return;
            }
            if (e.target.closest('#ob-next')) {
                this._obNext();
                return;
            }
            const radio = e.target.closest('[data-ob-group]');
            if (radio) {
                this._obPick(radio);
                return;
            }
            const eq = e.target.closest('[data-ob-eq]');
            if (eq) {
                const v = eq.dataset.obEq;
                if (this._ob.equipment.has(v)) this._ob.equipment.delete(v);
                else this._ob.equipment.add(v);
                eq.setAttribute('aria-pressed', String(this._ob.equipment.has(v)));
                return;
            }
            const pain = e.target.closest('[data-ob-pain]');
            if (pain) {
                const v = pain.dataset.obPain;
                if (this._ob.pain.has(v)) this._ob.pain.delete(v);
                else this._ob.pain.add(v);
                pain.setAttribute('aria-pressed', String(this._ob.pain.has(v)));
            }
        });
        page.addEventListener('input', (e) => {
            if (e.target.id === 'ob-name' && this._ob) {
                this._ob.name = e.target.value;
                if (this._ob.errors.name && e.target.value.trim()) this._obSetError('name', false);
            }
        });
        page.addEventListener('keydown', (e) => {
            if (!this._ob) return;
            if (e.key === 'Enter' && e.target.id === 'ob-name') {
                e.preventDefault();
                this._obNext();
                return;
            }
            const radio = e.target.closest?.('[data-ob-group]');
            if (!radio) return;
            const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
            if (!(e.key in keys)) return;
            e.preventDefault();
            const list = [...radio.parentElement.querySelectorAll('[data-ob-group]')];
            const to = list[(list.indexOf(radio) + keys[e.key] + list.length) % list.length];
            this._obPick(to);
            to.focus();
        });
    },

    _obSetError(key, on) {
        this._ob.errors[key] = on;
        const el = document.getElementById(`ob-err-${key}`);
        if (el) el.hidden = !on;
        const field = key === 'name' ? document.getElementById('ob-name')
            : key === 'wdays' ? document.getElementById('ob-wdays')
                : document.querySelector('#ob-body [aria-labelledby="ob-sex-l"]');
        if (field) {
            if (on) field.setAttribute('aria-invalid', 'true');
            else field.removeAttribute('aria-invalid');
        }
    },

    // Scelta in un gruppo: stato, aria-checked, tabindex mobile, effetti (divisione, attrezzi)
    _obPick(btn) {
        const s = this._ob;
        const group = btn.dataset.obGroup;
        const v = btn.dataset.v;
        btn.parentElement.querySelectorAll('[data-ob-group]').forEach(b => {
            const on = b === btn;
            b.setAttribute('aria-checked', String(on));
            b.tabIndex = on ? 0 : -1;
        });
        if (group === 'gender') {
            s.gender = v;
            this._obSetError('gender', false);
        } else if (group === 'level') {
            s.level = v;
        } else if (group === 'goal') {
            s.goal = v;
        } else if (group === 'days' || group === 'minutes') {
            s[group] = parseInt(v, 10);
            s.touched[group] = true;
            // Numero di giorni cambiato: i giorni fissi tornano alla proposta per quel numero
            if (group === 'days' && s.wdays && s.wdays.length && s.wdays.length !== s.days) {
                s.wdays = this._defaultTrainingDays(s.days);
                this._obRenderWeekdays();
            }
            const info = this._obSplitInfo(s.goal, s.days);
            this._setText('ob-split-title', info.title);
            this._setText('ob-split-sub', info.sub);
        } else if (group === 'place') {
            s.place = v;
            s.equipment = new Set(this.OB_PLACES[v]?.eq || []);
            const chips = document.getElementById('ob-equip');
            if (chips) chips.innerHTML = this._obEquipChips();
        }
    },

    _obNext() {
        const s = this._ob;
        if (!s) return;
        if (s.step === 1) {
            const input = document.getElementById('ob-name');
            s.name = (input ? input.value : s.name).trim().slice(0, 30);
            const noName = !s.name;
            const noSex = !s.gender;
            this._obSetError('name', noName);
            this._obSetError('gender', noSex);
            if (noName || noSex) {
                if (noName) input?.focus();
                else document.querySelector('#ob-body [data-ob-group="gender"]')?.focus();
                return;
            }
        }
        if (s.step === 3) {
            const n = (s.wdays || []).length;
            const bad = n === 1 || n === 7;
            this._obSetError('wdays', bad);
            if (bad) {
                document.querySelector('#ob-wdays [data-ob-wd]')?.focus();
                return;
            }
        }
        if (s.step < 4) {
            s.step++;
            this._obRender(true);
            return;
        }
        this._obFinish();
    },

    // Giorni fissi: un tocco aggiunge o toglie; con 2-6 giorni il numero dei giorni segue
    _obToggleWeekday(n) {
        const s = this._ob;
        if (!s || !(n >= 1 && n <= 7)) return;
        const set = new Set(s.wdays || []);
        if (set.has(n)) set.delete(n); else set.add(n);
        s.wdays = [...set].sort((a, b) => a - b);
        s.touched.wdays = true;
        const c = s.wdays.length;
        if (c >= 2 && c <= 6 && c !== s.days) {
            s.days = c;
            s.touched.days = true;
            document.querySelectorAll('#ob-body [data-ob-group="days"]').forEach(b => {
                const on = b.dataset.v === String(c);
                b.setAttribute('aria-checked', String(on));
                b.tabIndex = on ? 0 : -1;
            });
            const info = this._obSplitInfo(s.goal, s.days);
            this._setText('ob-split-title', info.title);
            this._setText('ob-split-sub', info.sub);
        }
        if (s.errors.wdays && c !== 1 && c !== 7) this._obSetError('wdays', false);
        this._obRenderWeekdays();
    },

    _obRenderWeekdays() {
        const s = this._ob;
        const set = new Set(s?.wdays || []);
        document.querySelectorAll('#ob-wdays [data-ob-wd]').forEach(b => b.setAttribute('aria-pressed', String(set.has(parseInt(b.dataset.obWd, 10)))));
        const hint = document.getElementById('ob-wd-hint');
        if (hint) hint.hidden = !(s && Array.isArray(s.wdays) && !s.wdays.length);
    },

    // "Hai un backup? Importa" (telefono nuovo): lo stesso import di Profilo, poi si ricarica (R2-04)
    _obImport() {
        const input = document.getElementById('import-file-input');
        if (input) input.click();
        else this.showNotification('Importa da Profilo, sezione Backup', 'info');
    },

    _obBack() {
        const s = this._ob;
        if (!s) return;
        if (s.step > s.first) {
            s.step--;
            this._obRender(true);
        } else {
            this._obExit();
        }
    },

    // Esce senza creare nulla: Rigenera torna da dove era venuto, il primo avvio va a Oggi
    _obExit() {
        const regen = this._ob?.regen;
        this._ob = null;
        this._onboardingDismissed = true;
        if (regen) this.goBack('scheda');
        else this.navigateTo('oggi', { replace: true });
    },

    // Nome breve della scheda per le conferme: "Upper/Lower 4 giorni"
    _oggiProgramLabel(program) {
        const md = program?.metadata || {};
        const n = program?.days?.length || md.daysPerWeek || 0;
        const split = { 'upper-lower': 'Upper/Lower', 'push-pull-legs': 'Push/Pull/Legs', 'full-body': 'Full body' }[md.split];
        if (!split || md.isCustom) return program?.name || 'la scheda';
        return `${split} ${n} giorni`;
    },

    async _obFinish() {
        const s = this._ob;
        if (!s || this._obBusy) return;
        const existing = Storage.getActiveProgram();
        if (existing?.days?.length) {
            const ok = await this.confirmSheet({
                title: `Sostituire ${this._oggiProgramLabel(existing)}?`,
                text: 'Lo storico resta. Il ciclo riparte dalla settimana 1.',
                ok: 'Rigenera scheda',
                cancel: 'Tieni questa',
                icon: 'cycle'
            });
            if (!ok || !this._ob) return;
        }
        this._obBusy = true;
        try {
            this._obResolveTime();
            const patch = {
                name: s.name,
                gender: s.gender,
                level: s.level,
                goal: s.goal,
                daysPerWeek: s.days,
                sessionTime: s.minutes,
                trainingDays: Array.isArray(s.wdays) ? s.wdays.slice() : [],
                equipment: this.OB_EQUIP.map(e => e[0]).filter(e => s.equipment.has(e)),
                painAreas: this.OB_PAIN.map(p => p[0]).filter(p => s.pain.has(p))
            };
            // La scheda si genera dal profilo NUOVO ma il profilo si salva solo dopo la scheda: con la
            // memoria piena non resta un profilo cambiato con la scheda vecchia (R1-09)
            const profile = { ...Storage.getProfile(), ...patch };
            const options = { goal: s.goal, daysPerWeek: s.days, split: this._obSplit(s.goal, s.days), sessionDuration: s.minutes };
            let program = null;
            try {
                program = TrainingAlgorithm.generateProgram(profile, options);
            } catch (e) {
                console.error('generateProgram', e);
            }
            if (!program?.days?.length) {
                this.showNotification('Scheda non creata: prova un\'altra combinazione', 'error');
                return;
            }
            this._alignCycleStart(program);
            if (this._save(() => Storage.setActiveProgram(program), 'Scheda NON salvata') === false) return;
            this._save(() => Storage.saveProfile(patch), 'Profilo NON salvato');
            const regen = !!existing?.days?.length;
            this._ob = null;
            this._onboardingDismissed = false;
            this._cycleSummaryDismissed = false;
            this._schedaOpen = null;
            // Oggi si disegna aprendola; le altre pagine alla loro prossima apertura (R1-10)
            this.navigateTo('oggi', { replace: true });
            if (regen) this.showNotification('Scheda rigenerata', 'success', { icon: 'cycle' });
        } finally {
            this._obBusy = false;
        }
    },

    // Il ciclo parte dal lunedì di questa settimana: le settimane del ciclo coincidono con il calendario
    _alignCycleStart(program) {
        const cycle = program?.metadata?.cycle;
        if (!cycle) return;
        cycle.currentWeek = 1;
        cycle.startDate = GT.startOfWeek(new Date()).toISOString();
    },
});

// ========================================
// INTEGRATORI E ORARIO DELL'ALLENAMENTO (Oggi). Li usano anche Profilo (_pfSupp…) e Seduta (_sedSupp…).
// Dati: Storage.getSupplements / getSupplementsTaken / setSupplementTaken. Orario di oggi, in ordine:
// scelto in Oggi (settings.todayTrainingTime {date, time}; time '' = tolto per oggi; il giorno dopo scade)
// → previsto dalle ultime sedute (mediana delle ore d'inizio) → profile.trainingTime (solo dati vecchi).
// "Adesso" in cima a Oggi: voci Prima da orario −45' all'inizio, voci Dopo per 2 ore dalla fine.
// ========================================

Object.assign(App, {
    OGGI_SUPP_WHEN: [['colazione', 'Colazione'], ['pranzo', 'Pranzo'], ['pre', 'Prima'], ['post', 'Dopo'], ['sera', 'Sera']],
    // Ora indicativa dei pasti (minuti): Prima/Dopo vanno davanti al primo pasto che viene dopo l'inizio
    OGGI_SUPP_MEAL_MIN: { colazione: 8 * 60, pranzo: 13 * 60 + 30, sera: 20 * 60 + 30 },
    OGGI_TIME_ASK: ['07:00', '13:00', '18:00'],
    OGGI_PRE_MIN: 45,
    OGGI_POST_MIN: 120,
    OGGI_LEARN_N: 6,

    _oggiTimeOk(t) {
        return typeof t === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(t);
    },

    _oggiHHMM(d) {
        const p = n => String(n).padStart(2, '0');
        return `${p(d.getHours())}:${p(d.getMinutes())}`;
    },

    // Oggi all'ora 'HH:MM'
    _oggiAt(t) {
        const [h, m] = t.split(':').map(Number);
        const d = new Date();
        d.setHours(h, m, 0, 0);
        return d;
    },

    // 'HH:MM' spostato di min minuti (anche negativi), sulle 24 ore
    _oggiTimeAdd(t, min) {
        const [h, m] = t.split(':').map(Number);
        const x = ((((h * 60 + m + min) % 1440) + 1440) % 1440);
        const p = n => String(n).padStart(2, '0');
        return `${p(Math.floor(x / 60))}:${p(x % 60)}`;
    },

    // Inizio vero di una seduta salvata: startTime se c'è, altrimenti fine (date) − durata
    _oggiWorkoutStart(w) {
        if (!w) return null;
        const st = Number(w.startTime) || Date.parse(w.startTime);
        if (Number.isFinite(st) && st > 0) return new Date(st);
        if (!GT.isValidDate(w.date)) return null;
        const dur = Number(w.duration) || 0;   // secondi
        return new Date(new Date(w.date).getTime() - (dur > 0 && dur < 6 * 3600 ? dur * 1000 : 0));
    },

    // Ora prevista: mediana delle ore d'inizio delle ultime 6 sedute non libere, al quarto d'ora ('' senza
    // storico). Una lettura per giro di disegno: la usano riga, foglio, integratori e "Adesso"
    _oggiTimeLearned() {
        if (this._oggiLearnMemo !== undefined) return this._oggiLearnMemo;
        const mins = [];
        for (const w of Storage.getRecentWorkouts(40)) {
            if (!w || w.isFreeWorkout) continue;
            const d = this._oggiWorkoutStart(w);
            if (!d || isNaN(d.getTime())) continue;
            mins.push(d.getHours() * 60 + d.getMinutes());
            if (mins.length >= this.OGGI_LEARN_N) break;
        }
        let out = '';
        if (mins.length) {
            mins.sort((a, b) => a - b);
            const k = mins.length >> 1;
            const med = mins.length % 2 ? mins[k] : (mins[k - 1] + mins[k]) / 2;
            out = this._oggiTimeAdd('00:00', Math.round(med / 15) * 15);
        }
        this._oggiLearnMemo = out;
        Promise.resolve().then(() => { this._oggiLearnMemo = undefined; });
        return out;
    },

    // Orario previsto senza le scelte di oggi: dalle sedute, o quello abituale dei dati vecchi
    _oggiTimeUsual() {
        const l = this._oggiTimeLearned();
        if (l) return { time: l, today: false, learned: true };
        const p = Storage.getProfile().trainingTime;
        return this._oggiTimeOk(p) ? { time: p, today: false } : null;
    },

    // Orario dell'allenamento di oggi: {time, today, learned} (today = scelto per oggi) o null
    _oggiTrainTime() {
        const s = Storage.getSettings().todayTrainingTime;
        if (s && typeof s === 'object') {
            if (s.date === GT.dateKey(new Date())) return this._oggiTimeOk(s.time) ? { time: s.time, today: true } : null;
            this._safe(() => Storage.saveSettings({ todayTrainingTime: null }));   // di un altro giorno: scaduto
        }
        return this._oggiTimeUsual();
    },

    // 'HH:MM' = vale per oggi · '' = tolto per oggi
    _oggiSetTodayTime(time) {
        const v = { date: GT.dateKey(new Date()), time: this._oggiTimeOk(time) ? time : '' };
        return this._save(() => Storage.saveSettings({ todayTrainingTime: v }), 'Orario NON salvato') !== false;
    },

    // Giorno di allenamento: oggi è un giorno fisso; senza giorni fissi, finché la seduta di oggi non è fatta
    _oggiIsTrainDay() {
        const td = this._trainingDays();
        return td.length ? td.includes(this._isoWeekday()) : !this._oggiDoneToday();
    },

    // Sotto il focus, solo con la seduta di oggi da fare: "Oggi alle 18:00" o "A che ora ti alleni?" 07 · 13 · 18 · Altro
    _oggiTimeLine(show) {
        const el = document.getElementById('oggi-time');
        if (!el) return;
        el.hidden = !show;
        if (!show) {
            el.innerHTML = '';
            return;
        }
        const t = this._oggiTrainTime();
        el.innerHTML = t
            ? `<button type="button" class="tm-now" data-tm-open>${this.ico('clock', 'ico--sm')}<span>Oggi alle <span class="num">${GT.esc(t.time)}</span></span></button>`
            : `<div class="tm-ask"><span class="tm-ask__q" id="oggi-tm-q">${this.ico('clock', 'ico--sm')}A che ora ti alleni?</span><span class="tm-ask__chips" role="group" aria-labelledby="oggi-tm-q">${
                this.OGGI_TIME_ASK.map(x => `<button type="button" class="chip tm-chip" data-tm-set="${x}"><span class="num">${x.slice(0, 2)}</span><span class="sr-only">${x.slice(2)}</span></button>`).join('')
            }<button type="button" class="chip tm-chip" data-tm-other>Altro</button></span></div>`;
    },

    _oggiTimeClick(e) {
        const set = e.target.closest('[data-tm-set]');
        if (set) {
            if (!this._oggiSetTodayTime(set.dataset.tmSet)) return;
            this.loadDashboard();
            document.querySelector('#oggi-time [data-tm-open]')?.focus({ preventScroll: true });
            return;
        }
        if (e.target.closest('[data-tm-other]')) this._oggiTimeOpen();
        else if (e.target.closest('[data-tm-open]')) this._oggiTimeOpen();
    },

    // Chip del foglio: previsto, −1 h, +1 h, 07:00 (senza doppioni, in ordine di ora) → [['18:00', 'Previsto'], …]
    _oggiTimeChips(t) {
        const usual = this._oggiTimeUsual();
        const base = (usual || t).time;
        const seen = new Map();
        [[base, usual ? 'Previsto' : 'Scelto'], [this._oggiTimeAdd(base, -60), '−1 h'], [this._oggiTimeAdd(base, 60), '+1 h'], ['07:00', 'Mattina']]
            .forEach(([x, l]) => { if (!seen.has(x)) seen.set(x, l); });
        return [...seen].sort((a, b) => a[0].localeCompare(b[0]));
    },

    // Foglio dell'orario di oggi. Con l'orario: chip + Altro, "Ricordamelo" (voci Prima non prese, prima che
    // tocchi), "Togli". Senza (da "Altro" della domanda): solo l'ora libera.
    _oggiTimeOpen() {
        const t = this._oggiTrainTime();
        const chips = t ? this._oggiTimeChips(t) : [];
        const custom = !!t && !chips.some(c => c[0] === t.time);
        const pre = t ? this._oggiSuppPendingOf('pre') : [];
        const remind = t && pre.length && this._oggiAt(t.time).getTime() - this.OGGI_PRE_MIN * 60000 > Date.now();
        const root = this._sheet('oggi-time-sheet', `
            ${this._sheetHead(t ? 'Orario di oggi' : 'A che ora ti alleni?', 'Chiudi l\'orario di oggi')}
            ${t ? `<div class="pick tm-pick" style="--n:${chips.length + 1}" role="radiogroup" aria-label="Orario di oggi" id="oggi-tm-chips">${
                chips.map(([x, l]) => `<button type="button" role="radio" aria-checked="${x === t.time}" data-tm="${x}">${x}<small>${GT.esc(l)}</small></button>`).join('')
            }<button type="button" role="radio" aria-checked="${custom}" data-tm-alt>Altro</button></div>` : ''}
            <div class="field" id="oggi-tm-f"${t && !custom ? ' hidden' : ''}><label for="oggi-tm-in">Ora</label><input class="input num" type="time" id="oggi-tm-in" value="${t ? GT.esc(t.time) : ''}"></div>
            ${remind ? `<button type="button" class="btn btn--secondary btn--block" data-tm-remind>${this.ico('bell')}Ricordamelo</button>` : ''}
            ${t ? `<button type="button" class="btn btn--ghost btn--block" data-tm-off>${this.ico('close')}Togli</button>` : ''}
            <button type="button" class="btn btn--primary btn--xl btn--block" data-tm-done>Fatto</button>`, { cls: 'tm-sheet' });
        const input = root.querySelector('#oggi-tm-in');
        const after = () => {
            this.loadDashboard();
            this._safe(() => this._oggiSuppRefreshSheet());
        };
        const close = () => this._closeSheet('oggi-time-sheet');
        const sync = (x) => root.querySelectorAll('#oggi-tm-chips [role="radio"]').forEach(b => b.setAttribute('aria-checked', String(b.dataset.tm ? b.dataset.tm === x : !chips.some(c => c[0] === x))));
        const saveInput = () => {
            const v = input?.value || '';
            if (!this._oggiTimeOk(v) || v === this._oggiTrainTime()?.time) return true;
            if (!this._oggiSetTodayTime(v)) return false;
            sync(v);
            after();
            return true;
        };
        input?.addEventListener('change', () => saveInput());
        root.addEventListener('click', (e) => {
            const chip = e.target.closest('[data-tm]');
            if (chip) {
                if (!this._oggiSetTodayTime(chip.dataset.tm)) return;
                close();
                after();
                return;
            }
            if (e.target.closest('[data-tm-alt]')) {
                sync('');
                root.querySelector('#oggi-tm-f').hidden = false;
                input?.focus();
                return;
            }
            if (e.target.closest('[data-tm-remind]')) {
                close();
                this._oggiTimeRemind(t.time, pre);
                return;
            }
            if (e.target.closest('[data-tm-off]')) {
                if (!this._oggiSetTodayTime('')) return;
                close();
                after();
                return;
            }
            if (e.target.closest('[data-tm-done]') && saveInput()) close();
        });
    },

    // Evento di calendario .ics (orario −45', 15 minuti, avviso all'ora dell'evento). Sperimentale:
    // condivisione del file se il telefono la accetta, altrimenti il file in una nuova finestra; mai errori
    _oggiTimeRemind(time, items) {
        const title = 'Integratori pre-allenamento';
        const start = new Date(this._oggiAt(time).getTime() - this.OGGI_PRE_MIN * 60000);
        const ics = this._oggiIcs({ start, minutes: 15, title, desc: (items || []).map(s => [s.name, s.amount].filter(Boolean).join(' ')).join('\n') });
        const name = 'integratori-pre-allenamento.ics';
        let file = null;
        try { file = new File([ics], name, { type: 'text/calendar' }); } catch (e) { file = null; }
        try {
            if (file && typeof navigator.share === 'function' && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
                navigator.share({ files: [file], title })
                    .then(() => this.showNotification('Promemoria creato', 'success', { icon: 'bell' }))
                    .catch((e) => { if (!e || e.name !== 'AbortError') this._oggiIcsOpen(ics); });
                return;
            }
        } catch (e) { /* si passa al file */ }
        this._oggiIcsOpen(ics);
    },

    _oggiIcsOpen(ics) {
        try {
            let url = '';
            try { url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })); } catch (e) { url = ''; }
            if (!url) url = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(ics);
            const a = document.createElement('a');
            a.href = url;
            a.target = '_blank';
            a.rel = 'noopener';
            a.hidden = true;
            document.body.appendChild(a);
            a.click();
            a.remove();
            if (url.startsWith('blob:')) setTimeout(() => { try { URL.revokeObjectURL(url); } catch (e) { /* no-op */ } }, 60000);
        } catch (e) { /* sperimentale: niente errori a schermo */ }
    },

    // Testo .ics (RFC 5545): ore in UTC, testi con gli escape, righe piegate a 75 byte
    _oggiIcs({ start, minutes, title, desc }) {
        const utc = d => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
        const esc = s => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
        const enc = typeof TextEncoder === 'function' ? new TextEncoder() : null;
        const bytes = ch => (enc ? enc.encode(ch).length : unescape(encodeURIComponent(ch)).length);
        const fold = (line) => {
            const out = [];
            let cur = '';
            let n = 0;
            for (const ch of line) {
                const b = bytes(ch);
                if (n + b > (out.length ? 74 : 75)) { out.push(cur); cur = ''; n = 0; }
                cur += ch;
                n += b;
            }
            out.push(cur);
            return out.join('\r\n ');
        };
        const end = new Date(start.getTime() + minutes * 60000);
        return [
            'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//GymTracker//Integratori//IT', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
            'BEGIN:VEVENT',
            `UID:gymtracker-pre-${utc(start)}@gymtracker`,
            `DTSTAMP:${utc(new Date())}`,
            `DTSTART:${utc(start)}`,
            `DTEND:${utc(end)}`,
            `SUMMARY:${esc(title)}`,
            desc ? `DESCRIPTION:${esc(desc)}` : '',
            'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc(title)}`, 'TRIGGER:PT0S', 'END:VALARM',
            'END:VEVENT', 'END:VCALENDAR'
        ].filter(Boolean).map(fold).join('\r\n') + '\r\n';
    },

    // Voci di oggi non ancora prese di un momento ('pre' | 'post'), in qualunque sezione del piano
    _oggiSuppPendingOf(kind, plan = this._oggiSuppPlan()) {
        if (!plan) return [];
        return plan.sections.flatMap(x => x.items).filter(i => !i.taken && i.s.when === kind).map(i => i.s);
    },

    // "Adesso": voci Prima da orario −45' fino all'inizio; voci Dopo dalla fine della seduta di oggi per 2 ore
    _oggiNowPending(plan) {
        if (this.activeWorkout || !plan || !plan.times) return null;   // in seduta ci pensa la seduta
        const now = Date.now();
        let kind = '';
        if (this._oggiDoneToday()) {
            const end = plan.times.post.getTime();
            if (now >= end && now < end + this.OGGI_POST_MIN * 60000) kind = 'post';
        } else if (this._oggiIsTrainDay() && now >= plan.times.pre.getTime() && now < plan.times.start.getTime()) kind = 'pre';
        if (!kind) return null;
        const items = this._oggiSuppPendingOf(kind, plan);
        return items.length ? { kind, key: plan.key, items, names: items.map(s => this._oggiSuppShort(s)).join(', ') } : null;
    },

    // Riga "Adesso: Citrullina, Beta-alanina" in cima a Oggi; si ridisegna da sola al prossimo cambio d'ora
    _oggiNowRow() {
        const el = document.getElementById('oggi-now');
        if (!el) return;
        clearTimeout(this._oggiNowTimer);
        const plan = this.currentPage === 'oggi' ? this._safe(() => this._oggiSuppPlan()) : null;
        const p = plan ? this._safe(() => this._oggiNowPending(plan)) : null;
        this._oggiNow = p || null;
        el.hidden = !p;
        if (p) {
            const txt = document.getElementById('oggi-now-txt');
            if (txt) txt.innerHTML = `Adesso: ${GT.esc(p.names)}<span class="sr-only">, tocca quando le hai prese</span>`;
        }
        const t = plan?.times;
        if (!t) return;
        const now = Date.now();
        const marks = [t.pre.getTime(), t.start.getTime(), t.post.getTime(), t.post.getTime() + this.OGGI_POST_MIN * 60000].filter(x => x > now);
        if (marks.length) this._oggiNowTimer = setTimeout(() => this._safe(() => this._oggiNowRow()), Math.min(Math.min(...marks) - now + 500, 6 * 3600000));
    },

    // Tocco su "Adesso": prese tutte (con Annulla)
    _oggiNowTake() {
        const p = this._oggiNow;
        if (!p) return;
        const ids = p.items.map(s => s.id);
        const refresh = () => {
            this._safe(() => this._oggiNowRow());
            this._safe(() => this._oggiSuppRow());
            this._safe(() => this._oggiSuppRefreshSheet());
        };
        if (this._save(() => Storage.setSupplementTaken(p.key, ids, true), 'Integratori NON segnati') === false) return;
        refresh();
        this.showNotification(`Prese: ${p.names}`, 'success', {
            icon: 'check',
            action: {
                label: 'Annulla',
                onClick: () => { if (this._save(() => Storage.setSupplementTaken(p.key, ids, false), 'Integratori NON segnati') !== false) refresh(); }
            }
        });
    },

    _oggiSuppCatalog() {
        return typeof SUPPLEMENTS_CATALOG !== 'undefined' && Array.isArray(SUPPLEMENTS_CATALOG) ? SUPPLEMENTS_CATALOG : [];
    },

    // Nome corto per le righe di avviso ("Creatina"); se l'hai rinominato, il tuo nome
    _oggiSuppShort(s) {
        const c = this._oggiSuppCatalog().find(x => x.catalogId === s.catalogId);
        return c && c.name === s.name && c.short ? c.short : s.name;
    },

    _oggiSuppWhenLabel(w) {
        return (this.OGGI_SUPP_WHEN.find(x => x[0] === w) || [])[1] || '';
    },

    // 'train' = seduta fatta o in corso oggi, giorno fisso o orario scelto oggi · 'rest' = giorno fisso di riposo · 'unknown'
    _oggiSuppDay() {
        if (this.activeWorkout && !this.activeWorkout.isSimulation) return 'train';
        if (this._oggiDoneToday()) return 'train';
        const td = this._trainingDays();
        if (!td.length) return this._oggiTrainTime()?.today ? 'train' : 'unknown';
        return td.includes(this._isoWeekday()) ? 'train' : 'rest';
    },

    // Minuti della seduta di oggi (stima della scheda; ripiego: la durata scelta)
    _oggiSuppMinutes(dayIndex = null, fallback = null) {
        const program = Storage.getActiveProgram();
        const idx = Number.isInteger(dayIndex) ? dayIndex : (program?.days?.length ? this.getSuggestedDayIndex(program) : -1);
        const day = program?.days?.[idx];
        const est = day?.exercises?.length ? this._safe(() => this._estimateDuration(this._applyPhase(day), program)) : 0;
        if (Number(est) > 0) return Number(est);
        return parseInt(fallback, 10) || parseInt(Storage.getProfile().sessionTime, 10) || 60;
    },

    // Inizio e fine dell'allenamento di oggi: seduta finita = ore vere; in corso = inizio vero + stima;
    // altrimenti l'orario (di oggi o abituale) + stima. null se non si sa.
    _oggiSuppTimes() {
        const aw = this.activeWorkout && !this.activeWorkout.isSimulation ? this.activeWorkout : null;
        let start = null;
        let end = null;
        let approx = true;
        if (aw && aw.startTime) {
            start = new Date(aw.startTime);
            const min = aw.compressed ? (parseInt(aw.sessionMinutes, 10) || 45) : this._oggiSuppMinutes(aw.dayIndex, aw.sessionMinutes);
            end = new Date(start.getTime() + min * 60000);
        } else {
            const done = this._oggiDoneToday();
            if (done && GT.isValidDate(done.date)) {
                end = new Date(done.date);
                start = new Date(end.getTime() - (Number(done.duration) || 0) * 1000);
                approx = false;
            } else {
                const t = this._oggiTrainTime();
                if (t) {
                    start = this._oggiAt(t.time);
                    end = new Date(start.getTime() + this._oggiSuppMinutes() * 60000);
                }
            }
        }
        if (!start || isNaN(start.getTime())) return null;
        if (approx) end = new Date(Math.round(end.getTime() / 300000) * 300000);   // ≈ ai 5 minuti
        return { start, pre: new Date(start.getTime() - this.OGGI_PRE_MIN * 60000), post: end, approx };
    },

    /**
     * Integratori di oggi divisi per momento, nell'ordine del giorno.
     * Riposo: le voci pre/post di tutti i giorni vanno nel loro restWhen, quelle "solo allenamento" no.
     * Non si sa se ti alleni: pre/post (e "solo allenamento") in "Se ti alleni".
     * @returns {null | {key, day, times, total, taken, sections:[{key, label, time, items:[{s, taken, tag}]}]}}
     */
    _oggiSuppPlan() {
        const list = Storage.getSupplements().filter(s => s.active);
        if (!list.length) return null;
        const key = GT.dateKey(new Date());
        const took = Storage.getSupplementsTaken(key);
        const day = this._oggiSuppDay();
        const times = day === 'rest' ? null : this._oggiSuppTimes();
        const fmt = (w) => {
            if (!times) return '';
            if (w === 'pre') return this._oggiHHMM(times.pre);
            if (w === 'post') return (times.approx ? '≈' : '') + this._oggiHHMM(times.post);
            return '';
        };
        const buckets = {};
        const put = (k, s, tag = '') => (buckets[k] = buckets[k] || []).push({ s, taken: !!took[s.id], tag });
        list.forEach(s => {
            const pp = s.when === 'pre' || s.when === 'post';
            if (day === 'rest') {
                if (s.days !== 'allenamento') put(pp ? (s.restWhen || 'pranzo') : s.when, s);
            } else if (day === 'unknown' && (pp || s.days === 'allenamento')) {
                put('ifTrain', s, pp ? [this._oggiSuppWhenLabel(s.when), fmt(s.when)].filter(Boolean).join(' ') : this._oggiSuppWhenLabel(s.when));
            } else put(s.when, s);
        });
        if (buckets.ifTrain) {
            const w = this.OGGI_SUPP_WHEN.map(x => x[0]);
            buckets.ifTrain = buckets.ifTrain.map((it, i) => ({ it, i }))
                .sort((a, b) => (w.indexOf(a.it.s.when) - w.indexOf(b.it.s.when)) || (a.i - b.i)).map(x => x.it);
        }
        const meals = ['colazione', 'pranzo', 'sera'];
        const block = day === 'unknown' ? ['ifTrain'] : ['pre', 'post'];
        let at = day === 'unknown' ? meals.length : 2;   // senza orario: allenamento nel pomeriggio
        if (times) {
            const startMin = times.start.getHours() * 60 + times.start.getMinutes();
            const i = meals.findIndex(m => this.OGGI_SUPP_MEAL_MIN[m] > startMin);
            at = i < 0 ? meals.length : i;
        }
        const order = [...meals.slice(0, at), ...block, ...meals.slice(at)];
        const sections = order.filter(k => buckets[k]?.length).map(k => ({
            key: k,
            label: k === 'ifTrain' ? 'Se ti alleni' : this._oggiSuppWhenLabel(k),
            time: fmt(k),
            items: buckets[k]
        }));
        const all = sections.flatMap(x => x.items);
        return { key, day, times, sections, total: all.length, taken: all.filter(i => i.taken).length };
    },

    // Riga "Integratori 2 di 6" (come quella del cardio): apre il foglio di oggi
    _oggiSuppRow() {
        const row = document.getElementById('oggi-supp');
        if (!row) return;
        const plan = this._safe(() => this._oggiSuppPlan());
        if (!plan || !plan.total) {
            row.hidden = true;
            this._syncOggiRows();
            return;
        }
        const all = plan.taken >= plan.total;
        const title = document.getElementById('oggi-supp-title');
        if (title) {
            title.innerHTML = all
                ? `Integratori presi <span class="oggi-ok">${this.ico('check', 'ico--sm')}</span>`
                : `Integratori <span class="num">${plan.taken}</span> di <span class="num">${plan.total}</span>`;
        }
        const sub = document.getElementById('oggi-supp-sub');
        if (sub) {
            const next = plan.sections.find(x => x.items.some(i => !i.taken));
            sub.innerHTML = next
                ? `${GT.esc(next.label)}${next.time ? ` <span class="num">${GT.esc(next.time)}</span>` : ''}: ${next.items.filter(i => !i.taken).map(i => GT.esc(this._oggiSuppShort(i.s))).join(', ')}`
                : `<span class="num">${plan.total}</span> di <span class="num">${plan.total}</span> oggi`;
        }
        row.hidden = false;
        this._syncOggiRows();
    },

    // Una voce: tocco = presa / non presa (role checkbox)
    _oggiSuppItemHTML(it) {
        const s = it.s;
        const sub = [it.tag, s.amount].filter(Boolean).map(x => GT.esc(x)).join(' · ');
        return `<button type="button" class="sp-item" role="checkbox" aria-checked="${it.taken}" data-sp="${GT.esc(s.id)}">
            <span class="sp-item__mark">${this.ico('check')}</span>
            <span class="sp-item__body"><span class="sp-item__name">${GT.esc(s.name)}</span>${sub ? `<span class="sp-item__sub">${sub}</span>` : ''}</span>
        </button>`;
    },

    _oggiSuppSheetBody(plan) {
        if (!plan || !plan.total) return '<p class="muted">Nessun integratore per oggi</p>';
        return plan.sections.map(sec => `
            <section class="sp-sec" aria-labelledby="sp-h-${sec.key}">
                <h3 class="sp-sec__h" id="sp-h-${sec.key}">${GT.esc(sec.label)}${sec.time ? ` <span class="num">${GT.esc(sec.time)}</span>` : ''}</h3>
                <div class="sp-list">${sec.items.map(it => this._oggiSuppItemHTML(it)).join('')}</div>
            </section>`).join('');
    },

    _oggiSuppCountHTML(plan) {
        return plan && plan.total ? `<span class="num">${plan.taken}</span> di <span class="num">${plan.total}</span>` : '';
    },

    // Foglio di oggi: la lista per momento
    _oggiSuppOpen() {
        const plan = this._oggiSuppPlan();
        const root = this._sheet('oggi-supp-sheet', `
            <div class="sheet__head"><h2>Integratori</h2><span class="sp-count" id="oggi-supp-count">${this._oggiSuppCountHTML(plan)}</span>
                <button type="button" class="btn btn--ghost btn--icon sheet__close" data-sheet-close aria-label="Chiudi gli integratori">${this.ico('close')}</button></div>
            <div class="sp-body" id="oggi-supp-body">${this._oggiSuppSheetBody(plan)}</div>
            <button type="button" class="btn btn--ghost btn--block" data-act="edit">${this.ico('edit')}Modifica</button>`, { cls: 'sp-sheet' });
        root.addEventListener('click', (e) => {
            const it = e.target.closest('[data-sp]');
            if (it) {
                const on = it.getAttribute('aria-checked') !== 'true';
                if (this._save(() => Storage.setSupplementTaken(GT.dateKey(new Date()), it.dataset.sp, on), 'Integratore NON segnato') === false) return;
                it.setAttribute('aria-checked', String(on));
                const now = this._oggiSuppPlan();
                const count = document.getElementById('oggi-supp-count');
                if (count) count.innerHTML = this._oggiSuppCountHTML(now);
                this._oggiSuppRow();
                return;
            }
            if (e.target.closest('[data-act="edit"]')) {
                this._closeSheet('oggi-supp-sheet');
                this.navigateTo('profilo');
                setTimeout(() => document.getElementById('pf-supp')?.scrollIntoView?.({ block: 'start', behavior: this._scrollBehavior() }), 60);
            }
        });
    },

    // Foglio di oggi già aperto (es. orario cambiato): si ridisegna
    _oggiSuppRefreshSheet() {
        const body = document.getElementById('oggi-supp-body');
        if (!body) return;
        const plan = this._oggiSuppPlan();
        body.innerHTML = this._oggiSuppSheetBody(plan);
        const count = document.getElementById('oggi-supp-count');
        if (count) count.innerHTML = this._oggiSuppCountHTML(plan);
    },
});
