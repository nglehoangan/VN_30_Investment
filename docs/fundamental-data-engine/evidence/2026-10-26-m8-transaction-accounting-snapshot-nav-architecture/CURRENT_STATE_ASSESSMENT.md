# Current state assessment

All repository references/hashes and line anchors are in SOURCE_REFERENCES.json. Actual SQLite SELECT-only facts are in READ_ONLY_DATABASE_FACTS.json. No live runtime acceptance or new implementation test pass is claimed.

## Verified architecture

- transaction.ts / reconstruct.ts / values.ts: immutable event+leg accounting, trade-date quantity and linked cash settlement, explicit deposits/withdrawals, actual dividend receipt, corporate-action stages, reversals, versioned exact-decimal MWAC. No historical market price needed for posting/replay.
- valuation.ts: point NAV = market value + cash + receivables − payables. Missing/stale/conflicting prices block; economicGainSinceSupportedInception additionally needs valid imported opening valuation. No daily series used.
- engine.ts: snapshot() composes replay, valuation, reconciliation and effective references. Its **composite VALID/actionability** requires inception.status VALID; this is a supported-inception valuation dependency, **not a complete daily NAV dependency**. CurrentReadService can expose valuation numeric data separately in some blocked cases, but context() demands full actionability.
- app/server/current.ts only opens LocalCurrentSource if marketCurrent is true. Market/source authority remains fail-closed. Offline nav-preparation contracts always return UNAVAILABLE/no accepted mapping and cannot be promoted by this architecture assessment.
- portfolio_projection stores one rebuildable accounting cache; it is not an accepted historical NAV snapshot store. AnalyticalArtifact repository explicitly accepts Scorecard|Ranking only; SQL kind String does not make it a general NAV repository. Prisma schema has no dedicated portfolio valuation snapshot persistence/API.
- ui/dashboard.tsx displays realized P&L/net dividends from reconstructed state; NAV history, benchmark and TWR/XIRR/CAGR are null. Risk view explicitly unavailable. Only app/api/readiness/route.ts was found for readiness; no implemented NAV history API or standalone XIRR/drawdown engine was identified in inspected src/app.

## Actual data versus code capability

Retained database: 12 opening transactions,24 legs,11 security/position identities,0 corporate_action_reference rows,1 accounting projection,450 broker observations. Supported inception/asOf is 08/10/2026, not a certified zero state30/06/2025. New source evidence contains17 executions and29 securities events,93 cash rows through26/10; these have not been imported/admitted. Most trades precede supported inception and cannot simply be appended into the same book. Do not add both opening positions and their historical purchases.

MWG95,000 cash payment16/10, legacy GAS475,000+MWG95,000 receivable aggregation, PDF500,000 cash-equivalent residual/105 borrowing, FPT200 available+20 pending versus aggregate ledger220, and broker cost differences remain exact reconciliation/semantics work. A working replay of an old opening does not establish current external completeness.

**Specific contract gap:** DIVIDEND_CASH emits cash/income only; it does not clear an opening receivable. TRADE_SETTLEMENT requires an originating BUY/SELL. Posting MWG95,000 as an ordinary dividend while retaining the opening570,000 would duplicate the claim. A reviewed, versioned non-trade obligation settlement/correction contract may be needed (D4); no workaround or synthetic cash adjustment authorized.

## Dependencies actually found

|Dependency|Actual scope|Effect of direction|
|---|---|---|
|Complete daily historical NAV|No core accounting/current valuation hard dependency found|Do not create one|
|Imported supported inception valuation|Absolute P&L, composite snapshot/actionability/scoring integrity|Retain for those purposes; propose separate NAV-only capability without relaxing actionability|
|Flow-adjusted series / HWM|Risk Policy §5.2, portfolio risk input, M7 Risk Gate6, strategy TWR/benchmark review|Sparse observed metrics require coverage disclosure and proposed amendment; no automatic replacement|
|Historical validation campaign|M7 historical gate and research methodology assessment|Optional for new current-NAV feature input, not automatically waived for broad M7 real-money release claims|
|Historical NAV reports|Current M8 offline review reports incompleteness, not a runtime gate|Preserve audit history; update future readiness scope additively|

## M7/M8 baseline qualification

Retained M7 FINAL_VALIDATION_REPORT.md is version0.1, candidate/awaiting approval and states DO NOT RELEASE AS VALIDATED FOR REAL-MONEY DECISION SUPPORT; Gates2–6 independent proof, historical/paper/operational evidence remain limitations in that report. Some parent baselines are described as approved while headers remain candidate. No verified unrestricted-release receipt resolving this contradiction was established in this assessment. Preserve validated components; do not claim the direction creates M7 certification. Two referenced files PORTFOLIO_DCA_VALIDATION.md and HISTORICAL_RESULTS.md are absent from docs/07_VALIDATION inventory; exact manifest/approval resolution is D8.

M8_LOCAL_READINESS_CURRENT.md still describes the original ledger blocker even though later owner-reviewed ledger remediation exists. It is a stale summary pointer, not a new implementation defect; propose an additive current-status update without rewriting sealed old reports. Daily historical price review is PARTIAL_PRICE_COVERAGE, but this is optional current-NAV enrichment after direction approval; current snapshot-specific economic/authority gaps remain blockers.
