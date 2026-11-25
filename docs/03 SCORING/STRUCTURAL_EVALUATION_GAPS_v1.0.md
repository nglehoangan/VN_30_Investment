# Structural Evaluation Gap Management v1.0

This is a read-only feasibility and evidence-review workflow for per-ticker Prepare, valuation and investment decisions. Existing source admission, methodology, scoring authorization, M6.5 and publication gates govern formal progression.

| Root cause | Treatment |
| --- | --- |
| DATA_MISSING | Pin the retained inventory and name the missing field, period and source class. |
| DATA_MAPPING_GAP | Reproduce a concrete mismatch against eligible raw source and test the narrow repair through the original adapter. |
| EVIDENCE_QUALIFICATION_GAP | Check purpose, date, scope, receipt and admission. Record governance constraints separately from the economics. |
| METHODOLOGY_GAP | Record the missing approved calculation or rule and propose a method for review. |
| INTERPRETATION_GAP | Apply an approved interpretation when it covers the evidence. Otherwise prepare a versioned proposal with boundary examples. |
| STRUCTURAL_DESIGN_GAP | Document the contract or rule that cannot represent the case. Escalate baseline changes through Change Request. |
| LEGITIMATE_UNCERTAINTY | Preserve the uncertainty, range or unresolved disposition. Record the trigger that could narrow it. |

## One review per scope

Use the [existing N/R skill](../../skills/vn30-structural-nr-remediation/SKILL.md) to diagnose scored rubric gaps. Apply the shared taxonomy to dependencies outside N/R without reopening a retained rubric review. For decision gaps distinguish evidence, mapping, rule, human judgment, economic uncertainty and governance.

For one ticker, qualified sector and cutoff, verify matching retained source and admission artifacts before seeking new evidence. Check issuer and revision identity, native units, mapping, period, scope, availability and qualification using the existing consumers. If a field can be recovered, validate against the raw source before proposing a change. Finish after one evidence-improvement pass and one validation review. Close a gap as RESOLVED or ESCALATED with an explicit trigger. A NO future-data result for an unresolved gap requires a materially different trigger from another annual report of the same structure.

For valuation gaps record whether retained evidence resolves the issue, whether a transform is missing, whether an approved method applies and whether the assumption is inherently uncertain. Record the future-data test separately. Run existing sector-specific metric, action-comparability, source and scenario checks. Preserve the distinction between current-purpose and historical PIT evidence. Retain assumptions, sensitivities and uncertainty at their actual confidence. Audit-only descriptors cannot serve as valuation inputs.

For decisions use the existing M4/M6.5 contracts and authority. Reuse the authoritative M6.3 portfolio projection, cash and position facts. A review status or diagnostic verdict is distinct from the seven Decision States. The audit yields no Decision State or executable action.

## Prepare integration

Call the read-only companion entry point with the same single-ticker Prepare arguments, plus a reviewed feasibility packet.

    python3 -B tools/scoring/vn30_prepare_evaluation.py --ticker ACB --universe-version vn30-20260803-reviewed-20261115 --cutoff 2026-10-30 --evaluation-feasibility docs/fundamental-data-engine/structural-evaluation-gaps/2026-11-23/ACB_EVALUATION_FEASIBILITY.json

With an exact current route candidate, pass the native optional candidate and previous-proposal arguments. Without one, native Prepare reports its missing candidate requirements while the audit validates the retained scope. The companion preserves native status, blockers, route and hashes and adds the evaluationFeasibility field. It uses the prepared security/sector identity and hashes the audit independently. A component verdict conveys audit feasibility. Native Prepare determines whether scoped limitations may proceed, and a read-only READY_FOR_CIO result still needs exact authorization. Use the unmodified native CLI for governed execution.

The packet has an exact subject, source index, checklist, gap register and review counts. Pin retained files by SHA-256 and use a precise locator or optional JSON pointer. A gap ID binds ticker, cutoff, component, dependency and local key. Each gap carries references to available evidence, required and missing evidence, causal and governance classifications, resolution, future-data test, impact, owner, approval and reopening trigger. All checklist rows require evidence. PASS requires no unresolved gaps on that row. A component takes its most restrictive check status across PASS, PASS WITH LIMITATIONS and BLOCKED. These are reviewer findings. The companion verifies the schema, subject, evidence pins, review bounds and status consistency. Original consumers verify economic calculations, source/admission eligibility and applicable approvals.

Retain one final packet per ticker and the report. Use existing [publication and retention hygiene](../../skills/vn30-scoring-publication-hygiene/SKILL.md) to protect canonical pins and receipts. Dispose only of scratch generated by the audit. Canonical pruning requires the existing governed cleanup process.

[Initial readiness and gap audit](../fundamental-data-engine/structural-evaluation-gaps/2026-11-23/STRUCTURAL_EVALUATION_GAP_AUDIT.md)

## Annual baseline and incremental reassessment (SEGM v1.2)

The companion accepts `--annual-reassessment <packet.json>` alongside or in place of the feasibility packet. The native Prepare result is preserved. The additional `annualReassessment` section is read-only and grants no authority. See the [annual contract and change-impact report](../fundamental-data-engine/structural-evaluation-gaps/2026-11-23/SEGM_V12_ANNUAL_REASSESSMENT.md).
