# FLOURISH Production Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Package, stage and release the static site plus Contact API to the existing production host with secure credentials, canonical www routing, verified real email delivery, protected `/review/`, reproducible source, and a tested rollback path.

**Architecture:** Static files continue to live in `/var/www/flourishculturekol.com`; the Node service is deployed in versioned directories under `/opt/flourish-contact/releases` with atomic `current` and `runtime` symlinks plus a hardened systemd unit. Existing Nginx configuration is inspected first, then minimally patched to redirect apex to www, proxy only `/api/contact`, and scope static-page security headers without altering `/review/` routing.

**Tech Stack:** Existing release builder, Node.js/Nodemailer service artifact, systemd, Nginx, Volcengine/BytePlus host, Yunyou SMTP TLS 465, Cloudflare Turnstile, Git/GitHub CLI, curl/OpenSSL, existing `/review/healthz` checks.

---

## Hard gates

- Execute only after the API, UI and AI asset plans are green and committed.
- Never paste SMTP authorization code or Turnstile Secret Key into chat, a shell argument, Git, build output, screenshots or logs.
- Do not replace a production Nginx file until `nginx -T` proves which file owns both hostname server blocks and `/review/`.
- Do not close GitHub Pages until public www/apex/API/Privacy, two real inboxes, Reply-To, and `/review/` all pass.
- If production access, Node runtime, Cloudflare keys, SMTP auth or inbox confirmation is unavailable, stop at the corresponding gate and report “未完成”; do not infer success.

## File responsibility map

- `ops/flourish-contact.service` — hardened loopback Contact API systemd unit.
- `ops/nginx/flourish-contact-api.conf` — minimal include snippet for API proxy.
- `scripts/build-contact-release.mjs` — deterministic backend staging directory without secrets/tests.
- `scripts/deploy-contact-service.sh` — versioned service install, explicit isolated runtime validation, health check and two-symlink rollback.
- `tests/release.test.mjs` — artifact, unit, Nginx snippet and secret-exclusion contract.
- `.gitignore` — ignore every generated release artifact and staging directory.
- `docs/PRODUCTION_RUNBOOK.md` — exact configuration, backup, validation and rollback record.
- `deploy-cloud-assistant.sh` — existing static deploy, expanded earlier to require new UI assets.
- `check-https-cloud-assistant.sh` — public homepage/API/Privacy/review verification after Nginx changes.
- `PROJECT_PROGRESS.md`, `docs/PROJECT_HANDOFF.md`, `docs/CHANGELOG.md` — evidence-backed final records only after actual checks.

### Task 1: Perform a read-only production preflight

**Files:**
- Create: `qa/production-preflight-2026-08-18.md`

- [ ] **Step 1: Capture current public behavior before touching the server**

Run from local machine and record status, redirect location, server header, certificate names/dates and body hashes:

```bash
curl -fsS -D /private/tmp/flourish-www.headers https://www.flourishculturekol.com/ -o /private/tmp/flourish-www.html
curl -fsS -D /private/tmp/flourish-apex.headers https://flourishculturekol.com/ -o /private/tmp/flourish-apex.html
curl -fsSI https://www.flourishculturekol.com/review/healthz
curl -fsSI https://www.flourishculturekol.com/review/
shasum -a 256 /private/tmp/flourish-www.html /private/tmp/flourish-apex.html
```

Expected before release based on the last audit: both HTTPS hosts currently return 200 rather than apex redirect; `/review/healthz` returns 200 and `/review/` redirects to login. Treat any difference as a new fact and update the plan execution record before proceeding.

- [ ] **Step 2: Resolve the production target again**

Run:

```bash
dig +short A flourishculturekol.com
dig +short A www.flourishculturekol.com
```

Expected: both resolve to `150.5.135.196`. If either does not, stop; do not deploy to the historical IP.

- [ ] **Step 3: Use the Volcengine Cloud Assistant path only for read-only inspection**

