# Deterministic hypothetical sensitivities

**RESEARCH_ONLY · HYPOTHETICAL · NOT_AN_APPROVED_INTRINSIC_VALUE · NOT_FOR_M3_M4_OR_PRODUCTION**

TCB only,2026-11-10. Historical FY2025accounting anchors plus configurable illustrative assumptions. No market price, formal intrinsic value, M3/M4or production purpose.

All five tables are exported in `sensitivity-results.json`. Cells are mathematical illustrations, not recommendations or empirical forecasts. `!`flags near-zero ke−g or extreme P/B; INVALIDcells have null model values. The price/PBsurfaces do not certify capital.

## ROEversus ke — P/B

Hold BASEg4.2%fixed and derive payout=1−g/ROEfor every cell.

| roe \ ke |10.00%|12.00%|13.00%|16.00%|20.00%|
|---|---:|---:|---:|---:|---:|
|6.00%|0.31|0.23|0.20|0.15|0.11|
|8.00%|0.66|0.49|0.43|0.32|0.24|
|14.00%|1.69|1.26|1.11|0.83|0.62|
|20.00%|2.72|2.03|1.80|1.34|1.00|
|25.00%|3.59|2.67|2.36|1.76|1.32|

## Growth versus ke — P/B

Hold BASE_ROE14%fixed and derive payout.

| growthInput \ ke |10.00%|12.00%|13.00%|16.00%|20.00%|
|---|---:|---:|---:|---:|---:|
|0.00%|1.40|1.17|1.08|0.88|0.70|
|2.00%|1.50|1.20|1.09|0.86|0.67|
|4.20%|1.69|1.26|1.11|0.83|0.62|
|6.00%|2.00|1.33|1.14|0.80|0.57|
|10.00%|INVALID|2.00|1.33|0.67|0.40|
|12.95%|INVALID|INVALID|21.00 !|0.34|0.15|

## Payout versus ROE — P/B

Hold BASE_ke13%fixed and derive g=ROE×(1−payout).

| payoutInput \ roe |6.00%|8.00%|14.00%|20.00%|25.00%|
|---|---:|---:|---:|---:|---:|
|25.00%|0.18|0.29|1.40|INVALID|INVALID|
|50.00%|0.30|0.44|1.17|3.33|25.00 !|
|70.00%|0.38|0.53|1.11|2.00|3.18|
|75.00%|0.39|0.55|1.11|1.88|2.78|
|90.00%|0.44|0.59|1.09|1.64|2.14|

## Credit cost versus hypothetical common earnings

Hold BASEreconciled pre-stress economics/funding fixed and change the credit expense once.

| Hypothetical credit rate | Hypothetical common earnings,trillion VND | Status |
|---:|---:|---|
|0.67%|24.387770|HYPOTHETICAL_ONLY|
|0.79%|23.806231|HYPOTHETICAL_ONLY|
|0.92%|23.198059|HYPOTHETICAL_ONLY|
|2.00%|18.037124|HYPOTHETICAL_ONLY|
|6.00%|-1.108700|HYPOTHETICAL_COMMON_LOSS|

## Regulatory target versus RWAgrowth

Hold BASEmanagement buffer2%and common-accounting-book floor10%fixed; each cell shows combined capital status and year5CAR. Target is added to buffer. UNPROVENmeans the horizon may pass but the simple terminal feasibility proof does not apply.

| hypotheticalRegulatoryTarget \ hypotheticalRwaGrowth |0.00%|2.00%|4.20%|6.00%|10.00%|18.00%|
|---|---:|---:|---:|---:|---:|---:|
|10.00%|UNPROVEN; 17.18%|UNPROVEN; 15.56%|HYP-PASS; 13.99%|INFEASIBLE; 12.84%|INFEASIBLE; 10.67%|INFEASIBLE; 7.51%|
|12.00%|UNPROVEN; 17.18%|UNPROVEN; 15.56%|INFEASIBLE; 13.99%|INFEASIBLE; 12.84%|INFEASIBLE; 10.67%|INFEASIBLE; 7.51%|
|14.00%|INFEASIBLE; 17.18%|INFEASIBLE; 15.56%|INFEASIBLE; 13.99%|INFEASIBLE; 12.84%|INFEASIBLE; 10.67%|INFEASIBLE; 7.51%|
|16.00%|INFEASIBLE; 17.18%|INFEASIBLE; 15.56%|INFEASIBLE; 13.99%|INFEASIBLE; 12.84%|INFEASIBLE; 10.67%|INFEASIBLE; 7.51%|

Dependence on ke−g: P/Bis inversely proportional to that denominator at fixed ROE/g. Derivatives are dPB/dke=−(ROE−g)/(ke−g)^2;dPB/dROE=1/(ke−g)at fixedg;dPB/dg=(ROE−ke)/(ke−g)^2. Growth and payout are therefore not independently changed here. A0.5percentage-point denominator threshold and P/B>=5are illustrative warnings, not approved investment-policy limits. ke<=gorROE<=gis rejected. No unstable/high value is presented as an investable conclusion.
