# FLOURISH AI Assets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate, inspect and integrate exactly two new production images—Service 03 and Our Talent—that match the existing dark editorial site style without changing any other image.

**Architecture:** Use the built-in `image_gen` tool for two independent photorealistic generations. Keep selected PNG masters under the existing non-production `design-options/source-assets/` convention, derive optimized WebP production files with local FFmpeg, reference those files directly from semantic `<picture>` markup, and lock the asset scope with tests and Git diff review.

**Tech Stack:** Built-in image generation, `view_image` visual inspection, FFmpeg `libwebp`, HTML `<picture>`, Node `node:test`, existing asset manifest/build scanner and Chrome visual QA.

---

## Prerequisite and immutable asset rule

Execute after the page/content plan has removed the Talent form and established the final layout. The only existing homepage image references allowed to change are:

- Service 03: replace `assets/hong-kong-culture.jpg` / `assets/optimized/hong-kong-culture.webp`.
- Our Talent: replace `assets/about-hk-cross-border-bridge.png` / `assets/optimized/about-hk-cross-border-bridge.webp` in the Talent section only.

The actual old files remain untouched for rollback/reference. Hero, logo rail, Who We Are, Service 01, Service 02, About and Contact images must keep their current bytes and references.

### Task 1: Lock the two-asset scope with failing tests

**Files:**
- Modify: `tests/site.test.mjs`
- Modify later: `index.html`
- Create later: `assets/service-creative-localization-meetup.webp`
- Create later: `assets/talent-creator-growth-studio.webp`

- [ ] **Step 1: Add failing production-asset assertions**

Add to `tests/site.test.mjs`:

```js
test("only Service 03 and Our Talent use the two approved new AI assets", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const serviceThree = html.match(/<span class="service-number">03<\/span>[\s\S]*?<\/article>/)?.[0] ?? "";
  const talent = section(html, "talent");
  assert.match(serviceThree, /assets\/service-creative-localization-meetup\.webp/);
  assert.match(talent, /assets\/talent-creator-growth-studio\.webp/);
  assert.doesNotMatch(serviceThree, /hong-kong-culture/);
  assert.doesNotMatch(talent, /about-hk-cross-border-bridge/);

  for (const path of [
    "../assets/service-creative-localization-meetup.webp",
    "../assets/talent-creator-growth-studio.webp",
  ]) {
    const bytes = await readFile(new URL(path, import.meta.url));
    assert.equal(bytes.subarray(0, 4).toString("ascii"), "RIFF");
    assert.equal(bytes.subarray(8, 12).toString("ascii"), "WEBP");
    assert.ok(bytes.length > 80_000, `${path} should be a production-quality image`);
  }
});
```

Add alt-text assertions that describe a generic scene and do not contain `our meetup`, `FLOURISH event`, `client`, `partner`, or a named brand.

- [ ] **Step 2: Run and verify the red state**

Run: `node --test tests/site.test.mjs`

Expected: FAIL because neither WebP file nor its HTML reference exists.

- [ ] **Step 3: Record unaffected-image hashes before generation**

Run:

```bash
find assets -type f \( -iname '*.png' -o -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.webp' -o -iname '*.svg' \) -print0 | sort -z | xargs -0 shasum -a 256 > /private/tmp/flourish-images-before.sha256
```

Expected: `/private/tmp/flourish-images-before.sha256` is non-empty and contains all current image paths. This file stays outside Git.

- [ ] **Step 4: Confirm the approved visual reference in context**

Use `view_image` at original detail on:

- `design-options/neon-culture-bridge.png`
- `qa/screenshots/desktop-1440x1024.png`
- `assets/hong-kong-culture.jpg`
- `assets/about-hk-cross-border-bridge.png`

Write down only observable traits used in the prompts: black/coral palette, low-key editorial contrast, warm practical lighting, restrained grain, realistic people, and wide crop behavior. Do not infer a real event or client relationship.

- [ ] **Step 5: Keep tests uncommitted until both assets can make them green**

Run: `git status --short tests/site.test.mjs`

Expected: `M tests/site.test.mjs`.

### Task 2: Generate and approve the Service 03 meetup image

**Files:**
- Create: `design-options/source-assets/service-creative-localization-meetup.png`
- Create: `assets/service-creative-localization-meetup.webp`

- [ ] **Step 1: Generate one new image with the built-in image tool**

Call the built-in `image_gen` tool without reference-image arguments, using this exact prompt:

