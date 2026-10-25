# Market-data inventory

Assessment time: 2026-10-24T07:41:26.233Z. Existing repository and retained local bytes only; no external quote request. Full paths, hashes, request inventory and timestamp evidence: READ_ONLY_MARKET_EVIDENCE.json. Owner approval of the financial adapter is recorded in OWNER_APPROVAL.json; it does not approve a market source.

## Existing source families and DTOs

- TCBS broker observations in SQLite: 450 bodies rehashed, including 436 TCBS_API_RESPONSE, twelve BROKER_SNAPSHOT, one ACCOUNT_TRACKING_BASELINE and one PORTFOLIO_OPENING_RECONCILIATION. Historical database board contains thirty quoted tickers for 09/10/2026. `broker-api-data` is an informational display DTO with Number-valued quotes; it is not the exact approved valuation price contract.
- Latest retained broker portfolio: received 2026-10-11T04:16:56.658Z; holdings capture 2026-10-11T04:16:56.600Z; cash capture 2026-10-11T04:16:56.658Z; twelve source rows including FPT_UNAVAILABLE. RETRIEVED_AT means capture clock, not an exchange-certified valuation event. It is separate from eleven authoritative ledger holdings. Source stock values and pending dividends remain indicative, not authoritative NAV.
- TCBS_OPENAPI_EOD existing pipeline: 5.3 `tartarus/v1/tickerSnaps` board; 5.11 `ananke/v1/securities` identity; 5.13 `nyx/v2/stock/bars-long-term` daily bars. Qualified normalizer contract `tcbs-bars-long-term-v1`/`tcbs-eod.ts` uses exact decimal lexemes, VND_PER_SHARE multiplier 1, CLOSE, RAW latest-close matching to board. HTTP Date is not quote time. Normalizer rejects halted/wrong-identity/unfinished/missing/conflicting records.
- LocalCurrentSource is a bounded manually configured normalized file adapter, not a live provider. `CurrentSource` binds portfolio/as-of/watermark, prices, source/policy/revision, references and reconciliation. No explicit VN30_CURRENT_SOURCE_FILE setting was found in inspected standard local env files; regardless, `app/server/current.ts` refuses to load it unless marketCurrent=true. No secret/token values were read into this report.
- Market boundary DTOs distinguish CAPABILITY, MARKET, INITIALIZATION, ANALYSIS and PORTFOLIO bindings; exact source, request, calendar, purpose, knownAt/availableAt, identity and hash pins are required. Database currently contains one CAPABILITY and one INITIALIZATION, zero MARKET records. Their presence/integrity is not authenticated independent approval.

## Active and retained candidates

Active binding: `data/market-boundary/active-candidate.json`, canonical candidate hash `d0477bb68f5807282a9aff54a411b1a8f6321f818eb75da71bad0cfd457d9dac`; built 2026-10-20T01:26:52.262Z; trading date 2026-10-19; thirty UUID-based securities. Full technical replay PASS, thirty source hashes verified. Independent acceptance is PENDING_INDEPENDENT_REVIEW. Its VALUATION window is 2026-10-19T08:00:00.000Z through 2026-10-20T07:59:59.999Z. Current freshness is BLOCKED.

Nine candidate files remain. A newer inactive candidate built 2026-10-21T08:24:34.461Z references trading date 2026-10-21. It was inventoried, not selected, approved or fully replayed. Newer capture time or presence cannot expand active source authority. No current 23 October accepted snapshot was found. Retained market manifests extend through 2026-10-21T08:21:29.494Z. Technical calendar currently points to completed session 2026-10-23, conditional on the retained, independently unaccepted calendar.

## Retained request manifests

|Manifest|Request entries|HTTP 200 entries|Latest retained retrieval|Capture state|
|---|---:|---:|---|---|
|data/market-source/tcbs/2026-10-20T00-46-43.951Z/manifest.json|0|0|Unavailable|TOKEN_CACHE_UNAVAILABLE_OR_EXPIRED|
|data/market-source/tcbs/2026-10-20T00-48-00.793Z/manifest.json|3|2|2026-10-20T00:48:07.890Z|CAPTURED_NOT_QUALIFIED|
|data/market-source/tcbs/2026-10-20T00-55-31.681Z-5x-review/manifest.json|9|0|Unavailable|COMPLETED_NOT_QUALIFIED|
|data/market-source/tcbs/2026-10-20T00-55-44.590Z-5x-review/manifest.json|9|9|2026-10-20T00:55:46.537Z|COMPLETED_NOT_QUALIFIED|
|data/market-source/tcbs/2026-10-20T01-07-04.887Z-vn30/manifest.json|60|60|2026-10-20T01:07:10.929Z|CAPTURED_NOT_QUALIFIED|
|data/market-source/tcbs/2026-10-20T01-19-09.068Z-vn30/manifest.json|61|61|2026-10-20T01:19:14.753Z|CAPTURED_NOT_QUALIFIED|
|data/market-source/tcbs/2026-10-20T01-25-50.338Z-vn30/manifest.json|61|61|2026-10-20T01:25:56.355Z|CAPTURED_NOT_QUALIFIED|
|data/market-source/tcbs/2026-10-21T02-12-28.313Z-vn30/manifest.json|0|0|Unavailable|TOKEN_CACHE_UNAVAILABLE_OR_EXPIRED|
|data/market-source/tcbs/2026-10-21T02-16-53.309Z/manifest.json|3|2|2026-10-21T02:17:05.835Z|CAPTURED_NOT_QUALIFIED|
|data/market-source/tcbs/2026-10-21T02-24-52.757Z-unified/manifest.json|1|0|2026-10-21T02:24:52.783Z|PARTIAL_CAPTURE|
|data/market-source/tcbs/2026-10-21T02-25-07.024Z-unified/manifest.json|61|61|2026-10-21T02:25:12.849Z|CAPTURED_NOT_QUALIFIED|
|data/market-source/tcbs/2026-10-21T02-27-37.177Z-unified/manifest.json|61|61|2026-10-21T02:28:37.386Z|CAPTURED_NOT_QUALIFIED|
|data/market-source/tcbs/2026-10-21T02-45-03.359Z-unified/manifest.json|61|61|2026-10-21T02:46:11.578Z|CAPTURED_NOT_QUALIFIED|
|data/market-source/tcbs/2026-10-21T03-06-07.490Z-unified/manifest.json|61|61|2026-10-21T03:07:08.540Z|CAPTURED_NOT_QUALIFIED|
|data/market-source/tcbs/2026-10-21T08-19-32.500Z-unified/manifest.json|1|0|2026-10-21T08:19:32.544Z|PARTIAL_CAPTURE|
|data/market-source/tcbs/2026-10-21T08-20-29.260Z-unified/manifest.json|61|61|2026-10-21T08:21:29.494Z|CAPTURED_NOT_QUALIFIED|

All successful HTTP-200 raw entries checked have retained matching bytes. Failed/partial requests without payloads remain failures, not missing-price zeros; schema variants with incomplete fields are not normalized into successful captures. Sixteen manifests contain 513 request entries, including retries/failed captures, not 513 distinct accepted observations. No provider availability, credentials, licensing or present external access was tested.
