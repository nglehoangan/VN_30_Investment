# Bank Group — Level-1 Accounting Qualification Round

Starting HEAD: `9663c58a09d48e5d6fae4b71cdef659d0f474040`. Final HEAD: `PENDING_COMMIT`. Analysis date: 16 October 2026.

Normal issuer accounting qualification completed independently for ACB, BID, CTG, HDB, LPB, MBB, SHB, SSB, STB, TCB, VIB and VPB. Ten banks are B (Level-1 accounting sufficient); MBB and VIB remain C with concrete material blockers. Independent human review is pending. No targeted forensic fixes were performed.

Amounts below are **million VND**; canonical currency facts use VND. Ratios are unannualized. Current flows cover 1 January–30 June 2026; stocks are at 30 June 2026. Coverage denominator remains **15 CORE / 20 BANK SECTOR_CORE / 45 SUPPORTING** per bank. CASA/NIM and other supporting analytics are deferred; supporting completion is not a Level-1 gate.

| Bank | CORE before → after | SECTOR_CORE before → after | SUPPORTING before → after | Current / scope | Critical / Major / Minor | Verdict |
|---|---:|---:|---:|---|---:|---|
| ACB | 10 → 15/15 | 3 → 20/20 | 4 → 5/45 | 6M2026 YTD / CONSOLIDATED | 0 / 0 / 0 | B |
| BID | 6 → 15/15 | 2 → 20/20 | 3 → 5/45 | 6M2026 YTD / CONSOLIDATED | 0 / 0 / 0 | B |
| CTG | 8 → 15/15 | 3 → 20/20 | 2 → 5/45 | 6M2026 YTD / CONSOLIDATED | 0 / 0 / 2 | B |
| HDB | 8 → 15/15 | 3 → 20/20 | 3 → 4/45 | 6M2026 YTD / CONSOLIDATED | 0 / 0 / 0 | B |
| LPB | 3 → 15/15 | 0 → 20/20 | 1 → 5/45 | 6M2026 YTD / STANDALONE | 0 / 0 / 0 | B |
| MBB | 8 → 15/15 | 3 → 19/20 | 5 → 5/45 | 6M2026 YTD / CONSOLIDATED | 0 / 1 / 0 | C |
| SHB | 4 → 15/15 | 3 → 20/20 | 0 → 5/45 | 6M2026 YTD / CONSOLIDATED | 0 / 0 / 0 | B |
| SSB | 9 → 15/15 | 3 → 20/20 | 2 → 5/45 | 6M2026 YTD / CONSOLIDATED | 0 / 0 / 0 | B |
| STB | 0 → 15/15 | 0 → 20/20 | 0 → 5/45 | 6M2026 YTD / CONSOLIDATED | 0 / 0 / 0 | B |
| TCB | 11 → 15/15 | 3 → 20/20 | 4 → 5/45 | 6M2026 YTD / CONSOLIDATED | 0 / 0 / 0 | B |
| VIB | 7 → 15/15 | 2 → 19/20 | 1 → 5/45 | 6M2026 YTD / CONSOLIDATED | 0 / 2 / 0 | C |
| VPB | 6 → 15/15 | 0 → 20/20 | 3 → 5/45 | 6M2026 YTD / CONSOLIDATED | 0 / 0 / 1 | B |

## Qualification and selection policy

Every admitted observation binds ticker, period/frame, scope, source hash, physical PDF page, unit, currency and audit/review status in its own retained accounting receipt. Provider NAM/QUY payloads remain discovery candidates; no cross-bank evidence or calibration witnesses enter admission. Earlier legacy observations remain retained outside the new admission set; a numeric match does not lift quarantine. Previous baseline coverage is preserved separately. Supporting counts may differ because only this round’s qualified accounting receipts enter the new canonical set.

NPL = customer-loan Group 3 + Group 4 + Group 5. NPL ratio divides this amount by the issuer-defined gross customer-loan family, retaining explicitly presented margin exposure in that denominator where the issuer does so. Interbank, securities, purchased debt, VAMC, write-offs, Group 2 and unclassified restructuring exposures are excluded from the numerator. LLR = explicitly proven general + specific customer-loan allowances / customer-loan NPL. Separately disclosed margin or deferred-L/C provision columns are excluded through exact bridges. These are as-reported accounting populations, not normalized credit-risk estimates. MBB’s loan provision note discloses general/specific balances without a separate margin column; no invented split or adjusted margin coverage is claimed.

Original and revised issuer observations remain retained with explicit supersession and source lineage. CURRENT_ANALYSIS uses the later issuer comparative where the date, scope and changed cell are explicit; the reason is recorded when disclosed. A later comparative is not backdated into historical PIT. Changes whose reasons are not disclosed remain a documented limitation, including CTG’s 2024 loan-classification comparative and VPB’s 2023 capital comparative. Historical PIT remains NOT_READY and does not independently block current Level 1.

Capital observations are issuer-reported ratios with exact date, regulatory consolidation scope and framework. TT41 ratios are not equated with TT14 ratios. Regulatory consolidation exclusions remain distinct from accounting consolidation. Tier 1 is retained as Tier 1; CET1 is admitted only for ACB’s explicitly labelled TT14 disclosures in FY2025 and 6M2026. Other CET1 gaps do not independently block the registry’s CAR-or-CET1 capital group.

Gap governance: EXTRACTION_NOT_YET_PERFORMED, SOURCE_NOT_YET_ACQUIRED and DEFINITION_NOT_YET_QUALIFIED are workflow states, not independent Major forensic blockers. Only material TRUE_DATA_INTEGRITY_CONFLICT and SOURCE_UNAVAILABLE_AFTER_REASONABLE_SEARCH remain Major here. Deferred supporting/normalization work is ANALYTICAL_ONLY_GAP. No required accounting extraction remains deferred as a final blocker.

## ACB — B

**B. LEVEL-1 ACCOUNTING SUFFICIENT — SUPPORTING ANALYTICS DEFERRED.** Latest qualified current period: **6M2026 YTD**, scope **CONSOLIDATED**. Critical 0; Major 0; Minor 0.

| Current accounting observation | Qualified value |
|---|---:|
| Total assets | 1,067,845,075 |
| Total equity | 99,314,518 |
| Net income, six months | 8,612,866 |
| Customer deposits | 576,603,602 |
| Gross customer loans | 745,759,303 |
| Group 3 | 1,350,279 |
| Group 4 | 1,339,763 |
| Group 5 | 4,967,367 |
| NPL = Group 3 + 4 + 5 | 7,657,409 |
| NPL / gross customer loans | 1.026794% |
| General customer-loan allowance | 5,401,103 |
| Specific customer-loan allowance | 2,546,765 |
| Approved allowance numerator | 7,947,868 |
| Separately excluded allowance | 117,476 |
| Balance-sheet aggregate allowance | 8,065,344 |
| LLR | 103.793176% |
| CAR | 11.8% |
| Tier 1 ratio, explicitly reported | 11.5% |
| CET1 | 11.5% |
| CASA | UNAVAILABLE — ANALYTICAL_ONLY |
| NIM | UNAVAILABLE — ANALYTICAL_ONLY |

Loan-quality source: PDF page 49, SHA256 `a51a7917950682bdf900659e541e87b6e2886127c9303ad01b81b966c5bdee67`. Provision source: PDF page 50, SHA256 `a51a7917950682bdf900659e541e87b6e2886127c9303ad01b81b966c5bdee67`. Exact sources, units and current columns: [accounting qualification](evidence/2026-10-16-ticker-closure-ACB/ACB_ACCOUNTING_QUALIFICATION.json); [NPL](evidence/2026-10-16-ticker-closure-ACB/ACB_NPL_RECONCILIATION.json); [LLR](evidence/2026-10-16-ticker-closure-ACB/ACB_LLR_RECONCILIATION.json).

Capital source: [ACB_Regulatory_Capital_2026.pdf](../../data/manual-fundamentals/ACB/ACB_Regulatory_Capital_2026.pdf), physical PDF page 4; `TT14_2025_STANDARDIZED`, `CONSOLIDATED`, 2026-06-30. Tier 1 is not used as CET1.

