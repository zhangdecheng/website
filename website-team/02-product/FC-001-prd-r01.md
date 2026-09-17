# FC-001 最小 PRD / AC｜首页 meta 与结构化信息（达人主路径）

- 项目/任务：FLOURISH-WEBSITE / FC-001
- 作者：产品经理（brain）
- 版本：r01｜2026-09-16
- 状态：候选，待用户确认方案后进入内容制作
- 输入版本：`01-control/FC-001-decisions-r01.md`；`03-growth/FC-001-creator-en-opportunity-r01.md`；`00-context/FC-brand-intro-r01.pdf`（主张边界，本轮 meta 默认不用 PDF 业绩数字）

## 1. 一句话问题

搜英文「找创作者机构 / 经机构接品牌合作 / 申请孵化或加入网络」的达人，在 Google 结果里不容易把现有英站首页理解成可申请的创作者合作方；本轮只改首页 title、description 和 JSON-LD，不改页面结构。

## 2. 证据（来源 / 时间 / 指标）

| 项 | 状态 | 来源 |
| --- | --- | --- |
| 优先达人侧、英站+英文意图、meta-only | 已确认 | 用户 2026-09-16；`FC-001-decisions-r01.md` |
| 可公开主张先用 Why Creators 四条 | 已确认 | 用户；Leo r01 自官网公开页（2026-09-15 WebFetch） |
| 合格 Creator = 收到客户邮件 | 已确认（业务定义） | 用户 2026-09-16；本轮 SEO 必达不绑邮件量 |
| 成功怎么量：收录可核验 + 浏览量同比/环比 | 已确认 | 用户；浏览量未授站点分析前用 GSC 展示+点击代理（≠ PV），口径见 Noah |
| 机会落在 B 桶（agency / brand deals via agency / incubator / join network） | 合理推断 | Leo r01；未叠 GSC 搜索量 |
| 首页与 Creator 入口真实索引、展示/点击基期 | 未确认 | GSC/Ryze 未装通 |

## 3. 用户与使用端

- 目标用户：英文检索的创作者（找机构合作、接品牌单、申请孵化/加入网络）。
- 使用端：Google 搜索结果摘要 + 现有英站首页 `https://www.flourishculturekol.com/`（含现有 Creator 申请/联系入口）。
- 次要用户（本轮不优化）：品牌方咨询路径。

## 4. 目标 / 非目标

**必须做**
1. 首页英文 title：创作者优先可读，或品牌+创作者合作双读；能读出 creator partnership，不做「教你成为网红」承诺。
2. 首页英文 meta description：覆盖 B 桶三要素——合作什么、适合谁、如何申请/联系；主张可映射 Why Creators 四条。
3. 首页 JSON-LD：最小 Organization + 创作者合作/服务相关类型（实现集由 Ethan 按现有架构选定）；可写已公开的 HK 定位、平台名、TAP/CAP 公开句；无编造评分/评价/业绩。
4. 现有 Creator 申请/联系入口在文案语义上可被指向（入口本身已存在，本轮不改表单）。

**以后再做（本轮不做）**
- 新建独立 `/creators` 页、改版区块、教程博客、中文站、OG 换图、付费投放、Routine 启用。
- 把 PDF 中的业绩数字（如达人库规模、交付天数、ROI）写入 title/description，除非用户另批并做来源映射。
- 用邮件量作为本轮 SEO 通过条件。

## 5. 业务规则

1. 语言：仅英文。
2. 主张白名单（本轮默认可进 meta）：官网 Why Creators 四条——(1) Direct access to top global brands / sponsorships；(2) Monetization and operations（negotiation, compliance, payouts）；(3) Data-backed creator growth；(4) Global community and supply-chain / factory-tour access。另可用首页已公开的 Hong Kong East–West 定位、TikTok Shop TAP & CAP partner 表述。
3. 主张禁区：无来源数字/资质；A 桶 how-to（how to become an influencer、涨粉/算法教程承诺）。
4. 合格 Creator（业务）：以收到客户邮件为准。本轮产品验收只要求「孵化/合作主张可读 + 现有申请入口可达」；邮件量作后续观察，不进本轮必达。
5. 设计：本阶段不出图。

## 6. 成功指标与测量

由 Noah 在授权 GSC 只读后测量；本 PRD 只定业务含义，不编基期数字。

