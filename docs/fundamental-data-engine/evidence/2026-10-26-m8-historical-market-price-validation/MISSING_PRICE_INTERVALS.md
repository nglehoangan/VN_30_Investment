# Missing price intervals

2025 is UNKNOWN calendar coverage; weekday counts below are diagnostic, not certified exchange-session counts. 2026 uses existing technical candidate calendar only.

Across all retained captures, eleven ordinary tickers have any bar on 253 dates from **2025-10-20 through 2026-10-26**, but only 252 dates have completed-time bars, ending **23/10**. Date presence is not validated adjustment semantics. **26/10 has unfinished-only morning evidence** for those eleven; it is not an EOD close.

TPB has **no retained daily closing bars** at all in the inspected local market evidence. It requires history while held even though current portfolio no longer includes it.

Held-date raw absence intervals, using execution-date quantities and technical/candidate-session denominator:

|Ticker|From|Through|Candidate dates missing|
|---|---|---|---:|
|FPT|2025-10-08|2025-10-17|8|
|TPB|2025-07-09|2026-08-03|269|
|VCB|2025-07-01|2025-10-17|79|
|VHM|2025-08-14|2025-10-17|47|
|VRE|2025-07-02|2025-10-17|78|

Some retained bars precede a ticker’s purchase and are not required for that holding. Full per-security/per-date information, actual source references and completion status are in PRICE_COVERAGE_MATRIX.json. File dates/amounts from different captures are never merged silently into a synthetic price series. Sources remain separate; no latest-wins.

Beyond absence, historical semantics are unqualified for the 252-date history; price equality or file hash does not resolve this. Three retained-session raw EOD technical proofs exist (19/10, 21/10, 23/10), without source/NAV admission. Pending buckets require entitlement valuation policy and timing, not ordinary-price auto-substitution.

Need source-backed RAW unadjusted daily closes or an explicitly documented adjustment factor/event methodology for 2025-06-30–2026-10-26, including TPB through disposal, plus retained 2025 calendar and a completed 26/10 capture. This review makes no requests. No current-price carry/backfill, trade-price replacement or fabricated zero was used.
