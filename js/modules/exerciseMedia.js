/**
 * GymTracker Pro - Exercise Media Module
 * Handles GIF animations from ExerciseDB and detailed exercise instructions
 */

// Mapping of Italian exercise IDs to GIF URLs from fitnessprogramer.com
const EXERCISE_GIF_MAP = {
    // PETTO
    "bench-press": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Bench-Press.gif",
    "incline-bench-press": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Incline-Barbell-Bench-Press.gif",
    "decline-bench-press": "https://fitnessprogramer.com/wp-content/uploads/2021/03/Decline-Barbell-Bench-Press.gif",
    "dumbbell-bench-press": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Press-1.gif",
    "dumbbell-incline-press": "https://fitnessprogramer.com/wp-content/uploads/2021/06/Incline-Dumbbel-Hammer-Press.gif",
    "dumbbell-decline-press": "https://fitnessprogramer.com/wp-content/uploads/2021/09/Dumbbell-Decline-One-Arm-Hammer-Press.gif",
    "dumbbell-fly": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Fly.gif",
    "dumbbell-incline-fly": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Incline-dumbbell-Fly.gif",
    "dumbbell-pullover": "https://fitnessprogramer.com/wp-content/uploads/2021/04/Lying-Extension-Pullover.gif",
    "chest-press-machine": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Chest-Press-Machine.gif",
    "incline-chest-press-machine": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Incline-Chest-Press-Machine.gif",
    "pec-deck": "https://fitnessprogramer.com/wp-content/uploads/2021/05/10301301-Lever-Pec-Deck-Fly_Chest_720.gif",
    "smith-bench-press": "https://fitnessprogramer.com/wp-content/uploads/2021/06/Smith-Machine-Bench-Press.gif",
    "cable-crossover": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Cable-Crossover.gif",
    "cable-fly-low": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Low-Cable-Crossover.gif",
    "cable-fly-mid": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Cable-Crossover.gif",
    "push-up": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Push-Up.gif",
    "diamond-push-up": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Diamond-Push-up.gif",
    "wide-push-up": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Push-Up.gif",
    "decline-push-up": "https://fitnessprogramer.com/wp-content/uploads/2015/07/Decline-Push-Up.gif",
    "dips": "https://fitnessprogramer.com/wp-content/uploads/2021/06/Chest-Dips.gif",

    // SCHIENA
    "deadlift": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Deadlift.gif",
    "barbell-row": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Bent-Over-Row.gif",
    "pendlay-row": "https://fitnessprogramer.com/wp-content/uploads/2022/07/Barbell-Pendlay-Row.gif",
    "t-bar-row": "https://fitnessprogramer.com/wp-content/uploads/2021/04/t-bar-rows.gif",
    "dumbbell-row": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Row.gif",
    "dumbbell-row-two-arm": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Bent-Over-Dumbbell-Row.gif",
    "dumbbell-shrug": "https://fitnessprogramer.com/wp-content/uploads/2021/04/Dumbbell-Shrug.gif",
    "lat-pulldown": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Lat-Pulldown.gif",
    "lat-pulldown-close": "https://fitnessprogramer.com/wp-content/uploads/2021/06/Close-Grip-Lat-Pulldown.gif",
    "seated-cable-row": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Seated-Cable-Row.gif",
    "machine-row": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Seated-Row-Machine.gif",
    "assisted-pull-up": "https://fitnessprogramer.com/wp-content/uploads/2021/04/Assisted-Pull-up.gif",
    "hyperextension": "https://fitnessprogramer.com/wp-content/uploads/2021/02/hyperextension.gif",
    "straight-arm-pulldown": "https://fitnessprogramer.com/wp-content/uploads/2021/05/Cable-Straight-Arm-Pulldown.gif",
    "face-pull": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Face-Pull.gif",
    "pull-up": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Pull-up.gif",
    "chin-up": "https://fitnessprogramer.com/wp-content/uploads/2021/03/Chin-Up.gif",
    "neutral-grip-pull-up": "https://fitnessprogramer.com/wp-content/uploads/2022/08/neutral-grip-pull-up.gif",
    "inverted-row": "https://fitnessprogramer.com/wp-content/uploads/2021/06/Inverted-Row.gif",
    "superman": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Superman-exercise.gif",

    // SPALLE
    "overhead-press": "https://fitnessprogramer.com/wp-content/uploads/2021/07/Barbell-Standing-Military-Press.gif",
    "push-press": "https://fitnessprogramer.com/wp-content/uploads/2021/02/push-press-1.gif",
    "barbell-front-raise": "https://fitnessprogramer.com/wp-content/uploads/2021/10/Barbell-Front-Raise-Twist.gif",
    "upright-row": "https://fitnessprogramer.com/wp-content/uploads/2021/02/barbell-uprightrow.gif",
    "dumbbell-shoulder-press": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Shoulder-Press.gif",
    "arnold-press": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Arnold-Press.gif",
    "lateral-raise": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Lateral-Raise.gif",
    "front-raise": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Front-Raise.gif",
    "rear-delt-fly": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Bent-Over-Lateral-Raise.gif",
    "dumbbell-shrug-shoulders": "https://fitnessprogramer.com/wp-content/uploads/2021/04/Dumbbell-Shrug.gif",
    "shoulder-press-machine": "https://fitnessprogramer.com/wp-content/uploads/2021/04/Lever-Shoulder-Press.gif",
    "lateral-raise-machine": "https://fitnessprogramer.com/wp-content/uploads/2021/06/Lateral-Raise-Machine.gif",
    "reverse-pec-deck": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Rear-Delt-Machine-Flys.gif",
    "cable-lateral-raise": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Cable-Lateral-Raise.gif",
    "cable-front-raise": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Cable-Front-Raise.gif",
    "cable-rear-delt": "https://fitnessprogramer.com/wp-content/uploads/2021/02/cable-rear-delt-fly.gif",
    "pike-push-up": "https://fitnessprogramer.com/wp-content/uploads/2021/06/Pike-Push-up.gif",
    "handstand-push-up": "https://fitnessprogramer.com/wp-content/uploads/2021/06/handstand-push-up.gif",

    // BICIPITI
    "barbell-curl": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Curl.gif",
    "ez-bar-curl": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Z-Bar-Curl.gif",
    "preacher-curl": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Z-Bar-Preacher-Curl.gif",
    "dumbbell-curl": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Curl.gif",
    "hammer-curl": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Hammer-Curl.gif",
    "incline-curl": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Seated-Incline-Dumbbell-Curl.gif",
    "concentration-curl": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Concentration-Curl.gif",
    "spider-curl": "https://fitnessprogramer.com/wp-content/uploads/2022/02/Single-Dumbbell-Spider-Hammer-Curl.gif",
    "cable-curl": "https://fitnessprogramer.com/wp-content/uploads/2021/02/cable-curl.gif",
    "cable-hammer-curl": "https://fitnessprogramer.com/wp-content/uploads/2021/06/rope-bicep-curls.gif",
    "bicep-curl-machine": "https://fitnessprogramer.com/wp-content/uploads/2021/09/Bicep-Curl-Machine.gif",

    // TRICIPITI
    "close-grip-bench": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Close-Grip-Bench-Press.gif",
    "skull-crusher": "https://fitnessprogramer.com/wp-content/uploads/2021/06/Dumbbell-Skull-Crusher.gif",
    "dumbbell-tricep-extension": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Triceps-Extension.gif",
    "dumbbell-kickback": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Kickback.gif",
    "tate-press": "https://fitnessprogramer.com/wp-content/uploads/2021/06/Dumbbell-Skull-Crusher.gif",
    "tricep-pushdown": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Pushdown.gif",
    "rope-pushdown": "https://fitnessprogramer.com/wp-content/uploads/2021/06/Rope-Pushdown.gif",
    "overhead-cable-extension": "https://fitnessprogramer.com/wp-content/uploads/2021/04/Cable-Rope-Overhead-Triceps-Extension.gif",
    "bench-dips": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Bench-Dips.gif",
    "close-grip-push-up": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Diamond-Push-up.gif",
    "tricep-dip-machine": "https://fitnessprogramer.com/wp-content/uploads/2021/09/Triceps-Dip-Machine.gif",

    // QUADRICIPITI
    "squat": "https://fitnessprogramer.com/wp-content/uploads/2021/02/BARBELL-SQUAT.gif",
    "front-squat": "https://fitnessprogramer.com/wp-content/uploads/2021/06/front-squat.gif",
    "bulgarian-split-squat-bb": "https://fitnessprogramer.com/wp-content/uploads/2021/05/Barbell-Bulgarian-Split-Squat.gif",
    "goblet-squat": "https://fitnessprogramer.com/wp-content/uploads/2023/01/Dumbbell-Goblet-Squat.gif",
    "dumbbell-lunge": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Lunge.gif",
    "bulgarian-split-squat": "https://fitnessprogramer.com/wp-content/uploads/2021/05/Dumbbell-Bulgarian-Split-Squat.gif",
    "step-up": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Step-up.gif",
    "leg-press": "https://fitnessprogramer.com/wp-content/uploads/2015/11/Leg-Press.gif",
    "hack-squat": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Sled-Hack-Squat.gif",
    "leg-extension": "https://fitnessprogramer.com/wp-content/uploads/2021/02/LEG-EXTENSION.gif",
    "smith-squat": "https://fitnessprogramer.com/wp-content/uploads/2024/10/smith-machine-squat.gif",
    "bodyweight-squat": "https://fitnessprogramer.com/wp-content/uploads/2021/05/bodyweight-squat-full-version.gif",
    "jump-squat": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Jump-Squat.gif",
    "walking-lunge": "https://fitnessprogramer.com/wp-content/uploads/2023/09/dumbbell-lunges.gif",
    "pistol-squat": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Pistol-Squat.gif",

    // FEMORALI
    "romanian-deadlift": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Romanian-Deadlift.gif",
    "stiff-leg-deadlift": "https://fitnessprogramer.com/wp-content/uploads/2022/01/Stiff-Leg-Deadlift.gif",
    "good-morning": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Good-Morning.gif",
    "dumbbell-rdl": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Romanian-Deadlift.gif",
    "single-leg-rdl": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Romanian-Deadlift.gif",
    "leg-curl-lying": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Leg-Curl.gif",
    "leg-curl-seated": "https://fitnessprogramer.com/wp-content/uploads/2021/08/Seated-Leg-Curl.gif",
    "nordic-curl": "https://fitnessprogramer.com/wp-content/uploads/2021/06/Nordic-Hamstring-Curl.gif",
    "glute-ham-raise": "https://fitnessprogramer.com/wp-content/uploads/2023/07/Glute-Ham-Raise.gif",

    // GLUTEI
    "hip-thrust": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Hip-Thrust.gif",
    "sumo-deadlift": "https://fitnessprogramer.com/wp-content/uploads/2021/04/Barbell-Sumo-Deadlift.gif",
    "dumbbell-hip-thrust": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Hip-Thrust.gif",
    "glute-kickback-machine": "https://fitnessprogramer.com/wp-content/uploads/2021/06/Glute-Kickback-Machine.gif",
    "hip-abduction": "https://fitnessprogramer.com/wp-content/uploads/2021/02/HiP-ABDUCTION-MACHINE.gif",
    "cable-kickback": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Cable-Hip-Extension.gif",
    "glute-bridge": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Glute-Bridge-.gif",
    "single-leg-glute-bridge": "https://fitnessprogramer.com/wp-content/uploads/2021/06/Single-Leg-Bridge.gif",
    "donkey-kick": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Donkey-Kicks.gif",
    "fire-hydrant": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Fire-Hydrant.gif",

    // POLPACCI
    "seated-calf-raise": "https://fitnessprogramer.com/wp-content/uploads/2021/06/Lever-Seated-Calf-Raise.gif",
    "standing-calf-raise": "https://fitnessprogramer.com/wp-content/uploads/2021/06/Standing-Calf-Raise.gif",
    "leg-press-calf-raise": "https://fitnessprogramer.com/wp-content/uploads/2021/05/Leg-Press-Calf-Raise.gif",
    "bodyweight-calf-raise": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Calf-Raise.gif",
    "single-leg-calf-raise": "https://fitnessprogramer.com/wp-content/uploads/2021/06/Single-Leg-Calf-Raises.gif",

    // ADDOME
    "crunch": "https://fitnessprogramer.com/wp-content/uploads/2015/11/Crunch.gif",
    "reverse-crunch": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Reverse-Crunch-1.gif",
    "plank": "https://fitnessprogramer.com/wp-content/uploads/2021/02/plank.gif",
    "side-plank": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Side-Plank-1-360x360.png",
    "mountain-climber": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Mountain-climber.gif",
    "leg-raise": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Lying-Leg-Raise.gif",
    "hanging-leg-raise": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Hanging-Knee-Raises.gif",
    "bicycle-crunch": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Bicycle-Crunch.gif",
    "dead-bug": "https://fitnessprogramer.com/wp-content/uploads/2021/05/Dead-Bug.gif",
    "russian-twist": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Russian-Twist.gif",
    "v-up": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Jackknife-Sit-ups.gif",
    "ab-wheel-rollout": "https://fitnessprogramer.com/wp-content/uploads/2021/06/Ab-Wheel-Rollout.gif",
    "cable-crunch": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Kneeling-Cable-Crunch.gif",
    "cable-woodchop": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Russian-Twist.gif",
    "ab-crunch-machine": "https://fitnessprogramer.com/wp-content/uploads/2021/09/Seated-Crunch-Machine.gif",

    // AVAMBRACCI
    "wrist-curl": "https://fitnessprogramer.com/wp-content/uploads/2021/02/barbell-Wrist-Curl.gif",
    "reverse-wrist-curl": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Reverse-Wrist-Curl.gif",
    "farmer-walk": "https://fitnessprogramer.com/wp-content/uploads/2022/02/Farmers-walk_Cardio.gif",
    "dead-hang": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Pull-up.gif",

    // WARMUP & STRETCHING
    "neck-rotation": "https://fitnessprogramer.com/wp-content/uploads/2021/07/Rotating-Neck-Stretch.gif",
    "arm-circles": "https://fitnessprogramer.com/wp-content/uploads/2021/02/arm-circles.gif",
    "shoulder-stretch": "https://fitnessprogramer.com/wp-content/uploads/2021/04/Across-Chest-Shoulder-Stretch.gif",
    "chest-stretch": "https://fitnessprogramer.com/wp-content/uploads/2021/06/Dynamic-Chest-Stretch.gif",
    "hip-circles": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Hip-Circles.gif",
    "leg-swings": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Leg-Swings.gif",
    "jumping-jacks": "https://fitnessprogramer.com/wp-content/uploads/2021/05/Jumping-jack.gif",
    "high-knees": "https://fitnessprogramer.com/wp-content/uploads/2021/08/High-Knee-Run.gif",
    "butt-kicks": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Butt-Kicks.gif",
    "quad-stretch": "https://fitnessprogramer.com/wp-content/uploads/2021/08/Standing-Quadriceps-Stretch.gif",
    "hamstring-stretch": "https://fitnessprogramer.com/wp-content/uploads/2021/05/Standing-Hamstring-Stretch.gif",
    "calf-stretch": "https://fitnessprogramer.com/wp-content/uploads/2022/02/Standing-Wall-Calf-Stretch.gif",
    "hip-flexor-stretch": "https://fitnessprogramer.com/wp-content/uploads/2021/08/Kneeling-Hip-Flexor-Stretch.gif",
    "triceps-stretch": "https://fitnessprogramer.com/wp-content/uploads/2022/02/Triceps-Stretch.gif",
    "lat-stretch": "https://fitnessprogramer.com/wp-content/uploads/2022/02/Foam-Roller-Lat-Stretch.gif",
    "cat-cow": "https://gymvisual.com/img/p/2/1/7/8/4/21784.gif",
    "childs-pose": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Childs-Pose.gif",
    "cobra-stretch": "https://fitnessprogramer.com/wp-content/uploads/2021/06/abdominal-stretch.gif",
    "piriformis-stretch": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Piriformis-Stretch.gif",
    "butterfly-stretch": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Butterfly-Stretch.gif",
    "downward-dog": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Downward-Dog.gif",
    "world-greatest-stretch": "https://fitnessprogramer.com/wp-content/uploads/2021/02/World-Greatest-Stretch.gif",
    "foam-roller-back": "https://fitnessprogramer.com/wp-content/uploads/2022/02/Roll-Upper-Back.gif",
    "foam-roller-quads": "https://fitnessprogramer.com/wp-content/uploads/2022/02/Foam-Roller-Quads.gif",
    "foam-roller-it-band": "https://fitnessprogramer.com/wp-content/uploads/2022/02/Foam-Roller-IT-iliotibial-Band-Stretch.gif",
    "hanging-knee-raise": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Hanging-Knee-Raises.gif",
    "barbell-shrug": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Shrug.gif",
    "cable-shrug": "https://fitnessprogramer.com/wp-content/uploads/2021/04/Cable-Shrug.gif"
};

