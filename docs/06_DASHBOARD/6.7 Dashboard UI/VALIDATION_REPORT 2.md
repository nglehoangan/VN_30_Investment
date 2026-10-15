# M6.7 validation report

## Final result

All required commands pass in the final recorded runs. This does **not** satisfy the milestone completion gate: UI-CR-01 and UI-CR-02 remain Major upstream limitations. M6.8 functionality implemented: NO.

Validation used Node 22.23.2 (temporary installation), pnpm 10.34.5, Next 16.3.4 and disposable SQLite databases. No real portfolio data was modified. Commands ran sequentially; targeted rechecks followed failures. Counts overlap across suites and must not be added together.

| Command | Exit code | Result | Tests passed | Evidence |
| --- | --- | --- | --- | --- |
| `pnpm lint` | 0 | PASS | N/A | [recheck-01-pnpm-lint.log](validation-evidence/recheck-01-pnpm-lint.log) |
| `pnpm typecheck` | 0 | PASS | N/A | [final-typecheck.log](validation-evidence/final-typecheck.log) |
| `pnpm test` | 0 | PASS | 724 | [03-pnpm-test.log](validation-evidence/03-pnpm-test.log) |
| `pnpm test:portfolio` | 0 | PASS | 136 | [04-pnpm-test-portfolio.log](validation-evidence/04-pnpm-test-portfolio.log) |
| `pnpm test:integration` | 0 | PASS | 137 | [05-pnpm-test-integration.log](validation-evidence/05-pnpm-test-integration.log) |
| `pnpm prisma validate` | 0 | PASS | N/A | [06-pnpm-prisma-validate.log](validation-evidence/06-pnpm-prisma-validate.log) |
| `pnpm prisma migrate status` | 0 | PASS | N/A | [07-pnpm-prisma-migrate-status.log](validation-evidence/07-pnpm-prisma-migrate-status.log) |
| `pnpm build` | 0 | PASS | N/A | [08-pnpm-build.log](validation-evidence/08-pnpm-build.log) |
| `pnpm test:e2e` | 0 | PASS | 6 | [recheck-03-pnpm-test-e2e.log](validation-evidence/recheck-03-pnpm-test-e2e.log) |
| `pnpm test:decision` | 0 | PASS | 218 | [recheck-04-pnpm-test-decision.log](validation-evidence/recheck-04-pnpm-test-decision.log) |
| `pnpm test:workflow` | 0 | PASS | 74 | [recheck-05-pnpm-test-workflow.log](validation-evidence/recheck-05-pnpm-test-workflow.log) |
| `pnpm test:dca` | 0 | PASS | 54 | [recheck-06-pnpm-test-dca.log](validation-evidence/recheck-06-pnpm-test-dca.log) |
| `git diff --check` | 0 | PASS | N/A | [recheck-08-git-diff---check.log](validation-evidence/recheck-08-git-diff---check.log) |
| `pnpm test:ui` | 0 | PASS | 35 | [recheck-07-pnpm-test-ui.log](validation-evidence/recheck-07-pnpm-test-ui.log) |

## Failure history and remediation

Original results remain in `validation-evidence/initial-sequential-results.json`; earlier interrupted and completed attempts remain under `validation-evidence/initial-run/`. Recheck results are retained separately. The final `results.json` selects the latest result for each command.

- TypeScript initially encountered duplicate generated `.next/types/* 2.ts` declarations. Generated duplicate cache files were removed; after the subsequent Next builds regenerated the cache, `pnpm typecheck` passed without changing source type checking or tsconfig exclusions.
- Heavy immutable-artifact fixtures exceeded existing 20-second test limits during some attempts. Vitest now uses one worker. The full suite passed 724 tests; unchanged decision and workflow tests subsequently passed 218 and 74. No assertion or test timeout was weakened to obtain these passes.
- Mobile E2E initially caught document overflow from long reason strings. The main content now wraps long strings. Both 1440px and 390px layout tests pass; wide tables scroll within their own labelled regions.
- Early full-suite testing caught an obsolete synchronous placeholder-shell test. It now validates the asynchronous server-read dashboard and its sanitized blocked state.
- Build succeeds with existing filesystem dependency tracing warnings. These remain documented technical debt rather than being suppressed.

