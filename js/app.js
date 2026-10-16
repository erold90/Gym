/**
 * GymTracker Pro - Main Application
 * Your Digital Personal Trainer
 *
 * Dipendenze (caricate prima): GT (utils.js), EXERCISES_DB, Warmups, Storage,
 * TrainingAlgorithm, Timer, funzioni globali di exerciseMedia, conditioningExercises.
 * Ogni testo che viene da dati salvati/importati passa da GT.esc prima di finire in innerHTML.
 */

// ========================================
// APP STATE
// ========================================

const App = {
    currentPage: 'dashboard',
    activeWorkout: null,        // sessione in corso (salvata in Storage a ogni modifica)
    currentExerciseIndex: 0,
    charts: {},

    // Manual builder state
    builderState: {
        days: [],           // [{name, exercises: [{exerciseId, name, sets, reps, rest, _src}], _src}]
        currentDayIndex: 0,
        isEditing: false
    },

    // Filtri della pagina Esercizi: ricerca, categoria e muscolo si combinano
    _exFilters: { query: '', category: 'all', muscle: 'all' },
    _exerciseTypeTab: 'workout',

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

    // ========================================
    // INITIALIZATION
    // ========================================

    init() {
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

        const profile = Storage.getProfile();
        if (!resumed && !profile.name) {
            this.navigateTo('profile');
            this.showNotification('Benvenuto! Nome, livello e attrezzatura per iniziare', 'info');
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

    // ========================================
    // NAVIGATION
    // ========================================

    setupNavigation() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => this.navigateTo(item.dataset.page));
            // Raggiungibili da tastiera anche se sono <li>
            if (!/^(BUTTON|A)$/.test(item.tagName)) {
                if (!item.hasAttribute('tabindex')) item.setAttribute('tabindex', '0');
                item.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this.navigateTo(item.dataset.page);
                    }
                });
            }
        });

        const toggle = document.getElementById('menuToggle');
        toggle?.addEventListener('click', () => {
            const sidebar = document.getElementById('sidebar');
            const open = sidebar?.classList.toggle('active');
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
    },

    showPage(pageName) {
        const page = document.getElementById(`page-${pageName}`);
        if (!page) return;
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        page.classList.add('active');
        this.currentPage = pageName;

        // Ogni pagina si ridisegna con i dati aggiornati quando si apre
        if (pageName === 'progress') {
            this._safe(() => this.loadProgress());
            this._safe(() => this.initCharts());
        } else if (pageName === 'profile') {
            this._safe(() => this.loadProfile());
        } else if (pageName === 'dashboard') {
            this.loadDashboard();
        } else if (pageName === 'settings') {
            this._safe(() => this.updateStorageUsage());
        } else if (pageName === 'programs') {
            this._safe(() => this.loadPrograms());
        }
    },

    navigateTo(pageName) {
        this.showPage(pageName);
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === pageName);
        });
        document.getElementById('sidebar')?.classList.remove('active');
        document.getElementById('menuToggle')?.setAttribute('aria-expanded', 'false');
        window.scrollTo?.(0, 0);
    },

    // ========================================
    // EVENT LISTENERS
    // ========================================

    setupEventListeners() {
        const on = (id, ev, fn) => document.getElementById(id)?.addEventListener(ev, fn);
        const closeOnBackdrop = (id, fn) => on(id, 'click', (e) => { if (e.target.id === id) fn(); });

        // Profile form
        on('profile-form', 'submit', (e) => {
            e.preventDefault();
            this.saveProfile();
        });

        // Schede
        on('generate-program-btn', 'click', () => this.generateProgram());
        on('delete-program-btn', 'click', () => this.deleteActiveProgram());
        on('edit-program-btn', 'click', () => this.editActiveProgram());
        on('open-manual-builder-btn', 'click', () => this.openManualBuilder());
        on('open-ai-generator-btn', 'click', () => this.openWizard());
        on('close-ai-generator', 'click', () => this._closeModal('ai-generator-modal'));
        closeOnBackdrop('ai-generator-modal', () => this._closeModal('ai-generator-modal'));
        on('wizard-back', 'click', () => this.wizardBack());

        // Builder manuale
        on('close-manual-builder', 'click', () => this.closeManualBuilder());
        closeOnBackdrop('manual-builder-modal', () => this.closeManualBuilder());
        on('builder-add-day-btn', 'click', () => this.builderAddDay());
        on('builder-to-exercises-btn', 'click', () => this.builderGoToExercises());
        on('builder-back-to-days-btn', 'click', () => this.builderGoToDays());
        on('builder-save-btn', 'click', () => this.builderSaveProgram());
        on('builder-exercise-search', 'input', (e) => this.builderSearchExercises(e.target.value));

        // Day picker e allenamento libero
        closeOnBackdrop('day-picker-modal', () => this.closeDayPicker());
        closeOnBackdrop('free-workout-modal', () => this.closeFreeWorkoutModal());

        // Allenamento
        on('start-scheduled-workout', 'click', () => this.startScheduledWorkout());
        on('start-free-workout', 'click', () => this.startFreeWorkout());
        on('preview-workout-btn', 'click', () => this.showWorkoutPreview());
        on('close-preview-btn', 'click', () => this.closeWorkoutPreview());
        on('cancel-workout-btn', 'click', () => this.cancelWorkout());
        on('end-workout-btn', 'click', () => this.endWorkout());

        // Link "Vedi tutto"
        document.querySelectorAll('.see-all-link[data-page]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateTo(link.dataset.page);
            });
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

        // Pagina Esercizi: tab Workout/Warmup/Cooldown, ricerca e filtri combinati
        document.querySelectorAll('.type-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.type-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.switchExerciseType(tab.dataset.type);
            });
        });
        on('exercise-search', 'input', (e) => {
            if (this._exerciseTypeTab !== 'workout') {
                this.renderWarmupCooldownExercises(this._exerciseTypeTab, e.target.value);
            } else {
                this._exFilters.query = e.target.value.trim();
                this._applyExerciseFilters();
            }
        });
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this._exFilters.category = tab.dataset.category || 'all';
                this._applyExerciseFilters();
            });
        });
        on('muscle-filter', 'change', (e) => {
            this._exFilters.muscle = e.target.value || 'all';
            this._applyExerciseFilters();
        });

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

        // Impostazioni
        on('setting-theme', 'change', (e) => this.setTheme(e.target.value));
        ['setting-rest-compound', 'setting-rest-isolation', 'setting-rest-sound',
            'setting-vibration', 'setting-background-alerts'].forEach(id => {
            on(id, 'change', () => this.saveSettings());
        });
        on('setting-keep-awake', 'change', (e) => {
            this.saveSettings();
            if (this.activeWorkout || this.conditioningState.startedAt) this._setKeepAwake(e.target.checked);
        });
        on('setting-notifications', 'change', (e) => this.onNotificationsToggle(e.target));

        // Dati
        on('export-data-btn', 'click', () => this.exportData());
        on('import-data-btn', 'click', () => document.getElementById('import-file-input')?.click());
        on('import-file-input', 'change', (e) => {
            this.importData(e.target.files[0]);
            e.target.value = '';   // permette di riscegliere lo stesso file
        });
        on('reset-data-btn', 'click', () => {
            if (confirm('Cancellare TUTTI i dati? Profilo, schede, allenamenti e PR')) {
                Storage.clearAllData();
                location.reload();
            }
        });
        on('clear-progress-btn', 'click', () => {
            const n = Storage.getWorkouts().length;
            if (!confirm(`Cancellare i progressi? ${n} allenamenti, PR e cicli`)) return;
            Storage.clearProgressData();
            this.showNotification('Progressi cancellati', 'success');
            this._cycleSummaryDismissed = false;
            this.loadDashboard();
            this._safe(() => this.loadProgress());
            this._safe(() => this.initCharts());
            this.updateStorageUsage();
        });
        on('clear-cache-btn', 'click', async () => {
            if (!confirm('Svuotare la cache e ricaricare l\'app?')) return;
            try {
                if ('serviceWorker' in navigator) {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    for (const registration of registrations) await registration.unregister();
                }
                if ('caches' in window) {
                    const cacheNames = await caches.keys();
                    for (const cacheName of cacheNames) await caches.delete(cacheName);
                }
                location.reload();
            } catch (error) {
                console.error('Errore durante la pulizia della cache:', error);
                this.showNotification('Cache non svuotata: riprova', 'error');
            }
        });

        // Debug
        on('simulate-workout-btn', 'click', () => this.startSimulatedWorkout());

        // Modali esercizio
        on('close-exercise-modal', 'click', () => this._closeModal('exercise-modal'));
        closeOnBackdrop('exercise-modal', () => this._closeModal('exercise-modal'));
        on('close-exercise-info-modal', 'click', () => this._closeModal('exercise-info-modal'));
        closeOnBackdrop('exercise-info-modal', () => this._closeModal('exercise-info-modal'));

        // Conditioning
        on('conditioning-btn', 'click', () => this.openConditioningModal());
        on('close-conditioning-modal', 'click', () => this.closeConditioningModal());
        closeOnBackdrop('conditioning-modal', () => this.closeConditioningModal());
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

        // Esc chiude il modale più in alto (H10)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' || e.key === 'Esc') this._closeTopModal();
        });

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
    // MODALI: focus all'apertura, ripristino alla chiusura, Esc
    // ========================================

    _openModal(id, focusSelector = null) {
        const modal = document.getElementById(id);
        if (!modal) return;
        if (!modal.classList.contains('active')) {
            this._modalFocusStack.push(document.activeElement);
        }
        modal.classList.add('active');
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        this._focusFirst(modal, focusSelector);
    },

    _closeModal(id) {
        const modal = document.getElementById(id);
        if (!modal || !modal.classList.contains('active')) return;
        modal.classList.remove('active');
        this._restoreFocus();
    },

    _focusFirst(container, selector = null) {
        setTimeout(() => {
            const el = (selector && container.querySelector(selector)) ||
                container.querySelector('.modal-close, button:not([disabled]), [href], input, select, textarea, [tabindex="0"]');
            try { el?.focus({ preventScroll: true }); } catch (e) { /* no-op */ }
        }, 30);
    },

    _restoreFocus() {
        const el = this._modalFocusStack.pop();
        if (el && document.contains(el) && typeof el.focus === 'function') {
            try { el.focus({ preventScroll: true }); } catch (e) { /* no-op */ }
        }
    },

    // Modali creati al volo (riepiloghi, dettaglio, modifica): stesso comportamento dei fissi
    _showDynamicModal(id, html) {
        document.getElementById(id)?.remove();
        this._modalFocusStack.push(document.activeElement);
        document.body.insertAdjacentHTML('beforeend', html);
        const modal = document.getElementById(id);
        if (!modal) return null;
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        this._focusFirst(modal, '.btn-primary');
        return modal;
    },

    _removeDynamicModal(id) {
        const modal = document.getElementById(id);
        if (!modal) return false;
        modal.remove();
        this._restoreFocus();
        return true;
    },

    _closeTopModal() {
        const dynamicClose = {
            'workout-edit-modal': () => this.closeWorkoutEdit(),
            'workout-detail-modal': () => this.closeWorkoutDetail(),
            'rotation-detail-modal': () => this._removeDynamicModal('rotation-detail-modal'),
            'cycle-summary-modal': () => this.closeCycleSummary(),
            'week-advance-modal': () => this.dismissWeekAdvancement(),
            'deload-suggestion-modal': () => this.dismissDeloadSuggestion(),
            'workout-completion-modal': () => this.closeWorkoutCompletionSummary()
        };
        // Il più in alto è l'ultimo inserito nel body
        const open = [...document.querySelectorAll(Object.keys(dynamicClose).map(id => '#' + id).join(','))];
        const top = open[open.length - 1];
        if (top) {
            dynamicClose[top.id]();
            return;
        }

        const staticOrder = ['exercise-info-modal', 'exercise-modal', 'day-picker-modal', 'free-workout-modal',
            'manual-builder-modal', 'ai-generator-modal', 'conditioning-modal'];
        for (const id of staticOrder) {
            if (!document.getElementById(id)?.classList.contains('active')) continue;
            if (id === 'conditioning-modal') this.closeConditioningModal();
            else if (id === 'manual-builder-modal') this.closeManualBuilder();
            else this._closeModal(id);
            return;
        }

        const cooldown = document.getElementById('cooldown-modal');
        if (cooldown && cooldown.style.display !== 'none') {
            cooldown.style.display = 'none';
            this._restoreFocus();
            return;
        }

        document.getElementById('sidebar')?.classList.remove('active');
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

    _setText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
        return el;
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
            btnEl.textContent = '▶️ Riprendi';
            btnEl.onclick = () => this.navigateTo('workout');
            return;
        }

        const program = Storage.getActiveProgram();
        if (!program || !program.days?.length) {
            titleEl.textContent = 'Crea la tua scheda';
            subtitleEl.textContent = 'Generala o costruiscila a mano';
            btnEl.textContent = '📋 Schede';
            btnEl.onclick = () => this.navigateTo('programs');
            return;
        }

        const nextWorkout = program.days[this.getSuggestedDayIndex(program)];
        if (!nextWorkout) {
            titleEl.textContent = 'Allenamento libero';
            subtitleEl.textContent = 'Scegli tu gli esercizi';
            btnEl.textContent = '💪 Libero';
            btnEl.onclick = () => { this.navigateTo('workout'); this.startFreeWorkout(); };
            return;
        }

        const duration = this._estimateDuration(this._applyPhase(nextWorkout));
        titleEl.textContent = nextWorkout.type || nextWorkout.name;
        subtitleEl.textContent = `${nextWorkout.exercises.length} esercizi • ~${duration} min`;
        btnEl.textContent = '▶️ Inizia';
        btnEl.onclick = () => {
            this.navigateTo('workout');
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
                    ? '<button type="button" class="btn btn-primary btn-sm" onclick="App.completeCycleWithSummary()">Chiudi ciclo</button>'
                    : `<button type="button" class="btn btn-secondary btn-sm" onclick="App.advanceCycleWeek()" aria-label="Passa alla settimana ${week + 1}">Sett. ${week + 1} ›</button>`}
                ${isDeload ? '' : '<button type="button" class="btn btn-secondary btn-sm" onclick="App.startDeloadNow()">Deload</button>'}
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
                        <h2>🏆 Ciclo completato</h2>
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
                                ${progress.volumeChangePercent >= 0 ? '↑' : '↓'} ${Math.abs(progress.volumeChangePercent || 0)}%
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
                        <button type="button" class="btn btn-primary btn-large" onclick="App.confirmCompleteCycle()">Nuovo ciclo</button>
                        <button type="button" class="btn btn-secondary" onclick="App.closeCycleSummary()">Dopo</button>
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
                        <button type="button" class="btn btn-primary" onclick="App._removeDynamicModal('rotation-detail-modal')">OK</button>
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

    // ========================================
    // EXERCISES
    // ========================================

    renderExercises(exercises = null) {
        const container = document.getElementById('exercises-grid');
        if (!container) return;
        const exerciseList = (exercises || getAllExercises()).filter(ex => !ex.hidden);

        if (!exerciseList.length) {
            container.innerHTML = '<p style="text-align:center;color:var(--text-secondary);padding:40px">Nessun esercizio trovato</p>';
            return;
        }

        container.innerHTML = exerciseList.map(ex => {
            const gifUrl = getExerciseGif(ex.id);
            return `
            <div class="exercise-card exercise-grid-card" data-id="${GT.esc(ex.id)}" tabindex="0" role="button" aria-label="${GT.esc(ex.name)}">
                <div class="exercise-gif-container">
                    ${gifUrl ? `<img src="${GT.esc(gifUrl)}" alt="" class="exercise-gif" loading="lazy" onerror="this.style.display='none'">` : ''}
                </div>
                <button type="button" class="exercise-info-btn" data-exercise-id="${GT.esc(ex.id)}" data-exercise-name="${GT.esc(ex.name)}" aria-label="Come si esegue: ${GT.esc(ex.name)}">
                    ℹ️
                </button>
                <h4>${GT.esc(ex.name)}</h4>
                <div class="muscle-tags">
                    ${(ex.primaryMuscles || []).map(m => `<span class="muscle-tag">${GT.esc(m)}</span>`).join('')}
                    ${(ex.secondaryMuscles || []).slice(0, 2).map(m => `<span class="muscle-tag secondary">${GT.esc(m)}</span>`).join('')}
                </div>
                <div class="equipment">${GT.esc(ex.category)} • ${GT.esc(ex.type)}</div>
            </div>
        `;
        }).join('');

        container.querySelectorAll('.exercise-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('.exercise-info-btn')) return;
                this.showExerciseDetail(card.dataset.id);
            });
            card.addEventListener('keydown', (e) => {
                if (e.target !== card) return;
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.showExerciseDetail(card.dataset.id);
                }
            });
        });

        container.querySelectorAll('.exercise-info-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showExerciseInfoModal(btn.dataset.exerciseId, btn.dataset.exerciseName, 'workout');
            });
        });
    },

    // Ricerca + categoria + muscolo insieme (E18)
    _applyExerciseFilters() {
        const f = this._exFilters;
        let list = f.query ? searchExercises(f.query) : getAllExercises();
        if (f.category && f.category !== 'all') {
            const ids = new Set(getExercisesByCategory(f.category).map(e => e.id));
            list = list.filter(e => ids.has(e.id));
        }
        if (f.muscle && f.muscle !== 'all') {
            const ids = new Set(getExercisesByPrimaryMuscle(f.muscle).map(e => e.id));
            list = list.filter(e => ids.has(e.id));
        }
        this.renderExercises(list);
    },

    switchExerciseType(type) {
        this._exerciseTypeTab = type;
        const workoutFilters = document.getElementById('workout-filters');
        const muscleFilter = document.querySelector('.muscle-filter');
        const searchInput = document.getElementById('exercise-search');
        if (searchInput) searchInput.value = '';

        if (type === 'workout') {
            if (workoutFilters) workoutFilters.style.display = '';
            if (muscleFilter) muscleFilter.style.display = '';
            if (searchInput) searchInput.placeholder = 'Cerca esercizio...';
            this._exFilters.query = '';
            this._applyExerciseFilters();
        } else {
            if (workoutFilters) workoutFilters.style.display = 'none';
            if (muscleFilter) muscleFilter.style.display = 'none';
            if (searchInput) searchInput.placeholder = type === 'warmup' ? 'Cerca warmup...' : 'Cerca stretching...';
            this.renderWarmupCooldownExercises(type);
        }
    },

    getUniqueWarmupCooldownExercises(type) {
        const db = type === 'warmup' ? Warmups.WARMUPS_DB : Warmups.COOLDOWN_DB;
        const detailsFn = type === 'warmup' ? getWarmupDetails : getCooldownDetails;
        const seen = new Set();
        const exercises = [];

        for (const key of Object.keys(db)) {
            for (const ex of (db[key].exercises || [])) {
                if (seen.has(ex.name)) continue;
                seen.add(ex.name);
                const details = detailsFn(ex.name);
                exercises.push({
                    name: ex.name,
                    duration: ex.duration || '',
                    description: ex.description || '',
                    gifUrl: details?.gifUrl || '',
                    hasDetails: !!details?.execution,
                    type: type
                });
            }
        }
        return exercises.sort((a, b) => a.name.localeCompare(b.name));
    },

    renderWarmupCooldownExercises(type, filter = '') {
        const container = document.getElementById('exercises-grid');
        if (!container) return;
        let exercises = this.getUniqueWarmupCooldownExercises(type);

        if (filter) {
            const q = filter.toLowerCase();
            exercises = exercises.filter(ex =>
                ex.name.toLowerCase().includes(q) || ex.description.toLowerCase().includes(q)
            );
        }

        if (!exercises.length) {
            container.innerHTML = '<p style="text-align:center;color:var(--text-secondary);padding:40px">Nessun esercizio trovato</p>';
            return;
        }

        const typeLabel = type === 'warmup' ? 'Riscaldamento' : 'Stretching';
        container.innerHTML = exercises.map(ex => `
            <div class="exercise-card exercise-grid-card" data-name="${GT.esc(ex.name)}" data-type="${GT.esc(type)}">
                <div class="exercise-gif-container">
                    ${ex.gifUrl ? `<img src="${GT.esc(ex.gifUrl)}" alt="" class="exercise-gif" loading="lazy" onerror="this.style.display='none'">` : ''}
                </div>
                ${ex.hasDetails ? `<button type="button" class="exercise-info-btn" data-exercise-name="${GT.esc(ex.name)}" data-type="${GT.esc(type)}" aria-label="Come si esegue: ${GT.esc(ex.name)}">ℹ️</button>` : ''}
                <h4>${GT.esc(ex.name)}</h4>
                <div class="muscle-tags">
                    <span class="muscle-tag ${GT.esc(type)}">${typeLabel}</span>
                    ${ex.duration ? `<span class="muscle-tag secondary">${GT.esc(ex.duration)}</span>` : ''}
                </div>
                <div class="equipment">${GT.esc(ex.description)}</div>
            </div>
        `).join('');

        container.querySelectorAll('.exercise-info-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showExerciseInfoModal(null, btn.dataset.exerciseName, btn.dataset.type);
            });
        });
    },

    /**
     * Modale con GIF e istruzioni dettagliate
     * @param {string|null} exerciseId - id dell'esercizio (workout)
     * @param {string} exerciseName - nome (warmup/cooldown si cercano per nome)
     * @param {string} type - 'workout' | 'warmup' | 'cooldown'
     */
    showExerciseInfoModal(exerciseId, exerciseName, type = 'workout') {
        const $ = (id) => document.getElementById(id);
        const gifContainer = $('exercise-gif-container');
        const stepsEl = $('execution-steps');
        const tipsEl = $('execution-tips');
        const mistakesEl = $('common-mistakes');
        const mistakesSection = $('common-mistakes-section');
        const breathingEl = $('breathing-info');
        const breathingSection = $('breathing-section');
        const musclesEl = $('muscles-info');
        const musclesSection = $('muscles-section');
        if (!gifContainer || !stepsEl || !tipsEl) return;

        const name = exerciseName || EXERCISES_DB[exerciseId]?.name || '';
        const mediaInfo = getExerciseMediaInfo(exerciseId, name, type);
        const exercise = exerciseId ? getExerciseById(exerciseId) : null;
        const li = (arr) => arr.map(x => `<li>${GT.esc(x)}</li>`).join('');
        const errorHTML = `
            <div class="gif-error">
                <div class="gif-error-icon">🏋️</div>
                <p>Immagine non disponibile</p>
            </div>
        `;

        this._setText('exercise-info-title', mediaInfo.name || name);

        // GIF: un gettone per richiesta, così un caricamento vecchio non sovrascrive quello nuovo (C14)
        const token = (this._infoGifToken = (this._infoGifToken || 0) + 1);
        if (mediaInfo.gifUrl) {
            gifContainer.innerHTML = `
                <div class="gif-loading">
                    <div class="gif-loading-spinner"></div>
                    <span>Caricamento...</span>
                </div>
            `;
            const img = new Image();
            img.onload = () => {
                if (token !== this._infoGifToken) return;
                gifContainer.innerHTML = `<img src="${GT.esc(mediaInfo.gifUrl)}" alt="${GT.esc(mediaInfo.name || name)}" />`;
            };
            img.onerror = () => {
                if (token !== this._infoGifToken) return;
                gifContainer.innerHTML = mediaInfo.svgAnimation || errorHTML;   // SVG interno, non testo utente
            };
            img.src = mediaInfo.gifUrl;
        } else {
            gifContainer.innerHTML = mediaInfo.svgAnimation || errorHTML;
        }

        const details = mediaInfo.details;
        const showMuscles = (primary, secondary) => {
            if (!musclesEl || !musclesSection) return;
            musclesEl.innerHTML = `
                <div class="muscle-group">
                    <span class="muscle-label primary">Primari:</span>
                    <span class="muscle-name">${GT.esc(primary)}</span>
                </div>
                ${secondary ? `
                    <div class="muscle-group">
                        <span class="muscle-label secondary">Secondari:</span>
                        <span class="muscle-name">${GT.esc(secondary)}</span>
                    </div>
                ` : ''}
            `;
            musclesSection.style.display = 'block';
        };
        const hide = (el) => { if (el) el.style.display = 'none'; };

        if (details) {
            if (details.steps?.length) stepsEl.innerHTML = li(details.steps);
            else stepsEl.innerHTML = li([exercise?.instructions || 'Esegui l\'esercizio con la tecnica corretta']);

            if (details.tips?.length) tipsEl.innerHTML = li(details.tips);
            else tipsEl.innerHTML = li(exercise?.tips?.length ? exercise.tips : ['Mantieni sempre il controllo del movimento']);

            if (details.commonMistakes?.length && mistakesEl && mistakesSection) {
                mistakesEl.innerHTML = li(details.commonMistakes);
                mistakesSection.style.display = 'block';
            } else {
                hide(mistakesSection);
            }

            if (details.breathing && breathingEl && breathingSection) {
                breathingEl.textContent = details.breathing;
                breathingSection.style.display = 'block';
            } else {
                hide(breathingSection);
            }

            if (details.muscles) {
                showMuscles(details.muscles.primary, details.muscles.secondary);
            } else if (exercise) {
                showMuscles((exercise.primaryMuscles || []).join(', '), (exercise.secondaryMuscles || []).join(', '));
            } else {
                hide(musclesSection);
            }
        } else if (exercise) {
            stepsEl.innerHTML = li([exercise.instructions || 'Esegui l\'esercizio con la tecnica corretta']);
            tipsEl.innerHTML = li(exercise.tips?.length ? exercise.tips : ['Mantieni sempre il controllo del movimento']);
            hide(mistakesSection);
            hide(breathingSection);
            showMuscles((exercise.primaryMuscles || []).join(', '), (exercise.secondaryMuscles || []).join(', '));
        } else {
            stepsEl.innerHTML = li(['Segui le indicazioni dell\'esercizio']);
            tipsEl.innerHTML = li(['Esegui il movimento in modo controllato']);
            hide(mistakesSection);
            hide(breathingSection);
            hide(musclesSection);
        }

        this._openModal('exercise-info-modal');
    },

    showExerciseDetail(exerciseId) {
        const exercise = getExerciseById(exerciseId);
        const content = document.getElementById('exercise-modal-content');
        if (!exercise || !content) return;
        const tags = (arr, cls = '') => (arr || []).map(m => `<span class="muscle-tag ${cls}">${GT.esc(m)}</span>`).join('');

        content.innerHTML = `
            <h2>${GT.esc(exercise.name)}</h2>
            <div class="exercise-detail">
                <div class="detail-section">
                    <h4>Muscoli primari</h4>
                    <div class="muscle-tags">${tags(exercise.primaryMuscles)}</div>
                </div>
                ${exercise.secondaryMuscles?.length ? `
                    <div class="detail-section">
                        <h4>Muscoli secondari</h4>
                        <div class="muscle-tags">${tags(exercise.secondaryMuscles, 'secondary')}</div>
                    </div>
                ` : ''}
                <div class="detail-section">
                    <h4>Informazioni</h4>
                    <p><strong>Categoria:</strong> ${GT.esc(exercise.category)}</p>
                    <p><strong>Tipo:</strong> ${GT.esc(exercise.type)}</p>
                    <p><strong>Difficoltà:</strong> ${GT.esc(exercise.difficulty)}</p>
                    ${exercise.equipment?.length ? `<p><strong>Attrezzatura:</strong> ${GT.esc(exercise.equipment.join(', '))}</p>` : ''}
                </div>
                <div class="detail-section">
                    <h4>Esecuzione</h4>
                    <p>${GT.esc(exercise.instructions || '')}</p>
                </div>
                ${exercise.tips?.length ? `
                    <div class="detail-section">
                        <h4>Consigli</h4>
                        <ul>${exercise.tips.map(tip => `<li>${GT.esc(tip)}</li>`).join('')}</ul>
                    </div>
                ` : ''}
            </div>
        `;

        this._openModal('exercise-modal');
    },

    // ========================================
    // WIZARD - Step-by-step program generator
    // ========================================

    // Scientific recommendations per goal (Pelland 2025, Singer 2024, Schoenfeld 2021)
    WIZARD_RECOMMENDATIONS: {
        hypertrophy: {
            days: { recommended: 4, alt: 6, reason: 'Pelland 2025: 12-20 serie/muscolo/settimana. 4 giorni U/L o 6 giorni PPL permettono il volume ottimale con 2+ stimoli/muscolo/settimana.' },
            split: {
                3: { recommended: 'full-body', reason: 'Con 3 giorni, il Full Body garantisce frequenza 3x/muscolo/settimana (Schoenfeld 2016: frequenza 2+ superiore per ipertrofia).' },
                4: { recommended: 'upper-lower', reason: 'Upper/Lower 4x è lo split più bilanciato: ogni muscolo 2x/settimana con volume adeguato per sessione (Remmert 2025: ~11 serie/sessione PUOS).' },
                5: { recommended: 'upper-lower', reason: 'U/L 5 giorni aggiunge un giorno braccia/spalle per volume extra sui punti deboli, mantenendo frequenza 2x/settimana.' },
                6: { recommended: 'push-pull-legs', reason: 'PPL 6x massimizza volume e frequenza (2x/settimana per gruppo). Rating 9.7/10 nelle analisi comparative 2025.' }
            },
            duration: { recommended: 60, range: '60-75', reason: 'Singer 2024: recupero 2-2.5 min tra serie compound. Remmert 2025: PUOS ~11 serie/sessione = 60-75 min ottimali.' }
        },
        strength: {
            days: { recommended: 3, alt: 4, reason: 'La forza richiede alta frequenza per movimento (2-3x/sett). 3-4 giorni con Full Body o U/L permettono pratica frequente dei fondamentali.' },
            split: {
                3: { recommended: 'full-body', reason: 'Full Body 3x permette di praticare squat, panca e stacco 2-3x/settimana. Grgic 2018: frequenza è predittore chiave per forza.' },
                4: { recommended: 'upper-lower', reason: 'U/L 4x bilancia frequenza dei fondamentali (2x) con recupero adeguato per carichi pesanti (>80% 1RM).' },
                5: { recommended: 'upper-lower', reason: 'U/L 5 giorni con giorno accessori. Buon compromesso tra frequenza e volume di pratica sui movimenti principali.' },
                6: { recommended: 'push-pull-legs', reason: 'PPL 6x per intermedi/avanzati: permette alto volume sui fondamentali con varianti diverse nei giorni B.' }
            },
            duration: { recommended: 60, range: '45-60', reason: 'Remmert 2025: PUOS ~2 serie dirette/sessione per forza. Recuperi lunghi (3-5 min) ma poche serie = 45-60 min sufficienti.' }
        },
        recomp: {
            days: { recommended: 4, alt: 3, reason: 'Frontiers Nutrition 2024: 3-4 sessioni/sett di resistenza ottimali per ricomposizione. Più sessioni = più dispendio calorico preservando massa.' },
            split: {
                3: { recommended: 'full-body', reason: 'Full Body 3x massimizza il dispendio calorico per sessione e la frequenza muscolare. Healthcare 2024: massa magra visibile a 8 settimane.' },
                4: { recommended: 'upper-lower', reason: 'U/L 4x è il miglior compromesso: volume moderato (10-15 serie/muscolo/sett), gestibile in deficit calorico (JEHS 2024).' },
                5: { recommended: 'upper-lower', reason: 'U/L 5 giorni per chi vuole più dispendio. Attenzione al recupero in deficit calorico: non eccedere con il volume.' },
                6: { recommended: 'push-pull-legs', reason: 'PPL 6x solo se deficit moderato (300-500 kcal). Volume alto in deficit aggressivo è controproducente (Int J Obesity 2025).' }
            },
            duration: { recommended: 45, range: '45-60', reason: 'Sessioni efficienti per gestire la fatica in deficit. Recuperi 1-2 min. Proteine 1.6-2.2 g/kg/giorno cruciali (meta-analisi 2024).' }
        },
        endurance: {
            days: { recommended: 3, alt: 4, reason: 'Schoenfeld 2021: endurance muscolare richiede alto volume di ripetizioni (15-25+). 3-4 giorni con recuperi brevi sono sufficienti.' },
            split: {
                3: { recommended: 'full-body', reason: 'Full Body con circuiti o superset: i recuperi brevi (30-60s) sono il driver principale dell\'adattamento all\'endurance (Schoenfeld 2021).' },
                4: { recommended: 'upper-lower', reason: 'U/L 4x permette più volume per sessione con recuperi brevi. Ideale per endurance specifica di singoli gruppi muscolari.' },
                5: { recommended: 'upper-lower', reason: 'U/L 5 giorni con sessioni corte e intense. Il volume alto è distribuibile ma attenzione al sovrallenamento.' },
                6: { recommended: 'push-pull-legs', reason: 'PPL 6x per atleti condizionati: alto volume con recuperi brevi. Solo per avanzati con buona capacità di recupero.' }
            },
            duration: { recommended: 45, range: '30-50', reason: 'Recuperi brevi (30-60s) rendono le sessioni naturalmente corte. 30-50 min sufficienti per stimolo endurance completo.' }
        },
        toning: {
            days: { recommended: 4, alt: 3, reason: 'Schoenfeld 2016: glutei 2-4x/settimana. 4 giorni U/L con priorità lower body (62% volume) è ottimale. Contreras 2015: hip thrust + squat + hinge coprono tutti gli angoli glutei.' },
            split: {
                3: { recommended: 'upper-lower', reason: 'U/L 3x: 2 giorni lower (glutei-quad + glutei-femorali) + 1 upper. Glutei allenati 2x/sett con recupero ottimale (Barbalho 2019).' },
                4: { recommended: 'upper-lower', reason: 'U/L 4x è lo split ideale per tonificazione: 2 giorni glutei/gambe + 2 upper leggeri. Volume 62% lower / 38% upper (Frontiers 2025).' },
                5: { recommended: 'upper-lower', reason: 'U/L 5x con giorno extra Glute Burn: 3 giorni lower + 2 upper. Glutei 3x/settimana per massimo sviluppo (Barbalho 2020).' },
                6: { recommended: 'upper-lower', reason: 'U/L 6x: 3 lower + 3 upper. Permette massimo volume glutei (16-22 serie/sett) con recupero adeguato tra sessioni.' }
            },
            duration: { recommended: 60, range: '45-60', reason: 'Harty 2018: le donne recuperano 25-50% più velocemente tra le serie. Con pause 60-90s compound e 30-60s isolation, 45-60 min sono sufficienti.' }
        }
    },

    openWizard() {
        this.wizardState = { step: 1, goal: null, days: null, split: null, duration: null };

        document.querySelectorAll('.wizard-step').forEach(s => s.classList.add('hidden'));
        document.getElementById('wizard-step-1')?.classList.remove('hidden');
        document.querySelectorAll('.wizard-card').forEach(c => c.classList.remove('selected'));
        document.querySelectorAll('.wizard-step-dot').forEach(d => d.classList.remove('active', 'done'));
        document.querySelector('.wizard-step-dot[data-step="1"]')?.classList.add('active');
        const fill = document.getElementById('wizard-progress-fill');
        if (fill) fill.style.width = '25%';
        const back = document.getElementById('wizard-back');
        if (back) back.style.visibility = 'hidden';
        const gen = document.getElementById('generate-program-btn');
        if (gen) gen.style.display = 'none';
        this._setText('wizard-title', '🤖 Genera Scheda');

        this._setupWizardCardClicks();
        this._openModal('ai-generator-modal', '#wizard-goal-cards .wizard-card');
    },

    _setupWizardCardClicks() {
        const bind = (containerId, handler) => {
            document.querySelectorAll(`#${containerId} .wizard-card`).forEach(card => {
                card.onclick = () => handler(card);
                this._makeKeyboardClickable(card);   // card raggiungibili da tastiera (H10)
            });
        };
        const select = (containerId, card) => {
            document.querySelectorAll(`#${containerId} .wizard-card`).forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
        };

        // Step 1: obiettivo — avanza da solo
        bind('wizard-goal-cards', (card) => {
            select('wizard-goal-cards', card);
            this.wizardState.goal = card.dataset.value;
            this.wizardState.days = null;
            this.wizardState.split = null;
            this.wizardState.duration = null;
            setTimeout(() => this.wizardNext(), 250);
        });

        // Step 2: giorni
        bind('wizard-days-cards', (card) => {
            select('wizard-days-cards', card);
            this.wizardState.days = parseInt(card.dataset.value);
            this.wizardState.split = null;
            setTimeout(() => this.wizardNext(), 250);
        });

        // Step 3: split — PPL solo con 5+ giorni
        bind('wizard-split-cards', (card) => {
            if (card.dataset.value === 'push-pull-legs' && this.wizardState.days <= 4) {
                this.showNotification('Push/Pull/Legs: servono almeno 5 giorni', 'warning');
                return;
            }
            select('wizard-split-cards', card);
            this.wizardState.split = card.dataset.value;
            setTimeout(() => this.wizardNext(), 250);
        });

        // Step 4: durata → riepilogo
        bind('wizard-duration-cards', (card) => {
            select('wizard-duration-cards', card);
            this.wizardState.duration = parseInt(card.dataset.value);
            setTimeout(() => this.wizardNext(), 250);
        });
    },

    wizardNext() {
        const s = this.wizardState;
        if (s.step === 1 && !s.goal) return;
        if (s.step === 2 && !s.days) return;
        if (s.step === 3 && !s.split) return;
        if (s.step === 4 && !s.duration) return;

        s.step++;
        this._renderWizardStep();
    },

    wizardBack() {
        if (this.wizardState.step <= 1) return;
        this.wizardState.step--;
        this._renderWizardStep();
    },

    _renderWizardStep() {
        const s = this.wizardState;
        const recs = this.WIZARD_RECOMMENDATIONS[s.goal];

        // Hide all steps
        document.querySelectorAll('.wizard-step').forEach(el => el.classList.add('hidden'));

        // Update progress
        const totalSteps = 5; // 4 steps + summary
        const progressStep = Math.min(s.step, 4);
        document.getElementById('wizard-progress-fill').style.width = `${(progressStep / 4) * 100}%`;

        // Update dots
        document.querySelectorAll('.wizard-step-dot').forEach(d => {
            const dotStep = parseInt(d.dataset.step);
            d.classList.remove('active', 'done');
            if (dotStep < s.step) d.classList.add('done');
            else if (dotStep === s.step) d.classList.add('active');
        });

        // Back button visibility
        document.getElementById('wizard-back').style.visibility = s.step > 1 ? 'visible' : 'hidden';

        // Generate button
        document.getElementById('generate-program-btn').style.display = 'none';

        if (s.step === 2) {
            this._renderDaysSuggestion(recs);
            document.getElementById('wizard-step-2').classList.remove('hidden');
            if (s.days) {
                document.querySelectorAll('#wizard-days-cards .wizard-card').forEach(c => {
                    c.classList.toggle('selected', parseInt(c.dataset.value) === s.days);
                });
            }
            this._highlightRecommended('wizard-days-cards', String(recs.days.recommended));
        } else if (s.step === 3) {
            this._renderSplitSuggestion(recs, s.days);
            document.getElementById('wizard-step-3').classList.remove('hidden');
            // Disable PPL for 3-4 days (frequency too low)
            document.querySelectorAll('#wizard-split-cards .wizard-card').forEach(c => {
                if (c.dataset.value === 'push-pull-legs') {
                    c.classList.toggle('wizard-disabled', s.days <= 4);
                } else {
                    c.classList.remove('wizard-disabled');
                }
            });
            if (s.split) {
                document.querySelectorAll('#wizard-split-cards .wizard-card').forEach(c => {
                    c.classList.toggle('selected', c.dataset.value === s.split);
                });
            }
            const recSplit = recs.split[s.days]?.recommended;
            if (recSplit) this._highlightRecommended('wizard-split-cards', recSplit);
        } else if (s.step === 4) {
            this._renderDurationSuggestion(recs);
            document.getElementById('wizard-step-4').classList.remove('hidden');
            if (s.duration) {
                document.querySelectorAll('#wizard-duration-cards .wizard-card').forEach(c => {
                    c.classList.toggle('selected', parseInt(c.dataset.value) === s.duration);
                });
            }
            this._highlightRecommended('wizard-duration-cards', String(recs.duration.recommended));
        } else if (s.step >= 5) {
            this._renderWizardSummary();
            document.getElementById('wizard-step-summary').classList.remove('hidden');
            document.getElementById('generate-program-btn').style.display = '';
        } else {
            // Step 1
            document.getElementById('wizard-step-1').classList.remove('hidden');
            if (s.goal) {
                document.querySelectorAll('#wizard-goal-cards .wizard-card').forEach(c => {
                    c.classList.toggle('selected', c.dataset.value === s.goal);
                });
            }
        }
    },

    _highlightRecommended(containerId, value) {
        document.querySelectorAll(`#${containerId} .wizard-card`).forEach(c => {
            c.classList.remove('wizard-recommended');
            if (c.dataset.value === value) {
                c.classList.add('wizard-recommended');
            }
        });
    },

    _renderDaysSuggestion(recs) {
        const el = document.getElementById('wizard-days-suggestion');
        el.innerHTML = `<div class="wizard-tip"><strong>Consigliato: ${recs.days.recommended} giorni</strong><br>${recs.days.reason}</div>`;
    },

    _renderSplitSuggestion(recs, days) {
        const el = document.getElementById('wizard-split-suggestion');
        const splitRec = recs.split[days];
        if (splitRec) {
            el.innerHTML = `<div class="wizard-tip"><strong>Consigliato: ${this._splitLabel(splitRec.recommended)}</strong><br>${splitRec.reason}</div>`;
        } else {
            el.innerHTML = '';
        }
    },

    _renderDurationSuggestion(recs) {
        const el = document.getElementById('wizard-duration-suggestion');
        el.innerHTML = `<div class="wizard-tip"><strong>Consigliato: ${recs.duration.recommended} min (range ${recs.duration.range})</strong><br>${recs.duration.reason}</div>`;
    },

    _splitLabel(value) {
        const labels = { 'upper-lower': 'Upper/Lower', 'push-pull-legs': 'Push/Pull/Legs', 'full-body': 'Full Body' };
        return labels[value] || value;
    },

    _goalLabel(value) {
        const labels = { hypertrophy: 'Ipertrofia', strength: 'Forza', recomp: 'Ricomposizione', endurance: 'Resistenza', toning: 'Tonificazione' };
        return labels[value] || value;
    },

    _renderWizardSummary() {
        const s = this.wizardState;
        const recs = this.WIZARD_RECOMMENDATIONS[s.goal];
        const splitRec = recs.split[s.days];
        const isRecommendedSplit = splitRec && splitRec.recommended === s.split;
        const isRecommendedDays = s.days === recs.days.recommended;
        const isRecommendedDuration = s.duration === recs.duration.recommended;

        document.getElementById('wizard-summary-content').innerHTML = `
            <div class="wizard-summary-row">
                <span class="wizard-summary-label">Obiettivo</span>
                <span class="wizard-summary-value">${this._goalLabel(s.goal)}</span>
            </div>
            <div class="wizard-summary-row">
                <span class="wizard-summary-label">Frequenza</span>
                <span class="wizard-summary-value">${s.days} giorni/sett ${isRecommendedDays ? '<span class="wizard-badge-ok">consigliato</span>' : ''}</span>
            </div>
            <div class="wizard-summary-row">
                <span class="wizard-summary-label">Split</span>
                <span class="wizard-summary-value">${this._splitLabel(s.split)} ${isRecommendedSplit ? '<span class="wizard-badge-ok">consigliato</span>' : ''}</span>
            </div>
            <div class="wizard-summary-row">
                <span class="wizard-summary-label">Durata</span>
                <span class="wizard-summary-value">${s.duration} min ${isRecommendedDuration ? '<span class="wizard-badge-ok">consigliato</span>' : ''}</span>
            </div>
            <div class="wizard-summary-note">
                La scheda includerà periodizzazione a mesociclo con fasi di accumulo, intensificazione e deload.
                Gli esercizi ruoteranno automaticamente tra i cicli per stimolo continuo.
            </div>
        `;
    },

    generateProgram() {
        const profile = Storage.getProfile();

        if (!profile.name) {
            this.showNotification('Prima il nome nel profilo', 'warning');
            this._closeModal('ai-generator-modal');
            this.navigateTo('profile');
            return;
        }

        const existing = Storage.getActiveProgram();
        if (existing && !confirm(`Sostituire «${existing.name || 'la scheda attiva'}»? Lo storico resta`)) {
            return;
        }

        const ws = this.wizardState || {};
        const options = {
            goal: ws.goal || 'hypertrophy',
            daysPerWeek: ws.days || 3,
            split: ws.split || 'full-body',
            sessionDuration: ws.duration || 60
        };

        let program = null;
        try {
            program = TrainingAlgorithm.generateProgram(profile, options);
        } catch (e) {
            console.error('generateProgram', e);
        }
        if (!program?.days?.length) {
            this.showNotification('Scheda non generata: prova un\'altra combinazione', 'error');
            return;
        }

        this._alignCycleStart(program);
        Storage.setActiveProgram(program);
        this._cycleSummaryDismissed = false;
        this._closeModal('ai-generator-modal');

        this.loadPrograms();
        this.loadDashboard();
        this._safe(() => this.loadProgress());
        this.showNotification('Scheda generata', 'success');
    },

    // Il ciclo parte dal lunedì di questa settimana: le settimane del ciclo coincidono con il calendario
    _alignCycleStart(program) {
        const cycle = program?.metadata?.cycle;
        if (!cycle) return;
        cycle.currentWeek = 1;
        cycle.startDate = GT.startOfWeek(new Date()).toISOString();
    },

    loadPrograms() {
        this.displayActiveProgram();
    },

    displayActiveProgram() {
        const program = Storage.getActiveProgram();
        const card = document.getElementById('active-program-card');
        const content = document.getElementById('active-program-content');
        const noState = document.getElementById('no-program-state');
        if (!card || !content) return;

        if (!program) {
            card.style.display = 'none';
            if (noState) noState.style.display = 'block';
            return;
        }

        card.style.display = 'block';
        if (noState) noState.style.display = 'none';

        const meta = program.metadata || {};
        const tempoInfo = meta.tempo
            ? `<p><strong>Esecuzione:</strong> ${GT.esc(meta.tempo.description)} ${meta.tempo.detail ? `<span class="tempo-detail">(${GT.esc(meta.tempo.detail)})</span>` : ''}</p>`
            : '';
        const cycleInfo = meta.cycle ? Storage.getCycleInfo() : null;

        let html = `
            <div class="program-info">
                <p><strong>Tipo:</strong> ${GT.esc(program.name || 'Scheda')}</p>
                <p><strong>Obiettivo:</strong> ${GT.esc(this._goalLabel(meta.goal) || 'Non specificato')}</p>
                <p><strong>Giorni:</strong> ${(program.days || []).length} a settimana</p>
                ${cycleInfo ? `<p><strong>Ciclo:</strong> ${GT.esc(meta.cycleNumber || 1)} · sett. ${cycleInfo.currentWeek}/${cycleInfo.duration}</p>` : ''}
                ${tempoInfo}
            </div>
            <div class="program-days">
        `;

        (program.days || []).forEach(day => {
            html += `
                <div class="program-day">
                    <h4>
                        ${GT.esc(day.name)}
                        <span class="day-type">${GT.esc(day.type || '')}</span>
                    </h4>
                    ${day.focus ? `<p class="day-focus">${GT.esc(day.focus)}</p>` : ''}
                    <div class="day-exercises">
                        ${(day.exercises || []).map(ex => `
                            <div class="program-exercise program-exercise-item">
                                <div class="program-exercise-content">
                                    <span class="exercise-name">${GT.esc(ex.name)}</span>
                                    <span class="exercise-details">${GT.esc(ex.sets)} x ${GT.esc(ex.reps)} ${ex.rest ? '• ' + GT.esc(ex.rest) + 's' : ''}</span>
                                </div>
                                <button type="button" class="exercise-info-btn" data-exercise-id="${GT.esc(ex.exerciseId || '')}" data-exercise-name="${GT.esc(ex.name)}" aria-label="Come si esegue: ${GT.esc(ex.name)}">
                                    ℹ️
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        });

        html += '</div>';

        if (meta.weeklyVolume && typeof meta.weeklyVolume === 'object') {
            html += `
                <div class="volume-summary">
                    <h4>Serie a settimana</h4>
                    <div class="volume-grid">
                        ${Object.entries(meta.weeklyVolume).map(([muscle, sets]) =>
                            `<div class="volume-item"><span>${GT.esc(muscle)}</span><strong>${GT.esc(sets)}</strong></div>`
                        ).join('')}
                    </div>
                </div>
            `;
        }

        content.innerHTML = html;

        content.querySelectorAll('.exercise-info-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showExerciseInfoModal(btn.dataset.exerciseId || null, btn.dataset.exerciseName, 'workout');
            });
        });
    },

    deleteActiveProgram() {
        const program = Storage.getActiveProgram();
        if (!program) return;
        if (!confirm(`Eliminare «${program.name || 'la scheda'}»? Lo storico resta`)) return;
        Storage.clearActiveProgram();
        this.loadPrograms();
        this.loadDashboard();
        this._safe(() => this.loadProgress());
        this.showNotification('Scheda eliminata', 'info');
    },

    // ========================================
    // MANUAL PROGRAM BUILDER
    // ========================================

    openManualBuilder(editMode = false) {
        this.builderState = {
            days: [],
            currentDayIndex: 0,
            isEditing: editMode
        };

        if (editMode) {
            // Si tiene una copia dei dati originali (_src): al salvataggio non si perde
            // nulla di quello che il builder non mostra (superset, note, warmup, metadata)
            const program = Storage.getActiveProgram();
            this.builderState.days = (program?.days || []).map(day => ({
                name: day.type || day.name,
                _src: day,
                exercises: (day.exercises || []).map(ex => ({
                    exerciseId: ex.exerciseId,
                    name: ex.name,
                    sets: ex.sets,
                    reps: ex.reps,
                    rest: ex.rest,
                    _src: ex
                }))
            }));
            this._setText('builder-modal-title', '✏️ Modifica Scheda');
        } else {
            this.builderState.days = [{ name: 'Giorno 1', exercises: [] }];
            this._setText('builder-modal-title', '✏️ Crea la Tua Scheda');
        }

        if (!this.builderState.days.length) this.builderState.days = [{ name: 'Giorno 1', exercises: [] }];

        this.builderRenderDays();
        const stepDays = document.getElementById('builder-step-days');
        const stepEx = document.getElementById('builder-step-exercises');
        if (stepDays) stepDays.style.display = 'block';
        if (stepEx) stepEx.style.display = 'none';
        this._openModal('manual-builder-modal');
    },

    closeManualBuilder() {
        this._closeModal('manual-builder-modal');
    },

    editActiveProgram() {
        this.openManualBuilder(true);
    },

    builderAddDay() {
        const num = this.builderState.days.length + 1;
        this.builderState.days.push({ name: `Giorno ${num}`, exercises: [] });
        this.builderRenderDays();
    },

    builderRemoveDay(index) {
        if (this.builderState.days.length <= 1) {
            this.showNotification('Serve almeno un giorno', 'warning');
            return;
        }
        const day = this.builderState.days[index];
        if (day?.exercises?.length && !confirm(`Togliere ${day.name}? ${day.exercises.length} esercizi`)) return;
        this.builderState.days.splice(index, 1);
        this.builderRenderDays();
    },

    builderRenderDays() {
        const container = document.getElementById('builder-days-list');
        if (!container) return;
        container.innerHTML = this.builderState.days.map((day, i) => `
            <div class="builder-day-row">
                <span class="day-number">${i + 1}</span>
                <input type="text" value="${GT.esc(day.name)}" placeholder="Es: Push, Pull, Gambe..." maxlength="40"
                    aria-label="Nome giorno ${i + 1}"
                    onchange="App.builderUpdateDayName(${i}, this.value)">
                <span style="color:var(--text-muted);font-size:0.8rem;">${day.exercises.length} es.</span>
                <button type="button" class="remove-day-btn" onclick="App.builderRemoveDay(${i})" aria-label="Rimuovi giorno ${i + 1}">✕</button>
            </div>
        `).join('');
    },

    builderUpdateDayName(index, name) {
        if (this.builderState.days[index]) this.builderState.days[index].name = String(name).slice(0, 40);
    },

    builderGoToExercises() {
        if (this.builderState.days.length === 0) {
            this.showNotification('Aggiungi almeno un giorno', 'warning');
            return;
        }
        for (const day of this.builderState.days) {
            if (!String(day.name || '').trim()) {
                this.showNotification('Dai un nome a tutti i giorni', 'warning');
                return;
            }
        }

        this.builderState.currentDayIndex = 0;
        document.getElementById('builder-step-days').style.display = 'none';
        document.getElementById('builder-step-exercises').style.display = 'block';
        this.builderRenderDayTabs();
        this.builderRenderCurrentDayExercises();
    },

    builderGoToDays() {
        document.getElementById('builder-step-days').style.display = 'block';
        document.getElementById('builder-step-exercises').style.display = 'none';
        document.getElementById('builder-exercise-results').innerHTML = '';
        document.getElementById('builder-exercise-search').value = '';
        this.builderRenderDays();
    },

    builderRenderDayTabs() {
        const container = document.getElementById('builder-day-tabs');
        if (!container) return;
        container.innerHTML = this.builderState.days.map((day, i) => `
            <button type="button" class="builder-day-tab ${i === this.builderState.currentDayIndex ? 'active' : ''}"
                onclick="App.builderSelectDay(${i})">
                ${GT.esc(day.name)}
                <span style="opacity:0.6;margin-left:4px;">(${day.exercises.length})</span>
            </button>
        `).join('');
    },

    builderSelectDay(index) {
        this.builderState.currentDayIndex = index;
        this.builderRenderDayTabs();
        this.builderRenderCurrentDayExercises();
        document.getElementById('builder-exercise-search').value = '';
        document.getElementById('builder-exercise-results').innerHTML = '';
    },

    builderRenderCurrentDayExercises() {
        const day = this.builderState.days[this.builderState.currentDayIndex];
        const container = document.getElementById('builder-current-day-exercises');
        if (!container) return;

        if (!day || day.exercises.length === 0) {
            container.innerHTML = '<div class="builder-empty-day">Nessun esercizio: cercalo qui sotto</div>';
            return;
        }

        container.innerHTML = day.exercises.map((ex, i) => `
            <div class="builder-exercise-item" data-index="${i}">
                <span class="drag-handle" aria-hidden="true">⠿</span>
                <span class="ex-name">${GT.esc(ex.name)}</span>
                <div class="ex-params">
                    <input type="number" value="${GT.esc(ex.sets)}" min="1" max="10" aria-label="Serie"
                        onchange="App.builderUpdateExercise(${i}, 'sets', this.value)">
                    <span>×</span>
                    <input type="text" value="${GT.esc(ex.reps)}" aria-label="Ripetizioni (es. 8-12)" style="width:60px;" maxlength="9"
                        onchange="App.builderUpdateExercise(${i}, 'reps', this.value)">
                    <span>⏱</span>
                    <input type="number" value="${GT.esc(ex.rest)}" min="15" max="600" step="15" aria-label="Recupero in secondi"
                        onchange="App.builderUpdateExercise(${i}, 'rest', this.value)">
                    <span>s</span>
                </div>
                <button type="button" class="remove-exercise-btn" onclick="App.builderRemoveExercise(${i})" aria-label="Rimuovi ${GT.esc(ex.name)}">✕</button>
            </div>
        `).join('');
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

    builderUpdateExercise(exerciseIndex, field, value) {
        const day = this.builderState.days[this.builderState.currentDayIndex];
        const ex = day?.exercises[exerciseIndex];
        if (!ex) return;
        if (field === 'sets') ex.sets = this._clampInt(value, 3, 1, 10);
        else if (field === 'rest') ex.rest = this._clampInt(value, this._defaultRest(ex.exerciseId), 15, 600);
        else if (field === 'reps') ex.reps = this._cleanReps(value, ex.reps || '8-12');
        this.builderRenderCurrentDayExercises();
    },

    builderRemoveExercise(exerciseIndex) {
        const day = this.builderState.days[this.builderState.currentDayIndex];
        day.exercises.splice(exerciseIndex, 1);
        this.builderRenderCurrentDayExercises();
        this.builderRenderDayTabs();
    },

    builderSearchExercises(query) {
        const container = document.getElementById('builder-exercise-results');
        if (!container) return;

        if (!query || query.length < 2) {
            container.innerHTML = '';
            return;
        }

        const results = searchExercises(query).filter(ex => !ex.hidden).slice(0, 15);
        const day = this.builderState.days[this.builderState.currentDayIndex];
        const existingIds = new Set(day.exercises.map(e => e.exerciseId));

        if (results.length === 0) {
            container.innerHTML = '<div style="padding:12px;color:var(--text-muted);text-align:center;">Nessun esercizio trovato</div>';
            return;
        }

        container.innerHTML = results.map(ex => {
            const alreadyAdded = existingIds.has(ex.id);
            return `
                <div class="builder-search-result ${alreadyAdded ? 'already-added' : ''}" data-id="${GT.esc(ex.id)}"
                    ${alreadyAdded ? 'aria-disabled="true" style="opacity:0.4;cursor:default;"' : 'tabindex="0" role="button"'}>
                    <div>
                        <div class="result-name">${GT.esc(ex.name)}</div>
                        <div class="result-muscles">${GT.esc((ex.primaryMuscles || []).join(', '))} • ${GT.esc(ex.type)}</div>
                    </div>
                    <span class="result-add">${alreadyAdded ? '✓' : '+'}</span>
                </div>
            `;
        }).join('');

        container.querySelectorAll('.builder-search-result:not(.already-added)').forEach(el => {
            el.addEventListener('click', () => this.builderAddExercise(el.dataset.id));
            this._makeKeyboardClickable(el);
        });
    },

    builderAddExercise(exerciseId) {
        const exercise = EXERCISES_DB[exerciseId];
        if (!exercise) return;

        const day = this.builderState.days[this.builderState.currentDayIndex];
        if (day.exercises.some(e => e.exerciseId === exerciseId)) return;
        const isCompound = exercise.type === 'compound';

        day.exercises.push({
            exerciseId: exercise.id,
            name: exercise.name,
            sets: isCompound ? 4 : 3,
            reps: isCompound ? '6-10' : '10-15',
            rest: this._defaultRest(exercise.id)
        });

        this.builderRenderCurrentDayExercises();
        this.builderRenderDayTabs();

        const searchInput = document.getElementById('builder-exercise-search');
        if (searchInput?.value) this.builderSearchExercises(searchInput.value);

        this.showNotification(`${exercise.name} aggiunto`, 'success');
    },

    builderSaveProgram() {
        const days = this.builderState.days;
        if (days.length === 0) {
            this.showNotification('Aggiungi almeno un giorno', 'warning');
            return;
        }

        // Niente giorni vuoti: diventerebbero allenamenti a 0 esercizi (C12)
        const emptyDay = days.find(d => !d.exercises.length);
        if (emptyDay) {
            this.showNotification(`${emptyDay.name}: nessun esercizio`, 'warning');
            return;
        }

        const old = this.builderState.isEditing ? Storage.getActiveProgram() : null;
        if (!this.builderState.isEditing) {
            const existing = Storage.getActiveProgram();
            if (existing && !confirm(`Sostituire «${existing.name || 'la scheda attiva'}»? Lo storico resta`)) return;
        }

        const profile = Storage.getProfile();

        const newDays = days.map((day, i) => {
            const srcDay = day._src || null;
            const exercises = day.exercises.map(ex => {
                const base = ex._src ? { ...ex._src } : {};
                return {
                    ...base,
                    exerciseId: ex.exerciseId,
                    name: ex.name,
                    sets: this._clampInt(ex.sets, 3, 1, 10),
                    reps: this._cleanReps(ex.reps, '8-12'),
                    rest: this._clampInt(ex.rest, this._defaultRest(ex.exerciseId), 15, 600),
                    type: EXERCISES_DB[ex.exerciseId]?.type || base.type || 'compound',
                    notes: base.notes || ''
                };
            });
            this._fixSupersetGroups(exercises);

            const typeName = String(day.name).trim();
            return {
                ...(srcDay || {}),
                name: srcDay?.name || `Giorno ${i + 1}`,
                type: typeName,
                focus: srcDay && (srcDay.type || srcDay.name) === typeName ? (srcDay.focus || typeName) : typeName,
                warmup: srcDay?.warmup || this.builderGuessWarmup(day),
                exercises
            };
        });

        let metadata;
        if (old?.metadata) {
            // Modifica: si conserva tutto (ciclo, tempo, goal, programId, numero ciclo…) (A6)
            metadata = {
                ...old.metadata,
                daysPerWeek: newDays.length,
                weeklyVolume: this.builderCalcWeeklyVolume(newDays)
            };
        } else {
            const goal = profile.goal || 'hypertrophy';
            const level = profile.level || 'beginner';
            metadata = {
                programId: Date.now(),
                goal,
                split: 'custom',
                daysPerWeek: newDays.length,
                sessionDuration: profile.sessionTime || 60,
                level,
                gender: profile.gender || '',
                createdFor: profile.name || '',
                isManual: true,
                isCustom: true,
                cycleNumber: 1,
                cycle: this._buildManualCycle(goal, level),
                weeklyVolume: this.builderCalcWeeklyVolume(newDays)
            };
            if (!metadata.cycle) delete metadata.cycle;
        }

        const program = {
            ...(old || {}),
            name: old?.name || 'Scheda Personalizzata',
            days: newDays,
            metadata
        };

        Storage.setActiveProgram(program);
        this.closeManualBuilder();
        this.loadPrograms();
        this.loadDashboard();
        this._safe(() => this.loadProgress());
        this.showNotification(this.builderState.isEditing ? 'Scheda aggiornata' : 'Scheda creata', 'success');
    },

    // Un superset con un solo esercizio rimasto torna un esercizio normale
    _fixSupersetGroups(exercises) {
        const count = {};
        exercises.forEach(ex => { if (ex.supersetGroup) count[ex.supersetGroup] = (count[ex.supersetGroup] || 0) + 1; });
        exercises.forEach(ex => {
            if (ex.supersetGroup && count[ex.supersetGroup] < 2) {
                delete ex.supersetGroup;
                delete ex.supersetOrder;
                delete ex.isGiantSet;
                delete ex.transitionTime;
                delete ex.supersetRest;
            }
        });
        // Ordine nel gruppo ricalcolato sulla posizione
        const order = {};
        exercises.forEach(ex => {
            if (!ex.supersetGroup) return;
            order[ex.supersetGroup] = (order[ex.supersetGroup] || 0) + 1;
            ex.supersetOrder = order[ex.supersetGroup];
        });
    },

    // Ciclo per una scheda manuale nuova (stesse fasi delle schede generate)
    _buildManualCycle(goal, level) {
        let built = null;
        try {
            built = TrainingAlgorithm.buildCycle(goal, level);
        } catch (e) {
            console.warn('buildCycle', e);
        }
        if (!built) return null;
        const phases = Array.isArray(built) ? built : built.phases;
        if (!Array.isArray(phases) || !phases.length) return null;
        return {
            ...(Array.isArray(built) ? {} : built),
            duration: Array.isArray(built) ? phases.length : (built.duration || phases.length),
            currentWeek: 1,
            startDate: GT.startOfWeek(new Date()).toISOString(),
            phases,
            isDeloadActive: false
        };
    },

    // Riscaldamento del giorno dai muscoli allenati (serie per muscolo primario)
    builderGuessWarmup(day) {
        const sets = {};
        day.exercises.forEach(ex => {
            const dbEx = EXERCISES_DB[ex.exerciseId];
            if (!dbEx) return;
            (dbEx.primaryMuscles || []).forEach(m => { sets[m] = (sets[m] || 0) + (parseInt(ex.sets) || 3); });
        });
        const sum = (list) => list.reduce((s, m) => s + (sets[m] || 0), 0);
        const quad = sets.quadricipiti || 0;
        const ham = (sets.femorali || 0) + (sets.glutei || 0);
        const lower = sum(['quadricipiti', 'femorali', 'glutei', 'polpacci']);
        const push = sum(['petto', 'spalle', 'tricipiti']);
        const pull = sum(['schiena', 'bicipiti', 'trapezio', 'avambracci']);
        const upper = push + pull;
        const db = Warmups.WARMUPS_DB || {};
        const pick = (key, fallback) => (db[key] ? key : fallback);

        if (lower && upper) {
            if (lower >= upper * 2) return quad > ham * 1.5 ? pick('legs-quad', 'lower') : ham > quad * 1.5 ? pick('legs-hamstring', 'lower') : 'lower';
            if (upper >= lower * 2) return 'upper';
            return 'full-body';
        }
        if (lower) return quad > ham * 1.5 ? pick('legs-quad', 'lower') : ham > quad * 1.5 ? pick('legs-hamstring', 'lower') : 'lower';
        if (push && !pull) return pick('push', 'upper');
        if (pull && !push) return pick('pull', 'upper');
        if (upper) return 'upper';
        return 'full-body';
    },

    builderCalcWeeklyVolume(days) {
        const volume = {};
        days.forEach(day => {
            day.exercises.forEach(ex => {
                const dbEx = EXERCISES_DB[ex.exerciseId];
                if (!dbEx) return;
                (dbEx.primaryMuscles || []).forEach(m => {
                    volume[m] = (volume[m] || 0) + (parseInt(ex.sets) || 3);
                });
            });
        });
        return volume;
    },

    // ========================================
    // WORKOUT PREVIEW (read-only, no tracking)
    // ========================================

    showWorkoutPreview() {
        if (this.activeWorkout) {
            this._promptActiveSession();
            return;
        }
        const program = Storage.getActiveProgram();
        if (!program?.days?.length) {
            this.showNotification('Nessuna scheda attiva', 'warning');
            return;
        }

        document.getElementById('workout-not-started').style.display = 'none';
        document.getElementById('workout-active').style.display = 'none';
        document.getElementById('workout-preview').style.display = 'block';

        const startIndex = Math.min(this.getSuggestedDayIndex(program), program.days.length - 1);
        const navContainer = document.getElementById('preview-day-nav');
        navContainer.innerHTML = program.days.map((day, i) => `
            <button type="button" class="preview-day-tab ${i === startIndex ? 'active' : ''}" data-day-index="${i}">
                ${GT.esc(day.type || day.name)}
            </button>
        `).join('');

        navContainer.querySelectorAll('.preview-day-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                navContainer.querySelectorAll('.preview-day-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.renderPreviewDay(program.days[parseInt(tab.dataset.dayIndex)]);
            });
        });

        this.renderPreviewDay(program.days[startIndex]);
    },

    renderPreviewDay(day) {
        const container = document.getElementById('preview-content');
        if (!container || !day) return;

        const cycleInfo = Storage.getCycleInfo();
        const isDeload = Storage.isDeloadActive();
        const phase = this._currentPhase(cycleInfo, isDeload);
        const phased = this._applyPhase(day, phase);
        const exercises = phased.exercises || [];

        let html = '';
        let currentGroup = null;
        exercises.forEach((ex, i) => {
            const gifUrl = getExerciseGif(ex.exerciseId);
            const lastPerf = Storage.getLastPerformance(ex.exerciseId);
            const hint = lastPerf ? `<span class="preview-hint">Ultima: ${GT.esc(lastPerf.weight)} kg × ${GT.esc(lastPerf.reps)}</span>` : '';
            const group = ex.supersetGroup ? GT.esc(ex.supersetGroup) : null;

            if (group && ex.supersetGroup !== currentGroup) {
                if (currentGroup) html += '</div>';
                currentGroup = ex.supersetGroup;
                html += `<div class="preview-superset-group">
                    <div class="preview-superset-label">
                        <span class="superset-badge superset-badge-${group}" style="font-size:0.6rem;padding:1px 6px;">${ex.isGiantSet ? 'Giant Set' : 'Superset'} ${group}</span>
                    </div>`;
            } else if (!group && currentGroup) {
                html += '</div>';
                currentGroup = null;
            }

            const pause = group ? `${GT.esc(ex.transitionTime || 10)}s cambio` : `${GT.esc(ex.rest || this._defaultRest(ex.exerciseId))}s pausa`;
            html += `
                <div class="preview-exercise-row">
                    <span class="preview-ex-num">${i + 1}</span>
                    ${gifUrl ? `<img src="${GT.esc(gifUrl)}" class="preview-ex-gif" alt="" loading="lazy" onerror="this.style.display='none'">` : '<div class="preview-ex-gif-placeholder"></div>'}
                    <div class="preview-ex-info">
                        <div class="preview-ex-name">${GT.esc(ex.name)}${group ? ` <span class="superset-badge superset-badge-${group}" style="font-size:0.55rem;padding:1px 4px;">${group}${GT.esc(ex.supersetOrder || '')}</span>` : ''}</div>
                        <div class="preview-ex-details">${GT.esc(ex.sets)} x ${GT.esc(ex.reps)} · ${pause}</div>
                        ${hint}
                    </div>
                </div>
            `;
        });
        if (currentGroup) html += '</div>';

        const rir = phase?.rirTarget ? GT.esc(`RIR ${phase.rirTarget.min}-${phase.rirTarget.max}`) : '';
        container.innerHTML = `
            <div class="card preview-day-card">
                <h3>${GT.esc(day.focus || day.type || day.name)}</h3>
                ${cycleInfo ? `<p class="preview-phase-info">${GT.esc(phase?.phaseName || '')} · Sett. ${cycleInfo.currentWeek}/${cycleInfo.duration}${rir ? ' · ' + rir : ''}</p>` : ''}
                <div class="preview-exercises">${html}</div>
            </div>
        `;
    },

    closeWorkoutPreview() {
        document.getElementById('workout-preview').style.display = 'none';
        if (!this.activeWorkout) document.getElementById('workout-not-started').style.display = 'block';
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
            this.navigateTo('workout');
            return true;
        }
        if (confirm(`Terminare ${w.name}? ${done} serie fatte`)) {
            this.navigateTo('workout');
            this.endWorkout(true);
        }
        return true;
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
                    ${already ? '<span class="added-badge">Aggiunto</span>' : `<button type="button" class="btn btn-sm btn-primary" data-add="${GT.esc(ex.id)}" aria-label="Aggiungi ${GT.esc(ex.name)}">+</button>`}
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
                <button type="button" class="btn btn-sm btn-danger" onclick="App.freeWorkoutRemoveExercise(${i})" aria-label="Rimuovi ${GT.esc(ex.name)}">✕</button>
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

    startSimulatedWorkout() {
        const fakeWorkout = {
            type: 'Simulazione',
            warmup: null,
            exercises: [
                { exerciseId: 'bench-press', name: 'Panca Piana (TEST)', sets: 3, reps: '8-12', rest: 90 },
                { exerciseId: 'lat-pulldown', name: 'Lat Machine (TEST)', sets: 3, reps: '10-12', rest: 60 }
            ]
        };
        if (this.activeWorkout) {
            this._promptActiveSession();
            return;
        }
        this.startWorkout(fakeWorkout, { isSimulation: true });
        this.showNotification('🧪 Simulazione: non si salva nulla', 'info');
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

        this.navigateTo('workout');
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
                    <button type="button" class="exercise-info-btn" data-exercise-name="${GT.esc(ex.name)}" aria-label="Come si esegue: ${GT.esc(ex.name)}" style="background:linear-gradient(135deg,#4361ee,#7209b7);border:none;color:white;width:44px;height:44px;border-radius:50%;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;font-size:0.9rem;flex-shrink:0;">
                        ℹ️
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
                    <span class="bw-icon">🏋️</span>
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
                <button type="button" class="exercise-info-btn" onclick="App.showCurrentExerciseInfo()" aria-label="Come si esegue: ${GT.esc(exercise.name)}" style="background:linear-gradient(135deg,#4361ee,#7209b7);border:none;color:white;width:44px;height:44px;border-radius:50%;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0;">
                    ℹ️
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
                            ${set.completed ? '✓' : ''}${set.isNewPR ? '🏆' : ''}
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
                    this.showNotification(prCheck.type === 'weight' ? `🏆 PR di peso: ${weight} kg` : `🏆 PR: ${weight} kg × ${reps}`, 'success');
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
                    setTimeout(() => this.showNotification(`🎯 Prossima volta ${ev.nextWeight} kg (+${ev.increment})`, 'success'), 500);
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
                    <span class="duration-icon">⏱️</span>
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
                    <button type="button" class="exercise-info-btn" data-exercise-name="${GT.esc(ex.name)}" aria-label="Come si esegue: ${GT.esc(ex.name)}" style="background:linear-gradient(135deg,#4361ee,#7209b7);border:none;color:white;width:44px;height:44px;border-radius:50%;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;font-size:0.9rem;flex-shrink:0;">
                        ℹ️
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
        this.navigateTo('dashboard');
        this._safe(() => this.loadProgress());

        if (w.isSimulation) {
            this.showNotification('🧪 Simulazione finita: nulla salvato', 'info');
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
                        <button type="button" class="btn btn-primary" onclick="App.confirmWeekAdvancement()">Avanza</button>
                        <button type="button" class="btn btn-secondary" onclick="App.dismissWeekAdvancement()">Resta</button>
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
                    <h3>🔄 Deload</h3>
                    <p>${GT.esc(message)}</p>
                    <div class="deload-suggestion-actions">
                        <button type="button" class="btn btn-warning btn-primary" onclick="App.acceptDeloadSuggestion('${type === 'prossima' ? 'prossima' : 'anticipato'}')">Sì</button>
                        <button type="button" class="btn btn-secondary" onclick="App.dismissDeloadSuggestion()">Non ora</button>
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
                    <h3>🎉 ${GT.esc(summary.name || 'Allenamento')} fatto</h3>
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
                    <button type="button" class="btn btn-primary" onclick="App.closeWorkoutCompletionSummary()">Chiudi</button>
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
                    <h3>📋 ${GT.esc(workout.name || 'Allenamento')}</h3>
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
                        <button type="button" class="btn btn-primary" data-action="close" style="flex:1;">Chiudi</button>
                        <button type="button" class="btn btn-secondary" data-action="edit" style="flex:1;">Modifica</button>
                        <button type="button" class="btn btn-danger btn-sm" data-action="delete">Elimina</button>
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
                        <button type="button" class="btn btn-primary" onclick="App.saveWorkoutEdit()" style="flex:1;">Salva</button>
                        <button type="button" class="btn btn-secondary" onclick="App.closeWorkoutEdit()" style="flex:1;">Annulla</button>
                    </div>
                </div>
            </div>
        `;

        if (hadModal) {
            // Ridisegno durante la modifica: stesso modale, stesso punto di scorrimento
            document.getElementById('workout-edit-modal').outerHTML = html;
            const content = document.querySelector('#workout-edit-modal .progression-summary-content');
            if (content) content.scrollTop = scroll;
            document.getElementById('workout-edit-modal')?.setAttribute('role', 'dialog');
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
        if (this.currentPage === 'progress') this._safe(() => this.initCharts());
    },

    closeWorkoutEdit() {
        this._removeDynamicModal('workout-edit-modal');
        this._editingWorkout = null;
    },

    // ========================================
    // PROFILE
    // ========================================

    // Il form si ricarica ogni volta che si apre la pagina (E8: il peso aggiunto in Progressi non va perso)
    loadProfile() {
        const p = Storage.getProfile();
        const set = (id, v) => {
            const el = document.getElementById(id);
            if (el) el.value = v ?? '';
        };

        set('profile-name', p.name);
        set('profile-gender', p.gender || '');
        set('profile-birthdate', p.birthdate);
        set('profile-height', p.height);
        set('profile-weight', p.weight);
        set('profile-bodyfat', p.bodyFat);
        set('profile-level', p.level || 'beginner');
        set('profile-background', p.background || 'none');
        set('profile-goal', p.goal || 'hypertrophy');
        set('profile-target-weight', p.targetWeight);
        set('profile-target-bf', p.targetBodyFat);
        set('profile-days', p.daysPerWeek || 3);
        set('profile-session-time', p.sessionTime || 60);

        const equipment = Array.isArray(p.equipment) ? p.equipment : [];
        document.querySelectorAll('#equipment-checkboxes input').forEach(cb => {
            cb.checked = equipment.includes(cb.value);
        });
    },

    saveProfile() {
        const val = (id) => document.getElementById(id)?.value ?? '';
        const num = (id) => {
            const v = GT.num(val(id));
            return Number.isFinite(v) && v > 0 ? v : null;
        };
        const equipment = [];
        document.querySelectorAll('#equipment-checkboxes input:checked').forEach(cb => equipment.push(cb.value));

        const profile = {
            ...Storage.getProfile(),
            name: val('profile-name').trim().slice(0, 40),
            gender: val('profile-gender'),
            birthdate: val('profile-birthdate'),
            height: num('profile-height'),
            weight: num('profile-weight'),
            bodyFat: num('profile-bodyfat'),
            level: val('profile-level') || 'beginner',
            background: val('profile-background') || 'none',
            goal: val('profile-goal') || 'hypertrophy',
            targetWeight: num('profile-target-weight'),
            targetBodyFat: num('profile-target-bf'),
            daysPerWeek: parseInt(val('profile-days')) || 3,
            sessionTime: parseInt(val('profile-session-time')) || 60,
            equipment
        };

        Storage.saveProfile(profile);
        this._ctxCache = this.activeWorkout ? {} : null;   // il peso corporeo entra nel corpo libero
        this.loadDashboard();
        this.showNotification('Profilo salvato', 'success');
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
        if (this.currentPage === 'progress') this._safe(() => this.initCharts());
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

    // ========================================
    // SETTINGS
    // ========================================

    loadSettings() {
        const s = Storage.getSettings();
        const setVal = (id, v) => { const el = document.getElementById(id); if (el && v != null) el.value = v; };
        const setChecked = (id, v) => { const el = document.getElementById(id); if (el) el.checked = !!v; };

        setVal('setting-rest-compound', s.restTimeCompound);
        setVal('setting-rest-isolation', s.restTimeIsolation);
        setVal('setting-rest-sound', s.restSound || 'beep');
        setChecked('setting-vibration', s.vibration !== false);
        setVal('setting-theme', s.theme || 'dark');
        const notifGranted = typeof Notification !== 'undefined' && Notification.permission === 'granted';
        setChecked('setting-notifications', !!s.notifications && notifGranted);
        setChecked('setting-keep-awake', s.keepAwake !== false);
        setChecked('setting-background-alerts', !!s.backgroundAlerts);

        this._setText('app-version', GT.APP_VERSION);
        this.updateStorageUsage();
    },

    updateStorageUsage() {
        let totalSize = 0;
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                totalSize += ((localStorage.getItem(key) || '').length + key.length) * 2;   // UTF-16
            }
        } catch (e) {
            return;
        }

        const sizeKB = totalSize / 1024;
        const sizeMB = sizeKB / 1024;
        const maxMB = 5;
        const percentUsed = Math.min((sizeMB / maxMB) * 100, 100);

        const storageBar = document.getElementById('storage-used-bar');
        if (storageBar) storageBar.style.width = `${Math.max(percentUsed, 2)}%`;
        this._setText('storage-text', sizeMB >= 1
            ? `${sizeMB.toFixed(2).replace('.', ',')} MB su ~5 MB`
            : `${Math.round(sizeKB)} KB su ~5 MB`);
    },

    // Salva solo i campi presenti nella pagina; il resto delle impostazioni resta com'è
    saveSettings() {
        const s = Storage.getSettings();
        const el = (id) => document.getElementById(id);
        const int = (id, def, min, max) => this._clampInt(el(id)?.value, def, min, max);

        if (el('setting-rest-compound')) s.restTimeCompound = int('setting-rest-compound', 120, 15, 600);
        if (el('setting-rest-isolation')) s.restTimeIsolation = int('setting-rest-isolation', 75, 15, 600);
        if (el('setting-rest-sound')) s.restSound = el('setting-rest-sound').value || 'beep';
        if (el('setting-vibration')) s.vibration = el('setting-vibration').checked;
        if (el('setting-theme')) s.theme = el('setting-theme').value || 'dark';
        if (el('setting-notifications')) s.notifications = el('setting-notifications').checked;
        if (el('setting-keep-awake')) s.keepAwake = el('setting-keep-awake').checked;
        if (el('setting-background-alerts')) s.backgroundAlerts = el('setting-background-alerts').checked;
        delete s.weightUnit;   // unità sempre kg

        Storage.saveSettings(s);
    },

    // Il permesso delle notifiche si chiede solo da qui, mai in automatico
    async onNotificationsToggle(input) {
        if (input.checked) {
            if (typeof Notification === 'undefined') {
                input.checked = false;
                this.showNotification('Notifiche non disponibili su questo browser', 'warning');
            } else {
                let result = null;
                try {
                    result = await Timer.requestNotificationPermission();
                } catch (e) {
                    result = null;
                }
                const granted = result === 'granted' || result === true || Notification.permission === 'granted';
                if (!granted) {
                    input.checked = false;
                    this.showNotification('Notifiche bloccate: consentile dal browser', 'warning');
                }
            }
        }
        this.saveSettings();
    },

    loadTheme() {
        this.setTheme(Storage.getSettings().theme || 'dark', false);
    },

    setTheme(theme, save = true) {
        if (theme === 'auto') {
            const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
            document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        } else {
            document.documentElement.setAttribute('data-theme', theme);
        }

        if (save) {
            const settings = Storage.getSettings();
            settings.theme = theme;
            Storage.saveSettings(settings);
            if (this.currentPage === 'progress') this._safe(() => this.initCharts());
        }
    },

    // ========================================
    // DATA EXPORT/IMPORT
    // ========================================

    exportData() {
        let data = Storage.exportAllData();
        if (typeof data !== 'string') data = JSON.stringify(data, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `gymtracker_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();

        // Su iOS il download parte dopo il click: l'URL si libera più tardi (G9)
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        this.showNotification('Backup esportato', 'success');
    },

    importData(file) {
        if (!file) return;
        if (!confirm(`Importare ${file.name}? Sostituisce i dati attuali`)) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            let result = false;
            try {
                result = Storage.importAllData(e.target.result);
            } catch (err) {
                console.error('importAllData', err);
                result = false;
            }
            const ok = result === true || result?.ok === true || result?.success === true;
            if (ok) {
                this.showNotification('Dati importati', 'success');
                setTimeout(() => location.reload(), 600);
            } else {
                const reason = Storage.lastImportError || result?.error;
                const why = typeof reason === 'string' && reason ? `: ${reason}` : '';
                this.showNotification(`Importazione non riuscita${why}`, 'error');
            }
        };
        reader.onerror = () => this.showNotification('File non leggibile', 'error');
        reader.readAsText(file);
    },

    // ========================================
    // UTILITIES
    // ========================================

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

    // Avvisi impilati in una colonna: non si sovrappongono (H9). Testo sempre come TESTO.
    showNotification(message, type = 'info') {
        let stack = document.getElementById('toast-stack');
        if (!stack) {
            stack = document.createElement('div');
            stack.id = 'toast-stack';
            stack.className = 'toast-stack';
            stack.setAttribute('role', 'status');
            stack.setAttribute('aria-live', 'polite');
            stack.style.cssText = `
                position: fixed;
                top: calc(12px + env(safe-area-inset-top, 0px));
                right: 12px;
                left: auto;
                max-width: min(360px, calc(100vw - 24px));
                display: flex;
                flex-direction: column;
                gap: 8px;
                z-index: 9999;
                pointer-events: none;
            `;
            document.body.appendChild(stack);
        }

        // Al massimo 3 avvisi a schermo
        while (stack.children.length >= 3) stack.firstElementChild.remove();

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        const msgSpan = document.createElement('span');
        msgSpan.textContent = message;
        msgSpan.style.flex = '1';
        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.textContent = '×';
        closeBtn.setAttribute('aria-label', 'Chiudi avviso');
        closeBtn.style.cssText = 'background:none;border:none;color:inherit;font-size:1.3rem;cursor:pointer;min-width:44px;min-height:44px;margin:-12px -12px -12px 0;';
        closeBtn.onclick = () => notification.remove();
        notification.appendChild(msgSpan);
        notification.appendChild(closeBtn);

        // Testo scuro su verde/giallo/rosso, chiaro sul blu: contrasto AA
        const bg = { success: 'var(--success)', warning: 'var(--warning)', error: 'var(--danger)' }[type] || 'var(--accent-primary)';
        const fg = type === 'info' ? '#fff' : '#111';
        notification.style.cssText = `
            pointer-events: auto;
            padding: 12px 16px;
            border-radius: 8px;
            background: ${bg};
            color: ${fg};
            display: flex;
            align-items: center;
            gap: 10px;
            animation: slideIn 0.3s ease;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            font-weight: 500;
        `;

        stack.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
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
            title = '✅ Cardio fatto';
        } else {
            const type = String(suggestion.preferredType || 'HIIT').toLowerCase();
            const pick = type === 'mixed' ? (done % 2 === 0 ? 'hiit' : 'liss') : type;
            title = pick === 'liss' ? '🚶 LISS consigliato' : '🔥 HIIT consigliato';
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
                <div class="exercise-check">✓</div>
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
        const icons = {
            'walking-incline': '🚶',
            'cycling-steady': '🚴',
            'elliptical': '🏃',
            'rowing-steady': '🚣',
            'swimming': '🏊',
            'outdoor-walk': '🌳',
            'stair-climber': '📶'
        };
        return icons[activityId] || '🏃';
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
                this._setText('conditioning-interval-time', '✓');
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
            this._setText('active-session-title', `🔥 HIIT · ${plan?.p.name || ''}`);
            infoContainer.innerHTML = `
                <div class="selected-exercises-list">
                    ${st.exercises.map(id => HIIT_EXERCISES?.[id] ? `<span class="selected-exercise-tag">${GT.esc(HIIT_EXERCISES[id].name)}</span>` : '').join('')}
                </div>
                <div id="hiit-current-exercise"></div>
            `;
            this._showHiitExercise(st.exercises[0]);
        } else {
            const activity = typeof LISS_ACTIVITIES !== 'undefined' ? LISS_ACTIVITIES[st.lissActivity] : null;
            this._setText('active-session-title', `🚶 LISS · ${activity?.name || 'Cardio'}`);
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
    }
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
