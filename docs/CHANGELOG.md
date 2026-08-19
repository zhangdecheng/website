# FLOURISH CULTURE Website Changelog

## Project version records

Current source version: `v1.2.0` local release candidate

| Version | Date | Status | Notes |
| --- | --- | --- | --- |
| `v1.2.0` | 2026-08-18 | Locally verified; production incomplete | Unified Contact flow, privacy, abuse controls, approved AI images and deterministic production tooling. |
| `v1.1.0` | 2026-06-26 | Historical production record | Static homepage release. |
| `v1.0.0` | 2026-06-26 | Historical record | Baseline project version record for documentation and handoff tracking. |

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
- Fixed Brand routing to `hannah@flourish-culture.com`, Creator routing to `irisa@flourishculture.com`, SMTP From to `business@flourish-culture.com`, and visitor email to Reply-To only.
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
