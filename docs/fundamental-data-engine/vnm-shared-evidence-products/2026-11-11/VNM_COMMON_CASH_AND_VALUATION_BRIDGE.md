# VNM — Common Cash and Valuation Bridge

Baseline `1d6c4de85af154b9960db734a614d0670e65dc35`; nghiên cứu11/11/2026. Chỉ B1–B6 của VNM. JSON/PDF retained được tái sử dụng; không tải lại FY22–25, không thay source/admission, không mở B7/B8. Exact facts/formulas/JSON Pointers/PDF pages/hashes trong [evidence-products.json](evidence-products.json). “Observed” là retained numerical observation, chưa được cấp formal admission; estimate và assumption ghi riêng.

## Observed parent cash and accounting reconciliation

Parent NPAT9.359350tn−fund accrued0.935935tn=common8.423415tn; remove disposal gain6.136384bn and finance credit47.683067bn→working8.369595tn. Tax incidence0/common incidence1 on those adjustments are adverse assumptions, not reported tax0. Finance credit recurrence, supplier support87bn, additional funds and cycle normalization still need review; no NCI/group tax applied to parent.

Tax liability: opening797.814507bn+current accrual2,092.162460bn−cash1,353.040370bn=closing1,536.936598bn exactly. P&L current tax2,128.415483bn differs from liability accrual by36.253023bn overseas remittance tax. Therefore P&L−cash775.375113bn is **not** a clean recurrence/next-year tax requirement; do not blindly subtract it every forecast year.

Fund accrued935.934964bn−used660.758742bn=increase275.176221bn. Other operating cash payments675.543695bn−fund use660.758742bn=residual14.784953bn; this is numerical proximity, not caption-based proof fund use is within that line. A fund-use/CFO mapping is still required before a second adjustment.

Historical cash capacity CFO+actual finance receipts−asset capex−subsidiary investment7.811320tn; after actual cash dividends−3.369941tn. Cash-flow replay including deposit/other CFI, debt and FX gives1.047629tn closing cash exactly. Do not add7.811tn to earnings or turn deposit runoff2.480tn into recurring income.

## Explicit working capital and funding overlap

Core trade NWC = trade receivables+net inventory−trade payables−customer advances: 4.471551tn FY24 → 5.435587tn FY25. FY25 NWC/revenue=10.2575%. This operational subset excludes tax/fund/accruals/prepayments; actual signed WC cash use1.414952tn cannot be replaced by balance-sheet delta without reconciliation.

Forecast options use growth-linked revenue/earnings (explicit constant-margin assumption), incremental capital=Δcommon earnings/15%RI including WC. Working-capital funding=Δsales×FY25 coreNWC/sales; non-WC growth capital=total incremental capital−WC funding. Thus WC is displayed but **not subtracted a second time**. Prior flat255.649bn two-year mean WC reserve is not charged as a permanent no-growth use. Model1 treats subsidiary deployment inside total incremental capital; Model2 repeats actual421.094bn as an additional strategic use, scaling with earnings. Neither overlap policy is proven; no project data yet allocates subsidiary investment to the parent growth numerator.

Maintenance sensitivity1.00/1.25×D&A; fully depreciated in-use parent PPE8.114tn means D&A is an accounting anchor, not an observed replacement budget. Signed capex395.805bn is not added mechanically on top of forecast maintenance/growth: first map contracts into those uses. Growth paths are retained Base2%,2%,1.5%,1%,1%, terminal1%, not a newly approved forecast. RI15%, discount15%, maintenance and strategic recurrence remain assumptions.

## Year-by-year parent cash — options, not approved Base

