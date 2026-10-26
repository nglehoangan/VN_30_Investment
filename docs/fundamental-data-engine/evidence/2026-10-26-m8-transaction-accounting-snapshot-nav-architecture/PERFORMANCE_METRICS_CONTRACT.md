# Proposed performance metrics contract

Each metric returns value or null, unit, asOf/period, supported-history scope, input snapshot/flow hashes, method/version, coverage and exact unavailable reasons. Readiness is per metric, not one global performance PASS. This document proposes methods for owner review; no solver or metric code implemented.

|Metric|Minimum evidence|Rule / unavailable behavior|
|---|---|---|
|Net contributions|Complete scoped external funding/withdrawal facts since declared start|Deposits−withdrawals; opening migration/internal trades/dividend receipt excluded|
|Realized trading P&L|Verified opening basis + complete executed trades, fees/taxes, actions and corrections|Approved exact MWAC, supported-period label; no daily prices required|
|Unrealized P&L|Qualified current valued positions and correct open basis/claim coverage|Market value−open basis on comparable scope; missing price/basis blocks metric|
|Total absolute economic change|Qualified beginning and ending NAV + all external interval flows, same perimeter|End NAV−begin NAV−net external flows; VND change, not investment return or annual-objective evidence|
|P&L bridge|Compatible start/end realized/unrealized, dividends, expenses and explicit other action economics|Reconcile increments without double adding dividends already in NAV or fees already in MWAC/P&L; disclose residual, no plug|
|XIRR|Dated complete investor flows and valid terminal snapshot|No daily NAV required; imported period needs a valid opening value if used as initial investor outflow; missing terminal/scope/inception blocks|
|Snapshot interval return|Two comparable accepted endpoints, known capital flow handling|No external flows: V1/V0−1 for positive V0. With flows: official return unavailable absent approved flow-time unitization; do not use raw NAV growth or ad hoc net-flow ratio|
|TWR / unitized return|Approved flow-adjusted convention with required valuations at external-flow boundaries and linked units|Sparse arbitrary endpoints alone insufficient. Flow-time snapshots may suffice without every daily point, only when exact approved method/data exists|
|Observed drawdown|Comparable flow-adjusted/unitized valid snapshot samples and observed HWM|Index/HWM−1 on observed set; sampling/period disclosure; incomplete peak/trough coverage prevents claiming true continuous max drawdown|
|Benchmark/long-term CAGR|Compatible approved total-return benchmark, comparable return method, complete relevant endpoints/history|Optional enhancement; no target15–20% or alpha claim from raw NAV bridge/XIRR|

XIRR proposed numeric convention for review (D5): dated investor flows c<0 for external contributions, c>0 for withdrawals, plus terminal NAV as c>0 at valuation date; solve Σ c_i/(1+r)^((d_i−d0)/365)=0 with actual dates/365 fixed, domain r>−1, deterministic precision/tolerance and convergence rules to be separately approved. Aggregate same-day flows consistently, reject terminal-date future flows, mismatched perimeter, no sign change/no valid solution/nonunique roots. Do not pick an arbitrary root or annualize a missing/zero period; short-period annualized results must disclose sensitivity and cannot certify the long-term target. No investment buy/sell/dividend cash item enters external flow twice.

A withdrawal of sale cash is an investor flow only when it leaves the perimeter. Dividend cash held/reinvested is already in terminal assets; not a second investor inflow. If an imported beginning snapshot is used, include only external flows after its valuation time and negative beginning NAV, not the entire earlier lifetime deposit stream. No opening-cost proxy for beginning NAV.

Observed drawdown needs cash-flow adjustment even for snapshots. If units cannot be formed because intervening flow-time marks are missing, report observedDrawdown=null/INSUFFICIENT_FLOW_ADJUSTMENT, not raw snapshot ratios. For valid observed units, absolute observed maximum drawdown is a lower bound on loss magnitude across the unsampled path, not proof the policy limit was never crossed. Risk policy adoption/threshold application requires explicit D5 amendment; no automatic NORMAL.

No Modified Dietz, interpolation, synthetic closes, daily volatility/Sharpe/VaR, lifetime result, manager alpha or benchmark substitute is silently introduced. Financial availability improvements cannot activate source/identity acceptance or scoring.
