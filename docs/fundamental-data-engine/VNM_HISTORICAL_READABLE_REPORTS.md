# VNM historical readable financial reports

Built 2026-10-18 from local retained PDFs and saved CafeF captures. Three added annual datasets: FY2022, FY2023, FY2024. Existing FY2025 remains unchanged.

Each added year includes the current-year column from the original audited consolidated PDF, physical pages 7–14: balance sheet, income statement, cashflow statement. Source images were inspected by the assistant; this is not independent accounting admission. Checked transcriptions and pinned source hashes are retained alongside this document. Transcriptions repair missing/merged OCR rows without rewriting the original corpus.

Outputs under `data/comparisons/VNM/`:

- `FY<year>/manual.json`, `cafef.json`: readable inline values, source captions and codes, page references; hashes separate in `provenance.json`.
- `FY<year>/values.json`, `comparison.json`, `report.md`, `structure.json`: raw decimal-string comparison and schema notes.
- `FY<year>/selected-pdf-first.json`, `review-pdf-first.json`, `review-pdf-first.md`, `excluded-cafef-pdf-duplicates.json`: version-2 source priority and review/exclusion ledgers.
- `annual-pdf-first.json`: all four annual selections, `reports → report → periods → year → groups → items`.
- `annual-review.json`, `annual-provenance.json`, `README.md`: combined queue, exact output hashes and human-readable index with financial totals.
- `additional-period-candidates.json`: 2021 comparatives and interim 2026 variants, explicitly unreviewed and excluded from the annual selection. There is no separate FY2021 annual PDF locally. The interim OCR assigns Q2 and six-month income columns to the same YTD key; retain variants, never select by this key alone.

| Added year | Checked PDF lines including dashes | Direct PDF numeric selections | Explicit PDF aggregates | CafeF references | Null/missing selections | Excluded nonzero CafeF duplicates | Review queue |
|---|---:|---:|---:|---:|---:|---:|---:|
| 2022 | 136 | 130 | 3 | 66 | 4 | 4 | 82 |
| 2023 | 134 | 133 | 3 | 63 | 0 | 5 | 75 |
| 2024 | 134 | 132 | 3 | 63 | 1 | 5 | 77 |

Dashes remain null, including PDF-only dashes with no compatible reference. A selected-record count includes unresolved null rows. CafeF dimensions remain undeclared; observed matching amounts do not certify scope/unit equivalence. No live provider request was needed.

Historical mappings were checked against captions rather than amounts. Compared with FY2025, older cashflow tables separately report asset disposal losses and NCI dividends. Three explicit comparison aggregates cover other operating adjustments (goodwill, disposal, associate adjustment), FX/translation and combined dividends. Components remain in PDF data, so these rows must not be summed indiscriminately. NCI contributions/refunds remain PDF-only rather than being forced into broad equity slots. The 2022 deposit receipt and loan recovery share printed code 24 but have different occurrence keys. Repeated income carry-forward lines are omitted from economic row counts.

Rebuild:

```sh
python3 scripts/compare-vnm-history.py
python3 scripts/select-vnm-pdf-first.py 2022
python3 scripts/select-vnm-pdf-first.py 2023
python3 scripts/select-vnm-pdf-first.py 2024
python3 scripts/summarize-vnm-history.py
python3 scripts/test-vnm-history.py
python3 scripts/test-report-source-priority.py
python3 scripts/test-vnm-readable.py
```

Verification covers annual source-page coverage, accounting identities, cashflow reconciliation, 588 exact CafeF JSON pointers, PDF priority, exclusion boundaries, explicit operands, combined output equality and output hashes. Nothing updates the production accounting/scoring database.
