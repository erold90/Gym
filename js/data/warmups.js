/**
 * GymTracker Pro - Dynamic Warmup Database
 * Specific warmup routines for each muscle group
 */

const Warmups = (() => {

const WARMUPS_DB = {
    // ========================================
    // UPPER BODY WARMUPS
    // ========================================

    "upper": {
        name: "Riscaldamento Upper Body",
        duration: "8-10 minuti",
        exercises: [
            {
                name: "Arm Circles",
                duration: "30 sec per direzione",
                description: "Cerchi con le braccia, prima piccoli poi sempre più grandi",
                sets: 1
            },
            {
                name: "Shoulder Rolls",
                duration: "30 sec",
                description: "Rotazioni delle spalle avanti e indietro",
                sets: 1
            },
            {
                name: "Band Pull-Apart",
                duration: "15 reps",
                description: "Con elastico leggero, tira separando le mani",
                sets: 2
            },
            {
                name: "Wall Slides",
                duration: "10 reps",
                description: "Schiena al muro, braccia in alto, scivola su e giù",
                sets: 2
            },
            {
                name: "Push-Up Plus",
                duration: "10 reps",
                description: "Push-up con protrazione extra delle scapole in alto",
                sets: 1
            },
            {
                name: "Scapular Push-Ups",
                duration: "10 reps",
                description: "In plank, muovi solo le scapole su e giù",
                sets: 1
            },
            {
                name: "Cat-Cow Stretch",
                duration: "10 reps",
                description: "A quattro zampe, alterna inarcamento e flessione della schiena",
                sets: 1
            },
            {
                name: "Thoracic Rotations",
                duration: "8 reps per lato",
                description: "A quattro zampe, ruota il busto aprendo il braccio",
                sets: 1
            }
        ]
    },

    "petto": {
        name: "Riscaldamento Petto",
        duration: "6-8 minuti",
        exercises: [
            {
                name: "Arm Circles",
                duration: "30 sec per direzione",
                description: "Cerchi con le braccia tese, attiva le spalle",
                sets: 1
            },
            {
                name: "Dynamic Chest Stretch",
                duration: "30 sec",
                description: "Braccia indietro, apri il petto dinamicamente",
                sets: 1
            },
            {
                name: "Band Pull-Apart",
                duration: "15 reps",
                description: "Attiva i muscoli della parte alta della schiena e le spalle posteriori",
                sets: 2
            },
            {
                name: "Incline Push-Up",
                duration: "10 reps",
                description: "Push-up facilitati su panca o muro per attivare il petto",
                sets: 2
            },
            {
                name: "Scapular Retraction",
                duration: "10 reps",
                description: "In piedi, stringi le scapole insieme e rilascia",
                sets: 2
            },
            {
                name: "Arm Swings Orizzontali",
                duration: "20 reps",
                description: "Oscilla le braccia incrociandole davanti al petto",
                sets: 1
            }
        ]
    },

    "schiena": {
        name: "Riscaldamento Schiena",
        duration: "6-8 minuti",
        exercises: [
            {
                name: "Cat-Cow",
                duration: "10 reps",
                description: "Mobilità della colonna vertebrale",
                sets: 1
            },
            {
                name: "Scapular Pull-Ups",
                duration: "10 reps",
                description: "Appeso alla sbarra, solleva solo le scapole",
                sets: 2
            },
            {
                name: "Band Face Pull",
                duration: "15 reps",
                description: "Con elastico, tira verso il viso",
                sets: 2
            },
            {
                name: "Thoracic Extension",
                duration: "10 reps",
                description: "Su foam roller, estendi la parte alta della schiena",
                sets: 1
            },
            {
                name: "Superman Hold",
                duration: "20 sec",
                description: "A pancia in giù, solleva braccia e gambe",
                sets: 2
            },
            {
                name: "Lat Stretch Dinamico",
                duration: "30 sec per lato",
                description: "Braccio in alto, inclina lateralmente",
                sets: 1
            }
        ]
    },

    "spalle": {
        name: "Riscaldamento Spalle",
        duration: "8-10 minuti",
        exercises: [
            {
                name: "Arm Circles Progressivi",
                duration: "30 sec per direzione",
                description: "Da piccoli a grandi cerchi",
                sets: 1
            },
            {
                name: "Shoulder Dislocates",
                duration: "10 reps",
                description: "Con bastone o elastico, passa sopra la testa",
                sets: 2
            },
            {
                name: "Band Pull-Apart",
                duration: "15 reps",
                description: "Varie angolazioni: alto, medio, basso",
                sets: 3
            },
            {
                name: "External Rotation",
                duration: "10 reps per lato",
                description: "Con elastico leggero, rotazione esterna della spalla",
                sets: 2
            },
            {
                name: "Wall Slides",
                duration: "10 reps",
                description: "Schiena al muro, scorri le braccia su e giù",
                sets: 2
            },
            {
                name: "Y-T-W Raises",
                duration: "8 reps ciascuno",
                description: "Piegato in avanti, forma Y, T, W con le braccia",
                sets: 1
            },
            {
                name: "Empty Can Exercise",
                duration: "10 reps",
                description: "Braccia a 45°, solleva come se svuotassi una lattina",
                sets: 2
            }
        ]
    },

    "bicipiti": {
        name: "Riscaldamento Braccia (Bicipiti)",
        duration: "4-5 minuti",
        exercises: [
            {
                name: "Wrist Circles",
                duration: "30 sec",
                description: "Rotazioni dei polsi",
                sets: 1
            },
            {
                name: "Arm Circles",
                duration: "30 sec",
                description: "Cerchi con le braccia per attivare spalle e bicipiti",
                sets: 1
            },
            {
                name: "Light Band Curls",
                duration: "15 reps",
                description: "Curl leggeri con elastico per attivazione",
                sets: 2
            },
            {
                name: "Dynamic Bicep Stretch",
                duration: "30 sec",
                description: "Braccio teso, palmo in giù, tira le dita verso di te",
                sets: 1
            }
        ]
    },

    "tricipiti": {
        name: "Riscaldamento Braccia (Tricipiti)",
        duration: "4-5 minuti",
        exercises: [
            {
                name: "Arm Circles",
                duration: "30 sec",
                description: "Cerchi con le braccia",
                sets: 1
            },
            {
                name: "Tricep Stretch Dinamico",
                duration: "30 sec per braccio",
                description: "Braccio dietro la testa, spingi il gomito",
                sets: 1
            },
            {
                name: "Light Band Pushdowns",
                duration: "15 reps",
                description: "Pushdown leggeri con elastico",
                sets: 2
            },
            {
                name: "Diamond Push-Ups (ginocchia)",
                duration: "10 reps",
                description: "Push-up facilitati per attivare i tricipiti",
                sets: 1
            }
        ]
    },

    // ========================================
    // LOWER BODY WARMUPS
    // ========================================

    "lower": {
        name: "Riscaldamento Lower Body",
        duration: "10-12 minuti",
        exercises: [
            {
                name: "Camminata sul Posto",
                duration: "60 sec",
                description: "Solleva le ginocchia alternando",
                sets: 1
            },
            {
                name: "Leg Swings Frontali",
                duration: "10 per gamba",
                description: "Oscilla la gamba avanti e indietro",
                sets: 1
            },
            {
                name: "Leg Swings Laterali",
                duration: "10 per gamba",
                description: "Oscilla la gamba di lato",
                sets: 1
            },
            {
                name: "Hip Circles",
                duration: "10 per direzione per gamba",
                description: "Cerchi con l'anca, ginocchio sollevato",
                sets: 1
            },
            {
                name: "Bodyweight Squats",
                duration: "15 reps",
                description: "Squat a corpo libero per attivazione",
                sets: 2
            },
            {
                name: "Walking Lunges",
                duration: "10 per gamba",
                description: "Affondi camminando",
                sets: 1
            },
            {
                name: "Glute Bridges",
                duration: "12 reps",
                description: "Attivazione glutei",
                sets: 2
            },
            {
                name: "Inchworms",
                duration: "6 reps",
                description: "Da in piedi, cammina con le mani fino a plank e torna",
                sets: 1
            },
            {
                name: "World's Greatest Stretch",
                duration: "5 per lato",
                description: "Affondo con rotazione del busto",
                sets: 1
            }
        ]
    },

    "quadricipiti": {
        name: "Riscaldamento Quadricipiti",
        duration: "8-10 minuti",
        exercises: [
            {
                name: "Camminata/Corsa Leggera",
                duration: "2 minuti",
                description: "Riscalda il sistema cardiovascolare",
                sets: 1
            },
            {
                name: "Leg Swings Frontali",
                duration: "10 per gamba",
                description: "Oscilla la gamba avanti e indietro",
                sets: 1
            },
            {
                name: "High Knees",
                duration: "30 sec",
                description: "Corsa sul posto con ginocchia alte",
                sets: 1
            },
            {
                name: "Bodyweight Squats",
                duration: "15 reps",
                description: "Squat profondi a corpo libero",
                sets: 2
            },
            {
                name: "Walking Lunges",
                duration: "10 per gamba",
                description: "Affondi camminando",
                sets: 1
            },
            {
                name: "Quad Stretch Dinamico",
                duration: "30 sec per gamba",
                description: "In piedi, tira il tallone verso il gluteo",
                sets: 1
            },
            {
                name: "Goblet Squat Paused",
                duration: "8 reps",
                description: "Squat con pausa in basso senza peso",
                sets: 1
            }
        ]
    },

    "femorali": {
        name: "Riscaldamento Femorali",
        duration: "8-10 minuti",
        exercises: [
            {
                name: "Camminata Leggera",
                duration: "2 minuti",
                description: "Riscaldamento generale",
                sets: 1
            },
            {
                name: "Leg Swings Frontali",
                duration: "10 per gamba",
                description: "Enfasi sullo stretch del femorale",
                sets: 1
            },
            {
                name: "Inchworms",
                duration: "8 reps",
                description: "Stretch dinamico dei femorali",
                sets: 1
            },
            {
                name: "Good Mornings a Corpo Libero",
                duration: "12 reps",
                description: "Attivazione della catena posteriore",
                sets: 2
            },
            {
                name: "Single Leg RDL Senza Peso",
                duration: "8 per gamba",
                description: "Attivazione unilaterale",
                sets: 1
            },
            {
                name: "Hamstring Walkouts",
                duration: "8 reps",
                description: "Sdraiato, cammina con i talloni in fuori e dentro",
                sets: 1
            },
            {
                name: "Glute Bridges",
                duration: "12 reps",
                description: "Attivazione glutei e femorali",
                sets: 2
            }
        ]
    },

    "glutei": {
        name: "Riscaldamento Glutei",
        duration: "6-8 minuti",
        exercises: [
            {
                name: "Hip Circles",
                duration: "10 per direzione",
                description: "Cerchi con l'anca in piedi",
                sets: 1
            },
            {
                name: "Glute Bridges",
                duration: "15 reps",
                description: "Attivazione primaria dei glutei",
                sets: 2
            },
            {
                name: "Clamshells",
                duration: "12 per lato",
                description: "Sdraiato di lato, apri le ginocchia",
                sets: 2
            },
            {
                name: "Fire Hydrants",
                duration: "10 per lato",
                description: "A quattro zampe, solleva la gamba di lato",
                sets: 1
            },
            {
                name: "Donkey Kicks",
                duration: "10 per lato",
                description: "A quattro zampe, spingi il tallone verso l'alto",
                sets: 1
            },
            {
                name: "Monster Walks",
                duration: "10 passi per direzione",
                description: "Con elastico alle caviglie, cammina lateralmente",
                sets: 1
            }
        ]
    },

    "polpacci": {
        name: "Riscaldamento Polpacci",
        duration: "4-5 minuti",
        exercises: [
            {
                name: "Ankle Circles",
                duration: "10 per direzione per piede",
                description: "Rotazioni della caviglia",
                sets: 1
            },
            {
                name: "Calf Raises Leggeri",
                duration: "15 reps",
                description: "Alzate sui talloni a corpo libero",
                sets: 2
            },
            {
                name: "Toe Walks",
                duration: "30 sec",
                description: "Cammina sulle punte dei piedi",
                sets: 1
            },
            {
                name: "Heel Walks",
                duration: "30 sec",
                description: "Cammina sui talloni",
                sets: 1
            },
            {
                name: "Dynamic Calf Stretch",
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
        name: "Riscaldamento Core",
        duration: "5-6 minuti",
        exercises: [
            {
                name: "Cat-Cow",
                duration: "10 reps",
                description: "Mobilità della colonna",
                sets: 1
            },
            {
                name: "Dead Bug",
                duration: "8 per lato",
                description: "Attivazione del core profondo",
                sets: 2
            },
            {
                name: "Bird Dog",
                duration: "8 per lato",
                description: "Stabilità del core",
                sets: 2
            },
            {
                name: "Plank Hold",
                duration: "30 sec",
                description: "Attivazione isometrica",
                sets: 1
            },
            {
                name: "Hip Circles (in piedi)",
                duration: "10 per direzione",
                description: "Mobilità dell'anca",
                sets: 1
            },
            {
                name: "Torso Rotations",
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
                name: "Jumping Jacks",
                duration: "30 sec",
                description: "Attivazione cardiovascolare",
                sets: 1
            },
            {
                name: "Arm Circles",
                duration: "30 sec per direzione",
                description: "Mobilità spalle",
                sets: 1
            },
            {
                name: "Hip Circles",
                duration: "10 per direzione per gamba",
                description: "Mobilità anche",
                sets: 1
            },
            {
                name: "Leg Swings",
                duration: "10 per gamba (avanti/indietro e laterali)",
                description: "Mobilità gambe",
                sets: 1
            },
            {
                name: "Inchworms",
                duration: "6 reps",
                description: "Mobilità generale e attivazione core",
                sets: 1
            },
            {
                name: "World's Greatest Stretch",
                duration: "5 per lato",
                description: "Mobilità completa",
                sets: 1
            },
            {
                name: "Bodyweight Squats",
                duration: "12 reps",
                description: "Attivazione lower body",
                sets: 1
            },
            {
                name: "Push-Ups (ginocchia se necessario)",
                duration: "10 reps",
                description: "Attivazione upper body",
                sets: 1
            },
            {
                name: "Glute Bridges",
                duration: "12 reps",
                description: "Attivazione glutei",
                sets: 1
            },
            {
                name: "Mountain Climbers",
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
        name: "Riscaldamento Push (Petto, Spalle, Tricipiti)",
        duration: "8-10 minuti",
        exercises: [
            {
                name: "Arm Circles",
                duration: "30 sec per direzione",
                description: "Cerchi con le braccia, attiva spalle e cuffia dei rotatori",
                sets: 1
            },
            {
                name: "Shoulder Rolls",
                duration: "30 sec",
                description: "Rotazioni delle spalle avanti e indietro",
                sets: 1
            },
            {
                name: "Dynamic Chest Stretch",
                duration: "30 sec",
                description: "Braccia indietro, apri il petto dinamicamente",
                sets: 1
            },
            {
                name: "Band Pull-Apart",
                duration: "15 reps",
                description: "Attiva i muscoli stabilizzatori delle spalle",
                sets: 2
            },
            {
                name: "Scapular Push-Ups",
                duration: "10 reps",
                description: "In plank, muovi solo le scapole su e giù",
                sets: 1
            },
            {
                name: "Incline Push-Up",
                duration: "10 reps",
                description: "Push-up facilitati per attivare petto e tricipiti",
                sets: 2
            },
            {
                name: "Arm Swings Orizzontali",
                duration: "20 reps",
                description: "Oscilla le braccia incrociandole davanti al petto",
                sets: 1
            },
            {
                name: "Tricep Stretch Dinamico",
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
        name: "Riscaldamento Pull (Schiena, Bicipiti)",
        duration: "8-10 minuti",
        exercises: [
            {
                name: "Cat-Cow Stretch",
                duration: "10 reps",
                description: "Mobilità della colonna vertebrale",
                sets: 1
            },
            {
                name: "Arm Circles",
                duration: "30 sec per direzione",
                description: "Attiva spalle e cuffia dei rotatori",
                sets: 1
            },
            {
                name: "Band Pull-Apart",
                duration: "15 reps",
                description: "Attiva romboidi e deltoidi posteriori",
                sets: 2
            },
            {
                name: "Band Face Pull",
                duration: "15 reps",
                description: "Con elastico, tira verso il viso attivando trapezio",
                sets: 2
            },
            {
                name: "Scapular Pull-Ups",
                duration: "10 reps",
                description: "Appeso alla sbarra, solleva solo le scapole",
                sets: 2
            },
            {
                name: "Lat Stretch Dinamico",
                duration: "30 sec per lato",
                description: "Braccio in alto, inclina lateralmente",
                sets: 1
            },
            {
                name: "Light Band Curls",
                duration: "15 reps",
                description: "Curl leggeri con elastico per attivare bicipiti",
                sets: 2
            },
            {
                name: "Thoracic Rotations",
                duration: "8 reps per lato",
                description: "A quattro zampe, ruota il busto aprendo il braccio",
                sets: 1
            }
        ]
    },

    // ========================================
    // LEGS QUAD-FOCUSED WARMUP
    // ========================================
    "legs-quad": {
        name: "Riscaldamento Gambe (Focus Quadricipiti)",
        duration: "10-12 minuti",
        exercises: [
            {
                name: "Camminata sul Posto",
                duration: "60 sec",
                description: "Solleva le ginocchia alternando per alzare la temperatura",
                sets: 1
            },
            {
                name: "High Knees",
                duration: "30 sec",
                description: "Corsa sul posto con ginocchia alte",
                sets: 1
            },
            {
                name: "Leg Swings Frontali",
                duration: "10 per gamba",
                description: "Oscilla la gamba avanti e indietro",
                sets: 1
            },
            {
                name: "Hip Circles",
                duration: "10 per direzione per gamba",
                description: "Cerchi con l'anca, ginocchio sollevato",
                sets: 1
            },
            {
                name: "Bodyweight Squats",
                duration: "15 reps",
                description: "Squat profondi a corpo libero, enfasi sui quadricipiti",
                sets: 2
            },
            {
                name: "Walking Lunges",
                duration: "10 per gamba",
                description: "Affondi camminando per attivare i quadricipiti",
                sets: 1
            },
            {
                name: "Goblet Squat Paused",
                duration: "8 reps",
                description: "Squat con pausa in basso senza peso, stretch attivo",
                sets: 1
            },
            {
                name: "Glute Bridges",
                duration: "12 reps",
                description: "Attivazione glutei per supporto",
                sets: 1
            }
        ]
    },

    // ========================================
    // LEGS HAMSTRING-FOCUSED WARMUP
    // ========================================
    "legs-hamstring": {
        name: "Riscaldamento Gambe (Focus Femorali e Glutei)",
        duration: "10-12 minuti",
        exercises: [
            {
                name: "Camminata Leggera",
                duration: "90 sec",
                description: "Riscaldamento generale del sistema",
                sets: 1
            },
            {
                name: "Leg Swings Frontali",
                duration: "12 per gamba",
                description: "Enfasi sullo stretch del femorale nel movimento indietro",
                sets: 1
            },
            {
                name: "Leg Swings Laterali",
                duration: "10 per gamba",
                description: "Mobilità adduttori e abduttori",
                sets: 1
            },
            {
                name: "Inchworms",
                duration: "8 reps",
                description: "Stretch dinamico dei femorali",
                sets: 1
            },
            {
                name: "Good Mornings a Corpo Libero",
                duration: "12 reps",
                description: "Attivazione della catena posteriore",
                sets: 2
            },
            {
                name: "Glute Bridges",
                duration: "15 reps",
                description: "Attivazione primaria glutei e femorali",
                sets: 2
            },
            {
                name: "Single Leg RDL Senza Peso",
                duration: "8 per gamba",
                description: "Attivazione unilaterale della catena posteriore",
                sets: 1
            },
            {
                name: "World's Greatest Stretch",
                duration: "5 per lato",
                description: "Mobilità completa con enfasi sui flessori dell'anca",
                sets: 1
            }
        ]
    }
};

// Function to get warmup for a workout type
function getWarmupForWorkout(workoutType) {
    // Map workout types to warmup types
    const warmupMap = {
        // Upper/Lower Split
        "upper-a": "upper",
        "upper-b": "upper",
        "upper-c": "upper",
        "Upper A": "upper",
        "Upper B": "upper",
        "Upper C": "upper",
        "lower-a": "legs-quad",      // Lower A = quad focus
        "lower-b": "legs-hamstring", // Lower B = hamstring focus
        "lower-c": "lower",
        "Lower A": "legs-quad",
        "Lower B": "legs-hamstring",
        "Lower C": "lower",
        // Push/Pull/Legs
        "push": "push",
        "Push": "push",
        "pull": "pull",
        "Pull": "pull",
        "legs": "lower",
        "Legs": "lower",
        // Single muscle focus
        "chest": "petto",
        "Chest": "petto",
        "back": "schiena",
        "Back": "schiena",
        "shoulders": "spalle",
        "Shoulders": "spalle",
        "arms": "bicipiti",
        "Arms": "bicipiti",
        "Arms & Shoulders": "upper",
        // Full body
        "full-body": "full-body",
        "Full Body": "full-body",
        "Full Body A": "full-body",
        "Full Body B": "full-body",
        "Full Body C": "full-body",
        // Upper extras
        "Upper": "upper"
    };

    return WARMUPS_DB[warmupMap[workoutType]] || WARMUPS_DB["full-body"];
}

// Function to get warmup for specific muscle groups
function getWarmupForMuscles(primaryMuscles) {
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
        name: "Stretching Upper Body",
        duration: "8-10 minuti",
        exercises: [
            {
                name: "Chest Doorway Stretch",
                duration: "30 sec per lato",
                description: "Braccio contro lo stipite, ruota il corpo per allungare il petto"
            },
            {
                name: "Cross-Body Shoulder Stretch",
                duration: "30 sec per braccio",
                description: "Tira il braccio attraverso il petto con l'altro braccio"
            },
            {
                name: "Tricep Stretch",
                duration: "30 sec per braccio",
                description: "Braccio dietro la testa, spingi il gomito con l'altra mano"
            },
            {
                name: "Bicep Wall Stretch",
                duration: "30 sec per braccio",
                description: "Palmo contro il muro, ruota il corpo per allungare il bicipite"
            },
            {
                name: "Lat Stretch",
                duration: "30 sec per lato",
                description: "Braccio in alto, inclina lateralmente il busto"
            },
            {
                name: "Neck Stretches",
                duration: "20 sec per direzione",
                description: "Inclina la testa lateralmente e in avanti, delicatamente"
            },
            {
                name: "Upper Back Stretch",
                duration: "30 sec",
                description: "Mani intrecciate davanti, arrotonda la schiena spingendo in avanti"
            },
            {
                name: "Child's Pose",
                duration: "45 sec",
                description: "In ginocchio, siediti sui talloni e allunga le braccia in avanti"
            }
        ]
    },

    "lower": {
        name: "Stretching Lower Body",
        duration: "10-12 minuti",
        exercises: [
            {
                name: "Standing Quad Stretch",
                duration: "30 sec per gamba",
                description: "In piedi, tira il tallone verso il gluteo"
            },
            {
                name: "Standing Hamstring Stretch",
                duration: "30 sec per gamba",
                description: "Piede su rialzo, piegati in avanti con schiena dritta"
            },
            {
                name: "Hip Flexor Stretch (Lunge)",
                duration: "30 sec per lato",
                description: "In affondo, spingi il bacino in avanti"
            },
            {
                name: "Pigeon Pose",
                duration: "45 sec per lato",
                description: "Gamba piegata davanti, l'altra distesa dietro"
            },
            {
                name: "Butterfly Stretch",
                duration: "45 sec",
                description: "Seduto, piante dei piedi unite, spingi le ginocchia verso il basso"
            },
            {
                name: "Seated Forward Fold",
                duration: "45 sec",
                description: "Gambe distese, piegati in avanti verso le punte"
            },
            {
                name: "Figure-4 Stretch",
                duration: "30 sec per lato",
                description: "Sdraiato, caviglia sulla coscia opposta, tira verso di te"
            },
            {
                name: "Calf Stretch",
                duration: "30 sec per gamba",
                description: "Piede indietro, tallone a terra, spingi contro il muro"
            },
            {
                name: "Lying Spinal Twist",
                duration: "30 sec per lato",
                description: "Sdraiato, ginocchia da un lato, spalle a terra"
            }
        ]
    },

    "petto": {
        name: "Stretching Petto",
        duration: "5-6 minuti",
        exercises: [
            {
                name: "Doorway Chest Stretch",
                duration: "30 sec per lato",
                description: "Avambraccio contro lo stipite, fai un passo avanti"
            },
            {
                name: "Chest Opener",
                duration: "30 sec",
                description: "Mani intrecciate dietro la schiena, petto in fuori"
            },
            {
                name: "Floor Chest Stretch",
                duration: "30 sec per lato",
                description: "A pancia in giù, braccio a 90°, ruota il corpo"
            },
            {
                name: "Corner Stretch",
                duration: "45 sec",
                description: "Mani sulle pareti di un angolo, piegati in avanti"
            }
        ]
    },

    "schiena": {
        name: "Stretching Schiena",
        duration: "6-8 minuti",
        exercises: [
            {
                name: "Cat-Cow Stretch",
                duration: "10 ripetizioni lente",
                description: "A quattro zampe, alterna inarcamento e flessione"
            },
            {
                name: "Child's Pose",
                duration: "45 sec",
                description: "Seduto sui talloni, braccia distese in avanti"
            },
            {
                name: "Lat Stretch",
                duration: "30 sec per lato",
                description: "In ginocchio, braccio disteso in avanti, ruota il busto"
            },
            {
                name: "Seated Spinal Twist",
                duration: "30 sec per lato",
                description: "Seduto, ruota il busto, gomito fuori dal ginocchio opposto"
            },
            {
                name: "Knee-to-Chest Stretch",
                duration: "30 sec per gamba",
                description: "Sdraiato, tira un ginocchio al petto"
            },
            {
                name: "Cobra Stretch",
                duration: "30 sec",
                description: "A pancia in giù, solleva il petto con le braccia"
            }
        ]
    },

    "spalle": {
        name: "Stretching Spalle",
        duration: "5-6 minuti",
        exercises: [
            {
                name: "Cross-Body Stretch",
                duration: "30 sec per braccio",
                description: "Tira il braccio attraverso il petto"
            },
            {
                name: "Overhead Tricep/Shoulder Stretch",
                duration: "30 sec per braccio",
                description: "Braccio dietro la testa, spingi il gomito"
            },
            {
                name: "Thread the Needle",
                duration: "30 sec per lato",
                description: "A quattro zampe, passa il braccio sotto il corpo"
            },
            {
                name: "Eagle Arms",
                duration: "30 sec per lato",
                description: "Braccia incrociate davanti, gomiti uniti"
            },
            {
                name: "Wall Shoulder Stretch",
                duration: "30 sec per braccio",
                description: "Mano sul muro all'altezza della spalla, ruota"
            }
        ]
    },

    "bicipiti": {
        name: "Stretching Braccia",
        duration: "4-5 minuti",
        exercises: [
            {
                name: "Wall Bicep Stretch",
                duration: "30 sec per braccio",
                description: "Palmo sul muro dietro di te, ruota il corpo"
            },
            {
                name: "Seated Bicep Stretch",
                duration: "30 sec",
                description: "Mani a terra dietro di te, dita verso l'esterno, siediti indietro"
            },
            {
                name: "Tricep Stretch",
                duration: "30 sec per braccio",
                description: "Braccio dietro la testa, spingi il gomito"
            },
            {
                name: "Wrist Flexor Stretch",
                duration: "20 sec per mano",
                description: "Braccio teso, tira le dita verso di te"
            },
            {
                name: "Wrist Extensor Stretch",
                duration: "20 sec per mano",
                description: "Braccio teso, spingi le dita verso il basso"
            }
        ]
    },

    "quadricipiti": {
        name: "Stretching Quadricipiti",
        duration: "5-6 minuti",
        exercises: [
            {
                name: "Standing Quad Stretch",
                duration: "30 sec per gamba",
                description: "Tira il tallone verso il gluteo"
            },
            {
                name: "Kneeling Quad Stretch",
                duration: "30 sec per gamba",
                description: "In ginocchio su una gamba, tira il piede posteriore"
            },
            {
                name: "Lying Quad Stretch",
                duration: "30 sec per gamba",
                description: "Su un fianco, tira il tallone verso il gluteo"
            },
            {
                name: "Couch Stretch",
                duration: "45 sec per gamba",
                description: "Ginocchio a terra, piede contro il muro dietro di te"
            }
        ]
    },

    "femorali": {
        name: "Stretching Femorali",
        duration: "6-8 minuti",
        exercises: [
            {
                name: "Standing Toe Touch",
                duration: "30 sec",
                description: "In piedi, piegati verso le punte dei piedi"
            },
            {
                name: "Seated Forward Fold",
                duration: "45 sec",
                description: "Gambe distese, piegati verso le punte"
            },
            {
                name: "Single Leg Forward Fold",
                duration: "30 sec per gamba",
                description: "Una gamba distesa, l'altra piegata, piegati verso la punta"
            },
            {
                name: "Lying Hamstring Stretch",
                duration: "30 sec per gamba",
                description: "Sdraiato, tira la gamba verso di te con le mani o una fascia"
            },
            {
                name: "Standing Hamstring Stretch",
                duration: "30 sec per gamba",
                description: "Piede su rialzo, piegati in avanti"
            }
        ]
    },

    "glutei": {
        name: "Stretching Glutei",
        duration: "5-6 minuti",
        exercises: [
            {
                name: "Figure-4 Stretch",
                duration: "30 sec per lato",
                description: "Sdraiato, caviglia sulla coscia opposta, tira"
            },
            {
                name: "Pigeon Pose",
                duration: "45 sec per lato",
                description: "Gamba piegata davanti, l'altra distesa dietro"
            },
            {
                name: "Knee-to-Chest",
                duration: "30 sec per gamba",
                description: "Sdraiato, abbraccia il ginocchio al petto"
            },
            {
                name: "Seated Glute Stretch",
                duration: "30 sec per lato",
                description: "Seduto, caviglia sulla coscia opposta, piegati in avanti"
            }
        ]
    },

    "addome": {
        name: "Stretching Core",
        duration: "4-5 minuti",
        exercises: [
            {
                name: "Cobra Stretch",
                duration: "30 sec",
                description: "A pancia in giù, solleva il petto con le braccia"
            },
            {
                name: "Lying Side Stretch",
                duration: "30 sec per lato",
                description: "Sdraiato, braccia sopra la testa, inclinati lateralmente"
            },
            {
                name: "Cat-Cow",
                duration: "10 ripetizioni",
                description: "Mobilità della colonna"
            },
            {
                name: "Lying Spinal Twist",
                duration: "30 sec per lato",
                description: "Sdraiato, ginocchia da un lato, spalle a terra"
            }
        ]
    },

    "full-body": {
        name: "Stretching Completo",
        duration: "10-12 minuti",
        exercises: [
            {
                name: "Neck Rolls",
                duration: "30 sec",
                description: "Rotazioni lente del collo"
            },
            {
                name: "Shoulder Stretch",
                duration: "30 sec per braccio",
                description: "Braccio attraverso il petto"
            },
            {
                name: "Tricep Stretch",
                duration: "30 sec per braccio",
                description: "Braccio dietro la testa"
            },
            {
                name: "Chest Opener",
                duration: "30 sec",
                description: "Mani dietro la schiena, petto in fuori"
            },
            {
                name: "Cat-Cow",
                duration: "10 ripetizioni",
                description: "Mobilità spinale"
            },
            {
                name: "Child's Pose",
                duration: "45 sec",
                description: "Rilassamento schiena"
            },
            {
                name: "Hip Flexor Stretch",
                duration: "30 sec per lato",
                description: "Affondo con bacino in avanti"
            },
            {
                name: "Quad Stretch",
                duration: "30 sec per gamba",
                description: "Tallone verso il gluteo"
            },
            {
                name: "Hamstring Stretch",
                duration: "30 sec per gamba",
                description: "Piede avanti, piegati verso la punta"
            },
            {
                name: "Figure-4",
                duration: "30 sec per lato",
                description: "Stretch glutei"
            },
            {
                name: "Calf Stretch",
                duration: "30 sec per gamba",
                description: "Tallone a terra, spingi contro il muro"
            },
            {
                name: "Deep Breathing",
                duration: "60 sec",
                description: "Respiri profondi per rilassare il sistema nervoso"
            }
        ]
    },

    // ========================================
    // PUSH COOLDOWN (Chest, Shoulders, Triceps)
    // ========================================
    "push": {
        name: "Stretching Push (Petto, Spalle, Tricipiti)",
        duration: "6-8 minuti",
        exercises: [
            {
                name: "Chest Doorway Stretch",
                duration: "30 sec per lato",
                description: "Avambraccio contro lo stipite, fai un passo avanti per allungare il petto"
            },
            {
                name: "Floor Chest Stretch",
                duration: "30 sec per lato",
                description: "A pancia in giù, braccio a 90°, ruota il corpo"
            },
            {
                name: "Cross-Body Shoulder Stretch",
                duration: "30 sec per braccio",
                description: "Tira il braccio attraverso il petto"
            },
            {
                name: "Overhead Tricep Stretch",
                duration: "30 sec per braccio",
                description: "Braccio dietro la testa, spingi il gomito"
            },
            {
                name: "Eagle Arms",
                duration: "30 sec per lato",
                description: "Braccia incrociate davanti, gomiti uniti, stretch spalle"
            },
            {
                name: "Child's Pose",
                duration: "45 sec",
                description: "Rilassamento completo spalle e petto"
            },
            {
                name: "Deep Breathing",
                duration: "30 sec",
                description: "Respiri profondi per rilassare"
            }
        ]
    },

    // ========================================
    // PULL COOLDOWN (Back, Biceps)
    // ========================================
    "pull": {
        name: "Stretching Pull (Schiena, Bicipiti)",
        duration: "6-8 minuti",
        exercises: [
            {
                name: "Cat-Cow Stretch",
                duration: "10 ripetizioni lente",
                description: "Mobilità della colonna vertebrale"
            },
            {
                name: "Child's Pose",
                duration: "45 sec",
                description: "Stretch dorsali e parte bassa schiena"
            },
            {
                name: "Lat Stretch",
                duration: "30 sec per lato",
                description: "In ginocchio, braccio disteso, inclina il busto lateralmente"
            },
            {
                name: "Seated Spinal Twist",
                duration: "30 sec per lato",
                description: "Seduto, ruota il busto per allungare la schiena"
            },
            {
                name: "Wall Bicep Stretch",
                duration: "30 sec per braccio",
                description: "Palmo sul muro dietro di te, ruota il corpo"
            },
            {
                name: "Seated Bicep Stretch",
                duration: "30 sec",
                description: "Mani a terra dietro di te, siediti indietro"
            },
            {
                name: "Upper Back Stretch",
                duration: "30 sec",
                description: "Mani intrecciate davanti, arrotonda la schiena"
            },
            {
                name: "Deep Breathing",
                duration: "30 sec",
                description: "Respiri profondi per rilassare"
            }
        ]
    },

    // ========================================
    // LEGS QUAD-FOCUSED COOLDOWN
    // ========================================
    "legs-quad": {
        name: "Stretching Gambe (Focus Quadricipiti)",
        duration: "8-10 minuti",
        exercises: [
            {
                name: "Standing Quad Stretch",
                duration: "30 sec per gamba",
                description: "In piedi, tira il tallone verso il gluteo"
            },
            {
                name: "Kneeling Quad Stretch",
                duration: "45 sec per gamba",
                description: "In ginocchio su una gamba, tira il piede posteriore verso il gluteo"
            },
            {
                name: "Couch Stretch",
                duration: "45 sec per gamba",
                description: "Ginocchio a terra, piede contro il muro dietro di te"
            },
            {
                name: "Hip Flexor Stretch",
                duration: "30 sec per lato",
                description: "In affondo, spingi il bacino in avanti"
            },
            {
                name: "Butterfly Stretch",
                duration: "45 sec",
                description: "Seduto, piante dei piedi unite, spingi le ginocchia verso il basso"
            },
            {
                name: "Lying Spinal Twist",
                duration: "30 sec per lato",
                description: "Sdraiato, ginocchia da un lato, spalle a terra"
            },
            {
                name: "Deep Breathing",
                duration: "30 sec",
                description: "Respiri profondi per rilassare"
            }
        ]
    },

    // ========================================
    // LEGS HAMSTRING-FOCUSED COOLDOWN
    // ========================================
    "legs-hamstring": {
        name: "Stretching Gambe (Focus Femorali e Glutei)",
        duration: "8-10 minuti",
        exercises: [
            {
                name: "Standing Toe Touch",
                duration: "30 sec",
                description: "In piedi, piegati verso le punte dei piedi"
            },
            {
                name: "Seated Forward Fold",
                duration: "45 sec",
                description: "Gambe distese, piegati verso le punte"
            },
            {
                name: "Single Leg Forward Fold",
                duration: "30 sec per gamba",
                description: "Una gamba distesa, l'altra piegata, piegati verso la punta"
            },
            {
                name: "Figure-4 Stretch",
                duration: "45 sec per lato",
                description: "Sdraiato, caviglia sulla coscia opposta, tira verso di te"
            },
            {
                name: "Pigeon Pose",
                duration: "45 sec per lato",
                description: "Stretch profondo per glutei e flessori dell'anca"
            },
            {
                name: "Lying Hamstring Stretch",
                duration: "30 sec per gamba",
                description: "Sdraiato, tira la gamba verso di te con le mani"
            },
            {
                name: "Hip Flexor Stretch",
                duration: "30 sec per lato",
                description: "In affondo, spingi il bacino in avanti"
            },
            {
                name: "Deep Breathing",
                duration: "30 sec",
                description: "Respiri profondi per rilassare"
            }
        ]
    }
};

// Get cooldown for workout type
function getCooldownForWorkout(workoutType) {
    const cooldownMap = {
        // Upper/Lower Split
        "upper-a": "upper",
        "upper-b": "upper",
        "upper-c": "upper",
        "Upper A": "upper",
        "Upper B": "upper",
        "Upper C": "upper",
        "lower-a": "legs-quad",      // Lower A typically focuses on quads
        "lower-b": "legs-hamstring", // Lower B typically focuses on hamstrings
        "lower-c": "lower",
        "Lower A": "legs-quad",
        "Lower B": "legs-hamstring",
        "Lower C": "lower",
        // Push/Pull/Legs
        "push": "push",
        "Push": "push",
        "pull": "pull",
        "Pull": "pull",
        "legs": "lower",
        "Legs": "lower",
        // Single muscle focus
        "chest": "petto",
        "Chest": "petto",
        "back": "schiena",
        "Back": "schiena",
        "shoulders": "spalle",
        "Shoulders": "spalle",
        "arms": "bicipiti",
        "Arms": "bicipiti",
        "Arms & Shoulders": "upper",
        // Full body
        "full-body": "full-body",
        "Full Body": "full-body",
        "Full Body A": "full-body",
        "Full Body B": "full-body",
        "Full Body C": "full-body",
        // Upper extras
        "Upper": "upper"
    };

    return COOLDOWN_DB[cooldownMap[workoutType]] || COOLDOWN_DB["full-body"];
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
    getCooldownForWorkout,
    getCooldownForMuscles,
    getCooldownByMuscle
};

})();
