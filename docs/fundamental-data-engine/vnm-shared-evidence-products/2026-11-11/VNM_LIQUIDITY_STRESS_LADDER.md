# VNM — Liquidity and Stress Funding Ladder

Baseline `1d6c4de85af154b9960db734a614d0670e65dc35`; nghiên cứu11/11/2026. Chỉ B1–B6 của VNM. JSON/PDF retained được tái sử dụng; không tải lại FY22–25, không thay source/admission, không mở B7/B8. Exact facts/formulas/JSON Pointers/PDF pages/hashes trong [evidence-products.json](evidence-products.json). “Observed” là retained numerical observation, chưa được cấp formal admission; estimate và assumption ghi riêng.

As-of31Dec2025, retrospective disclosure basis; không phải matched current30Oct2026 liquidity. Không invent monthly maturities từ tenor1–12months. On-demand book cash cũng chưa được chứng nhận transferability; available-for-stress amount giữ null.

| Legal entity | Item | Amount tnVND | Disclosed bucket | Restrictions/date gap |
|---|---|---:|---|---|
| VNM_PARENT | Cash | 1.047629 | ON_BALANCE_AT_ASOF | UNKNOWN; exact dates null |
| VNM_PARENT | Short term deposits | 16.380000 | CLASSIFIED_CURRENT_EXACT_MATURITY_UNKNOWN | UNKNOWN; exact dates null |
| VNM_PARENT | Long term deposits | 0.300000 | NONCURRENT_EXACT_MATURITY_UNKNOWN | UNKNOWN; exact dates null |
| VNM_PARENT | Vietcombank unsecured loan | 4.591000 | CURRENT; ORIGINAL_TENOR_1_TO_12_MONTHS | COVENANTS_ACCELERATION_UNDISCLOSED; exact dates null |
| VNM_PARENT | Vietinbank unsecured loan | 1.250000 | CURRENT; ORIGINAL_TENOR_1_TO_12_MONTHS | COVENANTS_ACCELERATION_UNDISCLOSED; exact dates null |
| VNM_PARENT | Agribank Trung tam Sai Gon unsecured loan | 3.000000 | CURRENT; ORIGINAL_TENOR_1_TO_12_MONTHS | COVENANTS_ACCELERATION_UNDISCLOSED; exact dates null |
| VNM_PARENT | parentLease1y | 0.135807 | WITHIN_ONE_YEAR | CONTRACTUAL_USE; exact dates null |
| VNM_PARENT | parentLease2to5y | 0.537304 | YEARS_2_TO_5 | CONTRACTUAL_USE; exact dates null |
| VNM_PARENT | parentLeaseOver5y | 0.594575 | OVER_5_YEARS | CONTRACTUAL_USE; exact dates null |
| VNM_PARENT | parentSignedCapex25 | 0.395805 | SIGNED_CONTRACT_PAYMENT_DATES_UNKNOWN | CONTRACTUAL_USE; exact dates null |
| GROUP_NOT_PARENT | groupShortDeposits25 | 21.354424 | CURRENT_UNALLOCATED_BY_LEGAL_ENTITY | DO_NOT_TRANSFER_TO_PARENT_BY_ASSUMPTION; exact dates null |
| GROUP_NOT_PARENT | groupShortDebt25 | 9.393737 | CURRENT_UNALLOCATED_BY_LEGAL_ENTITY | DO_NOT_TRANSFER_TO_PARENT_BY_ASSUMPTION; exact dates null |
| GROUP_NOT_PARENT | groupCapitalCommitment25 | 2.828988 | SIGNED_UNALLOCATED_BY_LEGAL_ENTITY | DO_NOT_TRANSFER_TO_PARENT_BY_ASSUMPTION; exact dates null |
| GROUP_NOT_PARENT | groupNoncurrentLoan2027 | 0.010485 | DUE_2027 | DO_NOT_TRANSFER_TO_PARENT_BY_ASSUMPTION; exact dates null |
| GROUP_NOT_PARENT | groupNoncurrentLoan2030 | 0.052423 | DUE_2030 | DO_NOT_TRANSFER_TO_PARENT_BY_ASSUMPTION; exact dates null |

Parent bank sum4.591+1.250+3.000=8.841tn; do not add group debt9.456645tn. Parent short deposits16.380tn and long0.300tn are bank term deposits, not unrestricted cash. Group short21.354424tn includes other entities; no automatic parent access. Parent lease total1.267686tn reconciles buckets; group lease2.498467tn remains separate. Noncurrent group loans52.423bn2030/10.485bn2027 do not cover current-debt maturities; current reclassification is already in short debt. Future committed facilities or covenant headroom are not proved by unsecured debt or a board-approved credit-limit list.

Historical dividend paid11.181262tn is FY25 cash use, not another unpaid31Dec2025 obligation. Declaration/opening payable/cash bridge implies closing0, but PDF original dash is preserved. FY25 dividend minimum-plan percentage is not a quantified future amount; future unavoidable obligation=null pending record/payment terms. Parent current tax payable1.536937tn is in current liabilities; do not add it again in broad all-current-liability stress.

## Stress and matched funding thresholds

Assumptions: revenue−10%, gross margin−3pp, extra inventory cash lock20%; no tax shield, no fixed-cost cuts, unchanged other cash items. All signed capex accelerated into year1 is severe timing assumption, not disclosed maturity. Cash is assumed available **only to calculate threshold**; restrictions remain unknown.

| Scope | Shock CFO tn | Borrowing+1y leases+signed capex tn | Gap before deposits tn | Required current deposits available | Broad current-liability requirement |
|---|---:|---:|---:|---:|---:|
| PARENT | 2.969330 | 9.372611 | 5.355652 | 32.70% | 79.77% |
| GROUP | 2.960895 | 12.419882 | 7.664108 | 35.89% | prior group77.70% sensitivity |

Broad parent stress uses all current liabilities+signed capex, without adding lease separately, a bound rather than a claim every accrual settles at once. Book cash exclusion would increase required deposit availability by cash/deposits; zero actual availability is not inferred. Group and parent results do not get added.

Responses: suspend discretionary distributions/new capex where lawful; realize accessible deposits at evidenced dates; draw only contractually committed unused lines. No assumed blanket waiver, cancellation of signed projects, refinancing, emergency dilution or subsidiary upstreaming. Positive shocked CFO and book deposit balances support possible survival; absence of restrictions/covenants from notes is not proof of their absence.

**Smallest remaining source product:** one legal-entity bank/commitment schedule at the chosen financial as-of, recording deposit pledge/restriction/early-break terms and actual maturity, each debt due date/covenant/acceleration/committed-line availability, lease and signed capex payment dates, and irrevocable dividends. It can close FH-LIQ/FH-STRESS and support CA-DIST/IC-CYCLE/VAL-MOS; until supplied, no neutral band. Exact sources parent pp7–9,28,38–45; group pp7–9,36,47–48,54 in JSON.

## Parent borrowing/lease/capex waterfall sensitivity

| Cash usable assumption | Deposit usable assumption | Funding surplus/shortfall tnVND |
|---|---|---:|
| 0 | 0 | -6.403281 |
| 0 | 0.25 | -2.308281 |
| 0 | 0.50 | 1.786719 |
| 0 | 1 | 9.976719 |
| 1 | 0 | -5.355652 |
| 1 | 0.25 | -1.260652 |
| 1 | 0.50 | 2.834348 |
| 1 | 1 | 11.024348 |

These are assumptions across0–100%, not probability or verified cash-access estimates. They do not cover intra-year timing minima; exact instrument dates are still needed.
