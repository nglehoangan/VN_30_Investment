# TCB Final Scoring Authorization Report

## Final disposition

**TCB scoring is closed for the owner-approved limited scope at the 2026-10-30 economic cutoff.** The governed run completed in isolated SQLite and the stored scorecard and authorization envelope passed SHA-256 verification. The three original blockers are closed for that exact execution through admitted BANK data, the registered TCB adapter and the approved executable and single-run authority. The original pre-execution findings are retained below as history.

| Item | Result |
| --- | --- |
| Execution | `exec-0b19b7fa3d5a2c4db8eb53f6` |
| Score status | `OFFICIAL_LIMITED` |
| Confirmed points and coverage | 47 of 93 available points across 20 of 23 rubrics |
| N/R | `FH-STRESS`, `CA-DIST`, `CA-DIL` |
| Full score, ranking and allocation | Full score is null. Ranking and allocation are ineligible. |
| Production | No materialization or publication. Either action requires its own TCB-specific authority under the existing governance rules. |

[Verified score artifact](TCB_FINAL_SCORE_ARTIFACT.json) · [Execution receipt](TCB_SCORE_EXECUTION_RESULT.json) · [Owner approval](TCB_SCORE_EXECUTION_OWNER_APPROVAL.json)

## Current production publication acceptance

**BLOCKED_WITH_SPECIFIC_CAUSE.** Baseline `575265a98cf08448911a51971d24c9acd19a5637`. The completed isolated execution `exec-0b19b7fa3d5a2c4db8eb53f6` is the sole score source for this candidate. The target SQLite path is `data/vn30.sqlite`, resolved from the repository and checked against the app's local configuration and the existing VNM materialization target. No production website origin was verified. The target contains neither the TCB score row nor the approved TCB methodology row.

| Exact publication subject | Value |
| --- | --- |
| scorecardId | `TCB-CONSOLIDATED-20261030-CANDIDATE` |
| scorecardHash | `1c866584914fb8fd6c4b16acbcf7a48b11dca670bf2b1a9973c4d433b0fed475` |
| datasetHash | `9fde2d5ff4df7ce769714ba2f2f2f97c22d9a98f9a4bf37f6f5ed16b90ae2efb` |
| methodologyHash | `b1642701ad9aa38df90498249b0509464befbd9dfd6d3a9676c974c4b7f6a8d9` |
| reviewHash | `c8b730326974407820be2eecaa4522d985edd51c5f783e5a859e80b34c16c7c9` |
| Stored envelope SHA-256 | `5c4bfe87749c8eee163cb7d86e20452dbb2994652bb4313c904a83a3d521d4cc` |
| Preflight authorization SHA-256 | `5a8ecf9fd9d145ffb7e97696d5c9f0796787ddaa56e3688daad308cc269994c6` |

The scoring receipt, approved route, owner statement and source bytes bind the same execution digest. The approved executable and both trusted reviews passed their runtime verifiers in isolation. The M1 and scope receipts, approved AI draft and final assessment pins were checked. The AI draft to final transition changed review metadata, timestamps and executable registration fields. Rubric evidence and economic conclusions were retained. The exact execution signature binds the final assessment and both reviews. The admitted dataset hash matched a read-only adapter replay. The target revocation check found no matching event for the verified score, binding, data acceptance or exact scoring authority references.

The existing VNM deployment recipe invokes scoring to materialize its result. TCB requires a governed materialization path that preserves the retained envelope without executing scoring again. Four source paths in the approved isolated TCB executable differ from this baseline. Substituting those bytes would also invalidate ACB's existing pins for all four. The candidate records the paths. Resolve coexistence without changing ACB authority, then rehearse the exact TCB materialization on a production copy and verify its persisted envelope and the read-only publication consumer. The production registry currently provides VNM and ACB authority only.

The local `/tcb-scoring` component displayed the expected score and N/R rows in an isolated component check and rejected production mode. The three publication, publication view and BANK dataset regression suites passed **13 tests** with a temporary Node config and a `server-only` alias. The default run encountered an unresolved `server-only` import and worker startup timeouts. Target HTTP readback is pending production materialization and exact TCB PUB-04 authorization.

The next mandatory owner gate is the exact materialization plan after the technical blockers are cleared and the website origin is identified. Separate subject-specific PUB-04 approval follows materialization. This candidate carries no executable approval for either action. No production writes, publication, rescoring or artifact pruning occurred in this review.

[Blocked publication candidate and readback checks](TCB_PUBLICATION_ACCEPTANCE_CANDIDATE.json)

## Historical authorization review

**BLOCKED_WITH_SPECIFIC_CAUSE** · TCB / HOSE / BANK · Economic cutoff 2026-10-30 · Baseline `7f292df71403f5b31214b46b25dd36b047ce4c3a`

