# FC-001｜GSC `/creators` 上线后读回 r01

- 项目/任务：FLOURISH-WEBSITE / FC-001
- 作者：数据分析师（Noah）
- 采集时间：2026-09-17（UTC+8，约 16:21）
- 属性：`sc-domain:flourishculturekol.com`
- 检查 URL：`https://www.flourishculturekol.com/creators`
- 方式：公网 curl 只读 + GSC 网址检查只读；**未**请求编入索引、**未**提交/改 Sitemap、**未**改设置
- 对照基线：`08-results/FC-001-gsc-baseline-r01.md`（上线前：无法识别/未收录）

## 结论（先读）

| 问题 | 结论 | 状态 |
| --- | --- | --- |
| 公网是否独立页（非软回退首页） | **是**：HTTP 200；title/正文/canonical 与首页不同；sitemap 含该 URL | 已确认 |
| GSC 是否把它当软回退/重复首页 | **未见该信号**：无 duplicate / soft 404 / redirected / alternate canonical 文案 | 已确认（当前检查结果） |
| GSC 是否已收录 | **否**：仍显示「网址尚未收录到 Google」/「Google 无法识别此网址」 | 已确认 |
| 是否已抓取 | **否**：上次抓取/UA/是否允许抓取/抓取结果/是否允许索引均为「不适用」 | 已确认 |

**一句话：** 站内已上线且自指规范；Google 侧尚未发现/抓取该 URL，故**谈不上**软回退成重复首页；与上线前基线同属「无法识别」，尚不能判 S1 收录通过。

## 1. 公网信号（站内）

| 项 | 值 |
| --- | --- |
| `https://www.flourishculturekol.com/creators` | 经跳转后 **200**；最终 URL 可见带尾斜杠变体 |
| title | `Creator Partnerships \| Brand Deals & Support \| FLOURISH CULTURE`（≠ 首页） |
| canonical | `https://www.flourishculturekol.com/creators`（自指，非首页） |
| `sitemap.xml` | 含 `https://www.flourishculturekol.com/creators` |
| `robots.txt` | `Allow: /`；指向上述 sitemap |

说明：公网独立页成立，**不能**用「未收录」反推页面不存在或与首页同页。

## 2. GSC 网址检查

| 项 | 值 |
| --- | --- |
| 索引状态 | **未收录**：「网址尚未收录到 Google」；原因「网页未编入索引：Google 无法识别此网址」 |
| 用户声明的规范网址 | 不适用 / 未显示 |
| Google 选择的规范网址 | 不适用 / 未显示 |
| Sitemap 发现 | 未检测到任何引荐站点地图 |
| 引荐来源页 | 未检测到引荐来源网页 |
| 上次抓取时间 | 不适用 |
| 抓取相关字段 | 均为不适用 |
| 重复/软回退/重定向类文案 | **未出现** |

截图：

- `08-results/screenshots/url_inspection_creators_post_launch.png`
- `08-results/screenshots/url_inspection_creators_post_launch_discovery_crawl.png`
- `08-results/screenshots/url_inspection_creators_post_launch_diagnostics.png`
- `08-results/screenshots/url_inspection_creators_post_launch_full.png`

## 3. 能证明 / 不能证明

**已确认**

- 公网 `/creators` 为独立资源（相对首页）。
- 当前 GSC 检查**没有**把该 URL 标成与首页重复或软回退。
- Google 尚未识别/抓取该 URL（发现与抓取字段为空）。

**不能证明 / 未确认**

- 日后收录时是否会选错规范网址（需再次 URL 检查）。
- GSC「网页」报告的已编入/未编入总量（基线时仍处理中；本轮未重读全量报告）。
- 性能点击/展示变化（上线过近；且用户要求未问不主动报数）。
- 仅凭公网 sitemap 存在，不能证明 GSC 已消费该 sitemap（属性内提交数基线为 0；本轮未改提交）。

## 4. 建议下一动作（非阻塞）

1. 工程/增长可选：在 GSC 提交/核验 sitemap，或从首页增加可爬内链，缩短「无法识别」窗口——**需产品/工程授权，Noah 不代操作**。
2. Noah：收录或「测试实际网址」有实质变化后再升 r02；仍按「用户问再报」；不启用日报 Routine。
3. @市场与增长负责人（Leo）：策略上可把「未发现」与「软回退」分开跟踪；当前证据支持后者未发生。

