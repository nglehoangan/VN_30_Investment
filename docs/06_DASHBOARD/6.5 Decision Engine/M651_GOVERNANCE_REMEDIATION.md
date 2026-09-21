# M6.5.1 governance remediation

Date: 2026-09-21. Review target: c1e7af870fe7f36a24d487628a4da5525c0c5882. M6.5 remains NOT APPROVED; this report does not grant policy or production approval.

## Findings

- M65-R1-M01: CLOSED in the remediation candidate. Unsupported approval assertions are withdrawn throughout the current M6.5 reports and register. The candidate identity is neutral and cannot issue formal production decisions.
- M65-R1-m01: OPEN, non-blocking. No responsibility-extraction refactor was performed. Decision calculations and execution routing are unchanged.

## Governance state and proposed resolutions

All three records are **PENDING GOVERNANCE APPROVAL**. Exact source conflicts and affected regression test names appear in [CHANGE_REQUESTS.md](CHANGE_REQUESTS.md).

| Record | PROPOSED RESOLUTION |
| --- | --- |
| CR-01 | A binding concentration/risk limit blocks the positive capital-allocation state for the proposed size. A compliant smaller size may preserve the positive economic state. |
| CR-02 | BROKEN investment thesis requires SELL for an owned security. Execution may be staged where operationally necessary, but staging must not rewrite SELL into REDUCE/HOLD. |
| CR-03 | The approved qualifying conditions themselves may activate the exceptional floor. A separate approval reference is not required unless another explicit risk exception independently requires approval. |

These are candidate semantics for independent CIO/user approval, not approved resolutions. The candidate is `m65-decision-v1-proposed-resolutions-20260920`, PROPOSED/TEST, with no approval reference. The old session-named identity is only a synthetic compatibility identity, not a governance fact.

## Production proof and existing governance mechanisms

`src/domain/decision/validation.ts` allows only the two known candidate identities and requires SYNTHETIC_TEST. Its `PENDING_GOVERNANCE_TEST_ONLY` guard prevents formal issuance even when an input claims APPROVED/PRODUCTION. Unknown replacement identities also fail validation. Both application creation and repository append/replay invoke this deterministic boundary.

`src/infrastructure/repositories/methodology-schema.ts` uses the existing registry validation to reject approval or production labeling of either pending identity (`PENDING_DECISION_RESOLUTIONS`). Existing requirements also reject APPROVED without an external evidence reference and non-approved records claiming an approval reference. No new governance store, workflow or approval service was introduced.

The registry records external references; it does not independently authenticate their contents or grant approval. Tests do not fabricate an accepted approval: they deliberately submit the actual pending change-request document as a false approval claim and assert rejection. This candidate remains blocked regardless of that reference. Future production activation requires verifiable external resolution of all three conflicts, controlled implementation review, and immutable approved methodology registration. No future approved identity or approval record was created here.

## Historical and regression evidence

Five additional cases cover both identities' production rejection, synthetic proposed semantics, legacy identity replay, and persisted history under governance retirement. The production tests assert the exact pending-governance rejection after other formal metadata has been relabeled. The registry test rejects claimed approval, rejects approval without evidence, appends a separate RETIRED/TEST record, and verifies the original synthetic artifact is byte-for-byte unchanged.

The decision output now preserves its validated input implementation identity, so legacy synthetic replay retains its original output identity. Existing seven-state, ownership, anti-shortcut, cash, board-lot, execution, accounting, scoring, persistence and migration tests remain in place without weakened assertions. No schema migration or real portfolio database change is needed.

## Validation

All required commands passed in the final sequential run. Logs are in `m651-verification-evidence/`. Validation uses Node 22.23.2 and a byte-matched source/configuration copy with matching dependency lockfile in the isolated temporary checkout. The source manifest pins 123 files. All database validation uses fresh disposable SQLite, including existing populated-M6.4/repeat-migration tests.

The first run found a TypeScript control-flow narrowing error introduced by the test-only guard; it also affected build/browser commands. The guard was moved after the existing validations without changing its production restriction, then the entire required sequence was rerun.

| Command | Exit code | Result | Test count |
| --- | --- | --- | --- |
| pnpm db:migrate | 0 | PASS | — |
| pnpm lint | 0 | PASS | — |
| pnpm typecheck | 0 | PASS | — |
| pnpm test | 0 | PASS | 490 |
| pnpm test:portfolio | 0 | PASS | 136 |
| pnpm test:integration | 0 | PASS | 106 |
| pnpm prisma validate | 0 | PASS | — |
| pnpm prisma migrate status | 0 | PASS | — |
| pnpm build | 0 | PASS | — |
| pnpm test:e2e | 0 | PASS | 1 |
| pnpm test:decision | 0 | PASS | 100 |
| git diff --check | 0 | PASS | — |

Counts overlap across suites. All 100 decision tests, including the existing 95 M6.5 cases and five new governance cases, passed. Temporary verification database: `/private/tmp/vn30-m65-db-a6zylzog/verification.sqlite`.

## Scope

**M6.6+ functionality implemented: NO**

No broker execution, ledger mutation, UI or workflow work was added. Work stops at M6.5.1.
