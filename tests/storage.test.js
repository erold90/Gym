/**
 * GymTracker Pro — test di utils.js, storage.js e timer.js (Node puro, nessuna dipendenza).
 *
 *   node tests/storage.test.js
 *
 * Carica i file veri dell'app in un `vm` con localStorage, Date, setInterval, navigator,
 * document, AudioContext e Notification finti. Gira con TZ=Europe/Rome (si rilancia da solo)
 * per provare il cambio d'ora. Esce con codice ≠ 0 se un test fallisce.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const cp = require('child_process');

if (process.env.TZ !== 'Europe/Rome') {
    const r = cp.spawnSync(process.execPath, [__filename, ...process.argv.slice(2)], {
        stdio: 'inherit', env: { ...process.env, TZ: 'Europe/Rome' }
    });
    process.exit(r.status === null ? 1 : r.status);
}

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

// ============================================================
// Mini framework
// ============================================================
const results = [];
const tests = [];
function test(name, fn) { tests.push({ name, fn }); }
class AssertError extends Error {}
function ok(cond, msg) { if (!cond) throw new AssertError(msg || 'condizione falsa'); }
function eq(a, b, msg) {
    const ja = JSON.stringify(a), jb = JSON.stringify(b);
    if (ja !== jb) throw new AssertError(`${msg || 'diversi'}: atteso ${jb}, trovato ${ja}`);
}
function near(a, b, eps, msg) { if (!(Math.abs(a - b) <= eps)) throw new AssertError(`${msg || 'non vicini'}: atteso ${b}±${eps}, trovato ${a}`); }
function throwsCode(fn, code, msg) {
    try { fn(); } catch (e) { if (e && e.code === code) return e; throw new AssertError(`${msg || 'errore sbagliato'}: ${e && e.code} ${e && e.message}`); }
    throw new AssertError(`${msg || 'doveva lanciare'} (${code})`);
}
const flush = () => new Promise(r => setImmediate(r));

// ============================================================
// Ambiente finto
// ============================================================
const FAKE_RUNTIME = `
const __RealDate = Date;
let __now = 0;
class __FakeDate extends __RealDate {
    constructor(...a) { if (a.length === 0) super(__now); else super(...a); }
    static now() { return __now; }
}
globalThis.Date = __FakeDate;
const __timers = new Map();
let __tid = 0;
globalThis.setInterval = (fn, ms) => { const id = ++__tid; const p = Math.max(1, ms | 0); __timers.set(id, { fn, ms: p, next: __now + p, repeat: true }); return id; };
globalThis.clearInterval = id => { __timers.delete(id); };
globalThis.setTimeout = (fn, ms) => { const id = ++__tid; __timers.set(id, { fn, ms: ms | 0, next: __now + (ms | 0), repeat: false }); return id; };
globalThis.clearTimeout = id => { __timers.delete(id); };
globalThis.__clock = {
    set(ms) { __now = +ms; },
    get() { return __now; },
    // frozen: l'orologio avanza ma i timer JS restano fermi (app in background su iOS)
    advance(ms, frozen) {
        const target = __now + ms;
        if (frozen) { __now = target; return; }
        for (;;) {
            let best = null;
            for (const [id, t] of __timers) if (t.next <= target && (!best || t.next < best[1].next)) best = [id, t];
            if (!best) break;
            const [id, t] = best;
            if (t.next > __now) __now = t.next;
            if (t.repeat) { t.next += t.ms; if (t.next <= __now) t.next = __now + t.ms; }
            else __timers.delete(id);
            t.fn();
        }
        __now = target;
    },
    pending() { return __timers.size; }
};
`;

function makeLocalStorage(seed) {
    const m = new Map();
    Object.keys(seed || {}).forEach(k => m.set(k, typeof seed[k] === 'string' ? seed[k] : JSON.stringify(seed[k])));
    let failOn = null;
    return {
        getItem: k => (m.has(k) ? m.get(k) : null),
        setItem: (k, v) => {
            v = String(v);
            if (failOn && failOn(k, v)) { const e = new Error('The quota has been exceeded.'); e.name = 'QuotaExceededError'; e.code = 22; throw e; }
            m.set(k, v);
        },
        removeItem: k => { m.delete(k); },
        key: i => [...m.keys()][i] ?? null,
        get length() { return m.size; },
        clear: () => m.clear(),
        _map: m,
        _failOn(fn) { failOn = fn; },
        _snapshot() { return JSON.stringify([...m.entries()].sort()); }
    };
}

function makeBrowserFakes(o = {}) {
    const calls = { vibrate: [], notif: [], reqPerm: 0, tones: [], audio: 0, audioPlay: 0, wake: 0, release: 0, swNotif: [] };
    const listeners = {};
    const document = {
        visibilityState: 'visible',
        addEventListener(e, f) { (listeners[e] || (listeners[e] = [])).push(f); },
        _dispatch(e) { (listeners[e] || []).forEach(f => f()); }
    };
    const navigator = {
        audioSession: { type: 'auto' },
        storage: { persist: () => Promise.resolve(true), persisted: () => Promise.resolve(false) },
        wakeLock: {
            request() {
                calls.wake++;
                const l = {
                    ls: {},
                    addEventListener(e, f) { (this.ls[e] || (this.ls[e] = [])).push(f); },
                    release() { calls.release++; (this.ls.release || []).forEach(f => f()); return Promise.resolve(); }
                };
                calls.lastLock = l;
                return Promise.resolve(l);
            }
        }
    };
    if (o.vibrate !== false) navigator.vibrate = p => { calls.vibrate.push(p); return true; };
    class Notification {
        constructor(t, opts) { calls.notif.push([t, opts]); }
        static requestPermission(cb) { calls.reqPerm++; Notification.permission = 'granted'; if (cb) cb('granted'); return Promise.resolve('granted'); }
    }
    Notification.permission = o.permission || 'default';
    class AudioContext {
        constructor() { this.currentTime = 0; this.state = 'running'; this.destination = {}; }
        createOscillator() {
            const osc = { frequency: { value: 0 }, type: '', connect() {}, disconnect() {}, onended: null,
                start(t) { osc.at = t; calls.tones.push(osc); },
                stop(t) { if (t === undefined) osc.cancelled = true; } };
            return osc;
        }
        createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }; }
        resume() { return Promise.resolve(); }
    }
    class Audio {
        constructor(src) { calls.audio++; this.src = src; }
        play() { calls.audioPlay++; return Promise.resolve(); }
        pause() {}
        setAttribute() {}
    }
    return { calls, document, navigator, Notification, AudioContext, Audio };
}

const quietConsole = { log() {}, warn() {}, error() {}, info() {} };

/**
 * Nuovo ambiente: localStorage con `seed` (come i dati lasciati dalla v1.25), orologio a `now`,
 * poi carica utils → exercises → [algoritmo] → storage → timer come nel browser.
 */
function makeEnv(opts = {}) {
    const { now = new Date(2026, 9, 15, 10, 0).getTime(), seed = {}, algorithm = 'fake', browser = {}, skipUtils = false } = opts;
    const ls = makeLocalStorage(seed);
    const b = makeBrowserFakes(browser);
    const ctx = {
        console: quietConsole,
        localStorage: ls,
        navigator: b.navigator,
        document: b.document,
        Notification: b.Notification,
        AudioContext: b.AudioContext,
        Audio: b.Audio,
        URL: { createObjectURL: () => 'blob:silenzio' },
        Blob: class {},
        ArrayBuffer, DataView
    };
    ctx.window = ctx;
    vm.createContext(ctx);
    vm.runInContext(FAKE_RUNTIME, ctx, { filename: 'fake-runtime.js' });
    ctx.__clock.set(now);
    if (!skipUtils) vm.runInContext(read('js/modules/utils.js'), ctx, { filename: 'utils.js' });
    vm.runInContext(read('js/data/exercises.js'), ctx, { filename: 'exercises.js' });
    // 'fake' = algoritmo VERO (le funzioni pure della progressione v2 servono allo Storage) con
    // rotateProgram finta e pilotabile; 'stub' = solo la rotateProgram finta (Storage usa i ripieghi v1.26)
    if (algorithm === 'fake' || algorithm === 'stub') {
        if (algorithm === 'fake') {
            try { vm.runInContext(read('js/data/warmups.js'), ctx, { filename: 'warmups.js' }); } catch (e) { /* facoltativo */ }
            vm.runInContext(read('js/modules/algorithm.js'), ctx, { filename: 'algorithm.js' });
        }
        vm.runInContext(`globalThis.__fakeRotation = {
            mode: 'throw', calls: 0,
            rotateProgram(program, profile) {
                this.calls++;
                if (this.mode === 'throw') throw new Error('rotazione rotta');
                if (this.mode === 'old') { const p = JSON.parse(JSON.stringify(program)); p.days[0].exercises[0].exerciseId = 'dumbbell-bench-press'; p.metadata.cycleNumber = 99; return p; }
                if (this.mode === 'empty') return { program: { name: 'vuota', days: [], metadata: {} }, added: [], removed: [] };
                const p = JSON.parse(JSON.stringify(program));
                p.days[1].exercises[0].exerciseId = 'goblet-squat';
                p.metadata.programId = 777;
                return { program: p, added: ['goblet-squat'], removed: [{ id: 'squat' }] };
            }
        };
        if (typeof TrainingAlgorithm !== 'undefined') Object.assign(TrainingAlgorithm, globalThis.__fakeRotation);
        else globalThis.TrainingAlgorithm = globalThis.__fakeRotation;`, ctx);
    } else if (algorithm === 'real') {
        try { vm.runInContext(read('js/data/warmups.js'), ctx, { filename: 'warmups.js' }); } catch (e) { /* facoltativo */ }
        vm.runInContext(read('js/modules/algorithm.js'), ctx, { filename: 'algorithm.js' });
    }
    vm.runInContext(read('js/modules/storage.js'), ctx, { filename: 'storage.js' });
    vm.runInContext(read('js/modules/timer.js'), ctx, { filename: 'timer.js' });
    const run = code => vm.runInContext(code, ctx);
    return {
        ctx, ls, calls: b.calls, document: b.document, navigator: b.navigator, Notification: b.Notification, run,
        S: run('Storage'), T: run('Timer'), GT: run('GT'), TA: run('typeof TrainingAlgorithm !== "undefined" ? TrainingAlgorithm : null'),
        clock: ctx.__clock,
        get(key) { const v = ls.getItem(key); return v === null ? null : JSON.parse(v); }
    };
}

// ============================================================
// Dati come li lascia la v1.25
// ============================================================
const D = (y, m, d, h = 10, mi = 0) => new Date(y, m - 1, d, h, mi).getTime();
const DAY = 86400000;

function workout(dateMs, exercises, extra = {}) {
    let vol = 0, n = 0;
    const ex = exercises.map(([id, sets]) => ({
        exerciseId: id, name: id,
        sets: sets.map(([w, r, more]) => {
            const s = { weight: String(w), reps: String(r), completed: true, autoFilled: true, ...(more || {}) };
            if (s.completed && w && r) { vol += w * r; n++; }
            return s;
        })
    }));
    return { name: 'Allenamento', type: 'Upper A', exercises: ex, duration: 3600, totalVolume: Math.round(vol), totalSets: n, id: dateMs, date: new Date(dateMs).toISOString(), ...extra };
}

function phases(duration) {
    const out = [];
    for (let w = 1; w <= duration; w++) {
        const phase = w === duration ? 'deload' : (w > duration - 2 ? 'intensification' : 'accumulation');
        out.push({ week: w, phase, phaseName: { accumulation: 'Accumulo', intensification: 'Intensificazione', deload: 'Deload' }[phase],
            rirTarget: phase === 'deload' ? { min: 4, max: 5 } : { min: 1, max: 3 }, volumeMultiplier: phase === 'deload' ? 0.5 : (phase === 'intensification' ? 0.9 : 1) });
    }
    return out;
}

