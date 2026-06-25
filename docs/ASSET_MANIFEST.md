# FLOURISH CULTURE Asset Manifest

Last updated: 2026-06-25

## Production homepage assets

These files are copied into `dist/assets/` and served by the production homepage.

### Brand and logo assets

- `assets/flourish-logo-reference.png` — internal logo reference image
- `assets/brand-logo-strip.png` — earlier combined logo strip
- `assets/brand-logo-strip-white.png` — white logo strip reference
- `assets/brand-logos/temu.png`
- `assets/brand-logos/anker.png`
- `assets/brand-logos/dreame.png`
- `assets/brand-logos/aliexpress.png`
- `assets/brand-logos/lovart.png`
- `assets/brand-logos/aiper.png`
- `assets/brand-logos/ksp.png`

Only these approved brand logos should be used for the endorsement/logo rail.

### Main visual assets

- `assets/service-influencer.jpg` — Service 01 / hero creator network imagery
- `assets/service-performance.jpg` — Service 02 / performance and technology imagery
- `assets/service-localization.jpg` — Service 03 / localization imagery
- `assets/talent-global-creator-network.png` — Our Talent recruitment section
- `assets/about-hk-cross-border-bridge.png` — About / Hong Kong cross-border bridge section
- `assets/hong-kong-harbour.jpg` — Contact section Hong Kong skyline
- `assets/creator-recruitment.jpg` — earlier creator recruitment reference
- `assets/hero-creator-collage.jpg` — earlier hero collage reference
- `assets/hong-kong-culture.jpg` — earlier Hong Kong culture reference

### SVG support visuals

- `assets/bridge-connect-world.svg`
- `assets/bridge-broadcast-world.svg`

### Self-hosted typography and icons

- `assets/fonts/archivo-variable.woff2`
- `assets/fonts/space-grotesk-variable.woff2`
- `assets/icons/remixicon.css`
- `assets/icons/remixicon.ttf`
- `assets/icons/remixicon.woff`
- `assets/icons/remixicon.woff2`

The site does not depend on Google Fonts or remote icon CDNs.

## Design and QA references

These assets are not production-served by default but are kept in Git for project continuity.

- `design-options/neon-culture-bridge.png` — canonical approved mockup
- `design-options/sections/` — section-level canonical references
- `design-options/source-assets/` — generation/reference source assets
- `design-references/` — design benchmark screenshots
- `feishu-annotations/` — exported Feishu whiteboard annotation references
- `qa/screenshots/` — browser QA screenshots
- `qa/comparisons/` — canonical vs implementation visual comparison boards
- `archive/2026-06-19-white-green-draft/` — previous white/green Chinese draft fallback snapshot

## Asset handling rules

- Keep UI text as accessible HTML, not baked into generated images.
- Do not add unapproved client/customer logos or unverified performance metrics.
- Keep all production-critical assets under `assets/`.
- If a design reference image becomes a production asset, copy it into `assets/` and update this manifest.
- After image changes, run `npm test`, `npm run build`, and browser QA before release.

