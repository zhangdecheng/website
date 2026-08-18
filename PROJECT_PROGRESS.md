# FLOURISH CULTURE Website — Project Progress

Last updated: 2026-08-19

## Goal

Replace the temporary FLOURISH CULTURE landing page with a polished,
responsive, interactive marketing website grounded in the approved Feishu
requirements document.

## Recovery Entry Point

1. Read this file.
2. Read `docs/design-brief.md` once it exists.
3. Review the three files under `design-options/`.
4. Confirm the selected visual direction before editing production HTML.
5. Keep the existing deployment scripts and `/review/` routing compatible.

## Current Phase

Phase 7 — v1.2.0 local release candidate complete; production rollout in progress.

## Completed

- Located the existing static site and deployment scripts.
- Confirmed the original site was a single temporary `index.html`.
- Confirmed final interaction level: complete single-page frontend interaction.
- Confirmed Chrome as the primary preview and QA browser.
- Confirmed the official CLI source: `larksuite/cli`.
- Confirmed target platform: macOS ARM64.
- Downloaded and SHA-256 verified official Feishu/Lark CLI v1.0.56.
- Confirmed existing user authentication has Wiki and Docx read scopes.
- Read Feishu requirements document revision 207.
- Downloaded and inspected four embedded visual references.
- Captured and inspected the current Viral Nation homepage in Chrome.
- Drafted `docs/design-brief.md`.
- Design brief confirmed by the user on 2026-06-18.
- Generated exactly three independent visual concepts:
  - Option 1: Neon Culture Bridge.
  - Option 2: Global Editorial Exchange.
  - Option 3: Signal Mosaic.
- Recorded concept rationale and recovery details in `design-options/README.md`.
- User selected Option 1: Neon Culture Bridge.
- Archived the previous white/green Chinese draft.
- Saved `design-options/neon-culture-bridge.png` as the canonical visual truth.
- Generated dedicated hero, service, creator, and Hong Kong cultural assets.
- Rebuilt the homepage as an English black/coral responsive static site.
- Added the original honest mailto form flows and automated behavior/content tests; the mailto submission path was superseded by v1.2.0.
- Replaced the placeholder deployment script with a non-destructive static-file
  copy workflow that does not edit Nginx or `/review/`.
- Passed Chrome responsive QA at 1920 × 1080, 1440 × 1024,
  1024 × 1366, 390 × 844, and 360 × 800.
- Passed menu, form validation, mailto, keyboard, focus, alt text, touch target,
  overflow, console, and reduced-motion checks.
- Added canonical section crops and the final side-by-side visual comparison.
- Converted photographic production assets to quality-86 JPEG while retaining
  the generated PNG masters under `design-options/source-assets/`.
- Reworked the responsive layout using the Canonical section proportions.
- Restored the Hong Kong bridge as a text-and-harbour-image split.
- Reduced the 1440px desktop page height from approximately 7245px to 3538px.
- Replaced the invalid equal-height comparison with equal-width, section-aligned
  comparison boards under `qa/comparisons/sections/`.
- Resolved all P0–P2 findings and recorded `final result: passed` in
  `design-qa.md`.
- Rebuilt `dist/` and the local release archive without publishing production.
- Read Feishu annotation boards 1 and 2 with `lark-cli`, exported their
  whiteboard previews/raw nodes under `feishu-annotations/`, and applied the
  requested header, logo, hero copy, hero media, navigation, and type-size
  refinements.
- Added a local-only `review-editable.html` page for manual HTML review edits;
  it is excluded from `dist/` and the release archive.
- Re-ran static tests, build checks, Chrome responsive QA, and release archive
  validation after the Feishu board 2 changes.

## In Progress

- Re-verify the confirmed `/opt/node-v24.17.0-linux-x64` binary/npm immediately before production write and stage the rebuilt release artifacts.
- Create the protected Contact environment through a private server session, then create the v1.2.0 production backup.
- Create the production Turnstile widget and install its Secret plus the SMTP authorization code through a private server session.

## Pending

- Protected Contact service, minimal Nginx patch and static-package production deployment.
- Public desktop/mobile checks plus one real Brand and one real Creator inbox/Reply-To acceptance test.
- Remote source synchronization and GitHub Pages closure only after every live gate passes.

## Locked Decisions

