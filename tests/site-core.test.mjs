import assert from "node:assert/strict";
import test from "node:test";
import {
  CONTACT_CONFIG_ENDPOINT,
  CONTACT_SUBMIT_ENDPOINT,
  buildContactPayload,
  fieldsForRole,
  messageForContactResult,
} from "../site-core.js";

test("Brand payload contains only common and Brand fields", () => {
  assert.deepEqual(buildContactPayload({
    role: "brand",
    name: "Alex Rivera",
    email: "alex@example.com",
    company: "North Star",
    budget: "$10,000–$30,000",
    growthObjectives: "Launch in the US and Europe.",
    socialHandles: "must be dropped",
    niche: "must be dropped",
    audienceDemographics: "must be dropped",
    privacyAccepted: true,
    turnstileToken: "turnstile",
    formSessionToken: "session",
    website: "",
  }), {
    role: "brand",
    name: "Alex Rivera",
    email: "alex@example.com",
    company: "North Star",
    budget: "$10,000–$30,000",
    growthObjectives: "Launch in the US and Europe.",
    privacyAccepted: true,
    turnstileToken: "turnstile",
    formSessionToken: "session",
    website: "",
  });
});

test("Creator payload contains only common and Creator fields", () => {
  const payload = buildContactPayload({
    role: "creator",
    name: "Maya Chen",
    email: "maya@example.com",
    socialHandles: "TikTok @maya",
    niche: "Travel",
    audienceDemographics: "US and UK",
    privacyAccepted: true,
    turnstileToken: "turnstile",
    formSessionToken: "session",
    website: "",
  });
  assert.deepEqual(fieldsForRole("creator"), ["socialHandles", "niche", "audienceDemographics"]);
  assert.equal("company" in payload, false);
  assert.equal(payload.socialHandles, "TikTok @maya");
});

test("endpoints and user-safe status messages are stable", () => {
  assert.equal(CONTACT_CONFIG_ENDPOINT, "/api/contact/config");
  assert.equal(CONTACT_SUBMIT_ENDPOINT, "/api/contact");
  assert.equal(
    messageForContactResult(429),
    "You’ve sent several requests. Please wait and try again.",
  );
  assert.equal(
    messageForContactResult(502),
    "We couldn’t send your message right now. Your details are still here—please try again.",
  );
  assert.doesNotMatch(messageForContactResult(502), /SMTP|Hannah|Irisa|Turnstile secret/i);
});
