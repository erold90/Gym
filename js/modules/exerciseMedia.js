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
    "childs-pose": "https://gymvisual.com/img/p/2/6/0/1/3/26013.gif",
    "cobra-stretch": "https://fitnessprogramer.com/wp-content/uploads/2021/06/abdominal-stretch.gif",
    "piriformis-stretch": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Piriformis-Stretch.gif",
    "butterfly-stretch": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Butterfly-Stretch.gif",
    "downward-dog": "https://gymvisual.com/img/p/5/6/6/4/5664.gif",
    "world-greatest-stretch": "https://gymvisual.com/img/p/7/0/7/1/7071.gif",
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
    },

    // ==========================================
    // PETTO - Esercizi aggiuntivi
    // ==========================================
    "decline-bench-press": {
        execution: {
            steps: [
                "Imposta la panca in declinazione e blocca i piedi",
                "Afferra il bilanciere con presa leggermente più larga delle spalle",
                "Stacca dal rack e porta sopra la parte bassa del petto",
                "Abbassa il bilanciere alla parte bassa del petto",
                "Spingi verso l'alto fino a braccia tese"
            ],
            tips: [
                "Enfatizza la parte bassa del petto",
                "Usa sempre un aiutante per sicurezza",
                "Angolo di declinazione di 15-30°"
            ],
            commonMistakes: [
                "Angolo troppo ripido che causa afflusso di sangue alla testa",
                "Non avere un assistente con carichi pesanti",
                "Far rimbalzare il bilanciere sul petto"
            ],
            breathing: "Inspira in discesa, espira in salita",
            muscles: {
                primary: "Grande pettorale (fasci sternali inferiori)",
                secondary: "Tricipite, Deltoide anteriore"
            }
        }
    },
    "dumbbell-incline-press": {
        execution: {
            steps: [
                "Imposta la panca a 30-45°",
                "Porta i manubri sulle cosce, usa le ginocchia per lanciarli in posizione",
                "Posiziona i manubri ai lati del petto alto",
                "Spingi verso l'alto convergendo leggermente",
                "Abbassa controllando fino a sentire stretch nel petto"
            ],
            tips: [
                "30° ottimale per petto alto, 45° coinvolge più spalle",
                "Maggior range di movimento rispetto al bilanciere",
                "Ottimo per correggere squilibri tra i lati"
            ],
            commonMistakes: [
                "Angolo troppo alto che trasforma in shoulder press",
                "Gomiti troppo aperti che stressano le spalle",
                "Sbattere i manubri insieme in alto"
            ],
            breathing: "Inspira abbassando, espira spingendo",
            muscles: {
                primary: "Grande pettorale (fasci clavicolari)",
                secondary: "Deltoide anteriore, Tricipite"
            }
        }
    },
    "dumbbell-decline-press": {
        execution: {
            steps: [
                "Imposta la panca in declinazione, blocca i piedi",
                "Porta i manubri in posizione ai lati del petto",
                "Spingi verso l'alto facendo convergere i manubri",
                "Abbassa controllando fino all'altezza del petto basso",
                "Mantieni le scapole retratte per tutto il movimento"
            ],
            tips: [
                "Enfatizza la parte inferiore del petto",
                "I manubri permettono maggiore ROM rispetto al bilanciere",
                "Mantieni i polsi dritti"
            ],
            commonMistakes: [
                "Perdere il controllo dei manubri per la posizione declinata",
                "Angolo di declinazione eccessivo",
                "Non retrarre le scapole"
            ],
            breathing: "Inspira in discesa, espira spingendo",
            muscles: {
                primary: "Grande pettorale (parte inferiore)",
                secondary: "Tricipite"
            }
        }
    },
    "dumbbell-incline-fly": {
        execution: {
            steps: [
                "Sdraiati su panca inclinata a 30-45° con i manubri sopra il petto",
                "Mantieni una leggera flessione dei gomiti",
                "Abbassa i manubri lateralmente in un arco ampio",
                "Scendi fino a sentire stretch nel petto alto",
                "Contrai il petto per riportare i manubri su"
            ],
            tips: [
                "Isolamento eccellente per il petto alto",
                "La flessione dei gomiti resta costante",
                "Usa un peso moderato per controllare il movimento"
            ],
            commonMistakes: [
                "Piegare troppo i gomiti trasformandolo in una press",
                "Scendere troppo stressando le spalle",
                "Usare troppo peso perdendo la forma"
            ],
            breathing: "Inspira aprendo, espira chiudendo",
            muscles: {
                primary: "Grande pettorale (fasci clavicolari)",
                secondary: "Deltoide anteriore"
            }
        }
    },
    "dumbbell-pullover": {
        execution: {
            steps: [
                "Sdraiati sulla panca con la testa vicino al bordo",
                "Tieni un manubrio con entrambe le mani sopra il petto",
                "Braccia quasi completamente distese",
                "Abbassa il manubrio dietro la testa in un arco",
                "Scendi fino a sentire stretch nel petto e nei dorsali",
                "Riporta il manubrio sopra il petto contraendo"
            ],
            tips: [
                "Ottimo per espandere la cassa toracica",
                "Mantieni la flessione dei gomiti costante",
                "Puoi eseguirlo anche di traverso sulla panca"
            ],
            commonMistakes: [
                "Piegare troppo i gomiti durante il movimento",
                "Arcuare eccessivamente la schiena",
                "Usare troppo peso perdendo il controllo"
            ],
            breathing: "Inspira abbassando il manubrio, espira riportandolo su",
            muscles: {
                primary: "Grande pettorale, Grande dorsale",
                secondary: "Tricipite (capo lungo), Dentato anteriore"
            }
        }
    },
    "chest-press-machine": {
        execution: {
            steps: [
                "Regola il sedile in modo che le maniglie siano all'altezza del petto",
                "Siediti con la schiena ben appoggiata",
                "Afferra le maniglie con presa neutra o prona",
                "Spingi in avanti estendendo le braccia",
                "Torna controllando alla posizione iniziale"
            ],
            tips: [
                "Ottimo per principianti o come finisher",
                "Movimento guidato e sicuro",
                "Permette di concentrarsi sulla contrazione senza preoccuparsi dell'equilibrio"
            ],
            commonMistakes: [
                "Staccare la schiena dal sedile",
                "Non completare il range di movimento",
                "Usare slancio del corpo"
            ],
            breathing: "Espira spingendo, inspira tornando",
            muscles: {
                primary: "Grande pettorale",
                secondary: "Tricipite, Deltoide anteriore"
            }
        }
    },
    "incline-chest-press-machine": {
        execution: {
            steps: [
                "Regola il sedile per l'angolazione inclinata",
                "Siediti con la schiena appoggiata",
                "Afferra le maniglie all'altezza del petto alto",
                "Spingi verso l'alto e in avanti",
                "Torna controllando senza far sbattere i pesi"
            ],
            tips: [
                "Focus sulla parte alta del petto",
                "Movimento guidato, ottimo per principianti",
                "Mantieni le scapole retratte"
            ],
            commonMistakes: [
                "Staccare le spalle dallo schienale",
                "Bloccare i gomiti in estensione completa",
                "Movimento troppo veloce"
            ],
            breathing: "Espira spingendo, inspira tornando",
            muscles: {
                primary: "Grande pettorale (parte superiore)",
                secondary: "Tricipite, Deltoide anteriore"
            }
        }
    },
    "pec-deck": {
        execution: {
            steps: [
                "Siediti con la schiena appoggiata e i gomiti sui cuscinetti",
                "Regola l'ampiezza in modo da sentire un leggero stretch",
                "Chiudi le braccia davanti a te in un arco",
                "Contrai forte i pettorali quando le braccia si incontrano",
                "Torna controllando alla posizione di partenza"
            ],
            tips: [
                "Concentrati sulla contrazione del petto, non sul movimento delle braccia",
                "Mantieni i gomiti all'altezza delle spalle",
                "Ottimo esercizio di isolamento per il petto"
            ],
            commonMistakes: [
                "Staccare la schiena dal sedile",
                "Usare troppo peso perdendo il range di movimento",
                "Non controllare la fase eccentrica"
            ],
            breathing: "Espira chiudendo, inspira aprendo",
            muscles: {
                primary: "Grande pettorale",
                secondary: "Deltoide anteriore"
            }
        }
    },
    "smith-bench-press": {
        execution: {
            steps: [
                "Posiziona la panca sotto la Smith Machine",
                "Sdraiati e afferra la barra con presa più larga delle spalle",
                "Ruota la barra per sganciarla",
                "Abbassa la barra al petto in modo controllato",
                "Spingi verso l'alto fino a braccia distese",
                "Riaggancia la barra ruotando i polsi"
            ],
            tips: [
                "Movimento guidato, ottimo per spingere al limite senza assistente",
                "Posiziona la panca in modo che la barra segua un percorso naturale",
                "Buona opzione per chi si allena da solo"
            ],
            commonMistakes: [
                "Posizione della panca non allineata con il percorso della barra",
                "Non bloccare la barra correttamente dopo il set",
                "Usare la guida come scusa per non controllare il movimento"
            ],
            breathing: "Inspira in discesa, espira in salita",
            muscles: {
                primary: "Grande pettorale",
                secondary: "Tricipite, Deltoide anteriore"
            }
        }
    },
    "cable-fly-low": {
        execution: {
            steps: [
                "Posiziona i cavi in basso",
                "Afferra le maniglie e fai un passo avanti",
                "Inclina leggermente il busto in avanti",
                "Con le braccia quasi tese, porta le maniglie verso l'alto e davanti",
                "Le mani si incontrano davanti al petto alto",
                "Torna controllando alla posizione iniziale"
            ],
            tips: [
                "Focus sulla parte alta del petto",
                "Mantieni la flessione dei gomiti costante",
                "Contrai il petto quando le mani si incontrano"
            ],
            commonMistakes: [
                "Piegare troppo i gomiti",
                "Non mantenere tensione costante",
                "Usare troppo peso e perdere la forma"
            ],
            breathing: "Espira portando le maniglie insieme, inspira tornando",
            muscles: {
                primary: "Grande pettorale (parte clavicolare)",
                secondary: "Deltoide anteriore"
            }
        }
    },
    "cable-fly-mid": {
        execution: {
            steps: [
                "Posiziona i cavi all'altezza del petto",
                "Afferra le maniglie e fai un passo avanti",
                "Braccia quasi tese ai lati",
                "Porta le maniglie davanti a te in un arco",
                "Contrai il petto quando le mani si incontrano",
                "Torna controllando alla posizione iniziale"
            ],
            tips: [
                "Lavora uniformemente tutto il petto",
                "Tensione costante durante tutto il range",
                "Varia leggermente l'angolo per stimoli diversi"
            ],
            commonMistakes: [
                "Usare troppo peso perdendo il controllo",
                "Non mantenere la flessione dei gomiti costante",
                "Usare momentum del corpo"
            ],
            breathing: "Espira chiudendo, inspira aprendo",
            muscles: {
                primary: "Grande pettorale (parte sternale)",
                secondary: "Deltoide anteriore"
            }
        }
    },
    "diamond-push-up": {
        execution: {
            steps: [
                "Posizionati in plank con le mani vicine sotto il petto",
                "Le dita formano un diamante (indici e pollici che si toccano)",
                "Mantieni il corpo in linea retta",
                "Abbassati piegando i gomiti vicino al corpo",
                "Scendi fino a sfiorare le mani con il petto",
                "Spingi verso l'alto fino a braccia tese"
            ],
            tips: [
                "Enfatizza i tricipiti e la parte interna del petto",
                "I gomiti restano vicini al corpo",
                "Se troppo difficile, esegui con le ginocchia a terra"
            ],
            commonMistakes: [
                "Allargare i gomiti durante il movimento",
                "Non completare il range di movimento",
                "Far cadere i fianchi"
            ],
            breathing: "Inspira scendendo, espira salendo",
            muscles: {
                primary: "Tricipite, Grande pettorale (parte interna)",
                secondary: "Deltoide anteriore"
            }
        }
    },
    "wide-push-up": {
        execution: {
            steps: [
                "Posizionati in plank con le mani molto più larghe delle spalle",
                "Mantieni il corpo in linea retta",
                "Abbassati piegando i gomiti verso l'esterno",
                "Scendi fino a sfiorare il pavimento con il petto",
                "Spingi verso l'alto fino a braccia tese"
            ],
            tips: [
                "Maggiore enfasi sul petto rispetto ai push-up normali",
                "Minore coinvolgimento dei tricipiti",
                "Ottimo per variare lo stimolo"
            ],
            commonMistakes: [
                "Mani troppo larghe che limitano il ROM",
                "Gomiti a 90° che stressano le spalle",
                "Non completare il range di movimento"
            ],
            breathing: "Inspira scendendo, espira salendo",
            muscles: {
                primary: "Grande pettorale",
                secondary: "Deltoide anteriore, Tricipite"
            }
        }
    },
    "decline-push-up": {
        execution: {
            steps: [
                "Posiziona i piedi su un rialzo (panca, step, sedia)",
                "Mani a terra leggermente più larghe delle spalle",
                "Mantieni il corpo in linea retta dai talloni alla testa",
                "Abbassati piegando i gomiti",
                "Scendi fino a sfiorare il pavimento con il petto",
                "Spingi verso l'alto"
            ],
            tips: [
                "Più alto il rialzo, più lavora la parte alta del petto",
                "Aumenta significativamente il carico rispetto ai push-up normali",
                "Ottima variante a corpo libero per il petto alto"
            ],
            commonMistakes: [
                "Rialzo troppo alto che trasforma in pike push-up",
                "Far cadere i fianchi verso il basso",
                "Non controllare la discesa"
            ],
            breathing: "Inspira scendendo, espira salendo",
            muscles: {
                primary: "Grande pettorale (parte superiore)",
                secondary: "Tricipite, Deltoide anteriore"
            }
        }
    },

    // ==========================================
    // SCHIENA - Esercizi aggiuntivi
    // ==========================================
    "pendlay-row": {
        execution: {
            steps: [
                "Bilanciere a terra, piedi alla larghezza delle spalle",
                "Piegati fino ad avere il busto parallelo al pavimento",
                "Afferra il bilanciere con presa prona più larga delle spalle",
                "Tira esplosivamente il bilanciere verso lo sterno",
                "Contrai le scapole in alto",
                "Riporta il bilanciere a terra con controllo ad ogni ripetizione"
            ],
            tips: [
                "Il bilanciere parte da terra ad ogni rep (a differenza del bent-over row)",
                "Movimento più esplosivo rispetto al rematore classico",
                "Ottimo per sviluppare potenza nella tirata"
            ],
            commonMistakes: [
                "Alzare il busto durante la tirata",
                "Non riportare il bilanciere a terra tra le rep",
                "Usare troppo momentum del corpo"
            ],
            breathing: "Espira tirando, inspira riportando a terra",
            muscles: {
                primary: "Grande dorsale, Romboidi, Trapezio",
                secondary: "Bicipiti, Erettori spinali"
            }
        }
    },
    "t-bar-row": {
        execution: {
            steps: [
                "Posizionati a cavalcioni del bilanciere fissato da un lato",
                "Afferra la maniglia con presa stretta",
                "Busto inclinato a 45-60°, ginocchia leggermente flesse",
                "Tira la maniglia verso il petto/sterno",
                "Contrai le scapole in alto",
                "Abbassa controllando"
            ],
            tips: [
                "Ottimo per lo spessore della schiena",
                "La presa stretta enfatizza la parte centrale della schiena",
                "Mantieni il core contratto per proteggere la lombare"
            ],
            commonMistakes: [
                "Arrotondare la schiena",
                "Usare troppo slancio del busto",
                "Non contrarre le scapole in alto"
            ],
            breathing: "Espira tirando, inspira abbassando",
            muscles: {
                primary: "Grande dorsale, Romboidi, Trapezio medio",
                secondary: "Bicipiti, Erettori spinali"
            }
        }
    },
    "dumbbell-row-two-arm": {
        execution: {
            steps: [
                "In piedi con un manubrio per mano",
                "Piegati in avanti con la schiena dritta, ginocchia flesse",
                "Busto quasi parallelo al pavimento",
                "Tira entrambi i manubri verso i fianchi",
                "Contrai le scapole insieme in alto",
                "Abbassa controllando fino a braccia distese"
            ],
            tips: [
                "Simile al barbell row ma con maggiore libertà di movimento",
                "Puoi ruotare i polsi durante il movimento",
                "Mantieni il core contratto per stabilità"
            ],
            commonMistakes: [
                "Alzare il busto durante la tirata",
                "Arrotondare la schiena",
                "Non contrarre le scapole"
            ],
            breathing: "Espira tirando, inspira abbassando",
            muscles: {
                primary: "Grande dorsale, Romboidi, Trapezio",
                secondary: "Bicipiti, Erettori spinali"
            }
        }
    },
    "dumbbell-shrug": {
        execution: {
            steps: [
                "In piedi con un manubrio per mano ai lati del corpo",
                "Braccia completamente distese",
                "Solleva le spalle verso le orecchie il più possibile",
                "Mantieni la contrazione in alto per 1-2 secondi",
                "Abbassa controllando alla posizione iniziale"
            ],
            tips: [
                "Non ruotare le spalle, il movimento è solo verticale",
                "Mantieni le braccia dritte durante tutto il movimento",
                "Usa una presa salda per non perdere la presa"
            ],
            commonMistakes: [
                "Ruotare le spalle (avanti e indietro)",
                "Usare troppo peso e non raggiungere la contrazione completa",
                "Piegare i gomiti durante il movimento"
            ],
            breathing: "Espira sollevando, inspira abbassando",
            muscles: {
                primary: "Trapezio superiore",
                secondary: "Elevatore della scapola"
            }
        }
    },
    "lat-pulldown-close": {
        execution: {
            steps: [
                "Siediti alla lat machine con le cosce bloccate",
                "Afferra la maniglia triangolare con presa stretta neutra",
                "Inclina leggermente il busto indietro",
                "Tira la maniglia verso il petto",
                "Contrai le scapole e i dorsali in basso",
                "Torna con controllo a braccia distese"
            ],
            tips: [
                "La presa stretta enfatizza la parte bassa dei dorsali",
                "Porta il petto verso la maniglia",
                "Maggior coinvolgimento dei bicipiti rispetto alla presa larga"
            ],
            commonMistakes: [
                "Inclinarsi troppo indietro",
                "Non completare il ROM in alto",
                "Tirare con le braccia invece che con la schiena"
            ],
            breathing: "Espira tirando, inspira tornando su",
            muscles: {
                primary: "Grande dorsale (parte inferiore)",
                secondary: "Bicipiti, Romboidi"
            }
        }
    },
    "machine-row": {
        execution: {
            steps: [
                "Siediti alla macchina con il petto contro il cuscinetto",
                "Afferra le maniglie con le braccia distese",
                "Tira le maniglie verso di te",
                "Contrai le scapole insieme",
                "Torna controllando alla posizione iniziale"
            ],
            tips: [
                "Movimento guidato e sicuro",
                "Ottimo per principianti o come finisher",
                "Concentrati sulla contrazione della schiena"
            ],
            commonMistakes: [
                "Staccare il petto dal cuscinetto",
                "Non contrarre le scapole in posizione contratta",
                "Usare slancio del corpo"
            ],
            breathing: "Espira tirando, inspira tornando",
            muscles: {
                primary: "Grande dorsale, Romboidi",
                secondary: "Bicipiti, Trapezio"
            }
        }
    },
    "assisted-pull-up": {
        execution: {
            steps: [
                "Seleziona il contrappeso sulla macchina (più peso = più assistenza)",
                "Sali sulla piattaforma e afferra la sbarra con presa prona",
                "Appoggia le ginocchia o i piedi sul cuscinetto",
                "Tirati verso l'alto fino a portare il mento sopra la sbarra",
                "Abbassa controllando fino a braccia distese"
            ],
            tips: [
                "Ottimo per progredire verso le trazioni libere",
                "Riduci gradualmente l'assistenza man mano che migliori",
                "Concentrati sulla tecnica corretta"
            ],
            commonMistakes: [
                "Usare troppa assistenza senza progredire",
                "Non completare il range di movimento",
                "Non attivare le scapole all'inizio del movimento"
            ],
            breathing: "Espira salendo, inspira scendendo",
            muscles: {
                primary: "Grande dorsale, Bicipiti",
                secondary: "Trapezio, Romboidi"
            }
        }
    },
    "hyperextension": {
        execution: {
            steps: [
                "Posizionati sulla panca romana con le cosce sui cuscinetti",
                "I piedi bloccati sotto i supporti",
                "Incrocia le braccia al petto o dietro la testa",
                "Abbassati piegando alla vita in modo controllato",
                "Scendi fino a circa 90° o quanto la flessibilità permette",
                "Risali contraendo i lombari e i glutei"
            ],
            tips: [
                "Non iperestendere la schiena oltre la linea del corpo",
                "Puoi aggiungere peso tenendo un disco al petto",
                "Ottimo per rinforzare i lombari"
            ],
            commonMistakes: [
                "Iperestendere la schiena oltre il parallelo",
                "Usare momentum per risalire",
                "Movimento troppo veloce"
            ],
            breathing: "Inspira scendendo, espira risalendo",
            muscles: {
                primary: "Erettori spinali",
                secondary: "Glutei, Femorali"
            }
        }
    },
    "straight-arm-pulldown": {
        execution: {
            steps: [
                "In piedi di fronte al cavo alto con barra dritta o corda",
                "Braccia distese davanti a te, leggermente inclinato in avanti",
                "Mantieni le braccia tese con leggera flessione dei gomiti",
                "Spingi la barra verso il basso fino alle cosce",
                "Contrai i dorsali in basso",
                "Torna controllando alla posizione iniziale"
            ],
            tips: [
                "Ottimo per isolare i dorsali senza coinvolgimento dei bicipiti",
                "Mantieni le braccia tese durante tutto il movimento",
                "Immagina di spingere con i gomiti"
            ],
            commonMistakes: [
                "Piegare i gomiti durante il movimento",
                "Usare troppo peso perdendo l'isolamento",
                "Stare troppo lontano o troppo vicino al cavo"
            ],
            breathing: "Espira spingendo verso il basso, inspira tornando su",
            muscles: {
                primary: "Grande dorsale",
                secondary: "Tricipite (capo lungo), Romboidi"
            }
        }
    },
    "chin-up": {
        execution: {
            steps: [
                "Afferra la sbarra con presa supina (palmi verso di te) alla larghezza delle spalle",
                "Parti da braccia completamente distese",
                "Attiva le scapole tirandole verso il basso",
                "Tirati verso l'alto portando il mento sopra la sbarra",
                "Contrai bicipiti e dorsali in alto",
                "Abbassa controllando fino a braccia distese"
            ],
            tips: [
                "Maggiore coinvolgimento dei bicipiti rispetto alle trazioni prone",
                "Generalmente più facile delle pull-up per i principianti",
                "Ottimo per sviluppare i bicipiti e i dorsali contemporaneamente"
            ],
            commonMistakes: [
                "Non completare il ROM in basso",
                "Oscillare il corpo per slancio",
                "Non attivare le scapole"
            ],
            breathing: "Espira salendo, inspira scendendo",
            muscles: {
                primary: "Grande dorsale, Bicipiti",
                secondary: "Brachiale, Trapezio"
            }
        }
    },
    "neutral-grip-pull-up": {
        execution: {
            steps: [
                "Afferra le maniglie parallele con presa neutra (palmi uno di fronte all'altro)",
                "Parti da braccia completamente distese",
                "Attiva le scapole e tirati verso l'alto",
                "Porta il mento sopra le maniglie",
                "Abbassa controllando fino a braccia distese"
            ],
            tips: [
                "Posizione più naturale e meno stressante per i polsi",
                "Buon compromesso tra pull-up e chin-up",
                "Enfatizza il brachiale oltre ai dorsali"
            ],
            commonMistakes: [
                "Oscillare il corpo",
                "Non completare il range di movimento",
                "Non attivare le scapole all'inizio"
            ],
            breathing: "Espira salendo, inspira scendendo",
            muscles: {
                primary: "Grande dorsale, Brachiale",
                secondary: "Bicipiti, Romboidi"
            }
        }
    },
    "inverted-row": {
        execution: {
            steps: [
                "Posizionati sotto una sbarra bassa o uno Smith Machine",
                "Afferra la sbarra con presa alla larghezza delle spalle",
                "Il corpo in linea retta, talloni a terra",
                "Tirati verso l'alto portando il petto alla sbarra",
                "Contrai le scapole insieme in alto",
                "Abbassa controllando fino a braccia distese"
            ],
            tips: [
                "Ottima propedeutica per le trazioni",
                "Più i piedi sono avanti, più è difficile",
                "Puoi piegare le ginocchia per renderlo più facile"
            ],
            commonMistakes: [
                "Far cadere i fianchi",
                "Non portare il petto alla sbarra",
                "Non controllare la fase eccentrica"
            ],
            breathing: "Espira tirando, inspira abbassando",
            muscles: {
                primary: "Grande dorsale, Romboidi, Trapezio",
                secondary: "Bicipiti, Core"
            }
        }
    },
    "superman": {
        execution: {
            steps: [
                "Sdraiato a pancia in giù con braccia distese davanti a te",
                "Gambe distese dietro di te",
                "Solleva contemporaneamente braccia e gambe da terra",
                "Contrai i lombari e i glutei",
                "Mantieni la posizione per 2-3 secondi",
                "Abbassa controllando"
            ],
            tips: [
                "Non serve sollevare molto in alto, concentrati sulla contrazione",
                "Ottimo per rinforzare la catena posteriore",
                "Puoi alternare braccia e gambe opposte per variazione"
            ],
            commonMistakes: [
                "Sollevare troppo causando iperestensione",
                "Trattenere il respiro",
                "Movimento troppo veloce senza contrazione"
            ],
            breathing: "Inspira nella posizione di partenza, espira sollevando",
            muscles: {
                primary: "Erettori spinali, Glutei",
                secondary: "Femorali, Deltoidi posteriori"
            }
        }
    },

    // ==========================================
    // SPALLE - Esercizi aggiuntivi
    // ==========================================
    "push-press": {
        execution: {
            steps: [
                "Bilanciere sulle clavicole/deltoidi con presa alla larghezza delle spalle",
                "Piedi alla larghezza delle anche",
                "Fai un leggero piegamento delle ginocchia (dip)",
                "Estendi esplosivamente le gambe per dare impulso al bilanciere",
                "Usa lo slancio per spingere il bilanciere sopra la testa",
                "Blocca le braccia in alto",
                "Abbassa il bilanciere alle clavicole con controllo"
            ],
            tips: [
                "Permette di usare carichi maggiori dell'overhead press",
                "Il dip delle ginocchia deve essere rapido e poco profondo",
                "Ottimo per sviluppare potenza overhead"
            ],
            commonMistakes: [
                "Piegare troppo le ginocchia (diventa un thruster)",
                "Non coordinare la spinta delle gambe con le braccia",
                "Arcuare la schiena durante la spinta"
            ],
            breathing: "Inspira durante il dip, espira durante la spinta",
            muscles: {
                primary: "Deltoide, Tricipite",
                secondary: "Quadricipiti, Core, Trapezio"
            }
        }
    },
    "barbell-front-raise": {
        execution: {
            steps: [
                "In piedi con il bilanciere davanti alle cosce, presa alla larghezza delle spalle",
                "Braccia distese con leggera flessione dei gomiti",
                "Solleva il bilanciere davanti a te fino all'altezza delle spalle",
                "Mantieni brevemente la contrazione in alto",
                "Abbassa controllando alla posizione iniziale"
            ],
            tips: [
                "Isola il deltoide anteriore",
                "Usa un peso moderato per mantenere la forma",
                "Non oscillare il corpo per aiutarti"
            ],
            commonMistakes: [
                "Usare slancio del corpo",
                "Sollevare oltre l'altezza delle spalle",
                "Arcuare la schiena"
            ],
            breathing: "Espira sollevando, inspira abbassando",
            muscles: {
                primary: "Deltoide anteriore",
                secondary: "Trapezio superiore"
            }
        }
    },
    "upright-row": {
        execution: {
            steps: [
                "In piedi con il bilanciere davanti alle cosce",
                "Presa alla larghezza delle spalle o più stretta",
                "Tira il bilanciere verso l'alto lungo il corpo",
                "Guida con i gomiti che salgono verso l'alto e l'esterno",
                "Solleva fino a che i gomiti sono all'altezza delle spalle",
                "Abbassa controllando"
            ],
            tips: [
                "Presa larga enfatizza le spalle, presa stretta il trapezio",
                "Non sollevare oltre l'altezza delle spalle per proteggere l'articolazione",
                "Se causa dolore alla spalla, evita l'esercizio"
            ],
            commonMistakes: [
                "Sollevare i gomiti troppo in alto (impingement)",
                "Usare troppo peso e oscillare",
                "Presa troppo stretta che stressa i polsi"
            ],
            breathing: "Espira tirando su, inspira abbassando",
            muscles: {
                primary: "Deltoide laterale, Trapezio",
                secondary: "Bicipiti"
            }
        }
    },
    "arnold-press": {
        execution: {
            steps: [
                "Seduto con i manubri davanti al viso, palmi verso di te",
                "Mentre spingi i manubri verso l'alto, ruota i polsi",
                "A metà movimento i palmi iniziano a ruotare verso l'esterno",
                "In alto i palmi sono rivolti in avanti (come un overhead press)",
                "Abbassa invertendo la rotazione",
                "Torna alla posizione di partenza con i palmi verso di te"
            ],
            tips: [
                "Inventato da Arnold Schwarzenegger",
                "Coinvolge tutti e tre i capi del deltoide grazie alla rotazione",
                "Movimento fluido e continuo, non a scatti"
            ],
            commonMistakes: [
                "Rotazione troppo veloce o a scatti",
                "Non completare la rotazione",
                "Arcuare la schiena"
            ],
            breathing: "Espira spingendo verso l'alto, inspira abbassando",
            muscles: {
                primary: "Deltoide (tutti i capi)",
                secondary: "Tricipite, Trapezio"
            }
        }
    },
    "front-raise": {
        execution: {
            steps: [
                "In piedi con un manubrio per mano davanti alle cosce",
                "Palmi rivolti verso il corpo",
                "Solleva un manubrio davanti a te fino all'altezza delle spalle",
                "Braccio quasi completamente disteso",
                "Abbassa controllando e ripeti con l'altro braccio",
                "Puoi eseguirli anche simultaneamente"
            ],
            tips: [
                "Isola il deltoide anteriore",
                "Usa un peso leggero per non compensare con il corpo",
                "Non oscillare il busto"
            ],
            commonMistakes: [
                "Usare slancio del corpo",
                "Sollevare troppo in alto",
                "Arcuare la schiena"
            ],
            breathing: "Espira sollevando, inspira abbassando",
            muscles: {
                primary: "Deltoide anteriore",
                secondary: "Trapezio superiore"
            }
        }
    },
    "rear-delt-fly": {
        execution: {
            steps: [
                "Piegato in avanti con il busto quasi parallelo al pavimento",
                "Un manubrio per mano, braccia pendenti sotto il petto",
                "Leggera flessione dei gomiti",
                "Solleva i manubri lateralmente fino all'altezza delle spalle",
                "Contrai le scapole insieme in alto",
                "Abbassa controllando"
            ],
            tips: [
                "Focus sul deltoide posteriore e i romboidi",
                "Usa un peso leggero e concentrati sulla contrazione",
                "Puoi eseguirle anche su panca inclinata"
            ],
            commonMistakes: [
                "Alzare il busto durante il movimento",
                "Usare troppo peso perdendo l'isolamento",
                "Non contrarre le scapole"
            ],
            breathing: "Espira sollevando, inspira abbassando",
            muscles: {
                primary: "Deltoide posteriore",
                secondary: "Romboidi, Trapezio"
            }
        }
    },
    "dumbbell-shrug-shoulders": {
        execution: {
            steps: [
                "In piedi con un manubrio per mano ai lati",
                "Braccia completamente distese",
                "Solleva le spalle verso le orecchie",
                "Mantieni la contrazione in alto per 1-2 secondi",
                "Abbassa controllando"
            ],
            tips: [
                "Movimento solo verticale, non ruotare le spalle",
                "Usa un peso che permetta contrazione completa",
                "Ottimo per costruire il trapezio superiore"
            ],
            commonMistakes: [
                "Ruotare le spalle avanti e indietro",
                "Piegare i gomiti",
                "Non raggiungere la contrazione completa"
            ],
            breathing: "Espira sollevando, inspira abbassando",
            muscles: {
                primary: "Trapezio superiore",
                secondary: "Elevatore della scapola"
            }
        }
    },
    "shoulder-press-machine": {
        execution: {
            steps: [
                "Siediti con la schiena ben appoggiata allo schienale",
                "Regola il sedile per avere le maniglie all'altezza delle spalle",
                "Afferra le maniglie con presa neutra o prona",
                "Spingi verso l'alto estendendo le braccia",
                "Torna controllando alla posizione iniziale"
            ],
            tips: [
                "Movimento guidato, ottimo per principianti",
                "Permette di spingersi al limite in sicurezza",
                "Mantieni la schiena appoggiata allo schienale"
            ],
            commonMistakes: [
                "Staccare la schiena dallo schienale",
                "Non completare il range di movimento",
                "Bloccare i gomiti in estensione completa"
            ],
            breathing: "Espira spingendo, inspira abbassando",
            muscles: {
                primary: "Deltoide anteriore e laterale",
                secondary: "Tricipite"
            }
        }
    },
    "lateral-raise-machine": {
        execution: {
            steps: [
                "Siediti con le braccia appoggiate ai cuscinetti",
                "Regola il sedile per allineare le spalle con il fulcro della macchina",
                "Solleva lateralmente i cuscinetti fino all'altezza delle spalle",
                "Mantieni brevemente la contrazione",
                "Abbassa controllando"
            ],
            tips: [
                "Isolamento perfetto del deltoide laterale",
                "Elimina il cheating possibile con i manubri",
                "Concentrati sulla contrazione del muscolo"
            ],
            commonMistakes: [
                "Usare troppo peso e non raggiungere l'altezza delle spalle",
                "Alzare le spalle verso le orecchie",
                "Movimento troppo veloce"
            ],
            breathing: "Espira sollevando, inspira abbassando",
            muscles: {
                primary: "Deltoide laterale",
                secondary: "Trapezio superiore"
            }
        }
    },
    "reverse-pec-deck": {
        execution: {
            steps: [
                "Siediti alla pec deck al contrario, petto contro lo schienale",
                "Afferra le maniglie con le braccia davanti a te",
                "Apri le braccia all'indietro in un arco",
                "Contrai le scapole e il deltoide posteriore",
                "Torna controllando alla posizione iniziale"
            ],
            tips: [
                "Ottimo per il deltoide posteriore senza stressare la schiena",
                "Mantieni una leggera flessione dei gomiti",
                "Concentrati sulla contrazione delle scapole"
            ],
            commonMistakes: [
                "Staccare il petto dallo schienale",
                "Usare troppo peso perdendo il ROM",
                "Non contrarre le scapole"
            ],
            breathing: "Espira aprendo, inspira tornando",
            muscles: {
                primary: "Deltoide posteriore",
                secondary: "Romboidi, Trapezio"
            }
        }
    },
    "cable-lateral-raise": {
        execution: {
            steps: [
                "In piedi di fianco al cavo basso",
                "Afferra la maniglia con la mano più lontana",
                "Il cavo passa davanti al corpo",
                "Solleva lateralmente fino all'altezza della spalla",
                "Abbassa controllando"
            ],
            tips: [
                "Tensione costante durante tutto il range di movimento",
                "Ottimo per il deltoide laterale con stimolo diverso dai manubri",
                "Puoi variare la posizione del cavo per angoli diversi"
            ],
            commonMistakes: [
                "Sollevare troppo in alto",
                "Usare slancio del corpo",
                "Non controllare la fase eccentrica"
            ],
            breathing: "Espira sollevando, inspira abbassando",
            muscles: {
                primary: "Deltoide laterale",
                secondary: "Trapezio superiore"
            }
        }
    },
    "cable-front-raise": {
        execution: {
            steps: [
                "In piedi con il cavo basso dietro di te",
                "Afferra la maniglia con una mano",
                "Braccio quasi disteso lungo il corpo",
                "Solleva il braccio davanti a te fino all'altezza della spalla",
                "Abbassa controllando"
            ],
            tips: [
                "Tensione costante anche nella fase iniziale",
                "Ottimo per il deltoide anteriore",
                "Usa un peso leggero per mantenere l'isolamento"
            ],
            commonMistakes: [
                "Oscillare il corpo",
                "Sollevare troppo in alto",
                "Perdere la tensione nella fase bassa"
            ],
            breathing: "Espira sollevando, inspira abbassando",
            muscles: {
                primary: "Deltoide anteriore",
                secondary: "Trapezio superiore"
            }
        }
    },
    "cable-rear-delt": {
        execution: {
            steps: [
                "Posiziona i cavi all'altezza delle spalle",
                "Incrocia le braccia e afferra il cavo opposto con ogni mano",
                "Fai un passo indietro per creare tensione",
                "Tira le maniglie all'indietro e verso l'esterno",
                "Contrai le scapole insieme",
                "Torna controllando"
            ],
            tips: [
                "Ottimo per il deltoide posteriore",
                "Mantieni i gomiti alti e le braccia parallele al pavimento",
                "Puoi anche eseguirlo con un singolo cavo"
            ],
            commonMistakes: [
                "Abbassare i gomiti durante il movimento",
                "Usare troppo peso perdendo la forma",
                "Non contrarre le scapole"
            ],
            breathing: "Espira tirando, inspira tornando",
            muscles: {
                primary: "Deltoide posteriore",
                secondary: "Romboidi, Trapezio"
            }
        }
    },
    "pike-push-up": {
        execution: {
            steps: [
                "Posizionati in una V rovesciata con le mani e i piedi a terra",
                "I fianchi in alto, le gambe quasi dritte",
                "Mani leggermente più larghe delle spalle",
                "Abbassati piegando i gomiti portando la testa verso il pavimento",
                "Spingi verso l'alto tornando alla posizione di partenza"
            ],
            tips: [
                "Ottima propedeutica per l'handstand push-up",
                "Più i piedi sono vicini alle mani, più è difficile",
                "Puoi rialzare i piedi per aumentare la difficoltà"
            ],
            commonMistakes: [
                "Abbassare i fianchi trasformandolo in un push-up",
                "Non completare il range di movimento",
                "Gomiti che si allargano troppo"
            ],
            breathing: "Inspira scendendo, espira spingendo",
            muscles: {
                primary: "Deltoide anteriore, Tricipite",
                secondary: "Trapezio, Core"
            }
        }
    },
    "handstand-push-up": {
        execution: {
            steps: [
                "Mettiti in verticale contro un muro con le mani a terra",
                "Mani leggermente più larghe delle spalle",
                "Abbassati piegando i gomiti portando la testa verso il pavimento",
                "Tocca leggermente il pavimento con la testa",
                "Spingi verso l'alto fino a braccia tese"
            ],
            tips: [
                "Esercizio avanzato, richiede buona forza base",
                "Il muro fornisce supporto e sicurezza",
                "Progressione: pike push-up → piedi rialzati → handstand"
            ],
            commonMistakes: [
                "Perdere l'equilibrio e cadere",
                "Non avere sufficiente forza di base",
                "Gomiti che si allargano troppo"
            ],
            breathing: "Inspira scendendo, espira spingendo",
            muscles: {
                primary: "Deltoide, Tricipite",
                secondary: "Trapezio, Core"
            }
        }
    },

    // ==========================================
    // BICIPITI - Esercizi aggiuntivi
    // ==========================================
    "ez-bar-curl": {
        execution: {
            steps: [
                "In piedi con la barra EZ, presa supina sulle curve della barra",
                "Braccia distese, gomiti ai fianchi",
                "Curla la barra verso le spalle",
                "Contrai i bicipiti in alto",
                "Abbassa controllando fino a braccia distese"
            ],
            tips: [
                "La barra EZ riduce lo stress sui polsi rispetto al bilanciere dritto",
                "Mantieni i gomiti fermi ai fianchi",
                "Ottima alternativa al curl con bilanciere"
            ],
            commonMistakes: [
                "Oscillare il corpo per slancio",
                "Muovere i gomiti in avanti",
                "Non completare il range di movimento"
            ],
            breathing: "Espira curlando, inspira abbassando",
            muscles: {
                primary: "Bicipite brachiale",
                secondary: "Brachiale, Brachioradiale"
            }
        }
    },
    "preacher-curl": {
        execution: {
            steps: [
                "Siediti alla panca Scott con le braccia appoggiate sul cuscinetto",
                "Afferra il bilanciere o la barra EZ con presa supina",
                "La parte superiore delle braccia ben appoggiata",
                "Curla la barra verso le spalle",
                "Contrai in alto",
                "Abbassa controllando fino a braccia quasi completamente distese"
            ],
            tips: [
                "Elimina completamente il cheating",
                "Ottimo isolamento del bicipite",
                "Non distendere completamente le braccia in basso per proteggere i tendini"
            ],
            commonMistakes: [
                "Staccare le braccia dal cuscinetto",
                "Scendere troppo velocemente",
                "Iperestendere i gomiti in basso"
            ],
            breathing: "Espira curlando, inspira abbassando",
            muscles: {
                primary: "Bicipite brachiale",
                secondary: "Brachiale"
            }
        }
    },
    "dumbbell-curl": {
        execution: {
            steps: [
                "In piedi con un manubrio per mano, palmi in avanti",
                "Braccia distese ai lati, gomiti ai fianchi",
                "Curla un manubrio verso la spalla",
                "Contrai il bicipite in alto",
                "Abbassa controllando e ripeti con l'altro braccio",
                "Puoi eseguirli alternati o simultanei"
            ],
            tips: [
                "La supinazione (rotazione del palmo) aumenta l'attivazione del bicipite",
                "Puoi partire con presa neutra e ruotare durante il curl",
                "Mantieni i gomiti fermi"
            ],
            commonMistakes: [
                "Oscillare il corpo per aiutarsi",
                "Muovere i gomiti in avanti",
                "Non controllare la fase eccentrica"
            ],
            breathing: "Espira curlando, inspira abbassando",
            muscles: {
                primary: "Bicipite brachiale",
                secondary: "Brachiale, Brachioradiale"
            }
        }
    },
    "incline-curl": {
        execution: {
            steps: [
                "Imposta la panca a 45-60°",
                "Sdraiati con un manubrio per mano, braccia pendenti ai lati",
                "Curla i manubri verso le spalle",
                "Contrai i bicipiti in alto",
                "Abbassa controllando fino a braccia distese"
            ],
            tips: [
                "La posizione inclinata mette maggiore stretch sul bicipite",
                "Ottimo per il capo lungo del bicipite",
                "Usa un peso inferiore rispetto ai curl in piedi"
            ],
            commonMistakes: [
                "Muovere i gomiti in avanti durante il curl",
                "Staccare la schiena dalla panca",
                "Usare troppo peso"
            ],
            breathing: "Espira curlando, inspira abbassando",
            muscles: {
                primary: "Bicipite brachiale (capo lungo)",
                secondary: "Brachiale"
            }
        }
    },
    "concentration-curl": {
        execution: {
            steps: [
                "Seduto su una panca, gambe divaricate",
                "Appoggia il gomito sulla coscia interna",
                "Tieni un manubrio con il braccio disteso",
                "Curla il manubrio verso la spalla",
                "Contrai il bicipite al massimo in alto",
                "Abbassa controllando"
            ],
            tips: [
                "Massimo isolamento del bicipite",
                "Il gomito fermo sulla coscia impedisce il cheating",
                "Ottimo come esercizio di finitura"
            ],
            commonMistakes: [
                "Staccare il gomito dalla coscia",
                "Muovere il busto per aiutarsi",
                "Usare troppo peso perdendo l'isolamento"
            ],
            breathing: "Espira curlando, inspira abbassando",
            muscles: {
                primary: "Bicipite brachiale",
                secondary: "Brachiale"
            }
        }
    },
    "spider-curl": {
        execution: {
            steps: [
                "Appoggiati a pancia in giù su una panca inclinata a 45°",
                "Braccia pendenti verso il basso con i manubri",
                "Curla i manubri verso le spalle",
                "Contrai i bicipiti in alto",
                "Abbassa controllando"
            ],
            tips: [
                "Ottimo per il picco del bicipite",
                "La gravità agisce al massimo nella contrazione",
                "Elimina completamente il cheating del corpo"
            ],
            commonMistakes: [
                "Muovere i gomiti durante il curl",
                "Non raggiungere la contrazione completa",
                "Usare troppo peso"
            ],
            breathing: "Espira curlando, inspira abbassando",
            muscles: {
                primary: "Bicipite brachiale (capo corto)",
                secondary: "Brachiale"
            }
        }
    },
    "cable-curl": {
        execution: {
            steps: [
                "In piedi davanti al cavo basso con barra o maniglia",
                "Afferra con presa supina",
                "Braccia distese, gomiti ai fianchi",
                "Curla verso le spalle",
                "Contrai in alto",
                "Abbassa controllando"
            ],
            tips: [
                "Tensione costante durante tutto il range di movimento",
                "Ottima variante al curl con bilanciere",
                "Puoi usare diverse maniglie per variare lo stimolo"
            ],
            commonMistakes: [
                "Oscillare il corpo",
                "Muovere i gomiti",
                "Stare troppo vicino o troppo lontano dal cavo"
            ],
            breathing: "Espira curlando, inspira abbassando",
            muscles: {
                primary: "Bicipite brachiale",
                secondary: "Brachiale"
            }
        }
    },
    "cable-hammer-curl": {
        execution: {
            steps: [
                "In piedi davanti al cavo basso con attacco a corda",
                "Afferra le estremità della corda con presa neutra",
                "Braccia distese, gomiti ai fianchi",
                "Curla la corda verso le spalle mantenendo i pollici in alto",
                "Contrai in alto",
                "Abbassa controllando"
            ],
            tips: [
                "Lavora il brachiale e il brachioradiale oltre al bicipite",
                "Tensione costante grazie al cavo",
                "Ottimo per lo sviluppo complessivo del braccio"
            ],
            commonMistakes: [
                "Ruotare i polsi durante il movimento",
                "Oscillare il corpo",
                "Non completare il ROM"
            ],
            breathing: "Espira curlando, inspira abbassando",
            muscles: {
                primary: "Brachiale, Bicipite",
                secondary: "Brachioradiale"
            }
        }
    },
    "bicep-curl-machine": {
        execution: {
            steps: [
                "Siediti alla macchina con le braccia appoggiate sul cuscinetto",
                "Regola il sedile per allineare i gomiti con il fulcro",
                "Afferra le maniglie con presa supina",
                "Curla le maniglie verso le spalle",
                "Contrai in alto",
                "Torna controllando"
            ],
            tips: [
                "Movimento guidato e isolato",
                "Ottimo per principianti o come finisher",
                "Elimina il cheating del corpo"
            ],
            commonMistakes: [
                "Sedile non regolato correttamente",
                "Staccare le braccia dal cuscinetto",
                "Movimento troppo veloce"
            ],
            breathing: "Espira curlando, inspira abbassando",
            muscles: {
                primary: "Bicipite brachiale",
                secondary: "Brachiale"
            }
        }
    },

    // ==========================================
    // TRICIPITI - Esercizi aggiuntivi
    // ==========================================
    "close-grip-bench": {
        execution: {
            steps: [
                "Sdraiati sulla panca con presa alla larghezza delle spalle o più stretta",
                "Stacca il bilanciere dal rack",
                "Abbassa il bilanciere al petto mantenendo i gomiti vicini al corpo",
                "I gomiti non si allargano ma puntano verso i piedi",
                "Spingi verso l'alto estendendo le braccia"
            ],
            tips: [
                "Presa non troppo stretta per non stressare i polsi",
                "I gomiti restano vicini al busto durante tutto il movimento",
                "Ottimo esercizio compound per i tricipiti"
            ],
            commonMistakes: [
                "Presa troppo stretta che causa dolore ai polsi",
                "Allargare i gomiti (diventa una bench press normale)",
                "Non bloccare i polsi dritti"
            ],
            breathing: "Inspira in discesa, espira spingendo",
            muscles: {
                primary: "Tricipite brachiale",
                secondary: "Grande pettorale, Deltoide anteriore"
            }
        }
    },
    "dumbbell-tricep-extension": {
        execution: {
            steps: [
                "Seduto o in piedi, tieni un manubrio con entrambe le mani sopra la testa",
                "Braccia distese, gomiti vicini alla testa",
                "Abbassa il manubrio dietro la testa piegando i gomiti",
                "I gomiti puntano verso il soffitto e restano fermi",
                "Estendi le braccia tornando alla posizione di partenza"
            ],
            tips: [
                "Ottimo stretch del capo lungo del tricipite",
                "Puoi eseguirlo anche con un solo manubrio per braccio",
                "Mantieni i gomiti vicini alla testa"
            ],
            commonMistakes: [
                "Allargare i gomiti durante il movimento",
                "Arcuare la schiena",
                "Muovere le spalle invece dei soli gomiti"
            ],
            breathing: "Inspira abbassando, espira estendendo",
            muscles: {
                primary: "Tricipite brachiale (capo lungo)",
                secondary: "Anconeo"
            }
        }
    },
    "dumbbell-kickback": {
        execution: {
            steps: [
                "Piegato in avanti con una mano e un ginocchio sulla panca",
                "Tieni un manubrio con l'altra mano, gomito a 90°",
                "Il braccio superiore è parallelo al busto",
                "Estendi il braccio all'indietro raddrizzando il gomito",
                "Contrai il tricipite in alto",
                "Torna alla posizione con il gomito piegato"
            ],
            tips: [
                "Il gomito deve restare fermo, solo l'avambraccio si muove",
                "Contrai il tricipite per 1 secondo a braccio disteso",
                "Usa un peso moderato per l'isolamento"
            ],
            commonMistakes: [
                "Muovere il braccio superiore durante l'estensione",
                "Non distendere completamente il braccio",
                "Usare troppo peso perdendo la forma"
            ],
            breathing: "Espira estendendo, inspira piegando",
            muscles: {
                primary: "Tricipite brachiale",
                secondary: "Anconeo"
            }
        }
    },
    "tate-press": {
        execution: {
            steps: [
                "Sdraiato sulla panca con un manubrio per mano",
                "Braccia distese sopra il petto, palmi verso i piedi",
                "Piega i gomiti portando i manubri verso il petto",
                "I gomiti si aprono verso l'esterno",
                "I manubri toccano quasi il petto",
                "Estendi le braccia tornando alla posizione di partenza"
            ],
            tips: [
                "Movimento particolare ma molto efficace per i tricipiti",
                "Combina elementi del fly e della French press",
                "Usa un peso moderato per padroneggiare la tecnica"
            ],
            commonMistakes: [
                "Confondere il movimento con una fly",
                "Non controllare la fase eccentrica",
                "Gomiti che si muovono troppo"
            ],
            breathing: "Inspira abbassando, espira estendendo",
            muscles: {
                primary: "Tricipite brachiale",
                secondary: "Grande pettorale"
            }
        }
    },
    "rope-pushdown": {
        execution: {
            steps: [
                "In piedi al cavo alto con attacco a corda",
                "Afferra le estremità della corda con presa neutra",
                "Gomiti ai fianchi e fermi",
                "Spingi verso il basso estendendo i gomiti",
                "In basso, separa le estremità della corda verso l'esterno",
                "Torna controllando alla posizione iniziale"
            ],
            tips: [
                "Separare le mani in basso aumenta la contrazione del tricipite",
                "I gomiti devono restare incollati ai fianchi",
                "Ottima variante del pushdown con barra"
            ],
            commonMistakes: [
                "Muovere i gomiti durante il movimento",
                "Non separare le mani in basso",
                "Inclinarsi troppo in avanti"
            ],
            breathing: "Espira spingendo, inspira tornando",
            muscles: {
                primary: "Tricipite brachiale (capo laterale)",
                secondary: "Anconeo"
            }
        }
    },
    "overhead-cable-extension": {
        execution: {
            steps: [
                "Di spalle al cavo, afferra la corda o la barra dietro la testa",
                "Fai un passo avanti per creare tensione",
                "Gomiti puntati in avanti, vicini alla testa",
                "Estendi le braccia sopra la testa",
                "Contrai i tricipiti in alto",
                "Torna controllando alla posizione di partenza"
            ],
            tips: [
                "Ottimo stretch del capo lungo del tricipite",
                "Mantieni i gomiti fermi e vicini alla testa",
                "Tensione costante grazie al cavo"
            ],
            commonMistakes: [
                "Allargare i gomiti",
                "Arcuare la schiena",
                "Non completare l'estensione"
            ],
            breathing: "Espira estendendo, inspira piegando",
            muscles: {
                primary: "Tricipite brachiale (capo lungo)",
                secondary: "Anconeo"
            }
        }
    },
    "bench-dips": {
        execution: {
            steps: [
                "Seduto sul bordo di una panca, mani ai lati dei fianchi",
                "Scorri in avanti con i glutei fuori dalla panca",
                "Gambe distese in avanti (o piegate per versione più facile)",
                "Abbassati piegando i gomiti dietro di te",
                "Scendi fino a gomiti a 90°",
                "Spingi verso l'alto estendendo le braccia"
            ],
            tips: [
                "Gambe più distanti = più difficile",
                "Puoi rialzare i piedi su un'altra panca per più intensità",
                "Mantieni la schiena vicina alla panca"
            ],
            commonMistakes: [
                "Gomiti che si allargano verso l'esterno",
                "Scendere troppo causando stress alle spalle",
                "Allontanarsi troppo dalla panca"
            ],
            breathing: "Inspira scendendo, espira salendo",
            muscles: {
                primary: "Tricipite brachiale",
                secondary: "Deltoide anteriore, Grande pettorale"
            }
        }
    },
    "close-grip-push-up": {
        execution: {
            steps: [
                "In posizione di plank con le mani vicine (larghezza spalle o meno)",
                "Corpo in linea retta dalla testa ai talloni",
                "Abbassati piegando i gomiti vicino al corpo",
                "Scendi fino a sfiorare il pavimento",
                "Spingi verso l'alto"
            ],
            tips: [
                "Enfatizza i tricipiti rispetto ai push-up normali",
                "Mantieni i gomiti vicini al corpo",
                "Più le mani sono vicine, più lavorano i tricipiti"
            ],
            commonMistakes: [
                "Allargare i gomiti",
                "Far cadere i fianchi",
                "Non completare il range di movimento"
            ],
            breathing: "Inspira scendendo, espira salendo",
            muscles: {
                primary: "Tricipite brachiale",
                secondary: "Grande pettorale, Deltoide anteriore"
            }
        }
    },
    "tricep-dip-machine": {
        execution: {
            steps: [
                "Siediti alla macchina con le mani sulle maniglie ai lati",
                "Regola il peso desiderato",
                "Spingi verso il basso estendendo i gomiti",
                "Contrai i tricipiti in basso",
                "Torna controllando alla posizione iniziale"
            ],
            tips: [
                "Movimento guidato e sicuro",
                "Ottimo per chi non riesce ancora a fare dips liberi",
                "Concentrati sulla contrazione del tricipite"
            ],
            commonMistakes: [
                "Far sbattere i pesi tra le ripetizioni",
                "Non completare il range di movimento",
                "Movimento troppo veloce"
            ],
            breathing: "Espira spingendo, inspira tornando",
            muscles: {
                primary: "Tricipite brachiale",
                secondary: "Deltoide anteriore"
            }
        }
    },
    "cable-kickback": {
        execution: {
            steps: [
                "Al cavo basso, applica la cavigliera alla caviglia",
                "In piedi di fronte alla macchina, leggermente inclinato in avanti",
                "Tieniti alla macchina per stabilità",
                "Spingi la gamba all'indietro mantenendola dritta",
                "Contrai il gluteo in alto",
                "Torna controllando alla posizione iniziale"
            ],
            tips: [
                "Ottimo isolamento per i glutei",
                "Non arcuare la schiena durante il movimento",
                "Mantieni il core contratto per stabilità"
            ],
            commonMistakes: [
                "Arcuare la schiena per compensare",
                "Usare lo slancio della gamba",
                "Non contrarre il gluteo in estensione"
            ],
            breathing: "Espira spingendo indietro, inspira tornando",
            muscles: {
                primary: "Grande gluteo",
                secondary: "Femorali"
            }
        }
    },

    // ==========================================
    // QUADRICIPITI - Esercizi aggiuntivi
    // ==========================================
    "front-squat": {
        execution: {
            steps: [
                "Posiziona il bilanciere sulle clavicole/deltoidi anteriori",
                "Gomiti alti, braccia parallele al pavimento (presa clean o incrociata)",
                "Piedi alla larghezza delle spalle, punte leggermente fuori",
                "Scendi mantenendo il busto più verticale possibile",
                "Le ginocchia avanzano in linea con le punte dei piedi",
                "Spingi attraverso tutto il piede per risalire"
            ],
            tips: [
                "Richiede buona mobilità di polsi, caviglie e torace",
                "Mantieni i gomiti altissimi per non far cadere il bilanciere",
                "Enfatizza molto i quadricipiti rispetto al back squat"
            ],
            commonMistakes: [
                "Gomiti che cadono verso il basso",
                "Arrotondare la parte alta della schiena",
                "Scarsa mobilità alle caviglie che limita la profondità"
            ],
            breathing: "Inspira prima di scendere, espira risalendo",
            muscles: {
                primary: "Quadricipiti",
                secondary: "Glutei, Core"
            }
        }
    },
    "bulgarian-split-squat-bb": {
        execution: {
            steps: [
                "Bilanciere sulle spalle come nello squat",
                "Posiziona un piede dietro su una panca",
                "Il piede anteriore abbastanza avanti",
                "Scendi piegando il ginocchio anteriore",
                "Scendi fino a coscia anteriore parallela al pavimento",
                "Spingi attraverso il piede anteriore per risalire"
            ],
            tips: [
                "Versione più avanzata rispetto ai manubri",
                "Richiede ottimo equilibrio",
                "Il bilanciere permette carichi maggiori"
            ],
            commonMistakes: [
                "Perdere l'equilibrio con il bilanciere",
                "Ginocchio anteriore che collassa verso l'interno",
                "Mettere troppo peso sul piede posteriore"
            ],
            breathing: "Inspira scendendo, espira salendo",
            muscles: {
                primary: "Quadricipiti, Glutei",
                secondary: "Femorali, Core"
            }
        }
    },
    "goblet-squat": {
        execution: {
            steps: [
                "Tieni un manubrio o kettlebell al petto con entrambe le mani",
                "Piedi leggermente più larghi delle spalle, punte fuori",
                "Scendi in squat profondo mantenendo il peso al petto",
                "I gomiti passano tra le ginocchia in basso",
                "Mantieni il busto eretto",
                "Spingi attraverso i talloni per risalire"
            ],
            tips: [
                "Ottimo per imparare il movimento dello squat",
                "Il peso frontale aiuta a mantenere il busto verticale",
                "Eccellente per la mobilità delle anche"
            ],
            commonMistakes: [
                "Piegarsi troppo in avanti",
                "Sollevare i talloni",
                "Non scendere abbastanza in profondità"
            ],
            breathing: "Inspira scendendo, espira salendo",
            muscles: {
                primary: "Quadricipiti, Glutei",
                secondary: "Core, Avambracci"
            }
        }
    },
    "dumbbell-lunge": {
        execution: {
            steps: [
                "In piedi con un manubrio per mano ai lati",
                "Fai un passo avanti con una gamba",
                "Abbassati piegando entrambe le ginocchia a 90°",
                "Il ginocchio posteriore sfiora il pavimento",
                "Spingi attraverso il piede anteriore per tornare in posizione",
                "Alterna le gambe o esegui tutte le rep con una gamba"
            ],
            tips: [
                "Mantieni il busto eretto durante tutto il movimento",
                "Il passo deve essere abbastanza lungo",
                "Non far sbattere il ginocchio posteriore a terra"
            ],
            commonMistakes: [
                "Passo troppo corto che stressa il ginocchio anteriore",
                "Piegarsi in avanti con il busto",
                "Ginocchio anteriore che supera la punta del piede"
            ],
            breathing: "Inspira scendendo, espira salendo",
            muscles: {
                primary: "Quadricipiti, Glutei",
                secondary: "Femorali"
            }
        }
    },
    "step-up": {
        execution: {
            steps: [
                "In piedi davanti a una panca o rialzo, manubri ai lati",
                "Appoggia un piede sulla panca",
                "Spingi attraverso il piede in alto per salire",
                "Non spingerti con il piede a terra",
                "Sali fino a gamba completamente estesa",
                "Scendi controllando con la stessa gamba"
            ],
            tips: [
                "Tutta la forza deve venire dalla gamba in alto",
                "Più alto il rialzo, più è difficile e più coinvolge i glutei",
                "Mantieni il busto eretto"
            ],
            commonMistakes: [
                "Spingersi con il piede a terra per aiutarsi",
                "Inclinarsi in avanti",
                "Rialzo troppo alto per le proprie capacità"
            ],
            breathing: "Espira salendo, inspira scendendo",
            muscles: {
                primary: "Quadricipiti, Glutei",
                secondary: "Femorali"
            }
        }
    },
    "hack-squat": {
        execution: {
            steps: [
                "Posizionati sulla macchina con la schiena contro il pad",
                "Spalle sotto i cuscinetti, piedi sulla piattaforma",
                "Sblocca i fermi di sicurezza",
                "Scendi piegando le ginocchia",
                "Scendi fino a cosce parallele o più giù",
                "Spingi attraverso i piedi per risalire"
            ],
            tips: [
                "Movimento guidato per squat in sicurezza",
                "Piedi più in basso = più quadricipiti",
                "Piedi più in alto = più glutei e femorali"
            ],
            commonMistakes: [
                "Non completare il range di movimento",
                "Bloccare le ginocchia in alto",
                "Sollevare i talloni dalla piattaforma"
            ],
            breathing: "Inspira scendendo, espira salendo",
            muscles: {
                primary: "Quadricipiti",
                secondary: "Glutei"
            }
        }
    },
    "smith-squat": {
        execution: {
            steps: [
                "Posizionati sotto la Smith Machine con il bilanciere sulle spalle",
                "Piedi leggermente avanti rispetto al corpo",
                "Ruota la barra per sganciarla",
                "Scendi in squat piegando le ginocchia",
                "Scendi fino a cosce parallele",
                "Spingi verso l'alto e riaggancia"
            ],
            tips: [
                "Movimento guidato, buono per principianti",
                "Permette di concentrarsi sulle gambe senza preoccuparsi dell'equilibrio",
                "Puoi posizionare i piedi più avanti per diverso stimolo"
            ],
            commonMistakes: [
                "Piedi troppo sotto il corpo (stress sulle ginocchia)",
                "Non scendere abbastanza",
                "Non bloccare la barra correttamente dopo il set"
            ],
            breathing: "Inspira scendendo, espira salendo",
            muscles: {
                primary: "Quadricipiti",
                secondary: "Glutei"
            }
        }
    },
    "bodyweight-squat": {
        execution: {
            steps: [
                "In piedi con i piedi alla larghezza delle spalle",
                "Braccia davanti a te o incrociate al petto",
                "Scendi piegando le ginocchia come per sederti",
                "Mantieni il petto alto e la schiena dritta",
                "Scendi fino a cosce parallele o più giù",
                "Spingi attraverso i talloni per risalire"
            ],
            tips: [
                "Ottimo per riscaldamento, circuiti o principianti",
                "Concentrati sulla tecnica prima di aggiungere peso",
                "Le braccia avanti aiutano l'equilibrio"
            ],
            commonMistakes: [
                "Ginocchia che collassano verso l'interno",
                "Sollevare i talloni",
                "Piegarsi troppo in avanti"
            ],
            breathing: "Inspira scendendo, espira salendo",
            muscles: {
                primary: "Quadricipiti, Glutei",
                secondary: "Femorali, Core"
            }
        }
    },
    "jump-squat": {
        execution: {
            steps: [
                "In piedi con i piedi alla larghezza delle spalle",
                "Scendi in squat piegando le ginocchia",
                "Da posizione bassa, esplodi verso l'alto con un salto",
                "Usa le braccia per aiutarti nello slancio",
                "Atterra morbidamente sulle punte e poi i talloni",
                "Ammortizza atterrando in posizione di squat e ripeti"
            ],
            tips: [
                "Atterra sempre morbidamente per proteggere le articolazioni",
                "Ottimo per la potenza esplosiva delle gambe",
                "Puoi eseguirlo anche con manubri leggeri"
            ],
            commonMistakes: [
                "Atterrare rigidamente sulle ginocchia tese",
                "Non ammortizzare l'atterraggio",
                "Ginocchia che collassano verso l'interno"
            ],
            breathing: "Espira durante il salto, inspira atterrando",
            muscles: {
                primary: "Quadricipiti, Glutei",
                secondary: "Polpacci, Femorali"
            }
        }
    },
    "walking-lunge": {
        execution: {
            steps: [
                "In piedi con o senza manubri ai lati",
                "Fai un passo lungo in avanti",
                "Abbassati piegando entrambe le ginocchia a 90°",
                "Spingi attraverso il piede anteriore per portarti in avanti",
                "Il piede posteriore avanza per il passo successivo",
                "Continua camminando in avanti alternando le gambe"
            ],
            tips: [
                "Mantieni il busto eretto durante il cammino",
                "Passi lunghi e controllati",
                "Ottimo per coordinazione e resistenza delle gambe"
            ],
            commonMistakes: [
                "Passi troppo corti",
                "Perdere l'equilibrio laterale",
                "Piegarsi troppo in avanti"
            ],
            breathing: "Inspira nel passo, espira spingendo",
            muscles: {
                primary: "Quadricipiti, Glutei",
                secondary: "Femorali, Core"
            }
        }
    },
    "pistol-squat": {
        execution: {
            steps: [
                "In piedi su una gamba sola",
                "L'altra gamba tesa davanti a te",
                "Braccia in avanti per l'equilibrio",
                "Scendi lentamente su una gamba sola",
                "Scendi il più in basso possibile",
                "Spingi attraverso il piede per risalire senza aiutarti"
            ],
            tips: [
                "Esercizio molto avanzato che richiede forza, mobilità e equilibrio",
                "Progressione: inizia tenendoti a un supporto",
                "Puoi fare la versione su una panca come progressione"
            ],
            commonMistakes: [
                "Ginocchio che collassa verso l'interno",
                "Cadere indietro nella fase bassa",
                "Non avere sufficiente mobilità alla caviglia"
            ],
            breathing: "Inspira scendendo, espira salendo",
            muscles: {
                primary: "Quadricipiti, Glutei",
                secondary: "Core, Adduttori"
            }
        }
    },

    // ==========================================
    // FEMORALI - Esercizi aggiuntivi
    // ==========================================
    "stiff-leg-deadlift": {
        execution: {
            steps: [
                "In piedi con il bilanciere, piedi alla larghezza delle anche",
                "Gambe completamente tese (o con minima flessione)",
                "Abbassa il bilanciere lungo le gambe piegandoti alla vita",
                "Mantieni la schiena dritta durante tutto il movimento",
                "Scendi quanto la flessibilità permette",
                "Risali contraendo i femorali e i glutei"
            ],
            tips: [
                "Maggiore stretch dei femorali rispetto allo stacco rumeno",
                "Gambe più tese che nello stacco rumeno",
                "Usa un peso inferiore rispetto allo stacco convenzionale"
            ],
            commonMistakes: [
                "Arrotondare la schiena",
                "Tenere il bilanciere lontano dalle gambe",
                "Forzare la discesa oltre la propria flessibilità"
            ],
            breathing: "Inspira scendendo, espira salendo",
            muscles: {
                primary: "Femorali",
                secondary: "Glutei, Erettori spinali"
            }
        }
    },
    "good-morning": {
        execution: {
            steps: [
                "Bilanciere sulle spalle come nello squat",
                "Piedi alla larghezza delle anche, ginocchia leggermente flesse",
                "Piegati in avanti alla vita mantenendo la schiena dritta",
                "Abbassati fino a busto quasi parallelo al pavimento",
                "Contrai femorali e glutei per tornare in posizione eretta"
            ],
            tips: [
                "Inizia con poco peso per padroneggiare la tecnica",
                "Ottimo per rinforzare la catena posteriore",
                "La flessione delle ginocchia resta costante"
            ],
            commonMistakes: [
                "Arrotondare la schiena",
                "Scendere troppo in basso",
                "Usare troppo peso prima di avere la tecnica"
            ],
            breathing: "Inspira piegandoti, espira risalendo",
            muscles: {
                primary: "Femorali, Erettori spinali",
                secondary: "Glutei"
            }
        }
    },
    "dumbbell-rdl": {
        execution: {
            steps: [
                "In piedi con un manubrio per mano davanti alle cosce",
                "Piedi alla larghezza delle anche, ginocchia leggermente flesse",
                "Abbassa i manubri lungo le gambe spingendo i fianchi indietro",
                "Mantieni la schiena dritta",
                "Scendi fino a sentire lo stretch nei femorali",
                "Risali contraendo glutei e femorali"
            ],
            tips: [
                "Permette maggiore range di movimento rispetto al bilanciere",
                "I manubri si muovono ai lati delle gambe",
                "Ottima alternativa per chi ha problemi con il bilanciere"
            ],
            commonMistakes: [
                "Arrotondare la schiena",
                "Piegare troppo le ginocchia",
                "Non sentire lo stretch nei femorali"
            ],
            breathing: "Inspira scendendo, espira salendo",
            muscles: {
                primary: "Femorali, Glutei",
                secondary: "Erettori spinali"
            }
        }
    },
    "single-leg-rdl": {
        execution: {
            steps: [
                "In piedi su una gamba sola con un manubrio nella mano opposta",
                "L'altra gamba leggermente sollevata dietro di te",
                "Piegati alla vita abbassando il manubrio verso il pavimento",
                "La gamba posteriore si alza per controbilanciare",
                "Mantieni la schiena dritta",
                "Risali contraendo glutei e femorali"
            ],
            tips: [
                "Ottimo per equilibrio e forza unilaterale",
                "Il manubrio nella mano opposta alla gamba d'appoggio",
                "Tieniti a un supporto se necessario per imparare"
            ],
            commonMistakes: [
                "Perdere l'equilibrio",
                "Arrotondare la schiena",
                "Ruotare i fianchi durante il movimento"
            ],
            breathing: "Inspira scendendo, espira salendo",
            muscles: {
                primary: "Femorali, Glutei",
                secondary: "Core, Erettori spinali"
            }
        }
    },
    "leg-curl-seated": {
        execution: {
            steps: [
                "Siediti alla macchina con la schiena appoggiata",
                "Posiziona le gambe sopra il cuscinetto, caviglie davanti al rullo",
                "Regola il cuscinetto sulle cosce per bloccarle",
                "Curla le gambe portando i talloni sotto la seduta",
                "Contrai i femorali in posizione contratta",
                "Torna controllando alla posizione iniziale"
            ],
            tips: [
                "Variante comoda che non stressa la schiena",
                "Concentrati sulla contrazione dei femorali",
                "Puoi puntare le dita per diversa attivazione"
            ],
            commonMistakes: [
                "Usare troppo peso e non completare il ROM",
                "Movimento troppo veloce",
                "Non controllare la fase eccentrica"
            ],
            breathing: "Espira curlando, inspira estendendo",
            muscles: {
                primary: "Femorali",
                secondary: "Gastrocnemio"
            }
        }
    },
    "nordic-curl": {
        execution: {
            steps: [
                "In ginocchio con i piedi bloccati sotto un supporto",
                "Corpo eretto dalla testa alle ginocchia",
                "Abbassati lentamente in avanti usando solo i femorali",
                "Resisti alla gravità il più a lungo possibile",
                "Quando non riesci più a controllare, usa le mani per attutire",
                "Aiutati con le mani per risalire nella fase iniziale"
            ],
            tips: [
                "Esercizio molto avanzato, inizia con assistenza",
                "Concentrati sulla fase eccentrica (discesa controllata)",
                "Eccellente per la prevenzione infortuni ai femorali"
            ],
            commonMistakes: [
                "Piegarsi alla vita invece di mantenere il corpo dritto",
                "Scendere troppo velocemente senza controllo",
                "Non usare progressioni adeguate"
            ],
            breathing: "Inspira scendendo, espira risalendo",
            muscles: {
                primary: "Femorali",
                secondary: "Glutei, Core"
            }
        }
    },
    "glute-ham-raise": {
        execution: {
            steps: [
                "Posizionati sulla GHD con i piedi bloccati, ginocchia sul cuscinetto",
                "Corpo in posizione orizzontale",
                "Abbassati in avanti estendendo le ginocchia",
                "Usa femorali e glutei per risalire curlando il corpo",
                "Torna alla posizione orizzontale contraendo la catena posteriore"
            ],
            tips: [
                "Eccellente per la catena posteriore completa",
                "Combina estensione dell'anca e flessione del ginocchio",
                "Puoi usare assistenza con un elastico"
            ],
            commonMistakes: [
                "Usare troppo slancio",
                "Non controllare la discesa",
                "Non avere sufficiente forza per il movimento completo"
            ],
            breathing: "Inspira scendendo, espira risalendo",
            muscles: {
                primary: "Femorali, Glutei",
                secondary: "Erettori spinali"
            }
        }
    },

    // ==========================================
    // GLUTEI - Esercizi aggiuntivi
    // ==========================================
    "sumo-deadlift": {
        execution: {
            steps: [
                "Piedi molto larghi, punte ruotate verso l'esterno (45°+)",
                "Afferra il bilanciere con presa stretta tra le gambe",
                "Abbassa i fianchi, petto in fuori, schiena dritta",
                "Spingi il pavimento con i piedi sollevando il bilanciere",
                "Estendi anche e ginocchia contemporaneamente",
                "Contrai i glutei in alto"
            ],
            tips: [
                "Più enfasi su glutei, adduttori e quadricipiti rispetto allo stacco convenzionale",
                "Richiede buona mobilità delle anche",
                "Il bilanciere viaggia su un percorso più corto"
            ],
            commonMistakes: [
                "Le ginocchia collassano verso l'interno",
                "I fianchi salgono troppo velocemente",
                "Arrotondare la schiena"
            ],
            breathing: "Inspira prima di sollevare, espira in alto",
            muscles: {
                primary: "Glutei, Quadricipiti, Adduttori",
                secondary: "Femorali, Erettori spinali"
            }
        }
    },
    "dumbbell-hip-thrust": {
        execution: {
            steps: [
                "Schiena contro una panca, un manubrio sui fianchi",
                "Piedi a terra, ginocchia piegate a 90°",
                "Spingi attraverso i talloni sollevando i fianchi",
                "Contrai i glutei in alto",
                "Abbassa controllando quasi a terra"
            ],
            tips: [
                "Buona alternativa al bilanciere per principianti",
                "Più facile da posizionare rispetto al bilanciere",
                "Concentrati sulla contrazione dei glutei"
            ],
            commonMistakes: [
                "Iperestendere la schiena",
                "Non contrarre abbastanza i glutei in alto",
                "Il manubrio che scivola"
            ],
            breathing: "Espira sollevando, inspira abbassando",
            muscles: {
                primary: "Grande gluteo",
                secondary: "Femorali"
            }
        }
    },
    "glute-kickback-machine": {
        execution: {
            steps: [
                "Posizionati alla macchina con il petto sul cuscinetto",
                "Un piede sulla piattaforma, l'altro contro il pad posteriore",
                "Spingi la gamba all'indietro estendendo l'anca",
                "Contrai il gluteo in alto",
                "Torna controllando alla posizione iniziale"
            ],
            tips: [
                "Ottimo isolamento del gluteo",
                "Non arcuare la schiena",
                "Concentrati sulla contrazione, non sul peso"
            ],
            commonMistakes: [
                "Arcuare la schiena per compensare",
                "Usare troppo peso perdendo l'isolamento",
                "Non completare il range di movimento"
            ],
            breathing: "Espira spingendo, inspira tornando",
            muscles: {
                primary: "Grande gluteo",
                secondary: "Femorali"
            }
        }
    },
    "hip-abduction": {
        execution: {
            steps: [
                "Siediti alla macchina con le gambe all'interno dei cuscinetti",
                "Schiena appoggiata allo schienale",
                "Apri le gambe spingendo contro i cuscinetti",
                "Contrai i glutei e gli abduttori in posizione aperta",
                "Torna controllando alla posizione chiusa"
            ],
            tips: [
                "Lavora il gluteo medio e il piccolo gluteo",
                "Puoi inclinarti leggermente in avanti per diverso stimolo",
                "Ottimo per la stabilità dell'anca"
            ],
            commonMistakes: [
                "Usare troppo peso con ROM limitato",
                "Far sbattere i pesi tra le rep",
                "Non controllare la fase eccentrica (chiusura)"
            ],
            breathing: "Espira aprendo, inspira chiudendo",
            muscles: {
                primary: "Gluteo medio, Gluteo piccolo",
                secondary: "Tensore della fascia lata"
            }
        }
    },
    "single-leg-glute-bridge": {
        execution: {
            steps: [
                "Sdraiato supino, una gamba piegata con piede a terra",
                "L'altra gamba distesa in aria o piegata al petto",
                "Spingi attraverso il tallone della gamba a terra",
                "Solleva i fianchi contraendo il gluteo",
                "Mantieni il bacino livellato, non ruotare",
                "Abbassa controllando"
            ],
            tips: [
                "Versione più intensa del glute bridge classico",
                "Ottimo per correggere squilibri tra i lati",
                "Mantieni il core contratto per non ruotare"
            ],
            commonMistakes: [
                "Ruotare il bacino verso un lato",
                "Non contrarre il gluteo in alto",
                "Iperestendere la schiena"
            ],
            breathing: "Espira sollevando, inspira abbassando",
            muscles: {
                primary: "Grande gluteo",
                secondary: "Core, Femorali"
            }
        }
    },
    "donkey-kick": {
        execution: {
            steps: [
                "A quattro zampe, mani sotto le spalle, ginocchia sotto i fianchi",
                "Mantieni il ginocchio piegato a 90°",
                "Spingi un piede verso il soffitto",
                "Contrai il gluteo in alto",
                "Il movimento viene dall'anca, non dalla schiena",
                "Torna controllando alla posizione iniziale"
            ],
            tips: [
                "Non arcuare la schiena durante il movimento",
                "Concentrati sulla contrazione del gluteo",
                "Puoi aggiungere una cavigliera con peso per più resistenza"
            ],
            commonMistakes: [
                "Arcuare la schiena per alzare di più la gamba",
                "Usare lo slancio invece della contrazione",
                "Non contrarre il gluteo in alto"
            ],
            breathing: "Espira sollevando, inspira abbassando",
            muscles: {
                primary: "Grande gluteo",
                secondary: "Femorali, Core"
            }
        }
    },
    "fire-hydrant": {
        execution: {
            steps: [
                "A quattro zampe, mani sotto le spalle, ginocchia sotto i fianchi",
                "Mantieni il ginocchio piegato a 90°",
                "Solleva lateralmente la gamba mantenendo l'angolo del ginocchio",
                "Solleva fino all'altezza dell'anca",
                "Contrai il gluteo laterale in alto",
                "Torna controllando"
            ],
            tips: [
                "Lavora specificamente il gluteo medio",
                "Non ruotare il busto durante il movimento",
                "Puoi usare una banda elastica per più resistenza"
            ],
            commonMistakes: [
                "Ruotare il busto per aiutare il sollevamento",
                "Non sollevare abbastanza in alto",
                "Usare lo slancio invece della contrazione"
            ],
            breathing: "Espira sollevando, inspira abbassando",
            muscles: {
                primary: "Gluteo medio",
                secondary: "Gluteo piccolo, Core"
            }
        }
    },

    // ==========================================
    // POLPACCI - Esercizi aggiuntivi
    // ==========================================
    "leg-press-calf-raise": {
        execution: {
            steps: [
                "Siediti alla leg press con solo le punte dei piedi sulla piattaforma",
                "Sblocca la piattaforma",
                "Estendi le caviglie spingendo con le punte",
                "Contrai i polpacci in alto",
                "Abbassa controllando lasciando cadere i talloni",
                "Mantieni le ginocchia quasi completamente estese"
            ],
            tips: [
                "Permette di usare carichi molto pesanti in sicurezza",
                "Range di movimento completo è fondamentale",
                "Ottima alternativa alla macchina per calf raise"
            ],
            commonMistakes: [
                "Range di movimento troppo limitato",
                "Piegare le ginocchia durante il movimento",
                "Far rimbalzare il peso in basso"
            ],
            breathing: "Espira spingendo, inspira abbassando",
            muscles: {
                primary: "Gastrocnemio, Soleo",
                secondary: "Nessuno"
            }
        }
    },
    "bodyweight-calf-raise": {
        execution: {
            steps: [
                "In piedi su un gradino o rialzo con le punte dei piedi",
                "Talloni nel vuoto",
                "Abbassa i talloni sotto il livello del gradino per stretch",
                "Sollèvati sulle punte contraendo i polpacci",
                "Mantieni la contrazione in alto per un secondo",
                "Abbassa controllando fino a stretch completo"
            ],
            tips: [
                "Range di movimento completo è la chiave",
                "Scendi sotto il parallelo per massimo stretch",
                "Tieniti a un supporto per l'equilibrio se necessario"
            ],
            commonMistakes: [
                "Range di movimento troppo limitato",
                "Movimento troppo veloce senza controllo",
                "Non scendere abbastanza in basso per lo stretch"
            ],
            breathing: "Espira sollevandoti, inspira abbassandoti",
            muscles: {
                primary: "Gastrocnemio",
                secondary: "Soleo"
            }
        }
    },
    "single-leg-calf-raise": {
        execution: {
            steps: [
                "In piedi su un gradino su una gamba sola",
                "L'altra gamba sollevata o appoggiata dietro la caviglia",
                "Abbassa il tallone per stretch completo",
                "Sollèvati sulla punta contraendo il polpaccio",
                "Mantieni in alto per un secondo",
                "Abbassa controllando"
            ],
            tips: [
                "Raddoppia l'intensità rispetto alla versione bilaterale",
                "Tieniti a un supporto per l'equilibrio",
                "Ottimo per correggere squilibri tra i polpacci"
            ],
            commonMistakes: [
                "Perdere l'equilibrio",
                "ROM limitato",
                "Usare lo slancio"
            ],
            breathing: "Espira sollevandoti, inspira abbassandoti",
            muscles: {
                primary: "Gastrocnemio",
                secondary: "Soleo"
            }
        }
    },

    // ==========================================
    // ADDOME - Esercizi aggiuntivi
    // ==========================================
    "reverse-crunch": {
        execution: {
            steps: [
                "Sdraiato supino con le mani ai lati o sotto i glutei",
                "Ginocchia piegate a 90°, piedi sollevati",
                "Solleva il bacino da terra portando le ginocchia verso il petto",
                "Arrotonda la parte bassa della schiena sollevandola",
                "Abbassa controllando senza toccare i piedi a terra"
            ],
            tips: [
                "Enfatizza la parte bassa degli addominali",
                "Il movimento viene dal bacino, non dalle gambe",
                "Mantieni il collo rilassato"
            ],
            commonMistakes: [
                "Usare lo slancio delle gambe",
                "Non sollevare il bacino (solo le ginocchia si muovono)",
                "Movimento troppo veloce"
            ],
            breathing: "Espira sollevando il bacino, inspira abbassando",
            muscles: {
                primary: "Retto addominale (parte inferiore)",
                secondary: "Obliqui"
            }
        }
    },
    "side-plank": {
        execution: {
            steps: [
                "Sdraiati su un fianco con il gomito sotto la spalla",
                "Piedi sovrapposti o uno davanti all'altro",
                "Solleva i fianchi formando una linea retta",
                "Mantieni la posizione per il tempo desiderato",
                "Il braccio libero lungo il corpo o verso il soffitto"
            ],
            tips: [
                "Lavora specificamente gli obliqui e la stabilità laterale",
                "Mantieni i fianchi alti, non lasciarli cadere",
                "Puoi aggiungere movimento (dip dei fianchi) per più difficoltà"
            ],
            commonMistakes: [
                "Fianchi che cadono verso il pavimento",
                "Ruotare il busto in avanti o indietro",
                "Trattenere il respiro"
            ],
            breathing: "Respira normalmente durante il mantenimento",
            muscles: {
                primary: "Obliqui",
                secondary: "Retto addominale, Gluteo medio"
            }
        }
    },
    "mountain-climber": {
        execution: {
            steps: [
                "In posizione di plank alto (braccia tese)",
                "Porta rapidamente un ginocchio al petto",
                "Riporta il piede indietro e contemporaneamente porta l'altro ginocchio al petto",
                "Alterna le gambe in modo rapido e ritmico",
                "Mantieni i fianchi bassi e il core contratto"
            ],
            tips: [
                "Ottimo anche come cardio ad alta intensità",
                "Mantieni la schiena dritta, non sollevare i glutei",
                "Puoi variare la velocità per diversa intensità"
            ],
            commonMistakes: [
                "Sollevare i glutei in alto",
                "Perdere la posizione di plank",
                "Movimento troppo lento per l'effetto cardio"
            ],
            breathing: "Respira ritmicamente durante il movimento",
            muscles: {
                primary: "Retto addominale, Flessori dell'anca",
                secondary: "Spalle, Quadricipiti"
            }
        }
    },
    "leg-raise": {
        execution: {
            steps: [
                "Sdraiato supino con le mani sotto i glutei o ai lati",
                "Gambe distese e unite",
                "Solleva le gambe tese verso il soffitto",
                "Fermati quando le gambe sono perpendicolari al pavimento",
                "Abbassa controllando senza toccare il pavimento"
            ],
            tips: [
                "Mantieni la zona lombare premuta a terra",
                "Se troppo difficile, piega leggermente le ginocchia",
                "Non oscillare le gambe, movimento controllato"
            ],
            commonMistakes: [
                "Staccare la zona lombare dal pavimento",
                "Usare lo slancio delle gambe",
                "Non controllare la discesa"
            ],
            breathing: "Espira sollevando, inspira abbassando",
            muscles: {
                primary: "Retto addominale (parte inferiore)",
                secondary: "Flessori dell'anca"
            }
        }
    },
    "bicycle-crunch": {
        execution: {
            steps: [
                "Sdraiato supino con le mani dietro la testa",
                "Solleva le spalle da terra",
                "Porta il gomito destro verso il ginocchio sinistro ruotando il busto",
                "Contemporaneamente distendi la gamba destra",
                "Alterna portando il gomito sinistro al ginocchio destro",
                "Continua alternando in modo fluido"
            ],
            tips: [
                "Lavora sia il retto addominale che gli obliqui",
                "La rotazione deve venire dal busto, non dalle braccia",
                "Mantieni la parte bassa della schiena a terra"
            ],
            commonMistakes: [
                "Tirare la testa con le mani",
                "Muovere solo le braccia senza ruotare il busto",
                "Movimento troppo veloce perdendo la contrazione"
            ],
            breathing: "Espira ad ogni rotazione",
            muscles: {
                primary: "Retto addominale, Obliqui",
                secondary: "Flessori dell'anca"
            }
        }
    },
    "dead-bug": {
        execution: {
            steps: [
                "Sdraiato supino con braccia distese verso il soffitto",
                "Ginocchia piegate a 90° con le anche a 90°",
                "Premi la zona lombare a terra",
                "Estendi simultaneamente il braccio destro e la gamba sinistra",
                "Torna alla posizione iniziale",
                "Ripeti con il lato opposto"
            ],
            tips: [
                "Ottimo per la stabilità del core",
                "La zona lombare deve restare a terra durante tutto il movimento",
                "Movimento lento e controllato"
            ],
            commonMistakes: [
                "Staccare la zona lombare dal pavimento",
                "Muoversi troppo velocemente",
                "Non coordinare braccio e gamba opposti"
            ],
            breathing: "Espira estendendo, inspira tornando",
            muscles: {
                primary: "Retto addominale, Trasverso",
                secondary: "Core stabilizzatori"
            }
        }
    },
    "v-up": {
        execution: {
            steps: [
                "Sdraiato supino con braccia distese sopra la testa",
                "Gambe distese a terra",
                "Solleva contemporaneamente gambe e busto",
                "Cerca di toccare le punte dei piedi con le mani",
                "Il corpo forma una V",
                "Abbassa controllando alla posizione iniziale"
            ],
            tips: [
                "Movimento esplosivo ma controllato",
                "Se troppo difficile, inizia con le ginocchia piegate",
                "Concentrati sulla contrazione addominale"
            ],
            commonMistakes: [
                "Usare slancio invece della contrazione",
                "Non sollevare abbastanza per formare la V",
                "Arrotondare eccessivamente la schiena"
            ],
            breathing: "Espira salendo, inspira scendendo",
            muscles: {
                primary: "Retto addominale",
                secondary: "Flessori dell'anca"
            }
        }
    },
    "ab-wheel-rollout": {
        execution: {
            steps: [
                "In ginocchio con la ruota per addominali sotto le spalle",
                "Core contratto, schiena dritta",
                "Rotola la ruota in avanti distendendo il corpo",
                "Vai il più lontano possibile mantenendo la schiena dritta",
                "Usa gli addominali per riportare la ruota alla posizione iniziale"
            ],
            tips: [
                "Esercizio avanzato, inizia con un range ridotto",
                "Non arcuare MAI la schiena",
                "Progressione: in ginocchio → in piedi"
            ],
            commonMistakes: [
                "Arcuare la schiena durante l'estensione",
                "Andare troppo avanti senza sufficiente forza",
                "Non contrarre il core durante tutto il movimento"
            ],
            breathing: "Inspira rotolando in avanti, espira tornando",
            muscles: {
                primary: "Retto addominale",
                secondary: "Spalle, Dorsali, Core"
            }
        }
    },
    "cable-crunch": {
        execution: {
            steps: [
                "In ginocchio davanti al cavo alto con attacco a corda",
                "Tieni la corda ai lati della testa",
                "Fletti il busto verso il basso contraendo gli addominali",
                "Porta le costole verso il bacino",
                "Torna controllando alla posizione iniziale"
            ],
            tips: [
                "Permette di aggiungere resistenza progressiva al crunch",
                "Il movimento viene dall'addome, non dalle anche",
                "Mantieni i fianchi fermi"
            ],
            commonMistakes: [
                "Sedersi sui talloni (flessione delle anche, non addome)",
                "Tirare con le braccia invece del core",
                "Non controllare la fase eccentrica"
            ],
            breathing: "Espira flettendo, inspira tornando",
            muscles: {
                primary: "Retto addominale",
                secondary: "Obliqui"
            }
        }
    },
    "cable-woodchop": {
        execution: {
            steps: [
                "In piedi di fianco al cavo alto",
                "Afferra la maniglia con entrambe le mani",
                "Piedi alla larghezza delle spalle, ginocchia leggermente flesse",
                "Ruota il busto tirando il cavo dall'alto verso il basso in diagonale",
                "Il movimento finisce all'altezza dell'anca opposta",
                "Torna controllando alla posizione iniziale"
            ],
            tips: [
                "La rotazione viene dal core, le braccia guidano solo",
                "Ottimo per gli obliqui e i movimenti rotazionali",
                "Puoi anche eseguirlo dal basso verso l'alto"
            ],
            commonMistakes: [
                "Usare le braccia invece del core per il movimento",
                "Non ruotare i piedi durante la rotazione",
                "Movimento troppo veloce senza controllo"
            ],
            breathing: "Espira durante la rotazione, inspira tornando",
            muscles: {
                primary: "Obliqui",
                secondary: "Retto addominale, Spalle"
            }
        }
    },
    "ab-crunch-machine": {
        execution: {
            steps: [
                "Siediti alla macchina con i piedi sotto i rulli",
                "Afferra le maniglie sopra le spalle",
                "Fletti il busto in avanti contraendo gli addominali",
                "Contrai in posizione di massima flessione",
                "Torna controllando alla posizione iniziale"
            ],
            tips: [
                "Movimento guidato e isolato",
                "Permette di aggiungere peso progressivamente",
                "Concentrati sulla contrazione addominale"
            ],
            commonMistakes: [
                "Usare le braccia per tirare invece dell'addome",
                "Movimento troppo veloce",
                "Far sbattere i pesi tra le rep"
            ],
            breathing: "Espira flettendo, inspira tornando",
            muscles: {
                primary: "Retto addominale",
                secondary: "Obliqui"
            }
        }
    },

    // ==========================================
    // AVAMBRACCI
    // ==========================================
    "wrist-curl": {
        execution: {
            steps: [
                "Seduto con gli avambracci appoggiati sulle cosce, palmi verso l'alto",
                "Tieni i manubri con le mani oltre le ginocchia",
                "Lascia cadere i polsi verso il basso per lo stretch",
                "Curla i polsi verso l'alto contraendo gli avambracci",
                "Contrai in alto",
                "Abbassa controllando"
            ],
            tips: [
                "Movimento piccolo e controllato",
                "Concentrati sulla contrazione dei flessori del polso",
                "Puoi usare anche un bilanciere"
            ],
            commonMistakes: [
                "Muovere gli avambracci dalle cosce",
                "Range di movimento troppo limitato",
                "Usare troppo peso"
            ],
            breathing: "Espira curlando, inspira abbassando",
            muscles: {
                primary: "Flessori del polso",
                secondary: "Avambraccio"
            }
        }
    },
    "reverse-wrist-curl": {
        execution: {
            steps: [
                "Seduto con gli avambracci appoggiati sulle cosce, palmi verso il basso",
                "Tieni i manubri con le mani oltre le ginocchia",
                "Lascia cadere i polsi verso il basso",
                "Solleva i polsi verso l'alto estendendo",
                "Contrai in alto",
                "Abbassa controllando"
            ],
            tips: [
                "Lavora gli estensori del polso",
                "Usa un peso più leggero rispetto ai wrist curl normali",
                "Ottimo per prevenire infortuni al polso"
            ],
            commonMistakes: [
                "Usare troppo peso",
                "Muovere gli avambracci",
                "Range di movimento limitato"
            ],
            breathing: "Espira sollevando, inspira abbassando",
            muscles: {
                primary: "Estensori del polso",
                secondary: "Avambraccio"
            }
        }
    },
    "farmer-walk": {
        execution: {
            steps: [
                "In piedi con un manubrio pesante per mano ai lati",
                "Spalle indietro e in basso, petto in fuori",
                "Core contratto, postura eretta",
                "Cammina con passi corti e controllati",
                "Mantieni la presa salda durante tutto il percorso",
                "Continua per la distanza o il tempo indicato"
            ],
            tips: [
                "Ottimo per grip, core e stabilità complessiva",
                "Usa i pesi più pesanti che riesci a tenere",
                "Cammina dritto con passi corti"
            ],
            commonMistakes: [
                "Inclinarsi da un lato",
                "Passi troppo lunghi che causano oscillazione",
                "Sollevare le spalle verso le orecchie"
            ],
            breathing: "Respira normalmente e costantemente durante la camminata",
            muscles: {
                primary: "Avambracci (presa), Trapezio",
                secondary: "Core, Spalle, Gambe"
            }
        }
    },
    "dead-hang": {
        execution: {
            steps: [
                "Afferra la sbarra con presa prona alla larghezza delle spalle",
                "Lasciati pendere con braccia completamente distese",
                "Mantieni le spalle attive (non lasciarle salire alle orecchie)",
                "Rimani appeso il più a lungo possibile",
                "Scendi quando la presa cede"
            ],
            tips: [
                "Ottimo per il grip e la decompressione della colonna vertebrale",
                "Puoi usare presa diversa (supina, neutra) per variare",
                "Prova ad aggiungere tempo ogni sessione"
            ],
            commonMistakes: [
                "Spalle completamente passive (rischio lussazione)",
                "Oscillare il corpo",
                "Non trattenere abbastanza a lungo per un effetto allenante"
            ],
            breathing: "Respira normalmente durante l'esercizio",
            muscles: {
                primary: "Avambracci (presa)",
                secondary: "Grande dorsale, Spalle"
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
        gifUrl: "https://gymvisual.com/img/p/1/0/7/5/2/10752.gif",
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
        gifUrl: "https://gymvisual.com/img/p/9/1/8/2/9182.gif",
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
        gifUrl: "https://gymvisual.com/img/p/6/7/0/6/6706.gif",
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
        gifUrl: "https://gymvisual.com/img/p/7/0/7/1/7071.gif",
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
        gifUrl: "https://gymvisual.com/img/p/9/0/3/1/9031.gif",
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
        gifUrl: "https://gymvisual.com/img/p/1/9/8/5/7/19857.gif",
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
        gifUrl: "https://gymvisual.com/img/p/1/6/8/9/2/16892.gif",
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
        gifUrl: "https://gymvisual.com/img/p/6/6/1/3/6613.gif",
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
        gifUrl: "https://gymvisual.com/img/p/5/1/8/2/5182.gif",
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
    },
    "Lat Stretch Dinamico": {
        gifUrl: "https://gymvisual.com/img/p/3/3/1/4/5/33145.gif",
        execution: {
            steps: [
                "In piedi vicino a un supporto (muro, rack)",
                "Afferra il supporto con una mano",
                "Lasciati cadere lateralmente allungando il lato",
                "Oscilla leggermente avanti e indietro"
            ],
            tips: [
                "Movimento dinamico, non statico",
                "Senti lo stretch nel dorsale"
            ]
        }
    },
    "Dynamic Bicep Stretch": {
        gifUrl: "https://gymvisual.com/img/p/9/0/9/5/9095.gif",
        execution: {
            steps: [
                "In piedi, porta le braccia dietro la schiena",
                "Intreccia le dita con i palmi verso l'interno",
                "Solleva le braccia allontanandole dal corpo",
                "Movimento dinamico, su e giù"
            ],
            tips: [
                "Mantieni le braccia dritte",
                "Senti lo stretch nei bicipiti e nelle spalle anteriori"
            ]
        }
    },
    "Arm Circles Progressivi": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/07/Arm-Circles_Shoulders.gif",
        execution: {
            steps: ["In piedi con le braccia distese ai lati", "Inizia con piccoli cerchi in avanti", "Aumenta progressivamente il diametro", "Inverti la direzione dopo 15 secondi"],
            tips: ["Parti con cerchi piccoli e aumenta gradualmente", "Ottimo per scaldare la cuffia dei rotatori"]
        }
    },
    "Shoulder Dislocates": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2022/02/Shoulder-Dislocate.gif",
        execution: {
            steps: ["Afferra un bastone o elastico con presa larga", "Braccia distese davanti a te", "Porta il bastone sopra la testa e dietro la schiena", "Torna controllando alla posizione iniziale"],
            tips: ["Usa una presa abbastanza larga da non forzare", "Movimento lento e controllato"]
        }
    },
    "External Rotation": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2022/03/Dumbbell-Lying-External-Shoulder-Rotation.gif",
        execution: {
            steps: ["Gomito a 90° aderente al fianco", "Ruota l'avambraccio verso l'esterno", "Mantieni il gomito fermo", "Torna controllando"],
            tips: ["Usa un peso leggero o un elastico", "Fondamentale per la salute della cuffia dei rotatori"]
        }
    },
    "Y-T-W Raises": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2022/02/Prone-Y-Raise.gif",
        execution: {
            steps: ["Prono su panca inclinata o in piedi piegato in avanti", "Y: braccia sopra la testa a 45°", "T: braccia laterali a 90°", "W: gomiti piegati, braccia a W"],
            tips: ["Senza peso o con peso molto leggero", "Ottimo per attivare trapezio e cuffia dei rotatori"]
        }
    },
    "Empty Can Exercise": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2022/02/Empty-Can-Exercise.gif",
        execution: {
            steps: ["In piedi, braccia ai lati", "Solleva le braccia a 45° con pollici verso il basso", "Come se svuotassi una lattina", "Abbassa controllando"],
            tips: ["Peso leggero o senza peso", "Attiva il sovraspinato della cuffia dei rotatori"]
        }
    },
    "Scapular Pull-Ups": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2022/02/Scapular-Pull-Up.gif",
        execution: {
            steps: ["Appeso alla sbarra, braccia distese", "Senza piegare i gomiti, tira le scapole verso il basso", "Solleva il corpo di pochi cm", "Rilascia controllando"],
            tips: ["Movimento piccolo ma controllato", "Attiva i dorsali e la stabilità scapolare"]
        }
    },
    "Band Face Pull": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Band-Face-Pull.gif",
        execution: {
            steps: ["Fissa l'elastico all'altezza del viso", "Tira verso il viso separando le mani", "Gomiti alti, ruota le mani verso l'esterno", "Contrai scapole e deltoidi posteriori"],
            tips: ["Ottimo per postura e salute delle spalle", "Mantieni i gomiti sopra le spalle"]
        }
    },
    "Thoracic Extension": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2022/08/Thoracic-Extension-on-Foam-Roller.gif",
        execution: {
            steps: ["Sdraiato su un foam roller posizionato alla parte alta della schiena", "Mani dietro la testa", "Estendi la schiena sopra il rullo", "Torna alla posizione iniziale"],
            tips: ["Non estendere la zona lombare", "Concentrati sulla parte toracica"]
        }
    },
    "Wrist Circles": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/09/Wrist-Circles.gif",
        execution: {
            steps: ["Intreccia le dita delle mani", "Ruota i polsi in cerchio", "Fai cerchi in entrambe le direzioni", "10-15 cerchi per direzione"],
            tips: ["Movimento fluido e controllato", "Ottimo prima di esercizi di presa"]
        }
    },
    "Light Band Curls": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/06/Resistance-Band-Bicep-Curl.gif",
        execution: {
            steps: ["In piedi sull'elastico, impugnalo con entrambe le mani", "Curl classico con resistenza leggera", "Contrai i bicipiti in alto", "Abbassa controllando"],
            tips: ["Usa resistenza leggera, serve solo per attivare", "15-20 ripetizioni veloci"]
        }
    },
    "Light Band Pushdowns": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/06/Resistance-Band-Pushdown.gif",
        execution: {
            steps: ["Fissa l'elastico in alto", "Impugna con entrambe le mani, gomiti al fianco", "Estendi le braccia verso il basso", "Torna controllando"],
            tips: ["Resistenza leggera per attivazione", "Mantieni i gomiti fermi al fianco"]
        }
    },
    "Tricep Stretch Dinamico": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2022/02/Triceps-Stretch.gif",
        execution: {
            steps: ["Porta un braccio sopra la testa", "Piega il gomito portando la mano dietro la nuca", "Con l'altra mano spingi leggermente il gomito", "Alterna i lati in modo dinamico"],
            tips: ["Movimento fluido, non statico", "Non forzare troppo il gomito"]
        }
    },
    "Diamond Push-Ups (ginocchia)": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Diamond-Push-up.gif",
        execution: {
            steps: ["Ginocchia a terra, mani unite a diamante sotto il petto", "Abbassa il petto verso le mani", "Spingi tornando su", "Mantieni il core attivo"],
            tips: ["Le ginocchia facilitano il movimento", "Focus sui tricipiti"]
        }
    },
    "Push-Ups (ginocchia se necessario)": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Push-Up.gif",
        execution: {
            steps: ["Posizione plank, mani alla larghezza delle spalle", "Abbassa il petto verso il pavimento", "Spingi tornando alla posizione iniziale", "Ginocchia a terra se necessario"],
            tips: ["Mantieni il core attivo", "Corpo in linea retta dalla testa ai piedi"]
        }
    },
    "Superman Hold": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/02/superman-exercise.gif",
        execution: {
            steps: ["Sdraiato a pancia in giù, braccia distese davanti", "Solleva braccia, petto e gambe da terra", "Contrai glutei e schiena", "Mantieni la posizione"],
            tips: ["Non iperestendere il collo", "Ottimo per erettori spinali e glutei"]
        }
    },
    "Camminata sul Posto": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2022/02/March-in-Place.gif",
        execution: {
            steps: ["In piedi, inizia a camminare sul posto", "Solleva le ginocchia a un'altezza comoda", "Pompa le braccia naturalmente", "Mantieni un ritmo costante"],
            tips: ["Ottimo per alzare la frequenza cardiaca gradualmente", "Atterra morbido"]
        }
    },
    "Camminata Leggera": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2022/02/March-in-Place.gif",
        execution: {
            steps: ["Cammina a passo leggero", "Muovi le braccia naturalmente", "Respira profondamente", "2-3 minuti per alzare il battito"],
            tips: ["Non serve velocità, solo attivazione", "Ottimo come warm-up iniziale"]
        }
    },
    "Camminata/Corsa Leggera": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2022/02/March-in-Place.gif",
        execution: {
            steps: ["Inizia camminando e aumenta gradualmente il ritmo", "Passa a una corsa leggera se possibile", "Mantieni per 3-5 minuti", "Obiettivo: alzare la frequenza cardiaca"],
            tips: ["Non è uno sprint, mantieni un ritmo confortevole", "Respira regolarmente"]
        }
    },
    "Quad Stretch Dinamico": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/08/Standing-Quadriceps-Stretch.gif",
        execution: {
            steps: ["In piedi, afferra una caviglia portando il tallone al gluteo", "Mantieni 2-3 secondi", "Rilascia e alterna gamba", "Movimento dinamico, non statico"],
            tips: ["Tieniti a un supporto se necessario", "Mantieni le ginocchia vicine"]
        }
    },
    "Goblet Squat Paused": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/08/Dumbbell-Goblet-Squat.gif",
        execution: {
            steps: ["Tieni un manubrio leggero o nessun peso al petto", "Scendi in squat profondo", "Mantieni la posizione bassa per 3-5 secondi", "Spingi i gomiti dentro le ginocchia per aprire le anche"],
            tips: ["Ottimo per mobilità delle anche", "Mantieni il petto alto"]
        }
    },
    "Good Mornings a Corpo Libero": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Good-Morning.gif",
        execution: {
            steps: ["In piedi, mani dietro la testa o incrociate al petto", "Piegati in avanti dalle anche mantenendo la schiena dritta", "Scendi fino a sentire lo stretch nei femorali", "Risali contraendo glutei e femorali"],
            tips: ["Ginocchia leggermente piegate", "Non arrotondare la schiena"]
        }
    },
    "Single Leg RDL Senza Peso": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/09/Dumbbell-Single-Leg-Deadlift.gif",
        execution: {
            steps: ["In piedi su una gamba", "Piegati in avanti estendendo l'altra gamba dietro", "Braccia verso il pavimento per equilibrio", "Torna alla posizione eretta"],
            tips: ["Mantieni la schiena dritta", "Ottimo per equilibrio e attivazione femorali/glutei"]
        }
    },
    "Hamstring Walkouts": {
        gifUrl: "https://gymvisual.com/img/p/6/7/0/6/6706.gif",
        execution: {
            steps: ["In piedi, piegati toccando il pavimento", "Cammina con le mani in avanti fino a plank", "Mantieni le gambe più dritte possibile", "Cammina con i piedi verso le mani e alzati"],
            tips: ["Simile all'inchworm", "Focus sullo stretch dei femorali durante il ritorno"]
        }
    },
    "Clamshells": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2022/02/Clamshell-Exercise.gif",
        execution: {
            steps: ["Sdraiato sul fianco, ginocchia piegate a 45°", "Piedi uniti, apri il ginocchio superiore", "Come una conchiglia che si apre", "Chiudi controllando e ripeti"],
            tips: ["Non ruotare il bacino", "Ottimo per gluteo medio e stabilità dell'anca"]
        }
    },
    "Fire Hydrants": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Fire-Hydrant.gif",
        execution: {
            steps: ["A quattro zampe, core attivato", "Solleva un ginocchio lateralmente mantenendo 90°", "Come un cane all'idrante", "Abbassa controllando e ripeti"],
            tips: ["Non ruotare il busto", "Attiva gluteo medio e piccolo"]
        }
    },
    "Donkey Kicks": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Donkey-Kicks.gif",
        execution: {
            steps: ["A quattro zampe, core attivato", "Solleva una gamba piegata verso il soffitto", "Spingi il tallone verso l'alto", "Contrai il gluteo in alto e abbassa controllando"],
            tips: ["Non arcuare la schiena", "Movimento controllato, non usare slancio"]
        }
    },
    "Monster Walks": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2022/02/Monster-Walk.gif",
        execution: {
            steps: ["Elastico sopra le ginocchia o alle caviglie", "Posizione semi-squat", "Cammina lateralmente a passi ampi", "Mantieni tensione sull'elastico"],
            tips: ["Ginocchia in fuori, non farle crollare", "Ottimo per attivare i glutei prima di squat"]
        }
    },
    "Ankle Circles": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2022/02/Ankle-Circles.gif",
        execution: {
            steps: ["In piedi su una gamba o seduto", "Solleva un piede da terra", "Ruota la caviglia in cerchio", "Fai cerchi in entrambe le direzioni"],
            tips: ["10-15 cerchi per direzione per piede", "Ottimo per mobilità della caviglia"]
        }
    },
    "Calf Raises Leggeri": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Standing-Calf-Raise.gif",
        execution: {
            steps: ["In piedi, piedi alla larghezza delle spalle", "Solleva sui talloni alzandoti sulle punte", "Mantieni un secondo in alto", "Abbassa lentamente"],
            tips: ["Senza peso aggiuntivo", "Serve per attivare i polpacci"]
        }
    },
    "Toe Walks": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Standing-Calf-Raise.gif",
        execution: {
            steps: ["Alzati sulle punte dei piedi", "Cammina in avanti mantenendoti in punta", "Mantieni il core attivo", "20-30 passi"],
            tips: ["Mantieni una postura eretta", "Attiva polpacci e stabilità della caviglia"]
        }
    },
    "Heel Walks": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2022/02/Heel-Walk.gif",
        execution: {
            steps: ["Solleva le punte dei piedi, cammina sui talloni", "Mantieni le punte sollevate", "Cammina in avanti per 20-30 passi", "Senti il lavoro sui tibiali anteriori"],
            tips: ["Mantieni il busto eretto", "Ottimo per prevenire shin splints"]
        }
    },
    "Dynamic Calf Stretch": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2022/02/Standing-Wall-Calf-Stretch.gif",
        execution: {
            steps: ["Di fronte a un muro, un piede avanti e uno dietro", "Spingi il tallone posteriore a terra", "Oscilla avanti e indietro dinamicamente", "Alterna le gambe"],
            tips: ["Non mantenere la posizione statica, movimento dinamico", "Senti lo stretch nel polpaccio"]
        }
    },
    "Hip Circles (in piedi)": {
        gifUrl: "https://gymvisual.com/img/p/9/1/8/2/9182.gif",
        execution: {
            steps: ["In piedi, mani sui fianchi", "Ruota il bacino in cerchi ampi", "Fai cerchi in entrambe le direzioni", "10-15 cerchi per direzione"],
            tips: ["Movimento fluido e controllato", "Ottimo per mobilità dell'anca e zona lombare"]
        }
    },
    "Torso Rotations": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Torso-Rotation.gif",
        execution: {
            steps: ["In piedi, braccia davanti al petto", "Ruota il busto da un lato all'altro", "Mantieni i fianchi fermi", "Movimento fluido e dinamico"],
            tips: ["Non forzare la rotazione", "Ottimo per mobilità toracica e core"]
        }
    },
    "Leg Swings": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Leg-Swings.gif",
        execution: {
            steps: ["In piedi accanto a un supporto", "Oscilla una gamba avanti e indietro", "Aumenta gradualmente l'ampiezza", "Ripeti sull'altra gamba"],
            tips: ["Mantieni il busto eretto", "Non forzare oltre il range naturale"]
        }
    }
};

