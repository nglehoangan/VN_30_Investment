# VNM corporate action reconciliation

Exact-date skill run: **15 cash-dividend components, 11 ex-right dates, 11 retained PDFs reused**, no new PDF download by the skill. First run20/page returned1page; reruns10/page returned2pages with identical event objects. Existing broad-range manifest differs only in positional `Row` after filtering; stable EventID and financial fields agree. Normalized raw candidate dates/types/fields and all page raw bodies are in `/Users/nglehoangan/Documents/Working/VN_30_Investment/data/manual-download/VNM/events-2022-01-01_2026-10-30/manifest-20261111T145232645389Z.json`. No stock/bonus/rights/split/treasury action was returned; this is not a no-actions certificate.

All13 physical pages of the11 event PDFs were rendered and visually inspected. Sources/page/hash, document dates, period labels and reconciled amounts are in `CORPORATE_ACTION_REVIEW.json`. Announcement dates stay null where only document/signing dates are known. The 2021-announced event ex10Jan2022 remains included; publication date and effective-date filters are different dimensions.

| EventID | Ex-rights | Record | Payment | Fiscal label | API VND/share | PDF review VND/share |
| --- | --- | --- | --- | --- | ---: | ---: |
| 147849 | 2022-01-10 | 2022-01-11 | 2022-02-25 | 2021 | 1400 | 1400 |
| 157497 | 2022-07-06 | 2022-07-07 | 2022-08-19 | 2021 | 950 | 950 |
| 157500 | 2022-07-06 | 2022-07-07 | 2022-08-19 | 2022 | 1500 | 1500 |
| 163678 | 2022-12-22 | 2022-12-23 | 2023-02-28 | 2022 | 1400 | 1400 |
| 173284 | 2023-08-03 | 2023-08-04 | 2023-10-05 | 2022 | 950 | 950 |
| 173285 | 2023-08-03 | 2023-08-04 | 2023-10-05 | 2023 | 1500 | 1500 |
| 178865 | 2023-12-27 | 2023-12-28 | 2024-02-28 | 2023 | 500 | 500 |
| 181931 | 2024-03-15 | 2024-03-18 | 2024-04-26 | 2023 | 900 | 900 |
| 190659 | 2024-09-24 | 2024-09-25 | 2024-10-24 | 2023 | 950 | 950 |
| 190660 | 2024-09-24 | 2024-09-25 | 2024-10-24 | 2024 | 1500 | 1500 |
| 194066 | 2024-12-26 | 2024-12-27 | 2025-02-28 | 2024 | 500 | 500 |
| 201036 | 2025-05-14 | 2025-05-15 | 2025-05-23 | 2024 | 2000 | 2000 |
| 209559 | 2025-10-16 | 2025-10-17 | 2025-10-24 | 2024 | 350 | 350 |
| 209560 | 2025-10-16 | 2025-10-17 | 2025-10-24 | 2025 | 2500 | 2500 |
| 222269 | 2026-06-26 | 2026-06-29 | 2026-07-17 | 2025 | 1800 | 1850 |

**Material conflict:** Event222269 API/Note says1,800; its own HOSE1382 PDF page1 explicitly says18.5%=1,850, ex26Jun2026/record29Jun/payment17Jul. [Official VSDC notice](https://vsdc.vn/vi/ad1/197038) independently confirms the same terms. Raw API/normalized candidates remain untouched; research selection uses1,850 with the conflict retained. This is a verified field conflict, not an amount-based concept mapping.

**Known by cutoff but excluded by event-date query:** issuer disclosure dated/published28Oct2026 approves2,500 VND/share interim2026 dividend, record12Nov/payment26Nov. [VSDC29Oct notice](https://vsdc.vn/vi/ad1/201961) and [30Oct correction](https://vsdc.vn/vi/ad1/202037) corroborate it. Thus15 historical components plus1 announced future component are observed. Do not count the future cash as received or apply its ex-adjustment at30Oct. Ex-date is null in the cutoff-bound issuer/VSDC evidence; later calendar11Nov is post-cutoff context, not retroactive proof of original published ex-date.

Correction handling: VSDC8May2025 changes identification-document wording;30Oct2026 changes the description to interim advance. Neither creates a new cash distribution or changes amount/date. The latter notice is16:19:55 local, after exchange close but within a date-level EOD cutoff; no intraday as-known certification is made.

Year attribution (gross VND/share within retrieved scope): ex-rights year {"2022": 5250, "2023": 2950, "2024": 3850, "2025": 4850, "2026": 1850}; payment year {"2022": 3850, "2023": 3850, "2024": 3850, "2025": 5350, "2026": 1850}; fiscal labels {"2021": 2350, "2022": 3850, "2023": 3850, "2024": 4350, "2025": 4350}. Raw API scoped total18,700; PDF-reviewed total18,750. FY2021 scope is partial and FY2026 announced2,500 is outside these effective/payment totals. These sums are not net account credits or exhaustive fiscal-year declarations. Distinguishing fiscal entitlement/payment timing explains why a payment-year number cannot substitute for declared fiscal DPS. Do not deduct dividends from price basis or add them to an already adjusted total-return chain.

Share-count candidate2,089,955,445 is compatible with these cash-only observations. Retained annual/share/EPS anchors FY22–25 and2026 snapshots match; par10,000×shares=20,899,554,450,000 VND capital. Full issued/treasury/outstanding movement through30Oct, all rights/ESOP/cancellation/buyback/split events and conversion effective dates remain unproven by tab1. Unspecified ratios/subscription price/split factor/shares issued/cancelled/repurchased stay null. No reconstruction of unrelated reports or S1/S2/S3/S5 is attempted.
