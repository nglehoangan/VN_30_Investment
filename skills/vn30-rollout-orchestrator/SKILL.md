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
