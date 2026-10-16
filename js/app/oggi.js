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
                        <div class="today__eyebrow"><span class="cap" id="today-date"></span></div>
                        <div>
                            <h1 class="today__name" id="quick-action-title">Oggi</h1>
                            <p class="today__focus" id="quick-action-subtitle"></p>
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
                            <h2 id="oggi-cycle-title">Ciclo</h2>
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
                        </div>
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

    // Ogni volta che si apre Oggi: dati aggiornati
    enterOggi() {
        this.loadDashboard();
    },

    // ========================================
    // OGGI
    // ========================================

    loadDashboard() {
        [
            () => this.checkReturnFromLayoff(),
            () => this.syncCycleWeekWithCalendar(),
            () => this.updateQuickAction(),
            () => this.updateWeekDays(),
            () => this.updateCycleCard(),
            () => this.updateStats(),
            () => this.updateRecentActivity(),
            () => this.updateOggiConditioning(),
            () => this.updateBackupReminder(),
            () => this.updateEarlyDeload(),
            () => this._maybePromptCycleEnd()
        ].forEach(fn => this._safe(fn));
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

    // Riquadro della seduta di oggi + dock (lo richiamano anche la seduta e la scheda)
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
        const setBtn = (icon, label) => {
            btn.innerHTML = `${this.ico(icon)}<span id="quick-start-label">${GT.esc(label)}</span>`;
        };
        this._setText('today-date', this._oggiTodayLabel());
        focusEl.hidden = false;
        today.hidden = false;
        empty.hidden = true;
        picker.hidden = false;

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

        const phased = this._applyPhase(day);
        const duration = this._estimateDuration(phased, program);
        const n = day.exercises.length;
        const ss = this._oggiSupersetCount(day);
        titleEl.textContent = day.type || day.name || `Giorno ${idx + 1}`;
        focusEl.textContent = this._oggiFocus(day);
        focusEl.hidden = !focusEl.textContent;
        metaEl.innerHTML = [
            `<span class="num">${n}</span>&nbsp;${n === 1 ? 'esercizio' : 'esercizi'}`,
            duration ? `<span class="num">~${duration}</span>&nbsp;min` : '',
            ss ? `${ss} superset` : ''
        ].filter(Boolean).join(' · ');
        thumbsEl.innerHTML = this._oggiThumbs(day.exercises);
        setBtn('play', `Inizia ${day.type || day.name || 'la seduta'}`);
        this._quickAction = 'start';
        this._quickDayIndex = idx;
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
        const program = Storage.getActiveProgram();
        const idx = this.getSuggestedDayIndex(program);
        if (program?.days?.[idx]?.exercises?.length) this.startWorkout(program.days[idx], { dayIndex: idx });
        else this.startScheduledWorkout();
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

        // Sedute ancora da fare: oggi (se non fatta) + giorni dopo, distribuiti con riposi in mezzo
        let remaining = Math.max(0, target - done);
        if (remaining > 0 && !todayDone) remaining--;
        const avail = 6 - todayOffset;
        const planned = new Set();
        if (remaining >= avail) for (let i = 1; i <= avail; i++) planned.add(todayOffset + i);
        else for (let i = 0; i < remaining; i++) planned.add(todayOffset + 1 + Math.floor((i + 1) * avail / (remaining + 1)));

        // Nomi dei prossimi giorni della scheda (per chi legge con lo screen reader)
        const order = [];
        let k = this.getSuggestedDayIndex(program);
        for (let i = 0; i < 7; i++) {
            const d = program.days[k % program.days.length];
            order.push(d?.type || d?.name || '');
            k++;
        }
        let nextName = 0;
        const NAMES = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
        list.innerHTML = NAMES.map((name, i) => {
            const key = GT.dateKey(GT.addDays(monday, i));
            const isToday = key === todayKey;
            const names = doneBy.get(key);
            let cls = 'day--rest';
            let label = 'riposo';
            let dot = '';
            if (names) {
                cls = 'day--done';
                label = `${names.join(', ')} fatto`;
                dot = this.ico('check');
            } else if (isToday) {
                label = `oggi${order[nextName] ? ', ' + order[nextName] : ''}`;
                nextName++;
            } else if (planned.has(i)) {
                cls = 'day--plan';
                label = `previsto${order[nextName] ? ' ' + order[nextName] : ''}`;
                nextName++;
            }
            return `<li class="day ${cls}${isToday ? ' day--today' : ''}"${isToday ? ' aria-current="date"' : ''}><span class="day__dot">${dot}</span><span aria-hidden="true">${name.charAt(0)}</span><span class="sr-only">${name}: ${GT.esc(label)}</span></li>`;
        }).join('');

        const count = document.getElementById('weekly-workout-count');
        if (count) count.innerHTML = `<b class="num oggi-strong">${done}</b> di <span class="num">${target}</span>`;
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
            body.innerHTML = '<p class="muted oggi-note">Dalla prima seduta qui vedi le settimane di allenamento.</p>';
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
        body.innerHTML = `
            <div class="kv">
                <p class="kv__big num">${this.ico('fire', 'ico--lg oggi-fire')}${cur}<small>${cur === 1 ? 'settimana di fila' : 'settimane di fila'}</small></p>
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
        if (!w) {
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
        let prs = 0;
        (w.exercises || []).forEach(ex => (ex?.sets || []).forEach(st => { if (st?.isNewPR && st.completed !== false) prs++; }));
        this._setText('oggi-last-title', w.name || w.type || 'Seduta');
        const sub = document.getElementById('oggi-last-sub');
        if (sub) {
            sub.innerHTML = [
                GT.esc(when),
                min > 0 ? `<span class="num">${min}</span>&nbsp;min` : '',
                prs ? `<span class="oggi-accent">${prs} ${prs === 1 ? 'record' : 'record'}</span>` : ''
            ].filter(Boolean).join(' · ');
        }
        row.dataset.workoutId = w.id != null ? String(w.id) : '';
        row.setAttribute('aria-label', `Ultima seduta: ${w.name || w.type || 'Seduta'}, ${when}. Dettaglio`);
        row.hidden = false;
        this._syncOggiRows();
    },

    // Riga del cardio: "Cardio 0 di 2" + attività consigliata
    updateOggiConditioning() {
        const row = document.getElementById('conditioning-card');
        if (!row) return;
        const program = Storage.getActiveProgram();
        let sug = null;
        try { sug = typeof this._conditioningSuggestion === 'function' ? this._conditioningSuggestion() : null; } catch (e) { sug = null; }
        const target = parseInt(sug?.frequency, 10) || 0;
        if (!program || !sug?.enabled || target <= 0) {
            row.hidden = true;
            this._syncOggiRows();
            return;
        }
        const done = Storage.getConditioningThisWeek().length;
        const type = String(sug.preferredType || 'LISS').toLowerCase();
        const pick = type === 'mixed' ? (done % 2 === 0 ? 'hiit' : 'liss') : (type === 'hiit' ? 'hiit' : 'liss');
        const minutes = parseInt(sug.duration, 10) || (pick === 'hiit' ? 20 : 30);
        let activity = 'HIIT';
        if (pick === 'liss') {
            const a = (typeof LISS_ACTIVITIES !== 'undefined' && LISS_ACTIVITIES['walking-incline']?.name) || 'Camminata in salita';
            activity = a.charAt(0).toUpperCase() + a.slice(1).toLowerCase();
        }
        const title = document.getElementById('conditioning-title');
        if (title) {
            title.innerHTML = done >= target
                ? `Cardio fatto <span class="oggi-ok">${this.ico('check', 'ico--sm')}</span>`
                : `Cardio <span class="num">${done}</span> di <span class="num">${target}</span>`;
        }
        const sub = document.getElementById('conditioning-subtitle');
        if (sub) {
            sub.innerHTML = done >= target
                ? `<span class="num">${done}</span> di <span class="num">${target}</span> questa settimana`
                : `${GT.esc(activity)} · <span class="num">${minutes}</span>&nbsp;min`;
        }
        const icon = document.getElementById('conditioning-icon');
        if (icon) icon.innerHTML = this.ico(pick === 'hiit' ? 'bolt' : 'steps');
        const btn = document.getElementById('conditioning-btn');
        if (btn) btn.setAttribute('aria-label', `Inizia il cardio: ${activity}`);
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
            try { target?.scrollIntoView({ block: 'start', behavior: 'smooth' }); } catch (e) { /* no-op */ }
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
        Storage.startManualDeload();
        this._oggiSetEarlyState('accepted');
        this.showNotification('Scarico per 7 giorni', 'info', { icon: 'deload' });
        this.loadDashboard();
        this._safe(() => this.loadPrograms());
        this._safe(() => this.loadProgressCycleInfo());
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

    // Minuti stimati del giorno (per le schede vecchie conta la durata scelta)
    _estimateDuration(day, program = undefined) {
        try {
            const md = (program === undefined ? Storage.getActiveProgram() : program)?.metadata || {};
            const ctx = {};
            if (md.goal) ctx.goal = md.goal;
            if (parseInt(md.sessionDuration, 10) > 0) ctx.minutes = parseInt(md.sessionDuration, 10);
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
        const res = Storage.advanceCycleWeek();
        if (res) this.showNotification(`Settimana ${res.currentWeek} · ${this._oggiPhaseLabel(res.currentPhase)}`, 'success', { icon: 'cycle' });
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
        Storage.startManualDeload();
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
        if (typeof Storage.stopManualDeload === 'function') Storage.stopManualDeload();
        this.showNotification('Scarico terminato', 'info', { icon: 'deload' });
        this._oggiAfterCycle();
    },

    _oggiAfterCycle() {
        this._safe(() => this.updateCycleCard());
        this._safe(() => this.updateQuickAction());
        this._safe(() => this.updateEarlyDeload());
        this._safe(() => this.loadPrograms());
        this._safe(() => this.loadProgressCycleInfo());
    },

    // Riepilogo di fine ciclo quando serve (una volta per apertura dell'app se si rimanda)
    _maybePromptCycleEnd() {
        if (this.activeWorkout || this._cycleSummaryDismissed || this.currentPage !== 'oggi') return;
        if (document.querySelector('#cycle-summary-modal, #rotation-detail-modal, #confirm-sheet')) return;
        if (!this._shouldCompleteCycle()) return;
        this.completeCycleWithSummary();
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

        this.loadPrograms();
        this.loadDashboard();
        this._safe(() => this.loadProgress());
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
            this._cycleSummaryDismissed = false;
            this.completeCycleWithSummary();
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
        const cycleInfo = Storage.advanceCycleWeek();
        if (cycleInfo) this.showNotification(`Settimana ${cycleInfo.currentWeek} · ${this._oggiPhaseLabel(cycleInfo.currentPhase)}`, 'success', { icon: 'cycle' });
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
            const info = Storage.advanceCycleWeek();
            this.showNotification(`Settimana ${info?.currentWeek || ''} · Scarico`, 'info', { icon: 'deload' });
        } else {
            Storage.startManualDeload();
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

    OB_GOALS: [
        ['toning', 'Tonificazione', 'Glutei e gambe in primo piano', 'm-glutes'],
        ['hypertrophy', 'Ipertrofia', 'Più muscolo', 'm-arms'],
        ['recomp', 'Ricomposizione', 'Meno grasso, più muscolo', 'scale'],
        ['strength', 'Forza', 'Carichi più alti, poche ripetizioni', 'barbell'],
        ['endurance', 'Resistenza', 'Tante ripetizioni, recuperi brevi', 'heart']
    ],

    OB_PLACES: {
        gym: { label: 'Palestra completa', sub: 'Macchine, cavi, bilancieri', icon: 'machine', eq: ['bilanciere', 'manubri', 'macchine', 'cavi', 'panca', 'sbarra'] },
        home: { label: 'A casa con manubri', sub: 'Manubri, panca, elastici', icon: 'dumbbell', eq: ['manubri', 'panca', 'accessori'] },
        body: { label: 'Corpo libero', sub: 'Niente attrezzi', icon: 'bodyweight', eq: [] }
    },

    OB_EQUIP: [
        ['bilanciere', 'Bilanciere', 'barbell'], ['manubri', 'Manubri', 'dumbbell'], ['macchine', 'Macchine', 'machine'],
        ['cavi', 'Cavi', 'cable'], ['panca', 'Panca', 'bench'], ['sbarra', 'Sbarra', 'pullup'],
        ['parallele', 'Parallele', 'bodyweight'], ['accessori', 'Elastici', 'band']
    ],

    OB_PAIN: [['shoulder', 'Spalle'], ['elbow', 'Gomiti'], ['knee', 'Ginocchia'], ['lowBack', 'Schiena', 'Schiena bassa']],

    OB_LEVELS: [['beginner', 'Inizio ora'], ['intermediate', '1-3 anni'], ['advanced', '3+ anni']],

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

    canOnboarding() {
        return true;
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
        const min0 = regen ? parseInt(md.sessionDuration, 10) : null;
        const eq = Array.isArray(profile.equipment) ? profile.equipment.filter(e => this.OB_EQUIP.some(x => x[0] === e)) : this.OB_PLACES.gym.eq.slice();
        this._ob = {
            first: regen ? 2 : 1,
            step: regen ? 2 : 1,
            regen,
            hasName,
            name: String(profile.name || ''),
            gender: ['male', 'female'].includes(profile.gender) ? profile.gender : '',
            level: profile.level || 'beginner',
            level0: profile.level || 'beginner',
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
            const lvIdx = s.level === 'expert' ? 'advanced' : s.level;
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
                        ${this._obRadio('level', lvIdx, this.OB_LEVELS, (it, a) => `<button type="button" ${a}>${it[1]}</button>`)}
                    </div>
                </div>`;
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
                    ${this.OB_PAIN.map(([v, l, full]) => `<button class="chip" type="button" aria-pressed="${s.pain.has(v)}" data-ob-pain="${v}"${full ? ` aria-label="${full}"` : ''}>${l}</button>`).join('')}
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
                else this._obExit();
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
        const field = key === 'name' ? document.getElementById('ob-name') : document.querySelector('#ob-body [aria-labelledby="ob-sex-l"]');
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
            // "3+ anni" tiene "expert" se il profilo era già così
            s.level = v === 'advanced' && s.level0 === 'expert' ? 'expert' : v;
        } else if (group === 'goal') {
            s.goal = v;
        } else if (group === 'days' || group === 'minutes') {
            s[group] = parseInt(v, 10);
            s.touched[group] = true;
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
        if (s.step < 4) {
            s.step++;
            this._obRender(true);
            return;
        }
        this._obFinish();
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
                equipment: this.OB_EQUIP.map(e => e[0]).filter(e => s.equipment.has(e)),
                painAreas: this.OB_PAIN.map(p => p[0]).filter(p => s.pain.has(p))
            };
            if (Storage.saveProfile(patch) === false) {
                this.showNotification('Memoria piena: profilo non salvato', 'error');
                return;
            }
            const profile = Storage.getProfile();
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
            if (Storage.setActiveProgram(program) === false) {
                this.showNotification('Memoria piena: scheda non salvata', 'error');
                return;
            }
            const regen = !!existing?.days?.length;
            this._ob = null;
            this._onboardingDismissed = false;
            this._cycleSummaryDismissed = false;
            this._schedaOpen = null;
            this._safe(() => this.loadProfile());
            this._safe(() => this.loadPrograms());
            this._safe(() => this.loadProgress());
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
