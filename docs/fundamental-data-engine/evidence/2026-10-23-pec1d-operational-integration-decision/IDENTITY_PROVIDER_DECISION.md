# Identity provider architecture decision

**Recommendation: reuse an already approved organizational OIDC provider if the owner can identify one (A). Otherwise approve architecture B: an established managed OpenID Connect provider with server-controlled application sessions and exact scoped grants. Vendor/tenant selection remains a separate explicit approval; no new provider is installed.**

No usable approved application provider was found in repository composition. Existing TCBS authentication and transaction HMAC confirmations are outside the required owner/reviewer identity trust domain. Option A is currently unavailable as verified implementation; it can be reopened by supplying actual approved issuer/tenant and entitlement evidence.

| Criterion | A Existing approved organizational provider | B Established managed OIDC provider | C Owner-controlled local authentication |
|---|---|---|---|
| Security | Reuse verified identity lifecycle if this application is actually authorized | Mature provider verification + MFA; app still owns session/grant controls | Can fit loopback, but OS login/shared local account alone is insufficient; per-person authenticators and recovery design needed |
| Complexity | Lowest if a suitable tenant/integration already exists | Moderate application integration; no new self-hosted IdP service | Fewer external services but substantial credential enrollment, session, revocation, recovery and audit code |
| Cost | Existing license may cover it; entitlement/usage unverified | Recurring plan/API/log-export costs; no free-tier sufficiency assumed | No provider subscription, but security engineering, device/recovery and independent audit costs |
| Maintainability | Existing tenant administration plus app adapter | Provider lifecycle maintained externally; SDK/key rotation and app controls remain ours | Application owner maintains authentication/keys and recovery lifecycle |
| Auditability | Must export exact authentication/grant decisions beyond vendor retention | Durable audit export/independent anchoring required; standard login logs may be delayed | Independent evidence store/key custody required; same OS user's writable logs are insufficient |
| Revocation | Verify online session/role/subject invalidation and app session kill | Explicit app session/grant ledger plus provider revocation/back-channel/current lookup, fail closed if unknown | Local revocation ledger/key expiry/recovery must be designed and independently controlled |
| Separation of duties | Named distinct producer/validator accounts and scoped grants | Same, with explicit seven-role policy; no automatic owner grant | Requires distinct named people/keys and independent validation access; single shared account fails |
| Decision | First choice ONLY if an approved tenant can be evidenced | Recommended fallback architecture, pending owner/vendor decision | Not recommended as a shortcut to formal authority; consider only after deployment/reviewer workflow is confirmed |

## Concrete minimum B proposal

Keep the existing loopback Next application and SQLite. Add no hosted application deployment, new database service, broker-login reuse or self-hosted identity service. After approval, use server-side Authorization Code/OIDC validation, state/nonce and PKCE, an opaque HttpOnly application session with explicit revocation, and server-controlled exact operation/subject/version/scope grants. Distinct producer/validator identities are mandatory. Preserve seven PEC-1C permissions separately from provider display roles. Authorize each write against current session/subject/role state; a cached role-bearing JWT alone is insufficient. Plan the session/grant schema under the existing Prisma migration owner, not in an unrelated shadow database.

These validation requirements follow [OpenID Connect Core](https://openid.net/specs/openid-connect-core-1_0-18.html#IDTokenValidation): check trusted issuer, audience, signing verification, expiry and nonce, including authorized-party rules where applicable. PKCE does not replace those checks or application authorization.

Auth0 was screened as an established managed-provider example, **not selected**. Its documented [session inspection/deletion endpoints](https://auth0.com/docs/manage-users/sessions/manage-user-sessions-with-auth0-management-api) require an Enterprise plan; do not assume a low-cost tenant supplies the needed online session control. Its [log retention](https://auth0.com/docs/deploy-monitor/logs/log-data-retention) is plan-dependent and logs may be delayed. The [pricing page](https://auth0.com/pricing) must be checked against exact required capabilities before any purchase. No price quote, tenant entitlement or sufficient free plan is asserted. This constraint is why architecture approval must not silently become approval to buy an arbitrary vendor plan.

## Decision gate

D1: identify an existing approved provider/tenant, or approve B and name the managed provider/tenant, allowed costs and required revocation/audit capabilities. C needs explicit approval of a new local security design and distinct reviewer identities. Provider configuration/registration, SDK installation, accounts/roles, secrets, migrations, live capture and operational integration are **not authorized by this recommendation**. No authenticated owner decision is recorded in this package.
