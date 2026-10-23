# Atomic audit persistence

## Minimal schema and transaction

scripts/contracts/pec1c-audit.sql defines formal_knowledge_audit, an additive installation contract tested only on isolated SQLite. Existing workflow_audit is portfolio-review-specific, so no fake workflow/ledger records are created. There is no second user/role/approval registry. No production migration, schema/model change or installation is executed.

One row atomically stores event ID/hash/stream, original request hash, previous hash, UTC recordedAt, unique transaction reference, exact event JSON, authorization proof JSON, operation receipt JSON, original evidence BLOB and canonical row hash. SQLite BEGIN IMMEDIATE serializes writers; foreign_keys=ON, synchronous=FULL, PK/unique constraints and no-update/no-delete/no-replace triggers apply. A unique stream/COALESCE(previous,GENESIS) index prevents branches and duplicate genesis. The predecessor trigger requires same stream and nondecreasing time. Capture requires current exact head CAS. It checks the complete expected schema/trigger definitions before proceeding and denies if immutability guards are missing/changed.

The trusted executor's same-transaction business writes and audit insertion commit together. Any exception, authorization loss, changed evidence, invalid chain or clock rollback rolls them back. Tests inject failure AFTER a business insert and verify both tables remain unchanged. No externally persisted file/DB two-phase protocol is asserted: evidence bytes are inline in the same committed row. The transaction reference is a generated audit ID bound into rowHash, not a fabricated SQLite engine transaction number or separate provider attestation.

Identical authenticated retry by the same actor replays and rechecks original authorization, then returns the original immutable event without executing twice. Changed request/actor conflicts. Concurrent identical requests produce one event; competing requests at the same valid head yield one commit and one stale-head denial. Unknown/busy/failed commits fail rather than overwriting. Read replay occurs in a consistent SQLite snapshot.

## Replay and limitations

Rehash original source bytes, operation receipt, authorization binding, event canonical JSON (all nineteen fields except eventHash) and full row envelope. Validate indexed columns against body, exact request/scope/source, chain, time ordering, producer separation and current provider invalidation for EVERY prior row. A revoked prior decision blocks qualifying replay/extension; no silent omission or latest-wins reactivation. Rejected history is not rewritten. There is no endpoint to mutate an event.

SQLite triggers and hashes protect normal application use; a privileged filesystem/database administrator can replace a whole database, remove rows after dropping guards, restore an older valid prefix or recompute unsigned hashes. A hash chain is not authentication, external WORM, durable provider proof or rollback protection. Real deployment requires restricted database access, independently retained provider audit and externally anchored audit heads/backup governance. Those guarantees are unconfigured; this package claims no production-grade immutable authority against an administrative adversary. Production remains dependency-blocked.
