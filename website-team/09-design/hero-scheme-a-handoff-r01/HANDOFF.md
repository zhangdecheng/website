# Hero 方案 A（P0）工程交接 — r01

**决策日期：** 2026-09-17  
**决策人：** 用户（烨 张）  
**视觉负责人：** Iris  
**工程接入：** Ethan  
**统筹：** Alex  

**结论：** 采用 **方案 A**。保留现有 masonry 三卡 HTML；以 CSS 为主修复死区、发闷遮罩与图注可读性。方案 B / C 暂缓。

**对照预览（非生产）：**  
本机若仍在跑：`http://127.0.0.1:8766/compare.html` → 点「P0 方案A」  
源文件：`/workspace/website-team/09-design/hero-demo-r02/`

---

## 改动范围

| 项 | 是否改 |
|---|---|
| `index.html` hero 结构 | 否（保持三卡） |
| 图注文案 | 否（沿用现有 Global Talent Network / Data-Driven Growth / Brand Partnership Hub） |
| 新图素材 | 否（先用现有 webp；若 cover 裁切焦点不佳再单开裁图任务） |
| `styles.css` hero 相关规则 | **是** |
| 生产发布 | Ethan QA + Alex 确认后 |

## 具体修改点（对应线上 `styles.css`）

1. **`.hero-card img` / `.hero-card-live img`**  
   - `object-fit: contain` → **`cover`**  
   - `object-position: center` → **`center 20%`**  
   - 提高 `brightness`（live 卡去掉 `brightness(0.65)` + `sepia`）

2. **`.hero-card::before` / `.hero-card-live::before`**  
   - 去掉 **`mix-blend-mode: multiply`**  
   - 改为底部可读渐变（见 `hero-scheme-a.css`）

3. **比例**  
   - landscape ≈ **16 / 10**  
   - portrait / live ≈ **4 / 5**

4. **`.hero-card figcaption`**  
   - 全宽贴底渐变衬底  
   - `font-weight: 600`、略增字号、`uppercase`  
   - 去掉小圆角毛玻璃块样式

## 交付文件

- `hero-scheme-a.css` — 可合并进 `styles.css` 的补丁（按选择器覆盖/替换现有规则，勿整文件盲贴重复）
- 本 `HANDOFF.md`

## QA 建议（Ethan）

- [ ] 桌面 1440 / 1280：三卡无大块黑边死区  
- [ ] 竖卡人脸/主体不被裁切过头（`center 20%` 可微调）  
- [ ] 平板 / 中屏：复查原先黑边问题是否缓解  
- [ ] 图注对比度可读  
- [ ] `prefers-reduced-motion` 下 hover 不异常  
- [ ] LCP：首张 hero 图仍 eager / fetchpriority 策略不变或更优  

## 非本轮范围

- 方案 B 双宽卡 / 方案 C 沉浸大图  
- 未核验数据标签（10M+、120+ Markets 等）  
- Logo 条磨砂、TAP/CAP 放大、Services 提色、Contact 过渡（可选后续小迭代）

## SEO 备注（已在 Demo 对齐，生产保持）

- 保留真实 `figcaption` 文本与有意义 `alt`、宽高属性  
- 不把关键卖点只烧进图片  

