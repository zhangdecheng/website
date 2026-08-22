# FLOURISH CULTURE v1.2.0 Production Release Evidence — 2026-08-20

## 结论

状态：**部分完成（核心网站与真实表单提交已上线并通过；收件箱读回和代码托管收尾未完成）**。

生产主机 `webhkhome` / `150.5.135.196` 已运行 v1.2.0 静态站点、规范化 Nginx
路由和 loopback-only Contact 服务。服务器内完整发布检查、本机站外独立检查、TLS
链读取、86/86 Node 测试和四视口系统 Chrome QA 均通过。用户在私密 TTY 中重建受
保护配置后，新的 Brand 与 Creator Managed Turnstile 均成功，页面显示成功，Contact
日志记录 `outcome=accepted`。Creator 收件地址修正后又完成一次唯一标记重试。但尚未
读回 Hannah/Irisa 收件箱与 Reply-To，因此不能把 SMTP 接受等同于真实邮件送达。

## 发布身份

| 项目 | 已确认值 |
| --- | --- |
| 初始核心发布提交 | `d8389aefde9ac684bdee8e9beb1a30cc1a04731b` |
| Contact 诊断与轮换提交 | `a2251b0987b50f29295bca180c9b01ec87a6ce51` |
| 轮换事务与跨平台归档审查修复 | `ac8f54ee930eb5c6e1b1c8984a55b6ab68542800` |
| 回滚恢复失败显式告警 | `d3f4d059a8fca1738b176360a259dd750c584395` |
| GitHub 历史 / 性能 / 平板修复 | `94cb2ab` / `a32f9d9` / `6087ae5` |
| 安全静态发布脚本 | `474bd69`（生产实际执行版本）；`ef61222`（审查加固版本） |
| 当前生产静态 ZIP | 1,001,919 bytes；SHA-256 `af10b1f4888bc848afeafa0055e55f5a480736940148f5ced26b5ec5e6707253` |
| 当前 Contact TGZ | 9,006 bytes；SHA-256 `ddb674d7d65ea3273009f293c2de8e70135da1749650b9651b556277aa72aa3b`；生产路由文件与本地源码哈希匹配 |
| 实际最终发布传输 TGZ | 1,022,097 bytes；SHA-256 `d90c795cba9d494eecfaf6cbd17fe52cc6d0268cd353da41b9ee3113c4188022` |
| 当前仓库可复现传输 TGZ | 1,022,160 bytes；SHA-256 `c8f53f5fcb3cb051a8db78c6b808b9fb783a0309c17464fc704120808741c3cb`；12 个普通文件 |
| 传输成员 | 12 个普通文件；11/11 payload 校验 `OK`；无 AppleDouble/xattr 警告 |
| 最终服务器暂存 | `/root/flourish-transfer-v1.2.0-6087ae5-final` |

## 私密配置与 Contact

- `/etc/flourish-contact.env` 已由用户在受保护 TTY 中录入；读回仅显示八个键均为
  `set`，assignment count 为 8，权限为 `root:flourish-contact 0640`；未读取或记录值。
- systemd unit 为 `root:root 0644`，`flourish-contact.service` 为 active/enabled。
- 当前 release：`/opt/flourish-contact/releases/20260820T110838Z`；前一版本
  `/opt/flourish-contact/releases/20260819T202836Z` 保留用于回滚。
- 运行时：`/opt/node-v24.17.0-linux-x64`；未替换系统 Node 或 Review Node。
- 端口 3101 只监听 `127.0.0.1`。
- loopback health 返回 `{"ok":true,"configured":true,"version":"1.2.0"}`。
- config 只公开 `expiresAt`、`formSessionToken`、`turnstileSiteKey` 三个非空字段。
- SMTP 启动预检日志读回 `smtp_authentication_accepted`，没有凭据值。

## 回滚点

