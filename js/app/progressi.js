/**
 * GymTracker 2.0 — area PROGRESSI: numeri, grafici, storico, dettaglio e modifica di una seduta,
 * peso corporeo, record, cicli.
 */

Object.assign(App, {
    // ========================================
    // GUSCIO DELL'AREA: markup della pagina, listener, ingresso nella pagina
    // ========================================

    // Pagina #progressi
    htmlProgressi() {
        const chart = (id, title, label, empty, extra = '') => `
            <section class="card chart-card-compact" id="${id}-card">
                <h2 class="cap">${title}</h2>
                <div class="chart-container"${extra}><canvas id="${id}" role="img" aria-label="${label}"></canvas></div>
                <p class="chart-empty-state muted" id="${id.replace('-chart', '')}-empty">${empty}</p>
            </section>`;
        return `
            <header class="head"><h1>Progressi</h1></header>

            <div class="stats progress-stats-bar" style="--n: 4">
                <div class="stat"><span class="stat__v num" id="progress-total-workouts">0</span><span class="stat__k">Sedute</span></div>
                <div class="stat"><span class="stat__v num" id="progress-total-volume">0</span><span class="stat__k">Tonnellate</span></div>
                <div class="stat"><span class="stat__v num" id="progress-total-prs">0</span><span class="stat__k">Record</span></div>
                <div class="stat"><span class="stat__v num" id="progress-best-streak">0</span><span class="stat__k">Settimane</span></div>
            </div>

            <section class="card" id="progress-cycle-card" aria-labelledby="progress-cycle-title">
                <div class="progress-section-header section__head"><h2 id="progress-cycle-title">Ciclo</h2></div>
                <div id="progress-cycle-info"><p class="muted">Nessuna scheda attiva</p></div>
            </section>

            <div class="progress-charts-grid wide">
                ${chart('volume-chart', 'Volume settimanale', 'Volume settimanale', 'Nessun dato')}
                ${chart('frequency-chart', 'Frequenza', 'Sedute per settimana', 'Nessun dato')}
            </div>

            ${chart('conditioning-chart', 'Cardio', 'Sedute HIIT e LISS', 'Nessuna seduta')}

            <section class="card" id="muscle-volume-card" aria-labelledby="muscle-volume-title">
                <div class="progress-section-header section__head">
                    <h2 id="muscle-volume-title">Serie per muscolo</h2>
                    <span class="progress-subtitle muted" id="muscle-volume-period">Questa settimana</span>
                </div>
                <div id="muscle-volume-bars"><p class="muted">Nessun dato</p></div>
            </section>

            <section class="card" aria-labelledby="strength-title">
                <div class="progress-section-header section__head"><h2 id="strength-title">Forza per esercizio</h2></div>
                <div class="strength-select-container field">
                    <select id="strength-exercise-select" class="input form-select" aria-label="Esercizio">
                        <option value="">Scegli un esercizio</option>
                    </select>
                </div>
                <div class="chart-container" id="strength-chart-container" style="display: none;">
                    <canvas id="strength-chart" role="img" aria-label="Andamento della forza"></canvas>
                </div>
                <p class="muted" id="strength-empty">Scegli un esercizio</p>
            </section>

            <section class="card" id="rir-trend-card" aria-labelledby="rir-title">
                <div class="progress-section-header section__head"><h2 id="rir-title">RIR medio</h2></div>
                <div class="chart-container" id="rir-chart-container">
                    <canvas id="rir-chart" role="img" aria-label="RIR medio per seduta"></canvas>
                </div>
                <p class="chart-empty-state muted" id="rir-empty">Segna il RIR nelle serie</p>
            </section>

            <section class="card progress-body-section" aria-labelledby="weight-title">
                <div class="progress-section-header section__head">
                    <h2 id="weight-title">Peso corporeo</h2>
                    <button type="button" class="btn btn--secondary btn--sm" id="toggle-weight-form">${this.ico('plus', 'ico--sm')}Peso</button>
                </div>
                <div class="weight-form-container" id="weight-form-container" style="display: none;">
                    <form id="body-measurement-form" class="inline-form dock__row">
                        <input class="input" type="number" step="0.1" id="measure-weight" placeholder="kg" inputmode="decimal" aria-label="Peso in kg">
                        <button type="submit" class="btn btn--primary">Salva</button>
                    </form>
                </div>
                <div class="weight-chart-container" id="weight-chart-container">
                    <canvas id="weight-chart" role="img" aria-label="Peso corporeo"></canvas>
                    <p class="chart-empty-state muted" id="weight-empty">Nessuna misura</p>
                </div>
            </section>

            <section class="card" aria-labelledby="prs-title">
                <div class="progress-section-header section__head"><h2 id="prs-title">Record personali</h2></div>
                <div id="prs-list" class="prs-grid-compact"><p class="muted">Ancora nessun record</p></div>
            </section>

            <section class="card" id="cycle-history-card" aria-labelledby="cycle-history-title">
                <div class="progress-section-header section__head"><h2 id="cycle-history-title">Cicli completati</h2></div>
                <div id="cycle-history-list"><p class="muted">Nessun ciclo completato</p></div>
            </section>

            <section class="card" aria-labelledby="history-title">
                <div class="progress-section-header section__head"><h2 id="history-title">Storico sedute</h2></div>
                <div id="workout-history-list" class="workout-history-compact"><p class="muted">Ancora nessuna seduta</p></div>
            </section>
        `;
    },

    bindProgressi() {
        const on = (id, ev, fn) => this._on(id, ev, fn);

        // Peso corporeo
        on('body-measurement-form', 'submit', (e) => {
            e.preventDefault();
            this.saveMeasurement();
        });
        on('toggle-weight-form', 'click', () => {
            const container = document.getElementById('weight-form-container');
            if (!container) return;
            const open = container.style.display === 'none';
            container.style.display = open ? 'block' : 'none';
            if (open) document.getElementById('measure-weight')?.focus();
        });

        // Progressi: grafico forza (listener UNA volta sola, E9)
        on('strength-exercise-select', 'change', (e) => this.showStrengthProgress(e.target.value));
    },

    // Ogni pagina si ridisegna con i dati aggiornati quando si apre
    enterProgressi() {
        this._safe(() => this.loadProgress());
        this._safe(() => this.initCharts());
    },

    // Gli id dei workout possono arrivare da un backup (numeri o stringhe): si confrontano come testo
    _findWorkout(id) {
        const key = String(id);
        return Storage.getWorkouts().find(w => String(w.id) === key) || null;
    },

    showWorkoutDetail(workoutId) {
        const workout = this._findWorkout(workoutId);
        if (!workout) {
            this.showNotification('Allenamento non trovato', 'error');
            return;
        }

        const date = new Date(workout.date);
        const durationMin = Math.round((workout.duration || 0) / 60);
        const exercisesHTML = (workout.exercises || []).length
            ? workout.exercises.map(ex => `
                <div class="workout-detail-exercise">
                    <div class="workout-detail-ex-header">
                        <span class="workout-detail-ex-name">${GT.esc(ex.name)}</span>
                        <span class="workout-detail-ex-vol">${GT.esc(GT.formatVolume(this._setsVolume(ex.sets)))}</span>
                    </div>
                    <div class="workout-detail-sets">${this._setsChips(ex.sets)}</div>
                </div>
            `).join('')
            : '<p class="empty-state-mini">Nessun dettaglio</p>';

        const html = `
            <div class="progression-summary-modal" id="workout-detail-modal">
                <div class="progression-summary-content">
                    <h3>${GT.esc(workout.name || 'Allenamento')}</h3>
                    <p style="color: var(--text-secondary); margin-bottom: 12px;">${GT.esc(GT.formatRelativeDay(date))} · ${GT.esc(isNaN(date) ? '' : date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }))}</p>
                    <div class="summary-stats">
                        <div class="summary-stat">
                            <span class="stat-value">${GT.esc(GT.formatVolume(workout.totalVolume || 0))}</span>
                            <span class="stat-label">volume</span>
                        </div>
                        <div class="summary-stat">
                            <span class="stat-value">${GT.esc(workout.totalSets || 0)}</span>
                            <span class="stat-label">serie</span>
                        </div>
                        <div class="summary-stat">
                            <span class="stat-value">${durationMin}</span>
                            <span class="stat-label">minuti</span>
                        </div>
                    </div>
                    <h4>Esercizi</h4>
                    <div class="workout-detail-exercises">${exercisesHTML}</div>
                    <div style="display:flex;gap:8px;margin-top:16px;">
                        <button type="button" class="btn btn--primary" data-action="close" style="flex:1;">Chiudi</button>
                        <button type="button" class="btn btn--secondary" data-action="edit" style="flex:1;">Modifica</button>
                        <button type="button" class="btn btn--danger btn--sm" data-action="delete">Elimina</button>
                    </div>
                </div>
            </div>
        `;

        const modal = this._showDynamicModal('workout-detail-modal', html);
        modal?.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                if (action === 'close') {
                    this.closeWorkoutDetail();
                } else if (action === 'edit') {
                    this.closeWorkoutDetail();
                    this.editWorkout(workout.id);
                } else if (action === 'delete') {
                    // Si chiude solo se l'eliminazione è confermata (E16)
                    if (this.deleteWorkoutSession(workout.id)) this.closeWorkoutDetail();
                }
            });
        });
    },

    closeWorkoutDetail() {
        this._removeDynamicModal('workout-detail-modal');
    },

    // ========================================
    // EDIT WORKOUT
    // ========================================

    editWorkout(workoutId) {
        const workout = this._findWorkout(workoutId);
        if (!workout) return;
        this._editingWorkout = JSON.parse(JSON.stringify(workout));
        (this._editingWorkout.exercises || []).forEach(ex => { if (!Array.isArray(ex.sets)) ex.sets = []; });
        this._editingWorkout.exercises = this._editingWorkout.exercises || [];
        this._renderWorkoutEdit();
    },

    _renderWorkoutEdit() {
        const workout = this._editingWorkout;
        if (!workout) return;
        const hadModal = !!document.getElementById('workout-edit-modal');
        const scroll = document.querySelector('#workout-edit-modal .progression-summary-content')?.scrollTop || 0;

        const exercisesHTML = workout.exercises.map((ex, exIdx) => {
            const setsHTML = ex.sets.map((s, sIdx) => `
                <div class="workout-edit-set">
                    <input type="number" class="edit-input edit-weight" data-ex="${exIdx}" data-set="${sIdx}"
                        value="${GT.esc(s.weight ?? '')}" placeholder="kg" inputmode="decimal" step="any" min="0" aria-label="Peso serie ${sIdx + 1}">
                    <span class="edit-x">&times;</span>
                    <input type="number" class="edit-input edit-reps" data-ex="${exIdx}" data-set="${sIdx}"
                        value="${GT.esc(s.reps ?? '')}" placeholder="reps" inputmode="numeric" min="0" aria-label="Ripetizioni serie ${sIdx + 1}">
                    <button type="button" class="edit-set-remove" onclick="App._removeEditSet(${exIdx}, ${sIdx})" aria-label="Togli serie ${sIdx + 1}">&times;</button>
                </div>
            `).join('');

            return `
                <div class="workout-edit-exercise">
                    <div class="workout-edit-ex-header">
                        <span class="workout-edit-ex-name">${GT.esc(ex.name)}</span>
                        <button type="button" class="edit-ex-remove" onclick="App._removeEditExercise(${exIdx})">Rimuovi</button>
                    </div>
                    <div class="workout-edit-sets">${setsHTML}</div>
                    <button type="button" class="workout-edit-add-set" onclick="App._addEditSet(${exIdx})">+ Serie</button>
                </div>
            `;
        }).join('');

        const html = `
            <div class="progression-summary-modal" id="workout-edit-modal">
                <div class="progression-summary-content" style="max-height:85vh;overflow-y:auto;">
                    <h3>Modifica ${GT.esc(workout.name || 'allenamento')}</h3>
                    <p style="color:var(--text-secondary);margin-bottom:12px;">${GT.esc(GT.formatRelativeDay(new Date(workout.date)))}</p>
                    <div id="workout-edit-exercises">${exercisesHTML}</div>
                    <div class="workout-edit-add-exercise">
                        <input type="text" id="edit-add-exercise-search" class="edit-input"
                            placeholder="Aggiungi esercizio..." style="width:100%;margin-top:12px;"
                            aria-label="Cerca esercizio da aggiungere"
                            oninput="App._searchExerciseForEdit(this.value)">
                        <div id="edit-exercise-results"></div>
                    </div>
                    <div style="display:flex;gap:8px;margin-top:16px;">
                        <button type="button" class="btn btn--primary" onclick="App.saveWorkoutEdit()" style="flex:1;">Salva</button>
                        <button type="button" class="btn btn--secondary" onclick="App.closeWorkoutEdit()" style="flex:1;">Annulla</button>
                    </div>
                </div>
            </div>
        `;

        if (hadModal) {
            // Ridisegno durante la modifica: stesso modale, stesso punto di scorrimento
            document.getElementById('workout-edit-modal').outerHTML = html;
            const content = document.querySelector('#workout-edit-modal .progression-summary-content');
            if (content) content.scrollTop = scroll;
            this._sheetify(document.getElementById('workout-edit-modal'));
        } else {
            this._showDynamicModal('workout-edit-modal', html);
        }
    },

    _syncEditFromDOM() {
        if (!this._editingWorkout) return;
        document.querySelectorAll('#workout-edit-modal .edit-weight, #workout-edit-modal .edit-reps').forEach(input => {
            const ex = parseInt(input.dataset.ex);
            const set = parseInt(input.dataset.set);
            const target = this._editingWorkout.exercises[ex]?.sets[set];
            if (!target) return;
            if (input.classList.contains('edit-weight')) target.weight = input.value;
            else target.reps = input.value;
        });
    },

    _addEditSet(exIdx) {
        this._syncEditFromDOM();
        const sets = this._editingWorkout.exercises[exIdx].sets;
        const last = sets[sets.length - 1];
        sets.push({ weight: last?.weight ?? '', reps: last?.reps ?? '', completed: true });
        this._renderWorkoutEdit();
    },

    _removeEditSet(exIdx, setIdx) {
        this._syncEditFromDOM();
        this._editingWorkout.exercises[exIdx].sets.splice(setIdx, 1);
        this._renderWorkoutEdit();
    },

    _removeEditExercise(exIdx) {
        this._syncEditFromDOM();
        const ex = this._editingWorkout.exercises[exIdx];
        if (ex?.sets?.length && !confirm(`Togliere ${ex.name}? ${ex.sets.length} serie`)) return;
        this._editingWorkout.exercises.splice(exIdx, 1);
        this._renderWorkoutEdit();
    },

    _searchExerciseForEdit(query) {
        const container = document.getElementById('edit-exercise-results');
        if (!container) return;
        if (!query || query.length < 2) {
            container.innerHTML = '';
            return;
        }

        const results = searchExercises(query).filter(ex => !ex.hidden).slice(0, 5);
        container.innerHTML = results.map(ex => `
            <div class="edit-search-result" data-id="${GT.esc(ex.id)}" tabindex="0" role="button">${GT.esc(ex.name)}</div>
        `).join('');
        container.querySelectorAll('.edit-search-result').forEach(el => {
            el.addEventListener('click', () => this._addExerciseToEdit(el.dataset.id));
            this._makeKeyboardClickable(el);
        });
    },

    _addExerciseToEdit(exerciseId) {
        const ex = EXERCISES_DB[exerciseId];
        if (!ex || !this._editingWorkout) return;
        this._syncEditFromDOM();
        this._editingWorkout.exercises.push({
            exerciseId,
            name: ex.name,
            sets: [{ weight: '', reps: '', completed: true }]
        });
        this._renderWorkoutEdit();
    },

    saveWorkoutEdit() {
        this._syncEditFromDOM();
        const workout = this._editingWorkout;
        if (!workout) return;

        let totalVolume = 0;
        let totalSets = 0;
        workout.exercises.forEach(ex => {
            ex.sets.forEach(s => {
                s.weight = Math.max(0, GT.num(s.weight));
                s.reps = Math.max(0, Math.round(GT.num(s.reps)));
                s.completed = s.reps > 0;
                if (s.completed) {
                    totalVolume += s.weight * s.reps;
                    totalSets++;
                }
            });
        });
        workout.totalVolume = Math.round(totalVolume);
        workout.totalSets = totalSets;

        Storage.updateWorkout(workout.id, workout);   // ricalcola anche i PR
        this.closeWorkoutEdit();
        this.showNotification('Allenamento aggiornato', 'success');
        this.loadDashboard();
        this._safe(() => this.loadProgress());
        if (this.currentPage === 'progressi') this._safe(() => this.initCharts());
    },

    closeWorkoutEdit() {
        this._removeDynamicModal('workout-edit-modal');
        this._editingWorkout = null;
    },

    // ========================================
    // PROGRESS & CHARTS
    // ========================================

    loadProgress() {
        [
            () => this.updateProgressStats(),
            () => this.loadWorkoutHistory(),
            () => this.loadPersonalRecords(),
            () => this.loadProgressCycleInfo(),
            () => this.loadMuscleVolumeBars(),
            () => this.loadRirTrend(),
            () => this.loadCycleHistory(),
            () => this.populateStrengthExerciseSelect(),
            () => this.loadConditioningProgress()
        ].forEach(fn => this._safe(fn));
    },

    updateProgressStats() {
        const stats = Storage.getStatistics();
        const streak = Storage.getStreak();
        const tonnes = (stats.totalVolume || 0) / 1000;

        this._setText('progress-total-workouts', stats.totalWorkouts || 0);
        this._setText('progress-total-volume', tonnes.toLocaleString('it-IT', { maximumFractionDigits: 1 }));
        this._setText('progress-total-prs', stats.totalPRs ?? stats.prCount ?? 0);
        this._setText('progress-best-streak', streak.best || 0);
    },

    _chartsAvailable() {
        return typeof Chart !== 'undefined';
    },

    // Colori dei grafici presi dal tema (scuro/chiaro)
    _chartColors() {
        const css = getComputedStyle(document.documentElement);
        const tick = css.getPropertyValue('--text-secondary').trim() || '#a0a0b0';
        const light = document.documentElement.getAttribute('data-theme') === 'light';
        return { tick, grid: light ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)' };
    },

    initCharts() {
        if (!this._chartsAvailable()) return;
        [
            () => this.initVolumeChart(),
            () => this.initFrequencyChart(),
            () => this.initWeightChart(),
            () => this.initConditioningChart(),
            () => this.loadRirTrend()
        ].forEach(fn => this._safe(fn));
        const selected = document.getElementById('strength-exercise-select')?.value;
        if (selected) this._safe(() => this.showStrengthProgress(selected));
    },

    // Settimana di calendario (lunedì-domenica) di `weeksAgo` settimane fa
    _weekRange(weeksAgo) {
        const start = GT.startOfWeek(new Date());
        start.setDate(start.getDate() - weeksAgo * 7);
        const end = new Date(start);
        end.setDate(start.getDate() + 7);
        end.setMilliseconds(end.getMilliseconds() - 1);
        return { start, end };
    },

    _weekLabel(weeksAgo) {
        if (weeksAgo === 0) return 'Questa';
        if (weeksAgo === 1) return 'Scorsa';
        return `${weeksAgo} sett fa`;
    },

    _shortDate(date) {
        return GT.formatDate(new Date(date), { day: 'numeric', month: 'short' });
    },

    initVolumeChart() {
        const ctx = document.getElementById('volume-chart');
        const card = document.getElementById('volume-chart-card');
        if (!ctx || !card || !this._chartsAvailable()) return;

        const weeks = this.getWeeklyVolumes(4);
        const hasData = weeks.some(w => w.volume > 0);
        card.classList.toggle('no-data', !hasData);
        if (this.charts.volume) {
            this.charts.volume.destroy();
            this.charts.volume = null;
        }
        if (!hasData) return;

        const c = this._chartColors();
        this.charts.volume = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: weeks.map(w => w.label),
                datasets: [{
                    label: 'Volume (kg)',
                    data: weeks.map(w => w.volume),
                    backgroundColor: 'rgba(67, 97, 238, 0.7)',
                    borderColor: 'rgba(67, 97, 238, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, ticks: { color: c.tick }, grid: { color: c.grid } },
                    x: { ticks: { color: c.tick }, grid: { display: false } }
                }
            }
        });
    },

    initFrequencyChart() {
        const ctx = document.getElementById('frequency-chart');
        const card = document.getElementById('frequency-chart-card');
        if (!ctx || !card || !this._chartsAvailable()) return;

        const weeks = this.getWeeklyWorkoutCounts(4);
        const hasData = weeks.some(w => w.count > 0);
        card.classList.toggle('no-data', !hasData);
        if (this.charts.frequency) {
            this.charts.frequency.destroy();
            this.charts.frequency = null;
        }
        if (!hasData) return;

        const c = this._chartColors();
        this.charts.frequency = new Chart(ctx, {
            type: 'line',
            data: {
                labels: weeks.map(w => w.label),
                datasets: [{
                    label: 'Allenamenti',
                    data: weeks.map(w => w.count),
                    borderColor: 'rgba(114, 9, 183, 1)',
                    backgroundColor: 'rgba(114, 9, 183, 0.2)',
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, suggestedMax: 7, ticks: { color: c.tick, stepSize: 1 }, grid: { color: c.grid } },
                    x: { ticks: { color: c.tick }, grid: { display: false } }
                }
            }
        });
    },

    initWeightChart() {
        const ctx = document.getElementById('weight-chart');
        if (!ctx) return;

        const measurements = Storage.getMeasurements().slice(0, 10).reverse();
        const hasData = measurements.length > 0;
        const emptyEl = document.getElementById('weight-empty');
        if (emptyEl) emptyEl.style.display = hasData ? 'none' : 'block';
        ctx.style.display = hasData ? 'block' : 'none';

        if (this.charts.weight) {
            this.charts.weight.destroy();
            this.charts.weight = null;
        }
        if (!hasData || !this._chartsAvailable()) return;

        const c = this._chartColors();
        this.charts.weight = new Chart(ctx, {
            type: 'line',
            data: {
                labels: measurements.map(m => this._shortDate(m.date)),
                datasets: [{
                    label: 'Peso (kg)',
                    data: measurements.map(m => m.weight),
                    borderColor: 'rgba(6, 214, 160, 1)',
                    backgroundColor: 'rgba(6, 214, 160, 0.2)',
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { ticks: { color: c.tick }, grid: { color: c.grid } },
                    x: { ticks: { color: c.tick }, grid: { display: false } }
                }
            }
        });
    },

    // ========================================
    // CONDITIONING PROGRESS
    // ========================================

    loadConditioningProgress() {
        const card = document.getElementById('conditioning-chart-card');
        if (!card) return;

        const sessions = Storage.getConditioningSessions();
        const suggestion = this._conditioningSuggestion();
        if (!sessions.length && !suggestion?.enabled) {
            card.style.display = 'none';
            return;
        }

        card.style.display = '';
        const hasData = sessions.length > 0;
        card.classList.toggle('no-data', !hasData);
        const emptyEl = document.getElementById('conditioning-empty');
        if (emptyEl) emptyEl.style.display = hasData ? 'none' : 'block';
        if (hasData) this.initConditioningChart();
    },

    getWeeklyConditioningCounts(numWeeks) {
        const sessions = Storage.getConditioningSessions();
        const weeks = [];
        for (let i = numWeeks - 1; i >= 0; i--) {
            const { start, end } = this._weekRange(i);
            const inWeek = sessions.filter(s => {
                const d = new Date(s.date);
                return d >= start && d <= end;
            });
            // Il tipo si confronta in minuscolo: vale per i dati vecchi e nuovi (E1)
            const type = (s) => String(s.type || '').toLowerCase();
            weeks.push({
                label: this._weekLabel(i),
                hiit: inWeek.filter(s => type(s) === 'hiit').length,
                liss: inWeek.filter(s => type(s) === 'liss').length
            });
        }
        return weeks;
    },

    initConditioningChart() {
        const ctx = document.getElementById('conditioning-chart');
        const card = document.getElementById('conditioning-chart-card');
        if (!ctx || !card || !this._chartsAvailable()) return;

        const weeks = this.getWeeklyConditioningCounts(4);
        const hasData = weeks.some(w => w.hiit > 0 || w.liss > 0);
        card.classList.toggle('no-data', !hasData);
        if (this.charts.conditioning) {
            this.charts.conditioning.destroy();
            this.charts.conditioning = null;
        }
        if (!hasData) return;

        const c = this._chartColors();
        this.charts.conditioning = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: weeks.map(w => w.label),
                datasets: [
                    {
                        label: 'HIIT',
                        data: weeks.map(w => w.hiit),
                        backgroundColor: 'rgba(239, 68, 68, 0.7)',
                        borderColor: 'rgba(239, 68, 68, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'LISS',
                        data: weeks.map(w => w.liss),
                        backgroundColor: 'rgba(6, 214, 160, 0.7)',
                        borderColor: 'rgba(6, 214, 160, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: true, labels: { color: c.tick, boxWidth: 12 } } },
                scales: {
                    y: { beginAtZero: true, stacked: true, ticks: { color: c.tick, stepSize: 1 }, grid: { color: c.grid } },
                    x: { stacked: true, ticks: { color: c.tick }, grid: { display: false } }
                }
            }
        });
    },

    getWeeklyVolumes(numWeeks) {
        const weeks = [];
        for (let i = numWeeks - 1; i >= 0; i--) {
            const { start, end } = this._weekRange(i);
            const workouts = Storage.getWorkoutsInDateRange(start, end);
            weeks.push({
                label: this._weekLabel(i),
                volume: workouts.reduce((sum, w) => sum + (w.totalVolume || 0), 0)
            });
        }
        return weeks;
    },

    getWeeklyWorkoutCounts(numWeeks) {
        const weeks = [];
        for (let i = numWeeks - 1; i >= 0; i--) {
            const { start, end } = this._weekRange(i);
            weeks.push({
                label: this._weekLabel(i),
                count: Storage.getWorkoutsInDateRange(start, end).length
            });
        }
        return weeks;
    },

    saveMeasurement() {
        const input = document.getElementById('measure-weight');
        const weight = GT.num(input?.value);
        if (!(weight > 0)) {
            this.showNotification('Inserisci il peso', 'warning');
            return;
        }

        Storage.saveMeasurement({ weight, bodyFat: null });
        if (input) input.value = '';
        const form = document.getElementById('weight-form-container');
        if (form) form.style.display = 'none';

        this.loadProfile();          // il form del profilo mostra il peso nuovo (E8)
        this.initWeightChart();
        this.loadDashboard();
        this.showNotification(`Peso salvato: ${weight} kg`, 'success');
    },

    loadWorkoutHistory() {
        const container = document.getElementById('workout-history-list');
        if (!container) return;
        const workouts = Storage.getRecentWorkouts(10);

        if (workouts.length === 0) {
            container.innerHTML = '<p class="empty-state-mini">Nessun allenamento registrato</p>';
            return;
        }

        container.innerHTML = workouts.map(w => `
            <div class="workout-history-item clickable" data-workout-id="${GT.esc(w.id)}" tabindex="0" role="button">
                <div class="workout-history-info">
                    <div class="workout-history-name">${GT.esc(w.name || 'Allenamento')}</div>
                    <div class="workout-history-meta">${GT.esc(GT.formatRelativeDay(new Date(w.date)))} • ${Math.round((w.duration || 0) / 60)} min</div>
                </div>
                <div class="workout-history-stats">${GT.esc(GT.formatVolume(w.totalVolume || 0))} →</div>
            </div>
        `).join('');

        container.querySelectorAll('.workout-history-item').forEach(item => {
            item.addEventListener('click', () => this.showWorkoutDetail(item.dataset.workoutId));
            this._makeKeyboardClickable(item);
        });
    },

    // true se l'allenamento è stato eliminato
    deleteWorkoutSession(workoutId, event) {
        if (event) event.stopPropagation();
        const workout = this._findWorkout(workoutId);
        if (!workout) {
            this.showNotification('Allenamento non trovato', 'error');
            return false;
        }

        const when = GT.formatRelativeDay(new Date(workout.date));
        if (!confirm(`Eliminare ${workout.name || 'l\'allenamento'} (${when.toLowerCase()})? ${workout.totalSets || 0} serie`)) return false;

        Storage.deleteWorkout(workout.id);   // ricalcola anche i PR
        this.showNotification('Allenamento eliminato', 'success');
        this.loadDashboard();
        this._safe(() => this.loadProgress());
        if (this.currentPage === 'progressi') this._safe(() => this.initCharts());
        return true;
    },

    loadPersonalRecords() {
        const container = document.getElementById('prs-list');
        if (!container) return;
        const prs = Storage.getPersonalRecords() || {};
        const e1rmOf = (pr) => pr.estimated1RM ?? pr.e1rm ?? 0;
        const entries = Object.entries(prs).filter(([, pr]) => pr && (e1rmOf(pr) > 0 || pr.maxWeight > 0));

        if (entries.length === 0) {
            container.innerHTML = '<p class="empty-state-mini">Completa allenamenti per vedere i tuoi PR!</p>';
            return;
        }

        entries.sort((a, b) => e1rmOf(b[1]) - e1rmOf(a[1]));

        container.innerHTML = entries.slice(0, 10).map(([exId, pr]) => {
            const name = EXERCISES_DB[exId]?.name || exId;
            const shortName = name.length > 22 ? name.substring(0, 20) + '…' : name;
            const bestDetail = pr.e1rmWeight && pr.e1rmReps
                ? `${pr.e1rmWeight} kg × ${pr.e1rmReps}`
                : `${pr.maxWeight} kg × ${pr.maxWeightReps || pr.maxReps || '?'}`;
            const dateRaw = pr.e1rmDate || pr.maxWeightDate;
            const dateStr = dateRaw ? this._shortDate(dateRaw) : '';

            return `
                <div class="pr-item-detail">
                    <div class="pr-item-top">
                        <span class="pr-exercise" title="${GT.esc(name)}">${GT.esc(shortName)}</span>
                        <span class="pr-e1rm">${GT.esc(Math.round(e1rmOf(pr) * 10) / 10)} kg <small>E1RM</small></span>
                    </div>
                    <div class="pr-item-bottom">
                        <span class="pr-best-set">${GT.esc(bestDetail)}</span>
                        <span class="pr-date">${GT.esc(dateStr)}</span>
                    </div>
                </div>
            `;
        }).join('');
    },

    // Le opzioni si ricostruiscono, la scelta resta; il listener è uno solo (E9)
    populateStrengthExerciseSelect() {
        const select = document.getElementById('strength-exercise-select');
        if (!select) return;
        const previous = select.value;
        const prs = Storage.getPersonalRecords() || {};

        const options = Object.keys(prs)
            .filter(id => EXERCISES_DB[id])
            .sort((a, b) => EXERCISES_DB[a].name.localeCompare(EXERCISES_DB[b].name))
            .map(id => `<option value="${GT.esc(id)}">${GT.esc(EXERCISES_DB[id].name)}</option>`);

        select.innerHTML = '<option value="">Scegli un esercizio…</option>' + options.join('');
        if (previous && prs[previous]) select.value = previous;
    },

    showStrengthProgress(exerciseId) {
        const ctx = document.getElementById('strength-chart');
        const chartContainer = document.getElementById('strength-chart-container');
        const emptyEl = document.getElementById('strength-empty');
        if (!ctx) return;

        if (this.charts.strength) {
            this.charts.strength.destroy();
            this.charts.strength = null;
        }

        const history = exerciseId ? (Storage.getExerciseHistory(exerciseId) || []) : [];
        if (!exerciseId || history.length === 0 || !this._chartsAvailable()) {
            if (chartContainer) chartContainer.style.display = 'none';
            if (emptyEl) {
                emptyEl.style.display = 'block';
                emptyEl.textContent = exerciseId ? 'Nessun dato per questo esercizio' : 'Scegli un esercizio';
            }
            return;
        }

        if (chartContainer) chartContainer.style.display = 'block';
        if (emptyEl) emptyEl.style.display = 'none';

        const c = this._chartColors();
        this.charts.strength = new Chart(ctx, {
            type: 'line',
            data: {
                labels: history.map(h => this._shortDate(h.date)),
                datasets: [{
                    label: 'Peso (kg)',
                    data: history.map(h => h.weight),
                    borderColor: 'rgba(67, 97, 238, 1)',
                    backgroundColor: 'rgba(67, 97, 238, 0.2)',
                    fill: true,
                    tension: 0.3
                }, {
                    label: 'E1RM (kg)',
                    data: history.map(h => h.e1rm ?? h.estimated1RM),
                    borderColor: 'rgba(6, 214, 160, 1)',
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { labels: { color: c.tick } } },
                scales: {
                    y: { ticks: { color: c.tick }, grid: { color: c.grid } },
                    x: { ticks: { color: c.tick }, grid: { display: false } }
                }
            }
        });
    },

    // ========================================
    // PROGRESS PAGE - MESOCYCLE, MUSCLE VOLUME, RIR, CYCLE HISTORY
    // ========================================

    loadProgressCycleInfo() {
        const container = document.getElementById('progress-cycle-info');
        if (!container) return;

        const cycleInfo = Storage.getCycleInfo();
        const program = Storage.getActiveProgram();
        if (!cycleInfo || !program) {
            container.innerHTML = '<p class="empty-state-mini">Nessuna scheda attiva</p>';
            return;
        }

        const isDeload = Storage.isDeloadActive();
        const phase = this._currentPhase(cycleInfo, isDeload) || {};
        const goal = this._goalLabel(program.metadata?.goal) || 'Allenamento';
        const cycleNum = program.metadata?.cycleNumber || 1;
        const rir = phase.rirTarget ? `${phase.rirTarget.min}-${phase.rirTarget.max}` : '—';
        const volume = Math.round((phase.volumeMultiplier ?? 1) * 100);
        const phaseClass = isDeload ? 'deload' : String(phase.phase || '').replace(/[^a-z-]/gi, '');
        const row = (label, value, cls = '') => `
            <div class="cycle-detail-row">
                <span class="cycle-detail-label">${label}</span>
                <span class="cycle-detail-value ${cls}">${value}</span>
            </div>`;

        container.innerHTML = `
            <div class="cycle-progress-detail">
                ${row('Obiettivo', GT.esc(goal))}
                ${row('Ciclo #', GT.esc(cycleNum))}
                ${row('Settimana', `${cycleInfo.currentWeek} / ${cycleInfo.duration}`)}
                ${row('Fase', GT.esc(phase.phaseName || ''), `phase-badge ${phaseClass}`)}
                ${row('RIR', GT.esc(rir))}
                ${row('Volume', `${volume}%`)}
                <div class="cycle-progress-bar-container">
                    <div class="cycle-progress-bar">
                        <div class="cycle-progress-fill" style="width: ${Math.max(0, Math.min(100, cycleInfo.progress || 0))}%"></div>
                    </div>
                    <span class="cycle-progress-text">${cycleInfo.progress > 0 ? `${cycleInfo.progress}% fatto` : `Settimana ${cycleInfo.currentWeek} in corso`}</span>
                </div>
            </div>
        `;
    },

    // Serie fatte questa settimana per muscolo (primari 1, secondari 0,5), confrontate con
    // il volume ottimale del livello (E10)
    loadMuscleVolumeBars() {
        const container = document.getElementById('muscle-volume-bars');
        if (!container) return;

        const workoutsThisWeek = Storage.getWorkoutsThisWeek();
        if (!workoutsThisWeek.length) {
            container.innerHTML = '<p class="empty-state-mini">Completa allenamenti per vedere il volume per muscolo</p>';
            return;
        }

        const muscleVolume = {};
        workoutsThisWeek.forEach(w => {
            (w.exercises || []).forEach(ex => {
                const exercise = EXERCISES_DB[ex.exerciseId];
                if (!exercise) return;
                const sets = (ex.sets || []).filter(s => s.completed && parseInt(s.reps) > 0).length;
                if (!sets) return;
                (exercise.primaryMuscles || []).forEach(m => { muscleVolume[m] = (muscleVolume[m] || 0) + sets; });
                (exercise.secondaryMuscles || []).forEach(m => { muscleVolume[m] = (muscleVolume[m] || 0) + sets * 0.5; });
            });
        });

        const muscleLabels = {
            petto: 'Petto', schiena: 'Schiena', spalle: 'Spalle', bicipiti: 'Bicipiti',
            tricipiti: 'Tricipiti', quadricipiti: 'Quadricipiti', femorali: 'Femorali',
            glutei: 'Glutei', polpacci: 'Polpacci', addome: 'Addome', trapezio: 'Trapezio'
        };
        const sorted = Object.entries(muscleVolume)
            .filter(([m, v]) => muscleLabels[m] && v > 0)
            .sort((a, b) => b[1] - a[1]);

        if (!sorted.length) {
            container.innerHTML = '<p class="empty-state-mini">Nessuna serie questa settimana</p>';
            return;
        }

        const program = Storage.getActiveProgram();
        const level = program?.metadata?.level || Storage.getProfile().level || 'intermediate';
        const cfg = TrainingAlgorithm.VOLUME_CONFIG?.[level] || { min: 10, max: 20 };
        const minOptimal = cfg.min || 10;
        const maxOptimal = cfg.max || 20;
        const scale = Math.max(maxOptimal, ...sorted.map(([, v]) => v));
        const colors = { low: 'var(--warning)', optimal: 'var(--success)', high: 'var(--accent-primary)' };

        container.innerHTML = sorted.map(([muscle, sets]) => {
            const status = sets < minOptimal ? 'low' : sets > maxOptimal ? 'high' : 'optimal';
            const shown = Math.round(sets * 2) / 2;
            return `
                <div class="muscle-volume-row" title="Ottimale ${minOptimal}-${maxOptimal} serie/settimana">
                    <span class="muscle-volume-label">${muscleLabels[muscle]}</span>
                    <div class="muscle-volume-bar-bg">
                        <div class="muscle-volume-bar-fill muscle-vol-${status}" style="width: ${Math.min(100, (sets / scale) * 100)}%; background: ${colors[status]};"></div>
                    </div>
                    <span class="muscle-volume-value">${String(shown).replace('.', ',')}</span>
                </div>
            `;
        }).join('');
    },

    loadRirTrend() {
        const ctx = document.getElementById('rir-chart');
        const card = document.getElementById('rir-trend-card');
        const emptyEl = document.getElementById('rir-empty');
        if (!ctx || !card) return;

        const rirData = Storage.getRecentWorkouts(10)
            .map(w => {
                const rirs = [];
                (w.exercises || []).forEach(ex => (ex.sets || []).forEach(s => {
                    if (Number.isFinite(s.rir)) rirs.push(s.rir);
                }));
                if (!rirs.length) return null;
                return { date: this._shortDate(w.date), avgRir: rirs.reduce((a, b) => a + b, 0) / rirs.length };
            })
            .filter(Boolean)
            .reverse();

        if (this.charts.rir) {
            this.charts.rir.destroy();
            this.charts.rir = null;
        }
        if (!rirData.length || !this._chartsAvailable()) {
            if (emptyEl) emptyEl.style.display = 'block';
            ctx.style.display = 'none';
            return;
        }

        if (emptyEl) emptyEl.style.display = 'none';
        ctx.style.display = 'block';

        const c = this._chartColors();
        this.charts.rir = new Chart(ctx, {
            type: 'line',
            data: {
                labels: rirData.map(d => d.date),
                datasets: [{
                    label: 'RIR medio',
                    data: rirData.map(d => Math.round(d.avgRir * 10) / 10),
                    borderColor: 'rgba(255, 159, 64, 1)',
                    backgroundColor: 'rgba(255, 159, 64, 0.2)',
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { min: 0, max: 5, reverse: true, ticks: { color: c.tick, stepSize: 1 }, grid: { color: c.grid } },
                    x: { ticks: { color: c.tick }, grid: { display: false } }
                }
            }
        });
    },

    loadCycleHistory() {
        const container = document.getElementById('cycle-history-list');
        if (!container) return;

        const history = Storage.getCycleHistory() || [];
        if (!history.length) {
            container.innerHTML = '<p class="empty-state-mini">Nessun ciclo completato</p>';
            return;
        }

        container.innerHTML = history.slice(0, 5).map((c, i) => {
            const goal = this._goalLabel(c.goal) || c.goal || '';
            const startDate = c.startDate ? this._shortDate(c.startDate) : '?';
            const endDate = c.completedAt ? this._shortDate(c.completedAt) : '?';
            const stats = c.statistics || {};
            return `
                <div class="cycle-history-item">
                    <div class="cycle-history-header">
                        <strong>Ciclo ${GT.esc(c.cycleNumber || history.length - i)}</strong>
                        <span class="cycle-history-dates">${GT.esc(startDate)} - ${GT.esc(endDate)}</span>
                    </div>
                    <div class="cycle-history-meta">
                        <span>${GT.esc(goal)}</span>
                        <span>${GT.esc(c.duration || '?')} sett</span>
                        <span>${GT.esc(stats.totalWorkouts || 0)} allenamenti</span>
                        <span>${stats.totalVolume ? GT.esc(GT.formatVolume(stats.totalVolume)) : '-'}</span>
                        ${stats.prsAchieved ? `<span>${GT.esc(stats.prsAchieved)} PR</span>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    },
});
