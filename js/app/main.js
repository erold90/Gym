/**
 * GymTracker 2.0 — avvio. Caricato per ultimo: a questo punto tutte le aree
 * (js/app/<area>.js) hanno già aggiunto i loro metodi ad App.
 */

// Versione attesa: la aggiorna scripts/versione.sh insieme a sw.js, utils.js e index.html
const GT_EXPECTED_VERSION = 'v2.0.1';

// Guardia: una pagina nuova con moduli vecchi (cache di un service worker precedente) non deve
// partire — con storage.js della v1.25 la seduta non verrebbe mai salvata (R1-01).
// Si ricarica una volta; se il problema resta, si aspetta che il SW nuovo prenda il controllo.
function gtModulesAreCurrent() {
    return typeof GT !== 'undefined' && GT.APP_VERSION === GT_EXPECTED_VERSION
        && typeof Storage !== 'undefined' && typeof Storage.migrate === 'function'
        && typeof Timer !== 'undefined' && typeof Timer.startRest === 'function'
        && typeof TrainingAlgorithm !== 'undefined' && typeof TrainingAlgorithm.applyPhaseToDay === 'function';
}

document.addEventListener('DOMContentLoaded', () => {
    if (!gtModulesAreCurrent()) {
        let tried = false;
        try { tried = sessionStorage.getItem('gt-reload-guard') === GT_EXPECTED_VERSION; } catch (e) { /* privato */ }
        if (navigator.serviceWorker) {
            navigator.serviceWorker.addEventListener('controllerchange', () => location.reload());
        }
        if (!tried) {
            try { sessionStorage.setItem('gt-reload-guard', GT_EXPECTED_VERSION); } catch (e) { /* privato */ }
            location.reload();
            return;
        }
        document.body.insertAdjacentHTML('afterbegin',
            '<p role="status" style="padding:24px;font:600 18px system-ui;color:#f4f1ea;background:#141310">Aggiornamento in corso…</p>');
        return;
    }
    try { sessionStorage.removeItem('gt-reload-guard'); } catch (e) { /* privato */ }
    App.init();
});
