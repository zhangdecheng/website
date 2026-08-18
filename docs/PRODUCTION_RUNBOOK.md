# FLOURISH CULTURE v1.2.0 生产发布运行手册

## 当前结论

状态：**未完成**。

本地代码、静态包、Contact 服务包和浏览器回归已通过；公开网络基线与服务器内只读
预检也已留证。目标为香港实例 `i-yeo9geadc0plsv0abgv0`。系统 Node.js 虽为
`v12.22.9`，但 Review 已确认使用独立 Node 22，服务器另有 Contact 可用的独立 Node
24 路径。Contact 通过 `/opt/flourish-contact/runtime` 稳定 symlink 使用该运行时，
不会替换系统 Node 或 Review 运行时。私密环境与发布备份完成前仍不得启动生产服务。

本手册遵循以下停止条件：目标 IP 不匹配、`/review/` 不健康、Node.js 低于 20、
无法读取 `nginx -T`、磁盘或备份权限不足、私密凭据无法安全写入时，立即停止并将
发布保持为“未完成”。

## 发布身份

| 项目 | 已确认值 |
| --- | --- |
| 版本 | `1.2.0` |
| 已通过完整本地门禁的提交 | `9e438abe0bb6904c783a368345c5bde1ac7072a7` |
| 功能与发布脚本提交 | `f0f121c184bef4be024673ba6b5a81ac31e67049` |
| 静态包 | `release/flourishculturekol-homepage.zip` |
| 静态包字节数 | `1,003,971` |
| 静态包 SHA-256 | `1da00f09c5dac993f1e885b0036eceb9bf4081e16a01e8ba42fa9a3142fbc5ea` |
| Contact 服务包 | `release/flourish-contact-service.tgz` |
| Contact 服务包字节数 | `10,162` |
| Contact 服务包 SHA-256 | `b6628615defb2b9243dcc1c8f3c124ebb7f22038e16cafc36421e3aab4d06c6a` |
| Contact 部署脚本 SHA-256 | `da85d4340c7ad1216b19da15292b54cf1b999204aac1d3baf75eb2b91dfa8cdb` |
| 静态部署脚本 SHA-256 | `30b34b4da2973432d226ec4490297e934517036a4e587ea81dfca0f94191753c` |
| systemd unit SHA-256 | `245f763ea8dc04a795f6fdf3b908f00baa2138b28b261a5e51dcc38b27a98e50` |
| Nginx API 模板 SHA-256 | `a826fe31820b6095d18cd7a9cfde8965d70338cd6267305f64afa4ea157911cf` |
| 公开验收脚本 SHA-256 | `40ff782dce9c49129de0e1c3f9d83bbf91b4224ab90718bd6e4a9414febeefa3` |

生成包位于被 Git 忽略的 `release/` 目录，不包含 `.env`、凭据、日志、测试或
`node_modules`。传输后必须在服务器再次核对 SHA-256，任何不一致都应停止发布。

## 邮件与域名约束

| 类型 | 固定 From | 固定 To | Reply-To |
| --- | --- | --- | --- |
| Brand | `business@flourish-culture.com` | `hannah@flourish-culture.com` | 经校验的访客邮箱 |
| Creator | `business@flourish-culture.com` | `irisa@flourishculture.com` | 经校验的访客邮箱 |

访客邮箱绝不能放入 From。SMTP 登录成功只证明邮件服务器接受身份验证，不等于收件箱
已投递；Brand、Creator 两封真实邮件及 Reply-To 都必须由对应收件箱读回确认。

规范站点为 `https://www.flourishculturekol.com/`。apex 的 HTTP 与 HTTPS 最终都应
以 `301` 跳转到 www，并保留完整路径和查询参数。

## Cloudflare Turnstile 配置

### 创建挂件

在 Cloudflare 控制台执行：

1. 打开 **Turnstile → Add widget**。
2. 名称填写 `FLOURISH Website Contact`。
3. 模式选择 **Managed**。
4. 允许以下两个 hostname，不带协议和路径：
   - `www.flourishculturekol.com`
   - `flourishculturekol.com`
