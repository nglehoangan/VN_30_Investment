# Implementation plan and delivered foundation

## Delivered in this amendment

- Audit all five Skill entry specifications and distinguish execution from universe-wide read-only inventory/readiness.
- Add the missing orchestrator Skill and one shared, stdlib-only invocation/queue control library. No duplicate collector, financial normalizer, scoring engine or valuation implementation.
- Register the retained membership version by exact source hashes and effective-date/coverage semantics; bind sector enum to its existing source file.
- Update Skill interfaces and AGENTS.md: exactly one required ticker, reject batch/ALL/wildcards, require version/date, preserve ticker-scoped permission and sector rules.
- Provide deterministic execution/queue identity, isolated request/attempt/evidence/blocker persistence, atomic checkpoints, store-wide serial lock, completed-result verification, interrupted recovery and explicit idempotent retry.
- Expose only prepare/inventory/plan/status at the CLI. No actual execution adapter is wired, and no queue for real analysis is dispatched in this task.

## Subsequent integration boundary — not executed here

When an actual rollout is requested, a trusted host must wrap the already retained worker/adapters with this prepared context. The host must match input ticker/cutoff, exchange/security, original source hashes, financial scope/period/unit and output issuer tags **before side effects**. Its idempotence/reconciliation property comes from the trusted adapter, not submitted JSON. The preserved legacy worker alone is not a compliant active Skill invocation.

Use the existing CaféF/Vietstock fetchers for their approved acquisition scope, the S4 runtime for retained review, and the PDF/S1–S5 procedures for issuer-specific interpretation. Do not bind corpus-reset scripts, parallel downloaders, arbitrary shell commands or user-selected authority files. Keep one dispatcher/store and one awaited ticker invocation at a time.

Keep reference-date membership validation separate from original disclosure availability, current-purpose knowledge and historical PIT. A new date outside retained coverage needs a properly qualified universe version; this is not a repeat provider approval and does not imply a constituent exit. Preserve prior registry versions rather than rewriting hashes or dates.

Formal assessment adoption, scoring, production deployment and publication stay in their existing exact-content, ticker-scoped workflows. This amendment creates no approvals for another ticker and no new per-PDF/fact approval loop. Do not infer readiness from VNM's success or queue completion. No scoring/production/publication integration is included in the delivered CLI.

## Acceptance for this scope

Foundation accepted for review when interface guards, isolation, sequential scheduling, retry/recovery, source-version checks and protected-state checks pass. That acceptance does **not** claim live end-to-end rollout readiness or validated economics for another issuer. STOP for CIO review; no new milestone execution.
