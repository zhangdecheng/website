# FLOURISH CULTURE Design QA

Date: 2026-06-24  
Target: Option 1 — Neon Culture Bridge  
Source visual truth: `design-options/neon-culture-bridge.png`  
Implementation: `qa/screenshots/desktop-1440x1024.png`  
Viewport/state: 1440 × 1024, English homepage, default state, all reveal content visible

## Comparison evidence

- Full page, equal displayed width:
  `qa/comparisons/canonical-vs-implementation.png`
- Hero and approved logos:
  `qa/comparisons/sections/01-hero-and-logos.png`
- Hong Kong bridge:
  `qa/comparisons/sections/02-bridge.png`
- Numbered services:
  `qa/comparisons/sections/03-services.png`
- Creator recruitment:
  `qa/comparisons/sections/04-talent.png`
- Mission/About:
  `qa/comparisons/sections/05-about.png`
- Project form and footer:
  `qa/comparisons/sections/06-contact-and-footer.png`

Every board preserves each source crop’s aspect ratio and displays the source
and implementation at the same width. No equal-height stretching is used.

## Findings

- P0: none.
- P1: none.
- P2: none.
- P3: the production project form is slightly taller than the Canonical
  overview because controls retain 44px minimum touch height and the complete
  required field set.
- P3: generated creator portraits differ in identity and pose from the concept
  board, while preserving its collage density, red/black palette, and global
  creator art direction.

## Required fidelity surfaces

- Typography: self-hosted Archivo and Space Grotesk preserve the heavy
  neo-grotesk hierarchy, compact line height, and small uppercase labels.
- Spacing/layout: desktop height reduced from 7245px to approximately 3538px;
  the bridge, services, Creator, About, contact, and footer now follow the
  Canonical section rhythm.
- Color/tokens: black, paper white, and coral red consistently map to the source.
- Image quality: all visible photography uses real bitmap assets; the Hong Kong
  section now uses a dedicated monochrome Victoria Harbour image with a coral
  junk boat.
- Copy/content: English copy remains coherent and keeps every approved form
  field without fabricated metrics or claims.
- Icons/states: Remix Icon assets, hover/focus states, mobile menu, validation,
  mailto flow, and reduced-motion mode remain functional.

## Responsive evidence

Chrome screenshots and measurements are stored under `qa/screenshots/` and
`qa/browser-results.json`. Wide desktop, desktop, tablet, mobile, and small
mobile layouts were checked for overflow, clipping, hidden content, control
size, and console errors.

## Patches made since the withdrawn pass

- Restored the Hong Kong city-and-junk-boat image split.
- Rebuilt all major section proportions around the Canonical composition.
- Removed the oversized services introduction and excess service detail.
- Reduced desktop page height by roughly half.
- Preserved accessible controls and complete form requirements.
- Replaced the distorted comparison with six equal-width section boards.
- Split the approved logo strip into seven transparent logo assets and applied
  optical sizing plus responsive 7-column / 4+3 spacing.
- Applied Feishu board 1 hero/header notes: replaced the white logo image with
  a dark-adapted lockup, renamed navigation labels, removed extra hero controls,
  revised the hero intro, and rebuilt the hero media area as three cards.
- Applied Feishu board 2 refinements: enlarged header/navigation, hero title,
  intro, and CTA type; increased navigation spacing; redesigned the third hero
  card as an accessible live-commerce interface; added extra desktop spacing
  before the approved logo rail.
- Re-ran Chrome QA at 1920 × 1080, 1440 × 1024, 1024 × 1366, 390 × 844,
  and 360 × 800 after the board 2 edits.

final result: passed

## 2026-08-21 — Split Media Alignment and Service 03 Focal-Point QA (latest)

