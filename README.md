# Secret Universe 3D — 100 Secrets (Multiplayer Edition)

A Roblox-inspired 3D secret-hunting game built with **Three.js + React + TypeScript + Vite + Node.js WebSockets**.

## Features
- **Real-Time Multiplayer & Authentication**:
  - Register or Log In on first visit to immediately join the live multiplayer server.
  - See other online players in 3D with custom avatar colors, floating username nameplates (`★` badge for friends), walking/jumping/emote animations, overhead 3D Bubble Chat, player-on-player head-stacking physics, and `[E]` High-Five interactions.
  - **Friends System (`P` or HUD Friends button)**: add friends by username or from the live Online Players list, accept/decline incoming friend requests, track online status/zones, and teleport to online friends.
- **Strictly Client-Side Personal Secrets & Progressive Empty-to-Full Lego World**:
  - Each player has their own personal secret inventory (saved per account on the client) and builds their own world.
  - Starts from an empty world (only a glowing starter pad) and progressively constructs **32 distinct structures** via Lego-style construction cutscenes (camera focus → bottom-to-top brick assembly → single white flash → 0.5s hold → smooth return).
- **100 Unique Secrets across the 6 Difficulty Chart Tiers**:
  - 🟢 **Easy** (24 secrets, starting with `Welcome!`)
  - 🟡 **Medium** (22 secrets)
  - 🟠 **Hard** (18 secrets)
  - 🔴 **Amazing** (15 secrets)
  - 🟣 **Okay?** (12 secrets)
  - ⚫ **Best** (9 secrets, including co-op Multiplayer secrets: `#96 Kindred Spirits`, `#97 Sky Riders`, and `#100 Unity of the Universe`)
- **Full Bilingual Localization**: English by default, switchable live between **English** and **Russian** in Settings (including in-world 3D signs).
- **Roblox-Style Camera, Index (`Tab`), Pause/Settings (`Esc`), and Chat (`/` or `Enter`)**.

## Running Locally
```bash
npm install
npm run server   # Terminal 1: Multiplayer HTTP + WebSocket server (port 3001)
npm run dev      # Terminal 2: Vite frontend with /api and /ws proxy (port 5173)
```
