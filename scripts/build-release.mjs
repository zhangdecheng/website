import { cp, mkdir, readdir, rm, stat } from "node:fs/promises";
import { basename, join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const dist = join(root, "dist");
const release = join(root, "release");
const files = ["index.html", "styles.css", "script.js", "site-core.js"];

await mkdir(dist, { recursive: true });
await mkdir(release, { recursive: true });

for (const entry of await readdir(dist)) {
  await rm(join(dist, entry), { recursive: true, force: true });
}

for (const file of files) {
  await cp(join(root, file), join(dist, basename(file)));
}

await cp(join(root, "assets"), join(dist, "assets"), { recursive: true });

const assetCount = (await readdir(join(dist, "assets"), { recursive: true })).length;
const indexStats = await stat(join(dist, "index.html"));

console.log(`Built ${files.length} site files and ${assetCount} asset entries.`);
console.log(`dist/index.html: ${indexStats.size} bytes`);