| 类型 | 路径 / 结果 |
| --- | --- |
| 发布前控制面和 web root | `/var/backups/flourishculturekol.com/20260819T190447Z-v1.2.0-predeploy`；`root:root 0700`；47 个 web 文件 |
| 静态覆盖前精确快照 | `/var/backups/flourishculturekol.com/20260819T192328Z-v1.2.0-static-d8389ae`；47 个文件 |
| 静态快照清单 | 同名 `.SHA256SUMS`；`root:root 0600`；发布后全量读回 `OK` |
| 最终刷新前精确快照 | `/var/backups/flourishculturekol.com/20260819T230115Z-v1.2.0-static-6087ae5`；51 个文件；根 `root:root 0700` |
| 最终刷新快照清单 | 同名 `.SHA256SUMS`；`root:root 0600`；权限收紧后全量读回 `OK` |
| 旧 Nginx | 预部署目录内 `00-flourishculturekol.com.conf`；SHA-256 `77688b28f0977175bb7730083527774f1a55ea7b184da35ca678e37b1ae9a1c8` |
| 当前 Nginx | `/etc/nginx/conf.d/00-flourishculturekol.com.conf`；SHA-256 `22efa58a328b5855999638133acc13a9472fa27132b1cba675479adbe2904d3e` |

上述备份均没有复制 `/etc/flourish-contact.env`。

## Nginx 与静态发布过程

第一次原子切换在 reload 后首个 HTTP 探针仍命中旧 worker，返回同主机 HTTPS 跳转；
脚本立即恢复旧配置、执行 `nginx -t`、reload，并读回 Review health `200`。未把该次
失败记为成功。

第二版切换脚本加入最多 10 秒的新 worker 收敛轮询。第二次切换在第 2 次探针看到
候选 generation，随后 www Contact health/config、apex HTTP/HTTPS、www HTTP、首页、
Review health 与登录跳转全部通过。静态复制后，下列生产文件哈希与本地发布一致：

```text
37b42852eb54b4ca5c065fea48c912d95e7296149e7b62c512e5b38f136aeacb  index.html
ea1be315e5d0137d918d21a1fb7fff8ac0724057cb3c72ec7b0d1d5b40277f5a  privacy.html
995033f01f8c240270f1262760d61a43a3e57d2a13ca71ab6a5d048b465481ab  service-creative-localization-meetup.webp
f9187abb6213fdd05725f0db3cf45551619465cea9b3758dfe8863b3e4fceed2  talent-creator-growth-studio.webp
```

随后部署最终性能/平板修复静态 ZIP `af10b1f4…07253`。本次不修改 Nginx 或 Contact，
事务脚本先创建 51 文件精确快照，再通过服务器内完整门禁；本机使用 `--noproxy` 和
固定生产 IP 的独立 HTTPS 读回也匹配：

```text
7339fe4e6d004739f0f2b86de92af0c86038502e0dc6b985bee738f860d533f2  index.html
61afde1b48e96219fb39db0f4930d0b7e5e9d76716f9d2cc9fea7bd8a54b2824  styles.css
ea1be315e5d0137d918d21a1fb7fff8ac0724057cb3c72ec7b0d1d5b40277f5a  privacy.html
```

首次读回发现 `rsync -a` 将备份根模式继承为 `0755`。该备份明确不含
`/etc/flourish-contact.env`，清单仍为 `0600`；但没有该时间窗的完整访问审计，因此无法
确认期间是否曾被其他本机主体读取。随后将备份根收紧到 `root:root 0700` 并再次全量
校验 `OK`。提交 `474bd69` 先补充事后收紧；审查加固提交 `ef61222` 改为始终保留
`0700` 保护外壳，并增加验收脚本哈希固定、完整清单回滚复核与四个故障注入测试。

## 公开与浏览器验证

- DNS apex/www 均读回 `150.5.135.196`。
- apex HTTP、apex HTTPS、www HTTP 均 `301` 到规范 www，保留路径与查询参数。
- www 首页与 Privacy 均 `200`，canonical、精确正文哈希和五项约定安全头通过。
- Contact health/config 均 `200`；无 Origin POST 为 `403`。
- CSS、三个 JS 和两张新 WebP 的 MIME 与 SHA-256 通过。
- `/review/healthz` 为 `200` JSON；`/review/` 为 `302` 到 `/review/login`。
- TLS 链逐级 `verify return:1`；证书 issuer 为 Let's Encrypt YE2，SAN 覆盖 apex/www，
  有效期 `2026-08-10T17:37:15Z` 至 `2026-11-08T17:37:14Z`。
- `npm test`：86/86。
- `qa/browser-results.json`：系统 Chrome / Playwright Core 1.62.1；1440×1024、
  1024×1366、390×844、360×800 四个视口 failure list 为空；角色切换、键盘顺序、
  错误恢复、成功重置、无横向溢出、reduced motion、Privacy 可读性及移动菜单均通过；
  四个视口 Hero CTA 均完全包含，1024px 视口底部间距为 97px。
