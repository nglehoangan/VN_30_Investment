# WP2 Financial Health and FPT scoring closure

**Implementation verdict · Pass for isolated research.** FH01–FH15 are recorded as Approved Baseline v1.0. The owner accepted and closed WP1. This run replayed the unchanged BQ 14/25 PROVISIONAL receipt and executed all three new FH rubrics for FPT. Inspected local HEAD was `ecd34c4`. [Owner direction](OWNER_REQUEST.txt) · [Approved amendment](../../../03%20SCORING/WP2_FINANCIAL_HEALTH_AMENDMENT_v1.0.json)

**Operational verdict · 3 FH assessed points on 6/15 weight. The full Financial Health score is N/R.** FH-BS is 3/6. FH-LIQ and FH-STRESS stay N/R at both foundation and current reassessment. The combined research result is **17 assessed points at 31/100 rated weight, 5/23 effective rubrics**. The full Investment Score remains null.

## Implementation and evidence contracts

| Component | Exact change |
|---|---|
| `fh-research.ts` | `scoreFinancialHealth` validates existing bands/weights, CORE and conditional evidence, sector-specific method, counterevidence, stronger evidence and maximum requirements. BS requires capital, assets and leverage, with funding mandatory when material or for banks. LIQ requires timed obligations, resources and maturities, and invokes existing PX01 covenant logic. STRESS requires scenario, funding and economic capital response, with sensitivity at upper bands. |
| `fh-research.ts` calculations | `timedLiquidity` separates available and committed resources from restricted, unverified and uncommitted funding, rejects overlapping IDs, and compares cumulative sources and uses at each maturity bucket. `positiveDenominatorRatio` keeps unusable earnings/interest denominators null. `runFinancialStress` models a cash proxy separately from accounting results. |
| `fh-incremental.ts` | `scoreIncrementalFinancialHealth` reuses the shared lifecycle, retention and Effective Score. It blocks provisional or inherited use when a supported financial horizon has expired, funding applicability fails, or breach risk is present. The original historical record remains available. |
| `validate_fpt_financial_health.mjs` | Pins retained evidence, FY source rows, accepted WP1 and Q3 source. Executes both assessment windows, resolves FH and uses the existing research aggregation, comparison and Decision consumers. Optional HTML is research UI. |
| `vn30_fh_successor.py` | Extends the WP1 host route, using its scope resolver, exact WP1 replay and the same serial queue, store and worker APIs. The WP2 candidate is separately pinned and bound to the approved research category. Prepare distinguishes explained economic N/R from workflow failure. |
| Six existing skills | Added category parameters and scope guidance to `equity-s1-s5-assessment`, `vn30-evidence-coverage-closure`, `vn30-incremental-scoring`, `vn30-rollout-orchestrator`, `vn30-structural-nr-remediation` and `vn30-scoring-publication-hygiene`. The shared instructions cover evidence sufficiency, bounded discovery, lifecycle and maturity review, category queue parameters, blocker classification, and retention/publication boundaries. |

All three economic objectives and the 6/4/5 maxima are preserved. Distinct channels are capital and asset protection, timed payment capacity, and financial survival under adversity. Liquidity and stress calculations reuse observations as resources or obligations, with no automatic reward for a ratio or for accepted BQ points. Lending and property exposures retain their own approved methods. This validation ran only the non-financial FPT route. [Scoring contract](../../../../src/domain/current-scoring/fh-research.ts) · [Incremental adapter](../../../../src/domain/current-scoring/fh-incremental.ts) · [Owner-approved PX01](../../../03%20SCORING/PUBLIC_DATA_PROXY_OWNER_APPROVAL.json)

## FPT financial position

Amounts in **VND trillion**, rounded. FY2022–25 are original consolidated annual windows with full FTEL consolidation. The latest position is September 2026 after the change to equity accounting. Earnings and interest in the latest column are nine months. Annual balance-sheet and cash-flow source rows are retained with issuer, scope, variant, source hash and page. Q3 gross interest and D&A use the retained visually reviewed statement, physical pages 7 and 10. Equity is reported approximately in the retained Q3 review. [Exact inputs and source locators](FPT_FH_INPUT.json) · [Financial outputs](FPT_FH_RESULT.json)

