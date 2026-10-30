# B6-04 — Migration/schema remediation, 2026-10-29

## Cause and change

Reproduced all six reported failures in `before.log` (six failed, nine passed). Five upgrade tests compared the entire old ledger table DDL byte-for-byte. The 202610270001 migration intentionally rebuilds that table to add `DIVIDEND_RECEIVABLE_SETTLEMENT`; SQLite also quotes the renamed table's name. The registry test omitted three tables introduced by the two 20261027 migrations.

Updated the five upgrade tests to permit precisely those two ledger DDL differences. All other old schema objects, including triggers and indexes, must still match exactly. Added the exact three expected table names (`dividend_receipt_owner`, `dividend_settlement_audit`, `forward_intake_event`) to the upgrade/fresh inventories. No migration SQL, Prisma schema, production runtime logic, authority manifest or historical seal was changed.

Shared checks live in `tests/fixtures/migration-invariants.ts`. They do not ignore the ledger table or accept arbitrary constraint changes.

## Preservation checks

- Five populated historical baselines (pre-fundamentals, normalization, derivation, snapshot, readiness) upgrade through the actual migration deploy command on private temporary databases. Every previous application table's rows remain exactly equal, including historical fundamental observations, normalization/derivation evidence, snapshots and score artifacts where seeded.
- Repeat deployment compares the complete application schema and rows in **all** post-upgrade tables, including new tables, before and after the repeat. Prisma's migration bookkeeping is excluded from application-row comparisons. Migration status and foreign_key_check remain checked.
- Expanded the pre-fundamentals ledger fixture from a deposit to 13 posted transactions: purchases, sales, trade settlements, dividend, fee, withdrawal and fee reversal. This exercises populated security FKs, trade-settlement/reversal lineage and real projection persistence. All old raw rows, portfolio state and ledger replay must survive unchanged.
- Ledger column definitions/order, FK definitions/actions, and explicit indexes must remain identical. The final schema from populated upgrade must equal a fresh deployment's schema.
- Forbidden writes are executed against the upgraded DB: posted header/leg updates and deletions, header replacement and late leg insertion must fail. An incomplete aggregate cannot finalize; an unknown transaction type and orphan portfolio FK are rejected. The new type CHECK accepts the intended dividend-settlement type.
- All three new audit/receipt/intake tables reject updates, deletions and replacement. The settlement audit rejects an orphan transaction FK. These probes run in a transaction that is rolled back, including synthetic pending headers/audit rows.
- Existing dividend-settlement and forward-intake integration suites exercise the new tables through actual adapters, receipt/idempotency protection, rollback, CAS and immutable audit behavior. Foundation-to-current portfolio migration is included as regression coverage.

## Scope and evidence

`final-tests.log` contains the final six-file target and adjacent integration regressions. `typecheck.log` and `lint.log` record checks of the final changes; `FINAL_STATUS.json` records exact totals.

The real `data/vn30.sqlite` was opened read-only for integrity/FK checks and hashing, never migrated or written by this task. `LIVE_DB_BEFORE.json` and `LIVE_DB_VERIFICATION.json` record integrity, counts and unchanged database hash across final validation. `authority-verification.json` confirms the approved 37-file executable and historical authority pins remain valid.

This closes the six migration/schema test failures only. It does not claim that all remaining B6 issues, market gates or scoring-dataset admission are resolved. All migration execution and destructive trigger probes in this task targeted disposable test databases.
