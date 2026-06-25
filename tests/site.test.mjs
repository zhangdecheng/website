import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  CREATOR_APPLICATION_EMAIL,
  PROJECT_INQUIRY_EMAIL,
  buildCreatorMailto,
  buildProjectMailto,
  isValidEmail,
  isValidHttpUrl,
} from "../site-core.js";

function section(html, className) {
  return html.match(new RegExp(`<section class="${className}"[\\s\\S]*?<\\/section>`))?.[0] ?? "";
}

function normalized(value) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function assertIncludesText(source, expected) {
  assert.ok(source.includes(expected), `Expected text not found: ${expected}`);
}

test("creator mailto targets the approved inbox and includes every field", () => {
  const href = buildCreatorMailto({
    name: "Maya Chen",
    email: "maya@example.com",
    social: "https://instagram.com/maya",
    region: "North America",
  });

  assert.equal(CREATOR_APPLICATION_EMAIL, "irisa@flourishculture.com");
  assert.match(href, /^mailto:irisa@flourishculture\.com\?/);
  assert.match(decodeURIComponent(href), /Creator Application — Maya Chen/);
  assert.match(decodeURIComponent(href), /maya@example\.com/);
  assert.match(decodeURIComponent(href), /https:\/\/instagram\.com\/maya/);
  assert.match(decodeURIComponent(href), /North America/);
});

test("project mailto falls back to the contact name when company is empty", () => {
  const href = buildProjectMailto({
    identity: "Creator looking for representation",
    name: "Alex Rivera",
    company: "",
    email: "alex@example.com",
    budget: "$10,000 - $30,000",
    goal: "Build an international creator launch plan.",
  });

  assert.equal(PROJECT_INQUIRY_EMAIL, "flourishculture@outlook.com");
  assert.match(href, /^mailto:flourishculture@outlook\.com\?/);
  assert.match(decodeURIComponent(href), /Project Inquiry — Alex Rivera/);
  assert.match(decodeURIComponent(href), /Identity: Creator looking for representation/);
  assert.match(decodeURIComponent(href), /Budget: \$10,000 - \$30,000/);
  assert.match(decodeURIComponent(href), /Build an international creator launch plan/);
});

test("email and social link validators reject malformed values", () => {
  assert.equal(isValidEmail("hello@example.com"), true);
  assert.equal(isValidEmail("not-an-email"), false);
  assert.equal(isValidHttpUrl("https://tiktok.com/@creator"), true);
  assert.equal(isValidHttpUrl("ftp://example.com"), false);
  assert.equal(isValidHttpUrl("example.com/profile"), false);
});

test("homepage exposes the locked English anchors and both form interfaces", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

  assert.match(html, /<html lang="en">/);
  for (const id of ["services", "talent", "about", "contact"]) {
    assert.match(html, new RegExp(`id="${id}"`));
    const matches = html.match(new RegExp(`id="${id}"`, "g")) ?? [];
    assert.equal(matches.length, 1, `#${id} should appear exactly once`);
  }
  for (const name of [
    "creator-name",
    "creator-email",
    "creator-social",
    "creator-region",
    "project-identity",
    "project-name",
    "project-company",
    "project-email",
    "project-budget",
    "project-goal",
  ]) {
    assert.match(html, new RegExp(`name="${name}"`));
  }
  assert.doesNotMatch(html, /20K\+|98%|已记录合作意向/);
});

test("release modules use production-safe JavaScript MIME extensions", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const script = await readFile(new URL("../script.js", import.meta.url), "utf8");
  const buildScript = await readFile(new URL("../scripts/build-release.mjs", import.meta.url), "utf8");
  const deployScript = await readFile(new URL("../deploy-cloud-assistant.sh", import.meta.url), "utf8");

  assert.match(html, /<script type="module" src="script\.js"><\/script>/);
  assert.match(script, /from "\.\/site-core\.js"/);
  assert.doesNotMatch(script, /site-core\.mjs/);
  assert.match(buildScript, /site-core\.js/);
  assert.doesNotMatch(buildScript, /site-core\.mjs/);
  assert.match(deployScript, /site-core\.js/);
  assert.doesNotMatch(deployScript, /site-core\.mjs/);
});

test("homepage services use exact Feishu three-block structure", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const services = section(html, "services");
  const text = normalized(services);

  assert.match(services, /class="services-grid"/);
  assert.equal(services.match(/class="service-block reveal"/g)?.length, 3);
  for (const title of [
    "Global Influencer Marketing",
    "Performance-Driven Growth &amp; Paid Media",
    "Creative Strategy &amp; Localization",
  ]) {
    assert.match(services, new RegExp(title));
  }
  assert.equal(services.match(/The Overview/g)?.length, 3);
  assert.equal(services.match(/What We Do/g)?.length, 3);
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
    "We engineer full-funnel influencer campaigns across TikTok, YouTube, Instagram, Shorts, and Reels.",
    "Organic reach is just the beginning.",
    "To conquer global markets, you need to speak the local language of social media.",
    "End-to-End Campaign Management: Talent scouting, contract negotiation, compliance, and localized creative briefing.",
    "Creator Whitelisting &amp; Spark Ads: We gain secure access to creator profiles to run high-converting ad variants directly through their handles.",
    "UGC (User Generated Content) Production: Generating an endless library of high-quality, authentic content assets for your brand's long-term marketing channels.",
  ]) {
    assertIncludesText(text, copy);
  }
});

