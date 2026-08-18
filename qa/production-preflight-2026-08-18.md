# FLOURISH CULTURE Production Preflight — 2026-08-18

## 结论

状态：**未完成（服务器只读预检已完成；Node.js 版本触发发布硬停止）**。

公开网络部分已于 2026-08-18 10:13–10:16 UTC 实测。域名仍指向历史生产 IP，
主页与 `/review/` 行为和上次审计一致。火山引擎已于 2026-08-18 19:20–19:26 CST
重新认证，账号、区域、实例与 Cloud Assistant 在线状态已经由 API 读回。经用户明确
确认后，服务器内只读预检于 2026-08-18 11:48 UTC 完成：实际 Node.js 为
`v12.22.9`，低于发布要求的 20；因此当前不得上传、安装、改写 Nginx 或部署。

## 已确认事实

### DNS 与当前生产目标

| 检查项 | 实测结果 |
| --- | --- |
| `A flourishculturekol.com` | `150.5.135.196` |
| `A www.flourishculturekol.com` | `150.5.135.196` |
| 历史目标是否仍匹配 | 是，两条 A 记录均匹配 `150.5.135.196` |

### HTTP/HTTPS 行为

| URL | 实测结果 |
| --- | --- |
| `https://www.flourishculturekol.com/` | HTTP/2 `200`, `server: nginx`, `content-length: 24685` |
| `https://flourishculturekol.com/` | HTTP/2 `200`, `server: nginx`, `content-length: 24685`；当前未重定向到 www |
| `http://www.flourishculturekol.com/preflight?probe=1` | `301` → `https://www.flourishculturekol.com/preflight?probe=1` |
| `http://flourishculturekol.com/preflight?probe=1` | `301` → `https://flourishculturekol.com/preflight?probe=1`；当前仍保留 apex 主机 |
| `https://www.flourishculturekol.com/review/healthz` | HTTP/2 `200`, JSON |
| `https://www.flourishculturekol.com/review/` | HTTP/2 `302` → `/review/login` |

www 与 apex 两份首页正文实测完全相同：

```text
bcc48110f2ab0b1f786489426898a6580069dd631955c41c5f337dc90d21947c  /private/tmp/flourish-www.html
bcc48110f2ab0b1f786489426898a6580069dd631955c41c5f337dc90d21947c  /private/tmp/flourish-apex.html
```

捕获的当前首页 HTML 标题为 `FLOURISH CULTURE | Global Influencer Marketing`。
本次正文扫描当前未查到 `<link rel="canonical">`。首页响应头捕获中当前未见
Content-Security-Policy、X-Content-Type-Options、Referrer-Policy、
Permissions-Policy 或 X-Frame-Options；这只是本次响应证据，不代表未检查的路径。

### TLS 证书

| 字段 | 实测结果 |
| --- | --- |
| Subject | `CN=flourishculturekol.com` |
| Issuer | Let's Encrypt `YE2` |
| SAN | `flourishculturekol.com`, `www.flourishculturekol.com` |
| Not Before | `2026-08-10 17:37:15 UTC` |
| Not After | `2026-11-08 17:37:14 UTC` |
| SHA-256 fingerprint | `C8:FE:7F:F2:E1:7F:11:A5:48:F0:2C:C1:F4:7A:76:F8:6A:7A:36:4C:5C:85:9E:E2:C8:0D:9A:E2:52:F0:87:1E` |

### 火山引擎访问状态

- `ve` 路径：`/Users/digua/.local/bin/ve`
- CLI 版本：`1.0.47`
- `ve sts GetCallerIdentity`：成功；账号 `2103632597`，身份类型 `Account`，
  TRN `trn:iam::2103632597:root`。
- 已枚举 API 返回的六个 ECS 区域，并逐区切换 profile 后核对每次回包的实际 Region。
- 只有 `cn-hongkong` 返回公网 IP `150.5.135.196`，且只返回一个实例：
  `i-yeo9geadc0plsv0abgv0`（实例名 `ECS-1kel`，主机名 `webhkhome`）。
