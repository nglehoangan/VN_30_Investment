# BQ-EQ v1.2 latest valid assessment closure

The owner approved D15–D18 for BQ-EQ. Approved Baseline v1.2 preserves the latest valid assessment, exposes it separately from current scoring, classifies pending reviews, and reports current validity, ranking and investment actionability independently. D1–D14 continue to govern except for the superseded lifecycle semantics. The inspected local HEAD was `f26689ef1b7bfef1694e2895b3321abcac98fa6c`, matching the reviewed commit. [Owner request](OWNER_REQUEST.txt) · [Approved Baseline v1.2](../../../03%20SCORING/BQ_EQ_INCREMENTAL_ASSESSMENT_v1.2.json)

## Predicates and implementation

| Predicate | v1.1 | v1.2 |
|---|---|---|
| Materiality and replacement counterevidence | Both `MATERIAL_IMPACT_UNRESOLVED` and `MATERIAL_INVALIDATING` enter `blockingChanges` and `counterReviewed` | The same certification and replacement checks run. The v1.2 disposition distinguishes unresolved impact from confirmed invalidation using a qualified materiality review. |
| Affirmative support | `AFFIRMATIVE_SUPPORT_REQUIRED` blocks certification of inheritance when the new evidence does not affirm the old band | The check still blocks current inheritance. Retention uses the historically eligible assessment and its original score, independently of that check. |
| Terminal state | Neither accepted inheritance nor replacement yielded `INVALIDATED` | A qualified invalidating finding yields `INVALIDATED`. A qualified unresolved material finding yields `MATERIAL_REVIEW_PENDING`. Other gaps with a qualified historical assessment yield `UPDATE_PENDING`. Missing qualified scores yield `NOT_RATED`. |

- [bq-eq-retention.ts](../../../../src/domain/current-scoring/bq-eq-retention.ts) adds `retainLatestValidEconomicQuality` and identity `bq-eq-latest-valid-research-v1.2.0`. It projects the qualified v1.1 replay into separate historical and current results. Only an accepted `UPDATED` result advances the latest valid record to a new assessment.
- [validate_fpt_bq_eq_retention.mjs](../../../../tools/scoring/validate_fpt_bq_eq_retention.mjs) runs the existing real-issuer adapter and requires byte equality with the sealed v1.1 result before applying v1.2. The v1.2 configuration pins the owner instruction, v1.1 configuration, input and result.
- [bq-eq-incremental.test.ts](../../../../tests/unit/bq-eq-incremental.test.ts) splits unresolved and confirmed materiality, exercises failed review, expiry, future evidence, replacement counterevidence, reaffirmation, inheritance, pending totals and actual FPT replay.
- [equity-s1-s5-assessment/SKILL.md](../../../../skills/equity-s1-s5-assessment/SKILL.md) records when to retain the historical assessment and how to report pending status and current eligibility.
- The v1.2 package retains the owner request, this report and the executable receipt. The prior input remains under its original path. [Receipt](FPT_BQ_EQ_V1_2_RESULT.json)

## Lifecycle matrix

| Condition | Latest valid assessment | Current result | Status |
|---|---|---|---|
| Initial historically qualified assessment | Establish the original record | Valid in its original window | BASELINE |
| Supported replacement | Advance to the new qualified record | Valid research score | UPDATED |
| Same method, band and points independently supported | Preserve qualified record | Valid research score | REAFFIRMED |
| Existing inheritance criteria satisfied | Preserve qualified record | Valid inherited research score | CARRIED_FORWARD |
| New evidence insufficient or review fails validation | Retain qualified history | N/R | UPDATE_PENDING |
| Qualified unresolved material impact | Retain qualified history | N/R | MATERIAL_REVIEW_PENDING |
| Qualified confirmed invalidation, with no replacement | Retain original record for historical use | N/R | INVALIDATED |
| Evidence expired or new authoritative annual evidence arrives, with no replacement | Retain original record | N/R; reassessment required | UPDATE_PENDING, subject to any qualified material finding |
| Neither historical nor current assessment qualifies | No numeric score | N/R | NOT_RATED |

