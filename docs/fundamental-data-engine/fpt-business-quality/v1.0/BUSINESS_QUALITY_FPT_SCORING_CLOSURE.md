# Business Quality and real FPT scoring closure

**Implementation verdict · Pass for isolated research.** The owner accepted and closed BQ-MOAT M01–M10 and authorized the bounded BQ-CASH and BQ-RES amendments in sections 5–6 of the retained direction. The approval record pins the accepted BQ-MOAT result and both methodology identities. Starting HEAD was `423a57a8c75c5019305173bf9fe9ce1f4aa1582a`. [Owner direction](OWNER_REQUEST.txt) · [Approved amendments and BQ-MOAT closing record](../../../03%20SCORING/BUSINESS_QUALITY_CASH_RES_AMENDMENTS_v1.0.json)

**Operational verdict · 14/25 Business Quality, PROVISIONAL**, with all four rubrics contributing at their original weights. Both new rubrics score 3 at the FY2025 foundation and N/R on the 13 November 2026 current reassessment. Their eligible prior points contribute provisionally while material cash-realization and operating-resilience dependencies remain under review.

## Evidence contract and implementation

| Scope | Implementation |
|---|---|
| BQ-CASH /6 | `scoreCashRealization` requires realization and recognition, applies explicit conditional materiality to one-offs, working capital and the CAPEX split, and validates stronger evidence and exceptional recurring realization at the upper points. Bank recognition and property collection routes remain available instead of mechanical CFO/NPAT. |
| BQ-RES /5 | `scoreBusinessResilience` requires concentration and cyclicality, permits qualified concentration alternatives, checks material pricing evidence and applies band-dependent stress. Five points require severe plausible stress, franchise protection, absence of distressed capital actions, exceptional justification and reviewed counterevidence. |
| Incremental and Effective Score | `scoreIncrementalCashRealization` and `scoreIncrementalBusinessResilience` use the existing generic lifecycle, historical retention and effective-score resolver. Affirmative evidence is required for certified current inheritance. Pending uncertainty allows eligible provisional points while expiry and confirmed invalidation block their use. |
| Full BQ and downstream | `aggregateFullResearchBusinessQuality`, `rankFullResearchBusinessQuality` and `buildFullResearchBusinessQualityDecisionInput` invoke the existing research arithmetic and consumer functions. Coverage distinguishes accepted current points and provisional points for all four BQ rubrics. |
| Real replay and view | The isolated CLI hash-checks the approval, exact BQ-MOAT replay and retained FPT inputs, validates issuer, span, scope, unit and source locators, computes the cash products, executes both lifecycles, and emits a result or local HTML scorecard. |

The registry remains the source of the exact bands and weights. Four separate economic channels remain in use. BQ-EQ assesses realized returns, BQ-MOAT the competitive mechanism, BQ-CASH the conversion and recognition of earnings, and BQ-RES the business response to operating shocks. Shared evidence is used for those distinct implications. The cash CAPEX observation supports cash conversion here; investment productivity and funding sufficiency remain outside this assessment. Operating shock exposure is distinct from FH-STRESS financing capacity and RG-RISK residual risk.

[Validators and cash calculations](../../../../src/domain/current-scoring/bq-cash-res-research.ts) · [Lifecycle adapters](../../../../src/domain/current-scoring/bq-cash-res-incremental.ts) · [Aggregation and consumers](../../../../src/domain/current-scoring/research-full-business-quality.ts) · [Executable](../../../../tools/scoring/validate_fpt_business_quality.mjs) · [Local research scorecard](../../../../src/ui/research-full-business-quality.tsx) · [Assessment guidance](../../../../skills/equity-s1-s5-assessment/SKILL.md)

## BQ-CASH financial foundation and incremental analysis

Consolidated values in **VND trillion**, rounded. FY balance-sheet rows are year-end, as reported in the original audited version. Latest values are 9M or 30 September 2026. CAPEX is expressed as a positive cash outflow.

