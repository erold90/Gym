# GymTracker Pro - Documentazione per Claude

## Panoramica
GymTracker Pro è una Progressive Web App (PWA) per il tracciamento degli allenamenti in palestra. È costruita in vanilla JavaScript senza framework.

## Struttura del Progetto

```
/home/user/Gym/
├── index.html          # Pagina principale (SPA)
├── manifest.json       # Manifest PWA
├── sw.js              # Service Worker per cache e aggiornamenti
├── css/
│   └── style.css      # Tutti gli stili CSS
└── js/
    ├── app.js         # Logica principale dell'app
    ├── data/
    │   ├── exercises.js   # Database esercizi
    │   └── warmups.js     # Database riscaldamento e stretching
    └── modules/
        ├── storage.js       # Gestione localStorage
        ├── timer.js         # Timer per allenamenti
        ├── algorithm.js     # Algoritmo progressione
        └── exerciseMedia.js # GIF e dettagli esercizi
```

## Git e Deploy

### Branch Principale
- **Nome branch**: `claude/main-IDVRj`
- **IMPORTANTE**: Claude può pushare SOLO su branch che iniziano con `claude/` e terminano con l'ID sessione
- Per push diretti: `git push origin claude/main-IDVRj`

### GitHub Pages
- Il sito è deployato su: **https://erold90.github.io/Gym**
- Source: branch `claude/main-IDVRj`, folder `/ (root)`
- Il deploy è automatico ad ogni push

### Comandi Git Comuni
```bash
# Push modifiche
git add -A && git commit -m "messaggio" && git push origin claude/main-IDVRj

# Verificare stato
git status
git log --oneline -5
```

## Service Worker e Cache

### File: `sw.js`
- Gestisce la cache dell'app per funzionamento offline
- **CACHE_VERSION**: Incrementare ad ogni deploy per forzare aggiornamento
- Strategia: Network First per file app, Cache First per GIF esterne

### Aggiornare la Cache
1. Modifica `CACHE_VERSION` in `sw.js` (es: `v1.0.5` → `v1.0.6`)
2. Commit e push
3. L'utente vedrà banner "Nuova versione disponibile!"

### Pulsante Svuota Cache
- Posizione: Impostazioni → Gestione Dati → "Svuota Cache e Aggiorna"
- Funzione: Disattiva SW, svuota cache, ricarica pagina

## GIF Esercizi

### File: `js/modules/exerciseMedia.js`

Contiene 3 mappe principali:

1. **EXERCISE_GIF_MAP**: GIF per esercizi della scheda (per ID)
2. **WARMUP_DETAILS**: GIF e istruzioni per riscaldamento (per nome)
3. **COOLDOWN_DETAILS**: GIF e istruzioni per stretching (per nome)

### Fonte GIF
- Fonte principale: **fitnessprogramer.com**
- Pattern URL: `https://fitnessprogramer.com/wp-content/uploads/YYYY/MM/Nome-Esercizio.gif`
- **ATTENZIONE**: Gli URL sono case-sensitive e possono variare

### Aggiungere/Modificare GIF
1. Cerca l'esercizio su fitnessprogramer.com
2. Usa WebFetch per trovare l'URL esatto della GIF
3. Aggiorna il campo `gifUrl` nel file exerciseMedia.js
4. Incrementa CACHE_VERSION in sw.js
5. Commit e push

### Fallback SVG
Se una GIF non si carica, viene mostrata un'animazione SVG di fallback definita in `SVG_ANIMATIONS`.

## Struttura Dati Esercizi

### warmups.js
```javascript
WARMUPS_DB = {
    "upper": { name: "...", exercises: [...] },
    "lower": { name: "...", exercises: [...] },
    // ... altri gruppi muscolari
}

COOLDOWN_DB = {
    // stesso formato per stretching
}
```

### exerciseMedia.js
```javascript
WARMUP_DETAILS = {
    "Nome Esercizio": {
        gifUrl: "https://...",
        svgAnimation: "nome-animazione", // fallback
        execution: {
            steps: ["passo 1", "passo 2"],
            tips: ["consiglio 1", "consiglio 2"]
        }
    }
}
```

## Funzionalità Principali

### Pagine (SPA)
- Dashboard: statistiche e prossimo allenamento
- Allenamento: sessione attiva con timer
- Esercizi: catalogo esercizi
- Schede: programmi di allenamento
- Progressi: grafici e statistiche
- Profilo: dati utente
- Impostazioni: tema, export/import dati, svuota cache

### Modale Info Esercizio
- Si apre cliccando icona (i) su un esercizio
- Mostra: GIF animata, passi esecuzione, consigli
- Funzione: `showExerciseInfoModal()` in app.js
- Dati da: `getExerciseMediaInfo()` in exerciseMedia.js

## Problemi Comuni

### GIF non si caricano
1. Verificare URL corretto su fitnessprogramer.com
2. Alcuni URL sono case-sensitive
3. Il sito potrebbe bloccare hotlinking
4. Controllare console browser per errori

### Cache non si aggiorna
1. Incrementare CACHE_VERSION in sw.js
2. Usare pulsante "Svuota Cache e Aggiorna" nelle impostazioni
3. In alternativa: DevTools → Application → Clear storage

### Push fallisce con 403
- Claude può pushare SOLO su branch `claude/*-IDVRj`
- Se il branch ha nome diverso, rinominarlo su GitHub

## Checklist per Modifiche

1. [ ] Fare le modifiche ai file
2. [ ] Se modifichi exerciseMedia.js → incrementa CACHE_VERSION
3. [ ] `git add -A`
4. [ ] `git commit -m "tipo: descrizione"`
5. [ ] `git push origin claude/main-IDVRj`
6. [ ] Aspettare deploy GitHub Pages (~1-2 minuti)
7. [ ] Testare su https://erold90.github.io/Gym

## Contatti Repository
- Owner: erold90
- Repo: https://github.com/erold90/Gym
