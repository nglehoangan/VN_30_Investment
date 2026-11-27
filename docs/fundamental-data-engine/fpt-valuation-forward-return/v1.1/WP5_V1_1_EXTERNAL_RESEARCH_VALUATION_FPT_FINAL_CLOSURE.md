# WP5 v1.1 · External Research Evidence and FPT valuation closure

**Verdict.** Six approved reports retained and hash-verified. Five are in-scope research/context evidence, one (HTG) is admitted as methodology only. None was unavailable or rejected as a document. The three valuation rubrics remain **N/R** in FY2025 and at 13 November 2026. The new evidence improves forecast calibration, while investor entitlement, sustainable post-FTEL earnings, the 2031 bridge and conservative valuation remain unqualified. The dependency correction was verified independently and all 13 predecessor Effective Scores replayed.

The owner authorized one isolated FPT reassessment with exactly these reports, the v1.1 executable corrections and a local scoped commit. VA01–VA28, canonical objectives, weights 8/8/4, existing bands and A ceilings 6/6/3 remain in force. Base commit **e9d76804f8d480449c3858ebab17485f2837fa99**. The v1.0 diagnostic was reviewed at its exact hash recorded in the successor methodology. Its working-tree artifact is not a runtime prerequisite. [Owner authorization](OWNER_REQUEST.txt) · [Approved v1.1](../../../03%20SCORING/WP5_VALUATION_FORWARD_RETURN_AMENDMENT_v1.1.json) · [v1.0 closure](../v1.0/WP5_VALUATION_FORWARD_RETURN_FPT_SCORING_CLOSURE.md)

## Report intake and publication eligibility

| PDF | Analyst family | Publication / availability | Role and scope |
| --- | --- | --- | --- |
| [ERE01](research/ERE01.pdf) | TCBS Research | 2026-11-04 / 2026-11-04 | Latest FPT forecast through FY2030; November share denominator and cut to forecast growth. |
| [ERE02](research/ERE02.pdf) | TCBS Research | 2026-06-16 / 2026-06-29 | Superseded overlapping FPT forecast; retained June valuation scenarios and SOTP context. |
| [ERE03](research/ERE03.pdf) | TCBS Research | 2026-09-17 / 2026-09-17 | Industry, AI, competition and heterogeneous listed peer context; no independent TCBS vote. |
| [ERE04](research/ERE04.pdf) | GTJASVN Research | January issue; day not established / 2026-01-31 | Independent January ICT context with older FPT assumptions and nonportable target. |
| [ERE05](research/ERE05.pdf) | KBSV Research | 2026-10-19 / 2026-10-19 | Independent Vietnam macro scenario; credit/funding and FX context only. |
| [ERE06](research/ERE06.pdf) | FPTS Research | 2025-04-25 / 2025-04-25 | FPTS HTG FCFE/FCFF methodology. All HTG numerical inputs excluded from FPT. |

The manifest retains original and final HTTPS locations, page counts, exact PDF hashes and source roles. ERE02's June 16 metadata title and June 29 availability bound are distinct. ERE04's January availability uses the month-end bound with dated in-report references. ERE05's cover confirms 19 October. ERE06's cover confirms 25 April 2025. The retrospective FY information window ends 8 April 2026. ERE04 qualifies only as older context in that window, while ERE06 is method only. The later TCBS and KBSV papers apply only to the current window. No receipt date was treated as historical PIT authority.

The evidence packet has **23 page-bound observation records** including series, context and method entries. The three TCBS reports share one family. GTJASVN and KBSV are distinct families with different economic roles. The issuer's reviewed data remain authoritative for reported actuals. The v1.1 runner checks exact PDF bytes, observation hash/page, publication bound, forecast horizon and mapped dependency. Source admission does not qualify a forecast or allow an external target to become intrinsic value. [Manifest and extracted observations](EXTERNAL_RESEARCH_EVIDENCE.json)

## Forecast revisions, FTEL and normalized earnings

ERE01 page 7. VND billion except EPS/DPS in VND per share and shares in millions. CAPEX is shown as an outflow magnitude. Forecasts are distinct from issuer financial facts.