| Period | Gross loans | G3 | G4 | G5 | NPL ratio | General | Specific | LLR | CAR |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 2022-12-31 | 413,706,244 | 442,270 | 437,272 | 2,165,373 | 0.736009% | 3,071,021 | 1,662,513 | 155.457016% | 12.8% |
| 2023-12-31 | 487,601,852 | 940,414 | 1,048,813 | 3,897,998 | 1.207384% | 3,592,322 | 1,657,154 | 89.167239% | 12.48% |
| 2024-12-31 | 580,686,248 | 923,291 | 978,211 | 6,748,132 | 1.489554% | 4,239,076 | 2,383,004 | 76.559078% | 11.82% |
| 2025-12-31 | 686,777,352 | 764,791 | 770,229 | 5,136,367 | 0.971405% | 4,982,250 | 2,525,003 | 112.529119% | 12.45% |
| 2026-06-30 | 745,759,303 | 1,350,279 | 1,339,763 | 4,967,367 | 1.026794% | 5,401,103 | 2,546,765 | 103.793176% | 11.8% |

Provider conflicts: **5 canonical facts resolved by qualified issuer authority**; provider anomaly/semantic exclusions remain in the [provider receipt](evidence/2026-10-16-ticker-closure-ACB/ACB_PROVIDER_ANOMALIES.csv). Unresolved canonical issuer conflicts: **0**. Broader issuer-table anomalies and definition conflicts are listed below and in [OPEN_ISSUES](evidence/2026-10-16-ticker-closure-ACB/OPEN_ISSUES.json); they are not hidden by the canonical conflict count.

Remaining material DATA_INTEGRITY / SOURCE_UNAVAILABLE gaps: **none**. Remaining supporting and normalization gaps: **ANALYTICAL_ONLY**.

[Original/revised observation lineage](evidence/2026-10-16-ticker-closure-ACB/ACB_RESTATEMENT_REVIEW.json) · [Capital qualification](evidence/2026-10-16-ticker-closure-ACB/ACB_CAPITAL_QUALIFICATION.json) · [Source search](evidence/2026-10-16-ticker-closure-ACB/ACB_CAPITAL_SOURCE_SEARCH.json) · [Final sufficiency](evidence/2026-10-16-ticker-closure-ACB/ACB_FINAL_SUFFICIENCY.json) · [Offline replay](evidence/2026-10-16-ticker-closure-ACB/INDEPENDENT_REPLAY.json).

## BID — B

**B. LEVEL-1 ACCOUNTING SUFFICIENT — SUPPORTING ANALYTICS DEFERRED.** Latest qualified current period: **6M2026 YTD**, scope **CONSOLIDATED**. Critical 0; Major 0; Minor 0.

| Current accounting observation | Qualified value |
|---|---:|
| Total assets | 3,440,840,854 |
| Total equity | 198,783,286 |
| Net income, six months | 15,173,710 |
| Customer deposits | 2,261,489,130 |
| Gross customer loans | 2,501,807,043 |
| Group 3 | 12,003,167 |
| Group 4 | 7,293,693 |
| Group 5 | 26,421,899 |
| NPL = Group 3 + 4 + 5 | 45,718,759 |
| NPL / gross customer loans | 1.827429% |
| General customer-loan allowance | 18,525,602 |
| Specific customer-loan allowance | 16,169,122 |
| Approved allowance numerator | 34,694,724 |
| Separately excluded allowance | 0 |
| Balance-sheet aggregate allowance | 34,694,724 |
| LLR | 75.887283% |
| CAR | 10.01% |
| Tier 1 ratio, explicitly reported | 7.12% |
| CET1 | UNAVAILABLE |
| CASA | UNAVAILABLE — ANALYTICAL_ONLY |
| NIM | UNAVAILABLE — ANALYTICAL_ONLY |

Loan-quality source: PDF page 36, SHA256 `2ce0596f766738d8f7ad3d83f525eec7d97c393a41e78a0c21cac5e877158748`. Provision source: PDF page 37, SHA256 `2ce0596f766738d8f7ad3d83f525eec7d97c393a41e78a0c21cac5e877158748`. Exact sources, units and current columns: [accounting qualification](evidence/2026-10-16-ticker-closure-BID/BID_ACCOUNTING_QUALIFICATION.json); [NPL](evidence/2026-10-16-ticker-closure-BID/BID_NPL_RECONCILIATION.json); [LLR](evidence/2026-10-16-ticker-closure-BID/BID_LLR_RECONCILIATION.json).

Capital source: [BID_Regulatory_Capital_2026.pdf](../../data/manual-fundamentals/BID/BID_Regulatory_Capital_2026.pdf), physical PDF page 6; `TT41_2016_BASEL_II`, `CONSOLIDATED`, 2026-06-30. Tier 1 is not used as CET1.

| Period | Gross loans | G3 | G4 | G5 | NPL ratio | General | Specific | LLR | CAR |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 2022-12-31 | 1,522,221,714 | 3,509,216 | 2,700,900 | 11,879,069 | 1.188341% | 11,320,475 | 26,732,264 | 210.361821% | 9.34% |
| 2023-12-31 | 1,777,664,882 | 3,819,550 | 5,523,163 | 13,025,201 | 1.258275% | 13,226,095 | 27,242,965 | 180.924605% | 9.18% |
| 2024-12-31 | 2,056,082,420 | 3,666,965 | 5,577,478 | 19,820,172 | 1.413592% | 15,257,624 | 22,712,857 | 130.64161% | 9.04% |
| 2025-12-31 | 2,372,955,074 | 4,473,881 | 4,677,985 | 25,824,953 | 1.473977% | 17,577,903 | 17,367,650 | 99.910609% | 9.18% |
| 2026-06-30 | 2,501,807,043 | 12,003,167 | 7,293,693 | 26,421,899 | 1.827429% | 18,525,602 | 16,169,122 | 75.887283% | 10.01% |

Provider conflicts: **20 canonical facts resolved by qualified issuer authority**; provider anomaly/semantic exclusions remain in the [provider receipt](evidence/2026-10-16-ticker-closure-BID/BID_PROVIDER_ANOMALIES.csv). Unresolved canonical issuer conflicts: **0**. Broader issuer-table anomalies and definition conflicts are listed below and in [OPEN_ISSUES](evidence/2026-10-16-ticker-closure-BID/OPEN_ISSUES.json); they are not hidden by the canonical conflict count.

Remaining material DATA_INTEGRITY / SOURCE_UNAVAILABLE gaps: **none**. Remaining supporting and normalization gaps: **ANALYTICAL_ONLY**.

[Original/revised observation lineage](evidence/2026-10-16-ticker-closure-BID/BID_RESTATEMENT_REVIEW.json) · [Capital qualification](evidence/2026-10-16-ticker-closure-BID/BID_CAPITAL_QUALIFICATION.json) · [Source search](evidence/2026-10-16-ticker-closure-BID/BID_CAPITAL_SOURCE_SEARCH.json) · [Final sufficiency](evidence/2026-10-16-ticker-closure-BID/BID_FINAL_SUFFICIENCY.json) · [Offline replay](evidence/2026-10-16-ticker-closure-BID/INDEPENDENT_REPLAY.json).

## CTG — B

**B. LEVEL-1 ACCOUNTING SUFFICIENT — SUPPORTING ANALYTICS DEFERRED.** Latest qualified current period: **6M2026 YTD**, scope **CONSOLIDATED**. Critical 0; Major 0; Minor 2.

| Current accounting observation | Qualified value |
|---|---:|
| Total assets | 2,962,003,670 |
| Total equity | 200,214,302 |
| Net income, six months | 20,743,531 |
| Customer deposits | 1,890,809,553 |
| Gross customer loans | 2,092,707,758 |
| Group 3 | 5,005,050 |
| Group 4 | 4,463,609 |
| Group 5 | 15,610,527 |
| NPL = Group 3 + 4 + 5 | 25,079,186 |
| NPL / gross customer loans | 1.198408% |
| General customer-loan allowance | 15,577,491 |
| Specific customer-loan allowance | 18,016,961 |
| Approved allowance numerator | 33,594,452 |
| Separately excluded allowance | 0 |
| Balance-sheet aggregate allowance | 33,594,452 |
| LLR | 133.953518% |
| CAR | 10.1% |
| Tier 1 ratio, explicitly reported | 7.68% |
| CET1 | UNAVAILABLE |
| CASA | UNAVAILABLE — ANALYTICAL_ONLY |
| NIM | UNAVAILABLE — ANALYTICAL_ONLY |

