# Risks and open decisions

2026-10-27 · Phase 3.3 · DESIGN ONLY — NOT IMPLEMENTED / NOT ACCEPTED

Design review perspectives are those of the implementing agent. They are not external independent signoffs.

|Perspective|Review conclusion|
|---|---|
|CIO|Keep investment/risk baselines, source qualification and M7release authoritative; qualified arithmetic alone grants no recommendation|
|Portfolio manager|Same-Taccount perimeter, complete forward accounting, disjoint cash/claim/debt and no duplicate pending units required|
|Research analyst|Expose provenance, stale/missing/conflicting data and research-only/subtotal scope; no fabricated close/currentNAV|
|Risk manager|Unknown liabilities/rights fail closed; revocation and races invalidate views; point/sparse valuation does not authorize drawdown|
|System/TypeScript architect|Reuse A–I and existing ports; solve sync/async and final-head boundary explicitly; version publication separately|
|Financial governance reviewer|Separate capture/integrity/identity/interpretation/review/publication/release; authentic roles, exact scope and audit required|

## CRITICAL — AUTHORITY_UNAVAILABLE

Current no-login deployment cannot produce authenticated broker/identity/independent NAV authority.

**Disposition:** Preserve block. Owner may separately evaluate trust mechanism; never substitute JSON/OS/Codex/synthetic identities.

## CRITICAL — ECONOMIC_COMPLETENESS_UNPROVEN

B1–B4leave current economic ownership/claims/obligations unresolved; opening integrity is not forward completeness.

**Disposition:** Preserve null full NAV/indicative; exact external records and accepted reconciliation required.

## MAJOR — V1_OPERATIONAL_CONTRACT_CONFLICT

CurrentNavResultV1permissions literalfalse and only test/research origins; copying to official dashboard conflicts with contract.

**Disposition:** Separate proposed publication envelope/amendment, explicit owner review before any implementation. Do not mutate V1.

## MAJOR — VALUATION_SCOPE_MISMATCH

TCBS runtime composition permits VALUATION, not PORTFOLIO_NAV.

**Disposition:** Separate NAV-purpose source/finality/calendar acceptance and read adapter; preserve existing approvals unchanged.

## MAJOR — SYNC_AUTHORITY_AND_TOCTOU

Synchronous verifier and evidenceHead alone do not establish async current human authority or atomic publication across stores.

**Disposition:** Preverified immutable scoped authority view and whole dependency token; final current-head check atP, deny on any uncertainty.

## MAJOR — ACCEPTANCE_HASH_CYCLE

Acceptance cannot sign a resultHash that already contains the same acceptance proof.

**Disposition:** Accept canonical input subject without its own receipt; calculate result, then separate operational decision binds resultHash.

## MAJOR — TECHNICAL_IDENTITY_DATE

TCBS master from=knownAt date and local technical calendar are not accepted effective/continuity/finality witnesses.

**Disposition:** Require external dated account/market identity and calendar/finality sources; no inferred mapping date.

## MAJOR — M7_AND_DEPLOYMENT

Technical/read-only usability does not supersede real-money release restrictions, unapplied migrations or proposed registry status.

**Disposition:** B6/B7and distinct operational/release decisions remain mandatory; no deployment authorized.

## MINOR — DIAGNOSTICS_AND_DATA_PRIVACY

Adapter/publication reasons are not implemented and broker account evidence is sensitive.

**Disposition:** Label proposed reason namespace, expose opaque IDs/safe error reasons; protected raw evidence and no credentials in manifests/logs.

## Decisions for owner review

**D33-1 — Approve this integration/acceptance design only:** Recommend review/approve scoped plan; authorize no adapter/deployment automatically. Boundary: APPROVE_PLAN_ONLY_NOT_RUNTIME_AUTHORITY. No owner/authenticated decision is recorded by this document.

**D33-2 — Future read-only adapter slice:** If desired, separately authorize Aonly with synthetic/read-only evidence and blocked outputs; no new provider. Boundary: NOT_AUTHORIZED. No owner/authenticated decision is recorded by this document.

**D33-3 — Authority path under no-login:** Keep formal acceptance blocked now; separately evaluate external authenticated verification only if owner requests explicit architecture amendment. Boundary: DEFERRED_AUTH_ARCHITECTURE_UNCHANGED. No owner/authenticated decision is recorded by this document.

**D33-4 — Publication contract amendment:** Require separately approved versioned destination envelope/permissions; do not override V1false flags. Boundary: NOT_APPROVED. No owner/authenticated decision is recorded by this document.

**D33-5 — Targeted external evidence/independent roles:** Obtain exact B1–B5records and real distinct reviewers through separately authorized actions; no repeated discovery. Boundary: EXTERNAL_ACTION_REQUIRED. No owner/authenticated decision is recorded by this document.

**D33-6 — Release/deployment:** B6/B7and exact build/config/schema/registry/recovery, scopedGOand anymigrationauthority remain separate. Boundary: NOT_AUTHORIZED. No owner/authenticated decision is recorded by this document.

Avoid unnecessary infrastructure: no second ledger, acquisition engine or calculator; no login project, audit-store installation, schema migration or snapshot database commissioned. All future features require scoped authorization. Existing source contracts are immutable; richer proposed acceptance metadata lives in a separate exact evidence bundle and trusted proof projection, never arbitrary fields in V1.

Blocking external issues do not make the design deliverable incomplete: they are explicit gates preventing implementation/activation. If owner requests immediate official NAV without resolving them, status would be BLOCKED rather than a design-based waiver.
