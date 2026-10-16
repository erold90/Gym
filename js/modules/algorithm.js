/**
 * GymTracker Pro - Training Algorithm (v1.26.0)
 *
 * Genera le schede come farebbe un allenatore: prima decide QUANTO volume serve a ogni muscolo
 * nella settimana, poi lo distribuisce nei giorni dello split dentro il tempo che la persona ha.
 *
 * Principi (con le fonti):
 * - Volume: serie DIRETTE per muscolo a settimana dentro il range del livello
 *   (Schoenfeld 2017 dose-risposta; Pelland 2025 meta-regressione: rendimenti decrescenti,
 *   le serie indirette contano circa la metà). Più tempo = più vicino al massimo del livello.
 * - Frequenza: ogni muscolo grande almeno 2 volte a settimana (Schoenfeld 2016; Ralston 2023),
 *   tetto di ~10 serie dirette per muscolo per seduta (oltre, rendimenti molto bassi).
 * - Ordine: multiarticolari prima dei monoarticolari (Simão 2012; Nunes 2021: l'esercizio fatto
 *   per primo guadagna più forza), superset dopo i fondamentali.
 * - Specificità: forza con carichi alti e recuperi lunghi sui fondamentali (Lopez 2021; de Salles
 *   2009), ipertrofia su uno spettro di carichi 6-15 (Schoenfeld 2021), resistenza 15-25 e recuperi
 *   brevi, tonificazione con priorità alla parte inferiore (glutei ≥2-3×/sett, Contreras/Plotkin 2023).
 * - Riposi: >60-90 s bastano per l'ipertrofia (Singer 2024), 2-4 min sui fondamentali di forza;
 *   le donne recuperano prima tra le serie (Hunter 2014): −15%, minimo 45 s.
 * - Esercizi a corpo libero: stessa crescita del bilanciere se vicini al cedimento (Kikuchi 2017),
 *   quindi range di ripetizioni più alti.
 */

