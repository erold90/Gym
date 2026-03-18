/**
 * GymTracker Pro - Storage Module
 * Handles all data persistence using LocalStorage
 */

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
        CONDITIONING: 'gymtracker_conditioning'
    },

    // ========================================
    // PROFILE
    // ========================================

    getProfile() {
        const data = localStorage.getItem(this.KEYS.PROFILE);
        return data ? JSON.parse(data) : this.getDefaultProfile();
    },

    saveProfile(profile) {
        localStorage.setItem(this.KEYS.PROFILE, JSON.stringify(profile));
    },

    getDefaultProfile() {
        return {
            name: '',
            gender: 'male',
            birthdate: '',
            height: 180,
            weight: 90,
            bodyFat: 20,
            level: 'advanced',
            background: 'crossfit',
            goal: 'recomp',
            targetWeight: 85,
            targetBodyFat: 12,
            daysPerWeek: 4,
            sessionTime: 60,
            equipment: ['bilanciere', 'manubri', 'macchine', 'cavi', 'panca', 'sbarra']
        };
    },

    // ========================================
    // SETTINGS
    // ========================================

    getSettings() {
        const data = localStorage.getItem(this.KEYS.SETTINGS);
        return data ? JSON.parse(data) : this.getDefaultSettings();
    },

    saveSettings(settings) {
        localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings));
    },

    getDefaultSettings() {
        return {
            restTimeCompound: 90,
            restTimeIsolation: 60,
            restSound: 'beep',
            vibration: true,
            theme: 'dark',
            weightUnit: 'kg'
        };
    },

    // ========================================
    // WORKOUTS (History)
    // ========================================

    getWorkouts() {
        const data = localStorage.getItem(this.KEYS.WORKOUTS);
        return data ? JSON.parse(data) : [];
    },

    saveWorkout(workout) {
        const workouts = this.getWorkouts();
        workout.id = Date.now();
        workout.date = new Date().toISOString();
        workouts.unshift(workout); // Add to beginning
        localStorage.setItem(this.KEYS.WORKOUTS, JSON.stringify(workouts));

        // Update streak
        this.updateStreak();

        // Update personal records
        this.updatePersonalRecords(workout);

        return workout;
    },

    getWorkoutById(id) {
        const workouts = this.getWorkouts();
        return workouts.find(w => w.id === id);
    },

    deleteWorkout(id) {
        let workouts = this.getWorkouts();
        workouts = workouts.filter(w => w.id !== id);
        localStorage.setItem(this.KEYS.WORKOUTS, JSON.stringify(workouts));
    },

    getRecentWorkouts(limit = 10) {
        const workouts = this.getWorkouts();
        return workouts.slice(0, limit);
    },

    getWorkoutsInDateRange(startDate, endDate) {
        const workouts = this.getWorkouts();
        return workouts.filter(w => {
            const date = new Date(w.date);
            return date >= startDate && date <= endDate;
        });
    },

    getWorkoutsThisWeek() {
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
        startOfWeek.setHours(0, 0, 0, 0);
        return this.getWorkoutsInDateRange(startOfWeek, now);
    },

    // ========================================
    // PROGRAMS
    // ========================================

    getPrograms() {
        const data = localStorage.getItem(this.KEYS.PROGRAMS);
        return data ? JSON.parse(data) : [];
    },

    saveProgram(program) {
        const programs = this.getPrograms();
        program.id = Date.now();
        program.createdAt = new Date().toISOString();
        programs.push(program);
        localStorage.setItem(this.KEYS.PROGRAMS, JSON.stringify(programs));
        return program;
    },

    deleteProgram(id) {
        let programs = this.getPrograms();
        programs = programs.filter(p => p.id !== id);
        localStorage.setItem(this.KEYS.PROGRAMS, JSON.stringify(programs));

        // If this was the active program, clear it
        const activeProgram = this.getActiveProgram();
        if (activeProgram && activeProgram.id === id) {
            this.clearActiveProgram();
        }
    },

    getActiveProgram() {
        const data = localStorage.getItem(this.KEYS.ACTIVE_PROGRAM);
        return data ? JSON.parse(data) : null;
    },

    setActiveProgram(program) {
        localStorage.setItem(this.KEYS.ACTIVE_PROGRAM, JSON.stringify(program));
    },

    clearActiveProgram() {
        localStorage.removeItem(this.KEYS.ACTIVE_PROGRAM);
    },

    // ========================================
    // MEASUREMENTS
    // ========================================

    getMeasurements() {
        const data = localStorage.getItem(this.KEYS.MEASUREMENTS);
        return data ? JSON.parse(data) : [];
    },

    saveMeasurement(measurement) {
        const measurements = this.getMeasurements();
        measurement.id = Date.now();
        measurement.date = new Date().toISOString();
        measurements.unshift(measurement);
        localStorage.setItem(this.KEYS.MEASUREMENTS, JSON.stringify(measurements));

        // Also update profile with latest weight
        const profile = this.getProfile();
        if (measurement.weight) {
            profile.weight = measurement.weight;
        }
        if (measurement.bodyFat) {
            profile.bodyFat = measurement.bodyFat;
        }
        this.saveProfile(profile);

        return measurement;
    },

    getLatestMeasurement() {
        const measurements = this.getMeasurements();
        return measurements.length > 0 ? measurements[0] : null;
    },

    // ========================================
    // PERSONAL RECORDS
    // ========================================

    getPersonalRecords() {
        const data = localStorage.getItem(this.KEYS.PERSONAL_RECORDS);
        return data ? JSON.parse(data) : {};
    },

    /**
     * Calculate estimated 1RM using the best formula for the rep range
     * - Brzycki (1993): more accurate for 1-10 reps → 1RM = weight × 36 / (37 - reps)
     * - Epley: better for 10+ reps → 1RM = weight × (1 + reps/30)
     * - For 20+ reps: capped, formulas become unreliable
     * Sources: LeSuer et al. 1997 comparison study, NSCA guidelines
     */
    calculateE1RM(weight, reps) {
        if (!weight || !reps || reps <= 0) return 0;
        if (reps === 1) return weight;

        let e1rm;
        if (reps <= 10) {
            // Brzycki formula — most accurate for 1-10 reps
            e1rm = weight * (36 / (37 - reps));
        } else if (reps <= 20) {
            // Epley formula — more accurate for higher rep ranges
            e1rm = weight * (1 + reps / 30);
        } else {
            // 20+ reps: cap at Epley with 20 reps equivalent (formulas unreliable above 20)
            e1rm = weight * (1 + 20 / 30);
        }

        return Math.round(e1rm * 10) / 10;
    },

    updatePersonalRecords(workout) {
        const prs = this.getPersonalRecords();

        if (!workout.exercises) return;

        workout.exercises.forEach(exercise => {
            if (!exercise.sets) return;

            const exerciseId = exercise.exerciseId;

            // Find the BEST set of this exercise in this workout (highest E1RM)
            let bestSet = null;
            let bestE1rm = 0;

            exercise.sets.forEach(set => {
                if (!set.weight || !set.reps || !set.completed) return;

                const weight = parseFloat(set.weight);
                const reps = parseInt(set.reps);
                const e1rm = this.calculateE1RM(weight, reps);

                if (e1rm > bestE1rm) {
                    bestE1rm = e1rm;
                    bestSet = { weight, reps, e1rm };
                }
            });

            if (!bestSet) return;

            if (!prs[exerciseId]) {
                prs[exerciseId] = {
                    maxWeight: 0,
                    maxWeightReps: 0,
                    maxWeightDate: null,
                    maxReps: 0,
                    maxRepsWeight: 0,
                    maxRepsDate: null,
                    estimated1RM: 0,
                    e1rmDate: null,
                    e1rmWeight: 0,
                    e1rmReps: 0,
                    history: []
                };
            }

            // Check for new max weight
            if (bestSet.weight > prs[exerciseId].maxWeight) {
                prs[exerciseId].maxWeight = bestSet.weight;
                prs[exerciseId].maxWeightReps = bestSet.reps;
                prs[exerciseId].maxWeightDate = workout.date;
            }

            // Check for new max reps (with at least 50% of max weight)
            const bestRepsSet = exercise.sets
                .filter(s => s.completed && s.weight && s.reps)
                .reduce((best, s) => {
                    const r = parseInt(s.reps);
                    const w = parseFloat(s.weight);
                    return (w >= prs[exerciseId].maxWeight * 0.5 && r > (best?.reps || 0))
                        ? { weight: w, reps: r } : best;
                }, null);

            if (bestRepsSet && bestRepsSet.reps > prs[exerciseId].maxReps) {
                prs[exerciseId].maxReps = bestRepsSet.reps;
                prs[exerciseId].maxRepsWeight = bestRepsSet.weight;
                prs[exerciseId].maxRepsDate = workout.date;
            }

            // Check for new estimated 1RM
            if (bestE1rm > prs[exerciseId].estimated1RM) {
                prs[exerciseId].estimated1RM = bestE1rm;
                prs[exerciseId].e1rmDate = workout.date;
                prs[exerciseId].e1rmWeight = bestSet.weight;
                prs[exerciseId].e1rmReps = bestSet.reps;
            }

            // Add ONLY best set of this session to history (not every single set)
            prs[exerciseId].history.push({
                date: workout.date,
                weight: bestSet.weight,
                reps: bestSet.reps,
                e1rm: bestE1rm
            });

            // Keep only last 50 sessions per exercise
            if (prs[exerciseId].history.length > 50) {
                prs[exerciseId].history = prs[exerciseId].history.slice(-50);
            }
        });

        localStorage.setItem(this.KEYS.PERSONAL_RECORDS, JSON.stringify(prs));
    },

    getExerciseHistory(exerciseId) {
        const prs = this.getPersonalRecords();
        return prs[exerciseId] ? prs[exerciseId].history : [];
    },

    // Get last performance for an exercise (most recent workout)
    getLastPerformance(exerciseId) {
        const workouts = this.getWorkouts();

        for (const workout of workouts) {
            if (!workout.exercises) continue;

            const exercise = workout.exercises.find(ex => ex.exerciseId === exerciseId);
            if (exercise && exercise.sets && exercise.sets.length > 0) {
                // Find the best completed set from this workout
                const completedSets = exercise.sets.filter(s => s.completed && s.weight && s.reps);

                if (completedSets.length > 0) {
                    // Return the heaviest set
                    const bestSet = completedSets.reduce((best, set) => {
                        const volume = parseFloat(set.weight) * parseInt(set.reps);
                        const bestVolume = parseFloat(best.weight) * parseInt(best.reps);
                        return volume > bestVolume ? set : best;
                    });

                    return {
                        weight: parseFloat(bestSet.weight),
                        reps: parseInt(bestSet.reps),
                        date: workout.date,
                        allSets: completedSets.map(s => ({
                            weight: parseFloat(s.weight),
                            reps: parseInt(s.reps)
                        }))
                    };
                }
            }
        }

        return null;
    },

    // Get PR for an exercise
    getExercisePR(exerciseId) {
        const prs = this.getPersonalRecords();
        return prs[exerciseId] || null;
    },

    // Check if a set is a new PR
    checkForNewPR(exerciseId, weight, reps) {
        const prs = this.getPersonalRecords();
        const current = prs[exerciseId];

        if (!current) {
            return { isNewPR: true, type: 'first' };
        }

        weight = parseFloat(weight);
        reps = parseInt(reps);

        // Check max weight
        if (weight > current.maxWeight) {
            return { isNewPR: true, type: 'weight', oldValue: current.maxWeight };
        }

        // Check estimated 1RM using proper formula (Brzycki ≤10, Epley >10)
        const newE1RM = this.calculateE1RM(weight, reps);
        if (newE1RM > current.estimated1RM) {
            return { isNewPR: true, type: 'e1rm', oldValue: current.estimated1RM, newValue: newE1RM };
        }

        return { isNewPR: false };
    },

    // ========================================
    // DOUBLE PROGRESSION SYSTEM
    // ========================================

    /**
     * Parse rep range string (e.g., "8-12") into min/max object
     */
    parseRepRange(repRangeStr) {
        if (!repRangeStr || typeof repRangeStr !== 'string') {
            return { min: 8, max: 12 }; // Default
        }
        const parts = repRangeStr.split('-').map(p => parseInt(p.trim()));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            return { min: parts[0], max: parts[1] };
        }
        // Single number case (e.g., "10")
        const single = parseInt(repRangeStr);
        if (!isNaN(single)) {
            return { min: single, max: single };
        }
        return { min: 8, max: 12 };
    },

    /**
     * Calculate progression suggestion based on Double Progression method
     * @param {string} exerciseId - The exercise ID
     * @param {string} targetRepRange - Target rep range (e.g., "8-12")
     * @param {string} goal - User's goal (strength, hypertrophy, recomp, endurance)
     * @param {string} exerciseType - 'compound' or 'isolation'
     * @returns {Object} Suggestion object with weight, message, and status
     */
    getProgressionSuggestion(exerciseId, targetRepRange, goal = 'hypertrophy', exerciseType = 'compound') {
        const lastPerf = this.getLastPerformance(exerciseId);
        const range = this.parseRepRange(targetRepRange);

        // Default suggestion for first time
        if (!lastPerf) {
            return {
                suggestedWeight: null,
                suggestedReps: range.min,
                message: 'Prima volta! Inizia con un peso che ti permetta ' + range.min + '-' + range.max + ' rep',
                status: 'new',
                action: 'start'
            };
        }

        const lastWeight = lastPerf.weight;
        const lastReps = lastPerf.allSets.map(s => s.reps);
        const avgReps = Math.round(lastReps.reduce((a, b) => a + b, 0) / lastReps.length);
        const minRepsAchieved = Math.min(...lastReps);
        const allSetsAtTop = lastReps.every(r => r >= range.max);
        const allSetsInRange = lastReps.every(r => r >= range.min && r <= range.max);

        // Weight increment based on exercise type
        const weightIncrement = exerciseType === 'compound' ? 2.5 : 1.25;
        // For lower body compounds, use larger increment
        const lowerBodyExercises = ['squat', 'front-squat', 'leg-press', 'deadlift', 'romanian-deadlift', 'hip-thrust', 'hack-squat'];
        const isLowerBody = lowerBodyExercises.some(ex => exerciseId.includes(ex));
        const actualIncrement = isLowerBody ? 5 : weightIncrement;

        // CASE 1: All sets at or above top of range → INCREASE WEIGHT
        if (allSetsAtTop) {
            const newWeight = lastWeight + actualIncrement;
            return {
                suggestedWeight: newWeight,
                suggestedReps: range.min,
                message: `🎯 Aumenta a ${newWeight}kg! Hai raggiunto ${range.max} rep su tutte le serie`,
                status: 'increase_weight',
                action: 'weight_up',
                lastPerformance: { weight: lastWeight, reps: lastReps }
            };
        }

        // CASE 2: All sets in range but not at top → INCREASE REPS
        if (allSetsInRange) {
            const targetReps = lastReps.map(r => Math.min(r + 1, range.max));
            return {
                suggestedWeight: lastWeight,
                suggestedReps: targetReps,
                message: `💪 Stesso peso (${lastWeight}kg), punta a +1 rep per serie`,
                status: 'increase_reps',
                action: 'reps_up',
                lastPerformance: { weight: lastWeight, reps: lastReps }
            };
        }

        // CASE 3: Some sets below range → MAINTAIN or check for issues
        if (minRepsAchieved < range.min) {
            // Check if this is a recurring problem (would need history check)
            return {
                suggestedWeight: lastWeight,
                suggestedReps: range.min,
                message: `⚠️ Mantieni ${lastWeight}kg, focus su raggiungere ${range.min} rep minimo`,
                status: 'maintain',
                action: 'consolidate',
                lastPerformance: { weight: lastWeight, reps: lastReps }
            };
        }

        // CASE 4: Mixed results → MAINTAIN
        return {
            suggestedWeight: lastWeight,
            suggestedReps: avgReps,
            message: `📊 Mantieni ${lastWeight}kg, prossimo obiettivo: ${range.max} rep consistenti`,
            status: 'maintain',
            action: 'maintain',
            lastPerformance: { weight: lastWeight, reps: lastReps }
        };
    },

    /**
     * Get progression summary for all exercises in a workout
     * @param {Array} exercises - Array of exercise objects with exerciseId and reps
     * @param {string} goal - User's goal
     * @returns {Array} Array of progression suggestions
     */
    getWorkoutProgressionSummary(exercises, goal = 'hypertrophy') {
        return exercises.map(ex => {
            const exerciseType = this.getExerciseType(ex.exerciseId);
            return {
                exerciseId: ex.exerciseId,
                name: ex.name,
                ...this.getProgressionSuggestion(ex.exerciseId, ex.reps || ex.targetReps, goal, exerciseType)
            };
        });
    },

    /**
     * Determine if exercise is compound or isolation
     */
    getExerciseType(exerciseId) {
        const compoundExercises = [
            'bench-press', 'incline-bench-press', 'dumbbell-bench-press', 'dumbbell-incline-press',
            'squat', 'front-squat', 'leg-press', 'hack-squat', 'deadlift', 'romanian-deadlift',
            'barbell-row', 'pull-up', 'chin-up', 'lat-pulldown', 't-bar-row', 'seated-cable-row',
            'overhead-press', 'dumbbell-shoulder-press', 'arnold-press', 'push-press',
            'hip-thrust', 'bulgarian-split-squat', 'dumbbell-lunge', 'dips', 'close-grip-bench'
        ];
        return compoundExercises.some(ex => exerciseId.includes(ex)) ? 'compound' : 'isolation';
    },

    // ========================================
    // CYCLE MANAGEMENT
    // ========================================

    /**
     * Get current cycle info from active program
     */
    getCycleInfo() {
        const program = this.getActiveProgram();
        if (!program?.metadata?.cycle) return null;

        const cycle = program.metadata.cycle;
        const currentPhase = cycle.phases.find(p => p.week === cycle.currentWeek);

        // Progresso basato su settimane completate (currentWeek-1), non la settimana corrente
        const completedWeeks = cycle.currentWeek - 1;
        const progress = Math.round((completedWeeks / cycle.duration) * 100);

        return {
            ...cycle,
            currentPhase: currentPhase || cycle.phases[0],
            progress: progress,
            weeksRemaining: cycle.duration - cycle.currentWeek,
            isLastWeek: cycle.currentWeek === cycle.duration
        };
    },

    /**
     * Advance cycle to next week (called after completing weekly workouts)
     */
    advanceCycleWeek() {
        const program = this.getActiveProgram();
        if (!program?.metadata?.cycle) return null;

        const cycle = program.metadata.cycle;

        if (cycle.currentWeek < cycle.duration) {
            cycle.currentWeek++;
            this.setActiveProgram(program);
        }

        return this.getCycleInfo();
    },

    /**
     * Check if it's time to suggest advancing the week
     * Based on completing the expected number of workouts
     */
    shouldAdvanceWeek() {
        const program = this.getActiveProgram();
        if (!program?.metadata?.cycle) return false;

        const cycle = program.metadata.cycle;
        const daysPerWeek = program.metadata.daysPerWeek || 4;

        // Get workouts since cycle started
        const cycleStart = new Date(cycle.startDate);
        const workouts = this.getWorkouts().filter(w => new Date(w.date) >= cycleStart);

        // Calculate expected workouts for current week
        const expectedWorkouts = cycle.currentWeek * daysPerWeek;

        return workouts.length >= expectedWorkouts;
    },

    /**
     * Toggle deload mode manually
     */
    toggleDeload() {
        const program = this.getActiveProgram();
        if (!program?.metadata?.cycle) return false;

        program.metadata.cycle.isDeloadActive = !program.metadata.cycle.isDeloadActive;
        this.setActiveProgram(program);

        return program.metadata.cycle.isDeloadActive;
    },

    /**
     * Check if deload is currently active
     */
    isDeloadActive() {
        const program = this.getActiveProgram();
        if (!program?.metadata?.cycle) return false;

        const cycle = program.metadata.cycle;
        const currentPhase = cycle.phases.find(p => p.week === cycle.currentWeek);

        // Deload is active if manually toggled OR if current phase is deload
        return cycle.isDeloadActive || currentPhase?.phase === 'deload';
    },

    /**
     * Get volume multiplier for current phase
     */
    getCurrentVolumeMultiplier() {
        const program = this.getActiveProgram();
        if (!program?.metadata?.cycle) return 1;

        if (program.metadata.cycle.isDeloadActive) return 0.5;

        const currentPhase = program.metadata.cycle.phases.find(
            p => p.week === program.metadata.cycle.currentWeek
        );

        return currentPhase?.volumeMultiplier || 1;
    },

    /**
     * Reset cycle (start new mesocycle)
     */
    resetCycle() {
        const program = this.getActiveProgram();
        if (!program?.metadata?.cycle) return null;

        program.metadata.cycle.currentWeek = 1;
        program.metadata.cycle.startDate = new Date().toISOString();
        program.metadata.cycle.isDeloadActive = false;

        this.setActiveProgram(program);
        return this.getCycleInfo();
    },

    // ========================================
    // CYCLE HISTORY & STATISTICS
    // ========================================

    /**
     * Get cycle history
     */
    getCycleHistory() {
        const data = localStorage.getItem(this.KEYS.CYCLE_HISTORY);
        return data ? JSON.parse(data) : [];
    },

    /**
     * Save a completed cycle to history
     */
    saveCycleToHistory(cycleData) {
        const history = this.getCycleHistory();
        cycleData.id = Date.now();
        cycleData.completedAt = new Date().toISOString();
        history.unshift(cycleData);
        // Keep last 20 cycles
        if (history.length > 20) history.pop();
        localStorage.setItem(this.KEYS.CYCLE_HISTORY, JSON.stringify(history));
        return cycleData;
    },

    /**
     * Complete current cycle and save to history with stats
     * Rotates exercises and progressively increases volume for the new cycle
     */
    completeCycle() {
        const cycleInfo = this.getCycleInfo();
        if (!cycleInfo) return null;

        const stats = this.getCycleStatistics();
        const program = this.getActiveProgram();

        // Create cycle record for history
        const cycleRecord = {
            duration: cycleInfo.duration,
            goal: program?.metadata?.goal || 'hypertrophy',
            level: program?.metadata?.level || 'intermediate',
            split: program?.metadata?.split || 'upper-lower',
            startDate: cycleInfo.startDate,
            phases: cycleInfo.phases.map(p => p.phaseName),
            statistics: stats
        };

        // Save to history
        this.saveCycleToHistory(cycleRecord);

        // Rotate exercises and create new cycle with progressive volume
        if (typeof TrainingAlgorithm !== 'undefined' && program) {
            const profile = this.getProfile() || {};
            profile.level = program.metadata?.level || 'intermediate';
            profile.equipment = profile.equipment || [];

            const oldProgram = JSON.parse(JSON.stringify(program)); // deep copy for summary
            const rotatedProgram = TrainingAlgorithm.rotateProgram(program, profile);

            if (rotatedProgram) {
                this.setActiveProgram(rotatedProgram);

                // Store rotation summary for UI display
                const summary = TrainingAlgorithm.getRotationSummary(oldProgram, rotatedProgram);
                this._lastRotationSummary = summary;

                return this.getCycleInfo();
            }
        }

        // Fallback: simple reset if rotation fails
        return this.resetCycle();
    },

    /**
     * Get the last rotation summary (what exercises changed)
     */
    getLastRotationSummary() {
        return this._lastRotationSummary || null;
    },

    /**
     * Get statistics for current cycle
     */
    getCycleStatistics() {
        const cycleInfo = this.getCycleInfo();
        if (!cycleInfo) return null;

        const cycleStart = new Date(cycleInfo.startDate);
        const workouts = this.getWorkouts().filter(w => new Date(w.date) >= cycleStart);

        if (workouts.length === 0) {
            return {
                totalWorkouts: 0,
                totalVolume: 0,
                totalSets: 0,
                avgVolumePerWorkout: 0,
                exercisesWorked: 0,
                prsAchieved: 0,
                avgRir: null,
                weeklyBreakdown: []
            };
        }

        // Calculate totals
        let totalVolume = 0;
        let totalSets = 0;
        let rirSum = 0;
        let rirCount = 0;
        const exercisesSet = new Set();
        let prsCount = 0;

        workouts.forEach(w => {
            totalVolume += w.totalVolume || 0;
            totalSets += w.totalSets || 0;

            w.exercises?.forEach(ex => {
                exercisesSet.add(ex.exerciseId || ex.name);
                ex.sets?.forEach(set => {
                    if (set.rir !== undefined) {
                        rirSum += set.rir;
                        rirCount++;
                    }
                    if (set.isNewPR) prsCount++;
                });
            });
        });

        // Weekly breakdown
        const weeklyBreakdown = [];
        for (let week = 1; week <= cycleInfo.currentWeek; week++) {
            const weekStart = new Date(cycleStart);
            weekStart.setDate(weekStart.getDate() + (week - 1) * 7);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 7);

            const weekWorkouts = workouts.filter(w => {
                const d = new Date(w.date);
                return d >= weekStart && d < weekEnd;
            });

            const phase = cycleInfo.phases.find(p => p.week === week);

            weeklyBreakdown.push({
                week: week,
                phase: phase?.phaseName || 'Sconosciuto',
                workouts: weekWorkouts.length,
                volume: weekWorkouts.reduce((sum, w) => sum + (w.totalVolume || 0), 0)
            });
        }

        return {
            totalWorkouts: workouts.length,
            totalVolume: Math.round(totalVolume),
            totalSets: totalSets,
            avgVolumePerWorkout: Math.round(totalVolume / workouts.length),
            exercisesWorked: exercisesSet.size,
            prsAchieved: prsCount,
            avgRir: rirCount > 0 ? (rirSum / rirCount).toFixed(1) : null,
            weeklyBreakdown: weeklyBreakdown,
            daysActive: Math.ceil((Date.now() - cycleStart.getTime()) / (1000 * 60 * 60 * 24))
        };
    },

    /**
     * Get progress metrics for the current cycle
     * Compares first week to last week performance
     */
    getCycleProgressMetrics() {
        const cycleInfo = this.getCycleInfo();
        if (!cycleInfo || cycleInfo.currentWeek < 2) return null;

        const cycleStart = new Date(cycleInfo.startDate);
        const workouts = this.getWorkouts().filter(w => new Date(w.date) >= cycleStart);

        if (workouts.length < 2) return null;

        // Get first week workouts
        const firstWeekEnd = new Date(cycleStart);
        firstWeekEnd.setDate(firstWeekEnd.getDate() + 7);
        const firstWeekWorkouts = workouts.filter(w => {
            const d = new Date(w.date);
            return d >= cycleStart && d < firstWeekEnd;
        });

        // Get current week workouts
        const currentWeekStart = new Date(cycleStart);
        currentWeekStart.setDate(currentWeekStart.getDate() + (cycleInfo.currentWeek - 1) * 7);
        const currentWeekWorkouts = workouts.filter(w => new Date(w.date) >= currentWeekStart);

        if (firstWeekWorkouts.length === 0) return null;

        const firstWeekVolume = firstWeekWorkouts.reduce((sum, w) => sum + (w.totalVolume || 0), 0);
        const currentWeekVolume = currentWeekWorkouts.reduce((sum, w) => sum + (w.totalVolume || 0), 0);

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
    // STREAK
    // ========================================

    getStreak() {
        const data = localStorage.getItem(this.KEYS.STREAK);
        return data ? JSON.parse(data) : { current: 0, best: 0, lastWorkoutDate: null };
    },

    updateStreak() {
        const streak = this.getStreak();
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();

        if (streak.lastWorkoutDate === today) {
            // Already worked out today
            return streak;
        }

        if (streak.lastWorkoutDate === yesterday) {
            // Continue streak
            streak.current++;
        } else if (streak.lastWorkoutDate !== today) {
            // Streak broken, start new
            streak.current = 1;
        }

        // Update best streak
        if (streak.current > streak.best) {
            streak.best = streak.current;
        }

        streak.lastWorkoutDate = today;
        localStorage.setItem(this.KEYS.STREAK, JSON.stringify(streak));

        return streak;
    },

    // ========================================
    // STATISTICS
    // ========================================

    getStatistics() {
        const workouts = this.getWorkouts();
        const streak = this.getStreak();
        const prs = this.getPersonalRecords();

        // Total workouts
        const totalWorkouts = workouts.length;

        // Total volume (all time)
        let totalVolume = 0;
        workouts.forEach(workout => {
            if (workout.exercises) {
                workout.exercises.forEach(exercise => {
                    if (exercise.sets) {
                        exercise.sets.forEach(set => {
                            if (set.completed && set.weight && set.reps) {
                                totalVolume += parseFloat(set.weight) * parseInt(set.reps);
                            }
                        });
                    }
                });
            }
        });

        // Count PRs
        const prCount = Object.keys(prs).length;

        // Weekly stats
        const weeklyWorkouts = this.getWorkoutsThisWeek();
        let weeklyVolume = 0;
        weeklyWorkouts.forEach(workout => {
            if (workout.exercises) {
                workout.exercises.forEach(exercise => {
                    if (exercise.sets) {
                        exercise.sets.forEach(set => {
                            if (set.completed && set.weight && set.reps) {
                                weeklyVolume += parseFloat(set.weight) * parseInt(set.reps);
                            }
                        });
                    }
                });
            }
        });

        return {
            totalWorkouts,
            totalVolume: Math.round(totalVolume),
            weeklyWorkouts: weeklyWorkouts.length,
            weeklyVolume: Math.round(weeklyVolume),
            currentStreak: streak.current,
            bestStreak: streak.best,
            prCount
        };
    },

    // Get workout days for calendar
    getWorkoutDays() {
        const workouts = this.getWorkouts();
        const days = {};

        workouts.forEach(w => {
            const date = new Date(w.date).toDateString();
            days[date] = true;
        });

        return days;
    },

    // ========================================
    // EXPORT / IMPORT
    // ========================================

    exportAllData() {
        const data = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            profile: this.getProfile(),
            settings: this.getSettings(),
            workouts: this.getWorkouts(),
            programs: this.getPrograms(),
            activeProgram: this.getActiveProgram(),
            measurements: this.getMeasurements(),
            personalRecords: this.getPersonalRecords(),
            streak: this.getStreak()
        };

        return JSON.stringify(data, null, 2);
    },

    importAllData(jsonString) {
        try {
            const data = JSON.parse(jsonString);

            if (!data.version) {
                throw new Error('Invalid data format');
            }

            // Import all data
            if (data.profile) {
                localStorage.setItem(this.KEYS.PROFILE, JSON.stringify(data.profile));
            }
            if (data.settings) {
                localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(data.settings));
            }
            if (data.workouts) {
                localStorage.setItem(this.KEYS.WORKOUTS, JSON.stringify(data.workouts));
            }
            if (data.programs) {
                localStorage.setItem(this.KEYS.PROGRAMS, JSON.stringify(data.programs));
            }
            if (data.activeProgram) {
                localStorage.setItem(this.KEYS.ACTIVE_PROGRAM, JSON.stringify(data.activeProgram));
            }
            if (data.measurements) {
                localStorage.setItem(this.KEYS.MEASUREMENTS, JSON.stringify(data.measurements));
            }
            if (data.personalRecords) {
                localStorage.setItem(this.KEYS.PERSONAL_RECORDS, JSON.stringify(data.personalRecords));
            }
            if (data.streak) {
                localStorage.setItem(this.KEYS.STREAK, JSON.stringify(data.streak));
            }

            return true;
        } catch (e) {
            console.error('Import error:', e);
            return false;
        }
    },

    clearAllData() {
        Object.values(this.KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
    },

    /**
     * Clear only progress data (workouts, PRs, streak, cycle history)
     * Keeps profile, settings, programs, active program, measurements
     */
    clearProgressData() {
        localStorage.removeItem(this.KEYS.WORKOUTS);
        localStorage.removeItem(this.KEYS.PERSONAL_RECORDS);
        localStorage.removeItem(this.KEYS.STREAK);
        localStorage.removeItem(this.KEYS.CYCLE_HISTORY);
        localStorage.removeItem(this.KEYS.CONDITIONING);

        // Reset cycle in active program but keep the program
        const program = this.getActiveProgram();
        if (program?.metadata?.cycle) {
            program.metadata.cycle.currentWeek = 1;
            program.metadata.cycle.startDate = new Date().toISOString();
            program.metadata.cycle.isDeloadActive = false;
            this.setActiveProgram(program);
        }
    },

    // ========================================
    // CONDITIONING SESSIONS
    // ========================================

    /**
     * Get all conditioning sessions
     */
    getConditioningSessions() {
        const data = localStorage.getItem(this.KEYS.CONDITIONING);
        return data ? JSON.parse(data) : [];
    },

    /**
     * Save a conditioning session
     */
    saveConditioningSession(session) {
        const sessions = this.getConditioningSessions();
        session.id = Date.now();
        session.date = new Date().toISOString();
        sessions.unshift(session);
        localStorage.setItem(this.KEYS.CONDITIONING, JSON.stringify(sessions));
        return session;
    },

    /**
     * Get conditioning sessions from this week
     */
    getConditioningThisWeek() {
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
        startOfWeek.setHours(0, 0, 0, 0);

        const sessions = this.getConditioningSessions();
        return sessions.filter(s => new Date(s.date) >= startOfWeek);
    },

    /**
     * Get conditioning sessions in current cycle
     */
    getConditioningInCycle() {
        const cycleInfo = this.getCycleInfo();
        if (!cycleInfo) return [];

        const cycleStart = new Date(cycleInfo.startDate);
        const sessions = this.getConditioningSessions();
        return sessions.filter(s => new Date(s.date) >= cycleStart);
    },

    /**
     * Get conditioning statistics
     */
    getConditioningStatistics() {
        const sessions = this.getConditioningSessions();
        const thisWeek = this.getConditioningThisWeek();

        if (sessions.length === 0) {
            return {
                totalSessions: 0,
                totalDuration: 0,
                totalCalories: 0,
                hiitCount: 0,
                lissCount: 0,
                weekSessions: 0,
                weekDuration: 0,
                weekCalories: 0,
                avgDurationPerSession: 0
            };
        }

        const totalDuration = sessions.reduce((sum, s) => sum + (s.actualDuration || s.plannedDuration || 0), 0);
        const totalCalories = sessions.reduce((sum, s) => sum + (s.manualCalories || s.estimatedCalories || 0), 0);
        const hiitCount = sessions.filter(s => s.type === 'HIIT').length;
        const lissCount = sessions.filter(s => s.type === 'LISS').length;

        const weekDuration = thisWeek.reduce((sum, s) => sum + (s.actualDuration || s.plannedDuration || 0), 0);
        const weekCalories = thisWeek.reduce((sum, s) => sum + (s.manualCalories || s.estimatedCalories || 0), 0);

        return {
            totalSessions: sessions.length,
            totalDuration: Math.round(totalDuration / 60), // in minuti
            totalCalories,
            hiitCount,
            lissCount,
            weekSessions: thisWeek.length,
            weekDuration: Math.round(weekDuration / 60),
            weekCalories,
            avgDurationPerSession: Math.round(totalDuration / sessions.length / 60)
        };
    },

    /**
     * Delete a conditioning session
     */
    deleteConditioningSession(id) {
        let sessions = this.getConditioningSessions();
        sessions = sessions.filter(s => s.id !== id);
        localStorage.setItem(this.KEYS.CONDITIONING, JSON.stringify(sessions));
    },

    /**
     * Get recent conditioning sessions
     */
    getRecentConditioningSessions(limit = 5) {
        const sessions = this.getConditioningSessions();
        return sessions.slice(0, limit);
    }
};
