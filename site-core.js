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

export const CONTACT_CONFIG_ENDPOINT = "/api/contact/config";
export const CONTACT_SUBMIT_ENDPOINT = "/api/contact";

const ROLE_FIELDS = Object.freeze({
  brand: ["company", "budget", "growthObjectives"],
  creator: ["socialHandles", "niche", "audienceDemographics"],
});

export function fieldsForRole(role) {
  return [...(ROLE_FIELDS[role] ?? [])];
}

export function buildContactPayload(values) {
  const role = values.role;
  const payload = {
    role,
    name: values.name,
    email: values.email,
    privacyAccepted: values.privacyAccepted === true,
    turnstileToken: values.turnstileToken,
    formSessionToken: values.formSessionToken,
    website: values.website || "",
  };
  for (const field of fieldsForRole(role)) payload[field] = values[field];
  return payload;
}

export function messageForContactResult(status) {
  if (status === 201 || status === 202) return "Thank you—your message has been received.";
  if (status === 400) return "Please review the highlighted fields and try again.";
  if (status === 403) return "Please complete the verification and try again.";
  if (status === 429) return "You’ve sent several requests. Please wait and try again.";
  if (status === 502) {
    return "We couldn’t send your message right now. Your details are still here—please try again.";
  }
  return "The form is temporarily unavailable. Your details are still here—please try again shortly.";
}
