# TCX primary Level-1 closure review

**Verdict C: TCX BLOCKED — MATERIAL LEVEL-1 DATA-INTEGRITY GAPS REMAIN.** TCX is in the exception queue. The only targeted follow-up is issuer-specific proof resolving the FY2022 managed-investor financing population. This round does not proceed to analytical qualification or investment decisions.

## Provenance and contract

Starting HEAD is `910a4d64fdc3368721f6236d9f2c76e3068347a3`; the initial tree was clean. Final HEAD is `PENDING_COMMIT`, reflecting evidence generation before any final commit. The starting SHA is not presented as a completed final commit.

Production authority classifies TCX as SECURITIES. The active requirement registry preserves the securities contract: assets, equity and total reported net income are CORE; accounting cash, financial debt and margin loans are SECTOR_CORE. SUPPORTING contains eight existing metrics per window. The four methodology documents, canonical registry, evidence requirement registry, hybrid sufficiency rules, securities contract and validation cases are traced in `TCX_CONTRACT_TRACE.json`. No denominator, metric set, shared production contract or approved ticker is changed.

| Tier | Required | Before admitted | Before missing | After admitted | After missing |
| --- | ---: | ---: | ---: | ---: | ---: |
| CORE | 15 | 5 | 10 | 15 | 0 |
| SECURITIES SECTOR_CORE | 15 | 0 | 15 | 14 | 1 |
| SUPPORTING | 40 | 2 | 38 | 15 | 25 |

## Original sources, scope and current period

Five original issuer PDFs are retained under `data/manual-fundamentals/TCX/`: FY2022, FY2023, FY2024 and FY2025 audited statements plus the newly retained reviewed 6M2026 statement. `TCX_SOURCE_MANIFEST.json` retains exact SHA256, issuer, period, scope, currency, source URL and audit/review status. Historical source URLs may be original issuer reports hosted by Vietstock; the 2025 PDF is a member of the recorded source ZIP. Historical publication dates remain unknown; retrieval, filenames and signatures are not used to invent publication timestamps.

The 6M2026 issuer disclosure proves publication on 10 August 2026, with no invented time of day. KPMG's review conclusion on PDF page 7 covers the Company's financial position at 30 June 2026 and operations for the six-month period. The canonical current flow is **YTD 1 January–30 June 2026**, meeting the existing grace rule. Q2 provider stock observations may verify the exact same stock date; Q2 flow is never converted into 6M flow. No interim annualization is performed.

All five windows are **STANDALONE**. The auditor/reviewer opinions address the Company; notes 1–2 identify the same legal issuer, its branches and Vietnamese securities accounting basis. Investment statement rows and the long-term investment notes identify minority investments, not a subsidiary consolidation perimeter. TCX being a subsidiary of Techcombank does not make TCX's own accounts consolidated. The 2025/2026 branch and minority-investment changes remain documented issuer perimeter developments; no consolidated/standalone series is spliced.

The issuer investor-relations page identifies listing on 21 October 2025. FY2022–FY2024 audited pre-listing statements are the same issuer's accounting history, with original provenance and scope qualification. The retained official HSX July 2026 constituent reference lists TCX at row 21, consistent with the production universe. Listing does not fabricate missing periods or shrink the five-window denominator. The current-policy notes reference VAS and securities Circulars 210/2014 and 334/2016; 2026 note 2 also references Circular 99/2025, while note 4 states consistency with the most recent annual policies.

## Securities populations

| End | Gross margin loans, VND | Advances against sale proceeds, VND | Canonical financial debt, VND |
| --- | ---: | ---: | ---: |
| 2022-12-31 | 8,362,096,733,669 | 992,508,752,920 | UNAVAILABLE |
| 2023-12-31 | 16,263,049,488,754 | 356,117,549,493 | 19,017,655,741,207 |
| 2024-12-31 | 25,606,519,152,893 | 304,726,848,296 | 25,104,250,761,829 |
| 2025-12-31 | 43,162,734,820,966 | 696,997,656,177 | 34,093,976,776,742 |
| 2026-06-30 | 51,043,232,067,722 | 479,203,127,134 | 52,500,668,915,684 |

Each margin amount is the issuer's gross carrying population before separately presented provision, consistent with the approved securities definition. The notes identify advances as advances against **sale proceeds**, not securities-purchase loans. Purchase advances are not separately qualified. Margin plus disclosed sale-proceeds advances reconciles exactly to total loans in every window. No advances, other receivables, fair-value loan column or inferred allocation enters canonical margin loans.

Debt uses the existing financial-sector contract, not industrial Debt Contract v2. Borrowings and bonds use issuer carrying amounts; short/current and noncurrent populations are counted once. FY2023 explicitly identified iSave borrowing of VND 4,414,621,841,430 is included within short borrowing, not added twice. FY2024 notes state that program ended on 31 May 2024. FY2026 includes the DEG convertible-loan **liability carrying amount** of VND 1,314,886,041,778 and excludes the VND 9,962,663,607 equity option. Bond face amounts never replace carrying amounts. Transaction settlement, warrants and commercial payables are not automatically financing.

FY2022 debt is withheld because the VND 5,284,485,167,173 managed-investor payable could materially change the complete financing population. FY2022 note 18 and mixed-cost note 28 do not prove its interest-bearing classification; the FY2023 iSave disclosure does not supply a retrospective bridge. The disclosed bank/bond subtotal is preserved separately. This is a material population-qualification gap, not a claim that the issuer's accounting is wrong.

