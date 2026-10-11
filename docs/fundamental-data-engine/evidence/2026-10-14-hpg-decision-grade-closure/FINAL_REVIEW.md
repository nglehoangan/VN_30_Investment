# HPG Final Decision-Grade Qualification Closure

**C. HPG BLOCKED — MATERIAL DATA GAPS REMAIN**

Starting HEAD: `6d0f550747c2a56f9f656a8e0025d72dccdf3b7f`. This closure continues approved Debt Contract v2 without modifying the contract, historical evidence, or live databases. HPG is the only ticker reviewed. CafeF remains primary structured ingestion; issuer financial statements remain accounting verification authority. No CafeF cumulative API ingestion was added.

## Coverage and retained issuer fallback

| Tier | Before | After | DIRECT_STRUCTURED | SAFE_DERIVED | PDF_VERIFIED | UNAVAILABLE |
|---|---:|---:|---:|---:|---:|---:|
| CORE |35/35 (100%)|35/35 (100%)|17|5|13|0|
| SECTOR_CORE |5/5 (100%)|5/5 (100%)|4|0|1|0|
| SUPPORTING |30/40 (75%)|35/40 (87.5%)|13|0|22|5|

ISSUER_VERIFIED, FALLBACK_REQUIRED, PROVIDER_ANOMALY and CONFLICT are zero in these admission-group counts. Each denominator is unchanged and each group counted once, including reported/comprehensive debt alternatives. Coverage is not decision-grade qualification. Canonical facts total89;79 prior non-debt facts preserved exactly,5 reported-debt facts retain quantities/components while adding scoped materiality review, and5 issuer EPS numerator facts added. Structured certificates and existing admission requirements remain intact.

## Qualification findings

Independent financing risk review accepts **IMMATERIAL_FOR_CURRENT_ANALYSIS** for the five quantified opaque populations only. Nonzero UNKNOWN balances remain395,993,599,656;183,661,943,656;324,638,069,560;293,792,503,290;207,628,452,429 VND respectively (FY2022–FY2025 and6M2026). Current balance is0.210726% of reported borrowings; conservative expanded sensitivity429,366,559,462 VND is0.435773%. This is a scoped judgment, not an exhaustive financing population or universal threshold. Comprehensive debt remains unverified; no annualization was used.

All five unrestricted cash qualifications remain **UNAVAILABLE**, with null amounts. FY2024 explicitly pledged cash equivalents88.7bn VND; pledged term deposits outside cash captions are retained separately and never blindly deducted. Generic cash is not presumed available. Original and subsequent comparative disclosures remain distinct. **Net Debt remains N_R** in all periods.

No defensible normalized/downside EBITDA or complete EBITDA lease policy was established. Debt lease policy remains issuer-recognized-financing-leases-v1; compatibility **NOT_ESTABLISHED**, compatible=false. Debt/EBITDA ratios remainN_R. The6M2026 financial-investment disposal gain4,929,111,116,632 VND is retained as an unadmitted normalization candidate with negative adjustment, source/page, reason, classification, period, UNKNOWN reversibility and LOW confidence. Subtracting it alone does not establish economic EBITDA.

Five literal issuer EPS ordinary-share numerators are **PDF_VERIFIED, AS_REPORTED_NOT_NORMALIZED**:

| Period | VND | EPS source page |
|---|---:|---:|
|FY2022|8,441,310,554,031|66|
|FY2023|6,495,064,334,356|64|
|FY2024|11,199,154,728,773|65|
|FY2025|15,144,110,526,099|50|
|6M2026|15,033,259,106,241|61|

Source-specific parent profit and all issuer appropriations reconcile exactly. Estimated/provisional appropriation caveats survive; these figures do not qualify normalized sustainable earnings. FY2024 income-statement parent NPAT exceeds the EPS-note parent by2,635,252 VND; both literals are retained in HPG_ATTRIBUTION_RECONCILIATION.json without silent correction. Five economic OPERATING_PROFIT definitions remain unavailable: code30 includes financing items, and arbitrary line subtraction is rejected.

## Current analysis, historical PIT and governance

CURRENT_ANALYSIS remains **PARTIAL / LOW**, currentAnalysisReady=false, fundamentalScorable=false. Business Quality, Financial Health, Growth, Industry, Valuation and Risk retain explicit material evidence limits. Market/EV/scenario and industry-cycle inputs are not established by this retained issuer pack; no repository-wide absence is asserted.

Historical PIT remains **NOT_READY**, historicalReplayReady=false, separately assessed and not used as a current gate. A qualified current statement is admitted while the same unknown historical availability is rejected for historical replay. A fully qualified synthetic current case passes regardless of historical readiness.

Critical0 / Major3 / Minor1: cash+NetDebt; normalized earnings/EBITDA/cycle/lease compatibility; economic operating profit; minor FY2024 internal source attribution discrepancy. Financing materiality is closed only within its reviewed scope. **HPG remains insufficient for final decision-grade qualification.**

readyForScoring=false; DI14Approved=false; DI15Approved=false; HPGClosureApproved=false. No official VN30/M3 scoring, ranking, Top10, investment decision or DCA was run. Independent reviewer and Project Owner gates remain reserved.

## Validation and independent challenge

TEST_RESULTS.json retains exact commands, exit codes and raw-log SHA256. Complete `pnpm test`:103files/1,296tests PASS exit0. Focused certification/debt/scoring/sector/current suite:11files/209tests PASS exit0. `pnpm typecheck`, `pnpm lint`, `pnpm test:boundaries` (8files/98tests), `pnpm db:validate` all exit0. All17 qualification regressions pass, including10 mandatory cases. Initial diagnostic assertion failures are disclosed and resolved by checking structured rejection reasons.

Independent accounting, financing/cash and current/PIT policy challenge retained source renders and receipts. Offline command `/private/tmp/node-v22.23.2-darwin-arm64/bin/node scripts/verify-hpg-decision-grade.mjs` passes24/24 checks, exit0, reproduces14 artifacts byte-for-byte, replays activation and legacy snapshots exactly, verifies1,460 historical artifact hashes and8 database hashes unchanged. Forged rehashed common earnings and analytical qualification declarations fail against independent review witnesses.

All17 requested closure artifacts are present. ARTIFACT_HASHES.json seals the new evidence and source manifest, excluding its own self-hash. SOURCE_CHANGES.json lists the seven implementation/test/documentation paths; local commit also contains this evidence directory. Final commit SHA is reported outside this committed document to avoid a self-referential commit hash.
