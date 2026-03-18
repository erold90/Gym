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
    REP_RANGES: {
        strength: { compound: { min: 1, max: 5 }, isolation: { min: 6, max: 8 } },
        hypertrophy: { compound: { min: 8, max: 12 }, isolation: { min: 10, max: 15 } },
        recomp: { compound: { min: 8, max: 12 }, isolation: { min: 10, max: 15 } },
        endurance: { compound: { min: 15, max: 20 }, isolation: { min: 15, max: 25 } }
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
    REST_TIMES: {
        strength: { compound: 240, isolation: 150 },      // 4min / 2.5min
        hypertrophy: { compound: 150, isolation: 90 },    // 2.5min / 1.5min
        recomp: { compound: 120, isolation: 90 },         // 2min / 1.5min
        endurance: { compound: 60, isolation: 45 }        // 1min / 45s
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
            endurance: { beginner: 3, intermediate: 4, advanced: 5, expert: 5 }
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
            compound: ['squat', 'front-squat', 'leg-press', 'hack-squat', 'bulgarian-split-squat', 'dumbbell-lunge'],
            isolation: ['leg-extension']
        },
        femorali: {
            compound: ['romanian-deadlift', 'stiff-leg-deadlift', 'deadlift', 'good-morning'],
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

        let program;

        // Note: Bro Split removed - scientific research shows training each muscle
        // 2x/week is superior to 1x/week (Schoenfeld meta-analysis)
        switch (split) {
            case 'upper-lower':
                program = this.generateUpperLower(profile, volumeConfig, repRanges, restTimes, daysPerWeek, sessionDuration);
                break;
            case 'push-pull-legs':
                program = this.generatePPL(profile, volumeConfig, repRanges, restTimes, daysPerWeek, sessionDuration);
                break;
            case 'full-body':
                program = this.generateFullBody(profile, volumeConfig, repRanges, restTimes, daysPerWeek, sessionDuration);
                break;
            default:
                program = this.generateUpperLower(profile, volumeConfig, repRanges, restTimes, daysPerWeek, sessionDuration);
        }

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

    generateUpperLower(profile, volumeConfig, repRanges, restTimes, days, sessionDuration) {
        const program = {
            name: 'Upper/Lower Split',
            days: []
        };

        // Adjust volume based on training frequency
        // More days = can do less volume per session but more total
        const frequencyMultiplier = days <= 3 ? 1.2 : (days === 4 ? 1 : 0.85);
        const setsPerMuscle = Math.round((volumeConfig.optimal / 2) * frequencyMultiplier);

        if (days === 3) {
            // 3 days: Upper, Lower, Upper (alternate each week) or Upper, Lower, Full Body
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

            program.days.push({
                name: 'Giorno 3',
                type: 'Upper B',
                focus: 'Ipertrofia Upper Body',
                warmup: 'upper',
                exercises: this.buildUpperWorkout(profile, setsPerMuscle, repRanges, restTimes, 'hypertrophy', sessionDuration)
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

        // Variant-specific exercise selection
        if (variant === 'strength') {
            // Heavy compound focus
            exercises.push(...this.selectExercisesUnique('petto', 'compound', 1, Math.min(5, baseSets), equipment, repRanges, restTimes, usedExercises));
            exercises.push(...this.selectExercisesUnique('petto', 'compound', 1, 3, equipment, repRanges, restTimes, usedExercises));
            exercises.push(...this.selectExercisesUnique('schiena', 'compound', 2, baseSets, equipment, repRanges, restTimes, usedExercises));
            exercises.push(...this.selectExercisesUnique('spalle', 'compound', 1, Math.ceil(baseSets / 2), equipment, repRanges, restTimes, usedExercises));
        } else if (variant === 'hypertrophy' || variant === 'pump') {
            // Higher rep, more isolation
            exercises.push(...this.selectExercisesUnique('petto', 'compound', 1, Math.min(4, baseSets), equipment, repRanges, restTimes, usedExercises));
            exercises.push(...this.selectExercisesUnique('petto', 'isolation', 1, 3, equipment, repRanges, restTimes, usedExercises));
            exercises.push(...this.selectExercisesUnique('schiena', 'compound', 2, baseSets, equipment, repRanges, restTimes, usedExercises));
            exercises.push(...this.selectExercisesUnique('spalle', 'isolation', 2, Math.ceil(baseSets / 2), equipment, repRanges, restTimes, usedExercises));
        } else {
            // Default balanced
            exercises.push(...this.selectExercisesUnique('petto', 'compound', 1, baseSets - 1, equipment, repRanges, restTimes, usedExercises));
            exercises.push(...this.selectExercisesUnique('petto', 'isolation', 1, Math.ceil(baseSets / 2), equipment, repRanges, restTimes, usedExercises));
            exercises.push(...this.selectExercisesUnique('schiena', 'compound', 2, baseSets, equipment, repRanges, restTimes, usedExercises));
            exercises.push(...this.selectExercisesUnique('spalle', 'compound', 1, Math.ceil(baseSets / 2), equipment, repRanges, restTimes, usedExercises));
        }

        // Arms: 1 exercise each
        exercises.push(...this.selectExercisesUnique('bicipiti', 'isolation', 1, Math.ceil(baseSets / 2), equipment, repRanges, restTimes, usedExercises));
        exercises.push(...this.selectExercisesUnique('tricipiti', 'isolation', 1, Math.ceil(baseSets / 2), equipment, repRanges, restTimes, usedExercises));

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

        if (variant === 'quad') {
            // Quad-dominant day
            exercises.push(...this.selectExercisesUnique('quadricipiti', 'compound', 2, baseSets, equipment, repRanges, restTimes, usedExercises));
            exercises.push(...this.selectExercisesUnique('quadricipiti', 'isolation', 1, Math.ceil(baseSets / 2), equipment, repRanges, restTimes, usedExercises));
            exercises.push(...this.selectExercisesUnique('glutei', 'compound', 1, Math.ceil(baseSets / 2), equipment, repRanges, restTimes, usedExercises));
            exercises.push(...this.selectExercisesUnique('femorali', 'isolation', 1, Math.ceil(baseSets / 2), equipment, repRanges, restTimes, usedExercises));
        } else if (variant === 'hamstring') {
            // Hamstring/glute-dominant day
            exercises.push(...this.selectExercisesUnique('femorali', 'compound', 2, baseSets, equipment, repRanges, restTimes, usedExercises));
            exercises.push(...this.selectExercisesUnique('glutei', 'compound', 1, Math.ceil(baseSets / 2), equipment, repRanges, restTimes, usedExercises));
            exercises.push(...this.selectExercisesUnique('quadricipiti', 'compound', 1, Math.ceil(baseSets / 2), equipment, repRanges, restTimes, usedExercises));
            exercises.push(...this.selectExercisesUnique('femorali', 'isolation', 1, Math.ceil(baseSets / 2), equipment, repRanges, restTimes, usedExercises));
        } else if (variant === 'full') {
            // Balanced full leg day
            exercises.push(...this.selectExercisesUnique('quadricipiti', 'compound', 1, baseSets, equipment, repRanges, restTimes, usedExercises));
            exercises.push(...this.selectExercisesUnique('femorali', 'compound', 1, Math.ceil(baseSets * 0.8), equipment, repRanges, restTimes, usedExercises));
            exercises.push(...this.selectExercisesUnique('glutei', 'compound', 1, Math.ceil(baseSets / 2), equipment, repRanges, restTimes, usedExercises));
            exercises.push(...this.selectExercisesUnique('quadricipiti', 'isolation', 1, 3, equipment, repRanges, restTimes, usedExercises));
            exercises.push(...this.selectExercisesUnique('femorali', 'isolation', 1, 3, equipment, repRanges, restTimes, usedExercises));
        } else {
            // Default (same as hamstring)
            exercises.push(...this.selectExercisesUnique('femorali', 'compound', 2, baseSets, equipment, repRanges, restTimes, usedExercises));
            exercises.push(...this.selectExercisesUnique('glutei', 'compound', 1, Math.ceil(baseSets / 2), equipment, repRanges, restTimes, usedExercises));
            exercises.push(...this.selectExercisesUnique('quadricipiti', 'compound', 1, Math.ceil(baseSets / 2), equipment, repRanges, restTimes, usedExercises));
            exercises.push(...this.selectExercisesUnique('femorali', 'isolation', 1, Math.ceil(baseSets / 2), equipment, repRanges, restTimes, usedExercises));
        }

        // Calves
        exercises.push(...this.selectExercisesUnique('polpacci', 'isolation', 1, 4, equipment, repRanges, restTimes, usedExercises));

        // Core
        exercises.push(...this.selectExercisesUnique('addome', 'isolation', 2, 3, equipment, repRanges, restTimes, usedExercises));

        return exercises;
    },

    buildArmsWorkout(profile, baseSets, repRanges, restTimes, sessionDuration) {
        const exercises = [];
        const equipment = profile.equipment || [];
        const usedExercises = new Set();

        // Biceps: 3 exercises
        exercises.push(...this.selectExercisesUnique('bicipiti', 'isolation', 3, Math.ceil(baseSets / 2), equipment, repRanges, restTimes, usedExercises));

        // Triceps: 3 exercises
        exercises.push(...this.selectExercisesUnique('tricipiti', 'isolation', 3, Math.ceil(baseSets / 2), equipment, repRanges, restTimes, usedExercises));

        // Shoulders (lateral delts focus)
        exercises.push(...this.selectExercisesUnique('spalle', 'isolation', 2, Math.ceil(baseSets / 2), equipment, repRanges, restTimes, usedExercises));

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
    // PUSH/PULL/LEGS SPLIT
    // ========================================

    generatePPL(profile, volumeConfig, repRanges, restTimes, days, sessionDuration) {
        const program = {
            name: 'Push/Pull/Legs',
            days: []
        };

        const setsPerMuscle = Math.round(volumeConfig.optimal / 2);
        const equipment = profile.equipment || [];

        // Push Day
        program.days.push({
            name: 'Giorno 1',
            type: 'Push',
            focus: 'Petto, Spalle, Tricipiti',
            warmup: 'push',
            exercises: [
                ...this.selectExercises('petto', 'compound', 2, setsPerMuscle, equipment, repRanges, restTimes),
                ...this.selectExercises('spalle', 'compound', 1, setsPerMuscle - 1, equipment, repRanges, restTimes),
                ...this.selectExercises('petto', 'isolation', 1, Math.ceil(setsPerMuscle / 2), equipment, repRanges, restTimes),
                ...this.selectExercises('spalle', 'isolation', 2, Math.ceil(setsPerMuscle / 2), equipment, repRanges, restTimes),
                ...this.selectExercises('tricipiti', 'isolation', 2, setsPerMuscle, equipment, repRanges, restTimes)
            ]
        });

        // Pull Day
        program.days.push({
            name: 'Giorno 2',
            type: 'Pull',
            focus: 'Schiena, Bicipiti',
            warmup: 'pull',
            exercises: [
                ...this.selectExercises('schiena', 'compound', 3, setsPerMuscle, equipment, repRanges, restTimes),
                ...this.selectExercises('schiena', 'isolation', 1, Math.ceil(setsPerMuscle / 2), equipment, repRanges, restTimes),
                ...this.selectExercises('bicipiti', 'isolation', 2, setsPerMuscle, equipment, repRanges, restTimes),
                { exerciseId: 'face-pull', name: 'Face Pull', sets: 3, reps: '15-20', rest: 60 }
            ]
        });

        // Legs Day
        program.days.push({
            name: 'Giorno 3',
            type: 'Legs',
            focus: 'Gambe Complete',
            warmup: 'lower',
            exercises: [
                ...this.selectExercises('quadricipiti', 'compound', 2, setsPerMuscle, equipment, repRanges, restTimes),
                ...this.selectExercises('femorali', 'compound', 1, setsPerMuscle - 1, equipment, repRanges, restTimes),
                ...this.selectExercises('glutei', 'compound', 1, setsPerMuscle - 1, equipment, repRanges, restTimes),
                ...this.selectExercises('quadricipiti', 'isolation', 1, Math.ceil(setsPerMuscle / 2), equipment, repRanges, restTimes),
                ...this.selectExercises('femorali', 'isolation', 1, Math.ceil(setsPerMuscle / 2), equipment, repRanges, restTimes),
                ...this.selectExercises('polpacci', 'isolation', 1, 4, equipment, repRanges, restTimes),
                ...this.selectExercises('addome', 'isolation', 2, 3, equipment, repRanges, restTimes)
            ]
        });

        // If 6 days, repeat
        if (days >= 6) {
            program.days.push({ ...program.days[0], name: 'Giorno 4' });
            program.days.push({ ...program.days[1], name: 'Giorno 5' });
            program.days.push({ ...program.days[2], name: 'Giorno 6' });
        } else if (days === 4) {
            // Add Upper day
            program.days.push({
                name: 'Giorno 4',
                type: 'Upper',
                focus: 'Upper Body Volume',
                warmup: 'upper',
                exercises: this.buildUpperWorkout(profile, setsPerMuscle - 2, repRanges, restTimes, 'hypertrophy', sessionDuration)
            });
        }

        return program;
    },

    // ========================================
    // FULL BODY SPLIT
    // ========================================

    generateFullBody(profile, volumeConfig, repRanges, restTimes, days, sessionDuration) {
        const program = {
            name: 'Full Body',
            days: []
        };

        const setsPerMusclePerSession = Math.round(volumeConfig.optimal / days);
        const equipment = profile.equipment || [];

        for (let i = 0; i < days; i++) {
            const dayNum = i + 1;
            const variant = i % 2 === 0 ? 'A' : 'B'; // Alternate

            program.days.push({
                name: `Giorno ${dayNum}`,
                type: `Full Body ${variant}`,
                focus: 'Tutto il Corpo',
                warmup: 'full-body',
                exercises: [
                    // Compound movements for major muscles
                    ...this.selectExercises('quadricipiti', 'compound', 1, setsPerMusclePerSession, equipment, repRanges, restTimes),
                    ...this.selectExercises('petto', 'compound', 1, setsPerMusclePerSession, equipment, repRanges, restTimes),
                    ...this.selectExercises('schiena', 'compound', 1, setsPerMusclePerSession, equipment, repRanges, restTimes),
                    ...this.selectExercises(variant === 'A' ? 'femorali' : 'glutei', 'compound', 1, setsPerMusclePerSession, equipment, repRanges, restTimes),
                    ...this.selectExercises('spalle', variant === 'A' ? 'compound' : 'isolation', 1, setsPerMusclePerSession, equipment, repRanges, restTimes),
                    // Accessories
                    ...this.selectExercises('bicipiti', 'isolation', 1, Math.max(2, setsPerMusclePerSession - 1), equipment, repRanges, restTimes),
                    ...this.selectExercises('tricipiti', 'isolation', 1, Math.max(2, setsPerMusclePerSession - 1), equipment, repRanges, restTimes),
                    ...this.selectExercises('addome', 'isolation', 1, 3, equipment, repRanges, restTimes)
                ]
            });
        }

        return program;
    },


    // ========================================
    // HELPER FUNCTIONS
    // ========================================

    selectExercises(muscle, type, count, sets, equipment, repRanges, restTimes) {
        const priorityList = this.EXERCISE_PRIORITY[muscle];
        if (!priorityList) return [];

        const exerciseIds = type === 'compound' ? priorityList.compound : priorityList.isolation;
        const selected = [];
        let exercisesAdded = 0;

        // Use special rep ranges for muscles that need higher reps (calves, abs, forearms)
        const specialReps = this.SPECIAL_REP_RANGES[muscle];
        const reps = specialReps || (type === 'compound' ? repRanges.compound : repRanges.isolation);
        const rest = type === 'compound' ? restTimes.compound : restTimes.isolation;

        for (const exId of exerciseIds) {
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
    selectExercisesUnique(muscle, type, count, sets, equipment, repRanges, restTimes, usedExercises) {
        const priorityList = this.EXERCISE_PRIORITY[muscle];
        if (!priorityList) return [];

        const exerciseIds = type === 'compound' ? priorityList.compound : priorityList.isolation;
        const selected = [];
        let exercisesAdded = 0;

        // Use special rep ranges for muscles that need higher reps (calves, abs, forearms)
        const specialReps = this.SPECIAL_REP_RANGES[muscle];
        const reps = specialReps || (type === 'compound' ? repRanges.compound : repRanges.isolation);
        const rest = type === 'compound' ? restTimes.compound : restTimes.isolation;

        for (const exId of exerciseIds) {
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

        workout.exercises.forEach(ex => {
            const sets = ex.sets || 3;
            const rest = ex.rest || 60;

            // Estimate 45 seconds per set + rest between sets
            const setTime = 45;
            totalSeconds += sets * setTime + (sets - 1) * rest;
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
    }
};