| ID | 指标 | 测量 | 通过条件 |
| --- | --- | --- | --- |
| S1 | 收录 | GSC 索引/网页或 URL 检查；至少首页，建议含 Creator 入口锚点所在 URL | 状态可核验；未收录须有可打开证据，不用展示=0 推断未收录 |
| S2 | 浏览量同比/环比 | 未授站点分析前：GSC Web 展示+点击作代理并标注 ≠ PV；完整日基期 | 同比、环比均为正；基期不齐或处理中则标未测，不编涨跌 |

CTR、平均排名、GEO 引用、表单/邮件量：辅助或后置，不进本轮必达。

## 7. 依赖与异常

- 内容：Olivia 出英文候选 + 事实/来源映射；PM 核对业务主张。
- 工程：Alex 在工程群单次交 Ethan；注入 title/description/JSON-LD，不改页面结构、不改 `/review/`。
- 数据：GSC 通后 Noah 交基线；Leo 可出机会清单 r02 叠数，不回改本轮范围。
- 异常：现网 HTML 本轮未能当场拉回；成稿前 Olivia/Ethan 须实际读取当前首页 title/description/JSON-LD 作为改前基线。缺 GSC 时方案仍可确认与制作，效果验收标未测。

## 8. 验收标准

区分：C=内容/业务；T=技术（Ethan）；B=业务验收（PM，同一候选）；M=效果测量（Noah）；U=用户决定。

| ID | 类型 | 输入 | 操作 | 预期 |
| --- | --- | --- | --- | --- |
| AC-01 | C/B | 批准的 title 候选 | 未参与讨论者阅读首页 title | 英文可读出 FLOURISH 提供创作者合作/孵化向服务；无 A 桶教程承诺；无无来源业绩数字 |
| AC-02 | C/B | 批准的 description 候选 | 同上 | 含合作内容、适合创作者、申请/联系语义；主张可逐条映射 Why Creators 四条或另批来源 |
| AC-03 | C/B | 现有首页 | 按文案语义寻找 Creator 申请/联系入口 | 入口仍可达（同页锚点或既有表单）；本轮不改入口字段 |
| AC-04 | C | 事实映射表 | 核对每条 meta/JSON-LD 主张 | 每条重要事实可追溯至官网公开句或用户另批来源；PDF 业绩数字默认未使用 |
| AC-05 | T | 固定候选源码 | 查看首页 `<title>`、meta description、JSON-LD | 与批准文案一致；JSON-LD 可解析；无编造 aggregateRating/评论；不改页面 DOM 结构、不改 `/review/` |
| AC-06 | T | 公网候选（若已授权发布） | 打开实际 URL 查看源码 | 公网读回与候选哈希对应；发布须另有用户授权 |
| AC-07 | M | GSC 指定属性 | URL 检查/索引报告 | S1 可核验；失败或无法访问标 BLOCKED/未测 |
| AC-08 | M | GSC 搜索效果 Web | 完整基期展示+点击同比环比 | S2；基期不齐标未测 |
| AC-09 | U | 本 PRD r01 | 用户确认方案 | 确认后方可交 Olivia 写英文候选；未确认保持候选状态 |

**技术通过 ≠ 业务通过 ≠ 效果达标。** 邮件量不作为 AC-01–AC-08 的失败项。

## 9. 明确不做

整页改版、新 URL、中文主攻、OG 图、教程站、把展示=0 写成未收录、无 GSC 时编造同比环比、本群派 Codex。

## 10. 待决定 / 开放问题

1. 用户是否批准本 PRD r01（AC-09）。未批不进入内容制作。
2. GSC 只读何时通：通前效果项 AC-07/08 标未测，不挡文案制作。
3. JSON-LD 具体 schema 类型由 Ethan 在实现计划中选定最小集；若与「不改 DOM」冲突，退回本岗缩范围，不擅自改页。

## 11. 下一动作

- 本文件：`02-product/FC-001-prd-r01.md`
- 下一负责人：项目主管（Alex）请用户确认本方案
- 用户确认后：内容与品牌编辑（Olivia）出首页 title/description/JSON-LD 英文候选及事实映射 → PM 业务核对 → Alex 交工程群 Ethan
- 设计本阶段跳过（已记录：无新图依赖）
