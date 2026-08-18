# FLOURISH CULTURE 网站内容、线索表单与生产发布设计规格

日期：2026-08-18

状态：用户已确认

适用站点：`https://www.flourishculturekol.com/`

## 1. 背景与本次决策

现有项目是英文单页静态官网，采用已确认的 “Neon Culture Bridge” 视觉方向：黑色、珊瑚红、暖金色、编辑感摄影与紧凑的大标题排版。当前两个表单通过 `mailto:` 打开访客本地邮件客户端，无法保证访客完成发送，也无法由网站统一执行反滥用、状态反馈和投递审计。

本次改造以飞书需求文档 revision 362 和后续逐项确认结果为业务依据。此前项目文档中的“纯静态、无 API、无新增页面”约束被本次已确认需求取代；不相关的视觉系统、现有图片和 `/review/` 应用仍须保持不变。

已比较并确认的实现路线：

1. 继续使用 `mailto:`：依赖访客本地客户端，无法提供真实站内提交、统一风控和可验证投递，已否决。
2. 使用第三方表单 SaaS：上线较快，但会增加第三方数据处理、品牌依赖和持续可控性问题，已否决。
3. 在现有生产主机部署轻量 Node.js 表单服务，并由 Nginx 反向代理 `/api/contact`：数据流和投递规则可控，可使用现有云邮 SMTP，确定为实施路线。

验证码方案采用 Cloudflare Turnstile 的免费方案。ALTCHA、mosparo 等自托管方案保留为未来替代路线，本期不引入额外验证服务或持久化数据库。

## 2. 目标与非目标

### 2.1 目标

- 按已确认需求更新英文首页内容，继续以 Brand 获客为第一主线、Creator 招募为第二路径。
- 仅为 Service 03 和 Our Talent 生成两张与现有站点一致的 AI 图片，其余已有图片不修改。
- 将两个 `mailto:` 表单合并为 Contact 区域中的一个动态表单，在页面内真实提交。
- Brand 线索发送到 `hannah@flourish-culture.com`；Creator 线索发送到 `irisa@flourishculture.com`。
- 邮件固定使用 `business@flourish-culture.com` 作为发件人，把访客邮箱仅放入 `Reply-To`。
- 增加通用英文隐私告知、必选确认、Turnstile、蜜罐、最短填写时间、限流、去重和安全日志。
- 将生产规范为 `www` 域名，根域名永久跳转到 `www`，并为页面增加 canonical。
- 在不破坏同机 `/review/` 应用的前提下备份、部署、验证和可回滚发布。
- 生产验收通过后关闭内容漂移的 GitHub Pages 站点，但保留 GitHub 仓库。

### 2.2 非目标

- 不增加数据库、CRM、营销自动化、访客分析、用户账户、附件上传或短信验证。
- 不发送访客自动回复邮件。
- 不修改未被点名的现有图片、品牌 Logo、整体配色和版式语言。
- 不把 AI 图片描述为真实的 FLOURISH 活动或真实合作现场。
- 不在代码、Git 历史、构建产物、日志或聊天中保存 SMTP 授权码、Turnstile Secret Key。

## 3. 信息架构与内容变更

页面顺序继续保持：Hero → Brand Logo Strip → Who We Are → Services → Our Talent → About Us → Contact Us → Footer。

### 3.1 Hero

- 主标题、介绍和 Brand 主 CTA 保持 Brand-first 逻辑。
- 三张卡片标题统一为 Title Case：
  - `Global Talent Network`
  - `Data-Driven Growth`
  - `Brand Partnership Hub`
- Hero 已有三张图片保持不变。

### 3.2 Who We Are

`From HK to the World` 使用以下确认文案：

> Headquartered in Hong Kong, we leverage the city’s unique status as a global hub to seamlessly connect East Asian innovation with international audiences. We provide creators with direct access to high-budget global sponsors and cross-cultural growth strategies.

`The East-to-West Cross-Border Experts` 保留“中国供应链和品牌生态 + 本地化海外执行”的核心含义，采用更短、更自然的英文表达。允许修正原文语法和用词，但不得改变业务承诺或章节结构。

两张现有图片保持不变。

### 3.3 Services

Service 01 继续命名为 `Global Influencer Marketing`。Overview 改为需求文档中已确认的 creator-brand partnership 表述；What We Do 保持人才筛选/合同与合规、跨境优化、文化优先内容三项业务能力。允许英文润色，不减少业务范围。

Service 02 改名为：

> Data-Driven Growth & Performance Insights