- 实例状态 `RUNNING`，可用区 `cn-hongkong-a`，镜像标识为 Ubuntu 22.04 64 bit，
  规格为 2 vCPU / 4 GiB，删除保护已开启。
- Cloud Assistant 状态 `Running`，客户端 `v1.12.0`，Linux 内核报告
  `5.15.0-100-generic`，查询时最近心跳为 `2026-08-18T11:25:37Z`。
- 本地 profile 在跨区查询后已读回恢复为 `cn-beijing`。

第一次把 `--region` 放在 API 命令后的查询被 CLI 忽略，所有回包仍标记
`cn-beijing`；该轮结果已判为无效，没有用来判断实例是否存在。上述结论仅来自后来
逐次切换 profile 且回包 Region 与查询区域一致的有效结果。

### 服务器实例内只读预检

| 检查项 | 2026-08-18 11:48 UTC 读回结果 |
| --- | --- |
| 执行身份 | `uid=0(root) gid=0(root)` |
| hostname / OS / kernel | `webhkhome` / Ubuntu `22.04.5 LTS` / `5.15.0-100-generic x86_64` |
| Node.js | `/usr/bin/node`，`v12.22.9`；**低于要求的 20** |
| npm | 路径 `/usr/bin/npm`；`npm --version` 在 5 秒边界内超时，准确版本未确认 |
| Nginx | `/usr/sbin/nginx`，`1.18.0 (Ubuntu)`；`nginx -t` 成功 |
| systemd | `nginx` 与 `tiktok-review-agent` 均 loaded/active/running；`flourish-contact` 不存在且未运行 |
| 站点目录 | `/var/www/flourishculturekol.com` 为 `root:root 755` |
| 备份根目录 | `/var/backups/flourishculturekol.com` 为 `root:root 755` |
| Contact 目标 | `/opt/flourish-contact`、`/opt/flourish-contact/current`、`/etc/flourish-contact.env`、Contact unit 均未找到 |
| 磁盘 | `/dev/vda2` 30G，总用量 21G，可用 8.0G，72%；`/var` 与 `/opt` 在同一文件系统 |
| 监听端口 | Nginx 监听 IPv4/IPv6 的 80/443；当前没有 3101 监听 |

备份根目录下当前读到四个时间戳目录：`20260625-114135`、`20260625-135253`、
`20260626-000044`、`20260626-113529`。这只确认目录名存在，尚未核对其内容、完整性或
是否可作为本次回滚源。

### 实际 Nginx 拓扑

- FLOURISH 的实际来源文件为
  `/etc/nginx/conf.d/00-flourishculturekol.com.conf`；`nginx -T` 与语法检查均成功。
- 当前 HTTP server 同时接收 apex/www，并用
  `return 301 https://$host$request_uri` 跳回原 hostname。
- 当前 HTTPS server 同时接收 apex/www，web root 为
  `/var/www/flourishculturekol.com`，证书覆盖两个 hostname，TLS 限制为 1.2/1.3。
- `/review` 精确跳转到 `/review/`，`/review/` 代理到 `127.0.0.1:8787/`。
- 另有 `/review-staging` 与 `/review-staging/`，代理到 `127.0.0.1:8788/`；后续修改
  必须原样保留这组此前未记录的生产路由。
- 当前未配置 `/api/contact`，首页 location 使用 SPA fallback。
- 当前 FLOURISH server block 未设置本次计划中的五项页面安全响应头。
- 同一 Nginx 进程还加载 8080 自动代理、`temu-skill.zdc.sh.cn` 和
  `group-message.zdc.sh.cn` 配置；它们不属于本次修改范围。

本机 HTTP 探针
`http://127.0.0.1/review/healthz`（Host 为 www）返回 `301` 到同域 HTTPS；这只证明
HTTP 跳转规则生效，**不能**证明 8787 upstream 在本机直连路径健康。公开 HTTPS
`/review/healthz` 的 200 结果仍然有效；本机 TLS/SNI 直连需另行确认。

### Cloud Assistant 调用证据