Loan-quality source: PDF page 35, SHA256 `a36057a8e1440b46767b7fb94d98a41c0dddf80651859490adc6815b5c637601`. Provision source: PDF page 36, SHA256 `a36057a8e1440b46767b7fb94d98a41c0dddf80651859490adc6815b5c637601`. Exact sources, units and current columns: [accounting qualification](evidence/2026-10-16-ticker-closure-CTG/CTG_ACCOUNTING_QUALIFICATION.json); [NPL](evidence/2026-10-16-ticker-closure-CTG/CTG_NPL_RECONCILIATION.json); [LLR](evidence/2026-10-16-ticker-closure-CTG/CTG_LLR_RECONCILIATION.json).

Capital source: [CTG_Regulatory_Capital_2026.pdf](../../data/manual-fundamentals/CTG/CTG_Regulatory_Capital_2026.pdf), physical PDF page 4; `TT41_2016_BASEL_II`, `CONSOLIDATED`, 2026-06-30. Tier 1 is not used as CET1.

| Period | Gross loans | G3 | G4 | G5 | NPL ratio | General | Specific | LLR | CAR |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 2022-12-31 | 1,274,843,694 | 7,305,070 | 2,262,069 | 6,256,884 | 1.241252% | 9,423,152 | 19,990,078 | 185.877068% | 8.98% |
| 2023-12-31 | 1,473,344,564 | 2,508,483 | 4,721,294 | 9,378,555 | 1.127254% | 10,953,175 | 16,819,746 | 167.222819% | 9.31% |
| 2024-12-31 | 1,721,954,714 | 2,817,030 | 4,824,119 | 13,710,778 | 1.239982% | 12,782,431 | 23,881,694 | 171.713424% | 9.54% |
| 2025-12-31 | 1,992,272,868 | 1,490,975 | 578,479 | 19,846,742 | 1.10006% | 14,817,251 | 19,993,114 | 158.833974% | 9.89% |
| 2026-06-30 | 2,092,707,758 | 5,005,050 | 4,463,609 | 15,610,527 | 1.198408% | 15,577,491 | 18,016,961 | 133.953518% | 10.1% |

Provider conflicts: **7 canonical facts resolved by qualified issuer authority**; provider anomaly/semantic exclusions remain in the [provider receipt](evidence/2026-10-16-ticker-closure-CTG/CTG_PROVIDER_ANOMALIES.csv). Unresolved canonical issuer conflicts: **0**. Broader issuer-table anomalies and definition conflicts are listed below and in [OPEN_ISSUES](evidence/2026-10-16-ticker-closure-CTG/OPEN_ISSUES.json); they are not hidden by the canonical conflict count.

Remaining material DATA_INTEGRITY / SOURCE_UNAVAILABLE gaps: **none**. Remaining supporting and normalization gaps: **ANALYTICAL_ONLY**.

- **Minor**: FY2023 PDF p48 equity movement total prints 20,076,622 million; its components 19,903,550 + 141,072 sum to 20,044,622, agreeing with income statement p12 and later comparative. Canonical net income follows the independently corroborated statement; printed total anomaly retained.

- **Minor**: Later issuer comparative reclassifies group 1/2/5 while preserving total gross loans. Reason not disclosed; both observations retained. Current analysis uses later dated issuer comparative; historical PIT unchanged.

[Original/revised observation lineage](evidence/2026-10-16-ticker-closure-CTG/CTG_RESTATEMENT_REVIEW.json) · [Capital qualification](evidence/2026-10-16-ticker-closure-CTG/CTG_CAPITAL_QUALIFICATION.json) · [Source search](evidence/2026-10-16-ticker-closure-CTG/CTG_CAPITAL_SOURCE_SEARCH.json) · [Final sufficiency](evidence/2026-10-16-ticker-closure-CTG/CTG_FINAL_SUFFICIENCY.json) · [Offline replay](evidence/2026-10-16-ticker-closure-CTG/INDEPENDENT_REPLAY.json).

## HDB — B

**B. LEVEL-1 ACCOUNTING SUFFICIENT — SUPPORTING ANALYTICS DEFERRED.** Latest qualified current period: **6M2026 YTD**, scope **CONSOLIDATED**. Critical 0; Major 0; Minor 0.

| Current accounting observation | Qualified value |
|---|---:|
| Total assets | 1,043,891,774 |
| Total equity | 90,224,021 |
| Net income, six months | 10,697,724 |
| Customer deposits | 674,058,701 |
| Gross customer loans | 659,000,255 |
| Group 3 | 5,552,555 |
| Group 4 | 5,120,113 |
| Group 5 | 7,719,440 |
| NPL = Group 3 + 4 + 5 | 18,392,108 |
| NPL / gross customer loans | 2.790911% |
| General customer-loan allowance | 4,884,602 |
| Specific customer-loan allowance | 4,312,483 |
| Approved allowance numerator | 9,197,085 |
| Separately excluded allowance | 0 |
| Balance-sheet aggregate allowance | 9,197,085 |
| LLR | 50.005606% |
| CAR | 14.27% |
| Tier 1 ratio, explicitly reported | UNAVAILABLE |
| CET1 | UNAVAILABLE |
| CASA | UNAVAILABLE — ANALYTICAL_ONLY |
| NIM | UNAVAILABLE — ANALYTICAL_ONLY |

Loan-quality source: PDF page 35, SHA256 `4ca8247b9eb0fd9b6a9d7206bb196b166703b23e786290136d2ab5afec210f34`. Provision source: PDF page 37, SHA256 `4ca8247b9eb0fd9b6a9d7206bb196b166703b23e786290136d2ab5afec210f34`. Exact sources, units and current columns: [accounting qualification](evidence/2026-10-16-ticker-closure-HDB/HDB_ACCOUNTING_QUALIFICATION.json); [NPL](evidence/2026-10-16-ticker-closure-HDB/HDB_NPL_RECONCILIATION.json); [LLR](evidence/2026-10-16-ticker-closure-HDB/HDB_LLR_RECONCILIATION.json).

Capital source: [HDB_Regulatory_Bond_Prospectus_2026.pdf](../../data/manual-fundamentals/HDB/HDB_Regulatory_Bond_Prospectus_2026.pdf), physical PDF page 57; `TT41_2016_BASEL_II`, `CONSOLIDATED`, 2026-06-30. Tier 1 is not used as CET1.

| Period | Gross loans | G3 | G4 | G5 | NPL ratio | General | Specific | LLR | CAR |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 2022-12-31 | 263,856,383 | 1,848,250 | 1,414,595 | 1,141,346 | 1.669162% | 1,970,361 | 1,131,211 | 70.423195% | 13.42% |
| 2023-12-31 | 343,404,295 | 2,610,402 | 1,907,723 | 1,641,838 | 1.793793% | 2,563,216 | 1,491,241 | 65.819502% | 12.57% |
| 2024-12-31 | 442,484,841 | 4,199,973 | 1,967,085 | 2,389,173 | 1.933678% | 3,216,873 | 2,577,890 | 67.725649% | 14.03% |
| 2025-12-31 | 546,370,779 | 4,017,065 | 5,500,307 | 3,802,915 | 2.437957% | 4,069,255 | 3,230,190 | 54.799457% | 16.72% |
| 2026-06-30 | 659,000,255 | 5,552,555 | 5,120,113 | 7,719,440 | 2.790911% | 4,884,602 | 4,312,483 | 50.005606% | 14.27% |

Provider conflicts: **7 canonical facts resolved by qualified issuer authority**; provider anomaly/semantic exclusions remain in the [provider receipt](evidence/2026-10-16-ticker-closure-HDB/HDB_PROVIDER_ANOMALIES.csv). Unresolved canonical issuer conflicts: **0**. Broader issuer-table anomalies and definition conflicts are listed below and in [OPEN_ISSUES](evidence/2026-10-16-ticker-closure-HDB/OPEN_ISSUES.json); they are not hidden by the canonical conflict count.

Remaining material DATA_INTEGRITY / SOURCE_UNAVAILABLE gaps: **none**. Remaining supporting and normalization gaps: **ANALYTICAL_ONLY**.

