/**
 * GymTracker Pro - Utilità comuni (oggetto globale GT)
 * Caricato PER PRIMO: date, arrotondamenti, formattazione, escape HTML.
 * Un solo posto per il calcolo del lunedì, dei giorni di calendario e dei numeri in italiano.
 */

const GT = {
    APP_VERSION: 'v2.0.4',

    // Mesi abbreviati in italiano: scritti a mano per non dipendere dall'ICU del browser
    _MESI: ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'],

    // ========================================
    // TESTO
    // ========================================

    /** Escape per innerHTML: & < > " ' (null/undefined → ''). */
    esc(s) {
        if (s === null || s === undefined) return '';
        return String(s).replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        })[c]);
    },

    // ========================================
    // NUMERI
    // ========================================

    /** Numero da input/storage: accetta '102,5' (tastiera italiana), '' → 0, NaN → 0. */
    num(v) {
        if (typeof v === 'number') return isFinite(v) ? v : 0;
        if (v === null || v === undefined) return 0;
        const n = parseFloat(String(v).trim().replace(',', '.'));
        return isFinite(n) ? n : 0;
    },

    _fix(v) {
        // Toglie gli errori di virgola mobile (0.1+0.2) senza perdere i mezzi chili
        return Math.round(v * 1000) / 1000;
    },

    /** Arrotonda al multiplo di step più vicino (step 0/assente → x invariato). */
    round(x, step) {
        x = Number(x);
        if (!isFinite(x)) return 0;
        if (!step || step <= 0) return x;
        return this._fix(Math.round(x / step) * step);
    },

    /** Arrotonda per difetto al multiplo di step. */
    floorTo(x, step) {
        x = Number(x);
        if (!isFinite(x)) return 0;
        if (!step || step <= 0) return x;
        return this._fix(Math.floor(x / step + 1e-9) * step);
    },

    /** Arrotonda per eccesso al multiplo di step. */
    ceilTo(x, step) {
        x = Number(x);
        if (!isFinite(x)) return 0;
        if (!step || step <= 0) return x;
        return this._fix(Math.ceil(x / step - 1e-9) * step);
    },

    /** Numero in formato italiano: 2348 → '2.348', 12.4 (1 decimale) → '12,4'. */
    formatNumber(n, decimals = 0) {
        n = Number(n);
        if (!isFinite(n)) n = 0;
        const neg = n < 0;
        const fixed = Math.abs(n).toFixed(decimals);
        let [int, dec] = fixed.split('.');
        int = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        return (neg ? '−' : '') + int + (dec ? ',' + dec : '');
    },

    /** Volume: '850 kg' | '2.348 kg' | '12,4 t' (da 10.000 kg in su). */
    formatVolume(kg) {
        const n = Math.max(0, Number(kg) || 0);
        if (n >= 10000) {
            const t = Math.round(n / 100) / 10;
            const txt = Number.isInteger(t) ? this.formatNumber(t, 0) : this.formatNumber(t, 1);
            return `${txt} t`;
        }
        return `${this.formatNumber(Math.round(n), 0)} kg`;
    },

    // ========================================
    // DATE (ora locale, sicure col cambio d'ora)
    // ========================================

    _toDate(d) {
        if (d instanceof Date) return new Date(d.getTime());
        if (d === null || d === undefined || d === '') return new Date(NaN);
        return new Date(d);
    },

    isValidDate(d) {
        const x = this._toDate(d);
        return !isNaN(x.getTime());
    },

    /** Mezzanotte locale dello stesso giorno. */
    startOfDay(d = new Date()) {
        const x = this._toDate(d);
        if (isNaN(x.getTime())) return x;
        return new Date(x.getFullYear(), x.getMonth(), x.getDate());
    },

    /** Lunedì 00:00 locale della settimana di d. La domenica appartiene alla settimana del lunedì PRECEDENTE. */
    startOfWeek(d = new Date()) {
        const x = this._toDate(d);
        if (isNaN(x.getTime())) return x;
        const dow = (x.getDay() + 6) % 7; // lun=0 … dom=6
        return new Date(x.getFullYear(), x.getMonth(), x.getDate() - dow);
    },

    /** d + n giorni di calendario (00:00 locale se d era a mezzanotte). */
    addDays(d, n) {
        const x = this._toDate(d);
        if (isNaN(x.getTime())) return x;
        return new Date(x.getFullYear(), x.getMonth(), x.getDate() + n,
            x.getHours(), x.getMinutes(), x.getSeconds(), x.getMilliseconds());
    },

    /** Giorni di calendario da a a b (b − a): ieri→oggi = 1, anche a cavallo del cambio d'ora. NaN se una data non è valida. */
    calendarDaysBetween(a, b = new Date()) {
        const x = this._toDate(a), y = this._toDate(b);
        if (isNaN(x.getTime()) || isNaN(y.getTime())) return NaN;
        const ux = Date.UTC(x.getFullYear(), x.getMonth(), x.getDate());
        const uy = Date.UTC(y.getFullYear(), y.getMonth(), y.getDate());
        return Math.round((uy - ux) / 86400000);
    },

    /** Chiave 'AAAA-MM-GG' del giorno locale (per raggruppare). */
    dateKey(d) {
        const x = this._toDate(d);
        if (isNaN(x.getTime())) return '';
        const p = n => String(n).padStart(2, '0');
        return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}`;
    },

    /** 'Oggi' | 'Ieri' | '3 giorni fa' (fino a 6) | '12 ott' (con l'anno se diverso da quello corrente). */
    formatRelativeDay(date) {
        const d = this._toDate(date);
        if (isNaN(d.getTime())) return '';
        const now = new Date();
        const diff = this.calendarDaysBetween(d, now);
        if (diff === 0) return 'Oggi';
        if (diff === 1) return 'Ieri';
        if (diff > 1 && diff <= 6) return `${diff} giorni fa`;
        const base = `${d.getDate()} ${this._MESI[d.getMonth()]}`;
        return d.getFullYear() === now.getFullYear() ? base : `${base} ${d.getFullYear()}`;
    },

    /** Data in italiano. Senza opts: '12 ott 2026'. */
    formatDate(date, opts) {
        const d = this._toDate(date);
        if (isNaN(d.getTime())) return '';
        if (opts) {
            try { return d.toLocaleDateString('it-IT', opts); } catch (e) { /* ripiego sotto */ }
        }
        return `${d.getDate()} ${this._MESI[d.getMonth()]} ${d.getFullYear()}`;
    }
};

// Visibile anche come proprietà globale (per i controlli typeof dei moduli e per i test)
try { if (typeof globalThis !== 'undefined') globalThis.GT = GT; } catch (e) { /* no-op */ }