| 调用 | Invocation ID | 结果 |
| --- | --- | --- |
| 首次整段只读预检 | `ivk-yet4b9txzm8vwwljhgjp` | `Timeout` / `TaskExecutionTimeout`，无输出，未改变服务器 |
| 拆分后的有界基础预检 | `ivk-yet4c5m7ikec6i60j8ke` | `Success` / exit `0`，11:48:07–11:48:26 UTC |
| 拆分后的 Nginx dump | `ivk-yet4c61jam9lu09pna2h` | `Success` / exit `0`，11:48:07–11:48:15 UTC |

提交给 Cloud Assistant 的三份脚本只在本机临时目录保留，SHA-256 分别为：

```text
d648d7ccc6485e5cfe75f88ca2b3c7d1f421f97224df4a14ffe00886677da228  flourish-readonly-preflight.sh
3cf6c1dd0f234aacba1126a219733529a622060fe2287d4c33785387f556ee28  flourish-readonly-preflight-bounded.sh
52155c44e131f0642a9599ca7480c9ff4c3d0592af7027b289e251a34a0b0526  flourish-readonly-nginx-dump.sh
```

Nginx 私钥路径在保存证据时已脱敏；没有读取私钥内容。

## 仍未确认的服务器事实

以下项目仍缺少直接证据，不能据此继续部署：

- 可供 Contact 服务使用且不会替换系统 Node 的 Node.js >= 20 运行时路径；
- npm 的准确版本及其超时原因；
- `tiktok-review-agent` 与 8788 staging 进程是否依赖当前 `/usr/bin/node`；
- 通过 `--resolve` 和有效 SNI 发起的本机 HTTPS `/review/healthz` 结果；
- FLOURISH Nginx 来源文件的 owner/mode/SHA-256；
- 四个历史备份目录的内容、哈希与实际可回滚性；
- Turnstile、SMTP 与 Contact security secret 的受保护安装状态。

## 已执行命令

```bash
curl -fsS -D /private/tmp/flourish-www.headers https://www.flourishculturekol.com/ -o /private/tmp/flourish-www.html
curl -fsS -D /private/tmp/flourish-apex.headers https://flourishculturekol.com/ -o /private/tmp/flourish-apex.html
curl -fsSI https://www.flourishculturekol.com/review/healthz
curl -fsSI https://www.flourishculturekol.com/review/
curl -sSI 'http://flourishculturekol.com/preflight?probe=1'
curl -sSI 'http://www.flourishculturekol.com/preflight?probe=1'
dig +short A flourishculturekol.com
dig +short A www.flourishculturekol.com
shasum -a 256 /private/tmp/flourish-www.html /private/tmp/flourish-apex.html
openssl s_client -showcerts -connect www.flourishculturekol.com:443 -servername www.flourishculturekol.com
openssl x509 -in /private/tmp/flourish-cert.pem -noout -subject -issuer -dates -fingerprint -sha256
ve sts GetCallerIdentity
ve ecs DescribeRegions
ve ecs DescribeInstances --EipAddresses.1 150.5.135.196 --MaxResults 100
ve ecs DescribeCloudAssistantStatus --InstanceIds.1 i-yeo9geadc0plsv0abgv0 --PageNumber 1 --PageSize 10
```

公开证书保存于 `/private/tmp/flourish-cert.pem`，没有读取或保存私钥。
服务器内只读命令由以上三个已记录的 Cloud Assistant invocation 执行；完整脚本保留于
本机 `/private/tmp`，没有写入仓库或服务器。

## 当前停止条件

火山引擎身份、目标实例和主要服务器拓扑已经确认，但实际 Node.js 为 EOL 的
`v12.22.9`，且低于服务声明的最低版本 20。这已触发发布硬停止。为避免影响现有
`/review/` 与 `/review-staging/`，不得直接替换 `/usr/bin/node`；必须先确认现有服务
运行时依赖，再选定并验证一个隔离的受支持 Node.js 运行时。任何新的 Cloud Assistant
`RunCommand` 仍须先展示完整命令并取得明确确认。生产部署保持**未完成**。
