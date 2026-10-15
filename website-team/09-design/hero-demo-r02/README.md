# Hero Demo r02 — 头图方案对照（非生产）

本地视觉对照页，**不是**生产站点。勿直接拷进 `website/`。改站需立项后再由工程接入。

## 本地预览

```bash
cd /workspace/website-team/09-design/hero-demo-r02
python3 -m http.server 8766
```

浏览器打开：http://127.0.0.1:8766/compare.html

## 模式说明（Demo 顶栏）

| 按钮 | 根 class | 方案 | 头图右侧变化 |
|------|----------|------|--------------|
| **当前线上** | `mode-current` | Live baseline | 三卡 masonry；`object-fit: contain`；偏重遮罩 / multiply |
| **P0 方案A** | `mode-p0` | Scheme A | 仍为三卡 masonry；`cover` + `object-position: center 20%`；去掉 multiply、减轻暗滤镜；图注底部渐变衬底 + 加粗字重 |
| **P1 方案B** | `mode-p1` | Scheme B | 两张宽卡上下堆叠（Talent + Growth）；浮动信任胶囊仅用可核验文案 |
| **P2 方案C** | `mode-p2` | Scheme C | 一张沉浸大图 + 三张玻璃浮卡（三个卖点） |

次要区块（logo 条磨砂、TAP/CAP 略放大、服务序号提亮、Contact 暗→亮过渡）在非 current 模式下轻量开启，**主交付仍是头图 A/B/C**。

## 信任文案边界（E-E-A-T）

**允许：** `Official TikTok Partner`、`TAP / CAP Certified`；定性能力 `Retention Audits`、`ROI Tracking`。

**禁止：** 任何未核验指标（如 10M+、120+ Markets 等）。

## SEO 本 Demo 已落实

见 `compare.html` 顶栏下方「SEO / E-E-A-T 注释」折叠面板，摘要：

1. 真实文本 `figcaption`（非烧字图）
2. 有意义的 `alt`
3. `width` / `height` 降低 CLS
4. LCP：方案内首张可见主图 `eager` + `fetchpriority="high"`；次要图 `lazy`
5. 各方案保留语义 `figure` / `figcaption`
6. 信任文案可核验，无编造数据

页面带 `noindex,nofollow`，避免被误收录。

## 文件

- `compare.html` — 对照页（粘性中文顶栏 + 模式切换）
- `styles.css` — 自线上拷贝，使区块观感接近真站
- `demo-overrides.css` — 全部 P0/P1/P2（A/B/C）覆盖，按优先级注释
- `assets/` — 所需 webp / 徽章 / logo / 字体副本

## 源只读路径

- `/workspace/website-team/website/index.html`
- `/workspace/website-team/website/styles.css`
- `/workspace/website-team/website/assets/optimized/hero-*.webp`
- `/workspace/website-team/website/assets/partner-badges/`
- `/workspace/website-team/website/assets/brand-logos/`