[Original/revised observation lineage](evidence/2026-10-16-ticker-closure-HDB/HDB_RESTATEMENT_REVIEW.json) · [Capital qualification](evidence/2026-10-16-ticker-closure-HDB/HDB_CAPITAL_QUALIFICATION.json) · [Source search](evidence/2026-10-16-ticker-closure-HDB/HDB_CAPITAL_SOURCE_SEARCH.json) · [Final sufficiency](evidence/2026-10-16-ticker-closure-HDB/HDB_FINAL_SUFFICIENCY.json) · [Offline replay](evidence/2026-10-16-ticker-closure-HDB/INDEPENDENT_REPLAY.json).

## LPB — B

**B. LEVEL-1 ACCOUNTING SUFFICIENT — SUPPORTING ANALYTICS DEFERRED.** Latest qualified current period: **6M2026 YTD**, scope **STANDALONE**. Critical 0; Major 0; Minor 0.

| Current accounting observation | Qualified value |
|---|---:|
| Total assets | 615,502,468 |
| Total equity | 43,030,481 |
| Net income, six months | 4,799,853 |
| Customer deposits | 353,513,314 |
| Gross customer loans | 429,464,738 |
| Group 3 | 1,530,457 |
| Group 4 | 2,066,430 |
| Group 5 | 4,366,459 |
| NPL = Group 3 + 4 + 5 | 7,963,346 |
| NPL / gross customer loans | 1.854249% |
| General customer-loan allowance | 3,188,237 |
| Specific customer-loan allowance | 2,127,835 |
| Approved allowance numerator | 5,316,072 |
| Separately excluded allowance | 0 |
| Balance-sheet aggregate allowance | 5,316,072 |
| LLR | 66.756763% |
| CAR | 11.18% |
| Tier 1 ratio, explicitly reported | 8.35% |
| CET1 | UNAVAILABLE |
| CASA | UNAVAILABLE — ANALYTICAL_ONLY |
| NIM | UNAVAILABLE — ANALYTICAL_ONLY |

Loan-quality source: PDF page 38, SHA256 `386ba5f5c44d355d7b07e967b44aa25a63238f2088df7fe103bfb352000e14f9`. Provision source: PDF page 39, SHA256 `386ba5f5c44d355d7b07e967b44aa25a63238f2088df7fe103bfb352000e14f9`. Exact sources, units and current columns: [accounting qualification](evidence/2026-10-16-ticker-closure-LPB/LPB_ACCOUNTING_QUALIFICATION.json); [NPL](evidence/2026-10-16-ticker-closure-LPB/LPB_NPL_RECONCILIATION.json); [LLR](evidence/2026-10-16-ticker-closure-LPB/LPB_LLR_RECONCILIATION.json).

Capital source: [LPB_Regulatory_Capital_2026.pdf](../../data/manual-fundamentals/LPB/LPB_Regulatory_Capital_2026.pdf), physical PDF page 6; `TT41_2016_BASEL_II`, `STANDALONE`, 2026-06-30. Tier 1 is not used as CET1.

| Period | Gross loans | G3 | G4 | G5 | NPL ratio | General | Specific | LLR | CAR |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 2022-12-31 | 235,506,871 | 1,069,695 | 1,004,566 | 1,352,557 | 1.455082% | 1,751,300 | 3,118,595 | 142.111282% | 12.36% |
| 2023-12-31 | 275,430,884 | 812,753 | 1,706,597 | 1,169,301 | 1.339229% | 2,054,762 | 1,403,473 | 93.75338% | 12.24% |
| 2024-12-31 | 331,606,315 | 855,049 | 1,921,132 | 2,422,462 | 1.567715% | 2,456,739 | 1,873,358 | 83.292832% | 13.33% |
| 2025-12-31 | 391,746,491 | 953,049 | 1,389,832 | 4,255,424 | 1.68433% | 2,906,183 | 1,973,266 | 73.950037% | 11.87% |
| 2026-06-30 | 429,464,738 | 1,530,457 | 2,066,430 | 4,366,459 | 1.854249% | 3,188,237 | 2,127,835 | 66.756763% | 11.18% |

Provider conflicts: **1 canonical facts resolved by qualified issuer authority**; provider anomaly/semantic exclusions remain in the [provider receipt](evidence/2026-10-16-ticker-closure-LPB/LPB_PROVIDER_ANOMALIES.csv). Unresolved canonical issuer conflicts: **0**. Broader issuer-table anomalies and definition conflicts are listed below and in [OPEN_ISSUES](evidence/2026-10-16-ticker-closure-LPB/OPEN_ISSUES.json); they are not hidden by the canonical conflict count.

Remaining material DATA_INTEGRITY / SOURCE_UNAVAILABLE gaps: **none**. Remaining supporting and normalization gaps: **ANALYTICAL_ONLY**.

LPB scope case **B**: legitimate standalone reporting. The 30 June 2026 regulatory disclosure p4 explicitly states that LPBank has no subsidiaries or associates. Reviewed statement notes identify bank-only reporting and only other long-term investments. A bounded permitted mirror search returned the same bank-only report. The existing generic scope contract accepts STANDALONE; no ticker exemption or consolidated relabelling was introduced. [Scope applicability receipt](evidence/2026-10-16-ticker-closure-LPB/LPB_SCOPE_APPLICABILITY.json).

[Original/revised observation lineage](evidence/2026-10-16-ticker-closure-LPB/LPB_RESTATEMENT_REVIEW.json) · [Capital qualification](evidence/2026-10-16-ticker-closure-LPB/LPB_CAPITAL_QUALIFICATION.json) · [Source search](evidence/2026-10-16-ticker-closure-LPB/LPB_CAPITAL_SOURCE_SEARCH.json) · [Final sufficiency](evidence/2026-10-16-ticker-closure-LPB/LPB_FINAL_SUFFICIENCY.json) · [Offline replay](evidence/2026-10-16-ticker-closure-LPB/INDEPENDENT_REPLAY.json).

## MBB — C

**C. BLOCKED — CONCRETE MATERIAL SOURCE/DEFINITION ISSUES.** Latest qualified current period: **6M2026 YTD**, scope **CONSOLIDATED**. Critical 0; Major 1; Minor 0.

| Current accounting observation | Qualified value |
|---|---:|
| Total assets | 1,733,012,662 |
| Total equity | 156,762,644 |
| Net income, six months | 16,148,193 |
| Customer deposits | 963,815,357 |
| Gross customer loans | 1,227,554,477 |
| Group 3 | 4,622,128 |
| Group 4 | 4,428,065 |
| Group 5 | 8,747,009 |
| NPL = Group 3 + 4 + 5 | 17,797,202 |
| NPL / gross customer loans | 1.44981% |
| General customer-loan allowance | 9,156,802 |
| Specific customer-loan allowance | 7,506,079 |
| Approved allowance numerator | 16,662,881 |
| Separately excluded allowance | 0 |
| Balance-sheet aggregate allowance | 16,662,881 |
| LLR | 93.626408% |
| CAR | UNAVAILABLE |
| Tier 1 ratio, explicitly reported | UNAVAILABLE |
| CET1 | UNAVAILABLE |
| CASA | UNAVAILABLE — ANALYTICAL_ONLY |
| NIM | UNAVAILABLE — ANALYTICAL_ONLY |

Loan-quality source: PDF page 53, SHA256 `de8bc3f9eebfb9f8937a166df058a3cbf6f0e32c6e38a38a64d14c2c57198a8d`. Provision source: PDF page 55, SHA256 `de8bc3f9eebfb9f8937a166df058a3cbf6f0e32c6e38a38a64d14c2c57198a8d`. Exact sources, units and current columns: [accounting qualification](evidence/2026-10-16-ticker-closure-MBB/MBB_ACCOUNTING_QUALIFICATION.json); [NPL](evidence/2026-10-16-ticker-closure-MBB/MBB_NPL_RECONCILIATION.json); [LLR](evidence/2026-10-16-ticker-closure-MBB/MBB_LLR_RECONCILIATION.json).