function program({ start, week = 1, duration = 4, daysPerWeek = 4, deload = false, cycleNumber } = {}) {
    const p = {
        name: 'Upper/Lower 4 giorni',
        days: [
            { name: 'Upper A', type: 'Upper A', focus: 'Upper', warmup: 'upper', exercises: [{ exerciseId: 'bench-press', name: 'Panca', sets: 3, reps: '8-12', rest: 120, type: 'compound' }] },
            { name: 'Lower A', type: 'Lower A', focus: 'Lower', warmup: 'lower', exercises: [{ exerciseId: 'squat', name: 'Squat', sets: 3, reps: '8-12', rest: 150, type: 'compound' }] },
            { name: 'Upper B', type: 'Upper B', focus: 'Upper', warmup: 'upper', exercises: [{ exerciseId: 'barbell-row', name: 'Rematore', sets: 3, reps: '8-12', rest: 120, type: 'compound' }] },
            { name: 'Lower B', type: 'Lower B', focus: 'Lower', warmup: 'lower', exercises: [{ exerciseId: 'romanian-deadlift', name: 'Stacco rumeno', sets: 3, reps: '8-12', rest: 150, type: 'compound' }] }
        ].slice(0, Math.max(1, Math.min(4, daysPerWeek))),
        metadata: {
            goal: 'hypertrophy', split: 'upper-lower', daysPerWeek, sessionDuration: 60, level: 'intermediate',
            createdFor: 'x', tempo: '3-1-1-0',
            cycle: { duration, currentWeek: week, startDate: new Date(start).toISOString(), phases: phases(duration), isDeloadActive: deload }
        }
    };
    while (p.days.length < daysPerWeek) p.days.push(JSON.parse(JSON.stringify(p.days[p.days.length % 4])));
    if (cycleNumber) p.metadata.cycleNumber = cycleNumber;
    return p;
}

// ============================================================
// 1. Date: lunedì, domenica, cambio d'ora
// ============================================================
test('GT.startOfWeek: la domenica appartiene al lunedì PRECEDENTE', () => {
    const { GT } = makeEnv();
    const sun = GT.startOfWeek(new Date(2026, 9, 18, 15, 0));          // domenica 18/10/2026
    eq([sun.getFullYear(), sun.getMonth(), sun.getDate(), sun.getHours(), sun.getDay()], [2026, 9, 12, 0, 1], 'domenica');
    const mon = GT.startOfWeek(new Date(2026, 9, 12, 0, 0));
    eq(mon.getDate(), 12, 'lunedì resta lunedì');
    const sat = GT.startOfWeek(new Date(2026, 9, 17, 23, 59));
    eq(sat.getDate(), 12, 'sabato');
});

test('GT.startOfWeek e calendarDaysBetween col cambio d\'ora (Europa/Roma)', () => {
    const { GT } = makeEnv();
    // Fine ora legale: domenica 25/10/2026 03:00 → 02:00
    const a = GT.startOfWeek(new Date(2026, 9, 25, 12, 0));
    eq([a.getMonth(), a.getDate(), a.getHours()], [9, 19, 0], 'domenica del cambio → lunedì 19 alle 00:00');
    const b = GT.startOfWeek(new Date(2026, 9, 26, 0, 30));
    eq([b.getDate(), b.getHours()], [26, 0], 'lunedì dopo il cambio');
    eq(GT.calendarDaysBetween(new Date(2026, 9, 24, 23, 0), new Date(2026, 9, 26, 1, 0)), 2, '24→26 ottobre (51 ore) = 2 giorni');
    eq(GT.calendarDaysBetween(new Date(2026, 9, 25, 0, 30), new Date(2026, 9, 25, 23, 30)), 0, 'stesso giorno di 25 ore');
    // Inizio ora legale: domenica 29/03/2026
    const c = GT.startOfWeek(new Date(2026, 2, 29, 12, 0));
    eq([c.getMonth(), c.getDate(), c.getHours()], [2, 23, 0], 'domenica 29 marzo → lunedì 23');
    eq(GT.calendarDaysBetween(new Date(2026, 2, 28, 23, 30), new Date(2026, 2, 30, 0, 30)), 2, '28→30 marzo (24 ore) = 2 giorni');
    const plus7 = GT.addDays(GT.startOfWeek(new Date(2026, 9, 21)), 7);
    eq([plus7.getDate(), plus7.getHours()], [26, 0], 'lunedì + 7 giorni attraverso il cambio');
});

test('GT: formatRelativeDay, formatVolume, esc, arrotondamenti', () => {
    const env = makeEnv({ now: D(2026, 10, 15, 0, 5) });
    const { GT } = env;
    eq(GT.formatRelativeDay(new Date(D(2026, 10, 15, 0, 1))), 'Oggi');
    eq(GT.formatRelativeDay(new Date(D(2026, 10, 14, 23, 59))), 'Ieri', '6 minuti fa ma ieri');
    eq(GT.formatRelativeDay(new Date(D(2026, 10, 12, 18))), '3 giorni fa');
    eq(GT.formatRelativeDay(new Date(D(2026, 10, 9, 18))), '6 giorni fa');
    eq(GT.formatRelativeDay(new Date(D(2026, 10, 8, 18))), '8 ott');
    eq(GT.formatRelativeDay(new Date(D(2025, 10, 12, 18))), '12 ott 2025');
    eq(GT.formatVolume(850), '850 kg');
    eq(GT.formatVolume(2348), '2.348 kg');
    eq(GT.formatVolume(12400), '12,4 t');
    eq(GT.formatVolume(10000), '10 t');
    eq(GT.formatVolume(1234567), '1.234,6 t');
    eq(GT.esc(`<img src=x onerror="a('b')">&`), '&lt;img src=x onerror=&quot;a(&#39;b&#39;)&quot;&gt;&amp;');
    eq(GT.esc(null), '');
    eq(GT.esc(undefined), '');
    eq(GT.round(21.94, 2.5), 22.5);
    eq(GT.floorTo(21.94, 2.5), 20);
    eq(GT.floorTo(9.5, 1), 9);
    eq(GT.floorTo(0.3 * 3, 0.1), 0.9, 'virgola mobile');
    eq(GT.num('102,5'), 102.5, 'virgola italiana');
    eq(/^v\d+\.\d+\.\d+$/.test(GT.APP_VERSION), true);
});

test('getWorkoutsThisWeek e getConditioningThisWeek di DOMENICA', () => {
    const seed = {
        gymtracker_workouts: [
            workout(D(2026, 10, 18, 9), [['bench-press', [[60, 8]]]]),   // domenica (oggi)
            workout(D(2026, 10, 14, 18), [['bench-press', [[60, 8]]]]),  // mercoledì
            workout(D(2026, 10, 12, 7), [['bench-press', [[60, 8]]]]),   // lunedì
            workout(D(2026, 10, 11, 18), [['bench-press', [[60, 8]]]])   // domenica scorsa
        ],
        gymtracker_conditioning: [
            { id: 1, type: 'hiit', duration: 20, calories: 200, date: new Date(D(2026, 10, 18, 8)).toISOString() },
            { id: 2, type: 'liss', duration: 30, calories: 150, date: new Date(D(2026, 10, 11, 8)).toISOString() }
        ]
    };
    const { S } = makeEnv({ now: D(2026, 10, 18, 20), seed });
    eq(S.getWorkoutsThisWeek().length, 3, 'allenamenti della settimana di domenica');
    eq(S.getConditioningThisWeek().length, 1, 'cardio della settimana di domenica');
    eq(S.getStatistics().weeklyWorkouts, 3);
});

// ============================================================
// 2. Personal record
// ============================================================
test('PR: maxWeight = serie più PESANTE (non quella con E1RM migliore)', () => {
    const { S } = makeEnv({ seed: { gymtracker_workouts: [workout(D(2026, 10, 10), [['bench-press', [[100, 5], [90, 10]]]])] } });
    const pr = S.rebuildPersonalRecords()['bench-press'];
    eq(pr.maxWeight, 100, 'maxWeight');
    eq(pr.maxWeightReps, 5);
    eq(pr.estimated1RM, 120, 'E1RM migliore (90×10 Brzycki)');
    eq(pr.e1rmWeight, 90);
    eq(pr.maxReps, 10, 'maxReps a ≥50% del massimo');
    eq(pr.history.length, 1, 'una voce per sessione');
});

test('PR ricostruiti dopo modifica (1000→100 kg) ed eliminazione', () => {
    const w1 = workout(D(2026, 10, 1), [['squat', [[80, 8], [80, 8]]]]);
    const w2 = workout(D(2026, 10, 8), [['squat', [[1000, 8]]]]);
    const { S } = makeEnv({ seed: { gymtracker_workouts: [w2, w1] } });
    S.rebuildPersonalRecords();
    eq(S.getExercisePR('squat').maxWeight, 1000, 'errore di battitura registrato');
    const edited = JSON.parse(JSON.stringify(S.getWorkoutById(w2.id)));
    edited.exercises[0].sets[0].weight = '100';
    S.updateWorkout(w2.id, edited);
    eq(S.getExercisePR('squat').maxWeight, 100, 'dopo la modifica il record è 100');
    eq(S.getExercisePR('squat').history.length, 2);
    ok(S.deleteWorkout(String(w2.id)), 'eliminazione con id stringa');
    eq(S.getExercisePR('squat').maxWeight, 80, 'dopo l\'eliminazione torna 80');
    S.deleteWorkout(w1.id);
    eq(S.getExercisePR('squat'), null, 'nessun allenamento → nessun record');
});

test('checkForNewPR: prima volta e più serie nella stessa sessione', () => {
    const { S } = makeEnv();
    const first = S.checkForNewPR('bench-press', 60, 8, []);
    eq([first.isNewPR, first.isFirstTime, first.type], [false, true, null], 'prima volta non è PR');
    S.saveWorkout(workout(D(2026, 10, 14), [['bench-press', [[100, 5], [90, 10]]]]));
    const a = S.checkForNewPR('bench-press', 102.5, 3, []);
    eq([a.isNewPR, a.type, a.isFirstTime], [true, 'weight', false], 'peso nuovo');
    const b = S.checkForNewPR('bench-press', 102.5, 3, [{ weight: '102.5', reps: '3', completed: true }]);
    eq(b.isNewPR, false, 'stessa serie già fatta nella sessione non è un altro PR');
    const c = S.checkForNewPR('bench-press', 105, 2, [{ weight: 102.5, reps: 3, completed: true }]);
    eq([c.isNewPR, c.type, c.oldValue], [true, 'weight', 102.5], 'battuta la serie precedente della sessione');
    const d = S.checkForNewPR('bench-press', 95, 10, [{ weight: 110, reps: 1, completed: false }]);
    eq([d.isNewPR, d.type], [true, 'e1rm'], 'serie non completata ignorata; E1RM 126,7 > 120');
    const e = S.checkForNewPR('bench-press', '', '', []);
    eq(e.isNewPR, false, 'serie vuota');
});

test('getStatistics: totalPRs conta solo i PR veri (flag gonfiati della v1.25 esclusi)', () => {
    const seed = {
        gymtracker_workouts: [
            workout(D(2026, 10, 14), [['bench-press', [[62.5, 8, { isNewPR: true }], [62.5, 8, { isNewPR: true }], [60, 8, { isNewPR: true }]]]]),
            workout(D(2026, 10, 7), [['bench-press', [[60, 8, { isNewPR: true }], [60, 8, { isNewPR: true }]]]])  // prima volta: v1.25 li segnava tutti
        ]
    };
    const { S } = makeEnv({ seed });
    const st = S.getStatistics();
    eq(st.totalPRs, 1, 'solo la prima serie a 62,5 batte il record');
    eq(st.prCount, 1, 'prCount allineato');
});

// ============================================================
// 3. Passi di carico e progressione
// ============================================================
test('getLoadStep / getProgressionIncrement per attrezzatura', () => {
    const { S } = makeEnv();
    eq(S.getLoadStep('squat', 100), 2.5, 'bilanciere');
    eq(S.getLoadStep('lateral-raise', 6), 1, 'manubri < 10');
    eq(S.getLoadStep('dumbbell-bench-press', 24), 2, 'manubri ≥ 10');
    eq(S.getLoadStep('leg-press', 120), 2.5, 'macchina');
    eq(S.getLoadStep('cable-curl', 20), 2.5, 'cavi');
    eq(S.getLoadStep('push-up', 0), 0, 'corpo libero');
    eq(S.getProgressionIncrement('squat', 100), 5, 'compound gambe bilanciere');
    eq(S.getProgressionIncrement('deadlift', 100), 5, 'stacco = gambe');
    eq(S.getProgressionIncrement('leg-press', 100), 5, 'compound gambe macchina');
    eq(S.getProgressionIncrement('goblet-squat', 10), 2, 'compound gambe manubri');
    eq(S.getProgressionIncrement('bulgarian-split-squat', 12), 2, 'bulgaro manubri (era +5)');
    eq(S.getProgressionIncrement('dumbbell-hip-thrust', 20), 2, 'hip thrust manubri (era +5)');
    eq(S.getProgressionIncrement('leg-press-calf-raise', 60), 2.5, 'polpacci alla pressa (era +5)');
    eq(S.getProgressionIncrement('bench-press', 60), 2.5, 'compound upper bilanciere');
    eq(S.getProgressionIncrement('dumbbell-shoulder-press', 8), 1, 'compound upper manubri leggeri = passo');
    eq(S.getProgressionIncrement('dumbbell-shoulder-press', 14), 2, 'compound upper manubri = passo');
    eq(S.getProgressionIncrement('lateral-raise', 4), 1, 'isolamento manubri leggeri');
    // v2 (ALGORITMO-V2 §3.1): il pacco pesi va a passi di 5 kg di default (stackStepKg), quindi
    // 40 → 45; con un pacco da 2,5 (gym.stackStepKg) o pesi registrati a 42,5 il salto torna 2,5
    eq(S.getProgressionIncrement('pec-deck', 40), 5, 'isolamento macchina (pacco a 5 kg)');
    eq(S.getProgressionIncrement('bodyweight-squat', 0), 0, 'corpo libero');
    eq(S.getExerciseType('goblet-squat'), 'compound', 'tipo dal DB');
    eq(S.getExerciseType('leg-press-calf-raise'), 'isolation', 'tipo dal DB, non per sottostringa');
    eq(S.getExerciseType('dumbbell-hip-thrust'), 'compound');
    // Sempre multiplo del passo
    ['squat', 'goblet-squat', 'lateral-raise', 'bench-press', 'dumbbell-row', 'leg-extension'].forEach(id => {
        [1, 5, 9, 10, 24, 60].forEach(w => {
            const st = S.getLoadStep(id, w), inc = S.getProgressionIncrement(id, w);
            ok(st === 0 || Math.abs(inc / st - Math.round(inc / st)) < 1e-9, `${id} @${w}: ${inc} multiplo di ${st}`);
        });
    });
});

