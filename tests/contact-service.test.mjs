import assert from "node:assert/strict";
import test from "node:test";
import { issueFormSession } from "../server/contact/form-session.js";
import { createContactService } from "../server/contact/service.js";

const NOW = 1_800_000_010_000;
const SECRET = "0123456789abcdef0123456789abcdef";

function sessionToken(issuedAt = NOW - 3_000) {
  return issueFormSession(SECRET, {
    now: issuedAt,
    randomBytes: () => Buffer.alloc(16, 7),
  });
}

function brand(overrides = {}) {
  return {
    role: "brand",
    name: "Alex Rivera",
    email: "alex@example.com",
    company: "North Star Labs",
    budget: "$30,000–$100,000",
    growthObjectives: "Launch a creator-led campaign across North America.",
    privacyAccepted: true,
    turnstileToken: "turnstile-token",
    formSessionToken: sessionToken(),
    website: "",
    ...overrides,
  };
}

function creator(overrides = {}) {
  return {
    role: "creator",
    name: "Maya Chen",
    email: "maya@example.com",
    socialHandles: "TikTok @maya and Instagram @maya",
    niche: "Travel",
    audienceDemographics: "US and UK, primarily ages 18–34",
    privacyAccepted: true,
    turnstileToken: "turnstile-token",
    formSessionToken: sessionToken(),
    website: "",
    ...overrides,
  };
}

function harness(overrides = {}) {
  const state = {
    mail: [],
    logs: [],
    order: [],
    commits: [],
    releases: [],
  };
  const deps = {
    securitySecret: SECRET,
    now: () => NOW,
    ipLimiter: {
      consume() {
        state.order.push("ip");
        return { allowed: true };
      },
    },
    emailLimiter: {
      consume() {
        state.order.push("email");
        return { allowed: true };
      },
    },
    duplicates: {
      claim(fingerprint) {
        state.order.push("duplicate");
        state.fingerprint = fingerprint;
        return "claimed";
      },
      commit(fingerprint) {
        state.commits.push(fingerprint);
      },
      release(fingerprint) {
        state.releases.push(fingerprint);
      },
    },
    async verifyChallenge(token, ip) {
      state.order.push("turnstile");
      state.challenge = { token, ip };
      return { ok: true };
    },
    async sendMail(message) {
      state.order.push("smtp");
      state.mail.push(message);
    },
    logger(event) {
      state.logs.push(event);
    },
    ...overrides,
  };
  return { service: createContactService(deps), state };
}

test("invalid fields stop before every risk and delivery dependency", async () => {
  const { service, state } = harness();
  const result = await service.submit({}, { ip: "203.0.113.10", requestId: "invalid" });
  assert.equal(result.code, "validation_error");
  assert.ok(result.errors.email);
  assert.deepEqual(state.order, []);
  assert.equal(state.mail.length, 0);
  assert.equal(state.logs.length, 1);
});

test("honeypot and invalid or too-fast sessions are rejected as bots", async () => {
  for (const [input, reason] of [
    [brand({ website: "https://bot.example" }), "honeypot"],
    [brand({ formSessionToken: "not-a-session" }), "invalid"],
    [brand({ formSessionToken: sessionToken(NOW) }), "too_fast"],
  ]) {
    const { service, state } = harness();
    const result = await service.submit(input, { ip: "203.0.113.10", requestId: reason });
    assert.deepEqual(result, { code: "bot_rejected", reason });
    assert.equal(state.mail.length, 0);
    assert.equal(state.logs.length, 1);
  }
});

test("IP limits stop before Turnstile and return retry timing", async () => {
  const { service, state } = harness({
    ipLimiter: { consume: () => ({ allowed: false, retryAfter: 321 }) },
  });
  const result = await service.submit(brand(), { ip: "203.0.113.10", requestId: "ip-limit" });
  assert.deepEqual(result, { code: "rate_limited", retryAfter: 321 });
  assert.equal(state.mail.length, 0);
  assert.equal(state.challenge, undefined);
});

