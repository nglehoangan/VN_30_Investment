The physical corpus is reconciled. Financial coverage remains incomplete.

Fresh recursive enumeration found **146 physical files and 30 directories**, totaling **176 filesystem entries**. The owner's 176 count matches entries, not files. Against 144 previously inventoried PDFs, the 32 additional entries are exactly 30 ticker directories, `.DS_Store`, and `DOWNLOAD_MANIFEST_FY2022_FY2025.json`. The reconciliation JSON lists all 32 with their actual entry kind; it does not misrepresent directories as physical files.

Physical files discovered: 146  
Expected physical files from owner: 176  
Difference: -30 (the 30 directory entries)  
PDF files: 144  
Valid PDFs: 144  
Unique PDFs: 144  
Duplicates: 0  
Non-PDF: 2  
Excluded: 2  
Previously inventoried: 144  
Previously missed/new: 2 physical files (both non-PDF)  
Unexplained files: 0

The exact disjoint equation is **146 = 144 eligible/in-scope PDF candidates + 0 duplicates + 2 non-PDF + 0 invalid + 0 other exclusions**. Eligibility at this stage means eligible for document qualification, not qualified accounting evidence. The 25 document review gaps remain visible downstream and are not silently removed from the corpus total. All prior PDF paths remain present. Files added after the prior run cannot be established from the available evidence; filesystem times were not substituted for provenance.

Scanner audit: `inspect-08b-manual-corpus.py` previously enumerated only lowercase/uppercase PDF extensions, omitting non-PDF entries and potentially mixed-case PDFs. `reprocess-manual-first.mjs` treated the previous sealed audit inventory as its discovery authority. No currently retained PDF was missed, but both patterns were corrected. The new scanner enumerates every regular file, including hidden paths, before PDF classification, validates all PDF pages with PyMuPDF, tracks duplicate hashes, and fails closed for unresolved symlinks/nonregular entries. The reprocessor re-enumerates and hashes current physical files before accepting the fresh inventory; missing or stale inventory prevents downstream work. Sealed historical packages remain unchanged.

The complete reconciled PDF corpus was reprocessed. Existing reviewed qualification/source-cell evidence was rebound to fresh retained hashes; unreviewed OCR values were not promoted to reviewed facts. Results: 119 qualified documents; 747 reviewed input facts; 628 AVAILABLE, 8 CONFLICTING, and 1 INVALID canonical groups; 246 historical series, including 190 with at least two available points; 51 available derived metrics. CORE ready: 1; SECTOR_CORE ready: 5; FULL: 0; PARTIAL: 0; INSUFFICIENT: 30; historicalFinancialAnalysisReady: 0; currentFinancialDataReady: 0; fundamentalScorable: 0. Readiness definitions and per-period coverage are explicit in DEEP_EXTRACTION_COVERAGE_CLOSURE.json. Historical series here support current analysis of past statements, and do not authorize historical point-in-time replay.

Validation: 4 scanner/reprocessor regression tests and 47 existing manual financial-engine tests passed. Independent-process replay rehashed all 144 PDFs, 1,668 qualification readers, reviewed fact readers, and 484 historical artifacts. Input-order replay passed. Python syntax compilation, targeted JavaScript lint, and diff whitespace checks passed.

No corpus/extraction exhaustion is claimed: 25 document reviews, material accounting gaps, conflicts/revision issues, freshness gaps, and existing reference/governance dependencies remain. DI14 awaits independent review; DI15 awaits Project Owner approval. No scoring, ranking, Top 10, decisions, or DCA ran.

Reproduction, with project-supported Node on PATH and PyMuPDF available to Python:

```sh
python scripts/reconcile-physical-manual-corpus.py --output docs/fundamental-data-engine/evidence/NEW_UNSEALED_RUN
node scripts/reprocess-manual-first.mjs --evidence-dir=docs/fundamental-data-engine/evidence/NEW_UNSEALED_RUN --analysis-at=2026-10-13T12:00:00.000Z
node scripts/verify-manual-first.mjs --evidence-dir=docs/fundamental-data-engine/evidence/NEW_UNSEALED_RUN
node scripts/close-reconciled-manual-corpus.mjs docs/fundamental-data-engine/evidence/NEW_UNSEALED_RUN
```
