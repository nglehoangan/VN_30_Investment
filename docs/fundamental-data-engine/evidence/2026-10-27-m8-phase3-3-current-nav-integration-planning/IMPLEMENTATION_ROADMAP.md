# Minimum future implementation sequence

2026-10-27 · Phase 3.3 · DESIGN ONLY — NOT IMPLEMENTED / NOT ACCEPTED

Use existing accounting, calculator and TCBS acquisition. Do not add another ledger, valuation engine, market client, login provider or database solely to implement this plan. Phases below are dependency slices, not permission to begin another milestone. Authentication-deferral blockers mean implementation of isolated read adapters can be considered separately while operational acceptance stays blocked.

## A — Read-only adapters

**Dependencies:** OWNER_SLICE_AUTHORIZATION.

**Scope:** Implement bounded retained BrokerEvidenceReader, ledger-read adapter and CurrentNavInputProvider skeleton in isolation; no grants inferred.

**Acceptance:** Immutable source replay, path/size/hash/schema negatives, no writes, state/input hashes.

**Evidence:** Unit/disposable SQLite tests and protected-byte comparison.

**Safety:** No providers/auth/route/DB migration/posting; return blocked without accepted inputs.

**Owner decision:** Owner authorizes exact isolated adapter files/tests only.

## B — Source identity qualification

**Dependencies:** A, B1, TRUST_INFRA.

**Scope:** Resolve accepted account/security continuity for all held units without rewriting existing bridge DTO.

**Acceptance:** Exact account+market anchors and intervals/lifecycle independently accepted, unique all-held mapping.

**Evidence:** Hashed source annex, candidate→accepted scoped review, rename/reuse/action negatives.

**Safety:** No ticker-only approval or placeholder ACCEPTED mutation.

**Owner decision:** Owner authorizes targeted missing evidence acquisition separately; approve future trust architecture before authenticated workflow.

## C — Broker accounting reconciliation

**Dependencies:** A, B, B2, B3, B4, B5_SCOPE.

**Scope:** Complete starting/forward accounting/claims/obligations and NAV-economic reconciliation addendum.

**Acceptance:** No economic discrepancy/coverage gap; full legacy report preserved; basis-only limitation explicitly scoped.

**Evidence:** Broker coverage/reconciliation/claim/action evidence and independent review.

**Safety:** No balancing transactions; any legitimate correction/intake/posting requires separate authority.

**Owner decision:** Owner approves reconciliation contract and any separately scoped accounting operation; design is not posting permission.

## D — Market price qualification

**Dependencies:** A, B, NAV_CALENDAR_FINALITY, TRUST_INFRA.

**Scope:** Translate existing retained TCBS normalizer output under exact PORTFOLIO_NAV policy.

**Acceptance:** All-held fresh RAW exact-identity EOD coverage, accepted calendar/finality/source; no conflicts.

**Evidence:** Byte replay, schema/unit/CA/session/freshness and authority negative tests.

**Safety:** No VALUATION grant reuse, new API client, provider calls or active-candidate binding by adapter read.

**Owner decision:** Owner approves NAV-specific policy and exact future adapter implementation; fresh acquisition separately authorized.

## E — Independent acceptance

**Dependencies:** B, C, D, TRUST_INFRA.

**Scope:** Independent reviewer verifies exact subject and all technical/financial/methodology decision types.

**Acceptance:** Authenticated producer-distinct role evidence; exact hashes/scopes/intervals/revocation and limitations.

**Evidence:** Reproduction records, decision/audit references and security validation.

**Safety:** No synthetic verifier, agent output or local JSON as acceptance.

**Owner decision:** Owner commissions qualified independent review; no self-approval.

## F — NAV publication authorization

**Dependencies:** E, PUBLICATION_AMENDMENT, B6.

**Scope:** Approve versioned default-deny destination/purpose gate contract without changing V1false semantics.

**Acceptance:** Separate Odecision and applicable release authority; races/expiry/revocation cannot expose official value.

**Evidence:** Publication matrix, denied-path tests, full dependency token and M7 review.

**Safety:** No dashboard/metrics/scoring activation merely fromQ.

**Owner decision:** Owner explicitly approves operational contract amendment and exact scoped publication; no automatic deployment.

## G — Production integration and deployment

**Dependencies:** F, B6, B7.

**Scope:** Compose only approved read components and explicitly approved view; independently validate target/recovery/release.

**Acceptance:** Exact build/config/schema/registry/source decisions, executed M7 conditions and scoped GO; read-only non-authorized paths remain blocked.

**Evidence:** Deployment manifest, no-write/recovery rehearsal, controlled operational acceptance and signoffs.

**Safety:** No migration unless separately explicitly authorized; no scoring/D2/Phase4 scope expansion.

**Owner decision:** Owner separately authorizes integration code, deployment window, any migration and final production GO.

Stop after each authorized slice and its evidence review. Evidence acquisition, financial corrections, authenticated acceptance, publication semantics and deployment each require their own exact authorization; owner approval of this design does not authorize them. If trust infrastructure remains deferred, preserve operational block rather than expanding the roadmap into an unsolicited identity project. No snapshot storage/history or Phase4 implementation is included.
