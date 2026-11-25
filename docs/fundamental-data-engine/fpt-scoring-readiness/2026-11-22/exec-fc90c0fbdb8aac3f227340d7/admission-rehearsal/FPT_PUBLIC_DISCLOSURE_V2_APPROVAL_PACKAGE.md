# VN30 framework v2.0 · proposed band maps and acceptance

FPT / TECHNOLOGY / 13/11/2026. **Technical PASS_WITH_LIMITATIONS. Scoring coverage incomplete.** The five executable band maps are proposed calibrations and do not amend M3 or enter an official candidate. Existing methods continue to use the 23 approved rubric IDs and the 100-point weights. No production activation, authority, publication or commit.

## Exact proposed bands

| Rubric | Old acceptance | v2 proposed boundaries and sufficient evidence | Counter-evidence and sensitivity |
|---|---|---|---|
| FH-STRESS | Required liquidity/funding/capital evidence and v1.0 required granular maturity fields and a reviewed stable band. | Public base/downside/severe net funding headroom with separately reviewed financing response. Score 0 if evidenced failure and downside is negative; 1 when downside is negative and observed financing response is distressed; 2 if downside is negative otherwise. Base deficit without explained financing returns N/R. If downside survives, 3 for severe deficit or material constraints, 4 if severe survives with manageable constraints, 5 for severe survival with no emergency action. Zero gap counts as nonnegative. | Use deposit availability bounds, no invented credit line, add liabilities and stress effects consistently. Compare leverage, interest capacity and CFO against the stress conclusion. Conflicting response/headroom returns N/R. Keep unresolved refinancing warnings separate. |
| GQ-INC | Tested variable capital denominator and required same-scope M&A adjustment. | Proposed return proportional to sector-appropriate cost: 0 below zero, 1 from zero to below 0.5× cost, 2 from 0.5× to below 1×, 3 from 1× to below 1.25×, 4 from 1.25× to below 1.5×, 5 from 1.5× cost. Entire defensible range must share the same band. 4/5 require persistence. | Match scope and allocate or bound material M&A using public bridge; no confidential deal model. Reject unsupported near-zero/negative increments and changed scope. Challenge operating capital classifications and time windows without turning BQ-EQ into another score. |
| VAL-PRIMARY | v1.0 sensitivity gate required same anchor across scenarios. | Price/normalized intrinsic comparison is implemented as value divided by raw close. Points 0 through 8 start at lower limits −∞, 0.65, 0.80, 0.90, 0.95, 1.05, 1.15, 1.25, 1.40 respectively. Base and independent check must be within one band; take the lower. For scores ≥5, cap at the conservative band plus one, with a floor of 4 for that cap. | Bear/Base/Bull need ordered positive values, same FTEL basis, eligible raw price and independent cross-check. Bear need not equal base band. Conservative downside may cap the rating. Weak P/E alone cannot enter this rule. |
| CA-REINV | Review capex, acquisitions and exits; project IRR was treated as an ideal measure in earlier research. | Public decision/outcome bridge for ≥2 decisions and evidenced follow-up. 0 for ≥2 adverse outcomes outnumbering accretive; 2 if all reviewed outcomes are accretive; 1 for other identified mixes or partly classified results; N/R when no attributable outcomes. | Challenge impairments, disposals and post-deployment cash outcome. Use company-level decisions and reviews, no private project IRR. Count a decision once and never reuse incremental ROIC as an outcome conclusion. |
| CA-DIL | Required net per-share impact and discussion of unknown offsets. | Compound per-event observable effects. Proposed 0 at cumulative loss ≥1%. Proposed 1 for nonnegative cumulative effect with shareholder protection and complete treatment of material issues. Other negative values or incomplete coverage are N/R. | Use eligible issue-date price, actual proceeds, comparable before/after shares, EPS and restrictions. Unique ESOP events only. No estimate of private employee-retention value. The 1% cutoff is an unapproved research calibration. |

