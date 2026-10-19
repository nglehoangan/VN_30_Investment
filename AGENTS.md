<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Report API data storage convention

User-confirmed convention (2026-10-18): use the CafeF display mapping as the default pattern when storing financial report API data for future website rendering.

- Keep immutable raw API responses plus a request inventory containing parameters, retrieval time, response status, SHA-256 and raw payload path. Keep provider namespaces separate.
- Store presentation JSON per ticker with the hierarchy `reports → report key → periods → year/quarter key → variants[] → groups[] → rows[]`. Annual, quarterly and YTD periods must remain distinct.
- Preserve provider template labels, group IDs, row codes and array order. Use codes and occurrence-aware IDs for identity, not labels. Preserve provider level metadata without assuming it defines tree depth.
- Preserve separate captures/report types/request modes as variants; do not silently overwrite or select the latest. Flag mode mismatches and duplicate template codes. Retain cells absent from the template separately; record invalid periods or failed captures in a manifest.
- Store financial values as lossless decimal strings. Distinguish zero, explicit null and missing cells. Keep declared units and per-share metadata; mark undeclared units explicitly, without guessing conversion factors.
- Retain source hash, raw payload path, retrieval time and an exact JSON Pointer for each available cell so values can be traced to the original response.
- Presentation data alone does not authorize accounting admission or scoring. Keep its status explicit and follow the existing admission rules independently.
- CafeF reference implementation: `src/infrastructure/fundamentals/cafef-display.ts`; rebuild command: `node scripts/map-cafef-display.mjs` with the project's supported Node version. Current output: `data/providers/cafef/display-v1/<TICKER>.json`; documentation: `data/providers/cafef/display-v1/README.md`.
- Apply this pattern to other report APIs using their own provider directory, versioned schema and adapters. Do not mix raw captures from different providers or rewrite existing sealed evidence.

## Manual PDF report display JSON

- User requested the same presentation hierarchy for all PDFs under `data/manual-fundamentals`. Output per ticker: `data/manual-extracted/display-v1/<TICKER>.json`.
- Workflow and limitations: `docs/fundamental-data-engine/MANUAL_PDF_DISPLAY_JSON.md`. Scripts: `scripts/extract-manual-display.py`, `scripts/map-manual-display.py`, `scripts/verify-manual-display.py` (Python with PyMuPDF; local Apple Vision for missing scan readers).
- Keep all physical PDFs/pages represented in the inventory. Preserve separate source documents, comparative periods, consolidation scopes and revision variants. Preserve source PDF hashes, page/box evidence and exact raw reader JSON pointers.
- Geometry/OCR output is an unreviewed presentation candidate; do not promote its labels, period assignments or amounts to approved accounting facts. Unknown periods, units, missing cells and ambiguous readings must remain explicit.

## Readable report comparisons

- User requested inline values and readable concept keys for comparing manual PDFs with CafeF, starting with VNM. Keep hashes in a separate provenance ledger, not as user-facing data keys.
- VNM FY2025 pilot: `docs/fundamental-data-engine/VNM_READABLE_COMPARISON_PILOT.md`; output `data/comparisons/VNM/FY2025/`; builder `scripts/compare-vnm-readable.py`.
- Match captions/definitions, period, scope and units explicitly; never choose mappings because amounts happen to match. Keep source captions/codes/values, unknown dimensions, classification differences, dash versus zero and aggregation formulas visible. Do not generalize the pilot's issuer/year-specific code crosswalk to the full universe without checking source templates.

## User source priority for readable report data

- User requested PDF first: use a readable numeric PDF value, including zero; only if unavailable use CafeF as a clearly labelled reference and list it for user checking. Preserve PDF when values differ. Never turn a PDF dash/null/unreadable OCR into zero automatically.
- Versioned rule: `src/domain/fundamentals/report-display-source-priority-v2.json`; implementation: `scripts/lib/report_source_priority.py`; workflow: `docs/fundamental-data-engine/PDF_FIRST_REPORT_RULE.md`.
- VNM outputs: `selected-pdf-first.json`, `review-pdf-first.json`, `review-pdf-first.md` under `data/comparisons/VNM/FY2025/`; rebuild with `scripts/select-vnm-pdf-first.py` after rebuilding the comparison.
- CafeF reference values and template zeros require review of PDF notes, definitions, period, unit, scope and duplicate/label-drift warnings. No latest-wins conflict resolution or automatic accounting/scoring admission is authorized by this display-selection rule.

- User-authorized exclusion (2026-10-18): omit nonzero CafeF-only fallback rows whose amount already appears under another PDF caption in the same issuer/period comparison. Preserve excluded values and PDF matches in an audit ledger; do not use equality to create mappings or assert proven provider errors. Do not exclude zeros or correctly mapped same-concept PDF/CafeF pairs. VNM ledger: `data/comparisons/VNM/FY2025/excluded-cafef-pdf-duplicates.json`.

## VNM historical readable reports

- Checked FY2022–FY2024 annual current-year columns: `scripts/compare-vnm-history.py`, transcripts/input pins in `docs/fundamental-data-engine/VNM_FY<year>_*`. Scope is the three primary statements on physical pages 7–14 of each original annual PDF. Keep FY2025's existing builder and evidence unchanged.
- Run `scripts/select-vnm-pdf-first.py <year>` for each rebuilt year, then `scripts/summarize-vnm-history.py`; verify with `scripts/test-vnm-history.py`. Multi-year output: `data/comparisons/VNM/annual-pdf-first.json`; review index: `data/comparisons/VNM/README.md`.
- Historical cashflow templates have repeated codes and extra captions. Keep loss on asset disposal, goodwill amortization, associate adjustments and NCI dividends separate; explicit comparison aggregates preserve operands. Do not reuse the FY2025 crosswalk blindly.
- Additional 2021 comparative columns and interim 2026 are separate unreviewed candidates. The interim OCR currently labels both Q2 and six-month income variants as YTD; do not select by period key alone.

