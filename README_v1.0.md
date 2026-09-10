# VN30 Value Investing OS

**Document:** README.md  
**Milestone:** 1 — Investment Constitution  
**Status:** Milestone 1 Baseline — Complete  
**Version:** 1.0  
**Date:** 2026-09-04  

## 1. Project Overview

VN30 Value Investing OS is a long-term portfolio-management system for investing only in VN30 constituents using a disciplined Value Investing framework.

The system is designed to support:

- long-term holding periods of 5–10 years or longer;
- a target portfolio total-return CAGR of approximately 15%–20% over a full investment cycle;
- no margin or leverage;
- selective DCA rather than forced monthly deployment;
- portfolio-level drawdown discipline;
- thesis-driven adding rather than mechanical averaging down;
- sector-aware analysis across banks, real estate, retail, technology, and other VN30 industries;
- explicit separation between business quality, intrinsic value, market price, risk, and portfolio action.

The system is intended to operate as an **AI Portfolio Manager** with CIO, Portfolio Manager, Equity Research, Risk Management, and Investment System Architecture responsibilities.

---

## 2. Milestone 1 Objective

Milestone 1 establishes the **Investment Constitution** of the project.

It defines the rules that future portfolio data models, scoring engines, dashboards, workflows, and automation must obey.

Milestone 1 is complete only when the following baseline documents are internally consistent and approved:

- `INVESTMENT_POLICY.md`
- `DECISION_FRAMEWORK.md`
- `RISK_POLICY.md`
- `SCORING_MODEL.md`
- `SYSTEM_PROMPT.md`
- `README.md`

No future milestone may silently weaken these rules.

---

## 3. Approved Milestone 1 Documents

### `INVESTMENT_POLICY.md` — v1.1

Defines the highest-level investment philosophy and constitutional rules.

Key responsibilities:

- VN30-only mandate;
- long-term Value Investing objective;
- return target;
- capital-preservation hierarchy;
- no margin;
- optional DCA;
- cash discipline;
- long holding horizon;
- thesis-based adding;
- no mechanical profit-taking;
- behavioral discipline;
- document authority.

### `RISK_POLICY.md` — v1.0

Defines the authoritative risk boundaries and escalation rules.

Key responsibilities:

- drawdown rules;
- single-name concentration;
- sector concentration;
- small-NAV / board-lot exceptions;
- cash / liquidity discipline;
- residual-risk taxonomy;
- hard vetoes;
- STOP-BUY rules;
- mandatory thesis-review triggers;
- forward-return hurdles;
- exception governance.

### `DECISION_FRAMEWORK.md` — v1.0

Defines how a real stock decision is made.

Required flow:

> Stage 0  
> → Business Quality  
> → Financial Health  
> → Growth Quality  
> → Industry & Competitive Position  
> → Valuation & Forward Return  
> → Full Risk Analysis  
> → Market / Money Flow  
> → Technical Entry  
> → Portfolio Impact  
> → Opportunity Cost  
> → Final Decision

Final Decision States:

- STRONG BUY
- BUY
- ACCUMULATE
- HOLD
- REDUCE
- SELL
- AVOID

The framework also defines:

- ownership-aware state semantics;
- execution sub-status;
- Provisional HOLD;
- Stage 0 outcomes;
- actionable-state requirements;
- residual-thesis logic;
- switching hurdle;
- final decision record.

### `SCORING_MODEL.md` — v1.0

Defines the 100-point cross-sector scoring model.

Weights:

| Category | Weight |
|---|---:|
| Business Quality | 25 |
| Financial Health | 15 |
| Growth Quality | 15 |
| Industry & Competitive Position | 10 |
| Valuation & Forward Return | 20 |
| Risk & Governance | 10 |
| Capital Allocation Quality | 5 |
| **Total** | **100** |

The score is decision support only.

It cannot override:

- Stage 0;
- Risk Policy;
- portfolio constraints;
- ownership state;
- final qualitative judgment.

The model includes sector-aware rules for banks, property, retail, technology, and other sectors through principle-equivalent metrics.

### `SYSTEM_PROMPT.md` — v1.0

