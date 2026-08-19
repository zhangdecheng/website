import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";
import { clientIpFromRequest, createContactHttpHandler } from "../server/contact/http.js";

const config = {
  allowedOrigins: [
    "https://www.flourishculturekol.com",
    "https://flourishculturekol.com",
  ],
  turnstileSiteKey: "1x00000000000000000000AA",
  securitySecret: "0123456789abcdef0123456789abcdef",
  turnstileSecret: "must-not-leak",
  smtp: { password: "must-not-leak-either" },
};

async function startServer(t, service) {
  const server = createServer(createContactHttpHandler({ config, service, version: "1.2.0" }));
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  }));
  const { port } = server.address();
  return `http://127.0.0.1:${port}`;
}

function post(baseUrl, body = {}, headers = {}) {
  return fetch(`${baseUrl}/api/contact`, {
    method: "POST",
    headers: {
      origin: "https://www.flourishculturekol.com",
      "content-type": "application/json",
      ...headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

test("health and config expose only public configured state", async (t) => {
  const service = { submit: async () => ({ code: "accepted" }) };
  const baseUrl = await startServer(t, service);

  const health = await fetch(`${baseUrl}/api/contact/health`);
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), { ok: true, configured: true, version: "1.2.0" });

  const before = Date.now();
  const response = await fetch(`${baseUrl}/api/contact/config`);
  const after = Date.now();
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(Object.keys(body).sort(), ["expiresAt", "formSessionToken", "turnstileSiteKey"]);
  assert.equal(body.turnstileSiteKey, "1x00000000000000000000AA");
  assert.match(body.formSessionToken, /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/u);
  const expiry = Date.parse(body.expiresAt);
  assert.ok(expiry >= before + 3_600_000 && expiry <= after + 3_600_000);

  const serialized = JSON.stringify({ health: await (await fetch(`${baseUrl}/api/contact/health`)).json(), body });
  assert.doesNotMatch(serialized, /must-not-leak|securitySecret|turnstileSecret|password/u);
});

test("accepted and duplicate submissions map to success schemas", async (t) => {
  let next = { code: "accepted" };
  const service = { submit: async () => next };
  const baseUrl = await startServer(t, service);

  const accepted = await post(baseUrl);
  assert.equal(accepted.status, 201);
  assert.deepEqual(Object.keys(await accepted.json()).sort(), ["ok", "requestId"]);

  next = { code: "duplicate" };
  const duplicate = await post(baseUrl);
  assert.equal(duplicate.status, 202);
  assert.equal((await duplicate.json()).ok, true);
});

test("service failures map to stable public status, schema and retry header", async (t) => {
  let next;
  const service = { submit: async () => next };
  const baseUrl = await startServer(t, service);
  const cases = [
    [{ code: "validation_error", errors: { email: "Enter a valid email address." } }, 400],
    [{ code: "bot_rejected", reason: "honeypot" }, 403],
    [{
      code: "verification_failed",
      reason: "turnstile_rejected",
      diagnostic: "invalid-input-secret",
    }, 403],
    [{ code: "rate_limited", retryAfter: 90 }, 429],
    [{ code: "delivery_failed" }, 502],
    [{ code: "dependency_unavailable", reason: "turnstile_unavailable" }, 503],
  ];

  for (const [result, expectedStatus] of cases) {
    next = result;
    const response = await post(baseUrl);
    const body = await response.json();
    assert.equal(response.status, expectedStatus);
    assert.equal(body.ok, false);
    assert.match(body.requestId, /^[0-9a-f-]{36}$/u);
    if (result.code === "validation_error") {
      assert.deepEqual(body.errors, result.errors);
      assert.equal("message" in body, false);
    } else {
      assert.equal(typeof body.message, "string");
      assert.doesNotMatch(body.message, /SMTP|Hannah|Irisa|secret|honeypot/u);
      assert.equal("errors" in body, false);
    }
    if (result.code === "rate_limited") assert.equal(response.headers.get("retry-after"), "90");
    assert.equal("diagnostic" in body, false);
  }
});

test("POST rejects bad origins, content types, malformed JSON and oversized bodies", async (t) => {
  let calls = 0;
  const service = { submit: async () => { calls += 1; return { code: "accepted" }; } };
  const baseUrl = await startServer(t, service);

  const missingOrigin = await fetch(`${baseUrl}/api/contact`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}",
  });
  assert.equal(missingOrigin.status, 403);

  const wrongOrigin = await post(baseUrl, {}, { origin: "https://attacker.example" });
  assert.equal(wrongOrigin.status, 403);

  const wrongType = await fetch(`${baseUrl}/api/contact`, {
    method: "POST",
    headers: {
      origin: "https://www.flourishculturekol.com",
      "content-type": "text/plain",
    },
    body: "{}",
  });
  assert.equal(wrongType.status, 415);

  const malformed = await post(baseUrl, "{");
  assert.equal(malformed.status, 400);

  const oversized = await post(baseUrl, { payload: "x".repeat(33 * 1024) });
  assert.equal(oversized.status, 413);
  assert.equal(calls, 0);
});

test("trusted loopback proxy supplies X-Real-IP and direct clients cannot spoof it", async (t) => {
  let context;
  const service = {
    async submit(_body, receivedContext) {
      context = receivedContext;
      return { code: "accepted" };
    },
  };
  const baseUrl = await startServer(t, service);
  const response = await post(baseUrl, {}, { "x-real-ip": "198.51.100.42" });
  assert.equal(response.status, 201);
  assert.equal(context.ip, "198.51.100.42");

  assert.equal(clientIpFromRequest({
    socket: { remoteAddress: "198.51.100.99" },
    headers: { "x-real-ip": "203.0.113.200" },
  }), "198.51.100.99");
  assert.equal(clientIpFromRequest({
    socket: { remoteAddress: "::ffff:127.0.0.1" },
    headers: { "x-real-ip": "not-an-ip" },
  }), "::ffff:127.0.0.1");
});
