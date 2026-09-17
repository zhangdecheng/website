# FC-001｜只读技术评估 r01（首页轻改 + 独立创作者页）

| Field | Value |
| --- | --- |
| 项目/任务 | FLOURISH-WEBSITE / FC-001 |
| 作者 | 工程（Ethan） |
| 版本 | r01｜2026-09-17 15:43 WITA（UTC+8） |
| 状态 | **仅评估** — 不写代码、不改站、不发布；开发与发布须用户另授权 |
| 输入 | `02-product/FC-001-prd-r02.md`；`04-content/FC-001-content-candidates-r01.md`；`01-control/FC-001-execution-plan-r02.md`；本地源码 `/workspace/website-team/website` @ `577753f`；公网只读 curl（未提交表单） |
| 源码 tip | `577753f52fe0ffd86293409edc5d9c805061e0e9`（分支 `codex/flourish-site-refresh`；工作树干净，0 改动） |
| 明确非目标 | 不实施改动；不碰 `/review/`；不授权/不执行发布；不改邮件路由；不改 Nginx（本评估不触达服务器） |

证据标注约定：**已确认** = 本环境实读源码或公网探针；**推断** = 基于文档/架构合理外推；**未确认** = 缺直接证据。

---

## 1. 结论摘要（给 Alex）

1. **可进入开发评估结论：技术路径清晰，无「参数名完全未知」类硬阻塞**；但仍须用户**另授开发权**后才能开工。本轮评估**不构成**开发或发布授权。
2. **路径**：源码与构建白名单中**不存在**真实 `/creators` 或 `/creator-partnership` 页面。公网对二者及任意未知路径均 **HTTP 200 + 首页 HTML（软回退）**——这是 **SPA-style fallback（假占用）**，不是独立创作者页。PRD「占用则改用备选」**不应**仅因软回退而放弃 `/creators`；备选路径目前同样软回退，换路径不能解决问题。
3. **Creator 预选**：同页已有可用机制（`data-select-contact-role="creator"` + `<select name="role">`）。**跨独立页 → 首页表单**尚无 query/hash 预选逻辑；参数名建议与现有字段对齐为 **`role=creator`**（缺口：须小改 `contact-form.js`，开发阶段实施）。
4. **robots / sitemap**：源码无真实文件；公网 `/robots.txt`、`/sitemap.xml` 亦被软回退成**首页 HTML**（非 `text/plain` / XML）。AC-07 当前公网**不通过**；须在发布包内加入真实文件，并做 MIME/正文验收。
5. **发布产物**：静态站为 allow-list 复制构建（`npm run build` → `dist/` → zip）；新页、robots、sitemap、首页 title/JSON-LD 均须**显式进入** `scripts/build-release.mjs` 白名单及下游测试/部署哈希门。工作量整体 **中**；Nginx 现网 SPA fallback + 部署脚本「禁止改 Nginx SHA」是路径形态选择的关键约束。
6. **风险**：最高风险是「只加文案页却未修软回退/未进包」导致 AC-06/07/09 失败。不阻塞评估；**阻塞开发开工的是授权闸**，不是未知技术。

---

## 2. 已确认事实

