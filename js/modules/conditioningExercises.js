/**
 * GymTracker Pro - Conditioning Exercises Database
 * Database esercizi HIIT e attività LISS con configurazioni protocolli
 */

// ========================================
// DATABASE ESERCIZI HIIT
// ========================================

const HIIT_EXERCISES = {
    // === FULL BODY ===
    "burpees": {
        name: "Burpees",
        description: "Parti in piedi, scendi in squat, mani a terra, salta indietro in plank, fai un push-up, torna in squat e salta in alto con braccia sopra la testa.",
        muscles: ["full-body", "petto", "quadricipiti", "core"],
        difficulty: "advanced",
        equipment: [],
        metValue: 10,
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2025/08/Burpee-with-Push-Up.gif"
    },
    "half-burpees": {
        name: "Half Burpees",
        description: "Come i burpees ma senza push-up. Scendi in squat, salta in plank, torna in squat e salta su.",
        muscles: ["full-body", "quadricipiti", "core"],
        difficulty: "intermediate",
        equipment: [],
        metValue: 8,
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/02/burpees.gif"
    },
    "mountain-climbers": {
        name: "Mountain Climbers",
        description: "In posizione plank, porta le ginocchia al petto alternandole velocemente mantenendo il core attivo.",
        muscles: ["core", "spalle", "quadricipiti"],
        difficulty: "intermediate",
        equipment: [],
        metValue: 8,
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Mountain-climber.gif"
    },
    "jumping-jacks": {
        name: "Jumping Jacks",
        description: "Parti con piedi uniti e braccia lungo i fianchi. Salta aprendo gambe e braccia, poi torna in posizione.",
        muscles: ["full-body", "polpacci", "spalle"],
        difficulty: "beginner",
        equipment: [],
        metValue: 7,
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/05/Jumping-jack.gif"
    },
    "star-jumps": {
        name: "Star Jumps",
        description: "Da posizione accovacciata, salta esplosivamente aprendo braccia e gambe a stella, atterra morbido.",
        muscles: ["full-body", "quadricipiti", "spalle"],
        difficulty: "intermediate",
        equipment: [],
        metValue: 9,
        gifUrl: "https://static.exercisedb.dev/media/HtfCpfi.gif"
    },

    // === LOWER BODY ===
    "jump-squat": {
        name: "Jump Squat",
        description: "Esegui uno squat profondo, poi esplodi verso l'alto saltando. Atterra morbido e ripeti.",
        muscles: ["quadricipiti", "glutei", "polpacci"],
        difficulty: "intermediate",
        equipment: [],
        metValue: 9,
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Jump-Squat.gif"
    },
    "jumping-lunges": {
        name: "Jumping Lunges",
        description: "Da posizione di affondo, salta e scambia le gambe in aria, atterra nell'affondo opposto.",
        muscles: ["quadricipiti", "glutei", "femorali"],
        difficulty: "advanced",
        equipment: [],
        metValue: 9,
        gifUrl: null
    },
    "high-knees": {
        name: "High Knees",
        description: "Corri sul posto portando le ginocchia il più in alto possibile, alternando velocemente.",
        muscles: ["quadricipiti", "core", "polpacci"],
        difficulty: "beginner",
        equipment: [],
        metValue: 8,
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/08/High-Knee-Run.gif"
    },
    "butt-kicks": {
        name: "Butt Kicks",
        description: "Corri sul posto portando i talloni verso i glutei, alternando velocemente.",
        muscles: ["femorali", "polpacci"],
        difficulty: "beginner",
        equipment: [],
        metValue: 7,
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/10/Butt-Kicks.gif"
    },
    "squat-pulse": {
        name: "Squat Pulse",
        description: "Mantieni la posizione bassa dello squat e fai piccoli movimenti su e giù senza tornare in piedi.",
        muscles: ["quadricipiti", "glutei"],
        difficulty: "intermediate",
        equipment: [],
        metValue: 6,
        gifUrl: null
    },
    "skater-jumps": {
        name: "Skater Jumps",
        description: "Salta lateralmente da un piede all'altro come un pattinatore, portando la gamba libera dietro.",
        muscles: ["quadricipiti", "glutei", "polpacci"],
        difficulty: "intermediate",
        equipment: [],
        metValue: 8,
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Skater.gif"
    },
    "box-jump": {
        name: "Box Jump",
        description: "Salta esplosivamente su un box o step, atterra con entrambi i piedi, scendi controllato.",
        muscles: ["quadricipiti", "glutei", "polpacci"],
        difficulty: "intermediate",
        equipment: ["box"],
        metValue: 9,
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2015/07/The-Box-Jump.gif"
    },
    "lateral-shuffle": {
        name: "Lateral Shuffle",
        description: "Muoviti lateralmente a passi veloci mantenendo le ginocchia piegate, cambia direzione.",
        muscles: ["quadricipiti", "glutei", "polpacci"],
        difficulty: "beginner",
        equipment: [],
        metValue: 7,
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/05/Lateral-Speed-Step.gif"
    },

    // === UPPER BODY ===
    "plyo-push-up": {
        name: "Push-up Esplosivo",
        description: "Esegui un push-up e spingi esplosivamente in modo che le mani stacchino da terra.",
        muscles: ["petto", "tricipiti", "spalle"],
        difficulty: "advanced",
        equipment: [],
        metValue: 8,
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/06/Clap-Push-Up.gif"
    },
    "plank-shoulder-tap": {
        name: "Plank Shoulder Tap",
        description: "In posizione plank alta, tocca la spalla opposta con una mano alternando, mantieni il core stabile.",
        muscles: ["core", "spalle"],
        difficulty: "intermediate",
        equipment: [],
        metValue: 6,
        gifUrl: "https://static.exercisedb.dev/media/yRpV5TC.gif"
    },
    "push-up-to-t": {
        name: "Push-up to T",
        description: "Fai un push-up, poi ruota il corpo lateralmente sollevando un braccio verso il soffitto.",
        muscles: ["petto", "core", "spalle"],
        difficulty: "intermediate",
        equipment: [],
        metValue: 7,
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2023/01/push-up-with-rotation.gif"
    },
    "diamond-push-up": {
        name: "Diamond Push-up",
        description: "Push-up con mani unite a forma di diamante sotto il petto, enfatizza i tricipiti.",
        muscles: ["tricipiti", "petto"],
        difficulty: "intermediate",
        equipment: [],
        metValue: 6,
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Diamond-Push-up.gif"
    },

    // === CORE ===
    "v-ups": {
        name: "V-Ups",
        description: "Sdraiato, solleva contemporaneamente gambe e busto formando una V, tocca le punte dei piedi.",
        muscles: ["addome"],
        difficulty: "intermediate",
        equipment: [],
        metValue: 7,
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Jackknife-Sit-ups.gif"
    },
    "bicycle-crunch": {
        name: "Bicycle Crunch",
        description: "Sdraiato, porta il gomito verso il ginocchio opposto alternando in movimento di pedalata.",
        muscles: ["addome", "obliqui"],
        difficulty: "beginner",
        equipment: [],
        metValue: 6,
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Bicycle-Crunch.gif"
    },
    "plank-jack": {
        name: "Plank Jack",
        description: "In posizione plank, salta aprendo e chiudendo le gambe come un jumping jack.",
        muscles: ["core", "spalle", "quadricipiti"],
        difficulty: "intermediate",
        equipment: [],
        metValue: 7,
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2015/06/Plank-Jacks-Extended-Leg.gif"
    },
    "russian-twist-fast": {
        name: "Russian Twist Veloce",
        description: "Seduto con piedi sollevati, ruota velocemente il busto a destra e sinistra.",
        muscles: ["addome", "obliqui"],
        difficulty: "intermediate",
        equipment: [],
        metValue: 6,
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Russian-Twist.gif"
    },
    "dead-bug": {
        name: "Dead Bug",
        description: "Sdraiato, estendi braccio e gamba opposti alternando, mantieni la schiena a terra.",
        muscles: ["core", "addome"],
        difficulty: "beginner",
        equipment: [],
        metValue: 5,
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Dead-Bug.gif"
    },
    "toe-touch": {
        name: "Toe Touch",
        description: "Sdraiato con gambe verticali, solleva le spalle per toccare le punte dei piedi.",
        muscles: ["addome"],
        difficulty: "beginner",
        equipment: [],
        metValue: 5,
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2022/12/Lying-Toe-Touches.gif"
    },

    // === CON ATTREZZATURA ===
    "kettlebell-swing": {
        name: "Kettlebell Swing",
        description: "Oscillazione del kettlebell tra le gambe e sopra la testa usando la spinta dei fianchi.",
        muscles: ["glutei", "femorali", "schiena", "core"],
        difficulty: "intermediate",
        equipment: ["kettlebell"],
        metValue: 10,
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/09/Kettlebell-Swings.gif"
    },
    "battle-ropes": {
        name: "Battle Ropes",
        description: "Crea onde alternate con le corde, mantieni il core attivo e le ginocchia leggermente piegate.",
        muscles: ["spalle", "braccia", "core"],
        difficulty: "intermediate",
        equipment: ["battle-ropes"],
        metValue: 10,
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2015/07/Battle-Rope.gif"
    },
    "sled-push": {
        name: "Sled Push",
        description: "Spingi la slitta mantenendo il corpo inclinato in avanti e le braccia tese.",
        muscles: ["quadricipiti", "glutei", "core"],
        difficulty: "intermediate",
        equipment: ["sled"],
        metValue: 11,
        gifUrl: null
    },
    "med-ball-slam": {
        name: "Med Ball Slam",
        description: "Solleva la palla medica sopra la testa e sbattila a terra con forza, raccoglila e ripeti.",
        muscles: ["full-body", "core", "spalle"],
        difficulty: "intermediate",
        equipment: ["med-ball"],
        metValue: 9,
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2022/06/Medicine-ball-Overhead-Slam-exercise.gif"
    },
    "dumbbell-thruster": {
        name: "Dumbbell Thruster",
        description: "Squat con manubri alle spalle, esplodi verso l'alto spingendo i manubri sopra la testa.",
        muscles: ["quadricipiti", "spalle", "core"],
        difficulty: "intermediate",
        equipment: ["manubri"],
        metValue: 9,
        gifUrl: "https://static.exercisedb.dev/media/yWxMvB5.gif"
    }
};