// Detailed exercise instructions (Italian)
const EXERCISE_DETAILS = {
    // PETTO
    "bench-press": {
        execution: {
            steps: [
                "Sdraiati sulla panca con i piedi ben piantati a terra per stabilità",
                "Afferra il bilanciere con una presa leggermente più larga delle spalle",
                "Stacca il bilanciere dal rack e portalo sopra il petto con le braccia tese",
                "Inspira e abbassa il bilanciere in modo controllato verso il petto medio",
                "Tocca leggermente il petto senza rimbalzare",
                "Espira e spingi il bilanciere verso l'alto fino a distendere le braccia"
            ],
            tips: [
                "Mantieni le scapole retratte e depresse per tutta la durata dell'esercizio",
                "Crea un leggero arco naturale nella schiena (non eccessivo)",
                "I gomiti dovrebbero formare un angolo di circa 45-75° rispetto al corpo",
                "Mantieni i polsi dritti e allineati con gli avambracci",
                "Contrai i glutei per maggiore stabilità"
            ],
            commonMistakes: [
                "Rimbalzare il bilanciere sul petto",
                "Sollevare i glutei dalla panca",
                "Gomiti troppo larghi (90°) che stressano le spalle",
                "Polsi piegati all'indietro",
                "Non usare un aiutante con carichi pesanti"
            ],
            breathing: "Inspira durante la discesa, espira durante la spinta verso l'alto",
            muscles: {
                primary: "Grande pettorale",
                secondary: "Deltoide anteriore, Tricipite brachiale"
            }
        }
    },
    "incline-bench-press": {
        execution: {
            steps: [
                "Imposta la panca a un angolo di 30-45 gradi",
                "Sdraiati con la schiena ben appoggiata e i piedi a terra",
                "Afferra il bilanciere con presa leggermente più larga delle spalle",
                "Stacca il bilanciere e portalo sopra la parte alta del petto",
                "Abbassa il bilanciere verso la parte superiore del petto/clavicole",
                "Spingi verso l'alto tornando alla posizione iniziale"
            ],
            tips: [
                "Un angolo di 30° è ottimale per il petto alto, 45° coinvolge di più le spalle",
                "Mantieni le scapole retratte per proteggere le spalle",
                "Il percorso del bilanciere sarà leggermente diverso dalla panca piana",
                "Concentrati sulla contrazione della parte alta del petto"
            ],
            commonMistakes: [
                "Angolo della panca troppo alto (diventa un overhead press)",
                "Far scendere il bilanciere troppo in basso verso l'addome",
                "Arcuare eccessivamente la schiena annullando l'inclinazione"
            ],
            breathing: "Inspira in discesa, espira in salita",
            muscles: {
                primary: "Grande pettorale (fasci clavicolari)",
                secondary: "Deltoide anteriore, Tricipite"
            }
        }
    },
    "dumbbell-bench-press": {
        execution: {
            steps: [
                "Siediti sulla panca con i manubri sulle cosce",
                "Usa le cosce per aiutarti a portare i manubri in posizione mentre ti sdrai",
                "Posiziona i manubri ai lati del petto con i gomiti a circa 45°",
                "Spingi i manubri verso l'alto facendoli convergere leggermente",
                "Abbassa controllando il movimento, sentendo lo stretch nel petto",
                "Ripeti mantenendo i manubri stabili"
            ],
            tips: [
                "I manubri permettono un range di movimento maggiore rispetto al bilanciere",
                "Puoi ruotare leggermente i polsi durante il movimento per comfort",
                "Ottimo per correggere squilibri di forza tra i due lati",
                "Non sbattere i manubri insieme in alto"
            ],
            commonMistakes: [
                "Scendere troppo in basso rischiando di stressare le spalle",
                "Usare momentum oscillando i manubri",
                "Non stabilizzare il core durante il movimento"
            ],
            breathing: "Inspira abbassando i manubri, espira spingendo",
            muscles: {
                primary: "Grande pettorale",
                secondary: "Deltoide anteriore, Tricipite, Stabilizzatori della spalla"
            }
        }
    },
    "dumbbell-fly": {
        execution: {
            steps: [
                "Sdraiati sulla panca con un manubrio per mano",
                "Porta i manubri sopra il petto con le braccia quasi completamente estese",
                "Mantieni una leggera flessione dei gomiti (15-20°) per tutta l'esecuzione",
                "Abbassa i manubri lateralmente in un arco ampio",
                "Scendi fino a sentire un buon stretch nel petto (braccia parallele al pavimento)",
                "Contrai il petto per riportare i manubri alla posizione iniziale"
            ],
            tips: [
                "Immagina di abbracciare un grande albero",
                "La flessione dei gomiti deve rimanere costante",
                "Concentrati sulla contrazione del petto, non sulle braccia",
                "Usa un peso moderato - questo è un esercizio di isolamento"
            ],
            commonMistakes: [
                "Piegare troppo i gomiti trasformandolo in una press",
                "Scendere troppo in basso stressando le spalle",
                "Usare troppo peso perdendo la forma corretta"
            ],
            breathing: "Inspira aprendo le braccia, espira chiudendo",
            muscles: {
                primary: "Grande pettorale",
                secondary: "Deltoide anteriore"
            }
        }
    },
    "push-up": {
        execution: {
            steps: [
                "Posizionati a terra in posizione di plank con le mani leggermente più larghe delle spalle",
                "Mantieni il corpo in linea retta dalla testa ai talloni",
                "Contrai addome e glutei per stabilità",
                "Abbassati piegando i gomiti fino a sfiorare il pavimento con il petto",
                "Spingi verso l'alto estendendo le braccia",
                "Mantieni il core contratto per tutto il movimento"
            ],
            tips: [
                "Le mani dovrebbero essere all'altezza delle spalle o leggermente più in basso",
                "I gomiti dovrebbero formare un angolo di 45° rispetto al corpo",
                "Guarda leggermente avanti, non verso il basso",
                "Se troppo difficile, inizia con le ginocchia a terra"
            ],
            commonMistakes: [
                "Far cadere i fianchi verso il basso",
                "Sollevare i glutei troppo in alto",
                "Non completare il range di movimento",
                "Gomiti troppo larghi che stressano le spalle"
            ],
            breathing: "Inspira scendendo, espira salendo",
            muscles: {
                primary: "Grande pettorale, Tricipite",
                secondary: "Deltoide anteriore, Core"
            }
        }
    },
    "cable-crossover": {
        execution: {
            steps: [
                "Posizionati al centro tra due cavi alti",
                "Afferra le maniglie e fai un passo avanti per creare tensione",
                "Inclina leggermente il busto in avanti",
                "Con le braccia quasi tese, porta le maniglie verso il basso e davanti",
                "Incrocia leggermente le mani davanti all'addome",
                "Torna controllando alla posizione iniziale"
            ],
            tips: [
                "Mantieni una leggera flessione dei gomiti costante",
                "Varia l'angolo per colpire diverse aree del petto",
                "Stringi forte il petto quando le mani si incontrano",
                "Controlla la fase eccentrica (ritorno)"
            ],
            commonMistakes: [
                "Usare troppo peso e perdere il controllo",
                "Piegare eccessivamente i gomiti",
                "Non mantenere la tensione durante tutto il movimento"
            ],
            breathing: "Espira portando le maniglie insieme, inspira tornando",
            muscles: {
                primary: "Grande pettorale (parte sternale)",
                secondary: "Deltoide anteriore"
            }
        }
    },
    "dips": {
        execution: {
            steps: [
                "Afferra le parallele e sollèvati con le braccia tese",
                "Inclina il busto leggermente in avanti (per enfatizzare il petto)",
                "Piega i gomiti e abbassati in modo controllato",
                "Scendi fino a quando le braccia formano un angolo di 90° o leggermente oltre",
                "Spingi verso l'alto tornando alla posizione iniziale",
                "Mantieni le spalle depresse e lontane dalle orecchie"
            ],
            tips: [
                "Più ti inclini avanti, più lavora il petto",
                "Più stai verticale, più lavorano i tricipiti",
                "Se troppo difficile, usa la macchina assistita",
                "Puoi aggiungere peso con una cintura quando diventa facile"
            ],
            commonMistakes: [
                "Scendere troppo stressando le spalle",
                "Non controllare la discesa",
                "Sollevare le spalle verso le orecchie",
                "Oscillare il corpo usando momentum"
            ],
            breathing: "Inspira scendendo, espira salendo",
            muscles: {
                primary: "Grande pettorale, Tricipite",
                secondary: "Deltoide anteriore"
            }
        }
    },

    // SCHIENA
    "deadlift": {
        execution: {
            steps: [
                "Posizionati con i piedi alla larghezza delle anche, bilanciere sopra la metà del piede",
                "Piegati afferrando il bilanciere con presa leggermente più larga delle ginocchia",
                "Abbassa i fianchi, solleva il petto e tendi la schiena",
                "Inspira, contrai il core e inizia a sollevare spingendo con i piedi",
                "Mantieni il bilanciere vicino al corpo durante tutta la salita",
                "Completa il movimento estendendo anche e ginocchia, contraendo i glutei in alto",
                "Abbassa il bilanciere invertendo il movimento in modo controllato"
            ],
            tips: [
                "La schiena deve rimanere neutra per tutto il movimento",
                "Il bilanciere deve rimanere a contatto o vicino alle gambe",
                "Pensa a 'spingere il pavimento' piuttosto che 'tirare il peso'",
                "Attiva i dorsali 'proteggendo le ascelle'",
                "Usa presa mista o con ganci per carichi pesanti"
            ],
            commonMistakes: [
                "Arrotondare la schiena (molto pericoloso)",
                "Iniziare con i fianchi troppo alti (diventa un stacco rumeno)",
                "Tenere il bilanciere lontano dal corpo",
                "Iperestendere la schiena in alto",
                "Non attivare il core prima di sollevare"
            ],
            breathing: "Grande inspirazione e trattenimento durante la salita, espira in alto o durante la discesa",
            muscles: {
                primary: "Erettori spinali, Glutei, Femorali",
                secondary: "Quadricipiti, Trapezio, Avambracci, Core"
            }
        }
    },
    "barbell-row": {
        execution: {
            steps: [
                "Afferra il bilanciere con presa prona leggermente più larga delle spalle",
                "Piegati in avanti mantenendo la schiena dritta, ginocchia leggermente flesse",
                "Il busto dovrebbe essere inclinato a circa 45-60° rispetto al pavimento",
                "Lascia pendere le braccia con il bilanciere sotto il petto",
                "Tira il bilanciere verso l'ombelico guidando con i gomiti",
                "Contrai le scapole in alto, poi abbassa controllando"
            ],
            tips: [
                "Immagina di tirare con i gomiti, non con le mani",
                "Contrai le scapole insieme alla fine del movimento",
                "Mantieni il core contratto per proteggere la schiena",
                "Presa supina enfatizza di più i bicipiti e la parte bassa dei dorsali"
            ],
            commonMistakes: [
                "Usare troppo momentum sollevando il busto",
                "Non contrarre le scapole in alto",
                "Tirare il bilanciere troppo in alto verso il petto",
                "Arrotondare la schiena"
            ],
            breathing: "Inspira in basso, espira tirando il bilanciere",
            muscles: {
                primary: "Grande dorsale, Romboidi, Trapezio",
                secondary: "Bicipiti, Erettori spinali, Deltoide posteriore"
            }
        }
    },
    "pull-up": {
        execution: {
            steps: [
                "Afferra la sbarra con presa prona leggermente più larga delle spalle",
                "Parti da braccia completamente distese (dead hang)",
                "Attiva le scapole tirandole verso il basso e indietro",
                "Tira il corpo verso l'alto guidando con il petto",
                "Continua fino a portare il mento sopra la sbarra",
                "Abbassa il corpo in modo controllato fino alla posizione iniziale"
            ],
            tips: [
                "Inizia ogni ripetizione da braccia completamente distese",
                "Pensa a portare i gomiti verso i fianchi",
                "Mantieni il core contratto per evitare oscillazioni",
                "Se non riesci, usa elastici o la macchina assistita"
            ],
            commonMistakes: [
                "Non completare il range di movimento",
                "Usare momentum oscillando il corpo (kipping)",
                "Non attivare le scapole all'inizio",
                "Incrociare le gambe causando instabilità"
            ],
            breathing: "Espira salendo, inspira scendendo",
            muscles: {
                primary: "Grande dorsale, Bicipiti",
                secondary: "Trapezio, Romboidi, Brachiale"
            }
        }
    },
    "lat-pulldown": {
        execution: {
            steps: [
                "Siediti alla macchina con le cosce bloccate sotto i cuscinetti",
                "Afferra la barra con presa larga e prona",
                "Inclina leggermente il busto all'indietro (circa 10-15°)",
                "Tira la barra verso il petto alto/clavicole",
                "Contrai le scapole insieme in basso",
                "Torna alla posizione iniziale estendendo le braccia con controllo"
            ],
            tips: [
                "Porta il petto verso la barra, non la barra verso il petto",
                "Concentrati sul tirare con i gomiti verso il basso",
                "Mantieni le spalle depresse, lontane dalle orecchie",
                "Non tirare la barra dietro la testa (stressante per le spalle)"
            ],
            commonMistakes: [
                "Tirare la barra dietro il collo",
                "Inclinarsi troppo indietro usando momentum",
                "Non completare il range di movimento",
                "Presa troppo larga che limita il ROM"
            ],
            breathing: "Espira tirando la barra, inspira tornando su",
            muscles: {
                primary: "Grande dorsale",
                secondary: "Bicipiti, Trapezio, Romboidi"
            }
        }
    },
    "dumbbell-row": {
        execution: {
            steps: [
                "Posiziona un ginocchio e una mano sulla panca per supporto",
                "Mantieni la schiena parallela al pavimento",
                "Afferra il manubrio con la mano libera, braccio disteso",
                "Tira il manubrio verso il fianco guidando con il gomito",
                "Contrai la scapola e il dorsale in alto",
                "Abbassa controllando il peso fino a braccio disteso"
            ],
            tips: [
                "Mantieni i fianchi squadrati, non ruotare il busto",
                "Tira il peso verso l'anca, non verso il petto",
                "Contrai il dorsale per 1 secondo in alto",
                "Puoi variare l'angolo di trazione per colpire diverse aree"
            ],
            commonMistakes: [
                "Ruotare il busto per aiutarsi a sollevare",
                "Tirare il peso troppo in alto verso la spalla",
                "Non distendere completamente il braccio in basso",
                "Usare troppo peso sacrificando la forma"
            ],
            breathing: "Espira tirando, inspira abbassando",
            muscles: {
                primary: "Grande dorsale, Romboidi",
                secondary: "Bicipiti, Deltoide posteriore, Trapezio"
            }
        }
    },
    "seated-cable-row": {
        execution: {
            steps: [
                "Siediti con i piedi sui supporti e le ginocchia leggermente flesse",
                "Afferra la maniglia con entrambe le mani",
                "Siediti eretto con il petto in fuori e la schiena dritta",
                "Tira la maniglia verso l'addome",
                "Contrai le scapole insieme alla fine del movimento",
                "Ritorna controllando fino a braccia distese senza arrotondare la schiena"
            ],
            tips: [
                "Non oscillare avanti e indietro con il busto",
                "Mantieni il petto alto durante tutto il movimento",
                "Stringi le scapole per 1-2 secondi in posizione contratta",
                "Usa diversi attacchi per variare lo stimolo"
            ],
            commonMistakes: [
                "Usare lo slancio del busto per tirare",
                "Arrotondare le spalle in avanti",
                "Non completare la contrazione delle scapole",
                "Piegarsi troppo in avanti nella fase eccentrica"
            ],
            breathing: "Espira tirando verso di te, inspira allungando le braccia",
            muscles: {
                primary: "Grande dorsale, Romboidi, Trapezio",
                secondary: "Bicipiti, Erettori spinali"
            }
        }
    },

    // SPALLE
    "overhead-press": {
        execution: {
            steps: [
                "Afferra il bilanciere con presa leggermente più larga delle spalle",
                "Posiziona il bilanciere sulle clavicole/deltoidi anteriori",
                "I gomiti dovrebbero essere leggermente davanti al bilanciere",
                "Contrai glutei e addome per stabilità",
                "Spingi il bilanciere verso l'alto muovendo la testa leggermente indietro",
                "Una volta che il bilanciere supera la fronte, riporta la testa sotto",
                "Blocca le braccia in alto con il bilanciere sopra la testa",
                "Abbassa controllando alla posizione iniziale"
            ],
            tips: [
                "Mantieni il core molto contratto per proteggere la schiena",
                "Il percorso del bilanciere dovrebbe essere una linea retta",
                "Contrai i glutei per evitare di arcuare la schiena",
                "Respira e stabilizzati tra le ripetizioni"
            ],
            commonMistakes: [
                "Arcuare eccessivamente la schiena",
                "Spingere il bilanciere in avanti invece che verticalmente",
                "Non contrarre il core",
                "Usare le gambe per spingere (a meno che non sia push press)"
            ],
            breathing: "Inspira in basso, espira durante la spinta, o trattieni per carichi pesanti",
            muscles: {
                primary: "Deltoide (tutti i capi)",
                secondary: "Tricipiti, Trapezio superiore, Core"
            }
        }
    },
    "lateral-raise": {
        execution: {
            steps: [
                "In piedi con i manubri ai lati, palmi verso il corpo",
                "Mantieni una leggera flessione dei gomiti",
                "Solleva i manubri lateralmente fino all'altezza delle spalle",
                "Le braccia dovrebbero essere parallele al pavimento in alto",
                "Abbassa i manubri controllando il movimento",
                "Mantieni i polsi neutri durante tutto il movimento"
            ],
            tips: [
                "Immagina di versare l'acqua da una brocca in alto (leggera rotazione interna)",
                "Non superare l'altezza delle spalle per evitare impingement",
                "Usa un peso leggero - le spalle laterali sono muscoli piccoli",
                "Concentrati sulla contrazione del deltoide laterale"
            ],
            commonMistakes: [
                "Usare troppo peso e compensare con il corpo",
                "Alzare le spalle verso le orecchie",
                "Portare i manubri troppo in alto stressando le spalle",
                "Oscillare il corpo per aiutare il sollevamento"
            ],
            breathing: "Espira sollevando, inspira abbassando",
            muscles: {
                primary: "Deltoide laterale",
                secondary: "Trapezio superiore"
            }
        }
    },
    "dumbbell-shoulder-press": {
        execution: {
            steps: [
                "Siediti su una panca con schienale a 90° o leggermente inclinato",
                "Porta i manubri all'altezza delle spalle, palmi in avanti",
                "Spingi i manubri verso l'alto convergendo leggermente",
                "Distendi completamente le braccia in alto",
                "Abbassa i manubri controllando fino all'altezza delle orecchie",
                "Mantieni il core contratto durante tutto il movimento"
            ],
            tips: [
                "Non urtare i manubri insieme in alto",
                "Mantieni la schiena appoggiata allo schienale",
                "Puoi anche eseguirlo in piedi per maggiore coinvolgimento del core",
                "Varia l'angolo di rotazione dei palmi per diverso stimolo"
            ],
            commonMistakes: [
                "Arcuare la schiena allontanandola dallo schienale",
                "Non completare il range di movimento",
                "Sbattere i manubri insieme in alto",
                "Sollevare le spalle verso le orecchie"
            ],
            breathing: "Espira spingendo verso l'alto, inspira abbassando",
            muscles: {
                primary: "Deltoide anteriore e laterale",
                secondary: "Tricipiti, Trapezio"
            }
        }
    },
    "face-pull": {
        execution: {
            steps: [
                "Imposta il cavo all'altezza del viso o leggermente più in alto",
                "Afferra la corda con presa neutra",
                "Fai un passo indietro per creare tensione",
                "Tira la corda verso il viso separando le mani",
                "Ruota esternamente le spalle portando i pugni ai lati della testa",
                "Le braccia dovrebbero formare una W in posizione finale",
                "Torna alla posizione iniziale con controllo"
            ],
            tips: [
                "Concentrati sulla rotazione esterna delle spalle",
                "Questo è un esercizio eccellente per la salute delle spalle",
                "Mantieni i gomiti alti durante tutto il movimento",
                "Usa un peso moderato - la forma è più importante del carico"
            ],
            commonMistakes: [
                "Non separare abbastanza le mani",
                "Tirare verso il petto invece che verso il viso",
                "Usare troppo peso perdendo la rotazione esterna",
                "Abbassare i gomiti durante il movimento"
            ],
            breathing: "Espira tirando, inspira tornando",
            muscles: {
                primary: "Deltoide posteriore, Trapezio medio, Romboidi",
                secondary: "Cuffia dei rotatori, Bicipiti"
            }
        }
    },

    // BICIPITI
    "barbell-curl": {
        execution: {
            steps: [
                "In piedi con i piedi alla larghezza delle spalle",
                "Afferra il bilanciere con presa supina alla larghezza delle spalle",
                "Braccia distese, gomiti vicini ai fianchi",
                "Curl il bilanciere verso le spalle contraendo i bicipiti",
                "Mantieni i gomiti fermi - non devono muoversi avanti",
                "Contrai i bicipiti in alto, poi abbassa controllando"
            ],
            tips: [
                "Mantieni i gomiti incollati ai fianchi",
                "Non oscillare il corpo per aiutarti",
                "Concentrati sulla contrazione del bicipite",
                "Puoi usare la barra EZ per meno stress sui polsi"
            ],
            commonMistakes: [
                "Oscillare il corpo usando momentum",
                "Portare i gomiti in avanti durante il curl",
                "Abbassare il peso troppo velocemente",
                "Non distendere completamente le braccia in basso"
            ],
            breathing: "Espira curlando verso l'alto, inspira abbassando",
            muscles: {
                primary: "Bicipite brachiale",
                secondary: "Brachiale, Brachioradiale"
            }
        }
    },
    "hammer-curl": {
        execution: {
            steps: [
                "In piedi con un manubrio per mano, palmi rivolti verso il corpo",
                "Braccia distese ai lati, gomiti vicini ai fianchi",
                "Curl i manubri mantenendo la presa neutra (pollici in alto)",
                "Solleva fino a che gli avambracci sono verticali",
                "Contrai in alto, poi abbassa controllando",
                "Puoi eseguirli alternati o simultaneamente"
            ],
            tips: [
                "La presa neutra lavora di più il brachiale e l'avambraccio",
                "Mantieni i polsi dritti e rigidi",
                "Ottimo complemento ai curl tradizionali",
                "Puoi anche eseguirli cross-body per variazione"
            ],
            commonMistakes: [
                "Ruotare i polsi durante il movimento",
                "Usare troppo peso e oscillare",
                "Non controllare la fase eccentrica",
                "Muovere i gomiti avanti durante il curl"
            ],
            breathing: "Espira salendo, inspira scendendo",
            muscles: {
                primary: "Brachiale, Bicipite brachiale",
                secondary: "Brachioradiale"
            }
        }
    },

    // TRICIPITI
    "tricep-pushdown": {
        execution: {
            steps: [
                "Afferra la barra al cavo alto con presa prona",
                "Porta i gomiti ai fianchi e mantienili fermi",
                "Parti con gli avambracci paralleli al pavimento",
                "Spingi la barra verso il basso estendendo i gomiti",
                "Contrai i tricipiti in basso con le braccia completamente estese",
                "Torna alla posizione iniziale controllando"
            ],
            tips: [
                "I gomiti devono rimanere incollati ai fianchi",
                "Concentrati sulla contrazione del tricipite",
                "Puoi variare la presa (supina, corda) per diverso stimolo",
                "Non piegare i polsi durante il movimento"
            ],
            commonMistakes: [
                "Muovere i gomiti durante l'esercizio",
                "Inclinarsi troppo in avanti usando il peso del corpo",
                "Non completare l'estensione delle braccia",
                "Usare troppo peso sacrificando la forma"
            ],
            breathing: "Espira spingendo verso il basso, inspira tornando su",
            muscles: {
                primary: "Tricipite brachiale (tutti i capi)",
                secondary: "Anconeo"
            }
        }
    },
    "skull-crusher": {
        execution: {
            steps: [
                "Sdraiati sulla panca con un bilanciere (preferibilmente EZ)",
                "Tieni il bilanciere sopra il petto con le braccia tese",
                "I gomiti dovrebbero puntare verso il soffitto",
                "Abbassa il bilanciere verso la fronte piegando solo i gomiti",
                "Fermati appena prima di toccare la fronte",
                "Estendi i gomiti tornando alla posizione iniziale"
            ],
            tips: [
                "Puoi abbassare il bilanciere dietro la testa per maggiore stretch",
                "Mantieni i gomiti fermi e vicini durante tutto il movimento",
                "Usa un peso moderato - la forma è fondamentale",
                "La barra EZ è più confortevole per i polsi"
            ],
            commonMistakes: [
                "Muovere i gomiti avanti e indietro",
                "Allargare i gomiti durante il movimento",
                "Usare troppo peso e rischiare di colpirsi la fronte",
                "Non controllare la fase eccentrica"
            ],
            breathing: "Inspira abbassando il bilanciere, espira estendendo",
            muscles: {
                primary: "Tricipite brachiale",
                secondary: "Anconeo"
            }
        }
    },

    // GAMBE - QUADRICIPITI
    "squat": {
        execution: {
            steps: [
                "Posiziona il bilanciere sulla parte alta della schiena (trapezi)",
                "I piedi dovrebbero essere alla larghezza delle spalle o leggermente più larghi",
                "Le punte dei piedi leggermente ruotate verso l'esterno (15-30°)",
                "Inspira, contrai il core e inizia a scendere",
                "Spingi le ginocchia verso l'esterno in linea con le punte dei piedi",
                "Scendi fino a che le cosce sono parallele al pavimento (o più giù se la mobilità lo permette)",
                "Spingi attraverso tutto il piede per risalire",
                "Contrai i glutei in alto e ripeti"
            ],
            tips: [
                "Mantieni il petto alto e lo sguardo avanti",
                "Le ginocchia devono seguire la direzione delle punte dei piedi",
                "Il peso dovrebbe essere distribuito su tutto il piede",
                "Mantieni la schiena neutra per tutto il movimento"
            ],
            commonMistakes: [
                "Ginocchia che collassano verso l'interno",
                "Sollevare i talloni durante la discesa",
                "Arrotondare la schiena (butt wink eccessivo)",
                "Non scendere abbastanza in profondità",
                "Piegarsi troppo in avanti"
            ],
            breathing: "Grande inspirazione prima di scendere, trattieni durante il movimento, espira in alto",
            muscles: {
                primary: "Quadricipiti, Glutei",
                secondary: "Femorali, Erettori spinali, Core"
            }
        }
    },
    "leg-press": {
        execution: {
            steps: [
                "Siediti sulla macchina con la schiena ben appoggiata",
                "Posiziona i piedi sulla piattaforma alla larghezza delle spalle",
                "Sblocca i fermi di sicurezza",
                "Abbassa la piattaforma piegando le ginocchia",
                "Scendi fino a che le ginocchia formano circa 90° o più",
                "Spingi la piattaforma verso l'alto senza bloccare le ginocchia",
                "Mantieni i piedi piatti sulla piattaforma per tutto il movimento"
            ],
            tips: [
                "Piedi più in alto sulla piattaforma = più glutei e femorali",
                "Piedi più in basso = più quadricipiti",
                "Non bloccare mai completamente le ginocchia in alto",
                "Non sollevare i glutei dal sedile durante la discesa"
            ],
            commonMistakes: [
                "Bloccare le ginocchia in estensione completa",
                "Sollevare i glutei dal sedile (pericoloso per la schiena)",
                "Scendere troppo causando arrotondamento lombare",
                "Usare un range di movimento troppo limitato"
            ],
            breathing: "Inspira scendendo, espira spingendo verso l'alto",
            muscles: {
                primary: "Quadricipiti",
                secondary: "Glutei, Femorali"
            }
        }
    },
    "leg-extension": {
        execution: {
            steps: [
                "Siediti sulla macchina con la schiena appoggiata",
                "Posiziona le caviglie dietro il cuscinetto inferiore",
                "Regola il cuscinetto posteriore per bloccare le cosce",
                "Afferra le maniglie ai lati",
                "Estendi le gambe contraendo i quadricipiti",
                "Contrai in alto per un secondo",
                "Abbassa controllando alla posizione iniziale"
            ],
            tips: [
                "Concentrati sulla contrazione dei quadricipiti",
                "Non usare momentum o slancio",
                "Puoi puntare le dita verso l'alto per maggiore contrazione",
                "Ottimo come esercizio di pre-affaticamento o finisher"
            ],
            commonMistakes: [
                "Usare troppo peso sacrificando il range di movimento",
                "Oscillare il busto per aiutarsi",
                "Non controllare la fase eccentrica",
                "Iperestendere le ginocchia in alto"
            ],
            breathing: "Espira estendendo le gambe, inspira abbassando",
            muscles: {
                primary: "Quadricipiti",
                secondary: "Nessuno (isolamento puro)"
            }
        }
    },
    "bulgarian-split-squat": {
        execution: {
            steps: [
                "Posizionati davanti a una panca con un manubrio per mano",
                "Appoggia il collo del piede posteriore sulla panca dietro di te",
                "Il piede anteriore dovrebbe essere abbastanza avanti",
                "Abbassati piegando il ginocchio anteriore",
                "Scendi fino a che la coscia anteriore è parallela al pavimento",
                "Spingi attraverso il piede anteriore per tornare su",
                "Mantieni il busto eretto durante tutto il movimento"
            ],
            tips: [
                "La maggior parte del peso deve essere sul piede anteriore",
                "Trova la distanza giusta sperimentando senza peso",
                "Ottimo per correggere squilibri tra le gambe",
                "Puoi inclinarti leggermente in avanti per più glutei"
            ],
            commonMistakes: [
                "Ginocchio anteriore che supera troppo la punta del piede",
                "Mettere troppo peso sul piede posteriore",
                "Perdere l'equilibrio e non usare il range completo",
                "Inclinarsi eccessivamente da un lato"
            ],
            breathing: "Inspira scendendo, espira salendo",
            muscles: {
                primary: "Quadricipiti, Glutei",
                secondary: "Femorali, Adduttori"
            }
        }
    },

    // GAMBE - FEMORALI
    "romanian-deadlift": {
        execution: {
            steps: [
                "In piedi con il bilanciere davanti alle cosce, presa alla larghezza delle spalle",
                "Piedi alla larghezza delle anche, ginocchia leggermente flesse",
                "Mantieni la schiena dritta e il petto in fuori",
                "Spingi i fianchi all'indietro abbassando il bilanciere lungo le gambe",
                "Scendi fino a sentire un buon stretch nei femorali",
                "Mantieni il bilanciere vicino alle gambe per tutto il movimento",
                "Spingi i fianchi in avanti per tornare in posizione eretta"
            ],
            tips: [
                "La flessione delle ginocchia deve rimanere costante",
                "Immagina di spingere i glutei verso il muro dietro di te",
                "Non arrotondare MAI la schiena",
                "Scendi quanto la tua flessibilità permette mantenendo la schiena dritta"
            ],
            commonMistakes: [
                "Piegare troppo le ginocchia (diventa uno squat)",
                "Arrotondare la schiena",
                "Tenere il bilanciere lontano dalle gambe",
                "Non sentire lo stretch nei femorali"
            ],
            breathing: "Inspira scendendo, espira salendo",
            muscles: {
                primary: "Femorali, Glutei",
                secondary: "Erettori spinali"
            }
        }
    },
    "leg-curl-lying": {
        execution: {
            steps: [
                "Sdraiati a pancia in giù sulla macchina",
                "Posiziona le caviglie sotto il cuscinetto",
                "Afferra le maniglie per stabilità",
                "Curla le gambe portando i talloni verso i glutei",
                "Contrai i femorali in posizione finale",
                "Abbassa controllando alla posizione iniziale"
            ],
            tips: [
                "Non sollevare i fianchi dalla panca",
                "Concentrati sulla contrazione dei femorali",
                "Mantieni le anche premute sulla panca",
                "Puoi puntare le dita per diversa attivazione"
            ],
            commonMistakes: [
                "Sollevare i fianchi durante il movimento",
                "Usare troppo momentum",
                "Non completare il range di movimento",
                "Estendere il collo guardando in alto"
            ],
            breathing: "Espira curlando, inspira estendendo",
            muscles: {
                primary: "Femorali",
                secondary: "Gastrocnemio"
            }
        }
    },

    // GLUTEI
    "hip-thrust": {
        execution: {
            steps: [
                "Siediti a terra con la parte alta della schiena contro una panca",
                "Posiziona il bilanciere sui fianchi (usa un pad per comfort)",
                "I piedi dovrebbero essere a terra, ginocchia piegate a 90°",
                "Spingi attraverso i talloni e solleva i fianchi",
                "Contrai forte i glutei in alto formando una linea retta dalle spalle alle ginocchia",
                "Abbassa controllando i fianchi verso il pavimento"
            ],
            tips: [
                "Il mento dovrebbe rimanere abbassato verso il petto",
                "Non iperestendere la schiena - fermati quando il corpo è in linea",
                "Spingi attraverso i talloni, non le punte dei piedi",
                "Contrai i glutei al massimo in alto per 1-2 secondi"
            ],
            commonMistakes: [
                "Iperestendere la schiena invece di fermarsi in linea",
                "Non contrarre abbastanza i glutei in alto",
                "Posizione dei piedi troppo avanti o troppo indietro",
                "Guardare verso l'alto durante il movimento"
            ],
            breathing: "Espira spingendo verso l'alto, inspira abbassando",
            muscles: {
                primary: "Grande gluteo",
                secondary: "Femorali, Quadricipiti"
            }
        }
    },
    "glute-bridge": {
        execution: {
            steps: [
                "Sdraiati supino con le ginocchia piegate e i piedi a terra",
                "I piedi dovrebbero essere vicini ai glutei",
                "Braccia ai lati per stabilità",
                "Spingi attraverso i talloni e solleva i fianchi",
                "Contrai i glutei in alto formando una linea retta",
                "Abbassa controllando i fianchi quasi a terra e ripeti"
            ],
            tips: [
                "Ottimo esercizio per attivare i glutei prima di altri esercizi",
                "Puoi aggiungere peso posizionando un manubrio sui fianchi",
                "Spingi attraverso i talloni per massima attivazione glutei",
                "Mantieni l'addome contratto per proteggere la schiena"
            ],
            commonMistakes: [
                "Iperestendere la schiena",
                "Non contrarre i glutei in alto",
                "Spingere attraverso le punte dei piedi",
                "Piedi troppo lontani dai glutei"
            ],
            breathing: "Espira sollevando i fianchi, inspira abbassando",
            muscles: {
                primary: "Grande gluteo",
                secondary: "Femorali"
            }
        }
    },

    // POLPACCI
    "standing-calf-raise": {
        execution: {
            steps: [
                "Posizionati sulla macchina con le spalle sotto i cuscinetti",
                "Punte dei piedi sul bordo della piattaforma, talloni nel vuoto",
                "Abbassa i talloni sotto il livello della piattaforma per stretch",
                "Sollèvati sulle punte contraendo i polpacci",
                "Mantieni la contrazione in alto per un secondo",
                "Abbassa controllando fino a stretch completo"
            ],
            tips: [
                "Mantieni le ginocchia quasi completamente estese",
                "Range di movimento completo è fondamentale per i polpacci",
                "Usa un tempo lento e controllato",
                "Varia la posizione delle punte dei piedi per diverso stimolo"
            ],
            commonMistakes: [
                "Piegare le ginocchia durante il movimento",
                "Non usare il range di movimento completo",
                "Rimbalzare in basso",
                "Usare troppo peso e non controllare il movimento"
            ],
            breathing: "Espira sollevandoti, inspira abbassandoti",
            muscles: {
                primary: "Gastrocnemio",
                secondary: "Soleo"
            }
        }
    },
    "seated-calf-raise": {
        execution: {
            steps: [
                "Siediti alla macchina con le ginocchia sotto i cuscinetti",
                "Punte dei piedi sul bordo della piattaforma",
                "Abbassa i talloni per stretch completo",
                "Solleva i talloni contraendo i polpacci",
                "Mantieni la contrazione in alto",
                "Abbassa controllando alla posizione di stretch"
            ],
            tips: [
                "Con le ginocchia piegate, lavora di più il soleo",
                "Il soleo è importante per la massa totale del polpaccio",
                "Mantieni un tempo controllato",
                "Combina con calf raise in piedi per sviluppo completo"
            ],
            commonMistakes: [
                "Non completare il range di movimento",
                "Muovere troppo velocemente",
                "Non mantenere la contrazione in alto"
            ],
            breathing: "Espira sollevando, inspira abbassando",
            muscles: {
                primary: "Soleo",
                secondary: "Gastrocnemio"
            }
        }
    },

    // ADDOME
    "plank": {
        execution: {
            steps: [
                "Posizionati a terra sugli avambracci e le punte dei piedi",
                "Gomiti direttamente sotto le spalle",
                "Mantieni il corpo in linea retta dalla testa ai talloni",
                "Contrai addome e glutei",
                "Mantieni la posizione per il tempo desiderato",
                "Non lasciare cadere i fianchi né sollevarli troppo"
            ],
            tips: [
                "Immagina di tirare i gomiti verso le punte dei piedi (senza muoverti)",
                "Respira normalmente durante il mantenimento",
                "Guarda leggermente avanti, non verso il basso",
                "Inizia con tempi brevi e aumenta gradualmente"
            ],
            commonMistakes: [
                "Far cadere i fianchi verso il pavimento",
                "Sollevare i glutei troppo in alto",
                "Trattenere il respiro",
                "Guardare troppo in alto o in basso"
            ],
            breathing: "Respira normalmente e costantemente durante l'esercizio",
            muscles: {
                primary: "Retto addominale, Trasverso",
                secondary: "Obliqui, Spalle, Glutei"
            }
        }
    },
    "crunch": {
        execution: {
            steps: [
                "Sdraiati supino con le ginocchia piegate e i piedi a terra",
                "Mani dietro la testa o incrociate sul petto",
                "Solleva le spalle da terra contraendo gli addominali",
                "Concentrati sul portare le costole verso il bacino",
                "Non è necessario sollevarsi completamente - bastano pochi centimetri",
                "Abbassa controllando alla posizione iniziale"
            ],
            tips: [
                "Non tirare la testa con le mani",
                "Concentrati sulla contrazione addominale",
                "Mantieni la zona lombare a terra",
                "Espira forte durante la contrazione"
            ],
            commonMistakes: [
                "Tirare la testa/collo con le mani",
                "Usare momentum invece della contrazione",
                "Sollevare la zona lombare da terra",
                "Non controllare la fase eccentrica"
            ],
            breathing: "Espira durante la contrazione, inspira abbassandoti",
            muscles: {
                primary: "Retto addominale",
                secondary: "Obliqui"
            }
        }
    },
    "hanging-leg-raise": {
        execution: {
            steps: [
                "Appenditi alla sbarra con presa prona",
                "Braccia completamente distese, corpo in linea",
                "Solleva le gambe dritte fino a parallelo o oltre",
                "Se troppo difficile, solleva le ginocchia al petto",
                "Abbassa controllando senza oscillare",
                "Mantieni il corpo stabile durante tutto il movimento"
            ],
            tips: [
                "Evita di oscillare usando momentum",
                "Puoi usare le cinghie per aiutare la presa",
                "Versione più facile: ginocchia piegate",
                "Versione più difficile: tocca la sbarra con i piedi"
            ],
            commonMistakes: [
                "Oscillare il corpo per slancio",
                "Non controllare la discesa",
                "Piegare i gomiti durante il movimento",
                "Non coinvolgere correttamente gli addominali"
            ],
            breathing: "Espira sollevando le gambe, inspira abbassando",
            muscles: {
                primary: "Retto addominale, Flessori dell'anca",
                secondary: "Obliqui, Avambracci (presa)"
            }
        }
    },
    "russian-twist": {
        execution: {
            steps: [
                "Siediti a terra con le ginocchia piegate",
                "Inclina leggermente il busto all'indietro mantenendo la schiena dritta",
                "Solleva i piedi da terra per più difficoltà (opzionale)",
                "Con le mani unite o con un peso, ruota il busto a destra",
                "Tocca il pavimento accanto all'anca",
                "Ruota verso sinistra e ripeti alternando"
            ],
            tips: [
                "La rotazione deve venire dal core, non dalle braccia",
                "Mantieni il petto in fuori",
                "Puoi tenere i piedi a terra per versione più facile",
                "Aggiungi peso per maggiore intensità"
            ],
            commonMistakes: [
                "Muovere solo le braccia senza ruotare il busto",
                "Arrotondare la schiena",
                "Muoversi troppo velocemente",
                "Non controllare il movimento"
            ],
            breathing: "Espira ad ogni rotazione",
            muscles: {
                primary: "Obliqui",
                secondary: "Retto addominale"
            }
        }
    }
};

