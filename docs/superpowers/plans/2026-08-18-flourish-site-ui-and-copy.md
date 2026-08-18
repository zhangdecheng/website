# FLOURISH Site UI and Copy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the confirmed English site copy, replace the two mailto forms with one accessible Brand/Creator form backed by the Contact API, and add an original Privacy Notice while preserving the existing Neon Culture Bridge design system.

**Architecture:** `site-core.js` remains a browser-safe pure module for payload and response mapping. A new `contact-form.js` owns conditional fields, Turnstile loading, fetch submission, and accessible status transitions; `script.js` keeps navigation/reveal behavior and initializes the form. The homepage and Privacy Notice remain static HTML/CSS assets.

**Tech Stack:** Semantic HTML5, existing CSS tokens and responsive grid, browser ECMAScript modules, Fetch API, Cloudflare Turnstile explicit rendering, Node `node:test` static/pure-function tests, existing Chrome DevTools Protocol QA script.

---

## Prerequisite and file responsibility map

Execute after `2026-08-18-flourish-contact-api.md`. Do not change any existing image in this plan; the two approved replacements are integrated by `2026-08-18-flourish-ai-assets.md`.

- `index.html` — exact approved content, unified form markup, canonical, Privacy link, Creator CTA.
- `privacy.html` — original generic English Privacy Notice.
- `site-core.js` — role field map, payload shaping, and public response messages.
- `contact-form.js` — DOM state, Turnstile and API interactions.
- `script.js` — existing navigation/reveal plus one form initializer import.
- `styles.css` — additions built from existing tokens/classes; no new visual language.
- `tests/site-core.test.mjs` — pure payload/status tests.
- `tests/site.test.mjs` — content, form, privacy, script and security regression checks.
- `scripts/build-release.mjs` — include the new page/module and scan every shipped text asset for referenced assets.
- `scripts/browser-qa.cjs` — dynamic role, field, keyboard, failure-state and responsive checks.

### Task 1: Add the Contact API payload contract without breaking the current page

**Files:**
- Create: `tests/site-core.test.mjs`
- Modify: `site-core.js`

- [ ] **Step 1: Write failing pure-function tests**

Create `tests/site-core.test.mjs`:

```js
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
  assert.equal(messageForContactResult(429), "You’ve sent several requests. Please wait and try again.");
  assert.equal(messageForContactResult(502), "We couldn’t send your message right now. Your details are still here—please try again.");
  assert.doesNotMatch(messageForContactResult(502), /SMTP|Hannah|Irisa|Turnstile secret/i);
});
```

- [ ] **Step 2: Run and verify the expected failures**

Run: `node --test tests/site-core.test.mjs tests/site.test.mjs`

Expected: FAIL because the new exports do not exist.

- [ ] **Step 3: Implement the pure browser contract**

Append the following exports to `site-core.js`. Keep the existing mailto exports temporarily so the currently deployed form behavior remains functional until Task 4 switches the DOM and client atomically:

```js
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
  if (status === 502) return "We couldn’t send your message right now. Your details are still here—please try again.";
  return "The form is temporarily unavailable. Your details are still here—please try again shortly.";
}
```

- [ ] **Step 4: Run focused and full tests**

Run: `node --test tests/site-core.test.mjs tests/site.test.mjs && npm test`

Expected: all new pure-function assertions and all existing site tests pass; the page still has its pre-change mailto behavior at this intermediate commit.

- [ ] **Step 5: Commit the pure contract**

```bash
git add -- site-core.js tests/site-core.test.mjs
git commit -m "feat: define browser contact api payloads"
```

### Task 2: Apply the exact confirmed homepage copy and Creator CTA

**Files:**
- Modify: `tests/site.test.mjs`
- Modify: `index.html`

- [ ] **Step 1: Write failing content tests from Feishu revision 362**

Replace obsolete Services/Talent/About assertions with exact assertions for:

