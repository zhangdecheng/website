# FLOURISH Contact API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a same-host Node.js contact API that validates Brand and Creator submissions, applies layered abuse controls, verifies Cloudflare Turnstile, and sends fixed-route email through Yunyou SMTP without storing form data.

**Architecture:** A small Node `http` service listens only on `127.0.0.1`. Focused modules handle configuration, validation, signed form sessions, rate limits/deduplication, Turnstile, mail composition, SMTP delivery, and security-only logging; the HTTP adapter exposes `/api/contact/config`, `/api/contact`, and `/api/contact/health`.

**Tech Stack:** Node.js 20+, ECMAScript modules, built-in `node:http` / `node:test` / Web Fetch API, Nodemailer 9.0.5, Cloudflare Turnstile Siteverify, Yunyou SMTP over TLS 465.

---

## Execution order and repository state

Execute this plan before `2026-08-18-flourish-site-ui-and-copy.md`. The UI plan consumes the API contract defined here. The worktree already contains a copied, user-owned dirty baseline; Task 0 records that baseline as its own commit so later commits do not accidentally mix inherited and new edits.

## File responsibility map

- `server/contact/config.js` — validate environment and expose a typed runtime configuration without logging values.
- `server/contact/validation.js` — normalize and validate the role-specific request body and international email address.
- `server/contact/mail-message.js` — fixed recipient routing plus safe text/HTML message generation.
- `server/contact/form-session.js` — stateless HMAC form-session issue/verify and key derivation.
- `server/contact/abuse-guard.js` — in-memory IP/email sliding windows and in-flight/accepted duplicate claims.
- `server/contact/turnstile.js` — Siteverify client with timeout, hostname, and action checks.
- `server/contact/security-log.js` — redacted JSON security events and identifier hashing.
- `server/contact/service.js` — ordered submission workflow and stable result codes.
- `server/contact/http.js` — body limit, Origin enforcement, trusted-proxy IP extraction, routes, and HTTP mapping.
- `server/index.js` — production composition, Nodemailer transport, local-only listener, and graceful shutdown.
- `tests/contact-*.test.mjs` — focused unit and integration coverage with fake clocks, fake Turnstile, and fake SMTP.
- `.env.example` — names and non-secret defaults only.
- `package.json` / `package-lock.json` — runtime command and exact Nodemailer dependency.

### Task 0: Preserve the inherited working baseline

**Files:**
- Commit only: `PROJECT_PROGRESS.md`
- Commit only: `docs/CHANGELOG.md`
- Commit only: `docs/PROJECT_HANDOFF.md`
- Commit only: `index.html`
- Commit only: `scripts/build-release.mjs`
- Commit only: `styles.css`
- Commit only: `assets/optimized/*.webp`

- [ ] **Step 1: Prove the copied tracked baseline has not changed**

Run:

```bash
git diff -- PROJECT_PROGRESS.md docs/CHANGELOG.md docs/PROJECT_HANDOFF.md index.html scripts/build-release.mjs styles.css | shasum -a 256
```

Expected: `9506ea6dc3095f18ad1e2f992952c51d5d3cc3668e76cf35c756fee4fb77b768  -`.

- [ ] **Step 2: Re-run the baseline test suite**

Run: `npm test`

Expected: 21 tests pass and 0 fail.

- [ ] **Step 3: Stage only the inherited baseline paths**

```bash
git add -- PROJECT_PROGRESS.md docs/CHANGELOG.md docs/PROJECT_HANDOFF.md index.html scripts/build-release.mjs styles.css assets/optimized
git diff --cached --name-status
```

Expected: only the six tracked files and ten `assets/optimized/*.webp` files appear; no `docs/superpowers/` file is staged.

- [ ] **Step 4: Commit the preserved baseline**

```bash
git commit -m "chore: preserve approved website working baseline"
```

- [ ] **Step 5: Verify the worktree is clean**

Run: `git status --short`

Expected: no output.

### Task 1: Lock runtime configuration and dependency versions

**Files:**
- Create: `server/contact/config.js`
- Create: `tests/contact-config.test.mjs`
- Create: `.env.example`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `.gitignore`

