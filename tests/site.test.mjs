import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";
import { inflateSync } from "node:zlib";

function section(html, className) {
  return html.match(new RegExp(`<section class="${className}"[\\s\\S]*?<\\/section>`))?.[0] ?? "";
}

function normalized(value) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function assertIncludesText(source, expected) {
  assert.ok(source.includes(expected), `Expected text not found: ${expected}`);
}

function bracedBlock(source, openingBrace) {
  let depth = 0;
  for (let index = openingBrace; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(openingBrace + 1, index);
    }
  }
  return "";
}

function cssRuleBody(source, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(`${escaped}\\s*\\{`).exec(source);
  return match ? bracedBlock(source, match.index + match[0].length - 1) : "";
}

test("CSS rule helper returns declarations from a direct rule", () => {
  assert.equal(cssRuleBody(".sample { color: red; }", ".sample").trim(), "color: red;");
});

function mediaQueryBody(css, query) {
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(`@media\\s*\\(${escaped}\\)\\s*\\{`).exec(css);
  return match ? bracedBlock(css, match.index + match[0].length - 1) : "";
}

test("media query helper returns its declarations", () => {
  assert.match(
    mediaQueryBody("@media (max-width: 1100px) { .sample { color: red; } }", "max-width: 1100px"),
    /\.sample \{ color: red; \}/,
  );
});

function matchingDivEnd(html, openingIndex) {
  const divTokens = /<\/?div\b[^>]*>/gi;
  divTokens.lastIndex = openingIndex;
  let depth = 0;
  for (let token = divTokens.exec(html); token; token = divTokens.exec(html)) {
    depth += token[0].startsWith("</") ? -1 : 1;
    if (depth === 0) return token.index + token[0].length;
  }
  return -1;
}

function divBlocksByClass(html, className) {
  const openings = new RegExp(`<div\\s+class="${className}">`, "g");
  const blocks = [];
  for (let match = openings.exec(html); match; match = openings.exec(html)) {
    const end = matchingDivEnd(html, match.index);
    if (end !== -1) blocks.push(html.slice(match.index, end));
  }
  return blocks;
}

function decodeRgbaPng(bytes) {
  assert.equal(bytes.toString("ascii", 1, 4), "PNG");
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  assert.equal(bytes[24], 8, "badge PNG must use 8-bit channels");
  assert.equal(bytes[25], 6, "badge PNG must use RGBA pixels");
  const idat = [];
  for (let offset = 8; offset < bytes.length;) {
    const length = bytes.readUInt32BE(offset);
    const type = bytes.toString("ascii", offset + 4, offset + 8);
    if (type === "IDAT") idat.push(bytes.subarray(offset + 8, offset + 8 + length));
    offset += length + 12;
  }
  const compressed = inflateSync(Buffer.concat(idat));
  const stride = width * 4;
  const pixels = Buffer.alloc(stride * height);
  let source = 0;
  for (let row = 0; row < height; row += 1) {
    const filter = compressed[source++];
    const rowOffset = row * stride;
    for (let column = 0; column < stride; column += 1) {
      const raw = compressed[source++];
      const left = column >= 4 ? pixels[rowOffset + column - 4] : 0;
      const above = row > 0 ? pixels[rowOffset - stride + column] : 0;
      const upperLeft = row > 0 && column >= 4 ? pixels[rowOffset - stride + column - 4] : 0;
      let value = raw;
      if (filter === 1) value = raw + left;
      if (filter === 2) value = raw + above;
      if (filter === 3) value = raw + Math.floor((left + above) / 2);
      if (filter === 4) {
        const estimate = left + above - upperLeft;
        const leftDelta = Math.abs(estimate - left);
        const aboveDelta = Math.abs(estimate - above);
        const upperLeftDelta = Math.abs(estimate - upperLeft);
        value = raw + (leftDelta <= aboveDelta && leftDelta <= upperLeftDelta ? left : aboveDelta <= upperLeftDelta ? above : upperLeft);
      }
      pixels[rowOffset + column] = value & 0xff;
    }
  }
  return { width, height, pixels };
}

test("homepage exposes the locked English anchors and canonical metadata", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

  assert.match(html, /<html lang="en">/);
  assert.match(
    html,
    /<meta\s+name="description"\s+content="FLOURISH CULTURE connects visionary brands and global creators through influencer partnerships, data-driven growth, and culture-first localization\."\s*\/>/,
  );
  assert.match(html, /<link rel="canonical" href="https:\/\/www\.flourishculturekol\.com\/" \/>/);
  for (const id of ["services", "talent", "about", "contact"]) {
    assert.match(html, new RegExp(`id="${id}"`));
    const matches = html.match(new RegExp(`id="${id}"`, "g")) ?? [];
    assert.equal(matches.length, 1, `#${id} should appear exactly once`);
  }
  assert.doesNotMatch(html, /20K\+|98%|已记录合作意向/);
});

test("release modules use production-safe JavaScript MIME extensions", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const script = await readFile(new URL("../script.js", import.meta.url), "utf8");
  const buildScript = await readFile(new URL("../scripts/build-release.mjs", import.meta.url), "utf8");
  const deployScript = await readFile(new URL("../deploy-cloud-assistant.sh", import.meta.url), "utf8");

  assert.match(html, /<script type="module" src="script\.js"><\/script>/);
  const contactClient = await readFile(new URL("../contact-form.js", import.meta.url), "utf8");
  assert.match(script, /from "\.\/contact-form\.js"/);
  assert.match(contactClient, /from "\.\/site-core\.js"/);
  assert.doesNotMatch(script, /site-core\.mjs/);
  assert.match(buildScript, /site-core\.js/);
  assert.doesNotMatch(buildScript, /site-core\.mjs/);
  assert.match(deployScript, /site-core\.js/);
  assert.doesNotMatch(deployScript, /site-core\.mjs/);
});

