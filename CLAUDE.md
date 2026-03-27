# GymTracker Pro - Note per Claude Code

## Progetto
- **PWA**: Vanilla JS + CSS + HTML (no framework, no build tools)
- **Repo**: github.com/erold90/Gym
- **Deploy**: erold90.github.io/Gym (GitHub Pages, auto-merge)
- **Branch**: `claude/main-IDVRj` (HEAD, deploy diretto — no main branch)
- **Versione**: v1.16.4 (2026-03-25)
- **Utenti**: Daniele + moglie (obiettivo Tonificazione)

## Struttura File

```
index.html (1212 righe) — SPA singola pagina, 7 sezioni + 7 modals
sw.js (132 righe) — Service Worker, CACHE_VERSION = 'v1.16.4'
css/style.css (~5900 righe) — Design system dark + responsive
js/app.js (4877 righe) — Logica principale, 40+ funzioni
js/modules/algorithm.js (1513 righe) — Generazione schede + periodizzazione
js/modules/storage.js (1191 righe) — Persistenza localStorage (10 chiavi)
js/modules/timer.js (211 righe) — Rest timer + workout timer + Web Audio
js/modules/exerciseMedia.js (2233 righe) — GIF e dettagli ~180 esercizi (funzioni GLOBALI)
js/modules/conditioningExercises.js (567 righe) — Protocolli HIIT/LISS
js/data/exercises.js (1871 righe) — Database esercizi
js/data/warmups.js (1625 righe) — Riscaldamento e stretching
```

## Regole CRITICHE

### Service Worker — SEMPRE bumpare CACHE_VERSION
Ogni modifica a file JS/CSS/HTML richiede bump di `CACHE_VERSION` in `sw.js`. Senza bump, l'utente vede la versione vecchia dalla cache. Formato: `vX.Y.Z`.

### CSS — Due sistemi di visibilità separati
- `.page` / `.page.active` — navigazione pagine principali (display none/block)
- `.hidden { display: none !important }` — sotto-elementi, wizard steps
- **NON mescolare** i due sistemi

### ExerciseMedia — Funzioni GLOBALI, non oggetto
Le funzioni media sono globali: `getExerciseGif(id)`, `getExerciseMediaInfo(id, name, type)`, `getExerciseDetails(id)`.
**NON usare** `ExerciseMedia.getGifUrl()` o simili — NON ESISTE come oggetto.
Check: `typeof getExerciseGif === 'function' ? getExerciseGif(id) : null`

### Riferimenti HTML/JS — Pulire SEMPRE
Se si rimuove un elemento HTML (id), cercare TUTTI i riferimenti nel JS (con e senza `?.`). Le righe senza optional chaining crashano silenziosamente.
Comando: `grep -n 'removed-id' js/app.js`

### Storage — Dati indipendenti dalla scheda
Workouts, PRs, Streak, Cycle History sono **completamente indipendenti** dal programma attivo. Eliminare/sostituire la scheda NON cancella storico, PR, streak.

Chiavi localStorage:
- `gymtracker_profile` — profilo utente (nome, sesso, livello, goal, equipment...)
- `gymtracker_settings` — rest times, suono, vibrazione, tema, unità
- `gymtracker_workouts` — array allenamenti (unshift, con timestamp/ID)
- `gymtracker_programs` — programmi salvati
- `gymtracker_active_program` — programma attivo (uno solo)
- `gymtracker_measurements` — peso corporeo (solo peso, no % grasso)
- `gymtracker_prs` — personal records per exerciseId (3 tipi: max weight, max reps, E1RM)
- `gymtracker_streak` — { current, best, lastWorkoutDate }
- `gymtracker_cycle_history` — ultimi 20 cicli completati
- `gymtracker_conditioning` — sessioni HIIT/LISS

## Navigazione e Pagine

`showPage(pageName)` in app.js gestisce la navigazione.
Refresh dati su navigazione:
- `progress` → chiama `loadProgress()` + `initCharts()`

### 7 Pagine
1. **Dashboard** (`#page-dashboard`) — greeting, stats, weekly overview, body stats, cycle card, recent activity
2. **Workout** (`#page-workout`) — not-started/preview/active mode, warmup, exercise flow, rest timer, cooldown
3. **Exercises** (`#page-exercises`) — database ~180 esercizi, search, filter categoria/muscolo
4. **Programs** (`#page-programs`) — active program card, AI Generator wizard 4 step, Manual Builder
5. **Progress** (`#page-progress`) — charts (volume, frequenza, RIR, strength, peso), PRs, cycle history
6. **Profile** (`#page-profile`) — dati personali, esperienza, goals, availability, equipment
7. **Settings** (`#page-settings`) — workout prefs, appearance, data, debug, danger zone

### 7 Modals
1. **AI Generator** (`#ai-generator-modal`) — wizard: goal → giorni → split → durata → summary
2. **Manual Builder** (`#manual-builder-modal`) — definisci giorni → aggiungi esercizi
3. **Exercise Detail** (`#exercise-modal`) — info semplice
4. **Exercise Info** (`#exercise-info-modal`) — completa con GIF, execution, tips, mistakes, breathing
5. **Conditioning** (`#conditioning-modal`) — tipo → protocollo → sessione → riepilogo
6. **Rest Timer** (`#rest-timer-modal`) — countdown + ±15s/skip
7. **Cooldown** (`#cooldown-modal`) — stretching con GIF

## Obiettivi (Goal)

5 goal: `strength`, `hypertrophy`, `recomp`, `endurance`, `toning`

### Parametri per goal

