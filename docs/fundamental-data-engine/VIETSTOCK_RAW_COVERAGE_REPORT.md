# Vietstock raw import and document coverage — 2026-10-10

Reports for MCH, MSN, VCB, VHM and VIB were appended to the owner-selected `data/initialization-08b.sqlite`. Each ticker has locally checked consolidated documents covering Q1–Q4/2025, audited FY2025, Q1–Q2/2026 and reviewed H1/2025 and H1/2026. These are document availability and period/scope checks, not numerical financial admission or independent DI acceptance.

The research source register now has raw PDFs for 30/30 candidates. Official VN30 constituent certification and complete-period coverage for the other 25 candidates remain pending.

| Ticker | Q1/2025 | Q2/2025 | Q3/2025 | Q4/2025 | FY2025 | H1/2025 reviewed | Q1/2026 | Q2/2026 | H1/2026 reviewed |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| MCH | ZIP/PDF | ZIP/PDF | ZIP/PDF | PDF | PDF | ZIP/PDF | PDF | PDF | PDF |
| MSN | PDF | PDF | PDF | PDF | PDF | PDF | PDF | PDF | PDF |
| VCB | PDF | PDF | PDF | PDF | PDF | PDF | PDF | PDF | PDF |
| VHM | PDF | PDF | PDF | PDF | PDF | PDF | PDF | PDF | PDF + correction ZIP |
| VIB | PDF reviewed | PDF | 9T reviewed + Q3 income supplement | PDF | PDF | PDF | PDF reviewed | PDF | PDF |

`ZIP/PDF` means the original archive bytes are in DB raw captures and the contained PDF was reconstructed and inspected locally. Extracted members are not separate admitted PDF document records. MCH archives contain both Vietnamese/English statements and profit explanations; explanations were excluded from the required statement coverage cells. VIB's nine-month report covers the September 2025 reporting endpoint, while its separate Q3 income supplement is retained without treating it as a full statement. Annual and quarterly cumulative results still require explicit period transformation before numerical comparison.

Two append runs completed:

- `vietstock-20261010-01`: VCB, VHM and VIB imports succeeded; MSN's 53,274,806-byte consolidated Q3/2025 PDF exceeded the old transport cap. MCH failed batch validation because repeated archive notices were incorrectly duplicated. The failure was recorded; its first batch was not persisted.
- `vietstock-20261010-02`: MCH succeeded after deduplicating the archive notice. MSN Q3/2025 succeeded after aligning the transport and collector cap to the reader's existing 64,000,000-byte bound. Historical failure events remain intact. The run also retrieved MSN Q2/2026 again through its configured sample URL.

The import covers 93 distinct successful public resources: 84 PDF URLs and 9 ZIP URLs. Repeated retrievals and archive members produced 113 inspected PDF instances representing 111 distinct PDF contents. These include separate reports, translations, supplements and correction documents, rather than 111 independently qualified financial statements.

| DB state | Before | After |
| --- | ---: | ---: |
| Source versions | 69 | 75 |
| Import batches | 70 | 76 |
| Raw captures | 2,882 | 3,806 |
| Canonical observations | 0 | 0 |
| Snapshot runs | 0 | 0 |
| DI acceptances | 0 | 0 |
| Portfolios | 0 | 0 |

Verification reconstructed the actual raw bytes from the specified DB, checked each capture payload hash, contiguous chunk count, full resource length and SHA-256, opened PDFs with PyMuPDF, bounded archive member sizes/counts, and visually checked the required consolidated documents' issuer/scope/period on covers or disclosure/statement pages. Most PDFs are scanned; text extraction alone was inadequate. Source UI timestamps and printed disclosure dates were not adopted as historical PIT boundaries. Digital signatures were not independently authenticated.

VHM's original and corrected H1/2026 reports are both retained. No automatic correction precedence or backdated knowledge boundary was granted. Raw archive support preserves the exact URL, observed MIME and ZIP signature; ZIP bytes are excluded from the verified-PDF reader. Arbitrary routing queries and credentials remain rejected. The shared 1 GiB per-run response cap remains in place.

The saved routes and source catalog now reference the actual successful DB captures and this coverage evidence. Each required coverage cell is linked to resource URL, PDF/member hash, capture IDs, page count and inspected page index in [machine-readable evidence](evidence/2026-10-10-vietstock-raw-coverage.json). Historical source checks and the earlier 25/30 report remain as records of their respective runs.

Validation: 13 collector/integration tests and 8 FPT regression tests passed; TypeScript, targeted ESLint, source boundaries and diff whitespace checks passed. The first full-suite run passed 967 tests but exposed one stale architecture expectation against the dated source-register preflight packet. The CLI correctly fingerprints the updated register; the test now compares current CLI output with the current preflight and preserves the dated historical packet. Final full-suite verification passed: **77 test files, 968 tests**. The repository inventory remained identical throughout that final run (892 files; SHA-256 `247a8bf4f9477e81a6ff5374676daf6a167361f6d0511b64f765156ba299ee6f`). This validation-result sentence was added after the successful run; implementation and source inputs were unchanged.

Financial normalization, numerical extraction/reconciliation, source/document approval and DI acceptance remain unexecuted. The period matrix is a local advisory document check and does not certify the numerical dataset as ready for valuation or scoring.
