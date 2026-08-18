import assert from "node:assert/strict";
import test from "node:test";
import { verifyTurnstile } from "../server/contact/turnstile.js";

const base = {
  token: "visitor-token",
  remoteIp: "203.0.113.10",
  secret: "private-test-secret",
  allowedHostnames: ["www.flourishculturekol.com", "flourishculturekol.com"],
};

test("validates a successful challenge and sends secrets only in the POST body", async () => {
  let captured;
  const result = await verifyTurnstile({
    ...base,
    fetchImpl: async (url, options) => {
      captured = { url, options };
      return {
        ok: true,
        json: async () => ({
          success: true,
          hostname: "www.flourishculturekol.com",
          action: "contact_submit",
        }),
      };
    },
  });

  assert.deepEqual(result, { ok: true });
  assert.equal(captured.url, "https://challenges.cloudflare.com/turnstile/v0/siteverify");
  assert.equal(captured.options.method, "POST");
  assert.doesNotMatch(captured.url, /private-test-secret|visitor-token/);
  assert.equal(captured.options.body.get("secret"), "private-test-secret");
  assert.equal(captured.options.body.get("response"), "visitor-token");
  assert.equal(captured.options.body.get("remoteip"), "203.0.113.10");
});

test("rejects unsuccessful and mismatched challenge contexts", async () => {
  const cases = [
    {
      response: { success: false, hostname: "www.flourishculturekol.com", action: "contact_submit" },
      reason: "turnstile_rejected",
    },
    {
      response: { success: true, hostname: "attacker.example", action: "contact_submit" },
      reason: "turnstile_context",
    },
    {
      response: { success: true, hostname: "www.flourishculturekol.com", action: "other_action" },
      reason: "turnstile_context",
    },
  ];

  for (const fixture of cases) {
    const result = await verifyTurnstile({
      ...base,
      fetchImpl: async () => ({ ok: true, json: async () => fixture.response }),
    });
    assert.deepEqual(result, { ok: false, unavailable: false, reason: fixture.reason });
  }
});

test("marks HTTP errors and invalid JSON as dependency outages", async () => {
  const httpFailure = await verifyTurnstile({
    ...base,
    fetchImpl: async () => ({ ok: false, json: async () => ({}) }),
  });
  assert.deepEqual(httpFailure, { ok: false, unavailable: true, reason: "turnstile_http" });

  const invalidJson = await verifyTurnstile({
    ...base,
    fetchImpl: async () => ({
      ok: true,
      json: async () => {
        throw new SyntaxError("invalid JSON");
      },
    }),
  });
  assert.deepEqual(invalidJson, {
    ok: false,
    unavailable: true,
    reason: "turnstile_unavailable",
  });
});

test("marks timeouts and network failures as dependency outages", async () => {
  const timeout = await verifyTurnstile({
    ...base,
    timeoutMs: 5,
    fetchImpl: async (_url, { signal }) => new Promise((_resolve, reject) => {
      signal.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
    }),
  });
  assert.deepEqual(timeout, { ok: false, unavailable: true, reason: "turnstile_unavailable" });

  const network = await verifyTurnstile({
    ...base,
    fetchImpl: async () => {
      throw new Error("network down");
    },
  });
  assert.deepEqual(network, { ok: false, unavailable: true, reason: "turnstile_unavailable" });
});
