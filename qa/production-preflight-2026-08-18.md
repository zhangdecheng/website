# FLOURISH CULTURE Production Preflight — 2026-08-18

## 结论

状态：**未完成（只读服务器检查等待火山引擎重新认证）**。

公开网络部分已于 2026-08-18 10:13–10:16 UTC 实测。域名仍指向历史生产 IP，
主页与 `/review/` 行为和上次审计一致，可以继续定位服务器；但火山引擎 CLI 的
现有 OAuth 刷新令牌已失效，因此尚未读取实例、Nginx、Node、磁盘、权限或 systemd
状态。按照发布硬门，在这些项目确认前不得写服务器或部署。

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
- `ve sts GetCallerIdentity`：失败；现有 OAuth refresh token 无效，需要重新登录。
- 已启动 `ve login --remote --region cn-beijing`，等待用户在浏览器完成登录并返回
  Authorization code。
- 因身份验证未完成，当前账号、租户、实际实例区域与实例 ID 均为**未确认**。

## 未确认的服务器事实

以下项目尚未执行或读取，不能据此部署：

- 主机名、OS/内核与实际实例 ID
- Node.js/npm 版本（必须确认 Node.js >= 20）
- Nginx 版本、`nginx -T` 全量来源文件与真实 hostname server block 所属文件
- `/review/` location 与证书配置所在文件
- Nginx、`tiktok-review-agent` 等 systemd 服务状态
- `/var/www/flourishculturekol.com` 与 `/var/backups/flourishculturekol.com` 的 owner/mode
- `/var`、`/opt` 可用磁盘
- 当前执行身份是否可创建备份、安装 systemd unit 与最小修改 Nginx
- 本地 Host header 方式的 `/review/healthz` 结果

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
```

公开证书保存于 `/private/tmp/flourish-cert.pem`，没有读取或保存私钥。

## 当前停止条件

在火山引擎身份、目标实例、Node 20、Nginx 来源文件、`/review/` 健康、磁盘、权限与
备份路径全部读回前，生产部署保持**未完成**。不得把历史 IP 或历史备份记录当作当前
服务器状态。
