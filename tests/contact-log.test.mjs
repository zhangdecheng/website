import assert from "node:assert/strict";
import test from "node:test";
import { createSecurityLogger, hashIdentifier } from "../server/contact/security-log.js";

test("security logs include only allow-listed metadata and protected identifiers", () => {
  const secret = "0123456789abcdef0123456789abcdef";
  const lines = [];
  const log = createSecurityLogger({ write: (line) => lines.push(line) });
  const fixture = {
    requestId: "request-123",
    timestamp: "2026-08-18T08:00:00.000Z",
    durationMs: 42,
    role: "brand",
    outcome: "rejected",
    reason: "rate_limited",
    ipHash: hashIdentifier("203.0.113.10", secret),
    emailHash: hashIdentifier("visitor@example.com", secret),
    SMTP_PASSWORD: "smtp-password-must-not-appear",
    turnstileToken: "turnstile-token-must-not-appear",
    name: "Ava Secret Name",
    company: "Secret Company",
    email: "visitor@example.com",
  };

  log(fixture);

  assert.equal(lines.length, 1);
  const output = lines[0];
  for (const forbidden of [
    fixture.SMTP_PASSWORD,
    fixture.turnstileToken,
    fixture.name,
    fixture.company,
    fixture.email,
  ]) {
    assert.doesNotMatch(output, new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  const parsed = JSON.parse(output);
  assert.equal(parsed.requestId, "request-123");
  assert.equal(parsed.outcome, "rejected");
  assert.equal(parsed.ipHash, fixture.ipHash);
  assert.equal(parsed.emailHash, fixture.emailHash);
  assert.deepEqual(Object.keys(parsed).sort(), [
    "durationMs",
    "emailHash",
    "ipHash",
    "outcome",
    "reason",
    "requestId",
    "role",
    "timestamp",
  ]);
});

test("identifier hashes are normalized, stable and purpose-keyed", () => {
  const secret = "0123456789abcdef0123456789abcdef";
  assert.equal(
    hashIdentifier("Visitor@Example.com", secret),
    hashIdentifier("visitor@example.com", secret),
  );
  assert.notEqual(
    hashIdentifier("visitor@example.com", secret),
    hashIdentifier("another@example.com", secret),
  );
});
