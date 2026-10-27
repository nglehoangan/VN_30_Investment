# Current NAV requirements and baseline

2026-10-27 · Phase 3.1 DESIGN PROPOSAL ONLY. No calculator, adapter, schema validator, snapshot store, migration, acceptance artifact or Phase 3.2 implementation is created. Proposed amendments require explicit owner review.

Decision scope: design a separate **PORTFOLIO_NAV / POINT_VALUATION_ONLY** capability using the single transaction ledger. Initial valuation mode is latest completed qualified EOD, not a live account tick or a synthetic daily series. Proposed contracts have no effect until approved and implemented under a later explicit task.

BASELINE_IDENTITY.json identifies current assessment commit, validated implementation commit3cc3e51ca7f6113365f1d85e039003111cd757f3, source schema hash, actual schema digest and19applied/two prepared-unapplied migrations. Owner now approves Phase2.3v1.0; its215tests are retained evidence/hash-verified, **not rerun here or treated as NAV tests**. Actual accounting record remainsPROPOSED; accepted source/identity/independent/deployment gates remain blocked.

Required: exact portfolio perimeter/currency, one ledger revision and economic cutoff, complete current-scope assets/claims/obligations, exact identity, qualified price/session/adjustment evidence, comparable source reconciliation, independent acceptance, and revocation-aware owner scope. No lifetime cost/trade reconstruction or daily historical NAV is a prerequisite for a point valuation. Supported inception still bounds ledger replay; inception NAV remains necessary for since-inception economic P&L and legacy actionability, not point arithmetic.

Reuse inventory in COMPONENT_REUSE_INVENTORY.json. Existing valuePortfolio supplies arithmetic, but its VALID checks price coverage, not source authority, other-debt completeness, pending eligibility or final acceptance. PortfolioEngine.snapshot additionally requires inception/full reconciliation/reference readiness; preserve that contract. CurrentReadService.context only provides decision context on PASS; never let an informational NAV bypass it.

Initial exclusions: intraday/current-account-now valuation, FX, generic pending-right pricing, suspended/no-close carrying-price estimation, zero-price write-down, unsupported venue/class/fractional units, bitemporal AS_KNOWN API, persistence/scheduler and any real acceptance/provider installation. All held assets must be accounted for even if fundamentally DEFERRED/outside scoring membership; no omission of MBB or any unsupported holding to obtain NAV.