| Policy | Maintenance/DA | Year | Common earnings tn | WC funding tn | Non-WC growth capital tn | Additional subsidiary tn | Maintenance tn | Common cash tn |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| SUBSIDIARY_WITHIN_TOTAL_GROWTH_CAPITAL | 1 | 1 | 8.536987 | 0.108712 | 1.007234 | 0.000000 | 1.135605 | 7.421041 |
| SUBSIDIARY_WITHIN_TOTAL_GROWTH_CAPITAL | 1 | 2 | 8.707727 | 0.110886 | 1.027379 | 0.000000 | 1.158317 | 7.569462 |
| SUBSIDIARY_WITHIN_TOTAL_GROWTH_CAPITAL | 1 | 3 | 8.838343 | 0.084828 | 0.785945 | 0.000000 | 1.175692 | 7.967570 |
| SUBSIDIARY_WITHIN_TOTAL_GROWTH_CAPITAL | 1 | 4 | 8.926726 | 0.057400 | 0.531823 | 0.000000 | 1.187449 | 8.337503 |
| SUBSIDIARY_WITHIN_TOTAL_GROWTH_CAPITAL | 1 | 5 | 9.015993 | 0.057974 | 0.537141 | 0.000000 | 1.199324 | 8.420878 |
| SUBSIDIARY_WITHIN_TOTAL_GROWTH_CAPITAL | 1 | 6 terminal | 9.106153 | 0.058554 | 0.542512 | 0.000000 | 1.211317 | 8.505087 |
| SUBSIDIARY_WITHIN_TOTAL_GROWTH_CAPITAL | 1.25 | 1 | 8.536987 | 0.108712 | 1.007234 | 0.000000 | 1.419507 | 7.137140 |
| SUBSIDIARY_WITHIN_TOTAL_GROWTH_CAPITAL | 1.25 | 2 | 8.707727 | 0.110886 | 1.027379 | 0.000000 | 1.447897 | 7.279883 |
| SUBSIDIARY_WITHIN_TOTAL_GROWTH_CAPITAL | 1.25 | 3 | 8.838343 | 0.084828 | 0.785945 | 0.000000 | 1.469615 | 7.673647 |
| SUBSIDIARY_WITHIN_TOTAL_GROWTH_CAPITAL | 1.25 | 4 | 8.926726 | 0.057400 | 0.531823 | 0.000000 | 1.484311 | 8.040641 |
| SUBSIDIARY_WITHIN_TOTAL_GROWTH_CAPITAL | 1.25 | 5 | 9.015993 | 0.057974 | 0.537141 | 0.000000 | 1.499154 | 8.121048 |
| SUBSIDIARY_WITHIN_TOTAL_GROWTH_CAPITAL | 1.25 | 6 terminal | 9.106153 | 0.058554 | 0.542512 | 0.000000 | 1.514146 | 8.202258 |
| SUBSIDIARY_ADDITIONAL_REPEAT_USE | 1 | 1 | 8.536987 | 0.108712 | 1.007234 | 0.429516 | 1.135605 | 6.991525 |
| SUBSIDIARY_ADDITIONAL_REPEAT_USE | 1 | 2 | 8.707727 | 0.110886 | 1.027379 | 0.438106 | 1.158317 | 7.131355 |
| SUBSIDIARY_ADDITIONAL_REPEAT_USE | 1 | 3 | 8.838343 | 0.084828 | 0.785945 | 0.444678 | 1.175692 | 7.522892 |
| SUBSIDIARY_ADDITIONAL_REPEAT_USE | 1 | 4 | 8.926726 | 0.057400 | 0.531823 | 0.449125 | 1.187449 | 7.888379 |
| SUBSIDIARY_ADDITIONAL_REPEAT_USE | 1 | 5 | 9.015993 | 0.057974 | 0.537141 | 0.453616 | 1.199324 | 7.967262 |
| SUBSIDIARY_ADDITIONAL_REPEAT_USE | 1 | 6 terminal | 9.106153 | 0.058554 | 0.542512 | 0.458152 | 1.211317 | 8.046935 |
| SUBSIDIARY_ADDITIONAL_REPEAT_USE | 1.25 | 1 | 8.536987 | 0.108712 | 1.007234 | 0.429516 | 1.419507 | 6.707624 |
| SUBSIDIARY_ADDITIONAL_REPEAT_USE | 1.25 | 2 | 8.707727 | 0.110886 | 1.027379 | 0.438106 | 1.447897 | 6.841776 |
| SUBSIDIARY_ADDITIONAL_REPEAT_USE | 1.25 | 3 | 8.838343 | 0.084828 | 0.785945 | 0.444678 | 1.469615 | 7.228969 |
| SUBSIDIARY_ADDITIONAL_REPEAT_USE | 1.25 | 4 | 8.926726 | 0.057400 | 0.531823 | 0.449125 | 1.484311 | 7.591516 |
| SUBSIDIARY_ADDITIONAL_REPEAT_USE | 1.25 | 5 | 9.015993 | 0.057974 | 0.537141 | 0.453616 | 1.499154 | 7.667431 |
| SUBSIDIARY_ADDITIONAL_REPEAT_USE | 1.25 | 6 terminal | 9.106153 | 0.058554 | 0.542512 | 0.458152 | 1.514146 | 7.744106 |

Year6 recomputes terminal earnings, WC, growth and strategic funding; TV5=CF6/(15%−1%). This is a perpetuity recurrence assumption. No maintain+growth cash item includes cash dividends; cash distribution policy is a separate use of common cash. Conditional dividend capacity is not declared DPS; if cash retained, model retained assets and returns at exit rather than distribute and add again.

| Funding policy | Maintenance/DA | Conditional value VND/share |
|---|---|---:|
| SUBSIDIARY_WITHIN_TOTAL_GROWTH_CAPITAL | 1 | 27,069 |
| SUBSIDIARY_WITHIN_TOTAL_GROWTH_CAPITAL | 1.25 | 26,086 |
| SUBSIDIARY_ADDITIONAL_REPEAT_USE | 1 | 25,583 |
| SUBSIDIARY_ADDITIONAL_REPEAT_USE | 1.25 | 24,600 |

These24.600–27.069k values isolate funding/maintenance choices at the same Base growth/rates. They do not replace prior Bear/Base/Bull with accepted values. Prior challenged Bear/Base/Bull choices remain19.338/24.680/33.858k under their different reserve/earnings/rate policies; comparison is not an intrinsic confidence interval. No new price/current-quote fetch.

Independent-method crosscheck remains historical parent cash capacity7.811320tn, capitalization at15%=24,917conditional VND/share. It uses actual cash/WC/capex rather than the DCF profit path, but same issuer source and unproven recurrence, so it is not independent external/peer approval. Adverse fund/tax reserves are optional sensitivities, not demonstrated recurring charges.

## VD2–VD5 prepared decisions

- **VD2:** choose earnings bridge/finance-credit/supplier recurrence and adjustment tax treatment; retain funds deducted once. Need contract/disposal/recurrence evidence first.
- **VD3:** choose economic maintenance anchor, WC definition and subsidiary overlap/recurrence only after mapping project uses to forecast numerator and contracts. CoreNWC is not complete operatingWC.
- **VD4:** choose funded volume/margin/growth/RI/discount/terminal. Required return is not measured WACC; no narrow range assumed.
- **VD5:** choose distribute/retain, terminal realization, dilution and central expected case/probabilities with evidence. Expected return remains null, cash-flow scenarios do not imply a recommendation.

All approvals null. Until these source/model choices and B6 price/actions are resolved, no VAL points. Until B2 surplus commitments and opportunity costs are known, no CA-DIST binary point. No B7/B8 work is authorized by this package.