| # | 事实 | 证据 |
| --- | --- | --- |
| F1 | 本地 tip = `577753f`，与预期一致；`git status` 干净 | `git rev-parse` / `status` |
| F2 | 源码根目录无 `creators.html`、无 `creators/`、无 `creator-partnership*`；无 `robots.txt` / `sitemap*.xml` | 目录列举 + 文件名搜索 |
| F3 | 静态构建白名单仅：`index.html`、`privacy.html`、`styles.css`、`script.js`、`contact-form.js`、`site-core.js` + 引用 assets | `scripts/build-release.mjs` |
| F4 | 产物打包：`npm run build` → `build-production-artifacts.sh` 打 `release/flourishculturekol-homepage.zip`；transfer 另有固定脚本 allow-list | README / scripts |
| F5 | 部署目标 web root：`/var/www/flourishculturekol.com`；部署脚本校验 **Nginx 配置 SHA 不变** | `deploy-cloud-assistant.sh` |
| F6 | 联系表单角色：`<select name="role" data-role-select>`，选项 `brand` / `creator`；默认展示 Brand 字段面板 | `index.html` |
| F7 | 同页 Creator CTA：`href="#contact"` + `data-select-contact-role="creator"`；JS 将 `roleSelect.value = "creator"` 并 `setRole`、滚到 `#contact` | `contact-form.js` L192–207；`index.html` L360 |
| F8 | `contact-form.js` / `script.js` / `site-core.js` **无** `URLSearchParams` / `location.search` 读 `role` | 源码检索 |
| F9 | 提交成功后表单 reset，并把 role 设回 `brand` | `contact-form.js` L251–254 |
| F10 | 首页有自指 canonical `https://www.flourishculturekol.com/`；Privacy 有自指 canonical；**无** JSON-LD；**无** `noindex` meta（首页/Privacy 源码） | `index.html` / `privacy.html` |
| F11 | 公网 `/` 与本地 `index.html` SHA-256 一致：`c96f7bc5…39e1`；Privacy 一致：`a36c172a…04c2` | curl + `sha256sum` |
| F12 | 公网 `GET /creators`、`/creators/`、`/creator-partnership`、`/creator-partnership/`、`/creators.html`、`/robots.txt`、`/sitemap.xml`、随机不存在路径：均为 **200**，`content-type: text/html`，正文 SHA **与首页相同**（软回退） | curl 2026-09-17 |
| F13 | apex `flourishculturekol.com/creators` → **301** → `www.../creators`（路径保留） | curl |
| F14 | 历史预检记录写明「首页 location 使用 SPA fallback」 | `qa/production-preflight-2026-08-18.md` |
| F15 | `review-editable.html` 刻意不进发布包；本评估不触达 `/review/` | README / runbook |
| F16 | Creator 邮件路由目标在文档中为 `irisa@…`（本评估**不**改路由、**不**抽测发信） | README |

---

## 3. 未确认项 / 推断

| # | 项 | 状态 | 说明 |
| --- | --- | --- | --- |
| U1 | 现网 Nginx `try_files` 精确写法 | **未确认** | 仓库仅有 API include；完整 `00-flourishculturekol.com.conf` 不在源码树。行为上已确认 SPA fallback。 |
| U2 | 部署真实文件后，无扩展名 `/creators` 是否自动命中 `creators/index.html` 或 `creators.html` | **推断偏是 / 未实装验证** | `privacy.html` 证明「真实文件可覆盖 fallback」；无扩展名路径依赖 `index` 指令或目录结构，须开发后验收。 |
| U3 | 软回退后搜索引擎是否已把 `/creators` 当重复首页收录 | **未确认** | 需 Noah/GSC；不影响「应用真实页」方向。 |
| U4 | footer 现网逐字句与内容 r01 对齐度 | **未确认（内容侧）** | 不挡技术评估；实现前 Olivia 可出 r02。 |
| U5 | 条件性福利事实表 | **未确认** | 文案已降级；无工程阻塞。 |
| I1 | 推荐用 `creators/index.html` + 根绝对资源路径实现 `/creators`，以避免改 Nginx | **推断（推荐）** | 因部署门禁要求 Nginx SHA 不变。 |
| I2 | 跨页预选参数名用 `role`（值 `creator`）与表单字段同名 | **推断（推荐）** | 与 payload / select 一致，降低歧义。 |

---

## 4. 路径占用（对应 AC-06）

### 4.1 源码 / 构建

| 路径 | 源码 | 构建白名单 / dist 预期 |
| --- | --- | --- |
| `/creators` | **无**独立页文件 | **未纳入** allow-list |
| `/creator-partnership` | **无** | **未纳入** |

结论：**源码与构建层面均未占用。**

### 4.2 公网（2026-09-17 curl）

| URL | HTTP | 正文 | 判定 |
| --- | --- | --- | --- |
| `/creators` | 200 | = 首页 SHA | **软回退首页**（非独立页） |
| `/creators/` | 200 | = 首页 | 同上 |
| `/creator-partnership` | 200 | = 首页 | 同上 |
| `/creator-partnership/` | 200 | = 首页 | 同上 |
| `/creators.html` | 200 | = 首页 | 文件亦不存在于公网 |

