# M6.2 Slice 5 — Deterministic test foundation and browser smoke

2026-09-10. Slice 4 approved by user; Slice 5 implemented, ready for review. This is implementation self-review, not independent approval. Slice 6 and M6.3 have not started.

## Delivered

- Pinned @playwright/test 1.63.0 with Chromium 153.0.8010.12 (build 1243); production browser smoke in tests/e2e/shell.spec.ts.
- playwright.config.ts: Chromium, UTC, vi-VN, one worker, no retries, forbidOnly, bounded test/global timeouts and ignored local failure traces.
- scripts/smoke-app.mjs --e2e reuses the existing owned-server lifecycle: ephemeral loopback port, actual HTTP/startup readiness, lsof/PGID ownership validation before browser launch. It does not reuse an existing server. Browser and server groups are cleaned up on completion/signals, with bounded browser execution.
- Vitest fixed to UTC; unit/integration/architecture selectors preserved. Existing fixed Clock and sequence IdGenerator doubles remain test-only.
- Real SQLite fixture isolation test: independent paths, no shared records, independent disconnect/removal. No seed, provider call or application feature added.
- test:foundation integrates deterministic suites, production build, HTTP/browser smoke and invalid-config smoke. README documents installation and usage.

## Evidence

Runtime Node 22.23.2 / pnpm 10.34.5; existing application and Prisma versions unchanged. Browser downloaded explicitly to the local Playwright cache.

| Command/check | Actual result |
| --- | --- |
| pnpm install --offline --frozen-lockfile | PASS, unchanged lockfile |
| pnpm lint | PASS, zero warnings, 25-module boundary graph |
| pnpm typecheck | PASS after duplicate generated-cache repair |
| pnpm test | PASS, 149 tests / 11 files |
| pnpm test:foundation | PASS; repeats 149 tests, production build, browser and invalid config |
| pnpm test:e2e (within foundation gate) | PASS, 1 real Chromium test, no retries |
| Production HTTP smoke | PASS, HTTP 200/heading/startup hook and owned 127.0.0.1:54900 listener |
| Invalid config smoke | PASS, no readiness/HTTP success or canary leakage |
| pnpm audit --json | PASS, all severity counts 0 |
| Baseline SHA256 comparison | PASS, approved documents unchanged |

The browser verifies visible product heading and named empty-state region, explanatory text, reload persistence of the empty state, no uncaught page error and no external page request during the check. The browser test does not simulate financial workflows. Real SQLite migration/rollback/reopen and exact numeric proof remain part of the repeated 149-test suite. No test points at a production DB; the default data directory remains absent.

## Findings and review

| Severity/status | Location | Finding and resolution |
| --- | --- | --- |
| Major / fixed | .next/types/* 3.ts | Duplicate generated declarations reappeared and blocked typecheck. Preserved only numbered duplicates with canonical counterparts in a temporary directory; typecheck/build now pass. Source untouched. Origin of duplicate files is not established; avoid concurrent writers to Next output. |
| Minor / open | scripts/smoke-app.mjs | Listener/group checks require macOS/POSIX tooling; other platforms not validated. |
| Minor / open | package.json / pnpm-lock.yaml | Existing ESLint 9 lifecycle constraint and transitive prebuild-install deprecation persist. Audit reports zero vulnerabilities; previous scoped Prisma security overrides retained. |
| Minor / scope limit | playwright.config.ts | Chromium desktop only. Additional browser/device coverage belongs to later UI requirements. |

Critical/Major unresolved within Slice 5: 0. No tests skipped to make the gate pass.

| Review perspective | Assessment |
| --- | --- |
| Software Architect | Harness changes only; existing layer graph, schema and business scope unchanged. |
| TypeScript Engineer | Strict checks include Playwright config/test and isolation test; lint/typecheck pass. |
| Data Engineer | Independent real DBs prove no record sharing; UTC and existing deterministic fixtures retained; no production numeric schema/seed added. |
| Security Reviewer | Server ownership checked before browser use; external page traffic blocked/reported, traces ignored, private DB fixture behavior retained and dependency audit clean. |
| QA Engineer | 149 tests pass twice after harness changes; actual Chromium and production startup pass. Independent cleanup is asserted for DBs and owned processes are cleaned by the harness. |

No staging, commit or push. Existing dev server was not stopped. Untracked source/docs whitespace checked separately from git diff --check. Slice 5 awaits approval before Slice 6 final quality review; M6.2 is not complete.