- [ ] **Step 1: Write the failing configuration tests**

Create `tests/contact-config.test.mjs`:

```js
import assert from "node:assert/strict";
import test from "node:test";
import { loadContactConfig } from "../server/contact/config.js";

const validEnv = {
  CONTACT_TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
  CONTACT_TURNSTILE_SECRET: "turnstile-secret-for-tests",
  CONTACT_SECURITY_SECRET: "0123456789abcdef0123456789abcdef",
  SMTP_HOST: "smtp.yunyou.top",
  SMTP_PORT: "465",
  SMTP_USER: "business@flourish-culture.com",
  SMTP_PASSWORD: "smtp-test-secret",
};

test("configuration fixes the listener, origins, hostnames and secure SMTP", () => {
  const config = loadContactConfig(validEnv);
  assert.equal(config.host, "127.0.0.1");
  assert.equal(config.port, 3101);
  assert.deepEqual(config.allowedOrigins, [
    "https://www.flourishculturekol.com",
    "https://flourishculturekol.com",
  ]);
  assert.deepEqual(config.allowedHostnames, [
    "www.flourishculturekol.com",
    "flourishculturekol.com",
  ]);
  assert.deepEqual(config.smtp, {
    host: "smtp.yunyou.top",
    port: 465,
    secure: true,
    user: "business@flourish-culture.com",
    password: "smtp-test-secret",
  });
});

test("configuration rejects missing secrets and the wrong SMTP identity", () => {
  assert.throws(() => loadContactConfig({ ...validEnv, SMTP_PASSWORD: "" }), /SMTP_PASSWORD/);
  assert.throws(
    () => loadContactConfig({ ...validEnv, SMTP_USER: "another@example.com" }),
    /business@flourish-culture\.com/,
  );
});
```

- [ ] **Step 2: Run the test and verify the missing module failure**

Run: `node --test tests/contact-config.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `server/contact/config.js`.

- [ ] **Step 3: Implement strict configuration loading**

Create `server/contact/config.js`:

```js
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
```

Create `.env.example` with no usable credentials:

```dotenv
CONTACT_PORT=3101
CONTACT_TURNSTILE_SITE_KEY=
CONTACT_TURNSTILE_SECRET=
CONTACT_SECURITY_SECRET=
SMTP_HOST=smtp.yunyou.top
SMTP_PORT=465
SMTP_USER=business@flourish-culture.com
SMTP_PASSWORD=
```

Keep real environment files ignored while allowing the schema file to be committed:

```gitignore
.env
.env.*
!.env.example
```

Install and lock the verified current stable Nodemailer version:

```bash
npm install --save-exact nodemailer@9.0.5
npm pkg set scripts.start:contact="node server/index.js"
npm pkg set engines.node=">=20"
```

- [ ] **Step 4: Run the focused and full tests**

Run:

```bash
node --test tests/contact-config.test.mjs
npm test
```

Expected: the two configuration tests pass; the full existing suite remains green.

- [ ] **Step 5: Commit**

```bash
git add -- server/contact/config.js tests/contact-config.test.mjs .env.example package.json package-lock.json .gitignore
git commit -m "feat: define secure contact service configuration"
```

### Task 2: Validate and normalize role-specific submissions

**Files:**
- Create: `server/contact/validation.js`
- Create: `tests/contact-validation.test.mjs`

- [ ] **Step 1: Write failing tests for Brand, Creator, Unicode email and injection**

Create `tests/contact-validation.test.mjs`:

```js
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
```

- [ ] **Step 2: Run the test and verify failure**

Run: `node --test tests/contact-validation.test.mjs`

Expected: FAIL because `server/contact/validation.js` does not exist.

- [ ] **Step 3: Implement explicit normalization and limits**

Create `server/contact/validation.js` with these public constants and functions:

```js
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
```

- [ ] **Step 4: Run validation and full tests**

Run:

```bash
node --test tests/contact-validation.test.mjs
npm test
```

Expected: all validation cases and the existing suite pass.

- [ ] **Step 5: Commit**

```bash
git add -- server/contact/validation.js tests/contact-validation.test.mjs
git commit -m "feat: validate brand and creator submissions"
```

### Task 3: Compose fixed-route, injection-safe email

**Files:**
- Create: `server/contact/mail-message.js`
- Create: `tests/contact-mail.test.mjs`

- [ ] **Step 1: Write failing routing and escaping tests**

Create `tests/contact-mail.test.mjs` with one complete Brand and Creator fixture and assert:

```js
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
  assert.equal(message.to, "irisa@flourishculture.com");
  assert.equal(message.subject, "[Flourish Website] New Creator Application");
  assert.match(message.text, /TikTok @maya/);
  assert.match(message.text, /US and UK/);
});
```

- [ ] **Step 2: Verify the missing module failure**

Run: `node --test tests/contact-mail.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Implement server-owned headers and escaped bodies**

