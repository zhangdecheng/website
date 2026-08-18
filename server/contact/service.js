import { createHmac } from "node:crypto";
import { buildMailMessage } from "./mail-message.js";
import { deriveKey, verifyFormSession } from "./form-session.js";
import { hashIdentifier } from "./security-log.js";
import { validateSubmission } from "./validation.js";

export function submissionFingerprint(submission, secret) {
  const businessFields = submission.role === "brand"
    ? [
        submission.role,
        submission.name,
        submission.email,
        submission.company,
        submission.budget,
        submission.growthObjectives,
      ]
    : [
        submission.role,
        submission.name,
        submission.email,
        submission.socialHandles,
        submission.niche,
        submission.audienceDemographics,
      ];
  return createHmac("sha256", deriveKey(secret, "duplicate"))
    .update(JSON.stringify(businessFields))
    .digest("hex");
}

export function createContactService({
  securitySecret,
  now = Date.now,
  ipLimiter,
  emailLimiter,
  duplicates,
  verifyChallenge,
  sendMail,
  logger,
}) {
  return {
    async submit(raw, { ip, requestId }) {
      const startedAt = now();
      const ipHash = hashIdentifier(ip, securitySecret);

      function finish(result, submission) {
        const finishedAt = now();
        logger({
          requestId,
          timestamp: new Date(startedAt).toISOString(),
          durationMs: Math.max(0, finishedAt - startedAt),
          role: submission?.role,
          outcome: result.code,
          reason: result.reason ?? result.code,
          ipHash,
          emailHash: submission?.email
            ? hashIdentifier(submission.email, securitySecret)
            : undefined,
        });
        return result;
      }

      const validation = validateSubmission(raw);
      if (!validation.ok) {
        return finish({ code: "validation_error", errors: validation.errors });
      }

      const submission = validation.value;
      if (submission.website) {
        return finish({ code: "bot_rejected", reason: "honeypot" }, submission);
      }

      const session = verifyFormSession(submission.formSessionToken, securitySecret, { now: now() });
      if (!session.ok) {
        return finish({ code: "bot_rejected", reason: session.reason }, submission);
      }

      const ipLimit = ipLimiter.consume(ipHash, now());
      if (!ipLimit.allowed) {
        return finish({ code: "rate_limited", retryAfter: ipLimit.retryAfter }, submission);
      }

      const challenge = await verifyChallenge(submission.turnstileToken, ip);
      if (!challenge.ok) {
        return finish({
          code: challenge.unavailable ? "dependency_unavailable" : "verification_failed",
          reason: challenge.reason,
        }, submission);
      }

      const fingerprint = submissionFingerprint(submission, securitySecret);
      if (duplicates.claim(fingerprint, now()) === "duplicate") {
        return finish({ code: "duplicate" }, submission);
      }

      const emailLimit = emailLimiter.consume(
        hashIdentifier(submission.email, securitySecret),
        now(),
      );
      if (!emailLimit.allowed) {
        duplicates.release(fingerprint);
        return finish({ code: "rate_limited", retryAfter: emailLimit.retryAfter }, submission);
      }

      try {
        await sendMail(buildMailMessage(submission));
        duplicates.commit(fingerprint, now());
        return finish({ code: "accepted" }, submission);
      } catch {
        duplicates.release(fingerprint);
        return finish({ code: "delivery_failed" }, submission);
      }
    },
  };
}
