# VNM — Complete Fundamental Analysis

Ngày nghiên cứu 11/11/2026. Baseline `91448d38c70a23d1a74b0b8d5b6c88622ba877ca`. Chỉ VNM; nghiên cứu hồi cứu, chưa phải formal ScoreInput. Tái sử dụng toàn bộ pilot, các assessment được challenge, financial ledger và báo cáo giữ lại; không thu thập lại FY2022–FY2025.

23/23 rubric được phân tích; 14 có điểm nghiên cứu đề xuất; 0 điểm formal. Không cộng tổng /100 hoặc suy ra M4. Engine route RETAIL được giữ nguyên; phân tích theo kinh tế doanh nghiệp sữa, không dùng same-store sales thay thế.

| Rubric | Band M3 | Proposed | Formal | Confidence |
|---|---|---:|---|---|
| BQ-EQ | Good economics | 5 | null | LOW |
| BQ-MOAT | Some differentiation | 3 | null | MEDIUM |
| BQ-CASH | Adequate realization with material qualifications | 3 | null | MEDIUM |
| BQ-RES | Material vulnerabilities | 2 | null | MEDIUM |
| FH-BS | Adequate | 4 | null | MEDIUM |
| FH-LIQ | Adequate with material refinancing dependence | 2 | null | MEDIUM |
| FH-STRESS | PENDING | null | null | LOW |
| GQ-HIST | Limited/low-quality trend | 2 | null | MEDIUM |
| GQ-FWD | Limited/cyclical | 2 | null | LOW |
| GQ-INC | PENDING | null | null | LOW |
| IC-IND | Mixed/cyclical/average | 2 | null | MEDIUM |
| IC-POS | PENDING | null | null | LOW |
| IC-CYCLE | Balanced normalized forward asymmetry | 1 | null | MEDIUM |
| VAL-PRIMARY | PENDING | null | null | LOW |
| VAL-RET | PENDING | null | null | LOW |
| VAL-MOS | PENDING | null | null | LOW |
| RG-GOV | Mixed concerns | 2 | null | MEDIUM |
| RG-RISK | ELEVATED_WEAK | 1 | null | MEDIUM |
| RG-UNC | Material manageable uncertainty | 1 | null | MEDIUM |
| CA-REINV | Mixed/acceptable | 1 | null | MEDIUM |
| CA-DIST | PENDING | null | null | LOW |
| CA-DIL | PENDING | null | null | LOW |
| CA-PSV | PENDING | null | null | LOW |

Các đề xuất mới là đánh giá bảo thủ có phạm vi, không phải điểm trung lập để lấp bảng. BQ-EQ phụ thuộc discount-rate proposal; GQ-HIST không khẳng định đã có chuỗi EPS điều chỉnh đủ bốn năm. Mọi null là chưa chấm, không phải 0.

## BQ-EQ — Good economics

Four profitable years, 14.3–15.3% reported net margins and ~26.5% group ROE support good historical economics. FY25 common profit after funds is 8.417tn, not 9.410tn. Against proposed 12–18% equity discount rates the reported return spread is positive; this is a sensitivity, not accepted ROIC/WACC. Finance income and an unqualified capital bridge preclude superior band.

Thuận lợi: Positive reported group ROE stays near 26.5% in FY23–25, with positive margins in all four years.

Phản biện: Group profit includes deposit/subsidiary economics; average group equity is not normalized common invested capital.

Điểm đề xuất: 5; formal: null; confidence: LOW. Upper-band qualification: Không đề xuất điểm tối đa rubric; không tuyên bố maximum prerequisites đã đạt.

Điều kiện còn mở: Human review must challenge the bounded band and its qualifications; no maximum-prerequisite claim.

Bác bỏ đánh giá khi: Recurring operating returns fall below required return, or deposit/one-off adjustments eliminate the spread.

Evidence và từng mandatory topic: [scorecard](VNM_23_RUBRIC_SCORECARD.json), `/rows/0`; ledger keys ở `evidenceReferences`, exact source/page/JSON Pointer/hash ở pilot ledger và `additionalSourceBindings`. Economic channel `BQ-EQ`. Formal blockers áp dụng cho toàn bộ mandatory topics.

## BQ-MOAT — Some differentiation

Scale, integrated farms, product development and distribution are concrete differentiation channels (annual pp26–29). Persistent positive margins support economic behavior, but constrained pass-through and heavy promotional spend reject a strong durable moat. No invented share/retention premium.

Thuận lợi: Annual industry discussion identifies scale, trust, distribution and specialized nutrition as potential competitive factors.

Phản biện: The same report describes fierce domestic/international rivalry and constrained pass-through; brand scale alone does not prove pricing power.

