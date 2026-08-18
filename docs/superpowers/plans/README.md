# FLOURISH Site Refresh Plan Set

Confirmed specification: `docs/superpowers/specs/2026-08-18-flourish-site-refresh-design.md` (Feishu revision 362).

Execute the plans in this order:

1. `2026-08-18-flourish-contact-api.md`
2. `2026-08-18-flourish-site-ui-and-copy.md`
3. `2026-08-18-flourish-ai-assets.md`
4. `2026-08-18-flourish-production-release.md`

Each plan produces independently testable work. Do not start a later plan until the previous plan’s completion gate is green.

## Specification coverage

| Specification area | Implementation plan and task |
| --- | --- |
| Approved Hero, Who We Are, Services, Talent and About copy | UI Tasks 2–3 |
| Remove Talent form; Creator CTA selects unified form | UI Tasks 2 and 4 |
| Unified conditional Brand/Creator fields | UI Tasks 1, 3–5 |
| Original Privacy Notice and consent | UI Tasks 3 and 5 |
| Brand → Hannah, Creator → Irisa, fixed From/Subject/Reply-To | API Tasks 2–3 and 7 |
| Unicode email and header/body injection controls | API Tasks 2–3 |
| Form session, honeypot, Turnstile, IP/email rate limits and dedupe | API Tasks 4–8 |
| Redacted security logs and no data store | API Tasks 5, 7 and 9 |
| Two AI images only; existing image bytes unchanged | AI Tasks 1–4 |
| Canonical www, apex 301, CSP and Nginx proxy | Release Tasks 1 and 6 |
| Protected secrets, systemd service and service rollback | Release Tasks 2, 4–5 |
| Static backup/deploy and `/review/` preservation | Release Tasks 1, 6–7 |
| Real Brand/Creator inbox and Reply-To acceptance | Release Task 8 |
| Source reproducibility and GitHub Pages closure | Release Task 9 |
| Evidence-backed handoff and rollback record | Release Task 10 |

## Cross-plan invariants

- No production credential appears in source, test output, release archive, screenshot, documentation or chat.
- No real SMTP or Turnstile network request occurs in automated local tests.
- No pre-existing image file is modified.
- No production claim is made from HTTP 200 alone.
- GitHub Pages is not changed before the production and email acceptance gates pass.
- `/review/healthz` and `/review/` login behavior are checked before and after every Nginx/static switch.
