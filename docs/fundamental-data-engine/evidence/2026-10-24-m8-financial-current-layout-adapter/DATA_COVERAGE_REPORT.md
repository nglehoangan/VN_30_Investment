# Retained research coverage

Thirty ticker files pass consumed-schema validation and combined manifest hashing. Retained selection totals: PDF_REPORTED 385,956; CAFEF_REFERENCE 224,607; MISSING 136,870; UNRESOLVED_MAPPING 1,089. These are unreviewed presentation counts, not accepted facts.

Eight API schema quarantines persist: CTG four and VCB four. None is repaired or admitted. Manifest records and live UI show exact paths/errors. Quarantine is not a zero value or proof the ticker has no financial data.

|Ticker|Variants|Stored scopes|Default page rows|Numeric candidates|Withheld rows|
|---|---:|---|---:|---:|---:|
|ACB|354|UNKNOWN,CONSOLIDATED|35|34|0|
|BID|382|UNKNOWN,CONSOLIDATED,STANDALONE|70|70|0|
|BSR|235|UNKNOWN,CONSOLIDATED|66|64|1|
|CTG|279|CONSOLIDATED,STANDALONE,UNKNOWN|48|42|2|
|FPT|326|UNKNOWN,CONSOLIDATED|84|84|0|
|GAS|329|UNKNOWN,CONSOLIDATED,STANDALONE|75|74|1|
|GVR|345|UNKNOWN,CONSOLIDATED,STANDALONE|43|38|0|
|HDB|322|UNKNOWN,CONSOLIDATED|12|12|0|
|HPG|283|UNKNOWN,CONSOLIDATED|76|75|0|
|LPB|268|UNKNOWN,STANDALONE,CONSOLIDATED|63|57|2|
|MBB|580|UNKNOWN,CONSOLIDATED,STANDALONE|76|0|74|
|MCH|351|UNKNOWN,CONSOLIDATED|72|71|1|
|MSN|653|UNKNOWN,CONSOLIDATED|51|50|0|
|MWG|304|UNKNOWN,CONSOLIDATED|60|59|0|
|SAB|296|UNKNOWN,CONSOLIDATED|100|98|0|
|SHB|260|UNKNOWN,CONSOLIDATED|66|66|0|
|SSB|409|UNKNOWN,CONSOLIDATED,STANDALONE|67|65|0|
|SSI|214|UNKNOWN,CONSOLIDATED|14|11|0|
|STB|390|UNKNOWN,CONSOLIDATED,STANDALONE|64|64|0|
|TCB|397|UNKNOWN,CONSOLIDATED,STANDALONE|81|75|2|
|TCX|148|UNKNOWN,STANDALONE|9|9|0|
|VCB|650|CONSOLIDATED,UNKNOWN,STANDALONE|71|71|0|
|VHM|871|UNKNOWN,CONSOLIDATED,STANDALONE|19|0|17|
|VIB|814|UNKNOWN,CONSOLIDATED,STANDALONE|35|0|35|
|VIC|330|UNKNOWN,CONSOLIDATED|21|20|0|
|VJC|316|UNKNOWN,CONSOLIDATED|43|41|0|
|VNM|331|UNKNOWN,CONSOLIDATED|73|72|0|
|VPB|447|UNKNOWN,CONSOLIDATED,STANDALONE|74|70|1|
|VPL|268|UNKNOWN,CONSOLIDATED,STANDALONE|74|72|0|
|VRE|231|UNKNOWN,CONSOLIDATED|68|67|0|

All thirty catalogs contain unknown scopes. Twenty-nine contain explicit consolidated variants; fifteen contain STANDALONE variants. Actual parent-labelled VNM file probe retains UNKNOWN where the source JSON does not qualify its scope. Synthetic tests separately verify explicit PARENT/CONSOLIDATED preservation. This does not certify all thirty issuers' parent/consolidated coverage.

Default pages are bounded samples, not full-corpus semantic acceptance. Some rows are withheld for source/value-pointer mismatches or unresolved periods; see ACTUAL_DATA_COVERAGE.json for per-ticker reasons. They were not silently repaired. Representative VNM consolidated PDF, parent-labelled PDF and CafeF probes preserve exact values/pointers. The live browser additionally checks unknown/future-period variants when present and pagination against the reader.

Publication-qualified variants: zero. Retrieval times describe retained captures, not issuer publication or certified financial freshness. Current NAV and accepted financial/scoring data remain unavailable. No financial metrics were fabricated, no source images re-reviewed and no OCR correctness claim made.
