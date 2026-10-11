# Final debt metric contract review

A. CONTRACT CORRECTION RECOMMENDED

Starting HEAD: `f6873711fb9014fb5aa4e4c457e3affd9544ff45`. Review status:PROPOSED_UNAPPROVED. Project Owner approval/reference/effective date:null. Contract activation:false. This is a model/metric review using retained evidence, not another data-extraction campaign or HPG admission.

Approved M3 intent is interest-bearing leverage with consistent leases, unrestricted cash, normalized/downside earnings and survivability/funding resilience. It does not explicitly require proof that every miscellaneous payable is non-financing. The current exhaustive population gate is appropriate for a strict assurance metric, but using it as the only required non-financial borrowing input conflates reported leverage measurement with comprehensive assurance. Recommend two named populations and explicit measurement/uncertainty fields rather than lowering the current strict metric or renaming HPG's loan subtotal.

Exact proposed non-financial CORE group:

```yaml
id: debt
anyOf: [COMPREHENSIVE_FINANCIAL_DEBT, REPORTED_BORROWINGS]
component: FINANCIAL_HEALTH
preference: [COMPREHENSIVE_FINANCIAL_DEBT, REPORTED_BORROWINGS]
```

This applies only to REAL_ESTATE,RETAIL,TECHNOLOGY,INDUSTRIAL,MATERIALS,UTILITIES,ENERGY,CONGLOMERATE in a later Owner-approved requirement version. Current anyOf:[FINANCIAL_DEBT] remains unchanged. BANK/SECURITIES/INSURANCE contracts are unaffected. Exact scope, definitions, guards and activation prerequisites are in PROPOSED_AMENDMENT.md/PROPOSED_REQUIREMENT_GROUP.json.

REPORTED_BORROWINGS admits only the verified issuer-reported and explicitly identified qualifying financing population: short/non-current, current portions once, known bonds/finance leases/other financing with verified overlap and sector applicability. A known but unverified/unquantified financing amount blocks the reported metric. Unnamed miscellaneous liabilities are not mechanically added and remain UNKNOWN with their amounts; UNKNOWN is never zero or proven non-interest-bearing. COMPREHENSIVE_FINANCIAL_DEBT remains exhaustive and unavailable when financing population is unproven.

Carrying values and principal are distinct. Retained HPG quantities are issuer-reported carrying amounts, not proven gross principal. Proposed definitions require a versioned Owner-selected basis. Preferred comprehensive and reported alternatives must have compatible issuer/date/scope/currency/basis/lease policy and reconcile. A smaller compatible comprehensive total, mixed measurement/population series or differing lease policy requires review. Legacy FINANCIAL_DEBT is preserved until explicit migration; no silent alias is introduced.

The trace distinguishes manual-current/hybrid NET_DEBT mechanics, generic M3 NET_DEBT/NET_DEBT_EBITDA calculators and documented contextual debt/equity/net-debt/equity ratios. Interest coverage consumes EBIT/interest expense, not a debt stock. Debt/assets is not established as an active formula. The generic canonical registry/crosswalk are PROPOSED and currently lack FINANCIAL_DEBT/NET_DEBT routes; future migration must account for both pathways explicitly. Mechanical generic-cash subtraction does not prove the approved unrestricted-cash criterion; a basis-aware ratio bridge remains an activation prerequisite.

Cross-ticker review finding:SYSTEMATIC_CONTRACT_PROBLEM in a purposive retained sample, not a VN30-wide admission result. Samples cover HPG materials,VNM consumer,FPT technology,VIC conglomerate. Existing evidence records eight strict population derivation blocks across HPG,FPT,VIC,VHM. VNM supplies disclosure structure only, not verified numerical debt. Sixty-five retained references preserve qualified source hashes and reader page/line provenance. No other ticker obtains certification/admission.

| HPG period | Proposed reported quantity, VND | Comprehensive debt |
| --- | ---: | --- |
| FY2022 |57,900,321,604,873|unavailable|
| FY2023 |65,381,002,473,117|unavailable|
| FY2024 |82,963,129,469,555|unavailable|
| FY2025 |92,174,151,302,217|unavailable|
|6M2026|98,529,977,232,553|unavailable|

These are scenario quantities, not new approved canonical admissions. Hypothetical quantitative CORE would be 35/35 only if Owner approves the new group and accepts these reported populations under its version. Actual approved CORE remains 30/35(85.714286%), SECTOR_CORE 5/5, SUPPORTING 30/40, current trajectory/overall INSUFFICIENT. Historical PIT NOT_READY and supporting definition gaps are unchanged. Corrected current short borrowing remains71,433,383,400,905. No HPG approval, Financial Health score or M3 readiness is granted.

Opaque known component sums are retained for each period with exact amount/borrowings fractions; unquantified components remain null. The ratios do not bound hidden debt or prove non-materiality. No universal threshold was found in reviewed Risk/Scoring conventions and none is invented. Independent case-specific material uncertainty review, unrestricted-cash qualification, normalized EBITDA and consistent sector lease treatment remain necessary independently of quantity coverage.

Independent Accounting/Risk/M3/Governance reviewer recommends the same dormant amendment and confirms no activation. Twenty independent checks pass; five producer artifacts reproduce byte-for-byte offline; all 2,297 pre-existing tracked files and eight databases remain unchanged. The dormant prototype lives under scripts/lib and is imported only by review tooling/tests; production src/app code, approved documents, requirements, certificates and scoring logic are untouched.

Validation:101 files / 1,247 tests PASS; focused 6 files / 126 tests including 20newproposal tests PASS. All 10mandatory regressions pass: opaque liabilities not added/not zero, known financing/bonds/leases handled, current portion once, reported/comprehensive separation, financial-sector isolation, FY2024 false-zero protection and corrected current short. Additional selection/overlap/identity/measurement/series/source guards pass. Typecheck, final lint, boundaries(163 source modules), database validation and independent replay exit0. Initial lint warning corrected; exact commands/exits/logs are in TEST_RESULTS.json. No official scoring, ranking,Top10,DCA or investment decision was run.

Review defects:Critical0/Major0/Minor0 per independent review. Three Major activation/data carry-forwards remain in OPEN_ISSUES.json: Owner/version/measurement/lease approval; basis-aware M3 registry/derived/cash/earnings bridge; and material uncertainty/HPG comprehensive data risk. These prerequisites are not activated or cleared by this review. No reserved DI14/DI15 approval is granted; readyForScoring=false.

All 8requested review phases and 14required artifacts are completed. ARTIFACT_HASHES.json seals review and implementation bytes, excluding its own recursive hash. The final local commit retains a proposal only; it does not promote an approved baseline. Stop after contract review. The independent recommendation is retained; Project Owner decision remains pending.
