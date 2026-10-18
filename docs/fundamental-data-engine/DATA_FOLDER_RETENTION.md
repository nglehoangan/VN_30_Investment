# Data-folder cleanup

User requested on 2026-10-18: inspect the entire `data/` directory, delete unnecessary artifacts without backups, keep extracted and aggregated JSON.

Retained:

- `data/manual-extracted/display-v1/*.json`: full PDF extraction values per ticker and extraction metadata.
- `data/providers/cafef/**/*.json`: extracted/mapped financial JSON, raw API JSON and request inventory.
- `data/comparisons/**/*.json`: per-ticker source extracts, annual aggregation, review/exclusion data and provenance/index JSON.
- `data/manual-current/*.json`: existing current-analysis output.
- `data/vn30.sqlite` and active SQLite sidecars: the application's operational database, not a disposable backup.

Removed without backups: source PDFs, scan/page images, compressed OCR readers/documents, old extraction runs and remediation work directories, initialization/backups, old import/probe/session/onboarding artifacts, and Markdown files inside `data/`. Source scripts and repository documentation outside `data/` were retained.

`data/retained-data-index.json` records the exact cleanup totals, retained JSON hashes and verification. It contains metadata only, not backups of deleted content. All retained JSON was parsed and checked byte-for-byte across cleanup; SQLite quick_check is also required.

The JSON output remains usable for reading/display. Historical provenance pointers and source hashes remain unchanged as historical metadata; many source files they refer to no longer exist. PDF source replay, full re-extraction and old tests that require deleted readers/PDFs cannot run without reacquiring sources. No historical source-validation result should be presented as current source-file availability.

Cleanup tool: `python3 scripts/prune-data-artifacts.py` previews; `--apply` deletes. It has an explicit allowlist and asserts all 30 tickers' extracts/aggregations and the active database are retained.