test("release build packages every contact page module and rejects incomplete assets", async () => {
  const buildScript = await readFile(new URL("../scripts/build-release.mjs", import.meta.url), "utf8");
  const deployScript = await readFile(new URL("../deploy-cloud-assistant.sh", import.meta.url), "utf8");

  for (const file of [
    "index.html",
    "privacy.html",
    "styles.css",
    "script.js",
    "contact-form.js",
    "site-core.js",
  ]) {
    assert.match(buildScript, new RegExp(`"${file.replace(".", "\\.")}"`));
  }
  assert.match(buildScript, /for \(const entry of await readdir\(dist\)\)[\s\S]*await rm\(/);
  assert.match(buildScript, /for \(const asset of requiredAssets\)[\s\S]*await stat\(source\)[\s\S]*await cp\(source, target\)/);
  assert.match(
    deployScript,
    /for required in index\.html privacy\.html styles\.css script\.js contact-form\.js site-core\.js assets; do/,
  );
});

test("browser QA locks the system-Chrome automation dependency", async () => {
  const qaScript = await readFile(new URL("../scripts/browser-qa.cjs", import.meta.url), "utf8");
  const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));

  assert.match(qaScript, /require\("playwright-core"\)/);
  assert.equal(packageJson.devDependencies?.["playwright-core"], "1.62.1");
  assert.doesNotMatch(qaScript, /\[data-select-contact-role="creator"\][\s\S]{0,120}waitForTimeout\(300\)/);
  assert.match(qaScript, /waitForFunction\([\s\S]*?#contact[\s\S]*?window\.innerHeight/);
});

test("browser QA records loaded service media before accepting full-bleed frames", async () => {
  const qaScript = await readFile(new URL("../scripts/browser-qa.cjs", import.meta.url), "utf8");

  assert.match(qaScript, /imageComplete:\s*image\?\.complete\s*===\s*true/);
  assert.match(qaScript, /media\.frames\[0\]\?\.imageComplete\s*===\s*true/);
  assert.match(qaScript, /media\.frames\[0\]\?\.objectFit\s*===\s*"cover"/);
  assert.match(qaScript, /layout\.frameFillsMedia/);
});

test("only Service 03 and Our Talent use the two approved new AI assets", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const serviceThree =
    section(html, "services")
      .match(/<article class="service-block(?: service-block-complete-media)? reveal">[\s\S]*?<\/article>/g)
      ?.find((article) => article.includes('<span class="service-number">03</span>')) ?? "";
  const talent = section(html, "talent");

  assert.match(serviceThree, /assets\/service-creative-localization-camera-speaker\.webp/);
  assert.match(talent, /assets\/talent-creator-growth-studio\.webp/);
  assert.doesNotMatch(serviceThree, /hong-kong-culture/);
  assert.doesNotMatch(talent, /about-hk-cross-border-bridge/);

  const approvedAltText = [
    "Creative team planning a campaign as a photographer captures a black speaker on the table",
    "A creator producing content in a professional studio with production equipment and growth insights",
  ];
  for (const alt of approvedAltText) {
    assert.match(html, new RegExp(`alt="${alt}"`));
    assert.doesNotMatch(alt, /our meetup|FLOURISH event|client|partner|FLOURISH|TikTok|Instagram|YouTube/i);
  }

  for (const path of [
    "../assets/service-creative-localization-camera-speaker.webp",
    "../assets/talent-creator-growth-studio.webp",
  ]) {
    const bytes = await readFile(new URL(path, import.meta.url));
    assert.equal(bytes.subarray(0, 4).toString("ascii"), "RIFF");
    assert.equal(bytes.subarray(8, 12).toString("ascii"), "WEBP");
    assert.ok(bytes.length > 70_000, `${path} should be a production-quality image`);
  }
});

test("homepage services use the approved three-block copy", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const services = section(html, "services");
  const text = normalized(services);

  assert.match(services, /class="services-grid"/);
  assert.equal(services.match(/class="service-block(?: service-block-complete-media)? reveal"/g)?.length, 3);
  for (const title of [
    "Global Influencer Marketing",
    "Data-Driven Growth &amp; Performance Insights",
    "Creative Strategy &amp; Localization",
  ]) {
    assertIncludesText(text, title);
  }
  assert.equal(services.match(/The Overview/g)?.length, 3);
  assert.equal(services.match(/What We Do/g)?.length, 3);
  for (const label of [
    "End-to-End Campaign Management:",
    "Cross-Border Optimization:",
    "Culture-First Content Curation:",
  ]) {
    assert.match(services, new RegExp(`<strong>${label.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}</strong>`));
  }
  for (const [platform, icon] of [
    ["TikTok", "ri-tiktok-fill"],
    ["YouTube", "ri-youtube-fill"],
    ["Instagram", "ri-instagram-fill"],
    ["Shorts", "ri-play-circle-fill"],
    ["Reels", "ri-clapperboard-fill"],
  ]) {
    assert.match(services, new RegExp(`class="platform-chip"[\\s\\S]*aria-label="${platform}"[\\s\\S]*${icon}`));
  }
  assert.doesNotMatch(services, /<span>TikTok<\/span>|<span>YouTube<\/span>|<span>Instagram<\/span>|<span>Shorts<\/span>|<span>Reels<\/span>/);
  for (const copy of [
    "We build high-impact partnerships between visionary brands and top-tier creators across TikTok, YouTube, and Instagram. We engineer win-win campaigns that elevate brand authority while driving sustainable monetization for creators.",
    "Going viral shouldn’t be a guessing game. We leverage real-time platform analytics, retention metrics, and audience engagement data to turn one-off viral hits into a predictable, high-performing content flywheel for both brands and creators.",
    "Algorithmic &amp; Retention Audits: Deconstruct video performance line-by-line (retention curves, 3-second hook rates, and CTRs) to optimize content structures for maximum algorithmic push.",
    "E-Commerce &amp; Direct-Response Optimization: Analyze audience purchasing behavior and conversion funnels to refine call-to-actions (CTAs), maximizing both brand sales and creator commissions.",
    "Audience Demographics &amp; Niche Matching: Utilize deep-level audience insights to pair creators with the exact brand categories their followers are most likely to buy from.",
    "We break down cultural barriers by pairing brands with local trendsetters. We empower creators with algorithm coaching, script audits, and native trend insights to produce high-performing UGC.",
    "Localized Trend Jacking: Aligning creator content with fast-moving global social trends, sounds, and native hooks.",
    "Script Audits &amp; UGC Production: Actionable content optimizations and scalable asset creation for long-term brand equity.",
    "Supply Chain &amp; Offline Immersion: Exclusive factory tours and sourcing trips that give creators first-look access to unreleased products.",
  ]) {
    assertIncludesText(text, copy);
  }

  assert.doesNotMatch(html, /paid media|paid growth|Spark Ads|whitelisting/i);
});

