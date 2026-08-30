# Ampersand Font Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将首页截图所示的 14 个重点 `&` 改为 Arial 字形，并以可回读的生产证据发布到 FLOURISH 正式站。

**Architecture:** 每个目标符号均使用 `span.ampersand` 显式标记，由一条 CSS 规则提供 Arial 字体栈，不使用 JavaScript 或全局文本替换。测试锁定 14 个首页实例、非目标正文与 CSS 契约；发布只使用通过本地门禁的候选制品，并通过 ECS 和公网双向读回验证。

**Tech Stack:** 静态 HTML、CSS、Node.js 内置测试、Playwright Chrome QA、npm 制品构建、Volcengine ECS Cloud Assistant。

---

### Task 1: 建立失败的符号范围测试

**Files:**

- Modify: `tests/site.test.mjs`
- Test: `tests/site.test.mjs`

- [ ] **Step 1: 新增失败用例，锁定首页 14 个批准实例。**

```js
test("homepage marks only the 14 approved ampersands with the Arial hook", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");
  const marker = '<span class="ampersand">&amp;</span>';

  assert.equal(html.split(marker).length - 1, 14);
  for (const text of [
    `Trusted by Leading Global Brands ${marker} Innovators`,
    `Certified TikTok Shop TAP ${marker} CAP Partner`,
    `Data-Driven Growth ${marker} Performance Insights`,
    `Creative Strategy ${marker} Localization`,
    `The FLOURISH Advantage: Why HK ${marker} Why Us?`,
  ]) assert.match(html, new RegExp(text.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")));

  assert.match(css, /\\.ampersand\\s*{[\\s\\S]*font-family:\\s*Arial,\\s*Helvetica,\\s*sans-serif/);
  assert.match(html, /FLOURISH is an officially certified TikTok Shop TAP &amp; CAP partner/);
});
```

- [ ] **Step 2: 运行红灯测试。**

Run: `node --test --test-name-pattern="homepage marks only" tests/site.test.mjs`

Expected: 因标记数为 `0` 而失败，期望值为 `14`。

### Task 2: 用最小 HTML/CSS 改动使测试通过

**Files:**

- Modify: `index.html:111,186,188,190,269,282-284,305,318-319,352,354,391`
- Modify: `review-editable.html:180,253,332,363,475`
- Modify: `styles.css:after the display-heading rules near line 290`
- Test: `tests/site.test.mjs`

- [ ] **Step 1: 仅包裹首页 14 个批准的 `&`。**

```html
Trusted by Leading Global Brands <span class="ampersand">&amp;</span> Innovators
Certified TikTok Shop TAP <span class="ampersand">&amp;</span> CAP Partner
Data-Driven Growth <span class="ampersand">&amp;</span> Performance Insights
Algorithmic <span class="ampersand">&amp;</span> Retention Audits:
E-Commerce <span class="ampersand">&amp;</span> Direct-Response Optimization:
Audience Demographics <span class="ampersand">&amp;</span> Niche Matching:
Creative Strategy <span class="ampersand">&amp;</span> Localization
Script Audits <span class="ampersand">&amp;</span> UGC Production:
Supply Chain <span class="ampersand">&amp;</span> Offline Immersion:
Seamless Monetization <span class="ampersand">&amp;</span> Operations:
Global Community <span class="ampersand">&amp;</span> Supply Chain Access:
[The FLOURISH Advantage: Why HK <span class="ampersand">&amp;</span> Why Us?]
```

保留官方合作区正文和认证注记中的两个批准实例；不包裹其他正文、表单或链接的 `&`。在 `review-editable.html` 中同步该副本中已有的对应标题/眉题实例，不扩展到它的历史正文或表单标签。

- [ ] **Step 2: 添加唯一的字形规则。**

```css
.ampersand {
  font-family: Arial, Helvetica, sans-serif;
  font-size: 1em;
  font-weight: inherit;
  line-height: inherit;
}
```

