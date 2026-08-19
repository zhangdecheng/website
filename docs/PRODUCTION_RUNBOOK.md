# FLOURISH CULTURE v1.2.0 生产发布运行手册

## 当前结论

状态：**未完成（v1.2.0 核心生产发布已完成；真实邮件与代码托管收尾尚未完成）**。

本地代码、发布包、四视口 Chrome 回归、Contact 服务、Nginx 与最终静态站点已实测上线到
香港实例 `i-yeo9geadc0plsv0abgv0`。Contact 通过
`/opt/flourish-contact/runtime` 指向独立 Node 24，不替换系统 Node 12 或 Review 的
运行时。公开 www/apex/API/Privacy/安全头/文件哈希及 `/review/` 健康与登录跳转均已
通过服务器内和独立直连两轮检查。历史真实请求曾由 Cloudflare 明确返回
`invalid-input-secret`，证明当时的 Turnstile Secret 与公开 Site Key 不匹配；用户随后
重新创建了受保护环境，但当前值从未被读取，仍缺新配置下的真实 Turnstile 成功提交、Brand/Creator 两个
收件箱投递与 Reply-To 读回，以及远端 `main`/GitHub Pages 收尾，所以不得声称项目
已经全部完成。

本手册遵循以下停止条件：目标 IP 不匹配、`/review/` 不健康、Node.js 低于 20、
无法读取 `nginx -T`、磁盘或备份权限不足、私密凭据无法安全写入时，立即停止并将
发布保持为“未完成”。

## 发布身份

### 当前生产状态（已读回）

| 项目 | 已确认值 |
| --- | --- |
| 版本 | `1.2.0` |
| 当前静态内容提交 | `6087ae5d5cc1320075a10118c0ab8fc8a76cc4bb` |
| 当前静态 ZIP | `1,001,919` bytes；SHA-256 `af10b1f4888bc848afeafa0055e55f5a480736940148f5ced26b5ec5e6707253` |
| 生产首页 / 样式 SHA-256 | `7339fe4e6d004739f0f2b86de92af0c86038502e0dc6b985bee738f860d533f2` / `61afde1b48e96219fb39db0f4930d0b7e5e9d76716f9d2cc9fea7bd8a54b2824` |
| 当前 Contact release | `/opt/flourish-contact/releases/20260819T202836Z`；源码逐文件匹配下方 `bab01f95…0628` 包 |
| 当前 Nginx SHA-256 | `22efa58a328b5855999638133acc13a9472fa27132b1cba675479adbe2904d3e`（本次静态发布未修改） |
| 实际发布使用的外层包 | `1,022,097` bytes；SHA-256 `d90c795cba9d494eecfaf6cbd17fe52cc6d0268cd353da41b9ee3113c4188022`；12 个普通文件 |
| 本次回滚点 | `/var/backups/flourishculturekol.com/20260819T230115Z-v1.2.0-static-6087ae5`；51 文件；`root:root 0700`；清单 `0600` 且全量 `OK` |

### 当前仓库可复现包（部署后安全修订）

| 项目 | 已确认值 |
| --- | --- |
| 当前源码提交 | `474bd69`（静态发布脚本事务化与 root-only 备份修复） |
| 静态包 | `release/flourishculturekol-homepage.zip`；`1,001,919` bytes；SHA-256 `af10b1f4888bc848afeafa0055e55f5a480736940148f5ced26b5ec5e6707253` |
| Contact 服务包 | `release/flourish-contact-service.tgz`；`9,010` bytes；SHA-256 `bab01f95865410715a947cc29993d7c3a568f2dd1fd7d66455159743aa4c0628` |
| 单文件传输包 | `release/flourish-production-transfer-v1.2.0.tgz`；`1,022,094` bytes；SHA-256 `c94368abe566a8bc82bd97e1625cd8fd0f1ad17b8b59e2e4df7a61dcc32b369b`；12 个普通文件 |
| 静态部署脚本 SHA-256 | `ce16528e43ba600bf09806271cd7efd25008d33242c09a410e14594ccea797f0` |
| Contact 部署脚本 SHA-256 | `dfbb5a7e0d8bc2ba81504735b0a3becf731a9dd6f193f80a9f132bd921060eac` |
| 私密环境配置脚本 SHA-256 | `de51036271e182c99e2efd0a20ea458d0b6519edc4a72aa918d200d69fde6c03` |
| systemd 环境值序列化脚本 SHA-256 | `e30f524dd696fa0a9122ea6720bf6bd092d5c04d9f6da76af9a1f94d50584791` |
| 压缩包安全检查脚本 SHA-256 | `d08024fb43a812e538728baec11942e600e835e77edf6774caaf135d8cbb15c0` |
| systemd unit SHA-256 | `245f763ea8dc04a795f6fdf3b908f00baa2138b28b261a5e51dcc38b27a98e50` |
| Nginx API 模板 SHA-256 | `a826fe31820b6095d18cd7a9cfde8965d70338cd6267305f64afa4ea157911cf` |
| 公开验收脚本 SHA-256 | `dba3ae7de17beada857e07750e6d1e13eb715cdaf68e10d7366e7e28d7eb5ad8` |
| Turnstile 轮换脚本 SHA-256 | `6c3f621527edf15721406596908ce11aa23272194afff6de5c61f938d5f8653a` |
| 确定性 ustar 构建器 SHA-256 | `151a1c507c1fbf6c92461decd5402c40b3fbd68a8300d32dc0fe9188949c2c8f` |

