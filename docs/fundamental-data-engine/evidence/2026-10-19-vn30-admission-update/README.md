# VN30 reviewed admission update — 19 October 2026

Updated TCX, VIB and VIC through the existing hybrid admission engine. Thirty append-only admission snapshots are persisted in SQLite and round-tripped exactly. Versioned inputs, canonical outputs and five-window qualifications per ticker are in data/manual-current/reviewed-admission-2026-10-19; latest-reviewed-admission.json is the current review pointer.

28 tickers are Level-1 sufficient. MBB awaits official consolidated CAR for June 2026. VNM remains partial for debt population receipts in FY2024, FY2025 and 6M2026; its included-current presentation is accepted and does not require inventing a separate amount.

TCX includes the user-approved Két Vàng amount once. VIB admits consolidated CAR 11.8%, CET1 10.0% and the separately labelled broader reported NPL 2.10%; historical customer-loan NPL/provision facts are unchanged. VIC admits the reviewed source and reported borrowings 355,810,545 million VND, excluding LC per user decision. No comprehensive debt claim or silent historical metric remapping.

All 30 baseline canonical replays match. The other 27 ticker canonical fact sets remain unchanged. HPG has 2 and VCB has 10 pre-existing rejected verification candidates; none are newly invalid and they remain excluded. Existing database table rows including portfolio/ledger/artifacts were compared against the pre-migration temporary backup and are unchanged. Six existing pending schema migrations were applied. SQLite integrity and foreign keys pass.

Tests: 499/511 pass across 18 files. Twelve failures concern historical deleted sources and old byte-freeze hashes changed by authorized policy/tests/AGENTS updates. These were not bypassed or rewritten to claim a pass. TypeScript passes. Full replay from deleted original sources remains unavailable.

Market source/freshness and full runtime market snapshot were not requalified. Independent review and release acceptance remain outstanding. Level-1 sufficiency is not scoring or investment approval; readyForScoring remains false. Historical sealed packages are unchanged.

Rebuild: supported Node 22.23.2, scripts/update-vn30-reviewed-admission.mjs --persist. Existing immutable admission IDs must reproduce the exact same body.