```js
const approvedCopy = [
  "Global Talent Network",
  "Data-Driven Growth",
  "Brand Partnership Hub",
  "Headquartered in Hong Kong, we leverage the city’s unique status as a global hub to seamlessly connect East Asian innovation with international audiences. We provide creators with direct access to high-budget global sponsors and cross-cultural growth strategies.",
  "Deeply rooted in China’s dynamic supply chains and brand ecosystems, paired with 100% localized global execution, we translate brand brilliance into cross-border viral success.",
  "We build high-impact partnerships between visionary brands and top-tier creators across TikTok, YouTube, and Instagram. We engineer win-win campaigns that elevate brand authority while driving sustainable monetization for creators.",
  "Data-Driven Growth &amp; Performance Insights",
  "Going viral shouldn’t be a guessing game. We leverage real-time platform analytics, retention metrics, and audience engagement data to turn one-off viral hits into a predictable, high-performing content flywheel for both brands and creators.",
  "Algorithmic &amp; Retention Audits:",
  "E-Commerce &amp; Direct-Response Optimization:",
  "Audience Demographics &amp; Niche Matching:",
  "We break down cultural barriers by pairing brands with local trendsetters. We empower creators with algorithm coaching, script audits, and native trend insights to produce high-performing UGC.",
  "Localized Trend Jacking:",
  "Script Audits &amp; UGC Production:",
  "Supply Chain &amp; Offline Immersion:",
  "Direct Access to Top Global Brands:",
  "Seamless Monetization &amp; Operations:",
  "Data-Backed Creator Growth:",
  "Global Community &amp; Supply Chain Access:",
  "Ready to Scale?",
  "Join Our Roster →",
  "to empower both visionaries and creators to transcend borders, turning cross-cultural stories into meaningful global growth.",
  "making us the trusted launchpad for creators seeking top-tier sponsorships and brands conquering global markets.",
];
for (const copy of approvedCopy) assertIncludesText(html, copy);
```

Also assert the Talent section contains no `<form`, `data-creator-form`, `Join the Culture`, or `Apply to Join the Roster`, and contains one link with `data-select-contact-role="creator"` and `href="#contact"`.

Assert the homepage no longer contains `paid media`, `paid growth`, `Spark Ads` or `whitelisting` in any casing, including metadata.

- [ ] **Step 2: Run the site tests and verify old copy causes failure**

Run: `node --test tests/site.test.mjs`

Expected: FAIL on the Title Case captions, Service 02 heading, four Talent benefits, CTA and new About sentences.

- [ ] **Step 3: Replace the homepage copy with exact approved text**

Make these exact replacements in `index.html`:

```html
<figcaption>Global Talent Network</figcaption>
<figcaption>Data-Driven Growth</figcaption>
<figcaption>Brand Partnership Hub</figcaption>
```

```html
<h3>From HK to the World</h3>
<p>Headquartered in Hong Kong, we leverage the city’s unique status as a global hub to seamlessly connect East Asian innovation with international audiences. We provide creators with direct access to high-budget global sponsors and cross-cultural growth strategies.</p>
```

```html
<h3>The East-to-West Cross-Border Experts</h3>
<p>Deeply rooted in China’s dynamic supply chains and brand ecosystems, paired with 100% localized global execution, we translate brand brilliance into cross-border viral success.</p>
```

Service 01 Overview:

```html
<p>We build high-impact partnerships between visionary brands and top-tier creators across TikTok, YouTube, and Instagram. We engineer win-win campaigns that elevate brand authority while driving sustainable monetization for creators.</p>
```

Service 02 full copy:

```html
<h3>Data-Driven Growth &amp; Performance Insights</h3>
<div class="service-detail">
  <p class="service-kicker">The Overview</p>
  <p>Going viral shouldn’t be a guessing game. We leverage real-time platform analytics, retention metrics, and audience engagement data to turn one-off viral hits into a predictable, high-performing content flywheel for both brands and creators.</p>
</div>
<div class="service-detail service-actions">
  <p class="service-kicker">What We Do</p>
  <ul>
    <li><strong>Algorithmic &amp; Retention Audits:</strong> Deconstruct video performance line-by-line (retention curves, 3-second hook rates, and CTRs) to optimize content structures for maximum algorithmic push.</li>
    <li><strong>E-Commerce &amp; Direct-Response Optimization:</strong> Analyze audience purchasing behavior and conversion funnels to refine call-to-actions (CTAs), maximizing both brand sales and creator commissions.</li>
    <li><strong>Audience Demographics &amp; Niche Matching:</strong> Utilize deep-level audience insights to pair creators with the exact brand categories their followers are most likely to buy from.</li>
  </ul>
</div>
```

Service 03 full copy:

```html
<p>We break down cultural barriers by pairing brands with local trendsetters. We empower creators with algorithm coaching, script audits, and native trend insights to produce high-performing UGC.</p>
<ul>
  <li><strong>Localized Trend Jacking:</strong> Aligning creator content with fast-moving global social trends, sounds, and native hooks.</li>
  <li><strong>Script Audits &amp; UGC Production:</strong> Actionable content optimizations and scalable asset creation for long-term brand equity.</li>
  <li><strong>Supply Chain &amp; Offline Immersion:</strong> Exclusive factory tours and sourcing trips that give creators first-look access to unreleased products.</li>
</ul>
```