- 内置浏览器控制通道对生产页面连续导航超时，未取得真实生产浏览器 DOM；因此上述
  Chrome 证据来自与生产文件哈希一致的本地 `dist/`，不能替代真实 Turnstile 验收。

## Turnstile 边界探测

站外取得有效表单 session，等待超过 3 秒后提交一个合成无效 Turnstile token。公开
API 返回 `403`，request ID `4a8a51c0-ef19-4238-bb2c-c81f345cb8d6`。服务器安全日志只
记录哈希标识，读回 outcome `verification_failed`、reason `turnstile_rejected`、耗时
98 ms；流程在 Turnstile 后立即返回，没有进入重复检测、邮箱限流或 SMTP。

这证明失败边界按设计工作，但不能证明真实 widget token、hostname/action 和成功路径
已经通过。

在用户确认真实提交后，正式页 Managed widget 已签发 token，Brand 表单三次到达
Contact 服务。前两次日志为 `turnstile_rejected`；部署只记录 Cloudflare 官方安全错误码
的诊断热修复后，第三次请求
`471c2340-0dab-4269-bb4e-7124a7a1e5ee` 在
`2026-08-19T20:37:24.854Z` 返回 `diagnostic=invalid-input-secret`。这直接证明当时 ECS
保存的 Turnstile Secret 不属于公开 Site Key 对应的 widget，或录入时发生错误；它不
是 hostname/action 校验失败。三个请求都在 Turnstile 边界停止，没有进入 SMTP。

诊断热修复已部署到 `/opt/flourish-contact/releases/20260819T202836Z`，服务 active/
enabled，只监听 `127.0.0.1:3101`，本地和公网 health 均为 `200`。受保护轮换脚本
`scripts/rotate-contact-turnstile.sh` 只隐藏更新该一项，保留其余七项配置，失败自动
回滚；ECS 副本为 `/root/flourish-turnstile-secret-update.sh`，`root:root 0700`，SHA-256
`6c3f621527edf15721406596908ce11aa23272194afff6de5c61f938d5f8653a`。用户随后通过
私密 TTY 重新创建了八键环境；当前文件为 `root:flourish-contact 0640`、362 bytes，
服务 health/config 正常。任何值均未读取或写入记录。

## 新配置成功路径与 Creator 路由更正

- 新配置下的 Brand 与 Creator 生产 Managed Turnstile 均显示成功；页面均显示
  `Thank you—your message has been received.`，对应日志均为 `outcome=accepted`。
- 初次 Creator 请求使用了错误固定地址 `irisa@flourishculture.com`。用户报告失败后，
  本地先把两项回归断言改为正确地址并确认失败，再把实现改为
  `irisa@flourish-culture.com`，目标测试和完整 86 项测试均通过。
- 修正后的 Contact 包 SHA-256 为 `ddb674d7…72aa3b`，已部署至
  `/opt/flourish-contact/releases/20260820T110838Z`；运行路由文件与本地源码 SHA-256
  均为 `47d40d2c…30b235`，正确地址计数 1、旧地址计数 0。
- 更正后 Creator 重试标记为 `E2E-CREATOR-ROUTE-FIX-20260820T111525Z`；请求
  `6129340b-43d5-4475-83c2-81362c178e8a` 在 `2026-08-20T11:28:05.017Z` 被接受。
- 2026-08-20T12:00Z 后在 ECS 使用 Contact Node v24 重新执行受版本控制的正式生产
  验收脚本，Nginx、loopback health、规范跳转、首页/Privacy、安全头、精确哈希、
  Contact API、静态资源与 `/review/` 全部通过。被 Git 忽略的旧
  `release/verify-public-v1.2.0.sh` 固定了历史首页哈希，不作为验收证据。

## 仍未确认 / 硬门槛

- 从 Hannah 收件箱读回 Brand 邮件，并确认 Reply-To 为受控测试邮箱。
- 从 Irisa 收件箱读回更正后的 Creator 邮件，并确认 Reply-To 为受控测试邮箱。
- `/review/` 受保护页面内的登录后内容（本次未取得 Review 登录凭据；仅确认代理、健康
  和登录保护未回归）。
- 本地已通过 `94cb2ab` 合并远端 `main` 独有历史；最终非 force push 与 GitHub Pages
  删除/readback 仍未完成。当前 `gh auth status` 显示保存的 token 无效。

在这些门槛完成前，状态保持**部分完成**。
