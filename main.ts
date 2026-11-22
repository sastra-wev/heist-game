// main.ts — the hand-in program (Node 22, standard library only).
// Copies game/ and screenshots/ from this repository into the output
// directory and writes /output/dossier.json with buildDossier from
// vendor/makefun-game.ts. Outside the grader, MAKEFUN_OUTPUT_DIR
// stands in for /output.
import { cp, mkdir, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-game.ts";

const root = fileURLToPath(new URL(".", import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";

await mkdir(outDir, { recursive: true });
await cp(join(root, "game"), join(outDir, "game"), { recursive: true });

const shotsDir = join(root, "screenshots");
await mkdir(join(outDir, "screenshots"), { recursive: true });
let shotCount = 0;
try {
  const entries = await readdir(shotsDir);
  for (const entry of entries.sort()) {
    await cp(join(shotsDir, entry), join(outDir, "screenshots", entry));
    shotCount++;
  }
} catch {
  // No screenshots directory yet: the dossier is written without them.
}

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
await writeFile(join(outDir, "dossier.json"), dossier);
console.log(`Velvet Vault handed in: ${shotCount} screenshot(s), dossier ${dossier.length} bytes -> ${outDir}`);