Điểm đề xuất: 3; formal: null; confidence: MEDIUM. Upper-band qualification: Không đề xuất điểm tối đa rubric; không tuyên bố maximum prerequisites đã đạt.

Điều kiện còn mở: Human review must challenge the bounded band and its qualifications; no maximum-prerequisite claim.

Bác bỏ đánh giá khi: Comparable pricing or cost data show no differentiation; sustained gross-margin loss despite spending.

Evidence và từng mandatory topic: [scorecard](VNM_23_RUBRIC_SCORECARD.json), `/rows/1`; ledger keys ở `evidenceReferences`, exact source/page/JSON Pointer/hash ở pilot ledger và `additionalSourceBindings`. Economic channel `BQ-MOAT`. Formal blockers áp dụng cho toàn bộ mandatory topics.

## BQ-CASH — Adequate realization with material qualifications

Reported consolidated four-year CFO is about 96.18% of group NPAT; this is a cash-realization diagnostic, not the normalized M3 ratio. The separately source-reviewed parent bridge explains working-capital/tax cash timing, deposit/dividend cash and fund accrual/use without guessing NCI allocation. Those specific reconciliations support adequate realization, while recurring finance-credit uncertainty, acquisition-versus-maintenance spending and subsidiary distribution reliance justify the lower end of the qualified 3–4 band rather than strong realization.

Thuận lợi: Four-year reported CFO/group NPAT is 0.961752321135; parent cash bridge is separately reviewed.

Phản biện: Parent FY25 conversion is 0.82171325409 and working-capital cash use is 1.414952025062 trillion VND.

Điểm đề xuất: 3; formal: null; confidence: MEDIUM. Upper-band qualification: Không đề xuất điểm tối đa rubric; không tuyên bố maximum prerequisites đã đạt.

Điều kiện còn mở: Human review must challenge the bounded band and its qualifications; no maximum-prerequisite claim.

Bác bỏ đánh giá khi: Changed source pins/period/scope or contradicted economic channel.

Evidence và từng mandatory topic: [scorecard](VNM_23_RUBRIC_SCORECARD.json), `/rows/2`; ledger keys ở `evidenceReferences`, exact source/page/JSON Pointer/hash ở pilot ledger và `additionalSourceBindings`. Economic channel `BQ-CASH`. Formal blockers áp dụng cho toàn bộ mandatory topics.

## BQ-RES — Material vulnerabilities

Domestic revenue is 80.08% of FY25 group revenue; foreign business diversifies the remaining 19.92%. Domestic growth is only 0.32%; input-cost pass-through is constrained. Positive earnings across FY22–25 support continuity, but no observed severe stress or customer-level concentration proof warrants balanced/strong resilience.

Thuận lợi: Domestic and export businesses, member-company activity and product/channel changes provide operating diversification context.

Phản biện: Domestic net revenue remains over 80% of group revenue in the issuer narrative; domestic demand is weak and full cost pass-through is constrained.

Điểm đề xuất: 2; formal: null; confidence: MEDIUM. Upper-band qualification: Không đề xuất điểm tối đa rubric; không tuyên bố maximum prerequisites đã đạt.

Điều kiện còn mở: Human review must challenge the bounded band and its qualifications; no maximum-prerequisite claim.

Bác bỏ đánh giá khi: Domestic demand contracts materially, export concentration rises, or product-quality disruption impairs channels.

Evidence và từng mandatory topic: [scorecard](VNM_23_RUBRIC_SCORECARD.json), `/rows/3`; ledger keys ở `evidenceReferences`, exact source/page/JSON Pointer/hash ở pilot ledger và `additionalSourceBindings`. Economic channel `BQ-RES`. Formal blockers áp dụng cho toàn bộ mandatory topics.

## FH-BS — Adequate

Equity of 34.483 trillion VND, large disclosed deposits and 9.457 trillion identified debt support adequate consumer-sector capitalization. Short debt dominates; deposits and cash are separately identified.

Thuận lợi: FY25 equity is 34483015286107 VND; disclosed deposits and debt composition support the retained Adequate judgment.

Phản biện: JV/associate loss is 150558017656 VND; deposits are not proved unrestricted funds and short debt dominates.

Điểm đề xuất: 4; formal: null; confidence: MEDIUM. Upper-band qualification: FH-BS retains pilot 4/6, upper end of Adequate; disclosed equity, deposits and reviewed debt composition support this bounded selection, with restrictions and associate losses explicitly retained. No upgrade to Strong.

Điều kiện còn mở: Human review must challenge the bounded band and its qualifications; no maximum-prerequisite claim.

Bác bỏ đánh giá khi: Deposit encumbrances or early-break terms materially reduce usable funding relative to 9456644558142 VND debt. Further JV impairment or a corrected 511184069624 VND closing investment materially changes asset quality.