Operational synthesis used by the AI Portfolio Manager.

It converts the approved source documents into an executable operating instruction set.

The System Prompt does not create independent investment authority.

If it conflicts with another approved document, the higher-authority source document wins.

---

## 4. Document Authority Hierarchy

When rules conflict, apply this hierarchy:

1. `INVESTMENT_POLICY.md`
2. `RISK_POLICY.md`
3. `DECISION_FRAMEWORK.md`
4. `SCORING_MODEL.md`
5. `SYSTEM_PROMPT.md`
6. Implementation workflows / dashboards / automation

A lower-level document may operationalize a higher-level rule, but may not silently override it.

Any material change to a higher-level document requires review of all dependent documents.

---

## 5. Core Investment Principles

The system must always preserve the following:

### Business before price

A low P/E, low P/B, or falling share price does not mean a stock is cheap.

### Risk before return optimization

The hierarchy is:

1. mandate compliance;
2. avoid unacceptable permanent capital loss;
3. preserve portfolio resilience and liquidity;
4. optimize long-term forward return.

### No leverage

If cash is insufficient:

> wait.

### DCA is optional

Monthly contributions are capital inflow, not a requirement to buy.

### No mechanical averaging down

Every add requires fresh underwriting.

### No mechanical profit-taking

A 20% gain triggers review, not SELL.

### Forward return matters more than historical P/L

The system asks:

> Is continued ownership attractive from today's price?

not:

> How much profit or loss is currently showing?

---

## 6. Standard Stock-Review Workflow

### Step 0 — Eligibility / Investability / Veto

Determine:

- current VN30 eligibility;
- basic business viability;
- minimum financial health;
- governance/reporting reliability;
- evidence sufficiency;
- Risk Policy veto status.

Produce one Composite Stage 0 Outcome.

### Step 1 — Business Quality

Evaluate:

- economics;
- moat;
- earnings quality;
- resilience.

### Step 2 — Financial Health

Evaluate:

- balance sheet;
- liquidity;
- funding;
- stress survivability.

### Step 3 — Growth Quality

Evaluate:

- historical growth;
- forward runway;
- incremental returns.

### Step 4 — Industry

Evaluate:

- industry structure;
- competitive position;
- cycle position.

### Step 5 — Valuation

Estimate:

- intrinsic-value range;
- expected 5-year annualized total return;
- downside case;
- margin of safety.

### Step 6 — Risk

Classify residual risk:

- LOW
- MODERATE
- ELEVATED
- HIGH
- UNACCEPTABLE

### Step 7 — Market / Money Flow

Use only as secondary context.

### Step 8 — Technical Entry

Use only for execution timing and staging.

### Step 9 — Portfolio Impact

Check:

- current position size;
- sector exposure;
- cash;
- drawdown;
- concentration;
- STOP-BUY conditions.

### Step 10 — Opportunity Cost

Compare:

- new cash alternatives;
- existing holdings;
- switching hurdle;
- cash.

### Step 11 — Final Decision

Assign exactly one Decision State and an execution plan.

---

## 7. Decision-State Semantics

### STRONG BUY

Rare, exceptional opportunity with high confidence, acceptable portfolio capacity, strong score, and LOW/MODERATE residual risk.

For an owned stock:

> exceptional add-capital state above ACCUMULATE.

### BUY

Unowned security only.

Means:

> initiate a position.

### ACCUMULATE

Owned security only.

Means:

> add capital after fresh underwriting.

### HOLD

Owned security only.

Means:

> continued ownership remains justified.

### REDUCE

Means:

> smaller position is preferable but residual ownership thesis remains defensible.

### SELL

Means:

> zero position is preferable or policy requires exit.

### AVOID

Unowned security only.

Always state the reason.

---

## 8. Risk Framework Summary

### Drawdown

Cash-flow-adjusted portfolio drawdown bands:

- NORMAL: `DD > -10%`
- WATCH: `-15% < DD ≤ -10%`
- ELEVATED: `-20% < DD ≤ -15%`
- CRITICAL: `-25% < DD ≤ -20%`
- SEVERE: `DD ≤ -25%`

