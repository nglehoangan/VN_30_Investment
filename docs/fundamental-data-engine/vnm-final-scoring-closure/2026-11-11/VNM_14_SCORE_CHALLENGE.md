# VNM — Challenge 14 Proposed Scores

Baseline `40a3401e6195f350b34b1d120c3345ebd520ff64`; 11/11/2026. Review thứ hai bằng ba vai trò AI CIO / Equity Research / Risk Manager; không phải ba người độc lập, HUMAN adoption hay organizational approval. Chỉ VNM, nguồn retained JSON trước; không tải lại FY22–25.

**14/14 điểm cũ nằm đúng band số học M3; đúng band không chứng minh đủ evidence.** Sau challenge: 6 ACCEPT, 2 REVISE, 6 REJECT numerical selection; 8 còn research-proposed points, 0 formal. Không cộng partial total. REJECT đưa điểm về null/PENDING, không tự hạ xuống 0. Riêng RG-UNC=0 có bằng chứng uncertainty cao, không phải missing-as-zero.

| Rubric | Trước | Verdict | Sau challenge | Confidence |
|---|---:|---|---|---|
| BQ-EQ | 5 | REJECT | null / PENDING —  | LOW |
| BQ-MOAT | 3 | ACCEPT | 3 — Some differentiation | MEDIUM |
| BQ-CASH | 3 | ACCEPT | 3 — Adequate realization with material qualifications | MEDIUM |
| BQ-RES | 2 | ACCEPT | 2 — Material vulnerabilities | MEDIUM |
| FH-BS | 4 | REVISE | 3 — Adequate | MEDIUM |
| FH-LIQ | 2 | REJECT | null / PENDING —  | LOW |
| GQ-HIST | 2 | REJECT | null / PENDING —  | LOW |
| GQ-FWD | 2 | REJECT | null / PENDING —  | LOW |
| IC-IND | 2 | ACCEPT | 2 — Mixed/cyclical/average | MEDIUM |
| IC-CYCLE | 1 | REJECT | null / PENDING —  | LOW |
| RG-GOV | 2 | ACCEPT | 2 — Mixed concerns | MEDIUM |
| RG-RISK | 1 | ACCEPT | 1 — ELEVATED_WEAK | MEDIUM |
| RG-UNC | 1 | REVISE | 0 — High uncertainty | MEDIUM |
| CA-REINV | 1 | REJECT | null / PENDING —  | LOW |

## BQ-EQ — REJECT

**CIO:** Do not award Good economics by comparing group ROE with a freely chosen discount rate.

**EquityResearch:** 26.5% group ROE includes NCI/deposit/subsidiary economics; common funds are deducted in a different numerator.

**RiskManager:** Leverage/capital composition, cycle and matching finance returns can alter the economic spread.

Mandatory topics:

- **returns**: PARTIAL: reported group returns and common numerator known, not normalized operating/common-return bridge
- **persistence**: SUPPORTED_BOUNDED: positive FY22–25 margins/ROE
- **margins**: SUPPORTED_BOUNDED: reported margin series; finance/non-operating attribution unresolved
- **cost_of_capital**: UNSUPPORTED: proposed 12–18% equity discount grid is not a sourced capital-cost benchmark

Phản biện giữ lại: Group profit includes deposit/subsidiary economics; average group equity is not normalized common invested capital.

Conclusion: None / band None; confidence LOW. One matched recurring operating/common-return and average economic-capital bridge with a defensible VNM cost-of-capital benchmark; retain reported margins as diagnostics.

Nếu cần đóng research gap: One matched recurring operating/common-return and average economic-capital bridge with a defensible VNM cost-of-capital benchmark; retain reported margins as diagnostics.

Bác bỏ khi: Recurring operating returns fall below required return, or deposit/one-off adjustments eliminate the spread.

Nguồn đã đối chiếu:

