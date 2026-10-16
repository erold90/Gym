/**
 * GymTracker 2.0 — area PROFILO (profilo + impostazioni in una pagina): dati personali (foglio),
 * obiettivo, esperienza, giorni e durata, rigenera scheda, attrezzatura, preferenze (zone dolenti,
 * esercizi da evitare), palestra (bilanciere e dischi), seduta (suono, vibrazione, notifiche, schermo,
 * avvisi in background, recupero di base), tema, backup (condividi, esporta, importa), versione.
 * Gli strumenti di prova (simula, aggiorna l'app, cancella) compaiono dopo 7 tocchi sulla versione.
 *
 * Tutto si salva al tocco (niente bottone "Salva" della pagina); il foglio dei dati ha il suo "Salva".
 * settings.lastBackupAt (ISO) si scrive a ogni backup condiviso o esportato: lo legge anche Oggi.
 */

Object.assign(App, {
    // Etichette: la tabella unica del core (App.LABELS), le stesse del primo avvio (R2-13)
    PF_GOALS: App.LABELS.goals,
    PF_LEVELS: App.LABELS.levels,
    PF_BACKGROUNDS: [['none', 'Nessuna'], ['bodybuilding', 'Bodybuilding'], ['powerlifting', 'Powerlifting'], ['crossfit', 'CrossFit'], ['calisthenics', 'Calisthenics'], ['sport', 'Altro sport']],
    PF_EQUIPMENT: App.LABELS.equipment,
    PF_PAIN: App.LABELS.pain,
    PF_PLATES: [25, 20, 15, 10, 5, 2.5, 1.25],

    // ========================================
    // GUSCIO DELL'AREA
    // ========================================

    htmlProfilo() {
        const row = (id, icon, title, end = '') => `
            <button type="button" class="row" id="${id}">
                <span class="row__icon">${this.ico(icon)}</span>
                <span class="row__body"><span class="row__title">${title}</span></span>
                <span class="row__end"><span id="${id}-val">${end}</span>${this.ico('next')}</span>
            </button>`;
        const sw = (id, icon, title, sub = '') => `
            <div class="row">
                <span class="row__icon">${this.ico(icon)}</span>
                <span class="row__body"><span class="row__title" id="${id}-t">${title}</span>${sub ? `<span class="row__sub" id="${id}-s">${sub}</span>` : ''}</span>
                <button type="button" class="switch" role="switch" aria-checked="false" id="${id}" aria-labelledby="${id}-t"${sub ? ` aria-describedby="${id}-s"` : ''}></button>
            </div>`;
        const restStep = (key, label) => `
            <div class="pf-rest">
                <span class="pf-rest__k" id="pf-rest-${key}-k">${label}</span>
                <div class="pf-rest__box" role="group" aria-labelledby="pf-rest-${key}-k">
                    <button type="button" class="btn btn--ghost btn--icon" data-rest="${key}" data-by="-15" aria-label="${label}: meno 15 secondi">${this.ico('minus')}</button>
                    <output class="num pf-rest__v" id="setting-rest-${key}" aria-live="polite">2:00</output>
                    <button type="button" class="btn btn--ghost btn--icon" data-rest="${key}" data-by="15" aria-label="${label}: più 15 secondi">${this.ico('plus')}</button>
                </div>
            </div>`;
        return `
            <div class="me">
                <span class="avatar" aria-hidden="true" id="pf-avatar">G</span>
                <div class="me__text">
                    <h1 class="me__name" id="pf-name">Profilo</h1>
                    <p class="me__sub" id="pf-sub"></p>
                </div>
                <button type="button" class="btn btn--ghost btn--icon" id="pf-edit" aria-label="Modifica i dati personali">${this.ico('edit')}</button>
            </div>

            <div class="wide">
                <div class="col">
                    <section class="section" aria-labelledby="pf-plan-t">
                        <h2 class="cap" id="pf-plan-t">Allenamento</h2>
                        <div class="group">
                            ${row('pf-goal', 'target', 'Obiettivo')}
                            ${row('pf-level', 'trend-up', 'Esperienza')}
                            ${row('pf-days', 'calendar', 'Giorni e durata')}
                            <button type="button" class="row" id="pf-regen">
                                <span class="row__icon">${this.ico('cycle')}</span>
                                <span class="row__body"><span class="row__title">Rigenera scheda</span><span class="row__sub">Storico e record restano</span></span>
                                <span class="row__end">${this.ico('next')}</span>
                            </button>
                        </div>
                    </section>

                    <section class="section" aria-labelledby="pf-eq-t">
                        <div class="section__head"><h2 class="cap" id="pf-eq-t">Attrezzatura</h2><span class="count" id="pf-eq-count"></span></div>
                        <div class="chips" role="group" aria-labelledby="pf-eq-t" id="equipment-checkboxes">
                            ${this.PF_EQUIPMENT.map(([v, l, i]) => `<button type="button" class="chip chip--lg" aria-pressed="false" data-eq="${v}">${this.ico(i)}${l}</button>`).join('')}
                        </div>
                    </section>

                    <section class="section" aria-labelledby="pf-pref-t">
                        <h2 class="cap" id="pf-pref-t">Preferenze</h2>
                        <div class="group pf-pref">
                            <div class="row pf-row-wrap">
                                <span class="row__icon">${this.ico('alert')}</span>
                                <span class="row__body"><span class="row__title" id="pf-pain-t">Zone dolenti</span><span class="row__sub">Niente esercizi che le caricano</span></span>
                                <div class="chips pf-full" role="group" aria-labelledby="pf-pain-t" id="pf-pain">
                                    ${this.PF_PAIN.map(([v, l]) => `<button type="button" class="chip" aria-pressed="false" data-pain="${v}">${l}</button>`).join('')}
                                </div>
                            </div>
                            ${row('pf-avoid', 'close', 'Esercizi da evitare')}
                        </div>
                    </section>

                    <section class="section" aria-labelledby="pf-gym-t">
                        <h2 class="cap" id="pf-gym-t">Palestra</h2>
                        <div class="group">
                            <div class="row pf-row-wrap">
                                <span class="row__icon">${this.ico('barbell')}</span>
                                <span class="row__body"><span class="row__title" id="pf-bar-t">Bilanciere</span></span>
                                <div class="seg pf-full" role="radiogroup" aria-labelledby="pf-bar-t" id="pf-bar">
                                    <button type="button" role="radio" aria-checked="true" data-val="20"><span><span class="num">20</span> kg</span></button>
                                    <button type="button" role="radio" aria-checked="false" data-val="15"><span><span class="num">15</span> kg</span></button>
                                </div>
                            </div>
                            <div class="row pf-row-wrap">
                                <span class="row__icon">${this.ico('plate')}</span>
                                <span class="row__body"><span class="row__title" id="pf-plates-t">Dischi per lato</span></span>
                                <div class="chips pf-full" role="group" aria-labelledby="pf-plates-t" id="pf-plates">
                                    ${this.PF_PLATES.map(p => `<button type="button" class="chip pf-plate" aria-pressed="true" data-plate="${p}"><span class="num">${this.fmt(p)}</span></button>`).join('')}
                                </div>
                            </div>
                        </div>
                    </section>

                </div>

                <div class="col">
                    <section class="section" aria-labelledby="pf-ses-t">
                        <h2 class="cap" id="pf-ses-t">Durante la seduta</h2>
                        <div class="group">
                            <div class="row pf-row-wrap">
                                <span class="row__icon">${this.ico('sound')}</span>
                                <span class="row__body"><span class="row__title" id="pf-snd-t">Suono a fine recupero</span></span>
                                <div class="seg pf-full" role="radiogroup" aria-labelledby="pf-snd-t" id="setting-rest-sound">
                                    <button type="button" role="radio" aria-checked="true" data-val="beep">Beep</button>
                                    <button type="button" role="radio" aria-checked="false" data-val="bell">Campana</button>
                                    <button type="button" role="radio" aria-checked="false" data-val="none">Nessuno</button>
                                </div>
                            </div>
                            ${sw('setting-vibration', 'vibrate', 'Vibrazione')}
                            ${sw('setting-notifications', 'bell', 'Notifica a schermo spento')}
                            ${sw('setting-keep-awake', 'wakelock', 'Schermo sempre acceso')}
                            ${sw('setting-background-alerts', 'mute', 'Suono con app chiusa', 'Può fermare la musica')}
                            <div class="row pf-row-wrap">
                                <span class="row__icon">${this.ico('timer')}</span>
                                <span class="row__body"><span class="row__title">Recupero di base</span><span class="row__sub">Per gli esercizi senza un recupero</span></span>
                                <div class="pf-rests pf-full">${restStep('compound', 'Multiarticolari')}${restStep('isolation', 'Isolamento')}</div>
                            </div>
                        </div>
                    </section>
                    <section class="section" aria-labelledby="pf-th-t">
                        <h2 class="cap" id="pf-th-t">Tema</h2>
                        <div class="seg" role="radiogroup" aria-labelledby="pf-th-t" id="setting-theme">
                            <button type="button" role="radio" aria-checked="false" data-val="auto">${this.ico('theme-auto')}Auto</button>
                            <button type="button" role="radio" aria-checked="true" data-val="dark">${this.ico('moon')}Scuro</button>
                            <button type="button" role="radio" aria-checked="false" data-val="light">${this.ico('sun')}Chiaro</button>
                        </div>
                    </section>

                    <section class="section" id="pf-backup" aria-labelledby="pf-bk-t">
                        <h2 class="cap" id="pf-bk-t">Backup</h2>
                        <div class="group backup">
                            <div class="backup__state">
                                <span class="row__icon" id="pf-bk-icon">${this.ico('shield')}</span>
                                <span class="row__body"><span class="row__title" id="pf-bk-title">Backup</span><span class="row__sub" id="pf-bk-sub"></span></span>
                            </div>
                            <div class="backup__btns">
                                <button type="button" class="btn btn--primary" id="share-data-btn">${this.ico('share')}Condividi</button>
                                <button type="button" class="btn btn--secondary" id="export-data-btn">${this.ico('download')}Esporta</button>
                                <button type="button" class="btn btn--secondary" id="import-data-btn">${this.ico('upload')}Importa</button>
                            </div>
                            <input type="file" id="import-file-input" accept=".json,application/json" hidden>
                        </div>
                    </section>

                    <section class="section" id="pf-tools" aria-labelledby="pf-tools-t" hidden>
                        <h2 class="cap" id="pf-tools-t">Strumenti di prova</h2>
                        <div class="group">
                            <button type="button" class="row" id="simulate-workout-btn">
                                <span class="row__icon">${this.ico('play')}</span>
                                <span class="row__body"><span class="row__title">Simula una seduta</span><span class="row__sub">Non salva niente</span></span>
                            </button>
                            <button type="button" class="row" id="clear-cache-btn">
                                <span class="row__icon">${this.ico('cycle')}</span>
                                <span class="row__body"><span class="row__title">Aggiorna l'app</span><span class="row__sub">Svuota la cache e ricarica · <span id="storage-text">…</span></span></span>
                            </button>
                            <button type="button" class="row" id="clear-progress-btn">
                                <span class="row__icon pf-danger">${this.ico('trash')}</span>
                                <span class="row__body"><span class="row__title pf-danger">Cancella i progressi</span><span class="row__sub">Tiene profilo e scheda</span></span>
                            </button>
                            <button type="button" class="row" id="reset-data-btn">
                                <span class="row__icon pf-danger">${this.ico('trash')}</span>
                                <span class="row__body"><span class="row__title pf-danger">Cancella tutto</span><span class="row__sub">Come appena installata</span></span>
                            </button>
                        </div>
                    </section>

                    <div class="foot">
                        <span>${this.ico('lock', 'ico--sm')} I dati restano su questo telefono</span>
                        <button type="button" class="pf-version" id="pf-version">GymTracker <span class="num" id="app-version">${GT.esc(String(GT.APP_VERSION || '').replace(/^v/, ''))}</span></button>
                    </div>
                </div>
            </div>
        `;
    },

    bindProfilo() {
        const on = (id, ev, fn) => this._on(id, ev, fn);

        on('pf-edit', 'click', () => this._openDataSheet());
        on('pf-goal', 'click', () => this._openGoalSheet());
        on('pf-level', 'click', () => this._openLevelSheet());
        on('pf-days', 'click', () => this._openDaysSheet());
        on('pf-regen', 'click', () => this._regenerateProgram());
        on('pf-avoid', 'click', () => this._openAvoidSheet());

        on('equipment-checkboxes', 'click', (e) => {
            const chip = e.target.closest('[data-eq]');
            if (!chip) return;
            const p = Storage.getProfile();
            const set = new Set(p.equipment || []);
            if (set.has(chip.dataset.eq)) set.delete(chip.dataset.eq); else set.add(chip.dataset.eq);
            const order = this.PF_EQUIPMENT.map(x => x[0]);
            this._saveProfilePatch({ equipment: [...set].sort((a, b) => order.indexOf(a) - order.indexOf(b)) });
            this.loadProfile();
        });
        on('pf-pain', 'click', (e) => {
            const chip = e.target.closest('[data-pain]');
            if (!chip) return;
            const set = new Set(Storage.getProfile().painAreas || []);
            if (set.has(chip.dataset.pain)) set.delete(chip.dataset.pain); else set.add(chip.dataset.pain);
            this._saveProfilePatch({ painAreas: this.PF_PAIN.map(x => x[0]).filter(k => set.has(k)) });
            this.loadProfile();
        });

        // Palestra: settings.gym (Storage.getGymConfig/saveGymConfig di G5, con ripiego su settings)
        on('pf-bar', 'click', (e) => {
            const b = e.target.closest('[data-val]');
            if (!b) return;
            this._saveGym({ barKg: parseInt(b.dataset.val, 10) });
            this._renderGym();
        });
        on('pf-plates', 'click', (e) => {
            const b = e.target.closest('[data-plate]');
            if (!b) return;
            const kg = parseFloat(b.dataset.plate);
            const plates = new Set(this._pfGym().plates || this.PF_PLATES);
            if (plates.has(kg)) {
                if (plates.size === 1) {
                    this.showNotification('Serve almeno un disco', 'warning');
                    return;
                }
                plates.delete(kg);
            } else plates.add(kg);
            this._saveGym({ plates: [...plates].sort((a, b) => b - a) });
            this._renderGym();
        });

        // Seduta
        on('setting-rest-sound', 'click', (e) => {
            const b = e.target.closest('[data-val]');
            if (!b) return;
            this._save(() => Storage.saveSettings({ restSound: b.dataset.val }), 'Impostazione NON salvata');
            this.loadSettings();
        });
        ['setting-vibration', 'setting-keep-awake', 'setting-background-alerts'].forEach(id => {
            on(id, 'click', (e) => {
                const btn = e.currentTarget;
                const value = btn.getAttribute('aria-checked') !== 'true';
                btn.setAttribute('aria-checked', String(value));
                const key = { 'setting-vibration': 'vibration', 'setting-keep-awake': 'keepAwake', 'setting-background-alerts': 'backgroundAlerts' }[id];
                if (this._save(() => Storage.saveSettings({ [key]: value }), 'Impostazione NON salvata') === false) btn.setAttribute('aria-checked', String(!value));
                if (id === 'setting-keep-awake' && (this.activeWorkout || this.conditioningState.startedAt)) this._safe(() => this._setKeepAwake(value));
            });
        });
        on('setting-notifications', 'click', (e) => this.onNotificationsToggle(e.currentTarget));
        document.querySelectorAll('[data-rest]').forEach(btn => btn.addEventListener('click', () => {
            const key = btn.dataset.rest === 'compound' ? 'restTimeCompound' : 'restTimeIsolation';
            const s = Storage.getSettings();
            const v = this._clampInt((s[key] || 0) + parseInt(btn.dataset.by, 10), s[key], 15, 600);
            this._save(() => Storage.saveSettings({ [key]: v }), 'Recupero NON salvato');
            this.loadSettings();
        }));

        on('setting-theme', 'click', (e) => {
            const b = e.target.closest('[data-val]');
            if (!b) return;
            this.setTheme(b.dataset.val);
            this.loadSettings();
        });

        // Backup
        on('share-data-btn', 'click', () => this.shareBackup());
        on('export-data-btn', 'click', () => this.exportData());
        on('import-data-btn', 'click', () => document.getElementById('import-file-input')?.click());
        on('import-file-input', 'change', (e) => {
            this.importData(e.target.files[0]);
            e.target.value = '';   // permette di riscegliere lo stesso file
        });

        // Versione: 7 tocchi aprono gli strumenti di prova
        on('pf-version', 'click', () => {
            const tools = document.getElementById('pf-tools');
            if (!tools || !tools.hidden) return;
            this._versionTaps = (this._versionTaps || 0) + 1;
            clearTimeout(this._versionTapTimer);
            this._versionTapTimer = setTimeout(() => { this._versionTaps = 0; }, 3000);
            if (this._versionTaps >= 7) {
                this._versionTaps = 0;
                tools.hidden = false;
                this.updateStorageUsage();
                this.showNotification('Strumenti di prova attivi', 'info', { icon: 'settings' });
                tools.scrollIntoView?.({ block: 'center', behavior: this._scrollBehavior() });
            }
        });
        on('simulate-workout-btn', 'click', () => this.startSimulatedWorkout());
        on('clear-cache-btn', 'click', () => this._clearCache());
        on('clear-progress-btn', 'click', () => this._clearProgress());
        on('reset-data-btn', 'click', () => this._resetAll());
    },

    // Il profilo si ridisegna a ogni apertura (E8: il peso aggiunto in Progressi non va perso)
    enterProfilo() {
        this._safe(() => this.loadProfile());
        this._safe(() => this.loadSettings());
    },

    // ========================================
    // PROFILO: lettura e salvataggio
    // ========================================

    // Un tocco in Profilo salva e ridisegna solo Profilo: Oggi si ridisegna quando la si apre (R1-10)
    _saveProfilePatch(patch) {
        const ok = this._save(() => Storage.saveProfile(patch), 'Profilo NON salvato');
        this._ctxCache = this.activeWorkout ? {} : null;   // il peso corporeo entra nel corpo libero
        return ok !== false;
    },

    _age(birthdate) {
        const d = new Date(birthdate);
        if (!birthdate || isNaN(d)) return null;
        const now = new Date();
        let a = now.getFullYear() - d.getFullYear();
        if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) a--;
        return a >= 10 && a <= 100 ? a : null;
    },

    loadProfile() {
        const p = Storage.getProfile();
        const name = String(p.name || '').trim();
        this._setText('pf-name', name || 'Profilo');
        this._setText('pf-avatar', (name.charAt(0) || 'G').toUpperCase());
        const sub = document.getElementById('pf-sub');
        if (sub) {
            const age = this._age(p.birthdate);
            const parts = [{ male: 'Uomo', female: 'Donna' }[p.gender] || ''];
            if (age) parts.push(`<span class="num">${age}</span> anni`);
            if (GT.num(p.weight) > 0) parts.push(`<span class="num">${GT.esc(this.fmt(p.weight, 1))}</span>&nbsp;kg`);
            const html = parts.filter(Boolean).join(' · ');
            sub.innerHTML = html || 'Tocca la matita per i tuoi dati';
        }
        const goal = this.PF_GOALS.find(g => g[0] === p.goal);
        this._setText('pf-goal-val', goal ? goal[1] : '');
        const level = this.PF_LEVELS.find(l => l[0] === p.level);
        this._setText('pf-level-val', level ? level[3] : '');
        const daysVal = document.getElementById('pf-days-val');
        const td = this._trainingDays(p);
        if (daysVal) {
            // Con i giorni fissi: "L M V · 60 min"; senza: "3 × 60 min"
            daysVal.innerHTML = td.length
                ? `<span class="pf-wd" aria-label="${GT.esc(td.map(d => this._weekdayName(d, false)).join(', '))}">${td.map(d => this.LABELS.weekdays[d - 1][2]).join('\u2009')}</span> · <span class="num">${GT.esc(p.sessionTime || 60)}</span>&nbsp;min`
                : `<span class="num">${GT.esc(p.daysPerWeek || 3)}</span> × <span class="num">${GT.esc(p.sessionTime || 60)}</span>&nbsp;min`;
        }

        const eq = new Set(Array.isArray(p.equipment) ? p.equipment : []);
        document.querySelectorAll('#equipment-checkboxes [data-eq]').forEach(c => c.setAttribute('aria-pressed', String(eq.has(c.dataset.eq))));
        const count = document.getElementById('pf-eq-count');
        if (count) count.innerHTML = `<span class="num">${this.PF_EQUIPMENT.filter(x => eq.has(x[0])).length}</span> su <span class="num">${this.PF_EQUIPMENT.length}</span>`;

        const pain = new Set(p.painAreas || []);
        document.querySelectorAll('#pf-pain [data-pain]').forEach(c => c.setAttribute('aria-pressed', String(pain.has(c.dataset.pain))));
        const avoid = (p.avoidExercises || []).filter(id => EXERCISES_DB[id]);
        this._setText('pf-avoid-val', avoid.length ? String(avoid.length) : 'nessuno');
        this._renderGym();
    },

    // Usata dal foglio dei dati (nome storico)
    saveProfile() {
        const root = document.getElementById('pf-data-sheet');
        if (!root) return false;
        const val = (id) => root.querySelector('#' + id)?.value ?? '';
        const num = (id, lo, hi) => {
            const v = GT.num(val(id));
            return v >= lo && v <= hi ? Math.round(v * 10) / 10 : null;
        };
        const name = val('profile-name').trim().slice(0, 40);
        if (!name) {
            this.showNotification('Scrivi il nome', 'warning');
            root.querySelector('#profile-name')?.focus();
            return false;
        }
        const gender = root.querySelector('#profile-gender [aria-checked="true"]')?.dataset.val || '';
        const birth = val('profile-birthdate');
        const birthOk = !birth || !!this._age(birth);
        const patch = {
            name,
            gender,
            birthdate: birthOk ? birth : (Storage.getProfile().birthdate || ''),
            height: num('profile-height', 100, 250),
            weight: num('profile-weight', 20, 400),
            bodyFat: num('profile-bodyfat', 2, 70)
        };
        if (!birthOk) this.showNotification('Data di nascita non valida: non salvata', 'warning');
        if (!this._saveProfilePatch(patch)) return false;
        this.loadProfile();
        this.showNotification('Dati salvati', 'success');
        return true;
    },

    _openDataSheet() {
        const p = Storage.getProfile();
        const field = (id, label, input) => `<div class="field"><label for="${id}">${label}</label>${input}</div>`;
        const g = (v) => (p.gender === v ? 'true' : 'false');
        const root = this._sheet('pf-data-sheet', `
            ${this._sheetHead('I tuoi dati', 'Chiudi senza salvare')}
            <form class="pf-form" id="pf-data-form" novalidate>
                ${field('profile-name', 'Nome', `<input class="input" type="text" id="profile-name" autocomplete="given-name" maxlength="40" value="${GT.esc(p.name || '')}">`)}
                <div class="field"><span class="label" id="profile-gender-l">Sesso</span>
                    <div class="seg" role="radiogroup" aria-labelledby="profile-gender-l" id="profile-gender">
                        <button type="button" role="radio" aria-checked="${g('male')}" data-val="male">${this.ico('male')}Uomo</button>
                        <button type="button" role="radio" aria-checked="${g('female')}" data-val="female">${this.ico('female')}Donna</button>
                    </div></div>
                ${field('profile-birthdate', 'Data di nascita', `<input class="input" type="date" id="profile-birthdate" value="${GT.esc(p.birthdate || '')}">`)}
                <div class="pf-form__2">
                    ${field('profile-height', 'Altezza (cm)', `<input class="input num" type="text" inputmode="numeric" id="profile-height" autocomplete="off" value="${GT.esc(p.height ?? '')}">`)}
                    ${field('profile-weight', 'Peso (kg)', `<input class="input num" type="text" inputmode="decimal" id="profile-weight" autocomplete="off" value="${GT.esc(p.weight != null ? this.fmt(p.weight, 1) : '')}">`)}
                </div>
                ${field('profile-bodyfat', 'Grasso corporeo (%) · facoltativo', `<input class="input num" type="text" inputmode="decimal" id="profile-bodyfat" autocomplete="off" value="${GT.esc(p.bodyFat != null ? this.fmt(p.bodyFat, 1) : '')}">`)}
                <button type="submit" class="btn btn--primary btn--xl btn--block">${this.ico('check')}Salva i dati</button>
            </form>`, { tall: true });
        root.querySelector('#profile-gender')?.addEventListener('click', (e) => {
            const b = e.target.closest('[data-val]');
            if (!b) return;
            const on = b.getAttribute('aria-checked') !== 'true';
            root.querySelectorAll('#profile-gender [data-val]').forEach(x => x.setAttribute('aria-checked', String(on && x === b)));
        });
        root.querySelector('#pf-data-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            if (this.saveProfile()) this._closeSheet('pf-data-sheet');
        });
    },

    // Scelta singola in un foglio: obiettivo
    _openGoalSheet() {
        const p = Storage.getProfile();
        const root = this._sheet('pf-goal-sheet', `
            ${this._sheetHead('Obiettivo', 'Chiudi la scelta dell\'obiettivo')}
            <div class="choices" role="radiogroup" aria-label="Obiettivo">
                ${this.PF_GOALS.map(([v, t, d, i]) => `<button type="button" class="choice" role="radio" aria-checked="${p.goal === v}" data-val="${v}">
                    <span class="choice__icon">${this.ico(i)}</span><span class="choice__body"><b>${t}</b><span>${d}</span></span>
                    <span class="choice__mark">${this.ico('check')}</span></button>`).join('')}
            </div>`);
        root.addEventListener('click', (e) => {
            const b = e.target.closest('.choice[data-val]');
            if (!b) return;
            const goal = b.dataset.val;
            this._saveProfilePatch({ goal });
            this.loadProfile();
            this._closeSheet('pf-goal-sheet');
            this._suggestRegen(`Obiettivo: ${this.PF_GOALS.find(g => g[0] === goal)?.[1] || ''}`, (prog) => prog?.metadata?.goal && prog.metadata.goal !== goal);
        });
    },

    _openLevelSheet() {
        const p = Storage.getProfile();
        const root = this._sheet('pf-level-sheet', `
            ${this._sheetHead('Esperienza', 'Chiudi l\'esperienza')}
            <div class="choices" role="radiogroup" aria-label="Da quanto ti alleni">
                ${this.PF_LEVELS.map(([v, t, d]) => `<button type="button" class="choice" role="radio" aria-checked="${p.level === v}" data-val="${v}">
                    <span class="choice__body"><b>${t}</b><span>${d}</span></span><span class="choice__mark">${this.ico('check')}</span></button>`).join('')}
            </div>
            <div class="field"><span class="label" id="pf-bg-l">Vieni da</span>
                <div class="chips" role="radiogroup" aria-labelledby="pf-bg-l">
                    ${this.PF_BACKGROUNDS.map(([v, t]) => `<button type="button" class="chip" role="radio" aria-checked="${(p.background || 'none') === v}" data-bg="${v}">${t}</button>`).join('')}
                </div></div>
            <button type="button" class="btn btn--primary btn--xl btn--block" data-sheet-close>Fatto</button>`);
        root.addEventListener('click', (e) => {
            const lv = e.target.closest('.choice[data-val]');
            const bg = e.target.closest('[data-bg]');
            if (lv) {
                this._saveProfilePatch({ level: lv.dataset.val });
                root.querySelectorAll('.choice[data-val]').forEach(x => x.setAttribute('aria-checked', String(x === lv)));
            } else if (bg) {
                this._saveProfilePatch({ background: bg.dataset.bg });
                root.querySelectorAll('[data-bg]').forEach(x => x.setAttribute('aria-checked', String(x === bg)));
            } else return;
            this.loadProfile();
        });
    },

    _openDaysSheet() {
        const p = Storage.getProfile();
        const pick = (key, list, cur, unit) => `<div class="pick" style="--n:${list.length}" role="radiogroup" aria-labelledby="pf-${key}-l">
            ${list.map(v => `<button type="button" role="radio" aria-checked="${+cur === v}" data-${key}="${v}">${v}<small>${unit}</small></button>`).join('')}</div>`;
        const before = { d: p.daysPerWeek, m: p.sessionTime };
        const td0 = this._trainingDays(p);
        const root = this._sheet('pf-days-sheet', `
            ${this._sheetHead('Giorni e durata', 'Chiudi giorni e durata')}
            <div class="field"><span class="label" id="pf-days-l">Giorni a settimana</span>${pick('days', [2, 3, 4, 5, 6], p.daysPerWeek || 3, 'gg')}</div>
            <div class="field"><span class="label" id="pf-wd-l">Quali giorni · facoltativo</span>
                <div class="wd" role="group" aria-labelledby="pf-wd-l" id="pf-wdays">${this._weekdayChips(td0, 'data-wd')}</div>
                <p class="pf-hint" id="pf-wd-hint">${td0.length ? 'Oggi ti dice quando riposare' : 'Nessun giorno fisso: decidi tu'}</p></div>
            <div class="field"><span class="label" id="pf-min-l">Minuti a seduta</span>${pick('min', [30, 45, 60, 75, 90], p.sessionTime || 60, 'min')}</div>
            <button type="button" class="btn btn--primary btn--xl btn--block" data-sheet-close>Fatto</button>`,
        {
            onClose: () => {
                this._closeSheet('pf-days-sheet');
                const now = Storage.getProfile();
                if (now.daysPerWeek !== before.d || now.sessionTime !== before.m) {
                    this._suggestRegen(`${now.daysPerWeek} giorni × ${now.sessionTime} min`, () => true);
                }
            }
        });
        const syncWd = () => {
            const td = this._trainingDays();
            root.querySelectorAll('[data-wd]').forEach(x => x.setAttribute('aria-pressed', String(td.includes(parseInt(x.dataset.wd, 10)))));
            this._setText('pf-wd-hint', td.length ? 'Oggi ti dice quando riposare' : 'Nessun giorno fisso: decidi tu');
        };
        root.addEventListener('click', (e) => {
            const d = e.target.closest('[data-days]');
            const m = e.target.closest('[data-min]');
            const wd = e.target.closest('[data-wd]');
            if (d) {
                const n = parseInt(d.dataset.days, 10);
                const patch = { daysPerWeek: n };
                // Giorni fissi che non tornano più col numero: la proposta per N giorni
                const td = this._trainingDays();
                if (td.length && td.length !== n) patch.trainingDays = this._defaultTrainingDays(n);
                this._saveProfilePatch(patch);
                root.querySelectorAll('[data-days]').forEach(x => x.setAttribute('aria-checked', String(x === d)));
                syncWd();
            } else if (m) {
                this._saveProfilePatch({ sessionTime: parseInt(m.dataset.min, 10) });
                root.querySelectorAll('[data-min]').forEach(x => x.setAttribute('aria-checked', String(x === m)));
            } else if (wd) {
                const n = parseInt(wd.dataset.wd, 10);
                const set = new Set(this._trainingDays());
                if (set.has(n)) set.delete(n); else set.add(n);
                const td = [...set].sort((a, b) => a - b);
                const patch = { trainingDays: td };
                // Con 2-6 giorni fissi anche il numero dei giorni segue
                if (td.length >= 2 && td.length <= 6) patch.daysPerWeek = td.length;
                this._saveProfilePatch(patch);
                syncWd();
                const cur = Storage.getProfile().daysPerWeek;
                root.querySelectorAll('[data-days]').forEach(x => x.setAttribute('aria-checked', String(+x.dataset.days === +cur)));
            } else return;
            this.loadProfile();
        });
    },

    // Avviso con "Rigenera scheda" quando la scheda attiva non segue più il profilo
    _suggestRegen(text, differs) {
        const prog = this._safe(() => Storage.getActiveProgram());
        if (prog && this._safe(() => differs(prog))) {
            this.showNotification(text, 'success', { action: { label: 'Rigenera scheda', onClick: () => this._regenerateProgram() } });
        } else {
            this.showNotification(text, 'success');
        }
    },

    // Rigenera: lo stesso flusso del primo avvio dal passo dell'obiettivo (G3); ripiego: il vecchio wizard
    _regenerateProgram() {
        if (typeof this.openOnboarding === 'function') {
            this.openOnboarding({ fromStep: 'goal' });   // la seduta in corso la gestisce il primo avvio
            return;
        }
        if (this.activeWorkout) {
            this.showNotification('Prima finisci la seduta in corso', 'warning');
            return;
        }
        if (typeof this.openWizard === 'function') {
            this.navigateTo('scheda');
            this.openWizard();
        } else {
            this.navigateTo('scheda');
        }
    },

    // Esercizi da evitare: elenco con "Togli" e aggiunta dalla libreria
    _openAvoidSheet() {
        const render = () => {
            const list = (Storage.getProfile().avoidExercises || []).filter(id => EXERCISES_DB[id]);
            const box = document.getElementById('pf-avoid-list');
            if (!box) return;
            box.innerHTML = list.length ? `<ul class="group pf-avoid">${list.map(id => {
                const ex = EXERCISES_DB[id];
                const icon = this.EX_EQUIP_ICON?.[this._exEquip(ex)[0]] || 'dumbbell';
                return `<li class="row">${this._thumbHTML(getExerciseGif(id), icon, ' thumb--sm')}
                    <span class="row__body"><span class="row__title">${GT.esc(ex.name)}</span></span>
                    <button type="button" class="btn btn--ghost btn--sm" data-rm="${GT.esc(id)}" aria-label="Togli ${GT.esc(ex.name)} dagli esercizi da evitare">Togli</button></li>`;
            }).join('')}</ul>` : '<p class="muted">Nessuno: la scheda può proporre tutti gli esercizi</p>';
        };
        const root = this._sheet('pf-avoid-sheet', `
            ${this._sheetHead('Esercizi da evitare', 'Chiudi gli esercizi da evitare')}
            <div id="pf-avoid-list"></div>
            <button type="button" class="btn btn--secondary btn--block" data-act="add">${this.ico('plus')}Aggiungi esercizio</button>`, { tall: true });
        this._bindThumbFallback(root);
        render();
        root.addEventListener('click', (e) => {
            const rm = e.target.closest('[data-rm]');
            if (rm) {
                const name = EXERCISES_DB[rm.dataset.rm]?.name || '';
                this._saveProfilePatch({ avoidExercises: (Storage.getProfile().avoidExercises || []).filter(x => x !== rm.dataset.rm) });
                render();
                this.loadProfile();
                this.showNotification(`${name}: di nuovo proposto`, 'success');
                return;
            }
            if (e.target.closest('[data-act="add"]')) {
                const cur = new Set(Storage.getProfile().avoidExercises || []);
                this.pickExercise({
                    title: 'Esercizio da evitare',
                    filter: ex => !cur.has(ex.id),
                    onPick: (id) => {
                        this._saveProfilePatch({ avoidExercises: [...(Storage.getProfile().avoidExercises || []), id] });
                        render();
                        this.loadProfile();
                        this.showNotification(`${EXERCISES_DB[id]?.name || ''}: non più proposto`, 'success');
                    }
                });
            }
        });
    },

    // ========================================
    // PALESTRA (settings.gym)
    // ========================================

    _pfGym() {
        if (typeof Storage.getGymConfig === 'function') {
            const g = this._safe(() => Storage.getGymConfig());
            if (g) return g;
        }
        const s = Storage.getSettings();
        return { barKg: 20, plates: this.PF_PLATES.slice(), ...(s.gym && typeof s.gym === 'object' ? s.gym : {}) };
    },

    _saveGym(partial) {
        if (typeof Storage.saveGymConfig === 'function') return Storage.saveGymConfig(partial);
        const s = Storage.getSettings();
        return Storage.saveSettings({ gym: { ...(s.gym && typeof s.gym === 'object' ? s.gym : {}), ...partial } });
    },

    _renderGym() {
        const g = this._pfGym();
        const bar = String(g.barKg === 15 ? 15 : 20);
        document.querySelectorAll('#pf-bar [data-val]').forEach(b => b.setAttribute('aria-checked', String(b.dataset.val === bar)));
        const plates = new Set((Array.isArray(g.plates) ? g.plates : this.PF_PLATES).map(Number));
        document.querySelectorAll('#pf-plates [data-plate]').forEach(b => {
            const on = plates.has(parseFloat(b.dataset.plate));
            b.setAttribute('aria-pressed', String(on));
            b.setAttribute('aria-label', `Disco da ${this.fmt(parseFloat(b.dataset.plate))} kg${on ? '' : ', non disponibile'}`);
        });
    },

    // ========================================
    // IMPOSTAZIONI
    // ========================================

    loadSettings() {
        const s = Storage.getSettings();
        const radio = (id, val) => document.querySelectorAll(`#${id} [data-val]`).forEach(b => b.setAttribute('aria-checked', String(b.dataset.val === String(val))));
        const swi = (id, v) => document.getElementById(id)?.setAttribute('aria-checked', String(!!v));
        radio('setting-rest-sound', s.restSound || 'beep');
        radio('setting-theme', s.theme || 'dark');
        swi('setting-vibration', s.vibration !== false);
        const notifGranted = typeof Notification !== 'undefined' && Notification.permission === 'granted';
        swi('setting-notifications', !!s.notifications && notifGranted);
        swi('setting-keep-awake', s.keepAwake !== false);
        swi('setting-background-alerts', !!s.backgroundAlerts);
        this._setText('setting-rest-compound', this._fmtSec(s.restTimeCompound || 120));
        this._setText('setting-rest-isolation', this._fmtSec(s.restTimeIsolation || 75));
        this._setText('app-version', String(GT.APP_VERSION || '').replace(/^v/, ''));
        this._renderBackupState();
    },

    // Nome storico: ora ogni controllo salva da sé; qui si riscrive solo ciò che il DOM mostra
    saveSettings() {
        const s = {};
        const sw = (id) => document.getElementById(id)?.getAttribute('aria-checked') === 'true';
        const radio = (id) => document.querySelector(`#${id} [aria-checked="true"]`)?.dataset.val;
        if (document.getElementById('setting-vibration')) s.vibration = sw('setting-vibration');
        if (document.getElementById('setting-keep-awake')) s.keepAwake = sw('setting-keep-awake');
        if (document.getElementById('setting-background-alerts')) s.backgroundAlerts = sw('setting-background-alerts');
        if (document.getElementById('setting-notifications')) s.notifications = sw('setting-notifications');
        const snd = radio('setting-rest-sound');
        if (snd) s.restSound = snd;
        Storage.saveSettings(s);
    },

    // Il permesso delle notifiche si chiede SOLO da qui, mai in automatico
    async onNotificationsToggle(btn) {
        const turnOn = btn.getAttribute('aria-checked') !== 'true';
        if (!turnOn) {
            btn.setAttribute('aria-checked', 'false');
            Storage.saveSettings({ notifications: false });
            return;
        }
        if (typeof Notification === 'undefined') {
            this.showNotification('Notifiche non disponibili qui: installa l\'app sulla Home', 'warning');
            return;
        }
        let result = null;
        try {
            result = await Timer.requestNotificationPermission();
        } catch (e) {
            result = null;
        }
        const granted = result === 'granted' || result === true || Notification.permission === 'granted';
        btn.setAttribute('aria-checked', String(granted));
        Storage.saveSettings({ notifications: granted });
        if (!granted) this.showNotification('Notifiche bloccate: consentile dalle impostazioni', 'warning');
    },

    updateStorageUsage() {
        let total = 0;
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                total += ((localStorage.getItem(key) || '').length + key.length) * 2;   // UTF-16
            }
        } catch (e) {
            return;
        }
        const kb = total / 1024;
        this._setText('storage-text', kb >= 1024 ? `${this.fmt(kb / 1024, 1)} MB usati` : `${Math.round(kb)} KB usati`);
    },

    startSimulatedWorkout() {
        if (this.activeWorkout) {
            this._promptActiveSession();
            return;
        }
        const fakeWorkout = {
            type: 'Simulazione',
            name: 'Simulazione',
            warmup: null,
            exercises: [
                { exerciseId: 'bench-press', name: 'Panca Piana (prova)', sets: 3, reps: '8-12', rest: 90 },
                { exerciseId: 'lat-pulldown', name: 'Lat Machine (prova)', sets: 3, reps: '10-12', rest: 60 }
            ]
        };
        this.startWorkout(fakeWorkout, { isSimulation: true });
        this.showNotification('Simulazione: non si salva niente', 'info');
    },

    async _clearCache() {
        const ok = await this.confirmSheet({ title: 'Aggiornare l\'app?', text: 'Svuota la cache e ricarica. I dati restano.', ok: 'Svuota e ricarica', cancel: 'Annulla' });
        if (!ok) return;
        try {
            if ('serviceWorker' in navigator) {
                const regs = await navigator.serviceWorker.getRegistrations();
                for (const r of regs) await r.unregister();
            }
            if ('caches' in window) {
                for (const name of await caches.keys()) await caches.delete(name);
            }
            location.reload();
        } catch (error) {
            console.error('Pulizia della cache:', error);
            this.showNotification('Cache non svuotata: riprova', 'error');
        }
    },

    async _clearProgress() {
        const n = Storage.getWorkouts().length;
        const c = (this._safe(() => Storage.getConditioningSessions()) || []).length;
        const ok = await this.confirmSheet({
            title: 'Cancellare i progressi?',
            text: `${n} sedute${c ? `, ${c} cardio` : ''}, record e cicli. Profilo, scheda e pesate restano. Non si torna indietro.`,
            ok: 'Cancella i progressi', cancel: 'Tieni i progressi', danger: true
        });
        if (!ok) return;
        Storage.clearProgressData();
        this._cycleSummaryDismissed = false;
        this.showNotification('Progressi cancellati', 'success', { icon: 'trash' });
        this.updateStorageUsage();
        this._renderBackupState();
    },

    async _resetAll() {
        const n = Storage.getWorkouts().length;
        const ok = await this.confirmSheet({
            title: 'Cancellare tutto?',
            text: `Profilo, scheda, ${n} sedute, record e impostazioni. Non si torna indietro: fai prima un backup.`,
            ok: 'Cancella tutto', cancel: 'Tieni i dati', danger: true
        });
        if (!ok) return;
        Storage.clearAllData();
        location.reload();
    },

    // ========================================
    // BACKUP: condividi (foglio di iOS), esporta (file), importa
    // ========================================

    _backupFileName() {
        return `gymtracker_backup_${GT.dateKey(new Date())}.json`;
    },

    _backupJSON() {
        const data = Storage.exportAllData();
        return typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    },

    _markBackup() {
        this._save(() => Storage.saveSettings({ lastBackupAt: new Date().toISOString() }), 'Data del backup NON salvata');
        this._renderBackupState();
    },

    _renderBackupState() {
        const s = Storage.getSettings();
        const icon = document.getElementById('pf-bk-icon');
        const title = document.getElementById('pf-bk-title');
        const sub = document.getElementById('pf-bk-sub');
        if (!title || !sub) return;
        const workouts = this._safe(() => Storage.getWorkouts()) || [];
        const last = s.lastBackupAt ? new Date(s.lastBackupAt) : null;
        let warn;
        if (last && !isNaN(last)) {
            const days = GT.calendarDaysBetween(last, new Date());
            const after = workouts.filter(w => new Date(w.date) > last).length;
            title.textContent = `Ultimo: ${days === 0 ? 'oggi' : this._shortDate(last)}`;
            sub.innerHTML = `${days === 0 ? 'oggi' : days === 1 ? 'ieri' : `<span class="num">${days}</span>&nbsp;giorni fa`} · ${after ? `<span class="num">${after}</span>&nbsp;${after === 1 ? 'seduta' : 'sedute'} da allora` : 'niente di nuovo'}`;
            warn = days >= 14 && after > 0;
        } else {
            title.textContent = 'Mai fatto';
            sub.innerHTML = workouts.length ? `<span class="num">${workouts.length}</span>&nbsp;${workouts.length === 1 ? 'seduta' : 'sedute'} solo su questo telefono` : 'I dati stanno solo su questo telefono';
            warn = workouts.length > 0;
        }
        if (icon) {
            icon.classList.toggle('pf-bk--warn', !!warn);
            icon.classList.toggle('pf-bk--ok', !warn && !!last);
        }
    },

    // Condividi: file JSON nel foglio di condivisione (iCloud Drive, WhatsApp, Mail); senza, si scarica
    async shareBackup() {
        let json;
        try {
            json = this._backupJSON();
        } catch (e) {
            console.error('exportAllData', e);
            this.showNotification('Backup non riuscito', 'error');
            return;
        }
        const name = this._backupFileName();
        let file = null;
        try { file = new File([json], name, { type: 'application/json' }); } catch (e) { file = null; }
        const canFiles = !!(file && navigator.share && navigator.canShare && navigator.canShare({ files: [file] }));
        if (!canFiles) {
            this.exportData(json);
            return;
        }
        try {
            await navigator.share({ files: [file], title: 'Backup GymTracker' });
            this._markBackup();
            this.showNotification('Backup condiviso', 'success', { icon: 'shield' });
        } catch (e) {
            if (e && e.name === 'AbortError') return;   // chiuso dall'utente: nessun backup
            console.error('share', e);
            this.exportData(json);
        }
    },

    exportData(json = null) {
        let data = json;
        try {
            if (!data) data = this._backupJSON();
        } catch (e) {
            console.error('exportAllData', e);
            this.showNotification('Backup non riuscito', 'error');
            return;
        }
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this._backupFileName();
        document.body.appendChild(a);
        a.click();
        a.remove();
        // Su iOS il download parte dopo il click: l'URL si libera più tardi (G9)
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        this._markBackup();
        this.showNotification(`Backup salvato: ${a.download}`, 'success', { icon: 'download' });
    },

    // Importa: si legge il file, la conferma dice cosa sostituisce, poi si ricarica
    importData(file) {
        if (!file) return;
        const reader = new FileReader();
        reader.onerror = () => this.showNotification('File non leggibile', 'error');
        reader.onload = async (e) => {
            const text = e.target.result;
            let data = null;
            try { data = JSON.parse(text); } catch (err) { data = null; }
            if (!data || typeof data !== 'object' || !(data.version || data.schemaVersion)) {
                this.showNotification('Non è un backup di GymTracker', 'error');
                return;
            }
            const nNew = Array.isArray(data.workouts) ? data.workouts.length : 0;
            const nNow = Storage.getWorkouts().length;
            const when = data.exportDate && GT.isValidDate(data.exportDate) ? ` del ${this._shortDate(data.exportDate)}` : '';
            const prog = Storage.getActiveProgram();
            // Telefono nuovo (primo avvio): niente da perdere, la conferma è semplice
            const empty = !nNow && !prog?.days?.length;
            const ok = await this.confirmSheet(empty ? {
                title: `Importare il backup${when}?`,
                text: `${nNew} ${nNew === 1 ? 'seduta' : 'sedute'}, profilo e scheda.`,
                ok: 'Importa il backup', cancel: 'Annulla', icon: 'upload'
            } : {
                title: `Importare il backup${when}?`,
                text: `Sostituisce profilo, ${prog ? 'scheda, ' : ''}${nNow} sedute e record di adesso con le ${nNew} sedute del backup.`,
                ok: 'Importa e sostituisci', cancel: 'Tieni i dati di adesso', danger: true
            });
            if (!ok) return;
            let result = false;
            try {
                result = Storage.importAllData(text);
            } catch (err) {
                console.error('importAllData', err);
                result = false;
            }
            if (result === true || result?.ok === true || result?.success === true) {
                this.showNotification('Backup importato: si ricarica', 'success');
                setTimeout(() => location.reload(), 600);
            } else {
                const reason = Storage.lastImportError || result?.error;
                this.showNotification(`Importazione non riuscita${typeof reason === 'string' && reason ? `: ${reason}` : ''}`, 'error');
            }
        };
        reader.readAsText(file);
    },
});
