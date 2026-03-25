/**
 * GymTracker Pro - Main Application
 * Your Digital Personal Trainer
 */

// ========================================
// APP STATE
// ========================================

const App = {
    currentPage: 'dashboard',
    activeWorkout: null,
    currentExerciseIndex: 0,
    currentSetIndex: 0,
    charts: {},

    // Manual builder state
    builderState: {
        days: [],           // [{name: 'Push', exercises: [{exerciseId, name, sets, reps, rest}]}]
        currentDayIndex: 0,
        isEditing: false    // true when editing existing program
    },

    // Conditioning state
    conditioningState: {
        type: null,          // 'hiit' o 'liss'
        protocol: null,      // per HIIT
        lissActivity: null,  // per LISS
        duration: 20,        // minuti
        exercises: [],       // esercizi selezionati
        step: 1,             // step corrente del modal
        startTime: null,     // inizio sessione
        timerInterval: null, // interval del timer
        elapsedSeconds: 0    // secondi trascorsi
    },

    // ========================================
    // INITIALIZATION
    // ========================================

    init() {
        this.setupNavigation();
        this.setupEventListeners();
        this.loadTheme();
        this.loadDashboard();
        this.renderExercises();
        this.loadProfile();
        this.loadSettings();
        this.loadPrograms();
        this.loadProgress();

        // Check if profile is set up
        const profile = Storage.getProfile();
        if (!profile.name) {
            this.showPage('profile');
            this.showNotification('Benvenuto! Configura il tuo profilo per iniziare.', 'info');
        }

        console.log('GymTracker Pro initialized!');
    },

    // ========================================
    // NAVIGATION
    // ========================================

    setupNavigation() {
        // Sidebar navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                this.showPage(page);

                // Update active state
                document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');

                // Close mobile menu
                document.getElementById('sidebar').classList.remove('active');
            });
        });

        // Mobile menu toggle
        document.getElementById('menuToggle')?.addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('active');
        });
    },

    showPage(pageName) {
        document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
        const page = document.getElementById(`page-${pageName}`);
        if (page) {
            page.classList.add('active');
            this.currentPage = pageName;

            // Page-specific initialization
            if (pageName === 'progress') {
                this.loadProgress();
                this.initCharts();
            }
        }
    },

    navigateTo(pageName) {
        this.showPage(pageName);
        // Update nav active state
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === pageName);
        });
        // Close mobile menu if open
        document.getElementById('sidebar')?.classList.remove('active');
    },

    // ========================================
    // EVENT LISTENERS
    // ========================================

    setupEventListeners() {
        // Profile form
        document.getElementById('profile-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProfile();
        });

        // Generate program button
        document.getElementById('generate-program-btn')?.addEventListener('click', () => {
            this.generateProgram();
        });

        // Delete program button
        document.getElementById('delete-program-btn')?.addEventListener('click', () => {
            this.deleteActiveProgram();
        });

        // Edit program button
        document.getElementById('edit-program-btn')?.addEventListener('click', () => {
            this.editActiveProgram();
        });

        // Open manual builder
        document.getElementById('open-manual-builder-btn')?.addEventListener('click', () => {
            this.openManualBuilder();
        });

        // Open AI generator wizard
        document.getElementById('open-ai-generator-btn')?.addEventListener('click', () => {
            this.openWizard();
        });

        // Close AI generator modal
        document.getElementById('close-ai-generator')?.addEventListener('click', () => {
            document.getElementById('ai-generator-modal').classList.remove('active');
        });

        document.getElementById('ai-generator-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'ai-generator-modal') {
                document.getElementById('ai-generator-modal').classList.remove('active');
            }
        });

        // Wizard navigation
        document.getElementById('wizard-back')?.addEventListener('click', () => {
            this.wizardBack();
        });

        // Manual builder controls
        document.getElementById('close-manual-builder')?.addEventListener('click', () => {
            this.closeManualBuilder();
        });

        document.getElementById('manual-builder-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'manual-builder-modal') {
                this.closeManualBuilder();
            }
        });

        document.getElementById('builder-add-day-btn')?.addEventListener('click', () => {
            this.builderAddDay();
        });

        document.getElementById('builder-to-exercises-btn')?.addEventListener('click', () => {
            this.builderGoToExercises();
        });

        document.getElementById('builder-back-to-days-btn')?.addEventListener('click', () => {
            this.builderGoToDays();
        });

        document.getElementById('builder-save-btn')?.addEventListener('click', () => {
            this.builderSaveProgram();
        });

        document.getElementById('builder-exercise-search')?.addEventListener('input', (e) => {
            this.builderSearchExercises(e.target.value);
        });

        // Start workout buttons
        document.getElementById('start-scheduled-workout')?.addEventListener('click', () => {
            this.startScheduledWorkout();
        });

        document.getElementById('start-free-workout')?.addEventListener('click', () => {
            this.startFreeWorkout();
        });

        document.getElementById('preview-workout-btn')?.addEventListener('click', () => {
            this.showWorkoutPreview();
        });

        document.getElementById('close-preview-btn')?.addEventListener('click', () => {
            this.closeWorkoutPreview();
        });

        document.getElementById('cancel-workout-btn')?.addEventListener('click', () => {
            this.cancelWorkout();
        });

        document.getElementById('start-workout-btn')?.addEventListener('click', () => {
            this.startScheduledWorkout();
        });

        // See all links navigation
        document.querySelectorAll('.see-all-link[data-page]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateTo(link.dataset.page);
            });
        });

        // End workout button
        document.getElementById('end-workout-btn')?.addEventListener('click', () => {
            this.endWorkout();
        });

        // Riscaldamento finito - nasconde la sezione
        document.getElementById('skip-warmup')?.addEventListener('click', () => {
            const warmupSection = document.getElementById('warmup-section');
            if (warmupSection) {
                warmupSection.style.display = 'none';
            }
        });

        // Warmup header click - toggle collapse/expand
        document.getElementById('warmup-header')?.addEventListener('click', () => {
            const warmupSection = document.getElementById('warmup-section');
            if (warmupSection) {
                warmupSection.classList.toggle('collapsed');
            }
        });

        // Rest timer controls
        document.getElementById('rest-minus-15')?.addEventListener('click', () => {
            Timer.adjustRestTime(-15);
        });

        document.getElementById('rest-plus-15')?.addEventListener('click', () => {
            Timer.adjustRestTime(15);
        });

        document.getElementById('skip-rest')?.addEventListener('click', () => {
            Timer.skipRest();
        });

        // Cooldown controls
        document.getElementById('skip-cooldown')?.addEventListener('click', () => {
            if (!confirm('Terminare e salvare l\'allenamento?')) return;
            this.finishWorkout();
        });

        document.getElementById('complete-cooldown')?.addEventListener('click', () => {
            if (!confirm('Terminare e salvare l\'allenamento?')) return;
            this.finishWorkout();
        });

        // Exercise search
        document.getElementById('exercise-search')?.addEventListener('input', (e) => {
            this.filterExercises(e.target.value);
        });

        // Exercise category filters
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.filterExercisesByCategory(tab.dataset.category);
            });
        });

        // Muscle filter
        document.getElementById('muscle-filter')?.addEventListener('change', (e) => {
            this.filterExercisesByMuscle(e.target.value);
        });

        // Body measurement form
        document.getElementById('body-measurement-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveMeasurement();
        });

        // Toggle weight form button
        document.getElementById('toggle-weight-form')?.addEventListener('click', () => {
            const container = document.getElementById('weight-form-container');
            if (container) {
                container.style.display = container.style.display === 'none' ? 'block' : 'none';
            }
        });

        // Settings
        document.getElementById('setting-theme')?.addEventListener('change', (e) => {
            this.setTheme(e.target.value);
        });

        // Export/Import buttons
        document.getElementById('export-data-btn')?.addEventListener('click', () => {
            this.exportData();
        });

        document.getElementById('import-data-btn')?.addEventListener('click', () => {
            document.getElementById('import-file-input').click();
        });

        document.getElementById('import-file-input')?.addEventListener('change', (e) => {
            this.importData(e.target.files[0]);
        });

        document.getElementById('reset-data-btn')?.addEventListener('click', () => {
            if (confirm('Sei sicuro di voler cancellare TUTTI i dati? Questa azione non può essere annullata.')) {
                Storage.clearAllData();
                location.reload();
            }
        });

        // Clear only progress data button
        document.getElementById('clear-progress-btn')?.addEventListener('click', () => {
            if (confirm('Vuoi cancellare solo i progressi (allenamenti, PR, streak, cicli)?\n\nIl profilo, le impostazioni e le schede verranno mantenuti.')) {
                Storage.clearProgressData();
                this.showToast('Progressi cancellati!', 'success');
                this.loadDashboard();
                this.updateCycleCard();
                this.loadProgress();
                this.initCharts();
                this.updateStorageUsage();
            }
        });

        // Clear cache button
        document.getElementById('clear-cache-btn')?.addEventListener('click', async () => {
            if (confirm('Vuoi svuotare la cache e ricaricare l\'app per vedere gli ultimi aggiornamenti?')) {
                try {
                    // Unregister service worker
                    if ('serviceWorker' in navigator) {
                        const registrations = await navigator.serviceWorker.getRegistrations();
                        for (const registration of registrations) {
                            await registration.unregister();
                        }
                    }

                    // Clear all caches
                    if ('caches' in window) {
                        const cacheNames = await caches.keys();
                        for (const cacheName of cacheNames) {
                            await caches.delete(cacheName);
                        }
                    }

                    alert('Cache svuotata! La pagina si ricaricherà.');
                    location.reload(true);
                } catch (error) {
                    console.error('Errore durante la pulizia della cache:', error);
                    alert('Errore durante la pulizia della cache. Riprova.');
                }
            }
        });

        // Simulate workout button
        document.getElementById('simulate-workout-btn')?.addEventListener('click', () => {
            this.startSimulatedWorkout();
        });

        // Exercise modal
        document.getElementById('close-exercise-modal')?.addEventListener('click', () => {
            document.getElementById('exercise-modal').classList.remove('active');
        });

        // Close modal on background click
        document.getElementById('exercise-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'exercise-modal') {
                document.getElementById('exercise-modal').classList.remove('active');
            }
        });

        // Exercise info modal (GIF + detailed instructions)
        document.getElementById('close-exercise-info-modal')?.addEventListener('click', () => {
            document.getElementById('exercise-info-modal').classList.remove('active');
        });

        document.getElementById('exercise-info-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'exercise-info-modal') {
                document.getElementById('exercise-info-modal').classList.remove('active');
            }
        });

        // Conditioning event listeners
        document.getElementById('start-conditioning-btn')?.addEventListener('click', () => {
            this.openConditioningModal();
        });

        document.getElementById('conditioning-btn')?.addEventListener('click', () => {
            this.openConditioningModal();
        });

        document.getElementById('close-conditioning-modal')?.addEventListener('click', () => {
            this.closeConditioningModal();
        });

        document.getElementById('conditioning-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'conditioning-modal') {
                this.closeConditioningModal();
            }
        });

        // Type selection - HIIT
        document.getElementById('choose-hiit')?.addEventListener('click', () => {
            this.conditioningState.type = 'hiit';
            this.showConditioningStep('hiit');
            this.populateHIITExercises();
        });

        // Type selection - LISS
        document.getElementById('choose-liss')?.addEventListener('click', () => {
            this.conditioningState.type = 'liss';
            this.showConditioningStep('liss');
            this.populateLISSActivities();
        });

        // Back buttons
        document.getElementById('conditioning-back-hiit')?.addEventListener('click', () => {
            this.showConditioningStep('1');
        });

        document.getElementById('conditioning-back-liss')?.addEventListener('click', () => {
            this.showConditioningStep('1');
        });

        // Start buttons
        document.getElementById('start-hiit-btn')?.addEventListener('click', () => {
            if (this.conditioningState.exercises.length === 0) {
                this.showNotification('Seleziona almeno un esercizio', 'warning');
                return;
            }
            this.startConditioningSession();
        });

        document.getElementById('start-liss-btn')?.addEventListener('click', () => {
            if (!this.conditioningState.lissActivity) {
                this.showNotification('Seleziona un\'attività', 'warning');
                return;
            }
            this.startConditioningSession();
        });

        // End session
        document.getElementById('end-conditioning-btn')?.addEventListener('click', () => {
            this.finishConditioningSession();
        });

        // Save session
        document.getElementById('save-conditioning-btn')?.addEventListener('click', () => {
            this.saveConditioningSession();
        });
    },

    // ========================================
    // DASHBOARD
    // ========================================

    loadDashboard() {
        this.updateGreeting();
        this.updateStats();
        this.updateWeekDays();
        this.updateQuickAction();
        this.updateRecentActivity();
        this.updateBodyStats();
        this.updateCycleCard();
        this.updateWeeklyCount();
        this.updateConditioningCard();
    },

    updateGreeting() {
        const hour = new Date().getHours();
        const profile = Storage.getProfile();
        let greeting = '';

        if (hour < 12) greeting = 'Buongiorno';
        else if (hour < 18) greeting = 'Buon pomeriggio';
        else greeting = 'Buonasera';

        if (profile.name) {
            greeting += `, ${profile.name}!`;
        } else {
            greeting += '!';
        }

        document.getElementById('greeting').textContent = greeting;
    },

    updateStats() {
        const stats = Storage.getStatistics();

        document.getElementById('stat-streak').textContent = stats.currentStreak;
        document.getElementById('stat-workouts').textContent = stats.totalWorkouts;
        document.getElementById('stat-volume').textContent = this.formatNumber(stats.totalVolume);
        document.getElementById('stat-prs').textContent = stats.prCount;
    },

    updateWeekDays() {
        const workoutDays = Storage.getWorkoutDays();
        const today = new Date();
        const dayElements = document.querySelectorAll('#week-days .day');

        dayElements.forEach(el => {
            const dayNum = parseInt(el.dataset.day);

            // Calculate the date for this day of the week
            const diff = dayNum - today.getDay();
            const date = new Date(today);
            date.setDate(today.getDate() + diff);

            // Check if worked out on this day
            if (workoutDays[date.toDateString()]) {
                el.classList.add('completed');
            } else {
                el.classList.remove('completed');
            }

            // Mark today
            if (date.toDateString() === today.toDateString()) {
                el.classList.add('today');
            }
        });
    },

    updateQuickAction() {
        const program = Storage.getActiveProgram();
        const titleEl = document.getElementById('quick-action-title');
        const subtitleEl = document.getElementById('quick-action-subtitle');
        const btnEl = document.getElementById('quick-start-btn');

        if (!program) {
            titleEl.textContent = 'Crea la tua scheda';
            subtitleEl.textContent = 'Genera un programma personalizzato';
            btnEl.textContent = '📋 Schede';
            btnEl.onclick = () => this.navigateTo('programs');
            return;
        }

        const nextWorkout = TrainingAlgorithm.getTodaysWorkout(program);
        if (!nextWorkout) {
            titleEl.textContent = 'Giorno di riposo 😴';
            subtitleEl.textContent = 'Recupera per il prossimo allenamento';
            btnEl.textContent = '💪 Libero';
            btnEl.onclick = () => this.navigateTo('workout');
            return;
        }

        const duration = TrainingAlgorithm.estimateWorkoutDuration(nextWorkout);
        titleEl.textContent = nextWorkout.type;
        subtitleEl.textContent = `${nextWorkout.exercises.length} esercizi • ~${duration} min`;
        btnEl.textContent = '▶️ Inizia';
        btnEl.onclick = () => {
            this.navigateTo('workout');
            setTimeout(() => this.startWorkout(nextWorkout), 100);
        };
    },

    updateWeeklyCount() {
        const weeklyWorkouts = Storage.getWorkoutsThisWeek();
        const profile = Storage.getProfile();
        const target = profile.daysPerWeek || 4;
        const countEl = document.getElementById('weekly-workout-count');
        if (countEl) {
            countEl.textContent = `${weeklyWorkouts.length}/${target} sessioni`;
        }
    },

    updateRecentActivity() {
        const recentWorkouts = Storage.getRecentWorkouts(3);
        const container = document.getElementById('activity-list');

        if (recentWorkouts.length === 0) {
            container.innerHTML = '<li class="empty-state-mini">Completa il tuo primo allenamento!</li>';
            return;
        }

        container.innerHTML = recentWorkouts.map(workout => {
            const date = new Date(workout.date);
            const dateStr = this.formatDateShort(date);
            const duration = Math.round(workout.duration / 60);

            return `
                <li>
                    <strong>${workout.name || 'Allenamento'}</strong>
                    <span style="color: var(--text-muted); margin-left: auto;">${dateStr} • ${duration}min</span>
                </li>
            `;
        }).join('');
    },

    formatDateShort(date) {
        const now = new Date();
        const diff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
        if (diff === 0) return 'Oggi';
        if (diff === 1) return 'Ieri';
        if (diff < 7) return `${diff}g fa`;
        return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
    },

    updateBodyStats() {
        const profile = Storage.getProfile();
        const weightEl = document.getElementById('body-weight');
        const fatEl = document.getElementById('body-fat');
        const leanEl = document.getElementById('body-lean');

        if (!profile.weight) {
            if (weightEl) weightEl.textContent = '--';
            if (fatEl) fatEl.textContent = '--';
            if (leanEl) leanEl.textContent = '--';
            return;
        }

        const leanMass = profile.bodyFat ? Math.round(profile.weight * (1 - profile.bodyFat / 100)) : null;

        if (weightEl) weightEl.textContent = `${profile.weight} kg`;
        if (fatEl) fatEl.textContent = profile.bodyFat ? `${profile.bodyFat}%` : '--';
        if (leanEl) leanEl.textContent = leanMass ? `${leanMass} kg` : '--';
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
        const phase = cycleInfo.currentPhase;

        // Add/remove deload class on card
        if (isDeload) {
            card?.classList.add('deload-active');
        } else {
            card?.classList.remove('deload-active');
        }

        // Compact cycle info
        container.innerHTML = `
            <div class="cycle-compact-info">
                <div class="cycle-week-compact">
                    <strong>Sett. ${cycleInfo.currentWeek}/${cycleInfo.duration}</strong>
                </div>
                <div class="cycle-phase-compact ${isDeload ? 'deload' : ''}">
                    ${isDeload ? '🔄 Deload' : phase.phaseName}
                </div>
                <div class="cycle-bar-mini">
                    <div class="cycle-bar-fill" style="width: ${cycleInfo.progress}%"></div>
                </div>
                <div class="cycle-rir-compact">
                    RIR: ${isDeload ? '4+' : `${phase.rirTarget.min}-${phase.rirTarget.max}`}
                </div>
            </div>
        `;
    },

    toggleDeloadMode() {
        const newState = Storage.toggleDeload();
        if (newState) {
            this.showNotification('🔄 Deload attivato! Volume ridotto al 50%', 'info');
        } else {
            this.showNotification('✅ Deload terminato! Volume normale', 'success');
        }
        this.updateCycleCard();
    },

    advanceCycleWeek() {
        const cycleInfo = Storage.advanceCycleWeek();
        if (cycleInfo) {
            this.showNotification(`⏭️ Settimana ${cycleInfo.currentWeek} - ${cycleInfo.currentPhase.phaseName}`, 'success');
            this.updateCycleCard();
        }
    },

    startNewCycle() {
        if (confirm('Vuoi iniziare un nuovo ciclo di allenamento?')) {
            Storage.resetCycle();
            this.showNotification('🎯 Nuovo ciclo iniziato!', 'success');
            this.updateCycleCard();
        }
    },

    completeCycleWithSummary() {
        const cycleInfo = Storage.getCycleInfo();
        const stats = Storage.getCycleStatistics();
        const progress = Storage.getCycleProgressMetrics();
        const program = Storage.getActiveProgram();

        if (!cycleInfo || !stats) {
            this.startNewCycle();
            return;
        }

        // Goal label
        const goalLabels = {
            strength: 'Forza',
            hypertrophy: 'Ipertrofia',
            recomp: 'Ricomposizione',
            endurance: 'Resistenza'
        };
        const goalLabel = goalLabels[program?.metadata?.goal] || 'Allenamento';

        // Create summary modal
        const html = `
            <div class="cycle-summary-modal" id="cycle-summary-modal">
                <div class="cycle-summary-content">
                    <div class="cycle-summary-header">
                        <h2>🏆 Ciclo Completato!</h2>
                        <p>${cycleInfo.duration} settimane - ${goalLabel}</p>
                    </div>

                    <div class="cycle-summary-stats">
                        <div class="summary-stat-card">
                            <div class="stat-icon">🏋️</div>
                            <div class="stat-value">${stats.totalWorkouts}</div>
                            <div class="stat-label">Allenamenti</div>
                        </div>
                        <div class="summary-stat-card">
                            <div class="stat-icon">⚡</div>
                            <div class="stat-value">${this.formatNumber(stats.totalVolume)}</div>
                            <div class="stat-label">kg Volume</div>
                        </div>
                        <div class="summary-stat-card">
                            <div class="stat-icon">📊</div>
                            <div class="stat-value">${stats.totalSets}</div>
                            <div class="stat-label">Serie Totali</div>
                        </div>
                        ${stats.prsAchieved > 0 ? `
                            <div class="summary-stat-card highlight">
                                <div class="stat-icon">🏆</div>
                                <div class="stat-value">${stats.prsAchieved}</div>
                                <div class="stat-label">Nuovi PR</div>
                            </div>
                        ` : ''}
                    </div>

                    ${progress ? `
                        <div class="cycle-progress-comparison">
                            <h4>📈 Progresso Volume</h4>
                            <div class="progress-comparison-row">
                                <span class="label">Prima settimana:</span>
                                <span class="value">${this.formatNumber(progress.firstWeekVolume)} kg</span>
                            </div>
                            <div class="progress-comparison-row">
                                <span class="label">Ultima settimana:</span>
                                <span class="value">${this.formatNumber(progress.currentWeekVolume)} kg</span>
                            </div>
                            <div class="progress-comparison-result ${progress.volumeChangePercent >= 0 ? 'positive' : 'negative'}">
                                ${progress.volumeChangePercent >= 0 ? '↑' : '↓'} ${Math.abs(progress.volumeChangePercent)}%
                            </div>
                        </div>
                    ` : ''}

                    ${stats.avgRir !== null ? `
                        <div class="cycle-rir-summary">
                            <span class="label">RIR Medio:</span>
                            <span class="value">${stats.avgRir}</span>
                        </div>
                    ` : ''}

                    <div class="cycle-summary-actions">
                        <button class="btn btn-primary btn-large" onclick="App.confirmCompleteCycle()">
                            🚀 Inizia Nuovo Ciclo
                        </button>
                        <button class="btn btn-secondary" onclick="App.closeCycleSummary()">
                            Chiudi
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', html);
    },

    confirmCompleteCycle() {
        document.getElementById('cycle-summary-modal')?.remove();
        Storage.completeCycle();

        // Show rotation summary if exercises changed
        const rotation = Storage.getLastRotationSummary();
        if (rotation && rotation.totalChanged > 0) {
            const addedNames = rotation.added.map(e => e.name).join(', ');
            const removedNames = rotation.removed.map(e => e.name).join(', ');
            const cycleNum = rotation.cycleNumber;

            let rotationMsg = `Ciclo #${cycleNum} iniziato! Esercizi ruotati: `;
            if (rotation.added.length > 0) rotationMsg += `+${rotation.added.length} nuovi`;
            if (rotation.removed.length > 0) rotationMsg += `, -${rotation.removed.length} sostituiti`;

            this.showNotification(rotationMsg, 'success');

            // Show detailed rotation modal
            this.showRotationDetail(rotation);
        } else {
            this.showNotification('Nuovo ciclo iniziato!', 'success');
        }

        this.updateCycleCard();
        this.loadDashboard();
    },

    showRotationDetail(rotation) {
        const addedHtml = rotation.added.map(e =>
            `<div class="rotation-item rotation-added">+ ${e.name}</div>`
        ).join('');
        const removedHtml = rotation.removed.map(e =>
            `<div class="rotation-item rotation-removed">- ${e.name}</div>`
        ).join('');

        const html = `
            <div class="cycle-summary-modal" id="rotation-detail-modal">
                <div class="cycle-summary-content">
                    <div class="cycle-summary-header">
                        <h2>Esercizi Ruotati - Ciclo #${rotation.cycleNumber}</h2>
                        <p>Nuovi stimoli per continuare a progredire</p>
                    </div>
                    <div style="padding: 1rem;">
                        ${addedHtml ? `<h4 style="color: var(--success-color, #4CAF50); margin-bottom: 0.5rem;">Nuovi esercizi</h4>${addedHtml}` : ''}
                        ${removedHtml ? `<h4 style="color: var(--danger-color, #f44336); margin: 0.75rem 0 0.5rem;">Esercizi sostituiti</h4>${removedHtml}` : ''}
                        <p style="margin-top: 1rem; opacity: 0.7; font-size: 0.85rem;">
                            ${rotation.kept.length} esercizi mantenuti dal ciclo precedente
                        </p>
                    </div>
                    <div class="cycle-summary-actions">
                        <button class="btn btn-primary" onclick="document.getElementById('rotation-detail-modal')?.remove()">
                            OK, iniziamo!
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
    },

    closeCycleSummary() {
        document.getElementById('cycle-summary-modal')?.remove();
    },

    // ========================================
    // EXERCISES
    // ========================================

    renderExercises(exercises = null) {
        const container = document.getElementById('exercises-grid');
        const exerciseList = exercises || getAllExercises();

        container.innerHTML = exerciseList.map(ex => {
            const gifUrl = getExerciseGif(ex.id);
            return `
            <div class="exercise-card exercise-grid-card" data-id="${ex.id}">
                <div class="exercise-gif-container">
                    <img src="${gifUrl}" alt="${ex.name}" class="exercise-gif" loading="lazy" onerror="this.style.display='none'">
                </div>
                <button class="exercise-info-btn" data-exercise-id="${ex.id}" data-exercise-name="${ex.name}" title="Vedi esecuzione">
                    ℹ️
                </button>
                <h4>${ex.name}</h4>
                <div class="muscle-tags">
                    ${ex.primaryMuscles.map(m => `<span class="muscle-tag">${m}</span>`).join('')}
                    ${ex.secondaryMuscles.slice(0, 2).map(m => `<span class="muscle-tag secondary">${m}</span>`).join('')}
                </div>
                <div class="equipment">${ex.category} • ${ex.type}</div>
            </div>
        `}).join('');

        // Add click handlers for cards
        container.querySelectorAll('.exercise-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // Don't open detail modal if clicking info button
                if (e.target.classList.contains('exercise-info-btn')) return;
                this.showExerciseDetail(card.dataset.id);
            });
        });

        // Add click handlers for info buttons
        container.querySelectorAll('.exercise-info-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showExerciseInfoModal(btn.dataset.exerciseId, btn.dataset.exerciseName, 'workout');
            });
        });
    },

    filterExercises(query) {
        if (!query) {
            this.renderExercises();
            return;
        }
        const filtered = searchExercises(query);
        this.renderExercises(filtered);
    },

    filterExercisesByCategory(category) {
        if (category === 'all') {
            this.renderExercises();
            return;
        }
        const filtered = getExercisesByCategory(category);
        this.renderExercises(filtered);
    },

    filterExercisesByMuscle(muscle) {
        if (muscle === 'all') {
            this.renderExercises();
            return;
        }
        const filtered = getExercisesByPrimaryMuscle(muscle);
        this.renderExercises(filtered);
    },

    /**
     * Show exercise info modal with GIF and detailed instructions
     * @param {string} exerciseId - The exercise ID
     * @param {string} exerciseName - The exercise name (for fallback)
     * @param {string} type - Type: 'workout', 'warmup', 'cooldown'
     */
    showExerciseInfoModal(exerciseId, exerciseName, type = 'workout') {
        const modal = document.getElementById('exercise-info-modal');
        const titleEl = document.getElementById('exercise-info-title');
        const gifContainer = document.getElementById('exercise-gif-container');
        const stepsEl = document.getElementById('execution-steps');
        const tipsEl = document.getElementById('execution-tips');
        const mistakesEl = document.getElementById('common-mistakes');
        const mistakesSection = document.getElementById('common-mistakes-section');
        const breathingEl = document.getElementById('breathing-info');
        const breathingSection = document.getElementById('breathing-section');
        const musclesEl = document.getElementById('muscles-info');
        const musclesSection = document.getElementById('muscles-section');

        // Get media info from exerciseMedia module
        const mediaInfo = getExerciseMediaInfo(exerciseId, exerciseName, type);

        // Set title
        titleEl.textContent = mediaInfo.name;

        // Set GIF or SVG animation
        if (mediaInfo.gifUrl) {
            gifContainer.innerHTML = `
                <div class="gif-loading">
                    <div class="gif-loading-spinner"></div>
                    <span>Caricamento...</span>
                </div>
            `;

            const img = new Image();
            img.onload = () => {
                gifContainer.innerHTML = `<img src="${mediaInfo.gifUrl}" alt="${mediaInfo.name}" />`;
            };
            img.onerror = () => {
                if (mediaInfo.svgAnimation) {
                    gifContainer.innerHTML = mediaInfo.svgAnimation;
                } else {
                    gifContainer.innerHTML = `
                        <div class="gif-error">
                            <div class="gif-error-icon">🏋️</div>
                            <p>Immagine non disponibile</p>
                        </div>
                    `;
                }
            };
            img.src = mediaInfo.gifUrl;
        } else if (mediaInfo.svgAnimation) {
            gifContainer.innerHTML = mediaInfo.svgAnimation;
        } else {
            gifContainer.innerHTML = `
                <div class="gif-error">
                    <div class="gif-error-icon">🏋️</div>
                    <p>Immagine non disponibile</p>
                </div>
            `;
        }

        // Set execution details
        if (mediaInfo.details) {
            // Steps
            if (mediaInfo.details.steps && mediaInfo.details.steps.length > 0) {
                stepsEl.innerHTML = mediaInfo.details.steps.map(step => `<li>${step}</li>`).join('');
            } else {
                // Fallback to exercise instructions
                const exercise = getExerciseById(exerciseId);
                if (exercise && exercise.instructions) {
                    stepsEl.innerHTML = `<li>${exercise.instructions}</li>`;
                } else {
                    stepsEl.innerHTML = '<li>Esegui l\'esercizio seguendo la corretta tecnica</li>';
                }
            }

            // Tips
            if (mediaInfo.details.tips && mediaInfo.details.tips.length > 0) {
                tipsEl.innerHTML = mediaInfo.details.tips.map(tip => `<li>${tip}</li>`).join('');
            } else {
                // Fallback to exercise tips
                const exercise = getExerciseById(exerciseId);
                if (exercise && exercise.tips && exercise.tips.length > 0) {
                    tipsEl.innerHTML = exercise.tips.map(tip => `<li>${tip}</li>`).join('');
                } else {
                    tipsEl.innerHTML = '<li>Mantieni sempre il controllo del movimento</li>';
                }
            }

            // Common mistakes
            if (mediaInfo.details.commonMistakes && mediaInfo.details.commonMistakes.length > 0) {
                mistakesEl.innerHTML = mediaInfo.details.commonMistakes.map(m => `<li>${m}</li>`).join('');
                mistakesSection.style.display = 'block';
            } else {
                mistakesSection.style.display = 'none';
            }

            // Breathing
            if (mediaInfo.details.breathing) {
                breathingEl.textContent = mediaInfo.details.breathing;
                breathingSection.style.display = 'block';
            } else {
                breathingSection.style.display = 'none';
            }

            // Muscles
            if (mediaInfo.details.muscles) {
                musclesEl.innerHTML = `
                    <div class="muscle-group">
                        <span class="muscle-label primary">Primari:</span>
                        <span class="muscle-name">${mediaInfo.details.muscles.primary}</span>
                    </div>
                    ${mediaInfo.details.muscles.secondary ? `
                        <div class="muscle-group">
                            <span class="muscle-label secondary">Secondari:</span>
                            <span class="muscle-name">${mediaInfo.details.muscles.secondary}</span>
                        </div>
                    ` : ''}
                `;
                musclesSection.style.display = 'block';
            } else {
                // Fallback to exercise muscles
                const exercise = getExerciseById(exerciseId);
                if (exercise) {
                    musclesEl.innerHTML = `
                        <div class="muscle-group">
                            <span class="muscle-label primary">Primari:</span>
                            <span class="muscle-name">${exercise.primaryMuscles.join(', ')}</span>
                        </div>
                        ${exercise.secondaryMuscles.length > 0 ? `
                            <div class="muscle-group">
                                <span class="muscle-label secondary">Secondari:</span>
                                <span class="muscle-name">${exercise.secondaryMuscles.join(', ')}</span>
                            </div>
                        ` : ''}
                    `;
                    musclesSection.style.display = 'block';
                } else {
                    musclesSection.style.display = 'none';
                }
            }
        } else {
            // No detailed info, use basic exercise data
            const exercise = getExerciseById(exerciseId);
            if (exercise) {
                stepsEl.innerHTML = `<li>${exercise.instructions || 'Esegui l\'esercizio seguendo la corretta tecnica'}</li>`;
                tipsEl.innerHTML = exercise.tips && exercise.tips.length > 0
                    ? exercise.tips.map(tip => `<li>${tip}</li>`).join('')
                    : '<li>Mantieni sempre il controllo del movimento</li>';
                mistakesSection.style.display = 'none';
                breathingSection.style.display = 'none';
                musclesEl.innerHTML = `
                    <div class="muscle-group">
                        <span class="muscle-label primary">Primari:</span>
                        <span class="muscle-name">${exercise.primaryMuscles.join(', ')}</span>
                    </div>
                    ${exercise.secondaryMuscles.length > 0 ? `
                        <div class="muscle-group">
                            <span class="muscle-label secondary">Secondari:</span>
                            <span class="muscle-name">${exercise.secondaryMuscles.join(', ')}</span>
                        </div>
                    ` : ''}
                `;
                musclesSection.style.display = 'block';
            } else {
                // Warmup/cooldown without exercise data
                stepsEl.innerHTML = '<li>Segui le indicazioni dell\'esercizio</li>';
                tipsEl.innerHTML = '<li>Esegui il movimento in modo controllato</li>';
                mistakesSection.style.display = 'none';
                breathingSection.style.display = 'none';
                musclesSection.style.display = 'none';
            }
        }

        modal.classList.add('active');
    },

    showExerciseDetail(exerciseId) {
        const exercise = getExerciseById(exerciseId);
        if (!exercise) return;

        const modal = document.getElementById('exercise-modal');
        const content = document.getElementById('exercise-modal-content');

        content.innerHTML = `
            <h2>${exercise.name}</h2>
            <div class="exercise-detail">
                <div class="detail-section">
                    <h4>Muscoli Primari</h4>
                    <div class="muscle-tags">
                        ${exercise.primaryMuscles.map(m => `<span class="muscle-tag">${m}</span>`).join('')}
                    </div>
                </div>
                ${exercise.secondaryMuscles.length > 0 ? `
                    <div class="detail-section">
                        <h4>Muscoli Secondari</h4>
                        <div class="muscle-tags">
                            ${exercise.secondaryMuscles.map(m => `<span class="muscle-tag secondary">${m}</span>`).join('')}
                        </div>
                    </div>
                ` : ''}
                <div class="detail-section">
                    <h4>Informazioni</h4>
                    <p><strong>Categoria:</strong> ${exercise.category}</p>
                    <p><strong>Tipo:</strong> ${exercise.type}</p>
                    <p><strong>Difficoltà:</strong> ${exercise.difficulty}</p>
                    ${exercise.equipment && exercise.equipment.length > 0 ?
                `<p><strong>Attrezzatura:</strong> ${exercise.equipment.join(', ')}</p>` : ''}
                </div>
                <div class="detail-section">
                    <h4>Esecuzione</h4>
                    <p>${exercise.instructions}</p>
                </div>
                ${exercise.tips && exercise.tips.length > 0 ? `
                    <div class="detail-section">
                        <h4>Consigli</h4>
                        <ul>
                            ${exercise.tips.map(tip => `<li>${tip}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
        `;

        modal.classList.add('active');
    },

    // ========================================
    // PROGRAMS
    // ========================================

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
            duration: { recommended: 50, range: '45-60', reason: 'Harty 2018: le donne recuperano 25-50% più velocemente tra le serie. Con pause 60-90s compound e 30-60s isolation, 45-60 min sono sufficienti.' }
        }
    },

    openWizard() {
        this.wizardState = { step: 1, goal: null, days: null, split: null, duration: null };

        // Reset all steps
        document.querySelectorAll('.wizard-step').forEach(s => s.classList.add('hidden'));
        document.getElementById('wizard-step-1').classList.remove('hidden');
        document.querySelectorAll('.wizard-card').forEach(c => c.classList.remove('selected'));
        document.querySelectorAll('.wizard-step-dot').forEach(d => d.classList.remove('active', 'done'));
        document.querySelector('.wizard-step-dot[data-step="1"]').classList.add('active');
        document.getElementById('wizard-progress-fill').style.width = '25%';
        document.getElementById('wizard-back').style.visibility = 'hidden';
        document.getElementById('generate-program-btn').style.display = 'none';
        document.getElementById('wizard-title').textContent = '🤖 Genera Scheda';

        // Setup card click handlers
        this._setupWizardCardClicks();

        document.getElementById('ai-generator-modal').classList.add('active');
    },

    _setupWizardCardClicks() {
        // Goal cards (step 1) — auto-advance on click
        document.querySelectorAll('#wizard-goal-cards .wizard-card').forEach(card => {
            card.onclick = () => {
                document.querySelectorAll('#wizard-goal-cards .wizard-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.wizardState.goal = card.dataset.value;
                this.wizardState.days = null;
                this.wizardState.split = null;
                this.wizardState.duration = null;
                setTimeout(() => this.wizardNext(), 250);
            };
        });

        // Days cards (step 2) — auto-advance
        document.querySelectorAll('#wizard-days-cards .wizard-card').forEach(card => {
            card.onclick = () => {
                document.querySelectorAll('#wizard-days-cards .wizard-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.wizardState.days = parseInt(card.dataset.value);
                this.wizardState.split = null;
                setTimeout(() => this.wizardNext(), 250);
            };
        });

        // Split cards (step 3) — auto-advance
        document.querySelectorAll('#wizard-split-cards .wizard-card').forEach(card => {
            card.onclick = () => {
                document.querySelectorAll('#wizard-split-cards .wizard-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.wizardState.split = card.dataset.value;
                setTimeout(() => this.wizardNext(), 250);
            };
        });

        // Duration cards (step 4) — auto-advance to summary
        document.querySelectorAll('#wizard-duration-cards .wizard-card').forEach(card => {
            card.onclick = () => {
                document.querySelectorAll('#wizard-duration-cards .wizard-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.wizardState.duration = parseInt(card.dataset.value);
                setTimeout(() => this.wizardNext(), 250);
            };
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
            this.showNotification('Configura prima il tuo profilo!', 'warning');
            this.showPage('profile');
            return;
        }

        // Confirm overwrite if active program exists
        const existing = Storage.getActiveProgram();
        if (existing && !confirm('Hai già una scheda attiva. Vuoi sostituirla con quella generata?')) {
            return;
        }

        // Read from wizard state if available, fallback to select elements
        const ws = this.wizardState;
        const options = {
            goal: ws?.goal || document.getElementById('program-goal')?.value || 'recomp',
            daysPerWeek: ws?.days || parseInt(document.getElementById('program-days')?.value || '4'),
            split: ws?.split || document.getElementById('program-split')?.value || 'upper-lower',
            sessionDuration: ws?.duration || parseInt(document.getElementById('program-duration')?.value || '60')
        };

        const program = TrainingAlgorithm.generateProgram(profile, options);

        // Save only as active program (no multi-program list)
        Storage.setActiveProgram(program);

        // Close modal
        document.getElementById('ai-generator-modal')?.classList.remove('active');

        this.loadPrograms();
        this.loadDashboard();
        this.showNotification('Scheda generata con successo!', 'success');
    },

    loadPrograms() {
        this.displayActiveProgram();
    },

    displayActiveProgram() {
        const program = Storage.getActiveProgram();
        const card = document.getElementById('active-program-card');
        const content = document.getElementById('active-program-content');
        const noState = document.getElementById('no-program-state');

        if (!program) {
            card.style.display = 'none';
            if (noState) noState.style.display = 'block';
            return;
        }

        card.style.display = 'block';
        if (noState) noState.style.display = 'none';

        // Build tempo info if available
        const tempoInfo = program.metadata?.tempo
            ? `<p><strong>Esecuzione:</strong> ${program.metadata.tempo.description} <span class="tempo-detail">(${program.metadata.tempo.detail})</span></p>`
            : '';

        let html = `
            <div class="program-info">
                <p><strong>Tipo:</strong> ${program.name}</p>
                <p><strong>Obiettivo:</strong> ${program.metadata?.goal || 'Non specificato'}</p>
                <p><strong>Giorni:</strong> ${program.days.length} giorni/settimana</p>
                ${tempoInfo}
            </div>
            <div class="program-days">
        `;

        program.days.forEach(day => {
            html += `
                <div class="program-day">
                    <h4>
                        ${day.name}
                        <span class="day-type">${day.type}</span>
                    </h4>
                    <p class="day-focus">${day.focus}</p>
                    <div class="day-exercises">
                        ${day.exercises.map(ex => `
                            <div class="program-exercise program-exercise-item">
                                <div class="program-exercise-content">
                                    <span class="exercise-name">${ex.name}</span>
                                    <span class="exercise-details">${ex.sets} x ${ex.reps} ${ex.rest ? '• ' + ex.rest + 's' : ''}</span>
                                </div>
                                <button class="exercise-info-btn" data-exercise-id="${ex.exerciseId || ''}" data-exercise-name="${ex.name}" title="Vedi esecuzione">
                                    ℹ️
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        });

        html += '</div>';

        // Weekly volume summary
        if (program.metadata?.weeklyVolume) {
            html += `
                <div class="volume-summary">
                    <h4>Volume Settimanale (set)</h4>
                    <div class="volume-grid">
                        ${Object.entries(program.metadata.weeklyVolume).map(([muscle, sets]) =>
                `<div class="volume-item"><span>${muscle}</span><strong>${sets}</strong></div>`
            ).join('')}
                    </div>
                </div>
            `;
        }

        content.innerHTML = html;

        // Add click handlers for info buttons in program
        content.querySelectorAll('.exercise-info-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const exerciseId = btn.dataset.exerciseId || null;
                const exerciseName = btn.dataset.exerciseName;
                this.showExerciseInfoModal(exerciseId, exerciseName, 'workout');
            });
        });
    },

    deleteActiveProgram() {
        if (confirm('Eliminare la scheda attiva? I progressi degli allenamenti rimarranno.')) {
            Storage.clearActiveProgram();
            this.loadPrograms();
            this.loadDashboard();
            this.showNotification('Scheda eliminata', 'info');
        }
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
            // Load existing program into builder
            const program = Storage.getActiveProgram();
            if (program && program.days) {
                this.builderState.days = program.days.map(day => ({
                    name: day.type || day.name,
                    exercises: day.exercises.map(ex => ({
                        exerciseId: ex.exerciseId,
                        name: ex.name,
                        sets: ex.sets,
                        reps: ex.reps,
                        rest: ex.rest
                    }))
                }));
            }
            document.getElementById('builder-modal-title').textContent = '✏️ Modifica Scheda';
        } else {
            // Start with one empty day
            this.builderState.days = [{ name: 'Giorno 1', exercises: [] }];
            document.getElementById('builder-modal-title').textContent = '✏️ Crea la Tua Scheda';
        }

        this.builderRenderDays();
        document.getElementById('builder-step-days').style.display = 'block';
        document.getElementById('builder-step-exercises').style.display = 'none';
        document.getElementById('manual-builder-modal').classList.add('active');
    },

    closeManualBuilder() {
        document.getElementById('manual-builder-modal').classList.remove('active');
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
        this.builderState.days.splice(index, 1);
        this.builderRenderDays();
    },

    builderRenderDays() {
        const container = document.getElementById('builder-days-list');
        container.innerHTML = this.builderState.days.map((day, i) => `
            <div class="builder-day-row">
                <span class="day-number">${i + 1}</span>
                <input type="text" value="${day.name}" placeholder="Es: Push, Pull, Gambe..."
                    onchange="App.builderUpdateDayName(${i}, this.value)">
                <span style="color:var(--text-muted);font-size:0.8rem;">${day.exercises.length} es.</span>
                <button class="remove-day-btn" onclick="App.builderRemoveDay(${i})" title="Rimuovi">✕</button>
            </div>
        `).join('');
    },

    builderUpdateDayName(index, name) {
        this.builderState.days[index].name = name;
    },

    builderGoToExercises() {
        if (this.builderState.days.length === 0) {
            this.showNotification('Aggiungi almeno un giorno', 'warning');
            return;
        }

        // Validate all days have names
        for (const day of this.builderState.days) {
            if (!day.name.trim()) {
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
        container.innerHTML = this.builderState.days.map((day, i) => `
            <button class="builder-day-tab ${i === this.builderState.currentDayIndex ? 'active' : ''}"
                onclick="App.builderSelectDay(${i})">
                ${day.name}
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

        if (!day || day.exercises.length === 0) {
            container.innerHTML = '<div class="builder-empty-day">Nessun esercizio. Cerca e aggiungi dal campo sotto.</div>';
            return;
        }

        container.innerHTML = day.exercises.map((ex, i) => `
            <div class="builder-exercise-item" data-index="${i}">
                <span class="drag-handle">⠿</span>
                <span class="ex-name">${ex.name}</span>
                <div class="ex-params">
                    <input type="number" value="${ex.sets}" min="1" max="10" title="Serie"
                        onchange="App.builderUpdateExercise(${i}, 'sets', this.value)">
                    <span>×</span>
                    <input type="text" value="${ex.reps}" title="Reps (es: 8-12)" style="width:60px;"
                        onchange="App.builderUpdateExercise(${i}, 'reps', this.value)">
                    <span>⏱</span>
                    <input type="number" value="${ex.rest}" min="15" max="600" step="15" title="Recupero (sec)"
                        onchange="App.builderUpdateExercise(${i}, 'rest', this.value)">
                    <span>s</span>
                </div>
                <button class="remove-exercise-btn" onclick="App.builderRemoveExercise(${i})" title="Rimuovi">✕</button>
            </div>
        `).join('');
    },

    builderUpdateExercise(exerciseIndex, field, value) {
        const day = this.builderState.days[this.builderState.currentDayIndex];
        if (field === 'sets' || field === 'rest') {
            day.exercises[exerciseIndex][field] = parseInt(value) || (field === 'sets' ? 3 : 60);
        } else {
            day.exercises[exerciseIndex][field] = value;
        }
    },

    builderRemoveExercise(exerciseIndex) {
        const day = this.builderState.days[this.builderState.currentDayIndex];
        day.exercises.splice(exerciseIndex, 1);
        this.builderRenderCurrentDayExercises();
        this.builderRenderDayTabs();
    },

    builderSearchExercises(query) {
        const container = document.getElementById('builder-exercise-results');

        if (!query || query.length < 2) {
            container.innerHTML = '';
            return;
        }

        const results = searchExercises(query).slice(0, 15);
        const day = this.builderState.days[this.builderState.currentDayIndex];
        const existingIds = new Set(day.exercises.map(e => e.exerciseId));

        container.innerHTML = results.map(ex => {
            const alreadyAdded = existingIds.has(ex.id);
            return `
                <div class="builder-search-result ${alreadyAdded ? 'already-added' : ''}"
                    onclick="${alreadyAdded ? '' : `App.builderAddExercise('${ex.id}')`}"
                    style="${alreadyAdded ? 'opacity:0.4;cursor:default;' : ''}">
                    <div>
                        <div class="result-name">${ex.name}</div>
                        <div class="result-muscles">${ex.primaryMuscles.join(', ')} • ${ex.type}</div>
                    </div>
                    <span class="result-add">${alreadyAdded ? '✓' : '+'}</span>
                </div>
            `;
        }).join('');

        if (results.length === 0) {
            container.innerHTML = '<div style="padding:12px;color:var(--text-muted);text-align:center;">Nessun esercizio trovato</div>';
        }
    },

    builderAddExercise(exerciseId) {
        const exercise = EXERCISES_DB[exerciseId];
        if (!exercise) return;

        const day = this.builderState.days[this.builderState.currentDayIndex];
        const profile = Storage.getProfile();
        const isCompound = exercise.type === 'compound';

        // Smart defaults based on exercise type
        const defaultSets = isCompound ? 4 : 3;
        const defaultReps = isCompound ? '6-10' : '10-15';
        const defaultRest = isCompound ? 120 : 60;

        day.exercises.push({
            exerciseId: exercise.id,
            name: exercise.name,
            sets: defaultSets,
            reps: defaultReps,
            rest: defaultRest
        });

        this.builderRenderCurrentDayExercises();
        this.builderRenderDayTabs();

        // Refresh search to update "already added" state
        const searchInput = document.getElementById('builder-exercise-search');
        if (searchInput.value) {
            this.builderSearchExercises(searchInput.value);
        }

        this.showNotification(`${exercise.name} aggiunto`, 'success');
    },

    builderSaveProgram() {
        // Validate
        const days = this.builderState.days;
        if (days.length === 0) {
            this.showNotification('Aggiungi almeno un giorno', 'warning');
            return;
        }

        const hasExercises = days.some(d => d.exercises.length > 0);
        if (!hasExercises) {
            this.showNotification('Aggiungi almeno un esercizio', 'warning');
            return;
        }

        // Confirm overwrite if editing or replacing
        if (!this.builderState.isEditing) {
            const existing = Storage.getActiveProgram();
            if (existing && !confirm('Hai già una scheda attiva. Vuoi sostituirla?')) {
                return;
            }
        }

        const profile = Storage.getProfile();

        // Build program in the same format as the algorithm
        const program = {
            name: 'Scheda Personalizzata',
            days: days.map((day, i) => ({
                name: `Giorno ${i + 1}`,
                type: day.name,
                focus: day.name,
                warmup: this.builderGuessWarmup(day),
                exercises: day.exercises.map(ex => ({
                    exerciseId: ex.exerciseId,
                    name: ex.name,
                    sets: parseInt(ex.sets) || 3,
                    reps: ex.reps || '8-12',
                    rest: parseInt(ex.rest) || 60,
                    type: EXERCISES_DB[ex.exerciseId]?.type || 'compound',
                    notes: ''
                }))
            })),
            metadata: {
                goal: profile.goal || 'hypertrophy',
                split: 'custom',
                daysPerWeek: days.length,
                sessionDuration: 60,
                level: profile.level || 'intermediate',
                createdFor: profile.name || '',
                isCustom: true,
                weeklyVolume: this.builderCalcWeeklyVolume(days)
            }
        };

        Storage.setActiveProgram(program);
        this.closeManualBuilder();
        this.loadPrograms();
        this.loadDashboard();
        this.showNotification(this.builderState.isEditing ? 'Scheda aggiornata!' : 'Scheda creata!', 'success');
    },

    builderGuessWarmup(day) {
        // Determine warmup type based on exercises' primary muscles
        const muscles = new Set();
        day.exercises.forEach(ex => {
            const dbEx = EXERCISES_DB[ex.exerciseId];
            if (dbEx) dbEx.primaryMuscles.forEach(m => muscles.add(m));
        });

        if (muscles.has('quadricipiti') || muscles.has('femorali') || muscles.has('glutei')) return 'lower';
        if (muscles.has('petto') || muscles.has('spalle') || muscles.has('tricipiti')) return 'upper';
        if (muscles.has('schiena') || muscles.has('bicipiti')) return 'upper';
        return 'full-body';
    },

    builderCalcWeeklyVolume(days) {
        const volume = {};
        days.forEach(day => {
            day.exercises.forEach(ex => {
                const dbEx = EXERCISES_DB[ex.exerciseId];
                if (dbEx) {
                    dbEx.primaryMuscles.forEach(m => {
                        volume[m] = (volume[m] || 0) + (parseInt(ex.sets) || 3);
                    });
                }
            });
        });
        return volume;
    },

    // ========================================
    // WORKOUT PREVIEW (read-only, no tracking)
    // ========================================

    showWorkoutPreview() {
        const program = Storage.getActiveProgram();
        if (!program || !program.days || program.days.length === 0) {
            this.showNotification('Nessuna scheda attiva!', 'warning');
            return;
        }

        // Hide other sections, show preview
        document.getElementById('workout-not-started').style.display = 'none';
        document.getElementById('workout-active').style.display = 'none';
        document.getElementById('workout-preview').style.display = 'block';

        // Build day navigation tabs
        const navContainer = document.getElementById('preview-day-nav');
        navContainer.innerHTML = program.days.map((day, i) => `
            <button class="preview-day-tab ${i === 0 ? 'active' : ''}" data-day-index="${i}">
                ${day.type || day.name}
            </button>
        `).join('');

        // Add tab click handlers
        navContainer.querySelectorAll('.preview-day-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                navContainer.querySelectorAll('.preview-day-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.renderPreviewDay(program.days[parseInt(tab.dataset.dayIndex)]);
            });
        });

        // Show first day
        this.renderPreviewDay(program.days[0]);
    },

    renderPreviewDay(day) {
        const container = document.getElementById('preview-content');
        if (!container || !day) return;

        const cycleInfo = Storage.getCycleInfo();
        const isDeload = Storage.isDeloadActive();
        const volumeMultiplier = Storage.getCurrentVolumeMultiplier();

        container.innerHTML = `
            <div class="card preview-day-card">
                <h3>${day.focus || day.type || day.name}</h3>
                ${cycleInfo ? `<p class="preview-phase-info">${isDeload ? 'Deload' : cycleInfo.currentPhase?.phaseName} - Sett. ${cycleInfo.currentWeek}/${cycleInfo.duration} - RIR ${isDeload ? '4+' : cycleInfo.currentPhase?.rirTarget?.min + '-' + cycleInfo.currentPhase?.rirTarget?.max}</p>` : ''}
                <div class="preview-exercises">
                    ${(day.exercises || []).map((ex, i) => {
                        const exercise = typeof EXERCISES_DB !== 'undefined' ? EXERCISES_DB[ex.exerciseId] : null;
                        const gifUrl = typeof getExerciseGif === 'function' ? getExerciseGif(ex.exerciseId) : null;
                        const sets = isDeload ? Math.max(2, Math.round(ex.sets * volumeMultiplier)) : ex.sets;

                        // Get last performance for progression hint
                        const lastPerf = Storage.getLastPerformance(ex.exerciseId);
                        let hint = '';
                        if (lastPerf) {
                            const bestWeight = lastPerf.weight;
                            hint = `<span class="preview-hint">Ultimo: ${bestWeight}kg x ${lastPerf.reps}</span>`;
                        }

                        return `
                            <div class="preview-exercise-row">
                                <span class="preview-ex-num">${i + 1}</span>
                                ${gifUrl ? `<img src="${gifUrl}" class="preview-ex-gif" alt="${ex.name}" loading="lazy" onerror="this.style.display='none'">` : '<div class="preview-ex-gif-placeholder"></div>'}
                                <div class="preview-ex-info">
                                    <div class="preview-ex-name">${ex.name}</div>
                                    <div class="preview-ex-details">${sets} x ${ex.reps} · ${ex.rest}s pausa</div>
                                    ${hint}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    },

    closeWorkoutPreview() {
        document.getElementById('workout-preview').style.display = 'none';
        document.getElementById('workout-not-started').style.display = 'block';
    },

    /**
     * Cancel active workout without saving any data
     */
    cancelWorkout() {
        if (!this.activeWorkout) return;

        // Check if any data was entered
        const hasData = this.activeWorkout.exercises.some(ex =>
            ex.setsData.some(s => s.completed || s.weight || s.reps)
        );

        const message = hasData
            ? 'Hai dei dati inseriti. Annullare senza salvare?'
            : 'Annullare la sessione?';

        if (!confirm(message)) return;

        // Stop timers
        Timer.stopWorkoutTimer();
        Timer.stopRestTimer();
        this._activeRestTimerSetIdx = null;
        const restModal1 = document.getElementById('rest-timer-modal');
        if (restModal1) restModal1.style.display = 'none';

        // Rimuovi protezione refresh
        if (this._beforeUnloadHandler) {
            window.removeEventListener('beforeunload', this._beforeUnloadHandler);
            this._beforeUnloadHandler = null;
        }

        // Reset UI without saving
        this._isSimulation = false;
        this.activeWorkout = null;
        this.currentExerciseIndex = 0;
        document.getElementById('workout-active').style.display = 'none';
        document.getElementById('workout-not-started').style.display = 'block';
        document.getElementById('phase-banner')?.remove();

        this.showNotification('Sessione annullata', 'info');
    },

    // ========================================
    // WORKOUT EXECUTION
    // ========================================

    startScheduledWorkout() {
        const program = Storage.getActiveProgram();
        if (!program) {
            this.showNotification('Nessuna scheda attiva!', 'warning');
            return;
        }

        const workout = TrainingAlgorithm.getTodaysWorkout(program);
        if (!workout) {
            this.showNotification('Nessun allenamento programmato per oggi', 'info');
            return;
        }

        this.startWorkout(workout);
    },

    startFreeWorkout() {
        // Show free workout modal to pick exercises
        this.freeWorkoutExercises = [];
        document.getElementById('free-workout-modal').classList.add('active');
        document.getElementById('free-workout-search').value = '';
        document.getElementById('free-workout-search').focus();
        this.freeWorkoutRenderSelected();
        this.freeWorkoutSearchResults([]);
    },

    freeWorkoutSearch(query) {
        if (!query || query.length < 2) {
            this.freeWorkoutSearchResults([]);
            return;
        }
        const results = searchExercises(query).slice(0, 15);
        this.freeWorkoutSearchResults(results);
    },

    freeWorkoutSearchResults(results) {
        const container = document.getElementById('free-workout-results');
        if (!results.length) {
            container.innerHTML = '<p class="empty-state-mini">Cerca un esercizio...</p>';
            return;
        }
        const addedIds = this.freeWorkoutExercises.map(e => e.id);
        container.innerHTML = results.map(ex => {
            const already = addedIds.includes(ex.id);
            return `
                <div class="builder-search-result ${already ? 'already-added' : ''}" data-id="${ex.id}">
                    <div>
                        <strong>${ex.name}</strong>
                        <small>${ex.primaryMuscles.join(', ')}</small>
                    </div>
                    ${already ? '<span class="added-badge">Aggiunto</span>' : `<button class="btn btn-sm btn-primary" onclick="App.freeWorkoutAddExercise('${ex.id}')">+</button>`}
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
            rest: isCompound ? 120 : 60
        });

        this.freeWorkoutRenderSelected();
        // Re-run search to update "already added" state
        const query = document.getElementById('free-workout-search').value;
        if (query) this.freeWorkoutSearch(query);
    },

    freeWorkoutRemoveExercise(index) {
        this.freeWorkoutExercises.splice(index, 1);
        this.freeWorkoutRenderSelected();
        const query = document.getElementById('free-workout-search').value;
        if (query) this.freeWorkoutSearch(query);
    },

    freeWorkoutRenderSelected() {
        const container = document.getElementById('free-workout-selected');
        if (!this.freeWorkoutExercises.length) {
            container.innerHTML = '<p class="empty-state-mini">Nessun esercizio selezionato</p>';
            return;
        }
        container.innerHTML = this.freeWorkoutExercises.map((ex, i) => `
            <div class="builder-exercise-item">
                <div class="builder-exercise-info">
                    <span class="builder-exercise-name">${ex.name}</span>
                    <div class="builder-exercise-params">
                        <label>Serie<input type="number" min="1" max="10" value="${ex.sets}" onchange="App.freeWorkoutUpdateExercise(${i},'sets',this.value)"></label>
                        <label>Reps<input type="text" value="${ex.reps}" onchange="App.freeWorkoutUpdateExercise(${i},'reps',this.value)" style="width:60px"></label>
                        <label>Rec<input type="number" min="30" max="300" step="15" value="${ex.rest}" onchange="App.freeWorkoutUpdateExercise(${i},'rest',this.value)">s</label>
                    </div>
                </div>
                <button class="btn btn-sm btn-danger" onclick="App.freeWorkoutRemoveExercise(${i})">✕</button>
            </div>
        `).join('');
    },

    freeWorkoutUpdateExercise(index, field, value) {
        if (this.freeWorkoutExercises[index]) {
            this.freeWorkoutExercises[index][field] = field === 'reps' ? value : parseInt(value);
        }
    },

    freeWorkoutStart() {
        if (!this.freeWorkoutExercises.length) {
            this.showNotification('Aggiungi almeno un esercizio', 'warning');
            return;
        }

        // Build workout object compatible with startWorkout()
        const workout = {
            type: 'Allenamento Libero',
            isFreeWorkout: true,
            exercises: this.freeWorkoutExercises.map(ex => ({
                exerciseId: ex.id,
                name: ex.name,
                sets: ex.sets,
                targetReps: ex.reps,
                rest: ex.rest
            }))
        };

        document.getElementById('free-workout-modal').classList.remove('active');
        this.startWorkout(workout);
    },

    closeFreeWorkoutModal() {
        document.getElementById('free-workout-modal').classList.remove('active');
    },

    startWorkout(workout) {
        // Get cycle info for volume adjustment
        const cycleInfo = Storage.getCycleInfo();
        const volumeMultiplier = Storage.getCurrentVolumeMultiplier();
        const isDeload = Storage.isDeloadActive();

        this.activeWorkout = {
            ...workout,
            startTime: Date.now(),
            cycleInfo: cycleInfo,
            isDeload: isDeload,
            volumeMultiplier: volumeMultiplier,
            exercises: workout.exercises.map(ex => {
                // Apply volume multiplier to sets (reduce during deload)
                const originalSets = ex.sets;
                const adjustedSets = isDeload ? Math.max(2, Math.round(originalSets * volumeMultiplier)) : originalSets;

                return {
                    ...ex,
                    originalSets: originalSets,  // Keep original for reference
                    targetSets: adjustedSets,    // Actual sets to do
                    sets: adjustedSets,          // Update sets count
                    targetReps: ex.reps,         // Save original rep range
                    setsData: Array(adjustedSets).fill(null).map(() => ({
                        weight: '',
                        reps: '',
                        completed: false
                    }))
                };
            })
        };
        this.currentExerciseIndex = 0;
        this.currentSetIndex = 0;

        // Show workout UI
        document.getElementById('workout-not-started').style.display = 'none';
        document.getElementById('workout-active').style.display = 'block';

        // Proteggi da refresh/chiusura accidentale durante allenamento
        this._beforeUnloadHandler = (e) => {
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', this._beforeUnloadHandler);

        // Start workout timer
        Timer.startWorkoutTimer((time) => {
            document.getElementById('workout-timer').textContent = time;
        });

        // Display phase banner if cycle active
        this.displayPhaseBanner();

        // Display warmup
        this.displayWarmup(workout.warmup);

        // Display first exercise
        this.displayCurrentExercise();

        // Navigate to workout page
        this.showPage('workout');
    },

    startSimulatedWorkout() {
        const fakeWorkout = {
            type: 'Simulazione',
            warmup: null,
            exercises: [
                {
                    exerciseId: 'bench-press',
                    name: 'Panca Piana (TEST)',
                    sets: 3,
                    reps: '8-12',
                    rest: 90
                },
                {
                    exerciseId: 'lat-pulldown',
                    name: 'Lat Machine (TEST)',
                    sets: 3,
                    reps: '10-12',
                    rest: 60
                }
            ]
        };

        this._isSimulation = true;
        this.startWorkout(fakeWorkout);
        this.showNotification('🧪 Modalità simulazione — nessun dato verrà salvato', 'info');
    },

    displayPhaseBanner() {
        // Remove existing banner
        document.getElementById('phase-banner')?.remove();

        const cycleInfo = this.activeWorkout?.cycleInfo;
        if (!cycleInfo) return;

        const isDeload = this.activeWorkout.isDeload;
        const phase = cycleInfo.currentPhase;
        const rirTarget = isDeload ? '4+' : `${phase.rirTarget.min}-${phase.rirTarget.max}`;

        const bannerClass = isDeload ? 'deload' : phase.phase;
        const phaseLabel = isDeload ? 'DELOAD' : phase.phaseName.toUpperCase();
        const volumeText = isDeload ? '50%' : `${Math.round(phase.volumeMultiplier * 100)}%`;

        const bannerHTML = `
            <div id="phase-banner" class="phase-banner phase-${bannerClass}">
                <div class="phase-banner-content">
                    <span class="phase-label">${phaseLabel}</span>
                    <span class="phase-separator">•</span>
                    <span class="phase-week">Sett. ${cycleInfo.currentWeek}/${cycleInfo.duration}</span>
                    <span class="phase-separator">•</span>
                    <span class="phase-rir">RIR ${rirTarget}</span>
                    ${isDeload ? '<span class="phase-separator">•</span><span class="phase-volume">Vol. ' + volumeText + '</span>' : ''}
                </div>
            </div>
        `;

        // Insert after workout header
        const workoutHeader = document.querySelector('#workout-active .workout-header');
        if (workoutHeader) {
            workoutHeader.insertAdjacentHTML('afterend', bannerHTML);
        }
    },

    displayWarmup(warmupType) {
        const warmup = getWarmupByMuscle(warmupType) || WARMUPS_DB['full-body'];
        const container = document.getElementById('warmup-exercises');

        container.innerHTML = warmup.exercises.map(ex => `
            <div class="warmup-exercise warmup-exercise-item" style="display:flex;justify-content:space-between;align-items:center;gap:10px;">
                <div class="warmup-exercise-content" style="flex:1;">
                    <span class="name">${ex.name}</span>
                    <small class="description">${ex.description}</small>
                </div>
                <div class="warmup-exercise-actions" style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
                    <span class="duration">${ex.duration}</span>
                    <button class="exercise-info-btn" data-exercise-name="${ex.name}" title="Vedi esecuzione" style="background:linear-gradient(135deg,#4361ee,#7209b7);border:none;color:white;width:32px;height:32px;border-radius:50%;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;font-size:0.9rem;flex-shrink:0;">
                        ℹ️
                    </button>
                </div>
            </div>
        `).join('');

        // Add click handlers for info buttons
        container.querySelectorAll('.exercise-info-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showExerciseInfoModal(null, btn.dataset.exerciseName, 'warmup');
            });
        });

        const warmupSection = document.getElementById('warmup-section');
        warmupSection.style.display = 'block';
        warmupSection.classList.remove('collapsed'); // Start expanded

        // Update title with warmup name
        const titleElement = document.getElementById('warmup-title');
        if (titleElement) {
            titleElement.textContent = warmup.name;
        }
    },

    displayCurrentExercise() {
        if (!this.activeWorkout) return;

        const exercise = this.activeWorkout.exercises[this.currentExerciseIndex];
        if (!exercise) return;

        const exerciseData = EXERCISES_DB[exercise.exerciseId];
        const container = document.getElementById('current-exercise');
        const completedSets = exercise.setsData.filter(s => s.completed).length;

        // Get GIF URL for this exercise
        const gifUrl = typeof getExerciseGif === 'function' ? getExerciseGif(exercise.exerciseId) : null;

        // Get last performance and PR data
        const lastPerformance = Storage.getLastPerformance(exercise.exerciseId);
        const pr = Storage.getExercisePR(exercise.exerciseId);
        const profile = Storage.getProfile();
        const bodyWeight = profile.weight || 0;

        // Get tempo from active program
        const activeProgram = Storage.getActiveProgram();
        const tempo = activeProgram?.metadata?.tempo;
        const userGoal = activeProgram?.metadata?.goal || profile.goal || 'hypertrophy';

        // Get progression suggestion (Double Progression)
        const progressionSuggestion = Storage.getProgressionSuggestion(
            exercise.exerciseId,
            exercise.targetReps,
            userGoal,
            Storage.getExerciseType(exercise.exerciseId)
        );

        // Check if this is a bodyweight exercise
        const isBodyweight = exerciseData?.category === 'corpo-libero' ||
            exerciseData?.equipment?.includes('corpo-libero') ||
            ['pull-up', 'chin-up', 'dips', 'push-up', 'plank', 'crunch', 'leg-raise', 'hanging-leg-raise', 'muscle-up', 'pistol-squat'].includes(exercise.exerciseId);

        // Initialize bodyweight mode if not set
        if (isBodyweight && !exercise.bwMode) {
            exercise.bwMode = 'solo'; // solo, assisted, weighted
            exercise.bwModifier = 0;
        }

        // Calculate effective weight for bodyweight exercises
        const getEffectiveWeight = () => {
            if (!isBodyweight) return null;
            if (exercise.bwMode === 'solo') return bodyWeight;
            if (exercise.bwMode === 'assisted') return Math.max(0, bodyWeight - Math.abs(exercise.bwModifier || 0));
            if (exercise.bwMode === 'weighted') return bodyWeight + Math.abs(exercise.bwModifier || 0);
            return bodyWeight;
        };

        const effectiveWeight = getEffectiveWeight();

        // Auto-fill weight for empty sets from last performance or effective weight
        exercise.setsData.forEach((set, idx) => {
            if (!set.weight && !set.autoFilled) {
                if (isBodyweight) {
                    set.weight = effectiveWeight || '';
                    set.isBodyweight = true;
                } else if (lastPerformance) {
                    set.weight = lastPerformance.weight;
                }
                set.autoFilled = true;
            }
        });

        // Build GIF preview HTML
        const gifPreviewHTML = gifUrl ? `
            <div class="exercise-gif-preview">
                <img src="${gifUrl}" alt="${exercise.name}" loading="lazy" onerror="this.parentElement.style.display='none'">
            </div>
        ` : '';

        // Build last performance info HTML
        let lastPerfHTML = '';
        if (lastPerformance) {
            const daysAgo = Math.floor((Date.now() - new Date(lastPerformance.date).getTime()) / (1000 * 60 * 60 * 24));
            const daysText = daysAgo === 0 ? 'oggi' : daysAgo === 1 ? 'ieri' : `${daysAgo}g fa`;
            lastPerfHTML = `
                <div class="last-performance">
                    <span class="last-perf-label">Ultima volta (${daysText}):</span>
                    <span class="last-perf-value">${lastPerformance.weight}kg × ${lastPerformance.reps}</span>
                </div>
            `;
        }

        // Build PR info HTML
        let prHTML = '';
        if (pr && pr.maxWeight) {
            prHTML = `
                <div class="pr-info">
                    <span class="pr-badge">PR</span>
                    <span class="pr-value">${pr.maxWeight}kg × ${pr.maxWeightReps || '?'}</span>
                </div>
            `;
        }

        // Build progression suggestion HTML
        let progressionHTML = '';
        if (progressionSuggestion && progressionSuggestion.status !== 'new') {
            const statusClass = progressionSuggestion.action === 'weight_up' ? 'suggestion-up' :
                               progressionSuggestion.action === 'reps_up' ? 'suggestion-reps' :
                               'suggestion-maintain';
            progressionHTML = `
                <div class="progression-suggestion ${statusClass}">
                    <span class="progression-message">${progressionSuggestion.message}</span>
                </div>
            `;
        }

        // Bodyweight mode selector
        const bodyweightSelector = isBodyweight ? `
            <div class="bw-mode-selector">
                <div class="bw-mode-header">
                    <span class="bw-icon">🏋️</span>
                    <span class="bw-label">Corpo libero (${bodyWeight}kg)</span>
                </div>
                <div class="bw-mode-options">
                    <button class="bw-mode-btn ${exercise.bwMode === 'solo' ? 'active' : ''}"
                        onclick="App.setBwMode('solo')">
                        Solo BW
                    </button>
                    <button class="bw-mode-btn ${exercise.bwMode === 'assisted' ? 'active' : ''}"
                        onclick="App.setBwMode('assisted')">
                        Assistito
                    </button>
                    <button class="bw-mode-btn ${exercise.bwMode === 'weighted' ? 'active' : ''}"
                        onclick="App.setBwMode('weighted')">
                        Zavorra
                    </button>
                </div>
                ${exercise.bwMode !== 'solo' ? `
                    <div class="bw-modifier-row">
                        <span class="bw-modifier-label">
                            ${exercise.bwMode === 'assisted' ? 'Assistenza:' : 'Zavorra:'}
                        </span>
                        <div class="bw-modifier-input">
                            <button class="bw-mod-btn" onclick="App.adjustBwModifier(-2.5)">−</button>
                            <input type="number" value="${Math.abs(exercise.bwModifier || 0)}"
                                onchange="App.setBwModifier(this.value)"
                                min="0" step="2.5" inputmode="decimal">
                            <button class="bw-mod-btn" onclick="App.adjustBwModifier(2.5)">+</button>
                            <span class="bw-mod-unit">kg</span>
                        </div>
                        <div class="bw-effective">
                            <span class="bw-eff-label">Peso effettivo:</span>
                            <span class="bw-eff-value ${exercise.bwMode === 'assisted' ? 'assisted' : 'weighted'}">
                                ${effectiveWeight}kg
                            </span>
                        </div>
                    </div>
                ` : ''}
            </div>
        ` : '';

        container.innerHTML = `
            <div class="exercise-header-mobile current-exercise-header" style="display:flex;justify-content:space-between;align-items:center;gap:15px;margin-bottom:15px;">
                <div class="current-exercise-title" style="flex:1;">
                    <div class="exercise-progress-badge">
                        ${this.currentExerciseIndex + 1}/${this.activeWorkout.exercises.length}
                    </div>
                    <h3 class="exercise-title-mobile">${exercise.name}</h3>
                    <div class="exercise-muscles-mobile">
                        ${exerciseData?.primaryMuscles.map(m => `<span class="muscle-tag-sm">${m}</span>`).join('') || ''}
                    </div>
                </div>
                <button class="exercise-info-btn" onclick="App.showExerciseInfoModal('${exercise.exerciseId}', '${exercise.name}', 'workout')" title="Vedi esecuzione" style="background:linear-gradient(135deg,#4361ee,#7209b7);border:none;color:white;width:36px;height:36px;border-radius:50%;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0;">
                    ℹ️
                </button>
            </div>
            ${gifPreviewHTML}
            ${bodyweightSelector}
            <div class="exercise-info-bar">
                ${lastPerfHTML}
                ${prHTML}
            </div>
            ${progressionHTML}
            <div class="exercise-target-mobile">
                <div class="target-item">
                    <span class="target-label">Serie</span>
                    <span class="target-value">${exercise.targetSets}${this.activeWorkout.isDeload && exercise.originalSets !== exercise.targetSets ? ` <small style="opacity:0.6">(${exercise.originalSets})</small>` : ''}</span>
                </div>
                <div class="target-item">
                    <span class="target-label">Reps</span>
                    <span class="target-value">${exercise.targetReps}</span>
                </div>
                <div class="target-item">
                    <span class="target-label">Pausa</span>
                    <span class="target-value">${exercise.rest}s</span>
                </div>
            </div>
            ${this.activeWorkout.isDeload && exercise.originalSets !== exercise.targetSets ? `
                <div class="deload-sets-notice">
                    Serie ridotte: ${exercise.originalSets} → ${exercise.targetSets} (deload -50%)
                </div>
            ` : ''}
            <div class="sets-progress-bar">
                <div class="sets-progress-fill" style="width: ${(completedSets / exercise.targetSets) * 100}%"></div>
                <span class="sets-progress-text">${completedSets}/${exercise.targetSets} completate</span>
            </div>
            <div class="sets-container-mobile">
                ${exercise.setsData.map((set, idx) => `
                    <div class="set-row-mobile ${set.completed ? 'completed' : ''} ${set.isNewPR ? 'new-pr' : ''}" data-set="${idx}">
                        <div class="set-row-top">
                            <div class="set-number-mobile">${idx + 1}</div>
                            <div class="set-inputs-mobile">
                                <div class="input-group">
                                    <input type="number" inputmode="decimal" step="0.5"
                                        value="${set.weight || (isBodyweight ? effectiveWeight : '')}"
                                        placeholder="${isBodyweight ? effectiveWeight : 'kg'}"
                                        onchange="App.updateSet(${idx}, 'weight', this.value)"
                                        onfocus="this.select()">
                                    <span class="input-suffix">kg</span>
                                </div>
                                <span class="set-x">×</span>
                                <div class="input-group">
                                    <input type="number" inputmode="numeric"
                                        value="${set.reps}" placeholder="reps"
                                        onchange="App.updateSet(${idx}, 'reps', this.value)"
                                        onfocus="this.select()">
                                    <span class="input-suffix">reps</span>
                                </div>
                            </div>
                            <button class="set-done-btn ${set.completed ? 'done' : ''}"
                                onclick="App.completeSet(${idx})">
                                ${set.completed ? '✓' : ''}${set.isNewPR ? '🏆' : ''}
                            </button>
                        </div>
                        ${set.completed ? `
                        <div class="set-row-bottom">
                            <div class="inline-rest-timer" id="inline-rest-timer-${idx}" style="display: none;">
                                <span class="inline-rest-icon">⏱</span>
                                <span class="inline-rest-display" id="inline-rest-display-${idx}">0:00</span>
                                <div class="inline-rest-bar-wrap">
                                    <div class="inline-rest-bar-fill" id="inline-rest-bar-${idx}"></div>
                                </div>
                                <button class="inline-rest-skip" onclick="App.skipInlineRest()">Salta</button>
                            </div>
                            <div class="rir-selector" title="Quante rep potevi ancora fare?">
                                <span class="rir-label">RIR:</span>
                                <div class="rir-buttons">
                                    ${[0,1,2,3,4].map(rir => `
                                        <button class="rir-btn ${set.rir === rir ? 'active' : ''}"
                                            onclick="App.setRir(${idx}, ${rir})">${rir}${rir === 4 ? '+' : ''}</button>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
            <div class="exercise-nav-mobile">
                <button class="nav-btn prev" onclick="App.previousExercise()"
                    ${this.currentExerciseIndex === 0 ? 'disabled' : ''}>
                    <span>‹</span> Prec
                </button>
                <button class="nav-btn next" onclick="App.nextExercise()"
                    ${this.currentExerciseIndex === this.activeWorkout.exercises.length - 1 ? 'disabled' : ''}>
                    Succ <span>›</span>
                </button>
            </div>
        `;

        // Re-attach inline rest timer if still running after re-render
        if (this._activeRestTimerSetIdx != null && Timer.restTimer) {
            const inlineTimer = document.getElementById(`inline-rest-timer-${this._activeRestTimerSetIdx}`);
            const inlineDisplay = document.getElementById(`inline-rest-display-${this._activeRestTimerSetIdx}`);
            const inlineBar = document.getElementById(`inline-rest-bar-${this._activeRestTimerSetIdx}`);

            if (inlineTimer) {
                inlineTimer.style.display = 'flex';
                // Update display with current remaining time
                const remaining = Timer.restTimeRemaining;
                const total = Timer.restTimeTotal;
                if (inlineDisplay) {
                    const mins = Math.floor(remaining / 60);
                    const secs = remaining % 60;
                    inlineDisplay.textContent = mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : remaining;
                }
                if (inlineBar) {
                    inlineBar.style.width = `${(remaining / total) * 100}%`;
                }

                // Re-bind callbacks to new DOM elements
                Timer.callbacks.onRestTick = (rem, tot) => {
                    const m = Math.floor(rem / 60);
                    const s = rem % 60;
                    inlineDisplay.textContent = m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : rem;
                    inlineBar.style.width = `${(rem / tot) * 100}%`;
                };
                Timer.callbacks.onRestComplete = () => {
                    inlineTimer.style.display = 'none';
                    this._activeRestTimerSetIdx = null;
                };
            }
        }
    },

    // Bodyweight mode functions
    setBwMode(mode) {
        if (!this.activeWorkout) return;
        const exercise = this.activeWorkout.exercises[this.currentExerciseIndex];
        exercise.bwMode = mode;
        if (mode === 'solo') exercise.bwModifier = 0;

        // Update all sets with new effective weight
        const profile = Storage.getProfile();
        const bodyWeight = profile.weight || 0;
        let effectiveWeight = bodyWeight;
        if (mode === 'assisted') effectiveWeight = Math.max(0, bodyWeight - Math.abs(exercise.bwModifier || 0));
        if (mode === 'weighted') effectiveWeight = bodyWeight + Math.abs(exercise.bwModifier || 0);

        exercise.setsData.forEach(set => {
            if (!set.completed) {
                set.weight = effectiveWeight;
            }
        });

        this.displayCurrentExercise();
    },

    setBwModifier(value) {
        if (!this.activeWorkout) return;
        const exercise = this.activeWorkout.exercises[this.currentExerciseIndex];
        exercise.bwModifier = Math.abs(parseFloat(value) || 0);

        // Update all incomplete sets with new effective weight
        const profile = Storage.getProfile();
        const bodyWeight = profile.weight || 0;
        let effectiveWeight = bodyWeight;
        if (exercise.bwMode === 'assisted') effectiveWeight = Math.max(0, bodyWeight - exercise.bwModifier);
        if (exercise.bwMode === 'weighted') effectiveWeight = bodyWeight + exercise.bwModifier;

        exercise.setsData.forEach(set => {
            if (!set.completed) {
                set.weight = effectiveWeight;
            }
        });

        this.displayCurrentExercise();
    },

    adjustBwModifier(delta) {
        if (!this.activeWorkout) return;
        const exercise = this.activeWorkout.exercises[this.currentExerciseIndex];
        const newValue = Math.max(0, (exercise.bwModifier || 0) + delta);
        this.setBwModifier(newValue);
    },

    updateSet(setIndex, field, value) {
        if (!this.activeWorkout) return;
        const exercise = this.activeWorkout.exercises[this.currentExerciseIndex];
        exercise.setsData[setIndex][field] = value;
    },

    setRir(setIndex, rir) {
        if (!this.activeWorkout) return;
        const exercise = this.activeWorkout.exercises[this.currentExerciseIndex];
        exercise.setsData[setIndex].rir = rir;
        this.displayCurrentExercise();

        // Show feedback based on RIR
        if (rir === 0) {
            this.showNotification('⚠️ RIR 0: Cedimento raggiunto. Considera meno peso prossima volta.', 'warning');
        } else if (rir >= 4) {
            this.showNotification('💡 RIR 4+: Troppo leggero! Considera più peso.', 'info');
        }
    },

    completeSet(setIndex) {
        if (!this.activeWorkout) return;

        const exercise = this.activeWorkout.exercises[this.currentExerciseIndex];
        const set = exercise.setsData[setIndex];

        // Toggle completion
        set.completed = !set.completed;

        // Check for new PR when completing a set
        if (set.completed && set.weight && set.reps) {
            const prCheck = Storage.checkForNewPR(exercise.exerciseId, set.weight, set.reps);

            if (prCheck.isNewPR) {
                set.isNewPR = true;

                // Show PR notification
                if (prCheck.type === 'first') {
                    this.showNotification(`🏆 Prima volta per ${exercise.name}! ${set.weight}kg × ${set.reps}`, 'success');
                } else if (prCheck.type === 'weight') {
                    this.showNotification(`🏆 NUOVO PR DI PESO! ${set.weight}kg (prima: ${prCheck.oldValue}kg)`, 'success');
                } else if (prCheck.type === 'e1rm') {
                    this.showNotification(`🏆 Nuovo record stimato 1RM: ${prCheck.newValue}kg!`, 'success');
                }

                // Play celebration sound
                Timer.playCompletionSound();
            }

            // Check if all sets are completed at top of rep range
            const completedSets = exercise.setsData.filter(s => s.completed && s.reps);
            if (completedSets.length === exercise.targetSets) {
                const range = Storage.parseRepRange(exercise.targetReps);
                const allAtTop = completedSets.every(s => parseInt(s.reps) >= range.max);

                if (allAtTop && !exercise.topRangeNotified) {
                    exercise.topRangeNotified = true;
                    const exerciseType = Storage.getExerciseType(exercise.exerciseId);
                    const increment = exerciseType === 'compound' ? 2.5 : 1.25;
                    const isLower = ['squat', 'deadlift', 'leg-press', 'hip-thrust'].some(ex => exercise.exerciseId.includes(ex));
                    const actualIncrement = isLower ? 5 : increment;

                    setTimeout(() => {
                        this.showNotification(`🎯 Ottimo! Prossima volta aumenta di ${actualIncrement}kg!`, 'success');
                    }, 500);
                }
            }
        } else {
            set.isNewPR = false;
        }

        // Update UI
        this.displayCurrentExercise();

        // Auto-collapse warmup section when user starts exercising
        if (set.completed) {
            const warmupSection = document.getElementById('warmup-section');
            if (warmupSection && !warmupSection.classList.contains('collapsed')) {
                warmupSection.classList.add('collapsed');
            }
        }

        // Start rest timer if completed, but NOT on the last set of the exercise
        if (set.completed) {
            const completedCount = exercise.setsData.filter(s => s.completed).length;
            const isLastSet = completedCount >= exercise.targetSets;

            if (!isLastSet) {
                const restTime = exercise.rest || 60;
                this.showRestTimer(restTime);
            }
        }
    },

    showRestTimer(seconds) {
        // Find the last completed set index to show inline timer
        const exercise = this.activeWorkout.exercises[this.currentExerciseIndex];
        const lastCompletedIdx = exercise.setsData.reduce((last, s, i) => s.completed ? i : last, -1);

        const inlineTimer = document.getElementById(`inline-rest-timer-${lastCompletedIdx}`);
        const inlineDisplay = document.getElementById(`inline-rest-display-${lastCompletedIdx}`);
        const inlineBar = document.getElementById(`inline-rest-bar-${lastCompletedIdx}`);

        if (inlineTimer) {
            this._activeRestTimerSetIdx = lastCompletedIdx;
            inlineTimer.style.display = 'flex';

            Timer.startRestTimer(
                seconds,
                (remaining, total) => {
                    const mins = Math.floor(remaining / 60);
                    const secs = remaining % 60;
                    inlineDisplay.textContent = mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : remaining;
                    const percent = (remaining / total) * 100;
                    inlineBar.style.width = `${percent}%`;
                },
                () => {
                    inlineTimer.style.display = 'none';
                    this._activeRestTimerSetIdx = null;
                }
            );
        }
    },

    skipInlineRest() {
        Timer.skipRest();
        if (this._activeRestTimerSetIdx != null) {
            const el = document.getElementById(`inline-rest-timer-${this._activeRestTimerSetIdx}`);
            if (el) el.style.display = 'none';
            this._activeRestTimerSetIdx = null;
        }
    },

    previousExercise() {
        if (this.currentExerciseIndex > 0) {
            this.currentExerciseIndex--;
            this.displayCurrentExercise();
        }
    },

    nextExercise() {
        if (this.currentExerciseIndex < this.activeWorkout.exercises.length - 1) {
            this.currentExerciseIndex++;
            this.displayCurrentExercise();
        }
    },

    endWorkout() {
        if (!this.activeWorkout) return;

        if (!confirm('Terminare l\'allenamento?')) return;

        // Stop rest timer but keep workout timer running
        Timer.stopRestTimer();
        this._activeRestTimerSetIdx = null;
        const oldModal = document.getElementById('rest-timer-modal');
        if (oldModal) oldModal.style.display = 'none';

        // Show cooldown section
        this.showCooldown();
    },

    showCooldown() {
        // Get cooldown based on workout type
        const workoutType = this.activeWorkout?.type || 'full-body';
        const cooldown = getCooldownForWorkout(workoutType);

        // Render cooldown info
        const infoEl = document.getElementById('cooldown-info');
        infoEl.innerHTML = `
            <div class="cooldown-duration">
                <span class="duration-icon">⏱️</span>
                <span class="duration-text">${cooldown.duration}</span>
            </div>
        `;

        // Render cooldown exercises
        const exercisesEl = document.getElementById('cooldown-exercises');
        exercisesEl.innerHTML = cooldown.exercises.map((ex, index) => `
            <div class="cooldown-exercise cooldown-exercise-item" style="display:flex;align-items:center;gap:12px;">
                <div class="cooldown-exercise-number">${index + 1}</div>
                <div class="cooldown-exercise-content" style="flex:1;">
                    <div class="cooldown-exercise-name">${ex.name}</div>
                    <div class="cooldown-exercise-duration">${ex.duration}</div>
                    <div class="cooldown-exercise-description">${ex.description}</div>
                </div>
                <button class="exercise-info-btn" data-exercise-name="${ex.name}" title="Vedi esecuzione" style="background:linear-gradient(135deg,#4361ee,#7209b7);border:none;color:white;width:32px;height:32px;border-radius:50%;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;font-size:0.9rem;flex-shrink:0;">
                    ℹ️
                </button>
            </div>
        `).join('');

        // Add click handlers for info buttons
        exercisesEl.querySelectorAll('.exercise-info-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showExerciseInfoModal(null, btn.dataset.exerciseName, 'cooldown');
            });
        });

        // Show modal
        document.getElementById('cooldown-modal').style.display = 'flex';
    },

    finishWorkout() {
        // Rimuovi protezione refresh
        if (this._beforeUnloadHandler) {
            window.removeEventListener('beforeunload', this._beforeUnloadHandler);
            this._beforeUnloadHandler = null;
        }

        // Stop workout timer
        const duration = Timer.stopWorkoutTimer();

        // Calculate workout stats
        let totalVolume = 0;
        let totalSets = 0;

        if (this.activeWorkout) {
            this.activeWorkout.exercises.forEach(ex => {
                ex.setsData.forEach(set => {
                    if (set.completed && set.weight && set.reps) {
                        totalVolume += parseFloat(set.weight) * parseInt(set.reps);
                        totalSets++;
                    }
                });
            });

            // Save workout with properly formatted exercises
            const workoutData = {
                name: this.activeWorkout.type || 'Allenamento',
                type: this.activeWorkout.type,
                exercises: this.activeWorkout.exercises.map(ex => ({
                    exerciseId: ex.exerciseId,
                    name: ex.name,
                    sets: ex.setsData  // Save completed sets data
                })),
                duration: duration,
                totalVolume: Math.round(totalVolume),
                totalSets: totalSets
            };

            // Non salvare sessioni vuote (nessuna serie completata)
            if (totalSets === 0) {
                this.activeWorkout = null;
                this.currentExerciseIndex = 0;
                this.currentSetIndex = 0;
                document.getElementById('workout-active').classList.add('hidden');
                document.getElementById('workout-not-started').classList.remove('hidden');
                this.showNotification('Sessione annullata (nessuna serie completata)', 'info');
                return;
            }

            // Non salvare in modalità simulazione
            if (!this._isSimulation) {
                Storage.saveWorkout(workoutData);
            }

            // Generate progression summary for next session
            const profile = Storage.getProfile();
            const activeProgram = Storage.getActiveProgram();
            const userGoal = activeProgram?.metadata?.goal || profile.goal || 'hypertrophy';

            const progressionSummary = this.activeWorkout.exercises.map(ex => {
                const completedSets = ex.setsData.filter(s => s.completed && s.reps);
                if (completedSets.length === 0) return null;

                const range = Storage.parseRepRange(ex.targetReps);
                const reps = completedSets.map(s => parseInt(s.reps));
                const avgReps = Math.round(reps.reduce((a, b) => a + b, 0) / reps.length);
                const weight = parseFloat(completedSets[0].weight) || 0;
                const allAtTop = reps.every(r => r >= range.max);
                const allInRange = reps.every(r => r >= range.min);

                const exerciseType = Storage.getExerciseType(ex.exerciseId);
                const increment = exerciseType === 'compound' ? 2.5 : 1.25;
                const isLower = ['squat', 'deadlift', 'leg-press', 'hip-thrust'].some(e => ex.exerciseId.includes(e));
                const actualIncrement = isLower ? 5 : increment;

                if (allAtTop) {
                    return { name: ex.name, action: 'up', message: `+${actualIncrement}kg → ${weight + actualIncrement}kg` };
                } else if (allInRange) {
                    return { name: ex.name, action: 'reps', message: `${weight}kg, +1 rep` };
                } else {
                    return { name: ex.name, action: 'maintain', message: `${weight}kg, consolida` };
                }
            }).filter(Boolean);

            // Store summary for display
            this.lastWorkoutSummary = {
                volume: Math.round(totalVolume),
                sets: totalSets,
                duration: duration,
                progressions: progressionSummary
            };
        }

        // Save exercises for completion summary before resetting
        this.lastWorkoutExercises = this.activeWorkout?.exercises || [];

        // Reset state
        const wasSimulation = this._isSimulation;
        this._isSimulation = false;
        this.activeWorkout = null;
        this.currentExerciseIndex = 0;

        // Update UI
        document.getElementById('workout-not-started').style.display = 'block';
        document.getElementById('workout-active').style.display = 'none';
        const restModal2 = document.getElementById('rest-timer-modal');
        if (restModal2) restModal2.style.display = 'none';
        document.getElementById('cooldown-modal').style.display = 'none';

        // Update dashboard
        this.loadDashboard();

        // Show completion notification with progression hints
        if (wasSimulation) {
            this.showNotification('🧪 Simulazione terminata — nessun dato salvato', 'info');
        } else {
            this.showNotification(`Allenamento completato! Volume: ${this.formatNumber(totalVolume)} kg`, 'success');
        }

        // Always show workout completion summary
        if (this.lastWorkoutSummary) {
            this.showWorkoutCompletionSummary();
        }

        // Check for deload suggestion
        this.checkDeloadSuggestion();

        // Check if should advance to next week
        this.checkWeekAdvancement();

        this.showPage('dashboard');
    },

    checkWeekAdvancement() {
        if (!Storage.shouldAdvanceWeek()) return;

        const cycleInfo = Storage.getCycleInfo();
        if (!cycleInfo) return;

        // Don't prompt if already at last week
        if (cycleInfo.isLastWeek) return;

        // Check next week's phase
        const nextWeekNum = cycleInfo.currentWeek + 1;
        const nextPhase = cycleInfo.phases.find(p => p.week === nextWeekNum);

        // Show week advancement suggestion
        setTimeout(() => {
            this.showWeekAdvancementSuggestion(cycleInfo, nextPhase);
        }, 3500);
    },

    showWeekAdvancementSuggestion(cycleInfo, nextPhase) {
        const existingModal = document.getElementById('week-advance-modal');
        if (existingModal) existingModal.remove();

        const nextPhaseLabel = nextPhase?.phaseName || 'Prossima fase';
        const isNextDeload = nextPhase?.phase === 'deload';

        const html = `
            <div class="week-advance-modal" id="week-advance-modal">
                <div class="week-advance-content">
                    <h3>📅 Avanzamento Settimana</h3>
                    <p>Hai completato gli allenamenti della settimana ${cycleInfo.currentWeek}!</p>
                    <div class="week-advance-info">
                        <span class="current-week">Settimana ${cycleInfo.currentWeek}</span>
                        <span class="arrow">→</span>
                        <span class="next-week ${isNextDeload ? 'deload' : ''}">
                            Settimana ${cycleInfo.currentWeek + 1} - ${nextPhaseLabel}
                        </span>
                    </div>
                    <div class="week-advance-actions">
                        <button class="btn btn-primary" onclick="App.confirmWeekAdvancement()">
                            Avanza Settimana
                        </button>
                        <button class="btn btn-secondary" onclick="App.dismissWeekAdvancement()">
                            Rimani nella settimana
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', html);
    },

    confirmWeekAdvancement() {
        document.getElementById('week-advance-modal')?.remove();
        const cycleInfo = Storage.advanceCycleWeek();
        if (cycleInfo) {
            this.showNotification(`⏭️ Settimana ${cycleInfo.currentWeek} - ${cycleInfo.currentPhase.phaseName}`, 'success');
            this.updateCycleCard();
        }
    },

    dismissWeekAdvancement() {
        document.getElementById('week-advance-modal')?.remove();
    },

    checkDeloadSuggestion() {
        const cycleInfo = Storage.getCycleInfo();
        if (!cycleInfo) return;

        const isDeload = Storage.isDeloadActive();
        if (isDeload) return; // Already in deload

        const currentPhase = cycleInfo.currentPhase;
        const nextDeload = cycleInfo.phases.find(p => p.week > cycleInfo.currentWeek && p.phase === 'deload');
        const weeksToDeload = nextDeload ? nextDeload.week - cycleInfo.currentWeek : null;

        // Suggest deload if:
        // 1. In intensification phase and 1 week from deload
        // 2. At the end of a long accumulation phase (week 3+)
        if (weeksToDeload === 1) {
            setTimeout(() => {
                this.showDeloadSuggestion('prossima', 'La prossima settimana è deload programmato. Sentiti libero di attivarlo prima se ti senti affaticato.');
            }, 2000);
        } else if (currentPhase.phase === 'intensification' && cycleInfo.currentWeek >= 4) {
            // Check if user might need early deload (high RIR consumption)
            const recentWorkouts = Storage.getRecentWorkouts(3);
            const lowRirCount = recentWorkouts.filter(w => {
                const avgRir = w.exercises?.reduce((sum, ex) => {
                    const rirs = ex.sets?.filter(s => s.rir !== undefined).map(s => s.rir) || [];
                    return sum + (rirs.length ? rirs.reduce((a, b) => a + b, 0) / rirs.length : 3);
                }, 0) / (w.exercises?.length || 1);
                return avgRir <= 1;
            }).length;

            if (lowRirCount >= 2) {
                setTimeout(() => {
                    this.showDeloadSuggestion('anticipato', 'Hai registrato RIR molto bassi nelle ultime sessioni. Considera un deload anticipato.');
                }, 2000);
            }
        }
    },

    showDeloadSuggestion(type, message) {
        const existingSuggestion = document.getElementById('deload-suggestion-modal');
        if (existingSuggestion) existingSuggestion.remove();

        const html = `
            <div class="deload-suggestion-modal" id="deload-suggestion-modal">
                <div class="deload-suggestion-content">
                    <h3>🔄 Suggerimento Deload</h3>
                    <p>${message}</p>
                    <div class="deload-suggestion-actions">
                        <button class="btn btn-warning" onclick="App.acceptDeloadSuggestion()">
                            Attiva Deload
                        </button>
                        <button class="btn btn-secondary" onclick="App.dismissDeloadSuggestion()">
                            Non ora
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', html);
    },

    acceptDeloadSuggestion() {
        document.getElementById('deload-suggestion-modal')?.remove();
        Storage.toggleDeload();
        this.showNotification('🔄 Deload attivato! Volume ridotto al 50%', 'info');
        this.updateCycleCard();
    },

    dismissDeloadSuggestion() {
        document.getElementById('deload-suggestion-modal')?.remove();
    },

    showProgressionSummary() {
        const summary = this.lastWorkoutSummary;
        if (!summary) return;

        const upCount = summary.progressions.filter(p => p.action === 'up').length;
        const repsCount = summary.progressions.filter(p => p.action === 'reps').length;

        let summaryHTML = `
            <div class="progression-summary-modal" id="progression-summary-modal">
                <div class="progression-summary-content">
                    <h3>📈 Riepilogo Progressione</h3>
                    <div class="summary-stats">
                        <div class="summary-stat">
                            <span class="stat-value">${this.formatNumber(summary.volume)}</span>
                            <span class="stat-label">kg volume</span>
                        </div>
                        <div class="summary-stat">
                            <span class="stat-value">${summary.sets}</span>
                            <span class="stat-label">serie</span>
                        </div>
                        <div class="summary-stat">
                            <span class="stat-value">${upCount}</span>
                            <span class="stat-label">↑ peso</span>
                        </div>
                    </div>
                    <h4>Prossima sessione:</h4>
                    <div class="progression-list">
                        ${summary.progressions.map(p => `
                            <div class="progression-item ${p.action}">
                                <span class="prog-name">${p.name}</span>
                                <span class="prog-action">${p.message}</span>
                            </div>
                        `).join('')}
                    </div>
                    <button class="btn btn-primary" onclick="App.closeProgressionSummary()">Ho capito!</button>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', summaryHTML);
    },

    closeProgressionSummary() {
        const modal = document.getElementById('progression-summary-modal');
        if (modal) modal.remove();
    },

    showWorkoutCompletionSummary() {
        const summary = this.lastWorkoutSummary;
        if (!summary) return;

        const durationMin = Math.round((summary.duration || 0) / 60);
        const hasProgressions = summary.progressions && summary.progressions.length > 0;

        const upCount = hasProgressions ? summary.progressions.filter(p => p.action === 'up').length : 0;
        const repsCount = hasProgressions ? summary.progressions.filter(p => p.action === 'reps').length : 0;

        // Build exercise breakdown from last workout
        let exerciseBreakdownHTML = '';
        if (this.lastWorkoutExercises && this.lastWorkoutExercises.length > 0) {
            exerciseBreakdownHTML = `
                <h4>Dettaglio esercizi</h4>
                <div class="workout-detail-exercises">
                    ${this.lastWorkoutExercises.map(ex => {
                        const completedSets = ex.setsData.filter(s => s.completed);
                        const exVolume = completedSets.reduce((sum, s) => sum + (parseFloat(s.weight) || 0) * (parseInt(s.reps) || 0), 0);
                        return `
                            <div class="workout-detail-exercise">
                                <div class="workout-detail-ex-header">
                                    <span class="workout-detail-ex-name">${ex.name}</span>
                                    <span class="workout-detail-ex-vol">${this.formatNumber(Math.round(exVolume))}kg</span>
                                </div>
                                <div class="workout-detail-sets">
                                    ${ex.setsData.map((s, i) => `
                                        <span class="workout-detail-set ${s.completed ? 'completed' : 'skipped'}">
                                            ${s.completed ? `${s.weight}kg × ${s.reps}` : `Set ${i + 1}: saltato`}
                                        </span>
                                    `).join('')}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }

        let progressionHTML = '';
        if (hasProgressions) {
            progressionHTML = `
                <h4>Prossima sessione</h4>
                <div class="progression-list">
                    ${summary.progressions.map(p => `
                        <div class="progression-item ${p.action}">
                            <span class="prog-name">${p.name}</span>
                            <span class="prog-action">${p.message}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        const html = `
            <div class="progression-summary-modal" id="workout-completion-modal">
                <div class="progression-summary-content">
                    <h3>🎉 Allenamento Completato!</h3>
                    <div class="summary-stats">
                        <div class="summary-stat">
                            <span class="stat-value">${this.formatNumber(summary.volume)}</span>
                            <span class="stat-label">kg volume</span>
                        </div>
                        <div class="summary-stat">
                            <span class="stat-value">${summary.sets}</span>
                            <span class="stat-label">serie</span>
                        </div>
                        <div class="summary-stat">
                            <span class="stat-value">${durationMin}</span>
                            <span class="stat-label">minuti</span>
                        </div>
                        ${hasProgressions ? `<div class="summary-stat">
                            <span class="stat-value">${upCount}</span>
                            <span class="stat-label">↑ peso</span>
                        </div>` : ''}
                    </div>
                    ${exerciseBreakdownHTML}
                    ${progressionHTML}
                    <button class="btn btn-primary" onclick="App.closeWorkoutCompletionSummary()">Chiudi</button>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', html);
    },

    closeWorkoutCompletionSummary() {
        const modal = document.getElementById('workout-completion-modal');
        if (modal) modal.remove();
    },

    showWorkoutDetail(workoutId) {
        const workout = Storage.getWorkoutById(workoutId);
        if (!workout) {
            this.showNotification('Allenamento non trovato', 'error');
            return;
        }

        const date = this.formatDate(new Date(workout.date));
        const durationMin = Math.round((workout.duration || 0) / 60);

        let exercisesHTML = '<p class="empty-state-mini">Nessun dettaglio disponibile</p>';
        if (workout.exercises && workout.exercises.length > 0) {
            exercisesHTML = workout.exercises.map(ex => {
                const sets = ex.sets || [];
                const completedSets = sets.filter(s => s.completed);
                const exVolume = completedSets.reduce((sum, s) => sum + (parseFloat(s.weight) || 0) * (parseInt(s.reps) || 0), 0);

                return `
                    <div class="workout-detail-exercise">
                        <div class="workout-detail-ex-header">
                            <span class="workout-detail-ex-name">${ex.name}</span>
                            <span class="workout-detail-ex-vol">${this.formatNumber(Math.round(exVolume))}kg</span>
                        </div>
                        <div class="workout-detail-sets">
                            ${sets.map((s, i) => `
                                <span class="workout-detail-set ${s.completed ? 'completed' : 'skipped'}">
                                    ${s.completed ? `${s.weight}kg × ${s.reps}` : `Set ${i + 1}: saltato`}
                                </span>
                            `).join('')}
                        </div>
                    </div>
                `;
            }).join('');
        }

        const html = `
            <div class="progression-summary-modal" id="workout-detail-modal">
                <div class="progression-summary-content">
                    <h3>📋 ${workout.name || 'Allenamento'}</h3>
                    <p style="color: var(--text-secondary); margin-bottom: 12px;">${date}</p>
                    <div class="summary-stats">
                        <div class="summary-stat">
                            <span class="stat-value">${this.formatNumber(workout.totalVolume || 0)}</span>
                            <span class="stat-label">kg volume</span>
                        </div>
                        <div class="summary-stat">
                            <span class="stat-value">${workout.totalSets || 0}</span>
                            <span class="stat-label">serie</span>
                        </div>
                        <div class="summary-stat">
                            <span class="stat-value">${durationMin}</span>
                            <span class="stat-label">minuti</span>
                        </div>
                    </div>
                    <h4>Esercizi</h4>
                    <div class="workout-detail-exercises">
                        ${exercisesHTML}
                    </div>
                    <div style="display:flex;gap:8px;margin-top:16px;">
                        <button class="btn btn-primary" onclick="App.closeWorkoutDetail()" style="flex:1;">Chiudi</button>
                        <button class="btn btn-danger btn-sm" onclick="App.deleteWorkoutSession(${workout.id}); App.closeWorkoutDetail();">Elimina</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', html);
    },

    closeWorkoutDetail() {
        const modal = document.getElementById('workout-detail-modal');
        if (modal) modal.remove();
    },

    // ========================================
    // PROFILE
    // ========================================

    loadProfile() {
        const profile = Storage.getProfile();

        document.getElementById('profile-name').value = profile.name || '';
        document.getElementById('profile-gender').value = profile.gender || 'male';
        document.getElementById('profile-birthdate').value = profile.birthdate || '';
        document.getElementById('profile-height').value = profile.height || '';
        document.getElementById('profile-weight').value = profile.weight || '';
        document.getElementById('profile-bodyfat').value = profile.bodyFat || '';
        document.getElementById('profile-level').value = profile.level || 'intermediate';
        document.getElementById('profile-background').value = profile.background || 'none';
        document.getElementById('profile-goal').value = profile.goal || 'recomp';
        document.getElementById('profile-target-weight').value = profile.targetWeight || '';
        document.getElementById('profile-target-bf').value = profile.targetBodyFat || '';
        document.getElementById('profile-days').value = profile.daysPerWeek || 4;
        document.getElementById('profile-session-time').value = profile.sessionTime || 60;

        // Equipment checkboxes
        const equipment = profile.equipment || [];
        document.querySelectorAll('#equipment-checkboxes input').forEach(cb => {
            cb.checked = equipment.includes(cb.value);
        });
    },

    saveProfile() {
        const equipment = [];
        document.querySelectorAll('#equipment-checkboxes input:checked').forEach(cb => {
            equipment.push(cb.value);
        });

        const profile = {
            name: document.getElementById('profile-name').value,
            gender: document.getElementById('profile-gender').value,
            birthdate: document.getElementById('profile-birthdate').value,
            height: parseFloat(document.getElementById('profile-height').value) || 0,
            weight: parseFloat(document.getElementById('profile-weight').value) || 0,
            bodyFat: parseFloat(document.getElementById('profile-bodyfat').value) || 0,
            level: document.getElementById('profile-level').value,
            background: document.getElementById('profile-background').value,
            goal: document.getElementById('profile-goal').value,
            targetWeight: parseFloat(document.getElementById('profile-target-weight').value) || 0,
            targetBodyFat: parseFloat(document.getElementById('profile-target-bf').value) || 0,
            daysPerWeek: parseInt(document.getElementById('profile-days').value) || 4,
            sessionTime: parseInt(document.getElementById('profile-session-time').value) || 60,
            equipment: equipment
        };

        Storage.saveProfile(profile);
        this.loadDashboard();
        this.showNotification('Profilo salvato!', 'success');
    },

    // ========================================
    // PROGRESS & CHARTS
    // ========================================

    loadProgress() {
        this.updateProgressStats();
        this.loadWorkoutHistory();
        this.loadPersonalRecords();
        this.loadProgressCycleInfo();
        this.loadMuscleVolumeBars();
        this.loadRirTrend();
        this.loadCycleHistory();
        this.populateStrengthExerciseSelect();
    },

    updateProgressStats() {
        const stats = Storage.getStatistics();
        const streak = Storage.getStreak();

        // Update stats bar
        const el = (id) => document.getElementById(id);
        if (el('progress-total-workouts')) el('progress-total-workouts').textContent = stats.totalWorkouts;
        if (el('progress-total-volume')) el('progress-total-volume').textContent = (stats.totalVolume / 1000).toFixed(1);
        if (el('progress-total-prs')) el('progress-total-prs').textContent = stats.prCount;
        if (el('progress-best-streak')) el('progress-best-streak').textContent = streak.best;
    },

    initCharts() {
        this.initVolumeChart();
        this.initFrequencyChart();
        this.initWeightChart();
    },

    initVolumeChart() {
        const ctx = document.getElementById('volume-chart');
        const card = document.getElementById('volume-chart-card');
        if (!ctx || !card) return;

        const weeks = this.getWeeklyVolumes(4);
        const hasData = weeks.some(w => w.volume > 0);

        // Show/hide based on data
        card.classList.toggle('no-data', !hasData);
        if (!hasData) return;

        if (this.charts.volume) {
            this.charts.volume.destroy();
        }

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
                    y: { beginAtZero: true, ticks: { color: '#a0a0b0' }, grid: { color: 'rgba(255,255,255,0.1)' } },
                    x: { ticks: { color: '#a0a0b0' }, grid: { display: false } }
                }
            }
        });
    },

    initFrequencyChart() {
        const ctx = document.getElementById('frequency-chart');
        const card = document.getElementById('frequency-chart-card');
        if (!ctx || !card) return;

        const weeks = this.getWeeklyWorkoutCounts(4);
        const hasData = weeks.some(w => w.count > 0);

        // Show/hide based on data
        card.classList.toggle('no-data', !hasData);
        if (!hasData) return;

        if (this.charts.frequency) {
            this.charts.frequency.destroy();
        }

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
                    y: { beginAtZero: true, max: 7, ticks: { color: '#a0a0b0', stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.1)' } },
                    x: { ticks: { color: '#a0a0b0' }, grid: { display: false } }
                }
            }
        });
    },

    initWeightChart() {
        const ctx = document.getElementById('weight-chart');
        const container = document.getElementById('weight-chart-container');
        if (!ctx) return;

        const measurements = Storage.getMeasurements().slice(0, 10).reverse();
        const hasData = measurements.length > 0;

        // Show/hide empty state
        const emptyEl = document.getElementById('weight-empty');
        if (emptyEl) emptyEl.style.display = hasData ? 'none' : 'block';
        if (ctx) ctx.style.display = hasData ? 'block' : 'none';

        if (this.charts.weight) {
            this.charts.weight.destroy();
        }

        if (!hasData) return;

        this.charts.weight = new Chart(ctx, {
            type: 'line',
            data: {
                labels: measurements.map(m => new Date(m.date).toLocaleDateString()),
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
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        ticks: { color: '#a0a0b0' },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    },
                    x: {
                        ticks: { color: '#a0a0b0' },
                        grid: { display: false }
                    }
                }
            }
        });
    },

    getWeeklyVolumes(numWeeks) {
        const weeks = [];
        const now = new Date();

        for (let i = numWeeks - 1; i >= 0; i--) {
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay() - (i * 7) + 1);
            startOfWeek.setHours(0, 0, 0, 0);

            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            endOfWeek.setHours(23, 59, 59, 999);

            const workouts = Storage.getWorkoutsInDateRange(startOfWeek, endOfWeek);
            const volume = workouts.reduce((sum, w) => sum + (w.totalVolume || 0), 0);

            weeks.push({
                label: `Sett ${numWeeks - i}`,
                volume: volume
            });
        }

        return weeks;
    },

    getWeeklyWorkoutCounts(numWeeks) {
        const weeks = [];
        const now = new Date();

        for (let i = numWeeks - 1; i >= 0; i--) {
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay() - (i * 7) + 1);
            startOfWeek.setHours(0, 0, 0, 0);

            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            endOfWeek.setHours(23, 59, 59, 999);

            const workouts = Storage.getWorkoutsInDateRange(startOfWeek, endOfWeek);

            weeks.push({
                label: `Sett ${numWeeks - i}`,
                count: workouts.length
            });
        }

        return weeks;
    },

    saveMeasurement() {
        const weight = parseFloat(document.getElementById('measure-weight').value);
        const bodyFat = parseFloat(document.getElementById('measure-bodyfat').value);

        if (!weight) {
            this.showNotification('Inserisci almeno il peso', 'warning');
            return;
        }

        Storage.saveMeasurement({
            weight: weight,
            bodyFat: bodyFat || null
        });

        document.getElementById('measure-weight').value = '';
        document.getElementById('measure-bodyfat').value = '';

        this.loadMeasurementsHistory();
        this.initWeightChart();
        this.loadDashboard();
        this.showNotification('Misurazione salvata!', 'success');
    },

    loadMeasurementsHistory() {
        const measurements = Storage.getMeasurements().slice(0, 10);
        const container = document.getElementById('measurements-history');

        if (!container) return;

        if (measurements.length === 0) {
            container.innerHTML = '<p class="empty-state">Nessuna misurazione registrata</p>';
            return;
        }

        container.innerHTML = `
            <table class="measurements-table">
                <thead>
                    <tr>
                        <th>Data</th>
                        <th>Peso</th>
                        <th>% Grasso</th>
                    </tr>
                </thead>
                <tbody>
                    ${measurements.map(m => `
                        <tr>
                            <td>${new Date(m.date).toLocaleDateString()}</td>
                            <td>${m.weight} kg</td>
                            <td>${m.bodyFat ? m.bodyFat + '%' : '-'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    },

    loadWorkoutHistory() {
        const workouts = Storage.getRecentWorkouts(10);
        const container = document.getElementById('workout-history-list');

        if (!container) return;

        if (workouts.length === 0) {
            container.innerHTML = '<p class="empty-state-mini">Nessun allenamento registrato</p>';
            return;
        }

        container.innerHTML = workouts.map(w => `
            <div class="workout-history-item clickable" data-workout-id="${w.id}">
                <div class="workout-history-info">
                    <div class="workout-history-name">${w.name || 'Allenamento'}</div>
                    <div class="workout-history-meta">${this.formatDateShort(new Date(w.date))} • ${Math.round(w.duration / 60)}min</div>
                </div>
                <div class="workout-history-stats">${this.formatNumber(w.totalVolume)}kg →</div>
            </div>
        `).join('');

        // Add click handlers for workout detail view
        container.querySelectorAll('.workout-history-item').forEach(item => {
            item.addEventListener('click', () => {
                const id = parseInt(item.dataset.workoutId);
                if (id) this.showWorkoutDetail(id);
            });
        });
    },

    deleteWorkoutSession(workoutId, event) {
        // Prevent event bubbling
        if (event) event.stopPropagation();

        const workout = Storage.getWorkoutById(workoutId);
        if (!workout) {
            this.showNotification('Allenamento non trovato', 'error');
            return;
        }

        const workoutName = workout.name || 'Allenamento';
        const workoutDate = this.formatDate(new Date(workout.date));

        if (confirm(`Eliminare "${workoutName}" del ${workoutDate}?\n\nQuesta azione non può essere annullata.`)) {
            Storage.deleteWorkout(workoutId);
            this.showNotification('Allenamento eliminato', 'success');

            // Refresh the history list and dashboard
            this.loadWorkoutHistory();
            this.loadDashboard();

            // Refresh charts if visible
            if (document.getElementById('page-progress').classList.contains('active')) {
                this.initCharts();
            }
        }
    },

    loadPersonalRecords() {
        const prs = Storage.getPersonalRecords();
        const container = document.getElementById('prs-list');

        if (!container) return;

        const prEntries = Object.entries(prs).filter(([, pr]) => pr.estimated1RM > 0 || pr.maxWeight > 0);

        if (prEntries.length === 0) {
            container.innerHTML = '<p class="empty-state-mini">Completa allenamenti per vedere i tuoi PR!</p>';
            return;
        }

        // Sort by E1RM descending (strongest lifts first)
        prEntries.sort((a, b) => (b[1].estimated1RM || 0) - (a[1].estimated1RM || 0));

        container.innerHTML = prEntries.slice(0, 10).map(([exId, pr]) => {
            const exercise = typeof EXERCISES_DB !== 'undefined' ? EXERCISES_DB[exId] : null;
            const name = exercise?.name || exId;
            const shortName = name.length > 22 ? name.substring(0, 20) + '...' : name;
            const e1rm = pr.estimated1RM || 0;
            const bestDetail = pr.e1rmWeight && pr.e1rmReps
                ? `${pr.e1rmWeight}kg x ${pr.e1rmReps}`
                : `${pr.maxWeight}kg x ${pr.maxWeightReps || '?'}`;
            const dateStr = pr.e1rmDate
                ? new Date(pr.e1rmDate).toLocaleDateString()
                : (pr.maxWeightDate ? new Date(pr.maxWeightDate).toLocaleDateString() : '');

            return `
                <div class="pr-item-detail">
                    <div class="pr-item-top">
                        <span class="pr-exercise">${shortName}</span>
                        <span class="pr-e1rm">${e1rm}kg <small>E1RM</small></span>
                    </div>
                    <div class="pr-item-bottom">
                        <span class="pr-best-set">${bestDetail}</span>
                        <span class="pr-date">${dateStr}</span>
                    </div>
                </div>
            `;
        }).join('');
    },

    populateStrengthExerciseSelect() {
        const select = document.getElementById('strength-exercise-select');
        if (!select) return;

        const prs = Storage.getPersonalRecords();
        const exerciseIds = Object.keys(prs);

        select.innerHTML = '<option value="">Seleziona un esercizio...</option>';

        exerciseIds.forEach(exId => {
            const exercise = EXERCISES_DB[exId];
            if (exercise) {
                select.innerHTML += `<option value="${exId}">${exercise.name}</option>`;
            }
        });

        select.addEventListener('change', (e) => {
            this.showStrengthProgress(e.target.value);
        });
    },

    showStrengthProgress(exerciseId) {
        if (!exerciseId) return;

        const history = Storage.getExerciseHistory(exerciseId);
        const ctx = document.getElementById('strength-chart');
        const chartContainer = document.getElementById('strength-chart-container');
        const emptyEl = document.getElementById('strength-empty');

        if (!ctx) return;

        if (this.charts.strength) {
            this.charts.strength.destroy();
        }

        if (history.length === 0) {
            if (chartContainer) chartContainer.style.display = 'none';
            if (emptyEl) { emptyEl.style.display = 'block'; emptyEl.textContent = 'Nessun dato per questo esercizio'; }
            return;
        }

        if (chartContainer) chartContainer.style.display = 'block';
        if (emptyEl) emptyEl.style.display = 'none';

        this.charts.strength = new Chart(ctx, {
            type: 'line',
            data: {
                labels: history.map(h => new Date(h.date).toLocaleDateString()),
                datasets: [{
                    label: 'Peso (kg)',
                    data: history.map(h => h.weight),
                    borderColor: 'rgba(67, 97, 238, 1)',
                    backgroundColor: 'rgba(67, 97, 238, 0.2)',
                    fill: true,
                    tension: 0.3
                }, {
                    label: 'E1RM (kg)',
                    data: history.map(h => h.e1rm),
                    borderColor: 'rgba(6, 214, 160, 1)',
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { labels: { color: '#a0a0b0' } } },
                scales: {
                    y: { ticks: { color: '#a0a0b0' }, grid: { color: 'rgba(255,255,255,0.1)' } },
                    x: { ticks: { color: '#a0a0b0' }, grid: { display: false } }
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

        const phase = cycleInfo.currentPhase;
        const isDeload = Storage.isDeloadActive();
        const goalLabels = { strength: 'Forza', hypertrophy: 'Ipertrofia', recomp: 'Ricomposizione', endurance: 'Resistenza', toning: 'Tonificazione' };
        const goal = goalLabels[program.metadata?.goal] || 'Allenamento';
        const cycleNum = program.metadata?.cycleNumber || 1;

        container.innerHTML = `
            <div class="cycle-progress-detail">
                <div class="cycle-detail-row">
                    <span class="cycle-detail-label">Obiettivo</span>
                    <span class="cycle-detail-value">${goal}</span>
                </div>
                <div class="cycle-detail-row">
                    <span class="cycle-detail-label">Ciclo #</span>
                    <span class="cycle-detail-value">${cycleNum}</span>
                </div>
                <div class="cycle-detail-row">
                    <span class="cycle-detail-label">Settimana</span>
                    <span class="cycle-detail-value">${cycleInfo.currentWeek} / ${cycleInfo.duration}</span>
                </div>
                <div class="cycle-detail-row">
                    <span class="cycle-detail-label">Fase</span>
                    <span class="cycle-detail-value phase-badge ${isDeload ? 'deload' : phase.phase}">${isDeload ? 'Deload' : phase.phaseName}</span>
                </div>
                <div class="cycle-detail-row">
                    <span class="cycle-detail-label">RIR Target</span>
                    <span class="cycle-detail-value">${isDeload ? '4-5' : `${phase.rirTarget.min}-${phase.rirTarget.max}`}</span>
                </div>
                <div class="cycle-detail-row">
                    <span class="cycle-detail-label">Volume</span>
                    <span class="cycle-detail-value">${isDeload ? '50%' : Math.round((phase.volumeMultiplier || 1) * 100) + '%'}</span>
                </div>
                <div class="cycle-progress-bar-container">
                    <div class="cycle-progress-bar">
                        <div class="cycle-progress-fill" style="width: ${cycleInfo.progress}%"></div>
                    </div>
                    <span class="cycle-progress-text">${cycleInfo.progress > 0 ? cycleInfo.progress + '% completato' : 'Settimana ' + cycleInfo.currentWeek + ' in corso'}</span>
                </div>
            </div>
        `;
    },

    loadMuscleVolumeBars() {
        const container = document.getElementById('muscle-volume-bars');
        if (!container) return;

        // Get this week's workouts
        const workoutsThisWeek = Storage.getWorkoutsThisWeek();
        if (!workoutsThisWeek || workoutsThisWeek.length === 0) {
            container.innerHTML = '<p class="empty-state-mini">Completa allenamenti per vedere il volume per muscolo</p>';
            return;
        }

        // Calculate sets per muscle from this week's workouts
        const muscleVolume = {};
        workoutsThisWeek.forEach(w => {
            (w.exercises || []).forEach(ex => {
                const exercise = typeof EXERCISES_DB !== 'undefined' ? EXERCISES_DB[ex.exerciseId] : null;
                if (!exercise) return;
                const sets = (ex.sets || []).filter(s => s.reps > 0).length || ex.completedSets || 0;
                (exercise.primaryMuscles || []).forEach(m => {
                    muscleVolume[m] = (muscleVolume[m] || 0) + sets;
                });
                (exercise.secondaryMuscles || []).forEach(m => {
                    muscleVolume[m] = (muscleVolume[m] || 0) + Math.ceil(sets * 0.5);
                });
            });
        });

        if (Object.keys(muscleVolume).length === 0) {
            container.innerHTML = '<p class="empty-state-mini">Nessun dato di volume questa settimana</p>';
            return;
        }

        // Optimal range (weekly sets per muscle for hypertrophy: 10-20)
        const minOptimal = 5; // half weekly (showing per-session equivalent)
        const maxOptimal = 10;

        const muscleLabels = {
            petto: 'Petto', schiena: 'Schiena', spalle: 'Spalle', bicipiti: 'Bicipiti',
            tricipiti: 'Tricipiti', quadricipiti: 'Quadricipiti', femorali: 'Femorali',
            glutei: 'Glutei', polpacci: 'Polpacci', addome: 'Addome', trapezio: 'Trapezio'
        };

        // Sort by volume descending
        const sorted = Object.entries(muscleVolume)
            .filter(([m]) => muscleLabels[m])
            .sort((a, b) => b[1] - a[1]);

        const maxSets = Math.max(...sorted.map(([, v]) => v), 20);

        container.innerHTML = sorted.map(([muscle, sets]) => {
            const pct = Math.min(100, (sets / maxSets) * 100);
            const label = muscleLabels[muscle] || muscle;
            const status = sets < minOptimal ? 'low' : sets > maxOptimal ? 'high' : 'optimal';
            return `
                <div class="muscle-volume-row">
                    <span class="muscle-volume-label">${label}</span>
                    <div class="muscle-volume-bar-bg">
                        <div class="muscle-volume-bar-fill muscle-vol-${status}" style="width: ${pct}%"></div>
                    </div>
                    <span class="muscle-volume-value">${sets}</span>
                </div>
            `;
        }).join('');
    },

    loadRirTrend() {
        const ctx = document.getElementById('rir-chart');
        const card = document.getElementById('rir-trend-card');
        const emptyEl = document.getElementById('rir-empty');
        if (!ctx || !card) return;

        const workouts = Storage.getRecentWorkouts(10);
        // Extract average RIR per workout
        const rirData = workouts
            .map(w => {
                const rirs = [];
                (w.exercises || []).forEach(ex => {
                    (ex.sets || []).forEach(s => {
                        if (s.rir !== undefined && s.rir !== null) rirs.push(s.rir);
                    });
                });
                if (rirs.length === 0) return null;
                return {
                    date: new Date(w.date).toLocaleDateString(),
                    avgRir: (rirs.reduce((a, b) => a + b, 0) / rirs.length).toFixed(1)
                };
            })
            .filter(Boolean)
            .reverse();

        if (rirData.length < 2) {
            if (emptyEl) emptyEl.style.display = 'block';
            ctx.style.display = 'none';
            return;
        }

        if (emptyEl) emptyEl.style.display = 'none';
        ctx.style.display = 'block';

        if (this.charts.rir) this.charts.rir.destroy();

        this.charts.rir = new Chart(ctx, {
            type: 'line',
            data: {
                labels: rirData.map(d => d.date),
                datasets: [{
                    label: 'RIR Medio',
                    data: rirData.map(d => parseFloat(d.avgRir)),
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
                    y: { min: 0, max: 5, reverse: true, ticks: { color: '#a0a0b0', stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.1)' } },
                    x: { ticks: { color: '#a0a0b0' }, grid: { display: false } }
                }
            }
        });
    },

    loadCycleHistory() {
        const container = document.getElementById('cycle-history-list');
        if (!container) return;

        const history = Storage.getCycleHistory();
        if (!history || history.length === 0) {
            container.innerHTML = '<p class="empty-state-mini">Nessun ciclo completato</p>';
            return;
        }

        const goalLabels = { strength: 'Forza', hypertrophy: 'Ipertrofia', recomp: 'Ricomposizione', endurance: 'Resistenza' };

        container.innerHTML = history.slice(0, 5).map((c, i) => {
            const goal = goalLabels[c.goal] || c.goal;
            const startDate = c.startDate ? new Date(c.startDate).toLocaleDateString() : '?';
            const endDate = c.completedAt ? new Date(c.completedAt).toLocaleDateString() : '?';
            const stats = c.statistics || {};
            return `
                <div class="cycle-history-item">
                    <div class="cycle-history-header">
                        <strong>Ciclo ${history.length - i}</strong>
                        <span class="cycle-history-dates">${startDate} - ${endDate}</span>
                    </div>
                    <div class="cycle-history-meta">
                        <span>${goal}</span>
                        <span>${c.duration} sett</span>
                        <span>${stats.totalWorkouts || 0} allenamenti</span>
                        <span>${stats.totalVolume ? this.formatNumber(stats.totalVolume) + 'kg' : '-'}</span>
                        ${stats.prsAchieved ? `<span>${stats.prsAchieved} PR</span>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    },

    // ========================================
    // SETTINGS
    // ========================================

    loadSettings() {
        const settings = Storage.getSettings();

        document.getElementById('setting-rest-compound').value = settings.restTimeCompound;
        document.getElementById('setting-rest-isolation').value = settings.restTimeIsolation;
        document.getElementById('setting-rest-sound').value = settings.restSound;
        document.getElementById('setting-vibration').checked = settings.vibration;
        document.getElementById('setting-theme').value = settings.theme;
        document.getElementById('setting-weight-unit').value = settings.weightUnit;

        // Add change listeners to auto-save
        ['setting-rest-compound', 'setting-rest-isolation', 'setting-rest-sound',
            'setting-vibration', 'setting-weight-unit'].forEach(id => {
                document.getElementById(id)?.addEventListener('change', () => this.saveSettings());
            });

        // Calculate storage usage
        this.updateStorageUsage();
    },

    updateStorageUsage() {
        let totalSize = 0;

        // Calculate size of all localStorage items
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                totalSize += localStorage[key].length * 2; // UTF-16 = 2 bytes per char
            }
        }

        // Convert to KB/MB
        const sizeKB = totalSize / 1024;
        const sizeMB = sizeKB / 1024;

        // localStorage limit is typically 5-10MB, use 5MB as reference
        const maxMB = 5;
        const percentUsed = Math.min((sizeMB / maxMB) * 100, 100);

        // Update UI
        const storageBar = document.getElementById('storage-used-bar');
        const storageText = document.getElementById('storage-text');

        if (storageBar) {
            storageBar.style.width = `${Math.max(percentUsed, 2)}%`;
        }

        if (storageText) {
            if (sizeMB >= 1) {
                storageText.textContent = `${sizeMB.toFixed(2)} MB utilizzati (${percentUsed.toFixed(1)}% di ~5MB)`;
            } else {
                storageText.textContent = `${sizeKB.toFixed(1)} KB utilizzati (${percentUsed.toFixed(1)}% di ~5MB)`;
            }
        }
    },

    saveSettings() {
        const settings = {
            restTimeCompound: parseInt(document.getElementById('setting-rest-compound').value),
            restTimeIsolation: parseInt(document.getElementById('setting-rest-isolation').value),
            restSound: document.getElementById('setting-rest-sound').value,
            vibration: document.getElementById('setting-vibration').checked,
            theme: document.getElementById('setting-theme').value,
            weightUnit: document.getElementById('setting-weight-unit').value
        };

        Storage.saveSettings(settings);
    },

    loadTheme() {
        const settings = Storage.getSettings();
        this.setTheme(settings.theme);
    },

    setTheme(theme) {
        if (theme === 'auto') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        } else {
            document.documentElement.setAttribute('data-theme', theme);
        }

        // Save setting
        const settings = Storage.getSettings();
        settings.theme = theme;
        Storage.saveSettings(settings);
    },

    // ========================================
    // DATA EXPORT/IMPORT
    // ========================================

    exportData() {
        const data = Storage.exportAllData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `gymtracker_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();

        URL.revokeObjectURL(url);
        this.showNotification('Dati esportati!', 'success');
    },

    importData(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const success = Storage.importAllData(e.target.result);
            if (success) {
                this.showNotification('Dati importati con successo!', 'success');
                location.reload();
            } else {
                this.showNotification('Errore durante l\'importazione', 'error');
            }
        };
        reader.readAsText(file);
    },

    // ========================================
    // UTILITIES
    // ========================================

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    },

    formatDate(date) {
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return 'Oggi';
        if (days === 1) return 'Ieri';
        if (days < 7) return `${days} giorni fa`;
        return date.toLocaleDateString();
    },

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">×</button>
        `;

        // Style
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            background: ${type === 'success' ? 'var(--success)' : type === 'warning' ? 'var(--warning)' : type === 'error' ? 'var(--danger)' : 'var(--accent-primary)'};
            color: ${type === 'warning' ? '#000' : '#fff'};
            display: flex;
            align-items: center;
            gap: 10px;
            z-index: 9999;
            animation: slideIn 0.3s ease;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        `;

        document.body.appendChild(notification);

        // Auto remove after 4 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    },

    // ========================================
    // CONDITIONING (HIIT/LISS)
    // ========================================

    updateConditioningCard() {
        const card = document.getElementById('conditioning-card');
        const titleEl = document.getElementById('conditioning-title');
        const subtitleEl = document.getElementById('conditioning-subtitle');
        if (!card) return;

        const profile = Storage.getProfile();
        const program = Storage.getActiveProgram();

        // Hide if no program or goal is strength (no cardio needed)
        if (!program || profile.goal === 'strength') {
            card.style.display = 'none';
            return;
        }

        // Show card
        card.style.display = 'flex';

        // Get conditioning suggestion
        const programDays = program.schedule?.map(d => d.dayOfWeek) || [];
        const suggestion = TrainingAlgorithm.generateConditioningSuggestions(
            profile.goal,
            profile.level || 'intermediate',
            profile.daysPerWeek || 4,
            programDays
        );

        // Get weekly stats
        const weekStats = Storage.getConditioningThisWeek();
        const config = this.getConditioningConfig(profile.goal);
        const target = config?.frequency || 1;

        // Update title based on suggestion
        if (suggestion && suggestion.recommended) {
            const typeIcon = suggestion.type === 'hiit' ? '🔥' : '🚶';
            titleEl.textContent = `${typeIcon} ${suggestion.type === 'hiit' ? 'HIIT' : 'LISS'} consigliato`;
        } else {
            titleEl.textContent = '✅ Cardio completato';
        }

        // Update subtitle with weekly count
        subtitleEl.textContent = `${weekStats.length}/${target} questa settimana`;
    },

    getConditioningConfig(goal) {
        const configs = {
            strength: { frequency: 0 },
            hypertrophy: { frequency: 1 },
            recomp: { frequency: 2 },
            endurance: { frequency: 3 }
        };
        return configs[goal] || { frequency: 1 };
    },

    openConditioningModal() {
        const modal = document.getElementById('conditioning-modal');
        if (!modal) return;

        // Reset state
        this.conditioningState = {
            type: null,
            protocol: 'circuit30',
            lissActivity: null,
            duration: 20,
            exercises: [],
            step: '1',
            startTime: null,
            timerInterval: null,
            elapsedSeconds: 0
        };

        // Update week status
        const weekStats = Storage.getConditioningThisWeek();
        const profile = Storage.getProfile();
        const config = this.getConditioningConfig(profile.goal);
        const statusEl = document.getElementById('conditioning-week-status');
        if (statusEl) {
            statusEl.textContent = `${weekStats.length}/${config.frequency} sessioni questa settimana`;
        }

        // Show step 1
        this.showConditioningStep('1');

        modal.classList.add('active');
    },

    closeConditioningModal() {
        const modal = document.getElementById('conditioning-modal');
        if (modal) {
            modal.classList.remove('active');
        }

        // Clear any running timer
        if (this.conditioningState.timerInterval) {
            clearInterval(this.conditioningState.timerInterval);
        }
    },

    showConditioningStep(stepId) {
        // Hide all steps
        document.querySelectorAll('.conditioning-step').forEach(s => s.style.display = 'none');

        // Show requested step
        const step = document.getElementById(`conditioning-step-${stepId}`);
        if (step) {
            step.style.display = 'block';
        }
        this.conditioningState.step = stepId;
    },

    populateHIITExercises() {
        const container = document.getElementById('hiit-exercises-list');
        if (!container || typeof HIIT_EXERCISES === 'undefined') return;

        // Convert object to array with IDs
        const exercisesArray = Object.entries(HIIT_EXERCISES).map(([id, exercise]) => ({
            id,
            ...exercise
        }));

        // Filter by user level and no equipment (for now)
        const profile = Storage.getProfile();
        const userLevel = profile.level || 'intermediate';
        const levelOrder = { beginner: 1, intermediate: 2, advanced: 3, expert: 3 };
        const userLevelNum = levelOrder[userLevel] || 2;

        const filteredExercises = exercisesArray.filter(ex => {
            const exLevelNum = levelOrder[ex.difficulty] || 2;
            // Show exercises at or below user level, and only bodyweight for now
            return exLevelNum <= userLevelNum && ex.equipment.length === 0;
        });

        container.innerHTML = filteredExercises.map(exercise => `
            <div class="conditioning-exercise-card" data-exercise-id="${exercise.id}">
                <img class="exercise-gif-thumb"
                     src="${exercise.gifUrl || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect fill=%22%232a2a3e%22 width=%22100%22 height=%22100%22/%3E%3Ctext x=%2250%22 y=%2255%22 text-anchor=%22middle%22 fill=%22%236b7280%22 font-size=%2230%22%3E🏃%3C/text%3E%3C/svg%3E'}"
                     alt="${exercise.name}"
                     onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect fill=%22%232a2a3e%22 width=%22100%22 height=%22100%22/%3E%3Ctext x=%2250%22 y=%2255%22 text-anchor=%22middle%22 fill=%22%236b7280%22 font-size=%2230%22%3E🏃%3C/text%3E%3C/svg%3E'">
                <div class="exercise-info">
                    <div class="exercise-name">${exercise.name}</div>
                    <div class="exercise-category">${this.formatDifficulty(exercise.difficulty)}</div>
                </div>
                <div class="exercise-check">✓</div>
            </div>
        `).join('');

        // Add click handlers
        container.querySelectorAll('.conditioning-exercise-card').forEach(card => {
            card.addEventListener('click', () => {
                card.classList.toggle('selected');
                const exerciseId = card.dataset.exerciseId;

                if (card.classList.contains('selected')) {
                    this.conditioningState.exercises.push(exerciseId);
                } else {
                    this.conditioningState.exercises = this.conditioningState.exercises.filter(id => id !== exerciseId);
                }
            });
        });
    },

    formatDifficulty(difficulty) {
        const names = {
            'beginner': 'Facile',
            'intermediate': 'Medio',
            'advanced': 'Avanzato'
        };
        return names[difficulty] || difficulty;
    },

    populateLISSActivities() {
        const container = document.getElementById('liss-activities-list');
        if (!container || typeof LISS_ACTIVITIES === 'undefined') return;

        const activitiesArray = Object.entries(LISS_ACTIVITIES).map(([id, activity]) => ({
            id,
            ...activity
        }));

        const icons = {
            'walking-incline': '🚶',
            'cycling-steady': '🚴',
            'elliptical': '🏃',
            'rowing-steady': '🚣',
            'swimming': '🏊',
            'outdoor-walk': '🌳',
            'stair-climber': '📶'
        };

        container.innerHTML = activitiesArray.map(activity => `
            <div class="liss-activity-card" data-activity="${activity.id}">
                <span class="activity-icon">${icons[activity.id] || '🏃'}</span>
                <span class="activity-name">${activity.name}</span>
            </div>
        `).join('');

        // Add click handlers
        container.querySelectorAll('.liss-activity-card').forEach(card => {
            card.addEventListener('click', () => {
                container.querySelectorAll('.liss-activity-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.conditioningState.lissActivity = card.dataset.activity;
            });
        });
    },

    startConditioningSession() {
        this.conditioningState.startTime = new Date();
        this.conditioningState.elapsedSeconds = 0;

        // Update UI for active session
        this.showConditioningStep('active');
        this.updateConditioningActiveInfo();

        // Start timer
        this.conditioningState.timerInterval = setInterval(() => {
            this.conditioningState.elapsedSeconds++;
            this.updateConditioningTimer();
        }, 1000);
    },

    updateConditioningActiveInfo() {
        const infoContainer = document.getElementById('conditioning-active-info');
        const titleEl = document.getElementById('active-session-title');
        if (!infoContainer) return;

        if (this.conditioningState.type === 'hiit') {
            if (titleEl) titleEl.textContent = `🔥 HIIT - ${this.getProtocolName(this.conditioningState.protocol)}`;

            // Show selected exercises
            if (this.conditioningState.exercises.length > 0 && typeof HIIT_EXERCISES !== 'undefined') {
                const firstExerciseId = this.conditioningState.exercises[0];
                const firstExercise = HIIT_EXERCISES[firstExerciseId];

                if (firstExercise) {
                    infoContainer.innerHTML = `
                        <div class="selected-exercises-list">
                            ${this.conditioningState.exercises.map(id => {
                                const ex = HIIT_EXERCISES[id];
                                return ex ? `<span class="selected-exercise-tag">${ex.name}</span>` : '';
                            }).join('')}
                        </div>
                        ${firstExercise.gifUrl ? `<img class="conditioning-exercise-gif" src="${firstExercise.gifUrl}" alt="${firstExercise.name}" onerror="this.style.display='none'">` : ''}
                        <p class="conditioning-description">${firstExercise.description}</p>
                    `;
                }
            }
        } else {
            const activity = typeof LISS_ACTIVITIES !== 'undefined' ? LISS_ACTIVITIES[this.conditioningState.lissActivity] : null;
            if (titleEl) titleEl.textContent = `🚶 LISS - ${activity?.name || 'Cardio'}`;
            infoContainer.innerHTML = `
                <div class="liss-activity-display">
                    <span class="activity-icon-large">${this.getLissIcon(this.conditioningState.lissActivity)}</span>
                    <span class="activity-name-large">${activity?.name || 'Cardio leggero'}</span>
                </div>
                <p class="conditioning-description">${activity?.description || 'Mantieni un ritmo costante e moderato'}</p>
            `;
        }
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

    getProtocolName(protocolId) {
        const names = {
            tabata: 'Tabata',
            circuit30: 'Circuit 30/30',
            circuit4020: 'Circuit 40/20',
            beginner: 'Beginner'
        };
        return names[protocolId] || protocolId;
    },

    updateConditioningTimer() {
        const timerDisplay = document.getElementById('conditioning-timer');
        if (!timerDisplay) return;

        const minutes = Math.floor(this.conditioningState.elapsedSeconds / 60);
        const seconds = this.conditioningState.elapsedSeconds % 60;
        timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    },

    finishConditioningSession() {
        // Stop timer
        if (this.conditioningState.timerInterval) {
            clearInterval(this.conditioningState.timerInterval);
        }

        // Calculate duration and calories
        const durationMinutes = Math.round(this.conditioningState.elapsedSeconds / 60) || 1;
        const calories = this.calculateConditioningCalories(durationMinutes);

        // Update summary
        const durationEl = document.getElementById('summary-duration');
        const caloriesEl = document.getElementById('summary-calories');
        if (durationEl) durationEl.textContent = `${durationMinutes} min`;
        if (caloriesEl) caloriesEl.textContent = calories;

        // Store for saving
        this.conditioningState.finalCalories = calories;
        this.conditioningState.finalDuration = durationMinutes;

        // Show complete step
        this.showConditioningStep('complete');
    },

    calculateConditioningCalories(durationMinutes) {
        const profile = Storage.getProfile();
        const weight = profile.weight || 70;

        let met = 6;
        if (this.conditioningState.type === 'hiit') {
            if (this.conditioningState.exercises.length > 0 && typeof HIIT_EXERCISES !== 'undefined') {
                const totalMet = this.conditioningState.exercises.reduce((sum, id) => {
                    const ex = HIIT_EXERCISES[id];
                    return sum + (ex?.metValue || 8);
                }, 0);
                met = totalMet / this.conditioningState.exercises.length;
            } else {
                met = 10;
            }
        } else {
            const activity = typeof LISS_ACTIVITIES !== 'undefined' ? LISS_ACTIVITIES[this.conditioningState.lissActivity] : null;
            met = activity?.metValue || 4;
        }

        return Math.round((met * 3.5 * weight) / 200 * durationMinutes);
    },

    saveConditioningSession() {
        const session = {
            type: this.conditioningState.type,
            protocol: this.conditioningState.protocol,
            activity: this.conditioningState.lissActivity,
            exercises: this.conditioningState.exercises,
            duration: this.conditioningState.finalDuration || Math.round(this.conditioningState.elapsedSeconds / 60),
            calories: this.conditioningState.finalCalories || 0,
            date: new Date().toISOString()
        };

        Storage.saveConditioningSession(session);

        this.showNotification('Sessione salvata!', 'success');
        this.closeConditioningModal();
        this.updateConditioningCard();
        this.loadDashboard();
    }
};

// Add CSS for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    .notification button {
        background: none;
        border: none;
        color: inherit;
        font-size: 1.2rem;
        cursor: pointer;
        padding: 0 5px;
    }

    /* Additional styles for body stats */
    .body-stat {
        display: flex;
        justify-content: space-between;
        padding: 10px 0;
        border-bottom: 1px solid var(--border-color);
    }
    .body-stat:last-child {
        border-bottom: none;
    }
    .body-stat .label {
        color: var(--text-secondary);
    }
    .body-stat .value {
        font-weight: 600;
    }

    /* Next workout styles */
    .next-workout-info h4 {
        font-size: 1.3rem;
        margin-bottom: 5px;
    }
    .next-workout-info .focus {
        color: var(--text-secondary);
        margin-bottom: 10px;
    }
    .next-workout-info .meta {
        font-size: 0.9rem;
        color: var(--text-muted);
        margin-bottom: 15px;
    }
    .exercise-preview {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
    }
    .exercise-tag {
        padding: 4px 10px;
        background: var(--bg-hover);
        border-radius: 12px;
        font-size: 0.8rem;
    }

    /* Program info */
    .program-info {
        margin-bottom: 20px;
    }
    .program-info p {
        margin: 5px 0;
    }
    .day-focus {
        color: var(--text-secondary);
        font-size: 0.9rem;
        margin-bottom: 10px;
    }

    /* Volume summary */
    .volume-summary {
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid var(--border-color);
    }
    .volume-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
        gap: 10px;
        margin-top: 10px;
    }
    .volume-item {
        background: var(--bg-hover);
        padding: 10px;
        border-radius: var(--radius-sm);
        text-align: center;
    }
    .volume-item span {
        display: block;
        font-size: 0.8rem;
        color: var(--text-secondary);
    }
    .volume-item strong {
        font-size: 1.2rem;
    }

    /* Saved programs */
    .saved-program-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px;
        background: var(--bg-hover);
        border-radius: var(--radius-sm);
        margin-bottom: 10px;
    }
    .program-actions {
        display: flex;
        gap: 10px;
    }

    /* Workout history */
    .workout-history-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px;
        background: var(--bg-hover);
        border-radius: var(--radius-sm);
        margin-bottom: 10px;
        gap: 10px;
    }
    .workout-main-info {
        flex: 1;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 10px;
    }
    .workout-stats {
        display: flex;
        gap: 15px;
        font-size: 0.9rem;
        color: var(--text-secondary);
    }
    .delete-workout-btn {
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 8px;
        border-radius: var(--radius-sm);
        transition: all 0.2s;
        opacity: 0.6;
    }
    .delete-workout-btn:hover {
        background: rgba(239, 68, 68, 0.2);
        opacity: 1;
    }
    .delete-workout-btn .delete-icon {
        font-size: 1.1rem;
    }

    /* Measurements table */
    .measurements-table {
        width: 100%;
        border-collapse: collapse;
    }
    .measurements-table th,
    .measurements-table td {
        padding: 10px;
        text-align: left;
        border-bottom: 1px solid var(--border-color);
    }
    .measurements-table th {
        color: var(--text-secondary);
        font-weight: 500;
    }

    /* Exercise detail */
    .exercise-detail {
        margin-top: 20px;
    }
    .detail-section {
        margin-bottom: 20px;
    }
    .detail-section h4 {
        color: var(--accent-primary);
        margin-bottom: 10px;
    }
    .detail-section ul {
        padding-left: 20px;
    }
    .detail-section li {
        margin-bottom: 5px;
    }

    /* Exercise target */
    .exercise-target {
        display: flex;
        justify-content: space-between;
        padding: 15px;
        background: var(--bg-hover);
        border-radius: var(--radius-sm);
        margin-bottom: 15px;
    }

    /* E1RM info */
    .e1rm-info {
        padding: 15px;
        background: var(--bg-hover);
        border-radius: var(--radius-sm);
    }
    .e1rm-info p {
        margin: 5px 0;
    }

    /* Set row completed */
    .set-row.completed {
        opacity: 0.7;
    }
    .set-row.completed input {
        background: var(--success);
        color: white;
    }
`;
document.head.appendChild(style);

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
