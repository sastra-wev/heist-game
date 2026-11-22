// levels.js — the three rooms of the Halcyon Gallery. Every room is data:
// outer walls, display cases / pillars / crates that block sight and
// movement, warm lamp pools, loot, guard patrol loops, sweeping cameras,
// the thief's start and the green getaway van zone. Each room leaves at
// least two viable routes from start to target to exit.
const WALL_T = 32;

function outerWalls() {
  return [
    { x: 0, y: 56, w: 1280, h: WALL_T },
    { x: 0, y: 688, w: 1280, h: WALL_T },
    { x: 0, y: 56, w: WALL_T, h: 664 },
    { x: 1248, y: 56, w: WALL_T, h: 664 },
  ];
}

export const LEVELS = [
  {
    name: "The Gallery",
    sub: "Level 1 — case the joint",
    parTime: 120,
    playerStart: { x: 90, y: 630 },
    exit: { x: 1150, y: 100, w: 70, h: 56 },
    walls: outerWalls(),
    cover: [
      { x: 380, y: 280, w: 220, h: 44, kind: "case" },
      { x: 680, y: 280, w: 220, h: 44, kind: "case" },
      { x: 380, y: 460, w: 220, h: 44, kind: "case" },
      { x: 680, y: 460, w: 220, h: 44, kind: "case" },
      { x: 250, y: 380, w: 36, h: 36, kind: "pillar" },
      { x: 994, y: 380, w: 36, h: 36, kind: "pillar" },
    ],
    lamps: [
      { x: 640, y: 200, r: 150 },
      { x: 300, y: 380, r: 130 },
      { x: 980, y: 380, r: 130 },
      { x: 640, y: 560, r: 150 },
    ],
    loot: [
      { x: 640, y: 392, kind: "diamond", value: 500, label: "The Velvet Diamond", main: true },
      { x: 140, y: 200, kind: "painting", value: 150, label: "Moonlit Harbor" },
      { x: 1140, y: 200, kind: "painting", value: 150, label: "Portrait in Gold" },
      { x: 140, y: 560, kind: "gold", value: 100, label: "Gold bars" },
      { x: 1140, y: 560, kind: "gold", value: 100, label: "Gold bars" },
    ],
    guards: [
      { waypoints: [{ x: 200, y: 150 }, { x: 1080, y: 150 }, { x: 1080, y: 220 }, { x: 200, y: 220 }] },
      { waypoints: [{ x: 1080, y: 620 }, { x: 200, y: 620 }, { x: 200, y: 540 }, { x: 1080, y: 540 }] },
    ],
    cameras: [
      { x: 640, y: 92, angle: Math.PI / 2, sweep: 0.7, speed: 0.55 },
    ],
  },
  {
    name: "The Vault Hall",
    sub: "Level 2 — past the vault",
    parTime: 150,
    playerStart: { x: 90, y: 150 },
    exit: { x: 1150, y: 600, w: 70, h: 56 },
    walls: outerWalls(),
    cover: [
      { x: 420, y: 140, w: 44, h: 180, kind: "case" },
      { x: 420, y: 400, w: 44, h: 180, kind: "case" },
      { x: 816, y: 140, w: 44, h: 180, kind: "case" },
      { x: 816, y: 400, w: 44, h: 180, kind: "case" },
      { x: 560, y: 300, w: 160, h: 120, kind: "vault" },
      { x: 250, y: 360, w: 36, h: 36, kind: "pillar" },
      { x: 994, y: 360, w: 36, h: 36, kind: "pillar" },
    ],
    lamps: [
      { x: 640, y: 180, r: 140 },
      { x: 240, y: 400, r: 130 },
      { x: 1040, y: 400, r: 130 },
      { x: 640, y: 600, r: 140 },
    ],
    loot: [
      { x: 640, y: 470, kind: "crown", value: 500, label: "The Crown Jewels", main: true },
      { x: 140, y: 150, kind: "painting", value: 150, label: "The Blue Room" },
      { x: 1140, y: 150, kind: "painting", value: 150, label: "Still Life, Pears" },
      { x: 140, y: 600, kind: "gold", value: 100, label: "Gold bars" },
      { x: 1140, y: 600, kind: "gold", value: 100, label: "Gold bars" },
      { x: 640, y: 150, kind: "gold", value: 100, label: "Gold bars" },
    ],
    guards: [
      { waypoints: [{ x: 150, y: 140 }, { x: 1130, y: 140 }, { x: 1130, y: 200 }, { x: 150, y: 200 }] },
      { waypoints: [{ x: 500, y: 260 }, { x: 500, y: 560 }, { x: 780, y: 560 }, { x: 780, y: 260 }] },
      { waypoints: [{ x: 150, y: 620 }, { x: 1130, y: 620 }, { x: 1130, y: 560 }, { x: 150, y: 560 }] },
    ],
    cameras: [
      { x: 320, y: 92, angle: Math.PI / 2, sweep: 0.65, speed: 0.6 },
      { x: 960, y: 92, angle: Math.PI / 2, sweep: 0.65, speed: 0.6 },
    ],
  },
  {
    name: "The Director's Wing",
    sub: "Level 3 — the grand prize",
    parTime: 180,
    playerStart: { x: 90, y: 630 },
    exit: { x: 90, y: 100, w: 70, h: 56 },
    walls: outerWalls(),
    cover: [
      { x: 300, y: 220, w: 260, h: 44, kind: "case" },
      { x: 720, y: 220, w: 260, h: 44, kind: "case" },
      { x: 300, y: 480, w: 260, h: 44, kind: "case" },
      { x: 720, y: 480, w: 260, h: 44, kind: "case" },
      { x: 620, y: 300, w: 36, h: 36, kind: "pillar" },
      { x: 250, y: 360, w: 36, h: 36, kind: "pillar" },
      { x: 994, y: 360, w: 36, h: 36, kind: "pillar" },
      { x: 560, y: 560, w: 160, h: 44, kind: "crate" },
    ],
    lamps: [
      { x: 640, y: 160, r: 140 },
      { x: 220, y: 360, r: 130 },
      { x: 1060, y: 360, r: 130 },
      { x: 640, y: 600, r: 140 },
      { x: 640, y: 360, r: 120 },
    ],
    loot: [
      { x: 1080, y: 150, kind: "idol", value: 500, label: "The Golden Idol", main: true },
      { x: 140, y: 200, kind: "painting", value: 150, label: "The Director" },
      { x: 140, y: 560, kind: "gold", value: 100, label: "Gold bars" },
      { x: 900, y: 600, kind: "gold", value: 100, label: "Gold bars" },
      { x: 640, y: 560, kind: "painting", value: 150, label: "Velvet Study" },
    ],
    guards: [
      { waypoints: [{ x: 200, y: 140 }, { x: 1080, y: 140 }, { x: 1080, y: 210 }, { x: 200, y: 210 }] },
      { waypoints: [{ x: 250, y: 300 }, { x: 250, y: 620 }, { x: 200, y: 620 }, { x: 200, y: 300 }] },
      { waypoints: [{ x: 1030, y: 300 }, { x: 1030, y: 620 }, { x: 1130, y: 620 }, { x: 1130, y: 300 }] },
      { waypoints: [{ x: 500, y: 360 }, { x: 780, y: 360 }, { x: 780, y: 440 }, { x: 500, y: 440 }] },
    ],
    cameras: [
      { x: 640, y: 92, angle: Math.PI / 2, sweep: 0.7, speed: 0.65 },
      { x: 40, y: 400, angle: 0, sweep: 0.6, speed: 0.5 },
      { x: 1240, y: 400, angle: Math.PI, sweep: 0.6, speed: 0.5 },
    ],
  },
];

export function levelCount() {
  return LEVELS.length;
}