Create `server/contact/mail-message.js`:

```js
const FROM = "Flourish Website <business@flourish-culture.com>";
const ROUTES = Object.freeze({
  brand: {
    to: "hannah@flourish-culture.com",
    subject: "[Flourish Website] New Brand Inquiry",
    fields: [
      ["Name", "name"],
      ["Email", "replyTo"],
      ["Company", "company"],
      ["Budget", "budget"],
      ["Growth Objectives", "growthObjectives"],
    ],
  },
  creator: {
    to: "irisa@flourishculture.com",
    subject: "[Flourish Website] New Creator Application",
    fields: [
      ["Name", "name"],
      ["Email", "replyTo"],
      ["Social Media Handles", "socialHandles"],
      ["Niche", "niche"],
      ["Main Audience Demographics", "audienceDemographics"],
    ],
  },
});

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
    .replaceAll("\n", "<br>");
}

export function buildMailMessage(submission) {
  const route = ROUTES[submission.role];
  if (!route) throw new Error("Unsupported contact role");
  const rows = route.fields.map(([label, key]) => [label, submission[key]]);
  return {
    from: FROM,
    to: route.to,
    replyTo: submission.replyTo,
    subject: route.subject,
    text: rows.map(([label, value]) => `${label}: ${value}`).join("\n\n"),
    html: `<h1>${escapeHtml(route.subject)}</h1><dl>${rows
      .map(([label, value]) => `<dt><strong>${escapeHtml(label)}</strong></dt><dd>${escapeHtml(value)}</dd>`)
      .join("")}</dl>`,
  };
}
```

- [ ] **Step 4: Run focused and full tests**

Run: `node --test tests/contact-mail.test.mjs && npm test`

Expected: all pass; no test performs network I/O.

- [ ] **Step 5: Commit**

```bash
git add -- server/contact/mail-message.js tests/contact-mail.test.mjs
git commit -m "feat: route contact email with fixed headers"
```

### Task 4: Sign form sessions and derive non-reversible identifiers

**Files:**
- Create: `server/contact/form-session.js`
- Create: `tests/contact-session.test.mjs`

- [ ] **Step 1: Write failing issue, age, expiry, and tamper tests**

Create deterministic tests using `now = 1_800_000_000_000`, secret `0123456789abcdef0123456789abcdef`, and nonce bytes `Buffer.alloc(16, 7)`. Assert that the token is rejected at 2,999 ms with `too_fast`, accepted at 3,000 ms, rejected after 60 minutes with `expired`, and rejected after changing its final character with `invalid`.

```js
const token = issueFormSession(secret, {
  now,
  randomBytes: () => Buffer.alloc(16, 7),
});
assert.equal(verifyFormSession(token, secret, { now: now + 2_999 }).reason, "too_fast");
assert.equal(verifyFormSession(token, secret, { now: now + 3_000 }).ok, true);
assert.equal(verifyFormSession(token, secret, { now: now + 3_600_001 }).reason, "expired");
assert.equal(verifyFormSession(`${token.slice(0, -1)}x`, secret, { now: now + 4_000 }).reason, "invalid");
```

- [ ] **Step 2: Run and verify the missing module failure**

Run: `node --test tests/contact-session.test.mjs`

Expected: FAIL for the missing module.

- [ ] **Step 3: Implement stateless HMAC tokens and purpose-separated keys**

Create `server/contact/form-session.js` exporting:

