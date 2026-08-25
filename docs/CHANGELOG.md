# FLOURISH CULTURE Website Changelog

## Project version records

Current source version: `v1.2.0-logo-rail-20260822` archived locally and live in production.
The package/API version remains `v1.2.0`; actual inbox/Reply-To and remote-source
acceptance remain incomplete.

## 2026-08-24

### Unreleased homepage visual candidate

- Added the approved transparent FLOURISH lockup and square favicon mark across the homepage, Privacy Notice and editable review copy.
- Changed the logo rail to one accessible source set; `script.js` now creates the decorative duplicate for scrolling. The approved order is Tripo, Temu, Anker Innovations, uSmile, Dreame, AliExpress, Lovart, Atoms and KSP Performance.
- Reworked the Hero media into a responsive two-landscape/one-portrait grid using `object-fit: contain`, so each supplied image remains fully visible.
- Added the English “Official Partnership” proof section between Who We Are and Services, with transparent TAP and CAP badge derivatives on the left and partner copy on the right.
- Re-exported the TAP/CAP badges from the complete supplied reference after detecting a clipped TAP contour; reduced the header lockup and added explicit badge padding so neither treatment touches its container edges.
- Replaced brightness-based badge background removal with edge-connected background removal; verified the exterior edge columns are transparent while TAP/CAP letter highlights remain intact.
- Standardized the three Service media panels as 50/50 cards with centered 16:10 complete-image frames, dark matte breathing room, safe heading wrapping, and no hover zoom crop.
- This is a local source candidate only: no archive, production deployment, rollback snapshot or public read-back has been performed.

| Version | Date | Status | Notes |
| --- | --- | --- | --- |
| `v1.2.0-logo-rail-20260822` | 2026-08-22 | Archived locally and production live | Transparent Atoms/TRIPO assets, optical sizing, deterministic static package, production backup and public read-back. |
| `v1.2.0` | 2026-08-20 | Production URL ready; final closure incomplete | Unified Contact flow, privacy, abuse controls, approved AI images, portable production tooling, canonical routing and accepted real submissions. |
| `v1.1.0` | 2026-06-26 | Historical production record | Static homepage release. |
| `v1.0.0` | 2026-06-26 | Historical record | Baseline project version record for documentation and handoff tracking. |

## 2026-08-22

### v1.2.0-logo-rail-20260822 source archive and static release

- Preserved the supplied Atoms source as `assets/brand-logos/atoms.jpg` and added
  the transparent white production asset `atoms-transparent.png`.
- Cropped TRIPO to its visible transparent-pixel bounds as
  `tripo-transparent-cropped.png`; the source asset remains available for rollback/reference.
- Synchronized the eight-logo rail and its duplicated accessible loop in both
  `index.html` and `review-editable.html`, including desktop/mobile optical sizing.
- Built the deterministic static ZIP: `6,744,747` bytes,
  SHA-256 `c8007cdcc75d11f3d07d8c6f2b32351cd459c8ce5fc3f7d5c0d01fe7caa674ab`.
- Published candidate `08646fc` to ECS and read back homepage hash
  `08646fc0748ace6e1c0aa62f646aef2cea68abbfb088fbe42918585e309b9f70`, CSS hash
  `9c6b0b61bc18ae38d9d83af8ce27a9f3cd7f92c14292cb6bf8441766ed661c6e`, and both
  Logo PNG hashes from the public site.
- Created the protected rollback snapshot
  `/var/backups/flourishculturekol.com/20260822T115118Z-v1.2.0-static-08646fc`.
- Local `site.test.mjs` passed 26/26; `release.test.mjs` passed 20/20; the ECS
  production checker passed all canonical, API, security-header, MIME, Logo and
  `/review/` checks. Temporary GitHub transfer branches were deleted after use.
- Inbox/Reply-To readback and authenticated remote source synchronization remain
  separate, incomplete gates.

### Coding workflow hardening

- Added `docs/CODING_WORKFLOW.md` to freeze scope before implementation, separate
  visual/functional/production acceptance, require archive-before-deploy, and
  keep unconfirmed inbox/remote/Review gates explicit.
- Added `npm run release:verify`, which rebuilds deterministic production artifacts,
  runs the core static/release/Contact tests and performs four-viewport Chrome QA
  without connecting to production.

## 2026-08-20