| Metric | FY2022 | FY2023 | FY2024 | FY2025 | 9M2026 |
|---|---:|---:|---:|---:|---:|
| Revenue | 44.010 | 52.618 | 62.849 | 70.113 | 40.023 |
| Reported consolidated NPAT | 6.491 | 7.788 | 9.427 | 11.232 | 7.776 |
| Fully normalized NPAT | N/A | N/A | N/A | N/A | N/A |
| FX-only NPAT sensitivity | 6.497 | 7.761 | 9.464 | 11.210 | N/A |
| CFO | 5.054 | 9.517 | 11.704 | 10.136 | 0.952 |
| Total cash CAPEX | 3.215 | 3.978 | 3.275 | 5.098 | 2.029 |
| FCF after total cash CAPEX | 1.839 | 5.539 | 8.428 | 5.038 | −1.077 |
| Short-term receivables, line 130 | 8.503 | 9.674 | 11.382 | 14.402 | 13.064 |
| Inventory net, line 140 | 1.966 | 1.593 | 1.857 | 2.194 | 1.965 |
| Short-term supplier payables, line 311 | 3.209 | 2.603 | 4.424 | 3.837 | 1.907 |

The input retains canonical fact IDs by array index, audited report variant/row/page locators and the exact Q3 PDF hash with reviewed original cells. The 9M consolidated NPAT was checked visually at Q3 physical page 7 line 60 and reconciled as **8,770,160,739,433 − 1,083,828,799,171 + 90,110,530,089 = 7,776,442,470,351 VND**. The cash-flow figures are Q3 page 10 lines 20–21 and inventory/payables are physical pages 3 and 5. FY2025 originally reported short-term receivables of 14.402 trillion. The Q3 comparative presentation reclassifies 0.394 trillion to short-term financial investments, giving 14.008 trillion on that presentation basis. The remaining 2026 balance comparison also spans the FTEL scope transition. [Financial pointers and input](FPT_BUSINESS_QUALITY_INPUT.json) · [Existing FTEL bridge](../../fpt-scoring-readiness/2026-11-22/exec-fc90c0fbdb8aac3f227340d7/FPT_BQ_EQ_INVESTED_CAPITAL_BRIDGE_2026-11-23.md)

| Window and denominator | CFO | FCF | NPAT basis | CFO conversion | FCF conversion |
|---|---:|---:|---:|---:|---:|
| FY2022–25 reported consolidated NPAT | 36.411 | 20.844 | 34.939 | 104.21% | 59.66% |
| FY2022–25 FX-only sensitivity | 36.411 | 20.844 | 34.933 | 104.23% | 59.67% |
| FY2023–25 reported consolidated NPAT | 31.357 | 19.005 | 28.448 | 110.23% | 66.81% |
| FY2023–25 FX-only sensitivity | 31.357 | 19.005 | 28.435 | 110.27% | 66.84% |
| 9M2026 reported consolidated NPAT | 0.952 | −1.077 | 7.776 | 12.24% | −13.85% |

Conversions divide the sum of same-scope cash flows by the sum of compatible earnings. FCF subtracts total cash CAPEX; maintenance and growth CAPEX are unsplit. The FX-only sensitivity adds the signed B03 remeasurement adjustment after an illustrative 20% tax effect. It leaves other recognition and tax effects open. The executable therefore leaves the fully normalized denominator and conversion null. It rejects negative, economically immaterial, unavailable or scope-mismatched denominators.

The B03 investment-gain reversals were −1.987, −1.976, −1.725 and −2.576 trillion in FY2022–25. These are aggregate adjustments and do not isolate exceptional after-tax income. Provision adjustments ranged from 0.651 to 1.149 trillion. The historical FY2025 CFO absorbed 2.875 trillion from receivables, 0.335 from inventory and 0.596 from prepayments, with a 2.556 trillion offset in the payables cash-flow line. Note that supplier payables are a narrower balance-sheet field than that cash-flow line. The assessment separates provisions, unrealized FX, investing gains and disposal/investing cash lines. Capitalized costs, related-party receivables, reversal attribution and the recurring versus exceptional components do not have adequate item-level normalization for a higher band. Positive FCF throughout FY2022–25, plus worsened FY2025 cash and CAPEX economics, support **3/6, Adequate realization with material qualifications**.

