# Structural N/R Audit and implementation validation

**PASS for the bounded diagnostic release.** Reviewed the 30 October 2026 baselines on 23 November 2026. All 12 existing N/R dispositions have a retained-evidence diagnosis and a closed research escalation. Ten future-data tests returned NO, two UNKNOWN and none YES. Three rows have a versioned interpretation proposal. No retained reviewed raw field established a mapping defect, and no approved anchor was shown to require redesign.

| Ticker | Baseline checked | Existing N/R | Diagnostic execution |
| --- | --- | ---: | --- |
| VNM | Governed 43-point current score, 23 rated rubrics. Linked production and PUB-04 readbacks. | 0 | exec-bc82fc35f62dd69cd19fe025 |
| ACB | Governed V4 successor readback. 14 rated rubrics, 18 points across 58/100 rated weight, bounds 18–60, full score null. | 9 | exec-f8890120d812f4f87322d465 |
| TCB | Exact isolated limited execution. 20 rated rubrics, 47 points across 93/100 rated weight, full score null. | 3 | exec-1acdc8fffb4b1182c47d0b3b |

The [VNM](VNM_DIAGNOSTIC.json), [ACB](ACB_DIAGNOSTIC.json) and [TCB](TCB_DIAGNOSTIC.json) packets pin the actual artifacts, authority and readback receipts, baseline clocks and rubric registry. ACB and TCB were each reviewed in one retained-evidence pass and one resolution review. VNM ended at inventory. The comparison used the scorecard and scoring methodology, sector-specific M3/M4 guidance, retained ACB V4 research and TCB source and stress reviews, current/PIT evidence checks, exact-execution gates and publication receipts. Historical drafts were treated as research context. The audit made no new acquisition and introduced no new PIT claim.

## Change-impact matrix

All rows below remain **N/R with null points**. The issuer packet links exact source paths, SHA-256 pins and locators. Its future-data rationale addresses the same-reporting-structure counterfactual for that row. Approval below refers to the proposed interpretation rule. A future score successor always requires its own existing approvals.

| Ticker and rubric | Retained evidence | Primary and additional cause | Future data | Action | Status | Remaining blocker | Owner approval |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ACB BQ-MOAT | [ACB_V3_FOUR_TOPIC_EVIDENCE](ACB_DIAGNOSTIC.json) | DATA_MISSING | NO | Escalate to targeted segment-retention and servicing-cost disclosure. | Escalated | Comparable retention, churn and servicing economics for the same customer segment. | Existing successor gates only |
| ACB FH-LIQ | [ACB_FH_PUBLIC_EVIDENCE_REGISTER](ACB_DIAGNOSTIC.json) | DATA_MISSING | NO | Escalate to a dated 30-day liquidity bridge with haircuts and overlap controls. | Escalated | Incremental facility availability, eligible collateral, overlap and behavioral retention. | Existing successor gates only |
| ACB FH-STRESS | [ACB_OWNER_EVIDENCE_REVIEW_V11](ACB_DIAGNOSTIC.json) | DATA_MISSING | NO | Escalate to a paired funding and capital stress review using same-scope inputs. | Escalated | Viable stressed funding response, costs and post-stress eligible capital/RWA. | Existing successor gates only |
| ACB GQ-FWD | [ACB_SOURCE_RULE_REVIEW_2026-11-21](ACB_DIAGNOSTIC.json) | EVIDENCE_INTERPRETATION_GAP + DATA_MISSING | NO | Propose interpretation review for a jointly reconciled forward BANK scenario and adjacent-band challenge. | Escalated | Consistent forward growth, margins, credit costs and capital/RWA. | Yes |
| ACB IC-POS | [ACB_BAND_SELECTION_2026-11-21](ACB_DIAGNOSTIC.json) | DATA_MISSING | NO | Escalate to same-denominator segment-position evidence. | Escalated | Comparable segment share or distribution evidence with a defined denominator. | Existing successor gates only |
| ACB VAL-PRIMARY | [ACB_BAND_SELECTION_2026-11-21](ACB_DIAGNOSTIC.json) | EVIDENCE_INTERPRETATION_GAP + DATA_MISSING | UNKNOWN | Propose interpretation review of the approved justified P/B method and the ROE/Ke sensitivity required to defend a band. | Escalated | Sustainable ROE and sourced Ke or an eligible comparable long-run valuation cross-check. | Yes |
| ACB RG-GOV | [ACB_USER_PDF_REVIEW](ACB_DIAGNOSTIC.json) | DATA_MISSING | NO | Escalate to transaction-specific evidence of recusal, pricing oversight or equivalent controls. | Escalated | Evidence of actual conflict handling and oversight for ACB Insurance. | Existing successor gates only |
| ACB RG-RISK | [ACB_SOURCE_POLICY_CLOSURE_V12](ACB_DIAGNOSTIC.json) | DATA_MISSING | NO | Escalate to same-scope gross and net exposure and commercial terms. | Escalated | Actual transaction terms, amounts and mitigation effectiveness. | Existing successor gates only |
| ACB CA-REINV | [ACB_CA_REINV_FOLLOWUP_2026-11-21](ACB_DIAGNOSTIC.json) | DATA_MISSING | UNKNOWN | Retain N/R and register the specific subsidiary fields and timing as the reopening trigger. | Escalated | Matched consolidated ACBS and ACBA LNST plus paid-in amounts and deployment dates. | Existing successor gates only |
| TCB FH-STRESS | [TCB_BEAR_RWA_EARNINGS_SENSITIVITY](TCB_DIAGNOSTIC.json) | DATA_MISSING | NO | Escalate to a TCB-specific funding availability and post-stress capital bridge. | Escalated | Combined provisioning, funding and RWA stress with verified post-stress resources. | Existing successor gates only |
| TCB CA-DIST | [TCB_NINE_RUBRIC_RESEARCH_CLOSURE](TCB_DIAGNOSTIC.json) | DATA_MISSING | NO | Escalate to an eligible dated retained-capital return and liquidity review. | Escalated | Marginal return on retention plus pre-distribution excess liquidity at stressed capital levels. | Existing successor gates only |
| TCB CA-DIL | [TCB_CA_DIL_ESOP_HISTORY_REVIEW](TCB_DIAGNOSTIC.json) | EVIDENCE_INTERPRETATION_GAP + DATA_MISSING | NO | Propose interpretation review of how documented issue economics and substantiated benefits are challenged against both approved anchors. | Escalated | Attributable ESOP offsets or evidence bounding net per-share economics without assumed offsets. | Yes |