// Detailed info for cooldown/stretching exercises
const COOLDOWN_DETAILS = {
    "Chest Doorway Stretch": {
        gifUrl: "https://gymvisual.com/img/p/3/2/8/3/8/32838.gif",
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
        gifUrl: "https://gymvisual.com/img/p/2/6/0/1/3/26013.gif",
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
        gifUrl: "https://gymvisual.com/img/p/3/5/2/7/3/35273.gif",
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
        gifUrl: "https://gymvisual.com/img/p/9/0/6/3/9063.gif",
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
        gifUrl: "https://gymvisual.com/img/p/2/7/2/9/7/27297.gif",
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
        gifUrl: "https://gymvisual.com/img/p/2/6/2/5/4/26254.gif",
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
    },
    "Bicep Wall Stretch": {
        gifUrl: "https://gymvisual.com/img/p/9/0/9/5/9095.gif",
        execution: {
            steps: [
                "In piedi di fianco a un muro",
                "Appoggia il palmo della mano sul muro, braccio disteso",
                "Ruota il corpo lontano dal muro",
                "Senti lo stretch nel bicipite e nella spalla anteriore"
            ],
            tips: [
                "Mantieni il braccio dritto",
                "Non forzare la rotazione"
            ]
        }
    },
    "Wall Bicep Stretch": {
        gifUrl: "https://gymvisual.com/img/p/9/0/9/5/9095.gif",
        execution: {
            steps: [
                "In piedi di fianco a un muro",
                "Appoggia il palmo della mano sul muro, braccio disteso",
                "Ruota il corpo lontano dal muro",
                "Senti lo stretch nel bicipite e nella spalla anteriore"
            ],
            tips: [
                "Mantieni il braccio dritto",
                "Varia l'altezza per colpire diverse parti del bicipite"
            ]
        }
    },
    "Seated Bicep Stretch": {
        gifUrl: "https://gymvisual.com/img/p/9/0/9/5/9095.gif",
        execution: {
            steps: [
                "Seduto a terra, mani dietro di te con le dita verso i piedi",
                "Lentamente scorri il bacino in avanti",
                "Mantieni le mani ferme a terra",
                "Senti lo stretch nei bicipiti"
            ],
            tips: [
                "Non sollevare le mani da terra",
                "Movimento lento e controllato"
            ]
        }
    },
    "Lat Stretch": {
        gifUrl: "https://gymvisual.com/img/p/2/1/7/6/4/21764.gif",
        execution: {
            steps: [
                "In ginocchio davanti a una panca o supporto",
                "Appoggia le mani sulla panca",
                "Abbassa il petto verso il pavimento",
                "Spingi i fianchi indietro allungando i dorsali"
            ],
            tips: [
                "Respira profondamente nella posizione",
                "Mantieni la schiena dritta"
            ]
        }
    },
    "Neck Stretches": {
        gifUrl: "https://gymvisual.com/img/p/9/1/2/6/9126.gif",
        execution: {
            steps: [
                "Seduto o in piedi con buona postura",
                "Inclina la testa verso una spalla",
                "Usa la mano per applicare leggera pressione",
                "Mantieni 15-20 secondi per lato"
            ],
            tips: [
                "Non forzare il movimento",
                "Mantieni le spalle rilassate e basse"
            ]
        }
    },
    "Neck Rolls": {
        gifUrl: "https://gymvisual.com/img/p/2/2/8/7/2/22872.gif",
        execution: {
            steps: [
                "Seduto o in piedi con buona postura",
                "Lascia cadere il mento verso il petto",
                "Ruota lentamente la testa in cerchio",
                "Alterna la direzione"
            ],
            tips: [
                "Movimento molto lento e controllato",
                "Evita di estendere troppo il collo all'indietro"
            ]
        }
    },
    "Upper Back Stretch": {
        gifUrl: "https://gymvisual.com/img/p/1/2/7/9/6/12796.gif",
        execution: {
            steps: [
                "In piedi o seduto, intreccia le mani davanti a te",
                "Spingi le mani in avanti arrotondando la schiena",
                "Porta il mento al petto",
                "Senti lo stretch tra le scapole"
            ],
            tips: [
                "Espira mentre arrotondi la schiena",
                "Mantieni le spalle lontane dalle orecchie"
            ]
        }
    },
    // ==========================================
    // ALIAS e COOLDOWN MANCANTI
    // ==========================================
    "Doorway Chest Stretch": {
        gifUrl: "https://gymvisual.com/img/p/3/2/8/3/8/32838.gif",
        execution: {
            steps: [
                "Posizionati in uno stipite della porta",
                "Appoggia l'avambraccio contro lo stipite, gomito a 90°",
                "Fai un passo avanti con il piede dello stesso lato",
                "Ruota il corpo allontanandoti dallo stipite"
            ],
            tips: [
                "Varia l'altezza del braccio per colpire diverse aree del petto",
                "Mantieni la posizione per almeno 30 secondi"
            ]
        }
    },
    "Chest Opener": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/09/Standing-Chest-Stretch.gif",
        execution: {
            steps: [
                "In piedi, intreccia le mani dietro la schiena",
                "Distendi le braccia e solleva leggermente",
                "Spingi il petto in fuori e le scapole insieme",
                "Mantieni la posizione respirando profondamente"
            ],
            tips: [
                "Non inarcare eccessivamente la schiena",
                "Concentrati sull'apertura delle spalle"
            ]
        }
    },
    "Floor Chest Stretch": {
        gifUrl: "https://gymvisual.com/img/p/2/0/6/3/3/20633.gif",
        execution: {
            steps: [
                "Sdraiati a pancia in giù",
                "Distendi un braccio di lato a 90° rispetto al corpo",
                "Ruota il corpo dalla parte opposta del braccio",
                "Senti lo stretch profondo nel petto"
            ],
            tips: [
                "Movimento lento e controllato",
                "Mantieni 30 secondi per lato"
            ]
        }
    },
    "Corner Stretch": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2022/02/Corner-Wall-Chest-Stretch.gif",
        execution: {
            steps: [
                "Posizionati di fronte a un angolo della stanza",
                "Appoggia le mani sulle due pareti all'altezza delle spalle",
                "Piegati in avanti verso l'angolo",
                "Senti lo stretch nel petto e nelle spalle anteriori"
            ],
            tips: [
                "Mantieni i gomiti leggermente sotto le spalle",
                "Non forzare troppo in avanti"
            ]
        }
    },
    "Cross-Body Stretch": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/04/Across-Chest-Shoulder-Stretch.gif",
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
    "Overhead Tricep Stretch": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2022/02/Triceps-Stretch.gif",
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
    "Overhead Tricep/Shoulder Stretch": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2022/02/Triceps-Stretch.gif",
        execution: {
            steps: [
                "Porta un braccio sopra la testa",
                "Piega il gomito portando la mano dietro la nuca",
                "Con l'altra mano, spingi il gomito verso il basso e leggermente indietro",
                "Senti lo stretch nel tricipite e nella spalla"
            ],
            tips: [
                "Mantieni il busto eretto e il core attivo",
                "Alterna i due lati"
            ]
        }
    },
    "Shoulder Stretch": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/04/Across-Chest-Shoulder-Stretch.gif",
        execution: {
            steps: [
                "Porta un braccio attraverso il petto",
                "Con l'altra mano, tira delicatamente il braccio verso di te",
                "Mantieni la spalla bassa e rilassata",
                "Senti lo stretch nella parte posteriore della spalla"
            ],
            tips: [
                "Non alzare la spalla del braccio stirato",
                "Mantieni 30 secondi per lato"
            ]
        }
    },
    "Wall Shoulder Stretch": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2022/02/Wall-Shoulder-Stretch.gif",
        execution: {
            steps: [
                "In piedi di fianco a un muro",
                "Appoggia la mano sul muro all'altezza della spalla",
                "Ruota lentamente il corpo lontano dal muro",
                "Senti lo stretch nella spalla anteriore e nel petto"
            ],
            tips: [
                "Varia l'altezza della mano per colpire diverse aree",
                "Mantieni il braccio dritto"
            ]
        }
    },
    "Eagle Arms": {
        gifUrl: "https://gymvisual.com/img/p/2/2/5/7/6/22576.gif",
        execution: {
            steps: [
                "In piedi o seduto, braccia davanti a te",
                "Incrocia un braccio sopra l'altro all'altezza dei gomiti",
                "Porta i palmi delle mani a contatto (o il più vicino possibile)",
                "Solleva i gomiti all'altezza delle spalle"
            ],
            tips: [
                "Mantieni le spalle basse e rilassate",
                "Alterna quale braccio sta sopra"
            ]
        }
    },
    "Thread the Needle": {
        gifUrl: "https://gymvisual.com/img/p/1/7/8/6/5/17865.gif",
        execution: {
            steps: [
                "A quattro zampe, posizione del tavolo",
                "Infila un braccio sotto il corpo verso il lato opposto",
                "Appoggia la spalla e la tempia a terra",
                "Il braccio opposto può restare a terra o distendersi in avanti"
            ],
            tips: [
                "Movimento lento e controllato",
                "Ottimo per la mobilità toracica"
            ]
        }
    },
    "Cat-Cow Stretch": {
        gifUrl: "https://gymvisual.com/img/p/2/1/7/8/4/21784.gif",
        execution: {
            steps: [
                "A quattro zampe, mani sotto le spalle, ginocchia sotto i fianchi",
                "Inspira: inarca la schiena, guarda in alto (Cow)",
                "Espira: arrotonda la schiena, mento al petto (Cat)",
                "Alterna lentamente per il numero di ripetizioni indicato"
            ],
            tips: [
                "Sincronizza il movimento con il respiro",
                "Ottimo per la mobilità della colonna"
            ]
        }
    },
    "Cat-Cow": {
        gifUrl: "https://gymvisual.com/img/p/2/1/7/8/4/21784.gif",
        execution: {
            steps: [
                "A quattro zampe, mani sotto le spalle, ginocchia sotto i fianchi",
                "Inspira: inarca la schiena, guarda in alto (Cow)",
                "Espira: arrotonda la schiena, mento al petto (Cat)",
                "Alterna lentamente per il numero di ripetizioni indicato"
            ],
            tips: [
                "Sincronizza il movimento con il respiro",
                "Movimento fluido senza forzare"
            ]
        }
    },
    "Seated Spinal Twist": {
        gifUrl: "https://gymvisual.com/img/p/2/7/2/9/7/27297.gif",
        execution: {
            steps: [
                "Seduto con le gambe distese",
                "Piega un ginocchio e appoggia il piede fuori dalla coscia opposta",
                "Ruota il busto verso il ginocchio piegato",
                "Usa il gomito opposto per spingere contro il ginocchio"
            ],
            tips: [
                "Mantieni la colonna dritta durante la rotazione",
                "Non forzare la rotazione"
            ]
        }
    },
    "Knee-to-Chest Stretch": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/06/Knee-to-Chest-Stretch.gif",
        execution: {
            steps: [
                "Sdraiato supino su un tappetino",
                "Porta un ginocchio verso il petto",
                "Abbraccia il ginocchio con entrambe le mani",
                "Mantieni l'altra gamba distesa o piegata a terra"
            ],
            tips: [
                "Mantieni la testa e le spalle a terra",
                "Stretch per la parte bassa della schiena e i glutei"
            ]
        }
    },
    "Knee-to-Chest": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/06/Knee-to-Chest-Stretch.gif",
        execution: {
            steps: [
                "Sdraiato supino su un tappetino",
                "Porta un ginocchio verso il petto",
                "Abbraccia il ginocchio con entrambe le mani",
                "Mantieni l'altra gamba distesa a terra"
            ],
            tips: [
                "Mantieni la testa rilassata a terra",
                "Stretch per glutei e parte bassa della schiena"
            ]
        }
    },
    "Quad Stretch": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/08/Standing-Quadriceps-Stretch.gif",
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
    "Kneeling Quad Stretch": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2022/02/Kneeling-Quadriceps-Stretch.gif",
        execution: {
            steps: [
                "In ginocchio su una gamba, l'altra con piede a terra davanti",
                "Afferra il piede della gamba posteriore con la mano",
                "Tira il tallone verso il gluteo",
                "Mantieni il busto eretto"
            ],
            tips: [
                "Usa un cuscino sotto il ginocchio a terra",
                "Stretch più profondo rispetto alla versione in piedi"
            ]
        }
    },
    "Lying Quad Stretch": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/09/Lying-Quadriceps-Stretch.gif",
        execution: {
            steps: [
                "Sdraiati su un fianco",
                "Afferra la caviglia della gamba superiore",
                "Tira il tallone verso il gluteo",
                "Mantieni le ginocchia allineate"
            ],
            tips: [
                "Spingi il fianco in avanti per intensificare",
                "Mantieni la schiena dritta"
            ]
        }
    },
    "Couch Stretch": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2022/04/Couch-Stretch.gif",
        execution: {
            steps: [
                "Mettiti in ginocchio davanti a un muro o divano",
                "Appoggia un piede/shin contro il muro dietro di te",
                "L'altra gamba in posizione di affondo con piede a terra",
                "Spingi il bacino in avanti e raddrizza il busto"
            ],
            tips: [
                "Stretch molto intenso per i quadricipiti e i flessori dell'anca",
                "Inizia gradualmente, non forzare"
            ]
        }
    },
    "Hamstring Stretch": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/05/Standing-Hamstring-Stretch.gif",
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
    "Standing Toe Touch": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/08/Standing-Toe-Touch.gif",
        execution: {
            steps: [
                "In piedi con i piedi uniti o alla larghezza delle spalle",
                "Piegati lentamente in avanti dalla vita",
                "Cerca di raggiungere le punte dei piedi o il pavimento",
                "Mantieni le ginocchia dritte o leggermente piegate"
            ],
            tips: [
                "Non rimbalzare",
                "Lascia cadere la testa e le braccia per gravità"
            ]
        }
    },
    "Single Leg Forward Fold": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2022/02/Seated-Single-Leg-Hamstring-Stretch.gif",
        execution: {
            steps: [
                "Seduto con una gamba distesa in avanti",
                "L'altra gamba piegata con il piede contro la coscia interna",
                "Piegati in avanti verso la punta del piede disteso",
                "Mantieni la schiena dritta il più possibile"
            ],
            tips: [
                "Non forzare, vai fin dove riesci",
                "Mantieni 30 secondi per gamba"
            ]
        }
    },
    "Lying Hamstring Stretch": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/06/Supine-Hamstring-Stretch.gif",
        execution: {
            steps: [
                "Sdraiato supino su un tappetino",
                "Solleva una gamba verso il soffitto",
                "Afferra la coscia o usa una fascia/asciugamano",
                "Tira delicatamente la gamba verso di te mantenendola dritta"
            ],
            tips: [
                "L'altra gamba resta distesa a terra",
                "Non sollevare la testa dal pavimento"
            ]
        }
    },
    "Seated Glute Stretch": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/06/Seated-Glute-Stretch.gif",
        execution: {
            steps: [
                "Seduto su una sedia o a terra",
                "Appoggia una caviglia sulla coscia opposta (posizione 4)",
                "Piegati in avanti dal busto",
                "Senti lo stretch nel gluteo della gamba incrociata"
            ],
            tips: [
                "Mantieni la schiena dritta mentre ti pieghi",
                "Premi delicatamente il ginocchio verso il basso"
            ]
        }
    },
    "Lying Side Stretch": {
        gifUrl: "https://gymvisual.com/img/p/2/7/2/9/7/27297.gif",
        execution: {
            steps: [
                "Sdraiato supino, braccia distese sopra la testa",
                "Inclina il corpo lateralmente formando una C",
                "Incrocia la caviglia esterna sopra l'altra",
                "Senti lo stretch lungo tutto il fianco"
            ],
            tips: [
                "Mantieni le spalle e i fianchi a terra",
                "30 secondi per lato"
            ]
        }
    },
    "Figure-4": {
        gifUrl: "https://gymvisual.com/img/p/9/0/6/3/9063.gif",
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
    "Wrist Flexor Stretch": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/09/Wrist-Flexor-Stretch.gif",
        execution: {
            steps: [
                "Distendi un braccio davanti a te, palmo verso l'alto",
                "Con l'altra mano, tira le dita verso il basso e indietro",
                "Senti lo stretch nella parte interna dell'avambraccio",
                "Mantieni 20 secondi per mano"
            ],
            tips: [
                "Non tirare troppo forte",
                "Braccio completamente disteso"
            ]
        }
    },
    "Wrist Extensor Stretch": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/09/Wrist-Extensor-Stretch.gif",
        execution: {
            steps: [
                "Distendi un braccio davanti a te, palmo verso il basso",
                "Con l'altra mano, spingi le dita verso il basso",
                "Senti lo stretch nella parte esterna dell'avambraccio",
                "Mantieni 20 secondi per mano"
            ],
            tips: [
                "Movimento delicato e controllato",
                "Utile dopo esercizi di presa"
            ]
        }
    },
    "Hip Flexor Stretch": {
        gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/08/Kneeling-Hip-Flexor-Stretch.gif",
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
