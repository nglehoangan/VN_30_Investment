# M8 ledger replay root cause

Confirmed MAJOR blocker: `M8_LEDGER_OPENING_RECEIVABLE_REPLAY`.

The retained database has twelve POSTED OPENING_BALANCE records and 24 legs. One cash opening contains `opening.receivable` under `tcbs-opening-v1`, methodology `m63-tcbs-opening-local-v1`. Its source is `BROKER_SNAPSHOT:cc46785ff2d4f7477911d0cb7dad6ee38b872b5cc6a8566a78683637fdf43852`. The retained broker body rehashes exactly; its cash balance and pendingDividends equal the original opening facts. Saved CASH then RECEIVABLE legs agree with relational rows. `ORIGINAL_RECORD_INTEGRITY.json` pins every original aggregate and row/leg set without publishing amounts.

Event/effective time is 2026-10-08T11:38:01.705Z; created time is 2026-10-08T11:38:40.132Z. All remain unchanged. This opening receivable is not a new DIVIDEND_CASH event or spendable cash.

Before correction, `src/domain/portfolio/transaction.ts` opening detail declared cost/migrationVersion/evidence and generated CASH plus optional holding/basis legs, omitting RECEIVABLE. The original M6.3 commit `6f4af0c` also lacks opening-receivable generation; `42afdf5` is the later pre-remediation transaction-builder change. No retained importer executable matching `tcbs-opening-v1` was found by repository/history searches. Do not invent its execution provenance. This establishes divergence between the persisted evidenced opening contract and current reconstruction support, rather than proving a removed builder implementation once supported it.

`src/infrastructure/repositories/portfolio-ledger.ts` strictly rebuilds each aggregate and compares original JSON, relational legs and index fields. It correctly rejected the missing leg; it was not a validator defect. Prior sealed M8 `LEDGER_DIAGNOSTIC.json` shows one mismatch and eleven exact matches. Corrected `LEDGER_REPLAY_RESULTS.json` shows twelve exact matches.

The existing `202609160001_portfolio_ledger/migration.sql` already permits RECEIVABLE legs, immutable posted records, closed leg counts and unique source/idempotency identity. No schema compatibility change is needed. DATA_MODEL/TRANSACTIONS contracts distinguish cash and obligations; `docs/02 DATABASE/TRANSACTIONS.md` §§4, 14 and 18 and ADR 0004 define evidenced opening, exact arithmetic and replay. This is missing opening-receivable reconstruction for an evidenced imported contract, not a new accrual-income policy or arithmetic-version change. Physical integrity and foreign keys pass.