- `docs/fundamental-data-engine/vnm-complete-scorecard/2026-11-11/VNM_23_RUBRIC_SCORECARD.json#/rows/0`
- `data/manual-extracted-pdf/notes/VNM.json#/documents/6/pages/6`
- `data/manual-extracted-pdf/notes/VNM.json#/documents/6/pages/7`
- `data/manual-extracted-pdf/notes/VNM.json#/documents/6/pages/8`
- `data/manual-extracted-pdf/notes/VNM.json#/documents/6/pages/9`
- `data/manual-extracted-pdf/notes/VNM.json#/documents/6/pages/59`

## BQ-MOAT — ACCEPT

**CIO:** Some differentiation is defensible; no durable/strong moat claim.

**EquityResearch:** Annual pp26–29 and cost disclosures identify mechanisms; no quantified price premium/retention or peer cost advantage.

**RiskManager:** Do not count the same company scale as IC-POS leadership; reassess if margins erode despite spending.

Mandatory topics:

- **advantage**: SUPPORTED_BOUNDED: farms, scale, product development and distribution are identifiable differentiation mechanisms
- **economic_behavior**: SUPPORTED_BOUNDED: persistent positive margins, but promotional spending/pass-through counterevidence limits inference
- **persistence**: SUPPORTED_BOUNDED: four-year earnings/margins corroborate continued franchise operation, not separately measured causal moat

Phản biện giữ lại: The same report describes fierce domestic/international rivalry and constrained pass-through; brand scale alone does not prove pricing power.

Conclusion: 3 / band Some differentiation; confidence MEDIUM. Bounded issuer/financial evidence; no formal eligibility or independent source assurance implied. Exact limitations are retained in topic review.

Nếu cần đóng research gap: Không có research evidence product quyết định-critical thêm cho band bảo thủ này; source/time admission và analyst adoption vẫn tách riêng.

Bác bỏ khi: Comparable pricing or cost data show no differentiation; sustained gross-margin loss despite spending.

Nguồn đã đối chiếu:

- `docs/fundamental-data-engine/vnm-complete-scorecard/2026-11-11/VNM_23_RUBRIC_SCORECARD.json#/rows/1`
- `data/manual-extracted-pdf/notes/VNM.json#/documents/7/pages/25`
- `data/manual-extracted-pdf/notes/VNM.json#/documents/7/pages/26`
- `data/manual-extracted-pdf/notes/VNM.json#/documents/7/pages/27`
- `data/manual-extracted-pdf/notes/VNM.json#/documents/7/pages/28`
- `data/manual-extracted-pdf/notes/VNM.json#/documents/6/pages/55`
- `data/manual-extracted-pdf/notes/VNM.json#/documents/6/pages/56`

## BQ-CASH — ACCEPT

**CIO:** Lower end of Adequate reflects actual cash production with material qualifications.

**EquityResearch:** Do not substitute group CFO/common earnings ratio; parent CFO/NPAT 0.8217 and fund/tax timing retained.

**RiskManager:** No Strong points while recurring finance credit, maintenance split and subsidiary receipts remain conditional.

Mandatory topics:

- **realization**: SUPPORTED_BOUNDED: four-year group CFO/NPAT 0.96175 and separate parent cash review
- **one_offs**: SUPPORTED_BOUNDED: disposal/finance alternatives explicit, exhaustive recurrence unproven
- **working_capital**: SUPPORTED: parent signed WC and inventory cash use reconciled
- **recognition**: SUPPORTED_BOUNDED: audited recognition context and disclosed cash timing; not assurance of all revenue realization

Phản biện giữ lại: Parent FY25 conversion is 0.82171325409 and working-capital cash use is 1.414952025062 trillion VND.

Conclusion: 3 / band Adequate realization with material qualifications; confidence MEDIUM. Bounded issuer/financial evidence; no formal eligibility or independent source assurance implied. Exact limitations are retained in topic review.

Nếu cần đóng research gap: Không có research evidence product quyết định-critical thêm cho band bảo thủ này; source/time admission và analyst adoption vẫn tách riêng.

Bác bỏ khi: Changed source pins/period/scope or contradicted economic channel.

Nguồn đã đối chiếu:

- `docs/fundamental-data-engine/vnm-complete-scorecard/2026-11-11/VNM_23_RUBRIC_SCORECARD.json#/rows/2`
- `data/manual-extracted-pdf/notes/VNM.json#/documents/1/pages/10`
- `data/manual-extracted-pdf/notes/VNM.json#/documents/1/pages/11`
- `data/manual-extracted-pdf/notes/VNM.json#/documents/1/pages/40`
- `data/manual-extracted-pdf/notes/VNM.json#/documents/1/pages/46`
- `data/manual-extracted-pdf/notes/VNM.json#/documents/1/pages/48`
- `data/manual-extracted-pdf/notes/VNM.json#/documents/1/pages/49`

## BQ-RES — ACCEPT

**CIO:** Material vulnerabilities follows demonstrated domestic exposure rather than rewarding diversification automatically.

**EquityResearch:** Geographic revenue is concrete; not product/customer concentration or volume/price decomposition.

**RiskManager:** Two points does not assert financial survival; FH-STRESS remains separate. Review on demand/input shock or recall.

Mandatory topics:

- **concentration**: SUPPORTED_BOUNDED: domestic 80.08%, foreign 19.92%; customer detail unresolved
- **pricing_power**: SUPPORTED_ADVERSE: constrained pass-through and heavy competition
- **cyclicality**: SUPPORTED_BOUNDED: domestic weak demand, foreign offset and positive multi-year earnings
- **stress**: SUPPORTED_ADVERSE_BOUND: identified demand/cost vulnerability; severe survival not claimed

Phản biện giữ lại: Domestic net revenue remains over 80% of group revenue in the issuer narrative; domestic demand is weak and full cost pass-through is constrained.

Conclusion: 2 / band Material vulnerabilities; confidence MEDIUM. Bounded issuer/financial evidence; no formal eligibility or independent source assurance implied. Exact limitations are retained in topic review.

Nếu cần đóng research gap: Không có research evidence product quyết định-critical thêm cho band bảo thủ này; source/time admission và analyst adoption vẫn tách riêng.

Bác bỏ khi: Domestic demand contracts materially, export concentration rises, or product-quality disruption impairs channels.

Nguồn đã đối chiếu:

- `docs/fundamental-data-engine/vnm-complete-scorecard/2026-11-11/VNM_23_RUBRIC_SCORECARD.json#/rows/3`
- `data/manual-extracted-pdf/notes/VNM.json#/documents/6/pages/62`
- `data/manual-extracted-pdf/notes/VNM.json#/documents/7/pages/25`
- `data/manual-extracted-pdf/notes/VNM.json#/documents/7/pages/26`
- `data/manual-extracted-pdf/notes/VNM.json#/documents/7/pages/28`

## FH-BS — REVISE

**CIO:** Retain Adequate at lower point 3; no strongerEvidence basis for 4.

**EquityResearch:** Large deposits and reported equity support a bounded adequate capitalization view, but book deposits are not free cash.

**RiskManager:** JV losses, financial character of other payables and unqualified restrictions weaken upper-band support.

Mandatory topics:

- **capital**: SUPPORTED: group equity 34.483tn against assets 53.312tn
- **asset_quality**: SUPPORTED_BOUNDED: deposits/JV investments/impairments disclosed; unrestricted realization unknown
- **funding**: PARTIAL: borrowings identified, predominantly short; complete financing population not proven
- **leverage_context**: SUPPORTED_BOUNDED: industrial/dairy context, not bank leverage shortcut

Phản biện giữ lại: JV/associate loss is 150558017656 VND; deposits are not proved unrestricted funds and short debt dominates.

Conclusion: 3 / band Adequate; confidence MEDIUM. Bounded issuer/financial evidence; no formal eligibility or independent source assurance implied. Exact limitations are retained in topic review.

Nếu cần đóng research gap: Không có research evidence product quyết định-critical thêm cho band bảo thủ này; source/time admission và analyst adoption vẫn tách riêng.