A supported current result takes priority over pending or invalidated states. A qualified finding of invalidation takes priority over unresolved impact when neither inheritance nor replacement passes. The isolated research result grants no ranking or action authority.

## FPT executable replay

| Output | v1.1 | v1.2 |
|---|---|---|
| FY2025 baseline score | 5/8 | 5/8 · CONSERVATIVE |
| Latest valid historical score | 5/8 in the baseline | **5/8 · Good economics**, explicitly exposed |
| Current reassessment, 13 Nov 2026 | N/R | **N/R · NOT_RATED** |
| Update status | INVALIDATED | **MATERIAL_REVIEW_PENDING** |
| Current comparable ROIC | Unavailable | Unavailable |
| Historical score availability | Original baseline available | Latest valid assessment available with original identity, period, method and confidence |
| Current ranking eligibility | Ineligible in the research path | False |

The original assessment was dated 25 Nov 2026 and covers the FY2022–FY2025 foundation through 31 Dec 2025. The latest review uses Q3/2026 financial evidence and eligible events through 13 Nov 2026. Historical confidence is 7/10 and current review confidence is 5/10. The retained FTEL review leaves the impact on recurring returns and capital unresolved. Current comparability, ranking, actionability and total-score gates do not use the historical 5 points.

```sh
node tools/scoring/validate_fpt_bq_eq_retention.mjs --ticker FPT
```

The executable reused the exact hash-pinned v1.1 input and replayed the v1.0 financial calculations through the retained adapter. The v1.1 output matched byte-for-byte, including the prior N/R and null current comparable ROIC. [Retained v1.1 input](../2026-11-26/FPT_BQ_EQ_INCREMENTAL_INPUT.json) · [v1.2 output](FPT_BQ_EQ_V1_2_RESULT.json)

## Verification and authority

**211/211 tests passed** across nine focused files, including all 33 formal scoring integration tests. Current scorer parity returned `CURRENT_PARITY_PASS`. The unchanged official FPT V8 input replayed to `fpt-limited-v8-2026-11-13` with BQ-MOAT 3/6, IC-IND 2/4, 21 N/R and null full score. The production registry and routes, scoring calculators and retained V8 artifacts matched the inspected commit. The research CLI rejected the publication flag.

AC01–AC06 passed through the split lifecycle tests and the actual FPT replay. AC07–AC11 passed through byte comparison, the unchanged financial and formal scoring regressions, exact V8 replay and the isolated authority checks. Production requires separate approval of the methodology and executable, qualified data and assessment binding, applicable Stage 0 and Risk Policy decisions, and separate publication authority.

## Effective Score addendum · D19–D23

The owner authorized consumption of qualified provisional points in research aggregation, comparison and Decision inputs. The local starting HEAD remained `f26689ef1b7bfef1694e2895b3321abcac98fa6c`, with the v1.2 retention work already present locally. This section supersedes the earlier restriction on analytical aggregation. Formal current scoring and capital-allocation eligibility still follow their original contracts. [Owner addendum](OWNER_ADDENDUM.txt) · [Approved addendum configuration](../../../03%20SCORING/BQ_EQ_EFFECTIVE_SCORE_ADDENDUM_v1.2.json)

