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
        STREAK: 'gymtracker_streak'
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
    // CYCLE TRACKING
    // ========================================

    // Get cycle progress information
    getCycleProgress() {
        const program = this.getActiveProgram();
        if (!program?.cycle?.startDate) {
            return null;
        }

        const cycle = program.cycle;
        const startDate = new Date(cycle.startDate);
        const now = new Date();

        // Calculate days since start
        const diffTime = now - startDate;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        // Calculate current week (1-indexed)
        const currentWeek = Math.min(
            Math.floor(diffDays / 7) + 1,
            cycle.totalWeeks
        );

        // Calculate percentage complete
        const percentComplete = Math.min(
            Math.round((currentWeek / cycle.totalWeeks) * 100),
            100
        );

        // Check if cycle is completed
        const isCompleted = currentWeek > cycle.totalWeeks || diffDays >= cycle.totalWeeks * 7;

        // Days remaining
        const totalDays = cycle.totalWeeks * 7;
        const daysRemaining = Math.max(0, totalDays - diffDays);

        // Get current mesocycle
        const currentMesocycle = this.getCurrentMesocycle(cycle, currentWeek);

        // Check if deload week
        const isDeloadWeek = cycle.deloadWeeks?.includes(currentWeek) || false;

        // Next deload week
        const nextDeload = cycle.deloadWeeks?.find(w => w > currentWeek) || null;
        const weeksUntilDeload = nextDeload ? nextDeload - currentWeek : null;

        return {
            currentWeek,
            totalWeeks: cycle.totalWeeks,
            percentComplete,
            isCompleted,
            daysRemaining,
            startDate: cycle.startDate,
            currentMesocycle,
            isDeloadWeek,
            nextDeloadWeek: nextDeload,
            weeksUntilDeload,
            mesocycles: cycle.mesocycles
        };
    },

    // Get current mesocycle for a week
    getCurrentMesocycle(cycle, weekNumber) {
        if (!cycle?.mesocycles) return null;

        for (const meso of cycle.mesocycles) {
            if (meso.weeks.includes(weekNumber)) {
                return {
                    name: meso.name,
                    volumeMultiplier: meso.volumeMultiplier,
                    intensityFocus: meso.intensityFocus,
                    isDeload: meso.isDeload,
                    weeksInMeso: meso.weeks,
                    weekOfMeso: meso.weeks.indexOf(weekNumber) + 1,
                    totalWeeksInMeso: meso.weeks.length
                };
            }
        }
        return null;
    },

    // Get workouts done in current cycle
    getWorkoutsInCycle() {
        const program = this.getActiveProgram();
        if (!program?.cycle?.startDate) {
            return [];
        }

        const startDate = new Date(program.cycle.startDate);
        const workouts = this.getWorkouts();

        return workouts.filter(w => {
            const workoutDate = new Date(w.date);
            return workoutDate >= startDate;
        });
    },

    // Get workouts for a specific week in the cycle
    getWorkoutsForCycleWeek(weekNumber) {
        const program = this.getActiveProgram();
        if (!program?.cycle?.startDate) {
            return [];
        }

        const startDate = new Date(program.cycle.startDate);
        const weekStart = new Date(startDate);
        weekStart.setDate(weekStart.getDate() + (weekNumber - 1) * 7);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        return this.getWorkoutsInDateRange(weekStart, weekEnd);
    },

    // Update cycle start date (useful if user wants to restart)
    resetCycleStartDate() {
        const program = this.getActiveProgram();
        if (program?.cycle) {
            program.cycle.startDate = new Date().toISOString();
            program.cycle.status = 'active';
            this.setActiveProgram(program);
            return true;
        }
        return false;
    },

    // Mark cycle as completed
    completeCycle() {
        const program = this.getActiveProgram();
        if (program?.cycle) {
            program.cycle.status = 'completed';
            program.cycle.completedDate = new Date().toISOString();
            this.setActiveProgram(program);
            return true;
        }
        return false;
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

    updatePersonalRecords(workout) {
        const prs = this.getPersonalRecords();

        if (!workout.exercises) return;

        workout.exercises.forEach(exercise => {
            if (!exercise.sets) return;

            exercise.sets.forEach(set => {
                if (!set.weight || !set.reps || !set.completed) return;

                const exerciseId = exercise.exerciseId;
                const weight = parseFloat(set.weight);
                const reps = parseInt(set.reps);

                // Calculate estimated 1RM using Epley formula
                const e1rm = weight * (1 + reps / 30);

                if (!prs[exerciseId]) {
                    prs[exerciseId] = {
                        maxWeight: 0,
                        maxReps: 0,
                        maxVolume: 0,
                        estimated1RM: 0,
                        history: []
                    };
                }

                let updated = false;

                // Check for new max weight
                if (weight > prs[exerciseId].maxWeight) {
                    prs[exerciseId].maxWeight = weight;
                    prs[exerciseId].maxWeightReps = reps;
                    prs[exerciseId].maxWeightDate = workout.date;
                    updated = true;
                }

                // Check for new max reps (with at least some weight)
                if (weight >= prs[exerciseId].maxWeight * 0.5 && reps > prs[exerciseId].maxReps) {
                    prs[exerciseId].maxReps = reps;
                    prs[exerciseId].maxRepsWeight = weight;
                    prs[exerciseId].maxRepsDate = workout.date;
                    updated = true;
                }

                // Check for new estimated 1RM
                if (e1rm > prs[exerciseId].estimated1RM) {
                    prs[exerciseId].estimated1RM = Math.round(e1rm * 10) / 10;
                    prs[exerciseId].e1rmDate = workout.date;
                    updated = true;
                }

                // Add to history
                prs[exerciseId].history.push({
                    date: workout.date,
                    weight: weight,
                    reps: reps,
                    e1rm: Math.round(e1rm * 10) / 10
                });

                // Keep only last 50 entries per exercise
                if (prs[exerciseId].history.length > 50) {
                    prs[exerciseId].history = prs[exerciseId].history.slice(-50);
                }
            });
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

        // Check estimated 1RM
        const newE1RM = weight * (1 + reps / 30);
        if (newE1RM > current.estimated1RM) {
            return { isNewPR: true, type: 'e1rm', oldValue: current.estimated1RM, newValue: Math.round(newE1RM * 10) / 10 };
        }

        return { isNewPR: false };
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
    }
};
