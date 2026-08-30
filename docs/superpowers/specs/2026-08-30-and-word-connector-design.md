# Homepage “and” Connector Design

## Goal

将已批准的 14 个首页 `&` 连接符替换为英文单词 `and`，使英语标题和说明在所有设备上可直接读懂，不再依赖 ampersand 的字体字形差异。

## Scope

- 仅替换当前 `index.html` 中由 `span.ampersand` 标记的 14 个实例。
- 同步 `review-editable.html` 中对应的 5 个标题/眉题实例，保留该文件历史正文和表单标签中不在此范围内的 `&`。
- 删除只为 Arial ampersand 服务的 `.ampersand` CSS 规则；不引入新字体、颜色、徽章、脚本或布局。
- 不修改图片、页面结构、Nginx、Contact、`/review/`、域名、证书或其他线上服务。

## Markup and Typography

每个批准实例由：

```html
<span class="connector-word">and</span>
```

替换原来的：

```html
<span class="ampersand">&amp;</span>
```

`connector-word` 是范围锚点和测试契约，不设置独立 CSS。`and` 完全继承其所在标题、正文或强调文本的字体、字号、字重、颜色和行高，因此不会引入跨系统字体回退差异。

## Approved Instances

1. Trusted by Leading Global Brands and Innovators
2. Certified TikTok Shop TAP and CAP Partner
3. FLOURISH is an officially certified TikTok Shop TAP and CAP partner across multiple markets
4. TikTok Shop multi-market certified TAP and CAP partner.
5. Data-Driven Growth and Performance Insights
6. Algorithmic and Retention Audits:
7. E-Commerce and Direct-Response Optimization:
8. Audience Demographics and Niche Matching:
9. Creative Strategy and Localization
10. Script Audits and UGC Production:
11. Supply Chain and Offline Immersion:
12. Seamless Monetization and Operations:
13. Global Community and Supply Chain Access:
14. [The FLOURISH Advantage: Why HK and Why Us?]

## Verification Contract

TDD 先添加失败测试，再实施：

- 首页精确包含 14 个 `connector-word` 标记，且全部上下文匹配上述清单。
- 首页不再含 `.ampersand` 或 `&amp;`；不在范围内的 `&` 不被扩大修改。
- 可编辑审阅副本精确包含 5 个对应标记，既有表单标签中的 `&` 保留。
- 删除 `.ampersand` 的专用字体规则；不新增 `connector-word` 的视觉样式。
- 完整 `npm test`、构建与发布门禁通过。
- 本地桌面和 390px 移动端验证标题无横向溢出、`and` 可见且自然换行。

## Release Boundary

这是一次静态首页文本更新。候选制品、旧版公网哈希、目标 ECS、Cloud Assistant 状态和 `/review/healthz` 必须重新读回；在展示精确写入命令并获得新的发布确认后，才可创建备份并发布。发布后必须独立读回首页与 CSS 哈希、14 个 `connector-word` 标记以及 `/review/healthz`。