Evidence và từng mandatory topic: [scorecard](VNM_23_RUBRIC_SCORECARD.json), `/rows/4`; ledger keys ở `evidenceReferences`, exact source/page/JSON Pointer/hash ở pilot ledger và `additionalSourceBindings`. Economic channel `FH-BS`. Formal blockers áp dụng cho toàn bộ mandatory topics.

## FH-LIQ — Adequate with material refinancing dependence

FY25 current ratio 1.958 and positive CFO support adequate accounting liquidity; cash alone covers only ~19% of short borrowings. Almost all borrowings are short term. Bank counterparties and unsecured loans are disclosed, long loans mature 2027/2030; restrictions and covenant headroom are unresolved. The conservative band explicitly retains refinancing dependence.

Thuận lợi: Retained schedules identify short debt 9393736731992 VND, noncurrent debt 62907826150 VND and 2027/2030 maturities.

Phản biện: Unsecured does not mean covenant-free; a bank list is not an unused committed facility. Lease and capex commitments also consume funds.

Điểm đề xuất: 2; formal: null; confidence: MEDIUM. Upper-band qualification: Không đề xuất điểm tối đa rubric; không tuyên bố maximum prerequisites đã đạt.

Điều kiện còn mở: Human review must challenge the bounded band and its qualifications; no maximum-prerequisite claim.

Bác bỏ đánh giá khi: Restricted/pledged assets or acceleration terms make obligations uncovered; cash coverage deteriorates without committed lines.

Evidence và từng mandatory topic: [scorecard](VNM_23_RUBRIC_SCORECARD.json), `/rows/5`; ledger keys ở `evidenceReferences`, exact source/page/JSON Pointer/hash ở pilot ledger và `additionalSourceBindings`. Economic channel `FH-LIQ`. Formal blockers áp dụng cho toàn bộ mandatory topics.

## FH-STRESS — PENDING

The annual report describes quarterly KRI review and an extraordinary Middle-East scenario/response in 2025. A narrative about export continuity is not a quantified earnings/cash loss and funding/capital response.

Thuận lợi: The annual report describes quarterly KRI review and an extraordinary Middle-East scenario/response in 2025.

Phản biện: A narrative about export continuity is not a quantified earnings/cash loss and funding/capital response.

Điểm đề xuất: None; formal: null; confidence: LOW. Upper-band qualification: Không đề xuất điểm tối đa rubric; không tuyên bố maximum prerequisites đã đạt.

Điều kiện còn mở: Confirm unrestricted cash/deposit realization dates and covenant/acceleration terms; join all maturities, lease payments and capital commitments to the computed operating shock. A positive shocked CFO alone cannot prove survival.

Bác bỏ đánh giá khi: Contradictory source/scope/revision or facts changing the specified economic channel require reassessment.

Evidence và từng mandatory topic: [scorecard](VNM_23_RUBRIC_SCORECARD.json), `/rows/6`; ledger keys ở `evidenceReferences`, exact source/page/JSON Pointer/hash ở pilot ledger và `additionalSourceBindings`. Economic channel `FH-STRESS`. Formal blockers áp dụng cho toàn bộ mandatory topics.

## GQ-HIST — Limited/low-quality trend

Revenue FY22–25 CAGR is 2.01%; parent-attributable NPAT CAGR is 3.38%, but FY24–25 common earnings after funds rose only 0.14% with unchanged weighted shares. Growth is limited rather than strongly compounding. No claim of a fully adjusted four-year EPS series.

Thuận lợi: Source-bound FY22–25 consolidated revenue grows from 59956247197418 to 63645886756227 VND; three-year revenue CAGR can now calculate.

Phản biện: Group revenue growth is not comparable adjusted EPS or sustainable common-owner per-share growth.

Điểm đề xuất: 2; formal: null; confidence: MEDIUM. Upper-band qualification: Không đề xuất điểm tối đa rubric; không tuyên bố maximum prerequisites đã đạt.

Điều kiện còn mở: Human review must challenge the bounded band and its qualifications; no maximum-prerequisite claim.

Bác bỏ đánh giá khi: Scope/acquisition reconciliation changes the reported trend materially, or fund/action adjustments reverse the per-share conclusion.

Evidence và từng mandatory topic: [scorecard](VNM_23_RUBRIC_SCORECARD.json), `/rows/7`; ledger keys ở `evidenceReferences`, exact source/page/JSON Pointer/hash ở pilot ledger và `additionalSourceBindings`. Economic channel `GQ-HIST`. Formal blockers áp dụng cho toàn bộ mandatory topics.

## GQ-FWD — Limited/cyclical

Domestic stagnation and foreign growth 15.46% give a limited runway. Named condensed-milk line and Vietnam dairy plant expansion are underway (annual p30); beef operations and premium nutrition add options. Parent FY25 CFO and disclosed commitments show funding demands, not project IRRs. Propose limited visibility; no consensus-based high-growth band.