function detrainEnv(lastDaysAgo, exDaysAgo) {
    const now = D(2026, 10, 15, 10);
    const exDate = now - exDaysAgo * DAY;
    const lastDate = now - lastDaysAgo * DAY;
    const ws = [
        workout(exDate, [
            ['goblet-squat', [[10, 10], [10, 10], [10, 10]]],
            ['lateral-raise', [[1, 10], [1, 10]]],
            ['squat', [[40, 10], [40, 10], [40, 10]]],
            ['plank', [[0, 45, { isBodyweight: true }], [0, 45]]]
        ])
    ];
    if (lastDaysAgo < exDaysAgo) ws.unshift(workout(lastDate, [['bench-press', [[50, 10]]]]));
    return makeEnv({ now, seed: { gymtracker_workouts: ws } });
}

test('Detraining (pausa della PERSONA, 4 settimane): goblet 10, laterali 1, squat 40, plank', () => {
    const { S } = detrainEnv(28, 28);
    eq(S.getDaysSinceLastWorkout(), 28);
    const g = S.getProgressionSuggestion('goblet-squat', '8-12');
    eq([g.status, g.suggestedWeight], ['detraining', 9], 'goblet 10 → 9 kg (non 5)');
    ok(/−10%/.test(g.message) && !/−-/.test(g.message), 'messaggio col segno giusto: ' + g.message);
    const l = S.getProgressionSuggestion('lateral-raise', '12-15');
    eq([l.status, l.suggestedWeight], ['detraining', 1], 'laterali 1 kg: il peso resta (mai 1,25 o 0)');
    ok(l.suggestedReps < 10, 'laterali: si abbassano le reps');
    ok(!/−-|\+/.test(l.message), 'nessun "−-%": ' + l.message);
    const s = S.getProgressionSuggestion('squat', '8-12');
    eq([s.status, s.suggestedWeight, s.reductionPct], ['detraining', 37.5, 6], 'squat 40 → 37,5');
    const p = S.getProgressionSuggestion('plank', '30-45');
    eq([p.status, p.suggestedWeight], ['detraining', 0], 'plank: corpo libero, peso invariato');
    ok(p.suggestedReps < 45 && p.suggestedReps > 0, 'plank: meno secondi/reps');
    // Pausa molto lunga: mai sotto il 60%
    const long = detrainEnv(200, 200).S.getProgressionSuggestion('squat', '8-12');
    ok(long.suggestedWeight >= 24 && long.suggestedWeight < 40, 'pausa lunga: tra 60% e il vecchio peso, trovato ' + long.suggestedWeight);
});

test('Detraining NO se manca solo l\'esercizio (la persona si allena)', () => {
    const { S } = detrainEnv(3, 28);
    eq(S.getDaysSinceLastWorkout(), 3);
    const s = S.getProgressionSuggestion('squat', '6-10');
    ok(s.status !== 'detraining', 'squat assente 4 settimane ma persona attiva: ' + s.status);
    // v2 (§3.6): salti percentuali sulla scala vera, +5% per i multiarticolari di gambe: 40 → 42,5 (non +5 fisso)
    eq([s.status, s.suggestedWeight], ['increase_weight', 42.5], 'tutte le serie al massimo → +5% = 42,5');
    const s2 = S.getProgressionSuggestion('squat', '8-12');
    eq([s2.status, s2.suggestedWeight, s2.suggestedReps], ['increase_reps', 40, 11], 'nel range → +1 rep');
    const r = detrainEnv(3, 50).S.getProgressionSuggestion('squat', '8-12');
    eq([r.status, r.suggestedWeight, r.rirTarget], ['refamiliarize', 37.5, 3], 'assente 7 settimane → −1 passo, RIR 3');
    const rg = detrainEnv(3, 50).S.getProgressionSuggestion('goblet-squat', '8-12');
    eq(rg.suggestedWeight, 9, 'manubri 10 → 9 (il manubrio subito sotto)');
});

test('Cardio recente conta come allenamento per il detraining', () => {
    const now = D(2026, 10, 15, 10);
    const seed = {
        gymtracker_workouts: [workout(now - 30 * DAY, [['squat', [[40, 10]]]])],
        gymtracker_conditioning: [{ id: 5, type: 'LISS', duration: 40, date: new Date(now - 2 * DAY).toISOString() }]
    };
    const { S } = makeEnv({ now, seed });
    eq(S.getDaysSinceLastWorkout(), 2);
    ok(S.getProgressionSuggestion('squat', '8-12').status !== 'detraining');
    eq(makeEnv({ now }).S.getDaysSinceLastWorkout(), null, 'nessun allenamento → null');
});

test('Back-off sul TOP SET (le serie di riscaldamento non ingannano)', () => {
    const now = D(2026, 10, 15, 10);
    const sess = d => workout(now - d * DAY, [['bench-press', [[40, 12], [60, 6], [60, 6], [60, 5]]]]);
    const { S } = makeEnv({ now, seed: { gymtracker_workouts: [sess(2), sess(5), sess(9)] } });
    const lp = S.getLastPerformance('bench-press');
    eq([lp.weight, lp.reps], [60, 6], 'ultima prestazione = top set, non il riscaldamento da 480 kg di volume');
    const s = S.getProgressionSuggestion('bench-press', '8-12');
    // v2 (§9.6): back-off = 90% portato sulla scala PER DIFETTO (54 → 52,5), non al più vicino
    eq([s.status, s.suggestedWeight], ['backoff', 52.5], 'stallo → −10% per difetto (54 → 52,5)');
    const one = makeEnv({ now, seed: { gymtracker_workouts: [sess(2), workout(now - 5 * DAY, [['bench-press', [[60, 9], [60, 8]]]])] } })
        .S.getProgressionSuggestion('bench-press', '8-12');
    eq([one.status, one.suggestedWeight], ['maintain', 60], 'una sola sessione sotto il range: si mantiene');
});

test('Suggerimento: prima volta, +1 rep, suggestedWeight sempre un numero', () => {
    const now = D(2026, 10, 15, 10);
    const { S } = makeEnv({ now, seed: { gymtracker_workouts: [workout(now - 3 * DAY, [['lateral-raise', [[6, 12], [6, 10]]]])] } });
    const n = S.getProgressionSuggestion('cable-curl', '10-15');
    eq(n.status, 'new');
    ok(typeof n.suggestedWeight === 'number' && n.suggestedWeight > 0, 'peso iniziale per lo stepper');
    eq(S.getProgressionSuggestion('push-up', '8-12').suggestedWeight, 0, 'corpo libero parte da 0');
    const r = S.getProgressionSuggestion('lateral-raise', '10-15');
    // v2 (§9.3): rep = prima serie al top + 1 (12 → 13); per serie: [13, 11]
    eq([r.status, r.suggestedWeight, r.suggestedReps], ['increase_reps', 6, 13]);
    eq(r.suggestedRepsPerSet, [13, 11], 'obiettivo per serie');
    // v2 (§3.6): 6 → 7 kg è +16,7%: prima di salire servono 17 rep (need), con 15 si aggiunge una rep
    const at15 = makeEnv({ now, seed: { gymtracker_workouts: [workout(now - 3 * DAY, [['lateral-raise', [[6, 15], [6, 15]]]])] } })
        .S.getProgressionSuggestion('lateral-raise', '10-15');
    eq([at15.status, at15.suggestedWeight, at15.suggestedReps], ['increase_reps', 6, 16], 'salto grande: prima più rep');
    const up = makeEnv({ now, seed: { gymtracker_workouts: [workout(now - 3 * DAY, [['lateral-raise', [[6, 17], [6, 17]]]])] } })
        .S.getProgressionSuggestion('lateral-raise', '10-15');
    eq([up.status, up.suggestedWeight], ['increase_weight', 7], 'laterali 6 → 7 (+1, non +1,25)');
    const ev = S.evaluateSets('squat', [{ weight: '100', reps: '12', completed: true }, { weight: '100', reps: '12', completed: true }], '8-12');
    eq([ev.action, ev.increment, ev.nextWeight], ['up', 5, 105], 'evaluateSets usa lo stesso incremento');
});

test('v2: palestra, stepper sulla scala vera, dischi, sedute di scarico escluse, PR senza riscaldamento', () => {
    const now = D(2026, 10, 15, 10);
    const prog = program({ start: D(2026, 9, 14, 0), week: 4, duration: 4 });   // settimana 4 = deload
    prog.metadata.programId = 77;
    const seed = {
        gymtracker_active_program: prog,
        gymtracker_workouts: [
            workout(now - 2 * DAY, [['bench-press', [[54, 8, { rir: 4 }], [54, 8]]]], { cyclePhase: 'deload' }),
            workout(now - 6 * DAY, [['bench-press', [[20, 10, { isWarmup: true }], [60, 10], [60, 10], [60, 9]]], ['plank', [[0, 40], [0, 45]]]]),
            workout(now - 9 * DAY, [['bench-press', [[60, 9], [60, 9]]], ['plank', [[0, 30]]]])
        ]
    };
    const { S } = makeEnv({ now, seed });
    // palestra: default + salvataggio che unisce
    eq([S.getGymConfig().barKg, S.getGymConfig().dumbbells.includes(12)], [20, true]);
    S.saveGymConfig({ barKg: 15 });
    S.saveGymConfig({ stackStepKg: 2.5 });
    eq([S.getGymConfig().barKg, S.getGymConfig().stackStepKg, S.getSettings().restSound], [15, 2.5, 'beep'], 'saveGymConfig unisce');
    // stepper: manubri 10 → 12, discesa dello stepper v1.26 (peso − 0,01) → 2
    eq([S.stepWeight('dumbbell-curl', 10, 1), S.stepWeight('dumbbell-curl', 10, -1), S.getLoadStep('dumbbell-curl', 11.99)], [12, 9, 2]);
    eq(S.getLoadStep('push-up', 0), 0, 'corpo libero');
    // dischi col bilanciere configurato (15)
    eq(S.getPlates('squat', 102.5).perSide, [25, 15, 2.5, 1.25], '102,5 col bilanciere da 15');
    eq([S.getPlates('squat', 100).barKg, S.getPlates('leg-press', 50).barKg, S.getPlates('t-bar-row', 40), S.getPlates('lat-pulldown', 40)], [15, 0, null, null]);
    // sedute: quella di scarico esclusa dalla progressione, riscaldamento ignorato
    const ses = S.getExerciseSessions('bench-press', { limit: 5 });
    eq(ses.map(x => x.sets.filter(y => !y.isWarmup).length), [3, 2], 'scarico escluso, riscaldamento marcato');
    eq(S.getExerciseSessions('bench-press', { limit: 5, excludeDeload: false }).length, 3);
    // la settimana corrente è di scarico: il suggerimento è −10% dall'ultima seduta normale (60 → 54:
    // il 54 è sulla scala perché registrato nella seduta di scarico, §3.2)
    const sug = S.getProgressionSuggestion('bench-press', '8-12');
    eq([sug.status, sug.suggestedWeight, sug.targetRir], ['deload', 54, 4]);
    const normal = S.getProgressionSuggestion('bench-press', '8-12', 'hypertrophy', { phase: { phase: 'accumulation', rir: { compound: 2, isolation: 2 } } });
    eq([normal.status, normal.suggestedWeight, normal.suggestedReps], ['increase_reps', 60, 11], 'senza scarico: +1 rep');
    // il workout salvato porta la fase
    const w = S.saveWorkout({ name: 'Upper A', type: 'Upper A', dayIndex: 0, exercises: [] });
    eq(w.cyclePhase, 'deload');
    // PR: riscaldamento escluso, plank a tempo = secondi (niente e1RM)
    const prs = S.rebuildPersonalRecords();
    eq([prs['bench-press'].maxWeight, prs.plank.maxReps, prs.plank.estimated1RM], [60, 45, 0]);
    eq(S.checkForNewPR('plank', 0, 50).type, 'time');
    // profilo con i campi v2
    const p = S.getProfile();
    eq([p.avoidExercises, p.preferExercises, p.painAreas, p.emphasis], [[], [], [], '']);
    S.saveProfile({ painAreas: ['knee', 'boh'], avoidExercises: ['squat'] });
    eq([S.getProfile().painAreas, S.getProfile().avoidExercises], [['knee'], ['squat']]);
    // alternative con peso noto (storico) e convertito
    const alts = S.getAlternatives('bench-press', { reason: 'busy', kg: 60 });
    ok(alts.length > 0 && alts.every(a => a.exerciseId !== 'squat' && a.weight), 'alternative con peso');
    const dbp = alts.find(a => a.exerciseId === 'dumbbell-bench-press');
    if (dbp) eq(dbp.weight.kg, 24, 'panca 60 → manubri 24 (0,415 × 60 = 24,9 per difetto)');
    // scarico anticipato: mai durante lo scarico
    eq(S.getEarlyDeloadSuggestion().suggest, false);
    eq(S.getStartingLoad('push-up').kg, 0);
});