| Period | Gross loans | G3 | G4 | G5 | NPL ratio | General | Specific | LLR | CAR |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 2022-12-31 | 460,574,482 | 1,517,212 | 1,220,770 | 2,293,312 | 1.092395% | 3,400,915 | 8,574,945 | 238.027434% | 11.53% |
| 2023-12-31 | 611,048,830 | 3,210,741 | 3,704,226 | 2,889,691 | 1.604562% | 4,551,746 | 6,917,817 | 116.980755% | 10.75% |
| 2024-12-31 | 776,657,846 | 3,379,646 | 4,599,274 | 4,606,512 | 1.62046% | 5,795,573 | 5,814,288 | 92.248411% | 11.76% |
| 2025-12-31 | 1,084,019,370 | 3,276,216 | 4,330,016 | 6,421,264 | 1.294026% | 8,098,145 | 5,052,448 | 93.748685% | 11.02% |
| 2026-06-30 | 1,227,554,477 | 4,622,128 | 4,428,065 | 8,747,009 | 1.44981% | 9,156,802 | 7,506,079 | 93.626408% | UNAVAILABLE |

Provider conflicts: **0 canonical facts resolved by qualified issuer authority**; provider anomaly/semantic exclusions remain in the [provider receipt](evidence/2026-10-16-ticker-closure-MBB/MBB_PROVIDER_ANOMALIES.csv). Unresolved canonical issuer conflicts: **0**. Broader issuer-table anomalies and definition conflicts are listed below and in [OPEN_ISSUES](evidence/2026-10-16-ticker-closure-MBB/OPEN_ISSUES.json); they are not hidden by the canonical conflict count.

- **Major — SOURCE_UNAVAILABLE** (`SOURCE_UNAVAILABLE_AFTER_REASONABLE_SEARCH`): Standard permitted mirror returned 404; bounded issuer/exchange/public-mirror indexed searches did not yield an accessible original for this date. VIB issuer disclosure listing exists, but access returned 403 or an unrelated generic page; no access-control bypass. No press/provider ratio admitted.

[Original/revised observation lineage](evidence/2026-10-16-ticker-closure-MBB/MBB_RESTATEMENT_REVIEW.json) · [Capital qualification](evidence/2026-10-16-ticker-closure-MBB/MBB_CAPITAL_QUALIFICATION.json) · [Source search](evidence/2026-10-16-ticker-closure-MBB/MBB_CAPITAL_SOURCE_SEARCH.json) · [Final sufficiency](evidence/2026-10-16-ticker-closure-MBB/MBB_FINAL_SUFFICIENCY.json) · [Offline replay](evidence/2026-10-16-ticker-closure-MBB/INDEPENDENT_REPLAY.json).

## SHB — B

**B. LEVEL-1 ACCOUNTING SUFFICIENT — SUPPORTING ANALYTICS DEFERRED.** Latest qualified current period: **6M2026 YTD**, scope **CONSOLIDATED**. Critical 0; Major 0; Minor 0.

| Current accounting observation | Qualified value |
|---|---:|
| Total assets | 962,886,783 |
| Total equity | 75,309,442 |
| Net income, six months | 7,328,515 |
| Customer deposits | 624,269,133 |
| Gross customer loans | 659,610,969 |
| Group 3 | 2,205,958 |
| Group 4 | 4,115,492 |
| Group 5 | 8,053,892 |
| NPL = Group 3 + 4 + 5 | 14,375,342 |
| NPL / gross customer loans | 2.179367% |
| General customer-loan allowance | 4,896,872 |
| Specific customer-loan allowance | 6,161,364 |
| Approved allowance numerator | 11,058,236 |
| Separately excluded allowance | 0 |
| Balance-sheet aggregate allowance | 11,058,236 |
| LLR | 76.925029% |
| CAR | 11.81% |
| Tier 1 ratio, explicitly reported | 9% |
| CET1 | UNAVAILABLE |
| CASA | UNAVAILABLE — ANALYTICAL_ONLY |
| NIM | UNAVAILABLE — ANALYTICAL_ONLY |

Loan-quality source: PDF page 32, SHA256 `634c2fa25549a4cc160f4177d77908d6c82a236ee7315ae16241e3d4bba017b2`. Provision source: PDF page 32, SHA256 `634c2fa25549a4cc160f4177d77908d6c82a236ee7315ae16241e3d4bba017b2`. Exact sources, units and current columns: [accounting qualification](evidence/2026-10-16-ticker-closure-SHB/SHB_ACCOUNTING_QUALIFICATION.json); [NPL](evidence/2026-10-16-ticker-closure-SHB/SHB_NPL_RECONCILIATION.json); [LLR](evidence/2026-10-16-ticker-closure-SHB/SHB_LLR_RECONCILIATION.json).

Capital source: [SHB_Regulatory_Capital_2026.pdf](../../data/manual-fundamentals/SHB/SHB_Regulatory_Capital_2026.pdf), physical PDF page 5; `TT41_2016_BASEL_II`, `CONSOLIDATED`, 2026-06-30. Tier 1 is not used as CET1.

| Period | Gross loans | G3 | G4 | G5 | NPL ratio | General | Specific | LLR | CAR |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 2022-12-31 | 385,633,215 | 1,611,827 | 1,898,472 | 7,342,657 | 2.814321% | 2,843,216 | 4,214,556 | 65.030873% | 12.22% |
| 2023-12-31 | 438,464,147 | 761,107 | 2,493,596 | 9,984,516 | 3.019453% | 3,211,595 | 5,889,823 | 68.745883% | 12.2% |
| 2024-12-31 | 522,557,324 | 1,969,398 | 2,052,495 | 11,042,821 | 2.882883% | 3,831,533 | 4,984,863 | 58.523487% | 11.86% |
| 2025-12-31 | 614,861,980 | 1,776,951 | 4,324,234 | 8,475,768 | 2.370768% | 4,559,499 | 5,938,799 | 72.019838% | 12.62% |
| 2026-06-30 | 659,610,969 | 2,205,958 | 4,115,492 | 8,053,892 | 2.179367% | 4,896,872 | 6,161,364 | 76.925029% | 11.81% |

Provider conflicts: **11 canonical facts resolved by qualified issuer authority**; provider anomaly/semantic exclusions remain in the [provider receipt](evidence/2026-10-16-ticker-closure-SHB/SHB_PROVIDER_ANOMALIES.csv). Unresolved canonical issuer conflicts: **0**. Broader issuer-table anomalies and definition conflicts are listed below and in [OPEN_ISSUES](evidence/2026-10-16-ticker-closure-SHB/OPEN_ISSUES.json); they are not hidden by the canonical conflict count.

Remaining material DATA_INTEGRITY / SOURCE_UNAVAILABLE gaps: **none**. Remaining supporting and normalization gaps: **ANALYTICAL_ONLY**.

[Original/revised observation lineage](evidence/2026-10-16-ticker-closure-SHB/SHB_RESTATEMENT_REVIEW.json) · [Capital qualification](evidence/2026-10-16-ticker-closure-SHB/SHB_CAPITAL_QUALIFICATION.json) · [Source search](evidence/2026-10-16-ticker-closure-SHB/SHB_CAPITAL_SOURCE_SEARCH.json) · [Final sufficiency](evidence/2026-10-16-ticker-closure-SHB/SHB_FINAL_SUFFICIENCY.json) · [Offline replay](evidence/2026-10-16-ticker-closure-SHB/INDEPENDENT_REPLAY.json).

## SSB — B

**B. LEVEL-1 ACCOUNTING SUFFICIENT — SUPPORTING ANALYTICS DEFERRED.** Latest qualified current period: **6M2026 YTD**, scope **CONSOLIDATED**. Critical 0; Major 0; Minor 0.

| Current accounting observation | Qualified value |
|---|---:|
| Total assets | 427,107,510 |
| Total equity | 42,195,287 |
| Net income, six months | 2,101,553 |
| Customer deposits | 199,777,344 |
| Gross customer loans | 253,860,052 |
| Group 3 | 470,543 |
| Group 4 | 621,510 |
| Group 5 | 4,609,692 |
| NPL = Group 3 + 4 + 5 | 5,701,745 |
| NPL / gross customer loans | 2.246019% |
| General customer-loan allowance | 1,868,671 |
| Specific customer-loan allowance | 1,928,362 |
| Approved allowance numerator | 3,797,033 |
| Separately excluded allowance | 0 |
| Balance-sheet aggregate allowance | 3,797,033 |
| LLR | 66.594227% |
| CAR | 12.06% |
| Tier 1 ratio, explicitly reported | 11.89% |
| CET1 | UNAVAILABLE |
| CASA | UNAVAILABLE — ANALYTICAL_ONLY |
| NIM | UNAVAILABLE — ANALYTICAL_ONLY |

