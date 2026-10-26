# Risks and open decisions

Direction is already approved. These are concrete unresolved choices, not a request to approve the same direction again. No decision below is recorded as granted.

|ID|Owner/reviewer decision needed|Recommendation / consequence|
|---|---|---|
|D1|Separate capability contracts and NAV-only DTO versus changing legacy snapshot semantics|Prefer additive NAV-only reader, preserve old actionability/scoring contract; no daily NAV gate|
|D2|Authorize precise implementation slice(s)|Start accounting/reconciliation scope only after concrete source plan; do not commission all roadmap phases by default|
|D3|Dedicated snapshot storage and DB target/migration|Small append-only Prisma/SQLite repo; explicit owner/deployment configuration, rollback/recovery validation and separate migration execution approval|
|D4|Non-trade receivable settlement semantics / opening claim correctness|Versioned exact linked claim clearing with no second income, or separately reviewed correction if opening classification disproved. Never ordinary dividend+unchanged claim or cash-adjustment plug|
|D5|Performance/risk measurement addendum|Approve exact XIRR daycount/solver and sparse observed disclosure; no substitution for official TWR or complete drawdown and no threshold change|
|D6|Independent validation and acceptance roles/evidence|Named producer-distinct reviewer, exact Expected-vs-Actual fixtures, authority/revocation audit; no Codex self-acceptance|
|D7|Supported book perimeter/inception versus lifetime rebase|Prefer retain08/10 opening + verified forward updates. Any separate reconstructed2025 book/rebase requires explicit auditable plan; do not mutate inception or double import17 earlier trades|
|D8|Exact M7 baseline/release/approval manifest and M8 pointer scope|Preserve retained restrictive M7 report, resolve header/parent-status discrepancy and missing referenced documents with owner evidence. Do not declare historical gate passed by removing feature dependency|
|D9|Snapshot cadence/correction and current acceptance while app login deferred|On-demand latest completed EOD as minimal proposed cadence; ordinary viewing no-login, operational acceptance remains blocked without separately approved authenticated mechanism. No IdP selection/implementation now|

Principal risks: silent relaxation of composite actionability; false continuous drawdown from sparse samples; missing intra-interval cash-flow marks; stale calendar/identity/price reuse; gross/net receivable or dividend double count; mixing trade-date cash with settlement-only quantities; hidden historical rebasing; mutation of snapshot history; same-host rollback indistinguishable without independent anchors; SQL String-kind misuse for scoring artifacts; owner task approval confused with source authority.

Risk guardrail: when evidence unavailable, block the affected formal metric/action, not ordinary unrelated ledger viewing. All current NAV-required components remain required; no invented105 materiality waiver. Snapshots may reduce historical-data needs but cannot manufacture current economic completeness. No code or policy changed here.
