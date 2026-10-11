# Proposed debt metric amendment

Status: PROPOSED_UNAPPROVED. Approval reference/effective date: null. Activation: false.

Recommend explicit taxonomy and measurement correction for non-financial M3 inputs. No existing approved M3 document, registry, requirement, derived formula, scorer or gate is edited by this review.

## Exact proposed requirement change

For REAL_ESTATE, RETAIL, TECHNOLOGY, INDUSTRIAL, MATERIALS, UTILITIES, ENERGY and CONGLOMERATE only, replace this group **in a later Owner-approved version**, not the current baseline:

```yaml
# Current baseline, unchanged in this review
id: debt
anyOf: [FINANCIAL_DEBT]
component: FINANCIAL_HEALTH
```

with:

```yaml
# PROPOSED_UNAPPROVED
id: debt
anyOf: [COMPREHENSIVE_FINANCIAL_DEBT, REPORTED_BORROWINGS]
component: FINANCIAL_HEALTH
preference: [COMPREHENSIVE_FINANCIAL_DEBT, REPORTED_BORROWINGS]
```

A preferred comprehensive observation must have exhaustive verification and the same ticker, consolidated scope, stock date, currency, measurement basis and lease policy as the reported alternative/ratio context. It must reconcile with the reported subset. Otherwise verified reported population may satisfy the proposed quantitative group. A group alternative is not a silent alias, automatic scoring permission or permission to omit known financing.

## Reported population

REPORTED_BORROWINGS is the verified issuer-reported short and non-current borrowing population, counting current long portions once, plus every separately identified qualifying bond, finance lease, sector-applicable lease adjustment and other interest-bearing financing amount not already included. Survey the relevant liability captions and financing disclosures; a known financing amount that is unverified, unquantified or omitted blocks the reported metric. Prove overlap before treating an identified item as embedded. Handle applicability through an explicit sector lease policy, not arbitrary exclusions.

Exclude ordinary trade/customer/tax/wage/accrual/provision/dividend/deferred-revenue liabilities. Do not add unidentified miscellaneous liabilities automatically. Retain their amounts and unknown financing status visibly; their exclusion from the reported quantity is not proof of non-interest-bearing status or a zero debt exposure. Reported completeness means complete *reported and identified* population, not exhaustive financing assurance.

## Exhaustive population and measurement

COMPREHENSIVE_FINANCIAL_DEBT remains the stricter exhaustive financing population. All relevant financing classes must be verified or explicitly proven absent; unclassified material financing population prevents comprehensive admission. The proposed metric requires an explicitly approved versioned measurement basis. Principal and carrying amount are different bases. No automatic equivalence or cross-basis preference is permitted.

For normal M3 balance-sheet ratios, recommend issuer-reported carrying-amount basis with visible labels and consistent sector/period normalization. If verified principal is used, document the principal-to-carrying bridge and use the same basis in comparisons. Current HPG quantities are reported carrying amounts; no gross-face principal equality has been proven. Standalone accrued interest is excluded from principal-only debt; carrying amounts may contain amortized costs and must retain that accounting basis rather than being called principal.

Legacy FINANCIAL_DEBT remains the current strict contract until an explicit versioned migration. REPORTED_BORROWINGS is never mapped to it by renaming. Existing approved exhaustive/principal semantics and historical evidence remain intact. The generic registry/crosswalk are themselves PROPOSED and do not currently contain FINANCIAL_DEBT/NET_DEBT: update all relevant pathways deliberately after approval rather than assuming an existing registry route.

## Uncertainty and M3 qualifications

Retain reportedPopulationStatus=REPORTED_COMPLETE/REPORTED_PLUS_IDENTIFIED_ADDITIONS separately from comprehensivePopulationStatus=COMPREHENSIVE_VERIFIED/COMPREHENSIVE_UNVERIFIED. Preserve each opaque component with evidence and amount (null when unquantified), aggregate known amounts without overlap, and store an exact amount/borrowings fraction where quantifiable. The fraction is not a bound on hidden debt. materialityAssessment remains UNASSESSED_NO_APPROVED_THRESHOLD pending case-specific risk review; this proposal invents no universal cutoff.

Do not allow an unresolved exposure material to balance-sheet safety to become innocuous through a metric label. Metric quantity availability does not establish M3/Financial Health scorable. Existing LOW-confidence/material-unreliability/liquidity/covenant rules still apply. A reviewer must assess uncertainties using existing Risk Policy and analytical context; no HPG materiality clearance is granted here.

Net Debt requires unrestricted economically available cash. Net Debt/EBITDA requires normalized/downside EBITDA and consistent leases. Interest coverage retains its EBIT/interest-expense definition. Create basis-aware derived identities/metadata and a deliberate calculator bridge; do not blindly subtract generic cash or reuse legacy FINANCIAL_DEBT. Same-series measurement/population/lease changes require explicit comparability normalization. Debt/equity is sector-limited, not universal, and is never substituted for bank capital adequacy.

BANK, SECURITIES and INSURANCE contracts are excluded from this amendment. Their existing required/sector-core definitions, calculations and gates remain unchanged. Other non-financial funding, presales, liquidity, covenants and commitment risks remain separately assessed.

## HPG scenario and activation gates

Retained verified reported quantities would supply five proposed reported groups:57,900,321,604,873;65,381,002,473,117;82,963,129,469,555;92,174,151,302,217;98,529,977,232,553 VND for FY2022,FY2023,FY2024,FY2025,6M2026. Under the explicit group-change assumption, CORE quantity coverage would be35/35. Approved CORE remains30/35 and current trajectory/overall remain INSUFFICIENT. Comprehensive debt remains null for all five periods. Source bond/lease UNKNOWN statuses are retained, not rewritten as VERIFIED_ABSENT. HPG receives no approval and no scoring readiness from this scenario.

Before activation require: independent semantic review; explicit Project Owner approval/reference/effective version; canonical metric/requirement/measurement/lease/crosswalk migration; basis-aware net debt/cash/EBITDA bridge; known-financing/uncertainty validation; relevant regression/sector tests; and separate data/scoring governance evaluation. This review provides the proposal and tests only. DI14/DI15 are not approved, readyForScoring remains false, and no ranking/scoring/Top10/DCA or next ticker closure is run.
