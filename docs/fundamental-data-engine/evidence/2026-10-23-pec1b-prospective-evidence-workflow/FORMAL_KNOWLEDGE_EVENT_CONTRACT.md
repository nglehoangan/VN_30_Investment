# Formal knowledge event contract

## Future authoritative contract

`FORMAL_KNOWLEDGE_EVENT.schema.json` defines all nineteen requested fields with no extra fields. It is a design/schema, not an authentication provider. No formal event conforming to its AUTHENTICATED_VALIDATED state is generated in PEC-1B.

| Field | Meaning and verification |
|---|---|
| eventId | Unique immutable operation ID allocated by the trusted composition; never reused on a changed submission. |
| eventType | One of the twelve types below. No extra event types introduced. |
| subjectId / subjectVersion | Exact immutable source/mapping/contract/registry/dataset subject; never latest-version lookup. |
| sourceEvidenceHash | Original source-byte digest, distinct from the operation-receipt digest. |
| actorId / actorRole | Verified session subject and operation permission resolved server-side; never copied from request claims. |
| authenticationReference | Immutable authentication/audit evidence reference and verification outcome; a string/hash alone is insufficient. |
| occurredAt | Actual execution/decision completion observed at the trusted boundary. Historical report/publication dates never substitute. |
| recordedAt | Actual append/commit timestamp generated at the trusted capture boundary, never a caller parameter. |
| effectiveAt | Actual authorized prospective applicability boundary. It does not backdate system knowledge. |
| knownAt | Conservative maximum of occurredAt, recordedAt, effectiveAt, authentication-verification availability and required predecessor knownAt values. |
| evidenceReference / evidenceHash | Immutable operation receipt bytes (including exact scope, producer identities, dependencies and source bindings) and SHA-256 of those bytes. |
| previousEventHash | Exact predecessor in the subject/version capture chain, null only at an authorized genesis. Causal dependency hashes are additionally pinned in the receipt. |
| eventHash | SHA-256 of canonical JSON of every field except eventHash; sorted keys, compact UTF-8, no NaN, native financial amounts preserved as strings. |
| validationStatus | AUTHENTICATED_VALIDATED only after identity, permissions, bytes, scope, time and chain checks. No caller can assert this state. |

## Event permissions

| Event type | Proposed exact permission role |
|---|---|
| SOURCE_ACQUIRED | Data Evidence Reviewer |
| SOURCE_VERIFIED | Data Evidence Reviewer |
| FORMAL_INGESTION_COMPLETED | Data Evidence Reviewer |
| FINANCIAL_MAPPING_ACCEPTED | Data Quality Owner |
| METHODOLOGY_APPROVED | Methodology Owner |
| REGISTRY_VERSION_APPROVED | Registry Owner |
| SOURCE_CONTRACT_APPROVED | Investment System Owner |
| IDENTITY_METHOD_APPROVED | Methodology Owner |
| SOURCE_METHOD_APPROVED | Methodology Owner |
| IDENTITY_BINDING_APPROVED | Data Evidence Reviewer |
| INDEPENDENT_VALIDATION_ACCEPTED | Independent Validator |
| DATASET_CUTOFF_APPROVED | Dataset Owner |

These seven role permissions are a proposed governance contract, not configured identity grants. The existing identity port exposes ANALYST, OWNER and INDEPENDENT_DATASET_REVIEWER only. Do not infer that OWNER holds every new permission or that ANALYST can approve mappings/methods. Reuse the port only after independently configured subject-to-permission bindings and authentication verification. Ingestion execution service identity may be delegated only by an explicit reviewed capability bound to the exact source and operation; it is not the independent reviewer.

Financial Mapping Accepted and Independent Validation Accepted require actor distinct from every producer of the evidence being accepted. An Independent Validator must also differ from the mapping producer, dataset producer and scope-specific author. Codex cannot be an owner or independent human reviewer. Authentication/session/permission revocation is checked on each decision and consumption.

## Preparation representation implemented now

The intent contains submissionId, eventType, exact subject/version, source and operation evidence hashes, claimed actor/role/authentication reference, all producer IDs, scopeHash and causal predecessor hashes. Extra fields, including caller recordedAt/knownAt/effectiveAt/occurredAt, are rejected. Claimed roles are checked for consistency only; claimed references never become trusted identity.

A preparation artifact contains all nineteen event keys. occurredAt, effectiveAt and knownAt are null; recordedAt comes from the local preparation operation; validationStatus is PREPARED_NON_AUTHORITATIVE. Its deterministic preparation eventHash covers the exact event object (excluding eventHash) PLUS the wrapper intentHash, so scope/dependency/producer changes invalidate it. The future authenticated event uses its separate event-only formula because its immutable operation receipt must itself bind those dimensions. The artifact wrapper and intentHash bind scope, dependencies and producer claims. eventId is namespaced pec1b-preparation-sha256, never a formal-event ID. It cannot satisfy the future schema, formal knowledge, source authority or PEC-2 trust.

## Temporal and integrity rejection rules

Require actual occurredAt <= recordedAt, effectiveAt >= occurredAt for this prospective workflow, knownAt >= all mandatory causal/authentication/applicability boundaries, and all observable event timestamps <= the trusted evaluation time before use. Future-effective decisions remain unavailable until then. Clock rollback, unauthenticated clocks, unknown dependency lists, missing causal predecessors, forks, reused identities with changed content, altered evidence, missing subject/version/scope or invalidated authority deny qualification. New evidence/version requires a new event; never update/delete an accepted event. Current revocation/invalidations are separate append-only governance records using existing review/history infrastructure; omission from a later snapshot does not un-revoke a record.
