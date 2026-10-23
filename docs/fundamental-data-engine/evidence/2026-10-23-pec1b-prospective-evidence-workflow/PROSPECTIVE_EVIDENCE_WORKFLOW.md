# Prospective evidence workflow

## Executable preparation now

1. Construct an exact intent from a newly commissioned evidence operation. Do not put old report/publication times into event fields. No actual source acquisition or real candidate event occurs in PEC-1B.
2. Call append_preparation(workspace, intent, evidence_bytes). It checks the bytes against evidenceHash, intent fields, role consistency and producer separation. Capture_formal_event always raises BLOCKED_AUTHENTICATED_IDENTITY_AND_TRUSTED_CAPTURE_UNAVAILABLE.
3. The preparation appender exclusively locks its workspace. It rehashes all existing records/evidence, verifies a single nonforked chain and causal references, then checks source acquisition -> verification -> ingestion -> mapping proposal order for the same subject/version/source/scope. Root governance proposals need not pretend to be ingestion events.
4. Snapshot evidence with exclusive create; identical byte retries reuse it. Create the new record exclusively and fsync. Local recordedAt is generated inside the boundary; callers cannot inject clocks. Identical submissionId/intents return the prior unchanged record and timestamp; changed retry raises a conflict. Wall-clock reversal fails closed.
5. Persist proposals only in a new review-package preparation workspace and seal the package for external review. No proposals are exported to authority tables or runtime. The tests use TemporaryDirectory exclusively.

Read-only file modes, SHA-256 and a local lock provide integrity checks, not authentication, WORM storage, rollback protection or a trusted production clock. A lock left by a crash blocks further preparation pending inspection. A crash can leave an unreferenced evidence snapshot; it grants no event or authority. Deleting/truncating and recomputing an entire unsealed workspace cannot be distinguished from a new workspace by hashes alone; an externally retained package seal/head is required. Never claim local artifact history is an authoritative audit store.

## Future authenticated capture — specified, unavailable

Configure the existing identity port with a real verified provider, permission mapping and revocation checks; configure a trusted clock and operation executor. Resolve exact approved source/method/registry contracts independently of request JSON. Allocate operation ID; resolve subject/version, exact evidence bytes and producer identities. Execute a NEW authorized acquisition/verification/import/governance action; obtain actual execution and commit times from that service boundary. In one reviewed transactional composition persist the original source/import/capture/normalization/observation or governance/snapshot receipt through the existing append-only repository and bind the event to that exact receipt. No second event/approval database is proposed.

Before commit, recheck causal head/version CAS, authentication freshness, permissions, source bytes, source policy and current revocations. On rollback, record no completed formal event. On retry, resolve the exact already committed receipt; do not execute again under a new timestamp or broaden scope. External audit infrastructure must durably bind the operation and local commit; its integration/atomicity is a blocking dependency, not implemented two-phase success.

Only genuine new events can supply ingestedAt/mappingKnownAt/etc. An existing PEC-1A report may be referenced as immutable source evidence, but merely wrapping it now is not acquisition, source verification, formal ingestion, owner approval or independent acceptance. No historical formal events are emitted for the eight candidates.

All future financial-document acquisition remains restricted to finance.vietstock.vn/static2.vietstock.vn with redirect validation; archived issuer captures are audit records, not new acquisition authorization. Formal source approval and production admission remain separate decisions after prerequisites close.
