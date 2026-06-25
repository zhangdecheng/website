export const CREATOR_APPLICATION_EMAIL = "irisa@flourishculture.com";
export const PROJECT_INQUIRY_EMAIL = "flourishculture@outlook.com";

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isValidHttpUrl(value) {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function buildMailto(recipient, subject, lines) {
  const body = lines.join("\n");
  return `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function buildCreatorMailto({ name, email, social, region }) {
  return buildMailto(CREATOR_APPLICATION_EMAIL, `Creator Application — ${name.trim()}`, [
    "Hello FLOURISH CULTURE,",
    "",
    "I would like to join your global creator network.",
    "",
    `Name: ${name.trim()}`,
    `Email: ${email.trim()}`,
    `Social media link: ${social.trim()}`,
    `Primary audience region: ${region.trim()}`,
    "",
    "Thank you.",
  ]);
}

export function buildProjectMailto({ identity, name, company, email, budget, goal }) {
  const contact = company.trim() || name.trim();
  return buildMailto(PROJECT_INQUIRY_EMAIL, `Project Inquiry — ${contact}`, [
    "Hello FLOURISH CULTURE,",
    "",
    "I would like to discuss a global growth project.",
    "",
    `Identity: ${identity.trim()}`,
    `Name / Job title: ${name.trim()}`,
    `Company / Website: ${company.trim() || "Not provided"}`,
    `Email: ${email.trim()}`,
    `Budget: ${budget.trim()}`,
    `Global growth goal: ${goal.trim()}`,
    "",
    "Thank you.",
  ]);
}