- Source visual truth: the three user-supplied annotated screenshots at
  `/var/folders/b0/gjb328n13s18qqml1lh49wkw0000gn/T/codex-clipboard-df2c233d-f967-4617-96af-67e5bc5e5676.png`,
  `/var/folders/b0/gjb328n13s18qqml1lh49wkw0000gn/T/codex-clipboard-be65d3b4-829c-4c27-a340-cea9c6bed980.png`,
  and `/var/folders/b0/gjb328n13s18qqml1lh49wkw0000gn/T/codex-clipboard-5a73f797-6b09-4075-a841-ceca041a1d1b.png`.
- Rendered implementation: the four current browser-QA captures under
  `qa/screenshots/`, generated at `2026-08-21T16:17:07.550Z`.

### Comparison evidence

- Image 1: Talent and About now share `--split-media-width`; at 1440px both
  media columns measure 633.59px, and at 1024px both measure 450.55px. The
  mobile stacked layout keeps both media blocks at the viewport width.
- Image 2/3: Service 03 now uses `object-position: 88% center`, shifting the
  crop toward the photographer and preserving the speaker as the secondary
  focal point, matching the supplied right-weighted reference.

### Findings and required fidelity surfaces

- P0/P1/P2: none after this revision.
- The change reuses the existing black/coral visual system and keeps the
  current image assets; no new asset or palette was introduced.
- The right-weighted crop is render-time only, so the source WebP remains
  unchanged and responsive behavior is preserved.

### Verification

- `npm run build`: passed; `dist/index.html` rebuilt at 26,936 bytes.
- `node --test tests/site.test.mjs`: 26/26 passed.
- `node scripts/browser-qa.cjs`: passed at 1440×1024, 1024×1366, 390×844,
  and 360×800; `failures: []`, `splitMediaAligned: true`,
  `serviceThreeImageFocus: true`, and no unexpected console errors.
- `git diff --check`: passed.
- No production deploy or release-pin update was performed.

final result: passed

## 2026-08-21 — Annotation Revision: Service Labels, Image Crop, and Cloudflare Disclosure QA (historical, superseded)

- Source visual truth: the four user-supplied annotated screenshots at
  `/var/folders/b0/gjb328n13s18qqml1lh49wkw0000gn/T/codex-clipboard-0087e9a3-4e1c-4ca5-93b3-6fc7cda05544.png`,
  `/var/folders/b0/gjb328n13s18qqml1lh49wkw0000gn/T/codex-clipboard-7976d3f3-25f1-4703-aee3-dfa160a3e880.png`,
  `/var/folders/b0/gjb328n13s18qqml1lh49wkw0000gn/T/codex-clipboard-5a4b00e2-eb9f-4966-8afb-cbf885de6d41.png`,
  and `/var/folders/b0/gjb328n13s18qqml1lh49wkw0000gn/T/codex-clipboard-86cf2b3a-e245-4542-a660-4e3a60762acb.png`.
- Rendered implementation: `qa/screenshots/contact-desktop-1440x1024.png`,
  `qa/screenshots/contact-tablet-1024x1366.png`,
  `qa/screenshots/contact-mobile-390x844.png`, and
  `qa/screenshots/contact-small-mobile-360x800.png`, generated by browser QA
  at `2026-08-21T14:39:32.315Z`.

### Comparison evidence

- Image 1: the three Service 01 labels are now wrapped in `<strong>` and use
  the existing Service 03 emphasis rule: computed `font-weight: 750` and
  `rgb(250, 249, 247)` white text. The red strokes in the source are treated
  as annotation marks, not UI underlines.
- Image 2: each bridge `picture` is a fixed `16 / 9` frame with
  `overflow: hidden`; the image fills the frame with `object-fit: cover`.
  At the 1440px desktop viewport both frames measure 626 × 352.125 CSS px,
  with no image overflow past the safety boundary.
- Image 3: the Cloudflare disclosure is `hidden=true`, `open=false`, and
  zero-height on initial load. The browser QA observer recorded the expected
  `hidden=false`, `open=true` transition after a simulated missing-token/risk
  submit, and the disclosure closes again after a token callback.

### Findings and required fidelity surfaces

- P0/P1/P2: none after this revision.
- Typography and color reuse the existing Archivo/Space Grotesk pairing and
  black, paper, coral, muted, and line tokens; no new palette was introduced.
