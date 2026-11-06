# Four-bank financial metric coverage

| Issuer | Total metrics | Supported | Missing | Conflict | Rubrics ready | Rubrics deferred |
|---|---:|---:|---:|---:|---:|---:|
|CTG|145|115|22|8|0|23|
|MBB|145|121|24|0|0|23|
|TCB|145|123|22|0|0|23|
|VCB|128|90|28|10|0|23|

Counts are metric objects, not independent disclosures. SUPPORTED includes separately identified reported facts and derived diagnostics. MISSING means no qualified operand in this bounded replay, including retained evidence needing topic/page mapping; it is not a claim of absence from the repository. CONFLICT is an explicit compatibility deferral, with null value. No missing-as-zero, synthetic score or weight redistribution.

## CTG

CTG FY2022 canonical restatements conflict with native ORIGINAL flags; opening/current-vintage ROA/ROE and selected growth require a revision bridge. Reported CAR remains TT41. Provision expense is a flow distinct from closing customer-loan allowance.

Metric kinds: {"REPORTED_FACT": 84, "DERIVED_METRIC": 61}. Original definitions, exact fractions, unit/revision and source paths/JSON Pointers are in issuers/CTG.json. Source inventory is source-inventory/CTG.json; precise metric/rubric gaps are in gaps/CTG.json.

| Metric | FY2022 | FY2023 | FY2024 | FY2025 |
|---|---:|---:|---:|---:|
|TOTAL_ASSETS|1808810868|2032613606|2385387732|2767699300|
|TOTAL_EQUITY|108316308|125871820|148504708|179655005|
|BANK_GROSS_CUSTOMER_LOANS|1274843694|1473344564|1721954714|1992272868|
|BANK_CUSTOMER_DEPOSITS|1249176034|1410899038|1606316685|1793732057|
|BANK_LOAN_LOSS_RESERVES|29413230|27772921|36664125|34810365|
|BANK_NET_INTEREST_INCOME|47791955|52957478|62402794|66453245|
|NET_INCOME|16983645|20044622|25482567|34871266|
|NET_INCOME_ATTRIBUTABLE_PARENT|16923725|19903550|25348215|34604481|
|BANK_REPORTED_CAR|0.0898|0.0931|0.0954|0.0989|
|BANK_REPORTED_CET1|MISSING|MISSING|MISSING|MISSING|
|GROUP_ROA_AVG|Not emitted: opening/mapping dependency|0.010436035973|0.011535789625|0.013534126547|
|GROUP_ROE_AVG|Not emitted: opening/mapping dependency|0.171183929529|0.185748884467|0.212526185382|
|LOAN_DEPOSIT|CONFLICT|1.044259386617|1.071989558522|1.110685879881|
|RESERVES_GROSS_LOANS|0.023072028468|0.01885025518|0.021292154028|0.017472689389|
|BANK_CUSTOMER_LOAN_NPL|15824023000000|16608332000000|21351927000000|21916196000000|
|BANK_CUSTOMER_LOAN_NPL_COVERAGE|1.858770680503|1.672228192452|CONFLICT|1.588339737425|
|BANK_INTERBANK_ASSETS_REPORTED|MISSING|MISSING|MISSING|476487530|
|BANK_INTERBANK_FUNDING_REPORTED|MISSING|MISSING|MISSING|417724115|
|BANK_ISSUED_FUNDING_INSTRUMENTS|MISSING|MISSING|MISSING|174030352|
|BANK_CREDIT_PROVISION_EXPENSE|MISSING|MISSING|MISSING|-17298056|

Financial amounts above use native million VND when present, derived currency amounts use canonical VND, and ratios are decimal fractions. The original metric unit field is authoritative; no implicit provider scaling is used.

FY2025 gross loan/deposit diagnostic=1.110685879881; group ROE on average total group equity=0.212526185382. These are not statutory LDR or normalized common-owner returns. Reported NII growth=0.064908167413; group NPAT growth=0.368436154803. Historical growth is not per-share/action-adjusted or a forward forecast.

Counterevidence/limits: closing balances and reported earnings do not qualify interest realization, restructured exposures, deposit stability, maturity/covenant stress or recurring common-owner returns. Regulatory capital exclusions remain separate from financial group scope. Interbank assets are the reported subtotal (including applicable contra), and TCB funding caption includes financial institutions. Reported provision expense is a signed multi-exposure flow, not automatically customer-loan credit cost.

