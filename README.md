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
    │   ├── exercises.js   # Database esercizi (~180 esercizi)
    │   └── warmups.js     # Database riscaldamento e stretching
    └── modules/
        ├── storage.js       # Gestione localStorage + cicli
        ├── timer.js         # Timer per allenamenti
        ├── algorithm.js     # Algoritmo generazione schede + periodizzazione
        └── exerciseMedia.js # GIF e dettagli esercizi
```

## ⚠️ REGOLE GIT FONDAMENTALI

### Branch UNICO da Usare
- **SEMPRE usare**: `claude/main-IDVRj`
- **MAI creare nuovi branch**
- **MAI usare branch con ID sessione diversi**

### Comandi Git
```bash
# Push modifiche (SEMPRE su main-IDVRj)
git add -A && git commit -m "messaggio" && git push origin claude/main-IDVRj

# Se sei su un branch sbagliato
git checkout claude/main-IDVRj

# Verificare stato
git status
git log --oneline -5
```

### GitHub Pages
- **URL**: https://erold90.github.io/Gym
- **Source**: branch `claude/main-IDVRj`, folder `/ (root)`
- Il deploy è automatico ad ogni push (~1-2 minuti)

## Funzionalità Implementate

### 1. Generazione Schede Personalizzate
**File**: `js/modules/algorithm.js`

L'algoritmo genera schede in base a:
- **Obiettivo**: Forza, Ipertrofia, Ricomposizione, Resistenza
- **Giorni/settimana**: 3-6 giorni
- **Split**: Upper/Lower, PPL, Full Body, Bro Split
- **Durata sessione**: 45, 60, 75, 90 minuti

Configurazioni per obiettivo:
```javascript
// Rep ranges
strength: { compound: '4-6', isolation: '6-8' }
hypertrophy: { compound: '8-12', isolation: '10-15' }
recomp: { compound: '8-10', isolation: '12-15' }
endurance: { compound: '15-20', isolation: '15-25' }

