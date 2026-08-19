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
  assert.match(check, /--resolve 'www\.flourishculturekol\.com:443:127\.0\.0\.1'/);
  assert.doesNotMatch(check, /http:\/\/127\.0\.0\.1\/api\/contact\/health/);
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
