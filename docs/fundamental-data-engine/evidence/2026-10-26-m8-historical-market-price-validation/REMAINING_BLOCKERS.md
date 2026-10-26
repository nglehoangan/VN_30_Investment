# Remaining blockers

1. **TPB_PRICE_HISTORY** — no retained daily bars; needed while held 09/07/2025 through 03/08/2026 close on trade-date basis. Sale receivables through 05–06/08 require their own reconciliation.
2. **EARLY_PRICE_ABSENCE** — VCB/VRE/VHM/FPT held before 20/10/2025; exact intervals in MISSING_PRICE_INTERVALS.md.
3. **HISTORICAL_ADJUSTMENT** — 252 completed-date bars present per retained 11 tickers but historical RAW/adjusted/factor semantics unqualified; quantity series cannot be safely combined wholesale.
4. **FINAL_26OCT_CLOSE** — retained 26/10 bars captured before close, not completed EOD; no substitution with 23/10.
5. **CALENDAR_2025_AND_AUTHORITY** — no qualified 2025 session calendar; 2026 policy remains technical candidate. 2025 weekday counts only diagnostics.
6. **CORPORATE_ACTION_ENTITLEMENTS** — ex-date/record/credit/trading differences, pending rights recognition/value and complete action coverage needed; do not count bonus twice.
7. **FPT_WFT** — missing creation/conversion event/date/identity/valuation policy for 20 pending.
8. **RECEIVABLES_LIABILITIES** — daily cash verified for 484 dates, but not a full obligations history. Broker 07/10 has 500,000 cash-equivalent residual and 105 borrowing; source liability completeness and gross/net definition unresolved. Legacy 570,000 comes from GAS475,000+MWG95,000, not identical-amount VHM570,000 paid July. MWG95,000 received16/10 requires exact event receipt linkage; GAS has no matching receipt through26/10. Fees accrued vs cash-paid and withholding timing not certified.
9. **INCEPTION_UNSETTLED_IDENTITY** — opening inventory not independently certified; buy/sell execution vs posting/cash settlement must preserve unsettled assets/claims. No accepted historical ledger→market identity for all 12, notably disposed TPB.

Operational source acceptance remains separate; absence of authentication must not turn synthetic tests into real acceptance. Technical research can progress with exact evidence but cannot waive missing economic inputs.

**No historical date can presently be independently recomputed as complete NAV without assumptions.** 07/10 is one broker-reported arithmetic-verified snapshot, not a fully reconstructed NAV date. Even cash-only 30/06 lacks independently certified absence of opening securities/obligations. 19/10,21/10,23/10 have technical raw close coverage for the 11 then-held ordinary labels but still fail pending/obligation/identity completeness.

Minimum next work, only after owner review: obtain exact RAW daily prices or documented adjustment factors including TPB and early periods, 2025 calendar, completed26/10 evidence, event/entitlement notices including FPT, and complete obligation/inception statements. No new provider/client, API acquisition or NAV implementation here.
