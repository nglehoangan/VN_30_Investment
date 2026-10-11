# Approved non-financial debt metric contract v2

This is the explicit Project Owner-approved amendment reviewed at commit `257a55dab28e510a8349c6e0d89c5d7c4c555c30`. The exact approval reference, recorded/effective instants and scope are retained in `src/domain/fundamentals/debt-contract-v2.json` and the activation evidence OWNER_APPROVAL.json. Original M3 documents and the v1 registry/crosswalk/requirements remain immutable version baselines; this document supersedes only their applicable non-financial debt input semantics from the recorded effective instant.

## Metric definitions and measurement

REPORTED_BORROWINGS is the verified consolidated issuer-reported borrowing population plus all separately identified applicable financing. Short/current/non-current amounts are reconciled; current portions and embedded known bonds/leases/lenders are counted once. A known financing item cannot be omitted or assigned zero when unverified. Unnamed miscellaneous liabilities remain UNKNOWN with their amounts, source and materiality review status; they are not automatically added to reported debt.

COMPREHENSIVE_FINANCIAL_DEBT remains the exhaustive financing population and needs separate exhaustive evidence. A separately retained comprehensive proof must bind the exact quantity, source hashes, dimensions, measurement and lease policy, review time, and non-overlapping verified borrowing/bond/finance-lease/other-financing/sector-lease populations; a reported review or Owner approval path cannot substitute. It is never an alias of reported borrowing. Legacy FINANCIAL_DEBT retains its strict historical semantics and is not renamed. Default basis is ISSUER_REPORTED_CARRYING_AMOUNT, scope CONSOLIDATED, currency VND. Principal is a different measurement and cannot switch silently into the default contract.

## Requirement and sector amendment

For REAL_ESTATE, RETAIL, TECHNOLOGY, INDUSTRIAL, MATERIALS, UTILITIES, ENERGY and CONGLOMERATE, CORE id=debt becomes anyOf:[COMPREHENSIVE_FINANCIAL_DEBT,REPORTED_BORROWINGS], preferring compatible verified comprehensive. Matching ticker/stock date/scope/currency/measurement/lease policy is mandatory. A comprehensive value below the compatible reported subset requires reconciliation. Incompatible series cannot be spliced. BANK, SECURITIES and INSURANCE definitions and groups are unchanged.

## Basis-aware M3 dependencies and scorecard inputs

M3 Financial Health debt stock inputs carry contract version, selected metric, population status, source/evidence, uncertainty, measurement and lease policy. NET_DEBT uses selected compatible debt minus explicitly qualified unrestricted economically available cash. Generic CASH_AND_EQUIVALENTS never automatically qualifies. Missing cash qualification leaves NET_DEBT unavailable.

Net Debt/EBITDA needs verified normalized/downside EBITDA and matching debt/EBITDA lease policy. No annualization or normalized EBITDA is invented. The default issuer-recognized finance-lease policy does not itself qualify sector-normalized EBITDA. Existing leverage score anchors, category weights and risk thresholds remain unchanged.

## Availability and governance

Unknown component amounts and exact amount/borrowings fractions stay visible; unquantified amounts remain null. The fraction is not a bound on hidden debt. No universal materiality threshold is established. Unassessed/material safety uncertainty blocks decision-grade confidence/readiness separately from quantitative group coverage. Supporting definitions, current data, cash and earnings eligibility, PIT and governance remain separate.

The approval activates only this debt contract and implementation. It grants no HPG closure, DI14/DI15, scoring, ranking, Top10, DCA or investment decision. readyForScoring remains false pending separate review. Old analyses/knownAt cutoffs before the effective instant use the exact v1 requirements and legacy derivation behavior; historical evidence is preserved.
