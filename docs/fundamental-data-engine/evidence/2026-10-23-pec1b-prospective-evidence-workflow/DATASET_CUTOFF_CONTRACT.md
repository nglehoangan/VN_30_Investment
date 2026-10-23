# Dataset version and cutoff contract

## Mandatory authenticated knowledge

| Boundary | Required authenticated event type |
|---|---|
| ingestedAt | FORMAL_INGESTION_COMPLETED |
| mappingKnownAt | FINANCIAL_MAPPING_ACCEPTED |
| methodologyKnownAt | METHODOLOGY_APPROVED |
| registryKnownAt | REGISTRY_VERSION_APPROVED |
| sourceContractKnownAt | SOURCE_CONTRACT_APPROVED |
| identityMethodKnownAt | IDENTITY_METHOD_APPROVED |
| sourceMethodKnownAt | SOURCE_METHOD_APPROVED |
| identityBindingKnownAt | IDENTITY_BINDING_APPROVED |
| policyKnownAt | METHODOLOGY_APPROVED |

Policy approval uses METHODOLOGY_APPROVED with the exact policy subject/version and hash, distinct from the financial methodology subject. The two cannot substitute merely because their event type matches. Identity/source method contracts and binding receipts must each match their own exact subject/hash. otherRequiredContractBoundaries must be an explicitly verified exhaustive list; null/unknown is incomplete, and an empty list requires authenticated contract evidence that no additional boundaries apply.

Each boundary resolves an authenticated immutable event, exact subject/version/scope/source/hash, evidence bytes, current invalidation status and knownAt. effectiveKnownAt = MAX(all mandatory verified boundaries, publication boundary, source/document retrieval and verification boundaries, every additional contract/correction boundary). PEC-2 CLOCKS remains authoritative for the full set: the nine formal mappings here supplement rather than replace its fourteen mandatory fields. Publication DATE_ONLY remains the approved conservative D2 boundary, not a fabricated publishedAt. Publication/retrieval proofs cannot stand in for formal ingestion/governance clocks.

If any event is missing, invalid, unknown, revoked or not authenticated, knowledgeChainStatus=INCOMPLETE, effectiveKnownAt=null, AS_KNOWN=false and production admission=false. assess_knowledge always returns this outcome because no authenticated event resolver is configured. No MAX over unauthenticated proposals is presented as effective knowledge.

## Deterministic dataset manifest

Required fields: datasetId, datasetVersion, sourceEvidenceReferences, financialMappingReferences, methodologyVersion, registryVersion, sourceAuthorityReferences, effectiveKnownAt, systemKnownAt, decisionAsOf, creationEventId, approvalEventId, datasetContentHash, immutableAuditReference.

References are sorted unique {id,hash} lists. Source/fact definitions, issuer, report period, statement/stock-flow/consolidation, units, variants, exact component versions and knowledge receipt belong inside the pinned referenced manifests. IDs are immutable; no latest-version resolution. Registry and methodology version identifiers must resolve to exact existing approved release hashes and their governance receipts. Empty sources/mappings/authority references are invalid for a formal dataset.

datasetContentHash = canonical SHA-256 of all fields EXCEPT datasetVersion, datasetContentHash, approvalEventId and immutableAuditReference. datasetVersion = sha256:<datasetContentHash>. Changing source/mapping/authority/version/cutoff/creation identity changes the hash. Approval attachments are excluded to avoid an approval/hash self-reference; exclusion does not exempt approval/audit verification. Attachments must be independently authenticated, rehashed and bound to the exact datasetContentHash, creation record and cutoff receipt.

creationEventId refers to the existing immutable fundamental_snapshot_run runId, namespaced snapshot-run:<runId>, plus its original committed body/hash/audit reference; this introduces no thirteenth generic event type. A run ID/builtAt alone is not an authenticated creation event. Trusted composition must verify the new execution and commit audit. approvalEventId resolves a separately authenticated DATASET_CUTOFF_APPROVED event. No such creation/approval is executed here.

## Cutoff ordering and non-circular approval

Require effectiveKnownAt <= systemKnownAt <= decisionAsOf <= trusted evaluation time, all exact constituent facts/events available by systemKnownAt, economic periods not after decisionAsOf, and unchanged publication/period semantics. The Dataset Owner chooses actual intended cutoffs with an audit receipt; the app must not fill them from now, report dates, candidate created_at or Git time. Null cutoffs fail.

The content cutoff describes evidence knowledge, not future governance approval availability. A cutoff approval can reference an already frozen content hash without being included in that same content's effectiveKnownAt. It can authorize review only at/after its actual knownAt; any downstream admitted analysis must additionally include approval and independent-acceptance availability under PEC-2 and have systemKnownAt at least that maximum. If that changes a cutoff, create a new dataset hash/version and revalidate; never overwrite the prior manifest or reuse a generic approval. Production use is unavailable in this implementation.

assess_dataset verifies manifest shape, canonical identity, sorted references, explicit cutoffs and temporal inequalities. It ALWAYS reports BLOCKED for absent authenticated creation/approval, even if callers claim COMPLETE knowledge. It is a preparation inspector, not a production dataset acceptance service.
