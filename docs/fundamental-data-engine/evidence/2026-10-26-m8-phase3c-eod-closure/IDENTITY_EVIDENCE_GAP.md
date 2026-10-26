# Identity evidence gaps — all 11 holdings

Current ledger remains 12 transactions, 24 legs, 11 positions (Phase 3B authoritative replay evidence). Exact ledger ID and quantity values remain unchanged; matching ticker text below is diagnostic only. No bridge payload or accepted mapping is created.

|Ledger ID|Candidate market UUID|TCBS code (string)|ISIN|Retained provider response|Accepted bridge|
|---|---|---|---|---|---|
|FPT|ec91b3cb-8eab-45ae-95e7-738bb3c7de52|000208|VN000000FPT1|`5.11-FPT.raw.json`|MISSING|
|GAS|b56425c0-fc3e-4b56-a8de-a9a537d05b58|002033|VN000000GAS3|`5.11-GAS.raw.json`|MISSING|
|HPG|ee1da5cd-aedc-4567-98a6-d525b8c79ebc|000286|VN000000HPG4|`5.11-HPG.raw.json`|MISSING|
|MBB|ff699c86-8eaf-4178-af14-0b38fd5b1255|000054|VN000000MBB5|`5.11-MBB.raw.json`|MISSING|
|MWG|3376630f-ec27-4d02-9168-b2274d6abdb7|003170|VN000000MWG0|`5.11-MWG.raw.json`|MISSING|
|SSI|483a7e5c-ae5d-456d-840e-54433896ad43|000065|VN000000SSI1|`5.11-SSI.raw.json`|MISSING|
|TCB|2a3c69b1-08aa-473c-bbd5-92d096a0d23a|003415|VN000000TCB8|`5.11-TCB.raw.json`|MISSING|
|VCB|32002fe9-b6cd-4760-91ba-8b7a59d4758e|000193|VN000000VCB4|`5.11-VCB.raw.json`|MISSING|
|VHM|20847702-0506-43fc-81b3-a6a1a5ef1b32|005791|VN000000VHM0|`5.11-VHM.raw.json`|MISSING|
|VPL|bcb6df7e-001b-4368-a913-e9e01bae30fb|000153|VN000000VPL5|`5.11-VPL.raw.json`|MISSING|
|VRE|e032abe6-6e8a-4241-8546-5a7e3a960ef4|005599|VN000000VRE6|`5.11-VRE.raw.json`|MISSING|

Per-row exact raw SHA-256, pointer and retrieval/knowledge reference are in IDENTITY_GAP_DETAILS.json. Ledger facts/legs and projection remain in unchanged SQLite, byte hash in SAFETY_VERIFICATION.json; authoritative Phase 3B ledger replay and state hash are pinned via PHASE3B_VERIFICATION.json. Provider identity alone does not prove its relationship to ledger ticker IDs.

Minimum evidence for **each** row:

- Immutable ledger namespace/security identity anchor, original financial facts/ledger source lineage and portfolio scope.
- Exact market namespace/UUID assignment source plus TCBS code, ISIN, venue and class; do not rely solely on ticker or economic amounts. Provider code leading zeros remain preserved.
- Explicit reliable effective-from/to evidence covering intended session, economic-instrument continuity and corporate-action/rename/ticker-reuse review; no inferred listing/mtime/bar dates.
- Explicit knownFrom/knownTo and recordedAt with qualified event provenance. Selected source retrieval on 25/10 cannot prove AS_KNOWN availability on 23/10. Later knowledge can support only explicitly later-knowledge retrospective analysis if separately authorized.
- Producer-distinct validation plus exact immutable bridge content hash, source/interval witnesses, owner scope where required, authority validity/revocation and policy version.

Reference-data producer obtains missing source/ledger continuity records; independent validator checks them; owner approves scope through an authorized mechanism. ISIN syntax/availability is not authority verification. All 11 currently have provider identifiers but **0/11 structurally evidenced ledger bridges and 0/11 independently accepted bridges**. Unknown historical corporate-action evidence stays unknown. Do not rewrite ledger history or infer economic continuity.
