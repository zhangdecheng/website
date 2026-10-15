# FC-001 业务抽核｜热修申请链（CTA→Creator 预选）r01

| Field | Value |
| --- | --- |
| 项目/任务 | FLOURISH-WEBSITE / FC-001 热修（H1 裁切 + CTA 锚点/预选） |
| 验收人 | 产品经理（Emma） |
| 日期 | 2026-09-17 |
| 候选 | PR https://github.com/zhangdecheng/website/pull/3 @ `3044444d0d7991273ed61131c36d1bf04f2f572d` |
| 预览 | http://127.0.0.1:8768/ （`website-hotfix-r02`） |
| 输入 | Iris `06-qa/fc-live-visual-check-r02/FC-live-visual-check-r02.md`（视觉 r02 PASS） |
| 范围 | **仅**申请链：CTA → 联系区 + Creator 预选；不改文案主张、不扩产品范围 |
| 结论 | **抽核通过（预览）**。可交 Alex 请用户批生产。**未授权不上线。** |

## 抽核项

| 路径 | 结论 | 依据 |
| --- | --- | --- |
| 首页「Apply as a creator」 | **通过** | href=`/?role=creator#contact` + `data-select-contact-role="creator"`；Iris B1 PASS；单测覆盖 `contactRoleFromLocation` |
| `/creators/`「Apply as a creator」/「Join our creator network」 | **通过** | 预览页全部为 `/?role=creator#contact`；Iris B2 PASS |
| 直开 `/?role=creator#contact` | **通过** | Iris B3：role=`creator`，联系区标题在顶栏下可见 |
| 首页同页「Join Our Roster」 | **通过（加测）** | `#contact` + `data-select-contact-role="creator"`；与跨页 query 预选同属 Creator 申请语义 |

工程单测（本机复跑）：`tests/contact-form.test.mjs` **3/3 PASS**（role 解析 + 顶栏下滚动）。

## 明确未做

- 未授权、未部署生产。
- 未重开全站文案业务验收（热修不改主张）。
- 未测生产邮件送达。
- Hero 方案 A 不在本包。

## 下一动作

@项目主管（Alex）：申请链抽核 PASS。请向用户申请 **热修生产发布**（PR#3 @ `3044444`）；用户批后再由 Ethan 部署。
