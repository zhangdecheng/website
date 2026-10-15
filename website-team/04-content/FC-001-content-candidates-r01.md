# FC-001｜英文内容候选 r01（首页轻改 + `/creators`）

| Field | Value |
| --- | --- |
| 项目/任务 | FLOURISH-WEBSITE / FC-001 |
| 作者 | 内容与品牌编辑（Olivia） |
| 版本 | r01｜2026-09-16 |
| 状态 | **候选** — 待产品经理（Emma）业务验收；未发布、未改站 |
| 输入 | `02-product/FC-001-prd-r02.md`；`03-growth/briefs/DISC-001-creators-page-brief-r01.md`；`03-growth/DISC-001-handoff-pack-r01.md`；`03-growth/FC-001-creator-en-opportunity-r01.md` §4；`01-control/FC-001-decisions-r01.md`；`00-context/FC-brand-intro-r01.pdf`（仅主张边界，业绩数字不上本轮标题/摘要） |
| 语言 | English only |
| 现网 HTML | 本环境 2026-09-16 WebFetch/curl 拉首页超时或空 body；成稿主张优先映射已批 brief / 机会清单所引官网公开句。实现前须实读现网 footer 原文做轻改对齐。 |

---

## 0. 写作约束（已落实）

- 服务对外表述：**brand matching + operations support + growth coaching**。默认不用 exclusive talent management、zero-base training school；本候选 **不** 使用 `incubator` / `management` / `agency` 原词（待用户另批后再升）。
- 粉丝门槛：TikTok **或** Instagram **或** YouTube **任一单平台** ≥ 5,000；不成合计、不要求三平台都满。
- 条件性福利（工厂参访、TAP/CAP 适用市场、付款时效）：**无事实表 → 本版不写成普遍承诺**。可保留官网已公开的 Hong Kong East–West 定位；TAP & CAP 仅作组织资质一句，不写成人人可得权益。
- PDF 业绩数字（2w+ 达人、ROI、月交付条数等）：**不上** title / H1 / meta / 首屏。
- CTA：Creator 申请语义 → 现有底部申请流程且 Creator 预选；禁止 sole「Contact Us」。
- 设计：本阶段不出图；复用现有组件。

---

## 1. 首页轻改（Homepage）

### 1.1 Title（候选）

`Creator Partnerships & Brand Collaborations | FLOURISH CULTURE`

备用（更偏品牌双读）：  
`FLOURISH CULTURE | Creator Partnerships for Brand Collaborations`

### 1.2 Meta description（候选，~155 chars）

`Partner with FLOURISH as a TikTok, Instagram, or YouTube creator. Brand matching, operations support, and growth coaching. Apply as a creator — Europe & North America, Southeast Asia, South America, and beyond.`

### 1.3 首屏一句（above-the-fold）

`Creators: partner with FLOURISH for brand collaborations — brand matching, ops support, and growth coaching. Apply as a creator.`

### 1.4 首页入口文案（链到 `/creators`；锚文本须清晰）

- 主入口锚文本：`Explore creator partnerships`  
- 次入口（同页跳转底部申请、Creator 预选）：`Apply as a creator`