5. 保存后，将 Site Key 用于网页/服务配置；Secret Key 只写入服务器受保护环境文件。

已按 Cloudflare 官方资料核实：Site Key 是公开标识，Secret Key 是服务端私钥；前端
挂件本身不能完成防护，服务端必须调用 Siteverify。Turnstile token 仅可验证一次，
有效期为 300 秒。本站服务还会校验 hostname 与固定 action `contact_submit`。

官方资料：

- <https://developers.cloudflare.com/turnstile/get-started/>
- <https://developers.cloudflare.com/turnstile/concepts/widget/>
- <https://developers.cloudflare.com/turnstile/get-started/server-side-validation/>

### 凭据边界

- Site Key 可以公开，也可以在本任务中提供。
- Turnstile Secret、SMTP 授权码和 `CONTACT_SECURITY_SECRET` 不得粘贴到聊天、Git、
  截图、命令参数或 Cloud Assistant 命令输出中。
- Cloud Assistant 的命令与输出可能被审计，所以三项私密值必须由用户在 ECS 的私密
  Web 终端或 SSH 会话中直接录入。
- 如无法使用私密终端，停止发布，不采用明文临时文件或聊天中转。

## 私密环境文件

生产文件固定为 `/etc/flourish-contact.env`，必须恰好使用以下八个键。下列空值只是
结构示例，不能作为可启动配置：

```dotenv
CONTACT_PORT=3101
CONTACT_TURNSTILE_SITE_KEY=
CONTACT_TURNSTILE_SECRET=
CONTACT_SECURITY_SECRET=
SMTP_HOST=smtp.yunyou.top
SMTP_PORT=465
SMTP_USER=business@flourish-culture.com
SMTP_PASSWORD=
```

在私密服务器会话中：

1. 先确认专用组 `flourish-contact` 已存在。
2. 使用 `sudoedit /etc/flourish-contact.env` 录入值；不要通过命令参数传值。
3. `CONTACT_SECURITY_SECRET` 使用服务器本机生成的至少 32 字节随机值；建议
   `openssl rand -hex 48`，只在私密终端中处理。
4. 设置 `root:flourish-contact` 和 `0640`：

```bash
sudo chown root:flourish-contact /etc/flourish-contact.env
sudo chmod 0640 /etc/flourish-contact.env
sudo stat -c '%U:%G %a %n' /etc/flourish-contact.env
```

只验证键名与 set/unset 状态，不输出值：

```bash
sudo awk -F= '
  BEGIN {
    count = split("CONTACT_PORT CONTACT_TURNSTILE_SITE_KEY CONTACT_TURNSTILE_SECRET CONTACT_SECURITY_SECRET SMTP_HOST SMTP_PORT SMTP_USER SMTP_PASSWORD", required, " ")
    for (i = 1; i <= count; i++) expected[required[i]] = 1
  }
  /^[A-Za-z_][A-Za-z0-9_]*=/ {
    key = $1
    seen[key]++
    value = substr($0, index($0, "=") + 1)
    state[key] = length(value) ? "set" : "unset"
  }
  END {
    for (i = 1; i <= count; i++) printf "%s=%s\n", required[i], seen[required[i]] == 1 ? state[required[i]] : "missing-or-duplicate"
    for (key in seen) if (!expected[key]) printf "unexpected-key=%s\n", key
  }
' /etc/flourish-contact.env
```

必须读回八个预期键、八项均为 `set`、owner/mode 为
`root:flourish-contact 640`。任何真实值都不得写入本手册或 QA 记录。

## 只读服务器预检

目标实例必须由云账号与公网 IP `150.5.135.196` 双重确认，不能仅依据历史记录。
在任何写入前执行并保存脱敏结果：

```bash
id
hostnamectl
uname -a
node --version
npm --version
nginx -v
nginx -T
systemctl is-active nginx
systemctl status nginx --no-pager
systemctl status tiktok-review-agent --no-pager || true
curl -fsS http://127.0.0.1/review/healthz -H 'Host: www.flourishculturekol.com'
stat -c '%U:%G %a %n' /var/www/flourishculturekol.com /var/backups/flourishculturekol.com
df -h /var /opt
```

