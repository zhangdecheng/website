# Homepage Partners and Logo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the approved four-part homepage visual update: complete Hero imagery, reordered brand proof with uSmile, the TAP/CAP official partner section, and the unified Canva-sourced FLOURISH Logo.

**Architecture:** Keep the site static. Use one accessible HTML Logo set and let the existing module script clone its decorative repeat after load, so the source has one order of record and still degrades to a readable static rail. New visual elements reuse existing black/coral/gold tokens and responsive breakpoints; no Contact, Nginx, Review, deployment, or remote Git behavior changes.

**Tech Stack:** Semantic HTML, CSS custom properties/Grid, browser-native DOM cloning, Node test runner, Playwright Core/Chrome, macOS Swift/AppKit only for one-off local raster asset preparation.

---

## File map

- `index.html` — production Homepage markup, favicon, Hero, brand rail, and official partnership section.
- `privacy.html` — shared Header Logo and favicon.
- `review-editable.html` — local-only annotated mirror of the production visual structures and shared Logo/favicon.
- `styles.css` — Hero asymmetric complete-image grid, Logo/image sizing, partner-section styles and responsive/reduced-motion behavior.
- `script.js` — clones the one accessible Logo set into one decorative `aria-hidden` loop and starts the rail only after cloning.
- `assets/` — prepared transparent FLOURISH lockup/mark, uSmile and TAP/CAP badge derivatives.
- `tests/site.test.mjs` — source contract coverage for new assets, markup, copy, order, and the static Logo/partner surfaces.
- `scripts/browser-qa.cjs` — runtime checks for Hero image containment, Logo clone behavior, partner-section layout and no overflow.
- `docs/ASSET_MANIFEST.md` / `docs/CHANGELOG.md` — production asset provenance and local change record.

## Visual rhythm decision

The new proof section sits after the medium-weight dark `Who We Are` card section and before the dark, dense Services catalog. It is a calm proof/transition surface: use the existing black background, one restrained gold/coral radial emphasis, the existing 1px dark border, muted body text, and no CTA or new card stack. This prevents a second visually heavy dark block from competing with Services while retaining the page’s black/coral rhythm.

### Task 1: Lock the new source contract with failing tests

**Files:**

- Modify: `tests/site.test.mjs`
- Test: `tests/site.test.mjs`

- [ ] **Step 1: Add a failing test for the approved Logo assets and all shared Logo locations**

```js
test("shared Canva-sourced FLOURISH lockup and mark are used across public and review pages", async () => {
  for (const filename of ["index.html", "privacy.html", "review-editable.html"]) {
    const html = await readFile(new URL(`../${filename}`, import.meta.url), "utf8");
    assert.match(html, /rel="icon" href="assets\/flourish-mark\.png"/);
    assert.match(html, /src="assets\/flourish-logo-lockup\.png"/);
  }
  for (const asset of ["flourish-logo-lockup.png", "flourish-mark.png"]) {
    await stat(new URL(`../assets/${asset}`, import.meta.url));
  }
});
```

- [ ] **Step 2: Run the Logo contract test and verify it fails**

Run: `node --test tests/site.test.mjs --test-name-pattern="shared Canva-sourced"`

Expected: FAIL because the favicon and transparent lockup assets do not exist and the old text lockups remain.

- [ ] **Step 3: Add a failing test for Hero, proof section, and exact brand order**

```js
test("homepage presents complete Hero media and the approved partner proof sequence", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");
  const script = await readFile(new URL("../script.js", import.meta.url), "utf8");
  const hero = html.match(/<figure class="hero-media[\\s\\S]*?<\\/figure>/)?.[0] ?? "";
  const rail = html.match(/<section class="logo-strip"[\\s\\S]*?<\\/section>/)?.[0] ?? "";

  assert.match(hero, /hero-card-landscape/);
  assert.match(hero, /hero-card-portrait/);
  assert.match(css, /\.hero-media\\s*{[\\s\\S]*grid-template-areas:/);
  assert.match(css, /\.hero-card img\\s*{[\\s\\S]*object-fit:\\s*contain/);
  assert.match(rail, /data-brand-logo-set/);
  assert.deepEqual(
    [...rail.matchAll(/assets\\/brand-logos\\/([^"\\s]+)/g)].map((match) => match[1]),
    ["tripo-transparent-cropped.png", "temu.png", "anker.png", "usmile.png", "dreame.png", "aliexpress.png", "lovart.png", "atoms-transparent.png", "ksp.png"],
  );
  assert.match(script, /cloneBrandLogoSet/);
  assert.match(html, /<section class="official-partners"/);
  assert.ok(html.indexOf('class="bridge"') < html.indexOf('class="official-partners"'));
  assert.ok(html.indexOf('class="official-partners"') < html.indexOf('class="services"'));
});
```

