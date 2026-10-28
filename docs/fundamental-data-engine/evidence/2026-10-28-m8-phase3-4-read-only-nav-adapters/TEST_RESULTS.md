# Test results and commands

2026-10-28 · Phase3.4 SliceA · READ_ONLY_ADAPTERS_ONLY

Final unique coverage: **308passing tests** =262existing(211accounting/settlement/intake regressions +51Phase3.2NAV) +46newadapter cases(44unit +2disposable SQLite). The combined run passed302/302; after adding6extra boundary/head/through tests, the final46adapter suite passed46/46. This is not a claim that one combined308test run occurred.

All28required cases plus symlink/TOCTOU/encoding/duplicate/future/account/stale/lifecycle negatives are mapped in SCENARIO_COVERAGE.json. Machine assertions/expected outcomes, logs, exact commands/exit codes and failures/fixes are in TEST_RESULTS.json and validation/. Synthetic expected/actual typed preparation/NAV and repeat hashes are retained separately from actual evidence.

TypeScript, targeted ESLint(no warnings), module boundaries262source modules, Prisma schema-only validation and whitespace check pass. Node22.23.2; experimental NodeSQLite/loader warnings are preserved. No source/identity/independent approval follows from tests.

Initial full run301/302failed only the new fault-injection setup: existing immutable posted-leg trigger refused UPDATE. Fixed test first verifies denial, injects corruption solely in its disposable DB with original trigger restored afterward, and checks repository/adapter failclosed. No actual data or domain invariant altered. Earlier TypeScript result-type and Zod boundary placement issues were corrected without weakening gates.

Actual read-only validation uses NodeSQLite(readOnly:true), never Prisma opening of actualDB:12transactions/24legs/11holdings exact facts/headers/legs/projection, cash232420/claims570000/payable0, integrity_checkok and foreign-key violations0. New A1actual retained-opening snapshot passes. These are actual ledger checks, not current NAV or a positive real-broker/market integration acceptance test. Broker positive cases use synthetic envelopes only. All operational authorization remains disabled.