| Metric | FY2022 | FY2023 | FY2024 | FY2025 | Latest 2026 |
|---|---:|---:|---:|---:|---:|
| Cash and equivalents, book | 6.440 | 8.279 | 9.315 | 10.522 | 7.377 |
| Restricted cash, verified split | N/A | N/A | N/A | N/A | N/A |
| Book deposit balances used only for sensitivity | 13.047 | 16.104 | 21.785 | 29.631 | 20.879 |
| Eligible liquid deposits by obligor and due date | N/A | N/A | N/A | N/A | N/A |
| Short-term interest-bearing debt and financial leases | 10.904 | 13.838 | 14.446 | 19.170 | 14.316 |
| Long-term interest-bearing debt and financial leases | 1.478 | 0.208 | 0.501 | 1.904 | 2.280 |
| Total interest-bearing debt and financial leases | 12.382 | 14.046 | 14.947 | 21.073 | 16.596 |
| Indicative net debt, debt less reported cash only | 5.942 | 5.767 | 5.632 | 10.551 | 9.219 |
| Qualified net debt after accessible-cash review | N/A | N/A | N/A | N/A | N/A |
| Direct operating EBIT proxy | 6.795 | 8.452 | 10.508 | 10.989 | 5.900 |
| Indicative EBITDA, direct EBIT plus reported D&A | 8.628 | 10.738 | 13.044 | 13.903 | 7.193 |
| Indicative net debt / EBITDA | 0.69× | 0.54× | 0.43× | 0.76× | 0.96× using mechanical 9M annualization |
| Gross interest expense | 0.646 | 0.833 | 0.552 | 0.810 | 0.612 |
| Equity | 25.356 | 29.933 | 35.728 | 43.748 | ~44.039 |

Direct EBIT excludes financing and equity-method results. EBITDA is a reconstructed proxy, with no verified normalized EBITDA or comparable post-FTEL LTM series. The annual cash-flow add-back may include goodwill allocation. Cash offset is indicative and unrestricted availability remains unverified. Net interest coverage is unverified. Direct EBIT / gross interest is 13.57× FY2025 and 9.63× in the same 9M2026 window. Debt/equity is 48.17% FY2025 and about 37.69% at September under different scopes.

FH-BS weighs equity buffer and moderate reported debt against short-term concentration, mixed cash realization and asset-quality limitations. Reported short-term receivables moved from 14.402 trillion FY2025 original presentation to 13.064 trillion at Q3. The comparative reclassification and FTEL transition preclude a clean like-for-like improvement claim. At Q3 short-term receivable provisions are 0.347 trillion. Guarantees, collateral and potential cash restrictions lack sufficient obligor-specific quantification for a higher band. A low indicative leverage ratio alone does not justify strong or maximum points. The evidence supports **Adequate 3/6** in each scope.

## Timed liquidity and stress

| Obligation or resource | FY2025 amount | September 2026 amount | Timing and qualification |
|---|---:|---:|---|
| Short-term debt and finance leases | 19.170 | 14.316 | Within 12 months of each reporting date, including current portions. No double counting of separately disclosed current portions. |
| Operating lease payments | 1.003 | 0.869 | Separate contractual less-than-one-year bucket. |
| Total selected uses | 20.173 | 15.186 | Lower-bound inventory; excludes unscheduled interest and other unmapped obligations. |
| Contracted CAPEX, FY disclosure | 1.788 | N/A | Due dates not established. Separate sensitivity item, with no assumption that the entire amount falls due inside the window. |
| Book cash | 10.522 | 7.377 | On balance sheet. Restrictions and legal accessibility across entities remain unresolved. |
| Deposits | 29.631 | 20.879 | Book balances used for sensitivity. Usable dates, restrictions and obligor matching remain unresolved. |
| Committed undrawn facilities / positive future CFO | N/A | N/A | No certain future funding counted. Historical refinancing does not establish a committed replacement. |
| Declared dividends, guarantees or other potential commitments | N/A | N/A | Reviewed as possible obligations. Amounts and due dates are incomplete in the matched ladder. |

Book cash plus 25%/50% of deposits gives 0.89×/1.26× FY and 0.83×/1.17× in September against selected uses only. Break-even fractions are 32.57% and 37.40% before other obligations. This is a 12-month bucket sensitivity, not verified intra-period coverage. The earlier FY research 2/4 used reported totals and financing history. For this executable contract, usable-resource timing and the material covenant disposition remain unbounded, so both assessments returned N/R. This does not establish a covenant breach or a funding failure. After FTEL and the maturity rollover there is no supported basis for a historical current Effective Score. [Retained annual maturity review](../../fpt-scoring-readiness/2026-11-22/exec-fc90c0fbdb8aac3f227340d7/FPT_FH_LIQ_FY2025_CONSERVATIVE_ASSESSMENT.md)

