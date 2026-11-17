# VNM governed current financial admission and dataset

Implemented and executed the new route against real retained VNM data in a disposable SQLite database: **68 admitted native financial facts, 8 immutable raw/proof captures, one current-purpose binding containing 34 current financial inputs**. Read-back equals source/normalization, duplicate admission/binding is idempotent, revocation blocks consumers. The live database remains unchanged.

This closes the documentation-only mapping/handoff gap for the tested scope. It does **not** certify complete F2/M3 financial coverage, approve DI/assessments/M1/confidence, create a scorecard, grant PIT, or activate production.

## Implemented path

- `src/infrastructure/source-admission/current-financial.ts`: converts the pinned mapping output into dimensioned facts and existing `CurrentValuationEvidence`, verifies active source roles/origins, ticker/security identity, native source/review/receipt pins and exact PDF hashes. Unsupported metadata and conflicts quarantine per observation. Exact receipt precision is preserved; canonical clock conversion uses a conservative millisecond ceiling. Ingestion uses the trusted clock, not a caller-supplied earlier knowledge time.
- `src/infrastructure/source-admission/current-dataset.ts`: reads admitted facts, checks exact concept/period/scope/vintage requirements, resolves raw-close price and carry-forward share references through trusted dependencies, persists a hash-bound current-purpose manifest, and replays lineage/integrity on consumption. Missing/ambiguous dependencies prevent binding; no placeholder facts are inserted.
- `prisma/proposals/current-financial-dataset-v1.sql`: append-only raw/admission/fact/dataset tables with FK and mutation guards, applied explicitly only to the disposable test DB. It is outside automatic production migrations; the approved main Prisma schema and legacy source code bindings are unchanged.

The new `current_financial_dataset` table is a real pre-scoring data binding, separate from the legacy `scoring_dataset_binding` that is appended atomically with an authorized scorecard. The consumer returns financial data and `readyForScoring=false`; it cannot replace the existing DI/scoring authorization path.

## Version authority and provenance

Latest successor: `VERSIONED_SOURCE_REGISTRY_V53.json`. The existing F1/F2 provider/source-principle approvals, source roles, normalization rules and original registry are preserved. Earlier development bindings remain audit records, not rewritten code hashes.

`VERSION_IMPLEMENTATION_AUTHORIZATION.json` captures the latest owner's explicit instruction to complete adapter/schema/code binding and governed fact admission. `OWNER_VERSION_IMPLEMENTATION_INSTRUCTION.txt` records that instruction. It authorizes this implementation/version binding, not personal inspection of each code byte, individual fact approval, the pending VNM17 proposal, DI, scoring or production. The owner's message timestamp is unknown/null; the receipt recording clock is separate. No new provider approval or per-PDF approval was requested.

The approved-version path automatically qualifies observations using pinned collector/extractor/review evidence. Request data cannot supply or replace the authority registry, mapping or metadata catalogs. v4 continues to reject the new adapter; the owner-authorized successor is explicitly supplied by isolated composition. No production wiring is added.

## Real-data scope

Retained consolidated Q3/2026 financial statements and their reclassified comparative columns supply balance sheet, income statement, fund, CFO, D&A, asset purchases, cash-interest and cash-tax observations. PDF physical pages 7/12 reuse matching JSON; only needed cashflow pages 13/14 were locally OCRed. Selected captions, dates, columns, units and values were visually checked. No financial PDF was downloaded, rewritten or replaced.

The targeted supplement is `data/manual-extracted-pdf/supplements/VNM-Q3-2026-current-core.json`. Its original PDF hash, full selected-page text/geometry, native lexemes, explicit outflow-magnitude transformations and review clock are retained. Source PDFKit emitted JBIG2 warnings; the selected rows and headers remained legible and were checked. Temporary rendered images/OCR scratch are disposable.

Reported YTD is never silently annualized or labelled TTM. Consolidated and standalone values remain separate. Parent-attributable profit is distinct from group profit; outflows are explicitly reported magnitudes. No maintenance CAPEX/WACC/normalized NOPAT assumption becomes a reported fact.

The real F1 loader returns 56,900 VND/share on 2026-10-30 from `GiaDongCua`, with existing membership/session/unit qualification. Shares are 2,089,955,445 under the separately approved carry-forward rule; the original coverage limitations and `sourceAdmission=false` remain visible in share lineage. This reference is not a new corporate-action admission or promotion of VNM17.

## Coverage versus scoring

`COVERAGE_VS_SCORING.json` compares this bound dataset with the retained RETAIL route used for VNM. Assets, equity, earnings, sales, cash generation, cash and inventory are present. Borrowing components are admitted, but their arithmetic sum is not automatically a qualified `REPORTED_BORROWINGS`/comprehensive-debt metric.

The remaining debt dependency is the existing `debt-contract.ts::evaluateDebtReceipt` population/current-portion proof binding. The diagnostic short + long sum is retained without fabricating zero current portions, exhaustive financing coverage or certified absence of other obligations. This is not evidence that another financial report is missing, and it does not reopen accepted S2 research.

Normalized analytical operands, historical metric windows, the existing 23-assessment dispositions, M1 and confidence decisions retain their approved contracts. Binding 34 native current inputs does not prove every M3 metric is ready. Full F2/scoring closure is not claimed.

## Reproduce and inspect

```sh
node node_modules/vitest/vitest.mjs run --config docs/fundamental-data-engine/vnm-current-admission-route/2026-11-16/validation.config.mjs
node docs/fundamental-data-engine/vnm-current-admission-route/2026-11-16/run.mjs
```

Use the supported Node 22 runtime. The runner explicitly uses an isolated DB and a recorded first-run trusted clock for deterministic replay, exercises real v5.3 authority and real F1/share loaders, records actual counts, then deletes the DB. Synthetic authority is confined to separately labelled unit/integration fixtures.

Latest evidence: `REAL_ROUTE_VALIDATION.json`, `CURRENT_DATASET_MANIFEST.json`, `VALIDATION.json`, `IMPLEMENTATION_ACCEPTANCE.json`. Typecheck is NOT VERIFIED: the compiler previously stalled and the local TypeScript library is marked dataless; no typecheck/build PASS is implied by runtime tests. No whole-production readiness claim is made.