Bank, securities and insurance are routed to sector equivalents rather than borrowing these industrial maps; the ESOP rule requires its own event evidence across sectors. Thresholds are explicit research proposals, not calibrated on FPT. Remaining model approval must validate thresholds, reporting/timing windows, cross-company applicability and governance. Existing score adoption and publication gates are untouched.

## Real FPT run

Pinned [v2 input](FPT_PUBLIC_DISCLOSURE_V2_INPUT.json) canonical hash `a4d46d5f6bde9fc0e4f0d61d94fd509e4d5225a635a3e058bc8330e998d366c8`. The CLI verifies retained field and SEGM pins, calls the actual read-only EBCS on the exact retained reviewed input, and rejects disagreement with any previously accepted score. It then joins existing lineage, topics, financial scope, cutoff, anchors and explicit dispositions to 23 rows. A proposed method cannot change the approved EBCS output. An optional research review must bind the exact subject and calculation and use pre-cutoff source and counter-evidence pins. This does not create EBCS assessment acceptance for a new methodology.

- FH-STRESS: debt/equity 48.17%, EBIT/interest 13.57×; 25% deposit case goes from −1.240 to +0.599 trillion VND based on cash return. No supported net headroom for full obligations and funding response. Risk warning retained.
- GQ-INC: 12.39–31.96% vs 2.72–6.10% across tested windows. No comparable economic range after classification and M&A, no reviewed exact capital-cost comparison.
- VAL-PRIMARY: historical P/E 18.41× and indicative Bear/Base/Bull 20,645 / 38,503 / 91,233 VND/share. These assumptions do not establish normalized post-FTEL earnings, independent value or the conservative value needed by the mapper.
- CA-REINV: capex 5.098 and FCF 5.038 trillion VND. No sufficiently documented decision/outcome counts and public follow-up for the proposed mapping.
- CA-DIL: FY2025 ESOP 10,260,939 shares, proceeds 102.609 billion VND, no-offset mechanical fraction 0.6927%. This is not event-level economic loss. Correct event-date observable valuation and evidenced shareholder protections remain open.

Confidence is low for assigning new bands. Five proposed scores are null. Before/after FY2025 research is **18/23, 40/79** after carrying the other 18 retained FY ratings into the reconciliation. Those ratings were retained, not independently re-derived. Approved EBCS is **3/23, 5/12** and V8 **2/23, 5/10**. No full score. [Exact source and field acceptance](../FPT_REGULATORY_FIVE_RUBRIC_ACCEPTANCE.md)

## 23-rubric reconciliation

