import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("production entrypoint composes a loopback-only secure service", async () => {
  const source = await readFile(new URL("../server/index.js", import.meta.url), "utf8");

  assert.match(source, /import nodemailer from "nodemailer"/u);
  assert.match(source, /loadContactConfig\(\)/u);
  assert.match(source, /nodemailer\.createTransport/u);
  assert.match(source, /secure:\s*true/u);
  assert.match(source, /server\.listen\(config\.port,\s*config\.host/u);
  assert.match(source, /new SlidingWindowLimiter\(\[\s*\{ limit: 5, windowMs: 600_000 \},\s*\{ limit: 20, windowMs: 86_400_000 \}/u);
  assert.match(source, /new SlidingWindowLimiter\(\[\s*\{ limit: 3, windowMs: 3_600_000 \},\s*\{ limit: 5, windowMs: 86_400_000 \}/u);
  assert.match(source, /new DuplicateGuard\(\{ acceptedMs: 600_000, inFlightMs: 60_000 \}\)/u);

  const consoleLines = source.split("\n").filter((line) => /console\.(?:log|error)/u.test(line));
  assert.ok(consoleLines.length > 0);
  assert.doesNotMatch(consoleLines.join("\n"), /password|turnstileSecret|securitySecret/u);
  assert.match(source, /process\.on\("SIGTERM",/u);
  assert.match(source, /process\.on\("SIGINT",/u);
  assert.match(source, /transport\.close\(\)/u);
});
