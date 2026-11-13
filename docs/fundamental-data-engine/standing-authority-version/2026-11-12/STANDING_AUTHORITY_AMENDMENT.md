# Owner-approved standing authority per version

The owner explicitly approved replacing mandatory independent acceptance of every material bundle with **standing authority per version → automated source trust → per-observation validation → governed admission**. Exact quoted amendment and scope are retained in [OWNER_DECISION.txt](OWNER_DECISION.txt). Existing F1/F2 source-principle approvals remain unchanged and hash-bound in [VERSIONED_SOURCE_REGISTRY.json](VERSIONED_SOURCE_REGISTRY.json).

## Controlled amendment

Normal ingestion uses `VersionStandingAuthority`. `assertSourceMaterial` and `assertStandingTrust` delegate to its approved-version path; they do not require, mint or look up a per-material independent receipt on that path. Material/source hashes remain audit and identity data. Legacy `PinnedStandingRegistry` and independent-receipt contracts are retained for historical compatibility, not routine gates for an approved standing version. A standing-version validation failure cannot fall back to arbitrary approval flags or another material receipt.

The version registry binds provider origins, adapter/schema/normalizer/policy versions, approved source roles and exact implementation code hashes. The owner decision authorizes this initial implementation under the amended governance model; the record does **not** claim the owner personally inspected each code byte or granted independent material signoff/production release. Registry `recordedAt` is its actual recording time, not an invented owner-message timestamp.

Approved source/adapter scope is separate from qualified data. Trusted host composition supplies a fixed registry pointer and immutable capture/extraction catalog pins. Request URLs, file names, hashes, REVIEWED/PASS text or copies of authority JSON cannot supply host trust. Catalogs are controlled collector/extractor evidence, not a whitelist of independently approved material hashes. A new eligible observation or file alias can change its material hash without requiring another authority approval.

Code, schema, semantic policy, provider/role or normalization drift suspends affected admission and requires an explicitly authorized version change. Routine replay never regenerates registry hashes. `--initialize-authority` is an implementation bootstrap and refuses to overwrite an existing registry; it is not the normal ingestion command. Revocation or unavailable authority blocks new admission and consumption of earlier records.

## Preserved controls

- F1 retains CaféF `GiaDongCua` only, exact API/request/receipt/hash checks, decimal thousand-VND/share conversion, security identity, HOSE sessions, dated membership, freshness, immutable raw linkage and actual Capability/Market lifecycle replay. No adjusted fallback.
- F2 retains existing hybrid admission, qualified issuer/document semantics, exact native JSON/PDF lineage, dimensions, normalizer, conflicts and current-use Evidence time checks. Automated source verification and the original capture URL/receipt/catalog pointer are persisted with the admitted plan. A submitted PDF review witness alone cannot authorize a fact.
- Current formal evidence uses actual operational knowledge and never substitutes capture/import/review time for public publication. Historical PIT remains separate and rejected unless its own contracts are established.
- Raw, original receipts and conflicting inputs are preserved. Idempotent writes and append-only record revocation remain in the existing SQLite stores. No new database or schema migration is introduced here.

## Initial implementation revisions

The first isolated real-data run exposed the existing 4,000,000-character single-capture bound when a 4.35 MB PDF was base64 encoded. The bound was preserved: binary raw evidence now uses deterministic parts of at most 2,000,000 bytes, each with its own payload hash and the original whole-file hash. Consumption verifies ordered reconstruction. Existing single-capture rows stay readable.

The storage, integration and audit trials are retained unchanged as `initial-trial-registry-v1.json`, `integration-trial-registry-v2.json` and `audit-trial-registry-v3.json`. The final implementation binding is **owner-standing-authority-v4**, source authority entries version 4. These are initial development revisions within this explicitly authorized amendment, not new provider grants or claims of independent approval. Source roles, API/schema semantics and financial calculations were not expanded by the persistence/audit correction. Cross-snapshot conflict protection and explicit extraction-schema checks ensure a standing source cannot silently replace accepted values or enroll an unknown extractor format. The live database was never used by any trial.

## Scope limits

U2 remains a separate membership issue: retained certified coverage ends 16 October; nothing here admits a 30 October price by assumption. The real F1 demonstration uses 16 October only. The current F2 version demonstrates retained qualified financial-statement/direct-PDF `TOTAL_ASSETS` mappings; API financial source origins/roles remain eligible but their native observation adapter and other concepts/actions are not broadly qualified by this implementation. Unsupported facts quarantine rather than invent mappings.

VNM17 remains pending. R1/R4 remain closed; no dividend/share economic reconciliation, M3/M4 change, portfolio mutation or production activation is implied. **STOP for CIO review.**