## Original blockers

| Blocker | Verified disposition |
| --- | --- |
| NO_ADMITTED_CURRENT_DATASET_AT_CUTOFF | Closed at the data layer. Governed read-only adapter replay returned scoring dataset `9fde2d5ff4df7ce769714ba2f2f2f97c22d9a98f9a4bf37f6f5ed16b90ae2efb`. It reproduced all nine admitted evidence records in the assessment byte for byte under canonical hashing. SQLite inventory identifies financial dataset `current-bank-dataset:d0603b3f85e5ad25e108d178dcbf5ffbe2bd68d53ebf23420c8eac2fe23cfa64`. The two hashes refer to different objects. |
| NO_REGISTERED_TICKER_MAPPING_ADAPTER | Closed at the mapping layer. The existing route registry identifies the TCB adapter for TCB/HOSE/BANK and its SHA-256 verified. The adapter resolved the current-purpose BANK reference and the accepted scope. |
| NO_EXACT_TICKER_SCORING_AUTHORITY | Open. The production worker recognizes ACB's limited-coverage methodology and exact ACB N/R set. The authority verifier has no TCB limited profile. A TCB draft method and candidate route exist, but the current runtime cannot certify that route with TCB's three unrated rubric IDs. |

[Data acceptance](TCB_SCORING_DATA_ACCEPTANCE.json) · [BANK reference](TCB_SCORING_DATA_REFERENCE.json) · [Candidate route](TCB_CONSOLIDATED_TOPIC_ROUTE_CANDIDATE.json)

## Assessment and M1

The owner scope receipt covers all 23 dispositions. Twenty CONSERVATIVE points match the source assessment and draft packet, covering 93 of 100 weight. FH-STRESS, CA-DIST and CA-DIL remain N/R. Governed evidence validation reported no identity, timing or provenance errors in the serialized evidence. Two required topics remain unsupported for formal scoring.

- **FH-LIQ / covenants.** Q3 maturity data and the funding stress support the research judgment. The retained ladder embeds behavioral maturities for demand deposits and does not establish unrestricted funding, issuer covenant headroom, applicable acceleration triggers or committed rollover. Keep the research point and the formal topic gap.
- **CA-REINV / divestments.** Technology spending, TCBS capital developments and Techcom Life are documented. FY2025 Note 30's insurance contract termination charge supplies exit context. It does not establish the net capital-allocation outcome of an equity disposal or authorize treating the mandatory topic as inapplicable. Keep the research point and the formal topic gap.

[Consolidated assessment](TCB_CONSOLIDATED_ASSESSMENT_WITH_M1.json) · [Topic-level draft](TCB_CONSOLIDATED_SCORING_TOPIC_PACKET_DRAFT.json) · [23-rubric owner scope](TCB_CONSOLIDATED_SCORING_SCOPE_OWNER_APPROVAL.json)

The dated M1 candidate at `2026-11-22T13:44:42.214Z` records **PASS WITH CONDITIONS**, **CLEAR** at issuer level, and **ELEVATED_CONTROLLED**. The candidate reconciles VN30 eligibility, business viability, Q3 liquidity sensitivity, governance disclosure and a defensible valuation range with the Investment Policy mandate, Decision Framework §4 and Risk Policy §11. The condition is monitoring refinancing ability and reopening the disposition if new material liquidity or governance evidence arises. Portfolio sizing, margin and trade execution are outside this issuer finding. All three status fields and the retained M1 evidence hash reproduced in the scoring draft. **Formal M1 adoption remains pending.** The four-rubric predecessor and the approved consolidated assessment remain preserved.

[M1 adoption candidate and dated evidence](TCB_M1_DATED_ANALYST_DISPOSITION.json)

## Executable, methodology and review

The methodology candidate is `current-scoring-tcb-limited-v1`, semantic version `1.0.0`, implementation `m64-clarification-1-ai-origin-v1`, status `DRAFT`. It retains the existing BANK normalization and rubric rules. The executable identity below identifies the exact source bytes verified in this review. It is a baseline inventory for the candidate, with no approved TCB executable or registered TCB methodology binding. The authorized BANK data executable serves data admission; scoring authority uses a separate contract.