// ========================================
// ATTIVITA' LISS
// ========================================

const LISS_ACTIVITIES = {
    "walking-incline": {
        name: "Camminata Inclinata",
        description: "Treadmill con inclinazione 10-15%, velocità 5-6 km/h. Mantieni postura eretta.",
        metValue: 4.5,
        equipment: ["treadmill"]
    },
    "cycling-steady": {
        name: "Cyclette",
        description: "Pedalata costante in Zone 2 (60-70% della frequenza cardiaca massima). Ritmo sostenibile.",
        metValue: 5,
        equipment: ["cyclette"]
    },
    "elliptical": {
        name: "Ellittica",
        description: "Movimento fluido a resistenza moderata. Ottimo per basso impatto articolare.",
        metValue: 5,
        equipment: ["ellittica"]
    },
    "rowing-steady": {
        name: "Rowing",
        description: "Vogata costante a ritmo moderato. Mantieni la schiena dritta e usa le gambe.",
        metValue: 6,
        equipment: ["rower"]
    },
    "swimming": {
        name: "Nuoto",
        description: "Stile libero o dorso a ritmo costante. Ottimo per recupero attivo.",
        metValue: 6,
        equipment: []
    },
    "outdoor-walk": {
        name: "Camminata all'Aperto",
        description: "Camminata veloce all'aperto, 5-6 km/h. Ideale per recupero attivo.",
        metValue: 4,
        equipment: []
    },
    "stair-climber": {
        name: "Stair Climber",
        description: "Salita gradini a ritmo moderato. Ottimo per glutei e cardio.",
        metValue: 6,
        equipment: ["stair-climber"]
    }
};

