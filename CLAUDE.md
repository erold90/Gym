# GymTracker Pro - Note per Claude Code

> ⚠️ Questo repo è **pubblico** e GitHub Pages serve anche questo file
> (`erold90.github.io/Gym/CLAUDE.md`): niente dati personali qui dentro.

## Prima di toccare qualunque cosa

1. **`git fetch` e `git status -sb`.** Il repo si modifica anche da sessioni web di Claude
   (claude.ai/code) che pushano direttamente: il 15/10/2026 la copia del Mac era ferma alla
   v1.22.0 mentre online girava la v1.25.0 (12 commit avanti). Si lavora solo su una copia allineata.
2. **Bug noti**: c'è un catalogo completo con ID e righe (analisi del 15/10/2026, v1.25.0) nella
   memoria di Claude sul Mac, `reference_gymtracker_analisi_2026_10.md`. Banco di prova (matrice
   delle schede in Node + Playwright) in `.analisi-2026-10/` (solo locale, escluso da git).

## Progetto
- **PWA**: Vanilla JS + CSS + HTML (no framework, no build tools)
- **Repo**: github.com/erold90/Gym (pubblico)
- **Deploy**: GitHub Pages "legacy" dal ramo `claude/main-IDVRj`, cartella radice, a ogni push.
  Non esiste `main`. Il workflow `auto-merge-claude.yml` unisce i rami `claude/main-*` in quello,
  ma con push diretti è inerte (tutte le run *skipped*).
- **Versione**: v1.25.0 (15/09/2026)
- **Utenti**: 2 persone, una con obiettivo Tonificazione

## Struttura File (v1.25.0)

```
index.html (1246) — SPA, 7 pagine + modali (anche day-picker e free-workout) + CSP in <meta>
sw.js (132) — Service Worker, CACHE_VERSION = 'v1.25.0', percorsi RELATIVI
css/style.css (5837) — dark + tema chiaro parziale, breakpoint solo max-width
js/app.js (5677) — oggetto App: tutta l'interfaccia (+ un <style> iniettato in fondo)
js/modules/algorithm.js (1783) — TrainingAlgorithm: schede, periodizzazione, superset, core block
js/modules/storage.js (1285) — Storage: localStorage, PR, streak, cicli, progressione, detraining
js/modules/timer.js (375) — Timer: riposo a timestamp, beep sul clock audio, keep-alive, notifiche
js/modules/exerciseMedia.js (5742) — GIF e dettagli (funzioni GLOBALI)
js/modules/conditioningExercises.js (567) — HIIT/LISS
js/data/exercises.js (1871) — EXERCISES_DB: 139 esercizi
js/data/warmups.js (1641) — IIFE `Warmups` (WARMUPS_DB/COOLDOWN_DB NON sono globali)
```

Ordine degli script (sincroni, fine body): Chart.js da jsdelivr **senza versione** → exercises →
warmups → storage → algorithm → timer → exerciseMedia → conditioningExercises → app → registrazione SW.

## Regole CRITICHE

### Service Worker
- Ogni modifica a JS/CSS/HTML → bump di `CACHE_VERSION` in `sw.js` (`vX.Y.Z`).
- Percorsi SEMPRE relativi (`register('sw.js')`, `'./index.html'`): l'app sta sotto `/Gym/`.
  Con `/sw.js` il SW dà 404 e non si registra — è successo dal 12/2025 al 9/2026 senza che nessuno
  se ne accorgesse, perché `cache.addAll` ha un `.catch` che ingoia l'errore.
- App: stale-while-revalidate. GIF esterne: cache-first, ma le risposte `<img>` sono opache
  (`ok=false`) e quindi **non finiscono mai in cache**. Chart.js non è in cache.

### Visibilità: due sistemi da NON mescolare
- `.page` / `.page.active` per le pagine; `.hidden { display:none !important }` per i sotto-elementi.
- `startWorkout` usa `style.display` su `#workout-active`/`#workout-not-started`: chi ci aggiunge
  `.hidden` (ramo "0 serie" di `finishWorkout`) rompe la pagina finché non si ricarica.

### ExerciseMedia — funzioni GLOBALI
`getExerciseGif(id)`, `getExerciseDetails(id)`, `getWarmupDetails(name)`, `getCooldownDetails(name)`,
`getExerciseMediaInfo(id, name, type)`. Non esiste un oggetto `ExerciseMedia`.
Warmup e cooldown si cercano per **nome visualizzato**, il workout per **id**.