23 rubric deferrals: {"RESEARCH_MAPPING": 10, "TOPIC_EVIDENCE_UNQUALIFIED": 7, "ANALYST_ASSUMPTIONS_REQUIRED": 2, "VALUATION_DEPENDENCY": 4}. Each carries full unchanged M3 topic lists, exact dependency, issuer context, analyst/owner responsibility and resolution/stop path. No moat, governance quality, market share, assumption or valuation is manufactured.

Explicit unresolved compatibility metrics:
- `CTG:CONSOLIDATED:BANK_CUSTOMER_LOAN_NPL_RATIO:2024`: PERIOD_SCOPE_OR_REVISION_MISMATCH, DEPENDENCY_NOT_QUALIFIED; required source/revision bridge before calculation.
- `CTG:CONSOLIDATED:BANK_CUSTOMER_LOAN_NPL_COVERAGE:2024`: PERIOD_SCOPE_OR_REVISION_MISMATCH, DEPENDENCY_NOT_QUALIFIED; required source/revision bridge before calculation.
- `CTG:CONSOLIDATED:LOAN_DEPOSIT:2022`: PERIOD_SCOPE_OR_REVISION_MISMATCH, DEPENDENCY_NOT_QUALIFIED; required source/revision bridge before calculation.
- `CTG:CONSOLIDATED:NII_ASSETS_CLOSING:2022`: PERIOD_SCOPE_OR_REVISION_MISMATCH, DEPENDENCY_NOT_QUALIFIED; required source/revision bridge before calculation.
- `CTG:CONSOLIDATED:TOTAL_ASSETS_FY22_25_CHANGE:2025`: PERIOD_SCOPE_OR_REVISION_MISMATCH, DEPENDENCY_NOT_QUALIFIED; required source/revision bridge before calculation.
- `CTG:CONSOLIDATED:TOTAL_EQUITY_FY22_25_CHANGE:2025`: PERIOD_SCOPE_OR_REVISION_MISMATCH, DEPENDENCY_NOT_QUALIFIED; required source/revision bridge before calculation.
- `CTG:CONSOLIDATED:NET_INCOME_FY22_25_CHANGE:2025`: PERIOD_SCOPE_OR_REVISION_MISMATCH, DEPENDENCY_NOT_QUALIFIED; required source/revision bridge before calculation.
- `CTG:CONSOLIDATED:BANK_GROSS_CUSTOMER_LOANS_FY22_25_CHANGE:2025`: PERIOD_SCOPE_OR_REVISION_MISMATCH, DEPENDENCY_NOT_QUALIFIED; required source/revision bridge before calculation.

## MBB

MBB group includes non-bank subsidiaries and minority interests. FY2025 group NPAT27382978 versus explicit parent26778939 million VND; group growth is not organic or action-adjusted growth. Interbank net assets retain their own provision and are not gross exposure.

Metric kinds: {"REPORTED_FACT": 84, "DERIVED_METRIC": 61}. Original definitions, exact fractions, unit/revision and source paths/JSON Pointers are in issuers/MBB.json. Source inventory is source-inventory/MBB.json; precise metric/rubric gaps are in gaps/MBB.json.

| Metric | FY2022 | FY2023 | FY2024 | FY2025 |
|---|---:|---:|---:|---:|
|TOTAL_ASSETS|728532373|944953640|1128801062|1615763927|
|TOTAL_EQUITY|79613219|96711159|117059581|142022525|
|BANK_GROSS_CUSTOMER_LOANS|460574482|611048830|776657846|1084019370|
|BANK_CUSTOMER_DEPOSITS|443605638|567532577|714154479|921368132|
|BANK_LOAN_LOSS_RESERVES|11975860|11469563|11609861|13150593|
|BANK_NET_INTEREST_INCOME|36023122|38683848|41152219|51610117|
|NET_INCOME|18155185|21053792|22951264|27382978|
|NET_INCOME_ATTRIBUTABLE_PARENT|MISSING|MISSING|22633757|26778939|
|BANK_REPORTED_CAR|0.1153|0.1075|0.1176|0.1102|
|BANK_REPORTED_CET1|MISSING|MISSING|MISSING|MISSING|
|GROUP_ROA_AVG|Not emitted: opening/mapping dependency|0.025161599005|0.022134984411|0.019954330183|
|GROUP_ROE_AVG|Not emitted: opening/mapping dependency|0.238807500571|0.214727834127|0.211384556215|
|LOAN_DEPOSIT|1.038252092729|1.076676220474|1.087520793943|1.176532302726|
|RESERVES_GROSS_LOANS|0.026002005035|0.018770288784|0.014948488655|0.012131326583|
|BANK_CUSTOMER_LOAN_NPL|5031294000000|9804658000000|12585432000000|14027496000000|
|BANK_CUSTOMER_LOAN_NPL_COVERAGE|2.380274338967|1.169807554736|0.922484107022|0.937486847261|
|BANK_INTERBANK_ASSETS_REPORTED|MISSING|MISSING|MISSING|182923726|
|BANK_INTERBANK_FUNDING_REPORTED|MISSING|MISSING|MISSING|248017489|
|BANK_ISSUED_FUNDING_INSTRUMENTS|MISSING|MISSING|MISSING|187236104|
|BANK_CREDIT_PROVISION_EXPENSE|MISSING|MISSING|MISSING|-13743504|

