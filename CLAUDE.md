# GymTracker Pro - Note per Claude Code

## Progetto
- **PWA**: Vanilla JS + CSS + HTML (no framework)
- **Repo**: github.com/erold90/Gym
- **Deploy**: erold90.github.io/Gym (GitHub Pages)
- **Branch**: `claude/main-IDVRj` (HEAD, deploy diretto — no main branch)

## File principali
- `js/app.js` — Logica app (~3800+ righe)
- `js/modules/algorithm.js` — Generazione schede (~1400+ righe)
- `js/modules/storage.js` — Persistenza localStorage (~1100 righe)
- `js/modules/timer.js` — Timer workout e rest
- `js/data/exercises.js` — Database ~180 esercizi con GIF
- `css/style.css` — Stili (~5900+ righe)
- `index.html` — SPA singola pagina
- `sw.js` — Service Worker con CACHE_VERSION

## Regole critiche

### Service Worker
**SEMPRE bumpare `CACHE_VERSION` in `sw.js`** ad ogni modifica di file JS/CSS/HTML. Senza bump, l'utente vede la versione vecchia.

### CSS
- `.hidden { display: none !important }` — usata per wizard e sotto-elementi
- `.page` / `.page.active` — sistema navigazione pagine principali (NON .hidden)
- Su mobile (≤480px): card padding ridotto a 15px, griglie a colonna singola

### Navigazione pagine
`showPage(pageName)` in app.js gestisce la navigazione. Quando si aggiungono refresh di dati, inserirli qui:
- `progress` → chiama `loadProgress()` + `initCharts()`

### Obiettivi disponibili
5 goal: `strength`, `hypertrophy`, `recomp`, `endurance`, `toning`
- **Toning** aggiunto 2026-03-25: specifico per allenamento femminile
- Parametri basati su: Schoenfeld 2021, Harty 2018, Contreras 2015, Barbalho 2019/2020
- Rest ridotti (90s/45s), volume 62% lower / 38% upper, priorità glutei

### Workout session layout
- Set row usa `.set-row-top` (input) + `.set-row-bottom` (timer + RIR)
- Rest timer è **inline** nella riga completata (non più modale fullscreen)
- `_activeRestTimerSetIdx` traccia quale set ha il timer attivo
- Dopo re-render (`displayCurrentExercise`), il timer si ri-aggancia al nuovo DOM

### Simulazione
Bottone "Simula Allenamento" in Impostazioni > Debug & Test.
Flag `_isSimulation` previene il salvataggio in `finishWorkout()`.

### Storage — dati indipendenti dalla scheda
- Workouts (`gymtracker_workouts`) — NO programId, completamente indipendenti
- PRs (`gymtracker_prs`) — indicizzati per exerciseId
- Streak (`gymtracker_streak`) — autonomo
- Eliminare/sostituire la scheda NON cancella storico, PR, streak

### Peso corporeo
- Form semplificato: solo peso (no % grasso)
- Data salvata automaticamente al momento dell'inserimento
- Formato data italiano (25 mar 2026)

### Grafici progressi
- Volume Settimanale e Frequenza: label relative ("3 sett fa", "Scorsa", "Questa")
- RIR Medio: si mostra con 1+ allenamento (non serve minimo 2)
- Tutti i dati progressi si refreshano via `loadProgress()` quando si naviga alla pagina
