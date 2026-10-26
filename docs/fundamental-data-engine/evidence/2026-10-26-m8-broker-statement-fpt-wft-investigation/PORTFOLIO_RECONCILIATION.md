# Portfolio reconciliation

Actual database opened mode=ro. Existing authoritative ledger repository and PortfolioEngine reconstruction are verified separately in LEDGER_REPLAY_RESULTS.json; 12 opening transactions/24 legs, 11 positions, no subsequent ledger events, all quantities/cost/aggregates match original projection. Latest retained ledger projection asOf 2026-10-08T11:38:01.705Z is not a current broker balance.

|Security|07/10 statement ordinary qty|08/10 ledger qty|Statement derived ordinary cost|Ledger open cost|Classification|
|---|---|---|---|---|---|
|GAS|200|200|18535800|18535800|RECONCILED|
|VHM|200|200|8782800|8782800|RECONCILED|
|FPT|200|220|14604600|16065060|CORPORATE_ACTION_PENDING|
|VPL|100|100|8232500|8232500|RECONCILED|
|MWG|100|100|8332600|8332600|RECONCILED|
|VCB|100|100|5761800|5761800|RECONCILED|
|SSI|240|240|5742000|5742000|RECONCILED|
|TCB|100|100|3521100|3521100|RECONCILED|
|VRE|100|100|2410800|2410800|RECONCILED|
|HPG|110|110|2585770|2585770|RECONCILED|
|MBB|100|100|2010600|2010600|RECONCILED|

For FPT keep the separate original pending row: 20, derived cost 1,460,460. Ordinary 200 cost 14,604,600 plus pending 20 cost 1,460,460 equals ledger 220 cost 16,065,060 arithmetically. This reconciles total recorded exposure/basis only, not the legal conversion event, trading availability or economic identity bridge. Other ten quantities and basis RECONCILED on comparison, not proof of no intervening activity.

Explicit temporal bridge:

1. 07/10 private statement: 200 ordinary FPT + 20 FPT_WFT; 11 regular tickers.
2. Original historical imported BROKER_SNAPSHOT has matching pending distinction but metadata holdingsAsOf 30/09, received 07/10. **TIMING_DIFFERENCE / INSUFFICIENT_EVIDENCE**: do not change metadata or infer that it came from this exact PDF.
3. 08/10 source snapshot and 4.14: ordinary available 200, total 220, stockDividend 20. Opening ledger aggregates 220 as FPT, no FPT_WFT or FPT_UNAVAILABLE ledger position. **CORPORATE_ACTION_PENDING** availability detail is not preserved as a distinct security; no lossless legal-event chronology established.
4. Subsequent ledger transactions: none retained beyond 12 OPENING_BALANCE events. No conversion event, buy/sell/dividend receipt or balancing event may be reconstructed from silence. **INSUFFICIENT_EVIDENCE** of external post-opening completeness.
5. 21/10 raw account response: total 220, available 200, stockDividend 20. Not fully available; no source-verified conversion date.
6. 23/10 selected EOD reference (captured 25/10): 30 market price/identity observations only, not a personal positions statement. No use of 07/10 prices as 23/10 prices or use of market capture to prove shares held.
7. Latest retained ledger reconstruction: still 220 FPT, 11 holdings; owner later confirms eventual conversion (OWNER_ATTESTED, date UNKNOWN).

Cash closing 232,420 matches ledger cash numerically (**RECONCILED / TIMING_DIFFERENCE**); cash/equivalent scope difference 70,000 and borrowing/payables 105 remain **INSUFFICIENT_EVIDENCE**, not forced balancing transactions. No confirmed omitted trade is proven; missing transaction documentation remains a possible explanation, not a manufactured MISSING_TRANSACTION finding. See NAV_RECONCILIATION.md.
