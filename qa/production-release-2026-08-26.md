# FLOURISH 静态站生产发布记录（2026-08-26）

## 结论

已确认：服务媒体布局静态候选已发布到正式站。Nginx、Contact 服务和既有
`/review/` 应用未被修改。

## 源码与制品

- GitHub 分支：`codex/flourish-site-refresh`，提交 `87fb34678247e1ead77260c6d84a34d86279cd89`。
- 标签及 GitHub Release：`v1.2.0-service-media-20260826`。
- 静态 ZIP：`flourishculturekol-homepage.zip`，7,369,973 bytes，SHA-256
  `4bbe493acc780f9791595ff303a90f8257e0a17009c9a1192b11021d82bf08de`。

## 部署与回读

- ECS：`i-yeo9geadc0plsv0abgv0`（`webhkhome`）。
- 发布调用：`ivk-yetofpvbtjec6ha2qx46`，退出码 0。
- 回滚快照：`/var/backups/flourishculturekol.com/20260826T051413Z-v1.2.0-static-88700345`，
  对应 SHA-256 清单已由发布脚本校验。
- 服务器验证：候选包、验证脚本、部署脚本、静态文件、Nginx 语法、Contact 健康检查、
  canonical 路由、响应头、MIME 和 `/review/healthz` 均通过。
- 独立公网读回：`index.html` 为
  `88700345f849d957193233f9211d81e1e13cd02b5e13ee8569eeb7a46bc8f5e8`；
  `privacy.html` 为
  `a36c172a358b2325b752e8b87e3f08c548ec035cf0de3f24bcdc0d28c2b404c2`；
  `styles.css` 为
  `b5b88af03dfb3a0b0fb22fe3b4dcbf82c929cb331281ce99d5f82f3b76405ccd`。