Scenario amounts in VND trillion. The September starting case mechanically annualizes revenue, interest and total cash CAPEX from nine months at the post-FTEL scope. The FY scenario instead uses original full-year data. The shocks reflect the retained public-based sensitivity for uneven tech demand, fixed labor capacity, delayed collections and higher refinancing costs. They are analyst assumptions; they are not outcomes observed or promised by FPT.

| Scenario variable | September starting case | Severe September case | Source / assumption |
|---|---:|---:|---|
| Revenue | 53.364 | 40.023 | 9M×4/3, then −25%; moderate check −15% |
| EBIT margin | 14.74% | 10.00% | Direct reported proxy; 12% in moderate check |
| EBIT | 7.866 | 4.002 | Derived |
| Operating cash generation proxy before cash CAPEX/principal | 5.640 | 0.149 | EBIT less gross interest, illustrative tax and incremental working capital; no D&A addback |
| Incremental working capital outflow | 0 | 2.001 | 5% stressed sales; 3% moderate |
| Interest burden | 0.817 | 1.314 | Report annualized and +3pp on current debt; +2pp moderate |
| Cash CAPEX proxy | 2.705 | 2.705 | Total observed annualized spend as sensitivity. Verified non-deferrable floor unavailable. |
| Debt repayment | 14.316 | 14.316 | Reported short-term bucket; +0.869 ordinary operating lease modeled separately |
| Opening resources under 25% / 50% deposit access | 12.597 / 17.817 | 12.597 / 17.817 | Assumes all book cash for the scenario only; no committed new funding. |
| Liquidity surplus at 25% / 50% | +0.346 / +5.566 | **−5.145 / +0.075** | Before other unmapped obligations; no interest or CAPEX is subtracted twice. |
| Funding and capital response | No additional funds inside modeled totals | Additional funding or adjustments in low-access case; negligible headroom in high-access case | No verified source confirms manageable refinancing or establishes emergency dilution/distressed sales. |

The −15% September case yields −3.219 / +2.001 trillion at 25%/50% deposit access. On the FY basis the −25% case gives −6.917 / +0.491 trillion. The severe scenario cannot establish survivability without distressed actions or likely failure. FH-STRESS stays N/R in both windows because the funding response and capital conclusion remain unbounded. Reassess on material debt, coverage, asset quality or capital changes, and subsequent authoritative statements. [Retained stress research](../../fpt-scoring-readiness/2026-11-22/exec-fc90c0fbdb8aac3f227340d7/admission-rehearsal/FPT_ANALYST_FIRST_PUBLIC_DATA_SCORING_CLOSURE.md) · [Executed sensitivity tables](FPT_FH_RESULT.json)

## Scores and coverage

| Rubric | FY2025 | Current at 13 Nov 2026 | Effective Score | Validity | Update status |
|---|---:|---:|---:|---|---|
| BQ-EQ | 5/8 | N/R | 5/8 | PROVISIONAL | MATERIAL_REVIEW_PENDING |
| BQ-MOAT | 3/6 | 3/6 | 3/6 | CONFIRMED_CURRENT | REAFFIRMED |
| BQ-CASH | 3/6 | N/R | 3/6 | PROVISIONAL | MATERIAL_REVIEW_PENDING |
| BQ-RES | 3/5 | N/R | 3/5 | PROVISIONAL | MATERIAL_REVIEW_PENDING |
| FH-BS | 3/6 | 3/6 | **3/6** | CONFIRMED_CURRENT | UPDATED |
| FH-LIQ | N/R | N/R | **N/R** | N/R | NOT_RATED |
| FH-STRESS | N/R | N/R | **N/R** | N/R | NOT_RATED |

The FH-BS analyst and executable both selected 3/6, Adequate. Effective basis is the latest post-transition period, not historical inheritance. Confidence is 7/10 for both windows. LIQ and STRESS proposed no numeric band and each review has 5/10 confidence. Latest financial period reviewed for all three is 30 September 2026; only information through 13 November enters the current economic review. Annual publications are 19 March and the related annual reporting by 8 April. Q1, Q2, reviewed H1 and Q3 were processed with retained publication dates, alongside the FTEL change and material cutoff events. No new external collection was needed.