test('Ripiego v1.26: con un algorithm.js senza computeNextTarget lo Storage non si rompe', () => {
    const now = D(2026, 10, 15, 10);
    const { S } = makeEnv({ now, algorithm: 'stub', seed: { gymtracker_workouts: [workout(now - 3 * DAY, [['squat', [[100, 12], [100, 12]]]])] } });
    const s = S.getProgressionSuggestion('squat', '8-12');
    eq([s.status, s.suggestedWeight], ['increase_weight', 105], 'doppia progressione v1.26');
    eq(S.getLoadStep('lateral-raise', 6), 1, 'passo v1.26');
    eq(S.stepWeight('dumbbell-curl', 10, 1), 12, 'stepper v1.26: 10 → 12');
    eq(S.evaluateSets('squat', [{ weight: '100', reps: '12', completed: true }], '8-12').action, 'up');
});

// ============================================================
// 4. saveWorkout, spazio pieno
// ============================================================
test('saveWorkout: campi nuovi, riferimenti alla scheda, spazio pieno = errore e niente perdite', () => {
    const now = D(2026, 10, 15, 10);
    const prog = program({ start: D(2026, 10, 12, 0) });
    prog.metadata.programId = 4242;
    prog.metadata.cycleNumber = 3;
    const env = makeEnv({ now, seed: { gymtracker_active_program: prog } });
    const { S, ls } = env;
    const saved = S.saveWorkout({ name: 'Upper A', type: 'Upper A', dayIndex: 0, exercises: [{ exerciseId: 'bench-press', name: 'P', sets: [{ weight: '60', reps: '8', completed: true }] }] });
    eq([saved.dayIndex, saved.programId, saved.cycleNumber, saved.cycleWeek, saved.isFreeWorkout], [0, 4242, 3, 1, false]);
    const free = S.saveWorkout({ name: 'Libero', isFreeWorkout: true, exercises: [] });
    eq([free.dayIndex, free.programId, free.isFreeWorkout], [null, null, true]);
    ok(free.id !== saved.id, 'id unici');
    eq(S.getWorkouts().length, 2);
    // R1-11: a memoria piena si tolgono i dati RICALCOLABILI (PR, streak) e si riprova; se non basta
    // lancia e niente altro cambia (allenamenti, scheda, profilo intatti)
    const keep = () => JSON.stringify([...ls._map.entries()].filter(([k]) => !['gymtracker_prs', 'gymtracker_streak'].includes(k)).sort());
    const before = keep();
    ls._failOn(k => k === 'gymtracker_workouts');
    const err = throwsCode(() => S.saveWorkout({ name: 'X', exercises: [] }), 'QUOTA', 'spazio pieno');
    ok(/pieno/.test(err.message));
    eq(keep(), before, 'niente scritto a metà (solo dati ricalcolabili tolti)');
    eq(S.lastWriteError.code, 'QUOTA');
    ls._failOn(k => k === 'gymtracker_active_session');
    eq(S.saveActiveSession({ a: 1 }), false, 'sessione in corso: false, non lancia');
    ls._failOn(null);
    const sess = { workout: { name: 'Upper A', exercises: [{ exerciseId: 'bench-press', setsData: [{ weight: 60, reps: 8 }, null] }, null, { name: 'senza id' }] } };
    ok(S.saveActiveSession(sess));
    eq(S.getActiveSession().workout.exercises.map(e => [e.exerciseId, e.setsData.length]), [['bench-press', 1]], 'R1-18: sessione normalizzata');
    S.clearActiveSession();
    eq(S.getActiveSession(), null);
    // R1-18: sessione non recuperabile (niente esercizi validi) → cancellata, non riprovata a ogni avvio
    ls.setItem('gymtracker_active_session', JSON.stringify({ workout: { exercises: [null] } }));
    eq(S.getActiveSession(), null);
    eq(ls.getItem('gymtracker_active_session'), null, 'sessione rotta cancellata');
});

test('R1-11 / R1-20: spazio pieno → dati ricalcolabili tolti e scrittura riuscita; SecurityError distinto', () => {
    const now = D(2026, 10, 15, 10);
    const env = makeEnv({ now, seed: {
        gymtracker_prs: { 'squat': { maxWeight: 100, history: [] } }, gymtracker_streak: { current: 2, best: 3 },
        gymtracker_meta: { schemaVersion: 2, prsBeforeV126: 'x'.repeat(50) },
        gymtracker_corrupt_workouts_1700000000000: '[vecchia', gymtracker_corrupt_workouts_1800000000000: '[nuova'
    } });
    const { S, ls } = env;
    let fails = 1;
    ls._failOn(k => k === 'gymtracker_workouts' && fails-- > 0);   // la prima scrittura fallisce, la seconda no
    const w = S.saveWorkout({ name: 'X', exercises: [{ exerciseId: 'squat', sets: [{ weight: 60, reps: 8, completed: true }] }] });
    ok(w && S.getWorkouts().length === 1, 'salvata al secondo tentativo');
    ok(ls.getItem('gymtracker_corrupt_workouts_1800000000000') !== null && ls.getItem('gymtracker_corrupt_workouts_1700000000000') === null, 'resta solo la copia rotta più recente');
    ok(!('prsBeforeV126' in env.get('gymtracker_meta')), 'vecchia copia dei PR tolta');
    eq(S.getPersonalRecords().squat.maxWeight, 60, 'PR ricalcolati dagli allenamenti');
    ls._failOn(k => { if (k === 'gymtracker_settings') { const e = new Error('The operation is insecure.'); e.name = 'SecurityError'; e.code = 18; throw e; } return false; });
    const err = throwsCode(() => S._write('gymtracker_settings', {}), 'SECURITY', 'Safari privato');
    ok(!/pieno/.test(err.message) && S.lastWriteError.code === 'SECURITY');
    ls._failOn(null);
});

// ============================================================
// 5. Export / import
// ============================================================
function fullSeed(now) {
    return {
        gymtracker_profile: { name: 'Sara', gender: 'female', goal: 'toning', level: 'beginner', weight: 60, equipment: ['manubri', 'panca'] },
        gymtracker_settings: { restTimeCompound: 90, restTimeIsolation: 60, restSound: 'bell', vibration: true, theme: 'dark', weightUnit: 'kg' },
        gymtracker_workouts: [workout(now - 2 * DAY, [['goblet-squat', [[10, 12]]]]), workout(now - 5 * DAY, [['goblet-squat', [[8, 12]]]])],
        gymtracker_active_program: program({ start: now - 10 * DAY, week: 2 }),
        gymtracker_measurements: [{ id: 1, date: new Date(now - DAY).toISOString(), weight: 60 }],
        gymtracker_streak: { current: 2, best: 6, lastWorkoutDate: new Date(now - 2 * DAY).toDateString() },
        gymtracker_cycle_history: [{ id: 9, duration: 4, goal: 'toning', completedAt: new Date(now - 40 * DAY).toISOString() }],
        gymtracker_conditioning: [{ id: 3, type: 'hiit', duration: 20, calories: 210, date: new Date(now - 3 * DAY).toISOString() }],
        gymtracker_active_session: { inCorso: true },
        gymtracker_corrupt_settings: '{rotto'
    };
}

test('Export → import completo (schemaVersion 2) e dati identici', () => {
    const now = D(2026, 10, 15, 10);
    const a = makeEnv({ now, seed: fullSeed(now) });
    a.ls.setItem('gymtracker_futura', JSON.stringify({ x: 1 }));
    const json = a.S.exportAllData();
    const data = JSON.parse(json);
    eq([data.schemaVersion, data.appVersion, !!data.version], [2, a.GT.APP_VERSION, true]);
    ok(Array.isArray(data.cycleHistory) && data.cycleHistory.length === 1, 'cycle_history esportata');
    ok(Array.isArray(data.conditioning) && data.conditioning.length === 1, 'conditioning esportato');
    ok(!('gymtracker_active_session' in (data.extra || {})) && !json.includes('inCorso'), 'sessione in corso esclusa');
    // R1-20: le copie dei dati rotti si esportano (erano l'unica copia), non tornano chiavi vive
    ok(json.includes('{rotto') && data.extra && data.extra.gymtracker_corrupt_settings === '{rotto', 'copie rotte esportate');
    eq(data.extra.gymtracker_futura, '{"x":1}', 'chiavi gymtracker_* nuove incluse');
    const b = makeEnv({ now });
    ok(b.S.importAllData(json), 'import riuscito: ' + b.S.lastImportError);
    ['gymtracker_workouts', 'gymtracker_cycle_history', 'gymtracker_conditioning', 'gymtracker_measurements', 'gymtracker_active_program', 'gymtracker_profile', 'gymtracker_settings']
        .forEach(k => eq(b.get(k), a.get(k), k));
    eq(b.ls.getItem('gymtracker_futura'), '{"x":1}');
    eq(b.S.getPersonalRecords()['goblet-squat'].maxWeight, 10, 'PR ricostruiti');
});

test('Import di un export v1.25 (version 1.16.5, senza cycle_history/conditioning)', () => {
    const now = D(2026, 10, 15, 10);
    const old = fullSeed(now);
    const v125export = JSON.stringify({
        version: '1.16.5', exportDate: new Date(now).toISOString(),
        profile: { ...old.gymtracker_profile, goal: 'bulk' }, settings: old.gymtracker_settings,
        workouts: [workout(now - 20 * DAY, [['squat', [[70, 8]]]])], programs: [], activeProgram: old.gymtracker_active_program,
        measurements: old.gymtracker_measurements,
        personalRecords: { squat: { maxWeight: 1000, estimated1RM: 1200, history: [] } },
        streak: { current: 3, best: 9, lastWorkoutDate: 'x' }
    });
    const env = makeEnv({ now, seed: fullSeed(now) });
    ok(env.S.importAllData(v125export), 'import v1.25: ' + env.S.lastImportError);
    eq(env.S.getWorkouts().length, 1, 'allenamenti sostituiti');
    eq(env.get('gymtracker_cycle_history').length, 1, 'storico cicli del telefono NON cancellato');
    eq(env.get('gymtracker_conditioning').length, 1, 'cardio del telefono NON cancellato');
    eq(env.S.getExercisePR('squat').maxWeight, 70, 'PR ricostruiti dagli allenamenti (via il 1000)');
    eq(env.S.getProfile().goal, 'hypertrophy', 'goal bulk migrato');
    eq(env.get('gymtracker_streak').legacyDaysBest, 9, 'record a giorni conservato');
    // Backup v2 senza conditioning: le chiavi di progresso assenti si svuotano
    const v2 = JSON.stringify({ version: '1.26.0', schemaVersion: 2, workouts: [] });
    const e2 = makeEnv({ now, seed: fullSeed(now) });
    ok(e2.S.importAllData(v2));
    eq(e2.ls.getItem('gymtracker_conditioning'), null, 'v2: conditioning assente → svuotato');
    ok(e2.ls.getItem('gymtracker_profile') !== null, 'v2: il profilo non si tocca');
});

