// world.js — the simulation: movement + wall collision, line of sight,
// BFS pathfinding, loot pickup, the exit, the alarm meter, tools, and
// win / lose status. Everything the screens draw comes from this state.
import { CONFIG } from "./config.js";
import { LEVELS } from "./levels.js";
import { makeRng } from "./random.js";
import { createGuard, guardCanSee, updateGuard } from "./guards.js";
import { createCamera, updateCamera, cameraSees } from "./cameras.js";
import { createPlayer, stepPlayer } from "./player.js";

// ---- geometry -----------------------------------------------------------

function pointInRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

// Liang-Barsky segment vs rect: true when the segment hits the rect.
export function segmentHitsRect(x1, y1, x2, y2, r) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let t0 = 0;
  let t1 = 1;
  const p = [-dx, dx, -dy, dy];
  const q = [x1 - r.x, r.x + r.w - x1, y1 - r.y, r.y + r.h - y1];
  for (let i = 0; i < 4; i++) {
    if (p[i] === 0) {
      if (q[i] < 0) return false;
    } else {
      const t = q[i] / p[i];
      if (p[i] < 0) {
        if (t > t1) return false;
        if (t > t0) t0 = t;
      } else {
        if (t < t0) return false;
        if (t < t1) t1 = t;
      }
    }
  }
  return true;
}

function circleHitsRect(x, y, rad, r) {
  const cx = Math.max(r.x, Math.min(x, r.x + r.w));
  const cy = Math.max(r.y, Math.min(y, r.y + r.h));
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy < rad * rad;
}

// ---- world --------------------------------------------------------------

export function createWorld(levelIndex, seed, carriedScore) {
  const level = LEVELS[levelIndex];
  const rng = makeRng(seed * 7919 + levelIndex * 104729 + 13);
  const obstacles = [...level.walls, ...level.cover];
  const world = {
    levelIndex,
    level,
    seed,
    rng,
    obstacles,
    time: 0,
    score: carriedScore || 0,
    levelScore: 0,
    alarm: 0,
    status: "playing",
    player: createPlayer(level.playerStart),
    guards: level.guards.map((g, i) => createGuard(g, Math.floor(rng() * g.waypoints.length))),
    cameras: level.cameras.map(createCamera),
    loot: level.loot.map((l) => ({ ...l, taken: false })),
    tools: { smoke: CONFIG.SMOKE_COUNT, emp: CONFIG.EMP_COUNT },
    smoke: null,
    empUntil: 0,
    mainTaken: false,
    message: "",
    messageTimer: 0,
    speckles: [],
    cameraAlarm: false,
  };
  for (let i = 0; i < 90; i++) {
    world.speckles.push({
      x: 40 + rng() * 1200,
      y: 96 + rng() * 580,
      a: 0.03 + rng() * 0.05,
      s: 1 + rng() * 2,
    });
  }
  return world;
}

export function lineBlocked(world, x1, y1, x2, y2) {
  for (const r of world.obstacles) {
    if (segmentHitsRect(x1, y1, x2, y2, r)) return true;
  }
  return false;
}

export function lightAt(world, x, y) {
  let best = 0.22;
  for (const lamp of world.level.lamps) {
    const d = Math.hypot(x - lamp.x, y - lamp.y);
    if (d < lamp.r) {
      const v = 1 - (d / lamp.r) * 0.45;
      if (v > best) best = v;
    }
  }
  return best;
}

export function smokeCovers(world, x, y) {
  if (!world.smoke) return false;
  return Math.hypot(x - world.smoke.x, y - world.smoke.y) < CONFIG.SMOKE_RADIUS;
}

// Move a circle body to (nx, ny) with axis-separated collision so it
// slides along walls instead of sticking. Returns true if it moved.
export function moveCircle(world, body, nx, ny) {
  const rad = body.r || CONFIG.PLAYER_R;
  const ox = body.x;
  const oy = body.y;
  let blocked = false;
  for (const r of world.obstacles) if (circleHitsRect(nx, body.y, rad, r)) blocked = true;
  if (!blocked) body.x = nx;
  blocked = false;
  for (const r of world.obstacles) if (circleHitsRect(body.x, ny, rad, r)) blocked = true;
  if (!blocked) body.y = ny;
  return body.x !== ox || body.y !== oy;
}

// BFS over a coarse grid; returns waypoints in world coordinates.
export function findPath(world, sx, sy, tx, ty) {
  const cell = CONFIG.GRID;
  const cols = Math.ceil(CONFIG.W / cell);
  const rows = Math.ceil(CONFIG.H / cell);
  const blocked = (cx, cy) => {
    if (cx < 0 || cy < 0 || cx >= cols || cy >= rows) return true;
    const px = cx * cell + cell / 2;
    const py = cy * cell + cell / 2;
    if (py < CONFIG.PLAY_TOP) return true;
    for (const r of world.obstacles) {
      if (px > r.x - CONFIG.GRID_PAD && px < r.x + r.w + CONFIG.GRID_PAD && py > r.y - CONFIG.GRID_PAD && py < r.y + r.h + CONFIG.GRID_PAD) return true;
    }
    return false;
  };
  const s = { x: Math.floor(sx / cell), y: Math.floor(sy / cell) };
  const t = { x: Math.floor(tx / cell), y: Math.floor(ty / cell) };
  if (blocked(t.x, t.y)) return null;
  const key = (x, y) => y * cols + x;
  const prev = new Map();
  const seen = new Set([key(s.x, s.y)]);
  const queue = [s];
  const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  while (queue.length > 0) {
    const cur = queue.shift();
    if (cur.x === t.x && cur.y === t.y) {
      const cells = [];
      let k = key(cur.x, cur.y);
      let node = cur;
      while (node) {
        cells.unshift({ x: node.x * cell + cell / 2, y: node.y * cell + cell / 2 });
        node = prev.get(k);
        k = node ? key(node.x, node.y) : -1;
      }
      // Drop leading waypoints the body already overlaps (a cell centre
      // can sit inside a wall's padding), and end on the target cell's
      // centre, which is always reachable, rather than the exact click.
      while (cells.length > 1 && Math.hypot(cells[0].x - sx, cells[0].y - sy) < 16) cells.shift();
      return cells;
    }
    for (const [dx, dy] of dirs) {
      const nx = cur.x + dx;
      const ny = cur.y + dy;
      const k = key(nx, ny);
      if (seen.has(k) || blocked(nx, ny)) continue;
      seen.add(k);
      prev.set(k, cur);
      queue.push({ x: nx, y: ny });
    }
  }
  return null;
}

