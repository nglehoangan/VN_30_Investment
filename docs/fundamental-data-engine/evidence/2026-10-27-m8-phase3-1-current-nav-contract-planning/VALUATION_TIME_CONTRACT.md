# Valuation time and knowledge consistency

2026-10-27 · Phase 3.1 DESIGN PROPOSAL ONLY. No calculator, adapter, schema validator, snapshot store, migration, acceptance artifact or Phase 3.2 implementation is created. Proposed amendments require explicit owner review.

Request proposal: portfolio/perimeter; valuationMode=LATEST_COMPLETED_EOD; purpose=PORTFOLIO_NAV; requestedAt; valuationAt=T resolved from accepted session; tradingDate/timezone; knowledgeCutoff=K; calculatedAt=C; one ledger revision/state hash; evidence/acceptance/revocation heads. Enforce T≤K≤C and requestedAt≤C, using qualified server clock health/replay policy. OSusername/Date or local hashes alone are not trusted acceptance time.

|Observation|Required temporal binding|
|---|---|
|Ledger holdings/cash/claims/payables|Reconstruct effective legs atT from pinned accepted revision; complete relevant interval and identity/action dependencies|
|Broker cash/quantity reconciliation|Explicit economic as-ofT or certified interval/complete roll-forward toT; retrieval time alone is insufficient|
|Price|Exact accepted sessionS close/economic period; no observation afterT substituted. Actual provider time may beunknown, separately declared normalized boundary is not invented ticktime|
|Claim/liability recognition|Known entitlement/obligation effective no laterT and exact residual atT; late payment does not erase earlier claim|
|Evidence knowledge/acceptance|Actual known/retrieved/recorded timestamps≤K≤C; authentic purpose/effective scope; never backdated toT|

Same capture/same session does not guarantee simultaneous account cash and positions. Date-only cash/quantity/event evidence blocks ordering unless accepted source explicitly certifies an end-of-session state and full intervening coverage; no guessedmidnight. A date-labelled final EODprice may use accepted session normalization while providerPriceAt remainsnull; mere date without finality/session proof blocks. Reconcile different dates only by complete evidenced movements, not amount equality.

Initial request is a **dated latest-completed-EOD** value, not current-account-now. Known events afterT must not be added toT'scash/quantity. If they exist—or interval continuity is unknown—representsCurrentAccountNow=false and downstream live/execution use blocked. A qualified EODpoint may remain a dated historical/latest-session result with that limitation; request CURRENT_ACCOUNT_NOW is unsupported. Do not change legacy CurrentReadService's stricter STALE_PORTFOLIO behavior to manufacture a live label.

Late-arriving actual event effective≤T invalidates earlier current eligibility; replay only after authorized upstream posting, create a newly restated result with real knowledge time/revision, preserve old evidence. Corrected historical price/ledger records produce separate superseding content; never rewrite originals. If revision/authority/source/calendar heads change during calculation, abort/retry or return NAV_BLOCKED, never publish mixed versions. Recheck freshness/revocation at consumption.

Initial knowledgeMode=RETROSPECTIVE (as known by actualK now), labelled accordingly. An EODbar retrieved afterT can support retrospective valuation if economic session matches; this is not evidence known atT. Existing reconstructPortfolio does not filter knowledge time or close dependencies for AS_KNOWN. Such query mode is **NOT_IMPLEMENTED**, must return NAV_BLOCKED/BITEMPORAL_QUERY_UNSUPPORTED until separately approved and implemented. Stored timestamps do not by themselves create bitemporal support.
