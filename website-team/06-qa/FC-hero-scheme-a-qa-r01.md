# FC-Hero-Scheme-A｜视觉/CSS 质量验收报告 r01（只读核验，不发布）

| Field | Value |
| --- | --- |
| 项目/任务 | FLOURISH-WEBSITE / Hero Scheme A（P0） |
| 作者 | 工程 QA（Ethan） |
| 版本 | r01｜2026-09-17 16:04 WITA（UTC+8） |
| 状态 | **候选本地源码验收完成** — 未 push、未 merge、未部署 |
| 候选 | PR https://github.com/zhangdecheng/website/pull/1 ；分支 `cursor/hero-scheme-a-css-dd24`（draft） |
| 候选 SHA | `bfdf6d6b63644376ea5d1ebdb96f0fd84df377d2` |
| Base | `codex/flourish-site-refresh` @ `577753f52fe0ffd86293409edc5d9c805061e0e9` |
| 对照 Handoff | `/workspace/website-team/09-design/hero-scheme-a-handoff-r01/HANDOFF.md` + `hero-scheme-a.css` |
| 环境 | 独立 worktree `/workspace/website-team/website-hero-qa`（detached @ 候选 SHA）；主仓 `/workspace/website-team/website` 仍停留在 FC-001 分支，未破坏 |
| 范围声明 | **不发布、不合并**；生产线上效果 **未测**（未授权部署） |

---

## 1. 总结果

| 范围 | 结果 |
| --- | --- |
| **本地源码对照 HANDOFF（CSS 选择器/属性）** | **PASS** |
| **改动面（仅 `styles.css`；`index.html` hero HTML 未改）** | **PASS** |
| **prefers-reduced-motion 规则合理性** | **PASS**（全局缩短 transition；hover 不再回压暗 live 卡） |
| **本地静态服关键帧截图（桌面/中屏/移动）** | **BLOCKED / 未出图**（本机 headless Chrome 崩溃：`No space left on device` / GL 初始化失败；静态服 `http://127.0.0.1:8777/` 曾返回 200，但截图未落盘） |
| **生产公网视觉** | **未测**（生产发布未授权） |

**一句话结论：** 候选 SHA `bfdf6d6` 与 Iris Handoff Scheme A 源码对齐（cover + `center 20%`、无 multiply、无 live `brightness(0.65)`/`sepia`、16/10 与 4/5、figcaption 全宽渐变）；**本地源码 PASS**；关键帧与线上效果未出证；**不得**据此部署。

**可转 Iris：** Scheme A CSS 候选 `bfdf6d6` 已按 Handoff 源码验收通过（cover / center 20% / 去 multiply 与 live 发闷滤镜 / 16:10·4:5 / 全宽图注），关键截图与生产未测，待 Alex 授权后再发。

---

## 2. 证据路径与命令摘要

| 证据 | 路径 / 命令 | 结果摘要 |
| --- | --- | --- |
| Worktree | `git fetch` → `git worktree add … FETCH_HEAD` | `/workspace/website-team/website-hero-qa` @ `bfdf6d6`；主仓仍 `cursor/fc-001-creators-page-6c84` |
| HEAD SHA | `git rev-parse HEAD` | `bfdf6d6b63644376ea5d1ebdb96f0fd84df377d2` |
| 改动面 | `git diff --stat/--name-only base...HEAD` | **仅** `styles.css`（+49 / −42）；`index.html` **无 diff** |
| PR 元数据 | GitHub PR #1 | draft；head = 同上 SHA；1 file changed；标题 Scheme A cover/caption CSS |
| Handoff 属性对齐 | 候选 `styles.css` hero 切片 vs `hero-scheme-a.css` | 关键 filter / 渐变 stop / cover / position / ratio / figcaption 字符串均命中 |
| 静态服 | `python3 -m http.server 8777`（worktree） | 首页 HTTP 200；截图步骤失败 |
| 生产 | — | **未测** |

---

## 3. 逐项对照 HANDOFF

### 3.1 改动范围

| 检查项 | 预期 | 结果 | 判定 |
| --- | --- | --- | --- |
| `index.html` hero 结构 | 否（保持三卡） | 相对 base **无** `index.html` diff；三卡 + figcaption 文案仍为 Global Talent Network / Data-Driven Growth / Brand Partnership Hub | **PASS** |
| 图注文案 / 新图素材 | 否 | 未改 HTML 文案与路径 | **PASS** |
| `styles.css` hero 规则 | 是 | 唯一改动文件 | **PASS** |
| `/review/` 等范围外 | 不动 | diff 无 review | **PASS** |

### 3.2 具体修改点（源码）