Talent benefits and CTA:

```html
<div class="creator-benefits" aria-labelledby="creator-benefits-heading">
  <h3 id="creator-benefits-heading">Why Creators Partner With Us:</h3>
  <ul>
    <li><strong>Direct Access to Top Global Brands:</strong> Secure exclusive sponsorships with market leaders and pioneering lifestyle labels, high-tier deal flow.</li>
    <li><strong>Seamless Monetization &amp; Operations:</strong> We handle negotiation, contract compliance, and on-time payouts, so you can focus 100% on creating.</li>
    <li><strong>Data-Backed Creator Growth:</strong> Gain actionable script audits, algorithm insights, and cross-platform distribution strategies designed to turn viral moments into sustainable career growth.</li>
    <li><strong>Global Community &amp; Supply Chain Access:</strong> Join exclusive Creator Masterminds, global offline meetups, and sponsored China factory tours to test unreleased products and create behind-the-scenes content.</li>
  </ul>
</div>
<div class="talent-cta">
  <h3>Ready to Scale?</h3>
  <a class="button button-dark" href="#contact" data-select-contact-role="creator">Join Our Roster →</a>
</div>
```

About mission and advantage endings:

```html
<p>At FLOURISH CULTURE, we believe that great brands shouldn't be limited by geography. Our mission is to empower both visionaries and creators to transcend borders, turning cross-cultural stories into meaningful global growth.</p>
```

```html
<p>We possess an intrinsic, deep-rooted understanding of China’s world-class supply chains, e-commerce innovations, and brand aspirations. Simultaneously, we operate with a 100% localized, ground-level execution network across North America, Europe, and beyond. This dual DNA allows us to eliminate cross-border friction entirely, making us the trusted launchpad for creators seeking top-tier sponsorships and brands conquering global markets.</p>
```

Add to `<head>`:

```html
<meta name="description" content="FLOURISH CULTURE connects visionary brands and global creators through influencer partnerships, data-driven growth, and culture-first localization." />
<link rel="canonical" href="https://www.flourishculturekol.com/" />
```

- [ ] **Step 4: Run the site tests**

Run: `node --test tests/site.test.mjs`

Expected: all content and “no Talent form” assertions pass; unified Contact form assertions remain red until Task 3.

- [ ] **Step 5: Commit**

```bash
git add -- index.html tests/site.test.mjs
git commit -m "feat: apply approved site messaging"
```

### Task 3: Add the unified accessible Contact form and original Privacy Notice

**Files:**
- Modify: `tests/site.test.mjs`
- Modify: `index.html`
- Create: `privacy.html`

- [ ] **Step 1: Write failing static form and privacy tests**

Assert one and only one `data-contact-form`; common fields `name`, `email`, `role`; Brand fields `company`, `budget`, `growthObjectives`; Creator fields `socialHandles`, `niche`, `audienceDemographics`; `privacyAccepted`; honeypot `website`; Turnstile mount; `aria-live` status. Assert exact budget values use en dashes and include `Not sure yet`. Assert no telephone field, no form action or JavaScript submission uses `mailto:`, the obsolete Outlook address is absent, and the only homepage `mailto:` links point to the public `business@flourish-culture.com` address.

Read `privacy.html` and assert its title, effective date `August 18, 2026`, the sections listed below, Cloudflare Turnstile disclosure, `business@flourish-culture.com`, and the absence of `Google`, `Meta`, `Apple`, `Example Company`, copied legal boilerplate markers, analytics claims, or a fixed deletion-day promise.

- [ ] **Step 2: Run and verify missing markup/page failures**

Run: `node --test tests/site.test.mjs`

Expected: FAIL because the unified form and `privacy.html` do not exist.

- [ ] **Step 3: Replace Contact markup with the exact dynamic form**

Keep the existing Contact image/headline/intro. Change the public link to:

```html
<a href="mailto:business@flourish-culture.com">business@flourish-culture.com</a>
```

Replace the old project form with:

```html
<form class="project-form reveal" data-contact-form novalidate>
  <h3>Contact FLOURISH CULTURE</h3>
  <div class="field-grid">
    <label>
      <span>I am a…</span>
      <select name="role" required data-role-select>
        <option value="brand">Brand</option>
        <option value="creator">Creator</option>
      </select>
    </label>
    <label>
      <span>Full Name</span>
      <input name="name" type="text" autocomplete="name" minlength="2" maxlength="120" required />
    </label>
    <label class="field-wide">
      <span>Email Address</span>
      <input name="email" type="email" inputmode="email" autocomplete="email" maxlength="254" required />
    </label>
  </div>

  <div class="field-grid role-fields" data-role-fields="brand">
    <label>
      <span>Company</span>
      <input name="company" type="text" autocomplete="organization" minlength="2" maxlength="160" required />
    </label>
    <label>
      <span>Budget</span>
      <select name="budget" required>
        <option value="">Select a budget range</option>
        <option>$10,000–$30,000</option>
        <option>$30,000–$100,000</option>
        <option>$100,000+</option>
        <option>Not sure yet</option>
      </select>
    </label>
    <label class="field-wide">
      <span>Growth Objectives</span>
      <textarea name="growthObjectives" rows="5" minlength="20" maxlength="2000" required></textarea>
    </label>
  </div>

  <div class="field-grid role-fields" data-role-fields="creator" hidden aria-hidden="true">
    <label class="field-wide">
      <span>Social Media Handles</span>
      <textarea name="socialHandles" rows="3" minlength="3" maxlength="1000" disabled required placeholder="TikTok, Instagram or YouTube handles and links"></textarea>
    </label>
    <label>
      <span>Niche</span>
      <input name="niche" type="text" minlength="2" maxlength="160" disabled required />
    </label>
    <label>
      <span>Main Audience Demographics</span>
      <textarea name="audienceDemographics" rows="4" minlength="5" maxlength="1000" disabled required></textarea>
    </label>
  </div>

  <label class="honeypot-field" aria-hidden="true">
    <span>Website</span>
    <input name="website" type="text" tabindex="-1" autocomplete="off" />
  </label>

  <label class="privacy-consent">
    <input name="privacyAccepted" type="checkbox" required />
    <span>I have read the <a href="privacy.html">Privacy Notice</a> and agree that Flourish Culture may use my information to respond to and assess this inquiry.</span>
  </label>

  <div class="turnstile-slot" data-turnstile-slot aria-label="Security verification"></div>
  <p class="form-status" data-form-status role="status" aria-live="polite"></p>
  <button class="button button-dark" type="submit" data-submit-button disabled>
    Send Inquiry <i class="ri-arrow-right-line" aria-hidden="true"></i>
  </button>
  <p class="form-note">Protected by Cloudflare Turnstile. We do not use this form for advertising analytics.</p>
</form>
```

Change Footer email to `business@flourish-culture.com` and add `<a href="privacy.html">Privacy Notice</a>` in the footer navigation/bottom row.

- [ ] **Step 4: Create the original Privacy Notice**

Create `privacy.html` using the same wordmark/header/footer and `styles.css`. The main content must use these exact headings and prose:

```html
<main class="privacy-main" id="main-content">
  <article class="privacy-article">
    <p class="eyebrow">Privacy Notice</p>
    <h1>How We Handle Contact Information</h1>
    <p class="privacy-effective">Effective August 18, 2026</p>
    <p>This Privacy Notice explains how Flourish Culture handles information submitted through the contact form on this website.</p>

    <h2>Information We Collect</h2>
    <p>We collect the information you choose to provide, including your name, email address and whether you are contacting us as a brand or creator. Brand inquiries may include company, budget and growth objectives. Creator applications may include social media handles, content niche and audience demographics. We also process limited security information, such as request time, verification result and a protected representation of network and email identifiers.</p>

    <h2>How We Use Information</h2>
    <p>We use this information to respond to you, assess a potential brand project or creator relationship, route your inquiry to the appropriate team member, protect the form from abuse and troubleshoot delivery or security issues.</p>

    <h2>Service Providers and Sharing</h2>
    <p>We share information only when reasonably necessary to operate the contact process, including with our email service provider and infrastructure providers. We do not sell information submitted through this form or use it for advertising analytics.</p>

    <h2>Cloudflare Turnstile</h2>
    <p>We use Cloudflare Turnstile to distinguish legitimate submissions from automated abuse. Turnstile may process technical information required to perform that verification under Cloudflare’s own privacy terms.</p>

    <h2>Retention</h2>
    <p>We keep contact information only for as long as reasonably necessary to evaluate and respond to the inquiry, manage a resulting business relationship, meet legitimate operational or legal needs, and protect the service from abuse. Retention may vary with the nature of the inquiry.</p>

    <h2>International Processing</h2>
    <p>Because we work across markets and use online service providers, information may be processed in locations outside the place where you live. We take reasonable steps to handle it consistently with this notice.</p>

    <h2>Security</h2>
    <p>We use reasonable technical and organizational measures designed to protect contact information. No method of transmission or storage can be guaranteed to be completely secure.</p>

    <h2>Your Choices</h2>
    <p>You may ask about, correct or request deletion of contact information you submitted, subject to any information we reasonably need to retain for legal, security or record-keeping purposes.</p>

    <h2>Changes to This Notice</h2>
    <p>We may update this notice when our contact process changes. A material update will be reflected by a new effective date on this page.</p>

    <h2>Contact</h2>
    <p>For a privacy question or request, email <a href="mailto:business@flourish-culture.com">business@flourish-culture.com</a>.</p>
  </article>
</main>
```

