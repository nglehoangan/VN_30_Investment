# Fresh VN30 report corpus — 2026-10-19

The owner explicitly requested deleting all of `data/` except `vn30.sqlite`, then reacquiring the saved Vietstock PDFs and CafeF API data. This supersedes the previous cleanup/output layout. The control plan and reset receipt are outside `data/` in `rebuild-2026-10-19/`. Previous extracted financial amounts were not reused. Hash-bound document identities are metadata only; no previous canonical facts were supplied to the PDF mapper.

## Layout

| Path | Contents |
| --- | --- |
| `data/vn30.sqlite` | Preserved database, hash checked before/after reset and again at final verification |
| `data/manual-download/<TICKER>/*.pdf` | Fresh downloads from saved Vietstock URLs; request inventory in `manifest.json` |
| `data/manual-extracted-pdf/<TICKER>.json` | PDF display candidates using reports → periods → variants → groups → rows |
| `data/manual-extracted-pdf/documents/` | Removed by the later owner request; source references now point directly to PDFs |
| `data/manual-extracted-pdf/readers/` | Removed; table cell/caption boxes remain inline in the extracted JSON |
| `data/manual-extracted-pdf/notes/<TICKER>.json` | Readable text of every page, including notes and unclassified narrative, plus direct PDF page links |
| `data/manual-extracted-api/<TICKER>.json` | CafeF display hierarchy, provider labels/codes/order and capture variants |
| `data/manual-extracted-api/raw/cafef/*.json` | Immutable fresh raw response bodies |
| `data/manual-extracted-api/requests.json` | Parameters, timestamps, HTTP status, hash and payload path for every capture |
| `data/combine/<TICKER>.json` | PDF-first presentation; source/capture variants retained |
| `data/combine/review/<TICKER>.json` | Unresolved selections and user-authorized duplicate-fallback exclusions |
| `data/combine/verification.json` | Corpus, lexical lineage, API lineage, database and source-priority verification |

## Commands

Use the project's supported Node version. Python PDF extraction requires PyMuPDF; scanned pages require the local Apple Vision reader built from `scripts/lib/vision-ocr.m`. OCR must run with access to the macOS Vision service.

For large corpora, build `scripts/lib/vision-ocr-stream.m` with `clang -fobjc-arc -framework Foundation -framework Vision ... -o /path/to/vn30-vision-stream`, then pass `--vision /path/to/vn30-vision-stream --vision-stream` to the extractor. Each worker reuses its recognition request between pages; algorithm settings remain accurate recognition, no language correction, en-US. New readers record the persistent engine and executable hash; completed readers are not overwritten. The sample performance/equality check is recorded in `rebuild-2026-10-19/ocr-performance-check.json`.

```sh
# DESTRUCTIVE: only run --reset when a fresh reset is intended and authorized.
python3 scripts/rebuild-vn30-downloads.py --reset
node scripts/rebuild-vn30-api.mjs --repair-historical-schema

export VN30_PDF_SOURCE_ROOT=data/manual-download
export VN30_PDF_EXTRACT_ROOT=data/manual-extracted-pdf
export VN30_PDF_IDENTITY_INPUT=docs/fundamental-data-engine/rebuild-2026-10-19/pdf-identity-input.json
python3 scripts/extract-manual-display.py --vision /path/to/vn30-vision-ocr --workers 6
python3 scripts/map-manual-display.py
python3 scripts/verify-manual-display.py
python3 scripts/build-rebuilt-pdf-notes.py
python3 scripts/link-pdf-sources.py
python3 scripts/combine-vn30-rebuilt.py
python3 scripts/verify-vn30-rebuilt.py
```

Omit `--reset` to resume fresh downloads. Extraction caches are bound to PDF and reader hashes. Rerun the extractor after adding any PDFs; the final inventory must include every physical PDF. Separate URLs/revisions remain separate files; exact PDF duplicates share raw readers but keep all physical paths. A successful acquisition inventory means every saved link was attempted, not that every link returned a PDF.

CafeF captures cover four report endpoints in annual and quarterly modes, page 1 with page size 20. Eight additional annual requests with page size 4 recover FY2022–FY2025 for CTG and VCB because their longer historical payloads contain incompatible old records. The invalid longer captures remain immutable and recorded as schema failures. Rebuilding display JSON retains all captures rather than selecting the latest. Provider records outside valid period/schema boundaries stay visible through the raw request manifest.

## Selection and limits

- A readable PDF numeric value, including zero, takes priority. The number is stored as a lossless decimal string; declared unit, currency and scale remain separate. Dash, explicit null, ambiguous OCR and missing cells remain distinct.
- Generic matching uses a unique exact normalized caption within each source variant and the same period key. No fuzzy labels, equal codes, matching amounts, inferred EPS conversion, standalone/consolidated mixing, or latest-wins selection creates mappings.
- CafeF values are references requiring review when suitable PDF numeric data are unavailable. Unknown provider units/scope remain unknown. PDF/provider differences are retained with both source pointers. Ambiguous captions/modes stay unresolved. Separate PDF variants are preserved and conflicts flagged; a provider reference does not settle a PDF conflict.
- Per the owner's earlier exclusion rule, nonzero CafeF-only fallback amounts appearing under another PDF caption in the same issuer/period are omitted from selected output and kept in an exclusion ledger. Equality is an exclusion criterion, never evidence of a concept mapping or proven provider error. Zeros and mapped PDF/provider pairs are not excluded by this rule.
- Notes include all pages so that a missed note heading does not discard narrative. Tables, captions, dates, unit readings and scope detected automatically remain unreviewed presentation candidates. Final verification checks lineage and selection rules; it does not certify OCR accuracy or accounting definitions.
- Saved links do not guarantee every historical year or filing type exists. Failed links and available periods are explicit in manifests. Some API histories also omit early years. Historical sealed evidence outside `data/` is unchanged; its old data paths are historical and may no longer exist.
- This rebuild does not update production accounting admission, financial-debt classification, blockers or scoring. Database values remain unchanged.

## Current direct-PDF storage

The owner subsequently authorized removing `documents/` and `readers/` after replacing their references with PDF filenames, physical page numbers and inline cell/caption coordinates. `notes/` keeps the full page text for all 23,004 pages. Hashes are integrity metadata, not the primary lookup path. Combined rows expose `pdfEvidence.href` and `pdfPath` directly, alongside a JSON Pointer to the per-ticker display data for comparison.

Run the extraction/map/lexical-verification/notes steps before `link-pdf-sources.py` when rebuilding from scratch. After migration, use `verify-vn30-rebuilt.py`; the removed OCR tokens cannot be lexically rechecked without re-extraction. The prior lexical verification is archived as `rebuild-2026-10-19/lexical-verification-before-reader-removal.json`. Current validation checks direct PDF/page references and retained data consistency; it does not repeat OCR recognition or certify source-image accuracy.
