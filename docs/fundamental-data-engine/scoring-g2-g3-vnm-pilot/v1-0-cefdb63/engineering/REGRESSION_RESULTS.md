# Regression results

Final: **259/259 assertions PASS**, no skipped assertions; tests-final.json and final-test-receipt.json bind the command and final source/test hashes. Node22.23.2.

| Scope | Assertions | Result |
|---|---:|---|
| G2/G3 implementation regression | 37 | PASS |
| VNM pilot, source replay and authority rejection | 4 | PASS |
| Existing scoring + golden + methodology + evidence-time + portfolio | 117 | PASS |
| Architecture | 101 | PASS |

Initial run: 253/254 pass; one source-graph architecture test exceeded20seconds. Retained in tests-initial.json. The final command uses120seconds per test and completes successfully. No protected test body was edited to suppress the timeout.

An earlier exploratory run was interrupted before a JSON receipt while the new regression was moved into tests/unit; it is not counted as PASS or as the final run.

Focused engine/fixtures/new-tests typecheck: COMPLETED; exit=0; not separately timed seconds. Its initial run failed with missing Node ambient types in the nested test config; explicit types:[node] in that scoped config fixes the harness. The original failure is retained in extra-check-receipts.json and focused-typecheck.log.

Default root typecheck: TIMEOUT; exit=None; 900.04 seconds. No complete default root typecheck PASS is claimed.

Root typecheck retry with explicit --types node: COMPLETED; exit=0; 165.09 seconds. Exact diagnostics/log are retained in root-explicit-node-typecheck.log.

Changed-code lint initial: TIMEOUT; exit=None; 300.02 seconds. Retry: TIMEOUT; exit=None; 300.01 seconds. Exact output is retained; an empty timeout log is not a PASS.

Standalone architecture: COMPLETED; exit=0; 0.59 seconds; PASS boundaries:291 source modules. Architecture assertion suite also passes101/101.

This targeted validation is not a full test-suite, Next build, release approval or production authority activation.