## Owner decisions for BANK-STRUCTURAL-NR-INTERPRETATION-v0.1

These are research proposals against the existing BANK anchors. Adoption requires owner approval of the exact text and impact review before use in an authorized successor.

- **ACB GQ-FWD.** Define a minimum coherent forward scenario tying growth, net interest margin, credit costs and capital/RWA on the same basis. Challenge the band against both the representative and adverse cases. A historical growth or margin trend alone cannot establish the forward band.
- **ACB VAL-PRIMARY.** Specify the evidence and sensitivity required to justify a representative BANK P/B band. Use a supported sustainable ROE and cost-of-equity range and the approved justified P/B convention. Show which inputs move the result across approved boundaries. The retained premium range still spans adjacent bands.
- **TCB CA-DIL.** Require a challenge against both existing anchors using effective-date issue terms, proceeds and economic per-share effects. Test whether substantiated offsets, or a defensible upper bound on them, change the classification. Aggregate staff turnover is insufficient to infer ESOP-specific benefits. Escalate to formal design change control if the approved binary anchors still leave a documented economic scenario unclassifiable.

There is no score change submitted for approval. Any future baseline-impacting repair or adoption must bind the ticker, cutoff, dataset, methodology, exact executable and reviewed assessment. Production materialization and publication remain separate approvals. The unrelated existing TCB production acceptance work remains outside this release.

## Implementation and regression

- Governance entry points are [Scoring Engine](../../../03%20SCORING/SCORING_ENGINE.md) and [Structural N/R Remediation v1.0](../../../03%20SCORING/STRUCTURAL_NR_REMEDIATION_v1.0.md).
- Reusable workflow is [vn30-structural-nr-remediation](../../../../skills/vn30-structural-nr-remediation/SKILL.md), linked from the evidence closure skill and registered in the sequential prepare guard with required sector and a packet-bound execution ID.
- [Validator](../../../../tools/scoring/structural_nr.py) reads pinned baseline and row evidence, enforces complete N/R coverage and the bounded review record, checks timing, band and exact JSON mapping contracts, and emits only diagnostic output. It relies on designated reviewers and standard gate verifiers for the authenticity and applicability of claimed admissions and economic judgments.
- [Nine focused tests](../../../../tests/unit/test_structural_nr.py) passed, covering the retained cases, sequential execution, idempotence, multi-ticker rejection, pin and scope checks, bounded review, null points, proposal-only rules, lowest band, PIT isolation and raw mapping. Existing Python scoring CLI, cleanup and rollout regression suites passed 31 tests.
- Eight TypeScript suites passed **135 tests**, covering scoring and golden anchors, methodology, evidence clocks, historical PIT selection, source publication, governed current publication and BANK data. The local Node 22.12.0 run used a temporary Node/threads config, a server-only marker stub and the experimental SQLite flag. The default Vitest invocation hit fork-worker startup timeouts. The first Node-config attempt needed the SQLite flag for the current-publication suite. The temporary configuration was removed.
- No scoring engine, bands, weights, live adapter, admission or approval implementation, route registry or database was changed by this release. No score or publication command ran against a live store. No source PDFs, raw files, canonical output or historical approvals were pruned.
