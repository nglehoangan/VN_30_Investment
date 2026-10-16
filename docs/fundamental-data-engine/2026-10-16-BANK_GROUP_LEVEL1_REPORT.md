# Bank group Level-1 first-pass report — 2026-10-16

All 12 tickers have independent **C. BLOCKED — MATERIAL LEVEL-1 DATA-INTEGRITY GAPS REMAIN** outcomes. No bank has been approved. Full independent accounting-cell qualification remains incomplete. The files document a conservative first-pass audit and exception queue; they do not establish completion of the requested accounting extraction.

Starting HEAD: `01db9b119bda5352389e3aa5e1bfbe77a5ec79b2`. Final HEAD: `PENDING_COMMIT`.

The unchanged BANK registry requires 15 CORE groups, 20 SECTOR_CORE groups and 45 SUPPORTING metrics across FY2022–FY2025 and required 6M2026 YTD. No SUPPORTING completion target was imposed. Each input contains only its own bank's statements, facts and NAM/QUY observations. Cross-bank certification witnesses are absent; unproven structured contracts fail closed. This deliberately conservative first-pass coverage is not equivalent to all evidence potentially obtainable from the retained PDFs.

Eleven current-period PDFs were acquired and cover/disclosure pages visually checked. Acquisition and cover review do not qualify the review opinion, accounting cells, loan classifications, allowance populations or regulatory capital. STB's current PDF was not retained from the fetched report listing. LPB's retained current cover explicitly identifies a standalone statement; consolidated applicability has not been established and no scope substitution was admitted. The other ten current PDFs have consolidated captions or consolidated/separate disclosure notices; those captions alone do not establish qualified cells.

| Bank | CORE | SECTOR_CORE | SUPPORTING | Current period | NPL | LLR | CAR | CET1 | CASA | NIM | Critical | Major | Minor | Verdict | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ACB | 10/15 | 3/20 | 4/45 | None qualified (6M2026 required) | UNAVAILABLE | UNAVAILABLE | UNAVAILABLE | UNAVAILABLE | UNAVAILABLE | UNAVAILABLE | 0 | 34 | 0 | C. BLOCKED | [Evidence](evidence/2026-10-16-ticker-closure-ACB/README.md) |
| BID | 6/15 | 2/20 | 3/45 | None qualified (6M2026 required) | UNAVAILABLE | UNAVAILABLE | UNAVAILABLE | UNAVAILABLE | UNAVAILABLE | UNAVAILABLE | 0 | 31 | 0 | C. BLOCKED | [Evidence](evidence/2026-10-16-ticker-closure-BID/README.md) |
| CTG | 8/15 | 3/20 | 2/45 | None qualified (6M2026 required) | UNAVAILABLE | UNAVAILABLE | UNAVAILABLE | UNAVAILABLE | UNAVAILABLE | UNAVAILABLE | 0 | 28 | 0 | C. BLOCKED | [Evidence](evidence/2026-10-16-ticker-closure-CTG/README.md) |
| HDB | 8/15 | 3/20 | 3/45 | None qualified (6M2026 required) | UNAVAILABLE | UNAVAILABLE | UNAVAILABLE | UNAVAILABLE | UNAVAILABLE | UNAVAILABLE | 0 | 31 | 0 | C. BLOCKED | [Evidence](evidence/2026-10-16-ticker-closure-HDB/README.md) |
| LPB | 3/15 | 0/20 | 1/45 | None qualified (6M2026 required) | UNAVAILABLE | UNAVAILABLE | UNAVAILABLE | UNAVAILABLE | UNAVAILABLE | UNAVAILABLE | 0 | 36 | 0 | C. BLOCKED | [Evidence](evidence/2026-10-16-ticker-closure-LPB/README.md) |
| MBB | 8/15 | 3/20 | 5/45 | None qualified (6M2026 required) | UNAVAILABLE | UNAVAILABLE | UNAVAILABLE | UNAVAILABLE | UNAVAILABLE | UNAVAILABLE | 0 | 38 | 0 | C. BLOCKED | [Evidence](evidence/2026-10-16-ticker-closure-MBB/README.md) |
| SHB | 4/15 | 3/20 | 0/45 | None qualified (6M2026 required) | UNAVAILABLE | UNAVAILABLE | UNAVAILABLE | UNAVAILABLE | UNAVAILABLE | UNAVAILABLE | 0 | 32 | 0 | C. BLOCKED | [Evidence](evidence/2026-10-16-ticker-closure-SHB/README.md) |
| SSB | 9/15 | 3/20 | 2/45 | None qualified (6M2026 required) | UNAVAILABLE | UNAVAILABLE | UNAVAILABLE | UNAVAILABLE | UNAVAILABLE | UNAVAILABLE | 0 | 28 | 0 | C. BLOCKED | [Evidence](evidence/2026-10-16-ticker-closure-SSB/README.md) |
| STB | 0/15 | 0/20 | 0/45 | None qualified (6M2026 required) | UNAVAILABLE | UNAVAILABLE | UNAVAILABLE | UNAVAILABLE | UNAVAILABLE | UNAVAILABLE | 0 | 38 | 0 | C. BLOCKED | [Evidence](evidence/2026-10-16-ticker-closure-STB/README.md) |
| TCB | 11/15 | 3/20 | 4/45 | None qualified (6M2026 required) | UNAVAILABLE | UNAVAILABLE | UNAVAILABLE | UNAVAILABLE | UNAVAILABLE | UNAVAILABLE | 0 | 40 | 0 | C. BLOCKED | [Evidence](evidence/2026-10-16-ticker-closure-TCB/README.md) |
| VIB | 7/15 | 2/20 | 1/45 | None qualified (6M2026 required) | UNAVAILABLE | UNAVAILABLE | UNAVAILABLE | UNAVAILABLE | UNAVAILABLE | UNAVAILABLE | 0 | 31 | 0 | C. BLOCKED | [Evidence](evidence/2026-10-16-ticker-closure-VIB/README.md) |
| VPB | 6/15 | 0/20 | 3/45 | None qualified (6M2026 required) | UNAVAILABLE | UNAVAILABLE | UNAVAILABLE | UNAVAILABLE | UNAVAILABLE | UNAVAILABLE | 0 | 46 | 0 | C. BLOCKED | [Evidence](evidence/2026-10-16-ticker-closure-VPB/README.md) |