test('Import: rollback se una scrittura fallisce, rifiuto dei formati sbagliati', () => {
    const now = D(2026, 10, 15, 10);
    const env = makeEnv({ now, seed: fullSeed(now) });
    const json = env.S.exportAllData();
    const target = makeEnv({ now, seed: { gymtracker_workouts: [workout(now - DAY, [['squat', [[50, 5]]]])], gymtracker_profile: { name: 'Daniele' } } });
    const before = target.ls._snapshot();
    target.ls._failOn(k => k === 'gymtracker_conditioning');
    eq(target.S.importAllData(json), false, 'import fallito');
    ok(/annullato/.test(target.S.lastImportError), target.S.lastImportError);
    target.ls._failOn(null);
    eq(target.ls._snapshot(), before, 'tutto come prima (rollback)');
    eq(target.S.importAllData('{non json'), false);
    eq(target.S.importAllData(JSON.stringify({ foo: 1 })), false, 'senza version');
    eq(target.S.importAllData(JSON.stringify({ version: '1.16.5', workouts: { a: 1 } })), false, 'workouts non array');
    eq(target.S.importAllData(JSON.stringify({ version: '1.16.5', profile: [1] })), false, 'profile non oggetto');
    eq(target.S.importAllData(JSON.stringify({ version: '1.16.5', activeProgram: { name: 'x' } })), false, 'scheda senza giorni');
    eq(target.ls._snapshot(), before, 'rifiuti senza effetti');
});

// ============================================================
// 6. Dati corrotti
// ============================================================
test('JSON corrotto in OGNI chiave: avvio senza eccezioni, copie messe da parte', () => {
    const keys = ['gymtracker_profile', 'gymtracker_settings', 'gymtracker_workouts', 'gymtracker_programs', 'gymtracker_active_program',
        'gymtracker_measurements', 'gymtracker_prs', 'gymtracker_streak', 'gymtracker_cycle_history', 'gymtracker_conditioning',
        'gymtracker_active_session', 'gymtracker_meta'];
    const seed = {};
    keys.forEach(k => { seed[k] = '{"rotto": '; });
    const env = makeEnv({ seed });
    const { S } = env;
    eq(S.getProfile().level, 'beginner');
    eq(S.getSettings().restSound, 'beep');
    eq(S.getWorkouts(), []);
    eq(S.getActiveProgram(), null);
    eq(S.getPersonalRecords(), {});
    eq(S.getCycleInfo(), null);
    eq(S.getConditioningSessions(), []);
    eq(S.getMeasurements(), []);
    eq(S.getCycleHistory(), []);
    eq(S.getActiveSession(), null);
    eq(S.getPrograms(), []);
    eq(S.getStreak().current, 0);
    eq(S.getStatistics().totalWorkouts, 0);
    ok(S.getProgressionSuggestion('squat', '8-12').status === 'new');
    keys.forEach(k => {
        const bk = 'gymtracker_corrupt_' + k.replace('gymtracker_', '');
        eq(env.ls.getItem(bk), '{"rotto": ', 'copia di ' + k);
    });
    // Tipo sbagliato (oggetto al posto dell'array) e elementi spazzatura
    const e2 = makeEnv({ seed: { gymtracker_workouts: { a: 1 }, gymtracker_conditioning: [null, 'x', { type: 'HIIT', duration: 10 }] } });
    eq(e2.S.getWorkouts(), []);
    eq(e2.ls.getItem('gymtracker_corrupt_workouts'), '{"a":1}');
    eq(e2.S.getConditioningSessions().length, 1);
    // Spazio pieno durante la messa da parte: l'originale resta dov'è
    const e3 = makeEnv({ seed: {} });
    e3.ls.setItem('gymtracker_workouts', '[rotto');
    e3.ls._failOn(k => k.startsWith('gymtracker_corrupt_'));
    eq(e3.S.getWorkouts(), []);
    eq(e3.ls.getItem('gymtracker_workouts'), '[rotto', 'originale intatto se la copia non riesce');
    // Senza utils.js (cache del SW a metà): lo Storage funziona lo stesso
    const e4 = makeEnv({ skipUtils: true, seed: { gymtracker_workouts: [workout(D(2026, 10, 14), [['squat', [[50, 5]]]])] } });
    eq(e4.S.getWorkoutsThisWeek().length, 1, 'ripiego GT interno');
});

// ============================================================
// 7. Profilo e impostazioni
// ============================================================
test('Profilo: migrazione goal (bulk/cut/maintenance) e default uniti', () => {
    const map = { bulk: 'hypertrophy', cut: 'recomp', maintenance: 'recomp', strength: 'strength', recomp: 'recomp', toning: 'toning', boh: 'hypertrophy' };
    Object.keys(map).forEach(g => {
        const { S } = makeEnv({ seed: { gymtracker_profile: { name: 'A', goal: g, weight: 72 } } });
        const p = S.getProfile();
        eq(p.goal, map[g], 'goal ' + g);
        if (map[g] !== g) eq(p._legacyGoal, g, 'vecchio goal conservato');
        eq([p.name, p.weight, p.level, p.sessionTime, p.equipment.length], ['A', 72, 'beginner', 60, 6], 'default uniti');
    });
    const { S, get } = makeEnv();
    const d = S.getProfile();
    eq([d.gender, d.weight, d.height, d.level, d.background, d.goal, d.daysPerWeek], ['', null, null, 'beginner', 'none', 'hypertrophy', 3], 'default neutro');
    S.saveProfile({ name: 'B', goal: 'toning', extra: 1 });
    S.saveProfile({ name: 'C' });
    eq([get('gymtracker_profile').goal, get('gymtracker_profile').extra, get('gymtracker_profile').name], ['toning', 1, 'C'], 'saveProfile unisce');
    S.saveMeasurement({ weight: 61.5 });
    eq(S.getProfile().weight, 61.5, 'misura aggiorna il profilo');
    // Form vecchio (select senza l'obiettivo migrato) manda goal '': il 'bulk' salvato non si perde
    const old = makeEnv({ seed: { gymtracker_profile: { name: 'D', goal: 'bulk' } } });
    old.S.saveProfile({ name: 'D', goal: '', weight: 80 });
    eq([old.get('gymtracker_profile').goal, old.S.getProfile().goal], ['bulk', 'hypertrophy']);
    old.S.saveProfile({ goal: 'strength' });
    eq([old.get('gymtracker_profile').goal, old.get('gymtracker_profile')._legacyGoal], ['strength', 'bulk'], 'vecchio obiettivo conservato');
});

test('Impostazioni: default nuovi, vecchie impostazioni lette, salvataggio che unisce', () => {
    const { S } = makeEnv({ seed: { gymtracker_settings: { restTimeCompound: 90, restTimeIsolation: 60, restSound: 'bell', vibration: false, theme: 'light', weightUnit: 'lb' } } });
    const s = S.getSettings();
    eq([s.restTimeCompound, s.restTimeIsolation, s.restSound, s.vibration, s.theme], [90, 60, 'bell', false, 'light']);
    eq([s.notifications, s.keepAwake, s.backgroundAlerts], [false, true, false], 'nuove voci: notifiche e keep-alive spenti');
    S.saveSettings({ notifications: true });
    S.saveSettings({ restTimeCompound: 100, restTimeIsolation: 70, restSound: 'beep', vibration: true, theme: 'dark', weightUnit: 'kg' }); // form vecchio
    eq(S.getSettings().notifications, true, 'il form vecchio non cancella le voci nuove');
    const d = makeEnv().S.getSettings();
    eq([d.restTimeCompound, d.restTimeIsolation, d.restSound, d.keepAwake], [120, 75, 'beep', true]);
    eq(makeEnv().S.getDefaultRest('squat'), 120);
    eq(makeEnv().S.getDefaultRest('lateral-raise'), 75);
});

// ============================================================
// 8. Streak a settimane
// ============================================================
test('Streak a settimane: la settimana in corso non spezza, record conservato', () => {
    const now = D(2026, 10, 15, 10);           // giovedì
    const monday = D(2026, 10, 12, 9);
    const ws = [];
    const week = (k, days) => days.forEach(d => ws.push(workout(monday - k * 7 * DAY + d * DAY, [['squat', [[50, 5]]]])));
    week(0, [0]);                 // questa settimana: 1 (in corso)
    week(1, [0, 2, 4]);           // 3
    week(2, [0, 2, 4, 5]);        // 4
    week(3, [1, 3, 3, 5]);        // 3 giorni distinti (due allenamenti lo stesso giorno contano 1)
    week(4, [0, 2]);              // 2 → spezza (target 3)
    week(5, [0, 2, 4]); week(6, [0, 2, 4]); week(7, [0, 1, 2]); week(8, [0, 1, 2]);  // 4 di fila
    const prog = program({ start: monday, daysPerWeek: 4 });
    const env = makeEnv({ now, seed: { gymtracker_workouts: ws, gymtracker_active_program: prog, gymtracker_streak: { current: 1, best: 21, lastWorkoutDate: 'x' } } });
    const s = env.S.getStreak();
    eq([s.target, s.thisWeek, s.current, s.best], [3, 1, 3, 4], 'target 3, serie 3, record 4');
    const raw = env.get('gymtracker_streak');
    eq([raw.unit, raw.best, raw.legacyDaysBest], ['weeks', 4, 21], 'chiave di sempre, vecchio record a giorni conservato');
    eq(env.S.getStatistics().currentStreak, 3);
    // Raggiunto il target anche questa settimana → conta
    ws.push(workout(monday + 1 * DAY, [['squat', [[50, 5]]]]), workout(monday + 2 * DAY, [['squat', [[50, 5]]]]));
    const e2 = makeEnv({ now, seed: { gymtracker_workouts: ws, gymtracker_active_program: prog } });
    eq(e2.S.getStreak().current, 4);
    // Settimana passata mancata → serie a 0; senza scheda il target è 2
    const e3 = makeEnv({ now: now + 14 * DAY, seed: { gymtracker_workouts: ws } });
    const s3 = e3.S.getStreak();
    eq([s3.target, s3.current], [2, 0]);
    ok(s3.best >= 4);
    // Il record salvato non scende se si cancellano allenamenti
    const e4 = makeEnv({ now, seed: { gymtracker_workouts: ws.slice(0, 3), gymtracker_active_program: prog, gymtracker_streak: { current: 3, best: 7, unit: 'weeks' } } });
    eq(e4.S.getStreak().best, 7);
});

// ============================================================
// 9. Ciclo
// ============================================================
test('completeCycle con rotazione che LANCIA: nuovo ciclo con gli stessi esercizi, mai bloccato', () => {
    const now = D(2026, 10, 15, 10);           // giovedì
    const start = D(2026, 9, 14, 0);           // 4 settimane fa+ → ciclo scaduto per calendario
    const prog = program({ start, week: 4, deload: true });
    const env = makeEnv({ now, seed: { gymtracker_active_program: prog, gymtracker_workouts: [workout(now - 20 * DAY, [['squat', [[60, 8]]]])] } });
    const { S, TA } = env;
    ok(S.shouldCompleteCycle(), 'oltre l\'ultima settimana per calendario');
    const r = S.completeCycle();
    ok(r && r.completedCycle && r.statistics, 'risultato completo');
    eq(r.rotation, null, 'rotazione fallita → null');
    eq(TA.calls, 1);
    const p = S.getActiveProgram();
    eq(p.days.map(d => d.exercises[0].exerciseId), prog.days.map(d => d.exercises[0].exerciseId), 'stessi esercizi');
    const c = S.getCycleInfo();
    eq([c.currentWeek, c.cycleNumber, c.isDeloadActive], [1, 2, false], 'settimana 1, ciclo 2, niente deload');
    const sd = new Date(p.metadata.cycle.startDate);
    eq([sd.getDay(), sd.getDate(), sd.getHours()], [1, 12, 0], 'parte dal lunedì di questa settimana');
    eq(S.getCycleHistory().length, 1, 'storico salvato');
    eq(S.getCycleHistory()[0].cycleNumber, 1);
    ok(!S.shouldCompleteCycle(), 'dopo la chiusura non va richiusa');
});