### Riferimenti HTML/JS
Rimuovendo un id dall'HTML, cercare tutti i riferimenti nel JS (con e senza `?.`).
Prima di usare una classe o una variabile CSS, verificare che sia definita: `--primary`, `--accent`,
`--radius-md`, `--radius-lg`, `--border`, `--bg-tertiary` NON esistono (le vere sono
`--accent-primary`, `--radius`, `--radius-sm`…).

### Mobile
`min-width:0` sui flex item ha tolto lo scroll orizzontale ma ha schiacciato lo stepper ± della riga
serie a 390 px (valore invisibile). Ogni modifica alla riga serie va misurata a 360 e 390 px.

## Storage (localStorage, nessuna migrazione, nessun try/catch su JSON.parse)

- `gymtracker_profile` — default tarati su un uomo 90 kg advanced (vedi bug noti)
- `gymtracker_settings` — restSound, vibration, theme; restTime* e weightUnit salvati ma MAI usati
- `gymtracker_workouts` — array, il più recente in testa; set = `{weight, reps (stringhe), completed, rir?, isNewPR?}`
- `gymtracker_programs` — vecchio, mai scritto
- `gymtracker_active_program` — `{name, days[{name,type,focus,warmup,exercises[]}], metadata{goal, split, daysPerWeek, sessionDuration, level, cycle{duration,currentWeek,startDate,isDeloadActive,phases[]}}}`
- `gymtracker_measurements` — `[{id,date,weight}]`, aggiorna anche `profile.weight`
- `gymtracker_prs` — per exerciseId: maxWeight, maxReps, estimated1RM, history (max 50)
- `gymtracker_streak` — `{current,best,lastWorkoutDate}` (giorni CONSECUTIVI)
- `gymtracker_cycle_history` — ultimi 20 cicli
- `gymtracker_conditioning` — salvato con type **minuscolo** `'hiit'/'liss'`, duration in MINUTI

Lo storico (workouts, PR, streak, cicli) è indipendente dalla scheda attiva.
L'export NON include `cycle_history` né `conditioning`. `clearProgressData` cancella anche il conditioning.
La sessione in corso (`App.activeWorkout`) vive solo in memoria.

## Generazione schede (algorithm.js)

- Input reali: `level`, `equipment`, goal/giorni/split/durata dal wizard. **`gender` non è mai letto.**
- Goal: `strength`, `hypertrophy`, `recomp`, `endurance`, `toning` (il select del profilo ha valori
  diversi: recomp/bulk/cut/strength/maintenance).

| Goal | Compound | Isolation | Rest C/I | Tempo |
|------|----------|-----------|----------|-------|
| strength | 1-5 | 6-8 | 240/150 s | 2-0-X-0 |
| hypertrophy | 8-12 | 10-15 | 150/90 s | 3-1-1-0 |
| recomp | 8-12 | 10-15 | 120/90 s | 2-1-2-0 |
| endurance | 15-20 | 15-25 | 60/45 s | 2-0-1-0 |
| toning | 8-12 | 12-15 (glute 12-20) | 90/45 s | 3-1-1-0 |

Polpacci/addome/avambracci hanno range propri per ogni goal.

- Volume ottimale/settimana: beginner 10, intermediate 14, advanced 16, expert 18 (min-max 8-12 … 14-22).
- `durationFactor = clamp(durata/60, 0.7, 1.3)`; frequenza ×1.2/1/0.85 **solo in Upper/Lower**.
- Esercizi da `EXERCISE_PRIORITY` (lista per muscolo, ruotata di `cycleOffset`); attrezzatura
  controllata con `some()`; serie 60%/40% per il 1°/successivi, min 2 max 4.
- Split: U/L (3gg = Upper, Lower, Full Body — **il ramo 3gg non-toning va in ReferenceError**),
  PPL (5gg = gambe 1×/sett), Full Body 6 schemi A-F. Toning: varianti lower glute-quad/glute-ham/
  glute-focus, upper default/arms/full.
- `face-pull` aggiunto fisso a ogni Upper/Pull, `wrist-curl` al giorno Braccia.
- **v1.24.4**: `buildCoreBlock` aggiunge a OGNI giorno 1-2 esercizi di addome (regione a rotazione
  dayIndex % 4) marcati `isProtected`; anche i polpacci U/L sono `isProtected`.
- Taglio per durata: toglie l'ultimo esercizio NON protetto finché la stima supera la durata e
  restano >4 non protetti. Avviene PRIMA dei superset.