function flash(world, text) {
  world.message = text;
  world.messageTimer = 2.2;
}

export function useTool(world, kind) {
  if (kind === "smoke") {
    if (world.tools.smoke <= 0) return;
    world.tools.smoke -= 1;
    world.score = Math.max(0, world.score - CONFIG.SMOKE_COST);
    world.levelScore -= CONFIG.SMOKE_COST;
    world.smoke = { x: world.player.x, y: world.player.y, until: world.time + CONFIG.SMOKE_SECONDS };
    for (const g of world.guards) {
      if (Math.hypot(g.x - world.player.x, g.y - world.player.y) < CONFIG.SMOKE_RADIUS) {
        g.blindUntil = world.time + CONFIG.SMOKE_SECONDS;
        g.detection = 0;
        if (g.state === "alert") g.state = "search";
      }
    }
    flash(world, "Smoke bomb — eyes off you for 5 seconds (-50)");
  } else if (kind === "emp") {
    if (world.tools.emp <= 0) return;
    world.tools.emp -= 1;
    world.score = Math.max(0, world.score - CONFIG.EMP_COST);
    world.levelScore -= CONFIG.EMP_COST;
    world.empUntil = world.time + CONFIG.EMP_SECONDS;
    for (const c of world.cameras) c.disabledUntil = world.time + CONFIG.EMP_SECONDS;
    flash(world, "EMP pulse — cameras dark for 8 seconds (-50)");
  }
}

export function stepWorld(world, input, dt) {
  if (world.status !== "playing") return;
  world.time += dt;
  if (world.messageTimer > 0) world.messageTimer -= dt;
  if (world.smoke && world.time > world.smoke.until) world.smoke = null;

  const helpers = {
    moveCircle: (body, nx, ny) => moveCircle(world, body, nx, ny),
    findPath: (sx, sy, tx, ty) => findPath(world, sx, sy, tx, ty),
  };
  const tool = stepPlayer(world.player, input, dt, helpers);
  if (tool) useTool(world, tool);

  const ctx = {
    time: world.time,
    lineBlocked: (x1, y1, x2, y2) => lineBlocked(world, x1, y1, x2, y2),
    lightAt: (x, y) => lightAt(world, x, y),
    smokeCovers: (x, y) => smokeCovers(world, x, y),
    moveCircle: (body, nx, ny) => moveCircle(world, body, nx, ny),
  };
  for (const g of world.guards) updateGuard(g, world.player, ctx, dt);
  for (const c of world.cameras) updateCamera(c, world.time);

  // Alarm: rises while anyone sees the thief, decays while hidden.
  let seenByGuard = false;
  for (const g of world.guards) {
    if (guardCanSee(g, world.player, ctx).sees && g.detection > 0.3) seenByGuard = true;
  }
  world.cameraAlarm = false;
  for (const c of world.cameras) {
    if (cameraSees(c, world.player, ctx)) world.cameraAlarm = true;
  }
  if (seenByGuard) world.alarm += CONFIG.ALARM_GUARD_RATE * dt;
  if (world.cameraAlarm) world.alarm += CONFIG.ALARM_CAMERA_RATE * dt;
  if (!seenByGuard && !world.cameraAlarm) world.alarm -= CONFIG.ALARM_DECAY * dt;
  world.alarm = Math.max(0, Math.min(CONFIG.ALARM_MAX, world.alarm));

  // A guard that reaches the thief grabs him.
  for (const g of world.guards) {
    if (Math.hypot(g.x - world.player.x, g.y - world.player.y) < CONFIG.GUARD_CATCH_R) {
      world.status = "caught";
      world.caughtBy = "guard";
      return;
    }
  }
  if (world.alarm >= CONFIG.ALARM_MAX) {
    world.status = "caught";
    world.caughtBy = "alarm";
    return;
  }

  // Loot pickup.
  for (const l of world.loot) {
    if (l.taken) continue;
    if (Math.hypot(l.x - world.player.x, l.y - world.player.y) < CONFIG.LOOT_PICKUP_R) {
      l.taken = true;
      world.score += l.value;
      world.levelScore += l.value;
      flash(world, l.main ? `${l.label} secured! Get to the getaway van.` : `+${l.value} — ${l.label}`);
      if (l.main) world.mainTaken = true;
      world.lastPickup = l.label;
    }
  }

  // Exit: only open once the main target is taken.
  const e = world.level.exit;
  if (world.mainTaken && world.player.x > e.x && world.player.x < e.x + e.w && world.player.y > e.y && world.player.y < e.y + e.h) {
    const timeBonus = Math.max(0, Math.round((world.level.parTime - world.time) * 5));
    world.timeBonus = timeBonus;
    world.score += timeBonus;
    world.levelScore += timeBonus;
    world.status = "cleared";
  }
}

export function levelLootTotal(level) {
  return level.loot.reduce((sum, l) => sum + l.value, 0);
}
