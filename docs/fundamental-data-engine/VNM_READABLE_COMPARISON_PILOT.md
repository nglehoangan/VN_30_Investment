# VNM: readable PDF/CafeF comparison pilot

Requested on 2026-10-18. Scope: VNM, audited annual FY2025 current-year column. This tests one ticker/year before extending the mapping. It does not fetch live CafeF data or update accounting/scoring records.

Output: `data/comparisons/VNM/FY2025/`.

- `values.json`: shortest readable view, `reports → report key → 2025 → item key → {pdf, cafef, difference, status}`. Values are inline; derived aggregates are explicitly flagged and provider-only lines remain visible.
- `manual.json`: 132 PDF lines with direct decimal-string values and readable caption keys; source images on physical PDF pages 7–14 were checked for this pilot. One repeated carry-forward profit line is excluded.
- `cafef.json`: all 196 saved provider template lines in the three primary reports, with original values/captions preserved. A common crosswalk key permits side-by-side comparison; it does not rewrite provider data or infer missing monetary units/consolidation scope.
- `comparison.json`: paired values, literal PDF-minus-provider differences, explicit aggregation operands, dash/zero differences and provider-only lines.
- `structure.json`: shared outer hierarchy, differences in fields/grouping/row counts and pilot simplification.
- `report.md`: readable comparison table and findings.
- `provenance.json`: source hashes, JSON pointers and PDF page references. Hashes are deliberately outside the two readable data payloads.

The pilot uses `reports → periods → groups → items`, with a named item such as `loi-nhuan-ke-toan-truoc-thue` containing the actual value. Selecting one known annual variant removes the variant-array indirection for this pilot; the original full-corpus files remain unchanged.

The input pin file `VNM_FY2025_COMPARISON_INPUTS.json` binds the source PDF, old display files and the three raw CafeF captures. The source-image transcription is `VNM_FY2025_PDF_TRANSCRIPTION.txt`; its captions are readable labels, not a claim of verbatim PDF text. Printed repeated codes have explicit occurrence suffixes. A dash remains null/DASH.

Crosswalks match economic captions, with explicit source-code exceptions. They NEVER select a match by comparing equal amounts. For example, PDF financial revenue code 21 maps to the provider caption "Doanh thu hoạt động tài chính" at code 22, even though the observed values differ. Some provider payload values appear at differently labelled slots; these are diagnostics, not permission to relabel/shift source values. For owner/non-controlling interests and term-deposit/debt-instrument categories, definition/classification limitations remain visible.

Two display-only aggregates compare (1) goodwill amortization plus the associate-result adjustment with CafeF other adjustments, and (2) two PDF exchange/translation lines with CafeF's combined exchange line. Original PDF component rows remain intact; derived totals are explicitly marked and have operands/formulas.

CafeF payload monetary units and consolidation scope are undeclared. `MATCH_VALUE_OBSERVED` means equal raw decimal strings under the selected period/caption crosswalk, not fully certified accounting equivalence. PDF image checking here does not constitute independent review, canonical admission or authorization for investment decisions.

Rebuild and verify:

```sh
python scripts/compare-vnm-readable.py
python scripts/test-vnm-readable.py
```

Tests cover exact provider JSON-pointer values, accounting identities within the PDF, aggregation operands, readable/no-hash payloads and prevention of matching equal values to the wrong captions.