Loan-quality source: PDF page 39, SHA256 `3b7185bbb96777aef83436fe6226704e85427eff2b351ae8c2c9107f1ebac06c`. Provision source: PDF page 40, SHA256 `3b7185bbb96777aef83436fe6226704e85427eff2b351ae8c2c9107f1ebac06c`. Exact sources, units and current columns: [accounting qualification](evidence/2026-10-16-ticker-closure-SSB/SSB_ACCOUNTING_QUALIFICATION.json); [NPL](evidence/2026-10-16-ticker-closure-SSB/SSB_NPL_RECONCILIATION.json); [LLR](evidence/2026-10-16-ticker-closure-SSB/SSB_LLR_RECONCILIATION.json).

Capital source: [SSB_Regulatory_Capital_2026.pdf](../../data/manual-fundamentals/SSB/SSB_Regulatory_Capital_2026.pdf), physical PDF page 5; `TT41_2016_BASEL_II`, `CONSOLIDATED`, 2026-06-30. Tier 1 is not used as CET1.

| Period | Gross loans | G3 | G4 | G5 | NPL ratio | General | Specific | LLR | CAR |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 2022-12-31 | 153,955,992 | 453,553 | 219,567 | 1,786,985 | 1.597927% | 1,141,268 | 1,291,741 | 98.898584% | 14.66% |
| 2023-12-31 | 179,751,893 | 383,457 | 864,311 | 2,235,229 | 1.937669% | 1,333,794 | 1,644,225 | 85.501624% | 13.61% |
| 2024-12-31 | 209,354,643 | 202,862 | 695,091 | 3,061,403 | 1.89122% | 1,548,258 | 1,733,175 | 82.877948% | 12.84% |
| 2025-12-31 | 237,047,100 | 325,473 | 573,164 | 3,975,433 | 2.056161% | 1,750,156 | 1,516,534 | 67.021811% | 13.39% |
| 2026-06-30 | 253,860,052 | 470,543 | 621,510 | 4,609,692 | 2.246019% | 1,868,671 | 1,928,362 | 66.594227% | 12.06% |

Provider conflicts: **0 canonical facts resolved by qualified issuer authority**; provider anomaly/semantic exclusions remain in the [provider receipt](evidence/2026-10-16-ticker-closure-SSB/SSB_PROVIDER_ANOMALIES.csv). Unresolved canonical issuer conflicts: **0**. Broader issuer-table anomalies and definition conflicts are listed below and in [OPEN_ISSUES](evidence/2026-10-16-ticker-closure-SSB/OPEN_ISSUES.json); they are not hidden by the canonical conflict count.

Remaining material DATA_INTEGRITY / SOURCE_UNAVAILABLE gaps: **none**. Remaining supporting and normalization gaps: **ANALYTICAL_ONLY**.

[Original/revised observation lineage](evidence/2026-10-16-ticker-closure-SSB/SSB_RESTATEMENT_REVIEW.json) · [Capital qualification](evidence/2026-10-16-ticker-closure-SSB/SSB_CAPITAL_QUALIFICATION.json) · [Source search](evidence/2026-10-16-ticker-closure-SSB/SSB_CAPITAL_SOURCE_SEARCH.json) · [Final sufficiency](evidence/2026-10-16-ticker-closure-SSB/SSB_FINAL_SUFFICIENCY.json) · [Offline replay](evidence/2026-10-16-ticker-closure-SSB/INDEPENDENT_REPLAY.json).

## STB — B

**B. LEVEL-1 ACCOUNTING SUFFICIENT — SUPPORTING ANALYTICS DEFERRED.** Latest qualified current period: **6M2026 YTD**, scope **CONSOLIDATED**. Critical 0; Major 0; Minor 0.

| Current accounting observation | Qualified value |
|---|---:|
| Total assets | 892,048,566 |
| Total equity | 62,807,249 |
| Net income, six months | 2,931,095 |
| Customer deposits | 647,939,224 |
| Gross customer loans | 636,028,893 |
| Group 3 | 7,200,220 |
| Group 4 | 8,482,978 |
| Group 5 | 32,273,885 |
| NPL = Group 3 + 4 + 5 | 47,957,083 |
| NPL / gross customer loans | 7.540079% |
| General customer-loan allowance | 4,528,734 |
| Specific customer-loan allowance | 22,648,163 |
| Approved allowance numerator | 27,176,897 |
| Separately excluded allowance | 0 |
| Balance-sheet aggregate allowance | 27,176,897 |
| LLR | 56.669204% |
| CAR | 9.89% |
| Tier 1 ratio, explicitly reported | 8.37% |
| CET1 | UNAVAILABLE |
| CASA | UNAVAILABLE — ANALYTICAL_ONLY |
| NIM | UNAVAILABLE — ANALYTICAL_ONLY |

Loan-quality source: PDF page 43, SHA256 `bf6bf815678a440ea61d2aa606b8233a15476dfdfb18be3513c26fd5d32caa25`. Provision source: PDF page 46, SHA256 `bf6bf815678a440ea61d2aa606b8233a15476dfdfb18be3513c26fd5d32caa25`. Exact sources, units and current columns: [accounting qualification](evidence/2026-10-16-ticker-closure-STB/STB_ACCOUNTING_QUALIFICATION.json); [NPL](evidence/2026-10-16-ticker-closure-STB/STB_NPL_RECONCILIATION.json); [LLR](evidence/2026-10-16-ticker-closure-STB/STB_LLR_RECONCILIATION.json).

Capital source: [STB_Regulatory_Capital_2026.pdf](../../data/manual-fundamentals/STB/STB_Regulatory_Capital_2026.pdf), physical PDF page 5; `TT41_2016_BASEL_II`, `CONSOLIDATED`, 2026-06-30. Tier 1 is not used as CET1.

| Period | Gross loans | G3 | G4 | G5 | NPL ratio | General | Specific | LLR | CAR |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 2022-12-31 | 438,627,777 | 560,727 | 731,065 | 3,007,042 | 0.980064% | 3,267,326 | 2,362,858 | 130.970026% | 9.49% |
| 2023-12-31 | 482,731,122 | 1,490,299 | 4,593,502 | 4,900,265 | 2.2754% | 3,583,769 | 3,978,245 | 68.845307% | 9.11% |
| 2024-12-31 | 539,314,658 | 1,459,877 | 2,627,546 | 8,869,767 | 2.402529% | 3,976,512 | 4,890,143 | 68.430385% | 10.14% |
| 2025-12-31 | 626,392,336 | 6,920,385 | 3,310,299 | 29,906,074 | 6.407607% | 4,473,516 | 15,582,429 | 49.969021% | 9.2% |
| 2026-06-30 | 636,028,893 | 7,200,220 | 8,482,978 | 32,273,885 | 7.540079% | 4,528,734 | 22,648,163 | 56.669204% | 9.89% |

Provider conflicts: **0 canonical facts resolved by qualified issuer authority**; provider anomaly/semantic exclusions remain in the [provider receipt](evidence/2026-10-16-ticker-closure-STB/STB_PROVIDER_ANOMALIES.csv). Unresolved canonical issuer conflicts: **0**. Broader issuer-table anomalies and definition conflicts are listed below and in [OPEN_ISSUES](evidence/2026-10-16-ticker-closure-STB/OPEN_ISSUES.json); they are not hidden by the canonical conflict count.

Remaining material DATA_INTEGRITY / SOURCE_UNAVAILABLE gaps: **none**. Remaining supporting and normalization gaps: **ANALYTICAL_ONLY**.

The current original reviewed consolidated PDF was acquired from the permitted public filing mirror and retained (96 pages; SHA256 `bf6bf815678a440ea61d2aa606b8233a15476dfdfb18be3513c26fd5d32caa25`). EY review pp6–7 identifies the six-month period and gives its conclusion dated 12 August 2026. Prior failed acquisition attempts remain recorded. Earlier audited statements contain NHNN-approved restructuring accounting provisions and emphasis concerning legacy assets; as-reported values are retained without normalizing VAMC, accrued interest or legacy NPL.