```js
import { createHmac, randomBytes as cryptoRandomBytes, timingSafeEqual } from "node:crypto";

const MIN_AGE_MS = 3_000;
const MAX_AGE_MS = 3_600_000;

export function deriveKey(secret, purpose) {
  return createHmac("sha256", secret).update(`flourish-contact:${purpose}`).digest();
}

function sign(payload, key) {
  return createHmac("sha256", key).update(payload).digest("base64url");
}

export function issueFormSession(secret, { now = Date.now(), randomBytes = cryptoRandomBytes } = {}) {
  const payload = Buffer.from(JSON.stringify({ iat: now, nonce: randomBytes(16).toString("base64url") })).toString("base64url");
  return `${payload}.${sign(payload, deriveKey(secret, "form-session"))}`;
}

export function verifyFormSession(token, secret, { now = Date.now() } = {}) {
  try {
    const [payload, signature, extra] = String(token).split(".");
    if (!payload || !signature || extra) return { ok: false, reason: "invalid" };
    const expected = Buffer.from(sign(payload, deriveKey(secret, "form-session")));
    const received = Buffer.from(signature);
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) return { ok: false, reason: "invalid" };
    const { iat } = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    const age = now - iat;
    if (!Number.isFinite(iat) || age < 0) return { ok: false, reason: "invalid" };
    if (age < MIN_AGE_MS) return { ok: false, reason: "too_fast" };
    if (age > MAX_AGE_MS) return { ok: false, reason: "expired" };
    return { ok: true };
  } catch {
    return { ok: false, reason: "invalid" };
  }
}
```

- [ ] **Step 4: Run tests**

Run: `node --test tests/contact-session.test.mjs && npm test`

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add -- server/contact/form-session.js tests/contact-session.test.mjs
git commit -m "feat: sign short-lived contact form sessions"
```

### Task 5: Add rate limits, duplicate claims, and redacted security logs

**Files:**
- Create: `server/contact/abuse-guard.js`
- Create: `server/contact/security-log.js`
- Create: `tests/contact-abuse.test.mjs`
- Create: `tests/contact-log.test.mjs`

- [ ] **Step 1: Write failing deterministic abuse-control tests**

Test an IP key is allowed for calls 1–5 in ten minutes and rejected on call 6 with a positive `retryAfter`; test the 24-hour limit at call 21. Test email limits at 4/hour and 6/day. Test a duplicate `claim()` returns `duplicate` while in flight, `commit()` keeps it duplicate for ten minutes, `release()` permits retry after SMTP failure, and expiry permits a new claim.

```js
const ipLimiter = new SlidingWindowLimiter([
  { limit: 5, windowMs: 600_000 },
  { limit: 20, windowMs: 86_400_000 },
]);
for (let index = 0; index < 5; index += 1) assert.equal(ipLimiter.consume("ip", index).allowed, true);
assert.equal(ipLimiter.consume("ip", 5).allowed, false);

const duplicates = new DuplicateGuard({ acceptedMs: 600_000, inFlightMs: 60_000 });
assert.equal(duplicates.claim("fingerprint", 0), "claimed");
assert.equal(duplicates.claim("fingerprint", 1), "duplicate");
duplicates.release("fingerprint");
assert.equal(duplicates.claim("fingerprint", 2), "claimed");
duplicates.commit("fingerprint", 2);
assert.equal(duplicates.claim("fingerprint", 600_003), "claimed");
```

Test logging with a fixture containing `SMTP_PASSWORD`, `turnstileToken`, name, company, and raw email; capture the writer output and assert none of those values appear while `requestId`, `outcome`, `ipHash`, and `emailHash` do appear.

- [ ] **Step 2: Run both test files and verify failure**

Run: `node --test tests/contact-abuse.test.mjs tests/contact-log.test.mjs`

Expected: FAIL because both modules are absent.

- [ ] **Step 3: Implement bounded in-memory guards and an allow-list logger**

Create `server/contact/abuse-guard.js`:

```js
export class SlidingWindowLimiter {
  constructor(policies, { maxKeys = 10_000 } = {}) {
    this.policies = [...policies].sort((a, b) => a.windowMs - b.windowMs);
    this.maxWindowMs = Math.max(...this.policies.map(({ windowMs }) => windowMs));
    this.maxKeys = maxKeys;
    this.events = new Map();
  }

