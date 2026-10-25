# NAV dependencies

Point valuation formula: `NAV(t) = settled CASH(t) + Σ held_quantity_i(t) × accepted_price_i(t) + RECEIVABLE(t) − PAYABLE(t)`. Exact decimal strings/BigInt arithmetic; no zero-filled missing security price. Withdrawable broker cash and pending dividends must not be double-counted. Cost basis supports unrealized P&L but does not replace price or market value.

|Dependency|Classification|Finding|Evidence|
|---|---|---|---|
|Cash|WORKING_WITH_LIMITATIONS|Exact opening CASH replay matches projection. No proof of completeness after 8 October.|ledger|
|Receivables|WORKING_WITH_LIMITATIONS|Nonzero opening obligation preserved; not spendable cash or new dividend income.|ledger|
|Payables|WORKING_WITH_LIMITATIONS|Retained replay returns zero, without proving no later external obligations.|ledger|
|Holdings and basis|WORKING_WITH_LIMITATIONS|Twelve opening transactions/24 legs reconstruct eleven holdings exactly.|ledger|
|Existing EOD normalizer|WORKING_WITH_LIMITATIONS|Active historical technical replay passes; no operational acceptance.|activeCandidate.fullPipelineReplay|
|Exact ledger-to-market identity|NOT_IMPLEMENTED|Zero of eleven ledger IDs match candidate UUIDs; eleven ticker correspondences are diagnostic only.|activeCandidate.heldIdentityCorrespondence|
|Accepted current held prices|BLOCKED|No MARKET record; active session expired; exact-ID held coverage zero.|activeCandidate.currentValuationProof|
|Valuation timestamp and calendar|BLOCKED|2026 calendar technically available; approved applicable session/purpose proof missing.|calendar|
|PORTFOLIO_NAV purpose|BLOCKED|Active policy and market purpose VALUATION cannot silently expand to PORTFOLIO_NAV.|activeCandidate.portfolioNavPurposeProof|
|Accepted source to current DTO composition|NOT_IMPLEMENTED|Existing LocalCurrentSource shape exists but no approved runtime bridge; marketCurrent false.|app/server/current.ts|
|Suspended/unavailable securities|WORKING_WITH_LIMITATIONS|Normalizer rejects halt/missing close; no qualified carry-forward policy. FPT_UNAVAILABLE is broker availability, not suspension proof.|tcbs-eod.ts; brokerSnapshots|
|Missing/conflicting prices|WORKING|Core contract returns blocked/null NAV; no zero or older-valid fallback. Synthetic negative tests verify contract only.|portfolio-read-models; market-boundary tests|
|As-of reconciliation|BLOCKED|No accepted contemporaneous current source/reconciliation loaded.|effectiveCurrentModel|
|Current sector/membership references|BLOCKED|Current model is unavailable; technical candidate identities do not certify current account/risk references.|current/read-model.ts|
|Priced imported inception/performance|BLOCKED|Opening facts alone lack accepted inception prices/reference baseline. Distinct from point NAV arithmetic.|portfolio/inception.ts|
|Provider access/refresh and current suspension state|NOT_TESTED|No external acquisition, credentials test or current exchange-status query.|Assessment scope|

Three distinct output levels must remain separate. Arithmetic point NAV needs correct balances/quantities, all held prices bound to the same eligible valuation horizon and exact security identity. An authoritative current valuation additionally needs accepted source, calendar/session/purpose/clock/version evidence and current-account completeness. Investment actionability further depends on reconciliation, references and workflow/policy gates; a priced inception baseline is needed for economic gain/performance, not to invent a point NAV. CurrentReadService can conceptually distinguish numeric valuation from blocked actionability; the actual runtime now withholds the entire market source and returns null NAV.

Latest completed EOD is the existing technical capability, not live intraday or execution eligibility. No automatic prior-close carry for suspended/unavailable stocks is approved. MBB's fundamental deferral does not permit omitting a held MBB position from NAV; its price/identity still needs independent valuation qualification. FPT_UNAVAILABLE broker rows are not an approved second security or permission to reassign ledger quantities.