| Output | Before addendum | After addendum |
|---|---|---|
| Latest Valid Score | 5/8 · FY2025 | **5/8 · FY2025 · Good economics** |
| Current Reassessment | N/R | **N/R** |
| Effective Score | Unavailable to consumers | **5/8 · PROVISIONAL**, latest valid FY2025 assessment |
| Business Quality contribution | None in this analytical path | **5 assessed points**, weight 8/25, provisional. Category total stays null. |
| Effective coverage contribution | None | **1/23 rubrics, 8/100 weight**. Confirmed 0/23, provisional 1/23, unavailable in this execution 22/23 with weight 92/100. |
| Investment Score analytical consumption | None | **5 assessed points on 8 rated weight**. Full provisional score stays null because this execution has incomplete coverage. |
| Research ranking consumption | No qualified research row | Matched-coverage ranking consumes 5 assessed points and FTEL uncertainty. FPT is the sole issuer in this run, so ordinal rank is null. |
| Investment Decision input consumption | No compatible analytical score input | Research Decision input consumes 5 BQ-EQ points, partial BQ and Investment Score coverage, and the unresolved dependencies. |
| Current score validity | N/R · NOT_RATED | N/R · NOT_RATED. Update is MATERIAL_REVIEW_PENDING. 9M comparable ROIC remains null. |
| Actionability limitations | No formal rank or allocation | Research only. Stage 0 UNKNOWN, hard veto PENDING, residual risk NOT_RATED. Valuation, financial health and portfolio gates remain unassessed in this execution. |

The research resolver gives precedence to qualified current points, including certified inheritance and reaffirmation. When current scoring is pending, it uses the historical points if the legacy lifecycle confirms baseline eligibility and freshness. Missing affirmative support and unresolved materiality stay visible. Confirmed invalidation, expired support or a failed historical qualification yield null. Newly available authoritative annual evidence requires reassessment before provisional use, consistent with the existing annual freshness trigger. Current comparable ROIC is carried separately from the retained current-period result.

The new research aggregation preserves the registry weights and 25-point BQ maximum. Available points contribute to assessed points and rated weight. A full provisional /100 score requires 23 usable rubric inputs. The FPT execution qualifies only BQ-EQ under this authorization. It does not combine unrelated or official V8 records with the research score. A full-coverage fixture verifies the /100 calculation and a two-issuer fixture verifies that comparison uses effective points with identical cutoff and rated-rubric set. The formal scorer, ranker and Investment Decision engine still require their canonical scorecards and gates. The research scorecard can be rendered as local HTML through the isolated adapter.

### Changed paths and functions

| Path | Addendum change |
|---|---|
| `src/domain/current-scoring/research-effective-score.ts` | `resolveEconomicQualityEffectiveScore`, `aggregateResearchEffectiveScores`, `rankResearchEffectiveScores`, `buildResearchDecisionScoreInput` |
| `tools/scoring/validate_fpt_bq_eq_effective.mjs` | Pins approval and prior results, executes the retained research path, calls all consumers and optionally renders the local scorecard |
| `src/ui/research-effective-score.tsx` | `ResearchEffectiveScoreView` renders the effective rubric score, financial basis, review cutoff, current limitation and partial coverage |
| `tests/unit/bq-eq-incremental.test.ts` | Effective-score precedence, freshness and invalidation, coverage, full provisional arithmetic, ranking, Decision and real FPT validation |
| `skills/equity-s1-s5-assessment/SKILL.md` | D19–D23 research scoring guidance |
| `docs/03 SCORING/BQ_EQ_EFFECTIVE_SCORE_ADDENDUM_v1.2.json` and this package | Approval, v1.2 predecessor pin, owner addendum, result and consolidated closure |

```sh
node tools/scoring/validate_fpt_bq_eq_effective.mjs --ticker FPT
node tools/scoring/validate_fpt_bq_eq_effective.mjs --ticker FPT --html > /tmp/fpt-bq-eq-effective-score.html
```

Implementation identity is `bq-eq-effective-research-v1.2-d19-d23`. The real replay matched the pinned retention result and the downstream receipt reproduced byte-for-byte. **217/217 tests passed**, including all 33 formal scoring integration cases. Focused TypeScript validation passed, the local HTML exposed the provisional basis and current N/R, and the CLI rejected the publication flag. The exact official V8 replay again matched the stored rated rows and null full score. [Actual downstream result](FPT_BQ_EQ_V1_2_EFFECTIVE_RESULT.json)