Financial amounts above use native million VND when present, derived currency amounts use canonical VND, and ratios are decimal fractions. The original metric unit field is authoritative; no implicit provider scaling is used.

FY2025 gross loan/deposit diagnostic=1.176532302726; group ROE on average total group equity=0.211384556215. These are not statutory LDR or normalized common-owner returns. Reported NII growth=0.254127195425; group NPAT growth=0.193092371732. Historical growth is not per-share/action-adjusted or a forward forecast.

Counterevidence/limits: closing balances and reported earnings do not qualify interest realization, restructured exposures, deposit stability, maturity/covenant stress or recurring common-owner returns. Regulatory capital exclusions remain separate from financial group scope. Interbank assets are the reported subtotal (including applicable contra), and TCB funding caption includes financial institutions. Reported provision expense is a signed multi-exposure flow, not automatically customer-loan credit cost.

23 rubric deferrals: {"RESEARCH_MAPPING": 10, "TOPIC_EVIDENCE_UNQUALIFIED": 7, "ANALYST_ASSUMPTIONS_REQUIRED": 2, "VALUATION_DEPENDENCY": 4}. Each carries full unchanged M3 topic lists, exact dependency, issuer context, analyst/owner responsibility and resolution/stop path. No moat, governance quality, market share, assumption or valuation is manufactured.

## TCB

TCB customer-loan general+specific reserve10485620 million excludes12758 margin-lending provision in total contra10498378. TCBS-related minority/corporate actions and financial-institution funding scope require independent topic reconciliation; no industrial FCF.

Metric kinds: {"REPORTED_FACT": 84, "DERIVED_METRIC": 61}. Original definitions, exact fractions, unit/revision and source paths/JSON Pointers are in issuers/TCB.json. Source inventory is source-inventory/TCB.json; precise metric/rubric gaps are in gaps/TCB.json.

| Metric | FY2022 | FY2023 | FY2024 | FY2025 |
|---|---:|---:|---:|---:|
|TOTAL_ASSETS|699032544|849482012|978798549|1192344137|
|TOTAL_EQUITY|113424966|131616065|147939621|179501442|
|BANK_GROSS_CUSTOMER_LOANS|420523705|518641568|631724964|767617129|
|BANK_CUSTOMER_DEPOSITS|358403785|454660779|533392350|618911535|
|BANK_LOAN_LOSS_RESERVES|4771449|6123121|8083041|10485620|
|BANK_NET_INTEREST_INCOME|30289775|27691120|35507963|38155091|
|NET_INCOME|20436426|18190866|21760104|25954472|
|NET_INCOME_ATTRIBUTABLE_PARENT|20150377|18003802|21522928|25290230|
|BANK_REPORTED_CAR|0.1518|0.1435|0.154|0.1461|
|BANK_REPORTED_CET1|MISSING|MISSING|MISSING|MISSING|
|GROUP_ROA_AVG|Not emitted: opening/mapping dependency|0.023494601235|0.023803900194|0.023908582487|
|GROUP_ROE_AVG|Not emitted: opening/mapping dependency|0.148472000185|0.155676347073|0.158529121315|
|LOAN_DEPOSIT|1.1733238392|1.140722032678|1.184353251411|1.240269546762|
|RESERVES_GROSS_LOANS|0.011346444786|0.011806074518|0.012795190092|0.013659960941|
|BANK_CUSTOMER_LOAN_NPL|3032605000000|5999143000000|7100800000000|8198375000000|
|BANK_CUSTOMER_LOAN_NPL_COVERAGE|1.573382949642|1.020665951787|1.138328216539|1.278987604251|
|BANK_INTERBANK_ASSETS_REPORTED|MISSING|MISSING|MISSING|114958312|
|BANK_INTERBANK_FUNDING_REPORTED|MISSING|MISSING|MISSING|144982976|
|BANK_ISSUED_FUNDING_INSTRUMENTS|MISSING|MISSING|MISSING|215330128|
|BANK_CREDIT_PROVISION_EXPENSE|MISSING|MISSING|MISSING|-4420625|

