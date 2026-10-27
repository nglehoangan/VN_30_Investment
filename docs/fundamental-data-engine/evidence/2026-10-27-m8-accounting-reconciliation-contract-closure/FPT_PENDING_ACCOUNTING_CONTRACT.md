# FPT pending accounting contract

Assessment date: 2026-10-27 (Asia/Ho_Chi_Minh). Phase 1 design/evidence closure only. Owner approved the prior architecture assessment as baseline v1.0 in the current task; this is not authenticated source/identity acceptance or Phase 2 authorization. Original baselines and sealed evidence remain unchanged. SOURCE_REFERENCES.json pins inspected files; JSON Pointers below address those pinned bytes.

Evidence: prior FPT_QUANTITY_RECONCILIATION.json; READ_ONLY_RECONCILIATION.json `/fptAssetObservations` and `/brokerSnapshots`; source statement `/rows` FPT and FPT_WFT. Broker ordinary200 + pending20, economic aggregate220. Source4.14 totalQtty220 / availableTrading200 / stockDividend20 persists in retained observations. Local FPT_UNAVAILABLE is a derived availability bucket, not a stable provider identity. Owner eventual-conversion statement is an attestation; conversion date remains UNKNOWN.

|Field|Current evidence|Contract|
|---|---|---|
|ledgerSecurityId|FPT original exact ID|Never rewrite|
|economicOwnershipQuantity|220 aggregate imported|Do not add another20|
|availableTradingQuantity|200 at retained observation times|Not current proof without fresh status|
|pendingQuantity|20 at retained observation times|Disjoint from available; not automatically saleable|
|corporateActionIdentity|UNKNOWN exact accepted action|Require issuer terms + account entitlement linkage|
|recognitionDate|UNKNOWN historical entitlement|Opening contains aggregate as08/10; not a legal recognition-date witness|
|conversionDate|UNKNOWN|No inferred date from eventual owner statement, ratio or record date|
|valuationEligibility|BLOCKED exact pending policy/identity|Ordinary-price substitution for pending forbidden without separately approved evidence/policy|
|costBasisAllocation|Imported total16065060; broker displayed14604600+1460460|Observation-level split; independent MWAC/allocation acceptance unresolved|

Proposed additive status subledger keyed by original security ID+exact action/claim ID, with evidence-bound effective/knowledge intervals. Sum disjoint status quantities = economic aggregate; overlapping mortgaged/blocked tags must not be added as extra holdings. Pending→available conversion is status−20/+20, aggregate delta0, aggregate basis delta0, cash/flow/income delta0. Do not implement as BUY, new stock dividend or duplicate SECURITY_QUANTITY credit. Existing aggregate220 retains immutable opening facts; an evidenced opening status overlay can describe it, but cannot fabricate historical action/recognition dates or acceptance.

A genuine entitlement newly recognized after opening is a separate quantity/basis event under exact approved action terms; conversion alone is not recognition. Existing corporate-action code supports specific split/rights/merger/spinoff cases, not a generic pending status transfer or automatic stock-dividend credit. Do not repurpose SPLIT merely to fit missing action terms. Corporate-action basis conservation is required; imported broker equal unit costs are not proof that future allotments add acquisition cost. Missing accepted allocation blocks affected basis/P&L/valuation, while raw aggregate observation can be displayed with limitations.

Require account-specific credited/conversion history and issuer action/trading-availability notices for intended interval. A dated current state can establish prospective availability if accepted without proving the past conversion date; historic interval remains UNKNOWN. Identity bridge acceptance unchanged, no ticker-only link.