Thuận lợi: Specialized nutrition, exports and channel digitization are named operating initiatives; disclosed capital commitments supply funding context.

Phản biện: Low per-capita consumption is an opportunity claim, not secured demand or an issuer earnings forecast.

Điểm đề xuất: 2; formal: null; confidence: LOW. Upper-band qualification: Không đề xuất điểm tối đa rubric; không tuyên bố maximum prerequisites đã đạt.

Điều kiện còn mở: Human review must challenge the bounded band and its qualifications; no maximum-prerequisite claim.

Bác bỏ đánh giá khi: New capacity fails utilization/margin milestones, foreign growth reverses, or retained funding fails to cover commitments.

Evidence và từng mandatory topic: [scorecard](VNM_23_RUBRIC_SCORECARD.json), `/rows/8`; ledger keys ở `evidenceReferences`, exact source/page/JSON Pointer/hash ở pilot ledger và `additionalSourceBindings`. Economic channel `GQ-FWD`. Formal blockers áp dụng cho toàn bộ mandatory topics.

## GQ-INC — PENDING

Retained accounts identify investment deployment, capital commitments and actual JV/associate losses. A change in group profit divided by change in assets is not incremental ROIC and ignores project commissioning and owner scope.

Thuận lợi: Retained accounts identify investment deployment, capital commitments and actual JV/associate losses.

Phản biện: A change in group profit divided by change in assets is not incremental ROIC and ignores project commissioning and owner scope.

Điểm đề xuất: None; formal: null; confidence: LOW. Upper-band qualification: Không đề xuất điểm tối đa rubric; không tuyên bố maximum prerequisites đã đạt.

Điều kiện còn mở: Attribute recurring after-tax operating earnings and economic capital to the same investment cohorts; resolve shrinking cash-adjusted denominator and lease policy. Two stock balance sheets cannot establish incremental project returns.

Bác bỏ đánh giá khi: Contradictory source/scope/revision or facts changing the specified economic channel require reassessment.

Evidence và từng mandatory topic: [scorecard](VNM_23_RUBRIC_SCORECARD.json), `/rows/9`; ledger keys ở `evidenceReferences`, exact source/page/JSON Pointer/hash ở pilot ledger và `additionalSourceBindings`. Economic channel `GQ-INC`. Formal blockers áp dụng cho toàn bộ mandatory topics.

## IC-IND — Mixed/cyclical/average

Mixed/cyclical/average dairy industry conditions: essential nutrition and specialized products support demand, while the issuer reports weak FY2025 consumption, fierce local/international rivalry, constrained cost pass-through and rising compliance/innovation costs. Scale, distribution and trust matter but do not prove closed entry or rational competition. This is a bounded sector assessment, not Vinamilk market leadership or a moat rating.

Thuận lợi: Nutrition demand, cold-chain/logistics, food-safety requirements and specialization support durable sector relevance.

Phản biện: Issuer-attributed FY25 dairy decline and fierce rivalry prevent an attractive/rational-industry assertion.

Điểm đề xuất: 2; formal: null; confidence: MEDIUM. Upper-band qualification: Không đề xuất điểm tối đa rubric; không tuyên bố maximum prerequisites đã đạt.

Điều kiện còn mở: Human review must challenge the bounded band and its qualifications; no maximum-prerequisite claim.

Bác bỏ đánh giá khi: Comparable industry data showing materially different demand/rivalry or persistent industry returns would change the band.

Evidence và từng mandatory topic: [scorecard](VNM_23_RUBRIC_SCORECARD.json), `/rows/10`; ledger keys ở `evidenceReferences`, exact source/page/JSON Pointer/hash ở pilot ledger và `additionalSourceBindings`. Economic channel `IC-IND`. Formal blockers áp dụng cho toàn bộ mandatory topics.

## IC-POS — PENDING

Domestic/export distribution development and member-company results identify concrete routes to customers. Industry commentary about large domestic companies is not Vinamilk share leadership; standalone costs are not competitor cost rankings.

Thuận lợi: Domestic/export distribution development and member-company results identify concrete routes to customers.

Phản biện: Industry commentary about large domestic companies is not Vinamilk share leadership; standalone costs are not competitor cost rankings.

Điểm đề xuất: None; formal: null; confidence: LOW. Upper-band qualification: Không đề xuất điểm tối đa rubric; không tuyên bố maximum prerequisites đã đạt.

Điều kiện còn mở: Supply comparable dated VNM/competitor market-share definitions or independently corroborated cost/distribution position. Group revenue outgrowth versus a domestic industry statistic is not a share bridge.