实际发布包 `d90c79…8022` 与当前仓库包 `c94368…369b` 的静态/Contact 载荷完全相同；
差异仅来自发布后发现并修复的备份目录 `chmod 0700`。生产备份已立即手工收紧到
`root:root 0700` 并再次通过完整清单校验。上海与 UTC 时区构建后三项归档哈希逐字节一致。

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

推荐使用 `scripts/configure-contact-env.sh` 在私密服务器会话中录入。脚本拒绝命令行
参数和非 TTY 输入，Secret 与 SMTP 授权码各输入两次且不回显，在服务器本机生成
96 位十六进制安全密钥，并通过同目录临时文件和原子硬链接创建目标文件；如目标已
存在则拒绝覆盖。

如果 `/etc/flourish-contact.env` 已存在且 Siteverify 返回 `invalid-input-secret`，不要
重新输入 SMTP 授权码，也不要删除整个环境文件。只在私密 root TTY 中运行：

```bash
sudo bash scripts/rotate-contact-turnstile.sh
```

该脚本不接受参数，隐藏并二次确认新的 Turnstile Secret，只替换
`CONTACT_TURNSTILE_SECRET`，验证八个键仍各有且仅有一项，保留其余七项原始内容，使用
同目录临时文件原子切换并重启 Contact。服务或健康检查失败时恢复受保护备份；任何
Secret 值都不打印。轮换后仍必须用新的真实 widget token 验证，health `200` 不能证明
Secret 正确。

在私密服务器会话中：

1. 先确认专用用户/组 `flourish-contact` 已存在。
2. 保持 Cloudflare 创建结果页打开，以便直接把 Site Key 与 Secret Key复制到私密
   终端；不得经过聊天或 Cloud Assistant 命令。
3. 运行交互脚本：

```bash
sudo bash scripts/configure-contact-env.sh
sudo stat -c '%U:%G %a %n' /etc/flourish-contact.env
```

只有脚本不可用且能够确保同等私密边界时，才使用 `sudoedit` 手工创建同样八个键，
在服务器本机执行 `openssl rand -hex 48`，再设置 `root:flourish-contact` 与 `0640`。

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

首选只传输 `release/flourish-production-transfer-v1.2.0.tgz`。当前仓库构建的外层包
必须精确为 `1,022,094` bytes、SHA-256
`c94368abe566a8bc82bd97e1625cd8fd0f1ad17b8b59e2e4df7a61dcc32b369b`；服务器必须先
同时核对这两个值，再解压到本次新建的受限暂存目录。`d90c79…8022` 只用于说明
2026-08-20 实际发布审计，不得冒充当前源码包。外层包内恰好包含下列十二个
普通文件（十一个 payload 文件加一份内层校验清单），不得包含 symlink，也不得上传整个仓库：

- `release/flourishculturekol-homepage.zip`
- `release/flourish-contact-service.tgz`
- `release/SHA256SUMS`
- `scripts/configure-contact-env.sh`
- `scripts/rotate-contact-turnstile.sh`
- `scripts/systemd-env.sh`
- `scripts/archive-safety.sh`
- `scripts/deploy-contact-service.sh`
- `deploy-cloud-assistant.sh`
- `ops/flourish-contact.service`
- `ops/nginx/flourish-contact-api.conf`
- `check-https-cloud-assistant.sh`

外层包必须通过 `npm run build:transfer` 生成。构建器显式设置
`COPYFILE_DISABLE=1`，使用 Python 标准库写入确定性 ustar，并由独立 tar 解析器确认
真实成员恰好为上述十二个普通文件，以防 macOS `._`/AppleDouble 元数据被本机 tar
隐藏、却在 GNU/Linux 上暴露；gzip 使用无时间戳模式，上海与 UTC 时区构建必须得到
相同 SHA-256。

在服务器暂存根目录执行内层复核：

```bash
sha256sum -c release/SHA256SUMS
unzip -l release/flourishculturekol-homepage.zip
tar -tzf release/flourish-contact-service.tgz
```

不要移动文件或改写清单路径。

预期十一个 payload 文件校验均为 `OK`。服务包顶层只能出现 `ops/`、`server/`、`package.json`、
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

备份完成后记录实际目录、owner/mode、文件列表和 SHA-256。本次 v1.2.0 已创建两个
独立回滚点：发布前控制面与 web root 备份
`/var/backups/flourishculturekol.com/20260819T190447Z-v1.2.0-predeploy`（`root:root 0700`，
47 个 web 文件），以及静态覆盖前精确快照
`/var/backups/flourishculturekol.com/20260819T192328Z-v1.2.0-static-d8389ae`（47 个文件）。
后者的独立 `0600` 校验清单已在发布后全量读回为 `OK`；两份备份均明确排除
`/etc/flourish-contact.env`。

