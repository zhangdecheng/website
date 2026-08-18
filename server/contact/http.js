import { isIP } from "node:net";
import { randomUUID } from "node:crypto";
import { issueFormSession } from "./form-session.js";

const BODY_LIMIT = 32 * 1024;

function json(res, status, body, headers = {}) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    ...headers,
  });
  res.end(JSON.stringify(body));
}

async function readJson(req) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > BODY_LIMIT) {
      throw Object.assign(new Error("too_large"), { code: "too_large" });
    }
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function isLoopback(address) {
  return address === "127.0.0.1"
    || address === "::1"
    || address?.startsWith("::ffff:127.");
}

export function clientIpFromRequest(req) {
  const remoteAddress = req.socket.remoteAddress || "unknown";
  const realIp = req.headers["x-real-ip"];
  if (isLoopback(remoteAddress) && typeof realIp === "string" && isIP(realIp)) return realIp;
  return remoteAddress;
}

const PUBLIC_MESSAGES = Object.freeze({
  bot_rejected: "We couldn’t verify this submission. Please try again.",
  verification_failed: "We couldn’t verify this submission. Please try again.",
  rate_limited: "You’ve sent several requests. Please wait and try again.",
  delivery_failed: "We couldn’t send your message right now. Please try again.",
  dependency_unavailable: "The form is temporarily unavailable. Please try again shortly.",
  internal_error: "The form is temporarily unavailable. Please try again shortly.",
});

function mapServiceResult(res, result, requestId) {
  if (result.code === "accepted") return json(res, 201, { ok: true, requestId });
  if (result.code === "duplicate") return json(res, 202, { ok: true, requestId });
  if (result.code === "validation_error") {
    return json(res, 400, { ok: false, requestId, errors: result.errors });
  }

  const statuses = {
    bot_rejected: 403,
    verification_failed: 403,
    rate_limited: 429,
    delivery_failed: 502,
    dependency_unavailable: 503,
  };
  const status = statuses[result.code] ?? 500;
  const headers = result.code === "rate_limited"
    ? { "retry-after": String(result.retryAfter) }
    : {};
  return json(res, status, {
    ok: false,
    requestId,
    message: PUBLIC_MESSAGES[result.code] ?? PUBLIC_MESSAGES.internal_error,
  }, headers);
}

export function createContactHttpHandler({ config, service, version }) {
  return async function contactHttpHandler(req, res) {
    const pathname = new URL(req.url || "/", "http://localhost").pathname;

    if (req.method === "GET" && pathname === "/api/contact/health") {
      json(res, 200, { ok: true, configured: true, version });
      return;
    }

    if (req.method === "GET" && pathname === "/api/contact/config") {
      const issuedAt = Date.now();
      json(res, 200, {
        turnstileSiteKey: config.turnstileSiteKey,
        formSessionToken: issueFormSession(config.securitySecret, { now: issuedAt }),
        expiresAt: new Date(issuedAt + 3_600_000).toISOString(),
      });
      return;
    }

    if (req.method === "POST" && pathname === "/api/contact") {
      const requestId = randomUUID();
      if (!config.allowedOrigins.includes(req.headers.origin)) {
        json(res, 403, {
          ok: false,
          requestId,
          message: "This submission origin is not allowed.",
        });
        return;
      }

      const contentType = String(req.headers["content-type"] || "")
        .split(";", 1)[0]
        .trim()
        .toLowerCase();
      if (contentType !== "application/json") {
        json(res, 415, {
          ok: false,
          requestId,
          message: "Send this request as JSON.",
        });
        return;
      }

      let body;
      try {
        body = await readJson(req);
      } catch (error) {
        const tooLarge = error?.code === "too_large";
        json(res, tooLarge ? 413 : 400, {
          ok: false,
          requestId,
          message: tooLarge ? "This submission is too large." : "This submission is not valid JSON.",
        });
        return;
      }

      try {
        const result = await service.submit(body, {
          ip: clientIpFromRequest(req),
          requestId,
        });
        mapServiceResult(res, result, requestId);
      } catch {
        json(res, 500, {
          ok: false,
          requestId,
          message: PUBLIC_MESSAGES.internal_error,
        });
      }
      return;
    }

    json(res, 404, { ok: false, message: "Not found." });
  };
}
