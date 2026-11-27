# WP5 v2.0 Value Investing Analysis — FPT research closure

## Result

| Assessment | VAL-PRIMARY | VAL-RET | VAL-MOS | Valuation |
| --- | ---: | ---: | ---: | ---: |
| FY2025 retrospective, information through 8 April 2026 | 2/8 | 0/8 | 0/4 | 2/20 |
| 13 November 2026 | 4/8 | 0/8 | 1/4 | **5/20** |

The cutoff result is **39 assessed points across 85 rated weight**, with **16/23 rubrics covered**. WP1–WP4 contribute the accepted **34/65**. The result comprises 26 confirmed-current points across 61 weight and 13 provisional points across 24 weight. All three valuation rubrics qualify at both dates. Seven rubrics carrying the remaining 15 weight remain outside the completed rollout. The Full Investment Score is null.

## Authorization and frozen inputs

The [owner request](OWNER_REQUEST.txt) approves analyst-generated estimates and reasonableness review for the three valuation rubrics. The [RR01–RR20 amendment](../../../03%20SCORING/WP5_VALUE_INVESTING_ANALYSIS_AMENDMENT_v2.0.json) retains canonical weights and bands, the 6/6/3 Method A ceilings, Method B priority and the pre-existing authority gates. The predecessor was commit `f4978e1a804e58eea9ae8da9c431d0d55ea555d3`, methodology `wp5-bounded-irr-v1.2.0`, evaluator `valuation-bounded-irr-research-v1.2.0`, workflow `vn30-val-research-successor-v1.2`, execution `exec-b49c62e59ae2c95c831ec516`.

The [FY2025 freeze](DATA_FREEZE_ANNUAL.json) uses FY2022–FY2025 financial and market history with the retrospective 8 April 2026 window. It retains ERE04 dated January and ERE06 for method context. The [cutoff freeze](DATA_FREEZE_CURRENT.json) retains all six PDFs and 23 extracted observations, with dates, source families, page and file hashes. ERE06 supplies methodology only. Multiple TCBS reports are one research family. June-to-November revision data support a lower growth path. Research targets, security prices used by analysts and HTG-specific numerical inputs contribute no FPT intrinsic value. Market receipt dates establish retrospective lineage. Historical point-in-time authority remains outside this assessment.

Filed parent NPAT, reported ending ordinary shares and the raw close are dated facts. Working EPS, financing ratios, return cash flows and values are calculations. Seasonality, recurring earnings, growth, future payout, economic dilution, valuation multiples and impairment are analyst estimates. At the cutoff, 1,885,727,648 ordinary shares are carried forward conditionally from Q3 Note 22. The retained 171,401,226 pro-rata shares are already in the anchor. Their capitalization is neutral to investor ownership and is counted once. The capital-action review is incomplete as an exhaustive negative search.

## Earnings normalization

| Component | FY2025 | 13 November 2026 |
| --- | --- | --- |
| Filed parent NPAT | VND 9.376tn, full-year consolidated FTEL | VND 7.778tn for 9M, with current FTEL equity accounting |
| Ordinary share and working EPS basis | 1,703,507,121 shares. VND 8.866tn parent profit after VND 510.168bn appropriations yields 5,204.53 VND/share. | 1,885,727,648 conditional shares. 9M EPS 4,124.71, mechanical annualization 5,499.61, latest TCBS forecast 5,624 VND/share. |
| Analyst adjustment | Retain filed appropriations and apply 0–10% residual recurring-profit reserve. The favorable endpoint assumes no additional net deduction after appropriations. | Multiply 9M by 1.30–1.35 for Q4, apply a 5.44% fund provision from FY, then a 2–12% earnings quality reserve. The Q4 factors bracket a straight-line run rate and sit below the roughly 36% of 9M implied by the November forecast. |
| Recurring EPS range; representative | **4,684–5,205; 4,944.50** | **4,462–5,160; 4,811** VND/share |

The combined reserve reflects net finance income, uncertain recurrence of investment and other gains or expenses and imperfect evidence about cash reaching the parent. The range leaves residual components unallocated where the data cannot support precise deductions. Parent attribution excludes minority claims. Current FTEL associate earnings remain on their disclosed scope, with no separate asset addback or assumed distribution. Historical consolidated earnings and post-FTEL growth are treated as different scopes. The group FCF-to-group-NPAT series of 28.32%, 71.12%, 89.40% and 44.85% informs cash-realization risk. It supplies no parent FCFE conversion rate. No incremental credit is given for deposits, net cash, or unverified refinancing.

## Route selection, assumptions and models

Method B was evaluated first in both periods. A qualified detailed DCF requires a parent-attributable owner cash bridge, supported cost of equity and mature terminal economics. For SOTP, the retained historical work and June broker scope lack a defensible current segment/FTEL-to-parent equity bridge and eligible comparable valuation parameters. For RET, a directly qualified five-year earnings, shareholder entitlement, distributions and exit package remains unavailable. For MOS, the detailed funding and permanent impairment dependencies remain open. Recorded B candidates stayed N/R. The analyst therefore used Technology's normalized earnings Method A by rubric. Group owner-cash sensitivities were used as a downside challenge and kept outside the representative valuation calculation.

