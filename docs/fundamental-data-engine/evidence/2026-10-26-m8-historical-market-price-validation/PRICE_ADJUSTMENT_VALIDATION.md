# Price adjustment validation

Inspected 999 retained .raw.json files, all legacy and unified manifest/capture request inventories, and **166 relevant daily stock files**. All 166 raw files match recorded SHA-256 and HTTP200 pins; OHLC closes positive and within high/low, no duplicated dates within each relevant file. No conflicting completed close values across those captures were detected for the same ticker/date. This is consistency, not proof adjustment correctness.

Request 5.13 /nyx/v2/stock/bars-long-term has type=stock, resolution=D, countBack 2 or history variants. Source response has ticker, OHLC/volume/tradingDate and dataT1; no explicit historical RAW/adjusted selector, factor schedule or corporate-action methodology was established. Historical price basis remains **UNDECLARED/UNQUALIFIED**, not positively classified as adjusted or raw. Fractional VND historical amounts are an investigation clue, not proof of a particular adjustment algorithm. No factor is reverse-engineered from equal amounts or ratios.

Existing normalizeTcbsEod validates only **latest completed board-date close**, exact VND/share multiplier 1, RAW_LATEST_CLOSE_MATCHED_TO_BOARD. Its declaration does not apply retroactively to every historical bar. Exact-source read-only candidate replay succeeds for 19/10, 21/10 and 23/10; per-date matrix identifies source-hash/pointer-qualified rows versus history values that merely coincide. No blanket raw-history qualification.

Candidate replay: 3 PASS, 7 historical candidates BLOCKED (source-code pin changes or deterministic replay mismatch). Preserve these failures and old seals; no repinning or defect fix performed. The currently retained active pointer is not changed. Details in CANDIDATE_REPLAYS.json.

Historical pricing must explicitly establish whether equity and cash corporate actions alter past bars; factor dates versus ex-date/record-date; splits/bonus/rights and cash-dividend treatment; units; any revisions and point-in-time availability. Mixing adjusted prices with unadjusted historical quantities can count changes twice or omit entitlements. No adjusted-to-raw conversion attempted.

Retained SQLite market responses inspected: 11 API5.1 snapshots, 110 API5.5 intraday trade captures, 110 API5.7 buy/sell flow captures. They do not supply a complete certified daily-close history; no intraday last/match/reference/index value is substituted for close. Intraday 5.12, board/WSS samples and raw VN30 index benchmark also do not fill individual-stock historical close gaps.

Every captured/retrieved timestamp stays at actual source time in the matrix. October 2026 acquisition of 2025 bars supports retrospective knowledge only; no AS_KNOWN backdating. Technical 2026 calendar covers 01/01–31/12; 2025 calendar absent. No observed 2026 daily dates fall on this technical calendar’s nonsessions, but its authority itself remains independently unaccepted.
