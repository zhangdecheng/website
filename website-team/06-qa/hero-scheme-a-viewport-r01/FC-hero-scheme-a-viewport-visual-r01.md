# Hero 方案 A 短视口目视核验 r01

- **预览**: http://127.0.0.1:8767/ （`website-hero-qa` @ `bb2076b` / PR #4 → `preview/hero-scheme-a`）
- **检查人**: Iris
- **结论**: **PASS（仅预览）** — 可维持预览；**不发生产**（未另授权）

## 核验

| 视口 | CTA 完整 | 左文案可读 | 三卡+图注 | 方案 A token |
|---|---|---|---|---|
| 1280×720 | PASS | PASS | PASS | 保持（cover / center 20% / 底渐变） |
| 1280×800 | PASS | PASS | PASS | 保持 |
| 1440×900（对照高视口） | PASS | PASS | PASS | 未观察到被短视口规则误伤 |

## 证据

- `chrome-1280x720.png`
- `chrome-1280x800.png` / `desktop-1280x800-hero.png`
- `chrome-1440x900.png`

## 备注

- 短视口下首屏可完整看到主 CTA，不再出现「半截按钮」。
- 视觉方向未改；遮罩强度维持用户已跳过的现状。
- 现网 Creator/锚点热修仍分轨，不在本 PASS 范围。
