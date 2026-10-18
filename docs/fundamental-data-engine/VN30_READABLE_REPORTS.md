# VN30 readable PDF-first reports

Requested 2026-10-18: apply the VNM readable-data and source-priority conventions to the complete retained 30-stock project universe. Builder: `scripts/build-vn30-readable.py`. Tests: `scripts/test-vn30-readable.py`.

Outputs: `data/comparisons/VN30/`.

- `annual-pdf-first.json`: aggregate of 30 tickers, four annual periods (2022–2025), three primary reports. Hierarchy: `tickers → ticker → reports → report → periods → year → groups → items`.
- `manifest.json`: exact ticker inventory, period scope, counts, review basis and per-ticker selection hashes.
- `review-index.json`: paths to each ticker's review JSON and readable Markdown table.
- `<TICKER>/annual-pdf-first.json`: per-ticker selection, directly under `reports → periods → groups → items`.
- `<TICKER>/manual.json`, `cafef.json`: inline source values and readable source captions, codes, source file/page or origin references. Kept distinct from selected values.
- `<TICKER>/annual-review.json`, `annual-review.md`: pending OCR/caption/period/unit/scope/mapping checks, prioritized by conflict and reference risk before routine OCR checks.
- `<TICKER>/excluded-cafef-pdf-duplicates.json`: omitted nonzero fallback references and same-amount PDF evidence; headings are recorded separately by reason in this ledger.
- `<TICKER>/additional-period-candidates.json`: all other or unresolved primary-report columns, with inline values preserved. No interim-to-annual conversion.
- `<TICKER>/provenance.json`: input hashes, PDF hashes, exact source-display JSON Pointers and raw provider JSON Pointers.

VNM reuses the existing image-checked annual outputs without changing them. Its per-year source/comparison/review files are copied under `VN30/VNM/FY<year>/`. Its original multi-year provenance filename remains valid alongside `provenance.json`. The other 29 stocks use the existing corpus OCR output. They are **unreviewed extraction candidates**, explicitly labelled and kept pending. Applying the source rule does not imply all their financial lines have been visually or semantically reviewed like the VNM pilot.

The universe is the retained project/CafeF inventory (ACB, BID, BSR, CTG, FPT, GAS, GVR, HDB, HPG, LPB, MBB, MCH, MSN, MWG, SAB, SHB, SSB, SSI, STB, TCB, TCX, VCB, VHM, VIB, VIC, VJC, VNM, VPB, VPL, VRE). This operation does not fetch/reconstitute a live exchange index.

## Matching and source selection

1. Keep original annual financial documents and their current-year columns. Exact year/end-year headers qualify. Relative “năm nay/số cuối năm/current year/ending balance” headers qualify only with an identified original annual document year and no competing previous/opening/quarter/change-column cues. The inferred basis is explicit and requires review. Never infer a year solely from a filename for an unidentified column.
2. Preserve codes and occurrences. Merge same-caption/code candidates within the same scope only; preserve their separate input references. Conflicting PDF values or dimensions remain unresolved/null. Repeated or missing captions retain occurrence context where necessary. No latest-wins source selection.
3. Match provider rows only on a **unique exact normalized caption**, stripping display numbering, accents, punctuation and explicit printed arithmetic formulas. Do not use fuzzy matching, the VNM-specific crosswalk for other issuers, source-code equality alone or amount equality to create a mapping. When a caption exists ambiguously in PDF, retain a mapping issue instead of falling back to CafeF.
4. Valid numeric PDF values (including zero) win. Dash/invalid OCR stay distinct. CafeF fallback is labelled and pending; null is never coerced to zero. Raw value differences are explicitly unverified for scope/unit equivalence.
5. Per user policy v2, a nonzero unmapped CafeF fallback whose amount occurs under a different caption in the same ticker/report/year PDF is omitted from selection. Its exact source value, PDF refs and OCR-review status remain in the exclusion ledger. This is a user-defined exclusion, not proof of a provider row-shift error. Matched same-concept pairs and zeros are not removed by this rule.
6. Preserve currency and scale as reported. Never guess CafeF monetary units or convert unknown units. PDF amount units distinguish VND from VND_SCALE_1000000. Generic EPS scaling is left unknown until source review; checked transcriptions can state VND_PER_SHARE. Standalone/consolidated/unknown scopes have separate groups.

The previous OCR corpus missed VIC FY2022's primary income statement. A checked transcription of physical PDF pages 13–14 supplies 23 rows with original signed million-VND amounts and separate per-share units: `VIC_FY2022_INCOME_TRANSCRIPTION.json`. Its source PDF hash is pinned. No original PDF, full-corpus extraction file, VNM checked evidence or accounting/scoring record is overwritten.

## Rebuild and verification

```sh
python3 scripts/build-vn30-readable.py
python3 scripts/test-vn30-readable.py
python3 scripts/test-vnm-history.py
python3 scripts/test-report-source-priority.py
python3 scripts/test-vnm-readable.py
```

Whole-universe tests verify 30 ticker identities, 120 ticker-years and all three annual report slots; aggregate/per-ticker equality and output hashes; unchanged checked VNM selection; no dropped primary-report source cells; inline value equality to source JSON Pointers; PDF hashes and raw provider captures; conflict/null/PDF-priority boundaries; exact-caption matching and exclusion boundaries; relative-header safeguards and VIC's repaired signed accounting identities.

Zero missing report/year column slots means a candidate column exists, not proof of complete or accurate source-table extraction. Missing captions, ambiguous numeric formats, erroneous page classification and OCR misreads can still exist and are review items. All generated selections remain `productionAdmissible: false`.
