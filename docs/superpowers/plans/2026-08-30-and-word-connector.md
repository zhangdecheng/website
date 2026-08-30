# And Word Connector Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 14 approved homepage ampersands with readable `and` text, verify the replacement with TDD, and publish the static-only candidate with independent public readback.

**Architecture:** Keep explicit inline scope anchors by replacing each approved `<span class="ampersand">&amp;</span>` with `<span class="connector-word">and</span>`. The class is a test boundary only: no connector-specific CSS is added, so the word inherits its surrounding typography. Release contracts remain hash-pinned; the public checker gains a direct 14-marker assertion in addition to its homepage hash.

**Tech Stack:** Static HTML/CSS, Node.js built-in test runner, shell release scripts, deterministic release artifacts, Chrome responsive QA, Volcengine ECS Cloud Assistant.

---

## File Structure

| File | Responsibility |
| --- | --- |
| `index.html` | The sole production markup scope: all 14 approved connector words. |
| `review-editable.html` | The matching five review-copy heading/eyebrow anchors only. |
| `styles.css` | Removes the obsolete Arial-only `.ampersand` declaration; no new connector declaration. |
| `tests/site.test.mjs` | Source-content contract for all 14 homepage and five review-copy anchors. |
| `tests/release.test.mjs` | Validates dynamic candidate hashes and the public marker-count gate. |
| `check-https-cloud-assistant.sh` | Counts 14 deployed connector-word markers and pins current release hashes. |
| `deploy-cloud-assistant.sh` | Pins old production hashes, new candidate hashes, and the backup suffix. |
| `qa/production-release-2026-08-30-and-word.md` | Immutable evidence of this release, created only after successful public readback. |
| `PROJECT_PROGRESS.md` | Concise release-summary link to the QA record. |

### Task 1: Lock the desired text with failing source tests

**Files:**
- Modify: `tests/site.test.mjs:274-314, 231-266, 327-329, 361, 502-503, 720`
- Test: `tests/site.test.mjs`

- [ ] **Step 1: Replace the two ampersand-hook tests with exact `and` contracts.**

```js
test("homepage marks exactly the 14 approved and connectors", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");
  const marker = '<span class="connector-word">and</span>';
  const approvedContexts = [
    `Trusted by Leading Global Brands ${marker} Innovators`,
    `Certified TikTok Shop TAP ${marker} CAP Partner`,
    `FLOURISH is an officially certified TikTok Shop TAP ${marker} CAP partner across multiple markets`,
    `TikTok Shop multi-market certified TAP ${marker} CAP partner.`,
    `Data-Driven Growth ${marker} Performance Insights`,
    `Algorithmic ${marker} Retention Audits:`,
    `E-Commerce ${marker} Direct-Response Optimization:`,
    `Audience Demographics ${marker} Niche Matching:`,
    `Creative Strategy ${marker} Localization`,
    `Script Audits ${marker} UGC Production:`,
    `Supply Chain ${marker} Offline Immersion:`,
    `Seamless Monetization ${marker} Operations:`,
    `Global Community ${marker} Supply Chain Access:`,
    `The FLOURISH Advantage: Why HK ${marker} Why Us?`,
  ];

  assert.equal(html.split(marker).length - 1, approvedContexts.length);
  assert.equal(html.includes('class="ampersand"'), false);
  assert.equal(html.includes("&amp;"), false);
  assert.equal(css.includes(".ampersand"), false);
  assert.equal(css.includes(".connector-word"), false);
  for (const context of approvedContexts) assertIncludesText(html, context);
});

test("review editable mirrors the matching title and connectors", async () => {
  const html = await readFile(new URL("../review-editable.html", import.meta.url), "utf8");
  const marker = '<span class="connector-word">and</span>';

  assert.equal(html.split(marker).length - 1, 5);
  for (const context of [
    `Trusted by Leading Global Brands ${marker} Innovators`,
    `Certified TikTok Shop TAP ${marker} CAP Partner`,
    `Performance-Driven Growth ${marker} Paid Media`,
    `Creative Strategy ${marker} Localization`,
    `The FLOURISH Advantage: Why HK ${marker} Why Us?`,
  ]) assertIncludesText(html, context);
  assertIncludesText(html, "Primary Social Media Handle &amp; Link");
});
```