- Stima durata: `8' + Σ(serie×45 s + (serie−1)×rest)`, superset a parte. Nessun cooldown.
- Superset (`applySupersets`): 25 coppie + 7 giant set definiti (se ne formano davvero 9 e 1);
  max/giorno strength 2, hyp 4, recomp 5, toning 4, endurance 8; rest = 80% del maggiore; le serie
  del gruppo vengono pareggiate al massimo. 13 esercizi esclusi (squat, deadlift, hip-thrust, OHP…).
- Mesociclo: durata strength 4/6/8/8, hyp e recomp 4/5/6/6, endurance 3/4/5/5, toning 4/5/5/6
  (beg/int/adv/exp). Fasi `round(d×0.5)` accumulo (RIR 2-4) + `round(d×0.35)` intensificazione
  (RIR 0-2, volume 0.9 — non applicato) + resto deload (RIR 4-5, volume 0.5). Con d=3 o 5 le fasi
  sono d+1 e il deload non arriva.
- `rotateProgram` (fine ciclo) chiama i generatori senza goal/durata: non va usata così com'è.

## Progressione (storage.getProgressionSuggestion)

0. **Detraining** (v1.25): se quell'esercizio manca da ≥3 settimane, peso × max(0.6, 1−0.025×(sett−2)),
   arrotondato all'incremento, RIR 3-4, peso ridotto precompilato.
1. Tutte le serie al massimo del range → +peso (+5 kg "gambe" riconosciute per sottostringa,
   +2.5 compound, +1.25 isolation, tipo da `Storage.getExerciseType`, NON dal DB).
2. Tutte nel range → +1 rep.
3. Sotto il range → mantieni; se stallo allo stesso peso in ≥2 delle ultime 3 sessioni → back-off −10%.

`checkReturnFromLayoff` (dashboard): nessun allenamento da ≥21 giorni → `resetCycle()` (settimana 1,
startDate oggi, deload spento), senza rotazione né storico.

PR: E1RM Brzycki ≤10 rep, Epley 11-20, tetto a 20 rep.

## Sessione di allenamento

- Avvio: "Inizia" (dashboard) o "Inizia allenamento" → **day picker** (v1.23) con giorno
  "Consigliato" = allenamenti della settimana % giorni. `startWorkout` non controlla sessioni in corso.
- Riga serie: `.set-row-top` (stepper ± peso 2.5 / reps 1, `oninput`) e `.set-row-bottom` (RIR + timer).
- Timer di riposo **inline** (mai modale; `#rest-timer-modal` è codice morto): fonte di verità
  `Timer.restEndTime`, tick 250 ms, ricalcolo su `visibilitychange`, beep a −10 s e 0 programmati
  sull'AudioContext, `<audio>` muto in loop come keep-alive, notifiche di sistema, overtime fino a
  −120 s, ±15 s, Salta. Avanti/Indietro fermano il riposo. I superset usano ancora un setInterval proprio.
- Simulazione: Impostazioni > Debug, flag `_isSimulation` (non salva).

## Date
Il lunedì della settimana è calcolato con `getDate()-getDay()+1`: **di domenica dà il lunedì dopo**.
Va corretto in un punto solo (oggi è copiato in 5 posti).

## Pagina Esercizi, GIF, riscaldamento
- Tab Workout (139) / Warmup (64) / Cooldown (52); filtri solo su Workout.
- GIF: 196 URL unici, fitnessprogramer.com (160) + static.exercisedb.dev (36). gymvisual.com vietato.
  **Una GIF unica non è una GIF giusta**: circa 31 mostrano un esercizio diverso. Prima di assegnare
  una GIF, verificare cosa mostra (nome del file / API ExerciseDB / guardarla).
- Riscaldamento da `day.warmup` (`Warmups.getWarmupByMuscle`), defaticamento da `day.type`
  (`Warmups.getCooldownForWorkout`, mappa senza Push B/Pull B/Legs B/Glute Burn).

## Conditioning
HIIT (protocollo fisso `circuit30`, 22 GIF su 27 rotte) e LISS (7 attività). Calorie = MET × 3.5 ×
kg / 200 × minuti. `CONDITIONING_BY_GOAL` non ha `toning`. Il grafico filtra 'HIIT' maiuscolo: è vuoto.

## Grafici (Chart.js)
Volume e frequenza 4 settimane con label relative, RIR medio ultimi 10, forza per esercizio,
peso ultimi 10, conditioning. Ogni grafico fa `destroy()` prima di ricrearsi.

## Design
`--bg-primary` #0f0f1a, `--bg-secondary` #1a1a2e, `--accent-primary` #4361ee, `--success` #06d6a0,
`--warning` #ffd166, `--danger` #ef476f. Breakpoint 1024/768/600/480/380.
