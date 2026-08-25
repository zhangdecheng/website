# Unified Service Media Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the three Service cards use equal 50/50 columns and a complete, unified 16:10 media frame without clipping people, cameras, or the speaker.

**Architecture:** Keep the existing Service-card HTML and content. Introduce one `service-media-frame` wrapper in both public and editable pages; shared CSS makes that wrapper a centered 16:10 matte frame and makes its image use `object-fit: contain`. Browser QA reads computed frame geometry and image fit at all four viewports, while static tests lock the source contract.

**Tech Stack:** Static HTML, CSS, Node.js built-in test runner, Playwright Core with system Google Chrome.

---

### Task 1: Lock the complete, uniform-media contract with failing tests

**Files:**
- Modify: `tests/site.test.mjs`
- Modify: `scripts/browser-qa.cjs`

- [ ] **Step 1: Add a failing static contract test**

Update the existing partner-proof regression test so its badge-alpha assertions remain intact, then replace its obsolete Service 02/03 crop assertions with this unified-frame contract. Also update the older `styles preserve social-first polish` assertions that currently lock the `0.67fr / 1.33fr` crop layout, `object-fit: cover`, and media-image minimum heights:

```js
test("Service media uses equal columns and complete 16:10 frames", async () => {
  const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");

  for (const filename of ["index.html", "review-editable.html"]) {
    const html = await readFile(new URL(`../${filename}`, import.meta.url), "utf8");
    assert.equal(
      html.match(/class="service-media-frame"/g)?.length,
      3,
      `${filename} must give each Service image a shared media frame`,
    );
  }

  assert.match(css, /\.service-block\s*{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\) minmax\(0,\s*1fr\)/);
  assert.match(css, /\.service-media \.service-media-frame\s*{[\s\S]*display:\s*block[\s\S]*aspect-ratio:\s*16 \/ 10/);
  assert.match(css, /\.service-media-frame img\s*{[\s\S]*object-fit:\s*contain/);
  assert.match(css, /\.service-copy h3\s*{[\s\S]*overflow-wrap:\s*anywhere/);
  assert.doesNotMatch(css, /\.service-block:hover \.service-media img\s*{[\s\S]*transform:\s*scale/);
});
```

Rename the updated regression test so it no longer documents a superseded focal-crop requirement (for example, `partner proof has a clean transparent exterior and Services use complete uniform frames`).

- [ ] **Step 2: Run the new test and confirm red**

Run: `node --test --test-name-pattern="Service media uses equal" tests/site.test.mjs`

Expected: FAIL because `service-media-frame` is absent and the grid is not equal-width.

- [ ] **Step 3: Add failing browser-QA assertions for the visible frame**

In `scripts/browser-qa.cjs`, replace the existing `serviceImagePositions` collection with a `serviceFrames` collection:

```js
const serviceFrames = [...document.querySelectorAll(".service-media-frame")].map((frame) => {
  const rect = frame.getBoundingClientRect();
  const image = frame.querySelector("img");
  return {
    ratio: rect.height ? Math.round((rect.width / rect.height) * 100) / 100 : null,
    objectFit: image ? getComputedStyle(image).objectFit : null,
  };
});
```

Return `serviceFrames` in `defaultState`, then replace the old focal-position check with:

```js
report.checks.serviceMediaFrames = check(
  results,
  defaultState.serviceFrames.length === 3
    && defaultState.serviceFrames.every((frame) => frame.ratio === 1.6 && frame.objectFit === "contain"),
  `${prefix}: Service frames are not three equal 16:10 contained images (${JSON.stringify(defaultState.serviceFrames)})`,
);
```

- [ ] **Step 4: Run browser QA and confirm red**

Run: `npm run build && node scripts/browser-qa.cjs`

Expected: QA report contains a `serviceMediaFrames` failure because no frame exists yet.

- [ ] **Step 5: Commit the red-test contract**

```bash
git add tests/site.test.mjs scripts/browser-qa.cjs
git commit -m "test: define unified service media contract"
```

### Task 2: Add the shared media-frame markup and minimal CSS

**Files:**
- Modify: `index.html:201-304`
- Modify: `review-editable.html:300-360`
- Modify: `styles.css:1043-1110`

- [ ] **Step 1: Add the same wrapper to all six Service media locations**

In `index.html`, change every Service `picture` start tag to:

```html
<picture class="service-media-frame">
```

In `review-editable.html`, wrap each direct Service image in the same element:

```html
<picture class="service-media-frame">
  <img src="..." alt="..." />
</picture>
```

Keep every existing `src`, `srcset`, `alt`, dimension, loading and decoding attribute unchanged. Remove the now-unneeded `service-image-performance` and `service-image-localization` classes from both files.

- [ ] **Step 2: Replace crop-specific Service CSS with the uniform frame**

