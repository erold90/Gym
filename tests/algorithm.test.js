#!/usr/bin/env node
/**
 * Test dell'algoritmo delle schede (Node puro, nessuna dipendenza).
 *
 *   node tests/algorithm.test.js            → genera TUTTA la matrice del wizard e verifica gli invarianti
 *   node tests/algorithm.test.js --verbose  → stampa anche gli esempi di violazione e le metriche
 *
 * Matrice: 5 obiettivi × 3-6 giorni × split ammessi dal wizard (PPL solo da 5 giorni) × 4 livelli ×
 * 45/60/75/90' × 7 attrezzature × uomo/donna, e ogni scheda anche dopo rotateProgram.
 * Codice di uscita 1 se un invariante fallisce.
 *
 * Invarianti (0 violazioni): eccezioni; esercizi inesistenti/hidden; doppioni nel giorno; attrezzatura
 * non posseduta (ogni attrezzo richiesto, panca compresa; con le macchine la panca è implicita);
 * compound dopo isolation fuori dai superset; seduta che si apre con un superset o con un
 * monoarticolare; principianti con esercizi "advanced"; giorni con <4 esercizi (<3 a corpo libero);
 * gambe <2×/sett; volume diretto dei muscoli grandi fuori da [min−2, max+4]; addome >12 serie/sett o
 * su più di 3 giorni; polpacci sotto il minimo; stima oltre +15%; fasi del ciclo sbagliate; schede
 * uomo/donna identiche; tonificazione con parte inferiore <55%, glutei <2×/sett, petto <6;
 * 75' = 90'; serie che calano allungando la durata. Le stesse dopo rotateProgram (cicli 2 e 3).
 *
 * Adattamenti motivati (dove l'invariante è impossibile con certi input), contati nel rapporto:
 * - sotto min−2 solo se i giorni che allenano quel muscolo sono già pieni (stima ≥85% della durata)
 *   e comunque con la dose minima (≥4 serie frazionarie = dirette + ½ indirette, Pelland 2025, o ≥3
 *   dirette); oppure se per quel muscolo esistono solo 1-2 esercizi possibili (≥6 frazionarie);
 *   oppure, nella tonificazione, se la quota della parte inferiore lo richiede (≥4 frazionarie, petto ≥6);
 * - polpacci, petto della tonificazione e quota inferiore della tonificazione: soglia rilassata solo
 *   quando le sedute interessate sono già piene (45' con riscaldamento e defaticamento reali).
 *
 * GT_ROOT=<cartella js/> per provare un'altra copia (es. la v1.25 estratta con git show).
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = process.env.GT_ROOT || path.join(__dirname, '..', 'js');
const VERBOSE = process.argv.includes('--verbose');
const LEGACY = !!process.env.GT_ROOT; // copia vecchia: si misura senza fermarsi alle API nuove

// ------------------------------------------------------------------
// Caricamento in un contesto vm (come nel browser: script globali)
// ------------------------------------------------------------------
function load({ withWarmups = true } = {}) {
    const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
    const store = {};
    const ctx = {
        console,
        localStorage: { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
        Storage: { getWorkoutsThisWeek: () => [], getWorkouts: () => [] }
    };
    ctx.window = ctx;
    vm.createContext(ctx);
    const base = read('data/exercises.js') + '\n' + read('modules/algorithm.js') + '\n;this.TA = TrainingAlgorithm; this.DB = EXERCISES_DB;';
    let warm = '';
    if (withWarmups) {
        try {
            const w = read('data/warmups.js');
            new vm.Script(w); // sintassi valida?
            warm = w + '\n;this.WU = (typeof Warmups !== "undefined") ? Warmups : null;\n';
        } catch (e) { warm = ''; }
    }
    let cond = '';
    try {
        const c = read('modules/conditioningExercises.js');
        new vm.Script(c);
        cond = '\n' + c + '\n';
    } catch (e) { cond = ''; }
    vm.runInContext(warm + base + cond, ctx, { filename: 'gymtracker.js' });
    return ctx;
}

const C = load();
const TA = C.TA;
const DB = C.DB;
const HAS_WARMUP_FN = !!(C.WU && typeof C.WU.getWarmupDurationMin === 'function');

// ------------------------------------------------------------------
// Matrice del wizard
// ------------------------------------------------------------------
const GOALS = ['strength', 'hypertrophy', 'recomp', 'endurance', 'toning'];
const DAYS = [3, 4, 5, 6];
const SPLITS = ['upper-lower', 'full-body', 'push-pull-legs'];
const LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'];
const DURS = [45, 60, 75, 90];
const SEXES = ['male', 'female'];
const EQUIP = {
    palestra: ['bilanciere', 'manubri', 'macchine', 'cavi', 'panca', 'sbarra', 'parallele', 'accessori'],
    default: ['bilanciere', 'manubri', 'macchine', 'cavi', 'panca', 'sbarra'],
    manubriPanca: ['manubri', 'panca'],
    manubri: ['manubri'],
    corpo: [],
    corpoSbarra: ['sbarra'],
    // profilo salvato dalla v1.25 (panca deselezionata): in palestra la panca è implicita
    v125: ['bilanciere', 'manubri', 'macchine', 'cavi']
};
const LOAD_EQUIP = ['bilanciere', 'manubri', 'macchine', 'cavi'];
const BIG = ['petto', 'schiena', 'spalle', 'quadricipiti', 'femorali', 'glutei'];
const LOWER = ['quadricipiti', 'femorali', 'glutei', 'polpacci'];
const UPPER = ['petto', 'schiena', 'spalle', 'bicipiti', 'tricipiti', 'trapezio', 'avambracci'];
const LEGS3 = ['quadricipiti', 'femorali', 'glutei'];
const VOL = TA.VOLUME_CONFIG;
const SATURATED = 0.85; // giorno "pieno": stima ≥ 85% della durata scelta

function owned(list) {
    const eq = new Set(list);
    if (eq.has('macchine')) eq.add('panca');
    return eq;
}

// Difficoltà §6.1 (TA._difficultyOk); se per quel muscolo non c'è niente al livello giusto il generatore
// sale di un livello (principiante coi soli manubri: rematore a due braccia "intermediate")
const UP_LEVEL = { beginner: 'intermediate', intermediate: 'advanced' };
function eligibleList(muscle, eqSet, level) {
    const base = Object.values(DB).filter(x => !x.hidden && x.primaryMuscles.includes(muscle) && x.equipment.every(e => eqSet.has(e)));
    const strict = base.filter(x => TA._difficultyOk(x, level));
    return strict.length || !UP_LEVEL[level] ? strict : base.filter(x => TA._difficultyOk(x, UP_LEVEL[level]));
}
// Esercizi possibili per uno schema di movimento (stessa regola)
function eligiblePattern(test, eqSet, level) {
    const base = Object.values(DB).filter(x => !x.hidden && test(x) && x.equipment.every(e => eqSet.has(e)));
    const strict = base.filter(x => TA._difficultyOk(x, level));
    return strict.length || !UP_LEVEL[level] ? strict : base.filter(x => TA._difficultyOk(x, UP_LEVEL[level]));
}
const LEG_PAT = ['squat', 'lunge', 'hinge', 'bridge'];
const ppOf = (id) => { const p = (DB[id] || {}).pattern || ''; return /^push-/.test(p) ? 'push' : (/^pull-/.test(p) ? 'pull' : null); };
function eligibleFor(muscle, eqSet, level) {
    return eligibleList(muscle, eqSet, level).length > 0;
}

// ------------------------------------------------------------------
// Raccolta violazioni e metriche
// ------------------------------------------------------------------
const violations = {};
function fail(kind, detail) {
    if (!violations[kind]) violations[kind] = { n: 0, examples: [] };
    violations[kind].n++;
    if (violations[kind].examples.length < 5) violations[kind].examples.push(detail); if (process.env.GT_DUMP) (global.__all = global.__all || []).push(kind + ' :: ' + detail);
}

function newMetrics() {
    return {
        programs: 0, days: 0, sets: [], exercises: [], estRatio: { 45: [], 60: [], 75: [], 90: [] },
        over: { 45: 0, 60: 0, 75: 0, 90: 0 }, daysByDur: { 45: 0, 60: 0, 75: 0, 90: 0 }, overMax: { 45: 0, 60: 0, 75: 0, 90: 0 },
        abs: [], calves: [], lowerShareToning: [], bigOut: 0, bigOutStrict: 0, compoundAfterIso: 0, dupDays: 0, eqMiss: 0,
        advBeg: 0, lt4: 0, legsLt2: 0, absOver: 0, supersets: 0, idsUsed: new Set(), errors: 0, setsByDur: { 45: [], 60: [], 75: [], 90: [] }, pushPull: [],
        exByDur: { 45: [], 60: [], 75: [], 90: [] }
    };
}
const M = { gen: newMetrics(), rot: newMetrics() };
const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;

function directVolume(program) {
    const v = {};
    program.days.forEach(d => d.exercises.forEach(e => {
        const x = DB[e.exerciseId];
        if (!x) return;
        x.primaryMuscles.forEach(m => { v[m] = (v[m] || 0) + (parseInt(e.sets, 10) || 0); });
    }));
    return v;
}

function label(cfg) {
    return `${cfg.goal} ${cfg.split} ${cfg.days}gg ${cfg.level} ${cfg.dur}' ${cfg.en} ${cfg.sex}`;
}

// ------------------------------------------------------------------
// Invarianti su una scheda
// ------------------------------------------------------------------
function checkProgram(p, cfg, stage) {
    const m = M[stage];
    const tag = `[${stage}] ${label(cfg)}`;
    m.programs++;
    const eqSet = owned(cfg.eq);
    const bodyweightOnly = !cfg.eq.some(e => LOAD_EQUIP.includes(e));
    const minEx = bodyweightOnly ? 3 : 4;
    const L = VOL[cfg.level];

    if (!p || !Array.isArray(p.days) || p.days.length !== cfg.days) fail('numero giorni ≠ giorni scelti', `${tag}: ${p && p.days && p.days.length}`);
    const types = p.days.map(d => d.type);
    if (new Set(types).size !== types.length) fail('tipi dei giorni non unici', `${tag}: ${types}`);

    const estByDay = [];
    p.days.forEach((d, di) => {
        m.days++; m.daysByDur[cfg.dur]++;
        ['name', 'type', 'focus', 'warmup'].forEach(k => { if (typeof d[k] !== 'string' || !d[k]) fail('giorno senza campo ' + k, `${tag} g${di + 1}`); });
        const ex = d.exercises || [];
        m.exercises.push(ex.length); m.exByDur[cfg.dur].push(ex.length);
        const sets = ex.reduce((a, e) => a + (e.sets || 0), 0);
        m.sets.push(sets); m.setsByDur[cfg.dur].push(sets);
        if (ex.length < minEx) { m.lt4++; fail(`giorni con <${minEx} esercizi`, `${tag} ${d.type}: ${ex.map(e => e.exerciseId)}`); }

        const ids = ex.map(e => e.exerciseId);
        if (new Set(ids).size !== ids.length) { m.dupDays++; fail('doppioni nello stesso giorno', `${tag} ${d.type}: ${ids}`); }
        const fams = ids.map(id => DB[id] && DB[id].family).filter(Boolean);
        if (new Set(fams).size !== fams.length) fail('due esercizi della stessa famiglia nel giorno (§5.6)', `${tag} ${d.type}: ${ids}`);

        ex.forEach(e => {
            const x = DB[e.exerciseId];
            m.idsUsed.add(e.exerciseId);
            if (!x) { fail('esercizio inesistente', `${tag} ${e.exerciseId}`); return; }
            if (x.hidden) fail('esercizio hidden', `${tag} ${e.exerciseId}`);
            if (!x.equipment.every(q => eqSet.has(q))) { m.eqMiss++; fail('attrezzatura non posseduta', `${tag} ${e.exerciseId} richiede ${x.equipment}`); }
            if (cfg.level === 'beginner' && x.difficulty === 'advanced') { m.advBeg++; fail('principiante con esercizio advanced', `${tag} ${e.exerciseId}`); }
            // §6.1 (R3-08): difficoltà del livello; un livello sopra solo se per quello schema non c'è altro
            if (!TA._difficultyOk(x, cfg.level)) {
                const alt = Object.values(DB).some(y => !y.hidden && y.pattern === x.pattern && y.type === x.type && y.equipment.every(q => eqSet.has(q)) && TA._difficultyOk(y, cfg.level));
                if (alt || !UP_LEVEL[cfg.level] || !TA._difficultyOk(x, UP_LEVEL[cfg.level])) fail('difficoltà oltre §6.1', `${tag} ${e.exerciseId} (${x.difficulty})`);
            }
            if (e.exerciseId === 'sumo-deadlift') fail('stacco sumo nella scheda (slot hip thrust, R3-03)', `${tag} ${d.type}`);
            if (e.name !== x.name) fail('nome diverso dal database', `${tag} ${e.exerciseId}`);
            if (e.type !== x.type) fail('type mancante o diverso dal database', `${tag} ${e.exerciseId}: ${e.type}`);
            if (!Number.isInteger(e.sets) || e.sets < 1) fail('serie non intere o <1', `${tag} ${e.exerciseId}: ${e.sets}`);
            if (typeof e.reps !== 'string' || !/^\d+-\d+$/.test(e.reps)) fail("reps non nel formato 'a-b'", `${tag} ${e.exerciseId}: ${e.reps}`);
            else { const [a, b] = e.reps.split('-').map(Number); if (!(a >= 1 && b >= a)) fail('range reps incoerente', `${tag} ${e.exerciseId}: ${e.reps}`); }
            if (!Number.isInteger(e.rest) || e.rest < 0) fail('riposo non intero', `${tag} ${e.exerciseId}: ${e.rest}`);
            if (cfg.sex === 'female' && e.rest < 45) fail('riposo donna <45 s', `${tag} ${e.exerciseId}: ${e.rest}`);
        });

        // si apre con un fondamentale da solo: niente superset al primo posto, primo esercizio multiarticolare
        if (ex.length) {
            const first = ex[0];
            if (first.supersetGroup) fail('superset al primo posto (prima del fondamentale)', `${tag} ${d.type}: ${ids.slice(0, 3)}`);
            if (DB[first.exerciseId] && DB[first.exerciseId].type !== 'compound') fail('primo esercizio non multiarticolare', `${tag} ${d.type}: ${first.exerciseId}`);
        }

        // compound dopo isolation (fuori dai superset; l'addome è a parte, in fondo)
        let seenIso = false;
        for (const e of ex) {
            const x = DB[e.exerciseId];
            if (!x || e.supersetGroup || x.primaryMuscles.includes('addome')) continue;
            if (x.type === 'isolation') seenIso = true;
            else if (x.type === 'compound' && seenIso) { m.compoundAfterIso++; fail('compound dopo isolation', `${tag} ${d.type}: ${ids}`); break; }
        }

        // superset: membri contigui, stesse serie, ordine 1..n
        const groups = {};
        ex.forEach((e, i) => { if (e.supersetGroup) (groups[e.supersetGroup] = groups[e.supersetGroup] || []).push({ e, i }); });
        Object.entries(groups).forEach(([g, list]) => {
            m.supersets++;
            if (list.length < 2) fail('superset con un solo esercizio', `${tag} ${d.type} ${g}`);
            if (list.some((x, k) => k && x.i !== list[k - 1].i + 1)) fail('superset non contiguo', `${tag} ${d.type} ${g}`);
            if (new Set(list.map(x => x.e.sets)).size > 1) fail('superset con serie diverse', `${tag} ${d.type} ${g}`);
            if (list.some((x, k) => x.e.supersetOrder !== k + 1)) fail('supersetOrder non 1..n', `${tag} ${d.type} ${g}`);
            if (list.some(x => !Number.isInteger(x.e.supersetRest) || !Number.isInteger(x.e.transitionTime))) fail('superset senza riposo/transizione', `${tag} ${d.type} ${g}`);
            // R3-04: fra multiarticolari solo spinta↔tirata (mai gamba+gamba, spinta+spinta, alta+gamba);
            // un multiarticolare di gambe mai con un altro esercizio di gambe; nella forza nessun multiarticolare
            const comp = list.filter(x => DB[x.e.exerciseId].type === 'compound' && !x.e.isCore);
            if (cfg.goal === 'strength' && comp.length) fail('forza: multiarticolare in superset', `${tag} ${d.type}: ${list.map(x => x.e.exerciseId)}`);
            for (let i = 0; i < comp.length; i++) for (let j = i + 1; j < comp.length; j++) {
                const a = ppOf(comp[i].e.exerciseId), b = ppOf(comp[j].e.exerciseId);
                if (!a || !b || a === b) fail('superset di due multiarticolari non spinta↔tirata', `${tag} ${d.type}: ${comp[i].e.exerciseId}+${comp[j].e.exerciseId}`);
            }
            const legComp = list.filter(x => DB[x.e.exerciseId].type === 'compound' && LEG_PAT.includes(DB[x.e.exerciseId].pattern));
            if (legComp.length && list.some(x => !legComp.includes(x) && DB[x.e.exerciseId].primaryMuscles.some(mu => LOWER.includes(mu)))) {
                fail('superset multiarticolare di gambe + gambe', `${tag} ${d.type}: ${list.map(x => x.e.exerciseId)}`);
            }
        });

        const est = TA.estimateWorkoutDuration(d);
        estByDay.push(est);
        m.estRatio[cfg.dur].push(est / cfg.dur);
        if (est > cfg.dur) { m.over[cfg.dur]++; m.overMax[cfg.dur] = Math.max(m.overMax[cfg.dur], est); }
        if (est > cfg.dur * 1.15) fail('stima durata oltre +15%', `${tag} ${d.type}: ${est}'`);
    });

    // gambe almeno 2 volte a settimana con ≥3 giorni
    const legDays = p.days.filter(d => d.exercises.some(e => DB[e.exerciseId] && LEGS3.some(mm => DB[e.exerciseId].primaryMuscles.includes(mm)))).length;
    if (cfg.days >= 3 && legDays < 2) { m.legsLt2++; fail('gambe <2 volte a settimana', `${tag}: ${legDays}`); }

    // volume diretto per muscolo grande in [min−2, max+4]; se tutti i giorni che allenano quel
    // muscolo sono già pieni (stima ≥85% della durata) il tempo non basta: minimo 4 serie (dose minima)
    const v = directVolume(p);
    const loS = LOWER.reduce((a, mu) => a + (v[mu] || 0), 0), upS = UPPER.reduce((a, mu) => a + (v[mu] || 0), 0);
    const toningShareBinds = cfg.goal === 'toning' && loS / Math.max(1, loS + upS) < 0.62;
    BIG.forEach(mu => {
        const val = v[mu] || 0;
        const lo = L.min - 2, hi = L.max + 4;
        if (val > hi) { m.bigOut++; fail('volume muscolo grande > max+4', `${tag} ${mu}=${val} (max ${hi})`); return; }
        if (val >= lo) return;
        m.bigOutStrict++;
        if (!eligibleFor(mu, eqSet, cfg.level)) return; // nessun esercizio possibile con questa attrezzatura
        // Adattamento motivato: sotto il minimo è accettabile solo se il tempo è finito (tutti i giorni
        // che allenano quel muscolo — o tutti, se nessuno lo allena — sono pieni ≥85%), e comunque
        // con la dose minima efficace: ≥4 serie "frazionarie" (dirette + ½ indirette, Pelland 2025) o
        // almeno 3 dirette.
        const trainDays = p.days.map((d, i) => d.exercises.some(e => DB[e.exerciseId]?.primaryMuscles.includes(mu)) ? i : -1).filter(i => i >= 0);
        const pool = trainDays.length ? trainDays : p.days.map((d, i) => i);
        const saturated = pool.every(i => estByDay[i] >= cfg.dur * SATURATED);
        const frac = val + 0.5 * p.days.reduce((a, d) => a + d.exercises.reduce((b, e) => b + (DB[e.exerciseId]?.secondaryMuscles.includes(mu) ? e.sets : 0), 0), 0);
        // Tonificazione: la priorità alla parte inferiore (≥55%) prevale sul minimo della superiore,
        // che scende fino al minimo della tonificazione (petto 6, altri ≥4 frazionarie).
        const toningUpperOk = toningShareBinds && UPPER.includes(mu) && frac >= 4 && (mu !== 'petto' || val >= 6);
        if (toningUpperOk) { m.toningUpperRelaxed = (m.toningUpperRelaxed || 0) + 1; return; }
        // Con 1-2 esercizi possibili per quel muscolo (es. schiena a corpo libero senza sbarra = solo
        // superman) il limite sono gli esercizi, non il tempo: bastano 6 serie frazionarie.
        // (si contano le famiglie: lo stesso gesto va una volta sola per seduta, §5.6)
        if (new Set(eligibleList(mu, eqSet, cfg.level).map(x => x.family)).size <= 2 && frac >= Math.min(6, lo)) { m.exerciseLimited = (m.exerciseLimited || 0) + 1; return; }
        // nei giorni con tempo gli esercizi di quel muscolo sono già a 4+ serie (tetto per esercizio)
        const capped = pool.filter(i => estByDay[i] < cfg.dur * SATURATED).every(i => p.days[i].exercises.every(e => !DB[e.exerciseId]?.primaryMuscles.includes(mu) || e.sets >= 4));
        if (!saturated && capped && trainDays.length) { m.exerciseCapped = (m.exerciseCapped || 0) + 1; return; }
        if (!saturated) { m.bigOut++; fail('volume muscolo grande < min−2 con tempo libero', `${tag} ${mu}=${val} (min ${lo}) stime ${pool.map(i => estByDay[i])}`); }
        else if (frac < 4 && val < 3) { m.bigOut++; fail('volume muscolo grande sotto la dose minima (tempo esaurito)', `${tag} ${mu}=${val}, frazionario ${frac}`); }
        else if (frac < 4) m.medBorderline = (m.medBorderline || 0) + 1;
    });

    // giorni "pieni": la stima è già ≥85% della durata scelta
    const full = (idx) => idx.length > 0 && idx.every(i => estByDay[i] >= cfg.dur * SATURATED);
    const daysWith = (pred) => p.days.map((d, i) => pred(d) ? i : -1).filter(i => i >= 0);
    const lowerDays = daysWith(d => d.exercises.some(e => DB[e.exerciseId] && LOWER.some(mu => DB[e.exerciseId].primaryMuscles.includes(mu))));
    const upperDays = daysWith(d => d.exercises.some(e => DB[e.exerciseId] && UPPER.some(mu => DB[e.exerciseId].primaryMuscles.includes(mu))));

    // addome ≤12/sett, su massimo 3 giorni
    const abs = v.addome || 0;
    m.abs.push(abs);
    if (abs > 12) { m.absOver++; fail('addome >12 serie/sett', `${tag}: ${abs}`); }
    const absDays = p.days.filter(d => d.exercises.some(e => e.isCore || DB[e.exerciseId]?.primaryMuscles.includes('addome'))).length;
    if (absDays > 3) fail('addome su più di 3 giorni', `${tag}: ${absDays}`);

    // polpacci ≥6 quando l'obiettivo li prevede (ipertrofia, ricomposizione, resistenza); nella
    // tonificazione sono un accessorio (≥4, 6 col tempo): la priorità è dei glutei. Forza: facoltativi.
    const calves = v.polpacci || 0;
    m.calves.push(calves);
    // Adattamento: se tutti i giorni con lavoro di gambe sono già pieni (sedute da 45' con 10-12' di
    // riscaldamento e 8-13' di defaticamento) i muscoli grandi hanno la precedenza.
    const calfMin = cfg.goal === 'strength' ? 0 : (cfg.goal === 'toning' ? 4 : 6);
    if (calves < calfMin && !full(lowerDays)) fail(`polpacci <${calfMin} serie/sett con tempo libero`, `${tag}: ${calves}`);
    if (calves < calfMin && full(lowerDays)) m.calvesTimeLimited = (m.calvesTimeLimited || 0) + 1;

    // R3-02 (§5.5.7): fuori dalla tonificazione serie di tirata ≥ 0,9 × spinta, sulle serie intere
    // (floor: 8 su 9, 16 su 18). Adattamenti motivati: una sola tirata possibile, schiena già a max+3,
    // sedute della parte alta piene.
    let push = 0, pull = 0, rows = 0, lat = 0;
    p.days.forEach(d => d.exercises.forEach(e => {
        const k = ppOf(e.exerciseId);
        if (k === 'push') push += e.sets; else if (k === 'pull') pull += e.sets;
        if (DB[e.exerciseId].pattern === 'pull-h') rows += e.sets;
        if (DB[e.exerciseId].pattern === 'iso-shoulder-lat') lat += e.sets;
    }));
    m.pushPull.push(push ? pull / push : 1);
    const pullFamilies = new Set(eligiblePattern(x => /^pull-/.test(x.pattern), eqSet, cfg.level).map(x => x.family)).size;
    if (cfg.goal !== 'toning' && pullFamilies > 0 && pull < Math.floor(0.9 * push + 1e-9)) {
        // (le tirate non entrano dove ci sono già: sedute con tirate piene, o tirate già a 4 serie)
        const pullDays = daysWith(d => d.exercises.some(e => ppOf(e.exerciseId) === 'pull'));
        const pullsMaxed = p.days.every(d => d.exercises.every(e => ppOf(e.exerciseId) !== 'pull' || e.sets >= 4));
        // con una sola tirata possibile (soli manubri: il rematore a due braccia) il limite è l'esercizio
        if (pullFamilies <= 1) m.ppExercises = (m.ppExercises || 0) + 1;
        else if ((v.schiena || 0) >= L.max + 3 || full(pullDays) || pullsMaxed) m.ppLimited = (m.ppLimited || 0) + 1;
        else fail('tirata < 0,9 × spinta', `${tag}: tirata ${pull} spinta ${push}`);
    }
    // almeno un rematore (pull-h) a settimana se l'attrezzatura lo permette (tutti gli obiettivi)
    if (eligiblePattern(x => x.pattern === 'pull-h', eqSet, cfg.level).length && rows < 2) fail('nessun rematore nella settimana', `${tag}: ${rows}`);
    // §4.2 (R3-10): alzate laterali dirette, fuori dalla forza 4 a settimana (principianti 2 in ipertrofia/ricomposizione/tonificazione)
    const latMin = cfg.goal === 'strength' ? 0 : (cfg.level === 'beginner' ? (['hypertrophy', 'recomp', 'toning'].includes(cfg.goal) ? 2 : 0) : 4);
    // (adattamento: con le sedute della parte alta già piene si accettano 2 serie, come per gli altri minimi)
    if (latMin && eligiblePattern(x => x.pattern === 'iso-shoulder-lat', eqSet, cfg.level).length && lat < latMin) {
        if (lat >= 2 && full(upperDays)) m.latTimeLimited = (m.latTimeLimited || 0) + 1;
        else fail(`alzate laterali < ${latMin} serie/sett`, `${tag}: ${lat}`);
    }

    // tonificazione: parte inferiore ≥55% del volume diretto (addome escluso)
    if (cfg.goal === 'toning') {
        const lo = LOWER.reduce((a, mu) => a + (v[mu] || 0), 0);
        const up = UPPER.reduce((a, mu) => a + (v[mu] || 0), 0);
        const share = lo / Math.max(1, lo + up);
        m.lowerShareToning.push(share);
        // Adattamento: con tutte le sedute già piene (45' con riscaldamento e defaticamento reali) e la
        // parte superiore già al minimo della tonificazione (petto 6, schiena e spalle 4) si accetta ≥50%.
        const upperAtMin = (v.petto || 0) <= 6 && (v.schiena || 0) <= 4 && (v.spalle || 0) <= 4;
        if (share < 0.55 && !(full(p.days.map((d, i) => i)) && upperAtMin && share >= 0.5)) fail('tonificazione: parte inferiore <55%', `${tag}: ${(share * 100).toFixed(1)}%`);
        else if (share < 0.55) m.shareTimeLimited = (m.shareTimeLimited || 0) + 1;
        const gluteDays = p.days.filter(d => d.exercises.some(e => DB[e.exerciseId]?.primaryMuscles.includes('glutei'))).length;
        if (cfg.days >= 3 && gluteDays < 2) fail('tonificazione: glutei <2 volte/sett', `${tag}: ${gluteDays}`);
        if ((v.petto || 0) < 6 && eligibleFor('petto', eqSet, cfg.level)) {
            if (!full(upperDays.length ? upperDays : p.days.map((d, i) => i))) fail('tonificazione: petto <6 serie/sett con tempo libero', `${tag}: ${v.petto || 0}`);
            else if ((v.petto || 0) < 3) fail('tonificazione: petto <3 serie/sett', `${tag}: ${v.petto || 0}`);
            else m.chestTimeLimited = (m.chestTimeLimited || 0) + 1;
        }
    }

    // metadata
    const md = p.metadata || {};
    if (!LEGACY) {
        ['programId', 'generatorOptions', 'cycleNumber', 'cycle', 'goal', 'split', 'daysPerWeek', 'sessionDuration', 'level', 'gender', 'weeklyVolume', 'tempo']
            .forEach(k => { if (md[k] === undefined) fail('metadata senza ' + k, tag); });
        const go = md.generatorOptions || {};
        if (go.goal !== cfg.goal || go.daysPerWeek !== cfg.days || go.split !== cfg.split || go.sessionDuration !== cfg.dur) fail('generatorOptions diverse dal wizard', `${tag}: ${JSON.stringify(go)}`);
    }
    checkCycle(md.cycle, cfg.goal, cfg.level, tag);
}

function checkCycle(cycle, goal, level, tag) {
    if (!cycle || !Array.isArray(cycle.phases)) { fail('ciclo mancante', tag); return; }
    const d = cycle.duration;
    if (cycle.phases.length !== d) fail('fasi del ciclo con somma ≠ durata', `${tag}: ${cycle.phases.length} fasi su ${d}`);
    const last = cycle.phases[cycle.phases.length - 1];
    if (!last || last.phase !== 'deload') fail('ciclo senza deload finale', `${tag}: ${cycle.phases.map(p => p.phase)}`);
    if (cycle.phases.some((p, i) => p.week !== i + 1)) fail('settimane del ciclo non 1..n', tag);
    if (!LEGACY) {
        const int = cycle.phases.filter(p => p.phase === 'intensification').length;
        const acc = cycle.phases.filter(p => p.phase === 'accumulation').length;
        const expInt = Math.max(1, Math.round((d - 1) * 0.4));
        if (int !== expInt || acc !== d - 1 - expInt) fail('fasi diverse dal contratto', `${tag}: acc ${acc} int ${int} (d ${d})`);
    }
}

// ------------------------------------------------------------------
// Matrice
// ------------------------------------------------------------------
const pairs75vs90 = { same: 0, total: 0, setsDown: 0 };
const byKey = {};
let configs = 0;
for (const goal of GOALS) for (const days of DAYS) for (const split of SPLITS) {
    if (split === 'push-pull-legs' && days <= 4) continue; // il wizard non lo permette
    for (const level of LEVELS) for (const en of Object.keys(EQUIP)) {
        const perSex = {};
        for (const sex of SEXES) {
            const totalsByDur = {};
            const minutesByDur = {};
            for (const dur of DURS) {
                configs++;
                const cfg = { goal, days, split, level, dur, en, eq: EQUIP[en], sex };
                const profile = { name: 'Test', level, gender: sex, equipment: EQUIP[en].slice() };
                let p;
                try {
                    p = TA.generateProgram(profile, { goal, daysPerWeek: days, split, sessionDuration: dur });
                } catch (e) {
                    M.gen.errors++;
                    fail('eccezione in generateProgram', `${label(cfg)}: ${e.message}`);
                    continue;
                }
                checkProgram(p, cfg, 'gen');
                totalsByDur[dur] = p.days.reduce((a, d) => a + d.exercises.reduce((b, e) => b + e.sets, 0), 0);
                minutesByDur[dur] = p.days.reduce((a, d) => a + TA.estimateWorkoutDuration(d), 0);
                if (dur === 75 || dur === 90) byKey[`${goal}|${days}|${split}|${level}|${en}|${sex}|${dur}`] = p;
                perSex[`${dur}`] = perSex[`${dur}`] || {};
                perSex[`${dur}`][sex] = p;

                // rotazione a fine ciclo
                if (typeof TA.rotateProgram === 'function') {
                    let r;
                    try {
                        const out = TA.rotateProgram(JSON.parse(JSON.stringify(p)), profile);
                        r = (out && out.program) ? out : (LEGACY ? { program: out, added: [], removed: [] } : out);
                        if (!LEGACY) {
                            if (!out || !out.program || !Array.isArray(out.added) || !Array.isArray(out.removed)) fail('rotateProgram: risultato non {program, added, removed}', label(cfg));
                            if (TA._currentCycleOffset) fail('rotateProgram: _currentCycleOffset sporco', label(cfg));
                            if (out.program.metadata.cycleNumber !== 2) fail('rotateProgram: cycleNumber non incrementato', label(cfg));
                            if (out.program.metadata.programId !== p.metadata.programId) fail('rotateProgram: programId cambiato', label(cfg));
                        }
                    } catch (e) {
                        M.rot.errors++;
                        TA._currentCycleOffset = 0;
                        fail('eccezione in rotateProgram', `${label(cfg)}: ${e.message}`);
                        continue;
                    }
                    checkProgram(r.program, cfg, 'rot');
                    // ciclo 3 (volume +2) per controllare la progressione oltre il primo giro
                    if (!LEGACY) {
                        try {
                            const r3 = TA.rotateProgram(JSON.parse(JSON.stringify(r.program)), profile);
                            checkProgram(r3.program, cfg, 'rot');
                        } catch (e) { fail('eccezione in rotateProgram (ciclo 3)', `${label(cfg)}: ${e.message}`); }
                    }
                }
            }
            // la durata deve contare: serie totali che crescono (tolleranza di 2 serie o del 3% fra durate
            // vicine, dove cambiano anche i riposi), 90' sempre sopra 45', 75' ≠ 90'.
            // v2: col riscaldamento proporzionale alla durata, 45' bastano già per il volume pieno di
            // un principiante su 5-6 giorni; a 90' la durata si vede allora nei riposi più lunghi
            // (seduta stimata ≥ +15%), non in serie oltre il massimo del livello.
            const T = DURS.map(d => totalsByDur[d]);
            if (T.some((x, i) => i && x < T[i - 1])) pairs75vs90.setsDown++;
            const ninetyNotLonger = T[3] <= T[0] && minutesByDur[90] < minutesByDur[45] * 1.15;
            if (!LEGACY && (T.some((x, i) => i && x < T[i - 1] - Math.max(2, Math.round(T[i - 1] * 0.03))) || ninetyNotLonger)) {
                fail('serie che calano allungando la durata', `${goal} ${split} ${days}gg ${level} ${en} ${sex}: ${T}`);
            }
            const k75 = byKey[`${goal}|${days}|${split}|${level}|${en}|${sex}|75`], k90 = byKey[`${goal}|${days}|${split}|${level}|${en}|${sex}|90`];
            if (k75 && k90) {
                pairs75vs90.total++;
                const strip = (pp) => JSON.stringify(pp.days);
                if (strip(k75) === strip(k90)) pairs75vs90.same++;
            }
        }
        // uomo e donna non identici
        DURS.forEach(dur => {
            const ps = perSex[`${dur}`];
            if (ps && ps.male && ps.female && JSON.stringify(ps.male.days) === JSON.stringify(ps.female.days)) {
                fail('schede uomo e donna identiche', `${goal} ${split} ${days}gg ${level} ${dur}' ${en}`);
            }
        });
    }
}
if (!LEGACY && pairs75vs90.same) fail("75' e 90' identiche", `${pairs75vs90.same}/${pairs75vs90.total}`);

// ------------------------------------------------------------------
// API del contratto (solo sulla versione nuova)
// ------------------------------------------------------------------
function unit(name, fn) {
    try { const r = fn(); if (r !== true) fail('unit: ' + name, String(r)); } catch (e) { fail('unit: ' + name, e.stack.split('\n').slice(0, 2).join(' ')); }
}
if (!LEGACY) {
    unit('buildCycle per ogni obiettivo e livello', () => {
        for (const g of GOALS) for (const l of LEVELS) checkCycle(TA.buildCycle(g, l), g, l, `buildCycle ${g} ${l}`);
        return true;
    });
    unit('getPhaseForWeek', () => {
        // v2 (ALGORITMO-V2 §12.1): intermedio = 6 settimane (5 di lavoro + scarico), non più 5
        const c = TA.buildCycle('hypertrophy', 'intermediate');
        if (c.duration !== 6) return 'durata intermedio ' + c.duration;
        if (TA.getPhaseForWeek(c, 1).phase !== 'accumulation') return 'settimana 1';
        if (TA.getPhaseForWeek(c, 5).phase !== 'intensification') return 'settimana 5';
        if (TA.getPhaseForWeek(c, 6).phase !== 'deload') return 'settimana 6';
        if (TA.getPhaseForWeek(c, 9).phase !== 'deload') return 'oltre la fine';
        if (TA.getPhaseForWeek(null, 1) !== null) return 'ciclo nullo';
        return true;
    });
    unit('getVolumeMultiplier', () => {
        // v2 (§12.2): il moltiplicatore 0,9 dell'intensificazione v1.26 non aveva basi → 1; scarico 0,5
        return TA.getVolumeMultiplier('accumulation') === 1 && TA.getVolumeMultiplier({ phase: 'intensification' }) === 1 &&
            TA.getVolumeMultiplier('deload') === 0.5 && TA.getVolumeMultiplier(null) === 1 || 'valori';
    });
    unit('applyPhaseToDay (v2 §12.2: lavoro invariato + RIR per esercizio, scarico ÷2 e RIR 4)', () => {
        const p = TA.generateProgram({ level: 'intermediate', gender: 'female', equipment: EQUIP.default }, { goal: 'hypertrophy', daysPerWeek: 4, split: 'upper-lower', sessionDuration: 75 });
        const day = p.days[0];
        const before = JSON.stringify(day);
        const c = TA.buildCycle('hypertrophy', 'intermediate');
        const del = TA.applyPhaseToDay(day, TA.getPhaseForWeek(c, 6));
        const inten = TA.applyPhaseToDay(day, TA.getPhaseForWeek(c, 5));
        const acc = TA.applyPhaseToDay(day, TA.getPhaseForWeek(c, 1));
        if (JSON.stringify(day) !== before) return 'il giorno originale è stato modificato';
        const tot = d => d.exercises.reduce((a, e) => a + e.sets, 0);
        if (!del.exercises.every((e, i) => e.sets === Math.max(1, Math.ceil(day.exercises[i].sets / 2)) || e.supersetGroup)) return 'scarico: serie sbagliate';
        if (tot(inten) !== tot(day) || tot(acc) !== tot(day)) return 'lavoro (intermedio): serie cambiate';
        if (!del.exercises.every(e => e.targetRir === 4) || del.loadFactor !== 0.9) return 'scarico: RIR 4 e carico −10%';
        const comp = acc.exercises.filter(e => e.type === 'compound' && !e.isCore);
        const iso = acc.exercises.filter(e => e.type === 'isolation' && !e.isCore);
        if (!comp.every(e => e.targetRir === 3) || !iso.every(e => e.targetRir === 2)) return 'settimana 1: RIR 3 multiarticolari, 2 isolamenti';
        if (!inten.exercises.filter(e => e.type === 'compound' && !e.isCore).every(e => e.targetRir === 1)) return 'settimana 5: RIR 1';
        const groups = {};
        del.exercises.forEach(e => { if (e.supersetGroup) (groups[e.supersetGroup] = groups[e.supersetGroup] || new Set()).add(e.sets); });
        if (Object.values(groups).some(s => s.size > 1)) return 'superset non pareggiati';
        // avanzato: +1 serie nelle settimane 3-4 sul primo accessorio di ogni muscolo grande
        const ca = TA.buildCycle('hypertrophy', 'advanced');
        const w3 = TA.applyPhaseToDay(day, TA.getPhaseForWeek(ca, 3));
        if (!(tot(w3) > tot(day))) return 'avanzato settimana 3: nessuna serie in più';
        // scheda salvata dalla v1.26 (fase senza rir/setsDelta/loadFactor): default
        const old = TA.applyPhaseToDay(day, { week: 2, phase: 'intensification', rirTarget: { min: 0, max: 2 }, volumeMultiplier: 0.9 });
        // R1-03: fase v1.25 senza rir → multiarticolari max(1, min), isolamenti min
        if (tot(old) !== tot(day) || old.exercises.some(e => e.targetRir !== (e.type === 'compound' && !e.isCore ? 1 : 0))) return 'fase v1.26: default';
        // zona dolente: RIR minimo 2 sugli esercizi che la sollecitano
        const pain = TA.applyPhaseToDay(day, TA.getPhaseForWeek(c, 5), { painAreas: ['shoulder'] });
        if (pain.exercises.some(e => (DB[e.exerciseId].joint.shoulder >= 1) && e.targetRir < 2)) return 'zona dolente: RIR < 2';
        return true;
    });
    unit('getNextDayIndex', () => {
        const p = TA.generateProgram({ level: 'beginner', equipment: EQUIP.default }, { goal: 'hypertrophy', daysPerWeek: 4, split: 'upper-lower', sessionDuration: 60 });
        const pid = p.metadata.programId;
        const t = (d) => new Date(2026, 9, d).toISOString();
        if (TA.getNextDayIndex(p, []) !== 0) return 'nessun workout → 0';
        if (TA.getNextDayIndex(p, [{ date: t(10), programId: pid, dayIndex: 1, type: p.days[1].type }]) !== 2) return 'dopo il giorno 2 → 3';
        if (TA.getNextDayIndex(p, [{ date: t(10), programId: pid, dayIndex: 3 }]) !== 0) return 'dopo l\'ultimo → 0';
        // scelto a mano un giorno fuori sequenza: si riparte da quello
        if (TA.getNextDayIndex(p, [{ date: t(12), programId: pid, dayIndex: 1 }, { date: t(11), programId: pid, dayIndex: 2 }]) !== 2) return 'ordine per data';
        if (TA.getNextDayIndex(p, [{ date: t(12), isFreeWorkout: true, type: 'Allenamento Libero' }, { date: t(11), programId: pid, dayIndex: 0 }]) !== 1) return 'allenamento libero escluso';
        if (TA.getNextDayIndex(p, [{ date: t(12), programId: 999, dayIndex: 2 }]) !== 0) return 'altra scheda ignorata';
        if (TA.getNextDayIndex(p, [{ date: t(12), type: p.days[2].type }]) !== 3) return 'vecchio workout riconosciuto dal tipo';
        if (TA.getNextDayIndex(p, [{ date: t(12), type: 'Allenamento Libero' }]) !== 0) return 'vecchio libero escluso';
        if (TA.getNextDayIndex({ days: [] }, []) !== 0) return 'scheda vuota';
        return true;
    });
    unit('estimateWorkoutDuration (v2 §13.1): riscaldamento ridotto alla durata, defaticamento 5\' di ripiego', () => {
        // Formula cambiata con la v2 (ALGORITMO-V2 §13.1): tempo della serie = metà range × 4,5 s
        // (ipertrofia), riposo dopo ogni serie meno quello dell'ultimo blocco, 30 s fra i blocchi.
        const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
        const mk = (warmupsSrc) => {
            const c = { console };
            vm.createContext(c);
            vm.runInContext(warmupsSrc + '\n' + read('data/exercises.js') + '\n' + read('modules/algorithm.js') + '\n;this.TA = TrainingAlgorithm;', c);
            return c.TA;
        };
        const day = { warmup: 'lower', exercises: [{ exerciseId: 'squat', sets: 3, reps: '8-12', rest: 120 }] };
        // squat 3×10: 3 × 45 s + 3 riposi da 120 s − l'ultimo = 375 s
        const stub = mk('var Warmups = { getWarmupDurationMin: () => 20, getCooldownDurationMin: () => 7 };');
        const none = mk('');
        if (stub.estimateWorkoutDuration(day) !== Math.round((20 * 60 + 375 + 300) / 60)) return `routine intera: ${stub.estimateWorkoutDuration(day)}`;
        if (none.estimateWorkoutDuration(day) !== Math.round((8 * 60 + 375 + 300) / 60)) return `ripiego 8': ${none.estimateWorkoutDuration(day)}`;
        // con la durata scelta: tetto 6' + 3' a 45' (la routine da 20' si riduce)
        if (stub.estimateWorkoutDuration(day, { minutes: 45 }) !== Math.round((6 * 60 + 375 + 3 * 60) / 60)) return `45': ${stub.estimateWorkoutDuration(day, { minutes: 45 })}`;
        // il giorno generato porta i suoi minuti
        if (TA.estimateWorkoutDuration({ ...day, warmupMin: 7, cooldownMin: 4 }) !== Math.round((7 * 60 + 375 + 240) / 60)) return 'warmupMin del giorno';
        if (TA.estimateWorkoutDuration({ exercises: [] }) !== 0) return 'giorno vuoto ≠ 0';
        // superset: riposo solo fra i giri
        const ss = { warmup: 'upper', exercises: [
            { exerciseId: 'dumbbell-curl', sets: 3, reps: '10-12', rest: 75, supersetGroup: 'A', supersetOrder: 1, supersetRest: 60, transitionTime: 5 },
            { exerciseId: 'dumbbell-tricep-extension', sets: 3, reps: '10-12', rest: 75, supersetGroup: 'A', supersetOrder: 2, supersetRest: 60, transitionTime: 5 }] };
        const sep = { warmup: 'upper', exercises: ss.exercises.map(e => ({ exerciseId: e.exerciseId, sets: 3, reps: '10-12', rest: 75 })) };
        if (TA.estimateWorkoutDuration(ss) >= TA.estimateWorkoutDuration(sep)) return 'il superset non fa risparmiare tempo';
        // routine ridotte: durata vera entro il tetto, prima gli esercizi più utili
        if (C.WU && typeof C.WU.getWarmupForDuration === 'function') {
            for (const m of [45, 60, 75, 90]) for (const k of Object.keys(C.WU.WARMUPS_DB)) {
                const w = C.WU.getWarmupForDuration(k, m), cd = C.WU.getCooldownForDuration(k, m);
                if (!(w.durationMin <= C.WU.getWarmupBudgetMin(m)) || !w.exercises.length) return `riscaldamento ${k} ${m}': ${w.durationMin}`;
                if (!(cd.durationMin <= C.WU.getCooldownBudgetMin(m)) || !cd.exercises.length) return `defaticamento ${k} ${m}': ${cd.durationMin}`;
            }
            if (C.WU.WARMUPS_DB.lower.exercises.length !== 9) return 'il database delle routine è stato modificato';
        }
        return true;
    });
    unit('generateConditioningSuggestions (toning, firma nuova e vecchia)', () => {
        const p = TA.generateProgram({ level: 'beginner', gender: 'female', equipment: EQUIP.default }, { goal: 'toning', daysPerWeek: 3, split: 'upper-lower', sessionDuration: 60 });
        const s = TA.generateConditioningSuggestions('toning', p);
        if (!s.enabled || !(s.frequency >= 1)) return 'toning disabilitato';
        if (/Forza/i.test(s.message || '')) return 'messaggio della forza';
        if (!s.legDays.length) return 'giorni di gambe non trovati da program.days';
        // v2 (§16.2): niente HIIT per i principianti → nessun protocollo; dagli intermedi in su sì
        if (s.protocol || !s.weekly || s.weekly.some(w => w.type === 'hiit')) return 'principiante: niente HIIT';
        const pi = TA.generateProgram({ level: 'intermediate', gender: 'female', equipment: EQUIP.default }, { goal: 'toning', daysPerWeek: 3, split: 'upper-lower', sessionDuration: 60 });
        const si = TA.generateConditioningSuggestions('toning', pi);
        if (!si.protocol || !si.protocol.name) return 'protocollo mancante';
        const old = TA.generateConditioningSuggestions('recomp', 'intermediate', 4, []);
        if (!old.enabled) return 'vecchia firma';
        const st = TA.generateConditioningSuggestions('strength', p);
        // v2 (§16.2): nella forza 1-2 LISS da 20-30' per la salute, mai HIIT
        if (st.hiitAllowed || st.weekly.some(w => w.type === 'hiit')) return 'forza con HIIT';
        return true;
    });
    unit('rotateProgram: schede manuali restituite identiche', () => {
        const manual = { name: 'X', days: [{ name: 'Giorno 1', type: 'A', exercises: [{ exerciseId: 'squat', sets: 3, reps: '5-5', rest: 90 }] }], metadata: { isCustom: true, split: 'custom', goal: 'hypertrophy' } };
        const out = TA.rotateProgram(manual, { level: 'beginner' });
        if (out.program !== manual || out.added.length || out.removed.length) return 'manuale cambiata';
        const man2 = { ...manual, metadata: { isManual: true } };
        if (TA.rotateProgram(man2, {}).program !== man2) return 'isManual';
        return true;
    });
    unit('rotateProgram: scheda salvata dalla v1.25 (senza generatorOptions)', () => {
        const old = {
            name: 'Tonificazione Upper/Lower', days: [{ name: 'Giorno 1', type: 'Lower A', exercises: [{ exerciseId: 'hip-thrust', sets: 3, reps: '8-12', rest: 90 }] }],
            metadata: { goal: 'toning', split: 'upper-lower', daysPerWeek: 3, sessionDuration: 60, level: 'beginner', cycle: TA.buildCycle('toning', 'beginner') }
        };
        const out = TA.rotateProgram(old, { level: 'beginner', gender: 'female', equipment: ['bilanciere', 'manubri', 'macchine', 'cavi'] });
        if (out.program.days.length !== 3) return 'giorni';
        if (out.program.metadata.goal !== 'toning') return 'obiettivo perso';
        if (!out.program.days.every(d => d.exercises.length >= 4)) return 'giorni corti';
        return true;
    });
    unit('rotateProgram cambia davvero gli esercizi', () => {
        const prof = { level: 'intermediate', equipment: EQUIP.palestra, gender: 'male' };
        const p = TA.generateProgram(prof, { goal: 'hypertrophy', daysPerWeek: 4, split: 'upper-lower', sessionDuration: 60 });
        const out = TA.rotateProgram(p, prof);
        if (!out.added.length || !out.removed.length) return 'nessuna rotazione';
        return true;
    });
    // ---------------- R3: invarianti del revisore-allenatore
    const mainsOf = (p) => p.days.map(d => d.exercises[0].exerciseId).join('/');
    const rot = (p, prof, n) => { let q = p; for (let i = 0; i < n; i++) q = TA.rotateProgram(q, prof).program; return q; };
    unit('R3-03 rotazione: fondamentali uguali per 2 cicli (periodo 2), forza mai ruotati, accessori ogni ciclo', () => {
        let changedAt3 = 0, n = 0;
        for (const goal of ['hypertrophy', 'recomp', 'toning', 'endurance']) for (const days of [3, 4]) {
            const prof = { level: 'intermediate', gender: 'male', equipment: EQUIP.palestra };
            const p1 = TA.generateProgram(prof, { goal, daysPerWeek: days, split: 'upper-lower', sessionDuration: 60 });
            const p2 = rot(p1, prof, 1), p3 = rot(p2, prof, 1);
            if (mainsOf(p1) !== mainsOf(p2)) return `${goal} ${days}gg: main cambiati al ciclo 2 (${mainsOf(p1)} → ${mainsOf(p2)})`;
            n++; if (mainsOf(p3) !== mainsOf(p2)) changedAt3++;
        }
        if (!changedAt3) return 'al ciclo 3 nessun fondamentale ruota';
        for (const days of [3, 4, 5]) {
            const prof = { level: 'advanced', gender: 'male', equipment: EQUIP.palestra };
            const p1 = TA.generateProgram(prof, { goal: 'strength', daysPerWeek: days, split: 'upper-lower', sessionDuration: 75 });
            const p4 = rot(p1, prof, 3);
            if (mainsOf(p1) !== mainsOf(p4)) return `forza ${days}gg: fondamentali ruotati (${mainsOf(p1)} → ${mainsOf(p4)})`;
        }
        return true;
    });
    unit('R3-03 rotazione da una scheda v1.25: restano i fondamentali che la persona fa già', () => {
        const old = { name: 'U/L', days: [
            { name: 'G1', type: 'Upper A', exercises: ['bench-press', 'barbell-row', 'overhead-press', 'pull-up'].map(id => ({ exerciseId: id, sets: 3, reps: '8-12' })) },
            { name: 'G2', type: 'Lower A', exercises: ['squat', 'leg-press', 'hip-thrust'].map(id => ({ exerciseId: id, sets: 3, reps: '8-12' })) },
            { name: 'G3', type: 'Upper B', exercises: ['bench-press', 'barbell-row', 'lateral-raise'].map(id => ({ exerciseId: id, sets: 3, reps: '8-12' })) },
            { name: 'G4', type: 'Lower B', exercises: ['romanian-deadlift', 'hip-thrust', 'squat'].map(id => ({ exerciseId: id, sets: 3, reps: '8-12' })) }],
            metadata: { goal: 'hypertrophy', split: 'upper-lower', daysPerWeek: 4, sessionDuration: 60, level: 'intermediate' } };
        const out = TA.rotateProgram(old, { level: 'intermediate', gender: 'male', equipment: EQUIP.palestra });
        const ids = new Set(out.program.days.flatMap(d => d.exercises.map(e => e.exerciseId)));
        const kept = ['bench-press', 'barbell-row', 'squat', 'romanian-deadlift'].filter(x => ids.has(x));
        return kept.length >= 4 || `restano solo ${kept}`;
    });
    unit('R3-18 volume del ciclo dopo da adesione e progressi (non +1 a ogni ciclo)', () => {
        const prof = { level: 'intermediate', gender: 'male', equipment: EQUIP.palestra };
        const p1 = TA.generateProgram(prof, { goal: 'hypertrophy', daysPerWeek: 4, split: 'upper-lower', sessionDuration: 75 });
        const tot = (p) => p.days.reduce((a, d) => a + d.exercises.reduce((b, e) => b + e.sets, 0), 0);
        const good = TA.rotateProgram(p1, prof, { adherence: 0.9, earlyDeloads: 0, progressedPct: 0.7 });
        const none = TA.rotateProgram(p1, prof);
        const bad = TA.rotateProgram(p1, prof, { adherence: 0.5, earlyDeloads: 1, progressedPct: 0.2 });
        if ([good.volumeOffset, none.volumeOffset, bad.volumeOffset].join() !== '1,0,-1') return `offset ${good.volumeOffset},${none.volumeOffset},${bad.volumeOffset}`;
        if (good.program.metadata.volumeOffset !== 1) return 'metadata.volumeOffset';
        return tot(good.program) >= tot(bad.program) || `serie: buono ${tot(good.program)} < scarso ${tot(bad.program)}`;
    });
    unit('R3-08 esclusi per famiglia, ginocchio dolente con meno affondi e più cerniera/ponte', () => {
        const prof = { level: 'intermediate', gender: 'female', equipment: EQUIP.palestra, avoidExercises: ['bulgarian-split-squat', 'leg-extension'] };
        let p = TA.generateProgram(prof, { goal: 'toning', daysPerWeek: 4, split: 'upper-lower', sessionDuration: 60 });
        for (let i = 0; i < 4; i++) {
            const bad = p.days.flatMap(d => d.exercises).filter(e => ['bulgarian', 'leg-ext'].includes(DB[e.exerciseId].family));
            if (bad.length) return `ciclo ${i + 1}: ${bad.map(e => e.exerciseId)}`;
            p = TA.rotateProgram(p, prof).program;
        }
        const sum = (q, pats) => q.days.reduce((a, d) => a + d.exercises.reduce((b, e) => b + (pats.includes(DB[e.exerciseId].pattern) ? e.sets : 0), 0), 0);
        const base = TA.generateProgram({ ...prof, avoidExercises: [] }, { goal: 'toning', daysPerWeek: 4, split: 'upper-lower', sessionDuration: 60 });
        const knee = TA.generateProgram({ ...prof, avoidExercises: [], painAreas: ['knee'] }, { goal: 'toning', daysPerWeek: 4, split: 'upper-lower', sessionDuration: 60 });
        if (!(sum(knee, ['lunge']) < sum(base, ['lunge']))) return `affondi ${sum(knee, ['lunge'])} vs ${sum(base, ['lunge'])}`;
        if (!(sum(knee, ['hinge', 'bridge']) > sum(base, ['hinge', 'bridge']))) return `cerniera+ponte ${sum(knee, ['hinge', 'bridge'])} vs ${sum(base, ['hinge', 'bridge'])}`;
        return true;
    });
    unit('R3-09 rampa: range letto al centro ("6-10" = 8), serie singola per l\'altra regione, contata nella stima', () => {
        const r = TA.buildWarmupSets('bench-press', 80, '6-10', 'hypertrophy');
        if (r.some(x => x.reps === 1) || r.length > 3) return 'rampa da forza su 6-10: ' + JSON.stringify(r);
        if (TA.buildWarmupSets('squat', 140, '3-5', 'strength').length < 4) return 'forza 3-5 senza rampa lunga';
        if (TA.buildWarmupSets('squat', 100, '8-12', 'hypertrophy', null, { single: true }).length !== 1) return 'single';
        const p = TA.generateProgram({ level: 'intermediate', gender: 'male', equipment: EQUIP.palestra }, { goal: 'recomp', daysPerWeek: 3, split: 'full-body', sessionDuration: 60 });
        const d = p.days[0];
        const plan = TA.getRampPlan(d.exercises);
        if (!plan.length || plan[0].kind !== 'full' || plan[0].index !== 0) return 'piano rampa: ' + JSON.stringify(plan);
        if (!plan.some(x => x.kind === 'single')) return 'full body senza avvicinamento per l\'altra regione';
        if (!(d.exercises[0].rampSets > 0)) return 'rampSets mancante sul fondamentale';
        const noRamp = { ...d, exercises: d.exercises.map(e => ({ ...e, rampSets: 0 })) };
        if (!(TA.estimateWorkoutDuration(d) > TA.estimateWorkoutDuration(noRamp))) return 'stima senza rampa';
        if (TA.estimateWorkoutDuration(noRamp, { rampSets: 4, calibExtraMin: 6 }) !== TA.estimateWorkoutDuration(noRamp) + 6 + 6) return 'ctx.rampSets / calibExtraMin';
        return true;
    });
    unit('R3-16 seduta corta: l\'addome esce prima di togliere serie ai multiarticolari', () => {
        const ex = (id, sets, reps, rest, role) => ({ exerciseId: id, name: DB[id].name, type: DB[id].type, sets, reps, rest, role });
        const day = { type: 'Lower A', warmup: 'lower', warmupMin: 8, cooldownMin: 4, exercises: [
            ex('squat', 4, '6-10', 150, 'main'), ex('romanian-deadlift', 3, '8-12', 120, 'secondary'), ex('bulgarian-split-squat', 3, '8-12', 90, 'secondary'),
            ex('leg-curl-seated', 3, '10-15', 75, 'accessory'), ex('cable-woodchop', 3, '10-12', 45, 'core')] };
        const r = TA.compressDay(day, 40, { goal: 'hypertrophy', coreDaysElsewhere: 0 });
        const coreOut = r.changes.findIndex(c => c.removed === 'cable-woodchop');
        const firstCompoundCut = r.changes.findIndex(c => (c.step === 'S6' || c.step === 'S8'));
        if (coreOut < 0) return 'wood chop ancora dentro: ' + JSON.stringify(r.changes);
        return firstCompoundCut < 0 || coreOut < firstCompoundCut || JSON.stringify(r.changes);
    });

    unit('dumbbell-shrug-shoulders hidden ma ancora nel database', () => {
        return (DB['dumbbell-shrug-shoulders'] && DB['dumbbell-shrug-shoulders'].hidden === true) || 'manca hidden';
    });
    unit('generateProgram non lancia con input strani', () => {
        const odd = [
            [{}, {}],
            [{ level: 'boh', equipment: null }, { goal: 'bulk', daysPerWeek: '4', split: 'bro', sessionDuration: '50' }],
            [{ equipment: ['kettlebell', 'trx'] }, { goal: 'cut', daysPerWeek: 2, split: 'push-pull-legs', sessionDuration: 30 }],
            [{ level: 'expert' }, { goal: 'toning', daysPerWeek: 1, split: 'full-body', sessionDuration: 120 }],
            [{ level: 'beginner', equipment: [] }, { goal: 'strength', daysPerWeek: 4, split: 'push-pull-legs', sessionDuration: 45 }]
        ];
        odd.forEach(([pr, op]) => { const p = TA.generateProgram(pr, op); if (!p.days.length) throw new Error('vuota'); });
        return true;
    });
}

// ------------------------------------------------------------------
// Rapporto
// ------------------------------------------------------------------
const pct = (a, b) => b ? (a / b * 100).toFixed(1) + '%' : '-';
console.log(`GymTracker — algoritmo (${ROOT})${HAS_WARMUP_FN ? ' [Warmups.getWarmupDurationMin caricato]' : ' [riscaldamento: tabella interna]'}`);
console.log(`Configurazioni: ${configs} (× rotazione)`);
for (const k of ['gen', 'rot']) {
    const m = M[k];
    if (!m.programs) continue;
    console.log(`\n== ${k === 'gen' ? 'generate' : 'dopo rotateProgram'}: ${m.programs} schede, ${m.days} giornate, eccezioni ${m.errors}`);
    console.log(`   esercizi/giorno ${avg(m.exercises).toFixed(1)}, serie/giorno ${avg(m.sets).toFixed(1)}; per durata: ` +
        DURS.map(d => `${d}' ${avg(m.exByDur[d]).toFixed(1)} es/${avg(m.setsByDur[d]).toFixed(1)} serie`).join(' | '));
    console.log(`   stima/durata media: ` + DURS.map(d => `${d}' ${(avg(m.estRatio[d]) * 100).toFixed(0)}% (oltre ${pct(m.over[d], m.daysByDur[d])}, max ${m.overMax[d]}')`).join(' | '));
    console.log(`   addome serie/sett ${avg(m.abs).toFixed(1)} (max ${Math.max(...m.abs)}), polpacci ${avg(m.calves).toFixed(1)} (min ${Math.min(...m.calves)}); toning parte inferiore ${(avg(m.lowerShareToning) * 100).toFixed(1)}% (min ${(Math.min(...m.lowerShareToning) * 100).toFixed(1)}%)`);
    console.log(`   muscoli grandi sotto min−2: ${m.bigOutStrict} casi (muscolo×scheda) — accettati perché il tempo è finito o gli esercizi possibili sono 1-2 (${m.exerciseLimited || 0}) o la tonificazione dà priorità alla parte inferiore (${m.toningUpperRelaxed || 0}); violazioni ${m.bigOut}`);
    console.log(`   adattamenti per tempo esaurito: polpacci ${m.calvesTimeLimited || 0}, petto tonificazione ${m.chestTimeLimited || 0}, quota inferiore tonificazione ${m.shareTimeLimited || 0} schede, muscolo a 3 serie dirette ${m.medBorderline || 0}, laterali a 2-3 serie ${m.latTimeLimited || 0}`);
    console.log(`   superset ${m.supersets}, esercizi distinti usati ${m.idsUsed.size}/${Object.values(DB).filter(x => !x.hidden).length}`);
    console.log(`   tirata/spinta media ${avg(m.pushPull).toFixed(2)} (min ${Math.min(...m.pushPull).toFixed(2)}); sotto 0,9 accettati: una sola tirata possibile ${m.ppExercises || 0}, schiena piena, sedute con tirate piene o tirate a 4 serie ${m.ppLimited || 0}`);
}
console.log(`\nDurata: 75' identica a 90' in ${pairs75vs90.same}/${pairs75vs90.total}; serie che calano allungando la durata: ${pairs75vs90.setsDown}`);

if (process.env.GT_DUMP) require('fs').writeFileSync(process.env.GT_DUMP, (global.__all||[]).join('\n'));
const kinds = Object.keys(violations);
if (!kinds.length) {
    console.log('\nOK: 0 violazioni.');
    process.exit(0);
}
console.log(`\nVIOLAZIONI (${kinds.length} tipi):`);
kinds.sort((a, b) => violations[b].n - violations[a].n).forEach(k => {
    console.log(`  ✗ ${k}: ${violations[k].n}`);
    if (VERBOSE || violations[k].n <= 3) violations[k].examples.forEach(e => console.log(`      · ${e}`));
});
process.exit(1);