### v1.2.0 core production release

- Installed the protected eight-key Contact environment without printing or
  committing secret values; deployed the loopback-only Contact service through
  isolated Node 24 and confirmed active/enabled state, public field boundary and
  SMTP authentication preflight.
- Staged and verified the portable 11-file core release transfer, then created exact
  predeploy and pre-static rollback snapshots with read-back checksum evidence.
- Added archive portability/safety fixes for GNU tar and systemd-safe SMTP
  authorization-code serialization.
- Replaced the production Nginx source with canonical apex/www routing, scoped
  Contact proxy and static-page security headers while preserving Review
  production/staging blocks. The first immediate post-reload probe exercised and
  verified automatic rollback; the second cutover waited for worker convergence
  and passed.
- Published the v1.2.0 static site. Server-side and independent external checks
  passed for DNS, redirects, TLS, homepage/Privacy, API, MIME, exact hashes, two
  approved AI images and `/review/` health/login protection.
- Re-ran system Chrome QA at four viewports with no recorded failures. A
  synthetic invalid Turnstile token was correctly rejected before SMTP.
- Added allow-listed Siteverify diagnostics after real widget submissions still
  returned `403`; request `471c2340-0dab-4269-bb4e-7124a7a1e5ee` proved the
  former production Turnstile Secret was invalid for the public Site Key. No mail
  send occurred. The protected environment was later recreated without exposing
  values; only a fresh real token can confirm the replacement.
- Added a hidden, single-key Turnstile rotation tool with atomic replacement and
  rollback. Follow-up commit `ac8f54e` arms rollback before replacement and proves
  restoration for signal, restart and health-check failures; follow-up `d3f4d05`
  explicitly reports a failed rollback restart/health recovery. All tar layers now use
  a portable deterministic ustar writer with canonical UTC metadata and member order;
  Shanghai/UTC builds are byte-identical, the transfer has 12 regular files, and the
  complete suite passes 86/86.
- Reconciled GitHub `main` history without changing the reviewed tree, preserved
  image loading dimensions/priorities, and fixed the 1024px Hero CTA clipping.
- Published the final static ZIP (`af10b1f4…07253`) to ECS with production
  homepage/styles hashes `7339fe4e…33f2` and `61afde1b…2824`; independent direct
  HTTPS readback, Contact/Review regression checks and all security headers pass.
- Replaced the permissive static copy helper with a pinned transactional rollout:
  it creates an exact checksum backup, rolls back only the web root on failure,
  leaves Nginx untouched, and verifies Contact/Review. Commit `474bd69` also fixes
  the backup root to `0700`; the deployed 51-file snapshot was corrected and read
  back at `root:root 0700` with its `0600` manifest fully valid.
- Added review hardening in `ef61222`: the public validation script is pinned by SHA-256,
  backup contents live behind a continuously private `0700` wrapper, rollback checks the
  full generated manifest, and executable fault injection proves exact restore plus failure
  propagation. The complete suite passes 86/86.
- Recreated the protected Turnstile configuration and completed real Brand and Creator
  Managed Turnstile submissions; both showed the public success state and logged
  `outcome=accepted` without exposing form content or credentials.
- Corrected the Creator recipient to `irisa@flourish-culture.com`, added regression coverage,
  rebuilt the Contact artifact (`ddb674d7…72aa3b`) and deployed release
  `/opt/flourish-contact/releases/20260820T110838Z`. The corrected Creator retry request
  `6129340b-43d5-4475-83c2-81362c178e8a` was accepted.
- Re-ran the full 86-test suite, 19 release tests and the canonical production checker on
  ECS with Node 24; all passed. Actual Hannah/Irisa inbox arrival and Reply-To remain unconfirmed.
- Both Temu query systemd units are now `disabled/inactive`; the Compose-managed
  query container/network were removed by the unit's declared stop action, both
  named data volumes remain, and the bridge container remains exited.
- Brand/Creator inbox delivery, Reply-To, authenticated remote push and GitHub Pages
  deletion/readback remain **未完成**; remote `main`
  history itself is already reconciled locally by merge commit `94cb2ab`.

## 2026-08-19

### v1.2.0 isolated production runtime