### 1.5 首页 JSON-LD（最小集；工程接入时校验）

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://www.flourishculturekol.com/#organization",
      "name": "FLOURISH CULTURE",
      "url": "https://www.flourishculturekol.com/",
      "description": "Creator partnerships for brand collaborations: brand matching, operations support, and growth coaching for TikTok, Instagram, and YouTube creators."
    },
    {
      "@type": "WebSite",
      "@id": "https://www.flourishculturekol.com/#website",
      "url": "https://www.flourishculturekol.com/",
      "name": "FLOURISH CULTURE",
      "publisher": { "@id": "https://www.flourishculturekol.com/#organization" }
    },
    {
      "@type": "WebPage",
      "@id": "https://www.flourishculturekol.com/#webpage",
      "url": "https://www.flourishculturekol.com/",
      "name": "Creator Partnerships & Brand Collaborations | FLOURISH CULTURE",
      "description": "Partner with FLOURISH as a TikTok, Instagram, or YouTube creator. Brand matching, operations support, and growth coaching. Apply as a creator.",
      "isPartOf": { "@id": "https://www.flourishculturekol.com/#website" },
      "about": { "@id": "https://www.flourishculturekol.com/#organization" }
    }
  ]
}
```

**不写入：** AggregateRating、虚构 Review、未批业绩数字。

### 1.6 Footer / 申请区轻改说明（对照现网实文；实现前实读）

保留现有 Creator 申请叙事骨架，建议轻改目标语气为：

1. Submit a **Creator** application via the existing contact form (Creator role pre-selected).  
2. Our team reviews your submission by email.  
3. If there is a fit, we discuss partnership next steps.

**不新增：** 收费表、独家经纪条款、付款时效承诺。无现网 footer 原文前，工程侧以「复用现块 + 上述三步语义」验收，Olivia 在实读后可出 r02 对齐句。

---

## 2. 独立页 `/creators`（若路径占用则全站唯一改用 `/creator-partnership`）

### 2.1 Title

`Creator Partnerships | Brand Deals & Support | FLOURISH CULTURE`

### 2.2 Meta description

`Partner with FLOURISH as a TikTok, Instagram, or YouTube creator (5,000+ followers on any one platform). Brand matching, operations support, and growth coaching for creators in Europe & North America, Southeast Asia, South America, and beyond. Apply as a creator.`

### 2.3 H1

`Creator partnerships with FLOURISH`

### 2.4 Lead（2–4 sentences）

`FLOURISH partners with creators on TikTok, Instagram, and YouTube who want brand collaborations — not a how-to-become-an-influencer tutorial.`

`We focus on creators with at least 5,000 followers on any one of those platforms, especially across Europe & North America, Southeast Asia, South America, and other regions.`

`What you get: brand matching, operations support, and growth coaching. When you are ready, apply as a creator through our existing application flow.`

### 2.5 What you get（Why Creators 四条，同义可扫块）

| Block title | Body |
| --- | --- |
| Direct access to global brand partnerships | Connect with brand collaboration opportunities through FLOURISH’s partnership network. |
| Monetization & operations support | Support across deal negotiation, compliance, and payouts so collaborations stay workable. |
| Data-backed creator growth | Performance feedback and content-improvement support to help you grow with clearer signals. |
| Community & supply-chain access | Access to creator community resources and supply-chain / immersion opportunities **as offered on a project basis** — not a universal guarantee for every applicant. |

### 2.6 Who should apply

- **Platforms:** TikTok, Instagram, and YouTube.  
- **Regions:** Europe & North America; Southeast Asia; South America; and other regions.  
- **Follower floor:** **5,000+ on any one platform** (TikTok **or** Instagram **or** YouTube). Not a combined total across platforms; you do not need 5,000 on every platform.  
- **Intent:** You already publish (or are ready to) and want brand deals / partnership support — not a zero-follower training school.

### 2.7 How to apply

1. Click **Apply as a creator** (Creator role will be pre-selected in the existing contact / apply form).  
2. Submit your Creator application.  
3. Our team reviews by email and follows up to discuss fit.

### 2.8 What this page is not

`This page is not a free “become famous” or growth-hacks tutorial. It is for creators seeking brand collaborations and partnership support.`

### 2.9 CTA

- Primary: `Apply as a creator`  
- Secondary (same destination semantics): `Join our creator network`  
- **Do not** use generic `Contact Us` as the sole CTA.

### 2.10 Optional one-liner (Hong Kong positioning — public claim)

`Based in Hong Kong, FLOURISH connects East–West brand and creator collaboration opportunities.`

### 2.11 Optional organization note (TAP/CAP — not a universal creator benefit)

`FLOURISH is a TikTok Shop TAP & CAP partner in supported markets. Availability of market-specific programs depends on the project and region.`

### 2.12 `/creators` JSON-LD（最小集）

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://www.flourishculturekol.com/#organization",
      "name": "FLOURISH CULTURE",
      "url": "https://www.flourishculturekol.com/"
    },
    {
      "@type": "WebPage",
      "@id": "https://www.flourishculturekol.com/creators#webpage",
      "url": "https://www.flourishculturekol.com/creators",
      "name": "Creator Partnerships | Brand Deals & Support | FLOURISH CULTURE",
      "description": "Partner with FLOURISH as a TikTok, Instagram, or YouTube creator (5,000+ followers on any one platform). Brand matching, operations support, and growth coaching. Apply as a creator.",
      "isPartOf": { "@id": "https://www.flourishculturekol.com/#website" },
      "about": { "@id": "https://www.flourishculturekol.com/#organization" },
      "primaryImageOfPage": null
    },
    {
      "@type": "Service",
      "@id": "https://www.flourishculturekol.com/creators#service",
      "name": "Creator partnerships",
      "serviceType": "Creator brand matching, operations support, and growth coaching",
      "provider": { "@id": "https://www.flourishculturekol.com/#organization" },
      "areaServed": [
        "Europe",
        "North America",
        "Southeast Asia",
        "South America"
      ],
      "audience": {
        "@type": "Audience",
        "audienceType": "TikTok, Instagram, and YouTube creators with 5,000+ followers on any one platform"
      },
      "url": "https://www.flourishculturekol.com/creators"
    }
  ]
}
```