PRD 要求：真实独立 URL、GET 200、正文 ≠ 首页、禁止软回退。  
**现状：两路径皆不满足「独立页」；亦非「已有另一套创作者内容占坑」。**

### 4.3 路径建议（开发授权后）

| 建议 | 理由 |
| --- | --- |
| **默认仍用 `/creators`** | 软回退 ≠ 内容占用；备选同样软回退，换名无益 |
| 实现形态优先：`creators/index.html`（或经验收证明的等价映射） | 争取 clean URL 且**不改 Nginx**（部署脚本锁 Nginx SHA） |
| 资源引用用根路径（`/styles.css`、`/assets/...`、`/contact-form.js` 等） | 子目录页相对路径会断 |
| 备选 `/creator-partnership` **仅当**出现真实异页冲突时启用 | 当前无此冲突 |

**不阻塞开发评估**；开发后 AC-06 必测：SHA/标题/H1 ≠ 首页，且不再等于首页软回退。

---

## 5. Creator 预选（对应 AC-08）

### 5.1 现有机制（已确认）

| 机制 | 有无 | 说明 |
| --- | --- | --- |
| `<select name="role">` 可见字段 | 有 | `brand` / `creator` |
| Hidden field 预选 | **无** | — |
| Query `?role=creator` | **无读取逻辑** | — |
| Hash / 其它 JS 深链 | **无**（仅同页 `data-select-contact-role`） | — |
| 同页 CTA | **有且可用** | Talent 区「Join Our Roster →」 |

载荷侧角色字段名为 **`role`**（`site-core.js` / FormData）。

### 5.2 从独立页 CTA 预选是否可行？

| 方案 | 可行性 | 工作量 | 备注 |
| --- | --- | --- | --- |
| A. 链到 `/#contact` 或 `/?role=creator#contact` + 增强 `initContactForm` 读 query | **可行（推荐）** | 低 | 参数名建议 **`role`**，合法值 `creator`（及可选 `brand`）；读入后 `setRole`，与同页 CTA 行为对齐 |
| B. 独立页内嵌同一套 `[data-contact-form]` | 可行 | 中高 | 复用 API/校验；须复制 markup + 注意子路径模块 URL |
| C. 仅链 `/#contact` 不改 JS | **不满足 AC-08** | — | 默认仍为 Brand |

**缺口（须开发阶段补）**：跨文档预选；建议验收用例：从 `/creators` 点 Primary CTA → 落地首页联系区且 **Creator 已选中、Creator 字段面板可见**。  
**不改邮件路由**（与 PRD 一致）。本评估不发信抽测。

### 5.3 参数名结论

- **推荐对外/跨页参数名：`role`**
- **推荐预选值：`creator`**
- 同页继续可用：`data-select-contact-role="creator"`
- 内容稿 CTA「Apply as a creator」应对齐上述之一，避免 sole「Contact Us」

---

## 6. robots.txt / sitemap / canonical（对应 AC-07、AC-06 部分）

### 6.1 源码现状

| 文件/标签 | 状态 |
| --- | --- |
| `robots.txt` | **不存在** |
| `sitemap.xml` | **不存在** |
| 首页 canonical | 有，自指 `/` |
| Privacy canonical | 有，自指 `/privacy.html` |
| JSON-LD | **无** |
| `noindex` / `X-Robots-Tag` | 首页响应头未见 `X-Robots-Tag`；源码无 noindex meta |

### 6.2 公网现状（已确认）

| URL | 结果 |
| --- | --- |
| `/robots.txt` | 200，**HTML 首页**（非 robots 文本） |
| `/sitemap.xml` | 200，**HTML 首页** |
| `/sitemap_index.xml` | 200，**HTML 首页** |

→ AC-07「打开真实文件」当前公网 **失败**。这是既有 SEO 债务，FC-001 发布包必须一并偿还。

### 6.3 新页 SEO 接入要点（开发时）

