/**
 * GymTracker 2.0 — area OGGI: dashboard, ciclo (mesociclo), scelta del giorno,
 * proposte dopo la seduta (avanzamento settimana, scarico, fine ciclo), primo avvio.
 */

Object.assign(App, {
    // ========================================
    // GUSCIO DELL'AREA: markup della pagina e dei fogli, listener, ingresso nella pagina
    // ========================================

    // Pagina #oggi (montata una volta in <section id="page-oggi">)
    htmlOggi() {
        const day = (d, l, name) => `<li class="day" data-day="${d}"><span class="day__dot" aria-hidden="true"></span>${l}<span class="sr-only">${name}</span></li>`;
        return `
            <section class="today" id="quick-action" aria-labelledby="quick-action-title">
                <div class="today__eyebrow"><span class="cap" id="greeting">Buongiorno</span></div>
                <div>
                    <h1 class="today__name" id="quick-action-title">Pronto per allenarti?</h1>
                    <p class="today__focus" id="quick-action-subtitle">Nessuna scheda attiva</p>
                </div>
            </section>

            <div class="dock" role="region" aria-label="Seduta di oggi">
                <div class="dock__row">
                    <button type="button" class="btn btn--primary btn--xl" id="quick-start-btn">${this.ico('play')}Inizia</button>
                    <button type="button" class="btn btn--secondary btn--icon btn--xl" id="quick-daypicker-btn" aria-label="Scegli un altro giorno">${this.ico('calendar')}</button>
                </div>
            </div>

            <section class="section" aria-labelledby="oggi-week-title">
                <div class="section__head">
                    <h2 id="oggi-week-title">Settimana</h2>
                    <span class="muted num" id="weekly-workout-count">0/4 sessioni</span>
                </div>
                <ol class="week" id="week-days">
                    ${day(1, 'L', 'unedì')}${day(2, 'M', 'artedì')}${day(3, 'M', 'ercoledì')}${day(4, 'G', 'iovedì')}${day(5, 'V', 'enerdì')}${day(6, 'S', 'abato')}${day(0, 'D', 'omenica')}
                </ol>
            </section>

            <div class="group" id="conditioning-card" style="display: none;">
                <div class="row">
                    <span class="row__icon">${this.ico('bolt')}</span>
                    <span class="row__body">
                        <span class="row__title" id="conditioning-title">Cardio</span>
                        <span class="row__sub" id="conditioning-subtitle">0/0 questa settimana</span>
                    </span>
                    <button type="button" class="btn btn--secondary btn--sm" id="conditioning-btn">Inizia</button>
                </div>
            </div>

            <section class="section" aria-labelledby="oggi-cycle-title">
                <div class="section__head"><h2 id="oggi-cycle-title">Ciclo</h2></div>
                <div class="cycle-compact" id="cycle-card">
                    <div id="cycle-info-content"><p class="muted">Genera una scheda</p></div>
                </div>
            </section>

            <section class="section" aria-labelledby="oggi-stats-title">
                <div class="section__head"><h2 id="oggi-stats-title">Numeri</h2></div>
                <div class="stats" style="--n: 4">
                    <div class="stat"><span class="stat__v num" id="stat-streak">0</span><span class="stat__k">Settimane</span></div>
                    <div class="stat"><span class="stat__v num" id="stat-workouts">0</span><span class="stat__k">Sedute</span></div>
                    <div class="stat"><span class="stat__v num" id="stat-volume">0</span><span class="stat__k">Volume</span></div>
                    <div class="stat"><span class="stat__v num" id="stat-prs">0</span><span class="stat__k">Record</span></div>
                </div>
            </section>

            <section class="section" aria-labelledby="oggi-body-title">
                <div class="section__head"><h2 id="oggi-body-title">Corpo</h2></div>
                <div class="group" id="body-stats-content">
                    <div class="row"><span class="row__body"><span class="row__title">Peso</span></span><strong class="row__end num" id="body-weight">--</strong></div>
                    <div class="row"><span class="row__body"><span class="row__title">Grasso</span></span><strong class="row__end num" id="body-fat">--</strong></div>
                    <div class="row"><span class="row__body"><span class="row__title">Massa magra</span></span><strong class="row__end num" id="body-lean">--</strong></div>
                </div>
            </section>

            <section class="section" aria-labelledby="oggi-recent-title">
                <div class="section__head">
                    <h2 id="oggi-recent-title">Ultime sedute</h2>
                    <a class="link" href="#progressi" data-page="progressi">Storico${this.ico('next', 'ico--sm')}</a>
                </div>
                <ul class="activity-list-compact" id="activity-list">
                    <li class="muted">Ancora nessuna seduta</li>
                </ul>
            </section>
        `;
    },

    // Fogli dell'area: scelta del giorno
    sheetsOggi() {
        return `
            <div class="modal" id="day-picker-modal">
                <section class="sheet" role="dialog" aria-modal="true" aria-labelledby="day-picker-title">
                    <span class="sheet__grip" aria-hidden="true"></span>
                    <div class="sheet__head">
                        <h2 id="day-picker-title">Quale seduta?</h2>
                        <button type="button" class="btn btn--ghost btn--icon sheet__close" onclick="App.closeDayPicker()" aria-label="Chiudi la scelta del giorno">${this.ico('close')}</button>
                    </div>
                    <div id="day-picker-list" class="day-picker-list"></div>
                    <button type="button" class="btn btn--ghost btn--block" id="day-picker-free">${this.ico('dumbbell')}Seduta libera</button>
                </section>
            </div>
        `;
    },

    bindOggi() {
        const on = (id, ev, fn) => this._on(id, ev, fn);
        // Day picker
        this._closeOnBackdrop('day-picker-modal', () => this.closeDayPicker());
        on('quick-daypicker-btn', 'click', () => this.startScheduledWorkout());
        on('day-picker-free', 'click', () => {
            this.closeDayPicker();
            this.startFreeWorkout();
        });
    },

    // Ogni volta che si apre Oggi: dati aggiornati
    enterOggi() {
        this.loadDashboard();
    },

    // ========================================
    // DASHBOARD
    // ========================================

    loadDashboard() {
        [
            () => this.checkReturnFromLayoff(),
            () => this.syncCycleWeekWithCalendar(),
            () => this.updateGreeting(),
            () => this.updateStats(),
            () => this.updateWeekDays(),
            () => this.updateQuickAction(),
            () => this.updateRecentActivity(),
            () => this.updateBodyStats(),
            () => this.updateCycleCard(),
            () => this.updateWeeklyCount(),
            () => this.updateConditioningCard(),
            () => this._maybePromptCycleEnd()
        ].forEach(fn => this._safe(fn));
    },

    updateGreeting() {
        const hour = new Date().getHours();
        const profile = Storage.getProfile();
        let greeting = hour < 12 ? 'Buongiorno' : hour < 18 ? 'Buon pomeriggio' : 'Buonasera';
        greeting += profile.name ? `, ${profile.name}!` : '!';
        this._setText('greeting', greeting);
    },

    updateStats() {
        const stats = Storage.getStatistics();
        const streak = Storage.getStreak();

        // Streak a SETTIMANE: settimane di fila con almeno `target` allenamenti
        const streakEl = this._setText('stat-streak', streak.current || 0);
        if (streakEl) {
            streakEl.title = `Settimane di fila con almeno ${streak.target || 1} allenamenti`;
        }
        this._setText('stat-workouts', stats.totalWorkouts || 0);
        this._setText('stat-volume', GT.formatVolume(stats.totalVolume || 0));
        this._setText('stat-prs', stats.totalPRs ?? stats.prCount ?? 0);
    },

    // Settimana da lunedì a domenica (D2): segna i giorni con allenamento e oggi
    updateWeekDays() {
        const monday = GT.startOfWeek(new Date());
        const todayStr = new Date().toDateString();
        const workoutDays = new Set(Storage.getWorkouts().map(w => new Date(w.date).toDateString()));

        document.querySelectorAll('#week-days .day').forEach(el => {
            const dayNum = parseInt(el.dataset.day);           // 0 = domenica … 6 = sabato
            const offset = (dayNum + 6) % 7;                    // lunedì = 0 … domenica = 6
            const date = new Date(monday);
            date.setDate(monday.getDate() + offset);
            const dateStr = date.toDateString();
            el.classList.toggle('completed', workoutDays.has(dateStr));
            el.classList.toggle('today', dateStr === todayStr);
        });
    },

    updateQuickAction() {
        const titleEl = document.getElementById('quick-action-title');
        const subtitleEl = document.getElementById('quick-action-subtitle');
        const btnEl = document.getElementById('quick-start-btn');
        if (!titleEl || !subtitleEl || !btnEl) return;

        // Sessione in corso: il bottone la riprende, non ne apre un'altra (C2)
        if (this.activeWorkout) {
            titleEl.textContent = `${this.activeWorkout.name} in corso`;
            subtitleEl.textContent = `${this._completedSetsCount()} serie fatte`;
            btnEl.innerHTML = `${this.ico('play')}Riprendi`;
            btnEl.onclick = () => this.navigateTo('seduta');
            return;
        }

        const program = Storage.getActiveProgram();
        if (!program || !program.days?.length) {
            titleEl.textContent = 'Crea la tua scheda';
            subtitleEl.textContent = 'Generala o costruiscila a mano';
            btnEl.innerHTML = `${this.ico('plan')}Scheda`;
            btnEl.onclick = () => this.navigateTo('scheda');
            return;
        }

        const nextWorkout = program.days[this.getSuggestedDayIndex(program)];
        if (!nextWorkout) {
            titleEl.textContent = 'Allenamento libero';
            subtitleEl.textContent = 'Scegli tu gli esercizi';
            btnEl.innerHTML = `${this.ico('dumbbell')}Libero`;
            btnEl.onclick = () => { this.navigateTo('seduta'); this.startFreeWorkout(); };
            return;
        }

        const duration = this._estimateDuration(this._applyPhase(nextWorkout));
        titleEl.textContent = nextWorkout.type || nextWorkout.name;
        subtitleEl.textContent = `${nextWorkout.exercises.length} esercizi • ~${duration} min`;
        btnEl.innerHTML = `${this.ico('play')}Inizia`;
        btnEl.onclick = () => {
            this.navigateTo('seduta');
            this.openDayPicker(program);
        };
    },

    _estimateDuration(day) {
        try {
            return TrainingAlgorithm.estimateWorkoutDuration(day) || 0;
        } catch (e) {
            return 0;
        }
    },

    updateWeeklyCount() {
        const weeklyWorkouts = Storage.getWorkoutsThisWeek();
        const program = Storage.getActiveProgram();
        const profile = Storage.getProfile();
        const target = program?.metadata?.daysPerWeek || program?.days?.length || profile.daysPerWeek || 3;
        this._setText('weekly-workout-count', `${weeklyWorkouts.length}/${target} sessioni`);
    },

    updateRecentActivity() {
        const container = document.getElementById('activity-list');
        if (!container) return;
        const recentWorkouts = Storage.getRecentWorkouts(3);

        if (recentWorkouts.length === 0) {
            container.innerHTML = '<li class="empty-state-mini">Completa il tuo primo allenamento!</li>';
            return;
        }

        container.innerHTML = recentWorkouts.map(workout => {
            const dateStr = GT.formatRelativeDay(new Date(workout.date));
            const duration = Math.round((workout.duration || 0) / 60);
            return `
                <li>
                    <strong>${GT.esc(workout.name || 'Allenamento')}</strong>
                    <span style="color: var(--text-muted); margin-left: auto;">${GT.esc(dateStr)} • ${duration} min</span>
                </li>
            `;
        }).join('');
    },

    updateBodyStats() {
        const profile = Storage.getProfile();
        const weight = parseFloat(profile.weight);
        const bodyFat = parseFloat(profile.bodyFat);

        if (!weight) {
            ['body-weight', 'body-fat', 'body-lean'].forEach(id => this._setText(id, '--'));
            return;
        }

        const leanMass = bodyFat ? Math.round(weight * (1 - bodyFat / 100)) : null;
        this._setText('body-weight', `${weight} kg`);
        this._setText('body-fat', bodyFat ? `${bodyFat}%` : '--');
        this._setText('body-lean', leanMass ? `${leanMass} kg` : '--');
    },

    // ========================================
    // CICLO (mesociclo): card, calendario, deload, chiusura con rotazione
    // ========================================

    // Fase da applicare oggi: con il deload manuale attivo vale la fase di deload
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

    // Copia del giorno con le serie della fase (A4). Allenamento libero e simulazione: nessuna fase.
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
        // Ripiego: stessa regola del contratto, serie = max(2, round(serie × moltiplicatore))
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

    _shouldCompleteCycle() {
        try {
            return !!Storage.shouldCompleteCycle();
        } catch (e) {
            return false;
        }
    },

    updateCycleCard() {
        const container = document.getElementById('cycle-info-content');
        const card = document.getElementById('cycle-card');
        if (!container) return;

        const cycleInfo = Storage.getCycleInfo();
        if (!cycleInfo) {
            container.innerHTML = '<p class="empty-state-mini">Genera una scheda</p>';
            card?.classList.remove('deload-active');
            return;
        }

        const isDeload = Storage.isDeloadActive();
        const phase = this._currentPhase(cycleInfo, isDeload);
        const rir = phase?.rirTarget ? `${phase.rirTarget.min}-${phase.rirTarget.max}` : '—';
        const week = cycleInfo.currentWeek;
        const canClose = cycleInfo.isLastWeek || this._shouldCompleteCycle();
        card?.classList.toggle('deload-active', isDeload);

        container.innerHTML = `
            <div class="cycle-compact-info">
                <div class="cycle-week-compact">
                    <strong>Sett. ${week}/${cycleInfo.duration}</strong>
                </div>
                <div class="cycle-phase-compact ${isDeload ? 'deload' : ''}">
                    ${GT.esc(isDeload ? 'Deload' : (phase?.phaseName || ''))}
                </div>
                <div class="cycle-bar-mini">
                    <div class="cycle-bar-fill" style="width: ${Math.max(0, Math.min(100, cycleInfo.progress || 0))}%"></div>
                </div>
                <div class="cycle-rir-compact">RIR ${GT.esc(rir)}</div>
            </div>
            <div class="cycle-card-actions" style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;">
                ${canClose
                    ? '<button type="button" class="btn btn--primary btn--sm" onclick="App.completeCycleWithSummary()">Chiudi ciclo</button>'
                    : `<button type="button" class="btn btn--secondary btn--sm" onclick="App.advanceCycleWeek()" aria-label="Passa alla settimana ${week + 1}">Sett. ${week + 1} ›</button>`}
                ${isDeload ? '' : '<button type="button" class="btn btn--secondary btn--sm" onclick="App.startDeloadNow()">Deload</button>'}
            </div>
        `;
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

        this.showNotification(`Bentornato dopo ${Math.round(daysAgo / 7)} settimane: ciclo da capo, pesi più leggeri`, 'info');
    },

    // Avanza la settimana del ciclo seguendo il calendario (stessa regola di Storage.shouldCompleteCycle).
    // Non va oltre l'ultima settimana: la chiusura passa da Storage.shouldCompleteCycle().
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
        this.showNotification(`Settimana ${info.currentWeek}/${info.duration} · ${phase?.phaseName || ''}`, 'info');
    },

    advanceCycleWeek() {
        const info = Storage.getCycleInfo();
        if (!info) return;
        if (info.currentWeek >= info.duration) {
            this.completeCycleWithSummary();
            return;
        }
        const next = (info.phases || []).find(p => p.week === info.currentWeek + 1);
        if (!confirm(`Passare alla settimana ${info.currentWeek + 1}? ${next?.phaseName || ''}`.trim())) return;

        const res = Storage.advanceCycleWeek();
        if (res) {
            this.showNotification(`Settimana ${res.currentWeek} · ${res.currentPhase?.phaseName || ''}`, 'success');
        }
        this.updateCycleCard();
        this.updateQuickAction();
        this._safe(() => this.loadProgressCycleInfo());
    },

    // Deload anticipato: 7 giorni, poi scade da solo (A2)
    startDeloadNow() {
        if (!Storage.getCycleInfo()) return;
        if (!confirm('Deload per 7 giorni? Serie ridotte, RIR alto')) return;
        Storage.startManualDeload();
        this.showNotification('Deload attivo per 7 giorni', 'info');
        this.updateCycleCard();
        this.updateQuickAction();
        this._safe(() => this.loadProgressCycleInfo());
    },

    // Mostra il riepilogo di fine ciclo quando serve (una volta per apertura dell'app se si rimanda)
    _maybePromptCycleEnd() {
        if (this.activeWorkout || this._cycleSummaryDismissed) return;
        if (document.querySelector('.cycle-summary-modal, .progression-summary-modal, .week-advance-modal, .deload-suggestion-modal')) return;
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
        const goalLabel = this._goalLabel(program?.metadata?.goal) || 'Allenamento';

        const html = `
            <div class="cycle-summary-modal" id="cycle-summary-modal">
                <div class="cycle-summary-content">
                    <div class="cycle-summary-header">
                        <h2>${this.ico('trophy')} Ciclo completato</h2>
                        <p>${cycleInfo.duration} settimane · ${GT.esc(goalLabel)}</p>
                    </div>

                    <div class="cycle-summary-stats">
                        <div class="summary-stat-card">
                            <div class="stat-value">${stats.totalWorkouts || 0}</div>
                            <div class="stat-label">Allenamenti</div>
                        </div>
                        <div class="summary-stat-card">
                            <div class="stat-value">${GT.esc(GT.formatVolume(stats.totalVolume || 0))}</div>
                            <div class="stat-label">Volume</div>
                        </div>
                        <div class="summary-stat-card">
                            <div class="stat-value">${stats.totalSets || 0}</div>
                            <div class="stat-label">Serie</div>
                        </div>
                        ${stats.prsAchieved > 0 ? `
                            <div class="summary-stat-card highlight">
                                <div class="stat-value">${stats.prsAchieved}</div>
                                <div class="stat-label">PR</div>
                            </div>
                        ` : ''}
                    </div>

                    ${progress ? `
                        <div class="cycle-progress-comparison">
                            <div class="progress-comparison-row">
                                <span class="label">Volume 1ª settimana</span>
                                <span class="value">${GT.esc(GT.formatVolume(progress.firstWeekVolume || 0))}</span>
                            </div>
                            <div class="progress-comparison-row">
                                <span class="label">Ultima settimana</span>
                                <span class="value">${GT.esc(GT.formatVolume(progress.currentWeekVolume || 0))}</span>
                            </div>
                            <div class="progress-comparison-result ${progress.volumeChangePercent >= 0 ? 'positive' : 'negative'}">
                                ${this.ico(progress.volumeChangePercent >= 0 ? 'arrow-up' : 'arrow-down', 'ico--sm')} ${Math.abs(progress.volumeChangePercent || 0)}%
                            </div>
                        </div>
                    ` : ''}

                    ${stats.avgRir != null ? `
                        <div class="cycle-rir-summary">
                            <span class="label">RIR medio</span>
                            <span class="value">${GT.esc(stats.avgRir)}</span>
                        </div>
                    ` : ''}

                    <div class="cycle-summary-actions">
                        <button type="button" class="btn btn--primary btn--xl" onclick="App.confirmCompleteCycle()">Nuovo ciclo</button>
                        <button type="button" class="btn btn--secondary" onclick="App.closeCycleSummary()">Dopo</button>
                    </div>
                </div>
            </div>
        `;

        this._showDynamicModal('cycle-summary-modal', html);
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
            this.showNotification(`Ciclo ${cycleNumber} iniziato`, 'success');
        }

        this.loadPrograms();
        this.loadDashboard();
        this._safe(() => this.loadProgress());
    },

    // Nome leggibile di una voce della rotazione (id oppure {id, name})
    _rotationName(item) {
        if (item == null) return '';
        if (typeof item === 'string') return EXERCISES_DB[item]?.name || item;
        return item.name || EXERCISES_DB[item.id || item.exerciseId]?.name || item.id || item.exerciseId || '';
    },

    showRotationDetail(rotation, cycleNumber) {
        const added = (rotation?.added || []).map(e => `<div class="rotation-item rotation-added">+ ${GT.esc(this._rotationName(e))}</div>`).join('');
        const removed = (rotation?.removed || []).map(e => `<div class="rotation-item rotation-removed">− ${GT.esc(this._rotationName(e))}</div>`).join('');

        const html = `
            <div class="cycle-summary-modal" id="rotation-detail-modal">
                <div class="cycle-summary-content">
                    <div class="cycle-summary-header">
                        <h2>Ciclo ${GT.esc(cycleNumber)}: esercizi nuovi</h2>
                    </div>
                    <div style="padding: 1rem;">
                        ${added ? `<h4 style="margin-bottom: 0.5rem;">Entrano</h4>${added}` : ''}
                        ${removed ? `<h4 style="margin: 0.75rem 0 0.5rem;">Escono</h4>${removed}` : ''}
                    </div>
                    <div class="cycle-summary-actions">
                        <button type="button" class="btn btn--primary" onclick="App._removeDynamicModal('rotation-detail-modal')">OK</button>
                    </div>
                </div>
            </div>
        `;
        this._showDynamicModal('rotation-detail-modal', html);
    },

    closeCycleSummary() {
        this._removeDynamicModal('cycle-summary-modal');
        this._cycleSummaryDismissed = true;   // non riproporlo a ogni ritorno in dashboard
    },

    startScheduledWorkout() {
        if (this.activeWorkout) {
            this._promptActiveSession();
            return;
        }
        const program = Storage.getActiveProgram();
        if (!program) {
            this.showNotification('Nessuna scheda attiva', 'warning');
            return;
        }
        if (!program.days?.length) {
            this.showNotification('La scheda non ha giorni', 'warning');
            return;
        }
        this.openDayPicker(program);
    },

    openDayPicker(program) {
        if (this.activeWorkout) {
            this._promptActiveSession();
            return;
        }
        const container = document.getElementById('day-picker-list');
        if (!container || !program?.days?.length) return;
        const suggestedIndex = this.getSuggestedDayIndex(program);
        const cycleInfo = Storage.getCycleInfo();
        const phase = this._currentPhase(cycleInfo, Storage.isDeloadActive());

        container.innerHTML = program.days.map((day, i) => {
            const exerciseCount = day.exercises ? day.exercises.length : 0;
            const empty = exerciseCount === 0;
            const isSuggested = i === suggestedIndex && !empty;
            const duration = empty ? 0 : this._estimateDuration(this._applyPhase(day, phase));

            const muscles = new Set();
            (day.exercises || []).forEach(ex => {
                (EXERCISES_DB[ex.exerciseId]?.primaryMuscles || []).forEach(m => muscles.add(m));
            });
            const muscleList = [...muscles].slice(0, 4).join(', ');
            const label = day.type || day.name || 'Giorno ' + (i + 1);

            return `
                <div class="day-picker-item ${isSuggested ? 'day-picker-suggested' : ''} ${empty ? 'day-picker-empty' : ''}"
                    ${empty ? 'aria-disabled="true" style="opacity:0.5;cursor:not-allowed;"' : `tabindex="0" role="button" onclick="App.selectWorkoutDay(${i})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();App.selectWorkoutDay(${i});}"`}>
                    <div class="day-picker-item-header">
                        <span class="day-picker-day-name">${GT.esc(label)}</span>
                        ${isSuggested ? '<span class="day-picker-badge">Consigliato</span>' : ''}
                    </div>
                    <div class="day-picker-item-details">
                        <span>${empty ? 'Nessun esercizio' : `${exerciseCount} esercizi`}</span>
                        ${empty ? '' : `<span>~${duration} min</span>`}
                    </div>
                    ${muscleList ? `<div class="day-picker-muscles">${GT.esc(muscleList)}</div>` : ''}
                </div>
            `;
        }).join('');

        this._openModal('day-picker-modal', '.day-picker-suggested, .day-picker-item[tabindex="0"]');
    },

    // Giorno consigliato = quello dopo l'ultimo fatto di QUESTA scheda (N13)
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
        // Salta i giorni vuoti
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
        this.closeDayPicker();
        this.startWorkout(day, { dayIndex });
    },

    closeDayPicker() {
        this._closeModal('day-picker-modal');
    },

    // ========================================
    // DOPO L'ALLENAMENTO: fine ciclo, avanzamento settimana, deload
    // ========================================

    // Si chiama alla chiusura del riepilogo: un avviso alla volta, mai sopra un altro
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

    showWeekAdvancementSuggestion(cycleInfo, nextPhase) {
        const isNextDeload = nextPhase?.phase === 'deload';
        const html = `
            <div class="week-advance-modal" id="week-advance-modal">
                <div class="week-advance-content">
                    <h3>Settimana ${cycleInfo.currentWeek} completata</h3>
                    <div class="week-advance-info">
                        <span class="current-week">Sett. ${cycleInfo.currentWeek}</span>
                        <span class="arrow">→</span>
                        <span class="next-week ${isNextDeload ? 'deload' : ''}">
                            Sett. ${cycleInfo.currentWeek + 1} · ${GT.esc(nextPhase?.phaseName || '')}
                        </span>
                    </div>
                    <div class="week-advance-actions">
                        <button type="button" class="btn btn--primary" onclick="App.confirmWeekAdvancement()">Avanza</button>
                        <button type="button" class="btn btn--secondary" onclick="App.dismissWeekAdvancement()">Resta</button>
                    </div>
                </div>
            </div>
        `;
        this._showDynamicModal('week-advance-modal', html);
    },

    confirmWeekAdvancement() {
        this._removeDynamicModal('week-advance-modal');
        const cycleInfo = Storage.advanceCycleWeek();
        if (cycleInfo) {
            this.showNotification(`Settimana ${cycleInfo.currentWeek} · ${cycleInfo.currentPhase?.phaseName || ''}`, 'success');
        }
        this.updateCycleCard();
        this.updateQuickAction();
    },

    dismissWeekAdvancement() {
        this._removeDynamicModal('week-advance-modal');
    },

    checkDeloadSuggestion() {
        const cycleInfo = Storage.getCycleInfo();
        if (!cycleInfo || Storage.isDeloadActive()) return;

        // Una proposta per settimana di ciclo, non a ogni allenamento
        const key = `${Storage.getActiveProgram()?.metadata?.programId || ''}-${cycleInfo.cycleNumber || ''}-${cycleInfo.currentWeek}`;
        if (this._deloadSuggestedKey === key) return;

        const currentPhase = cycleInfo.currentPhase || {};
        const nextDeload = (cycleInfo.phases || []).find(p => p.week > cycleInfo.currentWeek && p.phase === 'deload');
        const weeksToDeload = nextDeload ? nextDeload.week - cycleInfo.currentWeek : null;

        if (weeksToDeload === 1) {
            this._deloadSuggestedKey = key;
            this.showDeloadSuggestion('prossima', 'Settimana prossima: deload. Anticiparlo?');
            return;
        }

        if (currentPhase.phase === 'intensification') {
            // RIR molto bassi nelle ultime sessioni → deload anticipato
            const lowRirCount = Storage.getRecentWorkouts(3).filter(w => {
                const rirs = [];
                (w.exercises || []).forEach(ex => (ex.sets || []).forEach(s => {
                    if (s.completed !== false && Number.isFinite(s.rir)) rirs.push(s.rir);
                }));
                if (!rirs.length) return false;
                return rirs.reduce((a, b) => a + b, 0) / rirs.length <= 1;
            }).length;

            if (lowRirCount >= 2) {
                this._deloadSuggestedKey = key;
                this.showDeloadSuggestion('anticipato', 'RIR molto bassi nelle ultime sessioni. Deload per 7 giorni?');
            }
        }
    },

    showDeloadSuggestion(type, message) {
        const html = `
            <div class="deload-suggestion-modal" id="deload-suggestion-modal">
                <div class="deload-suggestion-content">
                    <h3>${this.ico('deload')} Deload</h3>
                    <p>${GT.esc(message)}</p>
                    <div class="deload-suggestion-actions">
                        <button type="button" class="btn btn--primary" onclick="App.acceptDeloadSuggestion('${type === 'prossima' ? 'prossima' : 'anticipato'}')">Sì</button>
                        <button type="button" class="btn btn--secondary" onclick="App.dismissDeloadSuggestion()">Non ora</button>
                    </div>
                </div>
            </div>
        `;
        this._showDynamicModal('deload-suggestion-modal', html);
    },

    // 'prossima': si passa subito alla settimana di deload del ciclo.
    // 'anticipato': deload manuale di 7 giorni che scade da solo (A2).
    acceptDeloadSuggestion(type = 'anticipato') {
        this._removeDynamicModal('deload-suggestion-modal');
        if (type === 'prossima') {
            const info = Storage.advanceCycleWeek();
            this.showNotification(`Settimana ${info?.currentWeek || ''} · Deload`, 'info');
        } else {
            Storage.startManualDeload();
            this.showNotification('Deload attivo per 7 giorni', 'info');
        }
        this.updateCycleCard();
        this.updateQuickAction();
    },

    dismissDeloadSuggestion() {
        this._removeDynamicModal('deload-suggestion-modal');
    },
});