// ========================================
// PROTOCOLLI HIIT — UNICA FONTE (app e algoritmo leggono da qui)
// ========================================
//
// Campi (v1.26):
//   id, name, description
//   work / rest        secondi di lavoro e di recupero di ogni intervallo
//   rounds             giri (circuit), serie per esercizio (block), minuti (emom)
//   exercisesCount     esercizi consigliati
//   order              'circuit' = giro su tutti gli esercizi e si ricomincia
//                      'block'   = tutte le serie di un esercizio, poi il successivo (Tabata)
//                      'emom'    = un intervallo al minuto, esercizi a turno
//   intervals          intervalli lavoro+recupero totali (calcolato)
//   totalMin           durata in minuti (calcolata: intervals × (work + rest))
//   level              'beginner' | 'intermediate' | 'advanced'
// Alias per il codice v1.25 (stessi valori): workTime, restTime, difficulty, totalDuration.

const HIIT_PROTOCOLS = (() => {
    const list = [
        { id: 'beginner', name: 'Principiante', work: 20, rest: 40, rounds: 2, exercisesCount: 4, order: 'circuit', level: 'beginner',
          description: '20s lavoro + 40s recupero, 2 giri' },
        { id: 'circuit30', name: 'Circuito 30/30', work: 30, rest: 30, rounds: 3, exercisesCount: 5, order: 'circuit', level: 'intermediate',
          description: '30s lavoro + 30s recupero, 3 giri' },
        { id: 'circuit4020', name: 'Circuito 40/20', work: 40, rest: 20, rounds: 3, exercisesCount: 5, order: 'circuit', level: 'intermediate',
          description: '40s lavoro + 20s recupero, 3 giri' },
        { id: 'emom10', name: 'EMOM 10', work: 40, rest: 20, rounds: 10, exercisesCount: 2, order: 'emom', level: 'intermediate',
          description: 'Ogni minuto 40s di lavoro, esercizi a turno' },
        { id: 'tabata', name: 'Tabata', work: 20, rest: 10, rounds: 8, exercisesCount: 4, order: 'block', level: 'advanced',
          description: '8 × 20s/10s per esercizio, intensità massima' }
    ];
    const out = {};
    list.forEach(p => {
        p.intervals = p.order === 'emom' ? p.rounds : p.rounds * p.exercisesCount;
        p.totalMin = Math.round(p.intervals * (p.work + p.rest) / 60);
        // Alias v1.25
        p.workTime = p.work;
        p.restTime = p.rest;
        p.difficulty = p.level;
        p.totalDuration = p.totalMin;
        out[p.id] = p;
    });
    return out;
})();