test("homepage marks exactly the 14 approved ampersands with the Arial hook", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");
  const marker = '<span class="ampersand">&amp;</span>';
  const approvedContexts = [
    `Trusted by Leading Global Brands ${marker} Innovators`,
    `Certified TikTok Shop TAP ${marker} CAP Partner`,
    `FLOURISH is an officially certified TikTok Shop TAP ${marker} CAP partner across multiple markets`,
    `TikTok Shop multi-market certified TAP ${marker} CAP partner.`,
    `Data-Driven Growth ${marker} Performance Insights`,
    `Algorithmic ${marker} Retention Audits:`,
    `E-Commerce ${marker} Direct-Response Optimization:`,
    `Audience Demographics ${marker} Niche Matching:`,
    `Creative Strategy ${marker} Localization`,
    `Script Audits ${marker} UGC Production:`,
    `Supply Chain ${marker} Offline Immersion:`,
    `Seamless Monetization ${marker} Operations:`,
    `Global Community ${marker} Supply Chain Access:`,
    `The FLOURISH Advantage: Why HK ${marker} Why Us?`,
  ];

  assert.equal(html.split(marker).length - 1, approvedContexts.length);
  assert.equal(html.match(/&amp;/g)?.length, approvedContexts.length);
  for (const context of approvedContexts) assertIncludesText(html, context);
  assert.equal(cssRuleBody(css, ".ampersand").replace(/\s+/g, " ").trim(), "font-family: Arial, Helvetica, sans-serif; font-size: 1em; font-weight: inherit; line-height: inherit;");
});

test("review editable mirrors the matching title ampersand hooks", async () => {
  const html = await readFile(new URL("../review-editable.html", import.meta.url), "utf8");
  const marker = '<span class="ampersand">&amp;</span>';

  assert.equal(html.split(marker).length - 1, 5);
  for (const context of [
    `Trusted by Leading Global Brands ${marker} Innovators`,
    `Certified TikTok Shop TAP ${marker} CAP Partner`,
    `Performance-Driven Growth ${marker} Paid Media`,
    `Creative Strategy ${marker} Localization`,
    `The FLOURISH Advantage: Why HK ${marker} Why Us?`,
  ]) assertIncludesText(html, context);
  assertIncludesText(html, "Primary Social Media Handle &amp; Link");
});

test("homepage talent module uses the approved benefits and unified-form CTA", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const talent = section(html, "talent");
  const text = normalized(talent);

  assert.match(talent, /<img[\s\S]*assets\/talent-creator-growth-studio\.webp[\s\S]*alt="A creator producing content in a professional studio with production equipment and growth insights"/);
  assert.match(talent, /Turn Your Influence into a Global Legacy\./);
  assertIncludesText(text, "FLOURISH CULTURE connects the world’s most talented creators with market-defining global brands. Let's build your digital empire together.");
  assert.match(talent, /Why Creators Partner With Us:/);
  for (const expected of [
    "Direct Access to Top Global Brands: Secure exclusive sponsorships with market leaders and pioneering lifestyle labels, high-tier deal flow.",
    "Seamless Monetization &amp; Operations: We handle negotiation, contract compliance, and on-time payouts, so you can focus 100% on creating.",
    "Data-Backed Creator Growth: Gain actionable script audits, algorithm insights, and cross-platform distribution strategies designed to turn viral moments into sustainable career growth.",
    "Global Community &amp; Supply Chain Access: Join exclusive Creator Masterminds, global offline meetups, and sponsored China factory tours to test unreleased products and create behind-the-scenes content.",
    "Ready to Scale?",
    "Join Our Roster →",
  ]) {
    assertIncludesText(text, expected);
  }
  assert.doesNotMatch(talent, /<form|data-creator-form|Join the Culture|Apply to Join the Roster/);
  assert.match(talent, /<a class="button button-dark" href="#contact" data-select-contact-role="creator">Join Our Roster →<\/a>/);
});

test("talent benefit prose stays in the same flow as its bullet", async () => {
  const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");
  const benefitItem = css.match(/\.creator-benefits li\s*\{[^}]+\}/)?.[0] ?? "";
  const benefitBullet = css.match(/\.creator-benefits li::before\s*\{[^}]+\}/)?.[0] ?? "";

  assert.match(benefitItem, /display:\s*block/);
  assert.match(benefitItem, /padding-left:\s*18px/);
  assert.doesNotMatch(benefitItem, /grid-template-columns/);
  assert.match(benefitBullet, /position:\s*absolute/);
  assert.match(benefitBullet, /left:\s*0/);
});

test("homepage about module uses exact mission and advantage copy with image", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const about = section(html, "about");
  const text = normalized(about);

  assert.match(about, /<img[\s\S]*assets\/hong-kong-harbour\.jpg[\s\S]*alt="Hong Kong Victoria Harbour - the strategic East-West gateway to global markets"/);
  for (const expected of [
    "[Our Mission]",
    "Making Cultural Boundaries Invisible.",
    "At FLOURISH CULTURE, we believe that great brands shouldn't be limited by geography. Our mission is to empower both visionaries and creators to transcend borders, turning cross-cultural stories into meaningful global growth.",
    "[The FLOURISH Advantage: Why HK &amp; Why Us?]",
    "Headquartered in Hong Kong, FLOURISH CULTURE occupies a unique position as the ultimate bridge between East and West.",
    "We possess an intrinsic, deep-rooted understanding of China’s world-class supply chains, e-commerce innovations, and brand aspirations. Simultaneously, we operate with a 100% localized, ground-level execution network across North America, Europe, and beyond. This dual DNA allows us to eliminate cross-border friction entirely, making us the trusted launchpad for creators seeking top-tier sponsorships and brands conquering global markets.",
  ]) {
    assertIncludesText(text, expected);
  }
});

