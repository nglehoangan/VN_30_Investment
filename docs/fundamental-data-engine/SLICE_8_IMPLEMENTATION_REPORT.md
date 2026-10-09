# Slice 8 — initialization preparation and evidence

Baseline: `f9950b4` (Slice 7). User request: “Implement slice 8”. Initial worktree clean. Scope: DESIGN_REVIEW.md §G Slice 8 and DATA_INITIALIZATION.md. **Real initialization remains BLOCKED; Slice 8 is not complete or approved.**

## Implemented and measured

A deterministic read-only initialization preflight CLI inventories fixed repository source/governance evidence with SHA-256 bindings. It does not load environment files, open a database, access the network, import reports or calculate scores. Optional target/as-of arguments prepare redacted review metadata only; invalid/duplicate arguments and execute/approve flags fail closed. A successful CLI exit is not dataset PASS.

The dated packet at `evidence/2026-10-09-initialization-preflight.json` accounts for 30 research candidates and four supplemental historical candidates. These are source-register inventory counts, **not official universe membership or initialized coverage**. No exact dataset/snapshot/contentHash exists in this packet; formalUniverseCount, measurements and readiness remain null/unknown. Every candidate is explicitly blocked. All 15 gates are NOT_EXECUTED with no reviewer sign-off; three open Major initialization prerequisite issues are retained rather than falsely closed. The packet itself is hashed.

The controlled runbook specifies required inputs, command review, existing immutable repository orchestration, independent reconciliation, snapshot sealing, exact DI evidence and per-ticker blockers. It explains FPT mapping limitations, DATE_ONLY/UNKNOWN handling, current versus historical knowledge, unsupported sector routes and separation from downstream scoring. No new parser, financial formula, source-ranking system, schema, migration or government/source approval is introduced.

## Remaining dependencies

The repository source register explicitly says official constituent validation PENDING and productionDataAccepted false. Canonical registry, FPT reviewed mapping and derivation crosswalk remain PROPOSED. Discovery/selected sample PDF checks do not qualify all real sources, complete history or publication times. No exact initialization target/reporting windows/market package or independent review capabilities were supplied with this request.

A clarification was sent for the target DB, reporting windows/cutoffs, official universe/sector/market inputs and independent source/normalization/publication approval references. Real execution depends on those inputs and review of the concrete source/target command required by DESIGN_REVIEW.md §G. No private DB or `.env.local` was inspected. Existing source links/approval metadata are preserved.

## Verification gates

Final handoff is contingent on actual matching results on the frozen source/test/report tree:

| Check | Required result |
| --- | --- |
| New initialization preflight tests | 3 passed |
| Complete unit/integration/architecture (Slices 01–07, M3/M4, current/workflow/backup/migrations) | 74 files / 953 tests passed |
| Token session | 3 passed |
| TypeScript noEmit / ESLint zero warnings / boundaries | Passed; existing 139 source modules |
| Prisma validate/generate with explicit harmless URL and --no-env-file | Passed |
| git diff --check and new-file whitespace | Passed |
| Before/after SHA-256 inventory | Identical |

The CLI output must exactly reproduce the dated packet. Tests assert no research/approval-label escalation, no PASS gates, null dataset readiness, deterministic hashes, target path redaction, invalid dates/targets and execute/approval rejection. No UI/build or schema changes are made in this slice; Slice 7's isolated production/browser validation remains historical evidence, not a new Slice 8 real-data check. Logs remain outside the repository at `/private/tmp/vn30-slice8-*`.

## Serial self-review

Architecture: fixed-file read-only tooling has no database/network/scoring capability; no new domain admission authority. Financial data: source discovery is explicitly separated from official membership, qualified facts, normalization and actual knowledge. Risk/QA: no synthetic approvals or test results promoted to real DI PASS; dataset issues and remaining prerequisites stay open. Portfolio intent: no scoring, ranking, Top 10, trading or Slice 9 work.

Recommendation: review the preparation deliverables; supply missing artifacts and review the concrete real import package before continuing actual initialization. No claim of full VN30 initialization, independent DI sign-off, Critical/Major issue closure, commit or push.