[Original/revised observation lineage](evidence/2026-10-16-ticker-closure-STB/STB_RESTATEMENT_REVIEW.json) · [Capital qualification](evidence/2026-10-16-ticker-closure-STB/STB_CAPITAL_QUALIFICATION.json) · [Source search](evidence/2026-10-16-ticker-closure-STB/STB_CAPITAL_SOURCE_SEARCH.json) · [Final sufficiency](evidence/2026-10-16-ticker-closure-STB/STB_FINAL_SUFFICIENCY.json) · [Offline replay](evidence/2026-10-16-ticker-closure-STB/INDEPENDENT_REPLAY.json).

## TCB — B

**B. LEVEL-1 ACCOUNTING SUFFICIENT — SUPPORTING ANALYTICS DEFERRED.** Latest qualified current period: **6M2026 YTD**, scope **CONSOLIDATED**. Critical 0; Major 0; Minor 0.

| Current accounting observation | Qualified value |
|---|---:|
| Total assets | 1,273,076,923 |
| Total equity | 188,997,150 |
| Net income, six months | 14,676,922 |
| Customer deposits | 662,447,730 |
| Gross customer loans | 847,335,568 |
| Group 3 | 1,397,092 |
| Group 4 | 1,887,266 |
| Group 5 | 5,886,228 |
| NPL = Group 3 + 4 + 5 | 9,170,586 |
| NPL / gross customer loans | 1.082285% |
| General customer-loan allowance | 5,924,451 |
| Specific customer-loan allowance | 5,587,580 |
| Approved allowance numerator | 11,512,031 |
| Separately excluded allowance | 10,254 |
| Balance-sheet aggregate allowance | 11,522,285 |
| LLR | 125.53212% |
| CAR | 14.95% |
| Tier 1 ratio, explicitly reported | 14.06% |
| CET1 | UNAVAILABLE |
| CASA | UNAVAILABLE — ANALYTICAL_ONLY |
| NIM | UNAVAILABLE — ANALYTICAL_ONLY |

Loan-quality source: PDF page 50, SHA256 `17f386dc042f813a2eb2f15590ded6511c32061ebe9da5acdb2b18150c30ceac`. Provision source: PDF page 52, SHA256 `17f386dc042f813a2eb2f15590ded6511c32061ebe9da5acdb2b18150c30ceac`. Exact sources, units and current columns: [accounting qualification](evidence/2026-10-16-ticker-closure-TCB/TCB_ACCOUNTING_QUALIFICATION.json); [NPL](evidence/2026-10-16-ticker-closure-TCB/TCB_NPL_RECONCILIATION.json); [LLR](evidence/2026-10-16-ticker-closure-TCB/TCB_LLR_RECONCILIATION.json).

Capital source: [TCB_Regulatory_Capital_2026.pdf](../../data/manual-fundamentals/TCB/TCB_Regulatory_Capital_2026.pdf), physical PDF page 6; `TT41_2016_BASEL_II`, `CONSOLIDATED`, 2026-06-30. Tier 1 is not used as CET1.

| Period | Gross loans | G3 | G4 | G5 | NPL ratio | General | Specific | LLR | CAR |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 2022-12-31 | 420,523,705 | 901,592 | 1,131,087 | 999,926 | 0.72115% | 3,146,428 | 1,625,021 | 157.338295% | 15.18% |
| 2023-12-31 | 518,641,568 | 1,856,801 | 2,762,221 | 1,380,121 | 1.156703% | 3,755,848 | 2,367,273 | 102.066595% | 14.35% |
| 2024-12-31 | 631,724,964 | 1,365,655 | 2,465,618 | 3,269,527 | 1.124033% | 4,518,890 | 3,564,151 | 113.832822% | 15.4% |
| 2025-12-31 | 767,617,129 | 918,063 | 1,339,119 | 5,941,193 | 1.068029% | 5,383,622 | 5,101,998 | 127.89876% | 14.61% |
| 2026-06-30 | 847,335,568 | 1,397,092 | 1,887,266 | 5,886,228 | 1.082285% | 5,924,451 | 5,587,580 | 125.53212% | 14.95% |

Provider conflicts: **5 canonical facts resolved by qualified issuer authority**; provider anomaly/semantic exclusions remain in the [provider receipt](evidence/2026-10-16-ticker-closure-TCB/TCB_PROVIDER_ANOMALIES.csv). Unresolved canonical issuer conflicts: **0**. Broader issuer-table anomalies and definition conflicts are listed below and in [OPEN_ISSUES](evidence/2026-10-16-ticker-closure-TCB/OPEN_ISSUES.json); they are not hidden by the canonical conflict count.

Remaining material DATA_INTEGRITY / SOURCE_UNAVAILABLE gaps: **none**. Remaining supporting and normalization gaps: **ANALYTICAL_ONLY**.

[Original/revised observation lineage](evidence/2026-10-16-ticker-closure-TCB/TCB_RESTATEMENT_REVIEW.json) · [Capital qualification](evidence/2026-10-16-ticker-closure-TCB/TCB_CAPITAL_QUALIFICATION.json) · [Source search](evidence/2026-10-16-ticker-closure-TCB/TCB_CAPITAL_SOURCE_SEARCH.json) · [Final sufficiency](evidence/2026-10-16-ticker-closure-TCB/TCB_FINAL_SUFFICIENCY.json) · [Offline replay](evidence/2026-10-16-ticker-closure-TCB/INDEPENDENT_REPLAY.json).

## VIB — C

**C. BLOCKED — CONCRETE MATERIAL SOURCE/DEFINITION ISSUES.** Latest qualified current period: **6M2026 YTD**, scope **CONSOLIDATED**. Critical 0; Major 2; Minor 0.

| Current accounting observation | Qualified value |
|---|---:|
| Total assets | 580,998,048 |
| Total equity | 47,837,834 |
| Net income, six months | 4,146,615 |
| Customer deposits | 317,451,548 |
| Gross customer loans | 397,083,447 |
| Group 3 | 2,726,693 |
| Group 4 | 3,148,157 |
| Group 5 | 5,742,057 |
| NPL = Group 3 + 4 + 5 | 11,616,907 |
| NPL / gross customer loans | 2.925558% |
| General customer-loan allowance | 2,935,061 |
| Specific customer-loan allowance | 2,127,953 |
| Approved allowance numerator | 5,063,014 |
| Separately excluded allowance | 0 |
| Balance-sheet aggregate allowance | 5,063,014 |
| LLR | 43.58315% |
| CAR | UNAVAILABLE |
| Tier 1 ratio, explicitly reported | UNAVAILABLE |
| CET1 | UNAVAILABLE |
| CASA | UNAVAILABLE — ANALYTICAL_ONLY |
| NIM | UNAVAILABLE — ANALYTICAL_ONLY |

Loan-quality source: PDF page 63, SHA256 `35544e18432c66711b6cb1ac20d99a280ca2347418014b6b7060bd4d720494e3`. Provision source: PDF page 37, SHA256 `35544e18432c66711b6cb1ac20d99a280ca2347418014b6b7060bd4d720494e3`. Exact sources, units and current columns: [accounting qualification](evidence/2026-10-16-ticker-closure-VIB/VIB_ACCOUNTING_QUALIFICATION.json); [NPL](evidence/2026-10-16-ticker-closure-VIB/VIB_NPL_RECONCILIATION.json); [LLR](evidence/2026-10-16-ticker-closure-VIB/VIB_LLR_RECONCILIATION.json).

| Period | Gross loans | G3 | G4 | G5 | NPL ratio | General | Specific | LLR | CAR |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 2022-12-31 | 231,944,016 | 1,540,756 | 1,709,696 | 2,436,387 | 2.451815% | 1,721,307 | 1,343,466 | 53.892382% | 12.78% |
| 2023-12-31 | 266,345,545 | 2,479,317 | 3,697,136 | 2,198,138 | 3.144258% | 1,981,106 | 2,289,424 | 50.993893% | 11.75% |
| 2024-12-31 | 324,009,713 | 2,305,497 | 2,670,580 | 6,397,437 | 3.510239% | 2,382,092 | 3,311,542 | 50.060465% | 11.97% |
| 2025-12-31 | 381,972,016 | 2,149,202 | 2,824,185 | 6,361,298 | 2.967412% | 2,817,081 | 2,041,740 | 42.866837% | 11.36% |
| 2026-06-30 | 397,083,447 | 2,726,693 | 3,148,157 | 5,742,057 | 2.925558% | 2,935,061 | 2,127,953 | 43.58315% | UNAVAILABLE |