Financial amounts above use native million VND when present, derived currency amounts use canonical VND, and ratios are decimal fractions. The original metric unit field is authoritative; no implicit provider scaling is used.

FY2025 gross loan/deposit diagnostic=1.240269546762; group ROE on average total group equity=0.158529121315. These are not statutory LDR or normalized common-owner returns. Reported NII growth=0.074550263556; group NPAT growth=0.192754961098. Historical growth is not per-share/action-adjusted or a forward forecast.

Counterevidence/limits: closing balances and reported earnings do not qualify interest realization, restructured exposures, deposit stability, maturity/covenant stress or recurring common-owner returns. Regulatory capital exclusions remain separate from financial group scope. Interbank assets are the reported subtotal (including applicable contra), and TCB funding caption includes financial institutions. Reported provision expense is a signed multi-exposure flow, not automatically customer-loan credit cost.

23 rubric deferrals: {"RESEARCH_MAPPING": 10, "TOPIC_EVIDENCE_UNQUALIFIED": 7, "ANALYST_ASSUMPTIONS_REQUIRED": 2, "VALUATION_DEPENDENCY": 4}. Each carries full unchanged M3 topic lists, exact dependency, issuer context, analyst/owner responsibility and resolution/stop path. No moat, governance quality, market share, assumption or valuation is manufactured.

## VCB

VCB FY2023 selected assets/equity/NPAT/reserve are restated comparatives while some retained native flags say ORIGINAL. FY2025 parent35177663 differs from group35197940 million VND. CAR issuer-verified PDF lineage and TT41 scope stay separate from book equity.

Metric kinds: {"REPORTED_FACT": 79, "DERIVED_METRIC": 49}. Original definitions, exact fractions, unit/revision and source paths/JSON Pointers are in issuers/VCB.json. Source inventory is source-inventory/VCB.json; precise metric/rubric gaps are in gaps/VCB.json.

| Metric | FY2022 | FY2023 | FY2024 | FY2025 |
|---|---:|---:|---:|---:|
|TOTAL_ASSETS|1813815170|1839724560|2085873522|2442279166|
|TOTAL_EQUITY|135646085|165080490|196209168|224558726|
|BANK_GROSS_CUSTOMER_LOANS|1145066250|1270359018|1449198899|1673525675|
|BANK_CUSTOMER_DEPOSITS|1243468471|1395697611|1514664850|1672534846|
|BANK_LOAN_LOSS_RESERVES|24779418|28681807|31183175|24975679|
|BANK_NET_INTEREST_INCOME|53246478|53614431|55405735|58771410|
|NET_INCOME|29919054|33122272|33853117|35197940|
|NET_INCOME_ATTRIBUTABLE_PARENT|29899014|33101027|33831386|35177663|
|BANK_REPORTED_CAR|0.0995|0.1139|0.1216|0.1156|
|BANK_REPORTED_CET1|MISSING|MISSING|MISSING|MISSING|
|GROUP_ROA_AVG|Not emitted: opening/mapping dependency|CONFLICT|CONFLICT|0.015546269053|
|GROUP_ROE_AVG|Not emitted: opening/mapping dependency|CONFLICT|CONFLICT|0.167303354186|
|LOAN_DEPOSIT|0.920864723718|0.910196455155|0.956778589666|1.000592411574|
|RESERVES_GROSS_LOANS|0.021640160995|0.022577717475|0.021517526008|0.01492398914|
|BANK_CUSTOMER_LOAN_NPL|Not emitted: opening/mapping dependency|Not emitted: opening/mapping dependency|Not emitted: opening/mapping dependency|9669555000000|
|BANK_CUSTOMER_LOAN_NPL_COVERAGE|Not emitted: opening/mapping dependency|Not emitted: opening/mapping dependency|Not emitted: opening/mapping dependency|2.582919172599|
|BANK_INTERBANK_ASSETS_REPORTED|MISSING|MISSING|MISSING|522474362|
|BANK_INTERBANK_FUNDING_REPORTED|MISSING|MISSING|MISSING|321158102|
|BANK_ISSUED_FUNDING_INSTRUMENTS|MISSING|MISSING|MISSING|27101221|
|BANK_CREDIT_PROVISION_EXPENSE|MISSING|MISSING|MISSING|-3192186|

Financial amounts above use native million VND when present, derived currency amounts use canonical VND, and ratios are decimal fractions. The original metric unit field is authoritative; no implicit provider scaling is used.