Include canonical `https://www.flourishculturekol.com/privacy.html` and a back link to `index.html#contact`.

- [ ] **Step 5: Run the static tests, then keep Tasks 3–4 as one atomic client switch**

Run: `node --test tests/site.test.mjs`

Expected: one form, all role fields/budgets, Privacy content and no-old-mailto-form assertions pass. Do not commit this intermediate state: the new submit button intentionally remains disabled until Task 4 adds its client in the same working change.

### Task 4: Implement dynamic fields, Turnstile and in-page submission

**Files:**
- Create: `contact-form.js`
- Modify: `script.js`
- Modify: `site-core.js`
- Modify: `tests/site.test.mjs`

- [ ] **Step 1: Write failing client structure tests**

Read `contact-form.js` and assert it contains the two API constants, injects only `https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit`, renders with `action: "contact_submit"`, handles `expired-callback` and `error-callback`, posts JSON, does not navigate `window.location`, preserves values on failure, and resets only after status 201/202. Assert `script.js` imports and calls `initContactForm` and contains no mailto builders. Assert `site-core.js` no longer exports mailto builders or the obsolete Outlook inbox.

- [ ] **Step 2: Run and verify the missing module/client failures**

Run: `node --test tests/site.test.mjs`

Expected: FAIL because `contact-form.js` does not exist and old form handlers remain.

- [ ] **Step 3: Implement `contact-form.js`**

Create these exported units so pure parts can be exercised independently and DOM orchestration remains one focused file:

```js
import {
  CONTACT_CONFIG_ENDPOINT,
  CONTACT_SUBMIT_ENDPOINT,
  buildContactPayload,
  fieldsForRole,
  messageForContactResult,
} from "./site-core.js";

let turnstileLoader;

export function loadTurnstile(doc = document, win = window) {
  if (win.turnstile) return Promise.resolve(win.turnstile);
  if (turnstileLoader) return turnstileLoader;
  turnstileLoader = new Promise((resolve, reject) => {
    const script = doc.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(win.turnstile);
    script.onerror = () => reject(new Error("turnstile_unavailable"));
    doc.head.append(script);
  });
  return turnstileLoader;
}

export function setRole(form, role) {
  for (const panel of form.querySelectorAll("[data-role-fields]")) {
    const active = panel.dataset.roleFields === role;
    panel.hidden = !active;
    panel.setAttribute("aria-hidden", String(!active));
    for (const control of panel.querySelectorAll("input, select, textarea")) control.disabled = !active;
  }
}
```

Complete `contact-form.js` with this orchestration:

