// guards.js — guard vision cones and the patrol / suspicious / alert /
// search / return state machine. Pure functions over plain state; the
// caller (world.js) supplies movement, line of sight and light helpers.
import { CONFIG } from "./config.js";

export function createGuard(def, startIndex) {
  const wp = def.waypoints[startIndex % def.waypoints.length];
  return {
    x: wp.x,
    y: wp.y,
    dir: 0,
    waypoints: def.waypoints,
    wpIndex: startIndex % def.waypoints.length,
    state: "patrol",
    detection: 0,
    lastSeen: null,
    waitTimer: 0,
    searchTimer: 0,
    loseTimer: 0,
    stuckTimer: 0,
    lastX: wp.x,
    lastY: wp.y,
    blindUntil: 0,
    heardAt: null,
  };
}

// True when the guard can currently see the thief: in range, inside the
// cone, line of sight clear, and not blinded by smoke.
export function guardCanSee(g, player, ctx) {
  if (ctx.time < g.blindUntil) return { sees: false, rate: 0 };
  const dx = player.x - g.x;
  const dy = player.y - g.y;
  const dist = Math.hypot(dx, dy);
  if (dist > CONFIG.GUARD_RANGE) return { sees: false, rate: 0 };
  const ang = Math.atan2(dy, dx);
  let diff = Math.abs(ang - g.dir);
  while (diff > Math.PI) diff -= 2 * Math.PI;
  if (Math.abs(diff) > CONFIG.GUARD_HALF_ANGLE) return { sees: false, rate: 0 };
  if (ctx.lineBlocked(g.x, g.y, player.x, player.y)) return { sees: false, rate: 0 };
  const light = ctx.lightAt(player.x, player.y);
  const close = dist < CONFIG.GUARD_RANGE * 0.45 ? CONFIG.DETECT_CLOSE_BONUS : 1;
  const sneak = player.sneaking ? 0.35 : 1;
  const rate = CONFIG.DETECT_BASE * light * close * sneak * (player.moving ? 1.25 : 0.8);
  return { sees: true, rate };
}

function moveToward(g, tx, ty, speed, dt, ctx) {
  const dx = tx - g.x;
  const dy = ty - g.y;
  const d = Math.hypot(dx, dy);
  if (d < 4) return true;
  const step = Math.min(d, speed * dt);
  ctx.moveCircle(g, g.x + (dx / d) * step, g.y + (dy / d) * step);
  g.dir = Math.atan2(dy, dx);
  return Math.hypot(tx - g.x, ty - g.y) < 4;
}

export function updateGuard(g, player, ctx, dt) {
  const seen = guardCanSee(g, player, ctx);
  if (seen.sees) {
    g.detection = Math.min(1, g.detection + seen.rate * dt);
    g.lastSeen = { x: player.x, y: player.y };
    g.loseTimer = 0;
    if (g.detection >= 0.85) g.state = "alert";
    else if (g.detection >= 0.45 && g.state === "patrol") g.state = "suspicious";
  } else {
    g.detection = Math.max(0, g.detection - CONFIG.DETECT_DECAY * dt);
    if (g.state === "alert") {
      g.loseTimer += dt;
      if (g.loseTimer > 2) {
        g.state = "search";
        g.searchTimer = 2.5;
      }
    }
  }

  // Footsteps: a walking thief nearby is heard, even out of sight.
  if (player.moving && !player.sneaking) {
    const d = Math.hypot(player.x - g.x, player.y - g.y);
    if (d < CONFIG.NOISE_RADIUS && g.state === "patrol") {
      g.state = "suspicious";
      g.lastSeen = { x: player.x, y: player.y };
      g.heardAt = { x: player.x, y: player.y };
    }
  }

  const beforeX = g.x;
  const beforeY = g.y;

  if (g.state === "patrol") {
    const target = g.waypoints[(g.wpIndex + 1) % g.waypoints.length];
    if (moveToward(g, target.x, target.y, CONFIG.GUARD_PATROL_SPEED, dt, ctx)) {
      g.wpIndex = (g.wpIndex + 1) % g.waypoints.length;
    }
  } else if (g.state === "suspicious") {
    const spot = g.lastSeen || g.waypoints[g.wpIndex];
    if (moveToward(g, spot.x, spot.y, CONFIG.GUARD_SUSPICIOUS_SPEED, dt, ctx)) {
      g.state = "search";
      g.searchTimer = 2.5;
    }
  } else if (g.state === "alert") {
    moveToward(g, player.x, player.y, CONFIG.GUARD_CHASE_SPEED, dt, ctx);
  } else if (g.state === "search") {
    g.dir += dt * 1.8;
    g.searchTimer -= dt;
    if (g.searchTimer <= 0) g.state = "return";
  } else if (g.state === "return") {
    // Walk back to the nearest patrol waypoint, then resume the loop.
    let best = 0;
    let bestD = Infinity;
    g.waypoints.forEach((w, i) => {
      const d = Math.hypot(w.x - g.x, w.y - g.y);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    const target = g.waypoints[best];
    if (moveToward(g, target.x, target.y, CONFIG.GUARD_PATROL_SPEED, dt, ctx)) {
      g.wpIndex = best;
      g.state = "patrol";
      g.detection = 0;
    }
  }

  // Stuck guard (wedged on a corner): skip to the next waypoint.
  if (Math.hypot(g.x - beforeX, g.y - beforeY) < 0.5 && g.state !== "search") {
    g.stuckTimer += dt;
    if (g.stuckTimer > 1.5) {
      g.stuckTimer = 0;
      if (g.state === "patrol") g.wpIndex = (g.wpIndex + 1) % g.waypoints.length;
      else g.state = "return";
    }
  } else {
    g.stuckTimer = 0;
  }
  g.lastX = g.x;
  g.lastY = g.y;
}