  consume(key, now = Date.now()) {
    for (const [storedKey, timestamps] of this.events) {
      const live = timestamps.filter((time) => time > now - this.maxWindowMs);
      if (live.length) this.events.set(storedKey, live);
      else this.events.delete(storedKey);
    }
    if (!this.events.has(key) && this.events.size >= this.maxKeys) {
      return { allowed: false, retryAfter: 60 };
    }
    const recent = (this.events.get(key) ?? []).filter((time) => time > now - this.maxWindowMs);
    for (const { limit, windowMs } of this.policies) {
      const inWindow = recent.filter((time) => time > now - windowMs);
      if (inWindow.length >= limit) {
        return {
          allowed: false,
          retryAfter: Math.max(1, Math.ceil((inWindow[0] + windowMs - now) / 1000)),
        };
      }
    }
    recent.push(now);
    this.events.set(key, recent);
    return { allowed: true };
  }
}

export class DuplicateGuard {
  constructor({ acceptedMs, inFlightMs, maxEntries = 10_000 }) {
    this.acceptedMs = acceptedMs;
    this.inFlightMs = inFlightMs;
    this.maxEntries = maxEntries;
    this.entries = new Map();
  }

  claim(fingerprint, now = Date.now()) {
    for (const [key, entry] of this.entries) {
      if (entry.expiresAt <= now) this.entries.delete(key);
    }
    const current = this.entries.get(fingerprint);
    if (current && current.expiresAt > now) return "duplicate";
    if (this.entries.size >= this.maxEntries) return "duplicate";
    this.entries.set(fingerprint, { state: "in_flight", expiresAt: now + this.inFlightMs });
    return "claimed";
  }

  commit(fingerprint, now = Date.now()) {
    this.entries.set(fingerprint, { state: "accepted", expiresAt: now + this.acceptedMs });
  }

  release(fingerprint) {
    const current = this.entries.get(fingerprint);
    if (current?.state === "in_flight") this.entries.delete(fingerprint);
  }
}
```

In `server/contact/security-log.js`, expose only this allow-listed event shape:

```js
import { createHmac } from "node:crypto";
import { deriveKey } from "./form-session.js";

export function hashIdentifier(value, secret) {
  return createHmac("sha256", deriveKey(secret, "security-log"))
    .update(String(value).normalize("NFC").toLowerCase())
    .digest("hex");
}

export function createSecurityLogger({ write = console.log } = {}) {
  return function securityLog({ requestId, timestamp, durationMs, role, outcome, reason, ipHash, emailHash }) {
    write(JSON.stringify({ requestId, timestamp, durationMs, role, outcome, reason, ipHash, emailHash }));
  };
}
```

- [ ] **Step 4: Run abuse, log, and full tests**

Run: `node --test tests/contact-abuse.test.mjs tests/contact-log.test.mjs && npm test`

Expected: all pass and no raw PII appears in captured log output.

- [ ] **Step 5: Commit**

```bash
git add -- server/contact/abuse-guard.js server/contact/security-log.js tests/contact-abuse.test.mjs tests/contact-log.test.mjs
git commit -m "feat: enforce contact abuse controls"
```

### Task 6: Verify Cloudflare Turnstile server-side

**Files:**
- Create: `server/contact/turnstile.js`
- Create: `tests/contact-turnstile.test.mjs`

- [ ] **Step 1: Write failing tests with a fake Fetch implementation**

Cover: successful verification with `hostname=www.flourishculturekol.com` and `action=contact_submit`; rejection for `success=false`; rejection for an unexpected hostname/action; `unavailable=true` for HTTP 500, invalid JSON, timeout, and network failure. Inspect the fake request body and assert it contains `secret`, `response`, and `remoteip` but no query-string secret.

- [ ] **Step 2: Run and verify failure**

Run: `node --test tests/contact-turnstile.test.mjs`

Expected: FAIL for the missing module.

- [ ] **Step 3: Implement Siteverify with a five-second abort**

Create `server/contact/turnstile.js`:

```js
const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verifyTurnstile({
  token,
  remoteIp,
  secret,
  allowedHostnames,
  fetchImpl = fetch,
  timeoutMs = 5_000,
}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(VERIFY_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token, remoteip: remoteIp }),
      signal: controller.signal,
    });
    if (!response.ok) return { ok: false, unavailable: true, reason: "turnstile_http" };
    const result = await response.json();
    if (!result.success) return { ok: false, unavailable: false, reason: "turnstile_rejected" };
    if (!allowedHostnames.includes(result.hostname) || result.action !== "contact_submit") {
      return { ok: false, unavailable: false, reason: "turnstile_context" };
    }
    return { ok: true };
  } catch {
    return { ok: false, unavailable: true, reason: "turnstile_unavailable" };
  } finally {
    clearTimeout(timeout);
  }
}
```

- [ ] **Step 4: Run tests**

Run: `node --test tests/contact-turnstile.test.mjs && npm test`

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add -- server/contact/turnstile.js tests/contact-turnstile.test.mjs
git commit -m "feat: verify turnstile contact challenges"
```