In 9M2026, cash-flow movements in receivables, inventory, payables and prepayments absorbed 1.534, 1.199, 0.546 and 0.947 trillion respectively. The 3.541 trillion aggregate investing/financial gain adjustment contains equity-accounted income; the 2.220 trillion income-statement equity-method line cannot be attributed completely to FTEL. The 0.713 trillion loss-of-control cash outflow is investing line 26b and stays outside CFO and CAPEX. The publication sequence reviewed Q1 on 24 April, Q2 on 27 July, reviewed H1 on 21 August, Q3 on 28 October, and eligible subsequent developments through 13 November. Q1 FCF was −3.437 trillion, H1 −2.482 trillion and 9M −1.077 trillion. April–September FCF recovered to +2.360 trillion on the post-transition basis. The 9M shortfall is adverse evidence; subsequent recovery and the missing comparable earnings and working-capital bridge leave persistent invalidation unproven. **Current N/R, MATERIAL_REVIEW_PENDING, 3/6 PROVISIONAL**. [Retained current financial review](../../fpt-scoring-readiness/2026-11-22/exec-fc90c0fbdb8aac3f227340d7/FPT_Q3_FINANCIAL_RUBRIC_REVIEW_2026-11-23.md) · [Publication chronology](../../fpt-scoring-readiness/2026-11-22/exec-fc90c0fbdb8aac3f227340d7/admission-rehearsal/FPT_ANNUAL_BASELINE_INCREMENTAL_SCORING_REVIEW.md)

## BQ-RES operating resilience

| Dimension | Evidence | Economic implication | Materiality | Limitation |
|---|---|---|---|---|
| Customer and project concentration | 266 clients meeting the FY2025 USD 1m revenue threshold. USD 225m three-year US managed-services contract. The Q3 disclosure concerns receivable concentration below 10%. | Diverse observed customer activity and some contractual visibility. The named contract may also create dependency. | Material. Qualified alternatives support the annual lower balanced band. | Top-client revenue shares are undisclosed; the receivable metric and total multi-year contract value cannot substitute for annual revenue shares. |
| Geography and segment mix | FY annual reports cover four international IT regions. US growth slowed to 8.6% in FY2023 while APAC rose 37.7%. 9M international IT accounts for approximately 71.3% of consolidated revenue. FTEL became an equity-method investment from January. | Geographic offsets cushioned uneven demand historically. The change in group exposure increases the relevance of international demand and reported mix. | 2026 impact on the resilience band unresolved. | Geography and segments do not establish customer diversification. Retained FTEL economics do not restore prior operating mix. |
| Cyclicality and stress | International IT revenue/PBT of 24.288/3.782, 30.953/4.770 and 35.382/5.467 trillion FY2023–25; PBT margins 15.57%, 15.41%, 15.45%. | Stable margins during uneven demand support balanced resilience. | Observed moderate stress is sufficient for the qualified FY baseline. | No identified severe simultaneous downturn or protected franchise under such stress. |
| Pricing, labor and delivery | Managed-services visibility, 9M international IT margin around 15.32%, and disclosed wage, budget and technology pressures. | Some demand visibility, with sensitivity to wages, utilization and competitive pricing. | Immaterial to the FY lower band after other affirmative evidence. Material under changed 2026 mix. | Margin stability does not quantify cost pass-through or demand response. |
| Competition and AI | H1/Q3 demand and awards; eligible November AI/SBI disclosures. | Continuing work provides operating context, with unresolved AI exposure and competitive response. | Unresolved combined impact at cutoff. | Customer-cohort loss, pricing and realized AI effects are unquantified. No verified severe-stress outcome or distressed-capital conclusion. |

FY operating observations and disclosed diversification proxies support **3/5, Balanced resilience**, with uncertainty about customer and pricing dependencies. The current review leaves the combined mix, price and labor effects unbounded under stress. It supplies neither a confirmed replacement nor definitive economic invalidation, so **current N/R, MATERIAL_REVIEW_PENDING, 3/5 PROVISIONAL**. The CASH foundation used the 19 March publication window and the RES foundation used retained evidence through annual-report publication on 8 April. Both use FY2022–FY2025 history and record the operational assessment on 26 November separately from the 13 November economic cutoff. [Retained FY resilience evidence](../../fpt-scoring-readiness/2026-11-22/exec-fc90c0fbdb8aac3f227340d7/FPT_BQ_RES_FY2025_PUBLIC_EVIDENCE.md) · [Prior cutoff review and limitations](../../fpt-scoring-readiness/2026-11-22/exec-fc90c0fbdb8aac3f227340d7/FPT_BQ_FH_ONE_PASS_DISPOSITION.md)

