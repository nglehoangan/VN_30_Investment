---
name: vn30-rollout-orchestrator
description: Plan a versioned VN30 rollout and coordinate exactly one ticker Skill invocation at a time, with isolated checkpoints, blockers and safe retry. Also supports read-only universe inventory/readiness. Does not perform analysis itself or authorize scoring, deployment or publication.
---

# Sequential VN30 rollout

Use for a requested list/universe rollout, not as a batch argument to a ticker-processing Skill. Existing corpus rebuilders, PDF queues and portfolio/DCA workflows are not substitutes for this execution queue.

Read [single-ticker contract](references/single-ticker-contract.md) for invocation and identity rules; read [queue contract](references/queue-contract.md) for dispatch, persistence and recovery. Reuse the five existing execution Skills; do not clone their fetching, sector analysis, valuation or admission logic.

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
