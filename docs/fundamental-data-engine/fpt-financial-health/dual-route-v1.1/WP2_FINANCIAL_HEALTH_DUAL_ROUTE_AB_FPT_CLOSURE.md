# WP2 Financial Health Dual-Route A/B Amendment v1.1 and FPT closure

**Implementation verdict · Pass for isolated research.** The owner approved Method B first with independent Method A fallback for FH-LIQ and FH-STRESS. The amendment retains canonical bands, weights, sector conventions and FH01–FH15 except for the authorized fallback and ceilings. Starting HEAD was `97333b93bc0b057c1163c29488b63d5c71ebe516`. [Owner direction](OWNER_REQUEST.txt) · [Approved Baseline v1.1](../../../03%20SCORING/WP2_FINANCIAL_HEALTH_DUAL_ROUTE_v1.1.json)

| Rubric | Method B maximum | Method A maximum | Owner-authorized scope |
|---|---:|---:|---|
| FH-LIQ | 4/4 | 3/4 | Full timed liquidity/PX01 or a qualified basic cash and refinancing assessment |
| FH-STRESS | 5/5 | 4/5 | Full funded severe stress or a basic public-data scenario with an evidenced economic outcome |

Implementation choices include explicit B insufficiency, sufficient or adverse dispositions, a detailed-gap allowlist for fallback, separate A diagnostics and mechanically rejecting a proposal above its ceiling. B wins whenever it qualifies, irrespective of points. Known adverse B evidence, breach risk, unsupported counterevidence and invalid B selections cannot be displaced by A. For A, a qualified book-cash proxy needs an affirmative restrictions review; unverified cash, deposits and uncommitted finance do not become certain resources. Stress requires an economic conclusion supported independently of unsupported assumptions. Negative cash-flow sensitivity alone cannot establish failure, distressed financing or severe vulnerability. Survival requires affirmative support. The lifecycle also prioritizes an eligible current A-to-B replacement over an inherited A score, with documented method or scope transition and unchanged financial freshness controls.

## Actual scoring and rationale

| Rubric | FY2025 B result | FY2025 A result | Selected FY2025 | Current B result (13 Nov 2026) | Current A result | Selected current | Effective Score |
|---|---|---|---|---|---|---|---|
| FH-LIQ | N/R · matched timing and covenant disposition unresolved | N/R · basic economic conclusion unestablished | N/R | N/R · same two detailed dependencies on post-FTEL basis | N/R · basic economic conclusion unestablished | N/R | N/R |
| FH-STRESS | N/R · full funding/capital conclusion unresolved | N/R · vulnerability or survival unestablished | N/R | N/R · full post-transition funding/capital conclusion unresolved | N/R · vulnerability or survival unestablished | N/R | N/R |

Both Method A fallbacks actually ran. In each case the reason is `NEITHER_ROUTE_SUPPORTS_A_BAND`; no numeric proposal or band was selected. Each annual and current review remains 5/10 confidence, with current assessment validity NOT_RATED and no qualified numeric foundation. Materiality remains unresolved and near-term funding applicability prevents unsupported carry. Neither an elapsed-date expiry nor a covenant breach was asserted. The financial foundations are FY2022–25, with annual financial period 31 Dec 2025; current review uses September 2026 and eligible publication/event information through 13 Nov. The FTEL scope and maturity changes were retained. [Actual A/B decisions](FPT_FH_DUAL_ROUTE_RESULT.json) · [Route assessment and lineage to retained inputs](FPT_FH_DUAL_ROUTE_ASSESSMENT.json)

**FH-LIQ.** Reported cash of VND 10.522tn and 7.377tn gives book-cash/debt coverage of 0.549× and 0.515× at FY2025 and September respectively. Including all book deposits increases those sensitivity ratios to 2.095× and 1.974×. The verified unrestricted-cash numerator and qualified accessible deposit amount are both unavailable. Direct EBIT/gross interest is 13.57× and 9.63×, while short-term debt concentration is 90.97% and 86.26%. FY2025 CFO of VND 10.136tn and historical draws/repayments of 43.071/36.891tn indicate demonstrated funding activity. They do not establish future committed financing or cash availability at the obligor. Nine-month CFO of 0.952tn supplies an adverse current observation. Without assuming accessibility or refinancing, the latter facts do not affirmatively establish adequate liquidity with material refinancing dependence. Neither do the book ratios establish actual uncovered obligations or demonstrably severe dependence. This economic gap persists even when A allows imperfect timing and covenant data. Existing FY research 2/4 remains a comparison, not an eligible input.

**FH-STRESS.** The original severe 25% revenue shock, 10% stressed EBIT margin, 5% working-capital draw and +3pp funding cost assumption were reused. The scenario treats total cash CAPEX as a sensitivity and no undisclosed deferral, financing or cash access as certain. The current revenue, EBIT and interest are VND 40.023tn, 4.002tn and 1.314tn under stress. Positive stressed EBIT and interest cover coexist with a negative FCF proxy. Known short-term debt and lease obligations stay in the calculation.

