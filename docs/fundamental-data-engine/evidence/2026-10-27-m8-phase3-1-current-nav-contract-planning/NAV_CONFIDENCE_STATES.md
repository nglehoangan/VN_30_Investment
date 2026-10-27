# NAV confidence states and compatibility amendment

2026-10-27 · Phase 3.1 DESIGN PROPOSAL ONLY. No calculator, adapter, schema validator, snapshot store, migration, acceptance artifact or Phase 3.2 implementation is created. Proposed amendments require explicit owner review.

Proposed additive namespace `current-nav-result-v1`; **no legacy status enum is edited**. Three confidence states are sufficient if paired with explicit scope/use permissions and component reasons; avoid another universal actionability taxonomy.

|navState|Deterministic criteria|Allowed numeric output/use|
|---|---|---|
|QUALIFIED_NAV|All mandatory point-scope accounting/identity/source/market/calendar/CA/time/reconciliation gates; approved purpose/profile/methodology; authenticated independent acceptance and owner scope; current revision/revocation proofs. All components complete and no unresolved required discrepancy|totalNav exactstring; indicativeValue null. Still not investment actionability/scoring or automatically official-performance/production-release permission|
|INDICATIVE_NAV|Explicitly requested observed-full-portfolio research scope; internally coherent, fully covered components/units and evidenced identity correspondence, no unknown/contradictory economic asset/obligation. Formal authority/independent acceptance may remain absent and is prominently flagged|totalNav null; indicativeValue exactstring and limitations mandatory. No official NAV/performance/risk/execution/scoring consumption|
|NAV_BLOCKED|Any mandatory input absent, contradictory, stale/unknown session, ambiguous identity/quantity/status, unknown cash/claim/liability, unsupported method/time/currency or no safe complete full-portfolio scope|totalNav null AND indicativeValue null. Separately labelled known-component research subtotals may be returned, with exclusions; never call them NAV or bounds|

Block conditions take precedence over indicative fallback: unknown105liability cannot become0 to get INDICATIVE_NAV; unaccepted/unexplained570kclaim is not usable automatically; missing pending price cannot disappear from full coverage. Formal acceptance absent alone may permit an explicitly scoped *complete observed arithmetic* indication, but no ticker-only relationship or unresolved economic ambiguity. INDICATIVE_NAV is opt-in, not automatic downgrade from a failed qualified request. A request for QUALIFIED_ONLY returns NAV_BLOCKED on failed gate.

Narrow security subtotal is scope SECURITIES_SUBTOTAL with a separate research payload, not a full INDICATIVE_NAV. Default full-portfolio state remains NAV_BLOCKED if missing components. Broker reported totals remain INDICATIVE_BROKER_VALUE observations, not recomputed NAV.

Compatibility: existing PortfolioValuation VALID proves arithmetic only; CurrentModel VALID/PASS and PortfolioEngine.snapshot include other prerequisites. Never map either mechanically to QUALIFIED_NAV. Existing NavUnavailable/authority placeholders remain OFFLINE_PREPARATION/UNAVAILABLE with no ACCEPTED state. Proposed future accepted-evidence port/result is separate and cannot be enabled by adding a boolean or JSONflag. Qualification is not release: officialUseEligible additionally requires explicit NAV operational publication acceptance, current liveness and applicable release requirements; production decision support retains M7 and all old gates. Synthetic Qtest never grants officialUseEligible.

Explicit amendment requests: new NAV-only result/scope; purpose-specific price policy; NAV-economic reconciliation/basis rule; normalized EODtimestamp semantics and session window mapping. Until owner adopts these, strict existing gates remain authoritative and no operational qualified result is available. This document itself does not make approvals effective.

Known integrity failure, retracted/revoked evidence or stale/unknown required session blocks full INDICATIVE_NAV as well; missing formal acceptance is not equivalent to known invalidity. No indicative fallback hides a failed mandatory economic/identity/time condition. Explicit non-NAV observed subcomponents may remain visible only with their failures/exclusions labelled.