// ========================================
// CONFIGURAZIONE PER OBIETTIVO
// ========================================
// frequency = sessioni/settimana consigliate, maxFrequency = tetto oltre il quale il cardio
// comincia a rubare recupero ai pesi. preferredType 'HIIT' | 'LISS' | 'mixed' (alterna).
// protocol = chiave di HIIT_PROTOCOLS (l'app la abbassa se supera il livello della persona).

const CONDITIONING_BY_GOAL = {
    strength: {
        frequency: 0,
        maxFrequency: 1,
        preferredType: "LISS",
        hiitAllowed: false,
        duration: 15,
        protocol: null,
        preferredDays: ["off-day"],
        note: "Cardio minimo per non interferire con il recupero. Solo LISS leggero se necessario."
    },
    hypertrophy: {
        frequency: 1,
        maxFrequency: 2,
        preferredType: "LISS",
        hiitAllowed: true,
        duration: 20,
        protocol: "circuit30",
        preferredDays: ["post-upper", "off-day"],
        note: "LISS preferito post-upper body. HIIT solo nei giorni di riposo."
    },
    recomp: {
        frequency: 2,
        maxFrequency: 3,
        preferredType: "mixed",
        hiitAllowed: true,
        hiitDuration: 15,
        lissDuration: 25,
        protocol: "circuit4020",
        preferredDays: ["off-day", "post-upper"],
        note: "Mix di HIIT e LISS per massimizzare il deficit calorico preservando muscolo."
    },
    endurance: {
        frequency: 3,
        maxFrequency: 4,
        preferredType: "HIIT",
        hiitAllowed: true,
        hiitDuration: 20,
        lissDuration: 30,
        protocol: "tabata",
        preferredDays: ["any"],
        note: "Cardio prioritario. Può precedere il resistance training."
    },
    // Tonificazione = perdere grasso tenendo (e un po' costruendo) muscolo, soprattutto
    // glutei e gambe. Perché 2 sessioni a settimana, una HIIT breve e una LISS:
    // - Il cardio aggiunto ai pesi non toglie ipertrofia, ma la forza delle gambe ne risente se
    //   è tanto e fatto vicino alla seduta di gambe (Schumann et al., Sports Med 2022, meta-analisi;
    //   Wilson et al., J Strength Cond Res 2012: l'interferenza cresce con frequenza e durata
    //   del cardio ed è minore in bici/camminata che nella corsa). Quindi: ≤3 sedute, 15-30 min,
    //   a basso impatto, HIIT mai il giorno prima delle gambe (safeDaysForHIIT).
    // - Per la massa grassa HIIT e cardio continuo moderato si equivalgono, con l'HIIT che chiede
    //   circa il 40% del tempo (Wewege et al., Obes Rev 2017; Viana et al., Br J Sports Med 2019).
    //   Alternarli dà il risultato dell'uno e dell'altro senza sommare la fatica di due HIIT.
    // - Per dimagrire servono 150-250 min/sett di attività moderata, pesi compresi (ACSM,
    //   Donnelly et al., Med Sci Sports Exerc 2009): 3 sedute di pesi + 15' HIIT + 30' LISS ci stanno.
    // Il protocollo 30/30 resta sostenibile anche per chi non è allenata all'HIIT.
    toning: {
        frequency: 2,
        maxFrequency: 3,
        preferredType: "mixed",
        hiitAllowed: true,
        hiitDuration: 15,
        lissDuration: 30,
        duration: 25,
        protocol: "circuit30",
        preferredDays: ["off-day", "post-upper"],
        note: "Una HIIT breve e una camminata in salita a settimana, lontano dal giorno di gambe."
    }
};