### Task 7: Orchestrate validation, risk checks, deduplication and SMTP

**Files:**
- Create: `server/contact/service.js`
- Create: `tests/contact-service.test.mjs`

- [ ] **Step 1: Write failing workflow tests with injected dependencies**

Create fakes for `verifyTurnstile`, `sendMail`, `now`, logger, IP limiter, email limiter, and duplicate guard. Assert the exact behavior table:

| Case | Result | SMTP calls |
| --- | --- | --- |
| invalid fields | `validation_error` | 0 |
| non-empty honeypot | `bot_rejected` | 0 |
| session too fast/invalid | `bot_rejected` | 0 |
| IP limit | `rate_limited` + retry | 0 |
| Turnstile reject | `verification_failed` | 0 |
| Turnstile outage | `dependency_unavailable` | 0 |
| duplicate | `duplicate` | 0 |
| email limit | `rate_limited` + retry | 0 |
| SMTP reject | `delivery_failed`, duplicate claim released | 1 |
| accepted Brand | `accepted`, message To Hannah | 1 |
| accepted Creator | `accepted`, message To Irisa | 1 |

- [ ] **Step 2: Run and verify failure**

Run: `node --test tests/contact-service.test.mjs`

Expected: FAIL for the missing service module.

- [ ] **Step 3: Implement the fixed processing order**

Create `createContactService(deps)` in `server/contact/service.js`. The returned `submit(raw, { ip, requestId })` must execute exactly:

```js
const validation = validateSubmission(raw);
if (!validation.ok) return { code: "validation_error", errors: validation.errors };
const submission = validation.value;
if (submission.website) return { code: "bot_rejected", reason: "honeypot" };
const session = verifyFormSession(submission.formSessionToken, securitySecret, { now: now() });
if (!session.ok) return { code: "bot_rejected", reason: session.reason };
const ipLimit = ipLimiter.consume(hashIdentifier(ip, securitySecret), now());
if (!ipLimit.allowed) return { code: "rate_limited", retryAfter: ipLimit.retryAfter };
const challenge = await verifyChallenge(submission.turnstileToken, ip);
if (!challenge.ok) return {
  code: challenge.unavailable ? "dependency_unavailable" : "verification_failed",
  reason: challenge.reason,
};
const fingerprint = submissionFingerprint(submission, securitySecret);
if (duplicates.claim(fingerprint, now()) === "duplicate") return { code: "duplicate" };
const emailLimit = emailLimiter.consume(hashIdentifier(submission.email, securitySecret), now());
if (!emailLimit.allowed) {
  duplicates.release(fingerprint);
  return { code: "rate_limited", retryAfter: emailLimit.retryAfter };
}
try {
  await sendMail(buildMailMessage(submission));
  duplicates.commit(fingerprint, now());
  return { code: "accepted" };
} catch {
  duplicates.release(fingerprint);
  return { code: "delivery_failed" };
}
```

Add this exact fingerprint helper to `server/contact/service.js`; it HMACs only normalized business fields and excludes Turnstile/session tokens and honeypot:

