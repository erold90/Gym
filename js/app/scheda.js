/**
 * GymTracker 2.0 — area SCHEDA: scheda attiva, generatore (wizard), editor manuale, anteprima.
 */

Object.assign(App, {
    // ========================================
    // GUSCIO DELL'AREA: markup della pagina e dei fogli, listener, ingresso nella pagina
    // ========================================

    // Pagina #scheda. La lente apre la libreria (#esercizi, sottopagina).
    htmlScheda() {
        return `
            <header class="head">
                <h1>Scheda</h1>
                <div class="head__actions">
                    <a class="btn btn--ghost btn--icon" href="#esercizi" data-page="esercizi" aria-label="Libreria esercizi">${this.ico('search')}</a>
                </div>
            </header>

            <!-- Scheda attiva (visibile quando esiste) -->
            <section class="card active-program" id="active-program-card" style="display: none;" aria-labelledby="active-program-title">
                <div class="program-header section__head">
                    <h2 id="active-program-title">Scheda attiva</h2>
                    <div class="program-header-actions head__actions">
                        <button type="button" class="btn btn--ghost btn--icon" id="edit-program-btn" aria-label="Modifica la scheda">${this.ico('edit')}</button>
                        <button type="button" class="btn btn--ghost btn--icon" id="delete-program-btn" aria-label="Elimina la scheda">${this.ico('trash')}</button>
                    </div>
                </div>
                <div id="active-program-content"></div>
            </section>

            <!-- Nessuna scheda -->
            <div id="no-program-state">
                <div class="choices">
                    <button type="button" class="choice" id="open-ai-generator-btn">
                        <span class="choice__icon">${this.ico('target')}</span>
                        <span class="choice__body"><b>Crea la scheda</b><span>Costruita sul tuo profilo</span></span>
                        <span class="row__end">${this.ico('next')}</span>
                    </button>
                    <button type="button" class="choice" id="open-manual-builder-btn">
                        <span class="choice__icon">${this.ico('edit')}</span>
                        <span class="choice__body"><b>A mano</b><span>Esercizi, serie e recuperi scelti da te</span></span>
                        <span class="row__end">${this.ico('next')}</span>
                    </button>
                </div>
            </div>

            <!-- Avvio (nascosto durante una seduta) -->
            <div id="workout-not-started">
                <section class="section" aria-labelledby="scheda-start-title">
                    <div class="section__head"><h2 id="scheda-start-title">Seduta</h2></div>
                    <div class="group">
                        <button type="button" class="row" id="start-scheduled-workout">
                            <span class="row__icon">${this.ico('play')}</span>
                            <span class="row__body"><span class="row__title">Inizia un giorno</span></span>
                            <span class="row__end">${this.ico('next')}</span>
                        </button>
                        <button type="button" class="row" id="preview-workout-btn">
                            <span class="row__icon">${this.ico('plan')}</span>
                            <span class="row__body"><span class="row__title">Anteprima</span></span>
                            <span class="row__end">${this.ico('next')}</span>
                        </button>
                        <button type="button" class="row" id="start-free-workout">
                            <span class="row__icon">${this.ico('dumbbell')}</span>
                            <span class="row__body"><span class="row__title">Seduta libera</span></span>
                            <span class="row__end">${this.ico('next')}</span>
                        </button>
                    </div>
                </section>
            </div>

            <!-- Anteprima (sola lettura) -->
            <div id="workout-preview" style="display: none;">
                <div class="preview-bar section__head">
                    <span class="tag tag--accent">Anteprima</span>
                    <button type="button" class="btn btn--secondary btn--sm" id="close-preview-btn">Chiudi</button>
                </div>
                <div id="preview-day-nav" class="preview-day-nav chips chips--scroll"></div>
                <div id="preview-content"></div>
            </div>
        `;
    },

    // Fogli dell'area: generatore (wizard) ed editor manuale
    sheetsScheda() {
        const card = (value, icon, title, desc) => `
            <button type="button" class="wizard-card choice" data-value="${value}">
                ${icon ? `<span class="wizard-card-icon choice__icon">${this.ico(icon)}</span>` : ''}
                <span class="choice__body"><b class="wizard-card-title">${title}</b><span class="wizard-card-desc">${desc}</span></span>
            </button>`;
        const pick = (value, unit) => `
            <button type="button" class="wizard-card wizard-card-small" data-value="${value}">
                <span class="wizard-card-title num">${value}</span>
                <small class="wizard-card-desc">${unit}</small>
            </button>`;
        return `
            <div class="modal" id="ai-generator-modal">
                <section class="sheet sheet--tall modal-wizard" role="dialog" aria-modal="true" aria-labelledby="wizard-title">
                    <span class="sheet__grip" aria-hidden="true"></span>
                    <div class="sheet__head">
                        <h2 id="wizard-title">Crea la scheda</h2>
                        <button type="button" class="btn btn--ghost btn--icon sheet__close" id="close-ai-generator" aria-label="Chiudi il generatore">${this.ico('close')}</button>
                    </div>

                    <div class="wizard-progress" aria-hidden="true">
                        <div class="wizard-progress-bar" id="wizard-progress-fill" style="width: 25%"></div>
                    </div>
                    <div class="wizard-steps-indicator steps" aria-hidden="true">
                        <span class="wizard-step-dot active" data-step="1">1</span>
                        <span class="wizard-step-dot" data-step="2">2</span>
                        <span class="wizard-step-dot" data-step="3">3</span>
                        <span class="wizard-step-dot" data-step="4">4</span>
                    </div>

                    <div class="wizard-step" id="wizard-step-1">
                        <h3 class="wizard-step-title">Obiettivo</h3>
                        <div class="wizard-cards choices" id="wizard-goal-cards">
                            ${card('hypertrophy', 'm-arms', 'Ipertrofia', 'Più massa muscolare')}
                            ${card('strength', 'barbell', 'Forza', 'Carichi massimi')}
                            ${card('recomp', 'cycle', 'Ricomposizione', 'Meno grasso, più muscolo')}
                            ${card('endurance', 'heart', 'Resistenza', 'Tante ripetizioni')}
                            ${card('toning', 'm-glutes', 'Tonificazione', 'Glutei, gambe, definizione')}
                        </div>
                    </div>

                    <div class="wizard-step hidden" id="wizard-step-2">
                        <h3 class="wizard-step-title">Giorni a settimana</h3>
                        <div class="wizard-suggestion" id="wizard-days-suggestion"></div>
                        <div class="wizard-cards wizard-cards-row pick" style="--n: 4" id="wizard-days-cards">
                            ${pick(3, 'giorni')}${pick(4, 'giorni')}${pick(5, 'giorni')}${pick(6, 'giorni')}
                        </div>
                    </div>

                    <div class="wizard-step hidden" id="wizard-step-3">
                        <h3 class="wizard-step-title">Divisione</h3>
                        <div class="wizard-suggestion" id="wizard-split-suggestion"></div>
                        <div class="wizard-cards choices" id="wizard-split-cards">
                            ${card('upper-lower', 'stack', 'Upper / Lower', 'Alto e basso alternati')}
                            ${card('push-pull-legs', 'swap', 'Push / Pull / Legs', 'Spingi, tira, gambe')}
                            ${card('full-body', 'bodyweight', 'Full Body', 'Tutto il corpo ogni volta')}
                        </div>
                    </div>

                    <div class="wizard-step hidden" id="wizard-step-4">
                        <h3 class="wizard-step-title">Durata</h3>
                        <div class="wizard-suggestion" id="wizard-duration-suggestion"></div>
                        <div class="wizard-cards wizard-cards-row pick" style="--n: 4" id="wizard-duration-cards">
                            ${pick(45, 'min')}${pick(60, 'min')}${pick(75, 'min')}${pick(90, 'min')}
                        </div>
                    </div>

                    <div class="wizard-step hidden" id="wizard-step-summary">
                        <h3 class="wizard-step-title">Riepilogo</h3>
                        <div class="wizard-summary" id="wizard-summary-content"></div>
                    </div>

                    <div class="wizard-nav sheet__actions">
                        <button type="button" class="btn btn--primary btn--xl" id="generate-program-btn" style="display: none">${this.ico('check')}Crea la scheda</button>
                        <button type="button" class="btn btn--ghost btn--block" id="wizard-back" style="visibility: hidden">${this.ico('back')}Indietro</button>
                    </div>
                </section>
            </div>

            <div class="modal" id="manual-builder-modal">
                <section class="sheet sheet--tall" role="dialog" aria-modal="true" aria-labelledby="builder-modal-title">
                    <span class="sheet__grip" aria-hidden="true"></span>
                    <div class="sheet__head">
                        <h2 id="builder-modal-title">Scheda a mano</h2>
                        <button type="button" class="btn btn--ghost btn--icon sheet__close" id="close-manual-builder" aria-label="Chiudi l'editor">${this.ico('close')}</button>
                    </div>

                    <div class="builder-step" id="builder-step-days">
                        <h3 class="cap">Giorni</h3>
                        <div id="builder-days-list"></div>
                        <button type="button" class="btn btn--secondary" id="builder-add-day-btn">${this.ico('plus')}Giorno</button>
                        <div class="builder-nav sheet__actions">
                            <button type="button" class="btn btn--primary btn--xl" id="builder-to-exercises-btn">Avanti${this.ico('next')}</button>
                        </div>
                    </div>

                    <div class="builder-step" id="builder-step-exercises" style="display: none;">
                        <div class="builder-day-tabs chips chips--scroll" id="builder-day-tabs"></div>
                        <div id="builder-current-day-exercises"></div>
                        <div class="builder-add-exercise-section">
                            <div class="search exercise-search-bar">
                                ${this.ico('search')}
                                <input type="search" class="input" id="builder-exercise-search" placeholder="Cerca un esercizio" aria-label="Cerca un esercizio" autocomplete="off">
                            </div>
                            <div id="builder-exercise-results" class="builder-exercise-results"></div>
                        </div>
                        <div class="builder-nav sheet__actions">
                            <button type="button" class="btn btn--primary btn--xl" id="builder-save-btn">${this.ico('check')}Salva la scheda</button>
                            <button type="button" class="btn btn--ghost btn--block" id="builder-back-to-days-btn">${this.ico('back')}Indietro</button>
                        </div>
                    </div>
                </section>
            </div>
        `;
    },

    bindScheda() {
        const on = (id, ev, fn) => this._on(id, ev, fn);
        const closeOnBackdrop = (id, fn) => this._closeOnBackdrop(id, fn);

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

        // Avvio e anteprima
        on('start-scheduled-workout', 'click', () => this.startScheduledWorkout());
        on('start-free-workout', 'click', () => this.startFreeWorkout());
        on('preview-workout-btn', 'click', () => this.showWorkoutPreview());
        on('close-preview-btn', 'click', () => this.closeWorkoutPreview());
    },

    enterScheda() {
        this._safe(() => this.loadPrograms());
    },

    // Manual builder state
    builderState: {
        days: [],           // [{name, exercises: [{exerciseId, name, sets, reps, rest, _src}], _src}]
        currentDayIndex: 0,
        isEditing: false
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
        this._setText('wizard-title', 'Crea la scheda');

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
            this.navigateTo('profilo');
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
                                <button type="button" class="btn btn--ghost btn--icon exercise-info-btn" data-exercise-id="${GT.esc(ex.exerciseId || '')}" data-exercise-name="${GT.esc(ex.name)}" aria-label="Come si esegue: ${GT.esc(ex.name)}">
                                    ${this.ico('info')}
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
            this._setText('builder-modal-title', 'Modifica scheda');
        } else {
            this.builderState.days = [{ name: 'Giorno 1', exercises: [] }];
            this._setText('builder-modal-title', 'Scheda a mano');
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
                <button type="button" class="remove-day-btn" onclick="App.builderRemoveDay(${i})" aria-label="Rimuovi giorno ${i + 1}">${this.ico('close')}</button>
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
                    ${this.ico('timer', 'ico--sm')}
                    <input type="number" value="${GT.esc(ex.rest)}" min="15" max="600" step="15" aria-label="Recupero in secondi"
                        onchange="App.builderUpdateExercise(${i}, 'rest', this.value)">
                    <span>s</span>
                </div>
                <button type="button" class="remove-exercise-btn" onclick="App.builderRemoveExercise(${i})" aria-label="Rimuovi ${GT.esc(ex.name)}">${this.ico('close')}</button>
            </div>
        `).join('');
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
                    <span class="result-add">${this.ico(alreadyAdded ? 'check' : 'plus')}</span>
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
});