| # | Handoff 要求 | 候选实现（`styles.css`） | 判定 |
| --- | --- | --- | --- |
| 1 | `.hero-card img` / `.hero-card-live img`：`object-fit: cover`；`object-position: center 20%`；提高 brightness；live 去掉 `brightness(0.65)` + `sepia` | 共享规则为 cover + `center 20%` + `brightness(0.98)`；live 覆盖为 `saturate(1.05) contrast(1.05) brightness(1)`；**生效规则中无** `brightness(0.65)` / `sepia`（仅注释提及） | **PASS** |
| 2 | `::before` 去掉 `mix-blend-mode: multiply`；底部可读渐变 | `.hero-card::before, .hero-card-live::before` 共用底部渐变 + `mix-blend-mode: normal`；hero 切片内无 multiply | **PASS** |
| 3 | landscape ≈ 16/10；portrait/live ≈ 4/5 | `.hero-card-landscape { aspect-ratio: 16 / 10 }`；`.hero-card-portrait, .hero-card-live { aspect-ratio: 4 / 5; max-height: 100% }` | **PASS** |
| 4 | figcaption 全宽贴底渐变；`font-weight: 600`；略增字号；`uppercase`；去掉毛玻璃小圆角块 | `left/right/bottom: 0`；渐变衬底；`font-size: 12px`；`font-weight: 600`；`text-transform: uppercase`；`border-radius: 0`；`backdrop-filter: none` | **PASS** |
| Hover | 保持 lift，不回压暗 | hover filter 与 handoff 一致；live hover 无 sepia / 0.65 | **PASS** |
| 附加（PR） | `@media (max-width: 1100px) .hero-card-live` padding 14→0 | 已改为 `padding: 0`，避免中屏暗边 gutter | **PASS**（合理增强） |

### 3.3 残留 / 已知非阻塞项

| 项 | 说明 | 影响 |
| --- | --- | --- |
| `@media (max-width: 1100px) .hero-card { height: clamp(320px, 36vw, 430px); }` | 预存高度 clamp；cover 仍铺满框；非 contain 黑边 | P0 可接受；PR 已记录；若焦点裁切不佳属后续素材/微调，非本轮 FAIL |
| `@media (max-width: 560px)` portrait/live `min-height` | 地板高度；4/5 + `height: auto` 仍在 | 可接受 |
| `.brand-logo-set img { object-fit: contain }` | logo 条，非 hero | 无关 |
| 未使用 `.hero-live-interface` 规则 | HTML 无对应节点 | 非本轮范围 |
| `brightness(0.65)` / `sepia` 字符串 | 仅出现在注释 `/* Was: … */` | **非生效样式** |

### 3.4 prefers-reduced-motion

| 检查项 | 结果 |
| --- | --- |
| 规则仍在 | `@media (prefers-reduced-motion: reduce)`：全局 `transition-duration` / `animation-duration` → `0.01ms`；`.reveal` 取消位移动画；logo track 停动画 |
| 与 Scheme A 交互 | hover 滤镜不再把 live 卡压回发闷；缩短 duration 下 hover 不会出现异常长动画；**合理保留** |
| 独立仪器化 hover 实测 | 未做（截图环境 BLOCKED）；源码判定 **PASS** |

### 3.5 LCP / 首屏图策略

| 检查项 | 结果 |
| --- | --- |
| 首张 hero 图 | 仍 `loading="eager"` + `fetchpriority="high"` + 有意义 `alt` / 宽高；HTML 未改 | **PASS（保持）** |

---

## 4. QA 建议清单回写（HANDOFF）

| 建议项 | 本轮 |
| --- | --- |
| 桌面 1440 / 1280：三卡无大块黑边死区 | **源码 PASS**（cover）；关键截图 **BLOCKED** |
| 竖卡 `center 20%` 裁切 | **源码 PASS**；实像素焦点 **未截图核验**（可后续 Iris 目视） |
| 平板 / 中屏黑边缓解 | **源码 PASS**（cover + live padding 0）；截图 **BLOCKED** |
| 图注对比度可读 | **源码 PASS**（全宽渐变 + 600 + uppercase） |
| `prefers-reduced-motion` hover | **源码 PASS** |
| LCP eager / fetchpriority | **PASS（未改）** |

---

## 5. 结论与门禁

| 门禁 | 状态 |
| --- | --- |
| 可作「待授权发布前」视觉 CSS 源码基线 | **是**（SHA `bfdf6d6`） |
| 可合并 / 可生产发布 | **否** — 本轮明确不发布、不合并；需 Alex 确认 +（建议）补关键帧或 Iris 目视后再放行 |
| 生产效果 | **未测 / 未授权** |

**总结果：PASS（本地源码）**；关键帧 **BLOCKED**；生产 **未测**。

---

## 6. 工作区卫生

- 验收用独立 worktree：`/workspace/website-team/website-hero-qa`（detached `bfdf6d6`）。
- 主仓 `/workspace/website-team/website` 保持 `cursor/fc-001-creators-page-6c84`，working tree clean。
- 临时静态服端口 8777 已尝试停止；未写入生产、未改远端。
