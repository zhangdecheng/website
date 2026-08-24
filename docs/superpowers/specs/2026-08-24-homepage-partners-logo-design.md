# Homepage Hero、品牌 Logo 与官方合作伙伴区域设计规格

日期：2026-08-24
状态：用户已确认布局 A；等待书面规格复核

## 目标

在不改变现有 “Neon Culture Bridge” 黑色、珊瑚红、暖金、Archivo + Space Grotesk 视觉系统的前提下，完成四项首页视觉修改：

1. 让 Hero 右侧三张图片完整显示，不再裁掉主要人物或画面内容。
2. 将 Tripo 调整为品牌轨道首位，并加入用户提供的 uSmile Logo。
3. 在 `Who We Are` 与 `Services` 之间加入 TikTok Shop TAP/CAP 官方合作伙伴区域。
4. 使用用户指定 Canva 设计对应的新版 FLOURISH CULTURE Logo，替换站内 Logo 和浏览器标签图标。

## 范围冻结

### 本次范围

- 静态首页、Privacy 页面和本地 `review-editable.html` 的品牌 Logo 引用。
- Hero 图片网格、品牌 Logo 轨道、官方合作伙伴区域及响应式样式。
- 新增并处理用户明确提供或批准的 Logo、徽章资产。
- 更新页面/构建测试、资产清单和本地视觉 QA 证据。

### 非目标

- 不修改 Contact 表单、API、邮件路由、Turnstile、Nginx、证书或 `/review/` 应用。
- 不部署生产、不提交远端、不推送 GitHub、不修改 GitHub Pages。
- 不新增依赖、动画库、设计系统或与四项修改无关的重构。
- 不增加未经用户提供或明确批准的品牌 Logo、业绩数字或合作主张。

### 验收基准

- 用户提供的五张参考图。
- Canva 设计 `DAHTIN4lxzs` 对应的 778 × 276 新版 Logo 图源。
- 用户已选择官方合作伙伴区域布局 A：左徽章、右文案。
- 现有站点设计真相 `design-options/neon-culture-bridge.png` 和项目现行 CSS 令牌。

## 设计决策

### 1. Hero 三图完整展示

- 桌面端将现有三等分竖卡改为非对称网格：两张横图在左侧上下排列，竖图在右侧跨两行。
- 每张图片使用完整显示策略；容器比例贴近原图比例，并以暗色底承接极少量比例差异，不再通过 `object-fit: cover` 裁掉内容。
- 保留现有三个标题、暗色照片处理、细边框、轻微层次位移和克制 hover；不新增叠层界面或复杂动效。
- 820px 以下改为单列，三张图按原语义顺序排列；图片维持完整显示且不产生横向滚动。

### 2. 品牌 Logo 轨道

- 首轮顺序固定为：Tripo、Temu、Anker Innovations、uSmile、Dreame、AliExpress、Lovart、Atoms、KSP Performance。
- uSmile 使用用户提供的源图生成透明深色背景适配版本：移除白底，黑色字形转为白色，保留品牌蓝色元素。
- Tripo 沿用已确认的透明裁切资产，并通过具名 class 控制光学尺寸；不再依赖品牌位置对应的 `nth-child` 序号。
- HTML 只保留一组可访问 Logo。`script.js` 从首轮 DOM 自动克隆一组 `aria-hidden` 复制轮，形成无缝滚动；无 JavaScript 时仍显示静态首轮。
- `prefers-reduced-motion: reduce` 下停止滚动并隐藏复制轮。

### 3. 官方合作伙伴区域

- 插入位置：`Who We Are` 结束后、`Services` 开始前。
- 桌面采用用户已确认的布局 A：左侧并排 TAP/CAP 徽章，右侧英文信息；移动端先徽章、后文案。
- 徽章从用户提供的参考图中提取为透明 PNG，只保留官方徽章本体；说明文字保持可访问 HTML，不烘焙进图片。
- 继续使用黑色背景、暖金强调、珊瑚红小标签、现有边框和间距令牌，不新增卡片阴影或装饰性动画。
- 合作资质表述以用户提供的徽章和业务要求为内容依据；本次技术工作不把页面呈现等同于已向 TikTok 独立核验资质真实性。