- [ ] **Step 4: Run the section contract test and verify it fails**

Run: `node --test tests/site.test.mjs --test-name-pattern="complete Hero media"`

Expected: FAIL because the current Hero has no landscape/portrait grid classes, there is no official-partners section, and the rail has eight manual duplicated Logos.

- [ ] **Step 5: Commit the red test contract**

```bash
git add tests/site.test.mjs
git commit -m "test: define homepage partner and logo contract"
```

### Task 2: Prepare the approved transparent raster assets

**Files:**

- Create: `assets/flourish-logo-lockup.png`
- Create: `assets/flourish-mark.png`
- Create: `assets/brand-logos/usmile.png`
- Create: `assets/partner-badges/tiktok-shop-tap.png`
- Create: `assets/partner-badges/tiktok-shop-cap.png`
- Modify: `docs/ASSET_MANIFEST.md`
- Test: `tests/site.test.mjs`

- [ ] **Step 1: Add the asset-existence assertions to the failing contract**

```js
for (const asset of [
  "brand-logos/usmile.png",
  "partner-badges/tiktok-shop-tap.png",
  "partner-badges/tiktok-shop-cap.png",
]) {
  await stat(new URL(`../assets/${asset}`, import.meta.url));
}
```

- [ ] **Step 2: Run the asset contract and verify it fails**

Run: `node --test tests/site.test.mjs --test-name-pattern="shared Canva-sourced"`

Expected: FAIL with `ENOENT` for the new approved production asset paths.

- [ ] **Step 3: Generate the minimal production derivatives from the three user-supplied source images**

Run a one-off Swift/AppKit command that:

```text
1. Removes the dark screenshot background from the 778×276 FLOURISH source while retaining white wordmark pixels and the gold mark.
2. Crops the gold mark from that same source into flourish-mark.png.
3. Removes the white uSmile source background, changes the black wordmark to white, preserves the blue dots/smile, and crops transparent margins.
4. Crops TAP and CAP medallions from the supplied partner reference, removes the white surrounding canvas, and retains the original badge pixels.
```

The resulting files must be PNG, under `assets/`, and must not include the source screenshots or a text screenshot substitute.

- [ ] **Step 4: Document the asset role and source handling**

Add these manifest entries:

```markdown
- `assets/flourish-logo-lockup.png` — approved Canva-source FLOURISH white-and-gold transparent lockup.
- `assets/flourish-mark.png` — matching gold graphically cropped browser icon.
- `assets/brand-logos/usmile.png` — user-supplied uSmile mark adapted to transparent dark-rail use.
- `assets/partner-badges/tiktok-shop-tap.png` — user-supplied TikTok Shop TAP certification badge derivative.
- `assets/partner-badges/tiktok-shop-cap.png` — user-supplied TikTok Shop CAP certification badge derivative.
```

- [ ] **Step 5: Run the asset contract and verify it passes**

Run: `node --test tests/site.test.mjs --test-name-pattern="shared Canva-sourced"`

Expected: PASS; every asset resolves from the exact production path.

- [ ] **Step 6: Commit the asset preparation**

```bash
git add assets/flourish-logo-lockup.png assets/flourish-mark.png assets/brand-logos/usmile.png assets/partner-badges docs/ASSET_MANIFEST.md tests/site.test.mjs
git commit -m "feat: add homepage logo and partner assets"
```

### Task 3: Implement the static Homepage and shared-brand markup

**Files:**

- Modify: `index.html`
- Modify: `privacy.html`
- Modify: `review-editable.html`
- Modify: `styles.css`
- Modify: `script.js`
- Test: `tests/site.test.mjs`

- [ ] **Step 1: Keep the new page-contract test red before changing markup**

Run: `node --test tests/site.test.mjs --test-name-pattern="complete Hero media"`

