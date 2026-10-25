# M8 NAV source and identity architecture closure

Final status: **READY_FOR_OWNER_REVIEW**. Architecture proposal only; not owner-approved, implemented or operationally accepted.

The owner explicitly approved the preceding market/NAV readiness assessment and requested this design on 2026-10-25. That instruction does not approve market data or authorize any implementation phase.

The proposed minimum path reuses existing TCBS exact EOD normalization, versioned calendar/purpose contracts, immutable ledger reads and exact NAV arithmetic. A separate immutable evidence-backed bridge resolves ledger IDs to market UUIDs without rewriting history. A narrowly typed NAV-only result/read service prevents portfolio valuation from enabling CurrentReadService decision context, investment actionability or production scoring. Existing global/current-source gates remain unchanged.

Read-only inspection confirmed eleven ticker-shaped ledger identities versus eleven corresponding UUID identities in the active thirty-security candidate. Exact 5.11 captures include code/ISIN/venue/class, and 111 older broker identity observations match those identifiers. Original opening source references and aggregate hashes are retained. These are diagnostic evidence for later qualification, not accepted mappings. Source-effective dates, ledger instrument continuity, corporate-action boundaries, independent acceptance and current session qualification must still be established. Candidate-generated dates and ticker equality are not substitutes.

INDICATIVE_BROKER_VALUE, PORTFOLIO_NAV, INVESTMENT_ACTIONABILITY and PRODUCTION_SCORING are explicitly separated. A new NAV-purpose decision/envelope is required; VALUATION scope cannot silently expand. Missing/ambiguous identities, unavailable or halted prices, future/expired/unknown session evidence, unsupported adjustments and revocations block official NAV. No arbitrary stale-price day threshold or price substitution is proposed.

The owner's no-login decision is preserved. Later explicitly authorized bridge/parser/contract tests may run offline without granting authority. Authenticated independent acceptance and effective NAV remain blocked while their operational identity/audit prerequisites are deferred; no local JSON, OS username or Codex output replaces approval.

Six phases are documented and all remain NOT_STARTED: identity bridge; NAV-specific contracts; current EOD capture; independent acceptance; NAV runtime integration; reconciliation/operational acceptance. Phase-specific owner decisions and future negative tests are listed. No phase, provider, login/session, migration, capture or adapter was implemented here. Ordinary local portfolio and research remain unchanged.

All seven requested design documents are supplied in this directory. INSPECTED_EVIDENCE.json pins exact source references and diagnostic identity evidence; DESIGN_VALIDATION.json and SAFETY_VERIFICATION.json record document/protected-input verification, not independent operational acceptance. Original database, transaction history, source files, application code and frozen investment policies are unchanged. Eight financial source candidates remain DEFERRED; no market source approval, D2 or scoring activation is created.

Await explicit owner review of this architecture. Stop after design; no new milestone or implementation starts automatically.
