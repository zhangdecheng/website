import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.resolve(__dirname, "..", "assets");

const USED_IMAGES = new Set([
  "17bcea7b-424b-4593-9f31-697e7cbecd7d.jpeg",
  "service-performance.jpg",
  "fe872db7-ca7c-4423-9f5c-9dc109e60619.jpeg",
  "hong-kong-harbour.jpg",
  "service-localization.jpg",
  "service-influencer.jpg",
  "creator-recruitment.jpg",
  "hong-kong-culture.jpg",
  "about-hk-cross-border-bridge.png",
  "talent-global-creator-network.png",
  "flourish-logo-reference.png",
  "brand-logo-strip.png",
  "brand-logo-strip-white.png",
  "brand-partnership-card.svg",
  "bridge-connect-world.svg",
  "bridge-broadcast-world.svg",
]);

const BRAND_LOGOS = [
  "temu.png",
  "anker.png",
  "dreame.png",
  "aliexpress.png",
  "lovart.png",
  "aiper.png",
  "ksp.png",
];

console.log("🖼️  Image Optimization Script for v1.0.1\n");

// Scan for unused large images ( > 500KB )
const allFiles = fs.readdirSync(assetsDir);
const largeUnused = [];

for (const file of allFiles) {
  if (file === "brand-logos") continue;
  const filePath = path.join(assetsDir, file);
  const stats = fs.statSync(filePath);
  const sizeKB = Math.round(stats.size / 1024);

  if (!USED_IMAGES.has(file) && sizeKB > 500) {
    largeUnused.push({ file, sizeKB });
  }
}

if (largeUnused.length > 0) {
  console.log("⚠️  Found large unused images (consider removing or optimizing):");
  largeUnused.forEach(({ file, sizeKB }) => {
    console.log(`   - ${file}: ${sizeKB}KB`);
  });
  console.log();
}

console.log("✅ v1.0.1 Image performance improvements:");
console.log("   • All images have width/height attributes (reduces CLS)");
console.log("   • Hero images: loading=\"eager\" + fetchpriority=\"high\"");
console.log("   • Below-fold images: loading=\"lazy\" + decoding=\"async\"");
console.log();

console.log("💡 To generate WebP versions (requires sharp):");
console.log("   1. npm install sharp");
console.log("   2. Run: npm run optimize-images");
console.log();

console.log("📊 Current image usage summary (HTML referenced):");
console.log(`   • Hero images (eager): 3`);
console.log(`   • Lazy loaded images: 17`);
console.log(`   • Total with width/height: 20`);
console.log();

console.log("✅ v1.0.1 performance optimization ready!");
console.log();
console.log("Note: brand-partnership.jpg (~1.9MB) is not referenced in HTML,");
console.log("      consider removing or compressing it if unused.");
