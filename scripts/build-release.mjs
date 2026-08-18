import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const dist = join(root, "dist");
const release = join(root, "release");
const files = ["index.html", "styles.css", "script.js", "site-core.js"];
const optimizedPhotoFallbacks = new Map([
  ["assets/17bcea7b-424b-4593-9f31-697e7cbecd7d.jpeg", "assets/optimized/hero-global-talent.webp"],
  ["assets/service-performance.jpg", "assets/optimized/hero-performance.webp"],
  ["assets/fe872db7-ca7c-4423-9f5c-9dc109e60619.jpeg", "assets/optimized/hero-brand-partnership.webp"],
  ["assets/hong-kong-harbour.jpg", "assets/optimized/hong-kong-harbour.webp"],
  ["assets/service-localization.jpg", "assets/optimized/service-localization.webp"],
  ["assets/service-influencer.jpg", "assets/optimized/service-influencer.webp"],
  ["assets/creator-recruitment.jpg", "assets/optimized/creator-recruitment.webp"],
  ["assets/hong-kong-culture.jpg", "assets/optimized/hong-kong-culture.webp"],
  ["assets/about-hk-cross-border-bridge.png", "assets/optimized/about-hk-cross-border-bridge.webp"],
  ["assets/talent-global-creator-network.png", "assets/optimized/talent-global-creator-network.webp"],
]);
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
  if (file === "index.html") {
    let html = await readFile(target, "utf8");
    for (const [original, optimized] of optimizedPhotoFallbacks) {
      html = html.replaceAll(original, optimized);
    }
    await writeFile(target, html);
  }
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