| Output | WP1 | WP2 combined |
|---|---|---|
| Business Quality | 14/25 PROVISIONAL | 14/25 PROVISIONAL |
| Financial Health | Outside WP1 | 3 assessed points, 6/15 weight, full category null |
| Assessed points / rated weight | 14 / 25 | **17 / 31** |
| Effective coverage | 4/23 | **5/23**, 31/100 |
| Confirmed current | 1/23, 6/100 weight | 2/23; 6 points at 12/100 weight |
| Provisional | 3/23, 19/100 weight | 3/23; 11 points at 19/100 weight |
| Genuine N/R within current rollout | 0 | 2 rubrics, 9/100 |
| Outside rollout | 19 | 16 rubrics, 60/100 |
| Full Investment Score | Null | Null |
| Research comparison | One issuer, no ordinal | Same, with all BQ and FH dispositions |
| Decision | Research only | Same effective scores, qualifications and risk controls; Stage 0 UNKNOWN, hard veto PENDING, residual risk NOT_RATED. No formal Financial Health gate satisfied by this research. |

## End-to-end proof, tests and authority

```sh
node tools/scoring/validate_fpt_financial_health.mjs --ticker FPT
python3 -B tools/scoring/vn30_fh_successor.py --ticker FPT --cutoff 2026-11-13 \
  --universe-version vn30-20260803-reviewed-20261115
```

| Stage | Actual outcome | Remaining blocker |
|---|---|---|
| Annual FH scoring | Executed 3 / N/R / N/R | Timed funding and capital response unbounded in two rubrics |
| Incremental and Effective Score | Executed 3 / N/R / N/R | Q3 funding applicability and stress response unresolved |
| Candidate | Pinned WP1, evaluator, methodology and accepted output | None for isolated scope |
| Prepare | PREPARED_BQ_FH, accepts seven explicit rows including two explained N/R | No obsolete-topic blocker |
| Adoption | ADOPTED_FOR_ISOLATED_VALIDATION | Formal adoption remains separate |
| Preflight | AUTHORIZED_FOR_ISOLATED_VALIDATION | No production authority |
| Scoring and aggregation | SCORED_RESEARCH_ONLY, 14 BQ + 3 FH assessed | Two FH N/R and 16 out of scope |
| Ranking and Decision | Same rows consumed; no one-company ordinal or formal decision | Existing formal gates |
| Research HTML | Rendered in final queue receipt | No publication authorized |

[Versioned candidate](CANDIDATE.json) · [Prepared and executed queue receipt](FPT_WP2_WORKFLOW_RESULT.json) · [Direct FH assessment receipt](FPT_FH_RESULT.json). Identities are `wp2-financial-health-v1.0.0`, `fh-evidence-sufficiency-research-v1.0.0` and `vn30-bq-fh-prepare-scoring-research-successor-v1`. The implementation commit is resolved by `git log -1 --format=%H -- tools/scoring/vn30_fh_successor.py`.

**252/252 TypeScript tests passed**, including all 33 formal integrations and seven WP2 tests. **25/25 Python tests passed**, including three WP2 successor tests, five WP1 successor tests, 10 controller tests and seven governance tests. Focused typecheck and `CURRENT_PARITY_PASS` passed. WP1 workflow replay matched the archived receipt, thereby preserving all four accepted BQ scores. Exact official V8 reducer replay matched ID, rated rows, 21 N/R and null full score. No remaining 16 rubric behavior was changed. The CLI rejected publication. All six skill references and category parameter names were checked.

| Criteria | Disposition |
|---|---|
| AC01–AC06 | Pass. Recorded approval, preserved registry, implemented three bounded contracts and reused PX01 and sector controls. |
| AC07–AC12 | Pass. Actual annual and incremental execution, FY/cutoff evidence, freshness, historical eligibility and WP1 replay verified. |
| AC13–AC17 | Pass. Full isolated sequence executed, effective coverage separated, downstream receipts rendered, six skills validated. |
| AC18–AC22 | Pass. Formal code and controls and V8 remain in force; regression evidence retained and publication denied. |

Remaining economic dependencies are an obligor-specific dated liquidity ladder, accessible deposits and committed funds, material covenant/commitment disposition, and related funding and capital response under stress. Formal activation requires a separate exact successor methodology/executable, admitted dataset and adopted assessment, formal preflight and owner authorization; Stage 0 and Risk Policy gates remain applicable.
