# Data Initialization — Final Independent Acceptance Candidate

**Candidate prepared with blocking findings. It is not awaiting DI14 alone.** The unchanged implementation is pinned to `68aa87f9ae4478714ec6ca676e5a3b2addf0d77f` and its git tree. The complete producer review artifact SHA256 is `c5467f3ed7873950982c1b8e00dab6d954e865df92bcaeef16664e260c8ac530`. All new evidence/scripts are pinned in ARTIFACT_HASHES.json; no uncreated final commit or external signoff is claimed. DI14's actual review fields remain null. A reviewer must pin the eventual evidence commit as well as the exact artifact hash; this package supplies no trusted acceptance capability.

| Gate | Exact release result |
| --- | --- |
| DI1 | PASS |
| DI2 | PASS |
| DI3 | PASS |
| DI4 | FAIL |
| DI5 | PASS |
| DI6 | PASS |
| DI7 | PASS |
| DI8 | FAIL |
| DI9 | PASS |
| DI10 | PASS |
| DI11 | PASS |
| DI12 | FAIL |
| DI13 | PASS |
| DI14 | PENDING_INDEPENDENT_APPROVAL |
| DI15 | FAIL |

The request's premise that DI3–DI12 were pending only for re-acceptance could not be fully verified. Direct revalidation found a release-wide market-source evidence gap. There are 30 archived diagnostic market rows dated 2026-10-09, but **0/30 raw source proofs can be rehashed at the recorded paths**. A historical PASS summary is insufficient. DI4 therefore FAILS. Current market freshness is unaccepted, so DI8 FAILS. The 30 accounting snapshots reproduce, but a complete eligible formal market-plus-fundamentals snapshotRunId/contentHash/manifestDigest is absent under the unchanged v2 contract, so DI12 FAILS. The review-bundle ID does not substitute for that runtime snapshot. The existing default database passes physical integrity and foreign-key checks but lacks the formal fundamental snapshot/acceptance tables. No DB migration, production registry promotion or acceptance insert was performed.

Global system blocker count: **1**, `RELEASE-MARKET-SOURCE-REPLAY-UNAVAILABLE`, an OPEN Major shared source-contract availability issue. This is not an assertion that accounting data is corrupt. No universe mismatch, cross-ticker contamination, unit/mapping/registry/schema corruption affecting admitted accounting facts, canonical divergence or physical database corruption was observed. All 12 global fault classes fail closed in isolated tests; acceptance-version bypass is rejected by existing regressions. This shared release issue cannot be placed into a ticker quarantine. It is appended in a new full source issue ledger without editing the six original ticker objects or their provenance.

## Universe and preserved accounting

FULL_UNIVERSE_COUNT=30; SCORABLE_UNIVERSE_COUNT=25 admission candidates; DEFERRED_UNIVERSE_COUNT=5. Certification is pinned as-of 2026-10-16, effective 2026-08-03; no live 2026-10-17 membership extension is claimed.

SCORABLE candidates: ACB, BID, BSR, CTG, FPT, GAS, GVR, HDB, HPG, LPB, MCH, MSN, MWG, SAB, SHB, SSB, SSI, STB, TCB, VCB, VHM, VJC, VPB, VPL, VRE.

DEFERRED: MBB, TCX, VIB, VIC, VNM.

All 30 complete canonical snapshots replay exactly. All 679 unique retained source bindings rehash, and all 92 sealed Policy B artifacts remain unchanged. Tracked bytes are compared with the starting commit; private retained originals are verified against hashes in those commit-pinned inputs. The six OPEN Major ticker issues remain byte/semantic-identical: VNM financing population; TCX FY2022 Két Vàng population/classification; MBB current regulatory capital; VIB current regulatory capital and NPL definition; VIC reviewed consolidated 6M2026 original. No ticker accounting work was reopened. Exception-register bytes match the approved Policy B package. The original certified universe and partition members remain identical. New prerequisite statuses and the separately evidenced global release issue do not change Policy B semantics.

All 50 deferred action attempts are denied in an isolated in-memory fixture where unrelated gates are marked PASS, proving quarantine itself rather than relying only on release failure. That fixture is never stored as release authority. Scores remain null; ranking, Top10, positive capital and DCA eligibility remain false. No missing weight or capital is redistributed. Current and historical admissibility remain distinct; unknown historical publication is not invented.

## Revalidation and review boundary

Full application suite: **1,902 PASS / 0 FAIL**. Focused acceptance/Policy B/aggregate tests: 140 PASS; fundamental/ticker suite: 603 PASS; architecture: 98 PASS; browser E2E: 12 PASS; protected producer commands: 32 PASS plus the full 30 aggregate. Structured certification, lint, typecheck, DB schema validation and webpack production build PASS. TEST_RESULTS.json records commands, exits, hashes and initial failures. Passing synthetic tests does not certify missing real market data.

The first browser invocation was blocked by sandbox localhost restrictions; the approved loopback retest passed. An initial focused fundamental test caught an E2E-regenerated historical screenshot. All 48 original images were restored and the sequential retest/full suite passed. The new reconstruction script initially assumed private originals were git objects and an optional output flag was present; both producer-script assumptions were corrected without changing facts or runtime validation. All failed logs are retained. Existing tracked source/evidence/policy files and the local database remain unchanged.

Every DI01–DI13 review quotes its authority and binds exact hashed evidence to the same release ID and implementation commit. DI14 binds the universe/policy/partition/exception register/all 30 canonical hashes/tests/build/replay/global blocker result, with independentReviewer, reviewTimestamp, reviewCommit, approvalReference and reviewedArtifactHash null. `candidateArtifactHash` identifies only the producer's proposed review target. No self-signature or production acceptance exists.

To remove the substantive failures, retain/requalify authoritative market source bytes with explicit dates, provenance and accepted freshness, then reproduce and bind the complete eligible formal snapshot. This does not require reopening accounting closures. Independent review remains necessary after those evidence gaps close. The current request is completed as a blocked acceptance candidate; no remediation or investment action is inferred from it.

readyForScoring=false. decisionReady=false. No M3 scoring, ranking, Top10 or investment recommendation was executed against the current release.

**STOP. Await “Review Data Initialization Final Acceptance”.**
