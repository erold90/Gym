# GymTracker — Note per Claude Code

> ⚠️ Repo **pubblico**. Questo file non va su GitHub Pages (escluso in `_config.yml`), ma resta
> leggibile su github.com: niente dati personali qui dentro.

## Prima di toccare qualunque cosa

1. **`git fetch` e `git status -sb`.** Il repo si modifica anche da sessioni web di Claude
   (claude.ai/code) che pushano direttamente: si lavora solo su una copia allineata.
2. **Le prove devono restare verdi** (vedi "Prove"): ~1.400 controlli automatici. Mai pubblicare
   con una prova rossa.
3. **Pubblicare = push sul ramo `claude/main-IDVRj`** (GitHub Pages "legacy", nessun build). Lo
   usano 2 persone ogni giorno con i dati solo nel telefono: prima di pubblicare un cambiamento
   visibile, anteprima (screenshot) al proprietario e il suo ok.
4. Documenti di lavoro (solo locali, esclusi da git con `.git/info/exclude`): `.analisi-2026-10/` —
   design (`design/DESIGN.md`, prototipi, `tools/palette.mjs`), specifica dell'algoritmo
   (`ALGORITMO-V2.md`, 70 fonti), revisioni (`REVISIONE-R1/R2/R3.md`), prove e2e (`e2e/*.mjs`).

## Progetto
- PWA vanilla JS + CSS + HTML, **nessun framework né build**. Offline (service worker), dati in
  `localStorage`. Font Archivo (OFL) e icone SVG locali, nessuna CDN.
- Repo github.com/erold90/Gym · online erold90.github.io/Gym · versione **v2.0.0**.
- Utenti: 2 (un uomo intermedio ipertrofia/ricomposizione, una donna principiante tonificazione).

## Struttura (v2.0)

```
index.html — guscio: sprite icone inline, 8 sezioni .page vuote, tab bar, #sheets, #toast-stack,
             script con ?v=<versione>, CSP in <meta> (tutto 'self')
sw.js      — APP_VERSION; CSS/JS versionati cache-first, navigazioni stale-while-revalidate sotto
             ./index.html, GIF esterne in cache a parte (max 30, opache)
scripts/versione.sh X.Y.Z — UNICO modo di cambiare versione (sw.js, utils.js, main.js, index.html)
css/  tokens.css + tokens-colors.css (GENERATO da .analisi-2026-10/design/tools/palette.mjs),
      base, layout, components, pages/<pagina>.css
js/modules/  utils.js (GT: esc, num, date, formati) · storage.js (Storage) · algorithm.js
             (TrainingAlgorithm) · timer.js (Timer) · exerciseMedia.js (funzioni GLOBALI) ·
             conditioningExercises.js
js/data/     exercises.js (EXERCISES_DB 139 + EXERCISE_TAGS) · warmups.js (IIFE Warmups) ·
             supplements.js (SUPPLEMENTS_CATALOG, catalogo generico degli integratori)
js/app/      core.js (App: router, fogli, avvisi, etichette) + un file per area che fa
             Object.assign(App, …): oggi (anche primo avvio), seduta (anche riepilogo), scheda,
             progressi, profilo, esercizi, conditioning · main.js (guardia di versione + avvio)
tests/       storage, progression, algorithm (Node puro: node tests/<x>.test.js)
```

## Regole CRITICHE

- **Versione**: dopo ogni modifica a CSS/JS/HTML → `scripts/versione.sh X.Y.Z`. Gli URL `?v=`
  impediscono che una pagina nuova prenda script vecchi dalla cache di un SW precedente (con
  storage.js vecchio la seduta non si salvava). `main.js` rifiuta di partire con moduli di
  un'altra versione e ricarica.
- **Moduli `Object.assign(App, …)`**: un metodo con lo stesso nome in due file viene sovrascritto
  da quello caricato dopo, in silenzio. Metodi privati con il prefisso dell'area (`_sed…`,
  `_oggi…`, `_scheda…`, `_prog…`, `_pf…`). Controllo: script in `.analisi-2026-10` o grep.
- **Shell**: il core chiama, se esistono, `html<Pagina>()`, `sheets<Area>()`, `bind<Area>()`,
  `enter<Pagina>()`, `can<Pagina>()`. Pagine: oggi, scheda, progressi, profilo, esercizi, seduta,
  riepilogo, onboarding. Navigare con `App.navigateTo()`; fogli con `App._openModal/_closeModal`
  o `_showDynamicModal`; **mai `confirm()`/`alert()`**: `await App.confirmSheet({...})`.
  Visibilità: `.page.active` per le pagine, attributo `hidden` per il resto.