```text
Use case: photorealistic-natural
Asset type: wide website service-card photograph for Creative Strategy & Localization
Primary request: A candid cross-cultural creator meetup and content workshop in a contemporary Hong Kong creative showroom, showing local trend insight, script collaboration, product discovery, and offline immersion in one believable scene.
Scene/backdrop: Dark charcoal industrial-creative interior with subtle Hong Kong architectural character, shelves holding generic unbranded product samples, one worktable with paper storyboards that contain no readable text.
Subject: Five diverse adult creators from different cultural backgrounds collaborating naturally; one reviews a script with another person, one records a product sample with a mirrorless camera, and two discuss content around the table. Professional, energetic and authentic—not posed as a corporate team photo.
Style/medium: Premium documentary editorial photography, realistic skin and hands, 35mm lens character, restrained fine grain, physically plausible equipment and perspective.
Composition/framing: Landscape 3:2-style wide composition, important faces and camera equipment inside the central 70% so responsive 16:10 crops remain useful; layered depth, no collage, no text overlay.
Lighting/mood: Low-key cinematic lighting with warm tungsten practicals and restrained coral-red accents against deep black and warm neutral surfaces; confident, collaborative, globally minded.
Color palette: Existing FLOURISH site language—charcoal black, warm skin tones, muted coral red, small warm-gold highlights; no bright blue/purple tech gradient.
Constraints: Generic illustrative service scene only; no implication that this is a real FLOURISH event; no readable labels, logos, branded products, sponsor marks, flags, captions or watermark.
Avoid: malformed hands, extra fingers, fused equipment, impossible camera geometry, duplicate faces, plastic skin, fake UI text, stage event, conference badges, influencer selfie clichés, excessive neon, obvious AI glow.
```

- [ ] **Step 2: Inspect the generated original before copying it**

Use `view_image` with `detail: original`. Reject and regenerate with one targeted correction if any of these are visible: malformed face/hand, impossible camera, readable fake text, brand mark, watermark, duplicate person, misleading event signage, subject cropped outside the central area, bright purple/blue drift, or a visibly synthetic collage.

- [ ] **Step 3: Copy the selected generated output into the project master path**

Use the exact `$CODEX_HOME/generated_images/...` path returned by the accepted built-in generation and copy it to:

`design-options/source-assets/service-creative-localization-meetup.png`

Read the copied file back with `view_image` to prove the workspace copy is the approved image.

- [ ] **Step 4: Produce the deterministic WebP derivative**

Run:

```bash
ffmpeg -y -i design-options/source-assets/service-creative-localization-meetup.png -vf "scale='min(1600,iw)':-2:flags=lanczos" -c:v libwebp -lossless 0 -preset picture -quality 86 assets/service-creative-localization-meetup.webp
ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,width,height -of default=noprint_wrappers=1 assets/service-creative-localization-meetup.webp
```

Expected: codec `webp`, width no greater than 1600, even height, landscape orientation.

- [ ] **Step 5: Inspect the WebP derivative**

Use `view_image` at original detail on `assets/service-creative-localization-meetup.webp`. Confirm no visible banding, block artifacts, face damage or crushed shadow detail was introduced.

### Task 3: Generate and approve the Our Talent creator-growth image

**Files:**
- Create: `design-options/source-assets/talent-creator-growth-studio.png`
- Create: `assets/talent-creator-growth-studio.webp`

- [ ] **Step 1: Generate one new image with the built-in image tool**

Call the built-in `image_gen` tool without reference-image arguments, using this exact prompt:

```text
Use case: photorealistic-natural
Asset type: wide website recruitment photograph for the Our Talent section
Primary request: A confident multicultural creator producing polished content in a professional studio, with high-end production gear and subtle data-backed growth cues integrated into one natural scene.
Scene/backdrop: Sophisticated dark content studio with a cinema or mirrorless camera, large softbox, practical light, smartphone rig and laptop; a background monitor shows only abstract non-readable charts and retention-curve shapes, never legible numbers or a real interface.
Subject: One charismatic adult lead creator with a diverse or mixed-cultural appearance actively presenting to camera, visibly enjoying the work while remaining focused and professional; one small crew presence may appear softly out of focus for depth, not as a second focal subject.
Style/medium: Premium cinematic editorial photography, realistic skin texture, hands, cables and equipment, subtle fine grain, credible studio physics, not a commercial stock-photo pose.
Composition/framing: Landscape 3:2-style wide scene designed for a tall responsive crop; lead creator and key camera stay within the central 65%, with useful negative space and one integrated visual story rather than panels or collage.
Lighting/mood: Dark, aspirational and warm; soft key light on the creator, restrained coral-red practical accents and small warm-gold highlights; a high-achievement moment without trophies or fake awards.
Color palette: Charcoal black, natural skin, muted coral red, warm neutral and small gold accents matching the existing FLOURISH website; no bright cyan/purple technology glow.
Constraints: Generic recruitment illustration only; no claim that the person is a real FLOURISH creator; no readable dashboard text, logos, platform marks, brand products, captions, badges or watermark.
Avoid: malformed hands, impossible cameras, floating equipment, fake readable analytics, split-screen collage, duplicated person, over-retouched skin, celebrity likeness, luxury cliché, excessive neon, obvious AI glow.
```

