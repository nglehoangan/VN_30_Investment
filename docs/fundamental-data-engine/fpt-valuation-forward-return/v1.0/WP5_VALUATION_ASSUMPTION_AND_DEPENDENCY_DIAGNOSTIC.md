# WP5 valuation assumption and dependency diagnostic

**Verdict.** Retain all six FY2025/cutoff valuation N/R dispositions. The WP5 evaluator has demonstrable cross-rubric coupling, especially on the B return route, but removing those gates in memory did not produce any defensible FPT score. The accepted cumulative result remains 34/65 and 13/23, with three in-scope valuation N/R, a null full score, and unchanged official FPT V8 and formal gates.

## Exact scope and evidence

Reviewed commit **e9d76804f8d480449c3858ebab17485f2837fa99**, methodology **wp5-valuation-forward-return-v1.0.0**, module **valuation-route-research-v1.0.0** and host **vn30-val-research-successor-v1**. Reviewed both assumption packets, result and workflow; the retained CaféF raw close, corporate-action/conditional share review, Q3 parent NPAT, FY after-appropriation earnings, FTEL bridge, GQ and FH products, historical P/E and cash conversion, and the retained current and FY valuation research. No evidence was added or requalified. [WP5 closure and source links](WP5_VALUATION_FORWARD_RETURN_FPT_SCORING_CLOSURE.md) · [Approved amendment](../../../03%20SCORING/WP5_VALUATION_FORWARD_RETURN_AMENDMENT_v1.0.json) · [M3 §§8.1–8.4](../../../03%20SCORING/METRIC_DEFINITIONS.md#L1075)

The TCB packages corroborate the distinction between approved method, qualified accounting observations, scenario restrictions and supported valuation inputs. TCB's common-book, capital/ROE and nominal-VND CoE requirements apply to its residual-income/justified-P/B economics. A zero-credit or no-issuance scenario restriction is a choice, not an observed fact. TCB is a qualification precedent, not a source for FPT inputs or an authority to import a TCB CoE gate into a shareholder IRR. [TCB qualification](../../dfr-05/tcb-assumption-qualification-4a205261/TCB_ASSUMPTION_QUALIFICATION_FINAL_REVIEW.md) · [TCB bounded review](../../dfr-05/tcb-bounded-economic-b5c8fe27/TCB_BOUNDED_RESEARCH_FINAL_REVIEW.md)

| Artifact | SHA-256 |
| --- | --- |
| WP5_VALUATION_FORWARD_RETURN_AMENDMENT_v1.0.json | `dd375002a38a9a2ed1f6c3e4d3b3dc554bd89595dfdffa8020e8f886e496486c` |
| CANDIDATE.json | `61adbc90cb1d2129d8e0cefc95ee8bdf538b34f3a02983cef75841b1225a4f12` |
| FPT_VALUATION_ASSESSMENT.json | `6256315d79f04c7682b7f341a0040de7e33021780c9eece43ab53887fd3baf4c` |
| FPT_VALUATION_RESULT.json | `10476eb3c2364f71a1f2dbcc1c711463030ae23bfff107f3110d3bafec973555` |
| FPT_VALUATION_WORKFLOW.json | `458b71f08e0e4a8a17d4992ae743cfe4ff47d4cfd21fdc42b185ffa83fff43c7` |
| TEST_RESULTS.json | `b4e74cd047ecbb92986fe2bd85417067dc2ea995525b1c391a613fbfb5e55945` |
| valuation-research.ts | `008c1583950921044d79538fca9751a7022561ad4278752f0881632622b07aa1` |
| validate_fpt_valuation.mjs | `41ce4822b2de59d55c0ebb42dc8ed35ed7ebc72665940bc698e52bf8aa09e855` |
| vn30_val_successor.py | `cac2a89454897f4d2575f11a81db61e620713a4caa11a28bce90f57379787143` |

## All 27 assumptions across both periods

The values below are the packet values, with exact computed proxies noted where relevant. **F** = FACTUAL, **S** = SENSITIVITY_ONLY, **U** = UNSUPPORTED. **Eligible** means already admissible for the stated narrow role; **Context** means bounded descriptive/stress reasoning is possible without promoting the operand; **Conditional** means an explicit conservative model restriction or further supported review is possible; **Open** means a remaining substantive qualification gap. Every row can be assessed under VA10–VA22 without changing bands or weights. An explicit no-distribution model form may need executable clarification, as discussed below. The linked packet retains source IDs, unit, scope and stated reasons per row. [Assumption packet](FPT_VALUATION_ASSESSMENT.json)

| Assumption (unit) | FY2025 / cutoff values | Status FY / cutoff | Evidence and independent diagnostic | Disposition |
| --- | --- | --- | --- | --- |
| `raw_price` (VND/share) | 95800 / 50100 | F / F | Already qualified in both. The runner rehashes the exact response and cross-checks ticker/date, field, unit and isolated admission. | Eligible |
| `shares` (ordinary shares) | 1703507121 / 1885727648 | F / F | Already accepted conditionally at cutoff. Q3 anchor and event review do not establish a complete negative search. | Eligible |
| `parent_earnings` (VND) | 9376127629501 / 7778081180761 | F / F | FY and 9M observations qualify separately. They do not qualify recurring earnings or cash available to equity. | Eligible |
| `working_eps` (VND/share) | 5204.53 / 5500 | S / S | Use as a dated model anchor or sensitivity. Exact replay produces 5,204.53 and 5,499.61. Neither number establishes normalized EPS. | Context |
| `normalized_eps` (VND/share) | null / null | U / U | FY after-appropriation earnings are a credible starting bridge. Retained inputs do not bound the net material adjustments in both directions, especially after FTEL. Arbitrary haircuts are insufficient. | Open |
| `seasonality` (quarterly factor) | null / null | U / U | Nine months do not identify Q4 or a same-scope seasonal range. A growth-only model can avoid mechanical annualization but still needs a durable basis. | Open |
| `ftel_scope` (VND) | null / null | U / U | The accounting transition is known. Comparable recurring parent earnings, cash rights and standalone associate value are not jointly bounded. | Open |
| `recurring_adjustments` (VND) | null / null | U / U | The FY fund deduction is known. Remaining M&A, nonrecurring finance income, disposals, tax and recurring-fund effects cannot simply be treated as zero. | Open |
| `growth` (fraction) | [0.07, 0.12] / [0.05, 0.15] | S / S | Strong annual history and GQ evidence anchor sensitivities. Modest 5–10% growth is plausible but the post-change recurring parent-earnings path and cash constraints do not support that as an eligible band-stable interval. | Open |
| `revenue_growth` (fraction) | [0.05, 0.15] / [0.05, 0.15] | S / S | The retained GQ revenue scenarios can bound exploratory sales inputs. The project profitability and parent-earnings bridge remain missing. | Context |
| `margin` (fraction) | [0.12, 0.16] / [0.12, 0.1567] | S / S | Reported operating margins can anchor constrained near-term scenarios with explicit FTEL scope. They do not establish sustained equity earnings or owner-cash margins. | Context |
| `tax_rate` (fraction) | 0.2 / 0.2 | S / S | Use 20% as an illustration. Reported tax can anchor additional sensitivities, but recurring tax incidence across the changed mix and associates is unresolved. | Context |
| `reinvestment` (fraction of sales) | [0.06, 0.08] / [0.06, 0.08] | S / S | Retained CAPEX and reinvestment scenarios constrain near-term tests. Maintenance versus growth CAPEX and incremental working capital remain unallocated. | Context |
| `working_capital` (VND) | null / null | U / U | Observed cash absorption is adverse evidence. The repeatable working-capital need and parent allocation are unbounded. | Open |
| `cash_basis` (fraction) | [0.28, 0.71] / [0.28, 0.71] | S / S | Keep conversions as stress anchors. Group FCF/NPAT mixes NCI, associates, maintenance and growth CAPEX, and funding effects. No parent cash conversion range follows. | Open |
| `payout` (fraction) | [0, 0.3] / [0, 0.3] | S / S | Zero is defensible now as deliberately excluded dividend credit. Positive payout has historical evidence but no qualifying forward bound in this packet. | Conditional |
| `dividend_availability` (VND/share) | null / null | U / U | No certainty of future distributions is needed. A supported conservative positive amount still needs parent capacity and a usable distribution bridge. Zero makes dividend availability irrelevant to that model. | Conditional |
| `dilution` (fraction) | 0.007 / 0.007 | S / S | Historical 0.7% ESOP is a usable anchor. A stress range would need material issuance policy, event and refinancing review. Pro-rata shares alone imply no economic dilution. | Conditional |
| `exit_pe` (multiple) | [16, 20] / [10, 18] | S / S | Relative exit equal to starting P/E is a supportable scenario convention. No forecast of the arbitrary absolute range or a bounded downside contraction is supported. | Conditional |
| `fair_pe` (multiple) | null / [10, 14] | S / S | Historical group P/Es and older segment multiples are contextual. No comparable post-FTEL earnings multiple range is established, including a conservative stress multiple defensible for MOS. | Open |
| `discount_rate` (fraction) | [0.12, 0.16] / [0.12, 0.16] | S / S | No usable equity calibration. A market-based earnings or undiscounted shareholder-IRR route need not use CoE. | Open |
| `wacc` (fraction) | 0.128 / 0.15 | S / S | The 12.8% enterprise anchor and 15% sensitivity context are not model-compatible CoE, or a newly qualified WP5 WACC. No WACC operand is required for shareholder IRR. | Open |
| `terminal_growth` (fraction) | 0.03 / 0.03 | S / S | Terminal growth matters to the Gordon DCF and needs a long-run economic basis. It can be excluded entirely from the earnings/no-rerating model. | Open |
| `debt_refinancing` (VND) | null / null | U / U | Retained FH capacity and maturity data support downside analysis. They do not establish committed funding or parent service cash. May be counterevidence instead of a numeric scenario operand. | Conditional |
| `excess_cash` (VND) | null / null | U / U | An explicit no-addback policy is defensible. A positive surplus-cash amount cannot be supported from gross deposits and would risk duplicating financial income. | Conditional |
| `associate_value` (VND) | null / null | U / U | No separately qualified FTEL estimate. An aligned parent-earnings model could avoid separate addback if scope, retained exposure and distributability are bounded. | Open |
| `permanent_impairment` (VND/share) | null / null | U / U | Funding and cash realization identify material downside. The packet cannot quantify a stressed earnings and value floor or bound permanent loss. | Open |

Qualification is not a guarantee. A bounded forecast can use ranges, conservative scenario choices, eligible evidence and quantified counterevidence. The cutoff payout row is too coarse if its rationale is read to exclude an intentional **zero-credit** case. A recurring dividend forecast is unnecessary for that case. This does not cure the unresolved earnings, dilution or exit-risk bridge. No other restriction was identified as independently decisive for actual FPT.

## Dependency matrix and exact predicates

Both periods use the same lists. **D** = cash_basis, discount_rate, terminal_growth, associate_value. **R** = normalized_eps, growth, payout, dilution, exit_pe. **E** = normalized_eps, fair_pe. Shared gates include verified price/share basis, model freshness, five-dimension confidence, scope, cross-check and counterevidence. All three rubrics have separate proposals and result gates.

| Rubric | Economic dependencies | Executable dependencies | Unnecessary or over-broad dependencies | Verdict |
| --- | --- | --- | --- | --- |
| VAL-PRIMARY | Credible representative and conservative value relative to price, suitable method and corroboration; either normalized EPS and fair multiple or model-consistent cash/discount/terminal assumptions | B = D, A = E; ordered positive value range, scope, shared route controls and proposal | Associate value only if separately used or material; discount/terminal must match the valuation method. Neither a qualified RET scenario nor a MOS score is required. A shared verdict could import unrelated concerns. | Independent in result, partial coupling in control |
| VAL-RET | Same-basis earnings or value, growth, distributions or explicit zero credit, dilution, exit/rerating downside; qualified conservative or probability-weighted base | B = D ∪ R; A = R in actual packet; numeric scenarios must bind to all R ranges, with separate no-rerating test | B inherits D even for a cash-flow IRR model without DCF-derived entry/exit. A does not require fair P/E, CoE or terminal growth unless added in its shared list. Both can be vetoed by irrelevant model cross-check/adverse qualification. Exact EPS level is additionally unavoidable in this executable even in the zero-credit/no-rerating identity. | C confirmed in B; conditional D for independently supported models |
| VAL-MOS | Independent conservative quantitative value, stressed earnings and valuation, balance-sheet response and impairment; price basis | B = D, A = E; positive conservative value and impairment review; A earnings route computes its conservative value from low EPS × low fair P/E | No RET growth, payout, dilution or exit dependency in the actual lists, except where material to the chosen value or generic list. A qualified representative PRIMARY conclusion is economically unnecessary. Shared cross-check and adverse review can still veto an independent conservative method. | No actual RET-to-MOS inheritance; conditional structural coupling |

- **L119–125.** Qualification requires FACTUAL/QUALIFIED_ESTIMATE/BOUNDED_ESTIMATE, freshness, cutoff, model and rubric membership, usable refs, documented fields and a finite value or ordered range. Those metadata checks do not narrow the required key list. **L138–142** unions every shared dependency before applying per-rubric checks. Tagging a dependency for another rubric alone can make it fail for this rubric, because it stays in the union.
- **L147–164, L180–185.** Normalized-earnings range derives from EPS × multiple with a midpoint representative value. RET binds every scenario to the five R inputs, requires calculable downside/base/upside and no-rerating, and requires no-rerating IRR ≥15% for proposals ≥6 points. MOS needs conservative value and `impairmentReviewed`. Neither RET nor MOS reads another rubric's points.
- **L174–179, L193–196.** `crossCheckResolved`, scope and counterevidence are shared by route. One cross-check failure rejects each rubric on that route. A B contradiction/invalidation vetoes otherwise passing A even if the B adverse issue is unrelated to that rubric. That final veto is not emitted as a gap in the passing A route. A material common contradiction still should propagate.
- **L169–173, L186, L188.** Points require a canonical, price/share-bound proposal; zero gaps; and satisfaction of applicable ceiling and maximum controls. All actual proposals are absent and routes have real model/scenario gaps. No returned N/R is caused by the B adverse veto, since actual counterevidence is BOUNDED_LIMITATION.
- **Runner L90–91.** FPT source usability is presence in the pinned packet plus matching valuation reference date, rather than independently evaluating each source's publication date by dependency. The FY packet is expressly retrospective; this is a future eligibility hardening point, not a demonstrated timing failure or N/R cause here. [Evaluator predicates](../../../../src/domain/current-scoring/valuation-research.ts#L108) · [Runner](../../../../tools/scoring/validate_fpt_valuation.mjs#L88) · [Workflow](FPT_VALUATION_WORKFLOW.json)

**Read-only challenge.** All 14 existing valuation tests passed, including byte-exact evaluator replay. With the existing TypeScript synthetic fixture, control returned 4/2/1; withholding PRIMARY and invalidating fair P/E left RET at 2; withholding PRIMARY and return growth/scenarios left MOS at 1. Setting only A cross-check false blocked all three. Adding unqualified cash_basis to A's shared list blocked independently passing RET. B contradiction vetoed all three passing A routes without A gaps. Removing normalized EPS blocked RET. In actual packet copies, removing B's shared additions and setting both routes' cross-check/scope flags true still left all six rubric-period results N/R. No accepted status or output changed. Retained Scoring aggregation equals evaluator aggregation. [Targeted fixture](../../../../tests/unit/valuation-research.test.ts#L14) · [Retained result](FPT_VALUATION_RESULT.json)

## No-rerating return

Raw VND 50,100, conditional 1,885,727,648 shares; the 9M mechanical EPS proxy is 5,499.61 and gives 9.11×. The retained 10% aggregate growth, 0.7% dilution and 20% payout case uses EPS 4,950, entry/exit multiple 10.1212× and five end-year distributions. The unchanged solver reproduces **11.3939%**. The otherwise identical zero-credit calculation is **9.2354%**. With no dividends and identical entry/exit earnings and multiple bases, terminal price divided by entry price is `[(1+g)/(1+d)]^5`; the earnings level cancels. Reinvestment of interim distributions is not assumed in that identity. When dividends are nonzero, their amount relative to purchase price still matters.

| Sensitivity at 0.7% annual dilution, 4,950 EPS | Zero dividend credit | 20% payout |
| --- | ---: | ---: |
| 5% growth, no rerating | 4.27% | 6.33% |
| 10% growth, no rerating | 9.24% | 11.39% |
| 15% growth, no rerating | 14.20% | 16.46% |
| 10% growth, 8× exit | — | 6.59% |

Price and share identity remain necessary for a dated assessment. The formula still requires the same earnings definition, period-compatible scope, sustainable beginning and ending economics, and share-adjusted growth. Equal multiples are a scenario restriction, not evidence that contraction cannot happen. Historical growth, ESOP and dividends inform ranges; accepted GQ indicates opportunity and FH indicates financial capacity and downside, neither supplies a growth/distribution/dilution point forecast. Plausible sensitivities cross several canonical brackets. A conservative base need not remain in-band under every downside, but a particular base must itself be economically supported. Here **11.39%** would indicate the 8–<12% bracket *if qualified*. It does not qualify the FY or current model. The prior FY 11.00% illustration used fixed DPS and a no-rerating FY markup; its financial inputs are retrospective and its qualified return cannot be inherited. [Retained calculations](FPT_VALUATION_RESULT.json)

## PRIMARY, MOS and period dispositions

The three earnings sensitivities are VND **44,000 / 59,400 / 77,000** and the DCF sensitivities **12,815 / 29,625 / 69,959** per share. The midpoint gap is roughly VND 29,775. Neither result qualifies as fair value. The two methods share the earnings foundation. Differences in assumed conversion, shareholder discount rate and terminal growth produce a material sensitivity discrepancy, not a contradiction between two eligible valuations. Weak cash realization and inability to equate group FCF with parent FCFE are genuine adverse economics. Lowering an assumed EPS and multiple together does not establish an independently conservative intrinsic value. At 50,100 the 44,000 test implies −13.86% MOS and the 59,400 test +15.66%; neither can determine the canonical MOS band. FH funding sensitivity, FTEL exposure and cash deterioration support stress, but do not quantify an impairment floor. [WP5 valuation evidence](FPT_VALUATION_RESULT.json)

| Rubric and period | Actual cause | Classification |
| --- | --- | --- |
| PRIMARY FY2025 | After-appropriation proxy and historical or segment P/E have no qualified recurring/fair-value bridge. Cash/discount/terminal model is unqualified. | A, G |
| PRIMARY cutoff | Mechanical annualization, FTEL scope and weak cash proxy lack a supported EPS/owner-cash and fair-value calibration. | A, G |
| RET FY2025 | Exploratory fixed dividends, growth and dilution lack a qualified basis; B route adds D unnecessarily for an earnings IRR. | A, G; C at B, not decisive |
| RET cutoff | Zero-credit case removes future dividend dependency economically, but sustainable post-FTEL growth, dilution and contraction downside remain unqualified. B inherits D. | A, G; C at B, not decisive |
| MOS FY2025 | No independently defensible conservative value and permanent impairment bound from the year-end basis. | A, G |
| MOS cutoff | Cash, refinancing and FTEL evidence inform downside; no qualifying conservative value or quantitative impairment review. | A, G |

B applies only as a targeted qualification caution on the zero-credit reasoning. D is demonstrable for synthetic independently eligible models if unrelated gates are applied, not an actual supported FPT point proposal. E does not apply to independent bounded quantitative RET or MOS generally, which VA15, VA19 and §§15.9, 16.8 already allow. Formal treatment of a fully scale-free return needs clarification if chosen. F is unsupported by the verified evaluator/workflow agreement.

## Owner decision list

1. **Accept the six N/R outcomes in this diagnostic.** Keep FY historical/sensitivity figures separate and retain the cutoff score, risk and authority status.
2. **Approve a scoped executable correction separately.** Bind dependency sets, cross-checks and counterevidence to rubric and model. Propagate only economically material common failures. Require the B adverse veto to identify the affected rubric and expose its reason. The already approved independence rules suffice. This does not require changing the scoring methodology.
3. **Clarify only if selecting the scale-free form.** A zero-credit no-rerating case may avoid the exact normalized EPS number where a demonstrably comparable normalized earnings/value basis, bounded per-share growth/dilution and dated exit-contraction analysis exist. Keep the ordinary M3 starting earnings/value disclosure, work in the canonical return bands and preserve quantitative evidence. If the owner intends to waive the M3 requirement to record a normalized starting earnings/value basis altogether, that is a methodology amendment and is not recommended.
4. **Use independently qualified bounded value only when evidence supports it.** A fresh earnings/parent-cash bridge plus calibrated fair multiple or equity discount/terminal inputs can reopen PRIMARY. Supported distribution bounds or explicit zero credit and economically bounded growth/dilution/exit permit RET. An independent stressed value plus impairment bridge can reopen MOS under the existing methodology, even while PRIMARY remains N/R.