// Detailed info for warmup exercises
const WARMUP_DETAILS = {
    "Arm Circles": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/07/Arm-Circles_Shoulders.gif",
        svgAnimation: "arm-circles",
        execution: {
            steps: [
                "In piedi con le braccia distese ai lati",
                "Inizia con piccoli cerchi in avanti",
                "Gradualmente aumenta il diametro dei cerchi",
                "Dopo 15 secondi, inverti la direzione"
            ],
            tips: [
                "Mantieni le braccia tese ma non rigide",
                "Aumenta gradualmente la dimensione dei cerchi",
                "Ottimo per scaldare la cuffia dei rotatori"
            ]
        }
    },
    "Shoulder Rolls": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/04/Dumbbell-Shrug.gif",
        svgAnimation: "shoulder-rolls",
        execution: {
            steps: [
                "In piedi con le braccia rilassate ai lati",
                "Solleva le spalle verso le orecchie",
                "Ruota le spalle all'indietro e poi in basso",
                "Ripeti in senso inverso"
            ],
            tips: [
                "Movimento fluido e controllato",
                "Non forzare l'ampiezza del movimento"
            ]
        }
    },
    "Band Pull-Apart": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/06/Band-pull-apart.gif",
        execution: {
            steps: [
                "Tieni l'elastico con entrambe le mani davanti a te",
                "Braccia distese all'altezza delle spalle",
                "Tira l'elastico separando le mani",
                "Contrai le scapole insieme",
                "Torna controllando alla posizione iniziale"
            ],
            tips: [
                "Ottimo per attivare i muscoli della parte alta della schiena",
                "Mantieni le braccia dritte durante il movimento",
                "Usa un elastico con resistenza leggera"
            ]
        }
    },
    "Wall Slides": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/02/wall-slide.gif",
        svgAnimation: "wall-slides",
        execution: {
            steps: [
                "Stai con la schiena contro il muro",
                "Piedi a circa 30cm dal muro",
                "Braccia contro il muro, gomiti a 90°",
                "Scorri le braccia verso l'alto mantenendo contatto col muro",
                "Torna alla posizione iniziale"
            ],
            tips: [
                "Mantieni la zona lombare contro il muro",
                "Se non riesci a mantenere il contatto, allontanati di più"
            ]
        }
    },
    "Cat-Cow": {
        gifUrl: "https://gymvisual.com/img/p/2/1/7/8/4/21784.gif",
        execution: {
            steps: [
                "A quattro zampe, mani sotto le spalle, ginocchia sotto le anche",
                "Inspira: lascia cadere la pancia, solleva la testa e il bacino (Cow)",
                "Espira: arrotonda la schiena, porta il mento al petto (Cat)",
                "Alterna fluidamente tra le due posizioni"
            ],
            tips: [
                "Movimento lento e controllato",
                "Ottimo per la mobilità della colonna vertebrale",
                "Coordina il movimento con il respiro"
            ]
        }
    },
    "Leg Swings Frontali": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Leg-Swings.gif",
        svgAnimation: "leg-swings",
        execution: {
            steps: [
                "In piedi accanto a un supporto per equilibrio",
                "Oscilla una gamba avanti e indietro",
                "Mantieni la gamba relativamente dritta",
                "Aumenta gradualmente l'ampiezza dell'oscillazione"
            ],
            tips: [
                "Non forzare l'ampiezza oltre il tuo range naturale",
                "Mantieni il busto eretto",
                "Ottimo per femorali e flessori dell'anca"
            ]
        }
    },
    "Leg Swings Laterali": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/06/Side-to-Side-Leg-Swings.gif",
        svgAnimation: "leg-swings-lateral",
        execution: {
            steps: [
                "In piedi frontalmente rispetto a un supporto",
                "Oscilla una gamba lateralmente attraverso il corpo",
                "Mantieni il busto stabile",
                "Aumenta gradualmente l'ampiezza"
            ],
            tips: [
                "Ottimo per adduttori e abduttori",
                "Non ruotare il busto durante l'oscillazione"
            ]
        }
    },
    "Hip Circles": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Hip-Circles.gif",
        svgAnimation: "hip-circles",
        execution: {
            steps: [
                "In piedi su una gamba, solleva il ginocchio",
                "Ruota la gamba formando cerchi con il ginocchio",
                "Fai cerchi in entrambe le direzioni",
                "Ripeti sull'altra gamba"
            ],
            tips: [
                "Tieniti a un supporto se necessario per l'equilibrio",
                "Movimento controllato, non usare slancio"
            ]
        }
    },
    "Bodyweight Squats": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/05/bodyweight-squat-full-version.gif",
        execution: {
            steps: [
                "In piedi, piedi alla larghezza delle spalle",
                "Scendi in squat spingendo i fianchi indietro",
                "Mantieni il petto alto e le ginocchia in linea con le punte",
                "Scendi fino a parallelo e risali"
            ],
            tips: [
                "Ottimo per attivare quadricipiti e glutei",
                "Usa una profondità che ti permetta di mantenere buona forma"
            ]
        }
    },
    "Walking Lunges": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2023/09/dumbbell-lunges.gif",
        execution: {
            steps: [
                "In piedi, fai un passo avanti lungo",
                "Abbassati fino a 90° con entrambe le ginocchia",
                "Spingi con la gamba anteriore e porta avanti la gamba posteriore",
                "Continua camminando in affondo"
            ],
            tips: [
                "Mantieni il busto eretto",
                "Non far sbattere il ginocchio posteriore a terra"
            ]
        }
    },
    "Glute Bridges": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Glute-Bridge-.gif",
        execution: {
            steps: [
                "Sdraiato supino, ginocchia piegate, piedi a terra",
                "Spingi attraverso i talloni e solleva i fianchi",
                "Contrai i glutei in alto",
                "Abbassa controllando e ripeti"
            ],
            tips: [
                "Ottimo per attivare i glutei prima di esercizi pesanti",
                "Non iperestendere la schiena"
            ]
        }
    },
    "Inchworms": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Inchworm.gif",
        execution: {
            steps: [
                "In piedi, piegati in avanti e tocca il pavimento",
                "Cammina con le mani in avanti fino a posizione di plank",
                "Fai una pausa, poi cammina con i piedi verso le mani",
                "Alzati e ripeti"
            ],
            tips: [
                "Ottimo per stretch femorali e attivazione core",
                "Mantieni le gambe più dritte possibile"
            ]
        }
    },
    "World's Greatest Stretch": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/05/Worlds-Greatest-Stretch.gif",
        svgAnimation: "worlds-greatest-stretch",
        execution: {
            steps: [
                "Parti in posizione di affondo profondo",
                "Porta il gomito verso il pavimento accanto al piede anteriore",
                "Ruota aprendo il braccio verso il soffitto",
                "Torna alla posizione iniziale e ripeti dall'altro lato"
            ],
            tips: [
                "Movimento completo che apre anche, colonna e spalle",
                "Prenditi il tempo necessario per ogni posizione"
            ]
        }
    },
    "Dead Bug": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/05/Dead-Bug.gif",
        execution: {
            steps: [
                "Sdraiato supino, braccia verso il soffitto, ginocchia a 90°",
                "Estendi contemporaneamente braccio destro e gamba sinistra",
                "Mantieni la zona lombare a terra",
                "Torna e ripeti dall'altro lato"
            ],
            tips: [
                "Eccellente per attivare il core profondo",
                "La schiena deve rimanere completamente a terra"
            ]
        }
    },
    "Bird Dog": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Bird-Dog.gif",
        execution: {
            steps: [
                "A quattro zampe, core attivato",
                "Estendi il braccio destro e la gamba sinistra simultaneamente",
                "Mantieni per 2-3 secondi",
                "Torna e ripeti dall'altro lato"
            ],
            tips: [
                "Mantieni la schiena piatta e stabile",
                "Non ruotare il bacino durante l'estensione"
            ]
        }
    },
    "Plank Hold": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/02/plank.gif",
        execution: {
            steps: [
                "Sugli avambracci, corpo in linea retta",
                "Contrai addome e glutei",
                "Mantieni la posizione per il tempo indicato",
                "Respira normalmente"
            ],
            tips: [
                "Non lasciare cadere i fianchi",
                "Guarda leggermente avanti"
            ]
        }
    },
    "Jumping Jacks": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/05/Jumping-jack.gif",
        execution: {
            steps: [
                "In piedi con le braccia ai lati",
                "Salta allargando le gambe e portando le braccia sopra la testa",
                "Salta tornando alla posizione iniziale",
                "Ripeti a ritmo costante"
            ],
            tips: [
                "Ottimo per alzare la frequenza cardiaca",
                "Atterra morbido sulle punte dei piedi"
            ]
        }
    },
    "Mountain Climbers": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Mountain-Climber.gif",
        execution: {
            steps: [
                "In posizione di plank alto",
                "Porta un ginocchio verso il petto",
                "Torna e porta l'altro ginocchio",
                "Alterna rapidamente"
            ],
            tips: [
                "Mantieni i fianchi bassi e stabili",
                "Ottimo per core e cardio"
            ]
        }
    },
    "High Knees": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/06/High-Knee-Run.gif",
        execution: {
            steps: [
                "Corri sul posto sollevando le ginocchia alte",
                "Le ginocchia devono arrivare almeno all'altezza dei fianchi",
                "Pompa le braccia in coordinazione",
                "Mantieni un ritmo costante"
            ],
            tips: [
                "Atterra sulle punte dei piedi",
                "Ottimo per attivazione cardiovascolare"
            ]
        }
    },
    "Push-Up Plus": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/06/Push-Up-Plus.gif",
        execution: {
            steps: [
                "Posizionati in plank alto, mani sotto le spalle",
                "Esegui un push-up standard",
                "In alto, spingi ulteriormente separando le scapole",
                "La parte alta della schiena si arrotonda leggermente",
                "Torna alla posizione iniziale e ripeti"
            ],
            tips: [
                "Enfatizza la protrazione scapolare in alto",
                "Mantieni il core attivo durante tutto il movimento",
                "Ottimo per attivare il dentato anteriore"
            ]
        }
    },
    "Scapular Push-Ups": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/06/Push-Up-Plus.gif",
        execution: {
            steps: [
                "In posizione di plank alto, braccia tese",
                "Senza piegare i gomiti, abbassa il petto",
                "Lascia che le scapole si avvicinino",
                "Spingi attivamente separando le scapole",
                "Movimento solo delle scapole, braccia sempre tese"
            ],
            tips: [
                "Movimento piccolo ma controllato",
                "Concentrati sul movimento delle scapole",
                "Ottimo per la stabilità delle spalle"
            ]
        }
    },
    "Cat-Cow Stretch": {
        gifUrl: "https://gymvisual.com/img/p/2/1/7/8/4/21784.gif",
        execution: {
            steps: [
                "A quattro zampe, mani sotto le spalle, ginocchia sotto le anche",
                "Inspira: lascia cadere la pancia, solleva la testa e il bacino (Cow)",
                "Espira: arrotonda la schiena, porta il mento al petto (Cat)",
                "Alterna fluidamente tra le due posizioni"
            ],
            tips: [
                "Movimento lento e controllato",
                "Ottimo per la mobilità della colonna vertebrale",
                "Coordina il movimento con il respiro"
            ]
        }
    },
    "Thoracic Rotations": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2022/08/Kneeling-T-spine-Rotation.gif",
        execution: {
            steps: [
                "A quattro zampe, una mano dietro la testa",
                "Ruota il busto portando il gomito verso l'alto",
                "Apri il petto verso il soffitto",
                "Torna controllando e ripeti",
                "Cambia lato dopo le ripetizioni indicate"
            ],
            tips: [
                "Movimento lento e controllato",
                "Mantieni i fianchi stabili",
                "Ottimo per la mobilità toracica"
            ]
        }
    },
    "Dynamic Chest Stretch": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/06/Dynamic-Chest-Stretch.gif",
        execution: {
            steps: [
                "In piedi, braccia distese ai lati",
                "Porta le braccia indietro aprendo il petto",
                "Movimento dinamico, non statico",
                "Alterna apertura e chiusura delle braccia"
            ],
            tips: [
                "Non forzare l'ampiezza",
                "Movimento fluido e controllato"
            ]
        }
    },
    "Incline Push-Up": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/06/Incline-Push-Up.gif",
        execution: {
            steps: [
                "Mani su una superficie rialzata (panca, muro)",
                "Corpo in linea retta dalla testa ai piedi",
                "Abbassati piegando i gomiti",
                "Spingi tornando alla posizione iniziale"
            ],
            tips: [
                "Ottimo per riscaldare petto e tricipiti",
                "Più facile del push-up standard"
            ]
        }
    },
    "Scapular Retraction": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2022/02/Scapular-Retraction.gif",
        execution: {
            steps: [
                "In piedi con buona postura",
                "Stringi le scapole insieme",
                "Mantieni per 2-3 secondi",
                "Rilascia e ripeti"
            ],
            tips: [
                "Non alzare le spalle",
                "Concentrati sul movimento delle scapole"
            ]
        }
    },
    "Arm Swings Orizzontali": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Arm-Crossover.gif",
        execution: {
            steps: [
                "In piedi, braccia distese ai lati",
                "Oscilla le braccia incrociandole davanti al petto",
                "Alterna quale braccio passa sopra",
                "Movimento dinamico e continuo"
            ],
            tips: [
                "Mantieni le braccia all'altezza delle spalle",
                "Ottimo per riscaldare petto e spalle"
            ]
        }
    }
};