Overview 聚焦数据分析、留存和持续增长飞轮，不再以付费广告、whitelisting、Spark Ads 或媒体采购为主。What We Do 固定为：

- `Algorithmic & Retention Audits`
- `E-Commerce & Direct-Response Optimization`
- `Audience Demographics & Niche Matching`

Service 03 继续命名为 `Creative Strategy & Localization`。Overview 表达以本地趋势引领者、算法辅导、脚本审核和原生趋势洞察打破文化壁垒。What We Do 固定为：

- `Localized Trend Jacking`
- `Script Audits & UGC Production`
- `Supply Chain & Offline Immersion`

Service 01 和 Service 02 图片保持不变；Service 03 图片按第 4 节重新生成。

### 3.4 Our Talent

本模块继续承担 Creator 招募，不再内嵌独立 Creator 表单。内容包含以下四项确认利益点：

- `Direct Access to Top Global Brands`
- `Seamless Monetization & Operations`
- `Data-Backed Creator Growth`
- `Global Community & Supply Chain Access`

CTA 标题为 `Ready to Scale?`，按钮为 `Join Our Roster →`。点击后平滑滚动到 Contact，自动选择 `Creator`，聚焦第一个尚未填写的 Creator 字段，并保持键盘可访问。

用户已明确要求保留 `Direct Access to Top Global Brands` 和 `high-budget global sponsors` 等强业务表述，不进行弱化。其真实性证明不属于代码实现；发布前由业务方承担素材和主张的证据责任。

Our Talent 图片按第 4 节重新生成。

### 3.5 About Us

根据需求文档更新 `[Our Mission]` 与 `[The FLOURISH Advantage: Why HK & Why Us?]` 文案。保持香港连接东西方、跨境增长、创作者与品牌共同增长的核心叙事；现有 About 图片和布局保持不变。

### 3.6 Contact Us 与 Footer

- 公开展示邮箱统一为 `business@flourish-culture.com`。
- Contact 保留 Brand 项目咨询主入口，同时通过身份选择支持 Creator。
- Contact 已有图片保持不变。
- Footer 增加 Privacy Notice 链接，并保持现有导航层级与视觉风格。

## 4. AI 图片规格

两张图均为无文字、无可识别商标、无水印的横向纪实摄影风格。统一沿用现有站点的暗色编辑感、电影光线、珊瑚红点缀、真实肤质和克制颗粒，不使用常见的亮紫蓝“AI 科技感”。图片只表现服务场景，不冒充真实客户、真实活动或真实业绩证明。

### 4.1 Service 03 图片

- 场景：多国创作者在香港风格的创意空间进行小型线下 meetup / 内容工作坊。
- 画面：有人讨论脚本与样品，有人用相机或手机拍摄；隐约包含供应链样品或产品选择场景，但不出现可读品牌。
- 叙事：跨文化协作、本地化、线下沉浸和内容制作，替换现有红狮子/文化图。
- 建议文件：`assets/service-creative-localization-meetup.webp`。
- Alt：描述“跨文化创作者内容工作坊”，不写成 FLOURISH 主办的真实活动。

### 4.2 Our Talent 图片

- 场景：创作者在专业但自然的内容工作室中工作，镜头、灯光、手机和电脑共同出现。
- 画面：数据看板只能作为不含可读数字/品牌的环境元素或光影投射，与人物形成一个完整场景，不做拼贴。
- 叙事：专业内容生产、数据辅助增长、全球创作者社群。
- 建议文件：`assets/talent-creator-growth-studio.webp`。
- Alt：描述“创作者在专业工作室结合设备与增长洞察制作内容”。

生成后必须检查手指、面部、设备结构、伪文字、商标和构图；不合格则重新生成。最终仅把通过检查的图片复制到项目并纳入构建清单。

## 5. 统一表单体验

### 5.1 字段

共同必填字段：

- `Full Name`
- `Email Address`
- `I am a…`：`Brand` / `Creator`
- Privacy 确认复选框
- Turnstile 验证

Brand 必填字段：

- `Company`
- `Budget`：`$10,000–$30,000`、`$30,000–$100,000`、`$100,000+`、`Not sure yet`
- `Growth Objectives`

Creator 必填字段：

- `Social Media Handles`
- `Niche`
- `Main Audience Demographics`

不收集电话号码。Social Media Handles 使用自由文本而不是只允许单一 URL，以支持多个平台、`@handle`、完整链接和国际字符。

### 5.2 状态与可访问性

