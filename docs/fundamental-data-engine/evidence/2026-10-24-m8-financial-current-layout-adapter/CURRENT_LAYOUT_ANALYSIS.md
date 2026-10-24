# Current retained-layout analysis

Owner explicitly approved the prior ledger remediation and authorized this adapter in the current session; see OWNER_APPROVAL.json. That decision has no source/admission authority scope.

Active research structure is `data/combine/manifest.json` (`vn30-combine-v1`) and thirty manifest-hash-bound `<TICKER>.json` files with the same schema, policy `report-display-source-priority-v2`, status UNREVIEWED_PRESENTATION and productionAdmissible=false. Hierarchy is reports → report key → periods → period key → variants → groups → rows. All sources/variants remain distinct. Annual, quarterly, YTD, instant and unresolved periods are not merged. Total retained selection counts are descriptive presentation counts, not qualified metrics.

Lineage inputs are `data/manual-download/manifest.json` (vn30-vietstock-download-v1), `data/manual-extracted-pdf/manifest.json` (manual-display-raw-v1), `data/manual-extracted-pdf/display-manifest.json` (manual-display-v1), and `data/manual-extracted-api/manifest.json` (cafef-display-v1) plus `requests.json`. PDFs are directly retained under manual-download. Per-ticker PDF/API extracted JSON supplies exact row pointers. API raw responses remain under manual-extracted-api/raw/cafef. API schema failures are in the API manifest, with ticker, endpoint, mode, raw path and error. Notes and combined review directories remain retained but are not promoted to metrics or an admitted snapshot by this adapter.

Before this change, `app/server/dashboard.ts` called `readManualCurrentSnapshot`, which expects the removed `data/manual-current/current-analysis.json` and manual-fundamentals PDF directory. No active loader now imports that legacy reader. Its source remains historical, but no legacy directory, link or transformed replacement snapshot was recreated.

Existing CurrentAnalysisSnapshot includes canonical accounting/readiness semantics and is consumed by a scoring bridge. It is unsuitable for unreviewed combined presentation values. A new, deliberately separate RetainedResearch DTO represents only read-only research, with no canonicalFacts, accepted snapshot or scoring input.

Source hashes identify exact retained bytes, not publisher authority. Retrieval dates are not publication times. Actual publication times remain null/unqualified. Explicit CONSOLIDATED/STANDALONE scope survives; unknown scope remains UNKNOWN, including some files whose names suggest parent statements. No filename-derived authority or scope qualification is invented.