| Severe sensitivity | FY2025 | September 2026 |
|---|---:|---:|
| Stressed interest coverage | 3.65× | 3.04× |
| Stressed FCF proxy, VND tn | −4.674 | −2.556 |
| Liquidity surplus at 25% deposit access, VND tn | −6.917 | −5.145 |
| Liquidity surplus at 50% deposit access, VND tn | +0.491 | +0.075 |

These values describe meaningful downside exposure. They do not establish severe financial vulnerability independent of usable cash, funding and the non-deferrable share of CAPEX. The high-access sensitivity also cannot establish survival, with little headroom before other obligations and no verified availability. Band 2 is therefore unsupported on both windows, even on Method A. The shared financial product in the result distinguishes reported cash/debt, funding and historical cash-flow FACT records, DERIVED ratios, EBITDA/scenario ESTIMATE proxies and ASSUMPTION inputs. It retains exact pins for the annual refinancing figures and prior financial evidence. [Original WP2 calculations](../v1.0/WP2_FINANCIAL_HEALTH_FPT_SCORING_CLOSURE.md) · [Predecessor bounded review](../bounded-closure-v1/WP2_FINANCIAL_HEALTH_BOUNDED_ASSESSMENT_CLOSURE.md)

## Actual workflow, integration and regression

| Output | Result |
|---|---|
| Prepare → Adoption → Preflight → Scoring | PREPARED_BQ_FH → ADOPTED_FOR_ISOLATED_VALIDATION → AUTHORIZED_FOR_ISOLATED_VALIDATION → SCORED_RESEARCH_ONLY |
| Business Quality | 14/25 PROVISIONAL, accepted replay |
| FH-BS | 3/6 CONFIRMED_CURRENT, accepted replay |
| Financial Health | 3 assessed points on 6/15; category total null |
| Combined research | 17 assessed points at 31/100 rated weight; 5/23 rubrics |
| Confirmed and provisional coverage | Confirmed 2 rubrics, 12/100 weight; provisional 3 rubrics, 19/100 weight |
| Genuine N/R / outside rollout | 2 rubrics, 9/100 / 16 rubrics, 60/100; total unrated 18 and 69/100 |
| Full Investment Score | Null |
| Downstream | Same seven dispositions and coverage in research aggregation, ranking, Decision input and scorecard. One issuer, no rank ordinal. |
| Authority and risk | Stage 0 UNKNOWN, hard veto PENDING, residual risk NOT_RATED. All formal and publication permissions false. |

- [fh-dual-route.ts](../../../../src/domain/current-scoring/fh-dual-route.ts) adds `scoreDualRouteFinancialHealth` and `scoreIncrementalDualRouteFinancialHealth`. It calls the existing full-route validator/PX01, shared incremental scorer, retention and Effective Score logic. The stress formula and original FH-BS were reused through pinned records.
- [validate_fpt_fh_dual_route.mjs](../../../../tools/scoring/validate_fpt_fh_dual_route.mjs) pins both scope windows, calculates derived signals from the shared retained data, and invokes the existing research aggregation, ranking and Decision consumers.
- [vn30_fh_dual_route.py](../../../../tools/scoring/vn30_fh_dual_route.py) replays the exact WP2 workflow in the same serial store, reuses its Prepare qualification, binds both route diagnostics to adoption and preflight, then requires an identical evaluator replay under the queue lease. It renders a research-only HTML scorecard from the scored artifact.
- Updated the six existing skills, `equity-s1-s5-assessment`, `vn30-evidence-coverage-closure`, `vn30-incremental-scoring`, `vn30-rollout-orchestrator`, `vn30-structural-nr-remediation` and `vn30-scoring-publication-hygiene`. Links and generic guidance were checked. Route order, ceilings, proxy integrity, transition and artifact retention are covered.
- [TypeScript tests](../../../../tests/unit/fh-dual-route.test.ts) · [Python workflow and skill tests](../../../../tests/unit/test_vn30_fh_dual_route.py)

```sh
node tools/scoring/validate_fpt_fh_dual_route.mjs --ticker FPT
python3 -B tools/scoring/vn30_fh_dual_route.py --ticker FPT --cutoff 2026-11-13 \
  --universe-version vn30-20260803-reviewed-20261115
```

Methodology `wp2-financial-health-dual-route-v1.1.0`, evaluator `fh-dual-route-ab-research-v1.1.0`, host `vn30-fh-dual-route-research-successor-v1`. Execution `exec-7a4ecfe193392cb62e489ba5`, queue `queue-3c93825187323eef97e01660`. [Candidate](CANDIDATE.json) · [Actual queued workflow receipt](FPT_FH_DUAL_ROUTE_WORKFLOW_RESULT.json)

**Validation · 261/261 TypeScript and 31/31 Python tests passed.** This includes all 33 formal integration cases, A-to-B replacement, both A ceilings, adverse B protection, restriction and funding exclusions, historical expiry, exact accepted BQ/FH-BS replay and publication rejection. Focused TypeScript validation passed.

**Recommendation · Accept the dual-route implementation and close the two documented N/R limitations.** Neither proposed 2-point trial band was supported. No new external evidence was collected. Official FPT V8 matched its retained ID and rated rows with 21 N/R and a null full score. Formal parity returned `CURRENT_PARITY_PASS`. Any future formal activation would require its own exact authorization and formal gate checks.
