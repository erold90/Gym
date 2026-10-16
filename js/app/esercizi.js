/**
 * GymTracker 2.0 — area ESERCIZI: libreria (sottopagina #esercizi), scheda dell'esercizio (foglio),
 * scelta di un esercizio da qualunque pagina (foglio), "come si fa" di riscaldamento e defaticamento.
 *
 * Contratti per le altre aree:
 *   App.openExercise(exerciseId)                  apre la scheda dell'esercizio (foglio, sopra a tutto)
 *   App.pickExercise({title, filter, onPick})     libreria in modalità scelta (foglio); filter(ex) → bool;
 *                                                 onPick(exerciseId, ex). Restituisce anche una Promise(id|null)
 *   App.showExerciseInfoModal(id, name, type)     nome storico: 'workout' per id, 'warmup'/'cooldown' per nome
 *
 * Qui sta anche App._sheet(): il foglio al volo delle aree Progressi, Profilo, Esercizi, Cardio. Esc e
 * tocco sul velo chiudono IL foglio in cima (anche quando è aperto sopra un altro foglio).
 */

Object.assign(App, {
    // ========================================
    // FOGLI AL VOLO (aree G4)
    // ========================================

    /**
     * Foglio creato al volo in fondo al body (quindi sopra agli altri), con chiusura propria.
     * @param {string} id
     * @param {string} inner - markup dentro la <section class="sheet"> (dati utente già passati da GT.esc)
     * @param {{onClose?:Function, tall?:boolean, cls?:string}} opts - onClose: chi chiude (Esc, velo, [data-sheet-close])
     */
    _sheet(id, inner, { onClose = null, tall = false, cls = '' } = {}) {
        const old = document.getElementById(id);
        if (old) {
            old.remove();
            this._modalFocusStack.pop();
        }
        this._modalFocusStack.push(document.activeElement);
        const root = document.createElement('div');
        root.id = id;
        root.innerHTML = `<section class="sheet g4-sheet${tall ? ' sheet--tall' : ''}${cls ? ' ' + cls : ''}">${inner}</section>`;
        root._gtBackdrop = true;   // il velo lo gestisce questo foglio, non _closeTopModal del core
        document.body.appendChild(root);
        this._sheetify(root);
        const close = () => (onClose ? onClose() : this._closeSheet(id));
        root.addEventListener('click', (e) => {
            if (e.target === root || e.target.closest('[data-sheet-close]')) close();
        });
        this._g4Close = this._g4Close || {};
        this._g4Close[id] = close;
        this._focusFirst(root, '[data-autofocus]');
        return root;
    },

    _closeSheet(id) {
        if (this._g4Close) delete this._g4Close[id];
        return this._removeDynamicModal(id);
    },

    _sheetHead(title, closeLabel) {
        return `<div class="sheet__head"><h2>${GT.esc(title)}</h2>
            <button type="button" class="btn btn--ghost btn--icon sheet__close" data-sheet-close aria-label="${GT.esc(closeLabel)}">${this.ico('close')}</button></div>`;
    },

    // ========================================
    // DATI DELLA LIBRERIA
    // ========================================

    // Filtri a chip: muscolo (sui primari) E attrezzatura (categoria). Dentro una fila si somma (o).
    EX_MUSCLE_CHIPS: [
        { id: 'glutei', label: 'Glutei', icon: 'm-glutes', m: ['glutei'] },
        { id: 'gambe', label: 'Gambe', icon: 'm-legs', m: ['quadricipiti', 'femorali', 'polpacci'] },
        { id: 'petto', label: 'Petto', icon: 'm-chest', m: ['petto'] },
        { id: 'schiena', label: 'Schiena', icon: 'm-back', m: ['schiena', 'trapezio'] },
        { id: 'spalle', label: 'Spalle', icon: 'm-shoulders', m: ['spalle'] },
        { id: 'braccia', label: 'Braccia', icon: 'm-arms', m: ['bicipiti', 'tricipiti', 'avambracci'] },
        { id: 'addome', label: 'Addome', icon: 'm-abs', m: ['addome'] }
    ],
    EX_EQUIP_CHIPS: [
        { id: 'bilanciere', label: 'Bilanciere', icon: 'barbell' },
        { id: 'manubri', label: 'Manubri', icon: 'dumbbell' },
        { id: 'macchine', label: 'Macchine', icon: 'machine' },
        { id: 'cavi', label: 'Cavi', icon: 'cable' },
        { id: 'corpo-libero', label: 'Corpo libero', icon: 'bodyweight' },
        { id: 'accessori', label: 'Accessori', icon: 'band' }
    ],
    EX_EQUIP_ICON: {
        bilanciere: 'barbell', manubri: 'dumbbell', macchine: 'machine', cavi: 'cable', panca: 'bench',
        sbarra: 'pullup', parallele: 'bodyweight', accessori: 'band', 'corpo-libero': 'bodyweight'
    },
    EX_EQUIP_NAME: {
        bilanciere: 'Bilanciere', manubri: 'Manubri', macchine: 'Macchine', cavi: 'Cavi', panca: 'Panca',
        sbarra: 'Sbarra', parallele: 'Parallele', accessori: 'Accessori', 'corpo-libero': 'Corpo libero'
    },

    _muscleName(m) {
        const g = typeof MUSCLE_GROUPS !== 'undefined' ? MUSCLE_GROUPS.find(x => x.id === m) : null;
        return g ? g.name : String(m || '');
    },

    // "Glutei · femorali": primari e il primo secondario
    _exSub(ex) {
        const list = [...(ex.primaryMuscles || []), ...(ex.secondaryMuscles || []).slice(0, 1)]
            .filter((m, i, a) => a.indexOf(m) === i).map(m => this._muscleName(m).toLowerCase());
        const s = list.join(' · ');
        return s.charAt(0).toUpperCase() + s.slice(1);
    },

    _exEquip(ex) {
        const eq = (ex.equipment || []).filter(e => this.EX_EQUIP_ICON[e]);
        return eq.length ? eq : [ex.category || 'corpo-libero'];
    },

    _norm(s) {
        return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    },

    // Miniatura 64: la GIF sulla lastra chiara, o l'icona dell'attrezzo se manca (o non si carica)
    _thumbHTML(gif, icon, cls = '') {
        return gif
            ? `<span class="thumb${cls}" data-ico="${GT.esc(icon)}"><img src="${GT.esc(gif)}" alt="" loading="lazy" decoding="async"></span>`
            : `<span class="thumb thumb--ico${cls}">${this.ico(icon)}</span>`;
    },

    // Una GIF che non si carica diventa l'icona dell'attrezzo (gli errori delle <img> non risalgono: cattura)
    _bindThumbFallback(root) {
        if (!root || root._gtThumbs) return;
        root._gtThumbs = true;
        root.addEventListener('error', (e) => {
            const img = e.target;
            if (!(img instanceof HTMLImageElement)) return;
            const box = img.closest('.thumb');
            if (!box) return;
            box.classList.add('thumb--ico');
            box.innerHTML = this.ico(box.dataset.ico || 'dumbbell');
        }, true);
    },

    // ========================================
    // LIBRERIA: stessa interfaccia nella pagina e nel foglio di scelta
    // ========================================

    _libMarkup(p, { types = false } = {}) {
        const chip = (c, kind) => `<button type="button" class="chip" aria-pressed="false" data-${kind}="${c.id}">${this.ico(c.icon)}${c.label}</button>`;
        return `
            <div class="search">
                ${this.ico('search')}
                <label class="sr-only" for="${p.search}">Cerca un esercizio</label>
                <input class="input" type="search" id="${p.search}" placeholder="Cerca: squat, panca, glutei…" autocomplete="off" enterkeyhint="search">
            </div>
            ${types ? `
            <div class="seg seg--fit" role="group" aria-label="Tipo di esercizi" data-lib="types">
                <button type="button" aria-pressed="true" data-type="workout">Esercizi</button>
                <button type="button" aria-pressed="false" data-type="warmup">Riscaldamento</button>
                <button type="button" aria-pressed="false" data-type="cooldown">Defaticamento</button>
            </div>` : ''}
            <div class="lib-filters" data-lib="filters">
                <div class="chips chips--scroll" role="group" aria-label="Muscolo">${this.EX_MUSCLE_CHIPS.map(c => chip(c, 'm')).join('')}</div>
                <div class="chips chips--scroll" role="group" aria-label="Attrezzatura">${this.EX_EQUIP_CHIPS.map(c => chip(c, 'eq')).join('')}</div>
            </div>
            <div class="section__head lib-count">
                <span class="count" data-lib="count" aria-live="polite"></span>
                <button type="button" class="btn btn--ghost btn--sm" data-lib="reset" hidden>Azzera filtri</button>
            </div>
            <ul class="lib" id="${p.list}" aria-label="Esercizi"></ul>
            <div class="empty" data-lib="empty" hidden>
                <span class="empty__icon">${this.ico('search', 'ico--lg')}</span>
                <h2 class="lib-empty__t" data-lib="empty-title">Nessun esercizio</h2>
                <p>Prova un altro nome o togli il filtro.</p>
                <button type="button" class="btn btn--secondary" data-lib="reset">Azzera filtri</button>
            </div>`;
    },

    /**
     * Filtro del chiamante di pickExercise → funzione(ex). Accetta: funzione; array di id (solo quelli);
     * oggetto { exclude:[id], include|ids:[id], muscles|muscle:[muscolo primario], equipment|category:[categoria] }.
     */
    _pickFilter(f) {
        if (!f) return null;
        if (typeof f === 'function') return f;
        const set = (v) => (v == null ? null : new Set((Array.isArray(v) ? v : [v]).filter(Boolean).map(String)));
        if (Array.isArray(f)) {
            const ids = set(f);
            return ex => ids.has(ex.id);
        }
        if (typeof f !== 'object') return null;
        const exclude = set(f.exclude), include = set(f.include || f.ids);
        const muscles = set(f.muscles || f.muscle), equip = set(f.equipment || f.category);
        return ex => (!exclude || !exclude.has(ex.id))
            && (!include || include.has(ex.id))
            && (!muscles || (ex.primaryMuscles || []).some(m => muscles.has(m)))
            && (!equip || equip.has(ex.category) || (ex.equipment || []).some(e => equip.has(e)));
    },

    _newLibState(extra = {}) {
        return { query: '', type: 'workout', muscles: new Set(), equip: new Set(), filter: null, onPick: null, ...extra };
    },

    // Listener della libreria (una volta per contenitore): ricerca, tipo, chip, azzera, righe
    _bindLib(root, getState) {
        if (!root) return;
        this._bindThumbFallback(root);
        root.addEventListener('input', (e) => {
            if (e.target.matches('input[type="search"]')) {
                getState().query = e.target.value.trim();
                this._renderLib(root, getState());
            }
        });
        root.addEventListener('click', (e) => {
            const st = getState();
            const typeBtn = e.target.closest('[data-type]');
            if (typeBtn && root.contains(typeBtn) && typeBtn.closest('[data-lib="types"]')) {
                st.type = typeBtn.dataset.type;
                root.querySelectorAll('[data-lib="types"] [data-type]').forEach(b => b.setAttribute('aria-pressed', String(b === typeBtn)));
                this._renderLib(root, st);
                return;
            }
            const chip = e.target.closest('.chip[data-m], .chip[data-eq]');
            if (chip) {
                const set = chip.dataset.m ? st.muscles : st.equip;
                const key = chip.dataset.m || chip.dataset.eq;
                if (set.has(key)) set.delete(key); else set.add(key);
                chip.setAttribute('aria-pressed', String(set.has(key)));
                this._renderLib(root, st);
                return;
            }
            if (e.target.closest('[data-lib="reset"]')) {
                st.query = '';
                st.muscles.clear();
                st.equip.clear();
                const input = root.querySelector('input[type="search"]');
                if (input) input.value = '';
                root.querySelectorAll('.chip[aria-pressed]').forEach(c => c.setAttribute('aria-pressed', 'false'));
                this._renderLib(root, st);
                input?.focus();
                return;
            }
            const info = e.target.closest('[data-info]');
            if (info) {
                this.openExercise(info.dataset.info);
                return;
            }
            const row = e.target.closest('.libr');
            if (!row) return;
            if (row.dataset.id) {
                if (st.onPick) st.onPick(row.dataset.id);
                else this.openExercise(row.dataset.id);
            } else if (row.dataset.name) {
                this.showExerciseInfoModal(null, row.dataset.name, row.dataset.kind);
            }
        });
    },

    // Esercizi che passano ricerca + muscolo + attrezzatura (+ filtro del chiamante)
    _libFiltered(st) {
        const q = this._norm(st.query);
        const muscles = new Set();
        this.EX_MUSCLE_CHIPS.filter(c => st.muscles.has(c.id)).forEach(c => c.m.forEach(m => muscles.add(m)));
        let list = getAllExercises();
        const test = this._pickFilter(st.filter);
        if (test) list = list.filter(ex => { try { return test(ex); } catch (e) { return true; } });
        if (q) {
            list = list.filter(ex => {
                const hay = this._norm([ex.name, ex.category, ...(ex.primaryMuscles || []), ...(ex.secondaryMuscles || []), ...(ex.equipment || [])].join(' '));
                return q.split(/\s+/).every(w => hay.includes(w));
            });
        }
        if (muscles.size) list = list.filter(ex => (ex.primaryMuscles || []).some(m => muscles.has(m)));
        if (st.equip.size) list = list.filter(ex => st.equip.has(ex.category) || (ex.equipment || []).some(e => st.equip.has(e)));
        return list.sort((a, b) => a.name.localeCompare(b.name, 'it'));
    },

    _renderLib(root, st) {
        if (!root) return;
        const list = root.querySelector('.lib');
        const filters = root.querySelector('[data-lib="filters"]');
        const countEl = root.querySelector('[data-lib="count"]');
        const empty = root.querySelector('[data-lib="empty"]');
        const resets = root.querySelectorAll('[data-lib="reset"]');
        if (!list) return;
        const isWorkout = st.type === 'workout';
        if (filters) filters.hidden = !isWorkout;

        let rows = [];
        let n = 0;
        if (isWorkout) {
            const exs = this._libFiltered(st);
            n = exs.length;
            rows = exs.map(ex => {
                const eq = this._exEquip(ex);
                const icon = this.EX_EQUIP_ICON[eq[0]] || 'dumbbell';
                const eqText = eq.map(e => this.EX_EQUIP_NAME[e] || e).join(', ');
                const btn = `<button type="button" class="libr" data-id="${GT.esc(ex.id)}">
                        ${this._thumbHTML(getExerciseGif(ex.id), icon)}
                        <span class="libr__body"><span class="libr__name">${GT.esc(ex.name)}</span><span class="libr__sub">${GT.esc(this._exSub(ex))}</span></span>
                        <span class="libr__eq" aria-hidden="true">${eq.slice(0, 2).map(e => this.ico(this.EX_EQUIP_ICON[e] || 'dumbbell', 'ico--sm')).join('')}</span>
                        <span class="sr-only">, ${GT.esc(eqText)}</span>
                    </button>`;
                const info = st.onPick
                    ? `<button type="button" class="btn btn--ghost btn--icon lib__info" data-info="${GT.esc(ex.id)}" aria-label="Come si fa: ${GT.esc(ex.name)}">${this.ico('info')}</button>`
                    : '';
                return `<li${st.onPick ? ' class="lib__pick"' : ''}>${btn}${info}</li>`;
            });
        } else {
            const q = this._norm(st.query);
            const exs = this.getUniqueWarmupCooldownExercises(st.type)
                .filter(ex => !q || this._norm(ex.name + ' ' + ex.description).includes(q));
            n = exs.length;
            const icon = st.type === 'warmup' ? 'warmup' : 'cooldown';
            rows = exs.map(ex => `<li><button type="button" class="libr" data-name="${GT.esc(ex.name)}" data-kind="${st.type}">
                    ${this._thumbHTML(ex.gifUrl, icon)}
                    <span class="libr__body"><span class="libr__name">${GT.esc(ex.name)}</span>${ex.duration ? `<span class="libr__sub">${GT.esc(ex.duration)}</span>` : ''}</span>
                </button></li>`);
        }

        list.innerHTML = rows.join('');
        const filtered = !!st.query || st.muscles.size > 0 || st.equip.size > 0;
        if (countEl) countEl.textContent = `${n} ${n === 1 ? 'esercizio' : 'esercizi'}`;
        resets.forEach(b => { b.hidden = !filtered; });
        list.hidden = n === 0;
        if (empty) {
            empty.hidden = n > 0;
            const what = this.EX_MUSCLE_CHIPS.filter(c => st.muscles.has(c.id)).map(c => c.label.toLowerCase()).join(' o ');
            const title = `Nessun esercizio${isWorkout && what ? ` per ${what}` : ''}${st.query ? ` con «${st.query}»` : ''}`;
            const t = empty.querySelector('[data-lib="empty-title"]');
            if (t) t.textContent = title;
        }
    },

    // ========================================
    // GUSCIO DELL'AREA: pagina, listener
    // ========================================

    // Sottopagina #esercizi: topbar con Indietro (data-back torna da dove si è venuti, o a Scheda)
    htmlEsercizi() {
        return `
            <header class="topbar">
                <button type="button" class="btn btn--ghost btn--icon" data-back aria-label="Indietro">${this.ico('back')}</button>
                <div class="topbar__title"><h1>Esercizi</h1></div>
                <span class="topbar__spacer" aria-hidden="true"></span>
            </header>
            <div class="lib-root" id="ex-lib">
                ${this._libMarkup({ search: 'exercise-search', list: 'exercises-grid' }, { types: true })}
            </div>
        `;
    },

    // Nessun foglio statico: scheda dell'esercizio e scelta sono fogli al volo (stanno sopra a tutto)
    sheetsEsercizi() {
        return '';
    },

    bindEsercizi() {
        this._exLib = this._newLibState();
        this._bindLib(document.getElementById('ex-lib'), () => this._exLib);

        // Esc chiude il foglio G4 in cima, prima del gestore generale del core
        window.addEventListener('keydown', (e) => {
            if (e.key !== 'Escape' && e.key !== 'Esc') return;
            const open = this._openSheets();
            const top = open[open.length - 1];
            const fn = top && this._g4Close && this._g4Close[top.id];
            if (!fn) return;
            e.preventDefault();
            e.stopImmediatePropagation();
            fn();
        }, true);
    },

    // Nome storico chiamato dal core all'avvio: disegna la libreria della pagina
    renderExercises() {
        if (!this._exLib) this._exLib = this._newLibState();
        this._renderLib(document.getElementById('ex-lib'), this._exLib);
    },

    enterEsercizi() {
        this.renderExercises();
    },

    getUniqueWarmupCooldownExercises(type) {
        const db = type === 'warmup' ? Warmups.WARMUPS_DB : Warmups.COOLDOWN_DB;
        const detailsFn = type === 'warmup' ? getWarmupDetails : getCooldownDetails;
        const seen = new Set();
        const exercises = [];
        for (const key of Object.keys(db || {})) {
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
                    type
                });
            }
        }
        return exercises.sort((a, b) => a.name.localeCompare(b.name, 'it'));
    },

    // ========================================
    // SCELTA DI UN ESERCIZIO (foglio)
    // ========================================

    /**
     * Libreria in modalità scelta.
     * @param {{title?:string, filter?:Function|string[]|{exclude?:string[], include?:string[], muscles?:string[], equipment?:string[]}, onPick?:(id:string, ex:object)=>void}} o
     * @returns {Promise<string|null>} id scelto, null se chiuso senza scegliere
     */
    pickExercise({ title = 'Scegli un esercizio', filter = null, onPick = null } = {}) {
        if (this._pickResolve) this._pickResolve(null);
        return new Promise((resolve) => {
            const id = 'pick-exercise-modal';
            const done = (exId) => {
                if (this._pickResolve !== done) return;
                this._pickResolve = null;
                this._closeSheet(id);
                if (exId && typeof onPick === 'function') this._safe(() => onPick(exId, EXERCISES_DB[exId]));
                resolve(exId || null);
            };
            this._pickResolve = done;
            this._pickLib = this._newLibState({ filter, onPick: (exId) => done(exId) });
            const root = this._sheet(id, `
                ${this._sheetHead(title, 'Chiudi senza scegliere')}
                <div class="lib-root lib-root--sheet">${this._libMarkup({ search: 'pick-search', list: 'pick-list' })}</div>`,
            { tall: true, cls: 'pick-sheet', onClose: () => done(null) });
            const libRoot = root.querySelector('.lib-root');
            this._bindLib(libRoot, () => this._pickLib);
            this._renderLib(libRoot, this._pickLib);
            setTimeout(() => { try { root.querySelector('#pick-search')?.focus({ preventScroll: true }); } catch (e) { /* no-op */ } }, 40);
        });
    },

    // ========================================
    // SCHEDA DELL'ESERCIZIO (foglio)
    // ========================================

    /** Scheda dell'esercizio (GIF o animazione, passaggi, errori, respirazione, muscoli, volta scorsa, record). */
    openExercise(exerciseId) {
        const ex = EXERCISES_DB[exerciseId];
        if (!ex) return;
        this.showExerciseInfoModal(exerciseId, ex.name, 'workout');
    },

    // Nome della v1 per la scheda vecchia: ora è la stessa scheda
    showExerciseDetail(exerciseId) {
        this.openExercise(exerciseId);
    },

    /**
     * @param {string|null} exerciseId - id (esercizi della scheda)
     * @param {string} exerciseName - nome (riscaldamento e defaticamento si cercano per nome)
     * @param {'workout'|'warmup'|'cooldown'} type
     */
    showExerciseInfoModal(exerciseId, exerciseName, type = 'workout') {
        const exercise = type === 'workout' && exerciseId ? getExerciseById(exerciseId) : null;
        const name = exerciseName || exercise?.name || '';
        const info = getExerciseMediaInfo(exerciseId, name, type);
        const det = info.details || {};
        const li = (arr) => arr.map(x => `<li>${GT.esc(x)}</li>`).join('');
        const steps = det.steps?.length ? det.steps : (exercise?.instructions ? [exercise.instructions] : []);
        const tips = det.tips?.length ? det.tips : (exercise?.tips || []);
        const mistakes = det.commonMistakes || [];

        // Etichette: muscoli primari (accento), secondari, attrezzatura
        let tags = '';
        if (exercise) {
            const prim = (exercise.primaryMuscles || []).map(m => {
                const g = typeof MUSCLE_GROUPS !== 'undefined' ? MUSCLE_GROUPS.find(x => x.id === m) : null;
                return `<span class="tag tag--accent">${g?.icon ? this.ico(g.icon) : ''}${GT.esc(this._muscleName(m))}</span>`;
            });
            const sec = (exercise.secondaryMuscles || []).map(m => `<span class="tag">${GT.esc(this._muscleName(m))}</span>`);
            const eq = this._exEquip(exercise).map(e => `<span class="tag">${this.ico(this.EX_EQUIP_ICON[e] || 'dumbbell')}${GT.esc(this.EX_EQUIP_NAME[e] || e)}</span>`);
            tags = [...prim, ...sec, ...eq].join('');
        } else if (det.muscles?.primary) {
            tags = `<span class="tag tag--accent">${GT.esc(det.muscles.primary)}</span>`;
        }

        // Volta scorsa e record (solo per gli esercizi con uno storico)
        let mine = '';
        if (exercise) {
            const rows = [];
            const timed = exercise.metric === 'time';
            const fmtSet = (w, r) => timed ? `${this.fmt(r)} s` : (GT.num(w) > 0 ? `${this.fmt(w)} × ${this.fmt(r)}` : `${this.fmt(r)} rip.`);
            const last = this._safe(() => Storage.getLastPerformance(exerciseId));
            if (last) {
                rows.push(`<div class="row"><span class="row__icon">${this.ico('clock')}</span><span class="row__body"><span class="row__title">Volta scorsa</span><span class="row__sub">${GT.esc(GT.formatRelativeDay(last.date))}</span></span><span class="num ex-val">${GT.esc(fmtSet(last.weight, last.reps))}</span></div>`);
            }
            const pr = this._safe(() => Storage.getExercisePR(exerciseId));
            const prVal = pr ? (timed ? (pr.maxReps > 0 ? `${this.fmt(pr.maxReps)} s` : '') : (pr.e1rmWeight > 0 ? fmtSet(pr.e1rmWeight, pr.e1rmReps) : (pr.maxWeight > 0 ? fmtSet(pr.maxWeight, pr.maxWeightReps) : ''))) : '';
            if (prVal) {
                const when = timed ? pr.maxRepsDate : (pr.e1rmDate || pr.maxWeightDate);
                rows.push(`<div class="row"><span class="row__icon ex-pr">${this.ico('trophy')}</span><span class="row__body"><span class="row__title">Il tuo record</span><span class="row__sub">${GT.esc(when ? GT.formatRelativeDay(when) : '')}</span></span><span class="num ex-val">${GT.esc(prVal)}</span></div>`);
            }
            if (rows.length) mine = `<div class="group">${rows.join('')}</div>`;
        }

        const media = info.gifUrl
            ? `<div class="gif-loading" aria-hidden="true"></div>`
            : (info.svgAnimation || '');
        const section = (title, body) => body ? `<section class="section ex-part"><h3>${title}</h3>${body}</section>` : '';
        const html = `
            ${this._sheetHead(info.name || name, `Chiudi ${name}`)}
            <figure class="media-full ex-media${info.gifUrl ? '' : ' ex-media--svg'}" id="ex-media">${media}</figure>
            ${tags ? `<div class="chips ex-tags">${tags}</div>` : ''}
            ${mine}
            ${section('Come si fa', steps.length ? `<ol class="steps-list">${li(steps)}</ol>` : '')}
            ${section('Errori comuni', mistakes.length ? `<ul class="errs">${mistakes.map(m => `<li>${this.ico('alert')}<span>${GT.esc(m)}</span></li>`).join('')}</ul>` : '')}
            ${section('Respirazione', det.breathing ? `<p class="ex-text">${GT.esc(det.breathing)}</p>` : '')}
            ${section('Consigli', tips.length ? `<ul class="ex-tips">${li(tips)}</ul>` : '')}
        `;
        const root = this._sheet('exercise-sheet', html, { tall: true, cls: 'ex-sheet' });

        // GIF: un gettone per richiesta, così un caricamento vecchio non sovrascrive quello nuovo (C14)
        if (info.gifUrl) {
            const token = (this._infoGifToken = (this._infoGifToken || 0) + 1);
            const box = root.querySelector('#ex-media');
            const img = new Image();
            img.alt = `${info.name || name}: esecuzione`;
            img.onload = () => {
                if (token !== this._infoGifToken || !box.isConnected) return;
                box.innerHTML = '';
                box.appendChild(img);
            };
            img.onerror = () => {
                if (token !== this._infoGifToken || !box.isConnected) return;
                box.classList.add('ex-media--svg');
                box.innerHTML = getSvgAnimation(EXERCISE_SVG_FALLBACK?.[exerciseId] || 'default');   // SVG interno, non dati utente
            };
            img.src = info.gifUrl;
        }
        return root;
    },
});
