/**
 * GymTracker 2.0 — area PROFILO (profilo + impostazioni in una pagina): dati, impostazioni,
 * backup (esporta/importa), simulazione.
 */

Object.assign(App, {
    // ========================================
    // GUSCIO DELL'AREA: markup della pagina, listener, ingresso nella pagina
    // ========================================

    // Pagina #profilo: profilo e impostazioni insieme (la v1 aveva due pagine)
    htmlProfilo() {
        const field = (id, label, input) => `<div class="field"><label for="${id}">${label}</label>${input}</div>`;
        const opts = (list, sel) => list.map(([v, t]) => `<option value="${v}"${v === sel ? ' selected' : ''}>${t}</option>`).join('');
        const eq = (value, label, icon, checked) => `
            <label class="chip chip--lg">
                <input type="checkbox" name="equipment" value="${value}"${checked ? ' checked' : ''}>
                ${icon ? this.ico(icon) : ''}${label}
            </label>`;
        const toggle = (id, title, sub = '', checked = false) => `
            <label class="row setting-toggle" for="${id}">
                <span class="row__body"><span class="row__title">${title}</span>${sub ? `<span class="row__sub">${sub}</span>` : ''}</span>
                <input type="checkbox" class="switch" id="${id}" role="switch"${checked ? ' checked' : ''}>
            </label>`;
        return `
            <header class="head"><h1>Profilo</h1></header>

            <form id="profile-form" class="section" novalidate>
                <section class="section" aria-labelledby="pf-personal">
                    <h2 class="cap" id="pf-personal">Dati personali</h2>
                    ${field('profile-name', 'Nome', '<input class="input" type="text" id="profile-name" autocomplete="given-name">')}
                    ${field('profile-gender', 'Sesso', `<select class="input" id="profile-gender">${opts([['', '—'], ['male', 'Uomo'], ['female', 'Donna']], '')}</select>`)}
                    ${field('profile-birthdate', 'Data di nascita', '<input class="input" type="date" id="profile-birthdate">')}
                    ${field('profile-height', 'Altezza (cm)', '<input class="input" type="number" id="profile-height" inputmode="numeric">')}
                    ${field('profile-weight', 'Peso (kg)', '<input class="input" type="number" step="0.1" id="profile-weight" inputmode="decimal">')}
                    ${field('profile-bodyfat', 'Grasso (%)', '<input class="input" type="number" step="0.1" id="profile-bodyfat" inputmode="decimal">')}
                </section>

                <section class="section" aria-labelledby="pf-exp">
                    <h2 class="cap" id="pf-exp">Esperienza</h2>
                    ${field('profile-level', 'Livello', `<select class="input" id="profile-level">${opts([['beginner', 'Principiante (0-1 anni)'], ['intermediate', 'Intermedio (1-3 anni)'], ['advanced', 'Avanzato (3-5 anni)'], ['expert', 'Esperto (5+ anni)']], 'beginner')}</select>`)}
                    ${field('profile-background', 'Provenienza', `<select class="input" id="profile-background">${opts([['none', 'Nessuna'], ['bodybuilding', 'Bodybuilding'], ['powerlifting', 'Powerlifting'], ['crossfit', 'CrossFit'], ['calisthenics', 'Calisthenics'], ['sport', 'Altro sport']], 'none')}</select>`)}
                </section>

                <section class="section" aria-labelledby="pf-goal">
                    <h2 class="cap" id="pf-goal">Obiettivi</h2>
                    ${field('profile-goal', 'Obiettivo', `<select class="input" id="profile-goal">${opts([['hypertrophy', 'Ipertrofia'], ['strength', 'Forza'], ['recomp', 'Ricomposizione'], ['endurance', 'Resistenza'], ['toning', 'Tonificazione']], 'hypertrophy')}</select>`)}
                    ${field('profile-target-weight', 'Peso obiettivo (kg)', '<input class="input" type="number" step="0.1" id="profile-target-weight" inputmode="decimal">')}
                    ${field('profile-target-bf', 'Grasso obiettivo (%)', '<input class="input" type="number" step="0.1" id="profile-target-bf" inputmode="decimal">')}
                </section>

                <section class="section" aria-labelledby="pf-time">
                    <h2 class="cap" id="pf-time">Disponibilità</h2>
                    ${field('profile-days', 'Giorni a settimana', `<select class="input" id="profile-days">${opts([['2', '2 giorni'], ['3', '3 giorni'], ['4', '4 giorni'], ['5', '5 giorni'], ['6', '6 giorni']], '3')}</select>`)}
                    ${field('profile-session-time', 'Durata', `<select class="input" id="profile-session-time">${opts([['45', '45 minuti'], ['60', '60 minuti'], ['75', '75 minuti'], ['90', '90 minuti']], '60')}</select>`)}
                </section>

                <section class="section" aria-labelledby="pf-eq">
                    <h2 class="cap" id="pf-eq">Attrezzatura</h2>
                    <div class="chips equipment-checkboxes" id="equipment-checkboxes">
                        ${eq('bilanciere', 'Bilanciere', 'barbell', true)}
                        ${eq('manubri', 'Manubri', 'dumbbell', true)}
                        ${eq('macchine', 'Macchine', 'machine', true)}
                        ${eq('cavi', 'Cavi', 'cable', true)}
                        ${eq('panca', 'Panca', 'bench', true)}
                        ${eq('sbarra', 'Sbarra trazioni', 'pullup', true)}
                        ${eq('parallele', 'Parallele', '', false)}
                        ${eq('accessori', 'Accessori', 'band', false)}
                    </div>
                </section>

                <button type="submit" class="btn btn--primary btn--xl btn--block">${this.ico('check')}Salva il profilo</button>
            </form>

            <section class="section" aria-labelledby="st-train">
                <h2 class="cap" id="st-train">Durante la seduta</h2>
                <div class="group">
                    <div class="row">
                        <label class="row__body" for="setting-rest-compound"><span class="row__title">Recupero esercizi multiarticolari (s)</span></label>
                        <input class="input" style="width: 96px" type="number" id="setting-rest-compound" value="120" min="30" max="300" step="15" inputmode="numeric">
                    </div>
                    <div class="row">
                        <label class="row__body" for="setting-rest-isolation"><span class="row__title">Recupero esercizi di isolamento (s)</span></label>
                        <input class="input" style="width: 96px" type="number" id="setting-rest-isolation" value="75" min="30" max="180" step="15" inputmode="numeric">
                    </div>
                    <div class="row">
                        <label class="row__body" for="setting-rest-sound"><span class="row__title">Suono a fine recupero</span></label>
                        <select class="input" style="width: 150px" id="setting-rest-sound">${opts([['beep', 'Beep'], ['bell', 'Campana'], ['none', 'Nessuno']], 'beep')}</select>
                    </div>
                    ${toggle('setting-vibration', 'Vibrazione', '', true)}
                    ${toggle('setting-keep-awake', 'Schermo sempre acceso', '', true)}
                    ${toggle('setting-notifications', 'Notifica a fine recupero')}
                    ${toggle('setting-background-alerts', 'Suono con app in background', 'Può interrompere la musica')}
                </div>
            </section>

            <section class="section" aria-labelledby="st-look">
                <h2 class="cap" id="st-look">Aspetto</h2>
                <div class="group">
                    <div class="row">
                        <label class="row__body" for="setting-theme"><span class="row__title">Tema</span></label>
                        <select class="input" style="width: 150px" id="setting-theme">${opts([['dark', 'Scuro'], ['light', 'Chiaro'], ['auto', 'Automatico']], 'dark')}</select>
                    </div>
                </div>
            </section>

            <section class="section" aria-labelledby="st-data">
                <h2 class="cap" id="st-data">Dati</h2>
                <div class="group backup">
                    <div class="backup__state storage-info" id="storage-info">
                        <span class="row__icon">${this.ico('shield')}</span>
                        <span class="row__body">
                            <span class="row__title storage-text" id="storage-text">Calcolo spazio…</span>
                            <span class="row__sub">I dati stanno solo su questo telefono</span>
                        </span>
                    </div>
                    <div class="storage-bar" aria-hidden="true"><div class="storage-used" id="storage-used-bar"></div></div>
                    <div class="backup__btns data-buttons">
                        <button type="button" class="btn btn--secondary" id="export-data-btn">${this.ico('download')}Esporta</button>
                        <button type="button" class="btn btn--secondary" id="import-data-btn">${this.ico('upload')}Importa</button>
                        <button type="button" class="btn btn--secondary" id="clear-cache-btn">${this.ico('cycle')}Aggiorna app</button>
                    </div>
                    <input type="file" id="import-file-input" accept=".json,application/json" hidden>
                </div>
            </section>

            <section class="section" aria-labelledby="st-test">
                <h2 class="cap" id="st-test">Prova</h2>
                <button type="button" class="btn btn--secondary btn--block" id="simulate-workout-btn">Simula una seduta (non salva)</button>
            </section>

            <section class="section danger-zone" aria-labelledby="st-danger">
                <h2 class="cap" id="st-danger">Cancellazione</h2>
                <div class="group">
                    <button type="button" class="row" id="clear-progress-btn">
                        <span class="row__icon">${this.ico('trash')}</span>
                        <span class="row__body"><span class="row__title">Cancella i progressi</span><span class="row__sub">Sedute, record e cicli. Profilo e scheda restano</span></span>
                    </button>
                    <button type="button" class="row" id="reset-data-btn">
                        <span class="row__icon">${this.ico('trash')}</span>
                        <span class="row__body"><span class="row__title btn--danger-text">Cancella tutti i dati</span><span class="row__sub">Non si torna indietro</span></span>
                    </button>
                </div>
            </section>

            <footer class="foot">
                <span>GymTracker <span class="num" id="app-version">${GT.esc(GT.APP_VERSION || '')}</span></span>
                <span>I dati restano su questo dispositivo</span>
            </footer>
        `;
    },

    bindProfilo() {
        const on = (id, ev, fn) => this._on(id, ev, fn);

        // Profile form
        on('profile-form', 'submit', (e) => {
            e.preventDefault();
            this.saveProfile();
        });

        // Impostazioni
        on('setting-theme', 'change', (e) => this.setTheme(e.target.value));
        ['setting-rest-compound', 'setting-rest-isolation', 'setting-rest-sound',
            'setting-vibration', 'setting-background-alerts'].forEach(id => {
            on(id, 'change', () => this.saveSettings());
        });
        on('setting-keep-awake', 'change', (e) => {
            this.saveSettings();
            if (this.activeWorkout || this.conditioningState.startedAt) this._setKeepAwake(e.target.checked);
        });
        on('setting-notifications', 'change', (e) => this.onNotificationsToggle(e.target));

        // Dati
        on('export-data-btn', 'click', () => this.exportData());
        on('import-data-btn', 'click', () => document.getElementById('import-file-input')?.click());
        on('import-file-input', 'change', (e) => {
            this.importData(e.target.files[0]);
            e.target.value = '';   // permette di riscegliere lo stesso file
        });
        on('reset-data-btn', 'click', () => {
            if (confirm('Cancellare TUTTI i dati? Profilo, schede, allenamenti e PR')) {
                Storage.clearAllData();
                location.reload();
            }
        });
        on('clear-progress-btn', 'click', () => {
            const n = Storage.getWorkouts().length;
            if (!confirm(`Cancellare i progressi? ${n} allenamenti, PR e cicli`)) return;
            Storage.clearProgressData();
            this.showNotification('Progressi cancellati', 'success');
            this._cycleSummaryDismissed = false;
            this.loadDashboard();
            this._safe(() => this.loadProgress());
            this._safe(() => this.initCharts());
            this.updateStorageUsage();
        });
        on('clear-cache-btn', 'click', async () => {
            if (!confirm('Svuotare la cache e ricaricare l\'app?')) return;
            try {
                if ('serviceWorker' in navigator) {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    for (const registration of registrations) await registration.unregister();
                }
                if ('caches' in window) {
                    const cacheNames = await caches.keys();
                    for (const cacheName of cacheNames) await caches.delete(cacheName);
                }
                location.reload();
            } catch (error) {
                console.error('Errore durante la pulizia della cache:', error);
                this.showNotification('Cache non svuotata: riprova', 'error');
            }
        });

        // Debug
        on('simulate-workout-btn', 'click', () => this.startSimulatedWorkout());
    },

    // Il form si ricarica a ogni apertura (E8); lo spazio occupato si ricalcola
    enterProfilo() {
        this._safe(() => this.loadProfile());
        this._safe(() => this.updateStorageUsage());
    },

    startSimulatedWorkout() {
        const fakeWorkout = {
            type: 'Simulazione',
            warmup: null,
            exercises: [
                { exerciseId: 'bench-press', name: 'Panca Piana (TEST)', sets: 3, reps: '8-12', rest: 90 },
                { exerciseId: 'lat-pulldown', name: 'Lat Machine (TEST)', sets: 3, reps: '10-12', rest: 60 }
            ]
        };
        if (this.activeWorkout) {
            this._promptActiveSession();
            return;
        }
        this.startWorkout(fakeWorkout, { isSimulation: true });
        this.showNotification('Simulazione: non si salva nulla', 'info');
    },

    // ========================================
    // PROFILE
    // ========================================

    // Il form si ricarica ogni volta che si apre la pagina (E8: il peso aggiunto in Progressi non va perso)
    loadProfile() {
        const p = Storage.getProfile();
        const set = (id, v) => {
            const el = document.getElementById(id);
            if (el) el.value = v ?? '';
        };

        set('profile-name', p.name);
        set('profile-gender', p.gender || '');
        set('profile-birthdate', p.birthdate);
        set('profile-height', p.height);
        set('profile-weight', p.weight);
        set('profile-bodyfat', p.bodyFat);
        set('profile-level', p.level || 'beginner');
        set('profile-background', p.background || 'none');
        set('profile-goal', p.goal || 'hypertrophy');
        set('profile-target-weight', p.targetWeight);
        set('profile-target-bf', p.targetBodyFat);
        set('profile-days', p.daysPerWeek || 3);
        set('profile-session-time', p.sessionTime || 60);

        const equipment = Array.isArray(p.equipment) ? p.equipment : [];
        document.querySelectorAll('#equipment-checkboxes input').forEach(cb => {
            cb.checked = equipment.includes(cb.value);
        });
    },

    saveProfile() {
        const val = (id) => document.getElementById(id)?.value ?? '';
        const num = (id) => {
            const v = GT.num(val(id));
            return Number.isFinite(v) && v > 0 ? v : null;
        };
        const equipment = [];
        document.querySelectorAll('#equipment-checkboxes input:checked').forEach(cb => equipment.push(cb.value));

        const profile = {
            ...Storage.getProfile(),
            name: val('profile-name').trim().slice(0, 40),
            gender: val('profile-gender'),
            birthdate: val('profile-birthdate'),
            height: num('profile-height'),
            weight: num('profile-weight'),
            bodyFat: num('profile-bodyfat'),
            level: val('profile-level') || 'beginner',
            background: val('profile-background') || 'none',
            goal: val('profile-goal') || 'hypertrophy',
            targetWeight: num('profile-target-weight'),
            targetBodyFat: num('profile-target-bf'),
            daysPerWeek: parseInt(val('profile-days')) || 3,
            sessionTime: parseInt(val('profile-session-time')) || 60,
            equipment
        };

        Storage.saveProfile(profile);
        this._ctxCache = this.activeWorkout ? {} : null;   // il peso corporeo entra nel corpo libero
        this.loadDashboard();
        this.showNotification('Profilo salvato', 'success');
    },

    // ========================================
    // SETTINGS
    // ========================================

    loadSettings() {
        const s = Storage.getSettings();
        const setVal = (id, v) => { const el = document.getElementById(id); if (el && v != null) el.value = v; };
        const setChecked = (id, v) => { const el = document.getElementById(id); if (el) el.checked = !!v; };

        setVal('setting-rest-compound', s.restTimeCompound);
        setVal('setting-rest-isolation', s.restTimeIsolation);
        setVal('setting-rest-sound', s.restSound || 'beep');
        setChecked('setting-vibration', s.vibration !== false);
        setVal('setting-theme', s.theme || 'dark');
        const notifGranted = typeof Notification !== 'undefined' && Notification.permission === 'granted';
        setChecked('setting-notifications', !!s.notifications && notifGranted);
        setChecked('setting-keep-awake', s.keepAwake !== false);
        setChecked('setting-background-alerts', !!s.backgroundAlerts);

        this._setText('app-version', GT.APP_VERSION);
        this.updateStorageUsage();
    },

    updateStorageUsage() {
        let totalSize = 0;
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                totalSize += ((localStorage.getItem(key) || '').length + key.length) * 2;   // UTF-16
            }
        } catch (e) {
            return;
        }

        const sizeKB = totalSize / 1024;
        const sizeMB = sizeKB / 1024;
        const maxMB = 5;
        const percentUsed = Math.min((sizeMB / maxMB) * 100, 100);

        const storageBar = document.getElementById('storage-used-bar');
        if (storageBar) storageBar.style.width = `${Math.max(percentUsed, 2)}%`;
        this._setText('storage-text', sizeMB >= 1
            ? `${sizeMB.toFixed(2).replace('.', ',')} MB su ~5 MB`
            : `${Math.round(sizeKB)} KB su ~5 MB`);
    },

    // Salva solo i campi presenti nella pagina; il resto delle impostazioni resta com'è
    saveSettings() {
        const s = Storage.getSettings();
        const el = (id) => document.getElementById(id);
        const int = (id, def, min, max) => this._clampInt(el(id)?.value, def, min, max);

        if (el('setting-rest-compound')) s.restTimeCompound = int('setting-rest-compound', 120, 15, 600);
        if (el('setting-rest-isolation')) s.restTimeIsolation = int('setting-rest-isolation', 75, 15, 600);
        if (el('setting-rest-sound')) s.restSound = el('setting-rest-sound').value || 'beep';
        if (el('setting-vibration')) s.vibration = el('setting-vibration').checked;
        if (el('setting-theme')) s.theme = el('setting-theme').value || 'dark';
        if (el('setting-notifications')) s.notifications = el('setting-notifications').checked;
        if (el('setting-keep-awake')) s.keepAwake = el('setting-keep-awake').checked;
        if (el('setting-background-alerts')) s.backgroundAlerts = el('setting-background-alerts').checked;
        delete s.weightUnit;   // unità sempre kg

        Storage.saveSettings(s);
    },

    // Il permesso delle notifiche si chiede solo da qui, mai in automatico
    async onNotificationsToggle(input) {
        if (input.checked) {
            if (typeof Notification === 'undefined') {
                input.checked = false;
                this.showNotification('Notifiche non disponibili su questo browser', 'warning');
            } else {
                let result = null;
                try {
                    result = await Timer.requestNotificationPermission();
                } catch (e) {
                    result = null;
                }
                const granted = result === 'granted' || result === true || Notification.permission === 'granted';
                if (!granted) {
                    input.checked = false;
                    this.showNotification('Notifiche bloccate: consentile dal browser', 'warning');
                }
            }
        }
        this.saveSettings();
    },

    // ========================================
    // DATA EXPORT/IMPORT
    // ========================================

    exportData() {
        let data = Storage.exportAllData();
        if (typeof data !== 'string') data = JSON.stringify(data, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `gymtracker_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();

        // Su iOS il download parte dopo il click: l'URL si libera più tardi (G9)
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        this.showNotification('Backup esportato', 'success');
    },

    importData(file) {
        if (!file) return;
        if (!confirm(`Importare ${file.name}? Sostituisce i dati attuali`)) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            let result = false;
            try {
                result = Storage.importAllData(e.target.result);
            } catch (err) {
                console.error('importAllData', err);
                result = false;
            }
            const ok = result === true || result?.ok === true || result?.success === true;
            if (ok) {
                this.showNotification('Dati importati', 'success');
                setTimeout(() => location.reload(), 600);
            } else {
                const reason = Storage.lastImportError || result?.error;
                const why = typeof reason === 'string' && reason ? `: ${reason}` : '';
                this.showNotification(`Importazione non riuscita${why}`, 'error');
            }
        };
        reader.onerror = () => this.showNotification('File non leggibile', 'error');
        reader.readAsText(file);
    },
});
