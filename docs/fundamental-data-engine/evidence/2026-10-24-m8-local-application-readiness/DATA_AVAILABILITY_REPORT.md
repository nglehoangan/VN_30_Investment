# Actual retained data availability

## SQLite

Actual read-only inspection: integrity_check=ok; foreign_key_check has zero violations. One portfolio, 11 security rows, 12 POSTED OPENING_BALANCE transactions, 24 ledger legs and one projection are retained. Portfolio supported inception is 2026-10-08T11:38:01.705Z, revision 1. There are no subsequent trade, settlement, cash-deposit or DIVIDEND_CASH records. A stored projection is not used as a bypass when authoritative ledger replay fails.

Prisma connection/SELECT succeeds, but PrismaPortfolioLedger.read returns DATA_INTEGRITY_ERROR. Diagnostics rebuild all 12 original transactions using current code without changing data. Eleven transactions match; one opening cash record stores CASH plus a nonzero RECEIVABLE, bound to an extra `opening.receivable` field. Current TransactionInput.opening declares only cost/migrationVersion/evidence, and the OPENING_BALANCE builder regenerates CASH only for that record. Saved legs match the persisted relational rows; the failure is current replay-contract incompatibility, not proof of physical SQLite corruption or mere JSON-key ordering. Exact transaction identity is hashed in LEDGER_DIAGNOSTIC.json.

The current validator correctly withholds the aggregate instead of dropping the receivable, treating it as settled cash or trusting an old projection. The record must be reconciled through a separately reviewed compatible contract/correction plan; do not remove the leg or weaken replay to make the page green. This review performs no repair or migration. Holdings, cash, cost basis and dividend/performance data are therefore not accepted as working live features.

450 retained broker observations include 436 API responses and 12 broker snapshots, plus opening/reconciliation records; latest DB capture is 2026-10-11. Separate market-source files include later retained captures, but file presence does not automatically refresh the DB or qualify current market data. No broker login/network acquisition was performed.

No analytical scorecards/rankings, decision artifacts, formal financial observation/import/snapshot rows or independent dataset acceptance exist. Thirty fundamental_admission_run rows are CURRENT_ANALYSIS candidate history, not admitted formal facts or a complete AS_KNOWN chain.

## Fundamentals and references

Current retained layout includes manual-download/, manual-extracted-pdf/, manual-extracted-api/ and combine/. Manifest inventory: 337 physical PDF captures, 330 unique PDFs, 248 raw API captures and 8 schema quarantines; 30-ticker retained research coverage. Combined presentation manifest explicitly has productionAdmissible=false. Existing corpus verification reports are historical evidence and were not regenerated or relabeled as new semantic/source-image acceptance in M8.

The actual dashboard research adapter still expects removed data/manual-current/current-analysis.json and manual-fundamentals/. Both are absent after owner-authorized rebuild/cleanup. Consequently retained PDF/API/comparison JSON is available on disk but not exposed through that legacy research reader. The correct future remedy is a versioned read-only adapter for the current layout, preserving review/provenance/units/source-priority and non-admission status. Do not recreate old folders, restore old extracted data or use symlinks as a shortcut.

The VN30 UI uses historical scorecard membership and explicitly lacks a complete current-universe query. Eleven security rows do not constitute a 30-member exchange master. /api/readiness declares a retained 30-name technical candidate with MBB deferred; this is not independent current membership certification. Current market acceptance is PENDING and marketCurrent=false. Its candidate as-of is 2026-10-19 with UNKNOWN_OR_AMBIGUOUS_SESSION; no current NAV may be inferred.

Actual /data reports EMPTY snapshot integrity and UNAVAILABLE DI review. Missing/unreviewed data is not zero and no formal score is generated. Full historical NAV series, approved benchmark comparison and TWR/XIRR/CAGR query are explicitly absent in the current performance UI.
