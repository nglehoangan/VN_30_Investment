# VN30 Value Investing OS --- Risk Validation

**Document:** `07_VALIDATION/RISK_VALIDATION.md`\
**Milestone:** M7.5 --- Portfolio / DCA / Risk Validation\
**Status:** Baseline Candidate --- Awaiting User Approval\
**Version:** 0.1\
**Date:** 2026-10-04\
**Parents:** `VALIDATION_STRATEGY.md` v1.0; `TRACEABILITY_MATRIX.md`
v1.0; `ACCOUNTING_VALIDATION.md` v1.0; `DATA_VALIDATION.md` v1.0;
`SCORING_VALIDATION.md` v1.0; `DECISION_ENGINE_VALIDATION.md` v1.0;
`PORTFOLIO_DCA_VALIDATION.md` v1.0

## 1. Objective

Independently validate that risk controls preserve capital discipline
without becoming mechanical price-based trading rules.

This specification validates:

-   hard-veto precedence;
-   residual-risk classification;
-   single-name concentration;
-   sector concentration;
-   hidden-factor concentration;
-   small-NAV exception governance;
-   drawdown measurement and escalation;
-   flow-adjusted drawdown;
-   cash/liquidity controls;
-   risk exception authority;
-   no-margin/no-borrowing;
-   risk review/auditability.

Risk controls may block or reduce new capital even when score/valuation
are attractive. Drawdown alone must not automatically liquidate a
fundamentally valid portfolio.

## 2. Risk precedence

Validation oracle must enforce:

`Mandate → Hard Risk Veto → Evidence/Stage 0 → Thesis → Risk constraints → Valuation/portfolio opportunity → Execution`

A hard veto cannot be overridden by:

-   score;
-   low P/E;
-   price decline;
-   expected return;
-   technical setup;
-   money flow;
-   analyst conviction;
-   current gain/loss;
-   monthly DCA cash;
-   small-NAV status.

## 3. Independent oracle

Expected risk results must be calculated independently from frozen
approved Risk Policy rules.

Production decision/sizing/risk helpers may calculate Actual only.

For each case record:

`pre-risk state → applicable rule/band → exception state → permitted capacity/action → review status`

Boundary Expected values must be manually derived.

## 4. Hard veto validation

Test at least:

-   solvency/going-concern failure;
-   material governance/accounting integrity failure;
-   mandate ineligibility for new capital;
-   unresolved severe evidence conflict;
-   prohibited leverage/borrowing;
-   any approved Ownership Veto;
-   any approved Capital-Allocation Veto.

Required invariants:

-   capital-allocation veto → no new capital;
-   ownership veto → no continued ownership authorization except
    operationally staged exit;
-   unresolved possible veto → no optimistic capital authorization;
-   high score/large MOS cannot compensate;
-   execution delay cannot rewrite the economic risk conclusion.

A veto-precedence defect capable of materially wrong BUY/SELL is
Critical.

## 5. Residual-risk taxonomy

Validate every approved residual-risk state and its allowed downstream
actions.

Key requirements:

-   residual risk is distinct from score;
-   STRONG BUY permits only LOW/MODERATE residual risk under approved
    rules;
-   unacceptable residual risk blocks new capital;
-   risk cannot be silently downgraded because valuation improves;
-   missing risk evidence cannot default to LOW;
-   risk classification retains evidence and methodology lineage.

Metamorphic case: lower price with unchanged issuer risk evidence must
not reduce residual-risk classification.

## 6. Single-name concentration

Frozen policy bands:

-   0--10% NAV: Normal;

-   10--15%: Elevated; justification required;

-   15%: normally no additional capital;

-   20%: strategic ceiling under normal conditions;

-   20%: no-add + CIO/Risk review;

-   25%: normally REDUCE plan unless approved exception.

M7 must verify exact boundary inclusivity from the frozen baseline.

Required points around each material threshold: `threshold−ε`,
`threshold`, `threshold+ε`.

Critical invariant: as current exposure rises, permitted incremental
risk capacity must never increase solely because a concentration
boundary was crossed.

## 7. Small-NAV board-lot exception

This is a temporary execution exception, not a target allocation.

Required conditions include approved evidence such as:

-   explicit pre-trade approval;
-   documented rationale;
-   normalization plan;
-   no further add while above the applicable no-add threshold;
-   emergency ceiling 30%;
-   exception expiry/review governance.

Mandatory cases:

-   missing approval → normal clipping/no trade;

-   missing normalization plan → no exception;

-   30% exact boundary → verify approved inclusivity;

-   30% → never authorized by small-NAV exception;

-   already \>15% → no ordinary further add;

-   small NAV alone → insufficient;

-   cheaper price/strong score → cannot create exception.

Exception authority must be explicit and auditable; AI cannot
self-approve it.

## 8. Sector concentration

Frozen policy bands:

-   0--25%: Normal;

-   25--30%: Elevated;

-   30--35%: High concentration; normally no new capital;

-   35--40%: CIO/Risk review + explicit approval for new capital;

-   40%: provisional normal-condition ceiling.

Validate threshold−ε / exact / threshold+ε at 25%, 30%, 35%, 40%.

Sector headroom must be computed from effective-dated sector
classification and projected post-trade exposure.

Current sector labels cannot rewrite historical risk.

## 9. Hidden-factor concentration

Formal sector diversification is insufficient when holdings share
material correlated risks.

Validation cases include:

-   multiple banks with common credit/property exposure;
-   property developer plus bank exposure to same real-estate cycle;
-   exporters sharing FX/global-demand factor;
-   companies with common controlling-group/governance dependency where
    evidenced.

Required behavior:

-   hidden-factor evidence may reduce/block add capacity;
-   absence of a formal sector breach does not authorize a correlated
    add;
-   hidden-factor concern requires evidence, not narrative invention;
-   missing correlation evidence must not be fabricated as safe.

## 10. Portfolio drawdown doctrine

The \~20% portfolio drawdown objective is a risk-management target, not
a guaranteed hard maximum and not a mechanical stop-loss.

Required behavior:

-   rising drawdown triggers review/escalation/restriction according to
    approved bands;
-   drawdown can block new risk pending approval;
-   drawdown alone does not automatically SELL good holdings;
-   individual thesis/risk/valuation still governs ownership;
-   a −25% portfolio drawdown is not blanket liquidation authority;
-   explicit risk approval may be required before adding in a critical
    regime.

This closes the behavioral risk of selling merely because prices fell.

## 11. Flow-adjusted drawdown

This is an open M7 traceability obligation and must receive independent
proof.

Raw NAV change is invalid when external cash flows occur.

Validation must construct a return/NAV path containing:

-   opening NAV;
-   market gain/loss before contribution;
-   contribution;
-   market gain/loss after contribution;
-   withdrawal;
-   subsequent market movement.

The oracle must isolate investment performance from external flows using
the exact approved flow-timing convention.

Required invariants:

-   contribution alone cannot improve investment performance;
-   withdrawal alone cannot create investment loss;
-   identical market returns with different contribution sizes produce
    equivalent flow-adjusted performance under equivalent timing;
-   contribution timing is explicit;
-   flow-adjusted peak/trough is reproducible;
-   raw NAV drawdown and flow-adjusted drawdown are not conflated.

If no approved deterministic flow-timing convention exists for a
scenario, result is `NOT VALIDATED / POLICY CLARIFICATION REQUIRED`,
never an invented formula.

A material flow-adjustment error affecting drawdown regime is Critical.

## 12. Drawdown boundary matrix

For every approved drawdown regime, test:

-   just before threshold;
-   exact threshold;
-   just beyond threshold;
-   recovery across threshold;
-   contribution at boundary;
-   withdrawal at boundary;
-   stale NAV/price evidence;
-   missing peak reference.

Expected output must include:

-   drawdown value;
-   regime;
-   new-risk permission;
-   approval requirement;
-   review status;
-   no automatic ownership liquidation unless independent issuer rules
    require it.

## 13. Cash/liquidity risk

Validate the approved liquidity/cash guideline, including the 5%
cash-liquidity guideline where applicable.

Important distinction:

-   guideline ≠ unconditional hard minimum unless frozen policy says so;
-   reserved/unsettled cash cannot satisfy executable liquidity;
-   maintaining liquidity cannot require leverage;
-   cash retained for lot accumulation remains cash;
-   risk system cannot force purchase merely to avoid "too much cash."

## 14. No leverage