## Executable scores and downstream use

| Rubric | FY2025 | Current reassessment | Effective Score | Validity | Update status |
|---|---:|---:|---:|---|---|
| BQ-EQ | 5/8 | N/R | 5/8 | PROVISIONAL | MATERIAL_REVIEW_PENDING |
| BQ-MOAT | 3/6 | 3/6 | 3/6 | CONFIRMED_CURRENT | REAFFIRMED |
| BQ-CASH | 3/6 | N/R | 3/6 | PROVISIONAL | MATERIAL_REVIEW_PENDING |
| BQ-RES | 3/5 | N/R | 3/5 | PROVISIONAL | MATERIAL_REVIEW_PENDING |

Both new FY scores are CONSERVATIVE with confidence 7/10. Current review confidence is 5/10 for each. All four rubric outputs feed **14/25 PROVISIONAL Business Quality** with full BQ coverage. Confirmed current coverage is 1/23 (6/100 weight). Provisional coverage is 3/23 (19/100 weight). Effective coverage is 4/23 (25/100 weight); genuine N/R in this execution is 19/23 (75/100 weight). The Investment Score receives **14 assessed points at 25 rated weight** and stays null as a full /100 score.

The research ranking input includes all four Effective Scores and uncertainties. Its sole member has a null ordinal. The research Investment Decision input receives the same scores, coverage, and BQ provisional qualification with Stage 0 UNKNOWN, hard veto PENDING and residual risk NOT_RATED. Official results, authorization and valuation, portfolio or risk gates retain their existing control paths. Remaining economic dependencies are the comparable annual FTEL earnings/cash bridge, full recognition normalization, and current segment/customer mix sensitivity. The next qualifying FY disclosure and material events trigger review. No production permissions are conferred.

## Replay and validation

```sh
node tools/scoring/validate_fpt_business_quality.mjs --ticker FPT
node tools/scoring/validate_fpt_business_quality.mjs --ticker FPT --html > /tmp/fpt-business-quality-scorecard.html
```

Implementation `bq-cash-res-evidence-sufficiency-research-v1.0.0`. Methodologies `bq-cash-evidence-sufficiency-v1.0.0` and `bq-res-evidence-sufficiency-v1.0.0`. Implementation commit is `2eb3cff3dbbe801e8f7cd82f8e2590d9e3a8f6c1`. [Input](FPT_BUSINESS_QUALITY_INPUT.json) · [Executable result](FPT_BUSINESS_QUALITY_RESULT.json) · [Focused tests](../../../../tests/unit/bq-cash-res-research.test.ts)

**245/245 tests passed** across 11 focused files, including 11 added cases and all 33 formal scoring integration cases. Focused TypeScript and `CURRENT_PARITY_PASS` passed. Accepted BQ-EQ and BQ-MOAT replayed byte-for-byte. Exact FPT V8 input reproduced its stored ID, BQ-MOAT 3/6, IC-IND 2/4, 21 N/R and null full score. The CLI rejected publication. HTML validation verified all four scores and the provisional category label.

| Criteria | Disposition |
|---|---|
| AC01–AC03 | Pass. BQ-MOAT closure and exact owner direction recorded. Economic objectives, bands and original weights retained. |
| AC04–AC07 | Pass. Both validators scored actual annual and incremental FPT inputs. |
| AC08–AC09 | Pass. Shared incremental and Effective Score architecture consumed both rubrics. |
| AC10–AC13 | Pass. Four scores executed into the complete provisional category and downstream inputs. Missing non-BQ coverage remains N/R. |
| AC14–AC16 | Pass. Accepted BQ replays, other 19 rubrics and exact V8 regression verified. |
| AC17–AC18 | Pass. Formal gate controls, isolated authority and publication rejection verified. |
