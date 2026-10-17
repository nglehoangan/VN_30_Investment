# DI15 Policy B amendment — Owner-approved review candidate

Starting HEAD: `c24455fbb47374b355a888247af7bd4e3934ee57`. Effective date: 2026-10-17. [Approved amendment](../../../08_CONTINUOUS_IMPROVEMENT/DI15_PARTIAL_UNIVERSE_POLICY_B.md).

Read [FINAL_REVIEW.md](FINAL_REVIEW.md), [DI15_ACCEPTANCE_REVIEW.json](DI15_ACCEPTANCE_REVIEW.json), [TEST_RESULTS.json](TEST_RESULTS.json), and [OPEN_ISSUES.json](OPEN_ISSUES.json).

Policy B implementation and quarantine: PASS. Full 30 / Scorable admission candidates 25 / Deferred 5. Technical shared-system blockers 0. All six Major ticker issues remain OPEN. Release DI15 FAIL because independent DI14 and other exact-release mandatory gate approvals remain PENDING; structural quarantine PASS is recorded separately. readyForScoring=false; decisionReady=false.

All baseline source, policy and evidence files remain byte-for-byte unchanged. New v2 acceptance/repository/reporting modules are explicit opt-in through `app/server/policy-b-services.ts`, which pins the trusted current acceptance and supplies guarded ports to existing scoring/decision/marginal/workflow/DCA engines. There is no automatic production activation or acceptance insert.

Reproduce current release without changing accounting facts: `node scripts/build-di15-policy-b.mjs`, then `python3 scripts/document-di15-policy-b.py` under repository-required Node22.23.2. Tests and protected replay commands are recorded with exact exits in TEST_RESULTS.json. The builder reads each canonical/input pair at starting HEAD and compares its physical SHA256 before replay. It stops on a disposition discrepancy. Do not run historical generators with record/seal flags.

ARTIFACT_HASHES.json seals all package files except itself plus all new implementation/review sources. The DI14 candidate binds the base commit and hashed working-tree overlay; final review commit/signoff is pending. Prior source issue severities and blockers are preserved; quarantine is not resolution.

STOP. Await **Review DI15 Partial-Universe Amendment**.