// Detailed info for cooldown/stretching exercises
const COOLDOWN_DETAILS = {
    "Chest Doorway Stretch": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/04/Doorway-Stretch.gif",
        svgAnimation: "doorway-stretch",
        execution: {
            steps: [
                "Posizionati in uno stipite della porta",
                "Appoggia l'avambraccio contro lo stipite, gomito a 90°",
                "Fai un passo avanti con il piede dello stesso lato",
                "Ruota il corpo allontanandoti dallo stipite",
                "Senti lo stretch nel petto e nella spalla anteriore"
            ],
            tips: [
                "Varia l'altezza del braccio per colpire diverse aree del petto",
                "Mantieni la posizione per almeno 30 secondi",
                "Non forzare oltre un leggero fastidio"
            ]
        }
    },
    "Cross-Body Shoulder Stretch": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/04/Across-Chest-Shoulder-Stretch.gif",
        svgAnimation: "cross-body-stretch",
        execution: {
            steps: [
                "Porta un braccio attraverso il petto",
                "Con l'altra mano, tira il braccio verso di te",
                "Mantieni la spalla rilassata, non alzarla",
                "Senti lo stretch nel deltoide posteriore"
            ],
            tips: [
                "Non ruotare il busto",
                "Mantieni il braccio stirato dritto"
            ]
        }
    },
    "Tricep Stretch": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2022/02/Triceps-Stretch.gif",
        svgAnimation: "tricep-stretch",
        execution: {
            steps: [
                "Porta un braccio sopra la testa",
                "Piega il gomito portando la mano dietro la nuca",
                "Con l'altra mano, spingi il gomito verso il basso",
                "Senti lo stretch nel tricipite"
            ],
            tips: [
                "Mantieni il busto eretto",
                "Non forzare il gomito troppo indietro"
            ]
        }
    },
    "Child's Pose": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2022/02/Childs-Pose.gif",
        execution: {
            steps: [
                "In ginocchio, seduto sui talloni",
                "Inclina il busto in avanti allungando le braccia",
                "Appoggia la fronte a terra",
                "Rilassa completamente schiena e spalle"
            ],
            tips: [
                "Respira profondamente nella posizione",
                "Ottimo per rilassare la schiena dopo l'allenamento"
            ]
        }
    },
    "Standing Quad Stretch": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/08/Standing-Quadriceps-Stretch.gif",
        svgAnimation: "quad-stretch",
        execution: {
            steps: [
                "In piedi, afferra la caviglia di una gamba",
                "Tira il tallone verso il gluteo",
                "Mantieni le ginocchia vicine",
                "Spingi il fianco in avanti per maggiore stretch"
            ],
            tips: [
                "Tieniti a un supporto se necessario",
                "Non arcuare la schiena"
            ]
        }
    },
    "Standing Hamstring Stretch": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/05/Standing-Hamstring-Stretch.gif",
        svgAnimation: "hamstring-stretch",
        execution: {
            steps: [
                "Posiziona un piede su un rialzo (panca, gradino)",
                "Mantieni la gamba dritta",
                "Inclina il busto in avanti dalla vita",
                "Senti lo stretch nel femorale"
            ],
            tips: [
                "Mantieni la schiena dritta, non arrotondarla",
                "Non rimbalzare, mantieni la posizione statica"
            ]
        }
    },
    "Hip Flexor Stretch (Lunge)": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/08/Kneeling-Hip-Flexor-Stretch.gif",
        svgAnimation: "hip-flexor-stretch",
        execution: {
            steps: [
                "Posizionati in affondo, ginocchio posteriore a terra",
                "Il ginocchio anteriore a 90°, sopra la caviglia",
                "Spingi il bacino in avanti e in basso",
                "Senti lo stretch nel flessore dell'anca posteriore"
            ],
            tips: [
                "Contrai il gluteo della gamba posteriore",
                "Mantieni il busto eretto"
            ]
        }
    },
    "Pigeon Pose": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Piriformis-Stretch.gif",
        svgAnimation: "pigeon-pose",
        execution: {
            steps: [
                "Dalla posizione a quattro zampe, porta una gamba piegata davanti",
                "La gamba posteriore distesa all'indietro",
                "Abbassa il busto verso il pavimento",
                "Rilassa i fianchi e respira profondamente"
            ],
            tips: [
                "Ottimo stretch per i glutei e i rotatori esterni",
                "Se troppo intenso, mantieni il busto più eretto"
            ]
        }
    },
    "Butterfly Stretch": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Butterfly-Stretch.gif",
        svgAnimation: "butterfly-stretch",
        execution: {
            steps: [
                "Seduto, unisci le piante dei piedi davanti a te",
                "Tieni i piedi con le mani",
                "Lascia cadere le ginocchia verso il pavimento",
                "Inclina il busto in avanti per maggiore stretch"
            ],
            tips: [
                "Non forzare le ginocchia verso il basso con le mani",
                "Ottimo per adduttori e interno coscia"
            ]
        }
    },
    "Seated Forward Fold": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Seated-Forward-Bend.gif",
        svgAnimation: "forward-fold",
        execution: {
            steps: [
                "Seduto con le gambe distese davanti a te",
                "Inspira e allunga la colonna",
                "Espira e piegati in avanti dalle anche",
                "Cerca di raggiungere le punte dei piedi"
            ],
            tips: [
                "Piega dalla vita, non dalle spalle",
                "Mantieni la schiena più dritta possibile"
            ]
        }
    },
    "Figure-4 Stretch": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Lying-Figure-4-Stretch.gif",
        svgAnimation: "figure-4-stretch",
        execution: {
            steps: [
                "Sdraiato supino, piedi a terra",
                "Appoggia una caviglia sulla coscia opposta",
                "Tira la coscia verso il petto",
                "Senti lo stretch nel gluteo e nel piriforme"
            ],
            tips: [
                "Mantieni la testa e le spalle a terra",
                "Ottimo per chi soffre di tensione ai glutei"
            ]
        }
    },
    "Calf Stretch": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2022/02/Standing-Wall-Calf-Stretch.gif",
        svgAnimation: "calf-stretch",
        execution: {
            steps: [
                "Posizionati di fronte a un muro",
                "Un piede avanti, uno indietro",
                "Mantieni il tallone posteriore a terra",
                "Spingi i fianchi verso il muro"
            ],
            tips: [
                "Gamba posteriore dritta per il gastrocnemio",
                "Gamba posteriore leggermente piegata per il soleo"
            ]
        }
    },
    "Lying Spinal Twist": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Lying-Spinal-Twist.gif",
        svgAnimation: "spinal-twist",
        execution: {
            steps: [
                "Sdraiato supino, braccia aperte a T",
                "Porta le ginocchia piegate da un lato",
                "Mantieni le spalle a terra",
                "Gira la testa dalla parte opposta"
            ],
            tips: [
                "Rilassa completamente nella posizione",
                "Ottimo per la mobilità spinale e gli obliqui"
            ]
        }
    },
    "Cobra Stretch": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/06/abdominal-stretch.gif",
        execution: {
            steps: [
                "Sdraiato a pancia in giù, mani sotto le spalle",
                "Solleva il petto da terra estendendo le braccia",
                "Mantieni le anche a terra",
                "Guarda in avanti o leggermente in alto"
            ],
            tips: [
                "Non forzare l'estensione se causa dolore",
                "Ottimo per contrastare la posizione seduta"
            ]
        }
    },
    "Deep Breathing": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/06/Diaphragmatic-Breathing.gif",
        svgAnimation: "breathing",
        execution: {
            steps: [
                "Siediti o sdraiati in posizione comoda",
                "Inspira profondamente attraverso il naso per 4 secondi",
                "Trattieni per 4 secondi",
                "Espira lentamente attraverso la bocca per 6 secondi",
                "Ripeti per il tempo indicato"
            ],
            tips: [
                "Concentrati sulla respirazione diaframmatica",
                "Rilassa le spalle e il viso",
                "Aiuta ad attivare il sistema nervoso parasimpatico"
            ]
        }
    }
};