Bác bỏ khi: Deposit encumbrances or early-break terms materially reduce usable funding relative to 9456644558142 VND debt. Further JV impairment or a corrected 511184069624 VND closing investment materially changes asset quality.

Nguồn đã đối chiếu:

- `docs/fundamental-data-engine/vnm-complete-scorecard/2026-11-11/VNM_23_RUBRIC_SCORECARD.json#/rows/4`
- `data/manual-extracted-pdf/notes/VNM.json#/documents/6/pages/6`
- `data/manual-extracted-pdf/notes/VNM.json#/documents/6/pages/7`
- `data/manual-extracted-pdf/notes/VNM.json#/documents/6/pages/8`
- `data/manual-extracted-pdf/notes/VNM.json#/documents/6/pages/35`
- `data/manual-extracted-pdf/notes/VNM.json#/documents/6/pages/37`
- `data/manual-extracted-pdf/notes/VNM.json#/documents/6/pages/46`
- `data/manual-extracted-pdf/notes/VNM.json#/documents/6/pages/47`
- `data/manual-extracted-pdf/notes/VNM.json#/documents/6/pages/49`

## FH-LIQ — REJECT

**CIO:** Adequate requires obligation coverage; current ratio cannot establish it.

**EquityResearch:** Cash/short borrowings 0.191; short debt 99.33% of reported debt. Deposits can cover only if available at required dates.

**RiskManager:** Do not downgrade to 1 from missing proof, or accept 2 as neutral. Committed lines and acceleration terms remain unknown.

Mandatory topics:

- **obligations**: PARTIAL: short/long borrowings, lease/capex commitments known
- **liquidity**: UNRESOLVED: maturity/restriction availability for deposits unknown
- **maturities**: PARTIAL: long 2027/2030; short bucket without exact ladder
- **covenants**: UNRESOLVED: unsecured does not mean covenant-free

Phản biện giữ lại: Unsecured does not mean covenant-free; a bank list is not an unused committed facility. Lease and capex commitments also consume funds.

Conclusion: None / band None; confidence LOW. One dated cash/deposit availability versus all maturity/commitment/covenant ladder; show committed funding headroom and restrictions explicitly.

Nếu cần đóng research gap: One dated cash/deposit availability versus all maturity/commitment/covenant ladder; show committed funding headroom and restrictions explicitly.

Bác bỏ khi: Restricted/pledged assets or acceleration terms make obligations uncovered; cash coverage deteriorates without committed lines.

Nguồn đã đối chiếu:

- `docs/fundamental-data-engine/vnm-complete-scorecard/2026-11-11/VNM_23_RUBRIC_SCORECARD.json#/rows/5`
- `data/manual-extracted-pdf/notes/VNM.json#/documents/6/pages/6`
- `data/manual-extracted-pdf/notes/VNM.json#/documents/6/pages/35`
- `data/manual-extracted-pdf/notes/VNM.json#/documents/6/pages/46`
- `data/manual-extracted-pdf/notes/VNM.json#/documents/6/pages/47`
- `data/manual-extracted-pdf/notes/VNM.json#/documents/6/pages/53`

## GQ-HIST — REJECT

**CIO:** Limited reported growth is established; a growth-quality score covering all topics is not.

**EquityResearch:** Revenue/common nominal per-share history is now reconstructed across all four years; acquisitions/scope contribution and normalized cycle/base-effect attribution still prevent a complete historical-growth-quality band. Nominal common-after-fund EPS CAGR is 3.503% (see `six-rubrics.json#/commonEarningsPerShareSeries`); this is not sustainable per-share value compounding.

**RiskManager:** Do not treat missing acquisition/action bridge as negative economics or as neutral 2.

Mandatory topics:

- **trend**: SUPPORTED: revenue CAGR 2.01%, parent NPAT CAGR 3.38%
- **acquisitions**: UNRESOLVED: scope/acquisition contribution not bridged across FY22–25
- **base_effects**: PARTIAL: margins and FY25 JV loss known; normalized cycle attribution incomplete
- **per_share**: SUPPORTED_NOMINAL: retained-note reconstruction now covers FY22–25 common earnings after funds and unchanged issued/outstanding/weighted shares each year; this closes nominal fund/share arithmetic. Sustainable cycle-adjusted attribution remains unresolved.

