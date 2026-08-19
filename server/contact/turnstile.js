const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const SAFE_ERROR_CODES = new Set([
  "missing-input-secret",
  "invalid-input-secret",
  "missing-input-response",
  "invalid-input-response",
  "bad-request",
  "timeout-or-duplicate",
  "internal-error",
]);

function rejectedDiagnostic(result) {
  if (!Array.isArray(result?.["error-codes"])) return undefined;
  const codes = [...new Set(result["error-codes"])]
    .filter((code) => typeof code === "string" && SAFE_ERROR_CODES.has(code));
  return codes.length ? codes.join(",") : undefined;
}

export async function verifyTurnstile({
  token,
  remoteIp,
  secret,
  allowedHostnames,
  fetchImpl = fetch,
  timeoutMs = 5_000,
}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(VERIFY_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token, remoteip: remoteIp }),
      signal: controller.signal,
    });
    if (!response.ok) return { ok: false, unavailable: true, reason: "turnstile_http" };
    const result = await response.json();
    if (!result.success) {
      const diagnostic = rejectedDiagnostic(result);
      return {
        ok: false,
        unavailable: false,
        reason: "turnstile_rejected",
        ...(diagnostic ? { diagnostic } : {}),
      };
    }
    if (!allowedHostnames.includes(result.hostname) || result.action !== "contact_submit") {
      return { ok: false, unavailable: false, reason: "turnstile_context" };
    }
    return { ok: true };
  } catch {
    return { ok: false, unavailable: true, reason: "turnstile_unavailable" };
  } finally {
    clearTimeout(timeout);
  }
}