test('completeCycle: rotazione nuova {program, added, removed} e firma vecchia', () => {
    const now = D(2026, 10, 15, 10);
    const prog = program({ start: D(2026, 9, 14, 0), week: 4, cycleNumber: 2 });
    const env = makeEnv({ now, seed: { gymtracker_active_program: prog } });
    env.TA.mode = 'new';
    const r = env.S.completeCycle();
    eq(r.rotation.added.map(x => x.id), ['goblet-squat']);
    ok(r.rotation.added[0].name && r.rotation.added[0].name !== 'goblet-squat', 'nome dal DB');
    eq(r.rotation.removed.map(x => x.id), ['squat']);
    const p = env.S.getActiveProgram();
    eq([p.days[1].exercises[0].exerciseId, p.metadata.programId, p.metadata.cycleNumber, p.metadata.cycle.currentWeek], ['goblet-squat', 777, 3, 1]);
    eq(env.S.getLastRotationSummary().totalChanged, 2, 'riepilogo per la vecchia app');
    const e2 = makeEnv({ now, seed: { gymtracker_active_program: prog } });
    e2.TA.mode = 'old';
    const r2 = e2.S.completeCycle();
    eq(r2.rotation.added.map(x => x.id), ['dumbbell-bench-press'], 'firma vecchia: differenze calcolate');
    eq(e2.S.getActiveProgram().metadata.cycleNumber, 3, 'numero di ciclo sempre vecchio+1');
    const e3 = makeEnv({ now, seed: { gymtracker_active_program: prog } });
    e3.TA.mode = 'empty';
    e3.S.completeCycle();
    eq(e3.S.getActiveProgram().days.length, 4, 'scheda vuota dalla rotazione → stessi esercizi');
    const e4 = makeEnv({ now, algorithm: 'none', seed: { gymtracker_active_program: prog } });
    ok(e4.S.completeCycle(), 'senza TrainingAlgorithm');
    eq(e4.S.getCycleInfo().currentWeek, 1);
});

test('shouldCompleteCycle: ultima settimana con tutte le sessioni; nuovo ciclo dal lunedì dopo', () => {
    const start = D(2026, 9, 21, 0);           // lunedì 21/9: settimana 4 = 12-18/10
    const sat = D(2026, 10, 17, 19);           // sabato dell'ultima settimana
    const ws = [0, 1, 3, 5].map(d => workout(D(2026, 10, 12, 9) + d * DAY, [['squat', [[60, 8]]]]));
    const mid = makeEnv({ now: D(2026, 10, 7, 10), seed: { gymtracker_active_program: program({ start, week: 3 }) } });
    ok(!mid.S.shouldCompleteCycle(), 'a metà ciclo no');
    const three = makeEnv({ now: sat, seed: { gymtracker_active_program: program({ start, week: 4 }), gymtracker_workouts: ws.slice(0, 3) } });
    ok(!three.S.shouldCompleteCycle(), 'ultima settimana con 3 sessioni su 4: non ancora');
    const env = makeEnv({ now: sat, seed: { gymtracker_active_program: program({ start, week: 4 }), gymtracker_workouts: ws } });
    ok(env.S.shouldCompleteCycle(), 'ultima settimana completa');
    env.S.completeCycle();
    const sd = new Date(env.S.getActiveProgram().metadata.cycle.startDate);
    eq([sd.getDay(), sd.getMonth(), sd.getDate()], [1, 9, 19], 'si è già allenato questa settimana → parte lunedì 19');
    eq(env.S.getCycleInfo().currentWeek, 1);
    ok(!env.S.shouldCompleteCycle(), 'nuovo ciclo non da chiudere');
    // Settimana avanzata a mano prima del calendario: conta da quando ci si è arrivati
    const manual = makeEnv({ now: D(2026, 10, 2, 10), seed: { gymtracker_active_program: program({ start, week: 3 }) } });
    manual.S.advanceCycleWeek();
    eq(manual.S.getCycleInfo().currentWeek, 4);
    ok(!manual.S.shouldCompleteCycle());
});

test('Deload manuale: scade da solo dopo 7 giorni, advanceCycleWeek lo spegne, vecchio flag migrato', () => {
    const now = D(2026, 10, 15, 10);
    const env = makeEnv({ now, seed: { gymtracker_active_program: program({ start: D(2026, 10, 5, 0), week: 2 }) } });
    const { S, clock } = env;
    ok(!S.isDeloadActive());
    eq(S.getCurrentVolumeMultiplier(), 1);
    ok(S.startManualDeload());
    ok(S.isDeloadActive(), 'attivo');
    eq(S.getCurrentVolumeMultiplier(), 0.5);
    ok(S.getCycleInfo().isManualDeload);
    clock.set(now + 6 * DAY);
    ok(S.isDeloadActive(), 'ancora attivo al 6° giorno');
    clock.set(now + 7 * DAY + 60000);
    ok(!S.isDeloadActive(), 'scaduto da solo');
    clock.set(now);
    S.startManualDeload();
    S.advanceCycleWeek();
    ok(!S.isDeloadActive(), 'advanceCycleWeek lo spegne');
    eq(S.toggleDeload(), true, 'toggle accende');
    eq(S.toggleDeload(), false, 'toggle spegne');
    // Dati v1.25: isDeloadActive true per sempre (bug A2)
    const old = makeEnv({ now, seed: { gymtracker_active_program: program({ start: D(2026, 10, 5, 0), week: 2, deload: true }) } });
    ok(old.S.isDeloadActive(), 'vecchio deload ancora attivo dopo la migrazione');
    ok(old.get('gymtracker_active_program').metadata.cycle.manualDeloadUntil, 'ha ora una scadenza');
    old.clock.set(now + 8 * DAY);
    ok(!old.S.isDeloadActive(), 'e scade');
    // Fase deload del calendario
    const dl = makeEnv({ now, seed: { gymtracker_active_program: program({ start: D(2026, 9, 21, 0), week: 4 }) } });
    ok(dl.S.isDeloadActive(), 'settimana 4 = deload');
    const info = dl.S.getCycleInfo();
    ['currentPhase', 'progress', 'weeksRemaining', 'isLastWeek', 'phases', 'duration', 'currentWeek', 'startDate'].forEach(k => ok(k in info, 'getCycleInfo.' + k));
});

test('syncCycleWeek e getCalendarCycleWeek', () => {
    // (una seduta in ognuna delle settimane passate: le settimane perse si ripetono, vedi R3-13)
    const ws = [workout(D(2026, 9, 29, 18), [['squat', [[60, 8]]]]), workout(D(2026, 10, 6, 18), [['squat', [[60, 8]]]])];
    const env = makeEnv({ now: D(2026, 10, 15, 10), seed: { gymtracker_active_program: program({ start: D(2026, 9, 28, 0), week: 1 }), gymtracker_workouts: ws } });
    eq(env.S.getCalendarCycleWeek(), 3);
    eq(env.S.syncCycleWeek(), { changed: true, from: 1, to: 3 });
    eq(env.S.getCycleInfo().currentWeek, 3);
    eq(env.S.syncCycleWeek().changed, false);
    const lateP = program({ start: D(2026, 9, 28, 0), week: 1 });
    lateP.metadata.cycle.version = 2;   // (un ciclo v1.25 così vecchio verrebbe riallineato, R1-04)
    const late = makeEnv({ now: D(2026, 12, 15, 10), seed: { gymtracker_active_program: lateP } });
    eq(late.S.syncCycleWeek().to, 4, 'mai oltre la durata');
});

test('R3-13: settimana di lavoro saltata = si ripete (non si passa allo scarico con una settimana in meno)', () => {
    const start = D(2026, 10, 19, 0);   // lunedì
    const real = makeEnv({ now: start, algorithm: 'real' });
    const prog = real.TA.generateProgram({ level: 'beginner', gender: 'female', equipment: ['manubri', 'macchine'] }, { goal: 'toning', daysPerWeek: 3, split: 'upper-lower', sessionDuration: 45 });
    prog.metadata.cycle.startDate = new Date(start).toISOString();
    const ws = [];
    for (let wk = 0; wk < 4; wk++) [0, 2, 4].forEach(d => ws.push(workout(start + (wk * 7 + d) * DAY + 18 * 3600000, [['goblet-squat', [[8, 10]]]], { type: prog.days[0].type })));
    // settimana 5 (16-22/11) saltata; lunedì 23/11 = settimana 6 per il calendario = scarico
    const env = makeEnv({ now: start + 35 * DAY + 9 * 3600000, algorithm: 'real', seed: { gymtracker_active_program: prog, gymtracker_workouts: ws } });
    const r = env.S.syncCycleWeek();
    eq([r.to, r.repeatedWeeks], [5, 1], 'si rifà la settimana 5');
    eq(env.S.getCurrentPhase().phase, 'intensification', 'non è ancora lo scarico');
    ok(!env.S.shouldCompleteCycle(), 'ciclo non chiuso con 4 settimane su 5');
    // la settimana ripetuta fatta → la successiva è lo scarico
    [0, 2, 4].forEach(d => env.S.saveWorkout({ name: 'x', type: prog.days[0].type, exercises: [], date: new Date(start + (35 + d) * DAY + 18 * 3600000).toISOString() }));
    env.clock.set(start + 42 * DAY + 9 * 3600000);
    env.S.syncCycleWeek();
    eq(env.S.getCurrentPhase().phase, 'deload');
});

test('R1-05: syncCycleWeek non spegne uno scarico anticipato ancora valido', () => {
    const fri = D(2026, 10, 16, 18);
    const env = makeEnv({ now: fri, seed: { gymtracker_active_program: program({ start: D(2026, 10, 5, 0), week: 2 }), gymtracker_workouts: [workout(D(2026, 10, 6, 18), [['squat', [[60, 8]]]]), workout(D(2026, 10, 13, 18), [['squat', [[60, 8]]]])] } });
    env.S.startManualDeload();
    env.clock.set(D(2026, 10, 19, 9));   // lunedì: la settimana avanza
    eq(env.S.syncCycleWeek().to, 3);
    ok(env.S.isDeloadActive(), 'scarico anticipato ancora attivo');
    eq(env.S.getActiveProgram().metadata.cycle.earlyDeloads, 1, 'contato per il volume del ciclo dopo (§12.5)');
});

test('R1-04 / R1-15: ciclo v1.25 molto oltre la durata riallineato UNA volta (scarico migrato tenuto); plank 8-12 → 30-45; fine ciclo proposta 1 volta al giorno', () => {
    const now = D(2026, 10, 15, 10);
    const old = program({ start: D(2026, 7, 6, 0), week: 5, duration: 5, deload: true });
    old.days[0].exercises.push({ exerciseId: 'plank', name: 'Plank', sets: 3, reps: '8-12', rest: 60, type: 'isolation' });
    const env = makeEnv({ now, seed: { gymtracker_active_program: old } });
    const c = env.S.getCycleInfo();
    eq(c.currentWeek, 1, 'riallineato alla settimana 1');
    ok(env.S.isDeloadActive(), 'lo scarico migrato resta (7 giorni)');
    ok(env.get('gymtracker_meta').legacyCycleRealignedAt, 'una volta sola');
    eq(env.S.getActiveProgram().days[0].exercises.find(e => e.exerciseId === 'plank').reps, '30-45');
    const snap = env.ls._snapshot();
    env.S.migrate();
    eq(env.ls._snapshot(), snap, 'seconda apertura: niente da rifare');
    // fine ciclo: al massimo una proposta al giorno, mai con una seduta aperta
    const done = makeEnv({ now, seed: { gymtracker_active_program: program({ start: D(2026, 9, 14, 0), week: 4 }) } });
    ok(done.S.shouldCompleteCycle());
    eq([done.S.shouldPromptCycleEnd(), done.S.shouldPromptCycleEnd()], [true, false], 'una volta oggi');
    done.clock.set(now + DAY);
    done.S.saveActiveSession({ workout: { exercises: [{ exerciseId: 'squat', setsData: [] }] } });
    eq(done.S.shouldPromptCycleEnd(), false, 'seduta aperta: no');
    done.S.clearActiveSession();
    eq(done.S.shouldPromptCycleEnd(), true, 'domani sì');
});

test('R1-10: cache in memoria di storico e scheda, azzerata da scritture, rimozioni e altre schede', () => {
    const now = D(2026, 10, 15, 10);
    const env = makeEnv({ now, seed: { gymtracker_active_program: program({ start: D(2026, 10, 12, 0) }), gymtracker_workouts: [workout(now - DAY, [['squat', [[60, 8]]]])] } });
    const { S, ls } = env;
    let reads = 0;
    const get = ls.getItem;
    ls.getItem = (k) => { if (k === 'gymtracker_workouts') reads++; return get(k); };
    S.getWorkouts(); S.getWorkouts(); S.getWorkouts();
    eq(reads, 0, 'storico già in cache dopo la migrazione: nessuna rilettura');
    ok(JSON.stringify(S.getActiveProgram()) === JSON.stringify(S.getActiveProgram()), 'stessa scheda');
    const mut = S.getActiveProgram(); mut.name = 'Modificata senza salvare';
    ok(S.getActiveProgram().name !== 'Modificata senza salvare', 'una copia modificata senza salvare non cambia la cache');
    const p = S._programCopy();
    p.name = 'Nuova';
    ok(S.getActiveProgram().name !== 'Nuova', 'la copia non tocca la cache');
    S.setActiveProgram(p);
    eq(S.getActiveProgram().name, 'Nuova', 'scrittura → cache aggiornata');
    ls.setItem('gymtracker_active_program', JSON.stringify({ ...p, name: 'Da un\'altra scheda' }));
    S._cacheDrop('gymtracker_active_program');   // quello che fa l'evento `storage`
    eq(S.getActiveProgram().name, 'Da un\'altra scheda');
    S.clearActiveProgram();
    eq(S.getActiveProgram(), null, 'rimozione → niente in cache');
    ls.getItem = get;
});

