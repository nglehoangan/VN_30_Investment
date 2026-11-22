# TCB Blocker Closure Report

**BLOCKED_TECHNICAL** · TCB / HOSE / BANK · Economic cutoff 30 October 2026 · Review 22 November 2026

The raw close and the share-count discrepancy are resolved for retrospective review. Formal execution remains blocked by the BANK dataset’s CET1 and share-status requirements, an unregistered TCB binding and the absence of a qualifying TCB assessment and executable route. The prior research closure remains the baseline for all 23 rubric dispositions. [TCB research closure](TCB_RESEARCH_CLOSURE.json)

## Original blockers

| Blocker | Status and cause |
| --- | --- |
| `NO_ADMITTED_CURRENT_DATASET_AT_CUTOFF` | **Open.** TCB has no current admission or dataset row. The BANK dataset requires both reported CAR and CET1 and a share count in the unchanged carry-forward state. The retained capital disclosure reports CAR and Tier 1. An actual issuance changed outstanding shares at the cutoff. |
| `NO_REGISTERED_TICKER_MAPPING_ADAPTER` | **Open.** Existing BANK services provide the financial and scoring interfaces. The registered factory and its executable pins are ACB-specific. The candidate TCB field mapping below identifies what can be bound once the contract accepts the evidence. Registering a factory now would leave native dataset assembly blocked. |
| `NO_EXACT_TICKER_SCORING_AUTHORITY` | **Open and downstream.** The check and prepare inventories show no TCB dataset, reference, formal assessment, review pair, executable pin or exact route authorization. There is no approval digest for the owner to review. |

[Existing BANK dataset validator](../../../../../src/infrastructure/source-admission/current-bank-dataset.ts) · [ACB adapter](../../../../../tools/scoring/acb-bank-adapter.ts) · [Route registry](../../../../../tools/scoring/vn30-score-routes.json)

## Data and mapping

The 17 pins and all 23 rubric-to-evidence joins matched the original closure. The existing evidence distinguishes consolidated statements from regulatory consolidation, and review candidates from admitted current facts. For the minimum BANK binding, the retained H1 statement supplies the following candidate cells. The Q3 statement was recovered for the share anchor. The table uses one coherent H1 financial period and does not substitute Q3 or FY2025 cells for missing H1 inputs.

| BANK concept | Native H1 input | Scope and locator |
| --- | ---: | --- |
| `TOTAL_ASSETS` | 1,273,076,923 million VND | Consolidated, 30 June, physical p. 8 |
| `BANK_GROSS_CUSTOMER_LOANS` | 847,335,568 million VND | Consolidated, 30 June, p. 8. Reported gross line includes margin lending and advances, as shown on p. 52. |
| `TOTAL_EQUITY` | 188,997,150 million VND | Consolidated, 30 June, p. 9. Total accounting equity. |
| `BANK_CUSTOMER_DEPOSITS` | 662,447,730 million VND | Consolidated, 30 June, p. 9 |
| `NET_INCOME` | 14,676,922 million VND | Consolidated, 1 January to 30 June, p. 11. Group profit after tax. |
| `BANK_RESERVE_GENERAL`, `BANK_RESERVE_SPECIFIC` | 5,924,451 + 5,587,580 million VND | Consolidated, 30 June, p. 52, Note 10. The approved derivation yields 11,512,031 million VND. The separate margin lending and advances reserve is 10,254 million VND. Keep scope explicit when pairing any loan and reserve metrics. |
| `BANK_REPORTED_CAR` | 14.95% → 0.1495 | Regulatory consolidated, 30 June, capital disclosure p. 6, TT41. Tier 1 is separately reported as 14.06%. |
| `BANK_REPORTED_CET1` | null | The retained regulatory qualification has no explicit CET1 for this period. Tier 1 and total accounting equity cannot supply it. |

