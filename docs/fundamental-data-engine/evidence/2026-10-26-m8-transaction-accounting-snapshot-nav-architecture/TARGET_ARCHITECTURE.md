# Target architecture

## A. Transaction-based accounting

Reuse PortfolioLedger/PortfolioEngine, immutable facts/legs and versioned exact-decimal MWAC. Keep cash settlement distinct from economic ownership. Dividends, fees/taxes and issuer events each have unique source/event scope and explicit effective/knowledge timestamps. Book mutations use existing atomic revision/CAS/idempotency/rollback infrastructure, original-fact integrity and reversal/correction groups. No independent editable cash/holdings/basis truth. Reconcile broker observations to exact comparable date/scope; external records cannot silently repair a mismatch.

Minimum operational start is an independently reconciled **supported opening plus complete forward events**, not a fabricated lifetime book. Earlier verified trades remain an offline historical evidence set unless an owner-authorized audited rebase/new versioned book is approved. Forward import must link actual post-opening cash/entitlement movements without counting old purchases/opening capital twice. Preserve pending availability and economic entitlements; zero cash paid at bonus credit does not imply a freely chosen basis.

## B. Snapshot-based NAV

Proposed additive NavSnapshotService reads a pinned ledger revision/asOf, exact source/calendar/identity authority, raw point prices and complete obligations; it does not call global CurrentReadService.context to obtain permission or reuse scoring scope. Calculate NAV using valuation math only after all NAV inputs qualify. Persist derived snapshot plus audit/lineage in one approved Prisma/SQLite transaction with expected revision and input-head recheck. Reject stale composition; no blind retry, auto-source approval or provider installation.

PortfolioProjection remains disposable replay cache; analytical score/ranking repository remains unchanged. Preferred storage is a small dedicated append-only NAV content/run/lineage repository, with ordinary indexes for portfolio/asOf/current accepted lineage. Exact table shape and additive migration are future D3 approval, not SQL authored here. Do not introduce an event bus, new database or IdP.

Separate snapshot historical validity, source/acceptance state, eligibility as current and downstream actionability. A valid old snapshot remains truthful for its original asOf but cannot masquerade as current; revoked evidence can disqualify current reuse while original bytes remain audited. Corrections generate a new content hash/supersedes link after upstream facts/evidence are corrected. No UPDATE of snapshot NAV to make reconciliation pass.

## C. Performance and risk readers

PerformanceReader consumes scoped external capital-flow events, required endpoints and accepted snapshot revisions. Realized P&L uses replay without price history; unrealized P&L uses qualified current prices/basis. Absolute economic change needs beginning NAV and all interval flows. XIRR needs dated investor capital flows and valid terminal valuation, not daily NAV. Snapshot interval return/TWR needs flow-neutral comparison; flow-time valuation/unitization cannot be fabricated between sparse samples.

RiskReader consumes one qualified snapshot for same-time NAV weights, cash/obligation capacity and concentration, plus effective sector/identity coverage. Observed drawdown is a separate sparse, flow-adjusted metric only where comparable units/flow handling exist. Unknown history/peak coverage does not map to NORMAL. Existing decision/scoring adapters continue to require all their original gates; no valuation-only snapshot grants actionability.

Local viewing and evidence preparation remain no-login. Authenticated source/identity/independent acceptance remains blocked until a separately approved mechanism exists. This design creates neither local substitute signatures nor authenticated roles. Daily history/benchmark enhancement is a later optional workstream, not required for an otherwise complete current snapshot.
