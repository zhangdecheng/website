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