In `styles.css`, use these rules:

```css
.service-block {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
}

.service-media {
  display: grid;
  min-height: 100%;
  place-items: center;
  overflow: hidden;
  background: var(--ink-light);
}

.service-media .service-media-frame {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  background: var(--ink-light);
}

.service-media-frame img {
  width: 100%;
  height: 100%;
  min-height: 0;
  object-fit: contain;
  object-position: center;
  filter: saturate(0.92) contrast(1.03) brightness(0.93);
  transition: filter 0.5s ease;
}

.service-copy h3 {
  overflow-wrap: anywhere;
}

.service-block:hover .service-media-frame img {
  filter: saturate(1.02) contrast(1.05) brightness(0.97);
}
```

Delete the old crop-focus selectors and the old hover `transform: scale(1.04)`. Remove `.service-media picture` from the global `display: contents` selector (or retain that selector but use the more specific frame selector above), so the frame becomes a real 16:10 box. In the `@media (max-width: 1100px)` Service override, use the same equal two-track declaration rather than a ratio that changes the approved 50/50 desktop result. Replace the mobile image `min-height` overrides with an explicit frame rule so the 16:10 aspect ratio remains the source of truth.

- [ ] **Step 3: Run the static test and confirm green**

Run: `node --test tests/site.test.mjs`

Expected: all static tests pass, including `Service media uses equal columns and complete 16:10 frames`.

- [ ] **Step 4: Commit the minimal visual implementation**

```bash
git add index.html review-editable.html styles.css tests/site.test.mjs scripts/browser-qa.cjs
git commit -m "feat: unify complete service media frames"
```

### Task 3: Build, browser-verify and document the static candidate

**Files:**
- Modify: `docs/CHANGELOG.md:8-20`
- Modify: `qa/browser-results.json`
- Modify: `qa/screenshots/contact-desktop-1440x1024.png`
- Modify: `qa/screenshots/contact-tablet-1024x1366.png`
- Modify: `qa/screenshots/contact-mobile-390x844.png`
- Modify: `qa/screenshots/contact-small-mobile-360x800.png`

- [ ] **Step 1: Build the static candidate**

Run: `npm run build`

Expected: `Built 6 site files and 39 asset entries.`

- [ ] **Step 2: Run four-viewport browser QA and inspect the evidence**

Run: `node scripts/browser-qa.cjs`

Expected: `qa/browser-results.json` has `"failures": []`; every viewport has `serviceMediaFrames: true`, no horizontal overflow and no unexpected console errors.

Inspect: `qa/screenshots/contact-desktop-1440x1024.png`

Expected: all three Service images retain their supplied content inside equally proportioned 16:10 frames; the Service 02 heading wraps rather than clipping.

- [ ] **Step 3: Record the candidate-only change**

Replace the prior 02/03 focal-crop bullet in the 2026-08-24 “Unreleased homepage visual candidate” section with this candidate-only note, so the changelog has no contradictory record:

```md
- Standardized the three Service media panels as 50/50 cards with centered 16:10 complete-image frames, dark matte breathing room, safe heading wrapping, and no hover zoom crop.
```

- [ ] **Step 4: Run the complete local suite and report the production boundary**

Run: `npm test`

Expected: all local static, contact and release-structure tests pass except the known public-release SHA assertion when this candidate has not been deployed. Do not change the production hash fixture or claim a production release.

- [ ] **Step 5: Commit verified evidence and documentation**

```bash
git add docs/CHANGELOG.md qa/browser-results.json qa/screenshots/contact-desktop-1440x1024.png qa/screenshots/contact-tablet-1024x1366.png qa/screenshots/contact-mobile-390x844.png qa/screenshots/contact-small-mobile-360x800.png
git commit -m "test: verify unified service media candidate"
```

### Task 4: Final source and scope readback

**Files:**
- Verify: `index.html`
- Verify: `review-editable.html`
- Verify: `styles.css`
- Verify: `tests/site.test.mjs`
- Verify: `qa/browser-results.json`

- [ ] **Step 1: Check committed diff hygiene**

Run: `git diff --check HEAD~3..HEAD && git status --short`

Expected: no whitespace errors. Do not stage or remove pre-existing untracked paths such as `.openai/`, `.superpowers/`, older `docs/superpowers/` drafts or `qa/audits/`.

- [ ] **Step 2: Read back the acceptance evidence**

Run: `node -e 'const report=require("./qa/browser-results.json"); console.log(JSON.stringify({ failures: report.failures, desktop: report.viewports["desktop-1440x1024"].checks.serviceMediaFrames }, null, 2))'`

Expected: `failures` is an empty array and `desktop` is `true`.

- [ ] **Step 3: Report the candidate state**

Report the commit identifiers, successful static/build/browser checks, the exact unresolved production-SHA test result if present, and that no push or deployment occurred.