- [ ] **Step 2: Update the existing exact-copy expectations that reference the approved instances.**

Use `and` in these existing expected strings: `Data-Driven Growth and Performance Insights`, `Creative Strategy and Localization`, the five service-action strings, `Seamless Monetization and Operations`, `Global Community and Supply Chain Access`, `[The FLOURISH Advantage: Why HK and Why Us?]`, `Performance-Driven Growth and Paid Media`, and the logo-strip headline. Keep every unapproved review-form label as `&amp;`.

- [ ] **Step 3: Run the focused test to demonstrate the red state.**

Run: `node --test --test-name-pattern="approved and connectors" tests/site.test.mjs`

Expected: failure because the source still contains `span.ampersand` rather than the 14 required `connector-word` markers.

- [ ] **Step 4: Commit the failing test contract.**

```bash
git add tests/site.test.mjs
git commit -m "test: require readable and connectors"
```

### Task 2: Make the minimal markup-only connector change

**Files:**
- Modify: `index.html:111,186,188,190,269,282-284,305,318-319,352,354,391`
- Modify: `review-editable.html:180,253,332,363,475`
- Modify: `styles.css:297-302`
- Test: `tests/site.test.mjs`

- [ ] **Step 1: Replace the 14 production markers exactly.**

For every approved source instance, replace:

```html
<span class="ampersand">&amp;</span>
```

with:

```html
<span class="connector-word">and</span>
```

The resulting production text must include `Certified TikTok Shop TAP <span class="connector-word">and</span> CAP Partner`, `Algorithmic <span class="connector-word">and</span> Retention Audits:`, and `[The FLOURISH Advantage: Why HK <span class="connector-word">and</span> Why Us?]` exactly.

- [ ] **Step 2: Make the same replacement at the five review-copy locations only.**

Do not alter `Creator Whitelisting &amp; Spark Ads`, `Primary Social Media Handle &amp; Link`, `Name &amp; Job Title`, or `Company Name &amp; Website URL` in `review-editable.html`.

- [ ] **Step 3: Remove the obsolete presentation rule.**

Delete this entire rule from `styles.css`; do not add a replacement rule:

```css
.ampersand {
  font-family: Arial, Helvetica, sans-serif;
  font-size: 1em;
  font-weight: inherit;
  line-height: inherit;
}
```

- [ ] **Step 4: Run the focused contract in its green state.**

Run: `node --test --test-name-pattern="approved and connectors" tests/site.test.mjs`

Expected: `pass 2`, `fail 0`.

- [ ] **Step 5: Run all static source tests.**

Run: `node --test tests/site.test.mjs`

Expected: all source tests pass; no title, benefit, review-copy, logo-strip, or accessibility regression is reported.

- [ ] **Step 6: Commit the implementation.**

```bash
git add index.html review-editable.html styles.css tests/site.test.mjs
git commit -m "fix: use readable and connectors"
```

### Task 3: Extend public verification and pin the new candidate

**Files:**
- Modify: `check-https-cloud-assistant.sh:43-49,157-160,210-212`
- Modify: `deploy-cloud-assistant.sh:15,19-26,187`
- Modify: `tests/release.test.mjs:520-567`
- Test: `tests/release.test.mjs`

- [ ] **Step 1: Add a failing public-marker assertion to the release test.**

Add this helper assertion requirement to the existing public-check test:

```js
assert.match(check, /assert_occurrences\(\)/);
assert.match(check, /'<span class="connector-word">and<\\\/span>'/);
assert.match(check, /"14" "www homepage connector words"/);
```

Replace the six literal candidate-hash assertions in `final static rollout pins the audited candidate and never rolls Nginx back` with a helper that parses the named deployment constants and compares them to the freshly built files:

```js
function deploymentHash(script, name) {
  return script.match(new RegExp(`readonly ${name}="([a-f0-9]{64})"`))?.[1] ?? "";
}

await runFile(process.execPath, ["scripts/build-production-artifacts.sh"], {
  cwd: new URL("../", import.meta.url), encoding: "utf8",
});
assert.equal(deploymentHash(script, "EXPECTED_ARCHIVE_SHA"), await fileSha256(new URL("../release/flourishculturekol-homepage.zip", import.meta.url)));
assert.equal(deploymentHash(script, "EXPECTED_CHECK_SCRIPT_SHA"), await fileSha256(new URL("../check-https-cloud-assistant.sh", import.meta.url)));
assert.equal(deploymentHash(script, "EXPECTED_OLD_HOME_SHA"), "555f402344ebd2d4973ddb82a72fb2a30695fc2652622915685071689ab57e9c");
assert.equal(deploymentHash(script, "EXPECTED_OLD_STYLES_SHA"), "45a0e8110c100a4ba601ad0047f04d35f252830743443d4b72a0ee0ae824b812");
assert.equal(deploymentHash(script, "EXPECTED_NEW_HOME_SHA"), await fileSha256(new URL("../dist/index.html", import.meta.url)));
assert.equal(deploymentHash(script, "EXPECTED_STYLES_SHA"), await fileSha256(new URL("../dist/styles.css", import.meta.url)));
```

- [ ] **Step 2: Run the focused release test to demonstrate the red state.**

Run: `node --test --test-name-pattern="public release check|final static rollout" tests/release.test.mjs`

Expected: failure because the public checker lacks `assert_occurrences` and the deployment script still pins the prior candidate.

- [ ] **Step 3: Implement the strict public count.**

Add this function after `assert_contains` in `check-https-cloud-assistant.sh`:

```bash
assert_occurrences() {
  local file="$1"
  local needle="$2"
  local expected="$3"
  local label="$4"
  local actual
  actual="$(grep -oF "$needle" "$file" | wc -l | tr -d '[:space:]')"
  [[ "$actual" == "$expected" ]] || fail "$label contained $actual instances; expected $expected"
  pass "$label contains exactly $expected required instances"
}
```

After the homepage canonical/header assertions, add:

```bash
assert_occurrences "$WORK_DIR/index.html" '<span class="connector-word">and</span>' "14" "www homepage connector words"
```

- [ ] **Step 4: Build deterministic artifacts and pin their measured hashes.**

Run this exact sequence after the markup and checker edits:

```bash
npm run build:artifacts
new_home_sha="$(shasum -a 256 dist/index.html | awk '{print $1}')"
new_styles_sha="$(shasum -a 256 dist/styles.css | awk '{print $1}')"
archive_sha="$(shasum -a 256 release/flourishculturekol-homepage.zip | awk '{print $1}')"
check_sha="$(shasum -a 256 check-https-cloud-assistant.sh | awk '{print $1}')"
printf 'home=%s\nstyles=%s\narchive=%s\nchecker=%s\n' "$new_home_sha" "$new_styles_sha" "$archive_sha" "$check_sha"
```

Use those four measured values in the corresponding literals in `deploy-cloud-assistant.sh`: `EXPECTED_ARCHIVE_SHA`, `EXPECTED_CHECK_SCRIPT_SHA`, `EXPECTED_NEW_HOME_SHA`, and `EXPECTED_STYLES_SHA`. Preserve the old homepage/style hashes from Step 1, change the backup suffix and success text from `ampersand-font` to `and-word`, then run `npm run build:transfer` to produce the final transfer hash.

- [ ] **Step 5: Run the release tests and all local gates.**

Run:

```bash
node --test tests/release.test.mjs
npm test
npm run build
npm run build:transfer
npm run release:verify
```

Expected: every test passes; the static ZIP, checker, deployment script, and transfer bundle each have deterministic SHA-256 output. Record the four measured hashes from Step 4 and the final transfer SHA-256 for the release record.

- [ ] **Step 6: Commit release contracts.**

```bash
git add check-https-cloud-assistant.sh deploy-cloud-assistant.sh tests/release.test.mjs
git commit -m "test: verify deployed and connectors"
```

### Task 4: Validate rendered candidates and create the release anchor

**Files:**
- Generated: `dist/`, `release/`, `qa/browser-results.json`
- Modify: `qa/production-release-2026-08-30-and-word.md` only after production success

- [ ] **Step 1: Run the local static server from the candidate output.**

Run: `python3 -m http.server 4174 --directory dist`

Expected: the server reports that it is serving `dist` on port `4174`; do not stop or reuse an unrelated existing preview process.

- [ ] **Step 2: Check desktop and mobile rendering.**

At desktop and `390×844` widths, inspect the live local candidate. Assert 14 `.connector-word` elements exist, each has text `and`, the document has no horizontal overflow, and the Trusted, TikTok certification, service, creator-benefit, and Advantage contexts remain readable after natural wrapping.

