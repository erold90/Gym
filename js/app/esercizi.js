/**
 * GymTracker 2.0 — area ESERCIZI: libreria (sottopagina), scheda dell'esercizio, "come si fa".
 */

Object.assign(App, {
    // ========================================
    // GUSCIO DELL'AREA: markup della pagina e dei fogli, listener
    // ========================================

    // Sottopagina #esercizi: topbar con Indietro (data-back torna da dove si è venuti, o a Scheda)
    htmlEsercizi() {
        const cat = (value, label, on = false) => `<button type="button" class="filter-tab chip${on ? ' active' : ''}" data-category="${value}" aria-pressed="${on}">${label}</button>`;
        const muscles = [['all', 'Tutti i muscoli'], ['petto', 'Petto'], ['schiena', 'Schiena'], ['spalle', 'Spalle'], ['bicipiti', 'Bicipiti'],
            ['tricipiti', 'Tricipiti'], ['quadricipiti', 'Quadricipiti'], ['femorali', 'Femorali'], ['glutei', 'Glutei'],
            ['polpacci', 'Polpacci'], ['addome', 'Addome'], ['avambracci', 'Avambracci'], ['trapezio', 'Trapezio']];
        return `
            <header class="topbar">
                <button type="button" class="btn btn--ghost btn--icon" data-back aria-label="Indietro">${this.ico('back')}</button>
                <div class="topbar__title"><h1>Esercizi</h1></div>
                <span class="topbar__spacer" aria-hidden="true"></span>
            </header>

            <div class="search">
                ${this.ico('search')}
                <label class="sr-only" for="exercise-search">Cerca un esercizio</label>
                <input class="input" type="search" id="exercise-search" placeholder="Cerca: squat, panca, glutei…" autocomplete="off">
            </div>

            <div class="exercise-type-tabs seg seg--fit" role="group" aria-label="Tipo">
                <button type="button" class="type-tab active" data-type="workout" aria-pressed="true">Esercizi</button>
                <button type="button" class="type-tab" data-type="warmup" aria-pressed="false">Riscaldamento</button>
                <button type="button" class="type-tab" data-type="cooldown" aria-pressed="false">Defaticamento</button>
            </div>

            <div class="filter-tabs chips chips--scroll" id="workout-filters" role="group" aria-label="Attrezzatura">
                ${cat('all', 'Tutti', true)}${cat('macchine', 'Macchine')}${cat('bilanciere', 'Bilanciere')}${cat('manubri', 'Manubri')}${cat('cavi', 'Cavi')}${cat('corpo-libero', 'Corpo libero')}${cat('accessori', 'Accessori')}
            </div>

            <div class="muscle-filter field">
                <select class="input" id="muscle-filter" aria-label="Muscolo">
                    ${muscles.map(([v, t]) => `<option value="${v}">${t}</option>`).join('')}
                </select>
            </div>

            <div class="exercises-grid lib" id="exercises-grid"></div>
        `;
    },

    // Fogli dell'area: scheda dell'esercizio e "come si fa" (GIF + istruzioni)
    sheetsEsercizi() {
        const part = (id, title, body) => `
            <section class="exercise-info-section section"${id ? ` id="${id}"` : ''}>
                <h3 class="section__head cap">${title}</h3>
                ${body}
            </section>`;
        return `
            <div class="modal" id="exercise-modal">
                <section class="sheet" role="dialog" aria-modal="true" aria-label="Esercizio">
                    <span class="sheet__grip" aria-hidden="true"></span>
                    <div class="sheet__head">
                        <span class="sr-only">Esercizio</span>
                        <span style="flex: 1"></span>
                        <button type="button" class="btn btn--ghost btn--icon sheet__close" id="close-exercise-modal" aria-label="Chiudi la scheda dell'esercizio">${this.ico('close')}</button>
                    </div>
                    <div id="exercise-modal-content"></div>
                </section>
            </div>

            <div class="modal" id="exercise-info-modal">
                <section class="sheet sheet--tall exercise-info-modal-content" role="dialog" aria-modal="true" aria-labelledby="exercise-info-title">
                    <span class="sheet__grip" aria-hidden="true"></span>
                    <div class="sheet__head exercise-info-header">
                        <h2 id="exercise-info-title">Esercizio</h2>
                        <button type="button" class="btn btn--ghost btn--icon sheet__close" id="close-exercise-info-modal" aria-label="Chiudi come si fa">${this.ico('close')}</button>
                    </div>
                    <div class="exercise-info-media media-full">
                        <div class="exercise-gif-container" id="exercise-gif-container"></div>
                    </div>
                    <div class="exercise-info-details">
                        ${part('', 'Esecuzione', '<ol class="execution-steps steps-list" id="execution-steps"></ol>')}
                        ${part('', 'Consigli', '<ul class="execution-tips" id="execution-tips"></ul>')}
                        ${part('common-mistakes-section', 'Errori comuni', '<ul class="common-mistakes errs" id="common-mistakes"></ul>')}
                        ${part('breathing-section', 'Respirazione', '<p class="breathing-info" id="breathing-info"></p>')}
                        ${part('muscles-section', 'Muscoli', '<div class="muscles-info" id="muscles-info"></div>')}
                    </div>
                </section>
            </div>
        `;
    },

    bindEsercizi() {
        const on = (id, ev, fn) => this._on(id, ev, fn);
        const closeOnBackdrop = (id, fn) => this._closeOnBackdrop(id, fn);

        // Pagina Esercizi: tab Workout/Warmup/Cooldown, ricerca e filtri combinati
        document.querySelectorAll('.type-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.type-tab').forEach(t => {
                    t.classList.remove('active');
                    t.setAttribute('aria-pressed', 'false');
                });
                tab.classList.add('active');
                tab.setAttribute('aria-pressed', 'true');
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
                document.querySelectorAll('.filter-tab').forEach(t => {
                    t.classList.remove('active');
                    t.setAttribute('aria-pressed', 'false');
                });
                tab.classList.add('active');
                tab.setAttribute('aria-pressed', 'true');
                this._exFilters.category = tab.dataset.category || 'all';
                this._applyExerciseFilters();
            });
        });
        on('muscle-filter', 'change', (e) => {
            this._exFilters.muscle = e.target.value || 'all';
            this._applyExerciseFilters();
        });

        // Modali esercizio
        on('close-exercise-modal', 'click', () => this._closeModal('exercise-modal'));
        closeOnBackdrop('exercise-modal', () => this._closeModal('exercise-modal'));
        on('close-exercise-info-modal', 'click', () => this._closeModal('exercise-info-modal'));
        closeOnBackdrop('exercise-info-modal', () => this._closeModal('exercise-info-modal'));
    },

    // Filtri della pagina Esercizi: ricerca, categoria e muscolo si combinano
    _exFilters: { query: '', category: 'all', muscle: 'all' },
    _exerciseTypeTab: 'workout',

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
                <button type="button" class="btn btn--ghost btn--icon exercise-info-btn" data-exercise-id="${GT.esc(ex.id)}" data-exercise-name="${GT.esc(ex.name)}" aria-label="Come si esegue: ${GT.esc(ex.name)}">
                    ${this.ico('info')}
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
                ${ex.hasDetails ? `<button type="button" class="btn btn--ghost btn--icon exercise-info-btn" data-exercise-name="${GT.esc(ex.name)}" data-type="${GT.esc(type)}" aria-label="Come si esegue: ${GT.esc(ex.name)}">${this.ico('info')}</button>` : ''}
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
                <div class="gif-error-icon">${this.ico('barbell', 'ico--xl')}</div>
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
});
