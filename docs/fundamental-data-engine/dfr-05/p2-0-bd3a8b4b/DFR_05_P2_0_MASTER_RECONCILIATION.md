# Existing master reconciliation — no master write

Logical model: docs/02 DATABASE/VN30_MASTER.md (v1.2, historical document header awaiting approval). Configured runtime resolution was traced through active-authorities.json → LocalAcceptedDependencyCatalog.readAccepted → acceptedBootstrapBinding → the hash-bound candidate and RELEASE.json partition. Configured universe/security/sectors equal the independently inspected immutable/read-only SQLite latest dependency_release; UNIVERSE and REFERENCE_DATA heads both ACCEPTED under existing owner-accepted initialization authority. These runtime acceptance facts do not approve this new proposal.

Configured universe version `HOSE-2026-08-03-certified-2026-10-16`, certified as-of `2026-10-16`, membership snapshot effective03/08/2026. Runtime head effectiveFrom is `2026-10-20T01:26:52.262Z`; this is system authority activation, not index reconstitution. The source reference `data/market-boundary/candidates/d0477bb68f5807282a9aff54a411b1a8f6321f818eb75da71bad0cfd457d9dac/candidate.json` is historical and exists now: True. Do not restore deleted staging folders.

The old October10 membership/sector candidate packages say REVIEW_REQUIRED and predate runtime acceptance; they are retained historical inputs, not the current approval state. Existing October17 certified universe reconciliation and the latest accepted runtime identity set agree with all30 proposed official tickers and stable IDs.

SQLite security table uses portfolio ticker identifiers rather than the stable UUID universe identity namespace. It is not treated as the VN30 membership master. UNIVERSE/REFERENCE_DATA heads provide the accepted stable mapping, including retained ISINs. Names below are the official index-table names as printed; no fresh legal-company-name/ISIN admission is claimed. No ticker, merger or common-stock delisting conflict was located in the covered index/identity screen.

| Ticker | Official identity/name | Accepted stable security ID | Classification |
|---|---|---|---|
|ACB|Ngân hàng TMCP Á Châu|658fafbe-65b3-4176-999f-d4d32e1bd838|MATCHED|
|BID|Ngân hàng TMCP Đầu Tư và Phát triển Việt Nam|8297c1c6-6dea-4d43-8d19-81b917c07da3|MATCHED|
|BSR|CTCP - Tổng Công ty Lọc hóa dầu Việt Nam|10e09f98-daa0-4979-a1ef-8918a6099fcd|MATCHED|
|CTG|Ngân hàng TMCP Công Thương Việt Nam|067f7626-9e44-4cb5-8602-3f88ec58a3c9|MATCHED|
|FPT|CTCP FPT|ec91b3cb-8eab-45ae-95e7-738bb3c7de52|MATCHED|
|GAS|Tổng Công ty Khí Việt Nam - CTCP|b56425c0-fc3e-4b56-a8de-a9a537d05b58|MATCHED|
|GVR|Tập đoàn Công nghiệp Cao su Việt Nam - CTCP|65245cd0-db0a-4560-834f-82f92997296c|MATCHED|
|HDB|Ngân hàng TMCP Phát triển TP.HCM|d266a483-4437-40fd-bf91-4d9cc323b4a0|MATCHED|
|HPG|CTCP Tập Đoàn Hòa Phát|ee1da5cd-aedc-4567-98a6-d525b8c79ebc|MATCHED|
|LPB|Ngân hàng TMCP Lộc Phát Việt Nam|b75a9e81-805d-434e-beb6-2be15d8a386d|MATCHED|
|MBB|Ngân hàng TMCP Quân Đội|ff699c86-8eaf-4178-af14-0b38fd5b1255|MATCHED|
|MCH|CTCP Hàng tiêu dùng Masan|a619b276-13fa-4c6a-8d4c-bfdd103b0db3|MATCHED|
|MSN|CTCP Tập Đoàn Masan|8faac43a-380e-4ac5-9c76-bae3c4a6171c|MATCHED|
|MWG|CTCP Đầu tư Thế Giới Di Động|3376630f-ec27-4d02-9168-b2274d6abdb7|MATCHED|
|SAB|Tổng CTCP Bia – Rượu – Nước giải khát Sài Gòn|6e2e895f-1e2c-4678-9ea1-04cdad648dcd|MATCHED|
|SHB|Ngân hàng TMCP Sài Gòn - Hà Nội|b8338222-b813-400e-8e4f-b0fe3209aa52|MATCHED|
|SSB|Ngân hàng TMCP Đông Nam Á|b8dd9e1d-2811-460d-a58b-948887985c07|MATCHED|
|SSI|CTCP Chứng khoán SSI|483a7e5c-ae5d-456d-840e-54433896ad43|MATCHED|
|STB|Ngân hàng TMCP Sài Gòn Tài Lộc|a26b4d2c-f041-469e-89a8-2fefbb585a01|MATCHED|
|TCB|Ngân hàng TMCP Kỹ thương Việt Nam|2a3c69b1-08aa-473c-bbd5-92d096a0d23a|MATCHED|
|TCX|CTCP Chứng khoán Kỹ Thương|8754ecd0-5962-4b53-aff3-84b09d29771e|MATCHED|
|VCB|Ngân hàng TMCP Ngoại Thương Việt Nam|32002fe9-b6cd-4760-91ba-8b7a59d4758e|MATCHED|
|VHM|CTCP Vinhomes|20847702-0506-43fc-81b3-a6a1a5ef1b32|MATCHED|
|VIB|Ngân hàng TMCP Quốc tế Việt Nam|3bba4509-56e7-415e-b0d4-8057797853f7|MATCHED|
|VIC|Tập Đoàn Vingroup - CTCP|140e2228-6cb5-4a6a-973c-c67277ec4f0b|MATCHED|
|VJC|CTCP Hàng không Vietjet|1d2669ea-511a-4a00-9efc-2d78eeb827dd|MATCHED|
|VNM|CTCP Sữa Việt Nam|a243cd90-95b8-44f0-96a5-b6be0defeb87|MATCHED|
|VPB|Ngân hàng TMCP Việt Nam Thịnh vượng|f384cffa-5206-496e-bf5b-5388b43e234e|MATCHED|
|VPL|CTCP Vinpearl|bcb6df7e-001b-4368-a913-e9e01bae30fb|MATCHED|
|VRE|CTCP Vincom Retail|e032abe6-6e8a-4241-8546-5a7e3a960ef4|MATCHED|

ADDED: []; REMOVED: []; IDENTITY_CONFLICT: []; SOURCE_VERIFICATION_PENDING: []. These are comparisons against the accepted dated master, not against an undated provider list. Sector-route deferrals are recorded separately and do not imply a membership addition/removal.

A versioned, date-specific research approval proposal is the only change. No VN30Membership, coverage, security identity, reference head, benchmark observation, active authority or database row is updated. Benchmark.md separates benchmark returns from constituents; VN30_RECONSTITUTION_v1.0.md requires source/effective-date verification and forbids treating index eligibility as investment merit or automatic capital deployment.
