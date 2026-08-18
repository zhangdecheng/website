import assert from "node:assert/strict";
import test from "node:test";
import { loadContactConfig } from "../server/contact/config.js";

const validEnv = {
  CONTACT_TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
  CONTACT_TURNSTILE_SECRET: "turnstile-secret-for-tests",
  CONTACT_SECURITY_SECRET: "0123456789abcdef0123456789abcdef",
  SMTP_HOST: "smtp.yunyou.top",
  SMTP_PORT: "465",
  SMTP_USER: "business@flourish-culture.com",
  SMTP_PASSWORD: "smtp-test-secret",
};

test("configuration fixes the listener, origins, hostnames and secure SMTP", () => {
  const config = loadContactConfig(validEnv);
  assert.equal(config.host, "127.0.0.1");
  assert.equal(config.port, 3101);
  assert.deepEqual(config.allowedOrigins, [
    "https://www.flourishculturekol.com",
    "https://flourishculturekol.com",
  ]);
  assert.deepEqual(config.allowedHostnames, [
    "www.flourishculturekol.com",
    "flourishculturekol.com",
  ]);
  assert.deepEqual(config.smtp, {
    host: "smtp.yunyou.top",
    port: 465,
    secure: true,
    user: "business@flourish-culture.com",
    password: "smtp-test-secret",
  });
});

test("configuration rejects missing secrets and the wrong SMTP identity", () => {
  assert.throws(() => loadContactConfig({ ...validEnv, SMTP_PASSWORD: "" }), /SMTP_PASSWORD/);
  assert.throws(
    () => loadContactConfig({ ...validEnv, SMTP_USER: "another@example.com" }),
    /business@flourish-culture\.com/,
  );
});
