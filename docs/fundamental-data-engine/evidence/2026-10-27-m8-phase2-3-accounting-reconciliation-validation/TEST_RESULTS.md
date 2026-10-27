# Tests executed and exact commands

Date: 2026-10-27 (Asia/Ho_Chi_Minh). Phase 2.3 validation/reporting only. No production implementation, posting, migration or Phase 3 authorization.

**215/215PASS**: approved211regression cases plus4new integrated validation cases. New tests/config/helpers live only inside this evidence directory; original tests and implementation unchanged. Synthetic temporarySQLite is distinguished from actual read-only opening replay and retained broker observations. No live runtime/NAV/current-market acceptance claimed.

Exact commands:
```
/private/tmp/node-v22.23.2-darwin-arm64/bin/node node_modules/vitest/vitest.mjs run tests/unit/forward-intake.test.ts tests/integration/forward-intake.test.ts tests/unit/dividend-settlement.test.ts tests/integration/dividend-settlement.test.ts tests/unit/portfolio-accounting.test.ts tests/unit/portfolio-command.test.ts tests/unit/portfolio-read-models.test.ts tests/integration/portfolio.test.ts tests/integration/portfolio-migration.test.ts tests/integration/portfolio-regressions.test.ts tests/integration/portfolio-review-remediation.test.ts --reporter=json --outputFile=/private/tmp/m8-phase23/regression.json
/private/tmp/node-v22.23.2-darwin-arm64/bin/node node_modules/vitest/vitest.mjs run --config docs/fundamental-data-engine/evidence/2026-10-27-m8-phase2-3-accounting-reconciliation-validation/validation/vitest.config.mts --reporter=json --outputFile=/private/tmp/m8-phase23/integrated-initial.json
/private/tmp/node-v22.23.2-darwin-arm64/bin/node --loader ./docs/fundamental-data-engine/evidence/2026-10-27-m8-phase2-3-accounting-reconciliation-validation/validation/readonly-loader.mjs ./docs/fundamental-data-engine/evidence/2026-10-27-m8-phase2-3-accounting-reconciliation-validation/validation/opening-readonly.mjs
python3 docs/fundamental-data-engine/evidence/2026-10-27-m8-phase2-3-accounting-reconciliation-validation/validation/gather-retained.py
/private/tmp/node-v22.23.2-darwin-arm64/bin/node node_modules/typescript/bin/tsc --noEmit --incremental false
/private/tmp/node-v22.23.2-darwin-arm64/bin/node scripts/check-boundaries.mjs
DATABASE_URL=file:/private/tmp/m8-phase23/schema-only.sqlite /private/tmp/node-v22.23.2-darwin-arm64/bin/node scripts/database.mjs validate --no-env-file
/private/tmp/node-v22.23.2-darwin-arm64/bin/node node_modules/eslint/bin/eslint.js docs/fundamental-data-engine/evidence/2026-10-27-m8-phase2-3-accounting-reconciliation-validation/validation/integrated-accounting.test.ts docs/fundamental-data-engine/evidence/2026-10-27-m8-phase2-3-accounting-reconciliation-validation/validation/vitest.config.mts --max-warnings=0
```

Captured logs in validation/. All exited0: approvedregression211/211; integrated4/4; opening helper12/24/11exact; retained-gather19appliedchecksums/2prepared; tsc; boundaries252modules; Prisma schema validation with dummy URL; lint for new validation TS/MTS artifacts. No failed business test in this phase. Node experimentalSQLite/loader warnings remain environmental; no financial invariant waived.

Integrated expected/actual/commands and reconciliation failure outcomes retained as JSON; prior Phase2.1/2.2 artifact seals reverified. Previous phases' historical failed attempts remain sealed in their original packages; they are not reclassified or deleted. Unsupported canonical cash-receipt correction intentionally BLOCKED is a passing failure-control test, not full correction functionality. Syntheticfixture methodology/authority records are not operational approvals.
