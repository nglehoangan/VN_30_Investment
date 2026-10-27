# Opening boundary protection

Assessment: 2026-10-27 Asia/Ho_Chi_Minh. Owner authorizes Phase2.2 isolated implementation and targeted blocker investigation only. No Phase2.3, Current NAV implementation, production posting/migration or acceptance changes.

Actual portfolio boundary from ledger:2026-10-08T11:38:01.705Z, not invented00:00 or end-of-day08/10. Intake reads authoritative portfolio.inceptionAt; tests use their own synthetic inception. Both eventAt and effectiveAt must be strictly later. Source effective instant must equal command effectiveAt. Same-day date-only evidence or any date-only input is BLOCKED with EXACT_EFFECTIVE_INSTANT_REQUIRED; no intraday guessing.

17 retained historical trades and29 securities rows remain research evidence, not forward imports. Original opening reversal is explicitly excluded from intake. Before-opening dividends/cash/corporate credits already represented in opening cannot be reposted. A post-opening settlement of an earlier trade cannot be fabricated as a fresh BUY/SELL; existing trade/claim linkage must be supported by existing contracts. Current TRADE_SETTLEMENT only clears actual BUY/SELL, while Phase2.1 explicitly clears allocated opening dividend claims.

Knowledge ≤ retrieval ≤ posting clock; event cannot be future relative to knowledge, effect cannot be future relative to clock. Evidence export/retrieval never becomes historical AS_KNOWN proof. Pure legacy replay remains retrospective economic replay, not a bitemporal access API. No historical knowledge upgrade, opening mutation or rebase occurs.
