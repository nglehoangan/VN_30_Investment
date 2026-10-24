# PEC-1D closure report

**Final status: OWNER_ARCHITECTURE_DECISION_REQUIRED. PEC-1D is not approved.**

Verified actual Next/React/TypeScript loopback configuration, SQLite/Prisma persistence and transaction conventions, isolated human-review staging, broker authentication versus application identity, private configuration/logging and local backup/restore tooling. No approved application IdP, app user/session store, accountable production target/operator, external UTC attestation or independently retained audit anchor was established.

## Architecture and implementation disposition

Recommend A only with evidence of an existing approved organizational OIDC provider; otherwise B, an established managed OIDC provider with server-controlled app sessions and exact revocable scoped grants. No vendor is selected. Auth0 was screened and its session-management entitlement constraint prevents an unverified free-plan assumption. Local authentication C has no subscription dependency but adds credential/recovery/independent-review security responsibilities and requires explicit approval.

The explicit owner decision gate prevents installation, provider-specific adapter implementation, role/account creation, secret changes, new production migration or executor wiring. Existing PEC-1C implementation is reused unchanged. New code is limited to evidence preparation, read-only safety verification and isolated boundary/restore diagnostics. Actual provider integration, signature/issuer/audience verification and deployed independent validation remain BLOCKED/NOT RUN, not silently counted as passing tests.

## Important restore finding

The isolated valid-prefix restore diagnostic reproduces the known unanchored limitation: local hashes/triggers and a synthetic authenticated replay do not detect restoration of an older internally valid prefix. This is not reported as successful rollback-attack prevention. An external trusted head with independent custody and deny-before-qualification behavior is required. No existing gate is weakened or enabled to hide that dependency.

## Safety and acceptance

SECURITY_VALIDATION_RESULTS.json records exact commands/results, synthetic versus integration coverage and missing operational tests. The safety verifier rehashes protected inputs, database bytes/logical dump/counts/approvals, ten prior package seals and unchanged original candidate evaluations. No production DDL, new identity, owner approval, effective admission, D2/scoring activation or source acquisition occurs. No frozen policy changes; no PEC-1E or PEC-3 work.

## Deliverables

- [Infrastructure assessment](INFRASTRUCTURE_ASSESSMENT.md)
- [Identity architecture comparison/recommendation](IDENTITY_PROVIDER_DECISION.md)
- [Adapter preparation and unmet prerequisites](AUTHENTICATION_ADAPTER.md)
- [Database ownership/transaction integration](DATABASE_INTEGRATION.md)
- [Clock, anchors and recovery](AUDIT_AND_CLOCK_ASSURANCE.md)
- [Security validation results](SECURITY_VALIDATION_RESULTS.json)
- [Operational blockers](OPERATIONAL_BLOCKERS.json)
- [Exact owner decisions required](OWNER_DECISIONS_REQUIRED.md)

The next necessary action is D1/D2, not another generic implementation review. Package SHA-256 sealing demonstrates integrity only, not owner authentication or independent operational acceptance. Stop after PEC-1D.

## Final execution results

118 existing isolated regressions passed (31 PEC-1C, 25 PEC-1B, 62 PEC-2) plus three decision-gate diagnostics. The restore diagnostic is a successful reproduction of a missing-control limitation, NOT a passed restore-attack prevention gate. Real-provider/signature/issuer/audience integration tests remain NOT RUN/BLOCKED. Architecture boundaries and new Python syntax checks passed.

Read-only safety verification rehashed 7,094 protected files and ten prior seals; database bytes/logical dump/counts/approvals and all eight DEFERRED states remain unchanged. The initial new verifier failed because its schema-file namespace comparison included an existing ignored prisma/.DS_Store. The comparison was corrected to exclude only Finder metadata; schema/migrations and protected hashes remain checked. The initial failure and exact difference are retained in validation/initial-safety-failure.json.

Final sealed verification receipt: validation/safety-verification.json, requiring status PASS_TECHNICAL_SAFETY_NOT_HUMAN_ACCEPTANCE and packetSealChecked=true. No operational control is promoted from pending to approved by this packet.
