# Actual validation results

All six commands below exited 0. The new Python suite passed 18 tests; the selected existing Vitest suites passed 102 tests across six files. Financial branch and segment parity checks passed in `reviews/challenge.json`. Formal DI and AI review validators correctly rejected this non-formal research package. No full release-suite PASS is claimed.

- `PYTHONDONTWRITEBYTECODE=1 python3 scripts/test-m8-r4-closure.py`
- `PATH=/private/tmp/node-v22.23.2-darwin-arm64/bin:$PATH node scripts/verify-m8-r4-closure.mjs`
- `PATH=/private/tmp/node-v22.23.2-darwin-arm64/bin:$PATH node scripts/verify-vn30-lineage.mjs`
- `PATH=/private/tmp/node-v22.23.2-darwin-arm64/bin:$PATH node scripts/verify-acceptance-remediation.mjs`
- `PATH=/private/tmp/node-v22.23.2-darwin-arm64/bin:$PATH node scripts/verify-approved-scoring-authority.mjs`
- `PATH=/private/tmp/node-v22.23.2-darwin-arm64/bin:$PATH pnpm exec vitest run tests/unit/economic-normalization.test.ts tests/unit/review-lineage.test.ts tests/integration/review-lineage.test.ts tests/unit/personal-ai-scoring.test.ts tests/unit/personal-ai-provenance.test.ts tests/integration/personal-ai-scoring.test.ts`

The lineage verifier confirmed 30 issuers, 690 mappings and 437 source pins, while retaining financial acceptance BLOCKED. The authority verifier confirmed 37 artifacts, 133 historical files and nine compatibilities unchanged. Exact stdout and commands are retained in `validation-results.json`.

Verdict: scoped checks PASS; R4 financial/scoring acceptance BLOCKED. No production authorization.