The 20% level is an escalation threshold, not an automatic stop-loss.

### Single-name concentration

Normal strategic framework:

- ≤10% NAV: normal
- >10–15%: elevated
- >15%: normally no-add
- 20%: strategic ceiling under normal conditions

Small-NAV board-lot exception:

- requires explicit user approval;
- absolute emergency ceiling = 30% NAV.

### Sector concentration

Provisional framework:

- ≤25%: normal
- >25–30%: elevated
- >30–35%: high
- >35–40%: mandatory review
- 40%: provisional sector ceiling

Sector parameters are subject to later empirical calibration.

---

## 9. Return Hurdles

Expected 5-year annualized total return:

- **15%+**: normal BUY hurdle
- **12%–15%**: exceptional zone only
- **<12%**: normally insufficient for new capital

Lower-quality or higher-risk companies require higher hurdles.

A BUY below 15% must be explicitly flagged:

> `Hurdle Exception = YES`

---

## 10. Scoring and Ranking

The scoring system ranks the opportunity set but does not mechanically determine portfolio action.

Only:

> `Score Validity Status = VALID — ACTIONABLE`

may enter the investable Top-10.

Other statuses:

- VALID — NON-ACTIONABLE
- RESEARCH ONLY
- NOT RELIABLY SCORABLE

Differences of 1–2 points are normally treated as effectively tied.

Do not rotate holdings merely because another stock scores slightly higher.

---

## 11. Data and Evidence Requirements

For every real market decision:

- use latest authoritative data;
- record analysis date;
- record market-price date;
- record financial reporting period;
- distinguish Fact / Estimate / Assumption;
- record Analysis Data Status;
- flag stale or conflicting data;
- do not invent missing information.

If decision-critical data is unavailable:

> do not manufacture an actionable investment decision.

---

## 12. Portfolio Context Requirements

An actionable portfolio decision requires sufficient current information, including where applicable:

- portfolio NAV;
- available cash;
- ownership status;
- position size;
- sector exposure;
- drawdown status;
- STOP-BUY status;
- risk exceptions;
- concentration constraints.

If portfolio context is insufficient:

- complete research where possible;
- do not guess;
- classify the result as non-actionable or pending;
- use ownership-consistent defensive state logic from the Decision Framework.

---

## 13. Risk Exceptions

The AI may recommend an exception.

The AI may **not** self-approve one.

A policy exception requires:

1. CIO/Risk recommendation;
2. explicit user approval;
3. documented rationale;
4. exposure limit;
5. risk analysis;
6. expiry / review trigger;
7. normalization / exit plan.

No approval may be inferred from silence.

---

## 14. Target Operating Workflow

The cadence below is the **intended operating model derived from Milestone 1**. Detailed workflow mechanics, ownership, checklists, and automation are implemented in **Milestone 5**, not in Milestone 1.


### Weekly / event-driven research

Use when:

- material company news appears;
- new financial reports are published;
- thesis trigger occurs;
- valuation changes materially;
- price-decline review threshold is reached.

### Monthly capital allocation

When DCA cash arrives:

1. update portfolio data;
2. update VN30 opportunity ranking where necessary;
3. review STOP-BUY conditions;
4. review cash / concentration / drawdown;
5. identify the best eligible use of new capital;
6. deploy only when return/risk requirements are met;
7. otherwise retain cash.

### Quarterly review

Review:

- all holdings;
- thesis status;
- valuation;
- risk;
- concentration;
- sector exposure;
- portfolio drawdown;
- score changes;
- cash;
- opportunity cost.

### Annual review

Review:

- Investment Policy effectiveness;
- scoring calibration;
- realized decision quality;
- behavioral mistakes;
- benchmark comparison;
- risk-rule effectiveness.

Material policy changes require versioned document updates.

---

## 15. Project Lifecycle

Every milestone follows:

> Requirement Analysis  
> → Architecture / Framework Design  
> → Implementation Plan  
> → Implementation  
> → Validation  
> → Review  
> → Documentation Update  
> → Next Milestone

