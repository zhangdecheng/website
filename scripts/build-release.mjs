import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const dist = join(root, "dist");
const release = join(root, "release");
const files = [
  "index.html",
  "privacy.html",
  "styles.css",
  "script.js",
  "contact-form.js",
  "site-core.js",
];
const requiredAssets = new Set([
  "assets/fonts/archivo-variable.woff2",
  "assets/fonts/space-grotesk-variable.woff2",
  "assets/icons/remixicon.css",
  "assets/icons/remixicon.woff2",
]);

await mkdir(dist, { recursive: true });
await mkdir(release, { recursive: true });

for (const entry of await readdir(dist)) {
  await rm(join(dist, entry), { recursive: true, force: true });
}

for (const file of files) {
  const target = join(dist, basename(file));
  await cp(join(root, file), target);
}

for (const file of files) {
  const source = await readFile(join(dist, basename(file)), "utf8");
  for (const match of source.matchAll(/assets\/[^"'() >]+/g)) {
    requiredAssets.add(match[0]);
  }
}

for (const asset of requiredAssets) {
  const source = join(root, asset);
  const target = join(dist, asset);
  await stat(source);
  await mkdir(dirname(target), { recursive: true });
  await cp(source, target);
  if (asset === "assets/icons/remixicon.css") {
    const css = await readFile(target, "utf8");
    const modernFontFace = `@font-face {
  font-family: "remixicon";
  src: url("remixicon.woff2?t=1769685282643") format("woff2");
  font-display: swap;
}`;
    await writeFile(target, css.replace(/@font-face\s*{[\s\S]*?\n}/, modernFontFace));
  }
}

const assetCount = (await readdir(join(dist, "assets"), { recursive: true })).length;
const indexStats = await stat(join(dist, "index.html"));

console.log(`Built ${files.length} site files and ${assetCount} asset entries.`);
console.log(`dist/index.html: ${indexStats.size} bytes`);
