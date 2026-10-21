# TCBS API review for the VN30 web app — 2026-10-21

## Scope and evidence

Reviewed the official [TCBS introduction](https://developers.tcbs.com.vn/docs/v1.0.0/introduction/) and [OpenAPI specification](https://developers.tcbs.com.vn/specs/openapi-v1.0.0.json), plus the published cash statement, purchasing-power, foreign-room, securities and OHLCV pages. The introduction lists 52 API entries; `api/tcbs-api-catalog.json` records a disposition for each.

App evidence: `docs/06_DASHBOARD/6.1 Requirements & Architecture/REQUIREMENTS.md` FR-1/2/4/5/14/17, `docs/adr/0004-portfolio-ledger-and-accounting.md`, `src/infrastructure/config/broker-api-data.ts`, `src/infrastructure/repositories/broker-observations.ts`, and `src/infrastructure/market-boundary/tcbs-pipeline.ts`. The app needs portfolio/cash reconciliation, dated prices, history and a compatible benchmark. It is local-first and does not require continuous broker event ingestion. Ledger cash, positions and accounting remain authoritative.

## Decisions

| API | Decision | App use and limits |
|---|---|---|
| 1.1 | Reuse one authentication | JWT shared by account REST, market REST and WSS; OTP only when cache expired |
| 1.2 | Optional, not implemented | Key-expiry administration; not needed for fetching app data |
| 1.3 | Exclude from capture | Key renewal is a separate credential-change operation |
| 2.1 | Default | Resolve one active NORMAL/MARGIN sub-account by explicit type, custody verified |
| 3.1–3.3 | Exclude | Transfers/margin money movement outside current app scope |
| 4.1–4.3 | Exclude | Place/amend/cancel orders outside current read-only acquisition scope |
| 4.4, 4.6 | Default | Order status and fills for reconciliation; no claim of full historical fill coverage |
| 4.5 | Optional, not implemented | Lookup individual order details only when an actual review needs it |
| 4.7 | Add, default | Broker-reported purchasing power reference; never replaces settled executable cash or authorizes margin |
| 4.8–4.9 | Optional, not implemented | Symbol/price-specific execution checks belong to on-demand review, not all30 bulk capture |
| 4.10–4.13, 4.18 | Exclude | Margin financing products not required by no-margin investing policy |
| 4.14–4.16 | Default | Holdings, cash and cash history; paginate 4.16 instead of silently stopping at 25 rows |
| 4.17 | Default when account resolves | Debt reconciliation; missing MARGIN account does not prove zero debt |
| 5.1, 5.11 | Default | Price/reference snapshot and security identity |
| 5.2 | Default, user requested | Bounded 30-second WSS board, not a permanent stream or finalized EOD source |
| 5.3 | Default | Official name is foreign room; response also supplies basket/date/quote snapshot used by the current EOD adapter |
| 5.4–5.8, 5.12 | Optional `--extended-market` | Extra transaction/money-flow/intraday views; not prerequisites for core financial scoring |
| 5.9–5.10 | Optional, not implemented | Continuous events require their own lifecycle/dedup/recovery; bounded REST/WSS already covers current local app workflow |
| 5.13 | Default, extend usage | Keep existing two-bar EOD variant; add separate 252-bar stock history and index-type VN30 benchmark variants |
| 6.1–6.11, 7.1–7.3 | Exclude | Derivatives outside retained cash VN30 universe |

The gap is mainly better use of existing APIs, plus 4.7 as a reconciliation reference. No additional trading/financing API is necessary. [4.7 documentation](https://developers.tcbs.com.vn/docs/v1.0.0/stock/purchasing-power/) describes broker purchasing power; the app's no-margin ledger budget is independent. [5.13 documentation](https://developers.tcbs.com.vn/docs/v1.0.0/stock/bars-long-term/) supports `type=index` and `countBack`; this does not itself qualify the VN30 symbol, adjustment basis or benchmark-return compatibility. [4.16 documentation](https://developers.tcbs.com.vn/docs/v1.0.0/stock/cash-statement/) supplies date/page parameters and response totals.

## Implementation

There was already only one live network entry point, `api/tcbs.mjs`; no second account runner remains to merge. The account branch is now enabled by default, before market REST, in the same invocation/token as WSS. `--market-only` deliberately skips account calls; legacy `--accounts` is still accepted. No second OTP exchange, token subprocess or account runner is used.

Default full30 plan: 93 market GETs plus 8 account GETs = 101 GETs when both account types resolve and cash history fits one page; additional cash pages add calls. One WSS connection and, if necessary, one authentication POST are separate from those counts. Extended mode adds151 GETs. A missing account or response failure remains visible rather than silently dropping the API.

Cash range defaults to today's Vietnam date. Use explicit `--from`/`--to` to reacquire a longer period; no guessed inception date. Each 4.16 page has its own immutable filename/variant, maximum25 pages/625 rows. Unknown pagination schema, changing totals, incomplete rows or exceeding the limit creates an issue/partial result. Margin history remains one bounded page, with no full-history claim. No auto-posting of cash/trades/dividends occurs.

Stock history (`variant=history`) and VN30 index (`variant=benchmark`) have separate raw paths from the current two-bar EOD captures. The existing full30 EOD manifest remains exactly61 requests and schema v2. Combined `capture.json` uses unified schema v2 and contains all raw text plus request parameters, variants, timestamps/status/hashes and issues. Old raw captures and sealed approvals were not rewritten.

## Gaps that more TCBS calls do not automatically solve

- Corporate-action entitlements and adjusted/total-return history remain unqualified; a raw index candle is not an approved total-return benchmark.
- Requesting252 candles does not prove252 returned observations, sufficient inception history or historical point-in-time coverage. Responses remain unreviewed raw captures.
- Financial statements remain sourced separately under the PDF/API admission rules. These API docs do not supply approved missing accounting facts, rubric assessments or valuation assumptions.
- Capture files do not automatically populate the app: the legacy offline importer expects its older envelope/inception artifacts. No automatic conversion/import was added under this acquisition task.
- The formal scoring dataset acceptance blocker and MBB deferral are unchanged.

## Validation

18 tests passed, including an end-to-end mocked run proving a single OTP/auth POST supplies accounts, two cash pages, all30 EOD, history, benchmark and WSS. Test verifies the legacy61-request EOD manifest, unique raw filenames, exact raw decimal text, pagination completeness and exclusion of token from results. Auth cooldown, rejection, socket timeout/disconnect and sub-account ambiguity tests pass. ESLint and final diff checks are reported in the task response.

The prior market-only live capture completed213 REST200 responses and960 WSS frames on2026-10-21. The new default account/benchmark/history flow has not been called live in this review; mocked success is not source qualification.