- The image change is a render-time safety crop rather than a destructive
  source-file edit, preserving the supplied asset while keeping the visible
  composition inside the card frame.

### Verification

- `npm run build`: passed; `dist/index.html` rebuilt at 26,936 bytes.
- `node --test tests/site.test.mjs`: 26/26 passed.
- `node scripts/browser-qa.cjs`: passed at 1440×1024, 1024×1366, 390×844,
  and 360×800; `failures: []`, `verificationHidden: true`,
  `verificationShown: true`, and no unexpected console errors.
- `git diff --check`: passed.
- No production deploy or release-pin update was performed.

final result: passed

## 2026-08-21 — Service Detail Typography, Verification, and Image Selection QA (historical, superseded)

- Source visual truth: the four supplied screenshots at
  `/Users/digua/.codex/attachments/7629e94b-f010-4308-bc28-babce37f0a2d/image-1.png`
  through `image-4.png` (source pixel sizes: 2828×1218, 2246×940,
  1658×514, and 1266×1202).
- Rendered implementation: `qa/screenshots/contact-desktop-1440x1024.png`,
  `qa/screenshots/contact-tablet-1024x1366.png`,
  `qa/screenshots/contact-mobile-390x844.png`, and
  `qa/screenshots/contact-small-mobile-360x800.png`.
- Focused visual state: a fresh local preview at 1440×1024 was inspected for
  the bridge titles, service detail rows, Service 02 title, emphasized list
  labels, Service 03 image, and the collapsed/open verification disclosure.
  The selected Image 4 draft is variation 2, stored as
  `assets/service-creative-localization-camera-speaker.webp`.
- Browser and normalization: System Google Chrome through
  `scripts/browser-qa.cjs`, Playwright `deviceScaleFactor: 1`; implementation
  captures are 1 CSS pixel per image pixel (1440×6988, 1024×6115, 390×10361,
  and 360×10574).

### Comparison evidence

- Image 1: both bridge card titles measure one line at the 1440px desktop
  viewport (`white-space: nowrap`, 27.36px computed type).
- Image 2: the bold service list labels retain the heavier `font-weight: 750`
  while body copy uses the shared body scale.
- Image 3: the security verification uses a native disclosure. It is closed
  by default (32px summary-only height); a failed/risk-triggered submit opens
  the challenge area (97px measured height), while a low-risk token callback
  closes it again.
- Image 4: the selected variation keeps the five-person creative workshop and
  shows the photographer on the right aiming at the black speaker on the
  table. The asset is a complete 1536×1024 WebP and loads with the approved
  descriptive alt text.

### Findings and comparison history

- P0: none.
- P1: none.
- P2: none after this revision.
- The earlier Service 03 product-only still life was replaced by the user-
  selected variation 2. The previous alignment note below remains as history;
  it is not the current visual source of truth.
- The typography pass adds shared display/body tokens, keeps the existing
  Archivo and Space Grotesk pairing, and reduces only the affected desktop
  bridge title scale so the requested titles stay on one line.

### Required fidelity surfaces

- Typography: `--font-display` and `--font-body` are shared across headings,
  labels, controls, and service copy; the desktop bridge title is constrained
  to one line and emphasized list labels remain at `font-weight: 750`.
- Spacing/layout: verification content is progressively disclosed without
  adding a persistent challenge block to the default form state.
- Colors/tokens: changes reuse the existing black, paper, coral, muted, and
  line tokens.
- Image quality: Service 03 uses the selected camera-and-speaker workshop WebP
  at 1536×1024 with a descriptive alt text.
- Copy/content: locked English service and form copy remains intact; only the
  verification affordance and image description were updated for this pass.

### Verification

- `npm run build`: passed; `dist/index.html` rebuilt at 26,878 bytes.
- `node --test tests/site.test.mjs`: 26/26 passed.
- `node scripts/browser-qa.cjs`: passed at 1440×1024, 1024×1366, 390×844,
  and 360×800; `failures: []` and no unexpected console errors.