1. 新页 **自指 canonical**（`…/creators` 或确认后的最终 URL）；禁止指向首页。
2. 独立 `title` / `description` / H1；与内容 r01 同版；接入最小 JSON-LD（删掉候选中的 `primaryImageOfPage: null`）。
3. **勿**对索引页加 noindex。
4. `robots.txt` 应为真实文本（例：允许抓取公开页；可 `Sitemap: https://www.flourishculturekol.com/sitemap.xml`）；**Allow/Disallow 勿误伤新页**；`/review/` 维持现有保护策略（本评估不改 review）。
5. `sitemap.xml` 含首页、Privacy、**新页绝对 URL**；发布后 curl 验 `Content-Type` 与正文非 HTML。
6. 二者必须进入 **build allow-list**，否则公网会继续软回退成首页。

---

## 7. 发布产物清单（对应 AC-09）

### 7.1 构建 / 部署链（已确认）

```text
源码（allow-list 文件）
  → node scripts/build-release.mjs          # dist/
  → scripts/build-production-artifacts.sh   # flourishculturekol-homepage.zip
  →（可选）build-production-transfer.sh     # 含 zip + 部署脚本的 transfer 包
  → deploy-cloud-assistant.sh               # unzip → /var/www/flourishculturekol.com
  → check-https-cloud-assistant.sh          # 公网/本机哈希与行为门禁
```

Contact 服务另包（`build:contact`）；**FC-001 主路径是静态包**，预选若只改前端 JS 则不必然改 Contact 服务（`role` 字段已支持）。

### 7.2 进包工作量拆分（估计，开发授权后）

| 改动项 | 进包步骤 | 工作量 |
| --- | --- | --- |
| 新创作者页 HTML（+必要 CSS 类复用） | 写入源码 → **加入** `build-release.mjs` `files`（或目录拷贝规则）→ 更新 release 测试期望 | 中 |
| 首页 title / description / 首屏一句 / 入口链 / JSON-LD | 改 `index.html`（已在白名单） | 低–中 |
| `contact-form.js` 跨页 `role` 预选 | 已在白名单；补单测/浏览器 QA | 低 |
| `robots.txt` / `sitemap.xml` | **新建并加入白名单**；更新 artifacts 必有文件检查 | 低–中 |
| 部署门禁 SHA / check 脚本断言 | 更新 `EXPECTED_*` 与 AC 探针（含新 URL、robots/sitemap 非 HTML） | 中 |
| Nginx | **默认不改**；若必须 rewrite 才改，则同步解锁部署脚本 Nginx SHA 门禁 | 高（尽量避免） |
| `/review/` | **不碰** | — |

### 7.3 「源码 = 构建包 = 公网」验收建议

1. 本地 `npm run build` 后：`dist/` 含新页、robots、sitemap；抽 SHA。  
2. 打开 zip 清单：同上，无 `__MACOSX`，无 `review-editable.html`。  
3. 授权发布后：公网对应路径正文 SHA = dist；robots/sitemap **不是**首页 HTML。  
4. `/creators` 标题/H1/canonical ≠ 首页。  
5. 回归：`/`、`/privacy.html`、Contact health、**`/review/healthz`**（只读健康，不登录改内容）。

---

## 8. 风险与工作量

| ID | 风险 | 等级 | 是否阻塞「评估→可开发」 | 控制 |
| --- | --- | --- | --- | --- |
| R1 | 公网 SPA 软回退：未进包的新路径/robots/sitemap 仍显示首页 | **高** | 否（方案已知） | 文件进白名单；AC 显式比对 SHA/MIME |
| R2 | 跨页 Creator 未预选导致 AC-08 失败 | **高** | 否 | 开发必做 `role` query（或内嵌表单）+ 用例 |
| R3 | clean URL `/creators` 与「禁止改 Nginx」冲突 | **中** | 否 | 优先 `creators/index.html` + 绝对资源路径；上线前实读 |
| R4 | 只改首页文案、漏 JSON-LD/canonical/sitemap | **中** | 否 | 按内容 r01 清单勾选 |
| R5 | 部署哈希门禁未更新导致发布脚本失败 | **中** | 否 | 与实现同 PR 更新 EXPECTED_* |
| R6 | 误动 `/review/` 或邮件路由 | **高**（若发生） | 流程上禁止 | 范围写死；检查脚本保留 review 断言 |
| R7 | 软回退历史 URL 的收录噪音 | **低–中** | 否 | 真实页 + 自指 canonical + sitemap；GSC 观察交 Noah |
| R8 | footer 文案未实读 | **低**（工程） | 否 | 语义可先接；Olivia r02 对齐 |

