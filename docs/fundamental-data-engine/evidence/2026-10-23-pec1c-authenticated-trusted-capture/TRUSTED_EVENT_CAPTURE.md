# Trusted event capture

## Capture boundary

No client clock fields are accepted. CheckedClock samples server UTC and monotonic_ns, detects rollback or divergence greater than two seconds between consecutive samples and requires canonical UTC microsecond timestamps. The capture transaction also checks persisted recordedAt values to reject rollback after a service restart. Capture re-samples after acquiring BEGIN IMMEDIATE; a pre-lock timestamp is not used to evaluate records committed while waiting.

occurredAt is observed at completion of the trusted operation executor; recordedAt is sampled at the audit-insertion decision boundary within the same transaction; effectiveAt equals occurredAt for this minimal prospective contract; knownAt equals recordedAt. These are distinct fields with distinct meanings even when the minimal applicability/recording values coincide. Future-effective or historically effective governance is NOT accepted through caller parameters. recordedAt is the actual pre-insert boundary sample, not a falsely claimed post-fsync commit timestamp. The immutable transaction reference links the whole committed unit.

All times satisfy operation-start <= occurredAt <= recordedAt/knownAt, authorization validity and nondecreasing persisted order. No wall-clock value establishes an old report's availability, nor is Git time/candidate created_at/preparation recordedAt an ingestion clock. Time health/UTC synchronization and monotonic continuity across process/host restarts require operational configuration; the local detector is not NTP attestation. Unknown external clock trust leaves production composition unavailable.

## Execution and evidence

Only a server-configured OperationExecutor can execute the exact authorized operation. It receives the SAME SQLite transaction and full request; it must validate source/method/registry/mapping/dataset preconditions and discover all actual producers. Its exact result is requestBinding/evidenceBytes/producerIds/executionReference. Source bytes must hash to sourceEvidenceHash. The audit operation receipt binds the original request, producer identities, actual execution reference, byte hash and authorization hash. event.evidenceHash hashes this receipt, separately from original sourceEvidenceHash.

For source verification/ingestion/mapping, same-stream acquisition/verification/ingestion prerequisites must already exist. Streams are exact subject/version/source/scope hashes. Client-supplied history, old preparation namespaces, unknown predecessors, forks, time rollback, modified bytes or changed retries fail closed. Old PEC-1A candidates are never automatically executed or upgraded.

A real executor is NOT implemented/configured here: generic infrastructure cannot assert that wrapping old bytes performed acquisition, formal ingestion or a legitimate owner decision. External irreversible IO cannot be claimed atomic with SQLite. Executors must not commit/rollback independently or write a separate database; such adapters are unsupported pending explicit transactional integration review.
