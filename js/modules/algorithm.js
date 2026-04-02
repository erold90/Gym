/**
 * GymTracker Pro - Training Algorithm
 * Generates personalized training programs based on scientific principles
 *
 * Key principles implemented:
 * - 10-20 sets per muscle group per week
 * - Each muscle trained 2x per week
 * - Compound exercises first
 * - 8-12 rep range for hypertrophy (Schoenfeld 2021, PMC7927075)
 * - Rest times: 150s compound, 60-90s isolation (Singer 2024 meta-analysis)
 * - Progressive overload through volume
 */

const TrainingAlgorithm = {

    // ========================================
    // CONFIGURATION
    // ========================================

    // Volume recommendations based on experience level
    VOLUME_CONFIG: {
        beginner: { min: 8, optimal: 10, max: 12 },
        intermediate: { min: 10, optimal: 14, max: 16 },
        advanced: { min: 12, optimal: 16, max: 20 },
        expert: { min: 14, optimal: 18, max: 22 }
    },

    // Rep ranges based on goal (scientifically optimized)
    // Sources: Schoenfeld 2021 (PMC7927075), ACSM, NSCA, Pelland 2025
    // Toning: Lasevicius 2022, Carvalho & Schoenfeld 2022 - higher reps equally effective for hypertrophy
    REP_RANGES: {
        strength: { compound: { min: 1, max: 5 }, isolation: { min: 6, max: 8 } },
        hypertrophy: { compound: { min: 8, max: 12 }, isolation: { min: 10, max: 15 } },
        recomp: { compound: { min: 8, max: 12 }, isolation: { min: 10, max: 15 } },
        endurance: { compound: { min: 15, max: 20 }, isolation: { min: 15, max: 25 } },
        toning: { compound: { min: 8, max: 12 }, isolation: { min: 12, max: 15 }, glute_accessory: { min: 12, max: 20 } }
    },

    // Special rep ranges for small/endurance muscles (always higher reps)
    SPECIAL_REP_RANGES: {
        polpacci: { min: 15, max: 20 },
        addome: { min: 12, max: 20 },
        avambracci: { min: 15, max: 20 }
    },

    // Rest times in seconds (scientifically optimized)
    // Sources: Singer 2024 Bayesian meta-analysis (Frontiers), de Salles 2009
    // Hypertrophy: 1-3 min optimal (2-2.5 min compounds, Singer 2024)
    // Strength: 3-5 min for compounds (de Salles 2009, Grgic 2023)
    // Toning: Harty 2018, Judge & Burke 2011 - women recover 25-50% faster between sets
    REST_TIMES: {
        strength: { compound: 240, isolation: 150 },      // 4min / 2.5min
        hypertrophy: { compound: 150, isolation: 90 },    // 2.5min / 1.5min
        recomp: { compound: 120, isolation: 90 },         // 2min / 1.5min
        endurance: { compound: 60, isolation: 45 },       // 1min / 45s
        toning: { compound: 90, isolation: 45 }           // 1.5min / 45s (female recovery, Harty 2018)
    },

    // Execution tempo by goal (scientifically optimized)
    // Format: eccentric-pause-concentric (in seconds, X = explosive)
    // Sources: PMC 2021, Evidence Based Athlete
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

    // Mesocycle configuration by goal and level
    // Sources: RP Strength, Weightlifting House, PMC Periodization Research
    CYCLE_CONFIG: {
        // Duration in weeks based on goal and level
        duration: {
            strength: { beginner: 4, intermediate: 6, advanced: 8, expert: 8 },
            hypertrophy: { beginner: 4, intermediate: 5, advanced: 6, expert: 6 },
            recomp: { beginner: 4, intermediate: 5, advanced: 6, expert: 6 },
            endurance: { beginner: 3, intermediate: 4, advanced: 5, expert: 5 },
            toning: { beginner: 4, intermediate: 5, advanced: 5, expert: 6 }
        },
        // Phase distribution (% of cycle)
        phases: {
            accumulation: 0.5,    // 50% - Volume building, RIR 3-4
            intensification: 0.35, // 35% - Intensity increase, RIR 1-2
            deload: 0.15          // 15% - Recovery, RIR 4+
        },
        // RIR targets per phase
        // Sources: Robinson 2024 (Sports Medicine), Helms/RP Strength
        // Most sets at 1-3 RIR, allow failure (0 RIR) in intensification
        rirTargets: {
            accumulation: { min: 2, max: 4 },
            intensification: { min: 0, max: 2 },
            deload: { min: 4, max: 5 }
        },
        // Volume multiplier per phase
        volumeMultiplier: {
            accumulation: 1.0,
            intensification: 0.9,
            deload: 0.5
        }
    },

    // Muscle groups by category
    PUSH_MUSCLES: ['petto', 'spalle', 'tricipiti'],
    PULL_MUSCLES: ['schiena', 'bicipiti', 'avambracci', 'trapezio'],
    LEG_MUSCLES: ['quadricipiti', 'femorali', 'glutei', 'polpacci'],
    CORE_MUSCLES: ['addome'],

    // Priority exercises per muscle (order matters - best first)
    EXERCISE_PRIORITY: {
        petto: {
            compound: ['bench-press', 'incline-bench-press', 'dumbbell-bench-press', 'dumbbell-incline-press', 'chest-press-machine', 'dips'],
            isolation: ['cable-crossover', 'dumbbell-fly', 'pec-deck', 'cable-fly-low']
        },
        schiena: {
            compound: ['barbell-row', 'pull-up', 'lat-pulldown', 't-bar-row', 'seated-cable-row', 'dumbbell-row', 'chest-supported-row'],
            isolation: ['straight-arm-pulldown', 'face-pull', 'cable-row-single']
        },
        spalle: {
            compound: ['overhead-press', 'dumbbell-shoulder-press', 'arnold-press', 'push-press'],
            isolation: ['lateral-raise', 'rear-delt-fly', 'front-raise', 'cable-lateral-raise', 'reverse-pec-deck']
        },
        bicipiti: {
            compound: ['chin-up'],
            isolation: ['barbell-curl', 'dumbbell-curl', 'hammer-curl', 'preacher-curl', 'incline-curl', 'cable-curl']
        },
        tricipiti: {
            compound: ['close-grip-bench', 'dips'],
            isolation: ['tricep-pushdown', 'skull-crusher', 'rope-pushdown', 'overhead-cable-extension', 'dumbbell-kickback']
        },
        quadricipiti: {
            // Alternating free weight / machine to avoid redundancy when selecting 2
            compound: ['squat', 'leg-press', 'front-squat', 'hack-squat', 'bulgarian-split-squat', 'dumbbell-lunge'],
            isolation: ['leg-extension']
        },
        femorali: {
            // Alternating hip-hinge patterns to avoid RDL + SLDL back-to-back
            compound: ['romanian-deadlift', 'good-morning', 'stiff-leg-deadlift', 'deadlift'],
            isolation: ['leg-curl-lying', 'leg-curl-seated', 'nordic-curl']
        },
        glutei: {
            compound: ['hip-thrust', 'deadlift', 'sumo-deadlift', 'squat', 'bulgarian-split-squat'],
            isolation: ['cable-kickback', 'hip-abduction', 'glute-bridge']
        },
        polpacci: {
            compound: [],
            isolation: ['standing-calf-raise', 'seated-calf-raise', 'leg-press-calf-raise']
        },
        addome: {
            compound: ['hanging-leg-raise', 'ab-wheel-rollout'],
            isolation: ['cable-crunch', 'crunch', 'plank', 'leg-raise', 'russian-twist']
        },
        trapezio: {
            compound: ['barbell-row', 'rack-pull'],
            isolation: ['dumbbell-shrug', 'barbell-shrug', 'face-pull']
        }
    },

    // ========================================
    // SUPERSET & GIANT SET CONFIGURATION
    // ========================================

    // Coppie predefinite — solo stessa attrezzatura/metro quadro
    SUPERSET_PAIRS: [
        // Panca + bilanciere (ti alzi dalla panca, row a terra)
        { exercises: ['bench-press', 'pendlay-row'], type: 'agonist-antagonist', station: 'bench-barbell', transition: 15 },
        { exercises: ['bench-press', 'barbell-row'], type: 'agonist-antagonist', station: 'bench-barbell', transition: 15 },
        // Stesso EZ bar + panca
        { exercises: ['ez-bar-curl', 'skull-crusher'], type: 'agonist-antagonist', station: 'ez-bar-bench', transition: 10 },
        { exercises: ['barbell-curl', 'skull-crusher'], type: 'agonist-antagonist', station: 'ez-bar-bench', transition: 10 },
        // Panca + manubri (stessa panca, giri posizione)
        { exercises: ['dumbbell-incline-press', 'dumbbell-row'], type: 'agonist-antagonist', station: 'bench-dumbbells', transition: 10 },
        { exercises: ['dumbbell-bench-press', 'dumbbell-row'], type: 'agonist-antagonist', station: 'bench-dumbbells', transition: 10 },
        { exercises: ['dumbbell-hip-thrust', 'glute-bridge'], type: 'compound-set', station: 'bench-floor', transition: 10 },
        // Stessi manubri in mano (non li posi)
        { exercises: ['lateral-raise', 'rear-delt-fly'], type: 'agonist-antagonist', station: 'dumbbells', transition: 5 },
        { exercises: ['dumbbell-curl', 'dumbbell-tricep-extension'], type: 'agonist-antagonist', station: 'dumbbells', transition: 5 },
        { exercises: ['dumbbell-curl', 'dumbbell-kickback'], type: 'agonist-antagonist', station: 'dumbbells', transition: 5 },
        { exercises: ['hammer-curl', 'dumbbell-kickback'], type: 'agonist-antagonist', station: 'dumbbells', transition: 5 },
        { exercises: ['dumbbell-shoulder-press', 'rear-delt-fly'], type: 'agonist-antagonist', station: 'dumbbells', transition: 5 },
        { exercises: ['goblet-squat', 'dumbbell-rdl'], type: 'agonist-antagonist', station: 'dumbbells', transition: 5 },
        { exercises: ['dumbbell-lunge', 'single-leg-rdl'], type: 'agonist-antagonist', station: 'dumbbells', transition: 5 },
        { exercises: ['dumbbell-lunge', 'dumbbell-rdl'], type: 'agonist-antagonist', station: 'dumbbells', transition: 5 },
        { exercises: ['goblet-squat', 'single-leg-rdl'], type: 'agonist-antagonist', station: 'dumbbells', transition: 5 },
        // Stesso cavo (cambi attacco/altezza)
        { exercises: ['cable-curl', 'tricep-pushdown'], type: 'agonist-antagonist', station: 'cable', transition: 10 },
        { exercises: ['cable-curl', 'rope-pushdown'], type: 'agonist-antagonist', station: 'cable', transition: 10 },
        { exercises: ['cable-hammer-curl', 'rope-pushdown'], type: 'agonist-antagonist', station: 'cable', transition: 10 },
        { exercises: ['cable-crossover', 'straight-arm-pulldown'], type: 'agonist-antagonist', station: 'cable', transition: 10 },
        // A terra stessa zona (corpo libero)
        { exercises: ['glute-bridge', 'donkey-kick'], type: 'compound-set', station: 'floor', transition: 5 },
        { exercises: ['single-leg-glute-bridge', 'fire-hydrant'], type: 'compound-set', station: 'floor', transition: 5 },
        { exercises: ['glute-bridge', 'fire-hydrant'], type: 'compound-set', station: 'floor', transition: 5 },
        { exercises: ['bodyweight-calf-raise', 'crunch'], type: 'agonist-antagonist', station: 'floor', transition: 5 },
        { exercises: ['bodyweight-calf-raise', 'reverse-crunch'], type: 'agonist-antagonist', station: 'floor', transition: 5 },
    ],

    // Giant set (3 esercizi) — solo per endurance
    GIANT_SET_GROUPS: [
        // Stessi manubri
        { exercises: ['push-up', 'dumbbell-row', 'lateral-raise'], station: 'dumbbells-floor', transition: 15 },
        { exercises: ['dumbbell-bench-press', 'rear-delt-fly', 'dumbbell-curl'], station: 'bench-dumbbells', transition: 15 },
        { exercises: ['goblet-squat', 'dumbbell-rdl', 'walking-lunge'], station: 'dumbbells', transition: 15 },
        // Stesso cavo
        { exercises: ['rope-pushdown', 'cable-curl', 'face-pull'], station: 'cable', transition: 10 },
        // A terra corpo libero
        { exercises: ['glute-bridge', 'reverse-crunch', 'plank'], station: 'floor', transition: 10 },
        { exercises: ['bodyweight-calf-raise', 'bodyweight-squat', 'mountain-climber'], station: 'floor', transition: 10 },
        { exercises: ['donkey-kick', 'fire-hydrant', 'single-leg-glute-bridge'], station: 'floor', transition: 10 },
    ],

    // Regole per goal
    SUPERSET_RULES: {
        strength:    { maxPerDay: 2, allowCompound: false, useGiantSets: false },
        hypertrophy: { maxPerDay: 4, allowCompound: true,  useGiantSets: false },
        recomp:      { maxPerDay: 5, allowCompound: true,  useGiantSets: false },
        toning:      { maxPerDay: 4, allowCompound: true,  useGiantSets: false },
        endurance:   { maxPerDay: 8, allowCompound: true,  useGiantSets: true  },  // Myers 2023: circuit-like structure superiore per endurance
    },

    // Esercizi MAI in superset (compound pesanti, alta richiesta tecnica/sistema nervoso)
    SUPERSET_EXCLUDED: [
        'squat', 'front-squat', 'deadlift', 'romanian-deadlift', 'stiff-leg-deadlift',
        'hip-thrust', 'sumo-deadlift', 'overhead-press', 'push-press', 'good-morning',
        'hack-squat', 'leg-press', 'smith-squat'
    ],

    /**
     * Post-processing: applica superset/giant set a una lista di esercizi generata
     * Non forza nulla — crea superset solo se entrambi gli esercizi sono presenti
     */
    applySupersets(exercises, goal) {
        const rules = this.SUPERSET_RULES[goal] || this.SUPERSET_RULES.hypertrophy;
        const useGiants = rules.useGiantSets;
        const maxGroups = rules.maxPerDay;

        // Indici disponibili (non esclusi)
        const available = new Set();
        exercises.forEach((ex, i) => {
            if (!this.SUPERSET_EXCLUDED.includes(ex.exerciseId)) {
                if (rules.allowCompound || ex.type !== 'compound') {
                    available.add(i);
                }
            }
        });

        // Build lookup exerciseId -> index
        const idToIndex = {};
        exercises.forEach((ex, i) => {
            if (available.has(i)) {
                idToIndex[ex.exerciseId] = i;
            }
        });

        const usedIndices = new Set();
        let groupLetter = 0; // 0=A, 1=B, etc.
        const groups = []; // { indices: [i, j], pair, isGiant }

        // Try giant sets first (for endurance)
        if (useGiants) {
            for (const gs of this.GIANT_SET_GROUPS) {
                if (groupLetter >= maxGroups) break;
                const indices = gs.exercises.map(id => idToIndex[id]).filter(i => i !== undefined && !usedIndices.has(i));
                if (indices.length === gs.exercises.length) {
                    groups.push({ indices, transition: gs.transition, isGiant: true });
                    indices.forEach(i => usedIndices.add(i));
                    groupLetter++;
                }
            }
        }

        // Then try pairs
        for (const pair of this.SUPERSET_PAIRS) {
            if (groupLetter >= maxGroups) break;
            const [id1, id2] = pair.exercises;
            const i1 = idToIndex[id1];
            const i2 = idToIndex[id2];
            if (i1 !== undefined && i2 !== undefined && !usedIndices.has(i1) && !usedIndices.has(i2)) {
                groups.push({ indices: [i1, i2], transition: pair.transition, isGiant: false });
                usedIndices.add(i1);
                usedIndices.add(i2);
                groupLetter++;
            }
        }

        if (groups.length === 0) return exercises;

        // Assign superset fields
        const letters = 'ABCDEFGH';
        groups.forEach((g, gi) => {
            const letter = letters[gi] || letters[0];
            const supersetRest = Math.round(
                Math.max(...g.indices.map(i => exercises[i].rest || 90)) * 0.8
            );

            // Equalize sets across grouped exercises (superset requires same rounds)
            const maxSets = Math.max(...g.indices.map(i => exercises[i].sets));
            g.indices.forEach(idx => { exercises[idx].sets = maxSets; });

            g.indices.forEach((idx, order) => {
                exercises[idx].supersetGroup = letter;
                exercises[idx].supersetOrder = order + 1;
                exercises[idx].supersetRest = supersetRest;
                exercises[idx].transitionTime = g.transition;
                exercises[idx].isGiantSet = g.isGiant;
            });
        });

        // Reorder: singoli pesanti first, then superset groups, then remaining singles
        const singles = [];
        const supersetExercises = [];
        const remainingSingles = [];

        exercises.forEach((ex, i) => {
            if (ex.supersetGroup) {
                supersetExercises.push(ex);
            } else if (this.SUPERSET_EXCLUDED.includes(ex.exerciseId)) {
                singles.push(ex); // Heavy compound first
            } else {
                remainingSingles.push(ex);
            }
        });

        // Sort superset exercises by group letter then order
        supersetExercises.sort((a, b) => {
            if (a.supersetGroup !== b.supersetGroup) return a.supersetGroup.localeCompare(b.supersetGroup);
            return a.supersetOrder - b.supersetOrder;
        });

        return [...singles, ...supersetExercises, ...remainingSingles];
    },

    // ========================================
    // MAIN GENERATION FUNCTION
    // ========================================

    generateProgram(profile, options) {
        const {
            goal = 'recomp',
            daysPerWeek = 4,
            split = 'upper-lower',
            sessionDuration = 60
        } = options;

        // Determine volume based on experience
        const volumeConfig = this.VOLUME_CONFIG[profile.level] || this.VOLUME_CONFIG.intermediate;
        const repRanges = this.REP_RANGES[goal] || this.REP_RANGES.hypertrophy;
        const restTimes = this.REST_TIMES[goal] || this.REST_TIMES.hypertrophy;

        // Session duration modifier: scale exercise count based on available time
        // Base reference: 60 min. Shorter sessions = fewer exercises, longer = more accessories
        const durationFactor = Math.max(0.7, Math.min(1.3, sessionDuration / 60));

        let program;

        // Note: Bro Split removed - scientific research shows training each muscle
        // 2x/week is superior to 1x/week (Schoenfeld meta-analysis)
        switch (split) {
            case 'upper-lower':
                program = this.generateUpperLower(profile, volumeConfig, repRanges, restTimes, daysPerWeek, sessionDuration, durationFactor, goal);
                break;
            case 'push-pull-legs':
                program = this.generatePPL(profile, volumeConfig, repRanges, restTimes, daysPerWeek, sessionDuration, durationFactor, goal);
                break;
            case 'full-body':
                program = this.generateFullBody(profile, volumeConfig, repRanges, restTimes, daysPerWeek, sessionDuration, durationFactor, goal);
                break;
            default:
                program = this.generateUpperLower(profile, volumeConfig, repRanges, restTimes, daysPerWeek, sessionDuration, durationFactor);
        }

        // Trim exercises if estimated duration exceeds sessionDuration
        program.days.forEach(day => {
            let estimated = this.estimateWorkoutDuration({ exercises: day.exercises });
            while (estimated > sessionDuration && day.exercises.length > 4) {
                // Remove last exercise (least important, usually accessory)
                day.exercises.pop();
                estimated = this.estimateWorkoutDuration({ exercises: day.exercises });
            }
        });

        // Apply superset/giant set grouping (post-processing)
        program.days.forEach(day => {
            day.exercises = this.applySupersets(day.exercises, goal);
        });

        // Get tempo for goal
        const tempo = this.TEMPO[goal] || this.TEMPO.hypertrophy;

        // Calculate mesocycle structure
        const cycle = this.generateCycleStructure(goal, profile.level);

        program.metadata = {
            goal,
            split,
            daysPerWeek,
            sessionDuration,
            level: profile.level,
            createdFor: profile.name,
            weeklyVolume: this.calculateWeeklyVolume(program),
            tempo: tempo,
            cycle: cycle
        };

        return program;
    },

    /**
     * Generate mesocycle structure based on goal and level
     */
    generateCycleStructure(goal, level) {
        const config = this.CYCLE_CONFIG;
        const duration = config.duration[goal]?.[level] || config.duration.hypertrophy.intermediate;

        // Calculate weeks for each phase
        const accumulationWeeks = Math.round(duration * config.phases.accumulation);
        const intensificationWeeks = Math.round(duration * config.phases.intensification);
        const deloadWeeks = Math.max(1, duration - accumulationWeeks - intensificationWeeks);

        // Build phase schedule
        const phases = [];
        let weekNum = 1;

        // Accumulation phase
        for (let i = 0; i < accumulationWeeks; i++) {
            phases.push({
                week: weekNum++,
                phase: 'accumulation',
                phaseName: 'Accumulo',
                rirTarget: config.rirTargets.accumulation,
                volumeMultiplier: config.volumeMultiplier.accumulation
            });
        }

        // Intensification phase
        for (let i = 0; i < intensificationWeeks; i++) {
            phases.push({
                week: weekNum++,
                phase: 'intensification',
                phaseName: 'Intensificazione',
                rirTarget: config.rirTargets.intensification,
                volumeMultiplier: config.volumeMultiplier.intensification
            });
        }

        // Deload phase
        for (let i = 0; i < deloadWeeks; i++) {
            phases.push({
                week: weekNum++,
                phase: 'deload',
                phaseName: 'Deload',
                rirTarget: config.rirTargets.deload,
                volumeMultiplier: config.volumeMultiplier.deload
            });
        }

        return {
            duration: duration,
            currentWeek: 1,
            startDate: new Date().toISOString(),
            phases: phases,
            isDeloadActive: false
        };
    },

    // ========================================
    // UPPER/LOWER SPLIT (Recommended for 4 days)
    // ========================================

    generateUpperLower(profile, volumeConfig, repRanges, restTimes, days, sessionDuration, durationFactor = 1, goal = 'hypertrophy') {
        const isToning = goal === 'toning';
        const program = {
            name: isToning ? 'Tonificazione Upper/Lower' : 'Upper/Lower Split',
            days: []
        };

        // Adjust volume based on training frequency
        // More days = can do less volume per session but more total
        const frequencyMultiplier = days <= 3 ? 1.2 : (days === 4 ? 1 : 0.85);
        const setsPerMuscle = Math.round((volumeConfig.optimal / 2) * frequencyMultiplier * durationFactor);

        if (isToning) {
            // TONING-SPECIFIC SPLITS
            // Sources: Contreras 2015 (EMG), Plotkin 2023, Barbalho 2019/2020
            // 62% lower / 38% upper volume distribution (Frontiers 2025)
            // Glutes 2-4x/week (Schoenfeld 2016), shorter rest (Harty 2018)
            const lowerSets = Math.round(setsPerMuscle * 1.2);  // More volume for lower body
            const upperSets = Math.round(setsPerMuscle * 0.8);  // Less volume for upper body

            if (days === 3) {
                program.days.push({
                    name: 'Giorno 1',
                    type: 'Lower A',
                    focus: 'Glutei & Quadricipiti',
                    warmup: 'legs-quad',
                    exercises: this.buildToningLowerWorkout(profile, lowerSets, repRanges, restTimes, 'glute-quad', sessionDuration)
                });
                program.days.push({
                    name: 'Giorno 2',
                    type: 'Upper',
                    focus: 'Upper Body Tono',
                    warmup: 'upper',
                    exercises: this.buildToningUpperWorkout(profile, upperSets, repRanges, restTimes, sessionDuration)
                });
                program.days.push({
                    name: 'Giorno 3',
                    type: 'Lower B',
                    focus: 'Glutei & Femorali',
                    warmup: 'legs-hamstring',
                    exercises: this.buildToningLowerWorkout(profile, lowerSets, repRanges, restTimes, 'glute-ham', sessionDuration)
                });
            } else if (days === 4) {
                program.days.push({
                    name: 'Giorno 1',
                    type: 'Lower A',
                    focus: 'Glutei & Quadricipiti',
                    warmup: 'legs-quad',
                    exercises: this.buildToningLowerWorkout(profile, lowerSets, repRanges, restTimes, 'glute-quad', sessionDuration)
                });
                program.days.push({
                    name: 'Giorno 2',
                    type: 'Upper A',
                    focus: 'Schiena & Spalle',
                    warmup: 'upper',
                    exercises: this.buildToningUpperWorkout(profile, upperSets, repRanges, restTimes, sessionDuration)
                });
                program.days.push({
                    name: 'Giorno 3',
                    type: 'Lower B',
                    focus: 'Glutei & Femorali',
                    warmup: 'legs-hamstring',
                    exercises: this.buildToningLowerWorkout(profile, lowerSets, repRanges, restTimes, 'glute-ham', sessionDuration)
                });
                program.days.push({
                    name: 'Giorno 4',
                    type: 'Upper B',
                    focus: 'Braccia & Core',
                    warmup: 'upper',
                    exercises: this.buildToningUpperWorkout(profile, upperSets, repRanges, restTimes, sessionDuration, 'arms')
                });
            } else if (days === 5) {
                program.days.push({
                    name: 'Giorno 1',
                    type: 'Lower A',
                    focus: 'Glutei & Quadricipiti',
                    warmup: 'legs-quad',
                    exercises: this.buildToningLowerWorkout(profile, lowerSets, repRanges, restTimes, 'glute-quad', sessionDuration)
                });
                program.days.push({
                    name: 'Giorno 2',
                    type: 'Upper A',
                    focus: 'Schiena & Spalle',
                    warmup: 'upper',
                    exercises: this.buildToningUpperWorkout(profile, upperSets, repRanges, restTimes, sessionDuration)
                });
                program.days.push({
                    name: 'Giorno 3',
                    type: 'Lower B',
                    focus: 'Glutei & Femorali',
                    warmup: 'legs-hamstring',
                    exercises: this.buildToningLowerWorkout(profile, lowerSets, repRanges, restTimes, 'glute-ham', sessionDuration)
                });
                program.days.push({
                    name: 'Giorno 4',
                    type: 'Upper B',
                    focus: 'Braccia & Core',
                    warmup: 'upper',
                    exercises: this.buildToningUpperWorkout(profile, upperSets, repRanges, restTimes, sessionDuration, 'arms')
                });
                program.days.push({
                    name: 'Giorno 5',
                    type: 'Glute Burn',
                    focus: 'Glutei & Core Extra',
                    warmup: 'legs-quad',
                    exercises: this.buildToningLowerWorkout(profile, lowerSets, repRanges, restTimes, 'glute-focus', sessionDuration)
                });
            } else if (days >= 6) {
                program.days.push({
                    name: 'Giorno 1',
                    type: 'Lower A',
                    focus: 'Glutei & Quadricipiti',
                    warmup: 'legs-quad',
                    exercises: this.buildToningLowerWorkout(profile, lowerSets, repRanges, restTimes, 'glute-quad', sessionDuration)
                });
                program.days.push({
                    name: 'Giorno 2',
                    type: 'Upper A',
                    focus: 'Schiena & Spalle',
                    warmup: 'upper',
                    exercises: this.buildToningUpperWorkout(profile, upperSets, repRanges, restTimes, sessionDuration)
                });
                program.days.push({
                    name: 'Giorno 3',
                    type: 'Lower B',
                    focus: 'Glutei & Femorali',
                    warmup: 'legs-hamstring',
                    exercises: this.buildToningLowerWorkout(profile, lowerSets, repRanges, restTimes, 'glute-ham', sessionDuration)
                });
                program.days.push({
                    name: 'Giorno 4',
                    type: 'Upper B',
                    focus: 'Braccia & Core',
                    warmup: 'upper',
                    exercises: this.buildToningUpperWorkout(profile, upperSets, repRanges, restTimes, sessionDuration, 'arms')
                });
                program.days.push({
                    name: 'Giorno 5',
                    type: 'Lower C',
                    focus: 'Glute Burn & Gambe',
                    warmup: 'legs-quad',
                    exercises: this.buildToningLowerWorkout(profile, lowerSets, repRanges, restTimes, 'glute-focus', sessionDuration)
                });
                program.days.push({
                    name: 'Giorno 6',
                    type: 'Upper C',
                    focus: 'Tono Completo',
                    warmup: 'upper',
                    exercises: this.buildToningUpperWorkout(profile, Math.round(upperSets * 0.8), repRanges, restTimes, sessionDuration, 'full')
                });
            }
            return program;
        }

        // STANDARD (non-toning) splits below
        if (days === 3) {
            // 3 days: Upper/Lower/Full Body — ogni muscolo minimo 2x/settimana
            // Ralston 2023: 2x/settimana superiore a 1x per ipertrofia e forza
            program.days.push({
                name: 'Giorno 1',
                type: 'Upper A',
                focus: 'Forza Upper Body',
                warmup: 'upper',
                exercises: this.buildUpperWorkout(profile, setsPerMuscle, repRanges, restTimes, 'strength', sessionDuration)
            });

            program.days.push({
                name: 'Giorno 2',
                type: 'Lower A',
                focus: 'Gambe Complete',
                warmup: 'lower',
                exercises: this.buildLowerWorkout(profile, Math.round(setsPerMuscle * 1.3), repRanges, restTimes, 'full', sessionDuration)
            });

            // Giorno 3: Full Body — colma la frequenza: lower body 2x/week + upper compound
            const fbSets = Math.max(2, Math.round(setsPerMuscle * 0.7));
            program.days.push({
                name: 'Giorno 3',
                type: 'Full Body',
                focus: 'Richiamo Completo',
                warmup: 'full-body',
                exercises: [
                    ...this.selectExercises('quadricipiti', 'compound', 1, fbSets, equipment, repRanges, restTimes, co + 1),
                    ...this.selectExercises('femorali', 'compound', 1, fbSets, equipment, repRanges, restTimes, co + 1),
                    ...this.selectExercises('petto', 'compound', 1, fbSets, equipment, repRanges, restTimes, co + 1),
                    ...this.selectExercises('schiena', 'compound', 1, fbSets, equipment, repRanges, restTimes, co + 1),
                    ...this.selectExercises('spalle', 'compound', 1, Math.max(2, fbSets - 1), equipment, repRanges, restTimes, co + 1),
                    ...this.selectExercises('bicipiti', 'isolation', 1, Math.max(2, fbSets - 1), equipment, repRanges, restTimes, co + 1),
                    ...this.selectExercises('tricipiti', 'isolation', 1, Math.max(2, fbSets - 1), equipment, repRanges, restTimes, co + 1)
                ]
            });

        } else if (days === 4) {
            // Standard 4-day Upper/Lower
            program.days.push({
                name: 'Giorno 1',
                type: 'Upper A',
                focus: 'Forza & Ipertrofia',
                warmup: 'upper',
                exercises: this.buildUpperWorkout(profile, setsPerMuscle, repRanges, restTimes, 'strength', sessionDuration)
            });

            program.days.push({
                name: 'Giorno 2',
                type: 'Lower A',
                focus: 'Quadricipiti & Glutei',
                warmup: 'legs-quad',
                exercises: this.buildLowerWorkout(profile, setsPerMuscle, repRanges, restTimes, 'quad', sessionDuration)
            });

            program.days.push({
                name: 'Giorno 3',
                type: 'Upper B',
                focus: 'Volume & Ipertrofia',
                warmup: 'upper',
                exercises: this.buildUpperWorkout(profile, setsPerMuscle, repRanges, restTimes, 'hypertrophy', sessionDuration)
            });

            program.days.push({
                name: 'Giorno 4',
                type: 'Lower B',
                focus: 'Femorali & Glutei',
                warmup: 'legs-hamstring',
                exercises: this.buildLowerWorkout(profile, setsPerMuscle, repRanges, restTimes, 'hamstring', sessionDuration)
            });

        } else if (days === 5) {
            // 5 days: Upper, Lower, Upper, Lower, Arms/Weak Points
            program.days.push({
                name: 'Giorno 1',
                type: 'Upper A',
                focus: 'Forza Upper Body',
                warmup: 'upper',
                exercises: this.buildUpperWorkout(profile, setsPerMuscle, repRanges, restTimes, 'strength', sessionDuration)
            });

            program.days.push({
                name: 'Giorno 2',
                type: 'Lower A',
                focus: 'Quadricipiti',
                warmup: 'legs-quad',
                exercises: this.buildLowerWorkout(profile, setsPerMuscle, repRanges, restTimes, 'quad', sessionDuration)
            });

            program.days.push({
                name: 'Giorno 3',
                type: 'Upper B',
                focus: 'Ipertrofia Upper Body',
                warmup: 'upper',
                exercises: this.buildUpperWorkout(profile, setsPerMuscle, repRanges, restTimes, 'hypertrophy', sessionDuration)
            });

            program.days.push({
                name: 'Giorno 4',
                type: 'Lower B',
                focus: 'Femorali & Glutei',
                warmup: 'legs-hamstring',
                exercises: this.buildLowerWorkout(profile, setsPerMuscle, repRanges, restTimes, 'hamstring', sessionDuration)
            });

            program.days.push({
                name: 'Giorno 5',
                type: 'Arms & Shoulders',
                focus: 'Braccia & Spalle',
                warmup: 'upper',
                exercises: this.buildArmsWorkout(profile, setsPerMuscle, repRanges, restTimes, sessionDuration)
            });

        } else if (days >= 6) {
            // 6 days: Upper, Lower, Upper, Lower, Upper, Lower
            program.days.push({
                name: 'Giorno 1',
                type: 'Upper A',
                focus: 'Petto & Schiena (Forza)',
                warmup: 'upper',
                exercises: this.buildUpperWorkout(profile, setsPerMuscle, repRanges, restTimes, 'strength', sessionDuration)
            });

            program.days.push({
                name: 'Giorno 2',
                type: 'Lower A',
                focus: 'Quadricipiti',
                warmup: 'legs-quad',
                exercises: this.buildLowerWorkout(profile, setsPerMuscle, repRanges, restTimes, 'quad', sessionDuration)
            });

            program.days.push({
                name: 'Giorno 3',
                type: 'Upper B',
                focus: 'Spalle & Braccia',
                warmup: 'upper',
                exercises: this.buildUpperWorkout(profile, setsPerMuscle, repRanges, restTimes, 'hypertrophy', sessionDuration)
            });

            program.days.push({
                name: 'Giorno 4',
                type: 'Lower B',
                focus: 'Femorali & Glutei',
                warmup: 'legs-hamstring',
                exercises: this.buildLowerWorkout(profile, setsPerMuscle, repRanges, restTimes, 'hamstring', sessionDuration)
            });

            program.days.push({
                name: 'Giorno 5',
                type: 'Upper C',
                focus: 'Volume & Pump',
                warmup: 'upper',
                exercises: this.buildUpperWorkout(profile, Math.round(setsPerMuscle * 0.8), repRanges, restTimes, 'pump', sessionDuration)
            });

            program.days.push({
                name: 'Giorno 6',
                type: 'Lower C',
                focus: 'Gambe Complete',
                warmup: 'lower',
                exercises: this.buildLowerWorkout(profile, Math.round(setsPerMuscle * 0.8), repRanges, restTimes, 'full', sessionDuration)
            });
        }

        return program;
    },

    buildUpperWorkout(profile, baseSets, repRanges, restTimes, variant, sessionDuration) {
        const exercises = [];
        const equipment = profile.equipment || [];
        const usedExercises = new Set(); // Track used exercises to avoid duplicates
        const co = this._currentCycleOffset || 0; // Cycle offset for exercise rotation

        // Variant-specific exercise selection
        if (variant === 'strength') {
            // Heavy compound focus
            exercises.push(...this.selectExercisesUnique('petto', 'compound', 1, Math.min(4, baseSets), equipment, repRanges, restTimes, usedExercises, co));
            exercises.push(...this.selectExercisesUnique('petto', 'compound', 1, Math.ceil(baseSets / 2), equipment, repRanges, restTimes, usedExercises, co));
            exercises.push(...this.selectExercisesUnique('schiena', 'compound', 2, baseSets, equipment, repRanges, restTimes, usedExercises, co));
            exercises.push(...this.selectExercisesUnique('spalle', 'compound', 1, Math.ceil(baseSets / 2), equipment, repRanges, restTimes, usedExercises, co));
        } else if (variant === 'hypertrophy' || variant === 'pump') {
            // Higher rep, more isolation
            exercises.push(...this.selectExercisesUnique('petto', 'compound', 1, Math.min(4, baseSets), equipment, repRanges, restTimes, usedExercises, co));
            exercises.push(...this.selectExercisesUnique('petto', 'isolation', 1, Math.ceil(baseSets / 2), equipment, repRanges, restTimes, usedExercises, co));
            exercises.push(...this.selectExercisesUnique('schiena', 'compound', 2, baseSets, equipment, repRanges, restTimes, usedExercises, co));
            exercises.push(...this.selectExercisesUnique('spalle', 'isolation', 2, Math.ceil(baseSets / 2), equipment, repRanges, restTimes, usedExercises, co));
        } else {
            // Default balanced
            exercises.push(...this.selectExercisesUnique('petto', 'compound', 1, baseSets - 1, equipment, repRanges, restTimes, usedExercises, co));
            exercises.push(...this.selectExercisesUnique('petto', 'isolation', 1, Math.ceil(baseSets / 2), equipment, repRanges, restTimes, usedExercises, co));
            exercises.push(...this.selectExercisesUnique('schiena', 'compound', 2, baseSets, equipment, repRanges, restTimes, usedExercises, co));
            exercises.push(...this.selectExercisesUnique('spalle', 'compound', 1, Math.ceil(baseSets / 2), equipment, repRanges, restTimes, usedExercises, co));
        }

        // Arms: 1 exercise each
        exercises.push(...this.selectExercisesUnique('bicipiti', 'isolation', 1, Math.ceil(baseSets / 2), equipment, repRanges, restTimes, usedExercises, co));
        exercises.push(...this.selectExercisesUnique('tricipiti', 'isolation', 1, Math.ceil(baseSets / 2), equipment, repRanges, restTimes, usedExercises, co));

        // Face pulls for shoulder health (always include)
        exercises.push({
            exerciseId: 'face-pull',
            name: 'Face Pull',
            sets: 3,
            reps: '15-20',
            rest: 60,
            notes: 'Per salute delle spalle e postura'
        });

        return exercises;
    },

    buildLowerWorkout(profile, baseSets, repRanges, restTimes, variant, sessionDuration) {
        const exercises = [];
        const equipment = profile.equipment || [];
        const usedExercises = new Set();
        const co = this._currentCycleOffset || 0;

        if (variant === 'quad') {
            exercises.push(...this.selectExercisesUnique('quadricipiti', 'compound', 2, baseSets, equipment, repRanges, restTimes, usedExercises, co));
            exercises.push(...this.selectExercisesUnique('quadricipiti', 'isolation', 1, Math.ceil(baseSets / 2), equipment, repRanges, restTimes, usedExercises, co));
            exercises.push(...this.selectExercisesUnique('glutei', 'compound', 1, Math.ceil(baseSets / 2), equipment, repRanges, restTimes, usedExercises, co));
            exercises.push(...this.selectExercisesUnique('femorali', 'isolation', 1, Math.ceil(baseSets / 2), equipment, repRanges, restTimes, usedExercises, co));
        } else if (variant === 'hamstring') {
            exercises.push(...this.selectExercisesUnique('femorali', 'compound', 2, baseSets, equipment, repRanges, restTimes, usedExercises, co));
            exercises.push(...this.selectExercisesUnique('glutei', 'compound', 1, Math.ceil(baseSets / 2), equipment, repRanges, restTimes, usedExercises, co));
            exercises.push(...this.selectExercisesUnique('quadricipiti', 'compound', 1, Math.ceil(baseSets / 2), equipment, repRanges, restTimes, usedExercises, co));
            exercises.push(...this.selectExercisesUnique('femorali', 'isolation', 1, Math.ceil(baseSets / 2), equipment, repRanges, restTimes, usedExercises, co));
        } else if (variant === 'full') {
            exercises.push(...this.selectExercisesUnique('quadricipiti', 'compound', 1, baseSets, equipment, repRanges, restTimes, usedExercises, co));
            exercises.push(...this.selectExercisesUnique('femorali', 'compound', 1, Math.ceil(baseSets * 0.8), equipment, repRanges, restTimes, usedExercises, co));
            exercises.push(...this.selectExercisesUnique('glutei', 'compound', 1, Math.ceil(baseSets / 2), equipment, repRanges, restTimes, usedExercises, co));
            exercises.push(...this.selectExercisesUnique('quadricipiti', 'isolation', 1, 3, equipment, repRanges, restTimes, usedExercises, co));
            exercises.push(...this.selectExercisesUnique('femorali', 'isolation', 1, 3, equipment, repRanges, restTimes, usedExercises, co));
        } else {
            exercises.push(...this.selectExercisesUnique('femorali', 'compound', 2, baseSets, equipment, repRanges, restTimes, usedExercises, co));
            exercises.push(...this.selectExercisesUnique('glutei', 'compound', 1, Math.ceil(baseSets / 2), equipment, repRanges, restTimes, usedExercises, co));
            exercises.push(...this.selectExercisesUnique('quadricipiti', 'compound', 1, Math.ceil(baseSets / 2), equipment, repRanges, restTimes, usedExercises, co));
            exercises.push(...this.selectExercisesUnique('femorali', 'isolation', 1, Math.ceil(baseSets / 2), equipment, repRanges, restTimes, usedExercises, co));
        }

        // Calves
        exercises.push(...this.selectExercisesUnique('polpacci', 'isolation', 1, 4, equipment, repRanges, restTimes, usedExercises, co));

        // Core
        exercises.push(...this.selectExercisesUnique('addome', 'isolation', 2, 3, equipment, repRanges, restTimes, usedExercises, co));

        return exercises;
    },

    buildArmsWorkout(profile, baseSets, repRanges, restTimes, sessionDuration) {
        const exercises = [];
        const equipment = profile.equipment || [];
        const usedExercises = new Set();
        const co = this._currentCycleOffset || 0;

        // Biceps: 3 exercises
        exercises.push(...this.selectExercisesUnique('bicipiti', 'isolation', 3, Math.ceil(baseSets / 2), equipment, repRanges, restTimes, usedExercises, co));

        // Triceps: 3 exercises
        exercises.push(...this.selectExercisesUnique('tricipiti', 'isolation', 3, Math.ceil(baseSets / 2), equipment, repRanges, restTimes, usedExercises, co));

        // Shoulders (lateral delts focus)
        exercises.push(...this.selectExercisesUnique('spalle', 'isolation', 2, Math.ceil(baseSets / 2), equipment, repRanges, restTimes, usedExercises, co));

        // Forearms if time permits
        exercises.push({
            exerciseId: 'wrist-curl',
            name: 'Wrist Curl',
            sets: 2,
            reps: '15-20',
            rest: 45,
            notes: 'Opzionale per avambracci'
        });

        return exercises;
    },

    // ========================================
    // TONING-SPECIFIC WORKOUT BUILDERS
    // Sources: Contreras 2015 (EMG hip thrust), Plotkin 2023 (squat vs thrust hypertrophy),
    // Barbalho 2019/2020 (volume thresholds women), Harty 2018 (female recovery),
    // Schoenfeld 2016 (frequency 2x+), Frontiers 2025 (62/38 lower/upper distribution)
    // ========================================

    buildToningLowerWorkout(profile, baseSets, repRanges, restTimes, variant, sessionDuration) {
        const exercises = [];
        const equipment = profile.equipment || [];
        const usedExercises = new Set();
        const co = this._currentCycleOffset || 0;
        const gluteAccessoryReps = repRanges.glute_accessory || repRanges.isolation;

        if (variant === 'glute-quad') {
            // Glute-Quad day: hip thrust pattern + squat pattern + quad isolation + glute isolation
            // Contreras 2015: hip thrust > squat for glute activation (86.8% vs 45.4% lower glute)
            exercises.push(...this.selectExercisesUnique('glutei', 'compound', 1, Math.max(3, baseSets), equipment, repRanges, restTimes, usedExercises, co));
            exercises.push(...this.selectExercisesUnique('quadricipiti', 'compound', 2, Math.ceil(baseSets * 0.8), equipment, repRanges, restTimes, usedExercises, co));
            exercises.push(...this.selectExercisesUnique('glutei', 'isolation', 1, 3, equipment,
                { compound: gluteAccessoryReps, isolation: gluteAccessoryReps }, restTimes, usedExercises, co));
            exercises.push(...this.selectExercisesUnique('quadricipiti', 'isolation', 1, 3, equipment, repRanges, restTimes, usedExercises, co));
        } else if (variant === 'glute-ham') {
            // Glute-Ham day: RDL/hinge pattern + hip thrust + hamstring isolation + glute isolation
            // Plotkin 2023: squat AND thrust both produce similar gluteal hypertrophy
            exercises.push(...this.selectExercisesUnique('femorali', 'compound', 1, Math.max(3, baseSets), equipment, repRanges, restTimes, usedExercises, co));
            exercises.push(...this.selectExercisesUnique('glutei', 'compound', 1, Math.ceil(baseSets * 0.8), equipment, repRanges, restTimes, usedExercises, co));
            exercises.push(...this.selectExercisesUnique('femorali', 'isolation', 1, 3, equipment, repRanges, restTimes, usedExercises, co));
            exercises.push(...this.selectExercisesUnique('glutei', 'isolation', 1, 3, equipment,
                { compound: gluteAccessoryReps, isolation: gluteAccessoryReps }, restTimes, usedExercises, co));
        } else if (variant === 'glute-focus') {
            // Pure glute day with extra volume - Barbalho 2020: hip thrust addition boosts glute thickness
            exercises.push(...this.selectExercisesUnique('glutei', 'compound', 2, Math.max(3, baseSets), equipment, repRanges, restTimes, usedExercises, co));
            exercises.push(...this.selectExercisesUnique('glutei', 'isolation', 2, 3, equipment,
                { compound: gluteAccessoryReps, isolation: gluteAccessoryReps }, restTimes, usedExercises, co));
            exercises.push(...this.selectExercisesUnique('femorali', 'compound', 1, 3, equipment, repRanges, restTimes, usedExercises, co));
        }

        // Core on every lower day (4-8 sets/week, Barbalho 2019)
        exercises.push(...this.selectExercisesUnique('addome', 'isolation', 2, 3, equipment, repRanges, restTimes, usedExercises, co));

        // Calves (lighter focus for toning)
        exercises.push(...this.selectExercisesUnique('polpacci', 'isolation', 1, 3, equipment, repRanges, restTimes, usedExercises, co));

        return exercises;
    },

    buildToningUpperWorkout(profile, baseSets, repRanges, restTimes, sessionDuration, variant = 'default') {
        const exercises = [];
        const equipment = profile.equipment || [];
        const usedExercises = new Set();
        const co = this._currentCycleOffset || 0;

        if (variant === 'arms') {
            // Arms & Core focused day
            exercises.push(...this.selectExercisesUnique('schiena', 'compound', 1, Math.max(3, baseSets), equipment, repRanges, restTimes, usedExercises, co));
            exercises.push(...this.selectExercisesUnique('bicipiti', 'isolation', 2, 3, equipment, repRanges, restTimes, usedExercises, co));
            exercises.push(...this.selectExercisesUnique('tricipiti', 'isolation', 2, 3, equipment, repRanges, restTimes, usedExercises, co));
            exercises.push(...this.selectExercisesUnique('spalle', 'isolation', 1, 3, equipment, repRanges, restTimes, usedExercises, co));
            exercises.push(...this.selectExercisesUnique('addome', 'isolation', 2, 3, equipment, repRanges, restTimes, usedExercises, co));
        } else if (variant === 'full') {
            // Balanced upper
            exercises.push(...this.selectExercisesUnique('schiena', 'compound', 1, Math.max(3, baseSets), equipment, repRanges, restTimes, usedExercises, co));
            exercises.push(...this.selectExercisesUnique('petto', 'compound', 1, 3, equipment, repRanges, restTimes, usedExercises, co));
            exercises.push(...this.selectExercisesUnique('spalle', 'isolation', 1, 3, equipment, repRanges, restTimes, usedExercises, co));
            exercises.push(...this.selectExercisesUnique('bicipiti', 'isolation', 1, 3, equipment, repRanges, restTimes, usedExercises, co));
            exercises.push(...this.selectExercisesUnique('tricipiti', 'isolation', 1, 3, equipment, repRanges, restTimes, usedExercises, co));
        } else {
            // Default: back & shoulders priority (posture + V-taper illusion)
            exercises.push(...this.selectExercisesUnique('schiena', 'compound', 2, Math.max(3, baseSets), equipment, repRanges, restTimes, usedExercises, co));
            exercises.push(...this.selectExercisesUnique('petto', 'compound', 1, 3, equipment, repRanges, restTimes, usedExercises, co));
            exercises.push(...this.selectExercisesUnique('spalle', 'compound', 1, Math.ceil(baseSets / 2), equipment, repRanges, restTimes, usedExercises, co));
            exercises.push(...this.selectExercisesUnique('spalle', 'isolation', 1, 3, equipment, repRanges, restTimes, usedExercises, co));
            exercises.push(...this.selectExercisesUnique('bicipiti', 'isolation', 1, 3, equipment, repRanges, restTimes, usedExercises, co));
            exercises.push(...this.selectExercisesUnique('tricipiti', 'isolation', 1, 3, equipment, repRanges, restTimes, usedExercises, co));
        }

        // Face pulls always (shoulder health)
        exercises.push({
            exerciseId: 'face-pull',
            name: 'Face Pull',
            sets: 3,
            reps: '15-20',
            rest: 45,
            notes: 'Postura e salute spalle'
        });

        return exercises;
    },

    // ========================================
    // PUSH/PULL/LEGS SPLIT
    // ========================================

    generatePPL(profile, volumeConfig, repRanges, restTimes, days, sessionDuration, durationFactor = 1, goal = 'hypertrophy') {
        const program = {
            name: 'Push/Pull/Legs',
            days: []
        };

        const setsPerMuscle = Math.round((volumeConfig.optimal / 2) * durationFactor);
        const equipment = profile.equipment || [];
        const co = this._currentCycleOffset || 0;

        // Push Day A (Strength focus)
        program.days.push({
            name: 'Giorno 1',
            type: 'Push',
            focus: 'Petto, Spalle, Tricipiti',
            warmup: 'push',
            exercises: [
                ...this.selectExercises('petto', 'compound', 2, setsPerMuscle, equipment, repRanges, restTimes, co),
                ...this.selectExercises('spalle', 'compound', 1, setsPerMuscle - 1, equipment, repRanges, restTimes, co),
                ...this.selectExercises('petto', 'isolation', 1, Math.ceil(setsPerMuscle / 2), equipment, repRanges, restTimes, co),
                ...this.selectExercises('spalle', 'isolation', 2, Math.ceil(setsPerMuscle / 2), equipment, repRanges, restTimes, co),
                ...this.selectExercises('tricipiti', 'isolation', 2, setsPerMuscle, equipment, repRanges, restTimes, co)
            ]
        });

        // Pull Day A
        program.days.push({
            name: 'Giorno 2',
            type: 'Pull',
            focus: 'Schiena, Bicipiti',
            warmup: 'pull',
            exercises: [
                ...this.selectExercises('schiena', 'compound', 3, setsPerMuscle, equipment, repRanges, restTimes, co),
                ...this.selectExercises('schiena', 'isolation', 1, Math.ceil(setsPerMuscle / 2), equipment, repRanges, restTimes, co),
                ...this.selectExercises('bicipiti', 'isolation', 2, setsPerMuscle, equipment, repRanges, restTimes, co),
                { exerciseId: 'face-pull', name: 'Face Pull', sets: 3, reps: '15-20', rest: 60 }
            ]
        });

        // Legs Day A (Quad focus)
        program.days.push({
            name: 'Giorno 3',
            type: 'Legs',
            focus: 'Gambe Complete',
            warmup: 'lower',
            exercises: [
                ...this.selectExercises('quadricipiti', 'compound', 2, setsPerMuscle, equipment, repRanges, restTimes, co),
                ...this.selectExercises('femorali', 'compound', 1, setsPerMuscle - 1, equipment, repRanges, restTimes, co),
                ...this.selectExercises('glutei', 'compound', 1, setsPerMuscle - 1, equipment, repRanges, restTimes, co),
                ...this.selectExercises('quadricipiti', 'isolation', 1, Math.ceil(setsPerMuscle / 2), equipment, repRanges, restTimes, co),
                ...this.selectExercises('femorali', 'isolation', 1, Math.ceil(setsPerMuscle / 2), equipment, repRanges, restTimes, co),
                ...this.selectExercises('polpacci', 'isolation', 1, 4, equipment, repRanges, restTimes, co),
                ...this.selectExercises('addome', 'isolation', 2, 3, equipment, repRanges, restTimes, co)
            ]
        });

        if (days === 4) {
            // 4 days: P/P/L + Upper volume day
            program.days.push({
                name: 'Giorno 4',
                type: 'Upper',
                focus: 'Upper Body Volume',
                warmup: 'upper',
                exercises: this.buildUpperWorkout(profile, setsPerMuscle - 2, repRanges, restTimes, 'hypertrophy', sessionDuration)
            });
        } else if (days === 5) {
            // 5 days: P/P/L/Push B/Pull B (different exercises via offset)
            program.days.push({
                name: 'Giorno 4',
                type: 'Push B',
                focus: 'Spalle, Petto, Tricipiti (Volume)',
                warmup: 'push',
                exercises: [
                    ...this.selectExercises('spalle', 'compound', 1, setsPerMuscle, equipment, repRanges, restTimes, co + 1),
                    ...this.selectExercises('petto', 'compound', 1, setsPerMuscle - 1, equipment, repRanges, restTimes, co + 1),
                    ...this.selectExercises('spalle', 'isolation', 2, Math.ceil(setsPerMuscle / 2), equipment, repRanges, restTimes, co + 1),
                    ...this.selectExercises('petto', 'isolation', 1, Math.ceil(setsPerMuscle / 2), equipment, repRanges, restTimes, co + 1),
                    ...this.selectExercises('tricipiti', 'isolation', 2, setsPerMuscle, equipment, repRanges, restTimes, co + 1)
                ]
            });
            program.days.push({
                name: 'Giorno 5',
                type: 'Pull B',
                focus: 'Schiena, Bicipiti (Volume)',
                warmup: 'pull',
                exercises: [
                    ...this.selectExercises('schiena', 'compound', 2, setsPerMuscle, equipment, repRanges, restTimes, co + 1),
                    ...this.selectExercises('schiena', 'isolation', 1, Math.ceil(setsPerMuscle / 2), equipment, repRanges, restTimes, co + 1),
                    ...this.selectExercises('bicipiti', 'isolation', 3, setsPerMuscle, equipment, repRanges, restTimes, co + 1),
                    { exerciseId: 'face-pull', name: 'Face Pull', sets: 3, reps: '15-20', rest: 60 }
                ]
            });
        } else if (days >= 6) {
            // 6 days: P/P/L/Push B/Pull B/Legs B — different exercises via offset +1
            program.days.push({
                name: 'Giorno 4',
                type: 'Push B',
                focus: 'Petto, Spalle, Tricipiti (Volume)',
                warmup: 'push',
                exercises: [
                    ...this.selectExercises('petto', 'compound', 1, setsPerMuscle, equipment, repRanges, restTimes, co + 1),
                    ...this.selectExercises('spalle', 'compound', 1, setsPerMuscle - 1, equipment, repRanges, restTimes, co + 1),
                    ...this.selectExercises('petto', 'isolation', 1, Math.ceil(setsPerMuscle / 2), equipment, repRanges, restTimes, co + 1),
                    ...this.selectExercises('spalle', 'isolation', 2, Math.ceil(setsPerMuscle / 2), equipment, repRanges, restTimes, co + 1),
                    ...this.selectExercises('tricipiti', 'isolation', 2, setsPerMuscle, equipment, repRanges, restTimes, co + 1)
                ]
            });
            program.days.push({
                name: 'Giorno 5',
                type: 'Pull B',
                focus: 'Schiena, Bicipiti (Volume)',
                warmup: 'pull',
                exercises: [
                    ...this.selectExercises('schiena', 'compound', 2, setsPerMuscle, equipment, repRanges, restTimes, co + 1),
                    ...this.selectExercises('schiena', 'isolation', 1, Math.ceil(setsPerMuscle / 2), equipment, repRanges, restTimes, co + 1),
                    ...this.selectExercises('bicipiti', 'isolation', 2, setsPerMuscle, equipment, repRanges, restTimes, co + 1),
                    { exerciseId: 'face-pull', name: 'Face Pull', sets: 3, reps: '15-20', rest: 60 }
                ]
            });
            program.days.push({
                name: 'Giorno 6',
                type: 'Legs B',
                focus: 'Femorali, Glutei, Polpacci',
                warmup: 'lower',
                exercises: [
                    ...this.selectExercises('femorali', 'compound', 2, setsPerMuscle, equipment, repRanges, restTimes, co + 1),
                    ...this.selectExercises('glutei', 'compound', 1, setsPerMuscle - 1, equipment, repRanges, restTimes, co + 1),
                    ...this.selectExercises('quadricipiti', 'compound', 1, Math.ceil(setsPerMuscle / 2), equipment, repRanges, restTimes, co + 1),
                    ...this.selectExercises('femorali', 'isolation', 1, Math.ceil(setsPerMuscle / 2), equipment, repRanges, restTimes, co + 1),
                    ...this.selectExercises('polpacci', 'isolation', 1, 4, equipment, repRanges, restTimes, co + 1),
                    ...this.selectExercises('addome', 'isolation', 2, 3, equipment, repRanges, restTimes, co + 1)
                ]
            });
        }

        return program;
    },

    // ========================================
    // FULL BODY SPLIT
    // ========================================

    generateFullBody(profile, volumeConfig, repRanges, restTimes, days, sessionDuration, durationFactor = 1, goal = 'hypertrophy') {
        const program = {
            name: goal === 'toning' ? 'Tonificazione Full Body' : 'Full Body',
            days: []
        };

        const setsPerMuscle = Math.max(2, Math.round((volumeConfig.optimal / days) * durationFactor));
        const equipment = profile.equipment || [];
        const co = this._currentCycleOffset || 0;

        // Each day uses a different offset so exercises vary between days
        // Day patterns rotate primary compound movement and accessories
        const dayPatterns = [
            { label: 'A', quad: 'compound', ham: 'compound', chest: 'compound', back: 'compound', shoulder: 'compound', focus: 'Forza Compound' },
            { label: 'B', quad: 'compound', ham: 'isolation', chest: 'compound', back: 'compound', shoulder: 'isolation', focus: 'Upper Focus' },
            { label: 'C', quad: 'compound', ham: 'compound', chest: 'isolation', back: 'compound', shoulder: 'compound', focus: 'Lower Focus' },
            { label: 'D', quad: 'isolation', ham: 'compound', chest: 'compound', back: 'compound', shoulder: 'isolation', focus: 'Posterior Chain' },
            { label: 'E', quad: 'compound', ham: 'compound', chest: 'compound', back: 'isolation', shoulder: 'compound', focus: 'Push Focus' },
            { label: 'F', quad: 'compound', ham: 'compound', chest: 'isolation', back: 'compound', shoulder: 'isolation', focus: 'Pull Focus' }
        ];

        for (let i = 0; i < days; i++) {
            const dayNum = i + 1;
            const pattern = dayPatterns[i % dayPatterns.length];
            const dayOffset = co + i; // Different exercise selection per day

            program.days.push({
                name: `Giorno ${dayNum}`,
                type: `Full Body ${pattern.label}`,
                focus: pattern.focus,
                warmup: 'full-body',
                exercises: [
                    ...this.selectExercises('quadricipiti', pattern.quad, 1, setsPerMuscle, equipment, repRanges, restTimes, dayOffset),
                    ...this.selectExercises('petto', pattern.chest, 1, setsPerMuscle, equipment, repRanges, restTimes, dayOffset),
                    ...this.selectExercises('schiena', pattern.back, 1, setsPerMuscle, equipment, repRanges, restTimes, dayOffset),
                    ...this.selectExercises(i % 2 === 0 ? 'femorali' : 'glutei', pattern.ham, 1, setsPerMuscle, equipment, repRanges, restTimes, dayOffset),
                    ...this.selectExercises('spalle', pattern.shoulder, 1, setsPerMuscle, equipment, repRanges, restTimes, dayOffset),
                    ...this.selectExercises('bicipiti', 'isolation', 1, Math.max(2, setsPerMuscle - 1), equipment, repRanges, restTimes, dayOffset),
                    ...this.selectExercises('tricipiti', 'isolation', 1, Math.max(2, setsPerMuscle - 1), equipment, repRanges, restTimes, dayOffset),
                    ...this.selectExercises('addome', 'isolation', 1, 3, equipment, repRanges, restTimes, dayOffset)
                ]
            });
        }

        return program;
    },


    // ========================================
    // HELPER FUNCTIONS
    // ========================================

    selectExercises(muscle, type, count, sets, equipment, repRanges, restTimes, cycleOffset = 0) {
        const priorityList = this.EXERCISE_PRIORITY[muscle];
        if (!priorityList) return [];

        const exerciseIds = type === 'compound' ? priorityList.compound : priorityList.isolation;
        const selected = [];
        let exercisesAdded = 0;

        // Use special rep ranges for muscles that need higher reps (calves, abs, forearms)
        const specialReps = this.SPECIAL_REP_RANGES[muscle];
        const reps = specialReps || (type === 'compound' ? repRanges.compound : repRanges.isolation);
        const rest = type === 'compound' ? restTimes.compound : restTimes.isolation;

        // Apply cycle-based rotation: offset into the exercise list
        // Every new cycle shifts which exercises are prioritized
        const rotatedIds = this._rotateArray(exerciseIds, cycleOffset);

        for (const exId of rotatedIds) {
            if (exercisesAdded >= count) break;

            const exercise = EXERCISES_DB[exId];
            if (!exercise) continue;

            // Check if user has required equipment
            const hasEquipment = !exercise.equipment ||
                exercise.equipment.length === 0 ||
                exercise.equipment.some(eq => equipment.includes(eq) || eq === 'corpo-libero');

            if (hasEquipment) {
                // Calculate sets per exercise (Pelland 2025: 2-4 sets per exercise optimal)
                const setsForExercise = exercisesAdded === 0 ? Math.ceil(sets * 0.6) : Math.ceil(sets * 0.4);

                selected.push({
                    exerciseId: exId,
                    name: exercise.name,
                    sets: Math.max(2, Math.min(4, setsForExercise)),
                    reps: `${reps.min}-${reps.max}`,
                    rest: rest,
                    type: exercise.type,
                    notes: ''
                });
                exercisesAdded++;
            }
        }

        return selected;
    },

    // Same as selectExercises but tracks used exercises to avoid duplicates
    selectExercisesUnique(muscle, type, count, sets, equipment, repRanges, restTimes, usedExercises, cycleOffset = 0) {
        const priorityList = this.EXERCISE_PRIORITY[muscle];
        if (!priorityList) return [];

        const exerciseIds = type === 'compound' ? priorityList.compound : priorityList.isolation;
        const selected = [];
        let exercisesAdded = 0;

        // Use special rep ranges for muscles that need higher reps (calves, abs, forearms)
        const specialReps = this.SPECIAL_REP_RANGES[muscle];
        const reps = specialReps || (type === 'compound' ? repRanges.compound : repRanges.isolation);
        const rest = type === 'compound' ? restTimes.compound : restTimes.isolation;

        // Apply cycle-based rotation
        const rotatedIds = this._rotateArray(exerciseIds, cycleOffset);

        for (const exId of rotatedIds) {
            if (exercisesAdded >= count) break;

            // Skip if already used
            if (usedExercises.has(exId)) continue;

            const exercise = EXERCISES_DB[exId];
            if (!exercise) continue;

            // Check if user has required equipment
            const hasEquipment = !exercise.equipment ||
                exercise.equipment.length === 0 ||
                exercise.equipment.some(eq => equipment.includes(eq) || eq === 'corpo-libero');

            if (hasEquipment) {
                // Calculate sets per exercise (Pelland 2025: 2-4 sets per exercise optimal)
                const setsForExercise = exercisesAdded === 0 ? Math.ceil(sets * 0.6) : Math.ceil(sets * 0.4);

                selected.push({
                    exerciseId: exId,
                    name: exercise.name,
                    sets: Math.max(2, Math.min(4, setsForExercise)),
                    reps: `${reps.min}-${reps.max}`,
                    rest: rest,
                    type: exercise.type,
                    notes: ''
                });

                // Mark as used
                usedExercises.add(exId);
                exercisesAdded++;
            }
        }

        return selected;
    },

    calculateWeeklyVolume(program) {
        const muscleVolume = {};

        program.days.forEach(day => {
            day.exercises.forEach(ex => {
                const exercise = EXERCISES_DB[ex.exerciseId];
                if (!exercise) return;

                // Add sets to primary muscles
                exercise.primaryMuscles.forEach(muscle => {
                    if (!muscleVolume[muscle]) muscleVolume[muscle] = 0;
                    muscleVolume[muscle] += ex.sets;
                });

                // Add half sets to secondary muscles
                exercise.secondaryMuscles.forEach(muscle => {
                    if (!muscleVolume[muscle]) muscleVolume[muscle] = 0;
                    muscleVolume[muscle] += Math.ceil(ex.sets * 0.5);
                });
            });
        });

        return muscleVolume;
    },

    // Get suggested days for next workout
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

    // Get today's workout from active program
    getTodaysWorkout(program) {
        if (!program || !program.days) return null;

        // Get day of week (0 = Sunday)
        const today = new Date().getDay();
        const workoutsThisWeek = Storage.getWorkoutsThisWeek();

        // Simple rotation: next workout in sequence
        const nextIndex = workoutsThisWeek.length % program.days.length;
        return program.days[nextIndex];
    },

    // Calculate estimated workout duration
    estimateWorkoutDuration(workout) {
        if (!workout || !workout.exercises) return 0;

        let totalSeconds = 0;

        // Add warmup time (7-10 minutes)
        totalSeconds += 8 * 60;

        // Group superset exercises to calculate time savings
        const supersetGroups = {};
        const singles = [];

        workout.exercises.forEach(ex => {
            if (ex.supersetGroup) {
                if (!supersetGroups[ex.supersetGroup]) supersetGroups[ex.supersetGroup] = [];
                supersetGroups[ex.supersetGroup].push(ex);
            } else {
                singles.push(ex);
            }
        });

        // Singles: normal timing
        singles.forEach(ex => {
            const sets = ex.sets || 3;
            const rest = ex.rest || 60;
            const setTime = 45;
            totalSeconds += sets * setTime + (sets - 1) * rest;
        });

        // Superset groups: transition between exercises, rest only between rounds
        Object.values(supersetGroups).forEach(group => {
            const sets = group[0].sets || 3;
            const setTime = 45;
            const transition = group[0].transitionTime || 10;
            const groupRest = group[0].supersetRest || 60;

            // Per round: (setTime + transition) per exercise, then full rest between rounds
            const roundTime = group.length * setTime + (group.length - 1) * transition;
            totalSeconds += sets * roundTime + (sets - 1) * groupRest;
        });

        return Math.round(totalSeconds / 60); // Return minutes
    },

    // Progressive overload suggestion (Double Progression model)
    // Sources: Pelland 2025, Schoenfeld 2021
    // When all sets hit top of rep range → increase weight
    // Weight increments: +5kg lower compound, +2.5kg upper compound, +1.25kg isolation
    suggestProgression(exerciseId, lastPerformance) {
        if (!lastPerformance) return null;

        const { weight, reps, targetReps, repRange, exerciseType, muscle } = lastPerformance;

        // Parse rep range if available (e.g., "8-12" → {min: 8, max: 12})
        let maxReps = targetReps;
        let minReps = targetReps;
        if (repRange) {
            const parts = repRange.split('-').map(Number);
            if (parts.length === 2) {
                minReps = parts[0];
                maxReps = parts[1];
            }
        }

        // Determine weight increment based on exercise type and muscle group
        const isLower = ['quadricipiti', 'femorali', 'glutei'].includes(muscle);
        const isCompound = exerciseType === 'compound';
        const increment = isLower && isCompound ? 5 : (isCompound ? 2.5 : 1.25);

        // Double Progression: hit top of range on all sets → increase weight
        if (reps >= maxReps) {
            return {
                type: 'weight',
                suggestion: `Aumenta a ${weight + increment}kg (hai raggiunto il top del range)`,
                newWeight: weight + increment
            };
        }

        // Within range: keep weight, push for more reps
        if (reps >= minReps) {
            return {
                type: 'reps',
                suggestion: `Mantieni ${weight}kg, punta a ${Math.min(reps + 1, maxReps)} reps`,
                targetReps: Math.min(reps + 1, maxReps)
            };
        }

        // Below minimum range: weight too heavy
        if (reps < minReps && weight > 0) {
            return {
                type: 'decrease',
                suggestion: `Riduci a ${Math.max(0, weight - increment)}kg (sotto il range minimo)`,
                newWeight: Math.max(0, weight - increment)
            };
        }

        // Default: maintain
        return {
            type: 'maintain',
            suggestion: `Mantieni ${weight}kg e lavora sulla tecnica`
        };
    },

    // ========================================
    // CONDITIONING SUGGESTIONS
    // ========================================

    /**
     * Generate conditioning suggestions based on goal and program
     * Uses scientific guidelines for HIIT/LISS integration
     */
    generateConditioningSuggestions(goal, level, daysPerWeek, programDays = []) {
        // Get config from conditioningExercises.js
        const config = typeof CONDITIONING_BY_GOAL !== 'undefined'
            ? CONDITIONING_BY_GOAL[goal]
            : this.getDefaultConditioningConfig(goal);

        if (!config || config.frequency === 0) {
            return {
                enabled: false,
                frequency: 0,
                message: "Conditioning non consigliato per obiettivo Forza",
                reason: "L'allenamento cardio interferisce con il recupero e gli adattamenti di forza."
            };
        }

        // Identify leg days (to avoid HIIT near them)
        const legDayIndices = programDays
            .map((d, i) => {
                const type = (d.type || '').toLowerCase();
                return (type.includes('lower') || type.includes('leg') || type.includes('gambe')) ? i : -1;
            })
            .filter(i => i >= 0);

        // Calculate safe days for HIIT
        const safeDaysForHIIT = this.calculateSafeDaysForHIIT(daysPerWeek, legDayIndices);

        // Get recommended protocol based on level
        const protocol = this.getRecommendedProtocol(goal, level);

        return {
            enabled: true,
            frequency: config.frequency,
            maxFrequency: config.maxFrequency,
            preferredType: config.preferredType,
            hiitAllowed: config.hiitAllowed,
            duration: config.preferredType === 'HIIT'
                ? (config.hiitDuration || config.duration)
                : (config.lissDuration || config.duration),
            protocol: protocol,
            safeDaysForHIIT: safeDaysForHIIT,
            legDays: legDayIndices,
            note: config.note,
            message: this.getConditioningMessage(config, goal)
        };
    },

    /**
     * Calculate which days are safe for HIIT (not within 24h of leg day)
     */
    calculateSafeDaysForHIIT(daysPerWeek, legDayIndices) {
        const safeDays = [];
        const totalDays = 7;

        for (let i = 0; i < totalDays; i++) {
            const isLegDay = legDayIndices.includes(i % daysPerWeek);
            const beforeLegDay = legDayIndices.includes((i + 1) % daysPerWeek);
            const afterLegDay = legDayIndices.includes((i - 1 + daysPerWeek) % daysPerWeek);

            // Safe if not leg day, not day before leg day, and not day after leg day
            if (!isLegDay && !beforeLegDay) {
                safeDays.push(i);
            }
        }

        return safeDays;
    },

    /**
     * Get recommended protocol based on goal and level
     */
    getRecommendedProtocol(goal, level) {
        const protocols = {
            tabata: { name: "Tabata", workTime: 20, restTime: 10, rounds: 8, exercisesCount: 4, difficulty: "advanced" },
            circuit30: { name: "Circuito 30/30", workTime: 30, restTime: 30, rounds: 3, exercisesCount: 5, difficulty: "intermediate" },
            circuit4020: { name: "Circuito 40/20", workTime: 40, restTime: 20, rounds: 3, exercisesCount: 5, difficulty: "intermediate" },
            beginner: { name: "Principiante", workTime: 20, restTime: 40, rounds: 2, exercisesCount: 4, difficulty: "beginner" }
        };

        const levelOrder = { beginner: 1, intermediate: 2, advanced: 3, expert: 3 };
        const userLevelNum = levelOrder[level] || 2;

        // Select protocol based on goal
        let selectedProtocol;
        switch (goal) {
            case 'endurance':
                selectedProtocol = protocols.tabata;
                break;
            case 'recomp':
                selectedProtocol = protocols.circuit4020;
                break;
            case 'hypertrophy':
                selectedProtocol = protocols.circuit30;
                break;
            default:
                selectedProtocol = protocols.circuit30;
        }

        // Downgrade if too difficult
        const protocolLevelNum = levelOrder[selectedProtocol.difficulty] || 2;
        if (protocolLevelNum > userLevelNum) {
            if (userLevelNum === 1) return protocols.beginner;
            return protocols.circuit30;
        }

        return selectedProtocol;
    },

    /**
     * Get default conditioning config if conditioningExercises.js not loaded
     */
    getDefaultConditioningConfig(goal) {
        const configs = {
            strength: { frequency: 0, maxFrequency: 1, preferredType: "LISS", hiitAllowed: false, duration: 15 },
            hypertrophy: { frequency: 1, maxFrequency: 2, preferredType: "LISS", hiitAllowed: true, duration: 20 },
            recomp: { frequency: 2, maxFrequency: 3, preferredType: "mixed", hiitAllowed: true, hiitDuration: 15, lissDuration: 25 },
            endurance: { frequency: 3, maxFrequency: 4, preferredType: "HIIT", hiitAllowed: true, hiitDuration: 20, lissDuration: 30 }
        };
        return configs[goal] || configs.hypertrophy;
    },

    /**
     * Generate conditioning message based on config
     */
    getConditioningMessage(config, goal) {
        if (config.frequency === 0) {
            return "Cardio non consigliato per il tuo obiettivo";
        }

        const typeText = config.preferredType === 'mixed'
            ? "HIIT + LISS"
            : config.preferredType;

        return `${config.frequency}x ${typeText} a settimana consigliato per ${goal}`;
    },

    // ========================================
    // EXERCISE ROTATION & PROGRESSIVE VOLUME
    // ========================================

    /**
     * Rotate array elements by offset positions
     * Used to cycle through exercise variants between mesocycles
     * @param {Array} arr - Original array
     * @param {number} offset - Number of positions to rotate (based on cycleNumber)
     * @returns {Array} Rotated copy of the array
     */
    _rotateArray(arr, offset) {
        if (!arr || arr.length <= 1 || offset === 0) return arr;
        const n = arr.length;
        const shift = ((offset % n) + n) % n; // normalize to positive
        return [...arr.slice(shift), ...arr.slice(0, shift)];
    },

    /**
     * Regenerate program with rotated exercises for a new mesocycle
     * Called when completing a cycle to provide fresh exercise stimulus
     *
     * Rotation logic: each cycle shifts the exercise selection by 1 position
     * in each muscle's priority list, so different variants get prioritized.
     *
     * Progressive volume: after the first cycle, slightly increases volume
     * (+1 set/muscle/week) up to the user's level max, then resets.
     *
     * @param {Object} program - Current active program
     * @param {Object} profile - User profile
     * @returns {Object} Updated program with rotated exercises
     */
    rotateProgram(program, profile) {
        if (!program?.metadata) return program;

        const { goal, split, daysPerWeek, sessionDuration } = program.metadata;
        const cycleNumber = (program.metadata.cycleNumber || 0) + 1;

        // Progressive volume: increase optimal volume by 1 per cycle (up to max)
        const baseVolume = this.VOLUME_CONFIG[profile.level] || this.VOLUME_CONFIG.intermediate;
        const volumeBoost = Math.min(cycleNumber - 1, baseVolume.max - baseVolume.optimal);
        const adjustedVolume = {
            ...baseVolume,
            optimal: baseVolume.optimal + volumeBoost
        };

        const repRanges = this.REP_RANGES[goal] || this.REP_RANGES.hypertrophy;
        const restTimes = this.REST_TIMES[goal] || this.REST_TIMES.hypertrophy;

        // Store cycleOffset so selectExercises/selectExercisesUnique can use it
        this._currentCycleOffset = cycleNumber;

        // Regenerate the program structure with rotated exercises
        let newProgram;
        switch (split) {
            case 'upper-lower':
                newProgram = this.generateUpperLower(profile, adjustedVolume, repRanges, restTimes, daysPerWeek, sessionDuration);
                break;
            case 'push-pull-legs':
                newProgram = this.generatePPL(profile, adjustedVolume, repRanges, restTimes, daysPerWeek, sessionDuration);
                break;
            case 'full-body':
                newProgram = this.generateFullBody(profile, adjustedVolume, repRanges, restTimes, daysPerWeek, sessionDuration);
                break;
            default:
                newProgram = this.generateUpperLower(profile, adjustedVolume, repRanges, restTimes, daysPerWeek, sessionDuration);
        }

        // Reset offset
        this._currentCycleOffset = 0;

        // Preserve metadata, update cycle info
        const tempo = this.TEMPO[goal] || this.TEMPO.hypertrophy;
        const cycle = this.generateCycleStructure(goal, profile.level);

        newProgram.metadata = {
            ...program.metadata,
            weeklyVolume: this.calculateWeeklyVolume(newProgram),
            tempo: tempo,
            cycle: cycle,
            cycleNumber: cycleNumber,
            previousExercises: this._extractExerciseIds(program),
            rotatedAt: new Date().toISOString()
        };

        return newProgram;
    },

    /**
     * Extract all exercise IDs from a program (for tracking rotation history)
     */
    _extractExerciseIds(program) {
        if (!program?.days) return [];
        const ids = new Set();
        program.days.forEach(day => {
            (day.exercises || []).forEach(ex => ids.add(ex.exerciseId));
        });
        return [...ids];
    },

    /**
     * Get a summary of what changed between old and new program
     * Useful for showing the user what exercises rotated
     */
    getRotationSummary(oldProgram, newProgram) {
        const oldIds = new Set(this._extractExerciseIds(oldProgram));
        const newIds = new Set(this._extractExerciseIds(newProgram));

        const added = [...newIds].filter(id => !oldIds.has(id));
        const removed = [...oldIds].filter(id => !newIds.has(id));
        const kept = [...newIds].filter(id => oldIds.has(id));

        return {
            added: added.map(id => ({ id, name: EXERCISES_DB[id]?.name || id })),
            removed: removed.map(id => ({ id, name: EXERCISES_DB[id]?.name || id })),
            kept: kept.map(id => ({ id, name: EXERCISES_DB[id]?.name || id })),
            totalChanged: added.length + removed.length,
            cycleNumber: newProgram?.metadata?.cycleNumber || 1
        };
    }
};