test("homepage has one unified accessible Brand and Creator contact form", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const contact = section(html, "contact");
  const text = normalized(contact);

  assert.match(contact, /<img[\s\S]*assets\/talent-global-creator-network\.png[\s\S]*alt="Visualization of global creator network connections spanning international markets"/);
  for (const expected of [
    "Ready to Scale Your Global Footprint?",
    "Drop us a line. Our team of cross-border marketing strategists will map out your route to global dominance.",
    "Contact FLOURISH CULTURE",
    "I am a…",
    "Brand",
    "Creator",
    "Full Name",
    "Email Address",
    "Company",
    "Budget",
    "$10,000–$30,000",
    "$30,000–$100,000",
    "$100,000+",
    "Not sure yet",
    "Growth Objectives",
    "Social Media Handles",
    "Niche",
    "Main Audience Demographics",
    "Privacy Notice",
    "Send Inquiry",
  ]) {
    assertIncludesText(text, expected);
  }

  assert.equal(html.match(/data-contact-form/g)?.length, 1);
  assert.equal(html.match(/<form\b/g)?.length, 1);
  for (const name of [
    "role",
    "name",
    "email",
    "company",
    "budget",
    "growthObjectives",
    "socialHandles",
    "niche",
    "audienceDemographics",
    "privacyAccepted",
    "website",
  ]) {
    assert.match(contact, new RegExp(`name="${name}"`));
  }
  assert.match(contact, /data-role-fields="brand"/);
  assert.match(contact, /data-role-fields="creator" hidden aria-hidden="true"/);
  assert.match(contact, /<details class="verification-disclosure" data-verification-disclosure hidden>/);
  assert.match(contact, /data-turnstile-slot/);
  assert.match(contact, /data-form-status role="status" aria-live="polite"/);
  assert.doesNotMatch(html, /type="tel"|name="(?:phone|telephone)"/i);
  assert.doesNotMatch(html, /data-creator-form|data-project-form|form[^>]+mailto:/i);
  assert.doesNotMatch(html, /flourishculture@outlook\.com/i);
  const mailtoRecipients = [...html.matchAll(/href="mailto:([^"]+)"/g)].map((match) => match[1]);
  assert.ok(mailtoRecipients.length > 0);
  assert.ok(mailtoRecipients.every((recipient) => recipient === "business@flourish-culture.com"));
});

test("Privacy Notice is original, generic and accurately describes the contact flow", async () => {
  const privacy = await readFile(new URL("../privacy.html", import.meta.url), "utf8");
  const text = normalized(privacy);

  assert.match(privacy, /<title>Privacy Notice \| FLOURISH CULTURE<\/title>/);
  assert.match(privacy, /<link rel="canonical" href="https:\/\/www\.flourishculturekol\.com\/privacy\.html" \/>/);
  assertIncludesText(text, "Effective August 18, 2026");
  for (const heading of [
    "Information We Collect",
    "How We Use Information",
    "Service Providers and Sharing",
    "Cloudflare Turnstile",
    "Retention",
    "International Processing",
    "Security",
    "Your Choices",
    "Changes to This Notice",
    "Contact",
  ]) {
    assertIncludesText(text, heading);
  }
  assertIncludesText(text, "We use Cloudflare Turnstile to distinguish legitimate submissions from automated abuse.");
  assertIncludesText(text, "business@flourish-culture.com");
  assertIncludesText(text, "We do not sell information submitted through this form or use it for advertising analytics.");
  assert.doesNotMatch(
    text,
    /\b(?:Google|Meta|Apple|Example Company|Google Analytics|copied boilerplate)\b/i,
  );
  assert.doesNotMatch(privacy, /(?:30|60|90|180|365) days/i);
});

test("contact client uses Turnstile and same-page JSON submission without mailto navigation", async () => {
  const client = await readFile(new URL("../contact-form.js", import.meta.url), "utf8");
  const script = await readFile(new URL("../script.js", import.meta.url), "utf8");
  const core = await readFile(new URL("../site-core.js", import.meta.url), "utf8");

  assert.match(client, /CONTACT_CONFIG_ENDPOINT/);
  assert.match(client, /CONTACT_SUBMIT_ENDPOINT/);
  assert.match(client, /https:\/\/challenges\.cloudflare\.com\/turnstile\/v0\/api\.js\?render=explicit/);
  assert.match(client, /appearance:\s*"interaction-only"/);
  assert.match(client, /execution:\s*reveal\s*\?\s*"execute"\s*:\s*"render"/);
  assert.match(client, /data-verification-disclosure|verificationDisclosure/);
  assert.match(client, /verificationDisclosure\.hidden\s*=\s*true/);
  assert.match(client, /pendingSubmit/);
  assert.match(client, /action:\s*"contact_submit"/);
  assert.match(client, /"expired-callback"/);
  assert.match(client, /"error-callback"/);
  assert.match(client, /method:\s*"POST"/);
  assert.match(client, /"content-type":\s*"application\/json"/);
  assert.match(client, /body:\s*JSON\.stringify\(payload\)/);
  assert.doesNotMatch(client, /window\.location|win\.location/);
  assert.equal(client.match(/form\.reset\(\)/g)?.length, 1);
  assert.match(
    client,
    /accepted = response\.status === 201 \|\| response\.status === 202;[\s\S]*if \(accepted\) \{[\s\S]*form\.reset\(\)/,
  );

  assert.match(script, /import \{ initContactForm \} from "\.\/contact-form\.js"/);
  assert.match(script, /initContactForm\(\)/);
  assert.doesNotMatch(script, /buildCreatorMailto|buildProjectMailto|window\.location/);
  assert.doesNotMatch(
    core,
    /CREATOR_APPLICATION_EMAIL|PROJECT_INQUIRY_EMAIL|buildCreatorMailto|buildProjectMailto|flourishculture@outlook\.com/,
  );
});

test("review editable mirrors remaining Feishu module copy", async () => {
  const html = await readFile(new URL("../review-editable.html", import.meta.url), "utf8");
  const documentText = normalized(html);

  for (const expected of [
    "Global Influencer Marketing",
    "Performance-Driven Growth &amp; Paid Media",
    "Creative Strategy &amp; Localization",
    "Turn Your Influence into a Global Legacy.",
    "Join the Culture (Application Form)",
    "Making Cultural Boundaries Invisible.",
    "Ready to Scale Your Global Footprint?",
    "Book a Strategy Call",
  ]) {
    assertIncludesText(documentText, expected);
  }

  assert.match(html, /assets\/talent-global-creator-network\.png/);
  assert.match(html, /assets\/about-hk-cross-border-bridge\.png/);
  assert.match(html, /class="platform-chip"[\s\S]*aria-label="TikTok"[\s\S]*ri-tiktok-fill/);
  assert.match(html, /class="platform-chip"[\s\S]*aria-label="Shorts"[\s\S]*ri-play-circle-fill/);
});

test("header and footer use the shared transparent FLOURISH lockup", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const header = html.match(/<header class="site-header"[\s\S]*?<\/header>/)?.[0] ?? "";
  const footer = html.match(/<footer class="site-footer">[\s\S]*?<\/footer>/)?.[0] ?? "";

  assert.ok(header, "site header should exist");
  assert.ok(footer, "site footer should exist");
  assert.match(header, /class="wordmark wordmark-lockup"/);
  assert.match(header, /src="assets\/flourish-logo-lockup\.png"/);
  assert.match(header, /alt="FLOURISH CULTURE — Global Creator Growth"/);
  assert.match(footer, /class="wordmark wordmark-lockup wordmark-footer"/);
  assert.match(footer, /src="assets\/flourish-logo-lockup\.png"/);
  assert.doesNotMatch(`${header}\n${footer}`, /flourish-logo-reference\.png/);

  for (const label of ["Services", "Our Talent", "About Us", "Contact Us"]) {
    assert.match(header, new RegExp(`>${label}<`));
  }
  assert.match(header, /<a class="nav-cta" href="#contact">\s*Contact Us\s*<\/a>/);
  assert.doesNotMatch(header, />Talent<|>About<|>Contact<|Start a Project/);
});

