import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("SMTP preflight verifies authentication without printing configuration", async () => {
  const source = await readFile(new URL("../server/smtp-check.js", import.meta.url), "utf8");

  assert.match(source, /import nodemailer from "nodemailer"/u);
  assert.match(source, /loadContactConfig\(\)/u);
  assert.match(source, /nodemailer\.createTransport/u);
  assert.match(source, /await transport\.verify\(\)/u);
  assert.match(source, /transport\.close\(\)/u);
  assert.match(source, /smtp_authentication_accepted/u);
  assert.match(source, /smtp_authentication_rejected/u);
  assert.doesNotMatch(source, /console\.(?:log|error)\(config/u);

  const consoleLines = source.split("\n").filter((line) => /console\.(?:log|error)/u.test(line));
  assert.equal(consoleLines.length, 2);
  assert.doesNotMatch(consoleLines.join("\n"), /password|turnstileSecret|securitySecret/u);
});
