# VNM S4 skill capability review

Phase 1 recorded before modifying skills. Repository HEAD matches reviewed baseline `c7cac5031d67b5e72064876f8d25313aa3112601`; original file hashes are in `BASELINE.json`. Searched project `skills/`, user `~/.codex/skills/` and `~/.agents/skills/` (SKILL.md through depth 3); the two matching skills are project-local. No user-level matching skills found. No installed external skill will be modified.

| Capability before changes | Price skill | Corporate-action skill |
| --- | --- | --- |
| Path | `skills/fetch-cafef-price-history/SKILL.md` | `skills/fetch-vietstock-dividend-pdfs/SKILL.md` |
| Invocation | Python `scripts/fetch.py` | Agent follows SKILL.md and `references/event-api.md`; no executable helper |
| Parameters | symbol, exchange, years, as-of; no exact start/end | URL code, from/to, tab=1; API eventTypeID=1/channelID=0 |
| Upstream | CafeF PriceHistory.ashx | Vietstock events calendar/eventstypedata and PDF FileUrl |
| Pagination | PageSize=30, checks TotalCount and unique days | Documented PageSize=20/all pages; manual implementation required |
| Dates | Code sends dd/mm/yyyy (unverified assumption before execution), stored ISO; rolling one-year windows | API ISO filters; raw .NET timestamps, Vietnam local conversion documented |
| Retry/errors | 45s timeout, no retries, raises on HTTP/schema/page errors; atomic final file | Bounded retries instructed; no executable enforcement |
| Output | One JSON/ticker: prices/raw rows, requests/rawResponse, conflicts; units=null | PDFs and manifest, event raw fields; no normalized executable schema |
| Duplicate behavior | Same ticker/day keeps first row; differences recorded | Shared PDFs deduplicated while keeping EventID rows |
| Price semantics | Both GiaDongCua and GiaDieuChinh; no adjustment methodology or unit declaration | Not a price source |
| Actions | None | Tab1 covers cash/stock dividends, bonuses, additional issues where listed; splits/reverse splits/treasury changes and other capital events NOT certified exhaustive |
| Raw lineage | HTTP status, UTC receipt, URL/parameters, raw text/hash for newly retained rows/conflicts; empty/no-change page receipt not retained | Required by instructions, but prior manifest has event objects only, not exact API body/page receipt; historical reused PDF receipts partly incomplete |

Minimal improvements justified: exact price --start/--end, bounded transport retry and optional retention of request evidence for no-change/empty ranges; a reusable corporate-action CLI implementing existing instructions with raw receipts, pagination, PDF reuse and nullable normalized fields. Do not invent provider adjustment methods or normalize uncertain ratios. Phase 2 before/after exact-range execution and test outcomes are recorded in validation outputs after acquisition.

Governance: only VNM S4. The current user explicitly requests official issuer/HOSE/VSDC cross-checks; this is a scoped verification exception to prior acquisition-only policy, not general financial-report acquisition authorization or formal source promotion. Default skill PDF downloader remains Vietstock-only.