| Rubric | FY research | v2 research view | Approved EBCS | Official V8 | Reconciliation condition |
|---|---:|---:|---:|---:|---|
| BQ-EQ | 5 | 5 | N/R | N/R | FINANCIAL_SCOPE_CONFLICT |
| BQ-MOAT | 3 | 3 | 3 | 3 | BASELINE_ACCEPTED |
| BQ-CASH | 3 | 3 | N/R | N/R | FINANCIAL_SCOPE_CONFLICT |
| BQ-RES | 3 | 3 | N/R | N/R | INSUFFICIENT_ESSENTIAL_EVIDENCE |
| FH-BS | 3 | 3 | N/R | N/R | INSUFFICIENT_ESSENTIAL_EVIDENCE |
| FH-LIQ | 2 | 2 | N/R | N/R | INSUFFICIENT_ESSENTIAL_EVIDENCE |
| FH-STRESS | N/R | N/R | N/R | N/R | EARLIEST_OBLIGATION_COVERAGE_NOT_BOUNDED; PROPOSED_BAND_INPUTS_UNSUPPORTED: base_gap, downside_gap, severe_gap, funding_response |
| GQ-HIST | 3 | 3 | N/R | N/R | UNAPPROVED_METHODOLOGY |
| GQ-FWD | 3 | 3 | N/R | N/R | INSUFFICIENT_ESSENTIAL_EVIDENCE |
| GQ-INC | N/R | N/R | N/R | N/R | M_AND_A_AND_OPERATING_CAPITAL_SCOPE_UNRESOLVED; PROPOSED_BAND_INPUTS_UNSUPPORTED: return_low, return_high, capital_cost, scope_reconciled, persistent_productivity |
| IC-IND | 2 | 2 | 2 | 2 | BASELINE_ACCEPTED |
| IC-POS | 2 | 2 | N/R | N/R | INSUFFICIENT_ESSENTIAL_EVIDENCE |
| IC-CYCLE | 1 | 1 | N/R | N/R | INSUFFICIENT_ESSENTIAL_EVIDENCE |
| VAL-PRIMARY | N/R | N/R | N/R | N/R | NORMALIZED_DENOMINATOR_AND_INDEPENDENT_VALUE_RANGE_UNRESOLVED; PROPOSED_BAND_INPUTS_UNSUPPORTED: price, bear, base, bull, conservative_value, cross_check, normalized_same_scope |
| VAL-RET | 2 | 2 | N/R | N/R | MATERIAL_COUNTER_EVIDENCE |
| VAL-MOS | 1 | 1 | N/R | N/R | MATERIAL_COUNTER_EVIDENCE |
| RG-GOV | 3 | 3 | N/R | N/R | INSUFFICIENT_ESSENTIAL_EVIDENCE |
| RG-RISK | 2 | 2 | N/R | N/R | INSUFFICIENT_ESSENTIAL_EVIDENCE |
| RG-UNC | 0 | 0 | 0 | N/R | BASELINE_ACCEPTED |
| CA-REINV | N/R | N/R | N/R | N/R | PUBLIC_DECISION_TO_OUTCOME_BRIDGE_UNRESOLVED; PROPOSED_BAND_INPUTS_UNSUPPORTED: reviewed_decisions, accretive_outcomes, destructive_outcomes, follow_up |
| CA-DIST | 1 | 1 | N/R | N/R | FINANCIAL_SCOPE_CONFLICT |
| CA-DIL | N/R | N/R | N/R | N/R | ISSUE_DATE_VALUE_BASIS_AND_MATERIALITY_RULE_UNRESOLVED; PROPOSED_BAND_INPUTS_UNSUPPORTED: event_effects, all_material_events_reviewed, minority_protection |
| CA-PSV | 1 | 1 | N/R | N/R | FINANCIAL_SCOPE_CONFLICT |

## Cross-ticker and governance

VNM, ACB and TCB were checked sequentially. All retained baseline pins matched. Qualified sector VNM is RETAIL and the proposal did not assign a band without a matched band-input packet. ACB and TCB are BANK; their nonfinancial methods were rejected. Their historical outcomes are unaffected. These are real boundary/compatibility checks, not complete empirical calibration of all bands across the three issuers. Read-only SQLite revalidated V8 SHA-256 `4eed8f0bf117e332fb56855df7702f1026182120e04f2f91bacc3880fe446b20`, VNM and ACB artifact hashes; TCB has no official row in that store. No official successor written.

Approve or reject the five proposed mappings as one package after calibration. Specify acceptable sectors, materiality, documentary review and downside assumptions. Keep any exact successor assessment/data/executable/scoring approvals and publication permissions separate. The current scope does not grant any of those authorities.

## Implementation and test evidence

Changed `tools/scoring/public_disclosure_v2.py`, `tools/scoring/vn30_public_disclosure.py`, `tests/unit/test_public_disclosure_v2.py`, the pinned v2 input and this package. Passed 61 Python and 74 TypeScript tests, including five publication tests with the temporary Node server-only alias. Current parity and git diff --check passed. New cases cover all cash-stress point boundaries, productivity/WACC boundaries and scope, independent valuation with cross-band scenarios, 0/1/2 decision outcomes, ESOP boundaries, repeated-event rejection, and the exact 23-rubric real FPT readback. No commit.