- [ ] **Step 2: Inspect and iterate once per visible defect**

Use `view_image` with original detail. Apply the same anatomy/equipment/logo/text checks as Task 2, plus confirm the abstract dashboard does not display fabricated readable performance numbers and the scene remains one photograph rather than a four-benefit collage.

- [ ] **Step 3: Copy the approved result into the fixed master path and read it back**

Copy the exact accepted generated output to:

`design-options/source-assets/talent-creator-growth-studio.png`

Read the workspace file back using `view_image` before conversion.

- [ ] **Step 4: Produce and inspect the WebP derivative**

Run:

```bash
ffmpeg -y -i design-options/source-assets/talent-creator-growth-studio.png -vf "scale='min(1600,iw)':-2:flags=lanczos" -c:v libwebp -lossless 0 -preset picture -quality 86 assets/talent-creator-growth-studio.webp
ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,width,height -of default=noprint_wrappers=1 assets/talent-creator-growth-studio.webp
```

Expected: codec `webp`, width no greater than 1600, even height, landscape orientation. Inspect the final file with `view_image` at original detail.

- [ ] **Step 5: Confirm both project masters and derivatives exist**

Run:

```bash
file design-options/source-assets/service-creative-localization-meetup.png design-options/source-assets/talent-creator-growth-studio.png assets/service-creative-localization-meetup.webp assets/talent-creator-growth-studio.webp
```

Expected: two valid PNG masters and two valid RIFF WebP derivatives.

### Task 4: Integrate the two assets and prove every other image is unchanged

**Files:**
- Modify: `index.html`
- Modify: `tests/site.test.mjs`
- Modify: `docs/ASSET_MANIFEST.md`
- Create: the four image files from Tasks 2–3

- [ ] **Step 1: Replace only the two approved `<picture>` blocks**

Service 03:

```html
<picture>
  <img
    src="assets/service-creative-localization-meetup.webp"
    alt="Creators collaborating in a cross-cultural content workshop with cameras and product samples"
    width="1600"
    height="1067"
    loading="lazy"
    decoding="async"
  />
</picture>
```

Our Talent:

```html
<picture>
  <img
    src="assets/talent-creator-growth-studio.webp"
    alt="A creator producing content in a professional studio with production equipment and growth insights"
    width="1600"
    height="1067"
    loading="lazy"
    decoding="async"
  />
</picture>
```

Use the actual `ffprobe` dimensions if generation produced a different even height; do not write an incorrect intrinsic size.

- [ ] **Step 2: Update the asset manifest with provenance and prompts**

Add a dated section to `docs/ASSET_MANIFEST.md` identifying both files as AI-generated generic illustrative scenes, naming their non-production PNG masters, recording the exact final prompts from Tasks 2 and 3, noting built-in image generation, and explicitly stating that no real FLOURISH event, creator or client relationship is depicted.

- [ ] **Step 3: Run tests and build**

Run:

```bash
npm test
npm run build
```

Expected: the previously red asset test passes and `dist/assets/` contains both WebP files.

- [ ] **Step 4: Compare all pre-existing image bytes**

Run:

```bash
find assets -type f \( -iname '*.png' -o -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.webp' -o -iname '*.svg' \) ! -name 'service-creative-localization-meetup.webp' ! -name 'talent-creator-growth-studio.webp' -print0 | sort -z | xargs -0 shasum -a 256 > /private/tmp/flourish-images-after.sha256
sed '/service-creative-localization-meetup\.webp/d;/talent-creator-growth-studio\.webp/d' /private/tmp/flourish-images-before.sha256 > /private/tmp/flourish-images-before-existing.sha256
diff -u /private/tmp/flourish-images-before-existing.sha256 /private/tmp/flourish-images-after.sha256
```

Expected: `diff` produces no output. If any existing image hash changes, restore that image from the current branch baseline before continuing.

- [ ] **Step 5: Commit only the two new asset families and references**

```bash
git add -- index.html tests/site.test.mjs docs/ASSET_MANIFEST.md design-options/source-assets/service-creative-localization-meetup.png design-options/source-assets/talent-creator-growth-studio.png assets/service-creative-localization-meetup.webp assets/talent-creator-growth-studio.webp
git diff --cached --name-status
git commit -m "feat: add creator localization and talent imagery"
```

Expected before commit: exactly three modified text files and four new image files are staged; no existing image is modified.

## AI asset plan completion gate

Run fresh:

```bash
npm test
npm run build
node scripts/browser-qa.cjs
git show --name-status --format= HEAD
```

Expected: tests/build/browser QA pass; the commit lists no modified/deleted pre-existing image. Open both desktop and mobile QA screenshots and visually confirm the images match the surrounding dark/coral treatment and preserve useful crops. Report both final workspace paths, both final prompts, built-in image generation as the tool path, and any regeneration performed.
