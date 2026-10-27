# Verifiable source authority model

2026-10-27 · Phase 3.3 · DESIGN ONLY — NOT IMPLEMENTED / NOT ACCEPTED

Seven separate propositions must be evidenced: capture occurred; bytes are intact; source/account identity is exact; source is qualified for purpose/scope; financial interpretation is accepted; producer-distinct validation passed; operational publication is authorized. None implies the next. A hash is not authority. A stored APPROVED flag, signed-in broker API token or staged policy receipt is not a NAV grant.

Proposed roles below describe responsibilities only; no person, identity or role is assigned in this phase.

|Role|Allowed action|Prohibition|
|---|---|---|
|EVIDENCE_PRODUCER|Retain/decode/hash and propose bundles; run technical validation|Cannot accept own source/identity/financial interpretation or publish|
|IDENTITY_REVIEWER|Accept exact account/instrument continuity with dated evidence|Cannot widen to source prices or operational publication|
|FINANCIAL_SOURCE_REVIEWER|Accept broker interpretation, reconciliation/coverage and exact market-source scope within qualified role|Cannot change ledger or waive unresolved obligations|
|METHODOLOGY_AUTHORITY|Accept exact NAV calculation/profile/price/calendar contracts|Cannot accept particular dataset or release production|
|INDEPENDENT_VALIDATOR|Reproduce exact bundle and validate producer-distinct scoped acceptance|Must be a different verified person, not a different string/alias|
|OPERATIONAL_PUBLICATION_OWNER|Authorize exact destination, portfolio/purpose, build/result/dependency scope and validity|Cannot substitute for technical/financial independent review or M7 GO|
|RELEASE_AUTHORITY|Approve exact deployment/build/config/schema and applicable executed M7 release|Does not expand any data/methodology scope|

AuthoritySubjectV1 proposal binds canonical exact bytes and semantic scope: decision kind, provider/source/document/capture/schema, portfolio/account/perimeter, datasets/fields/security identities, purpose PORTFOLIO_NAV, economic interval, knowledge cutoff, ledger revision/facts/state hash, methodology/profile/version, price/calendar/CA/mapping hashes, reconciliation/coverage/validation bundle and explicit limitations. No wildcard scope expansion; partial approvals do not satisfy full-held/full-obligation requirements.

AuthorityDecisionV1 proposal binds subjectHash, decision/restrictions, authenticated issuer/reviewer subject and independently established role-grant evidence, producer identity, authenticated decision time, effective interval, expiry, predecessor/revocation/supersession and verified signature or trusted audit reference. Capture/retrieval/economic/decision times remain distinct. Verify exact signature bytes, trust anchor, authorized key/role and scope, current key/role/decision revocation, temporal order and audit chain/head; UNKNOWN revocation means deny. Distinct aliases for one person fail independence. No retrospective inference of a signature from a document name.

Immutable lifecycle proposal: PREPARED recommendation → authenticated decision (accepted only within exact scope, or DEFER/REJECT) → expired/revoked/superseded states deny future qualification. Append events; never rewrite old approvals. Effective intervals are bounded and knowledge time cannot be backdated. Explicit predecessor and scoped replacement avoid latest-wins conflicts; overlapping unresolved grants block. Revalidation is required for changed source/mapping/ledger/policy/calendar or economic scope, not just changed amount.

Trust infrastructure is a hard dependency. PEC-1C provides provider-neutral IdentityAuthority/OperationExecutor/audit contracts, not a configured real provider/executor. ADR0005 keeps login/OIDC DEFERRED_BY_OWNER. Ordinary local viewing continues under existing gates; formal authenticated approvals/acceptance remain blocked. This plan does not select or implement a provider, local identity, credential scheme or storage.

Owner options: (recommended now) approve this design for later slices while preserving operational block; or separately commission a reviewed authority architecture amendment. An external offline signature-verification workflow could be evaluated without app login, but would require owner-approved trust anchors, role/independence provenance, secure capture/clock/audit/revocation/restore semantics and explicit compatibility with PEC-1C. It is not approved or claimed operationally available here. Unsigned local files/OS username/Codex output are never substitutes.

Existing retained-market approval arrays and staged production-authority receipt reader are reusable integrity/scope patterns; they are not automatic trusted human approval stores for NAV. Durable event backup, tested restore and independent audit-head anchoring are prerequisites for any real decision workflow. SQLite triggers/SHA-256 alone do not establish tamper-proofness.
