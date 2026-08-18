import { createServer } from "node:http";
import nodemailer from "nodemailer";
import { DuplicateGuard, SlidingWindowLimiter } from "./contact/abuse-guard.js";
import { loadContactConfig } from "./contact/config.js";
import { createContactHttpHandler } from "./contact/http.js";
import { createSecurityLogger } from "./contact/security-log.js";
import { createContactService } from "./contact/service.js";
import { verifyTurnstile } from "./contact/turnstile.js";

const config = loadContactConfig();
const transport = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: true,
  auth: { user: config.smtp.user, pass: config.smtp.password },
  connectionTimeout: 8_000,
  greetingTimeout: 8_000,
  socketTimeout: 15_000,
});

const ipLimiter = new SlidingWindowLimiter([
  { limit: 5, windowMs: 600_000 },
  { limit: 20, windowMs: 86_400_000 },
]);
const emailLimiter = new SlidingWindowLimiter([
  { limit: 3, windowMs: 3_600_000 },
  { limit: 5, windowMs: 86_400_000 },
]);
const duplicates = new DuplicateGuard({ acceptedMs: 600_000, inFlightMs: 60_000 });
const logger = createSecurityLogger();

const service = createContactService({
  securitySecret: config.securitySecret,
  ipLimiter,
  emailLimiter,
  duplicates,
  verifyChallenge: (token, ip) => verifyTurnstile({
    token,
    remoteIp: ip,
    secret: config.turnstileSecret,
    allowedHostnames: config.allowedHostnames,
  }),
  sendMail: (message) => transport.sendMail(message),
  logger,
});

const handler = createContactHttpHandler({ config, service, version: "1.2.0" });
const server = createServer(handler);

server.listen(config.port, config.host, () => {
  console.log(JSON.stringify({
    event: "contact_service_started",
    host: config.host,
    port: config.port,
  }));
});

let shuttingDown = false;

function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  const deadline = setTimeout(() => {
    transport.close();
    process.exit(1);
  }, 10_000);
  deadline.unref();

  server.close((error) => {
    clearTimeout(deadline);
    transport.close();
    console.log(JSON.stringify({
      event: "contact_service_stopped",
      host: config.host,
      port: config.port,
    }));
    process.exit(error ? 1 : 0);
  });
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