- [ ] **Step 3: 运行绿灯测试。**

Run: `node --test --test-name-pattern="homepage marks only" tests/site.test.mjs`

Expected: `pass 1`、`fail 0`。

- [ ] **Step 4: 运行全量静态测试并提交实现。**

Run: `node --test tests/site.test.mjs`

Expected: 所有静态测试通过。

```bash
git add index.html review-editable.html styles.css tests/site.test.mjs
git commit -m "fix: clarify approved ampersand glyphs"
```

### Task 3: 视觉与候选制品验证

**Files:**

- Generated: `dist/`, `release/`, `qa/`

- [ ] **Step 1: 运行完整本地发布门禁。**

Run: `npm run release:verify`

Expected: 输出以 `local release candidate is ready` 结束。

- [ ] **Step 2: 在本地预览的桌面与移动宽度检查 14 个实例。**

Run: `npm run serve`

Expected: 目标符号使用 Arial 常规字形，标题不裁切、不溢出；合作区两个正文实例没有意外间距问题。

- [ ] **Step 3: 记录制品并创建发布锚点。**

Run: `git rev-parse HEAD && shasum -a 256 release/flourishculturekol-homepage.zip && shasum -a 256 release/flourish-production-transfer-v1.2.0.tgz`

Expected: 获取唯一源码提交及两个候选 SHA-256；只有工作树没有待提交源码改动时，才创建 `ampersand-font-20260830` 标签。

### Task 4: 生产预检、部署与读回

**Files:**

- Create: `qa/production-release-2026-08-30.md`
- Modify: `PROJECT_PROGRESS.md`

- [ ] **Step 1: 在真实云账号和目标主机上做只读预检。**

Run: `ve sts GetCallerIdentity && ve ecs DescribeInstances --EipAddresses.1 150.5.135.196 --MaxResults 100 && ve ecs DescribeCloudAssistantStatus --InstanceIds.1 i-yeo9geadc0plsv0abgv0 --PageNumber 1 --PageSize 10`

Expected: 身份可用，实例 ID 为 `i-yeo9geadc0plsv0abgv0`，主机为 `webhkhome`，Cloud Assistant 为 `Running`。任一项不符即停止发布。

- [ ] **Step 2: 通过 Cloud Assistant 创建精确 web root 备份并发布 Task 3 的候选包。**

按 `docs/PRODUCTION_RUNBOOK.md` 的受控顺序验证传输包 SHA-256、内层 `release/SHA256SUMS`，再运行 `deploy-cloud-assistant.sh` 发布静态 ZIP。命令仅可作用于 `/var/www/flourishculturekol.com` 的本次受限暂存目录和新备份目录；不得修改 Nginx、证书、Contact 服务或 `/review/`。

- [ ] **Step 3: 轮询 Cloud Assistant invocation 至终态并读回输出。**

Expected: 退出码 `0`，并含实际备份目录、Nginx 语法检查、Contact 健康检查和 `/review/healthz` 成功。已调度不是成功证据。

- [ ] **Step 4: 独立公网读回候选内容。**

Run: `curl --noproxy '*' -fsS https://www.flourishculturekol.com/ -o /tmp/flourish-home.html && shasum -a 256 /tmp/flourish-home.html && curl --noproxy '*' -fsSI https://www.flourishculturekol.com/`

Expected: 首页 `200`，包含 14 个 `<span class="ampersand">&amp;</span>`，HTML 与候选 `dist/index.html` 哈希一致；再确认 CSS `200`、桌面/移动浏览器字形正确以及 `/review/healthz` 为 `200`。

- [ ] **Step 5: 记录并提交发布证据。**

记录源码 commit/tag、两个制品 SHA-256、目标实例、invocation ID、备份路径、公开 HTTP/哈希和视觉 QA 结果；不记录密钥或 token。

```bash
git add qa/production-release-2026-08-30.md PROJECT_PROGRESS.md
git commit -m "docs: record ampersand font production release"
```
