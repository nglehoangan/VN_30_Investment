# VIC normal Level-1 accounting qualification

**C. VIC BLOCKED — CONCRETE LEVEL-1 BLOCKERS REMAIN.** The sole Major blocker is the unavailable reviewed consolidated 6M2026 original after the bounded legitimate source search. This does not mean the filing or its accounting facts do not exist.

FY2022–FY2025 annual accounting is qualified: **28/28 annual CORE groups and 4/4 annual REAL_ESTATE SECTOR_CORE groups**. Including the still-required current target, coverage is **CORE 28/35, SECTOR_CORE 4/5, SUPPORTING 24/40**. The denominator and production sector are unchanged. No requirement for organic-growth normalization, unrestricted cash or comprehensive economic debt is introduced.

Read [FINAL_REVIEW.md](FINAL_REVIEW.md), [VIC_ACCOUNTING_QUALIFICATION.json](VIC_ACCOUNTING_QUALIFICATION.json), [VIC_FINAL_SUFFICIENCY.json](VIC_FINAL_SUFFICIENCY.json) and [OPEN_ISSUES.json](OPEN_ISSUES.json). Exact source cells, carrying-population receipts, comparative revisions and accounting boundaries are retained in the corresponding VIC review files.

The primary baseline remains frozen in VIC_BASELINE.json. VIC_QUALIFICATION_BASELINE.json records this round's starting hashes and 13/35, 3/5, 9/40 baseline; these were unfinished extraction/qualification gaps, not permanent unavailable facts. Original and revised issuer observations coexist with explicit lineage. Current analysis uses the qualified later comparative; historical PIT remains separate.

Offline replay with Node 22.23.2:

```sh
node scripts/verify-vic-ticker.mjs --ticker=VIC
node scripts/close-vic-ticker.mjs --ticker=VIC --out=/tmp/vic-qualification-replay
```

The verifier checks physical source bytes, exact canonical replay, annual population/cash/inventory/NCI/revision arithmetic and a separate producer process. No OCR, extracted text or page images are required. Original PDFs and CafeF raw snapshots are retained locally under existing ignored-data policy; a Git-only checkout needs those exact bytes. Automated replay is not independent human approval.

Starting HEAD: `8502faa06bed266a375188fc45fb1f8d7476286e`. Final HEAD: `PENDING_COMMIT`.

All 25 approved tickers are protected. VNM, TCX, MBB and VIB remain DEFERRED BLOCKED. No scoring, ranking, investment decision or DI14/DI15 approval. `readyForScoring=false`, `decisionReady=false`. This is a normal qualification round, not a forensic exception. Stop and await **Review VIC Qualification Round**.
