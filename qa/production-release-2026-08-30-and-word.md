# FLOURISH `and` 连接词静态发布记录（2026-08-30）

## 结论

已确认：官网首页标题中的 14 个批准 `&` 实例已替换为可读的 `and` 文字，并完成静态发布。桌面 Logo rail 标题保持单行；在 820px 及以下宽度恢复自然换行，避免平板和移动端裁切。发布仅覆盖静态 web root，Nginx、Contact 服务和既有 `/review/` 应用未被改动。

## 源码与制品

- 当前源码提交：`9260ddb`（包含发布基线哈希更新）。
- 传输包：`release/flourish-production-transfer-v1.2.0.tgz`，SHA-256 `928eed5706b8baed2aea37c9c0e7444999f4ecbd2d25755fdd710c9421f1cad8`。
- 静态首页候选：`dist/index.html`，SHA-256 `c96f7bc5f291e292473b4603bc55587710464e5272867d2e69888530ca4a39e1`。
- 静态样式候选：`dist/styles.css`，SHA-256 `746e8b3adda56aecacba235bd032f8e5001b84ff4395e77bba4079793598a49d`。
- GitHub 传输分支：`codex/logo-spacing-transfer-20260830`，传输包提交 `b49356a`；该临时分支在部署完成后已删除。

## 本地验证

- `node --test tests/release.test.mjs`：21/21 通过。
- `node --test tests/site.test.mjs`：34/34 通过。
- CSS 仅在 `min-width: 821px` 对 Logo rail 标题强制单行；`max-width: 820px` 恢复自然换行。
- Chrome 实测 1440、820、700、390px 均无横向溢出；桌面标题单行，移动端自然换行。

## 生产发布与读回

- 目标实例：`i-yeo9geadc0plsv0abgv0` / `webhkhome`。
- Cloud Assistant invocation：`ivk-yetzjxixbf8vwx39a8su`，结果 `Success`，退出码 `0`。
- 发布前完整传输清单校验通过，并创建备份：
  `/var/backups/flourishculturekol.com/20260830T114818Z-v1.2.0-static-and-word-c96f7bc5`
- `https://www.flourishculturekol.com/` 返回 HTTP 200，首页字节哈希与候选一致。
- `https://www.flourishculturekol.com/styles.css` 返回 HTTP 200，样式字节哈希与候选一致。
- 线上首页读到 14 个 `<span class="connector-word">and</span>`，旧 `class="ampersand"` 标记为 0。
- `https://www.flourishculturekol.com/review/healthz` 返回 HTTP 200，JSON 有效。

## 归档边界

- Gitee 临时分支和 GitHub 临时传输分支均已按确认删除；本记录保留传输提交和 SHA-256 作为审计索引。
- 未跟踪的 `.openai/`、`.superpowers/`、既有计划文档和 `qa/audits/` 未纳入本次归档。
- 未记录任何密钥、Token 或邮件正文；本次不把 SMTP 接受推断为收件箱送达。
