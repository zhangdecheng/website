import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { chmod, mkdir, mkdtemp, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
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

test("static release build preserves the exact preview HTML", async () => {
  await runFile(
    process.execPath,
    ["scripts/build-release.mjs"],
    { cwd: new URL("../", import.meta.url), encoding: "utf8" },
  );

  const source = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const built = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");
  assert.equal(built, source);
});

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
  ]) {
    assert.match(unit, new RegExp(line.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.equal(unit.match(/^EnvironmentFile=/gm)?.length, 1);
  assert.doesNotMatch(unit, /Environment=|SMTP_PASSWORD|TURNSTILE_SECRET|SECURITY_SECRET/);
  assert.doesNotMatch(unit, /\/usr\/bin\/env node|node-v\d+/);
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

test("contact deploy script versions and rolls back release plus runtime symlinks", async () => {
  const deploy = await readFile(new URL("../scripts/deploy-contact-service.sh", import.meta.url), "utf8");
  for (const expected of [
    "set -euo pipefail",
    "mktemp -d",
    "date -u +%Y%m%dT%H%M%SZ",
    'bin/npm" ci --omit=dev --ignore-scripts',
    "http://127.0.0.1:3101/api/contact/health",
  ]) {
    assert.match(deploy, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(deploy, /CONTACT_ROOT="\/opt\/flourish-contact"/);
  assert.match(deploy, /RELEASES_ROOT="\$CONTACT_ROOT\/releases"/);
  assert.match(deploy, /RUNTIME_LINK="\$CONTACT_ROOT\/runtime"/);
  assert.match(deploy, /RUNTIME_TARGET="\$2"/);
  assert.match(deploy, /\[\[ "\$RUNTIME_TARGET" = \/\* \]\]/);
  assert.match(deploy, /"\$RUNTIME_TARGET\/bin\/node"/);
  assert.match(deploy, /"\$RUNTIME_TARGET\/bin\/npm"/);
  assert.match(deploy, /PATH="\$RUNTIME_TARGET\/bin:/);
  assert.match(deploy, /SERVICE_NAME="flourish-contact"/);
  assert.match(deploy, /systemctl restart "\$SERVICE_NAME"/);
  assert.match(deploy, /node[^\n]+process\.versions\.node\.split/);
  assert.match(deploy, /NODE_MAJOR[^\n]+20/);
  assert.match(deploy, /PREVIOUS_RELEASE_TARGET/);
  assert.match(deploy, /PREVIOUS_RUNTIME_TARGET/);
  assert.match(deploy, /rollback/);
  assert.match(deploy, /ln -s[^\n]+"\$\{CURRENT_LINK\}\.next"/);
  assert.match(deploy, /mv -Tf[^\n]+"\$\{CURRENT_LINK\}\.next" "\$CURRENT_LINK"/);
  assert.match(deploy, /ln -s[^\n]+"\$\{RUNTIME_LINK\}\.next"/);
  assert.match(deploy, /mv -Tf[^\n]+"\$\{RUNTIME_LINK\}\.next" "\$RUNTIME_LINK"/);
  assert.match(deploy, /"\$\{RUNTIME_LINK\}\.rollback"/);
  assert.doesNotMatch(deploy, /\/opt\/node-v\d+/);
  assert.doesNotMatch(deploy, /nginx|\/review\/|cat \/etc\/flourish-contact\.env|source \/etc\/flourish-contact\.env|rm -rf ["']?\/opt\/flourish-contact\/releases/);
});

test("archive member guard accepts tar root markers and rejects traversal", async () => {
  const helperUrl = new URL("../scripts/archive-safety.sh", import.meta.url);
  const safe = await runFile(
    "/bin/bash",
    ["-c", 'source "$1"; printf "%s\\n" ./ ./server ./server/index.js package.json | archive_members_are_safe', "--", helperUrl.pathname],
    { encoding: "utf8" },
  );
  assert.equal(safe.stdout, "");
  assert.equal(safe.stderr, "");

  await assert.rejects(
    runFile(
      "/bin/bash",
      ["-c", 'source "$1"; printf "%s\\n" ./server ../outside | archive_members_are_safe', "--", helperUrl.pathname],
      { encoding: "utf8" },
    ),
    /Unsafe archive member: \.\.\/outside/,
  );
});

test("contact environment setup is interactive, atomic, and never accepts secrets as arguments", async () => {
  const setupUrl = new URL("../scripts/configure-contact-env.sh", import.meta.url);
  const setup = await readFile(setupUrl, "utf8");

  await runFile("/bin/bash", ["-n", setupUrl.pathname]);
  for (const expected of [
    "set -euo pipefail",
    'TARGET="/etc/flourish-contact.env"',
    'GROUP="flourish-contact"',
    "[[ $# -eq 0 ]]",
    "[[ -t 0 ]]",
    "read -r -s",
    "openssl rand -hex 48",
    "umask 0077",
    "mktemp",
    "chown root:\"$GROUP\"",
    "chmod 0640",
    'ln "$STAGE" "$TARGET"',
  ]) {
    assert.match(setup, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }

  for (const key of [
    "CONTACT_PORT",
    "CONTACT_TURNSTILE_SITE_KEY",
    "CONTACT_TURNSTILE_SECRET",
    "CONTACT_SECURITY_SECRET",
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASSWORD",
  ]) {
    assert.match(setup, new RegExp(`${key}=`));
  }

  assert.doesNotMatch(setup, /(?:TURNSTILE|SMTP|SECURITY).*(?:\$1|\$2|\$3|\$4)/);
  assert.doesNotMatch(setup, /cat\s+.*flourish-contact\.env|source\s+.*flourish-contact\.env/);
  assert.doesNotMatch(setup, /mv\s+-f/);
});

test("Turnstile secret rotation is hidden, atomic, scoped, and rollback-safe", async () => {
  const updateUrl = new URL("../scripts/rotate-contact-turnstile.sh", import.meta.url);
  const update = await readFile(updateUrl, "utf8").catch(() => "");

  assert.notEqual(update, "", "Turnstile secret updater should exist");
  await runFile("/bin/bash", ["-n", updateUrl.pathname]);
  for (const expected of [
    "set -euo pipefail",
    'TARGET="/etc/flourish-contact.env"',
    'SERVICE="flourish-contact.service"',
    "[[ $# -eq 0 ]]",
    "[[ -t 0 ]]",
    "read -r -s",
    "Turnstile Secret Key entries do not match",
    "CONTACT_TURNSTILE_SECRET=",
    "mktemp",
    "chown root:\"$GROUP\"",
    "chmod 0640",
    "systemctl restart \"$SERVICE\"",
    "http://127.0.0.1:3101/api/contact/health",
    "TARGET_REPLACED == 1",
    'mv -f -- "$ROLLBACK" "$TARGET"',
    "rollback",
  ]) {
    assert.match(update, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }

  assert.doesNotMatch(update, /(?:TURNSTILE_SECRET|CONTACT_TURNSTILE_SECRET).*(?:\$1|\$2)/);
  assert.doesNotMatch(update, /cat\s+.*flourish-contact\.env|source\s+.*flourish-contact\.env/);
  assert.doesNotMatch(update, /SMTP_PASSWORD=/);
  assert.ok(
    update.indexOf("TARGET_REPLACED=1") < update.indexOf('mv -f -- "$STAGE" "$TARGET"'),
    "the rollback transaction must be armed before the atomic replacement",
  );
});

test("Turnstile secret rotation restores the old environment on signal, restart, and health failures", async () => {
  const fixture = await mkdtemp(join(tmpdir(), "flourish-turnstile-rotation-"));
  const target = join(fixture, "flourish-contact.env");
  const testScript = join(fixture, "rotate-contact-turnstile.sh");
  const shimDir = join(fixture, "bin");
  const signalMarker = join(fixture, "signal-sent");
  const oldEnvironment = [
    "CONTACT_PORT=3101",
    "CONTACT_TURNSTILE_SITE_KEY=public-site-key",
    "CONTACT_TURNSTILE_SECRET=old-secret-value-123456",
    "CONTACT_SECURITY_SECRET=security-secret-value-123456",
    "SMTP_HOST=smtp.example.test",
    "SMTP_PORT=465",
    "SMTP_USER=business@example.test",
    "SMTP_PASSWORD=smtp-password-value-123456",
    "",
  ].join("\n");
  const newSecret = "new-secret-value-123456";

  await mkdir(shimDir);
  await writeFile(target, oldEnvironment, { mode: 0o640 });
  const source = await readFile(new URL("../scripts/rotate-contact-turnstile.sh", import.meta.url), "utf8");
  const fixtureSource = source
    .replace('TARGET="/etc/flourish-contact.env"', `TARGET="${target}"`)
    .replace('GROUP="flourish-contact"', 'GROUP="test-group"')
    .replace(/\[\[ \$EUID -eq 0 \]\] \|\| fail "Run this script as root from a private interactive terminal\."/, ":")
    .replace(/\[\[ -t 0 \]\] \|\| fail "Standard input must be a private interactive terminal\."/, ":")
    .replace(/\[\[ -t 1 \]\] \|\| fail "Standard output must be a private interactive terminal\."/, ":")
    .replaceAll("/etc/.flourish-contact.env.", `${fixture}/.flourish-contact.env.`);
  await writeFile(testScript, fixtureSource, { mode: 0o700 });

  const shims = {
    chown: "#!/bin/bash\nexit 0\n",
    cp: '#!/bin/bash\nexec /bin/cp "$3" "$4"\n',
    curl: "#!/bin/bash\nexit 0\n",
    sleep: "#!/bin/bash\nexit 0\n",
    stat: "#!/bin/bash\nprintf '%s\\n' 'root:test-group 640'\n",
    sync: "#!/bin/bash\nexit 0\n",
    systemctl: `#!/bin/bash
set -eu
if [[ "\${1:-}" == "restart" && ! -e "\${FLOURISH_TEST_SIGNAL_MARKER}" ]]; then
  : >"\${FLOURISH_TEST_SIGNAL_MARKER}"
  kill -TERM "\${PPID}"
fi
exit 0
`,
  };
  for (const [name, contents] of Object.entries(shims)) {
    const path = join(shimDir, name);
    await writeFile(path, contents);
    await chmod(path, 0o700);
  }

  const invokeRotation = () => runFile(
    "/bin/bash",
    ["-c", 'printf "%s\\n%s\\n" "$2" "$2" | /bin/bash "$1"', "--", testScript, newSecret],
    {
      encoding: "utf8",
      env: {
        ...process.env,
        FLOURISH_TEST_SIGNAL_MARKER: signalMarker,
        PATH: `${shimDir}:${process.env.PATH}`,
      },
    },
  );
  const assertRestored = async () => {
    assert.equal(await readFile(target, "utf8"), oldEnvironment);
    assert.deepEqual(
      (await readdir(fixture)).filter((name) => name.includes(".rollback.")),
      [],
    );
  };

  try {
    await assert.rejects(
      invokeRotation(),
      (error) => error.code === 143,
    );
    await assertRestored();

    await rm(signalMarker, { force: true });
    await writeFile(join(shimDir, "systemctl"), `#!/bin/bash
set -eu
if [[ "\${1:-}" == "restart" && ! -e "\${FLOURISH_TEST_SIGNAL_MARKER}" ]]; then
  : >"\${FLOURISH_TEST_SIGNAL_MARKER}"
  exit 1
fi
exit 0
`);
    await assert.rejects(invokeRotation(), (error) => error.code === 1);
    await assertRestored();

    await rm(signalMarker, { force: true });
    await writeFile(join(shimDir, "systemctl"), "#!/bin/bash\nexit 1\n");
    await assert.rejects(
      invokeRotation(),
      (error) => {
        assert.equal(error.code, 1);
        assert.match(error.stderr, /previous environment was restored, but the Contact service restart failed/);
        return true;
      },
    );
    await assertRestored();

    await writeFile(join(shimDir, "systemctl"), "#!/bin/bash\nexit 0\n");
    await writeFile(join(shimDir, "curl"), "#!/bin/bash\nexit 1\n");
    await assert.rejects(invokeRotation(), (error) => error.code === 1);
    await assertRestored();
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});

test("systemd environment serializer preserves printable SMTP authorization-code characters", async () => {
  const helperUrl = new URL("../scripts/systemd-env.sh", import.meta.url);
  const value = "ab c#;\"'$\\`?()[]{}|<>";
  const expected = [
    'SMTP_PASSWORD="ab c#;',
    '\\"',
    "'",
    '\\$',
    '\\\\',
    '\\`',
    '?()[]{}|<>"\n',
  ].join("");

  const { stdout, stderr } = await runFile(
    "/bin/bash",
    ["-c", 'source "$1"; systemd_env_assignment SMTP_PASSWORD "$2"', "--", helperUrl.pathname, value],
    { encoding: "utf8" },
  );

  assert.equal(stderr, "");
  assert.equal(stdout, expected);

  const setup = await readFile(new URL("../scripts/configure-contact-env.sh", import.meta.url), "utf8");
  assert.match(setup, /systemd_env_assignment SMTP_PASSWORD/);
  assert.doesNotMatch(setup, /ENV_VALUE_PATTERN/);
});

test("production transfer builder strips macOS metadata and packages the exact allow-list", async () => {
  const builderUrl = new URL("../scripts/build-production-transfer.sh", import.meta.url);
  const builder = await readFile(builderUrl, "utf8");

  await runFile("/bin/bash", ["-n", builderUrl.pathname]);
  assert.match(builder, /COPYFILE_DISABLE=1/);
  assert.match(builder, /gzip\s+-n/);
  assert.match(builder, /python3/);
  assert.match(builder, /getmembers/);
  assert.match(builder, /isfile/);
  assert.match(builder, /mktemp/);
  assert.match(builder, /mv\s+--/);
  assert.match(builder, /create-deterministic-tar\.py/);
  assert.doesNotMatch(builder, /--(?:uid|gid|uname|gname|no-xattrs)\b/);

  for (const expected of [
    "release/SHA256SUMS",
    "release/flourish-contact-service.tgz",
    "release/flourishculturekol-homepage.zip",
    "scripts/archive-safety.sh",
    "scripts/configure-contact-env.sh",
    "scripts/rotate-contact-turnstile.sh",
    "scripts/systemd-env.sh",
    "scripts/deploy-contact-service.sh",
    "deploy-cloud-assistant.sh",
    "ops/flourish-contact.service",
    "ops/nginx/flourish-contact-api.conf",
    "check-https-cloud-assistant.sh",
  ]) {
    assert.match(builder, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }

  assert.doesNotMatch(builder, /(?:^|[\s"'])release\/(?:\*|\.)(?:[\s"']|$)/m);
});

test("production tar layers contain no macOS xattrs or contact root marker", async () => {
  await runFile("npm", ["run", "build:transfer"], {
    cwd: new URL("../", import.meta.url),
    encoding: "utf8",
  });

  const python = String.raw`
import io
import sys
import tarfile

outer_path = sys.argv[1]

def reject_xattrs(label, members):
    for member in members:
        keys = [key for key in member.pax_headers if "xattr" in key.lower()]
        if keys:
            raise SystemExit(f"{label} xattr headers on {member.name}: {keys}")

def verify_canonical_metadata(label, members):
    for member in members:
        if member.mtime != 315532800:
            raise SystemExit(f"{label} non-canonical mtime on {member.name}: {member.mtime}")
        if (member.uid, member.gid, member.uname, member.gname) != (0, 0, "root", "root"):
            raise SystemExit(f"{label} non-canonical owner on {member.name}")

with tarfile.open(outer_path, "r:gz") as outer:
    outer_members = outer.getmembers()
    reject_xattrs("outer", outer_members)
    verify_canonical_metadata("outer", outer_members)
    outer_names = [member.name for member in outer_members]
    if outer_names != sorted(outer_names):
        raise SystemExit(f"outer archive members are not canonically sorted: {outer_names}")
    nested_file = outer.extractfile("release/flourish-contact-service.tgz")
    if nested_file is None:
        raise SystemExit("contact archive missing from transfer")
    nested_bytes = nested_file.read()

with tarfile.open(fileobj=io.BytesIO(nested_bytes), mode="r:gz") as contact:
    contact_members = contact.getmembers()
    reject_xattrs("contact", contact_members)
    verify_canonical_metadata("contact", contact_members)
    names = [member.name for member in contact_members]
    if "." in names or "./" in names:
        raise SystemExit(f"contact archive contains a root marker: {names[:3]}")
`;

  const { stdout, stderr } = await runFile(
    "/usr/bin/python3",
    ["-c", python, new URL("../release/flourish-production-transfer-v1.2.0.tgz", import.meta.url).pathname],
    { encoding: "utf8" },
  );
  assert.equal(stdout, "");
  assert.equal(stderr, "");
});

test("production artifacts and transfer archive are reproducible across time zones", async () => {
  const projectRoot = new URL("../", import.meta.url);
  const outputs = [
    "release/flourishculturekol-homepage.zip",
    "release/flourish-contact-service.tgz",
    "release/flourish-production-transfer-v1.2.0.tgz",
  ];
  const build = (timezone) => runFile("npm", ["run", "build:transfer"], {
    cwd: projectRoot,
    encoding: "utf8",
    env: { ...process.env, TZ: timezone },
  });
  const hashes = async () => Promise.all(outputs.map(async (relative) => (
    createHash("sha256").update(await readFile(new URL(relative, projectRoot))).digest("hex")
  )));

  await build("Asia/Shanghai");
  const first = await hashes();
  await new Promise((resolve) => setTimeout(resolve, 1_100));
  await build("UTC");
  const second = await hashes();

  assert.deepEqual(second, first);
});

test("package scripts and ignore rules keep generated releases out of Git", async () => {
  const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
  const ignore = await readFile(new URL("../.gitignore", import.meta.url), "utf8");
  assert.equal(packageJson.scripts?.["build:contact"], "node scripts/build-contact-release.mjs");
  assert.equal(packageJson.scripts?.["build:artifacts"], "bash scripts/build-production-artifacts.sh");
  assert.equal(packageJson.scripts?.["build:transfer"], "npm run build:artifacts && bash scripts/build-production-transfer.sh");
  assert.equal(packageJson.scripts?.["test:release"], "node --test tests/release.test.mjs");
  assert.equal(packageJson.scripts?.["release:verify"], "node scripts/release-gate.mjs");
  const gate = await readFile(new URL("../scripts/release-gate.mjs", import.meta.url), "utf8");
  assert.match(gate, /build:artifacts/);
  assert.match(gate, /browser-qa\.cjs/);
  assert.match(ignore, /# Generated release artifacts and staging directories\nrelease\//);
  assert.doesNotMatch(ignore, /^release\/\*\.zip$/m);
});

test("public release check is strict about canonical routing, APIs, headers, assets and review", async () => {
  const check = await readFile(new URL("../check-https-cloud-assistant.sh", import.meta.url), "utf8");
  const deploy = await readFile(new URL("../deploy-cloud-assistant.sh", import.meta.url), "utf8");

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
  assert.match(check, /--resolve 'www\.flourishculturekol\.com:443:127\.0\.0\.1'/);
  assert.doesNotMatch(check, /http:\/\/127\.0\.0\.1\/api\/contact\/health/);
  assert.doesNotMatch(check, /(?:health|config|canonical|privacy|review)[^\n]*\|\| true/i);
  assert.match(check, /assert_occurrences\(\) \{/u);
  assert.match(check, /grep -oF -- "\$needle" "\$file"/u);
  assert.match(check, /assert_occurrences "\$WORK_DIR\/index\.html" '<span class="connector-word">and<\/span>' "14" "www homepage connector words"/u);
  assert.match(deploy, /PATH="\/opt\/node-v24\.17\.0-linux-x64\/bin:\$PATH" bash "\$CHECK_SCRIPT"/u);

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
    "assets/service-creative-localization-camera-speaker.webp",
    "assets/talent-creator-growth-studio.webp",
  ]) {
    const bytes = await readFile(new URL(`../dist/${path}`, import.meta.url));
    const hash = createHash("sha256").update(bytes).digest("hex");
    assert.match(check, new RegExp(hash), `${path} hash should be pinned in the public check`);
  }
});

test("public release check reports zero connector matches and grep errors safely", async () => {
  const check = await readFile(new URL("../check-https-cloud-assistant.sh", import.meta.url), "utf8");
  const occurrenceFunction = check.match(/^assert_occurrences\(\) \{[\s\S]*?^\}/m)?.[0];
  assert.notEqual(occurrenceFunction, undefined);

  const fixture = await mkdtemp(join(tmpdir(), "flourish-occurrences-"));
  const document = join(fixture, "document.html");
  const harness = join(fixture, "assert-occurrences.sh");
  await writeFile(document, "<main>no connector here</main>\n", "utf8");
  await writeExecutable(harness, `#!/usr/bin/env bash
set -euo pipefail
fail() {
  printf 'FAIL: %s\\n' "$1" >&2
  exit 1
}
pass() {
  printf 'OK: %s\\n' "$1"
}
${occurrenceFunction}
assert_occurrences "$@"
`);

  try {
    await writeFile(document, "connector-word\nconnector-word\n", "utf8");
    const success = await runFile(
      "/bin/bash",
      [harness, document, "connector-word", "2", "fixture connector words"],
      { encoding: "utf8" },
    );
    assert.match(success.stdout, /OK: fixture connector words contains exactly 2 required instances/u);

    await writeFile(document, "<main>no connector here</main>\n", "utf8");
    await assert.rejects(
      runFile("/bin/bash", [harness, document, "connector-word", "1", "fixture connector words"], { encoding: "utf8" }),
      (error) => {
        assert.equal(error.code, 1);
        assert.match(error.stderr, /FAIL: fixture connector words contained 0 instances; expected 1/u);
        return true;
      },
    );
    await assert.rejects(
      runFile("/bin/bash", [harness, join(fixture, "missing.html"), "connector-word", "1", "fixture connector words"], { encoding: "utf8" }),
      (error) => {
        assert.equal(error.code, 1);
        assert.match(error.stderr, /FAIL: fixture connector words could not be searched \(grep exit 2\)/u);
        return true;
      },
    );
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});

test("final static rollout pins the audited candidate and never rolls Nginx back", async () => {
  const script = await readFile(new URL("../deploy-cloud-assistant.sh", import.meta.url), "utf8");

  await runFile(
    "/bin/bash",
    ["scripts/build-production-artifacts.sh"],
    { cwd: new URL("../", import.meta.url), encoding: "utf8" },
  );

  assert.equal(
    deploymentHash(script, "EXPECTED_ARCHIVE_SHA"),
    await fileSha256(new URL("../release/flourishculturekol-homepage.zip", import.meta.url)),
  );
  assert.equal(
    deploymentHash(script, "EXPECTED_CHECK_SCRIPT_SHA"),
    await fileSha256(new URL("../check-https-cloud-assistant.sh", import.meta.url)),
  );
  assert.equal(deploymentHash(script, "EXPECTED_OLD_HOME_SHA"), "c96f7bc5f291e292473b4603bc55587710464e5272867d2e69888530ca4a39e1");
  assert.equal(deploymentHash(script, "EXPECTED_OLD_STYLES_SHA"), "b5b88af03dfb3a0b0fb22fe3b4dcbf82c929cb331281ce99d5f82f3b76405ccd");
  assert.equal(
    deploymentHash(script, "EXPECTED_NEW_HOME_SHA"),
    await fileSha256(new URL("../dist/index.html", import.meta.url)),
  );
  assert.equal(
    deploymentHash(script, "EXPECTED_STYLES_SHA"),
    await fileSha256(new URL("../dist/styles.css", import.meta.url)),
  );
  assert.match(script, /BACKUP_TREE="\$\{BACKUP\}\/tree"/u);
  assert.match(script, /rsync -a --delete "\$BACKUP_TREE\/" "\$WEB_ROOT\/"/u);
  assert.match(script, /rsync -a "\$WEB_ROOT\/" "\$BACKUP_TREE\/"[\s\S]*chmod 0700 "\$BACKUP"/u);
  assert.doesNotMatch(script, /NGINX_ROLLBACK|static-rollback|restoring the predeploy Nginx/u);
});

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function deploymentHash(script, name) {
  return script.match(new RegExp(`readonly ${name}="([a-f0-9]{64})"`))?.[1] ?? "";
}

async function fileSha256(path) {
  return sha256(await readFile(path));
}

async function pathExists(path) {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

async function snapshotTree(root, prefix = "") {
  const entries = await readdir(root, { withFileTypes: true });
  const snapshot = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const absolute = join(root, entry.name);
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    const info = await stat(absolute);
    const mode = (info.mode & 0o777).toString(8).padStart(3, "0");
    if (entry.isDirectory()) {
      snapshot.push(`directory ${mode} ${relative}`);
      snapshot.push(...await snapshotTree(absolute, relative));
    } else {
      snapshot.push(`file ${mode} ${sha256(await readFile(absolute))} ${relative}`);
    }
  }
  return snapshot;
}

function replaceReadonly(script, name, value, { optional = false } = {}) {
  const pattern = new RegExp(`readonly ${name}="[^"]*"`, "u");
  if (!pattern.test(script)) {
    if (optional) return script;
    throw new Error(`missing readonly rollout constant: ${name}`);
  }
  return script.replace(pattern, `readonly ${name}="${value}"`);
}

async function writeExecutable(path, contents) {
  await writeFile(path, contents, "utf8");
  await chmod(path, 0o755);
}

async function runStaticRolloutHarness({ checkerBody, expectedCheckerBody = checkerBody }) {
  const root = await mkdtemp(join(tmpdir(), "flourish-static-rollout-"));
  const webRoot = join(root, "web-root");
  const backupRoot = join(root, "backups");
  const releaseRoot = join(root, "release");
  const fakeBin = join(root, "fake-bin");
  const archive = join(root, "release.zip");
  const nginxConfig = join(root, "nginx.conf");
  const checker = join(root, "check.sh");
  const deploy = join(root, "deploy.sh");
  const exposureMarker = join(root, "backup-was-world-readable");
  const runtimeFailureMarker = join(root, "runtime-must-fail");
  const checkerExecutionMarker = join(root, "checker-executed");

  await mkdir(join(webRoot, "legacy"), { recursive: true, mode: 0o755 });
  await mkdir(join(releaseRoot, "assets"), { recursive: true, mode: 0o755 });
  await mkdir(join(releaseRoot, "assets", "brand-logos"), { recursive: true, mode: 0o755 });
  await mkdir(backupRoot, { recursive: true, mode: 0o700 });
  await mkdir(fakeBin, { recursive: true, mode: 0o755 });

  const oldFiles = {
    "index.html": "old homepage\n",
    "styles.css": "old styles\n",
    "legacy/retain.txt": "retain this exact legacy file\n",
  };
  for (const [relative, contents] of Object.entries(oldFiles)) {
    const path = join(webRoot, relative);
    await writeFile(path, contents, "utf8");
    await chmod(path, 0o644);
  }
  await chmod(webRoot, 0o755);
  await chmod(join(webRoot, "legacy"), 0o755);

  const releaseFiles = {
    "index.html": "brand-new homepage bytes\n",
    "privacy.html": "privacy\n",
    "styles.css": "brand-new styles bytes\n",
    "script.js": "console.log('release');\n",
    "contact-form.js": "console.log('contact');\n",
    "site-core.js": "console.log('core');\n",
    "assets/brand-logos/atoms-transparent.png": "atoms logo fixture\n",
    "assets/brand-logos/tripo-transparent-cropped.png": "tripo logo fixture\n",
    "assets/service-creative-localization-camera-speaker.webp": "service image fixture\n",
    "assets/talent-creator-growth-studio.webp": "talent image fixture\n",
  };
  for (const [relative, contents] of Object.entries(releaseFiles)) {
    const path = join(releaseRoot, relative);
    await writeFile(path, contents, "utf8");
    await chmod(path, 0o644);
  }
  await writeFile(nginxConfig, "fixture nginx config\n", "utf8");
  await chmod(nginxConfig, 0o644);
  await writeFile(checker, checkerBody, "utf8");
  await runFile("/usr/bin/zip", ["-q", "-X", "-r", archive, "."], {
    cwd: releaseRoot,
    encoding: "utf8",
  });

  await writeExecutable(join(fakeBin, "id"), "#!/usr/bin/env bash\nprintf '0\\n'\n");
  await writeExecutable(join(fakeBin, "hostname"), "#!/usr/bin/env bash\nprintf 'webhkhome\\n'\n");
  await writeExecutable(join(fakeBin, "systemctl"), "#!/usr/bin/env bash\nexit 0\n");
  await writeExecutable(join(fakeBin, "curl"), "#!/usr/bin/env bash\nexit 0\n");
  await writeExecutable(join(fakeBin, "nginx"), `#!/usr/bin/env bash
if [[ -f "$TEST_RUNTIME_FAILURE_MARKER" ]]; then
  exit 41
fi
exit 0
`);
  await writeExecutable(join(fakeBin, "rsync"), `#!/usr/bin/env bash
set -eu
destination=""
for argument in "$@"; do
  destination="$argument"
done
/usr/bin/rsync "$@"
if [[ "$destination" == "$TEST_BACKUP_ROOT"/*/ ]]; then
  target="\${destination%/}"
  protected_root="$target"
  if [[ "$(basename "$target")" == "tree" ]]; then
    protected_root="$(dirname "$target")"
  fi
  mode="$(stat -f '%Lp' "$protected_root")"
  if [[ "$mode" != "700" ]]; then
    printf '%s\n' "$mode" > "$TEST_BACKUP_EXPOSURE_MARKER"
  fi
fi
exit 0
`);

  let script = await readFile(new URL("../deploy-cloud-assistant.sh", import.meta.url), "utf8");
  const replacements = {
    WEB_ROOT: webRoot,
    BACKUP_ROOT: backupRoot,
    NGINX_CONFIG: nginxConfig,
    EXPECTED_ARCHIVE_SHA: await fileSha256(archive),
    EXPECTED_OLD_HOME_SHA: await fileSha256(join(webRoot, "index.html")),
    EXPECTED_OLD_STYLES_SHA: await fileSha256(join(webRoot, "styles.css")),
    EXPECTED_NGINX_SHA: await fileSha256(nginxConfig),
    EXPECTED_NEW_HOME_SHA: await fileSha256(join(releaseRoot, "index.html")),
    EXPECTED_PRIVACY_SHA: await fileSha256(join(releaseRoot, "privacy.html")),
    EXPECTED_STYLES_SHA: await fileSha256(join(releaseRoot, "styles.css")),
    EXPECTED_SCRIPT_SHA: await fileSha256(join(releaseRoot, "script.js")),
    EXPECTED_CONTACT_FORM_SHA: await fileSha256(join(releaseRoot, "contact-form.js")),
    EXPECTED_SITE_CORE_SHA: await fileSha256(join(releaseRoot, "site-core.js")),
    EXPECTED_ATOMS_LOGO_SHA: await fileSha256(join(releaseRoot, "assets/brand-logos/atoms-transparent.png")),
    EXPECTED_TRIPO_LOGO_SHA: await fileSha256(join(releaseRoot, "assets/brand-logos/tripo-transparent-cropped.png")),
    EXPECTED_SERVICE_IMAGE_SHA: await fileSha256(join(releaseRoot, "assets/service-creative-localization-camera-speaker.webp")),
    EXPECTED_TALENT_IMAGE_SHA: await fileSha256(join(releaseRoot, "assets/talent-creator-growth-studio.webp")),
  };
  for (const [name, value] of Object.entries(replacements)) {
    script = replaceReadonly(script, name, value);
  }
  script = replaceReadonly(script, "EXPECTED_CHECK_SCRIPT_SHA", sha256(expectedCheckerBody), { optional: true });
  script = script.replaceAll("/var/tmp/flourish-static-deploy", `${root}/flourish-static-deploy`);
  script = script.replace(
    'install -d -o root -g root -m 0700 "$BACKUP" "$BACKUP_TREE"',
    'install -d -m 0700 "$BACKUP" "$BACKUP_TREE"',
  );
  script = script.replace(
    'install -d -o root -g root -m 0700 "$BACKUP"',
    'install -d -m 0700 "$BACKUP"',
  );
  await writeExecutable(deploy, script);

  const initialTree = await snapshotTree(webRoot);
  let result;
  try {
    const completed = await runFile("/bin/bash", [deploy, archive, checker], {
      encoding: "utf8",
      env: {
        ...process.env,
        PATH: `${fakeBin}:/usr/bin:/bin:/usr/sbin:/sbin`,
        TEST_BACKUP_EXPOSURE_MARKER: exposureMarker,
        TEST_BACKUP_ROOT: backupRoot,
        TEST_CHECKER_EXEC_MARKER: checkerExecutionMarker,
        TEST_RUNTIME_FAILURE_MARKER: runtimeFailureMarker,
        TEST_WEB_ROOT: webRoot,
      },
    });
    result = { ...completed, code: 0 };
  } catch (error) {
    result = {
      code: error?.code,
      stderr: error?.stderr ?? "",
      stdout: error?.stdout ?? "",
    };
  }

  return {
    backupRoot,
    checkerExecutionMarker,
    exposureMarker,
    initialTree,
    result,
    root,
    runtimeFailureMarker,
    webRoot,
  };
}

test("static rollout fault injection restores the complete tree without relaxing backup privacy", async () => {
  const harness = await runStaticRolloutHarness({
    checkerBody: `#!/usr/bin/env bash
set -eu
rm -f "$TEST_WEB_ROOT/legacy/retain.txt"
printf 'intruder\n' > "$TEST_WEB_ROOT/intruder.txt"
exit 23
`,
  });
  try {
    assert.notEqual(harness.result.code, 0);
    assert.deepEqual(await snapshotTree(harness.webRoot), harness.initialTree);
    assert.equal(await pathExists(harness.exposureMarker), false, "backup root became non-private during rsync");
    assert.match(harness.result.stderr, /web root restored/u);
  } finally {
    await rm(harness.root, { recursive: true, force: true });
  }
});

test("static rollout rejects a checker whose bytes differ from the audited checker", async () => {
  const expectedCheckerBody = "#!/usr/bin/env bash\nexit 0\n";
  const harness = await runStaticRolloutHarness({
    expectedCheckerBody,
    checkerBody: `#!/usr/bin/env bash
touch "$TEST_CHECKER_EXEC_MARKER"
exit 0
`,
  });
  try {
    assert.notEqual(harness.result.code, 0);
    assert.equal(await pathExists(harness.checkerExecutionMarker), false);
    assert.match(harness.result.stderr, /validation script SHA-256/u);
  } finally {
    await rm(harness.root, { recursive: true, force: true });
  }
});

test("rollback cannot report healthy when an early runtime invariant fails", async () => {
  const harness = await runStaticRolloutHarness({
    checkerBody: `#!/usr/bin/env bash
touch "$TEST_RUNTIME_FAILURE_MARKER"
exit 29
`,
  });
  try {
    assert.notEqual(harness.result.code, 0);
    assert.match(harness.result.stderr, /CRITICAL: automatic static rollback verification failed/u);
    assert.doesNotMatch(harness.result.stderr, /Nginx, Contact, and Review remain healthy/u);
  } finally {
    await rm(harness.root, { recursive: true, force: true });
  }
});

test("rollback verifies every backed-up file against the generated manifest", async () => {
  const harness = await runStaticRolloutHarness({
    checkerBody: `#!/usr/bin/env bash
set -eu
backup_dir="$(find "$TEST_BACKUP_ROOT" -mindepth 1 -maxdepth 1 -type d -print -quit)"
retain_file="$(find "$backup_dir" -type f -path '*/legacy/retain.txt' -print -quit)"
printf 'corrupted backup\n' > "$retain_file"
rm -f "$TEST_WEB_ROOT/legacy/retain.txt"
exit 31
`,
  });
  try {
    assert.notEqual(harness.result.code, 0);
    assert.match(harness.result.stderr, /CRITICAL: automatic static rollback verification failed/u);
    assert.doesNotMatch(harness.result.stderr, /Nginx, Contact, and Review remain healthy/u);
  } finally {
    await rm(harness.root, { recursive: true, force: true });
  }
});
