# Deterministic validation cases

Assessment date: 2026-10-27 (Asia/Ho_Chi_Minh). Phase 1 design/evidence closure only. Owner approved the prior architecture assessment as baseline v1.0 in the current task; this is not authenticated source/identity acceptance or Phase 2 authorization. Original baselines and sealed evidence remain unchanged. SOURCE_REFERENCES.json pins inspected files; JSON Pointers below address those pinned bytes.

Design cases below are **not implemented tests or acceptance results**. Actual read-only replay is executed; retained-file arithmetic recheck is distinct from original workbook acquisition. New event semantics cannot be tested as implemented until Phase2 authorization and code exist.

|ID|Case|Expected result|Classification|
|---|---|---|---|
|V01|Actual opening|12 saved transactions rebuild equal;24 ordered legs equal;11 exact positions,cash232420,claims570000,payables0; projection agrees|ACTUAL_READ_ONLY_EXECUTED|
|V02|Cash conservation|93 supplied rows, each rolling balance and year boundary; final327420;17 trade settlement/fee/tax matches;29 event count|RETAINED_EVIDENCE_RECHECK|
|V03|Claim full settlement|Synthetic net95k claim + accepted receipt95k: cash+95k,claim0,newincome0,flow0,basis0|PLANNED_SYNTHETIC|
|V04|Claim partial settlement|40k then55k against95k: residual55k then0; extra1 rejected atomically|PLANNED_SYNTHETIC|
|V05|Duplicate dividend|Same receipt via cash row,API and DIVIDEND_CASH cannot book twice; retry returns existing; changed content conflicts|PLANNED_SYNTHETIC|
|V06|Gross/net tax|Net claim must not clear gross amount; unknown tax stays unknown; gross mode reconciles G=N+T without duplicate tax|PLANNED_SYNTHETIC|
|V07|Opening allocation|GAS475k+MWG95k=570k accepted allocation conserves parent; overlapping or mismatched sums fail|PLANNED_SYNTHETIC|
|V08|Pending conversion|FPT220 aggregate,200 available20pending→220available0pending: aggregate/basis/flow/income unchanged; unknown date fails|PLANNED_SYNTHETIC|
|V09|Entitlement versus transfer|29 historical rows not reimported; pending credit and paired conversion not two economic share credits|PLANNED_SYNTHETIC|
|V10|MWAC|12decimal half-even tie cases; capitalized BUYcost; partialSELL proportional; full exit releases all; settlement no newPnl|PLANNED_EXISTING_REGRESSION_AND_EXTENSION|
|V11|Pre-opening duplicate|17 old trades rejected for this book; same-day date-only ambiguity quarantined; newbook requires separate approval|PLANNED_SYNTHETIC|
|V12|Trade versus settlement|Trade owns quantity/claim effective date; settlement cash once; settled cash cannot spend receivable; no doubleqty from stockstatement|PLANNED_SYNTHETIC|
|V13|Unknown liabilities|0stored payables with source105 debt/unknown resolution remains BLOCKED;500k unknown category never CASH plug|PLANNED_SYNTHETIC_AND_ACTUAL_REVIEW|
|V14|Reversal/correction|Append reversal restores claim/cash, preserves earlier asOf; dependent settlement correctiongroup; downstream funded cash rechecked|PLANNED_SYNTHETIC|
|V15|Concurrency/idempotency|Two concurrent partial settlements against95k cannot overclear; wrong revision fails; business/audit crash rolls all back|PLANNED_ISOLATED_DATABASE_INTEGRATION|
|V16|Missing source/identity|Absent hash,row,scope,eventID or mismatchedissuer blocks; hash tamper fails; ticker/amount alone cannot settle|PLANNED_SYNTHETIC|
|V17|Knowledge future leakage|Effective16Oct knowledge26Oct excluded as-known20Oct; clearly labelled retrospective view allowed; no guessedintradaytime|PLANNED_SYNTHETIC|
|V18|Projection failure|Committed result survives cache failure; projectionSTALE until rebuild; user retry cannot repost|PLANNED_ISOLATED_DATABASE_INTEGRATION|
|V19|Safety/authority|No-login viewing never grants acceptance;0approved mappings; candidatesDEFERRED; NAV/scoring/D2 untouched|PLANNED_SYNTHETIC_AND_SAFETY_CHECK|
|V20|Actual claim linkage|Independent reviewer matches MWGreceipt to exact opening action; GASresidual,500k,105 and FPT lifecycle documentary closure|NOT_EXECUTABLE_MISSING_EVIDENCE|

Actual command executed: `/private/tmp/node-v22.23.2-darwin-arm64/bin/node --loader /private/tmp/m8-accounting-ro-loader.mjs /private/tmp/m8-accounting-ro.mjs`. Helpers are retained in validation/ with exact hashes for reproducibility; they open SQLite with readOnly:true and invoke only buildTransaction/reconstructPortfolio. Initial harness run failed ENOENT resolving directory import shared/errors.ts; loader was corrected to resolve index.ts, then actual replay PASS. This was a harness failure, no accounting gate changed. Node emitted experimental loader/SQLite warnings; no business errors on final run.

Future regression command (NOT RUN in this design task): supported Node `node_modules/vitest/vitest.mjs run tests/unit/portfolio-accounting.test.ts tests/unit/portfolio-command.test.ts tests/unit/portfolio-read-models.test.ts`; future isolated integration suite should add settlement/allocation/status/audit cases and repository compatibility fixtures. Never point write tests at actual SQLite. No synthetic case qualifies real broker/source authority. Exact facts/legs snapshots, corruption rejection and protected-input hashes are required before and after any approved implementation.
