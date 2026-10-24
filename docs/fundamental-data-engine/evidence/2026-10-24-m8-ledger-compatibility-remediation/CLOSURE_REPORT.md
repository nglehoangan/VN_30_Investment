# M8 ledger compatibility remediation closure

Final status: **READY_FOR_OWNER_REVIEW**. Not auto-approved.

`M8_LEDGER_OPENING_RECEIVABLE_REPLAY` is resolved in code. Explicit evidenced opening receivables now produce the original obligation leg while preserving CASH, financial facts, transaction IDs, timestamps, leg order and all historical records. The strict authoritative reader remains unchanged.

All twelve actual transactions and 24 original legs reproduce exactly. Eleven authoritative holdings load, with quantities/costs/cash/receivables matching original legs and stored projection. Actual browser comparisons confirm cash, nonzero receivable and all eleven quantities/cost bases/average costs; transaction history shows twelve records. Dashboard, holdings and transaction routes render without the prior integrity alert. Holdings detail and sidebar navigation work. No synthetic fixture is presented as live acceptance.

162 unit tests and 62 PEC-2 tests pass; build/typechecking and architecture boundaries pass. Five immutable/duplicate operations are rejected on an isolated in-memory backup of the actual database, without migrations. Actual SQLite bytes, logical dump, schema, table counts, every original record/leg and methodology remain unchanged. Prior evidence seals verify. Eight authority candidates remain DEFERRED; no source approval, independent acceptance, effective admission, D2 or scoring activation was created.

Remaining limitations are outside this remediation: accepted current market data is absent, so NAV/current market P&L and actionability remain unavailable; rebuilt financial-data adapter work is not started. Twelve opening records do not supply pre-inception or subsequent trade/dividend history. The original importer executable was not recovered; retained source body/hash and exact original records provide the compatibility evidence. Authentication remains deferred under the owner's earlier decision.

Review `ROOT_CAUSE_ANALYSIS.md`, `ACCOUNTING_CONTRACT_DECISION.md`, `IMPLEMENTATION_REPORT.md`, `LEDGER_REPLAY_RESULTS.json`, `LIVE_RUNTIME_RESULTS.json`, `VALIDATION_RESULTS.json` and `SAFETY_VERIFICATION.json`. The loopback review server is stopped. Stop after ledger remediation; await owner review. No next milestone is started.
