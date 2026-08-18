import { copyFile, lstat, mkdir, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const releaseRoot = path.join(projectRoot, "release", "contact-service");
const allowedPaths = [
  ["server", "server"],
  ["package.json", "package.json"],
  ["package-lock.json", "package-lock.json"],
  ["ops/flourish-contact.service", "ops/flourish-contact.service"],
];
const forbiddenNames = [
  /(?:^|\.)\.env(?:\.|$)/i,
  /secret/i,
  /token/i,
  /\.pem$/i,
  /\.key$/i,
  /\.log$/i,
];

function relativeToProject(target) {
  return path.relative(projectRoot, target).split(path.sep).join("/");
}

function assertSafeName(target) {
  const name = path.basename(target);
  const forbidden = forbiddenNames.find((pattern) => pattern.test(name));
  if (forbidden) {
    throw new Error(`Refusing forbidden release filename: ${relativeToProject(target)}`);
  }
}

async function copySafe(source, target) {
  const sourceInfo = await lstat(source);
  if (sourceInfo.isSymbolicLink()) {
    throw new Error(`Refusing symlink in contact release: ${relativeToProject(source)}`);
  }
  assertSafeName(source);

  if (sourceInfo.isDirectory()) {
    await mkdir(target, { recursive: true, mode: 0o755 });
    const entries = await readdir(source, { withFileTypes: true });
    for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
      await copySafe(path.join(source, entry.name), path.join(target, entry.name));
    }
    return;
  }

  if (!sourceInfo.isFile()) {
    throw new Error(`Refusing non-file release entry: ${relativeToProject(source)}`);
  }
  await mkdir(path.dirname(target), { recursive: true, mode: 0o755 });
  await copyFile(source, target);
}

async function inventory(directory, prefix = "") {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const absolute = path.join(directory, entry.name);
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    const info = await lstat(absolute);
    if (info.isSymbolicLink()) {
      throw new Error(`Refusing symlink in built contact release: ${relative}`);
    }
    assertSafeName(absolute);
    if (info.isDirectory()) {
      files.push(...await inventory(absolute, relative));
    } else if (info.isFile()) {
      files.push({ path: relative, bytes: info.size });
    } else {
      throw new Error(`Refusing non-file built release entry: ${relative}`);
    }
  }
  return files;
}

await rm(releaseRoot, { recursive: true, force: true });
await mkdir(releaseRoot, { recursive: true, mode: 0o755 });

for (const [source, target] of allowedPaths) {
  await copySafe(path.join(projectRoot, source), path.join(releaseRoot, target));
}

const files = (await inventory(releaseRoot)).sort((left, right) => left.path.localeCompare(right.path));
const totalBytes = files.reduce((sum, file) => sum + file.bytes, 0);

console.log(`Contact release: ${path.relative(projectRoot, releaseRoot)}`);
for (const file of files) console.log(`${file.path}\t${file.bytes}`);
console.log(`Total bytes: ${totalBytes}`);