Do not work on multiple major milestones simultaneously unless explicitly requested.

---

## 16. Roadmap

### Milestone 1 — Investment Constitution

Status:

> **Complete — final cross-document review passed with 0 Critical and 0 Major issues**

Deliverables:

- Investment Policy
- Decision Framework
- Risk Policy
- Scoring Model
- System Prompt
- README

### Milestone 2 — Portfolio Data Model

Design:

- Portfolio
- Cash
- Transactions
- Dividends
- VN30 Master
- Sector
- Benchmark
- NAV
- Cost basis
- risk / review status fields required by Milestone 1

### Milestone 3 — VN30 Scoring Engine

Implement:

- normalized metrics;
- sector-specific scoring;
- full VN30 ranking;
- Top-10 opportunity list;
- score calibration.

### Milestone 4 — Buy / Hold / Sell Engine

Implement:

- DCA logic;
- entry;
- add;
- hold;
- reduce;
- exit;
- execution workflow.

### Milestone 5 — Portfolio Management Workflow

Implement:

- weekly review;
- monthly allocation review;
- quarterly portfolio review;
- annual system review.

### Milestone 6 — Dashboard & Automation

Implement portfolio-management application and operational automation.

### Milestone 7 — Validation

Perform:

- historical logic review;
- backtest where appropriate;
- paper portfolio testing;
- decision-quality validation.

### Milestone 8 — Continuous Improvement

Use real outcomes and decision-journal evidence to improve the system.

---

## 17. How to Use This Project

### Analyze one VN30 stock

Provide:

- ticker;
- current portfolio ownership if known;
- current position size if owned;
- portfolio NAV / cash if an actionable allocation decision is required.

The AI should run the approved Decision Framework.

### Rank the VN30

Request:

> Rank the current VN30 using the approved Scoring Model and Risk Policy.

The AI should use comparable data cut-offs and separate:

- investable Top-10;
- constrained/watch candidates;
- research-only / insufficient-data cases.

### Review a DCA decision

Provide:

- available new cash;
- current holdings;
- position sizes;
- portfolio NAV;
- relevant recent trades.

The AI should determine whether deployment is justified or cash should remain uninvested.

### Review an existing holding

The AI should assess:

- thesis status;
- current valuation;
- expected forward return;
- residual risk;
- portfolio concentration;
- opportunity cost;

then return exactly one formal Decision State.

---

## 18. Milestone 1 Completion Criteria

Milestone 1 may be declared complete only if:

- all constitution documents are approved;
- no Critical cross-document conflict remains;
- no Major cross-document conflict remains;
- document authority is unambiguous;
- Decision States are consistent across files;
- hard vetoes are owned by Risk Policy;
- scoring cannot override policy;
- exception governance requires explicit user approval;
- data and portfolio-context requirements are auditable;
- downstream Milestone 2 requirements can be derived from the constitution.

---

## 19. Current Baseline

Approved baseline at Milestone 1 completion review:

- `INVESTMENT_POLICY.md` v1.1
- `RISK_POLICY.md` v1.0
- `DECISION_FRAMEWORK.md` v1.0
- `SCORING_MODEL.md` v1.0
- `SYSTEM_PROMPT.md` v1.0
- `README.md` v1.0

---

## 20. Next Step

Final Milestone 1 cross-document review result:

> **Critical issues = 0**  
> **Major issues = 0**

Milestone 1 is therefore complete.

The next approved roadmap step is:

> **Start Milestone 2 — Portfolio Data Model**

---

## 21. Known Minor Documentation Issue

One non-blocking documentation cleanup remains in `DECISION_FRAMEWORK.md` v1.0:

- a legacy conditional sentence states that possible hard-veto issues should remain pending “until `RISK_POLICY.md` is approved”;
- `RISK_POLICY.md` is now approved v1.0, so the condition is obsolete;
- the sentence does not alter current decision logic because the condition is no longer true.

This should be removed in the next documentation-only revision of `DECISION_FRAMEWORK.md` (for example v1.1) without changing substantive decision rules.

This Minor issue does **not** block Milestone 2.
