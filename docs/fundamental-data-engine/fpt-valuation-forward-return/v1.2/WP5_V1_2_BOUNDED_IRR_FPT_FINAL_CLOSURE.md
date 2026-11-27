# WP5 v1.2 · Bounded IRR and final FPT VAL-RET closure

**FPT VAL-RET remains N/R in FY2025 and at 13 November 2026.** A qualifying low or negative return now scores under bounded Method A. FPT's independently reviewed inputs still support sensitivities. No qualified return interval or independent conservative case was established.

Owner approved BR01–BR10 for isolated FPT using retained evidence only. Accepted predecessor commit 499e93e023189d603a18c742188eb8d6e8e2f264, methodology wp5-valuation-forward-return-v1.1.0, evaluator valuation-independent-research-v1.1.0, execution exec-fa86143377e9e25f36f2e5e0. VAL-PRIMARY and VAL-MOS are exact retained rows in both periods. The separately staged diagnostic remains outside this implementation. [Owner direction](OWNER_REQUEST.txt) · [Approved amendment](../../../03%20SCORING/WP5_VALUATION_FORWARD_RETURN_AMENDMENT_v1.2.json) · [v1.1 closure](../v1.1/WP5_V1_1_EXTERNAL_RESEARCH_VALUATION_FPT_FINAL_CLOSURE.md)

## Reusable contract

VAL-RET weight 8 and canonical bands remain below 8% (0–1), 8% to below 12% (2–3), 12% to below 15% (4–5), 15% to below 18% (6), 18% to below 22% (7) and at least 22% (8). Existing B and conventional A can still qualify independently, with B prioritized and A capped at 6. The bounded A assessment can authorize an analyst proposal from a supported single-band range or from a cross-band range with an independently supported conservative interior case. Picking a floor or midpoint numerically confers no points. Low or negative qualified IRR remains scoreable. The investor hurdle does not govern eligibility.

