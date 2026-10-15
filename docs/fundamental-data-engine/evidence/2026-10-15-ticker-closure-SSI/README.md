# SSI Level-1 ticker data closure

B. SSI CONDITIONALLY CLOSED — ANALYTICAL GAPS CARRIED FORWARD

Analysis date: 15 October 2026 (Asia/Ho_Chi_Minh). Starting HEAD: `fad4f0ebaddaaa733cecf564f6d00bef69392f0c`. Independent review and Project Owner approval remain outstanding. HPG and VCB are not reopened. No scoring, ranking or investment decision is authorized.

| Tier | Before | After | Fixed required |
|---|---:|---:|---:|
| CORE | 7 | 15 | 15 |
| SECTOR_CORE | 1 | 15 | 15 |
| SUPPORTING | 2 | 5 | 40 |

| Period | CORE before → after | SECTOR_CORE before → after | SUPPORTING before → after |
|---|---|---|---|
| 2026-06-30 | 0/3 → 3/3 | 0/3 → 3/3 | 0/8 → 2/8 |
| 2022-12-31 | 1/3 → 3/3 | 0/3 → 3/3 | 0/8 → 0/8 |
| 2023-12-31 | 2/3 → 3/3 | 0/3 → 3/3 | 0/8 → 0/8 |
| 2024-12-31 | 1/3 → 3/3 | 0/3 → 3/3 | 0/8 → 1/8 |
| 2025-12-31 | 3/3 → 3/3 | 1/3 → 3/3 | 2/8 → 2/8 |

Required windows remain FY2022–FY2025 plus YTD 1 January–30 June 2026. The approved quarterly grace rule does not yet require 9M2026 on 15 October. No quarter is promoted to YTD and no flow is annualized. Current source is the EY-reviewed consolidated six-month issuer statement, PDF pages 8–9 (review) and 10–20 (statements). Issuer disclosure date: 14 August 2026; no publication timestamp is invented. Historical PIT is separately NOT_READY.

The M3 SECURITIES route is three CORE groups (assets, equity, NPAT), three SECTOR_CORE groups (cash, financial debt, margin loans), eight supporting metrics per window. Authority traced through SCORING_MODEL_v1.0 §6, METRIC_DEFINITIONS, SECTOR_NORMALIZATION (securities), SCORECARD_TEMPLATE, canonical registry, manual-fundamental-evidence-requirements-v1.json, debtRequirementsAt and hybrid-sufficiency. The registry is unchanged. Financial-sector debt retains its existing contract; corporate Debt Contract v2 is not applied.

CafeF NAM/QUY observations and existing SECURITIES schema/mapping contracts remain in retained input. Uncertified or conflicted observations fail closed and use issuer verification. All 37 selected facts currently use qualified issuer evidence; no failed certification is silently promoted. Four material provider/issuer quantity conflicts resolve to issuer accounting; 14 anomalous observations remain explicitly classified. See CSVs for exact rows.

FY2025 CFO is **-10,425,608,767,324 VND** (PDF p19 row60). CapEx is **148,182,381,457 VND**, the positive magnitude of PDF p20 row61 cash outflow. Raw CafeF zero cannot overwrite either.

Margin loans use only note 7.4 gross carrying amounts, excluding advances and unrelated receivables. FY2025: 38,616,232,016,646 VND; 6M2026: 40,036,581,154,395 VND. Every required period reconciles margin loans plus advances to total loans. Financial debt uses the complete reported borrowing row311/312; noncurrent liabilities contain deferred revenue and tax, not hidden borrowings.

Supplemental FVTPL asset balances, realized gains, unrealized gains, dividends/interest, warrant changes, gross losses, brokerage and operating revenue remain separately labelled in SSI_SECURITIES_METRICS.json. They are investigative cells, not new M3 required metrics. No proprietary-trading profit or regulatory safety ratio is fabricated. Missing supporting cells remain unavailable; their downstream analytical uses are not qualified.

FY2024 parent earnings original 2,835,023,120,364 VND remains as an observation. The FY2025 explicitly restated comparative selects 2,704,221,369,052 VND with a supersession link. Total FY2024 NPAT is unchanged. No historical release chronology is inferred.

Repository cleanup is recorded with hashes and references. Exact unused numbered copies are deleted without backup. Different-content copies and the client 2.ts file referenced in VCB historical validation remain; that retained copy causes a pre-existing workspace architecture/lint failure. Empty duplicate migration directories were removed after reproducing Prisma P3015. Canonical-only architecture validation passes all 166 modules.

Original PDFs remain in data/manual-fundamentals/SSI. The differently hashed FY2025 Vietstock variant is retained as an unqualified original, not canonical evidence. Unreferenced legacy SSI extraction files were deleted; historical reader proofs with remaining replay/provenance dependencies are retained. Fresh renders/OCR/scratch are disposable and removed after checks. Final SSI replay uses five original PDFs, eight original CafeF raw responses, compact verified cells and canonical facts, with no extraction dependency.

See TEST_RESULTS.json for complete validation outcomes, INDEPENDENT_REPLAY.json for separate-process byte checks and 12 regenerated artifact comparisons, OPEN_ISSUES.json for validation exceptions, and FINAL_REVIEW.md for the owner-review handoff. Separate-process replay is not an independent human review.

Deferred analytical qualification: normalized trading earnings/ROE, through-cycle brokerage, margin stress/concentration, market-share forecast, forward regulatory capital and valuation assumptions. These do not change the fixed Level-1 data contract.

Stop after SSI. Await: **Review SSI Ticker Data Closure**.
