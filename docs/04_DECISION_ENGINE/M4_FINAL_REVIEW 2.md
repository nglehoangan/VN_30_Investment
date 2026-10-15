# Milestone 4 — Final Cross-File Review

**Project:** VN30 Value Investing OS  
**Milestone:** 4 — Buy / Hold / Sell Decision Engine  
**Review Status:** FINAL  
**Review Date:** 2026-09-07

## Files Reviewed

1. DECISION_ENGINE.md v1.0
2. BUY_RULES.md v1.0
3. SELL_RULES.md v1.0
4. DCA_RULES.md v1.0
5. POSITION_SIZING.md v1.0
6. OPPORTUNITY_COST.md v1.0
7. DECISION_TEMPLATE.md v1.0
8. VALIDATION_CASES.md v1.0

## Five-Role Final Review

| Role | Final Score | Critical | Major |
|---|---:|---:|---:|
| CIO | 9.9/10 | 0 | 0 |
| Portfolio Manager | 9.9/10 | 0 | 0 |
| Equity Research Analyst | 9.9/10 | 0 | 0 |
| Risk Manager | 9.9/10 | 0 | 0 |
| Behavioral Finance Reviewer | 9.9/10 | 0 | 0 |

## Cross-File Invariants Verified

- Exactly seven Decision States are used.
- Score does not directly map to Decision State.
- Current VN30 eligibility governs new capital.
- Legacy Holdings receive no new capital.
- LOW confidence cannot authorize new capital.
- Normal BUY hurdle remains >=15% expected 5Y annualized total return.
- 12% to <15% remains an explicit exceptional BUY range only.
- STRONG BUY remains rare and normally requires >=18% expected 5Y annualized return plus HIGH confidence and stronger quality/risk conditions.
- Thesis BROKEN blocks averaging down and normally routes owned positions to SELL.
- Ownership Veto requires zero target ownership.
- Capital-Allocation Veto blocks new capital without automatically forcing SELL.
- +20% gain is a review trigger, not automatic profit-taking.
- Price decline alone is never a BUY trigger.
- Portfolio drawdown is an escalation framework, not a mechanical stop-loss.
- >15% single-name exposure normally blocks additional capital.
- Small-NAV lot exception retains the 30% emergency ceiling and explicit approval requirement.
- Sector/correlation concentration can block or clip sizing.
- Cash is a valid positive allocation outcome.
- Board-lot/cash feasibility does not mutate underlying economic Decision State.
- Technical analysis affects execution timing only.
- Incremental-capital allocation is separated from existing-capital switching.
- <=2pp expected-return difference is a provisional materiality/tie guide.
- >=3pp expected-return advantage is a provisional anti-churn switch hurdle, subject to uncertainty/friction.
- REDUCE and SELL remain semantically distinct.
- Mandatory exits are not blocked by replacement affordability.
- Decision outputs preserve auditability, as-of dates, approvals, exceptions, thesis break conditions, and portfolio context.
- Validation suite distinguishes DETERMINISTIC / ROUTING / CONTROL cases and maintains a Critical Case Register.

## Issue Resolved During Final Review

**Major — Version/source-of-truth metadata inconsistency**

Several approved files retained stale labels such as `Draft for Review`, `Approved`, or duplicated status/version headers. This could cause later implementation to misidentify which document is the binding baseline.

**Resolution:** The final M4 baseline copies were normalized to:
- `Status: Approved Baseline v1.0`
- `Version: 1.0`

No decision semantics were changed by this metadata correction.

## Final Assessment

**Critical unresolved:** 0  
**Major unresolved:** 0

Milestone 4 design/documentation is internally consistent and ready to be considered complete after this final review.

Per project governance, do not begin Milestone 5 until the user explicitly approves moving forward.