| Source | SHA-256 |
| --- | --- |
| [tcb-bank-adapter.ts](../../../../../tools/scoring/tcb-bank-adapter.ts) | `bb3b4fbbf3b347afa243a76f6a692fe6a510123a1569fb8e37d58cfc14bc4efe` |
| [tcb-bank-binding.ts](../../../../../src/infrastructure/source-admission/tcb-bank-binding.ts) | `e26fe83eb02567f74f9ac4f49c1dbccfb1f222962a55893be0b1df2d2436195c` |
| [tcb-bank-dataset.ts](../../../../../src/infrastructure/source-admission/tcb-bank-dataset.ts) | `dd929b0cdb6e8e398003bba29d7272c239154fe98e88a144859eb7050c532ac5` |
| [vn30_score.py](../../../../../tools/scoring/vn30_score.py) | `46dede310a344ac397efedc1f799605b19d60848d80162db759b94e7fb364bb6` |
| [vn30_score_worker.mjs](../../../../../tools/scoring/vn30_score_worker.mjs) | `49e6b49d4c953ea99c87d4a17c0822becf301691b2f759171ec2295cfdeb4489` |
| [current-scoring.ts](../../../../../src/infrastructure/source-admission/current-scoring.ts) | `6064bd14456dd6edd954ff3645fe9fddba346ae98f446ede69d7696666801b56` |
| [current-scoring-authority.ts](../../../../../src/infrastructure/source-admission/current-scoring-authority.ts) | `9b472360fbe1db8d18cab577d7c2cd67fb29be9e58a932a2610eeec310214471` |
| [current-review.ts](../../../../../src/infrastructure/source-admission/current-review.ts) | `6328642afc36f18f3c88c71c214656ab89ff08dcaae278b759f4795b428655e4` |
| [methodology.ts](../../../../../src/domain/scoring/methodology.ts) | `e7031bf6b00e38670016888928ceb941e5c3a524016a1f8ce84123aca6c7da41` |
| [INVESTMENT_POLICY.md](../../../../../docs/01%20SYSTEM/INVESTMENT_POLICY.md) | `7160610b4c415a08f4a88b5d20ca6cc079119d5da552791f0c26781da7bd8e4c` |
| [DECISION_FRAMEWORK_v1.0.md](../../../../../docs/01%20SYSTEM/DECISION_FRAMEWORK_v1.0.md) | `e1929fd8d8fe337c3d80fe2c76dfbd48e1f41d2d4b4a0618b42269b2635f8b1d` |
| [RISK_POLICY_v1.0.md](../../../../../docs/01%20SYSTEM/RISK_POLICY_v1.0.md) | `3785c1bb39b80435655a1621b2afbda992c38beaff82edebc0c67b0bc54ee744` |

| Bound object | SHA-256 |
| --- | --- |
| Assessment packet | `01f6f25cb636180641f73ad022eab878c89eb30f1eeb6802d2f3e45ded44ceea` |
| BANK reference | `ef2af7c8f081d175269e51eb6a66f1669a4a1c54708a6e2fa31c89e7201cbe6a` |
| 23-rubric scope receipt | `af4290663f00dfb9f17d601c67fca05c56d55a1f89a8defc546155944e642137` |
| Dated M1 candidate | `d14375c92ff1d9e291012ef9cfe1ad8f044553246e0609e3fa62bfd0caab3d1a` |

Preparation verified assessment scope, source pins and dataset lineage. Challenge verified the point and band reconciliation, two missing topics and exact M1 carry-forward. Both reports are draft reviews of the pinned packet. Testing the actual packet against the production `PinnedAiReviewVerifier` rejected it because the review and trusted pass bindings are absent. The existing trusted-review fixtures passed. No trusted passes are claimable for the final scoring packet until the two mandatory topics and the executable and methodology version are resolved.

[Preparation](TCB_TOPIC_PREPARATION_DRAFT_REVIEW.json) · [Challenge](TCB_TOPIC_CHALLENGE_DRAFT_REVIEW.json)

## Validation and owner decision

- **26 Vitest tests passed** across the TCB BANK dataset, current scoring consumer and AI review. The run used the existing temporary configuration for the server-only alias and single worker.
- **10 CLI regression tests passed.** Independently replayed the TCB adapter against the current SQLite database read-only, confirmed canonical data and exact fact lineage, and validated the packet evidence.
- Governed TCB `prepare` returned **BLOCKED** with `CANDIDATE_PIN_REQUIRED` for the executable and `CANDIDATE_REVIEW_BINDINGS_REQUIRED`. It stopped before runtime scoring validation and emitted neither a preflight hash nor an execution approval hash. Inventory reported no TCB score artifact.

The 23-rubric scope approval is already recorded. **There is no valid executable or scoring hash for the owner to approve now.** At the next mandatory owner gate, adopt the dated M1 candidate for this exact TCB assessment and approve the exact executable/methodology binding by the authority verifier's required statement `Approve exact current-purpose scoring authority <validated approvalPayloadHash> for CURRENT_FORMAL_VALUATION`. That signature must refer to a TCB limited candidate that accepts the approved three N/R dispositions and has qualified topic evidence or an expressly approved subject-specific disposition for the two missing topics. The later scoring decision requires the separate exact route digest emitted by `prepare` at `READY_FOR_CIO`. The existing ACB contract and approved rubric weights were preserved.
