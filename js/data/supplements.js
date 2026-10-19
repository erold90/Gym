/**
 * GymTracker — catalogo degli integratori (Profilo → Integratori → Aggiungi).
 *
 * Valori generici di partenza, uguali per tutti: ognuno li cambia nel foglio della voce.
 * Niente dati personali qui (il repo è pubblico).
 *
 * when: colazione | pranzo | pre (prima dell'allenamento) | post (dopo) | sera
 * days: sempre | allenamento (solo nei giorni in cui ti alleni)
 * restWhen: dove va nei giorni di riposo una voce pre/post di tutti i giorni (colazione | pranzo | sera)
 * short: nome corto per gli avvisi in una riga ("Prima: Citrullina, Beta-alanina")
 */
const SUPPLEMENTS_CATALOG = [
    { catalogId: 'creatina', name: 'Creatina monoidrato', short: 'Creatina', amount: '3 g', when: 'post', days: 'sempre', restWhen: 'pranzo', note: "Ogni giorno, anche a riposo: conta l'accumulo" },
    { catalogId: 'whey', name: 'Proteine whey', short: 'Whey', amount: '1 misurino', when: 'post', days: 'allenamento', restWhen: null, note: 'Utile per arrivare alle proteine del giorno' },
    { catalogId: 'citrullina', name: 'Citrullina malato', short: 'Citrullina', amount: '10 g · 2 misurini', when: 'pre', days: 'allenamento', restWhen: null, note: "30-60 minuti prima, in 300 ml d'acqua" },
    { catalogId: 'beta-alanina', name: 'Beta-alanina', short: 'Beta-alanina', amount: '2,5 g · 1 misurino', when: 'pre', days: 'sempre', restWhen: 'pranzo', note: "Il formicolio è normale; conta l'uso quotidiano" },
    { catalogId: 'omega3', name: 'Omega-3', short: 'Omega-3', amount: '2 softgel', when: 'colazione', days: 'sempre', restWhen: null, note: 'Con un pasto' },
    { catalogId: 'vitamina-d3', name: 'Vitamina D3', short: 'Vitamina D3', amount: '2000 UI', when: 'colazione', days: 'sempre', restWhen: null, note: 'Con un pasto che contiene grassi' },
    { catalogId: 'zinco', name: 'Zinco', short: 'Zinco', amount: '25 mg · 1 capsula', when: 'pranzo', days: 'sempre', restWhen: null, note: 'Con cibo, lontano dal magnesio' },
    { catalogId: 'magnesio', name: 'Magnesio', short: 'Magnesio', amount: '400 mg · 4 capsule', when: 'sera', days: 'sempre', restWhen: null, note: "Se dà fastidio all'intestino, scendi a 2-3" },
    { catalogId: 'caffeina', name: 'Caffeina', short: 'Caffeina', amount: '200 mg', when: 'pre', days: 'allenamento', restWhen: null, note: 'Non dopo metà pomeriggio' }
];

// Visibile anche come proprietà globale (per i controlli typeof e per i test)
try { if (typeof globalThis !== 'undefined') globalThis.SUPPLEMENTS_CATALOG = SUPPLEMENTS_CATALOG; } catch (e) { /* no-op */ }