On the instance that currently owns `150.5.135.196`, run without printing environment-file contents:

```bash
set -euo pipefail
hostname
uname -a
id
node --version || true
npm --version || true
nginx -v
nginx -T
systemctl is-active nginx
systemctl status nginx --no-pager
systemctl status tiktok-review-agent --no-pager || true
curl -fsS http://127.0.0.1/review/healthz -H 'Host: www.flourishculturekol.com'
stat -c '%U:%G %a %n' /var/www/flourishculturekol.com /var/backups/flourishculturekol.com
df -h /var /opt
```

Redact certificate private-key paths only if the command output would disclose sensitive operational detail; never record environment values. Confirm actual Nginx source files from the `# configuration file ...` markers in `nginx -T`.

- [ ] **Step 4: Write the evidence record**

In `qa/production-preflight-2026-08-18.md`, record confirmed host/IP, OS, Node/npm version or absence, Nginx version/source files, web root owner/mode, free disk, active services, `/review/` behavior, current certificate SAN/expiry, and the exact commands used. Clearly label anything unavailable as “未确认”.

- [ ] **Step 5: Apply the preflight stop conditions**

Stop before any write if: target IP differs; Node is below 20 and no approved runtime path exists; Nginx config cannot be read; web root/backup disk is insufficient; `/review/healthz` is not healthy; production command execution identity cannot create backups or systemd/Nginx configuration. Commit the evidence only when it contains no secrets:

```bash
git add -- qa/production-preflight-2026-08-18.md
git commit -m "docs: record production release preflight"
```

### Task 2: Build tested operational artifacts

**Files:**
- Create: `ops/flourish-contact.service`
- Create: `ops/nginx/flourish-contact-api.conf`
- Create: `scripts/build-contact-release.mjs`
- Create: `scripts/deploy-contact-service.sh`
- Create: `tests/release.test.mjs`
- Modify: `package.json`
- Modify: `.gitignore`

- [ ] **Step 1: Write failing release-contract tests**

Create `tests/release.test.mjs` to assert:

```js
test("systemd unit is loopback-service hardened and reads one protected env file", async () => {
  const unit = await readFile(new URL("../ops/flourish-contact.service", import.meta.url), "utf8");
  for (const line of [
    "EnvironmentFile=/etc/flourish-contact.env",
    "WorkingDirectory=/opt/flourish-contact/current",
    "ExecStartPre=/opt/flourish-contact/runtime/bin/node server/smtp-check.js",
    "ExecStart=/opt/flourish-contact/runtime/bin/node server/index.js",
    "User=flourish-contact",
    "NoNewPrivileges=true",
    "PrivateTmp=true",
    "ProtectSystem=strict",
    "ProtectHome=true",
    "Restart=on-failure",
  ]) assert.match(unit, new RegExp(line.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});

test("nginx snippet proxies only the contact API and sets the real IP itself", async () => {
  const nginx = await readFile(new URL("../ops/nginx/flourish-contact-api.conf", import.meta.url), "utf8");
  assert.match(nginx, /location = \/api\/contact/);
  assert.match(nginx, /location \^~ \/api\/contact\//);
  assert.match(nginx, /proxy_pass http:\/\/127\.0\.0\.1:3101/);
  assert.match(nginx, /proxy_set_header X-Real-IP \$remote_addr/);
  assert.match(nginx, /client_max_body_size 32k/);
  assert.doesNotMatch(nginx, /review|proxy_set_header X-Forwarded-For \$http_x_forwarded_for/);
});
```

Also assert the contact build copies only `server/`, `package.json`, `package-lock.json` and the service unit; excludes `node_modules`, tests, every `.env` variant, logs, docs and frontend assets; and that the deploy script verifies an explicit Node >=20 runtime, creates a versioned release, runs `npm ci --omit=dev --ignore-scripts` through that runtime, atomically flips `/opt/flourish-contact/current` and `/opt/flourish-contact/runtime`, checks loopback health, and rolls both symlinks back on failure.

