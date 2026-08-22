import assert from "node:assert/strict";
import test from "node:test";
import { buildMailMessage } from "../server/contact/mail-message.js";

test("Brand mail has immutable Hannah routing and escaped content", () => {
  const message = buildMailMessage({
    role: "brand",
    name: "Ava <script>alert(1)</script>",
    email: "ava@example.com",
    replyTo: "ava@example.com",
    company: "Example & Co",
    budget: "$10,000–$30,000",
    growthObjectives: "Build awareness across the US and Europe.",
  });
  assert.equal(message.to, "hannah@flourish-culture.com");
  assert.equal(message.from, "Flourish Website <business@flourish-culture.com>");
  assert.equal(message.replyTo, "ava@example.com");
  assert.equal(message.subject, "[Flourish Website] New Brand Inquiry");
  assert.match(message.text, /Example & Co/);
  assert.match(message.html, /Ava &lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.doesNotMatch(message.html, /<script>/);
});

test("Creator mail routes only to Irisa and contains every creator field", () => {
  const message = buildMailMessage({
    role: "creator",
    name: "Maya Chen",
    email: "maya@example.com",
    replyTo: "maya@example.com",
    socialHandles: "TikTok @maya; https://instagram.com/maya",
    niche: "Travel",
    audienceDemographics: "US and UK, primarily ages 18–34",
  });
  assert.equal(message.to, "irisa@flourish-culture.com");
  assert.equal(message.subject, "[Flourish Website] New Creator Application");
  assert.match(message.text, /TikTok @maya/);
  assert.match(message.text, /US and UK/);
});