test("homepage talent module uses exact creator copy and form labels", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const talent = section(html, "talent");
  const text = normalized(talent);

  assert.match(talent, /<img[\s\S]*assets\/about-hk-cross-border-bridge\.png[\s\S]*alt="Global creator network bridging East and West through cultural content collaboration"/);
  assert.match(talent, /Turn Your Influence into a Global Legacy\./);
  assertIncludesText(text, "FLOURISH CULTURE connects the world’s most talented creators with market-defining global brands. Let's build your digital empire together.");
  assert.match(talent, /Why Creators Partner With Us:/);
  for (const expected of [
    "Direct Access to Iconic Brands: Get exclusive sponsorship opportunities with hyper-growth global giants like Temu and pioneering lifestyle brands like Innerbrightness.",
    "Global Monetization: Our dedicated management team handles the business side—negotiating top-tier rates, securing long-term contracts, and ensuring timely payments.",
    "Strategic Career Growth: We provide algorithmic insights, content audits, and cross-platform strategies to help you expand your audience globally.",
    "Join the Culture (Application Form)",
    "Full Name",
    "Email Address",
    "Primary Social Media Handle &amp; Link",
    "Main Audience Demographics (US, UK, Europe, etc.)",
    "Apply to Join the Roster",
  ]) {
    assertIncludesText(text, expected);
  }
});

test("homepage about module uses exact mission and advantage copy with image", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const about = section(html, "about");
  const text = normalized(about);

  assert.match(about, /<img[\s\S]*assets\/hong-kong-harbour\.jpg[\s\S]*alt="Hong Kong Victoria Harbour - the strategic East-West gateway to global markets"/);
  for (const expected of [
    "[Our Mission]",
    "Making Cultural Boundaries Invisible.",
    "At FLOURISH CULTURE, we believe that great brands shouldn't be limited by geography. Our mission is to empower visionaries to transcend borders, helping them not just market, but truly flourish in global digital soil.",
    "[The FLOURISH Advantage: Why HK &amp; Why Us?]",
    "Headquartered in Hong Kong, FLOURISH CULTURE occupies a unique position as the ultimate bridge between East and West.",
    "We possess an intrinsic, deep-rooted understanding of China’s world-class supply chains, e-commerce innovations, and brand aspirations.",
  ]) {
    assertIncludesText(text, expected);
  }
});

test("homepage contact module uses exact inquiry copy, fields, options and image", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const contact = section(html, "contact");
  const text = normalized(contact);

  assert.match(contact, /<img[\s\S]*assets\/talent-global-creator-network\.png[\s\S]*alt="Visualization of global creator network connections spanning international markets"/);
  for (const expected of [
    "Ready to Scale Your Global Footprint?",
    "Drop us a line. Our team of cross-border marketing strategists will map out your route to global dominance.",
    "Project Inquiry Form",
    "I am a\.\.\.",
    "Brand looking for growth",
    "Creator looking for representation",
    "Name &amp; Job Title",
    "Company Name &amp; Website URL",
    "Email Address",
    "Estimated Monthly Marketing Budget",
    "$10,000 - $30,000",
    "$30,000 - $100,000",
    "$100,000+",
    "Tell us about your global goals...",
    "Book a Strategy Call",
  ]) {
    assertIncludesText(text, expected);
  }
});

test("review editable mirrors remaining Feishu module copy", async () => {
  const html = await readFile(new URL("../review-editable.html", import.meta.url), "utf8");

  for (const text of [
    "Global Influencer Marketing",
    "Performance-Driven Growth &amp; Paid Media",
    "Creative Strategy &amp; Localization",
    "Turn Your Influence into a Global Legacy.",
    "Join the Culture (Application Form)",
    "Making Cultural Boundaries Invisible.",
    "Ready to Scale Your Global Footprint?",
    "Book a Strategy Call",
  ]) {
    assertIncludesText(html, text);
  }

  assert.match(html, /assets\/talent-global-creator-network\.png/);
  assert.match(html, /assets\/about-hk-cross-border-bridge\.png/);
  assert.match(html, /class="platform-chip"[\s\S]*aria-label="TikTok"[\s\S]*ri-tiktok-fill/);
  assert.match(html, /class="platform-chip"[\s\S]*aria-label="Shorts"[\s\S]*ri-play-circle-fill/);
});

