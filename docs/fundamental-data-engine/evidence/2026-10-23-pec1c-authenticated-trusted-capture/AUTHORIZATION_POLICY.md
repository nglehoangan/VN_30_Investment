# Authorization policy

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
