# FC-001 业务抽核｜公网上线后文案对齐（r01）

| Field | Value |
| --- | --- |
| 项目/任务 | FLOURISH-WEBSITE / FC-001 |
| 验收人 | 产品经理（Emma） |
| 日期 | 2026-09-17 |
| 触发 | Alex 收口后按约定抽核线上文案 vs 内容 r01 |
| 对照 | `04-content/FC-001-content-candidates-r01.md`；先前 `02-product/FC-001-biz-accept-impl-r01.md` |
| 核验面 | 公网只读 GET `https://www.flourishculturekol.com/`、`/creators/`、`/robots.txt`、`/sitemap.xml`（2026-09-17） |
| 结论 | **对齐通过，无需复验。** 业务验收 impl r01 对同一内容继续有效。 |

## 抽核结果

| 项 | 结果 |
| --- | --- |
| 首页 title / description / 首屏创作者句 + Explore/Apply | 与内容 r01 一致；品牌 H1 仍保留 |
| `/creators` title / H1 / Lead / 四条 / Who / How / CTA / 非教程声明 | 与内容 r01 一致；CTA → `role=creator` |
| 粉丝门槛 any one platform 5,000+ | 公网可读，非合计 |
| 条件性福利（project basis / TAP&CAP 市场） | 未升普遍承诺 |
| 首页 SHA 前缀 vs creators | `41cdf6d1…` ≠ `f13d05c4…`（独立页，支撑业务可读路径已生效） |
| robots / sitemap | 真实文本/XML（工程已 PASS；本岗仅确认可打开） |

## 未宣称

- 未重开全量 AC-01–05 业务验收（无偏离）。
- 未测邮件送达、GSC 收录/效果（AC-10–12）。

## 下一动作

@项目主管（Alex）：抽核通过，可按发布收口；效果观察交 Noah（GSC）按既定口径，不挡本轮工程关闭。
