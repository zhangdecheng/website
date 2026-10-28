# LEGAL-001 — /terms + /data-deletion + footer legal links

Source: /workspace/terms/legal-pages.zip (terms.html, data-deletion.html, footer-patch.md), approved by 张总 2026-10-28.

## Changes
- terms.html / data-deletion.html: page text verbatim. Only change: the inline `<style>` block was removed
  because production CSP is `style-src 'self'` (inline styles would be blocked); its rules
  (.legal-lang-switch, .legal-divider, .footer-legal) moved to styles.css.
- index.html footer: Terms + Data Deletion added to footer nav, plus `.footer-legal` row in footer-bottom.
  Homepage label is "Terms and Conditions" (not "&") because the approved and-word rule forbids `&amp;` in homepage body (test "homepage marks exactly the 14 approved and connectors").
- privacy.html footer: `.footer-legal` row with the three links (text unchanged otherwise).
- styles.css: `.footer-legal` (+hover/focus), `.legal-lang-switch`, `.legal-divider`.
- Nginx (server-side, not in repo): exact locations `= /terms`, `= /terms.html`, `= /data-deletion`, `= /data-deletion.html`
  with the same five security headers as `/privacy`; see nginx-00-flourishculturekol.com.conf.diff.
  Old SHA b4d2be40…602b → new abc360c7…3a0e.
- deploy-cloud-assistant.sh: pins updated; rollback no longer uses rsync --delete (restores snapshot, then removes only files/empty dirs added by this release).

## Pinned hashes
| file | sha256 |
| --- | --- |
| index.html | 9e7f7b10d4afc4abd131b0d573a4c5e0aa76cdf08ab92d9aa7012ec6ad18236d |
| privacy.html | dc4753d310fd74a973bae84f565bff136866dfcef989512691ef6fb2db4b85d1 |
| terms.html | 3711ba4c9f04b928663292e70360eab3279a1f70776bb147433ec625d5fd7f0b |
| data-deletion.html | 8f699151ccf7bc3916b07b7824d4d1fc7d0610d2616f2ccad48590472926f3e0 |
| styles.css | c0bf93984e3af00ff20cb91b7fd36393b89fbda56ff3d0ddf7784d4ddc926f63 |
| static zip | 6cf81e5d0ecdd2d627f3e64a4a83dc8d8c5f48d9b47137dbf1bc8512a69206ed |

## Local QA
- npm test 106/106; release:verify PASS (incl. 4-viewport Chrome QA, no console errors).
- browser-legal-qa.json: home/privacy/terms/data-deletion at 1440 and 390 under production CSP: 200, no horizontal overflow,
  footer legal links visible, click-through /privacy→/terms→/data-deletion→/privacy OK, no CSP errors on legal pages.
  (Homepage shows one pre-existing CSP block of the inline head script, unchanged by this PR.)
