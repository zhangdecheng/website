import nodemailer from "nodemailer";
import { loadContactConfig } from "./contact/config.js";

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

try {
  await transport.verify();
  console.log(JSON.stringify({ ok: true, result: "smtp_authentication_accepted" }));
} catch {
  console.error(JSON.stringify({ ok: false, result: "smtp_authentication_rejected" }));
  process.exitCode = 1;
} finally {
  transport.close();
}
