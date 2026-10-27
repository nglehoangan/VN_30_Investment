# Holdings and cost basis reconciliation

Assessment date: 2026-10-27 (Asia/Ho_Chi_Minh). Phase 1 design/evidence closure only. Owner approved the prior architecture assessment as baseline v1.0 in the current task; this is not authenticated source/identity acceptance or Phase 2 authorization. Original baselines and sealed evidence remain unchanged. SOURCE_REFERENCES.json pins inspected files; JSON Pointers below address those pinned bytes.

All17 trades and29 securities events inspected. Purchase fees/taxes are in acquisition basis; SELL proceeds net of fees/taxes minus released MWAC gives realized P&L once. Exact12-decimal half-even only at division boundaries; full exit releases remaining basis exactly. Settlement never changes basis again. No broker displayed average-cost rounding is imported as authoritative policy.

Below is an **offline diagnostic**, verified BUY gross+fees+tax before unproven corporate-action/basis changes versus imported opening basis. These eleven surviving names have no supplied SELLs. Quantity credit with conserved total basis is the comparison scenario, not an accepted historical rebase; FPT additional20 creation is not evidenced. See COST_BASIS_DIAGNOSTICS.json and pinned TRADES.json row references.

|Security|Opening qty|Sum BUY cost VND|Imported basis VND|BUY cost − opening|
|---|---|---|---|---|
|FPT|220|16264878|16065060|199818|
|GAS|200|19035709|18535800|499909|
|HPG|110|2635790|2585770|50020|
|MBB|100|2010603|2010600|3|
|MWG|100|8532559|8332600|199959|
|SSI|240|5941782|5742000|199782|
|TCB|100|3591077|3521100|69977|
|VCB|100|5851755|5761800|89955|
|VHM|200|9382814|8782800|600014|
|VPL|100|8232469|8232500|-31|
|VRE|100|2510753|2410800|99953|

No difference is automatically explained by dividends, amount similarity, a rounding convention or broker corporate-action policy. VPL31 and MBB−3 are small but exact unexplained differences; do not change MWAC tolerance. FPT raw purchase total and imported aggregate differ; broker pending cost is an allocation observation, not authorization to increase total cost. GAS/MWG/VHM differences need full broker basis-action history; cash-dividend reductions must not be introduced into approved MWAC merely because broker display appears different. Net cash dividend is not automatically an acquisition-cost reduction.

29-event quantity replay reaches the11 ordinary statement quantities (including corporate credits HPG10, SSI40, VHM100); TPB100+5 fully sold, residual0. Pending TPB/HPG/SSI/VHM conversion pairs net economic quantity0 after credited entitlement; each pair retains exact broker posting dates, not inferred legal dates. FPT200 ordinary matches, FPT_WFT20 creation absent in those29 events. Initial zero ownership remains reverse-implied, not independently certified.

TPB diagnostic: BUY1490447, credited5 under a basis-conserving scenario gives105 shares; two sales100 and5 release all1490447. Gross proceeds1532000−fees459−tax4032−basis1490447 = **37062** realized under that scenario. This is pre-opening research, not realized P&L of the imported08/10 book (which has no trades). Broker displayed14194 is not exact approved MWAC. Tax3960 on the100-share sale includes the separately retained2500 component; do not replace it with guessed0.1% only.

Opening basis can support forward MWAC only within supported-inception qualification and unresolved source discrepancies. Reconstructing lifetime basis requires exact starting state, accepted action terms, all fees/taxes and revisions. Do not append17 pre-opening trades on top of imported holdings. None of these diagnostic deltas becomes a ledger adjustment.
