#!/usr/bin/env node
/**
 * Test dell'algoritmo v2 della seduta (Node puro, nessuna dipendenza): tutti i vettori di
 * .analisi-2026-10/ALGORITMO-V2.md (tag §2.6, scala e dischi §3, salti §3.6, riposi §8.2,
 * progressione e RIR §9.8, primo peso e "Trova il peso" §10, rampa §11, ciclo §12.1, scarico
 * anticipato §12.4, durata e seduta corta §13, alternative §7.3, cardio §16.2) più i casi veri delle
 * due persone che usano l'app.
 *
 *   node tests/progression.test.js            → esce con codice 1 se un test fallisce
 *   node tests/progression.test.js --verbose  → stampa anche i valori calcolati
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..', 'js');
const VERBOSE = process.argv.includes('--verbose');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');

function load() {
    const c = { console };
    c.window = c;
    vm.createContext(c);
    vm.runInContext(read('data/warmups.js') + '\n' + read('data/exercises.js') + '\n' + read('modules/algorithm.js') +
        '\n;this.TA = TrainingAlgorithm; this.DB = EXERCISES_DB; this.WU = Warmups;', c, { filename: 'gymtracker.js' });
    return c;
}
const C = load();
const TA = C.TA, DB = C.DB;

// ------------------------------------------------------------------
// Mini framework
// ------------------------------------------------------------------
let passed = 0;
const failures = [];
const J = (x) => JSON.stringify(x);
function check(name, actual, expected) {
    const ok = typeof expected === 'function' ? expected(actual) : J(actual) === J(expected);
    if (ok) passed++;
    else failures.push(`${name}: atteso ${typeof expected === 'function' ? '(condizione)' : J(expected)}, trovato ${J(actual)}`);
    if (VERBOSE) console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}: ${J(actual)}`);
}
function section(t) { if (VERBOSE) console.log(`\n== ${t}`); }

const GYM = TA.DEFAULT_GYM;
const NO125 = { ...GYM, plates: [25, 20, 15, 10, 5, 2.5] };

// ==================================================================
section('§2.6 Tag del database');
// ==================================================================
const FIELDS = ['pattern', 'loadType', 'barWeight', 'unilateral', 'metric', 'tier', 'prio', 'stretch', 'joint', 'family', 'easier', 'harder'];
const ids = Object.keys(DB);
check('T2.1 ogni esercizio ha tutti i tag', ids.filter(id => FIELDS.some(f => DB[id][f] === undefined)), []);
check('T2.2 pattern e loadType negli enum', ids.filter(id => !TA.PATTERN_ENUM.includes(DB[id].pattern) || !TA.LOAD_TYPES.includes(DB[id].loadType)), []);
check('T2.3 barWeight > 0 solo per barbell/ez-bar, machine-plate = 0',
    ids.filter(id => ((DB[id].barWeight > 0) !== ['barbell', 'ez-bar'].includes(DB[id].loadType)) || (DB[id].loadType === 'machine-plate' && DB[id].barWeight !== 0)), []);
check('T2.4 catene verso id esistenti, harder[0] senza cicli', ids.filter(id => {
    if ([...DB[id].easier, ...DB[id].harder].some(x => !DB[x])) return true;
    let cur = id, n = 0;
    while (DB[cur].harder.length && n < 6) { cur = DB[cur].harder[0]; n++; }
    return n > 5;
}), []);
check('T2.5 tier 1 ⇒ compound', ids.filter(id => DB[id].tier === 1 && DB[id].type !== 'compound'), []);
const machinesOnly = new Set(['macchine', 'corpo-libero', 'panca']);
check('T2.6 ogni schema base possibile con le sole macchine (o corpo libero)',
    ['squat', 'hinge', 'lunge', 'bridge', 'push-h', 'push-v', 'pull-h', 'pull-v'].filter(p =>
        !ids.some(id => !DB[id].hidden && DB[id].pattern === p && DB[id].equipment.every(e => machinesOnly.has(e)))), []);
const only = (eq) => ids.filter(id => !DB[id].hidden && DB[id].equipment.every(e => eq.includes(e)));
check('T2.7 manubri+panca: nessun pull-v (lacuna nota)', only(['manubri', 'panca']).filter(id => DB[id].pattern === 'pull-v'), []);
check('T2.8 senza attrezzi: nessuna tirata (lacuna nota)', only([]).filter(id => /^pull-/.test(DB[id].pattern)), []);
check('T2.9 getExerciseMeta su id inesistente', TA.getExerciseMeta('id-inesistente'), null);
const fake = TA.getExerciseMeta({ type: 'isolation', primaryMuscles: ['bicipiti'], category: 'cavi' });
check('T2.10 meta derivata', [fake.pattern, fake.loadType, fake.tier], ['iso-biceps', 'cable', 3]);

// ==================================================================
section('§3.3 Scala dei carichi');
// ==================================================================
check('snap bench 61 floor/nearest/ceil', ['floor', 'nearest', 'ceil'].map(m => TA.snapLoad('bench-press', 61, m, GYM)), [60, 60, 62.5]);
check('step bench 60 +1/−1', [TA.stepLoad('bench-press', 60, 1, GYM), TA.stepLoad('bench-press', 60, -1, GYM)], [62.5, 57.5]);
check('step curl 9 +1; 10 +1', [TA.stepLoad('dumbbell-curl', 9, 1, GYM), TA.stepLoad('dumbbell-curl', 10, 1, GYM)], [10, 12]);
check('snap curl 11 floor/nearest; 13 ceil', [TA.snapLoad('dumbbell-curl', 11, 'floor', GYM), TA.snapLoad('dumbbell-curl', 11, 'nearest', GYM), TA.snapLoad('dumbbell-curl', 13, 'ceil', GYM)], [10, 10, 14]);
check('lat 42,5 floor; 50 +1', [TA.snapLoad('lat-pulldown', 42.5, 'floor', GYM), TA.stepLoad('lat-pulldown', 50, 1, GYM)], [40, 55]);
check('pushdown 11 nearest; 10 +1', [TA.snapLoad('tricep-pushdown', 11, 'nearest', GYM), TA.stepLoad('tricep-pushdown', 10, 1, GYM)], [10, 12.5]);
check('scala ez-bar-curl primi 4', TA.getLoadLadder('ez-bar-curl', GYM).slice(0, 4), [10, 12.5, 15, 17.5]);
check('scala leg-press primi 4', TA.getLoadLadder('leg-press', GYM).slice(0, 4), [0, 2.5, 5, 7.5]);
check('scala squat con bilanciere da 15', TA.getLoadLadder('squat', { ...GYM, barKg: 15 }).slice(0, 3), [15, 17.5, 20]);
check('senza dischi da 1,25: scala squat; snap 62,5 floor', [TA.getLoadLadder('squat', NO125).slice(0, 4), TA.snapLoad('squat', 62.5, 'floor', NO125)], [[20, 25, 30, 35], 60]);
check('assistite: scala primi 3; harderLoad 40', [TA.getLoadLadder('assisted-pull-up', GYM).slice(0, 3), TA.harderLoad('assisted-pull-up', 40, GYM)], [[5, 10, 15], 35]);
check('lat con 42,5 registrato', [TA.getLoadLadder('lat-pulldown', GYM, [42.5]).includes(42.5), TA.stepLoad('lat-pulldown', 40, 1, GYM, [42.5])], [true, 42.5]);
check('caso vero: manubri 10 kg, "+" → 12 (non 11)', TA.stepLoad('dumbbell-shoulder-press', 10, 1, GYM), 12);
check('manubri oltre il massimo della palestra (60 → 62)', TA.stepLoad('dumbbell-row', 60, 1, GYM, [60]), 62);

// ==================================================================
section('§3.5 Calcolatore dischi');
// ==================================================================
const P = (kg, o = {}) => TA.calcPlates(kg, { barKg: 20, plates: GYM.plates, ...o });
check('100', P(100), { perSide: [25, 15], achieved: 100, exact: true, belowBar: false });
check('62,5', P(62.5).perSide, [20, 1.25]);
check('61', [P(61).perSide, P(61).achieved, P(61).exact], [[20], 60, false]);
check('caso vero: bilanciere 102,5 → 25+15+1,25 per lato', P(102.5).perSide, [25, 15, 1.25]);
check('140', P(140).perSide, [25, 25, 10]);
check('187,5', P(187.5).perSide, [25, 25, 25, 5, 2.5, 1.25]);
check('50 con bilanciere da 15', P(50, { barKg: 15 }).perSide, [15, 2.5]);
check('20', [P(20).perSide, P(20).achieved, P(20).exact], [[], 20, true]);
check('21', [P(21).perSide, P(21).achieved, P(21).exact, P(21).belowBar], [[], 20, false, false]);
check('19', [P(19).perSide, P(19).achieved, P(19).belowBar], [[], 20, true]);
check('62,5 senza 1,25', [P(62.5, { plates: NO125.plates }).perSide, P(62.5, { plates: NO125.plates }).achieved, P(62.5, { plates: NO125.plates }).exact], [[20], 60, false]);
const ONE = { 25: 1, 20: 1, 15: 1, 10: 1, 5: 1, 2.5: 1, 1.25: 1 };
check('100 con un disco per tipo', P(100, { plateCounts: ONE }).perSide, [25, 15]);
check('140 con un disco per tipo (3 dischi)', P(140, { plateCounts: ONE }).perSide, [25, 20, 15]);
check('200 con un disco per tipo', [P(200, { plateCounts: ONE }).perSide.length, P(200, { plateCounts: ONE }).achieved, P(200, { plateCounts: ONE }).exact], [7, 177.5, false]);

// ==================================================================
section('§3.6 Salti e rep da guadagnare');
// ==================================================================
const JUMPS = [
    ['squat', 100, 105, 5.0, false, [10, 12, 15]], ['squat', 60, 62.5, 4.2, false, [10, 12, 14]],
    ['squat', 140, 147.5, 5.4, false, [11, 13, 15]], ['leg-press', 120, 125, 4.2, false, [10, 12, 14]],
    ['hip-thrust', 30, 32.5, 8.3, false, [12, 14, 16]], ['romanian-deadlift', 50, 52.5, 5.0, false, [10, 12, 15]],
    ['bench-press', 80, 82.5, 3.1, false, [10, 12, 14]], ['lateral-raise', 6, 7, 16.7, true, [15, 17, 19]],
    ['ez-bar-curl', 20, 22.5, 12.5, true, [13, 15, 18]], ['lat-pulldown', 50, 55, 10.0, false, [12, 14, 17]],
    ['goblet-squat', 16, 18, 12.5, true, [13, 15, 18]], ['dumbbell-bench-press', 10, 12, 20.0, true, [16, 18, 21]],
    ['dumbbell-bench-press', 22, 24, 9.1, false, [12, 14, 16]], ['hip-abduction', 40, 45, 12.5, true, [13, 15, 18]]
];
JUMPS.forEach(([id, kg, next, pct, big, reps]) => {
    const j = TA.getProgressionJump(id, kg, GYM);
    check(`salto ${id} ${kg}`, [j.nextKg, Math.round(j.pct * 1000) / 10, j.bigJump, [8, 10, 12].map(lo => TA.repsToEarnJump(lo, kg, j.nextKg))], [next, pct, big, reps]);
});
check('assistite 40 → 35', TA.getProgressionJump('assisted-pull-up', 40, GYM).nextKg, 35);
check('push-up 0 / dips 0 → null', [TA.getProgressionJump('push-up', 0, GYM), TA.getProgressionJump('dips', 0, GYM)], [null, null]);
// R3-07: il range esteso arriva al massimo a hi + 2 (con +5 le laterali da 2 kg arrivavano a 3×20)
check('need laterali 6 kg 12-15 (tetto hi+2)', TA.needReps([12, 15], 6, 7), 17);
check('need squat 100 kg 6-10', TA.needReps([6, 10], 100, 105), 10);

// ==================================================================
section('§8.2 Riposi');
// ==================================================================
check('panca main ipertrofia uomo', TA.getRestSeconds('bench-press', 'main', 'hypertrophy', { gender: 'male' }), 150);
check('panca main ipertrofia donna', TA.getRestSeconds('bench-press', 'main', 'hypertrophy', { gender: 'female' }), 130);
check('abductor isolamento tonificazione donna', TA.getRestSeconds('hip-abduction', 'isolation', 'toning', { gender: 'female' }), 50);
check('squat main resistenza donna (pavimento 90)', TA.getRestSeconds('squat', 'main', 'endurance', { gender: 'female' }), 90);
check('polpacci', TA.getRestSeconds('standing-calf-raise', 'isolation', 'hypertrophy', { gender: '' }), 60);

// ==================================================================
section('§9.8 Progressione (computeNextTarget)');
// ==================================================================
const S = (kg, reps, rir) => ({ weight: kg, reps, rir, completed: true });
const sess = (sets, extra = {}) => ({ date: '2026-10-14T10:00:00.000Z', phase: 'accumulation', sets, ...extra });
const NOW = new Date('2026-10-16T10:00:00Z');
const PROF_FULL = { equipment: ['bilanciere', 'manubri', 'macchine', 'cavi', 'panca', 'sbarra', 'parallele', 'accessori'] };
function next(id, range, sessions, level, targetRir, extra = {}) {
    return TA.computeNextTarget({ exerciseId: id, range, sessions, level, targetRir, gym: GYM, recorded: [], personPauseDays: 2, now: NOW, profile: { ...PROF_FULL, level }, ...extra });
}
const R = (sug) => [sug.status, sug.suggestedWeight, sug.suggestedReps];
check('P1', R(next('bench-press', [8, 12], [sess([S(60, 12, 2), S(60, 12, 2), S(60, 12, 1)])], 'intermediate', 2)), ['increase_weight', 62.5, 8]);
check('P2', R(next('bench-press', [8, 12], [sess([S(60, 10, 2), S(60, 10, 2), S(60, 9, 2)])], 'intermediate', 2)), ['increase_reps', 60, 11]);
check('P3', R(next('bench-press', [8, 12], [sess([S(60, 10, 4), S(60, 10, 4), S(60, 9, 4)])], 'intermediate', 2)), ['rir_up', 62.5, 10]);
check('P4', R(next('bench-press', [8, 12], [sess([S(60, 10, 4), S(60, 10, 4), S(60, 9, 4)])], 'beginner', 2)), ['rir_up', 62.5, 10]);
check('P5', R(next('bench-press', [8, 12], [sess([S(60, 12, 0), S(60, 12, 0), S(60, 12, 0)])], 'advanced', 2)), ['rir_hold', 60, 12]);
check('P6', R(next('bench-press', [8, 12], [sess([S(60, 7, 0), S(60, 6, 0), S(60, 6, 0)])], 'advanced', 3)), ['rir_down', 55, 8]);
check('P7', R(next('lateral-raise', [12, 15], [sess([S(6, 15, 2), S(6, 15, 2), S(6, 15, 1)])], 'intermediate', 2)), ['increase_reps', 6, 16]);
check('P8', R(next('lateral-raise', [12, 15], [sess([S(6, 19, 1), S(6, 19, 1), S(6, 19, 1)])], 'intermediate', 2)), ['increase_weight', 7, 12]);
check('P9', R(next('squat', [6, 10], [sess([S(100, 10), S(100, 10), S(100, 10)])], 'advanced', 2)), ['increase_weight', 105, 6]);
check('P10', R(next('hip-thrust', [8, 12], [sess([S(30, 12, 3), S(30, 12, 3), S(30, 12, 3)])], 'beginner', 3)), ['increase_weight', 32.5, 8]);
check('P11', R(next('hip-thrust', [8, 12], [sess([S(30, 14, 3), S(30, 14, 3), S(30, 14, 3)])], 'beginner', 3)), ['increase_weight', 32.5, 8]);
check('P12', R(next('lat-pulldown', [8, 12], [sess([S(50, 12, 0), S(50, 11, 0), S(50, 10, 0)])], 'intermediate', 2)), ['rir_hold', 50, 12]);
check('P13', R(next('lat-pulldown', [8, 12], [sess([S(50, 8, 0), S(50, 7, 0), S(50, 6, 0)])], 'advanced', 3)), ['maintain', 50, 8]);
check('P14', R(next('leg-press', [10, 15], [sess([S(100, 15, 4), S(100, 15, 4), S(100, 15, 4)])], 'intermediate', 2)), ['increase_weight', 105, 10]);
const p15 = next('push-up', [12, 20], [sess([S(0, 20), S(0, 20), S(0, 20)])], 'intermediate', 2);
check('P15', [p15.status, p15.variantId, p15.suggestedReps], ['variant_up', 'decline-push-up', 12]);
check('P16', R(next('push-up', [12, 20], [sess([S(0, 20), S(0, 20), S(0, 20)])], 'beginner', 2)), ['increase_reps', 0, 21]);
check('P16 range esteso fino a 30', R(next('push-up', [12, 20], [sess([S(0, 30), S(0, 30), S(0, 30)])], 'beginner', 2)), ['maintain', 0, 30]);
check('P17', R(next('pull-up', [6, 12], [sess([S(0, 12), S(0, 12), S(0, 12)])], 'advanced', 2)), ['add_load', 2.5, 6]);
check('P18', R(next('assisted-pull-up', [8, 12], [sess([S(40, 12), S(40, 12), S(40, 12)])], 'beginner', 2)), ['increase_weight', 35, 8]);
const p19 = next('assisted-pull-up', [8, 12], [sess([S(5, 12), S(5, 12), S(5, 12)])], 'beginner', 2);
check('P19 (chin-up è intermediate: resta 5 kg)', [p19.status, p19.suggestedWeight, p19.variantId], ['maintain', 5, null]);
const p19b = next('assisted-pull-up', [8, 12], [sess([S(5, 12), S(5, 12), S(5, 12)])], 'intermediate', 2);
check('P19 intermedio → chin-up', [p19b.status, p19b.variantId], ['variant_up', 'chin-up']);
const p20 = next('plank', [20, 30], [sess([S(0, 30), S(0, 30), S(0, 30)])], 'beginner', 2);
check('P20 (caso vero: plank a tempo)', [p20.status, p20.suggestedReps, p20.metric, p20.suggestedWeight], ['increase_time', 35, 'time', 0]);
// oltre 30 + 15 s: variante più dura se ammessa (ab wheel è "advanced": per la principiante si resta a 45 s)
check('P20 tetto a 30+15 s', R(next('plank', [20, 30], [sess([S(0, 45), S(0, 45)])], 'beginner', 2)), ['maintain', 0, 45]);
check('P20 avanzato oltre il tetto → ab wheel', next('plank', [45, 60], [sess([S(0, 75), S(0, 75)])], 'advanced', 2).variantId, 'ab-wheel-rollout');
const p21 = next('bench-press', [8, 12], [sess([S(54, 6, 4), S(54, 6, 4)], { phase: 'deload', date: '2026-10-15T10:00:00Z' }), sess([S(60, 10, 2), S(60, 10, 2), S(60, 9, 2)])], 'intermediate', 2);
check('P21 seduta di scarico ignorata', R(p21), ['increase_reps', 60, 11]);
const p22 = next('bench-press', [8, 12], [
    sess([S(55, 7), S(55, 7), S(55, 6)], { date: '2026-10-14T10:00:00Z' }),
    sess([S(55, 7), S(55, 6), S(55, 6)], { date: '2026-10-11T10:00:00Z' }),
    sess([S(52.5, 9), S(52.5, 8), S(52.5, 8)], { date: '2026-10-08T10:00:00Z' })], 'intermediate', 2);
check('P22 stallo → back-off', R(p22), ['backoff', 47.5, 8]);
// Suggestion: forma §19.2
const shape = next('bench-press', [8, 12], [sess([S(60, 12, 2), S(60, 12, 2)])], 'intermediate', 2);
check('Suggestion: campi e messaggio', ['status', 'action', 'suggestedWeight', 'suggestedReps', 'targetRir', 'metric', 'variantId', 'bigJump', 'rirDelta', 'increment', 'message', 'lastPerformance'].every(k => k in shape) &&
    typeof shape.suggestedWeight === 'number' && !/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(shape.message) && !/\n/.test(shape.message), true);
check('Suggestion: messaggio', shape.message, 'Aumenta a 62,5 kg');
// R3-12: scarico al gradino più vicino (54 → 55, −8%; per difetto era 52,5, −12,5%)
check('Scarico (prossima seduta): −10% al gradino più vicino, RIR 4', (() => { const s = next('bench-press', [8, 12], [sess([S(60, 10, 2)])], 'intermediate', 2, { phase: 'deload' }); return [s.status, s.suggestedWeight, s.targetRir]; })(), ['deload', 55, 4]);
check('Pausa della persona ≥21 giorni → detraining', next('squat', [8, 12], [sess([S(40, 10)])], 'beginner', 2, { personPauseDays: 28 }).status, 'detraining');
const corpoLegacy = next('glute-bridge', [12, 20], [sess([{ weight: 62, reps: 20, completed: true, isBodyweight: true }, { weight: 62, reps: 20, completed: true, isBodyweight: true }])], 'beginner', 2);
// (il ponte su una gamba è "intermediate": per la principiante la variante ammessa è l'hip thrust col manubrio)
check('corpo libero v1.25 (peso corporeo nel campo peso) = zavorra 0', [corpoLegacy.status, corpoLegacy.variantId], ['variant_up', 'dumbbell-hip-thrust']);
check('mai NaN né negativi', [['squat', [6, 10]], ['plank', [20, 30]], ['assisted-pull-up', [8, 12]], ['push-up', [12, 20]]].every(([id, r]) => {
    const s = next(id, r, [sess([S('', ''), S('abc', 5)])], 'beginner', 2);
    return Number.isFinite(s.suggestedWeight) && s.suggestedWeight >= 0 && Number.isFinite(s.suggestedReps) && s.suggestedReps >= 0;
}), true);

// ==================================================================
section('§10.1 Primo peso');
// ==================================================================
const START = {
    'dumbbell-hip-thrust': [8, 16, 22, 10], 'hip-thrust': [20, 42.5, 57.5, 27.5], 'leg-press': [20, 42.5, 57.5, 27.5],
    'goblet-squat': [4, 10, 14, 6], 'dumbbell-rdl': [4, 10, 14, 6], 'bulgarian-split-squat': [3, 6, 9, 4],
    'lat-pulldown': [10, 25, 40, 15], 'chest-press-machine': [10, 25, 35, 15], 'dumbbell-bench-press': [3, 8, 10, 5],
    'dumbbell-shoulder-press': [2, 5, 8, 3], 'lateral-raise': [1, 3, 4, 2], 'hip-abduction': [10, 20, 25, 10],
    'leg-curl-seated': [5, 15, 20, 10], 'tricep-pushdown': [2.5, 10, 12.5, 5], 'cable-kickback': [2.5, 2.5, 5, 2.5],
    'standing-calf-raise': [20, 40, 55, 25], 'bench-press': [20, 25, 35, 20], 'squat': [20, 27.5, 40, 20],
    // assistite, sesso non indicato: la specifica scrive 35, ma la sua formula (0,6 × 70 × 1 = 42 → ceil 45)
    // dà 45; 35 vorrebbe dire MENO assistenza di un uomo di pari peso. Si tiene la formula (più prudente).
    'assisted-pull-up': [45, 55, 40, 45], 'push-up': [0, 0, 0, 0]
};
const PROFILES = [{ gender: 'female', weight: 62, level: 'beginner' }, { gender: 'male', weight: 85, level: 'beginner' },
    { gender: 'male', weight: 85, level: 'intermediate' }, { gender: '', level: 'beginner' }];
Object.keys(START).forEach(id => check(`primo peso ${id}`, PROFILES.map(p => TA.estimateStartingLoad(id, p, GYM).kg), START[id]));
check('aboveSeed: panca per la donna principiante', [TA.estimateStartingLoad('bench-press', PROFILES[0], GYM).aboveSeed, TA.estimateStartingLoad('hip-thrust', PROFILES[0], GYM).aboveSeed], [true, false]);
// caso vero: donna principiante, tonificazione, nessuno storico (manubri, macchine, cavi, panca)
const LEI = { gender: 'female', level: 'beginner', equipment: ['manubri', 'macchine', 'cavi', 'panca'] };
const first = (id, range) => TA.computeNextTarget({ exerciseId: id, range, sessions: [], level: 'beginner', gym: GYM, profile: LEI, now: NOW });
const fg = first('goblet-squat', [8, 12]), fh = first('dumbbell-hip-thrust', [8, 12]), fl = first('lat-pulldown', [8, 12]);
check('caso vero: lei, primo goblet squat (senza peso nel profilo: 62 kg)', [fg.status, fg.suggestedWeight, fg.calibrate, fg.testReps], ['new', 4, true, 10]);
check('caso vero: lei, primo hip thrust con manubrio', [fh.suggestedWeight, fh.message], [8, 'Trova il peso: prova 8 kg × 10']);
check('caso vero: lei, prima lat machine', fl.suggestedWeight, 10);

// ==================================================================
section('§10.2 "Trova il peso"');
// ==================================================================
const cal = (id, tests, level, extra = {}) => TA.nextCalibrationStep(id, { tests, testReps: 10, targetReps: 10, targetRir: 3, level, ...extra }, GYM);
// R3-17: per i principianti ×1,3 poi ×1,25 (×1,5 portava al cedimento); gli altri livelli ×1,5 poi ×1,3
check('C1 (principiante ×1,3)', cal('dumbbell-hip-thrust', [{ kg: 8, reps: 10, rir: 4 }], 'beginner'), { done: false, nextKg: 10, testReps: 10 });
check('C2 (principiante ×1,25)', cal('dumbbell-hip-thrust', [{ kg: 8, reps: 10, rir: 4 }, { kg: 10, reps: 10, rir: 4 }], 'beginner').nextKg, 12);
check('C1 intermedio ×1,5 poi ×1,3', [cal('dumbbell-hip-thrust', [{ kg: 16, reps: 10, rir: 4 }], 'intermediate').nextKg,
    cal('dumbbell-hip-thrust', [{ kg: 16, reps: 10, rir: 4 }, { kg: 24, reps: 10, rir: 4 }], 'intermediate').nextKg], [24, 32]);
const c3 = cal('dumbbell-hip-thrust', [{ kg: 8, reps: 10, rir: 4 }, { kg: 12, reps: 10, rir: 4 }, { kg: 16, reps: 10, rir: 3 }], 'beginner');
check('C3', [c3.done, c3.workingKg, c3.est], [true, 16, 23.5]);
check('C4', cal('dumbbell-hip-thrust', [{ kg: 8, reps: 10, rir: 4 }, { kg: 12, reps: 10, rir: 4 }, { kg: 16, reps: 10, rir: 4 }], 'beginner').workingKg, 18);
const c5 = cal('leg-press', [{ kg: 20, reps: 10, rir: 2 }], 'beginner');
check('C5', [c5.done, c5.workingKg, c5.est], [true, 20, 28.7]);
const c6 = cal('lat-pulldown', [{ kg: 25, reps: 7, rir: 0 }], 'beginner');
check('C6', [c6.done, c6.workingKg, c6.est], [true, 20, 31.7]);
const c7 = cal('bench-press', [{ kg: 40, reps: 10, rir: 1 }], 'intermediate', { targetRir: 2 });
check('C7', [c7.done, c7.workingKg, c7.est], [true, 37.5, 55.3]);
check('prova vicina al peso giusto = prima serie di lavoro', cal('leg-press', [{ kg: 20, reps: 10, rir: 2 }], 'beginner', { lo: 8 }).lastIsWorkSet, true);

// ==================================================================
section('R3 — difetti trovati dal revisore-allenatore (REVISIONE-R3.md)');
// ==================================================================
// R3-01: "Trova il peso" sulle trazioni ASSISTITE va al contrario (più facile = MENO assistenza) e non
// esce dalla scala della macchina (assistenza massima 70)
const calA = (tests, extra = {}) => TA.nextCalibrationStep('assisted-pull-up', { tests, testReps: 10, targetReps: 10, targetRir: 3, level: 'beginner', bodyweight: 60, gender: 'female', ...extra }, GYM);
check('R3-01 assistita "4+" → meno assistenza (45 → 40 → 35)', [calA([{ kg: 45, reps: 10, rir: 4 }]).nextKg, calA([{ kg: 45, reps: 10, rir: 4 }, { kg: 40, reps: 10, rir: 4 }]).nextKg], [40, 35]);
check('R3-01 assistita dura (5 rep a RIR 0) → più assistenza', calA([{ kg: 45, reps: 5, rir: 0 }]).workingKg, 50);
check('R3-01 mai oltre l\'assistenza massima (70)', [calA([{ kg: 70, reps: 2, rir: 0 }]).workingKg <= 70, TA.snapLoad('assisted-pull-up', 100, 'nearest', GYM), TA.stepLoad('assisted-pull-up', 70, 3, GYM)], [true, 70, 70]);
check('R3-01 assistenza già al minimo e "4+": si lavora lì', calA([{ kg: 5, reps: 10, rir: 4 }]), { done: true, workingKg: 5 });
// R3-17: principiante ×1,3 poi ×1,25 poi ×1,15 (non più ×1,5: arrivava al cedimento)
check('R3-17 tre prove "4+" della principiante: 8 → 10 → 12 → lavoro 14', [cal('dumbbell-hip-thrust', [{ kg: 8, reps: 10, rir: 4 }], 'beginner').nextKg,
    cal('dumbbell-hip-thrust', [{ kg: 8, reps: 10, rir: 4 }, { kg: 10, reps: 10, rir: 4 }], 'beginner').nextKg,
    cal('dumbbell-hip-thrust', [{ kg: 8, reps: 10, rir: 4 }, { kg: 10, reps: 10, rir: 4 }, { kg: 12, reps: 10, rir: 4 }], 'beginner').workingKg], [10, 12, 14]);
// R3-05: Trova il peso proposto a TUTTI i livelli sui multiarticolari mai fatti (con le rep della prova,
// R3-15); "4+" su tutte le serie ⇒ ricalibrare; alla rotazione il peso arriva dalla stessa famiglia
const LUIi = { ...PROF_FULL, gender: 'male', weight: 85, level: 'intermediate' };
const nNew = (id, range, level, extra = {}) => TA.computeNextTarget({ exerciseId: id, range, sessions: [], level, gym: GYM, profile: { ...LUIi, level }, now: NOW, nextTargetRir: 2, ...extra });
check('R3-05 intermedio, panca mai fatta: Trova il peso, rep della prova (10, non 8)', (() => { const r = nNew('bench-press', [8, 12], 'intermediate'); return [r.calibrate, r.testReps, r.suggestedReps]; })(), [true, 10, 10]);
check('R3-05 intermedio, isolamento mai fatto: stima senza prova', nNew('lateral-raise', [12, 15], 'intermediate').calibrate, false);
check('R3-05 "4+" su tutte le serie (RIR obiettivo 2) ⇒ ricalibrare', (() => { const r = next('bench-press', [8, 12], [sess([S(40, 10, 4), S(40, 10, 4), S(40, 9, 4)])], 'intermediate', 2); return [r.recalibrate, r.calibrate, r.testReps, /Trova il peso/.test(r.message)]; })(), [true, true, 10, true]);
check('R3-05 un solo "4+" non basta', next('bench-press', [8, 12], [sess([S(60, 10, 4), S(60, 10, 2), S(60, 9, 2)])], 'intermediate', 2).recalibrate, undefined);
check('R3-05 rotazione: panca 80 → manubri 32, RIR +1, niente prova', (() => { const r = nNew('dumbbell-bench-press', [8, 12], 'intermediate', { related: { exerciseId: 'bench-press', weight: 80 } }); return [r.status, r.suggestedWeight, r.convertedFrom, r.calibrate, r.targetRir]; })(), ['new', 32, 'bench-press', false, 3]);
check('R3-05 rotazione fra macchine diverse: niente conversione, Trova il peso', (() => { const r = nNew('hack-squat', [8, 12], 'intermediate', { related: { exerciseId: 'leg-press', weight: 150 } }); return [r.convertedFrom || null, r.calibrate]; })(), [null, true]);
// R3-07: manubri leggeri — tetto range + 2 rep; salto concesso al massimo del range con RIR ≥ obiettivo + 2
check('R3-07 laterali 2 kg, 15 rep facili (RIR 4, obiettivo 2) → 3 kg', R(next('lateral-raise', [12, 15], [sess([S(2, 15, 4), S(2, 15, 4), S(2, 15, 4)])], 'intermediate', 2)).slice(0, 2), ['increase_weight', 3]);
check('R3-07 laterali 2 kg, 15 rep a RIR 2 → +1 rep, mai oltre 17', [R(next('lateral-raise', [12, 15], [sess([S(2, 15, 2), S(2, 15, 2), S(2, 15, 1)])], 'intermediate', 2)),
    R(next('lateral-raise', [12, 15], [sess([S(2, 17, 1), S(2, 17, 1), S(2, 17, 1)])], 'intermediate', 2)).slice(0, 2)], [['increase_reps', 2, 16], ['increase_weight', 3]]);
check('R3-07 lento manubri 5 kg 8-12: al massimo 14 rep prima del salto', next('dumbbell-shoulder-press', [8, 12], [sess([S(5, 13, 1), S(5, 13, 1), S(5, 13, 1)])], 'intermediate', 2).suggestedReps <= 14, true);
check('R3-15 range esteso detto nel messaggio', /oltre 12/.test(next('dumbbell-shoulder-press', [8, 12], [sess([S(5, 12, 1), S(5, 12, 1), S(5, 12, 1)])], 'intermediate', 2).message), true);
// R3-11: fattori per famiglia; un fondamentale non si sostituisce con un accessorio
check('R3-11 squat 140 → front squat 110 (×0,8); piana 80 → inclinata manubri 28 (×0,415×0,9); stacco 180 → rumeno 135',
    [TA.convertLoad('squat', 'front-squat', 140).kg, TA.convertLoad('bench-press', 'dumbbell-incline-press', 80).kg, TA.convertLoad('deadlift', 'romanian-deadlift', 180).kg], [110, 28, 135]);
check('R3-11 stacco occupato: prima alternativa uno stacco, non l\'hyperextension', (() => {
    const a = TA.getAlternatives('deadlift', { level: 'advanced', equipment: PROF_FULL.equipment }, { reason: 'busy', limit: 3, kg: 180 });
    return [DB[a[0].exerciseId].pattern, DB[a[0].exerciseId].tier < 3, a.slice(0, 3).some(x => x.exerciseId === 'hyperextension')];
})(), ['hinge', true, false]);
// R3-12: scarico al gradino più vicino; se il gradino sotto toglie più del 10% si tiene il peso
const dl = (id, kg, range = [12, 15]) => next(id, range, [sess([S(kg, 12, 2)])], 'intermediate', 2, { phase: 'deload' }).suggestedWeight;
check('R3-12 scarico: laterali 2 → 2 (non 1), pushdown 10 → 10 (non 7,5), panca 60 → 55, pressa 100 → 90',
    [dl('lateral-raise', 2), dl('tricep-pushdown', 10), dl('bench-press', 60, [8, 12]), dl('leg-press', 100, [10, 15])], [2, 10, 55, 90]);
check('R3-12 scarico assistita: un po\' più di assistenza (40 → 45)', dl('assisted-pull-up', 40, [8, 12]), 45);

// ==================================================================
section('§11 Rampa di riscaldamento');
// ==================================================================
const ramp = (id, kg, reps, goal = 'hypertrophy') => TA.buildWarmupSets(id, kg, reps, goal, GYM).map(s => `${s.kg}×${s.reps}`);
check('W1', ramp('squat', 100, 8), ['20×10', '50×8', '70×5', '85×3']);
check('W2', ramp('bench-press', 60, 10), ['20×10', '30×8', '47.5×5']);
check('W3', ramp('bench-press', 30, 10), ['20×8', '25×5']);
check('W4', ramp('squat', 140, 3, 'strength'), ['20×10', '55×8', '85×5', '112.5×3', '125×1']);
check('W5', ramp('deadlift', 180, 5), ['20×10', '72.5×8', '107.5×5', '145×3', '162.5×1']);
check('W6', ramp('squat', 120, 10), ['20×10', '60×8', '85×5', '102.5×3']);
check('W7', ramp('leg-press', 40, 12, 'toning'), ['20×8', '32.5×5']);
check('W8', ramp('hip-thrust', 60, 10), ['20×10', '30×8', '47.5×5']);
check('W9', ramp('dumbbell-bench-press', 22, 10), ['10×8', '18×5']);
check('W10', ramp('lat-pulldown', 45, 10), ['20×8', '35×5']);
check('W11', ramp('goblet-squat', 8, 12), ['4×8', '6×5']);
check('W12', [ramp('push-up', 0, 12), ramp('plank', 0, 30), ramp('lateral-raise', 8, 12)], [[], [], []]);

// ==================================================================
section('§12.1 Mesociclo');
// ==================================================================
const cyc = (g, l) => TA.buildCycle(g, l).phases.map(p => `${p.week}:${p.phase[0] === 'd' ? 'deload' : p.phase[0]} ${p.rir.compound}/${p.rir.isolation}${p.setsDelta ? ' +' + p.setsDelta : ''}`).join(', ');
check('ipertrofia principiante', cyc('hypertrophy', 'beginner'), '1:a 3/3, 2:a 3/2, 3:a 2/2, 4:i 2/1, 5:i 2/1, 6:deload 4/4');
check('ipertrofia intermedio', cyc('hypertrophy', 'intermediate'), '1:a 3/2, 2:a 2/2, 3:a 2/1, 4:i 1/1, 5:i 1/0, 6:deload 4/4');
check('forza avanzato', cyc('strength', 'advanced'), '1:a 3/2, 2:a 2/1, 3:i 1/1 +1, 4:i 1/0 +1, 5:deload 4/4');
check('somma = durata, ultima = scarico, campi v1.26 presenti', ['strength', 'hypertrophy', 'recomp', 'endurance', 'toning'].every(g => ['beginner', 'intermediate', 'advanced', 'expert'].every(l => {
    const c = TA.buildCycle(g, l);
    const last = c.phases[c.phases.length - 1];
    return c.phases.length === c.duration && last.phase === 'deload' && last.loadFactor === 0.9 && last.volumeMultiplier === 0.5 &&
        c.phases.every(p => p.rirTarget && p.phaseName && typeof p.volumeMultiplier === 'number');
})), true);
check('rirTarget: min/max dai RIR (+1 se uguali)', TA.buildCycle('hypertrophy', 'beginner').phases[0].rirTarget, { min: 3, max: 4 });

// ==================================================================
section('§12.4 Scarico anticipato');
// ==================================================================
const DAY = 86400000;
const nowED = new Date('2026-10-16T18:00:00Z').getTime();
const wk = (daysAgo, exs) => ({ date: new Date(nowED - daysAgo * DAY).toISOString(), exercises: exs.map(([id, kg, reps, rir]) => ({ exerciseId: id, sets: [{ weight: kg, reps, rir, completed: true }] })) });
const progW = (week) => ({ metadata: { cycle: { currentWeek: week, duration: 6, phases: TA.buildCycle('hypertrophy', 'intermediate').phases } } });
const declining = [
    wk(1, [['bench-press', 60, 8, 1], ['squat', 100, 6, 1], ['lat-pulldown', 52.5, 9, 2]]),
    wk(5, [['bench-press', 60, 10, 1], ['squat', 100, 8, 1], ['lat-pulldown', 52.5, 10, 2]]),
    wk(9, [['bench-press', 60, 10, 2], ['squat', 100, 8, 2], ['lat-pulldown', 50, 10, 2]])
];
const ed = TA.detectEarlyDeload(declining, progW(3), new Date(nowED));
check('panca e squat in calo ≥5%', [ed.suggest, ed.declining], [true, ['bench-press', 'squat']]);
const onlyBench = [
    wk(1, [['bench-press', 60, 8, 1], ['squat', 100, 8, 1], ['lat-pulldown', 52.5, 10, 2]]),
    wk(5, [['bench-press', 60, 10, 1], ['squat', 100, 8, 1], ['lat-pulldown', 52.5, 10, 2]]),
    wk(9, [['bench-press', 60, 10, 2], ['squat', 100, 8, 2], ['lat-pulldown', 50, 10, 2]])
];
check('solo la panca in calo → no', TA.detectEarlyDeload(onlyBench, progW(3), new Date(nowED)).suggest, false);
check('settimana 1 → no', TA.detectEarlyDeload(declining, progW(1), new Date(nowED)).suggest, false);
check('prossima settimana di scarico → no', TA.detectEarlyDeload(declining, progW(5), new Date(nowED)).suggest, false);
check('dopo una pausa ≥10 giorni → no', TA.detectEarlyDeload(declining.map(w => ({ ...w, date: new Date(new Date(w.date).getTime() - 12 * DAY).toISOString() })), progW(3), new Date(nowED)).suggest, false);

// ==================================================================
section('§13 Durata e seduta corta');
// ==================================================================
const ex = (id, sets, reps, rest, role) => ({ exerciseId: id, name: DB[id].name, type: DB[id].type, sets, reps, rest, role });
const UPPER_A = { name: 'Upper A', type: 'Upper A', warmup: 'upper', exercises: [
    ex('bench-press', 4, '6-10', 150, 'main'), ex('barbell-row', 3, '8-12', 120, 'secondary'),
    ex('dumbbell-shoulder-press', 3, '8-12', 120, 'secondary'), ex('lat-pulldown', 3, '8-12', 120, 'secondary'),
    ex('cable-lateral-raise', 3, '10-15', 75, 'accessory'), ex('dumbbell-tricep-extension', 3, '10-15', 75, 'accessory'),
    ex('incline-curl', 2, '10-15', 75, 'accessory'), ex('pec-deck', 2, '10-15', 75, 'accessory')] };
const CTX = { goal: 'hypertrophy', warmupMin: 10 };
check('§13.1 Upper A = 79 minuti', TA.estimateWorkoutDuration(UPPER_A, CTX), 79);
const sum = (r) => r.day.exercises.map(e => `${e.exerciseId}×${e.sets}${e.supersetGroup ? '[' + e.supersetGroup + ']' : ''}`).join(' ');
const s1 = TA.compressDay(UPPER_A, 60, CTX);
check('S-1 → 60', [s1.estimatedMinutes, s1.fits, sum(s1)], [58, true, 'bench-press×4 barbell-row×3[A] dumbbell-shoulder-press×3[A] lat-pulldown×3 cable-lateral-raise×2[B] dumbbell-tricep-extension×2[B] incline-curl×2 pec-deck×2']);
const s2 = TA.compressDay(UPPER_A, 45, CTX);
check('S-2 → 45', [s2.estimatedMinutes, s2.fits, sum(s2)], [43, true, 'bench-press×4 barbell-row×2[A] dumbbell-shoulder-press×2[A] lat-pulldown×2 cable-lateral-raise×2[B] dumbbell-tricep-extension×2[B]']);
const s3 = TA.compressDay(UPPER_A, 35, CTX);
check('S-3 → 35', [s3.estimatedMinutes, s3.fits, sum(s3)], [34, true, 'bench-press×4 barbell-row×2[A] dumbbell-shoulder-press×2[A] lat-pulldown×2']);
const s4 = TA.compressDay(UPPER_A, 30, CTX);
check('S-4 → 30', [s4.estimatedMinutes, s4.fits, sum(s4)], [31, false, 'bench-press×3 barbell-row×2[A] dumbbell-shoulder-press×2[A] lat-pulldown×2']);
check('S-6 tempo sufficiente: giorno invariato', (() => { const r = TA.compressDay(UPPER_A, 90, CTX); return [r.changes.length, J(r.day.exercises) === J(UPPER_A.exercises)]; })(), [0, true]);
check('S: il giorno originale non cambia, mai un superset in testa', (() => {
    const before = J(UPPER_A);
    const outs = [60, 45, 35, 30, 25].map(m => TA.compressDay(UPPER_A, m, CTX).day);
    return J(UPPER_A) === before && outs.every(d => !d.exercises[0].supersetGroup && d.compressed === true);
})(), true);
// S-5: qualunque giorno di tonificazione → 35: gli accessori dei glutei sono gli ultimi tolti, main con ≥3 serie
const toning = TA.generateProgram({ level: 'beginner', gender: 'female', equipment: ['manubri', 'macchine', 'cavi', 'panca'] }, { goal: 'toning', daysPerWeek: 3, split: 'upper-lower', sessionDuration: 75 });
check('S-5 tonificazione → 35', toning.days.every(d => {
    const r = TA.compressDay(d, 35, { goal: 'toning', emphasis: 'lower' });
    const main = r.day.exercises.find(e => e.role === 'main');
    const removed = r.changes.filter(c => c.step === 'S7').map(c => c.removed);
    const gluteRemovedFirst = removed.findIndex(id => DB[id].primaryMuscles.includes('glutei'));
    const otherAfter = removed.slice(gluteRemovedFirst + 1).some(id => !DB[id].primaryMuscles.includes('glutei'));
    return main && main.sets >= Math.min(3, d.exercises[0].sets) && (gluteRemovedFirst < 0 || !otherAfter);
}), true);

// ==================================================================
section('§7.3 Alternative');
// ==================================================================
const LUI = { level: 'advanced', equipment: PROF_FULL.equipment };
const alt = (id, prof, opts) => TA.getAlternatives(id, prof, opts).map(a => `${a.exerciseId} ${a.score}`);
check('T7.1', alt('leg-press', LEI, { reason: 'busy', sessionExerciseIds: ['dumbbell-hip-thrust'] }), ['goblet-squat 79', 'hack-squat 79', 'smith-squat 76', 'bodyweight-squat 64', 'dumbbell-lunge 41']);
check('T7.2', alt('hip-abduction', LEI, { reason: 'busy' }), ['cable-kickback 71', 'glute-kickback-machine 68', 'fire-hydrant 58', 'donkey-kick 53', 'glute-bridge 34']);
const t73 = alt('lat-pulldown', LEI, { reason: 'busy' });
check('T7.3', [t73.slice(0, 4), t73.some(x => x.startsWith('lat-pulldown-close'))], [['assisted-pull-up 81', 'machine-row 44', 'dumbbell-row 41', 'seated-cable-row 39'], false]);
check('T7.4', alt('lat-pulldown', LEI, { reason: 'dislike' }).slice(0, 2), ['lat-pulldown-close 86', 'assisted-pull-up 81']);
check('T7.5', alt('bench-press', LUI, { reason: 'busy', sessionExerciseIds: ['barbell-row', 'dumbbell-shoulder-press'] }), ['chest-press-machine 89', 'dumbbell-bench-press 89', 'smith-bench-press 86', 'dumbbell-incline-press 84', 'incline-bench-press 84']);
const t76 = TA.getAlternatives('squat', LUI, { reason: 'pain', painArea: 'knee', limit: 50 });
check('T7.6', [t76.slice(0, 5).map(a => `${a.exerciseId} ${a.score}`), t76.some(a => ['jump-squat', 'pistol-squat'].includes(a.exerciseId))], [['front-squat 77', 'leg-press 73', 'goblet-squat 71', 'hack-squat 71', 'smith-squat 66'], false]);
const t77 = TA.getAlternatives('overhead-press', LUI, { reason: 'pain', painArea: 'shoulder', limit: 50 });
check('T7.7', [t77.slice(0, 2).map(a => `${a.exerciseId} ${a.score}`), t77.some(a => ['arnold-press', 'push-press', 'handstand-push-up'].includes(a.exerciseId))], [['dumbbell-shoulder-press 76', 'shoulder-press-machine 76'], false]);
check('T7.8', alt('leg-curl-seated', LEI, { reason: 'busy' }).slice(0, 2), ['leg-curl-lying 79', 'dumbbell-rdl 26']);
check('T7.9', alt('dumbbell-hip-thrust', LEI, { reason: 'busy', history: ['glute-bridge'] })[0], 'glute-bridge 92');
check('esclusi del profilo mai proposti', TA.getAlternatives('leg-press', { ...LEI, avoidExercises: ['goblet-squat'] }, { reason: 'busy', limit: 50 }).some(a => a.exerciseId === 'goblet-squat'), false);
check('T7.10', TA.convertLoad('bench-press', 'dumbbell-bench-press', 80), { kg: 32, confidence: 'media', mode: 'convert', rirAdjust: 1 });
check('T7.11', [TA.convertLoad('dumbbell-bench-press', 'bench-press', 30).kg, TA.convertLoad('dumbbell-bench-press', 'bench-press', 30).confidence], [70, 'media']);
check('T7.12', [TA.convertLoad('overhead-press', 'dumbbell-shoulder-press', 50).kg, TA.convertLoad('overhead-press', 'dumbbell-shoulder-press', 50).confidence], [22, 'media']);
check('T7.13', TA.convertLoad('leg-press', 'hack-squat', 100), { kg: null, confidence: 'bassa', mode: 'find' });
check('T7.14', TA.convertLoad('bench-press', 'squat', 80), { kg: null, confidence: 'none', mode: 'find' });
const withW = TA.getAlternatives('bench-press', LUI, { reason: 'busy', kg: 80 });
check('peso trasferito nelle alternative (manubri: per manubrio)', withW.find(a => a.exerciseId === 'dumbbell-bench-press').weight.kg, 32);
check('"Trova il peso" con seme', (() => { const w = withW.find(a => a.exerciseId === 'chest-press-machine').weight; return [w.mode, w.kg, w.seedKg > 0]; })(), ['find', null, true]);

// ==================================================================
section('§6.5 Esclusioni, preferenze, zone dolenti nel generatore');
// ==================================================================
const base = { level: 'intermediate', gender: 'male', equipment: PROF_FULL.equipment };
const gen = (prof, opt = {}) => TA.generateProgram(prof, { goal: 'hypertrophy', daysPerWeek: 4, split: 'upper-lower', sessionDuration: 60, ...opt });
const idsOf = (p) => p.days.flatMap(d => d.exercises.map(e => e.exerciseId));
const plain = gen(base);
const avoidOne = idsOf(plain)[0];
check('T6.3 esclusi mai in scheda (anche dopo 3 rotazioni)', (() => {
    let p = gen({ ...base, avoidExercises: [avoidOne, 'squat'] });
    const seen = new Set(idsOf(p));
    for (let i = 0; i < 3; i++) { p = TA.rotateProgram(p, { ...base, avoidExercises: [avoidOne, 'squat'] }).program; idsOf(p).forEach(x => seen.add(x)); }
    return [seen.has(avoidOne), seen.has('squat')];
})(), [false, false]);
check('T6.2 ginocchio dolente: niente joint.knee 2', idsOf(gen({ ...base, painAreas: ['knee'] }, { split: 'full-body', daysPerWeek: 3 })).filter(x => DB[x].joint.knee === 2), []);
check('spalla dolente: niente joint.shoulder 2', idsOf(gen({ ...base, painAreas: ['shoulder'] })).filter(x => DB[x].joint.shoulder === 2), []);
check('T6.4 preferito sempre presente per 4 cicli', (() => {
    const prof = { ...base, preferExercises: ['leg-press'] };
    let p = gen(prof);
    const ok = [idsOf(p).includes('leg-press')];
    for (let i = 0; i < 3; i++) { p = TA.rotateProgram(p, prof).program; ok.push(idsOf(p).includes('leg-press')); }
    return ok;
})(), [true, true, true, true]);
check('enfasi upper: più serie alla parte alta', (() => {
    const v = (p, ms) => p.days.reduce((a, d) => a + d.exercises.reduce((b, e) => b + (ms.includes(DB[e.exerciseId].primaryMuscles[0]) ? e.sets : 0), 0), 0);
    const up = ['petto', 'schiena', 'spalle'], lo = ['quadricipiti', 'femorali', 'glutei'];
    const e = gen({ ...base, emphasis: 'upper' }, { sessionDuration: 75 }), n = gen(base, { sessionDuration: 75 });
    return v(e, up) - v(e, lo) > v(n, up) - v(n, lo);
})(), true);

// ==================================================================
section('Riscaldamento e defaticamento proporzionali');
// ==================================================================
const W = C.WU;
check('tetti 45/60/75/90', [45, 60, 75, 90].map(m => [W.getWarmupBudgetMin(m), W.getCooldownBudgetMin(m)]), [[6, 3], [7, 4], [8, 5], [10, 5]]);
check('routine ridotte entro il tetto', [45, 60, 75, 90].every(m => Object.keys(W.WARMUPS_DB).every(k =>
    W.getWarmupForDuration(k, m).durationMin <= W.getWarmupBudgetMin(m) && W.getCooldownForDuration(k, m).durationMin <= W.getCooldownBudgetMin(m))), true);
check('giorni generati con warmupMin/cooldownMin veri', gen(base, { sessionDuration: 45 }).days.every(d => d.warmupMin <= 6 && d.cooldownMin <= 3 && d.goal === 'hypertrophy'), true);
check('esercizi generati con role/pattern/metric', plain.days.every(d => d.exercises[0].role === 'main' && d.exercises.every(e => e.pattern && e.metric)), true);

// ==================================================================
section('§16.2 Cardio');
// ==================================================================
const t3 = TA.generateProgram({ level: 'beginner', gender: 'female', equipment: LEI.equipment }, { goal: 'toning', daysPerWeek: 3, split: 'upper-lower', sessionDuration: 60 });
const ul4 = TA.generateProgram({ level: 'advanced', gender: 'male', equipment: PROF_FULL.equipment }, { goal: 'recomp', daysPerWeek: 4, split: 'upper-lower', sessionDuration: 60 });
const cTon = TA.generateConditioningSuggestions('toning', t3, { level: 'beginner' });
const liss = (s) => s.weekly.find(x => x.type === 'liss'), hiit = (s) => s.weekly.find(x => x.type === 'hiit');
check('toning principiante: LISS 2×30, niente HIIT, regole 2-5', [liss(cTon).sessions, liss(cTon).minutes, !hiit(cTon), cTon.rules],
    [2, 30, true, ['AFTER_LIFTING_OR_3H', 'HIIT_MAX_2', 'LOW_IMPACT_FIRST', 'STEPS']]);
const cRec = TA.generateConditioningSuggestions('recomp', ul4, { level: 'advanced' });
check('recomp avanzato: LISS 2×30, HIIT 1, regola 1', [liss(cRec).sessions, liss(cRec).minutes, hiit(cRec).sessions, cRec.rules.includes('HIIT_NOT_BEFORE_LEGS')], [2, 30, 1, true]);
check('forza: niente HIIT', !hiit(TA.generateConditioningSuggestions('strength', ul4, { level: 'advanced' })), true);
check('obiettivo sconosciuto: come ipertrofia, nessuna eccezione', (() => { const s = TA.generateConditioningSuggestions('boh', null, null); return J(s.weekly) === J(TA.generateConditioningSuggestions('hypertrophy', null, null).weekly); })(), true);
check('compatibilità v1.26 (enabled, frequency, legDays)', [cTon.enabled, cTon.frequency >= 1, Array.isArray(cTon.legDays)], [true, true, true]);

// ==================================================================
section('Simulazione: 6 settimane con lo Storage vero (utils → exercises → warmups → storage → algorithm)');
// ==================================================================
// Due persone simulate con una forza "vera" che cresce ogni settimana (principiante +3%, intermedia
// +1,5% sui multiarticolari). A ogni seduta: giorno dalla scheda (getNextDayIndex), fase del ciclo
// (applyPhaseToDay), peso precompilato = suggestedWeight (o "Trova il peso" per la principiante),
// serie fino al RIR target (con la sottostima tipica nel RIR registrato), Storage.saveWorkout vero,
// settimana del ciclo dal calendario, chiusura del ciclo con rotazione alla fine.
function simEnv(startMs) {
    const store = new Map();
    const c = {
        console: { log() {}, warn() {}, error() {}, info() {} },
        localStorage: {
            getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => { store.set(k, String(v)); },
            removeItem: k => { store.delete(k); }, key: i => [...store.keys()][i] ?? null, get length() { return store.size; }
        },
        navigator: {}, document: { addEventListener() {}, visibilityState: 'visible' }
    };
    c.window = c;
    vm.createContext(c);
    vm.runInContext(`const __RD = Date; let __now = ${startMs};
        class __FD extends __RD { constructor(...a) { if (a.length === 0) super(__now); else super(...a); } static now() { return __now; } }
        globalThis.Date = __FD; globalThis.__setNow = (t) => { __now = t; };`, c);
    ['modules/utils.js', 'data/exercises.js', 'data/warmups.js', 'modules/storage.js', 'modules/algorithm.js'].forEach(f =>
        vm.runInContext(read(f), c, { filename: f }));
    vm.runInContext('this.S = Storage; this.TA = TrainingAlgorithm; this.DB = EXERCISES_DB;', c);
    return c;
}

function simulate(person) {
    const DAYMS = 86400000;
    const monday = new Date(2026, 9, 19, 0, 0).getTime();   // lunedì 19/10/2026
    const env = simEnv(monday);
    const { S, TA: T, DB: D } = env;
    S.saveProfile(person.profile);
    const prog = T.generateProgram(S.getProfile(), person.options);
    prog.metadata.cycle.startDate = new Date(monday).toISOString();
    S.setActiveProgram(prog);
    let seed = person.seed;
    const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
    const true1RM = {};       // forza vera per esercizio (kg) o capacità (rep/secondi a corpo libero)
    const strength = (id, kg) => {
        if (!true1RM[id]) {
            const m = T.getExerciseMeta(id);
            if (['bodyweight', 'bodyweight-loadable'].includes(m.loadType) || m.metric === 'time') true1RM[id] = { cap: m.metric === 'time' ? person.timeCap : person.bwCap };
            else if (m.loadType === 'assisted') true1RM[id] = { assistNeed: T.estimateStartingLoad(id, S.getProfile()).kg * 0.8 };
            else true1RM[id] = { orm: Math.max(4, T.estimateStartingLoad(id, S.getProfile()).rawKg) * person.trueOver };
        }
        return true1RM[id];
    };
    const repsAt = (id, kg, setIdx) => {
        const st = strength(id, kg);
        if (st.cap) return Math.max(1, Math.floor(st.cap - setIdx * 1.5));
        if (st.assistNeed) return Math.max(1, Math.floor(10 + (kg - st.assistNeed) / 2.5 - setIdx));
        return Math.max(0, Math.floor(30 * (st.orm / Math.max(1, kg) - 1)) - setIdx);
    };
    const log = {};
    const issues = [];
    const sessionsPerWeek = person.options.daysPerWeek;
    const offsets = sessionsPerWeek === 4 ? [0, 1, 3, 4] : [0, 2, 4];
    let completed = null;
    for (let week = 0; week < 6; week++) {
        // crescita settimanale della forza vera
        Object.values(true1RM).forEach(t => {
            if (t.orm) t.orm *= 1 + person.growth * (0.7 + 0.6 * rnd());
            if (t.cap) t.cap += person.growth * 25;
            if (t.assistNeed) t.assistNeed = Math.max(0, t.assistNeed - 1);
        });
        for (const off of offsets) {
            const t = monday + (week * 7 + off) * DAYMS + 18 * 3600000;
            env.__setNow(t);
            S.syncCycleWeek();
            const program = S.getActiveProgram();
            const dayIndex = T.getNextDayIndex(program, S.getWorkouts());
            const phase = S.getCurrentPhase();
            const day = T.applyPhaseToDay(program.days[dayIndex], phase, { painAreas: S.getProfile().painAreas });
            const exercises = day.exercises.map(ex => {
                const sug = S.getProgressionSuggestion(ex.exerciseId, ex.reps, program.metadata.goal);
                const [lo, hi] = T._parseRange(ex.reps);
                const tRir = Number.isFinite(sug.targetRir) ? sug.targetRir : 2;
                let kg = sug.suggestedWeight;
                const sets = [];
                if (!(Number.isFinite(kg) && kg >= 0)) issues.push(`${ex.exerciseId}: peso non valido ${kg}`);
                // "Trova il peso" per la principiante (al massimo 3 prove con RIR)
                if (sug.status === 'new' && sug.calibrate) {
                    const tests = [];
                    let st = S.nextCalibrationStep(ex.exerciseId, { tests, testReps: sug.testReps, targetReps: sug.testReps, targetRir: tRir, lo });
                    while (!st.done) {
                        const reps = Math.min(sug.testReps, repsAt(ex.exerciseId, st.nextKg, 0));
                        const rir = Math.min(4, Math.max(0, repsAt(ex.exerciseId, st.nextKg, 0) - reps - 1));
                        tests.push({ kg: st.nextKg, reps, rir });
                        sets.push({ weight: st.nextKg, reps, rir, completed: true, isCalibration: true });
                        st = S.nextCalibrationStep(ex.exerciseId, { tests, testReps: sug.testReps, targetReps: sug.testReps, targetRir: tRir, lo });
                    }
                    kg = st.workingKg;
                }
                for (let i = 0; i < ex.sets; i++) {
                    const cap = repsAt(ex.exerciseId, kg, i);
                    // punta alle rep suggerite e, se è facile, ne fa qualcuna in più fino al RIR target
                    const reps = Math.max(1, Math.min(cap - tRir, Math.max(hi, Number(sug.suggestedReps) || 0) + 2));
                    const trueRir = Math.max(0, cap - reps);
                    const rir = Math.min(4, Math.max(0, Math.round(trueRir - person.rirBias)));
                    sets.push({ weight: kg, reps, rir, completed: true });
                }
                (log[ex.exerciseId] = log[ex.exerciseId] || []).push({ w: week + 1, kg, status: sug.status, reps: sets.filter(s => !s.isCalibration).map(s => s.reps).join('/'), phase: phase && phase.phase });
                return { exerciseId: ex.exerciseId, name: ex.name, targetReps: ex.reps, targetRir: tRir, role: ex.role, sets };
            });
            S.saveWorkout({ name: day.type, type: day.type, dayIndex, exercises, duration: 3600 });
        }
    }
    // fine ciclo: lunedì della settimana 7
    env.__setNow(monday + 42 * DAYMS + 9 * 3600000);
    S.syncCycleWeek();
    if (S.shouldCompleteCycle()) completed = S.completeCycle();
    return { log, issues, completed, S, T, D };
}

const SIM = [
    { name: 'Lui · intermedio · ipertrofia U/L 4gg', seed: 7, growth: 0.015, trueOver: 1.9, rirBias: 0.5, bwCap: 14, timeCap: 50,
        profile: { name: 'Lui', gender: 'male', weight: 80, level: 'intermediate', goal: 'hypertrophy', equipment: ['bilanciere', 'manubri', 'macchine', 'cavi', 'panca', 'sbarra'] },
        options: { goal: 'hypertrophy', daysPerWeek: 4, split: 'upper-lower', sessionDuration: 60 } },
    { name: 'Lei · principiante · tonificazione U/L 3gg', seed: 11, growth: 0.03, trueOver: 2.2, rirBias: 1, bwCap: 12, timeCap: 30,
        profile: { name: 'Lei', gender: 'female', weight: 62, level: 'beginner', goal: 'toning', equipment: ['manubri', 'macchine', 'cavi', 'panca'] },
        options: { goal: 'toning', daysPerWeek: 3, split: 'upper-lower', sessionDuration: 60 } }
];
const simOut = [];
SIM.forEach(person => {
    const r = simulate(person);
    const tracked = Object.keys(r.log).filter(id => r.log[id].length >= 5)
        .sort((a, b) => (r.D[a].type === 'compound' ? 0 : 1) - (r.D[b].type === 'compound' ? 0 : 1) || r.log[b].length - r.log[a].length)
        .slice(0, 3).concat(Object.keys(r.log).filter(id => r.log[id].length >= 5 && r.D[id].type === 'isolation' && r.D[id].loadType !== 'bodyweight').slice(0, 1));
    simOut.push(`\n${person.name}`);
    [...new Set(tracked)].forEach(id => {
        simOut.push(`  ${id.padEnd(24)} ` + r.log[id].map(e => `s${e.w}${e.phase === 'deload' ? 'D' : ''} ${e.kg}×${e.reps}`).join(' · '));
    });
    const all = Object.entries(r.log).flatMap(([id, l]) => l.map(e => ({ id, ...e })));
    check(`${person.name}: pesi sempre numeri ≥ 0`, all.filter(e => !Number.isFinite(e.kg) || e.kg < 0).length + r.issues.length, 0);
    const jumps = [];
    Object.entries(r.log).forEach(([id, l]) => l.forEach((e, i) => {
        if (!i || l[i - 1].status === 'new' || !(l[i - 1].kg > 0)) return;
        const up = (e.kg - l[i - 1].kg) / l[i - 1].kg;
        // salto assurdo: oltre +25% fra due sedute (i manubri leggeri salgono di un gradino: 4 → 5 = +25%)
        const oneRung = r.T.stepLoad(id, l[i - 1].kg, 1, r.S.getGymConfig(), []) >= e.kg;
        if (up > 0.25 && !oneRung) jumps.push(`${id} ${l[i - 1].kg}→${e.kg}`);
        const oneRungDown = r.T.stepLoad(id, l[i - 1].kg, -1, r.S.getGymConfig(), []) <= e.kg;
        if (up < -0.2 && !oneRungDown && e.phase !== 'deload' && l[i - 1].phase !== 'deload') jumps.push(`${id} ${l[i - 1].kg}→${e.kg}`);
    }));
    check(`${person.name}: nessun salto assurdo fra due sedute`, jumps, []);
    const grew = tracked.filter(id => r.D[id].loadType !== 'bodyweight').filter(id => {
        const l = r.log[id].filter(e => e.phase !== 'deload' && e.status !== 'new');
        return l.length >= 2 && l[l.length - 1].kg > l[0].kg;
    });
    check(`${person.name}: i carichi salgono nelle 5 settimane di lavoro`, grew.length >= 2, true);
    check(`${person.name}: settimana 6 di scarico (−10%) e ciclo chiuso con rotazione`, [all.some(e => e.phase === 'deload' && e.status === 'deload'), !!(r.completed && r.completed.completedCycle), r.S.getCycleInfo().cycleNumber], [true, true, 2]);
});
if (VERBOSE || process.argv.includes('--sim')) console.log(simOut.join('\n') + '\n');

// R3-13: settimana 5 saltata (principiante, ciclo di 6) → la 6 NON è già scarico: si rifà la 5
(() => {
    const DAYMS = 86400000;
    const monday = new Date(2026, 9, 19, 0, 0).getTime();
    const env = simEnv(monday);
    const { S, TA: T } = env;
    S.saveProfile({ name: 'Lei', gender: 'female', weight: 60, level: 'beginner', equipment: ['manubri', 'macchine'] });
    const prog = T.generateProgram(S.getProfile(), { goal: 'toning', daysPerWeek: 3, split: 'upper-lower', sessionDuration: 45 });
    prog.metadata.cycle.startDate = new Date(monday).toISOString();
    S.setActiveProgram(prog);
    const phases = [];
    for (let week = 0; week < 8; week++) {
        for (const off of [0, 2, 4]) {
            env.__setNow(monday + (week * 7 + off) * DAYMS + 18 * 3600000);
            S.syncCycleWeek();
            if (week === 4) continue;   // settimana 5 saltata
            phases.push(`${week + 1}:${S.getCycleInfo().currentWeek}${S.getCurrentPhase().phase === 'deload' ? 'D' : ''}`);
            S.saveWorkout({ name: 'x', type: prog.days[0].type, dayIndex: 0, exercises: [] });
        }
    }
    const byWeek = (w) => phases.filter(p => p.startsWith(w + ':'))[0];
    check('R3-13 settimana saltata ripetuta: sett. 6 del calendario = settimana 5 del ciclo, lo scarico arriva dopo', [byWeek(6), byWeek(7)], ['6:5', '7:6D']);
})();

// ------------------------------------------------------------------
console.log(`GymTracker — progressione v2: ${passed}/${passed + failures.length} verifiche superate`);
if (failures.length) {
    failures.forEach(f => console.log('  ✗ ' + f));
    process.exit(1);
}
console.log('OK');