Bác bỏ đánh giá khi: Contradictory source/scope/revision or facts changing the specified economic channel require reassessment.

Evidence và từng mandatory topic: [scorecard](VNM_23_RUBRIC_SCORECARD.json), `/rows/11`; ledger keys ở `evidenceReferences`, exact source/page/JSON Pointer/hash ở pilot ledger và `additionalSourceBindings`. Economic channel `IC-POS`. Formal blockers áp dụng cho toàn bộ mandatory topics.

## IC-CYCLE — Balanced normalized forward asymmetry

Issuer cites dairy market -2.4% FY25 and constrained cost pass-through; exports provide an offset. Historical group margins 14.3–15.3% do not justify a peak or trough extrapolation. Balanced describes the supported operating range; no valuation discount is counted here.

Thuận lợi: Weak FY25 demand, cost pressure and constrained pass-through identify the operating cycle context.

Phản biện: Positive historical CFO and a scenario-governance process do not establish favorable normalized forward asymmetry.

Điểm đề xuất: 1; formal: null; confidence: MEDIUM. Upper-band qualification: Không đề xuất điểm tối đa rubric; không tuyên bố maximum prerequisites đã đạt.

Điều kiện còn mở: Human review must challenge the bounded band and its qualifications; no maximum-prerequisite claim.

Bác bỏ đánh giá khi: Demand or input costs move outside the modeled shock envelope, or post-FY25 results invalidate stabilization.

Evidence và từng mandatory topic: [scorecard](VNM_23_RUBRIC_SCORECARD.json), `/rows/12`; ledger keys ở `evidenceReferences`, exact source/page/JSON Pointer/hash ở pilot ledger và `additionalSourceBindings`. Economic channel `IC-CYCLE`. Formal blockers áp dụng cho toàn bộ mandatory topics.

## VAL-PRIMARY — PENDING

Reported earnings, parent bridge and source-bound balance-sheet observations are available for model preparation. Deposit returns, fund treatment, reinvestment and common-owner scope materially affect sustainable earnings.

Thuận lợi: Reported earnings, parent bridge and source-bound balance-sheet observations are available for model preparation.

Phản biện: Deposit returns, fund treatment, reinvestment and common-owner scope materially affect sustainable earnings.

Điểm đề xuất: None; formal: null; confidence: LOW. Upper-band qualification: Không đề xuất điểm tối đa rubric; không tuyên bố maximum prerequisites đã đạt.

Điều kiện còn mở: Adopt normalized parent common cash and assumptions; qualify share/action/treasury/rights bridge and TCBS price adjustment at explicit market cutoff; reconcile independent crosscheck and post-FY25 changes.

Bác bỏ đánh giá khi: Contradictory source/scope/revision or facts changing the specified economic channel require reassessment.

Evidence và từng mandatory topic: [scorecard](VNM_23_RUBRIC_SCORECARD.json), `/rows/13`; ledger keys ở `evidenceReferences`, exact source/page/JSON Pointer/hash ở pilot ledger và `additionalSourceBindings`. Economic channel `VAL-PRIMARY`. Formal blockers áp dụng cho toàn bộ mandatory topics.

## VAL-RET — PENDING

Retained reports contain dividends, reported earnings and share disclosures as scenario ingredients. Historical distributions are not sustainable DPS; no current quote or exit multiple is inferred.

Thuận lợi: Retained reports contain dividends, reported earnings and share disclosures as scenario ingredients.

Phản biện: Historical distributions are not sustainable DPS; no current quote or exit multiple is inferred.

Điểm đề xuất: None; formal: null; confidence: LOW. Upper-band qualification: Không đề xuất điểm tối đa rubric; không tuyên bố maximum prerequisites đã đạt.

Điều kiện còn mở: Resolve VAL-PRIMARY dependencies, then adopt five-year distribution, dilution and exit cases/probabilities. Conditional IRRs below are not accepted expected return.

Bác bỏ đánh giá khi: Contradictory source/scope/revision or facts changing the specified economic channel require reassessment.

Evidence và từng mandatory topic: [scorecard](VNM_23_RUBRIC_SCORECARD.json), `/rows/14`; ledger keys ở `evidenceReferences`, exact source/page/JSON Pointer/hash ở pilot ledger và `additionalSourceBindings`. Economic channel `VAL-RET`. Formal blockers áp dụng cho toàn bộ mandatory topics.

## VAL-MOS — PENDING

Capital and liquidity disclosures can inform a conservative impairment case. Book value, cash balances or a share-price decline do not supply a conservative intrinsic value.

Thuận lợi: Capital and liquidity disclosures can inform a conservative impairment case.

Phản biện: Book value, cash balances or a share-price decline do not supply a conservative intrinsic value.