最终静态刷新另建精确回滚点
`/var/backups/flourishculturekol.com/20260819T230115Z-v1.2.0-static-6087ae5`，包含刷新前
51 个 web 文件。备份根已读回 `root:root 0700`，同名 `.SHA256SUMS` 为 `0600`，全量
校验 `OK`；Nginx 保持 `22efa58a…4d3e` 未改动。

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
sudo bash deploy-cloud-assistant.sh \
  /absolute/path/to/flourishculturekol-homepage.zip \
  /absolute/path/to/check-https-cloud-assistant.sh
```

脚本会固定校验旧/新文件与 Nginx 哈希、创建精确 web-root 备份和 `0600` 清单、复制
已审核的静态文件、修复可读权限并运行完整公开检查；备份根会在 `rsync` 后再次设为
`0700`。任何发布后门禁失败都只用精确快照恢复 web root，不编辑或降级 Nginx，随后
重新验证 Contact 与 `/review/`。必须保存脚本打印的实际备份和清单路径。

## 公开验收

以下项目必须全部实测：

| 项目 | 验收条件 | 当前状态 |
| --- | --- | --- |
| www 首页 | `200`，canonical 指向 www | 已确认；正文 SHA-256 `7339fe…33f2` |
| apex HTTP/HTTPS | `301` 到 www，路径与查询参数不丢失 | 已确认；www HTTP 同样规范化 |
| Privacy | `200`，canonical 正确 | 已确认；正文 SHA-256 `ea1be3…77f5a` |
| Contact health/config | `200` JSON，无秘密值 | 已确认；config 恰好三个公开字段 |
| 无 Origin 的 Contact POST | `403` | 已确认 |
| 安全头 | 首页和 Privacy 包含五项约定头 | 已确认 |
| 新图片 | 两张 WebP 均 `200`，哈希匹配本地 `dist/` | 已确认 |
| JS/CSS/module | `200`、MIME 正确、浏览器无控制台错误 | 已确认；CSS `61afde…2824`，四视口 Chrome QA 无失败 |
| `/review/healthz` | `200` | 已确认；服务器内与站外均通过 |
| `/review/` | 跳转 `/review/login` | 已确认；`302` 到 `/review/login` |

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

## 实际发布证据

| 证据 | 结果 |
| --- | --- |
| 火山引擎账号/区域/实例 ID | 已确认：`2103632597` / `cn-hongkong` / `i-yeo9geadc0plsv0abgv0` |
| 服务器公网 IP 读回 | 已确认：唯一目标实例绑定 `150.5.135.196` |
| Node.js/npm/Nginx 版本 | 系统 Node `v12.22.9` / npm `8.5.1`（不用于 Contact）；Contact 使用 `/opt/node-v24.17.0-linux-x64`；Nginx `1.18.0 (Ubuntu)` |
| Nginx 来源文件及备份 | 当前来源 SHA-256 `22efa5…d3e`；旧配置保存在 `20260819T190447Z-v1.2.0-predeploy/00-flourishculturekol.com.conf`，SHA-256 `77688b…a1c8` |
| web root 备份路径 | 发布前备份 `20260819T190447Z-v1.2.0-predeploy/web-root`；首次静态快照 `20260819T192328Z-v1.2.0-static-d8389ae`；最终刷新快照 `20260819T230115Z-v1.2.0-static-6087ae5`，51 文件、根 `0700`、清单 `0600` 且全量 `OK` |
| Contact 前一版本与当前 release 路径 | 当前诊断 release `/opt/flourish-contact/releases/20260819T202836Z`；保留前一次 release `20260819T191356Z` |
| systemd active 与 loopback health | Nginx、Contact、Review production/staging 均 active/enabled；Contact 仅监听 `127.0.0.1:3101`；本机 TLS/SNI www/API/Review 为 `200/200/200`，Review root `302` |
| SMTP 身份验证 | 已确认；启动预检日志为 `smtp_authentication_accepted`，未回显凭据 |
| Turnstile 失败边界 | 已确认；合成无效令牌返回 `403`；历史真实 widget 请求 `471c2340-0dab-4269-bb4e-7124a7a1e5ee` 返回 `invalid-input-secret`，均未进入 SMTP；用户重建配置后的成功路径仍未确认 |
| 公开静态/API/安全头/哈希 | 已确认；服务器内完整发布脚本与本机独立直连检查均通过，82/82 Node 测试和四视口 Chrome QA 通过 |
| Brand 收件箱及 Reply-To | 未确认 |
| Creator 收件箱及 Reply-To | 未确认 |
| `/review/` 发布后回归 | 已确认 health `200` 与 root `302`；未使用登录凭据做受保护页面内容验收 |
| 远端 `main` 读回 | 已读回并在本地通过 `94cb2ab` 合并其独有历史；最终非 force push 未执行 |
| GitHub Pages 删除读回 | 未确认 |
