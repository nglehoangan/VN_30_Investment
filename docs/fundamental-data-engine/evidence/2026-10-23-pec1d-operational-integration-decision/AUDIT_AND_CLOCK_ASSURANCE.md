# Operational clock, audit anchoring and recovery assurance

## Current verified limits

SystemClock uses server Date; PEC-1C CheckedClock compares UTC/monotonic progression and persisted recordedAt. This detects defined local anomalies, not external UTC accuracy, privileged database replacement, a restored valid prefix or an off-device durable audit. SQLite triggers and SHA-256 do not establish absolute tamper resistance.

An isolated PEC-1D diagnostic restores an earlier valid SQLite prefix after a second synthetic event. PEC-1C replay accepts that internally valid earlier prefix when no independent anchor is supplied. This **reproduces an expected external-anchor dependency**; rollback-attack prevention is BLOCKED, not passed or fixed. The default production boundary still denies use because no provider/executor is configured. Do not deploy operational capture on the assumption that local replay detects this attack.

## Required operational clock contract (specified, not configured)

Owner selects trusted host/runtime, UTC synchronization source and health monitor. Capture should require recent healthy synchronization evidence (observed offset/uncertainty, last successful sync, boot identity), use monotonic progression during execution, compare persisted audit boundaries on restart and reject stale/unknown health, backward jumps or disallowed drift. Rebase after restart only against verified durable state; no caller-supplied recordedAt. Record actual operation completion, pre-insert recording decision, applicability and conservative knownAt separately. No approved numeric offset/freshness/SLA is invented here; D4 must approve measured bounds and failure behavior. Clock health never proves historical publication or source availability.

## External anchor contract (specified, not configured)

Anchor must live outside the application host/primary database failure domain, with separate custody and a write-once/versioned append policy the application cannot rewrite/delete. A local adjacent checksum, Git commit or a file controlled by the same OS account is insufficient. Anchor binds deployment/database identity, schema/migration version, monotonically ordered anchor sequence, every relevant stream head/event count, prior anchor hash, latest capture knownAt, provider authentication/revocation policy versions and independent receipt/signature identity. Verify the actual external authority and current receipt, not only a copied hash.

SQLite business+audit capture remains locally atomic. External anchoring is a separate durability/qualification step: a committed but unanchored event must not supply qualified formal knowledge or production admission. No claim of distributed atomicity is made. Define retry/idempotent anchoring, orphan/pending handling and a deny-on-missing/stale acknowledgement rule. An external anchor outage blocks qualification; it does not authorize fallback to local history. D4 must choose actual custody/store, privileges, retention and outage bounds before implementation.

## Backup and restore protocol

Reuse existing VACUUM INTO + manifest + isolated restore-candidate tooling, preserving private paths and no automatic activation. Owner must confirm off-device durable location, encryption/key recovery, retention, RPO/RTO and independent custodian; current local snapshot capability is not evidence those controls exist.

Restore verification must obtain the latest independently retained trusted anchor before opening the candidate for writes. Check source snapshot checksum, migrations/schema, SQL/foreign-key integrity, exact audit heads/counts/chains/evidence, original authentication proofs and CURRENT revocations. A database missing an externally anchored event, with changed identity or an unknown anchor is quarantined. Newer unanchored records require explicit reconciliation/independent review; never reset the external anchor to make an old DB pass. Reconcile legitimate later business operations and record the actual recovery decision/drill. No production restore or anchor bootstrap occurs here.

Operational independent validation requires a named producer-distinct human to review live provider grants/revocation, actual migration rehearsal, clock evidence, off-device anchor acknowledgement and stale-prefix restore rejection. Existing synthetic tests and this report are not that acceptance.
