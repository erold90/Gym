/**
 * GymTracker Pro - Exercise Database
 * Database degli esercizi (139). Un esercizio non si cancella mai (lo storico lo usa): si marca `hidden: true`.
 */

const EXERCISES_DB = {
    // ========================================
    // PETTO (Chest)
    // ========================================

    // Bilanciere
    "bench-press": {
        id: "bench-press",
        name: "Panca Piana Bilanciere",
        category: "bilanciere",
        primaryMuscles: ["petto"],
        secondaryMuscles: ["tricipiti", "spalle"],
        type: "compound",
        difficulty: "intermediate",
        equipment: ["bilanciere", "panca"],
        instructions: "Sdraiati sulla panca con i piedi a terra. Afferra il bilanciere con presa leggermente più larga delle spalle. Abbassa il bilanciere al petto controllando il movimento, poi spingi verso l'alto.",
        tips: ["Mantieni le scapole retratte", "Non rimbalzare sul petto", "Espira durante la spinta"]
    },
    "incline-bench-press": {
        id: "incline-bench-press",
        name: "Panca Inclinata Bilanciere",
        category: "bilanciere",
        primaryMuscles: ["petto"],
        secondaryMuscles: ["tricipiti", "spalle"],
        type: "compound",
        difficulty: "intermediate",
        equipment: ["bilanciere", "panca"],
        instructions: "Imposta la panca a 30-45 gradi. Esegui come la panca piana ma con angolazione superiore per enfatizzare la parte alta del petto.",
        tips: ["Angolo 30-45 gradi ottimale", "Non arcuare eccessivamente la schiena"]
    },
    "decline-bench-press": {
        id: "decline-bench-press",
        name: "Panca Declinata Bilanciere",
        category: "bilanciere",
        primaryMuscles: ["petto"],
        secondaryMuscles: ["tricipiti"],
        type: "compound",
        difficulty: "intermediate",
        equipment: ["bilanciere", "panca"],
        instructions: "Imposta la panca in declinazione. Blocca i piedi e abbassa il bilanciere verso la parte bassa del petto.",
        tips: ["Enfatizza la parte bassa del petto", "Usa un aiutante per sicurezza"]
    },

    // Manubri
    "dumbbell-bench-press": {
        id: "dumbbell-bench-press",
        name: "Panca Piana Manubri",
        category: "manubri",
        primaryMuscles: ["petto"],
        secondaryMuscles: ["tricipiti", "spalle"],
        type: "compound",
        difficulty: "beginner",
        equipment: ["manubri", "panca"],
        instructions: "Sdraiati con un manubrio per mano. Spingi verso l'alto unendo i manubri sopra il petto, poi abbassa controllando.",
        tips: ["Maggior range di movimento rispetto al bilanciere", "Ottimo per correggere squilibri"]
    },
    "dumbbell-incline-press": {
        id: "dumbbell-incline-press",
        name: "Panca Inclinata Manubri",
        category: "manubri",
        primaryMuscles: ["petto"],
        secondaryMuscles: ["tricipiti", "spalle"],
        type: "compound",
        difficulty: "beginner",
        equipment: ["manubri", "panca"],
        instructions: "Su panca inclinata a 30-45 gradi, esegui il movimento di spinta con i manubri.",
        tips: ["Focus sulla parte alta del petto", "Controllo del movimento in discesa"]
    },
    "dumbbell-decline-press": {
        id: "dumbbell-decline-press",
        name: "Panca Declinata Manubri",
        category: "manubri",
        primaryMuscles: ["petto"],
        secondaryMuscles: ["tricipiti"],
        type: "compound",
        difficulty: "beginner",
        equipment: ["manubri", "panca"],
        instructions: "Su panca declinata, esegui il movimento di spinta con i manubri.",
        tips: ["Focus sulla parte bassa del petto"]
    },
    "dumbbell-fly": {
        id: "dumbbell-fly",
        name: "Croci Manubri Panca Piana",
        category: "manubri",
        primaryMuscles: ["petto"],
        secondaryMuscles: [],
        type: "isolation",
        difficulty: "beginner",
        equipment: ["manubri", "panca"],
        instructions: "Con i manubri sopra il petto, abbassa lateralmente mantenendo una leggera flessione dei gomiti. Torna alla posizione iniziale stringendo il petto.",
        tips: ["Non scendere troppo per proteggere le spalle", "Focus sulla contrazione del petto"]
    },
    "dumbbell-incline-fly": {
        id: "dumbbell-incline-fly",
        name: "Croci Manubri Panca Inclinata",
        category: "manubri",
        primaryMuscles: ["petto"],
        secondaryMuscles: [],
        type: "isolation",
        difficulty: "beginner",
        equipment: ["manubri", "panca"],
        instructions: "Come le croci su panca piana ma con panca inclinata a 30-45 gradi.",
        tips: ["Ottimo per la parte alta del petto"]
    },
    "dumbbell-pullover": {
        id: "dumbbell-pullover",
        name: "Pullover Manubrio",
        category: "manubri",
        primaryMuscles: ["petto"],
        secondaryMuscles: ["schiena", "tricipiti"],
        type: "compound",
        difficulty: "intermediate",
        equipment: ["manubri", "panca"],
        instructions: "Sdraiato sulla panca, tieni un manubrio sopra il petto con entrambe le mani. Abbassa il peso dietro la testa mantenendo le braccia leggermente flesse, poi torna su.",
        tips: ["Ottimo per espandere la cassa toracica", "Movimento controllato"]
    },

    // Macchine
    "chest-press-machine": {
        id: "chest-press-machine",
        name: "Chest Press Machine",
        category: "macchine",
        primaryMuscles: ["petto"],
        secondaryMuscles: ["tricipiti", "spalle"],
        type: "compound",
        difficulty: "beginner",
        equipment: ["macchine"],
        instructions: "Siediti con la schiena ben appoggiata. Spingi le maniglie in avanti estendendo le braccia, poi torna controllando.",
        tips: ["Ottimo per principianti", "Movimento guidato e sicuro"]
    },
    "incline-chest-press-machine": {
        id: "incline-chest-press-machine",
        name: "Incline Chest Press Machine",
        category: "macchine",
        primaryMuscles: ["petto"],
        secondaryMuscles: ["tricipiti", "spalle"],
        type: "compound",
        difficulty: "beginner",
        equipment: ["macchine"],
        instructions: "Come la chest press ma con angolazione inclinata.",
        tips: ["Focus parte alta del petto"]
    },
    "pec-deck": {
        id: "pec-deck",
        name: "Pec Deck (Butterfly)",
        category: "macchine",
        primaryMuscles: ["petto"],
        secondaryMuscles: [],
        type: "isolation",
        difficulty: "beginner",
        equipment: ["macchine"],
        instructions: "Siediti con la schiena appoggiata, gomiti sui cuscinetti. Chiudi le braccia davanti al petto contraendo i pettorali.",
        tips: ["Ottimo per l'isolamento del petto", "Non usare troppo peso"]
    },
    "smith-bench-press": {
        id: "smith-bench-press",
        name: "Panca Piana Smith Machine",
        category: "macchine",
        primaryMuscles: ["petto"],
        secondaryMuscles: ["tricipiti", "spalle"],
        type: "compound",
        difficulty: "beginner",
        equipment: ["macchine", "panca"],
        instructions: "Esegui la panca piana con la guida della Smith Machine.",
        tips: ["Movimento guidato per maggiore sicurezza", "Buono per spingere al limite"]
    },

    // Cavi
    "cable-crossover": {
        id: "cable-crossover",
        name: "Cable Crossover",
        category: "cavi",
        primaryMuscles: ["petto"],
        secondaryMuscles: [],
        type: "isolation",
        difficulty: "intermediate",
        equipment: ["cavi"],
        instructions: "In piedi tra due cavi alti, porta le maniglie in basso e davanti incrociandole, contraendo il petto.",
        tips: ["Ottimo per la definizione", "Varia l'angolo per colpire diverse aree"]
    },
    "cable-fly-low": {
        id: "cable-fly-low",
        name: "Cable Fly dal Basso",
        category: "cavi",
        primaryMuscles: ["petto"],
        secondaryMuscles: [],
        type: "isolation",
        difficulty: "intermediate",
        equipment: ["cavi"],
        instructions: "Con i cavi in posizione bassa, porta le maniglie verso l'alto e davanti.",
        tips: ["Focus sulla parte alta del petto"]
    },
    "cable-fly-mid": {
        id: "cable-fly-mid",
        name: "Cable Fly Centrale",
        category: "cavi",
        primaryMuscles: ["petto"],
        secondaryMuscles: [],
        type: "isolation",
        difficulty: "intermediate",
        equipment: ["cavi"],
        instructions: "Con i cavi all'altezza del petto, porta le maniglie davanti a te.",
        tips: ["Lavoro uniforme su tutto il petto"]
    },

    // Corpo Libero
    "push-up": {
        id: "push-up",
        name: "Push-Up (Piegamenti)",
        category: "corpo-libero",
        primaryMuscles: ["petto"],
        secondaryMuscles: ["tricipiti", "spalle", "addome"],
        type: "compound",
        difficulty: "beginner",
        equipment: [],
        instructions: "In posizione di plank, abbassa il corpo piegando i gomiti fino a sfiorare il pavimento, poi spingi verso l'alto.",
        tips: ["Corpo in linea retta", "Non flettere i fianchi"]
    },
    "diamond-push-up": {
        id: "diamond-push-up",
        name: "Diamond Push-Up",
        category: "corpo-libero",
        primaryMuscles: ["petto", "tricipiti"],
        secondaryMuscles: ["spalle"],
        type: "compound",
        difficulty: "intermediate",
        equipment: [],
        instructions: "Push-up con le mani vicine a formare un diamante sotto il petto.",
        tips: ["Enfatizza tricipiti e parte interna del petto"]
    },
    "wide-push-up": {
        id: "wide-push-up",
        name: "Wide Push-Up",
        category: "corpo-libero",
        primaryMuscles: ["petto"],
        secondaryMuscles: ["spalle"],
        type: "compound",
        difficulty: "beginner",
        equipment: [],
        instructions: "Push-up con le mani più larghe delle spalle.",
        tips: ["Maggiore enfasi sul petto"]
    },
    "decline-push-up": {
        id: "decline-push-up",
        name: "Decline Push-Up",
        category: "corpo-libero",
        primaryMuscles: ["petto"],
        secondaryMuscles: ["tricipiti", "spalle"],
        type: "compound",
        difficulty: "intermediate",
        equipment: [],
        instructions: "Push-up con i piedi rialzati su una panca o step.",
        tips: ["Aumenta il carico sulla parte alta del petto"]
    },
    "dips": {
        id: "dips",
        name: "Dips alle Parallele",
        category: "corpo-libero",
        primaryMuscles: ["petto", "tricipiti"],
        secondaryMuscles: ["spalle"],
        type: "compound",
        difficulty: "intermediate",
        equipment: ["parallele"],
        instructions: "Alle parallele, abbassati piegando i gomiti e inclinando il busto in avanti, poi spingi verso l'alto.",
        tips: ["Inclinati in avanti per enfatizzare il petto", "Più verticale = più tricipiti"]
    },

    // ========================================
    // SCHIENA (Back)
    // ========================================

    // Bilanciere
    "deadlift": {
        id: "deadlift",
        name: "Stacco da Terra",
        category: "bilanciere",
        primaryMuscles: ["schiena"],
        secondaryMuscles: ["glutei", "femorali", "avambracci", "trapezio"],
        type: "compound",
        difficulty: "advanced",
        equipment: ["bilanciere"],
        instructions: "Con i piedi alla larghezza delle anche, afferra il bilanciere. Solleva mantenendo la schiena dritta, spingendo con le gambe e i glutei.",
        tips: ["Schiena neutra sempre", "Il bilanciere deve stare vicino alle gambe", "Non curvare la lombare"]
    },
    "barbell-row": {
        id: "barbell-row",
        name: "Rematore Bilanciere",
        category: "bilanciere",
        primaryMuscles: ["schiena"],
        secondaryMuscles: ["bicipiti", "trapezio"],
        type: "compound",
        difficulty: "intermediate",
        equipment: ["bilanciere"],
        instructions: "Piegato in avanti con la schiena dritta, tira il bilanciere verso l'addome.",
        tips: ["Tira con i gomiti, non con le braccia", "Contrai le scapole in alto"]
    },
    "pendlay-row": {
        id: "pendlay-row",
        name: "Pendlay Row",
        category: "bilanciere",
        primaryMuscles: ["schiena"],
        secondaryMuscles: ["bicipiti", "trapezio"],
        type: "compound",
        difficulty: "advanced",
        equipment: ["bilanciere"],
        instructions: "Come il rematore ma partendo dal pavimento ad ogni ripetizione.",
        tips: ["Movimento esplosivo", "Ottimo per la forza"]
    },
    "t-bar-row": {
        id: "t-bar-row",
        name: "T-Bar Row",
        category: "bilanciere",
        primaryMuscles: ["schiena"],
        secondaryMuscles: ["bicipiti", "trapezio"],
        type: "compound",
        difficulty: "intermediate",
        equipment: ["bilanciere"],
        instructions: "Con il bilanciere fissato da un lato, tira verso il petto con presa stretta.",
        tips: ["Ottimo per lo spessore della schiena"]
    },

    // Manubri
    "dumbbell-row": {
        id: "dumbbell-row",
        name: "Rematore Manubrio",
        category: "manubri",
        primaryMuscles: ["schiena"],
        secondaryMuscles: ["bicipiti"],
        type: "compound",
        difficulty: "beginner",
        equipment: ["manubri", "panca"],
        instructions: "Con una mano e un ginocchio sulla panca, tira il manubrio verso il fianco.",
        tips: ["Non ruotare il busto", "Tira con il gomito"]
    },
    "dumbbell-row-two-arm": {
        id: "dumbbell-row-two-arm",
        name: "Rematore Manubri Due Braccia",
        category: "manubri",
        primaryMuscles: ["schiena"],
        secondaryMuscles: ["bicipiti", "trapezio"],
        type: "compound",
        difficulty: "intermediate",
        equipment: ["manubri"],
        instructions: "Piegato in avanti, tira entrambi i manubri verso i fianchi.",
        tips: ["Mantieni la schiena dritta"]
    },
    "dumbbell-shrug": {
        id: "dumbbell-shrug",
        name: "Scrollate Manubri",
        category: "manubri",
        primaryMuscles: ["trapezio"],
        secondaryMuscles: [],
        type: "isolation",
        difficulty: "beginner",
        equipment: ["manubri"],
        instructions: "In piedi con i manubri ai lati, solleva le spalle verso le orecchie.",
        tips: ["Non ruotare le spalle", "Tieni la posizione in alto"]
    },

    // Macchine
    "lat-pulldown": {
        id: "lat-pulldown",
        name: "Lat Machine Avanti",
        category: "macchine",
        primaryMuscles: ["schiena"],
        secondaryMuscles: ["bicipiti"],
        type: "compound",
        difficulty: "beginner",
        equipment: ["macchine"],
        instructions: "Seduto alla lat machine, tira la barra verso il petto alto mantenendo il petto in fuori.",
        tips: ["Tira con i gomiti verso il basso", "Non tirare dietro la testa"]
    },
    "lat-pulldown-close": {
        id: "lat-pulldown-close",
        name: "Lat Machine Presa Stretta",
        category: "macchine",
        primaryMuscles: ["schiena"],
        secondaryMuscles: ["bicipiti"],
        type: "compound",
        difficulty: "beginner",
        equipment: ["macchine"],
        instructions: "Come la lat machine ma con presa stretta triangolare.",
        tips: ["Enfatizza la parte bassa dei dorsali"]
    },
    "seated-cable-row": {
        id: "seated-cable-row",
        name: "Pulley Basso",
        category: "macchine",
        primaryMuscles: ["schiena"],
        secondaryMuscles: ["bicipiti", "trapezio"],
        type: "compound",
        difficulty: "beginner",
        equipment: ["macchine"],
        instructions: "Seduto al pulley, tira la maniglia verso l'addome mantenendo la schiena dritta.",
        tips: ["Non usare lo slancio del busto", "Contrai le scapole"]
    },
    "machine-row": {
        id: "machine-row",
        name: "Row Machine",
        category: "macchine",
        primaryMuscles: ["schiena"],
        secondaryMuscles: ["bicipiti"],
        type: "compound",
        difficulty: "beginner",
        equipment: ["macchine"],
        instructions: "Seduto alla macchina, tira le maniglie verso di te.",
        tips: ["Movimento guidato e sicuro"]
    },
    "assisted-pull-up": {
        id: "assisted-pull-up",
        name: "Trazioni Assistite",
        category: "macchine",
        primaryMuscles: ["schiena"],
        secondaryMuscles: ["bicipiti"],
        type: "compound",
        difficulty: "beginner",
        equipment: ["macchine"],
        instructions: "Alla macchina per trazioni assistite, esegui il movimento di trazione con assistenza.",
        tips: ["Ottimo per progredire verso le trazioni libere"]
    },
    "hyperextension": {
        id: "hyperextension",
        name: "Hyperextension",
        category: "macchine",
        primaryMuscles: ["schiena"],
        secondaryMuscles: ["glutei", "femorali"],
        type: "isolation",
        difficulty: "beginner",
        equipment: ["macchine"],
        instructions: "Sulla panca romana, abbassati piegando i fianchi poi risali contraendo i lombari.",
        tips: ["Non iperestendere", "Ottimo per i lombari"]
    },

    // Cavi
    "straight-arm-pulldown": {
        id: "straight-arm-pulldown",
        name: "Pulldown Braccia Tese",
        category: "cavi",
        primaryMuscles: ["schiena"],
        secondaryMuscles: [],
        type: "isolation",
        difficulty: "intermediate",
        equipment: ["cavi"],
        instructions: "In piedi di fronte al cavo alto, spingi la barra verso il basso mantenendo le braccia tese.",
        tips: ["Isola i dorsali", "Non piegare i gomiti"]
    },
    "face-pull": {
        id: "face-pull",
        name: "Face Pull",
        category: "cavi",
        primaryMuscles: ["trapezio", "spalle"],
        secondaryMuscles: ["schiena"],
        type: "isolation",
        difficulty: "beginner",
        equipment: ["cavi"],
        instructions: "Al cavo alto con corda, tira verso il viso separando le mani.",
        tips: ["Ottimo per la postura", "Rotazione esterna delle spalle"]
    },

    // Corpo Libero
    "pull-up": {
        id: "pull-up",
        name: "Trazioni Presa Prona",
        category: "corpo-libero",
        primaryMuscles: ["schiena"],
        secondaryMuscles: ["bicipiti"],
        type: "compound",
        difficulty: "advanced",
        equipment: ["sbarra"],
        instructions: "Appeso alla sbarra con presa prona, tirati su fino a portare il mento sopra la sbarra.",
        tips: ["Inizia da braccia completamente distese", "Contrai le scapole"]
    },
    "chin-up": {
        id: "chin-up",
        name: "Trazioni Presa Supina",
        category: "corpo-libero",
        primaryMuscles: ["schiena", "bicipiti"],
        secondaryMuscles: [],
        type: "compound",
        difficulty: "intermediate",
        equipment: ["sbarra"],
        instructions: "Come le trazioni ma con i palmi verso di te.",
        tips: ["Più coinvolgimento dei bicipiti"]
    },
    "neutral-grip-pull-up": {
        id: "neutral-grip-pull-up",
        name: "Trazioni Presa Neutra",
        category: "corpo-libero",
        primaryMuscles: ["schiena"],
        secondaryMuscles: ["bicipiti"],
        type: "compound",
        difficulty: "intermediate",
        equipment: ["sbarra"],
        instructions: "Trazioni con i palmi uno di fronte all'altro.",
        tips: ["Più facile per i polsi"]
    },
    "inverted-row": {
        id: "inverted-row",
        name: "Australian Pull-Up",
        category: "corpo-libero",
        primaryMuscles: ["schiena"],
        secondaryMuscles: ["bicipiti"],
        type: "compound",
        difficulty: "beginner",
        equipment: ["sbarra"],
        instructions: "Sotto una sbarra bassa, tirati su mantenendo il corpo in linea.",
        tips: ["Ottima propedeutica per le trazioni"]
    },
    "superman": {
        id: "superman",
        name: "Superman",
        category: "corpo-libero",
        primaryMuscles: ["schiena"],
        secondaryMuscles: ["glutei"],
        type: "isolation",
        difficulty: "beginner",
        equipment: [],
        instructions: "Sdraiato a pancia in giù, solleva braccia e gambe contemporaneamente.",
        tips: ["Ottimo per i lombari", "Tieni la posizione 2-3 secondi"]
    },

    // ========================================
    // SPALLE (Shoulders)
    // ========================================

    // Bilanciere
    "overhead-press": {
        id: "overhead-press",
        name: "Military Press",
        category: "bilanciere",
        primaryMuscles: ["spalle"],
        secondaryMuscles: ["tricipiti", "trapezio"],
        type: "compound",
        difficulty: "intermediate",
        equipment: ["bilanciere"],
        instructions: "In piedi, spingi il bilanciere sopra la testa partendo dalle clavicole.",
        tips: ["Core contratto", "Non arcuare la schiena"]
    },
    "push-press": {
        id: "push-press",
        name: "Push Press",
        category: "bilanciere",
        primaryMuscles: ["spalle"],
        secondaryMuscles: ["tricipiti", "quadricipiti"],
        type: "compound",
        difficulty: "advanced",
        equipment: ["bilanciere"],
        instructions: "Come l'overhead press ma con una leggera spinta delle gambe.",
        tips: ["Permette di usare carichi maggiori"]
    },
    "barbell-front-raise": {
        id: "barbell-front-raise",
        name: "Alzate Frontali Bilanciere",
        category: "bilanciere",
        primaryMuscles: ["spalle"],
        secondaryMuscles: [],
        type: "isolation",
        difficulty: "beginner",
        equipment: ["bilanciere"],
        instructions: "In piedi, solleva il bilanciere davanti a te fino all'altezza delle spalle.",
        tips: ["Non usare slancio", "Deltoide anteriore"]
    },
    "upright-row": {
        id: "upright-row",
        name: "Tirate al Mento",
        category: "bilanciere",
        primaryMuscles: ["spalle", "trapezio"],
        secondaryMuscles: ["bicipiti"],
        type: "compound",
        difficulty: "intermediate",
        equipment: ["bilanciere"],
        instructions: "Tira il bilanciere verso il mento tenendo i gomiti alti.",
        tips: ["Presa larga per le spalle, stretta per il trapezio"]
    },

    // Manubri
    "dumbbell-shoulder-press": {
        id: "dumbbell-shoulder-press",
        name: "Shoulder Press Manubri",
        category: "manubri",
        primaryMuscles: ["spalle"],
        secondaryMuscles: ["tricipiti"],
        type: "compound",
        difficulty: "beginner",
        equipment: ["manubri"],
        instructions: "Seduto o in piedi, spingi i manubri sopra la testa.",
        tips: ["Non urtare i manubri in alto", "Controllo in discesa"]
    },
    "arnold-press": {
        id: "arnold-press",
        name: "Arnold Press",
        category: "manubri",
        primaryMuscles: ["spalle"],
        secondaryMuscles: ["tricipiti"],
        type: "compound",
        difficulty: "intermediate",
        equipment: ["manubri"],
        instructions: "Parti con i manubri davanti al viso, ruota mentre spingi sopra la testa.",
        tips: ["Lavora tutti e tre i capi del deltoide"]
    },
    "lateral-raise": {
        id: "lateral-raise",
        name: "Alzate Laterali",
        category: "manubri",
        primaryMuscles: ["spalle"],
        secondaryMuscles: [],
        type: "isolation",
        difficulty: "beginner",
        equipment: ["manubri"],
        instructions: "Solleva i manubri lateralmente fino all'altezza delle spalle.",
        tips: ["Leggera flessione dei gomiti", "Non superare l'altezza delle spalle"]
    },
    "front-raise": {
        id: "front-raise",
        name: "Alzate Frontali Manubri",
        category: "manubri",
        primaryMuscles: ["spalle"],
        secondaryMuscles: [],
        type: "isolation",
        difficulty: "beginner",
        equipment: ["manubri"],
        instructions: "Solleva i manubri davanti a te alternando o insieme.",
        tips: ["Deltoide anteriore"]
    },
    "rear-delt-fly": {
        id: "rear-delt-fly",
        name: "Alzate Posteriori (Rear Delt)",
        category: "manubri",
        primaryMuscles: ["spalle"],
        secondaryMuscles: ["trapezio"],
        type: "isolation",
        difficulty: "beginner",
        equipment: ["manubri"],
        instructions: "Piegato in avanti, solleva i manubri lateralmente.",
        tips: ["Deltoide posteriore", "Gomiti leggermente flessi"]
    },
    // Doppione di "dumbbell-shrug": resta per lo storico, nascosto da elenchi e schede
    "dumbbell-shrug-shoulders": {
        id: "dumbbell-shrug-shoulders",
        hidden: true,
        name: "Scrollate Manubri",
        category: "manubri",
        primaryMuscles: ["trapezio"],
        secondaryMuscles: [],
        type: "isolation",
        difficulty: "beginner",
        equipment: ["manubri"],
        instructions: "Solleva le spalle verso le orecchie tenendo i manubri.",
        tips: ["Tieni la contrazione in alto"]
    },

    // Macchine
    "shoulder-press-machine": {
        id: "shoulder-press-machine",
        name: "Shoulder Press Machine",
        category: "macchine",
        primaryMuscles: ["spalle"],
        secondaryMuscles: ["tricipiti"],
        type: "compound",
        difficulty: "beginner",
        equipment: ["macchine"],
        instructions: "Seduto alla macchina, spingi le maniglie sopra la testa.",
        tips: ["Movimento guidato e sicuro"]
    },
    "lateral-raise-machine": {
        id: "lateral-raise-machine",
        name: "Lateral Raise Machine",
        category: "macchine",
        primaryMuscles: ["spalle"],
        secondaryMuscles: [],
        type: "isolation",
        difficulty: "beginner",
        equipment: ["macchine"],
        instructions: "Seduto con le braccia sui cuscinetti, solleva lateralmente.",
        tips: ["Ottimo isolamento del deltoide laterale"]
    },
    "reverse-pec-deck": {
        id: "reverse-pec-deck",
        name: "Reverse Pec Deck",
        category: "macchine",
        primaryMuscles: ["spalle"],
        secondaryMuscles: ["trapezio", "schiena"],
        type: "isolation",
        difficulty: "beginner",
        equipment: ["macchine"],
        instructions: "Seduto alla pec deck al contrario, apri le braccia all'indietro.",
        tips: ["Ottimo per il deltoide posteriore"]
    },

    // Cavi
    "cable-lateral-raise": {
        id: "cable-lateral-raise",
        name: "Alzate Laterali ai Cavi",
        category: "cavi",
        primaryMuscles: ["spalle"],
        secondaryMuscles: [],
        type: "isolation",
        difficulty: "intermediate",
        equipment: ["cavi"],
        instructions: "Con il cavo dal basso, solleva lateralmente.",
        tips: ["Tensione costante durante tutto il movimento"]
    },
    "cable-front-raise": {
        id: "cable-front-raise",
        name: "Alzate Frontali ai Cavi",
        category: "cavi",
        primaryMuscles: ["spalle"],
        secondaryMuscles: [],
        type: "isolation",
        difficulty: "intermediate",
        equipment: ["cavi"],
        instructions: "Con il cavo dietro di te, solleva in avanti.",
        tips: ["Tensione costante"]
    },
    "cable-rear-delt": {
        id: "cable-rear-delt",
        name: "Rear Delt ai Cavi",
        category: "cavi",
        primaryMuscles: ["spalle"],
        secondaryMuscles: ["trapezio"],
        type: "isolation",
        difficulty: "intermediate",
        equipment: ["cavi"],
        instructions: "Cavi incrociati, tira all'indietro e in alto.",
        tips: ["Ottimo per il deltoide posteriore"]
    },

    // Corpo Libero
    "pike-push-up": {
        id: "pike-push-up",
        name: "Pike Push-Up",
        category: "corpo-libero",
        primaryMuscles: ["spalle"],
        secondaryMuscles: ["tricipiti"],
        type: "compound",
        difficulty: "intermediate",
        equipment: [],
        instructions: "In posizione a V rovesciata, abbassati piegando i gomiti.",
        tips: ["Propedeutica per l'handstand push-up"]
    },
    "handstand-push-up": {
        id: "handstand-push-up",
        name: "Handstand Push-Up",
        category: "corpo-libero",
        primaryMuscles: ["spalle"],
        secondaryMuscles: ["tricipiti", "trapezio"],
        type: "compound",
        difficulty: "advanced",
        equipment: [],
        instructions: "In verticale contro il muro, abbassati e spingi.",
        tips: ["Esercizio avanzato", "Richiede buona forza base"]
    },

    // ========================================
    // BRACCIA - BICIPITI
    // ========================================

    // Bilanciere
    "barbell-curl": {
        id: "barbell-curl",
        name: "Curl Bilanciere",
        category: "bilanciere",
        primaryMuscles: ["bicipiti"],
        secondaryMuscles: ["avambracci"],
        type: "isolation",
        difficulty: "beginner",
        equipment: ["bilanciere"],
        instructions: "In piedi, curl il bilanciere verso le spalle mantenendo i gomiti fermi.",
        tips: ["Non oscillare", "Contrai i bicipiti in alto"]
    },
    "ez-bar-curl": {
        id: "ez-bar-curl",
        name: "Curl Bilanciere EZ",
        category: "bilanciere",
        primaryMuscles: ["bicipiti"],
        secondaryMuscles: ["avambracci"],
        type: "isolation",
        difficulty: "beginner",
        equipment: ["bilanciere"],
        instructions: "Come il curl classico ma con barra EZ per minor stress ai polsi.",
        tips: ["Più confortevole per i polsi"]
    },
    "preacher-curl": {
        id: "preacher-curl",
        name: "Preacher Curl (Panca Scott)",
        category: "bilanciere",
        primaryMuscles: ["bicipiti"],
        secondaryMuscles: [],
        type: "isolation",
        difficulty: "beginner",
        equipment: ["bilanciere", "panca"],
        instructions: "Appoggia le braccia sulla panca Scott e curla il bilanciere.",
        tips: ["Isola i bicipiti eliminando lo slancio"]
    },

    // Manubri
    "dumbbell-curl": {
        id: "dumbbell-curl",
        name: "Curl Manubri",
        category: "manubri",
        primaryMuscles: ["bicipiti"],
        secondaryMuscles: ["avambracci"],
        type: "isolation",
        difficulty: "beginner",
        equipment: ["manubri"],
        instructions: "Curl con i manubri alternati o simultanei.",
        tips: ["Supina in alto per massima contrazione"]
    },
    "hammer-curl": {
        id: "hammer-curl",
        name: "Hammer Curl",
        category: "manubri",
        primaryMuscles: ["bicipiti"],
        secondaryMuscles: ["avambracci"],
        type: "isolation",
        difficulty: "beginner",
        equipment: ["manubri"],
        instructions: "Curl con presa neutra (pollici in alto).",
        tips: ["Lavora anche il brachiale"]
    },
    "incline-curl": {
        id: "incline-curl",
        name: "Curl Panca Inclinata",
        category: "manubri",
        primaryMuscles: ["bicipiti"],
        secondaryMuscles: [],
        type: "isolation",
        difficulty: "intermediate",
        equipment: ["manubri", "panca"],
        instructions: "Sdraiato su panca inclinata, curla i manubri.",
        tips: ["Maggiore stretch del bicipite"]
    },
    "concentration-curl": {
        id: "concentration-curl",
        name: "Concentration Curl",
        category: "manubri",
        primaryMuscles: ["bicipiti"],
        secondaryMuscles: [],
        type: "isolation",
        difficulty: "beginner",
        equipment: ["manubri"],
        instructions: "Seduto, gomito sulla coscia, curla il manubrio.",
        tips: ["Massimo isolamento"]
    },
    "spider-curl": {
        id: "spider-curl",
        name: "Spider Curl",
        category: "manubri",
        primaryMuscles: ["bicipiti"],
        secondaryMuscles: [],
        type: "isolation",
        difficulty: "intermediate",
        equipment: ["manubri", "panca"],
        instructions: "Appoggiato a pancia in giù su panca inclinata, curla.",
        tips: ["Ottimo per il picco del bicipite"]
    },

    // Cavi
    "cable-curl": {
        id: "cable-curl",
        name: "Curl ai Cavi",
        category: "cavi",
        primaryMuscles: ["bicipiti"],
        secondaryMuscles: [],
        type: "isolation",
        difficulty: "beginner",
        equipment: ["cavi"],
        instructions: "Al cavo basso, curla la barra verso le spalle.",
        tips: ["Tensione costante"]
    },
    "cable-hammer-curl": {
        id: "cable-hammer-curl",
        name: "Hammer Curl ai Cavi",
        category: "cavi",
        primaryMuscles: ["bicipiti"],
        secondaryMuscles: ["avambracci"],
        type: "isolation",
        difficulty: "beginner",
        equipment: ["cavi"],
        instructions: "Al cavo con corda, curla con presa neutra.",
        tips: ["Lavora brachiale e brachioradiale"]
    },

    // Macchine
    "bicep-curl-machine": {
        id: "bicep-curl-machine",
        name: "Bicep Curl Machine",
        category: "macchine",
        primaryMuscles: ["bicipiti"],
        secondaryMuscles: [],
        type: "isolation",
        difficulty: "beginner",
        equipment: ["macchine"],
        instructions: "Seduto alla macchina, curla seguendo il movimento guidato.",
        tips: ["Movimento isolato e controllato"]
    },

    // ========================================
    // BRACCIA - TRICIPITI
    // ========================================

    // Bilanciere
    "close-grip-bench": {
        id: "close-grip-bench",
        name: "Panca Presa Stretta",
        category: "bilanciere",
        primaryMuscles: ["tricipiti"],
        secondaryMuscles: ["petto", "spalle"],
        type: "compound",
        difficulty: "intermediate",
        equipment: ["bilanciere", "panca"],
        instructions: "Panca piana con presa alla larghezza delle spalle o più stretta.",
        tips: ["Gomiti vicini al corpo"]
    },
    "skull-crusher": {
        id: "skull-crusher",
        name: "Skull Crusher (French Press)",
        category: "bilanciere",
        primaryMuscles: ["tricipiti"],
        secondaryMuscles: [],
        type: "isolation",
        difficulty: "intermediate",
        equipment: ["bilanciere", "panca"],
        instructions: "Sdraiato, abbassa il bilanciere verso la fronte piegando i gomiti.",
        tips: ["Gomiti fermi", "Usa EZ bar per comfort"]
    },

    // Manubri
    "dumbbell-tricep-extension": {
        id: "dumbbell-tricep-extension",
        name: "French Press Manubrio",
        category: "manubri",
        primaryMuscles: ["tricipiti"],
        secondaryMuscles: [],
        type: "isolation",
        difficulty: "beginner",
        equipment: ["manubri"],
        instructions: "Seduto o in piedi, abbassa il manubrio dietro la testa.",
        tips: ["Gomiti fermi e vicini alla testa"]
    },
    "dumbbell-kickback": {
        id: "dumbbell-kickback",
        name: "Kickback Tricipiti",
        category: "manubri",
        primaryMuscles: ["tricipiti"],
        secondaryMuscles: [],
        type: "isolation",
        difficulty: "beginner",
        equipment: ["manubri"],
        instructions: "Piegato in avanti, estendi il braccio all'indietro.",
        tips: ["Gomito fermo", "Contrai in alto"]
    },
    "tate-press": {
        id: "tate-press",
        name: "Tate Press",
        category: "manubri",
        primaryMuscles: ["tricipiti"],
        secondaryMuscles: [],
        type: "isolation",
        difficulty: "intermediate",
        equipment: ["manubri", "panca"],
        instructions: "Sdraiato, abbassa i manubri verso il petto piegando i gomiti verso l'esterno.",
        tips: ["Movimento particolare ma efficace"]
    },

    // Cavi
    "tricep-pushdown": {
        id: "tricep-pushdown",
        name: "Pushdown Tricipiti",
        category: "cavi",
        primaryMuscles: ["tricipiti"],
        secondaryMuscles: [],
        type: "isolation",
        difficulty: "beginner",
        equipment: ["cavi"],
        instructions: "Al cavo alto, spingi la barra verso il basso estendendo i gomiti.",
        tips: ["Gomiti fermi ai fianchi"]
    },
    "rope-pushdown": {
        id: "rope-pushdown",
        name: "Pushdown Corda",
        category: "cavi",
        primaryMuscles: ["tricipiti"],
        secondaryMuscles: [],
        type: "isolation",
        difficulty: "beginner",
        equipment: ["cavi"],
        instructions: "Come il pushdown ma con la corda, separa le mani in basso.",
        tips: ["Separa le mani per maggiore contrazione"]
    },
    "overhead-cable-extension": {
        id: "overhead-cable-extension",
        name: "Estensioni Overhead ai Cavi",
        category: "cavi",
        primaryMuscles: ["tricipiti"],
        secondaryMuscles: [],
        type: "isolation",
        difficulty: "intermediate",
        equipment: ["cavi"],
        instructions: "Di spalle al cavo basso, estendi sopra la testa.",
        tips: ["Ottimo stretch del capo lungo"]
    },

    // Corpo Libero
    "bench-dips": {
        id: "bench-dips",
        name: "Dips su Panca",
        category: "corpo-libero",
        primaryMuscles: ["tricipiti"],
        secondaryMuscles: ["petto", "spalle"],
        type: "compound",
        difficulty: "beginner",
        equipment: ["panca"],
        instructions: "Mani sulla panca dietro di te, abbassati e spingi.",
        tips: ["Gambe più distanti = più difficile"]
    },
    "close-grip-push-up": {
        id: "close-grip-push-up",
        name: "Push-Up Presa Stretta",
        category: "corpo-libero",
        primaryMuscles: ["tricipiti"],
        secondaryMuscles: ["petto"],
        type: "compound",
        difficulty: "beginner",
        equipment: [],
        instructions: "Push-up con le mani vicine.",
        tips: ["Enfatizza i tricipiti"]
    },

    // Macchine
    "tricep-dip-machine": {
        id: "tricep-dip-machine",
        name: "Tricep Dip Machine",
        category: "macchine",
        primaryMuscles: ["tricipiti"],
        secondaryMuscles: [],
        type: "compound",
        difficulty: "beginner",
        equipment: ["macchine"],
        instructions: "Seduto alla macchina, spingi verso il basso.",
        tips: ["Movimento guidato"]
    },

    // ========================================
    // GAMBE - QUADRICIPITI
    // ========================================

    // Bilanciere
    "squat": {
        id: "squat",
        name: "Squat con Bilanciere",
        category: "bilanciere",
        primaryMuscles: ["quadricipiti"],
        secondaryMuscles: ["glutei", "femorali", "addome"],
        type: "compound",
        difficulty: "intermediate",
        equipment: ["bilanciere"],
        instructions: "Bilanciere sulle spalle, scendi piegando le ginocchia fino a quando le cosce sono parallele al suolo.",
        tips: ["Ginocchia in linea con le punte dei piedi", "Schiena dritta", "Non sollevare i talloni"]
    },
    "front-squat": {
        id: "front-squat",
        name: "Front Squat",
        category: "bilanciere",
        primaryMuscles: ["quadricipiti"],
        secondaryMuscles: ["glutei", "addome"],
        type: "compound",
        difficulty: "advanced",
        equipment: ["bilanciere"],
        instructions: "Bilanciere davanti alle spalle, scendi mantenendo il busto verticale.",
        tips: ["Più enfasi sui quadricipiti", "Richiede buona mobilità"]
    },
    "bulgarian-split-squat-bb": {
        id: "bulgarian-split-squat-bb",
        name: "Bulgarian Split Squat Bilanciere",
        category: "bilanciere",
        primaryMuscles: ["quadricipiti"],
        secondaryMuscles: ["glutei"],
        type: "compound",
        difficulty: "advanced",
        equipment: ["bilanciere", "panca"],
        instructions: "Piede posteriore su panca, scendi con la gamba anteriore.",
        tips: ["Ottimo per equilibrio e unilateralità"]
    },

    // Manubri
    "goblet-squat": {
        id: "goblet-squat",
        name: "Goblet Squat",
        category: "manubri",
        primaryMuscles: ["quadricipiti"],
        secondaryMuscles: ["glutei"],
        type: "compound",
        difficulty: "beginner",
        equipment: ["manubri"],
        instructions: "Tieni un manubrio al petto, scendi in squat.",
        tips: ["Ottimo per imparare il movimento"]
    },
    "dumbbell-lunge": {
        id: "dumbbell-lunge",
        name: "Affondi con Manubri",
        category: "manubri",
        primaryMuscles: ["quadricipiti"],
        secondaryMuscles: ["glutei", "femorali"],
        type: "compound",
        difficulty: "beginner",
        equipment: ["manubri"],
        instructions: "Passo avanti, scendi fino a 90 gradi con entrambe le ginocchia.",
        tips: ["Non far sbattere il ginocchio a terra"]
    },
    "bulgarian-split-squat": {
        id: "bulgarian-split-squat",
        name: "Bulgarian Split Squat",
        category: "manubri",
        primaryMuscles: ["quadricipiti"],
        secondaryMuscles: ["glutei"],
        type: "compound",
        difficulty: "intermediate",
        equipment: ["manubri", "panca"],
        instructions: "Piede posteriore sulla panca, scendi con la gamba anteriore.",
        tips: ["Eccellente per la forza unilaterale"]
    },
    "step-up": {
        id: "step-up",
        name: "Step-Up",
        category: "manubri",
        primaryMuscles: ["quadricipiti"],
        secondaryMuscles: ["glutei"],
        type: "compound",
        difficulty: "beginner",
        equipment: ["manubri", "panca"],
        instructions: "Sali su una panca spingendo con una gamba.",
        tips: ["Non spingerti con la gamba a terra"]
    },

    // Macchine
    "leg-press": {
        id: "leg-press",
        name: "Leg Press",
        category: "macchine",
        primaryMuscles: ["quadricipiti"],
        secondaryMuscles: ["glutei", "femorali"],
        type: "compound",
        difficulty: "beginner",
        equipment: ["macchine"],
        instructions: "Seduto alla macchina, spingi la piattaforma.",
        tips: ["Non bloccare le ginocchia in alto", "Non sollevare i glutei"]
    },
    "hack-squat": {
        id: "hack-squat",
        name: "Hack Squat",
        category: "macchine",
        primaryMuscles: ["quadricipiti"],
        secondaryMuscles: ["glutei"],
        type: "compound",
        difficulty: "beginner",
        equipment: ["macchine"],
        instructions: "Sulla macchina hack squat, scendi e spingi.",
        tips: ["Movimento guidato per squat sicuro"]
    },
    "leg-extension": {
        id: "leg-extension",
        name: "Leg Extension",
        category: "macchine",
        primaryMuscles: ["quadricipiti"],
        secondaryMuscles: [],
        type: "isolation",
        difficulty: "beginner",
        equipment: ["macchine"],
        instructions: "Seduto alla macchina, estendi le gambe.",
        tips: ["Isolamento puro dei quadricipiti", "Non usare carichi eccessivi"]
    },
    "smith-squat": {
        id: "smith-squat",
        name: "Squat Smith Machine",
        category: "macchine",
        primaryMuscles: ["quadricipiti"],
        secondaryMuscles: ["glutei"],
        type: "compound",
        difficulty: "beginner",
        equipment: ["macchine"],
        instructions: "Squat guidato dalla Smith Machine.",
        tips: ["Buono per principianti o per spingere al limite"]
    },

    // Corpo Libero
    "bodyweight-squat": {
        id: "bodyweight-squat",
        name: "Squat a Corpo Libero",
        category: "corpo-libero",
        primaryMuscles: ["quadricipiti"],
        secondaryMuscles: ["glutei"],
        type: "compound",
        difficulty: "beginner",
        equipment: [],
        instructions: "Scendi in squat senza peso.",
        tips: ["Ottimo per riscaldamento o circuiti"]
    },
    "jump-squat": {
        id: "jump-squat",
        name: "Jump Squat",
        category: "corpo-libero",
        primaryMuscles: ["quadricipiti"],
        secondaryMuscles: ["glutei", "polpacci"],
        type: "compound",
        difficulty: "intermediate",
        equipment: [],
        instructions: "Squat seguito da un salto esplosivo.",
        tips: ["Atterra morbido", "Ottimo per la potenza"]
    },
    "walking-lunge": {
        id: "walking-lunge",
        name: "Walking Lunge",
        category: "corpo-libero",
        primaryMuscles: ["quadricipiti"],
        secondaryMuscles: ["glutei"],
        type: "compound",
        difficulty: "beginner",
        equipment: [],
        instructions: "Affondi camminando in avanti.",
        tips: ["Mantieni il busto eretto"]
    },
    "pistol-squat": {
        id: "pistol-squat",
        name: "Pistol Squat",
        category: "corpo-libero",
        primaryMuscles: ["quadricipiti"],
        secondaryMuscles: ["glutei"],
        type: "compound",
        difficulty: "advanced",
        equipment: [],
        instructions: "Squat su una gamba sola con l'altra tesa in avanti.",
        tips: ["Richiede forza e mobilità avanzate"]
    },

    // ========================================
    // GAMBE - FEMORALI
    // ========================================

    // Bilanciere
    "romanian-deadlift": {
        id: "romanian-deadlift",
        name: "Stacco Rumeno",
        category: "bilanciere",
        primaryMuscles: ["femorali"],
        secondaryMuscles: ["glutei", "schiena"],
        type: "compound",
        difficulty: "intermediate",
        equipment: ["bilanciere"],
        instructions: "Abbassa il bilanciere lungo le gambe tenendole quasi tese, sentendo lo stretch nei femorali.",
        tips: ["Schiena dritta sempre", "Leggera flessione delle ginocchia"]
    },
    "stiff-leg-deadlift": {
        id: "stiff-leg-deadlift",
        name: "Stacco a Gambe Tese",
        category: "bilanciere",
        primaryMuscles: ["femorali"],
        secondaryMuscles: ["glutei", "schiena"],
        type: "compound",
        difficulty: "intermediate",
        equipment: ["bilanciere"],
        instructions: "Come il rumeno ma con le gambe completamente tese.",
        tips: ["Maggiore stretch dei femorali"]
    },
    "good-morning": {
        id: "good-morning",
        name: "Good Morning",
        category: "bilanciere",
        primaryMuscles: ["femorali"],
        secondaryMuscles: ["glutei", "schiena"],
        type: "compound",
        difficulty: "intermediate",
        equipment: ["bilanciere"],
        instructions: "Bilanciere sulle spalle, piegati in avanti mantenendo le gambe quasi tese.",
        tips: ["Inizia con poco peso", "Ottimo per i femorali e i lombari"]
    },

    // Manubri
    "dumbbell-rdl": {
        id: "dumbbell-rdl",
        name: "Stacco Rumeno Manubri",
        category: "manubri",
        primaryMuscles: ["femorali"],
        secondaryMuscles: ["glutei"],
        type: "compound",
        difficulty: "beginner",
        equipment: ["manubri"],
        instructions: "Stacco rumeno con i manubri.",
        tips: ["Permette maggiore range di movimento"]
    },
    "single-leg-rdl": {
        id: "single-leg-rdl",
        name: "Stacco Rumeno Singola Gamba",
        category: "manubri",
        primaryMuscles: ["femorali"],
        secondaryMuscles: ["glutei"],
        type: "compound",
        difficulty: "intermediate",
        // si fa anche a corpo libero: il manubrio (o un peso qualsiasi) è facoltativo
        equipment: [],
        instructions: "Stacco rumeno su una gamba sola, a corpo libero o con un manubrio nella mano opposta.",
        tips: ["Ottimo per equilibrio e unilateralità", "Senza pesi: scendi lento e tieni l'anca in linea"]
    },

    // Macchine
    "leg-curl-lying": {
        id: "leg-curl-lying",
        name: "Leg Curl Sdraiato",
        category: "macchine",
        primaryMuscles: ["femorali"],
        secondaryMuscles: [],
        type: "isolation",
        difficulty: "beginner",
        equipment: ["macchine"],
        instructions: "Sdraiato a pancia in giù, curla le gambe.",
        tips: ["Non sollevare i fianchi"]
    },
    "leg-curl-seated": {
        id: "leg-curl-seated",
        name: "Leg Curl Seduto",
        category: "macchine",
        primaryMuscles: ["femorali"],
        secondaryMuscles: [],
        type: "isolation",
        difficulty: "beginner",
        equipment: ["macchine"],
        instructions: "Seduto alla macchina, curla le gambe.",
        tips: ["Variante comoda del leg curl"]
    },

    // Corpo Libero
    "nordic-curl": {
        id: "nordic-curl",
        name: "Nordic Curl",
        category: "corpo-libero",
        primaryMuscles: ["femorali"],
        secondaryMuscles: [],
        type: "isolation",
        difficulty: "advanced",
        equipment: [],
        instructions: "In ginocchio con i piedi bloccati, abbassati controllando con i femorali.",
        tips: ["Esercizio molto avanzato", "Usa assistenza inizialmente"]
    },
    "glute-ham-raise": {
        id: "glute-ham-raise",
        name: "Glute Ham Raise",
        category: "macchine",
        primaryMuscles: ["femorali"],
        secondaryMuscles: ["glutei"],
        type: "compound",
        difficulty: "advanced",
        equipment: ["macchine"],
        instructions: "Sulla GHD machine, abbassati e risali usando femorali e glutei.",
        tips: ["Eccellente per la catena posteriore"]
    },

    // ========================================
    // GAMBE - GLUTEI
    // ========================================

    // Bilanciere
    "hip-thrust": {
        id: "hip-thrust",
        name: "Hip Thrust",
        category: "bilanciere",
        primaryMuscles: ["glutei"],
        secondaryMuscles: ["femorali"],
        type: "compound",
        difficulty: "intermediate",
        equipment: ["bilanciere", "panca"],
        instructions: "Schiena sulla panca, bilanciere sui fianchi, spingi verso l'alto.",
        tips: ["Contrai i glutei in alto", "Non iperestendere la schiena"]
    },
    "sumo-deadlift": {
        id: "sumo-deadlift",
        name: "Stacco Sumo",
        category: "bilanciere",
        primaryMuscles: ["glutei"],
        secondaryMuscles: ["quadricipiti", "femorali", "schiena"],
        type: "compound",
        difficulty: "intermediate",
        equipment: ["bilanciere"],
        instructions: "Stacco con piedi larghi e presa stretta.",
        tips: ["Più enfasi su glutei e interno coscia"]
    },

    // Manubri
    "dumbbell-hip-thrust": {
        id: "dumbbell-hip-thrust",
        name: "Hip Thrust Manubrio",
        category: "manubri",
        primaryMuscles: ["glutei"],
        secondaryMuscles: ["femorali"],
        type: "compound",
        difficulty: "beginner",
        equipment: ["manubri", "panca"],
        instructions: "Hip thrust con manubrio invece del bilanciere.",
        tips: ["Buona alternativa per principianti"]
    },

    // Macchine
    "glute-kickback-machine": {
        id: "glute-kickback-machine",
        name: "Glute Kickback Machine",
        category: "macchine",
        primaryMuscles: ["glutei"],
        secondaryMuscles: [],
        type: "isolation",
        difficulty: "beginner",
        equipment: ["macchine"],
        instructions: "Spingi indietro con una gamba alla macchina.",
        tips: ["Ottimo isolamento dei glutei"]
    },
    "hip-abduction": {
        id: "hip-abduction",
        name: "Hip Abduction Machine",
        category: "macchine",
        primaryMuscles: ["glutei"],
        secondaryMuscles: [],
        type: "isolation",
        difficulty: "beginner",
        equipment: ["macchine"],
        instructions: "Seduto, apri le gambe contro la resistenza.",
        tips: ["Lavora gluteo medio"]
    },

    // Cavi
    "cable-kickback": {
        id: "cable-kickback",
        name: "Kickback ai Cavi",
        category: "cavi",
        primaryMuscles: ["glutei"],
        secondaryMuscles: [],
        type: "isolation",
        difficulty: "beginner",
        equipment: ["cavi"],
        instructions: "Al cavo basso con cavigliera, spingi la gamba indietro.",
        tips: ["Ottimo isolamento"]
    },

    // Corpo Libero
    "glute-bridge": {
        id: "glute-bridge",
        name: "Glute Bridge",
        category: "corpo-libero",
        primaryMuscles: ["glutei"],
        secondaryMuscles: ["femorali"],
        type: "compound",
        difficulty: "beginner",
        equipment: [],
        instructions: "Sdraiato, solleva i fianchi contraendo i glutei.",
        tips: ["Ottimo per attivare i glutei"]
    },
    "single-leg-glute-bridge": {
        id: "single-leg-glute-bridge",
        name: "Glute Bridge Singola Gamba",
        category: "corpo-libero",
        primaryMuscles: ["glutei"],
        secondaryMuscles: [],
        type: "compound",
        difficulty: "intermediate",
        equipment: [],
        instructions: "Glute bridge su una gamba sola.",
        tips: ["Aumenta l'intensità"]
    },
    "donkey-kick": {
        id: "donkey-kick",
        name: "Donkey Kick",
        category: "corpo-libero",
        primaryMuscles: ["glutei"],
        secondaryMuscles: [],
        type: "isolation",
        difficulty: "beginner",
        equipment: [],
        instructions: "A quattro zampe, spingi una gamba verso l'alto.",
        tips: ["Non arcuare la schiena"]
    },
    "fire-hydrant": {
        id: "fire-hydrant",
        name: "Fire Hydrant",
        category: "corpo-libero",
        primaryMuscles: ["glutei"],
        secondaryMuscles: [],
        type: "isolation",
        difficulty: "beginner",
        equipment: [],
        instructions: "A quattro zampe, solleva la gamba di lato.",
        tips: ["Lavora il gluteo medio"]
    },

    // ========================================
    // GAMBE - POLPACCI
    // ========================================

    // Macchine
    "seated-calf-raise": {
        id: "seated-calf-raise",
        name: "Calf Raise Seduto",
        category: "macchine",
        primaryMuscles: ["polpacci"],
        secondaryMuscles: [],
        type: "isolation",
        difficulty: "beginner",
        equipment: ["macchine"],
        instructions: "Seduto alla macchina, solleva i talloni.",
        tips: ["Enfatizza il soleo"]
    },
    "standing-calf-raise": {
        id: "standing-calf-raise",
        name: "Calf Raise in Piedi",
        category: "macchine",
        primaryMuscles: ["polpacci"],
        secondaryMuscles: [],
        type: "isolation",
        difficulty: "beginner",
        equipment: ["macchine"],
        instructions: "In piedi alla macchina, solleva sui talloni.",
        tips: ["Enfatizza il gastrocnemio"]
    },
    "leg-press-calf-raise": {
        id: "leg-press-calf-raise",
        name: "Calf Raise alla Leg Press",
        category: "macchine",
        primaryMuscles: ["polpacci"],
        secondaryMuscles: [],
        type: "isolation",
        difficulty: "beginner",
        equipment: ["macchine"],
        instructions: "Sulla leg press, spingi solo con le punte dei piedi.",
        tips: ["Permette carichi pesanti"]
    },

    // Corpo Libero
    "bodyweight-calf-raise": {
        id: "bodyweight-calf-raise",
        name: "Calf Raise a Corpo Libero",
        category: "corpo-libero",
        primaryMuscles: ["polpacci"],
        secondaryMuscles: [],
        type: "isolation",
        difficulty: "beginner",
        equipment: [],
        instructions: "In piedi su un gradino, solleva i talloni.",
        tips: ["Scendi sotto il parallelo per stretch completo"]
    },
    "single-leg-calf-raise": {
        id: "single-leg-calf-raise",
        name: "Calf Raise Singola Gamba",
        category: "corpo-libero",
        primaryMuscles: ["polpacci"],
        secondaryMuscles: [],
        type: "isolation",
        difficulty: "intermediate",
        equipment: [],
        instructions: "Calf raise su una gamba sola.",
        tips: ["Aumenta l'intensità"]
    },

    // ========================================
    // ADDOME
    // ========================================

    // Corpo Libero
    "crunch": {
        id: "crunch",
        name: "Crunch",
        category: "corpo-libero",
        primaryMuscles: ["addome"],
        secondaryMuscles: [],
        type: "isolation",
        difficulty: "beginner",
        equipment: [],
        instructions: "Sdraiato con le ginocchia piegate, solleva le spalle.",
        tips: ["Non tirare il collo", "Contrai gli addominali"]
    },
    "reverse-crunch": {
        id: "reverse-crunch",
        name: "Reverse Crunch",
        category: "corpo-libero",
        primaryMuscles: ["addome"],
        secondaryMuscles: [],
        type: "isolation",
        difficulty: "beginner",
        equipment: [],
        instructions: "Solleva le ginocchia verso il petto.",
        tips: ["Enfatizza la parte bassa degli addominali"]
    },
    "plank": {
        id: "plank",
        name: "Plank",
        category: "corpo-libero",
        primaryMuscles: ["addome"],
        secondaryMuscles: ["spalle"],
        type: "isolation",
        difficulty: "beginner",
        equipment: [],
        instructions: "Mantieni la posizione di plank sugli avambracci.",
        tips: ["Corpo in linea retta", "Non far cadere i fianchi"]
    },
    "side-plank": {
        id: "side-plank",
        name: "Side Plank",
        category: "corpo-libero",
        primaryMuscles: ["addome"],
        secondaryMuscles: [],
        type: "isolation",
        difficulty: "intermediate",
        equipment: [],
        instructions: "Plank laterale su un avambraccio.",
        tips: ["Lavora gli obliqui"]
    },
    "mountain-climber": {
        id: "mountain-climber",
        name: "Mountain Climber",
        category: "corpo-libero",
        primaryMuscles: ["addome"],
        secondaryMuscles: ["spalle"],
        type: "compound",
        difficulty: "beginner",
        equipment: [],
        instructions: "In plank, porta alternamente le ginocchia al petto.",
        tips: ["Ottimo anche per cardio"]
    },
    "leg-raise": {
        id: "leg-raise",
        name: "Leg Raise",
        category: "corpo-libero",
        primaryMuscles: ["addome"],
        secondaryMuscles: [],
        type: "isolation",
        difficulty: "intermediate",
        equipment: [],
        instructions: "Sdraiato, solleva le gambe tese fino a 90 gradi.",
        tips: ["Schiena a terra", "Movimento controllato"]
    },
    "hanging-leg-raise": {
        id: "hanging-leg-raise",
        name: "Leg Raise alla Sbarra",
        category: "corpo-libero",
        primaryMuscles: ["addome"],
        secondaryMuscles: ["avambracci"],
        type: "compound",
        difficulty: "advanced",
        equipment: ["sbarra"],
        instructions: "Appeso alla sbarra, solleva le gambe.",
        tips: ["Evita lo slancio"]
    },
    "bicycle-crunch": {
        id: "bicycle-crunch",
        name: "Bicycle Crunch",
        category: "corpo-libero",
        primaryMuscles: ["addome"],
        secondaryMuscles: [],
        type: "isolation",
        difficulty: "beginner",
        equipment: [],
        instructions: "Crunch portando il gomito al ginocchio opposto alternando.",
        tips: ["Lavora gli obliqui"]
    },
    "dead-bug": {
        id: "dead-bug",
        name: "Dead Bug",
        category: "corpo-libero",
        primaryMuscles: ["addome"],
        secondaryMuscles: [],
        type: "isolation",
        difficulty: "beginner",
        equipment: [],
        instructions: "Sdraiato, estendi braccio e gamba opposti mantenendo la schiena a terra.",
        tips: ["Ottimo per la stabilità del core"]
    },
    "russian-twist": {
        id: "russian-twist",
        name: "Russian Twist",
        category: "corpo-libero",
        primaryMuscles: ["addome"],
        secondaryMuscles: [],
        type: "isolation",
        difficulty: "intermediate",
        equipment: [],
        instructions: "Seduto con i piedi sollevati, ruota il busto a destra e sinistra.",
        tips: ["Lavora gli obliqui"]
    },
    "v-up": {
        id: "v-up",
        name: "V-Up",
        category: "corpo-libero",
        primaryMuscles: ["addome"],
        secondaryMuscles: [],
        type: "compound",
        difficulty: "intermediate",
        equipment: [],
        instructions: "Solleva contemporaneamente gambe e busto formando una V.",
        tips: ["Movimento esplosivo"]
    },
    "ab-wheel-rollout": {
        id: "ab-wheel-rollout",
        name: "Ab Wheel Rollout",
        category: "accessori",
        primaryMuscles: ["addome"],
        secondaryMuscles: ["spalle", "schiena"],
        type: "compound",
        difficulty: "advanced",
        equipment: ["accessori"],
        instructions: "Con la ruota per addominali, rotola in avanti e torna indietro.",
        tips: ["Non arcuare la schiena"]
    },

    // Macchine
    "cable-crunch": {
        id: "cable-crunch",
        name: "Crunch ai Cavi",
        category: "cavi",
        primaryMuscles: ["addome"],
        secondaryMuscles: [],
        type: "isolation",
        difficulty: "intermediate",
        equipment: ["cavi"],
        instructions: "In ginocchio al cavo alto, fletti il busto verso il basso.",
        tips: ["Permette di aggiungere resistenza progressiva"]
    },
    "cable-woodchop": {
        id: "cable-woodchop",
        name: "Wood Chop ai Cavi",
        category: "cavi",
        primaryMuscles: ["addome"],
        secondaryMuscles: ["spalle"],
        type: "compound",
        difficulty: "intermediate",
        equipment: ["cavi"],
        instructions: "Ruota il busto tirando il cavo dall'alto al basso in diagonale.",
        tips: ["Ottimo per gli obliqui e la rotazione"]
    },
    "ab-crunch-machine": {
        id: "ab-crunch-machine",
        name: "Ab Crunch Machine",
        category: "macchine",
        primaryMuscles: ["addome"],
        secondaryMuscles: [],
        type: "isolation",
        difficulty: "beginner",
        equipment: ["macchine"],
        instructions: "Seduto alla macchina, fletti il busto.",
        tips: ["Movimento guidato"]
    },

    // ========================================
    // AVAMBRACCI
    // ========================================

    "wrist-curl": {
        id: "wrist-curl",
        name: "Wrist Curl",
        category: "manubri",
        primaryMuscles: ["avambracci"],
        secondaryMuscles: [],
        type: "isolation",
        difficulty: "beginner",
        equipment: ["manubri"],
        instructions: "Avambracci appoggiati, curla i polsi verso l'alto.",
        tips: ["Movimento piccolo e controllato"]
    },
    "reverse-wrist-curl": {
        id: "reverse-wrist-curl",
        name: "Reverse Wrist Curl",
        category: "manubri",
        primaryMuscles: ["avambracci"],
        secondaryMuscles: [],
        type: "isolation",
        difficulty: "beginner",
        equipment: ["manubri"],
        instructions: "Come il wrist curl ma con i palmi verso il basso.",
        tips: ["Lavora gli estensori del polso"]
    },
    "farmer-walk": {
        id: "farmer-walk",
        name: "Farmer Walk",
        category: "manubri",
        primaryMuscles: ["avambracci"],
        secondaryMuscles: ["trapezio", "addome"],
        type: "compound",
        difficulty: "beginner",
        equipment: ["manubri"],
        instructions: "Cammina tenendo manubri pesanti ai lati.",
        tips: ["Ottimo per grip e stabilità"]
    },
    "dead-hang": {
        id: "dead-hang",
        name: "Dead Hang",
        category: "corpo-libero",
        primaryMuscles: ["avambracci"],
        secondaryMuscles: ["schiena"],
        type: "isolation",
        difficulty: "beginner",
        equipment: ["sbarra"],
        instructions: "Rimani appeso alla sbarra il più a lungo possibile.",
        tips: ["Ottimo per il grip e la decompressione spinale"]
    }
};