- [ ] **Step 2: Run and verify missing-artifact failures**

Run: `node --test tests/release.test.mjs`

Expected: FAIL because the ops files and build script do not exist.

- [ ] **Step 3: Create the hardened systemd unit and Nginx include**

Create `ops/flourish-contact.service`:

```ini
[Unit]
Description=FLOURISH website contact API
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=flourish-contact
Group=flourish-contact
WorkingDirectory=/opt/flourish-contact/current
EnvironmentFile=/etc/flourish-contact.env
ExecStartPre=/opt/flourish-contact/runtime/bin/node server/smtp-check.js
ExecStart=/opt/flourish-contact/runtime/bin/node server/index.js
Restart=on-failure
RestartSec=3
TimeoutStopSec=15
NoNewPrivileges=true
PrivateTmp=true
PrivateDevices=true
ProtectSystem=strict
ProtectHome=true
ProtectKernelTunables=true
ProtectKernelModules=true
ProtectControlGroups=true
RestrictSUIDSGID=true
LockPersonality=true
RestrictAddressFamilies=AF_UNIX AF_INET AF_INET6
MemoryMax=256M
TasksMax=64

[Install]
WantedBy=multi-user.target
```

Create `ops/nginx/flourish-contact-api.conf`:

```nginx
location = /api/contact {
    client_max_body_size 32k;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_pass http://127.0.0.1:3101;
}

location ^~ /api/contact/ {
    client_max_body_size 32k;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_pass http://127.0.0.1:3101;
}
```

- [ ] **Step 4: Implement deterministic backend build/deploy scripts**

`scripts/build-contact-release.mjs` must empty `release/contact-service`, copy the explicit allowed paths, recursively reject symlinks and filenames matching `.env`, `secret`, `token`, `.pem`, `.key`, `.log`, and print a sorted file list plus byte count.

`scripts/deploy-contact-service.sh` must use `set -euo pipefail`, accept an explicit `.tgz` plus absolute Node runtime directory, stage with `mktemp -d`, validate required files, require runtime Node major >=20 and working npm, create a release directory named by `date -u +%Y%m%dT%H%M%SZ` under `/opt/flourish-contact/releases`, install production dependencies through that runtime, atomically update `current` plus `runtime`, restart `flourish-contact`, poll `http://127.0.0.1:3101/api/contact/health`, and restore both prior symlinks/service when the poll fails. It must not read/print `/etc/flourish-contact.env`, edit Nginx, delete old releases, alter system/Review Node, or touch `/review/`.

Add scripts:

```json
{
  "build:contact": "node scripts/build-contact-release.mjs",
  "test:release": "node --test tests/release.test.mjs"
}
```

Replace the narrow release ignore rule in `.gitignore` with:

```gitignore
# Generated release artifacts and staging directories
release/
```

- [ ] **Step 5: Run tests, build and commit**

Run separately:

```bash
npm run test:release
npm run build:contact
find release/contact-service -type f | sort
```

Expected: tests pass; only the allow-listed backend files appear.

Commit:

```bash
git add -- ops scripts/build-contact-release.mjs scripts/deploy-contact-service.sh tests/release.test.mjs package.json package-lock.json .gitignore
git commit -m "ops: package the contact service safely"
```

### Task 3: Build and audit immutable release archives

**Files:**
- Generated, not committed: `release/flourishculturekol-homepage.zip`
- Generated, not committed: `release/flourish-contact-service.tgz`
- Create: `release/SHA256SUMS` only for transfer, not Git

- [ ] **Step 1: Run every local gate from a fresh dependency install**

```bash
npm ci
npm test
npm run build
npm run build:contact
node scripts/browser-qa.cjs
```

Expected: all commands exit 0 using the current commit.

- [ ] **Step 2: Create the two archives**

