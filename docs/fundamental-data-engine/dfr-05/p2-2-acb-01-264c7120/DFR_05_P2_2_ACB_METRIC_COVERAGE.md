# ACB financial metric coverage

Reported financial statement values below are native **million VND**; ratios are decimal fractions. Native originals, canonical VND, exact fractions, dates, revision, source pointers/hashes and full definitions are retained in ACB.json.

Total 92 metric objects: 85 SUPPORTED, 7 MISSING, 0 CONFLICT. Supported count includes distinct component facts and derived metrics; it is not the number of independent reported disclosures.

| Concept | FY2022 | FY2023 | FY2024 | FY2025 |
|---|---:|---:|---:|---:|
|TOTAL_ASSETS|607875185|718794589|864005703|1025850127|
|TOTAL_EQUITY|58438663|70955961|83461678|94519719|
|NET_INCOME|13688193|16044733|16789768|15624699|
|BANK_NET_INTEREST_INCOME|23533529|24959570|27794702|26905695|
|BANK_GROSS_CUSTOMER_LOANS|413706244|487601852|580686248|686777352|
|BANK_CUSTOMER_DEPOSITS|413952789|482702731|537304578|585180175|
|BANK_LOAN_LOSS_RESERVES|4733534|5249476|6622080|7507253|
|BANK_REPORTED_CAR|0.128|0.1248|0.1182|0.1245|
|BANK_REPORTED_CET1|MISSING|MISSING|MISSING|0.1207|
|NET_INCOME_ATTRIBUTABLE_PARENT|MISSING|MISSING|MISSING|MISSING|
|GROUP_ROA_AVG|Not calculated: FY2021 opening balance outside window|0.024187983045|0.021215270284|0.016535334338|
|GROUP_ROE_AVG|Not calculated: FY2021 opening balance outside window|0.24799690287|0.217459198427|0.175576765475|
|LOAN_DEPOSIT|0.999404412758|1.01014935422|1.080739438628|1.173616915508|
|RESERVES_GROSS_LOANS|0.01144177558|0.010765906607|0.011403886389|0.010931130705|
|NII_ASSETS_CLOSING|0.038714409768|0.03472420408|0.03216958164|0.026227705482|

Thirty-three retained FY2022–FY2025 observations are reused. Four reserve aggregates are classified as derived sums; eight specific/general component facts are explicit and hash-linked. All48 derived objects use exact Decimal operands; ratios retain DFR02 12dp HALF_EVEN and exact fractions. Accounting growth uses same original-vintage full-year/December31 scope; no comparative/latest-column substitution, YTD annualization, per-share inference or CAR cross-framework trend.

## Reserve reconciliation

| FY | Specific | General | Excluded margin lending | Total contra | Unit |
|---|---:|---:|---:|---:|---|
|2022|1662513|3071021|116202|4849736|million VND|
|2023|1657154|3592322|117476|5366952|million VND|
|2024|2383004|4239076|117476|6739556|million VND|
|2025|2525003|4982250|117476|7624729|million VND|

The FY2025 retained narrower reserve amount7,507,253 million VND equals2,525,003+4,982,250; total contra7,624,729 also includes117,476 margin-lending provision. This is a resolved definition difference, not an unresolved numeric contradiction. The ratio remains specific+general reserves/gross customer loans, not NPL coverage. Restructuring-related provisioning and denominator coverage still require topic qualification before any asset-quality assessment.

## Financial reading and counterevidence

FY2025 gross customer loans grew 0.182699528989 while customer deposits grew 0.089103273935. Gross loans/customer deposits reached 1.173616915508; this balance-sheet funding diagnostic is not statutory LDR or proof of liquidity distress. Interbank funding, issued instruments and maturity gaps require their own reconciliation.

Assets increased while group NPAT changed -0.069391608032 and NII changed -0.031984764579 in FY2025. Reported group ROE on average total equity is 0.175576765475. These observations support analysis of weaker earnings against a larger balance sheet; they do not establish normalized common-owner returns or a moat.

Reported CAR is12.8%,12.48%,11.82%,12.45%; FY2025 explicit CET1 is12.07%. FY2022–2024 CET1 is not disclosed in the qualified review; Tier1 is not substituted. FY2025 changes to TT14 versus earlier TT41 and regulatory exclusions prevent an unqualified like-for-like capital trend. Book equity/assets is a separate diagnostic.

Seven explicit metric gaps: parent-attributable NPAT four years; explicit CET1 FY2022–2024. Parent profit is unqualified, not proved absent everywhere in the retained corpus. No group=parent, NCI=0 or EPS-derived share inference. FY2022 average ROA/ROE additionally require FY2021 opening operands outside this authorized window and are not emitted as invented values.

Full topic readiness:0;23 deferred and unscored. Financial metrics support partial context, not full M3 topic sets. Deferred classes: {"RESEARCH_MAPPING": 10, "TOPIC_EVIDENCE_UNQUALIFIED": 7, "ANALYST_ASSUMPTIONS_REQUIRED": 2, "VALUATION_DEPENDENCY": 4}. Each rubric has an exact dependency and resolution in gap-register.json. Source existence is distinguished from qualified topic evidence; no claim of seven genuinely absent nonfinancial sources is made.

Valuation remains deferred: compatible dated price, corporate-action-adjusted shares, normalized common-owner denominator, owner-approved cutoff/source policy and economic assumptions are not supplied or presumed. No valuation execution occurred.
