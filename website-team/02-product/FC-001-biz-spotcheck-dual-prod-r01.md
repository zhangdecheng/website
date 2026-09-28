# FC-001 业务抽核｜双包生产公网轻确认 r01

| Field | Value |
| --- | --- |
| 项目/任务 | FLOURISH-WEBSITE / FC-001 双包生产（热修 PR#3 + Hero A） |
| 验收人 | 产品经理（Emma） |
| 日期 | 2026-09-17 |
| 候选 tip | `4fa552e`（与 Ethan QA 公网哈希一致） |
| 对照 | 内容 r01；热修抽核 `FC-001-biz-spotcheck-hotfix-cta-r01.md`；Ethan `06-qa/fc-dual-prod-r01/Ethan-qa-r01.md` |
| 结论 | **公网轻确认通过。** 申请链可用；Hero A 未改已批创作者主张与 CTA 语义。 |

## 抽核

| 项 | 结果 |
| --- | --- |
| 首页 Apply → `/?role=creator#contact` | **通过** |
| `/creators/` Apply/Join → `/?role=creator#contact` | **通过**（页 SHA `f13d05c4…` 与热修后独立页一致） |
| 联系脚本含 `contactRoleFromLocation` / 顶栏下滚动 | **通过**（公网 js 前缀 `e2b1b507…`） |
| 首屏创作者句 + Explore/Apply | **仍在** |
| `/creators` 任一单平台 5,000 + 四条主张 | **仍在**（未因 Hero A 改创作者页） |
| Hero A | 首页 SHA 已更新（`9e161177…`）；属视觉覆盖，**未**改坏申请语义 |

## 未测

- 浏览器实点预选态（依赖 Iris 目视 + 工程脚本；本岗只读 HTML/JS/CSS）
- 邮件送达

## 下一动作

@项目主管（Alex）：产品侧可关单（待 Iris 目视读回一并收口亦可）。
