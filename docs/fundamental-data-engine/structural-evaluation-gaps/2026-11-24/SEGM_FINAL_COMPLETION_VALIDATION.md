# SEGM Final Rubric Completion v1.0 validation

**PASS_WITH_LIMITATIONS.** The read-only integration and focused regression passed. None of the three issuers produced a successor score. The 30 October 2026 economic cutoff was used for the exact retained score and review artifacts. A separate preflight checked 15 November, the endpoint of the pinned VN30 universe coverage. Its three checks lacked an admitted current dataset, registered adapter and exact scoring authority at that cutoff.

## Implementation and verification

- The existing annual reassessment selector now checks filing publication by the economic cutoff even for current-purpose analysis. It retains separate historical known-at checks, the existing provisional policy and the annual basis across interim periods. The wrapper validates reviewed inputs and reports coverage. It rejects ungoverned proxy declarations. Issuer-specific FY successor packets were unavailable for this run. Annual scenario and cutoff logic was tested with fixtures.
- The native Prepare companion accepts `--rubric-completion`, binds the retained structural packet to ticker, sector, cutoff and universe, and reports resolved and escalated rubric IDs with no authority effect. Existing economic rules, scoring anchors, model, source mappings and authority gates were used. The bounded evidence review found no demonstrated raw mapping or normalization defect requiring a repair.
- Focused regression passed 42 Python tests and 209 TypeScript tests covering scoring golden, evidence clocks, current formal scoring, consumer and Decision suites. Current parity and `git diff --check` passed. Verified SHA-256 on the stored VNM and ACB SQLite bodies in read-only mode. The TCB isolated artifact ID was absent from the main store.

## Sequential reproduction at 30 October 2026

| Ticker | Rubrics rated before → after | N/R | Points and rated weight | Score execution | Valuation | Decision |
| --- | ---: | ---: | --- | --- | --- | --- |
| VNM | 23 → 23 | 0 | 43/100, 100% | Blocked by missing registered adapter and exact authority. Companion rejected INDUSTRIAL packet against current RETAIL. | Pass with limitations | Blocked |
| ACB | 14 → 14 | 9 | 18/58, 58%, full score null | Returned previously completed V4. Separate check failed with `GOVERNED_WORKER_RUNTIME_FAILED`. | Blocked | Blocked |
| TCB | 20 → 20 | 3 | 47/93, 93%, full score null | Blocked by missing exact scoring authority. Prior isolated run only. | Pass with limitations | Blocked |

Existing scorecards expose SCORED and N/R. Separate VERIFIED and CONSERVATIVE totals are unavailable for those cards. The companion found zero newly resolved research rows for both banks. Native Prepare lacked candidate pins for adapter, assessment, reference, executable and review bindings. The read-only M1 feasibility verdict was pass with limitations for all three. The valuation and decision verdicts are their stored-input feasibility results.

Next execution requires a reconciled and approved VNM sector binding, an ACB executable matching its existing approved manifest or an approved successor manifest, and exact TCB successor authority. The ACB route pins `ACB_OFFICIAL_LIMITED_V3_EXECUTABLE_APPROVED.json`; current hashes differ on scorecard, limited coverage, current-scoring consumer and authority, worker and parity tool. This drift is independent of the Python companion changes. Stored VNM PUB-04 and ACB V4 results remain the evidence for existing publication status. No successor is eligible for publication from this run.

## Remaining rubric evidence

All rows retain null points. The linked diagnostic audit identifies the exact retained evidence and pins, plus the counterfactual test for a further report of the same structure. Ten tests returned NO and two UNKNOWN. [Diagnostic evidence and source matrix](../../structural-nr-remediation/2026-11-23/STRUCTURAL_NR_AUDIT.md)

| Ticker | Rubric | Reopening evidence or action |
| --- | --- | --- |
| ACB | BQ-MOAT | Obtain comparable retention, churn and servicing economics on the same client segment. |
| ACB | FH-LIQ | Reconcile dated 30-day liquidity sources, collateral haircut, facility availability and overlaps. |
| ACB | FH-STRESS | Reconcile stressed funding cost and availability with post-stress capital and RWA. |
| ACB | GQ-FWD | Review a coherent forward scenario joining growth, margins, credit cost and capital/RWA under the proposed interpretation. |
| ACB | IC-POS | Obtain comparable segment share or distribution with a common denominator. |
| ACB | VAL-PRIMARY | Support sustainable ROE and cost of equity or an eligible long-run cross-check, then challenge the justified P/B band under the proposed interpretation. |
| ACB | RG-GOV | Obtain transaction-specific ACB Insurance conflict handling and pricing oversight evidence. |
| ACB | RG-RISK | Obtain exposure, terms and effectiveness of mitigation on a matched scope. |
| ACB | CA-REINV | Match consolidated ACBS and ACBA profit to paid-in amounts and deployment dates. |
| TCB | FH-STRESS | Reconcile provisioning, funding and RWA in one stress with verified available resources. |
| TCB | CA-DIST | Establish marginal return on retained capital and pre-distribution excess liquidity at stress capital. |
| TCB | CA-DIL | Bound net ESOP per-share economics from issue terms, proceeds and substantiated offsets under the proposed interpretation. |

Existing BANK change request `BANK-STRUCTURAL-NR-INTERPRETATION-v0.1` covers ACB GQ-FWD, ACB VAL-PRIMARY and TCB CA-DIL. The proposal retains the current anchors. The impact remains three potential N/R conversions across two BANK issuers and requires approval of the exact interpretation, adjacent-band review and regression before use. No new production publication or Decision authority was issued.
