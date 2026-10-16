/**
 * GymTracker Pro - Dynamic Warmup Database
 * Specific warmup routines for each muscle group
 *
 * REGOLA DEI NOMI (v2.0, vale anche per conditioningExercises.js)
 * - Italiano da palestra, iniziale maiuscola e il resto minuscolo: "Squat a corpo libero",
 *   "Affondi camminati", "Allungamento del quadricipite in piedi".
 * - stretch → "Allungamento del/dei …", push-up → "Piegamenti", lunge → "Affondi",
 *   bridge → "Ponte", circles → "Circonduzioni"/"Rotazioni", swings → "Slanci",
 *   walk → "Camminata", high knees → "Skip alto", butt kicks → "Corsa calciata",
 *   posizioni dello yoga col nome italiano ("Posizione del bambino", "… del piccione").
 * - Restano in inglese solo i nomi che in una palestra italiana si dicono così (e che la libreria
 *   degli esercizi usa uguali): squat, plank, curl, pushdown, face pull, good morning, superman,
 *   dead bug, bird dog, jumping jack, mountain climber, burpee, crunch, russian twist,
 *   kettlebell, battle rope; i nomi dei giorni (Upper, Lower, Push, Pull, Full Body) e dei
 *   protocolli (Tabata, EMOM).
 * - Durate: "15 rip.", "30 sec", "10 per gamba" (le legge estimateExerciseSeconds).
 * - Riscaldamento e defaticamento si cercano per NOME in exerciseMedia.js: chi rinomina qui
 *   rinomina la chiave in WARMUP_DETAILS/COOLDOWN_DETAILS e aggiunge il vecchio nome agli alias
 *   (WARMUP_NAME_ALIASES/COOLDOWN_NAME_ALIASES), e controlla WARMUP_USEFUL/COOLDOWN_USEFUL qui sotto.
 */

