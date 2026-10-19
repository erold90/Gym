/**
 * GymTracker Pro - Storage Module
 * Persistenza su localStorage: profilo, impostazioni, allenamenti, PR, ciclo, streak,
 * conditioning, sessione in corso, export/import.
 *
 * Regole (v1.26):
 * - Ogni lettura è sicura: un JSON rotto viene copiato in `gymtracker_corrupt_<chiave>` e
 *   sostituito dal default. L'app non si blocca mai all'avvio per un dato rotto.
 * - I dati della v1.25 si leggono così come sono: le migrazioni avvengono in lettura o una
 *   volta sola in `migrate()`, senza cancellare chiavi.
 * - PR e streak sono DERIVATI dagli allenamenti: si ricalcolano dopo ogni modifica.
 * - Date con GT (utils.js): lunedì, giorni di calendario, arrotondamenti.
 */

// Ripiego minimo se utils.js non è stato caricato (cache del Service Worker a metà
// aggiornamento): lo Storage deve funzionare lo stesso, l'app non deve fermarsi.
if (typeof GT === 'undefined') {
    globalThis.GT = {
        APP_VERSION: 'v1.26.0',
        esc: s => (s === null || s === undefined) ? '' : String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]),
        num: v => { const n = typeof v === 'number' ? v : parseFloat(String(v ?? '').replace(',', '.')); return isFinite(n) ? n : 0; },
        _fix: v => Math.round(v * 1000) / 1000,
        round(x, s) { return s > 0 ? this._fix(Math.round(x / s) * s) : x; },
        floorTo(x, s) { return s > 0 ? this._fix(Math.floor(x / s + 1e-9) * s) : x; },
        ceilTo(x, s) { return s > 0 ? this._fix(Math.ceil(x / s - 1e-9) * s) : x; },
        _toDate: d => d instanceof Date ? new Date(d.getTime()) : (d === null || d === undefined || d === '') ? new Date(NaN) : new Date(d),
        isValidDate(d) { return !isNaN(this._toDate(d).getTime()); },
        startOfDay(d = new Date()) { const x = this._toDate(d); return new Date(x.getFullYear(), x.getMonth(), x.getDate()); },
        startOfWeek(d = new Date()) { const x = this._toDate(d); return new Date(x.getFullYear(), x.getMonth(), x.getDate() - (x.getDay() + 6) % 7); },
        addDays(d, n) { const x = this._toDate(d); return new Date(x.getFullYear(), x.getMonth(), x.getDate() + n, x.getHours(), x.getMinutes(), x.getSeconds(), x.getMilliseconds()); },
        calendarDaysBetween(a, b = new Date()) {
            const x = this._toDate(a), y = this._toDate(b);
            if (isNaN(x.getTime()) || isNaN(y.getTime())) return NaN;
            return Math.round((Date.UTC(y.getFullYear(), y.getMonth(), y.getDate()) - Date.UTC(x.getFullYear(), x.getMonth(), x.getDate())) / 86400000);
        },
        dateKey(d) { const x = this._toDate(d); if (isNaN(x.getTime())) return ''; const p = n => String(n).padStart(2, '0'); return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}`; },
        formatVolume: kg => `${Math.round(Number(kg) || 0)} kg`,
        formatRelativeDay: d => new Date(d).toLocaleDateString('it-IT'),
        formatDate: d => new Date(d).toLocaleDateString('it-IT')
    };
}

const Storage = {
    // Keys for localStorage
    KEYS: {
        PROFILE: 'gymtracker_profile',
        SETTINGS: 'gymtracker_settings',
        WORKOUTS: 'gymtracker_workouts',
        PROGRAMS: 'gymtracker_programs',
        ACTIVE_PROGRAM: 'gymtracker_active_program',
        MEASUREMENTS: 'gymtracker_measurements',
        PERSONAL_RECORDS: 'gymtracker_prs',
        STREAK: 'gymtracker_streak',
        CYCLE_HISTORY: 'gymtracker_cycle_history',
        CONDITIONING: 'gymtracker_conditioning',
        ACTIVE_SESSION: 'gymtracker_active_session',
        META: 'gymtracker_meta',
        SUPPLEMENTS: 'gymtracker_supplements',
        SUPPLEMENTS_LOG: 'gymtracker_supplements_log'
    },

    PREFIX: 'gymtracker_',
    CORRUPT_PREFIX: 'gymtracker_corrupt_',
    SCHEMA_VERSION: 2,

    // Ultimo errore di scrittura (es. spazio pieno) e ultimo errore di import, per l'interfaccia
    lastError: null,
    lastImportError: null,
    // Chiavi trovate rotte in questa sessione: [{key, backupKey, reason}]
    corruptionLog: [],

    // ========================================
    // LETTURA / SCRITTURA SICURE
    // ========================================

    _isObj(v) {
        return v !== null && typeof v === 'object' && !Array.isArray(v);
    },

    _copyCached(v) {
        if (v === null || typeof v !== 'object') return v;
        try { return typeof structuredClone === 'function' ? structuredClone(v) : this._clone(v); } catch (e) { return this._clone(v); }
    },

    _clone(v) {
        return v === undefined ? undefined : JSON.parse(JSON.stringify(v));
    },

    _isQuotaError(e) {
        return !!e && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
            e.code === 22 || e.code === 1014 || /quota/i.test(String(e.message || '')));
    },

    // ========================================
    // CACHE IN MEMORIA (R1-10): storico e scheda si leggevano decine di volte a ogni disegno.
    // Solo le chiavi grandi e lette spesso; il valore in cache è CONDIVISO: chi lo legge non lo
    // modifica (le funzioni di Storage che cambiano la scheda lavorano su una copia, _programCopy).
    // Si azzera a ogni scrittura/rimozione, a import e cancellazioni, e se un'altra scheda del
    // browser cambia il localStorage (evento `storage`). Con localStorage.gymtracker_dev_freeze = '1'
    // i valori in cache sono congelati: chi li modifica per errore si vede subito (solo sviluppo).
    // ========================================
    _CACHED_KEYS: ['gymtracker_workouts', 'gymtracker_active_program'],
    _cache: new Map(),

    _cacheDrop(key) {
        if (key === undefined || key === null) this._cache.clear();
        else this._cache.delete(key);
    },

    _devFreeze() {
        try { return localStorage.getItem('gymtracker_dev_freeze') === '1'; } catch (e) { return false; }
    },

    _deepFreeze(v) {
        if (v && typeof v === 'object' && !Object.isFrozen(v)) {
            Object.freeze(v);
            Object.keys(v).forEach(k => this._deepFreeze(v[k]));
        }
        return v;
    },

    /** Rimuove una chiave (e la sua copia in cache). */
    _remove(key) {
        this._cacheDrop(key);
        try { localStorage.removeItem(key); } catch (e) { /* no-op */ }
    },

    /**
     * Legge una chiave JSON. Se il valore non si legge o ha il tipo sbagliato, lo copia in
     * gymtracker_corrupt_<chiave> e restituisce (e scrive) il default. Mai un'eccezione.
     * opts.normalize(val) → valore normalizzato una volta sola (finisce in cache).
     */
    _read(key, fallback, check, opts = {}) {
        const cached = this._CACHED_KEYS.includes(key);
        // La cache evita il JSON.parse, ma chi legge riceve sempre una COPIA: un chiamante che modifica
        // l'oggetto senza salvarlo non deve cambiare quello che leggeranno gli altri
        if (cached && this._cache.has(key)) return this._copyCached(this._cache.get(key));
        let raw = null;
        try {
            raw = localStorage.getItem(key);
        } catch (e) {
            return this._clone(fallback);
        }
        if (raw === null || raw === undefined) return this._clone(fallback);
        let val;
        try {
            val = JSON.parse(raw);
        } catch (e) {
            this._quarantine(key, raw, 'json', fallback);
            return this._clone(fallback);
        }
        if (check && !check(val)) {
            this._quarantine(key, raw, 'type', fallback);
            return this._clone(fallback);
        }
        if (opts.normalize) {
            try { val = opts.normalize(val); } catch (e) { /* si tiene il valore letto */ }
        }
        if (cached) {
            this._cache.set(key, this._devFreeze() ? this._deepFreeze(val) : val);
            return this._copyCached(val);
        }
        return val;
    },

    // Mette da parte un valore rotto (mai perso) e lo sostituisce col default
    _quarantine(key, raw, reason, fallback) {
        this._cacheDrop(key);
        const base = this.CORRUPT_PREFIX + String(key).replace(/^gymtracker_/, '');
        let backupKey = base;
        try {
            const existing = localStorage.getItem(base);
            if (existing !== null && existing !== raw) backupKey = `${base}_${Date.now()}`;
            if (existing !== raw) localStorage.setItem(backupKey, raw);
            // Copia riuscita: ora si può rimettere il default al suo posto
            if (fallback === null || fallback === undefined) localStorage.removeItem(key);
            else localStorage.setItem(key, JSON.stringify(fallback));
        } catch (e) {
            // Spazio pieno: il valore originale resta dov'è, si usa il default solo in memoria
            backupKey = null;
        }
        this.corruptionLog.push({ key, backupKey, reason });
        try { console.warn(`[Storage] ${key} illeggibile (${reason})` + (backupKey ? `, copia in ${backupKey}` : '')); } catch (e) { /* no-op */ }
    },

    _isSecurityError(e) {
        return !!e && (e.name === 'SecurityError' || e.code === 18);
    },

    /**
     * Fa spazio cancellando i dati RICALCOLABILI (R1-11): PR e streak (si rifanno dagli allenamenti),
     * la vecchia copia dei PR in meta, le copie dei dati rotti più vecchie (resta la più recente per chiave).
     * @returns {number} chiavi tolte o alleggerite
     */
    _freeSpace() {
        let n = 0;
        [this.KEYS.PERSONAL_RECORDS, this.KEYS.STREAK].forEach(k => {
            try { if (localStorage.getItem(k) !== null) { this._remove(k); n++; } } catch (e) { /* no-op */ }
        });
        try {
            const raw = localStorage.getItem(this.KEYS.META);
            const meta = raw ? JSON.parse(raw) : null;
            if (meta && meta.prsBeforeV126 !== undefined) {
                delete meta.prsBeforeV126;
                localStorage.setItem(this.KEYS.META, JSON.stringify(meta));
                n++;
            }
        } catch (e) { /* no-op */ }
        // copie rotte: per ogni chiave si tiene la più recente (gymtracker_corrupt_<k> o _<data> più alta)
        const groups = {};
        this.getCorruptKeys().forEach(k => {
            const m = k.match(/^(.*?)(?:_(\d{12,}))?$/);
            const base = m ? m[1] : k;
            (groups[base] = groups[base] || []).push({ k, t: m && m[2] ? Number(m[2]) : 0 });
        });
        Object.values(groups).forEach(list => {
            list.sort((a, b) => b.t - a.t).slice(1).forEach(({ k }) => { this._remove(k); n++; });
        });
        return n;
    },

    /** Scrive o LANCIA (err.code = 'QUOTA' | 'SECURITY' | 'WRITE'): per i dati che non si possono perdere. */
    _write(key, value) {
        this._cacheDrop(key);
        const json = JSON.stringify(value);
        try {
            localStorage.setItem(key, json);
            return true;
        } catch (e) {
            // spazio pieno: prima di arrendersi si tolgono i dati ricalcolabili e si riprova (R1-11)
            if (this._isQuotaError(e) && key !== this.KEYS.PERSONAL_RECORDS && key !== this.KEYS.STREAK && this._freeSpace() > 0) {
                try {
                    localStorage.setItem(key, json);
                    return true;
                } catch (e2) { e = e2; }
            }
            // Safari in navigazione privata: SecurityError, non "memoria piena" (R1-20)
            const code = this._isSecurityError(e) ? 'SECURITY' : (this._isQuotaError(e) ? 'QUOTA' : 'WRITE');
            const err = new Error(code === 'QUOTA' ? 'Spazio di archiviazione pieno: dati non salvati'
                : (code === 'SECURITY' ? 'Il browser non permette di salvare (navigazione privata?): dati non salvati'
                    : 'Scrittura non riuscita: dati non salvati'));
            err.code = code;
            err.key = key;
            err.cause = e;
            this.lastError = err;
            this.lastWriteError = { code, key, at: new Date().toISOString(), message: err.message };
            throw err;
        }
    },

    /** Scrive e restituisce true/false: per dati derivati o di contorno. */
    _tryWrite(key, value) {
        try {
            return this._write(key, value);
        } catch (e) {
            try { console.warn('[Storage]', e.message, key); } catch (x) { /* no-op */ }
            return false;
        }
    },

    _allAppKeys() {
        const keys = [];
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && k.indexOf(this.PREFIX) === 0) keys.push(k);
            }
        } catch (e) { /* no-op */ }
        return keys;
    },

    /** Chiavi con copie di dati rotti (per mostrarle o esportarle a mano). */
    getCorruptKeys() {
        return this._allAppKeys().filter(k => k.indexOf(this.CORRUPT_PREFIX) === 0);
    },

    _num(v) {
        return GT.num(v);
    },

    _int(v) {
        const n = parseInt(v, 10);
        return isFinite(n) ? n : 0;
    },

    _time(d) {
        if (d === null || d === undefined || d === '') return NaN;
        const t = new Date(d).getTime();
        return isNaN(t) ? NaN : t;
    },

    // ========================================
    // PROFILE
    // ========================================

    // Obiettivi del vecchio select del profilo → obiettivi dell'algoritmo
    GOAL_MIGRATION: { bulk: 'hypertrophy', cut: 'recomp', maintenance: 'recomp' },
    VALID_GOALS: ['strength', 'hypertrophy', 'recomp', 'endurance', 'toning'],

    _getRawProfile() {
        return this._read(this.KEYS.PROFILE, null, v => v === null || this._isObj(v));
    },

    getProfile() {
        const def = this.getDefaultProfile();
        const saved = this._getRawProfile();
        if (!saved) return def;

        const p = { ...def };
        Object.keys(saved).forEach(k => {
            if (saved[k] !== undefined) p[k] = saved[k];
        });
        if (!Array.isArray(p.equipment)) p.equipment = def.equipment.slice();
        // Preferenze v2 (§6.5): liste di id e zone dolenti valide, enfasi '' = automatica
        ['avoidExercises', 'preferExercises'].forEach(k => {
            p[k] = Array.isArray(p[k]) ? p[k].filter(x => typeof x === 'string' && x) : [];
        });
        p.painAreas = Array.isArray(p.painAreas) ? p.painAreas.filter(a => ['shoulder', 'elbow', 'knee', 'lowBack'].includes(a)) : [];
        if (!['', 'lower', 'upper', 'balanced'].includes(p.emphasis)) p.emphasis = '';

        // Migrazione dell'obiettivo: il vecchio valore resta in _legacyGoal (non si perde)
        const g = typeof p.goal === 'string' ? p.goal : '';
        if (this.GOAL_MIGRATION[g]) {
            p._legacyGoal = p._legacyGoal || g;
            p.goal = this.GOAL_MIGRATION[g];
        } else if (!this.VALID_GOALS.includes(g)) {
            if (g) p._legacyGoal = p._legacyGoal || g;
            p.goal = def.goal;
        }
        return p;
    },

    /** Salva il profilo UNENDOLO a quello esistente (i campi che il form non conosce restano). */
    saveProfile(profile) {
        const current = this._getRawProfile() || {};
        const merged = { ...current, ...(profile || {}) };
        // Un form vecchio senza l'obiettivo migrato manda '' o un valore ignoto: si tiene quello salvato
        if (profile && 'goal' in profile && !this.VALID_GOALS.includes(profile.goal) && !this.GOAL_MIGRATION[profile.goal]) {
            if (current.goal !== undefined) merged.goal = current.goal;
            else delete merged.goal;
        }
        // Il vecchio obiettivo (bulk/cut/maintenance) non si perde quando viene sostituito
        if (this.GOAL_MIGRATION[current.goal] && merged.goal !== current.goal && !merged._legacyGoal) {
            merged._legacyGoal = current.goal;
        }
        return this._tryWrite(this.KEYS.PROFILE, merged);
    },

    getDefaultProfile() {
        return {
            name: '',
            gender: '',
            birthdate: '',
            height: null,
            weight: null,
            bodyFat: null,
            level: 'beginner',
            background: 'none',
            goal: 'hypertrophy',
            targetWeight: null,
            targetBodyFat: null,
            daysPerWeek: 3,
            sessionTime: 60,
            equipment: ['bilanciere', 'manubri', 'macchine', 'cavi', 'panca', 'sbarra'],
            // v2: "Non propormelo più", "Tienilo fisso", zone dolenti, enfasi ('' = automatica)
            avoidExercises: [],
            preferExercises: [],
            painAreas: [],
            emphasis: ''
        };
    },

    // ========================================
    // SETTINGS
    // ========================================

    _getRawSettings() {
        return this._read(this.KEYS.SETTINGS, null, v => v === null || this._isObj(v));
    },

    getSettings() {
        const d = this.getDefaultSettings();
        const s = this._getRawSettings();
        if (!s) return d;
        const out = { ...d, ...s };
        if (!['beep', 'bell', 'none'].includes(out.restSound)) out.restSound = d.restSound;
        const rc = this._int(s.restTimeCompound), ri = this._int(s.restTimeIsolation);
        out.restTimeCompound = rc > 0 ? rc : d.restTimeCompound;
        out.restTimeIsolation = ri > 0 ? ri : d.restTimeIsolation;
        out.vibration = s.vibration !== false;
        out.notifications = s.notifications === true;    // mai attive se non scelte esplicitamente
        out.keepAwake = s.keepAwake !== false;
        out.backgroundAlerts = s.backgroundAlerts === true;
        return out;
    },

    /** Salva unendo alle impostazioni esistenti (un form vecchio non cancella le voci nuove). */
    saveSettings(settings) {
        const current = this._getRawSettings() || {};
        return this._tryWrite(this.KEYS.SETTINGS, { ...current, ...(settings || {}) });
    },

    getDefaultSettings() {
        return {
            restSound: 'beep',
            vibration: true,
            theme: 'dark',
            restTimeCompound: 120,
            restTimeIsolation: 75,
            notifications: false,
            keepAwake: true,
            backgroundAlerts: false
        };
    },

    // Copia di riserva dei default della palestra (la fonte è TrainingAlgorithm.DEFAULT_GYM, §3.1)
    _GYM_FALLBACK: {
        barKg: 20, ezBarKg: 10, plates: [25, 20, 15, 10, 5, 2.5, 1.25], plateCounts: null,
        dumbbells: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50],
        stackStepKg: 5, stackMinKg: 5, stackMaxKg: 150, cableStepKg: 2.5, cableMinKg: 2.5, cableMaxKg: 100,
        assistMaxKg: 70, loadablePlateStep: 2.5, loadableMaxKg: 60
    },

    /** Palestra (settings.gym): default uniti a quelli salvati, valori non validi ignorati (§3.1). */
    getGymConfig() {
        const TA = this._algo('_gym');
        const saved = (this._getRawSettings() || {}).gym;
        const g = TA ? TA._gym(this._isObj(saved) ? saved : null) : { ...this._GYM_FALLBACK, ...(this._isObj(saved) ? saved : {}) };
        return this._clone(g);
    },

    /** Unisce e salva in settings.gym (es. { barKg: 15 } o { plates: [...] }). */
    saveGymConfig(partial) {
        const current = (this._getRawSettings() || {}).gym;
        const merged = { ...(this._isObj(current) ? current : {}), ...(this._isObj(partial) ? partial : {}) };
        return this.saveSettings({ gym: merged });
    },

    /** Riposo di default (secondi) per un esercizio senza `rest` (allenamento libero, scheda manuale). */
    getDefaultRest(exerciseId) {
        const s = this.getSettings();
        return this.getExerciseType(exerciseId) === 'compound' ? s.restTimeCompound : s.restTimeIsolation;
    },

    // ========================================
    // WORKOUTS (History)
    // ========================================

    _workoutTime(w) {
        const t = this._time(w && w.date);
        if (!isNaN(t)) return t;
        const id = Number(w && w.id);
        return isFinite(id) && id > 1e12 ? id : -Infinity;
    },

    /** Tutti gli allenamenti, dal più recente. Elementi non validi ignorati (oggetti condivisi con la cache: non modificarli). */
    getWorkouts() {
        const arr = this._read(this.KEYS.WORKOUTS, [], Array.isArray, { normalize: a => this._normalizeWorkouts(a) });
        return arr
            .filter(w => this._isObj(w))
            .map((w, i) => ({ w, i, t: this._workoutTime(w) }))
            .sort((a, b) => (b.t - a.t) || (a.i - b.i))
            .map(x => x.w);
    },

    /**
     * Salva un allenamento finito. Campi in più accettati: dayIndex, programId, cycleNumber,
     * cycleWeek, isFreeWorkout. Restituisce il workout salvato.
     * LANCIA un Error con code 'QUOTA' se lo spazio è pieno: l'app deve tenere la sessione.
     */
    saveWorkout(workout) {
        const workouts = this.getWorkouts();
        const w = { ...(workout || {}) };

        let id = Date.now();
        const ids = new Set(workouts.map(x => String(x.id)));
        while (ids.has(String(id))) id++;
        w.id = id;
        w.date = GT.isValidDate(w.date) ? new Date(w.date).toISOString() : new Date().toISOString();
        if (!Array.isArray(w.exercises)) w.exercises = [];

        w.dayIndex = Number.isInteger(w.dayIndex) ? w.dayIndex : null;
        w.isFreeWorkout = !!w.isFreeWorkout;
        // Riferimenti alla scheda: se l'app non li passa, si prendono dalla scheda attiva
        const prog = (!w.isFreeWorkout && (w.programId === undefined || w.cycleNumber === undefined || w.cycleWeek === undefined))
            ? this.getActiveProgram() : null;
        const md = prog && prog.metadata ? prog.metadata : {};
        if (w.programId === undefined) w.programId = w.isFreeWorkout ? null : (md.programId ?? null);
        if (w.cycleNumber === undefined) w.cycleNumber = w.isFreeWorkout ? null : (md.cycle ? (md.cycleNumber || 1) : null);
        if (w.cycleWeek === undefined) w.cycleWeek = w.isFreeWorkout ? null : (md.cycle ? (md.cycle.currentWeek || 1) : null);
        // Fase della seduta (v2 §19.1): le sedute di scarico non contano per la progressione
        if (w.cyclePhase === undefined) {
            let ph = null;
            if (!w.isFreeWorkout) { try { ph = this.getCurrentPhase(); } catch (e) { ph = null; } }
            w.cyclePhase = ph ? ph.phase : null;
        }

        workouts.unshift(w);
        this._write(this.KEYS.WORKOUTS, workouts);   // lancia se pieno: niente perdite in silenzio

        this._afterWorkoutsChanged();
        try { this._updateCalibrationQueue(w); } catch (e) { /* di contorno */ }
        return w;
    },

    // Esce dalla coda chi è stato calibrato (serie di prova completate) o è in coda da più di 3 settimane
    _updateCalibrationQueue(w) {
        const q = this._calibrationQueue();
        const ids = Object.keys(q);
        if (!ids.length) return;
        let changed = false;
        const old = Date.now() - 21 * 86400000;
        (Array.isArray(w.exercises) ? w.exercises : []).forEach(ex => {
            if (ex && q[ex.exerciseId] && Array.isArray(ex.sets) && ex.sets.some(st => st && st.completed && st.isCalibration)) { delete q[ex.exerciseId]; changed = true; }
        });
        ids.forEach(id => { if (q[id] && this._time(q[id]) < old) { delete q[id]; changed = true; } });
        if (changed) this._setCalibrationQueue(q);
    },

    _afterWorkoutsChanged() {
        try { this.rebuildPersonalRecords(); } catch (e) { try { console.warn('[Storage] PR', e); } catch (x) { /* no-op */ } }
        try { this.updateStreak(); } catch (e) { /* derivato: si ricalcola alla prossima lettura */ }
    },

    getWorkoutById(id) {
        return this.getWorkouts().find(w => String(w.id) === String(id));
    },

    updateWorkout(id, updatedData) {
        const workouts = this.getWorkouts();
        const idx = workouts.findIndex(w => String(w.id) === String(id));
        if (idx === -1) return null;
        const old = workouts[idx];
        const updated = { ...old, ...(updatedData || {}), id: old.id };
        if (!GT.isValidDate(updated.date)) updated.date = old.date;
        workouts[idx] = updated;
        this._write(this.KEYS.WORKOUTS, workouts);
        this._afterWorkoutsChanged();
        return updated;
    },

    deleteWorkout(id) {
        const workouts = this.getWorkouts();
        const kept = workouts.filter(w => String(w.id) !== String(id));
        if (kept.length === workouts.length) return false;
        this._write(this.KEYS.WORKOUTS, kept);
        this._afterWorkoutsChanged();
        return true;
    },

    getRecentWorkouts(limit = 10) {
        return this.getWorkouts().slice(0, limit);
    },

    getWorkoutsInDateRange(startDate, endDate) {
        const s = this._time(startDate), e = this._time(endDate);
        return this.getWorkouts().filter(w => {
            const t = this._time(w.date);
            return !isNaN(t) && t >= s && t <= e;
        });
    },

    /** Allenamenti dal lunedì 00:00 di questa settimana (la domenica è l'ultimo giorno). */
    getWorkoutsThisWeek() {
        const start = GT.startOfWeek(new Date()).getTime();
        const end = GT.addDays(GT.startOfWeek(new Date()), 7).getTime();
        return this.getWorkouts().filter(w => {
            const t = this._time(w.date);
            return !isNaN(t) && t >= start && t < end;
        });
    },

    /** Data dell'ultimo allenamento di QUALSIASI tipo (pesi o cardio), null se nessuno. */
    getLastWorkoutDate() {
        let best = NaN;
        this.getWorkouts().forEach(w => {
            const t = this._time(w.date);
            if (!isNaN(t) && (isNaN(best) || t > best)) best = t;
        });
        this.getConditioningSessions().forEach(s => {
            const t = this._time(s.date);
            if (!isNaN(t) && (isNaN(best) || t > best)) best = t;
        });
        return isNaN(best) ? null : new Date(best);
    },

    /** Giorni di calendario dall'ultimo allenamento (pesi o cardio), null se nessuno. */
    getDaysSinceLastWorkout() {
        const last = this.getLastWorkoutDate();
        if (!last) return null;
        return Math.max(0, GT.calendarDaysBetween(last, new Date()));
    },

    // ========================================
    // PROGRAMS
    // ========================================

    getPrograms() {
        return this._read(this.KEYS.PROGRAMS, [], Array.isArray).filter(p => this._isObj(p));
    },

    saveProgram(program) {
        const programs = this.getPrograms();
        program.id = Date.now();
        program.createdAt = new Date().toISOString();
        programs.push(program);
        this._write(this.KEYS.PROGRAMS, programs);
        return program;
    },

    deleteProgram(id) {
        const programs = this.getPrograms().filter(p => String(p.id) !== String(id));
        this._write(this.KEYS.PROGRAMS, programs);

        // If this was the active program, clear it
        const activeProgram = this.getActiveProgram();
        if (activeProgram && String(activeProgram.id) === String(id)) {
            this.clearActiveProgram();
        }
    },

    /**
     * Scheda attiva. Il valore è condiviso con la cache (R1-10): chi deve modificarla usa
     * _programCopy() (o una sua copia) e poi setActiveProgram.
     */
    getActiveProgram() {
        // Una scheda senza giorni non è usabile: messa da parte, l'app ne farà generare un'altra
        return this._read(this.KEYS.ACTIVE_PROGRAM, null,
            v => v === null || (this._isObj(v) && Array.isArray(v.days)), { normalize: v => this._normalizeProgram(v) });
    },

    /** Copia modificabile della scheda attiva (null se non c'è). */
    _programCopy() {
        const p = this.getActiveProgram();
        return p ? this._clone(p) : null;
    },

    // Dati annidati rotti (R1-18): giorni oggetto, esercizi oggetto con exerciseId. Una volta sola in lettura.
    _normalizeProgram(p) {
        if (!this._isObj(p)) return p;
        const okDays = p.days.every(d => this._isObj(d) && (d.exercises === undefined || (Array.isArray(d.exercises) && d.exercises.every(e => this._isObj(e) && typeof e.exerciseId === 'string'))));
        if (okDays) return p;
        return {
            ...p,
            days: p.days.filter(d => this._isObj(d)).map(d => ({
                ...d, exercises: (Array.isArray(d.exercises) ? d.exercises : []).filter(e => this._isObj(e) && typeof e.exerciseId === 'string' && e.exerciseId)
            }))
        };
    },

    _normalizeWorkouts(arr) {
        const okW = (w) => this._isObj(w) && (w.exercises === undefined || (Array.isArray(w.exercises) &&
            w.exercises.every(ex => this._isObj(ex) && (ex.sets === undefined || (Array.isArray(ex.sets) && ex.sets.every(x => this._isObj(x)))))));
        if (arr.every(okW)) return arr;
        return arr.filter(w => this._isObj(w)).map(w => okW(w) ? w : {
            ...w,
            exercises: (Array.isArray(w.exercises) ? w.exercises : []).filter(ex => this._isObj(ex)).map(ex => ({
                ...ex, sets: (Array.isArray(ex.sets) ? ex.sets : []).filter(x => this._isObj(x))
            }))
        });
    },

    /**
     * Salva una scheda modificata dall'editor (R1-17). Se la STRUTTURA cambia (numero o tipi dei
     * giorni) la scheda riceve un programId nuovo e quello vecchio va in metadata.previousProgramIds:
     * getNextDayIndex riconosce le sedute vecchie dal tipo del giorno, non dall'indice (che è sfasato).
     * Ciclo, numero del ciclo e il resto dei metadata restano. @returns la scheda salvata
     */
    saveEditedProgram(program) {
        const TA = this._algo('programStructureChanged');
        const old = this.getActiveProgram();
        const p = this._clone(program);
        if (!this._isObj(p) || !Array.isArray(p.days)) return null;
        p.metadata = this._isObj(p.metadata) ? p.metadata : {};
        const changed = TA ? TA.programStructureChanged(old, p) : true;
        if (old && old.metadata && changed) {
            const prevIds = Array.isArray(old.metadata.previousProgramIds) ? old.metadata.previousProgramIds.slice() : [];
            if (old.metadata.programId != null && !prevIds.includes(old.metadata.programId)) prevIds.push(old.metadata.programId);
            p.metadata.previousProgramIds = prevIds.slice(-10);
            let id = Date.now();
            if (String(id) === String(old.metadata.programId)) id++;
            p.metadata.programId = id;
        } else if (old && old.metadata && old.metadata.programId != null) {
            p.metadata.programId = old.metadata.programId;
            if (old.metadata.previousProgramIds) p.metadata.previousProgramIds = old.metadata.previousProgramIds;
        }
        this.setActiveProgram(p);
        return p;
    },

    setActiveProgram(program) {
        this._write(this.KEYS.ACTIVE_PROGRAM, program);
    },

    clearActiveProgram() {
        this._remove(this.KEYS.ACTIVE_PROGRAM);
    },

    // ========================================
    // MEASUREMENTS
    // ========================================

    getMeasurements() {
        return this._read(this.KEYS.MEASUREMENTS, [], Array.isArray)
            .filter(m => this._isObj(m))
            .map((m, i) => ({ m, i, t: this._time(m.date) }))
            .sort((a, b) => ((isNaN(b.t) ? -Infinity : b.t) - (isNaN(a.t) ? -Infinity : a.t)) || (a.i - b.i))
            .map(x => x.m);
    },

    saveMeasurement(measurement) {
        const measurements = this.getMeasurements();
        measurement.id = Date.now();
        measurement.date = new Date().toISOString();
        measurements.unshift(measurement);
        this._write(this.KEYS.MEASUREMENTS, measurements);

        // Also update profile with latest weight
        const patch = {};
        if (measurement.weight) patch.weight = measurement.weight;
        if (measurement.bodyFat) patch.bodyFat = measurement.bodyFat;
        if (Object.keys(patch).length) this.saveProfile(patch);

        return measurement;
    },

    getLatestMeasurement() {
        const measurements = this.getMeasurements();
        return measurements.length > 0 ? measurements[0] : null;
    },

    // ========================================
    // ESERCIZI: tipo, attrezzatura, passi di carico
    // ========================================

    _exercise(exerciseId) {
        try {
            if (typeof EXERCISES_DB !== 'undefined' && EXERCISES_DB && EXERCISES_DB[exerciseId]) return EXERCISES_DB[exerciseId];
        } catch (e) { /* no-op */ }
        return null;
    },

    /** 'compound' | 'isolation' dal database (ripiego euristico solo se l'esercizio manca). */
    getExerciseType(exerciseId) {
        const ex = this._exercise(exerciseId);
        if (ex && (ex.type === 'compound' || ex.type === 'isolation')) return ex.type;
        const compoundExercises = [
            'bench-press', 'incline-bench-press', 'dumbbell-bench-press', 'dumbbell-incline-press',
            'squat', 'front-squat', 'leg-press', 'hack-squat', 'deadlift', 'romanian-deadlift',
            'barbell-row', 'pull-up', 'chin-up', 'lat-pulldown', 't-bar-row', 'seated-cable-row',
            'overhead-press', 'dumbbell-shoulder-press', 'arnold-press', 'push-press',
            'hip-thrust', 'bulgarian-split-squat', 'dumbbell-lunge', 'dips', 'close-grip-bench'
        ];
        const id = String(exerciseId || '');
        return compoundExercises.some(c => id === c || id.includes(c)) ? 'compound' : 'isolation';
    },

    /** Famiglia di attrezzatura: 'bilanciere' | 'manubri' | 'macchine' | 'cavi' | 'corpo-libero' | null (sconosciuto). */
    _equipmentClass(exerciseId) {
        const ex = this._exercise(exerciseId);
        if (!ex) return null;
        const cat = ex.category;
        if (['bilanciere', 'manubri', 'macchine', 'cavi'].includes(cat)) return cat;
        if (cat === 'corpo-libero' || cat === 'accessori') return 'corpo-libero';
        const eq = Array.isArray(ex.equipment) ? ex.equipment : [];
        for (const c of ['bilanciere', 'manubri', 'macchine', 'cavi']) if (eq.includes(c)) return c;
        return 'corpo-libero';
    },

    isBodyweightExercise(exerciseId) {
        return this._equipmentClass(exerciseId) === 'corpo-libero';
    },

    _LEG_MUSCLES: ['quadricipiti', 'femorali', 'glutei'],

    // Compound "di gambe": muscolo primario delle gambe, oppure stacco (glutei+femorali secondari)
    _isLegCompound(exerciseId) {
        const ex = this._exercise(exerciseId);
        if (!ex || ex.type !== 'compound') return false;
        const prim = Array.isArray(ex.primaryMuscles) ? ex.primaryMuscles : [];
        if (prim.some(m => this._LEG_MUSCLES.includes(m))) return true;
        const sec = Array.isArray(ex.secondaryMuscles) ? ex.secondaryMuscles : [];
        return sec.filter(m => this._LEG_MUSCLES.includes(m)).length >= 2;
    },

    // TrainingAlgorithm con la funzione richiesta (algorithm.js si carica dopo storage.js; con la cache
    // del Service Worker a metà aggiornamento potrebbe essere la versione vecchia: si usa il ripiego v1.26)
    _algo(fn) {
        try {
            if (typeof TrainingAlgorithm !== 'undefined' && TrainingAlgorithm && typeof TrainingAlgorithm[fn] === 'function') return TrainingAlgorithm;
        } catch (e) { /* no-op */ }
        return null;
    },

    _loadType(exerciseId) {
        const ex = this._exercise(exerciseId);
        return (ex && ex.loadType) || null;
    },

    /**
     * Passo di carico (§3.4, involucro su stepLoad): distanza fra `weight` e il gradino sopra sulla
     * scala vera della palestra (manubri 10 → 12, bilanciere 60 → 62,5, pacco 50 → 55); 0 a corpo libero.
     * Un peso a un soffio sotto un gradino (lo stepper v1.26 che scende passa peso − 0,01) dà il
     * gradino sotto: 12 − 0,01 → 2.
     * L'interfaccia deve usare stepWeight(id, peso, ±1), non peso ± passo.
     */
    getLoadStep(exerciseId, weight) {
        const TA = this._algo('stepLoad');
        if (!TA) return this._loadStepV1(exerciseId, weight);
        if (this._loadType(exerciseId) === 'bodyweight' || this.isBodyweightExercise(exerciseId) && !this._loadType(exerciseId)) return 0;
        const w = Math.max(0, this._num(weight));
        const gym = this.getGymConfig();
        const rec = this.getRecordedWeights(exerciseId);
        const up = TA.stepLoad(exerciseId, w, 1, gym, rec);
        if (up - w > 0 && up - w <= 0.05) {
            const below = TA.stepLoad(exerciseId, up, -1, gym, rec);
            if (below < up) return GT.round(up - below, 0.001);
        }
        return Math.max(0, GT.round(up - w, 0.001));
    },

    /** Peso sul gradino `steps` più su (o giù) della scala vera: quello che lo stepper ± deve usare. */
    stepWeight(exerciseId, weight, steps = 1) {
        const TA = this._algo('stepLoad');
        const w = Math.max(0, this._num(weight));
        if (!TA) {
            const st = this._loadStepV1(exerciseId, steps > 0 ? w : Math.max(0, w - 0.01));
            return Math.max(0, GT.round(w + Math.sign(steps) * (st || 0), 0.001));
        }
        return TA.stepLoad(exerciseId, w, steps, this.getGymConfig(), this.getRecordedWeights(exerciseId));
    },

    /** Peso portato sulla scala vera ('floor' | 'ceil' | 'nearest'). */
    snapWeight(exerciseId, weight, mode = 'nearest') {
        const TA = this._algo('snapLoad');
        if (!TA) return Math.max(0, this._num(weight));
        return TA.snapLoad(exerciseId, Math.max(0, this._num(weight)), mode, this.getGymConfig(), this.getRecordedWeights(exerciseId));
    },

    /** Salto di progressione (§3.4, involucro su getProgressionJump): 0 se non c'è (corpo libero). */
    getProgressionIncrement(exerciseId, weight) {
        const TA = this._algo('getProgressionJump');
        if (!TA) return this._progressionIncrementV1(exerciseId, weight);
        const w = Math.max(0, this._num(weight));
        const j = TA.getProgressionJump(exerciseId, w, this.getGymConfig(), this.getRecordedWeights(exerciseId));
        return j ? GT.round(j.nextKg - w, 0.001) : 0;
    },

    /** v1.26 (ripiego): bilanciere 2.5; manubri 1 sotto i 10 kg, poi 2; macchine/cavi 2.5; corpo libero 0. */
    _loadStepV1(exerciseId, weight) {
        switch (this._equipmentClass(exerciseId)) {
            case 'bilanciere': return 2.5;
            case 'manubri': return this._num(weight) < 10 ? 1 : 2;
            case 'macchine':
            case 'cavi': return 2.5;
            case 'corpo-libero': return 0;
            default: return 2.5;   // esercizio non in archivio: passo da bilanciere/macchina
        }
    },

    /**
     * Salto di progressione (UNICA fonte per sessione, riepilogo, suggerimento, stepper, detraining).
     * Compound gambe: bilanciere/macchine 5, manubri 2. Compound upper: bilanciere/macchine 2.5,
     * manubri = passo. Isolamento = passo. Corpo libero 0. Sempre multiplo del passo.
     */
    _progressionIncrementV1(exerciseId, weight) {
        const step = this._loadStepV1(exerciseId, weight);
        if (!step) return 0;
        const cls = this._equipmentClass(exerciseId);
        if (this.getExerciseType(exerciseId) === 'compound') {
            if (this._isLegCompound(exerciseId)) return cls === 'manubri' ? 2 : 5;
            return cls === 'manubri' ? step : 2.5;
        }
        return step;
    },

    /** Carico disponibile subito sotto a `weight` (manubri: 10 → 9, 12 → 10; bilanciere 40 → 37.5). */
    _nextLowerWeight(exerciseId, weight) {
        const w = this._num(weight) - 1e-6;
        const step = this._loadStepV1(exerciseId, w);
        if (!step) return this._num(weight);
        return GT.floorTo(w, step);
    },

    // ========================================
    // PERSONAL RECORDS (derivati dagli allenamenti)
    // ========================================

    getPersonalRecords() {
        return this._read(this.KEYS.PERSONAL_RECORDS, {}, v => this._isObj(v));
    },

    /**
     * Calculate estimated 1RM using the best formula for the rep range
     * - Brzycki (1993): more accurate for 1-10 reps → 1RM = weight × 36 / (37 - reps)
     * - Epley: better for 10+ reps → 1RM = weight × (1 + reps/30)
     * - For 20+ reps: capped, formulas become unreliable
     * Sources: LeSuer et al. 1997 comparison study, NSCA guidelines
     */
    calculateE1RM(weight, reps) {
        weight = this._num(weight);
        reps = this._int(reps);
        if (!weight || !reps || reps <= 0) return 0;
        if (reps === 1) return weight;

        let e1rm;
        if (reps <= 10) {
            e1rm = weight * (36 / (37 - reps));
        } else if (reps <= 20) {
            e1rm = weight * (1 + reps / 30);
        } else {
            e1rm = weight * (1 + 20 / 30);
        }
        return Math.round(e1rm * 10) / 10;
    },

    // Esercizio misurato in secondi (plank, side plank, farmer walk…): niente e1RM, record = secondi
    _isTimed(exerciseId) {
        const ex = this._exercise(exerciseId);
        return !!ex && ex.metric === 'time';
    },

    // Serie completate con peso > 0 e almeno 1 rep, raggruppate per esercizio. Le serie di
    // riscaldamento e di prova ("Trova il peso") non contano; quelle a tempo anche senza peso.
    _completedLoadedSets(workout) {
        const out = new Map();
        if (!workout || !Array.isArray(workout.exercises)) return out;
        workout.exercises.forEach(ex => {
            if (!ex || !ex.exerciseId || !Array.isArray(ex.sets)) return;
            const timed = this._isTimed(ex.exerciseId);
            ex.sets.forEach(s => {
                if (!s || !s.completed || s.isWarmup || s.isCalibration) return;
                const w = this._num(s.weight), r = this._int(s.reps);
                if (!(r > 0) || (!(w > 0) && !timed)) return;
                if (!out.has(ex.exerciseId)) out.set(ex.exerciseId, []);
                out.get(ex.exerciseId).push({ weight: Math.max(0, w), reps: r, e1rm: timed ? 0 : this.calculateE1RM(w, r), set: s });
            });
        });
        return out;
    },

    /**
     * Ricalcola gymtracker_prs da zero da tutti gli allenamenti.
     * maxWeight = serie più PESANTE (a parità, più reps); maxReps = più reps a ≥50% del max;
     * estimated1RM = migliore; history = una voce per sessione (la serie con E1RM migliore), max 50.
     * I flag isNewPR delle serie NON vengono toccati.
     */
    rebuildPersonalRecords() {
        const workouts = this.getWorkouts().slice().reverse(); // dal più vecchio
        const prs = {};
        const allSets = {};

        workouts.forEach(workout => {
            this._completedLoadedSets(workout).forEach((sets, exId) => {
                if (!prs[exId]) {
                    prs[exId] = {
                        maxWeight: 0, maxWeightReps: 0, maxWeightDate: null,
                        maxReps: 0, maxRepsWeight: 0, maxRepsDate: null,
                        estimated1RM: 0, e1rmDate: null, e1rmWeight: 0, e1rmReps: 0,
                        history: []
                    };
                    allSets[exId] = [];
                }
                const rec = prs[exId];
                let best = null;
                sets.forEach(s => {
                    allSets[exId].push({ weight: s.weight, reps: s.reps, date: workout.date });
                    if (s.weight > rec.maxWeight || (s.weight === rec.maxWeight && s.reps > rec.maxWeightReps)) {
                        rec.maxWeight = s.weight;
                        rec.maxWeightReps = s.reps;
                        rec.maxWeightDate = workout.date;
                    }
                    if (s.e1rm > rec.estimated1RM) {
                        rec.estimated1RM = s.e1rm;
                        rec.e1rmDate = workout.date;
                        rec.e1rmWeight = s.weight;
                        rec.e1rmReps = s.reps;
                    }
                    if (!best || s.e1rm > best.e1rm || (s.e1rm === best.e1rm && s.weight > best.weight)) best = s;
                });
                if (best) rec.history.push({ date: workout.date, weight: best.weight, reps: best.reps, e1rm: best.e1rm });
            });
        });

        Object.keys(prs).forEach(exId => {
            const rec = prs[exId];
            const minW = rec.maxWeight * 0.5;
            allSets[exId].forEach(s => {
                if (s.weight >= minW && s.reps > rec.maxReps) {
                    rec.maxReps = s.reps;
                    rec.maxRepsWeight = s.weight;
                    rec.maxRepsDate = s.date;
                }
            });
            if (rec.history.length > 50) rec.history = rec.history.slice(-50);
        });

        this._tryWrite(this.KEYS.PERSONAL_RECORDS, prs);
        return prs;
    },

    // Nome storico: ora ricalcola tutto (l'argomento è ignorato)
    updatePersonalRecords() {
        return this.rebuildPersonalRecords();
    },

    getExerciseHistory(exerciseId) {
        const prs = this.getPersonalRecords();
        return prs[exerciseId] && Array.isArray(prs[exerciseId].history) ? prs[exerciseId].history : [];
    },

    getExercisePR(exerciseId) {
        const prs = this.getPersonalRecords();
        return prs[exerciseId] || null;
    },

    /**
     * La serie appena completata è un record?
     * @param earlierSetsThisSession serie GIÀ completate prima di questa nella stessa sessione
     *        (esclusa quella che si sta segnando)
     * @returns {{isNewPR:boolean, type:'weight'|'e1rm'|null, isFirstTime:boolean, oldValue?, newValue?}}
     * Prima volta su un esercizio (nessun record salvato) = isFirstTime:true, isNewPR:false.
     */
    checkForNewPR(exerciseId, weight, reps, earlierSetsThisSession = []) {
        const w = this._num(weight), r = this._int(reps);
        const current = this.getPersonalRecords()[exerciseId];
        if (this._isTimed(exerciseId)) {
            // a tempo: record = più secondi (anche nella stessa sessione)
            const best = Math.max(this._int(current && current.maxReps), ...(Array.isArray(earlierSetsThisSession) ? earlierSetsThisSession : [])
                .filter(s => s && (!('completed' in s) || s.completed)).map(s => this._int(s.reps)), 0);
            if (!current || !(this._int(current.maxReps) > 0)) return { isNewPR: false, type: null, isFirstTime: true };
            return r > best ? { isNewPR: true, type: 'time', isFirstTime: false, oldValue: best, newValue: r } : { isNewPR: false, type: null, isFirstTime: false };
        }
        const hasRecord = !!(current && (this._num(current.maxWeight) > 0 || this._num(current.estimated1RM) > 0));

        if (!hasRecord) return { isNewPR: false, type: null, isFirstTime: true };
        if (!(w > 0) || !(r > 0)) return { isNewPR: false, type: null, isFirstTime: false };

        let bestW = this._num(current.maxWeight);
        let bestE = this._num(current.estimated1RM);
        (Array.isArray(earlierSetsThisSession) ? earlierSetsThisSession : []).forEach(s => {
            if (!s || ('completed' in s && !s.completed)) return;
            const sw = this._num(s.weight), sr = this._int(s.reps);
            if (!(sw > 0) || !(sr > 0)) return;
            bestW = Math.max(bestW, sw);
            bestE = Math.max(bestE, this.calculateE1RM(sw, sr));
        });

        if (w > bestW + 1e-9) {
            return { isNewPR: true, type: 'weight', isFirstTime: false, oldValue: bestW, newValue: w };
        }
        const e = this.calculateE1RM(w, r);
        if (e > bestE + 1e-9) {
            return { isNewPR: true, type: 'e1rm', isFirstTime: false, oldValue: bestE, newValue: e };
        }
        return { isNewPR: false, type: null, isFirstTime: false };
    },

    /**
     * PR VERI per allenamento: serie con isNewPR che battono davvero il record del momento
     * (esclusa la prima sessione di ogni esercizio). Filtra i flag gonfiati della v1.25.
     * @returns {Map<workoutId, number>}
     */
    _realPRCounts(workouts) {
        const list = (workouts || this.getWorkouts()).slice().reverse();
        const best = {};
        const counts = new Map();
        list.forEach(workout => {
            let n = 0;
            this._completedLoadedSets(workout).forEach((sets, exId) => {
                const seen = !!best[exId];
                const b = best[exId] || { w: 0, e: 0 };
                sets.forEach(s => {
                    const beats = s.weight > b.w + 1e-9 || s.e1rm > b.e + 1e-9;
                    if (seen && beats && s.set.isNewPR === true) n++;
                    b.w = Math.max(b.w, s.weight);
                    b.e = Math.max(b.e, s.e1rm);
                });
                best[exId] = b;
            });
            counts.set(String(workout.id), n);
        });
        return counts;
    },

    countRealPRs(workoutsSubset) {
        const counts = this._realPRCounts();
        const subset = workoutsSubset || this.getWorkouts();
        return subset.reduce((sum, w) => sum + (counts.get(String(w.id)) || 0), 0);
    },

    // ========================================
    // ULTIME PRESTAZIONI (top set)
    // ========================================

    /**
     * Sessioni (dalla più recente) con almeno una serie completata di questo esercizio.
     * top = serie più pesante (a parità, più reps); workingReps = reps delle serie al peso del top set.
     */
    _sessionsFor(exerciseId, limit = 3) {
        const bw = this.isBodyweightExercise(exerciseId) || !this._needsWeight(exerciseId);
        const out = [];
        const workouts = this.getWorkouts();
        for (const workout of workouts) {
            if (out.length >= limit) break;
            if (!Array.isArray(workout.exercises)) continue;
            const sets = [];
            workout.exercises.forEach(ex => {
                if (!ex || ex.exerciseId !== exerciseId || !Array.isArray(ex.sets)) return;
                ex.sets.forEach(s => {
                    if (!s || !s.completed || s.isWarmup || s.isCalibration) return;
                    const w = this._num(s.weight), r = this._int(s.reps);
                    if (!(r > 0)) return;
                    if (!(w > 0) && !bw) return;
                    sets.push({ weight: Math.max(0, w), reps: r });
                });
            });
            if (sets.length === 0) continue;
            const top = sets.reduce((b, s) => (s.weight > b.weight || (s.weight === b.weight && s.reps > b.reps)) ? s : b);
            const workingReps = sets.filter(s => Math.abs(s.weight - top.weight) < 0.01).map(s => s.reps);
            out.push({ date: workout.date, sets, top, workingReps });
        }
        return out;
    },

    // Peso 0 impossibile per bilanciere, manubri, pacco, cavo e assistite (serie senza peso = dato
    // mancante); possibile a corpo libero, con la zavorra a 0, alle macchine a dischi e a tempo
    _needsWeight(exerciseId) {
        const lt = this._loadType(exerciseId);
        if (!lt) return !this.isBodyweightExercise(exerciseId);
        if (this._isTimed(exerciseId) && lt === 'bodyweight') return false;
        return ['barbell', 'ez-bar', 'dumbbell-pair', 'dumbbell-single', 'machine-stack', 'cable', 'assisted'].includes(lt);
    },

    // Fase del ciclo in cui è stata fatta una seduta: quella salvata (v2), altrimenti dalla settimana
    // del ciclo della scheda attiva o dallo storico dei cicli. null se non si sa.
    _workoutPhase(w, program, history) {
        if (!w) return null;
        if (w.cyclePhase) return w.cyclePhase;
        if (w.isFreeWorkout) return null;
        const week = this._int(w.cycleWeek);
        if (!(week > 0)) return null;
        const md = program && program.metadata;
        const cyc = this._getCycle(program);
        if (cyc && (w.programId == null || md.programId == null || String(w.programId) === String(md.programId)) &&
            (w.cycleNumber == null || this._int(w.cycleNumber) === (this._int(md.cycleNumber) || 1))) {
            const ph = cyc.phases.find(p => p && p.week === week);
            return ph ? ph.phase : null;
        }
        const h = (history || []).find(c => this._int(c.cycleNumber) === this._int(w.cycleNumber));
        if (h && Array.isArray(h.phases) && h.phases[week - 1]) return /deload|scarico/i.test(h.phases[week - 1]) ? 'deload' : 'accumulation';
        return null;
    },

    /**
     * Sedute con l'esercizio, dalla più recente (§19.4): [{date, phase, targetReps, targetRir, sets}].
     * Serie normalizzate {weight, reps, rir, completed, isWarmup, isCalibration, isBodyweight}; restano
     * solo le sedute con almeno una serie di lavoro.
     */
    getExerciseSessions(exerciseId, { limit = 3, excludeDeload = true } = {}) {
        const out = [];
        const program = this.getActiveProgram();
        const history = this.getCycleHistory();
        const needsW = this._needsWeight(exerciseId);
        for (const w of this.getWorkouts()) {
            if (out.length >= limit) break;
            if (!Array.isArray(w.exercises)) continue;
            const sets = [];
            let targetReps = null, targetRir = null;
            w.exercises.forEach(ex => {
                if (!ex || ex.exerciseId !== exerciseId || !Array.isArray(ex.sets)) return;
                if (targetReps == null && ex.targetReps) targetReps = ex.targetReps;
                if (targetRir == null && Number.isFinite(Number(ex.targetRir)) && ex.targetRir !== '' && ex.targetRir !== null) targetRir = Number(ex.targetRir);
                ex.sets.forEach(s => {
                    if (!s) return;
                    const rir = s.rir === undefined || s.rir === null || s.rir === '' ? null : Number(s.rir);
                    sets.push({
                        weight: Math.max(0, this._num(s.weight)), reps: this._int(s.reps),
                        rir: Number.isFinite(rir) ? rir : null, completed: !!s.completed,
                        isWarmup: !!s.isWarmup, isCalibration: !!s.isCalibration, isBodyweight: !!s.isBodyweight
                    });
                });
            });
            const work = sets.filter(s => s.completed && !s.isWarmup && !s.isCalibration && s.reps > 0 && (s.weight > 0 || !needsW));
            if (!work.length) continue;
            const phase = this._workoutPhase(w, program, history);
            if (excludeDeload && phase === 'deload') continue;
            out.push({ date: w.date, phase, targetReps, targetRir, sets: sets.filter(s => !needsW || s.weight > 0 || !s.completed) });
        }
        return out;
    },

    /** Pesi usati nelle serie di lavoro delle ultime `limit` sedute (insegnano la scala della palestra, §3.2). */
    getRecordedWeights(exerciseId, limit = 20) {
        const lt = this._loadType(exerciseId);
        if (lt === 'bodyweight') return [];
        const out = new Set();
        this.getExerciseSessions(exerciseId, { limit, excludeDeload: false }).forEach(s => s.sets.forEach(x => {
            if (!x.completed || x.isWarmup || x.isCalibration || !(x.reps > 0)) return;
            if (x.isBodyweight && lt === 'bodyweight-loadable') return;   // v1.25: peso corporeo, non zavorra
            if (x.weight > 0) out.add(x.weight);
        }));
        return [...out].sort((a, b) => a - b);
    },

    /** Fase del ciclo di oggi (scarico manuale compreso), normalizzata v2; null senza ciclo. */
    getCurrentPhase() {
        const program = this.getActiveProgram();
        const cycle = this._getCycle(program);
        if (!cycle) return null;
        const week = Math.max(1, this._int(cycle.currentWeek) || 1);
        let ph = this._phaseFor(cycle, week);
        if (this._isManualDeload(cycle) && (!ph || ph.phase !== 'deload')) {
            const dl = cycle.phases.find(p => p && p.phase === 'deload');
            ph = { ...(dl || { phase: 'deload', phaseName: 'Deload', rirTarget: { min: 4, max: 5 }, volumeMultiplier: 0.5 }), week };
        }
        const TA = this._algo('normalizePhase');
        return TA ? TA.normalizePhase(ph) : (ph || null);
    },

    // Ultima prestazione: top set (serie più pesante) dell'ultima sessione con l'esercizio
    getLastPerformance(exerciseId) {
        const s = this._sessionsFor(exerciseId, 1)[0];
        if (!s) return null;
        return {
            weight: s.top.weight,
            reps: s.top.reps,
            date: s.date,
            allSets: s.sets.map(x => ({ weight: x.weight, reps: x.reps })),
            topSet: { weight: s.top.weight, reps: s.top.reps },
            workingReps: s.workingReps.slice()
        };
    },

    // Ultime N sessioni con questo esercizio (dalla più recente) — per rilevare stalli ricorrenti
    getRecentPerformances(exerciseId, limit = 3) {
        return this._sessionsFor(exerciseId, limit).map(s => ({
            weight: s.top.weight,
            topReps: s.top.reps,
            minReps: Math.min(...s.workingReps),
            date: s.date
        }));
    },

    // ========================================
    // DOUBLE PROGRESSION SYSTEM
    // ========================================

    /** "8-12" → {min:8,max:12}; "10" → {10,10}; accetta anche 8–12, numeri e "30-45s". */
    parseRepRange(repRangeStr) {
        if (typeof repRangeStr === 'number' && repRangeStr > 0) return { min: repRangeStr, max: repRangeStr };
        if (!repRangeStr || typeof repRangeStr !== 'string') return { min: 8, max: 12 };
        const m = repRangeStr.match(/(\d+)\s*[-–—]\s*(\d+)/);
        if (m) {
            const a = parseInt(m[1], 10), b = parseInt(m[2], 10);
            return { min: Math.min(a, b), max: Math.max(a, b) };
        }
        const single = repRangeStr.match(/(\d+)/);
        if (single) {
            const n = parseInt(single[1], 10);
            if (n > 0) return { min: n, max: n };
        }
        return { min: 8, max: 12 };
    },

    _fmtKg(w) {
        return `${GT.round(w, 0.01)} kg`;
    },

    _reduceReps(reps, factor) {
        const r = Math.max(1, this._int(reps));
        let t = Math.max(1, Math.floor(r * factor));
        if (t >= r && r > 1) t = r - 1;
        return t;
    },

    // Peso iniziale prudente per un esercizio mai fatto (l'app lo precompila nello stepper)
    _startingWeight(exerciseId) {
        const cls = this._equipmentClass(exerciseId);
        const compound = this.getExerciseType(exerciseId) === 'compound';
        let w;
        switch (cls) {
            case 'corpo-libero': return 0;
            case 'bilanciere': w = compound ? 20 : 10; break;
            case 'manubri': w = compound ? 8 : 4; break;
            case 'macchine': w = compound ? 20 : 10; break;
            case 'cavi': w = compound ? 15 : 10; break;
            default: w = 10;
        }
        let gender = '';
        try { gender = (this._getRawProfile() || {}).gender || ''; } catch (e) { /* no-op */ }
        if (gender === 'female') {
            const step = this.getLoadStep(exerciseId, w * 0.6) || 1;
            w = Math.max(step, GT.floorTo(w * 0.6, step));
            if (cls === 'bilanciere' && compound) w = 20;   // il bilanciere pesa quello che pesa
        }
        return w;
    },

    /**
     * Suggerimento per la prossima volta (v2, ALGORITMO-V2 §9): raccoglie i dati e chiama la funzione
     * pura TrainingAlgorithm.computeNextTarget. Firma v1.26 invariata, `opts` facoltativo:
     * { targetRir (della prossima seduta), level, phase (fase della prossima seduta; default quella di
     * oggi, scarico manuale compreso), prevTargetRir }.
     * @returns Suggestion {status, action, suggestedWeight (SEMPRE un numero), suggestedReps, targetRir,
     *   metric, variantId, bigJump, rirDelta, increment, message, lastPerformance, ...}
     * status: new | detraining | refamiliarize | increase_weight | increase_reps | maintain | rir_up |
     *   rir_hold | rir_down | backoff | variant_up | variant_down | add_load | increase_time | deload
     */
    getProgressionSuggestion(exerciseId, targetRepRange, goal = 'hypertrophy', opts = {}) {
        const TA = this._algo('computeNextTarget');
        if (!TA) return this._progressionSuggestionV1(exerciseId, targetRepRange, goal);
        const o = opts || {};
        const profile = this.getProfile();
        const sessions = this.getExerciseSessions(exerciseId, { limit: 4, excludeDeload: false });
        const range = this.parseRepRange(targetRepRange || (sessions[0] && sessions[0].targetReps));
        const phase = o.phase !== undefined ? (o.phase ? TA.normalizePhase(o.phase) : null) : this.getCurrentPhase();
        const compound = this.getExerciseType(exerciseId) === 'compound';
        const prev = sessions.find(x => x.phase !== 'deload');
        const prevRir = Number.isFinite(Number(o.prevTargetRir)) && o.prevTargetRir !== null ? Number(o.prevTargetRir)
            : (prev && Number.isFinite(prev.targetRir) ? prev.targetRir : 2);
        let nextRir = Number.isFinite(Number(o.targetRir)) && o.targetRir !== null ? Number(o.targetRir)
            : (phase && phase.rir ? (phase.phase === 'deload' ? 4 : (compound ? phase.rir.compound : phase.rir.isolation)) : prevRir);
        if (typeof TA._painTouches === 'function' && TA._painTouches(exerciseId, profile)) nextRir = Math.max(2, nextRir);
        // mai fatto: peso portato da un esercizio della stessa famiglia fatto di recente (rotazione, R3-05)
        const related = sessions.length ? null : this._relatedLoad(exerciseId);
        const sug = TA.computeNextTarget({
            exerciseId,
            range: [range.min, range.max],
            targetRir: prevRir,
            nextTargetRir: nextRir,
            level: o.level || profile.level,
            gym: this.getGymConfig(),
            recorded: this.getRecordedWeights(exerciseId),
            sessions,
            personPauseDays: this.getDaysSinceLastWorkout(),
            now: new Date(),
            profile,
            phase: phase ? phase.phase : null,
            loadFactor: phase ? phase.loadFactor : undefined,
            related
        });
        // calibrazione rimandata da planCalibration: si fa alla prossima seduta (R3-06)
        if (!sug.calibrate && sug.status !== 'deload' && this._calibrationQueue()[exerciseId] &&
            !['bodyweight', 'bodyweight-loadable'].includes(this._loadType(exerciseId))) {
            const r = this.parseRepRange(targetRepRange || (sessions[0] && sessions[0].targetReps));
            sug.calibrate = true;
            sug.calibrateQueued = true;
            sug.testReps = Math.round((r.min + r.max) / 2);
            sug.message = `Trova il peso: prova ${String(GT.round(sug.suggestedWeight, 0.01)).replace('.', ',')} kg × ${sug.testReps}`;
        }
        return sug;
    },

    /** Ultimo carico di un esercizio fatto di recente da cui convertire (stessa famiglia/schema, §7.2). */
    _relatedLoad(exerciseId) {
        const TA = this._algo('convertLoad');
        if (!TA) return null;
        const lt = this._loadType(exerciseId);
        if (!lt || ['bodyweight', 'bodyweight-loadable', 'assisted'].includes(lt)) return null;
        for (const id of this._recentExerciseIds(12)) {
            if (id === exerciseId) continue;
            const c = TA.convertLoad(id, exerciseId, 100);
            if (!c || c.mode !== 'convert') continue;
            const ses = this.getExerciseSessions(id, { limit: 1 })[0];
            if (!ses) continue;
            const w = Math.max(0, ...ses.sets.filter(x => x.completed && !x.isWarmup && !x.isCalibration && x.reps > 0).map(x => x.weight));
            if (w > 0) return { exerciseId: id, weight: w, date: ses.date };
        }
        return null;
    },

    _calibrationQueue() {
        const meta = this._read(this.KEYS.META, {}, v => this._isObj(v));
        return this._isObj(meta.calibrationQueue) ? meta.calibrationQueue : {};
    },

    _setCalibrationQueue(q) {
        const meta = this._read(this.KEYS.META, {}, v => this._isObj(v));
        meta.calibrationQueue = q;
        return this._tryWrite(this.KEYS.META, meta);
    },

    /**
     * "Trova il peso" distribuito nelle sedute (R3-06): quali esercizi del giorno calibrare OGGI (al
     * massimo 2-3, prima i multiarticolari principali); gli altri partono dalla stima e vengono messi in
     * coda: alla seduta dopo il loro suggerimento ha `calibrate: true` (calibrateQueued).
     * day: giorno della scheda ({exercises}) o array di esercizi ({exerciseId, reps|targetReps, role?, targetRir?}).
     * opts: { goal, minutes (durata della seduta, default quella della scheda), max, dryRun (non mette in coda) }
     * @returns {{ calibrate: string[], deferred: string[], extraMin: number, perExercise: [...] }}
     */
    planCalibration(day, opts = {}) {
        const TA = this._algo('planCalibration');
        const exs = (Array.isArray(day) ? day : (day && Array.isArray(day.exercises) ? day.exercises : [])).filter(e => e && e.exerciseId);
        if (!TA || !exs.length) return { calibrate: [], deferred: [], extraMin: 0, perExercise: [] };
        const o = opts || {};
        const profile = this.getProfile();
        const md = (this.getActiveProgram() || {}).metadata || {};
        const goal = o.goal || md.goal || profile.goal || 'hypertrophy';
        const roles = TA._rolesOf(exs);
        const items = exs.map((ex, i) => {
            const reps = ex.reps != null ? ex.reps : ex.targetReps;
            let suggestion = null;
            try {
                const so = { level: profile.level };
                if (Number.isFinite(Number(ex.targetRir)) && ex.targetRir !== null && ex.targetRir !== '') so.targetRir = Number(ex.targetRir);
                suggestion = this.getProgressionSuggestion(ex.exerciseId, reps, goal, so);
            } catch (e) { suggestion = null; }
            return { exerciseId: ex.exerciseId, index: i, role: roles[i], reps, suggestion };
        });
        const plan = TA.planCalibration(items, { goal, level: profile.level, minutes: o.minutes != null ? o.minutes : md.sessionDuration, max: o.max });
        if (!o.dryRun && plan.deferred.length) {
            const q = { ...this._calibrationQueue() };
            const now = new Date().toISOString();
            plan.deferred.forEach(id => { if (!q[id]) q[id] = now; });
            this._setCalibrationQueue(q);
        }
        return plan;
    },

    // v1.26 (ripiego se algorithm.js non ha computeNextTarget): doppia progressione sul TOP SET
    _progressionSuggestionV1(exerciseId, targetRepRange, goal = 'hypertrophy') {
        const range = this.parseRepRange(targetRepRange);
        const sessions = this._sessionsFor(exerciseId, 3);
        const last = sessions[0];

        if (!last) {
            const w = this._startingWeight(exerciseId);
            return {
                status: 'new',
                action: 'start',
                suggestedWeight: w,
                suggestedReps: range.min,
                isEstimate: true,
                message: `Prima volta: un peso da ${range.min}-${range.max} rep`,
                lastPerformance: null
            };
        }

        const lastW = last.top.weight;
        const topReps = last.top.reps;
        const working = last.workingReps;
        const lastPerformance = {
            weight: lastW,
            reps: last.sets.map(s => s.reps),
            topReps,
            date: last.date
        };
        const step = this.getLoadStep(exerciseId, lastW);
        const bw = !step;

        // CASO 0: pausa della PERSONA ≥ 21 giorni → detraining
        const pauseDays = this.getDaysSinceLastWorkout();
        if (pauseDays !== null && pauseDays >= 21) {
            const weeks = pauseDays / 7;
            const factor = Math.max(0.6, 1 - 0.025 * (weeks - 2));
            const weeksOff = Math.floor(weeks);
            const red = this._detrainLoad(exerciseId, lastW, topReps, factor);
            const pct = red.reducedWeight ? Math.round((1 - red.weight / lastW) * 100) : 0;
            return {
                status: 'detraining',
                action: 'return_deload',
                suggestedWeight: red.weight,
                suggestedReps: red.reducedWeight ? range.min : red.reps,
                rirTarget: 3,
                weeksOff,
                reductionPct: pct,
                message: red.reducedWeight
                    ? `Rientro dopo ${weeksOff} settimane: ${this._fmtKg(red.weight)} (−${pct}%), RIR 3`
                    : (bw ? `Rientro dopo ${weeksOff} settimane: ${red.reps} rep, RIR 3`
                        : `Rientro dopo ${weeksOff} settimane: ${this._fmtKg(red.weight)} × ${red.reps}, RIR 3`),
                lastPerformance
            };
        }

        // CASO 0b: esercizio assente da ≥ 6 settimane, persona in attività → riprendere confidenza
        const exDays = GT.calendarDaysBetween(last.date, new Date());
        if (isFinite(exDays) && exDays >= 42) {
            let w = lastW, reps = range.min, reduced = false;
            if (!bw) {
                const lower = this._nextLowerWeight(exerciseId, lastW);
                if (lower > 0 && lower >= lastW * 0.6 - 1e-9 && lower < lastW) { w = lower; reduced = true; }
            }
            if (!reduced) reps = this._reduceReps(topReps, 0.85);
            const weeksAbsent = Math.floor(exDays / 7);
            return {
                status: 'refamiliarize',
                action: 'refamiliarize',
                suggestedWeight: w,
                suggestedReps: reps,
                rirTarget: 3,
                weeksAbsent,
                message: bw ? `Non lo fai da ${weeksAbsent} settimane: ${reps} rep, RIR 3`
                    : `Non lo fai da ${weeksAbsent} settimane: ${this._fmtKg(w)}${reduced ? '' : ` × ${reps}`}, RIR 3`,
                lastPerformance
            };
        }

        const inc = this.getProgressionIncrement(exerciseId, lastW);

        // CASO 1: tutte le serie al top set al massimo del range → più peso
        if (working.every(r => r >= range.max)) {
            if (inc > 0) {
                const newWeight = GT.round(lastW + inc, 0.001);
                return {
                    status: 'increase_weight',
                    action: 'weight_up',
                    suggestedWeight: newWeight,
                    suggestedReps: range.min,
                    increment: inc,
                    message: `Aumenta a ${this._fmtKg(newWeight)} (+${inc})`,
                    lastPerformance
                };
            }
            return {
                status: 'increase_reps',
                action: 'reps_up',
                suggestedWeight: lastW,
                suggestedReps: topReps + 1,
                message: `Oltre ${range.max} rep: +1 rep o variante più dura`,
                lastPerformance
            };
        }

        // CASO 2: tutte nel range (o sopra il minimo) → +1 rep
        if (working.every(r => r >= range.min)) {
            const target = Math.min(range.max, Math.min(...working) + 1);
            return {
                status: 'increase_reps',
                action: 'reps_up',
                suggestedWeight: lastW,
                suggestedReps: target,
                suggestedRepsPerSet: working.map(r => Math.min(r + 1, range.max)),
                message: bw ? `Punta a ${target} rep` : `${this._fmtKg(lastW)}, punta a ${target} rep`,
                lastPerformance
            };
        }

        // CASO 3: sotto il range → stallo (≥2 delle ultime 3 sessioni allo stesso top set sotto il minimo) → back-off
        const stalled = sessions.filter(s => Math.abs(s.top.weight - lastW) < 0.01 && Math.min(...s.workingReps) < range.min).length;
        if (stalled >= 2) {
            if (!bw) {
                const bStep = this.getLoadStep(exerciseId, lastW * 0.9) || step;
                let backoff = GT.round(lastW * 0.9, bStep);
                if (backoff >= lastW) backoff = this._nextLowerWeight(exerciseId, lastW);
                if (backoff > 0 && backoff < lastW) {
                    return {
                        status: 'backoff',
                        action: 'deload_exercise',
                        suggestedWeight: backoff,
                        suggestedReps: range.min,
                        message: `Stallo a ${this._fmtKg(lastW)}: scendi a ${this._fmtKg(backoff)} e risali`,
                        lastPerformance
                    };
                }
            }
            return {
                status: 'backoff',
                action: 'deload_exercise',
                suggestedWeight: lastW,
                suggestedReps: range.min,
                message: `Stallo: variante più facile, punta a ${range.min} rep`,
                lastPerformance
            };
        }

        return {
            status: 'maintain',
            action: 'consolidate',
            suggestedWeight: lastW,
            suggestedReps: range.min,
            message: bw ? `Punta a ${range.min} rep su tutte le serie` : `Mantieni ${this._fmtKg(lastW)}, punta a ${range.min} rep`,
            lastPerformance
        };
    },

    // Carico ridotto per il rientro: mai ≥ del vecchio, mai sotto il 60%; se non si può, stesso peso e meno reps
    _detrainLoad(exerciseId, lastW, topReps, factor) {
        const step = this.getLoadStep(exerciseId, lastW * factor);
        const keep = () => ({ weight: lastW, reps: this._reduceReps(topReps, factor), reducedWeight: false });
        if (!step || !(lastW > 0)) return keep();
        let w = GT.floorTo(lastW * factor, step);
        if (w >= lastW) w = this._nextLowerWeight(exerciseId, lastW);
        const min = lastW * 0.6;
        if (w < min - 1e-9) w = GT.ceilTo(min, step);
        if (!(w > 0) || w >= lastW) return keep();
        return { weight: w, reps: null, reducedWeight: true };
    },

    /**
     * Pausa lunga (compatibilità): fattore di riduzione per `daysAgo` giorni di stop, null sotto i 21.
     * @returns {{weeksOff:number, factor:number}|null}
     */
    getDetrainingAdjustment(daysAgo) {
        const weeksOff = daysAgo / 7;
        if (!(weeksOff >= 3)) return null;
        const factor = Math.max(0.60, 1 - 0.025 * (weeksOff - 2));
        return { weeksOff: Math.floor(weeksOff), factor };
    },

    /**
     * Valuta le serie di una sessione appena fatta (riepilogo di fine allenamento, avviso in sessione).
     * Stessa logica del suggerimento (computeNextTarget sulle sole serie di oggi, RIR compreso).
     * opts = { targetRir } (RIR target di oggi; default quello della fase).
     * @returns {{action:'up'|'reps'|'maintain'|null, increment, topWeight, nextWeight, status, message, variantId, suggestedReps}}
     */
    evaluateSets(exerciseId, sets, targetRepRange, opts = {}) {
        const TA = this._algo('computeNextTarget');
        if (!TA) return this._evaluateSetsV1(exerciseId, sets, targetRepRange);
        const norm = (Array.isArray(sets) ? sets : []).filter(Boolean).map(x => ({
            weight: x.weight, reps: x.reps, completed: !!x.completed, isWarmup: !!x.isWarmup,
            isCalibration: !!x.isCalibration, isBodyweight: !!x.isBodyweight,
            rir: x.rir === undefined || x.rir === null || x.rir === '' ? null : x.rir
        }));
        const needsW = this._needsWeight(exerciseId);
        const work = norm.filter(x => x.completed && !x.isWarmup && !x.isCalibration && this._int(x.reps) > 0 && (this._num(x.weight) > 0 || !needsW));
        if (!work.length) return { action: null, increment: 0, topWeight: 0, nextWeight: 0 };
        const profile = this.getProfile();
        const phase = this.getCurrentPhase();
        const compound = this.getExerciseType(exerciseId) === 'compound';
        const o = opts || {};
        const today = Number.isFinite(Number(o.targetRir)) && o.targetRir !== null ? Number(o.targetRir)
            : (phase && phase.rir && phase.phase !== 'deload' ? (compound ? phase.rir.compound : phase.rir.isolation) : 2);
        const r = this.parseRepRange(targetRepRange);
        const s = TA.computeNextTarget({
            exerciseId, range: [r.min, r.max], targetRir: today, nextTargetRir: today, level: profile.level,
            gym: this.getGymConfig(), recorded: this.getRecordedWeights(exerciseId),
            sessions: [{ date: new Date().toISOString(), phase: null, sets: norm }],
            personPauseDays: 0, now: new Date(), profile
        });
        const top = s.lastPerformance ? s.lastPerformance.weight : 0;
        // seduta di scarico: non dice niente sulla prossima volta
        if (phase && phase.phase === 'deload') return { action: 'maintain', increment: 0, topWeight: top, nextWeight: top, status: 'deload', message: 'Scarico' };
        const up = ['increase_weight', 'rir_up', 'add_load'].includes(s.status);
        const reps = ['increase_reps', 'increase_time', 'variant_up'].includes(s.status);
        return {
            action: up ? 'up' : (reps ? 'reps' : 'maintain'),
            increment: GT.round(s.suggestedWeight - top, 0.001),
            topWeight: top,
            nextWeight: s.suggestedWeight,
            status: s.status, message: s.message, variantId: s.variantId, suggestedReps: s.suggestedReps
        };
    },

    // v1.26 (ripiego): top set + incremento
    _evaluateSetsV1(exerciseId, sets, targetRepRange) {
        const range = this.parseRepRange(targetRepRange);
        const bw = this.isBodyweightExercise(exerciseId);
        const done = (sets || []).filter(s => s && s.completed && this._int(s.reps) > 0 && (this._num(s.weight) > 0 || bw))
            .map(s => ({ weight: Math.max(0, this._num(s.weight)), reps: this._int(s.reps) }));
        if (!done.length) return { action: null, increment: 0, topWeight: 0, nextWeight: 0 };
        const top = done.reduce((b, s) => (s.weight > b.weight || (s.weight === b.weight && s.reps > b.reps)) ? s : b);
        const working = done.filter(s => Math.abs(s.weight - top.weight) < 0.01).map(s => s.reps);
        const inc = this.getProgressionIncrement(exerciseId, top.weight);
        if (working.every(r => r >= range.max)) {
            return { action: inc > 0 ? 'up' : 'reps', increment: inc, topWeight: top.weight, nextWeight: GT.round(top.weight + inc, 0.001) };
        }
        if (working.every(r => r >= range.min)) return { action: 'reps', increment: inc, topWeight: top.weight, nextWeight: top.weight };
        return { action: 'maintain', increment: inc, topWeight: top.weight, nextWeight: top.weight };
    },

    // ========================================
    // v2 — SEDUTA: primo peso, rampa, dischi, alternative, scarico anticipato
    // Involucri sottili: leggono profilo, palestra e storico e chiamano le funzioni pure.
    // ========================================

    /** Primo peso prudente per un esercizio mai fatto (§10.1) → {kg, rawKg, isEstimate, aboveSeed}. */
    getStartingLoad(exerciseId) {
        const TA = this._algo('estimateStartingLoad');
        if (!TA) return { kg: this._startingWeight(exerciseId), rawKg: null, isEstimate: true, aboveSeed: false };
        return TA.estimateStartingLoad(exerciseId, this.getProfile(), this.getGymConfig(), new Date());
    },

    /** "Trova il peso" (§10.2): state = {tests:[{kg,reps,rir}], testReps, targetReps, targetRir, lo}. */
    nextCalibrationStep(exerciseId, state = {}) {
        const TA = this._algo('nextCalibrationStep');
        if (!TA) return { done: true, workingKg: this._startingWeight(exerciseId) };
        const st = { level: this.getProfile().level, ...(state || {}) };
        if (st.seedKg === undefined) st.seedKg = this.getStartingLoad(exerciseId).kg;
        return TA.nextCalibrationStep(exerciseId, st, this.getGymConfig());
    },

    /**
     * Rampa di riscaldamento (§11) → [{kg, reps, pct}]. targetReps: le rep proposte (numero) o il range.
     * opts.single: solo l'ultima serie (avvicinamento per il primo multiarticolare di un'altra regione,
     * vedi TrainingAlgorithm.getRampPlan).
     */
    getWarmupSets(exerciseId, workingKg, targetReps, goal, opts = {}) {
        const TA = this._algo('buildWarmupSets');
        return TA ? TA.buildWarmupSets(exerciseId, workingKg, targetReps, goal, this.getGymConfig(), opts || {}) : [];
    },

    /** Prossimo cardio della settimana (R3-14): tipo e minuti da `weekly`, più le note da mostrare. */
    getNextCardio() {
        const TA = this._algo('nextCardio');
        if (!TA || typeof TA.generateConditioningSuggestions !== 'function') return null;
        const program = this.getActiveProgram();
        const profile = this.getProfile();
        const goal = (program && program.metadata && program.metadata.goal) || profile.goal;
        const sug = TA.generateConditioningSuggestions(goal, program, profile);
        return TA.nextCardio(sug, this.getConditioningThisWeek());
    },

    /**
     * Dischi per lato (§3.5) per gli esercizi col bilanciere o a dischi (non t-bar-row):
     * {perSide, achieved, exact, belowBar, barKg} oppure null se l'esercizio non si carica a dischi.
     */
    getPlates(exerciseId, totalKg) {
        const TA = this._algo('calcPlates');
        const ex = this._exercise(exerciseId);
        if (!TA || !ex || !['barbell', 'ez-bar', 'machine-plate'].includes(ex.loadType) || exerciseId === 't-bar-row') return null;
        const gym = this.getGymConfig();
        const barKg = TA._barFor(ex, gym);
        // macchine a dischi: il peso registrato sono solo i dischi (due lati) → bilanciere 0
        const res = TA.calcPlates(this._num(totalKg), { barKg, plates: gym.plates, plateCounts: gym.plateCounts });
        return { ...res, barKg };
    },

    /** Esercizi fatti nelle ultime `weeks` settimane (per le alternative con peso noto). */
    _recentExerciseIds(weeks = 8) {
        const since = Date.now() - weeks * 7 * 86400000;
        const ids = new Set();
        this.getWorkouts().forEach(w => {
            if (!(this._time(w.date) >= since) || !Array.isArray(w.exercises)) return;
            w.exercises.forEach(ex => { if (ex && ex.exerciseId && Array.isArray(ex.sets) && ex.sets.some(s => s && s.completed)) ids.add(ex.exerciseId); });
        });
        return [...ids];
    },

    /**
     * Alternative in seduta (§7): opts = { reason: 'busy'|'pain'|'dislike', sessionExerciseIds, painArea,
     * kg (peso attuale dell'originale), targetReps, limit }.
     * @returns [{ exerciseId, score, weight: { kg, confidence, mode, seedKg?, rirAdjust? } }]
     */
    getAlternatives(exerciseId, opts = {}) {
        const TA = this._algo('getAlternatives');
        if (!TA) return [];
        const o = opts || {};
        const history = this._recentExerciseIds(8);
        const profile = this.getProfile();
        const list = TA.getAlternatives(exerciseId, profile, { ...o, history, gym: this.getGymConfig() });
        // peso noto: il suggerimento di progressione di quell'esercizio
        return list.map(a => {
            if (a.weight && a.weight.mode === 'history') {
                try {
                    const sug = this.getProgressionSuggestion(a.exerciseId, o.targetReps, profile.goal);
                    a.weight.kg = sug.suggestedWeight;
                } catch (e) { /* resta null: si usa "Trova il peso" */ }
            }
            return a;
        });
    },

    /** Scarico anticipato da suggerire (§12.4) → {suggest, reasons, declining}. */
    getEarlyDeloadSuggestion() {
        const TA = this._algo('detectEarlyDeload');
        if (!TA) return { suggest: false, reasons: [], declining: [] };
        return TA.detectEarlyDeload(this.getWorkouts(), this.getActiveProgram(), new Date());
    },

    /**
     * Get progression summary for all exercises in a workout
     */
    getWorkoutProgressionSummary(exercises, goal = 'hypertrophy') {
        return (exercises || []).map(ex => ({
            exerciseId: ex.exerciseId,
            name: ex.name,
            ...this.getProgressionSuggestion(ex.exerciseId, ex.reps || ex.targetReps, goal)
        }));
    },

    // ========================================
    // CYCLE MANAGEMENT
    // ========================================

    _getCycle(program) {
        const c = program && program.metadata && program.metadata.cycle;
        if (!this._isObj(c) || !Array.isArray(c.phases) || c.phases.length === 0) return null;
        return c;
    },

    _cycleDuration(cycle) {
        const d = this._int(cycle.duration);
        return d > 0 ? d : cycle.phases.length;
    },

    _phaseFor(cycle, week) {
        const phases = cycle.phases;
        return phases.find(p => p && p.week === week) ||
            (week > this._cycleDuration(cycle) ? phases[phases.length - 1] : phases[0]);
    },

    _isManualDeload(cycle) {
        if (!cycle || !cycle.manualDeloadUntil) return false;
        const t = this._time(cycle.manualDeloadUntil);
        return !isNaN(t) && Date.now() < t;
    },

    /** Settimana del ciclo secondo il calendario (1 = prima; mai sotto 1). null senza ciclo. */
    getCalendarCycleWeek() {
        const cycle = this._getCycle(this.getActiveProgram());
        if (!cycle) return null;
        const days = GT.calendarDaysBetween(cycle.startDate, new Date());
        if (!isFinite(days)) return 1;
        return Math.max(1, Math.floor(days / 7) + 1);
    },

    /**
     * Get current cycle info from active program (forma invariata, più qualche campo).
     */
    getCycleInfo() {
        const program = this.getActiveProgram();
        const cycle = this._getCycle(program);
        if (!cycle) return null;

        const duration = this._cycleDuration(cycle);
        const currentWeek = Math.max(1, this._int(cycle.currentWeek) || 1);
        const currentPhase = this._phaseFor(cycle, currentWeek);
        const completedWeeks = Math.min(currentWeek, duration) - 1;
        const manual = this._isManualDeload(cycle);

        return {
            ...cycle,
            duration,
            currentWeek,
            currentPhase,
            progress: Math.round((completedWeeks / duration) * 100),
            weeksRemaining: Math.max(0, duration - currentWeek),
            isLastWeek: currentWeek >= duration,
            isDeloadActive: manual || (currentPhase && currentPhase.phase === 'deload'),
            isManualDeload: manual,
            manualDeloadUntil: manual ? cycle.manualDeloadUntil : null,
            cycleNumber: (program.metadata && program.metadata.cycleNumber) || 1,
            calendarWeek: this.getCalendarCycleWeek()
        };
    },

    /**
     * Settimane di lavoro saltate per intero (R3-13): la settimana persa si RIPETE, non si salta. Si sposta
     * l'inizio del ciclo di 7 giorni per ogni settimana passata senza sedute (mai lo scarico, al massimo 2
     * per ciclo: oltre, una pausa lunga la gestisce il rientro). Restituisce le settimane ripetute.
     */
    _repeatMissedWeeks(program) {
        const cycle = this._getCycle(program);
        if (!cycle || !GT.isValidDate(cycle.startDate)) return 0;
        const duration = this._cycleDuration(cycle);
        let repeated = this._int(cycle.repeatedWeeks) || 0;
        let shifted = 0;
        const workouts = this.getWorkouts().filter(w => !w.isFreeWorkout);
        // dopo uno spostamento la settimana ripetuta è quella persa: si riparte a controllare da lì
        let fromW = Math.max(1, this._int(cycle.currentWeek) || 1);
        for (let guard = 0; guard < 4 && repeated < 2; guard++) {
            const start = GT.startOfDay(cycle.startDate);
            const days = GT.calendarDaysBetween(start, new Date());
            const cal = isFinite(days) ? Math.floor(days / 7) + 1 : 1;
            // la prima settimana già passata, dalla corrente in poi, senza nessuna seduta
            let missed = 0;
            for (let w = fromW; w < Math.min(cal, duration + 1); w++) {
                const ph = this._phaseFor(cycle, w);
                if (ph && ph.phase === 'deload') break;
                const a = GT.addDays(start, (w - 1) * 7).getTime(), b = GT.addDays(start, w * 7).getTime();
                if (!workouts.some(x => { const t = this._time(x.date); return t >= a && t < b; })) { missed = w; break; }
            }
            if (!missed) break;
            fromW = missed;
            cycle.startDate = GT.addDays(start, 7).toISOString();
            if (cycle.weekStartedAt) delete cycle.weekStartedAt;
            repeated++;
            shifted++;
        }
        if (shifted) cycle.repeatedWeeks = repeated;
        return shifted;
    },

    /**
     * Allinea la settimana del ciclo al calendario (senza superare l'ultima). Una settimana di lavoro
     * passata senza sedute si ripete (R3-13). Uno scarico anticipato ancora valido resta (R1-05).
     * @returns {{changed:boolean, from:number, to:number, repeatedWeeks?:number}|null}
     */
    syncCycleWeek() {
        const program = this._programCopy();
        const cycle = this._getCycle(program);
        if (!cycle) return null;
        const duration = this._cycleDuration(cycle);
        const from = Math.max(1, this._int(cycle.currentWeek) || 1);
        const repeated = this._repeatMissedWeeks(program);
        const days = GT.calendarDaysBetween(cycle.startDate, new Date());
        const cal = isFinite(days) ? Math.max(1, Math.floor(days / 7) + 1) : 1;
        const to = Math.min(cal, duration);
        if (to <= from) {
            if (repeated) this.setActiveProgram(program);
            return repeated ? { changed: true, from, to: from, repeatedWeeks: repeated } : { changed: false, from, to: from };
        }
        cycle.currentWeek = to;
        cycle.weekStartedAt = GT.addDays(GT.startOfDay(cycle.startDate), (to - 1) * 7).toISOString();
        if (!this._isManualDeload(cycle)) {
            cycle.isDeloadActive = false;
            cycle.manualDeloadUntil = null;
        }
        this.setActiveProgram(program);
        return repeated ? { changed: true, from, to, repeatedWeeks: repeated } : { changed: true, from, to };
    },

    /**
     * Advance cycle to next week (spegne il deload manuale).
     */
    advanceCycleWeek() {
        const program = this._programCopy();
        const cycle = this._getCycle(program);
        if (!cycle) return null;

        const current = Math.max(1, this._int(cycle.currentWeek) || 1);
        if (current < this._cycleDuration(cycle)) {
            cycle.currentWeek = current + 1;
            cycle.weekStartedAt = new Date().toISOString();
        }
        cycle.isDeloadActive = false;
        cycle.manualDeloadUntil = null;
        this.setActiveProgram(program);

        return this.getCycleInfo();
    },

    /**
     * Va proposto l'avanzamento di settimana? (calendario, o sessioni della settimana fatte)
     */
    shouldAdvanceWeek() {
        const program = this.getActiveProgram();
        const cycle = this._getCycle(program);
        if (!cycle) return false;

        const current = Math.max(1, this._int(cycle.currentWeek) || 1);
        if (current >= this._cycleDuration(cycle)) return false;
        if ((this.getCalendarCycleWeek() || 1) > current) return true;

        const daysPerWeek = this._daysPerWeek(program);
        const start = this._time(GT.startOfDay(cycle.startDate));
        const done = this.getWorkouts().filter(w => !w.isFreeWorkout && this._time(w.date) >= start).length;
        return done >= current * daysPerWeek;
    },

    _daysPerWeek(program) {
        const md = (program && program.metadata) || {};
        const d = this._int(md.daysPerWeek) || (Array.isArray(program && program.days) ? program.days.length : 0);
        return d > 0 ? d : 3;
    },

    /**
     * Il ciclo è da chiudere? Oltre l'ultima settimana per calendario, oppure ultima settimana
     * con tutte le sessioni fatte.
     */
    shouldCompleteCycle() {
        // con le settimane perse ripetute (R3-13), come farà syncCycleWeek: qui senza salvare
        const program = this._programCopy();
        const cycle = this._getCycle(program);
        if (!cycle) return false;
        this._repeatMissedWeeks(program);
        const duration = this._cycleDuration(cycle);
        const cdays = GT.calendarDaysBetween(cycle.startDate, new Date());
        const calWeek = isFinite(cdays) ? Math.max(1, Math.floor(cdays / 7) + 1) : 1;
        if (calWeek > duration) return true;

        const current = Math.max(1, this._int(cycle.currentWeek) || 1);
        if (current < duration && calWeek < duration) return false;

        // Inizio dell'ultima settimana: quando ci si è arrivati a mano, o per calendario
        const calStart = GT.addDays(GT.startOfDay(cycle.startDate), (duration - 1) * 7).getTime();
        let since = calStart;
        if (current >= duration && cycle.weekStartedAt) {
            const t = this._time(cycle.weekStartedAt);
            if (!isNaN(t)) since = isNaN(calStart) ? t : Math.min(t, calStart);
        }
        if (isNaN(since)) return false;
        const done = this.getWorkouts().filter(w => !w.isFreeWorkout && this._time(w.date) >= since).length;
        return done >= this._daysPerWeek(program);
    },

    /**
     * Proporre la fine del ciclo (R1-04)? Al massimo una volta al giorno, mai con una seduta aperta:
     * quando restituisce true registra la data (meta.cycleEndPromptedOn).
     */
    shouldPromptCycleEnd() {
        let open = null;
        try { open = this.getActiveSession(); } catch (e) { open = null; }
        if (open) return false;
        if (!this.shouldCompleteCycle()) return false;
        const meta = this._read(this.KEYS.META, {}, v => this._isObj(v));
        const today = GT.dateKey(new Date());
        if (meta.cycleEndPromptedOn === today) return false;
        meta.cycleEndPromptedOn = today;
        this._tryWrite(this.KEYS.META, meta);
        return true;
    },

    /**
     * Deload manuale/anticipato per 7 giorni: scade da solo, advanceCycleWeek lo spegne.
     */
    startManualDeload() {
        const program = this._programCopy();
        const cycle = this._getCycle(program);
        if (!cycle) return false;
        if (!this._isManualDeload(cycle)) cycle.earlyDeloads = (this._int(cycle.earlyDeloads) || 0) + 1;   // per il volume del ciclo dopo (§12.5)
        cycle.manualDeloadUntil = GT.addDays(new Date(), 7).toISOString();
        cycle.isDeloadActive = true;
        this.setActiveProgram(program);
        return true;
    },

    stopManualDeload() {
        const program = this._programCopy();
        const cycle = this._getCycle(program);
        if (!cycle) return false;
        cycle.manualDeloadUntil = null;
        cycle.isDeloadActive = false;
        this.setActiveProgram(program);
        return true;
    },

    /**
     * Interruttore del deload manuale (compatibilità): restituisce lo stato dopo il cambio.
     */
    toggleDeload() {
        const program = this.getActiveProgram();
        const cycle = this._getCycle(program);
        if (!cycle) return false;
        if (this._isManualDeload(cycle)) this.stopManualDeload();
        else this.startManualDeload();
        return this.isDeloadActive();
    },

    /**
     * Deload attivo = fase della settimana corrente deload, OPPURE deload manuale non scaduto.
     */
    isDeloadActive() {
        const cycle = this._getCycle(this.getActiveProgram());
        if (!cycle) return false;
        if (this._isManualDeload(cycle)) return true;
        const phase = this._phaseFor(cycle, Math.max(1, this._int(cycle.currentWeek) || 1));
        return !!phase && phase.phase === 'deload';
    },

    /**
     * Get volume multiplier for current phase
     */
    getCurrentVolumeMultiplier() {
        const cycle = this._getCycle(this.getActiveProgram());
        if (!cycle) return 1;
        if (this._isManualDeload(cycle)) {
            const dl = cycle.phases.find(p => p && p.phase === 'deload');
            return (dl && dl.volumeMultiplier) || 0.5;
        }
        const phase = this._phaseFor(cycle, Math.max(1, this._int(cycle.currentWeek) || 1));
        return (phase && phase.volumeMultiplier) || 1;
    },

    // Lunedì da cui parte un ciclo nuovo: questo, oppure il prossimo se la settimana
    // corrente appartiene ancora al ciclo vecchio ed è già stata usata (ci si è allenati)
    _newCycleStartDate(oldCycle) {
        const thisMonday = GT.startOfWeek(new Date());
        if (!oldCycle) return thisMonday;
        const duration = this._cycleDuration(oldCycle);
        const days = GT.calendarDaysBetween(oldCycle.startDate, new Date());
        const calWeek = isFinite(days) ? Math.floor(days / 7) + 1 : duration + 1;
        if (calWeek > duration) return thisMonday;
        const trainedThisWeek = this.getWorkoutsThisWeek().some(w => !w.isFreeWorkout);
        return trainedThisWeek ? GT.addDays(thisMonday, 7) : thisMonday;
    },

    /**
     * Reset cycle (stessa scheda, settimana 1). Per la chiusura vera usare completeCycle().
     */
    resetCycle() {
        const program = this._programCopy();
        const cycle = this._getCycle(program);
        if (!cycle) return null;

        cycle.startDate = this._newCycleStartDate(cycle).toISOString();
        cycle.currentWeek = 1;
        cycle.isDeloadActive = false;
        cycle.manualDeloadUntil = null;
        delete cycle.weekStartedAt;
        delete cycle.repeatedWeeks;

        this.setActiveProgram(program);
        return this.getCycleInfo();
    },

    // ========================================
    // CYCLE HISTORY & STATISTICS
    // ========================================

    getCycleHistory() {
        return this._read(this.KEYS.CYCLE_HISTORY, [], Array.isArray).filter(c => this._isObj(c));
    },

    saveCycleToHistory(cycleData) {
        const history = this.getCycleHistory();
        cycleData.id = Date.now();
        cycleData.completedAt = new Date().toISOString();
        history.unshift(cycleData);
        // Keep last 20 cycles
        if (history.length > 20) history.length = 20;
        this._write(this.KEYS.CYCLE_HISTORY, history);
        return cycleData;
    },

    _normalizeAdded(list) {
        return (Array.isArray(list) ? list : []).map(x => {
            if (typeof x === 'string') {
                const ex = this._exercise(x);
                return { id: x, name: (ex && ex.name) || x };
            }
            if (this._isObj(x)) {
                const id = x.id || x.exerciseId;
                const ex = this._exercise(id);
                return { ...x, id, name: x.name || (ex && ex.name) || id };
            }
            return null;
        }).filter(Boolean);
    },

    _programExerciseIds(program) {
        const ids = new Set();
        (program && Array.isArray(program.days) ? program.days : []).forEach(d => {
            (d && Array.isArray(d.exercises) ? d.exercises : []).forEach(e => { if (e && e.exerciseId) ids.add(e.exerciseId); });
        });
        return ids;
    },

    /**
     * Chiude il ciclo corrente: storico + statistiche, rotazione degli esercizi
     * (TrainingAlgorithm.rotateProgram, protetta), nuovo ciclo da settimana 1 con cycleNumber+1.
     * Se la rotazione fallisce: nuovo ciclo con gli stessi esercizi. Mai bloccato.
     * @returns {{completedCycle, statistics, rotation: {added[], removed[]}|null}|null}
     */
    completeCycle() {
        const program = this.getActiveProgram();
        const oldCycle = this._getCycle(program);
        if (!oldCycle) return null;
        const cycleInfo = this.getCycleInfo();
        const md = program.metadata || {};
        const oldNumber = this._int(md.cycleNumber) || 1;

        let statistics = null;
        try { statistics = this.getCycleStatistics(); } catch (e) { statistics = null; }

        const completedCycle = {
            cycleNumber: oldNumber,
            programName: program.name || null,
            duration: cycleInfo.duration,
            goal: md.goal || 'hypertrophy',
            level: md.level || 'intermediate',
            split: md.split || null,
            startDate: oldCycle.startDate,
            endDate: new Date().toISOString(),
            weeksReached: cycleInfo.currentWeek,
            phases: oldCycle.phases.map(p => p && p.phaseName),
            statistics
        };

        // Rotazione degli esercizi (protetta: qualsiasi errore → stessi esercizi)
        let newProgram = null;
        let rotation = null;
        try {
            if (typeof TrainingAlgorithm !== 'undefined' && TrainingAlgorithm && typeof TrainingAlgorithm.rotateProgram === 'function') {
                const raw = this._getRawProfile() || {};
                const profile = this.getProfile();
                // Livello: quello scelto nel profilo; se il profilo non è mai stato salvato, quello della scheda
                if (!raw.level && md.level) profile.level = md.level;
                // adesione, scarichi anticipati e progressi decidono il volume del ciclo dopo (§12.5)
                const res = TrainingAlgorithm.rotateProgram(this._clone(program), profile, statistics ?
                    { adherence: statistics.adherence, earlyDeloads: statistics.earlyDeloads, progressedPct: statistics.progressedPct } : null);
                if (res && this._isObj(res.program) && Array.isArray(res.program.days)) {
                    newProgram = res.program;
                    rotation = { added: this._normalizeAdded(res.added), removed: this._normalizeAdded(res.removed) };
                } else if (res && Array.isArray(res.days)) {
                    newProgram = res; // firma vecchia: restituiva la scheda
                }
                if (newProgram && !rotation) {
                    const a = this._programExerciseIds(program), b = this._programExerciseIds(newProgram);
                    rotation = {
                        added: this._normalizeAdded([...b].filter(id => !a.has(id))),
                        removed: this._normalizeAdded([...a].filter(id => !b.has(id)))
                    };
                }
            }
        } catch (e) {
            try { console.warn('[Storage] rotazione non riuscita, stessi esercizi', e); } catch (x) { /* no-op */ }
            newProgram = null;
            rotation = null;
        }
        if (!newProgram || !Array.isArray(newProgram.days) || newProgram.days.length === 0) {
            newProgram = this._clone(program);
            rotation = null;
        }

        // Nuovo ciclo: settimana 1, dal lunedì, numero +1
        newProgram.metadata = this._isObj(newProgram.metadata) ? newProgram.metadata : {};
        const nm = newProgram.metadata;
        // Struttura del ciclo: quella nuova della scheda ruotata, altrimenti la vecchia
        const cycle = this._clone(this._getCycle(newProgram) || oldCycle);
        cycle.currentWeek = 1;
        cycle.startDate = this._newCycleStartDate(oldCycle).toISOString();
        cycle.isDeloadActive = false;
        cycle.manualDeloadUntil = null;
        delete cycle.weekStartedAt;
        delete cycle.earlyDeloads;
        delete cycle.repeatedWeeks;
        nm.cycle = cycle;
        nm.cycleNumber = oldNumber + 1;

        // Prima la scheda (se lo spazio è pieno lancia, e lo storico non si sdoppia)
        this.setActiveProgram(newProgram);
        try { this.saveCycleToHistory(completedCycle); } catch (e) { /* lo storico è di contorno */ }

        this._lastRotationSummary = rotation ? {
            added: rotation.added,
            removed: rotation.removed,
            kept: [...this._programExerciseIds(newProgram)].filter(id => this._programExerciseIds(program).has(id))
                .map(id => ({ id, name: (this._exercise(id) || {}).name || id })),
            totalChanged: rotation.added.length + rotation.removed.length,
            cycleNumber: nm.cycleNumber
        } : { added: [], removed: [], kept: [], totalChanged: 0, cycleNumber: nm.cycleNumber };

        return { completedCycle, statistics, rotation };
    },

    getLastRotationSummary() {
        return this._lastRotationSummary || null;
    },

    /**
     * Get statistics for current cycle
     */
    /**
     * Dati per il volume del ciclo dopo (§12.5, R3-18): adesione (sedute fatte / previste nelle settimane
     * di lavoro trascorse), scarichi anticipati, quota di esercizi in progresso (indice di prestazione
     * kg × (1 + (rep + RIR)/30) dell'ultima seduta > della prima, caricati a ripetizioni).
     */
    _cycleRotationStats(cycleInfo, workouts) {
        const out = { adherence: null, earlyDeloads: this._int(cycleInfo.earlyDeloads) || 0, progressedPct: null };
        const start = GT.startOfDay(cycleInfo.startDate);
        const weeks = Math.min(cycleInfo.currentWeek, cycleInfo.duration);
        const workWeeks = [];
        for (let w = 1; w <= weeks; w++) {
            const ph = (cycleInfo.phases || []).find(p => p && p.week === w);
            if (!ph || ph.phase !== 'deload') workWeeks.push(w);
        }
        const inWork = workouts.filter(x => {
            if (x.isFreeWorkout) return false;
            const t = this._time(x.date);
            return workWeeks.some(w => t >= GT.addDays(start, (w - 1) * 7).getTime() && t < GT.addDays(start, w * 7).getTime());
        });
        const planned = workWeeks.length * this._daysPerWeek(this.getActiveProgram());
        if (planned > 0) out.adherence = Math.round(Math.min(1, inWork.length / planned) * 100) / 100;
        const TA = this._algo('getExerciseMeta');
        const pi = {};
        inWork.slice().sort((a, b) => this._time(a.date) - this._time(b.date)).forEach(w => (w.exercises || []).forEach(ex => {
            if (!ex || !ex.exerciseId) return;
            const m = TA ? TA.getExerciseMeta(ex.exerciseId) : null;
            if (!m || m.metric === 'time' || ['bodyweight', 'bodyweight-loadable', 'assisted'].includes(m.loadType)) return;
            let best = 0;
            (ex.sets || []).forEach(st => {
                if (!st || !st.completed || st.isWarmup || st.isCalibration) return;
                const kg = this._num(st.weight), r = this._int(st.reps);
                if (!(kg > 0) || !(r > 0)) return;
                const rir = Number.isFinite(Number(st.rir)) && st.rir !== '' && st.rir !== null ? Number(st.rir) : 2;
                best = Math.max(best, kg * (1 + (r + rir) / 30));
            });
            if (best > 0) (pi[ex.exerciseId] = pi[ex.exerciseId] || []).push(best);
        }));
        const evald = Object.values(pi).filter(l => l.length >= 2);
        if (evald.length) out.progressedPct = Math.round(evald.filter(l => l[l.length - 1] > l[0] + 1e-9).length / evald.length * 100) / 100;
        return out;
    },

    getCycleStatistics() {
        const cycleInfo = this.getCycleInfo();
        if (!cycleInfo) return null;

        const start = GT.startOfDay(cycleInfo.startDate);
        const startT = this._time(start);
        const workouts = isNaN(startT) ? [] : this.getWorkouts().filter(w => this._time(w.date) >= startT);
        const rot = this._cycleRotationStats(cycleInfo, workouts);

        if (workouts.length === 0) {
            return {
                ...rot,
                totalWorkouts: 0,
                totalVolume: 0,
                totalSets: 0,
                avgVolumePerWorkout: 0,
                exercisesWorked: 0,
                prsAchieved: 0,
                avgRir: null,
                weeklyBreakdown: [],
                daysActive: isNaN(startT) ? 0 : Math.max(0, GT.calendarDaysBetween(start, new Date()))
            };
        }

        let totalVolume = 0;
        let totalSets = 0;
        let rirSum = 0;
        let rirCount = 0;
        const exercisesSet = new Set();

        workouts.forEach(w => {
            totalVolume += this._num(w.totalVolume);
            totalSets += this._int(w.totalSets);
            (Array.isArray(w.exercises) ? w.exercises : []).forEach(ex => {
                if (!ex) return;
                exercisesSet.add(ex.exerciseId || ex.name);
                (Array.isArray(ex.sets) ? ex.sets : []).forEach(set => {
                    if (set && set.completed && set.rir !== undefined && set.rir !== null && set.rir !== '') {
                        const r = Number(set.rir);
                        if (isFinite(r)) { rirSum += r; rirCount++; }
                    }
                });
            });
        });

        const weeklyBreakdown = [];
        const lastWeek = Math.min(cycleInfo.currentWeek, cycleInfo.duration);
        for (let week = 1; week <= lastWeek; week++) {
            const ws = GT.addDays(start, (week - 1) * 7).getTime();
            const we = GT.addDays(start, week * 7).getTime();
            const weekWorkouts = workouts.filter(w => {
                const t = this._time(w.date);
                return t >= ws && t < we;
            });
            const phase = cycleInfo.phases.find(p => p && p.week === week);
            weeklyBreakdown.push({
                week,
                phase: (phase && phase.phaseName) || 'Sconosciuto',
                workouts: weekWorkouts.length,
                volume: weekWorkouts.reduce((sum, w) => sum + this._num(w.totalVolume), 0)
            });
        }

        return {
            ...rot,
            totalWorkouts: workouts.length,
            totalVolume: Math.round(totalVolume),
            totalSets,
            avgVolumePerWorkout: Math.round(totalVolume / workouts.length),
            exercisesWorked: exercisesSet.size,
            prsAchieved: this.countRealPRs(workouts),
            avgRir: rirCount > 0 ? (rirSum / rirCount).toFixed(1) : null,
            weeklyBreakdown,
            daysActive: Math.max(0, GT.calendarDaysBetween(start, new Date()))
        };
    },

    /**
     * Get progress metrics for the current cycle (prima settimana vs settimana corrente)
     */
    getCycleProgressMetrics() {
        const cycleInfo = this.getCycleInfo();
        if (!cycleInfo || cycleInfo.currentWeek < 2) return null;

        const start = GT.startOfDay(cycleInfo.startDate);
        const startT = this._time(start);
        if (isNaN(startT)) return null;
        const workouts = this.getWorkouts().filter(w => this._time(w.date) >= startT);
        if (workouts.length < 2) return null;

        const firstEnd = GT.addDays(start, 7).getTime();
        const firstWeekWorkouts = workouts.filter(w => this._time(w.date) < firstEnd);
        const curStart = GT.addDays(start, (cycleInfo.currentWeek - 1) * 7).getTime();
        const currentWeekWorkouts = workouts.filter(w => this._time(w.date) >= curStart);

        if (firstWeekWorkouts.length === 0) return null;

        const firstWeekVolume = firstWeekWorkouts.reduce((sum, w) => sum + this._num(w.totalVolume), 0);
        const currentWeekVolume = currentWeekWorkouts.reduce((sum, w) => sum + this._num(w.totalVolume), 0);
        const volumeChange = firstWeekVolume > 0
            ? Math.round(((currentWeekVolume - firstWeekVolume) / firstWeekVolume) * 100)
            : 0;

        return {
            firstWeekVolume: Math.round(firstWeekVolume),
            currentWeekVolume: Math.round(currentWeekVolume),
            volumeChangePercent: volumeChange,
            workoutCountFirst: firstWeekWorkouts.length,
            workoutCountCurrent: currentWeekWorkouts.length
        };
    },

    // ========================================
    // STREAK (a SETTIMANE, derivato dagli allenamenti)
    // ========================================

    /** Allenamenti a settimana perché la settimana conti: giorni della scheda − 1 (min 1); senza scheda 2. */
    getStreakTarget() {
        const program = this.getActiveProgram();
        if (!program) return 2;
        return Math.max(1, this._daysPerWeek(program) - 1);
    },

    _computeWeekStreak() {
        const target = this.getStreakTarget();
        const perWeek = new Map(); // chiave lunedì → Set di giorni con allenamento
        let lastT = NaN;
        this.getWorkouts().forEach(w => {
            const t = this._time(w.date);
            if (isNaN(t)) return;
            if (isNaN(lastT) || t > lastT) lastT = t;
            const wk = GT.dateKey(GT.startOfWeek(new Date(t)));
            if (!perWeek.has(wk)) perWeek.set(wk, new Set());
            perWeek.get(wk).add(GT.dateKey(new Date(t)));
        });
        const count = d => (perWeek.get(GT.dateKey(d)) || { size: 0 }).size;

        const thisMonday = GT.startOfWeek(new Date());
        const thisWeek = count(thisMonday);

        // Serie attuale: la settimana in corso conta se già raggiunta, ma non la spezza finché non è finita
        let current = thisWeek >= target ? 1 : 0;
        let cursor = GT.addDays(thisMonday, -7);
        while (count(cursor) >= target) {
            current++;
            cursor = GT.addDays(cursor, -7);
        }

        // Record storico: la serie più lunga di settimane consecutive
        let best = 0;
        if (perWeek.size) {
            const keys = [...perWeek.keys()].sort();
            const [y, m, d] = keys[0].split('-').map(Number);
            let wk = new Date(y, m - 1, d);
            let run = 0;
            while (wk.getTime() <= thisMonday.getTime()) {
                if (count(wk) >= target) { run++; if (run > best) best = run; }
                else if (wk.getTime() !== thisMonday.getTime()) run = 0;
                wk = GT.addDays(wk, 7);
            }
        }
        best = Math.max(best, current);
        return { current, best, thisWeek, target, lastWorkoutDate: isNaN(lastT) ? null : new Date(lastT).toISOString() };
    },

    _getRawStreak() {
        return this._read(this.KEYS.STREAK, null, v => v === null || this._isObj(v));
    },

    /**
     * Streak a settimane: {current, best, thisWeek, target}. Il record `best` resta salvato
     * nella chiave di sempre (il vecchio record a giorni è conservato in legacyDaysBest).
     */
    getStreak() {
        const s = this._computeWeekStreak();
        const raw = this._getRawStreak() || {};
        const savedBest = raw.unit === 'weeks' ? this._int(raw.best) : 0;
        s.best = Math.max(s.best, savedBest);
        if (raw.unit !== 'weeks' || raw.best !== s.best || raw.current !== s.current) {
            const rec = { ...raw, current: s.current, best: s.best, lastWorkoutDate: s.lastWorkoutDate, unit: 'weeks' };
            if (raw.unit !== 'weeks' && (raw.best !== undefined || raw.current !== undefined)) {
                rec.legacyDaysBest = raw.best ?? null;
                rec.legacyDaysCurrent = raw.current ?? null;
            }
            this._tryWrite(this.KEYS.STREAK, rec);
        }
        return s;
    },

    // Nome storico: ricalcola e salva il record
    updateStreak() {
        return this.getStreak();
    },

    // ========================================
    // STATISTICS
    // ========================================

    _workoutVolume(workout) {
        let v = 0;
        (Array.isArray(workout.exercises) ? workout.exercises : []).forEach(ex => {
            (ex && Array.isArray(ex.sets) ? ex.sets : []).forEach(set => {
                if (set && set.completed) {
                    const w = this._num(set.weight), r = this._int(set.reps);
                    if (w > 0 && r > 0) v += w * r;
                }
            });
        });
        return v;
    },

    getStatistics() {
        const workouts = this.getWorkouts();
        const streak = this.getStreak();

        let totalVolume = 0;
        workouts.forEach(w => { totalVolume += this._workoutVolume(w); });

        const weeklyWorkouts = this.getWorkoutsThisWeek();
        let weeklyVolume = 0;
        weeklyWorkouts.forEach(w => { weeklyVolume += this._workoutVolume(w); });

        const totalPRs = this.countRealPRs(workouts);

        return {
            totalWorkouts: workouts.length,
            totalVolume: Math.round(totalVolume),
            weeklyWorkouts: weeklyWorkouts.length,
            weeklyVolume: Math.round(weeklyVolume),
            currentStreak: streak.current,
            bestStreak: streak.best,
            streak,
            totalPRs,
            prCount: totalPRs
        };
    },

    // Giorni con allenamento (chiave toDateString) per il calendario
    getWorkoutDays() {
        const days = {};
        this.getWorkouts().forEach(w => {
            const t = this._time(w.date);
            if (!isNaN(t)) days[new Date(t).toDateString()] = true;
        });
        return days;
    },

    // ========================================
    // INTEGRATORI: elenco (gymtracker_supplements) e prese del giorno (gymtracker_supplements_log)
    // ========================================

    // Momento: colazione | pranzo | pre (prima dell'allenamento) | post (dopo) | sera.
    // Nei giorni di riposo le voci pre/post di tutti i giorni vanno in restWhen (colazione | pranzo | sera).
    SUPP_WHEN: ['colazione', 'pranzo', 'pre', 'post', 'sera'],
    SUPP_REST_WHEN: ['colazione', 'pranzo', 'sera'],
    SUPP_LOG_DAYS: 120,

    _suppText(v, max) {
        if (typeof v === 'number' && Number.isFinite(v)) v = String(v);
        return typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '';
    },

    /** Voce valida o null (senza nome non è un integratore). */
    _normalizeSupplement(s) {
        if (!this._isObj(s)) return null;
        const name = this._suppText(s.name, 40);
        if (!name) return null;
        const when = this.SUPP_WHEN.includes(s.when) ? s.when : 'colazione';
        const days = s.days === 'allenamento' ? 'allenamento' : 'sempre';
        const prePost = when === 'pre' || when === 'post';
        return {
            id: this._suppText(s.id, 40),
            catalogId: typeof s.catalogId === 'string' && s.catalogId ? s.catalogId.slice(0, 40) : null,
            name,
            amount: this._suppText(s.amount, 40),
            when,
            days,
            restWhen: prePost && days === 'sempre' ? (this.SUPP_REST_WHEN.includes(s.restWhen) ? s.restWhen : 'pranzo') : null,
            note: this._suppText(s.note, 80),
            active: s.active !== false
        };
    },

    /** Elenco degli integratori: [{id, catalogId|null, name, amount, when, days, restWhen, note, active}]. */
    getSupplements() {
        return this._read(this.KEYS.SUPPLEMENTS, [], Array.isArray)
            .map(s => this._normalizeSupplement(s))
            .filter(s => s && s.id);
    },

    /** Salva l'elenco intero (le voci senza id ne ricevono uno). true/false. */
    saveSupplements(list) {
        const seen = new Set();
        let n = 0;
        const out = (Array.isArray(list) ? list : []).map(s => this._normalizeSupplement(s)).filter(Boolean).map(s => {
            let id = s.id;
            while (!id || seen.has(id)) id = `sp${Date.now().toString(36)}${(n++).toString(36)}`;
            seen.add(id);
            return { ...s, id };
        });
        return this._tryWrite(this.KEYS.SUPPLEMENTS, out);
    },

    _suppDateOk(k) {
        return typeof k === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(k);
    },

    /** Integratori presi in un giorno ('AAAA-MM-GG'): { [id]: true }. */
    getSupplementsTaken(dateKey) {
        const log = this._read(this.KEYS.SUPPLEMENTS_LOG, {}, v => this._isObj(v));
        const day = this._suppDateOk(dateKey) && this._isObj(log[dateKey]) ? log[dateKey] : {};
        const out = {};
        Object.keys(day).forEach(id => { if (day[id] === true) out[id] = true; });
        return out;
    },

    /**
     * Segna (o toglie) uno o più integratori come presi in un giorno. Tiene al massimo
     * SUPP_LOG_DAYS giorni (i più vecchi si tolgono a ogni scrittura). true/false.
     */
    setSupplementTaken(dateKey, id, taken = true) {
        if (!this._suppDateOk(dateKey)) return false;
        const ids = (Array.isArray(id) ? id : [id]).map(x => this._suppText(x, 40)).filter(Boolean);
        if (!ids.length) return false;
        const log = this._read(this.KEYS.SUPPLEMENTS_LOG, {}, v => this._isObj(v));
        const day = this._isObj(log[dateKey]) ? log[dateKey] : {};
        ids.forEach(x => { if (taken) day[x] = true; else delete day[x]; });
        if (Object.keys(day).length) log[dateKey] = day; else delete log[dateKey];
        const oldest = GT.dateKey(GT.addDays(new Date(), -this.SUPP_LOG_DAYS));
        Object.keys(log).forEach(k => {
            if (!this._suppDateOk(k) || !this._isObj(log[k]) || k < oldest) delete log[k];
        });
        return this._tryWrite(this.KEYS.SUPPLEMENTS_LOG, log);
    },

    // ========================================
    // EXPORT / IMPORT
    // ========================================

    // Campo dell'export ↔ chiave, con il tipo atteso
    _EXPORT_FIELDS: [
        ['profile', 'PROFILE', 'object'],
        ['settings', 'SETTINGS', 'object'],
        ['workouts', 'WORKOUTS', 'array'],
        ['programs', 'PROGRAMS', 'array'],
        ['activeProgram', 'ACTIVE_PROGRAM', 'object|null'],
        ['measurements', 'MEASUREMENTS', 'array'],
        ['personalRecords', 'PERSONAL_RECORDS', 'object'],
        ['streak', 'STREAK', 'object'],
        ['cycleHistory', 'CYCLE_HISTORY', 'array'],
        ['conditioning', 'CONDITIONING', 'array'],
        ['supplements', 'SUPPLEMENTS', 'array'],
        ['supplementsLog', 'SUPPLEMENTS_LOG', 'object']
    ],

    // Chiavi di progresso: con un backup schemaVersion ≥ 2, se mancano si svuotano
    _PROGRESS_FIELDS: ['workouts', 'personalRecords', 'streak', 'cycleHistory', 'conditioning', 'measurements'],

    // Le copie dei dati rotti (corrupt_*) si esportano (R1-20: erano l'unica copia di dati persi) ma non
    // si reimportano come chiavi vive: tornano come corrupt_* (vedi importAllData)
    _isExcludedFromExport(key) {
        return key === this.KEYS.ACTIVE_SESSION || key === this.KEYS.META || key === 'gymtracker_dev_freeze';
    },

    _typeOk(v, type) {
        if (type === 'array') return Array.isArray(v);
        if (type === 'object') return this._isObj(v);
        if (type === 'object|null') return v === null || (this._isObj(v) && Array.isArray(v.days));
        return true;
    },

    /** Export JSON: tutte le chiavi gymtracker_* (tranne sessione in corso, meta e copie rotte). */
    exportAllData() {
        const data = {
            version: String(GT.APP_VERSION || 'v1.26.0').replace(/^v/, ''),
            schemaVersion: this.SCHEMA_VERSION,
            appVersion: GT.APP_VERSION,
            exportDate: new Date().toISOString()
        };
        const known = new Set();
        this._EXPORT_FIELDS.forEach(([field, keyName, type]) => {
            const key = this.KEYS[keyName];
            known.add(key);
            const def = type === 'array' ? [] : (type === 'object|null' ? null : (field === 'profile' || field === 'settings' ? null : {}));
            const v = this._read(key, def, x => x === null || (type === 'array' ? Array.isArray(x) : this._isObj(x)));
            if (v !== null || type === 'object|null') data[field] = v;
        });
        // Altre chiavi dell'app (future): copiate così come sono, come testo
        const extra = {};
        this._allAppKeys().forEach(k => {
            if (known.has(k) || this._isExcludedFromExport(k)) return;
            try { extra[k] = localStorage.getItem(k); } catch (e) { /* no-op */ }
        });
        if (Object.keys(extra).length) data.extra = extra;
        return JSON.stringify(data, null, 2);
    },

    /**
     * Import da backup (anche quelli vecchi, version '1.16.5' senza cycle_history/conditioning).
     * Valida il tipo di ogni chiave; copia di sicurezza in memoria e rollback se una scrittura fallisce.
     * @returns {boolean} (in caso di errore il motivo è in Storage.lastImportError)
     */
    importAllData(jsonString) {
        this.lastImportError = null;
        let data;
        try {
            data = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
        } catch (e) {
            this.lastImportError = 'File non leggibile (JSON non valido)';
            return false;
        }
        if (!this._isObj(data) || !(data.version || data.schemaVersion)) {
            this.lastImportError = 'Non è un backup di GymTracker';
            return false;
        }

        const schema = this._int(data.schemaVersion) || 1;
        const writes = [];
        const removes = [];
        for (const [field, keyName, type] of this._EXPORT_FIELDS) {
            const key = this.KEYS[keyName];
            if (data[field] === undefined || (data[field] === null && type !== 'object|null')) {
                if (schema >= 2 && this._PROGRESS_FIELDS.includes(field)) removes.push(key);
                continue;
            }
            if (!this._typeOk(data[field], type)) {
                this.lastImportError = `Backup non valido: "${field}" ha un formato sbagliato`;
                return false;
            }
            if (field === 'activeProgram' && data[field] === null) continue; // non toglie la scheda attuale
            // Negli array si tengono solo gli elementi-oggetto (null o testo sparsi non sono dati)
            writes.push([key, type === 'array' ? data[field].filter(x => this._isObj(x)) : data[field]]);
        }
        if (data.extra !== undefined) {
            if (!this._isObj(data.extra)) {
                this.lastImportError = 'Backup non valido: "extra" ha un formato sbagliato';
                return false;
            }
            Object.keys(data.extra).forEach(k => {
                if (k.indexOf(this.PREFIX) !== 0 || this._isExcludedFromExport(k)) return;
                if (Object.values(this.KEYS).includes(k)) return;
                const v = data.extra[k];
                writes.push([k, typeof v === 'string' ? v : JSON.stringify(v), true]);
            });
        }

        // Copia di sicurezza in memoria di TUTTE le chiavi dell'app
        const snapshot = {};
        this._allAppKeys().forEach(k => {
            try { snapshot[k] = localStorage.getItem(k); } catch (e) { /* no-op */ }
        });

        this._cacheDrop();
        try {
            writes.forEach(([k, v, isRaw]) => localStorage.setItem(k, isRaw ? v : JSON.stringify(v)));
            removes.forEach(k => localStorage.removeItem(k));
        } catch (e) {
            this._cacheDrop();
            // Rollback: tutto come prima
            try {
                const touched = new Set([...writes.map(w => w[0]), ...removes]);
                touched.forEach(k => {
                    if (Object.prototype.hasOwnProperty.call(snapshot, k) && snapshot[k] !== null) localStorage.setItem(k, snapshot[k]);
                    else localStorage.removeItem(k);
                });
            } catch (x) { /* no-op */ }
            this.lastImportError = this._isQuotaError(e) ? 'Spazio pieno: import annullato, dati di prima intatti'
                : 'Scrittura non riuscita: import annullato, dati di prima intatti';
            return false;
        }

        this._cacheDrop();
        // Dopo l'import: dati derivati e migrazioni (errori qui non annullano l'import)
        try { this._migrateProgramCycle(); } catch (e) { /* no-op */ }
        try { if (data.workouts !== undefined) this.rebuildPersonalRecords(); } catch (e) { /* no-op */ }
        try { this.getStreak(); } catch (e) { /* no-op */ }
        return true;
    },

    /** Cancella TUTTI i dati dell'app (richiesta esplicita dell'utente). */
    clearAllData() {
        this._allAppKeys().forEach(key => this._remove(key));
        this._cacheDrop();
    },

    /**
     * Clear only progress data (workouts, PRs, streak, cycle history, conditioning)
     * Keeps profile, settings, programs, active program, measurements
     */
    clearProgressData() {
        [this.KEYS.WORKOUTS, this.KEYS.PERSONAL_RECORDS, this.KEYS.STREAK, this.KEYS.CYCLE_HISTORY, this.KEYS.CONDITIONING]
            .forEach(k => this._remove(k));

        const program = this._programCopy();
        const cycle = this._getCycle(program);
        if (cycle) {
            cycle.currentWeek = 1;
            cycle.startDate = GT.startOfWeek(new Date()).toISOString();
            cycle.isDeloadActive = false;
            cycle.manualDeloadUntil = null;
            delete cycle.weekStartedAt;
            this._tryWrite(this.KEYS.ACTIVE_PROGRAM, program);
        }
    },

    // ========================================
    // SESSIONE IN CORSO
    // ========================================

    /** Salva la sessione in corso (a ogni modifica). Restituisce false se non riesce, senza lanciare. */
    saveActiveSession(obj) {
        try {
            return this._write(this.KEYS.ACTIVE_SESSION, { ...(obj || {}), savedAt: new Date().toISOString() });
        } catch (e) {
            this.lastError = e;
            return false;
        }
    },

    /**
     * Sessione in corso, normalizzata (R1-18): workout oggetto con esercizi oggetto (exerciseId testo) e
     * serie oggetto. Se non è recuperabile (niente esercizi validi) viene cancellata e si restituisce null:
     * non si riprova a ogni avvio.
     */
    getActiveSession() {
        const s = this._read(this.KEYS.ACTIVE_SESSION, null, v => v === null || this._isObj(v));
        if (!s) return null;
        let norm = null;
        try { norm = this._normalizeSession(s); } catch (e) { norm = null; }
        if (!norm) { this.clearActiveSession(); return null; }
        return norm;
    },

    _normalizeSession(s) {
        const w = s && s.workout;
        if (!this._isObj(w)) return null;
        const exercises = (Array.isArray(w.exercises) ? w.exercises : [])
            .filter(ex => this._isObj(ex) && typeof ex.exerciseId === 'string' && ex.exerciseId)
            .map(ex => {
                const out = { ...ex };
                ['setsData', 'sets'].forEach(k => { if (Array.isArray(out[k])) out[k] = out[k].filter(x => this._isObj(x)); else if (k in out && !Array.isArray(out[k]) && typeof out[k] !== 'number') delete out[k]; });
                return out;
            });
        if (!exercises.length) return null;
        return { ...s, workout: { ...w, exercises } };
    },

    clearActiveSession() {
        this._remove(this.KEYS.ACTIVE_SESSION);
    },

    // ========================================
    // PERSISTENZA (Safari non cancella dopo 7 giorni)
    // ========================================

    requestPersistence() {
        if (this._persistPromise) return this._persistPromise;
        try {
            const st = typeof navigator !== 'undefined' ? navigator.storage : null;
            if (st && typeof st.persist === 'function') {
                const already = typeof st.persisted === 'function' ? st.persisted() : Promise.resolve(false);
                this._persistPromise = Promise.resolve(already)
                    .then(p => p || st.persist())
                    .then(p => !!p)
                    .catch(() => false);
            } else {
                this._persistPromise = Promise.resolve(false);
            }
        } catch (e) {
            this._persistPromise = Promise.resolve(false);
        }
        return this._persistPromise;
    },

    // ========================================
    // CONDITIONING SESSIONS
    // ========================================

    /** Sessione con i campi nuovi, letta anche dai formati vecchi (type 'HIIT'/'hiit', duration in minuti). */
    _normalizeConditioning(s) {
        const type = String(s.type || '').toLowerCase();
        let durationSec = this._num(s.durationSec);
        if (!(durationSec > 0)) {
            if (this._num(s.duration) > 0) durationSec = Math.round(this._num(s.duration) * 60);
            else durationSec = Math.round(this._num(s.actualDuration) || this._num(s.plannedDuration) || 0);
        }
        const est = s.estimatedCalories !== undefined && s.estimatedCalories !== null
            ? this._num(s.estimatedCalories) : this._num(s.calories);
        const manual = s.manualCalories !== undefined && s.manualCalories !== null && s.manualCalories !== '' && this._num(s.manualCalories) > 0
            ? this._num(s.manualCalories) : null;
        return {
            ...s,
            type,
            protocol: type === 'liss' ? null : (s.protocol ?? null),
            activity: s.activity ?? null,
            exercises: Array.isArray(s.exercises) ? s.exercises : [],
            durationSec,
            duration: Math.round(durationSec / 60),
            estimatedCalories: Math.round(est),
            manualCalories: manual,
            calories: Math.round(manual ?? est),
            notes: typeof s.notes === 'string' ? s.notes : ''
        };
    },

    getConditioningSessions() {
        return this._read(this.KEYS.CONDITIONING, [], Array.isArray)
            .filter(s => this._isObj(s))
            .map(s => this._normalizeConditioning(s))
            .map((s, i) => ({ s, i, t: this._time(s.date) }))
            .sort((a, b) => ((isNaN(b.t) ? -Infinity : b.t) - (isNaN(a.t) ? -Infinity : a.t)) || (a.i - b.i))
            .map(x => x.s);
    },

    /**
     * Salva una sessione di conditioning:
     * {id, date, type:'hiit'|'liss', protocol, activity, exercises, durationSec, duration (min),
     *  estimatedCalories, manualCalories|null, calories, notes}. LANCIA con code 'QUOTA' se pieno.
     */
    saveConditioningSession(session) {
        const raw = this._read(this.KEYS.CONDITIONING, [], Array.isArray).filter(s => this._isObj(s));
        const rec = this._normalizeConditioning({ ...(session || {}) });
        let id = Date.now();
        const ids = new Set(raw.map(s => String(s.id)));
        while (ids.has(String(id))) id++;
        rec.id = id;
        rec.date = GT.isValidDate(rec.date) ? new Date(rec.date).toISOString() : new Date().toISOString();
        raw.unshift(rec);
        this._write(this.KEYS.CONDITIONING, raw);
        return rec;
    },

    getConditioningThisWeek() {
        const start = GT.startOfWeek(new Date()).getTime();
        const end = GT.addDays(GT.startOfWeek(new Date()), 7).getTime();
        return this.getConditioningSessions().filter(s => {
            const t = this._time(s.date);
            return !isNaN(t) && t >= start && t < end;
        });
    },

    getConditioningInCycle() {
        const cycleInfo = this.getCycleInfo();
        if (!cycleInfo) return [];
        const start = this._time(GT.startOfDay(cycleInfo.startDate));
        if (isNaN(start)) return [];
        return this.getConditioningSessions().filter(s => this._time(s.date) >= start);
    },

    getConditioningStatistics() {
        const sessions = this.getConditioningSessions();
        const thisWeek = this.getConditioningThisWeek();

        if (sessions.length === 0) {
            return {
                totalSessions: 0, totalDuration: 0, totalCalories: 0, hiitCount: 0, lissCount: 0,
                weekSessions: 0, weekDuration: 0, weekCalories: 0, avgDurationPerSession: 0
            };
        }

        const totalSec = sessions.reduce((sum, s) => sum + s.durationSec, 0);
        const weekSec = thisWeek.reduce((sum, s) => sum + s.durationSec, 0);
        return {
            totalSessions: sessions.length,
            totalDuration: Math.round(totalSec / 60), // in minuti
            totalCalories: sessions.reduce((sum, s) => sum + s.calories, 0),
            hiitCount: sessions.filter(s => s.type === 'hiit').length,
            lissCount: sessions.filter(s => s.type === 'liss').length,
            weekSessions: thisWeek.length,
            weekDuration: Math.round(weekSec / 60),
            weekCalories: thisWeek.reduce((sum, s) => sum + s.calories, 0),
            avgDurationPerSession: Math.round(totalSec / sessions.length / 60)
        };
    },

    deleteConditioningSession(id) {
        const raw = this._read(this.KEYS.CONDITIONING, [], Array.isArray);
        const kept = raw.filter(s => !(this._isObj(s) && String(s.id) === String(id)));
        if (kept.length === raw.length) return false;
        this._write(this.KEYS.CONDITIONING, kept);
        return true;
    },

    getRecentConditioningSessions(limit = 5) {
        return this.getConditioningSessions().slice(0, limit);
    },

    // ========================================
    // MIGRAZIONE (una volta, non distruttiva)
    // ========================================

    // Vecchio deload anticipato "per sempre" (isDeloadActive senza scadenza) → 7 giorni da ora
    _migrateProgramCycle() {
        const program = this._programCopy();
        // Scheda della v1.25 senza programId: gliene serve uno perché i workout nuovi lo portino
        // (getNextDayIndex). I workout vecchi restano senza e si riconoscono dal tipo del giorno.
        if (program && this._isObj(program.metadata) && program.metadata.programId === undefined) {
            program.metadata.programId = Date.now();
            this.setActiveProgram(program);
        }
        const cycle = this._getCycle(program);
        if (!cycle) return false;
        // Ciclo della v1.25 con le fasi sbagliate (bug A3: durata 3 o 5 → d+1 fasi, lo scarico
        // non arrivava mai): si rifanno le fasi sulla durata vera, ultima settimana di scarico.
        const d = this._int(cycle.duration);
        if (d > 1 && Array.isArray(cycle.phases) && cycle.phases.length !== d) {
            const old = cycle.phases.filter(p => this._isObj(p));
            const intensification = Math.max(1, Math.round((d - 1) * 0.4));
            const accumulation = Math.max(0, d - 1 - intensification);
            cycle.phases = Array.from({ length: d }, (_, i) => {
                const kind = i < accumulation ? 'accumulation' : (i < d - 1 ? 'intensification' : 'deload');
                const tpl = old.find(p => p.phase === kind) || { phase: kind };
                return { ...tpl, week: i + 1 };
            });
            this.setActiveProgram(program);
        }
        if (cycle.isDeloadActive === true && cycle.manualDeloadUntil === undefined) {
            cycle.manualDeloadUntil = GT.addDays(new Date(), 7).toISOString();
            this.setActiveProgram(program);
            return true;
        }
        if (cycle.manualDeloadUntil === undefined) {
            cycle.manualDeloadUntil = null;
            this.setActiveProgram(program);
            return true;
        }
        return false;
    },

    /**
     * Migrazione dai dati della v1.25 (idempotente). Non cancella chiavi:
     * - deload manuale vecchio → con scadenza;
     * - streak a giorni → a settimane (il vecchio record resta in legacyDaysBest);
     * - PR ricalcolati dagli allenamenti (la copia vecchia resta in gymtracker_meta.prsBeforeV126).
     */
    /**
     * Ciclo della v1.25 (fasi senza `rir`, nessuna `version`) già oltre la sua durata (R1-04): si
     * riallinea UNA volta (settimana 1 da questo lunedì), tenendo lo scarico manuale migrato.
     * @returns {boolean} riallineato adesso
     */
    _realignLegacyCycle(meta) {
        if (meta.legacyCycleRealignedAt) return false;
        const program = this.getActiveProgram();
        const cycle = this._getCycle(program);
        if (!cycle || cycle.version === 2 || cycle.phases.some(p => p && p.rir)) return false;
        const days = GT.calendarDaysBetween(cycle.startDate, new Date());
        const cal = isFinite(days) ? Math.floor(days / 7) + 1 : 1;
        // (più di una settimana intera oltre la fine: chi ha appena finito il ciclo lo chiude normalmente)
        if (cal <= this._cycleDuration(cycle) + 1) return false;
        const keepUntil = this._isManualDeload(cycle) ? cycle.manualDeloadUntil : null;
        this.resetCycle();
        if (keepUntil) {
            const p2 = this._programCopy();
            const c2 = this._getCycle(p2);
            c2.manualDeloadUntil = keepUntil;
            c2.isDeloadActive = true;
            this.setActiveProgram(p2);
        }
        meta.legacyCycleRealignedAt = new Date().toISOString();
        return true;
    },

    // Esercizi a tempo (plank…) con un range da ripetizioni della v1.25 ("8-12" = 8-12 s): 30-45 s (R1-15)
    _fixTimedRanges() {
        const program = this._programCopy();
        if (!program || !Array.isArray(program.days)) return false;
        let changed = false;
        program.days.forEach(d => (d && Array.isArray(d.exercises) ? d.exercises : []).forEach(ex => {
            const db = this._exercise(ex && ex.exerciseId);
            if (!db || db.metric !== 'time') return;
            const r = this.parseRepRange(String(ex.reps == null ? '' : ex.reps));
            if (r.max < 15) { ex.reps = '30-45'; changed = true; }
        }));
        if (changed) this._tryWrite(this.KEYS.ACTIVE_PROGRAM, program);
        return changed;
    },

    migrate() {
        const meta = this._read(this.KEYS.META, {}, v => this._isObj(v));
        try { this._migrateProgramCycle(); } catch (e) { /* no-op */ }
        try { this.getStreak(); } catch (e) { /* no-op */ }
        try { this._fixTimedRanges(); } catch (e) { /* no-op */ }
        try { if (this._realignLegacyCycle(meta)) this._tryWrite(this.KEYS.META, meta); } catch (e) { /* no-op */ }
        if ((this._int(meta.schemaVersion) || 1) < this.SCHEMA_VERSION) {
            try {
                const oldPrs = localStorage.getItem(this.KEYS.PERSONAL_RECORDS);
                if (oldPrs && oldPrs.length < 400000 && meta.prsBeforeV126 === undefined) meta.prsBeforeV126 = oldPrs;
                if (this.getWorkouts().length) this.rebuildPersonalRecords();
            } catch (e) { /* no-op */ }
            meta.schemaVersion = this.SCHEMA_VERSION;
            meta.migratedAt = new Date().toISOString();
            meta.appVersion = GT.APP_VERSION;
            if (!this._tryWrite(this.KEYS.META, meta)) {
                delete meta.prsBeforeV126;
                this._tryWrite(this.KEYS.META, meta);
            }
        }
        return meta;
    }
};

// Un'altra scheda del browser ha cambiato i dati: la cache in memoria non vale più (R1-10)
try {
    if (typeof window !== 'undefined' && window && typeof window.addEventListener === 'function') {
        window.addEventListener('storage', (e) => Storage._cacheDrop(e && e.key ? e.key : undefined));
    }
} catch (e) { /* no-op */ }

// Migrazione all'avvio: protetta, l'app parte comunque
try { Storage.migrate(); } catch (e) { try { console.warn('[Storage] migrazione', e); } catch (x) { /* no-op */ } }