**整体实现工作量（授权后）**：约 **中**（1 个清晰工程切片：静态页 + SEO 文件 + 小 JS + 构建/测试/门禁更新）。  
**无「技术不可知」阻塞**；**开发开工阻塞项 = 用户开发授权**（及成稿已确认前提，执行方案 r02）。

---

## 9. 建议验收清单（技术 AC，对齐 PRD AC-06～09）

> 以下供开发授权后自测 / QA；本评估不执行。

### AC-06 独立页 URL

- [ ] `GET https://www.flourishculturekol.com/creators`（或书面确认的唯一等价路径）→ **200**
- [ ] 正文 SHA / 可见 H1 / `<title>` **≠** 首页；不得再等于首页软回退包
- [ ] 自指 `<link rel="canonical" href="…/creators">`（最终 URL）
- [ ] 响应与源码均无意外 `noindex` / 误杀 robots
- [ ] 带/不带尾斜杠行为可接受（301 规范化或两者同文）；apex→www 路径不丢

### AC-07 robots + sitemap

- [ ] `/robots.txt` 为**真实文本**（非 HTML 首页）；含 Sitemap 绝对地址（若采用）
- [ ] `/sitemap.xml` 为**真实 XML**；含新页**绝对 URL**（及首页、Privacy）
- [ ] 二者存在于源码、`dist/`、zip、公网，SHA 一致

### AC-08 跨页 CTA 预选

- [ ] 创作者页 Primary CTA 文案为 Creator 申请语义（非 sole Contact Us）
- [ ] 点击后进入既有表单流，且 **`role=creator` 已选中**、Creator 字段可见
- [ ] 不改 Contact API 路由/收件人配置
- [ ] （可选，另授权）生产 Creator 提交邮件抽测——**非本评估范围**

### AC-09 发布产物三一致

- [ ] 源码 allow-list ⊇ 新页 + robots + sitemap + 改动的 JS/首页
- [ ] `npm run build` 产物与 zip 清单一致
- [ ] 授权发布后公网与 zip/dist SHA 一致
- [ ] `/review/` 健康检查仍过；未改 review 静态/代理范围

### 附加回归（建议）

- [ ] 首页同页「Join Our Roster」预选仍可用
- [ ] Privacy、安全头、Contact health/config 回归
- [ ] `review-editable.html` 仍不在发布包内

---

## 10. 明确非目标（再声明）

- 本文件 **只读评估**，**不实施**任何 website 仓库或公网改动。  
- **不碰** `/review/`。  
- **不授权、不执行发布**。  
- 不改邮件路由、不扩教程站/CMS、不新出 OG 图（除非另开 brief）。  
- 技术通过 ≠ 业务通过 ≠ 效果达标（邮件量非本轮 SEO 必达）。

---

## 11. 建议下一动作（须另授权）

1. **Alex**：将本评估交工程交付群存档；向用户确认「仅评估已完成」。  
2. **用户**：若同意开发，单独回复开发授权（执行方案 P3）；未授权则停。  
3. **授权后 Ethan（另任务）**：按本文路径建议实现 `/creators` + SEO 文件 + `role` 跨页预选 + 更新构建/测试/门禁；自测 AC-06～09。  
4. **Emma**：实现后业务验收同一内容候选。  
5. **Noah**：GSC/收录并行，不挡开发。  
6. **发布**：须用户再次明确授权；本评估不触发发布。

---

## 12. 附录｜探针摘录（2026-09-17）

| 探针 | 结果摘要 |
| --- | --- |
| `GET /` | 200，SHA `c96f7bc5…39e1`，title「FLOURISH CULTURE \| Global Influencer Marketing」 |
| `GET /creators` | 200，同 SHA，同 title（软回退） |
| `GET /creator-partnership` | 200，同 SHA（软回退） |
| `GET /robots.txt` | 200，`text/html`，同首页 SHA |
| `GET /sitemap.xml` | 200，`text/html`，同首页 SHA |
| `GET /privacy.html` | 200，SHA `a36c172a…04c2`，独立 Privacy 页 |
| 本地 website 工作树 | 评估前后 **0** 文件改动（仅本报告写于 `05-engineering/`） |

---

*报告结束。*
