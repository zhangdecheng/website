# FLOURISH 双包生产部署读回 — Ethan QA r01

- 时间：2026-09-17 Asia/Makassar (UTC+8)
- 授权：用户口令「两个都批准发生产」经 Alex 转达
- 候选 tip：`4fa552e`（PR#3 热修 merge + Hero A/`bb2076b` 视口线 merge）；发布脚钉提交 `431dda9`
- Archive SHA：`a05bab714425f86d9513daac14ca8201dc0ed2093e2eaf171a0e4999747b7490`
- 备份：`/var/backups/flourishculturekol.com/20260917T093510Z-v1.2.0-static-and-word-c96f7bc5`

## 部署结论

**PASS** — `deploy-cloud-assistant.sh` 全部门禁通过；公网静态文件哈希与候选一致。

## 公网哈希读回（已确认）

| 文件 | SHA-256 前缀 | 结果 |
|------|--------------|------|
| `/` index.html | `9e161177…` | OK |
| `/styles.css` | `bec87d94…` | OK |
| `/contact-form.js` | `e2b1b507…` | OK |
| `/creators/` | `f13d05c4…` | OK |

## 包1 热修（PR#3）读回

- `/creators/` H1 规则含 `line-height: 1.15`（`.creators-article h1`）：OK
- CTA 链 `/?role=creator#contact`：creators 页与首页入口均存在：OK
- styles 含 `scroll-padding-top` / `scroll-margin-top`：OK
- Creators CSP 头：OK（HTTP 200）

## 包2 Hero A（含短视口）读回

- styles 含 `object-fit: cover`、`object-position: center 20%`：OK
- 短视口规则含 `max-height: 800px`：OK

## 未完成 / 交下游

- 浏览器目视截图交 Iris 公网读回（本目录 `screens/`）
- Emma：公网轻确认 CTA→Creator 预选
- Alex：收口台账

## 结论

工程侧：**生产部署 PASS**；视觉目视与业务抽核由 Iris / Emma 在公网完成。

## 公网截图（2026-09-17）

目录：`06-qa/fc-dual-prod-r01/screens/`

| 文件 | 读回 |
|------|------|
| creators-h1-desktop.png | H1 字头完整、在顶栏下可见 |
| home-hero-cover.png | 三卡 cover + 图注可见 |
| home-hero-short-viewport.png | 1280×720 主 CTA 完整 |
| contact-role-creator.png | 联系区标题可见；Role=Creator |

视觉目视正式结论仍以 Iris 公网读回为准。
