# Proposed NAV purpose policy

Proposed identifier: `tcbs-completed-eod-portfolio-nav-v1`. This is a policy proposal, not a change to `eodPolicy`, an accepted SessionPolicy, or an extension of a VALUATION approval.

|Purpose|Meaning|Admission and outputs|Explicitly excluded|
|---|---|---|---|
|INDICATIVE_BROKER_VALUE|Historical broker-displayed holdings/price totals at their own capture times|Display original source, timestamps and limitations; no accepted NAV assertion|No current-account, approved price, valuation freshness, trade permission or score claim|
|PORTFOLIO_NAV|Exact point valuation of the bound portfolio at a completed EOD instant|Requires NAV-specific source/policy/calendar/bridge acceptance, held coverage and ledger/time binding; read-only exact NAV result|No investment actionability, new-capital, DCA, execution, ranking or scoring authorization|
|INVESTMENT_ACTIONABILITY|Whether current investment workflow/risk/reconciliation conditions authorize an action|Existing independent workflow and current-context gates remain in force|Cannot be inferred from positive NAV, a valid bridge or market coverage|
|PRODUCTION_SCORING|Approved dataset/model/policy execution and resulting formal artifacts|Existing financial source admission, independent acceptance and scoring activation requirements remain unchanged|No activation from NAV availability; no removal of MBB financial deferral or eight DEFERRED candidates|

A future NAV-specific market envelope must declare purpose PORTFOLIO_NAV and bind the exact source contract, purpose-specific policy hash and approved calendar. Reuse verified raw captures only through explicit normalization/replay and a new correctly scoped envelope; never mutate an old sealed MARKET body or treat its VALUATION purpose as a wildcard. Existing VALUATION candidates remain intact, historical and unapproved for NAV.

The authority gate must verify all of: authenticated approval scope, nonrevocation, portfolio and security identities, bridge/version, source/schema/normalizer/units, applicable session/purpose/calendar, source availability and request time, captured evidence hashes, exact held set and ledger watermark. An approval for a different ticker, portfolio, venue, share class, date or purpose cannot expand through a broader loader configuration.

The proposed separate NAV result carries classification PORTFOLIO_NAV only after acceptance. It also carries `investmentActionabilityAuthorized=false` and `scoringAuthorized=false`. A diagnostic value, if implemented/tested later, must stay visibly unaccepted or SYNTHETIC_TEST and cannot populate the official current NAV slot. Any missing mandatory NAV dependency withholds the total; a partial subtotal may only be separately labelled partial/indicative with missing holdings, never NAV.

Do not implement NAV by opening `CurrentReadService.context()`, injecting a FORMAL LocalCurrentSource or setting global marketCurrent=true. That service can return a downstream decision context when its existing gates pass. A narrowly typed NAV-only service/DTO avoids that capability expansion. CurrentReadService, financial admissions and scoring/workflow composition remain unchanged under this proposal.

A currently held security requires pricing even if outside VN30 or fundamentally DEFERRED. NAV cannot drop MBB or another holding to obtain full coverage. Unsupported venues/classes block this TCBS/HOSE-only proposal until a separate source/policy decision; universe membership is neither a price acceptance rule nor permission to liquidate.
