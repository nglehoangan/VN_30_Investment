# Scoring gate regression results
Supported Node: `/tmp/node-v22.23.2-darwin-arm64/bin/node` (v22.23.2); Vitest project dependency. No package installation, provider calls or production database runner.

- Focused pre-patch regression: **2 expected failures**, 37 skipped. G2 independent rubric survival and G3 cross-year acceptance fail on the baseline copies. `g2-g3-red.json` is the intentional RED receipt.
- Final isolated regression/contract tests: **41/41 PASS**. Positive/negative growth contexts, unit/scope/revision/horizon/annual-window checks, EPS action evidence, missing/stale/conflicting evidence, unchanged non-CAGR guards, all-sector baseline parity and formal-candidate rejection are included.
- Selected unchanged baseline suite: **108/108 PASS** (`scoring`, golden cases, methodology validation, evidence time). No whole-application/release PASS is claimed.
- Candidate/test TypeScript: final `tsc --noEmit --project .../tsconfig.json` receipt must be PASS in execution-receipts.json.

G4/G5/G7 prototype tests demonstrate required failure blocks only its dependent rubric (and complete total), context failure does not block or downgrade confidence by itself, and supporting failure requests review. Every mandatory topic stays REQUIRED; weaker duplicate roles cannot downgrade it. Cyclical normalization and genuine confidence guards are unchanged. The role prototype is **not wired into the accepted or candidate scorer**; it is a reviewed contract proposal rather than an unapproved production guard change.

The initial full test-harness attempt is preserved as test-harness-initial.json. Some assertions incorrectly matched the public ValidationError message instead of its structured reason; they were corrected before the focused two-case RED receipt. No production source was edited to make tests pass. Tests reuse existing TEST_ONLY fixtures solely for regression; no issuer synthetic Fundamental Score is produced or published.

## Correction to v1.0 G1
`validation.ts list(values,max)` enforces an upper bound. `list(assessments,23)` allows partial arrays; the executable already returns N/R for unassessed rubrics. No G1 code change is proposed. The complete-total/null rule and no-reweighting control remain.

## Execution exceptions and final scope
The 60-second candidate startup/execution attempt, 180-second repeated baseline attempt and 180-second typecheck attempt timed out without assertion diagnostics. Exact exception receipts are retained. The final changed-scope run completed with exit0 for all 41 candidate/contract tests, final typecheck, patch application check and architecture boundaries. The prior 108/108 baseline PASS/exit0 is explicitly retained from execution-initial-complete.json because accepted source/test bytes are unchanged; the timed-out repetition is not claimed as PASS. Full audit validation is freshly rerun on final artifacts; it does not reuse old audit PASS checks.

The extra G2 edge case verifies that a dated ownership-SHARES snapshot in governance stays independent unless an action-sensitive metric is actually consumed.
