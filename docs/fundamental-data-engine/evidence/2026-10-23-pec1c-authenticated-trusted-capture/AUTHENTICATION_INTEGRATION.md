# Authentication integration

## Concrete fail-closed integration boundary

No existing configured trusted provider was found. Per the requested fallback, production_capture(database) creates an unconfigured TrustedCapture which rejects every capture/replay with BLOCKED_TRUSTED_PROVIDER_AND_EXECUTOR_NOT_CONFIGURED. It discovers no implicit credentials and creates no identity. IdentityAuthority and OperationExecutor may only be injected by independently reviewed SERVER composition, never request JSON or a client-selected implementation.

IdentityAuthority.resolve(opaque credential) must independently verify the provider's signature/introspection, issuer/audience, authentication assurance, session ID, subject and authentication audit evidence. It returns VerifiedSession(subject, session_reference, issuer, audience, authenticated_at, expires_at, audit_reference). Capture enforces nonempty provenance, UTC ordering, expiry and exclusion of Codex/AI Portfolio Manager impersonation. Raw credentials are never persisted.

IdentityAuthority.authorize(session, exact request, actual sampled time) must recheck session/subject and role revocations, role expiry and exact operation/subject-version/source/scope/event binding against current server-controlled grants. Its proof has subject, sessionReference, issuer, audience, permission, requestBinding, grantedAt, validThrough, authenticationReference and auditReference. The boundary checks every identity/binding/time field. It does not treat an authentication-reference string or an injected dictionary as proof; trust resides in the separately configured real adapter and independently retained provider audit.

IdentityAuthority.authorize_saved(proof, original request, current time) must verify the original immutable provider audit/signature/reference matches ALL proof fields and original decision time, and independently check current session/subject/role/decision invalidation and scope. It must fail on missing/stale/unknown revocation. Original session expiry does not fabricate historical knowledge or erase a past event; whether its durable decision remains valid is resolved by the provider's current explicit decision policy. A new capture always requires a presently unexpired session. A revoked saved decision denies qualifying replay and any further extension; it is never silently omitted or re-approved.

## Required external configuration

- Approved actual issuer/provider, exact audience, verification keys or introspection configuration, secure credential transport and operational authentication assurance. None is configured here.
- Current revocation/role/grant resolver and immutable audit evidence retention. Do not use client roles, unchecked JWT contents, generic OWNER strings or fixture identities.
- Named subject assignments for all seven exact permissions and scope-limited operations, plus independent reviewer/producer records. No assignment is invented by this package.
- Reviewed adapter/composition and trusted executors bound to existing formal transactions. This Python boundary does not automatically implement the existing TypeScript identity port.
- Healthy server clock and database access/migration ownership, external audit anchoring and deployment configuration.

Only FixtureIdentity inside the test file implements positive synthetic authentication; it is never imported by implementation or configured in production. No mock identity is reported as operational readiness. No new external service, fake provider or hardcoded administrator is introduced.
