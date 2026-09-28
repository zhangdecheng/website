# Hero simplify r01 → Ethan（preview only）

**任务**：官网首页 Hero 右侧媒体简化（对应用户现网反馈：黑影脏感 / 13″ MBA 首屏切不全 / 三卡杂乱）
**范围**：仅 preview/staging，**不上 production**，待用户目视通过后再开生产授权
**参考预览**：用户 Mac `http://127.0.0.1:8771/`（Iris 试验稿；实现以本边界为准）
**参考 CSS**：`09-design/hero-simplify-r01/hero-simplify-r01.css`
**参考 HTML**：同目录 `index.html` 中 `.hero-media`（已去掉中卡）

## 已确认方向（用户兜底，选项已跳过按此执行）

1. **去掉** Data-Driven Growth / Data-Driven Growth 卡片（原三卡中间那张）
2. **保留** Global Talent Network + Brand Partnership Hub 两卡并排
3. 两卡 **等高、统一 aspect-ratio 4/5**，gap ≈ 12px
4. **去掉** `.hero-card` 外阴影（`--organic-shadow` / box-shadow）
5. **去掉** 整卡 `::before` 底部深色蒙层
6. **图注**改为单层等高实色条（`rgba(10,9,8,.78)` 一类），不要渐变 smear
7. **13″ MBA 首屏**：desktop 短视口下 hero 高度约 `calc(100svh - header)`，左侧文案略收（h1/intro clamp），右侧 media 高度约 `min(52–58vh, 380–420px)`，保证首折内完整看见左文案+双卡

## HTML 变更边界

- `.hero-media` 内只留两张 `.hero-card`（diversity/talent + live/partnership）
- 删除 tech/growth 那张及其 picture/img
- `aria-label` 改为 two cards
- 图注文案保持现批准英文：**Global Talent Network** / **Brand Partnership Hub**（若线上文案不同，以现网已批准文案为准，不要擅自改营销措辞）

## CSS 变更边界

- grid：`talent | partnership` 两列 1fr 1fr；不再用 2×2 masonry
- 两卡 `aspect-ratio: 4/5`；`box-shadow: none`
- `::before { display:none }`
- `figcaption`：实色底、无 backdrop、无多层 gradient
- img：`object-fit: cover`；可轻微提亮（brightness ~1.03），避免再压暗
- hover：建议先关掉抬升/放大，减少缝边脏感（试验稿已关）
- 短视口 media query（min-width 821 + max-height ~820）收紧 padding / media height
- 移动端可改为上下堆叠、比例可改为约 16/10

## 不做

- 不改左侧营销主张文案（除非 Olivia/Emma 另开）
- 不引入新摄影素材；沿用现 Global Talent / Brand Partnership 图
- 不合并进 production
- 不改 SEO/其他板块

## 验收（Iris 目视）

preview URL 就绪后 @视觉设计师（Iris），提供：
- 桌面 ~1280×800（模拟 13″ 首折）整屏截图
- 右侧双卡特写（看缝、阴影、图注条是否齐）
- tip / commit

Iris 通过后再谈生产授权。
