# FC-001｜上线前基线状态 r01

- 项目/任务：FLOURISH-WEBSITE / FC-001
- 作者：数据分析师（Noah）
- 版本：r01｜2026-09-16
- 输入：`02-product/FC-001-prd-r02.md`；`03-growth/DISC-001-handoff-pack-r01.md`；附录 A 八题（方案 r03）
- 状态：**部分可推进；GSC 效果与 AI 八题采样仍阻塞**

## 1. 已确认口径（不编数）

| 项 | 口径 |
| --- | --- |
| S1 收录 | GSC URL 检查/索引；首页 + 未来创作者页；展示=0 ≠ 未收录 |
| S2 搜索效果 | GSC Web 展示+点击（≠ 站点 PV）；无完整基期不编同比/环比 |
| S3 理解诊断 | 上线前用附录 A 原 8 题；分列提及/引用/推荐；未出现≠方向失败 |
| GEO 份额 | 本轮不纳入；小样本≠份额；采样须另授权 |
| 连接器 | Ryze 已安装；**仍 needsAuth**（2026-09-16 本环境读回）；人工 GSC 为兜底 |

## 2. 本次实测结果

| 检查 | 结果 | 说明 |
| --- | --- | --- |
| Ryze MCP `user-Ryze-ai` | **needsAuth** | 工具数=0；未取得 `sc-domain:flourishculturekol.com` 只读数据 |
| 公网 GET 首页 / robots / sitemap /creators | **本环境超时/失败** | Shell 与 WebFetch 均未能取回正文；**不能**据此宣称站点不可达或未收录 |
| `/creators` 是否已存在 | **未确认** | 待公网或工程读回 |
| GSC 展示/点击/索引 | **未测** | 无登录会话、无可用连接器数据 |
| 附录 A 八题 AI 采样 | **未执行** | 方案要求「采样另授权」；本轮未获采样授权 |

## 3. 上线前八题题本（附录 A｜原题，待采样）

平台/日期/地区/联网条件采样时逐条填写。

1. how to get brand deals through a creator agency  
2. creator agency for beginners join network  
3. influencer management company Hong Kong  
4. join creator incubator for brand sponsorships  
5. how to get sponsored posts with an agency  
6. TikTok creator agency application  
7. creator partnership program for emerging influencers  
8. apply to creator network for brand collaborations  

记录列：题号｜平台｜采集时间（UTC+8）｜提及｜引用｜推荐｜是否出现 FLOURISH｜是否引用新页 URL｜证据路径｜备注。

## 4. 缺口与下一步

1. **用户完成 Ryze 授权卡**（有该 GSC 属性权限的 Google 账号）→ Noah 只读拉 Performance + 索引/URL 检查，写入 `08-results/` 并 @Leo。  
2. 若 Ryze 不可用：授权 **浏览器人工登录 GSC** 一次，Noah 截图/导出归档（连接器非前置）。  
3. **八题采样**：请用户明确授权采样平台（如 ChatGPT / Perplexity / Google AI Overview 等）及次数上限后，再执行上线前基线；未授权前只保留题本，不假装已测。  
4. 公网 HTML/robots/sitemap：换可用出口或浏览器再读；失败继续标未确认，不挡 Olivia 文案。

## 5. 对台账的含义

- **不挡** Olivia 英文候选与 Emma 文案验收。  
- **挡住** AC-10/AC-11 效果项与 AC-12 八题结果，直至权限或采样授权到位。  
- 日周报 Routine：**仍未启用**（本文件不构成启用）。

