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
