# M6.5.3 sector concentration monotonicity remediation

Review target: `56b267274c888708970493159e20398702866bb9`. Date: 2026-10-01.

## Finding and implementation

**M65-R3-M01 = CLOSED.** Sector capacity is monotonic under the corrected identity; unscoped approval cannot unlock sector additions. All required regression and historical-integrity checks pass.

The former branch expanded the sector cap from 30% to 40% solely when current exposure crossed 35% and an unscoped approval string existed. The corrected implementation uses the ordinary 30% capacity boundary because the current contract cannot validate sector-add exception scope. Generic approval, drawdown approval, small-NAV approval, a normalization plan, or a string claiming `APPROVED — SECTOR_CONCENTRATION` cannot expand it.

For fixed NAV, fees, price, requested quantity, other risk inputs and evidence, the sector headroom term decreases with increasing current sector value. Intersecting that term with unchanged sizing constraints and rounding down to board lots preserves monotonicity. CR-01's smaller-size economics and sub-lot execution separation remain intact. CR-02 BROKEN → SELL and CR-03 qualifying 12% hurdle rules are unchanged.

## Risk Policy interpretation and authority

The [exact-source audit](M653_SECTOR_POLICY.md) records the wording and ownership from M1 Risk Policy §6.3 and §§7.1–7.4, and M4 BUY_RULES §12.2 / SELL_RULES §10.2.

M1 §7.2 states:

> **>30%–35% NAV:** high concentration; normally no additional capital;

and:

> **>35%–40% NAV:** mandatory CIO/Risk review; new capital requires explicit approval and hidden-factor analysis;

M1 §7.3 requires an externally approved sector exception with a maximum temporary exposure, review/expiry trigger, hidden-factor analysis, rationale and normalization plan. The policy allows qualified exceptions; the existing data model cannot establish such a grant. In particular, tolerance of existing concentration or normalization over time does not imply permission to add. This ambiguity in mapping the approved policy to unscoped contract evidence is explicitly recorded and fails closed.

**Validated sector-add exception scope: NONE for all currently representable inputs.** No current approval string can authorize sector exceptions. CR-04 is PROPOSED / NOT APPROVED for future narrowly typed evidence and policy clarification. It creates no permission in this release.

The 40% sector limit is provisional under normal conditions, with separate exceptions described by §7.3. The absolute emergency ceiling is the 30% single-name Small-NAV ceiling in §6.3. This correction preserves that hard ceiling and does not implement any sector-ceiling exception or automatic forced selling.

## Sector monotonicity matrix

Same unowned candidate, NAV VND 100,000,000, price VND 20,000, fees VND 3,000, request 1,000 shares, board lot 100, economic target 10%, fixed elevated-exposure justification, and identical generic approval reference. Only the sector peer's market value changes. Validated sector-add exception scope is **NONE** in every row.

| Current sector | Risk-compliant shares | Board-lot executable shares | Decision State | Execution Status | Trade authorization |
| ---: | ---: | ---: | --- | --- | --- |
| 24.99% | 250.455 | 200 | BUY | EXECUTE | AUTHORIZED |
| 25% | 249.955 | 200 | BUY | EXECUTE | AUTHORIZED |
| 25.01% | 249.455 | 200 | BUY | EXECUTE | AUTHORIZED |
| 29.99% | 0.455 | 0 | BUY | BLOCKED — PORTFOLIO/RISK | NOT AUTHORIZED |
| 30% | 0 | 0 | AVOID | NOT ACTIONABLE | NOT AUTHORIZED |
| 30.01% | 0 | 0 | AVOID | NOT ACTIONABLE | NOT AUTHORIZED |
| 32% | 0 | 0 | AVOID | NOT ACTIONABLE | NOT AUTHORIZED |
| 34.99% | 0 | 0 | AVOID | NOT ACTIONABLE | NOT AUTHORIZED |
| 35% | 0 | 0 | AVOID | NOT ACTIONABLE | NOT AUTHORIZED |
| 35.01% | 0 | 0 | AVOID | NOT ACTIONABLE | NOT AUTHORIZED |
| 37% | 0 | 0 | AVOID | NOT ACTIONABLE | NOT AUTHORIZED |
| 39.99% | 0 | 0 | AVOID | NOT ACTIONABLE | NOT AUTHORIZED |
| 40% | 0 | 0 | AVOID | NOT ACTIONABLE | NOT AUTHORIZED |
| 40.01% | 0 | 0 | AVOID | NOT ACTIONABLE | NOT AUTHORIZED |

The table-driven tests check the exact rows and non-increasing capacity across all points. They also repeat the monotonicity property for owned and unowned candidates under six unchanged evidence configurations: none, generic risk approval, drawdown approval, small-NAV approval, normalization plan, and a forged sector-scope string. Owned no-capacity cases retain HOLD / NOT ACTIONABLE; eligible smaller adds preserve ACCUMULATE. Separate tests preserve STRONG BUY and sub-lot execution behavior.

## Methodology lineage and production eligibility

