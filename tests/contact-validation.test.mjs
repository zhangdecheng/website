import assert from "node:assert/strict";
import test from "node:test";
import { validateSubmission } from "../server/contact/validation.js";

const common = {
  name: "Zoë 陈",
  email: "创作者@例子.公司",
  privacyAccepted: true,
  turnstileToken: "token",
  formSessionToken: "session",
  website: "",
};

test("normalizes a complete Brand submission and drops Creator-only fields", () => {
  const result = validateSubmission({
    ...common,
    role: "brand",
    company: "North Star Labs",
    budget: "$30,000–$100,000",
    growthObjectives: "Launch a creator-led campaign across North America.",
    socialHandles: "must not survive",
  });
  assert.equal(result.ok, true);
  assert.deepEqual(result.value, {
    role: "brand",
    name: "Zoë 陈",
    email: "创作者@xn--fsqu00a.xn--55qx5d",
    replyTo: "创作者@例子.公司",
    company: "North Star Labs",
    budget: "$30,000–$100,000",
    growthObjectives: "Launch a creator-led campaign across North America.",
    privacyAccepted: true,
    turnstileToken: "token",
    formSessionToken: "session",
    website: "",
  });
});

test("accepts Creator handles as international free text", () => {
  const result = validateSubmission({
    ...common,
    role: "creator",
    socialHandles: "TikTok @zoe / 小红书 @陈",
    niche: "Beauty & culture",
    audienceDemographics: "US, UK and Mandarin-speaking audiences",
  });
  assert.equal(result.ok, true);
  assert.equal(result.value.socialHandles, "TikTok @zoe / 小红书 @陈");
  assert.equal("company" in result.value, false);
});

test("returns field errors for CRLF email, bad budget, missing privacy and short content", () => {
  const result = validateSubmission({
    ...common,
    role: "brand",
    email: "visitor@example.com\r\nBcc: victim@example.com",
    privacyAccepted: false,
    company: "X",
    budget: "$1",
    growthObjectives: "short",
  });
  assert.equal(result.ok, false);
  assert.deepEqual(Object.keys(result.errors).sort(), [
    "budget",
    "company",
    "email",
    "growthObjectives",
    "privacyAccepted",
  ]);
});