const TrainingAlgorithm = {

    // ========================================
    // CONFIGURAZIONE
    // ========================================

    // Serie dirette per muscolo grande a settimana (range produttivo per livello)
    VOLUME_CONFIG: {
        beginner: { min: 8, optimal: 10, max: 12 },
        intermediate: { min: 10, optimal: 14, max: 16 },
        advanced: { min: 12, optimal: 16, max: 20 },
        expert: { min: 14, optimal: 18, max: 22 }
    },

    // Addome: serie dirette a settimana per livello (su 2-3 giorni, mai doppioni)
    CORE_VOLUME: { beginner: 6, intermediate: 8, advanced: 10, expert: 12 },

    // Ripetizioni per obiettivo e ruolo dell'esercizio.
    // main = fondamentale del giorno (primo multiarticolare), compound = altri multiarticolari.
    // Forza: fondamentali 3-5 (Lopez 2021), complementari 5-8, accessori 8-12 come nei programmi
    // a livelli (meno stress articolare sui monoarticolari).
    REP_RANGES: {
        strength: { main: { min: 3, max: 5 }, compound: { min: 5, max: 8 }, isolation: { min: 8, max: 12 } },
        hypertrophy: { main: { min: 6, max: 10 }, compound: { min: 8, max: 12 }, isolation: { min: 10, max: 15 } },
        recomp: { main: { min: 6, max: 10 }, compound: { min: 8, max: 12 }, isolation: { min: 10, max: 15 } },
        endurance: { main: { min: 12, max: 15 }, compound: { min: 15, max: 20 }, isolation: { min: 15, max: 25 } },
        toning: { main: { min: 8, max: 12 }, compound: { min: 8, max: 12 }, isolation: { min: 12, max: 15 }, glute_accessory: { min: 12, max: 20 } }
    },

    // Corpo libero: "leggeri" (push-up, squat a corpo libero…) e "duri" (trazioni, dip, pistol…)
    BODYWEIGHT_REPS: {
        light: { strength: '8-12', hypertrophy: '12-20', recomp: '12-20', endurance: '20-30', toning: '15-20' },
        hard: { strength: '5-8', hypertrophy: '6-12', recomp: '6-12', endurance: '10-15', toning: '6-12' }
    },

    SPECIAL_REP_RANGES: {
        polpacci: { min: 15, max: 20 },
        addome: { min: 12, max: 20 },
        avambracci: { min: 15, max: 20 }
    },

    // Riposi base in secondi (uomo, seduta da 60'). Fonti: Singer 2024, de Salles 2009, Grgic 2017.
    REST_TIMES: {
        strength: { main: 210, compound: 150, isolation: 90 },
        hypertrophy: { main: 150, compound: 105, isolation: 75 },
        recomp: { main: 120, compound: 90, isolation: 60 },
        endurance: { main: 75, compound: 60, isolation: 45 },
        toning: { main: 105, compound: 90, isolation: 60 }
    },
    REST_CALVES: 60,

    // Riscaldamento e defaticamento: durate reali da Warmups (ripiego 8' e 5').
    // Nel PIANO si contano al massimo 10' e 8': in una seduta corta conta il lavoro, e la stima
    // resta comunque entro +15% della durata scelta.
    WARMUP_FALLBACK: 8,
    COOLDOWN_FALLBACK: 5,
    PLAN_WARMUP_CAP: 10,
    PLAN_COOLDOWN_CAP: 8,

    TEMPO: {
        strength: {
            notation: '2-0-X-0',
            description: '2s giù → esplosivo su',
            detail: 'Fase negativa controllata, spingi con forza massima'
        },
        hypertrophy: {
            notation: '3-1-1-0',
            description: '3s giù → 1s pausa → esplosivo su',
            detail: 'Eccentrica controllata 3s, pausa breve in allungamento, concentrica esplosiva (PMC10801605)'
        },
        recomp: {
            notation: '2-1-2-0',
            description: '2s giù → 1s pausa → 2s su',
            detail: 'Bilanciato tra controllo e intensità'
        },
        endurance: {
            notation: '2-0-1-0',
            description: '2s giù → 1s su',
            detail: 'Movimento fluido e continuo'
        },
        toning: {
            notation: '3-1-1-0',
            description: '3s giù → 1s pausa → esplosivo su',
            detail: 'Eccentrica controllata per massima attivazione muscolare e definizione (Schoenfeld 2021)'
        }
    },

    // Mesociclo: durata per obiettivo e livello. Fasi (buildCycle): accumulo, intensificazione,
    // e SEMPRE una settimana di deload alla fine.
    CYCLE_CONFIG: {
        duration: {
            strength: { beginner: 4, intermediate: 6, advanced: 8, expert: 8 },
            hypertrophy: { beginner: 4, intermediate: 5, advanced: 6, expert: 6 },
            recomp: { beginner: 4, intermediate: 5, advanced: 6, expert: 6 },
            endurance: { beginner: 3, intermediate: 4, advanced: 5, expert: 5 },
            toning: { beginner: 4, intermediate: 5, advanced: 5, expert: 6 }
        },
        // RIR per fase (Robinson 2024; Helms/RP)
        rirTargets: {
            accumulation: { min: 2, max: 4 },
            intensification: { min: 0, max: 2 },
            deload: { min: 4, max: 5 }
        },
        volumeMultiplier: {
            accumulation: 1.0,
            intensification: 0.9,
            deload: 0.5
        },
        phaseNames: {
            accumulation: 'Accumulo',
            intensification: 'Intensificazione',
            deload: 'Deload'
        }
    },

    PUSH_MUSCLES: ['petto', 'spalle', 'tricipiti'],
    PULL_MUSCLES: ['schiena', 'bicipiti', 'avambracci', 'trapezio'],
    LEG_MUSCLES: ['quadricipiti', 'femorali', 'glutei', 'polpacci'],
    CORE_MUSCLES: ['addome'],
    BIG_MUSCLES: ['petto', 'schiena', 'spalle', 'quadricipiti', 'femorali', 'glutei'],
    LOWER_MUSCLES: ['quadricipiti', 'femorali', 'glutei', 'polpacci'],
    UPPER_MUSCLES: ['petto', 'schiena', 'spalle', 'bicipiti', 'tricipiti', 'trapezio', 'avambracci'],

    // ========================================
    // SCHEMI DI MOVIMENTO
    // Ogni schema ha il muscolo che serve (m) e gli esercizi in ordine di preferenza.
    // La scelta filtra attrezzatura (TUTTA quella richiesta), difficoltà e doppioni del giorno;
    // `alt` è lo schema di ripiego quando nessun esercizio è possibile.
    // ========================================
    PATTERNS: {
        squat: { m: 'quadricipiti', ids: ['squat', 'hack-squat', 'leg-press', 'smith-squat', 'front-squat', 'goblet-squat', 'bodyweight-squat'] },
        quad2: { m: 'quadricipiti', ids: ['leg-press', 'hack-squat', 'smith-squat', 'goblet-squat', 'front-squat', 'squat', 'bodyweight-squat', 'jump-squat'] },
        lunge: { m: 'quadricipiti', ids: ['bulgarian-split-squat', 'dumbbell-lunge', 'walking-lunge', 'step-up', 'bulgarian-split-squat-bb', 'pistol-squat'] },
        quadIso: { m: 'quadricipiti', ids: ['leg-extension'], alt: 'lunge' },
        hinge: { m: 'femorali', ids: ['romanian-deadlift', 'dumbbell-rdl', 'stiff-leg-deadlift', 'good-morning', 'single-leg-rdl'] },
        hinge2: { m: 'femorali', ids: ['dumbbell-rdl', 'stiff-leg-deadlift', 'single-leg-rdl', 'good-morning', 'romanian-deadlift'] },
        deadlift: { m: 'schiena', ids: ['deadlift', 'romanian-deadlift', 'dumbbell-rdl', 'single-leg-rdl'] },
        hamCurl: { m: 'femorali', ids: ['leg-curl-seated', 'leg-curl-lying', 'nordic-curl', 'glute-ham-raise'], alt: 'hinge2' },
        hipThrust: { m: 'glutei', ids: ['hip-thrust', 'dumbbell-hip-thrust', 'sumo-deadlift', 'glute-bridge', 'single-leg-glute-bridge'] },
        gluteIso: { m: 'glutei', ids: ['hip-abduction', 'cable-kickback', 'glute-kickback-machine', 'fire-hydrant', 'donkey-kick'] },
        calves: { m: 'polpacci', ids: ['standing-calf-raise', 'seated-calf-raise', 'leg-press-calf-raise', 'single-leg-calf-raise', 'bodyweight-calf-raise'] },
        hPush: { m: 'petto', ids: ['bench-press', 'dumbbell-bench-press', 'chest-press-machine', 'smith-bench-press', 'dips', 'push-up', 'decline-push-up'] },
        inclPush: { m: 'petto', ids: ['dumbbell-incline-press', 'incline-bench-press', 'incline-chest-press-machine', 'decline-push-up', 'push-up', 'wide-push-up'] },
        vPush: { m: 'spalle', ids: ['overhead-press', 'dumbbell-shoulder-press', 'shoulder-press-machine', 'arnold-press', 'pike-push-up', 'handstand-push-up'] },
        hPull: { m: 'schiena', ids: ['barbell-row', 'seated-cable-row', 'dumbbell-row', 'machine-row', 't-bar-row', 'dumbbell-row-two-arm', 'inverted-row'], alt: 'backBw' },
        vPull: { m: 'schiena', ids: ['lat-pulldown', 'pull-up', 'chin-up', 'lat-pulldown-close', 'neutral-grip-pull-up', 'assisted-pull-up'], alt: 'hPull' },
        backBw: { m: 'schiena', ids: ['superman'] },
        latIso: { m: 'schiena', ids: ['straight-arm-pulldown', 'dumbbell-pullover'] },
        chestIso: { m: 'petto', ids: ['cable-crossover', 'pec-deck', 'dumbbell-fly', 'cable-fly-low', 'dumbbell-incline-fly', 'cable-fly-mid'], alt: 'chestBw' },
        chestBw: { m: 'petto', ids: ['wide-push-up', 'decline-push-up', 'push-up'] },
        lateral: { m: 'spalle', ids: ['lateral-raise', 'cable-lateral-raise', 'lateral-raise-machine'], alt: 'upright' },
        upright: { m: 'spalle', ids: ['upright-row'] },
        rearDelt: { m: 'spalle', ids: ['face-pull', 'reverse-pec-deck', 'rear-delt-fly', 'cable-rear-delt'] },
        biceps: { m: 'bicipiti', ids: ['barbell-curl', 'dumbbell-curl', 'cable-curl', 'incline-curl', 'hammer-curl', 'preacher-curl', 'ez-bar-curl', 'bicep-curl-machine', 'concentration-curl', 'spider-curl', 'cable-hammer-curl'], alt: 'bicepsBw' },
        bicepsBw: { m: 'bicipiti', ids: ['chin-up'] },
        triceps: { m: 'tricipiti', ids: ['rope-pushdown', 'overhead-cable-extension', 'skull-crusher', 'tricep-pushdown', 'dumbbell-tricep-extension', 'dumbbell-kickback', 'tate-press', 'tricep-dip-machine', 'close-grip-push-up', 'bench-dips', 'diamond-push-up'] },
        tricepsC: { m: 'tricipiti', ids: ['close-grip-bench', 'dips', 'tricep-dip-machine', 'bench-dips', 'close-grip-push-up'] },
        // Addome per regione (reclutamento regionale del retto, PMC10824285; obliqui e core
        // profondo a parte; l'addome risponde al sovraccarico come gli altri muscoli)
        coreLower: { m: 'addome', ids: ['hanging-leg-raise', 'leg-raise', 'reverse-crunch', 'v-up'] },
        coreRot: { m: 'addome', ids: ['cable-woodchop', 'side-plank', 'russian-twist', 'bicycle-crunch'] },
        coreUpper: { m: 'addome', ids: ['cable-crunch', 'ab-crunch-machine', 'crunch', 'bicycle-crunch'] },
        coreAnti: { m: 'addome', ids: ['ab-wheel-rollout', 'plank', 'dead-bug', 'mountain-climber'] }
    },

    CORE_REGIONS: ['coreLower', 'coreRot', 'coreUpper', 'coreAnti'],

    // Prescrizioni dell'addome (ripetizioni o secondi)
    CORE_REPS: {
        'hanging-leg-raise': '8-12', 'leg-raise': '10-15', 'reverse-crunch': '12-15', 'v-up': '10-15',
        'cable-woodchop': '10-12', 'side-plank': '20-40', 'russian-twist': '16-24', 'bicycle-crunch': '20-30',
        'cable-crunch': '10-15', 'ab-crunch-machine': '10-15', 'crunch': '15-20',
        'ab-wheel-rollout': '8-12', 'plank': '30-45', 'dead-bug': '8-12', 'mountain-climber': '20-30'
    },
    CORE_LOADED: ['hanging-leg-raise', 'cable-crunch', 'ab-crunch-machine', 'ab-wheel-rollout', 'cable-woodchop'],

    // Esercizi fatti un lato alla volta (tempo per serie quasi doppio)
    UNILATERAL: ['bulgarian-split-squat', 'bulgarian-split-squat-bb', 'dumbbell-lunge', 'walking-lunge', 'step-up',
        'pistol-squat', 'single-leg-rdl', 'single-leg-glute-bridge', 'single-leg-calf-raise', 'dumbbell-row',
        'concentration-curl', 'cable-kickback', 'glute-kickback-machine', 'donkey-kick', 'fire-hydrant',
        'side-plank', 'cable-woodchop', 'dead-bug'],
    // Prescritti in secondi
    TIMED: ['plank', 'side-plank', 'dead-hang', 'farmer-walk'],
    // Corpo libero "duro": range di ripetizioni da carico vero
    HARD_BODYWEIGHT: ['pull-up', 'chin-up', 'neutral-grip-pull-up', 'dips', 'pistol-squat', 'handstand-push-up',
        'nordic-curl', 'pike-push-up', 'diamond-push-up', 'decline-push-up', 'inverted-row'],
    // A corpo libero se non ci sono manubri
    BODYWEIGHT_CAPABLE: ['single-leg-rdl'],
    // Troppo duri per chi comincia se esiste una regressione (rematore inverso, push-up…)
    BEGINNER_AVOID: ['pull-up', 'chin-up', 'neutral-grip-pull-up', 'dips', 'pistol-squat', 'handstand-push-up'],
    // Ripetizioni fisse per esercizi molto duri (eccentrica sovramassimale)
    FIXED_REPS: { 'nordic-curl': '3-6', 'handstand-push-up': '3-8', 'pistol-squat': '5-10' },

    // ========================================
    // SUPERSET
    // ========================================

    // Coppie predefinite (stessa postazione o attrezzi a portata di mano)
    SUPERSET_PAIRS: [
        { exercises: ['bench-press', 'barbell-row'], station: 'bench-barbell', transition: 15 },
        { exercises: ['dumbbell-bench-press', 'dumbbell-row'], station: 'bench-dumbbells', transition: 10 },
        { exercises: ['dumbbell-incline-press', 'dumbbell-row'], station: 'bench-dumbbells', transition: 10 },
        { exercises: ['dumbbell-bench-press', 'dumbbell-row-two-arm'], station: 'dumbbells', transition: 10 },
        { exercises: ['dumbbell-incline-press', 'dumbbell-row-two-arm'], station: 'dumbbells', transition: 10 },
        { exercises: ['chest-press-machine', 'seated-cable-row'], station: 'machines', transition: 15 },
        { exercises: ['chest-press-machine', 'machine-row'], station: 'machines', transition: 15 },
        { exercises: ['incline-chest-press-machine', 'lat-pulldown'], station: 'machines', transition: 15 },
        { exercises: ['dumbbell-shoulder-press', 'lat-pulldown'], station: 'machines', transition: 15 },
        { exercises: ['barbell-curl', 'skull-crusher'], station: 'barbell-bench', transition: 10 },
        { exercises: ['ez-bar-curl', 'skull-crusher'], station: 'barbell-bench', transition: 10 },
        { exercises: ['lateral-raise', 'rear-delt-fly'], station: 'dumbbells', transition: 5 },
        { exercises: ['dumbbell-curl', 'dumbbell-tricep-extension'], station: 'dumbbells', transition: 5 },
        { exercises: ['dumbbell-curl', 'dumbbell-kickback'], station: 'dumbbells', transition: 5 },
        { exercises: ['hammer-curl', 'dumbbell-kickback'], station: 'dumbbells', transition: 5 },
        { exercises: ['hammer-curl', 'dumbbell-tricep-extension'], station: 'dumbbells', transition: 5 },
        { exercises: ['incline-curl', 'tate-press'], station: 'bench-dumbbells', transition: 5 },
        { exercises: ['dumbbell-shoulder-press', 'rear-delt-fly'], station: 'dumbbells', transition: 5 },
        { exercises: ['goblet-squat', 'dumbbell-rdl'], station: 'dumbbells', transition: 5 },
        { exercises: ['dumbbell-lunge', 'single-leg-rdl'], station: 'dumbbells', transition: 5 },
        { exercises: ['dumbbell-lunge', 'dumbbell-rdl'], station: 'dumbbells', transition: 5 },
        { exercises: ['goblet-squat', 'single-leg-rdl'], station: 'dumbbells', transition: 5 },
        { exercises: ['cable-curl', 'tricep-pushdown'], station: 'cable', transition: 10 },
        { exercises: ['cable-curl', 'rope-pushdown'], station: 'cable', transition: 10 },
        { exercises: ['cable-curl', 'overhead-cable-extension'], station: 'cable', transition: 10 },
        { exercises: ['cable-hammer-curl', 'rope-pushdown'], station: 'cable', transition: 10 },
        { exercises: ['cable-crossover', 'straight-arm-pulldown'], station: 'cable', transition: 10 },
        { exercises: ['cable-lateral-raise', 'face-pull'], station: 'cable', transition: 10 },
        { exercises: ['lateral-raise', 'face-pull'], station: 'cable', transition: 10 },
        { exercises: ['pec-deck', 'reverse-pec-deck'], station: 'machine', transition: 10 },
        { exercises: ['leg-extension', 'leg-curl-seated'], station: 'machines', transition: 15 },
        { exercises: ['leg-extension', 'leg-curl-lying'], station: 'machines', transition: 15 },
        { exercises: ['push-up', 'inverted-row'], station: 'bar', transition: 10 },
        { exercises: ['push-up', 'superman'], station: 'floor', transition: 5 },
        { exercises: ['pike-push-up', 'superman'], station: 'floor', transition: 5 },
        { exercises: ['glute-bridge', 'donkey-kick'], station: 'floor', transition: 5 },
        { exercises: ['glute-bridge', 'fire-hydrant'], station: 'floor', transition: 5 },
        { exercises: ['single-leg-glute-bridge', 'fire-hydrant'], station: 'floor', transition: 5 },
        { exercises: ['bodyweight-squat', 'single-leg-rdl'], station: 'floor', transition: 5 },
        { exercises: ['walking-lunge', 'single-leg-rdl'], station: 'floor', transition: 5 }
    ],

    // Coppie di muscoli che non si stancano a vicenda (agonista-antagonista o distanti)
    SUPERSET_MUSCLE_PAIRS: [
        ['petto', 'schiena'], ['bicipiti', 'tricipiti'], ['quadricipiti', 'femorali'],
        ['spalle', 'schiena'], ['spalle', 'bicipiti'], ['spalle', 'tricipiti'], ['glutei', 'spalle']
    ],

    SUPERSET_RULES: {
        strength:    { maxPerDay: 2, allowCompound: false, useGiantSets: false },
        hypertrophy: { maxPerDay: 3, allowCompound: true,  useGiantSets: false },
        recomp:      { maxPerDay: 4, allowCompound: true,  useGiantSets: false },
        toning:      { maxPerDay: 3, allowCompound: true,  useGiantSets: false },
        endurance:   { maxPerDay: 4, allowCompound: true,  useGiantSets: true }   // circuiti (Myers 2023)
    },

    // Mai in superset: fondamentali pesanti e tecnici
    SUPERSET_EXCLUDED: [
        'squat', 'front-squat', 'deadlift', 'romanian-deadlift', 'stiff-leg-deadlift',
        'hip-thrust', 'sumo-deadlift', 'overhead-press', 'push-press', 'good-morning',
        'hack-squat', 'leg-press', 'smith-squat', 'bulgarian-split-squat-bb', 't-bar-row', 'pendlay-row'
    ],

    // Pesi della priorità di uno slot (1 = fondamentale … 5 = addome)
    PRIO_WEIGHT: { 1: 1.6, 2: 1.3, 3: 1.0, 4: 0.75, 5: 0.7 },

    // Offset del ciclo usato dalla vecchia API: si azzera sempre (try/finally)
    _currentCycleOffset: 0,

    // ========================================
    // GENERAZIONE
    // ========================================

    /**
     * generateProgram(profile, {goal, daysPerWeek, split, sessionDuration, cycleNumber = 1})
     * Non lancia per nessuna combinazione del wizard.
     */
    generateProgram(profile, options = {}) {
        const ctx = this._buildContext(profile || {}, options || {});
        this._currentCycleOffset = ctx.cycleNumber - 1;
        try {
            const specs = this._splitDays(ctx);
            const days = specs.map((spec, i) => this._buildDayState(ctx, spec, i));
            this._planCore(ctx, days);
            this._allocate(ctx, days);
            this._spareVolume(ctx, days);
            if (ctx.goal === 'toning') this._enforceLowerShare(ctx, days);
            this._spareRest(ctx, days);

            const program = {
                name: this._programName(ctx),
                days: days.map((d, i) => this._finalizeDay(ctx, d, i))
            };

            program.metadata = {
                programId: Date.now(),
                generatorOptions: {
                    goal: ctx.goal,
                    daysPerWeek: ctx.daysPerWeek,
                    split: ctx.split,
                    sessionDuration: ctx.sessionDuration
                },
                cycleNumber: ctx.cycleNumber,
                goal: ctx.goal,
                split: ctx.split,
                daysPerWeek: ctx.daysPerWeek,
                sessionDuration: ctx.sessionDuration,
                level: ctx.level,
                gender: ctx.gender,
                createdFor: (profile && profile.name) || '',
                algorithmVersion: 2,
                weeklyVolume: this.calculateWeeklyVolume(program),
                tempo: this.TEMPO[ctx.goal] || this.TEMPO.hypertrophy,
                cycle: this.buildCycle(ctx.goal, ctx.level)
            };
            return program;
        } finally {
            this._currentCycleOffset = 0;
        }
    },

    _normalizeGoal(goal) {
        const map = { bulk: 'hypertrophy', cut: 'recomp', maintenance: 'recomp' };
        const g = map[goal] || goal;
        return this.REP_RANGES[g] ? g : 'hypertrophy';
    },

    _isFemale(gender) {
        return /^(female|f|donna|woman)$/i.test(String(gender || '').trim());
    },

    // Attrezzatura posseduta. Chi ha le macchine è in palestra: la panca c'è sempre
    // (nella v1.25 la panca era deselezionata nel profilo di default).
    _normalizeEquipment(list) {
        const eq = new Set(Array.isArray(list) ? list : ['bilanciere', 'manubri', 'macchine', 'cavi', 'panca', 'sbarra']);
        if (eq.has('macchine')) eq.add('panca');
        eq.add('corpo-libero');
        return eq;
    },

    _buildContext(profile, options) {
        const goal = this._normalizeGoal(options.goal || profile.goal || 'hypertrophy');
        const level = this.VOLUME_CONFIG[profile.level] ? profile.level : 'intermediate';
        let daysPerWeek = parseInt(options.daysPerWeek, 10);
        if (!Number.isFinite(daysPerWeek)) daysPerWeek = 4;
        daysPerWeek = Math.max(1, Math.min(6, daysPerWeek));
        let split = options.split || 'upper-lower';
        if (!['upper-lower', 'push-pull-legs', 'full-body'].includes(split)) split = 'upper-lower';
        let sessionDuration = parseInt(options.sessionDuration, 10);
        if (!Number.isFinite(sessionDuration)) sessionDuration = 60;
        sessionDuration = Math.max(30, Math.min(150, sessionDuration));
        let cycleNumber = parseInt(options.cycleNumber, 10);
        if (!Number.isFinite(cycleNumber) || cycleNumber < 1) cycleNumber = 1;

        const female = this._isFemale(profile.gender);
        const eq = this._normalizeEquipment(profile.equipment);
        const loadEquip = ['bilanciere', 'manubri', 'macchine', 'cavi'].some(e => eq.has(e));

        const ctx = {
            goal, level, daysPerWeek, split, sessionDuration, cycleNumber,
            gender: profile.gender || '',
            female, eq, loadEquip,
            strength: goal === 'strength',
            toning: goal === 'toning',
            minExercises: loadEquip ? 4 : 3,
            usage: {}  // quante volte uno schema è già stato usato nella settimana (varietà)
        };
        ctx.restFactor = this._durationRestFactor(sessionDuration) * (female ? 0.85 : 1);
        ctx.targets = this._weeklyTargets(ctx);
        ctx.floors = this._weeklyFloors(ctx);
        ctx.dayCap = this._dayCaps(ctx);
        return ctx;
    },

    // Sedute corte → riposi più brevi (Singer 2024: oltre 60-90 s il guadagno è minimo; Iversen 2021:
    // allenamento efficiente nel tempo = recuperi brevi + superset). Il tempo avanzato nelle sedute
    // lunghe allunga i recuperi dopo (vedi _spareRest).
    _durationRestFactor(dur) {
        if (dur <= 45) return 0.8;
        if (dur < 60) return 0.8 + (dur - 45) / 15 * 0.2;
        return 1;
    },

    // Punto del range di volume in base al tempo: 45' = min, 60' = ottimale, 90' = massimo
    _volumePoint(V, dur) {
        let p;
        if (dur <= 45) p = V.min;
        else if (dur <= 60) p = V.min + (V.optimal - V.min) * (dur - 45) / 15;
        else if (dur < 90) p = V.optimal + (V.max - V.optimal) * (dur - 60) / 30;
        else p = V.max;
        return Math.round(p);
    },

    /**
     * Serie DIRETTE a settimana per muscolo. Muscoli grandi dentro [min−2, max+4] del livello.
     * Ogni ciclo completato aggiunge +1 serie (fino al massimo del livello).
     */
    _weeklyTargets(ctx) {
        const V = this.VOLUME_CONFIG[ctx.level];
        const boost = Math.max(0, ctx.cycleNumber - 1);
        const P = Math.min(V.max, this._volumePoint(V, ctx.sessionDuration) + boost);
        const floor = V.min - 2;
        const ceil = V.max + 4;
        const big = (x) => Math.max(floor, Math.min(V.max, Math.round(x)));
        const advanced = ctx.level === 'advanced' || ctx.level === 'expert';
        const T = {};
        switch (ctx.goal) {
            case 'strength':
                Object.assign(T, {
                    petto: big(P - 2), schiena: big(P - 2), spalle: big(P - 4),
                    quadricipiti: big(P - 2), femorali: big(P - 4), glutei: floor,
                    bicipiti: Math.round(P * 0.4), tricipiti: Math.round(P * 0.4), polpacci: 0
                });
                break;
            case 'recomp':
                Object.assign(T, {
                    petto: big(P - 2), schiena: big(P - 1), spalle: big(P - 4),
                    quadricipiti: big(P - 2), femorali: big(P - 4), glutei: floor,
                    bicipiti: Math.round(P * 0.4), tricipiti: Math.round(P * 0.4), polpacci: 6
                });
                break;
            case 'endurance':
                Object.assign(T, {
                    petto: big(P - 2), schiena: big(P - 2), spalle: big(P - 4),
                    quadricipiti: big(P - 1), femorali: big(P - 4), glutei: floor,
                    bicipiti: Math.round(P * 0.4), tricipiti: Math.round(P * 0.4), polpacci: advanced ? 8 : 6
                });
                break;
            case 'toning':
                // Priorità alla parte inferiore (≥55% del volume diretto), glutei 2-3×/sett.
                // Parte superiore al minimo produttivo, petto compreso (≥6 serie).
                Object.assign(T, {
                    petto: floor, schiena: big(V.min), spalle: floor,
                    quadricipiti: big(P), femorali: big(P - 2),
                    glutei: Math.min(ceil - 1, Math.round(P + 6)),
                    bicipiti: Math.round(P * 0.3), tricipiti: Math.round(P * 0.35), polpacci: 6
                });
                break;
            default: // hypertrophy
                Object.assign(T, {
                    petto: big(P), schiena: big(P), spalle: big(P - 2),
                    quadricipiti: big(P), femorali: big(P - 2), glutei: big(P - 4),
                    bicipiti: Math.round(P * 0.5), tricipiti: Math.round(P * 0.5), polpacci: advanced ? 8 : 6
                });
        }
        T.bicipiti = Math.max(4, T.bicipiti);
        T.tricipiti = Math.max(4, T.tricipiti);
        T.addome = ctx.strength ? 6 : this.CORE_VOLUME[ctx.level];
        T.trapezio = 0;
        T.avambracci = 0;
        return T;
    },

    // Minimi da garantire PRIMA di tutto il resto (riempimento in due tempi: minimi, poi obiettivi)
    _weeklyFloors(ctx) {
        const V = this.VOLUME_CONFIG[ctx.level];
        const T = ctx.targets;
        const F = {};
        this.BIG_MUSCLES.forEach(m => { F[m] = Math.min(T[m], V.min - 2); });
        F.polpacci = Math.min(6, T.polpacci);
        F.bicipiti = Math.min(4, T.bicipiti);
        F.tricipiti = Math.min(4, T.tricipiti);
        if (ctx.toning) {
            // la parte superiore al minimo indispensabile (petto ≥6), la inferiore prima
            F.petto = Math.min(T.petto, 6);
            F.schiena = Math.min(T.schiena, V.min - 2);
            F.spalle = Math.min(T.spalle, Math.max(4, V.min - 4));
            F.bicipiti = Math.min(T.bicipiti, 2);
            F.tricipiti = Math.min(T.tricipiti, 3);
            F.glutei = Math.min(T.glutei, V.min);
        }
        F.addome = Math.min(T.addome, 4);
        return F;
    },

    // Dose minima per muscolo: grandi 4 serie dirette (glutei 6 nella tonificazione); in ipertrofia,
    // ricomposizione e resistenza anche 2 serie dirette per bicipiti e tricipiti
    _miniDose(ctx, m) {
        const armsToo = ['hypertrophy', 'recomp', 'endurance'].includes(ctx.goal) && (m === 'bicipiti' || m === 'tricipiti');
        if (!this.BIG_MUSCLES.includes(m) && !armsToo) return 0;
        const mini = armsToo ? 2 : (ctx.toning && m === 'glutei' ? 6 : 4);
        return Math.min(mini, ctx.floors[m] || 0);
    },

    /**
     * Riequilibrio della dose minima: se un muscolo grande resta sotto la sua dose perché il giorno
     * è pieno, si toglie una serie (o un esercizio) a un muscolo che nello stesso giorno ha margine.
     */
    _rebalanceMini(ctx, days, vol) {
        for (let guard = 0; guard < 40; guard++) {
            let moved = false;
            for (const m of this.BIG_MUSCLES) {
                const mini = this._miniDose(ctx, m);
                if ((vol[m] || 0) >= mini) continue;
                for (const d of days) {
                    const target = d.slots.filter(s => s.m === m && s.prio < 5 && !s.group &&
                        (s.active ? s.sets < s.max : true)).sort((a, b) => (b.active - a.active) || (a.prio - b.prio))[0];
                    if (!target) continue;
                    const need = target.active ? target.tul + target.rest : 30 + 2 * (target.tul + target.rest);
                    const nActive = d.slots.filter(x => x.active && x.prio < 5).length;
                    const keep = (x) => Math.max(this._miniDose(ctx, x.m),
                        x.m === 'polpacci' ? (ctx.floors.polpacci || 0) : 0,
                        ctx.toning && x.m === 'petto' ? Math.min(6, ctx.targets.petto) : 0);
                    const donors = d.slots.filter(x => x.active && x.m !== m && x.role !== 'main' && !x.group && x.prio < 5)
                        .map(x => ({ x, drop: x.sets > 2 ? 1 : x.sets }))
                        .filter(({ x, drop }) => (drop === 1 || nActive > ctx.minExercises) && (vol[x.m] || 0) - drop >= keep(x))
                        .sort((a, b) => ((vol[b.x.m] || 0) - this._miniDose(ctx, b.x.m)) - ((vol[a.x.m] || 0) - this._miniDose(ctx, a.x.m)));
                    // si tocca qualcosa solo se le serie tolte bastano davvero
                    let freeable = d.budget - d.spent;
                    const plan = [];
                    for (const dn of donors) {
                        if (freeable >= need) break;
                        freeable += dn.drop * (dn.x.tul + dn.x.rest) + (dn.drop === dn.x.sets ? 30 : 0);
                        plan.push(dn);
                    }
                    if (freeable < need) continue;
                    for (const { x, drop } of plan) {
                        x.sets -= drop; this._addVolume(vol, d, x, -drop);
                        if (x.sets <= 0) { x.sets = 0; x.active = false; }
                        d.spent = this._daySpent(d);
                    }
                    if (d.spent + need > d.budget) continue;
                    if (target.active) target.sets++; else { target.active = true; target.sets = 2; }
                    this._addVolume(vol, d, target, target.sets === 2 && need > target.tul + target.rest ? 2 : 1);
                    d.spent = this._daySpent(d);
                    moved = true;
                    break;
                }
            }
            if (!moved) break;
        }
    },

    // Minimi in due tempi: prima i muscoli grandi e i polpacci (nella tonificazione la parte
    // inferiore pesa di più, vedi _need), poi braccia e addome — l'addome mai a scapito del lavoro principale.
    _floorTier(ctx, m) {
        return (this.BIG_MUSCLES.includes(m) || m === 'polpacci') ? 1 : 2;
    },

    // Tetto di serie dirette per muscolo in una seduta
    _dayCaps(ctx) {
        const C = {};
        this.BIG_MUSCLES.forEach(m => { C[m] = 10; });
        if (ctx.toning) C.glutei = 12;
        C.bicipiti = 8; C.tricipiti = 8; C.polpacci = 6; C.addome = 6;
        C.trapezio = 6; C.avambracci = 4;
        return C;
    },

    _programName(ctx) {
        const base = { 'upper-lower': 'Upper/Lower', 'push-pull-legs': 'Push/Pull/Legs', 'full-body': 'Full Body' }[ctx.split];
        if (ctx.toning) return `Tonificazione ${base}`;
        return ctx.split === 'upper-lower' ? 'Upper/Lower Split' : base;
    },

    // ========================================
    // SPLIT: giorni e slot (schema, priorità)
    // ========================================

    _splitDays(ctx) {
        const n = ctx.daysPerWeek;
        const T = this._templates(ctx);
        const day = (type, focus, warmup, slots) => ({ type, focus, warmup, slots });

        if (ctx.toning) {
            if (ctx.split === 'full-body') return this._fullBodyDays(ctx, n, true);
            if (ctx.split === 'push-pull-legs') {
                const list = [
                    day('Push', 'Petto, Spalle, Glutei', 'push', T.tPush),
                    day('Pull', 'Schiena, Braccia, Glutei', 'pull', T.tPull),
                    day('Legs', 'Glutei & Quadricipiti', 'legs-quad', T.tLowerGQ)
                ];
                if (n >= 6) {
                    list.push(day('Push B', 'Spalle, Petto, Glutei', 'push', T.tPush));
                    list.push(day('Pull B', 'Schiena, Glutei', 'pull', T.tPull));
                    list.push(day('Legs B', 'Glutei & Femorali', 'legs-hamstring', T.tLowerGH));
                } else if (n === 5) {
                    list.push(day('Upper', 'Parte superiore', 'upper', T.tUpper));
                    list.push(day('Lower', 'Glutei & Femorali', 'legs-hamstring', T.tLowerGH));
                } else if (n === 4) {
                    list.push(day('Lower', 'Glutei & Femorali', 'legs-hamstring', T.tLowerGH));
                }
                return list.slice(0, Math.max(1, n));
            }
            // Upper/Lower tonificazione
            if (n <= 1) return [day('Full Body', 'Total body', 'full-body', T.tFull)];
            if (n === 2) return [
                day('Lower A', 'Glutei & Quadricipiti', 'legs-quad', T.tLowerGQ3),
                day('Lower B', 'Glutei & Femorali', 'legs-hamstring', T.tLowerGH3)
            ];
            if (n === 3) return [
                day('Lower A', 'Glutei & Quadricipiti', 'legs-quad', T.tLowerGQ3),
                day('Upper', 'Parte superiore', 'upper', T.tUpper),
                day('Lower B', 'Glutei & Femorali', 'legs-hamstring', T.tLowerGH3)
            ];
            const list = [
                day('Lower A', 'Glutei & Quadricipiti', 'legs-quad', T.tLowerGQ),
                day('Upper A', 'Schiena & Spalle', 'upper', T.tUpperA),
                day('Lower B', 'Glutei & Femorali', 'legs-hamstring', T.tLowerGH),
                day('Upper B', 'Braccia & Petto', 'upper', T.tUpperB)
            ];
            if (n === 5) list.push(day('Glute Burn', 'Glutei', 'lower', T.tGlute));
            if (n >= 6) {
                list.push(day('Lower C', 'Glutei & Gambe', 'lower', T.tGlute));
                list.push(day('Upper C', 'Parte superiore', 'upper', T.tUpper));
            }
            return list;
        }

        if (ctx.split === 'full-body') return this._fullBodyDays(ctx, n, false);

        if (ctx.split === 'push-pull-legs') {
            if (n <= 3) return [
                day('Push', 'Petto, Spalle, Tricipiti', 'push', T.pushA),
                day('Pull', 'Schiena, Bicipiti', 'pull', T.pullA),
                day('Legs', 'Gambe complete', 'lower', T.legsA)
            ].slice(0, Math.max(1, n));
            if (n === 4) return [
                day('Push', 'Petto, Spalle, Tricipiti', 'push', T.pushA),
                day('Pull', 'Schiena, Bicipiti', 'pull', T.pullA),
                day('Legs', 'Quadricipiti & Glutei', 'legs-quad', T.legsA),
                day('Lower', 'Femorali & Glutei', 'legs-hamstring', T.lowerB)
            ];
            if (n === 5) return [
                // 5 giorni = Push/Pull/Legs + Upper/Lower: gambe 2×/sett
                day('Push', 'Petto, Spalle, Tricipiti', 'push', T.pushA),
                day('Pull', 'Schiena, Bicipiti', 'pull', T.pullA),
                day('Legs', 'Quadricipiti & Glutei', 'legs-quad', T.legsA),
                day('Upper', 'Parte superiore', 'upper', T.upperB),
                day('Lower', 'Femorali & Glutei', 'legs-hamstring', T.lowerB)
            ];
            return [
                day('Push', 'Petto, Spalle, Tricipiti', 'push', T.pushA),
                day('Pull', 'Schiena, Bicipiti', 'pull', T.pullA),
                day('Legs', 'Quadricipiti & Glutei', 'legs-quad', T.legsA),
                day('Push B', 'Spalle, Petto, Tricipiti', 'push', T.pushB),
                day('Pull B', 'Schiena, Bicipiti', 'pull', T.pullB),
                day('Legs B', 'Femorali & Glutei', 'legs-hamstring', T.legsB)
            ];
        }

        // Upper/Lower
        if (n <= 1) return [day('Full Body', 'Total body', 'full-body', T.fullC)];
        if (n === 2) return [
            day('Upper A', 'Petto & Schiena', 'upper', T.upperA),
            day('Lower A', 'Gambe complete', 'lower', T.lowerA)
        ];
        if (n === 3) return [
            // Upper / Lower / Full Body: ogni muscolo 2×/sett (Ralston 2023)
            day('Upper A', 'Petto & Schiena', 'upper', T.upperA),
            day('Lower A', 'Gambe complete', 'lower', T.lowerA),
            day('Full Body', 'Richiamo completo', 'full-body', T.fullC)
        ];
        const list = [
            day('Upper A', ctx.strength ? 'Panca & Rematore' : 'Petto & Schiena', 'upper', T.upperA),
            day('Lower A', 'Quadricipiti & Glutei', 'legs-quad', T.lowerA),
            day('Upper B', ctx.strength ? 'Lento & Trazioni' : 'Dorso & Spalle', 'upper', T.upperB),
            day('Lower B', 'Femorali & Glutei', 'legs-hamstring', T.lowerB)
        ];
        if (n === 5) list.push(day('Arms & Shoulders', 'Braccia & Spalle', 'upper', T.arms));
        if (n >= 6) {
            list.push(day('Upper C', 'Volume parte superiore', 'upper', T.upperA));
            list.push(day('Lower C', 'Gambe complete', 'lower', T.lowerC));
        }
        return list;
    },

    _fullBodyDays(ctx, n, toning) {
        const T = this._templates(ctx);
        const labels = ['A', 'B', 'C', 'D', 'E', 'F'];
        const pool = toning ? [T.tFbA, T.tFbB, T.tFbC] : [T.fbA, T.fbB, T.fbC, T.fbD, T.fbE, T.fbF];
        const focusN = toning ? ['Glutei & Spinta', 'Glutei & Tirata', 'Glutei & Gambe']
            : ['Squat & Panca', 'Stacco & Trazioni', 'Pressa & Rematore', 'Stacco & Panca', 'Squat & Inclinata', 'Femorali & Lento'];
        const days = [];
        for (let i = 0; i < Math.max(1, n); i++) {
            days.push({
                type: `Full Body ${labels[i]}`,
                focus: focusN[i % focusN.length],
                warmup: 'full-body',
                slots: pool[i % pool.length]
            });
        }
        return days;
    },

    // Slot = [schema, priorità]. 1 = fondamentale, 2 = complementare, 3 = accessorio, 4 = extra.
    _templates(ctx) {
        const s = ctx.strength;
        const adv = ctx.level !== 'beginner';
        return {
            upperA: [['hPush', 1], ['hPull', 1], ['vPush', 2], ['vPull', 2], s ? ['tricepsC', 3] : ['chestIso', 3], ['lateral', 3], ['triceps', 3], ['biceps', 3], ['rearDelt', 4]],
            upperB: [['vPull', 1], s ? ['vPush', 1] : ['inclPush', 1], ['hPull', 2], s ? ['inclPush', 2] : ['vPush', 3], ['chestIso', 3], ['lateral', 3], ['rearDelt', 3], ['biceps', 3], ['triceps', 3]],
            lowerA: [['squat', 1], ['hinge2', 2], ['lunge', 2], ['hamCurl', 3], ['quadIso', 3], ['calves', 3], ['hipThrust', 3], ['gluteIso', 4]],
            lowerB: [[s && adv ? 'deadlift' : 'hinge', 1], ['hipThrust', 2], ['quad2', 2], ['hamCurl', 3], ['calves', 3], ['lunge', 4], ['gluteIso', 4], ['quadIso', 4]],
            lowerC: [['quad2', 1], ['hinge2', 2], ['hipThrust', 2], ['lunge', 3], ['hamCurl', 3], ['calves', 3], ['quadIso', 4], ['gluteIso', 4]],
            arms: [['vPush', 1], [s ? 'tricepsC' : 'triceps', 2], ['biceps', 2], ['lateral', 2], ['triceps', 3], ['biceps', 3], ['rearDelt', 3], ['chestIso', 4], ['lateral', 4]],
            pushA: [['hPush', 1], ['vPush', 2], ['inclPush', 2], ['lateral', 3], ['triceps', 3], ['chestIso', 3], ['triceps', 4], ['lateral', 4]],
            pullA: [['vPull', 1], ['hPull', 1], ['hPull', 3], ['rearDelt', 3], ['biceps', 3], ['latIso', 4], ['biceps', 4]],
            legsA: [['squat', 1], ['hinge2', 2], ['lunge', 2], ['hamCurl', 3], ['quadIso', 3], ['calves', 3], ['hipThrust', 3], ['gluteIso', 4]],
            pushB: [[s ? 'vPush' : 'inclPush', 1], [s ? 'inclPush' : 'vPush', 2], ['hPush', 2], ['lateral', 3], ['chestIso', 3], ['triceps', 3], ['triceps', 4], ['rearDelt', 4]],
            pullB: [['hPull', 1], ['vPull', 2], ['vPull', 3], ['rearDelt', 3], ['biceps', 3], ['latIso', 4], ['biceps', 4]],
            legsB: [[s && adv ? 'deadlift' : 'hinge', 1], ['hipThrust', 2], ['quad2', 2], ['hamCurl', 3], ['calves', 3], ['lunge', 4], ['gluteIso', 4], ['quadIso', 4]],
            fullC: [['quad2', 1], ['hPush', 1], ['vPull', 2], ['hinge2', 2], ['lateral', 3], ['biceps', 3], ['triceps', 3], ['calves', 3], ['hipThrust', 4], ['hPull', 4]],
            fbA: [['squat', 1], ['hPush', 1], ['hPull', 2], ['hinge', 2], ['lateral', 3], ['biceps', 3], ['triceps', 3], ['calves', 3], ['hamCurl', 4], ['chestIso', 4]],
            fbB: [[s && adv ? 'deadlift' : 'hinge', 1], ['vPull', 1], ['inclPush', 2], ['lunge', 2], ['rearDelt', 3], ['triceps', 3], ['biceps', 3], ['hipThrust', 3], ['quadIso', 4], ['calves', 4]],
            fbC: [['quad2', 1], ['hPull', 1], ['vPush', 2], ['hipThrust', 2], ['chestIso', 3], ['lateral', 3], ['biceps', 3], ['hamCurl', 3], ['triceps', 4], ['calves', 4]],
            fbD: [['hinge', 1], ['hPush', 1], ['vPull', 2], ['lunge', 2], ['lateral', 3], ['triceps', 3], ['biceps', 3], ['calves', 3], ['rearDelt', 4], ['gluteIso', 4]],
            fbE: [['squat', 1], ['inclPush', 1], ['hPull', 2], ['hamCurl', 2], ['lateral', 3], ['biceps', 3], ['triceps', 3], ['hipThrust', 3], ['calves', 4]],
            fbF: [['hinge2', 1], ['vPush', 1], ['vPull', 2], ['quad2', 2], ['chestIso', 3], ['rearDelt', 3], ['biceps', 3], ['triceps', 3], ['calves', 4]],
            // Tonificazione
            tLowerGQ: [['hipThrust', 1], ['squat', 1], ['lunge', 2], ['gluteIso', 3], ['quadIso', 3], ['calves', 3], ['hamCurl', 4], ['gluteIso', 4]],
            tLowerGH: [['hinge', 1], ['hipThrust', 1], ['hamCurl', 2], ['lunge', 3], ['gluteIso', 3], ['calves', 3], ['quad2', 4], ['gluteIso', 4]],
            tLowerGQ3: [['hipThrust', 1], ['squat', 1], ['lunge', 2], ['gluteIso', 3], ['quadIso', 3], ['calves', 3], ['hPush', 4], ['hamCurl', 4]],
            tLowerGH3: [['hinge', 1], ['hipThrust', 1], ['hamCurl', 2], ['lunge', 3], ['gluteIso', 3], ['calves', 3], ['vPull', 4], ['quad2', 4]],
            tGlute: [['hipThrust', 1], ['lunge', 2], ['hinge2', 2], ['gluteIso', 3], ['gluteIso', 3], ['quad2', 4], ['calves', 4]],
            tUpper: [['vPull', 1], ['hPush', 2], ['vPush', 2], ['hipThrust', 2], ['hPull', 3], ['lateral', 3], ['gluteIso', 3], ['triceps', 3], ['biceps', 4], ['rearDelt', 4], ['chestIso', 4]],
            tUpperA: [['vPull', 1], ['hPull', 2], ['vPush', 2], ['gluteIso', 3], ['inclPush', 3], ['lateral', 3], ['rearDelt', 3], ['triceps', 4], ['biceps', 4]],
            tUpperB: [['hPush', 1], ['hPull', 2], ['gluteIso', 3], ['triceps', 3], ['biceps', 3], ['lateral', 3], ['chestIso', 4], ['triceps', 4]],
            tPush: [['hPush', 1], ['hipThrust', 2], ['vPush', 2], ['inclPush', 3], ['gluteIso', 3], ['lateral', 3], ['triceps', 3], ['chestIso', 4]],
            tPull: [['vPull', 1], ['hinge2', 2], ['hPull', 2], ['gluteIso', 3], ['rearDelt', 3], ['biceps', 3], ['lunge', 4]],
            tFull: [['hipThrust', 1], ['squat', 1], ['hPush', 2], ['vPull', 2], ['hinge2', 3], ['gluteIso', 3], ['lateral', 3], ['calves', 4]],
            tFbA: [['hipThrust', 1], ['squat', 1], ['hPush', 2], ['hPull', 2], ['gluteIso', 3], ['lateral', 3], ['triceps', 3], ['calves', 4], ['quadIso', 4]],
            tFbB: [['hinge', 1], ['hipThrust', 2], ['vPull', 2], ['inclPush', 3], ['gluteIso', 3], ['biceps', 3], ['hamCurl', 3], ['rearDelt', 4]],
            tFbC: [['lunge', 1], ['hipThrust', 1], ['hPull', 2], ['vPush', 2], ['gluteIso', 3], ['hinge2', 3], ['chestIso', 4], ['calves', 4]]
        };
    },

    // ========================================
    // SCELTA DEGLI ESERCIZI
    // ========================================

    _db(id) {
        return (typeof EXERCISES_DB !== 'undefined' && EXERCISES_DB[id]) ? EXERCISES_DB[id] : null;
    },

    _hasEquipment(ex, eq) {
        const need = Array.isArray(ex.equipment) ? ex.equipment : [];
        return need.every(e => e === 'corpo-libero' || eq.has(e));
    },

    _isEligible(id, ctx) {
        const ex = this._db(id);
        if (!ex || ex.hidden) return false;
        if (!this._hasEquipment(ex, ctx.eq)) return false;
        if (ctx.level === 'beginner' && ex.difficulty === 'advanced') return false;
        return true;
    },

    /**
     * Sceglie l'esercizio per uno schema. Ruota fra i migliori candidati in base al ciclo
     * (i fondamentali fra i primi 2, gli altri fra i primi 3) e a quante volte lo schema è già
     * comparso nella settimana, così i giorni non si ripetono identici.
     */
    _pick(ctx, key, prio, used, depth = 0) {
        const pat = this.PATTERNS[key];
        if (!pat || depth > 3) return null;
        let elig = pat.ids.filter(id => !used.has(id) && this._isEligible(id, ctx));
        if (!elig.length) return pat.alt ? this._pick(ctx, pat.alt, prio, used, depth + 1) : null;
        // Principianti: trazioni e dip solo se non c'è una regressione (es. rematore inverso)
        if (ctx.level === 'beginner' && elig.every(id => this.BEGINNER_AVOID.includes(id)) && pat.alt) {
            const alt = this._pick(ctx, pat.alt, prio, used, depth + 1);
            if (alt && !this.BEGINNER_AVOID.includes(alt.id)) return alt;
        }
        // non ruotare da un esercizio con carico a uno a corpo libero "leggero"
        if (!this._isLightBodyweight(elig[0])) elig = elig.filter(id => !this._isLightBodyweight(id));
        const occ = ctx.usage[key] || 0;
        ctx.usage[key] = occ + 1;
        // fondamentali stabili (2 varianti), complementari 3, accessori 4: più varietà dove conta meno
        const k = Math.min(prio === 1 ? 2 : (prio === 2 ? 3 : 4), elig.length);
        const idx = ((ctx.cycleNumber - 1) + occ) % k;
        return { id: elig[idx], key, m: pat.m };
    },

    _avgReps(reps) {
        if (typeof reps === 'number' && Number.isFinite(reps)) return reps;
        const s = String(reps == null ? '' : reps);
        const nums = s.match(/\d+(\.\d+)?/g);
        if (!nums) return 10;
        const a = parseFloat(nums[0]);
        const b = nums.length > 1 ? parseFloat(nums[1]) : a;
        return (a + b) / 2;
    },

    _isLightBodyweight(id) {
        const ex = this._db(id);
        return !!ex && ex.category === 'corpo-libero' && !this.HARD_BODYWEIGHT.includes(id);
    },

    // Secondi di lavoro di una serie (tempo sotto carico + sistemazione)
    _setSeconds(id, reps) {
        const r = this._avgReps(reps);
        let t;
        if (this.TIMED.includes(id)) t = r;
        else t = r * (this._isLightBodyweight(id) ? 3 : 4) + 5;
        if (this.UNILATERAL.includes(id)) t *= 1.8;
        return Math.max(20, Math.min(100, t));
    },

    _round5(x) {
        return Math.round(x / 5) * 5;
    },

    _restFor(ctx, base) {
        return Math.max(45, this._round5(base * ctx.restFactor));
    },

    // Ripetizioni, riposo, ruolo e note di uno slot
    _prescribe(ctx, slot) {
        const ex = this._db(slot.id);
        const goal = ctx.goal;
        const R = this.REP_RANGES[goal];
        const RT = this.REST_TIMES[goal];
        const range = (r) => `${r.min}-${r.max}`;
        let role, reps, rest;
        const bwCapable = this.BODYWEIGHT_CAPABLE.includes(slot.id) && !ctx.eq.has('manubri');
        const isBwLoad = ex.category === 'corpo-libero' || bwCapable;
        const lightBw = this._isLightBodyweight(slot.id) || bwCapable;

        if (slot.m === 'addome' || ex.primaryMuscles.includes('addome')) {
            role = 'core';
            reps = this.CORE_REPS[slot.id] || range(this.SPECIAL_REP_RANGES.addome);
            rest = this._restFor(ctx, this.CORE_LOADED.includes(slot.id) ? 60 : 45);
        } else if (slot.m === 'polpacci') {
            role = 'calves';
            reps = range(this.SPECIAL_REP_RANGES.polpacci);
            rest = this._restFor(ctx, this.REST_CALVES);
        } else if (ex.type === 'compound') {
            role = slot.prio === 1 && !lightBw ? 'main' : 'compound';
            if (isBwLoad) {
                reps = this.BODYWEIGHT_REPS[this.HARD_BODYWEIGHT.includes(slot.id) ? 'hard' : 'light'][goal];
            } else if (ctx.toning && slot.m === 'glutei' && slot.prio > 1) {
                reps = range(R.glute_accessory);
            } else {
                reps = range(role === 'main' ? R.main : R.compound);
            }
            rest = this._restFor(ctx, role === 'main' ? RT.main : RT.compound);
        } else {
            role = 'isolation';
            if (ctx.toning && slot.m === 'glutei') reps = range(R.glute_accessory);
            else if (isBwLoad && this.HARD_BODYWEIGHT.includes(slot.id)) reps = this.BODYWEIGHT_REPS.hard[goal];
            else if (isBwLoad && goal !== 'endurance') reps = this.BODYWEIGHT_REPS.light[goal];
            else reps = range(R.isolation);
            rest = this._restFor(ctx, RT.isolation);
        }

        if (this.FIXED_REPS[slot.id]) reps = this.FIXED_REPS[slot.id];
        const notes = [];
        if (this.TIMED.includes(slot.id)) notes.push('secondi');
        if (this.UNILATERAL.includes(slot.id)) notes.push('per lato');

        slot.role = role;
        slot.reps = reps;
        slot.rest = rest;
        slot.tul = this._setSeconds(slot.id, reps);
        slot.notes = notes.join(' ');
        slot.compound = ex.type === 'compound';
        slot.prims = ex.primaryMuscles.slice();
        if (role === 'core') slot.max = 3;
        else if (role === 'main') slot.max = ctx.strength ? 5 : 4;
        else slot.max = (this._isLightBodyweight(slot.id) || (!ctx.loadEquip && isBwLoad)) ? 5 : 4;
    },

    _warmupMinutes(key) {
        try {
            if (typeof Warmups !== 'undefined' && Warmups && typeof Warmups.getWarmupDurationMin === 'function') {
                const v = Number(Warmups.getWarmupDurationMin(key || 'full-body'));
                if (Number.isFinite(v) && v > 0) return v;
            }
        } catch (e) { /* ripiego sotto */ }
        return this.WARMUP_FALLBACK;
    },

    _cooldownMinutes(key) {
        try {
            if (typeof Warmups !== 'undefined' && Warmups && typeof Warmups.getCooldownDurationMin === 'function') {
                const v = Number(Warmups.getCooldownDurationMin(key || 'full-body'));
                if (Number.isFinite(v) && v > 0) return v;
            }
        } catch (e) { /* ripiego sotto */ }
        return this.COOLDOWN_FALLBACK;
    },

    _buildDayState(ctx, spec, index) {
        const used = new Set();
        const slots = [];
        const addSlot = ([key, prio], order) => {
            const pick = this._pick(ctx, key, prio, used);
            if (!pick) return;
            used.add(pick.id);
            const ex = this._db(pick.id);
            // Muscolo servito: quello dello schema se è primario dell'esercizio, altrimenti il primo
            const m = ex.primaryMuscles.includes(pick.m) ? pick.m : ex.primaryMuscles[0];
            const slot = { id: pick.id, key: pick.key, prio, order, m, sets: 0, active: false, partner: null, group: null };
            this._prescribe(ctx, slot);
            slots.push(slot);
        };
        spec.slots.forEach(addSlot);
        // pochi esercizi possibili con questa attrezzatura: aggiungi schemi affini al giorno
        const want = ctx.loadEquip ? ctx.minExercises + 1 : ctx.minExercises + 3;
        const fillers = /Pull/.test(spec.type) ? ['hinge2', 'hipThrust', 'backBw', 'gluteIso', 'calves']
            : /Push/.test(spec.type) ? ['chestBw', 'tricepsC', 'lunge', 'squat', 'calves']
            : ['hinge2', 'hipThrust', 'lunge', 'chestBw', 'backBw', 'gluteIso', 'calves'];
        for (let f = 0; f < fillers.length && slots.length < want; f++) {
            addSlot([fillers[f], 4], 50 + f);
        }
        if (!ctx.loadEquip) {
            const extras = /Push/.test(spec.type) ? ['vPush', 'chestBw', 'tricepsC']
                : /Pull/.test(spec.type) ? ['vPull', 'hPull', 'backBw', 'hinge2']
                : /Lower|Legs|Glute/.test(spec.type) ? (ctx.toning ? ['hinge2', 'lunge', 'hipThrust', 'gluteIso'] : ['hinge2', 'lunge', 'hipThrust', 'backBw', 'vPush'])
                : /Upper|Arms/.test(spec.type) ? ['vPush', 'vPull', 'hPull', 'backBw', 'chestBw']
                : ['vPush', 'hinge2', 'vPull', 'hPull', 'backBw', 'lunge', 'hipThrust'];
            extras.forEach((k, f) => addSlot([k, 4], 70 + f));
        }
        const budget = (ctx.sessionDuration - Math.min(this.PLAN_WARMUP_CAP, this._warmupMinutes(spec.warmup)) -
            Math.min(this.PLAN_COOLDOWN_CAP, this._cooldownMinutes(spec.warmup))) * 60;
        return {
            index, type: spec.type, focus: spec.focus, warmup: spec.warmup,
            slots, used, budget, spent: 0, vol: {},
            isLower: /Lower|Legs|Glute/.test(spec.type)
        };
    },

    // Addome su 2-3 giorni (preferendo i giorni NON di gambe), una o due regioni per giorno, mai doppioni
    _planCore(ctx, days) {
        const total = ctx.targets.addome;
        if (!total || !days.length) return;
        let nDays = (ctx.level === 'advanced' || ctx.level === 'expert') ? 3 : 2;
        nDays = Math.min(nDays, days.length);
        // giorni NON di gambe per primi, distanziati nella settimana
        const spread = (arr, k) => {
            if (k <= 0) return [];
            if (arr.length <= k) return arr.slice();
            const out = [];
            for (let j = 0; j < k; j++) out.push(arr[Math.min(arr.length - 1, Math.round(j * arr.length / k))]);
            return out;
        };
        const upper = days.map((d, i) => i).filter(i => !days[i].isLower);
        const lower = days.map((d, i) => i).filter(i => days[i].isLower);
        const chosen = (upper.length >= nDays ? spread(upper, nDays)
            : upper.concat(spread(lower, nDays - upper.length))).sort((a, b) => a - b);
        const base = Math.floor(total / nDays);
        const extra = total % nDays;
        let regionIdx = (ctx.cycleNumber - 1) % this.CORE_REGIONS.length;
        chosen.forEach((di, k) => {
            const d = days[di];
            const perDay = base + (k < extra ? 1 : 0);
            const nEx = perDay > 3 ? 2 : 1;
            const setsEach = nEx === 2 ? [Math.ceil(perDay / 2), Math.floor(perDay / 2)] : [perDay];
            for (let e = 0; e < nEx; e++) {
                let pick = null;
                for (let tries = 0; tries < this.CORE_REGIONS.length && !pick; tries++) {
                    const key = this.CORE_REGIONS[regionIdx % this.CORE_REGIONS.length];
                    regionIdx++;
                    pick = this._pick(ctx, key, 5, d.used);
                }
                if (!pick) continue;
                d.used.add(pick.id);
                const slot = { id: pick.id, key: pick.key, prio: 5, order: 100 + e, m: 'addome', sets: 0, active: false, partner: null, group: null };
                this._prescribe(ctx, slot);
                slot.max = Math.max(2, Math.min(3, setsEach[e]));
                d.slots.push(slot);
            }
        });
    },

    // ========================================
    // DISTRIBUZIONE DEL VOLUME NEL TEMPO DISPONIBILE
    // ========================================

    _slotRoundCost(s) {
        if (s.group) {
            const g = s.group;
            return g.members.reduce((a, x) => a + x.tul, 0) + (g.members.length - 1) * g.transition + g.rest;
        }
        return s.tul + s.rest;
    },

    // Costo prudente di un giorno (conta il riposo anche dopo l'ultima serie di ogni esercizio)
    _daySpent(d) {
        let sec = 0;
        const seen = new Set();
        d.slots.forEach(s => {
            if (!s.active) return;
            if (s.group) {
                if (seen.has(s.group)) return;
                seen.add(s.group);
                sec += s.sets * this._slotRoundCost(s) + 30 * s.group.members.length;
            } else {
                sec += s.sets * (s.tul + s.rest) + 30;
            }
        });
        return sec;
    },

    _addVolume(vol, d, s, n) {
        s.prims.forEach(p => {
            vol[p] = (vol[p] || 0) + n;
            d.vol[p] = (d.vol[p] || 0) + n;
        });
    },

    _canAddVolume(ctx, vol, d, s, n, strict) {
        const T = ctx.targets;
        for (const p of s.prims) {
            const t = T[p] || 0;
            const cap = ctx.dayCap[p] != null ? ctx.dayCap[p] : 8;
            if ((d.vol[p] || 0) + n > cap) return false;
            if (p === s.m) {
                if (strict && (vol[p] || 0) + n > t) return false;
            } else if (t > 0 && (vol[p] || 0) + n > t + 2) {
                return false;
            }
        }
        return true;
    },

    // Quanto manca a un muscolo: in modalità "minimi" conta solo la distanza dal minimo
    _need(ctx, vol, m, floorMode) {
        const t = ctx.targets[m] || 0;
        if (t <= 0) return 0;
        const v = vol[m] || 0;
        let need;
        if (floorMode === 'mini') {
            const f = this._miniDose(ctx, m);
            if (f <= 0 || v >= f) return 0;
            need = (f - v) / f;
        } else if (floorMode) {
            if (floorMode !== true && this._floorTier(ctx, m) !== floorMode) return 0;
            const f = ctx.floors[m] || 0;
            if (f <= 0 || v >= f) return 0;
            need = (f - v) / f;
        } else {
            need = (t - v) / t;
            if (need <= 0) return 0;
        }
        if (ctx.toning && this.LOWER_MUSCLES.includes(m)) need *= (m === 'glutei' ? 2 : 1.5);
        // verso gli obiettivi contano di più i muscoli grandi (le braccia lavorano già nei multiarticolari)
        if (!floorMode && this.BIG_MUSCLES.includes(m)) need *= 1.25;
        return need;
    },

    _allocate(ctx, days) {
        const vol = {};
        ctx._vol = vol;

        const activate = (d, s, n) => {
            if ((s.active ? s.sets : 0) + n > s.max) return false;
            const cost = s.active ? n * (s.tul + s.rest) : 30 + n * (s.tul + s.rest);
            if (d.spent + cost > d.budget) return false;
            if (!s.active) { s.active = true; s.sets = 0; }
            s.sets += n; d.spent += cost; this._addVolume(vol, d, s, n);
            return true;
        };
        const byPrio = (a, b) => (a.prio - b.prio) || (a.order - b.order);

        // 1) I fondamentali del giorno (priorità 1) con 2 serie
        days.forEach(d => {
            d.slots.filter(s => s.prio === 1 && (ctx.targets[s.m] || 0) > 0).sort(byPrio).forEach(s => activate(d, s, 2));
        });

        // 2) Struttura: almeno N esercizi al giorno con 2 serie, in ordine di priorità ma prima
        // i muscoli non ancora coperti nel giorno (equilibrio: niente due tirate prima di una spinta)
        days.forEach(d => {
            let count = d.slots.filter(s => s.active && s.prio < 5).length;
            const covered = () => new Set(d.slots.filter(s => s.active).map(s => s.m));
            for (let pass = 0; pass < 2; pass++) {
                for (const s of d.slots.filter(x => !x.active && x.prio < 5).sort(byPrio)) {
                    if (count >= ctx.minExercises) break;
                    if ((ctx.targets[s.m] || 0) <= 0) continue;
                    if (pass === 0 && (s.prio > 3 || covered().has(s.m))) continue;
                    if (activate(d, s, 2)) count++;
                }
            }
        });

        // Minimi fissi (usati al punto 4): distribuiti sui giorni, 2-3 serie al giorno
        const hardFloor = (m, floor) => {
            const cand = [];
            days.forEach(d => d.slots.forEach(s => { if (s.m === m && s.prio < 5) cand.push({ d, s }); }));
            for (let guard = 0; guard < 20 && (vol[m] || 0) < floor; guard++) {
                // prima un giorno che non allena ancora quel muscolo (frequenza), poi un esercizio già
                // attivo (niente cambio di attrezzo), poi il meno carico
                // (il petto della tonificazione prima nei giorni della parte superiore)
                const has = (d) => (d.vol[m] || 0) > 0 ? 1 : 0;
                const wrongDay = (d) => (m === 'petto' && d.isLower) ? 1 : 0;
                const c = cand
                    .filter(({ d, s }) => s.sets < Math.min(s.max, 3) && d.spent + (s.active ? s.tul + s.rest : 30 + 2 * (s.tul + s.rest)) <= d.budget)
                    .sort((x, y) => (wrongDay(x.d) - wrongDay(y.d)) || (has(x.d) - has(y.d)) || ((x.s.active ? 0 : 1) - (y.s.active ? 0 : 1)) ||
                        (x.s.sets - y.s.sets) || (x.s.prio - y.s.prio) || (x.d.index - y.d.index))[0];
                if (!c) break;
                activate(c.d, c.s, c.s.active ? 1 : 2);
            }
        };
        // 3) Dose minima: 4 serie dirette per ogni muscolo grande prima di tutto il resto
        this._greedyFill(ctx, days, vol, 'mini');
        this._rebalanceMini(ctx, days, vol);
        // 4) Minimi fissi: petto ≥6 nella tonificazione, polpacci ≥6 serie/sett quando l'obiettivo
        //    li prevede (N5; 4 nella tonificazione, dove i glutei hanno la precedenza)
        if (ctx.toning) hardFloor('petto', Math.min(6, ctx.targets.petto));
        if (ctx.floors.polpacci > 0) hardFloor('polpacci', ctx.toning ? Math.min(4, ctx.floors.polpacci) : ctx.floors.polpacci);

        // 5) I fondamentali salgono a 3 serie se il tempo e il volume lo permettono
        days.forEach(d => {
            d.slots.filter(s => s.active && s.role === 'main').forEach(s => {
                if (this._canAddVolume(ctx, vol, d, s, 1, true)) activate(d, s, 1);
            });
        });

        // 6) Superset sugli esercizi già attivi, poi riempimento (prima i minimi di ogni muscolo,
        //    poi gli obiettivi); un secondo giro per gli accessori attivati nel frattempo.
        //    Le coppie si formano PRIMA di ogni taglio, con le serie già pareggiate.
        for (let pass = 0; pass < 2; pass++) {
            days.forEach(d => this._formSupersets(ctx, d, vol));
            this._greedyFill(ctx, days, vol, 1);
            this._greedyFill(ctx, days, vol, 2);
            this._greedyFill(ctx, days, vol, false);
        }

        // 7) Dose minima ricontrollata (i riempimenti possono aver preso il tempo che serviva)
        this._rebalanceMini(ctx, days, vol);

        // 8) Ultima garanzia: almeno N esercizi al giorno se c'è un buco di tempo
        days.forEach(d => {
            let active = d.slots.filter(s => s.active && s.prio < 5).length;
            if (active >= ctx.minExercises) return;
            for (const s of d.slots.filter(x => !x.active && x.prio < 5).sort((a, b) => (a.prio - b.prio) || (a.order - b.order))) {
                if (active >= ctx.minExercises) break;
                const cost = 30 + 2 * (s.tul + s.rest);
                if (d.spent + cost > d.budget) continue;
                if (!this._canAddVolume(ctx, vol, d, s, 2, false)) continue;
                s.active = true; s.sets = 2; d.spent += cost; active++;
                this._addVolume(vol, d, s, 2);
            }
        });
    },

    // Riempimento: a ogni passo la serie che vale di più (muscolo più lontano dal suo obiettivo,
    // priorità dello slot, giorno dove quel muscolo è meno allenato) per secondo di seduta.
    _greedyFill(ctx, days, vol, floorMode) {
        for (let guard = 0; guard < 600; guard++) {
            let best = null;
            let bestScore = 0;
            for (const d of days) {
                const rem = d.budget - d.spent;
                if (rem <= 0) continue;
                for (const s of d.slots) {
                    if (s.active) {
                        if (s.sets >= s.max) continue;
                        if (s.group && s.group.members[0] !== s) continue; // il gruppo si valuta una volta
                        // oltre 3 serie meglio un secondo esercizio per lo stesso muscolo (varietà, angoli diversi)
                        if (!s.group && s.role !== 'main' && s.sets >= 3 && d.slots.some(x => !x.active && x.m === s.m && x.prio < 5 &&
                            30 + 2 * (x.tul + x.rest) <= rem && this._canAddVolume(ctx, vol, d, x, 2, true))) continue;
                        const members = s.group ? s.group.members : [s];
                        if (members.some(x => x.sets >= x.max)) continue;
                        const cost = this._slotRoundCost(s);
                        if (cost > rem) continue;
                        // almeno un muscolo del gruppo sotto obiettivo, nessuno oltre il tetto
                        let need = 0;
                        let ok = true;
                        for (const x of members) {
                            if (!this._canAddVolume(ctx, vol, d, x, 1, false)) { ok = false; break; }
                            const nx = this._need(ctx, vol, x.m, floorMode);
                            const over = ctx.toning && this.UPPER_MUSCLES.includes(x.m) ? 2 : 3;
                            const lim = members.length > 1 ? Math.min((ctx.targets[x.m] || 0) + over, this.VOLUME_CONFIG[ctx.level].max + 3) : (ctx.targets[x.m] || 0) + 1;
                            if (nx <= 0 && (vol[x.m] || 0) + 1 > lim) { ok = false; break; }
                            need = Math.max(need, nx);
                        }
                        if (!ok || need <= 0) continue;
                        const prio = Math.min(...members.map(x => x.prio));
                        const bal = 1 / (1 + (d.vol[s.m] || 0) / 10);
                        const score = this.PRIO_WEIGHT[prio] * need * bal / (floorMode ? 1 : cost / 60);
                        if (score > bestScore) { bestScore = score; best = { d, s, kind: 'set', cost, members }; }
                    } else {
                        const cost = 30 + 2 * (s.tul + s.rest);
                        if (cost > rem) continue;
                        const need = this._need(ctx, vol, s.m, floorMode);
                        if (need <= 0) continue;
                        if (!this._canAddVolume(ctx, vol, d, s, 2, false)) continue;
                        if ((vol[s.m] || 0) + 2 > (ctx.targets[s.m] || 0) + 1) continue;
                        const same = d.slots.filter(x => x.active && x.m === s.m && x.prio < 5);
                        let f = 1.2;
                        if (same.length) f = same.every(x => x.sets >= 3) ? 1.0 : 0.6;
                        const bal = 1 / (1 + (d.vol[s.m] || 0) / 10);
                        // costo per serie (l'attivazione porta 2 serie): confronto equo con "+1 serie"
                        const score = this.PRIO_WEIGHT[s.prio] * need * bal * f / (floorMode ? 1 : cost / 120);
                        if (score > bestScore) { bestScore = score; best = { d, s, kind: 'activate', cost }; }
                    }
                }
            }
            if (!best) break;
            const { d, s } = best;
            if (best.kind === 'set') {
                best.members.forEach(x => { x.sets++; this._addVolume(vol, d, x, 1); });
            } else {
                s.active = true; s.sets = 2;
                this._addVolume(vol, d, s, 2);
            }
            d.spent += best.cost;
        }
    },

    _stationFamily(id) {
        const ex = this._db(id);
        if (!ex) return 'x';
        if (ex.category === 'corpo-libero' || ex.category === 'manubri') return 'free';
        return ex.category;
    },

    // Attrezzi a portata di mano: pesi liberi fra loro, cavi fra loro, cavi + manubri per i
    // monoarticolari; le macchine solo nelle coppie definite (sono in punti diversi della sala)
    _stationsNear(a, b) {
        const fa = this._stationFamily(a), fb = this._stationFamily(b);
        if (fa === 'macchine' || fb === 'macchine') return false;
        const free = (f) => f === 'free' || f === 'bilanciere' || f === 'accessori';
        if (free(fa) && free(fb)) return true;
        if (fa === 'cavi' && fb === 'cavi') return true;
        const iso = (id) => this._db(id)?.type === 'isolation';
        return (fa === 'cavi' || fb === 'cavi') && iso(a) && iso(b);
    },

    _musclesCompatible(a, b) {
        return this.SUPERSET_MUSCLE_PAIRS.some(([x, y]) => (a === x && b === y) || (a === y && b === x));
    },

    _supersetEligible(ctx, s) {
        if (!s.active || s.group || s.role === 'core' || s.role === 'calves') return false;
        if (this.SUPERSET_EXCLUDED.includes(s.id)) return false;
        const rules = this.SUPERSET_RULES[ctx.goal] || this.SUPERSET_RULES.hypertrophy;
        if (!rules.allowCompound && s.compound) return false;
        // Il fondamentale che apre la seduta resta da solo (vedi anchor in _formSupersets); nella forza
        // nessun fondamentale va in superset
        if (ctx.strength && s.prio === 1) return false;
        return true;
    },

    /**
     * Superset agonista-antagonista (Robbins 2010; Paz 2017: stesso volume in meno tempo).
     * Solo coppie a portata di mano: coppie definite o stessa famiglia di attrezzi.
     * Le serie si pareggiano QUI, prima di qualunque taglio, controllando tempo e volume.
     */
    _formSupersets(ctx, d, vol) {
        const rules = this.SUPERSET_RULES[ctx.goal] || this.SUPERSET_RULES.hypertrophy;
        let groups = new Set(d.slots.filter(s => s.group).map(s => s.group)).size;
        if (groups >= rules.maxPerDay) return;
        // il multiarticolare che apre la seduta resta da solo
        const anchor = d.slots.filter(s => s.active && s.compound && s.role !== 'core')
            .sort((a, b) => (a.prio - b.prio) || (a.order - b.order))[0];
        const cand = d.slots.filter(s => s !== anchor && this._supersetEligible(ctx, s));
        const pairs = [];
        for (let i = 0; i < cand.length; i++) {
            for (let j = i + 1; j < cand.length; j++) {
                const a = cand[i], b = cand[j];
                const def = this.SUPERSET_PAIRS.find(p => p.exercises.includes(a.id) && p.exercises.includes(b.id));
                let score = 0, transition = 15;
                if (def) { score = 3; transition = def.transition; }
                else if (this._stationsNear(a.id, b.id) && this._musclesCompatible(a.m, b.m)) {
                    score = 1; transition = this._stationFamily(a.id) === this._stationFamily(b.id) ? 10 : 15;
                }
                if (!score) continue;
                pairs.push({ a, b, score: score - Math.abs(a.order - b.order) * 0.05, transition });
            }
        }
        pairs.sort((x, y) => y.score - x.score);
        for (const p of pairs) {
            if (groups >= rules.maxPerDay) break;
            if (p.a.group || p.b.group) continue;
            const members = [p.a, p.b].sort((x, y) => x.order - y.order);
            if (rules.useGiantSets) {
                // circuito: un terzo esercizio della stessa famiglia e di un altro muscolo
                const third = cand.find(c => !c.group && c !== p.a && c !== p.b &&
                    this._stationFamily(c.id) === this._stationFamily(p.a.id) &&
                    c.m !== p.a.m && c.m !== p.b.m);
                if (third) members.push(third);
                members.sort((x, y) => x.order - y.order);
            }
            if (this._makeGroup(ctx, d, vol, members, p.transition)) groups++;
        }
    },

    _makeGroup(ctx, d, vol, members, transition) {
        const before = d.spent;
        const group = {
            members,
            transition,
            rest: Math.max(45, this._round5(Math.max(...members.map(x => x.rest)) * 0.8)),
            isGiant: members.length >= 3
        };
        const hi = Math.max(...members.map(x => x.sets));
        const lo = Math.min(...members.map(x => x.sets));
        const old = members.map(x => x.sets);
        members.forEach(x => { x.group = group; });
        // prova a pareggiare verso l'alto (tempo e volume permettendo), altrimenti verso il basso
        const tryLevel = (lvl) => {
            const delta = members.map(x => lvl - x.sets);
            const okVol = members.every((x, i) => delta[i] <= 0 || (
                this._canAddVolume(ctx, vol, d, x, delta[i], false) &&
                (vol[x.m] || 0) + delta[i] <= (ctx.targets[x.m] || 0) + 1));
            if (!okVol) return false;
            members.forEach(x => { x.sets = lvl; });
            const spent = this._daySpent(d);
            if (spent > d.budget) { members.forEach((x, i) => { x.sets = old[i]; }); return false; }
            members.forEach((x, i) => this._addVolume(vol, d, x, lvl - old[i]));
            d.spent = spent;
            return true;
        };
        if (tryLevel(hi) || tryLevel(lo)) return true;
        members.forEach((x, i) => { x.group = null; x.sets = old[i]; });
        d.spent = before;
        return false;
    },

    // Tonificazione: almeno il 55% delle serie dirette alla parte inferiore
    _enforceLowerShare(ctx, days) {
        const vol = ctx._vol;
        const share = () => {
            const lo = this.LOWER_MUSCLES.reduce((a, m) => a + (vol[m] || 0), 0);
            const up = this.UPPER_MUSCLES.reduce((a, m) => a + (vol[m] || 0), 0);
            return lo + up ? lo / (lo + up) : 1;
        };
        const V = this.VOLUME_CONFIG[ctx.level];
        for (let guard = 0; guard < 300 && share() < 0.57; guard++) {
            // 1) una serie in più a un esercizio della parte inferiore (fino al tetto max+4)
            let done = false;
            for (const d of days) {
                for (const s of d.slots) {
                    if (!s.active || !this.LOWER_MUSCLES.includes(s.m) || s.sets >= s.max) continue;
                    const members = s.group ? s.group.members : [s];
                    if (s.group && (s.group.members[0] !== s || members.some(x => !this.LOWER_MUSCLES.includes(x.m) || x.sets >= x.max))) continue;
                    if (members.some(x => (vol[x.m] || 0) + 1 > V.max + 3 || (d.vol[x.m] || 0) + 1 > ctx.dayCap[x.m] ||
                        (vol[x.m] || 0) + 1 > (ctx.targets[x.m] || 0) + 3)) continue;
                    const cost = this._slotRoundCost(s);
                    if (d.spent + cost > d.budget) continue;
                    members.forEach(x => { x.sets++; this._addVolume(vol, d, x, 1); });
                    d.spent += cost; done = true; break;
                }
                if (done) break;
            }
            for (const d of days) {
                if (done) break;
                for (const s of d.slots) {
                    if (s.active || s.prio >= 5 || !this.LOWER_MUSCLES.includes(s.m)) continue;
                    if ((vol[s.m] || 0) + 2 > V.max + 3 || (d.vol[s.m] || 0) + 2 > ctx.dayCap[s.m]) continue;
                    const cost = 30 + 2 * (s.tul + s.rest);
                    if (d.spent + cost > d.budget) continue;
                    s.active = true; s.sets = 2; d.spent += cost; this._addVolume(vol, d, s, 2); done = true; break;
                }
            }
            if (done) continue;
            // 2) una serie in meno alla parte superiore: braccia e isolamenti prima, petto mai sotto 6,
            //    gli altri muscoli grandi mai sotto 4 (dose minima)
            const floorOf = (m) => m === 'petto' ? Math.min(6, ctx.targets.petto) : (this.BIG_MUSCLES.includes(m) ? 4 : 0);
            let victim = null, vd = null, vScore = -Infinity;
            for (const d of days) {
                const nActive = d.slots.filter(x => x.active && x.prio < 5).length;
                for (const s of d.slots) {
                    if (!s.active || s.role === 'core' || !this.UPPER_MUSCLES.includes(s.m)) continue;
                    if (s.sets <= 2 && nActive <= ctx.minExercises) continue;
                    const drop = s.sets > 2 ? 1 : s.sets;
                    if ((vol[s.m] || 0) - drop < floorOf(s.m)) continue;
                    // prima le braccia, poi il muscolo più sopra il suo minimo; i fondamentali per ultimi
                    const score = (this.BIG_MUSCLES.includes(s.m) ? 0 : 100) + ((vol[s.m] || 0) - floorOf(s.m)) * 3 + s.prio * 2 - (s.role === 'main' ? 50 : 0);
                    if (score > vScore) { vScore = score; victim = s; vd = d; }
                }
            }
            if (!victim) {
                // 3) ultima risorsa: l'addome lascia il tempo alla parte inferiore nei giorni di gambe
                const core = days.filter(d => d.slots.some(x => x.active && this.LOWER_MUSCLES.includes(x.m) && x.sets < x.max))
                    .flatMap(d => d.slots.filter(x => x.active && x.role === 'core').map(x => ({ d, x })))[0];
                if (!core) break;
                this._addVolume(vol, core.d, core.x, -core.x.sets);
                core.x.sets = 0; core.x.active = false;
                core.d.spent = this._daySpent(core.d);
                continue;
            }
            if (victim.group) victim.group.members.forEach(x => { x.group = null; }); // il superset si scioglie
            if (victim.sets > 2) {
                victim.sets--; this._addVolume(vol, vd, victim, -1);
            } else {
                this._addVolume(vol, vd, victim, -victim.sets); victim.sets = 0; victim.active = false;
            }
            vd.spent = this._daySpent(vd);
        }
    },

    /**
     * Tempo avanzato dopo aver raggiunto gli obiettivi di volume:
     * - _spareVolume: resistenza e tonificazione, un po' di volume in più (fino a max+3) sui muscoli
     *   prioritari (nella tonificazione solo la parte inferiore);
     * - _spareRest: riposi più lunghi (Schoenfeld 2016: recuperi lunghi = più carico per serie), con
     *   tetti per obiettivo (la resistenza vive di recuperi brevi, quasi niente).
     */
    _spareVolume(ctx, days) {
        const vol = ctx._vol;
        const V = this.VOLUME_CONFIG[ctx.level];
        if (ctx.goal === 'toning' || ctx.goal === 'endurance') {
            const saved = ctx.targets;
            const extra = { ...saved };
            const muscles = ctx.toning ? ['quadricipiti', 'femorali', 'glutei'] : this.BIG_MUSCLES;
            muscles.forEach(m => { if (extra[m] > 0) extra[m] = Math.min(V.max + 3, extra[m] + 3); });
            // nella tonificazione il tempo in più va solo alla parte inferiore
            if (ctx.toning) Object.keys(extra).forEach(m => { if (!muscles.includes(m)) extra[m] = Math.min(extra[m], vol[m] || 0); });
            ctx.targets = extra;
            this._greedyFill(ctx, days, vol, false);
            ctx.targets = saved;
        }
    },

    _spareRest(ctx, days) {
        const capBy = { strength: 1.4, hypertrophy: 1.4, recomp: 1.25, toning: 1.15, endurance: 1.1 };
        // con 90' si concede un recupero ancora un po' più completo
        const cap = (capBy[ctx.goal] || 1.2) + (ctx.sessionDuration >= 90 ? 0.1 : 0);
        days.forEach(d => {
            const spent = this._daySpent(d);
            const goal = d.budget * 0.95;
            if (spent >= goal) return;
            let restPart = 0;
            const seen = new Set();
            d.slots.forEach(s => {
                if (!s.active) return;
                if (s.group) {
                    if (seen.has(s.group)) return;
                    seen.add(s.group);
                    restPart += s.sets * s.group.rest;
                } else if (s.role !== 'core') {
                    restPart += s.sets * s.rest;
                }
            });
            if (restPart <= 0) return;
            const f = Math.min(cap, 1 + (goal - spent) / restPart);
            if (f <= 1.04) return;
            seen.clear();
            d.slots.forEach(s => {
                if (!s.active || s.role === 'core') return;
                s.rest = this._round5(s.rest * f);
                if (s.group && !seen.has(s.group)) {
                    seen.add(s.group);
                    s.group.rest = this._round5(s.group.rest * f);
                }
            });
            d.spent = this._daySpent(d);
        });
    },

    // ========================================
    // USCITA: ordine, campi, verifica della durata
    // ========================================

    _finalizeDay(ctx, d, index) {
        // Taglio di sicurezza (non dovrebbe servire: il riempimento resta nel budget). Il piano conta
        // riscaldamento e defaticamento fino a 10' e 8': la stima reale può superare di poco la durata.
        let day = this._renderDay(ctx, d, index);
        const limit = ctx.sessionDuration * 1.12;
        for (let guard = 0; guard < 40 && this.estimateWorkoutDuration(day) > limit; guard++) {
            const act = d.slots.filter(s => s.active);
            const cand = act.filter(s => s.sets > 2 && s.role !== 'main').sort((a, b) => (b.prio - a.prio) || (b.order - a.order))[0]
                || act.filter(s => s.sets > 2).sort((a, b) => (b.prio - a.prio) || (b.order - a.order))[0];
            if (cand) {
                (cand.group ? cand.group.members : [cand]).forEach(x => { x.sets = Math.max(2, x.sets - 1); });
            } else {
                const drop = act.filter(s => s.role !== 'main').sort((a, b) => (b.prio - a.prio) || (b.order - a.order))[0];
                if (!drop || act.filter(s => s.prio < 5).length <= ctx.minExercises && drop.prio < 5) break;
                if (drop.group) drop.group.members.forEach(x => { x.group = null; });
                drop.active = false; drop.sets = 0;
            }
            day = this._renderDay(ctx, d, index);
        }
        return day;
    },

    _renderDay(ctx, d, index) {
        const active = d.slots.filter(s => s.active && s.sets > 0);
        // gruppi ancora validi (tutti i membri attivi)
        active.forEach(s => {
            if (s.group && s.group.members.some(x => !x.active || x.sets <= 0)) {
                s.group.members.forEach(x => { x.group = null; });
            }
        });
        const items = [];
        const seen = new Set();
        active.forEach(s => {
            if (s.group) {
                if (seen.has(s.group)) return;
                seen.add(s.group);
                const members = s.group.members.slice().sort((a, b) => a.order - b.order);
                items.push({ members, group: s.group });
            } else {
                items.push({ members: [s], group: null });
            }
        });
        // Ordine: multiarticolari (e superset che ne contengono) → monoarticolari → polpacci → addome
        const rank = (it) => {
            if (it.members.every(x => x.role === 'core')) return 4;
            if (it.members.every(x => x.role === 'calves')) return 3;
            if (it.members.some(x => x.compound && x.role !== 'core')) return 0;
            if (it.members.some(x => this.BIG_MUSCLES.includes(x.m))) return 1;
            return 2;
        };
        items.sort((a, b) => (rank(a) - rank(b)) ||
            (Math.min(...a.members.map(x => x.prio)) - Math.min(...b.members.map(x => x.prio))) ||
            (Math.min(...a.members.map(x => x.order)) - Math.min(...b.members.map(x => x.order))));

        // si apre con un multiarticolare da solo: se in testa c'è un superset, si porta avanti il primo
        // multiarticolare singolo; se non c'è, il superset di testa si scioglie
        if (items.length && items[0].group) {
            const k = items.findIndex(it => !it.group && it.members[0].compound && it.members[0].role !== 'core');
            if (k > 0) items.unshift(items.splice(k, 1)[0]);
            else {
                const g = items.shift();
                g.members.forEach(x => { x.group = null; });
                items.unshift(...g.members.map(x => ({ members: [x], group: null })));
                items.sort((a, b) => (rank(a) - rank(b)) || (a.members[0].prio - b.members[0].prio) || (a.members[0].order - b.members[0].order));
            }
        }
        const letters = 'ABCDEFGH';
        let gi = 0;
        const exercises = [];
        items.forEach(it => {
            const letter = it.group ? letters[gi++ % letters.length] : null;
            it.members.forEach((s, k) => {
                const ex = this._db(s.id);
                const out = {
                    exerciseId: s.id,
                    name: ex.name,
                    type: ex.type,
                    sets: Math.max(1, Math.round(s.sets)),
                    reps: s.reps,
                    rest: s.rest,
                    notes: s.notes || ''
                };
                if (s.role === 'core') out.isCore = true;
                if (letter) {
                    out.supersetGroup = letter;
                    out.supersetOrder = k + 1;
                    out.supersetRest = it.group.rest;
                    out.transitionTime = it.group.transition;
                    out.isGiantSet = !!it.group.isGiant;
                }
                exercises.push(out);
            });
        });
        return {
            name: `Giorno ${index + 1}`,
            type: d.type,
            focus: d.focus,
            warmup: d.warmup,
            exercises
        };
    },

    // ========================================
    // MESOCICLO
    // ========================================

    /**
     * Fasi del mesociclo: la somma è sempre la durata e l'ultima settimana è deload.
     * intensificazione = max(1, round((d−1)×0.4)), accumulo = d−1−intensificazione.
     */
    buildCycle(goal, level) {
        const config = this.CYCLE_CONFIG;
        const g = this._normalizeGoal(goal);
        const duration = config.duration[g]?.[level] || config.duration.hypertrophy.intermediate;
        const intensification = duration >= 3 ? Math.max(1, Math.round((duration - 1) * 0.4)) : 0;
        const accumulation = Math.max(0, duration - 1 - intensification);
        const phases = [];
        let week = 1;
        const push = (phase) => phases.push({
            week: week++,
            phase,
            phaseName: config.phaseNames[phase],
            rirTarget: { ...config.rirTargets[phase] },
            volumeMultiplier: config.volumeMultiplier[phase]
        });
        for (let i = 0; i < accumulation; i++) push('accumulation');
        for (let i = 0; i < intensification; i++) push('intensification');
        push('deload');
        return {
            duration,
            currentWeek: 1,
            startDate: new Date().toISOString(),
            phases,
            isDeloadActive: false
        };
    },

    // Compatibilità con il nome della v1.25
    generateCycleStructure(goal, level) {
        return this.buildCycle(goal, level);
    },

    getPhaseForWeek(cycle, week) {
        if (!cycle || !Array.isArray(cycle.phases) || !cycle.phases.length) return null;
        const max = cycle.duration || cycle.phases.length;
        let w = parseInt(week, 10);
        if (!Number.isFinite(w)) w = 1;
        w = Math.max(1, Math.min(max, w));
        return cycle.phases.find(p => p.week === w) || cycle.phases[cycle.phases.length - 1];
    },

    getVolumeMultiplier(phase) {
        if (!phase) return 1;
        if (typeof phase === 'object' && typeof phase.volumeMultiplier === 'number') return phase.volumeMultiplier;
        const key = typeof phase === 'string' ? phase : phase.phase;
        const v = this.CYCLE_CONFIG.volumeMultiplier[key];
        return typeof v === 'number' ? v : 1;
    },

    /**
     * Copia del giorno con le serie della fase: max(2, round(serie×moltiplicatore)), mai più
     * di prima, superset pareggiati, e il RIR target della fase. In intensificazione (0.9),
     * dove l'arrotondamento per esercizio non toglierebbe nulla, si toglie una serie agli
     * isolamenti fino a ~−10% del totale.
     */
    applyPhaseToDay(day, phase) {
        const copy = JSON.parse(JSON.stringify(day || {}));
        const ph = typeof phase === 'string' ? { phase } : (phase || {});
        const key = ph.phase || 'accumulation';
        const mult = this.getVolumeMultiplier(ph);
        const rir = ph.rirTarget || this.CYCLE_CONFIG.rirTargets[key] || null;
        const exs = Array.isArray(copy.exercises) ? copy.exercises : [];
        let base = 0;
        exs.forEach(ex => {
            const s = parseInt(ex.sets, 10);
            const sets = Number.isFinite(s) && s > 0 ? s : 0;
            base += sets;
            if (sets > 0 && mult < 1) ex.sets = Math.min(sets, Math.max(2, Math.round(sets * mult)));
            if (rir) ex.rirTarget = { ...rir };
        });
        if (mult < 1 && mult > 0.5) {
            const target = Math.round(base * mult);
            let cur = exs.reduce((a, ex) => a + (parseInt(ex.sets, 10) || 0), 0);
            for (let i = exs.length - 1; i >= 0 && cur > target; i--) {
                const ex = exs[i];
                if (ex.supersetGroup || ex.isCore) continue;
                const type = ex.type || this._db(ex.exerciseId)?.type;
                if (type === 'compound') continue;
                if ((parseInt(ex.sets, 10) || 0) >= 3) { ex.sets = parseInt(ex.sets, 10) - 1; cur--; }
            }
        }
        // superset: stesse serie per tutti i membri
        const bySs = {};
        exs.forEach(ex => { if (ex.supersetGroup) (bySs[ex.supersetGroup] = bySs[ex.supersetGroup] || []).push(ex); });
        Object.values(bySs).forEach(g => {
            const lo = Math.min(...g.map(ex => parseInt(ex.sets, 10) || 0));
            g.forEach(ex => { ex.sets = lo; });
        });
        copy.phase = key;
        copy.rirTarget = rir ? { ...rir } : null;
        copy.volumeMultiplier = mult;
        return copy;
    },

    // ========================================
    // ROTAZIONE A FINE CICLO
    // ========================================

    /**
     * Nuova scheda per il ciclo successivo: stessi parametri del wizard, esercizi ruotati,
     * +1 serie/settimana per muscolo (fino al massimo del livello).
     * Schede manuali: restituite identiche. Ritorna {program, added[], removed[]}.
     */
    rotateProgram(program, profile) {
        const same = { program, added: [], removed: [] };
        if (!program || !program.metadata || !Array.isArray(program.days)) return same;
        const md = program.metadata;
        if (md.isManual || md.isCustom || md.split === 'custom') return same;
        const opts = md.generatorOptions || {
            goal: md.goal,
            daysPerWeek: md.daysPerWeek || program.days.length,
            split: md.split,
            sessionDuration: md.sessionDuration
        };
        const prof = { ...(profile || {}) };
        if (!this.VOLUME_CONFIG[prof.level]) prof.level = md.level || 'intermediate';
        if (prof.gender == null || prof.gender === '') prof.gender = md.gender || prof.gender || '';
        const nextCycle = (parseInt(md.cycleNumber, 10) || 1) + 1;
        let next;
        try {
            next = this.generateProgram(prof, { ...opts, cycleNumber: nextCycle });
        } finally {
            this._currentCycleOffset = 0;
        }
        // stessa "scheda" (serve a getNextDayIndex per continuare la sequenza dei giorni)
        if (md.programId != null) next.metadata.programId = md.programId;
        next.metadata.previousExercises = this._extractExerciseIds(program);
        next.metadata.rotatedAt = new Date().toISOString();
        const summary = this.getRotationSummary(program, next);
        return { program: next, added: summary.added, removed: summary.removed };
    },

    _extractExerciseIds(program) {
        if (!program?.days) return [];
        const ids = new Set();
        program.days.forEach(day => {
            (day.exercises || []).forEach(ex => ids.add(ex.exerciseId));
        });
        return [...ids];
    },

    getRotationSummary(oldProgram, newProgram) {
        const oldIds = new Set(this._extractExerciseIds(oldProgram));
        const newIds = new Set(this._extractExerciseIds(newProgram));
        const name = (id) => this._db(id)?.name || id;
        const added = [...newIds].filter(id => !oldIds.has(id));
        const removed = [...oldIds].filter(id => !newIds.has(id));
        const kept = [...newIds].filter(id => oldIds.has(id));
        return {
            added: added.map(id => ({ id, name: name(id) })),
            removed: removed.map(id => ({ id, name: name(id) })),
            kept: kept.map(id => ({ id, name: name(id) })),
            totalChanged: added.length + removed.length,
            cycleNumber: newProgram?.metadata?.cycleNumber || 1
        };
    },

    // ========================================
    // GIORNO SUCCESSIVO, VOLUME, DURATA
    // ========================================

    /**
     * Indice del giorno DOPO l'ultimo fatto di questa scheda. Un workout appartiene alla scheda se
     * ha lo stesso programId; i vecchi workout (senza programId) si riconoscono dal tipo del giorno.
     * Allenamenti liberi esclusi. Nessuno → 0.
     */
    getNextDayIndex(program, workouts) {
        const days = Array.isArray(program?.days) ? program.days : [];
        if (!days.length) return 0;
        const list = Array.isArray(workouts) ? workouts : [];
        const pid = program?.metadata?.programId;
        let best = -1;
        let bestTime = -Infinity;
        for (const w of list) {
            if (!w || w.isFreeWorkout || w.type === 'Allenamento Libero') continue;
            let idx = -1;
            const hasPid = w.programId != null && w.programId !== '';
            if (pid != null && hasPid) {
                if (String(w.programId) !== String(pid)) continue;
                const di = parseInt(w.dayIndex, 10);
                if (Number.isInteger(di) && di >= 0 && di < days.length) idx = di;
                else idx = days.findIndex(d => d.type && d.type === w.type);
            } else if (!hasPid) {
                idx = days.findIndex(d => d.type && d.type === w.type);
            } else {
                continue;
            }
            if (idx < 0) continue;
            const t = new Date(w.date || 0).getTime();
            const time = Number.isFinite(t) ? t : 0;
            if (best < 0 || time > bestTime) { best = idx; bestTime = time; }
        }
        return best < 0 ? 0 : (best + 1) % days.length;
    },

    // Volume settimanale "frazionario" (Pelland 2025): primario 1, secondario 0.5
    calculateWeeklyVolume(program) {
        const vol = {};
        (program?.days || []).forEach(day => {
            (day.exercises || []).forEach(ex => {
                const db = this._db(ex.exerciseId);
                if (!db) return;
                const sets = parseInt(ex.sets, 10) || 0;
                db.primaryMuscles.forEach(m => { vol[m] = (vol[m] || 0) + sets; });
                db.secondaryMuscles.forEach(m => { vol[m] = (vol[m] || 0) + sets * 0.5; });
            });
        });
        Object.keys(vol).forEach(m => { vol[m] = Math.round(vol[m]); });
        return vol;
    },

    getSuggestedWorkoutDays(daysPerWeek) {
        const suggestions = {
            2: ['Lunedì', 'Giovedì'],
            3: ['Lunedì', 'Mercoledì', 'Venerdì'],
            4: ['Lunedì', 'Martedì', 'Giovedì', 'Venerdì'],
            5: ['Lunedì', 'Martedì', 'Giovedì', 'Venerdì', 'Sabato'],
            6: ['Lunedì', 'Martedì', 'Mercoledì', 'Venerdì', 'Sabato', 'Domenica']
        };
        return suggestions[daysPerWeek] || suggestions[4];
    },

    getTodaysWorkout(program) {
        if (!program || !program.days || !program.days.length) return null;
        const workouts = (typeof Storage !== 'undefined' && typeof Storage.getWorkouts === 'function') ? Storage.getWorkouts() : [];
        return program.days[this.getNextDayIndex(program, workouts)];
    },

    /**
     * Durata stimata (minuti): riscaldamento e defaticamento reali (Warmups, ripiego 8' e 5')
     * + serie × tempo sotto carico + riposi (anche quello dopo l'ultima serie, che l'app
     * cronometra fino all'esercizio dopo) + 30 s di cambio per esercizio.
     * Superset: riposo solo fra i giri.
     */
    estimateWorkoutDuration(workout) {
        if (!workout || !Array.isArray(workout.exercises) || !workout.exercises.length) return 0;
        let sec = (this._warmupMinutes(workout.warmup) + this._cooldownMinutes(workout.warmup)) * 60;
        const items = [];
        const groups = {};
        workout.exercises.forEach(ex => {
            if (!ex) return;
            if (ex.supersetGroup) {
                if (!groups[ex.supersetGroup]) { groups[ex.supersetGroup] = []; items.push(groups[ex.supersetGroup]); }
                groups[ex.supersetGroup].push(ex);
            } else {
                items.push([ex]);
            }
        });
        const restOf = (ex) => {
            const r = parseInt(ex.rest, 10);
            if (Number.isFinite(r) && r >= 0) return r;
            const type = ex.type || this._db(ex.exerciseId)?.type;
            return type === 'compound' ? 120 : 75;
        };
        const setsOf = (ex) => {
            const s = parseInt(ex.sets, 10);
            return Number.isFinite(s) && s > 0 ? s : 3;
        };
        const repsOf = (ex) => ex.reps != null ? ex.reps : ex.targetReps;
        items.forEach((it, i) => {
            const last = i === items.length - 1;
            if (it.length === 1 && !it[0].supersetGroup) {
                const ex = it[0];
                const s = setsOf(ex);
                const r = restOf(ex);
                sec += s * this._setSeconds(ex.exerciseId, repsOf(ex)) + (last ? s - 1 : s) * r + 30;
            } else {
                const s = Math.max(...it.map(setsOf));
                const trans = parseInt(it[0].transitionTime, 10);
                const tr = Number.isFinite(trans) ? trans : 10;
                const rr = parseInt(it[0].supersetRest, 10);
                const r = Number.isFinite(rr) ? rr : Math.round(Math.max(...it.map(restOf)) * 0.8);
                const round = it.reduce((a, ex) => a + this._setSeconds(ex.exerciseId, repsOf(ex)), 0) + (it.length - 1) * tr;
                sec += s * round + (last ? s - 1 : s) * r + 30 * it.length;
            }
        });
        return Math.round(sec / 60);
    },

    // ========================================
    // CONDITIONING
    // ========================================

    /**
     * generateConditioningSuggestions(goal, program) — accetta anche la vecchia firma
     * (goal, level, daysPerWeek, programDays).
     */
    generateConditioningSuggestions(goal, programOrLevel, legacyDays, legacyProgramDays) {
        let level = 'intermediate';
        let programDays = [];
        let daysPerWeek = 4;
        if (programOrLevel && typeof programOrLevel === 'object') {
            programDays = Array.isArray(programOrLevel.days) ? programOrLevel.days : [];
            level = programOrLevel.metadata?.level || level;
            daysPerWeek = programDays.length || programOrLevel.metadata?.daysPerWeek || daysPerWeek;
            goal = goal || programOrLevel.metadata?.goal;
        } else {
            level = programOrLevel || level;
            daysPerWeek = legacyDays || daysPerWeek;
            programDays = Array.isArray(legacyProgramDays) ? legacyProgramDays : [];
        }
        const g = this._normalizeGoal(goal);
        const config = (typeof CONDITIONING_BY_GOAL !== 'undefined' && CONDITIONING_BY_GOAL[g])
            ? CONDITIONING_BY_GOAL[g]
            : this.getDefaultConditioningConfig(g);

        if (!config || config.frequency === 0) {
            return {
                enabled: false,
                frequency: 0,
                message: g === 'strength' ? 'Cardio non consigliato per la forza' : 'Cardio non necessario',
                reason: "Il cardio intenso interferisce con il recupero e gli adattamenti di forza."
            };
        }

        const legDayIndices = programDays
            .map((d, i) => {
                const type = (typeof d === 'object' && d ? (d.type || '') : String(d || '')).toLowerCase();
                return /lower|leg|gambe|glute/.test(type) ? i : -1;
            })
            .filter(i => i >= 0);

        return {
            enabled: true,
            frequency: config.frequency,
            maxFrequency: config.maxFrequency,
            preferredType: config.preferredType,
            hiitAllowed: config.hiitAllowed,
            duration: config.preferredType === 'HIIT'
                ? (config.hiitDuration || config.duration)
                : (config.lissDuration || config.duration),
            protocol: this.getRecommendedProtocol(g, level),
            safeDaysForHIIT: this.calculateSafeDaysForHIIT(daysPerWeek, legDayIndices),
            legDays: legDayIndices,
            note: config.note,
            message: this.getConditioningMessage(config, g)
        };
    },

    // Giorni (indici della scheda) lontani dalle gambe: né il giorno di gambe né quello prima
    calculateSafeDaysForHIIT(daysPerWeek, legDayIndices) {
        const n = Math.max(1, daysPerWeek || 1);
        const safe = [];
        for (let i = 0; i < n; i++) {
            const isLeg = legDayIndices.includes(i);
            const beforeLeg = legDayIndices.includes((i + 1) % n);
            if (!isLeg && !beforeLeg) safe.push(i);
        }
        return safe;
    },

    // Protocollo HIIT: unica fonte HIIT_PROTOCOLS (conditioningExercises.js), scalato al livello
    getRecommendedProtocol(goal, level) {
        const P = (typeof HIIT_PROTOCOLS !== 'undefined' && HIIT_PROTOCOLS) ? HIIT_PROTOCOLS : null;
        if (!P) return null;
        const levelOrder = { beginner: 1, intermediate: 2, advanced: 3, expert: 3 };
        const userLevel = levelOrder[level] || 2;
        const cfg = (typeof CONDITIONING_BY_GOAL !== 'undefined' && CONDITIONING_BY_GOAL[goal]) || this.getDefaultConditioningConfig(goal);
        const protocol = P[cfg && cfg.protocol] || P.circuit30 || Object.values(P)[0];
        const pLevel = levelOrder[protocol && (protocol.level || protocol.difficulty)] || 2;
        if (pLevel > userLevel) return userLevel === 1 ? (P.beginner || P.circuit30 || protocol) : (P.circuit30 || protocol);
        return protocol;
    },

    // Solo se conditioningExercises.js non è caricato (es. test in Node)
    getDefaultConditioningConfig(goal) {
        const configs = {
            strength: { frequency: 0, maxFrequency: 1, preferredType: 'LISS', hiitAllowed: false, duration: 15 },
            hypertrophy: { frequency: 1, maxFrequency: 2, preferredType: 'LISS', hiitAllowed: true, duration: 20, protocol: 'circuit30' },
            recomp: { frequency: 2, maxFrequency: 3, preferredType: 'mixed', hiitAllowed: true, hiitDuration: 15, lissDuration: 25, protocol: 'circuit4020' },
            endurance: { frequency: 3, maxFrequency: 4, preferredType: 'HIIT', hiitAllowed: true, hiitDuration: 20, lissDuration: 30, protocol: 'tabata' },
            toning: { frequency: 2, maxFrequency: 3, preferredType: 'mixed', hiitAllowed: true, hiitDuration: 15, lissDuration: 30, protocol: 'circuit30' }
        };
        return configs[goal] || configs.hypertrophy;
    },

    getConditioningMessage(config, goal) {
        if (!config || config.frequency === 0) return 'Cardio non consigliato per il tuo obiettivo';
        const typeText = config.preferredType === 'mixed' ? 'HIIT + LISS' : config.preferredType;
        return `${config.frequency}× ${typeText} a settimana`;
    }
};