| Identity | Immutable metadata / role | New formal issuance |
| --- | --- | --- |
| `m65-decision-v1-session-resolutions-20260920` | Historical synthetic candidate | NO |
| `m65-decision-v1-proposed-resolutions-20260920` | PROPOSED / TEST candidate | NO |
| `m65-decision-v1-approved-resolutions-20260930` | 1.0.1; original APPROVED / PRODUCTION record preserved, including original defect semantics | NO — historical replay only |
| `m65-decision-v1-sector-monotonicity-20261001` | 1.0.2; APPROVED / PRODUCTION implementation correction | YES, subject to all existing upstream approval and domain gates |

New methodologyId, implementationIdentity and configurationReference are each pinned to `m65-decision-v1-sector-monotonicity-20261001`. Effective date is `2026-10-01`; recordedAt is `2026-10-01T00:00:00.000Z`, a deterministic date marker. Governing document: `docs/06_DASHBOARD/6.5 Decision Engine/M653_SECTOR_POLICY.md`. Approval reference: the existing `docs/06_DASHBOARD/6.5 Decision Engine/M652_OWNER_APPROVAL.md`. There is no fabricated new policy approval.

An append-only data migration adds the new record to the existing registry. No old migration, metadata row, decision artifact or approval artifact is rewritten. Application creation and repository append reject new FORMAL artifacts under the superseded implementation. Pure replay and repository reads retain the original methodology semantics.

## Historical integrity and security evidence

- Existing session/proposed golden artifacts still replay byte-for-byte.
- `tests/fixtures/m652-historical-decisions.json` was captured from the review-target engine before modification. It preserves formal 32% → AVOID and 37% → BUY results, including complete inputs, outputs and methodology metadata. SHA-256: `0736bb34205b726256d104ac8fa806e87d493c54e721358975af3789dd699dac`.
- Upgrade tests populate M6.4 scoring, M6.5.1 synthetic decisions, and M6.5.2 formal decisions in separate temporary databases. After migration and a repeated deployment, they compare all original methodology, scoring and decision rows, including body/hash fields, and replay every historical decision.
- The formal correction test creates a distinct M6.5.3 AVOID artifact linked to the historical M6.5.2 BUY artifact. The old database row and its BUY output remain identical afterward.
- Security tests reject client-selected old methodology at application and repository issuance boundaries, forged current-method metadata, and injected Decision State, Execution Status or capacity fields. Arbitrary approval/normalization strings fail to unlock sector capacity.
- Fresh-database tests verify both approved records, exact new metadata, duplicate rejection, and SQLite UPDATE/DELETE/REPLACE protections.

Tests use explicitly labeled synthetic upstream approval fixtures where formal issuance prerequisites must be exercised. They grant no M6.4 or other project governance approval. The real portfolio database is never used.

## Validation

All required commands passed in the requested sequence. [Logs and machine-readable results](m653-verification-evidence/results.json) and the [source manifest](m653-verification-evidence/source-manifest.json) are retained.

| Command | Exit code | Result | Tests |
| --- | ---: | --- | ---: |
| `pnpm lint` | 0 | PASS | — |
| `pnpm typecheck` | 0 | PASS | — |
| `pnpm test` | 0 | PASS | 581 |
| `pnpm test:portfolio` | 0 | PASS | 136 |
| `pnpm test:integration` | 0 | PASS | 115 |
| `pnpm prisma validate` | 0 | PASS | — |
| `pnpm prisma migrate status` | 0 | PASS | — |
| `pnpm build` | 0 | PASS | — |
| `pnpm test:e2e` | 0 | PASS | 1 |
| `pnpm test:decision` | 0 | PASS | 191 |
| `git diff --check` | 0 | PASS | — |

Counts overlap across suites. The 191 decision tests retain the prior 150 checks and add 41 remediation cases. Fresh SQLite, populated M6.4/M6.5.1/M6.5.2 upgrades, repeat migration and unchanged historical rows are covered by the integration suite.

Commands run under Node 22.23.2 in `/private/tmp/vn30-m653-clean`, with 129 source/configuration files hash-matched to the workspace, including package/lockfile, migrations and historical artifacts. CLI SQLite is `/private/tmp/vn30-m653-validation-db/verification.sqlite`; integration fixtures own separate private temporary databases. Browser testing uses localhost.

A preliminary typecheck found missing union narrowing in the new test helper; the helper now requires a validated PASS portfolio before reading sizing. No production contract was widened to suppress the error.

## Findings and scope

- Critical unresolved: 0.
- Major unresolved: 0. M65-R3-M01 is closed.
- Minor blocking: 0.
- Minor non-blocking: 1 — M65-R1-m01, `decision/engine.ts` responsibility decomposition.
- Technical debt: M65-R1-m01 remains deferred to a controlled refactor; no broad refactor performed.
- CR-04 remains a future unapproved evidence-contract request; current behavior fails closed.

**M6.6+ functionality implemented: NO**

M6.5.3 is ready for independent review. Work stops here; M6.6 is not started.
