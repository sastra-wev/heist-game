// render.js — all canvas drawing: floor, lamp pools, cover, vision cones,
// guards, cameras, loot, Rook, the getaway van zone, the HUD, and every
// screen (title / pause / level-clear / caught / win). Code-drawn only.
import { CONFIG } from "./config.js";

const GOLD = "#c9a227";
const FLOOR_A = "#1c1f36";
const FLOOR_B = "#232647";
const WALL = "#2e3350";
const INK = "#e8e4d8";

function conePath(ctx, x, y, angle, range, half) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - half, angle + half);
  ctx.closePath();
}

function drawCone(ctx, x, y, angle, range, half, color, alpha) {
  const grad = ctx.createRadialGradient(x, y, 8, x, y, range);
  grad.addColorStop(0, color.replace("A", String(alpha)));
  grad.addColorStop(1, color.replace("A", "0"));
  ctx.fillStyle = grad;
  conePath(ctx, x, y, angle, range, half);
  ctx.fill();
  ctx.strokeStyle = color.replace("A", String(Math.min(0.5, alpha + 0.15)));
  ctx.lineWidth = 1;
  ctx.stroke();
}

function fmtTime(t) {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function drawWorld(ctx, world) {
  const W = CONFIG.W;
  const H = CONFIG.H;
  const level = world.level;

  // Floor: deep blue-purple checker with faint speckles.
  for (let y = 0; y < 12; y++) {
    for (let x = 0; x < 20; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? FLOOR_A : FLOOR_B;
      ctx.fillRect(x * 64, 56 + y * 64, 64, 64);
    }
  }
  for (const s of world.speckles) {
    ctx.fillStyle = `rgba(255,255,255,${s.a})`;
    ctx.fillRect(s.x, s.y, s.s, s.s);
  }

  // Warm lamp pools on the floor.
  for (const lamp of level.lamps) {
    const g = ctx.createRadialGradient(lamp.x, lamp.y, 4, lamp.x, lamp.y, lamp.r);
    g.addColorStop(0, "rgba(255, 214, 138, 0.20)");
    g.addColorStop(1, "rgba(255, 214, 138, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(lamp.x, lamp.y, lamp.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Exit: the green getaway van zone.
  const e = level.exit;
  const open = world.mainTaken;
  const pulse = open ? 0.55 + 0.35 * Math.sin(world.time * 4) : 0.25;
  ctx.fillStyle = open ? `rgba(46, 160, 90, ${pulse})` : "rgba(46, 120, 80, 0.22)";
  ctx.fillRect(e.x, e.y, e.w, e.h);
  ctx.strokeStyle = open ? "#4be38a" : "#2e7a4d";
  ctx.lineWidth = 3;
  ctx.strokeRect(e.x + 1.5, e.y + 1.5, e.w - 3, e.h - 3);
  ctx.fillStyle = open ? "#c9ffd9" : "#7fb894";
  ctx.font = "bold 13px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("VAN", e.x + e.w / 2, e.y + e.h / 2 - 4);
  ctx.font = "10px sans-serif";
  ctx.fillText(open ? "GETAWAY" : "LOCKED", e.x + e.w / 2, e.y + e.h / 2 + 12);

  // Cover: display cases (glass + gold frame), pillars, crates, the vault.
  for (const c of level.cover) {
    if (c.kind === "case") {
      ctx.fillStyle = "#161a2e";
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.fillStyle = "#3a4a6b";
      ctx.fillRect(c.x + 3, c.y + 3, c.w - 6, c.h - 6);
      ctx.fillStyle = "rgba(190, 220, 255, 0.35)";
      ctx.fillRect(c.x + 8, c.y + 6, c.w - 16, 5);
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 2;
      ctx.strokeRect(c.x + 1, c.y + 1, c.w - 2, c.h - 2);
    } else if (c.kind === "pillar") {
      ctx.fillStyle = "#4a4a6b";
      ctx.beginPath();
      ctx.arc(c.x + c.w / 2, c.y + c.h / 2, c.w / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#5d5d85";
      ctx.beginPath();
      ctx.arc(c.x + c.w / 2, c.y + c.h / 2, c.w / 2 - 6, 0, Math.PI * 2);
      ctx.fill();
    } else if (c.kind === "vault") {
      ctx.fillStyle = "#3d3a2a";
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 4;
      ctx.strokeRect(c.x + 2, c.y + 2, c.w - 4, c.h - 4);
      ctx.fillStyle = GOLD;
      ctx.beginPath();
      ctx.arc(c.x + c.w / 2, c.y + c.h / 2, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#3d3a2a";
      ctx.beginPath();
      ctx.arc(c.x + c.w / 2, c.y + c.h / 2, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = GOLD;
      ctx.font = "bold 12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("VAULT", c.x + c.w / 2, c.y + 16);
    } else {
      ctx.fillStyle = "#5a4632";
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.strokeStyle = "#7a6248";
      ctx.lineWidth = 2;
      ctx.strokeRect(c.x + 1, c.y + 1, c.w - 2, c.h - 2);
      ctx.beginPath();
      ctx.moveTo(c.x, c.y);
      ctx.lineTo(c.x + c.w, c.y + c.h);
      ctx.stroke();
    }
  }

  // Loot.
  for (const l of world.loot) {
    if (l.taken) continue;
    const glow = 0.5 + 0.3 * Math.sin(world.time * 3 + l.x);
    if (l.kind === "diamond" || l.kind === "crown" || l.kind === "idol") {
      const g = ctx.createRadialGradient(l.x, l.y, 2, l.x, l.y, 34);
      g.addColorStop(0, `rgba(255, 215, 90, ${glow})`);
      g.addColorStop(1, "rgba(255, 215, 90, 0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(l.x, l.y, 34, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = l.kind === "diamond" ? "#bfe8ff" : "#ffd75e";
      ctx.beginPath();
      ctx.moveTo(l.x, l.y - 14);
      ctx.lineTo(l.x + 12, l.y);
      ctx.lineTo(l.x, l.y + 14);
      ctx.lineTo(l.x - 12, l.y);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#fff6c9";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#fff2b0";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(l.label.toUpperCase(), l.x, l.y - 24);
    } else if (l.kind === "painting") {
      ctx.fillStyle = "#8a6d2f";
      ctx.fillRect(l.x - 22, l.y - 15, 44, 30);
      ctx.fillStyle = "#7fa8c9";
      ctx.fillRect(l.x - 18, l.y - 11, 36, 22);
      ctx.fillStyle = "#e8d27a";
      ctx.beginPath();
      ctx.arc(l.x - 6, l.y - 3, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#3d6b4f";
      ctx.fillRect(l.x - 18, l.y + 4, 36, 7);
      ctx.fillStyle = "#fff2b0";
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("$" + l.value, l.x, l.y - 22);
    } else {
      ctx.fillStyle = "#ffd75e";
      for (let i = 0; i < 3; i++) {
        ctx.fillRect(l.x - 14 + i * 10, l.y + 4 - i * 5, 12, 6);
      }
      ctx.strokeStyle = "#a87f1f";
      ctx.lineWidth = 1;
      ctx.strokeRect(l.x - 14, l.y - 6, 32, 16);
      ctx.fillStyle = "#fff2b0";
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("$" + l.value, l.x, l.y - 14);
    }
  }

  // Walls with gold trim.
  for (const w of level.walls) {
    ctx.fillStyle = WALL;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = "rgba(201, 162, 39, 0.55)";
    if (w.h <= 32 && w.w > 100) ctx.fillRect(w.x, w.y + w.h - 3, w.w, 3);
    if (w.w <= 32 && w.h > 100) ctx.fillRect(w.x + w.w - 3, w.y, 3, w.h);
  }

  // Lamp fixtures.
  for (const lamp of level.lamps) {
    ctx.fillStyle = "#ffd98a";
    ctx.beginPath();
    ctx.arc(lamp.x, lamp.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Smoke cloud.
  if (world.smoke) {
    const s = world.smoke;
    const g = ctx.createRadialGradient(s.x, s.y, 10, s.x, s.y, CONFIG.SMOKE_RADIUS);
    g.addColorStop(0, "rgba(200, 200, 210, 0.55)");
    g.addColorStop(1, "rgba(200, 200, 210, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(s.x, s.y, CONFIG.SMOKE_RADIUS, 0, Math.PI * 2);
    ctx.fill();
  }

  // Cameras: wall box + sweeping cone.
  for (const cam of world.cameras) {
    const disabled = world.time < cam.disabledUntil;
    const blind = smokeCoversWorld(world, cam.x, cam.y);
    const col = disabled || blind ? "rgba(120,120,130,A)" : "rgba(255, 70, 70, A)";
    if (!disabled && !blind) {
      drawCone(ctx, cam.x, cam.y, cam.angle, CONFIG.CAMERA_RANGE, CONFIG.CAMERA_HALF_ANGLE, "rgba(255, 60, 60, A)", 0.3);
    }
    ctx.fillStyle = "#22263d";
    ctx.fillRect(cam.x - 8, cam.y - 8, 16, 16);
    ctx.strokeStyle = disabled || blind ? "#777" : "#ff5555";
    ctx.lineWidth = 2;
    ctx.strokeRect(cam.x - 8, cam.y - 8, 16, 16);
    ctx.fillStyle = disabled || blind ? "#777" : "#ff2222";
    ctx.beginPath();
    ctx.arc(cam.x + Math.cos(cam.angle) * 6, cam.y + Math.sin(cam.angle) * 6, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Guards: body, facing tick, and vision cone (red when alert,
  // amber when suspicious, pale red on patrol).
  for (const g of world.guards) {
    const blind = world.time < g.blindUntil;
    let coneColor = "rgba(255, 90, 90, A)";
    let coneAlpha = 0.27;
    if (g.state === "alert") {
      coneColor = "rgba(255, 40, 40, A)";
      coneAlpha = 0.45;
    } else if (g.state === "suspicious" || g.state === "search") {
      coneColor = "rgba(255, 200, 60, A)";
      coneAlpha = 0.36;
    }
    if (!blind) drawCone(ctx, g.x, g.y, g.dir, CONFIG.GUARD_RANGE, CONFIG.GUARD_HALF_ANGLE, coneColor, coneAlpha);
    ctx.fillStyle = "#39415e";
    ctx.beginPath();
    ctx.arc(g.x, g.y, CONFIG.GUARD_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = g.state === "alert" ? "#ff4444" : "#8a93b8";
    ctx.lineWidth = 2;
    ctx.stroke();
    // Cap brim shows facing.
    ctx.strokeStyle = "#d8d2c0";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    ctx.lineTo(g.x + Math.cos(g.dir) * 16, g.y + Math.sin(g.dir) * 16);
    ctx.stroke();
    // Detection ring.
    if (g.detection > 0.05) {
      ctx.strokeStyle = g.detection > 0.85 ? "#ff3333" : "#ffcc33";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(g.x, g.y, CONFIG.GUARD_R + 5, -Math.PI / 2, -Math.PI / 2 + g.detection * Math.PI * 2);
      ctx.stroke();
    }
    if (g.state === "alert") {
      ctx.fillStyle = "#ff3333";
      ctx.font = "bold 16px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("!", g.x, g.y - 20);
    } else if (g.state === "suspicious") {
      ctx.fillStyle = "#ffcc33";
      ctx.font = "bold 16px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("?", g.x, g.y - 20);
    }
  }

  // Rook, the thief: bright purple hood, gold trim, name tag; smaller and
  // darker while sneaking.
  const p = world.player;
  const pr = p.sneaking ? 10 : CONFIG.PLAYER_R;
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + pr + 3, pr, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = p.sneaking ? "#5a3f8f" : "#9a6fd8";
  ctx.beginPath();
  ctx.arc(p.x, p.y, pr, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.fillStyle = "#14101f";
  ctx.beginPath();
  ctx.arc(p.x + Math.cos(p.dir) * 4, p.y + Math.sin(p.dir) * 4, pr - 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffd75e";
  ctx.beginPath();
  ctx.arc(p.x + Math.cos(p.dir) * 7, p.y + Math.sin(p.dir) * 7, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffe9a8";
  ctx.font = "bold 10px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("ROOK", p.x, p.y - pr - 6);

  // Click-to-move target marker.
  if (p.clickTarget) {
    ctx.strokeStyle = "rgba(255, 215, 94, 0.8)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.clickTarget.x, p.clickTarget.y, 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(p.clickTarget.x - 12, p.clickTarget.y);
    ctx.lineTo(p.clickTarget.x + 12, p.clickTarget.y);
    ctx.moveTo(p.clickTarget.x, p.clickTarget.y - 12);
    ctx.lineTo(p.clickTarget.x, p.clickTarget.y + 12);
    ctx.stroke();
  }

  // Flash message.
  if (world.messageTimer > 0) {
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "center";
    const tw = ctx.measureText(world.message).width + 28;
    ctx.fillStyle = "rgba(10, 12, 26, 0.85)";
    ctx.fillRect((W - tw) / 2, 76, tw, 30);
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 1;
    ctx.strokeRect((W - tw) / 2, 76, tw, 30);
    ctx.fillStyle = "#ffe9a8";
    ctx.fillText(world.message, W / 2, 96);
  }
}

function smokeCoversWorld(world, x, y) {
  if (!world.smoke) return false;
  return Math.hypot(x - world.smoke.x, y - world.smoke.y) < CONFIG.SMOKE_RADIUS;
}

export function drawHUD(ctx, world, best) {
  const W = CONFIG.W;
  ctx.fillStyle = "#12142a";
  ctx.fillRect(0, 0, W, CONFIG.HUD_H);
  ctx.fillStyle = GOLD;
  ctx.fillRect(0, CONFIG.HUD_H, W, 2);

  ctx.textAlign = "left";
  ctx.fillStyle = GOLD;
  ctx.font = "bold 15px sans-serif";
  ctx.fillText("VELVET VAULT", 14, 22);
  ctx.fillStyle = "#9aa0c3";
  ctx.font = "12px sans-serif";
  ctx.fillText(world.level.name, 14, 40);

  // Alarm meter.
  const ax = 210;
  const aw = 220;
  ctx.fillStyle = "#e8e4d8";
  ctx.font = "bold 12px sans-serif";
  ctx.fillText("ALARM", ax, 22);
  ctx.fillStyle = "#0a0c1a";
  ctx.fillRect(ax, 28, aw, 14);
  const frac = world.alarm / CONFIG.ALARM_MAX;
  const alarmColor = frac < 0.4 ? "#37b24d" : frac < 0.75 ? "#f2c531" : "#e03131";
  ctx.fillStyle = alarmColor;
  if (frac >= 0.75 && Math.sin(world.time * 10) > 0) ctx.fillStyle = "#ff6b6b";
  ctx.fillRect(ax + 1, 29, Math.max(0, (aw - 2) * frac), 12);
  ctx.strokeStyle = "#555a7a";
  ctx.lineWidth = 1;
  ctx.strokeRect(ax, 28, aw, 14);
  ctx.fillStyle = "#e8e4d8";
  ctx.font = "11px sans-serif";
  ctx.fillText(Math.round(world.alarm) + "%", ax + aw + 8, 40);

  // Loot.
  ctx.fillStyle = "#ffd75e";
  ctx.font = "bold 16px sans-serif";
  ctx.fillText("$" + world.score.toLocaleString("en-US"), 500, 26);
  ctx.fillStyle = "#9aa0c3";
  ctx.font = "11px sans-serif";
  ctx.fillText("LOOT", 500, 42);

  // Tools.
  ctx.fillStyle = "#e8e4d8";
  ctx.font = "bold 13px sans-serif";
  ctx.fillText(`SMOKE x${world.tools.smoke} [Q]`, 640, 26);
  ctx.fillText(`EMP x${world.tools.emp} [E]`, 640, 44);

  // Timer + objective, right column (no overlap).
  ctx.textAlign = "right";
  ctx.fillStyle = world.mainTaken ? "#4be38a" : "#ffe9a8";
  ctx.font = "bold 12px sans-serif";
  const objective = world.mainTaken
    ? "TARGET SECURED — REACH THE VAN"
    : "STEAL " + world.level.loot.find((l) => l.main).label.toUpperCase();
  ctx.fillText(objective, W - 14, 22);
  ctx.fillStyle = "#e8e4d8";
  ctx.font = "bold 16px sans-serif";
  ctx.fillText("TIME  " + fmtTime(world.time), W - 14, 44);
  ctx.fillStyle = "#9aa0c3";
  ctx.font = "11px sans-serif";
  ctx.fillText(best > 0 ? "BEST $" + best.toLocaleString("en-US") : "", W - 14, 40);
  ctx.textAlign = "left";
}

function panel(ctx, title, lines, accent) {
  const W = CONFIG.W;
  const H = CONFIG.H;
  ctx.fillStyle = "rgba(8, 9, 20, 0.78)";
  ctx.fillRect(0, 0, W, H);
  const pw = 640;
  const ph = 120 + lines.length * 30;
  const px = (W - pw) / 2;
  const py = (H - ph) / 2;
  ctx.fillStyle = "#171a33";
  ctx.fillRect(px, py, pw, ph);
  ctx.strokeStyle = accent || GOLD;
  ctx.lineWidth = 3;
  ctx.strokeRect(px, py, pw, ph);
  ctx.fillStyle = accent || GOLD;
  ctx.font = "bold 34px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(title, W / 2, py + 58);
  ctx.fillStyle = INK;
  ctx.font = "15px sans-serif";
  lines.forEach((line, i) => {
    ctx.fillText(line, W / 2, py + 100 + i * 30);
  });
}

export function drawTitle(ctx, best) {
  const W = CONFIG.W;
  const H = CONFIG.H;
  // Translucent veil so the gallery stays visible behind the title.
  ctx.fillStyle = "rgba(8, 9, 20, 0.74)";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = GOLD;
  ctx.font = "bold 56px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("VELVET VAULT", W / 2, 150);
  ctx.fillStyle = "#c9b8ff";
  ctx.font = "italic 20px sans-serif";
  ctx.fillText("A midnight heist at the Halcyon Gallery", W / 2, 186);
  ctx.fillStyle = INK;
  ctx.font = "16px sans-serif";
  const lines = [
    "You are Rook. Slip past the guards, dodge the cameras,",
    "steal The Velvet Diamond — then reach the green van and vanish.",
    "",
    "WASD / arrows — move      SHIFT — sneak (slow, hard to spot)",
    "Click a floor tile — walk there      Q — smoke bomb      E — EMP pulse",
    "P — pause      M — mute      R — restart level",
    "",
    "Tools cost 50 points each. Fill the alarm meter and you are BUSTED.",
  ];
  lines.forEach((line, i) => ctx.fillText(line, W / 2, 240 + i * 28));
  if (best > 0) {
    ctx.fillStyle = "#ffd75e";
    ctx.font = "bold 18px sans-serif";
    ctx.fillText("BEST SCORE  $" + best.toLocaleString("en-US"), W / 2, 240 + lines.length * 28 + 10);
  }
  ctx.fillStyle = GOLD;
  ctx.font = "bold 20px sans-serif";
  const blink = Math.sin(Date.now() / 350) > 0 ? 1 : 0.25;
  ctx.globalAlpha = blink;
  ctx.fillText("PRESS ENTER OR CLICK TO START", W / 2, 640);
  ctx.globalAlpha = 1;
}

export function drawPaused(ctx) {
  panel(ctx, "PAUSED", ["Take a breath. The guards keep their rounds.", "P or click — resume      R — restart level"], "#9aa0c3");
}

export function drawLevelClear(ctx, world) {
  panel(ctx, "CLEAN GETAWAY!", [
    `${world.level.name} cleared`,
    `Loot this level: $${world.levelScore.toLocaleString("en-US")}`,
    `Time bonus: $${(world.timeBonus || 0).toLocaleString("en-US")}`,
    `Total score: $${world.score.toLocaleString("en-US")}`,
    "",
    "ENTER or click — next level",
  ]);
}

export function drawCaught(ctx, world) {
  const why = world.caughtBy === "guard" ? "A guard grabbed you." : "The alarm hit 100%.";
  panel(ctx, "BUSTED!", [why, "The Halcyon Gallery keeps its treasures — this time.", "", "R or click — try the level again"], "#e03131");
}

export function drawWin(ctx, world, best) {
  panel(ctx, "THE VAULT IS YOURS", [
    "All three wings cleared. Rook vanishes into the night",
    "with The Velvet Diamond, The Crown Jewels and The Golden Idol.",
    "",
    `Final score: $${world.score.toLocaleString("en-US")}`,
    best > 0 ? `Best score: $${best.toLocaleString("en-US")}` : "",
    "",
    "ENTER or click — play again",
  ], "#4be38a");
}
