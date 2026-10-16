# VJC Level-1 closure review

**B. VJC CONDITIONALLY CLOSED — ANALYTICAL GAPS CARRIED FORWARD**

VJC is closed for this Level-1 round, subject to the requested independent review. No further analytical forensic round is authorized. Await **Review VJC Level-1 Closure**.

Starting HEAD: `016261d8e00d02d33b6af5bb4497fa94a48fafc2`. Final HEAD: `PENDING_COMMIT`. Evidence was generated before commit; no pre-commit SHA is presented as a final SHA.

| Requirement | Before admitted / required | After admitted / required | Missing after |
|---|---:|---:|---:|
| CORE | 19 / 35 | 35 / 35 | 0 |
| SECTOR_CORE | 1 / 5 | 5 / 5 | 0 |
| SUPPORTING | 16 / 40 | 35 / 40 | 5 |

Production classification remains **INDUSTRIAL**, established from the existing universe, canonical registries and approved evidence requirements. No AVIATION scoring contract or denominator change was introduced. The five supporting gaps are common-share earnings qualification, one per required period.

The source set is audited consolidated FY2022–FY2025 plus the issuer-reviewed consolidated **1 January–30 June 2026** statement. Scope, VND, accounting definitions, exact periods and PDF hashes are retained. The current 60-day grace rule requires 6M2026; Q3 is not yet due. Quarter substitution and annualization are disabled. Audit/review signing dates do not establish publication timing: publication fields remain null, and historical PIT remains NOT_READY without blocking CURRENT_ANALYSIS Level 1.

The signed FY2022 adjusted original contains audit report HCM13860 (physical p8). The alternate text PDF contains placeholder HCMxxxx and is excluded from new admission, while retained as an existing protected original. Prior observations remain in VJC_PRIOR_OBSERVATION_LEDGER.json. FY2024 CapEx had a legacy negative admission; the source payment remains -8,786,533,082,262 VND and approved positive-outflow canonical CapEx is 8,786,533,082,262 VND. This is an explicit extraction sign correction, not an issuer restatement.

Reported borrowings satisfy unchanged **nonfinancial-debt-contract-v2** for all five periods using **ISSUER_REPORTED_CARRYING_AMOUNT**. At 30 June 2026 they total **72,293,252,504,416 VND**. Finance leases are recognized from FY2023 in the reviewed source set. FY2023–FY2024 combine borrowings and leases; FY2025 and 6M2026 present loans and leases separately. Explicit operands bridge these presentations once. Current portions are already in the current bucket and excluded from noncurrent amounts. Bond issue-cost deductions are retained; face principal never replaces carrying value.

At 30 June 2026 recognized finance-lease carrying value is **3,214,203,396,471 VND**, split between current 328,532,874,721 and noncurrent 2,885,670,521,750. Both amounts are included once. Future lease interest 1,665,077,238,295 is excluded from carrying debt. Future operating-lease payments and aircraft purchase commitments are not estimated into debt. FY2022 has no separately established recognized finance-lease amount; no exhaustive zero is claimed. Additional financing beyond the reported population remains UNKNOWN. **Comprehensive financial debt is unverified**, with visible uncertainty, rather than forced into admission.

Issuer accounting cash is qualified. Economically available unrestricted cash is unqualified, so **NET_DEBT remains N_R / UNAVAILABLE**. No aircraft, security or maintenance deposit is treated as cash, and no deposit is netted against debt.

Owned tangible assets, finance-leased fixed assets, construction in progress, supplier advances and deposits retain their issuer categories. No synthetic ROU, fleet value, NAV or aircraft inventory metric is created. Net inventory boundaries and provisions are preserved; optional inventory gaps are not neutral-filled. CapEx uses exactly the reported acquisition cash-flow row21, with source sign and operands retained; no lease principal, financial investment, deposit caption or total investing outflow is appended.

Sale-and-leaseback accounting follows each issuer period's policy. Reported accounting revenue/profit is retained, including aircraft-related accounting transactions where recognized; cash sale receipts are not automatically revenue or debt. No gains are reconstructed or normalized. Unused tickets and related fees remain deferred revenue until the issuer recognition event; customer advances and customer obligations do not become debt or revenue automatically. Separate loyalty amounts remain unqualified, not zero.

Maintenance fund contributions recoverable from lessors are other receivables. Maintenance and aircraft return obligations remain provisions; qualifying deferred maintenance costs retain issuer treatment. No expenses are normalized away or automatically capitalized. Lease principal remains in the issuer financing cash-flow classification and is not appended to CapEx. Fuel/FX forecasts never reconstruct accounting profit.

The issuer reports Circular99/2025 and Circular43/2026 in the 2026 statement. Note40 (physical p76) explicitly reclassifies opening-2026 short financial investments/receivables by 1,815,884,395,256 VND. Both original FY2025 receivables (33,547,327,983,359) and reclassified comparative (31,731,443,588,103) are retained with source lineage. Annual canonical FY2025 stays on its original presentation; current 2026 facts use the issuer's current captions. No silent historical rewrite or unsupported numerical restatement is admitted.

There are **11 resolved issuer/provider canonical conflicts** and **24 provider review rows** covering explicit anomalies, semantic uncertainty and suspect zeros. The latter are not all confirmed false zeros. Raw VJC CafeF NAM/QUY snapshots remain primary structured inputs; original statements resolve gaps/conflicts. No new LUYKE request/admission occurred. Unknown schema or frame semantics fail closed. Zero never substitutes for missing evidence.

Unresolved canonical issues: **Critical 0 / Major 0 / Minor 3**. Minor limitations are unproven historical publication timing, unqualified unrestricted cash and unverified comprehensive debt. Analytical work deferred to Level 2 includes normalized airline earnings, sale-and-leaseback/lease/maintenance/fuel/FX normalization, EBITDAR, fleet and lease-adjusted economics, load factor and yield analysis, forecasts and valuation. Supporting completeness is not a Level-1 gate. Financial-health analytical qualification remains pending and is not represented as scoring readiness.

Validation: full application suite **1580 PASS / 0 FAIL**, 112 files; VJC regressions **46 PASS / 0 FAIL** including all 41 requested cases; focused debt/fundamental/architecture **197 PASS / 0 FAIL**; CafeF certification **40 PASS**; production admission **17 PASS**; lint, typecheck, architecture boundaries and DB validation PASS. TEST_RESULTS.json retains the earlier timeout and successful resolution rather than hiding it. All 14 approved ticker replays pass, all pre-existing tracked source/evidence/contracts/replays remain byte-identical, and VNM remains **DEFERRED BLOCKED**.

Original PDFs, raw snapshots, canonical facts, provenance, replay essentials and compact results are retained. Disposable OCR, page text/images, extraction scripts and validation scratch/logs are deleted with no archive or backup. INDEPENDENT_REPLAY.json records a separate-process offline regeneration; the final verifier is run again after cleanup. ARTIFACT_HASHES.json seals the evidence. This machine replay is not an independent human review.

`readyForScoring=false`, `decisionReady=false`; DI14/DI15 are NOT_APPROVED. No TCX, Banks, VIC, VN30 scoring/ranking, Top10, recommendation or DCA work was started.

Replay: `node scripts/verify-vjc-ticker.mjs --ticker=VJC` using Node22.23.2. Evidence: `docs/fundamental-data-engine/evidence/2026-10-16-ticker-closure-VJC/`.
