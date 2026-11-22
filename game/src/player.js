// player.js — Rook, the thief: keyboard movement, sneak, click-to-move,
// noise, and the two tools (smoke bomb and EMP pulse), each costing points.
import { CONFIG } from "./config.js";

export function createPlayer(start) {
  return {
    x: start.x,
    y: start.y,
    r: CONFIG.PLAYER_R,
    dir: -Math.PI / 2,
    sneaking: false,
    moving: false,
    path: [],
    clickTarget: null,
  };
}

// Step the player one tick. `input` carries the live keys and any click
// target; `helpers` supplies collision and pathfinding from world.js.
// Returns an event string ('smoke' | 'emp' | null) when a tool fires.
export function stepPlayer(p, input, dt, helpers) {
  let vx = 0;
  let vy = 0;
  if (input.keys.has("ArrowUp") || input.keys.has("KeyW")) vy -= 1;
  if (input.keys.has("ArrowDown") || input.keys.has("KeyS")) vy += 1;
  if (input.keys.has("ArrowLeft") || input.keys.has("KeyA")) vx -= 1;
  if (input.keys.has("ArrowRight") || input.keys.has("KeyD")) vx += 1;

  p.sneaking = input.keys.has("ShiftLeft") || input.keys.has("ShiftRight");
  const speed = p.sneaking ? CONFIG.SNEAK_SPEED : CONFIG.WALK_SPEED;

  if (vx !== 0 || vy !== 0) {
    // Keyboard input always wins over click-to-move.
    p.path = [];
    p.clickTarget = null;
    const len = Math.hypot(vx, vy);
    const nx = p.x + (vx / len) * speed * dt;
    const ny = p.y + (vy / len) * speed * dt;
    helpers.moveCircle(p, nx, ny);
    p.dir = Math.atan2(vy, vx);
    p.moving = true;
  } else if (p.path.length > 0) {
    const target = p.path[0];
    const dx = target.x - p.x;
    const dy = target.y - p.y;
    const d = Math.hypot(dx, dy);
    if (d < 6) {
      p.path.shift();
    } else {
      const step = Math.min(d, speed * dt);
      helpers.moveCircle(p, p.x + (dx / d) * step, p.y + (dy / d) * step);
      p.dir = Math.atan2(dy, dx);
      p.moving = true;
    }
  } else {
    p.moving = false;
  }

  if (input.click) {
    const pt = input.click;
    input.click = null;
    const path = helpers.findPath(p.x, p.y, pt.x, pt.y);
    if (path && path.length > 0) {
      p.path = path;
      p.clickTarget = pt;
    }
  }

  if (input.consumeAction("smoke")) return "smoke";
  if (input.consumeAction("emp")) return "emp";
  return null;
}
