/**
 * GymTracker Pro - Dynamic Warmup Database
 * Specific warmup routines for each muscle group
 */

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
    }
};

// Function to get warmup for a workout type
function getWarmupForWorkout(workoutType) {
    // Map workout types to warmup types
    const warmupMap = {
        "upper-a": "upper",
        "upper-b": "upper",
        "lower-a": "lower",
        "lower-b": "lower",
        "push": "upper",
        "pull": "schiena",
        "legs": "lower",
        "chest": "petto",
        "back": "schiena",
        "shoulders": "spalle",
        "arms": "bicipiti",
        "full-body": "full-body"
    };

    return WARMUPS_DB[warmupMap[workoutType]] || WARMUPS_DB["full-body"];
}

// Function to get warmup for specific muscle groups
function getWarmupForMuscles(primaryMuscles) {
    // If multiple muscles, check which warmup covers the most
    if (primaryMuscles.includes("petto") || primaryMuscles.includes("spalle") ||
        primaryMuscles.includes("tricipiti")) {
        return WARMUPS_DB["upper"];
    }
    if (primaryMuscles.includes("schiena") || primaryMuscles.includes("bicipiti")) {
        return WARMUPS_DB["schiena"];
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
