# Cross-source idempotency

Assessment: 2026-10-27 Asia/Ho_Chi_Minh. Owner authorizes Phase2.2 isolated implementation and targeted blocker investigation only. No Phase2.3, Current NAV implementation, production posting/migration or acceptance changes.

Stable economic key=(portfolio,accepted namespace,eventId,component) plus provider revision. It comes from trusted accepted source resolution, not ticker/amount/date or file hash. Same key+revision with identical normalized financial facts returns DUPLICATE even if transport transaction IDs, file, format, source row or notes differ. Metadata/source variants remain visible. Different content for the same revision returns NEEDS_REVIEW, not overwrite.

Normalization excludes only transport id,idempotencyKey,source and notes; all financial/time/type/linkage/method facts remain bound. Exact source acceptance independently binds the complete command and original record hash. Existing ledger transactions not registered by intake also need verified economic-identity resolution; unresolved legacy provenance blocks deduplication rather than assuming distinctness. Opening state is handled by the separate strict boundary gate.

SQL composite primary key and unique transaction ID supplement existing ledger unique keys, CAS, source uniqueness and Phase2.1 receipt ownership. Conflicting source revisions require explicit correction lineage. Same-file repeated/API/cross-file/cross-format replays cannot create another economic event. A duplicate within pending batch is reported separately; top-level postedCount is exact. Concurrent in-flight identical requests may receive CAS conflict; after winner commits, retry returns original posting reference without revision advance. No unlimited retries, silent success or lost updates.