// Tempi di riposo (secondi)
strength: { compound: 180, isolation: 120 }
hypertrophy: { compound: 90, isolation: 60 }
```

### 2. Sistema Cicli e Periodizzazione
**File**: `js/modules/algorithm.js` + `js/modules/storage.js`

Durata cicli automatica in base a obiettivo e livello:
- Forza: 6-10 settimane
- Ipertrofia: 8-12 settimane
- Ricomposizione: 8-10 settimane
- Resistenza: 6-8 settimane

Struttura mesocicli con settimane di deload automatiche:
```javascript
// Esempio ipertrofia
mesocycles: [
    { name: 'Volume', weeks: 3, volumeMultiplier: 1.0 },
    { name: 'Deload', weeks: 1, volumeMultiplier: 0.5 },
    { name: 'Intensificazione', weeks: 3, volumeMultiplier: 0.9 },
    { name: 'Deload', weeks: 1, volumeMultiplier: 0.5 },
    ...
]
```

### 3. Tracking Progresso Ciclo
**File**: `js/modules/storage.js`

Funzioni per gestire il ciclo:
- `getCycleProgress()` - settimana corrente, percentuale, stato deload
- `getCurrentMesocycle()` - mesociclo attivo
- `getWorkoutsInCycle()` - allenamenti nel ciclo
- `resetCycleStartDate()` - riavvia ciclo
- `completeCycle()` - completa ciclo

### 4. Dashboard con Progresso Ciclo
**File**: `index.html` + `js/app.js`

Card nella dashboard che mostra:
- Settimana corrente / totale
- Barra progresso percentuale
- Mesociclo attivo
- Prossima settimana deload
- Giorni rimanenti

### 5. Settimane Deload Automatiche
**File**: `js/app.js`

Durante le settimane deload:
- Banner visivo "SETTIMANA DELOAD"
- Riduzione automatica 50% delle serie
- Notifica all'utente

### 6. Validazione Split/Giorni
**File**: `js/app.js`

Suggerimenti intelligenti per combinazioni ottimali:
- 3 giorni → Full Body consigliato
- 4 giorni → Upper/Lower consigliato
- 5 giorni → PPL o Bro Split
- 6 giorni → PPL consigliato

### 7. Limitazione Esercizi per Durata
**File**: `js/modules/algorithm.js`

Gli esercizi vengono tagliati per rispettare la durata sessione:
```javascript
TIME_CONFIG: {
    warmupTime: 8,      // minuti
    cooldownTime: 5,    // minuti
    secondsPerSet: 45,  // tempo medio per set
    transitionTime: 30  // cambio esercizio
}
```

### 8. Esercizi Aggiunti
**File**: `js/data/exercises.js`

Esercizi recentemente aggiunti:
- Rack Pull, Scrollate Bilanciere, Scrollate Manubri
- Rematore Panca Inclinata (chest-supported-row)
- Rematore Cavo Singolo
- Kettlebell Swing, Battle Ropes, Box Jump
- Burpee, Thruster, Meadows Row
- Croci Cavi Inclinato

### 9. Fix Modal Scroll
**File**: `css/style.css`

Risolto problema scroll pagina dietro modali:
```css
body.modal-open {
    overflow: hidden;
    position: fixed;
    width: 100%;
}
```

## Service Worker e Cache

### File: `sw.js`
- **CACHE_VERSION**: Incrementare ad ogni deploy
- Strategia: Network First per file app, Cache First per GIF

### Aggiornare la Cache
1. Modifica `CACHE_VERSION` in `sw.js`
2. Commit e push
3. L'utente vedrà banner "Nuova versione disponibile!"

### Pulsante Svuota Cache
Posizione: Impostazioni → Gestione Dati → "Svuota Cache e Aggiorna"

## GIF Esercizi

### File: `js/modules/exerciseMedia.js`

Mappe principali:
1. **EXERCISE_GIF_MAP**: GIF per esercizi scheda (per ID)
2. **WARMUP_DETAILS**: GIF per riscaldamento (per nome)
3. **COOLDOWN_DETAILS**: GIF per stretching (per nome)

### Fonti GIF Consigliate
- fitnessprogramer.com (principale)
- Tenor/GIPHY (alternative)
- musclewiki.com

### Aggiungere GIF
1. Cerca GIF professionale dell'esercizio
2. Verifica che URL funzioni
3. Aggiorna `gifUrl` in exerciseMedia.js
4. Incrementa CACHE_VERSION
5. Push su `claude/main-IDVRj`

### Fallback SVG
Se GIF non carica, mostra animazione SVG da `SVG_ANIMATIONS`.

## Checklist per Modifiche

1. [ ] Verificare di essere su `claude/main-IDVRj`
2. [ ] Fare le modifiche ai file
3. [ ] Se modifichi exerciseMedia.js → incrementa CACHE_VERSION
4. [ ] `git add -A`
5. [ ] `git commit -m "tipo: descrizione"`
6. [ ] `git push origin claude/main-IDVRj`
7. [ ] Aspettare deploy (~1-2 minuti)
8. [ ] Testare su https://erold90.github.io/Gym

## Problemi Comuni

### GIF non si caricano
1. Verificare URL corretto e funzionante
2. Alcuni URL sono case-sensitive
3. Hotlinking potrebbe essere bloccato
4. Controllare console browser

### Cache non si aggiorna
1. Incrementare CACHE_VERSION in sw.js
2. Usare "Svuota Cache e Aggiorna" nelle impostazioni
3. DevTools → Application → Clear storage

### Push fallisce con 403
**SOLUZIONE**: Usare SOLO il branch `claude/main-IDVRj`

## Repository
- **Owner**: erold90
- **Repo**: https://github.com/erold90/Gym
- **Deploy**: https://erold90.github.io/Gym