Company cash follows the issuer's accounting definition. Client transaction money is presented separately/off balance sheet and excluded from company cash, unrestricted cash, equity and financing debt. At 30 June 2026, client deposits are VND 9,046,562,592,920 and company accounting cash is VND 6,154,505,245,964. Explicit customer borrowing is distinguished from client transaction money. No unrestricted economic cash metric is manufactured.

FVTPL carrying balances remain asset observations: VND 17,278,163,500 in FY2024, VND 38,923,020,900 in FY2025 and VND 295,964,797,150 at 30 June 2026. AFS, HTM, loans and FVTPL remain separate. Neither balances nor changes in balances become proprietary-trading profit. Historical absence of a statement FVTPL row is not an inferred canonical zero.

The issuer publicly discloses a reviewed 6M2026 regulatory safety report. The approved canonical regulatory-ratio contract remains unqualified, so no regulatory ratio is admitted or calculated. The report's numeric population is not qualified in this round. Equity/assets is not substituted. This optional gap does not cause the Level-1 block.

NET_INCOME uses the issuer statement's total after-tax row in the qualified standalone scope. Parent/common attribution is not inferred. BASIC_EPS remains AS_REPORTED, never normalized. Industrial revenue and operating-profit aggregation are not imposed.

## Provider, comparative and issue review

The retained structured-first input contains **143 TCX NAM/QUY candidates from 12 immutable raw snapshots**. The verifier re-parses actual TCX records and checks each retained provider code and lexical raw value at its locator. Four actual template fingerprints are retained. No LUYKE request or admission is introduced. Shared securities mapping definitions remain available, but no SSI observation, PDF, loan value, scope qualification or exact-record certification witness serves as TCX evidence. There is no direct structured certification promotion: accounting admission uses TCX issuer verification. Unknown template drift fails closed.

Twenty zero/anomaly candidates are recorded explicitly in `TCX_PROVIDER_ANOMALIES.csv`; suspicious zeros remain quarantined unless issuer qualified. One provider/comparative conflict is resolved: FY2024 EPS 8,716 becomes issuer-restated comparative 1,964 in FY2025 note 38. Original and revised observations, source hashes, explicit supersession and the bonus-share adjustment lineage are retained. The 6M2026 note 35 separately retains 6M2025 EPS 1,231 originally reported and 1,026 adjusted; these comparative observations do not create an annual revision or an extra required period.

Critical: **0**. Major: **1**, unresolved FY2022 financial-debt population. Minor: **2** one-VND issuer presentation discrepancies: FY2024 long-term liability subtotal versus component sum/next comparative; FY2025 total net-income row versus common-earnings row. Exact issuer rows are preserved without rebalancing. There are **0 invalid canonical verifications** and **0 unresolved same-metric issuer conflicts** in admission; the material debt-population gap is separately visible in sufficiency and the exception queue. A zero conflict count does not erase the debt blocker.

## Deferred qualification and governance

Normalized proprietary-trading/FVTPL earnings, sustainable ROE, normalized lending spread, margin-loan stress, brokerage market share, through-cycle earnings, capital-market cycle adjustments, forecast regulatory capital, forward earnings, P/B and ROE valuation, DCF and SOTP remain Level 2/3 work. Remaining supporting gaps are unavailable, not neutral-filled; 100% SUPPORTING is not a closure requirement. Historical PIT remains NOT_READY without independently blocking CURRENT_ANALYSIS.

All 15 approved closures, canonical snapshots, evidence and bound sources are protected; VNM remains DEFERRED BLOCKED. No bank, VIC, VN30 scoring/ranking, Top 10, Buy/Hold/Sell or DCA work is started. DI14/DI15 are not approved. `readyForScoring=false`; `decisionReady=false`.

## Retention, cleanup, replay and validation

Original TCX PDFs, raw provider snapshots, durable review/transcription facts, source hashes, canonical inputs/outputs, producer, verifier and meaningful regressions are retained. The original PDF corpus follows the repository's existing ignored `/data/` storage convention; originals must accompany any offline repository transfer. No protected source is removed.

`DELETION_MANIFEST.json` records deletion of 757 disposable OCR, page-text, render and extraction-script artifacts. No backup or archive was made. Separate-process offline replay passed after deletion; the producer reproduces its generated artifacts exactly from retained durable sources and inputs. This is automated replay, not independent human review.

Detailed command outcomes, counts and unsuccessful attempts are retained in `TEST_RESULTS.json`; all 36 mandatory TCX regression outcomes are in `REGRESSION_RESULTS.json`; protected separate-process replay is in `PROTECTED_REPLAY_RESULTS.json`; TCX offline replay is in `INDEPENDENT_REPLAY.json`. Final validation: **1,616 PASS / 0 FAIL across 113 application test files**, including the 36 new TCX regressions; targeted checks 291 PASS / 0 FAIL; structured certification 40 PASS; protected replay 15 PASS; browser tests 12 PASS / 0 FAIL. Lint, typecheck, database validation and architecture checks pass. The supported Webpack production build and invalid-config smoke pass. Earlier sandbox timeout, native thread-pool SIGSEGV and interrupted default Turbopack compilation are explicitly recorded; default Turbopack completion remains unverified. E2E-regenerated tracked screenshots were restored from the clean starting HEAD byte-for-byte.

Stop after TCX and await **Review TCX Level-1 Closure**.