```bash
mkdir -p release
cd dist
zip -qr ../release/flourishculturekol-homepage.zip .
cd ..
tar -C release/contact-service -czf release/flourish-contact-service.tgz .
```

- [ ] **Step 3: Prove archive contents and absence of secrets**

```bash
unzip -l release/flourishculturekol-homepage.zip
tar -tzf release/flourish-contact-service.tgz
rg -n --hidden --glob '!node_modules/**' --glob '!release/**' "CONTACT_TURNSTILE_SECRET=.+|SMTP_PASSWORD=.+|CONTACT_SECURITY_SECRET=.+" .
```

Expected: static archive includes Privacy/module/new images; service archive includes only allow-listed files; secret scan finds no assigned value.

- [ ] **Step 4: Hash the archives**

```bash
shasum -a 256 release/flourishculturekol-homepage.zip release/flourish-contact-service.tgz > release/SHA256SUMS
cat release/SHA256SUMS
```

Record both hashes in the release runbook before transfer.

- [ ] **Step 5: Confirm the source commit is reproducible**

Run: `git status --short --branch`

Expected: no source changes; only ignored/generated release files. Record `git rev-parse HEAD` in the runbook.

### Task 4: Guide the user through Turnstile and protected server secrets

**Files:**
- Create: `docs/PRODUCTION_RUNBOOK.md`
- Production write later: `/etc/flourish-contact.env` (never committed or echoed)

- [ ] **Step 1: Guide Turnstile widget creation without taking credentials into chat**

In Cloudflare Dashboard: open **Turnstile → Add widget**; use widget name `FLOURISH Website Contact`; add hostnames `www.flourishculturekol.com` and `flourishculturekol.com` without protocol/path; choose **Managed** mode; save. Cloudflare currently documents Managed as the recommended adaptive mode, Site Key as public, Secret Key as private, server-side Siteverify as mandatory, and tokens as single-use with a five-minute lifetime.

Official references to put in the runbook:

- `https://developers.cloudflare.com/turnstile/get-started/`
- `https://developers.cloudflare.com/turnstile/get-started/server-side-validation/`
- `https://developers.cloudflare.com/turnstile/concepts/widget/`

The user may share the Site Key because it is public. They must not paste the Secret Key into chat.

- [ ] **Step 2: Create the production environment file through a private server-console path**

Have the user enter the Turnstile Secret and SMTP authorization code directly in a protected server editor/session. The resulting file must contain exactly these keys:

```dotenv
CONTACT_PORT=3101
CONTACT_TURNSTILE_SITE_KEY=
CONTACT_TURNSTILE_SECRET=
CONTACT_SECURITY_SECRET=
SMTP_HOST=smtp.yunyou.top
SMTP_PORT=465
SMTP_USER=business@flourish-culture.com
SMTP_PASSWORD=
```

The empty values above describe the file schema, not a deployable file. In the private session, enter the public Site Key, the private Turnstile Secret, and the private SMTP authorization code; generate a 48-byte security secret on the server without printing it to shared logs. Refuse to start the service while any value is empty, then set owner/mode `root:flourish-contact 640`.

- [ ] **Step 3: Verify only names, permissions and non-empty status**

Use a server-side check that prints key names and `set/unset` only, never values. Confirm exactly eight required values are set, the file is not group/world writable, and service user can read it while unrelated users cannot.

- [ ] **Step 4: Record confirmed versus unconfirmed mail-domain facts**

Record: MX/SPF/DMARC were previously observed; live SMTP authentication, DKIM, SMTPUTF8 and inbox placement remain unconfirmed until Tasks 5 and 8. Do not describe DNS records as sufficient proof of delivery.

- [ ] **Step 5: Stop if the credentials cannot be installed privately**

Do not accept a workaround that puts secrets in Git, a command argument, a public paste, a screenshot or chat. Mark production deployment “未完成” until the private entry path succeeds.

### Task 5: Stage and verify the Contact service before Nginx exposure