The BANK importer converts millions to VND and percentages to ratios. It binds the source document, receipt, period, scope, native cell, original retrieval and operational review/ingestion clocks. Candidate H1 retrievals date to 19 October, with exact-second and provenance details in the retained receipts. Recovered bytes match the previously recorded H1 statement and capital hashes. The original publication field stays null where the retained record supplies no trusted publication time. The recovery receipt records the actual November retrieval independently. [Native candidate packet](../../../scoring-dataset-acceptance/2026-10-30/b6-comparability-r2/native-inputs/TCB.json) · [Capital qualification](../../../evidence/2026-10-16-ticker-closure-TCB/TCB_CAPITAL_QUALIFICATION.json) · [BANK importer](../../../../../src/infrastructure/source-admission/current-bank-admission.ts)

## Rubric eligibility

**0 of 23 eligible.** VERIFIED 0, CONSERVATIVE 0, N/R 23, rated weight 0 of 100, official score null. Missing admission, TCB execution authority and the formal review pair apply to every row. Each row below identifies its additional evidence or mapping limitation. The single-TCB reconciliation checked the existing dispositions and did not reopen V4 bands. Exact per-row observation IDs and source pointers remain in the [original rubric inventory](TCB_RESEARCH_CLOSURE.json).

| Rubric | Retained context and remaining limitation beyond the common gates |
| --- | --- |
| BQ-EQ | **Economic evidence.** Profit and capital history exist. Sustainable common ROE, credit-cycle normalization and calibrated VND cost of equity remain unqualified. |
| BQ-MOAT | **Economic evidence.** Candidate issuer context lacks comparable retention and pricing economics through the cycle. |
| BQ-CASH | **Mapping and economic evidence.** Note 10 separates reserve operands, including the margin reserve. Loan vintage, collateral and funding resilience remain unresolved. BANK asset-quality analysis applies. |
| BQ-RES | **Economic evidence.** Retained borrower and sector mix supplies concentration context. Stressed common earnings and resilience remain unqualified. |
| FH-BS | **Mapping and economic evidence.** Financial assets, equity, loans and deposits map to the BANK candidate. Regulatory CET1 and qualification of concentration and obligations remain open. |
| FH-LIQ | **Economic evidence.** Retained maturity/funding leads lack qualified net incremental liquidity, encumbrance and stress haircuts. |
| FH-STRESS | **Economic evidence.** Historical capital and credit sensitivities lack a jointly calibrated funding, credit and RWA stress path. |
| GQ-HIST | **Mapping and economic evidence.** Retained dated annual profit has native mappings. Comparable normalized common earnings and a multiyear per-share action series remain unqualified. |
| GQ-FWD | **Economic evidence.** Hypothetical NIM, credit and capital cases lack a qualified forward path. |
| GQ-INC | **Economic evidence.** Historical capital and RWA context lacks matched incremental earnings and deployment economics. |
| IC-IND | **Economic evidence.** Retained leads lack comparable independent banking structure and through-cycle economics. |
| IC-POS | **Economic evidence.** Retained issuer context lacks comparable segment-share or distribution/retention measures. |
| IC-CYCLE | **Economic evidence.** Historical earnings and funding context lack qualified cycle positioning and forward credit migration. |
| VAL-PRIMARY | **Conflict resolved retrospectively, schema and economic evidence open.** The cutoff price and outstanding-count bridge are established. Current shares cannot bind under the existing status contract. Normalized common returns, cost of equity, capital feasibility and independent value check remain open. |
| VAL-RET | **Schema and economic evidence.** The entry bar is recovered. Accepted entry share basis, five-year exit value, distributions and dilution path remain open. |
| VAL-MOS | **Schema and economic evidence.** The cutoff bar and share arithmetic are supported. Conservative accepted common value on that basis remains null. |
| RG-GOV | **Economic evidence.** Retained governance disclosures lack transaction-specific pricing, independent controls and minority protections. |
| RG-RISK | **Economic evidence and review.** Residual exposure and safeguards remain unqualified, and TCB lacks formal M1 risk-gate evidence. |
| RG-UNC | **Economic evidence.** Sandbox sensitivity establishes illustrative dependence. Economically calibrated ranges and joint sensitivities remain open. |
| CA-REINV | **Economic evidence.** Retained capital data does not isolate returns on the same capital deployment and period. |
| CA-DIST | **Economic evidence.** Actual stock-dividend terms and issuance are evidenced. Discipline relative to eligible capital, liquidity and reinvestment remains unqualified. |
| CA-DIL | **Conflict resolved retrospectively and economic evidence open.** The stock-dividend count and rounding reconcile. The economic impact of the complete issuance and potential claim set still lacks a qualified band. |
| CA-PSV | **Schema and economic evidence.** The cutoff event is reconstructed. Real cycle-normalized per-share compounding requires a comparable series and qualified economic inputs. |

