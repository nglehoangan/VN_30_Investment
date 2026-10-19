# DI Market Data Boundary Amendment v1

Contract ID: `di-market-boundary-v1`. Prospective implementation candidate; independent acceptance and DI14 remain pending. Implementation authorization: Owner request “DI Market-Data Boundary Amendment — Implementation & Validation”, starting HEAD 9bc65ca19e8c20990d866f83bc49151306b265f9; approved architecture review under evidence/2026-10-19-di-market-data-boundary-review. This authorization does not self-approve runtime capability, freshness policies, decision eligibility or DI15.

Lifecycle: Data Initialization → Market Data Refresh → Analysis → Portfolio Snapshot → Decision → Decision Snapshot. Candidate decisions are private until validation, persistence and atomic seal succeed.

## Clause disposition

| Existing clause | Prospective disposition | New obligation |
|---|---|---|
| M8 Data Initialization §25/§28 DI4 market loaded at initialization | SUPERSEDES_PROSPECTIVELY | DI4A capability qualification at initialization; DI4B observations at consumption |
| M8 §14/§28 DI8 freshness | EXTENDS / SUPERSEDES_PROSPECTIVELY market branch | DI8A durable reporting-cycle/reference policy qualified; DI8B market session freshness at consumption |
| M8 §22/§28 DI12 snapshot | EXTENDS / SUPERSEDES_PROSPECTIVELY initialization envelope | DI12A reproducible initialization manifest, DI12B immutable analysis, DI12C atomic decision envelope |
| M8 §23 PIT, §35 contract freeze | DOES_NOT_CHANGE | Use original versions for old artifacts; new contracts never recreate missing old raw |
| M1 current information / universe | EXTENDS | Exact approved session, durable security ID, full30 identity and source authority |
| M2 provenance / financial admission | DOES_NOT_CHANGE | Canonical accounting, provenance and restatement handling retained |
| M3 score/rank methodology | EXTENDS envelope only | Explicit full30/eligible29/deferred MBB; same arithmetic, no placeholder score or weight redistribution |
| M4 valuation / required return | EXTENDS | Fresh approved market dependencies before price-dependent analysis |
| M5 execution / capital / DCA | EXTENDS | Revalidate live dependencies and seal decision before capital authorization |
| M6 portfolio accounting | EXTENDS binding only | Original ledger, cash, positions, costs, pending transactions and NAV pins; no accounting redesign |
| M7 monitoring / cache | EXTENDS | Dependency-bound cache revalidation, expiry and ledger/reference/policy invalidation |

No approved M1–M7 baseline is edited. Historic DI4/8/12 FAIL, DI14 PENDING and DI15 FAIL remain historical facts. New results are candidates only.

## Version dispatch and activation

Separate versions: initialization-manifest-v1, market-data-capability-v1, market-snapshot-v1, analysis-snapshot-v1, portfolio-snapshot-binding-v1, decision-snapshot-v1; policy-b-ranking-envelope-v1. Legacy snapshot readers and required MARKET references are unchanged. Unknown versions/hash or index mismatches fail closed. New records use an additive immutable store; no destructive rollback or reinterpretation. Recovery: leave new tables dormant and use legacy readers; never delete accepted evidence to roll back.

Trusted composition must pin independent approvals and actual source adapters. Missing source/adapter/raw/known schema/approved session policy blocks. No default adapter is promoted from normalized manual prices or financial-report APIs. No background market refresh is installed. Retained market raw evidence is a replay dependency and excluded from disposable financial OCR cleanup.

DI4A requires real retained evidence, request identity, raw SHA256, source and retrieval/provider time, schema, normalizer and security mapping, units/price semantics, corporate-action basis, negative-case evidence and deterministic replay. Mocks qualify no production source. DI8A additionally requires independently pinned durable data-class policy; its reviewer validates reporting-cycle rules. DI12A binds exact masters, canonical facts, qualifications, release/partition, exceptions, software and capability. It contains no current quote dependency.

## Consumption and current information

MARKET_DATA_FRESHNESS_GATE uses approved, hash-pinned calendar/session windows, purpose, security coverage, field/basis and source/known-at cutoffs. No universal N-day threshold is introduced. Holiday/weekend windows explicitly name the required previous session. Unknown/ambiguous calendar, source conflict (including unapproved rounding/timestamp interpretations), adjustment, identity, unit or missing row blocks. Retrieval never substitutes trading time. A cached snapshot must pass the same gate; newer invalid data cannot fall back silently.

LIVE uses the trusted consumption clock; historical requests use actual then-known information and never refresh today's values into the past. Future fundamentals, universe, corporate actions, exceptions and source availability are rejected by evidence knowledge binding. Source/schema/calendar/policy revisions require new pins and qualification. Historical snapshots remain immutable evidence after expiry; initialization is not revoked merely as market data ages.

Price-independent FUNDAMENTAL_DESCRIPTION is the sole explicit no-market purpose, with no scores/ranks/valuation/capital authority. Fresh prices alone do not satisfy financial, qualitative, valuation, confidence, risk, portfolio or independent DI acceptance gates. M3 permanent technical/flow exclusion remains unchanged; separate workflows require separately approved prerequisites.

## Publication, current dependencies and rollout

The vNext BoundaryLifecycle requires accepted analysis and current portfolio binding, eligible ticker disposition, exact source/policy/model/engine identities, TCX exception and a recomputed freshness proof. Atomic publication transaction checks an authoritative dependency head and inserts envelope plus decision seal; failure exposes no decision. Dependency head must hash current universe, fundamental snapshot, ledger watermark, disposition, active exceptions, policy/model versions and source revisions. Every relevant write must update that head transactionally before production activation; no caller-controlled head is accepted. Analysis/decision reuse must revalidate at live consumption; historical replay reads original sealed versions.

Production activation is deliberately not configured: no independent DI14/15, approved source adapter/corpus or approved exchange calendar/session rules are available. Existing FORMAL server workflows are blocked at the prospective publication boundary until an accepted service is explicitly wired. Legacy pure calculations and immutable readers remain available for tests/replay, never a live authorization bypass.

MBB remains full-universe member, DEFERRED / INSUFFICIENT / NOT_SCORABLE. Missing authoritative consolidated CAR or qualifying CET1 applicable 2026-06-30 is unchanged. MBB may be priced for an already-held NAV position through PORTFOLIO_NAV; this cannot authorize new capital. TCX owner analytical exception remains ACTIVE for 5,284,485,167,173 VND; issuer-proven conventional debt is not asserted. VNM reported borrowings scope, VIB consolidated CAR11.8%/supporting NPL NOT_PROVEN and VIC reviewed consolidated6M2026 provenance remain unchanged.

## Blocker and approval

Preserve RELEASE-MARKET-SOURCE-REPLAY-UNAVAILABLE historically. Prospective children: MARKET_CAPABILITY_REPLAY_NOT_QUALIFIED (initialization qualification) and CURRENT_MARKET_SNAPSHOT_NOT_AVAILABLE (analysis readiness), both OPEN absent accepted proof. No severity downgrade or silent resolution. DI14 requires independent review; DI15 remains pending under vNext and historical FAIL remains unchanged. readyForScoring=false and decisionReady=false.
