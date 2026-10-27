# Test Results

Date: 2026-10-27. Scope: Phase 3.2 isolated implementation only.

Final unique coverage: **262 passing tests** =211 existing regression cases +51 NAV cases (44unit,7SQLite integration). These are two validation segments, not a claimed single262/262combined run.

The combined run passed all211legacy tests, but failed1new correction fixture out of46NAV cases: changed trade effective date retained original tradeDate. Existing TRADE_EFFECTIVE_DATE_MISMATCH correctly rejected it. The fixture was corrected,3authority checks and2additional shape/action cases included in the final51test suite; all51PASS. No legacy gate was weakened. Earlier33/35first-pass failures and TypeScript fixture errors are preserved with fixes described in REMAINING_ISSUES.md.

TypeScript, targeted ESLint,257-module boundary check and Prisma schema-only validation all exit0. Node22.23.2; experimental NodeSQLite warnings are retained. Exact commands/exit codes/results are in TEST_RESULTS.json. All command outputs retained under validation/. No external API called.

SCENARIO_MATRIX.json maps each of22approved scenario IDs to executed assertions/expected controls. validation/synthetic-expected-actual.json includes exact returned manifests for qualified1220, indicative1220, blocked unknown-liability and negative-expression−10. Additional cases cover zero, precision, duplicate/reverse identities, pending partition, split alignment, authority expiry/scope/hash/revocation, hash mutation, revision/head races and clock rollback.

Read-only actual replay:12transactions,24legs,11holdings, cash232420/claims570000/payable0; exact source/header/legs/projection, integrity_check=ok and foreign-key check clean. New default service on actual ledger returnsNAV_BLOCKED with no operational input provider/authority. This is actual read-only execution, not live accepted-NAV/runtime/UI acceptance. No dashboard/production route was added or tested as a new feature.
