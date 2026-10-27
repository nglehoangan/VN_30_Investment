# Valuation Time Validation

Date: 2026-10-27. Scope: Phase 3.2 isolated implementation only.

Checks enforce T<=K<=C, requestedAt<=C, reconstructed state.asOf=T, all economic components/units atT, same session for prices, completed and latest session, requestedAt/C before next completed boundary, calendar date coverage and source/proof knowledge<=K. Invalid/date-only economic observations block; no midnight is invented.

ProviderAt may remain null only with NORMALIZED_SESSION_BOUNDARY and explicit policy allowance. This does not claim an actual provider timestamp. Provider-time path requires a real compatible timestamp.

Read service uses ledger revision and exact facts hash, reconstructs atT, then rechecks revision and evidence head before returning. Clock rollback blocks. Late-known transactions reject historical K because no bitemporal AS_KNOWN support exists. A new revision/correction yields a new input/result hash; prior result remains immutable. A known cash deposit after EOD is excluded from earlier EOD cash in isolated SQLite integration.

C is recorded separately in runHash. Within the same valid window, unchanged semantic inputs/proofs yield the same resultHash; qualification expiry can legitimately change the result. No trusted server-clock integration is claimed by injecting a clock.
