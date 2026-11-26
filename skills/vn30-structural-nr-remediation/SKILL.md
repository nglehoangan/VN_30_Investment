---
name: vn30-structural-nr-remediation
description: Diagnose existing N/R rubrics for one VN30 ticker in one bounded research pass. Reuse retained evidence and escalate structural blockers.
---

# Structural N/R remediation v1.0

Accept exactly one ticker, qualified sector, baseline cutoff and pinned universe version. Use the [single-ticker contract](../vn30-rollout-orchestrator/references/single-ticker-contract.md). The validator calls the prepare guard with the exact packet digest. Route multiple issuers through the [sequential orchestrator](../vn30-rollout-orchestrator/SKILL.md) at concurrency one.

1. Open the exact scorecard or official limited-coverage readback, its authority and its sector methodology. Record economic and knowledge clocks independently. Inventory existing N/R.
2. Perform one evidence-improvement pass. Read the [owner confirmation](../../docs/03%20SCORING/M3_M4_OWNER_SOURCE_CONFIRMATION_2026-11-16.md) and adjacent JSON. Trace retained evidence to the exact document revision, issuer, period, scope, unit, publication date, known-at clock, hash and locator. Apply original admission and purpose checks. Use [PDF JSON first](../read-pdf-json-first/SKILL.md) for targeted PDF work. Seek a specific new field only when retained inputs cannot answer it and a search could change the disposition.
3. Check all four causes, record all that apply and select one primary. Complete FUTURE_DATA_TEST with YES, NO or UNKNOWN, evidence and rationale. NO requires structural escalation. Set a specific qualifying reopening trigger.
4. Complete one resolution and validation review. Compare with approved sector topics and bands, challenge adjacent bands, verify against raw source for a mapping repair and check scope and clocks. Record VERIFIED for a defensible band, CONSERVATIVE at the minimum of the lowest supported approved band, or N/R with null points. End each row RESOLVED or ESCALATED. Version proposals and record blockers and approval requirements.
5. Retain one final diagnostic packet per execution and the decision matrix. Retry the same packet deterministically. A substantive new input or approved rule requires a separately scoped execution. Apply the existing assessment, trusted review, scoring and publication gates for any successor.

    python3 -B tools/scoring/structural_nr.py --ticker ACB --universe-version vn30-20260803-reviewed-20261115 --packet docs/fundamental-data-engine/structural-nr-remediation/2026-11-23/ACB_DIAGNOSTIC.json

The [governance contract](../../docs/03%20SCORING/STRUCTURAL_NR_REMEDIATION_v1.0.md) defines the validation rules. The tool reads pinned files and emits to stdout. A trusted orchestrator host can call diagnose(context, packet) with the packet digest bound in the prepared request, then return ticker-scoped evidence and blockers using the existing queue contract. The validator checks recorded reviews. Economic judgment and receipt verification remain with the designated reviewers and existing gates.

For gaps in Prepare, S5 inputs or M6.5 dependencies, use the [shared evaluation register](../../docs/03%20SCORING/STRUCTURAL_EVALUATION_GAPS_v1.0.md). Reuse the retained rubric diagnosis, map its cause to the shared taxonomy, and attach the scoped feasibility packet to read-only Prepare.

## Retained historical recovery

Use the admitted fact inventory before collecting another period. Match ticker, item ID, consolidation scope, period and source revision. Verify the stored hash before deriving a metric. Retain the original knowledge clock and source locator. Keep cash-flow and per-share comparisons on a comparable basis when consolidation or corporate actions change.

For valuation gaps, anchor sensitivities to retained observations or explicitly dated scenario assumptions. Keep as-reported run rates, reverse hurdles and illustrative cash-flow values separate from normalized valuation inputs. An uncertainty band may be supported by measured sensitivity even when fair value, return and margin-of-safety bands remain unresolved. Review the exact band and dependencies before proposing a successor.

For a new annual or interim observation, use the [SEGM v1.2 annual contract](../../docs/fundamental-data-engine/structural-evaluation-gaps/2026-11-23/SEGM_V12_ANNUAL_REASSESSMENT.md) to recover the latest eligible FY before reopening N/R. Review the affected rubrics only. A numeric conversion from N/R requires a new reviewed assessment, the approved band and admissible evidence for every mandatory topic.

For a combined Prepare readback, supply the same pinned packet through `--rubric-completion` to `tools/scoring/vn30_prepare_evaluation.py`. A mismatch with the native ticker, sector or cutoff blocks the companion. For annual inputs, require filing publication by the economic cutoff and apply the separate historical knowledge-time checks. Route any proposed proxy through an approved governed consumer.

## SEGM v1.3 research-to-scoring reconciliation

