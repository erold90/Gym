/**
 * GymTracker Pro - Timer Module
 * Riposo e transizione dei superset con UNA sola macchina a timestamp, durata dell'allenamento,
 * suoni, vibrazione, notifiche (solo in background), wake lock.
 *
 * Fonte di verità del riposo: restEndTime (orologio di parete), non un contatore. Se iOS
 * congela i timer JS in background, al ritorno il tempo è comunque esatto.
 */

const Timer = {
    // ---- Stato del riposo (riposo e transizione superset) ----
    restTimer: null,          // handle dell'intervallo: valorizzato finché il timer è vivo (compatibilità)
    restTimeRemaining: 0,
    restTimeTotal: 0,
    restEndTime: 0,           // timestamp (ms) di fine riposo
    restTotal: 0,             // secondi totali del riposo corrente
    restKind: 'rest',         // 'rest' | 'transition'
    restWarnFired: false,     // avviso -10 s già dato?
    restZeroFired: false,     // passaggio a 0 già segnalato?
    OVERTIME_MAX: 300,        // dopo lo 0 conta fino a +5:00, poi si ferma
    _gen: 0,                  // generazione del timer: protegge dai callback che ne avviano un altro
    _silentZero: false,       // ripreso dopo lo 0 (es. ricarica della pagina): niente segnali doppi
    _scheduledSources: [],    // toni programmati sul clock audio (cancellabili)
    _keepAlive: null,         // <audio> muto che tiene viva l'app in background (solo se scelto)
    _keepAliveUrl: null,
    _visBound: false,
    _wakeLock: null,
    _wantWakeLock: false,

    // ---- Durata dell'allenamento ----
    workoutTimer: null,
    workoutStartTime: null,
    workoutElapsed: 0,

    callbacks: {
        onRestTick: null,      // (remaining, total) — remaining negativo in overtime
        onRestZero: null,      // una volta, quando il riposo tocca lo 0
        onRestStop: null,      // (reason) 'stopped' | 'overtime' | 'replaced'
        onRestComplete: null,  // compatibilità v1.25: chiamato da skipRest()
        onWorkoutTick: null
    },

    audioContext: null,

    _settings() {
        try {
            return Storage.getSettings();
        } catch (e) {
            return { restSound: 'beep', vibration: true, notifications: false, keepAwake: true, backgroundAlerts: false };
        }
    },

    _call(name, ...args) {
        const fn = this.callbacks[name];
        if (typeof fn !== 'function') return;
        try { fn(...args); } catch (e) { try { console.error('[Timer]', name, e); } catch (x) { /* no-op */ } }
    },

    // Secondi interi: per eccesso prima dello 0 (si vede "1" fino all'ultimo), per difetto dopo
    _remainingFrom(end, now = Date.now()) {
        const ms = end - now;
        if (ms > 0) return Math.ceil(ms / 1000);
        return -Math.floor(-ms / 1000) || 0;
    },

    // ========================================
    // RIPOSO / TRANSIZIONE (API v1.26)
    // ========================================

    /**
     * Avvia il riposo (o la transizione di un superset).
     * @param {{seconds:number, kind?:'rest'|'transition', onTick?:Function, onZero?:Function,
     *          onStop?:Function, endTime?:number, total?:number}} opts
     *   endTime/total servono a riprendere un riposo dopo una ricarica della pagina.
     * @returns {{remaining, total, kind, endTime, overtime}|null}
     */
    startRest(opts = {}) {
        const { seconds = 0, kind = 'rest', onTick = null, onZero = null, onStop = null, endTime, total } = opts || {};
        if (this.restTimer) this._stopRestInternal('replaced');
        this._bindVisibility();

        const now = Date.now();
        let end = Number(endTime);
        if (!(end > 0)) end = now + Math.max(0, Number(seconds) || 0) * 1000;
        const remaining = this._remainingFrom(end, now);

        this._gen++;
        this.restEndTime = end;
        this.restTotal = Math.max(1, Math.round(Number(total) || Number(seconds) || remaining || 1));
        this.restTimeTotal = this.restTotal;
        this.restTimeRemaining = remaining;
        this.restKind = kind === 'transition' ? 'transition' : 'rest';
        this.restWarnFired = remaining <= 10;   // niente avviso separato se il riposo è già corto
        this.restZeroFired = false;
        this._silentZero = remaining <= 0;
        this.callbacks.onRestTick = onTick;
        this.callbacks.onRestZero = onZero;
        this.callbacks.onRestStop = onStop;

        this.initAudio();
        this.startKeepAlive();      // solo se l'utente ha scelto gli avvisi in background
        this.scheduleRestCues();    // toni -10 s e 0 sul clock audio

        // 250 ms: barra fluida e rilevazione pronta del passaggio a 0
        this.restTimer = setInterval(() => this._restTick(), 250);
        this._restTick();
        return this.getRestState();
    },

    _restTick() {
        if (!this.restTimer) return;
        const gen = this._gen;
        const now = Date.now();
        const remaining = this._remainingFrom(this.restEndTime, now);
        this.restTimeRemaining = remaining;

        // Avviso a -10 s: vibrazione + notifica (il tono è già programmato sul clock audio)
        if (!this.restWarnFired && remaining <= 10 && remaining > 0) {
            this.restWarnFired = true;
            this.vibrate([120, 60, 120]);
            this.notify('Quasi pronto', '10 secondi');
        }

        // Passaggio a 0: segnali una volta, poi si continua a contare (overtime)
        if (remaining <= 0 && !this.restZeroFired) {
            this.restZeroFired = true;
            if (!this._silentZero) {
                this.vibrate([200, 100, 200]);
                this.notify(this.restKind === 'transition' ? 'Cambio esercizio' : 'Riposo finito', 'Vai con la prossima serie');
            }
            this._silentZero = false;
            this._call('onRestZero');
            if (gen !== this._gen || !this.restTimer) return;   // il callback ha fermato o riavviato il timer
        }

        this._call('onRestTick', remaining, this.restTotal);
        if (gen !== this._gen || !this.restTimer) return;

        // Tetto all'overtime: a +5:00 si ferma da solo (l'interfaccia mostra "Pronto")
        if (this.restEndTime - now <= -this.OVERTIME_MAX * 1000) this._stopRestInternal('overtime');
    },

    /** ±secondi al riposo in corso (funziona anche in overtime, finché il timer è vivo). */
    adjustRest(delta) {
        if (!this.restTimer) return null;
        this.restEndTime += (Number(delta) || 0) * 1000;
        const remaining = this._remainingFrom(this.restEndTime);
        if (remaining > 10) this.restWarnFired = false;  // ri-arma l'avviso se torni sopra i 10 s
        if (remaining > 0) this.restZeroFired = false;
        this._silentZero = false;
        this.restTotal = Math.max(this.restTotal, remaining);
        this.restTimeTotal = this.restTotal;
        this.scheduleRestCues();
        this._restTick();
        return this.getRestState();
    },

    /** Ferma il riposo (Salta, serie successiva, fine allenamento). */
    stopRest() {
        this._stopRestInternal('stopped');
    },

    isRestRunning() {
        return !!this.restTimer;
    },

    /** @returns {{remaining, total, kind, endTime, overtime}|null} */
    getRestState() {
        if (!this.restTimer) return null;
        const remaining = this._remainingFrom(this.restEndTime);
        return { remaining, total: this.restTotal, kind: this.restKind, endTime: this.restEndTime, overtime: remaining < 0 };
    },

    _stopRestInternal(reason) {
        const wasRunning = !!this.restTimer;
        if (this.restTimer) {
            clearInterval(this.restTimer);
            this.restTimer = null;
        }
        this._gen++;
        this.cancelScheduledCues();
        this.stopKeepAlive();
        this.restTimeRemaining = 0;
        if (wasRunning) {
            const onStop = this.callbacks.onRestStop;
            this.callbacks.onRestStop = null;
            if (typeof onStop === 'function') {
                try { onStop(reason); } catch (e) { try { console.error('[Timer] onStop', e); } catch (x) { /* no-op */ } }
            }
        }
    },

    /** Ferma tutto: riposo, durata, keep-alive, wake lock (annulla/fine allenamento). */
    stopAll() {
        this.stopRest();
        this.stopWorkoutTimer();
        this.keepScreenOn(false);
    },

    // ========================================
    // RIPOSO — nomi della v1.25 (compatibilità)
    // ========================================

    startRestTimer(seconds, onTick, onZero) {
        return this.startRest({ seconds, kind: 'rest', onTick, onZero });
    },

    stopRestTimer() {
        this.stopRest();
    },

    adjustRestTime(delta) {
        return this.adjustRest(delta);
    },

    skipRest() {
        this.stopRest();
        this._call('onRestComplete');
    },

    // Ri-calcola al rientro in primo piano: display esatto, toni ri-programmati, wake lock ripreso
    _bindVisibility() {
        if (this._visBound || typeof document === 'undefined' || !document.addEventListener) return;
        this._visBound = true;
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState !== 'visible') return;
            if (this.audioContext && this.audioContext.state === 'suspended') {
                try { this.audioContext.resume().catch(() => {}); } catch (e) { /* no-op */ }
            }
            if (this.restTimer) {
                this.scheduleRestCues();
                this._restTick();
            }
            if (this.workoutTimer) this._workoutTick();
            if (this._wantWakeLock) this._acquireWakeLock();
        });
    },

    // ========================================
    // SUONI
    // ========================================

    // Toni per tipo di suono: 'beep' (bip elettronici) o 'bell' (campana, armonica e coda lunga)
    _cueTones(sound) {
        if (sound === 'bell') {
            return {
                warn: [
                    { at: 0, freq: 1046.5, dur: 0.7, gain: 0.22 },
                    { at: 0, freq: 2637, dur: 0.35, gain: 0.06 }
                ],
                zero: [
                    { at: 0, freq: 1318.5, dur: 1.3, gain: 0.28 },
                    { at: 0, freq: 3322, dur: 0.5, gain: 0.07 },
                    { at: 0.4, freq: 1046.5, dur: 1.6, gain: 0.26 },
                    { at: 0.4, freq: 2637, dur: 0.6, gain: 0.06 }
                ]
            };
        }
        return {
            warn: [{ at: 0, freq: 660, dur: 0.15, gain: 0.3 }],
            zero: [
                { at: 0, freq: 880, dur: 0.18, gain: 0.3 },
                { at: 0.22, freq: 880, dur: 0.18, gain: 0.3 },
                { at: 0.44, freq: 1320, dur: 0.28, gain: 0.3 }
            ]
        };
    },

    // ---- Toni programmati sul clock audio (rispettano restSound: beep | bell | none) ----
    scheduleRestCues() {
        this.cancelScheduledCues();
        const sound = this._settings().restSound;
        if (sound === 'none') return;
        const ctx = this.initAudio();
        if (!ctx) return;
        if (ctx.state === 'suspended') { try { ctx.resume().catch(() => {}); } catch (e) { /* no-op */ } }

        const tones = this._cueTones(sound);
        const secsLeft = (this.restEndTime - Date.now()) / 1000;
        if (secsLeft > 10 && this.restTotal > 10) {
            tones.warn.forEach(t => this._scheduleTone(ctx.currentTime + (secsLeft - 10) + t.at, t.freq, t.dur, t.gain));
        }
        if (secsLeft > 0) {
            tones.zero.forEach(t => this._scheduleTone(ctx.currentTime + secsLeft + t.at, t.freq, t.dur, t.gain));
        }
    },

    _scheduleTone(atTime, freq, dur, peak = 0.3) {
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
            g.gain.exponentialRampToValueAtTime(peak, atTime + 0.01);
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

    _playCue(which) {
        const sound = this._settings().restSound;
        if (sound === 'none') return;
        const ctx = this.initAudio();
        if (!ctx) return;
        if (ctx.state === 'suspended') { try { ctx.resume().catch(() => {}); } catch (e) { /* no-op */ } }
        (this._cueTones(sound)[which] || []).forEach(t => this._scheduleTone(ctx.currentTime + 0.02 + t.at, t.freq, t.dur, t.gain));
    },

    // ---- Keep-alive: audio muto in loop, SOLO se l'utente ha scelto gli avvisi in background ----
    startKeepAlive() {
        if (this._settings().backgroundAlerts !== true) return false;
        if (typeof Audio === 'undefined') return false;
        try {
            this._setAmbientSession();
            if (!this._keepAliveUrl) this._keepAliveUrl = this._makeSilentWavUrl();
            if (!this._keepAlive) {
                this._keepAlive = new Audio(this._keepAliveUrl);
                this._keepAlive.loop = true;
                this._keepAlive.volume = 0;
                if (this._keepAlive.setAttribute) this._keepAlive.setAttribute('playsinline', '');
            }
            const p = this._keepAlive.play();
            if (p && p.catch) p.catch(() => {});
            return true;
        } catch (e) {
            return false;
        }
    },

    stopKeepAlive() {
        try {
            if (this._keepAlive) { this._keepAlive.pause(); this._keepAlive.currentTime = 0; }
        } catch (e) { /* no-op */ }
    },

    _makeSilentWavUrl() {
        const sr = 8000, n = sr; // 1 s mono 8-bit
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

    // I suoni dell'app si mescolano alla musica (Spotify/Apple Music non si fermano)
    _setAmbientSession() {
        try {
            const nav = typeof navigator !== 'undefined' ? navigator : null;
            if (nav && nav.audioSession && nav.audioSession.type !== 'ambient') nav.audioSession.type = 'ambient';
        } catch (e) { /* no-op */ }
    },

    // ========================================
    // NOTIFICHE (mai chieste in automatico, solo con l'app in background)
    // ========================================

    _hasNotification() {
        return typeof globalThis !== 'undefined' && typeof globalThis.Notification !== 'undefined';
    },

    /**
     * Chiede il permesso: da chiamare SOLO da un gesto dell'utente (interruttore nelle impostazioni).
     * @returns {Promise<'granted'|'denied'|'default'|'unsupported'>}
     */
    requestNotificationPermission() {
        if (!this._hasNotification()) return Promise.resolve('unsupported');
        const N = globalThis.Notification;
        if (N.permission === 'granted' || N.permission === 'denied') return Promise.resolve(N.permission);
        return new Promise(resolve => {
            try {
                const r = N.requestPermission(p => resolve(p));   // vecchio Safari: callback
                if (r && typeof r.then === 'function') r.then(resolve, () => resolve('default'));
            } catch (e) {
                resolve('default');
            }
        });
    },

    getNotificationPermission() {
        return this._hasNotification() ? globalThis.Notification.permission : 'unsupported';
    },

    // Compatibilità v1.25: NON chiede più il permesso (lo fa solo l'interruttore delle impostazioni)
    ensureNotifyPermission() {
        return this.getNotificationPermission();
    },

    notify(title, body) {
        try {
            if (this._settings().notifications !== true) return false;
            if (typeof document !== 'undefined' && document.visibilityState !== 'hidden') return false;
            if (!this._hasNotification() || globalThis.Notification.permission !== 'granted') return false;
            const opts = { body, tag: 'gym-rest', renotify: true, silent: false };
            const fallback = () => { try { new globalThis.Notification(title, opts); } catch (e) { /* no-op */ } };
            const sw = typeof navigator !== 'undefined' ? navigator.serviceWorker : null;
            if (sw && typeof sw.getRegistration === 'function') {
                sw.getRegistration().then(reg => {
                    if (reg && reg.showNotification) return reg.showNotification(title, opts);
                    fallback();
                }).catch(fallback);
            } else {
                fallback();
            }
            return true;
        } catch (e) {
            return false;
        }
    },

    // ========================================
    // WAKE LOCK (schermo acceso durante la sessione)
    // ========================================

    /**
     * Tiene lo schermo acceso (se settings.keepAwake). Riacquisito da solo al ritorno in primo piano.
     * @returns {Promise<boolean>}
     */
    keepScreenOn(on) {
        this._wantWakeLock = !!on;
        this._bindVisibility();
        if (!on || this._settings().keepAwake === false) {
            return this._releaseWakeLock().then(() => false);
        }
        return this._acquireWakeLock();
    },

    _acquireWakeLock() {
        if (this._wakeLock) return Promise.resolve(true);
        const nav = typeof navigator !== 'undefined' ? navigator : null;
        if (!nav || !nav.wakeLock || typeof nav.wakeLock.request !== 'function') return Promise.resolve(false);
        if (typeof document !== 'undefined' && document.visibilityState && document.visibilityState !== 'visible') return Promise.resolve(false);
        if (this._wakePending) return this._wakePending;
        this._wakePending = Promise.resolve()
            .then(() => nav.wakeLock.request('screen'))
            .then(lock => {
                this._wakePending = null;
                if (!this._wantWakeLock) {
                    try { lock.release(); } catch (e) { /* no-op */ }
                    return false;
                }
                this._wakeLock = lock;
                if (lock && lock.addEventListener) {
                    lock.addEventListener('release', () => { if (this._wakeLock === lock) this._wakeLock = null; });
                }
                return true;
            })
            .catch(() => { this._wakePending = null; return false; });
        return this._wakePending;
    },

    _releaseWakeLock() {
        const lock = this._wakeLock;
        this._wakeLock = null;
        if (!lock) return Promise.resolve();
        try {
            return Promise.resolve(lock.release()).catch(() => {});
        } catch (e) {
            return Promise.resolve();
        }
    },

    isScreenKeptOn() {
        return !!this._wakeLock;
    },

    // ========================================
    // WORKOUT TIMER
    // ========================================

    /**
     * @param {Function} onTick riceve 'hh:mm:ss'
     * @param {number|Date} [startTime] per riprendere una sessione salvata
     */
    startWorkoutTimer(onTick, startTime) {
        this.stopWorkoutTimer();
        this._bindVisibility();

        const st = startTime instanceof Date ? startTime.getTime() : Number(startTime);
        this.workoutStartTime = (st > 0 && st <= Date.now()) ? st : Date.now();
        this.callbacks.onWorkoutTick = onTick;
        this._workoutTick();
        this.workoutTimer = setInterval(() => this._workoutTick(), 1000);
    },

    _workoutTick() {
        if (!this.workoutStartTime) return;
        this.workoutElapsed = Math.max(0, Math.floor((Date.now() - this.workoutStartTime) / 1000));
        this._call('onWorkoutTick', this.formatTime(this.workoutElapsed));
    },

    stopWorkoutTimer() {
        if (this.workoutTimer) {
            clearInterval(this.workoutTimer);
            this.workoutTimer = null;
            if (this.workoutStartTime) {
                this.workoutElapsed = Math.max(0, Math.floor((Date.now() - this.workoutStartTime) / 1000));
            }
        }
        return this.workoutElapsed;
    },

    getWorkoutDuration() {
        if (this.workoutTimer && this.workoutStartTime) {
            this.workoutElapsed = Math.max(0, Math.floor((Date.now() - this.workoutStartTime) / 1000));
        }
        return this.workoutElapsed;
    },

    // ========================================
    // SOUND & VIBRATION
    // ========================================

    initAudio() {
        if (!this.audioContext) {
            try {
                this._setAmbientSession();
                const AC = (typeof window !== 'undefined') && (window.AudioContext || window.webkitAudioContext);
                if (AC) this.audioContext = new AC();
            } catch (e) {
                this.audioContext = null;
            }
        }
        return this.audioContext;
    },

    playBeep(frequency = 440, duration = 0.1) {
        if (this._settings().restSound === 'none') return;
        const ctx = this.initAudio();
        if (!ctx) return;
        this._scheduleTone(ctx.currentTime + 0.01, frequency, duration, 0.3);
    },

    /** Suono di festa (PR): segue l'impostazione beep/bell/none. */
    playCompletionSound() {
        this._playCue('zero');
    },

    canVibrate() {
        return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
    },

    // iPhone non ha navigator.vibrate: nessun errore, restano suono e notifica
    vibrate(pattern = [200, 100, 200]) {
        if (this._settings().vibration === false) return false;
        if (!this.canVibrate()) return false;
        try { return navigator.vibrate(pattern); } catch (e) { return false; }
    },

    // ========================================
    // FORMATTING
    // ========================================

    formatTime(totalSeconds) {
        totalSeconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        const pad = (n) => n.toString().padStart(2, '0');
        return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    },

    /** 75 → '1:15', 9 → '9', -15 → '+15' (overtime). */
    formatRestTime(seconds) {
        seconds = Math.round(Number(seconds) || 0);
        const over = seconds < 0;
        const s = Math.abs(seconds);
        const minutes = Math.floor(s / 60);
        const secs = s % 60;
        const txt = minutes > 0 ? `${minutes}:${secs.toString().padStart(2, '0')}` : String(secs);
        return over ? `+${txt}` : txt;
    }
};