Expected: FAIL only on missing final markup/CSS/script contract after assets exist.

- [ ] **Step 2: Replace textual lockups and blank favicons with the approved assets**

Use this exact markup pattern in Header/Footer locations, with the existing link destination preserved:

```html
<a class="wordmark wordmark-lockup" href="#top" aria-label="FLOURISH CULTURE home">
  <img src="assets/flourish-logo-lockup.png" alt="FLOURISH CULTURE" width="389" height="138" />
</a>
```

Use `href="index.html#top"` on `privacy.html`; preserve the `wordmark-footer` class in the Homepage Footer. Replace each `data:,` favicon with:

```html
<link rel="icon" href="assets/flourish-mark.png" type="image/png" />
```

- [ ] **Step 3: Make Hero media complete rather than cropped**

Add `hero-card-landscape` to the first two cards and `hero-card-portrait` to the third. Replace the desktop `hero-media` geometry with named grid areas: landscape cards occupy `talent` and `growth` rows; portrait occupies `partnership` across both rows. Use `object-fit: contain` with existing `--ink` as the letterbox color, preserve the caption overlay, and use a one-column grid under 820px.

```css
.hero-media { grid-template-areas: "talent partnership" "growth partnership"; }
.hero-card-landscape:first-child { grid-area: talent; }
.hero-card-tech { grid-area: growth; }
.hero-card-portrait { grid-area: partnership; }
.hero-card img { object-fit: contain; }
```

- [ ] **Step 4: Replace the hand-duplicated rail with one accessible ordered set**

Write exactly one `.brand-logo-set[data-brand-logo-set]` in Homepage and review copy, ordered as Tripo, Temu, Anker Innovations, uSmile, Dreame, AliExpress, Lovart, Atoms and KSP Performance. Give each Logo a stable class such as `logo-tripo`, `logo-usmile`, and use those classes for optical sizing.

```html
<div class="brand-logo-track">
  <div class="brand-logo-set" data-brand-logo-set>
    <!-- the nine ordered accessible images -->
  </div>
</div>
```

- [ ] **Step 5: Clone the decorative rail set at runtime**

Add this minimal helper before `initContactForm()`:

```js
function cloneBrandLogoSet() {
  const source = document.querySelector("[data-brand-logo-set]");
  if (!source || source.parentElement?.querySelector('[aria-hidden="true"]')) return;
  const clone = source.cloneNode(true);
  clone.removeAttribute("data-brand-logo-set");
  clone.setAttribute("aria-hidden", "true");
  clone.querySelectorAll("img").forEach((image) => image.setAttribute("alt", ""));
  source.parentElement?.append(clone);
  source.parentElement?.classList.add("is-ready");
}

cloneBrandLogoSet();
```

- [ ] **Step 6: Add the official partner section at the approved page position**

Use semantic copy and the approved assets:

```html
<section class="official-partners" aria-labelledby="official-partners-heading">
  <div class="official-partners-layout section-shell">
    <div class="official-partners-badges">
      <img src="assets/partner-badges/tiktok-shop-tap.png" alt="TikTok Shop Certified TAP Partner" width="360" height="360" loading="lazy" decoding="async" />
      <img src="assets/partner-badges/tiktok-shop-cap.png" alt="TikTok Shop Certified CAP Partner" width="360" height="360" loading="lazy" decoding="async" />
    </div>
    <div class="official-partners-copy reveal">
      <p class="eyebrow">Official Partnership</p>
      <h2 id="official-partners-heading">Certified TikTok Shop TAP &amp; CAP Partner</h2>
      <p class="official-partners-lead">Dedicated KOL marketing support for every category.</p>
      <p>FLOURISH is an officially certified TikTok Shop TAP &amp; CAP partner across multiple markets, with recognized qualifications for creator marketing and commerce enablement.</p>
      <p>We support clients across e-commerce, consumer electronics, automotive, AI, personal care, and other sectors.</p>
      <p class="official-partners-note">TikTok Shop multi-market certified TAP &amp; CAP partner.</p>
    </div>
  </div>
</section>
```

- [ ] **Step 7: Style the new structures with existing tokens**

