// cameras.js — wall-mounted sweeping cameras. A camera raises the alarm
// while the thief is inside its cone; an EMP pulse disables every camera
// for a while, and smoke blinds any camera inside its cloud.
import { CONFIG } from "./config.js";

export function createCamera(def) {
  return {
    x: def.x,
    y: def.y,
    baseAngle: def.angle,
    sweep: def.sweep,
    speed: def.speed,
    phase: def.x * 0.013 + def.y * 0.007,
    angle: def.angle,
    disabledUntil: 0,
  };
}

export function updateCamera(cam, time) {
  cam.angle = cam.baseAngle + Math.sin(time * cam.speed + cam.phase) * cam.sweep;
}

export function cameraSees(cam, player, ctx) {
  if (ctx.time < cam.disabledUntil) return false;
  if (ctx.smokeCovers && ctx.smokeCovers(cam.x, cam.y)) return false;
  const dx = player.x - cam.x;
  const dy = player.y - cam.y;
  const dist = Math.hypot(dx, dy);
  if (dist > CONFIG.CAMERA_RANGE) return false;
  const ang = Math.atan2(dy, dx);
  let diff = Math.abs(ang - cam.angle);
  while (diff > Math.PI) diff -= 2 * Math.PI;
  if (Math.abs(diff) > CONFIG.CAMERA_HALF_ANGLE) return false;
  if (ctx.lineBlocked(cam.x, cam.y, player.x, player.y)) return false;
  return true;
}