| Model | FY2025 assumptions | Cutoff assumptions | Main adverse evidence |
| --- | --- | --- | --- |
| PRIMARY | Recurring EPS range × 12.5–16.5× P/E, 14.5× center. Historical reported P/E sampled 15.89–28.55×, and FY2025 after-fund P/E was 18.41×. Cash conversion weakened as profits increased. | Recurring EPS × 8.5–12.5× P/E, 10.5× center. A 9.52% representative earnings yield reflects a lower growth outlook, less comparable scope and a higher cash and funding risk premium. | The retained cash sensitivity centers were VND 38,503 and 29,625 per share for FY and cutoff. They use uncertain group-to-parent conversion. Divergence led to a higher required earnings yield and caps the economic assessment. |
| RET | Aggregate recurring growth 4% / 8.5% / 13%; exit P/E 10× / 13× / 17×. Profit grew about 21% historically, with a lower sustainable estimate to reflect scale and reinvestment. | Aggregate recurring growth 3.5% / 8.2% / 11.2%; exit P/E 7.8× / 9.7× / 12.3×. Latest projected parent NPAT CAGR was 9.85%, with revisions of −1.82%, −8.12% and −11.51% for overlapping FY2026–FY2028. The base starts near the weaker FY2027 growth step and earns less multiple support than the representative PRIMARY case. | In each period economic dilution is 1.5% / 0.7% / 0.3% using historical ESOP scale. The broker EPS bridge mixes denominator and earnings effects. Credited payouts are 0% / 15% / 28% of recurring EPS, with base retaining 85% for investment and funding. Prior cash dividends support some credit while the ~36% broker payout would need stronger cash cover. |
| MOS | Separately reviewed low recurring EPS reduced another 10% to 4,216 and valued at 9×, an 11.1% earnings yield. | Low recurring EPS reduced another 8% to 4,105 and valued at 8.2×, a 12.2% earnings yield. | Short-term debt concentration, deposit accessibility, weak group conversion and investment can create lasting equity impairment. Current severe FH stress retains 3.05× interest cover and −VND 2.556tn modeled FCF. The downside combines persistent earnings impairment and valuation compression. Positive core earnings and operating cash support a going-concern case. Distressed issuance or failed refinancing could create greater loss. |

| Calculated output | FY2025, raw close 95,800 | Cutoff, raw close 50,100 |
| --- | ---: | ---: |
| PRIMARY downside / representative / upside (VND/share) | 58,550 / **71,695.25** / 85,882.50 | 37,927 / **50,515.50** / 64,500 |
| Five-year RET downside / representative / upside | −11.20% / **0.46%** / 12.66% | −5.19% / **7.53%** / 19.16% |
| RET representative zero credit / no rerating / both | −0.52% / 8.58% / 7.75% | 5.93% / 9.00% / 7.45% |
| MOS conservative intrinsic value (VND/share) | **37,944** | **33,661** |
| MOS discount on value / price-relative downside | **−152.48%** / −60.39% | **−48.84%** / −32.81% |

Shareholder EPS compounds annual profit growth divided by one plus economic dilution. The model credits payout at the five date anniversaries and adds exit proceeds in year five. The cutoff horizon ends on 13 November 2031. The analyst extends investor-equivalent earnings at the stated rates for the ~0.868 years beyond the November broker outlook ending FY2030. No-rerating fixes the terminal P/E at the scenario-specific entry P/E. Zero credit omits modeled distributions and makes no claim about actual future dividends. The representative return is an explicitly conservative expectation, with cash and discount assumptions challenged separately. Scenario crossings are material limitations. The historical v1.2 bounded paths retain their sensitivity-only disposition. [Actual scenarios and cash flows](FPT_VALUATION_RESULT.json)

## Reasonableness Review and revision

The two periods contain **20 model-scoped estimate rows** (10 each). Final disposition is **20 accepted with limitations**, **0 acceptances without limitations**, **1 revised** within those 20, **0 finally rejected**. Identical financial concepts in independent rubric models are scoped to the relevant models and counted as separate review rows. The persisted analyst and reviewer steps are procedurally separated AI work. No independent external expert corroboration was commissioned.

RV01 checked earnings and reinvestment against the actual cash and profit history. RV02 used dated research as optional corroboration. RV03 challenged whether growth, funding and payout could coexist. RV04 checked parent attribution, cash-flow scope, and pro-rata versus economic issuance. RV05 challenged fair-value premiums and sensitivity across cases. RV06 retained low cash conversion, FTEL and funding as economically material limitations on upside and confidence. Reviewer assessments are bound to the exact analyst proposal and its frozen citations.

