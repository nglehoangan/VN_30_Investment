# Broker identity fields actually observed

|Source|Retained captures|Observed identity fields|Can establish exact ledger→market identity?|
|---|---|---|---|
|Original BROKER_SNAPSHOT|12 total snapshots; opening body located by source hash|positions[].symbol, status, quantity, unitCost/openCost/price; no stable instrument code/ISIN|No: anchor to ledger origin only|
|4.14 account assets|11 DB captures; 21/10 raw with 11 stock rows|stock[].symbol, secType, secTypeName, sbType; account identity in parent (redacted here)|No stable code/ISIN/exchange in position row|
|4.4 orders|11 DB captures plus 21/10 raw|Wrapper pageSize/pageIndex/totalCount/data; no populated rows|No actual order instrument schema observed|
|4.6 matching details|10 DB captures plus 21/10 raw|Wrapper pageSize/pageIndex/totalCount/data; empty data array|No historical fill/confirmation or stable field observed|
|4.13 legacy|10 DB captures|Paged content empty|No usable instrument evidence; not original trade proof|
|4.16 cash statements|10 DB captures; 21/10 HTTP400|response.data empty in DB; failed capture has no usable successful raw response|No|
|4.17 debt|10 DB captures; 21/10 HTTP400|response.data empty|No|
|5.11 security master|111 DB captures plus selected raw master|content[].codeId, isinCode, symbol, tradePlace, secType, status, halt, issuerId; securitiesInfo.codeId/symbol|Stable market-side identity only|
|4.7 purchasing power|21/10 raw inspected|symbol, accountNo/custodyID; price/quantity/power fields|No; not a trade confirmation|

Every exact observed field path and occurrence count is in BROKER_RESPONSE_SCHEMA_INVENTORY.json and RAW_ACCOUNT_CAPTURE_INVENTORY.json, with exact hashes. No account numbers or names are copied into the report. Stable depository field in 5.11 is provider code metadata, not a primary registration certificate. Listing/issue/reference dates and adjustment rates are not a mapping effective interval or corporate-action clearance.

Existing implementation endpoints: 4.14 GET /aion/v1/accounts/{accountNo}/se; 4.4 GET /aion/v1/accounts/{accountNo}/orders; 4.6 GET /aion/v1/accounts/{accountNo}/matching-details; 4.16 GET /erebos/v2/digital/trans-hist-cashStatements; 5.11 GET /ananke/v1/securities. Complete implemented catalog preserved in ENDPOINT_REVIEW.json. No verified account endpoint returns codeId/ISIN in retained responses. An unobserved schema might differ, but is not claimed as supported.

Do not use --from/--to to request historical fills: current parser applies them to cash/debt history only. 4.4/4.6 implementation supplies no historical-date selector and does not establish complete historical pagination. Do not rerun a broad account capture solely for identity unless TCBS confirms an endpoint/request that returns the missing stable fields and historical coverage. Existing script default has account activity; --market-only deliberately omits it. No script was executed here.