Điểm đề xuất: None; formal: null; confidence: LOW. Upper-band qualification: Không đề xuất điểm tối đa rubric; không tuyên bố maximum prerequisites đã đạt.

Điều kiện còn mở: Resolve VAL-PRIMARY plus unrestricted liquidity/downside obligations. Conservative case/price discount remains conditional; do not equate low P/E with downside protection.

Bác bỏ đánh giá khi: Contradictory source/scope/revision or facts changing the specified economic channel require reassessment.

Evidence và từng mandatory topic: [scorecard](VNM_23_RUBRIC_SCORECARD.json), `/rows/15`; ledger keys ở `evidenceReferences`, exact source/page/JSON Pointer/hash ở pilot ledger và `additionalSourceBindings`. Economic channel `VAL-MOS`. Formal blockers áp dụng cho toàn bộ mandatory topics.

## RG-GOV — Mixed concerns

Actual dividend procedures and payment outcomes, the named 20 January 2025 conflict-recusal example, and the unmodified financial audit support a mixed governance assessment. Auditor selection/disclosure and fee information are explicitly reported.

Thuận lợi: Retained audit opinion, specific recusal, voting/minority procedures and disclosure practices support the challenged Mixed concerns assessment.

Phản biện: Issuer claims do not prove arm’s-length fair values; independent-director reports describe oversight/data and succession improvements still needed.

Điểm đề xuất: 2; formal: null; confidence: MEDIUM. Upper-band qualification: Không đề xuất điểm tối đa rubric; không tuyên bố maximum prerequisites đã đạt.

Điều kiện còn mở: Human review must challenge the bounded band and its qualifications; no maximum-prerequisite claim.

Bác bỏ đánh giá khi: Verified related-party terms/minority outcomes contradict the disclosed recusal process or actual2025 dividend outcomes. An auditor finding, material disclosure correction or evidence about audit/non-audit independence contradicts the bounded mixed-governance conclusion.

Evidence và từng mandatory topic: [scorecard](VNM_23_RUBRIC_SCORECARD.json), `/rows/16`; ledger keys ở `evidenceReferences`, exact source/page/JSON Pointer/hash ở pilot ledger và `additionalSourceBindings`. Economic channel `RG-GOV`. Formal blockers áp dụng cho toàn bộ mandatory topics.

## RG-RISK — ELEVATED_WEAK

ELEVATED_WEAK residual execution risk: the company identifies high cyber risk, rising technology/compliance pressures and an audit-committee need to move from reactive oversight toward earlier warning and better data/IT/manual controls. Specific security, recovery, change-management and monitoring responses exist, but the disclosed gaps limit confidence in mitigation maturity. Competitive industry structure is assessed in IC-IND and is not counted again as a separate residual penalty.

Thuận lợi: Cyber/data/change and compliance channels have issuer-described controls, training and oversight responses.

Phản biện: Reported control procedures are not tested effectiveness; rising technology/compliance exposure and specific data gaps remain.

Điểm đề xuất: 1; formal: null; confidence: MEDIUM. Upper-band qualification: Không đề xuất điểm tối đa rubric; không tuyên bố maximum prerequisites đã đạt.

Điều kiện còn mở: Human review must challenge the bounded band and its qualifications; no maximum-prerequisite claim.

Bác bỏ đánh giá khi: Demonstrated tested recovery/control outcomes and closure of specific oversight/data gaps could improve mitigation assessment. A material incident or compliance failure could worsen the band.

Evidence và từng mandatory topic: [scorecard](VNM_23_RUBRIC_SCORECARD.json), `/rows/17`; ledger keys ở `evidenceReferences`, exact source/page/JSON Pointer/hash ở pilot ledger và `additionalSourceBindings`. Economic channel `RG-RISK`. Formal blockers áp dụng cho toàn bộ mandatory topics.

## RG-UNC — Material manageable uncertainty

The reported group profit series and cash realization provide an economic anchor; the separately reviewed parent cash bridge and named finance/disposal alternatives expose specific, reviewable uncertainty rather than an unconstrained invented growth story. Parent deposit/dividend receipts, working-capital use and reinvestment assumptions still change distributable common value. These facts support material manageable uncertainty for this bounded FY2025 research thesis, not a narrow intrinsic-value range.

Thuận lợi: Group earnings continuity and the reviewed parent cash/finance alternatives identify explicit WC/tax/distribution sensitivities.

Phản biện: Parent cash realization is weaker; the retained judgment does not establish a narrow intrinsic-value forecast interval.

Điểm đề xuất: 1; formal: null; confidence: MEDIUM. Upper-band qualification: Không đề xuất điểm tối đa rubric; không tuyên bố maximum prerequisites đã đạt.

Điều kiện còn mở: Human review must challenge the bounded band and its qualifications; no maximum-prerequisite claim.

