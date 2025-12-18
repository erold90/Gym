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
                this.initCharts();
            }
        }
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

        // Start workout buttons
        document.getElementById('start-scheduled-workout')?.addEventListener('click', () => {
            this.startScheduledWorkout();
        });

        document.getElementById('start-free-workout')?.addEventListener('click', () => {
            this.startFreeWorkout();
        });

        document.getElementById('start-workout-btn')?.addEventListener('click', () => {
            this.startScheduledWorkout();
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
            this.finishWorkout();
        });

        document.getElementById('complete-cooldown')?.addEventListener('click', () => {
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

        // Progress tabs
        document.querySelectorAll('.progress-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.progress-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                document.querySelectorAll('.progress-content').forEach(c => c.classList.remove('active'));
                const content = document.getElementById(`progress-${tab.dataset.tab}`);
                if (content) content.classList.add('active');
            });
        });

        // Body measurement form
        document.getElementById('body-measurement-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveMeasurement();
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
    },

    // ========================================
    // DASHBOARD
    // ========================================

    loadDashboard() {
        this.updateGreeting();
        this.updateStats();
        this.updateWeekDays();
        this.updateNextWorkout();
        this.updateRecentActivity();
        this.updateBodyStats();
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

    updateNextWorkout() {
        const program = Storage.getActiveProgram();
        const container = document.getElementById('next-workout-content');
        const startBtn = document.getElementById('start-workout-btn');

        if (!program) {
            container.innerHTML = '<p class="empty-state">Nessuna scheda attiva. Vai su "Schede" per generarne una!</p>';
            startBtn.style.display = 'none';
            return;
        }

        const nextWorkout = TrainingAlgorithm.getTodaysWorkout(program);
        if (!nextWorkout) {
            container.innerHTML = '<p class="empty-state">Riposo oggi! Recupera per il prossimo allenamento.</p>';
            startBtn.style.display = 'none';
            return;
        }

        const duration = TrainingAlgorithm.estimateWorkoutDuration(nextWorkout);

        container.innerHTML = `
            <div class="next-workout-info">
                <h4>${nextWorkout.type}</h4>
                <p class="focus">${nextWorkout.focus}</p>
                <p class="meta">${nextWorkout.exercises.length} esercizi • ~${duration} minuti</p>
                <div class="exercise-preview">
                    ${nextWorkout.exercises.slice(0, 4).map(ex =>
            `<span class="exercise-tag">${ex.name}</span>`
        ).join('')}
                    ${nextWorkout.exercises.length > 4 ? `<span class="exercise-tag">+${nextWorkout.exercises.length - 4} altri</span>` : ''}
                </div>
            </div>
        `;

        startBtn.style.display = 'block';
    },

    updateRecentActivity() {
        const recentWorkouts = Storage.getRecentWorkouts(5);
        const container = document.getElementById('activity-list');

        if (recentWorkouts.length === 0) {
            container.innerHTML = '<li class="empty-state">Nessuna attività recente</li>';
            return;
        }

        container.innerHTML = recentWorkouts.map(workout => {
            const date = new Date(workout.date);
            const dateStr = this.formatDate(date);
            const duration = Math.round(workout.duration / 60);

            return `
                <li>
                    <span class="activity-info">
                        <strong>${workout.name || 'Allenamento'}</strong>
                        <small>${dateStr}</small>
                    </span>
                    <span class="activity-duration">${duration} min</span>
                </li>
            `;
        }).join('');
    },

    updateBodyStats() {
        const profile = Storage.getProfile();
        const container = document.getElementById('body-stats-content');

        if (!profile.weight) {
            container.innerHTML = '<p class="empty-state">Configura il tuo profilo per vedere le statistiche</p>';
            return;
        }

        const bmi = (profile.weight / Math.pow(profile.height / 100, 2)).toFixed(1);
        const leanMass = profile.bodyFat ? Math.round(profile.weight * (1 - profile.bodyFat / 100)) : null;
        const fatMass = profile.bodyFat ? Math.round(profile.weight * profile.bodyFat / 100) : null;

        container.innerHTML = `
            <div class="body-stat">
                <span class="label">Peso</span>
                <span class="value">${profile.weight} kg</span>
            </div>
            <div class="body-stat">
                <span class="label">BMI</span>
                <span class="value">${bmi}</span>
            </div>
            ${profile.bodyFat ? `
                <div class="body-stat">
                    <span class="label">% Grasso</span>
                    <span class="value">${profile.bodyFat}%</span>
                </div>
                <div class="body-stat">
                    <span class="label">Massa Magra</span>
                    <span class="value">${leanMass} kg</span>
                </div>
                <div class="body-stat">
                    <span class="label">Massa Grassa</span>
                    <span class="value">${fatMass} kg</span>
                </div>
            ` : ''}
        `;
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

    generateProgram() {
        const profile = Storage.getProfile();

        if (!profile.name) {
            this.showNotification('Configura prima il tuo profilo!', 'warning');
            this.showPage('profile');
            return;
        }

        const options = {
            goal: document.getElementById('program-goal').value,
            daysPerWeek: parseInt(document.getElementById('program-days').value),
            split: document.getElementById('program-split').value,
            sessionDuration: parseInt(document.getElementById('program-duration').value)
        };

        const program = TrainingAlgorithm.generateProgram(profile, options);

        // Save as active program
        Storage.setActiveProgram(program);
        Storage.saveProgram(program);

        this.loadPrograms();
        this.loadDashboard();
        this.showNotification('Scheda generata con successo!', 'success');
    },

    loadPrograms() {
        this.displayActiveProgram();
        this.displaySavedPrograms();
    },

    displayActiveProgram() {
        const program = Storage.getActiveProgram();
        const card = document.getElementById('active-program-card');
        const content = document.getElementById('active-program-content');

        if (!program) {
            card.style.display = 'none';
            return;
        }

        card.style.display = 'block';

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
                                    <span class="exercise-details">${ex.sets} x ${ex.reps}</span>
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

    displaySavedPrograms() {
        const programs = Storage.getPrograms();
        const container = document.getElementById('saved-programs-list');

        if (programs.length === 0) {
            container.innerHTML = '<p class="empty-state">Nessuna scheda salvata</p>';
            return;
        }

        container.innerHTML = programs.map(p => `
            <div class="saved-program-item">
                <div class="program-info">
                    <strong>${p.name}</strong>
                    <small>${new Date(p.createdAt).toLocaleDateString()}</small>
                </div>
                <div class="program-actions">
                    <button class="btn btn-sm btn-secondary" onclick="App.loadSavedProgram(${p.id})">Attiva</button>
                    <button class="btn btn-sm btn-danger" onclick="App.deleteSavedProgram(${p.id})">🗑️</button>
                </div>
            </div>
        `).join('');
    },

    loadSavedProgram(id) {
        const programs = Storage.getPrograms();
        const program = programs.find(p => p.id === id);
        if (program) {
            Storage.setActiveProgram(program);
            this.loadPrograms();
            this.loadDashboard();
            this.showNotification('Scheda attivata!', 'success');
        }
    },

    deleteSavedProgram(id) {
        if (confirm('Eliminare questa scheda?')) {
            Storage.deleteProgram(id);
            this.loadPrograms();
        }
    },

    deleteActiveProgram() {
        if (confirm('Eliminare la scheda attiva?')) {
            Storage.clearActiveProgram();
            this.loadPrograms();
            this.loadDashboard();
            this.showNotification('Scheda eliminata', 'info');
        }
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
        // TODO: Implement free workout mode
        this.showNotification('Modalità allenamento libero in arrivo!', 'info');
    },

    startWorkout(workout) {
        this.activeWorkout = {
            ...workout,
            startTime: Date.now(),
            exercises: workout.exercises.map(ex => ({
                ...ex,
                targetSets: ex.sets,  // Save original set count
                targetReps: ex.reps,  // Save original rep range
                setsData: Array(ex.sets).fill(null).map(() => ({
                    weight: '',
                    reps: '',
                    completed: false
                }))
            }))
        };
        this.currentExerciseIndex = 0;
        this.currentSetIndex = 0;

        // Show workout UI
        document.getElementById('workout-not-started').style.display = 'none';
        document.getElementById('workout-active').style.display = 'block';

        // Start workout timer
        Timer.startWorkoutTimer((time) => {
            document.getElementById('workout-timer').textContent = time;
        });

        // Display warmup
        this.displayWarmup(workout.warmup);

        // Display first exercise
        this.displayCurrentExercise();

        // Navigate to workout page
        this.showPage('workout');
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

        // Get last performance and PR data
        const lastPerformance = Storage.getLastPerformance(exercise.exerciseId);
        const pr = Storage.getExercisePR(exercise.exerciseId);
        const profile = Storage.getProfile();
        const bodyWeight = profile.weight || 0;

        // Get tempo from active program
        const activeProgram = Storage.getActiveProgram();
        const tempo = activeProgram?.metadata?.tempo;

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
            ${bodyweightSelector}
            <div class="exercise-info-bar">
                ${lastPerfHTML}
                ${prHTML}
            </div>
            <div class="exercise-target-mobile">
                <div class="target-item">
                    <span class="target-label">Serie</span>
                    <span class="target-value">${exercise.targetSets}</span>
                </div>
                <div class="target-item">
                    <span class="target-label">Reps</span>
                    <span class="target-value">${exercise.targetReps}</span>
                </div>
                <div class="target-item">
                    <span class="target-label">Pausa</span>
                    <span class="target-value">${exercise.rest}s</span>
                </div>
                ${tempo ? `
                <div class="target-item tempo-item" title="${tempo.detail}">
                    <span class="target-label">Tempo</span>
                    <span class="target-value tempo-value">${tempo.notation}</span>
                </div>
                ` : ''}
            </div>
            <div class="sets-progress-bar">
                <div class="sets-progress-fill" style="width: ${(completedSets / exercise.targetSets) * 100}%"></div>
                <span class="sets-progress-text">${completedSets}/${exercise.targetSets} completate</span>
            </div>
            <div class="sets-container-mobile">
                ${exercise.setsData.map((set, idx) => `
                    <div class="set-row-mobile ${set.completed ? 'completed' : ''} ${set.isNewPR ? 'new-pr' : ''}" data-set="${idx}">
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

        // Start rest timer if completed
        if (set.completed) {
            const restTime = exercise.rest || 60;
            this.showRestTimer(restTime);
        }
    },

    showRestTimer(seconds) {
        const modal = document.getElementById('rest-timer-modal');
        const display = document.getElementById('rest-timer-display');
        const bar = document.getElementById('rest-timer-bar');

        modal.style.display = 'flex';

        Timer.startRestTimer(
            seconds,
            (remaining, total) => {
                display.textContent = remaining;
                const percent = (remaining / total) * 100;
                bar.style.width = `${percent}%`;
            },
            () => {
                modal.style.display = 'none';
            }
        );
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
        document.getElementById('rest-timer-modal').style.display = 'none';

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

            Storage.saveWorkout(workoutData);
        }

        // Reset state
        this.activeWorkout = null;
        this.currentExerciseIndex = 0;

        // Update UI
        document.getElementById('workout-not-started').style.display = 'block';
        document.getElementById('workout-active').style.display = 'none';
        document.getElementById('rest-timer-modal').style.display = 'none';
        document.getElementById('cooldown-modal').style.display = 'none';

        // Update dashboard
        this.loadDashboard();

        this.showNotification(`Allenamento completato! Volume: ${this.formatNumber(totalVolume)} kg`, 'success');
        this.showPage('dashboard');
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
        this.loadMeasurementsHistory();
        this.loadWorkoutHistory();
        this.loadPersonalRecords();
        this.populateStrengthExerciseSelect();
    },

    initCharts() {
        this.initVolumeChart();
        this.initFrequencyChart();
        this.initWeightChart();
    },

    initVolumeChart() {
        const ctx = document.getElementById('volume-chart');
        if (!ctx) return;

        // Get last 8 weeks of data
        const weeks = this.getWeeklyVolumes(8);

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
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
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

    initFrequencyChart() {
        const ctx = document.getElementById('frequency-chart');
        if (!ctx) return;

        const weeks = this.getWeeklyWorkoutCounts(8);

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
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 7,
                        ticks: { color: '#a0a0b0', stepSize: 1 },
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

    initWeightChart() {
        const ctx = document.getElementById('weight-chart');
        if (!ctx) return;

        const measurements = Storage.getMeasurements().slice(0, 20).reverse();

        if (this.charts.weight) {
            this.charts.weight.destroy();
        }

        if (measurements.length === 0) {
            return;
        }

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
        const workouts = Storage.getRecentWorkouts(20);
        const container = document.getElementById('workout-history-list');

        if (!container) return;

        if (workouts.length === 0) {
            container.innerHTML = '<p class="empty-state">Nessun allenamento registrato</p>';
            return;
        }

        container.innerHTML = workouts.map(w => `
            <div class="workout-history-item" data-workout-id="${w.id}">
                <div class="workout-main-info">
                    <div class="workout-info">
                        <strong>${w.name || 'Allenamento'}</strong>
                        <small>${this.formatDate(new Date(w.date))}</small>
                    </div>
                    <div class="workout-stats">
                        <span>${Math.round(w.duration / 60)} min</span>
                        <span>${this.formatNumber(w.totalVolume)} kg</span>
                        <span>${w.totalSets} set</span>
                    </div>
                </div>
                <button class="delete-workout-btn" onclick="App.deleteWorkoutSession(${w.id}, event)" title="Elimina allenamento">
                    <span class="delete-icon">🗑️</span>
                </button>
            </div>
        `).join('');
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

        const prEntries = Object.entries(prs);

        if (prEntries.length === 0) {
            container.innerHTML = '<p class="empty-state">Completa qualche allenamento per vedere i tuoi PR!</p>';
            return;
        }

        container.innerHTML = prEntries.slice(0, 12).map(([exId, pr]) => {
            const exercise = EXERCISES_DB[exId];
            return `
                <div class="pr-item">
                    <div class="exercise">${exercise?.name || exId}</div>
                    <div class="weight">${pr.maxWeight} kg</div>
                    <div class="reps">x ${pr.maxWeightReps || '-'} reps</div>
                    <div class="e1rm">E1RM: ${pr.estimated1RM} kg</div>
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
        const e1rmContainer = document.getElementById('estimated-1rm');

        if (!ctx) return;

        if (this.charts.strength) {
            this.charts.strength.destroy();
        }

        if (history.length === 0) {
            e1rmContainer.innerHTML = '<p class="empty-state">Nessun dato disponibile</p>';
            return;
        }

        // Show chart
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
                    tension: 0.3,
                    yAxisID: 'y'
                }, {
                    label: 'E1RM (kg)',
                    data: history.map(h => h.e1rm),
                    borderColor: 'rgba(6, 214, 160, 1)',
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0.3,
                    yAxisID: 'y'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
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

        // Show E1RM info
        const prs = Storage.getPersonalRecords();
        const pr = prs[exerciseId];
        if (pr) {
            e1rmContainer.innerHTML = `
                <div class="e1rm-info">
                    <p><strong>Miglior E1RM:</strong> ${pr.estimated1RM} kg</p>
                    <p><strong>Peso Massimo:</strong> ${pr.maxWeight} kg x ${pr.maxWeightReps}</p>
                </div>
            `;
        }
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
