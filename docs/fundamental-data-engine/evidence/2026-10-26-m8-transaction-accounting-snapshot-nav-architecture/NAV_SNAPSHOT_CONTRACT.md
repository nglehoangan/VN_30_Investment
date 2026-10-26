# Proposed NAV snapshot contract — design only

Proposed identifier `portfolio-nav-snapshot-v1`; no TypeScript/JSON schema/migration is implemented. It is **separate** from nav-source-preparation-v1 and existing offline authority placeholders; those remain unavailable and must never be upgraded by accepting this document.

## Required scope and inputs

- Portfolio/perimeter, VND currency, valuationAt UTC, Vietnam tradingDate/session, purpose PORTFOLIO_NAV; distinguish valuationAt, market observedAt, receivedAt, knowledgeCutoff and calculatedAt. No future information or backdating publication/knowledge.
- Immutable ledger revision/watermark, supported inception, exact transaction/source IDs and content hashes, reconstructed state hash, original accounting/methodology version. Historical knowledge mode must exclude evidence not known by cutoff; retrospective observations retain actual later knownAt.
- Exact ledger/market namespaces and instrument UUID/code/ISIN/venue/class, **accepted** bridge version and effective/knowledge coverage for valuation date, independent authority references and current revocation evidence. No ticker-only mapping.
- Per-position ordinary/pending/entitled/tradable classification, quantities, approved claim/CA terms and basis; exact price decimal string, units/multiplier/currency, field/RAW semantics, source raw hash/pointer, source/schema/normalizer version, date/calendar/session completion and freshness evidence. Cover every held asset regardless of fundamental scoring eligibility.
- Settled cash, trade/nontrade receivables and payables/other debt as disjoint components, exact linked event IDs and amounts. Complete obligation/reconciliation coverage with verified-zero assertions where genuinely zero; unknown fields must not become zero. Include known withheld tax/fees/accrual treatment under approved method. Pending claims must be valued by accepted policy or NAV unavailable.
- Exact comparable broker reconciliation evidence, differences, unresolved flags, identity/source/independent acceptance chain, software/code pins, calculation method/version and all evidence content hashes. Cost reconciliation policy remains exact; scope-specific diagnostics cannot impersonate full MATCH.

## Result and status separation

`NAV = ordinary/pending/other accepted asset values + settledCash + tradeReceivables + otherReceivables − tradePayables − otherLiabilities`, with no component in two buckets. Output totals and per-position values use exact decimal strings.

Maintain distinct fields: accountingIntegrity; componentCompleteness; pointValuationQuality; reconciliationQuality; sourceAuthority; identityAcceptance; inceptionPerformanceBaselineQuality; riskCoverage; acceptanceState; effectiveCurrentEligibility; actionability. A missing imported inception price may block economic P&L/actionability while an otherwise qualified **NAV-only** result is displayable after explicit contract approval; missing current cash/claim/debt/price cannot.

Proposed computation status VALID/UNAVAILABLE with structured reasons and nav=null when required inputs unknown. Diagnostic partial subtotals can be separately named, never numeric official NAV. Proposed record kind COMPUTED_NAV vs BROKER_REPORTED_OBSERVATION must stay distinct; broker totals are reconciliation evidence until independently qualified. Never mark a broker report as a recomputed accepted snapshot by copying its value.

No generic FORMAL flag overrides source purpose or downstream authorization. Current NAV, current management observations, investment actionability and production scoring are separate. Inception status and risk gaps remain explicit. Accepted historical snapshot is not necessarily eligible as current: current reads re-evaluate freshness, latest accepted calendar session, ledger watermark and authority/revocation heads.

## Storage, correction, concurrency

Payload content hash uses canonical serialization, immutable source refs and ordered content under a pinned algorithm; cryptographic integrity is not trusted time or external tamper prevention. Separate actual audit timestamps/actor proofs from business inputs. Idempotency key binds portfolio, valuationAt, knowledge mode/cutoff, ledger revision, every evidence/method hash and request identity. A duplicate exact input returns original result/receipt, not a new timestamped duplicate; same request key with changed inputs rejects.

New content/run/lineage tables preferred over PortfolioProjection or Scorecard/Ranking table coercion; exact additive shape subject to D3. Persist snapshot and audit atomically using existing transaction owner; check current revision/evidence heads and conflicts before commit. Roll back all new records on failure, never mutate ledger as a side effect. Concurrency tests require one effective accepted lineage, distinct immutable corrected revisions and no last-writer authority escalation.

Correction fixes upstream accounting/evidence through separately approved process, then creates new snapshot hash/supersedes edge with reason and actual knownAt; old payload survives. Acceptance/revocation/supersession are append-only decisions bound to exact hashes, not mutable financial fields. Reject ambiguous overlapping effective heads. Historical query supports original as-known and later-restated views, never silently replaces the former. Backups/restore verify trusted heads where required; SQLite triggers/hashes alone do not prove rollback resistance.

Snapshot cadence proposed: on-demand qualified latest completed EOD, plus explicit review/flow-time observations when evidence exists. No mandatory daily backfill, automatic scheduler, new provider, migration execution or scoring activation approved.