从 `nginx -T` 的 `# configuration file ...` 标记中确认：

- www HTTP、www HTTPS、apex HTTP、apex HTTPS 分别由哪个真实文件加载；
- `/review/` 与证书指令所在文件；
- 静态 web root 是否确为 `/var/www/flourishculturekol.com`；
- `/api/contact` 当前是否已存在，避免覆盖未知服务。

2026-08-18 已读回：目标实例为 `cn-hongkong` 的
`i-yeo9geadc0plsv0abgv0`；hostname `webhkhome`，Ubuntu `22.04.5 LTS`；Node.js
`v12.22.9`；Nginx `1.18.0 (Ubuntu)` 且 `nginx -t` 通过；Nginx 来源文件为
`/etc/nginx/conf.d/00-flourishculturekol.com.conf`；web root 与备份根目录 owner/mode
均为 `root:root 755`；磁盘可用 8.0G。

当前同一 HTTPS server 同时承载 apex/www，并包含以下必须保留的现有路由：

- `/review/` → `127.0.0.1:8787/`；
- `/review-staging/` → `127.0.0.1:8788/`。

补充审计确认系统 npm 包为 `8.5.1`，Review production/staging 均使用
`/opt/node-v22.16.0-linux-x64/bin/node`，本机 TLS/SNI `/review/healthz` 为 200，Nginx
来源文件为 `root:root 644`，SHA-256 为
`77688b28f0977175bb7730083527774f1a55ea7b184da35ca678e37b1ae9a1c8`。Contact 使用
`/opt/node-v24.17.0-linux-x64`，正式写入前仍要直接读回该 binary/npm 的版本。完整证据
见 `qa/production-preflight-2026-08-18.md`。

## 传输与校验

将以下文件按现有相对路径上传到服务器的同一个受限暂存根目录；不得上传整个仓库：

- `release/flourishculturekol-homepage.zip`
- `release/flourish-contact-service.tgz`
- `release/SHA256SUMS`
- `scripts/deploy-contact-service.sh`
- `deploy-cloud-assistant.sh`
- `ops/flourish-contact.service`
- `ops/nginx/flourish-contact-api.conf`
- `check-https-cloud-assistant.sh`

在服务器暂存根目录执行：

```bash
sha256sum -c release/SHA256SUMS
unzip -l release/flourishculturekol-homepage.zip
tar -tzf release/flourish-contact-service.tgz
```

不要移动文件或改写清单路径。

预期七个文件校验均为 `OK`。服务包顶层只能出现 `ops/`、`server/`、`package.json`、
`package-lock.json`；静态包必须包含六个站点文件、Privacy 页面与两张新 WebP。

## 生产备份

使用已确认的 Nginx 来源文件
`/etc/nginx/conf.d/00-flourishculturekol.com.conf` 创建 UTC 时间戳备份。不得改用猜测
路径，也不得把 `/etc/flourish-contact.env` 复制到普通备份目录。

备份至少包含：

- 当前 `/var/www/flourishculturekol.com`；
- 已确认的 Nginx 来源文件；
- 已存在的 `/etc/systemd/system/flourish-contact.service`；
- 已存在的 `/opt/flourish-contact/current` 链接目标记录。

备份完成后记录实际目录、owner/mode、文件列表和 SHA-256。当前只确认四个历史目录名
存在，内容与完整性尚未检查；本次 v1.2.0 发布备份尚未创建，因此本次实际备份路径为
**未确认**。

## Contact 服务发布

仅在私密环境文件通过检查、独立 Node.js >= 20 直接复核通过、服务包哈希匹配后执行：

