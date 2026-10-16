/**
 * GymTracker 2.0 — area SCHEDA: scheda attiva (ciclo, giorni espandibili, superset), anteprima
 * di un giorno, editor manuale (esercizi, serie, ripetizioni, recuperi, ordine, giorni).
 * La scheda si crea e si rigenera dal primo avvio (#onboarding, in oggi.js).
 */

Object.assign(App, {
    // ========================================
    // GUSCIO DELL'AREA
    // ========================================

    // Pagina #scheda. La lente apre la libreria (#esercizi, sottopagina).
    htmlScheda() {
        return `
            <header class="head">
                <h1 id="scheda-title">Scheda</h1>
                <div class="head__actions">
                    <a class="btn btn--ghost btn--icon" href="#esercizi" data-page="esercizi" aria-label="Cerca esercizi">${this.ico('search')}</a>
                    <button type="button" class="btn btn--ghost btn--icon" id="edit-program-btn" aria-label="Modifica la scheda" hidden>${this.ico('edit')}</button>
                </div>
            </header>

            <div class="empty scheda-empty" id="no-program-state" hidden>
                <span class="empty__icon">${this.ico('plan', 'ico--xl')}</span>
                <h2 class="scheda-empty__title">Nessuna scheda</h2>
                <p>Quattro domande e la crei.</p>
                <button type="button" class="btn btn--primary btn--xl" id="open-ai-generator-btn">Crea la mia scheda</button>
                <button type="button" class="btn btn--ghost" id="open-manual-builder-btn">${this.ico('edit')}Costruiscila a mano</button>
            </div>

            <div class="wide" id="active-program-card" hidden>
                <div class="col">
                    <section class="section" id="scheda-cycle" aria-labelledby="scheda-cycle-title">
                        <div class="section__head">
                            <h2 id="scheda-cycle-title">Ciclo</h2>
                            <span class="muted scheda-meta" id="scheda-meta"></span>
                        </div>
                        <div class="meso" id="scheda-meso" role="img"></div>
                        <div class="meso-labels" id="scheda-meso-labels" aria-hidden="true"></div>
                        <div class="group" id="scheda-phases"></div>
                        <div class="group" id="scheda-cycle-actions"></div>
                    </section>
                </div>
                <div class="col">
                    <section class="section scheda-days" aria-labelledby="scheda-days-title">
                        <div class="section__head">
                            <h2 id="scheda-days-title">Giorni</h2>
                            <span class="muted scheda-meta" id="scheda-days-count"></span>
                        </div>
                        <div class="scheda-days__list" id="scheda-days"></div>
                    </section>
                    <button type="button" class="btn btn--secondary btn--block" id="regen-program-btn">${this.ico('cycle')}Rigenera scheda</button>
                </div>
            </div>

            <!-- compatibilità: la seduta v1 accende/spegne questi due; restano vuoti e nascosti -->
            <div id="workout-not-started" hidden></div>
            <div id="workout-preview" hidden></div>
        `;
    },

    // Fogli dell'area: anteprima di un giorno, editor della scheda
    sheetsScheda() {
        return `
            <div class="modal" id="scheda-preview-modal">
                <section class="sheet sheet--tall" role="dialog" aria-modal="true" aria-labelledby="scheda-preview-title">
                    <span class="sheet__grip" aria-hidden="true"></span>
                    <div class="sheet__head">
                        <h2 id="scheda-preview-title">Anteprima</h2>
                        <button type="button" class="btn btn--ghost btn--icon sheet__close" id="scheda-preview-close" aria-label="Chiudi l'anteprima">${this.ico('close')}</button>
                    </div>
                    <p class="muted" id="scheda-preview-meta"></p>
                    <ol class="dayc__list pv-list" id="scheda-preview-list"></ol>
                    <div class="sheet__actions pv-foot">
                        <button type="button" class="btn btn--primary btn--xl" id="scheda-preview-start">${this.ico('play')}Inizia</button>
                    </div>
                </section>
            </div>

            <div class="modal" id="manual-builder-modal">
                <section class="sheet sheet--tall ed" role="dialog" aria-modal="true" aria-labelledby="builder-modal-title">
                    <span class="sheet__grip" aria-hidden="true"></span>
                    <div class="sheet__head">
                        <h2 id="builder-modal-title">Modifica scheda</h2>
                        <button type="button" class="btn btn--ghost btn--icon sheet__close" id="close-manual-builder" aria-label="Chiudi l'editor">${this.ico('close')}</button>
                    </div>
                    <p class="ed__note" id="ed-note" hidden>${this.ico('info', 'ico--sm')}<span>Se la modifichi, a fine ciclo resta così</span></p>
                    <div class="chips chips--scroll ed__days" id="builder-day-tabs" role="group" aria-label="Giorni della scheda"></div>
                    <div class="ed__dayhead">
                        <div class="field ed__dayname">
                            <label for="ed-day-name">Nome del giorno</label>
                            <input class="input" id="ed-day-name" type="text" maxlength="40" autocomplete="off">
                        </div>
                        <button type="button" class="btn btn--ghost btn--icon" id="ed-day-remove" aria-label="Togli questo giorno">${this.ico('trash')}</button>
                    </div>
                    <ol class="ed__list" id="builder-current-day-exercises"></ol>
                    <button type="button" class="btn btn--secondary btn--block" id="ed-add-ex">${this.ico('plus')}Aggiungi esercizio</button>
                    <div class="ed__search" id="ed-search" hidden>
                        <div class="search">
                            ${this.ico('search')}
                            <input type="search" class="input" id="builder-exercise-search" placeholder="Cerca un esercizio" aria-label="Cerca un esercizio da aggiungere" autocomplete="off">
                        </div>
                        <div id="builder-exercise-results" class="group ed__results"></div>
                    </div>
                    <div class="sheet__actions ed__foot">
                        <button type="button" class="btn btn--primary btn--xl" id="builder-save-btn">${this.ico('check')}Salva la scheda</button>
                    </div>
                </section>
            </div>
        `;
    },

    bindScheda() {
        const on = (id, ev, fn) => this._on(id, ev, fn);

        // Testata e stato vuoto
        on('edit-program-btn', 'click', () => this.editActiveProgram());
        on('open-ai-generator-btn', 'click', () => this.openOnboarding());
        on('open-manual-builder-btn', 'click', () => this.openManualBuilder(false));
        on('regen-program-btn', 'click', () => this.openOnboarding({ fromStep: 'goal' }));

        // Giorni: apri/chiudi, esercizio, anteprima, inizia
        on('scheda-days', 'click', (e) => {
            const head = e.target.closest('[data-dayc-toggle]');
            if (head) {
                this._schedaToggleDay(parseInt(head.dataset.daycToggle, 10));
                return;
            }
            const act = e.target.closest('[data-dayc-act]');
            if (act) {
                const i = parseInt(act.dataset.day, 10);
                if (act.dataset.daycAct === 'preview') this.openDayPreview(i);
                else this._schedaStartDay(i);
                return;
            }
            const ex = e.target.closest('[data-ex]');
            if (ex) this._schedaOpenExercise(ex.dataset.ex, ex.dataset.exName);
        });

        // Ciclo
        on('scheda-cycle-actions', 'click', (e) => {
            const btn = e.target.closest('[data-cycle-act]');
            if (!btn) return;
            const act = btn.dataset.cycleAct;
            if (act === 'deload') this.startDeloadNow();
            else if (act === 'stop-deload') this.stopDeloadNow();
            else if (act === 'close') {
                this._cycleSummaryDismissed = false;
                this.completeCycleWithSummary();
            }
        });

        // Anteprima
        this._closeOnBackdrop('scheda-preview-modal', () => this._closeModal('scheda-preview-modal'));
        on('scheda-preview-close', 'click', () => this._closeModal('scheda-preview-modal'));
        on('scheda-preview-start', 'click', () => {
            const i = this._previewDay;
            this._closeModal('scheda-preview-modal');
            this._schedaStartDay(i);
        });
        on('scheda-preview-list', 'click', (e) => {
            const ex = e.target.closest('[data-ex]');
            if (ex) this._schedaOpenExercise(ex.dataset.ex, ex.dataset.exName);
        });

        // Editor
        on('close-manual-builder', 'click', () => this.closeManualBuilder());
        this._closeOnBackdrop('manual-builder-modal', () => this.closeManualBuilder());
        on('builder-day-tabs', 'click', (e) => {
            const chip = e.target.closest('[data-ed-day], [data-ed-add-day]');
            if (!chip) return;
            if (chip.hasAttribute('data-ed-add-day')) this.builderAddDay();
            else this.builderSelectDay(parseInt(chip.dataset.edDay, 10));
        });
        on('ed-day-name', 'input', (e) => this.builderUpdateDayName(this.builderState.currentDayIndex, e.target.value));
        on('ed-day-name', 'change', () => this._edRenderDays());
        on('ed-day-remove', 'click', () => this.builderRemoveDay(this.builderState.currentDayIndex));
        on('ed-add-ex', 'click', () => this._edAddExercise());
        on('builder-exercise-search', 'input', (e) => this.builderSearchExercises(e.target.value));
        on('builder-exercise-results', 'click', (e) => {
            const el = e.target.closest('[data-add-ex]');
            if (el && !el.disabled) this.builderAddExercise(el.dataset.addEx);
        });
        on('builder-save-btn', 'click', () => this.builderSaveProgram());
        on('builder-current-day-exercises', 'click', (e) => this._edListClick(e));
        on('builder-current-day-exercises', 'change', (e) => this._edListChange(e));
        on('builder-current-day-exercises', 'keydown', (e) => {
            if (e.key === 'Enter' && e.target.matches('[data-ed-field]')) {
                e.preventDefault();
                this._edListChange(e);
            }
        });
    },

    enterScheda() {
        this._safe(() => this.loadPrograms());
    },

    // Stato dell'editor
    builderState: {
        days: [],           // [{name, _src, exercises: [{exerciseId, name, sets, reps, rest, metric, superset…, _src}]}]
        currentDayIndex: 0,
        isEditing: false,
        openEx: null,
        snapshot: ''
    },

    // Consigli per obiettivo (Pelland 2025, Singer 2024, Schoenfeld 2021): giorni, divisione e
    // durata proposti dal primo avvio (oggi.js, _obResolveTime/_obSplit)
    WIZARD_RECOMMENDATIONS: {
        hypertrophy: {
            days: { recommended: 4, alt: 6, reason: 'Pelland 2025: 12-20 serie/muscolo/settimana. 4 giorni U/L o 6 giorni PPL permettono il volume ottimale con 2+ stimoli/muscolo/settimana.' },
            split: {
                3: { recommended: 'full-body', reason: 'Con 3 giorni, il Full Body garantisce frequenza 3x/muscolo/settimana (Schoenfeld 2016: frequenza 2+ superiore per ipertrofia).' },
                4: { recommended: 'upper-lower', reason: 'Upper/Lower 4x è lo split più bilanciato: ogni muscolo 2x/settimana con volume adeguato per sessione (Remmert 2025: ~11 serie/sessione PUOS).' },
                5: { recommended: 'upper-lower', reason: 'U/L 5 giorni aggiunge un giorno braccia/spalle per volume extra sui punti deboli, mantenendo frequenza 2x/settimana.' },
                6: { recommended: 'push-pull-legs', reason: 'PPL 6x massimizza volume e frequenza (2x/settimana per gruppo).' }
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
                3: { recommended: 'full-body', reason: 'Full Body 3x massimizza il dispendio calorico per sessione e la frequenza muscolare.' },
                4: { recommended: 'upper-lower', reason: 'U/L 4x è il miglior compromesso: volume moderato (10-15 serie/muscolo/sett), gestibile in deficit calorico (JEHS 2024).' },
                5: { recommended: 'upper-lower', reason: 'U/L 5 giorni per chi vuole più dispendio. Attenzione al recupero in deficit calorico: non eccedere con il volume.' },
                6: { recommended: 'push-pull-legs', reason: 'PPL 6x solo se deficit moderato (300-500 kcal). Volume alto in deficit aggressivo è controproducente (Int J Obesity 2025).' }
            },
            duration: { recommended: 45, range: '45-60', reason: 'Sessioni efficienti per gestire la fatica in deficit. Recuperi 1-2 min.' }
        },
        endurance: {
            days: { recommended: 3, alt: 4, reason: 'Schoenfeld 2021: endurance muscolare richiede alto volume di ripetizioni (15-25+). 3-4 giorni con recuperi brevi sono sufficienti.' },
            split: {
                3: { recommended: 'full-body', reason: 'Full Body con circuiti o superset: i recuperi brevi (30-60s) sono il driver principale dell\'adattamento all\'endurance (Schoenfeld 2021).' },
                4: { recommended: 'upper-lower', reason: 'U/L 4x permette più volume per sessione con recuperi brevi.' },
                5: { recommended: 'upper-lower', reason: 'U/L 5 giorni con sessioni corte e intense.' },
                6: { recommended: 'push-pull-legs', reason: 'PPL 6x per atleti condizionati: alto volume con recuperi brevi.' }
            },
            duration: { recommended: 45, range: '30-50', reason: 'Recuperi brevi (30-60s) rendono le sessioni naturalmente corte.' }
        },
        toning: {
            days: { recommended: 4, alt: 3, reason: 'Schoenfeld 2016: glutei 2-4x/settimana. 4 giorni U/L con priorità alla parte bassa.' },
            split: {
                3: { recommended: 'upper-lower', reason: 'U/L 3x: 2 giorni lower (glutei-quad + glutei-femorali) + 1 upper (Barbalho 2019).' },
                4: { recommended: 'upper-lower', reason: 'U/L 4x: 2 giorni glutei/gambe + 2 upper leggeri.' },
                5: { recommended: 'upper-lower', reason: 'U/L 5x con giorno extra Glute Burn: 3 giorni lower + 2 upper (Barbalho 2020).' },
                6: { recommended: 'upper-lower', reason: 'U/L 6x: 3 lower + 3 upper.' }
            },
            duration: { recommended: 60, range: '45-60', reason: 'Harty 2018: le donne recuperano più velocemente tra le serie: 45-60 min sono sufficienti.' }
        }
    },

    // Il vecchio generatore a foglio è diventato il primo avvio (stesso flusso di "Rigenera")
    openWizard() {
        this.openOnboarding({ fromStep: 'goal' });
    },

    // ========================================
    // SCHEDA ATTIVA
    // ========================================

    loadPrograms() {
        this.displayActiveProgram();
    },

    _schedaIsManual(program) {
        const md = program?.metadata || {};
        return !!(md.isManual || md.isCustom || md.split === 'custom');
    },

    // Titolo della pagina: la divisione per le schede generate, il nome per quelle a mano
    _schedaTitle(program) {
        if (!program) return 'Scheda';
        const split = { 'upper-lower': 'Upper/Lower', 'push-pull-legs': 'Push/Pull/Legs', 'full-body': 'Full body' }[program.metadata?.split];
        if (split && !program.metadata?.isCustom) return split;
        return program.name || 'Scheda';
    },

    displayActiveProgram() {
        const program = Storage.getActiveProgram();
        const card = document.getElementById('active-program-card');
        const empty = document.getElementById('no-program-state');
        const edit = document.getElementById('edit-program-btn');
        if (!card || !empty) return;

        if (!program || !program.days?.length) {
            card.hidden = true;
            empty.hidden = false;
            if (edit) edit.hidden = true;
            this._setText('scheda-title', 'Scheda');
            return;
        }
        card.hidden = false;
        empty.hidden = true;
        if (edit) edit.hidden = false;
        this._setText('scheda-title', this._schedaTitle(program));
        this._renderSchedaCycle(program);
        this._renderSchedaDays(program);
    },

    _renderSchedaCycle(program) {
        const section = document.getElementById('scheda-cycle');
        if (!section) return;
        const info = Storage.getCycleInfo();
        const md = program.metadata || {};
        const days = program.days.length;
        const min = parseInt(md.sessionDuration, 10);
        const goal = this._schedaIsManual(program) && !md.cycle ? '' : this._goalLabel(md.goal);
        const meta = [
            goal ? GT.esc(goal) : '',
            min > 0 ? `<span class="num">${days}</span> × <span class="num">${min}</span>&nbsp;min` : `<span class="num">${days}</span> giorni`
        ].filter(Boolean).join(' · ');
        this._schedaMetaHtml = meta;
        if (!info) {
            section.hidden = true;
            return;
        }
        section.hidden = false;
        this._setText('scheda-cycle-title', `Ciclo ${info.cycleNumber || md.cycleNumber || 1}`);
        const metaEl = document.getElementById('scheda-meta');
        if (metaEl) metaEl.innerHTML = meta;

        const isDeload = Storage.isDeloadActive();
        const meso = document.getElementById('scheda-meso');
        const n = info.duration;
        if (meso) {
            meso.style.setProperty('--weeks', String(n));
            meso.innerHTML = this._oggiMesoHtml(info);
            meso.setAttribute('aria-label', `Ciclo di ${n} settimane. ` + this._oggiMesoLabel(info, isDeload ? 'deload' : info.currentPhase));
        }
        const labels = document.getElementById('scheda-meso-labels');
        if (labels) {
            labels.style.setProperty('--weeks', String(n));
            labels.innerHTML = Array.from({ length: n }, (_, i) => {
                const w = i + 1;
                return w === info.currentWeek ? `<span class="is-now">S${w} · ora</span>` : `<span>S${w}</span>`;
            }).join('');
        }

        // Fasi raggruppate: "Accumulo S1-3 · RIR 2-3", "Scarico S6 · metà serie"
        const groups = [];
        (info.phases || []).slice().sort((a, b) => a.week - b.week).forEach(p => {
            const key = this._oggiPhaseKey(p);
            const last = groups[groups.length - 1];
            const rir = this._schedaRirRange(p);
            if (last && last.key === key) {
                last.to = p.week;
                last.lo = Math.min(last.lo, rir.lo);
                last.hi = Math.max(last.hi, rir.hi);
            } else {
                groups.push({ key, from: p.week, to: p.week, lo: rir.lo, hi: rir.hi });
            }
        });
        const phases = document.getElementById('scheda-phases');
        if (phases) {
            phases.innerHTML = groups.map(g => {
                const weeks = g.from === g.to ? `S${g.from}` : `S${g.from}-${g.to}`;
                const what = g.key === 'del' ? 'metà serie' : (Number.isFinite(g.lo) ? `RIR ${g.lo === g.hi ? g.lo : `${g.lo}-${g.hi}`}` : '');
                return `<div class="row scheda-phase"><span class="phase" data-ph="${g.key}">${this._oggiPhaseLabel(g.key === 'del' ? 'deload' : g.key === 'int' ? 'intensification' : 'accumulation')}</span><span class="muted num">${weeks}${what ? ' · ' + what : ''}</span></div>`;
            }).join('');
        }

        // Azioni del ciclo: scarico anticipato (o la sua fine), chiusura
        const actions = document.getElementById('scheda-cycle-actions');
        if (actions) {
            const rows = [];
            if (this._shouldCompleteCycle()) {
                rows.push(this._schedaCycleRow('close', 'cycle', 'Chiudi il ciclo', 'Riepilogo ed esercizi nuovi'));
            }
            if (info.isManualDeload) {
                const until = this._oggiDeloadUntil(info);
                rows.push(`<div class="row"><span class="row__icon">${this.ico('deload')}</span><span class="row__body"><span class="row__title">Scarico in corso</span><span class="row__sub">${until ? 'Fino a ' + GT.esc(until) : '7 giorni'}</span></span><button type="button" class="btn btn--secondary btn--sm" data-cycle-act="stop-deload">Termina</button></div>`);
            } else if (!isDeload) {
                rows.push(this._schedaCycleRow('deload', 'deload', 'Scarico anticipato', '7 giorni, metà serie'));
            }
            actions.innerHTML = rows.join('');
            actions.hidden = !rows.length;
        }
    },

    _schedaCycleRow(act, icon, title, sub) {
        return `<button type="button" class="row" data-cycle-act="${act}"><span class="row__icon">${this.ico(icon)}</span><span class="row__body"><span class="row__title">${title}</span><span class="row__sub">${sub}</span></span><span class="row__end">${this.ico('next')}</span></button>`;
    },

    _schedaRirRange(phase) {
        if (phase?.rir && Number.isFinite(Number(phase.rir.compound))) {
            const c = Number(phase.rir.compound);
            const i = Number.isFinite(Number(phase.rir.isolation)) ? Number(phase.rir.isolation) : c;
            return { lo: Math.min(c, i), hi: Math.max(c, i) };
        }
        if (phase?.rirTarget) return { lo: Number(phase.rirTarget.min), hi: Number(phase.rirTarget.max) };
        return { lo: NaN, hi: NaN };
    },

    // Giorni della scheda fatti questa settimana: indice → data dell'ultima volta
    _schedaDoneMap(program) {
        const out = new Map();
        const pid = program?.metadata?.programId;
        const days = program?.days || [];
        Storage.getWorkoutsThisWeek().forEach(w => {
            if (!w || w.isFreeWorkout) return;
            let idx = -1;
            const di = parseInt(w.dayIndex, 10);
            if (pid != null && w.programId != null && String(w.programId) === String(pid) && Number.isInteger(di)) idx = di;
            if (idx < 0 || idx >= days.length) idx = days.findIndex(d => d.type && d.type === w.type);
            if (idx < 0) return;
            const t = new Date(w.date);
            if (!out.has(idx) || t > out.get(idx)) out.set(idx, t);
        });
        return out;
    },

    _renderSchedaDays(program) {
        const list = document.getElementById('scheda-days');
        if (!list) return;
        const pid = program.metadata?.programId ?? '';
        if (!this._schedaOpen || this._schedaOpenPid !== pid) {
            this._schedaOpen = new Set([this.getSuggestedDayIndex(program)]);
            this._schedaOpenPid = pid;
        }
        const done = this._schedaDoneMap(program);
        const count = document.getElementById('scheda-days-count');
        if (count) {
            const cycleHidden = document.getElementById('scheda-cycle')?.hidden;
            count.innerHTML = cycleHidden && this._schedaMetaHtml
                ? this._schedaMetaHtml
                : `<span class="num">${done.size}</span> di <span class="num">${program.days.length}</span> fatti`;
        }
        list.innerHTML = program.days.map((day, i) => this._schedaDayCard(program, day, i, done)).join('');
    },

    _schedaDayCard(program, day, i, done) {
        const open = this._schedaOpen.has(i);
        const suggested = this.getSuggestedDayIndex(program);
        const todayDone = Storage.getWorkoutsThisWeek().some(w => GT.dateKey(new Date(w.date)) === GT.dateKey(new Date()));
        const name = day.type || day.name || `Giorno ${i + 1}`;
        const n = day.exercises?.length || 0;
        let tag = '';
        if (done.has(i)) {
            const wd = done.get(i).toLocaleDateString('it-IT', { weekday: 'long' });
            tag = `<span class="tag tag--ok dayc__tag">${this.ico('check')}${GT.esc(wd)}</span>`;
        } else if (i === suggested && n) {
            tag = `<span class="tag tag--accent dayc__tag">${todayDone ? 'prossima' : 'oggi'}</span>`;
        }
        const est = n ? this._estimateDuration(this._applyPhase(day), program) : 0;
        const focus = this._oggiFocus(day);
        const sub = [
            focus ? GT.esc(focus) : '',
            n ? `<span class="num">${n}</span>&nbsp;${n === 1 ? 'esercizio' : 'esercizi'}` : 'Nessun esercizio',
            est ? `<span class="num">~${est}</span>&nbsp;min` : ''
        ].filter(Boolean).join(' · ');
        return `
            <article class="dayc${open ? ' is-open' : ''}" data-day="${i}">
                <h3 class="dayc__h">
                    <button class="dayc__head" type="button" aria-expanded="${open}" aria-controls="dayc-body-${i}" data-dayc-toggle="${i}">
                        <span class="dayc__name">${GT.esc(name)} ${tag}</span>
                        <span class="dayc__sub">${sub}</span>
                        ${this.ico('chevron-down', 'dayc__chev')}
                    </button>
                </h3>
                <div class="dayc__body" id="dayc-body-${i}"${open ? '' : ' hidden'}>${open ? this._schedaDayBody(program, day, i) : ''}</div>
            </article>`;
    },

    // Elenco degli esercizi (superset raggruppati) + Anteprima e Inizia
    _schedaDayBody(program, day, i) {
        const exs = day.exercises || [];
        if (!exs.length) return '<p class="muted dayc__empty">Nessun esercizio: aggiungili con la matita.</p>';
        const name = day.type || day.name || `Giorno ${i + 1}`;
        return `
            <ol class="dayc__list">${this._schedaExrList(exs, (ex, inSs) => this._schedaExrPlan(ex, program, inSs))}</ol>
            <div class="dayc__actions">
                <button type="button" class="btn btn--secondary" data-dayc-act="preview" data-day="${i}" aria-label="Anteprima di ${GT.esc(name)}">${this.ico('plan')}Anteprima</button>
                <button type="button" class="btn btn--secondary dayc__start" data-dayc-act="start" data-day="${i}" aria-label="Inizia ${GT.esc(name)}">${this.ico('play')}Inizia</button>
            </div>`;
    },

    // Righe .exr, superset in .ssgroup con l'etichetta "Superset · 1:30 dopo A2"
    _schedaExrList(exs, planFn) {
        const sizes = {};
        exs.forEach(ex => { if (ex?.supersetGroup) sizes[ex.supersetGroup] = (sizes[ex.supersetGroup] || 0) + 1; });
        let html = '';
        let k = 0;
        while (k < exs.length) {
            const ex = exs[k];
            const g = ex?.supersetGroup;
            if (g && sizes[g] >= 2) {
                const members = [];
                while (k < exs.length && exs[k]?.supersetGroup === g) members.push(exs[k++]);
                const last = `${g}${members.length}`;
                const rest = parseInt(members[0].supersetRest, 10) || Math.round(Math.max(...members.map(m => parseInt(m.rest, 10) || 0)) * 0.8);
                const giant = members.length > 2 || members.some(m => m.isGiantSet);
                html += `<li class="ssgroup">
                    <span class="ssgroup__label">${this.ico('superset')}${giant ? 'Giant set' : 'Superset'}${rest ? ` · <span class="num">${this._schedaRest(rest)}</span> dopo ${GT.esc(last)}` : ''}</span>
                    <ol>${members.map((m, j) => `<li>${this._schedaExr(m, planFn(m, true), `${g}${j + 1}`)}</li>`).join('')}</ol>
                </li>`;
            } else {
                html += `<li>${this._schedaExr(ex, planFn(ex, false))}</li>`;
                k++;
            }
        }
        return html;
    },

    _schedaExr(ex, planHtml, letter = '') {
        const name = ex.name || EXERCISES_DB[ex.exerciseId]?.name || ex.exerciseId || '';
        return `<button type="button" class="exr" data-ex="${GT.esc(ex.exerciseId || '')}" data-ex-name="${GT.esc(name)}">
            <span class="thumb thumb--sm">${this._oggiThumb(ex.exerciseId, '')}</span>
            <span class="exr__body">
                <span class="exr__name">${letter ? `<span class="ex-letter">${GT.esc(letter)}</span>` : ''}${GT.esc(name)}</span>
                <span class="exr__plan">${planHtml}</span>
            </span>
        </button>`;
    },

    // "4 × 8-12 · 2:00 · 140 kg" (a tempo: "3 × 30-45 s"; corpo libero: "corpo libero")
    _schedaExrPlan(ex, program, inSuperset) {
        const sets = parseInt(ex.sets, 10) || 3;
        const time = ex.metric === 'time';
        const reps = GT.esc(String(ex.reps ?? ex.targetReps ?? ''));
        const parts = [`<span class="num">${sets} × ${reps}${time ? '&nbsp;s' : ''}</span>`];
        const rest = parseInt(ex.rest, 10);
        if (!inSuperset && rest > 0) parts.push(`<span class="num">${this._schedaRest(rest)}</span>`);
        const w = this._schedaWeight(ex, program);
        if (w) parts.push(w);
        return parts.join(' · ');
    },

    // Peso previsto: suggerimento della progressione se c'è uno storico, "corpo libero" se non serve
    _schedaWeight(ex, program) {
        const id = ex.exerciseId;
        if (!id) return '';
        const bw = this._safe(() => Storage.isBodyweightExercise(id));
        let last = null;
        try { last = Storage.getLastPerformance(id); } catch (e) { last = null; }
        let kg = 0;
        if (last) {
            kg = Number(last.weight) || 0;
            try {
                const s = Storage.getProgressionSuggestion(id, ex.reps || ex.targetReps, program?.metadata?.goal);
                if (Number(s?.suggestedWeight) > 0) kg = Number(s.suggestedWeight);
            } catch (e) { /* resta l'ultimo peso */ }
        }
        if (kg > 0) return `<span class="num">${this.fmt(kg)}</span>&nbsp;kg`;
        return bw ? 'corpo libero' : '';
    },

    // Recupero sempre come m:ss ("0:45", "2:30")
    _schedaRest(sec) {
        const s = Math.max(0, Math.round(Number(sec) || 0));
        return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    },

    _schedaToggleDay(i) {
        const program = Storage.getActiveProgram();
        const day = program?.days?.[i];
        const card = document.querySelector(`#scheda-days .dayc[data-day="${i}"]`);
        if (!day || !card) return;
        if (!this._schedaOpen) this._schedaOpen = new Set();
        const open = !this._schedaOpen.has(i);
        if (open) this._schedaOpen.add(i);
        else this._schedaOpen.delete(i);
        card.classList.toggle('is-open', open);
        card.querySelector('.dayc__head')?.setAttribute('aria-expanded', String(open));
        const body = card.querySelector('.dayc__body');
        if (body) {
            if (open) body.innerHTML = this._schedaDayBody(program, day, i);
            body.hidden = !open;
        }
    },

    _schedaStartDay(i) {
        const program = Storage.getActiveProgram();
        const day = program?.days?.[i];
        if (!day?.exercises?.length) {
            this.showNotification('Giorno senza esercizi', 'warning');
            return;
        }
        this.startWorkout(day, { dayIndex: i });
    },

    // Scheda dell'esercizio: quella nuova di Esercizi se c'è, altrimenti il foglio "Come si fa"
    _schedaOpenExercise(exerciseId, name) {
        if (!exerciseId) return;
        if (typeof this.openExercise === 'function') this.openExercise(exerciseId);
        else if (typeof this.showExerciseInfoModal === 'function') this.showExerciseInfoModal(exerciseId, name, 'workout');
    },

    async deleteActiveProgram() {
        const program = Storage.getActiveProgram();
        if (!program) return;
        const ok = await this.confirmSheet({
            title: `Eliminare ${this._oggiProgramLabel(program)}?`,
            text: 'Lo storico resta.',
            ok: 'Elimina la scheda',
            cancel: 'Tieni la scheda',
            danger: true
        });
        if (!ok) return;
        Storage.clearActiveProgram();
        this.loadPrograms();
        this.loadDashboard();
        this._safe(() => this.loadProgress());
        this.showNotification('Scheda eliminata', 'info', { icon: 'trash' });
    },

    // ========================================
    // ANTEPRIMA DI UN GIORNO (come sarà oggi: serie della fase, RIR, volta scorsa)
    // ========================================

    openDayPreview(i) {
        const program = Storage.getActiveProgram();
        const day = program?.days?.[i];
        if (!day?.exercises?.length) return;
        this._previewDay = i;
        const info = Storage.getCycleInfo();
        const isDeload = Storage.isDeloadActive();
        const phase = this._currentPhase(info, isDeload);
        const phased = this._applyPhase(day, phase);
        const name = day.type || day.name || `Giorno ${i + 1}`;
        const est = this._estimateDuration(phased, program);
        this._setText('scheda-preview-title', name);
        const meta = document.getElementById('scheda-preview-meta');
        if (meta) {
            const rir = this._oggiPhaseRir(phase);
            meta.innerHTML = [
                info ? `${this._oggiPhaseLabel(isDeload ? 'deload' : phase)}, settimana <span class="num">${info.currentWeek}</span>` : '',
                rir ? `RIR <span class="num">${rir}</span>` : '',
                est ? `<span class="num">~${est}</span>&nbsp;min` : ''
            ].filter(Boolean).join(' · ');
        }
        const list = document.getElementById('scheda-preview-list');
        if (list) {
            list.innerHTML = this._schedaExrList(phased.exercises || [], (ex, inSs) => {
                const sets = parseInt(ex.sets, 10) || 3;
                const time = ex.metric === 'time';
                const parts = [`<span class="num">${sets} × ${GT.esc(String(ex.reps ?? ''))}${time ? '&nbsp;s' : ''}</span>`];
                if (Number.isFinite(Number(ex.targetRir))) parts.push(`RIR <span class="num">${Number(ex.targetRir)}</span>`);
                const rest = parseInt(ex.rest, 10);
                if (!inSs && rest > 0) parts.push(`<span class="num">${this._schedaRest(rest)}</span>`);
                let last = null;
                try { last = Storage.getLastPerformance(ex.exerciseId); } catch (e) { last = null; }
                const prev = last ? `<span class="pv-prev">Volta scorsa <span class="num">${Number(last.weight) > 0 ? `${this.fmt(last.weight)} × ` : ''}${GT.esc(last.reps)}</span></span>` : '';
                return parts.join(' · ') + prev;
            });
        }
        const start = document.getElementById('scheda-preview-start');
        if (start) start.innerHTML = `${this.ico('play')}Inizia ${GT.esc(name)}`;
        this._openModal('scheda-preview-modal', '#scheda-preview-start');
    },

    // ========================================
    // EDITOR DELLA SCHEDA (anche scheda nuova a mano)
    // Conserva ciclo, superset, programId e tutto quello che non mostra (_src). Modificare una
    // scheda generata la marca isManual: la rotazione di fine ciclo non cancella le modifiche.
    // ========================================

    SUPERSET_KEYS: ['supersetGroup', 'supersetOrder', 'supersetRest', 'transitionTime', 'isGiantSet'],

    REP_LADDER: ['1-3', '3-5', '4-6', '5-8', '6-8', '6-10', '8-10', '8-12', '10-12', '10-15', '12-15', '12-20', '15-20', '15-25', '20-25', '20-30'],
    TIME_LADDER: ['10-15', '15-20', '20-30', '30-45', '45-60', '60-90'],

    openManualBuilder(editMode = false) {
        if (this.activeWorkout) {
            this._promptActiveSession();
            return;
        }
        const program = editMode ? Storage.getActiveProgram() : null;
        const exOf = (ex) => {
            const out = {
                exerciseId: ex.exerciseId,
                name: ex.name || EXERCISES_DB[ex.exerciseId]?.name || ex.exerciseId,
                sets: this._clampInt(ex.sets, 3, 1, 10),
                reps: String(ex.reps ?? '8-12'),
                rest: this._clampInt(ex.rest, this._defaultRest(ex.exerciseId), 15, 600),
                metric: ex.metric,
                _src: ex
            };
            this.SUPERSET_KEYS.forEach(k => { if (ex[k] !== undefined) out[k] = ex[k]; });
            return out;
        };
        this.builderState = {
            days: editMode && program?.days?.length
                ? program.days.map(day => ({ name: day.type || day.name, _src: day, exercises: (day.exercises || []).filter(Boolean).map(exOf) }))
                : [{ name: 'Giorno 1', exercises: [] }],
            currentDayIndex: 0,
            isEditing: !!(editMode && program),
            openEx: null,
            generated: !!(editMode && program && !this._schedaIsManual(program))
        };
        if (editMode && program) {
            const sug = this.getSuggestedDayIndex(program);
            this.builderState.currentDayIndex = Math.min(Math.max(0, sug), this.builderState.days.length - 1);
        }
        this.builderState.snapshot = this._edSnapshot();
        this._setText('builder-modal-title', this.builderState.isEditing ? 'Modifica scheda' : 'Nuova scheda');
        const note = document.getElementById('ed-note');
        if (note) note.hidden = !this.builderState.generated;
        this._edHideSearch();
        this._edRender();
        this._openModal('manual-builder-modal');
    },

    editActiveProgram() {
        this.openManualBuilder(true);
    },

    // Fotografia dei dati modificabili: serve a sapere se ci sono modifiche
    _edSnapshot() {
        return JSON.stringify((this.builderState.days || []).map(d => ({
            n: d.name,
            e: d.exercises.map(ex => [ex.exerciseId, ex.sets, ex.reps, ex.rest, ex.supersetGroup || ''])
        })));
    },

    _edDirty() {
        return this._edSnapshot() !== this.builderState.snapshot;
    },

    async closeManualBuilder() {
        if (this._edDirty()) {
            const ok = await this.confirmSheet({
                title: 'Uscire senza salvare?',
                text: 'Le modifiche alla scheda si perdono.',
                ok: 'Esci senza salvare',
                cancel: 'Continua a modificare',
                danger: true
            });
            if (!ok) return;
        }
        this._closeModal('manual-builder-modal');
    },

    _edRender() {
        this._edRenderDays();
        const day = this.builderState.days[this.builderState.currentDayIndex];
        const nameInput = document.getElementById('ed-day-name');
        if (nameInput && document.activeElement !== nameInput) nameInput.value = day?.name || '';
        const remove = document.getElementById('ed-day-remove');
        if (remove) {
            remove.hidden = this.builderState.days.length <= 1;
            remove.setAttribute('aria-label', `Togli il giorno ${day?.name || ''}`.trim());
        }
        this.builderRenderCurrentDayExercises();
    },

    _edRenderDays() {
        const tabs = document.getElementById('builder-day-tabs');
        if (!tabs) return;
        tabs.innerHTML = this.builderState.days.map((d, i) => `
            <button type="button" class="chip" aria-pressed="${i === this.builderState.currentDayIndex}" data-ed-day="${i}">${GT.esc(d.name || `Giorno ${i + 1}`)}<span class="num ed__daycount">${d.exercises.length}</span><span class="sr-only"> esercizi</span></button>
        `).join('') + `<button type="button" class="chip" data-ed-add-day>${this.ico('plus')}Giorno</button>`;
    },

    builderRenderDays() {
        this._edRenderDays();
    },

    builderRenderDayTabs() {
        this._edRenderDays();
    },

    builderAddDay() {
        const num = this.builderState.days.length + 1;
        if (num > 7) {
            this.showNotification('Al massimo 7 giorni', 'warning');
            return;
        }
        this.builderState.days.push({ name: `Giorno ${num}`, exercises: [] });
        this.builderState.currentDayIndex = this.builderState.days.length - 1;
        this.builderState.openEx = null;
        this._edRender();
        setTimeout(() => document.getElementById('ed-day-name')?.select?.(), 30);
    },

    async builderRemoveDay(index) {
        if (this.builderState.days.length <= 1) {
            this.showNotification('Serve almeno un giorno', 'warning');
            return;
        }
        const day = this.builderState.days[index];
        if (!day) return;
        if (day.exercises.length) {
            const ok = await this.confirmSheet({
                title: `Togliere ${day.name || 'il giorno'}?`,
                text: `${day.exercises.length} ${day.exercises.length === 1 ? 'esercizio' : 'esercizi'} spariscono dalla scheda.`,
                ok: 'Togli il giorno',
                cancel: 'Tieni il giorno',
                danger: true
            });
            if (!ok) return;
        }
        this.builderState.days.splice(index, 1);
        this.builderState.currentDayIndex = Math.max(0, Math.min(index, this.builderState.days.length - 1));
        this.builderState.openEx = null;
        this._edRender();
    },

    builderUpdateDayName(index, name) {
        if (this.builderState.days[index]) this.builderState.days[index].name = String(name).slice(0, 40);
    },

    builderSelectDay(index) {
        if (!this.builderState.days[index]) return;
        this.builderState.currentDayIndex = index;
        this.builderState.openEx = null;
        this._edHideSearch();
        this._edRender();
    },

    // Lettere dei superset nell'ordine attuale (solo gruppi con almeno due esercizi)
    _edLetters(exs) {
        const sizes = {};
        exs.forEach(ex => { if (ex.supersetGroup) sizes[ex.supersetGroup] = (sizes[ex.supersetGroup] || 0) + 1; });
        const seen = {};
        return exs.map(ex => {
            const g = ex.supersetGroup;
            if (!g || sizes[g] < 2) return '';
            seen[g] = (seen[g] || 0) + 1;
            return `${g}${seen[g]}`;
        });
    },

    builderRenderCurrentDayExercises() {
        const container = document.getElementById('builder-current-day-exercises');
        const day = this.builderState.days[this.builderState.currentDayIndex];
        if (!container || !day) return;
        if (!day.exercises.length) {
            container.innerHTML = `<li class="ed__empty muted">Nessun esercizio in ${GT.esc(day.name || 'questo giorno')}</li>`;
            return;
        }
        const letters = this._edLetters(day.exercises);
        const n = day.exercises.length;
        container.innerHTML = day.exercises.map((ex, i) => {
            const open = this.builderState.openEx === i;
            const time = ex.metric === 'time';
            const nm = GT.esc(ex.name);
            const stepper = (field, label, value, minus, plus, mode) => `
                <div class="ed__param">
                    <label class="ed__plabel" for="ed-${field}-${i}">${label}</label>
                    <div class="ed__stepper">
                        <button type="button" class="ed__sbtn" data-ed-step="${field}" data-d="-1" data-i="${i}" aria-label="${minus}">${this.ico('minus')}</button>
                        <input class="ed__val" id="ed-${field}-${i}" type="text" inputmode="${mode}" value="${GT.esc(value)}" data-ed-field="${field}" data-i="${i}" autocomplete="off" spellcheck="false">
                        <button type="button" class="ed__sbtn" data-ed-step="${field}" data-d="1" data-i="${i}" aria-label="${plus}">${this.ico('plus')}</button>
                    </div>
                </div>`;
            return `
                <li class="ed__ex${open ? ' is-open' : ''}">
                    <button type="button" class="ed__exhead" aria-expanded="${open}" aria-controls="ed-ex-${i}" data-ed-toggle="${i}">
                        <span class="thumb thumb--sm">${this._oggiThumb(ex.exerciseId, '')}</span>
                        <span class="ed__exbody">
                            <span class="ed__exname">${letters[i] ? `<span class="ex-letter">${letters[i]}</span>` : ''}${nm}</span>
                            <span class="ed__explan"><span class="num">${ex.sets} × ${GT.esc(ex.reps)}${time ? '&nbsp;s' : ''}</span> · <span class="num">${this._schedaRest(ex.rest)}</span></span>
                        </span>
                        ${this.ico('chevron-down', 'ed__chev')}
                    </button>
                    <div class="ed__exedit" id="ed-ex-${i}"${open ? '' : ' hidden'}>
                        ${stepper('sets', 'Serie', String(ex.sets), `Meno una serie di ${nm}`, `Più una serie di ${nm}`, 'numeric')}
                        ${stepper('reps', time ? 'Secondi' : 'Ripetizioni', ex.reps, `Meno ${time ? 'secondi' : 'ripetizioni'} per ${nm}`, `Più ${time ? 'secondi' : 'ripetizioni'} per ${nm}`, 'text')}
                        ${stepper('rest', 'Recupero', this._schedaRest(ex.rest), `Recupero di ${nm} 15 secondi più corto`, `Recupero di ${nm} 15 secondi più lungo`, 'text')}
                        <div class="ed__exactions">
                            <button type="button" class="btn btn--secondary btn--sm" data-ed-move="-1" data-i="${i}"${i === 0 ? ' disabled' : ''} aria-label="Sposta su ${nm}">${this.ico('chevron-up')}Su</button>
                            <button type="button" class="btn btn--secondary btn--sm" data-ed-move="1" data-i="${i}"${i === n - 1 ? ' disabled' : ''} aria-label="Sposta giù ${nm}">${this.ico('chevron-down')}Giù</button>
                            <button type="button" class="btn btn--danger btn--sm" data-ed-remove="${i}" aria-label="Togli ${nm}">${this.ico('trash')}Togli</button>
                        </div>
                    </div>
                </li>`;
        }).join('');
    },

    _edListClick(e) {
        const toggle = e.target.closest('[data-ed-toggle]');
        if (toggle) {
            const i = parseInt(toggle.dataset.edToggle, 10);
            this.builderState.openEx = this.builderState.openEx === i ? null : i;
            this.builderRenderCurrentDayExercises();
            document.querySelector(`#builder-current-day-exercises [data-ed-toggle="${i}"]`)?.focus({ preventScroll: true });
            return;
        }
        const step = e.target.closest('[data-ed-step]');
        if (step) {
            this._edStep(parseInt(step.dataset.i, 10), step.dataset.edStep, parseInt(step.dataset.d, 10));
            document.querySelector(`#builder-current-day-exercises [data-ed-step="${step.dataset.edStep}"][data-d="${step.dataset.d}"][data-i="${step.dataset.i}"]`)?.focus({ preventScroll: true });
            return;
        }
        const move = e.target.closest('[data-ed-move]');
        if (move && !move.disabled) {
            const to = this._edMove(parseInt(move.dataset.i, 10), parseInt(move.dataset.edMove, 10));
            if (to != null) {
                const btn = document.querySelector(`#builder-current-day-exercises [data-ed-move="${move.dataset.edMove}"][data-i="${to}"]`);
                (btn && !btn.disabled ? btn : document.querySelector(`#builder-current-day-exercises [data-ed-toggle="${to}"]`))?.focus({ preventScroll: true });
            }
            return;
        }
        const rm = e.target.closest('[data-ed-remove]');
        if (rm) this.builderRemoveExercise(parseInt(rm.dataset.edRemove, 10));
    },

    _edListChange(e) {
        const input = e.target.closest('[data-ed-field]');
        if (!input) return;
        this.builderUpdateExercise(parseInt(input.dataset.i, 10), input.dataset.edField, input.value);
    },

    // Membri dello stesso superset (serie e recupero restano uguali nel gruppo)
    _edGroupOf(day, ex) {
        return ex.supersetGroup ? day.exercises.filter(o => o.supersetGroup === ex.supersetGroup) : [ex];
    },

    _edStep(i, field, d) {
        const day = this.builderState.days[this.builderState.currentDayIndex];
        const ex = day?.exercises[i];
        if (!ex) return;
        if (field === 'sets') {
            const v = this._clampInt(ex.sets + d, ex.sets, 1, 10);
            this._edGroupOf(day, ex).forEach(o => { o.sets = v; });
        } else if (field === 'rest') {
            const v = Math.max(15, Math.min(600, (Math.round(ex.rest / 15) * 15) + d * 15));
            this._edGroupOf(day, ex).forEach(o => { o.rest = v; if (o.supersetGroup) o.supersetRest = v; });
        } else if (field === 'reps') {
            ex.reps = this._schedaStepReps(ex.reps, d, ex.metric === 'time');
        }
        this.builderRenderCurrentDayExercises();
    },

    // Scala delle ripetizioni: 6-8 → 8-10 → 8-12 … (a tempo: secondi)
    _schedaStepReps(reps, d, time = false) {
        const ladder = time ? this.TIME_LADDER : this.REP_LADDER;
        const s = String(reps || '').replace(/\s/g, '');
        let idx = ladder.indexOf(s);
        if (idx < 0) {
            const [a, b] = s.split('-').map(Number);
            const mid = Number.isFinite(b) ? (a + b) / 2 : (Number.isFinite(a) ? a : 10);
            let best = 0;
            ladder.forEach((r, k) => {
                const [x, y] = r.split('-').map(Number);
                if (Math.abs((x + y) / 2 - mid) < Math.abs(ladder[best].split('-').map(Number).reduce((p, q) => p + q, 0) / 2 - mid)) best = k;
            });
            idx = best;
            const [x, y] = ladder[idx].split('-').map(Number);
            const m = (x + y) / 2;
            if ((d > 0 && m > mid) || (d < 0 && m < mid)) return ladder[idx];
        }
        return ladder[Math.max(0, Math.min(ladder.length - 1, idx + d))];
    },

    // Recupero scritto: "90", "1:30", "1.30" → secondi
    _schedaParseRest(value, def) {
        const s = String(value ?? '').trim().replace('.', ':');
        const m = s.match(/^(\d{1,2}):(\d{1,2})$/);
        if (m) return Math.max(15, Math.min(600, parseInt(m[1], 10) * 60 + parseInt(m[2], 10)));
        return this._clampInt(s, def, 15, 600);
    },

    builderUpdateExercise(exerciseIndex, field, value) {
        const day = this.builderState.days[this.builderState.currentDayIndex];
        const ex = day?.exercises[exerciseIndex];
        if (!ex) return;
        if (field === 'sets') {
            const v = this._clampInt(value, ex.sets, 1, 10);
            this._edGroupOf(day, ex).forEach(o => { o.sets = v; });
        } else if (field === 'rest') {
            const v = this._schedaParseRest(value, ex.rest);
            this._edGroupOf(day, ex).forEach(o => { o.rest = v; if (o.supersetGroup) o.supersetRest = v; });
        } else if (field === 'reps') {
            ex.reps = this._cleanReps(value, ex.reps || '8-12');
        }
        this.builderRenderCurrentDayExercises();
    },

    // Blocchi contigui (un esercizio o un superset intero): lo spostamento non spezza i superset
    _edBlocks(exs) {
        const blocks = [];
        exs.forEach((ex, i) => {
            const last = blocks[blocks.length - 1];
            if (last && ex.supersetGroup && exs[i - 1]?.supersetGroup === ex.supersetGroup) last.push(i);
            else blocks.push([i]);
        });
        return blocks;
    },

    // Sposta su (d = −1) o giù (+1). Dentro un superset scambia i due; fuori sposta il blocco intero.
    // Restituisce il nuovo indice dell'esercizio.
    _edMove(i, d) {
        const day = this.builderState.days[this.builderState.currentDayIndex];
        const exs = day?.exercises;
        if (!exs || !exs[i]) return null;
        const j = i + d;
        if (j < 0 || j >= exs.length) return null;
        const ex = exs[i];
        if (ex.supersetGroup && exs[j].supersetGroup === ex.supersetGroup) {
            [exs[i], exs[j]] = [exs[j], exs[i]];
            this.builderState.openEx = j;
            this.builderRenderCurrentDayExercises();
            return j;
        }
        const blocks = this._edBlocks(exs);
        const b = blocks.findIndex(bl => bl.includes(i));
        const nb = b + d;
        if (nb < 0 || nb >= blocks.length) return null;
        const order = blocks.slice();
        [order[b], order[nb]] = [order[nb], order[b]];
        const flat = order.flat();
        day.exercises = flat.map(k => exs[k]);
        const to = day.exercises.indexOf(ex);
        this.builderState.openEx = to;
        this.builderRenderCurrentDayExercises();
        return to;
    },

    builderRemoveExercise(exerciseIndex) {
        const dayIndex = this.builderState.currentDayIndex;
        const day = this.builderState.days[dayIndex];
        const ex = day?.exercises[exerciseIndex];
        if (!ex) return;
        day.exercises.splice(exerciseIndex, 1);
        this.builderState.openEx = null;
        this._edRender();
        document.getElementById('ed-add-ex')?.focus({ preventScroll: true });
        this.showNotification(`${ex.name} tolto`, 'info', {
            icon: 'trash',
            action: {
                label: 'Annulla',
                onClick: () => {
                    const d = this.builderState.days[dayIndex];
                    if (!d) return;
                    d.exercises.splice(Math.min(exerciseIndex, d.exercises.length), 0, ex);
                    this._edRender();
                }
            }
        });
    },

    // Aggiungi: la libreria in modalità scelta (foglio di Esercizi, sopra l'editor) se c'è,
    // altrimenti la ricerca qui sotto
    _edAddExercise() {
        const day = this.builderState.days[this.builderState.currentDayIndex];
        if (typeof this.pickExercise === 'function') {
            const have = new Set((day?.exercises || []).map(e => e.exerciseId));
            this.pickExercise({
                title: `Aggiungi a ${day?.name || 'questo giorno'}`,
                filter: (ex) => !!ex && !have.has(ex.id),
                onPick: (id) => { if (id) this.builderAddExercise(id); }
            });
            return;
        }
        const box = document.getElementById('ed-search');
        if (!box) return;
        box.hidden = false;
        const input = document.getElementById('builder-exercise-search');
        input?.focus();
        if (input?.value) this.builderSearchExercises(input.value);
    },

    _edHideSearch() {
        const box = document.getElementById('ed-search');
        if (box) box.hidden = true;
        const input = document.getElementById('builder-exercise-search');
        if (input) input.value = '';
        const res = document.getElementById('builder-exercise-results');
        if (res) res.innerHTML = '';
    },

    builderSearchExercises(query) {
        const container = document.getElementById('builder-exercise-results');
        if (!container) return;
        const q = String(query || '').trim();
        if (q.length < 2) {
            container.innerHTML = '';
            container.hidden = true;
            return;
        }
        container.hidden = false;
        let results = [];
        try {
            results = (typeof searchExercises === 'function' ? searchExercises(q) : Object.values(EXERCISES_DB).filter(e => e.name.toLowerCase().includes(q.toLowerCase())))
                .filter(ex => ex && !ex.hidden).slice(0, 15);
        } catch (e) {
            results = [];
        }
        const day = this.builderState.days[this.builderState.currentDayIndex];
        const existing = new Set(day.exercises.map(e => e.exerciseId));
        if (!results.length) {
            container.innerHTML = `<p class="row muted">Nessun esercizio per «${GT.esc(q)}»</p>`;
            return;
        }
        container.innerHTML = results.map(ex => {
            const added = existing.has(ex.id);
            return `<button type="button" class="row ed__result" data-add-ex="${GT.esc(ex.id)}"${added ? ' disabled aria-disabled="true"' : ''}>
                <span class="thumb thumb--sm">${this._oggiThumb(ex.id, '')}</span>
                <span class="row__body"><span class="row__title">${GT.esc(ex.name)}</span><span class="row__sub">${GT.esc((ex.primaryMuscles || []).join(', '))}</span></span>
                <span class="row__end">${this.ico(added ? 'check' : 'plus')}</span>
            </button>`;
        }).join('');
    },

    builderAddExercise(exerciseId) {
        const exercise = EXERCISES_DB[exerciseId];
        if (!exercise) return;
        const day = this.builderState.days[this.builderState.currentDayIndex];
        if (!day) return;
        if (day.exercises.some(e => e.exerciseId === exerciseId)) {
            this.showNotification(`${exercise.name} c'è già`, 'info');
            return;
        }
        const isCompound = exercise.type === 'compound';
        const time = exercise.metric === 'time';
        day.exercises.push({
            exerciseId: exercise.id,
            name: exercise.name,
            sets: isCompound ? 4 : 3,
            reps: time ? '30-45' : (isCompound ? '6-10' : '10-15'),
            rest: this._defaultRest(exercise.id),
            metric: time ? 'time' : undefined
        });
        this.builderState.openEx = day.exercises.length - 1;
        this._edRender();
        const search = document.getElementById('builder-exercise-search');
        if (search?.value) this.builderSearchExercises(search.value);
        setTimeout(() => {
            try { document.querySelector(`#builder-current-day-exercises [data-ed-toggle="${day.exercises.length - 1}"]`)?.scrollIntoView({ block: 'nearest' }); } catch (e) { /* no-op */ }
        }, 30);
        this.showNotification(`${exercise.name} aggiunto`, 'success', { icon: 'plus' });
    },

    async builderSaveProgram() {
        const days = this.builderState.days;
        if (!days.length) {
            this.showNotification('Aggiungi almeno un giorno', 'warning');
            return;
        }
        const nameless = days.findIndex(d => !String(d.name || '').trim());
        if (nameless >= 0) {
            this.builderSelectDay(nameless);
            this.showNotification('Dai un nome a tutti i giorni', 'warning');
            document.getElementById('ed-day-name')?.focus();
            return;
        }
        // Niente giorni vuoti: diventerebbero sedute a 0 esercizi
        const emptyIdx = days.findIndex(d => !d.exercises.length);
        if (emptyIdx >= 0) {
            this.builderSelectDay(emptyIdx);
            this.showNotification(`${days[emptyIdx].name}: nessun esercizio`, 'warning');
            return;
        }

        const old = this.builderState.isEditing ? Storage.getActiveProgram() : null;
        if (!this.builderState.isEditing) {
            const existing = Storage.getActiveProgram();
            if (existing?.days?.length) {
                const ok = await this.confirmSheet({
                    title: `Sostituire ${this._oggiProgramLabel(existing)}?`,
                    text: 'Lo storico resta.',
                    ok: 'Sostituisci la scheda',
                    cancel: 'Tieni questa'
                });
                if (!ok) return;
            }
        }

        const dirty = this._edDirty();
        const profile = Storage.getProfile();
        const newDays = days.map((day, i) => {
            const srcDay = day._src || null;
            const exercises = day.exercises.map(ex => {
                const base = ex._src ? { ...ex._src } : {};
                const out = {
                    ...base,
                    exerciseId: ex.exerciseId,
                    name: ex.name,
                    sets: this._clampInt(ex.sets, 3, 1, 10),
                    reps: this._cleanReps(ex.reps, '8-12'),
                    rest: this._clampInt(ex.rest, this._defaultRest(ex.exerciseId), 15, 600),
                    type: EXERCISES_DB[ex.exerciseId]?.type || base.type || 'compound',
                    notes: base.notes || ''
                };
                if (ex.metric) out.metric = ex.metric;
                this.SUPERSET_KEYS.forEach(k => {
                    if (ex[k] === undefined) delete out[k];
                    else out[k] = ex[k];
                });
                return out;
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
            // Modifica: si conserva tutto (ciclo, tempo, goal, programId, numero ciclo…)
            metadata = {
                ...old.metadata,
                daysPerWeek: newDays.length,
                weeklyVolume: this.builderCalcWeeklyVolume(newDays)
            };
            // Scheda generata modificata a mano: la rotazione di fine ciclo non la riscrive
            if (dirty && !this._schedaIsManual(old)) {
                metadata.isManual = true;
                metadata.editedAt = new Date().toISOString();
            }
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
            name: old?.name || 'Scheda a mano',
            days: newDays,
            metadata
        };

        if (Storage.setActiveProgram(program) === false) {
            this.showNotification('Memoria piena: scheda non salvata', 'error');
            return;
        }
        this.builderState.snapshot = this._edSnapshot();
        this._closeModal('manual-builder-modal');
        this.loadPrograms();
        this.loadDashboard();
        this._safe(() => this.loadProgress());
        this.showNotification(this.builderState.isEditing ? 'Scheda aggiornata' : 'Scheda creata', 'success', { icon: 'check' });
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
        const db = (typeof Warmups !== 'undefined' && Warmups.WARMUPS_DB) || {};
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
});
