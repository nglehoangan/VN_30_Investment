# M8 historical market price and corporate-action validation closure

Final decision: **PARTIAL_PRICE_COVERAGE**. All 11 required deliverables completed. NAV calculation is **not ready** and was not implemented.

12 historically traded ordinary labels (including TPB) and 5 pending buckets reviewed. 17 trades / 29 source-backed securities events read; 484 dates reconstructed separately on posting and trade-execution bases, with unknown inception and entitlement timing explicit.

Inspected all 999 retained raw market files and legacy/unified request inventories. Relevant 166 daily stock files pass hash/OHLC/duplicate checks. Eleven ordinary tickers have 253 bar dates 20/10/2025–26/10/2026, only 252 with post-completion capture, ending23/10. No TPB daily bars. Missing early held prices and unfinished26/10 are enumerated per date/security, with exact source references. No conflicting completed prices detected across captures; no latest-wins or merges used to hide revisions.

Raw EOD technical candidate replay PASS for19/10,21/10,23/10; seven legacy candidates remain BLOCKED due historical pins/replay divergence and are preserved. Historical adjustment semantics remain unqualified. No general raw-history inference from three raw EOD dates or from matching price values. 2025 session calendar is unknown; 2026 is technical candidate only.

Corporate-action record/credit/transfer intervals and source cost diagnostics preserved; no bonus double counting, no ratio/date inference, FPT_WFT20 unresolved. Cash rows reconcile, but historical receivable/debt/unsettled/inception completeness does not. **0 dates** can be independently recomputed as full NAV without assumptions; one broker-reported07/10 snapshot remains available and is distinguished from reconstruction.

78 synthetic contract tests PASS, zero failures; actual raw checks/candidate replay outcomes separately recorded. Existing data, SQLite, raw files, workbook, active pointer and source/policy/identity code unchanged. No API, imports, approvals, accepted mappings, NAV/D2/scoring activation or next phase.

Stop after validation. Owner review is required before any historical NAV calculation implementation or new acquisition scope. See REMAINING_BLOCKERS.md for exact minimum missing evidence; do not request cash/trades again when already verified.