## VN30 readable PDF-first data

- User requested applying the rule to the entire retained 30-stock universe. Builder: `scripts/build-vn30-readable.py`; tests: `scripts/test-vn30-readable.py`; workflow/limitations: `docs/fundamental-data-engine/VN30_READABLE_REPORTS.md`.
- Output: `data/comparisons/VN30/annual-pdf-first.json`, per-ticker `<TICKER>/annual-pdf-first.json`, `manifest.json`, `review-index.json`, readable review tables and source/exclusion/provenance ledgers.
- Annual scope: 2022–2025. Reuse checked VNM files unchanged; keep the other 29 stocks explicitly UNREVIEWED_OCR until source-image/caption review. Never describe full-corpus automated selection as VNM-level visual checking.
- Generic mappings require unique exact normalized captions, not equal codes, fuzzy labels, VNM crosswalk reuse or matching amounts. Resolve ambiguous PDF matches as issues, not provider fallback. Keep known/unknown units and standalone/consolidated scopes distinct. Do not guess generic EPS scaling.
- Relative year headers require explicit current/ending cues plus the original annual document year; opening/prior/quarter/ambiguous change columns stay separate. All primary-report input cells remain either in annual manual data or additional-period candidates.
- VIC FY2022 income extraction gap is supplied by the checked, hash-pinned `docs/fundamental-data-engine/VIC_FY2022_INCOME_TRANSCRIPTION.json`. Preserve signed million-VND amounts and separate EPS unit.

## User-authorized data-folder cleanup

- On 2026-10-18, the user explicitly requested deleting unnecessary artifacts in `data/` without backups, retaining extracted and aggregated JSON. This supersedes earlier source-retention instructions for the deleted data-folder artifacts.
- `scripts/prune-data-artifacts.py` previews cleanup; `--apply` executes deletion. Retain PDF display JSON (direct files in `data/manual-extracted/display-v1/`), CafeF JSON (including raw captures), comparison/aggregation JSON, current-analysis JSON and the active `data/vn30.sqlite` database/sidecars.
- Original PDFs, OCR readers/images, remediation work directories, old backups/import/session/onboarding artifacts and data-folder Markdown were removed. Do not claim source PDF/OCR replay still works, automatically regenerate deleted work directories or treat historical provenance pointers as extant files.
- Cleanup results and retained-byte verification are in `data/retained-data-index.json`. JSON values remain unchanged. Full source extraction/replay requires reacquiring source documents. Use retained-data checks for current JSON integrity; historical source-replay tests intentionally depend on removed artifacts.

## User-authorized full data rebuild (2026-10-19)

- The latest owner request supersedes the old data-folder retention and output paths above: delete everything in `data/` except `vn30.sqlite`, reacquire saved Vietstock PDFs and CafeF responses, and build four directories: `manual-download/`, `manual-extracted-pdf/`, `manual-extracted-api/`, `combine/`. Do not recreate historical folders or symlinks as substitutes for fresh acquisition.
- Control inventory and reset receipt: `docs/fundamental-data-engine/rebuild-2026-10-19/`. The database is preserved; the rebuild does not admit new accounting facts or scores.
- PDF display hierarchy and source-priority v2 still apply. PDF numeric values remain decimal strings in their declared native units. Notes include every page's full text and raw geometry pointers under `manual-extracted-pdf/notes/`; OCR is unreviewed.
- Preserve raw CafeF captures and all request variants in `manual-extracted-api/`; quarantine schema failures in the manifest. Keep failed PDF downloads visible. Missing documents/periods are not zero values.
- Current workflow: `docs/fundamental-data-engine/REBUILT_DATA_WORKFLOW.md`. Verification: `scripts/verify-vn30-rebuilt.py` and `data/combine/verification.json`. Historical artifact-specific checks may require the intentionally deleted old files; do not restore them by copying historical extracted amounts into the rebuilt data.
- `scripts/prune-data-artifacts.py` implements the superseded cleanup layout and is not the cleanup workflow for these four directories. Preserve freshly reacquired PDFs and API raw responses unless the owner explicitly requests another reset.
- Subsequent owner cleanup request: keep source files, raw data and results; clear disposable processing intermediates. Remove rendered page images, temporary previews, partial files and scratch logs/scripts after processing. The initial cleanup retained OCR raw; the later direct-PDF request below supersedes that retention. Cleanup receipt: `docs/fundamental-data-engine/rebuild-2026-10-19/temporary-cleanup.json`.

## Direct PDF evidence and OCR-reader removal

- Latest owner request: link directly to the source PDF instead of hash-named intermediate JSON, then delete `data/manual-extracted-pdf/documents/` and `readers/`.
- Migration: `scripts/link-pdf-sources.py`; receipt: `docs/fundamental-data-engine/rebuild-2026-10-19/direct-pdf-migration.json`. Source PDFs, API raw, extracted values and full-page notes remain. Direct evidence contains PDF path, physical page (`#page=N`) and normalized cell/caption boxes. Hashes remain integrity metadata only.
- Current PDF manifests have `evidenceMode: DIRECT_PDF`. Final combined rows contain `pdfEvidence.pdfPath`, `href`, page and boxes; their JSON Pointer to the readable per-ticker JSON remains available for value comparisons. No active result depends on removed OCR files.
- Exact prior word-level OCR/JSON-Pointer replay is unavailable after deletion. Re-extract PDFs to rebuild OCR if needed; do not silently recreate deleted raw readers during ordinary validation. Run `scripts/verify-vn30-rebuilt.py` to validate current PDF links, page coverage, values, API lineage and selection rules.