Bác bỏ đánh giá khi: Material change in parent distribution receipts, WC/credit quality or finance-credit recurrence. A source revision or economic event invalidates the stated earnings/cash anchor.

Evidence và từng mandatory topic: [scorecard](VNM_23_RUBRIC_SCORECARD.json), `/rows/18`; ledger keys ở `evidenceReferences`, exact source/page/JSON Pointer/hash ở pilot ledger và `additionalSourceBindings`. Economic channel `RG-UNC`. Formal blockers áp dụng cho toàn bộ mandatory topics.

## CA-REINV — Mixed/acceptable

Named plant investments and continuing core cash earnings coexist with 150.558bn JV/associate loss and completed Del Monte Philippines exit. FY25 parent cash capex 1.030tn and subsidiary investment 0.421tn demonstrate deployment; cohort outcomes are mixed, not proven consistently accretive. This judgment evaluates decisions/outcomes, not an invented incremental ROIC.

Thuận lợi: JV additions, dividends and actual loss, plus capex commitments, identify distinct capital-allocation facts.

Phản biện: One loss cohort cannot represent all management allocation outcomes; accounting disposal policy is not a divestment result.

Điểm đề xuất: 1; formal: null; confidence: MEDIUM. Upper-band qualification: Không đề xuất điểm tối đa rubric; không tuyên bố maximum prerequisites đã đạt.

Điều kiện còn mở: Human review must challenge the bounded band and its qualifications; no maximum-prerequisite claim.

Bác bỏ đánh giá khi: Project cohort evidence demonstrates repeated destruction or, conversely, durable above-cost returns that require re-rating.

Evidence và từng mandatory topic: [scorecard](VNM_23_RUBRIC_SCORECARD.json), `/rows/19`; ledger keys ở `evidenceReferences`, exact source/page/JSON Pointer/hash ở pilot ledger và `additionalSourceBindings`. Economic channel `CA-REINV`. Formal blockers áp dụng cho toàn bộ mandatory topics.

## CA-DIST — PENDING

Retained equal-treatment disclosure records actual 2025 cash distributions; fund treatment and parent cash are separately documented. Dividend payment alone does not demonstrate optimal retention, resilience or buyback discipline.

Thuận lợi: Retained equal-treatment disclosure records actual 2025 cash distributions; fund treatment and parent cash are separately documented.

Phản biện: Dividend payment alone does not demonstrate optimal retention, resilience or buyback discipline.

Điểm đề xuất: None; formal: null; confidence: LOW. Upper-band qualification: Không đề xuất điểm tối đa rubric; không tuyên bố maximum prerequisites đã đạt.

Điều kiện còn mở: Reconcile FY25 parent dividends 10.136tn against common earnings 8.423tn, prior-year distributions/reserves, tax timing and remaining committed high-return uses. Actual distributions do not themselves prove discipline.

Bác bỏ đánh giá khi: Contradictory source/scope/revision or facts changing the specified economic channel require reassessment.

Evidence và từng mandatory topic: [scorecard](VNM_23_RUBRIC_SCORECARD.json), `/rows/20`; ledger keys ở `evidenceReferences`, exact source/page/JSON Pointer/hash ở pilot ledger và `additionalSourceBindings`. Economic channel `CA-DIST`. Formal blockers áp dụng cho toàn bộ mandatory topics.

## CA-DIL — PENDING

Retained notes distinguish weighted-average common shares, common earnings after funds and current issuance context. A 2021 subsidiary share acquisition is not a FY25 parent action; unchanged weighted shares do not prove a full action register.

Thuận lợi: Retained notes distinguish weighted-average common shares, common earnings after funds and current issuance context.

Phản biện: A 2021 subsidiary share acquisition is not a FY25 parent action; unchanged weighted shares do not prove a full action register.

Điểm đề xuất: None; formal: null; confidence: LOW. Upper-band qualification: Không đề xuất điểm tối đa rubric; không tuyên bố maximum prerequisites đã đạt.

Điều kiện còn mở: Complete FY22–25 parent issuance/treasury/rights/convertible terms and use-of-proceeds reconciliation; FY24–25 unchanged shares and no potential dilution at FY25 are evidence, not the full action history.

Bác bỏ đánh giá khi: Contradictory source/scope/revision or facts changing the specified economic channel require reassessment.

Evidence và từng mandatory topic: [scorecard](VNM_23_RUBRIC_SCORECARD.json), `/rows/21`; ledger keys ở `evidenceReferences`, exact source/page/JSON Pointer/hash ở pilot ledger và `additionalSourceBindings`. Economic channel `CA-DIL`. Formal blockers áp dụng cho toàn bộ mandatory topics.

## CA-PSV — PENDING

Reported parent-attributable profit and share/EPS notes offer raw per-share context. Mechanical stock dividends, fund reversals and reported EPS are not real common-owner value creation.

