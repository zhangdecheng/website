import assert from "node:assert/strict";
import test from "node:test";
import { deriveKey, issueFormSession, verifyFormSession } from "../server/contact/form-session.js";

const now = 1_800_000_000_000;
const secret = "0123456789abcdef0123456789abcdef";

test("form sessions enforce minimum age and one-hour expiry", () => {
  const token = issueFormSession(secret, {
    now,
    randomBytes: () => Buffer.alloc(16, 7),
  });

  assert.equal(verifyFormSession(token, secret, { now: now + 2_999 }).reason, "too_fast");
  assert.equal(verifyFormSession(token, secret, { now: now + 3_000 }).ok, true);
  assert.equal(verifyFormSession(token, secret, { now: now + 3_600_001 }).reason, "expired");
});

test("form sessions reject tampering and invalid timestamps", () => {
  const token = issueFormSession(secret, {
    now,
    randomBytes: () => Buffer.alloc(16, 7),
  });
  const changedFinalCharacter = token.endsWith("x") ? "y" : "x";

  assert.equal(
    verifyFormSession(`${token.slice(0, -1)}${changedFinalCharacter}`, secret, { now: now + 4_000 }).reason,
    "invalid",
  );
  assert.equal(verifyFormSession(token, "fedcba9876543210fedcba9876543210", { now: now + 4_000 }).reason, "invalid");
  assert.equal(verifyFormSession(token, secret, { now: now - 1 }).reason, "invalid");
});

test("derived keys are stable and separated by purpose", () => {
  assert.deepEqual(deriveKey(secret, "form-session"), deriveKey(secret, "form-session"));
  assert.notDeepEqual(deriveKey(secret, "form-session"), deriveKey(secret, "security-log"));
});