- Existing project directory: `flourishculturekol-site`.
- Marketing frontend remains static and Nginx-compatible.
- One loopback-only Contact relay is allowed; there is no database.
- Existing deployment scripts remain in place.
- `/review/` compatibility must be preserved.
- Credentials and tokens must never be stored in project files.
- Selected direction: Option 1 — Neon Culture Bridge.
- SMTP From is fixed to `business@flourish-culture.com`.
- Creator recipient is fixed to `irisa@flourishculture.com`.
- Brand recipient is fixed to `hannah@flourish-culture.com`.
- Visitor email appears only in Reply-To; no mailto submission flow remains.
- Production deployment was explicitly approved and completed on 2026-06-25;
  future production changes still require explicit approval.

## Files Expected

- `index.html`
- `styles.css`
- `script.js`
- `assets/`
- `docs/design-brief.md`
- `design-options/`
- `design-qa.md`
- `qa/`

## Blockers

- GitHub CLI authentication is currently invalid and must be restored before temporary artifact transfer, source synchronization or Pages closure.
- Any further Cloud Assistant `RunCommand`, including read-only shell content, requires explicit command-level confirmation.
- Production Turnstile Site/Secret values have not been installed.
- Historical backup contents, the v1.2.0 deployment backup and real inbox delivery remain unconfirmed.

## 2026-08-18 — v1.2.0 Local Release Candidate

- Replaced the two mailto flows with one accessible Brand/Creator form backed by a same-origin Node.js Contact API.
- Fixed immutable mail routing: Brand to `hannah@flourish-culture.com`, Creator to `irisa@flourishculture.com`, fixed SMTP From, validated visitor Reply-To.
- Added Turnstile server verification, signed one-hour form sessions, honeypot, strict validation, body/origin limits, IP/email rate limits, duplicate suppression and redacted security logs.
- Added a generic Privacy Notice and two approved AI-generated WebP images for Service 03 and Our Talent without changing the prior 35 image assets.
- Added a hardened systemd unit, allow-listed service package, atomic service deploy/rollback script, minimal Nginx API template and protected eight-key environment schema.
- Generated and audited the static and service archives; no assigned secret, forbidden filename or symlink was found.
- Added a strict public release checker for canonical redirects, security headers, APIs, exact file hashes and `/review/` regression.
- Fresh local verification passed 70/70 Node tests, both builds and the release checksum gate. Production remains **未完成** until the cloud/server, Turnstile, live browser, inbox, Reply-To, remote source and Pages gates are read back.

## 2026-08-18 — Production Read-only Preflight

- Re-authenticated Volcengine account `2103632597` and uniquely matched public IP `150.5.135.196` to running Hong Kong ECS `i-yeo9geadc0plsv0abgv0` (`webhkhome`).
- After explicit user confirmation, ran two bounded Cloud Assistant read-only commands. Both split commands succeeded; the earlier monolithic command timed out without output. No server file, service or network configuration was changed.
- Confirmed Ubuntu `22.04.5 LTS`, Nginx `1.18.0`, valid Nginx syntax, active Nginx and TikTok Review services, 8.0G available disk and the expected web/backup roots.
- Confirmed the loaded FLOURISH file is `/etc/nginx/conf.d/00-flourishculturekol.com.conf`; it contains both `/review/` on 8787 and previously undocumented `/review-staging/` on 8788, both of which are now locked for preservation.
- Hit a hard stop: `/usr/bin/node` is `v12.22.9`, npm version detection timed out, and the planned Contact runtime requires Node.js >= 20. No production write or upload followed.

## 2026-08-19 — Isolated Contact Runtime Adaptation

- The user-confirmed runtime audit invocation `ivk-yet5e54uae9ltzogxp6d` completed successfully with exit 0.
- Confirmed both Review services are independently running on Node 22 at ports 8787/8788, and local TLS/SNI health plus login redirect checks pass.
- Confirmed an existing `/opt/node-v24.17.0-linux-x64/bin/node` path is available for Contact without replacing system Node or Review's `/opt/nodejs` route.
- Updated the Contact unit and deploy script to use `/opt/flourish-contact/runtime/bin/node`; deployment now validates an explicit runtime target and atomically rolls back both release and runtime symlinks.
- Fresh runtime-contract tests passed 6/6; the full suite passed 70/70 when run with permitted loopback listening. Static and Contact builds both completed locally. Production remains **未完成**.

## 2026-06-24 — Feishu Whiteboard 3 Local Implementation

