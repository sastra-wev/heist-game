# Velvet Vault

[![Competition](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![Rank](https://make.fun/badge/best-heist-game-20261122-0559/sastra-wev/heist-game/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![Reward](https://make.fun/badge/best-heist-game-20261122-0559/sastra-wev/heist-game/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)

**Velvet Vault** is a top-down stealth heist game. You are **Rook**, a thief
hired to empty the **Halcyon Gallery** at midnight: slip past patrolling
guards and sweeping cameras, steal **The Velvet Diamond**, the Crown Jewels
and the Golden Idol across three wings, then reach the green getaway van
and vanish.

## How to play

- **WASD / arrow keys** — move. **Shift** — sneak (slower, much harder to
  spot, silent). **Click a floor tile** — walk there.
- **Enter / click** — start, confirm. **P** — pause. **M** — mute.
  **R** — restart level.
- Guards patrol waypoint loops with visible vision cones. When a guard
  spots you its detection ring fills: suspicious, then alert, then it
  chases. Cameras sweep back and forth and raise the alarm while you are
  in their cone.
- The **ALARM** meter rises while anyone sees you and decays while you
  hide. At 100% you are **BUSTED**. Lamps make you easier to spot; dark
  floor and display cases are your friends. Walking is noisy — guards
  nearby hear footsteps; sneaking is silent.
- **Q (or 1)** — smoke bomb, 2 per level, blinds guards and cameras for
  5 s. **E (or 2)** — EMP pulse, 1 per level, kills all cameras for 8 s.
  Each tool costs 50 points.
- Grab the main target (500 points) plus optional paintings and gold
  bars, then reach the green **VAN** zone to clear the level. A time
  bonus rewards a fast, clean getaway. Best score is saved locally.

## How to run

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network requests, no external assets — every graphic
is drawn in code and every sound is synthesised with WebAudio.

Deterministic screenshots: `?seed=N` fixes the layout randomness and
`?shot=start|play|end` stages a scene (`start` = title, `play` = mid-level
action, `end` = caught) and sets `window.__shotReady` when painted.

## File layout

- `game/index.html` — page loading the game module
- `game/src/config.js` — every tuned number in one place
- `game/src/random.js` — seeded random generator
- `game/src/levels.js` — the three level definitions
- `game/src/world.js` — simulation: movement, collision, line of sight, BFS pathfinding, loot, alarm, win/lose
- `game/src/guards.js` — guard vision cones and the patrol/suspicious/alert/search/return state machine
- `game/src/cameras.js` — camera sweep cones, alarm contribution, EMP disable
- `game/src/player.js` — player movement, sneak, noise, tool use
- `game/src/render.js` — all canvas drawing, HUD, and screens
- `game/src/input.js` — keyboard and mouse input
- `game/src/audio.js` — WebAudio synth sounds
- `game/src/shots.js` — staged screenshot scenes
- `game/src/main.js` — boot, fixed-step loop, screen state machine
- `serve.ts` — static file server for `game/` on port 8080
- `main.ts` — hand-in program: copies `game/` + `screenshots/` and writes `dossier.json`
- `vendor/makefun-game.ts` — make.fun dossier library (kit copy, unchanged)

MIT licensed — see LICENSE.