// Export functions to get exercises
// Esercizi visibili (quelli con hidden: true restano nel database solo per lo storico)
function getVisibleExercises() {
    return Object.values(EXERCISES_DB).filter(ex => !ex.hidden);
}

function getAllExercises() {
    return getVisibleExercises();
}

function getExerciseById(id) {
    return EXERCISES_DB[id] || null;
}

function getExercisesByCategory(category) {
    return getVisibleExercises().filter(ex => ex.category === category);
}

function getExercisesByMuscle(muscle) {
    return getVisibleExercises().filter(ex =>
        ex.primaryMuscles.includes(muscle) || ex.secondaryMuscles.includes(muscle)
    );
}

function getExercisesByPrimaryMuscle(muscle) {
    return getVisibleExercises().filter(ex => ex.primaryMuscles.includes(muscle));
}

function getExercisesByType(type) {
    return getVisibleExercises().filter(ex => ex.type === type);
}

function getCompoundExercises() {
    return getVisibleExercises().filter(ex => ex.type === "compound");
}

function getIsolationExercises() {
    return getVisibleExercises().filter(ex => ex.type === "isolation");
}

function searchExercises(query) {
    const q = String(query || '').toLowerCase();
    return getVisibleExercises().filter(ex =>
        ex.name.toLowerCase().includes(q) ||
        ex.primaryMuscles.some(m => m.includes(q)) ||
        ex.category.includes(q)
    );
}