Each ticker's OPEN_ISSUES.json lists missing registry groups by period, unresolved issuer conflicts, rejected legacy verifications and NPL/LLR/current-source qualification gaps. Legacy aggregate loan allowances were quarantined because independent general-plus-specific customer-loan populations were not proven. Historical observations and revision lineage were retained; no new comparative restatement qualification was claimed. Unavailable ratios are null, never zero or neutral-filled. No claim is made that unqualified disclosures do not exist.

Validation results (replay/test PASS does not imply accounting closure):

- bank-regressions: **PASS** ([log](evidence/2026-10-16-bank-group-validation/bank-regressions.log)).
- fundamental-data: **PASS** ([log](evidence/2026-10-16-bank-group-validation/fundamental-data.log)).
- structured-certification: **PASS** ([log](evidence/2026-10-16-bank-group-validation/structured-certification.log)).
- protected-VCB: **PASS** ([log](evidence/2026-10-16-bank-group-validation/protected-VCB.log)).
- protected-all-approved: **PASS** ([log](evidence/2026-10-16-bank-group-validation/protected-all-approved.log)).
- boundaries: **PASS** ([log](evidence/2026-10-16-bank-group-validation/boundaries.log)).
- lint: **PASS** ([log](evidence/2026-10-16-bank-group-validation/lint.log)).
- typecheck: **PASS** ([log](evidence/2026-10-16-bank-group-validation/typecheck.log)).
- db-validation: **PASS** ([log](evidence/2026-10-16-bank-group-validation/db-validation.log)).
- full-application-suite: **FAIL** ([log](evidence/2026-10-16-bank-group-validation/full-application-suite.log)).
- application-e2e: **FAIL** ([log](evidence/2026-10-16-bank-group-validation/application-e2e.log)).
- invalid-config: **FAIL** ([log](evidence/2026-10-16-bank-group-validation/invalid-config.log)).
- current-period: **PASS** ([log](evidence/2026-10-16-bank-group-validation/current-period.log)).
- protected-baseline-corrected: **PASS** ([log](evidence/2026-10-16-bank-group-validation/protected-baseline-correction.log)).
- webpack-build: **PASS** ([log](evidence/2026-10-16-bank-group-validation/webpack-build.log)).
- browser-e2e: **PASS** ([log](evidence/2026-10-16-bank-group-validation/browser-e2e.log)).
- invalid-config-corrected: **PASS** ([log](evidence/2026-10-16-bank-group-validation/invalid-config-corrected.log)).
- full-application-suite-corrected: **PASS** ([log](evidence/2026-10-16-bank-group-validation/full-application-suite-corrected.log)).

The initial full-suite run recorded 1,684 PASS / 1 FAIL because the root .gitattributes file is part of VJC’s protected baseline. That edit was removed; a new source-directory attributes file preserves PDF bytes. The dedicated VJC rerun passed 46/46. The default Turbopack build was interrupted after no compilation progress, so default-bundler completion remains unverified. The documented Webpack production build passed; browser E2E passed 12/12. The initial invalid-config attempt was blocked by sandbox loopback EPERM; the same check passed with loopback access enabled. These attempts remain in the logs. Existing browser screenshots regenerated by tests were restored byte-for-byte.

The corrected full application suite passed **1,685 tests / 0 failures** across 115 files. All 12 bank inputs replayed offline in separate processes again after cleanup and passed sealed-artifact hash checks. All 15 existing approved tickers passed protected separate-process replay; VCB passed its dedicated accounting verifier. The 37 bank rules were checked through synthetic semantic probes and retained-data invariants, with the scope recorded in each REGRESSION_RESULTS.json. New unit tests add 44 cases. [Validation receipts](evidence/2026-10-16-bank-group-validation/VALIDATION_RESULTS.json).

VNM and TCX remain **DEFERRED BLOCKED**. Approved ticker evidence was unchanged. Historical PIT NOT_READY is separate from current Level-1 readiness. readyForScoring=false; decisionReady=false; DI14/DI15 NOT_APPROVED. No VIC work, scoring, ranking, valuation or investment decisions were started.

Stop here for **Review Bank Group Level-1 Closure**. Any subsequent targeted work must identify a specific Level-1 blocker from the per-ticker exception queue.
