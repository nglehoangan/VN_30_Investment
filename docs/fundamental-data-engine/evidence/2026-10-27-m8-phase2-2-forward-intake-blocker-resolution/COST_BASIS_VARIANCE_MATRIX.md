# Cost basis provenance — all11holdings

Assessment: 2026-10-27 Asia/Ho_Chi_Minh. Owner authorizes Phase2.2 isolated implementation and targeted blocker investigation only. No Phase2.3, Current NAV implementation, production posting/migration or acceptance changes.

Purchase basis diagnostic is sum verified BUYgross+fee+tax, before unproven action adjustments. Difference below = acquisition−imported basis. Every trade input row/hash and classification flags are retained in COST_BASIS_VARIANCES.json. No historical rebase or cost adjustment executed.

|Ledger ID|Opening qty|Acquisition cost|Imported basis|Acquisition−imported|
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

Explained arithmetic origin: importer explicitly uses integer broker costPrice×quantity. VPL imported−acquisition=+31 and MBB=−3 quantify display-unit-cost residuals. This explains construction of stored numbers, not the broker rounding methodology or acceptance of MWAC replacement. No tolerance change allowed. FPT ordinary/pending cost sum explains aggregate comparison, not missing original corporate-action basis terms.

No verified purchase row for these supplied buys is missing; initial state and broker basis-adjustment completeness are still unverified. FPT/HPG/SSI/VHM require action/allocation terms; cash-dividend-like differences may reflect broker conventions but are UNPROVEN methodology differences. Matching values alone does not explain them, and approved MWAC does not automatically subtract dividends from acquisition cost. Other acquisition-to-imported deltas remain UNRESOLVED_DISCREPANCY. Exact external request: per-position account basis ledger including all acquisitions, fees/taxes, cash/share actions, precision and rounding policy and opening balances; independent reviewer reconciles against approved decimal12MWAC. All11remain qualified imported observations, not newly accepted lifetime accounting.
