# 已确认业务决定

## 早期 FC-001（2026-09-16）

- 优先受众：达人侧（获客/孵化）；品牌咨询次要
- 首验语言/市场：官网英文；示例意图/关键词亦用英文
- 可公开主张：品牌介绍材料范围内均可写；成稿须映射到来源页，无来源数字/资质不外推
- 品牌介绍源文件：`00-context/FC-brand-intro-r01.pdf`

## DISC-001 冻结后升版（2026-09-16）

- 方案冻结：`03-growth/DISC-001-flourish-creator-seo-geo-plan-r03.md` + `DISC-001-business-inputs-r01.md` + `DISC-001-handoff-pack-r01.md`
- **范围（已扩，取代仅 meta）**：首页轻改（摘要 + 首屏一句创作者说明 + 入口）+ 独立英文页 `/creators`；含 title/description/JSON-LD；不建教程站；不做整站改版
- 受众：TikTok / Instagram / YouTube；欧美、东南亚、南美 + 其他
- **粉丝门槛**：≥5000，**任一单平台**（TikTok 或 Instagram 或 YouTube）
- 服务定位：品牌撮合 + 运营支持 + 成长辅导（非默认独家经纪 / 零基础培训班）
- 申请：复用首页底部 Creator 流程；CTA 预选 `role=creator`
- 成功怎么量：交付与链路验收优先；搜索展示/点击（人工 GSC 可先）；收录可核验；申请拆分送达/有效/目标匹配/SEO获客；不把邮件量当 SEO 及格线
- 执行顺序（用户 2026-09-16 确认）：Emma PRD → Olivia 文案（Noah 可并行基线）→ Emma 业务验收 → 用户确认 → 转工程交付群评估；**先不开发**；开发须另授权并在工程群执行
- 设计：本阶段默认不新增视觉系统；独立页若需版式另开 brief

## 仍待 / 风险

- GSC：人工可先；连接器非前置（Ryze 安装仍待另批）
- 条件性福利事实表（工厂参访、TAP/CAP 等）未齐前不得写成普遍承诺
- Creator 预选参数名、路径占用、发布产物一致性：工程群核验
- 发布仍须单独授权

## 数据（2026-09-17｜Noah）

- GSC 人工基线 r01：已写入并可打开：`/workspace/website-team/08-results/FC-001-gsc-baseline-r01.md`
- 属性：`sc-domain:flourishculturekol.com`（Web）；点击 2 / 展示 38 / CTR 5.3% / 均排 2.5；图仅 2026-09-13～14，同比环比未测
- 首页已收录；`/creators` 未收录（页未上线，预期）
- Ryze 已卸，走免费浏览器 GSC；不挡文案；Leo 可叠机会清单 r02
- 用户成稿确认（AC-13）与执行方案 r02 仍待确认；确认前不转工程开发

## 用户确认（2026-09-17）

- 口令：**确认 FC-001 内容 r01，并按执行方案 r02 推进**
- 成稿锁定：`04-content/FC-001-content-candidates-r01.md`（Emma 业务已通过）
- 执行：按 `01-control/FC-001-execution-plan-r02.md` → **转 Website 工程交付群，仅技术评估**；开发仍须另授权
- 同步边界：规则类不进群（见 alex-response-rules）

## 并行（Iris FYI｜2026-09-17）

- 首页 Hero **方案 A（P0，CSS 为主）** 用户已锁；B/C 暂缓
- 交接：`09-design/hero-scheme-a-handoff-r01/`；对照 `hero-demo-r02/compare.html`
- 待 Ethan QA 后再排发布窗口（与 FC-001 创作者页评估可并行，发布仍须另批）

## 工程评估（2026-09-17｜Ethan）

- 报告：`05-engineering/FC-001-tech-eval-r01.md`；源码 tip `577753f`（无改动）
- 结论：技术路径清晰，**无硬阻塞**；开发/发布须用户另授权
- `/creators`：源码未建页；公网软回退首页（假占用）→ 仍建议用 `/creators`
- Creator 预选：同页机制可用；跨页建议 `role=creator`（开发时改 contact-form.js）
- robots/sitemap：源码无、公网亦软回退 HTML → 须进发布白名单
- 工作量：中；不碰 `/review/`

## 开发授权（2026-09-17）

- 用户口令：**授权 FC-001 开发**
- 范围：按 `05-engineering/FC-001-tech-eval-r01.md` + `04-content/FC-001-content-candidates-r01.md` + PRD r02 实施首页轻改 + `/creators` + Creator 预选 `role=creator` + 真实 robots/sitemap 进发布白名单
- **不含发布**：上线须用户另授权
- 负责人：Ethan（实现/自测/质量）→ Emma（同候选业务验收）→ Alex 收口

