# G2/G3 implementation and VNM first scorecard pilot

Owner-authorized source implementation and VNM-only research. Baseline cefdb63e8dd38910e589b0607c4f931d4330ca60. Production authority remains unactivated.

Use Node>=22.23.2<23 (this run uses22.23.2). Reproduce the engine/golden/methodology/architecture and pilot tests:

```sh
node node_modules/vitest/vitest.mjs run --config docs/fundamental-data-engine/scoring-g2-g3-vnm-pilot/v1-0-cefdb63/engineering/vitest.config.mts --testTimeout=120000
node node_modules/typescript/bin/tsc --project docs/fundamental-data-engine/scoring-g2-g3-vnm-pilot/v1-0-cefdb63/engineering/tsconfig.json --noEmit
node node_modules/typescript/bin/tsc --noEmit --incremental false --types node
node scripts/check-boundaries.mjs
python3 scripts/build-vnm-scorecard-pilot.py
python3 scripts/validate-vnm-scorecard-pilot.py
```

The120-second test override accommodates source-graph filesystem scanning; the initial20-second timeout is retained in tests-initial.json. No production admission, database migration or source acquisition is part of these commands. See FINAL_ACCEPTANCE_REVIEW.md for the owner stop and exact remaining dependencies.
