# Vietstock public document discovery

Checked 2026-10-11. All 30 registered research-basket tickers returned public financial-document metadata for the requested 2025/2026 filters. All 30 have PDF links; SSI and TCX also distribute some reports as ZIP archives. This verifies the discovery mechanism, not complete coverage of every required period or canonical admission.

The shared discovery template is:

```text
https://finance.vietstock.vn/{ticker_lower}/tai-tai-lieu.htm?doctype=1
```

`doctype=1` selects financial statements. Without the filter, the page also includes other corporate documents. The list is dynamic: its anonymous web client requests documents by ticker, year and page. The collector uses a fresh anonymous cookie jar and the page's normal anti-forgery token; no user account or licensed financial-data API is required for these tested public downloads.

All 30 rows in [issuer-sources.json](issuer-sources.json) now have `mirrorDiscoveryUrl`. The existing issuer website remains available alongside this public mirror. The reusable collector defaults to all 30 registered tickers and years 2025/2026:

```sh
python3 scripts/discover-vietstock-documents.py \
  --output data/vietstock-next-run
```

For a specific ticker or historical years:

```sh
python3 scripts/discover-vietstock-documents.py \
  --output data/vietstock-fpt-history-next-run \
  --tickers FPT --years 2023,2024,2025,2026 --download-samples FPT
```

The output must be a new directory. The tool retains hashed HTTP responses, original document metadata and URLs, a summary and `seeds.json`. It paginates the requested financial-document lists and optionally downloads one PDF sample per selected ticker. It discovers PDF and ZIP URLs from the provider's exact `Url` field rather than guessing filenames. Spaces in URL paths are encoded for transport; original URLs and queries remain in receipts. The bounded run stops on transport/schema/access errors and records partial coverage.

PDF sample downloads opened successfully: FPT 73 pages, VCB 84 pages, HPG 53 pages and GVR 204 pages. Some PDFs are scanned: being downloadable does not guarantee native text extraction. ZIP contents require separate inspection before financial-statement qualification. Historical ticker aliases such as TCBS under a TCX list also require issuer-identity evidence.

Additional SSI/TCX PDF downloads verified the handling of original provider URLs containing spaces. The initial text-pattern probe missed those URLs; the final collector reads the exact structured `Url` field. Their PDFs and ZIPs are both included in discovery seeds.

[Verification evidence](evidence/2026-10-11-vietstock-universal-source-check.json) records all 30 document indexes, URLs, response hashes and the four PDF samples. Local full-universe captures are retained in `data/vietstock-vn30-source-check-2026-10-11/`; additional SSI/TCX captures are in `data/vietstock-archives-source-check-2026-10-11/`.

This is enabled for on-demand discovery. No scheduler was started and no financial DB was written. Downloaded files still require issuer/period/scope/audit qualification and exact revision-lineage review. Provider list timestamps are not issuer publication evidence. This source check does not change the Batch 1 conflict dispositions or DI9 status.

Validation: 16 routing/issuer-collector unit tests passed, including rejection of extra query parameters; TypeScript, ESLint, architecture boundaries and `git diff --check` passed. The full-universe anonymous index check and six live PDF sample downloads passed.
