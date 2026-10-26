# Normalization validation

Selected 23/10 capture: PASS existing buildTcbsPipeline + replayTcbsPipeline in memory; exactly 30 unique observations. Every security-master response uniquely matches pinned ticker and UUID assignment, HOSE tradePlace 001, common-share secType 001, status Y, halt N, unique codeId and ISIN. These provider-level bindings do not accept ledger-to-market identity.

Currency VND; VND_PER_SHARE; multiplier 1; field CLOSE; adjustment RAW, latest-close matched exactly with board. No tradeUnit-based scaling or historical total-return assertion. exactJson retains numeric lexemes; Decimal parsing/comparison is used without float price conversion. Full values, exact decimal strings, source hashes and close JSON pointers are retained in ACTUAL_VALIDATION.json.

All 30 selected close values are positive, unique, within low/high and equal board close. No missing, duplicated or conflicting close observation; no suspended/unavailable identity accepted. 26/10 normalization BLOCKED as unfinished. No missing value invented. The pipeline’s identity `from` is capture knowledge date and is not a proven historical effective interval or accepted NAV bridge.
