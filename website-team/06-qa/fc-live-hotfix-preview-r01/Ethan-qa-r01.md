# Ethan 质量抽核 r01｜现网热修预览（未上线）

| 字段 | 值 |
| --- | --- |
| 日期 | 2026-09-17 |
| 候选 | PR#3 @ `3044444d0d7991273ed61131c36d1bf04f2f572d` |
| 预览 | http://127.0.0.1:8768/ |
| 对照 | Iris r01 FAIL 门槛 |

## 源码/单测（已确认）

- `.creators-article h1` 使用独立 `line-height: 1.15`（不继承 0.92）— 源码可见
- contact 路径含 `role=creator` / `#contact` 滚动修正 — 以 Cursor 自测 + 本预览为准
- `node --test tests/contact-form.test.mjs`：见本机执行结果

## 结论

**技术预览候选可交 Iris r02**（未部署生产）。视觉 PASS 与三条路径目视仍以 Iris 为准；通过后 Emma 抽核 CTA→Creator 预选。
