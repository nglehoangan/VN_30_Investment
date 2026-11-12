# VNM S4 source authority

Acquisition/validation success and formal source acceptance are separate. All new data are VNM only. No source policy, authority document, admission decision, seal, accounting fact, scoring rubric or database row was changed.

| Source | Retained identity | Supports | Does not establish |
| --- | --- | --- | --- |
| CafeF API + own history HTML | `data/market-history/cafef/VNM.json`; `CAFEF_UNIT_SOURCE.json` | Actual dates, OHLC/raw-vs-adjusted field labels, UI thousand-VND unit | Adjustment method/anchor, as-known vintage, official exchange authority |
| Vietstock tab1 API | Exact/rerun manifests referenced in `CORPORATE_ACTION_REVIEW.json`; each page body/hash/UTC/status | 15 provider candidate rows with raw dates/FileUrl | Exhaustive capital register or correct cash values without PDF checking |
| Retained HOSE-authored PDFs mirrored at Vietstock | 11 existing PDF paths/hash/page bindings; all relevant pages visually checked | Dates, amounts and fiscal captions for15 components | Verified original publication timestamp/authenticity of every historical mirror |
| Official VSDC pages | `OFFICIAL_SOURCE_RECEIPTS.json`, retained HTML and `OFFICIAL_HTML_TEXT.json` |8 historical components, known-by-cutoff future dividend and2 wording corrections | Exhaustive multi-year rights/treasury/capital register |
| Official HOSE PDF Oct2025 | Official receipt reuses byte-identical retained Vietstock PDF, no duplicate PDF | Source-byte equality and terms350+2500 on16Oct2025 | Independence of vendor feeds |
| Issuer disclosure on HOSE Oct2026 | New official PDF path in `OFFICIAL_SOURCE_RECEIPTS.json` | Explicit publication28Oct; future2,500 dividend, record/payment dates | Proof of actual investor receipt or complete action universe |
| TCBS existing SQLite observation | `sqlite:broker_observation/TCBS_API_RESPONSE:fff0b29bda17b3336f131f0e408fb1d155eb7cf7e95f138bd29520a386c59283` | Hash-verified30Oct close56,900 and prior day's bars; no new raw copy | Declared adjustment method or matching volume definitions |
| Retained Vietstock30Oct profile | `data/manual-extracted-api/vietstock-profile-v1/20261030T121210Z/VNM.html` and prior bound research |56,900 close /2,089,955,445 listed/outstanding snapshot | Unbroken share movement register or independent upstream source |

The current owner request explicitly asks official issuer/HOSE/VSDC cross-checks. Only this bounded verification uses the exception to earlier Vietstock-only acquisition instructions; the reusable corporate-action downloader still blocks non-Vietstock hosts by default. No general permission/source promotion is inferred. No unrelated issuer/financial-report acquisition occurred.

HTTP status, receivedAt and SHA-256 are recorded for normal retrievals. Earlier reused-PDF receipts retain their historical limitations rather than inventing a new HTTP200/time. Raw landing HTML containing session token is not retained; a receipt hash is. API page bodies do not contain that token. Diagnostic date-format probes have exact raw bodies/hashes in the same ticker history JSON; `DATE_FORMAT_PROBES.json` holds pointers, not another raw price capture. Probe status/time were not captured and remain null; these probes are not used instead of fully receipted exact-range retrieval pages and their out-of-range rows are not selected into history.

Historical dates are not automatically as-known availability. PDF document/signing date is not silently treated as announcement date. All retrievals occurred11Nov after30Oct research cutoff. VSDC disclosed dates and issuer explicit publication can bind those specific events, but provider-adjustment vintage and full announcement chronology are still missing. Agreeing vendor closes do not prove independence or original exchange authority. Formal admission/CIO adoption remains PENDING.
