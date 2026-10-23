"""PEC-1C documentation and immutable safety baseline; no production writes."""
import importlib.util
import json
import subprocess
from pathlib import Path
from lib.pe4_evidence import sha, verify_seal, replay_package
ROOT=Path(__file__).resolve().parents[1];E=ROOT/'docs/fundamental-data-engine/evidence';OUT=E/'2026-10-23-pec1c-authenticated-trusted-capture'

def save(n,x):(OUT/n).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def md(n,t):(OUT/n).write_text(t.strip()+'\n')

def main():
 if (OUT/'PROTECTED_INPUT_HASHES.json').exists():raise SystemExit('Refuse baseline overwrite.')
 OUT.mkdir(exist_ok=True);(OUT/'validation').mkdir(exist_ok=True)
 spec=importlib.util.spec_from_file_location('pec1b_readonly_helpers',ROOT/'scripts/prepare-pec1b-evidence.py');helpers=importlib.util.module_from_spec(spec);spec.loader.exec_module(helpers);helpers.OUT=OUT
 save('PROTECTED_INPUT_HASHES.json',helpers.baseline());save('DATABASE_BASELINE.json',helpers.database())
 names=['2026-10-21-primary-publication-evidence-pe1','2026-10-22-primary-publication-evidence-pe2','2026-10-22-primary-publication-evidence-pe3','2026-10-22-primary-publication-evidence-pe4','2026-10-22-production-evidence-closure-pec1','2026-10-23-production-evidence-closure-pec2','2026-10-23-pec2-final-implementation-review','2026-10-23-pec1a-authenticated-source-authority-decision','2026-10-23-pec1b-prospective-evidence-workflow']
 save('PRIOR_EVIDENCE_VERIFICATION.json',{'seals':[verify_seal(ROOT,E/n) for n in names],'PE4Replay':replay_package(ROOT)})
 inputs=['src/ports/runtime-readiness.ts','src/application/fundamentals/review-assessment.ts','src/application/fundamentals/accept-runtime-dataset.ts','src/infrastructure/repositories/file-human-reviews.ts','src/infrastructure/repositories/workflow-artifacts.ts','src/infrastructure/repositories/fundamentals.ts','src/infrastructure/repositories/methodology-registry.ts','src/domain/fundamentals/runtime-provenance.ts','src/domain/fundamentals/runtime-review.ts','scripts/lib/pec1b_workflow.py','scripts/lib/pec2_admission_v2.py','prisma/schema.prisma','prisma/migrations/202610010002_workflow_artifacts/migration.sql','prisma/migrations/202610080002_fundamental_foundation/migration.sql']
 save('INSPECTION_INPUTS.json',{'baseCommit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'files':[{'path':p,'sha256':sha(ROOT/p)} for p in inputs],'authenticationFinding':'Only identity interfaces/test implementations located for this workflow; no configured real provider, issuer/audience, verified session resolver or seven-role binding. No external identity system is claimed inspected.','schemaInstallation':'scripts/contracts/pec1c-audit.sql tested ONLY on isolated SQLite. No production migration, Prisma model or live schema change executed.'})
 md('PEC1C_ARCHITECTURE.md','''# PEC-1C architecture

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
''')
 md('AUTHENTICATION_INTEGRATION.md','''# Authentication integration

## Concrete fail-closed integration boundary

No existing configured trusted provider was found. Per the requested fallback, production_capture(database) creates an unconfigured TrustedCapture which rejects every capture/replay with BLOCKED_TRUSTED_PROVIDER_AND_EXECUTOR_NOT_CONFIGURED. It discovers no implicit credentials and creates no identity. IdentityAuthority and OperationExecutor may only be injected by independently reviewed SERVER composition, never request JSON or a client-selected implementation.

IdentityAuthority.resolve(opaque credential) must independently verify the provider's signature/introspection, issuer/audience, authentication assurance, session ID, subject and authentication audit evidence. It returns VerifiedSession(subject, session_reference, issuer, audience, authenticated_at, expires_at, audit_reference). Capture enforces nonempty provenance, UTC ordering, expiry and exclusion of Codex/AI Portfolio Manager impersonation. Raw credentials are never persisted.

IdentityAuthority.authorize(session, exact request, actual sampled time) must recheck session/subject and role revocations, role expiry and exact operation/subject-version/source/scope/event binding against current server-controlled grants. Its proof has subject, sessionReference, issuer, audience, permission, requestBinding, grantedAt, validThrough, authenticationReference and auditReference. The boundary checks every identity/binding/time field. It does not treat an authentication-reference string or an injected dictionary as proof; trust resides in the separately configured real adapter and independently retained provider audit.

IdentityAuthority.authorize_saved(proof, original request, current time) must verify the original immutable provider audit/signature/reference matches ALL proof fields and original decision time, and independently check current session/subject/role/decision invalidation and scope. It must fail on missing/stale/unknown revocation. Original session expiry does not fabricate historical knowledge or erase a past event; whether its durable decision remains valid is resolved by the provider's current explicit decision policy. A new capture always requires a presently unexpired session. A revoked saved decision denies qualifying replay and any further extension; it is never silently omitted or re-approved.

## Required external configuration

- Approved actual issuer/provider, exact audience, verification keys or introspection configuration, secure credential transport and operational authentication assurance. None is configured here.
- Current revocation/role/grant resolver and immutable audit evidence retention. Do not use client roles, unchecked JWT contents, generic OWNER strings or fixture identities.
- Named subject assignments for all seven exact permissions and scope-limited operations, plus independent reviewer/producer records. No assignment is invented by this package.
- Reviewed adapter/composition and trusted executors bound to existing formal transactions. This Python boundary does not automatically implement the existing TypeScript identity port.
- Healthy server clock and database access/migration ownership, external audit anchoring and deployment configuration.

Only FixtureIdentity inside the test file implements positive synthetic authentication; it is never imported by implementation or configured in production. No mock identity is reported as operational readiness. No new external service, fake provider or hardcoded administrator is introduced.
''')
 md('AUTHORIZATION_POLICY.md','''# Authorization policy

| Operation | Required exact permission |
|---|---|
| SOURCE_ACQUIRED, SOURCE_VERIFIED, FORMAL_INGESTION_COMPLETED, IDENTITY_BINDING_APPROVED | DATA_EVIDENCE_REVIEWER |
| FINANCIAL_MAPPING_ACCEPTED | DATA_QUALITY_OWNER |
| METHODOLOGY_APPROVED, IDENTITY_METHOD_APPROVED, SOURCE_METHOD_APPROVED | METHODOLOGY_OWNER |
| REGISTRY_VERSION_APPROVED | REGISTRY_OWNER |
| DATASET_CUTOFF_APPROVED | DATASET_OWNER |
| INDEPENDENT_VALIDATION_ACCEPTED | INDEPENDENT_VALIDATOR |
| SOURCE_CONTRACT_APPROVED | INVESTMENT_SYSTEM_OWNER |

The request contains exactly eventId/eventType/subjectId/subjectVersion/sourceEvidenceHash/scopeHash/expectedPreviousEventHash/operationReference. It contains no actor, roles, producer IDs or timestamp. The provider must bind a grant to the full canonical request hash; scopeHash resolves an immutable exact issuer/period/consolidation/statement/metric/dataset/version manifest in the trusted executor. An unrestricted wildcard, latest version, different dataset or generic owner approval cannot satisfy that exact binding.

All non-acquisition verification/approval/acceptance operations require actor distinct from every producer discovered by the trusted executor from authoritative provenance. The request cannot choose its producer list. This includes the independent validator and an owner approving their own source-contract evidence. Acquisition is an execution event, not independent acceptance. Codex/AI Portfolio Manager cannot act as an owner/reviewer. No owner source authority or production approval is manufactured by this infrastructure.

Authorization is checked before opening the transaction, again after acquiring the write lock (avoiding stale pre-lock decisions) and immediately before audit insertion after actual execution. Session expiry or role/session revocation during execution aborts and rolls back same-transaction work. Provider failures deny operation. The decision is linearized at the final authorization boundary; no distributed atomicity between a remote identity provider and SQLite commit is claimed. A real adapter must provide appropriately short-lived exact-operation decision evidence and current revocation semantics; operational configuration remains blocked.

Permissions use the seven uppercase names required by PEC-1C. The event's actorRole uses the existing PEC-1B human-readable role label; stored authorization.permission retains the uppercase permission. This mapping is explicit and does not grant any role to a real person or translate all existing OWNER/ANALYST claims into these permissions.
''')
 md('TRUSTED_EVENT_CAPTURE.md','''# Trusted event capture

## Capture boundary

No client clock fields are accepted. CheckedClock samples server UTC and monotonic_ns, detects rollback or divergence greater than two seconds between consecutive samples and requires canonical UTC microsecond timestamps. The capture transaction also checks persisted recordedAt values to reject rollback after a service restart. Capture re-samples after acquiring BEGIN IMMEDIATE; a pre-lock timestamp is not used to evaluate records committed while waiting.

occurredAt is observed at completion of the trusted operation executor; recordedAt is sampled at the audit-insertion decision boundary within the same transaction; effectiveAt equals occurredAt for this minimal prospective contract; knownAt equals recordedAt. These are distinct fields with distinct meanings even when the minimal applicability/recording values coincide. Future-effective or historically effective governance is NOT accepted through caller parameters. recordedAt is the actual pre-insert boundary sample, not a falsely claimed post-fsync commit timestamp. The immutable transaction reference links the whole committed unit.

All times satisfy operation-start <= occurredAt <= recordedAt/knownAt, authorization validity and nondecreasing persisted order. No wall-clock value establishes an old report's availability, nor is Git time/candidate created_at/preparation recordedAt an ingestion clock. Time health/UTC synchronization and monotonic continuity across process/host restarts require operational configuration; the local detector is not NTP attestation. Unknown external clock trust leaves production composition unavailable.

## Execution and evidence

Only a server-configured OperationExecutor can execute the exact authorized operation. It receives the SAME SQLite transaction and full request; it must validate source/method/registry/mapping/dataset preconditions and discover all actual producers. Its exact result is requestBinding/evidenceBytes/producerIds/executionReference. Source bytes must hash to sourceEvidenceHash. The audit operation receipt binds the original request, producer identities, actual execution reference, byte hash and authorization hash. event.evidenceHash hashes this receipt, separately from original sourceEvidenceHash.

For source verification/ingestion/mapping, same-stream acquisition/verification/ingestion prerequisites must already exist. Streams are exact subject/version/source/scope hashes. Client-supplied history, old preparation namespaces, unknown predecessors, forks, time rollback, modified bytes or changed retries fail closed. Old PEC-1A candidates are never automatically executed or upgraded.

A real executor is NOT implemented/configured here: generic infrastructure cannot assert that wrapping old bytes performed acquisition, formal ingestion or a legitimate owner decision. External irreversible IO cannot be claimed atomic with SQLite. Executors must not commit/rollback independently or write a separate database; such adapters are unsupported pending explicit transactional integration review.
''')
 md('ATOMIC_AUDIT_PERSISTENCE.md','''# Atomic audit persistence

## Minimal schema and transaction

scripts/contracts/pec1c-audit.sql defines formal_knowledge_audit, an additive installation contract tested only on isolated SQLite. Existing workflow_audit is portfolio-review-specific, so no fake workflow/ledger records are created. There is no second user/role/approval registry. No production migration, schema/model change or installation is executed.

One row atomically stores event ID/hash/stream, original request hash, previous hash, UTC recordedAt, unique transaction reference, exact event JSON, authorization proof JSON, operation receipt JSON, original evidence BLOB and canonical row hash. SQLite BEGIN IMMEDIATE serializes writers; foreign_keys=ON, synchronous=FULL, PK/unique constraints and no-update/no-delete/no-replace triggers apply. A unique stream/COALESCE(previous,GENESIS) index prevents branches and duplicate genesis. The predecessor trigger requires same stream and nondecreasing time. Capture requires current exact head CAS. It checks the complete expected schema/trigger definitions before proceeding and denies if immutability guards are missing/changed.

The trusted executor's same-transaction business writes and audit insertion commit together. Any exception, authorization loss, changed evidence, invalid chain or clock rollback rolls them back. Tests inject failure AFTER a business insert and verify both tables remain unchanged. No externally persisted file/DB two-phase protocol is asserted: evidence bytes are inline in the same committed row. The transaction reference is a generated audit ID bound into rowHash, not a fabricated SQLite engine transaction number or separate provider attestation.

Identical authenticated retry by the same actor replays and rechecks original authorization, then returns the original immutable event without executing twice. Changed request/actor conflicts. Concurrent identical requests produce one event; competing requests at the same valid head yield one commit and one stale-head denial. Unknown/busy/failed commits fail rather than overwriting. Read replay occurs in a consistent SQLite snapshot.

## Replay and limitations

Rehash original source bytes, operation receipt, authorization binding, event canonical JSON (all nineteen fields except eventHash) and full row envelope. Validate indexed columns against body, exact request/scope/source, chain, time ordering, producer separation and current provider invalidation for EVERY prior row. A revoked prior decision blocks qualifying replay/extension; no silent omission or latest-wins reactivation. Rejected history is not rewritten. There is no endpoint to mutate an event.

SQLite triggers and hashes protect normal application use; a privileged filesystem/database administrator can replace a whole database, remove rows after dropping guards, restore an older valid prefix or recompute unsigned hashes. A hash chain is not authentication, external WORM, durable provider proof or rollback protection. Real deployment requires restricted database access, independently retained provider audit and externally anchored audit heads/backup governance. Those guarantees are unconfigured; this package claims no production-grade immutable authority against an administrative adversary. Production remains dependency-blocked.
''')
 md('PEC1B_INTEGRATION.md','''# PEC-1B and PEC-2 integration

TrustedCapture emits the original nineteen-field PEC-1B formal event representation, with canonical hashes, canonical UTC instants, the original human-readable role labels and AUTHENTICATED_VALIDATED only after server-provider/executor checks. The uppercase authorization permission remains separately bound. The exact provider proof and operation receipt live in the same atomic audit row.

formal_boundary(eventId, field, subject_id, subject_version, scope_hash, source_hash) performs verified replay with current revocation, requires the exact event type for the requested PEC-1B boundary and exact subject/version/source/scope binding, then returns knownAt plus event/row/audit references. It never infers all knowledge from one event type. policyKnownAt and methodologyKnownAt both use METHODOLOGY_APPROVED but must name their DIFFERENT correct subject/version/hash. All required boundaries, publication/retrieval/correction evidence and actual cutoffs are still required for a complete chain. The resolver checks a single exact boundary and grants no AS_KNOWN eligibility or admission.

With the default unconfigured provider/executor, capture/replay/boundary resolution all fail closed. Existing PEC-1B assess_knowledge stays INCOMPLETE and its capture_formal_event remains denied; existing preparation files/timestamps are never rewritten. The prep event namespace is explicitly rejected by new capture, and every replayed row must satisfy the formal rather than preparation schema. No real candidate event, method/registry approval or owner source approval is emitted.

PEC-2 v2 and its mandatory gates are unchanged. No new event populates a real evidence core, trust map, owner/mapping/independent receipt, revocation/history snapshot, admission event or runtime selector. Existing empty-trust adapter is retained and replayed against all eight original candidates. Future integration requires authentic component governance, qualified event/lineage resolution, full knowledge MAX/cutoffs, exact core-bound acceptance and owner authority plus a separately authenticated admission event; none is supplied by this capture infrastructure alone. No D2 or scoring activation exists here.
''')
 md('SECURITY_VALIDATION_CASES.md','''# Security and database validation

Command: `PYTHONDONTWRITEBYTECODE=1 python3 scripts/test-pec1c-capture.py --json <package>/validation/security-tests.json`.

Tests 01–18 correspond directly to all eighteen requested cases: authenticated actor (synthetic only), missing authentication, expired session, revoked session, revoked role, denied operation, denied exact dataset scope, producer self-approval, caller historical timestamp, duplicate, concurrent duplicate, modified evidence, invalid chain, partial transaction failure, clock rollback, unauthorized owner operation, PEC-2 admission denial and scoring activation denial.

Additional tests cover SQL UPDATE/DELETE/REPLACE denial, missing immutability guard, revocation on saved replay, preparation namespace rejection, exact boundary resolution, UTC/monotonic divergence, grant scope substitution, expiry during execution, one-winner concurrent head CAS, corrupted stored BLOB with restored schema, PEC-1B event field/role compatibility, subject revocation and role revocation immediately after business writes with rollback. All production-provider and executor implementations remain external dependencies.

FixtureIdentity/FixtureExecutor/FixtureClock exist ONLY in the test file. Every database is TemporaryDirectory synthetic SQLite; no real identities, approvals, financial observations or production authority stores are written. Positive authentication and formal-event tests demonstrate the integration contract using fixtures, not operationally configured provider readiness. Partial transaction tests cover same-connection SQLite writes; external IO/distributed commits, power loss and live provider deployment are not claimed tested.

The first 27-case run found stale pre-lock replay time and fixture concurrency/diagnostic issues. Capture now re-samples and reauthorizes inside BEGIN IMMEDIATE; a synchronized fixture clock and an actual competing-head test preserve the gates. initial-security-failure.json records the initial nonzero result and resolution. Subsequent tests also verify schema tampering and producer/scope/role compatibility.

Regression commands: `PYTHONDONTWRITEBYTECODE=1 python3 scripts/test-pec1b-workflow.py --json <package>/validation/pec1b-regressions.json` (25); `PYTHONDONTWRITEBYTECODE=1 python3 scripts/test-pec2-final-review.py --json <package>/validation/pec2-regressions.json` (62). Architecture: `/private/tmp/node-v22.23.2-darwin-arm64/bin/node scripts/check-boundaries.mjs`. Actual commands/exits/counts and read-only production safety replay are in VALIDATION_RESULTS.json and validation/.
''')
 save('BLOCKER_STATUS.json',{'status':'IMPLEMENTATION_READY_DEPENDENCY_BLOCKED','implementedAndTested':['Provider-neutral authenticated capture/permission contracts','Exact operation/source/subject/version/scope authorization checks','Session expiry, current revocation hooks and producer distinction','UTC/monotonic/persisted-clock guards','Atomic inline audit/evidence/operation transaction and replay','Database immutability schema/chain/CAS constraints','PEC-1B field/role/typed boundary compatibility','No automatic PEC-2 trust/admission/runtime connection'],'implementedNotOperationallyConfigured':['Real IdentityAuthority adapter/composition','Real OperationExecutor over existing financial/governance repositories','SQL schema installation/migration ownership and any Prisma bridge','Server clock health and independently anchored audit retention'],'blockers':[{'id':'PEC1B_AUTHENTICATED_IDENTITY','status':'BLOCKED_EXTERNAL_CONFIGURATION','role':'Investment System Owner + identity/security administrator','requiredAction':'Select/verify real provider issuer/audience, secure session verification, exact seven-role assignments, live role/session/subject revocation and immutable authentication audit; configure reviewed server adapter. Do not use fixtures.'},{'id':'PEC1B_TRUSTED_CAPTURE_AND_ATOMIC_LINEAGE','status':'IMPLEMENTED_TESTED_OPERATIONALLY_BLOCKED','role':'Database/data infrastructure owner + audit engineer','requiredAction':'Review/install additive schema through actual DB ownership workflow and configure real same-transaction operation executors, healthy clock and external durable audit/head controls. No live migration or business event executed here.'}],'inheritedSourceAndDatasetBlockersRemain':['PE3_EXACT_SOURCE_AUTHORITY','PE3_FORMAL_KNOWLEDGE','PE3_ACTUAL_DATASET_CUTOFFS','PE3_ECONOMIC_PERIMETER_LIMITATIONS','PE3_INDEPENDENT_ACCEPTANCE_AND_D2_ACTIVATION','MINIMUM_DATASET_OUTSIDE_PE4_REVIEW_SCOPE'],'realAuthenticatedEventsCreated':0,'ownerSourceApprovalsCreated':0,'effectiveAdmissions':0,'D2Activated':False,'productionScoringActivated':False,'PEC1DStarted':False,'PEC3Started':False})
 md('CLOSURE_REPORT.md','''# PEC-1C closure report

**Final status: IMPLEMENTATION_READY_DEPENDENCY_BLOCKED. PEC-1C is not approved.**

Implemented provider-neutral authenticated capture and authorization boundaries, checked server timestamps, exact producer/scope binding, atomic SQLite persistence/replay, immutable schema guards, duplicate/concurrency handling and typed PEC-1B formal-boundary resolution. The production factory has no provider/executor and fails closed. No mock authentication is presented as production readiness.

## Readiness distinction

- Implemented and tested: exact request/grant checks, expiry/revocation hooks, producer distinction, sampled UTC/monotonic/persisted ordering, SQLite same-transaction rollback, evidence/hash/chain replay, current invalidation checks, CAS duplicates and PEC-1B compatibility.
- Implemented but not operationally configured: provider adapter boundary, actual operation-executor composition, SQL schema installation/migration ownership, authenticated timestamp/audit provenance deployment. SQL was executed only in isolated tests, not production.
- External dependencies: real trusted provider and grants/revocation/audit verification; reviewed financial/governance executors and DB installation; healthy server UTC and external audit anchoring/backup governance. Identity interfaces/hashes alone do not resolve these.

## Validation and safety

See VALIDATION_RESULTS.json for exact commands/results and SECURITY_VALIDATION_CASES.md for all requested cases. Positive cases use synthetic providers/actors and temporary SQLite only. Initial stale pre-lock clock behavior was found and corrected without weakening temporal checks; its original failed result is retained. No source bytes are acquired externally, no old preparation timestamp is upgraded, and no source owner approval, effective admission, D2 activation or scoring activation is produced.

All nine prior PE1–PEC-1B package seals and implementation pins are rehashed read-only. A protected-input baseline and read-only database bytes/logical dump/row-count comparison verify unchanged frozen policy, approvals and financial data. Original eight source candidates are replayed through unchanged empty-trust PEC-2 and remain DEFERRED. No existing source/runtime code or schema is changed. No PEC-1D or PEC-3 work is started.

## Deliverables

- [Architecture](PEC1C_ARCHITECTURE.md)
- [Authentication integration](AUTHENTICATION_INTEGRATION.md)
- [Authorization policy](AUTHORIZATION_POLICY.md)
- [Trusted timestamp and execution capture](TRUSTED_EVENT_CAPTURE.md)
- [Atomic audit persistence](ATOMIC_AUDIT_PERSISTENCE.md)
- [PEC-1B integration](PEC1B_INTEGRATION.md)
- [Security validation cases](SECURITY_VALIDATION_CASES.md)
- [Validation results](VALIDATION_RESULTS.json)
- [Blocker status and required actions](BLOCKER_STATUS.json)

Implementation: scripts/lib/pec1c_capture.py, scripts/contracts/pec1c-audit.sql and scripts/test-pec1c-capture.py. Evidence builder and read-only safety verifier are also within PEC-1C scope. A SHA-256 package seal proves integrity only, not authentication, owner approval or independent human acceptance. Stop after PEC-1C.
''')
 print('PEC-1C architecture, contracts and protected baseline prepared; no production mutation.')

if __name__=='__main__':main()
