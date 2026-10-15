# Hero Scheme A — preview/staging（非生产）

- 授权：用户明确授权合到预览/staging，**禁止生产发布**
- 候选 SHA：`bfdf6d6b63644376ea5d1ebdb96f0fd84df377d2`
- 源 PR：https://github.com/zhangdecheng/website/pull/1
- Git 预览分支：`preview/hero-scheme-a`（已 push）
- 本机预览（共享 box）：http://127.0.0.1:8767/
- 工作树：`/workspace/website-team/website-hero-qa` @ 上述 SHA
- 截图：`desktop-1280.png`（1280）、`mid-900.png`（900）
- 未执行：`deploy-cloud-assistant.sh` / 生产 web root / Nginx 变更
- QA 约束仍以 `06-qa/FC-hero-scheme-a-qa-r01.md` 为准；观感核验交 Iris

已确认（源码）：`.hero-card img` / `.hero-card-live img` 为 `object-fit: cover` + `object-position: center 20%`。