| FY | Sales | Parent NPAT | EPS | Cash DPS | CAPEX | Shares |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 2026 | 56,866 | 10,606 | 5,624 | 2,000 | 2,839 | 1,886 |
| 2027 | 63,690 | 11,468 | 5,504 | 1,957 | 3,730 | 2,083 |
| 2028 | 71,332 | 12,646 | 5,494 | 1,954 | 4,332 | 2,302 |
| 2029 | 79,892 | 13,960 | 5,488 | 1,952 | 4,532 | 2,543 |
| 2030 | 89,479 | 15,443 | 5,496 | 1,954 | 5,250 | 2,810 |

Parent NPAT grows **9.85% CAGR** over the four FY2026–FY2030 steps, while published EPS grows **-0.57% CAGR**. Annual NPAT growth in FY2027–FY2030 is 8.13%, 10.27%, 10.39%, 10.62%. TCBS assumes 12% sales growth from FY2027 and about 36% earnings payout. The forecast P/E row uses the 3 November market reference. It is neither a fair P/E nor a selected exit multiple.

| FY | June parent NPAT | November parent NPAT | Revision | June / Nov EPS as published | June / Nov NPAT per cutoff share |
| --- | ---: | ---: | ---: | ---: | ---: |
| 2026 | 10,803 | 10,606 | -1.82% | 6,342 / 5,624 | 5,729 / 5,624 |
| 2027 | 12,481 | 11,468 | -8.12% | 7,327 / 5,504 | 6,619 / 6,081 |
| 2028 | 14,291 | 12,646 | -11.51% | 8,389 / 5,494 | 7,579 / 6,706 |

June uses about 1,703m fixed average shares, while November uses different ending-share bases. The common-cutoff-share column isolates the numerator revision and excludes any forecast issuance effects. The older June SOTP references segment earnings and listed holdings. It is insufficient for a current FPT value because the scope, marks, holdings and duplicate associate earnings must be reconciled. GTJASVN's January growth and valuation context precedes this revision. The January target is excluded.

Current raw close **VND 50,100** and conditional **1,885,727,648 ordinary shares** replay from the pinned receipts. The share status is CARRIED_FORWARD_NO_CHANGE_FOUND_IN_REVIEWED_DOCUMENTS with completeNegativeSearch false. FY working EPS **5,204.53**, 9M mechanical annualized EPS **5,499.61** and broker FY2026 EPS **5,624** have different definitions. The broker figure and issuer actuals constrain near-term earnings but do not establish an eligible recurring EPS range. Post-FTEL consolidation is distinct from recurring equity-method income and cash reaching the parent. TCBS reports weak cash conversion and investment cash short of its accounting gain adjustment. The issuer cash data remain controlling, and aggregate investment cash cannot be attributed entirely to FTEL. Appropriations, finance income, cash-to-earnings conversion and the recurring component of associates remain material. [Assumption packet](FPT_VALUATION_ASSESSMENT.json)

## Share entitlement and November 2031 extension

The report attributes changing share counts to stock distributions at a general level. It does not give a complete legal entitlement timetable or allocation between proportionate issuance, ESOP and other issuance for every forecast year. The actual 2026 pro-rata issue is already present in the cutoff anchor. Three sensitivities allocate 0%, 50% or 100% of each projected *increment* to pro-rata entitlement. They are boundary scenarios, not an independently qualified economic dilution range. Round share and EPS units explain minor differences between NPAT/share and the published per-share series. Where investor holdings expand, multiply published EPS and DPS by the resulting holdings factor. Do not subtract the same dilution again.

| FY | Forecast shares (m) | Increase (m) | Investor holdings factor at 0/50/100% pro-rata | Investor-equivalent EPS at 0/50/100% |
| --- | ---: | ---: | --- | --- |
| 2026 | 1,886 | 0 | 1.0000 / 1.0000 / 1.0000 | 5,624 / 5,624 / 5,624 |
| 2027 | 2,083 | 197 | 1.0000 / 1.0522 / 1.1045 | 5,504 / 5,791 / 6,079 |
| 2028 | 2,302 | 219 | 1.0000 / 1.1075 / 1.2206 | 5,494 / 6,085 / 6,706 |
| 2029 | 2,543 | 241 | 1.0000 / 1.1655 / 1.3484 | 5,488 / 6,396 / 7,400 |
| 2030 | 2,810 | 267 | 1.0000 / 1.2267 / 1.4899 | 5,496 / 6,742 / 8,189 |