| Period and model | Original assumption | Reviewer challenge | Analyst revision and verdict |
| --- | --- | --- | --- |
| Cutoff PRIMARY | 10–14× fair P/E, 12× center; VND 57,732 representative; proposed 5/8 | RV05 / RB04. The original yield premium did not explain the large gap to the cash-realization cross-check. | 8.5–12.5×, 10.5× center, VND 50,515.50 and 4/8. Accepted with limitations. |
| All other period/model pairs | Initial model as filed | Cash funding, corporate actions and reasonable downside and upside reviewed by model | Accepted with limitations, with zero additional revisions. |

[Annual proposal](ANALYST_PROPOSAL_ANNUAL.json) · [Annual initial review](INITIAL_REVIEW_ANNUAL.json) · [Annual final review](FINAL_REVIEW_ANNUAL.json) · [Cutoff proposal](ANALYST_PROPOSAL_CURRENT.json) · [Cutoff initial review](INITIAL_REVIEW_CURRENT.json) · [Cutoff revision](ANALYST_REVISION_CURRENT.json) · [Cutoff final review](FINAL_REVIEW_CURRENT.json)

## Executable, Effective Scores and cumulative handoff

| Period | Rubric | Qualified conclusion | Analyst proposed | Final review | Executable | Effective |
| --- | --- | --- | ---: | --- | ---: | ---: |
| FY2025 | PRIMARY | A · expensive given historical cash conversion and price above the revised value range | 2 | Accepted with limitations | 2 | 2 |
| FY2025 | RET | A · representative 0.46%, lower point in the below-8% band | 0 | Accepted with limitations | 0 | 0 |
| FY2025 | MOS | A · poor asymmetry given the price premium over stressed value and limited upside cushion | 0 | Accepted with limitations | 0 | 0 |
| Cutoff | PRIMARY | A · representative value close to paid price with material downside | 4 | Accepted with limitations | 4 | 4 |
| Cutoff | RET | A · representative 7.53%, lower point in the below-8% band | 0 | Accepted with limitations | 0 | 0 |
| Cutoff | MOS | A · meaningful downside with profitable core economics and recovery optionality | 1 | Accepted with limitations | 1 | 1 |

Confidence is **7/10** in each period (freshness 2, completeness 1, source reliability 2, estimate dependence 1, model uncertainty 1). Cash realization, end-period share basis coverage, future funding and stressed multiple remain material limits. The A conclusions survive these limits at the stated bands. Exact cash and risk parameters still block detailed B and higher-confidence or maximum outcomes. There is no in-scope genuine valuation N/R. FY valuation was calculated as its own retrospective assessment. The current Effective Scores were freshly calculated from the current market observations and model.

The isolated FPT execution completed Data Freeze, Analyst Proposal, Initial Review, one Revision, Final Review and Executable Validation, then Prepare, Adoption, Preflight, Scoring and HTML rendering. The existing aggregation and decision-input consumers use the three current valuation Effective Scores and the unchanged 13 accepted WP1–WP4 scores. The research decision input carries Stage 0 UNKNOWN, Hard Veto PENDING, Residual Risk NOT_RATED, and Financial Health, Valuation and Portfolio gates NOT_ASSESSED. Formal scoring, formal ranking, actionability, production and publication remain disabled. [Workflow receipt](FPT_VALUATION_WORKFLOW.json) · [Research HTML](FPT_RESEARCH_SCORECARD.html)

The seven existing skills updated are `equity-s1-s5-assessment`, `vn30-evidence-coverage-closure`, `vn30-incremental-scoring`, `vn30-rollout-orchestrator`, `vn30-structural-nr-remediation`, `vn30-scoring-publication-hygiene` and `vn30-external-research-evidence`.

## Regression and traceability

TypeScript passed **362/362** across 329 default-environment tests and all 33 formal integration tests run in the Node environment. The default jsdom run of the formal file hit three pre-existing Node-only SQLite bundling errors in the TCBS pipeline. The Node run passed those tests, exact FPT V8 replay and formal authority rejection. The applicable Python suite passed **49/49**, and both v2.0 workflow tests passed again on the committed artifacts. Formal parity returned `CURRENT_PARITY_PASS`. TypeScript reported the same five baseline diagnostics with zero additions. The 13 predecessor Effective Scores reproduced exactly and the versioned WP5 v1.0–v1.2 artifacts are byte-identical to the predecessor tree. The separately staged diagnostic was preserved.

Implementation commit `05f1586ee6845f7fb5c6809f9ba15334cd567e28`. Research execution `exec-2b89bcff40f630e5f785fbc1`, queue `queue-3c48133207e47c0c024b9a8c`. [Candidate pins](CANDIDATE.json) · [Artifact SHA-256 manifest](ARTIFACT_SHA256.txt) · [Test results](TEST_RESULTS.json)

**Acceptance recommendation.** Accept the two FPT assessments for the limited research workflow at the stated confidence and bands. The cutoff model supports fair representative value, a below-8% expected return and meaningful downside. Preserve the existing formal authority and risk restrictions.
