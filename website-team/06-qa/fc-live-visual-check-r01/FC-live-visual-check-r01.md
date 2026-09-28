# FC 现网视觉/交互整体检查 r01

- **日期**: 2026-09-17
- **检查人**: Iris（视觉）
- **现场**: https://www.flourishculturekol.com/ （FC-001 已上线；Hero 方案 A **未**发生产）
- **范围**: 首页桌面优先 + `/creators/`；已知两项 + 其他必须修
- **证据目录**: `06-qa/fc-live-visual-check-r01/`
- **结论**: **FAIL — 不允许在仅修完「看起来差不多」后上线；已知两项需达到下方 PASS 门槛后再发，建议第二轮目视确认。**

---

## 已知问题 A｜大字「Creator」顶部被裁

| 项 | 结果 |
|---|---|
| 判定 | **FAIL**（`/creators/`） |
| 首页 Hero | **现网 HTML 已无** `hero-live-interface` / 叠加「Creator」大字；首页主标题为 *Scaling Global Impact for Visionary Brands.*，本项在首页 **无法按原描述复现**（见 `home-desktop-hero.png`）。 |
| `/creators/` | H1 为 **「Creator partnerships with FLOURISH」**。全局 `h1 { line-height: 0.92 }` 继承到 `.creators-article h1`（字号 `clamp(44px, 6vw, 72px)`），大写字头顶易被裁切/与固定顶栏视觉相撞。用户报障 + 裁切特写证据与该页 H1 吻合。 |
| 建议修法 | 为 `.creators-article h1`（或页面级 display 标题）单独设 `line-height ≥ 1.0`（建议 1.05–1.1）；确认顶栏下 `padding-top` 足够；避免父级 `overflow: hidden` 切字头。 |
| PASS 门槛 | 桌面 + 中屏打开 `/creators/`，H1「Creator」字头完整、不被顶栏遮挡。 |

---

## 已知问题 B｜Apply / Join creator CTA 锚定联系区不正确

| 项 | 结果 |
|---|---|
| 判定 | **FAIL** |
| 链接清单 | 首页/创作者页主 CTA：`/?role=creator#contact`；人才区「Join Our Roster」：`#contact` + `data-select-contact-role="creator"`。 |
| 角色预选 | 代码路径会读 `?role=creator`；现场点击后曾测到 `select` = `creator`（CDP）。**但**另有落地帧仍显示默认 Brand 表单字段——存在不稳定/路径不一致风险，须修到每次必达 Creator。 |
| 滚动落点 | 点击 Apply 后测到 `#contact` 的 `getBoundingClientRect().top ≈ -53px`（视口高 ~656），即区块顶已滚出视口上方；固定顶栏约 76px。`scrollIntoView({block:"start"})` **不一定吃** `scroll-padding-top`，标题/邮箱引导易被挡或「看起来没落到联系区」。 |
| 建议修法 | 1) 所有 creator CTA 统一：落地必 `role=creator` + 滚到联系区且 **标题在顶栏下完整可见**（给 `#contact` 足够 `scroll-margin-top`，或 JS 按 `--header-height` 算 offset）。2) 自检矩阵：首页点击、站内 `/creators/` 点击、直开 `/?role=creator#contact`。 |
| PASS 门槛 | 上述三条路径：URL/状态含 creator；角色为 Creator；联系区标题与表单首屏可见，不被顶栏遮住。 |

---

## 其他必须修（本轮上线相关）

1. **短视口首屏 CTA 被裁**（桌面截图可见主按钮仅露顶边）— 与 Hero 方案 A 视口评估一致；**不并入本次现网 Creator/锚点热修包**，已确认由 Ethan 在 **preview 方案 A** 处理。现网热修不必夹带方案 A。
2. 未把「遮罩加减」列为必须修（用户已跳过，维持现状）。

## 非阻断 / 备注

- Hero 方案 A 预览与本次现网热修 **继续分轨**；用户本机 P0 观感认可，短视口兼容走预览分支。
- 本环境截图像素高度常偏短（~650–720），结论以结构/交互测量 + 用户报障为准，不以短截图否定方案 A 方向。

---

## 上线门禁（给 Ethan）

| 包 | 门禁 |
|---|---|
| 现网 Creator 裁切 + CTA 锚点热修 | **未 PASS，禁止上线**。修完后请回传预览 URL/截图，Iris 做 **r02 复检**；r02 PASS 后才可发生产。 |
| Hero 方案 A 短视口兼容 | 已确认可开 **preview 实现**；与现网热修分开验收、分开发布。 |

**总评**: **FAIL — 需要第二轮（r02）**，不能「修完已知项即直接上线」除非 r02 目视 PASS。