The annual investor-equivalent DPS, pro-rata/other shares and cumulative economic dilution are recorded alongside EPS in the result. Explicit holdings times each published flow equals the investor-equivalent cash-flow calculation. The cutoff is 13 November 2026 and terminal is **13 November 2031**. The November forecast ends FY2030, leaving roughly 0.868 years after 31 December 2030. The date-aligned illustrations hold investor-equivalent EPS flat during that stub, assume year-end 2027–2030 dividends where credited, and exclude 2026 and 2031 stub dividends. No published 2031 forecast or qualified terminal extension exists.

| Projected issuance credited pro rata | No-rerating, zero credit | No-rerating with illustrative DPS | 10% contraction, zero credit | 20% contraction, zero credit | Terminal EPS equiv. |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 0.00% | -0.46% | 2.72% | -2.53% | -4.80% | 5,496.00 |
| 50.00% | 3.69% | 7.07% | 1.53% | -0.83% | 6,741.95 |
| 100.00% | 7.80% | 11.38% | 5.56% | 3.10% | 8,188.63 |

All scenarios in this table are **SENSITIVITY_ONLY**. Contractions use unqualified relative multiple factors. On the separate retained constant-growth regression, the 10% aggregate / 0.7% dilution case reproduces **11.39%** with illustrative 20% payout and **9.24%** with zero credit. Zero credit deliberately excludes dividend cash flows and makes no payout forecast. The 5-year reverse grid remains sensitivity-only. It includes 8%, 12%, 15%, 18%, 20% and 22% targets under no rerating and an 8× compressed multiple. Without distributions the code compounds annual growth over economic dilution and applies the terminal relative multiple. The market/share basis still binds the proposal when the no-rerating identity is numerically invariant at a different synthetic price. [Financial result, sensitivity and reverse grid](FPT_VALUATION_RESULT.json)

## Assumption changes and independent route execution

There are **3 eligible rows per period both before and after**. FY price, shares and parent NPAT remain observational. Current cutoff shares are now explicitly recorded as BOUNDED_ESTIMATE, instead of an unqualified statement of fact. Current price and reported NPAT remain factual. The v1.1 packet maps 23 research observations to material assumptions; the remaining forecast and valuation rows are sensitivity-only or unsupported. The new relative multiple assumption is also sensitivity-only. The conservative model restriction of zero dividend credit is available independently of any payout forecast.

| Dependency | What changed | Qualification after review |
| --- | --- | --- |
| Normalized parent EPS and growth | Broker 5,624 reference, downward revisions, roughly 9.85% aggregate forecast growth, weak cash and scope bridge | No eligible normalized EPS or earnings growth range |
| Dividends and dilution | DPS/share series, actual entitlement and source dates reviewed | Explicit zero credit supported, actual forward payout and economic dilution range unqualified |
| Fair and exit multiples | June 12×/16×/17× contextual comparisons; September/November differing peer and own-history multiples | Fair multiple, exit range and contraction bound unqualified |
| CoE / WACC | KBSV GDP 9.0%, CPI 4.7%, funding and flat FX forecast context; retained enterprise ACBS context | No model-compatible equity discount estimate. GDP, interest or enterprise WACC not substituted for CoE. |
| Owner cash and terminal | Broker CAPEX and conversion risks; separate parent cash and association exposure | No parent FCFE, qualified terminal policy or November 2031 bridge |
| Downside and impairment | Observed retained FH cash/refinancing exposure; no exact funding or associate realization bridge | Quantitative stress illustrations only. No supportable permanent-impairment value floor. |

