# Integrated transaction validation

Date: 2026-10-27 (Asia/Ho_Chi_Minh). Phase 2.3 validation/reporting only. No production implementation, posting, migration or Phase 3 authorization.

New evidence-only suite runs one synthetic stream through actual Prisma/SQLite, existing source/intake contracts and the single accounting builder/replay. Synthetic opening: cash1000, NETclaim100,10shares/basis100. Sequence: deposit200; BUY10@20+fee2; settlement202; SELL5@30−fee1−tax1; settlement148; cashdividend gross10/tax1/net9; NETclaim receipts40+30;2:1split; fee3; tax2; withdrawal50; fee reversal; paired tax reversal/replacement4.

Expected table prepared separately from domain output: final cash1171,claims30,payables0,quantity30,basis226.5,MWAC7.55,realized72.5,netdividends9,externalflow150,expenses4. Actual matches every expected field. Final17transactions/25legs/revision5,15forward audits and2NETsettlement audits. Original imported synthetic facts remain unchanged. Reimporting whole sequence from a second source format returns DUPLICATE with no revision change.

validation/INTEGRATED_EXPECTED_ACTUAL.json contains original synthetic commands, exact expected/actual and independent integer cash terms; no actual broker receipt used. Existing211regressions test wider rounding, historical transition, unsupported events, concurrency and rollback cases. Reconciliation guard suite checks exact-match versus unknown payables,105mismatch, cross-date reference and unresolved source flag.

All synthetic authorizers/methodology records are test-only. Separately tabulated expected numbers are **not producer-distinct independent acceptance**. Integration database files are temporary and removed by fixture cleanup. No real historical17trades/93cash/29securitiesevents imported into any production ledger.
