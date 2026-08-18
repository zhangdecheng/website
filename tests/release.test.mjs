import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import { promisify } from "node:util";
import test from "node:test";

const runFile = promisify(execFile);

async function listFiles(directory, prefix = "") {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      files.push(...await listFiles(new URL(`${entry.name}/`, directory), relative));
    } else {
      files.push(relative);
    }
  }
  return files;
}

test("systemd unit is loopback-service hardened and reads one protected env file", async () => {
  const unit = await readFile(new URL("../ops/flourish-contact.service", import.meta.url), "utf8");
  for (const line of [
    "EnvironmentFile=/etc/flourish-contact.env",
    "WorkingDirectory=/opt/flourish-contact/current",
    "ExecStartPre=/usr/bin/env node server/smtp-check.js",
    "ExecStart=/usr/bin/env node server/index.js",
    "User=flourish-contact",
    "NoNewPrivileges=true",
    "PrivateTmp=true",
    "ProtectSystem=strict",
    "ProtectHome=true",
    "Restart=on-failure",
  ]) {
    assert.match(unit, new RegExp(line.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.equal(unit.match(/^EnvironmentFile=/gm)?.length, 1);
  assert.doesNotMatch(unit, /Environment=|SMTP_PASSWORD|TURNSTILE_SECRET|SECURITY_SECRET/);
});

test("nginx snippet proxies only the contact API and sets the real IP itself", async () => {
  const nginx = await readFile(new URL("../ops/nginx/flourish-contact-api.conf", import.meta.url), "utf8");
  assert.match(nginx, /location = \/api\/contact/);
  assert.match(nginx, /location \^~ \/api\/contact\//);
  assert.equal(nginx.match(/proxy_pass http:\/\/127\.0\.0\.1:3101/g)?.length, 2);
  assert.equal(nginx.match(/proxy_set_header X-Real-IP \$remote_addr/g)?.length, 2);
  assert.equal(nginx.match(/client_max_body_size 32k/g)?.length, 2);
  assert.doesNotMatch(nginx, /review|proxy_set_header X-Forwarded-For \$http_x_forwarded_for/);
});

test("contact release builder emits only the allow-listed backend artifact", async () => {
  const script = await readFile(new URL("../scripts/build-contact-release.mjs", import.meta.url), "utf8");
  assert.match(script, /release["'],\s*["']contact-service/);
  assert.match(script, /lstat|isSymbolicLink/);
  for (const forbidden of [".env", "secret", "token", ".pem", ".key", ".log"]) {
    assert.match(script.toLowerCase(), new RegExp(forbidden.replace(".", "\\.")));
  }

  const { stdout, stderr } = await runFile(
    process.execPath,
    ["scripts/build-contact-release.mjs"],
    { cwd: new URL("../", import.meta.url), encoding: "utf8" },
  );
  assert.equal(stderr, "");
  assert.match(stdout, /Contact release:/);
  assert.match(stdout, /Total bytes:/);

  const output = new URL("../release/contact-service/", import.meta.url);
  const files = await listFiles(output);
  const serverFiles = await listFiles(new URL("../server/", import.meta.url), "server");
  assert.deepEqual(files, [
    "ops/flourish-contact.service",
    "package-lock.json",
    "package.json",
    ...serverFiles,
  ].sort());

  for (const file of files) {
    assert.doesNotMatch(file, /(?:^|\/)(?:node_modules|tests?|docs?|assets)(?:\/|$)/i);
    assert.doesNotMatch(file, /(?:\.env|secret|token|\.pem|\.key|\.log)/i);
    const info = await stat(new URL(file, output));
    assert.equal(info.isSymbolicLink(), false);
  }
});

test("contact deploy script versions, verifies and rolls back only the service symlink", async () => {
  const deploy = await readFile(new URL("../scripts/deploy-contact-service.sh", import.meta.url), "utf8");
  for (const expected of [
    "set -euo pipefail",
    "mktemp -d",
    "date -u +%Y%m%dT%H%M%SZ",
    "npm ci --omit=dev --ignore-scripts",
    "http://127.0.0.1:3101/api/contact/health",
  ]) {
    assert.match(deploy, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(deploy, /CONTACT_ROOT="\/opt\/flourish-contact"/);
  assert.match(deploy, /RELEASES_ROOT="\$CONTACT_ROOT\/releases"/);
  assert.match(deploy, /SERVICE_NAME="flourish-contact"/);
  assert.match(deploy, /systemctl restart "\$SERVICE_NAME"/);
  assert.match(deploy, /node[^\n]+process\.versions\.node\.split/);
  assert.match(deploy, /NODE_MAJOR[^\n]+20/);
  assert.match(deploy, /PREVIOUS_TARGET/);
  assert.match(deploy, /rollback/);
  assert.match(deploy, /ln -s[^\n]+"\$\{CURRENT_LINK\}\.next"/);
  assert.match(deploy, /mv -Tf[^\n]+"\$\{CURRENT_LINK\}\.next" "\$CURRENT_LINK"/);
  assert.doesNotMatch(deploy, /nginx|\/review\/|cat \/etc\/flourish-contact\.env|source \/etc\/flourish-contact\.env|rm -rf ["']?\/opt\/flourish-contact\/releases/);
});

test("package scripts and ignore rules keep generated releases out of Git", async () => {
  const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
  const ignore = await readFile(new URL("../.gitignore", import.meta.url), "utf8");
  assert.equal(packageJson.scripts?.["build:contact"], "node scripts/build-contact-release.mjs");
  assert.equal(packageJson.scripts?.["test:release"], "node --test tests/release.test.mjs");
  assert.match(ignore, /# Generated release artifacts and staging directories\nrelease\//);
  assert.doesNotMatch(ignore, /^release\/\*\.zip$/m);
});

test("public release check is strict about canonical routing, APIs, headers, assets and review", async () => {
  const check = await readFile(new URL("../check-https-cloud-assistant.sh", import.meta.url), "utf8");

  for (const expected of [
    "set -euo pipefail",
    "https://www.flourishculturekol.com/",
    "https://www.flourishculturekol.com/privacy.html",
    "https://www.flourishculturekol.com/api/contact/health",
    "https://www.flourishculturekol.com/api/contact/config",
    "https://www.flourishculturekol.com/review/healthz",
    "https://www.flourishculturekol.com/review/",
    "https://www.flourishculturekol.com/review/?probe=1",
    "Content-Security-Policy",
    "X-Content-Type-Options",
    "Referrer-Policy",
    "Permissions-Policy",
    "X-Frame-Options",
    'configured === true && body.version === "1.2.0"',
    "turnstileSiteKey",
    "formSessionToken",
    "403",
    "/review/login",
  ]) {
    assert.match(check, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }

  assert.doesNotMatch(check, /curl[^\n]*\s-k(?:\s|$)|curl[^\n]*--insecure/);
  assert.doesNotMatch(check, /(?:health|config|canonical|privacy|review)[^\n]*\|\| true/i);

  await runFile(
    process.execPath,
    ["scripts/build-release.mjs"],
    { cwd: new URL("../", import.meta.url), encoding: "utf8" },
  );
  for (const path of [
    "index.html",
    "privacy.html",
    "styles.css",
    "script.js",
    "contact-form.js",
    "site-core.js",
    "assets/service-creative-localization-meetup.webp",
    "assets/talent-creator-growth-studio.webp",
  ]) {
    const bytes = await readFile(new URL(`../dist/${path}`, import.meta.url));
    const hash = createHash("sha256").update(bytes).digest("hex");
    assert.match(check, new RegExp(hash), `${path} hash should be pinned in the public check`);
  }
});
