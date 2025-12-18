/**
 * GymTracker Pro - Exercise Database
 * Comprehensive database of 200+ exercises organized by category
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
    "rack-pull": {
        id: "rack-pull",
        name: "Rack Pull",
        category: "bilanciere",
        primaryMuscles: ["schiena", "trapezio"],
        secondaryMuscles: ["glutei", "femorali", "avambracci"],
        type: "compound",
        difficulty: "intermediate",
        equipment: ["bilanciere"],
        instructions: "Imposta il bilanciere sui rack all'altezza delle ginocchia. Esegui la parte finale dello stacco da terra, concentrandoti sulla contrazione della schiena e del trapezio.",
        tips: ["Ottimo per overload del trapezio", "Permette carichi maggiori dello stacco completo", "Mantieni la schiena neutra"]
    },
    "barbell-shrug": {
        id: "barbell-shrug",
        name: "Scrollate Bilanciere",
        category: "bilanciere",
        primaryMuscles: ["trapezio"],
        secondaryMuscles: ["avambracci"],
        type: "isolation",
        difficulty: "beginner",
        equipment: ["bilanciere"],
        instructions: "In piedi con il bilanciere davanti alle cosce, solleva le spalle verso le orecchie senza piegare i gomiti.",
        tips: ["Non ruotare le spalle", "Tieni la contrazione in alto per 1-2 secondi", "Permette carichi pesanti"]
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
    "chest-supported-row": {
        id: "chest-supported-row",
        name: "Rematore su Panca Inclinata",
        category: "manubri",
        primaryMuscles: ["schiena"],
        secondaryMuscles: ["bicipiti", "trapezio"],
        type: "compound",
        difficulty: "beginner",
        equipment: ["manubri", "panca"],
        instructions: "Sdraiati a pancia in giù su una panca inclinata a 30-45 gradi. Con un manubrio per mano, tira verso i fianchi stringendo le scapole.",
        tips: ["Elimina il cheating della schiena", "Ottimo per isolare i dorsali", "Mantieni il petto appoggiato alla panca"]
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
    "cable-row-single": {
        id: "cable-row-single",
        name: "Rematore Cavo Singolo",
        category: "cavi",
        primaryMuscles: ["schiena"],
        secondaryMuscles: ["bicipiti"],
        type: "isolation",
        difficulty: "beginner",
        equipment: ["cavi"],
        instructions: "Al cavo basso con maniglia singola, tira verso il fianco ruotando leggermente il busto. Alterna le braccia.",
        tips: ["Ottimo per correggere squilibri", "Focus sulla contrazione unilaterale", "Controlla la fase negativa"]
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
    "dumbbell-shrug-shoulders": {
        id: "dumbbell-shrug-shoulders",
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
        equipment: ["manubri"],
        instructions: "Stacco rumeno su una gamba sola.",
        tips: ["Ottimo per equilibrio e unilateralità"]
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
    },

    // ========================================
    // ESERCIZI RESISTENZA/CONDIZIONAMENTO
    // ========================================

    "kettlebell-swing": {
        id: "kettlebell-swing",
        name: "Kettlebell Swing",
        category: "kettlebell",
        primaryMuscles: ["glutei", "femorali"],
        secondaryMuscles: ["schiena", "addome", "spalle"],
        type: "compound",
        difficulty: "intermediate",
        equipment: ["kettlebell"],
        instructions: "In piedi con piedi larghi spalle, afferra il kettlebell con entrambe le mani. Oscilla tra le gambe poi spingi con i fianchi per portarlo all'altezza del petto.",
        tips: ["Il movimento parte dai fianchi, non dalle braccia", "Mantieni la schiena neutra", "Contrai i glutei in cima"]
    },
    "battle-ropes": {
        id: "battle-ropes",
        name: "Battle Ropes",
        category: "cardio",
        primaryMuscles: ["spalle"],
        secondaryMuscles: ["bicipiti", "addome", "schiena"],
        type: "compound",
        difficulty: "intermediate",
        equipment: ["corde"],
        instructions: "Afferra le estremità delle corde, piega leggermente le ginocchia e crea onde alternate con le braccia il più velocemente possibile.",
        tips: ["Mantieni il core attivo", "Respira ritmicamente", "Ottimo per HIIT"]
    },
    "box-jump": {
        id: "box-jump",
        name: "Box Jump",
        category: "pliometria",
        primaryMuscles: ["quadricipiti", "glutei"],
        secondaryMuscles: ["polpacci", "femorali"],
        type: "compound",
        difficulty: "intermediate",
        equipment: ["box"],
        instructions: "Parti in piedi davanti al box. Piega le ginocchia e salta esplosivamente atterrando dolcemente sul box con entrambi i piedi.",
        tips: ["Atterra dolcemente con le ginocchia piegate", "Scendi camminando, non saltando", "Inizia con altezze basse"]
    },
    "burpee": {
        id: "burpee",
        name: "Burpee",
        category: "corpo-libero",
        primaryMuscles: ["petto", "quadricipiti"],
        secondaryMuscles: ["tricipiti", "spalle", "addome", "glutei"],
        type: "compound",
        difficulty: "intermediate",
        equipment: [],
        instructions: "Parti in piedi, scendi in squat, metti le mani a terra, salta indietro in plank, fai un push-up, salta i piedi verso le mani e salta in alto con le braccia sopra la testa.",
        tips: ["Movimento fluido e continuo", "Ottimo per il condizionamento", "Modifica rimuovendo il push-up se troppo intenso"]
    },
    "thruster": {
        id: "thruster",
        name: "Thruster",
        category: "bilanciere",
        primaryMuscles: ["quadricipiti", "spalle"],
        secondaryMuscles: ["glutei", "tricipiti", "addome"],
        type: "compound",
        difficulty: "advanced",
        equipment: ["bilanciere"],
        instructions: "Parti con il bilanciere in posizione front squat. Esegui uno squat completo e risalendo usa lo slancio per premere il bilanciere sopra la testa.",
        tips: ["Movimento fluido squat-press", "Usa lo slancio delle gambe", "Ottimo per condizionamento metabolico"]
    },
    "meadows-row": {
        id: "meadows-row",
        name: "Meadows Row",
        category: "bilanciere",
        primaryMuscles: ["schiena"],
        secondaryMuscles: ["bicipiti", "trapezio"],
        type: "compound",
        difficulty: "advanced",
        equipment: ["bilanciere"],
        instructions: "Posiziona un'estremità del bilanciere in un angolo. Stai perpendicolare alla barra e tira con una mano verso il fianco, ruotando leggermente il busto.",
        tips: ["Ottimo per lo spessore della schiena", "Permette un ROM maggiore", "Creato da John Meadows"]
    },
    "incline-cable-fly": {
        id: "incline-cable-fly",
        name: "Croci Cavi Inclinato",
        category: "cavi",
        primaryMuscles: ["petto"],
        secondaryMuscles: ["spalle"],
        type: "isolation",
        difficulty: "beginner",
        equipment: ["cavi", "panca"],
        instructions: "Posiziona una panca inclinata tra due cavi bassi. Tira i cavi verso l'alto unendo le mani sopra il petto con le braccia leggermente piegate.",
        tips: ["Enfatizza la parte alta del petto", "Mantieni tensione costante", "Movimento controllato"]
    }
};

// Export functions to get exercises
function getAllExercises() {
    return Object.values(EXERCISES_DB);
}

function getExerciseById(id) {
    return EXERCISES_DB[id] || null;
}

function getExercisesByCategory(category) {
    return Object.values(EXERCISES_DB).filter(ex => ex.category === category);
}

function getExercisesByMuscle(muscle) {
    return Object.values(EXERCISES_DB).filter(ex =>
        ex.primaryMuscles.includes(muscle) || ex.secondaryMuscles.includes(muscle)
    );
}

function getExercisesByPrimaryMuscle(muscle) {
    return Object.values(EXERCISES_DB).filter(ex => ex.primaryMuscles.includes(muscle));
}

function getExercisesByType(type) {
    return Object.values(EXERCISES_DB).filter(ex => ex.type === type);
}

function getCompoundExercises() {
    return Object.values(EXERCISES_DB).filter(ex => ex.type === "compound");
}

function getIsolationExercises() {
    return Object.values(EXERCISES_DB).filter(ex => ex.type === "isolation");
}

function searchExercises(query) {
    const q = query.toLowerCase();
    return Object.values(EXERCISES_DB).filter(ex =>
        ex.name.toLowerCase().includes(q) ||
        ex.primaryMuscles.some(m => m.includes(q)) ||
        ex.category.includes(q)
    );
}

// Muscle groups for UI
const MUSCLE_GROUPS = [
    { id: "petto", name: "Petto", icon: "💪" },
    { id: "schiena", name: "Schiena", icon: "🔙" },
    { id: "spalle", name: "Spalle", icon: "🎯" },
    { id: "bicipiti", name: "Bicipiti", icon: "💪" },
    { id: "tricipiti", name: "Tricipiti", icon: "💪" },
    { id: "quadricipiti", name: "Quadricipiti", icon: "🦵" },
    { id: "femorali", name: "Femorali", icon: "🦵" },
    { id: "glutei", name: "Glutei", icon: "🍑" },
    { id: "polpacci", name: "Polpacci", icon: "🦶" },
    { id: "addome", name: "Addome", icon: "🎯" },
    { id: "avambracci", name: "Avambracci", icon: "💪" },
    { id: "trapezio", name: "Trapezio", icon: "🔺" }
];

// Equipment categories
const EQUIPMENT_CATEGORIES = [
    { id: "bilanciere", name: "Bilanciere", icon: "🏋️" },
    { id: "manubri", name: "Manubri", icon: "🔩" },
    { id: "macchine", name: "Macchine", icon: "⚙️" },
    { id: "cavi", name: "Cavi", icon: "🔗" },
    { id: "corpo-libero", name: "Corpo Libero", icon: "🤸" },
    { id: "accessori", name: "Accessori", icon: "🎒" }
];
