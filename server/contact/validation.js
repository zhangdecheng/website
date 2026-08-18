import { domainToASCII } from "node:url";

export const BUDGETS = new Set([
  "$10,000–$30,000",
  "$30,000–$100,000",
  "$100,000+",
  "Not sure yet",
]);

const CONTROL = /[\u0000-\u001f\u007f]/u;
const SAFE_MULTILINE_CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u;

function text(value, { min, max, multiline = false }) {
  const normalized = String(value ?? "").normalize("NFC").replace(/\r\n?/g, "\n").trim();
  const unsafe = multiline ? SAFE_MULTILINE_CONTROL : CONTROL;
  return normalized.length >= min && normalized.length <= max && !unsafe.test(normalized)
    ? normalized
    : null;
}

export function normalizeEmail(value) {
  const original = String(value ?? "").normalize("NFC").trim();
  if (!original || original.length > 254 || CONTROL.test(original) || /\s/u.test(original)) return null;
  if (original.indexOf("@") !== original.lastIndexOf("@")) return null;
  const [local, domain] = original.split("@");
  const asciiDomain = domainToASCII(domain || "").toLowerCase();
  if (!local || local.length > 64 || !asciiDomain || asciiDomain.length > 253) return null;
  if (local.startsWith(".") || local.endsWith(".") || local.includes("..")) return null;
  const labels = asciiDomain.split(".");
  if (labels.length < 2 || labels.some((label) => !/^(?!-)[a-z0-9-]{1,63}(?<!-)$/u.test(label))) return null;
  return { normalized: `${local}@${asciiDomain}`, replyTo: original };
}

export function validateSubmission(input) {
  const errors = {};
  const role = input?.role === "brand" || input?.role === "creator" ? input.role : null;
  const name = text(input?.name, { min: 2, max: 120 });
  const email = normalizeEmail(input?.email);
  const turnstileToken = text(input?.turnstileToken, { min: 1, max: 2048 });
  const formSessionToken = text(input?.formSessionToken, { min: 1, max: 4096 });
  const website = text(input?.website ?? "", { min: 0, max: 200 }) ?? "invalid";
  if (!role) errors.role = "Choose Brand or Creator.";
  if (!name) errors.name = "Enter your full name.";
  if (!email) errors.email = "Enter a valid email address.";
  if (input?.privacyAccepted !== true) errors.privacyAccepted = "Accept the Privacy Notice to continue.";
  if (!turnstileToken) errors.turnstileToken = "Complete the verification.";
  if (!formSessionToken) errors.formSessionToken = "Reload the form and try again.";

  const value = {
    role,
    name,
    email: email?.normalized,
    replyTo: email?.replyTo,
    privacyAccepted: true,
    turnstileToken,
    formSessionToken,
    website,
  };

  if (role === "brand") {
    value.company = text(input.company, { min: 2, max: 160 });
    value.budget = BUDGETS.has(input.budget) ? input.budget : null;
    value.growthObjectives = text(input.growthObjectives, { min: 20, max: 2000, multiline: true });
    if (!value.company) errors.company = "Enter your company.";
    if (!value.budget) errors.budget = "Choose a budget range.";
    if (!value.growthObjectives) errors.growthObjectives = "Describe your growth objectives.";
  }

  if (role === "creator") {
    value.socialHandles = text(input.socialHandles, { min: 3, max: 1000, multiline: true });
    value.niche = text(input.niche, { min: 2, max: 160 });
    value.audienceDemographics = text(input.audienceDemographics, { min: 5, max: 1000, multiline: true });
    if (!value.socialHandles) errors.socialHandles = "Enter at least one social media handle.";
    if (!value.niche) errors.niche = "Enter your content niche.";
    if (!value.audienceDemographics) errors.audienceDemographics = "Describe your main audience.";
  }

  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value };
}
