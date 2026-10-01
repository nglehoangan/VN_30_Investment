# M6.5.2 approved governance alignment

Review base: `4f672ade122733ee54bfefa649b882ef692bf20b`. Date: 2026-09-30.

## Governance

| Resolution | Status | Change |
| --- | --- | --- |
| CR-01 | APPROVED / IMPLEMENTED | Approved implementation computes concentration capacity before board-lot execution. Smaller compliant adds preserve the economic state. |
| CR-02 | APPROVED / IMPLEMENTED | Existing BROKEN → SELL routing retained; staging/operational blocking does not produce REDUCE/HOLD. |
| CR-03 | APPROVED / IMPLEMENTED | Existing deterministic exceptional hurdle retained; every qualification, evidence/rationale requirement and independent risk-approval gate remains. |

The project owner's explicit instruction, **“Approve 3 resolutions”**, is recorded in [M652_OWNER_APPROVAL.md](M652_OWNER_APPROVAL.md). This follows independent M6.5.1 review with supplied Critical 0, Major 0, Minor blocking 0. The [conflict register](CHANGE_REQUESTS.md) links initial conflicts, pending-governance remediation, explicit approval and this implementation. Historical reports are left intact.

## CR-01 behavioral matrix

Deterministic fixtures: NAV VND 100,000,000; price VND 20,000; fees VND 3,000; board lot 100 shares; normal economic upper target 10%. Risk-compliant size is capped at the requested quantity, calculated downward to 12 decimals using exact integer arithmetic. Cash is checked against the resulting board-lot quantity. It does not decide economic attractiveness.

| Case | Ownership / condition | Requested shares | Risk-compliant shares | Board-lot executable shares | Economic state | Execution status |
| --- | --- | ---: | ---: | ---: | --- | --- |
| A | Unowned BUY, oversized request | 1,000 | 499.985 | 400 | BUY | EXECUTE |
| B | Unowned STRONG BUY, oversized request | 1,000 | 499.985 | 400 | STRONG BUY | EXECUTE |
| C | Owned, current value VND 2m, oversized add | 1,000 | 399.985 | 300 | ACCUMULATE | EXECUTE |
| D | Owned, current value VND 16m, no-add zone | 1,000 | 0 | 0 | HOLD | NOT ACTIONABLE |
| E | Owned, current value VND 9m, sub-lot capacity | 100 | 49.985 | 0 | ACCUMULATE | BLOCKED — PORTFOLIO/RISK |
| F | Unowned, explicit hidden-factor no-add prohibition | 100 | 0 | 0 | AVOID | NOT ACTIONABLE |

A–C execute only the clipped quantity and record `CONSTRAINED — SMALLER SIZE REQUIRED`. D–F have `NOT AUTHORIZED` and `executableShares: null`. HOLD/AVOID fallbacks follow M4 ownership semantics when no incremental allocation is allowed. Independent SELL/REDUCE rules retain precedence. No new Decision State or Execution Status was introduced.

Additional tests cover owned STRONG BUY clipping, sub-share positive capacity, arbitrary board lots, zero requested shares, exact boundaries, fees, clipped cash requirements, sector headroom/no-add zones, independent risk approvals and the emergency ceiling. Proposed and compliant post-trade weights are recorded separately on the approved implementation. Requested quantity remains in the immutable input.

## Methodology

| Identity | Governance / use | Production eligibility |
| --- | --- | --- |
| `m65-decision-v1-session-resolutions-20260920` | Historical synthetic candidate | Never; original behavior retained |
| `m65-decision-v1-proposed-resolutions-20260920` | PROPOSED / TEST | Never; original behavior retained |
| `m65-decision-v1-approved-resolutions-20260930` | APPROVED / PRODUCTION | Only supported production decision implementation; all upstream approval and domain gates still apply |

The new record separately pins:

| Field | Value |
| --- | --- |
| methodologyId | `m65-decision-v1-approved-resolutions-20260930` |
| semanticVersion | `1.0.1` |
| implementationIdentity | `m65-decision-v1-approved-resolutions-20260930` |
| family | `M4_DECISION` |
| configurationReference | `m65-decision-v1-approved-resolutions-20260930` |
| governanceStatus | `APPROVED` |
| intendedUse | `PRODUCTION` |
| governingDocumentReference | `docs/06_DASHBOARD/6.5 Decision Engine/CHANGE_REQUESTS.md` |
| approvalReference | `docs/06_DASHBOARD/6.5 Decision Engine/M652_OWNER_APPROVAL.md` |
| effectiveDate | `2026-09-30` |
| recordedAt | `2026-09-30T00:00:00.000Z` |