test("styles enlarge desktop navigation and preserve contact CTA emphasis", async () => {
  const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");

  assert.match(css, /\.site-nav\s*{[\s\S]*gap:\s*clamp\(34px,\s*4vw,\s*64px\)/);
  assert.match(css, /\.site-nav\s*{[\s\S]*font-size:\s*15px/);
  assert.match(css, /\.nav-cta\s*{[\s\S]*min-height:\s*48px/);
  assert.match(css, /\.nav-cta\s*{[\s\S]*padding:\s*0 24px/);
  assert.match(css, /\.nav-cta\s*{[\s\S]*font-size:\s*15px/);
});

test("styles preserve social-first polish without changing locked content", async () => {
  const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");

  assert.match(css, /--card-surface:\s*#131210/);
  assert.match(css, /--card-line-dark:\s*rgba\(250,\s*249,\s*247,\s*0\.08\)/);
  assert.match(css, /\.platform-chip\s*{[\s\S]*width:\s*clamp\(36px,\s*3\.2vw,\s*46px\)/);
  assert.match(css, /\.platform-chip:is\(:hover,\s*:focus-visible\)\s*{[\s\S]*background:\s*var\(--coral\)/);
  assert.match(css, /\.service-detail\s*{[\s\S]*grid-template-columns:\s*clamp\(128px,\s*13vw,\s*178px\) minmax\(0,\s*1fr\)/);
  assert.match(css, /--type-label:\s*clamp\(11px,\s*0\.78vw,\s*12px\)/);
  assert.match(css, /--type-body:\s*clamp\(14px,\s*1\.1vw,\s*17px\)/);
  assert.match(css, /\.service-kicker\s*{[\s\S]*font-size:\s*var\(--type-label\)/);
  assert.match(css, /\.service-detail > p:not\(.service-kicker\),[\s\S]*\.service-copy li\s*{[\s\S]*font-size:\s*var\(--type-body\)/);
  assert.match(css, /\.service-copy li strong\s*{[\s\S]*font-weight:\s*750/);
  assert.match(css, /\.bridge-card picture\s*{[\s\S]*aspect-ratio:\s*16 \/ 9[\s\S]*overflow:\s*hidden/);
  assert.match(css, /\.bridge-card img\s*{[\s\S]*height:\s*100%[\s\S]*object-fit:\s*cover/);
  assert.match(css, /\.bridge-card-copy h3\s*{[\s\S]*min-height:\s*2\.1em/);
  assert.match(css, /@media \(min-width:\s*1101px\)[\s\S]*\.bridge-card-copy h3\s*{[\s\S]*white-space:\s*nowrap/);
  assert.match(css, /\.role-fields\[data-role-fields="creator"\] > label:not\(\.field-wide\) > input,[\s\S]*min-height:\s*118px/);
  assert.match(css, /\.service-detail \+ \.service-detail\s*{[\s\S]*border-top-color:\s*var\(--line-dark\)/);
  assert.match(css, /--split-media-width:\s*clamp\(300px,\s*44vw,\s*880px\)/);
  assert.match(css, /\.talent\s*{[\s\S]*grid-template-columns:\s*var\(--split-media-width\) minmax\(0,\s*1fr\)/);
  assert.match(css, /\.talent-media img\s*{[\s\S]*object-position:\s*50% 30%/);
  assert.match(css, /\.talent-media img\s*{[\s\S]*filter:\s*saturate\(0\.95\) contrast\(1\.04\) brightness\(0\.96\)/);
  assert.match(css, /\.creator-benefits li\s*{[\s\S]*display:\s*grid/);
  assert.match(css, /\.about\s*{[\s\S]*grid-template-columns:\s*var\(--split-media-width\) minmax\(0,\s*1fr\)[\s\S]*column-gap:\s*clamp\(36px,\s*5vw,\s*92px\)/);
  assert.match(css, /\.about-media\s*{[\s\S]*min-height:\s*clamp\(580px,\s*48vw,\s*660px\)/);
  assert.match(css, /\.about-media img\s*{[\s\S]*object-position:\s*54% center/);
  assert.match(css, /\.about-media img\s*{[\s\S]*filter:\s*saturate\(0\.9\) contrast\(1\.04\) brightness\(0\.88\)/);
  assert.match(css, /\.contact-copy img\s*{[\s\S]*aspect-ratio:\s*16 \/ 10/);
});

test("new contact and privacy styles extend the existing visual system accessibly", async () => {
  const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");

  for (const token of ["--coral", "--paper", "--ink", "--line-light"]) {
    assert.match(css, new RegExp(`var\\(${token}\\)`));
  }
  const talentCta = css.match(/\.talent-cta\s*\{[^}]+\}/)?.[0] ?? "";
  assert.match(talentCta, /display:\s*flex/);
  assert.doesNotMatch(talentCta, /background|backdrop-filter|box-shadow|border-radius/);
  assert.match(css, /\.role-fields\[hidden\]\s*\{\s*display:\s*none/);
  assert.match(css, /\.privacy-consent\s*\{[\s\S]*grid-template-columns:\s*24px minmax\(0, 1fr\)/);
  assert.match(css, /\.privacy-consent input\s*\{[\s\S]*width:\s*24px;[\s\S]*min-height:\s*24px/);
  const honeypot = css.match(/\.honeypot-field\s*\{[^}]+\}/)?.[0] ?? "";
  assert.match(honeypot, /left:\s*-10000px/);
  assert.doesNotMatch(honeypot, /display:\s*none/);
  assert.match(css, /\.form-status\s*\{[\s\S]*min-height:\s*1\.5em/);
  assert.match(css, /\.form-status\[data-state="success"\]/);
  assert.match(css, /\.form-status\[data-state="error"\]/);
  assert.match(css, /\.verification-disclosure\s*{[\s\S]*border-radius:\s*3px/);
  assert.match(css, /\.verification-disclosure\[hidden\]\s*{\s*display:\s*none/);
  assert.match(css, /\.verification-disclosure summary\s*{[\s\S]*cursor:\s*pointer/);
  assert.match(css, /\.verification-disclosure\[open\] summary::before/);
  assert.match(css, /\.privacy-main\s*\{[\s\S]*background:\s*var\(--black\)/);
  assert.match(css, /\.privacy-article\s*\{[\s\S]*width:\s*min\(100%, 760px\)/);
  assert.match(css, /@media \(max-width:\s*560px\)[\s\S]*\.project-form \.button\s*\{[\s\S]*width:\s*100%/);
  assert.doesNotMatch(css, /\.creator-form/);
});

test("annotated hero removes the old eyebrow and secondary controls", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");
  const hero = html.match(/<section class="hero" id="top">[\s\S]*?<\/section>/)?.[0] ?? "";

  assert.ok(hero, "hero section should exist");
  assert.match(
    hero,
    /Based in Hong Kong,\s+FLOURISH CULTURE bridges the world's most innovative\s+brands with global audiences through data-driven influencer marketing and\s+viral creative strategies\./,
  );
  assert.doesNotMatch(hero, /class="eyebrow"|Global influencer marketing from Hong Kong|Explore our services|text-link|ri-arrow-down-line/);
  assert.match(css, /h1\s*{[\s\S]*font-size:\s*clamp\(60px,\s*6vw,\s*96px\)/);
  assert.match(css, /\.hero-intro\s*{[\s\S]*font-size:\s*var\(--type-lead\)/);
  assert.match(css, /\.button\s*{[\s\S]*min-height:\s*52px/);
  assert.match(css, /\.button\s*{[\s\S]*font-size:\s*14px/);
});

test("annotated hero media uses three cohesive brand story cards", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const hero = html.match(/<section class="hero" id="top">[\s\S]*?<\/section>/)?.[0] ?? "";
  const cardMatches = hero.match(/class="hero-card/g) ?? [];

  assert.equal(cardMatches.length, 3);
  for (const src of ["assets/17bcea7b-424b-4593-9f31-697e7cbecd7d.jpeg", "assets/service-performance.jpg", "assets/fe872db7-ca7c-4423-9f5c-9dc109e60619.jpeg"]) {
    assert.match(hero, new RegExp(`src="${src}"`));
  }
  assert.match(hero, /Brand Partnership Hub/);
  assert.match(hero, /Global Talent Network/);
  assert.match(hero, /Data-Driven Growth/);
  assert.doesNotMatch(hero, /Live commerce experience/);
  assert.doesNotMatch(hero, /class="hero-live-interface"/);
  assert.doesNotMatch(hero, /src="assets\/service-influencer\.jpg"/);
  assert.doesNotMatch(hero, /src="assets\/creator-recruitment\.jpg"/);
});

test("source reconciliation preserves image dimensions and loading priorities", async () => {
  for (const filename of ["index.html", "review-editable.html"]) {
    const html = await readFile(new URL(`../${filename}`, import.meta.url), "utf8");
    const hero = html.match(/<section class="hero" id="top">[\s\S]*?<\/section>/)?.[0] ?? "";
    const heroImages = hero.match(/<img\b[\s\S]*?\/>/g) ?? [];
    const logoImages = html.match(/<img\b[^>]*src="assets\/brand-logos\/[^>]*\/>/g) ?? [];

    assert.equal(heroImages.length, 3, `${filename} should retain three hero images`);
    for (const image of heroImages) {
      assert.match(image, /\bwidth="\d+"/);
      assert.match(image, /\bheight="\d+"/);
      assert.match(image, /\bloading="eager"/);
    }
    assert.match(heroImages[0], /\bfetchpriority="high"/);

    assert.equal(logoImages.length, 9, `${filename} should retain one accessible logo source set`);
    for (const image of logoImages) {
      assert.match(image, /\bwidth="\d+"/);
      assert.match(image, /\bheight="\d+"/);
      assert.match(image, /\bloading="lazy"/);
      assert.match(image, /\bdecoding="async"/);
    }
  }
});

test("review editable mirrors the production header and hero card structure", async () => {
  const html = await readFile(new URL("../review-editable.html", import.meta.url), "utf8");
  const header = html.match(/<header class="site-header"[\s\S]*?<\/header>/)?.[0] ?? "";
  const hero = html.match(/<section class="hero" id="top">[\s\S]*?<\/section>/)?.[0] ?? "";

  assert.match(header, /class="wordmark wordmark-lockup"/);
  assert.match(hero, /fe872db7-ca7c-4423-9f5c-9dc109e60619\.jpeg/);
  assert.doesNotMatch(`${header}\n${hero}`, /flourish-logo-reference\.png|src="assets\/creator-recruitment\.jpg"/);
});

test("styles include reduced-motion behavior and visible focus treatment", async () => {
  const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");

  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /:focus-visible/);
});

test("whiteboard 3 bridge section uses centered Who We Are double cards", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");
  const bridge = html.match(/<section class="bridge"[\s\S]*?<\/section>/)?.[0] ?? "";

  assert.match(bridge, /<h2 id="bridge-heading">Who We Are<\/h2>/);
  assert.match(bridge, /class="bridge-card-grid"/);
  assert.equal(bridge.match(/class="bridge-card reveal"/g)?.length, 2);
  assert.match(bridge, /From HK to the World/);
  assert.match(bridge, /The East-to-West Cross-Border Experts/);
  assertIncludesText(
    normalized(bridge),
    "Headquartered in Hong Kong, we leverage the city’s unique status as a global hub to seamlessly connect East Asian innovation with international audiences. We provide creators with direct access to high-budget global sponsors and cross-cultural growth strategies.",
  );
  assertIncludesText(
    normalized(bridge),
    "Deeply rooted in China’s dynamic supply chains and brand ecosystems, paired with 100% localized global execution, we translate brand brilliance into cross-border viral success.",
  );
  assert.match(bridge, /assets\/hong-kong-harbour\.jpg/);
  assert.match(bridge, /assets\/service-localization\.jpg/);
  assert.doesNotMatch(bridge, /From Hong Kong<br \/>to the World|class="eyebrow eyebrow-dark"/);
  assert.match(css, /\.bridge-heading\s*{[\s\S]*text-align:\s*center/);
  assert.match(css, /\.bridge-heading h2\s*{[\s\S]*font-size:\s*clamp\(26px,\s*3vw,\s*42px\)/);
  assert.match(css, /\.bridge-card-grid\s*{[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(css, /\.bridge-card\s*{[\s\S]*background:/);
  assert.match(css, /@media \(min-width: 1101px\)/);
  assert.match(css, /--desktop-section-scale:/);
});

test("logo rail autoscrolls the approved nine-logo source set accessibly", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");
  const logoStrip = html.match(/<section class="logo-strip"[\s\S]*?<\/section>/)?.[0] ?? "";

  assert.match(logoStrip, /<h2 id="trusted-heading">Trusted by Leading Global Brands <span class="ampersand">&amp;<\/span> Innovators<\/h2>/);
  assert.match(logoStrip, /class="brand-logo-viewport"/);
  assert.match(logoStrip, /class="brand-logo-track"/);
  assert.match(logoStrip, /data-brand-logo-set/);
  for (const asset of ["tripo-transparent-cropped.png", "temu.png", "anker.png", "usmile.png", "dreame.png", "aliexpress.png", "lovart.png", "atoms-transparent.png", "ksp.png"]) {
    assert.match(logoStrip, new RegExp(`assets/brand-logos/${asset.replace(".", "\\.")}`));
  }
  assert.doesNotMatch(logoStrip, /assets\/brand-logos\/aiper\.png/);
  assert.equal(logoStrip.match(/<img /g)?.length, 9);
  assert.match(css, /@keyframes logo-scroll/);
  assert.match(css, /\.hero::before\s*{[\s\S]*radial-gradient\(ellipse at 20% 30%/);
  assert.match(css, /\.logo-strip\s*{[\s\S]*padding:\s*clamp\(80px,\s*8\.5vw,\s*120px\) 0 clamp\(56px,\s*5\.5vw,\s*78px\)/);
  assert.match(css, /\.logo-strip h2\s*{[\s\S]*font-size:\s*clamp\(26px,\s*3vw,\s*42px\)/);
  assert.match(css, /\.brand-logo-track\.is-ready\s*{[\s\S]*animation:\s*logo-scroll/);
  assert.match(css, /@media \(prefers-reduced-motion:\s*reduce\)[\s\S]*\.brand-logo-track\s*{[\s\S]*animation:\s*none/);
  assert.match(css, /\.brand-logo-viewport\s*{[\s\S]*overflow:\s*hidden/);
});

test("review editable mirrors whiteboard 3 logo rail and bridge structure", async () => {
  const html = await readFile(new URL("../review-editable.html", import.meta.url), "utf8");
  const logoStrip = html.match(/<section class="logo-strip"[\s\S]*?<\/section>/)?.[0] ?? "";
  const bridge = html.match(/<section class="bridge"[\s\S]*?<\/section>/)?.[0] ?? "";

  assert.match(logoStrip, /class="brand-logo-track"/);
  assert.match(bridge, /<h2 id="bridge-heading">Who We Are<\/h2>/);
  assert.equal(bridge.match(/class="bridge-card reveal"/g)?.length, 2);
});

test("review editable page exists as a safe annotated editing copy", async () => {
  const html = await readFile(new URL("../review-editable.html", import.meta.url), "utf8");

  assert.match(html, /<title>FLOURISH CULTURE — Editable Review Copy<\/title>/);
  assert.match(html, /data-review-copy="true"/);
  assert.match(html, /EDITABLE REVIEW COPY/);
  assert.match(html, /href="styles\.css"/);
  assert.match(html, /src="script\.js"/);

  for (const marker of [
    "REVIEW SECTION: Navigation",
    "REVIEW SECTION: Hero",
    "REVIEW SECTION: Logo Rail",
    "REVIEW SECTION: Hong Kong Bridge",
    "REVIEW SECTION: Services",
    "REVIEW SECTION: Creator Recruitment",
    "REVIEW SECTION: Mission/About",
    "REVIEW SECTION: Project Contact",
    "REVIEW SECTION: Footer",
  ]) {
    assert.match(html, new RegExp(marker));
  }
});

test("shared Canva-sourced FLOURISH lockup and mark are used across public and review pages", async () => {
  for (const filename of ["index.html", "privacy.html", "review-editable.html"]) {
    const html = await readFile(new URL(`../${filename}`, import.meta.url), "utf8");
    assert.match(html, /rel="icon"[^>]*href="assets\/flourish-mark\.png"/);
    assert.match(html, /src="assets\/flourish-logo-lockup\.png"/);
  }

  for (const asset of [
    "flourish-logo-lockup.png",
    "flourish-mark.png",
    "brand-logos/usmile.png",
    "partner-badges/tiktok-shop-tap.png",
    "partner-badges/tiktok-shop-cap.png",
  ]) {
    await stat(new URL(`../assets/${asset}`, import.meta.url));
  }
});

test("homepage presents complete Hero media and the approved partner proof sequence", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");
  const script = await readFile(new URL("../script.js", import.meta.url), "utf8");
  const hero = html.match(/<figure class="hero-media[\s\S]*?<\/figure>/)?.[0] ?? "";
  const rail = html.match(/<section class="logo-strip"[\s\S]*?<\/section>/)?.[0] ?? "";

  assert.match(hero, /hero-card-landscape/);
  assert.match(hero, /hero-card-portrait/);
  assert.match(css, /\.hero-media\s*{[\s\S]*grid-template-areas:/);
  assert.match(css, /\.hero-card img\s*{[\s\S]*object-fit:\s*contain/);
  assert.match(rail, /data-brand-logo-set/);
  assert.deepEqual(
    [...rail.matchAll(/assets\/brand-logos\/([^"\s]+)/g)].map((match) => match[1]),
    [
      "tripo-transparent-cropped.png",
      "temu.png",
      "anker.png",
      "usmile.png",
      "dreame.png",
      "aliexpress.png",
      "lovart.png",
      "atoms-transparent.png",
      "ksp.png",
    ],
  );
  assert.match(script, /cloneBrandLogoSet/);
  assert.match(html, /<section class="official-partners"/);
  assert.ok(html.indexOf('class="bridge"') < html.indexOf('class="official-partners"'));
  assert.ok(html.indexOf('class="official-partners"') < html.indexOf('class="services"'));
});

test("official partner badges retain full source bounds and the header logo has breathing room", async () => {
  const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");

  for (const [filename, minimumWidth] of [["tiktok-shop-tap.png", 340], ["tiktok-shop-cap.png", 320]]) {
    const bytes = await readFile(new URL(`../assets/partner-badges/${filename}`, import.meta.url));
    assert.equal(bytes.toString("ascii", 1, 4), "PNG");
    assert.ok(bytes.readUInt32BE(16) >= minimumWidth, `${filename} must retain a complete horizontal badge boundary`);
  }

  assert.match(css, /\.official-partner-badges\s*{[\s\S]*padding:\s*clamp\(18px,\s*2vw,\s*30px\)/);
  assert.match(css, /\.official-partner-badges img\s*{[\s\S]*width:\s*min\(40%,\s*164px\)/);
  assert.match(css, /\.wordmark-lockup img\s*{[\s\S]*width:\s*clamp\(132px,\s*11vw,\s*164px\)/);
});

test("Service media fills equal desktop columns while partner proof retains a clean transparent exterior", async () => {
  const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");

  for (const asset of ["tiktok-shop-tap.png", "tiktok-shop-cap.png"]) {
    const { width, height, pixels } = decodeRgbaPng(await readFile(new URL(`../assets/partner-badges/${asset}`, import.meta.url)));
    for (let x = 0; x < 8; x += 1) {
      for (let y = 0; y < height; y += 1) {
        assert.equal(pixels[(y * width + x) * 4 + 3], 0, `${asset} left exterior must be transparent`);
        assert.equal(pixels[(y * width + (width - 1 - x)) * 4 + 3], 0, `${asset} right exterior must be transparent`);
      }
    }
  }

  for (const filename of ["index.html", "review-editable.html"]) {
    const html = await readFile(new URL(`../${filename}`, import.meta.url), "utf8");
    const services = section(html, "services");
    const mediaBlocks = divBlocksByClass(services, "service-media");

    assert.equal(mediaBlocks.length, 3, `${filename} should retain three service media blocks`);
    for (const [index, media] of mediaBlocks.entries()) {
      const frames = [...media.matchAll(/<picture class="service-media-frame">([\s\S]*?)<\/picture>/g)];
      assert.equal(
        frames.length,
        1,
        `${filename} service media block ${index + 1} should contain one frame`,
      );
      assert.equal(
        media.match(/<img\b/g)?.length ?? 0,
        1,
        `${filename} service media block ${index + 1} should contain exactly one image`,
      );
      assert.equal(
        frames[0]?.[1].match(/<img\b/g)?.length ?? 0,
        1,
        `${filename} service media block ${index + 1} unique image should be inside its frame`,
      );
    }
    assert.equal(
      html.match(/class="service-media-frame"/g)?.length,
      3,
      `${filename} should provide exactly three uniform service media frames`,
    );
  }

  assert.match(css, /\.wordmark-lockup img\s*{[\s\S]*width:\s*clamp\(132px,\s*11vw,\s*164px\)/);
  const equalColumns = /grid-template-columns:\s*minmax\(0,\s*1fr\) minmax\(0,\s*1fr\)/;
  const desktopServiceBlock = cssRuleBody(css, ".service-block");
  const tabletServiceBlock = cssRuleBody(mediaQueryBody(css, "max-width: 1100px"), ".service-block");
  const mobileServiceLayout = mediaQueryBody(css, "max-width: 820px");
  assert.match(desktopServiceBlock, equalColumns);
  assert.match(tabletServiceBlock, equalColumns);
  assert.match(
    mobileServiceLayout,
    /\.service-block,\s*\.about,\s*\.contact-layout\s*\{[\s\S]*grid-template-columns:\s*1fr/,
  );
  assert.match(css, /\.service-media \.service-media-frame\s*{[\s\S]*display:\s*block[\s\S]*height:\s*100%/);
  assert.match(css, /\.service-media-frame img\s*{[\s\S]*object-fit:\s*cover/);
  assert.match(
    css,
    /\.service-media-frame img\[src\*="creator-recruitment"\]\s*{[\s\S]*object-position:\s*20% center/,
  );
  assert.match(
    css,
    /\.service-media-frame img\[src\*="service-creative-localization-camera-speaker"\]\s*{[\s\S]*object-position:\s*65% center/,
  );
  assert.match(
    mobileServiceLayout,
    /\.service-media \.service-media-frame\s*{[\s\S]*height:\s*auto[\s\S]*aspect-ratio:\s*16 \/ 10/,
  );
  const serviceHeadingRules = [...css.matchAll(/\.service-copy h3\s*\{([^}]*)\}/g)].map((match) => match[1]);
  assert.ok(serviceHeadingRules.length > 0, "service heading rules should exist");
  assert.ok(
    serviceHeadingRules.some((rule) => /overflow-wrap:\s*anywhere/.test(rule) && /white-space:\s*normal/.test(rule)),
    "service headings should explicitly allow emergency wrapping",
  );
  for (const rule of serviceHeadingRules) {
    assert.doesNotMatch(rule, /white-space:\s*nowrap/);
  }
  const serviceHoverRules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter(([, selector]) => /:hover/.test(selector)
      && /(?:\.service-block|\.service-media(?:-frame)?)/.test(selector));
  for (const [, selector, declarations] of serviceHoverRules) {
    assert.doesNotMatch(
      declarations,
      /transform:\s*[^;{}]*\bscale(?:[a-z0-9]+)?\s*\(/i,
      `Service hover selector must not crop through scale: ${selector.trim()}`,
    );
    assert.doesNotMatch(
      declarations,
      /(?:^|[;\n])\s*scale\s*:/,
      `Service hover selector must not use the independent scale property: ${selector.trim()}`,
    );
  }
});
