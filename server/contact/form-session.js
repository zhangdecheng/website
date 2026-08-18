import { createHmac, randomBytes as cryptoRandomBytes, timingSafeEqual } from "node:crypto";

const MIN_AGE_MS = 3_000;
const MAX_AGE_MS = 3_600_000;

export function deriveKey(secret, purpose) {
  return createHmac("sha256", secret).update(`flourish-contact:${purpose}`).digest();
}

function sign(payload, key) {
  return createHmac("sha256", key).update(payload).digest("base64url");
}

export function issueFormSession(secret, { now = Date.now(), randomBytes = cryptoRandomBytes } = {}) {
  const payload = Buffer.from(JSON.stringify({
    iat: now,
    nonce: randomBytes(16).toString("base64url"),
  })).toString("base64url");
  return `${payload}.${sign(payload, deriveKey(secret, "form-session"))}`;
}

export function verifyFormSession(token, secret, { now = Date.now() } = {}) {
  try {
    const [payload, signature, extra] = String(token).split(".");
    if (!payload || !signature || extra) return { ok: false, reason: "invalid" };
    const expected = Buffer.from(sign(payload, deriveKey(secret, "form-session")));
    const received = Buffer.from(signature);
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
      return { ok: false, reason: "invalid" };
    }
    const { iat } = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    const age = now - iat;
    if (!Number.isFinite(iat) || age < 0) return { ok: false, reason: "invalid" };
    if (age < MIN_AGE_MS) return { ok: false, reason: "too_fast" };
    if (age > MAX_AGE_MS) return { ok: false, reason: "expired" };
    return { ok: true };
  } catch {
    return { ok: false, reason: "invalid" };
  }
}