test("annotated header and footer use dark-adapted HTML logo lockups", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const header = html.match(/<header class="site-header"[\s\S]*?<\/header>/)?.[0] ?? "";
  const footer = html.match(/<footer class="site-footer">[\s\S]*?<\/footer>/)?.[0] ?? "";

  assert.ok(header, "site header should exist");
  assert.ok(footer, "site footer should exist");
  assert.match(header, /class="wordmark wordmark-lockup"/);
  assert.match(header, /class="wordmark-mark"/);
  assert.match(header, /FLOURISH CULTURE/);
  assert.match(header, /GLOBAL CREATOR GROWTH/);
  assert.match(footer, /class="wordmark wordmark-lockup wordmark-footer"/);
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
  assert.match(css, /\.service-block\s*{[\s\S]*grid-template-columns:\s*minmax\(280px,\s*0\.65fr\) minmax\(0,\s*1\.35fr\)/);
  assert.match(css, /\.service-media img\s*{[\s\S]*min-height:\s*clamp\(340px,\s*33vw,\s*420px\)/);
  assert.match(css, /\.service-detail \+ \.service-detail\s*{[\s\S]*border-top-color:\s*var\(--line-dark\)/);
  assert.match(css, /\.talent\s*{[\s\S]*grid-template-columns:\s*minmax\(0,\s*0\.88fr\) minmax\(0,\s*1\.12fr\)/);
  assert.match(css, /\.talent-media img\s*{[\s\S]*object-position:\s*50% 30%/);
  assert.match(css, /\.talent-media img\s*{[\s\S]*filter:\s*saturate\(0\.95\) contrast\(1\.04\) brightness\(0\.96\)/);
  assert.match(css, /\.creator-benefits li\s*{[\s\S]*display:\s*grid/);
  assert.match(css, /\.about\s*{[\s\S]*column-gap:\s*clamp\(36px,\s*5vw,\s*92px\)/);
  assert.match(css, /\.about-media\s*{[\s\S]*min-height:\s*clamp\(580px,\s*48vw,\s*660px\)/);
  assert.match(css, /\.about-media img\s*{[\s\S]*object-position:\s*54% center/);
  assert.match(css, /\.about-media img\s*{[\s\S]*filter:\s*saturate\(0\.9\) contrast\(1\.04\) brightness\(0\.88\)/);
  assert.match(css, /\.contact-copy img\s*{[\s\S]*aspect-ratio:\s*16 \/ 10/);
  assert.match(css, /@media \(max-width:\s*560px\)[\s\S]*\.service-media img,[\s\S]*\.about-media\s*{[\s\S]*min-height:\s*260px/);
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
  assert.match(css, /\.hero-intro\s*{[\s\S]*font-size:\s*clamp\(17px,\s*1\.35vw,\s*20px\)/);
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
  assert.match(hero, /Global talent network/);
  assert.match(hero, /Data-driven growth/);
  assert.doesNotMatch(hero, /Live commerce experience/);
  assert.doesNotMatch(hero, /class="hero-live-interface"/);
  assert.doesNotMatch(hero, /src="assets\/service-influencer\.jpg"/);
  assert.doesNotMatch(hero, /src="assets\/creator-recruitment\.jpg"/);
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

test("whiteboard 3 logo rail autoscrolls seven approved logos accessibly", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");
  const logoStrip = html.match(/<section class="logo-strip"[\s\S]*?<\/section>/)?.[0] ?? "";

  assert.match(logoStrip, /<h2 id="trusted-heading">Trusted by Leading Global Brands &amp; Innovators<\/h2>/);
  assert.match(logoStrip, /class="brand-logo-viewport"/);
  assert.match(logoStrip, /class="brand-logo-track"/);
  assert.match(logoStrip, /aria-hidden="true"/);
  for (const brand of ["temu", "anker", "dreame", "aliexpress", "lovart", "aiper", "ksp"]) {
    assert.match(logoStrip, new RegExp(`assets/brand-logos/${brand}\\.png`));
  }
  assert.equal(logoStrip.match(/<img /g)?.length, 14);
  assert.match(css, /@keyframes logo-scroll/);
  assert.match(css, /\.hero::before\s*{[\s\S]*radial-gradient\(ellipse at 20% 30%/);
  assert.match(css, /\.logo-strip\s*{[\s\S]*padding:\s*clamp\(80px,\s*8\.5vw,\s*120px\) 0 clamp\(56px,\s*5\.5vw,\s*78px\)/);
  assert.match(css, /\.logo-strip h2\s*{[\s\S]*font-size:\s*clamp\(26px,\s*3vw,\s*42px\)/);
  assert.match(css, /\.brand-logo-track\s*{[\s\S]*animation:\s*logo-scroll/);
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
