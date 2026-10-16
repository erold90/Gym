/**
 * GymTracker 2.0 — area PROGRESSI: costanza (calendario a quadretti), muscoli (mappa del corpo + barre con
 * la fascia consigliata), forza per esercizio, record, peso corporeo, cicli, storico delle sedute con
 * dettaglio, modifica ed eliminazione (fogli). Grafici in SVG disegnati qui: nessuna libreria.
 *
 * Regole dei dati (v2): le serie con isWarmup/isCalibration non contano (volume, forza, record);
 * corpo libero e zavorra: il peso è la zavorra (0 se non c'è; isBodyweight vecchio = 0);
 * esercizi con metric 'time': le ripetizioni sono secondi e non c'è massimale stimato.
 */

Object.assign(App, {
    // ========================================
    // MAPPA DEL CORPO (da design/body-map.html, generata da tools/bodymap.py)
    // ========================================

    _BODY: (() => {
        const base = [
            ['e', '50 16.5 10 12.5'],
            ['p', 'M 50 34 C 44 34 38 35 31 38 C 27 40 25 44 26 50 L 33 56 C 33 70 35 84 37 96 C 36 102 34 108 34 114 L 50 124 L 66 114 C 66 108 64 102 63 96 C 65 84 67 70 67 56 L 74 50 C 75 44 73 40 69 38 C 62 35 56 34 50 34 Z'],
            ['p', 'M 44.5 26 L 55.5 26 L 56 36 L 44 36 Z'],
            ['p', 'M 27 41 C 23 45 22 52 23 60 C 23 68 23 76 24 82 C 21 92 19 104 19 116 L 25 117 C 27 106 30 94 32 84 C 34 76 35 64 34 54 C 33 48 31 43 27 41 Z'],
            ['p', 'M 73 41 C 77 45 78 52 77 60 C 77 68 77 76 76 82 C 79 92 81 104 81 116 L 75 117 C 73 106 70 94 68 84 C 66 76 65 64 66 54 C 67 48 69 43 73 41 Z'],
            ['p', 'M 34 112 C 33 128 34 146 37 164 C 37 180 38 196 40 210 L 47 210 C 48 196 49 180 48 166 C 50 148 51 130 50 120 Z'],
            ['p', 'M 66 112 C 67 128 66 146 63 164 C 63 180 62 196 60 210 L 53 210 C 52 196 51 180 52 166 C 50 148 49 130 50 120 Z'],
            ['p', 'M 39 210 L 47 210 L 48 220 C 45 222 40 222 37 220 Z'],
            ['p', 'M 61 210 L 53 210 L 52 220 C 55 222 60 222 63 220 Z'],
            ['e', '22 123 4 7'],
            ['e', '78 123 4 7']
        ];
        const arms = [
            ['avambracci', 'M 24 84 C 26.5 82.5 29.5 82.5 31.5 84 C 30 94 28 104 25.5 114 C 23.8 115 21.5 115 20 114 C 20 104 21.5 93 24 84 Z'],
            ['avambracci', 'M 76 84 C 73.5 82.5 70.5 82.5 68.5 84 C 70 94 72 104 74.5 114 C 76.2 115 78.5 115 80 114 C 80 104 78.5 93 76 84 Z']
        ];
        const upperArm = (m) => [
            [m, 'M 25.5 53.5 C 28 52.5 31 52.5 33.8 53.5 C 34.3 61 33.5 69 31.5 76 C 29.5 78 26.5 78 24.5 76 C 23.5 68 23.8 60 25.5 53.5 Z'],
            [m, 'M 74.5 53.5 C 72 52.5 69 52.5 66.2 53.5 C 65.7 61 66.5 69 68.5 76 C 70.5 78 73.5 78 75.5 76 C 76.5 68 76.2 60 74.5 53.5 Z']
        ];
        return {
            base,
            front: {
                label: 'Fronte',
                m: [
                    ['spalle', 'M 27.5 40 C 31 38 35 38 38 39.5 C 36 42.5 34.5 46 34 51 C 31 50 28 50 25.5 51.5 C 25 46 25.5 42.5 27.5 40 Z'],
                    ['spalle', 'M 72.5 40 C 69 38 65 38 62 39.5 C 64 42.5 65.5 46 66 51 C 69 50 72 50 74.5 51.5 C 75 46 74.5 42.5 72.5 40 Z'],
                    ['petto', 'M 49.2 41 C 45 39.5 40 40 37.5 42.5 C 35.5 45 34.5 49 35 53 C 37 58 43 60.5 49.2 58.5 Z'],
                    ['petto', 'M 50.8 41 C 55 39.5 60 40 62.5 42.5 C 64.5 45 65.5 49 65 53 C 63 58 57 60.5 50.8 58.5 Z'],
                    ...upperArm('bicipiti'),
                    ...arms,
                    ['addome', 'M 36 57 C 38 62 40 66 40.5 70 L 40 94 C 38.5 92 37.5 89 37 85 C 36 76 35.5 66 36 57 Z'],
                    ['addome', 'M 64 57 C 62 62 60 66 59.5 70 L 60 94 C 61.5 92 62.5 89 63 85 C 64 76 64.5 66 64 57 Z'],
                    ['addome', 'M 42 61 C 46 60 54 60 58 61 L 58.5 95 C 55 100 45 100 41.5 95 Z'],
                    ['quadricipiti', 'M 35 114 C 39 112 44 114 49 121 C 49.5 135 48.5 150 46.5 162 C 44 165 40.5 165 38.5 162 C 35.5 148 34.5 130 35 114 Z'],
                    ['quadricipiti', 'M 65 114 C 61 112 56 114 51 121 C 50.5 135 51.5 150 53.5 162 C 56 165 59.5 165 61.5 162 C 64.5 148 65.5 130 65 114 Z'],
                    ['polpacci', 'M 38.5 172 C 41 169.5 45 169.5 47.5 172 C 48 184 47.5 196 46 206 C 44 207.5 41.5 207.5 40.5 206 C 38.5 196 37.5 184 38.5 172 Z'],
                    ['polpacci', 'M 61.5 172 C 59 169.5 55 169.5 52.5 172 C 52 184 52.5 196 54 206 C 56 207.5 58.5 207.5 59.5 206 C 61.5 196 62.5 184 61.5 172 Z']
                ],
                seams: ['M 50 61 L 50 99', 'M 42 72 L 58 72', 'M 42 83 L 58 83', 'M 41.5 128 C 42.5 140 43.2 152 43.5 162', 'M 58.5 128 C 57.5 140 56.8 152 56.5 162']
            },
            back: {
                label: 'Retro',
                m: [
                    ['trapezio', 'M 50 30 C 47 33 42 36 36.5 38.5 C 41 41 46 47 50 66 C 54 47 59 41 63.5 38.5 C 58 36 53 33 50 30 Z'],
                    ['spalle', 'M 27.5 40 C 30.5 38.5 34 38.5 36.5 39.5 C 35 43 34 46.5 33.5 51 C 31 50 28 50 25.5 51.5 C 25 46 25.5 42.5 27.5 40 Z'],
                    ['spalle', 'M 72.5 40 C 69.5 38.5 66 38.5 63.5 39.5 C 65 43 66 46.5 66.5 51 C 69 50 72 50 74.5 51.5 C 75 46 74.5 42.5 72.5 40 Z'],
                    ['schiena', 'M 37.5 41.5 C 41 44 45 49 49.2 67 L 49.2 86 C 45 84 41 79 38 72 C 35.5 64 35 52 37.5 41.5 Z'],
                    ['schiena', 'M 62.5 41.5 C 59 44 55 49 50.8 67 L 50.8 86 C 55 84 59 79 62 72 C 64.5 64 65 52 62.5 41.5 Z'],
                    ['schiena', 'M 42 87 C 45 89 47.5 90 50 90.5 C 52.5 90 55 89 58 87 L 59 100 C 55 103 45 103 41 100 Z'],
                    ...upperArm('tricipiti'),
                    ...arms,
                    ['glutei', 'M 35.5 103 C 39 101.5 45 102 49.3 104 L 49.3 124 C 46 128 40 128 37 124.5 C 34.5 118 34.5 110 35.5 103 Z'],
                    ['glutei', 'M 64.5 103 C 61 101.5 55 102 50.7 104 L 50.7 124 C 54 128 60 128 63 124.5 C 65.5 118 65.5 110 64.5 103 Z'],
                    ['femorali', 'M 36 130 C 39.5 131.5 45 131.5 49 130 C 49.5 142 48.5 153 46.5 162 C 44 165 40.5 165 38.5 162 C 36.5 152 35.5 141 36 130 Z'],
                    ['femorali', 'M 64 130 C 60.5 131.5 55 131.5 51 130 C 50.5 142 51.5 153 53.5 162 C 56 165 59.5 165 61.5 162 C 63.5 152 64.5 141 64 130 Z'],
                    ['polpacci', 'M 38 171 C 41 168.5 45.5 168.5 48 171 C 49 180 48.5 190 46 199 C 44 201 41.5 201 40 199 C 37.5 190 37 180 38 171 Z'],
                    ['polpacci', 'M 62 171 C 59 168.5 54.5 168.5 52 171 C 51 180 51.5 190 54 199 C 56 201 58.5 201 60 199 C 62.5 190 63 180 62 171 Z']
                ],
                seams: ['M 50 66 L 50 87', 'M 42.5 132 C 43 142 43.3 152 43.5 162', 'M 57.5 132 C 57 142 56.7 152 56.5 162']
            }
        };
    })(),

    // Serie settimanali → 5 gradini di calore (0 · 1-5 · 6-9 · 10-14 · 15+)
    _heatStep(n) {
        return n <= 0 ? 0 : n <= 5 ? 1 : n <= 9 ? 2 : n <= 14 ? 3 : 4;
    },

    _bodySvg(side, sets) {
        const B = this._BODY;
        const s = B[side];
        const base = B.base.map(([t, v]) => {
            if (t === 'e') {
                const [cx, cy, rx, ry] = v.split(' ');
                return `<ellipse class="base" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/>`;
            }
            return `<path class="base" d="${v}"/>`;
        }).join('');
        const muscles = s.m.map(([m, d]) => `<path class="m" data-m="${m}" data-h="${this._heatStep(sets[m] || 0)}" d="${d}"/>`).join('');
        const seams = s.seams.map(d => `<path class="seam" d="${d}"/>`).join('');
        return `<figure><svg viewBox="0 0 100 226" aria-hidden="true" focusable="false">${base}${muscles}${seams}</svg><figcaption>${s.label}</figcaption></figure>`;
    },

    // ========================================
    // GUSCIO DELL'AREA
    // ========================================

    htmlProgressi() {
        return `
            <header class="head"><h1>Progressi</h1></header>

            <div class="wide">
                <div class="col">
                    <section class="section" aria-labelledby="pg-cal-t">
                        <div class="section__head"><h2 id="pg-cal-t">Costanza</h2><span class="pg-meta" id="pg-cal-meta"></span></div>
                        <div class="heat pg-heat" id="pg-heat" role="img" aria-label="Calendario delle sedute"></div>
                        <div class="pg-months" id="pg-months" aria-hidden="true"></div>
                        <div class="legend pg-legend" aria-hidden="true">
                            <span><i class="pg-sw" style="background:var(--heat-0)"></i>riposo</span>
                            <span><i class="pg-sw" style="background:var(--heat-2)"></i>seduta breve</span>
                            <span><i class="pg-sw" style="background:var(--heat-4)"></i>seduta</span>
                            <span><i class="pg-sw" style="background:var(--phase-acc)"></i>cardio</span>
                        </div>
                    </section>

                    <section class="section" aria-labelledby="pg-mus-t">
                        <div class="section__head"><h2 id="pg-mus-t">Muscoli</h2><span class="pg-meta">serie questa settimana</span></div>
                        <div class="body" id="pg-body" role="img" aria-label="Mappa del corpo"></div>
                        <div class="scale" aria-hidden="true"><span class="num">0</span><span class="scale__bar"><i></i><i></i><i></i><i></i><i></i></span><span class="num">15+</span><span>serie</span></div>
                        <div class="bars" id="muscle-volume-bars"></div>
                    </section>
                </div>

                <div class="col">
                    <section class="section" aria-labelledby="pg-str-t">
                        <div class="section__head"><h2 id="pg-str-t">Forza</h2><span class="pg-meta" id="pg-str-meta">massimale stimato</span></div>
                        <div class="chips chips--scroll" role="radiogroup" aria-label="Esercizio del grafico" id="pg-str-chips"></div>
                        <div class="pg-str" id="pg-str-body"></div>
                    </section>

                    <section class="section" aria-labelledby="pg-pr-t">
                        <div class="section__head"><h2 id="pg-pr-t">Record</h2>
                            <button type="button" class="link" id="pg-pr-all" hidden>Tutti${this.ico('next', 'ico--sm')}</button></div>
                        <div id="prs-list"></div>
                    </section>

                    <section class="section" id="pg-bw-sec" aria-labelledby="pg-bw-t">
                        <div class="section__head"><h2 id="pg-bw-t">Peso e misure</h2>
                            <button type="button" class="btn btn--secondary btn--sm" id="toggle-weight-form" aria-expanded="false" aria-controls="body-measurement-form">${this.ico('plus', 'ico--sm')}Aggiungi</button></div>
                        <form id="body-measurement-form" class="pg-bwform" hidden novalidate>
                            <div class="pg-mfields">
                                <div class="field pg-mf pg-mf--w">
                                    <label for="measure-weight">Peso</label>
                                    <span class="pg-bwfield"><input class="input num" type="text" id="measure-weight" inputmode="decimal" autocomplete="off"><span aria-hidden="true">kg</span></span>
                                </div>
                                ${this.MEASURES.map(([k, l]) => `<div class="field pg-mf">
                                    <label for="measure-${k}">${l}</label>
                                    <span class="pg-bwfield"><input class="input num" type="text" id="measure-${k}" data-measure="${k}" inputmode="decimal" autocomplete="off"><span aria-hidden="true">cm</span></span>
                                </div>`).join('')}
                            </div>
                            <button type="submit" class="btn btn--primary btn--block">${this.ico('check')}Salva</button>
                        </form>
                        <div class="pg-bwblocks" id="pg-bw-blocks">
                            <div id="pg-ms-body" class="pg-msbox"></div>
                            <div id="pg-bw-body"></div>
                        </div>
                    </section>

                    <section class="section" aria-labelledby="pg-cyc-t">
                        <div class="section__head"><h2 id="pg-cyc-t">Cicli</h2></div>
                        <div id="cycle-history-list"></div>
                    </section>

                    <section class="section" aria-labelledby="pg-hist-t">
                        <div class="section__head"><h2 id="pg-hist-t">Sedute</h2><span class="pg-meta" id="pg-hist-meta"></span></div>
                        <div id="workout-history-list"></div>
                        <button type="button" class="btn btn--ghost btn--block" id="pg-hist-more" hidden>Mostra altre</button>
                    </section>
                </div>
            </div>
        `;
    },

    bindProgressi() {
        const on = (id, ev, fn) => this._on(id, ev, fn);

        on('body-measurement-form', 'submit', (e) => {
            e.preventDefault();
            this.saveMeasurement();
        });
        on('toggle-weight-form', 'click', () => this._toggleWeightForm());

        on('pg-str-chips', 'click', (e) => {
            const chip = e.target.closest('.chip');
            if (!chip) return;
            if (chip.dataset.more) {
                const ids = new Set(this._strengthCandidates().map(c => c.id));
                this.pickExercise({
                    title: 'Forza: scegli l\'esercizio',
                    filter: ex => ids.has(ex.id),
                    onPick: (id) => { this._strengthId = id; this._renderStrength(); }
                });
                return;
            }
            this._strengthId = chip.dataset.id;
            this._renderStrength();
        });

        on('pg-pr-all', 'click', () => this._openAllRecords());
        on('prs-list', 'click', (e) => {
            const row = e.target.closest('[data-ex]');
            if (row) this.openExercise(row.dataset.ex);
        });

        on('workout-history-list', 'click', (e) => {
            const row = e.target.closest('[data-workout-id], [data-cardio-id]');
            if (!row) return;
            if (row.dataset.workoutId) this.showWorkoutDetail(row.dataset.workoutId);
            else this._showCardioDetail(row.dataset.cardioId);
        });
        on('pg-hist-more', 'click', () => {
            this._histLimit = (this._histLimit || 10) + 10;
            this.loadWorkoutHistory();
        });
    },

    enterProgressi() {
        this._histLimit = 10;
        this.loadProgress();
    },

    // Ogni sezione si ridisegna da sola: un errore in una non spegne le altre.
    // Solo con Progressi aperta: le altre aree la chiamano dopo un salvataggio, ma se la pagina non si
    // vede la ridisegna enterProgressi alla prossima apertura (R1-10)
    loadProgress() {
        if (this.currentPage !== 'progressi') return;
        this._pgWorkouts = this._safe(() => Storage.getWorkouts()) || [];
        [
            () => this._renderHeat(),
            () => this.loadMuscleVolumeBars(),
            () => this._renderStrength(),
            () => this.loadPersonalRecords(),
            () => this._renderWeight(),
            () => this._renderMeasures(),
            () => this.loadCycleHistory(),
            () => this.loadWorkoutHistory()
        ].forEach(fn => this._safe(fn));
    },

    // Nomi della v1.26 chiamati da altre aree (tema cambiato, cardio salvato, Oggi)
    initCharts() {
        if (this.currentPage !== 'progressi') return;
        this._safe(() => this._renderStrength());
        this._safe(() => this._renderWeight());
    },
    loadConditioningProgress() {
        this.loadProgress();
    },
    loadProgressCycleInfo() {
        if (this.currentPage !== 'progressi') return;
        this._safe(() => this.loadCycleHistory());
    },

    // ========================================
    // AIUTI: serie valide, date, numeri
    // ========================================

    // Serie di lavoro fatte: completate, con ripetizioni, né riscaldamento né prova
    _workSets(ex) {
        return (ex && Array.isArray(ex.sets) ? ex.sets : [])
            .filter(s => s && s.completed && !s.isWarmup && !s.isCalibration && GT.num(s.reps) > 0);
    },

    // Peso registrato: la zavorra per il corpo libero (il vecchio isBodyweight valeva il peso corporeo → 0)
    _setKg(s) {
        return s && s.isBodyweight ? 0 : Math.max(0, GT.num(s && s.weight));
    },

    _wTime(w) {
        const t = new Date(w && w.date).getTime();
        return Number.isFinite(t) ? t : NaN;
    },

    _wName(w) {
        return (w && (w.name || w.type)) || 'Seduta';
    },

    _wSets(w) {
        return (w.exercises || []).reduce((n, ex) => n + this._workSets(ex).length, 0);
    },

    _wVolume(w) {
        return (w.exercises || []).filter(ex => this._volumeCounts(ex?.exerciseId)).reduce((sum, ex) => sum + this._workSets(ex)
            .reduce((v, s) => v + this._setKg(s) * Math.round(GT.num(s.reps)), 0), 0);
    },

    // Esercizi che non fanno volume in kg: a tempo (kg × secondi) e assistiti (il peso è l'aiuto) (R1-14).
    // Metadati dall'algoritmo (come la seduta), ripiego sul database
    _volumeCounts(exerciseId) {
        let meta = null;
        if (typeof TrainingAlgorithm !== 'undefined' && typeof TrainingAlgorithm.getExerciseMeta === 'function') {
            meta = this._safe(() => TrainingAlgorithm.getExerciseMeta(exerciseId));
        }
        const db = EXERCISES_DB[exerciseId];
        const any = (k, v) => (meta && meta[k] === v) || (db && db[k] === v);
        return !any('metric', 'time') && !any('loadType', 'assisted');
    },

    _isTimedEx(id) {
        return EXERCISES_DB[id]?.metric === 'time';
    },

    // "102,5 × 10" · "12 rip." (corpo libero senza zavorra) · "45 s" (a tempo)
    _fmtSetShort(id, w, r) {
        if (this._isTimedEx(id)) return `${this.fmt(r)} s`;
        return GT.num(w) > 0 ? `${this.fmt(w)} × ${this.fmt(r)}` : `${this.fmt(r)} rip.`;
    },

    _relDay(date) {
        const s = GT.formatRelativeDay(date);
        return s ? s.charAt(0).toLowerCase() + s.slice(1) : '';
    },

    _shortDate(date) {
        const d = new Date(date);
        return isNaN(d) ? '' : `${d.getDate()} ${GT._MESI[d.getMonth()]}`;
    },

    _period(days) {
        if (!(days > 0)) return '';
        if (days >= 14) return `${Math.round(days / 7)} sett.`;
        return days === 1 ? '1 giorno' : `${days} giorni`;
    },

    // ========================================
    // COSTANZA: calendario a quadretti
    // ========================================

    _renderHeat() {
        const box = document.getElementById('pg-heat');
        const months = document.getElementById('pg-months');
        if (!box) return;
        const wide = !!window.matchMedia?.('(min-width: 960px)').matches;
        const weeks = wide ? 26 : 16;
        const today = GT.startOfDay(new Date());
        const first = GT.addDays(GT.startOfWeek(today), -(weeks - 1) * 7);

        const days = new Map();   // 'AAAA-MM-GG' → {sets, short, cardio}
        let sessions = 0;
        (this._pgWorkouts || []).forEach(w => {
            const t = this._wTime(w);
            if (!(t >= first.getTime())) return;
            const k = GT.dateKey(new Date(t));
            const d = days.get(k) || { full: false, any: false, cardio: false };
            const sets = this._wSets(w);
            d.any = true;
            if (!w.compressed && sets >= 8) d.full = true;
            days.set(k, d);
            sessions++;
        });
        let cardio = 0;
        (this._safe(() => Storage.getConditioningSessions()) || []).forEach(s => {
            const t = new Date(s.date).getTime();
            if (!(t >= first.getTime())) return;
            const k = GT.dateKey(new Date(t));
            const d = days.get(k) || { full: false, any: false, cardio: false };
            d.cardio = true;
            days.set(k, d);
            cardio++;
        });

        let cells = '';
        for (let i = 0; i < weeks * 7; i++) {
            const day = GT.addDays(first, i);
            const k = GT.dateKey(day);
            const d = days.get(k);
            const v = d ? (d.any ? (d.full ? '2' : '1') : (d.cardio ? 'c' : '')) : '';
            const cls = k === GT.dateKey(today) ? ' class="is-today"' : (day > today ? ' class="is-future"' : '');
            cells += `<i${cls}${v ? ` data-v="${v}"` : ''}></i>`;
        }
        box.style.setProperty('--weeks', weeks);
        box.innerHTML = cells;

        // Mesi sotto le colonne: dove cambia il mese del lunedì, senza etichette sovrapposte
        if (months) {
            const labels = [];
            for (let wk = 0; wk < weeks; wk++) {
                const m = GT.addDays(first, wk * 7).getMonth();
                const prev = wk ? GT.addDays(first, (wk - 1) * 7).getMonth() : -1;
                if (m !== prev) labels.push({ wk, text: GT._MESI[m] });
            }
            if (labels.length > 1 && labels[1].wk - labels[0].wk < 3) labels.shift();
            months.style.setProperty('--weeks', weeks);
            months.innerHTML = labels.filter(l => l.wk <= weeks - 2).map(l => `<span style="grid-column:${l.wk + 1}">${l.text}</span>`).join('');
        }

        const mesi = Math.round(weeks / 4.35);
        const streak = this._safe(() => Storage.getStreak()) || {};
        const meta = document.getElementById('pg-cal-meta');
        if (meta) meta.innerHTML = `<span class="num">${sessions}</span>&nbsp;${sessions === 1 ? 'seduta' : 'sedute'} in ${mesi} mesi`;
        box.setAttribute('aria-label', `Calendario delle ultime ${weeks} settimane: ${sessions} sedute${cardio ? `, ${cardio} cardio` : ''}${streak.current ? `, ${streak.current} settimane di fila` : ''}`);
    },

    // ========================================
    // MUSCOLI: mappa del corpo + barre con la fascia consigliata
    // ========================================

    // Serie fatte questa settimana per muscolo: primari 1, secondari 0,5
    _weeklyMuscleSets() {
        const start = GT.startOfWeek(new Date()).getTime();
        const end = GT.addDays(GT.startOfWeek(new Date()), 7).getTime();
        const out = {};
        (this._pgWorkouts || []).forEach(w => {
            const t = this._wTime(w);
            if (!(t >= start && t < end)) return;
            (w.exercises || []).forEach(ex => {
                const db = EXERCISES_DB[ex.exerciseId];
                const n = this._workSets(ex).length;
                if (!db || !n) return;
                (db.primaryMuscles || []).forEach(m => { out[m] = (out[m] || 0) + n; });
                (db.secondaryMuscles || []).forEach(m => { out[m] = (out[m] || 0) + n * 0.5; });
            });
        });
        return out;
    },

    // Fascia consigliata per muscolo: scheda (v2) → getVolumeTargets (G5) → VOLUME_CONFIG
    _volumeTargets() {
        const program = this._safe(() => Storage.getActiveProgram());
        const md = program?.metadata || {};
        const valid = (t) => t && typeof t === 'object' && Object.values(t).some(x => x && Number.isFinite(+x.min) && Number.isFinite(+x.max));
        if (valid(md.volumeTargets)) return md.volumeTargets;
        const profile = this._safe(() => Storage.getProfile()) || {};
        const level = md.level || profile.level || 'intermediate';
        const goal = md.goal || profile.goal || 'hypertrophy';
        const days = md.daysPerWeek || program?.days?.length || profile.daysPerWeek || 3;
        const TA = typeof TrainingAlgorithm !== 'undefined' ? TrainingAlgorithm : null;
        if (TA && typeof TA.getVolumeTargets === 'function') {
            const t = this._safe(() => TA.getVolumeTargets(level, goal, md.emphasis ?? profile.emphasis ?? '', days));
            if (valid(t)) return t;
        }
        const V = TA?.VOLUME_CONFIG?.[level] || { min: 10, max: 16 };
        const core = TA?.CORE_VOLUME?.[level] || 8;
        const big = { min: V.min, max: V.max };
        return {
            petto: big, schiena: big, quadricipiti: big, femorali: big, glutei: big,
            spalle: { min: V.min, max: V.max + 6 },
            bicipiti: { min: Math.max(0, V.min - 2), max: V.max + 6 },
            tricipiti: { min: Math.max(0, V.min - 2), max: V.max + 6 },
            polpacci: { min: level === 'beginner' ? 6 : 8, max: 12 },
            addome: { min: core, max: Math.round(core * 1.5) }
        };
    },

    loadMuscleVolumeBars() {
        const bodyBox = document.getElementById('pg-body');
        const container = document.getElementById('muscle-volume-bars');
        const sets = this._weeklyMuscleSets();
        const has = Object.values(sets).some(v => v > 0);

        if (bodyBox) {
            bodyBox.innerHTML = this._bodySvg('front', sets) + this._bodySvg('back', sets);
            const top = Object.entries(sets).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1])
                .map(([m, v]) => `${this._muscleName(m).toLowerCase()} ${this.fmt(v, 1)}`);
            bodyBox.setAttribute('aria-label', has ? `Serie di questa settimana: ${top.join(', ')}` : 'Nessuna serie questa settimana');
        }
        if (!container) return;
        if (!has) {
            container.innerHTML = '<p class="muted pg-empty">Nessuna seduta questa settimana</p>';
            return;
        }

        const targets = this._volumeTargets();
        const names = ['petto', 'schiena', 'spalle', 'bicipiti', 'tricipiti', 'quadricipiti', 'femorali', 'glutei', 'polpacci', 'addome', 'trapezio', 'avambracci'];
        const shown = names.filter(m => (sets[m] || 0) > 0 || (targets[m] && +targets[m].min > 0));
        shown.sort((a, b) => (sets[b] || 0) - (sets[a] || 0) || names.indexOf(a) - names.indexOf(b));
        const maxGoal = Math.max(0, ...shown.map(m => +(targets[m]?.max) || 0));
        const scale = Math.max(maxGoal * 1.25, ...shown.map(m => sets[m] || 0), 1);
        const pct = (v) => `${Math.min(100, (v / scale) * 100).toFixed(1)}%`;

        container.setAttribute('aria-label', 'Serie per muscolo con la fascia consigliata');
        container.innerHTML = shown.map(m => {
            const v = sets[m] || 0;
            const t = targets[m];
            const lo = t ? +t.min : 0;
            const hi = t ? +t.max : 0;
            const goal = t && hi > 0 ? `<span class="bar__goal" style="--g0:${pct(lo)};--g1:${pct(hi)}"></span>` : '';
            const low = t && v < lo;
            return `<div class="bar">
                    <span>${GT.esc(this._muscleName(m))}</span>
                    <span class="bar__track" aria-hidden="true">${goal}<span class="bar__fill${low ? ' is-low' : ''}" style="--v:${pct(v)}"></span></span>
                    <span class="num">${this.fmt(v, 1)}</span>
                    <span class="sr-only">serie${t && hi > 0 ? `, consigliate ${this.fmt(lo)}-${this.fmt(hi)}` : ''}</span>
                </div>`;
        }).join('');
    },

    // ========================================
    // FORZA: massimale stimato (o ripetizioni / secondi) per esercizio
    // ========================================

    // Come si misura la forza di un esercizio: massimale stimato, ripetizioni o secondi
    _strengthMetric(id) {
        const ex = EXERCISES_DB[id];
        if (!ex) return 'e1rm';
        if (ex.metric === 'time') return 'time';
        if (['bodyweight', 'bodyweight-loadable', 'assisted'].includes(ex.loadType)) return 'reps';
        return 'e1rm';
    },

    // Una voce per seduta: {t, v, w, r} dalla più vecchia
    _strengthSeries(id) {
        const metric = this._strengthMetric(id);
        const out = [];
        (this._pgWorkouts || []).slice().reverse().forEach(w => {
            const t = this._wTime(w);
            if (!Number.isFinite(t)) return;
            let best = null;
            (w.exercises || []).forEach(ex => {
                if (ex.exerciseId !== id) return;
                this._workSets(ex).forEach(s => {
                    const kg = this._setKg(s);
                    const r = Math.round(GT.num(s.reps));
                    let v;
                    if (metric === 'e1rm') {
                        if (!(kg > 0)) return;
                        v = Storage.calculateE1RM(kg, r);
                    } else {
                        v = r;
                    }
                    if (!best || v > best.v) best = { t, v, w: kg, r };
                });
            });
            if (best && best.v > 0) out.push(best);
        });
        return out;
    },

    // Esercizi con almeno una seduta misurabile, dal più frequente
    _strengthCandidates() {
        const count = new Map();
        (this._pgWorkouts || []).forEach(w => {
            const seen = new Set();
            (w.exercises || []).forEach(ex => {
                if (!EXERCISES_DB[ex.exerciseId] || seen.has(ex.exerciseId)) return;
                const metric = this._strengthMetric(ex.exerciseId);
                const ok = this._workSets(ex).some(s => metric !== 'e1rm' || this._setKg(s) > 0);
                if (!ok) return;
                seen.add(ex.exerciseId);
                count.set(ex.exerciseId, (count.get(ex.exerciseId) || 0) + 1);
            });
        });
        // Esercizi principali della scheda (role 'main', uno per giorno): fissati in testa ai chip
        const program = this._safe(() => Storage.getActiveProgram());
        const mains = [];
        (program?.days || []).forEach(d => (d?.exercises || []).forEach(e => {
            if (e && e.role === 'main' && e.exerciseId && !mains.includes(e.exerciseId)) mains.push(e.exerciseId);
        }));
        const best = (id) => { const ser = this._strengthSeries(id); return ser.length ? Math.max(...ser.map(p => p.v)) : 0; };
        const list = [...count.entries()].map(([id, n]) => ({
            id, n, name: EXERCISES_DB[id].name,
            main: mains.indexOf(id), compound: EXERCISES_DB[id].type === 'compound', best: best(id)
        }));
        // Prima i principali (nell'ordine della scheda); poi i più frequenti e, a pari frequenza,
        // multiarticolari e massimale più alto, non l'alfabeto (R2-09)
        return list.sort((a, b) => {
            const am = a.main >= 0, bm = b.main >= 0;
            if (am !== bm) return am ? -1 : 1;
            if (am && bm) return a.main - b.main;
            return (b.n - a.n) || (Number(b.compound) - Number(a.compound)) || (b.best - a.best) || a.name.localeCompare(b.name, 'it');
        }).map(c => ({ ...c, main: c.main >= 0 }));
    },

    _renderStrength() {
        const chipsEl = document.getElementById('pg-str-chips');
        const body = document.getElementById('pg-str-body');
        if (!chipsEl || !body) return;
        const cands = this._strengthCandidates();
        if (!cands.length) {
            chipsEl.hidden = true;
            body.innerHTML = `<div class="pg-empty-box">${this.ico('progress', 'ico--lg')}<p class="muted">Fai 2 sedute e qui vedi la tua forza</p></div>`;
            this._setText('pg-str-meta', 'massimale stimato');
            return;
        }
        if (!this._strengthId || !cands.some(c => c.id === this._strengthId)) this._strengthId = cands[0].id;
        const id = this._strengthId;
        const top = cands.slice(0, Math.max(5, cands.filter(c => c.main).length));
        if (!top.some(c => c.id === id)) top.splice(cands.filter(c => c.main).length, 0, cands.find(c => c.id === id));
        chipsEl.hidden = false;
        chipsEl.innerHTML = top.map(c => `<button type="button" class="chip" role="radio" aria-checked="${c.id === id}" data-id="${GT.esc(c.id)}">${GT.esc(c.name)}</button>`).join('')
            + (cands.length > top.length ? `<button type="button" class="chip" data-more="1">Altri${this.ico('next')}</button>` : '');

        const metric = this._strengthMetric(id);
        const name = EXERCISES_DB[id]?.name || id;
        const unit = metric === 'e1rm' ? 'kg' : metric === 'time' ? 's' : 'rip.';
        this._setText('pg-str-meta', metric === 'e1rm' ? 'massimale stimato' : metric === 'time' ? 'secondi migliori' : 'ripetizioni migliori');
        const series = this._strengthSeries(id).slice(-16);
        const last = series[series.length - 1];
        const shown = (v) => metric === 'e1rm' ? Math.round(v) : v;

        let kv = '';
        if (last) {
            const firstP = series[0];
            const diff = shown(last.v) - shown(firstP.v);
            const days = GT.calendarDaysBetween(new Date(firstP.t), new Date(last.t));
            const per = this._period(days);
            const cls = diff > 0 ? 'delta--up' : diff < 0 ? 'delta--down' : 'delta--same';
            const icon = diff > 0 ? 'trend-up' : diff < 0 ? 'trend-down' : 'equal';
            const txt = series.length < 2 ? 'prima seduta'
                : diff === 0 ? `uguale${per ? ` in ${per}` : ''}`
                    : `${diff > 0 ? '+' : '−'}${this.fmt(Math.abs(diff))} ${unit}${per ? ` in ${per}` : ''}`;
            kv = `<div class="kv pg-kv"><p class="kv__big num">${this.fmt(shown(last.v))}<small>${unit}</small></p>
                <span class="delta ${cls}">${this.ico(icon)}${txt}</span></div>`;
        }

        if (series.length < 2) {
            body.innerHTML = `${kv}<p class="muted pg-empty">Con la prossima seduta compare la linea</p>`;
            return;
        }
        let best = -Infinity;
        const pr = new Set();
        series.forEach((p, i) => {
            if (i > 0 && p.v > best) pr.add(i);
            best = Math.max(best, p.v);
        });
        const points = series.map(p => ({ t: p.t, v: metric === 'e1rm' ? Math.round(p.v * 10) / 10 : p.v }));
        const days = GT.calendarDaysBetween(new Date(series[0].t), new Date(last.t));
        const label = `${metric === 'e1rm' ? 'Massimale stimato' : metric === 'time' ? 'Secondi' : 'Ripetizioni'} di ${name}: da ${this.fmt(shown(series[0].v))} a ${this.fmt(shown(last.v))} ${unit}${days > 0 ? ` in ${this._period(days)}` : ''}; ${pr.size} record`;
        const legend = metric === 'e1rm' ? 'Calcolato da peso e ripetizioni della serie migliore'
            : metric === 'time' ? 'Secondi della serie migliore' : 'Ripetizioni della serie migliore';
        body.innerHTML = `${kv}
            ${this._chartSVG(points, { h: 160, pr, xlabels: this._monthLabels(points), label })}
            <p class="legend pg-chart-legend"><span><svg width="12" height="12" aria-hidden="true"><circle cx="6" cy="6" r="5" fill="var(--accent-mark)"/></svg> record</span><span>${legend}</span></p>`;
    },

    // ========================================
    // GRAFICO A LINEA (SVG): x sul tempo, tacche "tonde" 1-2-2,5-5 × 10^k
    // ========================================

    /**
     * @param {{t:number, v:number}[]} data - punti in ordine di tempo
     * @param {{h?:number, pr?:Set<number>, avg?:number[], ticks?:number, xlabels?:[number,string][], label:string}} o
     */
    _chartSVG(data, o = {}) {
        const W = 340, H = o.h || 160, L = 32, R = 10, T = 10, B = 22;
        const vals = data.map(d => d.v).concat(o.avg || []);
        let lo = Math.min(...vals), hi = Math.max(...vals);
        if (hi - lo < 1e-9) { lo -= 1; hi += 1; }
        const raw = (hi - lo) / (o.ticks || 3);
        const mag = 10 ** Math.floor(Math.log10(raw));
        const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(m => m >= raw - 1e-12) || raw;
        const min = Math.floor(lo / step + 1e-9) * step;
        const max = Math.ceil(hi / step - 1e-9) * step;
        const t0 = data[0].t, t1 = data[data.length - 1].t;
        const span = t1 - t0;
        const x = (i) => L + (span > 0 ? (data[i].t - t0) / span : i / Math.max(1, data.length - 1)) * (W - L - R);
        const xt = (t) => L + (span > 0 ? (t - t0) / span : 0) * (W - L - R);
        const y = (v) => T + (H - T - B) * (1 - (v - min) / ((max - min) || 1));
        const f = (n) => n.toFixed(1);
        let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${GT.esc(o.label || '')}">`;
        for (let v = min; v <= max + step / 1000; v += step) {
            const yy = f(y(v));
            s += `<line class="grid" x1="${L}" x2="${W - R}" y1="${yy}" y2="${yy}"/>`;
            s += `<text class="axis" x="${L - 6}" y="${f(y(v) + 4)}" text-anchor="end">${GT.esc(this.fmt(Math.round(v * 100) / 100, 2))}</text>`;
        }
        (o.xlabels || []).forEach(([t, txt], i, arr) => {
            const anchor = i === arr.length - 1 && arr.length > 1 && xt(t) > W - R - 16 ? 'end' : (xt(t) < L + 12 ? 'start' : 'middle');
            s += `<text class="axis" x="${f(xt(t))}" y="${H - 4}" text-anchor="${anchor}">${GT.esc(txt)}</text>`;
        });
        const path = data.map((d, i) => `${i ? 'L' : 'M'}${f(x(i))} ${f(y(d.v))}`).join(' ');
        if (o.avg) {
            data.forEach((d, i) => { s += `<circle class="pt pt--raw" cx="${f(x(i))}" cy="${f(y(d.v))}" r="2.6"/>`; });
            s += `<path class="line" d="${o.avg.map((v, i) => `${i ? 'L' : 'M'}${f(x(i))} ${f(y(v))}`).join(' ')}"/>`;
        } else {
            s += `<path class="area" d="${path} L${f(x(data.length - 1))} ${H - B} L${f(x(0))} ${H - B}Z"/>`;
            s += `<path class="line" d="${path}"/>`;
            data.forEach((d, i) => {
                const isPr = o.pr && o.pr.has(i);
                s += `<circle class="pt${isPr ? ' pt--pr' : ''}" cx="${f(x(i))}" cy="${f(y(d.v))}" r="${isPr ? 5.5 : 3.5}"/>`;
            });
        }
        return s + '</svg>';
    },

    // Etichette dei mesi sotto i punti (la prima seduta di ogni mese) e "oggi" sull'ultimo
    _monthLabels(points) {
        const out = [];
        let prev = -1;
        points.forEach(p => {
            const m = new Date(p.t).getMonth();
            if (m !== prev) out.push([p.t, GT._MESI[m]]);
            prev = m;
        });
        const lastT = points[points.length - 1].t;
        if (GT.calendarDaysBetween(new Date(lastT), new Date()) === 0) out.push([lastT, 'oggi']);
        const thin = this._thinLabels(points, out);
        // meno di tre etichette (tutto in un mese): meglio tre date
        return thin.length < 3 ? this._dateLabels(points) : thin;
    },

    // Tre date: prima, metà, ultima ("oggi" se è oggi)
    _dateLabels(points) {
        const first = points[0].t, lastT = points[points.length - 1].t;
        const mid = first + (lastT - first) / 2;
        const isToday = GT.calendarDaysBetween(new Date(lastT), new Date()) === 0;
        return this._thinLabels(points, [[first, this._shortDate(first)], [mid, this._shortDate(mid)], [lastT, isToday ? 'oggi' : this._shortDate(lastT)]]);
    },

    // Niente etichette sovrapposte: si tiene l'ultima, si tolgono quelle troppo vicine
    _thinLabels(points, labels) {
        const t0 = points[0].t, span = (points[points.length - 1].t - t0) || 1;
        const pos = (t) => (t - t0) / span * 298;
        const kept = [];
        for (let i = labels.length - 1; i >= 0; i--) {
            if (!kept.length || pos(kept[0][0]) - pos(labels[i][0]) >= 36) kept.unshift(labels[i]);
        }
        return kept;
    },

    // ========================================
    // RECORD
    // ========================================

    _recordList() {
        const prs = this._safe(() => Storage.getPersonalRecords()) || {};
        return Object.entries(prs).map(([id, pr]) => {
            if (!pr) return null;
            const timed = this._isTimedEx(id);
            let w, r, date, e1rm = 0;
            if (timed) {
                if (!(pr.maxReps > 0)) return null;
                w = 0; r = pr.maxReps; date = pr.maxRepsDate;
            } else if (pr.e1rmWeight > 0) {
                w = pr.e1rmWeight; r = pr.e1rmReps; date = pr.e1rmDate || pr.maxWeightDate; e1rm = pr.estimated1RM || pr.e1rm || 0;
            } else if (pr.maxWeight > 0) {
                w = pr.maxWeight; r = pr.maxWeightReps || pr.maxReps; date = pr.maxWeightDate; e1rm = pr.estimated1RM || 0;
            } else return null;
            return { id, name: EXERCISES_DB[id]?.name || id, timed, w, r, date, e1rm, t: new Date(date).getTime() || 0 };
        }).filter(Boolean);
    },

    _recordRow(rec, { withE1rm = false } = {}) {
        const recent = rec.t && GT.calendarDaysBetween(new Date(rec.t), new Date()) <= 14;
        const sub = [withE1rm && rec.e1rm ? `massimale ${this.fmt(Math.round(rec.e1rm))} kg` : '', rec.date ? this._relDay(rec.date) : '']
            .filter(Boolean).join(' · ');
        return `<button type="button" class="row" data-ex="${GT.esc(rec.id)}">
                <span class="row__icon${recent ? ' pg-pr--new' : ''}">${this.ico(recent ? 'trophy' : 'medal')}</span>
                <span class="row__body"><span class="row__title">${GT.esc(rec.name)}</span>${sub ? `<span class="row__sub">${GT.esc(sub)}</span>` : ''}</span>
                <span class="num pg-val">${GT.esc(this._fmtSetShort(rec.id, rec.w, rec.r))}</span>
            </button>`;
    },

    loadPersonalRecords() {
        const container = document.getElementById('prs-list');
        const all = document.getElementById('pg-pr-all');
        if (!container) return;
        const list = this._recordList().sort((a, b) => b.t - a.t);
        if (all) all.hidden = list.length <= 3;
        if (!list.length) {
            container.innerHTML = '<p class="muted pg-empty">Il primo record arriva con la prima seduta</p>';
            return;
        }
        container.innerHTML = `<div class="group">${list.slice(0, 3).map(r => this._recordRow(r)).join('')}</div>`;
    },

    _openAllRecords() {
        const list = this._recordList().sort((a, b) => (b.e1rm - a.e1rm) || a.name.localeCompare(b.name, 'it'));
        const root = this._sheet('records-modal', `
            ${this._sheetHead('Record', 'Chiudi i record')}
            <div class="group">${list.map(r => this._recordRow(r, { withE1rm: true })).join('')}</div>`, { tall: true });
        root.addEventListener('click', (e) => {
            const row = e.target.closest('[data-ex]');
            if (row) this.openExercise(row.dataset.ex);
        });
    },

    // ========================================
    // PESO E MISURE: pesate + media di 7 giorni; vita, fianchi, glutei, coscia (cm) con la variazione
    // dall'inizio. Per chi tonifica le misure vengono prima del peso.
    // ========================================

    MEASURES: [['waist', 'Vita'], ['hips', 'Fianchi'], ['glutes', 'Glutei'], ['thigh', 'Coscia']],

    _measuresFirst() {
        const goal = this._safe(() => Storage.getActiveProgram()?.metadata?.goal) || this._safe(() => Storage.getProfile().goal);
        return goal === 'toning';
    },

    _toggleWeightForm(force) {
        const form = document.getElementById('body-measurement-form');
        const btn = document.getElementById('toggle-weight-form');
        if (!form) return;
        const open = typeof force === 'boolean' ? force : form.hidden;
        form.hidden = !open;
        btn?.setAttribute('aria-expanded', String(open));
        if (!open) return;
        const all = this._safe(() => Storage.getMeasurements()) || [];
        const lastOf = (k) => all.find(m => GT.num(m[k]) > 0)?.[k];
        const p = this._safe(() => Storage.getProfile()) || {};
        const first = this._measuresFirst();
        form.classList.toggle('pg-bwform--ms', first);
        const w = document.getElementById('measure-weight');
        const lastW = lastOf('weight') || p.weight;
        if (w) {
            // Peso già scritto per correggerlo al volo; chi tonifica parte dalle misure (il peso resta vuoto)
            w.value = !first && GT.num(lastW) > 0 ? this.fmt(lastW, 1) : '';
            w.placeholder = GT.num(lastW) > 0 ? this.fmt(lastW, 1) : '';
        }
        this.MEASURES.forEach(([k]) => {
            const el = document.getElementById(`measure-${k}`);
            if (!el) return;
            el.value = '';
            el.placeholder = GT.num(lastOf(k)) > 0 ? this.fmt(lastOf(k), 1) : '';
        });
        const focus = first ? document.getElementById('measure-waist') : w;
        // Il fuoco va al primo campo solo se nel frattempo non se ne è già scelto un altro
        setTimeout(() => {
            if (form.contains(document.activeElement) && document.activeElement?.tagName === 'INPUT') return;
            focus?.focus(); focus?.select?.();
        }, 30);
    },

    saveMeasurement() {
        const input = document.getElementById('measure-weight');
        const raw = String(input?.value || '').trim();
        const weight = raw ? Math.round(GT.num(raw) * 10) / 10 : null;
        if (raw && !(weight >= 20 && weight <= 400)) {
            this.showNotification('Peso fuori misura: scrivi i kg, es. 84,2', 'warning');
            input?.focus();
            return;
        }
        const entry = { bodyFat: null };
        if (weight) entry.weight = weight;
        for (const [k, label] of this.MEASURES) {
            const el = document.getElementById(`measure-${k}`);
            const v = String(el?.value || '').trim();
            if (!v) continue;
            const cm = Math.round(GT.num(v) * 10) / 10;
            if (!(cm >= 20 && cm <= 250)) {
                this.showNotification(`${label} fuori misura: scrivi i cm, es. 72,5`, 'warning');
                el?.focus();
                return;
            }
            entry[k] = cm;
        }
        const nMeasures = this.MEASURES.filter(([k]) => entry[k]).length;
        if (!weight && !nMeasures) {
            this.showNotification('Scrivi il peso o una misura', 'warning');
            (this._measuresFirst() ? document.getElementById('measure-waist') : input)?.focus();
            return;
        }
        if (this._save(() => Storage.saveMeasurement(entry), weight && !nMeasures ? 'Peso NON salvato' : 'Misure NON salvate') === false) return;
        if (input) input.value = '';
        this._toggleWeightForm(false);
        this._safe(() => this._renderWeight());
        this._safe(() => this._renderMeasures());
        const msg = weight && nMeasures ? 'Peso e misure salvati'
            : weight ? `Peso salvato: ${this.fmt(weight, 1)} kg` : (nMeasures === 1 ? 'Misura salvata' : 'Misure salvate');
        this.showNotification(msg, 'success', { icon: 'scale' });
    },

    // Una riga: valore di oggi e variazione dalla prima misura, per ogni misura presa almeno una volta
    _renderMeasures() {
        const box = document.getElementById('pg-ms-body');
        const blocks = document.getElementById('pg-bw-blocks');
        const first = this._measuresFirst();
        blocks?.classList.toggle('pg-bwblocks--ms', first);
        this._setText('pg-bw-t', first ? 'Misure e peso' : 'Peso e misure');
        if (!box) return;
        const all = (this._safe(() => Storage.getMeasurements()) || []).slice().reverse();   // dalla più vecchia
        const cells = this.MEASURES.map(([k, label]) => {
            const pts = all.map(m => ({ t: new Date(m.date).getTime(), v: GT.num(m[k]) })).filter(p => p.v > 0 && Number.isFinite(p.t));
            if (!pts.length) return null;
            const last = pts[pts.length - 1].v;
            const d = Math.round((last - pts[0].v) * 10) / 10;
            return { k, label, last, d, n: pts.length, since: pts[0].t };
        }).filter(Boolean);
        if (!cells.length) {
            box.innerHTML = first ? '<p class="muted pg-empty">Nessuna misura: tocca Aggiungi</p>' : '';
            return;
        }
        const since = Math.min(...cells.map(c => c.since));
        const html = cells.map(c => {
            const icon = c.d > 0 ? 'trend-up' : c.d < 0 ? 'trend-down' : 'equal';
            const txt = c.n < 2 ? '' : c.d === 0 ? 'uguale' : `${c.d > 0 ? '+' : '−'}${this.fmt(Math.abs(c.d), 1)}`;
            return `<div class="pg-ms__c">
                <span class="pg-ms__k">${GT.esc(c.label)}</span>
                <span class="pg-ms__v num">${this.fmt(c.last, 1)}<small>cm</small></span>
                ${c.n < 2 ? '' : `<span class="delta delta--same">${this.ico(icon)}${txt}</span>`}
                <span class="sr-only">${c.n < 2 ? 'prima misura' : c.d === 0 ? 'uguale' : `${c.d > 0 ? 'più' : 'meno'} ${this.fmt(Math.abs(c.d), 1)} centimetri`} dal ${GT.esc(this._shortDate(c.since))}</span>
            </div>`;
        }).join('');
        const firstOnly = cells.every(c => c.n < 2);
        box.innerHTML = `<div class="pg-ms" style="--n:${cells.length}">${html}</div>
            <p class="pg-ms__since">${firstOnly ? 'Prima misura:' : 'Variazione dal'} <span class="num">${GT.esc(this._shortDate(since))}</span></p>`;
    },

    _renderWeight() {
        const body = document.getElementById('pg-bw-body');
        if (!body) return;
        const all = (this._safe(() => Storage.getMeasurements()) || [])
            .map(m => ({ t: new Date(m.date).getTime(), v: GT.num(m.weight) }))
            .filter(m => Number.isFinite(m.t) && m.v > 0)
            .sort((a, b) => a.t - b.t);
        if (!all.length) {
            body.innerHTML = '<p class="muted pg-empty">Nessuna pesata: tocca Aggiungi</p>';
            return;
        }
        const lastT = all[all.length - 1].t;
        let pts = all.filter(p => p.t >= lastT - 90 * 86400000);
        if (pts.length < 2) pts = all.slice(-10);
        const DAY = 86400000;
        const avg = pts.map(p => {
            const win = all.filter(q => q.t <= p.t && q.t > p.t - 7 * DAY);
            return win.reduce((s, q) => s + q.v, 0) / win.length;
        });
        const latest = all[all.length - 1];

        // Variazione della media di 7 giorni rispetto a ~30 giorni prima
        let delta = '';
        if (pts.length >= 2) {
            const target = lastT - 30 * DAY;
            let k = 0;
            pts.forEach((p, i) => { if (Math.abs(p.t - target) < Math.abs(pts[k].t - target)) k = i; });
            const days = GT.calendarDaysBetween(new Date(pts[k].t), new Date(lastT));
            const d = Math.round((avg[avg.length - 1] - avg[k]) * 10) / 10;
            if (days > 0) {
                const icon = d > 0 ? 'trend-up' : d < 0 ? 'trend-down' : 'equal';
                const txt = d === 0 ? `uguale in ${days} giorni` : `${d > 0 ? '+' : '−'}${this.fmt(Math.abs(d), 1)} kg in ${days} giorni`;
                delta = `<span class="delta delta--same">${this.ico(icon)}${txt}</span>`;
            }
        }
        const kv = `<div class="kv pg-kv"><p class="kv__big num">${this.fmt(latest.v, 1)}<small>kg</small></p>${delta}</div>`;
        if (pts.length < 2) {
            body.innerHTML = `${kv}<p class="muted pg-empty">Con due pesate compare la linea</p>`;
            return;
        }
        const label = `Peso corporeo: da ${this.fmt(pts[0].v, 1)} a ${this.fmt(latest.v, 1)} kg, media di 7 giorni ${avg[avg.length - 1] < avg[0] ? 'in calo' : avg[avg.length - 1] > avg[0] ? 'in salita' : 'stabile'}`;
        body.innerHTML = `${kv}
            ${this._chartSVG(pts, { h: 150, ticks: 2, avg: avg.map(v => Math.round(v * 100) / 100), xlabels: this._dateLabels(pts), label })}
            <p class="legend pg-chart-legend" aria-hidden="true"><span><svg width="12" height="12"><circle cx="6" cy="6" r="3" fill="var(--text-3)"/></svg> pesate</span><span><svg width="18" height="12"><path d="M1 6h16" stroke="var(--text)" stroke-width="2.5" stroke-linecap="round"/></svg> media di 7 giorni</span></p>`;
    },

    // ========================================
    // CICLI
    // ========================================

    _progPhaseKey(p) {
        const s = String((p && (p.phase || p.phaseName)) || p || '').toLowerCase();
        if (/intens/.test(s)) return 'int';
        if (/deload|scaric/.test(s)) return 'del';
        return 'acc';
    },

    _phaseLabel(key) {
        return { acc: 'Accumulo', int: 'Intensificazione', del: 'Scarico' }[key] || '';
    },

    _monthRange(a, b) {
        const da = new Date(a), db = new Date(b);
        if (isNaN(da)) return '';
        if (isNaN(db) || (da.getMonth() === db.getMonth() && da.getFullYear() === db.getFullYear())) return GT._MESI[da.getMonth()];
        return `${GT._MESI[da.getMonth()]}-${GT._MESI[db.getMonth()]}`;
    },

    _mesoHTML(keys, now = 0) {
        const n = keys.length || 1;
        return `<span class="meso pg-meso" style="--weeks:${n}" aria-hidden="true">${keys.map((k, i) => {
            const cls = now && i + 1 === now ? ' is-now' : (now && i + 1 > now ? ' is-future' : '');
            return `<i class="meso__wk${cls}" data-ph="${k}"></i>`;
        }).join('')}</span>`;
    },

    loadCycleHistory() {
        const container = document.getElementById('cycle-history-list');
        if (!container) return;
        const rows = [];
        const info = this._safe(() => Storage.getCycleInfo());
        if (info) {
            const keys = (info.phases || []).map(p => this._progPhaseKey(p));
            const deload = this._safe(() => Storage.isDeloadActive());
            const phase = deload ? 'del' : this._progPhaseKey(info.currentPhase);
            rows.push(`<div class="row">
                <span class="row__body"><span class="row__title">Ciclo ${GT.esc(info.cycleNumber || 1)} · dal ${GT.esc(this._shortDate(info.startDate))}</span>
                <span class="row__sub">sett. <span class="num">${info.currentWeek}</span> di <span class="num">${info.duration}</span> · ${this._phaseLabel(phase)}</span></span>
                ${this._mesoHTML(keys, Math.min(info.currentWeek, keys.length))}
                <span class="sr-only">Settimana ${info.currentWeek} di ${info.duration}, fase ${this._phaseLabel(phase)}</span>
            </div>`);
        }
        const history = this._safe(() => Storage.getCycleHistory()) || [];
        history.slice(0, 5).forEach((c, i) => {
            const st = c.statistics || {};
            const keys = (Array.isArray(c.phases) ? c.phases : []).map(p => this._progPhaseKey(p));
            const parts = [this._monthRange(c.startDate, c.endDate || c.completedAt)];
            if (st.totalWorkouts) parts.push(`<span class="num">${GT.esc(st.totalWorkouts)}</span>&nbsp;sedute`);
            if (st.prsAchieved) parts.push(`<span class="num">${GT.esc(st.prsAchieved)}</span>&nbsp;record`);
            rows.push(`<div class="row">
                <span class="row__body"><span class="row__title">Ciclo ${GT.esc(c.cycleNumber || history.length - i)}</span>
                <span class="row__sub">${parts.filter(Boolean).join(' · ')}</span></span>
                ${keys.length ? this._mesoHTML(keys) : ''}
            </div>`);
        });
        container.innerHTML = rows.length ? `<div class="group">${rows.join('')}</div>` : '<p class="muted pg-empty">Nessun ciclo: crea una scheda</p>';
    },

    // ========================================
    // STORICO DELLE SEDUTE (pesi e cardio)
    // ========================================

    _cardioTitle(s) {
        const isHiit = String(s.type).toLowerCase() === 'hiit';
        const name = isHiit
            ? (typeof HIIT_PROTOCOLS !== 'undefined' && HIIT_PROTOCOLS[s.protocol]?.name) || ''
            : (typeof LISS_ACTIVITIES !== 'undefined' && LISS_ACTIVITIES[s.activity]?.name) || '';
        return `${isHiit ? 'HIIT' : 'LISS'}${name ? ` · ${name}` : ''}`;
    },

    loadWorkoutHistory() {
        const container = document.getElementById('workout-history-list');
        const more = document.getElementById('pg-hist-more');
        if (!container) return;
        const workouts = this._pgWorkouts || this._safe(() => Storage.getWorkouts()) || [];
        const cardio = this._safe(() => Storage.getConditioningSessions()) || [];
        const items = [
            ...workouts.map(w => ({ t: this._wTime(w) || 0, w })),
            ...cardio.map(c => ({ t: new Date(c.date).getTime() || 0, c }))
        ].sort((a, b) => b.t - a.t);
        const limit = this._histLimit || 10;
        const meta = document.getElementById('pg-hist-meta');
        if (meta) meta.innerHTML = items.length ? `<span class="num">${items.length}</span>&nbsp;in tutto` : '';
        if (more) more.hidden = items.length <= limit;
        if (!items.length) {
            container.innerHTML = '<p class="muted pg-empty">Ancora nessuna seduta</p>';
            return;
        }
        container.innerHTML = `<div class="group">${items.slice(0, limit).map(({ w, c }) => {
            if (w) {
                const min = Math.round((w.duration || 0) / 60);
                const sets = this._wSets(w);
                const sub = [GT.formatRelativeDay(w.date), min ? `${min} min` : '', `${sets} serie`].filter(Boolean).join(' · ');
                return `<button type="button" class="row" data-workout-id="${GT.esc(w.id)}">
                    <span class="row__icon">${this.ico('barbell')}</span>
                    <span class="row__body"><span class="row__title">${GT.esc(this._wName(w))}</span><span class="row__sub">${GT.esc(sub)}</span></span>
                    <span class="row__end"><span class="num pg-vol">${GT.esc(GT.formatVolume(this._wVolume(w)))}</span>${this.ico('next', 'ico--sm')}</span>
                </button>`;
            }
            const isHiit = c.type === 'hiit';
            const sub = [GT.formatRelativeDay(c.date), `${c.duration || 0} min`, c.calories ? `${c.calories} kcal` : ''].filter(Boolean).join(' · ');
            return `<button type="button" class="row" data-cardio-id="${GT.esc(c.id)}">
                    <span class="row__icon">${this.ico(isHiit ? 'bolt' : 'steps')}</span>
                    <span class="row__body"><span class="row__title">${GT.esc(this._cardioTitle(c))}</span><span class="row__sub">${GT.esc(sub)}</span></span>
                    <span class="row__end">${this.ico('next', 'ico--sm')}</span>
                </button>`;
        }).join('')}</div>`;
    },

    _showCardioDetail(id) {
        const s = (this._safe(() => Storage.getConditioningSessions()) || []).find(x => String(x.id) === String(id));
        if (!s) return;
        const d = new Date(s.date);
        const exs = (s.exercises || []).map(x => (typeof HIIT_EXERCISES !== 'undefined' && HIIT_EXERCISES[x]?.name) || x);
        const root = this._sheet('cardio-detail-modal', `
            ${this._sheetHead(this._cardioTitle(s), 'Chiudi il dettaglio del cardio')}
            <p class="muted">${GT.esc(GT.formatRelativeDay(d))} · ${GT.esc(isNaN(d) ? '' : d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }))}</p>
            <div class="stats pg-dstats" style="--n:2">
                <div class="stat"><span class="stat__v num">${GT.esc(s.duration || 0)}<small>min</small></span><span class="stat__k">durata</span></div>
                <div class="stat"><span class="stat__v num">${GT.esc(s.calories || 0)}<small>kcal</small></span><span class="stat__k">${s.manualCalories ? 'misurate' : 'stimate'}</span></div>
            </div>
            ${exs.length ? `<p class="muted">${GT.esc(exs.join(' · '))}</p>` : ''}
            ${s.notes ? `<p>${GT.esc(s.notes)}</p>` : ''}
            <div class="sheet__actions"><button type="button" class="btn btn--secondary btn--danger-text" data-act="delete">${this.ico('trash')}Elimina cardio</button></div>`);
        root.querySelector('[data-act="delete"]')?.addEventListener('click', async () => {
            const ok = await this.confirmSheet({ title: `Eliminare ${this._cardioTitle(s)}?`, text: `${GT.formatRelativeDay(d)} · ${s.duration || 0} min.`, ok: 'Elimina cardio', cancel: 'Tienilo', danger: true });
            if (!ok) return;
            this._safe(() => Storage.deleteConditioningSession(s.id));
            this._closeSheet('cardio-detail-modal');
            this.showNotification('Cardio eliminato', 'success', { icon: 'trash' });
            this.loadProgress();
            this._safe(() => this.loadDashboard());
        });
    },

    // ========================================
    // DETTAGLIO DI UNA SEDUTA (foglio)
    // ========================================

    // Gli id dei workout possono arrivare da un backup (numeri o stringhe): si confrontano come testo
    _findWorkout(id) {
        const key = String(id);
        return Storage.getWorkouts().find(w => String(w.id) === key) || null;
    },

    _setLine(exId, s) {
        const kg = this._setKg(s);
        const r = Math.round(GT.num(s.reps));
        const timed = this._isTimedEx(exId);
        const val = timed ? `<span class="num">${this.fmt(r)}</span><small>s</small>`
            : kg > 0 ? `<span class="num">${this.fmt(kg)}</span><small>kg</small><span class="num">× ${this.fmt(r)}</span>`
                : `<span class="num">${this.fmt(r)}</span><small>rip.</small>`;
        const rir = Number.isFinite(s.rir) ? `<span class="rir-dot" data-rir="${Math.min(4, Math.max(0, s.rir))}">RIR ${s.rir >= 4 ? '4+' : s.rir}</span>` : '';
        const pr = s.isNewPR ? `<span class="pg-set__pr">${this.ico('trophy', 'ico--sm')}<span class="sr-only">record</span></span>` : '';
        const warm = s.isWarmup ? '<span class="tag">risc.</span>' : '';
        return `<li class="pg-set${s.isWarmup ? ' is-warm' : ''}"><span class="pg-set__val">${val}</span><span class="pg-set__end">${warm}${rir}${pr}</span></li>`;
    },

    showWorkoutDetail(workoutId) {
        const workout = this._findWorkout(workoutId);
        if (!workout) {
            this.showNotification('Seduta non trovata', 'error');
            return;
        }
        const date = new Date(workout.date);
        const durationMin = Math.round((workout.duration || 0) / 60);
        const prs = this._safe(() => Storage.countRealPRs([workout])) || 0;
        const exHTML = (workout.exercises || []).map(ex => {
            const done = (ex.sets || []).filter(s => s && s.completed && GT.num(s.reps) > 0);
            return `<li class="pg-dex">
                <h3>${GT.esc(ex.name || EXERCISES_DB[ex.exerciseId]?.name || 'Esercizio')}</h3>
                ${done.length ? `<ol class="pg-sets">${done.map(s => this._setLine(ex.exerciseId, s)).join('')}</ol>` : '<p class="faint">Nessuna serie fatta</p>'}
            </li>`;
        }).join('');

        const root = this._sheet('workout-detail-modal', `
            ${this._sheetHead(this._wName(workout), `Chiudi il dettaglio di ${this._wName(workout)}`)}
            <p class="muted pg-dwhen">${GT.esc(GT.formatRelativeDay(date))}${isNaN(date) ? '' : ` · ${GT.esc(date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }))}`}${prs ? ` · <span class="pg-pr--new">${this.ico('trophy', 'ico--sm')}</span> <span class="num">${prs}</span> record` : ''}</p>
            <div class="stats pg-dstats" style="--n:3">
                <div class="stat"><span class="stat__v num">${GT.esc(GT.formatVolume(this._wVolume(workout)))}</span><span class="stat__k">volume</span></div>
                <div class="stat"><span class="stat__v num">${this._wSets(workout)}</span><span class="stat__k">serie</span></div>
                <div class="stat"><span class="stat__v num">${durationMin}</span><span class="stat__k">minuti</span></div>
            </div>
            ${exHTML ? `<ol class="pg-dlist">${exHTML}</ol>` : '<p class="muted">Nessun esercizio</p>'}
            <div class="sheet__actions pg-dactions">
                <button type="button" class="btn btn--secondary" data-act="edit">${this.ico('edit')}Modifica</button>
                <button type="button" class="btn btn--secondary btn--danger-text" data-act="delete">${this.ico('trash')}Elimina</button>
            </div>`, { tall: true, onClose: () => this.closeWorkoutDetail() });

        root.addEventListener('click', async (e) => {
            const btn = e.target.closest('[data-act]');
            if (!btn) return;
            if (btn.dataset.act === 'edit') {
                this.closeWorkoutDetail();
                this.editWorkout(workout.id);
            } else if (btn.dataset.act === 'delete') {
                // Si chiude solo se l'eliminazione è confermata (E16)
                if (await this.deleteWorkoutSession(workout.id)) this.closeWorkoutDetail();
            }
        });
    },

    closeWorkoutDetail() {
        this._closeSheet('workout-detail-modal');
    },

    // true se la seduta è stata eliminata
    async deleteWorkoutSession(workoutId, event) {
        if (event) event.stopPropagation();
        const workout = this._findWorkout(workoutId);
        if (!workout) {
            this.showNotification('Seduta non trovata', 'error');
            return false;
        }
        const name = this._wName(workout);
        const when = this._relDay(workout.date);
        const ok = await this.confirmSheet({
            title: `Eliminare ${name} di ${when}?`,
            text: `${this._wSets(workout)} serie. Record e costanza si ricalcolano.`,
            ok: 'Elimina seduta', cancel: 'Tienila', danger: true
        });
        if (!ok) return false;
        try {
            Storage.deleteWorkout(workout.id);   // ricalcola anche i PR
        } catch (e) {
            console.error('deleteWorkout', e);
            this.showNotification('Seduta NON eliminata: riprova', 'error');
            return false;
        }
        this.showNotification(`${name} eliminata`, 'success', { icon: 'trash' });
        this._safe(() => this.loadDashboard());   // anche da Oggi ("Vedi …" di oggi): si ridisegna se aperta
        this.loadProgress();
        return true;
    },

    // ========================================
    // MODIFICA DI UNA SEDUTA (foglio)
    // ========================================

    editWorkout(workoutId) {
        const workout = this._findWorkout(workoutId);
        if (!workout) return;
        this._editingWorkout = JSON.parse(JSON.stringify(workout));
        this._editingWorkout.exercises = Array.isArray(this._editingWorkout.exercises) ? this._editingWorkout.exercises : [];
        // Valori di partenza di ogni serie: una serie non toccata tiene il suo "fatta/non fatta" (R1-02)
        this._editingWorkout.exercises.forEach(ex => {
            if (!Array.isArray(ex.sets)) ex.sets = [];
            ex.sets.forEach(st => {
                if (st && typeof st === 'object') {
                    Object.defineProperty(st, '_orig', { value: { weight: st.weight, reps: st.reps, completed: st.completed }, enumerable: false, writable: true, configurable: true });
                }
            });
        });
        const root = this._sheet('workout-edit-modal', `
            ${this._sheetHead(`Modifica ${this._wName(workout)}`, 'Chiudi senza salvare')}
            <p class="muted">${GT.esc(GT.formatRelativeDay(new Date(workout.date)))}</p>
            <div id="workout-edit-exercises"></div>
            <button type="button" class="btn btn--secondary btn--block" data-act="add-ex">${this.ico('plus')}Aggiungi esercizio</button>
            <div class="sheet__actions pg-edit-actions">
                <button type="button" class="btn btn--primary btn--xl" data-act="save">${this.ico('check')}Salva modifiche</button>
                <button type="button" class="btn btn--ghost btn--block" data-act="cancel">Annulla</button>
            </div>`, { tall: true, cls: 'pg-edit', onClose: () => this.closeWorkoutEdit() });
        this._renderWorkoutEdit();

        root.addEventListener('click', async (e) => {
            const btn = e.target.closest('[data-act]');
            if (!btn) return;
            const ex = parseInt(btn.dataset.ex, 10);
            const set = parseInt(btn.dataset.set, 10);
            switch (btn.dataset.act) {
                case 'save': this.saveWorkoutEdit(); break;
                case 'cancel': this.closeWorkoutEdit(); break;
                case 'add-set': this._addEditSet(ex); break;
                case 'rm-set': this._removeEditSet(ex, set); break;
                case 'rm-ex': await this._removeEditExercise(ex); break;
                case 'add-ex':
                    this._syncEditFromDOM();
                    this.pickExercise({ title: 'Aggiungi alla seduta', onPick: (id) => this._addExerciseToEdit(id) });
                    break;
                default: break;
            }
        });
    },

    _renderWorkoutEdit() {
        const workout = this._editingWorkout;
        const box = document.getElementById('workout-edit-exercises');
        if (!workout || !box) return;
        const sheet = box.closest('.sheet');
        const scroll = sheet ? sheet.scrollTop : 0;
        box.innerHTML = workout.exercises.length ? workout.exercises.map((ex, i) => {
            const name = ex.name || EXERCISES_DB[ex.exerciseId]?.name || 'Esercizio';
            const timed = this._isTimedEx(ex.exerciseId);
            const sets = ex.sets.map((s, j) => {
                // Serie non fatta (salvata con i valori proposti): si vede spenta finché non la si cambia
                const skip = s.completed === false && s._orig && String(s.weight ?? '') === String(s._orig.weight ?? '') && String(s.reps ?? '') === String(s._orig.reps ?? '');
                const tag = skip ? ', non fatta' : '';
                return `
                <li class="pg-eset${s.isWarmup ? ' is-warm' : ''}${skip ? ' is-skip' : ''}">
                    <span class="pg-eset__n num" aria-hidden="true">${s.isWarmup ? 'R' : j + 1}</span>
                    ${timed ? '' : `<input class="input num pg-ein" type="text" inputmode="decimal" autocomplete="off" data-ex="${i}" data-set="${j}" data-f="weight" value="${GT.esc(s.weight ?? '')}" placeholder="kg" aria-label="Peso, serie ${j + 1} di ${GT.esc(name)}${tag}">
                    <span class="pg-eset__x" aria-hidden="true">×</span>`}
                    <input class="input num pg-ein" type="text" inputmode="numeric" autocomplete="off" data-ex="${i}" data-set="${j}" data-f="reps" value="${GT.esc(s.reps ?? '')}" placeholder="${timed ? 's' : 'rip.'}" aria-label="${timed ? 'Secondi' : 'Ripetizioni'}, serie ${j + 1} di ${GT.esc(name)}${tag}">
                    <button type="button" class="btn btn--ghost btn--icon btn--sm" data-act="rm-set" data-ex="${i}" data-set="${j}" aria-label="Togli la serie ${j + 1} di ${GT.esc(name)}">${this.ico('close', 'ico--sm')}</button>
                </li>`;
            }).join('');
            return `<section class="pg-eex" aria-label="${GT.esc(name)}">
                    <div class="pg-eex__head"><h3>${GT.esc(name)}</h3>
                        <button type="button" class="btn btn--ghost btn--sm btn--danger-text" data-act="rm-ex" data-ex="${i}" aria-label="Togli ${GT.esc(name)} dalla seduta">Togli</button></div>
                    <ol class="pg-esets">${sets}</ol>
                    <button type="button" class="btn btn--ghost btn--sm" data-act="add-set" data-ex="${i}">${this.ico('plus', 'ico--sm')}Serie</button>
                </section>`;
        }).join('') : '<p class="muted">Nessun esercizio</p>';
        if (sheet) sheet.scrollTop = scroll;
    },

    _syncEditFromDOM() {
        if (!this._editingWorkout) return;
        document.querySelectorAll('#workout-edit-modal .pg-ein').forEach(input => {
            const target = this._editingWorkout.exercises[parseInt(input.dataset.ex, 10)]?.sets[parseInt(input.dataset.set, 10)];
            if (target) target[input.dataset.f] = input.value;
        });
    },

    _addEditSet(exIdx) {
        this._syncEditFromDOM();
        const sets = this._editingWorkout?.exercises[exIdx]?.sets;
        if (!sets) return;
        const last = [...sets].reverse().find(s => !s.isWarmup) || sets[sets.length - 1];
        sets.push({ weight: last?.weight ?? '', reps: last?.reps ?? '', completed: true });
        this._renderWorkoutEdit();
    },

    _removeEditSet(exIdx, setIdx) {
        this._syncEditFromDOM();
        this._editingWorkout?.exercises[exIdx]?.sets.splice(setIdx, 1);
        this._renderWorkoutEdit();
    },

    async _removeEditExercise(exIdx) {
        this._syncEditFromDOM();
        const ex = this._editingWorkout?.exercises[exIdx];
        if (!ex) return;
        const n = ex.sets.filter(s => s.completed !== false).length;
        if (n) {
            const ok = await this.confirmSheet({ title: `Togliere ${ex.name || 'l\'esercizio'}?`, text: `${n} serie escono dalla seduta.`, ok: 'Togli esercizio', cancel: 'Tienilo', danger: true });
            if (!ok) return;
        }
        this._editingWorkout.exercises.splice(exIdx, 1);
        this._renderWorkoutEdit();
    },

    _addExerciseToEdit(exerciseId) {
        const ex = EXERCISES_DB[exerciseId];
        if (!ex || !this._editingWorkout) return;
        this._editingWorkout.exercises.push({ exerciseId, name: ex.name, sets: [{ weight: '', reps: '', completed: false }] });
        this._renderWorkoutEdit();
        const inputs = document.querySelectorAll('#workout-edit-modal .pg-ein');
        setTimeout(() => inputs[inputs.length - (this._isTimedEx(exerciseId) ? 1 : 2)]?.focus(), 60);
    },

    saveWorkoutEdit() {
        this._syncEditFromDOM();
        const workout = this._editingWorkout;
        if (!workout) return;
        let totalVolume = 0;
        let totalSets = 0;
        workout.exercises.forEach(ex => {
            const counts = this._volumeCounts(ex.exerciseId);
            ex.sets.forEach(s => {
                const o = s._orig;
                const touched = !o || String(s.weight ?? '') !== String(o.weight ?? '') || String(s.reps ?? '') !== String(o.reps ?? '');
                if (touched) {
                    s.weight = Math.max(0, GT.num(s.weight));
                    s.reps = Math.max(0, Math.round(GT.num(s.reps)));
                    s.completed = s.reps > 0;
                } else {
                    // Non toccata: valori e "fatta/non fatta" come prima (2 serie su 4 restano 2, R1-02)
                    s.weight = o.weight;
                    s.reps = o.reps;
                    s.completed = o.completed;
                }
                if (s.completed && !s.isWarmup && !s.isCalibration) {
                    if (counts) totalVolume += this._setKg(s) * Math.round(GT.num(s.reps));
                    totalSets++;
                }
            });
        });
        workout.totalVolume = Math.round(totalVolume);
        workout.totalSets = totalSets;
        try {
            Storage.updateWorkout(workout.id, workout);   // ricalcola anche i PR
        } catch (e) {
            console.error('updateWorkout', e);
            this.showNotification('Modifiche NON salvate: memoria piena', 'error');
            return;
        }
        this.closeWorkoutEdit();
        this.showNotification(`${this._wName(workout)} aggiornata`, 'success');
        this.loadProgress();
    },

    closeWorkoutEdit() {
        this._closeSheet('workout-edit-modal');
        this._editingWorkout = null;
    },
});