- Applied whiteboard 3 annotations locally only; no production deploy, Nginx, certificate, server, or `/review/` changes were made.
- Reworked the approved brand logo area into a larger centered title plus a dark-adapted horizontal auto-scrolling logo rail using the same seven approved brand assets; reduced-motion mode falls back to a static wrapped layout.
- Rebuilt the former Hong Kong bridge area as a `Who We Are` section with two dark red/black cards, local text-free SVG visuals, and responsive one-column stacking on smaller screens.
- Synced the same visual structure into `review-editable.html` so manual HTML annotation can continue from the updated local preview copy.
- Re-ran main-thread verification after the whiteboard 3 implementation: static tests, release build, Chrome responsive QA, and release archive validation all passed locally.

## 2026-06-24 — Remaining Feishu Module Pass

- Updated `index.html` and `review-editable.html` locally only; no production deploy, Nginx, certificate, server, `/review/`, API, database, cookie, analytics, or new-page changes were made.
- Rebuilt Services as three stronger blocks with exact Feishu `The Overview` and `What We Do` copy, plus local text chips for TikTok, YouTube, Instagram, Shorts, and Reels.
- Reworked Our Talent with the exact creator headline, subheadline, benefits, application form labels, image-plus-text layout, and `irisa@flourishculture.com` mailto target.
- Reworked About Us with exact `[Our Mission]` and `[The FLOURISH Advantage: Why HK & Why Us?]` copy in an image-plus-text composition.
- Reworked Contact Us with exact project inquiry headline, subheadline, fields, budget options, image-plus-text layout, and `flourishculture@outlook.com` mailto target.
- Updated tests to enforce the Feishu copy, separate recipients, field labels/options, image requirements, and mirrored editable-review content.
- Re-ran main-thread verification after the remaining-module pass: static tests, release build, Chrome responsive QA, and release archive validation passed locally; the browser QA script was updated for the new text-based creator demographics field.

## 2026-06-24 — Whole-page Visual Polish Pass

- Worked locally only as the implementation sub-agent; production deploy, Nginx, certificates, server config, `/review/`, APIs, databases, cookies, analytics, and new pages stayed untouched.
- Kept Feishu truth copy, anchors, mailto recipients, form field names, button labels, and static submission logic unchanged.
- Concentrated the polish in `styles.css`: card surface aliases, denser Services cards, more controlled media heights, clearer Overview/What We Do hierarchy, tighter Talent benefits/form rhythm, and shorter About/Contact imagery.
- Added a CSS-focused regression test that locks the social-first polish constraints while leaving existing exact-copy tests intact.

## 2026-06-24 — Creator and Bridge Asset Alignment Pass

- Worked locally only as the implementation sub-agent; production deploy, Nginx, certificates, server config, `/review/`, APIs, cookies, analytics, form recipients, and Feishu copy stayed untouched.
- Replaced the Services 01 text platform chips with accessible Remix Icon chips for TikTok, YouTube, Instagram, Shorts, and Reels; Shorts/Reels use generic video icons rather than fake official logos.
- Swapped the Talent image to `assets/talent-global-creator-network.png` and tightened the grid/media positioning so the red recruitment module reads more centered and less empty on the right.
- Swapped the About image to `assets/about-hk-cross-border-bridge.png` with alt text aligned to Hong Kong as an East-West and cross-border growth bridge.
- Main-thread verification for the polish pass: `npm test` passed with 20/20 tests, `npm run build` passed, Chrome responsive QA passed at all tracked viewports, and 1440px desktop page height reduced from 7021px to 6288px without changing locked Feishu copy.

## 2026-06-24 — UI Craft Spacing and Taste Polish Pass

- Worked locally only in the static homepage CSS/tests/docs; production deploy, Nginx, certificates, server config, `/review/`, APIs, cookies, analytics, form recipients, Feishu copy, and page structure stayed untouched.
- Applied the requested `ui-craft` detail pass by increasing the visual gutter between the About image and copy, reducing the oversized Logo/`Who We Are` display titles, and making the Hero-to-Logo and Logo-to-Bridge section boundaries more legible.
- Applied the requested taste/anti-AI polish by cooling and darkening generated imagery, adding restrained editorial grain/scan overlays, and cropping the Hong Kong bridge visual so it reads more like a designed background asset than raw AI output.
- Updated regression tests to lock the new spacing, headline scale, section divider, and image-treatment constraints.

## 2026-06-25 — Production Homepage Release