```js
function setStatus(element, message, state = "") {
  element.textContent = message;
  if (state) element.dataset.state = state;
  else delete element.dataset.state;
}

async function getConfig(fetchImpl) {
  const response = await fetchImpl(CONTACT_CONFIG_ENDPOINT, {
    headers: { accept: "application/json" },
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!response.ok) throw new Error("contact_config_unavailable");
  const config = await response.json();
  if (!config.turnstileSiteKey || !config.formSessionToken || !config.expiresAt) {
    throw new Error("contact_config_invalid");
  }
  return config;
}

function clearServerErrors(form) {
  for (const control of form.querySelectorAll("input, select, textarea")) control.setCustomValidity("");
}

function applyServerErrors(form, errors = {}) {
  for (const [name, message] of Object.entries(errors)) {
    form.elements.namedItem(name)?.setCustomValidity(String(message));
  }
}

export async function initContactForm({ doc = document, win = window, fetchImpl = fetch } = {}) {
  const form = doc.querySelector("[data-contact-form]");
  if (!form) return;
  const roleSelect = form.querySelector("[data-role-select]");
  const status = form.querySelector("[data-form-status]");
  const submitButton = form.querySelector("[data-submit-button]");
  const turnstileSlot = form.querySelector("[data-turnstile-slot]");
  const contactSection = doc.querySelector("#contact");
  let formSessionToken = "";
  let sessionExpiresAt = 0;
  let turnstileToken = "";
  let turnstileApi;
  let widgetId;

  function onChallengeToken(token) {
    turnstileToken = token;
    submitButton.disabled = false;
    if (status.dataset.state === "verification") setStatus(status, "");
  }

  async function refreshChallenge() {
    const config = await getConfig(fetchImpl);
    formSessionToken = config.formSessionToken;
    sessionExpiresAt = Date.parse(config.expiresAt);
    turnstileToken = "";
    submitButton.disabled = true;
    turnstileApi ??= await loadTurnstile(doc, win);
    if (widgetId === undefined) {
      widgetId = turnstileApi.render(turnstileSlot, {
        sitekey: config.turnstileSiteKey,
        action: "contact_submit",
        callback: onChallengeToken,
        "expired-callback": () => {
          turnstileToken = "";
          submitButton.disabled = true;
          setStatus(status, "Verification expired. Please complete it again.", "verification");
        },
        "error-callback": () => {
          turnstileToken = "";
          submitButton.disabled = true;
          setStatus(status, "Verification is temporarily unavailable. Please try again.", "error");
        },
      });
    } else {
      turnstileApi.reset(widgetId);
    }
  }

  setRole(form, roleSelect.value);
  roleSelect.addEventListener("change", () => {
    clearServerErrors(form);
    setRole(form, roleSelect.value);
  });

  for (const link of doc.querySelectorAll('[data-select-contact-role="creator"]')) {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      roleSelect.value = "creator";
      setRole(form, "creator");
      contactSection?.scrollIntoView({
        behavior: win.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "start",
      });
      win.setTimeout(() => {
        const firstEmpty = fieldsForRole("creator")
          .map((name) => form.elements.namedItem(name))
          .find((control) => !control?.value.trim());
        firstEmpty?.focus();
      }, 250);
    });
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearServerErrors(form);
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    if (!turnstileToken || !formSessionToken || Date.now() >= sessionExpiresAt) {
      setStatus(status, "Please complete the verification and try again.", "verification");
      await refreshChallenge().catch(() => {
        setStatus(status, messageForContactResult(503), "error");
      });
      return;
    }

    const data = new FormData(form);
    const values = Object.fromEntries(data.entries());
    const payload = buildContactPayload({
      ...values,
      privacyAccepted: data.has("privacyAccepted"),
      turnstileToken,
      formSessionToken,
    });
    form.setAttribute("aria-busy", "true");
    submitButton.disabled = true;
    setStatus(status, "Sending…");
    let accepted = false;

    try {
      const response = await fetchImpl(CONTACT_SUBMIT_ENDPOINT, {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => ({}));
      accepted = response.status === 201 || response.status === 202;
      if (accepted) {
        form.reset();
        roleSelect.value = "brand";
        setRole(form, "brand");
        setStatus(status, messageForContactResult(response.status), "success");
      } else {
        applyServerErrors(form, body.errors);
        setStatus(status, messageForContactResult(response.status), "error");
        if (response.status === 400) form.reportValidity();
      }
    } catch {
      setStatus(status, messageForContactResult(503), "error");
    } finally {
      form.removeAttribute("aria-busy");
      await refreshChallenge().catch(() => {
        submitButton.disabled = true;
        if (!accepted) setStatus(status, messageForContactResult(503), "error");
      });
    }
  });

  await refreshChallenge().catch(() => {
    submitButton.disabled = true;
    setStatus(status, messageForContactResult(503), "error");
  });
}
```

- [ ] **Step 4: Simplify `script.js` to initialize the new module**

At the top:

```js
import { initContactForm } from "./contact-form.js";
```

Delete `creatorForm`, `projectForm`, `validateForm`, URL-field and mailto listeners. Keep menu, scroll, and reveal behavior unchanged. Call:

```js
initContactForm();
```

before reveal initialization.

