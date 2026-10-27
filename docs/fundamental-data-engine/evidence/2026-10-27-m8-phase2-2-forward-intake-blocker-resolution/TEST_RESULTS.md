# Validation commands and results

Assessment: 2026-10-27 Asia/Ho_Chi_Minh. Owner authorizes Phase2.2 isolated implementation and targeted blocker investigation only. No Phase2.3, Current NAV implementation, production posting/migration or acceptance changes.

Final regression **211/211 PASS**,0failures. Exact11file suite and all commands in TEST_RESULTS.json; full final-code machine results in validation/snapshot-regression.json. New34classification/intake cases are synthetic; SQLiteintegration uses private temporary databases. Existing177Phase2.1/accounting regression cases included unchanged. Actual-source read-only12/24/11replay and disposable actual-copy migration are separate from synthetic behavior.

Commands:
```
/private/tmp/node-v22.23.2-darwin-arm64/bin/node node_modules/vitest/vitest.mjs run tests/unit/forward-intake.test.ts tests/integration/forward-intake.test.ts tests/unit/dividend-settlement.test.ts tests/integration/dividend-settlement.test.ts tests/unit/portfolio-accounting.test.ts tests/unit/portfolio-command.test.ts tests/unit/portfolio-read-models.test.ts tests/integration/portfolio.test.ts tests/integration/portfolio-migration.test.ts tests/integration/portfolio-regressions.test.ts tests/integration/portfolio-review-remediation.test.ts --reporter=json --outputFile=/private/tmp/m8-phase22/snapshot-regression.json
/private/tmp/node-v22.23.2-darwin-arm64/bin/node node_modules/typescript/bin/tsc --noEmit --incremental false
/private/tmp/node-v22.23.2-darwin-arm64/bin/node scripts/check-boundaries.mjs
DATABASE_URL=file:/private/tmp/m8-phase22/schema-only.sqlite /private/tmp/node-v22.23.2-darwin-arm64/bin/node scripts/database.mjs validate --no-env-file
python3 /private/tmp/m8-phase22/investigate.py
python3 /private/tmp/m8-phase22/matrices.py
python3 docs/08_CONTINUOUS_IMPROVEMENT/release-manifest-v1.0/verify.py
/private/tmp/node-v22.23.2-darwin-arm64/bin/node --loader /private/tmp/m8-accounting-ro-loader.mjs /private/tmp/m8-accounting-ro.mjs
/private/tmp/node-v22.23.2-darwin-arm64/bin/node node_modules/eslint/bin/eslint.js src/application/portfolio/candidate.ts src/domain/portfolio/candidate.ts src/domain/portfolio/forward-intake.ts src/infrastructure/repositories/forward-intake-storage.ts src/infrastructure/repositories/forward-intake.ts src/infrastructure/repositories/portfolio-ledger.ts tests/fixtures/portfolio/forward-intake.ts tests/integration/forward-intake.test.ts tests/unit/forward-intake.test.ts --max-warnings=0
```
Typecheck, targeted lint, module boundaries and Prisma schemaPASS. Schema command uses dummy temporary URL, no production migration. Manifest verification proves exact archived source only; no liveUI/NAV/runtime acceptance claim.

Preserved intermediate failures: initial21/22intakeintegrationPASS, one test expected a throw but correct facade returned BLOCKED/0posted; adjusted test to assert that result and unchanged ledger. Expanded210/211PASS, malformed/nullcommand unit fixture attempted to build a synthetic grant before classification; fixture fixed. Boundary checker rejected infrastructure→application imports; fixed by relocating the one pure preparation helper to domain with compatibility re-export and by explicit NOT_REBUILT projection DTO. No accounting gate weakened. Added explicit migration transaction and fault-rollback rehearsal before final release regression. Node experimentalSQLite/loader warnings retained; no business error in final checks.

Coverage includes all25requested categories/controls: BUY/SELL/settlements/cash/dividends/NETclaim/supportedaction/fees/tax; repeated/crossformat/crossfile/currentledgerduplicates; preopening/dateonly/source/identity/unsupported; independentconnectionsCAS; all-or-nothingbatch/audit/revocationfailure; immutablecorrections; legacy/MWAC/noincome/no-margin; actualproductionfilehash unchanged. No synthetic approval is operational acceptance.

Final code review fixed split-snapshot review consistency: ledger and intake identity registry now read in one transaction. Full211case regression, typecheck/lint/boundaries rerunPASS afterward; previous release-regression retained as intermediate.