- Published `release/flourishculturekol-homepage.zip` to the production host `150.5.135.196` after explicit approval.
- Pre-release gates passed locally: static tests, release build, zip integrity check, and archive content check excluding `review-editable.html`, `qa/`, `design-options/`, and `archive/`.
- Production deploy used the static homepage script: uploaded the release zip and deployment script to `/tmp`, verified SHA256 on the server, backed up the existing web root, and copied the static files into `/var/www/flourishculturekol.com`.
- Server backup created at `/var/backups/flourishculturekol.com/20260625-114135`.
- Post-deploy issue found and fixed: homepage returned 403 because `cp -a "$STAGE/." "$WEB_ROOT/"` preserved the temporary extraction directory's restrictive mode on the web root. Restored web-readable static permissions on production and updated `deploy-cloud-assistant.sh` to set directory/file permissions after copying.
- Post-release verification passed: public homepage returned HTTP 200 with the new 22,079-byte HTML, CSS and key image/icon assets returned HTTP 200, `/review/healthz` remained healthy, and `/review/` still redirected to `/review/login`.

## 2026-06-25 — Production MIME Hotfix

- Fixed the production symptom where the homepage rendered as a mostly black/empty page after release.
- Root cause: `script.js` imported `site-core.mjs`, and production Nginx served `.mjs` as `application/octet-stream`. Browsers rejected the module import, so `script.js` never ran and `.reveal` sections stayed transparent.
- Renamed the shared browser module to `site-core.js`, updated `script.js`, tests, build packaging, and the deployment script's required-file check.
- Added a regression test to prevent the release path from reintroducing `.mjs` browser module imports.
- Rebuilt and published the hotfix package to production. Server backup created at `/var/backups/flourishculturekol.com/20260625-135253`.
- Verification after hotfix: `site-core.js` returns `application/javascript`, `script.js` imports `./site-core.js`, Chrome console has no errors, the first screen visibly renders the hero copy/images, all homepage image URLs return HTTP 200, `/review/healthz` remains healthy, and Nginx config still passes.

## 2026-06-26 — v1.1.0 Production Homepage Release

- Pulled GitHub `main` from `https://github.com/zhangdecheng/website` and fast-forwarded the local repository to `3e33cd6`, matching package version `1.1.0`.
- Confirmed `www.flourishculturekol.com` and `flourishculturekol.com` both resolve to the current homepage host `150.5.135.196`.
- Checked the candidate instance `AI-OpenClaw-b6uN-000` / `118.196.85.61` and confirmed it is not the current homepage target: HTTPS with the FLOURISH host redirects to `/todolist/`.
- Rebuilt the release archive and verified local gates: `npm test` passed with 21/21 tests, `npm run build` succeeded, and `release/flourishculturekol-homepage.zip` SHA256 was `10a8f930776f54866e459455ed8ec15545ed9f7c6a50ff7358864fb80d63660e`.
- Published the verified package to `150.5.135.196` using the static homepage deployment script. Server-side SHA256 matched the local archive before deployment.
- Server backup created at `/var/backups/flourishculturekol.com/20260626-000044`.
- Post-release verification passed: public homepage returns the v1.1.0 21,604-byte HTML, `index.html`, `styles.css`, `script.js`, and `site-core.js` hashes match local `dist/`, new JPEG assets return HTTP 200 with valid dimensions, `/review/healthz` remains healthy at review version `2.0.4`, and `/review/` still redirects to `/review/login`.

## 2026-06-26 — Minimal Asset Production Homepage Release

- Updated the release build to copy only the static files and assets actually needed by the homepage instead of the entire `assets/` tree.
- The production build rewrites photo fallbacks to the matching compressed WebP assets, keeps required brand logos, fonts, and Remix Icon WOFF2, and excludes source JPG/PNG photos from the release archive.
- Local gates passed: `npm test` passed with 21/21 tests, `npm run build` succeeded, and `release/flourishculturekol-homepage.zip` was rebuilt as a 988 KB archive with SHA256 `96d36e6aef3319076daf105fbe6d519fc20d90f11abb772b84e3646d96fa8992`.
- Published the verified minimal package to `150.5.135.196` by using a temporary GitHub artifact branch for transfer, downloading it to `/tmp` on the server, verifying SHA256, then deleting the temporary branch after deployment.
- Server backup created at `/var/backups/flourishculturekol.com/20260626-113529`.
- Post-release verification passed: public `index.html`, `styles.css`, `script.js`, and `site-core.js` hashes match local `dist/`; key WebP assets and `remixicon.woff2` return HTTP 200; `/review/healthz` remains healthy at review version `2.0.4`; Nginx config passes.
