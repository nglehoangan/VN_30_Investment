# PEC-1B architecture and gap assessment

Status: **IMPLEMENTATION_READY_DEPENDENCY_BLOCKED**. Base commit `1c75914843fbbc30a362e5e311c1f3da5f7c4a55`.

## Inspected and reused infrastructure

ARCHITECTURE_INPUTS.json pins the exact source and every existing SQL migration. PRIOR_EVIDENCE_VERIFICATION.json rehashes PE1–PE4, PEC-1, PEC-2/final review and PEC-1A without rewriting their seals or execution receipts. DATABASE_BASELINE.json records a read-only schema and count inventory.

| Capability | Existing component | Reuse and remaining gap |
|---|---|---|
| Exact source/publication evidence | PE1/PE2 captures and receipts; PE3 authority proposals | Reference immutable bytes; do not reacquire sources or backfill formal clocks. |
| Mapping/perimeter | PE4 45 receipts, 51 operands and A–I assessments | Reuse exact scopes; none becomes accepted by this work. PEC-1A's 41 older mapping/bridge leads remain unaccepted. |
| Formal storage | PrismaFundamentals; fundamental_source_version/import_batch/raw_capture/observation/normalization | Existing transaction/FK/hash/identity rules and immutable triggers. No duplicate formal event store or migration introduced. A stored observation timestamp alone is not authenticated prospective capture. |
| Structured candidate storage | fundamental_admission_run | CURRENT_ANALYSIS-style candidate history; not a formal ingestion clock. No candidate relabeling. |
| Methodology | PrismaMethodologyRegistry and methodology_record | Append-only metadata, approved configuration hashes/external reference checks. Metadata validation is not external authentication. |
| Registry | canonical-registry.ts; verifyRegistryApproval | Exact release/hash/methodology binding; no new registry or approval table. |
| Knowledge | availability.ts, runtime-provenance.ts, PEC-2 v2 CLOCKS | Preserve operational maximum, D2 date-only semantics and cutoff gates. Legacy runtime-provenance requires TIMESTAMP publication; PEC-1B does not bypass it using DATE_ONLY or alter that gate. |
| Dataset identity | fundamental_snapshot_content/run/member and snapshot.ts | Reuse immutable manifests and run identities. Prospective cutoff contract below is a review artifact over these records, not a second dataset authority store. |
| Human review | RuntimeReviewerIdentity, HumanReviewStore, ReviewAssessment, AcceptRuntimeDataset | Reuse identity/CAS/review/producer distinction contracts. No concrete authenticated provider/store composition for PEC-1B was found. |
| Admission | scripts/lib/pec2_admission_v2.py | Unmodified. Offline adapter supplies empty trust and cannot emit qualified authority. |

## Implemented preparation boundary

`scripts/lib/pec1b_workflow.py` provides strict event intents, exclusive append of non-authoritative preparation artifacts with evidence-byte snapshots, idempotent retries, chain/integrity/order checks, knowledge/dataset/request denial, a PEC-2 empty-trust adapter and unconditional activation denial. It opens no production DB and installs no HTTP route, new identity provider, event/approval store, migration, registry entry or runtime composition.

The preparation workspace follows the existing filesystem evidence-package convention. Its JSON records are proposals and its `recordedAt` is a local preparation time. It is not an authenticated event log. Actual use in this change is restricted to temporary synthetic test directories; no candidate preparation events are emitted for the eight real sources.

## Gaps and release conditions

1. Authenticated subject/session resolver with verified owner/reviewer authority, independently controlled session/role revocation and exact operation/scope permissions. An injected test identity or request JSON cannot satisfy it.
2. Trusted capture composition to obtain execution clocks and commit evidence with existing formal repositories transactionally. Existing caller-supplied record metadata is not automatically trusted. Clock rollback, partial commit and duplicate races must fail closed.
3. Exact authenticated governance and producer-distinct acceptance linked to unchanged registry/method contracts; formal event resolver must verify original bytes, event chain and current invalidation state.
4. Authorized prospective dataset creation/cutoff review using genuine new events. All real source authorities, mapping/perimeter decisions and AS_KNOWN gates remain unsatisfied.

These are dependencies, not waived requirements. The user-authorized fallback is implemented; formal capture, authenticated boundary resolution, authoritative dataset approval and acceptance are deliberately unavailable. Authentication-provider integration requires a separately reviewed implementation and owner-governance decision, not a toggle on this preparation module.
