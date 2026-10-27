# Cash and obligation reconciliation

Assessment date: 2026-10-27 (Asia/Ho_Chi_Minh). Phase 1 design/evidence closure only. Owner approved the prior architecture assessment as baseline v1.0 in the current task; this is not authenticated source/identity acceptance or Phase 2 authorization. Original baselines and sealed evidence remain unchanged. SOURCE_REFERENCES.json pins inspected files; JSON Pointers below address those pinned bytes.

Evidence population: all17 trades,93 cash rows,29 securities rows, plus07/10 broker statement. No imports. Retained SUMMARY.json proves the supplied cash series arithmetic: funding82848881 + gross sales1532000 − gross buys85455000 − fees26095 − sale tax4032 + net dividends1434500 + interest987 − custody3821 = **327420** at26/10. This checks supplied statement completeness only, not undisclosed accounts/obligations. 07/10 cash232420 matches opening numerically across dates; intervening completeness is unverified.

|Item|Evidence and conclusion|Required closure|
|---|---|---|
|Cash232420|Cash series07/10, PDF cash substatement and08/10 opening|Dated complete08/10 transition; do not assume no events|
|Cash-equivalent732420|PDF aggregate; residual500000 beyond settled cash|Broker category definition and exact constituent claim/reference/as-of; no extra CASH leg|
|Receivable570000|Opening RECEIVABLE; 4.14 issuer fields GAS475000 + MWG95000|Claim/action identity, recognition, net/gross/tax basis and remaining balance per claim|
|GAS475000|Provider pending field; no GAS payment in supplied93 cash rows through26/10|Account entitlement statement and issuer action, payable amount/tax basis, payment/remaining claim witness|
|MWG95000|CASH_B Sheet1 row71,16/10,95k net, record date08/10 stated in retained evidence|Exact opening-claim→action→receipt linkage; earlier MWG95k06/08 is a different event|
|Borrowing105|PDF liability07/10; opening payable0 on08/10|Debt/interest statement and any repayment/waiver proof over interval; no materiality waiver|
|VHM570000|CASH_B row45,22/07; paid pre-opening|Different issuer/date/event from opening570k; NEVER match by equal amount|

MWG16/10 is a proposed forward settlement candidate, not approved posting. If a net95k opening claim is proven, settle CASH+95000/linked RECEIVABLE−95000, no new income or contribution. Aggregate opening570k would then become475k **conditional on that proof**, not a currently accepted balance. Provider21/10 still shows pending field: treat conflict/staleness explicitly; do not discard the paid cash witness or auto-clear the provider field.

Net-only dividend evidence cannot justify fabricated5% withholding, gross amount or a legal entitlement date. The500k residual may overlap a claim, but even numeric relationships cannot establish that. Preserve disjoint classifications before NAV; do not add broker cash-equivalent to settled cash and full claims. Unknown105 liability remains a blocker to complete reconciliation even if economically small. Missing evidence owners: broker account support for categorized balances/debt; issuer/action records for entitlement; independent reviewer for matching. Owner chooses scope/action, cannot create absent source facts.
