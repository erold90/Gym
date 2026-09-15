/**
 * GymTracker Pro - Timer Module
 * Handles rest timers and workout duration tracking
 */

const Timer = {
    // State
    restTimer: null,
    restTimeRemaining: 0,
    restTimeTotal: 0,
    restEndTime: 0,          // timestamp (ms) di fine riposo: la fonte di verità, non un contatore
    restTotal: 0,            // secondi totali del riposo corrente
    restWarnFired: false,    // avviso -10s già dato?
    restZeroFired: false,    // riposo arrivato a 0 già segnalato?
    _scheduledSources: [],   // oscillatori beep schedulati sul clock audio (cancellabili)
    _keepAlive: null,        // <audio> silenzioso che tiene viva l'app in background
    _keepAliveUrl: null,
    _visBound: false,        // listener visibilitychange agganciato?
    workoutTimer: null,
    workoutStartTime: null,
    workoutElapsed: 0,
    callbacks: {
        onRestTick: null,
        onRestComplete: null,  // chiamato SOLO su skip/teardown
        onRestZero: null,      // chiamato una volta quando il riposo tocca lo 0
        onWorkoutTick: null
    },

    // Audio context for sounds
    audioContext: null,

    // ========================================
    // REST TIMER
    // ========================================

    // Riposo a "orologio di parete": la fonte di verità è restEndTime, non un
    // contatore. Se metti l'app in background (WhatsApp/Spotify) e il sistema
    // congela i timer JS, al ritorno il tempo è comunque esatto. I beep a -10s
    // e a 0 sono schedulati sul clock audio, così suonano anche se il JS è
    // rallentato, finché l'AudioContext resta vivo (lo tiene su un audio muto).
    startRestTimer(seconds, onTick, onZero) {
        this.stopRestTimer();
        this._bindVisibility();

        this.restTotal = seconds;
        this.restTimeTotal = seconds;
        this.restEndTime = Date.now() + seconds * 1000;
        this.restTimeRemaining = seconds;
        this.restWarnFired = seconds <= 10;   // niente avviso separato se il riposo è già corto
        this.restZeroFired = false;
        this.callbacks.onRestTick = onTick;
        this.callbacks.onRestZero = onZero;

        this.startKeepAlive();        // tiene viva l'app in background
        this.scheduleRestCues();      // beep -10s e 0 sul clock audio
        this.ensureNotifyPermission(); // parte da un click (completeSet) -> permesso concesso

        if (onTick) onTick(seconds, seconds);

        // 250ms: barra fluida e rilevazione pronta del passaggio a 0
        this.restTimer = setInterval(() => this._restTick(), 250);
    },

    _restTick() {
        const remaining = Math.round((this.restEndTime - Date.now()) / 1000);
        this.restTimeRemaining = remaining;

        // Avviso a -10s: vibrazione + notifica (il beep è già schedulato sul clock audio)
        if (!this.restWarnFired && remaining <= 10 && remaining > 0) {
            this.restWarnFired = true;
            this.vibrate([120, 60, 120]);
            this.notify('Quasi pronto ⏱', 'Mancano 10 secondi al prossimo set');
        }

        if (this.callbacks.onRestTick) {
            this.callbacks.onRestTick(remaining, this.restTotal);
        }

        // Passaggio a 0: vibrazione + notifica, poi si continua a contare in
        // negativo (overtime) finché non parte il set successivo o si salta.
        if (remaining <= 0 && !this.restZeroFired) {
            this.restZeroFired = true;
            this.vibrate([200, 100, 200]);
            this.notify('Riposo finito 💪', 'Vai con il prossimo set');
            if (this.callbacks.onRestZero) this.callbacks.onRestZero();
        }

        // Tetto all'overtime: dopo 2 minuti oltre lo 0 si ferma da solo
        if (remaining <= -120) this.stopRestTimer();
    },

    stopRestTimer() {
        if (this.restTimer) {
            clearInterval(this.restTimer);
            this.restTimer = null;
        }
        this.cancelScheduledCues();
        this.stopKeepAlive();
        this.restTimeRemaining = 0;
    },

    adjustRestTime(delta) {
        if (!this.restTimer) return;
        this.restEndTime += delta * 1000;
        const remaining = Math.round((this.restEndTime - Date.now()) / 1000);
        if (remaining > 10) this.restWarnFired = false;  // ri-arma l'avviso se torni sopra i 10s
        if (remaining > 0) this.restZeroFired = false;
        this.restTotal = Math.max(this.restTotal, remaining);
        this.restTimeTotal = this.restTotal;
        this.scheduleRestCues();   // ri-schedula i beep sui nuovi tempi
        this._restTick();          // aggiorna subito la UI
    },

    skipRest() {
        this.stopRestTimer();
        if (this.callbacks.onRestComplete) {
            this.callbacks.onRestComplete();
        }
    },

    // Ri-calcola al rientro in primo piano: se i timer erano congelati, qui il
    // display torna esatto e, se il riposo è finito nel frattempo, lo segnala.
    _bindVisibility() {
        if (this._visBound) return;
        this._visBound = true;
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && this.restTimer) {
                if (this.audioContext && this.audioContext.state === 'suspended') {
                    this.audioContext.resume().catch(() => {});
                }
                this._restTick();
            }
        });
    },

    // ---- Beep schedulati sul clock audio (affidabili anche in background) ----
    scheduleRestCues() {
        this.cancelScheduledCues();
        const settings = Storage.getSettings();
        if (settings.restSound === 'none') return;
        const ctx = this.initAudio();
        if (!ctx) return;
        if (ctx.state === 'suspended') ctx.resume().catch(() => {});

        const secsLeft = (this.restEndTime - Date.now()) / 1000;
        // Avviso -10s: tono singolo
        if (secsLeft > 10) this._scheduleTone(ctx.currentTime + (secsLeft - 10), 660, 0.15);
        // Fine a 0: melodietta
        if (secsLeft > 0) {
            const t0 = ctx.currentTime + secsLeft;
            this._scheduleTone(t0, 880, 0.18);
            this._scheduleTone(t0 + 0.22, 880, 0.18);
            this._scheduleTone(t0 + 0.44, 1320, 0.28);
        }
    },

    _scheduleTone(atTime, freq, dur) {
        const ctx = this.audioContext;
        if (!ctx) return;
        try {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.connect(g);
            g.connect(ctx.destination);
            osc.frequency.value = freq;
            osc.type = 'sine';
            g.gain.setValueAtTime(0.0001, atTime);
            g.gain.exponentialRampToValueAtTime(0.3, atTime + 0.01);
            g.gain.exponentialRampToValueAtTime(0.0001, atTime + dur);
            osc.start(atTime);
            osc.stop(atTime + dur + 0.02);
            this._scheduledSources.push(osc);
            osc.onended = () => {
                const i = this._scheduledSources.indexOf(osc);
                if (i >= 0) this._scheduledSources.splice(i, 1);
            };
        } catch (e) { /* no-op */ }
    },

    cancelScheduledCues() {
        (this._scheduledSources || []).forEach(o => {
            try { o.stop(); o.disconnect(); } catch (e) { /* già fermo */ }
        });
        this._scheduledSources = [];
    },

    // ---- Keep-alive: audio muto in loop per non far congelare l'app ----
    startKeepAlive() {
        try {
            if (!this._keepAliveUrl) this._keepAliveUrl = this._makeSilentWavUrl();
            if (!this._keepAlive) {
                this._keepAlive = new Audio(this._keepAliveUrl);
                this._keepAlive.loop = true;
                this._keepAlive.volume = 0;
                this._keepAlive.setAttribute('playsinline', '');
            }
            const p = this._keepAlive.play();
            if (p && p.catch) p.catch(() => {});
        } catch (e) { /* no-op */ }
    },

    stopKeepAlive() {
        try {
            if (this._keepAlive) { this._keepAlive.pause(); this._keepAlive.currentTime = 0; }
        } catch (e) { /* no-op */ }
    },

    _makeSilentWavUrl() {
        const sr = 8000, n = sr; // 1s mono 8-bit
        const buf = new ArrayBuffer(44 + n);
        const dv = new DataView(buf);
        const w = (o, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i)); };
        w(0, 'RIFF'); dv.setUint32(4, 36 + n, true); w(8, 'WAVE'); w(12, 'fmt ');
        dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
        dv.setUint32(24, sr, true); dv.setUint32(28, sr, true); dv.setUint16(32, 1, true); dv.setUint16(34, 8, true);
        w(36, 'data'); dv.setUint32(40, n, true);
        for (let i = 0; i < n; i++) dv.setUint8(44 + i, 128); // 128 = silenzio (8-bit unsigned)
        return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
    },

    // ---- Notifiche di sistema (solo PWA installata su iOS 16.4+) ----
    ensureNotifyPermission() {
        try {
            const settings = Storage.getSettings();
            if (settings.notifications === false) return;
            if (!('Notification' in window)) return;
            if (Notification.permission === 'default') {
                const r = Notification.requestPermission();
                if (r && typeof r.catch === 'function') r.catch(() => {});
            }
        } catch (e) { /* no-op */ }
    },

    notify(title, body) {
        try {
            const settings = Storage.getSettings();
            if (settings.notifications === false) return;
            if (!('Notification' in window) || Notification.permission !== 'granted') return;
            const opts = { body, tag: 'gym-rest', renotify: true, silent: false };
            if (navigator.serviceWorker && navigator.serviceWorker.ready) {
                navigator.serviceWorker.ready.then(reg => reg.showNotification(title, opts)).catch(() => {
                    try { new Notification(title, opts); } catch (e) { /* no-op */ }
                });
            } else {
                new Notification(title, opts);
            }
        } catch (e) { /* no-op */ }
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

    vibrate(pattern = [200, 100, 200]) {
        const settings = Storage.getSettings();
        if (!settings.vibration) return;

        if ('vibrate' in navigator) {
            navigator.vibrate(pattern);
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