Thuận lợi: Reported parent-attributable profit and share/EPS notes offer raw per-share context.

Phản biện: Mechanical stock dividends, fund reversals and reported EPS are not real common-owner value creation.

Điểm đề xuất: None; formal: null; confidence: LOW. Upper-band qualification: Không đề xuất điểm tối đa rubric; không tuyên bố maximum prerequisites đã đạt.

Điều kiện còn mở: Build FY22–25 fund-adjusted/action-adjusted common-owner earnings, distributions and economic capital per share; test real cycle-adjusted intrinsic compounding. FY24–25 EPS growth of 0.14% alone is insufficient.

Bác bỏ đánh giá khi: Contradictory source/scope/revision or facts changing the specified economic channel require reassessment.

Evidence và từng mandatory topic: [scorecard](VNM_23_RUBRIC_SCORECARD.json), `/rows/22`; ledger keys ở `evidenceReferences`, exact source/page/JSON Pointer/hash ở pilot ledger và `additionalSourceBindings`. Economic channel `CA-PSV`. Formal blockers áp dụng cho toàn bộ mandatory topics.

## Kết quả tài chính và giới hạn

- revenueCagr22to25: 0.020105995524733513488081815079119703842; công thức `(revenue25/revenue22)^(1/3)-1`.
- parentNpatCagr22to25: 0.033841646316583230484997491041556237805; công thức `(parentNPAT25/parentNPAT22)^(1/3)-1`.
- domesticWeight25: 0.8007480314665855764521588917202478380311; công thức `domesticRevenue25/groupRevenue25`.
- domesticGrowth25: 0.003247228874390458045097011405136016784; công thức `domesticRevenue25/domesticRevenue24-1`.
- foreignGrowth25: 0.154628216666023573706381184587921246811; công thức `foreignRevenue25/foreignRevenue24-1`.
- grossMargin25: 0.4118015402144854523389038819273838702112; công thức `grossProfit25/revenue25`.
- grossMargin24: 0.4141970777608893991939835600489995106860; công thức `grossProfit24/revenue24`.
- commonEarningsGrowth25: 0.001374177007858359082272550896463021474; công thức `commonAfterFunds25/commonAfterFunds24-1`.
- cashToShortBorrowings25: 0.1910719631686318985616371705645213197534; công thức `reportedCash/shortBorrowings`.
- shortDebtWeight25: 0.9933477645518740049311298109275706127104; công thức `shortBorrowings/totalReportedBorrowings`.
- groupCapitalBeforeCash2024: 45447741839363; công thức `group equity + reported borrowings`.
- groupCapitalLessAllDepositsDiagnostic2024: 19282037075994; công thức `equity + borrowings - cash - short/long deposits; ALL-deposit subtraction is a diagnostic, not availability acceptance`.
- groupCapitalBeforeCash2025: 43939659844249; công thức `group equity + reported borrowings`.
- groupCapitalLessAllDepositsDiagnostic2025: 20415062203242; công thức `equity + borrowings - cash - short/long deposits; ALL-deposit subtraction is a diagnostic, not availability acceptance`.
- shockCfo: 2960894718061.57100000000000000000000000; công thức `CFO25 - (GP25 - revenue25*0.90*(grossMargin25-0.03)) - inventory25*0.20; assumes unchanged other cash items, no tax shield`.

Capital diagnostics bao gồm NCI và reported debt; không phải vốn đầu tư kinh tế chung đã chuẩn hóa. Vốn equity+reported debt giảm, trong khi diagnostic sau khi trừ cash/deposits tăng từ 19.282tn lên 20.415tn: kết luận phụ thuộc denominator. Không chia delta profit cho delta capital để tạo incremental ROIC giả. Cần phân biệt vốn vận hành với tài sản sinh lãi và matching earnings.

Shock dùng doanh thu -10%, gross margin -3 điểm %, inventory cash lock +20%: đây là giả định nghiên cứu về demand/cost, không phải dự báo hoặc observed stress. Không dùng dòng tiền dương để suy ra FH-STRESS points khi maturity/covenant chưa nối.

Double-count: BQ-EQ đánh giá mức sinh lời; BQ-CASH khả năng hiện thực tiền; GQ-HIST xu hướng; GQ-INC suất sinh lời vốn mới; CA-REINV quyết định cụ thể. BQ-MOAT là cơ chế khác biệt, IC-POS cần tương quan peer độc lập. RG-RISK chỉ residual channels của pilot, không trừ lặp demand/inventory; cần M1 determination để formal. VAL-PRIMARY intrinsic/price, VAL-RET cash-and-exit IRR, VAL-MOS conservative protection; cùng giả định tăng trưởng không được tự nhận ba lần.