test("Turnstile rejection and outage map to distinct results", async () => {
  for (const [challenge, expected] of [
    [
      { ok: false, unavailable: false, reason: "turnstile_rejected" },
      { code: "verification_failed", reason: "turnstile_rejected" },
    ],
    [
      { ok: false, unavailable: true, reason: "turnstile_unavailable" },
      { code: "dependency_unavailable", reason: "turnstile_unavailable" },
    ],
  ]) {
    const { service, state } = harness({ verifyChallenge: async () => challenge });
    assert.deepEqual(
      await service.submit(brand(), { ip: "203.0.113.10", requestId: challenge.reason }),
      expected,
    );
    assert.equal(state.mail.length, 0);
  }
});

test("Turnstile rejection diagnostics are preserved for the security log", async () => {
  const challenge = {
    ok: false,
    unavailable: false,
    reason: "turnstile_rejected",
    diagnostic: "invalid-input-secret",
  };
  const { service, state } = harness({ verifyChallenge: async () => challenge });

  assert.deepEqual(
    await service.submit(brand(), { ip: "203.0.113.10", requestId: "turnstile-diagnostic" }),
    {
      code: "verification_failed",
      reason: "turnstile_rejected",
      diagnostic: "invalid-input-secret",
    },
  );
  assert.equal(state.logs[0].diagnostic, "invalid-input-secret");
  assert.equal(state.mail.length, 0);
});

test("duplicate submissions do not consume email quota or call SMTP", async () => {
  const { service, state } = harness({
    duplicates: {
      claim: () => "duplicate",
      commit: () => assert.fail("duplicate must not commit"),
      release: () => assert.fail("duplicate must not release"),
    },
  });
  const result = await service.submit(brand(), { ip: "203.0.113.10", requestId: "duplicate" });
  assert.deepEqual(result, { code: "duplicate" });
  assert.equal(state.mail.length, 0);
  assert.doesNotMatch(state.order.join(","), /email|smtp/);
});

test("email limits release the in-flight duplicate claim", async () => {
  const { service, state } = harness({
    emailLimiter: { consume: () => ({ allowed: false, retryAfter: 456 }) },
  });
  const result = await service.submit(brand(), { ip: "203.0.113.10", requestId: "email-limit" });
  assert.deepEqual(result, { code: "rate_limited", retryAfter: 456 });
  assert.deepEqual(state.releases, [state.fingerprint]);
  assert.equal(state.mail.length, 0);
});

test("SMTP rejection releases the claim for a safe retry", async () => {
  const { service, state } = harness({
    sendMail: async () => {
      throw new Error("simulated SMTP failure");
    },
  });
  const result = await service.submit(brand(), { ip: "203.0.113.10", requestId: "smtp-fail" });
  assert.deepEqual(result, { code: "delivery_failed" });
  assert.deepEqual(state.releases, [state.fingerprint]);
  assert.deepEqual(state.commits, []);
});

test("accepted Brand follows the fixed order and routes only to Hannah", async () => {
  const { service, state } = harness();
  const result = await service.submit(brand(), { ip: "203.0.113.10", requestId: "brand-ok" });
  assert.deepEqual(result, { code: "accepted" });
  assert.deepEqual(state.order, ["ip", "turnstile", "duplicate", "email", "smtp"]);
  assert.equal(state.mail.length, 1);
  assert.equal(state.mail[0].to, "hannah@flourish-culture.com");
  assert.equal(state.mail[0].replyTo, "alex@example.com");
  assert.deepEqual(state.commits, [state.fingerprint]);
  assert.equal(state.logs.length, 1);
});

test("accepted Creator routes only to Irisa", async () => {
  const { service, state } = harness();
  const result = await service.submit(creator(), { ip: "203.0.113.11", requestId: "creator-ok" });
  assert.deepEqual(result, { code: "accepted" });
  assert.equal(state.mail.length, 1);
  assert.equal(state.mail[0].to, "irisa@flourishculture.com");
  assert.equal(state.mail[0].replyTo, "maya@example.com");
});