const Warmups = (() => {

const WARMUPS_DB = {
    // ========================================
    // UPPER BODY WARMUPS
    // ========================================

    "upper": {
        name: "Riscaldamento Upper",
        duration: "8-10 minuti",
        exercises: [
            {
                name: "Circonduzioni delle braccia",
                duration: "30 sec per direzione",
                description: "Cerchi con le braccia, prima piccoli poi sempre più grandi",
                sets: 1
            },
            {
                name: "Rotazioni delle spalle",
                duration: "30 sec",
                description: "Rotazioni delle spalle avanti e indietro",
                sets: 1
            },
            {
                name: "Aperture con elastico",
                duration: "15 rip.",
                description: "Con elastico leggero, tira separando le mani",
                sets: 2
            },
            {
                name: "Scivolamenti al muro",
                duration: "10 rip.",
                description: "Schiena al muro, braccia in alto, scivola su e giù",
                sets: 2
            },
            {
                name: "Piegamenti con protrazione",
                duration: "10 rip.",
                description: "Piegamento con una spinta in più delle scapole in alto",
                sets: 1
            },
            {
                name: "Piegamenti scapolari",
                duration: "10 rip.",
                description: "In plank, muovi solo le scapole su e giù",
                sets: 1
            },
            {
                name: "Allungamento gatto-cammello",
                duration: "10 rip.",
                description: "A quattro zampe, alterna inarcamento e flessione della schiena",
                sets: 1
            },
            {
                name: "Rotazioni toraciche",
                duration: "8 rip. per lato",
                description: "A quattro zampe, ruota il busto aprendo il braccio",
                sets: 1
            }
        ]
    },

    "petto": {
        name: "Riscaldamento petto",
        duration: "6-8 minuti",
        exercises: [
            {
                name: "Circonduzioni delle braccia",
                duration: "30 sec per direzione",
                description: "Cerchi con le braccia tese, attiva le spalle",
                sets: 1
            },
            {
                name: "Apertura dinamica del petto",
                duration: "30 sec",
                description: "Braccia indietro, apri il petto dinamicamente",
                sets: 1
            },
            {
                name: "Aperture con elastico",
                duration: "15 rip.",
                description: "Attiva i muscoli della parte alta della schiena e le spalle posteriori",
                sets: 2
            },
            {
                name: "Piegamenti su rialzo",
                duration: "10 rip.",
                description: "Piegamenti facilitati su panca o muro per attivare il petto",
                sets: 2
            },
            {
                name: "Retrazioni scapolari",
                duration: "10 rip.",
                description: "In piedi, stringi le scapole insieme e rilascia",
                sets: 2
            },
            {
                name: "Slanci orizzontali delle braccia",
                duration: "20 rip.",
                description: "Oscilla le braccia incrociandole davanti al petto",
                sets: 1
            }
        ]
    },

    "schiena": {
        name: "Riscaldamento schiena",
        duration: "6-8 minuti",
        exercises: [
            {
                name: "Gatto-cammello",
                duration: "10 rip.",
                description: "Mobilità della colonna vertebrale",
                sets: 1
            },
            {
                name: "Trazioni scapolari",
                duration: "10 rip.",
                description: "Appeso alla sbarra, solleva solo le scapole",
                sets: 2
            },
            {
                name: "Face pull con elastico",
                duration: "15 rip.",
                description: "Con elastico, tira verso il viso",
                sets: 2
            },
            {
                name: "Estensioni toraciche sul rullo",
                duration: "10 rip.",
                description: "Su foam roller, estendi la parte alta della schiena",
                sets: 1
            },
            {
                name: "Superman",
                duration: "20 sec",
                description: "A pancia in giù, solleva braccia e gambe",
                sets: 2
            },
            {
                name: "Allungamento dinamico dei dorsali",
                duration: "30 sec per lato",
                description: "Braccio in alto, inclina lateralmente",
                sets: 1
            }
        ]
    },

    "spalle": {
        name: "Riscaldamento spalle",
        duration: "8-10 minuti",
        exercises: [
            {
                name: "Circonduzioni progressive delle braccia",
                duration: "30 sec per direzione",
                description: "Da piccoli a grandi cerchi",
                sets: 1
            },
            {
                name: "Passaggi sopra la testa",
                duration: "10 rip.",
                description: "Con bastone o elastico, passa sopra la testa",
                sets: 2
            },
            {
                name: "Aperture con elastico",
                duration: "15 rip.",
                description: "Varie angolazioni: alto, medio, basso",
                sets: 3
            },
            {
                name: "Extrarotazioni con elastico",
                duration: "10 rip. per lato",
                description: "Con elastico leggero, rotazione esterna della spalla",
                sets: 2
            },
            {
                name: "Scivolamenti al muro",
                duration: "10 rip.",
                description: "Schiena al muro, scorri le braccia su e giù",
                sets: 2
            },
            {
                name: "Alzate Y-T-W",
                duration: "8 rip. ciascuno",
                description: "Piegato in avanti, forma Y, T, W con le braccia",
                sets: 1
            },
            {
                name: "Alzate a pollici in giù",
                duration: "10 rip.",
                description: "Braccia a 45°, solleva come se svuotassi una lattina",
                sets: 2
            }
        ]
    },

    "bicipiti": {
        name: "Riscaldamento braccia (bicipiti)",
        duration: "4-5 minuti",
        exercises: [
            {
                name: "Rotazioni dei polsi",
                duration: "30 sec",
                description: "Rotazioni dei polsi",
                sets: 1
            },
            {
                name: "Circonduzioni delle braccia",
                duration: "30 sec",
                description: "Cerchi con le braccia per attivare spalle e bicipiti",
                sets: 1
            },
            {
                name: "Curl leggeri con elastico",
                duration: "15 rip.",
                description: "Curl leggeri con elastico per attivazione",
                sets: 2
            },
            {
                name: "Allungamento dinamico del bicipite",
                duration: "30 sec",
                description: "Braccio teso, palmo in giù, tira le dita verso di te",
                sets: 1
            }
        ]
    },

    "tricipiti": {
        name: "Riscaldamento braccia (tricipiti)",
        duration: "4-5 minuti",
        exercises: [
            {
                name: "Circonduzioni delle braccia",
                duration: "30 sec",
                description: "Cerchi con le braccia",
                sets: 1
            },
            {
                name: "Allungamento dinamico del tricipite",
                duration: "30 sec per braccio",
                description: "Braccio dietro la testa, spingi il gomito",
                sets: 1
            },
            {
                name: "Pushdown leggeri con elastico",
                duration: "15 rip.",
                description: "Pushdown leggeri con elastico",
                sets: 2
            },
            {
                name: "Piegamenti a diamante sulle ginocchia",
                duration: "10 rip.",
                description: "Piegamenti facilitati per attivare i tricipiti",
                sets: 1
            }
        ]
    },

    // ========================================
    // LOWER BODY WARMUPS
    // ========================================

    "lower": {
        name: "Riscaldamento Lower",
        duration: "10-12 minuti",
        exercises: [
            {
                name: "Camminata sul posto",
                duration: "60 sec",
                description: "Solleva le ginocchia alternando",
                sets: 1
            },
            {
                name: "Slanci frontali della gamba",
                duration: "10 per gamba",
                description: "Oscilla la gamba avanti e indietro",
                sets: 1
            },
            {
                name: "Slanci laterali della gamba",
                duration: "10 per gamba",
                description: "Oscilla la gamba di lato",
                sets: 1
            },
            {
                name: "Circonduzioni dell'anca",
                duration: "10 per direzione per gamba",
                description: "Cerchi con l'anca, ginocchio sollevato",
                sets: 1
            },
            {
                name: "Squat a corpo libero",
                duration: "15 rip.",
                description: "Squat a corpo libero per attivazione",
                sets: 2
            },
            {
                name: "Affondi camminati",
                duration: "10 per gamba",
                description: "Affondi camminando",
                sets: 1
            },
            {
                name: "Ponte glutei",
                duration: "12 rip.",
                description: "Attivazione glutei",
                sets: 2
            },
            {
                name: "Bruco",
                duration: "6 rip.",
                description: "Da in piedi, cammina con le mani fino a plank e torna",
                sets: 1
            },
            {
                name: "Affondo con rotazione",
                duration: "5 per lato",
                description: "Affondo profondo, ruota il busto e apri il braccio verso l'alto",
                sets: 1
            }
        ]
    },

    "quadricipiti": {
        name: "Riscaldamento quadricipiti",
        duration: "8-10 minuti",
        exercises: [
            {
                name: "Camminata o corsa leggera",
                duration: "2 minuti",
                description: "Riscalda il sistema cardiovascolare",
                sets: 1
            },
            {
                name: "Slanci frontali della gamba",
                duration: "10 per gamba",
                description: "Oscilla la gamba avanti e indietro",
                sets: 1
            },
            {
                name: "Skip alto",
                duration: "30 sec",
                description: "Corsa sul posto con ginocchia alte",
                sets: 1
            },
            {
                name: "Squat a corpo libero",
                duration: "15 rip.",
                description: "Squat profondi a corpo libero",
                sets: 2
            },
            {
                name: "Affondi camminati",
                duration: "10 per gamba",
                description: "Affondi camminando",
                sets: 1
            },
            {
                name: "Allungamento dinamico del quadricipite",
                duration: "30 sec per gamba",
                description: "In piedi, tira il tallone verso il gluteo",
                sets: 1
            },
            {
                name: "Goblet squat con pausa",
                duration: "8 rip.",
                description: "Squat con pausa in basso senza peso",
                sets: 1
            }
        ]
    },

    "femorali": {
        name: "Riscaldamento femorali",
        duration: "8-10 minuti",
        exercises: [
            {
                name: "Camminata leggera",
                duration: "2 minuti",
                description: "Riscaldamento generale",
                sets: 1
            },
            {
                name: "Slanci frontali della gamba",
                duration: "10 per gamba",
                description: "Senti l'allungamento del femorale",
                sets: 1
            },
            {
                name: "Bruco",
                duration: "8 rip.",
                description: "Allungamento dinamico dei femorali",
                sets: 1
            },
            {
                name: "Good morning a corpo libero",
                duration: "12 rip.",
                description: "Attivazione della catena posteriore",
                sets: 2
            },
            {
                name: "Stacco rumeno su una gamba",
                duration: "8 per gamba",
                description: "Senza peso, una gamba alla volta",
                sets: 1
            },
            {
                name: "Ponte camminato",
                duration: "8 rip.",
                description: "In ponte, cammina con i talloni avanti e indietro",
                sets: 1
            },
            {
                name: "Ponte glutei",
                duration: "12 rip.",
                description: "Attivazione glutei e femorali",
                sets: 2
            }
        ]
    },

    "glutei": {
        name: "Riscaldamento glutei",
        duration: "6-8 minuti",
        exercises: [
            {
                name: "Circonduzioni dell'anca",
                duration: "10 per direzione",
                description: "Cerchi con l'anca in piedi",
                sets: 1
            },
            {
                name: "Ponte glutei",
                duration: "15 rip.",
                description: "Attivazione primaria dei glutei",
                sets: 2
            },
            {
                name: "Apertura a conchiglia",
                duration: "12 per lato",
                description: "Sdraiato di lato, apri le ginocchia",
                sets: 2
            },
            {
                name: "Slanci laterali a quattro zampe",
                duration: "10 per lato",
                description: "A quattro zampe, solleva la gamba di lato",
                sets: 1
            },
            {
                name: "Slanci indietro a quattro zampe",
                duration: "10 per lato",
                description: "A quattro zampe, spingi il tallone verso l'alto",
                sets: 1
            },
            {
                name: "Passi laterali con elastico",
                duration: "10 passi per direzione",
                description: "Con elastico alle caviglie, cammina lateralmente",
                sets: 1
            }
        ]
    },

    "polpacci": {
        name: "Riscaldamento polpacci",
        duration: "4-5 minuti",
        exercises: [
            {
                name: "Circonduzioni delle caviglie",
                duration: "10 per direzione per piede",
                description: "Rotazioni della caviglia",
                sets: 1
            },
            {
                name: "Sollevamenti sulle punte",
                duration: "15 rip.",
                description: "Alzate sui talloni a corpo libero",
                sets: 2
            },
            {
                name: "Camminata sulle punte",
                duration: "30 sec",
                description: "Cammina sulle punte dei piedi",
                sets: 1
            },
            {
                name: "Camminata sui talloni",
                duration: "30 sec",
                description: "Cammina sui talloni",
                sets: 1
            },
            {
                name: "Allungamento dinamico del polpaccio",
                duration: "30 sec per gamba",
                description: "Piede indietro, spingi il tallone a terra",
                sets: 1
            }
        ]
    },

    // ========================================
    // CORE WARMUP
    // ========================================

    "addome": {
        name: "Riscaldamento addome",
        duration: "5-6 minuti",
        exercises: [
            {
                name: "Gatto-cammello",
                duration: "10 rip.",
                description: "Mobilità della colonna",
                sets: 1
            },
            {
                name: "Dead bug",
                duration: "8 per lato",
                description: "Attivazione del core profondo",
                sets: 2
            },
            {
                name: "Bird dog",
                duration: "8 per lato",
                description: "Stabilità del core",
                sets: 2
            },
            {
                name: "Plank",
                duration: "30 sec",
                description: "Attivazione isometrica",
                sets: 1
            },
            {
                name: "Rotazioni del bacino",
                duration: "10 per direzione",
                description: "Mobilità dell'anca",
                sets: 1
            },
            {
                name: "Rotazioni del busto",
                duration: "10 per lato",
                description: "Rotazioni del busto",
                sets: 1
            }
        ]
    },

    // ========================================
    // FULL BODY WARMUP
    // ========================================

    "full-body": {
        name: "Riscaldamento Full Body",
        duration: "10-12 minuti",
        exercises: [
            {
                name: "Jumping jack",
                duration: "30 sec",
                description: "Attivazione cardiovascolare",
                sets: 1
            },
            {
                name: "Circonduzioni delle braccia",
                duration: "30 sec per direzione",
                description: "Mobilità spalle",
                sets: 1
            },
            {
                name: "Circonduzioni dell'anca",
                duration: "10 per direzione per gamba",
                description: "Mobilità anche",
                sets: 1
            },
            {
                name: "Slanci delle gambe",
                duration: "10 per gamba (avanti/indietro e laterali)",
                description: "Mobilità gambe",
                sets: 1
            },
            {
                name: "Bruco",
                duration: "6 rip.",
                description: "Mobilità generale e attivazione core",
                sets: 1
            },
            {
                name: "Affondo con rotazione",
                duration: "5 per lato",
                description: "Mobilità completa",
                sets: 1
            },
            {
                name: "Squat a corpo libero",
                duration: "12 rip.",
                description: "Attivazione delle gambe",
                sets: 1
            },
            {
                name: "Piegamenti (anche sulle ginocchia)",
                duration: "10 rip.",
                description: "Attivazione della parte alta",
                sets: 1
            },
            {
                name: "Ponte glutei",
                duration: "12 rip.",
                description: "Attivazione glutei",
                sets: 1
            },
            {
                name: "Mountain climber",
                duration: "30 sec",
                description: "Attivazione finale",
                sets: 1
            }
        ]
    },

    // ========================================
    // PUSH WARMUP (Chest, Shoulders, Triceps)
    // ========================================
    "push": {
        name: "Riscaldamento Push (petto, spalle, tricipiti)",
        duration: "8-10 minuti",
        exercises: [
            {
                name: "Circonduzioni delle braccia",
                duration: "30 sec per direzione",
                description: "Cerchi con le braccia, attiva spalle e cuffia dei rotatori",
                sets: 1
            },
            {
                name: "Rotazioni delle spalle",
                duration: "30 sec",
                description: "Rotazioni delle spalle avanti e indietro",
                sets: 1
            },
            {
                name: "Apertura dinamica del petto",
                duration: "30 sec",
                description: "Braccia indietro, apri il petto dinamicamente",
                sets: 1
            },
            {
                name: "Aperture con elastico",
                duration: "15 rip.",
                description: "Attiva i muscoli stabilizzatori delle spalle",
                sets: 2
            },
            {
                name: "Piegamenti scapolari",
                duration: "10 rip.",
                description: "In plank, muovi solo le scapole su e giù",
                sets: 1
            },
            {
                name: "Piegamenti su rialzo",
                duration: "10 rip.",
                description: "Piegamenti facilitati per attivare petto e tricipiti",
                sets: 2
            },
            {
                name: "Slanci orizzontali delle braccia",
                duration: "20 rip.",
                description: "Oscilla le braccia incrociandole davanti al petto",
                sets: 1
            },
            {
                name: "Allungamento dinamico del tricipite",
                duration: "30 sec per braccio",
                description: "Braccio dietro la testa, spingi il gomito dolcemente",
                sets: 1
            }
        ]
    },

    // ========================================
    // PULL WARMUP (Back, Biceps, Rear Delts)
    // ========================================
    "pull": {
        name: "Riscaldamento Pull (schiena, bicipiti)",
        duration: "8-10 minuti",
        exercises: [
            {
                name: "Allungamento gatto-cammello",
                duration: "10 rip.",
                description: "Mobilità della colonna vertebrale",
                sets: 1
            },
            {
                name: "Circonduzioni delle braccia",
                duration: "30 sec per direzione",
                description: "Attiva spalle e cuffia dei rotatori",
                sets: 1
            },
            {
                name: "Aperture con elastico",
                duration: "15 rip.",
                description: "Attiva romboidi e deltoidi posteriori",
                sets: 2
            },
            {
                name: "Face pull con elastico",
                duration: "15 rip.",
                description: "Con elastico, tira verso il viso attivando trapezio",
                sets: 2
            },
            {
                name: "Trazioni scapolari",
                duration: "10 rip.",
                description: "Appeso alla sbarra, solleva solo le scapole",
                sets: 2
            },
            {
                name: "Allungamento dinamico dei dorsali",
                duration: "30 sec per lato",
                description: "Braccio in alto, inclina lateralmente",
                sets: 1
            },
            {
                name: "Curl leggeri con elastico",
                duration: "15 rip.",
                description: "Curl leggeri con elastico per attivare bicipiti",
                sets: 2
            },
            {
                name: "Rotazioni toraciche",
                duration: "8 rip. per lato",
                description: "A quattro zampe, ruota il busto aprendo il braccio",
                sets: 1
            }
        ]
    },

    // ========================================
    // LEGS QUAD-FOCUSED WARMUP
    // ========================================
    "legs-quad": {
        name: "Riscaldamento gambe (quadricipiti)",
        duration: "10-12 minuti",
        exercises: [
            {
                name: "Camminata sul posto",
                duration: "60 sec",
                description: "Solleva le ginocchia alternando per alzare la temperatura",
                sets: 1
            },
            {
                name: "Skip alto",
                duration: "30 sec",
                description: "Corsa sul posto con ginocchia alte",
                sets: 1
            },
            {
                name: "Slanci frontali della gamba",
                duration: "10 per gamba",
                description: "Oscilla la gamba avanti e indietro",
                sets: 1
            },
            {
                name: "Circonduzioni dell'anca",
                duration: "10 per direzione per gamba",
                description: "Cerchi con l'anca, ginocchio sollevato",
                sets: 1
            },
            {
                name: "Squat a corpo libero",
                duration: "15 rip.",
                description: "Squat profondi a corpo libero, enfasi sui quadricipiti",
                sets: 2
            },
            {
                name: "Affondi camminati",
                duration: "10 per gamba",
                description: "Affondi camminando per attivare i quadricipiti",
                sets: 1
            },
            {
                name: "Goblet squat con pausa",
                duration: "8 rip.",
                description: "Squat con pausa in basso senza peso, allungamento attivo",
                sets: 1
            },
            {
                name: "Ponte glutei",
                duration: "12 rip.",
                description: "Attivazione glutei per supporto",
                sets: 1
            }
        ]
    },

    // ========================================
    // LEGS HAMSTRING-FOCUSED WARMUP
    // ========================================
    "legs-hamstring": {
        name: "Riscaldamento gambe (femorali e glutei)",
        duration: "10-12 minuti",
        exercises: [
            {
                name: "Camminata leggera",
                duration: "90 sec",
                description: "Riscaldamento generale del sistema",
                sets: 1
            },
            {
                name: "Slanci frontali della gamba",
                duration: "12 per gamba",
                description: "Senti l'allungamento del femorale quando la gamba torna indietro",
                sets: 1
            },
            {
                name: "Slanci laterali della gamba",
                duration: "10 per gamba",
                description: "Mobilità adduttori e abduttori",
                sets: 1
            },
            {
                name: "Bruco",
                duration: "8 rip.",
                description: "Allungamento dinamico dei femorali",
                sets: 1
            },
            {
                name: "Good morning a corpo libero",
                duration: "12 rip.",
                description: "Attivazione della catena posteriore",
                sets: 2
            },
            {
                name: "Ponte glutei",
                duration: "15 rip.",
                description: "Attivazione primaria glutei e femorali",
                sets: 2
            },
            {
                name: "Stacco rumeno su una gamba",
                duration: "8 per gamba",
                description: "Senza peso, una gamba alla volta: attiva la catena posteriore",
                sets: 1
            },
            {
                name: "Affondo con rotazione",
                duration: "5 per lato",
                description: "Mobilità completa con enfasi sui flessori dell'anca",
                sets: 1
            }
        ]
    }
};

// ========================================
// DAL TIPO DI GIORNO ALLA ROUTINE
// ========================================

// Tipo del giorno ("Push B", "Lower A", "Full Body E", "upper-a", "Glute Burn", nomi liberi
// del costruttore...) → chiave di routine. Le lettere di variante non cambiano la routine,
// tranne Lower A (quadricipiti) e Lower/Legs B (femorali). Nulla di riconosciuto: full-body.
function resolveRoutineKey(workoutType) {
    const t = String(workoutType || '').toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (!t) return 'full-body';
    if (/^lower a$/.test(t)) return 'legs-quad';
    if (/^(lower|legs) b$/.test(t)) return 'legs-hamstring';
    if (/\bpush\b|spinta/.test(t)) return 'push';
    if (/\bpull\b|trazion|tirata/.test(t)) return 'pull';
    if (/\b(lower|legs?)\b|gambe|inferiore/.test(t)) return 'lower';
    if (/glute|glutei/.test(t)) return 'glutei';
    if (/\bfull\b|total|complet/.test(t)) return 'full-body';
    if (/\barms?\b|braccia/.test(t) && /shoulder|spalle/.test(t)) return 'upper';
    if (/\bupper\b|superiore/.test(t)) return 'upper';
    if (/chest|petto/.test(t)) return 'petto';
    if (/\bback\b|schiena|dorso/.test(t)) return 'schiena';
    if (/shoulder|spalle/.test(t)) return 'spalle';
    if (/tricip/.test(t)) return 'tricipiti';
    if (/\barms?\b|braccia|bicip/.test(t)) return 'bicipiti';
    if (/quad/.test(t)) return 'quadricipiti';
    if (/femoral|hamstring/.test(t)) return 'femorali';
    if (/calf|calves|polpacc/.test(t)) return 'polpacci';
    if (/\bcore\b|\babs?\b|addom|addome/.test(t)) return 'addome';
    return 'full-body';
}

// Defaticamento che corrisponde a un riscaldamento: stesse chiavi, tranne quelle che il
// database degli stretching non ha (tricipiti → braccia, polpacci → lower body)
const COOLDOWN_FOR_WARMUP = { tricipiti: 'bicipiti', polpacci: 'lower' };
// Per il giorno dei glutei il riscaldamento è di attivazione, il defaticamento completo
const COOLDOWN_FOR_TYPE = { glutei: 'lower' };

// Function to get warmup for a workout type
function getWarmupForWorkout(workoutType) {
    return WARMUPS_DB[resolveRoutineKey(workoutType)] || WARMUPS_DB["full-body"];
}

// Function to get warmup for specific muscle groups
function getWarmupForMuscles(primaryMuscles) {
    if (!Array.isArray(primaryMuscles)) primaryMuscles = [];
    // If multiple muscles, check which warmup covers the most
    // Push muscles (chest, shoulders, triceps)
    if (primaryMuscles.includes("petto") && primaryMuscles.includes("spalle")) {
        return WARMUPS_DB["push"];
    }
    if (primaryMuscles.includes("petto") || primaryMuscles.includes("spalle") ||
        primaryMuscles.includes("tricipiti")) {
        return WARMUPS_DB["upper"];
    }
    // Pull muscles (back, biceps)
    if (primaryMuscles.includes("schiena") && primaryMuscles.includes("bicipiti")) {
        return WARMUPS_DB["pull"];
    }
    if (primaryMuscles.includes("schiena") || primaryMuscles.includes("bicipiti")) {
        return WARMUPS_DB["schiena"];
    }
    // Lower body - check focus
    if (primaryMuscles.includes("quadricipiti") && !primaryMuscles.includes("femorali")) {
        return WARMUPS_DB["legs-quad"];
    }
    if (primaryMuscles.includes("femorali") && !primaryMuscles.includes("quadricipiti")) {
        return WARMUPS_DB["legs-hamstring"];
    }
    if (primaryMuscles.includes("quadricipiti") || primaryMuscles.includes("femorali") ||
        primaryMuscles.includes("glutei")) {
        return WARMUPS_DB["lower"];
    }
    if (primaryMuscles.includes("addome")) {
        return WARMUPS_DB["addome"];
    }

    // Default
    return WARMUPS_DB["full-body"];
}

// Get specific warmup by muscle
function getWarmupByMuscle(muscle) {
    return WARMUPS_DB[muscle] || WARMUPS_DB["full-body"];
}

// ========================================
// STATIC STRETCHING DATABASE (POST-WORKOUT)
// ========================================

const COOLDOWN_DB = {
    "upper": {
        name: "Defaticamento Upper",
        duration: "8-10 minuti",
        exercises: [
            {
                name: "Allungamento del petto allo stipite",
                duration: "30 sec per lato",
                description: "Braccio contro lo stipite, ruota il corpo per allungare il petto"
            },
            {
                name: "Allungamento spalla a braccio incrociato",
                duration: "30 sec per braccio",
                description: "Tira il braccio attraverso il petto con l'altro braccio"
            },
            {
                name: "Allungamento del tricipite",
                duration: "30 sec per braccio",
                description: "Braccio dietro la testa, spingi il gomito con l'altra mano"
            },
            {
                name: "Allungamento del braccio al muro",
                duration: "30 sec per braccio",
                description: "Palmo contro il muro, ruota il corpo per allungare il bicipite"
            },
            {
                name: "Allungamento dei dorsali",
                duration: "30 sec per lato",
                description: "Braccio in alto, inclina lateralmente il busto"
            },
            {
                name: "Allungamento del collo",
                duration: "20 sec per direzione",
                description: "Inclina la testa lateralmente e in avanti, delicatamente"
            },
            {
                name: "Allungamento della schiena alta",
                duration: "30 sec",
                description: "Mani intrecciate davanti, arrotonda la schiena spingendo in avanti"
            },
            {
                name: "Posizione del bambino",
                duration: "45 sec",
                description: "In ginocchio, siediti sui talloni e allunga le braccia in avanti"
            }
        ]
    },

    "lower": {
        name: "Defaticamento Lower",
        duration: "10-12 minuti",
        exercises: [
            {
                name: "Allungamento del quadricipite in piedi",
                duration: "30 sec per gamba",
                description: "In piedi, tira il tallone verso il gluteo"
            },
            {
                name: "Allungamento dei femorali in piedi",
                duration: "30 sec per gamba",
                description: "Piede su rialzo, piegati in avanti con schiena dritta"
            },
            {
                name: "Affondo per i flessori dell'anca",
                duration: "30 sec per lato",
                description: "In affondo, spingi il bacino in avanti"
            },
            {
                name: "Posizione del piccione",
                duration: "45 sec per lato",
                description: "Gamba piegata davanti, l'altra distesa dietro"
            },
            {
                name: "Allungamento a farfalla",
                duration: "45 sec",
                description: "Seduto, piante dei piedi unite, spingi le ginocchia verso il basso"
            },
            {
                name: "Flessione del busto da seduto",
                duration: "45 sec",
                description: "Gambe distese, piegati in avanti verso le punte"
            },
            {
                name: "Allungamento a figura 4",
                duration: "30 sec per lato",
                description: "Sdraiato, caviglia sulla coscia opposta, tira verso di te"
            },
            {
                name: "Allungamento del polpaccio",
                duration: "30 sec per gamba",
                description: "Piede indietro, tallone a terra, spingi contro il muro"
            },
            {
                name: "Torsione da sdraiato",
                duration: "30 sec per lato",
                description: "Sdraiato, ginocchia da un lato, spalle a terra"
            }
        ]
    },

    "petto": {
        name: "Defaticamento petto",
        duration: "5-6 minuti",
        exercises: [
            {
                name: "Allungamento del petto alla porta",
                duration: "30 sec per lato",
                description: "Avambraccio contro lo stipite, fai un passo avanti"
            },
            {
                name: "Apertura del petto",
                duration: "30 sec",
                description: "Mani intrecciate dietro la schiena, petto in fuori"
            },
            {
                name: "Allungamento del petto a terra",
                duration: "30 sec per lato",
                description: "A pancia in giù, braccio a 90°, ruota il corpo"
            },
            {
                name: "Allungamento del petto all'angolo",
                duration: "45 sec",
                description: "Mani sulle pareti di un angolo, piegati in avanti"
            }
        ]
    },

    "schiena": {
        name: "Defaticamento schiena",
        duration: "6-8 minuti",
        exercises: [
            {
                name: "Allungamento gatto-cammello",
                duration: "10 ripetizioni lente",
                description: "A quattro zampe, alterna inarcamento e flessione"
            },
            {
                name: "Posizione del bambino",
                duration: "45 sec",
                description: "Seduto sui talloni, braccia distese in avanti"
            },
            {
                name: "Allungamento dei dorsali",
                duration: "30 sec per lato",
                description: "In ginocchio, braccio disteso in avanti, ruota il busto"
            },
            {
                name: "Torsione da seduto",
                duration: "30 sec per lato",
                description: "Seduto, ruota il busto, gomito fuori dal ginocchio opposto"
            },
            {
                name: "Allungamento ginocchio al petto",
                duration: "30 sec per gamba",
                description: "Sdraiato, tira un ginocchio al petto"
            },
            {
                name: "Posizione del cobra",
                duration: "30 sec",
                description: "A pancia in giù, solleva il petto con le braccia"
            }
        ]
    },

    "spalle": {
        name: "Defaticamento spalle",
        duration: "5-6 minuti",
        exercises: [
            {
                name: "Braccio incrociato al petto",
                duration: "30 sec per braccio",
                description: "Tira il braccio attraverso il petto"
            },
            {
                name: "Allungamento di tricipite e spalla",
                duration: "30 sec per braccio",
                description: "Braccio dietro la testa, spingi il gomito"
            },
            {
                name: "Infila l'ago",
                duration: "30 sec per lato",
                description: "A quattro zampe, passa il braccio sotto il corpo"
            },
            {
                name: "Braccia dell'aquila",
                duration: "30 sec per lato",
                description: "Braccia incrociate davanti, gomiti uniti"
            },
            {
                name: "Allungamento della spalla al muro",
                duration: "30 sec per braccio",
                description: "Mano sul muro all'altezza della spalla, ruota"
            }
        ]
    },

    "bicipiti": {
        name: "Defaticamento braccia",
        duration: "4-5 minuti",
        exercises: [
            {
                name: "Allungamento del bicipite al muro",
                duration: "30 sec per braccio",
                description: "Palmo sul muro dietro di te, ruota il corpo"
            },
            {
                name: "Allungamento del bicipite da seduto",
                duration: "30 sec",
                description: "Mani a terra dietro di te, dita verso l'esterno, siediti indietro"
            },
            {
                name: "Allungamento del tricipite",
                duration: "30 sec per braccio",
                description: "Braccio dietro la testa, spingi il gomito"
            },
            {
                name: "Allungamento dei flessori del polso",
                duration: "20 sec per mano",
                description: "Braccio teso, tira le dita verso di te"
            },
            {
                name: "Allungamento degli estensori del polso",
                duration: "20 sec per mano",
                description: "Braccio teso, spingi le dita verso il basso"
            }
        ]
    },

    "quadricipiti": {
        name: "Defaticamento quadricipiti",
        duration: "5-6 minuti",
        exercises: [
            {
                name: "Allungamento del quadricipite in piedi",
                duration: "30 sec per gamba",
                description: "Tira il tallone verso il gluteo"
            },
            {
                name: "Allungamento del quadricipite in ginocchio",
                duration: "30 sec per gamba",
                description: "In ginocchio su una gamba, tira il piede posteriore"
            },
            {
                name: "Allungamento del quadricipite sul fianco",
                duration: "30 sec per gamba",
                description: "Su un fianco, tira il tallone verso il gluteo"
            },
            {
                name: "Allungamento del quadricipite al muro",
                duration: "45 sec per gamba",
                description: "Ginocchio a terra, piede contro il muro dietro di te"
            }
        ]
    },

    "femorali": {
        name: "Defaticamento femorali",
        duration: "6-8 minuti",
        exercises: [
            {
                name: "Tocco delle punte in piedi",
                duration: "30 sec",
                description: "In piedi, piegati verso le punte dei piedi"
            },
            {
                name: "Flessione del busto da seduto",
                duration: "45 sec",
                description: "Gambe distese, piegati verso le punte"
            },
            {
                name: "Flessione del busto su una gamba",
                duration: "30 sec per gamba",
                description: "Una gamba distesa, l'altra piegata, piegati verso la punta"
            },
            {
                name: "Allungamento dei femorali da sdraiato",
                duration: "30 sec per gamba",
                description: "Sdraiato, tira la gamba verso di te con le mani o una fascia"
            },
            {
                name: "Allungamento dei femorali in piedi",
                duration: "30 sec per gamba",
                description: "Piede su rialzo, piegati in avanti"
            }
        ]
    },

    "glutei": {
        name: "Defaticamento glutei",
        duration: "5-6 minuti",
        exercises: [
            {
                name: "Allungamento a figura 4",
                duration: "30 sec per lato",
                description: "Sdraiato, caviglia sulla coscia opposta, tira"
            },
            {
                name: "Posizione del piccione",
                duration: "45 sec per lato",
                description: "Gamba piegata davanti, l'altra distesa dietro"
            },
            {
                name: "Ginocchio al petto",
                duration: "30 sec per gamba",
                description: "Sdraiato, abbraccia il ginocchio al petto"
            },
            {
                name: "Allungamento dei glutei da seduto",
                duration: "30 sec per lato",
                description: "Seduto, caviglia sulla coscia opposta, piegati in avanti"
            }
        ]
    },

    "addome": {
        name: "Defaticamento addome",
        duration: "4-5 minuti",
        exercises: [
            {
                name: "Posizione del cobra",
                duration: "30 sec",
                description: "A pancia in giù, solleva il petto con le braccia"
            },
            {
                name: "Allungamento laterale da sdraiato",
                duration: "30 sec per lato",
                description: "Sdraiato, braccia sopra la testa, inclinati lateralmente"
            },
            {
                name: "Gatto-cammello",
                duration: "10 ripetizioni",
                description: "Mobilità della colonna"
            },
            {
                name: "Torsione da sdraiato",
                duration: "30 sec per lato",
                description: "Sdraiato, ginocchia da un lato, spalle a terra"
            }
        ]
    },

    "full-body": {
        name: "Defaticamento completo",
        duration: "10-12 minuti",
        exercises: [
            {
                name: "Rotazioni del collo",
                duration: "30 sec",
                description: "Rotazioni lente del collo"
            },
            {
                name: "Allungamento della spalla",
                duration: "30 sec per braccio",
                description: "Braccio attraverso il petto"
            },
            {
                name: "Allungamento del tricipite",
                duration: "30 sec per braccio",
                description: "Braccio dietro la testa"
            },
            {
                name: "Apertura del petto",
                duration: "30 sec",
                description: "Mani dietro la schiena, petto in fuori"
            },
            {
                name: "Gatto-cammello",
                duration: "10 ripetizioni",
                description: "Mobilità spinale"
            },
            {
                name: "Posizione del bambino",
                duration: "45 sec",
                description: "Rilassamento schiena"
            },
            {
                name: "Allungamento dei flessori dell'anca",
                duration: "30 sec per lato",
                description: "Affondo con bacino in avanti"
            },
            {
                name: "Allungamento del quadricipite",
                duration: "30 sec per gamba",
                description: "Tallone verso il gluteo"
            },
            {
                name: "Allungamento dei femorali",
                duration: "30 sec per gamba",
                description: "Piede avanti, piegati verso la punta"
            },
            {
                name: "Figura 4",
                duration: "30 sec per lato",
                description: "Allunga i glutei"
            },
            {
                name: "Allungamento del polpaccio",
                duration: "30 sec per gamba",
                description: "Tallone a terra, spingi contro il muro"
            },
            {
                name: "Respirazione profonda",
                duration: "60 sec",
                description: "Respiri profondi per rilassare il sistema nervoso"
            }
        ]
    },

    // ========================================
    // PUSH COOLDOWN (Chest, Shoulders, Triceps)
    // ========================================
    "push": {
        name: "Defaticamento Push (petto, spalle, tricipiti)",
        duration: "6-8 minuti",
        exercises: [
            {
                name: "Allungamento del petto allo stipite",
                duration: "30 sec per lato",
                description: "Avambraccio contro lo stipite, fai un passo avanti per allungare il petto"
            },
            {
                name: "Allungamento del petto a terra",
                duration: "30 sec per lato",
                description: "A pancia in giù, braccio a 90°, ruota il corpo"
            },
            {
                name: "Allungamento spalla a braccio incrociato",
                duration: "30 sec per braccio",
                description: "Tira il braccio attraverso il petto"
            },
            {
                name: "Allungamento del tricipite sopra la testa",
                duration: "30 sec per braccio",
                description: "Braccio dietro la testa, spingi il gomito"
            },
            {
                name: "Braccia dell'aquila",
                duration: "30 sec per lato",
                description: "Braccia incrociate davanti, gomiti uniti: allunga le spalle"
            },
            {
                name: "Posizione del bambino",
                duration: "45 sec",
                description: "Rilassamento completo spalle e petto"
            },
            {
                name: "Respirazione profonda",
                duration: "30 sec",
                description: "Respiri profondi per rilassare"
            }
        ]
    },

    // ========================================
    // PULL COOLDOWN (Back, Biceps)
    // ========================================
    "pull": {
        name: "Defaticamento Pull (schiena, bicipiti)",
        duration: "6-8 minuti",
        exercises: [
            {
                name: "Allungamento gatto-cammello",
                duration: "10 ripetizioni lente",
                description: "Mobilità della colonna vertebrale"
            },
            {
                name: "Posizione del bambino",
                duration: "45 sec",
                description: "Allunga i dorsali e la zona lombare"
            },
            {
                name: "Allungamento dei dorsali",
                duration: "30 sec per lato",
                description: "In ginocchio, braccio disteso, inclina il busto lateralmente"
            },
            {
                name: "Torsione da seduto",
                duration: "30 sec per lato",
                description: "Seduto, ruota il busto per allungare la schiena"
            },
            {
                name: "Allungamento del bicipite al muro",
                duration: "30 sec per braccio",
                description: "Palmo sul muro dietro di te, ruota il corpo"
            },
            {
                name: "Allungamento del bicipite da seduto",
                duration: "30 sec",
                description: "Mani a terra dietro di te, siediti indietro"
            },
            {
                name: "Allungamento della schiena alta",
                duration: "30 sec",
                description: "Mani intrecciate davanti, arrotonda la schiena"
            },
            {
                name: "Respirazione profonda",
                duration: "30 sec",
                description: "Respiri profondi per rilassare"
            }
        ]
    },

    // ========================================
    // LEGS QUAD-FOCUSED COOLDOWN
    // ========================================
    "legs-quad": {
        name: "Defaticamento gambe (quadricipiti)",
        duration: "8-10 minuti",
        exercises: [
            {
                name: "Allungamento del quadricipite in piedi",
                duration: "30 sec per gamba",
                description: "In piedi, tira il tallone verso il gluteo"
            },
            {
                name: "Allungamento del quadricipite in ginocchio",
                duration: "45 sec per gamba",
                description: "In ginocchio su una gamba, tira il piede posteriore verso il gluteo"
            },
            {
                name: "Allungamento del quadricipite al muro",
                duration: "45 sec per gamba",
                description: "Ginocchio a terra, piede contro il muro dietro di te"
            },
            {
                name: "Allungamento dei flessori dell'anca",
                duration: "30 sec per lato",
                description: "In affondo, spingi il bacino in avanti"
            },
            {
                name: "Allungamento a farfalla",
                duration: "45 sec",
                description: "Seduto, piante dei piedi unite, spingi le ginocchia verso il basso"
            },
            {
                name: "Torsione da sdraiato",
                duration: "30 sec per lato",
                description: "Sdraiato, ginocchia da un lato, spalle a terra"
            },
            {
                name: "Respirazione profonda",
                duration: "30 sec",
                description: "Respiri profondi per rilassare"
            }
        ]
    },

    // ========================================
    // LEGS HAMSTRING-FOCUSED COOLDOWN
    // ========================================
    "legs-hamstring": {
        name: "Defaticamento gambe (femorali e glutei)",
        duration: "8-10 minuti",
        exercises: [
            {
                name: "Tocco delle punte in piedi",
                duration: "30 sec",
                description: "In piedi, piegati verso le punte dei piedi"
            },
            {
                name: "Flessione del busto da seduto",
                duration: "45 sec",
                description: "Gambe distese, piegati verso le punte"
            },
            {
                name: "Flessione del busto su una gamba",
                duration: "30 sec per gamba",
                description: "Una gamba distesa, l'altra piegata, piegati verso la punta"
            },
            {
                name: "Allungamento a figura 4",
                duration: "45 sec per lato",
                description: "Sdraiato, caviglia sulla coscia opposta, tira verso di te"
            },
            {
                name: "Posizione del piccione",
                duration: "45 sec per lato",
                description: "Allungamento profondo di glutei e flessori dell'anca"
            },
            {
                name: "Allungamento dei femorali da sdraiato",
                duration: "30 sec per gamba",
                description: "Sdraiato, tira la gamba verso di te con le mani"
            },
            {
                name: "Allungamento dei flessori dell'anca",
                duration: "30 sec per lato",
                description: "In affondo, spingi il bacino in avanti"
            },
            {
                name: "Respirazione profonda",
                duration: "30 sec",
                description: "Respiri profondi per rilassare"
            }
        ]
    }
};

// ========================================
// SERIE E DURATE NUMERICHE (letti dall'app e dall'algoritmo)
// ========================================

const REP_SECONDS = 3;          // una ripetizione lenta di mobilità
const SET_REST_SECONDS = 15;    // pausa fra due serie dello stesso esercizio
const CHANGE_SECONDS = 15;      // cambio di esercizio

// Secondi di UNA serie, ricavati dalla durata scritta:
// "30 sec per lato" → 60, "2 minuti" → 120, "10 per gamba" → 60, "15 reps" → 45
function estimateExerciseSeconds(ex) {
    const d = String(ex && ex.duration || '').toLowerCase();
    let sides = 1;
    if (/per direzione per (gamba|piede)/.test(d)) sides = 4;
    else if (/ciascun/.test(d)) sides = 3;
    else if (/per (lato|gamba|braccio|direzione|piede|mano)/.test(d)) sides = 2;
    let m;
    if ((m = d.match(/(\d+)\s*minut/))) return Number(m[1]) * 60;
    if ((m = d.match(/(\d+)\s*sec/))) return Number(m[1]) * sides;
    if ((m = d.match(/(\d+)/))) return Number(m[1]) * REP_SECONDS * sides;
    return 30;
}

// Ogni esercizio ha `sets` (intero ≥1) e `durationSec` (una serie); ogni routine ha
// `durationMin` (numero) e `duration` coerente ("9 min"). Calcolato una volta al caricamento,
// così resta giusto anche se si cambiano gli esercizi.
function normalizeRoutines(db) {
    Object.values(db).forEach(routine => {
        let total = 0;
        routine.exercises.forEach(ex => {
            const sets = Math.round(Number(ex.sets));
            ex.sets = Number.isFinite(sets) && sets >= 1 ? sets : 1;
            ex.durationSec = estimateExerciseSeconds(ex);
            total += ex.sets * ex.durationSec + (ex.sets - 1) * SET_REST_SECONDS + CHANGE_SECONDS;
        });
        routine.durationMin = Math.max(1, Math.round(total / 60));
        routine.duration = `${routine.durationMin} min`;
    });
}
normalizeRoutines(WARMUPS_DB);
normalizeRoutines(COOLDOWN_DB);

// Minuti del riscaldamento con quella chiave (day.warmup); chiave sconosciuta → full-body
function getWarmupDurationMin(key) {
    return (WARMUPS_DB[key] || WARMUPS_DB["full-body"]).durationMin;
}

// Defaticamento coerente col riscaldamento del giorno (day.warmup):
// legs-quad → legs-quad, legs-hamstring → legs-hamstring, push → push, upper → upper, ...
function getCooldownByKey(warmupKey) {
    const key = COOLDOWN_FOR_WARMUP[warmupKey] || warmupKey;
    return COOLDOWN_DB[key] || COOLDOWN_DB["full-body"];
}

function getCooldownDurationMin(warmupKey) {
    return getCooldownByKey(warmupKey).durationMin;
}

// ========================================
// ROUTINE RIDOTTE PER LA DURATA DELLA SEDUTA (algoritmo v2)
// ========================================
// In una seduta corta conta il lavoro: riscaldamento e defaticamento GENERALI hanno un tetto
// proporzionale alla durata scelta (il riscaldamento specifico — la rampa del primo esercizio —
// è a parte). Per risparmiare tempo basta quello specifico (Iversen 2021); quello generale serve
// ad alzare la temperatura e a muovere le articolazioni della seduta (Fradkin 2010).

// Minuti di riscaldamento generale per la durata della seduta: 45' → 6, 60' → 7, 75' → 8, 90' → 10
function getWarmupBudgetMin(sessionMinutes) {
    const m = Number(sessionMinutes) || 60;
    return m < 45 ? 5 : (m < 60 ? 6 : (m < 75 ? 7 : (m < 90 ? 8 : 10)));
}

// Minuti di defaticamento: 45' → 3, 60' → 4, 75' e oltre → 5
function getCooldownBudgetMin(sessionMinutes) {
    const m = Number(sessionMinutes) || 60;
    return m < 60 ? 3 : (m < 75 ? 4 : 5);
}

// Utilità di un esercizio di riscaldamento: prima i movimenti che preparano gli esercizi della
// seduta (accosciate, cerniere, ponti, spinte, tirate con elastico, attivazione delle scapole e dei
// glutei), poi la mobilità generale e l'attivazione cardiovascolare, per ultimi i movimenti di
// contorno (cerchi con i polsi, rotazioni delle spalle, collo, caviglie).
// Si leggono sul NOME italiano: rinominando un esercizio, controllare che resti nel suo livello
// (con i nomi inglesi della v1.25 la scelta era identica a questa).
const WARMUP_USEFUL = [
    [3, /squat|affond|ponte|good morning|stacco|piegament|aperture con elastico|face pull|scapolar|scivolament|elastico|alzate|bruco|dead bug|bird dog|conchiglia|passaggi|toracic/i],
    [2, /slanci|circonduzioni dell'anca|rotazioni del (bacino|busto)|skip|jumping|camminata (sul posto|leggera|o corsa)|mountain|superman|gatto-cammello|sollevamenti sulle punte|dorsali|apertura dinamica|dinamico del tricipite/i],
    [1, /./]
];
// Defaticamento: gli allungamenti dei muscoli della seduta prima del respiro e del collo
const COOLDOWN_USEFUL = [
    [1, /respir|collo/i],
    [2, /./]
];

function usefulness(ex, table, index) {
    const name = String(ex && ex.name || '');
    for (const [score, re] of table) if (re.test(name)) return score * 100 - index;   // a parità, l'ordine della routine
    return -index;
}

// Routine ridotta: sceglie per utilità finché la durata VERA sta nel tetto (si può scendere a una
// serie), poi le rimette nell'ordine originale. Non modifica il database.
function reduceRoutine(routine, budgetMin, table) {
    const budgetSec = Math.max(1, budgetMin) * 60;
    const items = routine.exercises.map((ex, i) => ({ ex, i, u: usefulness(ex, table, i) }));
    const cost = (ex, sets) => sets * ex.durationSec + (sets - 1) * SET_REST_SECONDS + CHANGE_SECONDS;
    const chosen = [];
    let total = 0;
    items.slice().sort((a, b) => b.u - a.u).forEach(it => {
        for (let sets = it.ex.sets; sets >= 1; sets--) {
            const c = cost(it.ex, sets);
            if (total + c <= budgetSec) { chosen.push({ ...it, sets }); total += c; return; }
        }
    });
    chosen.sort((a, b) => a.i - b.i);
    const exercises = chosen.map(c => ({ ...c.ex, sets: c.sets }));
    const durationMin = Math.max(1, Math.round(total / 60));
    return {
        ...routine,
        exercises,
        durationMin: Math.min(durationMin, budgetMin),
        duration: `${Math.min(durationMin, budgetMin)} min`,
        budgetMin,
        fullDurationMin: routine.durationMin,
        reduced: exercises.length < routine.exercises.length || chosen.some(c => c.sets < c.ex.sets)
    };
}

// Riscaldamento generale per il giorno (chiave = day.warmup) ridotto alla durata della seduta
function getWarmupForDuration(key, sessionMinutes) {
    const routine = WARMUPS_DB[key] || WARMUPS_DB["full-body"];
    const budget = getWarmupBudgetMin(sessionMinutes);
    if (routine.durationMin <= budget) return { ...routine, exercises: routine.exercises.map(e => ({ ...e })), budgetMin: budget, fullDurationMin: routine.durationMin, reduced: false };
    return reduceRoutine(routine, budget, WARMUP_USEFUL);
}

// Defaticamento coerente col riscaldamento del giorno, ridotto alla durata della seduta
function getCooldownForDuration(warmupKey, sessionMinutes) {
    const routine = getCooldownByKey(warmupKey);
    const budget = getCooldownBudgetMin(sessionMinutes);
    if (routine.durationMin <= budget) return { ...routine, exercises: routine.exercises.map(e => ({ ...e })), budgetMin: budget, fullDurationMin: routine.durationMin, reduced: false };
    return reduceRoutine(routine, budget, COOLDOWN_USEFUL);
}

// Get cooldown for workout type (ripiego quando il giorno non ha `warmup`)
function getCooldownForWorkout(workoutType) {
    const key = resolveRoutineKey(workoutType);
    return getCooldownByKey(COOLDOWN_FOR_TYPE[key] || key);
}

// Get cooldown by muscle groups trained
function getCooldownForMuscles(muscles) {
    if (!muscles || muscles.length === 0) {
        return COOLDOWN_DB["full-body"];
    }

    // Check which body part was most trained
    const upperMuscles = ["petto", "schiena", "spalle", "bicipiti", "tricipiti"];
    const lowerMuscles = ["quadricipiti", "femorali", "glutei", "polpacci"];

    let upperCount = 0;
    let lowerCount = 0;

    muscles.forEach(m => {
        if (upperMuscles.includes(m)) upperCount++;
        if (lowerMuscles.includes(m)) lowerCount++;
    });

    if (upperCount > lowerCount) {
        return COOLDOWN_DB["upper"];
    } else if (lowerCount > upperCount) {
        return COOLDOWN_DB["lower"];
    }

    return COOLDOWN_DB["full-body"];
}

// Get specific cooldown by muscle
function getCooldownByMuscle(muscle) {
    return COOLDOWN_DB[muscle] || COOLDOWN_DB["full-body"];
}

// Public API
return {
    WARMUPS_DB,
    COOLDOWN_DB,
    getWarmupForWorkout,
    getWarmupForMuscles,
    getWarmupByMuscle,
    getWarmupDurationMin,
    getCooldownForWorkout,
    getCooldownForMuscles,
    getCooldownByMuscle,
    getCooldownByKey,
    getCooldownDurationMin,
    resolveRoutineKey,
    getWarmupBudgetMin,
    getCooldownBudgetMin,
    getWarmupForDuration,
    getCooldownForDuration
};

})();
