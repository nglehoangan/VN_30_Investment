# Corporate-action reconciliation

|Instrument|Record date as stated|Pending credit posting|Ordinary-transfer posting|Entitlement ratio as stated|Pending shares|
|---|---|---|---|---|---:|
|TPB|2025-10-31|2025-11-18|2025-11-27|100/5|5|
|HPG|2026-05-26|2026-06-26|2026-07-15|100/10|10|
|VHM|2026-08-07|2026-08-25|2026-09-09|1/1|100|
|SSI|2026-08-18|2026-09-21|2026-10-01|5/1|40|

Each transfer has paired −pending/+ordinary rows and zero net economic quantity transfer; credit, transfer, record and purchase/execution dates are distinct. Entitlement ratio is **not** pending→ordinary conversion ratio. No additional 10/40/100/5 shares is created at transfer after the same credit was already counted.

Record date is not automatically ex-dividend or valuation recognition date. Each record→credit interval is flagged in daily holdings, with exact source event IDs. A price adjustment can precede the account posting; failing to recognize an entitled asset in that interval understates NAV. Source-backed ex-date/entitlement recognition policy and complete event coverage remain needed. FPT handled separately.

Cash dividends: supplied cash file records net receipts, not new external capital. Receipt shifts a verified receivable to cash only when exact event/date/amount linkage exists; do not add cash plus the same receivable after payment. Cash dividends do not automatically reduce frozen accounting cost basis or create shares.

Trade gross + fees, broker displayed average cost and PDF basis differ. COST_BASIS_DIAGNOSTICS.json records actual acquisition cash versus statement-derived cost, without forcing a tie. In TPB, initial buy gross+fee 1,490,447 compared with broker displayed cost 14,194×105=1,490,370 differs 77. Source display precision/adjustment policy requires evidence; no automatic rounding-policy rewrite. Historical extra-share allocation must preserve total established basis under approved policy, not assume newly credited shares have a freely chosen cost.

No corporate-action ledger mutation, historical split adjustment, ex-date inference or basis restatement implemented. Existing source contracts remain unchanged.
