# Historical NAV cash/trade integration closure

Status: **PARTIAL_EVIDENCE — CASH_RECONCILED, DAILY_NAV_NOT_YET_COMPUTABLE**. Four actual user-supplied XLSX files parsed offline, all original source hashes retained under redacted aliases. No input workbook edited. 17 trades, 93 cash rows, zero rolling-balance discrepancies, exact year-boundary and gross/fee/tax reconciliation. 484 daily cash/component rows generated.

Workbook: outputs/m8-historical-nav-20261026/Historical_NAV_tong_hop.xlsx. Five sheets populated, formulas recalculated, all sheets visually reviewed, no formula errors, cached results checked after export, native cash chart (explicitly not NAV) verified. Personal identifiers removed.

Cash ending 327,420; funding 82,848,881; net dividends 1,434,500. One supported broker historical NAV point remains 07/10 78,915,815. Other daily NAV stays unavailable pending proper historical prices, corporate actions and obligations. Separate conditional 23/10 subtotal is not NAV and is not placed in calculated NAV column. No return/IRR silently substituted.

New dividend evidence distinguishes legacy GAS+MWG 570,000 from unrelated paid VHM 570,000; MWG 95,000 payment 16/10 is recorded without mutating ledger. FPT_WFT event/effective date still unknown. No accepted identity/source created.

Stop after offline synthesis. No external APIs, production DB/migration/import, ledger update, active binding, NAV/D2/scoring activation or milestone advancement.
