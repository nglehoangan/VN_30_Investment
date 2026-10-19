# Web app refactor and verification — 19 October 2026

The app now shares one financial freshness presentation between the strict and Policy B entry points. Their counters and deferred-member disclosures remain distinct. Dashboard primitives, broker presentation and historical investment artifacts have separate modules. TransactionForm imports only the small primitives module rather than the complete dashboard graph. Existing dashboard exports remain compatible.

A single route catalog in `src/ui/navigation.ts` supplies navigation, titles and supported detail routes. Hidden scorecard routes remain addressable, and unsupported detail paths still reject. The unused FoundationShell, duplicate `.gitattributes 2`, an identical local `.env 2.example` and seven empty local duplicate directories were removed. No retained financial evidence, historical sources, portfolio or methodology rules were deleted.

Optional manual research that cannot be verified is withheld with a visible warning. It no longer prevents reading a separately verified sealed financial snapshot. Its financial values and readiness are never substituted or promoted. A new integration test verifies this isolation against a real temporary SQLite database.

The smoke harness explicitly clears the optional broker file setting so that a developer's `.env.local` cannot contaminate the synthetic test database. Screenshots default to a disposable test directory; an explicit validation directory can retain them. Historical screenshot evidence accidentally produced by the initial smoke run was restored to its original committed bytes.

## Verification

Supported runtime: Node 22.23.2. Next.js layouts/pages and Server/Client Component guides were read from the installed package before editing. Prisma generation is run sequentially: concurrent lint/typecheck commands share the same generated directory. An intermediate generation race was corrected; final checks regenerate the client sequentially.

- Production build: PASS, including TypeScript and route generation.
- Dedicated typecheck: PASS.
- Lint and dependency boundaries: PASS (187 source modules).
- Prisma schema validation: PASS.
- Focused UI, routes, source-isolation and architecture tests: 85/85 PASS.
- API helper tests: 6/6 PASS.
- Production startup and Playwright: 12/12 PASS. Covers holdings/decision/score lineage, proposal inspection, explicit transaction confirmation, review blocking, desktop 1440px/mobile 390px, keyboard/form accessibility, provenance privacy and absence of external browser requests.
- Desktop dashboard and mobile holdings screenshots visually inspected; tables scroll within their container and document width remains bounded.
- Current SQLite integrity and foreign keys: PASS. All 30 reviewed financial admission rows remain present.
- Whitespace/diff checks: PASS.

Whole-project baseline before refactoring: 1,915 passed / 1,933 assertions, with 18 pre-existing failures in 10 historical financial evidence suites. The missing original PDFs/OCR were removed by the approved data cleanup; byte-freeze failures refer to earlier authorized debt-policy/test/AGENTS changes. Historical expectations were not rewritten, skipped or treated as successful. Final whole-project run: **1,919 passed / 1,937 assertions across 128 files**, with the **exact same 18 failures** as baseline and **zero new failures**. The exact failure comparison is recorded in `WEB_APP_REFACTOR_VERIFICATION_2026-10-19.json`.

## Limits

This work refactors presentation and isolates optional research failures. It does not authorize scoring, change investment calculations or resolve missing financial evidence. The 18 historical-source tests require reacquired exact originals or a separately reviewed change to their historical replay contract. The UI refactor does not manufacture those source bytes.

Reproduce with the supported Node runtime:

```sh
pnpm lint
pnpm typecheck
pnpm build
pnpm test
node --test api/sub-account.test.mjs api/token-session.test.mjs
node scripts/smoke-app.mjs --e2e
```

Run commands that invoke `db:generate` sequentially. Browser smoke requires permission to bind localhost and uses its own disposable database.