- 身份切换时只显示并启用相应字段；切换回来时保留本页已输入内容。
- 提交状态分为 idle、submitting、success、validation error、rate limited、verification unavailable、delivery failed。
- 提交期间禁用按钮并显示明确的进行中状态，避免重复点击。
- 成功后显示英文成功提示并清空已成功发送的字段；失败时保留全部输入。
- 错误摘要使用 `aria-live`，字段错误与控件建立关联，并把焦点移到首个错误。
- 不把 SMTP 错误、内部收件人、Turnstile Secret 或服务器细节暴露给访客。

必选文案采用原创通用表述，例如：

> I have read the Privacy Notice and agree that Flourish Culture may use my information to respond to and assess this inquiry.

## 6. 后端架构与边界

在同一仓库新增轻量 Node.js 服务，但与静态站点构建保持明确边界：

- HTTP 入口：只负责路由、正文大小限制、Content-Type、Origin、请求 ID 和标准响应。
- Validation：字段规范化、角色条件字段、Unicode 邮箱、长度、控制字符与 CRLF 防护。
- Form Session：签发短期 HMAC 表单会话令牌，服务端据签发时间执行最短填写时长；不使用 Cookie 或数据库。
- Turnstile Client：只负责向 Cloudflare Siteverify 发起有超时的服务端验证，并检查 action 与允许 hostname。
- Abuse Guard：内存中的 IP / 邮箱滑动窗口限流和十分钟精确重复去重。
- Mail Composer：根据角色选择固定收件人，以转义后的纯文本和 HTML 生成邮件；所有头部值由服务端固定。
- SMTP Transport：只读取服务器环境变量并执行投递。
- Security Logger：只记录结构化元数据和哈希标识，不记录正文、访客原始邮箱、验证码令牌或凭据。

服务只监听 `127.0.0.1`，由 Nginx 代理。仅当 TCP 来源是本机反向代理时才信任 Nginx 设置的真实 IP 头，避免客户端伪造 `X-Forwarded-For`。

## 7. API 契约

### 7.1 `GET /api/contact/config`

返回公开 Turnstile Site Key、签名的短期 form session token 和到期时间。Secret Key 永不返回前端。响应禁止被共享缓存长期保存。

### 7.2 `POST /api/contact`

只接受 `application/json`，正文上限 32 KiB。请求包含：角色、共同字段、对应角色字段、Privacy 布尔值、Turnstile token、form session token 和蜜罐字段。未知或不属于当前角色的字段不进入邮件。

响应约定：

- `201`：邮件已由 SMTP 服务接受，返回不含内部信息的 request ID。
- `202`：与十分钟内已接受请求完全重复，视作已收到但不再次发信。
- `400`：字段或 Privacy 校验失败。
- `403`：Origin、蜜罐、最短填写时间或 Turnstile 结果不符合要求。
- `413`：正文过大。
- `429`：超过限流，携带合理的 `Retry-After`。
- `502`：SMTP 拒绝或投递调用失败；前端保留表单内容。
- `503`：验证码或必要外部依赖暂不可用。

“SMTP 接受”只能证明发送服务接受了消息，不能单独证明最终进入收件箱；生产验收必须由 Hannah 和 Irisa 实际查看收件箱并核对 Reply-To。

### 7.3 `GET /api/contact/health`

仅返回服务存活、必要配置是否齐全和版本，不探测真实邮箱、不回显任何配置值。部署验收另行执行受控 SMTP 测试。

## 8. 邮件规则

固定路由：

| 身份 | To | From | Reply-To | 固定 Subject |
| --- | --- | --- | --- | --- |
| Brand | `hannah@flourish-culture.com` | `business@flourish-culture.com` | 已校验的访客邮箱 | `[Flourish Website] New Brand Inquiry` |
| Creator | `irisa@flourishculture.com` | `business@flourish-culture.com` | 已校验的访客邮箱 | `[Flourish Website] New Creator Application` |

SMTP 默认配置为 `smtp.yunyou.top:465`，使用 TLS。登录用户名、客户端独立密码/授权码仅存在生产服务器权限受限的环境文件中。页面传入的数据不得影响 From、To、Subject 或其他邮件头；访客邮箱只作为 Reply-To。邮件同时提供纯文本和经过 HTML 转义的 HTML 版本，无附件、无访客指定收件人、无远程图片。

邮箱校验允许 Unicode 本地部分和国际化域名的合理输入，并禁止换行、控制字符、多个 `@`、非法域名与超长地址。云邮是否完整支持 SMTPUTF8 需通过真实投递验证；代码接受不等于邮件服务一定接受。

