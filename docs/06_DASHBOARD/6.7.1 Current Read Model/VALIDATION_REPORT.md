# M6.7.1 validation report

## Result

All required commands pass. Full suite: 739 tests across 36 files. Integration suite: 149. Dedicated current/readiness suite: 15 (12 server/integration cases and 3 UI cases). Browser suite: 8. Counts overlap and must not be added together.

Baseline: d9e05f8627a551f0f63309cae695e3369e2b69ae. Node 22.23.2, pnpm 10.34.5, Next 16.3.4. All database validation uses owned disposable SQLite databases; browser source datasets are also owned test files. No real portfolio database or configured production source was modified. Smoke tests override inherited source-file configuration so external local data is never used as a test target.

| Command | Exit | Result | Tests passed | Evidence |
| --- | --- | --- | --- | --- |
| `pnpm lint` | 0 | PASS | N/A | [log](validation-evidence/final-lineage/01-pnpm-lint.log) |
| `pnpm typecheck` | 0 | PASS | N/A | [log](validation-evidence/final-lineage/02-pnpm-typecheck.log) |
| `pnpm test` | 0 | PASS | 739 | [log](validation-evidence/final-lineage/03-pnpm-test.log) |
| `pnpm test:portfolio` | 0 | PASS | 136 | [log](validation-evidence/04-pnpm-test-portfolio.log) |
| `pnpm test:integration` | 0 | PASS | 149 | [log](validation-evidence/final-integration/01-pnpm-test-integration.log) |
| `pnpm prisma validate` | 0 | PASS | N/A | [log](validation-evidence/06-pnpm-prisma-validate.log) |
| `pnpm prisma migrate status` | 0 | PASS | N/A | [log](validation-evidence/07-pnpm-prisma-migrate-status.log) |
| `pnpm build` | 0 | PASS | N/A | [log](validation-evidence/final-lineage/04-pnpm-build.log) |
| `pnpm test:e2e` | 0 | PASS | 8 | [log](validation-evidence/final-recheck/05-pnpm-test-e2e.log) |
| `pnpm test:decision` | 0 | PASS | 218 | [log](validation-evidence/10-pnpm-test-decision.log) |
| `pnpm test:workflow` | 0 | PASS | 74 | [log](validation-evidence/11-pnpm-test-workflow.log) |
| `pnpm test:dca` | 0 | PASS | 54 | [log](validation-evidence/12-pnpm-test-dca.log) |
| `pnpm test:ui` | 0 | PASS | 35 | [log](validation-evidence/13-pnpm-test-ui.log) |
| `pnpm test:current` | 0 | PASS | 15 | [log](validation-evidence/final-lineage/05-pnpm-test-current.log) |
| `git diff --check` | 0 | PASS | N/A | [log](validation-evidence/final-lineage/06-git-diff---check.log) |

The first complete run passed all required commands. Final rechecks followed two additional edge cases, review-form navigation refinements, bounded source-file reading and strengthened monthly reference-data lineage. The final complete suite and build passed after the last application change. Separate final integration testing passed 149 tests. Original sequential results and all recheck logs are preserved. `results.json` selects the latest actual command result.

Development prechecks caught branded reference conversion, pure-core/schema dependency boundaries and a mixed-reference test fixture. These were corrected through nominal constructors, infrastructure-only schema parsing, action props and consistent source fixtures; boundary rules and investment formulas were not relaxed. Existing filesystem tracing warnings remain in successful build logs. No timeout/assertion weakening or database seeding into production was used.

## Required behavior evidence