## 质量验收（2026-09-17｜Ethan）

- 候选：PR#2 `cursor/fc-001-creators-page-6c84` @ `bc5f63b`
- 报告：`06-qa/FC-001-qa-r01.md`
- 本地 AC-06/07/08：**PASS**；生产公网因未部署软回退 → **BLOCKED**
- 未 merge、未部署；下一棒：Emma 业务验收同一候选；发布须用户另批后再公网复测

## 业务验收（实现｜2026-09-17｜Emma）

- 候选：PR#2 @ `bc5f63b`；报告：`02-product/FC-001-biz-accept-impl-r01.md`
- 结论：AC-01–05 **业务通过**（本地/源码）；≠ 公网生效
- 下一闸：用户另批 **merge + 发布**；部署后 Ethan 补公网 AC-06/07/09

## Hero 方案 A｜预览授权（2026-09-17｜Iris 转述用户）

- **口令范围**：仅合到 **预览/staging**，**不发生产**
- 候选：PR #1 @ `bfdf6d6`（分支 `cursor/hero-scheme-a-css-dd24`）
- 交接：`09-design/hero-scheme-a-handoff-r01/`；Ethan 本地源码 QA：`06-qa/FC-hero-scheme-a-qa-r01.md`
- 执行：Ethan 合预览并回预览 URL/SHA → Iris 观感核验
- **生产发布仍待用户另批**（与 FC-001 merge+发布闸分开）

## 用户确认（2026-09-17｜merge+发布）

- 口令：**授权 FC-001 merge+发布**
- 范围：merge PR#2（`bc5f63b`）并部署生产；部署后 Ethan 补公网 AC-06/07/09
- 负责人：Ethan（merge/部署/公网复测）→ Alex 收口
- 不含：Hero 方案 A（仍仅预览/staging，生产另批）

## 发布进度（2026-09-17｜Ethan）

- PR#2 已 merge：merge commit `5b17925`（候选 `bc5f63b`）
- 生产包已在本地；部署与公网 AC-06/07/09 进行中
- 范围仍不含 Hero/PR#1、不改 `/review/`

## Hero 方案 A｜预览观感（2026-09-17｜Iris）

- 预览观感：**PASS**（候选 `bfdf6d6`；本地预览 `http://127.0.0.1:8767/`）
- 签字：`06-qa/FC-hero-scheme-a-visual-signoff-r01.md`
- **未发生产**；生产仍待用户另批

## 发布进度续（2026-09-17 16:12｜Ethan）

- Merge：**PASS**（`5b179257…` @ `codex/flourish-site-refresh`）
- 本地构建/门禁：**PASS**（zip SHA `b3368a18…be0ae` 与 deploy 脚本 EXPECTED_* 一致）
- **生产部署 BLOCKED**：执行环境无 Volcengine/`ve` CLI 与凭据，无法对 `webhkhome`（`i-yeo9geadc0plsv0abgv0`）走 Cloud Assistant
- 公网 AC-06/07/09：**仍 FAIL（软回退）**；证据 `06-qa/FC-001-qa-r02.md`
- 待用户：在有 CLI 的终端按 runbook 投递 zip，或把火山发布通道交给 Ethan 后续复测

## 发布完成（2026-09-17｜Ethan｜Alex 收口）

- 生产部署：**PASS**（`webhkhome`）；备份 `20260917T081559Z-v1.2.0-static-and-word-c96f7bc5`
- 公网 AC-06/07/09：**PASS**（`/creators/` 独立页；robots/sitemap 真实；哈希与包一致）
- 证据：`06-qa/FC-001-qa-r03.md`
- 范围：FC-001 only；Hero/PR#1 **未发**
- 后续：Emma 可抽核线上文案是否仍对齐内容 r01；Noah 可跟 `/creators` 收录（非本轮阻塞）；部署脚本 pin 修正建议后续提交远端

## 产品抽核与最终收口（2026-09-17）

- Emma 公网文案抽核：**PASS**（对齐内容 r01）；报告 `02-product/FC-001-biz-spotcheck-live-r01.md`
- Ethan 工程同意收口；效果观察归 Noah（GSC），非本轮阻塞
- **FC-001 本轮关闭**
- 残留跟进（非本轮范围）：`deploy-cloud-assistant.sh` 旧 styles / Nginx SHA pin 仅在本地与服务器，**仓库远端未提交**；下次发布前建议先合入

## 现网热修跟进（2026-09-17｜Alex 盯进度）

用户确认 Iris+Ethan 已在做「基础上再优化 2 点」。台账按 Iris 现网检查 r01：