## 9. 风控与日志

### 9.1 分层规则

处理顺序：正文/字段基础校验 → Origin 与蜜罐 → form session 最短时长 → IP 限流 → Turnstile → 重复检查 → Email 限流 → 邮件发送。

- 蜜罐：视觉隐藏、不可聚焦、关闭自动填充；非空即拒绝。
- 最短填写：使用服务端签名 session 的签发时间，少于 3 秒拒绝；令牌有效期 60 分钟。
- IP：最多 5 次 / 10 分钟，最多 20 次 / 24 小时。
- Email：最多 3 次 / 1 小时，最多 5 次 / 24 小时；只在通过 Turnstile 后计入受理尝试。
- 去重：相同角色与规范化业务字段的指纹在 10 分钟内只发送一次；内存中仅保存哈希和过期时间。
- Turnstile：Managed 模式，允许 hostname 为 `www.flourishculturekol.com` 与 `flourishculturekol.com`，action 固定为 `contact_submit`。

限流与去重存放在单进程内存中，服务重启后会重置。这是无数据库方案的明确边界；本期接受该权衡。服务以单实例运行，若未来横向扩容，必须改为共享限流存储。

### 9.2 日志

每次请求记录：UTC 时间、request ID、耗时、角色、结果、拒绝原因枚举、哈希化 IP、哈希化邮箱。不得记录表单正文、姓名、公司、社交账号、目标描述、Turnstile token、SMTP 用户名或授权码。日志轮转和保留遵循服务器现有运维策略；若现有策略缺失，采用按日轮转和有限保留，避免无限增长。

## 10. Privacy Notice

新增原创英文 `privacy.html`，不复制其他网站文字，也不出现与本项目无关的公司名称。页面至少说明：

- 收集的表单字段和基本安全元数据；
- 用于回复、评估 Brand 线索或 Creator 申请、保护表单和排查投递；
- 数据会交由邮件服务商处理，并使用 Cloudflare Turnstile 进行反滥用验证；
- 不出售表单信息，不用于本期未声明的广告分析；
- 仅在处理咨询、履行业务与合理安全需要的期间保留，不承诺未经业务确认的固定删除天数；
- 采取合理安全措施，但不作“绝对安全”保证；
- 可能发生跨境处理；
- 联系、查询、更正或删除请求发送到 `business@flourish-culture.com`；
- Privacy Notice 重大更新时更新页面日期。

本页是通用透明度告知，不虚构注册公司法定名称、注册地址、DPO 或特定监管备案。最终法律适配仍需业务方根据实际经营主体和目标市场复核。

## 11. 前端安全与站点配置

- 首页加入 `<link rel="canonical" href="https://www.flourishculturekol.com/">`，同步规范 Open Graph URL（如已有）。
- 根域名的 HTTP/HTTPS 请求永久跳转到同路径、同查询参数的 `https://www.flourishculturekol.com/`。
- `www` 的 HTTP 请求跳转到 HTTPS。
- 主页和新 Privacy 页面采用适配 Turnstile 的最小 CSP，并加入 `X-Content-Type-Options`、`Referrer-Policy`、适度的 `Permissions-Policy` 与 frame 防护。
- 安全头必须限定在本官网页面/API 的服务器配置范围；不得让 `/review/` 的脚本、登录或健康检查失效。
- Nginx 只把 `/api/contact` 转发到本机服务，并限制请求体；不对外暴露 Node 监听端口。

## 12. 构建、部署与回滚

### 12.1 构建产物

- 静态产物包含首页、Privacy 页面、CSS/JS、两张新图片及原有被引用资产。
- 后端产物包含服务源文件、锁定依赖和 systemd/Nginx 配置模板；不包含 `.env`、授权码、Secret Key、日志或本地测试数据。
- 构建测试检查所有 HTML/CSS/JS/图片引用存在，并检查发布包没有敏感文件。

### 12.2 上线顺序