In the same step, delete `CREATOR_APPLICATION_EMAIL`, `PROJECT_INQUIRY_EMAIL`, `isValidEmail`, `isValidHttpUrl`, `buildMailto`, `buildCreatorMailto`, and `buildProjectMailto` from `site-core.js`. In `tests/site.test.mjs`, delete the three obsolete mailto/email-URL tests and their old import block, then add the no-mailto/no-Outlook assertion. This makes the client switch atomic: no committed state imports a function that no longer exists.

- [ ] **Step 5: Run tests and commit**

Run: `node --test tests/site.test.mjs tests/site-core.test.mjs && npm test`

Expected: all static and pure client tests pass.

Commit:

```bash
git add -- index.html privacy.html contact-form.js script.js site-core.js tests/site.test.mjs
git commit -m "feat: add unified in-page contact flow"
```

### Task 5: Extend the existing visual system for the CTA, dynamic form and Privacy page

**Files:**
- Modify: `tests/site.test.mjs`
- Modify: `styles.css`

- [ ] **Step 1: Write failing continuity and accessibility style tests**

Assert the new selectors use existing tokens (`--coral`, `--paper`, `--ink`, `--line-light`) and that:

- `.talent-cta` is not a nested glass card.
- `.role-fields[hidden]` is not displayed.
- `.privacy-consent` uses a two-column checkbox/text layout with a minimum 24px checkbox target.
- `.honeypot-field` is visually off-screen without `display:none`.
- `.form-status` has reserved minimum height and success/error modifier colors.
- `.privacy-main` and `.privacy-article` retain dark editorial typography and a readable 760px measure.
- mobile media rules make form actions full width and avoid horizontal overflow.

- [ ] **Step 2: Run the CSS assertions and verify failure**

Run: `node --test tests/site.test.mjs`

Expected: FAIL because the new selectors are missing.

- [ ] **Step 3: Add only continuity-preserving CSS**

Add, using existing variables:

```css
.talent-cta {
  display: flex;
  flex-wrap: wrap;
  gap: 14px 22px;
  align-items: center;
}

.talent-cta h3 { margin: 0; font-size: clamp(22px, 2vw, 30px); }
.role-fields { margin-top: 12px; }
.role-fields[hidden] { display: none; }

.privacy-consent {
  grid-template-columns: 24px minmax(0, 1fr);
  align-items: start;
  gap: 10px;
  margin-top: 4px;
}

.privacy-consent input { width: 24px; min-height: 24px; margin: 0; accent-color: var(--coral); }
.privacy-consent span { min-height: 0; letter-spacing: 0; text-transform: none; line-height: 1.5; }
.privacy-consent a { color: var(--ink); text-decoration: underline; text-underline-offset: 3px; }

.honeypot-field {
  position: absolute;
  left: -10000px;
  width: 1px;
  height: 1px;
  overflow: hidden;
}

.turnstile-slot { min-height: 65px; }
.form-status { min-height: 1.5em; margin: 0; font-size: 13px; line-height: 1.5; }
.form-status[data-state="success"] { color: #256b45; }
.form-status[data-state="error"] { color: #8d2f24; }
.project-form[aria-busy="true"] { cursor: progress; }

.privacy-main { min-height: 100vh; padding: clamp(120px, 14vw, 180px) var(--gutter) 80px; background: var(--black); }
.privacy-article { width: min(100%, 760px); margin: 0 auto; color: var(--white); }
.privacy-article h1 { margin-bottom: 16px; font-size: clamp(44px, 6vw, 76px); }
.privacy-article h2 { margin: 42px 0 12px; font-size: clamp(24px, 3vw, 34px); }
.privacy-article p { color: var(--muted); font-size: clamp(15px, 1.2vw, 18px); line-height: 1.75; }
.privacy-article a { color: var(--coral); }
.privacy-effective { margin-bottom: 34px; }
```

Remove now-unused `.creator-form` selectors while preserving the shared `.project-form`, `.field-grid`, focus and mobile rules. Keep all pre-existing image filters, colors and section layout values unchanged.

- [ ] **Step 4: Run tests and local build**

Run: `npm test && npm run build`

Expected: all tests pass and the build succeeds.

- [ ] **Step 5: Commit**

```bash
git add -- styles.css tests/site.test.mjs
git commit -m "style: integrate the unified contact experience"
```

### Task 6: Package the new page/module and reject incomplete releases

**Files:**
- Modify: `scripts/build-release.mjs`
- Modify: `tests/site.test.mjs`
- Modify: `deploy-cloud-assistant.sh`

