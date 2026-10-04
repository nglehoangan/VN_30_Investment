# M6.7.1 remediation report

## M67-R1-M01 — current read-model composition

`LocalCurrentSource` consumes normalized, bounded local source records configured server-side. `CurrentReadService` reconstructs accounting via M6.3, passes validated observations/references/independent reconciliation to `PortfolioEngine.snapshot`, and derives the existing M6.5 field-scoped context. Dashboard, Holdings and Data Status consume `CurrentModel` with final decimal strings, source timestamps and statuses.

M6.3 owns quantity, cost, realized P&L, cash, obligations, market valuation, unrealized P&L, NAV and portfolio weights. NAV includes receivables and subtracts payables. Sector sums are informational application query results with effective-dated taxonomy; they cannot authorize sector risk. React performs no financial calculations or readiness derivation.

Missing, unknown, stale, conflicted, adjusted-only or invalid latest prices suppress current valuation; there is no zero/old-quote/synthetic fallback. Unknown freshness is explicit when source validity policy is absent. Reconciliation remains the existing independent-evidence comparison, not a successful-query badge. Current readiness fails closed on missing reconciliation, source/ledger changes, synthetic scope and unsupported inception. Accounting values remain unchanged by source prices. Historical detail labels remain distinct from CURRENT READ MODEL.

## M67-R1-M02 — production initiation

Review Center links to `/reviews/new`. The client submits only strict review type, date and optional posted contribution/verified-event references. No snapshot, score, state, cash, NAV, candidates, policy, cutoff or derived outcome is accepted. The server enforces the existing local Origin/Host boundary and resolves the only supported portfolio and configured normalized source.

`ReviewInitiationService` composes the current snapshot, independent reconciliation, provenance-backed analyst evidence and required immutable analytical/decision artifacts. Monthly scorecards must embed the selected reference dataset and taxonomy; matching version labels alone cannot hide different reference records. It constructs a bounded FORMAL M6.6 `ReviewCommand`; `WorkflowEngine` and the replaying persistence adapter retain disposition/allocation authority. No ledger-posting capability is passed to this workflow service.

Weekly requires all approved surveillance sections and does not force scoring/decision/trade. Monthly requires current formal artifact lineage and validates the posted contribution exactly once; M6.6 allows HOLD CASH. Quarterly requires held-security fundamental areas and thesis input. Annual requires approved area coverage and separate governance recommendation, without policy mutation. Event-driven requires a verified referenced trigger and evidence; arbitrary text alone is blocked. Missing analyst/analytical evidence returns INPUT REQUIRED, missing source returns UNAVAILABLE, and invalid/integrity/synthetic state returns BLOCKED. No fake formal success is returned.

Preview never persists. Review IDs hash the strict intent and captured dataset/ledger/analyst/snapshot scope, including normalized source content. M6.6 identity uniqueness and existing transactional persistence enforce duplicate prevention. Creation rechecks current source/context before persistence; stale source or ledger fails closed. Confirmed accounting transaction architecture remains unchanged.

## Evidence and scope

See ARCHITECTURE_AUDIT.md for ownership/contracts, SOURCE_OPERATION.md for normalized source operation, and VALIDATION_REPORT.md for actual command and screenshot evidence. Test-only production-path fixtures remain confined to disposable databases; no synthetic source can satisfy production initiation readiness.

Deferred UI-CR-03 remains: benchmark/history, full imports, independent journal authoring and pagination polish. No broad presentation rewrite. Existing long evidence tables remain one Minor issue. No production vendor or credentials are required for normalized local operation.

M6.8 functionality implemented: NO.

Final finding disposition: Critical unresolved = 0 identified; Major unresolved = 0 identified (both requested boundaries implemented); Minor unresolved = 1 retained presentation issue. Independent review remains the acceptance authority. Runtime readiness is conditional on actual approved source data and analyst evidence, not test fixtures.