确认文案：

- Eyebrow：`OFFICIAL PARTNERSHIP`
- 标题：`Certified TikTok Shop TAP & CAP Partner`
- 引导语：`Dedicated KOL marketing support for every category.`
- 正文：`FLOURISH is an officially certified TikTok Shop TAP & CAP partner across multiple markets, with recognized qualifications for creator marketing and commerce enablement.`
- 类别：`We support clients across e-commerce, consumer electronics, automotive, AI, personal care, and other sectors.`
- 徽章说明：`TikTok Shop multi-market certified TAP & CAP partner.`

### 4. 全站 FLOURISH CULTURE Logo

- 以 Canva 设计对应的用户原始 778 × 276 图源为唯一视觉来源。
- 生成透明背景横向锁定版本，保留双行白字与右侧金色图形标志，不重绘、不改字形、不改变构图。
- 替换首页 Header、Footer、Privacy Header 及本地 `review-editable.html` 的现有 HTML 文字锁定标志。
- 从同一图源裁切金色图形标志作为 favicon，替换当前空 `data:,` 图标；首页、Privacy 和本地审核页保持一致。
- Logo 使用 `<img>`、明确尺寸和替代文本；窄屏只缩放，不切换成另一套未经确认的标志。

## 资产与文件影响

预计新增：

- `assets/flourish-logo-lockup.png`
- `assets/flourish-mark.png`
- `assets/brand-logos/usmile.png`
- `assets/partner-badges/tiktok-shop-tap.png`
- `assets/partner-badges/tiktok-shop-cap.png`

预计修改：

- `index.html`
- `privacy.html`
- `review-editable.html`
- `styles.css`
- `script.js`
- `tests/site.test.mjs`
- `scripts/browser-qa.cjs`（仅在现有 QA 无法覆盖新区域时最小补充）
- `docs/ASSET_MANIFEST.md`
- `docs/CHANGELOG.md`

`dist/`、`release/` 和 QA 截图由现有构建/验证命令生成，不作为手工源码编辑对象。

## 可访问性与降级

- 新区域使用有语义的 `section`、标题、段落和描述性图片替代文本。
- 首轮品牌 Logo 保留品牌名 alt；克隆轮清空 alt 并设置 `aria-hidden="true"`。
- 页面禁用 JavaScript时，品牌首轮仍可见；仅无缝滚动降级为静态展示。
- 移动端不缩小正文到低于现有可读字号；不新增自动播放内容。
- 继续尊重键盘焦点和 `prefers-reduced-motion`。

## 测试与验证

### 自动化

1. 先更新测试，使其验证新 Logo 路径、favicon、Hero 三图结构、品牌顺序/uSmile、单一首轮与运行时复制逻辑、官方合作伙伴文案和素材。
2. 运行 `node --test tests/site.test.mjs`。
3. 运行 `npm run build`，读回确认 `dist/index.html` 与源码预览结构一致，新资产进入构建。
4. 运行 `npm test`；若仅生产哈希钉死测试因本地候选物变化失败，必须单独如实记录，不能描述为全通过。
5. 运行 `npm run release:verify` 作为本地门禁；该命令不得连接或写入生产。

### 浏览器 QA

- 检查 1440 × 1024、1024 × 1366、390 × 844、360 × 800。
- Hero 三张图完整显示，无主要内容裁切。
- 新 Logo 在 Header/Footer/Privacy 和 favicon 中清晰、比例正确。
- Tripo 第一、uSmile 第二；轨道无跳帧、无重复读屏、减弱动画可用。
- 官方合作伙伴区域在桌面双栏、移动端单列；徽章和英文文案无溢出。
- 页面无横向滚动、缺失图片、意外控制台错误或现有交互回归。

## 完成边界

本任务的“完成”仅指本地源码、构建和多视口验证完成。生产部署、公开域名读回、远端 Git 同步、Contact 收件箱与 `/review/` 内容回归均不在本次授权范围内，不能由本地测试推断为完成。
