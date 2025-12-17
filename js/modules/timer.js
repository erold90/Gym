/**
 * GymTracker Pro - Timer Module
 * Handles rest timers and workout duration tracking
 */

const Timer = {
    // State
    restTimer: null,
    restTimeRemaining: 0,
    restTimeTotal: 0,
    workoutTimer: null,
    workoutStartTime: null,
    workoutElapsed: 0,
    callbacks: {
        onRestTick: null,
        onRestComplete: null,
        onWorkoutTick: null
    },

    // Audio context for sounds
    audioContext: null,

    // ========================================
    // REST TIMER
    // ========================================

    startRestTimer(seconds, onTick, onComplete) {
        this.stopRestTimer();

        this.restTimeTotal = seconds;
        this.restTimeRemaining = seconds;
        this.callbacks.onRestTick = onTick;
        this.callbacks.onRestComplete = onComplete;

        // Initial tick
        if (onTick) onTick(this.restTimeRemaining, this.restTimeTotal);

        this.restTimer = setInterval(() => {
            this.restTimeRemaining--;

            if (this.callbacks.onRestTick) {
                this.callbacks.onRestTick(this.restTimeRemaining, this.restTimeTotal);
            }

            // Warning beeps at 5, 4, 3, 2, 1
            if (this.restTimeRemaining <= 5 && this.restTimeRemaining > 0) {
                this.playBeep(200, 0.1);
            }

            if (this.restTimeRemaining <= 0) {
                this.stopRestTimer();
                this.playCompletionSound();
                this.vibrate();

                if (this.callbacks.onRestComplete) {
                    this.callbacks.onRestComplete();
                }
            }
        }, 1000);
    },

    stopRestTimer() {
        if (this.restTimer) {
            clearInterval(this.restTimer);
            this.restTimer = null;
        }
        this.restTimeRemaining = 0;
    },

    adjustRestTime(delta) {
        this.restTimeRemaining = Math.max(0, this.restTimeRemaining + delta);
        this.restTimeTotal = Math.max(this.restTimeTotal, this.restTimeRemaining);

        if (this.callbacks.onRestTick) {
            this.callbacks.onRestTick(this.restTimeRemaining, this.restTimeTotal);
        }
    },

    skipRest() {
        this.stopRestTimer();
        if (this.callbacks.onRestComplete) {
            this.callbacks.onRestComplete();
        }
    },

    // ========================================
    // WORKOUT TIMER
    // ========================================

    startWorkoutTimer(onTick) {
        this.stopWorkoutTimer();

        this.workoutStartTime = Date.now();
        this.workoutElapsed = 0;
        this.callbacks.onWorkoutTick = onTick;

        // Initial tick
        if (onTick) onTick(this.formatTime(0));

        this.workoutTimer = setInterval(() => {
            this.workoutElapsed = Math.floor((Date.now() - this.workoutStartTime) / 1000);

            if (this.callbacks.onWorkoutTick) {
                this.callbacks.onWorkoutTick(this.formatTime(this.workoutElapsed));
            }
        }, 1000);
    },

    stopWorkoutTimer() {
        if (this.workoutTimer) {
            clearInterval(this.workoutTimer);
            this.workoutTimer = null;
        }
        return this.workoutElapsed;
    },

    getWorkoutDuration() {
        return this.workoutElapsed;
    },

    // ========================================
    // SOUND & VIBRATION
    // ========================================

    initAudio() {
        if (!this.audioContext) {
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                console.log('Web Audio API not supported');
            }
        }
        return this.audioContext;
    },

    playBeep(frequency = 440, duration = 0.1) {
        const settings = Storage.getSettings();
        if (settings.restSound === 'none') return;

        const ctx = this.initAudio();
        if (!ctx) return;

        try {
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + duration);
        } catch (e) {
            console.log('Error playing beep:', e);
        }
    },

    playCompletionSound() {
        const settings = Storage.getSettings();
        if (settings.restSound === 'none') return;

        if (settings.restSound === 'bell') {
            // Play bell-like sound
            this.playBeep(880, 0.3);
            setTimeout(() => this.playBeep(1100, 0.2), 100);
        } else {
            // Default beep
            this.playBeep(880, 0.2);
            setTimeout(() => this.playBeep(880, 0.2), 200);
            setTimeout(() => this.playBeep(1320, 0.3), 400);
        }
    },

    vibrate() {
        const settings = Storage.getSettings();
        if (!settings.vibration) return;

        if ('vibrate' in navigator) {
            navigator.vibrate([200, 100, 200]);
        }
    },

    // ========================================
    // FORMATTING
    // ========================================

    formatTime(totalSeconds) {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        const pad = (n) => n.toString().padStart(2, '0');

        return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    },

    formatRestTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;

        if (minutes > 0) {
            return `${minutes}:${secs.toString().padStart(2, '0')}`;
        }
        return seconds.toString();
    }
};