// SVG Animation templates for exercises without GIF
const SVG_ANIMATIONS = {
    "arm-circles": `<svg viewBox="0 0 200 200" class="exercise-svg-animation">
        <circle cx="100" cy="100" r="80" fill="none" stroke="#4361ee" stroke-width="2" stroke-dasharray="5,5"/>
        <circle cx="100" cy="20" r="10" fill="#4361ee">
            <animateMotion dur="2s" repeatCount="indefinite">
                <mpath href="#circlePath"/>
            </animateMotion>
        </circle>
        <path id="circlePath" d="M 100,20 A 80,80 0 1,1 99.9,20" fill="none"/>
        <circle cx="100" cy="100" r="5" fill="#7209b7"/>
        <line x1="100" y1="100" x2="100" y2="50" stroke="#7209b7" stroke-width="3">
            <animateTransform attributeName="transform" type="rotate" from="0 100 100" to="360 100 100" dur="2s" repeatCount="indefinite"/>
        </line>
    </svg>`,

    "shoulder-rolls": `<svg viewBox="0 0 200 200" class="exercise-svg-animation">
        <ellipse cx="100" cy="100" rx="30" ry="20" fill="none" stroke="#4361ee" stroke-width="2"/>
        <circle cx="130" cy="100" r="8" fill="#4361ee">
            <animateMotion dur="2s" repeatCount="indefinite" path="M 30,0 A 30,20 0 1,1 29.9,0"/>
        </circle>
        <rect x="70" y="120" width="60" height="60" rx="10" fill="#1a1a2e" stroke="#7209b7" stroke-width="2"/>
        <circle cx="70" cy="100" r="15" fill="#16213e" stroke="#7209b7" stroke-width="2">
            <animate attributeName="cy" values="100;90;100;110;100" dur="2s" repeatCount="indefinite"/>
        </circle>
        <circle cx="130" cy="100" r="15" fill="#16213e" stroke="#7209b7" stroke-width="2">
            <animate attributeName="cy" values="100;90;100;110;100" dur="2s" repeatCount="indefinite"/>
        </circle>
    </svg>`,

    "wall-slides": `<svg viewBox="0 0 200 200" class="exercise-svg-animation">
        <rect x="160" y="20" width="10" height="160" fill="#4361ee" rx="2"/>
        <rect x="80" y="60" width="80" height="120" rx="10" fill="#16213e" stroke="#7209b7" stroke-width="2"/>
        <circle cx="100" cy="45" r="20" fill="#1a1a2e" stroke="#7209b7" stroke-width="2"/>
        <line x1="85" y1="80" x2="85" y2="120" stroke="#7209b7" stroke-width="3">
            <animate attributeName="y2" values="120;60;120" dur="2s" repeatCount="indefinite"/>
        </line>
        <line x1="115" y1="80" x2="115" y2="120" stroke="#7209b7" stroke-width="3">
            <animate attributeName="y2" values="120;60;120" dur="2s" repeatCount="indefinite"/>
        </line>
    </svg>`,

    "leg-swings": `<svg viewBox="0 0 200 200" class="exercise-svg-animation">
        <rect x="95" y="50" width="10" height="60" fill="#16213e" stroke="#7209b7" stroke-width="2"/>
        <circle cx="100" cy="40" r="20" fill="#1a1a2e" stroke="#7209b7" stroke-width="2"/>
        <line x1="100" y1="110" x2="100" y2="170" stroke="#4361ee" stroke-width="4" stroke-linecap="round">
            <animateTransform attributeName="transform" type="rotate" values="-30 100 110;30 100 110;-30 100 110" dur="1.5s" repeatCount="indefinite"/>
        </line>
        <line x1="100" y1="110" x2="100" y2="170" stroke="#7209b7" stroke-width="4" stroke-linecap="round"/>
    </svg>`,

    "hip-circles": `<svg viewBox="0 0 200 200" class="exercise-svg-animation">
        <rect x="85" y="50" width="30" height="50" rx="5" fill="#16213e" stroke="#7209b7" stroke-width="2"/>
        <circle cx="100" cy="40" r="18" fill="#1a1a2e" stroke="#7209b7" stroke-width="2"/>
        <ellipse cx="100" cy="130" rx="25" ry="15" fill="none" stroke="#4361ee" stroke-width="2" stroke-dasharray="5,5"/>
        <g>
            <line x1="100" y1="100" x2="100" y2="160" stroke="#7209b7" stroke-width="4" stroke-linecap="round"/>
            <circle cx="100" cy="115" r="8" fill="#4361ee">
                <animateMotion dur="2s" repeatCount="indefinite" path="M 0,15 A 25,15 0 1,1 -0.1,15"/>
            </circle>
        </g>
        <line x1="100" y1="100" x2="100" y2="170" stroke="#7209b7" stroke-width="4" stroke-linecap="round"/>
    </svg>`,

    "breathing": `<svg viewBox="0 0 200 200" class="exercise-svg-animation">
        <circle cx="100" cy="100" r="60" fill="#16213e" stroke="#4361ee" stroke-width="3">
            <animate attributeName="r" values="40;70;40" dur="4s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.5;1;0.5" dur="4s" repeatCount="indefinite"/>
        </circle>
        <text x="100" y="90" text-anchor="middle" fill="#fff" font-size="12">
            <animate attributeName="opacity" values="1;0;0;0;1" dur="4s" repeatCount="indefinite"/>
            INSPIRA
        </text>
        <text x="100" y="110" text-anchor="middle" fill="#fff" font-size="12">
            <animate attributeName="opacity" values="0;0;1;0;0" dur="4s" repeatCount="indefinite"/>
            TRATTIENI
        </text>
        <text x="100" y="110" text-anchor="middle" fill="#fff" font-size="12">
            <animate attributeName="opacity" values="0;0;0;1;0" dur="4s" repeatCount="indefinite"/>
            ESPIRA
        </text>
    </svg>`,

    "default": `<svg viewBox="0 0 200 200" class="exercise-svg-animation">
        <circle cx="100" cy="50" r="25" fill="#1a1a2e" stroke="#7209b7" stroke-width="2"/>
        <rect x="75" y="75" width="50" height="60" rx="5" fill="#16213e" stroke="#7209b7" stroke-width="2"/>
        <line x1="75" y1="90" x2="40" y2="110" stroke="#4361ee" stroke-width="3" stroke-linecap="round">
            <animate attributeName="x2" values="40;30;40" dur="1s" repeatCount="indefinite"/>
        </line>
        <line x1="125" y1="90" x2="160" y2="110" stroke="#4361ee" stroke-width="3" stroke-linecap="round">
            <animate attributeName="x2" values="160;170;160" dur="1s" repeatCount="indefinite"/>
        </line>
        <line x1="85" y1="135" x2="85" y2="180" stroke="#7209b7" stroke-width="3" stroke-linecap="round"/>
        <line x1="115" y1="135" x2="115" y2="180" stroke="#7209b7" stroke-width="3" stroke-linecap="round"/>
    </svg>`
};