test('R1-13 / R1-17: countRealPRs([w]); scheda modificata nella struttura → programId nuovo e giorno giusto', () => {
    const now = D(2026, 10, 15, 10);
    const w1 = workout(now - 3 * DAY, [['squat', [[60, 8]]]]), w2 = workout(now - DAY, [['squat', [[70, 8, { isNewPR: true }], [65, 8, { isNewPR: true }]]]]);
    const env = makeEnv({ now, seed: { gymtracker_workouts: [w2, w1], gymtracker_active_program: program({ start: D(2026, 10, 12, 0) }) } });
    eq([env.S.countRealPRs([env.S.getWorkouts()[0]]), env.S.countRealPRs([env.S.getWorkouts()[1]])], [1, 0], 'solo il record vero');
    const S = env.S, TA = env.TA;
    const p0 = S.getActiveProgram();
    const pid = p0.metadata.programId;
    S.saveWorkout({ name: 'Lower A', type: 'Lower A', dayIndex: 1, exercises: [] });
    // l'editor toglie Upper A: Lower A ora è l'indice 0
    const edited = JSON.parse(JSON.stringify(p0));
    edited.days.splice(0, 1);
    const saved = S.saveEditedProgram(edited);
    ok(saved.metadata.programId !== pid && saved.metadata.previousProgramIds.includes(pid), 'programId nuovo, il vecchio ricordato');
    eq(TA.getNextDayIndex(S.getActiveProgram(), S.getWorkouts()), 1, 'dopo Lower A viene Upper B (indice 1), non l\'indice sfasato');
    // stessa struttura (cambia solo un esercizio): stesso programId
    const same = JSON.parse(JSON.stringify(S.getActiveProgram()));
    same.days[0].exercises[0].sets = 4;
    eq(S.saveEditedProgram(same).metadata.programId, saved.metadata.programId);
});

test('R3-05 / R3-06 / R3-14: peso dalla stessa famiglia, calibrazione distribuita con coda, prossimo cardio', () => {
    const now = D(2026, 10, 15, 10);
    const env = makeEnv({ now, algorithm: 'real', seed: {
        gymtracker_profile: { name: 'Lui', gender: 'male', weight: 85, level: 'intermediate', goal: 'hypertrophy', equipment: ['bilanciere', 'manubri', 'macchine', 'cavi', 'panca', 'sbarra'] },
        gymtracker_workouts: [workout(now - 2 * DAY, [['bench-press', [[80, 8], [80, 8]]], ['squat', [[100, 8]]]])]
    } });
    const { S, TA } = env;
    env.DB_TYPE = (id) => env.run(`EXERCISES_DB['${id}'].type`);
    const db = S.getProgressionSuggestion('dumbbell-bench-press', '8-12', 'hypertrophy');
    eq([db.status, db.suggestedWeight, db.convertedFrom, db.calibrate], ['new', 32, 'bench-press', false], 'panca → manubri ×0,415');
    eq(S.getProgressionSuggestion('front-squat', '6-10', 'hypertrophy').suggestedWeight, 80, 'squat 100 → front squat ×0,8');
    const fresh = S.getProgressionSuggestion('lat-pulldown', '8-12', 'hypertrophy');
    eq([fresh.status, fresh.calibrate, fresh.suggestedReps], ['new', true, 10], 'multiarticolare mai fatto: Trova il peso anche per l\'intermedio, rep della prova');
    // calibrazione distribuita: al massimo 3 per seduta (60'), prima il fondamentale
    const prog = TA.generateProgram(S.getProfile(), { goal: 'hypertrophy', daysPerWeek: 4, split: 'upper-lower', sessionDuration: 60 });
    S.setActiveProgram(prog);
    const day = prog.days.find(d => d.exercises.filter(e => e.type === 'compound').length >= 4) || prog.days[0];
    const plan = S.planCalibration(day);
    ok(plan.calibrate.length <= 3 && plan.calibrate.length > 0, 'al massimo 3');
    ok(plan.calibrate.every(id => env.DB_TYPE(id) === 'compound'), 'intermedio: solo multiarticolari');
    const firstNew = day.exercises.find(e => e.role === 'main' && e.exerciseId !== 'bench-press');
    if (firstNew) eq(plan.calibrate[0], firstNew.exerciseId, 'prima il fondamentale');
    ok(plan.extraMin > 0 && plan.extraMin < 20, 'minuti in più: ' + plan.extraMin);
    ok(plan.deferred.every(id => S._calibrationQueue()[id]), 'gli altri in coda');
    if (plan.deferred.length) {
        const id = plan.deferred[0];
        S.saveWorkout({ name: 'x', type: day.type, exercises: [{ exerciseId: id, sets: [{ weight: 20, reps: 10, completed: true, rir: 4 }] }] });
        const sug = S.getProgressionSuggestion(id, '8-12', 'hypertrophy');
        eq([sug.calibrate, sug.calibrateQueued], [true, true], 'alla seduta dopo: Trova il peso');
        S.saveWorkout({ name: 'x', type: day.type, exercises: [{ exerciseId: id, sets: [{ weight: 30, reps: 10, completed: true, rir: 2, isCalibration: true }, { weight: 30, reps: 10, completed: true }] }] });
        ok(!S._calibrationQueue()[id], 'calibrato → fuori dalla coda');
    }
    // cardio: tonificazione intermedia 1 HIIT + 2 LISS → LISS, HIIT, LISS (prima il tipo con più sedute mancanti)
    S.saveProfile({ goal: 'toning', level: 'intermediate', gender: 'female' });
    S.setActiveProgram(TA.generateProgram(S.getProfile(), { goal: 'toning', daysPerWeek: 3, split: 'upper-lower', sessionDuration: 60 }));
    const seq = [];
    for (let i = 0; i < 3; i++) { const n = S.getNextCardio(); seq.push(n.type + n.minutes); S.saveConditioningSession({ type: n.type, durationSec: n.minutes * 60 }); }
    eq(seq, ['liss30', 'hiit10', 'liss30']);
    const n = S.getNextCardio();
    ok(n.complete && n.notes.length > 0, 'settimana fatta, regole da mostrare');
});

test('Ciclo con l\'algoritmo VERO (se si carica): generateProgram → completeCycle', () => {
    let env;
    try {
        env = makeEnv({ now: D(2026, 10, 15, 10), algorithm: 'real' });
    } catch (e) {
        return 'SALTATO (algorithm.js non si carica ora: ' + e.message.split('\n')[0] + ')';
    }
    const TA = env.TA;
    if (!TA || typeof TA.generateProgram !== 'function') return 'SALTATO (generateProgram assente)';
    let prog;
    try {
        prog = TA.generateProgram(env.S.getProfile(), { goal: 'toning', daysPerWeek: 3, split: 'upper-lower', sessionDuration: 60, cycleNumber: 1 });
    } catch (e) {
        return 'SALTATO (generateProgram lancia: ' + e.message + ')';
    }
    if (prog && prog.program) prog = prog.program;
    if (!prog || !Array.isArray(prog.days) || !prog.metadata || !prog.metadata.cycle) return 'SALTATO (scheda senza ciclo)';
    prog.metadata.cycle.startDate = new Date(D(2026, 8, 1, 0)).toISOString();
    env.S.setActiveProgram(prog);
    ok(env.S.shouldCompleteCycle());
    const r = env.S.completeCycle();
    ok(r && r.completedCycle, 'chiuso');
    const c = env.S.getCycleInfo();
    eq([c.currentWeek, c.cycleNumber], [1, 2]);
    ok(env.S.getActiveProgram().days.length > 0, 'scheda con giorni');
    return r.rotation ? `rotazione: +${r.rotation.added.length} −${r.rotation.removed.length}` : 'rotazione null (ripiego)';
});

// ============================================================
// 10. Conditioning
// ============================================================
test('Conditioning: tipi maiuscoli/minuscoli, vecchi campi, salvataggio nuovo', () => {
    const now = D(2026, 10, 15, 10);
    const seed = {
        gymtracker_conditioning: [
            { id: 1, type: 'HIIT', duration: 20, calories: 200, date: new Date(now - DAY).toISOString() },
            { id: 2, type: 'liss', protocol: 'circuit30', activity: 'walking', duration: 30, calories: 150, date: new Date(now - 2 * DAY).toISOString() },
            { id: 3, type: 'hiit', actualDuration: 900, estimatedCalories: 100, manualCalories: 120, date: new Date(now - 3 * DAY).toISOString() }
        ]
    };
    const { S, get } = makeEnv({ now, seed });
    const ss = S.getConditioningSessions();
    eq(ss.map(s => s.type), ['hiit', 'liss', 'hiit']);
    eq(ss.map(s => s.durationSec), [1200, 1800, 900]);
    eq(ss.map(s => s.calories), [200, 150, 120], 'manuali > stimate');
    eq(ss[1].protocol, null, 'LISS senza protocollo');
    const st = S.getConditioningStatistics();
    eq([st.hiitCount, st.lissCount, st.totalDuration, st.totalCalories], [2, 1, 65, 470]);
    eq(get('gymtracker_conditioning')[0].type, 'HIIT', 'i dati salvati non vengono riscritti');
    const rec = S.saveConditioningSession({ type: 'LISS', protocol: 'tabata', activity: 'bike', exercises: [], durationSec: 1500, estimatedCalories: 180, manualCalories: 210, notes: 'Apple Watch' });
    eq([rec.type, rec.protocol, rec.duration, rec.calories, rec.manualCalories, rec.notes], ['liss', null, 25, 210, 210, 'Apple Watch']);
    const h = S.saveConditioningSession({ type: 'hiit', protocol: 'tabata', durationSec: 600, estimatedCalories: 90, manualCalories: null });
    eq([h.protocol, h.calories, h.manualCalories], ['tabata', 90, null]);
    ok(S.deleteConditioningSession(String(h.id)));
    eq(S.getConditioningSessions().length, 4);
});

// ============================================================
// 11. Migrazione di un telefono con la v1.25: niente perso
// ============================================================
test('Migrazione completa v1.25: tutte le chiavi restano, PR vecchi conservati in meta', () => {
    const now = D(2026, 10, 15, 10);
    const seed = fullSeed(now);
    delete seed.gymtracker_corrupt_settings;
    seed.gymtracker_profile = { ...seed.gymtracker_profile, goal: 'cut' };
    seed.gymtracker_prs = { 'goblet-squat': { maxWeight: 1000, estimated1RM: 9, history: [] } };
    seed.gymtracker_programs = [];
    const keysBefore = Object.keys(seed).sort();
    const env = makeEnv({ now, seed });
    keysBefore.forEach(k => ok(env.ls.getItem(k) !== null, 'chiave ancora presente: ' + k));
    eq(env.get('gymtracker_workouts'), seed.gymtracker_workouts, 'allenamenti identici');
    eq(env.get('gymtracker_conditioning'), seed.gymtracker_conditioning, 'cardio identico');
    eq(env.get('gymtracker_cycle_history'), seed.gymtracker_cycle_history);
    eq(env.get('gymtracker_measurements'), seed.gymtracker_measurements);
    eq(env.get('gymtracker_profile'), seed.gymtracker_profile, 'profilo non riscritto all\'avvio');
    eq(env.S.getPersonalRecords()['goblet-squat'].maxWeight, 10, 'PR ricalcolati');
    ok(env.get('gymtracker_meta').prsBeforeV126.includes('1000'), 'vecchi PR conservati');
    eq(env.get('gymtracker_meta').schemaVersion, 2);
    ok(env.get('gymtracker_active_program').metadata.programId > 0, 'la scheda vecchia riceve un programId');
    eq(env.get('gymtracker_active_program').days, seed.gymtracker_active_program.days, 'giorni della scheda intatti');
    // Seconda apertura: niente da rifare
    const snap = env.ls._snapshot();
    env.S.migrate();
    eq(env.ls._snapshot(), snap, 'migrazione idempotente');
});

// ============================================================
// 12. Timer
// ============================================================
function timerEnv(settings = {}, browser = {}) {
    return makeEnv({ seed: { gymtracker_settings: { restSound: 'beep', vibration: true, ...settings } }, browser });
}