**Files:**
- Production: a UTC timestamp-named directory under `/opt/flourish-contact/releases/`
- Production: `/opt/flourish-contact/current`
- Production: `/opt/flourish-contact/runtime`
- Production: `/etc/systemd/system/flourish-contact.service`

- [ ] **Step 1: Transfer both archives and hashes without embedding credentials**

Use the production access route confirmed in Task 1. On the server, calculate SHA-256 and compare byte-for-byte with `release/SHA256SUMS` before extracting. Delete or quarantine any mismatched transfer.

- [ ] **Step 2: Back up existing service/config state**

Create a timestamped directory under `/var/backups/flourishculturekol.com/` containing any existing `/opt/flourish-contact/current` link target, systemd unit and relevant Nginx source file identified in Task 1. Record paths and hashes; never copy `/etc/flourish-contact.env` into a world-readable location.

- [ ] **Step 3: Install the dedicated user, unit and versioned release**

Create system user/group `flourish-contact` only if absent. Install the reviewed unit to `/etc/systemd/system/flourish-contact.service`, run `systemctl daemon-reload`, then run `scripts/deploy-contact-service.sh` with the verified service archive and `/opt/node-v24.17.0-linux-x64` runtime target.

- [ ] **Step 4: Verify loopback API and SMTP authentication before public routing**

Check:

```bash
systemctl is-active flourish-contact
systemctl status flourish-contact --no-pager
curl -fsS http://127.0.0.1:3101/api/contact/health
curl -fsS http://127.0.0.1:3101/api/contact/config
ss -ltnp
```

Expected: service active; the systemd `ExecStartPre` journal contains only `smtp_authentication_accepted`; health is configured; config returns public Site Key/session but no secret; listener appears only on `127.0.0.1:3101`. Record no server credentials or full SMTP transcript.

- [ ] **Step 5: Roll back service stage on any failure**

If startup, loopback binding, health, public config or SMTP authentication fails, restore the prior symlink/unit, restart the prior service if one existed, and do not edit Nginx or static files.

### Task 6: Patch Nginx minimally and verify canonical/security behavior

**Files:**
- Production: the exact Nginx file confirmed by `nginx -T`
- Source template: `ops/nginx/flourish-contact-api.conf`
- Modify: `check-https-cloud-assistant.sh`

- [ ] **Step 1: Create a candidate from the actual loaded configuration**

Copy the confirmed loaded server file to a timestamped candidate and backup. Preserve its certificate directives and `/review/` locations exactly. Add the reviewed API include content only inside the canonical `www` TLS server.

- [ ] **Step 2: Add canonical redirects without intercepting the canonical server**

The apex HTTP and apex HTTPS server blocks must return:

```nginx
return 301 https://www.flourishculturekol.com$request_uri;
```

The www HTTP server must return:

```nginx
return 301 https://www.flourishculturekol.com$request_uri;
```

Do not change the www TLS certificate or `/review/` upstream.

- [ ] **Step 3: Scope static-page security headers and Turnstile CSP**

For exact homepage/Privacy HTML responses, apply:

```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self' https://challenges.cloudflare.com; connect-src 'self' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; img-src 'self' data:; style-src 'self'; font-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
add_header X-Frame-Options "DENY" always;
```

Use exact-match/static locations derived from the existing config so these additions do not alter `/review/` response policy. Do not add domain-wide HSTS in this release because its effect is host-wide and not limited to the homepage; record that as a deliberate risk boundary.

- [ ] **Step 4: Validate, install and reload**

Run `nginx -t` against the candidate/installed configuration before reload. After reload, verify locally with Host headers: www config/health work through Nginx, apex redirects preserve path/query, and `/review/healthz` remains 200. Restore the backup file and reload if any check fails.

- [ ] **Step 5: Expand the public check script and commit source-side changes**

