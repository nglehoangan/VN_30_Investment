# Illustrative hypothetical assumptions

**RESEARCH_ONLY · HYPOTHETICAL · NOT_AN_APPROVED_INTRINSIC_VALUE · NOT_FOR_M3_M4_OR_PRODUCTION**

TCB only,2026-11-10. Historical FY2025accounting anchors plus configurable illustrative assumptions. No market price, formal intrinsic value, M3/M4or production purpose.

Edit `scenario-inputs.json`; all numeric values are lossless decimal strings. Every scenario parameter and sensitivity/control item carries value, unit, HYPOTHETICAL_ASSUMPTIONclassification, rationale, evidence status, owner approval status, sensitivity range and applicable scenario. The displayed ranges are illustrative exploration intervals, not confidence intervals or qualified bounds.

## BEAR

| Input | Value | Unit | Rationale |
|---|---:|---|---|
|roe|0.08|ANNUAL_RATIO|Illustrative all-in common ROEafter credit/funding effects, not a calibrated sustainable forecast.|
|ke|0.16|ANNUAL_RATIO|Independent illustrative nominal VNDdiscount assumption; no selected risk-free/ERP/beta and not the15%policy hurdle.|
|growth|0.02|ANNUAL_RATIO|Hypothetical common-book retention growth, must equal ROE*(1-payout).|
|payout|0.75|RATIO|Hypothetical common distribution fraction, not a qualified cash-dividend policy.|
|forwardCreditCost|0.009217628484|ANNUAL_RATIO|Reuse historical credit anchor as an explicitly hypothetical forward sensitivity, not expected loss or tail bound.|
|fundingSpreadShock|0.02|ANNUAL_RATIO|Hypothetical incremental annual spread on the selected closing issued-instrument pocket, not total bank funding cost.|
|taxRate|0.20|RATIO|Illustrative marginal stress tax treatment; not empirical deductibility of each adjustment.|
|commonIncidence|0.90|RATIO|Illustrative90%common-owner stress incidence, not actual NCIattribution.|
|regulatoryTarget|0.12|RATIO|Hypothetical regulatory requirement, not the historical8%floor or a legal conclusion.|
|managementBuffer|0.02|RATIO|Hypothetical buffer added to target, not an issuer management commitment.|
|rwaGrowth|0.18|ANNUAL_RATIO|Hypothetical annual RWApath independent of book growth; capital feasibility explicitly checked.|
|eligibleRetentionFraction|0.60|RATIO|Hypothetical conversion of retained common earnings to eligible regulatory capital.|
|capitalDeductions|20000000000000|VND|One-time year1non-P&L prudential deduction, not credit/funding expense deducted twice.|
|capitalLosses|0|VND|Zero additional capital loss: all P&Lcredit/funding effects already included in ROE; nonzero requires a new explicit bridge.|
|terminalRoe|0.08|ANNUAL_RATIO|Constant-state terminal equality restriction, not independently qualified terminal forecast.|
|terminalGrowth|0.02|ANNUAL_RATIO|Constant-state terminal growth must match initial growth.|
|terminalKe|0.16|ANNUAL_RATIO|Constant-state terminal ke must match initial ke.|
|transitionHorizon|5|YEARS_INTEGER|Five-year explicit RI/capital verification horizon; constant-state model value is horizon-invariant.|
|newShares|0|SHARES|Conditional no-new-issuance restriction; not a prediction.|
|netNewCommonCash|0|VND|Conditional no-new-common-cash restriction; not a prediction.|
|commonBookRwaTarget|0.10|RATIO|Illustrative common accounting book/RWAfloor; not CET1or TCEor an approved legal capital minimum.|
## BASE

| Input | Value | Unit | Rationale |
|---|---:|---|---|
|roe|0.14|ANNUAL_RATIO|Illustrative all-in common ROEafter credit/funding effects, not a calibrated sustainable forecast.|
|ke|0.13|ANNUAL_RATIO|Independent illustrative nominal VNDdiscount assumption; no selected risk-free/ERP/beta and not the15%policy hurdle.|
|growth|0.042|ANNUAL_RATIO|Hypothetical common-book retention growth, must equal ROE*(1-payout).|
|payout|0.70|RATIO|Hypothetical common distribution fraction, not a qualified cash-dividend policy.|
|forwardCreditCost|0.007947018458|ANNUAL_RATIO|Reuse historical credit anchor as an explicitly hypothetical forward sensitivity, not expected loss or tail bound.|
|fundingSpreadShock|0.005|ANNUAL_RATIO|Hypothetical incremental annual spread on the selected closing issued-instrument pocket, not total bank funding cost.|
|taxRate|0.20|RATIO|Illustrative marginal stress tax treatment; not empirical deductibility of each adjustment.|
|commonIncidence|0.90|RATIO|Illustrative90%common-owner stress incidence, not actual NCIattribution.|
|regulatoryTarget|0.10|RATIO|Hypothetical regulatory requirement, not the historical8%floor or a legal conclusion.|
|managementBuffer|0.02|RATIO|Hypothetical buffer added to target, not an issuer management commitment.|
|rwaGrowth|0.042|ANNUAL_RATIO|Hypothetical annual RWApath independent of book growth; capital feasibility explicitly checked.|
|eligibleRetentionFraction|0.90|RATIO|Hypothetical conversion of retained common earnings to eligible regulatory capital.|
|capitalDeductions|3000000000000|VND|One-time year1non-P&L prudential deduction, not credit/funding expense deducted twice.|
|capitalLosses|0|VND|Zero additional capital loss: all P&Lcredit/funding effects already included in ROE; nonzero requires a new explicit bridge.|
|terminalRoe|0.14|ANNUAL_RATIO|Constant-state terminal equality restriction, not independently qualified terminal forecast.|
|terminalGrowth|0.042|ANNUAL_RATIO|Constant-state terminal growth must match initial growth.|
|terminalKe|0.13|ANNUAL_RATIO|Constant-state terminal ke must match initial ke.|
|transitionHorizon|5|YEARS_INTEGER|Five-year explicit RI/capital verification horizon; constant-state model value is horizon-invariant.|
|newShares|0|SHARES|Conditional no-new-issuance restriction; not a prediction.|
|netNewCommonCash|0|VND|Conditional no-new-common-cash restriction; not a prediction.|
|commonBookRwaTarget|0.10|RATIO|Illustrative common accounting book/RWAfloor; not CET1or TCEor an approved legal capital minimum.|
## BULL

