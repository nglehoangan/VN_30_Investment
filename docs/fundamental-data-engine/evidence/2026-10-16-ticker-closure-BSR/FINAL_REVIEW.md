# BSR Level-1 ticker data closure

Starting HEAD: `1ab172e47001686a56ffb435ff67bd8c90ce9a31`. Final HEAD: `1ab172e47001686a56ffb435ff67bd8c90ce9a31`. Changes are uncommitted.

**B. BSR CONDITIONALLY CLOSED — ANALYTICAL GAPS CARRIED FORWARD**

| Evidence tier | Before | After | Required |
|---|---:|---:|---:|
| CORE | 20 | 35 | 35 |
| SECTOR_CORE | 4 | 5 | 5 |
| SUPPORTING | 19 | 23 | 40 |

Production sector: **ENERGY**. CafeF mapping namespace: STANDARD_CORPORATE. Exact requirements and hashed authorities are in `BSR_CONTRACT_TRACE.json`. GAS requires reported cash CapEx; BSR requires reported gross profit or operating profit. No shared sector contract or denominator changes.

Latest qualified current period: **2026-01-01 through 2026-06-30 YTD, REVIEWED, CONSOLIDATED, VND**. Four audited consolidated annual originals cover FY2022–FY2025. Q1 originals and BSR FY2023 disclosure-only notice are retained but excluded from current/annual qualification. Q2 flows never substitute for YTD. No interim annualization.

Debt: five qualified **REPORTED_BORROWINGS** populations under unchanged v2, carrying amounts, with current portions included once. Comprehensive debt remains unverified. Other-financing population uncertainty stays UNKNOWN and materiality UNASSESSED; it is carried to analytical qualification. Commercial, related-party and environmental liabilities are not automatically financing.

Cash: issuer accounting cash and equivalents; HTM term deposits excluded. Unrestricted economically available cash is UNAVAILABLE; NET_DEBT is N_R. No manufactured net debt.

Provider review: 200 candidate anomaly/suspicious-zero rows retained with individual dispositions. 15 resolved accounting conflict rows; zero unresolved canonical issuer conflicts; zero invalid verifications. Provider zeros never override verified issuer nonzero CFO. Historical BSR quater=-1 raw metadata remains quarantined and excluded; no new LUYKE request or admission.

Inventory note components and provision reconcile to reported net inventory. No physical quantities or commodity data are admitted. CapEx uses the disclosed fixed-asset acquisition payment row21 with explicit sign reversal; no other investing outflow is included. Maintenance follows issuer accounting with no normalization.

BSR opening FY2025 cash changes from 7,625,822,768,599 to 7,663,008,773,244 VND and receivables from 13,539,339,764,397 to 13,270,042,757,120 VND in the reviewed 2026 comparative. Both original and revised observations are retained with explicit predecessor lineage. BSR-BF ceased consolidation on 2024-05-27; its debt is not restored to later periods. Auditor emphasis on unsettled equitization is preserved. FY2025 row410 subtotal discrepancy is excluded from canonical total equity; row400 reconciles to the balance sheet.

Integrity issues: **Critical 0 / Major 0 / Minor 1**, with the BSR subtotal item resolved outside the canonical population where applicable. Remaining analytical gaps include unrestricted cash, exhaustive comprehensive debt, normalized earnings/FCF, commodity-cycle and maintenance adjustments, forecasts and valuation. Supporting completion is not a Level-1 requirement. Historical PIT remains NOT_READY and does not block CURRENT_ANALYSIS.

Validation: full application suite **1,490 PASS / 0 FAIL**; 44 new energy regressions pass; CafeF certification 40 checks and production admission 17 regressions pass; lint, typecheck, DB validation and architecture checks pass. All eleven protected ticker replays pass. VNM stays DEFERRED BLOCKED. Resolved validation-attempt details are in TEST_RESULTS.json.

Cleanup: this round’s OCR, page text, renders and extraction/authoring scratch removed without backup or archive. Original PDFs, raw provider snapshots and compact provenance/replay evidence retained. Separate-process offline replay verifies exact canonical output and producer artifacts after cleanup.

Evidence: `docs/fundamental-data-engine/evidence/2026-10-16-ticker-closure-BSR/`. Run `node scripts/verify-energy-ticker.mjs --ticker=BSR` using Node22.23.2 or newer within the repository supported Node22 range. Local `data/` remains governed by the existing gitignore; retained PDFs/raw source bytes are required to replay and are SHA256-bound.

**CLOSED at Level1 with analytical gaps carried forward.** Independent human review remains pending. `readyForScoring=false`, `decisionReady=false`, DI14/DI15 not approved. Stop after GAS and BSR; await “Review Energy / Utilities Group Closure”.