- Confirmed Review production/staging use independent Node 22 processes and pass local TLS/SNI checks.
- Adapted the Contact unit and deploy script to an atomic `/opt/flourish-contact/runtime` symlink targeting the server's separate Node 24 installation.
- Added release-contract coverage for explicit runtime validation and rollback of both release and runtime symlinks; production deployment remains incomplete pending protected secrets and live acceptance.
- Fixed stale server field errors so correcting an invalid field cannot leave native validation blocking a retry; the four-viewport browser gate and complete 71/71 test suite pass.
- Added a reproducible transfer builder that strips macOS AppleDouble metadata and independently enforces the exact nine-regular-file allow-list. The first ECS staging attempt rejected the earlier archive before extraction because GNU tar exposed nine hidden `._` entries; production was not modified.
- Repinned the corrected, byte-reproducible nine-file transfer archive at SHA-256 `4b000bdd6d2b1aab7354fe6c1d63e19650d669280949271914330e51ff0d65d1`; production deployment remains incomplete.

## 2026-08-18

### v1.2.0 local release candidate

- Replaced mailto submission with one same-origin Brand/Creator form and a loopback-only Node.js Contact service.
- Fixed Brand routing to `hannah@flourish-culture.com`, Creator routing to `irisa@flourish-culture.com`, SMTP From to `business@flourish-culture.com`, and visitor email to Reply-To only.
- Added Cloudflare Turnstile server verification, signed form sessions, honeypot, input/origin/body controls, rate limits, duplicate suppression and privacy-safe logs.
- Added a generic Privacy Notice plus approved Service 03 and Our Talent AI images while preserving the earlier image inventory.
- Added deterministic service packaging, hardened systemd/Nginx templates, safe service rollback, immutable release hashes and strict public acceptance checks.
- Fresh local gates passed 70/70 tests and both builds. No production deployment, live inbox acceptance, remote push or GitHub Pages deletion has yet been confirmed.

## 2026-06-26

### v1.1.0 production homepage release

- Pulled GitHub `main` at commit `3e33cd6` and released package version `1.1.0`.
- Confirmed the active production homepage target is `150.5.135.196`, while `AI-OpenClaw-b6uN-000` / `118.196.85.61` is not the current homepage host.
- Published the verified static release archive and created production backup `/var/backups/flourishculturekol.com/20260626-000044`.
- Verified public homepage files match local `dist/`, new image assets return HTTP 200 with valid dimensions, and `/review/` health and login redirect behavior remain intact.

### Minimal asset production release

- Reduced the homepage release archive to 988 KB by packaging only required static assets and compressed WebP photos.
- Published the minimal package to production and created backup `/var/backups/flourishculturekol.com/20260626-113529`.
- Verified public homepage file hashes, key WebP assets, `remixicon.woff2`, Nginx syntax, and `/review/healthz`.

## 2026-06-25

### Production homepage release

- Published the approved black/red English static homepage to production.
- Preserved `/review/` compatibility and verified `/review/healthz` after release.
- Added production deployment notes and backup paths to `PROJECT_PROGRESS.md`.

### Production MIME hotfix

- Fixed production black/empty page caused by `.mjs` being served as `application/octet-stream`.
- Renamed `site-core.mjs` to `site-core.js`.
- Updated `script.js`, `tests/site.test.mjs`, `scripts/build-release.mjs`, and `deploy-cloud-assistant.sh`.
- Added a regression test to prevent `.mjs` browser module imports from reappearing in the release path.

## 2026-06-24

- Completed whole-page visual polish pass.
- Adjusted About spacing, Logo/Who We Are title scale, and section boundaries.
- Added anti-AI image treatment through darker crops, editorial grain, and restrained overlays.
- Replaced text social tags with accessible Remix Icon platform chips.
- Added new Talent and About image assets aligned to creator growth and Hong Kong cross-border positioning.
- Rebuilt the logo rail and Who We Are bridge section from Feishu whiteboard annotations.
- Synced `review-editable.html` with the current production page structure for manual annotation workflows.

## 2026-06-19 to 2026-06-23

- Archived the previous white/green Chinese draft under `archive/2026-06-19-white-green-draft/`.
- Rebuilt the site as a static English single-page homepage based on Option 1, “Neon Culture Bridge”.
- Split the site into `index.html`, `styles.css`, `script.js`, shared browser logic, and `assets/`.
- Added design options, section references, visual QA outputs, and project progress tracking.
