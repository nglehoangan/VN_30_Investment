# PEC-1C architecture

**Status: IMPLEMENTATION_READY_DEPENDENCY_BLOCKED.** No trusted provider or real operation executor is configured. Positive authentication examples are synthetic fixtures, not production readiness.

## Assessment and reuse

| Capability | Existing evidence | PEC-1C disposition |
|---|---|---|
| Identity | RuntimeReviewerIdentity port | Preserve verified subject/session semantics; port alone is not an authenticated provider. No hardcoded administrator or environment-token shortcut. |
| Human review | HumanReviewStore, FileHumanReviews, ReviewAssessment, AcceptRuntimeDataset | Reuse producer distinction, exact hash binding and append/CAS design. File review store is not a verified identity provider or a transactional formal-operation audit. |
| Transactions | SQLite/Prisma formal repositories and workflow-artifacts transactions | Reuse SQLite transactional persistence and original append-only trigger conventions. Capture executor receives the SAME SQLite transaction for its business operation. No separate service/database introduced. |
| Existing audit | workflow_audit and workflow_execution | Tied by foreign keys to portfolio workflow reviews/ledger; must not invent a fake portfolio review just to store a financial event. |
| Formal events | No generic authenticated formal knowledge event relation | Minimal additive formal_knowledge_audit SQL installation contract, with inline evidence/proof/operation data in one atomic row. Not an alternative owner approval registry. |
| Immutable source bytes | Existing retained/sealed evidence | Rehash original bytes; atomic audit stores its actual evidence bytes inline. No external file move/DB two-phase claim. |
| Preparation | Unchanged PEC-1B module/contracts | Preparation namespace is rejected; null formal clocks remain null. Event role labels map explicitly to the original nineteen-field contract. |
| Admission | Unchanged PEC-2 v2 | No trust export, activation route, source admission or scoring capability. |

INSPECTION_INPUTS.json pins the actual inspected files. DATABASE_BASELINE.json records the live read-only schema/counts. Prior PE1–PEC-1B seals and canonical source/mapping replay are verified read-only; old verifiers that rewrite receipts are not rerun.

## Implementation

`scripts/lib/pec1c_capture.py` implements IdentityAuthority and OperationExecutor server-composition contracts, fail-closed production_capture default, operation-specific permissions, exact request binding, producer separation, checked UTC/monotonic sampling, atomic capture, audit replay and exact formal-boundary resolution. `scripts/contracts/pec1c-audit.sql` supplies tested immutable schema/chain constraints. `scripts/test-pec1c-capture.py` uses only isolated SQLite and synthetic provider/executor fixtures.

There is no HTTP route, provider-specific authentication service, local users/roles table, default owner, approval registry, new runtime composition or production schema installation. Seven permissions are not inferred from the old three identity-port role labels. The Python capture boundary follows existing PEC-1B/PEC-2 offline tool conventions; no TypeScript RuntimeReviewerIdentity provider or Prisma bridge is asserted installed.

## Operational dependencies

A real provider integration must verify identity/session provenance, issuer/audience, cryptography/introspection and live revocation; an owner must assign exact role/operation/subject-version/scope grants. Real operation executors must validate their actual financial/governance preconditions and use the same application transaction. The SQL installation must be reviewed/integrated with the database migration/Prisma ownership workflow before live use. No live schema is applied while these prerequisites are absent.

Server UTC health, durable external audit/head retention, least-privilege database/filesystem access and backup/restore handling require operational configuration. Local wall/monotonic checks do not attest UTC accuracy or protect against a database administrator replacing an entire database. Production source approval/admission is still separately forbidden. Missing dependencies keep the public entrypoint blocked.
