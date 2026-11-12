# Unified ingestion and admission architecture

## Shared infrastructure, separate validators

`app/server/unified-admission-services.ts` composes the existing CaféF market entry points and the financial entry point. `src/infrastructure/source-admission/registry.ts` implements hash-pinned source material, owner-policy provenance and trusted acceptance references. Code/source/schema/normalizer changes require a new qualified material version. Neither route accepts client-provided approval callbacks or activates itself through an HTTP route.

F1 keeps its existing normalizer, RetainedMarketAuthority, BoundaryLifecycle and PrismaBoundaryStore. Raw-to-normalized linkage, atomic batches, replay, quarantine, corroborating receipts and append-only revocation remain in the existing SQLite Market Boundary tables. See the preceding CaféF package for API identity, units and observation-time conventions. The combined workbench creates a new material hash at the new actual review time; it does not reseal the old report.

F2 uses `buildHybridAdmission` for existing structured/issuer verification, scope/period/definition/revision/conflict checks; `normalizeLexical` for native financial units; and `validateEvidence` for the explicit new current-use time contract. Raw/native cell extraction is reused from reviewed JSON/PDF artifacts; no OCR or new statement acquisition is invoked. Review flags become usable only inside an independently qualified, hash-bound bundle, not by submitting them in a request.

## Financial input contract

`FinancialIngestRequest` accepts input and extraction file pins, optional reviewed action pin, exact source material, ticker/security identity, economic cutoff, migration times and predecessor snapshot. The server stamps actual knownAt/ingestedAt. Retained inputs use existing HybridInput, original statements, qualified verification/mapping contracts and source bindings. Only raw/certificate bindings actually consumed by the ticker's inputs are mandatory; unrelated historical inventory entries are not prerequisites.

`RetainedFinancialCell` identifies ticker, item, period start/end, scope, raw source pin, native value/unit/format and exact locator. JSON pointers must resolve to the native lexeme in the original raw bytes. Direct-PDF cells require original PDF bytes, page/normalized box and an exact retained REVIEWED native-cell witness matching ticker/concept/scope/period/unit/native/normalized values. Native dimensions and deterministic conversion must match the existing admitted canonical fact. Missing/multiple cells or value/unit disagreement quarantine the fact; no amount-equality concept mapping or normalized-JSON-only shortcut.

`ReviewedStandingAction` keeps cash-dividend event identity separate from share-count observations and price data. It validates source role/document type/economic date, native units and review/receipt chronology. Carry-forward reuses the existing reviewed Python rule output and coverage limitation; confirmed change/conflicting evidence cannot be labelled no-change. Pending proposal actions reject. The action ingest adapter supports exact retained JSON lineage and direct-PDF native-cell receipts binding event identity, kind, economic date, page/box and normalized value. Missing reviewed native-cell evidence remains quarantined. No VNM-specific approvals transfer to another ticker.

## Persistence and consumption

Financial raw evidence uses existing `fundamental_source_version`, `fundamental_import_batch` and `fundamental_raw_capture`. Byte-preserving base64 is stored with its payload hash and original artifact hash; a migration capture time is labelled separately from the original receipt/import time in the evidence. Existing `fundamental_admission_run` stores the canonical snapshot plus standing plan, extraction lineage and current-use evidence. The source snapshot's original data remain intact. One transaction appends raw captures and the normalized linked snapshot; an unqualified batch rolls back completely.

The sole new table, `source_admission_event`, is a shared append-only quarantine/revocation audit table in the same database, with immutable triggers. Migration: `prisma/migrations/202611120002_unified_admission/migration.sql`. No migration has been applied to the active DB. Existing market persistence migration is also not activated.

Admission identity binds exact input/extraction/review/source material, ticker and economic scope while excluding retry clock differences. Repeated unchanged ingestion returns the original record and availability. Conflicting inputs require a new qualified bundle, not replacement. Stored raw captures and normalized snapshot body hashes are checked during consumption, followed by source/material requalification, deterministic replay and current-context Evidence validation. Wrong ticker/security/cutoff, future knowledge, revoked/superseded material and PIT consumption reject. The result explicitly remains `readyForScoring:false`; this is not portfolio or production promotion.

## Replay, migration and rollback

`node scripts/unified-standing.mjs` performs a bounded offline workbench run into this package only. It checks retained source pins for four tickers, replays existing financial validators at their original times and transforms/replays eligible VNM raw prices at the new actual review time. Those legacy financial replays are not new current-time admissions. No source discovery, PDF extraction, network or active DB access occurs.

Rollback uses `revokeStandingFinancial`: append a reasoned revocation for an existing record. Consumption and repeat ingestion reject revoked IDs. Preserve all original raw, canonical records and historical knownAt. Rebuild under a newly qualified material/identity; do not delete audit history or restore a test database over the application database. If no real records were accepted, production rollback is unnecessary.
