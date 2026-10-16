# GVR Level-1 ticker data closure

**B. GVR CONDITIONALLY CLOSED — ANALYTICAL GAPS CARRIED FORWARD**

Starting HEAD: `80f78a14c09a1dbced380a572585c437c28eeb30`.
Final HEAD: **PENDING_COMMIT**. Closure artifacts and the scoped runtime/tests are uncommitted. No pre-commit SHA is represented as a final commit.

| Evidence tier | Before | After | Missing after |
|---|---:|---:|---:|
| CORE | 18/35 | 35/35 | 0 |
| SECTOR_CORE | 4/5 | 5/5 | 0 |
| SUPPORTING | 13/40 | 20/40 | 20 |

Production classification remains **MATERIALS**, with CafeF STANDARD_CORPORATE mappings. The required sector group is reported GROSS_PROFIT or OPERATING_PROFIT. GVR_CONTRACT_TRACE.json records the exact unchanged registry requirements, methodology references and hashes. No INDUSTRIAL/MATERIALS contract or denominator was invented. Materials cycle-normalization requirements remain Level 2.

Latest qualified current period is **2026-01-01 to 2026-06-30, YTD, REVIEWED, CONSOLIDATED, VND**. Existing 60-day grace requires 6M; Q3 remains within grace on October 16. The issuer's explicit six-month title and review report establish the window. Q2 does not substitute for YTD, and interim flows are not annualized.

Five original source sets are qualified: FY2022/FY2023/FY2024/FY2025 audited consolidated statements and reviewed 6M2026 consolidated statements. Original PDFs remain in data/manual-fundamentals/GVR/. All retain exact SHA256 and source URLs. Publication dates are recorded only when supported, with no invented timestamps. The FY2024 and FY2025 files contain Vietnamese and English versions; appended translations remain retained and are not duplicate accounting observations. The unreviewed Q2 original remains retained but excluded from the qualified current source set.

GVR is a consolidated diversified group: rubber, wood, industrial parks/infrastructure and other controlled subsidiaries. Associates/JVs remain equity-accounted and intra-group eliminations remain preserved. No associate/JV gross sales, assets or debt is added to consolidated facts.

Productive rubber plantations follow the issuer's PPE and depreciation policy. Development-stage plantations remain in construction in progress. Single-harvest trees grown for wood and other biological assets follow the separate issuer categories introduced in 2026. Net inventory, investment property, long-term development costs, land-use rights and prepaid land rent remain distinct; asset subgroups are never added again to group assets. No plantation metric, land-bank value, NAV or SOTP was created.

Current inventory is 3,992,833,226,038 VND: gross 4,023,710,491,444 plus provision (-30,877,265,406). Seven disclosed component categories reconcile exactly to gross. No provision is discarded, physical tonnage inferred, or commodity-price reconstruction performed. GVR_INDUSTRIAL_MATERIALS_METRICS.json retains policy and source-note locators.

Fifteen explicit comparative revision links retain original and revised observations. FY2023 note 7.5 corrects FY2022 balances and earnings following financial inspection and State Audit. The original FY2022 CFO is unchanged as expressly stated in the FY2023 revision note. Reviewed 2026 note 54/appendix I reclassifies six FY2025 canonical stock populations on the new presentation basis. Original observations are never overwritten. Historical PIT remains NOT_READY and does not block CURRENT_ANALYSIS Level 1.

Debt Contract v2: all five **REPORTED_BORROWINGS** populations qualify at **ISSUER_REPORTED_CARRYING_AMOUNT**. Short plus noncurrent captions reconcile; current portions are counted once. Quantified finance leases in FY2024/FY2025/6M2026 are already embedded, with exact current/noncurrent amounts retained and no second addition. FY2024's original maturity split differs from the later FY2025 comparative split while both caption totals agree; both splits and their source locators are retained, and the receipt uses the later disclosed split. No inferred total-debt revision is made. Loans from organizations/individuals are not mislabeled as bank-only borrowings. Commercial payables, customer advances, deferred revenue and ordinary related-party/land obligations do not automatically become debt. Comprehensive debt remains unverified; opaque other-financing population stays UNKNOWN and materiality UNASSESSED.

Cash is the issuer accounting cash-and-equivalents caption. HTM deposits and other investments are excluded. Unrestricted economically available cash is UNAVAILABLE; all NET_DEBT outputs remain **N_R**. CapEx uses only the qualified fixed-asset acquisition payment row 21 with explicit sign reversal; no row 23 lending/investment outflows, row 25 JV contributions, disposals or unqualified land payments are included. No economic CapEx normalization is performed.

Provider evidence contains 200 candidate anomaly/suspicious-zero rows with individual dispositions and 25 resolved accounting-conflict rows. There are **0 unresolved canonical issuer conflicts and 0 invalid verifications**. Some nonmandatory quarterly/provider fallback tasks remain required or quarantined; they do not replace the fully evidenced annual/YTD requirements. CafeF remains the retained primary structured ingestion feed, with issuer verification/fallback for these canonical observations. Only NAM/QUY candidates enter this closure; no new LUYKE request/admission or unknown-schema relaxation occurs.

Integrity severity: **Critical 0 / Major 0 / Minor 0 unresolved**. Remaining Level 2 gaps include unrestricted cash, exhaustive comprehensive debt/materiality, normalized rubber earnings/EBITDA/FCF, sustainable ROIC and maintenance CapEx, commodity sensitivity, segment normalization, plantation/land/industrial-park valuation and forecasts. SUPPORTING completion is not a Level 1 requirement; none is neutral-filled.

Validation: **1,534 PASS / 0 FAIL**, 111 files, using pnpm test with the repository default worker setting. All 44 new GVR regressions and 223 focused regressions pass. Debt v2, current-period, fundamental-data and architecture suites pass. CafeF certification passes 40 checks; production admission passes 17 regressions. Lint, typecheck and DB validation pass. All 13 approved ticker replays pass; 975 protected source/code/evidence/test files remain byte-identical. VNM remains DEFERRED BLOCKED. The initial baseline backup-test timeout during OCR and its successful isolated/full reruns are explicitly retained in TEST_RESULTS.json; no timeout or test code was changed.

Cleanup removes this round's OCR, renders, text, temporary extraction/authoring scripts and scratch/log files without backup or archive. Original issuer PDFs, raw provider snapshots, compact canonical provenance and replay inputs remain. The final separate-process offline replay runs after deletion and verifies exact source hashes, canonical output and deterministic producer output.

Run `node scripts/verify-gvr-ticker.mjs --ticker=GVR` with the supported Node 22 runtime. Local data/ remains under the existing gitignore; its retained PDF/raw bytes are required for replay and SHA256-bound. ARTIFACT_HASHES.json seals the evidence folder.

**GVR CLOSED at Level 1, with analytical gaps carried forward.** Independent human review remains pending. readyForScoring=false; decisionReady=false; DI14/DI15 NOT_APPROVED. No other ticker processing, scoring, ranking or investment decision was performed. Stop and await **Review GVR Level-1 Closure**.
