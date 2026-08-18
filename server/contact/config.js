const SMTP_IDENTITY = "business@flourish-culture.com";

function required(env, name) {
  const value = env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

export function loadContactConfig(env = process.env) {
  const smtpUser = required(env, "SMTP_USER");
  if (smtpUser.toLowerCase() !== SMTP_IDENTITY) {
    throw new Error(`SMTP_USER must be ${SMTP_IDENTITY}`);
  }

  const securitySecret = required(env, "CONTACT_SECURITY_SECRET");
  if (Buffer.byteLength(securitySecret, "utf8") < 32) {
    throw new Error("CONTACT_SECURITY_SECRET must contain at least 32 bytes");
  }

  return Object.freeze({
    host: "127.0.0.1",
    port: Number(env.CONTACT_PORT || 3101),
    allowedOrigins: [
      "https://www.flourishculturekol.com",
      "https://flourishculturekol.com",
    ],
    allowedHostnames: [
      "www.flourishculturekol.com",
      "flourishculturekol.com",
    ],
    turnstileSiteKey: required(env, "CONTACT_TURNSTILE_SITE_KEY"),
    turnstileSecret: required(env, "CONTACT_TURNSTILE_SECRET"),
    securitySecret,
    smtp: {
      host: env.SMTP_HOST?.trim() || "smtp.yunyou.top",
      port: Number(env.SMTP_PORT || 465),
      secure: true,
      user: smtpUser,
      password: required(env, "SMTP_PASSWORD"),
    },
  });
}
