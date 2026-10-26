# Architecture decision — transaction accounting and snapshot NAV

Status: **architecture direction APPROVED BY OWNER; impact assessment DRAFT FOR OWNER REVIEW; implementation NOT AUTHORIZED**. This records the current task instruction, not an authenticated source/identity approval.

Daily Historical NAV is not a prerequisite for current portfolio management. Accounting remains immutable Transaction → TransactionLeg → versioned MWAC replay. Qualified valuation is a **dated derived snapshot** of a reconciled ledger state and accepted point-in-time prices/obligations. Performance and risk each expose their own evidence requirements. Historical daily reconstruction is optional enrichment, not fabricated data or a gate for ordinary ledger viewing.

This largely clarifies the existing design: DATA_MODEL §6.10 and PORTFOLIO §17 already allow reproducible valuation snapshots; valuePortfolio already values one state/time. No daily NAV query is called by current accounting or point valuation. The substantive changes are durable snapshot storage/query contracts, independent capability/readiness statuses and future performance/observed-risk analytics.

Preserve Investment Policy v1.1, Risk Policy v1.0, MWAC m63-mwac-decimal12-half-even-v1, exact reconciliation, source/purpose/identity/independent acceptance, no-login deferral and all frozen M7/M8 evidence. No policy, ORM schema, ledger or UI file is edited.

Direction approval does not waive incomplete obligations, pending-share identity/valuation, current market acceptance, supported-inception performance baseline or formal drawdown evidence. It does not approve new risk measurements as substitutes for existing policy. Proposed amendments are listed separately under D1–D9.

Readiness is per capability: accounting reconstruction may succeed when NAV is unavailable; current NAV may qualify without an inception valuation, but imported-inception economic P&L stays unavailable. Snapshot history may be sparse; no interpolation or automatic EOD schedule is introduced. Current NAV display is not investment actionability, D2 or scoring authority.

Final assessment status: READY_FOR_OWNER_REVIEW. Owner must authorize concrete implementation slices, method amendments and any future migration separately.