Use `.bridge` and `.services` as neighboring references. Partner section: `var(--black)` base, `var(--line-dark)` borders, existing `var(--gold-soft)` and `var(--coral-soft)` only as restrained radial accents, muted body text, two badge images on desktop and a stacked layout under 820px. Rail: animate only `.brand-logo-track.is-ready`; use a 50% translation after the two equal `.brand-logo-set` children exist. Under reduced motion, disable animation and hide `[aria-hidden="true"]` set. Never use `nth-child` sizing.

- [ ] **Step 8: Run the source contract tests and verify they pass**

Run: `node --test tests/site.test.mjs --test-name-pattern="shared Canva-sourced|complete Hero media"`

Expected: PASS; the explicit source contract finds every new asset, exact order, full Hero grid, partner section and clone helper.

- [ ] **Step 9: Commit the static implementation**

```bash
git add index.html privacy.html review-editable.html styles.css script.js tests/site.test.mjs
git commit -m "feat: refresh homepage partners and logos"
```

### Task 4: Add runtime browser assertions and complete local verification

**Files:**

- Modify: `scripts/browser-qa.cjs`
- Modify: `docs/CHANGELOG.md`
- Test: `scripts/browser-qa.cjs`

- [ ] **Step 1: Add failing runtime QA checks**

Extend `defaultState` with:

```js
const logoSets = [...document.querySelectorAll(".brand-logo-set")];
const partner = document.querySelector(".official-partners");
const partnerRect = partner?.getBoundingClientRect();
const heroImages = [...document.querySelectorAll(".hero-card img")];

heroImagesContained: heroImages.every((image) => getComputedStyle(image).objectFit === "contain"),
brandLogoSetCount: logoSets.length,
brandOrder: [...logoSets[0]?.querySelectorAll("img") || []].map((image) => image.alt),
decorativeLogoSetHidden: logoSets[1]?.getAttribute("aria-hidden") === "true",
partnerVisible: Boolean(partnerRect && partnerRect.width > 0 && partnerRect.height > 0),
partnerBadges: partner?.querySelectorAll(".official-partners-badges img").length,
```

Then assert `heroImagesContained`, exactly two sets, the exact nine brand alts, hidden decorative repeat, visible partner section and two badge images. For reduced motion, also assert the decorative set is hidden.

- [ ] **Step 2: Run browser QA before its implementation is complete and verify it fails**

Run: `node scripts/browser-qa.cjs`

Expected: FAIL until the new state fields and assertions have been added, because the output lacks the required partner/rail checks.

- [ ] **Step 3: Implement the minimal browser-QA state collection and assertions**

Keep the existing four viewports and form stubs unchanged. Add only the DOM collection and `check()` calls from Step 1; do not replace the existing behavior checks.

- [ ] **Step 4: Update the local change record**

Add a dated `2026-08-24` entry in `docs/CHANGELOG.md` recording the complete Hero grid, revised rail order with uSmile, official TAP/CAP section, shared Canva-source Logo, local verification status, and the fact that no deployment/push occurred.

- [ ] **Step 5: Run the complete local verification sequence**

```bash
git diff --check
node --test tests/site.test.mjs
npm run build
node scripts/browser-qa.cjs
npm test
npm run release:verify
```

Expected: source tests, build and browser QA pass. If `npm test` or `release:verify` fails solely on a historical production-hash assertion or restricted local-listener permission, record exact output and do not call the complete suite passed.

- [ ] **Step 6: Inspect generated evidence and build output**

Read back `qa/browser-results.json`, inspect desktop and mobile screenshots, and confirm `dist/` contains the new Logo, uSmile and both partner badge assets referenced by built HTML.

- [ ] **Step 7: Commit the QA and documentation record**

```bash
git add scripts/browser-qa.cjs docs/CHANGELOG.md qa/browser-results.json qa/screenshots
git commit -m "test: verify homepage partner visual update"
```

## Plan self-review

- Spec coverage: Tasks 2–3 cover all four approved visual changes; Task 1 locks the contract first; Task 4 verifies desktop/mobile runtime behavior and documents it.
- Scope control: No task changes Contact, server, Nginx, deployment, Review or remote Git.
- Placeholder scan: no TBD/TODO or implicit implementation steps remain; image processing is explicitly constrained to supplied sources and exact output paths.
- Interface consistency: `data-brand-logo-set`, `.brand-logo-set`, `.is-ready`, `.official-partners`, `cloneBrandLogoSet`, and the asset paths use the same names in tests, markup, CSS and runtime QA.
