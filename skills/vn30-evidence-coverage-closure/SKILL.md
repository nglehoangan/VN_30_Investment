---
name: vn30-evidence-coverage-closure
description: Close one VN30 ticker's research coverage after one evidence-improvement pass. Record supported rubric bands, N/R, coverage bounds and future evidence without granting scoring or publication authority.
---

# VN30 evidence coverage closure

Accept one ticker, its qualified sector, the explicit cutoff and approved universe version. Use the [orchestrator single-ticker contract](../vn30-rollout-orchestrator/references/single-ticker-contract.md) and its prepare guard. Require the supplied sector to match the qualified identity and sector route. Reject lists and unresolved identity, coverage or sector mismatches. Submit multiple ticker jobs individually through the orchestrator at concurrency one.

1. Open the ticker's admitted dataset, exact cutoff and BANK or other approved sector binding. Reuse accepted financial facts, source receipts and [S1–S5](../equity-s1-s5-assessment/SKILL.md). Consult the applicable registered methodology and [rubric definitions](../../src/domain/scoring/methodology.ts). Preserve all weights, bounds and sector-specific requirements.
2. Review every applicable rubric once. Reuse retained or owner-confirmed sources first. Apply the [Approved Baseline v1.0 route and stopping rules](../../docs/03%20SCORING/PUBLIC_DATA_PROXY_SPECIFICATION_23_RUBRICS.md#evidence-discovery-workflow-and-stopping-rule). Check the proxy or model route before searching for a specific unresolved field. Use the one allowed evidence-improvement round only where an eligible disclosure could change the band. Record source path, SHA-256, date, scope, locator, rationale, counter-evidence, confidence, missing fields and reassessment trigger per rubric.
   Khi nguồn công khai đủ để ước tính theo methodology, dùng phép tính hoặc kịch bản có nguồn, công thức, khoảng giả định và độ nhạy. Ví dụ BANK, mô hình vốn/RWA phải phản ánh ảnh hưởng lên lợi nhuận khi hạn chế tăng trưởng và kiểm tra lại CAR. Ghi rõ đây là ước tính; nếu vẫn thiếu bằng chứng có thể đổi band, nêu loại tài liệu, kỳ và bảng/trường cần bổ sung.
3. Record VERIFIED when the evidence supports a band and point under the rules. Record CONSERVATIVE only when evidence supports a bounded range and the methodology permits the lower supported point. Record NOT_RATED with null points when neither is defensible. A real zero requires evidence for the zero-point band. Keep economic risk conclusions separate from closure of the review.
4. Use the governed scorer's coverage output where supported. For a research summary, report confirmed points as the sum of rated points, rated coverage as rated maxima divided by applicable maxima, remaining N/R weight as the sum of unrated maxima, and bounds from confirmed points to confirmed points plus the unrated maxima. An incomplete result has no full official total. Never normalize partial points into a ranking. Check the route explicitly permits the exact N/R set before preparing a formal candidate.
5. End the research pass with the original scope and every disposition. Preserve limitations even if formal assessment is blocked. Register each future report or field with period, expected publication window if known, affected rubric and trigger. A new report with later availability goes to a separately scoped reassessment, never into a historical cutoff by default.
6. Save one immutable closure and a compact evidence index under the execution identity. Formal assessment review, review bindings, exact route approval and publication remain distinct gates. Use [publication hygiene](../vn30-scoring-publication-hygiene/SKILL.md) downstream.

[ACB V3 readback](../../docs/fundamental-data-engine/acb-scoring-readiness/2026-11-19/assessment/ACB_OFFICIAL_LIMITED_V3_EXACT_SCORE_READBACK.json) is a BANK example. At 2026-10-30 it has 23 rubrics, 14 rated, nine N/R, 18 confirmed points, 58% coverage, bounds 18–60 and null full score. [V4 research closure](../../docs/fundamental-data-engine/acb-scoring-readiness/2026-11-22-v4/V4_RESEARCH_CLOSURE.json) and [immutable V4 score readback](../../docs/fundamental-data-engine/acb-scoring-readiness/2026-11-22-v4/V4_SCORE_READBACK.json) document the separate successor. These figures and the approved N/R set are specific to ACB.

For repeated N/R or an existing retained baseline, apply [Structural N/R remediation](../vn30-structural-nr-remediation/SKILL.md) within the same bounded review. A NO future-data test goes to structural escalation after this pass.

## Governed category rollout

Category execution parameters use one ticker with `category`, `cutoff`, `methodologyVersion`, `priorAcceptedCategories` and `executionScope`. Resolve the cutoff and category from the approved candidate. Preserve prior accepted categories on identical inputs.

Use retained evidence first. Stop at a defensible band and allow at most one coordinated evidence improvement round per category work package. Private data is optional; use approved public equivalents. Record genuine N/R by missing material dependency and distinguish missing metrics from assessment availability or eligible historical points.

[Approved Financial Health baseline](../../docs/03%20SCORING/WP2_FINANCIAL_HEALTH_AMENDMENT_v1.0.json)

### Approved Financial Health A/B routes

Stop search on a supportable A/B band. Record both route dispositions and separate genuine economic N/R from outside rollout. Book cash, unverified deposits and uncommitted finance stay labeled and cannot be counted as certain resources.

For FH-LIQ and FH-STRESS, apply the [approved v1.2 amendment](../../docs/03%20SCORING/WP2_FINANCIAL_HEALTH_ANALYST_RISK_v1.2.json) to one ticker and the requested Financial Health periods. Method B retains the canonical direct bands and takes priority. For eligible detail gaps, Method A assesses a distinct public-data risk profile, capped at 3/4 for FH-LIQ and 4/5 for FH-STRESS. Reuse the qualified source-bound financial product and sector normalization, including bank and property conventions. Preserve observed facts, calculations, estimates and scenario assumptions separately. Avoid repeat discovery.

Record an explicit analyst band or N/R before validation, with evidence for the selected conclusion, adjacent-band rationale, counterevidence disposition and limitations. Review whether each unresolved dependency affects that band. Never infer points from a ratio or treat unverified resources or actions as certain. Record the five confidence dimensions independently of points, and enforce the existing freshness, invalidation and historical eligibility checks. Carry method and band semantics through research consumers with no formal gate credit or assumed cross-route cardinal equivalence. Keep genuine N/R distinct from outside scope.

[Historical v1.1 replay contract](../../docs/03%20SCORING/WP2_FINANCIAL_HEALTH_DUAL_ROUTE_v1.1.json)


### Approved Growth Quality research routes

For one ticker and an eligible cutoff, apply the [WP3 Growth Quality baseline](../../docs/03%20SCORING/WP3_GROWTH_QUALITY_AMENDMENT_v1.0.json). Use B first for History and Forward, and Direct → unchanged PX02 → Capital Productivity Profile for Incremental. Method A uses route-specific bands capped at 4/5, 4/5 and 3/5 respectively. Record proposals before validation and preserve sector normalization, confidence, counterevidence, method identity and research-only authority. Preserve the separate economic channels and mixed-route comparability limits.

Use retained eligible evidence first. Review the authorized profile when detailed normalization, internal forecasts or private project IRR are unavailable. Evaluate sufficiency for the selected band and separate unsupported profiles from missing direct measures.


### Approved Industry & Competitive Position research routes

Apply the [WP4 baseline](../../docs/03%20SCORING/WP4_INDUSTRY_COMPETITIVE_POSITION_AMENDMENT_v1.0.json) for one ticker, a pinned cutoff and sector. Use Direct before Public Industry Structure or Cycle Exposure. Competitive Position uses Direct → unchanged PX03 → Competitive Capability. Method A ceilings are 3/4, 3/4 and 1/2. Preserve canonical bands, sector normalization, source eligibility, counterevidence and confidence. Qualify evidence ownership against accepted BQ, FH and GQ. Keep shared observations distinct from independent corroboration and research separate from formal gates.

Reuse retained external industry and competitor sources first. Distinguish a failed market-rank route from an available capability profile and a missing normalized forward-asymmetry case from a valid cycle-exposure profile.


### Approved Valuation & Forward Return research routes

For one ticker and the pinned cutoff, apply the [WP5 baseline](../../docs/03%20SCORING/WP5_VALUATION_FORWARD_RETURN_AMENDMENT_v1.0.json). Select the sector method, qualify the exact raw close and share basis, and distinguish reported or annualized earnings from supported normalized economics. Prefer detailed Method B, then bounded quantitative Method A with canonical ceilings 6/8, 6/8 and 3/4. Separate enterprise WACC, equity discount rate, shareholder IRR and investor hurdle rate.

Record assumption provenance, materiality, scope, downside, counterevidence and freshness before scoring. Preserve the scenario, no-rerating, reverse return and conservative impairment analyses. Sensitivities convey no scoring authority. A change in raw price requires fresh band assessment even when the financial model remains eligible. A material share or financial change requires model review. Retain genuine N/R and its dependency blockers. Bind predecessor Effective Scores through the serial cumulative workflow and retain reproducible research receipts. Preserve formal gates and publication restrictions.


### Valuation v1.1 external research and independent rubric eligibility

Use the [external research intake skill](../vn30-external-research-evidence/SKILL.md) for approved inputs only. Bind material dependencies, cross-check and adverse evidence per rubric/model/route/period. Keep publication eligibility, source-family revisions, investor corporate-action entitlement and terminal horizon traceable. Explicit zero dividend credit makes no payout prediction. Same-basis no-rerating may use the scale-free return when normalized economics, growth, dilution and contraction review qualify. Preserve independent conservative MOS, price-bound recalculation, sensitivity-only labels, exact replay and research authority.


### WP5 bounded shareholder IRR

For one ticker and cutoff, use the [scoped VAL-RET v1.2 amendment](../../docs/03%20SCORING/WP5_VALUATION_FORWARD_RETURN_AMENDMENT_v1.2.json). Distinguish qualified point, conservative case, single-band range, unexplained cross-band range and sensitivity only. Low or negative supported returns can score; zero points and N/R are distinct. Qualify the complete coherent uncertainty set, endpoints and material adverse cases. Review entitlement, terminal horizon, distribution credit and contraction. Use admitted analyst forecasts as evidence, and qualify material bounds independently. Exclude irrelevant model dependencies. Keep the existing cumulative workflow, price and share binding, counterevidence, model and band lineage, exact assessment record and research-only authority.

### WP5 v2.0 analyst-driven valuation

For one ticker and an eligible sector model, follow [RR01–RR20](../../docs/03%20SCORING/WP5_VALUE_INVESTING_ANALYSIS_AMENDMENT_v2.0.json). Pin a Data Freeze per period. Separate facts, reproducible calculations and analyst-generated estimates. Persist the model proposal and reasonableness challenge separately. External corroboration is optional. Classify material blockers RB01–RB05, allow a single revision, and bind the final economic disposition and limitations to the exact proposal. Preserve model-specific lineage, Method B priority, bounded return forms, five confidence dimensions, current-price Effective Score and existing research authority.

### WP6 Risk & Governance research

Use the [RG01–RG20 amendment](../../docs/03%20SCORING/WP6_RISK_GOVERNANCE_AMENDMENT_v1.0.json) for one ticker, eligible sector and frozen information window. Preserve factual audit, governance, sanctions and veto evidence separately from judgments. Review public governance and distinct residual loss channels. Record the prior rubric owner and distinguish planned controls, implementation and demonstrated effectiveness at the assessment date. Recompute thesis sensitivities using eligible retained scenarios and record shared dependencies separately from score levels. Use RV01–RV06, RB01–RB05 and at most one revision. Apply Effective Score freshness and material-event rules. Preserve formal Stage 0, Hard Veto and Risk Policy status independently from research classifications.

### WP7 Capital Allocation Quality research

Use the [CA01–CA24 research amendment](../../docs/03%20SCORING/WP7_CAPITAL_ALLOCATION_AMENDMENT_v1.0.json) for one eligible ticker and sector. Freeze factual decisions, deployed capital, commissioning and attributable outcomes. Reconcile parent cash retention, paid distributions and buyback applicability. Separate new issuance, treasury transfers and pro-rata entitlement changes. Calculate event-aligned transfer, ESOP break-even benefits and sequential per-share effects. Prioritize detailed, unchanged PX04/PX05 and then applicable bounded routes. Bind both comparative share basis and distinct cycle-adjusted support before awarding binary maxima. Preserve any N/R and provisional origins in the complete 23-rubric display. Aggregate complete research totals only when all Effective Scores qualify, with existing formal authority kept separate.