The versioned evaluator reuses the original valuation math and canonical band registry. Models, dependency sets, cross-checks and counterevidence are scoped per rubric, model, route and period. Relevant adverse B evidence vetoes A only through a declared common dependency with eligible evidence and an exposed reason. Qualified B retains priority. A RET no longer inherits DCF cash, discount, Gordon growth or associate valuation. Scale-free zero credit does not require a numerical EPS level or future payout. The normalized economic foundation, economic dilution, growth, dated price/share basis and contraction review remain necessary. An independent MOS path has no RET or representative PRIMARY requirement. [Evaluator](../../../../src/domain/current-scoring/valuation-research-v11.ts)

| Rubric | Detailed B | Bounded A | FY / current analyst proposal and effective result |
| --- | --- | --- | --- |
| PRIMARY | DCF lacks parent cash, rate and terminal evidence; SOTP lacks aligned associate and holdings bridge | Earnings multiple and owner earnings not independently qualified | Null / null; N/R / N/R |
| RET | Ordinary shareholder IRR lacks normalized basis, qualified growth, payout, dilution and exit | Scale-free zero-credit tested. Ownership, growth, contraction and same-basis Nov 2031 earnings unqualified | Null / null; N/R / N/R |
| MOS | No conservative cash/asset value or impairment bound | Independent stressed earnings × fair multiple lacks qualifying operands | Null / null; N/R / N/R |

At broker EPS 5,624, the 8×/10×/12×/14×/16× arithmetic produces VND **44,992 / 56,240 / 67,488 / 78,736 / 89,984**. That does not establish representative value or fair value. The 8× sensitivity gives indicative MOS **−11.35%** at 50,100, with the same qualification limits. It is not conservative intrinsic value. Earlier weak-cash DCF sensitivity is neither an eligible contradiction nor an independent validating cross-check. Retain the adverse cash and refinancing facts. Qualified representative value, base IRR, conservative intrinsic value and MOS are all **N/R**. The 4/10 research confidence overlay reflects strong source/date identity, incomplete comparability and model uncertainty. No adjacent canonical band is supportable without the above monetary or return basis. No historical point carry was used.

## Cumulative workflow and authority

The 13 prior Effective Scores are identical to v1.0. BQ 14/25 PROVISIONAL, FH 7/15, GQ 8/15 PROVISIONAL, IC 5/10. Cumulative **34 points on 65/100 rated weight, 13/23 coverage**. Confirmed current **9 rubrics, 41/100 weight, 21 points**. Provisional **4 rubrics, 24/100 weight, 13 points**. Genuine in-scope valuation N/R **3 rubrics and 20/100 weight**. Outside scope **7 rubrics and 15/100**. Valuation total and full Investment Score are null. Formal FH and valuation gates remain NOT_ASSESSED, Stage 0 UNKNOWN, Hard Veto PENDING, residual risk NOT_RATED. Ranking and investment actionability remain disabled. The single issuer has no rank ordinal. No production or publication was authorized.

Serial execution **exec-fa86143377e9e25f36f2e5e0**, queue **queue-ec2d35a03c2165a96a7d165e**, replayed v1.0 **exec-c8242f95af1f94b8a17e0258** and its predecessor stages. Prepare, Adoption, Preflight, Scoring and analytical consumers matched the exact pinned valuations and restrictions. [Candidate](CANDIDATE.json) · [Workflow receipt](FPT_VALUATION_WORKFLOW.json)

```sh
node tools/scoring/validate_fpt_valuation_v11.mjs --ticker FPT
python3 -B tools/scoring/vn30_val_v11_successor.py --ticker FPT --cutoff 2026-11-13 --universe-version vn30-20260803-reviewed-20261115
```

The new one-ticker external-research skill records the permitted source universe, hash and page provenance, source-family revisions and candidate qualification. The existing six skills link to it and now cover independent rubric checks, explicit zero credit and price-bound no-rerating. [External Research Evidence skill](../../../../skills/vn30-external-research-evidence/SKILL.md)

