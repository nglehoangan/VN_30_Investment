# TCX Level-1 accounting/data closure

**C. TCX BLOCKED — MATERIAL LEVEL-1 DATA-INTEGRITY GAPS REMAIN.** One primary closure round completed. TCX is in the exception queue; await **Review TCX Level-1 Closure**.

| Requirement tier | Required | Before admitted / missing | After admitted / missing |
| --- | ---: | ---: | ---: |
| CORE | 15 | 5 / 10 | 15 / 0 |
| SECURITIES SECTOR_CORE | 15 | 0 / 15 | 14 / 1 |
| SUPPORTING | 40 | 2 / 38 | 15 / 25 |

The remaining Major issue is FY2022 financial-debt completeness. FY2022 note 18 reports VND 5,284,485,167,173 of Két Vàng managed-investor payables. Its financing nature is not established by the mixed program-cost disclosure in note 28. FY2023 separately identifies iSave borrowings commencing 24 May 2023; that cannot retrospectively prove the FY2022 population. No amount is automatically included, excluded or estimated. The VND 8,580,234,544,957 disclosed FY2022 borrowing/bond subtotal remains a reconciliation observation, not canonical total financial debt.

All required CORE, cash and margin-loan windows are qualified. Current trajectory is issuer-reviewed **6M2026 YTD**, through 30 June 2026. Five retained original issuer financial statements cover FY2022–FY2025 and 6M2026. All five report the same **STANDALONE** issuer perimeter; none is relabelled consolidated. Pre-listing financial statements remain supported accounting history, with the fixed five-window denominator.

Read [FINAL_REVIEW.md](FINAL_REVIEW.md) for the complete report, [OPEN_ISSUES.json](OPEN_ISSUES.json) for the materiality ledger, and [TCX_EXCEPTION_QUEUE.json](TCX_EXCEPTION_QUEUE.json) for the governance stop. Source hashes, page locators, row transcriptions, exact population reconciliations, canonical facts and replay input are retained here. CafeF remains the primary structured source; only NAM and QUY candidates are retained. No foreign issuer samples certify TCX quantities.

Replay with Node 22.23.2:

```sh
node scripts/verify-tcx-ticker.mjs
node scripts/verify-tcx-protected.mjs
node scripts/close-tcx-ticker.mjs --out=/tmp/tcx-review-replay
```

The producer refuses to overwrite sealed evidence. The separate-process verifier checks physical source hashes, actual TCX raw provider records, integer reconciliations, exact canonical replay, protected artifact bytes, and a separate producer replay. Extraction artifacts are not dependencies. Replay is automated verification, not independent human approval.

Starting HEAD: `910a4d64fdc3368721f6236d9f2c76e3068347a3`. Final HEAD: `PENDING_COMMIT` at evidence generation. No scoring, ranking, decision readiness, DI14 or DI15 approval. `readyForScoring=false`; `decisionReady=false`. Stop after TCX.