1. 读取生产 Nginx、Node/systemd、磁盘、权限和 `/review/` 当前状态；未确认前不覆盖配置。
2. 本地完成单元、集成、构建和桌面/移动视觉验收。
3. 用户在 Cloudflare 创建 Turnstile widget；配置 apex 与 `www` hostname，Site Key 可公开，Secret Key 只写服务器环境文件。
4. 在服务器备份官网根目录、相关 Nginx 配置和现有服务配置，并记录可恢复路径。
5. 将静态文件和后端服务部署到 staging 路径；以本机端口验证 health、字段校验、模拟/测试验证和 SMTP 配置。
6. 执行 `nginx -t`，再切换静态版本、启用受限环境文件和本机后端代理。
7. 验证 www、apex 301、Privacy、资源、API、常见安全头、桌面/移动页面、浏览器控制台。
8. Brand 与 Creator 各提交一封受控真实测试；由 Hannah 和 Irisa 分别确认收件、字段、From、Reply-To，并实际点击回复确认回到访客测试邮箱。
9. 再次验证 `/review/healthz` 和 `/review/` 登录跳转。
10. 只有上述验收全部通过后才关闭 GitHub Pages；仓库保留。

任何关键验收失败立即停止收尾：恢复静态目录/Nginx/服务配置，确认原官网与 `/review/` 恢复，再分析原因。不会以 HTTP 200 代替页面渲染、API、邮件和 `/review/` 的实际验证。

生产主机的精确服务名、Nginx 文件位置、Node 版本和可用权限必须以发布前只读检查结果为准，不根据历史文档猜测。

## 13. 测试策略

实施采用测试先行：每个行为先新增会失败的测试，再写最少实现使其通过，随后重构。

### 13.1 单元测试

- Brand / Creator 条件字段与长度规则。
- Unicode 邮箱、IDN、控制字符、CRLF 和边界长度。
- 固定收件人、From、Subject、Reply-To，确保请求不能覆盖邮件头。
- HTML 转义和纯文本生成。
- HMAC form session 的签发、过期、篡改和最短时长。
- IP / Email 两层窗口限流、窗口边界和 `Retry-After`。
- 十分钟重复指纹和过期清理。
- 日志脱敏，断言敏感字段不会出现在日志。

### 13.2 API 集成测试

使用本地假的 Turnstile 与 SMTP 适配器覆盖：成功、重复、字段失败、蜜罐、过快提交、验证码拒绝/超时、限流、SMTP 拒绝、非法 Origin、正文过大和健康检查。测试不得连接真实 SMTP 或使用生产 Secret。

### 13.3 页面与构建测试

- 确认内容、四项 Creator 利益点、动态字段、预算选项、Privacy 链接、canonical 和两个新图片引用。
- 确认旧 Creator 表单、旧 `mailto:`、旧 Outlook 收件地址和 Service 02 paid-media 文案不再存在。
- 确认 Brand → Hannah、Creator → Irisa 的路由只存在服务端，不暴露可被访客改写的 To 参数。
- 确认构建包包含新页面/图片，不包含秘密、测试夹具或无关源图。

### 13.4 视觉与可访问性验收

至少检查 1440×1024、1024×1366、390×844 和 360×800；验证无横向溢出、条件字段布局、键盘流程、焦点、错误状态、Turnstile、减弱动画和两张新图在真实裁切下的效果。

## 14. 完成定义

只有同时满足以下条件，才可声称“已完成”：

- 所有新增与既有自动化测试以最新代码运行并通过。
- 构建产物经读回核对，且不含凭据。
- 两张新图片通过人工视觉检查并在桌面/移动页面中实际渲染。
- 生产 www 页面、apex 301、Privacy、API 与安全头验证通过。
- Brand 邮件在 Hannah 收件箱可见，Creator 邮件在 Irisa 收件箱可见；两封邮件的 From、To、Reply-To 和内容均核对正确。
- `/review/healthz` 与 `/review/` 登录跳转未受影响。
- GitHub Pages 仅在生产全部验收后关闭，并读回确认状态。
- 备份路径和回滚步骤已记录且可读回。

## 15. 已知未确认项与发布阻塞条件

- 当前未确认本机是否仍具备生产 SSH/运维权限，也未确认服务器 Node/systemd/Nginx 的实际配置。
- 用户已获取 SMTP 授权码，但尚未进行真实 SMTP 登录和收件验证；授权码不得发送到聊天。
- Turnstile Site Key / Secret Key 尚未创建或尚未写入服务器环境。
- `business@flourish-culture.com` 的 DKIM 状态、云邮的 SMTPUTF8 支持和最终投递信誉尚未验证。
- `Direct Access to Top Global Brands`、`high-budget global sponsors` 及现有品牌 Logo 的业务证据不在代码仓库中，技术实施无法证明其真实性。
- Privacy Notice 的最终法律适配尚未由实际经营主体或法律顾问确认。

以上项目不阻止本地实现和测试，但 SMTP、Turnstile、真实收件、生产部署与关闭 GitHub Pages 均必须在相应条件具备并验证后才能完成。