The evaluator binds issuer, period, information cutoff, price and share basis, model and exact five-year terminal. It checks eligible mapped refs, material dependency qualifications, comparable earnings and aligned entitlement, distribution regime, scenario coherence, supported bounds, reviewed omitted risks, numerical endpoints and an interior path. It requires no-rerating and contraction tests, applicable cross-check and counterevidence, and price-bound canonical proposals with adjacent-band rationale. A relevant adverse common dependency can veto a fallback. Nonmaterial CoE and WACC do not enter the relative shareholder IRR. A materially changed financial or share basis invalidates price-only refresh. Zero points remain rated; N/R remains missing. [Evaluator](../../../../src/domain/current-scoring/valuation-research-v12.ts) · [Tests](../../../../tests/unit/valuation-research-v12.test.ts) · [M3 methodology](../../../03%20SCORING/METRIC_DEFINITIONS.md#L1150)

## FPT retained evidence and dependency qualification

Verified raw price **VND 50,100** and conditional **1,885,727,648 ordinary shares**, with the 30 September 2026 anchor and completeNegativeSearch false. The scope-qualified FY2025 window ends on the retrospective 8 April 2026 information bound. Later FY2026 estimates do not enter that assessment. [Analyst packet](FPT_BOUNDED_RETURN_ASSESSMENT.json) · [Retained research evidence](../v1.1/EXTERNAL_RESEARCH_EVIDENCE.json)

| Dependency | Evidence and tested bound | Qualification and materiality |
| --- | --- | --- |
| Earnings foundation | FY working EPS 5,204.53; 9M parent NPAT 7.778tn; mechanically annualized EPS 5,499.61; FY2026 broker EPS 5,624 | Material and unbounded. Parent recurring economics, FTEL associate cash, finance income, appropriations and the post-FTEL bridge remain unresolved. |
| Growth | TCBS FY2026–2030 parent NPAT CAGR 9.85%. Annual growth 8.13%, 10.27%, 10.39%, 10.62%. June-to-November overlapping revisions −1.82%, −8.12%, −11.51%. | Sensitive to recurring earnings, GQ execution and incremental capital, AI competition and FH funding. The forecast informs a scenario; no supported sustainable growth range or path was selected. |
| Entitlement | TCBS forecasts 1,886m to 2,810m shares. Test 0/50/100% of each projected increment as pro-rata entitlement. Actual 2026 issuance is already in the cutoff anchor. | Material. General stock distribution guidance and past ESOP do not establish future legal entitlement or a narrower allocation. |
| Economic dilution | Reconstruct aggregate earnings from reported EPS × shares, and divide aggregate annual growth by economic dilution after entitlement. Published EPS/DPS on future shares are converted to one cutoff share. | Sensitivity only; no qualified range. Forecast aggregate issuance and investor shareholding must remain distinct. |
| Terminal stub | FY2030 to 13 November 2031 is 0.868 years. Test flat, +5% moderating and −10% adverse annualized earnings during the stub. | Material. No 2031 TCBS forecast and no qualified terminal extension. Weak cash and earnings resilience keep the stub relevant to the 8% boundary. |
| Distributions | Explicit zero credit, alongside retained illustrative entitlement-adjusted DPS. | Zero credit is an eligible model restriction. It does not forecast zero distributions. Positive payout and availability remain unqualified. |
| Exit multiple | Relative 1.0 no rerating; factors 0.90 and 0.80 are contraction tests. | Material. No verified issuer-specific probability or calibrated contraction bound. No absolute exit multiple required in this form. |
| Funding downside | FH refinancing sensitivity, weak cash conversion and investment income versus realizable cash. | Material. Scenario transmission remains unbounded. No formal survivability conclusion. |
| CoE | No model-compatible equity discount rate. | Irrelevant to the selected relative-shareholder-IRR form. |

The narrow trial comprises the three retained pro-rata allocations with flat stub. The new set tests joint adverse funding, depressed stub and contraction with zero pro-rata entitlement; intermediate flat-stub allocations; and a higher path with moderating stub and full pro-rata entitlement. No assumed probabilities or unsupported interior estimate was selected. EPS/share and dilution were applied once. A fifth identity growth period with a separate explicit terminal factor preserves the full horizon after the four forecast transitions. The reported extrema cover the displayed tests and do not exhaust feasible growth, ownership, dividend and contraction outcomes.

## Actual retained sensitivity replay and bounded disposition

| Entitlement as share of projected increment | No rerating, zero credit | No rerating, illustrative DPS | 20% contraction, zero credit |
| ---: | ---: | ---: | ---: |
| 0.00% | -0.46% | 2.72% | -4.80% |
| 50.00% | 3.69% | 7.07% | -0.83% |
| 100.00% | 7.80% | 11.38% | 3.10% |

The unchanged constant-growth reference at 10% growth and 0.7% dilution reproduces **9.2354%** with zero credit and **11.3939%** with illustrative payout. The predecessor replays exact artifact bytes and the successor independently checks numerical equality for the three retained zero-credit paths.

| Return model | Lower | Upper | Canonical bands covered | Qualification |
| --- | ---: | ---: | --- | --- |
| Retained flat stub, no rerating, zero credit | −0.46% | 7.80% | Below 8% | Sensitivity only |
| Retained illustrative distribution | 2.72% | 11.38% | Below 8%; 8%–<12% | Sensitivity only |
| Retained 20% contraction, zero credit | −4.80% | 3.10% | Below 8% | Sensitivity only |
| Joint downside, interior and upper diagnostics | -6.53% | 8.72% | Below 8%; 8%–<12% | SENSITIVITY_ONLY_RANGE |
| Qualified range or representative conservative case | — | — | None | No defensible return conclusion |

The initial below-8% result conditions on flat terminal earnings, zero dividend credit and a selected ownership set. It does not establish representativeness for expected total return. Other materially plausible scenarios cross 8%, and the uncertainty set lacks adequate economic bounds. No 0/8 or 1/8 proposal follows. Dated purchase price and share basis remain required even if a refreshed scale-free IRR is invariant. [Result and gap codes](FPT_VALUATION_RESULT.json)

| Period | Route reviewed | Proposal | Executable / Effective Score |
| --- | --- | ---: | --- |
| FY2025 | B and bounded A, retrospective | Null | N/R / N/R |
| 13 Nov 2026 | B and bounded A relative zero-credit diagnostic | Null | N/R / N/R |

Current diagnostic status is **SENSITIVITY_ONLY_RANGE** and confidence **4/10** (2 freshness, 0 completeness, 2 source reliability, 0 estimate-dependence strength, 0 model robustness). Counterevidence covers forecast downgrades, FTEL, weak cash, dilution, distributions, exit contraction, funding and AI. No adjacent score band can be defended with a qualified range or independently supported conservative base.

## Execution and authority

**34 points on 65/100 rated weight, coverage 13/23.** Confirmed current 9 rubrics, 41/100 weight and 21 points. Provisional 4 rubrics, 24/100 weight and 13 points. Three genuine valuation N/R at 20/100 weight. Seven outside scope at 15/100. Valuation and full Investment Score remain null. BQ/FH/GQ/IC preserved exactly. FH and valuation gates NOT_ASSESSED, Stage 0 UNKNOWN, Hard Veto PENDING and residual risk NOT_RATED. No formal ranking or actionability.

Execution **exec-b49c62e59ae2c95c831ec516**, queue **queue-8a7aa61f9d4d7a3d981dd58e**, replayed predecessor **exec-fa86143377e9e25f36f2e5e0** and bound effective rows through Prepare → Adoption → Preflight → Scoring, cumulative aggregation, analytical Decision inputs and research HTML. [Candidate](CANDIDATE.json) · [Workflow](FPT_VALUATION_WORKFLOW.json)

Seven existing skills were updated in place. No new skill. The operational commands are:

    node tools/scoring/validate_fpt_bounded_return.mjs --ticker FPT
    python3 -B tools/scoring/vn30_bounded_return_successor.py --ticker FPT --cutoff 2026-11-13 --universe-version vn30-20260803-reviewed-20261115

| Acceptance criteria | Disposition |
| --- | --- |
| AC01–AC10 | Scoped amendment, unchanged objective and boundaries, qualified range logic and distinct zero credit verified. |
| AC11–AC17 | Allocation and terminal stub reviewed; exact sensitivity replay; six-way predecessor data and actual RET null proposals recorded with explicit economic gaps and confidence. |
| AC18–AC22 | Seven skills, cumulative workflow, numeric zero test and exact accepted non-RET rows verified. |
| AC23–AC27 | Regression and baseline below. Risk boundaries unchanged, no external discovery, exact artifacts and closure retained. |

Methodology **wp5-bounded-irr-v1.2.0**, evaluator **valuation-bounded-irr-research-v1.2.0**, workflow **vn30-val-research-successor-v1.2**. Final local commit reported separately.

| Artifact | SHA-256 |
| --- | --- |
| WP5_VALUATION_FORWARD_RETURN_AMENDMENT_v1.2.json | feb3fd19b16c3ec94233cbbe15b445c489b669f272815a311661a8c7b7335b6e |
| CANDIDATE.json | 3f0de662d114c69a49feb50aebc484e0247c8d7d052597f648d1462c86c434be |
| FPT_BOUNDED_RETURN_ASSESSMENT.json | 86c1a659141b00402ee195194de6610bff0a8d9dd84a6ecd3bd8b07ead7d2207 |
| FPT_VALUATION_RESULT.json | 2984a86a6ff184a79a3c6d17d54b0fc7c338e32221763106f8b4f3275bdea2a7 |
| FPT_VALUATION_WORKFLOW.json | b4265d5237fcc9d655952500838944f094ebb4777a798f58af2c4920bbc4ae89 |
| valuation-research-v12.ts | 1409f2706d5ade62673e236f1b3fad332a456e0f00fe421b0b8f6663d20c9c29 |
| validate_fpt_bounded_return.mjs | 0e1999adb3b2aa0cd44d453b42bf957093f85cf38f23c9560cdaf199aa0673a1 |
| vn30_bounded_return_successor.py | 9352dc0998958357122023250521f6393606378e8ed21790193acfe7cdb69ff4 |
| TEST_RESULTS.json | f18a98f193465af1d4a87077d7accef0181a1764ecfa54c5c972b8b69de00aa2 |

**Regression.** 354/354 TypeScript, including 14 WP5 v1.2 tests, 33/33 formal integration tests and FPT V8 exact-scope replay. 47/47 Python, including exact cumulative workflow, numeric zero at Prepare and seven skill links. TypeScript 6.0.3 reports the exact five existing diagnostics from v1.1. Formal parity returned CURRENT_PARITY_PASS. [Test receipt](TEST_RESULTS.json)

**Recommendation.** Accept the isolated bounded IRR implementation and close this FPT reassessment with documented VAL-RET N/R. Reopen only when eligible evidence economically bounds the normalized trajectory, entitlement and economic dilution, November 2031 earnings, and contraction/funding exposures sufficiently for a defensible qualified range or independent conservative case. Retain the predecessor scores and authorities.
