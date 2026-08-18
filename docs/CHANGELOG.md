# FLOURISH CULTURE Website Changelog

## Project version records

Current recorded project version: `v1.0.0`

| Version | Date | Status | Notes |
| --- | --- | --- | --- |
| `v1.0.0` | 2026-06-26 | Current recorded version | Baseline project version record for documentation and handoff tracking. |

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