Phản biện giữ lại: Group revenue growth is not comparable adjusted EPS or sustainable common-owner per-share growth.

Conclusion: None / band None; confidence LOW. One FY22–25 acquisition/scope and cycle/base-effect attribution schedule applied to the now-complete nominal common-after-fund/share series; do not request the reconstructed fund/share series again.

Nếu cần đóng research gap: One FY22–25 acquisition/scope and cycle/base-effect attribution schedule applied to the now-complete nominal common-after-fund/share series; do not request the reconstructed fund/share series again.

Bác bỏ khi: Scope/acquisition reconciliation changes the reported trend materially, or fund/action adjustments reverse the per-share conclusion.

Nguồn đã đối chiếu:

- `docs/fundamental-data-engine/vnm-complete-scorecard/2026-11-11/VNM_23_RUBRIC_SCORECARD.json#/rows/7`
- `data/manual-extracted-pdf/notes/VNM.json#/documents/6/pages/59`
- `docs/fundamental-data-engine/dfr-02/2026-11-04/issuers/VNM.json#/metrics`

## GQ-FWD — REJECT

**CIO:** Named options do not establish Limited/cyclical rather than stagnation or moderate visibility.

**EquityResearch:** Past foreign growth 15.46% and domestic 0.32% are not a volume/price/capacity-based forward forecast.

**RiskManager:** Discount/growth scenarios are assumptions; cannot backfill visibility or funding topics.

Mandatory topics:

- **runway**: PARTIAL: premium/export and named plant options disclosed
- **reinvestment**: PARTIAL: named expansions/commitments; no cohort returns or maintenance split
- **funding**: UNRESOLVED: commitments and operating cash not joined to timing/reserves
- **execution**: PARTIAL: underway status, no quantified utilization/ramp/economic milestones

Phản biện giữ lại: Low per-capita consumption is an opportunity claim, not secured demand or an issuer earnings forecast.

Conclusion: None / band None; confidence LOW. One project/product/channel runway schedule with price-volume/capacity milestones, funding dates and adverse execution case.

Nếu cần đóng research gap: One project/product/channel runway schedule with price-volume/capacity milestones, funding dates and adverse execution case.

Bác bỏ khi: New capacity fails utilization/margin milestones, foreign growth reverses, or retained funding fails to cover commitments.

Nguồn đã đối chiếu:

- `docs/fundamental-data-engine/vnm-complete-scorecard/2026-11-11/VNM_23_RUBRIC_SCORECARD.json#/rows/8`
- `data/manual-extracted-pdf/notes/VNM.json#/documents/7/pages/27`
- `data/manual-extracted-pdf/notes/VNM.json#/documents/7/pages/28`
- `data/manual-extracted-pdf/notes/VNM.json#/documents/7/pages/29`
- `data/manual-extracted-pdf/notes/VNM.json#/documents/6/pages/53`

## IC-IND — ACCEPT

**CIO:** Mixed industry judgment is tied to sector forces, not VNM leadership.

**EquityResearch:** External references are issuer-attributed; do not call raw market studies independently checked.

**RiskManager:** No market-growth-to-share arithmetic; do not reward same rivalry a second time in residual risk.

Mandatory topics:

- **barriers**: SUPPORTED_BOUNDED: scale/distribution/trust/regulatory standards, contestable specialized products
- **competition**: SUPPORTED_ADVERSE: issuer describes strong local/international rivalry
- **demand**: SUPPORTED_BOUNDED: issuer-attributed NielsenIQ -2.4%, nutritional opportunity
- **disruption**: SUPPORTED_BOUNDED: personalized/plant nutrition and compliance/innovation changes

Phản biện giữ lại: Issuer-attributed FY25 dairy decline and fierce rivalry prevent an attractive/rational-industry assertion.

