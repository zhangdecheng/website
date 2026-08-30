# FLOURISH 静态站生产发布记录（2026-08-30）

## 结论

已确认：首页 14 个批准实例的 `&` 已以独立 `span.ampersand` 和 Arial 字体栈发布到正式站。此次发布仅覆盖静态 web root；Nginx、Contact 服务与既有 `/review/` 应用均由发布门禁和读回保持正常。

## 源码与制品

- 源码提交：`258b9d2e21ee33dd768c7eef78123dc6d6fb8844`（本地标签：`ampersand-font-20260830`）。
- 静态 ZIP：`flourishculturekol-homepage.zip`，SHA-256 `2621e9053ebc48169e8acc706946f51458da1bea6f4683754df29e81dbf70441`。
- 传输包：`flourish-production-transfer-v1.2.0.tgz`，7,391,729 bytes，SHA-256 `f09efca87f92115e5a40819ba8064a415f661c12f71e0620860f0403cba7d683`。
- 临时 GitHub 制品分支：`codex/ampersand-transfer-20260830`，提交 `58393c6`；仅用于服务器下载该传输包，发布后应删除。

## TDD 与本地候选验证

- 先运行的聚焦测试因首页标记数为 `0`（期望 `14`）失败；实施后通过。
- 完整 `npm test`：`96/96` 通过。
- 本地候选桌面与 390px 移动端：均读到 14 个 `.ampersand`，计算字体为 `Arial, Helvetica, sans-serif`，未发生横向溢出。

## 生产预检与发布

- 云账号读回：`2103632597`；目标实例：`i-yeo9geadc0plsv0abgv0` / `webhkhome` / `150.5.135.196`，Cloud Assistant 为 `Running`。
- 只读预检：`ivk-yetyxl9oxrh3yev7bdfc` 成功；Nginx 语法通过，web root 和备份根均为 `root:root 755`，可用空间 18G，发布前首页/样式哈希分别为 `88700345…f5e8` / `b5b88af0…5ccd`。
- `/review/` HTTPS/SNI 补充检查：`ivk-yetyxmfajn8nthc5xhjb` 成功；服务为 `active`，`/review/healthz` 返回有效 JSON。
- 首次发布调用：`ivk-yetyy0wfb08nti5ec20d` 在内层清单校验阶段失败，原因是命令未进入暂存根目录而无法解析相对路径；部署脚本尚未启动，未发生 web root 写入。
- 修正后的发布调用：`ivk-yetyy4cr088vwvyghxfl` 成功，退出码 `0`。服务器已核对传输包和 11 个内层文件，验证旧版基线与 Nginx 未变化，创建备份并通过静态、Contact、canonical、响应头、MIME 与 `/review/` 门禁。
- 新回滚快照：`/var/backups/flourishculturekol.com/20260830T061317Z-v1.2.0-static-555f4023`。

## 独立公网读回

- 首页 `200`，SHA-256：`555f402344ebd2d4973ddb82a72fb2a30695fc2652622915685071689ab57e9c`，精确匹配本地 `dist/index.html`。
- 样式 `200`，SHA-256：`45a0e8110c100a4ba601ad0047f04d35f252830743443d4b72a0ee0ae824b812`，精确匹配本地 `dist/styles.css`。
- 首页精确读到 14 个 `<span class="ampersand">&amp;</span>` 标记；安全响应头仍在。
- 独立公网 `/review/healthz` 返回 `ok:true`。

## 限制

本次不包含真实 Contact 邮件投递测试；未将 SMTP 接受或服务健康表述为收件箱送达。
