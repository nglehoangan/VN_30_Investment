# TCBS5.x — source assessment,2026-10-20

Documentation reviewed for13 endpoints;11 unique endpoints have retained real raw samples. 5.9 is private account orders and was not called;5.10 is documentation-only. No production readiness or accounting changed.

| API | Role | Live status | Rows | Caveat |
|---|---|---|---|---|
| [5.1](https://developers.tcbs.com.vn/docs/v1.0.0/stock/market-symbol/) | Price snapshot | CAPTURED_REHASH_PASS | 1 | Raw LAST/reference quote; full intraday timestamp not supplied on each row |
| [5.2](https://developers.tcbs.com.vn/docs/v1.0.0/stock/ws-price-board/) | Market board | CAPTURED_REHASH_PASS | 1 | Keep pipe protocol and data-frame bytes; distinguish capture time from exchange event time |
| [5.3](https://developers.tcbs.com.vn/docs/v1.0.0/stock/foreign-room/) | Basket snapshot/foreign room | CAPTURED_REHASH_PASS | 30 | Provider basket matches retained30 in this sample; not an independent historical universe authority |
| [5.4](https://developers.tcbs.com.vn/docs/v1.0.0/stock/put-through/) | Negotiated trades | CAPTURED_REHASH_PASS | 904 | Not a replacement for normal matched/official close price |
| [5.5](https://developers.tcbs.com.vn/docs/v1.0.0/stock/price-history/) | Intraday executions | CAPTURED_REHASH_PASS | 20 | Only intraday history; day/month lacks year; retain equal occurrences without inventing trade IDs |
| [5.6](https://developers.tcbs.com.vn/docs/v1.0.0/stock/supply-demand-intraday/) | Intraday supply/demand | CAPTURED_REHASH_PASS | 225 | Observed s is epoch-seconds, unlike the millisecond-sized documentation example; parser version needs explicit unit handling |
| [5.7](https://developers.tcbs.com.vn/docs/v1.0.0/stock/supply-demand-daily/) | Daily supply/demand | CAPTURED_REHASH_PASS | 0 | Actual sample is empty for20/10 before open; do not fill zero or substitute prior day |
| [5.8](https://developers.tcbs.com.vn/docs/v1.0.0/stock/supply-demand-monthly/) | Monthly-window supply/demand | CAPTURED_REHASH_PASS | 21 | Observed date labels DD/MM lack year; investor-size groups are provider classifications |
| [5.9](https://developers.tcbs.com.vn/docs/v1.0.0/stock/ws-order-matching/) | PRIVATE account order updates | NOT_CALLED_PRIVATE_ACCOUNT | None | Detailed official page describes account orders, despite generic sidebar matching title; not called |
| [5.10](https://developers.tcbs.com.vn/docs/v1.0.0/stock/ws-history/) | Market minute stream | DOCUMENTATION_ONLY | None | Documentation reviewed only; not live qualified; one-minute closePrice is not daily official close |
| [5.11](https://developers.tcbs.com.vn/docs/v1.0.0/stock/securities-info/) | Security reference | CAPTURED_REHASH_PASS | 1 | Live issuerName is blank; txDate is2016, not observation date; tradeUnit1000 is not proof to multiply quote values |
| [5.12](https://developers.tcbs.com.vn/docs/v1.0.0/stock/bars/) | Intraday OHLCV | CAPTURED_REHASH_PASS | 5 | Unfinished bars and adjustment basis require purpose-specific validation |
| [5.13](https://developers.tcbs.com.vn/docs/v1.0.0/stock/bars-long-term/) | Daily/weekly/monthly OHLCV | CAPTURED_REHASH_PASS | 5 | Adjustment/revision policy not explicit in reviewed endpoint schema; latest close matching does not prove historical adjustment semantics |

Current price and identity have enough source fields to build a narrowly scoped adapter candidate:5.1 plus5.11; use5.13 for a finalized daily-candle close. 5.2/5.5 are optional corroborating views of the same provider. Historical corporate-action factors are not a prerequisite for reading raw current quotes; do not claim adjusted historical return/backtest support from this sample.

Actual TCB identity: ISIN VN000000TCB8, codeId 003415, venue001=HOSE, local securityId 2a3c69b1-08aa-473c-bbd5-92d096a0d23a. Provider VN30 set matches all30 retained identities in this capture, without replacing the certified universe.

Latest match/daily close: 33250.0, trading date 19/10/2026. Volume differs: snapshot 1.96522E+7 versus daily bar 19665825 (delta 13625); preserve both populations. Source cause remains unknown. 5.7 returned an empty current-day series; no zero fill.

Remaining work is primarily adapter/contract qualification and application policy, not a blanket absence of market data. Endpoint docs do not by themselves define executable freshness deadlines, exchange holidays or historical PIT publication knowledge. tradeUnit1000 is not a license to multiply a33250 quote. Blank issuer name, old txDate, placeholder-like fundamentals and unknown historical adjustment rules stay explicit.

Raw data stays in the two private data/market-source capture directories. SHA256 paths and exact selected JSON pointers are in SOURCE_SUFFICIENCY.json. Historical source reviews and gates remain unchanged.