```bash
if ! id flourish-contact >/dev/null 2>&1; then
  sudo useradd --system --home /nonexistent --shell /usr/sbin/nologin flourish-contact
fi
sudo install -o root -g root -m 0644 ops/flourish-contact.service /etc/systemd/system/flourish-contact.service
sudo systemctl daemon-reload
sudo bash scripts/deploy-contact-service.sh \
  /absolute/path/to/flourish-contact-service.tgz \
  /opt/node-v24.17.0-linux-x64
sudo systemctl enable flourish-contact
```

`useradd` 只在 `id flourish-contact` 确认用户不存在时执行。部署脚本会验证明确传入的
Node/npm、安装版本化目录、原子切换 `/opt/flourish-contact/current` 与
`/opt/flourish-contact/runtime`、重启并轮询本机健康端点；健康失败时恢复两个原
symlink。它不会编辑 Nginx、不会读取/打印环境值，也不会删除旧版本或改写
`/usr/bin/node`、`/opt/nodejs`。

服务验证：

```bash
sudo systemctl is-active flourish-contact
sudo systemctl status flourish-contact --no-pager
curl -fsS http://127.0.0.1:3101/api/contact/health
curl -fsS http://127.0.0.1:3101/api/contact/config
ss -ltnp | grep ':3101'
sudo journalctl -u flourish-contact --since '-10 minutes' --no-pager
```

预期：服务为 active；health 返回 `configured:true` 与版本 `1.2.0`；config 只包含
公开 Site Key、表单会话 token 和过期时间；监听仅为 `127.0.0.1:3101`；启动前 SMTP
结果为 `smtp_authentication_accepted`，日志中没有凭据、原始邮箱、姓名或表单正文。

## Nginx 最小变更

必须从实际加载的
`/etc/nginx/conf.d/00-flourishculturekol.com.conf` 生成候选文件，并保留证书、
`/review/` 和 `/review-staging/` 原样。只有 www HTTPS server 接收以下 API
location：

```nginx
location = /api/contact {
    client_max_body_size 32k;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_pass http://127.0.0.1:3101;
}

location ^~ /api/contact/ {
    client_max_body_size 32k;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_pass http://127.0.0.1:3101;
}
```

www HTTP、apex HTTP、apex HTTPS 应分别使用：

```nginx
return 301 https://www.flourishculturekol.com$request_uri;
```

只对首页和 Privacy 静态 HTML 的准确 location 添加以下头，不得覆盖 `/review/`：

```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self' https://challenges.cloudflare.com; connect-src 'self' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; img-src 'self' data:; style-src 'self'; font-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
add_header X-Frame-Options "DENY" always;
```

本次不启用全域 HSTS，因为它会影响同一 hostname 下的全部路径，超出只改主页的风险
边界。安装候选配置前后都必须执行 `nginx -t`；只有通过后才 reload。reload 后先在
服务器本机使用 Host header 验证 www API、apex 跳转及 `/review/healthz`。任一失败就
恢复已记录的 Nginx 备份并再次 `nginx -t`、reload。

## 静态站点发布

服务和 Nginx 本机验证全部通过后，再发布静态包：

```bash
sudo bash deploy-cloud-assistant.sh /absolute/path/to/flourishculturekol-homepage.zip
```

脚本会备份当前 web root、复制已审核的静态文件、修复可读权限并运行 `nginx -t`；
不会编辑 Nginx、证书或 `/review/`。必须保存脚本打印的实际备份路径。

## 公开验收

以下项目必须全部实测：

| 项目 | 验收条件 | 当前状态 |
| --- | --- | --- |
| www 首页 | `200`，canonical 指向 www | 未确认（新版本未部署） |
| apex HTTP/HTTPS | `301` 到 www，路径与查询参数不丢失 | 未确认（当前 HTTPS apex 为 200） |
| Privacy | `200`，canonical 正确 | 未确认 |
| Contact health/config | `200` JSON，无秘密值 | 未确认 |
| 无 Origin 的 Contact POST | `403` | 未确认 |
| 安全头 | 首页和 Privacy 包含五项约定头 | 未确认 |
| 新图片 | 两张 WebP 均 `200`，哈希匹配本地 `dist/` | 未确认 |
| JS/CSS/module | `200`、MIME 正确、浏览器无控制台错误 | 未确认 |
| `/review/healthz` | `200` | 当前旧版公开检查为 200；发布后仍需复测 |
| `/review/` | 跳转 `/review/login` | 当前旧版公开检查为 302；发布后仍需复测 |

