# Final independent Data Initialization acceptance candidate

Read [FINAL_ACCEPTANCE_CANDIDATE.md](FINAL_ACCEPTANCE_CANDIDATE.md), [RELEASE_BINDING.json](RELEASE_BINDING.json), [DI14_REVIEW_CANDIDATE.json](DI14_REVIEW_CANDIDATE.json), and [TEST_RESULTS.json](TEST_RESULTS.json).

DI1–DI13: ten PASS, DI4/DI8/DI12 FAIL. DI14 PENDING_INDEPENDENT_APPROVAL; DI15 FAIL. Full 30 / Scorable candidates 25 / Deferred 5; one release-wide market-source availability blocker. All six original ticker Majors remain OPEN. Runtime flags remain false.

Reproduce with Node22.23.2: run audit-final-di-candidate-market.py, reconstruct-final-di-candidate.mjs and replay-final-di-universe.py, the command groups in validate-final-di-candidate.py, build-final-di-candidate.py, evaluate-final-di-candidate.mjs, then seal-final-di-candidate.py. Run browser before protected hash checks/full suite and restore protected images as recorded. Do not rerun prior sealed generators in place. Source market paths are checked directly in MARKET_SOURCE_RECHECK.json; the intentionally failed actual-release gates are separate from passing application regressions. No runtime or Policy B semantic change.

STOP. Await **Review Data Initialization Final Acceptance**.