Pass `--research-bridge` alongside both `--annual-reassessment` and `--rubric-completion` in the single-ticker Prepare companion. The bridge checks the exact limited-score ID and hash against SQLite inventory, then emits all rubric dispositions and their review links. A research candidate with a supported band still needs topic-level assessment, independent reviews and exact successor approval. Use a pinned issuer publication-date proof to repair missing FY metadata for current-purpose diagnostics. Keep the original knowledge clock and historical PIT eligibility. Only reconstruct reported FCF from matched, admitted CFO and cash-capex cells. Reuse it across cash, stress and valuation reviews with the reported label.

## Public-data assessment routes

Apply the approved public route before reopening a structural N/R. Close with an exact reason and reopening trigger when the one bounded improvement cannot establish a band. Follow the [Approved Baseline v1.0 and stopping rules](../../docs/03%20SCORING/PUBLIC_DATA_PROXY_SPECIFICATION_23_RUBRICS.md#evidence-discovery-workflow-and-stopping-rule).

## Governed category rollout

Category execution parameters use one ticker with `category`, `cutoff`, `methodologyVersion`, `priorAcceptedCategories` and `executionScope`. Resolve the cutoff and category from the approved candidate. Preserve prior accepted categories on identical inputs.

Distinguish genuine economic N/R, eligible historical Effective Score, pending update, unresolved material impact, confirmed invalidation, expired assessment, obsolete completeness requirement, Prepare-to-Scoring integration defect, legitimate authority blocker and outside-scope rubric. Evidence discovery requires a specific unresolved economic dependency.

[Approved Financial Health baseline](../../docs/03%20SCORING/WP2_FINANCIAL_HEALTH_AMENDMENT_v1.0.json)

### Approved Financial Health A/B routes

Record why B detailed evidence is insufficient and whether A can independently establish a band. Do not switch to A to avoid adverse B evidence or treat uncertainty alone as failure.

For FH-LIQ and FH-STRESS, apply the [approved v1.2 amendment](../../docs/03%20SCORING/WP2_FINANCIAL_HEALTH_ANALYST_RISK_v1.2.json) to one ticker and the requested Financial Health periods. Method B retains the canonical direct bands and takes priority. For eligible detail gaps, Method A assesses a distinct public-data risk profile, capped at 3/4 for FH-LIQ and 4/5 for FH-STRESS. Reuse the qualified source-bound financial product and sector normalization, including bank and property conventions. Preserve observed facts, calculations, estimates and scenario assumptions separately. Avoid repeat discovery.

Record an explicit analyst band or N/R before validation, with evidence for the selected conclusion, adjacent-band rationale, counterevidence disposition and limitations. Review whether each unresolved dependency affects that band. Never infer points from a ratio or treat unverified resources or actions as certain. Record the five confidence dimensions independently of points, and enforce the existing freshness, invalidation and historical eligibility checks. Carry method and band semantics through research consumers with no formal gate credit or assumed cross-route cardinal equivalence. Keep genuine N/R distinct from outside scope.

[Historical v1.1 replay contract](../../docs/03%20SCORING/WP2_FINANCIAL_HEALTH_DUAL_ROUTE_v1.1.json)


### Approved Growth Quality research routes

For one ticker and an eligible cutoff, apply the [WP3 Growth Quality baseline](../../docs/03%20SCORING/WP3_GROWTH_QUALITY_AMENDMENT_v1.0.json). Use B first for History and Forward, and Direct → unchanged PX02 → Capital Productivity Profile for Incremental. Method A uses route-specific bands capped at 4/5, 4/5 and 3/5 respectively. Record proposals before validation and preserve sector normalization, confidence, counterevidence, method identity and research-only authority. Preserve the separate economic channels and mixed-route comparability limits.

Distinguish direct detail gaps, failed PX02, analyst N/R, rejected proposal, source or scope problems, eligible historical provisional scores, genuine N/R and outside scope. Evaluate alternate profiles before opening an evidence gap.


### Approved Industry & Competitive Position research routes

Apply the [WP4 baseline](../../docs/03%20SCORING/WP4_INDUSTRY_COMPETITIVE_POSITION_AMENDMENT_v1.0.json) for one ticker, a pinned cutoff and sector. Use Direct before Public Industry Structure or Cycle Exposure. Competitive Position uses Direct → unchanged PX03 → Competitive Capability. Method A ceilings are 3/4, 3/4 and 1/2. Preserve canonical bands, sector normalization, source eligibility, counterevidence and confidence. Qualify evidence ownership against accepted BQ, FH and GQ. Keep shared observations distinct from independent corroboration and research separate from formal gates.

Separate invalid market scope, no external industry evidence, PX03 comparator mismatch, unsupported capability, unsupported cycle channel, evidence rejection, stale provisional history and genuinely out-of-scope rows.