| Input | Value | Unit | Rationale |
|---|---:|---|---|
|roe|0.20|ANNUAL_RATIO|Illustrative all-in common ROEafter credit/funding effects, not a calibrated sustainable forecast.|
|ke|0.11|ANNUAL_RATIO|Independent illustrative nominal VNDdiscount assumption; no selected risk-free/ERP/beta and not the15%policy hurdle.|
|growth|0.06|ANNUAL_RATIO|Hypothetical common-book retention growth, must equal ROE*(1-payout).|
|payout|0.70|RATIO|Hypothetical common distribution fraction, not a qualified cash-dividend policy.|
|forwardCreditCost|0.006732050583|ANNUAL_RATIO|Reuse historical credit anchor as an explicitly hypothetical forward sensitivity, not expected loss or tail bound.|
|fundingSpreadShock|0|ANNUAL_RATIO|Hypothetical incremental annual spread on the selected closing issued-instrument pocket, not total bank funding cost.|
|taxRate|0.20|RATIO|Illustrative marginal stress tax treatment; not empirical deductibility of each adjustment.|
|commonIncidence|0.90|RATIO|Illustrative90%common-owner stress incidence, not actual NCIattribution.|
|regulatoryTarget|0.10|RATIO|Hypothetical regulatory requirement, not the historical8%floor or a legal conclusion.|
|managementBuffer|0.02|RATIO|Hypothetical buffer added to target, not an issuer management commitment.|
|rwaGrowth|0.06|ANNUAL_RATIO|Hypothetical annual RWApath independent of book growth; capital feasibility explicitly checked.|
|eligibleRetentionFraction|0.95|RATIO|Hypothetical conversion of retained common earnings to eligible regulatory capital.|
|capitalDeductions|1000000000000|VND|One-time year1non-P&L prudential deduction, not credit/funding expense deducted twice.|
|capitalLosses|0|VND|Zero additional capital loss: all P&Lcredit/funding effects already included in ROE; nonzero requires a new explicit bridge.|
|terminalRoe|0.20|ANNUAL_RATIO|Constant-state terminal equality restriction, not independently qualified terminal forecast.|
|terminalGrowth|0.06|ANNUAL_RATIO|Constant-state terminal growth must match initial growth.|
|terminalKe|0.11|ANNUAL_RATIO|Constant-state terminal ke must match initial ke.|
|transitionHorizon|5|YEARS_INTEGER|Five-year explicit RI/capital verification horizon; constant-state model value is horizon-invariant.|
|newShares|0|SHARES|Conditional no-new-issuance restriction; not a prediction.|
|netNewCommonCash|0|VND|Conditional no-new-common-cash restriction; not a prediction.|
|commonBookRwaTarget|0.10|RATIO|Illustrative common accounting book/RWAfloor; not CET1or TCEor an approved legal capital minimum.|

ROEis the hypothetical all-in common return after the separate credit/funding stress effects. ke16%/13%/11%are arbitrary illustrative discount assumptions, independent of the15%investment-return policy target and12%exceptional floor; no ERP/risk-free/beta calibration is claimed. Tax20%and common incidence90%are explicitly hypothetical adjustment assumptions, not conclusions about deductibility or NCI.

Historical credit anchors are observed/conditionally approved sensitivity references only. Reusing their numerical values for forwardCreditCost does not convert them into expected-loss forecasts. Closing issued-instrument balance is a selected historical funding-pocket proxy; applying a spread to it is a model sensitivity, not an actual average funding-cost measurement.

Terminal ROE/g/ke equal initial values in this deliberately constant-state model. transitionHorizon5provides explicit RI/capital checks; it does not create a different terminal regime. Editing terminal values inconsistently is rejected. Zero shares/cash are conditional modelling restrictions, not predictions. Eligible retention, RWApath, regulatory/common targets and prudential deductions are all hypothetical. Accounting common-book/RWAfloor is not CET1/TCEor a legal capital rule.
