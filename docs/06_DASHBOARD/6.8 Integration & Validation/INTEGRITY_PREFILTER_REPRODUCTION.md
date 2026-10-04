# M68-M04 integrity-prefilter reproduction

Detected during integration hardening, in the new production marginal catalog. This was not hidden as a passing baseline test. Disposable fixture creates a genuine persisted marginal artifact, deliberately removes its immutable update trigger to simulate storage corruption, and changes only the body scope to SYNTHETIC_TEST while leaving the original bodyHash.

Pre-fix focused Vitest invocation (2026-10-04, start 07:12:07 UTC):

`pnpm exec vitest run tests/integration/m68.test.ts -t 'catalog cannot hide'`

Exit 1; 1 failed, 11 skipped. The assertion failed because the promise resolved READY with a new review artifact instead of rejecting. SQL's body-scope predicate excluded the corrupted record before repository hash verification, so an absent-marginal fallback was selected.

Fix: verify every persisted marginal body's SHA-256 against its stored hash before evaluating body-derived catalog predicates. This is an integrity gate, not a financial calculation. Selected authority is still independently replayed by the existing M6.5 repository/engine and consumed by M6.6. Hash verification reads the marginal inventory in full; that additional monthly-initiation history read is explicitly recorded maintenance debt.

Post-fix same focused invocation (start 07:12:35 UTC): exit 0; 1 passed, 11 skipped. No workflow review and no extra ledger transaction exist. The test is retained in the full M6.8/aggregate suites. Restoring normal immutable triggers remains mandatory; production exposes no trigger-removal or direct body-edit endpoint.
