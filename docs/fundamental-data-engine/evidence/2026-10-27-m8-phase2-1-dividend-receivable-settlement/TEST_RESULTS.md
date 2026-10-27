# Test commands and results

Date: 2026-10-27 (Asia/Ho_Chi_Minh). Scope: owner-authorized Phase 2.1 implementation and isolated validation only. No Phase 2.2, production posting, source acceptance or migration execution authorized.

Final regression command:
```
/private/tmp/node-v22.23.2-darwin-arm64/bin/node node_modules/vitest/vitest.mjs run tests/integration/dividend-settlement.test.ts tests/unit/dividend-settlement.test.ts tests/unit/portfolio-accounting.test.ts tests/unit/portfolio-command.test.ts tests/unit/portfolio-read-models.test.ts tests/integration/portfolio.test.ts tests/integration/portfolio-regressions.test.ts tests/integration/portfolio-migration.test.ts tests/integration/portfolio-review-remediation.test.ts --reporter=json --outputFile=/private/tmp/m8-phase21/release-regression.json
```
Result: **177/177 PASS**,0failures. New behavior is synthetic isolated validation; integration uses real SQLite temporary databases, not production acceptance. Per-suite counts in TEST_RESULTS.json; exact JSON in validation/release-regression.json.

Other commands:
```
/private/tmp/node-v22.23.2-darwin-arm64/bin/node node_modules/typescript/bin/tsc --noEmit --incremental false
/private/tmp/node-v22.23.2-darwin-arm64/bin/node scripts/check-boundaries.mjs
DATABASE_URL=file:/private/tmp/m8-phase21/schema-only.sqlite /private/tmp/node-v22.23.2-darwin-arm64/bin/node scripts/database.mjs validate --no-env-file
/private/tmp/node-v22.23.2-darwin-arm64/bin/node --loader /private/tmp/m8-accounting-ro-loader.mjs /private/tmp/m8-accounting-ro.mjs
```
AllPASS. ESLint command: `/private/tmp/node-v22.23.2-darwin-arm64/bin/node node_modules/eslint/bin/eslint.js` followed by the eleven changed/new TS source/test files in CHANGED_FILE_INVENTORY.json, excluding prisma/schema andSQL, plus `--max-warnings=0`; PASS. No Next UI/runtime behavior changed, no live UI or real receipt acceptance claim.

Required coverage: full/partial/multiple receipt settlements; overclaim; duplicate receipt across event IDs and DIVIDEND_CASH/CASH_DEPOSIT before/after enrollment; identical-event idempotency and content conflict; cross-portfolio/issuer/action; missing allocation/evidence; gross rejection/net mismatch; no income/flow/quantity/MWAC/P&L change; immutable reversal/correction; different/identical concurrent requests; CAS; rollback on audit/authority failure; legacy migration/replay. Additional hash-bound acceptance, audit tamper, missing adapter and SQL evidence immutability cases are included.

Recorded failures, not hidden: initial integration fixture used nonexistent DatabaseConfig.filename, fixed to filePath (all12initial tests could not set up). Next run11/12 passed, corrected-descendant read rebuild failed; fixed explicit lineage compatibility. Expanded run175/176 passed with one concurrent-identical in-flight CAS conflict; protocol test now asserts one durable event and retries after winner commit, rather than requiring two immediate successes. No accounting invariant or CAS gate weakened. Initial lint rejected27 explicit-any annotations in new tests; replaced with typed writable malformed-fixture type/nominal watermark constructors. Initial tsc found brandedInstant conversion missing in transport; fixed full timestamp parsing. Node experimental SQLite/loader warnings are environmental and retained. Final allchecksPASS.

Commands run repeatedly only after fixes/new coverage. No future planned test is labelled executed. Read-only actual replay is separate from synthetic approval fixtures; retained raw broker facts were not re-extracted or newly accepted.