- **Sicurezza**: `GT.esc()` su ogni dato utente/importato in `innerHTML`; input numerici con
  `GT.num()` (accetta "102,5").
- **Interfaccia**: poche parole (ogni testo al massimo una riga; le conferme nominano cosa),
  **nessuna emoji** (icone dello sprite con `App.ico('nome')`), giallo `--accent` solo per
  "adesso", contrasti AA misurati (axe 0), bersagli ≥48 px in seduta e ≥44 altrove, 360 px senza
  scroll orizzontale, tema scuro e chiaro, zoom permesso.
- **GIF**: una GIF unica non è una GIF giusta. Prima di assegnarne una, guardarla (fotogrammi o
  API ExerciseDB). Meglio `null` (l'app mostra l'animazione SVG) che una sbagliata. gymvisual vietato.
- **Nomi**: in italiano da palestra (regola in cima a `warmups.js`). Riscaldamento e
  defaticamento si cercano per NOME visualizzato: rinominando, aggiornare le chiavi e gli alias.

## Dati (`localStorage`)
`gymtracker_` + profile · settings · workouts · active_program · measurements · prs · streak ·
cycle_history · conditioning · supplements (integratori) · supplements_log ({data: {id: true}}, max
120 giorni) · meta (versione schema, migrazioni) · active_session (seduta in corso) · active_cardio ·
corrupt_* (copie di dati rotti). Orario dell'allenamento: profile.trainingTime ('HH:MM' o ''),
solo per oggi settings.todayTrainingTime {date, time} (scade da solo). Lettura protetta (JSON rotto → copia e
default), cache in memoria, migrazione idempotente all'avvio (`Storage.migrate`) dai dati v1.25:
mai cancellare chiavi né `exerciseId` (si marca `hidden:true`). Export = tutte le chiavi tranne la
seduta in corso; import valida e annulla tutto se una scrittura fallisce.
Corpo libero/zavorra: il peso salvato è la **zavorra** (0 senza). Esercizi a tempo
(`metric:'time'`): `reps` = secondi. Serie `isWarmup`/`isCalibration` fuori da PR e volume.

## Algoritmo (sintesi; dettagli e fonti in `ALGORITMO-V2.md`)
- Generatore a slot per split (U/L, PPL 5gg = P/P/L/U/L, Full Body), volume per muscolo dal
  livello e dalla durata (45' minimo → 90' massimo), frequenza ≥2, multiarticolari prima,
  tirata ≥ 0,9 × spinta, alzate laterali minime, attrezzatura controllata per intero, difficoltà
  del livello, esclusioni per famiglia, zone dolenti, sesso (riposi −15% per le donne),
  tonificazione con parte inferiore ≥55%. Superset fra multiarticolari solo spinta↔tirata.
- Riscaldamento e defaticamento proporzionali alla durata; stima della durata con rampa e
  calibrazione (`estimateWorkoutDuration`, `planCalibration(day,{dryRun:true})` per le anteprime).
- Mesociclo 6/6/5/5 settimane, RIR che scende, scarico finale (serie ÷2, −10%); scarico anticipato
  suggerito; settimana saltata ripetuta; rotazione a fine ciclo: fondamentali ogni 2 cicli (mai
  nella forza), peso portato dalla stessa famiglia.
- Progressione: doppia progressione su scala di carichi reale (`Storage.stepWeight`), correzione
  col RIR dichiarato, "Trova il peso" (max 3 prove, max 2-3 esercizi a seduta), rampa
  d'avvicinamento, calcolatore dischi, alternative con peso convertito, "ho poco tempo" (`compressDay`).

## Prove
```
node tests/storage.test.js        # 53
node tests/progression.test.js    # 215
node tests/algorithm.test.js      # matrice completa del wizard + rotazione, 0 violazioni (~60 s)
node .analisi-2026-10/e2e/{smoke,seduta,oggi-scheda,progressi-profilo}.mjs   # Playwright, locale
```
Server di prova: `python3 -m http.server` su porta libera, chiuso per PID (mai `pkill`).
Le e2e cercano playwright-core in `PW=` (o nella cartella indicata in testa allo script).
