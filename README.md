# DON'T BREAK THE LOOP

> *"The room learns how you play. To escape, stop playing like yourself."*

A psychological mystery and puzzle escape web game where the player is trapped inside a mysterious room. Every time the player escapes, they awaken back in the same room. The room watches the player's behavior, constructs a psychometric profile, anticipates their habits, and counters their actions.

To achieve true freedom, the player must realize: **"The room is predicting me"** and deliberately break their own behavioral pattern.

---

## 👁️ Core Mechanics

- **The Room Learns How You Play**: Every click, inspect, wait, item collection, and sequence order is tracked and analyzed across loops.
- **Hidden Behavioral Profiling**: Classifies players across 7 distinct archetypes:
  - **Rusher** (sprinting straight to exits and locks)
  - **Explorer** (compulsively scanning every object)
  - **Repeater** (clicking the same targets repeatedly)
  - **Collector** (hoarding all items immediately)
  - **Observer** (lingering on notes, mirrors, and clocks)
  - **Risk Taker** (poking dark anomalies and unprompted hazards)
  - **Pattern Player** (repeating identical sequence loops)
- **Deterministic 8-Loop Progression**:
  - **Loop 1: The Initial Escape (Normalcy)** — Drawer Brass Key $\rightarrow$ Desk Strange Note $\rightarrow$ Clock time code `4-8-1` $\rightarrow$ Door Unlock.
  - **Loop 2: The Return & Realization ("Time Is Not Resetting")** — Drawer empty $\rightarrow$ Note rewritten $\rightarrow$ Clock backward $\rightarrow$ Floor tile Silver Key $\rightarrow$ Desk scratches $\rightarrow$ Door exit.
  - **Loop 3: Environmental Anomalies & Subtle Observation** — Lamp UV light mode $\rightarrow$ Mirror 500ms lag $\rightarrow$ Painting eye shifts $\rightarrow$ Clock Roman numerals $\rightarrow$ Ornate Dial to Door.
  - **Loop 4: The Room Begins Reacting to Repeated Behavior** — Room counters player's dominant habit (*"YOU ALWAYS CHECK THE DOOR FIRST"*, scalding handle, bolted drawer) $ightarrow$ Must do opposite to release latch.
  - **Loop 5: Awareness & Counter-Deception ("The Room Is Learning You")** — Obvious drawer key is a deceptive decoy/trap $ightarrow$ Hidden clue in dark mirror angle / floor cavity $ightarrow$ Prism Token to desk.
  - **Loop 6: Preemptive Prediction Phase 1** — Room predicts player's 3-action sequence and blocks/shifts objects before clicking $ightarrow$ Player must deliberately break sequence to trigger `PREDICTION FAILED`.
  - **Loop 7: Hyper-Prediction Phase 2 & The Final Reveal** — Full psychological reveal: *"YOU WERE TRAPPED BY YOUR PATTERN. TO ESCAPE, DO SOMETHING YOU WOULD NEVER DO."*
  - **Loop 8: The Final Confrontation & Pattern-Breaking** — Dynamic puzzle tailored to the player's dominant profile (Rusher, Collector, Repeater, Explorer, Observer).
- **3 Distinct Endings**:
  1. **Ending 1: ESCAPE (True Exit)** — Pattern broken, system override, loop terminated.
  2. **Ending 2: TRAPPED (Loop $\infty$)** — Player stubbornly repeats habits in Loop 8, collapsing reality into static.
  3. **Ending 3: SECRET (The Architect / Assimilation)** — Darkness mirror ritual in Loop 8 reveals the Architect's Core.
- **Replayability & "SECOND RUN?"**: Meta-memory preserves past run dossiers and psychometric profiles.
- **Procedural Web Audio Engine**: Zero external audio asset dependencies. Real-time procedural synthesis for ambient drones, ticking grandfather clocks, door thuds, drawer slides, glass mirror resonances, glitch bursts, and ending crescendos.

---

## 🛠️ Tech Stack

- **React 18** + **TypeScript**
- **Vite** (Lightning-fast build tool)
- **Tailwind CSS** (Atmospheric dark mystery styling, CRT scanlines, chromatic aberration)
- **Lucide React** (Clean, minimalist iconography)
- **Web Audio API** (Custom procedural audio synthesizer)
- **LocalStorage** (Zero-backend browser persistence and run history)

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or pnpm

### Installation

```bash
# Clone or navigate to the project directory
cd dont-break-the-loop

# Install dependencies
npm install

# Start the local development server
npm run dev
```

The game will be available at `http://localhost:5173`.

### Production Build

```bash
# Typecheck and build optimized bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 📁 Project Structure

```
dont-break-the-loop/
├── index.html
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── src/
│   ├── main.tsx                # React entry point
│   ├── App.tsx                 # Core game controller & loop coordinator
│   ├── index.css               # Atmospheric CSS, scanlines, and glitch effects
│   ├── types/
│   │   └── game.ts             # TypeScript definitions for loops, profile, and room state
│   ├── audio/
│   │   └── soundEngine.ts      # Web Audio procedural synthesis engine
│   ├── engine/
│   │   ├── behaviorEngine.ts   # Behavioral profiler and action prediction
│   │   ├── roomEngine.ts       # 8-loop progression rules, puzzles, clues, and counters
│   │   └── persistence.ts      # LocalStorage save/restore & run history
│   └── components/
│       ├── StartScreen.tsx     # Cinematic title screen & "SECOND RUN" launcher
│       ├── RoomCanvas.tsx      # Layered SVG/CSS interactive room with 10 objects
│       ├── InspectModal.tsx    # High-detail inspection overlays & puzzle interactions
│       ├── InventoryBar.tsx    # Tactile item tray with inspect & select
│       ├── HUD.tsx             # Loop counter, anomaly meter, audio toggle
│       ├── Toast.tsx           # Narrative messages & psychological whispers
│       ├── Endings.tsx         # Cinematic sequences for Escape, Trapped, and Secret
│       └── GlitchOverlay.tsx   # CRT scanlines, vignette, and chromatic distortion
```

---

## 📜 License

MIT License. Crafted with dark atmospheric passion.