| Case | Verification |
| --- | --- |
| A — valid accounting + prices | Existing M6.3 NAV = 2000 market value + 10000 cash + 0 receivables − 1000 payables = 11000; unrealized P&L = 1000; weight 0.181818181818. Fixture values are test-only. |
| B — one missing held price | Two-held-security case suppresses total NAV/market value; missing observation is explicit. No partial sum masquerades as complete NAV. |
| C — stale / unknown / conflicted prices | Expired source validity, missing policy, invalid latest quote, RAW/ADJUSTED distinction and duplicate same-as-of observations fail closed. Older valid quotes cannot silently replace invalid latest evidence. |
| D — effective sector change | New exclusive-end/start interval changes current sector, while the earlier captured model remains unchanged. Existing historical artifact regression tests pass. |
| E — blocked portfolio integrity | Independent reconciliation discrepancy, missing evidence and changed ledger watermark block actionability regardless of valid prices. |
| Accounting boundary | Changing price 20 → 30 changes market value and unrealized P&L; reconstructed state including quantity, cost basis and realized P&L is exactly unchanged; ledger count remains 2. |
| F — weekly | Server-resolved FORMAL command, no forced score/rank/valuation/decision refresh and no transaction. Complete provenance-backed weekly sections yield NO ACTION. |
| G — monthly | Posted contribution with approved test-only formal-path scorecards excluded for LOW confidence yields M6.6 HOLD CASH. Contribution remains embedded once in ledger cash. No trade is posted. |
| H — duplicate | Concurrent submissions plus retry persist one formal review, using M6.6's existing transactional identity uniqueness. |
| I — authority injection | Strict intent rejects price, cash, NAV, portfolio value, freshness, reconciliation, methodology, cutoff, state, risk status, disposition/outcome, candidate and allocation fields. No formal write follows rejection. |
| J — missing evidence | Missing analyst input/quarterly coverage returns INPUT REQUIRED; no fabricated review is persisted. |
| K — synthetic scope | SYNTHETIC_TEST source blocks production composition. Monthly artifacts must be FORMAL with registered approved methodology and current evidence. |
| L — arbitrary event | Unverified/unresolved free-text event reference returns INPUT REQUIRED; it cannot become formal event authority. |
| Monthly lineage | Different reference contents under the same version label are rejected; embedded scorecard reference data, taxonomy and source cutoff must match the selected dataset. |
| Annual | Complete evidence and NO POLICY CHANGE recommendation create a review without policy/methodology/ledger mutation. |
| File provider | Strict normalized schema rejects precomputed NAV; canonical identity, source/receipt/as-of fields and absence of configured source are tested. File reads have a fixed byte bound and always close the descriptor. |
| UI | Exact high-precision DTO strings render unchanged. Preview sends only intent. BLOCKED hides creation, READY requires a separate explicit click, and concurrent clicks share a lock. |

Architecture regression extends prohibited UI authority calls/assignments to NAV, market value, reconciliation, sector-risk authorization, actionability and review disposition. Existing M6.3–M6.6 domain/application modules and transaction confirmation were not changed. The new initiation service receives a read-only ledger port; only the M6.6 artifact adapter can persist formal reviews.

## Manual desktop/mobile review

No callable Browser or node_repl runtime is available in this session. Real Playwright Chromium screenshots were generated and inspected with image-viewing tools, including full images and larger crops of long pages. This is actual screenshot-based review, not a claim of comprehensive screen-reader or multi-browser certification.

48 PNGs are retained in `visual-evidence/`: 22 routes at 1440px and 390px, plus transaction confirmation and blocked review readiness at both widths. Manual inspection focused on the requested changed screens: Dashboard, Holdings, Data Status, Review Center, initiation, readiness, monthly DCA/proposal and monthly HOLD CASH detail. Initial model-screen captures and refreshed final initiation/readiness/catalog images were reviewed; larger crops confirmed the lower mobile data-status and HOLD CASH content.

| Surface | Observed result |
| --- | --- |
| Dashboard | CURRENT READ MODEL label; authoritative NAV, market value, unrealized P&L and ledger cash visible separately from historical decisions. Synthetic scope still blocks production actionability. |
| Holdings | Accounting cost/quantity/realized P&L remain distinct from current market rows and informational sector weights. Price as-of, provider, retrieval and source reference are visible in a scrollable table. |
| Data Status | Price/reference freshness, source/reference versions, reference as-of, cutoff and reconciliation are separate. Fundamental freshness remains Unavailable without evidence. |
| Review Center | Start Review link, event-first history and normal NO ACTION/HOLD CASH remain visible. Wide tables scroll within their labelled regions. |
| Initiation | Separate page presents minimal intent without forcing the user through the history table. Labels, select, date and preview control fit mobile width. |
| Readiness/error | BLOCKED, portfolio state, price state, INPUT REQUIRED and source reasons are visible. Synthetic data offers no Create formal review button. Positive READY/confirmation behavior is component-tested. Network failure handling was code-reviewed; no positive production browser screenshot is claimed. |
| Monthly DCA | Historical as-of context, proposal ≠ transaction, HOLD CASH, cash concepts, quantities and marginal trace remain distinct. Current trust strip does not replace historical proposal values. |
| Mobile | Two-column metrics and stacked panels; document overflow assertions pass for all 22 routes. Dense tables still require horizontal scrolling and wrap long IDs heavily. |

## Findings and scope

Critical unresolved: 0 identified. Major unresolved: 0 identified in the two requested implementation boundaries. Minor unresolved: 1 retained non-blocking dense-table presentation issue. Both M67-R1-M01 and M67-R1-M02 are remediated and ready for independent verification.

Operational readiness is conditional on genuine approved normalized sources, explicit validity policies, independent reconciliation and analyst evidence. Missing inputs remain blocked; tests do not authorize production. Full imports, benchmark/history, independent journal authoring, pagination and imported-inception source history remain deferred as documented in CHANGE_REQUESTS.md. Existing build tracing warnings and repeated full-history ledger reads remain technical debt.

M6.8 functionality implemented: NO. Work stops at M6.7.1.
