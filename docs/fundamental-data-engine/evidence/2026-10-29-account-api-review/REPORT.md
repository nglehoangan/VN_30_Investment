# P2 — TCBS 4.16/4.17 HTTP400 resolved, 2026-10-29

The endpoint paths have not changed relative to the existing code and current published TCBS v1.0.0 documentation. The live backend requires different parameter names from that documentation:

| API | Documented parameter | Live-required parameter | Result after correction |
| --- | --- | --- | --- |
| 4.16 cash statements | accountno | acctno | HTTP200 |
| 4.17 margin debt | toDate | todate | HTTP200 |

Sources: https://developers.tcbs.com.vn/docs/v1.0.0/stock/cash-statement/ and https://developers.tcbs.com.vn/docs/v1.0.0/stock/debt-lookup/ (checked 2026-10-29). Both use https://openapi.tcbs.com.vn with the existing `/erebos/v2/digital/trans-hist-cashStatements` and `/erebos/v2/digital/margin-info` paths. This comparison establishes a documentation/backend mismatch today; it does not date when the backend contract changed.

## Evidence and correction

The initial live requests returned provider code 878000 / HTTP400 with precise messages:

- 4.16: `Required request parameter acctno for method parameter type 'String' is not present`
- 4.17: `Required request parameter todate for method parameter type 'String' is not present`

Corrected each parameter independently in read-only live probes, then ran the corrected entry point with the same cached token. Both returned HTTP200; all eight account/profile request types succeeded. The corrected entry-point run selected FPT to bound repeated market requests and used cash-history range 01/10–29/10; pagination reported one total row, one received row, complete. This is provider pagination completeness for that request, not independent reconciliation to broker Excel or accounting admission. Debt capture remains raw evidence and is not a claim of zero custody fees or complete historical debt pagination.

`LIVE_RESULTS.json` pins exact SQLite observation IDs/hashes and sanitized summaries. Raw responses, request parameters, status and retrieval times remain directly in private SQLite; no response/temp capture directory was introduced. The first attempt inside the restricted network environment failed before obtaining provider responses; the approved network-capable run supplied the live evidence above.

## One command and separate failures

Both APIs were already present in default `api/tcbs.mjs`; the previous console output emphasized market progress and collapsed account failures into a generic reason. Now:

- Each account API logs its ID, account type and HTTP status/failure without printing account IDs, JWT, OTP or raw responses.
- The final persisted/printed summary separates accountCapture from marketCapture; market capture further distinguishes REST, WebSocket and display-price publication.
- HTTP400 remains an explicit ACCOUNT issue and does not discard good market observations or block display-price publication. Authentication401 and throttling429 still stop the session; they are not treated as endpoint-local400 errors.
- Profile2.1 is fetched once and custody identity is checked. 4.16 selects exactly one active NORMAL account; 4.17 exactly one active MARGIN account. Missing/ambiguous accounts fail explicitly, without guessing a number or recording debt as zero. `--market-only` intentionally skips account requests.

Normal command, one JWT/OTP session for both account and market work:

```sh
node api/tcbs.mjs
```

Choose a statement period if needed:

```sh
node api/tcbs.mjs --from=2026-10-01 --to=2026-10-29
```

## Validation and limitations

- `tests.log`: **25/25 passed**, including account success/pagination and a full-30 simulation where both account endpoints return400 while all30 prices publish. Tests assert the actual account scopes and corrected query parameter names.
- Changed JavaScript/tests lint passed.
- The live full30 run **before parameter correction** obtained valid market REST data and published30 prices despite both account400 errors. This directly verifies isolation on actual provider responses. The corrected account+FPT entry-point run obtained HTTP200 for both repaired endpoints and published FPT's price.
- WSS was sampled for three seconds and yielded NO_MARKET_FRAMES. Consequently these live run envelopes remain PARTIAL_CAPTURE for streaming coverage; account HTTP400 is nevertheless resolved, and REST prices updated. This result does not claim WebSocket freshness/qualification.
- ACCOUNTING_INTEGRITY.json confirms portfolio, ledger headers/legs, projections, publications, scoring bindings and analytical artifacts remain equal to their prior activation fingerprints. Only API/market observations and run receipts were appended; no financial ledger/scoring admission or trading was performed.

The final console-summary addition of explicit REST/WebSocket fields was tested offline after the live run; the persisted live receipts retain their original summary format. Existing evidence and historical seals were not rewritten.
