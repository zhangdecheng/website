# FLOURISH CULTURE Website

Static English marketing website for `flourishculturekol.com`, based on the
approved “Neon Culture Bridge” visual direction.

## Local preview

```bash
npm run serve
```

Open `http://127.0.0.1:4173`.

For manual review edits, open:

```text
http://127.0.0.1:4173/review-editable.html
```

`review-editable.html` is a local-only annotated copy for trying text, spacing,
and section-structure adjustments. Confirmed changes should be synced back into
`index.html` / `styles.css` before final QA. The release build intentionally
excludes this review helper page.

## Test and build

```bash
npm ci
npm test
npm run build
npm run build:contact
node scripts/browser-qa.cjs
cd dist && zip -qr ../release/flourishculturekol-homepage.zip .
cd .. && tar -C release/contact-service -czf release/flourish-contact-service.tgz .
```

Final Chrome evidence and the pass report are stored in `qa/` and
`design-qa.md`. The approved mockup and its section crops are stored in
`design-options/`. Visual QA uses equal-width, section-aligned comparison
boards; it never stretches full-page images to equal height.

Version 1.2.0 keeps the marketing frontend static but adds a same-origin,
loopback-only Contact API. The browser validates the unified Brand/Creator form,
uses Cloudflare Turnstile, and submits JSON without opening a mail client. The
service authenticates as `business@flourish-culture.com`; Brand inquiries route
to `hannah@flourish-culture.com`, Creator applications route to
`irisa@flourishculture.com`, and the validated visitor address is used only as
Reply-To. There is no database or analytics integration.

## Project documentation

- Project handoff and production notes: `docs/PROJECT_HANDOFF.md`
- Production release and rollback runbook: `docs/PRODUCTION_RUNBOOK.md`
- Latest production preflight evidence: `qa/production-preflight-2026-08-18.md`
- Asset inventory and handling rules: `docs/ASSET_MANIFEST.md`
- Change history: `docs/CHANGELOG.md`
- Detailed progress log: `PROJECT_PROGRESS.md`
- Visual QA record: `design-qa.md`
- Approved design source of truth: `design-options/neon-culture-bridge.png`

This project is now organized as a local Git repository. Source files,
documentation, design references, QA evidence, Feishu annotation exports, and
the archived white/green draft are tracked. Generated dependencies and release
outputs such as `node_modules/`, `dist/`, and `release/` are ignored and
can be recreated with the commands above.

## Server deployment

The release is intentionally not deployed automatically. Version 1.2.0 requires
the protected Contact service, a minimal Nginx patch, and the static package;
do not deploy only the frontend because the form would have no working API.

Follow `docs/PRODUCTION_RUNBOOK.md`. Before any write, authenticate to the correct
cloud account, match the instance to public IP `150.5.135.196`, inspect
`nginx -T`, verify Node.js >= 20 and `/review/healthz`, and create readable
rollback evidence. Private Turnstile/SMTP values must be entered directly in a
protected server session and must never be put in Git, chat, screenshots, or
Cloud Assistant command output.

As of 2026-08-18, the v1.2.0 release is locally verified but **not yet confirmed
deployed to production**.

## Recovery

- The previous white/green Chinese draft is retained under
  `archive/2026-06-19-white-green-draft/`.
- The approved visual truth is
  `design-options/neon-culture-bridge.png`.
- Clear canonical section references are retained under
  `design-options/sections/`.
- Resume from `PROJECT_PROGRESS.md`.