1. **问题 A**：`/creators/` 大字 H1「Creator」顶部被裁（`line-height: 0.92`）
2. **问题 B**：Apply / Join creator CTA 锚定 `#contact` 不正确（顶栏遮挡 + role 不稳定）

门禁：热修后 Iris r02 目视 PASS 才可发生产；与 Hero 方案 A 短视口预览分轨。
证据：`06-qa/fc-live-visual-check-r01/FC-live-visual-check-r01.md`

## 现网热修进度（2026-09-17｜Ethan）

- 热修 PR：https://github.com/zhangdecheng/website/pull/3 （`cursor/hotfix-creator-hero-contact-anchor-e015`）进行中
- 范围：A creators H1 裁切 + B CTA 锚点/role；**不含** Hero A
- 下一闸：本地预览 → Iris r02；r02 PASS 后再请用户批生产

## 现网热修｜预览已交 Iris r02（2026-09-17｜Ethan）

- PR#3 预览：`http://127.0.0.1:8768/` @ `3044444`
- Ethan 源码/单测抽核过；**未部署**
- 下一闸：Iris r02 → Emma 抽核 CTA→Creator → 用户批生产

## 现网热修｜Iris r02 PASS（2026-09-17）

- 候选：PR#3 @ `3044444`；预览 `http://127.0.0.1:8768/`
- 视觉 r02：**PASS**（A H1 字头 + B 三条 CTA 路径）
- 证据：`06-qa/fc-live-visual-check-r02/`
- 下一闸：Emma 抽核申请链 → 用户批生产（**未授权前不上线**）

## 现网热修｜Ethan 工程质量（同候选｜2026-09-17）

- 与 Iris r02 同一候选：PR#3 @ `3044444d0d7991273ed61131c36d1bf04f2f572d`
- 工程源码/单测抽核：**可交业务抽核**
- 下一闸：Emma 抽核申请链 → 用户批生产（未授权不上线）

## 现网热修｜Emma 抽核 PASS（2026-09-17）

- 候选：PR#3 @ `3044444`；预览 `http://127.0.0.1:8768/`
- 申请链抽核：**PASS**（首页 Apply、/creators Apply/Join、直开 `?role=creator#contact`）
- 报告：`02-product/FC-001-biz-spotcheck-hotfix-cta-r01.md`
- 门禁齐：Iris r02 + Ethan 工程 + Emma 抽核；**待用户授权生产发布**

## 用户确认（2026-09-17｜双包生产）

- 口令：**两个都批准发生产**
- 包 1：现网热修 PR#3 @ `3044444`（Creator H1 裁切 + CTA 锚点/role）→ merge + 生产部署 + 公网读回
- 包 2：Hero 方案 A（PR#1 / 预览已 PASS 线）→ merge + 生产部署 + 公网读回
- 负责人：Ethan；Iris/Emma 门禁已齐（热修）；Hero 按已验收预览候选上线
- Alex 收口

## 双包生产进度（2026-09-17｜Ethan）

- PR#3 热修：**已 merge**
- Hero A：已并入 tip `4fa552e`（基线含 `bb2076b` 视口线）；生产包与门禁哈希已打好
- 视觉门禁：Iris 确认包1 r02 PASS、包2 预览 PASS，部署后公网目视读回即可
- **当前阻塞**：生产上传/部署审批卡（Auto-review）；Ethan 改私聊弹卡给用户放行后继续部署与公网读回

## 双包生产完成（2026-09-17｜Ethan｜Alex 收口工程侧）

- tip `4fa552e` / 脚钉 `431dda9`：**生产部署 PASS**
- 备份：`20260917T093510Z-…`；QA：`06-qa/fc-dual-prod-r01/Ethan-qa-r01.md`
- 包1 热修 + 包2 Hero A（含短视口）公网哈希/规则读回 OK
- 待补：Iris 公网目视截图读回；Emma 公网轻确认 CTA→Creator

## 双包｜Emma 公网轻确认（2026-09-17）

- tip `4fa552e`：CTA→Creator **PASS**；Hero A 未改坏创作者主张
- 报告：`02-product/FC-001-biz-spotcheck-dual-prod-r01.md`
- 产品侧可关单；Iris 公网目视读回并行（截图：`06-qa/fc-dual-prod-r01/screens/`）

## Hero 现网反馈（2026-09-17｜用户→Alex）

- ① collage 黑影；② MBA 13″ 首屏信息完整；③ 右侧简化（兜底去 Data-Driven Growth）
- 证据：`09-design/hero-user-feedback-r01/`
- Iris 曾静默，已紧急重派；Ethan 等 Iris 边界后再改
