# NAV holdings coverage

Actual SQLite opened read-only for inspection and transaction/leg replay; authoritative repository read + PortfolioEngine reconstruction also performed with SELECT-only operations. See LEDGER_REPLAY_RESULTS.json. All 12 original POSTED transactions and 24 legs replay exactly, 11 holdings, cash/receivables/cost basis match saved projection, integrity_check ok, no FK violations. Quantities and security IDs were not changed.

|Ledger security ID|Ticker correspondence|Market UUID|Accepted bridge|
|---|---|---|---|
|FPT|1|ec91b3cb-8eab-45ae-95e7-738bb3c7de52|No|
|GAS|1|b56425c0-fc3e-4b56-a8de-a9a537d05b58|No|
|HPG|1|ee1da5cd-aedc-4567-98a6-d525b8c79ebc|No|
|MBB|1|ff699c86-8eaf-4178-af14-0b38fd5b1255|No|
|MWG|1|3376630f-ec27-4d02-9168-b2274d6abdb7|No|
|SSI|1|483a7e5c-ae5d-456d-840e-54433896ad43|No|
|TCB|1|2a3c69b1-08aa-473c-bbd5-92d096a0d23a|No|
|VCB|1|32002fe9-b6cd-4760-91ba-8b7a59d4758e|No|
|VHM|1|20847702-0506-43fc-81b3-a6a1a5ef1b32|No|
|VPL|1|bcb6df7e-001b-4368-a913-e9e01bae30fb|No|
|VRE|1|e032abe6-6e8a-4241-8546-5a7e3a960ef4|No|

Ticker-level correspondence: 11/11. Provider-level ticker/code/ISIN/UUID structure is resolved for 30 market observations. Structurally resolved **ledger-to-market bridge: 0/11**; independently accepted identity: 0/11. Matching ticker text is diagnostic only. No holding omitted based on fundamental eligibility. NAV remains UNAVAILABLE/BLOCKED. Full retained quantity strings are separately preserved in ACTUAL_VALIDATION.json; no inferred mapping or bridge was written.