至少在桌面和移动端浏览器完成 Brand/Creator 切换、验证、校验错误与成功状态检查。

## 真实邮件验收

只有用户再次确认测试发件地址后，才从公开表单各提交一条带 UTC 唯一标记的 Brand 与
Creator 测试。服务返回 `201` 或重复请求 `202` 仅代表接口接受，不代表收件箱送达。

必须分别读回：

- Hannah 收件箱：Brand 邮件的 From、To、Subject、全部 Brand 字段、无 Creator 字段；
- Irisa 收件箱：Creator 邮件的 From、To、Subject、全部 Creator 字段、无 Brand 字段；
- 两封邮件点击 Reply 后，收件人均为已确认的受控测试邮箱。

只在 QA 记录中保存 UTC 时间、request ID、SMTP 接受状态和收件人确认结论；不保存
完整表单内容、Turnstile token 或邮件凭据。任一收件箱/Reply-To 未确认，发布仍为
“未完成”。

## 回滚

### Contact 服务

部署脚本在健康失败时会自动恢复之前的 `current` symlink。人工回滚必须使用预检中
记录的上一个绝对 release 路径，原子替换 symlink，restart 后重查 loopback health；
不得猜测“上一个目录”。

### Nginx

用本次发布前记录的真实备份覆盖同一已确认来源文件，执行 `nginx -t`，通过后 reload，
再验证 www、apex 与 `/review/`。

### 静态站点

使用本次静态部署脚本打印的备份目录恢复 `/var/www/flourishculturekol.com`，执行
`nginx -t` 并重查首页、资源和 `/review/`。成功发布后不为了演练而主动执行线上回滚；
只需验证备份存在、可读且回滚命令目标明确。

## GitHub 与 Pages 收尾门

真实邮件、Reply-To、公开站点和 `/review/` 全部验收前：

- 不将功能分支推到 `main`；
- 不关闭 GitHub Pages；
- 不声称生产完成。

验收通过后仍需先拉取并证明远端 `main` 没有独有提交，再取得最终明确授权后进行
非 force push。GitHub Pages 删除是独立、可见的外部变更，必须先读状态、删除、再
读回 404，并确认 Git 仓库本身仍可访问。

## 实际发布证据（待填写）

| 证据 | 结果 |
| --- | --- |
| 火山引擎账号/区域/实例 ID | 已确认：`2103632597` / `cn-hongkong` / `i-yeo9geadc0plsv0abgv0` |
| 服务器公网 IP 读回 | 已确认：唯一目标实例绑定 `150.5.135.196` |
| Node.js/npm/Nginx 版本 | 系统 Node `v12.22.9` / npm `8.5.1`（不用于 Contact）；隔离 Node 24 路径已确认，直接版本复核待执行；Nginx `1.18.0 (Ubuntu)` |
| Nginx 来源文件及备份 | 来源已确认：`/etc/nginx/conf.d/00-flourishculturekol.com.conf`；本次备份未创建 |
| web root 备份路径 | 根目录与四个历史目录已确认；本次发布备份未创建 |
| Contact 前一版本与当前 release 路径 | 当前未找到 Contact 目录、unit 或环境文件；新 release 未安装 |
| systemd active 与 loopback health | Nginx、Review production/staging active；本机 TLS/SNI Review health 200、root 302 到登录 |
| SMTP 身份验证 | 未确认 |
| 公开静态/API/安全头/哈希 | 未确认 |
| Brand 收件箱及 Reply-To | 未确认 |
| Creator 收件箱及 Reply-To | 未确认 |
| `/review/` 发布后回归 | 未确认 |
| 远端 `main` 读回 | 未确认 |
| GitHub Pages 删除读回 | 未确认 |
