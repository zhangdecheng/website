# DocuSign Webhook 本地状态台账设计

## 目标

在 FLOURISH 官网既有 Node 服务中新增一个仅接收 DocuSign Connect 通知的 HTTPS API。它记录合同信封状态，并在信封完成时创建待归档记录。

本期不调用 DocuSign eSignature API，不下载合同，不配置或调用 Google Drive API，不读取、上传、移动或修改任何 Google Drive 文件。

## 范围

新增 `POST /api/docusign/webhook`，仅处理以下信封状态：

- `sent`
- `delivered`
- `completed`
- `declined`
- `voided`

所有通知先做 HMAC 校验；校验成功后再持久化最小事件元数据。`completed` 状态创建 `ARCHIVE_PENDING` 任务，供未来已获明确授权的 DocuSign 下载与 Google Drive 归档阶段使用。

不接收或保存合同 PDF、完成证明、收件人完整资料、Connect 原始正文，也不处理任何收件人级事件。

## 方案选择

采用本地 SQLite 台账，不采用 JSONL 或外部数据库：

- SQLite 提供唯一约束和原子更新，能够可靠排除重复 Connect 重试；
- 它不引入新的托管服务；
- 仅存状态与处理元数据，便于恢复待归档项。

## 数据模型

`envelopes`：以 `envelopeId` 为主键，保存最新状态、最后事件时间、归档处理状态和更新时刻。

`connect_events`：保存事件摘要及原始正文的 SHA-256 哈希；哈希为唯一键，用于去重。事件摘要仅包括 `envelopeId`、状态、事件时间和接收时间。

`archive_jobs`：仅由 `completed` 创建；以 `envelopeId` 为唯一键，初始状态为 `ARCHIVE_PENDING`。

## 请求处理

1. Nginx 将 `/api/docusign/webhook` 转发给现有本机 Node 服务，并限定请求体大小。
2. 服务读取原始请求字节，使用服务器环境变量内的 Connect HMAC 密钥校验签名。
3. 无效签名返回拒绝响应且仅写安全日志；不写台账。
4. 对有效且支持的状态，在一个数据库事务中去重、更新信封最新状态并写入事件摘要。
5. `completed` 同时以幂等方式建立 `ARCHIVE_PENDING`。
6. 服务快速返回成功，Connect 的后续重试不会产生重复事件或任务。

## 安全与运行边界

- HMAC 密钥只通过服务器环境变量提供，禁止写入仓库、测试夹具或日志。
- 数据库目录仅允许服务账户访问，并排除在静态站点目录和发布包之外。
- 日志只包含请求 ID、签名验证结果、信封 ID 的受控标识和状态；不得输出正文、密钥或未来凭据。
- 不增加 DocuSign API、Google OAuth、Google 服务账号或 Drive 调用代码。

## 验收测试

- 无效 HMAC 不创建任何记录。
- 有效 `sent` 创建并更新本地信封状态。
- 同一通知重放不会创建重复事件。
- 有效 `completed` 仅创建一个 `ARCHIVE_PENDING`。
- `declined` 与 `voided` 更新状态但不创建归档任务。
- HTTP 路由保留既有 Contact API 行为。

## 非目标

- 生产部署、Nginx 上线修改与 Connect 发布。
- 合同模板选择、合同发送或文件下载。
- Google Drive 文件访问、目录权限变更或任何网盘写入。