- [ ] **Step 1: Write failing build-contract tests**

Assert `scripts/build-release.mjs` explicitly includes `privacy.html` and `contact-form.js`; scans `index.html`, `privacy.html`, `styles.css`, `script.js`, `contact-form.js`, and `site-core.js`; throws when a referenced asset is missing; and removes stale dist contents. Assert `deploy-cloud-assistant.sh` requires `privacy.html` and `contact-form.js` before copying.

- [ ] **Step 2: Run and verify failure**

Run: `node --test tests/site.test.mjs`

Expected: FAIL because the file arrays still describe the old four-file site.

- [ ] **Step 3: Expand the exact build and deployment file lists**

Use:

```js
const files = [
  "index.html",
  "privacy.html",
  "styles.css",
  "script.js",
  "contact-form.js",
  "site-core.js",
];
```

Read every copied text file when discovering `assets/...` references. Before copying an asset, call `stat(source)` and allow the thrown path-specific error to fail the build. In `deploy-cloud-assistant.sh`, require:

```bash
for required in index.html privacy.html styles.css script.js contact-form.js site-core.js assets; do
```

- [ ] **Step 4: Run build and inspect its contents**

Run:

```bash
npm test
npm run build
find dist -maxdepth 2 -type f | sort
```

Expected: `dist/privacy.html` and `dist/contact-form.js` exist; no `review-editable.html`, `.env`, tests, docs, source PNG/JPEG fallback that was rewritten to optimized WebP, or server secret exists.

- [ ] **Step 5: Commit**

```bash
git add -- scripts/build-release.mjs deploy-cloud-assistant.sh tests/site.test.mjs
git commit -m "build: package contact and privacy assets"
```

### Task 7: Verify interactions and responsive continuity in Chrome

**Files:**
- Modify: `scripts/browser-qa.cjs`
- Modify: `qa/browser-results.json`
- Create or update: `qa/screenshots/contact-desktop-1440x1024.png`
- Create or update: `qa/screenshots/contact-tablet-1024x1366.png`
- Create or update: `qa/screenshots/contact-mobile-390x844.png`
- Create or update: `qa/screenshots/contact-small-mobile-360x800.png`

- [ ] **Step 1: Add failing browser checks before changing UI logic**

Extend the QA script to assert at all four viewports:

- Brand is the default; Brand fields enabled and Creator fields hidden/disabled.
- Creator selection reverses those states.
- `Join Our Roster →` scrolls to Contact and selects Creator.
- keyboard Tab reaches role, common fields, Privacy checkbox, Turnstile region and submit in visual order.
- no horizontal overflow and no browser console errors.
- a stubbed 502 response keeps entered values and shows the delivery-safe message.
- a stubbed 201 response shows success and resets only after acceptance.
- `prefers-reduced-motion` disables smooth movement.

- [ ] **Step 2: Run QA and retain the first failing evidence**

Run:

```bash
npm run build
node scripts/browser-qa.cjs
```

Expected: the first run exposes any unfinished interaction or selector and exits non-zero until corrected.

- [ ] **Step 3: Make only the minimal client/CSS corrections identified by QA**

Do not alter existing image assets, brand-logo rail, global token values, hero layout, service card proportions, About image treatment, or `/review/` files. Correct only selectors, focus order, status logic or responsive spacing covered by the failing assertion.

- [ ] **Step 4: Re-run QA and inspect all four screenshots**

Run: `node scripts/browser-qa.cjs`

Expected: exit 0; `qa/browser-results.json` records every viewport and interaction as passed. Open all four screenshots and confirm the form does not dominate the Talent section, Creator fields do not jump outside the Contact card, Turnstile has room, and Privacy text remains readable.

- [ ] **Step 5: Commit**

```bash
git add -- script.js contact-form.js styles.css scripts/browser-qa.cjs qa/browser-results.json qa/screenshots/contact-*.png
git commit -m "test: verify responsive contact interactions"
```

## UI plan completion gate

Run fresh:

```bash
npm test
npm run build
node scripts/browser-qa.cjs
rg -ni "flourishculture@outlook\.com|data-creator-form|buildCreatorMailto|buildProjectMailto|Performance-Driven Growth & Paid Media|paid growth|Spark Ads|whitelisting" index.html script.js site-core.js contact-form.js privacy.html dist
```

Expected: tests/build/browser QA pass; the final `rg` returns no matches. This gate does not claim live submission because Turnstile, Nginx and SMTP are intentionally verified only during production release.