| Goal | Compound Reps | Isolation Reps | Rest C/I | Tempo |
|------|--------------|----------------|----------|-------|
| strength | 1-5 | 6-8 | 240s/150s | 2-0-X-0 |
| hypertrophy | 8-12 | 10-15 | 150s/90s | 3-1-1-0 |
| recomp | 8-12 | 10-15 | 120s/90s | 2-1-2-0 |
| endurance | 15-20 | 15-25 | 60s/45s | 2-0-1-0 |
| toning | 8-12 | 12-15 | 90s/45s | 3-1-1-0 |

### Toning (femminile, aggiunto 2026-03-25)
- Volume: 62% lower / 38% upper (Frontiers 2025)
- Glutei priorità: hip thrust + squat + RDL 2-4x/settimana
- Hip thrust: 86.8% attivazione glutei vs squat 45.4% (Contreras 2015)
- Rest ridotti (Harty 2018: femmine recovery veloce 25-50%)
- Glute accessory range: 12-20 reps
- Lower variants: glute-quad, glute-ham, glute-focus
- Upper variants: default (V-taper), arms, full

## Volume e Periodizzazione

### Volume (serie/muscolo/settimana)
- beginner: 8-12, intermediate: 10-16, advanced: 12-20, expert: 14-22
- Moltiplicatore frequenza: 3gg ×1.2, 4gg ×1.0, 5+gg ×0.85

### Mesociclo (durata settimane per goal/level)
- strength: 4/6/8/8, hypertrophy: 4/5/6/6, recomp: 4/5/6/6, endurance: 3/4/5/5, toning: 4/5/5/6

### Fasi
- **Accumulation** 50%: RIR 2-4, Volume 100%
- **Intensification** 35%: RIR 0-2, Volume 90%
- **Deload** 15%: RIR 4-5, Volume 50%

### Ciclo Flow
1. Genera programma → ciclo auto-creato
2. Dashboard card: "Settimana X/Y - Fase Z"
3. Pulsanti: "Attiva Deload", "Avanza Settimana"
4. Completa ultimo week → `completeCycle()` → rotazione esercizi → nuovo ciclo week 1

## Workout Session

### Layout Set Row
- `.set-row-top` — input: peso, reps
- `.set-row-bottom` — RIR + timer inline
- Rest timer **inline** nella riga completata (NON modale fullscreen)
- `_activeRestTimerSetIdx` traccia quale set ha il timer attivo
- Dopo re-render (`displayCurrentExercise`), il timer si ri-aggancia al DOM

### Flusso Completo
1. Warmup (collapsible, riscaldamento dinamico specifico per giorno)
2. Per ogni esercizio: form input + progression suggestion + PR check
3. `completeSet()` → salva set → rest timer inline
4. Ultimo esercizio → cooldown (stretching statico)
5. `finishWorkout()` → salva workout + aggiorna streak/PRs/cicli

### Simulazione
Bottone in Impostazioni > Debug & Test. Flag `_isSimulation` previene salvataggio in `finishWorkout()`.

## Double Progression

1. Tutte serie al top range → **aumenta peso** (+5kg legs, +2.5kg upper compound, +1.25kg isolation)
2. Nel range ma non top → **aumenta reps**
3. Sotto range → **mantieni peso**

## Personal Records — E1RM

- **Brzycki** (<=10 reps): `weight × 36 / (37 - reps)`
- **Epley** (>10 reps): `weight × (1 + reps/30)`
- **Capped** (>=20 reps): Epley con max 20 reps
- 3 tipi: max weight, max reps, estimated 1RM
- History: ultimi 50 per esercizio

## Split Consigliati

- 3 giorni → Full Body
- 4 giorni → Upper/Lower
- 5 giorni → PPL o Upper/Lower
- 6 giorni → PPL

## Stima Durata Workout

`8min warmup + 5min cooldown + (sets × 45s) + (exercises × 30s transition)`
Se stimata > sessione, rimuove accessori in coda.

## Conditioning (HIIT/LISS)

- HIIT: Tabata, EMOM, 30/30
- LISS: Tapis roulant, Cyclette, Camminata, Nuoto
- Tracking: tipo, durata, calorie stimate + manuali (Apple Watch), note

## Grafici (Chart.js)

- Volume settimanale — label relative ("3 sett fa", "Scorsa", "Questa")
- Frequenza allenamenti
- RIR trend — visibile con 1+ allenamento (soglia minima 1, non 2)
- Strength per esercizio (dropdown)
- Peso corporeo

## Peso Corporeo

- Form semplificato: solo peso (no % grasso)
- Data salvata automaticamente
- Formato data italiano (25 mar 2026)

## Streak

- Workout oggi → niente cambio
- Workout ieri → continua streak (+1)
- Altrimenti → reset a 1
- Best aggiornato se current > best

## CSS Design System

### Tema Dark (Default)
- `--bg-primary`: #0f0f1a, `--bg-secondary`: #1a1a2e
- `--accent`: #4361ee, `--success`: #4ade80, `--warning`: #facc15, `--danger`: #ef4444

### Responsive
- Mobile <=480px: sidebar drawer, single column, padding 15px
- Desktop 769px+: sidebar fixed left, multi-column

## Mobile — Attenzione Overflow

Su mobile tutto deve stare nello schermo. Usare `overflow: hidden` su `.card` e `.page`. Griglie collassano a 1-2 colonne. Media query `@media (max-width: 480px)`.

## Export/Import

JSON con version, exportDate, tutti i dati. `clearProgressData()` cancella solo workouts/PRs/streak/cycle_history (mantiene profilo/settings/programmi).

## Limitazioni Note

- Client-side only — no cloud sync, single device
- localStorage limit ~5-10 MB
- GIF hotlinking — possibili CORS
- Chart.js lento con 100+ workouts