Update `check-https-cloud-assistant.sh` to assert: apex 301 Location, www 200, canonical tag, Privacy 200, config/health 200 JSON, API POST without Origin rejected, required security headers on homepage/Privacy, `/review/healthz` 200 and `/review/` login redirect.

Commit:

```bash
git add -- check-https-cloud-assistant.sh docs/PRODUCTION_RUNBOOK.md
git commit -m "ops: define canonical contact release checks"
```

### Task 7: Deploy static assets, then validate the public site

**Files:**
- Production: `/var/www/flourishculturekol.com`
- Backup: the UTC timestamp-named directory printed by the deployment script under `/var/backups/flourishculturekol.com/`

- [ ] **Step 1: Verify the static archive hash again on-server**

Expected: matches the local SHA-256 recorded in `release/SHA256SUMS`.

- [ ] **Step 2: Run the existing non-destructive static deploy script**

The script must stage/unzip, require all six site files and assets, back up the existing web root, copy the verified static files, restore readable permissions and run `nginx -t`. Capture the printed backup path.

- [ ] **Step 3: Validate public structure and asset hashes**

Check www homepage/Privacy/API, canonical tag, both new WebP assets, CSS/JS/module MIME, no console errors and all target viewports. Compare public `index.html`, `privacy.html`, CSS, JS and two WebP hashes with local `dist/` where no server transformation is expected.

- [ ] **Step 4: Validate canonical and `/review/` again**

Check apex HTTP/HTTPS 301 to www preserving `/review/?probe=1`; check www `/review/healthz` 200 and `/review/` login redirect. A homepage 200 alone is not acceptance.

- [ ] **Step 5: Roll back on any critical failure**

Restore the recorded web-root backup, Nginx backup and previous Contact service symlink as applicable. Re-run `nginx -t`, homepage, assets and `/review/` checks. Document both the failed release and confirmed rollback; do not continue to email tests or Pages closure.

### Task 8: Perform two real browser submissions and inbox/Reply-To acceptance

**Files:**
- Create: `qa/contact-e2e-2026-08-18.md`

- [ ] **Step 1: Confirm the test sender address with the user**

Use `zdc1219910501@icloud.com` only if the user confirms it is the intended controlled sender address. Do not invent or use a third party’s email.

- [ ] **Step 2: Submit one unique Brand inquiry through the public browser form**

Choose Brand, complete Turnstile, and put `E2E-BRAND-` followed by the execution-time UTC basic ISO timestamp inside Growth Objectives. Verify the page shows success only after API 201/202. Record request ID and browser time, not the full form body.

- [ ] **Step 3: Have Hannah verify the Brand email**

In `hannah@flourish-culture.com`, confirm one message arrives with:

- From: `business@flourish-culture.com`
- To: `hannah@flourish-culture.com`
- Subject: `[Flourish Website] New Brand Inquiry`
- Reply-To: the confirmed controlled sender address
- all Brand fields present and no Creator fields

Open Reply and confirm the draft recipient is the controlled sender; sending the reply is not required.

- [ ] **Step 4: Submit and verify one unique Creator application**

Switch via `Join Our Roster →`, complete a fresh Turnstile challenge, put `E2E-CREATOR-` followed by the execution-time UTC basic ISO timestamp in Social Media Handles or demographics, and submit. In `irisa@flourishculture.com`, confirm fixed From/To/Subject, Reply-To and all Creator fields with no Brand fields. Open Reply and verify recipient.

- [ ] **Step 5: Record evidence and check logs are redacted**

Record timestamps, request IDs, SMTP-accepted status, user-confirmed inbox result and Reply-To result in `qa/contact-e2e-2026-08-18.md`. Inspect journal entries for those request IDs and prove that names, raw email, content, Turnstile token and SMTP credential are absent. If either inbox or Reply-To check is not confirmed, release remains “未完成”.

### Task 9: Sync reproducible source and close GitHub Pages only after acceptance