The recording timestamp is a deterministic date marker, not an invented approval time. An append-only data migration inserts this record into the existing registry; no schema structure or new governance workflow is added. Domain and registry validation reject changed pinned fields. Existing SQLite immutability triggers reject replacement, update and deletion.

M6.4 production approval remains an independent prerequisite. The formal-issuance integration test supplies clearly labeled upstream approval fixtures in disposable SQLite; it grants no project approval. No actual production decision or real portfolio database was created or changed.

## Historical integrity and authority

`tests/fixtures/m65-historical-decisions.json` contains two synthetic artifacts captured from the review-base engine before changing its concentration behavior. Both use an owned oversized request, so they detect accidental application of the new clipping semantics to old identities. Replay compares the complete serialized result byte-for-byte, including scope, original method metadata, reasons and quantities. Golden-file SHA-256: `4c79586f1e932b627f51f27cf4745c95869e4b8aca068b6168fc944df396ed72`.

Populated M6.4 and M6.5 temporary-database tests compare all historical methodology and scoring rows before/after the migration. M6.5 checks compare decision bodies, hashes and metadata, replay both golden artifacts, and repeat migration deployment/status. A separate test creates a new formal artifact under the approved identity through server registry/artifact resolution and confirms the original synthetic database row is identical afterward. Synthetic history is never silently promoted; cross-scope prior-decision links retain their existing rejection rule.

The server still resolves persisted scorecards and portfolio facts, compares every method against its registered record, and rechecks portfolio currency. Tests reject invented final decisions, execution overrides, forged approval metadata, unknown implementations and historical candidate promotion. Domain sizing derives capacity from validated portfolio/risk inputs. Existing M6.3 accounting and M6.4 scoring calculations remain unchanged.

## Validation

All required commands passed in the final sequential run. [Command logs and machine-readable results](m652-verification-evidence/results.json) are retained alongside this report. All database commands use disposable SQLite, never the real portfolio database.

| Command | Exit code | Result | Test count |
| --- | ---: | --- | ---: |
| `pnpm lint` | 0 | PASS | — |
| `pnpm typecheck` | 0 | PASS | — |
| `pnpm test` | 0 | PASS | 540 |
| `pnpm test:portfolio` | 0 | PASS | 136 |
| `pnpm test:integration` | 0 | PASS | 110 |
| `pnpm prisma validate` | 0 | PASS | — |
| `pnpm prisma migrate status` | 0 | PASS | — |
| `pnpm build` | 0 | PASS | — |
| `pnpm test:e2e` | 0 | PASS | 1 |
| `pnpm test:decision` | 0 | PASS | 150 |
| `git diff --check` | 0 | PASS | — |

Counts overlap across suites. The 150 decision tests include the prior 100 protections and 50 additional cases. Fresh SQLite, populated M6.4/M6.5 upgrades, repeatability and immutable historical records are covered by the integration suite.

Environment: Node 22.23.2; isolated checkout `/private/tmp/vn30-m652-clean`; disposable CLI database `/private/tmp/vn30-m652-validation-db/verification.sqlite`. The [source manifest](m652-verification-evidence/source-manifest.json) pins 126 source/configuration files, including the dependency lockfile and golden artifacts, to the workspace contents. Integration fixtures each create and remove their own private temporary databases. Browser testing binds only localhost.

Earlier attempts exposed an older installed Node runtime, fixture JSON type casts, an obsolete single-registry-row test expectation, a sandbox localhost restriction, and duplicate generated `.next/types` files in the workspace. Fixture casts and the row-preservation assertion were corrected. The final sequence uses the required runtime and a clean hash-verified copy with browser permission. Initial/workspace attempt evidence is retained in the evidence subdirectories. After a complete clean pass, review added the zero-request regression; the complete sequence was rerun against the final source.

## Findings and scope

- Critical unresolved: 0.
- Major unresolved: 0.
- Minor unresolved: 1 existing non-blocking finding, M65-R1-m01.
- Technical debt: M65-R1-m01 responsibility decomposition of `decision/engine.ts`, deferred to a later controlled refactor. This change adds only a focused capacity helper and identity-specific routing.

**M6.6+ functionality implemented: NO**

M6.5.2 is ready for independent review. Work stops here; M6.6 is not started.
