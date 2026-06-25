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
npm test
npm run build
cd dist && zip -qr ../release/flourishculturekol-homepage.zip .
```

Final Chrome evidence and the pass report are stored in `qa/` and
`design-qa.md`. The approved mockup and its section crops are stored in
`design-options/`. Visual QA uses equal-width, section-aligned comparison
boards; it never stretches full-page images to equal height.

The site has no API, database, cookies, analytics, or server-side form handler.
Both forms validate in the browser and open a prefilled email: creator
applications go to `irisa@flourishculture.com`, and project inquiries go to
`flourishculture@outlook.com`.

## Project documentation

- Project handoff and production notes: `docs/PROJECT_HANDOFF.md`
- Asset inventory and handling rules: `docs/ASSET_MANIFEST.md`
- Change history: `docs/CHANGELOG.md`
- Detailed progress log: `PROJECT_PROGRESS.md`
- Visual QA record: `design-qa.md`
- Approved design source of truth: `design-options/neon-culture-bridge.png`

This project is now organized as a local Git repository. Source files,
documentation, design references, QA evidence, Feishu annotation exports, and
the archived white/green draft are tracked. Generated dependencies and release
outputs such as `node_modules/`, `dist/`, and `release/*.zip` are ignored and
can be recreated with the commands above.

## Server deployment

The release is intentionally not deployed automatically.

1. Upload `release/flourishculturekol-homepage.zip` to the server.
2. Run `deploy-cloud-assistant.sh /path/to/flourishculturekol-homepage.zip` as
   a user allowed to write the website root.

The script backs up the existing web root and copies the packaged static files.
It does not write Nginx configuration, certificates, or `/review/` application
files and does not use deletion-based synchronization.

## Recovery

- The previous white/green Chinese draft is retained under
  `archive/2026-06-19-white-green-draft/`.
- The approved visual truth is
  `design-options/neon-culture-bridge.png`.
- Clear canonical section references are retained under
  `design-options/sections/`.
- Resume from `PROJECT_PROGRESS.md`.