Conclusion: 2 / band Mixed/cyclical/average; confidence MEDIUM. Bounded issuer/financial evidence; no formal eligibility or independent source assurance implied. Exact limitations are retained in topic review.

Nếu cần đóng research gap: Không có research evidence product quyết định-critical thêm cho band bảo thủ này; source/time admission và analyst adoption vẫn tách riêng.

Bác bỏ khi: Comparable industry data showing materially different demand/rivalry or persistent industry returns would change the band.

Nguồn đã đối chiếu:

- `docs/fundamental-data-engine/vnm-complete-scorecard/2026-11-11/VNM_23_RUBRIC_SCORECARD.json#/rows/10`
- `data/manual-extracted-pdf/notes/VNM.json#/documents/7/pages/25`
- `data/manual-extracted-pdf/notes/VNM.json#/documents/7/pages/26`

## IC-CYCLE — REJECT

**CIO:** Balanced is an unsupported midpoint here; absence of a peak/trough thesis is not evidence of balanced asymmetry.

**EquityResearch:** Margins 14.3–15.3% plus export growth describe history, not forward demand/cost/return asymmetry.

**RiskManager:** One cash shock without restriction/maturity proof cannot support survivability topic.

Mandatory topics:

- **cycle**: PARTIAL: weak FY25 demand and historical margins observed
- **forward_asymmetry**: UNSUPPORTED: offsetting narratives do not yield a normalized probability/range assessment
- **survivability**: UNRESOLVED: funding response/obligation stress not completed

Phản biện giữ lại: Positive historical CFO and a scenario-governance process do not establish favorable normalized forward asymmetry.

Conclusion: None / band None; confidence LOW. One normalized forward demand/input-cost scenario and probability/range judgment linked to the same funded stress-survival bridge.

Nếu cần đóng research gap: One normalized forward demand/input-cost scenario and probability/range judgment linked to the same funded stress-survival bridge.

Bác bỏ khi: Demand or input costs move outside the modeled shock envelope, or post-FY25 results invalidate stabilization.

Nguồn đã đối chiếu:

- `docs/fundamental-data-engine/vnm-complete-scorecard/2026-11-11/VNM_23_RUBRIC_SCORECARD.json#/rows/12`
- `data/manual-extracted-pdf/notes/VNM.json#/documents/7/pages/25`
- `data/manual-extracted-pdf/notes/VNM.json#/documents/7/pages/26`
- `data/manual-extracted-pdf/notes/VNM.json#/documents/7/pages/28`
- `data/manual-extracted-pdf/notes/VNM.json#/documents/6/pages/53`

## RG-GOV — ACCEPT

**CIO:** Mixed concerns is bounded by specific procedural evidence and specific control/succession qualifications.

**EquityResearch:** Keep date distinctions from retained recusal review; do not generalize issuer fairness assertions.

**RiskManager:** Distribution amounts support equal treatment only; allocation economics belongs CA-DIST, not this score.

Mandatory topics:

- **disclosure**: SUPPORTED_BOUNDED: audited/bilingual and governance process disclosures
- **related_parties**: SUPPORTED_BOUNDED: named recusal and related-party notes; no fairness assurance
- **minority**: SUPPORTED_BOUNDED: equal ordinary-share rights/dividend and voting procedures
- **auditor**: SUPPORTED: named KPMG and unmodified opinion, not future viability assurance

Phản biện giữ lại: Issuer claims do not prove arm’s-length fair values; independent-director reports describe oversight/data and succession improvements still needed.

Conclusion: 2 / band Mixed concerns; confidence MEDIUM. Bounded issuer/financial evidence; no formal eligibility or independent source assurance implied. Exact limitations are retained in topic review.

Nếu cần đóng research gap: Không có research evidence product quyết định-critical thêm cho band bảo thủ này; source/time admission và analyst adoption vẫn tách riêng.

Bác bỏ khi: Verified related-party terms/minority outcomes contradict the disclosed recusal process or actual2025 dividend outcomes. An auditor finding, material disclosure correction or evidence about audit/non-audit independence contradicts the bounded mixed-governance conclusion.