Mandatory negative cases:

-   margin loan;
-   negative settled cash caused by purchase;
-   borrowed cash disguised as contribution;
-   unsettled sale proceeds used prematurely;
-   future dividend/receivable treated as spendable;
-   exception attempting to waive no-margin rule.

No risk exception may authorize leverage.

## 15. Risk exceptions

Every exception requires:

-   exact governing rule;
-   reason;
-   scope;
-   approver/approval reference where required;
-   effective date;
-   expiry/review condition;
-   normalization/remediation plan where required;
-   affected security/portfolio;
-   evidence refs.

Forbidden:

-   implicit exception;
-   AI self-approval;
-   retroactive approval to make a historical trade compliant;
-   one exception reused outside scope;
-   stale approval reused after material state change;
-   exception increasing limits beyond explicit emergency ceiling.

## 16. Thesis vs drawdown

Construct paired cases:

**Case A:** portfolio −25%, issuer thesis intact, balance sheet healthy,
valuation improved, no veto.\
Expected: review/escalation/new-risk restrictions as policy requires; no
automatic SELL solely from drawdown.

**Case B:** portfolio −5%, issuer thesis BROKEN.\
Expected: SELL/reduction logic proceeds despite small portfolio
drawdown.

This proves risk is thesis-aware and not price-stop driven.

## 17. Concentration projection

Every proposed add must use post-trade exposure.

Independent oracle calculates:

`post_position_weight = post_position_value / post_trade_NAV`

and equivalent sector/factor exposure using the approved treatment of
fees/cash.

Required:

-   pre-trade under limit but post-trade over limit → clip/block;
-   exact permitted capacity → no upward lot rounding;
-   one unit above capacity → zero/next lower executable lot;
-   sequential lots recompute capacity after each lot;
-   stale price/NAV → no confident capacity.

## 18. Flow/price stress cases

Risk validation is not a VaR optimization exercise. Use deterministic
stresses to test controls:

-   broad market −10/−20/−30%;
-   one holding −40% with intact thesis;
-   one holding −40% with broken thesis;
-   sector shock;
-   liquidity/price unavailable;
-   contribution during selloff;
-   large withdrawal during drawdown;
-   correlated holdings falling together.

Expected output is rule behavior and review/actionability, not a promise
that portfolio drawdown remains \<=20%.

## 19. Golden risk portfolio

Build an independent portfolio with:

-   at least four holdings across \>=2 formal sectors;
-   one hidden-factor overlap;
-   one position at a single-name boundary;
-   one sector near a boundary;
-   settled cash;
-   explicit peak NAV and external-flow history.

Manually calculate:

-   current weights;
-   sector weights;
-   factor exposure;
-   permitted incremental capacity;
-   flow-adjusted drawdown;
-   drawdown regime;
-   approval requirements;
-   result of one proposed lot.

No production risk/sizing helper may calculate Expected.

## 20. Metamorphic tests

**RM-01 Price-only decline:** does not repair issuer residual risk.

**RM-02 Contribution neutrality:** contribution alone does not improve
flow-adjusted performance.

**RM-03 Withdrawal neutrality:** withdrawal alone does not create
investment loss.

**RM-04 Score mutation:** score increase cannot override veto.

**RM-05 Valuation mutation:** cheaper valuation cannot expand hard
concentration cap.

**RM-06 Sector-label history:** current reclassification cannot change
frozen historical concentration.

**RM-07 Lot permutation:** sequential risk capacity follows projected
state, not order artifacts.

**RM-08 Exception removal:** removing approval cannot increase permitted
capacity.

**RM-09 Drawdown-only ownership:** changing only portfolio drawdown
cannot automatically invalidate an intact issuer thesis.

**RM-10 Evidence removal:** missing risk evidence cannot improve risk
state.

## 21. Mutation tests

Kill mutations that:

-   allow score to override veto;
-   classify missing risk as LOW;
-   increase capacity after crossing 15%;
-   authorize \>30% small-NAV exception;
-   ignore sector cap;
-   ignore hidden-factor block;
-   compute drawdown from raw NAV across contributions;
-   treat contribution as profit;
-   auto-SELL at −20/−25%;
-   permit new risk in critical drawdown without required approval;
-   allow AI-generated exception approval;
-   use unsettled cash;
-   round lot above risk capacity;
-   use current sector for historical risk.

