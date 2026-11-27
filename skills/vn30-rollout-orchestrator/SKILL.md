---
name: vn30-rollout-orchestrator
description: Plan a versioned VN30 rollout and coordinate exactly one ticker Skill invocation at a time, with isolated checkpoints, blockers and safe retry. Also supports read-only universe inventory/readiness. Does not perform analysis itself or authorize scoring, deployment or publication.
---

# Sequential VN30 rollout

Use for a requested list/universe rollout, not as a batch argument to a ticker-processing Skill. Existing corpus rebuilders, PDF queues and portfolio/DCA workflows are not substitutes for this execution queue.

Read [single-ticker contract](references/single-ticker-contract.md) for invocation and identity rules; read [queue contract](references/queue-contract.md) for dispatch, persistence and recovery. Reuse the existing execution Skills and their fetching, sector analysis, valuation and admission logic. Structural N/R remediation is a read-only research stage with its own prepared identity.

1. Select a retained version in `references/universe-registry.json` and an explicit reference date. The registry pins an existing qualified membership profile, official reconciliation and security identities. Do not infer membership from today's list, the review timestamp or a calendar rule. Coverage limits are not constituent exit dates. The initial retained version covers 03/08–15/11/2026; no new membership retrieval is performed by this foundation.
2. Read-only inventory may examine every constituent. Membership eligibility is not proof of financial readiness, source admission, analyst approval or PIT availability.
3. Prepare one request per eligible ticker and required Skill. Reject ALL, wildcard, lists or repeated ticker values at the Skill boundary. A queue may contain multiple **individually validated requests**, never a multi-ticker invocation. Use one Skill stage per queue; distinct stages get distinct execution IDs/queues.
4. Keep `concurrency=1`, one configured store per repository and the store-wide execution lock. Dispatch `run_next` once, await its result, then decide whether to dispatch the next job. No background spawning, worker pool or implicit live adapters.
5. Preserve completed results; retain each failed/blocked attempt and continue independent eligible jobs. Retry a failed ticker only explicitly. Interrupted/ambiguous effects require reconciliation unless the trusted host adapter guarantees idempotence for the same operation key.
6. Bind source/admission/assessment/deployment/publication references to the actual ticker. A shared standing-provider policy can be referenced within its approved scope, but VNM observations, share decisions, assessments or publication permissions cannot authorize another ticker. The queue grants no permissions, including when a worker finishes successfully.

CLI examples (planning only):

```sh
python3 -B skills/vn30-rollout-orchestrator/scripts/runtime.py inventory \
  --universe-version vn30-20260803-reviewed-20261115 --reference-date 2026-10-30
python3 -B skills/vn30-rollout-orchestrator/scripts/runtime.py prepare \
  --skill equity-s1-s5-assessment --ticker VNM --sector INDUSTRIAL \
  --reference-date 2026-10-30 --purpose RETROSPECTIVE_RESEARCH \
  --universe-version vn30-20260803-reviewed-20261115
```

`plan --requests-json <explicit-jobs.json> --store <review-store> --universe-version <version>` persists a queue but invokes zero workers. `status --queue-id <id> --store <same-store> --universe-version <version>` is read-only. There is deliberately no CLI `run`, scoring, deployment or publication command. `control.py::run_next` is the tested host-adapter foundation; live bindings are not installed by this amendment.

Keep sector-specific M3/M4 rules in `equity-s1-s5-assessment`; no VNM assumptions or industrial formula defaults. Research completion does not approve an assessment or authorize production. **STOP for CIO review within the requested scope.**

## Public-data assessment routes

