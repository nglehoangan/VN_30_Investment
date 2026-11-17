# VNM F2 coverage resolution

The two requested coverage handoff gaps are resolved for the selected current-purpose workflow. This does not certify a complete formal M3 scoring dataset or activate production.

## Reported borrowings

`REPORTED_BORROWINGS = 8,482,073,875,397 VND` at 2026-09-30, consolidated: short 8,384,686,375,137 plus noncurrent long 97,387,500,260. See `DEBT_SOURCE_REVIEW.json` and the persisted, replayed receipt in `DEBT_QUALIFICATION.json`.

Retained Q3 source evidence: balance sheet physical page 10; note 15 pages 52–53; liability notes page 55. The existing `debt-contract.ts` and `current-portion-presentation-v1.json` accept a separately undisclosed current portion as null when short/noncurrent presentation is verified. No numerical current-portion adjustment or assumed zero is used. Reported borrowing population is qualified; comprehensive financial debt remains unverified. The 124,306,352,739 VND opaque payable and UNASSESSED materiality are preserved, not silently treated as debt or zero.

## Historical and derived inputs

`RETAINED_ADMITTED_HISTORY.json` preserves the exact existing admission body and hash: 65 previously qualified canonical VNM facts. It is stored as immutable proof in the isolated database, referenced by the enrichment binding and returned to the consumer. No historical source acquisition or requalification occurred.

`METRIC_COVERAGE_AND_WINDOWS.json` connects:

- Four annual 2022–2025 accepted S1 ROIC calculations and ranges; arithmetic replay uses the existing metric engine. Q3/TTM assessment and incremental N/R remain intact.
- Annual 2022–2025 reported CFO/group-profit diagnostics and 2023–2025 reported group ROE. These are explicitly not normalized common-equity metrics.
- Three-year annual consolidated revenue CAGR, 2022 to 2025, using the existing growth calculator and exact endpoint identities. No five-year endpoint is invented.
- Standalone FY2025 CFO minus asset purchase payments and consolidated nine-month 2026 cashflow diagnostic, 6,434,314,662,197 VND; neither is relabelled normalized FCFE.
- Accepted S2 closure and retained sensitivities; S5 parent-equity scenarios, assumptions, expected returns and MOS disposition with original source pins. Group ROIC and parent valuation scopes remain distinct.

All 19 executable metric rows have dispositions: 3 bank-only rows are not applicable; the remaining conditional/cross-check metrics use supported calculations, accepted research alternatives, or explicit N/R. Exact normalized ROE/CFO conversion, comprehensive net debt/normalized EBITDA, action-adjusted EPS CAGR and incremental ROIC are not manufactured. Optional valuation cross-check points remain N/R while the accepted primary S5 valuation is bound. These are retained analytical limitations, not a renewed request for source reports or reopening closed research.

## Executable proof

`run.mjs` uses the actual version-6 registry, retained VNM sources, real F1 market service and retained share carry-forward evidence. Only test database initialization uses the fixture. The fixture's synthetic market/authority ports are replaced in the real demonstration.

Real isolated counts before → successful binding: admissions 0→1; financial facts 0→69 (68 native + qualified borrowing aggregate); raw/proof blobs 0→11; current datasets 0→1; enrichment bindings 0→1. Consumer returns 34 current native inputs, the qualified aggregate, 65 history facts and the research metric bundle. Repeated ingestion/binding does not add rows. A subsequent negative missing-input run adds a second admission only, never an accepted dataset.

The enrichment is additive and points to the immutable parent dataset; it is not a fabricated legacy scoring binding. Legacy DI acceptance, scoring bindings and scorecards remain zero. Current-purpose consumer replay, source hashes, record revocation, purpose, ticker and economic cutoff checks remain enforced. Historical PIT stays NOT_QUALIFIED; CURRENT_ONLY is not converted into PIT. VNM17 is not promoted.

## Validation and remaining boundaries

See `VALIDATION.json`, `TEST_RESULTS.json` and `REAL_EXECUTION.json`: 78/78 scoped tests, real readback, deterministic replay, idempotence and nine real-path negative checks. Original source PDF and active database are unchanged. Proposed SQL runs only in the disposable database; no live migration or portfolio mutation.

A full TypeScript typecheck is not established in this environment (the retained compiler package stalled in prior validation). Runtime/transformation tests pass; this is not a typecheck PASS claim.

No additional user-supplied financial information is required for these two bounded coverage deliverables. Formal scoring authority, DI/M1/confidence/assessment gates and production activation remain separate and unchanged. No numerical scoring points are issued by this work.
