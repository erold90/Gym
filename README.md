# GymTracker Pro - Documentazione per Claude

## Panoramica
GymTracker Pro è una Progressive Web App (PWA) per il tracciamento degli allenamenti in palestra. È costruita in vanilla JavaScript senza framework.

---

## ⚠️ ISTRUZIONE IMPORTANTE PER CLAUDE

**LAVORA SEMPRE SULLA BRANCH PRINCIPALE `claude/main-IDVRj`**

### Flusso di Lavoro Automatizzato
1. Lavora localmente su `claude/main-IDVRj`
2. Pusha su `claude/main-<TUO_SESSION_ID>`
3. GitHub Actions fa **merge automatico** in `claude/main-IDVRj`
4. GitHub Actions **elimina automaticamente** il branch sorgente
5. Sincronizza il tuo branch locale

```bash
# 1. Checkout branch principale
git fetch origin claude/main-IDVRj
git checkout claude/main-IDVRj

# 2. Fai le modifiche e commit
git add -A && git commit -m "tipo: descrizione"

# 3. Push sul tuo branch (verrà auto-merged e auto-deleted)
git push -u origin claude/main-IDVRj:claude/main-<TUO_SESSION_ID>

# 4. Aspetta ~10 secondi, poi sincronizza
git fetch origin claude/main-IDVRj
git reset --hard origin/claude/main-IDVRj
git branch --set-upstream-to=origin/claude/main-IDVRj
```

### Importante
- Il pattern del branch DEVE essere `claude/main-*` per attivare il workflow
- NON usare `claude/initial-setup-*` o altri pattern
- Dopo il push, il workflow elimina automaticamente il tuo branch

---

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

## ⚠️ SISTEMA GIT E SESSIONI CLAUDE

### Come Funziona
Ogni sessione Claude Code ha un **ID univoco** (es: `DJyrV`, `IDVRj`).
Per sicurezza, Claude può pushare **SOLO** su branch che terminano con il suo ID sessione corrente.

**Esempio:**
- Sessione con ID `ABC12` → può pushare solo su `claude/*-ABC12`
- Sessione con ID `XYZ99` → può pushare solo su `claude/*-XYZ99`

Se Claude prova a pushare su un branch con ID diverso → **errore 403**.

### Deploy Automatico con GitHub Actions

**File**: `.github/workflows/auto-merge-claude.yml`

Il workflow fa **3 cose automaticamente**:
1. **Merge** del branch `claude/main-*` in `claude/main-IDVRj`
2. **Delete** del branch sorgente dopo il merge
3. **Deploy** su GitHub Pages (automatico)

```yaml
name: Auto-merge Claude branches to deploy

on:
  push:
    branches:
      - 'claude/main-*'

permissions:
  contents: write

jobs:
  merge-to-deploy:
    runs-on: ubuntu-latest
    if: github.ref != 'refs/heads/claude/main-IDVRj'

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Configure Git
        run: |
          git config user.name "GitHub Actions Bot"
          git config user.email "actions@github.com"

      - name: Merge to deploy branch
        run: |
          git fetch origin claude/main-IDVRj:claude/main-IDVRj || true
          git checkout claude/main-IDVRj || git checkout -b claude/main-IDVRj
          git merge origin/${{ github.ref_name }} --no-edit -m "Auto-merge: ${{ github.ref_name }}"
          git push origin claude/main-IDVRj

      - name: Delete source branch
        if: success()
        run: |
          git push origin --delete "${{ github.ref_name }}" || true
```

### Configurazione GitHub Pages
1. Vai su **Settings** → **Pages**
2. **Source**: Deploy from a branch
3. **Branch**: `claude/main-IDVRj` (o il branch di deploy)
4. **Folder**: `/ (root)`

### URL Deploy
- **Sito**: https://erold90.github.io/Gym
- **Deploy automatico** ad ogni push (~1-2 minuti)

### Comandi Git Completi per Claude
```bash
# === INIZIO SESSIONE ===
git fetch origin claude/main-IDVRj
git checkout claude/main-IDVRj
git reset --hard origin/claude/main-IDVRj

# === DOPO MODIFICHE ===
git add -A && git commit -m "tipo: descrizione"

# === PUSH (sostituire SESSION_ID con il tuo ID) ===
git push -u origin claude/main-IDVRj:claude/main-SESSION_ID

# === DOPO IL PUSH (aspetta ~10 sec per il workflow) ===
git fetch origin claude/main-IDVRj
git reset --hard origin/claude/main-IDVRj
git branch --set-upstream-to=origin/claude/main-IDVRj

# === VERIFICARE STATO ===
git status
git log --oneline -5
git branch -r | grep claude
```

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

### 10. Database Esercizi Mobile-Friendly
**File**: `css/style.css`

Layout responsive per la pagina Database Esercizi:
- Filter tabs con scroll orizzontale
- GIF più grandi su mobile (180px)
- Grid a colonna singola su schermi piccoli

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
- Svuota SOLO la cache del Service Worker
- NON elimina dati utente (profilo, schede, storico)

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
2. Verifica che URL funzioni (attenzione: case-sensitive!)
3. Aggiorna `gifUrl` in exerciseMedia.js
4. Incrementa CACHE_VERSION in sw.js
5. Push su `claude/main-<SESSION_ID>`

### Fallback SVG
Se GIF non carica, mostra animazione SVG da `SVG_ANIMATIONS`.

## Checklist per Modifiche

1. [ ] Fetch e checkout `claude/main-IDVRj` locale
2. [ ] Fare le modifiche ai file
3. [ ] Se modifichi exerciseMedia.js → incrementa CACHE_VERSION
4. [ ] `git add -A`
5. [ ] `git commit -m "tipo: descrizione"`
6. [ ] `git push -u origin claude/main-IDVRj:claude/main-SESSION_ID`
7. [ ] Aspettare ~10 secondi
8. [ ] Sincronizzare: `git fetch && git reset --hard origin/claude/main-IDVRj`
9. [ ] Aspettare deploy (~1-2 minuti)
10. [ ] Testare su https://erold90.github.io/Gym

## Problemi Comuni

### GIF non si caricano
1. Verificare URL corretto e funzionante
2. Alcuni URL sono case-sensitive (es: `BARBELL-SQUAT.gif`, `HiP-ABDUCTION-MACHINE.gif`)
3. Hotlinking potrebbe essere bloccato
4. Controllare console browser

### Cache non si aggiorna
1. Incrementare CACHE_VERSION in sw.js
2. Usare "Svuota Cache e Aggiorna" nelle impostazioni
3. DevTools → Application → Clear storage

### Push fallisce con 403
**Causa**: Claude può pushare solo su branch con il suo ID sessione corrente.
**Soluzione**: Usare la sintassi `git push origin claude/main-IDVRj:claude/main-SESSION_ID`

### Hook feedback "unpushed commits"
**Causa**: Dopo che GitHub Actions fa merge, il branch locale è "ahead" del remote sbagliato.
**Soluzione**: Sincronizzare con:
```bash
git fetch origin claude/main-IDVRj
git reset --hard origin/claude/main-IDVRj
git branch --set-upstream-to=origin/claude/main-IDVRj
```

### Branch multipli claude/main-*
**Non più un problema!** Il workflow elimina automaticamente i branch dopo il merge.
Se rimangono branch vecchi, eliminarli manualmente:
```bash
git push origin --delete claude/main-VECCHIO_ID
```

## Repository
- **Owner**: erold90
- **Repo**: https://github.com/erold90/Gym
- **Deploy**: https://erold90.github.io/Gym
