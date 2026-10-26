# Exchange and depository reference coverage

Retained 13/10 HOSE current-list JSON supplies exact ticker/ISIN matches for all 11 holdings (EXCHANGE_REFERENCE_INSPECTION.json includes source hash and per-row pointers). July constituent PDF/text and receipt metadata add issuer/name/membership context. Additional retained 16/10 current-api and dated/pre-effective index-history JSON files were inspected and pinned; their index-history purpose does not create account identity or issuer lifecycle coverage.

|Evidence class|Classification|What remains missing|
|---|---|---|
|HOSE ticker/ISIN list|AVAILABLE_BUT_INSUFFICIENT|Formal source qualification and dated continuity; no linkage to account ledger ID|
|HOSE constituent/index history|AVAILABLE_BUT_INSUFFICIENT|Membership effective dates do not prove security identity effective intervals|
|TCBS depository=001|AVAILABLE_BUT_INSUFFICIENT|Not a VSDC record or certificate|
|Retained primary VSD/VSDC registration/lifecycle document|NOT_AVAILABLE|No exact primary record located in inspected reference scope|
|Original registration + lifecycle/action notices for target identities|REQUIRES_EXTERNAL_ACQUISITION|Obtain exact primary documents covering identities/intervals; no guessed URLs/endpoints|

HOSE/VSDC evidence can corroborate stable instrument identity, venue/class and action boundaries. It cannot by itself prove which instrument an account’s ticker-only opening position represented; the broker-side anchor/addendum remains necessary. No claim that original publication time equals local receivedAt. No current web search/API call was made under this task’s offline restriction.
