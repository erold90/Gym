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
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Burpee.gif"
    },
    "half-burpees": {
        name: "Half Burpees",
        description: "Come i burpees ma senza push-up. Scendi in squat, salta in plank, torna in squat e salta su.",
        muscles: ["full-body", "quadricipiti", "core"],
        difficulty: "intermediate",
        equipment: [],
        metValue: 8,
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/06/Half-Burpee.gif"
    },
    "mountain-climbers": {
        name: "Mountain Climbers",
        description: "In posizione plank, porta le ginocchia al petto alternandole velocemente mantenendo il core attivo.",
        muscles: ["core", "spalle", "quadricipiti"],
        difficulty: "intermediate",
        equipment: [],
        metValue: 8,
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Mountain-Climber.gif"
    },
    "jumping-jacks": {
        name: "Jumping Jacks",
        description: "Parti con piedi uniti e braccia lungo i fianchi. Salta aprendo gambe e braccia, poi torna in posizione.",
        muscles: ["full-body", "polpacci", "spalle"],
        difficulty: "beginner",
        equipment: [],
        metValue: 7,
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Jumping-Jack.gif"
    },
    "star-jumps": {
        name: "Star Jumps",
        description: "Da posizione accovacciata, salta esplosivamente aprendo braccia e gambe a stella, atterra morbido.",
        muscles: ["full-body", "quadricipiti", "spalle"],
        difficulty: "intermediate",
        equipment: [],
        metValue: 9,
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2022/02/Star-Jump.gif"
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
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Split-Jump.gif"
    },
    "high-knees": {
        name: "High Knees",
        description: "Corri sul posto portando le ginocchia il più in alto possibile, alternando velocemente.",
        muscles: ["quadricipiti", "core", "polpacci"],
        difficulty: "beginner",
        equipment: [],
        metValue: 8,
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/02/High-Knee-Run.gif"
    },
    "butt-kicks": {
        name: "Butt Kicks",
        description: "Corri sul posto portando i talloni verso i glutei, alternando velocemente.",
        muscles: ["femorali", "polpacci"],
        difficulty: "beginner",
        equipment: [],
        metValue: 7,
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Butt-Kicks.gif"
    },
    "squat-pulse": {
        name: "Squat Pulse",
        description: "Mantieni la posizione bassa dello squat e fai piccoli movimenti su e giù senza tornare in piedi.",
        muscles: ["quadricipiti", "glutei"],
        difficulty: "intermediate",
        equipment: [],
        metValue: 6,
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/06/Squat-Pulse.gif"
    },
    "skater-jumps": {
        name: "Skater Jumps",
        description: "Salta lateralmente da un piede all'altro come un pattinatore, portando la gamba libera dietro.",
        muscles: ["quadricipiti", "glutei", "polpacci"],
        difficulty: "intermediate",
        equipment: [],
        metValue: 8,
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Skater-Hops.gif"
    },
    "box-jump": {
        name: "Box Jump",
        description: "Salta esplosivamente su un box o step, atterra con entrambi i piedi, scendi controllato.",
        muscles: ["quadricipiti", "glutei", "polpacci"],
        difficulty: "intermediate",
        equipment: ["box"],
        metValue: 9,
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Box-Jump.gif"
    },
    "lateral-shuffle": {
        name: "Lateral Shuffle",
        description: "Muoviti lateralmente a passi veloci mantenendo le ginocchia piegate, cambia direzione.",
        muscles: ["quadricipiti", "glutei", "polpacci"],
        difficulty: "beginner",
        equipment: [],
        metValue: 7,
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2022/02/Lateral-Shuffle.gif"
    },

    // === UPPER BODY ===
    "plyo-push-up": {
        name: "Push-up Esplosivo",
        description: "Esegui un push-up e spingi esplosivamente in modo che le mani stacchino da terra.",
        muscles: ["petto", "tricipiti", "spalle"],
        difficulty: "advanced",
        equipment: [],
        metValue: 8,
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/06/Clapping-Push-up.gif"
    },
    "plank-shoulder-tap": {
        name: "Plank Shoulder Tap",
        description: "In posizione plank alta, tocca la spalla opposta con una mano alternando, mantieni il core stabile.",
        muscles: ["core", "spalle"],
        difficulty: "intermediate",
        equipment: [],
        metValue: 6,
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/06/Plank-Shoulder-Tap.gif"
    },
    "push-up-to-t": {
        name: "Push-up to T",
        description: "Fai un push-up, poi ruota il corpo lateralmente sollevando un braccio verso il soffitto.",
        muscles: ["petto", "core", "spalle"],
        difficulty: "intermediate",
        equipment: [],
        metValue: 7,
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/06/Push-up-to-Side-Plank.gif"
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
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/02/V-Up.gif"
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
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/06/Plank-Jack.gif"
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
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Toe-Touches.gif"
    },

    // === CON ATTREZZATURA ===
    "kettlebell-swing": {
        name: "Kettlebell Swing",
        description: "Oscillazione del kettlebell tra le gambe e sopra la testa usando la spinta dei fianchi.",
        muscles: ["glutei", "femorali", "schiena", "core"],
        difficulty: "intermediate",
        equipment: ["kettlebell"],
        metValue: 10,
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Kettlebell-Swing.gif"
    },
    "battle-ropes": {
        name: "Battle Ropes",
        description: "Crea onde alternate con le corde, mantieni il core attivo e le ginocchia leggermente piegate.",
        muscles: ["spalle", "braccia", "core"],
        difficulty: "intermediate",
        equipment: ["battle-ropes"],
        metValue: 10,
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/04/Battling-Ropes.gif"
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
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/06/Medicine-Ball-Overhead-Slam.gif"
    },
    "dumbbell-thruster": {
        name: "Dumbbell Thruster",
        description: "Squat con manubri alle spalle, esplodi verso l'alto spingendo i manubri sopra la testa.",
        muscles: ["quadricipiti", "spalle", "core"],
        difficulty: "intermediate",
        equipment: ["manubri"],
        metValue: 9,
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Thruster.gif"
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
// PROTOCOLLI HIIT
// ========================================

const HIIT_PROTOCOLS = {
    tabata: {
        name: "Tabata",
        workTime: 20,
        restTime: 10,
        rounds: 8,
        exercisesCount: 4,
        totalDuration: 16,  // minuti
        difficulty: "advanced",
        description: "8 round di 20s lavoro + 10s riposo per esercizio. Intensità massima."
    },
    circuit30: {
        name: "Circuito 30/30",
        workTime: 30,
        restTime: 30,
        rounds: 3,
        exercisesCount: 5,
        totalDuration: 15,
        difficulty: "intermediate",
        description: "30s lavoro + 30s riposo per esercizio, 3 giri completi."
    },
    circuit4020: {
        name: "Circuito 40/20",
        workTime: 40,
        restTime: 20,
        rounds: 3,
        exercisesCount: 5,
        totalDuration: 15,
        difficulty: "intermediate",
        description: "40s lavoro + 20s riposo per esercizio, 3 giri completi."
    },
    beginner: {
        name: "Principiante",
        workTime: 20,
        restTime: 40,
        rounds: 2,
        exercisesCount: 4,
        totalDuration: 8,
        difficulty: "beginner",
        description: "20s lavoro + 40s riposo, 2 giri. Ideale per iniziare."
    },
    emom10: {
        name: "EMOM 10",
        workTime: 40,
        restTime: 20,
        rounds: 10,
        exercisesCount: 2,
        totalDuration: 10,
        difficulty: "intermediate",
        description: "Every Minute On the Minute: esegui gli esercizi all'inizio di ogni minuto."
    }
};

// ========================================
// CONFIGURAZIONE PER OBIETTIVO
// ========================================

const CONDITIONING_BY_GOAL = {
    strength: {
        frequency: 0,  // sessioni/settimana raccomandate
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
    }
};

// ========================================
// FUNZIONI HELPER
// ========================================

/**
 * Seleziona esercizi HIIT in base a livello, attrezzatura e muscoli da evitare
 */
function selectHIITExercises(userLevel, equipment = [], avoidMuscles = [], count = 5) {
    const levelOrder = { beginner: 1, intermediate: 2, advanced: 3, expert: 3 };
    const userLevelNum = levelOrder[userLevel] || 2;

    const eligible = Object.entries(HIIT_EXERCISES)
        .filter(([id, ex]) => {
            // Filtra per difficoltà
            const exLevelNum = levelOrder[ex.difficulty] || 2;
            if (exLevelNum > userLevelNum) return false;

            // Filtra per attrezzatura (se richiesta)
            if (ex.equipment.length > 0) {
                const hasEquipment = ex.equipment.some(eq => equipment.includes(eq));
                if (!hasEquipment) return false;
            }

            // Evita muscoli già allenati (se specificato)
            if (avoidMuscles.length > 0) {
                const worksSameMuscles = ex.muscles.some(m =>
                    avoidMuscles.includes(m) && m !== 'full-body' && m !== 'core'
                );
                if (worksSameMuscles) return false;
            }

            return true;
        })
        .map(([id, ex]) => ({ id, ...ex }));

    // Mescola e prendi il numero richiesto
    const shuffled = eligible.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

/**
 * Ottieni protocollo consigliato per obiettivo e livello
 */
function getRecommendedProtocol(goal, userLevel) {
    const config = CONDITIONING_BY_GOAL[goal];
    if (!config || !config.protocol) return HIIT_PROTOCOLS.circuit30;

    let protocol = HIIT_PROTOCOLS[config.protocol];

    // Adatta al livello utente
    const levelOrder = { beginner: 1, intermediate: 2, advanced: 3, expert: 3 };
    const userLevelNum = levelOrder[userLevel] || 2;
    const protocolLevelNum = levelOrder[protocol.difficulty] || 2;

    // Se il protocollo è troppo difficile, scala a uno più facile
    if (protocolLevelNum > userLevelNum) {
        if (userLevelNum === 1) return HIIT_PROTOCOLS.beginner;
        return HIIT_PROTOCOLS.circuit30;
    }

    return protocol;
}

/**
 * Stima calorie bruciate
 * Formula: (MET × 3.5 × peso in kg) / 200 × minuti
 */
function estimateConditioningCalories(exercises, durationMinutes, userWeightKg, type = 'HIIT') {
    let avgMET;

    if (type === 'LISS' || !exercises || exercises.length === 0) {
        avgMET = 5; // MET medio per LISS
    } else {
        // Calcola MET medio degli esercizi
        const totalMET = exercises.reduce((sum, ex) => {
            const exData = HIIT_EXERCISES[ex.id || ex.exerciseId];
            return sum + (exData?.metValue || 8);
        }, 0);
        avgMET = totalMET / exercises.length;
    }

    const caloriesPerMinute = (avgMET * 3.5 * userWeightKg) / 200;
    return Math.round(caloriesPerMinute * durationMinutes);
}

/**
 * Ottieni suggerimento conditioning per la settimana
 */
function getConditioningSuggestion(goal, userLevel, daysPerWeek, completedThisWeek = 0) {
    const config = CONDITIONING_BY_GOAL[goal];
    if (!config) return null;

    const remaining = config.frequency - completedThisWeek;

    if (remaining <= 0) {
        return {
            suggested: false,
            message: `Hai completato le ${config.frequency} sessioni consigliate questa settimana!`,
            canDoMore: completedThisWeek < config.maxFrequency,
            config
        };
    }

    return {
        suggested: true,
        remaining,
        type: config.preferredType === 'mixed' ? (completedThisWeek % 2 === 0 ? 'HIIT' : 'LISS') : config.preferredType,
        duration: config.preferredType === 'HIIT' ? config.hiitDuration || config.duration : config.lissDuration || config.duration,
        protocol: getRecommendedProtocol(goal, userLevel),
        message: `${remaining} session${remaining > 1 ? 'i' : 'e'} conditioning consigliat${remaining > 1 ? 'e' : 'a'} questa settimana`,
        config
    };
}

/**
 * Verifica se oggi è un buon giorno per HIIT
 * in base agli ultimi workout (evita HIIT vicino a leg day)
 */
function isGoodDayForHIIT(recentWorkouts) {
    if (!recentWorkouts || recentWorkouts.length === 0) return true;

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Cerca leg day nelle ultime 24h o pianificato per domani
    const hasRecentLegDay = recentWorkouts.some(w => {
        const workoutDate = new Date(w.date);
        const isYesterdayOrToday = workoutDate >= yesterday && workoutDate <= today;
        const isLegDay = w.type?.toLowerCase().includes('lower') ||
                         w.type?.toLowerCase().includes('leg') ||
                         w.type?.toLowerCase().includes('gambe');
        return isYesterdayOrToday && isLegDay;
    });

    return !hasRecentLegDay;
}