test('Timer: riposo a timestamp, avviso −10 s, zero una volta, overtime fino a +5:00 poi si ferma', () => {
    const env = timerEnv();
    const { T, clock, calls } = env;
    const ticks = [], zeros = [], stops = [];
    T.startRest({ seconds: 30, onTick: (r, t) => ticks.push([r, t]), onZero: () => zeros.push(clock.get()), onStop: r => stops.push(r) });
    eq(ticks[0], [30, 30], 'tick immediato');
    ok(T.isRestRunning());
    eq(T.getRestState().kind, 'rest');
    clock.advance(20000);
    eq(calls.vibrate[0], [120, 60, 120], 'vibrazione a −10 s');
    clock.advance(10000);
    eq(zeros.length, 1, 'zero');
    eq(calls.vibrate[1], [200, 100, 200]);
    clock.advance(130000);
    ok(T.isRestRunning(), 'vivo oltre +2:00 (prima si congelava)');
    eq(ticks[ticks.length - 1][0], -130, 'display aggiornato in overtime');
    clock.advance(170000);
    ok(!T.isRestRunning(), 'fermo a +5:00');
    eq(stops, ['overtime']);
    eq(T.getRestState(), null);
    const n = ticks.length;
    clock.advance(5000);
    eq(ticks.length, n, 'nessun tick dopo lo stop');
    eq(zeros.length, 1, 'zero una volta sola');
    eq(env.calls.notif.length, 0, 'notifiche spente per default');
    eq(env.calls.reqPerm, 0, 'permesso MAI chiesto in automatico');
});

test('Timer: ±15 anche in overtime, −15 oltre lo zero, background congelato', () => {
    const { T, clock, document } = timerEnv();
    const ticks = [], zeros = [];
    T.startRest({ seconds: 30, onTick: r => ticks.push(r), onZero: () => zeros.push(1) });
    clock.advance(50000);
    eq(T.getRestState().remaining, -20);
    T.adjustRest(15);
    eq(T.getRestState().remaining, -5, '+15 in overtime');
    T.adjustRest(15);
    eq(T.getRestState().remaining, 10, 'torna in positivo');
    clock.advance(10000);
    eq(zeros.length, 2, 'lo zero si ri-arma');
    T.stopRest();
    T.startRest({ seconds: 60, onTick: r => ticks.push(r), onZero: () => zeros.push(1) });
    clock.advance(48000);
    T.adjustRest(-15);
    eq(zeros.length, 3, '−15 con 12 s rimasti → zero subito');
    T.stopRest();
    // App in background: i timer JS si fermano, l'orologio no
    T.startRest({ seconds: 90, onTick: r => ticks.push(r) });
    document.visibilityState = 'hidden';
    clock.advance(40000, true);
    document.visibilityState = 'visible';
    document._dispatch('visibilitychange');
    eq(ticks[ticks.length - 1], 50, 'al ritorno il tempo è esatto');
    T.stopRest();
});

test('Timer: transizione superset, sostituzione, stop dal callback, ripresa dopo ricarica', () => {
    const env = timerEnv();
    const { T, clock, calls } = env;
    const stops = [];
    T.startRest({ seconds: 15, kind: 'transition', onStop: r => stops.push(r) });
    eq(T.getRestState().kind, 'transition');
    T.startRest({ seconds: 90, onStop: r => stops.push(r) });
    eq(stops, ['replaced'], 'il vecchio riceve replaced');
    eq(T.getRestState().kind, 'rest');
    const ticksAfter = [];
    T.startRest({ seconds: 5, kind: 'transition', onZero: () => T.stopRest(), onTick: r => ticksAfter.push(r) });
    clock.advance(6000);
    ok(!T.isRestRunning(), 'fermato dal callback');
    ok(!ticksAfter.includes(0), 'nessun tick dopo lo stop nel callback');
    const v = calls.vibrate.length;
    const zeros = [];
    T.startRest({ endTime: clock.get() - 5000, total: 90, onZero: () => zeros.push(1) });
    eq([T.getRestState().remaining, T.getRestState().total, zeros.length], [-5, 90, 1], 'ripreso in overtime');
    eq(calls.vibrate.length, v, 'senza segnali doppi');
    T.stopRest();
});

test('Timer: nomi della v1.25 (startRestTimer, adjustRestTime, skipRest, restTimer)', () => {
    const { T, clock } = timerEnv();
    const ticks = [];
    let completed = 0;
    T.callbacks.onRestComplete = () => completed++;
    T.startRestTimer(60, (r, t) => ticks.push([r, t]), () => {});
    ok(T.restTimer, 'restTimer valorizzato');
    eq(ticks[0], [60, 60]);
    T.adjustRestTime(15);
    eq(T.restTimeRemaining, 75);
    eq(T.restTimeTotal, 75);
    clock.advance(1000);
    T.skipRest();
    eq([completed, T.restTimer], [1, null]);
    T.stopRestTimer();
    eq(T.formatRestTime(75), '1:15');
    eq(T.formatRestTime(-15), '+15');
    eq(T.formatTime(3725), '01:02:05');
});

test('Timer: suono beep / campana / nessuno nei toni programmati', () => {
    const count = sound => {
        const env = timerEnv({ restSound: sound });
        env.T.startRest({ seconds: 30 });
        const active = env.calls.tones.filter(o => !o.cancelled);
        env.T.stopRest();
        return active.map(o => o.frequency.value);
    };
    eq(count('none'), [], 'nessun suono');
    eq(count('beep'), [660, 880, 880, 1320], 'beep: avviso + tre bip');
    const bell = count('bell');
    ok(bell.length === 6 && bell.includes(1318.5) && !bell.includes(660), 'campana diversa dal beep: ' + bell);
    const short = timerEnv();
    short.T.startRest({ seconds: 8 });
    eq(short.calls.tones.filter(o => !o.cancelled).length, 3, 'riposo corto: niente avviso −10');
    const env = timerEnv({ restSound: 'none' });
    env.T.playCompletionSound();
    eq(env.calls.tones.length, 0, 'suono del PR rispetta "nessuno"');
});

test('Timer: notifiche solo in background e solo se scelte; permesso solo su richiesta', async () => {
    const env = timerEnv({ notifications: true }, { permission: 'granted' });
    const { T, clock, document, calls } = env;
    T.startRest({ seconds: 30 });
    clock.advance(31000);
    eq(calls.notif.length, 0, 'app in primo piano: nessuna notifica');
    T.stopRest();
    document.visibilityState = 'hidden';
    T.startRest({ seconds: 30 });
    clock.advance(31000);
    eq(calls.notif.length, 2, 'in background: −10 s e zero');
    T.stopRest();
    const off = timerEnv({ notifications: false }, { permission: 'granted' });
    off.document.visibilityState = 'hidden';
    off.T.startRest({ seconds: 30 });
    off.clock.advance(31000);
    eq(off.calls.notif.length, 0, 'impostazione spenta');
    const ask = timerEnv({}, { permission: 'default' });
    ask.T.startRest({ seconds: 5 });
    ask.clock.advance(6000);
    eq(ask.calls.reqPerm, 0, 'il timer non chiede il permesso');
    eq(await ask.T.requestNotificationPermission(), 'granted');
    eq(ask.calls.reqPerm, 1, 'chiesto solo dall\'interruttore');
});

test('Timer: keep-alive solo con backgroundAlerts, sessione audio ambient, vibrazione assente', () => {
    const off = timerEnv({ backgroundAlerts: false });
    off.T.startRest({ seconds: 30 });
    eq(off.calls.audio, 0, 'nessun <audio> muto di default (Spotify non si ferma)');
    eq(off.navigator.audioSession.type, 'ambient', 'sessione audio ambient');
    off.T.stopRest();
    const on = timerEnv({ backgroundAlerts: true });
    on.T.startRest({ seconds: 30 });
    eq([on.calls.audio, on.calls.audioPlay], [1, 1], 'keep-alive se scelto');
    on.T.stopRest();
    const iphone = timerEnv({}, { vibrate: false });
    iphone.T.startRest({ seconds: 12 });
    iphone.clock.advance(13000);
    ok(!iphone.T.canVibrate());
    eq(iphone.T.vibrate([100]), false, 'nessun errore senza navigator.vibrate');
    const novib = timerEnv({ vibration: false });
    novib.T.startRest({ seconds: 12 });
    novib.clock.advance(13000);
    eq(novib.calls.vibrate.length, 0, 'vibrazione spenta nelle impostazioni');
});

test('Timer: wake lock acquisito, riacquisito al ritorno, rilasciato; rispetta keepAwake', async () => {
    const env = timerEnv({ keepAwake: true });
    const { T, calls, document } = env;
    eq(await T.keepScreenOn(true), true);
    eq(calls.wake, 1);
    ok(T.isScreenKeptOn());
    calls.lastLock.release();               // il sistema lo rilascia (app in background)
    ok(!T.isScreenKeptOn());
    document.visibilityState = 'visible';
    document._dispatch('visibilitychange');
    await flush();
    eq(calls.wake, 2, 'riacquisito al ritorno in primo piano');
    await T.keepScreenOn(false);
    ok(!T.isScreenKeptOn(), 'rilasciato');
    document._dispatch('visibilitychange');
    await flush();
    eq(calls.wake, 2, 'non riacquisito dopo keepScreenOn(false)');
    const off = timerEnv({ keepAwake: false });
    eq(await off.T.keepScreenOn(true), false);
    eq(off.calls.wake, 0, 'keepAwake spento');
});

test('Timer: durata allenamento a timestamp e ripresa da un orario salvato', () => {
    const { T, clock } = timerEnv();
    const shown = [];
    T.startWorkoutTimer(t => shown.push(t), clock.get() - 65000);
    eq(shown[0], '00:01:05');
    clock.advance(60000, true);              // background
    eq(T.getWorkoutDuration(), 125, 'durata esatta anche coi timer fermi');
    eq(T.stopWorkoutTimer(), 125);
    T.startRest({ seconds: 30 });
    T.startWorkoutTimer(() => {});
    T.stopAll();
    ok(!T.isRestRunning() && !T.workoutTimer, 'stopAll ferma tutto');
});

test('Migrazione: ciclo v1.25 con fasi sbagliate (durata 5, 6 fasi) → 5 fasi con scarico finale', () => {
    const ph = (week, phase) => ({ week, phase, phaseName: phase, rirTarget: phase === 'deload' ? { min: 4, max: 5 } : (phase === 'intensification' ? { min: 0, max: 2 } : { min: 2, max: 4 }), volumeMultiplier: phase === 'deload' ? 0.5 : (phase === 'intensification' ? 0.9 : 1) });
    const program = { name: 'Upper/Lower', days: [{ name: 'Upper A', type: 'Upper A', exercises: [{ exerciseId: 'bench-press', name: 'Panca', sets: 3, reps: '8-12', rest: 120 }] }],
        metadata: { goal: 'hypertrophy', split: 'upper-lower', daysPerWeek: 4, level: 'intermediate',
            cycle: { duration: 5, currentWeek: 1, startDate: new Date(2026, 9, 12).toISOString(), isDeloadActive: false,
                phases: ['accumulation', 'accumulation', 'accumulation', 'intensification', 'intensification', 'deload'].map((p, i) => ph(i + 1, p)) } } };
    const env = makeEnv({ seed: { gymtracker_active_program: program } });
    const c = env.S.getCycleInfo();
    eq(c.phases.length, 5);
    eq(c.phases.map(p => p.phase), ['accumulation', 'accumulation', 'intensification', 'intensification', 'deload']);
    eq(c.phases.map(p => p.week), [1, 2, 3, 4, 5]);
    env.S.migrate();
    eq(env.S.getCycleInfo().phases.length, 5);
});

test('Storage.requestPersistence chiama navigator.storage.persist una volta', async () => {
    const env = makeEnv();
    let n = 0;
    env.navigator.storage.persist = () => { n++; return Promise.resolve(true); };
    eq(await env.S.requestPersistence(), true);
    await env.S.requestPersistence();
    eq(n, 1);
});

// ============================================================
// Esecuzione
// ============================================================
(async () => {
    let failed = 0;
    for (const t of tests) {
        try {
            const note = await t.fn();
            results.push(`  ok   ${t.name}${typeof note === 'string' ? '  — ' + note : ''}`);
        } catch (e) {
            failed++;
            results.push(`  FAIL ${t.name}\n       ${e instanceof AssertError ? e.message : (e && e.stack) || e}`);
        }
    }
    console.log(results.join('\n'));
    console.log(`\n${tests.length - failed}/${tests.length} test superati${failed ? `, ${failed} FALLITI` : ''}`);
    process.exit(failed ? 1 : 0);
})();
