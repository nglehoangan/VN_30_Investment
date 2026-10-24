# Owner architecture and operational decisions required

**Decision gate: no new provider is selected/installed and no production migration or capture adapter is wired.** This follows PEC-1D Task 2: “If choosing a new provider or changing security architecture requires owner approval, stop at an explicit decision gate.” Task 4 separately prohibits production migrations without explicit authorization. No independent skill or automatic approval rejection created this gate.

## D1 — choose the identity path

Recommended: A if you can name an already approved organizational OIDC issuer/tenant with the required capabilities; otherwise B, managed OIDC plus server-controlled revocable app sessions and exact scoped grants. C requires a separate explicitly approved local per-person authentication/recovery/audit design; OS login, TCBS JWT and HMAC confirmations do not satisfy it.

Required response: choose A/B/C; name the exact provider/tenant or request a specific vendor shortlist; confirm approved identity/security administrator, budget/required revocation and audit entitlements, intended local deployment/reviewer access and allowed client registration/origin. Auth0 was screened, not selected; session-control entitlements must be verified before purchase. Supply no secret, API key, OTP, password or private signing key in a decision response. Approval of a vendor-neutral pattern alone does not authorize registration/purchase of an unnamed vendor.

Owner decision: **NOT SUPPLIED**. Provider/issuer/client/audience: **NOT SUPPLIED**. Authenticated decision reference and actual decision time: **NOT SUPPLIED**. No local document field or recommendation manufactures authentication.

## D2 — confirm deployment and transaction ownership

Confirm that inspected data/vn30.sqlite is the intended target or name the actual deployed target through secure operator configuration. Identify accountable database owner, operator, host/runtime and independent reviewer. Decide Next/Prisma-owned business+audit transaction (recommended for the actual app) versus an explicitly bounded Python-owned offline writer. Two connections are not atomic. A local filesystem UID is not production ownership authorization.

Confirmation/decision: **NOT SUPPLIED**. This is not permission to connect or migrate a newly named target automatically.

## D3 — authorize a concrete migration later

Not requested for execution now: no approved target/runtime/provider integration exists. After D1/D2, prepare a specific additive migration with schema/checksum, exact operation adapter, isolated representative restore rehearsal and forward/recovery plan. Production execution requires a separate explicit target/operator/migration authorization. Current PEC-1C SQL must not be applied merely because architecture is approved.

Production migration authorization: **NOT SUPPLIED; nothing executed**.

## D4 — clock, independent audit custody and recovery

Name trusted UTC health owner and approve measured offset/freshness/rollback behavior; choose separately controlled off-device audit-head retention, credentials/custodian, anchor acknowledgement and outage policy. Confirm durable backup destination, encryption/key recovery, retention, RPO/RTO and restore-quarantine/acceptance. Do not invent a new managed storage service or treat same-host files as independent anchors.

Control/operational decision: **NOT SUPPLIED**.

## D5 — operational independent validation

Assign a real producer-distinct validator and require exact configured provider/session/grant/signature/issuer/audience results, transaction/migration rehearsal, clock health and external-anchor rollback-restore rejection. This occurs only after D1–D4 prerequisites exist. Codex does not self-approve operational acceptance.

Assignment/acceptance: **NOT SUPPLIED**.

None of these decisions approves a source candidate, backdates knowledge, completes financial mapping/perimeter/knowledge/cutoff gates, admits data, activates D2 or scoring, or starts PEC-1E/PEC-3. Eight candidates remain DEFERRED. Stop at this reviewable package and await D1/D2 before provider/runtime implementation.