FY2025 gross loan/deposit diagnostic=1.000592411574; group ROE on average total group equity=0.167303354186. These are not statutory LDR or normalized common-owner returns. Reported NII growth=0.060745967904; group NPAT growth=0.039725234164. Historical growth is not per-share/action-adjusted or a forward forecast.

Counterevidence/limits: closing balances and reported earnings do not qualify interest realization, restructured exposures, deposit stability, maturity/covenant stress or recurring common-owner returns. Regulatory capital exclusions remain separate from financial group scope. Interbank assets are the reported subtotal (including applicable contra), and TCB funding caption includes financial institutions. Reported provision expense is a signed multi-exposure flow, not automatically customer-loan credit cost.

23 rubric deferrals: {"RESEARCH_MAPPING": 10, "TOPIC_EVIDENCE_UNQUALIFIED": 7, "ANALYST_ASSUMPTIONS_REQUIRED": 2, "VALUATION_DEPENDENCY": 4}. Each carries full unchanged M3 topic lists, exact dependency, issuer context, analyst/owner responsibility and resolution/stop path. No moat, governance quality, market share, assumption or valuation is manufactured.

Explicit unresolved compatibility metrics:
- `VCB:CONSOLIDATED:GROUP_ROA_AVG:2023`: PERIOD_SCOPE_OR_REVISION_MISMATCH, DEPENDENCY_NOT_QUALIFIED; required source/revision bridge before calculation.
- `VCB:CONSOLIDATED:GROUP_ROE_AVG:2023`: PERIOD_SCOPE_OR_REVISION_MISMATCH, DEPENDENCY_NOT_QUALIFIED; required source/revision bridge before calculation.
- `VCB:CONSOLIDATED:TOTAL_ASSETS_YOY:2023`: PERIOD_SCOPE_OR_REVISION_MISMATCH, DEPENDENCY_NOT_QUALIFIED; required source/revision bridge before calculation.
- `VCB:CONSOLIDATED:TOTAL_EQUITY_YOY:2023`: PERIOD_SCOPE_OR_REVISION_MISMATCH, DEPENDENCY_NOT_QUALIFIED; required source/revision bridge before calculation.
- `VCB:CONSOLIDATED:NET_INCOME_YOY:2023`: PERIOD_SCOPE_OR_REVISION_MISMATCH, DEPENDENCY_NOT_QUALIFIED; required source/revision bridge before calculation.
- `VCB:CONSOLIDATED:BANK_NET_INTEREST_INCOME_YOY:2023`: PERIOD_SCOPE_OR_REVISION_MISMATCH, DEPENDENCY_NOT_QUALIFIED; required source/revision bridge before calculation.
- `VCB:CONSOLIDATED:GROUP_ROA_AVG:2024`: PERIOD_SCOPE_OR_REVISION_MISMATCH, DEPENDENCY_NOT_QUALIFIED; required source/revision bridge before calculation.
- `VCB:CONSOLIDATED:GROUP_ROE_AVG:2024`: PERIOD_SCOPE_OR_REVISION_MISMATCH, DEPENDENCY_NOT_QUALIFIED; required source/revision bridge before calculation.
- `VCB:CONSOLIDATED:NET_INCOME_YOY:2024`: PERIOD_SCOPE_OR_REVISION_MISMATCH, DEPENDENCY_NOT_QUALIFIED; required source/revision bridge before calculation.
- `VCB:CONSOLIDATED:BANK_NET_INTEREST_INCOME_YOY:2024`: PERIOD_SCOPE_OR_REVISION_MISMATCH, DEPENDENCY_NOT_QUALIFIED; required source/revision bridge before calculation.

## Resolved provision definition difference

TCB general+specific customer-loan reserves exclude margin-lending reserves. FY2025:10,485,620+12,758=10,498,378 million VND total contra; FY2024:8,083,041+7,652=8,090,693; FY2023:6,123,121+4,775=6,127,896. The narrower reserve/gross-loan diagnostic is distinct from a separately calculated customer-loan NPL coverage ratio with explicit groups3/4/5. Neither proxy is relabelled NIM, statutory LDR or CAR.

CET1 FY2022–FY2025 is unqualified for all four in the selected review contracts; Tier1/book equity are not substitutes. Historical supplementary funding/income rows remain mapping gaps where not directly reviewed. FY2022 average ROA/ROE requires qualified FY2021 opening operands and is not fabricated.

Valuation blockers remain owner-approved cutoff/source policy, dated compatible price/action-adjusted shares, normalized common-owner denominator, economic assumptions and model crosschecks. No valuation has run.