注：`primaryImageOfPage: null` 仅表示本阶段不出图；工程接入时删除该字段或换真实图。Canonical 自指 `/creators`（或确认后的等价路径）。

---

## 3. 事实 / 来源映射

| 主张 / 文案块 | 用途 | 来源 | 状态 |
| --- | --- | --- | --- |
| brand matching + operations support + growth coaching | 首页/独立页定位 | PRD r02 §5；business-inputs-r01 | 已确认 |
| Why Creators 四条（全球品牌对接 / 商务合规结算 / 数据成长辅导 / 社群与供应链资源） | 独立页 What you get；首页摘要语义一致 | PRD r02；brief r01 §4；机会清单 r01 §4（官网公开页） | 已确认可写；现网逐字句本轮未重抓 |
| 5,000+ 任一单平台 TT/IG/YT | Who should apply；meta | 用户 2026-09-16；decisions-r01；PRD r02 | 已确认 |
| 平台 TT/IG/YT；地区欧美、东南亚、南美+其他 | Who should apply；meta | business-inputs-r01 | 已确认 |
| Apply as creator → 现有底部表单 + Creator 预选 | CTA / How to apply | PRD r02；business-inputs-r01 | 已确认流程；预选参数名待工程核 |
| Hong Kong East–West | 可选一句 | 机会清单 r01（官网公开）；品牌介绍定位 | 已确认可写定位句 |
| TikTok Shop TAP & CAP partner | 可选组织注 | 机会清单 r01；品牌介绍 PDF p.3 | 可写资质；**不**升为人人可得福利 |
| Community / factory immersion | 第四条降级表述 | brief：as offered；PRD：无事实表不普遍承诺 | **合理推断表述**；标 project-by-project |
| PDF 2w+ / ROI / 月交付等 | — | brand-intro PDF | **禁止**上本轮 title/H1/meta/首屏 |
| exclusive talent management / zero-base school | — | PRD 非目标 | **禁止**默认表述 |
| incubator / agency / management 原词 | — | PRD §5.2 | 本版 **未用**；另批后再升 |

---

## 4. 待确认 / 缺口（不挡本版候选，但影响定稿）

1. **现网 footer 原文**未实读 → 申请区三步为语义稿；实读后可能出 r02 对齐句。  
2. **条件性福利事实表**仍缺 → 第四条与 TAP/CAP 保持「项目/市场可用」降级。  
3. **`/creators` 路径占用、预选参数名** → 工程群核；文案路径占位为 `/creators`。  
4. 是否允许 title 使用 `Brand Deals`（brief 草稿已用；非 `agency` 原词）— 请 Emma 业务点头或改词。

---

## 5. 给设计 / 工程的不可改正文

- H1、四条 block title、CTA 主文案、粉丝门槛句（含「any one platform」）**不得改义**。  
- JSON-LD `name` / `description` 须与批准的 title/description 同版。  
- 本阶段 **无** OG 新图要求。

---

## 6. 下一动作

- 本文件：`04-content/FC-001-content-candidates-r01.md`  
- 下一负责人：@产品经理（Emma）按 AC-01–AC-05 / AC-13 业务验收同一版  
- 通过后：@项目主管（Alex）汇总待确认包交用户；用户确认后再转 Website 工程交付群（仅评估，另授开发权再实施）  
- 本群不开发；设计本阶段跳过  