/**
 * Get GIF URL for an exercise
 * @param {string} exerciseId - The exercise ID
 * @returns {string|null} - The GIF URL or null if not found
 */
function getExerciseGif(exerciseId) {
    return EXERCISE_GIF_MAP[exerciseId] || null;
}

/**
 * Get detailed execution info for an exercise
 * @param {string} exerciseId - The exercise ID
 * @returns {Object|null} - The detailed execution info or null
 */
function getExerciseDetails(exerciseId) {
    return EXERCISE_DETAILS[exerciseId] || null;
}

/**
 * Get warmup exercise details
 * @param {string} exerciseName - The warmup exercise name
 * @returns {Object|null} - The warmup details or null
 */
function getWarmupDetails(exerciseName) {
    return WARMUP_DETAILS[exerciseName] || null;
}

/**
 * Get cooldown exercise details
 * @param {string} exerciseName - The cooldown exercise name
 * @returns {Object|null} - The cooldown details or null
 */
function getCooldownDetails(exerciseName) {
    return COOLDOWN_DETAILS[exerciseName] || null;
}

/**
 * Get SVG animation for an exercise
 * @param {string} animationName - The animation name
 * @returns {string} - The SVG markup
 */
function getSvgAnimation(animationName) {
    return SVG_ANIMATIONS[animationName] || SVG_ANIMATIONS["default"];
}

