# HPG debt population final closure

Verdict and coverage: [FINAL_REVIEW.md](FINAL_REVIEW.md). This narrow follow-up leaves all five comprehensive debt periods unresolved; partial loan-caption totals are not admitted as FINANCIAL_DEBT. One qualified correction fixes the prior 6M2026 short-borrowing transcription. Historical evidence is immutable.

OWNER_REQUEST.txt records the request. PHASE_CLOSURE_MATRIX.json maps all12 phases. Liability inventories, borrowing movements, bond/lease/other-payable reviews and retained source reader/render proofs support exact period conclusions. OPEN_ISSUES.json distinguishes the debt blocker from untouched supporting/PIT workstreams.

Offline replay with Node22.23.2: `node scripts/verify-hpg-debt-closure.mjs`. Isolated regeneration: `node scripts/close-hpg-debt-closure.mjs --out=/private/tmp/hpg-debt-replay-output`. Producer writes to this directory are rejected after ARTIFACT_HASHES.json is present. HPG_TEST_RESULTS.json retains commands/exit codes and validation logs. No provider requests or official scoring occur in replay.

DI14/DI15 remain unapproved; readyForScoring=false. This run stops at HPG.