## 22. Evidence requirements

Each release-critical risk case records:

-   case/rule ID;
-   baseline hash/version;
-   implementation SHA;
-   portfolio snapshot/watermark;
-   prices/as-of;
-   external-flow history;
-   peak reference;
-   sector/reference version;
-   exception/approval record;
-   independent Expected;
-   Actual;
-   boundary calculation;
-   disposition/review status;
-   logs/artifacts;
-   reviewer/time;
-   issue/remediation.

Critical risk rules require E3 evidence.

## 23. Gate 6 Risk PASS

Full Gate 6 PASS requires both `PORTFOLIO_DCA_VALIDATION.md` and this
file to pass.

Risk portion requires:

-   hard-veto precedence proven;
-   residual-risk behavior proven;
-   single-name boundaries proven;
-   sector boundaries proven;
-   hidden-factor controls proven;
-   small-NAV exception bounded/governed;
-   drawdown regimes proven;
-   flow-adjusted drawdown independently proven;
-   no mechanical stop-loss behavior;
-   no leverage;
-   risk exceptions explicit and scoped;
-   post-trade capacity correct;
-   golden risk portfolio matches Actual;
-   required mutations detected;
-   zero unresolved Critical/Major risk defects.

## 24. Current source-review findings

**RV-F01 --- Flow-adjusted drawdown remains an explicit open
dependency.** Prior M7 traceability marked it PARTIAL. Gate 6 cannot
PASS until the exact approved convention is independently demonstrated
against cash-flow cases.

**RV-F02 --- Existing M6 regression confirms the intended non-stop-loss
behavior.** A critical drawdown blocks new risk without automatically
liquidating an intact holding; explicit risk approval may restore add
authority. This is supporting evidence, not independent certification.

**RV-F03 --- Existing M6 tests enforce monotonic single-name capacity
around 10/15/20% boundaries.** M7 must independently reproduce Expected
values and also cover sector/factor boundaries.

**RV-F04 --- Source-path discovery for some risk documents/code requires
manifest resolution.** The initial repository paths queried for
`RISK_POLICY.md`, `PORTFOLIO_RISK_REVIEW.md`, and a standalone `risk.ts`
did not resolve, while approved rules are referenced by M4/M7 baselines
and risk behavior is present in decision/workflow tests. Before E3
execution, the Baseline Manifest must resolve exact authoritative
repository paths/blob SHAs. This is a validation dependency, not
permission to infer code correctness.

**RV-F05 --- No historical validation authorization.** Gate 6
specification completion does not authorize M7.6 until deterministic
accounting/data/scoring/decision/portfolio/risk execution gates are
satisfied.

## 25. Multi-role review

-   **CIO --- PASS:** drawdown controls risk appetite without replacing
    fundamental ownership logic.
-   **Portfolio Manager --- PASS:** concentration, cash and exception
    mechanics are actionable.
-   **Independent Model Validator --- PASS:** flow-adjustment and
    boundary controls are independently falsifiable.
-   **Quantitative Analyst --- PASS:** deterministic boundary and flow
    cases avoid outcome fitting.
-   **Risk Manager --- PASS:** veto and emergency ceilings remain
    superior to return/score.
-   **Behavioral Finance Reviewer --- PASS:** no mechanical panic
    selling or averaging-down shortcut.
-   **QA Lead --- PASS:** adversarial, boundary, metamorphic and
    mutation suites cover material risk failures.

**Critical unresolved in this validation specification: 0.**\
**Major unresolved in this validation specification: 0.**

Open evidence dependencies: exact manifest resolution and independent
flow-adjusted drawdown execution.

Gate 6 is **not yet declared PASS**.

## 26. Approval Gate

**Document state:** `BASELINE CANDIDATE — READY FOR USER APPROVAL`

On explicit approval:

1.  promote `RISK_VALIDATION.md` to **Approved Baseline v1.0**;
2.  M7.5 validation specification set becomes complete;
3.  proceed only to `07_VALIDATION/HISTORICAL_VALIDATION_PLAN.md`;
4.  planning the historical protocol does **not** authorize running
    historical validation;
5.  M7.6 execution remains blocked until prerequisite deterministic
    gates/evidence are satisfied.
