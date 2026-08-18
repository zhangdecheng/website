import assert from "node:assert/strict";
import test from "node:test";
import { DuplicateGuard, SlidingWindowLimiter } from "../server/contact/abuse-guard.js";

test("IP limiter enforces five per ten minutes", () => {
  const limiter = new SlidingWindowLimiter([
    { limit: 5, windowMs: 600_000 },
    { limit: 20, windowMs: 86_400_000 },
  ]);

  for (let index = 0; index < 5; index += 1) {
    assert.equal(limiter.consume("ip", index).allowed, true);
  }
  const blocked = limiter.consume("ip", 5);
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfter > 0);
});

test("IP limiter enforces twenty per day independently of the short window", () => {
  const limiter = new SlidingWindowLimiter([
    { limit: 5, windowMs: 600_000 },
    { limit: 20, windowMs: 86_400_000 },
  ]);

  for (let index = 0; index < 20; index += 1) {
    assert.equal(limiter.consume("ip", index * 700_000).allowed, true);
  }
  const blocked = limiter.consume("ip", 20 * 700_000);
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfter > 0);
});

test("email limiter enforces three per hour and five per day", () => {
  const hourly = new SlidingWindowLimiter([
    { limit: 3, windowMs: 3_600_000 },
    { limit: 5, windowMs: 86_400_000 },
  ]);
  for (let index = 0; index < 3; index += 1) {
    assert.equal(hourly.consume("email", index).allowed, true);
  }
  assert.equal(hourly.consume("email", 3).allowed, false);

  const daily = new SlidingWindowLimiter([
    { limit: 3, windowMs: 3_600_000 },
    { limit: 5, windowMs: 86_400_000 },
  ]);
  for (let index = 0; index < 5; index += 1) {
    assert.equal(daily.consume("email", index * 3_700_000).allowed, true);
  }
  assert.equal(daily.consume("email", 5 * 3_700_000).allowed, false);
});

test("duplicate claims distinguish in-flight, released, accepted and expired submissions", () => {
  const duplicates = new DuplicateGuard({ acceptedMs: 600_000, inFlightMs: 60_000 });
  assert.equal(duplicates.claim("fingerprint", 0), "claimed");
  assert.equal(duplicates.claim("fingerprint", 1), "duplicate");
  duplicates.release("fingerprint");
  assert.equal(duplicates.claim("fingerprint", 2), "claimed");
  duplicates.commit("fingerprint", 2);
  assert.equal(duplicates.claim("fingerprint", 3), "duplicate");
  assert.equal(duplicates.claim("fingerprint", 600_003), "claimed");
});
