# Phase2 implementation review plan — not started

Assessment date: 2026-10-27 (Asia/Ho_Chi_Minh). Phase 1 design/evidence closure only. Owner approved the prior architecture assessment as baseline v1.0 in the current task; this is not authenticated source/identity acceptance or Phase 2 authorization. Original baselines and sealed evidence remain unchanged. SOURCE_REFERENCES.json pins inspected files; JSON Pointers below address those pinned bytes.

Phase1 ends with this package. Each item below awaits explicit owner review/authorization; ordering does not grant authority.

1. Close source decisions: portfolio perimeter, exact opening claim allocation, gross/net status, debt/cash-equivalent breakdown, FPT status evidence and basis limitations. Record missing components BLOCKED. Permit isolated code preparation only if specifically authorized; it cannot post incomplete actual events.
2. Approve smallest event extension and version dispatch: preserve all old facts/legs byte-for-byte; add explicit nontrade settlement with claim/receipt ownership and no second income. Do not modify legacy TRADE_SETTLEMENT meaning or MWAC numeric policy. Define method registry compatibility separately from event schema version.
3. Approve additive claim/status/audit persistence only as needed after inspecting current SQLite/Prisma constraints. Prepare migration with compatibility/rollback tests in isolated copy; production migration execution requires separate authorization. Existing String facts may avoid a type-enum migration but does not eliminate allocation uniqueness/audit needs.
4. Implement offline deterministic fixtures and isolated repository rollback/concurrency/dedup/reversal tests. Add accepted-source/knowledge validation in application composition; pure replay remains exact arithmetic, not acceptance. Preserve originals on corruption/failure.
5. Independent implementation review and actual expected-vs-actual reconciliation with evidence. Present proposed actual forward events without posting; no Phase2 approval is inferred from this contract task.
6. Only a later specifically authorized operational posting can write accepted events, followed by exact read-only broker reconciliation and protected-data checks. Current NAV/snapshot/performance/risk roadmap slices remain separate and unstarted.

No new providers, identity system, login, service or broad infrastructure is needed for design closure. Daily historical prices and historical NAV are optional enhancements; current claim/debt/identity completeness is mandatory. Operational audit atomicity and authenticated acceptance cannot be claimed from JSON evidence or local OS identity.