Provider conflicts: **1 canonical facts resolved by qualified issuer authority**; provider anomaly/semantic exclusions remain in the [provider receipt](evidence/2026-10-16-ticker-closure-VIB/VIB_PROVIDER_ANOMALIES.csv). Unresolved canonical issuer conflicts: **0**. Broader issuer-table anomalies and definition conflicts are listed below and in [OPEN_ISSUES](evidence/2026-10-16-ticker-closure-VIB/OPEN_ISSUES.json); they are not hidden by the canonical conflict count.

- **Major — SOURCE_UNAVAILABLE** (`SOURCE_UNAVAILABLE_AFTER_REASONABLE_SEARCH`): Standard permitted mirror returned 404; bounded issuer/exchange/public-mirror indexed searches did not yield an accessible original for this date. VIB issuer disclosure listing exists, but access returned 403 or an unrelated generic page; no access-control bypass. No press/provider ratio admitted.

- **Major — DATA_INTEGRITY** (`TRUE_DATA_INTEGRITY_CONFLICT`): Reviewed statement PDF p63 reports headline customer NPL 2.10% (2025: 2.16%), while the same-page customer-loan groups 3+4+5 / gross imply 0.029255581132 (2025: 0.029674124086). Scope/definition bridge is not disclosed. Exact components and deterministic group ratio retained; headline not admitted or substituted.

[Original/revised observation lineage](evidence/2026-10-16-ticker-closure-VIB/VIB_RESTATEMENT_REVIEW.json) · [Capital qualification](evidence/2026-10-16-ticker-closure-VIB/VIB_CAPITAL_QUALIFICATION.json) · [Source search](evidence/2026-10-16-ticker-closure-VIB/VIB_CAPITAL_SOURCE_SEARCH.json) · [Final sufficiency](evidence/2026-10-16-ticker-closure-VIB/VIB_FINAL_SUFFICIENCY.json) · [Offline replay](evidence/2026-10-16-ticker-closure-VIB/INDEPENDENT_REPLAY.json).

## VPB — B

**B. LEVEL-1 ACCOUNTING SUFFICIENT — SUPPORTING ANALYTICS DEFERRED.** Latest qualified current period: **6M2026 YTD**, scope **CONSOLIDATED**. Critical 0; Major 0; Minor 1.

| Current accounting observation | Qualified value |
|---|---:|
| Total assets | 1,502,526,376 |
| Total equity | 191,215,344 |
| Net income, six months | 15,105,377 |
| Customer deposits | 732,887,440 |
| Gross customer loans | 1,161,401,541 |
| Group 3 | 12,569,548 |
| Group 4 | 15,717,889 |
| Group 5 | 9,799,726 |
| NPL = Group 3 + 4 + 5 | 38,087,163 |
| NPL / gross customer loans | 3.279414% |
| General customer-loan allowance | 8,350,705 |
| Specific customer-loan allowance | 12,882,563 |
| Approved allowance numerator | 21,233,268 |
| Separately excluded allowance | 161,614 |
| Balance-sheet aggregate allowance | 21,394,882 |
| LLR | 55.749146% |
| CAR | 13.29% |
| Tier 1 ratio, explicitly reported | 12.16% |
| CET1 | UNAVAILABLE |
| CASA | UNAVAILABLE — ANALYTICAL_ONLY |
| NIM | UNAVAILABLE — ANALYTICAL_ONLY |

Loan-quality source: PDF page 46, SHA256 `901f91a3b6e05c3342d9b77972c58627df06a8b8a4483cbc9d63eef1e01b6782`. Provision source: PDF page 49, SHA256 `901f91a3b6e05c3342d9b77972c58627df06a8b8a4483cbc9d63eef1e01b6782`. Exact sources, units and current columns: [accounting qualification](evidence/2026-10-16-ticker-closure-VPB/VPB_ACCOUNTING_QUALIFICATION.json); [NPL](evidence/2026-10-16-ticker-closure-VPB/VPB_NPL_RECONCILIATION.json); [LLR](evidence/2026-10-16-ticker-closure-VPB/VPB_LLR_RECONCILIATION.json).

Capital source: [VPB_Regulatory_Capital_2026.pdf](../../data/manual-fundamentals/VPB/VPB_Regulatory_Capital_2026.pdf), physical PDF page 7; `TT41_2016_BASEL_II`, `CONSOLIDATED`, 2026-06-30. Tier 1 is not used as CET1.

| Period | Gross loans | G3 | G4 | G5 | NPL ratio | General | Specific | LLR | CAR |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 2022-12-31 | 438,338,047 | 7,945,484 | 10,031,492 | 7,160,158 | 5.734646% | 3,233,834 | 10,441,831 | 54.404233% | 14.9% |
| 2023-12-31 | 566,271,290 | 12,074,224 | 11,990,997 | 4,362,633 | 5.020183% | 4,152,736 | 10,595,049 | 51.87794% | 17.17% |
| 2024-12-31 | 697,771,123 | 10,852,509 | 12,098,440 | 6,119,216 | 4.166146% | 5,079,275 | 11,203,918 | 56.013418% | 15.5% |
| 2025-12-31 | 943,901,630 | 11,429,858 | 10,879,958 | 9,154,889 | 3.333473% | 6,754,832 | 10,512,525 | 54.878496% | 14.35% |
| 2026-06-30 | 1,161,401,541 | 12,569,548 | 15,717,889 | 9,799,726 | 3.279414% | 8,350,705 | 12,882,563 | 55.749146% | 13.29% |

Provider conflicts: **8 canonical facts resolved by qualified issuer authority**; provider anomaly/semantic exclusions remain in the [provider receipt](evidence/2026-10-16-ticker-closure-VPB/VPB_PROVIDER_ANOMALIES.csv). Unresolved canonical issuer conflicts: **0**. Broader issuer-table anomalies and definition conflicts are listed below and in [OPEN_ISSUES](evidence/2026-10-16-ticker-closure-VPB/OPEN_ISSUES.json); they are not hidden by the canonical conflict count.

Remaining material DATA_INTEGRITY / SOURCE_UNAVAILABLE gaps: **none**. Remaining supporting and normalization gaps: **ANALYTICAL_ONLY**.

- **Minor**: Later issuer disclosure revises 2023 consolidated regulatory capital and CAR comparative; exact date/scope is explicit. Reason for revision not disclosed; original retained; current analysis selects later comparative.

[Original/revised observation lineage](evidence/2026-10-16-ticker-closure-VPB/VPB_RESTATEMENT_REVIEW.json) · [Capital qualification](evidence/2026-10-16-ticker-closure-VPB/VPB_CAPITAL_QUALIFICATION.json) · [Source search](evidence/2026-10-16-ticker-closure-VPB/VPB_CAPITAL_SOURCE_SEARCH.json) · [Final sufficiency](evidence/2026-10-16-ticker-closure-VPB/VPB_FINAL_SUFFICIENCY.json) · [Offline replay](evidence/2026-10-16-ticker-closure-VPB/INDEPENDENT_REPLAY.json).

## Validation and retention

Validation is recorded in [the round validation directory](evidence/2026-10-16-bank-qualification-validation/VALIDATION_RESULTS.json). Starting corrected baseline: **1,685 PASS / 0 FAIL**. The final result records bank qualification/semantic tests, protected VCB and all 15 approved ticker replays, VNM/TCX blocked preservation, structured certification, fundamental-data tests within the full application suite, architecture boundaries, lint, typecheck and DB validation. Failed attempts and corrections remain in the attempt log.

Original retained PDFs, per-ticker accounting/capital receipts, original/revised observation lineage, canonical facts, source bindings, replay receipts and seals are retained. Disposable OCR, page text, renders, images, extraction/debug files, scratch scripts and duplicate scratch PDF copies are deleted after dependencies are removed. No backup or archive is created. Independent offline replay is run for every bank after cleanup.

**STOP: Await “Review Bank Qualification Round”.** VCB, all 15 approved ticker closures, VNM and TCX are preserved. Do not start VIC, perform targeted fixes, score/rank VN30, produce a Top 10 or issue investment decisions. `readyForScoring=false`; `decisionReady=false`; `DI14=NOT_APPROVED`; `DI15=NOT_APPROVED`. Final HEAD remains `PENDING_COMMIT`.
