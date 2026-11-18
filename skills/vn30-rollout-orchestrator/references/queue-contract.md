# Sequential queue and recovery — v1

`Rollout(store, Universe(version), concurrency=1)` accepts only integer 1. One configured store per repository owns `.rollout.lock`; a second dispatcher is rejected while a worker holds it. Lock acquisition does not steal or remove an active lease. No parallel execution implementation exists.

`plan(requests)` validates all independent one-ticker requests before writing. A queue contains at most one job for each ticker/Skill stage; use another queue for another stage, not duplicates to bypass retry. Identical planning returns the same queue ID without resetting progress. No workers are invoked by planning.

Persistence:

```text
<store>/<queueId>/PLAN.json                         immutable ordered index
<store>/executions/<TICKER>/<executionId>/
  REQUEST.json                                    immutable exact scope
  STATE.json                                      atomic checkpoint pointer/status
  attempt-0001/START.json
  attempt-0001/checkpoint-0001.json                 immutable progress/evidence refs
  attempt-0001/RESULT.json                         immutable result/evidence/blockers
  attempt-0002/...                                 retry never overwrites attempt 1
```

`run_next(queueId, Worker(skill, callback, retry_mode))` invokes at most one pending ticker per call and waits synchronously. Different queue items cannot share an executionId/home. A trusted host supplies the callback; the CLI has no worker registry or arbitrary command execution. The callback receives a detached one-ticker envelope, stable operationKey, optional verified resume checkpoint, and a checkpoint function. It returns only ticker, executionId, status COMPLETED/BLOCKED, evidence and blockers. Any permission-escalation fields or cross-ticker result/evidence fail the attempt. Untrusted callbacks are not sandboxed Python; production hosts must enforce existing resource and authority boundaries. Do not register arbitrary client callbacks.

All result permissions are false. The host must not interpret returned evidence or a candidate reference as an approval. Idempotence for external operations is a **trusted adapter property**, never a JSON PASS flag. The adapter must bind the original input JSON/issuer metadata and pass existing economic/source validators before side effects. No live adapter is shipped here.

State transitions: PENDING → RUNNING → COMPLETED / FAILED / BLOCKED. Write RUNNING before dispatch and persist progress atomically. Ordinary failures are local and retained; independent pending tickers may continue. Explicit `retry_ticker=<one-ticker>` is required for FAILED/BLOCKED jobs. The same executionId/operationKey receives a new attempt ID. Completed retry verifies its result hash and returns it without callback or writes.

An interrupted RUNNING attempt is not presumed harmless. Auto-replay is allowed only for a trusted IDEMPOTENT adapter using the exact operation key; otherwise return RECONCILE_EXTERNAL_EFFECTS_BEFORE_RETRY without another callback. Do not delete a lock file to manufacture recovery. Existing immutable result files survive a crash between result persistence and pointer update.

Bad/missing issuer checkpoints/results/requests are INTEGRITY_BLOCKED for that issuer. Status reporting and other completed issuer artifacts remain intact; no blanket reset, rollback or invalidation. A modified queue control index or changed universe binding is a queue integrity failure and requires investigation. These filesystem receipts are workflow provenance, not cryptographic owner approval or proof of current production readiness.

`run_next` returning None means no dispatchable job, not that every job succeeded. Inspect status and preserve unresolved FAILED/BLOCKED/INTEGRITY_BLOCKED outcomes. A worker for another Skill stage is rejected rather than consuming a different stage's completed receipt.

Current task validation uses only synthetic callbacks and temporary stores. No download, analyst assessment, scoring, production deployment, publication or live database mutation is allowed by creating or testing this foundation.