- `git diff --check`: passed.
- `npm test`: 85/86 passed with elevated local-listener permissions. The sole
  failure is the pre-existing public-release `index.html` hash pin, which still
  targets the previously audited production candidate; no production deploy or
  release-pin update was requested or performed.
- The static preview cannot serve `/api/contact/config`, so its manual risk
  check ends in the expected temporary-unavailable status; the disclosure
  opening behavior itself was observed in the browser, and the scripted QA
  covers the low-risk token and form-state paths with stubs.

final result: passed

## 2026-08-21 — Service Detail and Contact Alignment QA (historical, superseded)

- Source visual truth: the seven supplied screenshots at
  `/Users/digua/.codex/attachments/29146a58-6fd5-42d4-b014-4f0b7af182d2/image-1.png`
  through `image-7.png` (source pixel sizes: 2872×1196, 136×1246,
  1788×888, 2650×496, 2014×752, 1034×1124, and 1922×504).
- Rendered implementation: `qa/screenshots/contact-desktop-1440x1024.png`,
  `qa/screenshots/contact-tablet-1024x1366.png`,
  `qa/screenshots/contact-mobile-390x844.png`,
  `qa/screenshots/contact-small-mobile-360x800.png`, and the focused
  `qa/screenshots/contact-creator-panel-1440x1024.png` capture.
- Browser and normalization: System Google Chrome through
  `scripts/browser-qa.cjs`, Playwright `deviceScaleFactor: 1`; implementation
  captures are 1 CSS pixel per image pixel (1440×7034, 1024×6101, 390×10327,
  360×10524). The focused Creator panel is 1440×981 at the same density.
- State: English homepage, default Brand form for the full-page captures;
  focused Creator form after selecting `Creator`, with the contact panel in
  view. The source screenshots are cropped annotations, so focused regions are
  compared by semantic surface rather than by full-page crop dimensions.

### Comparison evidence

- Full view: the desktop capture verifies the bridge cards, all three service
  blocks, the replacement Service 03 product still life, and the contact area.
- Focused regions: Service 02 title and bold list labels are legible in the
  desktop capture; Service 03 is visible as a complete centered product in the
  revised desktop capture; `contact-creator-panel-1440x1024.png` shows equal
  Niche and Main Audience Demographics controls.
- Browser measurement: the Creator controls both render at `118px` height;
  no horizontal overflow or unexpected console errors were reported in any of
  the four QA viewports.

### Findings and comparison history

- P0: none.
- P1: none.
- P2: none after the revision.
- Initial pass found the new centered product image still inherited the old
  Service 03 `object-position: 100% center`, leaving the product partially
  cropped on desktop. The rule was changed to `object-position: center center`,
  and the revised desktop capture confirms the full product body is visible.
- The requested text and alignment changes are intentional: the bridge title
  rows share a desktop line box, service detail labels use one stable column,
  service microcopy is one step larger, Service 02 stays on one line at wide
  desktop widths, and list `<strong>` labels use a visibly heavier weight.

### Required fidelity surfaces

- Typography: Archivo/Space Grotesk remain unchanged; service labels use
  `clamp(11px, 0.78vw, 12px)`, body/list copy uses the shared larger scale,
  and emphasized list labels use `font-weight: 750`.
- Spacing/layout: bridge title rows have a shared desktop minimum height;
  service detail grids use a fixed responsive label track; Creator paired
  fields share a 118px desktop control minimum and retain natural mobile
  sizing.
- Colors/tokens: all changes reuse the existing black, paper, coral, muted,
  and line tokens.
- Image quality: Service 03 now uses
  `assets/service-creative-localization-product.webp`, a 1536×1024 WebP
  still life with one unbranded product on a dark tabletop; no people, hands,
  faces, logos, or text are present.
- Copy/content: all locked English service and form copy remains intact; only
  the Service 03 image alt text now describes the product viewpoint accurately.

### Verification