```js
import { createHmac } from "node:crypto";
import { deriveKey } from "./form-session.js";

export function submissionFingerprint(submission, secret) {
  const businessFields = submission.role === "brand"
    ? [submission.role, submission.name, submission.email, submission.company, submission.budget, submission.growthObjectives]
    : [submission.role, submission.name, submission.email, submission.socialHandles, submission.niche, submission.audienceDemographics];
  return createHmac("sha256", deriveKey(secret, "duplicate"))
    .update(JSON.stringify(businessFields))
    .digest("hex");
}
```

Every exit records one allow-listed security event with hashed identifiers; it never passes the raw submission to the logger.

- [ ] **Step 4: Run workflow and full tests**

Run: `node --test tests/contact-service.test.mjs && npm test`

Expected: the complete behavior table passes.

- [ ] **Step 5: Commit**

```bash
git add -- server/contact/service.js tests/contact-service.test.mjs
git commit -m "feat: orchestrate secure contact delivery"
```

### Task 8: Expose the HTTP API and trusted proxy boundary

**Files:**
- Create: `server/contact/http.js`
- Create: `tests/contact-http.test.mjs`

- [ ] **Step 1: Write failing real-HTTP integration tests**

Start `createServer(createContactHttpHandler(deps))` on port `0` inside each test and close it with `t.after`. Cover:

- `GET /api/contact/health` returns `200`, `{ ok: true, configured: true, version: "1.2.0" }`, and no secret values.
- `GET /api/contact/config` returns exactly `{ turnstileSiteKey, formSessionToken, expiresAt }`, where `expiresAt` is an ISO timestamp 60 minutes after issuance, plus `Cache-Control: no-store`.
- valid `POST /api/contact` maps `accepted→201`, `duplicate→202`.
- validation maps to `400`, bot/verification to `403`, rate limit to `429` with `Retry-After`, delivery failure to `502`, dependency failure to `503`.
- missing/wrong Origin is `403`; content type other than JSON is `415`; more than 32 KiB is `413`; malformed JSON is `400`.
- `X-Real-IP` is used only when the socket address is loopback; a direct non-loopback test uses the socket IP.

- [ ] **Step 2: Run and verify failure**

Run: `node --test tests/contact-http.test.mjs`

Expected: FAIL for the missing HTTP module.

- [ ] **Step 3: Implement routes, body limit and stable public errors**

Create `server/contact/http.js` with:

```js
import { randomUUID } from "node:crypto";
import { issueFormSession } from "./form-session.js";

const BODY_LIMIT = 32 * 1024;

function json(res, status, body, headers = {}) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    ...headers,
  });
  res.end(JSON.stringify(body));
}

async function readJson(req) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > BODY_LIMIT) throw Object.assign(new Error("too_large"), { code: "too_large" });
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
```

`createContactHttpHandler({ config, service, version })` must use an explicit route switch, require exact allowed Origin only for POST, accept only `application/json`, and return generic English messages. It must never serialize an exception, recipient, SMTP response, or secret. Use `requestId = randomUUID()` in every POST response.

The config route must construct its response with:

```js
const issuedAt = Date.now();
json(res, 200, {
  turnstileSiteKey: config.turnstileSiteKey,
  formSessionToken: issueFormSession(config.securitySecret, { now: issuedAt }),
  expiresAt: new Date(issuedAt + 3_600_000).toISOString(),
});
```

The POST status mapper returns `{ ok: false, requestId, errors }` only for `validation_error`; every other failure body contains `{ ok: false, requestId, message }`. Accepted and duplicate responses contain `{ ok: true, requestId }`. Internal reason codes remain in redacted server logs rather than public JSON.

- [ ] **Step 4: Run HTTP and full tests**

Run: `node --test tests/contact-http.test.mjs && npm test`

Expected: all HTTP statuses, headers, response schemas, and existing tests pass.

- [ ] **Step 5: Commit**

```bash
git add -- server/contact/http.js tests/contact-http.test.mjs
git commit -m "feat: expose the same-origin contact api"
```

### Task 9: Compose the production service without leaking configuration

