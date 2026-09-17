# FC-001 业务验收｜实现候选 r01（同一 SHA）

| Field | Value |
| --- | --- |
| 项目/任务 | FLOURISH-WEBSITE / FC-001 |
| 验收人 | 产品经理（Emma） |
| 日期 | 2026-09-17 |
| 候选 | PR https://github.com/zhangdecheng/website/pull/2 ；分支 `cursor/fc-001-creators-page-6c84` @ `bc5f63b5b76aa6ebab2c4e89c9f4b12766c66496` |
| 对照 | `04-content/FC-001-content-candidates-r01.md`；`02-product/FC-001-prd-r02.md` AC-01–AC-05；Ethan `06-qa/FC-001-qa-r01.md` |
| 核验面 | 本地源码 `/workspace/website-team/website` @ 上述 SHA（实读 `index.html`、`creators/index.html`） |
| 结论 | **业务通过（同一实现候选）**。不构成 merge / 发布授权。公网效果与生产 AC-06/07 仍以部署后 Ethan 复测为准。 |

## 逐项（AC-01–AC-05）

| ID | 结论 | 说明 |
| --- | --- | --- |
| AC-01 | **通过** | 首页 title=`Creator Partnerships & Brand Collaborations \| FLOURISH CULTURE`；description 与内容 r01 一致；可读出创作者可申请、三支柱、三平台与地区；无教程承诺、无 PDF 业绩数字。与 `/creators` 用词一致。 |
| AC-02 | **通过** | 首屏有 `hero-creator-note`：创作者合作一句 + `Explore creator partnerships`→`/creators` + `Apply as a creator`→`/?role=creator#contact`。品牌向 H1「Scaling Global Impact…」保留；diff 无 `/review/`。整体非整页改版（合理推断：轻改区块）。 |
| AC-03 | **通过** | `/creators` 含 H1、Lead、What you get 四条、Who should apply、How to apply、非教程声明、CTA `Apply as a creator` / `Join our creator network`（均链 `/?role=creator#contact`）；服务三支柱正确；无 sole「Contact Us」；未用 incubator / agency / management 原词作创作者定位。 |
| AC-04 | **通过** | 四条与 Hong Kong / TAP&CAP 表述可追溯已批内容 r01；第四条含 *project basis / not a universal guarantee*；TAP&CAP 标 supported markets / project and region。JSON-LD 已去掉 `primaryImageOfPage: null`（与内容稿工程注一致）。 |
| AC-05 | **通过** | Lead + Who should apply + meta/JSON-LD audience 均写明 **any one platform** / TikTok **or** Instagram **or** YouTube；明确非合计、非每平台都满 5,000。 |

## 与 Ethan 质量结论的衔接

| 项 | 状态 |
| --- | --- |
| 本地技术 AC-06/07/08 | Ethan **PASS**（本岗不重开技术验；抽核 CTA 预选链与文案一致） |
| 生产 AC-06/07/09 | Ethan **BLOCKED**（未部署软回退）→ **业务通过 ≠ 公网已生效** |
| 内容业务 AC（成稿） | 先前 `FC-001-biz-accept-content-r01.md` 已通过；本报告验的是**同一文案落入实现候选** |

## 明确未做 / 未宣称

- 未 merge、未发布、未做生产点击或邮件送达抽测。
- 未宣称 GSC 收录/展示提升（AC-10–12）。
- 首页既有导航「Contact Us」、品牌区「Campaign Management」等历史文案仍在；不视为本轮引入禁区词，亦不要求本轮清扫整站历史句。

## 下一动作

1. @项目主管（Alex）：业务验收已通过同一候选 `bc5f63b`。请向用户申请 **merge + 发布**（另批）；发布前勿将公网标通过。
2. 用户授权发布并部署后：@工程与质量负责人（Ethan）公网复测 AC-06/07/09；本岗不重复业务文案验收，除非实现偏离内容 r01。
3. 本报告：`02-product/FC-001-biz-accept-impl-r01.md`

