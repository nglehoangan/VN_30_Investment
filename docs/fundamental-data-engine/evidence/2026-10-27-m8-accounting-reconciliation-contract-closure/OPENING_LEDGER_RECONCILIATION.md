# Opening ledger reconciliation

Assessment date: 2026-10-27 (Asia/Ho_Chi_Minh). Phase 1 design/evidence closure only. Owner approved the prior architecture assessment as baseline v1.0 in the current task; this is not authenticated source/identity acceptance or Phase 2 authorization. Original baselines and sealed evidence remain unchanged. SOURCE_REFERENCES.json pins inspected files; JSON Pointers below address those pinned bytes.

Actual read-only domain replay: **PASS**, 12 OPENING_BALANCE transactions, 24 exact original legs, 11 positions. Facts rebuild exactly, saved ordered legs match and projection cash/claims/positions match. See ACTUAL_LEDGER_REPLAY.json. Supported opening is **2026-10-08T11:38:01.705Z**; broker PDF statement is **2026-10-07**, not the same instant.

Opening cash **232420**, receivables **570000**, ledger payables **0** VND. Zero stored payables proves only the stored book, not absence of economic liabilities. Broker statement has borrowing **105**, cash-equivalent **732420**, cash substatement **232420**, securities market value **78183500**, broker NAV **78915815**. The statement equation 78183500 + 732420 − 105 = 78915815 reconciles arithmetically, not to an accepted 08/10 valuation. Cross-date asset component difference 570000 − 500000 + 105 = 70105 is diagnostic only; never a correction amount.

|Original ledger security ID|Quantity|Open basis VND|MWAC VND/share|
|---|---|---|---|
|FPT|220|16065060|73023|
|GAS|200|18535800|92679|
|HPG|110|2585770|23507|
|MBB|100|2010600|20106|
|MWG|100|8332600|83326|
|SSI|240|5742000|23925|
|TCB|100|3521100|35211|
|VCB|100|5761800|57618|
|VHM|200|8782800|43914|
|VPL|100|8232500|82325|
|VRE|100|2410800|24108|

Ten non-FPT quantities and displayed-cost-derived totals match the statement observation. FPT220 includes the economic aggregate of ordinary200 + pending20; comparing ordinary alone shows20/1460460 differences, not missing additional shares. Existing ledger does not encode availability separately. No accepted bridge is implied by ticker-labelled IDs.

Retained opening source: broker snapshot body hash `cc46785ff2d4f7477911d0cb7dad6ee38b872b5cc6a8566a78683637fdf43852`, exact references in prior READ_ONLY_RECONCILIATION.json `/fptTransactions/0` and `/brokerSnapshots`. Original IDs/times/costs retained. No events retained between two observations is **not** proof of no economic events. Require account-complete event/debt/claim/status evidence across07→08 October and onward. A replay-valid opening is not fully economically reconciled or currently complete.
