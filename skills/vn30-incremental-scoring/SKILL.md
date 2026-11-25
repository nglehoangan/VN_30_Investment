---
name: vn30-incremental-scoring
description: Prepare a successor to the latest published scorecard for one VN30 ticker at a new cutoff. Compare qualified evidence, reassess affected rubrics, and carry forward verified assessments through existing scoring and publication gates.
---

# VN30 incremental scoring

Accept exactly one ticker, a new explicit cutoff and an approved universe version. Use the [single-ticker contract](../vn30-rollout-orchestrator/references/single-ticker-contract.md) and qualified sector reference. Send multiple tickers through the sequential orchestrator. This workflow requires a strictly later cutoff than the baseline.

1. Resolve the newest authorized publication through the existing publication reader. Record scorecard identity, cutoff, publication and artifact hashes, and source, methodology, executable, dataset and review identities. A newer record with failed verification, revoked authority, missing lineage or no eligible baseline blocks incremental reuse. Use the normal first-assessment workflow if there has never been a valid publication.
2. Compare the new-cutoff admitted facts and selected sources with those consumed by the baseline. Reuse [S1–S5](../equity-s1-s5-assessment/SKILL.md), existing market, corporate-action and source-admission services, and the Future Evidence Register. Compare actual input values, dates, scope, definitions, freshness, hashes and authorizations. Distinguish display-only prices, newly available reports, revisions and effective events from formally admitted inputs. Keep separate economic and knowledge dates. Reject future leakage and flag unresolved conflicts.
3. Trace changes to rubric and shared-gate dependencies, including indirect ones. For example, a raw close change can affect VAL-RET and VAL-MOS, while a share-count change can also affect per-share history and valuation inputs. Check the actual sector rules and formulas before finalizing the affected set. If methodology, sector, authority or reusable evidence validity changed, widen the review to all dependent rubrics and gates.
4. For each carried-forward rubric, verify unchanged economics, unchanged applicable rule and evidence validity through the new cutoff. Record its previous disposition, supporting hashes and the reason reuse remains valid. Reassess everything else using the [one-pass coverage skill](../vn30-evidence-coverage-closure/SKILL.md). Preserve unresolved N/R as null where permitted and report any gating limitation.
5. Assemble a complete successor assessment with all applicable rubric dispositions and recompute totals, coverage, bounds and eligibility in the existing governed engine. Record old and new rubric points, the driver of each change, and coverage changes separately from economic score changes. Keep the prior publication immutable and use a new assessment identity, route and approval package tied to the new cutoff.
6. Run both reviews and read-only prepare. Require exact new route authorization before check and score. Require separate publication approval, then verify website readback using [publication hygiene](../vn30-scoring-publication-hygiene/SKILL.md). A dashboard update signal and the prior approval are insufficient for either write.

For handoff, show the latest published cutoff, newest qualified observation dates by source, changed evidence, affected rubrics, what was carried forward, remaining blockers and the next gate. A later market observation is a reassessment signal, not a new score or admission decision.

## Annual fundamentals and incremental research

Pin the latest admitted final FY separately from interim observations. Use the [SEGM v1.2 annual contract](../../docs/fundamental-data-engine/structural-evaluation-gaps/2026-11-23/SEGM_V12_ANNUAL_REASSESSMENT.md) to compare immutable prior and current evidence indexes through the read-only Prepare companion. Do not roll the FY forward for an interim filing. Preserve original known-at and publication clocks. Carry a review only when its basis, evidence and validity window still match. Pass the affected valuation and decision dependencies to the existing owner-approved model and decision workflows.

Use `--rubric-completion <diagnostic-packet>` on `tools/scoring/vn30_prepare_evaluation.py` to include the reviewed N/R inventory in read-only Prepare. Match ticker, cutoff, qualified sector and pinned universe to the native request. The companion result records research dispositions with no authority effect. The native successor still requires exact candidate pins, reviews and approval.

## Public-data assessment routes

Compare admitted evidence, calculated metrics and retained assessments first. Apply the relevant public route and record the route review during the one allowed evidence-improvement round. Follow the [Approved Baseline v1.0 and stopping rules](../../docs/03%20SCORING/PUBLIC_DATA_PROXY_SPECIFICATION_23_RUBRICS.md#evidence-discovery-workflow-and-stopping-rule).
