# Production database integration decision

Verified target: retained local data/vn30.sqlite, inspected read-only. Its tables, migration checksums, OS ownership/modes and missing formal_knowledge_audit table are recorded in DATABASE_TARGET_ASSESSMENT.json. This is not an attestation of an active deployed production database or confirmation of the accountable database owner. No production migration is executed.

## Reuse and transaction decision

Actual app persistence is Prisma/better-sqlite3 through app/server/persistence.ts and existing repository transactions. PEC-1C uses Python sqlite3 and supplies scripts/contracts/pec1c-audit.sql as a tested installation contract, not an installed Prisma migration. Two connections, two processes or a Python audit call from inside an unrelated Prisma transaction do NOT share one atomic transaction.

Recommended for this Next application: let the existing TypeScript/Prisma transaction composition own BOTH the formal business operation and audit row. Prepare an additive Prisma model/migration and a transaction-bound capture adapter ONLY after D1/D2 approval. Preserve PEC-1C's exact request/authorization/evidence/clock/hash/chain semantics and test cross-runtime canonical JSON/hash parity before using old Python receipts as reference. Do not create a separate audit database or invent portfolio workflow records to fit existing audit FKs. No such port/model/migration is installed here because the runtime/database ownership decision is not confirmed.

Alternative Python-owned offline executor is acceptable only if the owner explicitly designates it as the sole writer for a bounded newly authorized operation and it implements the actual formal business writes on the SAME connection. Current generic FixtureExecutor cannot be connected to production. No adapter may commit independently or perform irreversible external IO while claiming SQLite atomicity.

## Required migration/recovery authorization

D2 must confirm the real target, responsible operator, deployment/transaction runtime and operation scope. D3 must separately authorize a specific reviewed additive migration with before/after schema hashes, checksum, tested backup/restore candidate, concurrency/rollback results and operator/time. Architecture approval does not authorize production DDL. Existing PEC-1C SQL is reusable design input, not permission to execute it.

After those decisions: rehearse against an isolated representative restored DB; verify event identity/idempotency, exact-head CAS, no UPDATE/DELETE/REPLACE, same-transaction operation+audit rollback, evidence bytes, foreign keys and current revocation. Verify Prisma/client/generated code and backup manifest compatibility. Current backup inspector has generic body/body_hash assumptions; test any new audit table's BLOB/body structure explicitly instead of assuming old restore checks validate its cryptographic/authentication semantics.

A migration is never used to create historical events, backfill preparation clocks, approve sources or activate scoring. Keep existing database and old sealed evidence unchanged throughout preparation.
