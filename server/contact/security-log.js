import { createHmac } from "node:crypto";
import { deriveKey } from "./form-session.js";

export function hashIdentifier(value, secret) {
  return createHmac("sha256", deriveKey(secret, "security-log"))
    .update(String(value).normalize("NFC").toLowerCase())
    .digest("hex");
}

export function createSecurityLogger({ write = console.log } = {}) {
  return function securityLog({
    requestId,
    timestamp,
    durationMs,
    role,
    outcome,
    reason,
    diagnostic,
    ipHash,
    emailHash,
  }) {
    write(JSON.stringify({
      requestId,
      timestamp,
      durationMs,
      role,
      outcome,
      reason,
      diagnostic,
      ipHash,
      emailHash,
    }));
  };
}
