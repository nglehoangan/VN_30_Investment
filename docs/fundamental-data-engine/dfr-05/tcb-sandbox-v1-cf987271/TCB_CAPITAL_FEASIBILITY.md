# Hypothetical capital feasibility

**RESEARCH_ONLY · HYPOTHETICAL · NOT_AN_APPROVED_INTRINSIC_VALUE · NOT_FOR_M3_M4_OR_PRODUCTION**

TCB only,2026-11-10. Historical FY2025accounting anchors plus configurable illustrative assumptions. No market price, formal intrinsic value, M3/M4or production purpose.

Starting regulatory capital181,870,000,000,000VNDand RWA1,244,531,000,000,000VNDare historical regulatory-consolidated anchors. Neither is ordinary accounting book, and Tier1is not CET1. Historical minimum8%is not automatically selected: scenario targets/buffers are hypothetical.

Each year, common earnings=ROE×opening book; retention=earnings×(1−payout); eligible capital increment=retention×hypothetical eligible fraction. Common book grows by g; RWAby its separate hypothetical growth. Capital loses a one-time year1non-P&Lprudential deduction. Additional P&Lcapital losses are zero because credit/funding stress is already inside ROE. Require both regulatory capital/RWA>=target+buffer and common accounting book/RWA>=the illustrative common-book floor. No common-book ratio is labelled CET1/TCE.

## BEAR — CAPITAL_INFEASIBLE

Target+buffer=14.00%; common-book/RWAfloor=10.00%. Failing years=[1, 2, 3, 4, 5]; terminal test=CAPITAL_INFEASIBLE; hypothetical limiting regulatory CAR=0.00%.

| Year | Common book,trillion VND | Eligible retention,trillion VND | Deduction,trillion VND | Regcapital,trillion VND | RWA,trillion VND | RegCAR | Commonbook/RWA | Status |
|---|---:|---:|---:|---:|---:|---:|---:|---|
|1|173.4454|2.0405|20.0000|163.9105|1,468.5466|11.16%|11.81%|CAPITAL_INFEASIBLE|
|2|176.9143|2.0813|0.0000|165.9919|1,732.8850|9.58%|10.21%|CAPITAL_INFEASIBLE|
|3|180.4526|2.1230|0.0000|168.1149|2,044.8043|8.22%|8.82%|CAPITAL_INFEASIBLE|
|4|184.0616|2.1654|0.0000|170.2803|2,412.8690|7.06%|7.63%|CAPITAL_INFEASIBLE|
|5|187.7429|2.2087|0.0000|172.4890|2,847.1854|6.06%|6.59%|CAPITAL_INFEASIBLE|

## BASE — HYPOTHETICALLY_CAPITAL_FEASIBLE

Target+buffer=12.00%; common-book/RWAfloor=10.00%. Failing years=[]; terminal test=HYPOTHETICAL_CONSTANT_STATE_LIMIT_PASS; hypothetical limiting regulatory CAR=12.30%.

| Year | Common book,trillion VND | Eligible retention,trillion VND | Deduction,trillion VND | Regcapital,trillion VND | RWA,trillion VND | RegCAR | Commonbook/RWA | Status |
|---|---:|---:|---:|---:|---:|---:|---:|---|
|1|177.1864|6.4277|3.0000|185.2977|1,296.8013|14.29%|13.66%|HYPOTHETICAL_HORIZON_CAPITAL_PASS|
|2|184.6282|6.6976|0.0000|191.9953|1,351.2670|14.21%|13.66%|HYPOTHETICAL_HORIZON_CAPITAL_PASS|
|3|192.3826|6.9789|0.0000|198.9743|1,408.0202|14.13%|13.66%|HYPOTHETICAL_HORIZON_CAPITAL_PASS|
|4|200.4627|7.2721|0.0000|206.2463|1,467.1570|14.06%|13.66%|HYPOTHETICAL_HORIZON_CAPITAL_PASS|
|5|208.8821|7.5775|0.0000|213.8238|1,528.7776|13.99%|13.66%|HYPOTHETICAL_HORIZON_CAPITAL_PASS|

## BULL — HYPOTHETICALLY_CAPITAL_FEASIBLE

Target+buffer=12.00%; common-book/RWAfloor=10.00%. Failing years=[]; terminal test=HYPOTHETICAL_CONSTANT_STATE_LIMIT_PASS; hypothetical limiting regulatory CAR=12.98%.

| Year | Common book,trillion VND | Eligible retention,trillion VND | Deduction,trillion VND | Regcapital,trillion VND | RWA,trillion VND | RegCAR | Commonbook/RWA | Status |
|---|---:|---:|---:|---:|---:|---:|---:|---|
|1|180.2472|9.6925|1.0000|190.5625|1,319.2029|14.45%|13.66%|HYPOTHETICAL_HORIZON_CAPITAL_PASS|
|2|191.0620|10.2741|0.0000|200.8366|1,398.3550|14.36%|13.66%|HYPOTHETICAL_HORIZON_CAPITAL_PASS|
|3|202.5257|10.8905|0.0000|211.7272|1,482.2563|14.28%|13.66%|HYPOTHETICAL_HORIZON_CAPITAL_PASS|
|4|214.6773|11.5440|0.0000|223.2711|1,571.1917|14.21%|13.66%|HYPOTHETICAL_HORIZON_CAPITAL_PASS|
|5|227.5579|12.2366|0.0000|235.5077|1,665.4632|14.14%|13.66%|HYPOTHETICAL_HORIZON_CAPITAL_PASS|

For positive constant gBook=gRWAwith the one-time deduction, limiting regulatory CAR=eligibleFraction×B0/RWA0; common-book/RWAratio is constant. Checking initial/explicit-year ratios and this limit verifies the stated constant-state restriction. If RWAgrowth exceeds book growth, long-run capital/RWAtends to zero under these assumptions and is flagged infeasible even if a finite horizon passes. Other unmatched growth cases remain terminal-unproven. No liquidity, actual prudential eligibility, management buffer, stress loss calibration or issuer behavior is empirically certified.