## Valuation conflict disposition

- **Raw close.** The TCB/HOSE exact-day CaféF response has one row, dated 30 October, and a matching raw-response SHA-256 `6d097dd786b82f4874e91f46b7bc26e1905988aae9a792c61d1246c7770a2ded`. At `/Data/Data/0/GiaDongCua`, 21.6 thousand VND normalizes to **21,600 VND/share**. The provider’s TCB display explicitly declares thousands and shows the same close. The TCBS 30 October display bar agrees in amount and keeps its undeclared adjustment metadata. The 29 October bar remains a separate session. The CaféF receipt is **22 November at 07:29:38.696844 UTC**. Retrospective price qualified, formal market admission and original cutoff knowledge unverified. [CaféF TCB unit and close](https://cafef.vn/du-lieu/DuLieu.aspx?cat_id=1009&san=hose&symbol=TCB)
- **Pre-event shares.** The FY2025 owner baseline is **7,086,240,414**. Physical p. 65 (printed p. 61), Note 23.2 of the recovered Q3 statement was visually checked. Both 30 September 2026 and the FY2025 comparative column give **7,086,240,414 issued common shares**. The page has no separate outstanding or treasury line, so the Q3 outstanding field remains null at that locator. The issuance report separately identifies **7,086,240,414** as issued and outstanding immediately before the event, with zero treasury shares at that observation. Keep the Q3 reading and the later pre-issuance statement time separate.
- **Cutoff event.** HOSE notice 2100 sets **29 October** ex-rights and **30 October** record date at 50%, with **3,543,120,207** shares planned. The issuer’s result report 0615, signed **9 November** and mirrored **10 November**, explicitly gives **30 October** as issuance completion and count date. It records **3,543,115,125** shares distributed and **5,082** fractions cancelled. The resulting **10,629,355,539 outstanding** is 5,082 below Vietstock’s provisional **10,629,360,621**. Zero treasury is stated for the issuance figures. Transfer was separately expected in November or December. No intraday count, transfer date or continuous treasury assertion is needed. The ESOP recorded as a proposal is a separate event and supplies no cutoff shares. [HOSE notice](https://staticfile.hsx.vn/Uploads/UploadDocuments/2507504/20261023%20-%20TCB%20-%20TB%20NDKCC%20phat%20hanh%20CP%20de%20tra%20co%20tuc.pdf) · [Issuer issuance report, sections II–III](https://static2.vietstock.vn/vietstock/2026/11/10/20261109___tcb___bao_cao_ve_ket_qua_phat_hanh_co_phieu_tra_co_tuc_2026.pdf) · [Issuer voting-share notice](https://static2.vietstock.vn/vietstock/2026/11/10/20261109___tcb___thong_bao_thay_doi_so_luong_co_phieu_bieu_quyet.pdf) · [ESOP filing notice](https://static2.vietstock.vn/vietstock/2026/11/20/20261120___tcb___thong_bao_phat_hanh_esop_2026.pdf)

The economic-end-of-day share figure is confirmed retrospectively. The validator requires `CARRIED_FORWARD_NO_CHANGE_FOUND_IN_REVIEWED_DOCUMENTS`, a false description of the 30 October event. Formal selected shares and price remain null in the dataset. The later source clocks also prevent historical point-in-time claims. The provisional intrinsic value, formal valuation and investment decision remain unset.

## Authorization gates

| Gate | Automatic verification | Owner authority and current state |
| --- | --- | --- |
| Formal admission and dataset | TCB identity, VN30 coverage, source bytes and receipt, cell mapping, actual knowledge time, revocation, isolated ingestion and exact replay. An eligible raw market observation uses the existing standing policy and trusted capture registration. | F2 BANK importer requires a registered, code- and catalog-pinned approved version and the owner-source line `Approve exact BANK admission version <hash> for TCB at 2026-10-30`. A confirmed-effective-change share path requires a qualified successor to the pinned BANK executable. Standing source approval covers the existing source role. The TCB version and data acceptance are absent. |
| Independent assessment | Exact dataset hash and consumed evidence, metric dispositions, dated M1 gates, and separately bound PREPARATION and CHALLENGE reviews must pass. | The current ACB self-review/limited-coverage qualification is ACB-specific and supplies no TCB adoption. Formal TCB review and acceptance remain pending. |
| Scoring and official artifact | The CLI must return `READY_FOR_CIO` with the pinned route and preflight digest. An authorized read-only check must replay the identical inputs. The standard path requires all mandatory assessments. The limited path in the current executable is hard-bound to ACB and its exact N/R set. | After successful preparation, an owner-authored receipt must state `Approve exact single-ticker VN30 score <hash> for TCB at 2026-10-30` with scope `CURRENT_SCORE_ARTIFACT_ONLY`. Only a successful governed write after authorization creates the immutable artifact. No TCB route or score approval exists. |
| Production publication | Validate exact stored scorecard, source/dataset/method/review hashes, revocation and publication readback. | Separate TCB publication authority must identify the exact scorecard and publication scope. Publication is outside this execution. |

[Assessment and scoring gates](../../../../../src/infrastructure/source-admission/current-scoring.ts) · [Exact route authorization](../../../../../tools/scoring/vn30_score_worker.mjs) · [Publication gate](../../../../../src/infrastructure/source-admission/current-publication.ts)

## Validation, scope and changes

- Read-only `check` reproduced the three original blockers. Read-only `prepare` reported the missing candidate pins, reviews and dataset with `scoringAuthorized: false`. SQLite `quick_check` returned `ok`. The provenance replay verified 17 old input hashes, 23 rubric joins, 20 observations and the new price and share arithmetic.
- **137 TypeScript tests passed** on Node 22.23.2 across raw close, bank accounting qualification, scoring golden fixtures, formal scoring, the scoring consumer and publication. The default Vitest run timed out starting workers and failed to resolve `server-only`. The successful rerun used a temporary Node/thread config and aliased Next’s existing server-only stub. Assertions stayed unchanged. Python passed **10** CLI, **18** single-ticker, **4** ACB future-evidence and **46** TCB sandbox tests.
- Reference **`0c76b37376df181405d696372e2e5cf724d6a4ad`** was the starting HEAD. Its ACB and VNM changes read display market dates for the freshness panel. Incremental scoring requires a later cutoff and a verified published baseline, so it supplies no TCB input or authority for this first score. The validation ran regression fixtures without rescoring other tickers or executing their live publication routes.
- Tracked change is this report. Local source stores retain one CaféF response and four PDFs, with their original or new retrieval metadata in the existing collectors’ catalogs. The Vietstock downloader’s retired transport import was supplied from its historical Git bytes in a temporary directory. No root script was restored. No score, database row, registry entry, executable, policy or prior research artifact was changed. No evidence was removed.
- Local source paths and full hashes are available in `data/manual-download/TCB/document-catalog.json`. The recovered H1 statement, H1 capital disclosure and Q3 statement match original manifest hashes `4669008f5b9f3f3504997fd1f7a08a786d250999a8f8de583fa0f08725aece45`, `96eb45c3fb1b16eda3582aed795e7eaacaf53a41090cec85edfafef533fb6b91` and `fd82d64db310dbdbbbf8a60ae092025eeac42717fe9ad9ce26622103237b0199`. The issuer issuance report is `b9225d5789248cbc8ce8186ba3fd79241396efa59e0c3f8ab31f299aa50398f7`. The fetched sources stay in the repository’s ignored data store.

The smallest prerequisite is a versioned BANK binding that accepts a verified effective share change. The present requirement also needs a source-qualified TCB CET1 cell. If CET1 is unavailable and the owner wants a CAR-only route, that requires a separately qualified and expressly approved dataset requirement. The owner has no scoring approval to sign at this stage.
