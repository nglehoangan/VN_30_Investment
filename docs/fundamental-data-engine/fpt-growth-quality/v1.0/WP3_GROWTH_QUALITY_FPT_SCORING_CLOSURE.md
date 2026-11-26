# WP3 Growth Quality Amendment v1.0 · FPT scoring closure

**Verdict.** GQ-HIST **3/5 current**, GQ-FWD **3/5 current**, GQ-INC **2/5 provisional**. The current productivity assessment is N/R. Effective Growth Quality is **8/15 PROVISIONAL**. The cumulative isolated research workflow produced **29 points on 55/100 rated weight and 10/23 rubric coverage**. The full Investment Score is null.

The owner approved GQ01–GQ20 as Approved Baseline v1.0 for isolated FPT research. The approved rubric weights remain 5/5/5, category 15 and Investment Score 100. Accepted BQ and FH remain exactly as replayed from WP2 final acceptance commit b95ff578dbf0e5885f5496b77be8d754480286e1, whose parent is implementation f9745f4f5604edf97f93a331d7395b0abf0e848a. [Owner direction and GQ01–GQ20](OWNER_REQUEST.txt#L3) · [Approved Baseline](../../../03%20SCORING/WP3_GROWTH_QUALITY_AMENDMENT_v1.0.json) · [WP2 acceptance](../../fpt-financial-health/analyst-risk-v1.2/WP2_FINANCIAL_HEALTH_V1_2_FINAL_ACCEPTANCE.md)

## Route contracts and economic channels

HIST uses canonical normalized B before public growth A, with comparable earnings, base-effect, per-share and material acquisition review. FWD uses canonical detailed-model B before public outlook A, with runway, reinvestment, funding and execution. INC uses canonical Direct, the existing PX02 validator, then the capital-productivity A profile. Direct INC requires aligned meaningful deployment windows. PX02 retains its original operand, persistence, scope, corroboration, sector and maximum prerequisites. The eligible detail gaps open alternate routes. Adverse evidence and unsupported conclusions can block them. Existing 5-point direct prerequisites remain. Method A profile ceilings are 4, 4 and 3. [Evaluator](../../../../src/domain/current-scoring/gq-research.ts) · [PX02](../../../../src/domain/current-scoring/public-proxy-review.ts)

| Points | HIST A | FWD A | INC A |
| --- | --- | --- | --- |
| 0 | STRUCTURAL_VALUE_DESTRUCTIVE_CONTRACTION | STRUCTURAL_DECLINE_OUTLOOK | EVIDENCED_VALUE_DESTRUCTIVE_EXPANSION |
| 1 | WEAK_PUBLIC_GROWTH_PROFILE | WEAK_OR_STAGNANT_GROWTH_OUTLOOK | PERSISTENTLY_WEAK_CAPITAL_PRODUCTIVITY |
| 2 | LIMITED_OR_LOW_QUALITY_GROWTH_PROFILE | LIMITED_OR_CYCLICAL_GROWTH_OUTLOOK | MIXED_OR_DETERIORATING_CAPITAL_PRODUCTIVITY |
| 3 | MODERATE_VALUE_CREATING_GROWTH_PROFILE | MODERATE_GROWTH_OUTLOOK_WITH_MATERIAL_CONSTRAINTS | ACCEPTABLE_INCREMENTAL_CAPITAL_PRODUCTIVITY |
| 4 | STRONG_PUBLIC_GROWTH_PROFILE | GOOD_PUBLIC_GROWTH_RUNWAY | Ineligible |

Bank capital and per-share earnings, property presales/collections and project delivery, materials cycle/utilization and utility tariff/contracted project economics require their sector-equivalent operating evidence. Only the FPT technology normalization ran. Growth rates, accepted existing ROIC and FH points are analytical context. Historical growth answers observed operating/per-share outcomes. Forward growth answers runway and ability to execute. Incremental growth answers additional outcomes relative to additional deployment. Cash realization and liquidity remain in BQ/FH respectively. No allocation, pricing or valuation points are inferred.

## Evidence and calculations

Inputs came from the retained annual facts, BQ cash product, reviewed Q3 cells, FY/9M disclosures and the accepted FTEL scope analysis. The FY information window ends 8 April 2026 for evidence availability. It is a retrospective FY2025 foundation. The interim review covers Q1, Q2, reviewed H1, Q3 and material events by 13 November 2026. For reviewed Q3 PDF values, the retained 2 November retrieval is a conservative public-by bound when exact publication is unestablished. The operational assessment date is 26 November. See the pins in the assessment and the evaluator's hashed source reads. [Analyst packet](FPT_GROWTH_ASSESSMENT.json) · [Financial evidence and outputs](FPT_GROWTH_RESULT.json)

Amounts are VND trillion except EPS (VND/share) and ratios. FYs are fully consolidated. 9M2026 uses FTEL equity accounting. The current comparison uses the issuer's restated comparative only where available.

| Metric | FY2022 | FY2023 | FY2024 | FY2025 | 9M2026 |
| --- | ---: | ---: | ---: | ---: | ---: |
| Revenue | 44.010 | 52.618 | 62.849 | 70.113 | 40.023 |
| Direct EBIT | 6.795 | 8.452 | 10.508 | 10.989 | 5.900 |
| Parent NPAT | 5.310 | 6.465 | 7.857 | 9.376 | 7.778 |
| EPS, later pair numerator | — | 4,661 | 4,944 | 5,216 | — |
| Paired EPS growth | — | 21.16% | 22.01% | 21.53% | — |
| CFO | 5.054 | 9.517 | 11.704 | 10.136 | 0.952 |
| Cash CAPEX | 3.215 | 3.978 | 3.275 | 5.098 | 2.029 |
| FCF | 1.839 | 5.539 | 8.428 | 5.038 | -1.077 |
| Operating margin | 15.44% | 16.06% | 16.72% | 15.67% | 14.74% |

FY22–25 revenue CAGR **16.79%**, parent NPAT CAGR **20.87%**. Adjusted within-report EPS pairs 4661/3847 × 4944/4052 × 5216/4292 give **79.66% cumulative**, **21.57% CAGR**. FY2022 has a restated comparative of 3,847 in the first pair. The isolated FY2022 contemporaneous EPS and 9M2026 EPS are unavailable in the selected retained cells. The pairs address mechanical actions and leave economic dilution and M&A attribution open. The restated 9M sales comparison is **12.42%** using the retained 2025 comparative to the nearest VND million. Current cash conversion is weak and FCF is negative. No pre/post-FTEL EPS, EBIT CAGR or incremental capital series is joined.

### Forward sensitivities

The model replays the retained compounding and cash-after-reinvestment formula. The cutoff starting revenue is 9M revenue × 4/3. The FY scenarios use FY facts and label their exploratory margins, growth and reinvestment assumptions rather than importing 2026 disclosures. Reinvestment combines spending and working capital. A separate working-capital forecast is unavailable. Operating profit uses the modeled margin, and cash after reinvestment uses 20% illustrative tax before financing, dividends and other cash obligations.

| Period and sensitivity | Start revenue | Growth | EBIT margin | Cash reinvestment / revenue | Y3 revenue | Y5 revenue | Y3 EBIT | Y1 cash after modeled reinvestment |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| FY2025 · Conservative | 70.113 | 5.00% | 12.00% | 8.00% | 81.164 | 89.484 | 9.740 | 1.178 |
| FY2025 · Representative | 70.113 | 10.00% | 15.00% | 7.00% | 93.320 | 112.917 | 13.998 | 3.856 |
| FY2025 · Favorable | 70.113 | 15.00% | 16.00% | 6.00% | 106.633 | 141.022 | 17.061 | 5.483 |
| Cutoff · Conservative | 53.364 | 5.00% | 12.00% | 8.00% | 61.775 | 68.107 | 7.413 | 0.897 |
| Cutoff · Representative | 53.364 | 10.00% | 14.74% | 7.00% | 71.027 | 85.943 | 10.469 | 2.813 |
| Cutoff · Favorable | 53.364 | 15.00% | 15.67% | 6.00% | 81.159 | 107.333 | 12.718 | 4.011 |

Cash CAPEX anchors are 7.27% of FY2025 sales and 5.07% of 9M2026 sales. The scenarios are sensitivities around growth and operating history, with wider uncertainty for collection, reinvestment and margins. Contract value is an intake signal. It cannot be used as recognized sales or as a conversion assumption. The annual 26 projects and nine-month 16 projects above USD 10 million have different durations. FY intake +23.2%, 9M +23.1%, the Airbus relationship and reported operating execution support an opportunity profile. Financing risk, weaker collections, AI disruption, competitive execution and labor-cost pressure limit the band. Historical borrowing and book balances convey capacity and risk without establishing committed future financing.

### Incremental productivity

Compute ΔNOPAT as 80% of Δdirect EBIT. Capital is equity plus interest-bearing debt less the stated share of short-term financial investments. Each entry below shows capital change and return sensitivity. Full-FTEL historical scope throughout.

| Window | ΔNOPAT | k=0% | k=50% | k=100% |
| --- | ---: | ---: | ---: | ---: |
| FY2022→FY2024 | 2.971 | 12.937 / 22.97% | 8.568 / 34.68% | 4.199 / 70.76% |
| FY2022→FY2025 | 3.355 | 27.083 / 12.39% | 18.791 / 17.85% | 10.499 / 31.96% |
| FY2023→FY2025 | 2.030 | 20.843 / 9.74% | 14.079 / 14.42% | 7.316 / 27.74% |
| FY2024→FY2025 | 0.384 | 14.147 / 2.72% | 10.224 / 3.76% | 6.301 / 6.10% |

The decline between equal-duration overlapping windows holds across the three capital definitions. These windows give directional corroboration and share observations. The selected FY24–25 operating-capital cross-check gives ΔNOPAT **0.384**, Δcapital **3.957** and **9.71%**, on partial operating capital. FY2025 cash CAPEX increased **55.65%** against **4.57%** EBIT growth, while CFO slipped **13.40%** and FCF **40.22%**. M&A allocation and commissioning lags remain unresolved and could change absolute returns or realized timing. These findings support a mixed productivity profile, while the absolute sensitivity spans canonical bands and cannot support PX02. The retained March ACBS nominal VND 12.8% estimate and 15% stress are contextual. The profiles do not establish normalized incremental ROIC, a common enterprise cost on each proxy or value destruction. At cutoff, FTEL opening capital and aligned normalized NOPAT remain unresolved. Current cash and earnings alone do not establish productivity.

## Analyst-to-executable trace

| Rubric | Period | B result | PX02 | A analyst proposal and validation | Executable | Effective Score |
| --- | --- | --- | --- | --- | --- | --- |
| HIST | FY2025 | N/R, normalized organic/per-share bridge | — | Moderate value-creating profile accepted | 3/5 | 3/5 FY foundation |
| HIST | Cutoff | N/R, normalized scope/per-share bridge | — | Moderate value-creating profile accepted | 3/5 | 3/5 CONFIRMED_CURRENT |
| FWD | FY2025 | N/R, detailed conversion/funding | — | Moderate outlook with material constraints accepted | 3/5 | 3/5 FY foundation |
| FWD | Cutoff | N/R, detailed conversion/funding | — | Moderate outlook with material constraints accepted | 3/5 | 3/5 CONFIRMED_CURRENT |
| INC | FY2025 | N/R, aligned normalized capital | Unstable canonical band | Mixed/deteriorating productivity accepted | 2/5 | 2/5 FY foundation |
| INC | Cutoff | N/R, unaligned capital scope | Missing aligned operands and bridge | Null proposal. Unaligned opening capital and earnings block current A. | N/R | 2/5 PROVISIONAL, FY lineage |

- **HIST FY / cutoff.** Multi-year growth and adjusted paired EPS support FY. Restated interim sales and positive operating results support current through the scope review. M&A, dilution, base effects and declining cash realization are bounded in the selected public profile. Band 4 lacks corroborated per-share and cash strength across the relevant scope. Band 2 understates observed operating outcomes. Confidence **8/10 FY (2/1/2/2/1)** and **6/10 current (2/1/2/1/0)**.
- **FWD FY / cutoff.** Positive intake and observed operating execution support multi-year runway. Contract conversion, cost pressures, cash realization and financing risks are counterevidence and bounded limitations for band 3. Band 4 requires stronger funding and margin evidence. Band 2 understates execution and demand. Confidence **7/10 FY (2/1/2/1/1)** and **6/10 current (2/1/2/1/0)**.
- **INC FY / cutoff.** Deterioration across consistent definitions and the CAPEX/cash comparison support band 2. Stronger earlier windows and unresolved commissioning prevent a persistent weakness conclusion at band 1. Window dispersion and attribution prevent band 3. FY **6/10 (2/1/2/1/0)**. Current scope uncertainty remains unresolved and prevents a current score. The reviewed change does not invalidate the original FY windows. The explicit continued-applicability review qualifies the historical score as PROVISIONAL, with its original confidence and FY period. It cannot be used as a current productivity or formal-gate result.

Confidence dimensions use the existing 0–2 freshness, completeness, source reliability, estimate dependence and model uncertainty overlay. The selected A assessments are CONSERVATIVE. Counterevidence, adjacent bands, assumptions and actionability restrictions are retained in the versioned proposals and each route result. Triggers include new annual scope-aligned statements, restatement or action, material contracts or cancellations, funding, acquisitions/disposals, commissioning, impairments and changes in cost or economic deployment.

## Cumulative scoring and authority

| Rubric | FY2025 | Current | Effective | Route / validity |
| --- | --- | --- | ---: | --- |
| BQ-EQ | Retained | Retained | 5 | Retained / PROVISIONAL |
| BQ-MOAT | Retained | Retained | 3 | Retained / CONFIRMED_CURRENT |
| BQ-CASH | Retained | Retained | 3 | Retained / PROVISIONAL |
| BQ-RES | Retained | Retained | 3 | Retained / PROVISIONAL |
| FH-BS | Retained | Retained | 3 | Retained / CONFIRMED_CURRENT |
| FH-LIQ | Retained | Retained | 2 | A_ANALYST_RISK / CONFIRMED_CURRENT |
| FH-STRESS | Retained | Retained | 2 | A_ANALYST_RISK / CONFIRMED_CURRENT |
| GQ-HIST | 3/5 | 3/5 | 3/5 | A_PROFILE / CONFIRMED_CURRENT |
| GQ-FWD | 3/5 | 3/5 | 3/5 | A_PROFILE / CONFIRMED_CURRENT |
| GQ-INC | 2/5 | N/R | 2/5 | A_PROFILE / PROVISIONAL |

BQ **14/25 PROVISIONAL**, FH **7/15**, GQ **8/15 PROVISIONAL**. Confirmed current **16 points on 31/100 weight across 6 rubrics**. Provisional **13 points on 24/100 across 4 rubrics**. Genuine effective N/R **0**. Outside rollout **13 rubrics and 45/100 weight**. Full Investment Score **null**, no single-issuer ranking ordinal. Decision payload is analytical only. Stage 0 UNKNOWN, Hard Veto PENDING, residual risk NOT_RATED, formal FH and valuation NOT_ASSESSED. Formal ranking, actionability and production publication remain disabled. Cross-route cardinal equivalence remains unvalidated.

Serial execution **exec-9a97c34783ca54d585a75492** and queue **queue-41f1103a986d932b5c63c9ea** replayed accepted WP2 **exec-5532255d06ee7b93e497688e**. Prepare bound the seven accepted predecessor rows and three GQ lifecycle dispositions. Adoption stayed within isolated validation. Preflight pinned the executable result and Scoring required byte-exact replay and Prepare equality. Route and comparability qualifications reached aggregation, comparison, Decision inputs and HTML. [Candidate](CANDIDATE.json) · [Workflow receipt](FPT_GROWTH_WORKFLOW.json)

```sh
node tools/scoring/validate_fpt_growth_quality.mjs --ticker FPT
python3 -B tools/scoring/vn30_gq_successor.py --ticker FPT --cutoff 2026-11-13 --universe-version vn30-20260803-reviewed-20261115
```

The six existing skills now cover retained evidence, alternate GQ profile criteria, lifecycle and scope triggers, category orchestration, exact N/R dispositions and publication hygiene. Their GQ directions remain ticker- and sector-parameterized.

## Acceptance criteria and identities

| Criteria | Disposition |
| --- | --- |
| AC01–AC08 | Approved 20 decisions, preserved weights and PX02, versioned routes, validated independent bands and ceilings. |
| AC09–AC16 | Both periods and independent proposals executed. Confidence, counterevidence, actions and scope checked. Incremental and Effective Score reused. INC historical provisional eligibility recorded. |
| AC17–AC22 | Actual serial workflow completed. Accepted BQ/FH identical. Effective GQ points and qualifications survive every consumer. |
| AC23–AC26 | Updated six skills, preserved sector normalization, policy and formal authority, and kept other 13 rubrics outside scope. |
| AC27–AC30 | See verified regression results below. Official V8 and formal authority unchanged. |

Starting commit b95ff578dbf0e5885f5496b77be8d754480286e1. The scoped implementation commit is reported with this closure. Methodology **wp3-growth-quality-v1.0.0**, module **gq-route-research-v1.0.0**, host **vn30-gq-research-successor-v1**.

| Artifact | SHA-256 |
| --- | --- |
| WP3_GROWTH_QUALITY_AMENDMENT_v1.0.json | 715ee68d51ba9c3183d1c1fa7696f305d3ab8bd4bb730f373f9b4ef1d3029b96 |
| gq-research.ts | b8cb7dcd615cfb4aee9e0648dd1db1225efc93a2e8890574e8407e3cadaad612 |
| validate_fpt_growth_quality.mjs | bdbe806ced1fb39581c68212f378ddc5999dd3c6c495bb087c0c2c5876a6d092 |
| vn30_gq_successor.py | 0ecf658e57af01ee7f4a21cfaee183f50cfb9824772f4e6148db190275481693 |
| FPT_FH_INPUT.json | 76ccae2b4fe89ee6c3d19e75bbb1688ee932af8512c1e9f4291c7eb09ca51a76 |
| FPT_FH_RESULT.json | ac40b9159440b8fb14356330c8eb6883813f64e851b01fd3ccd1206617e70040 |
| CANDIDATE.json | bb448cb9d483796d1f517bbe0b97f5596909a6e72924acf8116759a1a26ed5ae |
| FPT_GROWTH_ASSESSMENT.json | 872b41fa87e63df50c15f752deeaf68977cbeafb6fc5897cc32ea74cbaaa3fc6 |
| FPT_GROWTH_RESULT.json | 0e8368ca4efffe66279d3665cda32a4f777501196b27230fdd6cfdda59d60248 |
| FPT_GROWTH_WORKFLOW.json | 3949ea4f4adfda4c71c7b5a6bd7ef30fbb82920f55705617c18d8d8f8a7cc778 |
| TEST_RESULTS.json | 189ea0b68d94d3dbd7fc3b592aa76d414fcc3ec590e38bc10adea7b704565820 |

**Regression verdict.** 304/304 focused TypeScript tests passed, including 19 WP3 cases and 33/33 formal integration cases. The official FPT V8 exact-scope isolated replay passed, and formal parity returned CURRENT_PARITY_PASS. 36/36 Python passed. After refreshing the final host pin for a whitespace-only edit, all 3 targeted WP3 Python tests passed again, including byte-exact workflow replay. The current TypeScript 6.0.3 diagnostic output matches the accepted WP2 baseline byte for byte. All five unrelated diagnostics remain open. [Test receipt](TEST_RESULTS.json)

**Recommendation.** Accept WP3 for isolated FPT research and close this execution. The current GQ-INC assessment remains N/R until comparable opening deployed capital and normalized earnings are available on the post-FTEL scope. Keep the FY2025 result provisional until reassessment or invalidation. The research record carries no formal ranking, actionability, publication or rollout authority.
