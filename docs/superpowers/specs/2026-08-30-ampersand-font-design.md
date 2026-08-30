# 全站重点 & 符号字体调整设计

## 目标

让首页重点文本中的 `&` 使用 Arial 的常见字形，提高符号辨识度，同时保持 FLOURISH 现有的 Archivo 标题和 Space Grotesk 正文体系。

## 范围

仅处理用户截图标出的 14 个首页重点文本实例，并在 `review-editable.html` 中同步对应实例：

1. Trusted by Leading Global Brands & Innovators
2. Certified TikTok Shop TAP & CAP Partner
3. 官方合作说明正文与认证注记中的各 1 个符号
4. Data-Driven Growth & Performance Insights
5. 该服务的 3 个粗体条目标题
6. Creative Strategy & Localization
7. 该服务的 2 个粗体条目标题
8. 创作者权益的 2 个粗体条目标题
9. The FLOURISH Advantage: Why HK & Why Us?

## 实现

- 为每个目标 `&` 加入 `<span class="ampersand">&amp;</span>`。
- 在 `styles.css` 中定义唯一的 `.ampersand` 规则：`Arial, Helvetica, sans-serif`；继承父元素的字号、字重、颜色和行高。
- 不新增字体文件、JavaScript、颜色、背景、间距或响应式断点。
- 不改变未标出的普通正文、表单标签、按钮、链接、服务简介和可访问名称。

## 验收

- 首页上述 14 个目标符号均由 `span.ampersand` 包裹。
- 非目标正文的 `&amp;` 保持原样。
- `index.html` 与 `review-editable.html` 的对应展示文本保持一致。
- 桌面与移动版中，目标标题不发生意外换行、裁切或横向溢出。
- 现有网站测试与新增的结构回归测试通过。