| Criteria | Disposition |
| --- | --- |
| AC01–AC09 | Approval, original controls and six selected sources recorded. All report roles verified, HTG method only. New skill and six updates retained. |
| AC10–AC16 | Actuals/forecasts, page provenance, revisions, FTEL, entitlement and horizon reviewed. No 2031 provider forecast claimed. |
| AC17–AC19 | One bounded qualification cycle. No scoring dependency qualified by a target or sensitivity alone. |
| AC20–AC26 | Independent dependency, scoped cross-check and adverse veto, zero credit and quantitative no-rerating verified. Normalized comparable foundation remains required. |
| AC27–AC34 | All six actual assessments evaluated. Documented genuine N/R. Canonical bands, ceilings, null proposals, confidence, counterevidence and price-bound refresh retained. |
| AC35–AC38 | Complete serial workflow and predecessor replay. Official V8 unchanged. |
| AC39–AC45 | Regression and typecheck below. Risk and authority preserved, scope held to six PDFs, identities and final report retained. |

## Exact identities

Methodology **wp5-valuation-forward-return-v1.1.0**, executable **valuation-independent-research-v1.1.0**, host **vn30-val-research-successor-v1.1**. The final reply records the scoped Git commit SHA.

| Artifact | SHA-256 |
| --- | --- |
| WP5_VALUATION_FORWARD_RETURN_AMENDMENT_v1.1.json | 6cb4c8eab18192d73fdc4dee9c9912abc3f10822f16fe71d4706f9954e8ca605 |
| CANDIDATE.json | 1c6ea2567f04a0476be89ff1c882de8ed50feba9c868e7695006f46103903bf1 |
| EXTERNAL_RESEARCH_EVIDENCE.json | 74ded3e72852e745e6598a05d85bb3c23f71ca666e7cf90bcdc5003474573206 |
| FPT_VALUATION_ASSESSMENT.json | 9f448f459bbb9a8b632c9973148d1b67bc5c719f52949ce0154d6a0eeb1a256d |
| FPT_VALUATION_RESULT.json | b4394ddb130f1439f081c299e3b3a89202d1ed204f3b5df96ff44b9782da6265 |
| FPT_VALUATION_WORKFLOW.json | dee968eb6988ccef6003ebae2879d3f8a4bc3d06749c0ca344e087299ae41784 |
| valuation-research-v11.ts | 92e00abcc7c0dd3b9c193df814ed82a485668c8af333da0d599fb2b740cfa3f3 |
| validate_fpt_valuation_v11.mjs | f0a37f63f80b978bb91fd1fb08fbb40f6a655777113961cfe82bbab614bd3e9f |
| vn30_val_v11_successor.py | cfcec09ac16901be3485315c2ce8ec9cf988eda86f2182bf4dfc00b4c75d302c |
| ERE01.pdf | 39afdee2eab20b58050250abbed2e8fa6b768420f6f162b4f9231349524d6773 |
| ERE02.pdf | 8071ff84dd5a8e8dba8ae75994616840458a53561786833af2037fd8acfb6388 |
| ERE03.pdf | 34f3888adf6e6a441dadb789f5a9beb8a734b04ba623cf7bd5d2377c4465dcc8 |
| ERE04.pdf | 7f2bff9fb0463642807650eb2e40e89cd80e427efcbb50c32934eb65dd946d3f |
| ERE05.pdf | 69a8c2ae1d49194d7aeafe00ce35725245d37c25a20a563065a9003e3ee50119 |
| ERE06.pdf | 65e8e2b57e1f034c37081570b4fe91fa5b78dbf0a172d122bfdfb9b4d73a3a7a |
| TEST_RESULTS.json | 342b301980cc06cacae74f23e2e529506af2c0b8ede21283b91f58f0b4a76882 |

**Regression.** 340/340 TypeScript, including all 33 official integration tests and FPT V8 exact-scope replay, and 44/44 Python passed. After the final source applicability hardening, all 6 targeted TypeScript and 2 Python tests passed again. TypeScript 6.0.3 reports exactly the five unchanged unrelated baseline diagnostics. Formal scoring parity returned CURRENT_PARITY_PASS. [Test receipt](TEST_RESULTS.json)

**Recommendation.** Accept the isolated evidence admission, executable correction and cumulative replay. Retain the six actual N/R dispositions. Reopen on a supported recurring parent-earnings/cash bridge, an evidenced investor entitlement allocation and November 2031 extension, and suitable relative exit or conservative value and impairment bounds. A model-compatible equity discount basis is needed for a discounted shareholder cash model; the independently eligible no-rerating route does not require one.
