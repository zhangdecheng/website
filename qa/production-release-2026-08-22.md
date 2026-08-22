# FLOURISH 静态站生产发布记录（2026-08-22）

## 最新归档：v1.2.0-logo-rail-20260822

### 结论

已确认：Atoms 与 TRIPO 的 Logo 修订已完成源码归档并发布到正式站。当前包/API
版本仍为 `v1.2.0`；本次归档只标识静态 Logo 修订，不改变 Contact 服务版本。

### 源码与制品

- 本地 Git 归档标签：`v1.2.0-logo-rail-20260822`
- ECS：`i-yeo9geadc0plsv0abgv0` / `webhkhome` / `150.5.135.196`
- 静态 ZIP：`6,744,747` bytes；SHA-256
  `c8007cdcc75d11f3d07d8c6f2b32351cd459c8ce5fc3f7d5c0d01fe7caa674ab`
- 首页 SHA-256：`08646fc0748ace6e1c0aa62f646aef2cea68abbfb088fbe42918585e309b9f70`
- `styles.css` SHA-256：`9c6b0b61bc18ae38d9d83af8ce27a9f3cd7f92c14292cb6bf8441766ed661c6e`
- Atoms PNG SHA-256：`a24e629aa00be325844022f03043b4659bf9624fce617a7d52d66af93e3d26ea`
- TRIPO PNG SHA-256：`5ddece931f2369199b0251dc2bc4a2a288654ece32806c7c939c3a0221508912`

### 发布与回滚

- ECS Cloud Assistant invocation：`ivk-yeteqxuk3zec6hs4nc7k`，退出码 `0`。
- 备份：`/var/backups/flourishculturekol.com/20260822T115118Z-v1.2.0-static-08646fc`
- 服务器端归档、旧版本基线、Nginx、首页、CSS、两个 Logo、API、MIME、安全头、
  canonical 跳转和 `/review/` 检查全部通过。
- 临时 GitHub 中转分支已在发布完成后删除。

### 本地验证

- `node --test tests/site.test.mjs`：26/26 通过。
- `node --test tests/release.test.mjs`：20/20 通过。
- 四视口 Chrome QA：桌面、平板、390px、360px 均无横向溢出和意外控制台错误。

### 未完成门

Brand/Creator 收件箱与 Reply-To 仍未读回；远端源码同步和 GitHub Pages 收尾仍是独立门，
不能因静态站发布成功而将它们表述为已完成。

## 前一轮发布记录（历史）

已确认：正式站已切换到验收预览版本，公网首页与本地预览 `index.html` 逐字节一致。
本次只覆盖静态站文件，未修改 Nginx、Contact 服务、`/review/`、证书或生产密钥。

## 根因

此前发布包来自旧 `dist`。`scripts/build-release.mjs` 会把部分 `<img src>` 回退路径改写成
优化 WebP 路径，导致发布 HTML 与验收页面源码不一致；当前 CSS、脚本和关键图片并非主要
差异。现已移除该构建期 HTML 改写，并加入“构建产物必须与预览 HTML 完全相同”的回归测试。

## 生产目标

- 火山引擎账号：`2103632597`
- 区域：`cn-hongkong`
- ECS：`i-yeo9geadc0plsv0abgv0`
- 主机名：`webhkhome`
- 公网 IP：`150.5.135.196`

## 发布制品

- 静态 ZIP SHA-256：`fe70be990ea05166ffc9f15d12ea6c5df91458e6d811a8e8a8bbe35d17bb4d59`
- 传输包 SHA-256：`3b64c794d0cdefa2d66d4e17a8d46c1f40d2fe1a60b589917572bddf2eb1eaa7`
- 传输包大小：`6,760,539` bytes；12 个普通文件；ECS 端内层校验通过
- 首页 SHA-256：`89e4fa4e6043b204923a44720bc2820ff8e0766f23795ff40c0f45fa6d3f2e95`
- 首页大小：`26,885` bytes
- `styles.css` SHA-256：`1ace6a25676c48ec91124271b3ff971506c3ef1b1d8981313652c688e143572b`
- Service 03 图片 SHA-256：`c4601f7a49a303e2bb5cca1b10390ea114bbacb411f41c5f99f29da63478db97`
- Our Talent 图片 SHA-256：`f9187abb6213fdd05725f0db3cf45551619465cea9b3758dfe8863b3e4fceed2`

## 发布与回滚证据

- 通过已核验 ECS 直连通道上传，未创建或使用公开 GitHub 临时分支。
- 服务器端静态发布脚本完成：静态包、验收脚本、旧首页/样式基线、静态文件、Contact、
  `/review/` 与公网验收均通过。
- 发布前快照：
  `/var/backups/flourishculturekol.com/20260822T102553Z-v1.2.0-static-89e4fa4`
- 回滚清单：
  `/var/backups/flourishculturekol.com/20260822T102553Z-v1.2.0-static-89e4fa4.SHA256SUMS`
- 快照根目录 `root:root 0700`，快照树 `root:root 0755`，清单 `root:root 0600`，完整校验通过。
- 发布后清理了 ECS 上唯一的临时传输目录；未删除生产 web root 或回滚备份。

## 独立公网读回

从发布机器之外请求正式域名并与本地验收预览逐字节比较，结果通过：

- 首页：HTTP 200，SHA-256 `89e4fa4…f2e95`，`26,885` bytes
- `styles.css`、Service 03 图片、Our Talent 图片均与本地预览一致
- `PUBLIC_ASSETS_EQUAL_PREVIEW=passed`
- 服务器 web root 首页和 `styles.css` 哈希也与预览一致
- Nginx 当前配置 SHA-256：`9feef6acf5e1bbae1dc6b888bfa17df802ed942ed542e01301597cb662c327f2`，
  发布过程未修改该文件；`nginx -t`、Nginx、Contact 均健康

## 本地验证

- `npm test`：87/87 通过
- 四视口本地 release-equivalent Chrome QA：桌面、平板、390px、360px 全部通过；无横向溢出、
  无意外控制台错误
- 构建回归：`dist/index.html` 与验收预览 `index.html` 完全一致

## 说明

第一次发布尝试使用的发布脚本包含过期的 Nginx 哈希基线，且断言函数未在失败后立即返回；
它没有改动 Nginx，也没有阻止静态发布后的完整验收。随后已修正断言并通过 87 项测试；
修正版二次执行在写入前正确因“旧首页已不再存在”而停止，未再次覆盖线上。当前线上内容以
第一次成功发布后的独立公网读回为准。

本记录证明生产运行状态，不等同于远端源码分支已完成同步。