**Files:**
- Remote GitHub repository: `zhangdecheng/website`
- GitHub Pages configuration: destructive external change, already conditionally approved only after acceptance

- [ ] **Step 1: Re-authenticate GitHub if the prior keyring token remains invalid**

Run `gh auth status`. If invalid, pause for user authentication; do not work around authentication by exposing a token.

- [ ] **Step 2: Prove remote main has not diverged**

```bash
git fetch origin
git log --oneline --left-right origin/main...codex/flourish-site-refresh
```

Expected: no remote-only commit. If remote-only commits exist, stop and integrate them without force-push before continuing.

- [ ] **Step 3: Request the final explicit push approval, then push without force**

After approval:

```bash
git push origin codex/flourish-site-refresh
git push origin codex/flourish-site-refresh:main
```

Read back remote main commit with `gh api repos/zhangdecheng/website/commits/main` and confirm it equals local HEAD. This step repairs the previously observed source/production reproducibility drift.

- [ ] **Step 4: Read Pages state, delete Pages, then read it back**

Only when Tasks 7–8 and remote-main verification passed:

```bash
gh api repos/zhangdecheng/website/pages
gh api --method DELETE repos/zhangdecheng/website/pages
gh api repos/zhangdecheng/website/pages
```

Expected: first GET shows existing built Pages; DELETE succeeds; final GET reports not found/404. Also check `https://zhangdecheng.github.io/website/` until it no longer serves the site, allowing for propagation. The Git repository must remain accessible.

- [ ] **Step 5: Re-run production checks after Pages closure**

Verify www/apex/API/Privacy/assets and `/review/` again. Pages closure must not alter production DNS or files.

### Task 10: Final evidence, documentation and rollback drill

**Files:**
- Modify: `PROJECT_PROGRESS.md`
- Modify: `docs/PROJECT_HANDOFF.md`
- Modify: `docs/CHANGELOG.md`
- Modify: `docs/PRODUCTION_RUNBOOK.md`
- Modify: `qa/contact-e2e-2026-08-18.md`

- [ ] **Step 1: Record only actually observed deployment facts**

Add version `1.2.0`, source commit, both release hashes, actual server backup paths, actual systemd unit state, Nginx source/backup path, public hashes/statuses, Turnstile/API results, SMTP authentication result, Hannah/Irisa confirmations, Reply-To confirmations, `/review/` results and Pages readback result. Mark every missing observation “未确认”.

- [ ] **Step 2: Verify rollback commands non-destructively**

List and stat the recorded backup/current release targets. Run `nginx -t`; verify the previous service/static backup exists and is readable by root. Do not perform a live rollback after a successful release merely as a test.

- [ ] **Step 3: Run the complete local and public verification suite fresh**

```bash
npm ci
npm test
npm run build
npm run build:contact
node scripts/browser-qa.cjs
bash check-https-cloud-assistant.sh
```

Expected: every local command exits 0 and public checks pass at the time of final reporting.

- [ ] **Step 4: Commit final evidence**

```bash
git add -- PROJECT_PROGRESS.md docs/PROJECT_HANDOFF.md docs/CHANGELOG.md docs/PRODUCTION_RUNBOOK.md qa/production-preflight-2026-08-18.md qa/contact-e2e-2026-08-18.md
git diff --cached --check
git commit -m "docs: record verified v1.2.0 production release"
```

Push this final evidence commit only after the same explicit push authorization remains valid; never force-push.

- [ ] **Step 5: Report completion truthfully**

Claim full completion only if real inbox and Reply-To checks, public behavior, `/review/`, remote source and Pages deletion are all read back. Otherwise report “未完成”, name the exact failed gate, list the locally completed work and preserve the deployed/rolled-back state evidence.

## Production plan completion gate

The final handoff must contain: conclusion, confirmed facts, executed operations, fresh verification outputs, actual backup/rollback locations, unresolved risks and next action. It must distinguish SMTP acceptance from inbox delivery and must not expose any credential.
