# FC 现网热修视觉复检 r02

- **日期**: 2026-09-17
- **检查人**: Iris（视觉）
- **候选**: PR https://github.com/zhangdecheng/website/pull/3 @ `3044444d0d7991273ed61131c36d1bf04f2f572d`
- **预览**: http://127.0.0.1:8768/ （工作树 `website-hotfix-r02`）
- **对照**: r01 FAIL 门槛（`fc-live-visual-check-r01`）
- **结论**: **PASS（预览）— 可交 Emma 抽核申请链；未另授权前不发生产**

---

## A｜`/creators/` H1「Creator」字头

| 视口 | 结果 | 证据 |
|---|---|---|
| ~1280 | **PASS** — 字头完整，未被顶栏裁切 | `creators-h1-1280.png` |
| ~900 | **PASS** — 同上 | `creators-h1-900.png` |

源码确认：`.creators-article h1 { line-height: 1.15; padding-top: 0.22em; overflow: visible; }`（不再吃全局 0.92）。

---

## B｜三条 CTA → Creator + 联系区标题在顶栏下可见

测量约定：`#contact` 标题 `getBoundingClientRect().top` ≥ 顶栏高度（实测 headerH=76）；`[data-role-select]` / 角色控件 = `creator`。

| 路径 | 结果 | 关键测量 | 证据 |
|---|---|---|---|
| B1 首页点 Apply as a creator | **PASS** | href=`/?role=creator#contact`；role=`creator`；headingTop≈425 | `path1-home-apply.png` |
| B2 `/creators/` 点 Apply as a creator | **PASS** | 同上 | `path2-creators-apply.png` |
| B3 直开 `/?role=creator#contact` | **PASS** | role=`creator`；headingTop≈425；belowHeader=true | `path3-direct.png` |

加测（非门禁）：首页「Join Our Roster」同页滚动 → role=`creator`，标题同样在顶栏下（`path1b-join-roster.png`）。

工程单测（Ethan）：`contactRoleFromLocation` / `scrollContactTargetIntoView` 相关 `node --test` 3/3 通过 — 与目视一致。

---

## 门禁

| 包 | 状态 |
|---|---|
| 现网 Creator 裁切 + CTA 锚点热修 | **视觉 r02 PASS**；交 **Emma** 抽核申请链后，再由 Alex/授权决定是否上线 |
| Hero 方案 A 短视口 | 仍为预览 PASS，**分轨**，不随本热修发生产 |

**总评**: **PASS — 视觉侧放行本预览候选进入 Emma 抽核；生产发布需另授权。**