/**
 * Get complete exercise info (GIF + details) for modal display
 * @param {string} exerciseId - The exercise ID
 * @param {string} exerciseName - The exercise name (for fallback)
 * @param {string} type - Type of exercise: 'workout', 'warmup', 'cooldown'
 * @returns {Object} - Complete exercise info for modal
 */
function getExerciseMediaInfo(exerciseId, exerciseName, type = 'workout') {
    let details, gifUrl, svgAnimation;

    if (type === 'warmup') {
        const warmupInfo = getWarmupDetails(exerciseName);
        details = warmupInfo?.execution || null;
        gifUrl = warmupInfo?.gifUrl || null;
        svgAnimation = warmupInfo?.svgAnimation ? getSvgAnimation(warmupInfo.svgAnimation) : null;
    } else if (type === 'cooldown') {
        const cooldownInfo = getCooldownDetails(exerciseName);
        details = cooldownInfo?.execution || null;
        gifUrl = cooldownInfo?.gifUrl || null;
        svgAnimation = cooldownInfo?.svgAnimation ? getSvgAnimation(cooldownInfo.svgAnimation) : null;
    } else {
        details = getExerciseDetails(exerciseId)?.execution || null;
        gifUrl = getExerciseGif(exerciseId);
        svgAnimation = null;
    }

    return {
        name: exerciseName,
        gifUrl: gifUrl,
        svgAnimation: svgAnimation || (gifUrl ? null : getSvgAnimation('default')),
        details: details,
        hasMedia: !!(gifUrl || svgAnimation)
    };
}