Nguồn đã đối chiếu:

- `docs/fundamental-data-engine/vnm-complete-scorecard/2026-11-11/VNM_23_RUBRIC_SCORECARD.json#/rows/16`
- `data/manual-extracted-pdf/notes/VNM.json#/documents/7/pages/35`
- `data/manual-extracted-pdf/notes/VNM.json#/documents/7/pages/64`
- `data/manual-extracted-pdf/notes/VNM.json#/documents/7/pages/67`
- `data/manual-extracted-pdf/notes/VNM.json#/documents/7/pages/69`
- `data/manual-extracted-pdf/notes/VNM.json#/documents/7/pages/78`
- `data/manual-extracted-pdf/notes/VNM.json#/documents/6/pages/5`
- `data/manual-extracted-pdf/notes/VNM.json#/documents/6/pages/60`

## RG-RISK — ACCEPT

**CIO:** Retain conservative residual-risk research taxonomy; do not treat this as M1 authorization.

**EquityResearch:** Issuer risk descriptions plus committee control-improvement findings support weakly mitigated technology/control exposure.

**RiskManager:** Named M1 determination still required for formal mapping; do not claim hard veto or proven control failure.

Mandatory topics:

- **residual_risks**: SUPPORTED_BOUNDED: cyber/technology/compliance channels and audit committee data/control weaknesses
- **mitigation**: SUPPORTED_BOUNDED: MFA/backups/testing/change controls described; effectiveness not independently tested
- **distinct_channels**: SUPPORTED: excludes demand/competitive structure and allocation returns already assessed elsewhere

Phản biện giữ lại: Reported control procedures are not tested effectiveness; rising technology/compliance exposure and specific data gaps remain.

Conclusion: 1 / band ELEVATED_WEAK; confidence MEDIUM. Bounded issuer/financial evidence; no formal eligibility or independent source assurance implied. Exact limitations are retained in topic review.

Nếu cần đóng research gap: Không có research evidence product quyết định-critical thêm cho band bảo thủ này; source/time admission và analyst adoption vẫn tách riêng.

Bác bỏ khi: Demonstrated tested recovery/control outcomes and closure of specific oversight/data gaps could improve mitigation assessment. A material incident or compliance failure could worsen the band.

Nguồn đã đối chiếu:

- `docs/fundamental-data-engine/vnm-complete-scorecard/2026-11-11/VNM_23_RUBRIC_SCORECARD.json#/rows/17`
- `data/manual-extracted-pdf/notes/VNM.json#/documents/7/pages/35`
- `data/manual-extracted-pdf/notes/VNM.json#/documents/7/pages/96`
- `data/manual-extracted-pdf/notes/VNM.json#/documents/7/pages/97`

## RG-UNC — REVISE

**CIO:** Whole M3 thesis includes valuation; bounded historical-thesis comfort cannot narrow the score to FY25 accounting.

**EquityResearch:** Challenged Bear/Base/Bull still span ~1.75x with materially different owner-cash funding and terminal conditions; cash crosscheck is a different method but the same issuer source. Demonstrated sensitivity remains high despite revision of the old model.

**RiskManager:** Zero follows demonstrated wide modeled range and multiple material assumption axes, not missing-data penalty. Do not further haircut total for LOW confidence.

Mandatory topics:

- **forecast_range**: SUPPORTED_ADVERSE: challenged valuation options now span ~19,338–33,858 VND/share (~1.75x), before funding-overlap/rate/terminal sensitivities. Prior unaccepted 41.2–78.1tn (~1.90x) range is historical reference only.
- **sensitivity**: SUPPORTED_ADVERSE: discount/terminal and maintenance/funding choices materially move common cash/value
- **dependencies**: SUPPORTED_ADVERSE: normalization, fund completeness, distribution/exit, cutoff/action and reserve overlap remain shared model drivers

Phản biện giữ lại: Parent cash realization is weaker; the retained judgment does not establish a narrow intrinsic-value forecast interval.

