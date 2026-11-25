# Structural Evaluation Gap Audit and Validation

Audited VNM, ACB and TCB at the 30 October 2026 economic cutoff on 23 November 2026. The companion Prepare entry point and shared register are implemented. The three cases were validated sequentially against the retained universe and qualified sector mapping.

| Ticker | M1 Prepare feasibility | Valuation feasibility | Investment Decision feasibility | Unified register |
| --- | --- | --- | --- | --- |
| VNM | PASS WITH LIMITATIONS | PASS WITH LIMITATIONS | BLOCKED | [19 gap rows](VNM_EVALUATION_FEASIBILITY.json) |
| ACB | PASS WITH LIMITATIONS | BLOCKED | BLOCKED | [29 gap rows](ACB_EVALUATION_FEASIBILITY.json) |
| TCB | PASS WITH LIMITATIONS | PASS WITH LIMITATIONS | BLOCKED | [23 gap rows](TCB_EVALUATION_FEASIBILITY.json) |

These are audit verdicts for retained evidence scopes. The native Prepare run supplied no new execution candidate and returned BLOCKED for the missing candidate pins and review bindings on each ticker. The live read-only inventory found one current dataset row for each exact scope. Inventory does not replace original acceptance or preflight. The companion and native Prepare responses matched after removing the added diagnostic field for all three runs. The SQLite database hash was unchanged and no journal sidecar appeared.

## M1 Prepare readiness audit

The existing Prepare command already checks qualified membership, sector, candidate pins, admitted dataset availability, evidence/topic bindings, reviews and the governed approval subject. The new companion delegates to it and adds the seven readiness checks in the issuer packet. It leaves the hash-pinned native CLI, executable worker and approval bundle intact.

- **VNM.** Reused the governed current scorecard and consumption receipt. The retained baseline has all 23 rubric rows rated and 43 points. Its scoring scope and source availability clocks do not establish historical PIT or investment action readiness.
- **ACB.** Reused exact V4 limited readback and V4 retained research closure. Its 14 rated rubrics, 18 points, 58/100 rated weight, null full score and nine N/R rows retain their original scope.
- **TCB.** Reused the isolated limited execution and BANK dataset readback. Its 20 rated rubrics, 47 points, 93/100 rated weight, null full score and three N/R rows retain their original scope. An active dataset row does not materialize that scoring artifact or authorize publication.

Each ticker has a historical-evidence inventory, mapping and metric review, separate admissibility finding, rubric feasibility and valuation/decision handoffs. The 12 retained N/R diagnoses are linked to their original immutable rows. No raw-to-consumer defect was demonstrated in the audited facts and no mapping repair or baseline change was applied.

## Valuation structural audit

Reviewed source and share-basis receipts, the scoring corporate-action dependency rules, S1–S5 sector guidance, the original scenario work and its admissibility. The ten checks in each packet cover metrics, denominator, action comparability, cash-flow normalization, sector method, assumptions, sensitivity, discount/return dependencies, PIT and confidence.

| Case | Reuse | Limitation and reopening condition |
| --- | --- | --- |
| VNM | Governed current metric dispositions, qualified retrospective share carry-forward and the S5 owner-earnings scenario set. | Original historical availability and action comparability require their own receipts. Terminal value, reinvestment and downside remain materially uncertain. Reopen on qualifying action evidence or independently challenged scenario inputs. |
| ACB | Common-equity and share history, approved BANK justified P/B method and retained capital headroom and exit sensitivity. | Sustainable ROE and cost of equity still span adjacent approved bands. Primary valuation remains N/R. Reopen on materially tighter support or an eligible independent long-run cross-check. |
| TCB | Reviewed share change, BANK capital and dataset readback, cutoff reconciliation and RWA/downside scenario work. | Retained conservative scoring does not close decision-grade forward assumptions. Reopen on integrated funding and capital stress evidence, eligible discount calibration or a stronger independent cross-check. |

No new intrinsic value, forward return, growth assumption or margin of safety was issued. The full valuation rows record whether retained evidence, a transform, an approved method or inherent uncertainty governs the limitation. For historical PIT, use the original source and admission clocks. A later report cannot certify the original observation.

## Investment Decision structural audit

Retained scores and research were compared to the M4 and M6.5.3 requirements for scorecard validity, Stage 0 and veto, adopted thesis, valuation and return, residual risk and hurdle, ownership and concentration, opportunity cost, technical overlay, cash and board lot, and exact human and operational authority. All three cases are BLOCKED for formal decision evaluation in this audit. VNM is low-confidence and non-actionable in its governed current artifact. ACB and TCB have limited coverage with no allocation eligibility. Scoring Stage 0 and risk evidence was reviewed within its retained scope. A complete, dated M6.5 decision packet was not established by this audit.

