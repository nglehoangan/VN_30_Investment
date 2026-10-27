# Dividend receivable settlement validation

Date: 2026-10-27 (Asia/Ho_Chi_Minh). Phase 2.3 validation/reporting only. No production implementation, posting, migration or Phase 3 authorization.

Fresh Phase2.1/2.2 regression covers full/partial/multiple receipts, overclaim, repeated receipt, cross-file/format duplication, duplicate DIVIDEND_CASH/CASH_DEPOSIT both before/after enrollment, immutable reversal/correction, concurrent requests, missing allocation/evidence/authority, GROSSrejection/NETmismatch and wrong allocation totals/issuer/portfolio/action. Existing NET receipts consume one whole receipt; shared receipt splitting remains unsupported.

Integrated test: cash receipts40+30 reduce original NETclaim100 to30 (claimA70fully cleared,claimB30remains). Cash increase70 equals receivable decrease70; no second dividend income, external capital flow, security quantity, MWAC or realizedP&L impact. Separate actual-income dividend9 remains9. Default-authority case blocks without a write.

A deliberately canonicalized cash-deposit receipt correction AFTER claim enrollment returns BLOCKED and leaves revision/transactions unchanged. This is the already documented Phase2.2 receipt-lifecycle limitation, not a newly granted correction capability or a reason to weaken Phase2.1 protection. Supported fee/tax correction succeeds. Gross/net amendment, shared receipt allocations and broader receipt corrections need separate authorization/implementation.

Actual opening570k stays untouched; no accepted GAS/MWGallocation created; **MWG95000 receipt was not posted**. No tax rate/gross amount invented. Source hashes and synthetic authority references do not constitute authenticated acceptance.
