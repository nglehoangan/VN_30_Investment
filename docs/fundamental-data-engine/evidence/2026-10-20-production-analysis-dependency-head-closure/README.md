# Production Analysis Dependency Head Closure

Read [FINAL_REVIEW.md](FINAL_REVIEW.md), then [BOOTSTRAP_HEADS.json](BOOTSTRAP_HEADS.json) and [OPEN_ISSUES.json](OPEN_ISSUES.json).

Registry/resolution/publication capabilities are implemented and validated. Production bootstrap remains BLOCKED until explicit accepted Policy, Scoring Model and Risk Policy bindings, plus compatibility with the known approved Decision Engine, are provided. No version is fabricated and no latest-version selection is used. Data Initialization vNext remains the Owner-accepted baseline; this task does not reopen DI14/DI15.

The registry stores append-only complete releases and immutable target ID/hash identities. It reuses `market_boundary_dependency_head` as the CAS projection. Accepted legacy boundary objects and the release/projection become visible in one transaction. `production_dependency_publication` atomically binds a validated legacy Analysis/Decision record to its authoritative release. Legacy snapshot contracts and historical evidence are unchanged.

`ProductionDependencies` resolves production heads internally. Its only analysis inputs are purpose/as-of. Historical replay is a separate internal method with PIT checks and no publication authority. Staged lifecycle validation performs no persistence; the registry transaction owns final record/seal/binding writes and rechecks head, deadline and live ledger revision.

`LocalAcceptedDependencyCatalog` reads fixed SHA-pinned authority receipts. Bootstrap is anchored to the exact sealed accepted initialization-review binding, not a mutable technical candidate pointer. An explicitly approved complete replacement set may supersede bootstrap defaults. Duplicate authority bindings, invalid hashes, unsupported combinations and missing model/compatibility requirements fail closed. Existing accepted-artifact producers must activate a complete compatible release with CAS before it becomes production-current. Root source/catalog changes and live ledger drift also block old resolutions. No client-facing head mutation or replay-mode endpoint is introduced.

Decision1.0.2 is selected by the existing FORMAL `MONOTONIC_METHOD` guard and verified against its immutable registry metadata. Scoring implementation identity is separately owned by Scoring Model; it is not conflated with Decision engine identity. The model/policy/risk production bindings and compatibility receipts are not inferred.

Default FORMAL guards remain denied. No source fetch, production bootstrap/migration, accounting mutation, scoring/ranking, recommendation or investment decision is performed. Synthetic fixtures validate rejection/atomicity only.

`build-evidence.mjs` verifies retained source and all30 canonical bodies/content/facts/derived hashes against the accepted closure. `verify-migration.py` validates fresh and populated disposable DBs, then deletes the copies. Raw corpora and database copies are not archived here.

The single scoped commit containing this package is the ending implementation HEAD. Its literal SHA is returned in the final response; FINAL_REVIEW uses a resolvable commit reference to avoid a self-referential commit hash. ARTIFACT_HASHES pins the evidence overlay and changed source/test/migration files, not approval.