// Gruppi muscolari per l'interfaccia. `icon` = nome del simbolo nello sprite icons.svg della v2
// (id "i-<icon>"): niente emoji.
const MUSCLE_GROUPS = [
    { id: "petto", name: "Petto", icon: "m-chest" },
    { id: "schiena", name: "Schiena", icon: "m-back" },
    { id: "spalle", name: "Spalle", icon: "m-shoulders" },
    { id: "bicipiti", name: "Bicipiti", icon: "m-arms" },
    { id: "tricipiti", name: "Tricipiti", icon: "m-arms" },
    { id: "quadricipiti", name: "Quadricipiti", icon: "m-legs" },
    { id: "femorali", name: "Femorali", icon: "m-legs" },
    { id: "glutei", name: "Glutei", icon: "m-glutes" },
    { id: "polpacci", name: "Polpacci", icon: "m-legs" },
    { id: "addome", name: "Addome", icon: "m-abs" },
    { id: "avambracci", name: "Avambracci", icon: "m-arms" },
    { id: "trapezio", name: "Trapezio", icon: "m-back" }
];

// Categorie di attrezzatura (icon = simbolo dello sprite, come sopra)
const EQUIPMENT_CATEGORIES = [
    { id: "bilanciere", name: "Bilanciere", icon: "barbell" },
    { id: "manubri", name: "Manubri", icon: "dumbbell" },
    { id: "macchine", name: "Macchine", icon: "machine" },
    { id: "cavi", name: "Cavi", icon: "cable" },
    { id: "corpo-libero", name: "Corpo Libero", icon: "bodyweight" },
    { id: "accessori", name: "Accessori", icon: "band" }
];

