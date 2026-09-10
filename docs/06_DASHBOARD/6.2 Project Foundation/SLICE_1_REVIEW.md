# M6.2 Slice 1 — Implementation review

Date: 2026-09-10. Status: **Implemented — ready for ChatGPT Project/user review**. Implementation authorization received; acceptance approval not assumed.

## Result and files

Local Next App Router shell renders product heading and explicit no-data state. No financial facts, calculations, provider/AI calls, DB, mutation endpoints or feature navigation were added. Both development and production bind to 127.0.0.1. Git initialized locally, no commit/staging/remote/push.

Changes within the prompt allowlist:

- package.json, pnpm-lock.yaml, .nvmrc: pinned toolchain and scripts.
- tsconfig.json, next-env.d.ts, next.config.ts, eslint.config.mjs, vitest.config.ts: strict TypeScript, Next lint configuration, deterministic DOM tests, alias @/* to src/*.
- app/layout.tsx, app/page.tsx, app/globals.css: minimal Vietnamese shell.
- tests/setup.ts, tests/unit/app-shell.test.tsx: semantic component smoke.
- scripts/smoke-app.mjs: real boot, bounded readiness, loopback/ownership check, process-group cleanup.
- .gitignore, .env.example, README.md, docs/PROGRESS.md and this report: safe local files, development instructions and handoff.

All existing approved baseline hashes match the preparation snapshot. Audit/plan/prompt were not changed in this slice. Source starts at repository root as planned.

## Toolchain choices and evidence

Node 22.23.2, pnpm 10.34.5; Next 16.3.4; React/React DOM 19.3.0; TypeScript 6.0.3; ESLint 9.39.5 with eslint-config-next 16.3.4; Vitest 5.0.0; jsdom 30.0.1; React Testing Library 16.3.3. Exact remaining direct dependencies are in package.json and the generated lockfile.

Registry metadata was read with npm view; dependencies were actually installed and verified with pnpm. Node 22.12.0 originally on the machine is below the selected jsdom engine requirement. Validation used Node 22.23.2 installed solely under `/private/tmp/vn30-slice1-runtime`; system/global Node was not changed. Users should switch their own version manager to .nvmrc before running commands. This temporary absolute path is not in project scripts.

TypeScript 7 conflicted with typescript-eslint's `<6.1.0` peer range; pinning 6.0.3 resolved it. ESLint 10 conflicted with the Next React/import/accessibility plugin peer ranges, so ESLint 9.39.5 is retained without peer overrides. The final dependency install has no peer conflict. See Minor M1 below for its lifecycle limitation.

Official references consulted: [Next installation](https://github.com/vercel/next.js/blob/canary/docs/01-app/01-getting-started/01-installation.mdx), [Vitest runtime requirements](https://github.com/vitest-dev/vitest/blob/main/README.md), and [ESLint support policy](https://eslint.org/version-support/). Package engines/peers from the installed versions take precedence over moving documentation branches.

Only sharp and unrs-resolver native preparation scripts are allowlisted. No blanket script approval. No unused financial, ORM, AI or chart dependencies.

## Validation evidence

All final commands used Node 22.23.2 and pnpm 10.34.5. Build/smoke disabled optional Next telemetry during validation.

| Check | Actual final result |
| --- | --- |
| pnpm install --frozen-lockfile | Exit 0; lockfile current |
| pnpm lint | Exit 0; zero lint warnings |
| pnpm typecheck | Exit 0 after moving .next and tsbuildinfo out of workspace; route types regenerated |
| pnpm test | Exit 0; 1 file, 1 behavioral component test passed |
| pnpm build | Exit 0; / and framework /_not-found statically generated |
| pnpm test:smoke | HTTP 200, heading, owned loopback listener, cleanup; exit 0 |
| node scripts/smoke-app.mjs --dev | HTTP 200, heading, owned loopback listener, cleanup; exit 0 |
| pnpm audit --json | Exit 0; 0 info/low/moderate/high/critical vulnerabilities (506 dependencies reported) |
| git check-ignore --no-index | Secret/SQLite sidecars/runtime data ignored; example/lockfile/migrations/fixture paths retained |
| git diff --check | Exit 0, but empty tracked diff because this repository has no commit/index entries |
| Supplemental whitespace/source scan | New source/config/docs checked separately; no trailing whitespace or secret-pattern matches |
| Baseline SHA-256 comparison | All existing baseline documents match preparation snapshot |

The sandbox initially blocked local bind; smoke checks passed with local execution escalation. No automatic approval rejection occurred. Initial typecheck/build failed on a removed Vitest esbuild option; config now uses the current defaults and all gates were rerun. Dev ownership initially checked only parent PID; corrected to owned process group and verified on dev plus production. These are fixed, not waived.

Review of application source and static browser output found no custom credentials, environment values, DB paths or financial fixtures. Pattern scans are supporting checks, not a claim of exhaustive secret detection across the user's machine.

## Five review perspectives

| Role | Assessment |
| --- | --- |
| Software Architect | PASS within Slice 1: one local Next shell, no layering shortcut; actual domain boundary enforcement remains Slice 2 |
| Senior TypeScript Engineer | PASS: strict types, clean type generation, pinned compatible peer ranges; ESM Vitest config; no type/build suppression |
| Data Engineer | PASS within scope: no persisted or fabricated financial data and no investment schema; database/precision proof remains Slice 4 |
| Security Reviewer | PASS within scope: dev/start loopback proven, no mutation/provider endpoints, secrets ignored, safe diagnostics and 0 audit advisories |
| QA Engineer | PASS: real boot checks and semantic component test; no live API; clean-cache gates and process cleanup verified |

Self-review only; does not substitute for external approval.

## Findings and limits

Critical unresolved: **0**. Major unresolved: **0** within Slice 1.

- **Minor M1 — ESLint lifecycle:** registry marks 9.39.5 unsupported, but the selected Next plugin suite does not support ESLint 10 peer ranges. No audit vulnerability reported. Retain pinned compatible version for this slice; review upgrade as soon as upstream plugins support it. Do not silently force peer resolution or migrate lint architecture.
- **Minor M2 — Smoke portability:** script uses macOS lsof/ps and POSIX process groups. Verified on this workspace only; Windows support is not claimed.
- Existing CR-03/04 baseline metadata/naming Minor findings remain untouched.
- No browser visual/E2E validation claimed; Playwright setup belongs to Slice 5. This slice proves HTTP boot and component behavior.
- Unit scope is intentionally one shell behavior; no meaningless test coverage target or empty-suite pass. DB integration, migration, numeric round-trip, validation/config/logger and architecture enforcement remain assigned to later slices.

## Handoff

Run the commands in README with the pinned runtime. Review the new files as additions (there is no previous Git commit). Approve Slice 1 separately before Slice 2. M6.2 as a whole is not complete and M6.3 has not started.