- [ ] **Step 3: Create a source release anchor only after the tracked tree is clean.**

Run:

```bash
git status --short
# If the browser QA refreshed only its tracked generated results in this run,
# restore exactly those generated files before tagging; do not touch user-owned untracked files.
git restore --source=HEAD -- qa/browser-results.json qa/screenshots/contact-desktop-1440x1024.png qa/screenshots/contact-tablet-1024x1366.png qa/screenshots/contact-mobile-390x844.png qa/screenshots/contact-small-mobile-360x800.png
git diff --check
git diff --quiet
git tag -a and-word-connector-20260830 -m "Release candidate: readable and connectors" HEAD
git show --no-patch --format='%D%n%H%n%s' and-word-connector-20260830
```

Expected: the tag points to the implementation and release-contract commits; unrelated pre-existing untracked files are neither added nor altered. Skip the `git restore` line if QA did not modify those files in this run.

### Task 5: Publish only after fresh production preflight and explicit release approval

**Files:**
- Create: `qa/production-release-2026-08-30-and-word.md`
- Modify: `PROJECT_PROGRESS.md`

- [ ] **Step 1: Revalidate the real production target without writing.**

Run:

```bash
ve sts GetCallerIdentity
ve ecs DescribeInstances --EipAddresses.1 150.5.135.196 --MaxResults 100
ve ecs DescribeCloudAssistantStatus --InstanceIds.1 i-yeo9geadc0plsv0abgv0 --PageNumber 1 --PageSize 10
curl --noproxy '*' -fsS https://www.flourishculturekol.com/ -o /tmp/flourish-and-old-home.html
curl --noproxy '*' -fsS https://www.flourishculturekol.com/styles.css -o /tmp/flourish-and-old-styles.css
shasum -a 256 /tmp/flourish-and-old-home.html /tmp/flourish-and-old-styles.css
```

Expected: account `2103632597`; exactly one running `webhkhome` instance at `150.5.135.196`; Cloud Assistant `Running`; current public hashes equal the `EXPECTED_OLD_*` values in the new deployment script. Stop if any value differs.

- [ ] **Step 2: Present the exact temporary-transfer and Cloud Assistant write command, then obtain a new user confirmation.**

Create a new, empty temporary GitHub branch that contains only `release/flourish-production-transfer-v1.2.0.tgz`; verify its Raw URL hash against the measured transfer SHA-256. The server command must use a unique `/tmp/flourish-and-word-20260830-*` staging directory, check the outer SHA-256, extract the bundle, run `(cd "$stage" && sha256sum -c release/SHA256SUMS)`, then invoke `deploy-cloud-assistant.sh` with absolute paths. Do not run this write command until the user explicitly confirms it.

- [ ] **Step 3: Read Cloud Assistant terminal output and independently verify public content.**

Expected server output: exit `0`, all nested files `OK`, unchanged Nginx hash, a new protected backup path, public checker success, and `/review/healthz` success.

Run after server success:

```bash
curl --noproxy '*' -fsS https://www.flourishculturekol.com/ -o /tmp/flourish-and-public-home.html
curl --noproxy '*' -fsS https://www.flourishculturekol.com/styles.css -o /tmp/flourish-and-public-styles.css
shasum -a 256 dist/index.html /tmp/flourish-and-public-home.html dist/styles.css /tmp/flourish-and-public-styles.css
rg -o '<span class="connector-word">and</span>' /tmp/flourish-and-public-home.html | wc -l
curl --noproxy '*' -fsS https://www.flourishculturekol.com/review/healthz
```

Expected: local/public homepage hashes match, local/public CSS hashes match, marker count is `14`, and Review health JSON has `"ok":true`.

- [ ] **Step 4: Record evidence, clean temporary transfer state, and commit only documentation.**

Document the commit/tag, static/checker/transfer hashes, preflight invocation, successful invocation, backup path, public hashes, marker count, and retained Review health in `qa/production-release-2026-08-30-and-word.md`. Append a concise release line to `PROJECT_PROGRESS.md`. Delete the temporary GitHub artifact branch only after the independent public readback succeeds, then commit:

```bash
git add qa/production-release-2026-08-30-and-word.md PROJECT_PROGRESS.md
git commit -m "docs: record and word connector release"
```
