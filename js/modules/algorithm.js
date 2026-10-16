/**
 * GymTracker Pro - Training Algorithm (v1.26 + algoritmo v2 della seduta)
 *
 * v2 (ALGORITMO-V2.md): tag degli esercizi, scala dei carichi della palestra, salti percentuali,
 * doppia progressione con correzione RIR, primo peso e "Trova il peso", rampa e dischi, alternative,
 * mesociclo 6/6/5/5 con RIR per settimana, seduta corta, scarico anticipato, cardio. Le funzioni v2
 * sono PURE (la data entra come parametro): Storage legge i dati e le chiama.
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

    // Riscaldamento e defaticamento GENERALI: routine ridotte alla durata scelta (Warmups,
    // 45' → 6'+3', 60' → 7'+4', 75' → 8'+5', 90' → 10'+5'); ripiego 8' e 5' senza Warmups.
    // Il giorno generato le porta con sé (warmupMin, cooldownMin): la stima usa le stesse.
    WARMUP_FALLBACK: 8,
    COOLDOWN_FALLBACK: 5,
    PLAN_SLACK: 75,

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
            intensification: 1.0,   // v2: il volume non cala in intensificazione (§12.2)
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
            if (ctx.goal === 'toning' && ctx.emphasis === 'lower') this._enforceLowerShare(ctx, days);
            this._rescueMinimums(ctx, days);
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
                emphasis: ctx.emphasis,
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

        const list = (v) => Array.isArray(v) ? v.filter(x => typeof x === 'string' && x) : [];
        const ctx = {
            goal, level, daysPerWeek, split, sessionDuration, cycleNumber,
            gender: profile.gender || '',
            female, eq, loadEquip,
            strength: goal === 'strength',
            toning: goal === 'toning',
            minExercises: loadEquip ? 4 : 3,
            usage: {},  // quante volte uno schema è già stato usato nella settimana (varietà)
            // preferenze della persona (§6.5): mai proposti, sempre primi, zone dolenti, enfasi
            avoid: new Set(list(profile.avoidExercises)),
            prefer: list(profile.preferExercises),
            pain: this._painAreas(profile),
            emphasis: ['lower', 'upper', 'balanced'].includes(profile.emphasis) ? profile.emphasis : (goal === 'toning' ? 'lower' : 'balanced'),
            // riscaldamento e defaticamento generali VERI per questa durata
            warmCool: {}
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
        // Enfasi scelta nel profilo (§4.3): una preferenza, non fisiologia. 'upper': parte alta +2 e
        // gambe al minimo del livello; 'lower' (fuori dalla tonificazione): il contrario. Nella
        // tonificazione 'upper'/'balanced' tolgono la priorità alla parte bassa.
        const UP = ['petto', 'schiena', 'spalle'], LO = ['quadricipiti', 'femorali', 'glutei'];
        if (ctx.emphasis === 'upper' || (ctx.toning && ctx.emphasis === 'balanced')) {
            UP.forEach(m => { T[m] = ctx.emphasis === 'upper' ? Math.min(V.max, Math.max(T[m], big(P)) + 2) : Math.max(T[m], big(P - 2)); });
            if (ctx.emphasis === 'upper') LO.forEach(m => { T[m] = Math.min(T[m], big(V.min)); });
        } else if (ctx.emphasis === 'lower' && !ctx.toning) {
            LO.forEach(m => { T[m] = Math.min(V.max, Math.max(T[m], big(V.min)) + 2); });
            UP.forEach(m => { T[m] = Math.min(T[m], big(V.min)); });
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
        if (ctx.avoid && ctx.avoid.has(id)) return false;
        if (ctx.pain && ctx.pain.length && ctx.pain.some(a => ((ex.joint || {})[a] || 0) === 2)) return false;
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
        // zone dolenti: chi sollecita quell'articolazione (joint 1) scende in fondo alla lista
        if (ctx.pain && ctx.pain.length) {
            const hurts = (id) => ctx.pain.some(a => ((this._db(id).joint || {})[a] || 0) >= 1) ? 1 : 0;
            elig = elig.map((id, i) => ({ id, i, h: hurts(id) })).sort((a, b) => (a.h - b.h) || (a.i - b.i)).map(x => x.id);
        }
        // "Tienilo fisso": l'esercizio preferito vince e non ruota (§6.5)
        const preferred = (ctx.prefer || []).find(id => elig.includes(id));
        if (preferred) {
            ctx.usage[key] = (ctx.usage[key] || 0) + 1;
            return { id: preferred, key, m: pat.m };
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
        if (ex.metric === 'time' || this.TIMED.includes(slot.id)) notes.push('secondi');
        if (ex.unilateral) notes.push('per lato');

        slot.role = role;
        slot.reps = reps;
        slot.rest = rest;
        slot.tul = this._setSecondsV2(slot.id, reps, ctx.goal);
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
        // Tempo per il lavoro = durata − riscaldamento e defaticamento generali RIDOTTI per questa durata
        const warmupMin = this._routineMinutes('warmup', spec.warmup, ctx.sessionDuration);
        const cooldownMin = this._routineMinutes('cooldown', spec.warmup, ctx.sessionDuration);
        // + PLAN_SLACK: il piano conta 30 s di cambio per ogni esercizio e il riposo dopo l'ultima serie,
        // la stima (§13.1) no; senza questo margine il piano lascerebbe ~2' inutilizzati
        const budget = (ctx.sessionDuration - warmupMin - cooldownMin) * 60 + this.PLAN_SLACK;
        return {
            index, type: spec.type, focus: spec.focus, warmup: spec.warmup, warmupMin, cooldownMin,
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
                sec += s.sets * this._slotRoundCost(s) + 30;   // un cambio per blocco, come la stima (§13.1)
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
                            // addome e polpacci in un superset non superano il loro obiettivo
                            const fixedT = x.role === 'core' || x.role === 'calves';
                            const lim = fixedT ? (ctx.targets[x.m] || 0)
                                : (members.length > 1 ? Math.min((ctx.targets[x.m] || 0) + over, this.VOLUME_CONFIG[ctx.level].max + 3) : (ctx.targets[x.m] || 0) + 1);
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

    // Addome con un esercizio non di addome; polpacci con un esercizio della parte alta (§13.2)
    _accessoryPairOk(a, b) {
        const core = (x) => x.role === 'core', calf = (x) => x.role === 'calves';
        if (core(a) !== core(b)) return !calf(a) && !calf(b) && !(core(a) ? b : a).compound;
        if (calf(a) !== calf(b)) return this.UPPER_MUSCLES.includes((calf(a) ? b : a).m) && !(calf(a) ? b : a).compound;
        return false;
    },

    _musclesCompatible(a, b) {
        return this.SUPERSET_MUSCLE_PAIRS.some(([x, y]) => (a === x && b === y) || (a === y && b === x));
    },

    // Sedute fino a 75': i superset antagonisti fanno stare più volume nel tempo (Zhang 2025: stesso
    // volume in meno tempo, senza perdere forza né crescita; Robbins 2010 con panca e rematore).
    _shortSession(ctx) {
        return ctx.sessionDuration <= 75;
    },

    // Multiarticolari della parte alta ammessi in superset antagonista nelle sedute corte
    SUPERSET_SHORT_OK: ['overhead-press', 't-bar-row'],

    _supersetEligible(ctx, s) {
        const short = this._shortSession(ctx);
        if (!s.active || s.group) return false;
        // addome e polpacci in superset solo nelle sedute corte (§13.2: core con qualunque esercizio,
        // polpacci con la parte alta)
        if ((s.role === 'core' || s.role === 'calves') && !short) return false;
        if (this.SUPERSET_EXCLUDED.includes(s.id) && !(short && this.SUPERSET_SHORT_OK.includes(s.id))) return false;
        const rules = this.SUPERSET_RULES[ctx.goal] || this.SUPERSET_RULES.hypertrophy;
        // forza: i complementari multiarticolari in superset antagonista solo nelle sedute corte
        if (!rules.allowCompound && s.compound && !short) return false;
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
        const maxPerDay = rules.maxPerDay + 1;   // v2: un superset in più al giorno (più volume nel tempo)
        let groups = new Set(d.slots.filter(s => s.group).map(s => s.group)).size;
        if (groups >= maxPerDay) return;
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
                else if (this._stationsNear(a.id, b.id) && (this._musclesCompatible(a.m, b.m) || this._accessoryPairOk(a, b))) {
                    score = 1; transition = this._stationFamily(a.id) === this._stationFamily(b.id) ? 10 : 15;
                }
                if (!score) continue;
                pairs.push({ a, b, score: score - Math.abs(a.order - b.order) * 0.05, transition });
            }
        }
        pairs.sort((x, y) => y.score - x.score);
        for (const p of pairs) {
            if (groups >= maxPerDay) break;
            if (p.a.group || p.b.group) continue;
            const members = [p.a, p.b].sort((x, y) => x.order - y.order);
            if (rules.useGiantSets) {
                // circuito: un terzo esercizio della stessa famiglia e di un altro muscolo
                const third = cand.find(c => !c.group && c !== p.a && c !== p.b && c.role !== 'core' && c.role !== 'calves' &&
                    p.a.role !== 'core' && p.a.role !== 'calves' && p.b.role !== 'core' && p.b.role !== 'calves' &&
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
            if (members.some(x => lvl > x.max)) return false;   // mai oltre le serie massime dello slot
            const delta = members.map(x => lvl - x.sets);
            const okVol = members.every((x, i) => delta[i] <= 0 || (
                this._canAddVolume(ctx, vol, d, x, delta[i], false) &&
                (vol[x.m] || 0) + delta[i] <= (ctx.targets[x.m] || 0) + (x.role === 'core' || x.role === 'calves' ? 0 : 1)));
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
     * Ultimo recupero dei minimi: un muscolo grande ancora sotto min−2 (petto ≥6 e polpacci al loro
     * minimo nella tonificazione) quando nei giorni c'è ancora tempo. Prima +1 serie a un esercizio
     * già attivo; se il superset in cui sta è bloccato dal compagno (tetto per seduta o serie
     * massime), il superset si scioglie; poi un esercizio nuovo da 2 serie.
     */
    _rescueMinimums(ctx, days) {
        const vol = ctx._vol;
        const V = this.VOLUME_CONFIG[ctx.level];
        const floors = {};
        this.BIG_MUSCLES.forEach(m => {
            floors[m] = Math.min(ctx.targets[m] || 0, V.min - 2);
            if (ctx.toning && m === 'petto') floors[m] = Math.max(floors[m], Math.min(6, ctx.targets.petto || 0));
        });
        if ((ctx.floors.polpacci || 0) > 0) floors.polpacci = ctx.toning ? Math.min(4, ctx.floors.polpacci) : ctx.floors.polpacci;
        const capOk = (d, x, n) => x.prims.every(p => (d.vol[p] || 0) + n <= (ctx.dayCap[p] != null ? ctx.dayCap[p] : 8) &&
            (p === x.m || !this.BIG_MUSCLES.includes(p) || (vol[p] || 0) + n <= V.max + 3)) &&
            (!(x.role === 'core' || x.role === 'calves') || floors[x.m] != null || (vol[x.m] || 0) + n <= (ctx.targets[x.m] || 0));
        // tonificazione: la parte alta non deve portare la quota della parte bassa sotto il 57%
        const shareOk = (x, n) => {
            if (!ctx.toning || !x.prims.some(p => this.UPPER_MUSCLES.includes(p))) return true;
            const lo = this.LOWER_MUSCLES.reduce((a, p) => a + (vol[p] || 0), 0);
            const up = this.UPPER_MUSCLES.reduce((a, p) => a + (vol[p] || 0), 0) + n * x.prims.filter(p => this.UPPER_MUSCLES.includes(p)).length;
            return lo / Math.max(1, lo + up) >= 0.57;
        };
        for (let guard = 0; guard < 120; guard++) {
            let moved = false;
            for (const m of Object.keys(floors)) {
                if ((vol[m] || 0) >= floors[m]) continue;
                let best = null;
                for (const d of days) {
                    const rem = d.budget - d.spent;
                    if (rem <= 0) continue;
                    for (const s of d.slots) {
                        if (s.prio >= 5 || !s.prims.includes(m) || !shareOk(s, s.active ? 1 : 2)) continue;
                        let opt = null;
                        if (s.active) {
                            if (s.sets >= s.max || !capOk(d, s, 1)) continue;
                            const members = s.group ? s.group.members : [s];
                            if (!s.group) opt = { kind: 'set', cost: s.tul + s.rest };
                            // il compagno del superset non deve superare il suo obiettivo (+1) né il massimo del livello
                            else if (members.every(x => x.sets < x.max && capOk(d, x, 1) && (x === s ||
                                x.prims.every(p => !this.BIG_MUSCLES.includes(p) || (vol[p] || 0) + 1 <= Math.min(V.max + 3, (ctx.targets[p] || 0) + 1)))))
                                opt = { kind: 'group', cost: this._slotRoundCost(s) };
                            else {
                                const g = s.group;
                                members.forEach(x => { x.group = null; });
                                const after = this._daySpent(d);
                                members.forEach(x => { x.group = g; });
                                opt = { kind: 'split', cost: after - d.spent + s.tul + s.rest };
                            }
                        } else {
                            if (!capOk(d, s, 2)) continue;
                            opt = { kind: 'activate', cost: 30 + 2 * (s.tul + s.rest) };
                        }
                        if (opt.cost > rem) continue;
                        // la serie che costa meno, a parità il giorno con più tempo libero
                        const per = opt.kind === 'activate' ? opt.cost / 2 : opt.cost;
                        if (!best || per < best.per - 1e-9 || (Math.abs(per - best.per) < 1e-9 && rem > best.rem)) best = { ...opt, d, s, per, rem };
                    }
                }
                if (!best) continue;
                const { d, s } = best;
                if (best.kind === 'group') {
                    s.group.members.forEach(x => { x.sets++; this._addVolume(vol, d, x, 1); });
                } else if (best.kind === 'activate') {
                    s.active = true; s.sets = 2; this._addVolume(vol, d, s, 2);
                } else {
                    if (best.kind === 'split') s.group.members.forEach(x => { x.group = null; });
                    s.sets++; this._addVolume(vol, d, s, 1);
                }
                d.spent = this._daySpent(d);
                moved = true;
            }
            if (!moved) break;
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
                // ruolo, schema e metrica (§19.1): servono a fasi, seduta corta e progressione
                out.role = s.role === 'core' ? 'core' : (ex.type === 'compound' ? (exercises.length === 0 ? 'main' : 'secondary') : 'accessory');
                out.pattern = ex.pattern || null;
                out.metric = ex.metric === 'time' ? 'time' : 'reps';
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
            // riscaldamento e defaticamento generali ridotti per la durata scelta (minuti veri)
            warmupMin: d.warmupMin,
            cooldownMin: d.cooldownMin,
            goal: ctx.goal,
            exercises
        };
    },

    // ========================================
    // MESOCICLO
    // ========================================

    // Mesociclo v2 (§12.1): settimane di lavoro con RIR che scende, poi SEMPRE una di scarico.
    // Uguale per tutti gli obiettivi; advanced/expert +1 serie nelle settimane 3-4.
    CYCLE_V2: {
        beginner: { comp: [3, 3, 2, 2, 2], iso: [3, 2, 2, 1, 1], extraWeeks: [] },
        intermediate: { comp: [3, 2, 2, 1, 1], iso: [2, 2, 1, 1, 0], extraWeeks: [] },
        advanced: { comp: [3, 2, 1, 1], iso: [2, 1, 1, 0], extraWeeks: [3, 4] },
        expert: { comp: [3, 2, 1, 1], iso: [2, 1, 1, 0], extraWeeks: [3, 4] }
    },

    /**
     * Fasi del mesociclo (sostituisce la tabella durate v1.26): 6/6/5/5 settimane, le prime ceil(n/2)
     * di accumulo, le altre di intensificazione, l'ultima di scarico (serie ÷2, carico −10%, RIR 4).
     * Ogni fase tiene la forma v1.26 ({week, phase, phaseName, rirTarget, volumeMultiplier}) più
     * { rir: {compound, isolation}, setsDelta, loadFactor }.
     */
    buildCycle(goal, level) {
        const config = this.CYCLE_CONFIG;
        const L = this.CYCLE_V2[level] || this.CYCLE_V2.intermediate;
        const n = L.comp.length;
        const acc = Math.ceil(n / 2);
        const phases = [];
        const rirTarget = (c, i) => ({ min: Math.min(c, i), max: Math.max(c, i) + (c === i ? 1 : 0) });
        for (let w = 1; w <= n; w++) {
            const phase = w <= acc ? 'accumulation' : 'intensification';
            const c = L.comp[w - 1], i = L.iso[w - 1];
            phases.push({
                week: w, phase, phaseName: config.phaseNames[phase], rirTarget: rirTarget(c, i), volumeMultiplier: 1,
                rir: { compound: c, isolation: i }, setsDelta: L.extraWeeks.includes(w) ? 1 : 0, loadFactor: 1
            });
        }
        phases.push({
            week: n + 1, phase: 'deload', phaseName: config.phaseNames.deload, rirTarget: rirTarget(4, 4), volumeMultiplier: 0.5,
            rir: { compound: 4, isolation: 4 }, setsDelta: 0, loadFactor: 0.9
        });
        return {
            duration: n + 1,
            currentWeek: 1,
            startDate: new Date().toISOString(),
            phases,
            isDeloadActive: false,
            version: 2
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

    // Fase normalizzata, con i default per le schede salvate prima della v2 (§19.1):
    // rir da rirTarget.min, setsDelta 0, loadFactor 1 (0,9 in scarico)
    normalizePhase(phase) {
        const ph = typeof phase === 'string' ? { phase } : (phase && typeof phase === 'object' ? phase : {});
        const key = ['accumulation', 'intensification', 'deload'].includes(ph.phase) ? ph.phase : 'accumulation';
        const isDeload = key === 'deload';
        const rt = ph.rirTarget && Number.isFinite(Number(ph.rirTarget.min)) ? ph.rirTarget : (this.CYCLE_CONFIG.rirTargets[key] || null);
        let rir = ph.rir && Number.isFinite(Number(ph.rir.compound)) ? { compound: Number(ph.rir.compound), isolation: Number(ph.rir.isolation ?? ph.rir.compound) } : null;
        if (!rir) rir = isDeload ? { compound: 4, isolation: 4 } : (rt ? { compound: Number(rt.min), isolation: Number(rt.min) } : { compound: 2, isolation: 2 });
        return {
            ...ph,
            phase: key,
            rirTarget: rt ? { min: Number(rt.min), max: Number(rt.max) } : null,
            rir,
            setsDelta: isDeload ? 0 : (Number.isFinite(Number(ph.setsDelta)) ? Number(ph.setsDelta) : 0),
            loadFactor: Number.isFinite(Number(ph.loadFactor)) && Number(ph.loadFactor) > 0 ? Number(ph.loadFactor) : (isDeload ? 0.9 : 1)
        };
    },

    /**
     * Copia del giorno con la fase (§12.2, sostituisce il moltiplicatore 0,9 della v1.26):
     * - lavoro: serie invariate (+setsDelta sul primo accessorio, o secondario, di ogni muscolo grande),
     *   targetRir per esercizio = rir.compound se multiarticolare, rir.isolation altrimenti;
     * - scarico: serie = max(1, ceil(serie/2)), targetRir 4, loadFactor 0,9.
     * Con una zona dolente che quell'esercizio sollecita (joint ≥1): RIR minimo 2.
     * ctx = { painAreas }
     */
    applyPhaseToDay(day, phase, ctx = {}) {
        const copy = JSON.parse(JSON.stringify(day || {}));
        const ph = this.normalizePhase(phase);
        const isDeload = ph.phase === 'deload';
        const exs = Array.isArray(copy.exercises) ? copy.exercises.filter(Boolean) : [];
        copy.exercises = exs;
        const prof = { painAreas: (ctx && ctx.painAreas) || [] };
        const roles = this._rolesOf(exs);
        exs.forEach((ex, i) => {
            const s = parseInt(ex.sets, 10);
            const sets = Number.isFinite(s) && s > 0 ? s : 0;
            if (isDeload && sets > 0) ex.sets = Math.max(1, Math.ceil(sets / 2));
            const compound = roles[i] === 'main' || roles[i] === 'secondary';
            let t = isDeload ? 4 : (compound ? ph.rir.compound : ph.rir.isolation);
            if (this._painTouches(ex.exerciseId, prof)) t = Math.max(2, t);
            ex.targetRir = t;
            if (ph.rirTarget) ex.rirTarget = { ...ph.rirTarget };
            if (isDeload) ex.loadFactor = ph.loadFactor;
        });
        // serie in più (advanced/expert, ultime settimane di lavoro): il primo accessorio (o secondario)
        // di ogni muscolo grande; un esercizio riceve al massimo una serie
        if (!isDeload && ph.setsDelta > 0) {
            const bumped = new Set();
            this.BIG_MUSCLES.forEach(m => {
                const has = (ex) => (this._metaOrDefault(ex.exerciseId).primaryMuscles || []).includes(m);
                const pick = exs.find((ex, i) => roles[i] === 'accessory' && !ex.supersetGroup && has(ex) && !bumped.has(ex))
                    || exs.find((ex, i) => roles[i] === 'secondary' && !ex.supersetGroup && has(ex) && !bumped.has(ex))
                    || exs.find((ex, i) => roles[i] === 'accessory' && has(ex) && !bumped.has(ex));
                if (!pick) return;
                const group = pick.supersetGroup ? exs.filter(o => o.supersetGroup === pick.supersetGroup) : [pick];
                group.forEach(o => { o.sets = (parseInt(o.sets, 10) || 0) + ph.setsDelta; bumped.add(o); });
            });
        }
        // superset: stesse serie per tutti i membri (scarico al ribasso)
        const bySs = {};
        exs.forEach(ex => { if (ex.supersetGroup) (bySs[ex.supersetGroup] = bySs[ex.supersetGroup] || []).push(ex); });
        Object.values(bySs).forEach(g => {
            const v = g.map(ex => parseInt(ex.sets, 10) || 0);
            const n = isDeload ? Math.min(...v) : Math.max(...v);
            g.forEach(ex => { ex.sets = n; });
        });
        copy.phase = ph.phase;
        copy.rirTarget = ph.rirTarget ? { ...ph.rirTarget } : null;
        copy.targetRir = { ...ph.rir };
        copy.volumeMultiplier = isDeload ? 0.5 : 1;
        copy.loadFactor = ph.loadFactor;
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
     * Durata stimata in minuti (§13.1):
     *   riscaldamento generale + serie di rampa × 90 s
     *   + esercizi singoli: serie × (tempo della serie + riposo)
     *   + superset: giri × (Σ tempi + transizioni) + giri × riposo del giro
     *   + 30 s di cambio fra i blocchi − il riposo dell'ultimo blocco + defaticamento.
     * Tempo della serie: metà del range × s/rep dell'obiettivo, fra 20 e 75 s, ×2 se unilaterale;
     * a tempo = metà del range in secondi.
     * Riscaldamento e defaticamento: ctx.warmupMin/cooldownMin, poi quelli del giorno (giorni v2:
     * proporzionali alla durata scelta), poi, con ctx.minutes, la routine ridotta per quella durata,
     * altrimenti la routine intera (ripiego 10') e 5' di defaticamento.
     * ctx = { goal, minutes, warmupMin, cooldownMin }
     */
    estimateWorkoutDuration(workout, ctx = {}) {
        if (!workout || !Array.isArray(workout.exercises) || !workout.exercises.length) return 0;
        const c = ctx || {};
        const goal = this._normalizeGoal(c.goal || workout.goal || 'hypertrophy');
        const pick = (...vals) => { for (const v of vals) { const n = Number(v); if (v != null && v !== '' && Number.isFinite(n) && n >= 0) return n; } return null; };
        const minutes = pick(c.minutes);
        const warmMin = pick(c.warmupMin, workout.warmupMin,
            minutes != null ? this._routineMinutes('warmup', workout.warmup, minutes) : null, this._warmupMinutes(workout.warmup)) ?? 10;
        const coolMin = pick(c.cooldownMin, workout.cooldownMin,
            minutes != null ? this._routineMinutes('cooldown', workout.warmup, minutes) : null) ?? 5;
        const exs = workout.exercises.filter(Boolean);
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
        const setSec = (ex) => this._setSecondsV2(ex.exerciseId, repsOf(ex), goal);
        let sec = warmMin * 60;
        exs.forEach(ex => {
            const ramp = Array.isArray(ex.warmupSets) ? ex.warmupSets.length : (parseInt(ex.rampSets, 10) || 0);
            sec += ramp * 90;
        });
        const blocks = this._blocks(exs);
        let lastRest = 0;
        blocks.forEach(b => {
            const it = b.idx.map(i => exs[i]);
            if (it.length === 1) {
                const ex = it[0];
                const s = setsOf(ex), r = restOf(ex);
                sec += s * setSec(ex) + s * r;
                lastRest = r;
            } else {
                const round = Math.max(...it.map(setsOf));
                const tr = Number.isFinite(parseInt(it[0].transitionTime, 10)) ? parseInt(it[0].transitionTime, 10) : 15;
                const rr = parseInt(it[0].supersetRest, 10);
                const r = Number.isFinite(rr) ? rr : Math.round(Math.max(...it.map(restOf)) * 0.8);
                sec += round * (it.reduce((a, ex) => a + setSec(ex), 0) + (it.length - 1) * tr) + round * r;
                lastRest = r;
            }
        });
        sec += 30 * (blocks.length - 1) - lastRest + coolMin * 60;
        return Math.round(sec / 60);
    },

    // Minuti VERI della routine generale (riscaldamento o defaticamento) ridotta per la durata scelta
    _routineMinutes(kind, key, sessionMinutes) {
        try {
            if (typeof Warmups !== 'undefined' && Warmups) {
                const fn = kind === 'warmup' ? Warmups.getWarmupForDuration : Warmups.getCooldownForDuration;
                if (typeof fn === 'function') {
                    const r = fn(key || 'full-body', sessionMinutes);
                    const v = Number(r && r.durationMin);
                    if (Number.isFinite(v) && v > 0) return v;
                }
            }
        } catch (e) { /* ripiego sotto */ }
        const budget = kind === 'warmup' ? this.warmupBudgetMin(sessionMinutes) : this.cooldownBudgetMin(sessionMinutes);
        const full = kind === 'warmup' ? this._warmupMinutes(key) : this._cooldownMinutes(key);
        return Math.min(budget, full);
    },

    // Tetto di riscaldamento e defaticamento generali per la durata scelta: in una seduta corta
    // conta il lavoro (Iversen 2021: per risparmiare tempo basta il riscaldamento specifico)
    warmupBudgetMin(sessionMinutes) {
        if (typeof Warmups !== 'undefined' && Warmups && typeof Warmups.getWarmupBudgetMin === 'function') return Warmups.getWarmupBudgetMin(sessionMinutes);
        const m = Number(sessionMinutes) || 60;
        return m < 45 ? 5 : (m < 60 ? 6 : (m < 75 ? 7 : (m < 90 ? 8 : 10)));
    },

    cooldownBudgetMin(sessionMinutes) {
        if (typeof Warmups !== 'undefined' && Warmups && typeof Warmups.getCooldownBudgetMin === 'function') return Warmups.getCooldownBudgetMin(sessionMinutes);
        const m = Number(sessionMinutes) || 60;
        return m < 60 ? 3 : (m < 75 ? 4 : 5);
    },

    // ========================================
    // v2 — PALESTRA, TAG, SCALA DEI CARICHI (ALGORITMO-V2.md §2-§3)
    // Funzioni PURE: niente localStorage, la data entra come parametro, chili in unità da 0,25 kg
    // dentro gli arrotondamenti. Storage legge i dati e chiama queste funzioni.
    // ========================================

    DEFAULT_GYM: {
        barKg: 20,
        ezBarKg: 10,
        plates: [25, 20, 15, 10, 5, 2.5, 1.25],     // dischi PER LATO, quantità illimitata
        plateCounts: null,                          // { 25: 2, ... } coppie per lato (facoltativo)
        dumbbells: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50],
        stackStepKg: 5, stackMinKg: 5, stackMaxKg: 150,
        cableStepKg: 2.5, cableMinKg: 2.5, cableMaxKg: 100,
        assistMaxKg: 70,
        loadablePlateStep: 2.5, loadableMaxKg: 60
    },

    PATTERN_ENUM: ['squat', 'lunge', 'hinge', 'bridge', 'push-h', 'push-v', 'pull-h', 'pull-v',
        'iso-chest', 'iso-back', 'iso-shoulder-lat', 'iso-shoulder-front', 'iso-shoulder-rear', 'iso-biceps',
        'iso-triceps', 'iso-quad', 'iso-ham', 'iso-glute', 'iso-calf', 'iso-traps', 'iso-forearm',
        'core-antiext', 'core-antilat', 'core-flex', 'core-rot', 'carry'],
    LOAD_TYPES: ['barbell', 'ez-bar', 'dumbbell-pair', 'dumbbell-single', 'machine-stack', 'machine-plate',
        'cable', 'bodyweight', 'bodyweight-loadable', 'assisted'],
    // Pattern "di gambe" (salti del 5% sui multiarticolari, stima del primo peso femminile 0,65)
    LEG_PATTERNS: ['squat', 'hinge', 'lunge', 'bridge'],
    LEG_SEED_PATTERNS: ['squat', 'hinge', 'lunge', 'bridge', 'iso-quad', 'iso-ham', 'iso-glute', 'iso-calf'],
    MACHINE_TYPES: ['machine-stack', 'machine-plate', 'cable'],
    RIR_BIAS: { beginner: 1, intermediate: 0.5, advanced: 0, expert: 0 },

    // Isometrie e trasporti: range in SECONDI per livello (§8.1)
    TIME_RANGES: {
        'plank': { beginner: [20, 30], intermediate: [30, 45], advanced: [45, 60], expert: [45, 60] },
        'side-plank': { beginner: [15, 25], intermediate: [20, 35], advanced: [30, 45], expert: [30, 45] },
        'mountain-climber': { beginner: [20, 30], intermediate: [30, 40], advanced: [30, 45], expert: [30, 45] },
        'dead-hang': { beginner: [15, 30], intermediate: [20, 40], advanced: [30, 60], expert: [30, 60] },
        'farmer-walk': { beginner: [30, 40], intermediate: [30, 45], advanced: [30, 45], expert: [30, 45] }
    },

    _u(kg) {
        return Math.round(Number(kg) * 4);
    },

    _num(v) {
        const n = typeof v === 'number' ? v : parseFloat(String(v == null ? '' : v).replace(',', '.'));
        return Number.isFinite(n) ? n : NaN;
    },

    // "62,5" — una riga per l'interfaccia, virgola decimale
    _fmtKg(kg) {
        const n = Math.round(Number(kg) * 100) / 100;
        return String(Number.isFinite(n) ? n : 0).replace('.', ',');
    },

    _level(level) {
        return this.VOLUME_CONFIG[level] ? level : 'intermediate';
    },

    /** Configurazione della palestra: default uniti a quella passata, valori non validi ignorati. */
    _gym(gym) {
        const D = this.DEFAULT_GYM;
        if (!gym || typeof gym !== 'object') return D;
        const pos = (v, d) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? n : d; };
        const list = (v, d, desc) => {
            if (!Array.isArray(v)) return d;
            const a = [...new Set(v.map(Number).filter(n => Number.isFinite(n) && n > 0))].sort((x, y) => desc ? y - x : x - y);
            return a.length ? a : d;
        };
        let counts = null;
        if (gym.plateCounts && typeof gym.plateCounts === 'object') {
            counts = {};
            Object.keys(gym.plateCounts).forEach(k => {
                const p = Number(k), c = Math.floor(Number(gym.plateCounts[k]));
                if (Number.isFinite(p) && p > 0 && c > 0) counts[p] = c;
            });
            if (!Object.keys(counts).length) counts = null;
        }
        return {
            barKg: pos(gym.barKg, D.barKg),
            ezBarKg: pos(gym.ezBarKg, D.ezBarKg),
            plates: list(gym.plates, D.plates, true),
            plateCounts: counts,
            dumbbells: list(gym.dumbbells, D.dumbbells, false),
            stackStepKg: pos(gym.stackStepKg, D.stackStepKg),
            stackMinKg: pos(gym.stackMinKg, D.stackMinKg),
            stackMaxKg: pos(gym.stackMaxKg, D.stackMaxKg),
            cableStepKg: pos(gym.cableStepKg, D.cableStepKg),
            cableMinKg: pos(gym.cableMinKg, D.cableMinKg),
            cableMaxKg: pos(gym.cableMaxKg, D.cableMaxKg),
            assistMaxKg: pos(gym.assistMaxKg, D.assistMaxKg),
            loadablePlateStep: pos(gym.loadablePlateStep, D.loadablePlateStep),
            loadableMaxKg: pos(gym.loadableMaxKg, D.loadableMaxKg)
        };
    },

    /**
     * Tag dell'esercizio (§2.2). Esercizi senza tag (id futuri, oggetti finti): derivati da tipo,
     * muscolo primario e categoria, senza mai lanciare. Id sconosciuto → null.
     */
    getExerciseMeta(exerciseId) {
        const ex = (exerciseId && typeof exerciseId === 'object') ? exerciseId : this._db(exerciseId);
        if (!ex) return null;
        if (ex.pattern && ex.loadType) return ex;
        const prim = Array.isArray(ex.primaryMuscles) ? ex.primaryMuscles : [];
        const m0 = prim[0] || '';
        const iso = { petto: 'iso-chest', schiena: 'iso-back', spalle: 'iso-shoulder-lat', bicipiti: 'iso-biceps',
            tricipiti: 'iso-triceps', quadricipiti: 'iso-quad', femorali: 'iso-ham', glutei: 'iso-glute',
            polpacci: 'iso-calf', addome: 'core-flex', trapezio: 'iso-traps', avambracci: 'iso-forearm' };
        const comp = { petto: 'push-h', tricipiti: 'push-h', spalle: 'push-v', schiena: 'pull-h', bicipiti: 'pull-v',
            quadricipiti: 'squat', femorali: 'hinge', glutei: 'bridge', addome: 'core-antiext' };
        const pattern = ex.type === 'compound' ? (comp[m0] || iso[m0] || 'push-h') : (iso[m0] || comp[m0] || 'iso-chest');
        const lt = { bilanciere: 'barbell', manubri: 'dumbbell-pair', macchine: 'machine-stack', cavi: 'cable' }[ex.category] || 'bodyweight';
        return {
            ...ex,
            secondaryMuscles: Array.isArray(ex.secondaryMuscles) ? ex.secondaryMuscles : [],
            primaryMuscles: prim,
            pattern, loadType: lt, barWeight: lt === 'barbell' ? 20 : 0, unilateral: false, metric: 'reps',
            tier: ex.type === 'compound' ? 2 : 3, prio: 2, stretch: false,
            joint: { shoulder: 0, elbow: 0, knee: 0, lowBack: 0 },
            family: ex.id || 'x', easier: [], harder: []
        };
    },

    _metaOrDefault(exerciseId) {
        return this.getExerciseMeta(exerciseId) || {
            id: exerciseId, name: String(exerciseId || ''), type: 'compound', loadType: 'machine-stack', metric: 'reps',
            pattern: '', tier: 2, prio: 2, primaryMuscles: [], secondaryMuscles: [], joint: {}, family: String(exerciseId || ''),
            easier: [], harder: [], equipment: []
        };
    },

    // Peso vero del bilanciere di quell'esercizio (0 per i "solo dischi" e per chi non ha bilanciere)
    _barFor(meta, g) {
        if (!meta || !['barbell', 'ez-bar', 'machine-plate'].includes(meta.loadType)) return 0;
        const bw = Number(meta.barWeight) || 0;
        if (bw === 20) return g.barKg;
        if (bw === 10) return g.ezBarKg;
        return bw;
    },

    // Somme per lato ottenibili con i dischi contati (unità da 0,25 kg)
    _plateSums(counts, maxU) {
        const items = [];
        Object.keys(counts).forEach(k => { for (let i = 0; i < counts[k]; i++) items.push(this._u(Number(k))); });
        let sums = new Set([0]);
        items.forEach(it => {
            const next = new Set(sums);
            sums.forEach(s => { if (s + it <= maxU) next.add(s + it); });
            sums = next;
        });
        return [...sums];
    },

    // Scala in unità, ordinata e senza doppioni, unita ai pesi registrati (§3.2)
    _ladderUnits(meta, g, recorded) {
        const U = new Set();
        const lt = meta.loadType;
        const add = (kg) => { const u = this._u(kg); if (Number.isFinite(u) && u >= 0) U.add(u); };
        const range = (min, max, step) => {
            const s = this._u(step);
            if (!(s > 0)) return;
            for (let u = this._u(min); u <= this._u(max); u += s) U.add(u);
        };
        switch (lt) {
            case 'barbell': case 'ez-bar': case 'machine-plate': {
                const ub = this._u(this._barFor(meta, g));
                if (g.plateCounts) {
                    this._plateSums(g.plateCounts, 1000).forEach(s => U.add(ub + 2 * s));
                } else {
                    const st = 2 * this._u(Math.min(...g.plates));
                    for (let u = ub; u <= ub + 2000; u += st) U.add(u);
                }
                break;
            }
            case 'dumbbell-pair': case 'dumbbell-single':
                g.dumbbells.forEach(add);
                break;
            case 'cable':
                range(g.cableMinKg, g.cableMaxKg, g.cableStepKg);
                break;
            case 'bodyweight':
                U.add(0);
                break;
            case 'bodyweight-loadable':
                U.add(0);
                if (['iso-calf', 'bridge', 'hinge'].includes(meta.pattern)) g.dumbbells.forEach(add);
                else range(g.loadablePlateStep, g.loadableMaxKg, g.loadablePlateStep);
                break;
            case 'assisted':
                range(g.stackMinKg, g.assistMaxKg, g.stackStepKg);
                break;
            default: // machine-stack (e ripiego)
                range(g.stackMinKg, g.stackMaxKg, g.stackStepKg);
        }
        if (lt !== 'bodyweight' && Array.isArray(recorded)) {
            recorded.forEach(w => {
                const n = Number(w);
                if (Number.isFinite(n) && (n > 0 || (n === 0 && lt === 'bodyweight-loadable'))) add(n);
            });
        }
        return [...U].sort((a, b) => a - b);
    },

    // Scala che copre anche pesi oltre il massimo configurato (manubri da 60 in una palestra grande):
    // si prosegue con l'ultimo intervallo della palestra, così lo stepper non torna mai indietro.
    _ladderAround(meta, kg, gym, recorded, steps = 1) {
        const g = this._gym(gym);
        const U = this._ladderUnits(meta, g, recorded);
        if (!U.length) return [0];
        if (meta.loadType !== 'bodyweight') {
            const last0 = U[U.length - 1];
            const want = Math.min(Math.ceil(Number(kg) * 4) || 0, last0 + 4000);
            const B = this._ladderUnits(meta, g, []);
            const gap = B.length >= 2 ? Math.max(1, B[B.length - 1] - B[B.length - 2]) : Math.max(4, B[0] || 4);
            let guard = 0;
            while (U[U.length - 1] <= want + gap * Math.max(1, Math.abs(steps)) && guard++ < 4000) U.push(U[U.length - 1] + gap);
        }
        return U;
    },

    /** Carichi possibili per l'esercizio (§3.2), uniti ai pesi già registrati. */
    getLoadLadder(exerciseId, gym, recorded = []) {
        const meta = this._metaOrDefault(exerciseId);
        return this._ladderUnits(meta, this._gym(gym), recorded).map(u => u / 4);
    },

    /** Porta kg sulla scala: 'floor' | 'ceil' | 'nearest' (a parità il più basso). */
    snapLoad(exerciseId, kg, mode = 'nearest', gym, recorded = []) {
        const meta = this._metaOrDefault(exerciseId);
        const U = this._ladderAround(meta, kg, gym, recorded, 1);
        const u = Number(kg) * 4;   // in quarti di kg, senza arrotondare (11,9 per difetto = 10)
        if (!Number.isFinite(u)) return U[0] / 4;
        const EPS = 1e-6;
        let lo = -1, hi = -1;
        for (let i = 0; i < U.length; i++) {
            if (U[i] <= u + EPS) lo = i;
            if (U[i] >= u - EPS && hi < 0) hi = i;
        }
        if (mode === 'floor') return (lo >= 0 ? U[lo] : U[0]) / 4;
        if (mode === 'ceil') return (hi >= 0 ? U[hi] : U[U.length - 1]) / 4;
        if (lo < 0) return U[hi] / 4;
        if (hi < 0) return U[lo] / 4;
        return (u - U[lo] <= U[hi] - u + EPS ? U[lo] : U[hi]) / 4;
    },

    /** Si sposta di `steps` gradini; un peso fuori scala conta il primo gradino sopra (o sotto) come uno. */
    stepLoad(exerciseId, kg, steps, gym, recorded = []) {
        const meta = this._metaOrDefault(exerciseId);
        const n = Math.trunc(Number(steps) || 0);
        const U = this._ladderAround(meta, kg, gym, recorded, n);
        const u = Number(kg) * 4;
        if (!Number.isFinite(u)) return U[0] / 4;
        if (n === 0) return this.snapLoad(exerciseId, kg, 'nearest', gym, recorded);
        const EPS = 1e-6;
        let idx = U.findIndex(v => Math.abs(v - u) < EPS);
        if (idx >= 0) idx += n;
        else if (n > 0) {
            const up = U.findIndex(v => v > u + EPS);
            idx = up < 0 ? U.length - 1 : up + n - 1;
        } else {
            let down = -1;
            U.forEach((v, i) => { if (v < u - EPS) down = i; });
            idx = down + n + 1;
        }
        return U[Math.max(0, Math.min(U.length - 1, idx))] / 4;
    },

    /** Un gradino "più duro": più carico, ma MENO assistenza per le trazioni assistite. */
    harderLoad(exerciseId, kg, gym, recorded = []) {
        const meta = this._metaOrDefault(exerciseId);
        return this.stepLoad(exerciseId, kg, meta.loadType === 'assisted' ? -1 : 1, gym, recorded);
    },

    /**
     * Dischi per lato (§3.5). Peso non ottenibile → il più vicino PER DIFETTO, exact false.
     * @returns {{perSide:number[], achieved:number, exact:boolean, belowBar:boolean}}
     */
    calcPlates(totalKg, opts = {}) {
        const barKg = Number.isFinite(Number(opts.barKg)) && Number(opts.barKg) >= 0 ? Number(opts.barKg) : 20;
        const plates = (Array.isArray(opts.plates) && opts.plates.length ? opts.plates : this.DEFAULT_GYM.plates)
            .map(Number).filter(p => Number.isFinite(p) && p > 0).sort((a, b) => b - a);
        const total = Number(totalKg);
        if (!Number.isFinite(total) || total < barKg) return { perSide: [], achieved: barKg, exact: false, belowBar: true };
        let rem = Math.floor((this._u(total) - this._u(barKg)) / 2);
        let perSide = [];
        const counts = opts.plateCounts && typeof opts.plateCounts === 'object' ? opts.plateCounts : null;
        if (!counts) {
            plates.forEach(p => {
                const pu = this._u(p);
                while (pu > 0 && pu <= rem) { perSide.push(p); rem -= pu; }
            });
        } else {
            // zaino limitato: massimo totale ≤ rem, a parità meno dischi, poi dischi più grandi prima
            const items = [];
            Object.keys(counts).map(Number).filter(p => Number.isFinite(p) && p > 0).sort((a, b) => b - a)
                .forEach(p => { for (let i = 0; i < Math.floor(Number(counts[p]) || 0); i++) items.push(p); });
            const better = (a, b) => {   // a meglio di b? (stessa somma)
                if (a.length !== b.length) return a.length < b.length;
                for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] > b[i];
                return false;
            };
            let best = new Map([[0, []]]);
            items.forEach(p => {
                const pu = this._u(p);
                const next = new Map(best);
                best.forEach((list, s) => {
                    const ns = s + pu;
                    if (ns > rem) return;
                    const cand = list.concat([p]).sort((a, b) => b - a);
                    const cur = next.get(ns);
                    if (!cur || better(cand, cur)) next.set(ns, cand);
                });
                best = next;
            });
            const top = Math.max(...best.keys());
            perSide = best.get(top);
        }
        const achieved = (this._u(barKg) + 2 * perSide.reduce((a, p) => a + this._u(p), 0)) / 4;
        return { perSide, achieved, exact: this._u(achieved) === this._u(total), belowBar: false };
    },

    /**
     * Salto di progressione (§3.6): +5% multiarticolari di gambe (tier ≤ 2), +2,5% il resto, sulla scala vera.
     * Corpo libero (e zavorra a 0) → null; assistite → un gradino di assistenza in meno.
     * @returns {{nextKg:number, pct:number, bigJump:boolean}|null}
     */
    getProgressionJump(exerciseId, kg, gym, recorded = []) {
        const meta = this._metaOrDefault(exerciseId);
        const lt = meta.loadType;
        const w = Number(kg) || 0;
        if (lt === 'bodyweight') return null;
        if (lt === 'bodyweight-loadable' && !(w > 0)) return null;
        if (lt === 'assisted') {
            const next = this.stepLoad(exerciseId, w, -1, gym, recorded);
            if (!(next < w)) return null;
            return { nextKg: next, pct: w > 0 ? (next - w) / w : 0, bigJump: false };
        }
        if (!(w > 0)) {
            const first = this.getLoadLadder(exerciseId, gym, recorded).find(x => x > 0);
            return first ? { nextKg: first, pct: 1, bigJump: true } : null;
        }
        const p = (this.LEG_PATTERNS.includes(meta.pattern) && (meta.tier || 3) <= 2) ? 0.05 : 0.025;
        let next = this.snapLoad(exerciseId, w * (1 + p), 'nearest', gym, recorded);
        if (next <= w) next = this.stepLoad(exerciseId, w, 1, gym, recorded);
        if (!(next > w)) return null;
        const pct = (next - w) / w;
        return { nextKg: next, pct, bigJump: pct > 0.10 + 1e-9 };
    },

    /** Rep da fare prima di un salto (Epley): ceil(((1 + lo/30) × next/kg − 1) × 30). */
    repsToEarnJump(lo, kg, nextKg) {
        const k = Number(kg), n = Number(nextKg), l = Number(lo);
        if (!(k > 0) || !(n > 0)) return Math.round(l) || 0;
        return Math.ceil(((1 + l / 30) * n / k - 1) * 30 - 1e-9);
    },

    needReps(range, kg, nextKg) {
        const [lo, hi] = range;
        return Math.max(hi, Math.min(hi + 5, this.repsToEarnJump(lo, kg, nextKg)));
    },

    // Difficoltà ammessa (§6.1): principianti solo "beginner" più gli accessori facili alle macchine
    _difficultyOk(meta, level) {
        const d = meta.difficulty || 'beginner';
        if (level === 'advanced' || level === 'expert') return true;
        if (level === 'intermediate') return d !== 'advanced';
        if (d === 'beginner') return true;
        return d === 'intermediate' && meta.tier === 3 && this.MACHINE_TYPES.includes(meta.loadType);
    },

    _painAreas(profile) {
        const a = profile && Array.isArray(profile.painAreas) ? profile.painAreas : [];
        return a.filter(x => ['shoulder', 'elbow', 'knee', 'lowBack'].includes(x));
    },

    // Esercizio ammesso per la persona (attrezzatura, difficoltà §6.1, zone dolenti, esclusi)
    _allowedFor(exerciseId, profile = {}, level) {
        const m = this.getExerciseMeta(exerciseId);
        if (!m || m.hidden) return false;
        if (!this._hasEquipment(m, this._normalizeEquipment(profile.equipment))) return false;
        if (!this._difficultyOk(m, this._level(level || profile.level))) return false;
        if (Array.isArray(profile.avoidExercises) && profile.avoidExercises.includes(exerciseId)) return false;
        if (this._painAreas(profile).some(a => (m.joint || {})[a] === 2)) return false;
        return true;
    },

    _firstAllowed(list, profile, level) {
        return (Array.isArray(list) ? list : []).find(id => this._allowedFor(id, profile, level)) || null;
    },

    // Area dolente con stress articolare ≥ 1 su quell'esercizio → RIR minimo 2
    _painTouches(exerciseId, profile) {
        const m = this.getExerciseMeta(exerciseId);
        return !!m && this._painAreas(profile).some(a => ((m.joint || {})[a] || 0) >= 1);
    },

    // ========================================
    // v2 — PRIMO PESO E "TROVA IL PESO" (§10)
    // ========================================

    // Uomo principiante, × peso corporeo; manubri = PER MANUBRIO [C]
    SEED_RATIO: {
        'squat|barbell': 0.35, 'squat|machine-plate': 0.50, 'squat|dumbbell-single': 0.12,
        'hinge|barbell': 0.40, 'hinge|dumbbell-pair': 0.12, 'hinge|dumbbell-single': 0.12,
        'lunge|barbell': 0.20, 'lunge|dumbbell-pair': 0.08,
        'bridge|barbell': 0.50, 'bridge|dumbbell-single': 0.20,
        'push-h|barbell': 0.30, 'push-h|dumbbell-pair': 0.10, 'push-h|machine-stack': 0.30, 'push-h|machine-plate': 0.20,
        'push-v|barbell': 0.20, 'push-v|dumbbell-pair': 0.07, 'push-v|machine-stack': 0.20,
        'pull-h|barbell': 0.30, 'pull-h|dumbbell-pair': 0.10, 'pull-h|dumbbell-single': 0.12,
        'pull-h|machine-stack': 0.35, 'pull-h|machine-plate': 0.20, 'pull-v|machine-stack': 0.35,
        'iso-quad|machine-stack': 0.25, 'iso-ham|machine-stack': 0.20,
        'iso-glute|machine-stack': 0.25, 'iso-glute|cable': 0.05, 'carry|dumbbell-pair': 0.20,
        'iso-chest|dumbbell-pair': 0.06, 'iso-chest|dumbbell-single': 0.10, 'iso-chest|machine-stack': 0.20, 'iso-chest|cable': 0.08,
        'iso-back|cable': 0.15,
        'iso-shoulder-lat|dumbbell-pair': 0.04, 'iso-shoulder-lat|machine-stack': 0.10, 'iso-shoulder-lat|cable': 0.03,
        'iso-shoulder-lat|ez-bar': 0.20,
        'iso-shoulder-front|dumbbell-pair': 0.04, 'iso-shoulder-front|cable': 0.05, 'iso-shoulder-front|ez-bar': 0.15,
        'iso-shoulder-rear|dumbbell-pair': 0.03, 'iso-shoulder-rear|machine-stack': 0.10, 'iso-shoulder-rear|cable': 0.10,
        'iso-biceps|ez-bar': 0.20, 'iso-biceps|dumbbell-pair': 0.06, 'iso-biceps|dumbbell-single': 0.06,
        'iso-biceps|cable': 0.12, 'iso-biceps|machine-stack': 0.12,
        'iso-triceps|ez-bar': 0.20, 'iso-triceps|dumbbell-pair': 0.04, 'iso-triceps|dumbbell-single': 0.10,
        'iso-triceps|cable': 0.12, 'iso-triceps|machine-stack': 0.25,
        'iso-calf|machine-stack': 0.50, 'iso-calf|machine-plate': 0.30,
        'iso-traps|dumbbell-pair': 0.15, 'iso-forearm|dumbbell-pair': 0.05,
        'core-flex|cable': 0.20, 'core-flex|machine-stack': 0.20, 'core-rot|cable': 0.08
    },
    SEED_LEVEL: { beginner: 1, intermediate: 1.4, advanced: 1.7, expert: 1.9 },

    _isMale(gender) {
        return /^(male|m|uomo|man)$/i.test(String(gender || '').trim());
    },

    /**
     * Stima PRUDENTE del primo peso (§10.1): tarata per lasciare ≥4 rep in riserva quasi a tutti.
     * @returns {{kg:number, rawKg:number, isEstimate:true, aboveSeed:boolean}}
     */
    estimateStartingLoad(exerciseId, profile = {}, gym, now = new Date()) {
        const meta = this.getExerciseMeta(exerciseId);
        const out = (kg, raw, above = false) => ({ kg, rawKg: Math.round(raw * 100) / 100, isEstimate: true, aboveSeed: above });
        if (!meta) return out(0, 0);
        const p = profile || {};
        const lt = meta.loadType;
        if (lt === 'bodyweight' || lt === 'bodyweight-loadable') return out(0, 0);
        const female = this._isFemale(p.gender), male = this._isMale(p.gender);
        const bw = Number(p.weight) > 0 ? Number(p.weight) : (female ? 62 : (male ? 78 : 70));
        const lvlF = this.SEED_LEVEL[p.level] || 1;
        if (lt === 'assisted') {
            // più assistenza = più prudente
            const raw = 0.6 * bw * (female ? 1.2 : 1) / lvlF;
            return out(this.snapLoad(exerciseId, raw, 'ceil', gym), raw);
        }
        const sexF = female ? (this.LEG_SEED_PATTERNS.includes(meta.pattern) ? 0.65 : 0.55) : (male ? 1 : 0.8);
        const ratio = this.SEED_RATIO[`${meta.pattern}|${lt}`];
        const g = this._gym(gym);
        if (ratio == null) {
            const min = this.getLoadLadder(exerciseId, g).find(x => x > 0) || 0;
            return out(min, min);
        }
        const raw = ratio * bw * sexF * lvlF;
        const bar = this._barFor(meta, g);
        let kg = this.snapLoad(exerciseId, raw, 'floor', g);
        if (lt !== 'machine-plate' && bar > 0 && kg < bar) kg = bar;
        return out(kg, raw, (lt === 'barbell' || lt === 'ez-bar') && bar > raw);
    },

    /**
     * "Trova il peso" (§10.2): massimo 3 serie di prova con RIR.
     * state = { tests: [{kg, reps, rir}], testReps, targetReps, targetRir, level, lo?, seedKg? }
     * @returns {{done:boolean, nextKg?:number, workingKg?:number, est?:number, lastIsWorkSet?:boolean}}
     */
    nextCalibrationStep(exerciseId, state = {}, gym) {
        const s = state || {};
        const tests = (Array.isArray(s.tests) ? s.tests : [])
            .map(t => ({ kg: this._num(t && t.kg), reps: Math.round(this._num(t && t.reps)), rir: this._num(t && t.rir) }))
            .filter(t => t.kg >= 0 && t.reps > 0);
        const testReps = Math.round(this._num(s.testReps)) || 10;
        const targetReps = Number.isFinite(this._num(s.targetReps)) ? this._num(s.targetReps) : testReps;
        const targetRir = Number.isFinite(this._num(s.targetRir)) ? this._num(s.targetRir) : 2;
        const level = this._level(s.level);
        if (!tests.length) {
            const seed = Number.isFinite(this._num(s.seedKg)) ? this._num(s.seedKg) : this.estimateStartingLoad(exerciseId, { level }, gym).kg;
            return { done: false, nextKg: seed, testReps };
        }
        const last = tests[tests.length - 1];
        const n = tests.length;
        let res;
        if (last.rir >= 4 && last.reps >= testReps) {
            if (n >= 3) res = { done: true, workingKg: this.snapLoad(exerciseId, last.kg * 1.15, 'nearest', gym) };
            else {
                let next = this.snapLoad(exerciseId, last.kg * (n === 1 ? 1.5 : 1.3), 'nearest', gym);
                if (next <= last.kg) next = this.stepLoad(exerciseId, last.kg, 1, gym);
                return { done: false, nextKg: next, testReps };
            }
        } else {
            const rir = Number.isFinite(last.rir) ? Math.min(4, Math.max(0, last.rir)) : 2;
            const q = rir + (this.RIR_BIAS[level] || 0) + (last.reps > 12 ? 0.5 : 0);
            const est = last.kg * (1 + (last.reps + q) / 30);
            let w = est / (1 + (targetReps + targetRir) / 30);
            w = Math.max(last.kg * 0.6, Math.min(last.kg * 1.6, w));
            res = { done: true, workingKg: this.snapLoad(exerciseId, w, 'floor', gym), est: Math.round(est * 10) / 10 };
        }
        // la prova vicina al peso giusto conta come prima serie di lavoro (la principiante non spreca serie)
        const lo = Number.isFinite(this._num(s.lo)) ? this._num(s.lo) : null;
        if (lo != null) {
            const a = Math.min(last.kg, res.workingKg), b = Math.max(last.kg, res.workingKg);
            res.lastIsWorkSet = last.reps >= lo && this.stepLoad(exerciseId, a, 1, gym) >= b;
        }
        return res;
    },

    // ========================================
    // v2 — PROGRESSIONE: doppia progressione + RIR (§9)
    // ========================================

    SUGGESTION_ACTION: {
        new: 'start', calibrate: 'start', detraining: 'return_deload', refamiliarize: 'refamiliarize',
        increase_weight: 'weight_up', increase_reps: 'reps_up', maintain: 'consolidate', rir_up: 'weight_up',
        rir_hold: 'consolidate', rir_down: 'deload_exercise', backoff: 'deload_exercise', variant_up: 'variant_up',
        variant_down: 'variant_down', add_load: 'weight_up', increase_time: 'reps_up', deload: 'deload'
    },

    _parseRange(range) {
        if (Array.isArray(range) && range.length >= 2) {
            const a = Math.round(this._num(range[0])), b = Math.round(this._num(range[1]));
            if (a > 0 && b > 0) return [Math.min(a, b), Math.max(a, b)];
        }
        if (range && typeof range === 'object' && !Array.isArray(range)) return this._parseRange([range.min, range.max]);
        if (typeof range === 'number' && range > 0) return [range, range];
        const m = String(range == null ? '' : range).match(/(\d+)\s*[-–—]\s*(\d+)/);
        if (m) return this._parseRange([m[1], m[2]]);
        const one = String(range == null ? '' : range).match(/(\d+)/);
        if (one && Number(one[1]) > 0) return [Number(one[1]), Number(one[1])];
        return [8, 12];
    },

    _daysBetween(a, b) {
        const x = new Date(a), y = new Date(b);
        if (isNaN(x.getTime()) || isNaN(y.getTime())) return NaN;
        return Math.round((Date.UTC(y.getFullYear(), y.getMonth(), y.getDate()) - Date.UTC(x.getFullYear(), x.getMonth(), x.getDate())) / 86400000);
    },

    _reduceReps(reps, factor) {
        const r = Math.max(1, Math.round(Number(reps) || 1));
        let t = Math.max(1, Math.floor(r * factor));
        if (t >= r && r > 1) t = r - 1;
        return t;
    },

    /**
     * Prossimo obiettivo per un esercizio (§9), funzione PURA.
     * input = { exerciseId, range: [lo, hi], targetRir (della seduta precedente), nextTargetRir,
     *   level, gym, recorded, sessions: [{date, phase, sets: [{weight, reps, rir, completed, isWarmup,
     *   isCalibration}]}] (recente prima), personPauseDays, now, profile, phase (della prossima seduta), loadFactor }
     * @returns Suggestion (§19.2): suggestedWeight SEMPRE un numero, message una riga senza emoji.
     */
    computeNextTarget(input = {}) {
        const id = input.exerciseId;
        const meta = this._metaOrDefault(id);
        const gym = this._gym(input.gym);
        const recorded = Array.isArray(input.recorded) ? input.recorded : [];
        const [lo, hi] = this._parseRange(input.range);
        const level = this._level(input.level);
        const prevRir = Number.isFinite(this._num(input.targetRir)) ? this._num(input.targetRir) : 2;
        const nextRir = Number.isFinite(this._num(input.nextTargetRir)) ? this._num(input.nextTargetRir) : prevRir;
        const profile = input.profile || {};
        const now = input.now ? new Date(input.now) : new Date();
        const lt = meta.loadType;
        const metric = meta.metric === 'time' ? 'time' : 'reps';
        const unit = metric === 'time' ? 's' : 'rep';
        const fmt = (kg) => this._fmtKg(kg);
        const step = (kg, n) => this.stepLoad(id, kg, n, gym, recorded);
        const snap = (kg, mode) => this.snapLoad(id, kg, mode, gym, recorded);

        const weightOf = (s) => {
            if (lt === 'bodyweight' || (s.isBodyweight && lt === 'bodyweight-loadable')) return 0;
            const w = this._num(s.weight);
            return Number.isFinite(w) && w > 0 ? w : 0;
        };
        const isWork = (s) => s && s.completed !== false && !s.isWarmup && !s.isCalibration && this._num(s.reps) > 0;
        const all = (Array.isArray(input.sessions) ? input.sessions : []).map(s => ({
            date: s && s.date,
            phase: (s && s.phase) || null,
            // lo della seduta (lo stesso esercizio può avere range diversi in giorni diversi)
            lo: s && s.targetReps ? this._parseRange(s.targetReps)[0] : null,
            work: ((s && Array.isArray(s.sets)) ? s.sets : []).filter(isWork).map(x => ({
                weight: weightOf(x),
                reps: Math.round(this._num(x.reps)),
                rir: Number.isFinite(this._num(x.rir)) ? Math.min(4, Math.max(0, this._num(x.rir))) : null
            }))
        })).filter(s => s.work.length);
        let valid = all.filter(s => s.phase !== 'deload');
        if (!valid.length && all.length) valid = all.slice();   // solo sedute di scarico: meglio di niente
        const base = { metric, variantId: null, bigJump: false, rirDelta: null, targetRir: nextRir };

        // 0. nessuna seduta: stima prudente (+ "Trova il peso" per chi comincia)
        if (!valid.length) {
            const est = this.estimateStartingLoad(id, { ...profile, level }, gym, now);
            const testReps = Math.round((lo + hi) / 2);
            const loaded = !['bodyweight', 'bodyweight-loadable'].includes(lt);
            const calibrate = loaded && level === 'beginner';
            return {
                ...base, status: 'new', action: 'start', suggestedWeight: est.kg, suggestedReps: lo, testReps,
                isEstimate: true, aboveSeed: est.aboveSeed, calibrate, increment: 0, lastPerformance: null,
                message: !loaded ? `Prima volta: ${lo}-${hi} ${unit}`
                    : (calibrate ? `Trova il peso: prova ${fmt(est.kg)} kg × ${testReps}` : `Prima volta: ${fmt(est.kg)} kg, ${lo}-${hi} ${unit}`)
            };
        }

        const maxW = (s) => Math.max(...s.work.map(x => x.weight));
        const firstTop = (s) => { const w = maxW(s); return s.work.find(x => Math.abs(x.weight - w) < 0.01).reps; };
        const last = valid[0];
        const W = maxW(last);
        const top = last.work.filter(x => Math.abs(x.weight - W) < 0.01);
        const first = top[0].reps;
        const lastPerformance = { weight: W, reps: last.work.map(x => x.reps), topReps: Math.max(...top.map(x => x.reps)), date: last.date };
        const mk = (status, w, reps, extra = {}) => ({
            ...base, status, action: this.SUGGESTION_ACTION[status] || 'consolidate',
            suggestedWeight: Math.round(w * 100) / 100, suggestedReps: reps,
            increment: Math.round((w - W) * 100) / 100, lastPerformance, ...extra
        });
        const noLoad = lt === 'bodyweight' || !(W > 0);

        // 1. pausa della PERSONA ≥ 21 giorni (invariato v1.26, sulla scala vera)
        const pause = this._num(input.personPauseDays);
        if (pause >= 21) {
            const weeks = pause / 7;
            const factor = Math.max(0.6, 1 - 0.025 * (weeks - 2));
            const weeksOff = Math.floor(weeks);
            let w = W, reduced = false;
            if (!noLoad) {
                if (lt === 'assisted') {
                    w = snap(W * (2 - factor), 'ceil');
                    if (w <= W) w = step(W, 1);
                    reduced = w > W;
                } else {
                    w = snap(W * factor, 'floor');
                    if (w >= W) w = step(W, -1);
                    if (w < W * 0.6 - 1e-9) w = snap(W * 0.6, 'ceil');
                    reduced = w > 0 && w < W;
                }
                if (!reduced) w = W;
            }
            const pct = reduced && lt !== 'assisted' ? Math.round((1 - w / W) * 100) : 0;
            const reps = reduced ? lo : this._reduceReps(lastPerformance.topReps, factor);
            const msg = reduced
                ? (lt === 'assisted' ? `Rientro dopo ${weeksOff} settimane: assistenza ${fmt(w)} kg, RIR 3`
                    : `Rientro dopo ${weeksOff} settimane: ${fmt(w)} kg (−${pct}%), RIR 3`)
                : (noLoad ? `Rientro dopo ${weeksOff} settimane: ${reps} ${unit}, RIR 3`
                    : `Rientro dopo ${weeksOff} settimane: ${fmt(W)} kg × ${reps}, RIR 3`);
            return mk('detraining', w, reps, { rirTarget: 3, targetRir: 3, weeksOff, reductionPct: pct, message: msg });
        }

        // 2. esercizio assente da ≥ 6 settimane, persona in attività (invariato v1.26)
        const exDays = this._daysBetween(all[0].date, now);
        if (Number.isFinite(exDays) && exDays >= 42) {
            let w = W, reps = lo, reduced = false;
            if (!noLoad) {
                const other = step(W, lt === 'assisted' ? 1 : -1);
                if (lt === 'assisted' ? other > W : (other > 0 && other >= W * 0.6 - 1e-9 && other < W)) { w = other; reduced = true; }
            }
            if (!reduced) reps = this._reduceReps(lastPerformance.topReps, 0.85);
            const weeksAbsent = Math.floor(exDays / 7);
            const msg = noLoad ? `Non lo fai da ${weeksAbsent} settimane: ${reps} ${unit}, RIR 3`
                : `Non lo fai da ${weeksAbsent} settimane: ${fmt(w)} kg${reduced ? '' : ` × ${reps}`}, RIR 3`;
            return mk('refamiliarize', w, reps, { rirTarget: 3, targetRir: 3, weeksAbsent, message: msg });
        }

        // Scarico: niente progressione, −10% e RIR 4 (§9.7)
        if (input.phase === 'deload') {
            const f = Number.isFinite(this._num(input.loadFactor)) && this._num(input.loadFactor) > 0 ? this._num(input.loadFactor) : 0.9;
            let w = W;
            if (!noLoad) w = lt === 'assisted' ? snap(W * (2 - f), 'ceil') : snap(W * f, 'floor');
            return mk('deload', w, lo, { targetRir: 4, message: noLoad ? `Scarico: ${lo} ${unit}, RIR 4` : `Scarico: ${fmt(w)} kg, RIR 4` });
        }

        const loOf = (s) => (s.lo != null ? s.lo : lo);
        const struggling = valid.slice(0, 3).filter(s => firstTop(s) < loOf(s)).length >= 2;
        const allHi = top.every(x => x.reps >= hi);
        const allLo = top.every(x => x.reps >= lo);
        const nameOf = (vid) => (this._db(vid) || {}).name || vid;

        // 3. isometrie e cardio a tempo senza carico (§9.4)
        if (metric === 'time' && noLoad) {
            const TR = (this.TIME_RANGES[id] || {})[level];
            const cap = (TR ? TR[1] : hi) + 15;
            if (allHi) {
                const next = first + 5;
                if (next <= cap) return mk('increase_time', W, next, { message: `+5 s: ${next} s` });
                const v = this._firstAllowed(meta.harder, profile, level);
                if (v) return mk('variant_up', 0, lo, { variantId: v, message: `Passa a ${nameOf(v)}` });
                return mk('maintain', W, Math.min(first, cap), { message: `Resta a ${Math.min(first, cap)} s` });
            }
            if (struggling) {
                const r = Math.max(5, Math.min(first, lo) - 5);
                return mk('backoff', W, r, { message: `−5 s: ${r} s` });
            }
            if (allLo) {
                const next = Math.min(hi, first + 5);
                return mk('increase_time', W, next, { message: `Punta a ${next} s` });
            }
            return mk('maintain', W, lo, { message: `Punta a ${lo} s` });
        }

        // 4. corpo libero, zavorra a 0, assistite (§9.4)
        if (lt === 'assisted') {
            if (allHi) {
                const next = step(W, -1);
                if (next < W) return mk('increase_weight', next, lo, { message: `Meno assistenza: ${fmt(next)} kg` });
                const v = this._firstAllowed(meta.harder, profile, level);
                if (v) return mk('variant_up', 0, lo, { variantId: v, message: `Passa a ${nameOf(v)}` });
                return mk('maintain', W, hi, { message: `Resta a ${fmt(W)} kg, ${hi} rep` });
            }
            if (struggling) {
                const more = step(W, 1);
                return mk('backoff', more, lo, { message: `Più assistenza: ${fmt(more)} kg` });
            }
            if (allLo) {
                const r = Math.min(first + 1, hi);
                return mk('increase_reps', W, r, { message: `${fmt(W)} kg, punta a ${r}` });
            }
            return mk('maintain', W, lo, { message: `Resta a ${fmt(W)} kg, punta a ${lo}` });
        }
        if (noLoad) {
            if (allHi) {
                const v = this._firstAllowed(meta.harder, profile, level);
                if (v) return mk('variant_up', 0, lo, { variantId: v, message: `Passa a ${nameOf(v)}` });
                if (lt === 'bodyweight-loadable') {
                    const add = this.getLoadLadder(id, gym, recorded).find(x => x > 0);
                    if (add) return mk('add_load', add, lo, { message: `+${fmt(add)} kg di zavorra` });
                }
                // nessuna variante: range esteso fino a hi + 10, una rep alla volta
                if (first < hi + 10) return mk('increase_reps', 0, first + 1, { message: `Punta a ${first + 1} rep` });
                return mk('maintain', 0, first, { message: `Resta a ${first} rep` });
            }
            if (struggling) {
                const v = this._firstAllowed(meta.easier, profile, level);
                if (v) return mk('variant_down', 0, lo, { variantId: v, message: `Passa a ${nameOf(v)}` });
                return mk('maintain', 0, lo, { message: `Punta a ${lo} rep` });
            }
            if (allLo) {
                const r = Math.min(first + 1, hi);
                return mk('increase_reps', 0, r, { message: `Punta a ${r} rep`, suggestedRepsPerSet: top.map(x => Math.min(Math.max(x.reps + 1, lo), hi)) });
            }
            return mk('maintain', 0, lo, { message: `Punta a ${lo} rep` });
        }

        // 5. caricati: doppia progressione → correzione RIR → stallo (§9.3, §9.5, §9.6)
        const J = this.getProgressionJump(id, W, gym, recorded);
        const need = J ? this.needReps([lo, hi], W, J.nextKg) : hi;
        let status, w = W, reps = lo;
        const extra = {};
        if (J && top.every(x => x.reps >= need)) { status = 'increase_weight'; w = J.nextKg; reps = lo; extra.bigJump = J.bigJump; }
        else if (allLo) { status = 'increase_reps'; reps = Math.min(first + 1, need); }
        else { status = 'maintain'; reps = lo; }

        if (W > 0 && metric === 'reps') {
            const withRir = top.filter(x => x.rir != null);
            if (withRir.length && withRir.length * 2 >= top.length) {
                const bias = (this.RIR_BIAS[level] || 0) + (first > 12 ? 0.5 : 0);
                const rirAdj = withRir.reduce((a, x) => a + x.rir, 0) / withRir.length + bias;
                const delta = rirAdj - prevRir;
                extra.rirDelta = Math.round(delta * 100) / 100;
                const p = 1 / (30 + first);
                if (delta >= 1.5) {
                    const Wr = snap(W * (1 + Math.min(0.10, (delta - 0.5) * p)), 'nearest');
                    if (status !== 'increase_weight') {
                        const up = Math.max(Wr, step(W, 1));
                        // un gradino grande (>10%, manubri e cavi leggeri) che il RIR da solo non giustifica
                        // non si forza: si resta e si guadagnano le rep del salto (§3.6)
                        if (up > W * 1.10 + 1e-9 && Wr < up) {
                            if (status === 'increase_reps' || allLo) { status = 'increase_reps'; reps = Math.min(Math.max(first + 1, lo), need); }
                        } else {
                            status = 'rir_up'; w = up; reps = Math.min(hi, Math.max(lo, first));
                        }
                    } else if (Wr > J.nextKg) {
                        status = 'rir_up'; w = Wr;
                    }
                } else if (delta <= -1.5) {
                    if (status === 'increase_weight') { status = 'rir_hold'; w = W; reps = first; extra.bigJump = false; }
                    else if (status === 'increase_reps') { status = 'rir_hold'; reps = first; }
                    if (delta <= -2.5 && first < lo) {
                        status = 'rir_down';
                        w = snap(W * (1 - Math.min(0.10, (-delta - 0.5) * p)), 'floor');
                        reps = lo;
                    }
                }
            }
        }

        // stallo: prima serie al top sotto lo allo stesso carico in ≥2 delle ultime 3 sedute valide;
        // la prima seduta dopo un salto grande (>10%) non conta
        if (status === 'maintain' || status === 'rir_down') {
            let stalls = 0;
            valid.slice(0, 3).forEach((s, i) => {
                const sw = maxW(s);
                if (Math.abs(sw - W) >= 0.01 || firstTop(s) >= loOf(s)) return;
                const prev = valid[i + 1];
                if (prev) { const pw = maxW(prev); if (pw > 0 && (sw - pw) / pw > 0.10 + 1e-9) return; }
                stalls++;
            });
            if (stalls >= 2) {
                const b = snap(W * 0.9, 'floor');
                if (b < W) { status = 'backoff'; w = b; reps = lo; }
            }
        }

        // chiaramente troppo leggero (tutte le serie ≥ hi+2 con "4+"): l'interfaccia può proporre "Trova il peso"
        if (W > 0 && metric === 'reps' && top.every(x => x.reps >= hi + 2) && top.filter(x => x.rir != null).length * 2 >= top.length &&
            top.filter(x => x.rir != null).every(x => x.rir >= 4) && top.some(x => x.rir != null)) extra.recalibrate = true;
        const u = metric === 'time' ? ' s' : '';
        const msg = {
            increase_weight: `Aumenta a ${fmt(w)} kg`,
            increase_reps: `${fmt(W)} kg, punta a ${reps}${u}`,
            maintain: `Resta a ${fmt(W)} kg, punta a ${reps}${u}`,
            rir_up: `Facile: ${fmt(w)} kg`,
            rir_hold: `Duro: resta a ${fmt(w)} kg`,
            rir_down: `Scala a ${fmt(w)} kg`,
            backoff: `Stallo: scendi a ${fmt(w)} kg`
        }[status];
        if (status === 'increase_reps') extra.suggestedRepsPerSet = top.map(x => Math.min(Math.max(x.reps + 1, lo), need));
        return mk(status, w, reps, { ...extra, message: msg });
    },

    // ========================================
    // v2 — RISCALDAMENTO SPECIFICO E RIPOSI (§11, §8.2)
    // ========================================

    /**
     * Rampa di riscaldamento del primo multiarticolare (§11) → [{kg, reps, pct}].
     * Niente rampa per corpo libero, zavorra, assistite, isolamenti, addome.
     */
    buildWarmupSets(exerciseId, workingKg, targetReps, goal, gym) {
        const meta = this.getExerciseMeta(exerciseId);
        const W = Number(workingKg);
        if (!meta || !(W > 0)) return [];
        if (['bodyweight', 'bodyweight-loadable', 'assisted'].includes(meta.loadType)) return [];
        if (meta.type !== 'compound' || /^core-|^iso-|^carry/.test(meta.pattern || '')) return [];
        const g = this._gym(gym);
        const reps = Math.round(this._num(targetReps)) || this._parseRange(targetReps)[0];
        const scheme = reps <= 6 ? [[0.40, 8], [0.60, 5], [0.80, 3], [0.90, 1]]
            : (W >= 100 ? [[0.50, 8], [0.70, 5], [0.85, 3]] : [[0.50, 8], [0.80, 5]]);
        const bar = meta.loadType === 'barbell' ? (Number(meta.barWeight) ? this._barFor(meta, g) : 0)
            : (meta.loadType === 'ez-bar' ? g.ezBarKg : 0);
        const out = [];
        const pct = (kg) => Math.round(kg / W * 100) / 100;
        if (bar > 0 && 0.5 * W - bar >= 10) out.push({ kg: bar, reps: 10, pct: pct(bar) });
        scheme.forEach(([p, r]) => {
            let kg = this.snapLoad(exerciseId, W * p, 'nearest', g);
            if (bar > 0 && kg < bar) kg = bar;
            if (kg >= W || (out.length && kg <= out[out.length - 1].kg)) return;
            out.push({ kg, reps: r, pct: pct(kg) });
        });
        if (!out.length) {
            const kg = this.snapLoad(exerciseId, W * 0.5, 'floor', g);
            if (kg < W) out.push({ kg, reps: 8, pct: pct(kg) });
        }
        return out;
    },

    REST_V2: {
        strength: { main: 240, compound: 150, isolation: 90 },
        hypertrophy: { main: 150, compound: 120, isolation: 75 },
        recomp: { main: 120, compound: 90, isolation: 60 },
        endurance: { main: 75, compound: 60, isolation: 45 },
        toning: { main: 105, compound: 90, isolation: 60 }
    },

    /** Riposo in secondi (§8.2): donna −15% con pavimenti 90/60/45, arrotondato ai 5 s. */
    getRestSeconds(exerciseId, role, goal, profile = {}, opts = {}) {
        if (opts.calibration) return 90;
        if (opts.ramp) return 60;
        const R = this.REST_V2[this._normalizeGoal(goal)] || this.REST_V2.hypertrophy;
        const meta = this._metaOrDefault(exerciseId);
        const isCore = role === 'core' || /^core-/.test(meta.pattern || '');
        const kind = role === 'main' ? 'main' : ((role === 'secondary' || role === 'compound') ? 'compound' : 'isolation');
        let rest = isCore ? 45 : (meta.pattern === 'iso-calf' ? this.REST_CALVES : R[kind]);
        if (this._isFemale(profile && profile.gender)) {
            rest *= 0.85;
            rest = Math.max(rest, isCore ? 45 : { main: 90, compound: 60, isolation: 45 }[kind]);
        }
        rest = Math.round(rest / 5) * 5;
        if (opts.compressed && (isCore || kind === 'isolation')) rest = isCore ? Math.max(45, Math.round(rest * 0.75)) : Math.max(60, Math.round(rest * 0.75));
        return rest;
    },

    // ========================================
    // v2 — ALTERNATIVE IN SEDUTA (§7)
    // ========================================

    STATION_OVERRIDE: {
        'lat-pulldown': 'lat-machine', 'lat-pulldown-close': 'lat-machine', 'leg-press': 'leg-press',
        'leg-press-calf-raise': 'leg-press', 'pec-deck': 'pec-deck', 'reverse-pec-deck': 'pec-deck',
        'smith-squat': 'smith', 'smith-bench-press': 'smith'
    },

    _station(exerciseId) {
        const m = this.getExerciseMeta(exerciseId);
        if (this.STATION_OVERRIDE[exerciseId]) return this.STATION_OVERRIDE[exerciseId];
        return m && ['machine-stack', 'machine-plate', 'assisted'].includes(m.loadType) ? exerciseId : null;
    },

    _isCoreMeta(m) {
        return /^core-/.test((m && m.pattern) || '');
    },

    /**
     * Alternative per l'esercizio in seduta (§7.1): macchina occupata, dolore, non mi piace.
     * opts = { reason: 'busy'|'pain'|'dislike', sessionExerciseIds, painArea, history, historyWeights, limit, gym, kg }
     * @returns [{ exerciseId, score, weight: { kg, confidence, mode } }]
     */
    getAlternatives(exerciseId, profile = {}, opts = {}) {
        const orig = this.getExerciseMeta(exerciseId);
        if (!orig || typeof EXERCISES_DB === 'undefined') return [];
        const prof = profile || {};
        const reason = opts.reason || 'dislike';
        const level = this._level(prof.level);
        const session = new Set(Array.isArray(opts.sessionExerciseIds) ? opts.sessionExerciseIds : []);
        const pains = [...new Set([...this._painAreas(prof), opts.painArea].filter(a => ['shoulder', 'elbow', 'knee', 'lowBack'].includes(a)))];
        const history = new Set(Array.isArray(opts.history) ? opts.history : []);
        const avoid = new Set(Array.isArray(prof.avoidExercises) ? prof.avoidExercises : []);
        const eq = this._normalizeEquipment(prof.equipment);
        const userHasLoad = ['manubri', 'macchine', 'bilanciere', 'cavi'].some(e => eq.has(e));
        const origLoaded = orig.loadType !== 'bodyweight';
        const origStation = this._station(exerciseId);
        const jac = (a, b) => {
            const A = new Set(a || []), B = new Set(b || []);
            const union = new Set([...A, ...B]).size;
            if (!union) return 0;
            let inter = 0;
            A.forEach(x => { if (B.has(x)) inter++; });
            return inter / union;
        };
        const out = [];
        Object.keys(EXERCISES_DB).forEach(id => {
            if (id === exerciseId || session.has(id) || avoid.has(id)) return;
            const m = this.getExerciseMeta(id);
            if (!m || m.hidden) return;
            if (!this._hasEquipment(m, eq) || !this._difficultyOk(m, level)) return;
            if (pains.some(a => (m.joint || {})[a] === 2)) return;
            if (this._isCoreMeta(m) !== this._isCoreMeta(orig)) return;
            const samePattern = m.pattern === orig.pattern;
            if (!samePattern && !m.primaryMuscles.some(x => orig.primaryMuscles.includes(x))) return;
            if (reason === 'busy' && origStation && this._station(id) === origStation) return;
            let score = samePattern ? 40 : 0;
            score += Math.round(25 * jac(m.primaryMuscles, orig.primaryMuscles)) + Math.round(10 * jac(m.secondaryMuscles, orig.secondaryMuscles));
            if (m.family === orig.family) score += 5;
            if (!!m.unilateral === !!orig.unilateral) score += 3;
            if (m.stretch && orig.stretch) score += 2;
            score += ({ 1: 6, 2: 3, 3: 0 })[m.prio] || 0;
            if (Math.abs((m.tier || 2) - (orig.tier || 2)) >= 2) score -= 10;
            pains.forEach(a => { if ((m.joint || {})[a] === 1) score -= 8; });
            if (history.has(id)) score += 8;
            if (m.loadType === 'bodyweight' && origLoaded && userHasLoad) score -= 15;
            out.push({ exerciseId: id, score });
        });
        out.sort((a, b) => (b.score - a.score) || (a.exerciseId < b.exerciseId ? -1 : 1));
        const limit = Number.isFinite(Number(opts.limit)) && Number(opts.limit) > 0 ? Number(opts.limit) : 5;
        const hw = opts.historyWeights && typeof opts.historyWeights === 'object' ? opts.historyWeights : {};
        return out.slice(0, limit).map(a => {
            let weight;
            if (history.has(a.exerciseId)) {
                const kg = Number.isFinite(Number(hw[a.exerciseId])) ? Number(hw[a.exerciseId]) : null;
                weight = { kg, confidence: 'alta', mode: 'history' };
            } else {
                weight = this.convertLoad(exerciseId, a.exerciseId, opts.kg, opts.gym);
                if (weight.mode === 'find') weight.seedKg = this.estimateStartingLoad(a.exerciseId, prof, opts.gym).kg;
            }
            return { ...a, weight };
        });
    },

    /**
     * Peso dell'alternativa (§7.2): conversione solo dove c'è un dato, altrimenti "Trova il peso".
     * @returns {{kg:number|null, confidence:'alta'|'media'|'bassa'|'none', mode:'convert'|'find'|'bodyweight', rirAdjust?:number}}
     */
    convertLoad(fromId, toId, kg, gym) {
        const a = this.getExerciseMeta(fromId), b = this.getExerciseMeta(toId);
        if (!a || !b) return { kg: null, confidence: 'none', mode: 'find' };
        if (b.loadType === 'bodyweight') return { kg: 0, confidence: 'alta', mode: 'bodyweight' };
        if (a.pattern !== b.pattern) return { kg: null, confidence: 'none', mode: 'find' };
        let f = null;
        const pair = (x, y) => a.loadType === x && b.loadType === y;
        if (a.pattern === 'push-h' && pair('barbell', 'dumbbell-pair')) f = 0.415;          // Saeterbakken 2011
        else if (a.pattern === 'push-h' && pair('dumbbell-pair', 'barbell')) f = 1 / 0.415;
        else if (a.pattern === 'push-v' && pair('barbell', 'dumbbell-pair')) f = 0.465;     // Saeterbakken & Fimland 2013
        else if (a.pattern === 'push-v' && pair('dumbbell-pair', 'barbell')) f = 1 / 0.465;
        else if (a.family === b.family && a.loadType === b.loadType && !['machine-stack', 'machine-plate', 'assisted'].includes(a.loadType)) f = 1;
        const w = Number(kg);
        if (f == null || !(w > 0)) return { kg: null, confidence: 'bassa', mode: 'find' };
        return { kg: this.snapLoad(toId, w * f, 'floor', gym), confidence: 'media', mode: 'convert', rirAdjust: 1 };
    },

    // ========================================
    // v2 — SEDUTA "HO POCO TEMPO" (§13)
    // ========================================

    SEC_PER_REP: { strength: 4, hypertrophy: 4.5, recomp: 4.5, toning: 4.5, endurance: 3.5 },

    // Secondi di UNA serie (§13.1): a tempo = metà del range; altrimenti metà del range × s/rep,
    // fra 20 e 75 s; ×2 per gli unilaterali (si fanno i due lati)
    _setSecondsV2(exerciseId, reps, goal) {
        const meta = this._metaOrDefault(exerciseId);
        const mid = this._avgReps(reps);
        const t = meta.metric === 'time' ? mid
            : Math.max(20, Math.min(75, mid * (this.SEC_PER_REP[goal] || this.SEC_PER_REP.hypertrophy)));
        return t * (meta.unilateral ? 2 : 1);
    },

    // Ruolo dell'esercizio nella seduta: dal campo `role`, altrimenti derivato (§19.1)
    _rolesOf(exercises) {
        let mainSeen = false;
        return exercises.map(ex => {
            if (ex && ['main', 'secondary', 'accessory', 'core'].includes(ex.role)) {
                if (ex.role === 'main') mainSeen = true;
                return ex.role;
            }
            const m = this._metaOrDefault(ex && ex.exerciseId);
            if (ex && ex.isCore || this._isCoreMeta(m) || (m.primaryMuscles || []).includes('addome')) return 'core';
            const compound = (ex && ex.type ? ex.type : m.type) === 'compound';
            if (compound && !mainSeen) { mainSeen = true; return 'main'; }
            return compound ? 'secondary' : 'accessory';
        });
    },

    // Blocchi contigui della seduta: esercizi singoli o superset (stessa lettera)
    _blocks(exercises) {
        const blocks = [];
        exercises.forEach((ex, i) => {
            const g = ex && ex.supersetGroup;
            const lastB = blocks[blocks.length - 1];
            if (g && lastB && lastB.group === g) lastB.idx.push(i);
            else blocks.push({ group: g || null, idx: [i] });
        });
        return blocks;
    },

    /**
     * Seduta compressa per chi ha poco tempo (§13.2). Passi in ordine, stima ricalcolata dopo ognuno:
     * S1 riscaldamento a 5', S2 riposi di accessori e core, S3 superset fra non-main compatibili,
     * S4 core via se c'è in ≥2 altri giorni, S5 accessori a 2 serie, S6 secondari −1, S7 via gli
     * accessori (prima quelli non d'enfasi, restano ≥3 esercizi), S8 main −1.
     * ctx = { goal, emphasis, coreDaysElsewhere, warmupMin, cooldownMin }
     * @returns {{day, changes, estimatedMinutes, fits}}
     */
    compressDay(day, minutes, ctx = {}) {
        const c = ctx || {};
        const goal = this._normalizeGoal(c.goal || (day && day.goal) || 'hypertrophy');
        const work = JSON.parse(JSON.stringify(day || {}));
        work.exercises = Array.isArray(work.exercises) ? work.exercises.filter(Boolean) : [];
        const target = Math.max(25, Number(minutes) || 0);
        const estCtx = { goal };
        if (c.warmupMin != null) estCtx.warmupMin = Number(c.warmupMin);
        if (c.cooldownMin != null) estCtx.cooldownMin = Number(c.cooldownMin);
        if (estCtx.warmupMin == null) estCtx.warmupMin = this._dayWarmupMin(work);
        const est = () => this.estimateWorkoutDuration(work, estCtx);
        const changes = [];
        const done = () => ({ day: work, changes, estimatedMinutes: est(), fits: est() <= target });
        if (!work.exercises.length || est() <= target) return { day: work, changes: [], estimatedMinutes: est(), fits: est() <= target };
        work.compressed = true;
        const roles = () => this._rolesOf(work.exercises);
        work.exercises.forEach((ex, i) => { if (!ex.role) ex.role = roles()[i]; });
        const setsOf = (ex) => Math.max(1, parseInt(ex.sets, 10) || 3);
        const restOf = (ex) => { const r = parseInt(ex.rest, 10); return Number.isFinite(r) && r >= 0 ? r : (ex.type === 'compound' ? 120 : 75); };
        const RANK = { main: 3, secondary: 2, accessory: 1, core: 0 };
        const unpair = (ex) => {
            const g = ex.supersetGroup;
            if (!g) return;
            work.exercises.forEach(o => {
                if (o.supersetGroup === g) { delete o.supersetGroup; delete o.supersetOrder; delete o.supersetRest; delete o.transitionTime; delete o.isGiantSet; }
            });
        };
        const membersOf = (ex) => ex.supersetGroup ? work.exercises.filter(o => o.supersetGroup === ex.supersetGroup) : [ex];
        const setSets = (ex, n) => membersOf(ex).forEach(o => { o.sets = n; });

        // S1: riscaldamento generale a 5 minuti (la rampa del main resta, al massimo 2 serie)
        if (!(estCtx.warmupMin <= 5)) {
            changes.push({ step: 'S1', what: 'warmup', from: estCtx.warmupMin, to: 5 });
            estCtx.warmupMin = 5;
            work.warmupMin = 5;
        }
        work.exercises.forEach(ex => {
            if (Array.isArray(ex.warmupSets) && ex.warmupSets.length > 2) { ex.warmupSets = ex.warmupSets.slice(-2); changes.push({ step: 'S1', exerciseId: ex.exerciseId, what: 'ramp', to: 2 }); }
        });
        if (est() <= target) return done();

        // S2: riposi più brevi per accessori e core
        work.exercises.forEach(ex => {
            if (ex.role !== 'accessory' && ex.role !== 'core') return;
            const r = restOf(ex);
            const to = ex.role === 'core' ? Math.max(45, Math.round(r * 0.75)) : Math.max(60, Math.round(r * 0.75));
            if (to < r) { ex.rest = to; changes.push({ step: 'S2', exerciseId: ex.exerciseId, what: 'rest', from: r, to }); }
        });
        work.exercises.forEach(ex => {
            if (ex.supersetGroup) {
                const m = membersOf(ex);
                ex.supersetRest = Math.min(parseInt(ex.supersetRest, 10) || 999, Math.round(Math.max(...m.map(restOf)) * 0.8));
            }
        });
        if (est() <= target) return done();

        // S3: superset fra esercizi non main compatibili (avido nell'ordine della seduta)
        const UPPER_P = /^(push-|pull-|iso-(chest|back|shoulder|biceps|triceps|traps|forearm))/;
        const OK = [['push-h', 'pull-h'], ['push-v', 'pull-v'], ['push-h', 'pull-v'], ['push-v', 'pull-h'],
            ['iso-biceps', 'iso-triceps'], ['iso-quad', 'iso-ham'], ['iso-chest', 'iso-shoulder-rear'],
            ['iso-shoulder-lat', 'iso-biceps'], ['iso-shoulder-lat', 'iso-triceps']];
        const FIXED = ['machine-stack', 'machine-plate', 'assisted'];
        const compatible = (a, b) => {
            const ma = this._metaOrDefault(a.exerciseId), mb = this._metaOrDefault(b.exerciseId);
            if ((ma.primaryMuscles || []).some(x => (mb.primaryMuscles || []).includes(x))) return false;
            if (FIXED.includes(ma.loadType) && FIXED.includes(mb.loadType)) return false;
            if (Math.abs(setsOf(a) - setsOf(b)) > 1) return false;
            const pa = ma.pattern || '', pb = mb.pattern || '';
            if (OK.some(([x, y]) => (pa === x && pb === y) || (pa === y && pb === x))) return true;
            if ((pa === 'iso-calf' && UPPER_P.test(pb)) || (pb === 'iso-calf' && UPPER_P.test(pa))) return true;
            return /^core-/.test(pa) || /^core-/.test(pb);
        };
        const used = new Set(work.exercises.map(e => e.supersetGroup).filter(Boolean));
        const letters = 'ABCDEFGHIJKL'.split('').filter(l => !used.has(l));
        for (let i = 0; i < work.exercises.length; i++) {
            const a = work.exercises[i];
            if (a.role === 'main' || a.supersetGroup) continue;
            const j = work.exercises.findIndex((b, k) => k > i && b.role !== 'main' && !b.supersetGroup && compatible(a, b));
            if (j < 0 || !letters.length) continue;
            const b = work.exercises[j];
            const letter = letters.shift();
            const ra = RANK[a.role] || 0, rb = RANK[b.role] || 0;
            const rounds = ra !== rb ? setsOf(ra > rb ? a : b) : Math.max(2, Math.min(setsOf(a), setsOf(b)));
            work.exercises.splice(j, 1);
            work.exercises.splice(i + 1, 0, b);
            const rest = Math.round(Math.max(restOf(a), restOf(b)) * 0.8);
            [a, b].forEach((x, k) => {
                x.sets = rounds; x.supersetGroup = letter; x.supersetOrder = k + 1; x.supersetRest = rest; x.transitionTime = 15;
            });
            changes.push({ step: 'S3', superset: [a.exerciseId, b.exerciseId], rounds });
            i++;
        }
        if (est() <= target) return done();

        // S4: niente addome oggi se c'è in almeno altri 2 giorni della settimana
        if ((Number(c.coreDaysElsewhere) || 0) >= 2) {
            work.exercises.filter(ex => ex.role === 'core').forEach(ex => {
                unpair(ex);
                work.exercises.splice(work.exercises.indexOf(ex), 1);
                changes.push({ step: 'S4', removed: ex.exerciseId });
            });
            if (est() <= target) return done();
        }

        // S5: accessori a 2 serie, dall'ultimo (non quello in superset con un esercizio di ruolo più alto)
        for (let i = work.exercises.length - 1; i >= 0; i--) {
            const ex = work.exercises[i];
            if (ex.role !== 'accessory' || setsOf(ex) <= 2) continue;
            if (membersOf(ex).some(o => (RANK[o.role] || 0) > RANK.accessory)) continue;
            changes.push({ step: 'S5', exerciseId: ex.exerciseId, what: 'sets', from: setsOf(ex), to: 2 });
            setSets(ex, 2);
            if (est() <= target) return done();
        }

        // S6: secondari −1 serie (minimo 2), dall'ultimo
        for (let i = work.exercises.length - 1; i >= 0; i--) {
            const ex = work.exercises[i];
            if (ex.role !== 'secondary' || setsOf(ex) <= 2) continue;
            if (ex.supersetGroup && membersOf(ex)[0] !== ex && membersOf(ex)[0].role === 'secondary') continue; // il gruppo si tocca una volta
            const n = setsOf(ex) - 1;
            changes.push({ step: 'S6', exerciseId: ex.exerciseId, what: 'sets', from: n + 1, to: n });
            setSets(ex, n);
            if (est() <= target) return done();
        }

        // S7: via gli accessori dall'ultimo, prima quelli che non sono del muscolo d'enfasi; restano ≥3 esercizi
        const emph = c.emphasis === 'lower' ? ['glutei'] : (c.emphasis === 'upper' ? ['petto', 'schiena', 'spalle'] : []);
        const isEmph = (ex) => (this._metaOrDefault(ex.exerciseId).primaryMuscles || []).some(m => emph.includes(m));
        for (const pass of [false, true]) {
            for (let i = work.exercises.length - 1; i >= 0; i--) {
                if (work.exercises.length <= 3) break;
                const ex = work.exercises[i];
                if (ex.role !== 'accessory' || isEmph(ex) !== pass) continue;
                unpair(ex);
                work.exercises.splice(i, 1);
                changes.push({ step: 'S7', removed: ex.exerciseId });
                if (est() <= target) return done();
            }
        }

        // S8: main −1 serie (minimo 2)
        const main = work.exercises.find(ex => ex.role === 'main');
        if (main && setsOf(main) > 2) {
            changes.push({ step: 'S8', exerciseId: main.exerciseId, what: 'sets', from: setsOf(main), to: setsOf(main) - 1 });
            setSets(main, setsOf(main) - 1);
        }
        return done();
    },

    // Minuti di riscaldamento generale che il giorno porta con sé (giorni v2) o della routine intera
    _dayWarmupMin(day) {
        const v = Number(day && day.warmupMin);
        if (Number.isFinite(v) && v >= 0) return v;
        return this._warmupMinutes(day && day.warmup);
    },

    // ========================================
    // v2 — SCARICO ANTICIPATO (§12.4)
    // ========================================

    /**
     * Suggerisce uno scarico anticipato (mai lo impone): ≥2 esercizi (≥40% dei valutati) in calo ≥5%
     * di prestazione stimata, oppure RIR sistematicamente sotto il target nelle ultime 2 sedute.
     * @returns {{suggest:boolean, reasons:string[], declining:string[]}}
     */
    detectEarlyDeload(workouts, program, now = new Date()) {
        const none = (why) => ({ suggest: false, reasons: why ? [why] : [], declining: [] });
        const list = (Array.isArray(workouts) ? workouts : []).filter(w => w && !isNaN(new Date(w.date).getTime()))
            .slice().sort((a, b) => new Date(b.date) - new Date(a.date));
        if (!list.length) return none();
        const t = new Date(now).getTime();
        const cycle = program && program.metadata && program.metadata.cycle;
        if (cycle && Array.isArray(cycle.phases) && cycle.phases.length) {
            const week = Math.max(1, parseInt(cycle.currentWeek, 10) || 1);
            const ph = this.getPhaseForWeek(cycle, week);
            const next = cycle.phases.find(p => p.week === week + 1);
            const manual = cycle.manualDeloadUntil && new Date(cycle.manualDeloadUntil).getTime() > t;
            if (week <= 1) return none('week1');
            if (manual || (ph && ph.phase === 'deload')) return none('deload_active');
            if (next && next.phase === 'deload') return none('deload_next');
        }
        const days = (d) => (t - new Date(d).getTime()) / 86400000;
        if (days(list[0].date) >= 10) return none('pause');
        if (list[1] && this._daysBetween(list[1].date, list[0].date) >= 10) return none('pause');

        const isDeloadW = (w) => w.cyclePhase === 'deload';
        const work = (s) => s && s.completed !== false && !s.isWarmup && !s.isCalibration && this._num(s.reps) > 0;
        // indice di prestazione per sessione ed esercizio (caricati, a ripetizioni)
        const sessions = {};
        list.filter(w => !isDeloadW(w) && days(w.date) <= 21).forEach(w => {
            (w.exercises || []).forEach(ex => {
                const m = this.getExerciseMeta(ex && ex.exerciseId);
                if (!m || m.metric === 'time' || ['bodyweight', 'bodyweight-loadable', 'assisted'].includes(m.loadType)) return;
                const tr = this._num(ex.targetRir);
                let pi = 0;
                (ex.sets || []).filter(work).forEach(s => {
                    const kg = this._num(s.weight);
                    if (!(kg > 0)) return;
                    const rir = Number.isFinite(this._num(s.rir)) ? this._num(s.rir) : (Number.isFinite(tr) ? tr : 2);
                    pi = Math.max(pi, kg * (1 + (this._num(s.reps) + rir) / 30));
                });
                if (pi > 0) (sessions[ex.exerciseId] = sessions[ex.exerciseId] || []).push({ date: w.date, pi });
            });
        });
        const declining = [];
        let evaluated = 0;
        Object.keys(sessions).sort().forEach(id => {
            const s = sessions[id];
            if (s.length < 3 || days(s[0].date) > 7) return;
            evaluated++;
            const drop = 1 - s[0].pi / ((s[1].pi + s[2].pi) / 2);
            if (drop >= 0.05 - 1e-9) declining.push(id);
        });
        const reasons = [];
        if (declining.length >= 2 && declining.length / evaluated >= 0.40) reasons.push('performance_drop');
        // RIR registrato sistematicamente sotto il target nelle ultime 2 sedute
        const diffs = [];
        list.slice(0, 2).forEach(w => (w.exercises || []).forEach(ex => {
            const tr = this._num(ex.targetRir);
            (ex.sets || []).filter(work).forEach(s => {
                const r = this._num(s.rir);
                if (Number.isFinite(r)) diffs.push(r - (Number.isFinite(tr) ? tr : 2));
            });
        }));
        if (diffs.length >= 6 && diffs.reduce((a, x) => a + x, 0) / diffs.length <= -1.5) reasons.push('rir_too_low');
        return { suggest: reasons.length > 0, reasons, declining };
    },

    // ========================================
    // CONDITIONING
    // ========================================

    // Cardio per obiettivo (§16.2): [sessioni, sessioni max, minuti, minuti max] [C, da Schumann 2022,
    // Murlasits 2018, Wewege 2017, OMS 2020]. HIIT in minuti di LAVORO.
    CARDIO_V2: {
        toning: { liss: { beginner: [2, 2, 30, 30], other: [2, 3, 30, 40] }, hiit: { beginner: [0, 0, 0, 0], other: [1, 1, 10, 15] } },
        recomp: { liss: { beginner: [2, 2, 30, 30], other: [2, 2, 30, 30] }, hiit: { beginner: [0, 0, 0, 0], other: [1, 1, 10, 15] } },
        hypertrophy: { liss: { beginner: [1, 2, 20, 30], other: [1, 2, 20, 30] }, hiit: { beginner: [0, 1, 10, 15], other: [0, 1, 10, 15] } },
        strength: { liss: { beginner: [1, 2, 20, 30], other: [1, 2, 20, 30] }, hiit: { beginner: [0, 0, 0, 0], other: [0, 0, 0, 0] } },
        endurance: { liss: { beginner: [1, 2, 30, 45], other: [1, 2, 30, 45] }, hiit: { beginner: [2, 2, 10, 15], other: [2, 2, 15, 20] } }
    },

    /**
     * Cardio della settimana (§16.2). Firma v1.26 + profile facoltativo; accetta anche la vecchia
     * (goal, level, daysPerWeek, programDays).
     * @returns {{ weekly: [{type:'liss'|'hiit', sessions, sessionsMax, minutes, minutesMax, intensity}],
     *   rules: string[], notes: string[], ...campi v1.26 (enabled, frequency, preferredType, protocol, legDays, ...) }}
     * Regole: HIIT_NOT_BEFORE_LEGS, AFTER_LIFTING_OR_3H, HIIT_MAX_2, LOW_IMPACT_FIRST, STEPS.
     */
    generateConditioningSuggestions(goal, programOrLevel, profileOrDays, legacyProgramDays) {
        let level = 'intermediate';
        let programDays = [];
        let daysPerWeek = 4;
        let profile = null;
        let program = null;
        if (typeof programOrLevel === 'string') {
            level = programOrLevel;
            daysPerWeek = Number(profileOrDays) || daysPerWeek;
            programDays = Array.isArray(legacyProgramDays) ? legacyProgramDays : [];
        } else {
            program = programOrLevel && typeof programOrLevel === 'object' ? programOrLevel : null;
            profile = profileOrDays && typeof profileOrDays === 'object' ? profileOrDays : null;
            programDays = program && Array.isArray(program.days) ? program.days : [];
            level = (profile && profile.level) || (program && program.metadata && program.metadata.level) || level;
            daysPerWeek = programDays.length || (program && program.metadata && program.metadata.daysPerWeek) || daysPerWeek;
            goal = goal || (program && program.metadata && program.metadata.goal);
        }
        const g = this._normalizeGoal(goal);
        const lvl = this._level(level);
        const T = this.CARDIO_V2[g] || this.CARDIO_V2.hypertrophy;
        const pick = (t) => t[lvl === 'beginner' ? 'beginner' : 'other'];
        const weekly = [];
        const [ls, lsMax, lm, lmMax] = pick(T.liss);
        if (lsMax > 0) weekly.push({ type: 'liss', sessions: ls, sessionsMax: lsMax, minutes: lm, minutesMax: lmMax, intensity: 'zona 2' });
        let [hs, hsMax, hm, hmMax] = pick(T.hiit);
        if (lvl === 'beginner') { hm = Math.min(hm, 15); hmMax = Math.min(hmMax, 15); }
        if (hsMax > 0) weekly.push({ type: 'hiit', sessions: hs, sessionsMax: hsMax, minutes: hm, minutesMax: hmMax, intensity: 'alta' });

        // giorni di gambe: il main è squat/hinge/bridge/lunge (o il nome del giorno lo dice)
        const legDayIndices = programDays.map((d, i) => {
            if (d && typeof d === 'object' && Array.isArray(d.exercises) && d.exercises.length) {
                const first = d.exercises.find(e => e && e.role === 'main') || d.exercises[0];
                const m = this.getExerciseMeta(first && first.exerciseId);
                if (m) return this.LEG_PATTERNS.includes(m.pattern) ? i : -1;
            }
            const type = (typeof d === 'object' && d ? (d.type || '') : String(d || '')).toLowerCase();
            return /lower|leg|gambe|glute/.test(type) ? i : -1;
        }).filter(i => i >= 0);

        const emphasis = (profile && ['lower', 'upper', 'balanced'].includes(profile.emphasis)) ? profile.emphasis : (g === 'toning' ? 'lower' : 'balanced');
        const rules = [];
        if (hsMax > 0) rules.push('HIIT_NOT_BEFORE_LEGS');
        rules.push('AFTER_LIFTING_OR_3H', 'HIIT_MAX_2');
        if (emphasis === 'lower' || g === 'hypertrophy') rules.push('LOW_IMPACT_FIRST');
        if (g === 'toning' || g === 'recomp') rules.push('STEPS');
        const NOTES = {
            HIIT_NOT_BEFORE_LEGS: 'Niente HIIT il giorno prima delle gambe',
            AFTER_LIFTING_OR_3H: 'Cardio dopo i pesi o a 3 ore di distanza',
            HIIT_MAX_2: lvl === 'beginner' ? 'HIIT al massimo 2 volte, 15 minuti' : 'HIIT al massimo 2 volte a settimana',
            LOW_IMPACT_FIRST: 'Meglio bici, ellittica o camminata in salita',
            STEPS: '7-10 mila passi al giorno'
        };

        // campi v1.26 (card della dashboard e modale del cardio)
        const config = (typeof CONDITIONING_BY_GOAL !== 'undefined' && CONDITIONING_BY_GOAL[g]) ? CONDITIONING_BY_GOAL[g] : this.getDefaultConditioningConfig(g);
        const frequency = ls + hs;
        const legacy = {
            enabled: frequency > 0,
            frequency,
            maxFrequency: lsMax + hsMax,
            preferredType: hs > 0 && ls > 0 ? 'mixed' : (hs > 0 ? 'HIIT' : 'LISS'),
            hiitAllowed: hsMax > 0,
            duration: hs > 0 && ls === 0 ? hm : lm,
            protocol: hsMax > 0 ? this.getRecommendedProtocol(g, lvl) : null,
            safeDaysForHIIT: this.calculateSafeDaysForHIIT(daysPerWeek, legDayIndices),
            legDays: legDayIndices,
            note: config && config.note,
            message: weekly.filter(w => w.sessions > 0).map(w => `${w.sessions}× ${w.type.toUpperCase()} ${w.minutes}'`).join(' + ') || 'Cardio facoltativo'
        };
        return { ...legacy, weekly, rules, notes: rules.map(r => NOTES[r]) };
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
