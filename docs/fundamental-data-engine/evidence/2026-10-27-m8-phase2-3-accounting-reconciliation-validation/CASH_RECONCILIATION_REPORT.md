# Dated cash and obligation reconciliation

Date: 2026-10-27 (Asia/Ho_Chi_Minh). Phase 2.3 validation/reporting only. No production implementation, posting, migration or Phase 3 authorization.

All classifications below are report-only. CASH_RECONCILIATION.json retains exact prior source trace hashes/pointers and individual retrieval times. Economic as-of is UNKNOWN where the provider supplies retrieval time only; observations are never forced into a common valuation instant.

|Item|Dated scope|Classification|Exact difference / limitation|
|---|---|---|---|
|CASH07|2026-10-07 date only|RECONCILED_WITH_LIMITATIONS|0|
|CASH_EQ07|2026-10-07 date only|UNRECONCILED|500000|
|OPENING08|2026-10-08T11:38:01.705Z|RECONCILED|0|
|LIABILITY105|PDF07Oct versus APIretrieved08Oct; NOT simultaneous|INSUFFICIENT_EVIDENCE|UNKNOWN common-date economic liability;105 diagnostic only|
|RECEIVABLE570|opening08Oct|INSUFFICIENT_EVIDENCE|0 numerical decomposition, no accepted claim/action link|
|CASH16|2026-10-16 date only|RECONCILED_WITH_LIMITATIONS|0 cash arithmetic|
|ENDPOINT21|distinct retrieval timestamps in21Octcapture; providerasOfUNKNOWN|SOURCE_CONFLICT|95000 between reported endpoint fields, NOT simultaneous certified residual|
|CASH26|through2026-10-26 supplied cash statements|RECONCILED_WITH_LIMITATIONS|0|
|CURRENT27|2026-10-27|INSUFFICIENT_EVIDENCE|UNKNOWN|

07/10PDFsettledcash232420 and stated cash-equivalent732420 leave500000unclassified. The latter is not an extra CASH posting.08/10openingclaims570000 and payable0 are retained facts, not a balancing explanation for07/10. A hypothetical simultaneous difference70105 is never booked because date/category/obligation scope differs.

08/10API4.15 reports depoFee105, withdrawable232315 versuscash232420 and advance/marginused0; this suggests a fee field but does not authenticate a mapping to07/10PDFborrowing.21/10fee300 is another dated observation, not replacement of prior105. Economic current liability remains unknown, not zero.

21/10raw4.14 reports GAS475000+MWG95000 pending while4.15reports475000. Distinct retrieval timestamps and unknown provider as-of mean SOURCE_CONFLICT is an unresolved import/acceptance state, not proof of simultaneous certified balances. Missing link/action/net basis remains.16/10cashcredit95k is a supplied cash fact; it does not by itself settle accepted openingMWGclaim.

93retained cash rows rechecked individually to final327420 through26/10;17trade amounts/fees/taxes remain pinned prior evidence, not newly admitted transactions. Current27/10cash/claims/debt completeness is unverified. Required external records remain broker category breakdown for500k, exact105fee/debt lifecycle,07→08andforward movements, and entitlement/payment linkage. No balancing transaction or obligation waiver.
