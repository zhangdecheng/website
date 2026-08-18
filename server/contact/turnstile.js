const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

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
      return { ok: false, unavailable: false, reason: "turnstile_rejected" };
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
