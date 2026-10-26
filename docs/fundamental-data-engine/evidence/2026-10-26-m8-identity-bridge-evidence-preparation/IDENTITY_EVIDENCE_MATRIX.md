# Identity evidence matrix

Final evidence status: **PARTIAL_EVIDENCE**. Exactly 11 ledger holdings inspected read-only; original IDs and quantities retained. No complete bridge candidate can be emitted. IDENTITY_BRIDGE_CANDIDATES.json contains 11 explicitly incomplete evidence dossiers and an empty bridgeCandidates array; it is **not** a nav-security-identity-bridge-v1 Bridge DTO.

|Ledger ID|Candidate market UUID|TCBS code|Provider ISIN|Historical DB observations|Retained HOSE ISIN|Economic continuity|
|---|---|---|---|---|---|---|
|FPT|ec91b3cb-8eab-45ae-95e7-738bb3c7de52|000208|VN000000FPT1|11|match|UNKNOWN|
|GAS|b56425c0-fc3e-4b56-a8de-a9a537d05b58|002033|VN000000GAS3|10|match|UNKNOWN|
|HPG|ee1da5cd-aedc-4567-98a6-d525b8c79ebc|000286|VN000000HPG4|10|match|UNKNOWN|
|MBB|ff699c86-8eaf-4178-af14-0b38fd5b1255|000054|VN000000MBB5|10|match|UNKNOWN|
|MWG|3376630f-ec27-4d02-9168-b2274d6abdb7|003170|VN000000MWG0|10|match|UNKNOWN|
|SSI|483a7e5c-ae5d-456d-840e-54433896ad43|000065|VN000000SSI1|10|match|UNKNOWN|
|TCB|2a3c69b1-08aa-473c-bbd5-92d096a0d23a|003415|VN000000TCB8|10|match|UNKNOWN|
|VCB|32002fe9-b6cd-4760-91ba-8b7a59d4758e|000193|VN000000VCB4|10|match|UNKNOWN|
|VHM|20847702-0506-43fc-81b3-a6a1a5ef1b32|005791|VN000000VHM0|10|match|UNKNOWN|
|VPL|bcb6df7e-001b-4368-a913-e9e01bae30fb|000153|VN000000VPL5|10|match|UNKNOWN|
|VRE|e032abe6-6e8a-4241-8546-5a7e3a960ef4|005599|VN000000VRE6|10|match|UNKNOWN|

The selected capture is `data/market-source/tcbs/2026-10-25T11-16-55.130Z-unified`, session 23/10/2026; overall PARTIAL_CAPTURE preserved. Raw 5.11 payload hashes verified against manifest. Source ticker/tradePlace 001/secType 001/status Y/halt N are retained, corresponding to HOSE/common share. No raw response is edited.

UUID origin is the pinned local release /partition/members assignment, **not an identifier returned by TCBS**. Provider instrument code and ISIN come from /content/0 of the selected raw security response. Per-row release and raw SHA-256/pointers are preserved in each dossier. UUID namespace authority and release knowledge date remain unaccepted/UNKNOWN.

Original ledger lineage: opening facts reference BROKER_SNAPSHOT:cc46785ff2d4f7477911d0cb7dad6ee38b872b5cc6a8566a78683637fdf43852. The matching retained broker_observation body was located and its exact UTF-8 SHA-256 verified. Each holding has its original transaction/facts and snapshot /positions/N reference, exact body hash and stored retrieval timestamp. The security table has only id/name ticker values; original snapshot positions contain symbol/quantity/cost/price, **no stable code or ISIN**. Thus neither same ticker nor same quantity/cost proves a cross-namespace identity.

Historical search: 111 DB 5.11 observations (all body hashes valid), plus 110 retained raw 5.11 captures concerning held tickers, separately enumerated in RETAINED_REFERENCE_SEARCH.json. DB histories agree with selected provider identity for all 11. Retained HOSE current-list JSON independently corroborates ticker/ISIN at a historical snapshot where present; it does not bind the personal ledger ID to that instrument or prove continuous effective dates. Constituent text, receipts and database master conventions were inspected and pinned separately. No silent cross-capture merge.

Every row remains UNKNOWN for SAME_ECONOMIC_INSTRUMENT relationship, effective interval, formal knowledge interval and corporate-action clearance. Required evidence actions are in CORPORATE_ACTION_GAPS.md and EFFECTIVE_KNOWLEDGE_GAPS.md. No accepted mapping, authority or NAV authorization is created.
