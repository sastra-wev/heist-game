// main.js — boot + fixed 1/60 s step loop + screen state machine
// (title / play / paused / level-clear / caught / win). Handles ?shot=
// staging (paint twice, set window.__shotReady) vs normal play.
import { CONFIG } from "./config.js";
import { LEVELS } from "./levels.js";
import { createWorld, stepWorld } from "./world.js";
import { createInput } from "./input.js";
import { drawWorld, drawHUD, drawTitle, drawPaused, drawLevelClear, drawCaught, drawWin } from "./render.js";
import { initAudio, toggleMute, sfx } from "./audio.js";
import { stageShot } from "./shots.js";

const BEST_KEY = "velvet-vault-best";

function loadBest() {
  try {
    return Number(window.localStorage.getItem(BEST_KEY)) || 0;
  } catch (e) {
    return 0;
  }
}

function saveBest(score) {
  try {
    window.localStorage.setItem(BEST_KEY, String(score));
  } catch (e) {
    // ignore
  }
}

function parseQuery() {
  const q = new URLSearchParams(window.location.search);
  const shot = q.get("shot");
  const seed = Number(q.get("seed") || "1") || 1;
  const level = Math.min(Math.max(Number(q.get("level") || "1") - 1, 0), LEVELS.length - 1);
  return { shot, seed, level };
}

function main() {
  const canvas = document.getElementById("game");
  const statusEl = document.getElementById("status");
  const ctx = canvas.getContext("2d");
  const input = createInput();
  input.attach(canvas, () => initAudio());

  const { shot, seed, level } = parseQuery();
  let best = loadBest();

  function announce(text) {
    if (statusEl) statusEl.textContent = text;
  }

  // ---- screenshot staging ---------------------------------------------
  if (shot === "start" || shot === "play" || shot === "end") {
    const staged = stageShot(shot, seed, level);
    const world = staged.world;
    if (staged.screen === "title") {
      drawWorld(ctx, world);
      drawHUD(ctx, world, best);
      drawTitle(ctx, best);
    } else {
      drawWorld(ctx, world);
      drawHUD(ctx, world, best);
      if (staged.screen === "caught") drawCaught(ctx, world);
    }
    // Paint twice, then signal the capture script.
    if (staged.screen === "title") {
      drawWorld(ctx, world);
      drawHUD(ctx, world, best);
      drawTitle(ctx, best);
    } else {
      drawWorld(ctx, world);
      drawHUD(ctx, world, best);
      if (staged.screen === "caught") drawCaught(ctx, world);
    }
    announce(`Velvet Vault — ${shot} scene staged`);
    window.__shotReady = true;
    return;
  }

  // ---- normal play ------------------------------------------------------
  let screen = "title";
  let levelIndex = level;
  let world = createWorld(levelIndex, seed, 0);
  let totalScore = 0;
  let last = performance.now();
  let acc = 0;
  let stepCount = 0;

  function startLevel(i, carried) {
    levelIndex = i;
    world = createWorld(i, seed, carried);
    screen = "play";
    announce(`${world.level.name} — steal ${world.level.loot.find((l) => l.main).label}, then reach the green van.`);
  }

  function render() {
    if (screen === "title") {
      drawWorld(ctx, world);
      drawHUD(ctx, world, best);
      drawTitle(ctx, best);
      return;
    }
    drawWorld(ctx, world);
    drawHUD(ctx, world, best);
    if (screen === "paused") drawPaused(ctx);
    else if (screen === "level-clear") drawLevelClear(ctx, world);
    else if (screen === "caught") drawCaught(ctx, world);
    else if (screen === "win") drawWin(ctx, world, best);
  }

  function confirm() {
    sfx.click();
    if (screen === "title") {
      totalScore = 0;
      startLevel(0, 0);
    } else if (screen === "level-clear") {
      totalScore = world.score;
      if (levelIndex + 1 < LEVELS.length) startLevel(levelIndex + 1, totalScore);
      else screen = "win";
    } else if (screen === "caught") {
      startLevel(levelIndex, totalScore);
    } else if (screen === "win") {
      totalScore = 0;
      startLevel(0, 0);
    }
  }

  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;

    if (input.wasPressed("KeyM")) {
      const muted = toggleMute();
      announce(muted ? "Sound muted." : "Sound on.");
    }
    if (input.wasPressed("KeyP") && (screen === "play" || screen === "paused")) {
      screen = screen === "play" ? "paused" : "play";
      announce(screen === "paused" ? "Paused." : "Resumed.");
    }
    if (input.wasPressed("KeyR") && (screen === "play" || screen === "paused" || screen === "caught")) {
      startLevel(levelIndex, totalScore);
      announce("Level restarted.");
    }
    if ((input.wasPressed("Enter") || input.wasPressed("Space") || input.click) && screen !== "play" && screen !== "paused") {
      input.click = null;
      confirm();
    }

    if (screen === "play") {
      acc += dt;
      const step = 1 / 60;
      while (acc >= step) {
        const before = world.status;
        const alarmBefore = world.alarm;
        stepWorld(world, input, step);
        stepCount++;
        if (stepCount % 30 === 0 && world.player.moving) sfx.footstep();
        if (world.lastPickup) {
          sfx.pickup();
          announce(`${world.lastPickup} — $${world.score}.`);
          world.lastPickup = null;
        }
        if (world.alarm > 60 && alarmBefore <= 60) {
          sfx.alarmBlip();
          announce("Alarm rising — break line of sight!");
        }
        if (world.status === "caught" && before !== "caught") {
          sfx.caught();
          announce("Busted! The alarm went off. Press R to retry.");
        }
        if (world.status === "cleared" && before !== "cleared") {
          sfx.fanfare();
          totalScore = world.score;
          if (totalScore > best) {
            best = totalScore;
            saveBest(best);
          }
          screen = levelIndex + 1 < LEVELS.length ? "level-clear" : "win";
          announce(`${world.level.name} cleared — $${world.score}.`);
        }
        acc -= step;
      }
    }
    input.endFrame();
    render();
    requestAnimationFrame(frame);
  }

  announce("Velvet Vault — a midnight heist at the Halcyon Gallery. Press Enter to start.");
  // Expose a small debug handle for headless playtests.
  window.__velvet = {
    get screen() {
      return screen;
    },
    get world() {
      return world;
    },
    get best() {
      return best;
    },
  };
  requestAnimationFrame(frame);
}

main();
