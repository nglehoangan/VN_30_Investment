# Independent acceptance workflow

## Validation request and assignment

Prepare requestId plus candidateId, sourceEvidenceHash, financialMappingHashes, methodologyVersion, registryVersion, knowledgeChainHash, datasetVersion, datasetContentHash, cutoffReceiptHash, all producerIds, assignedReviewerId, result, revoked and revalidationRequired. Each hash must resolve through a sealed evidence manifest. The scope also resolves exact issuer/report/fact/period/consolidation/statement dimensions through that manifest. An independently resolved expected scope is compared in full; no caller may choose the trusted expected scope in a future authenticated composition.

Assign a named authenticated Independent Validator with capability for this exact scope. The validator cannot be any evidence, mapping or dataset producer and cannot be Codex. The existing RuntimeReviewerIdentity/HumanReviewStore/ReviewAssessment contracts are reused; their test implementations and role-name strings are not identity verification. New permission mapping remains blocked.

## Execution and immutable disposition

The validator rehashes source and evidence bytes, reviews captions, populations, units and normalization, checks exact methodology/registry/authority scope, actual knowledge events/cutoffs and every applicable PE4 A–I criterion. Persist actual ACCEPT or REJECT decision through the existing append-only review/CAS mechanism with exact expected head and authenticated subject/session/permission evidence, operation times, reviewed dataset/cutoff hash, predecessor hash, and receipt bytes/hash. Reject is not acceptance; a PENDING or analyst DRAFT cannot become independent acceptance by renaming it.

INDEPENDENT_VALIDATION_ACCEPTED is emitted only after the real accepted review transaction and authenticated capture commit. Rejection and invalidation remain existing review workflow records rather than adding unneeded generic event types. ImmutableValidationReceipt contains request/scope hashes, exact candidate/source/mapping/methodology/registry/knowledge/dataset/cutoff references, producer and reviewer identities, verified auth/audit reference, actual execution/recording/knownAt, result and previous review hash. No acceptance receipt is created for real candidates in PEC-1B.

## Revocation and revalidation

Any source/evidence change, corrected amount/mapping, period/scope/definition/perimeter change, method/registry/authority version change, knowledge-boundary correction, changed dataset/cutoff, reviewer permission invalidation or expired verification requires revalidation against a new exact scope/hash. Rejected/invalidated/revoked acceptance cannot be revived by omission from a newer snapshot. Fail closed on unknown/stale revocation or review history. Reuse existing review INVALIDATED transitions and current PEC-2 revocation/history contracts; do not edit old receipts.

assess_independent_request checks exact scope binding, producer distinction and rejection/revalidation/revocation flags, but ALWAYS returns accepted=false and AUTHENTICATED_INDEPENDENT_ACCEPTANCE_UNAVAILABLE. A structurally valid preparation, generic approval, existing CASA policy sign-off or source publication proof cannot authorize any dataset. Final source owner approval and effective production admission are separate later decisions, neither executed here.