// ========================================
// TAG DEGLI ESERCIZI (algoritmo v2, ALGORITMO-V2.md §2)
// ========================================
// Uniti a EXERCISES_DB al caricamento: l'algoritmo non deve più indovinare dal nome.
// - pattern: schema di movimento (bilancio della settimana, alternative)
// - loadType: come si carica, e quindi cosa si scrive nel campo peso:
//     barbell / ez-bar = totale col bilanciere; dumbbell-pair = UN manubrio; dumbbell-single = l'unico
//     manubrio; machine-stack / cable = numero del pacco; machine-plate = solo i dischi (due lati);
//     bodyweight = 0; bodyweight-loadable = zavorra in più; assisted = assistenza (più alto = più facile)
// - barWeight: peso nominale del bilanciere (20 / 10), 0 per i "solo dischi"; il vero è in settings.gym
// - unilateral (rep per lato), metric ('reps' | 'time' = secondi), tier (1 fondamentale, 2 complementare,
//   3 accessorio), prio (1 prima scelta), stretch (carico a muscolo allungato), joint (stress articolare
//   0/1/2 per spalla, gomito, ginocchio, zona lombare: 2 = escluso con quella zona dolente), family
//   (stesso gesto con attrezzi diversi: max 1 per seduta), easier/harder (catena di varianti).
const EXERCISE_TAGS = {
    // PETTO
    'bench-press': { pattern: 'push-h', loadType: 'barbell', barWeight: 20, unilateral: false, metric: 'reps', tier: 1, prio: 1, stretch: false, joint: { shoulder: 1, elbow: 1, knee: 0, lowBack: 0 }, family: 'bench', easier: [], harder: [] },
    'incline-bench-press': { pattern: 'push-h', loadType: 'barbell', barWeight: 20, unilateral: false, metric: 'reps', tier: 1, prio: 1, stretch: false, joint: { shoulder: 1, elbow: 1, knee: 0, lowBack: 0 }, family: 'incline-press', easier: [], harder: [] },
    'decline-bench-press': { pattern: 'push-h', loadType: 'barbell', barWeight: 20, unilateral: false, metric: 'reps', tier: 2, prio: 3, stretch: false, joint: { shoulder: 0, elbow: 1, knee: 0, lowBack: 0 }, family: 'decline-press', easier: [], harder: [] },
    'dumbbell-bench-press': { pattern: 'push-h', loadType: 'dumbbell-pair', barWeight: 0, unilateral: false, metric: 'reps', tier: 1, prio: 1, stretch: false, joint: { shoulder: 1, elbow: 0, knee: 0, lowBack: 0 }, family: 'bench', easier: [], harder: [] },
    'dumbbell-incline-press': { pattern: 'push-h', loadType: 'dumbbell-pair', barWeight: 0, unilateral: false, metric: 'reps', tier: 1, prio: 1, stretch: false, joint: { shoulder: 1, elbow: 0, knee: 0, lowBack: 0 }, family: 'incline-press', easier: [], harder: [] },
    'dumbbell-decline-press': { pattern: 'push-h', loadType: 'dumbbell-pair', barWeight: 0, unilateral: false, metric: 'reps', tier: 2, prio: 3, stretch: false, joint: { shoulder: 0, elbow: 0, knee: 0, lowBack: 0 }, family: 'decline-press', easier: [], harder: [] },
    'dumbbell-fly': { pattern: 'iso-chest', loadType: 'dumbbell-pair', barWeight: 0, unilateral: false, metric: 'reps', tier: 3, prio: 2, stretch: true, joint: { shoulder: 1, elbow: 0, knee: 0, lowBack: 0 }, family: 'chest-fly', easier: [], harder: [] },
    'dumbbell-incline-fly': { pattern: 'iso-chest', loadType: 'dumbbell-pair', barWeight: 0, unilateral: false, metric: 'reps', tier: 3, prio: 2, stretch: true, joint: { shoulder: 1, elbow: 0, knee: 0, lowBack: 0 }, family: 'chest-fly', easier: [], harder: [] },
    'dumbbell-pullover': { pattern: 'iso-chest', loadType: 'dumbbell-single', barWeight: 0, unilateral: false, metric: 'reps', tier: 3, prio: 3, stretch: true, joint: { shoulder: 1, elbow: 0, knee: 0, lowBack: 0 }, family: 'pullover', easier: [], harder: [] },
    'chest-press-machine': { pattern: 'push-h', loadType: 'machine-stack', barWeight: 0, unilateral: false, metric: 'reps', tier: 1, prio: 1, stretch: false, joint: { shoulder: 1, elbow: 0, knee: 0, lowBack: 0 }, family: 'bench', easier: [], harder: [] },
    'incline-chest-press-machine': { pattern: 'push-h', loadType: 'machine-stack', barWeight: 0, unilateral: false, metric: 'reps', tier: 2, prio: 2, stretch: false, joint: { shoulder: 1, elbow: 0, knee: 0, lowBack: 0 }, family: 'incline-press', easier: [], harder: [] },
    'pec-deck': { pattern: 'iso-chest', loadType: 'machine-stack', barWeight: 0, unilateral: false, metric: 'reps', tier: 3, prio: 1, stretch: false, joint: { shoulder: 1, elbow: 0, knee: 0, lowBack: 0 }, family: 'chest-fly', easier: [], harder: [] },
    'smith-bench-press': { pattern: 'push-h', loadType: 'machine-plate', barWeight: 0, unilateral: false, metric: 'reps', tier: 1, prio: 2, stretch: false, joint: { shoulder: 1, elbow: 1, knee: 0, lowBack: 0 }, family: 'bench', easier: [], harder: [] },
    'cable-crossover': { pattern: 'iso-chest', loadType: 'cable', barWeight: 0, unilateral: false, metric: 'reps', tier: 3, prio: 1, stretch: false, joint: { shoulder: 0, elbow: 0, knee: 0, lowBack: 0 }, family: 'chest-fly', easier: [], harder: [] },
    'cable-fly-low': { pattern: 'iso-chest', loadType: 'cable', barWeight: 0, unilateral: false, metric: 'reps', tier: 3, prio: 2, stretch: false, joint: { shoulder: 0, elbow: 0, knee: 0, lowBack: 0 }, family: 'chest-fly', easier: [], harder: [] },
    'cable-fly-mid': { pattern: 'iso-chest', loadType: 'cable', barWeight: 0, unilateral: false, metric: 'reps', tier: 3, prio: 2, stretch: false, joint: { shoulder: 0, elbow: 0, knee: 0, lowBack: 0 }, family: 'chest-fly', easier: [], harder: [] },
    'push-up': { pattern: 'push-h', loadType: 'bodyweight', barWeight: 0, unilateral: false, metric: 'reps', tier: 2, prio: 1, stretch: false, joint: { shoulder: 1, elbow: 0, knee: 0, lowBack: 0 }, family: 'push-up', easier: [], harder: ['decline-push-up'] },
    'diamond-push-up': { pattern: 'push-h', loadType: 'bodyweight', barWeight: 0, unilateral: false, metric: 'reps', tier: 2, prio: 2, stretch: false, joint: { shoulder: 1, elbow: 1, knee: 0, lowBack: 0 }, family: 'push-up-close', easier: ['close-grip-push-up'], harder: [] },
    'wide-push-up': { pattern: 'push-h', loadType: 'bodyweight', barWeight: 0, unilateral: false, metric: 'reps', tier: 2, prio: 2, stretch: false, joint: { shoulder: 1, elbow: 0, knee: 0, lowBack: 0 }, family: 'push-up', easier: ['push-up'], harder: ['decline-push-up'] },
    'decline-push-up': { pattern: 'push-h', loadType: 'bodyweight', barWeight: 0, unilateral: false, metric: 'reps', tier: 2, prio: 2, stretch: false, joint: { shoulder: 1, elbow: 0, knee: 0, lowBack: 0 }, family: 'push-up', easier: ['push-up'], harder: [] },
    'dips': { pattern: 'push-h', loadType: 'bodyweight-loadable', barWeight: 0, unilateral: false, metric: 'reps', tier: 2, prio: 2, stretch: false, joint: { shoulder: 2, elbow: 1, knee: 0, lowBack: 0 }, family: 'dip', easier: ['bench-dips'], harder: [] },
    // SCHIENA
    'deadlift': { pattern: 'hinge', loadType: 'barbell', barWeight: 20, unilateral: false, metric: 'reps', tier: 1, prio: 2, stretch: false, joint: { shoulder: 0, elbow: 0, knee: 1, lowBack: 2 }, family: 'deadlift', easier: ['romanian-deadlift'], harder: [] },
    'barbell-row': { pattern: 'pull-h', loadType: 'barbell', barWeight: 20, unilateral: false, metric: 'reps', tier: 1, prio: 1, stretch: false, joint: { shoulder: 0, elbow: 0, knee: 0, lowBack: 2 }, family: 'row-bent', easier: [], harder: [] },
    'pendlay-row': { pattern: 'pull-h', loadType: 'barbell', barWeight: 20, unilateral: false, metric: 'reps', tier: 2, prio: 3, stretch: false, joint: { shoulder: 0, elbow: 0, knee: 0, lowBack: 2 }, family: 'row-bent', easier: ['barbell-row'], harder: [] },
    't-bar-row': { pattern: 'pull-h', loadType: 'machine-plate', barWeight: 0, unilateral: false, metric: 'reps', tier: 2, prio: 2, stretch: false, joint: { shoulder: 0, elbow: 0, knee: 0, lowBack: 2 }, family: 'row-tbar', easier: [], harder: [] },
    'dumbbell-row': { pattern: 'pull-h', loadType: 'dumbbell-single', barWeight: 0, unilateral: true, metric: 'reps', tier: 1, prio: 1, stretch: false, joint: { shoulder: 0, elbow: 0, knee: 0, lowBack: 0 }, family: 'row-single', easier: [], harder: [] },
    'dumbbell-row-two-arm': { pattern: 'pull-h', loadType: 'dumbbell-pair', barWeight: 0, unilateral: false, metric: 'reps', tier: 2, prio: 2, stretch: false, joint: { shoulder: 0, elbow: 0, knee: 0, lowBack: 1 }, family: 'row-bent', easier: ['dumbbell-row'], harder: [] },
    'dumbbell-shrug': { pattern: 'iso-traps', loadType: 'dumbbell-pair', barWeight: 0, unilateral: false, metric: 'reps', tier: 3, prio: 3, stretch: false, joint: { shoulder: 0, elbow: 0, knee: 0, lowBack: 0 }, family: 'shrug', easier: [], harder: [] },
    'lat-pulldown': { pattern: 'pull-v', loadType: 'machine-stack', barWeight: 0, unilateral: false, metric: 'reps', tier: 1, prio: 1, stretch: false, joint: { shoulder: 1, elbow: 0, knee: 0, lowBack: 0 }, family: 'pulldown', easier: [], harder: ['chin-up'] },
    'lat-pulldown-close': { pattern: 'pull-v', loadType: 'machine-stack', barWeight: 0, unilateral: false, metric: 'reps', tier: 2, prio: 2, stretch: false, joint: { shoulder: 0, elbow: 0, knee: 0, lowBack: 0 }, family: 'pulldown', easier: [], harder: ['chin-up'] },
    'seated-cable-row': { pattern: 'pull-h', loadType: 'machine-stack', barWeight: 0, unilateral: false, metric: 'reps', tier: 1, prio: 1, stretch: false, joint: { shoulder: 0, elbow: 0, knee: 0, lowBack: 0 }, family: 'row-seated', easier: [], harder: [] },
    'machine-row': { pattern: 'pull-h', loadType: 'machine-stack', barWeight: 0, unilateral: false, metric: 'reps', tier: 2, prio: 1, stretch: false, joint: { shoulder: 0, elbow: 0, knee: 0, lowBack: 0 }, family: 'row-seated', easier: [], harder: [] },
    'assisted-pull-up': { pattern: 'pull-v', loadType: 'assisted', barWeight: 0, unilateral: false, metric: 'reps', tier: 2, prio: 2, stretch: false, joint: { shoulder: 1, elbow: 0, knee: 0, lowBack: 0 }, family: 'pull-up', easier: [], harder: ['chin-up'] },
    'hyperextension': { pattern: 'hinge', loadType: 'bodyweight-loadable', barWeight: 0, unilateral: false, metric: 'reps', tier: 3, prio: 2, stretch: false, joint: { shoulder: 0, elbow: 0, knee: 0, lowBack: 1 }, family: 'back-extension', easier: ['superman'], harder: [] },
    'straight-arm-pulldown': { pattern: 'iso-back', loadType: 'cable', barWeight: 0, unilateral: false, metric: 'reps', tier: 3, prio: 2, stretch: false, joint: { shoulder: 1, elbow: 0, knee: 0, lowBack: 0 }, family: 'straight-arm', easier: [], harder: [] },
    'face-pull': { pattern: 'iso-shoulder-rear', loadType: 'cable', barWeight: 0, unilateral: false, metric: 'reps', tier: 3, prio: 1, stretch: false, joint: { shoulder: 0, elbow: 0, knee: 0, lowBack: 0 }, family: 'face-pull', easier: [], harder: [] },
    'pull-up': { pattern: 'pull-v', loadType: 'bodyweight-loadable', barWeight: 0, unilateral: false, metric: 'reps', tier: 1, prio: 1, stretch: false, joint: { shoulder: 1, elbow: 1, knee: 0, lowBack: 0 }, family: 'pull-up', easier: ['chin-up', 'assisted-pull-up'], harder: [] },
    'chin-up': { pattern: 'pull-v', loadType: 'bodyweight-loadable', barWeight: 0, unilateral: false, metric: 'reps', tier: 1, prio: 1, stretch: false, joint: { shoulder: 0, elbow: 1, knee: 0, lowBack: 0 }, family: 'pull-up', easier: ['assisted-pull-up', 'lat-pulldown'], harder: ['pull-up'] },
    'neutral-grip-pull-up': { pattern: 'pull-v', loadType: 'bodyweight-loadable', barWeight: 0, unilateral: false, metric: 'reps', tier: 1, prio: 2, stretch: false, joint: { shoulder: 0, elbow: 0, knee: 0, lowBack: 0 }, family: 'pull-up', easier: ['assisted-pull-up', 'lat-pulldown'], harder: ['pull-up'] },
    'inverted-row': { pattern: 'pull-h', loadType: 'bodyweight', barWeight: 0, unilateral: false, metric: 'reps', tier: 2, prio: 1, stretch: false, joint: { shoulder: 0, elbow: 0, knee: 0, lowBack: 0 }, family: 'inverted-row', easier: [], harder: [] },
    'superman': { pattern: 'hinge', loadType: 'bodyweight', barWeight: 0, unilateral: false, metric: 'reps', tier: 3, prio: 3, stretch: false, joint: { shoulder: 0, elbow: 0, knee: 0, lowBack: 1 }, family: 'back-extension', easier: [], harder: ['hyperextension'] },
    // SPALLE
    'overhead-press': { pattern: 'push-v', loadType: 'barbell', barWeight: 20, unilateral: false, metric: 'reps', tier: 1, prio: 1, stretch: false, joint: { shoulder: 2, elbow: 0, knee: 0, lowBack: 1 }, family: 'ohp', easier: ['dumbbell-shoulder-press'], harder: [] },
    'push-press': { pattern: 'push-v', loadType: 'barbell', barWeight: 20, unilateral: false, metric: 'reps', tier: 2, prio: 3, stretch: false, joint: { shoulder: 2, elbow: 0, knee: 1, lowBack: 1 }, family: 'ohp', easier: ['overhead-press'], harder: [] },
    'barbell-front-raise': { pattern: 'iso-shoulder-front', loadType: 'ez-bar', barWeight: 10, unilateral: false, metric: 'reps', tier: 3, prio: 3, stretch: false, joint: { shoulder: 1, elbow: 0, knee: 0, lowBack: 0 }, family: 'front-raise', easier: [], harder: [] },
    'upright-row': { pattern: 'iso-shoulder-lat', loadType: 'ez-bar', barWeight: 10, unilateral: false, metric: 'reps', tier: 3, prio: 3, stretch: false, joint: { shoulder: 2, elbow: 1, knee: 0, lowBack: 0 }, family: 'upright-row', easier: [], harder: [] },
    'dumbbell-shoulder-press': { pattern: 'push-v', loadType: 'dumbbell-pair', barWeight: 0, unilateral: false, metric: 'reps', tier: 1, prio: 1, stretch: false, joint: { shoulder: 1, elbow: 0, knee: 0, lowBack: 0 }, family: 'ohp', easier: ['shoulder-press-machine'], harder: [] },
    'arnold-press': { pattern: 'push-v', loadType: 'dumbbell-pair', barWeight: 0, unilateral: false, metric: 'reps', tier: 2, prio: 2, stretch: false, joint: { shoulder: 2, elbow: 0, knee: 0, lowBack: 0 }, family: 'ohp', easier: ['dumbbell-shoulder-press'], harder: [] },
    'lateral-raise': { pattern: 'iso-shoulder-lat', loadType: 'dumbbell-pair', barWeight: 0, unilateral: false, metric: 'reps', tier: 3, prio: 1, stretch: false, joint: { shoulder: 1, elbow: 0, knee: 0, lowBack: 0 }, family: 'lateral-raise', easier: [], harder: [] },
    'front-raise': { pattern: 'iso-shoulder-front', loadType: 'dumbbell-pair', barWeight: 0, unilateral: false, metric: 'reps', tier: 3, prio: 3, stretch: false, joint: { shoulder: 1, elbow: 0, knee: 0, lowBack: 0 }, family: 'front-raise', easier: [], harder: [] },
    'rear-delt-fly': { pattern: 'iso-shoulder-rear', loadType: 'dumbbell-pair', barWeight: 0, unilateral: false, metric: 'reps', tier: 3, prio: 1, stretch: false, joint: { shoulder: 0, elbow: 0, knee: 0, lowBack: 0 }, family: 'rear-delt', easier: [], harder: [] },
    'dumbbell-shrug-shoulders': { pattern: 'iso-traps', loadType: 'dumbbell-pair', barWeight: 0, unilateral: false, metric: 'reps', tier: 3, prio: 3, stretch: false, joint: { shoulder: 0, elbow: 0, knee: 0, lowBack: 0 }, family: 'shrug', easier: [], harder: [] },
    'shoulder-press-machine': { pattern: 'push-v', loadType: 'machine-stack', barWeight: 0, unilateral: false, metric: 'reps', tier: 1, prio: 1, stretch: false, joint: { shoulder: 1, elbow: 0, knee: 0, lowBack: 0 }, family: 'ohp', easier: [], harder: [] },
    'lateral-raise-machine': { pattern: 'iso-shoulder-lat', loadType: 'machine-stack', barWeight: 0, unilateral: false, metric: 'reps', tier: 3, prio: 1, stretch: false, joint: { shoulder: 1, elbow: 0, knee: 0, lowBack: 0 }, family: 'lateral-raise', easier: [], harder: [] },
    'reverse-pec-deck': { pattern: 'iso-shoulder-rear', loadType: 'machine-stack', barWeight: 0, unilateral: false, metric: 'reps', tier: 3, prio: 1, stretch: false, joint: { shoulder: 0, elbow: 0, knee: 0, lowBack: 0 }, family: 'rear-delt', easier: [], harder: [] },
    'cable-lateral-raise': { pattern: 'iso-shoulder-lat', loadType: 'cable', barWeight: 0, unilateral: true, metric: 'reps', tier: 3, prio: 1, stretch: false, joint: { shoulder: 1, elbow: 0, knee: 0, lowBack: 0 }, family: 'lateral-raise', easier: [], harder: [] },
    'cable-front-raise': { pattern: 'iso-shoulder-front', loadType: 'cable', barWeight: 0, unilateral: false, metric: 'reps', tier: 3, prio: 3, stretch: false, joint: { shoulder: 1, elbow: 0, knee: 0, lowBack: 0 }, family: 'front-raise', easier: [], harder: [] },
    'cable-rear-delt': { pattern: 'iso-shoulder-rear', loadType: 'cable', barWeight: 0, unilateral: false, metric: 'reps', tier: 3, prio: 2, stretch: false, joint: { shoulder: 0, elbow: 0, knee: 0, lowBack: 0 }, family: 'rear-delt', easier: [], harder: [] },
    'pike-push-up': { pattern: 'push-v', loadType: 'bodyweight', barWeight: 0, unilateral: false, metric: 'reps', tier: 2, prio: 1, stretch: false, joint: { shoulder: 2, elbow: 0, knee: 0, lowBack: 0 }, family: 'ohp-bw', easier: [], harder: ['handstand-push-up'] },
    'handstand-push-up': { pattern: 'push-v', loadType: 'bodyweight', barWeight: 0, unilateral: false, metric: 'reps', tier: 2, prio: 2, stretch: false, joint: { shoulder: 2, elbow: 1, knee: 0, lowBack: 0 }, family: 'ohp-bw', easier: ['pike-push-up'], harder: [] },
    // BICIPITI
    'barbell-curl': { pattern: 'iso-biceps', loadType: 'ez-bar', barWeight: 10, unilateral: false, metric: 'reps', tier: 3, prio: 2, stretch: false, joint: { shoulder: 0, elbow: 1, knee: 0, lowBack: 0 }, family: 'curl-bar', easier: ['ez-bar-curl'], harder: [] },
    'ez-bar-curl': { pattern: 'iso-biceps', loadType: 'ez-bar', barWeight: 10, unilateral: false, metric: 'reps', tier: 3, prio: 1, stretch: false, joint: { shoulder: 0, elbow: 0, knee: 0, lowBack: 0 }, family: 'curl-bar', easier: [], harder: [] },
    'preacher-curl': { pattern: 'iso-biceps', loadType: 'ez-bar', barWeight: 10, unilateral: false, metric: 'reps', tier: 3, prio: 2, stretch: true, joint: { shoulder: 0, elbow: 1, knee: 0, lowBack: 0 }, family: 'curl-preacher', easier: [], harder: [] },
    'dumbbell-curl': { pattern: 'iso-biceps', loadType: 'dumbbell-pair', barWeight: 0, unilateral: false, metric: 'reps', tier: 3, prio: 1, stretch: false, joint: { shoulder: 0, elbow: 0, knee: 0, lowBack: 0 }, family: 'curl-db', easier: [], harder: [] },
    'hammer-curl': { pattern: 'iso-biceps', loadType: 'dumbbell-pair', barWeight: 0, unilateral: false, metric: 'reps', tier: 3, prio: 1, stretch: false, joint: { shoulder: 0, elbow: 0, knee: 0, lowBack: 0 }, family: 'curl-hammer', easier: [], harder: [] },
    'incline-curl': { pattern: 'iso-biceps', loadType: 'dumbbell-pair', barWeight: 0, unilateral: false, metric: 'reps', tier: 3, prio: 1, stretch: true, joint: { shoulder: 1, elbow: 0, knee: 0, lowBack: 0 }, family: 'curl-db', easier: [], harder: [] },
    'concentration-curl': { pattern: 'iso-biceps', loadType: 'dumbbell-single', barWeight: 0, unilateral: true, metric: 'reps', tier: 3, prio: 3, stretch: false, joint: { shoulder: 0, elbow: 0, knee: 0, lowBack: 0 }, family: 'curl-db', easier: [], harder: [] },
    'spider-curl': { pattern: 'iso-biceps', loadType: 'dumbbell-pair', barWeight: 0, unilateral: false, metric: 'reps', tier: 3, prio: 3, stretch: false, joint: { shoulder: 0, elbow: 0, knee: 0, lowBack: 0 }, family: 'curl-preacher', easier: [], harder: [] },
    'cable-curl': { pattern: 'iso-biceps', loadType: 'cable', barWeight: 0, unilateral: false, metric: 'reps', tier: 3, prio: 1, stretch: false, joint: { shoulder: 0, elbow: 0, knee: 0, lowBack: 0 }, family: 'curl-cable', easier: [], harder: [] },
    'cable-hammer-curl': { pattern: 'iso-biceps', loadType: 'cable', barWeight: 0, unilateral: false, metric: 'reps', tier: 3, prio: 2, stretch: false, joint: { shoulder: 0, elbow: 0, knee: 0, lowBack: 0 }, family: 'curl-hammer', easier: [], harder: [] },
    'bicep-curl-machine': { pattern: 'iso-biceps', loadType: 'machine-stack', barWeight: 0, unilateral: false, metric: 'reps', tier: 3, prio: 2, stretch: false, joint: { shoulder: 0, elbow: 0, knee: 0, lowBack: 0 }, family: 'curl-preacher', easier: [], harder: [] },
    // TRICIPITI
    'close-grip-bench': { pattern: 'push-h', loadType: 'barbell', barWeight: 20, unilateral: false, metric: 'reps', tier: 2, prio: 2, stretch: false, joint: { shoulder: 1, elbow: 1, knee: 0, lowBack: 0 }, family: 'bench-close', easier: [], harder: [] },
    'skull-crusher': { pattern: 'iso-triceps', loadType: 'ez-bar', barWeight: 10, unilateral: false, metric: 'reps', tier: 3, prio: 2, stretch: false, joint: { shoulder: 0, elbow: 2, knee: 0, lowBack: 0 }, family: 'triceps-lying', easier: [], harder: [] },
    'dumbbell-tricep-extension': { pattern: 'iso-triceps', loadType: 'dumbbell-single', barWeight: 0, unilateral: false, metric: 'reps', tier: 3, prio: 1, stretch: true, joint: { shoulder: 1, elbow: 1, knee: 0, lowBack: 0 }, family: 'triceps-overhead', easier: [], harder: [] },
    'dumbbell-kickback': { pattern: 'iso-triceps', loadType: 'dumbbell-pair', barWeight: 0, unilateral: false, metric: 'reps', tier: 3, prio: 2, stretch: false, joint: { shoulder: 0, elbow: 0, knee: 0, lowBack: 0 }, family: 'kickback', easier: [], harder: [] },
    'tate-press': { pattern: 'iso-triceps', loadType: 'dumbbell-pair', barWeight: 0, unilateral: false, metric: 'reps', tier: 3, prio: 3, stretch: false, joint: { shoulder: 0, elbow: 2, knee: 0, lowBack: 0 }, family: 'triceps-lying', easier: [], harder: [] },
    'tricep-pushdown': { pattern: 'iso-triceps', loadType: 'cable', barWeight: 0, unilateral: false, metric: 'reps', tier: 3, prio: 1, stretch: false, joint: { shoulder: 0, elbow: 0, knee: 0, lowBack: 0 }, family: 'pushdown', easier: [], harder: [] },
    'rope-pushdown': { pattern: 'iso-triceps', loadType: 'cable', barWeight: 0, unilateral: false, metric: 'reps', tier: 3, prio: 1, stretch: false, joint: { shoulder: 0, elbow: 0, knee: 0, lowBack: 0 }, family: 'pushdown', easier: [], harder: [] },
    'overhead-cable-extension': { pattern: 'iso-triceps', loadType: 'cable', barWeight: 0, unilateral: false, metric: 'reps', tier: 3, prio: 1, stretch: true, joint: { shoulder: 1, elbow: 1, knee: 0, lowBack: 0 }, family: 'triceps-overhead', easier: [], harder: [] },
    'bench-dips': { pattern: 'push-h', loadType: 'bodyweight', barWeight: 0, unilateral: false, metric: 'reps', tier: 2, prio: 3, stretch: false, joint: { shoulder: 2, elbow: 1, knee: 0, lowBack: 0 }, family: 'dip', easier: [], harder: ['dips'] },
    'close-grip-push-up': { pattern: 'push-h', loadType: 'bodyweight', barWeight: 0, unilateral: false, metric: 'reps', tier: 2, prio: 2, stretch: false, joint: { shoulder: 0, elbow: 1, knee: 0, lowBack: 0 }, family: 'push-up-close', easier: [], harder: ['diamond-push-up'] },
    'tricep-dip-machine': { pattern: 'iso-triceps', loadType: 'machine-stack', barWeight: 0, unilateral: false, metric: 'reps', tier: 3, prio: 2, stretch: false, joint: { shoulder: 1, elbow: 1, knee: 0, lowBack: 0 }, family: 'dip', easier: [], harder: [] },
    // QUADRICIPITI
    'squat': { pattern: 'squat', loadType: 'barbell', barWeight: 20, unilateral: false, metric: 'reps', tier: 1, prio: 1, stretch: true, joint: { shoulder: 0, elbow: 0, knee: 1, lowBack: 1 }, family: 'squat-bb', easier: ['goblet-squat'], harder: [] },
    'front-squat': { pattern: 'squat', loadType: 'barbell', barWeight: 20, unilateral: false, metric: 'reps', tier: 1, prio: 2, stretch: true, joint: { shoulder: 0, elbow: 0, knee: 1, lowBack: 1 }, family: 'squat-bb', easier: ['goblet-squat'], harder: [] },
    'bulgarian-split-squat-bb': { pattern: 'lunge', loadType: 'barbell', barWeight: 20, unilateral: true, metric: 'reps', tier: 2, prio: 3, stretch: true, joint: { shoulder: 0, elbow: 0, knee: 1, lowBack: 0 }, family: 'bulgarian', easier: ['bulgarian-split-squat'], harder: [] },
    'goblet-squat': { pattern: 'squat', loadType: 'dumbbell-single', barWeight: 0, unilateral: false, metric: 'reps', tier: 1, prio: 1, stretch: true, joint: { shoulder: 0, elbow: 0, knee: 1, lowBack: 0 }, family: 'squat-db', easier: ['bodyweight-squat'], harder: [] },
    'dumbbell-lunge': { pattern: 'lunge', loadType: 'dumbbell-pair', barWeight: 0, unilateral: true, metric: 'reps', tier: 2, prio: 1, stretch: true, joint: { shoulder: 0, elbow: 0, knee: 1, lowBack: 0 }, family: 'lunge', easier: ['walking-lunge'], harder: ['bulgarian-split-squat'] },
    'bulgarian-split-squat': { pattern: 'lunge', loadType: 'dumbbell-pair', barWeight: 0, unilateral: true, metric: 'reps', tier: 1, prio: 1, stretch: true, joint: { shoulder: 0, elbow: 0, knee: 1, lowBack: 0 }, family: 'bulgarian', easier: ['dumbbell-lunge'], harder: [] },
    'step-up': { pattern: 'lunge', loadType: 'dumbbell-pair', barWeight: 0, unilateral: true, metric: 'reps', tier: 2, prio: 2, stretch: false, joint: { shoulder: 0, elbow: 0, knee: 1, lowBack: 0 }, family: 'step-up', easier: [], harder: [] },
    'leg-press': { pattern: 'squat', loadType: 'machine-plate', barWeight: 0, unilateral: false, metric: 'reps', tier: 1, prio: 1, stretch: false, joint: { shoulder: 0, elbow: 0, knee: 1, lowBack: 1 }, family: 'leg-press', easier: [], harder: [] },
    'hack-squat': { pattern: 'squat', loadType: 'machine-plate', barWeight: 0, unilateral: false, metric: 'reps', tier: 1, prio: 1, stretch: true, joint: { shoulder: 0, elbow: 0, knee: 1, lowBack: 0 }, family: 'hack', easier: [], harder: [] },
    'leg-extension': { pattern: 'iso-quad', loadType: 'machine-stack', barWeight: 0, unilateral: false, metric: 'reps', tier: 3, prio: 1, stretch: false, joint: { shoulder: 0, elbow: 0, knee: 1, lowBack: 0 }, family: 'leg-ext', easier: [], harder: [] },
    'smith-squat': { pattern: 'squat', loadType: 'machine-plate', barWeight: 0, unilateral: false, metric: 'reps', tier: 1, prio: 2, stretch: false, joint: { shoulder: 0, elbow: 0, knee: 1, lowBack: 1 }, family: 'squat-smith', easier: [], harder: [] },
    'bodyweight-squat': { pattern: 'squat', loadType: 'bodyweight', barWeight: 0, unilateral: false, metric: 'reps', tier: 2, prio: 1, stretch: false, joint: { shoulder: 0, elbow: 0, knee: 0, lowBack: 0 }, family: 'squat-bw', easier: [], harder: ['goblet-squat', 'jump-squat'] },
    'jump-squat': { pattern: 'squat', loadType: 'bodyweight', barWeight: 0, unilateral: false, metric: 'reps', tier: 2, prio: 3, stretch: false, joint: { shoulder: 0, elbow: 0, knee: 2, lowBack: 0 }, family: 'squat-bw', easier: ['bodyweight-squat'], harder: [] },
    'walking-lunge': { pattern: 'lunge', loadType: 'bodyweight', barWeight: 0, unilateral: true, metric: 'reps', tier: 2, prio: 1, stretch: true, joint: { shoulder: 0, elbow: 0, knee: 1, lowBack: 0 }, family: 'lunge', easier: [], harder: ['dumbbell-lunge', 'bulgarian-split-squat'] },
    'pistol-squat': { pattern: 'lunge', loadType: 'bodyweight', barWeight: 0, unilateral: true, metric: 'reps', tier: 2, prio: 3, stretch: false, joint: { shoulder: 0, elbow: 0, knee: 2, lowBack: 0 }, family: 'pistol', easier: ['bulgarian-split-squat', 'walking-lunge'], harder: [] },
    // FEMORALI
    'romanian-deadlift': { pattern: 'hinge', loadType: 'barbell', barWeight: 20, unilateral: false, metric: 'reps', tier: 1, prio: 1, stretch: true, joint: { shoulder: 0, elbow: 0, knee: 0, lowBack: 1 }, family: 'rdl', easier: ['dumbbell-rdl'], harder: [] },
    'stiff-leg-deadlift': { pattern: 'hinge', loadType: 'barbell', barWeight: 20, unilateral: false, metric: 'reps', tier: 2, prio: 2, stretch: true, joint: { shoulder: 0, elbow: 0, knee: 0, lowBack: 1 }, family: 'rdl', easier: ['dumbbell-rdl'], harder: [] },
    'good-morning': { pattern: 'hinge', loadType: 'barbell', barWeight: 20, unilateral: false, metric: 'reps', tier: 2, prio: 3, stretch: true, joint: { shoulder: 0, elbow: 0, knee: 0, lowBack: 2 }, family: 'good-morning', easier: ['romanian-deadlift'], harder: [] },
    'dumbbell-rdl': { pattern: 'hinge', loadType: 'dumbbell-pair', barWeight: 0, unilateral: false, metric: 'reps', tier: 1, prio: 1, stretch: true, joint: { shoulder: 0, elbow: 0, knee: 0, lowBack: 1 }, family: 'rdl', easier: [], harder: ['romanian-deadlift'] },
    'single-leg-rdl': { pattern: 'hinge', loadType: 'bodyweight-loadable', barWeight: 0, unilateral: true, metric: 'reps', tier: 2, prio: 2, stretch: true, joint: { shoulder: 0, elbow: 0, knee: 0, lowBack: 1 }, family: 'rdl-single', easier: ['dumbbell-rdl'], harder: [] },
    'leg-curl-lying': { pattern: 'iso-ham', loadType: 'machine-stack', barWeight: 0, unilateral: false, metric: 'reps', tier: 3, prio: 1, stretch: false, joint: { shoulder: 0, elbow: 0, knee: 0, lowBack: 0 }, family: 'leg-curl', easier: [], harder: [] },
    'leg-curl-seated': { pattern: 'iso-ham', loadType: 'machine-stack', barWeight: 0, unilateral: false, metric: 'reps', tier: 3, prio: 1, stretch: true, joint: { shoulder: 0, elbow: 0, knee: 0, lowBack: 0 }, family: 'leg-curl', easier: [], harder: [] },
    'nordic-curl': { pattern: 'iso-ham', loadType: 'bodyweight', barWeight: 0, unilateral: false, metric: 'reps', tier: 3, prio: 2, stretch: false, joint: { shoulder: 0, elbow: 0, knee: 1, lowBack: 0 }, family: 'nordic', easier: ['leg-curl-seated'], harder: [] },
    'glute-ham-raise': { pattern: 'iso-ham', loadType: 'bodyweight-loadable', barWeight: 0, unilateral: false, metric: 'reps', tier: 3, prio: 2, stretch: false, joint: { shoulder: 0, elbow: 0, knee: 1, lowBack: 0 }, family: 'nordic', easier: ['leg-curl-seated'], harder: [] },
    // GLUTEI
    'hip-thrust': { pattern: 'bridge', loadType: 'barbell', barWeight: 20, unilateral: false, metric: 'reps', tier: 1, prio: 1, stretch: false, joint: { shoulder: 0, elbow: 0, knee: 0, lowBack: 0 }, family: 'hip-thrust', easier: ['dumbbell-hip-thrust'], harder: [] },
    'sumo-deadlift': { pattern: 'hinge', loadType: 'barbell', barWeight: 20, unilateral: false, metric: 'reps', tier: 1, prio: 2, stretch: false, joint: { shoulder: 0, elbow: 0, knee: 1, lowBack: 2 }, family: 'deadlift', easier: ['dumbbell-rdl'], harder: [] },
    'dumbbell-hip-thrust': { pattern: 'bridge', loadType: 'dumbbell-single', barWeight: 0, unilateral: false, metric: 'reps', tier: 1, prio: 1, stretch: false, joint: { shoulder: 0, elbow: 0, knee: 0, lowBack: 0 }, family: 'hip-thrust', easier: ['glute-bridge'], harder: ['hip-thrust'] },
    'glute-kickback-machine': { pattern: 'iso-glute', loadType: 'machine-stack', barWeight: 0, unilateral: true, metric: 'reps', tier: 3, prio: 2, stretch: false, joint: { shoulder: 0, elbow: 0, knee: 0, lowBack: 0 }, family: 'glute-kickback', easier: [], harder: [] },
    'hip-abduction': { pattern: 'iso-glute', loadType: 'machine-stack', barWeight: 0, unilateral: false, metric: 'reps', tier: 3, prio: 1, stretch: false, joint: { shoulder: 0, elbow: 0, knee: 0, lowBack: 0 }, family: 'abduction', easier: [], harder: [] },
    'cable-kickback': { pattern: 'iso-glute', loadType: 'cable', barWeight: 0, unilateral: true, metric: 'reps', tier: 3, prio: 1, stretch: false, joint: { shoulder: 0, elbow: 0, knee: 0, lowBack: 0 }, family: 'glute-kickback', easier: [], harder: [] },
    'glute-bridge': { pattern: 'bridge', loadType: 'bodyweight-loadable', barWeight: 0, unilateral: false, metric: 'reps', tier: 2, prio: 1, stretch: false, joint: { shoulder: 0, elbow: 0, knee: 0, lowBack: 0 }, family: 'glute-bridge', easier: [], harder: ['single-leg-glute-bridge', 'dumbbell-hip-thrust'] },
    'single-leg-glute-bridge': { pattern: 'bridge', loadType: 'bodyweight', barWeight: 0, unilateral: true, metric: 'reps', tier: 2, prio: 2, stretch: false, joint: { shoulder: 0, elbow: 0, knee: 0, lowBack: 0 }, family: 'glute-bridge', easier: ['glute-bridge'], harder: ['dumbbell-hip-thrust', 'hip-thrust'] },
    'donkey-kick': { pattern: 'iso-glute', loadType: 'bodyweight', barWeight: 0, unilateral: true, metric: 'reps', tier: 3, prio: 2, stretch: false, joint: { shoulder: 0, elbow: 0, knee: 0, lowBack: 0 }, family: 'glute-kickback', easier: [], harder: ['cable-kickback'] },
    'fire-hydrant': { pattern: 'iso-glute', loadType: 'bodyweight', barWeight: 0, unilateral: true, metric: 'reps', tier: 3, prio: 2, stretch: false, joint: { shoulder: 0, elbow: 0, knee: 0, lowBack: 0 }, family: 'abduction', easier: [], harder: ['hip-abduction'] },
    // POLPACCI
    'seated-calf-raise': { pattern: 'iso-calf', loadType: 'machine-plate', barWeight: 0, unilateral: false, metric: 'reps', tier: 3, prio: 2, stretch: false, joint: { shoulder: 0, elbow: 0, knee: 0, lowBack: 0 }, family: 'calf-seated', easier: [], harder: [] },
    'standing-calf-raise': { pattern: 'iso-calf', loadType: 'machine-stack', barWeight: 0, unilateral: false, metric: 'reps', tier: 3, prio: 1, stretch: true, joint: { shoulder: 0, elbow: 0, knee: 0, lowBack: 0 }, family: 'calf-standing', easier: [], harder: [] },
    'leg-press-calf-raise': { pattern: 'iso-calf', loadType: 'machine-plate', barWeight: 0, unilateral: false, metric: 'reps', tier: 3, prio: 1, stretch: true, joint: { shoulder: 0, elbow: 0, knee: 0, lowBack: 0 }, family: 'calf-standing', easier: [], harder: [] },
    'bodyweight-calf-raise': { pattern: 'iso-calf', loadType: 'bodyweight-loadable', barWeight: 0, unilateral: false, metric: 'reps', tier: 3, prio: 1, stretch: true, joint: { shoulder: 0, elbow: 0, knee: 0, lowBack: 0 }, family: 'calf-standing', easier: [], harder: ['single-leg-calf-raise'] },
    'single-leg-calf-raise': { pattern: 'iso-calf', loadType: 'bodyweight-loadable', barWeight: 0, unilateral: true, metric: 'reps', tier: 3, prio: 1, stretch: true, joint: { shoulder: 0, elbow: 0, knee: 0, lowBack: 0 }, family: 'calf-standing', easier: ['bodyweight-calf-raise'], harder: [] },
    // ADDOME
    'crunch': { pattern: 'core-flex', loadType: 'bodyweight', barWeight: 0, unilateral: false, metric: 'reps', tier: 3, prio: 2, stretch: false, joint: { shoulder: 0, elbow: 0, knee: 0, lowBack: 0 }, family: 'crunch', easier: [], harder: [] },
    'reverse-crunch': { pattern: 'core-flex', loadType: 'bodyweight', barWeight: 0, unilateral: false, metric: 'reps', tier: 3, prio: 1, stretch: false, joint: { shoulder: 0, elbow: 0, knee: 0, lowBack: 0 }, family: 'reverse-crunch', easier: [], harder: ['leg-raise'] },
    'plank': { pattern: 'core-antiext', loadType: 'bodyweight', barWeight: 0, unilateral: false, metric: 'time', tier: 3, prio: 1, stretch: false, joint: { shoulder: 0, elbow: 0, knee: 0, lowBack: 0 }, family: 'plank', easier: ['dead-bug'], harder: ['ab-wheel-rollout'] },
    'side-plank': { pattern: 'core-antilat', loadType: 'bodyweight', barWeight: 0, unilateral: true, metric: 'time', tier: 3, prio: 1, stretch: false, joint: { shoulder: 1, elbow: 0, knee: 0, lowBack: 0 }, family: 'side-plank', easier: [], harder: [] },
    'mountain-climber': { pattern: 'core-antiext', loadType: 'bodyweight', barWeight: 0, unilateral: false, metric: 'time', tier: 3, prio: 3, stretch: false, joint: { shoulder: 1, elbow: 0, knee: 0, lowBack: 0 }, family: 'mountain-climber', easier: ['plank'], harder: [] },
    'leg-raise': { pattern: 'core-flex', loadType: 'bodyweight', barWeight: 0, unilateral: false, metric: 'reps', tier: 3, prio: 2, stretch: false, joint: { shoulder: 0, elbow: 0, knee: 0, lowBack: 1 }, family: 'leg-raise', easier: ['reverse-crunch'], harder: ['hanging-leg-raise'] },
    'hanging-leg-raise': { pattern: 'core-flex', loadType: 'bodyweight', barWeight: 0, unilateral: false, metric: 'reps', tier: 3, prio: 1, stretch: false, joint: { shoulder: 1, elbow: 0, knee: 0, lowBack: 1 }, family: 'leg-raise', easier: ['leg-raise'], harder: [] },
    'bicycle-crunch': { pattern: 'core-rot', loadType: 'bodyweight', barWeight: 0, unilateral: false, metric: 'reps', tier: 3, prio: 2, stretch: false, joint: { shoulder: 0, elbow: 0, knee: 0, lowBack: 1 }, family: 'crunch-rot', easier: [], harder: [] },
    'dead-bug': { pattern: 'core-antiext', loadType: 'bodyweight', barWeight: 0, unilateral: false, metric: 'reps', tier: 3, prio: 1, stretch: false, joint: { shoulder: 0, elbow: 0, knee: 0, lowBack: 0 }, family: 'dead-bug', easier: [], harder: ['plank'] },
    'russian-twist': { pattern: 'core-rot', loadType: 'bodyweight-loadable', barWeight: 0, unilateral: false, metric: 'reps', tier: 3, prio: 3, stretch: false, joint: { shoulder: 0, elbow: 0, knee: 0, lowBack: 2 }, family: 'crunch-rot', easier: [], harder: [] },
    'v-up': { pattern: 'core-flex', loadType: 'bodyweight', barWeight: 0, unilateral: false, metric: 'reps', tier: 3, prio: 3, stretch: false, joint: { shoulder: 0, elbow: 0, knee: 0, lowBack: 1 }, family: 'v-up', easier: ['reverse-crunch'], harder: [] },
    'ab-wheel-rollout': { pattern: 'core-antiext', loadType: 'bodyweight', barWeight: 0, unilateral: false, metric: 'reps', tier: 3, prio: 1, stretch: false, joint: { shoulder: 1, elbow: 0, knee: 0, lowBack: 2 }, family: 'ab-wheel', easier: ['plank'], harder: [] },
    'cable-crunch': { pattern: 'core-flex', loadType: 'cable', barWeight: 0, unilateral: false, metric: 'reps', tier: 3, prio: 1, stretch: false, joint: { shoulder: 0, elbow: 0, knee: 0, lowBack: 0 }, family: 'crunch-loaded', easier: [], harder: [] },
    'cable-woodchop': { pattern: 'core-rot', loadType: 'cable', barWeight: 0, unilateral: true, metric: 'reps', tier: 3, prio: 1, stretch: false, joint: { shoulder: 0, elbow: 0, knee: 0, lowBack: 1 }, family: 'woodchop', easier: [], harder: [] },
    'ab-crunch-machine': { pattern: 'core-flex', loadType: 'machine-stack', barWeight: 0, unilateral: false, metric: 'reps', tier: 3, prio: 2, stretch: false, joint: { shoulder: 0, elbow: 0, knee: 0, lowBack: 0 }, family: 'crunch-loaded', easier: [], harder: [] },
    // AVAMBRACCI
    'wrist-curl': { pattern: 'iso-forearm', loadType: 'dumbbell-pair', barWeight: 0, unilateral: false, metric: 'reps', tier: 3, prio: 3, stretch: false, joint: { shoulder: 0, elbow: 1, knee: 0, lowBack: 0 }, family: 'wrist', easier: [], harder: [] },
    'reverse-wrist-curl': { pattern: 'iso-forearm', loadType: 'dumbbell-pair', barWeight: 0, unilateral: false, metric: 'reps', tier: 3, prio: 3, stretch: false, joint: { shoulder: 0, elbow: 1, knee: 0, lowBack: 0 }, family: 'wrist', easier: [], harder: [] },
    'farmer-walk': { pattern: 'carry', loadType: 'dumbbell-pair', barWeight: 0, unilateral: false, metric: 'time', tier: 3, prio: 2, stretch: false, joint: { shoulder: 0, elbow: 1, knee: 0, lowBack: 1 }, family: 'carry', easier: [], harder: [] },
    'dead-hang': { pattern: 'iso-forearm', loadType: 'bodyweight', barWeight: 0, unilateral: false, metric: 'time', tier: 3, prio: 3, stretch: false, joint: { shoulder: 1, elbow: 1, knee: 0, lowBack: 0 }, family: 'hang', easier: [], harder: [] },
};

Object.keys(EXERCISE_TAGS).forEach(id => {
    if (EXERCISES_DB[id]) Object.assign(EXERCISES_DB[id], EXERCISE_TAGS[id]);
});