## UI and authority verification

UI tests cover exact decimal preservation, the seven unchanged economic states, BUY plus REQUIRES CASH ACCUMULATION, HOLD CASH, proposal/transaction separation, all five review types, annual NO POLICY CHANGE, event escalation, real marginal substitution evidence, empty screens, and concurrent form submission prevention.

Server integration tests cover preview without persistence, confirmed posting, repeat submission, signature tampering, authority injection, expiry, stale revision, append-only reversal, server-computed gross trade amount, oversell rejection, untrusted projection data and mandatory local origin validation. Architecture tests prohibit UI calls to investment calculators and formal-output assignments; the existing transitive client/server boundary checks pass.

Six browser tests cover holdings → decision → score lineage; monthly HOLD CASH and marginal/proposal inspection without ledger writes; occurred contribution → preview → explicit confirmation → authoritative holdings; desktop and mobile routes; and the existing shell/error/network check. All data is visibly SYNTHETIC_TEST and confined to the smoke test's owned temporary database.

## Actual visual review

The Browser skill was consulted. Its runtime tools were unavailable in this session, so the repository's Playwright Chromium workflow captured real rendered screens. I inspected all 42 PNGs using image viewing tools, grouped into desktop/mobile contact sheets, and inspected larger crops of scorecard and marginal-trace screens. This is screenshot-based manual inspection, not an interactive browser accessibility certification.

Twenty routes were reviewed at each width: dashboard, holdings, VN30, ranking, scorecard, decision, DCA proposal, monthly/weekly/quarterly/annual/event reviews, journal, transaction history, transaction form, audit, data status, risk, performance and settings. Confirmation adds one image per width. Original full-page files are in `visual-evidence/`.

| Review area | Observed result / limitation |
| --- | --- |
| Navigation | Grouped desktop sidebar and mobile grid remain visible; active destinations distinguished. Browser lineage workflow resolves holding, decision and score links. |
| Responsive layout | Panels stack and metrics use two columns on mobile; no document-level horizontal overflow. Wide tables require horizontal scrolling inside their labelled regions. |
| Forms and confirmation | Labels and explicit preview/confirm/back controls remain visible at both widths. Confirmation presents transaction fields and authoritative posting legs; preview does not write. |
| Status and stale/blocked warnings | Current actionability BLOCKED/Unavailable, missing reconciliation/freshness, synthetic scope and historical analytical context are visible in text. No arbitrary age threshold is invented. |
| Decision and execution | Economic BUY and execution REQUIRES CASH ACCUMULATION are separately labelled; no trade-now action is offered. |
| HOLD CASH | Monthly HOLD CASH is presented as a valid outcome; allocation proposal remains visibly distinct from executed transaction. |
| Audit | Artifact links and methodology evidence are visible; source references are routed to read-only detail pages. |
| Empty/error/loading | Empty screens and sanitized blocked read errors are covered by component tests. Missing benchmark/freshness/current valuation are visibly Unavailable in screenshots. Transient loading and the generic error boundary were code/test reviewed; no dedicated browser screenshot is claimed for those transient states. |
| Remaining polish | Dense ranking/audit catalogs and score evidence create long pages. Narrow tables wrap IDs and reason strings heavily. This is one Minor presentation finding; bespoke compact evidence layouts and pagination remain technical debt. |

Status uses text as well as color. Forms have labels and associated errors; tables have focusable labelled scroll regions; the shell includes a skip link, headings and visible focus. Keyboard/screen-reader certification and additional browsers were not performed.

## Findings and gate

Critical unresolved: 0 identified in supported implemented paths. Major unresolved: 2 (current source/snapshot composition and production workflow initiation/handoff). Minor unresolved: 1 (dense evidence-table presentation). Deferred requests: UI-CR-03. Technical debt: bounded catalogs without pagination, full-history ledger reconstruction, generalized evidence layouts and existing build tracing warnings.

**M6.7 completion gate: NOT MET (Major must be zero). M6.8 functionality implemented: NO.**