Conclusion: 0 / band High uncertainty; confidence MEDIUM. Re-rate after the challenged valuation package narrows economic range with accepted common cash/funding assumptions; no approval alone can make economic uncertainty narrow.

Nếu cần đóng research gap: Re-rate after the challenged valuation package narrows economic range with accepted common cash/funding assumptions; no approval alone can make economic uncertainty narrow.

Bác bỏ khi: Material change in parent distribution receipts, WC/credit quality or finance-credit recurrence. A source revision or economic event invalidates the stated earnings/cash anchor.

Nguồn đã đối chiếu:

- `docs/fundamental-data-engine/vnm-complete-scorecard/2026-11-11/VNM_23_RUBRIC_SCORECARD.json#/rows/18`
- `docs/fundamental-data-engine/scoring-dataset-acceptance/2026-11-04/investment-research-v2/issuers/VNM.json#/modelScenarios`
- `docs/fundamental-data-engine/vnm-complete-scorecard/2026-11-11/VNM_23_RUBRIC_SCORECARD.json#/valuation`
- `docs/fundamental-data-engine/vnm-final-scoring-closure/2026-11-11/valuation-decision.json#/cases`

## CA-REINV — REJECT

**CIO:** Mixed/acceptable needs allocation outcomes; merely identifying both investments and one loss cannot establish economic acceptability.

**EquityResearch:** Do not use net accounting JV loss as proof of all acquisition economics or a disposal decision as proof of realized outcome.

**RiskManager:** Avoid double counting group profitability from BQ-EQ and the same JV loss across GQ-INC/CA-REINV without distinct causal channels.

Mandatory topics:

- **capex**: PARTIAL: amounts and named projects, maintenance/growth outcome attribution missing
- **acquisitions**: PARTIAL: JV/associate loss is known, not the full acquisition cohort return
- **divestments**: PARTIAL: exit decision completed; proceeds/carrying value/rationale-to-outcome bridge not complete

Phản biện giữ lại: One loss cohort cannot represent all management allocation outcomes; accounting disposal policy is not a divestment result.

Conclusion: None / band None; confidence LOW. One named core capex/acquisition/divestment decision-to-realized-cash/economic-outcome cohort bridge; document maintenance/growth split and capital cost.

Nếu cần đóng research gap: One named core capex/acquisition/divestment decision-to-realized-cash/economic-outcome cohort bridge; document maintenance/growth split and capital cost.

Bác bỏ khi: Project cohort evidence demonstrates repeated destruction or, conversely, durable above-cost returns that require re-rating.

Nguồn đã đối chiếu:

- `docs/fundamental-data-engine/vnm-complete-scorecard/2026-11-11/VNM_23_RUBRIC_SCORECARD.json#/rows/19`
- `data/manual-extracted-pdf/notes/VNM.json#/documents/7/pages/27`
- `data/manual-extracted-pdf/notes/VNM.json#/documents/7/pages/29`
- `data/manual-extracted-pdf/notes/VNM.json#/documents/6/pages/37`
- `data/manual-extracted-pdf/notes/VNM.json#/documents/6/pages/53`

## Controls

BQ-MOAT3 chỉ differentiation, không chứng minh IC-POS share/cost rank. BQ-RES2 ghi vulnerability, không thay FH-STRESS survival. FH-BS3 là capitalization/asset quality, không xác nhận FH-LIQ headroom. BQ-CASH3 dựa cash realization và recognition/timing, không phải cost-of-capital spread. IC-IND2 ngành riêng; RG-RISK1 chỉ residual tech/control channels. RG-UNC0 không tạo blanket total haircut. M3 weights/bands và runtime giữ nguyên; không có BUY/SELL.

Các ACCEPT là bounded research selections: không có maximum rubric points, không miễn mandatory topics trong formal engine, không cấp nguồn HUMAN hoặc source admission. Từng topic gắn giới hạn; không assert quantitative evidence cho những topic chỉ có narrative support. Source SHA-256 và JSON Pointers trong `challenge.json`.