- `npm run build`: passed; `dist/index.html` rebuilt at 26,584 bytes.
- `node --test tests/site.test.mjs`: 26/26 passed.
- `node scripts/browser-qa.cjs`: passed at 1440×1024, 1024×1366, 390×844,
  and 360×800; `failures: []`.
- `npm test`: 85/86 passed. The single remaining failure is the public-release
  hash gate, which still pins the previously audited release candidate while
  this local UI candidate changes `index.html`; no production deployment or
  release-pin update was requested or performed.

final result: passed

## 2026-06-24 — Feishu Whiteboard 3 QA Notes

- Source annotation: `feishu-annotations/whiteboard3.png` and `feishu-annotations/whiteboard3-raw.json`.
- Logo rail: heading is promoted to a centered section title; the seven approved logos are preserved with accessible alt text in the first track set, duplicated only as `aria-hidden` items for seamless auto-scroll.
- Motion accessibility: `prefers-reduced-motion: reduce` disables the logo animation and hides duplicate decorative logos for a static wrapped layout.
- Bridge section: `Who We Are` replaces the old split harbour layout with two cards, `From HK to the World` and `The East-to-West Cross-Border Experts`, using local SVG assets for connection and broadcast themes.

## 2026-06-24 — Feishu Whiteboard 3 Main-thread Verification

- Static tests: `npm test` passed with 14/14 tests.
- Release build: `npm run build` passed and rebuilt `dist/` with 4 site files and 28 asset entries.
- Chrome QA: `scripts/browser-qa.cjs` passed at 1920 × 1080, 1440 × 1024, 1024 × 1366, 390 × 844, and 360 × 800.
- Browser findings: no horizontal overflow, no missing image alt text, no hidden reveal content, no console errors, mobile menu opens/closes, form validation remains intact, and reduced-motion mode reports `scroll-behavior: auto`.
- Visual check: desktop and mobile screenshots under `qa/screenshots/` confirm the logo rail and `Who We Are` double-card section are responsive and aligned with the whiteboard 3 direction.

final result: passed

## 2026-06-24 — Remaining Feishu Module QA Notes

- Scope: Services, Our Talent, About Us, and Contact Us were updated locally in `index.html` and mirrored in `review-editable.html`; production deploy and `/review/` surfaces were not touched.
- Design continuity: retained the existing black, coral, paper, Archivo, Space Grotesk, square-card, hard-border, and restrained reveal system instead of introducing a new palette or one-off visual language.
- Services: replaced the previous thin rows with three larger service blocks, each separating `The Overview` from `What We Do`; platform proof uses local text chips rather than external icon CDNs.
- Talent: keeps the image-plus-form composition while adding the exact Feishu creator benefits, form heading, labels, and `Apply to Join the Roster` CTA.
- About: changes from generic mission copy to the exact mission and Hong Kong advantage narrative with visible image-plus-text structure.
- Contact: changes from generic project copy to the exact inquiry copy, role options, budget options, form labels, and `Book a Strategy Call` CTA.
- Accessibility: existing labels, alt text, focus states, touch-sized controls, mobile menu behavior, and reduced-motion reveal fallback are preserved by the shared static structure and CSS.

## 2026-06-24 — Remaining Feishu Module Main-thread Verification

- Static tests: `npm test` passed with 19/19 tests, including exact Feishu copy, separate mailto recipients, form labels/options, and mirrored `review-editable.html` content.
- Release build: `npm run build` passed and rebuilt `dist/` with 4 site files and 28 asset entries.
- Chrome QA: `scripts/browser-qa.cjs` passed at 1920 × 1080, 1440 × 1024, 1024 × 1366, 390 × 844, and 360 × 800 after updating the QA script for the new text-based creator demographics field.
- Browser findings: no horizontal overflow, no missing image alt text, no hidden reveal content, no console errors, mobile menu opens/closes, form validation remains intact, and reduced-motion mode reports `scroll-behavior: auto`.
- Visual check: desktop and mobile screenshots under `qa/screenshots/` confirm the expanded Feishu copy remains responsive; page height increases because the document requires full service, talent, about, and contact copy.

final result: passed

