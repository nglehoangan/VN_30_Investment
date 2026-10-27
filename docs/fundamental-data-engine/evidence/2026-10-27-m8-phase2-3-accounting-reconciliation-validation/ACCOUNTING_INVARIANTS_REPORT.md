# Accounting invariants report

Date: 2026-10-27 (Asia/Ho_Chi_Minh). Phase 2.3 validation/reporting only. No production implementation, posting, migration or Phase 3 authorization.

|Invariant|Evidence/result|
|---|---|
|Immutable original facts/ordered legs|Actual12 transactions/24 legs rebuild exactly; original projection comparison0differences|
|Cash conservation|Actual signed CASH232420; synthetic independently tabulated cash1171|
|Quantity and MWAC|Synthetic10opening shares +10BUY −5SELL, then2:1split →30; basis226.5 conserved at split|
|Realized P&L|Net sale148 − released basis75.5 =72.5; settlement does not realize income again|
|NET claim clearing|40+30receipt cash offsets exactly70claim decrease; no dividend/flow/quantity/basis effect|
|Capital-flow classification|Deposit200 − withdrawal50 =150; trades/dividends/claim settlements/internal actions excluded|
|Charges|BUY fee capitalized; SELL fees/tax reduce proceeds once; dividend withholding represented once; standalone fees/taxes reverse/correct without duplication|
|Obligations|Known payables/receivables explicit; missing reconciliation payable becomes MISSING_EVIDENCE, never zero|
|No margin/negative cash|Existing211regressions include unfunded BUY, oversell and insufficient-cash rejection|
|Atomicity/idempotency|Cross-format/repeated imports, CAS, concurrent receipts and audit-failure rollback covered by fresh regression|
|Authority|Default unavailable adapters block; no synthetic accepted reference becomes production authority|

Independent book-carrying-component check: final cash1171 + claims30 + basis226.5 =1427.5; opening1000+100+100=1200; difference227.5 equals external150 + realized72.5 + netdividend9 − expenses4. **This uses carrying basis, not market value, and is NOT NAV.** No transaction price or current quote is substituted for historical close.

Technical pass applies to tested supported events only. Gross claims, split receipt allocation, pending lifecycle inference and certain canonical cash-receipt corrections remain unsupported/fail-closed. No approved methodology, rounding or accounting invariant changed.