Route each separately prepared ticker through the common 23-rubric public-data workflow before scheduling evidence improvement. Record the selected route and stop reason in the ticker checkpoint. Follow the [Approved Baseline v1.0 and stopping rules](../../docs/03%20SCORING/PUBLIC_DATA_PROXY_SPECIFICATION_23_RUBRICS.md#evidence-discovery-workflow-and-stopping-rule).

## Governed category rollout

Category execution parameters use one ticker with `category`, `cutoff`, `methodologyVersion`, `priorAcceptedCategories` and `executionScope`. Resolve the cutoff and category from the approved candidate. Preserve prior accepted categories on identical inputs.

In the existing single-ticker queue, verify approved methodology and sufficiency, execute annual and incremental assessment and resolve Effective Scores, then construct the candidate and bind Prepare → Adoption → Preflight → Scoring. Aggregate by category and verify downstream consumption, regression and closure. Other unimplemented categories stay outside the rollout scope with no invented topics or points.

[Approved Financial Health baseline](../../docs/03%20SCORING/WP2_FINANCIAL_HEALTH_AMENDMENT_v1.0.json)

### Approved Financial Health A/B routes

Carry the versioned FH-LIQ/FH-STRESS route qualifiers and ceilings through Prepare, Adoption, Preflight and Scoring in one serial research queue. Keep accepted prior categories immutable.

For FH-LIQ and FH-STRESS, apply the [approved v1.2 amendment](../../docs/03%20SCORING/WP2_FINANCIAL_HEALTH_ANALYST_RISK_v1.2.json) to one ticker and the requested Financial Health periods. Method B retains the canonical direct bands and takes priority. For eligible detail gaps, Method A assesses a distinct public-data risk profile, capped at 3/4 for FH-LIQ and 4/5 for FH-STRESS. Reuse the qualified source-bound financial product and sector normalization, including bank and property conventions. Preserve observed facts, calculations, estimates and scenario assumptions separately. Avoid repeat discovery.

Record an explicit analyst band or N/R before validation, with evidence for the selected conclusion, adjacent-band rationale, counterevidence disposition and limitations. Review whether each unresolved dependency affects that band. Never infer points from a ratio or treat unverified resources or actions as certain. Record the five confidence dimensions independently of points, and enforce the existing freshness, invalidation and historical eligibility checks. Carry method and band semantics through research consumers with no formal gate credit or assumed cross-route cardinal equivalence. Keep genuine N/R distinct from outside scope.

[Historical v1.1 replay contract](../../docs/03%20SCORING/WP2_FINANCIAL_HEALTH_DUAL_ROUTE_v1.1.json)


### Approved Growth Quality research routes

For one ticker and an eligible cutoff, apply the [WP3 Growth Quality baseline](../../docs/03%20SCORING/WP3_GROWTH_QUALITY_AMENDMENT_v1.0.json). Use B first for History and Forward, and Direct → unchanged PX02 → Capital Productivity Profile for Incremental. Method A uses route-specific bands capped at 4/5, 4/5 and 3/5 respectively. Record proposals before validation and preserve sector normalization, confidence, counterevidence, method identity and research-only authority. Preserve the separate economic channels and mixed-route comparability limits.

Accept ticker, GQ category, cutoff, methodology, route and scope in the serial research workflow. Bind accepted predecessor categories and retain exact Prepare, Adoption, Preflight and Scoring results before analytical aggregation.


### Approved Industry & Competitive Position research routes

Apply the [WP4 baseline](../../docs/03%20SCORING/WP4_INDUSTRY_COMPETITIVE_POSITION_AMENDMENT_v1.0.json) for one ticker, a pinned cutoff and sector. Use Direct before Public Industry Structure or Cycle Exposure. Competitive Position uses Direct → unchanged PX03 → Competitive Capability. Method A ceilings are 3/4, 3/4 and 1/2. Preserve canonical bands, sector normalization, source eligibility, counterevidence and confidence. Qualify evidence ownership against accepted BQ, FH and GQ. Keep shared observations distinct from independent corroboration and research separate from formal gates.

Bind accepted predecessor categories for a single ticker and an approved IC candidate. Preserve route eligibility, evidence ownership and approved Effective Scores through Prepare, Adoption, Preflight, Scoring and analytical aggregation.


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

### WP7 v1.1 bounded economic closure

Apply [CA25–CA34](../../docs/03%20SCORING/WP7_CAPITAL_ALLOCATION_AMENDMENT_v1.1.json) for one eligible ticker and sector. Group capital decisions only where deployed resources and observed economic outcomes support attribution. Consider the latest eligible parent cash assessment with a dated subsequent-event review. Keep the original date and direct N/R visible when provisional research carry applies. Distinguish unresolved scope or materiality from proven invalidation. Use event-aligned analyst valuation and benefit materiality with dated facts, economic bounds and share-entitlement reconciliation. Unknown ESOP offsets remain unknown. PX04/PX05, canonical maxima and formal gates continue to apply. Finalize the bounded review with at most one analyst revision.

### Targeted capital-allocation evidence updates

Audit retained materials first and distinguish extracted, unextracted, derivable, unused, missing and nonrequired inputs. Pin the narrow evidence inventory and its availability window. Match project identities and classify outcomes as financial, operational or execution evidence. For ESOP, verify each cohort's terms, KPI, rights, event dates, eligible raw prices and actual gross versus net proceeds. Use human-capital indicators as scoped proxies, calculate reverse benefit thresholds and challenge overlap across annual programmes. Stop after the authorized pass and preserve unaffected Effective Scores, proxy behavior and formal authority.