**Files:**
- Create: `server/index.js`
- Create: `tests/contact-entrypoint.test.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write the failing entrypoint structure test**

Read `server/index.js` and assert it imports Nodemailer, calls `loadContactConfig`, binds with `server.listen(config.port, config.host)`, configures `secure: true`, uses no console output containing `password`, `turnstileSecret`, or `securitySecret`, and installs `SIGTERM`/`SIGINT` graceful shutdown handlers.

- [ ] **Step 2: Run and verify failure**

Run: `node --test tests/contact-entrypoint.test.mjs`

Expected: FAIL because `server/index.js` does not exist.

- [ ] **Step 3: Implement production dependency composition**

Create `server/index.js` that:

```js
import { createServer } from "node:http";
import nodemailer from "nodemailer";
import { loadContactConfig } from "./contact/config.js";
import { SlidingWindowLimiter, DuplicateGuard } from "./contact/abuse-guard.js";
import { createContactHttpHandler } from "./contact/http.js";
import { createContactService } from "./contact/service.js";
import { createSecurityLogger } from "./contact/security-log.js";
import { verifyTurnstile } from "./contact/turnstile.js";

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
```

Compose IP limits `{5/10m,20/24h}`, email limits `{3/1h,5/24h}`, duplicate windows `{60s in-flight,10m accepted}`, Turnstile verifier, logger, service, and HTTP handler. Log only service start/stop address and port. Gracefully stop accepting connections on `SIGTERM`/`SIGINT`, close the SMTP transport, and force exit only after a ten-second shutdown deadline.

Update both `package.json` and `package-lock.json` without creating a Git tag:

```bash
npm version 1.2.0 --no-git-tag-version
```

Then keep scripts:

```json
{
  "start:contact": "node server/index.js",
  "test:contact": "node --test tests/contact-*.test.mjs"
}
```

- [ ] **Step 4: Run all server and project tests**

Run:

```bash
npm run test:contact
npm test
```

Expected: every contact test uses fakes/local ephemeral HTTP only; all tests pass without SMTP or Turnstile network calls.

- [ ] **Step 5: Audit secrets and commit**

Run:

```bash
rg -n "smtp-test-secret|turnstile-secret-for-tests|0123456789abcdef" server .env.example
git diff --check
```

Expected: no test fixture secret appears under `server/` or `.env.example`; `git diff --check` is silent.

Commit:

```bash
git add -- server/index.js tests/contact-entrypoint.test.mjs package.json package-lock.json
git commit -m "feat: run the contact service on loopback"
```

### Task 10: Add a safe SMTP authentication preflight

**Files:**
- Create: `server/smtp-check.js`
- Create: `tests/contact-smtp-check.test.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write the failing no-secret-output test**

Create `tests/contact-smtp-check.test.mjs` to read `server/smtp-check.js` and assert that it uses `loadContactConfig`, `nodemailer.createTransport`, `transport.verify()` and `transport.close()`, prints only the fixed result codes `smtp_authentication_accepted` or `smtp_authentication_rejected`, never serializes `config`, and never prints `password`, `turnstileSecret` or `securitySecret`.

- [ ] **Step 2: Run and verify the missing file failure**

Run: `node --test tests/contact-smtp-check.test.mjs`

Expected: FAIL because `server/smtp-check.js` does not exist.

- [ ] **Step 3: Implement the one-shot authentication check**

Create `server/smtp-check.js`:

```js
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
```

Add `"check:smtp": "node server/smtp-check.js"` to `scripts` in `package.json`.

- [ ] **Step 4: Run tests without invoking real SMTP**

Run:

```bash
node --test tests/contact-smtp-check.test.mjs
npm test
```

Expected: tests pass; `npm run check:smtp` is deliberately not run locally because production credentials are absent.

- [ ] **Step 5: Commit**

```bash
git add -- server/smtp-check.js tests/contact-smtp-check.test.mjs package.json package-lock.json
git commit -m "ops: add a redacted smtp preflight"
```

## Contact API plan completion gate

Run fresh, in order:

```bash
npm run test:contact
npm test
git status --short
```

Expected: all tests pass; status contains no uncommitted backend changes. Do not use a real SMTP password or Turnstile secret during this plan. Real credential and delivery verification belong exclusively to the production release plan.