## 2026-06-24 — Whole-page Polish QA Notes

- Scope: visual rhythm only in the static site; no production deploy, Nginx, certificate, server, `/review/`, API, database, cookie, analytics, or new-page changes were made.
- Design continuity: reused the existing black, coral, paper, muted, and line tokens; added only semantic card surface/line aliases mapped to the current dark card treatment.
- Services: reduced desktop media height and copy padding, shifted image/text ratio toward copy, tightened list rhythm, and separated `The Overview` from `What We Do` with a quieter second divider.
- Talent: preserved the coral impact while reducing extreme media height, tightening content spacing, and making benefit rows more structured without changing labels or CTA semantics.
- About/Contact: reduced oversized image ratios, tightened panel/form padding, and kept the dark-to-paper transition connected to the preceding black/red sections.
- Mobile: reduced long image openers for Services/About/Talent and preserved 44px+ form controls and full-width form CTAs.

Verification:
- Static tests: `npm test` passed with 20/20 tests.
- Release build: `npm run build` passed and rebuilt `dist/` with 4 site files and 28 asset entries.
- Browser QA: parent-thread Chrome QA passed after starting the local static preview, using the bundled Playwright runtime.
- Viewports checked: 1920 × 1080, 1440 × 1024, 1024 × 1366, 390 × 844, and 360 × 800.
- Browser findings: no horizontal overflow, no missing image alt text, no hidden reveal content, no console errors, mobile menu opens/closes, form validation remains intact, and reduced-motion mode reports `scroll-behavior: auto`.
- Measured impact: desktop 1440 × 1024 page height reduced from 7021px to 6288px; mobile 390 × 844 page height reduced from 10231px to 9700px while preserving the full locked Feishu copy.

final result: passed

## 2026-06-24 — Creator and Bridge Asset Alignment QA Notes

- Scope: static homepage and `review-editable.html` preview only; production deploy, Nginx, certificate, server, `/review/`, API, database, cookie, analytics, form recipients, and Feishu copy were not changed.
- Services: text labels in the first service image overlay were converted to local Remix Icon chips with accessible `aria-label` names; Shorts and Reels use generic play/clapperboard video symbols.
- Talent: image source now uses `assets/talent-global-creator-network.png`; the module grid is closer to balanced and the media object position stays centered across desktop and mobile to reduce the previous left-heavy visual weight.
- About: image source now uses `assets/about-hk-cross-border-bridge.png` with alt text matching Hong Kong as a cross-border commerce and East-West bridge.

## 2026-06-24 — UI Craft Spacing and Taste Polish QA Notes

- Scope: local static CSS/tests/docs polish only; production deploy, Nginx, certificate, server, `/review/`, API, database, cookie, analytics, form recipients, Feishu copy, and section order were not changed.
- Screenshot issue 1: About now uses a larger desktop grid gutter plus extra content padding, so the copy no longer sits tight against the Hong Kong image edge.
- Screenshot issue 2: the `Trusted by Leading Global Brands & Innovators` and `Who We Are` display headings were scaled down and given steadier line-height so they fit the page hierarchy instead of overpowering the surrounding content.
- Screenshot issue 3: the Hero-to-Logo transition now has a dark/coral separator fade, while the Logo-to-Bridge transition has stronger spacing and a clearer border/tonal shift.
- Taste polish: generated imagery is treated with lower saturation, darker contrast, and subtle editorial grain/scan overlays to reduce raw AI-glow artifacts while keeping the approved black/coral design language.

Verification:
- Static tests: `npm test` passed with 20/20 tests.
- Release build: `npm run build` passed and rebuilt `dist/` with 4 site files and 30 asset entries.
- Browser QA: Chrome QA passed at 1920 × 1080, 1440 × 1024, 1024 × 1366, 390 × 844, and 360 × 800.
- Browser findings: no horizontal overflow, no missing image alt text, no hidden reveal content, no console errors, mobile menu opens/closes, form validation remains intact, and reduced-motion mode reports `scroll-behavior: auto`.

final result: passed