The per-ticker registers record the specific missing or unverified dependencies. The original review status, seven Decision States, risk and approval rules, and M6.3 portfolio/cash truth remain in their existing contracts. No Decision State, trade authorization, executable action or new portfolio record was produced.

## Root-cause and resolution matrix

Counts below are primary causes across 71 dependency rows, including inherited rubric diagnoses and separate handoffs where the same evidence affects more than one component. The linked packets are the unified register for each ticker and contain exact gap IDs, evidence paths and hashes, secondary causes, future-data results, impact, owners and approval requirements.

| Primary cause | Prepare | Valuation | Decision | Resolution |
| --- | ---: | ---: | ---: | --- |
| DATA_MISSING | 11 | 0 | 12 | Target the exact qualified fields or authoritative snapshot. |
| DATA_MAPPING_GAP | 0 | 0 | 0 | Replay a raw-to-consumer mismatch before any narrow adapter repair. |
| EVIDENCE_QUALIFICATION_GAP | 6 | 6 | 9 | Validate purpose and availability or supply the exact governed approval context. |
| METHODOLOGY_GAP | 0 | 0 | 0 | Use formal change control when no approved method covers the case. |
| INTERPRETATION_GAP | 4 | 2 | 6 | Use existing anchors or obtain an exact versioned interpretation decision. |
| STRUCTURAL_DESIGN_GAP | 0 | 0 | 0 | Escalate a demonstrated structural contract defect through Change Request. |
| LEGITIMATE_UNCERTAINTY | 2 | 10 | 3 | Preserve ranges and limitations until qualifying evidence narrows them. |

The same-format future-data test returned 64 NO and seven UNKNOWN. This includes decision and governance dependencies that annual financial reports cannot supply. One retained-evidence pass and one resolution review closed each case with explicit escalation. Three inherited interpretation proposals require owner approval before adoption. Their separate [Change Request proposal and rubric impact record](../../structural-nr-remediation/2026-11-23/STRUCTURAL_NR_AUDIT.md#owner-decisions-for-bank-structural-nr-interpretation-v01) covers ACB GQ-FWD, ACB VAL-PRIMARY and TCB CA-DIL. This release submits no revised scoring, valuation or decision artifact for approval.

Formal successor assessment and scoring approvals, M6.5 human and risk reviews, and materialization and publication authority remain separately scoped. In particular, opening a decision review requires a matching authoritative portfolio snapshot and the actual decision evidence. Qualifying future fields and scope details are in the register.

## Implementation and validation

- [Companion Prepare](../../../../tools/scoring/vn30_prepare_evaluation.py) and [evaluation register validator](../../../../tools/scoring/evaluation_gaps.py) add the audit without mutating the native inputs, route, approval digest or output status.
- [Governance contract](../../../03%20SCORING/STRUCTURAL_EVALUATION_GAPS_v1.0.md) and extensions to the [S1–S5 skill](../../../../skills/equity-s1-s5-assessment/SKILL.md), [Structural N/R skill](../../../../skills/vn30-structural-nr-remediation/SKILL.md), [formal Prepare handoff](../../../../skills/vn30-scoring-publication-hygiene/references/formal-scoring-handoff.md) and [retention skill](../../../../skills/vn30-scoring-publication-hygiene/SKILL.md) provide the reusable workflow.
- [Focused validation](../../../../tests/unit/test_evaluation_gaps.py) passed seven tests. The earlier N/R suite passed nine tests and the scoring CLI, cleanup and sequential rollout suites passed 31 tests. Tests cover subject and raw pin integrity, required checklist rows, bounded review, no inferred readiness or operational authority, and native Prepare status/hash preservation.
- Nine focused TypeScript suites passed **240 tests** using a temporary Node threads configuration, a server-only marker stub and Node 22.12.0 with experimental SQLite. Coverage includes scoring golden anchors, historical PIT and evidence clocks, economic normalization, M6.5 precedence and sector cases, read-only reuse of M6.3 portfolio facts, governed publication and BANK data.
- The broader run passed 325 tests and failed 32 in the M6.5 persistence and M6.3 ledger suites. Their test fixture invokes the legacy root scripts/database.mjs, which is also absent from HEAD. Populated migration variants timed out. This checkout-level test limitation leaves full persistence regression unverified. Focused domain and publication coverage, native Prepare equivalence, and live database byte verification passed.
- No new calculations, admission, score, portfolio or decision artifact, production write or publication was issued.
