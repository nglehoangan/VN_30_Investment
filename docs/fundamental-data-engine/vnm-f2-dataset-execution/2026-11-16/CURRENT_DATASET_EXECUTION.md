# VNM current-purpose dataset execution

Status: **PARTIAL / formal dataset binding BLOCKED**. This run does not close F2 or Step2.

A fresh SQLite database was created with the retained migration SQL, exercised through the actual Prisma repositories and application services, then deleted. The active database was never opened for writes and its SHA-256 is unchanged.

| Stage | Actual result |
| --- | --- |
| Retained expanded adapter | 294 observations validate; source/economic dimensions preserved. |
| F1 current valuation | Real VNM 2026-10-30 raw close 56,900 VND admitted and consumed with the previously qualified membership references. F1 remains closed. |
| Existing governed F2 route | Real retained H1/2026 TOTAL_ASSETS admitted using Standing Authority v4. One admission run/eight immutable raw captures. Exact source normalization matches consumer read-back. |
| Duplicate ingestion | No additional admission/raw rows. |
| Expanded governed F2 route | Zero expanded facts admitted. The active registry certifies a different adapter/schema; the new adapter cannot inherit this executable approval by provider identity alone. |
| Expanded SQLite read-back | All 294 observation payloads stored/read exactly as one hash-protected QUARANTINE event. Repeating it is idempotent. This is not canonical admission. |
| Current coverage | Separate adapter-available and actually admitted period/scope coverage in COVERAGE.json. The real v4 admission supplies only H1 TOTAL_ASSETS; no current Q3 governed completeness is asserted. The bounded list is not a complete M3 metric certification. |
| Intended scoring consumer | Actual PrismaScoringDatasets.readiness and authorize reject absent DI acceptance. A financial admission ID is correctly rejected as a DI acceptance. |
| Formal dataset/score | 0 DI acceptances, 0 fundamental snapshots, 0 scoring_dataset_binding rows, 0 scorecards. No fabricated records. |

The legitimate H1 admission is revoked at the end solely to exercise the record-revocation negative test. The disposable database is subsequently deleted. This is not a revocation of retained research, standing authority or live data.

## Exact unresolved dependencies

1. **Expanded admission executable contract is not bound.**
   Existing `VERSIONED_SOURCE_REGISTRY.json#/authorities/1` binds `retained-qualified-extraction-v1`, `unified-current-financial-plan-v1`, DIRECT_PDF TOTAL_ASSETS and exact code pins. The expanded adapter emits `retained-current-financial-admission-plan-v1`; it is a validation/handoff adapter, not a `FinancialIngestPlan` accepted by the v4 `qualifyFinancialPlan/verifyFinancialPlan/commitFinancialPlan` route. The new executable gate demonstrates this incompatibility and refuses promotion.

   Required engineering: implement/qualify the compatible governed admission handoff for the selected required observations, populate required original source roles/receipt/extraction metadata from retained catalogs, and validate its exact schema/code/version binding. Required authority: the existing standing-authority version control for material adapter changes; no new provider approval or per-fact receipt. `ADAPTER_VERSION_REVIEW_PACKET.json` is an unapproved exact comparison of the current registry and implemented adapter hashes, not a ready claim that registry registration alone finishes this integration. No source-data shortage has been established.

2. **Current-purpose scoring binding still lacks an executable compatible path and mandatory acceptance.**
   `scoring-readiness.ts::bindDIAcceptance` requires `FORMAL_AS_KNOWN_SNAPSHOT_REQUIRED`; `PrismaScoringDatasets.verified` requires `EXTERNAL_INDEPENDENT_DI_REVIEW_REQUIRED`. This DI consumer review is distinct from the closed U1 per-material/source-approval issue. `PrismaScoringDatasets.append` writes a binding atomically with a replay-valid scorecard. The current-only admission cannot be cast to historical AS_KNOWN, nor can a placeholder scorecard be inserted.

   Required engineering: compatible current-purpose dataset/coverage/consumer contract preserving current knowledge versus PIT, followed by an accepted dataset under the applicable DI contract. Required authority: existing dataset/assessment acceptance gates, not another financial source approval. The previously retained 23-assessment/M1/confidence requirements remain unchanged; this run does not adopt bands or approval identities. No formal ScoringEngine.score execution occurred.

These are implementation/contract boundaries, not requests for more financial PDFs or proof that retained sources are real. F1 membership, S1–S5 research closures, M3 weights, VNM17 status and production restrictions are unchanged.

## Evidence and reproducibility

- `run.mjs`: actual F1/F2 services, migrated isolated DB, read-back, duplicate, quarantine, revocation and intended consumer tests.
- `REAL_EXECUTION.json`: exact before/after row counts, values, transforms, errors and active DB fingerprints.
- `COVERAGE.json`: requested concept periods/scopes, with adapter availability separate from admission.
- `ADAPTER_VERSION_REVIEW_PACKET.json`: current versus proposed adapter binding; PROPOSAL_NOT_APPROVED.
- `VALIDATION.json`: scoped suites and deterministic rerun.

61 scoped TypeScript tests pass (including 21 existing standing-authority integration tests), plus 9 checks in the real-data runner. Typecheck remains NOT VERIFIED because of the previously observed compiler stall; no passing typecheck claim is made. Full-corpus reacquisition, live portfolio mutation and production activation were not performed.
