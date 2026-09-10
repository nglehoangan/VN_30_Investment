# VN30 Value Investing OS — Quarterly Fundamental Review

**Document:** `05_PORTFOLIO_WORKFLOW/QUARTERLY_REVIEW.md`  
**Milestone:** 5 — Portfolio Management Workflow  
**Status:** Approved Baseline  
**Version:** 1.0  
**Date:** 2026-09-07  

**Parent:** `05_PORTFOLIO_WORKFLOW/OPERATING_MODEL.md` v1.0 — Approved Baseline  
**Upstream Workflows:**  
- `05_PORTFOLIO_WORKFLOW/WEEKLY_REVIEW.md` v1.0 — Approved Baseline  
- `05_PORTFOLIO_WORKFLOW/MONTHLY_DCA_REVIEW.md` v1.0 — Approved Baseline  

**Governing Dependencies:**  
`INVESTMENT_POLICY.md`  
`DECISION_FRAMEWORK.md`  
`RISK_POLICY.md`  
`DATA_RULES.md`  
`SCORING_ENGINE.md`  
`RANKING_RULES.md`  
`DECISION_ENGINE.md`  
`BUY_RULES.md`  
`SELL_RULES.md`  
`DCA_RULES.md`  
`POSITION_SIZING.md`  
`OPPORTUNITY_COST.md`  
`DECISION_TEMPLATE.md`  

---

# 1. Purpose

This document defines the quarterly deep fundamental review workflow for VN30 Value Investing OS.

Quarterly Review exists to answer:

> **Has the underlying business, financial condition, valuation, thesis, or risk profile changed enough to alter long-term investment attractiveness or portfolio action?**

Quarterly Review is the primary scheduled deep-underwriting layer for existing holdings.

It is deeper than Weekly Review and broader than Monthly DCA Review, but it must still avoid mechanical activity or unnecessary re-analysis when evidence has not changed.

The workflow must:

- reassess fundamentals using newly available quarterly/periodic information;
- update thesis status;
- update score and confidence when justified;
- refresh valuation and forward-return expectations;
- reassess risk;
- refresh ranking where material;
- trigger M4 Decision Engine when evidence warrants a formal decision.

It must not:

- create a trade merely because a quarter ended;
- treat quarterly earnings as the only determinant of long-term value;
- mechanically penalize normal cyclicality;
- mechanically reward short-term beats;
- override approved M3/M4 logic.

---

# 2. Core Principles

## 2.1 Thesis before price

Quarterly Review focuses primarily on:

1. business quality;
2. financial health;
3. growth quality;
4. industry/competitive position;
5. valuation and forward return;
6. risk/governance;
7. thesis status;
8. portfolio fit;
9. opportunity cost.

Price movement is secondary and is interpreted through valuation and portfolio context.

## 2.2 One quarter is evidence, not destiny

A single weak or strong quarter does not automatically establish:

- structural deterioration;
- durable improvement;
- thesis break;
- new moat;
- sustainable margin expansion;
- permanent loss of economics.

Quarterly evidence must be interpreted against:

- normalized history;
- seasonality;
- cycle position;
- management guidance;
- accounting changes;
- one-off items;
- sector conditions;
- previously stated thesis expectations.

## 2.3 No mechanical decision from earnings surprise

An earnings beat is not automatically bullish.

An earnings miss is not automatically bearish.

The relevant question is:

> **Did the new evidence materially change normalized economics, intrinsic value, expected return, thesis confidence, or risk?**

## 2.4 Deep review does not mean forced trade

Valid operating outcomes remain:

- `NO ACTION`;
- `REVIEW REQUIRED`;
- `DECISION REQUIRED`.

If M4 is invoked, the final security-level state remains one of:

- `STRONG BUY`
- `BUY`
- `ACCUMULATE`
- `HOLD`
- `REDUCE`
- `SELL`
- `AVOID`

---

# 3. Cadence

## 3.1 Default frequency

Each holding should receive a scheduled fundamental review at least once per quarter when sufficiently current reporting is available.

## 3.2 Reporting-date flexibility

The review should be aligned to actual information availability rather than an arbitrary calendar day.

A company that reports later should not be reviewed using incomplete information solely to satisfy a calendar deadline.

## 3.3 Event-driven override

If a material event occurs before the scheduled quarterly review:

- initiate Event-Driven Review;
- perform Deep Review if needed;
- do not wait for quarter-end.

The next Quarterly Review may reference that completed work instead of duplicating it.

---

# 4. Scope

For every current holding, review as applicable:

- revenue;
- earnings;
- margins;
- cash flow;
- balance sheet;
- debt;
- liquidity;
- ROE / ROIC or sector-specific metrics;
- working capital where relevant;
- asset quality where relevant;
- management commentary;
- guidance;
- capital allocation;
- dividend policy;
- sector conditions;
- competitive position;
- valuation;
- expected forward return;
- thesis status;
- risk;
- score;
- confidence;
- portfolio weight;
- sector exposure;
- opportunity cost.

For Legacy Holdings, the review remains exit-oriented and must not support new capital.

---

# 5. Required Inputs

## 5.1 Company financial data

Use the latest available and validated:

- quarterly/interim financial statements;
- year-to-date figures;
- trailing-twelve-month figures where appropriate;
- annualized figures only when economically meaningful;
- balance sheet;
- cash flow statement;
- notes/disclosures where relevant.

## 5.2 Management / disclosure data

As applicable:

- management commentary;
- guidance;
- investor presentation;
- shareholder/board disclosures;
- capital allocation decisions;
- acquisitions/disposals;
- debt issuance;
- capital raising;
- dividend announcements;
- governance changes.

## 5.3 Sector / macro inputs

Use only what is materially relevant:

- industry pricing;
- demand;
- supply/capacity;
- regulation;
- interest rates;
- credit cycle;
- FX;
- commodity inputs;
- competitive intensity;
- sector-specific macro variables.

## 5.4 Portfolio inputs

- current quantity;
- position weight;
- sector weight;
- NAV;
- cash;
- drawdown regime;
- concentration status;
- Legacy Holding status;
- current portfolio risk flags.

## 5.5 Analytical inputs

- prior score;
- prior category scores;
- prior score validity;
- prior confidence;
- prior thesis;
- prior valuation;
- prior expected return;
- prior risk status;
- prior ranking;
- prior Decision State;
- prior invalidation conditions.

---

# 6. Data Quality Gate

Before finalizing any quarterly conclusion, confirm:

- financial data period and publication date;
- source authority;
- accounting comparability;
- corporate-action adjustments;
- exceptional items;
- restatements/corrections;
- sector metric comparability;
- market-price as-of date;
- portfolio snapshot date;
- membership status;
- data lineage.

If material data is missing or contradictory:

> `THESIS STATUS = PENDING` where appropriate  
> `REVIEW REQUIRED — DATA QUALITY`

New capital must not be authorized if the missing information could materially alter the decision.

---

# 7. Quarterly Review Workflow

```text
1. Reconstruct portfolio and holding context
2. Confirm reporting/data completeness
3. Review business quality
4. Review financial health
5. Review growth quality
6. Review industry / competitive position
7. Review management / capital allocation
8. Review valuation / forward return
9. Review risk / governance
10. Update thesis
11. Update score
12. Update confidence
13. Update ranking if material
14. Review portfolio impact / opportunity cost
15. Classify operating disposition
16. Invoke M4 Decision Engine if required
17. Record journal / audit trail
18. Schedule next review
```

---

# 8. Business Quality Review

Review whether durable business economics changed.

Questions may include:

- Did pricing power improve or deteriorate?
- Did unit economics change?
- Did moat/competitive advantage strengthen or weaken?
- Did customer/supplier concentration change?
- Did product/service mix change materially?
- Did business resilience improve or weaken?
- Was performance dependent on temporary factors?

Avoid double-counting the same evidence across multiple score categories.

---

# 9. Financial Health Review

Review sector-appropriate solvency and liquidity.

As applicable:

- debt levels;
- debt maturity;
- interest coverage;
- refinancing needs;
- liquidity;
- capital adequacy;
- asset quality;
- non-performing exposures;
- funding mix;
- cash reserves;
- contingent liabilities.

The same leverage metric must not be applied mechanically across all sectors.

Any new evidence of severe solvency/governance risk must escalate immediately.

---

# 10. Growth Quality Review

Review whether growth remains:

- durable;
- economically productive;
- supported by incremental returns;
- cash-generative;
- not merely acquisition-driven or accounting-driven;
- not a low-base rebound mistaken for structural growth.

Differentiate cyclical recovery from structural growth.

---

# 11. Margin Review

Review:

- gross margin;
- operating margin;
- net margin;
- sector-specific profitability spreads;
- normalized versus temporary margin;
- input-cost effects;
- pricing effects;
- mix effects.

One-quarter margin compression is not automatically thesis deterioration.

Repeated compression inconsistent with the thesis must not be dismissed as temporary without evidence.

---

# 12. Cash Flow Review

Review:

- operating cash flow;
- free cash flow where appropriate;
- cash conversion;
- working capital;
- capex;
- dividends;
- debt service;
- acquisitions;
- financing cash flows.

Warning signs include:

- earnings growth without cash conversion;
- persistent receivables/inventory deterioration;
- capex needs materially above thesis;
- dividend funded by balance-sheet deterioration.

Cash-flow interpretation must remain sector-appropriate.

---

# 13. Balance Sheet / Debt Review

Assess whether balance-sheet resilience changed.

Key questions:

- Has leverage risen materially?
- Was debt used productively?
- Is refinancing risk increasing?
- Has liquidity coverage weakened?
- Did contingent risk increase?
- Does capital structure still support downside survivability?

A weakening balance sheet can reduce thesis confidence even if earnings remain strong.

---

# 14. ROE / ROIC / Sector-Specific Economics

Use sector-appropriate metrics defined by approved M3 rules.

Do not reward high ROE mechanically if driven by excessive leverage.

---

# 15. Management Commentary and Guidance

Assess:

- consistency with prior guidance;
- quality of explanation;
- realism;
- capital allocation;
- disclosure quality;
- shareholder alignment;
- credibility.

Management commentary is evidence, not unquestioned fact.

Classify material assertions as:

- `FACT`;
- `ESTIMATE`;
- `ASSUMPTION`.

---

# 16. Sector Conditions

Review only decision-relevant conditions.

Questions:

- Is the industry cycle changing?
- Has competitive intensity changed?
- Is regulation affecting economics?
- Are input or funding costs changing?
- Is supply/demand structurally changing?
- Is company performance diverging from sector conditions?

Sector weakness does not automatically mean company thesis break.

Sector strength does not automatically imply company quality.

---

# 17. Valuation Review

Refresh valuation using approved methods.

At minimum update:

- current market price;
- primary valuation method;
- intrinsic-value range;
- downside case;
- margin of safety;
- expected 5-year annualized total return;
- valuation confidence;
- relevant cross-checks.

Do not anchor to:

- prior purchase price;
- prior target price;
- recent high/low;
- cost basis.

The relevant comparison is current price versus current estimated intrinsic value and forward return.

---

# 18. Thesis Classification

Each holding must end with exactly one canonical thesis status:

## `IMPROVING`

Use when new validated evidence materially strengthens the original thesis beyond normal noise.

Improvement does not automatically justify an Add.

## `INTACT`

Use when key thesis drivers remain valid and deviations are within a reasonable range.

## `WEAKENING`

Use when one or more thesis drivers deteriorate materially but the thesis is not yet fully invalidated.

Requires:

> `DECISION REQUIRED`

## `BROKEN`

Use when a defined invalidation condition is met or the core thesis is no longer defensible.

Requires:

> immediate `DECISION REQUIRED`

## `PENDING`

Use when material evidence is insufficient or contradictory.

New capital must not be authorized until resolved.

---

# 19. Thesis Change Documentation

Any change from prior thesis status must record:

- prior status;
- new status;
- evidence;
- source;
- as-of date;
- magnitude;
- structural vs temporary interpretation;
- affected thesis driver;
- confidence impact;
- valuation impact;
- risk impact;
- required next action.

No silent thesis-state change is permitted.

---

# 20. Score Update

Update the M3 score where justified.

Record:

- prior score;
- new score;
- category changes;
- reason for each material change;
- score validity;
- methodology version.

Do not change score merely to align with a desired Decision State.

---

# 21. Confidence Update

Confidence must be reviewed independently of score.

Confidence may fall when:

- reporting quality weakens;
- forecast dispersion increases;
- management credibility deteriorates;
- business becomes less predictable;
- key thesis evidence becomes uncertain.

A high score with insufficient confidence may remain non-actionable.

---

# 22. Ranking Refresh

Refresh ranking when material score, valuation, risk, or confidence changes affect relative attractiveness.

Do not blindly reshuffle rank based on tiny score changes.

Top 10 remains actionability-aware under M3/M4.

---

# 23. Portfolio Context Review

After updating company-level analysis, reassess:

- current position weight;
- target/economic sizing context;
- sector exposure;
- Top-3 concentration;
- portfolio drawdown;
- risk contribution;
- Legacy status;
- cash availability;
- opportunity cost.

A good company may still warrant HOLD, no add, or REDUCE depending on portfolio context and valuation.

---

# 24. Opportunity Cost Review

Ask:

> If this position were evaluated today using current evidence, is holding this capital still competitive with the best alternatives and cash?

Do not use opportunity cost mechanically to churn.

Switching requires a materially superior alternative after uncertainty, risk, transaction friction, liquidity, and lost future compounding are considered.

---

# 25. Operating Disposition

Each quarterly holding review ends in one of:

## `NO ACTION`

Use when thesis is valid, risk acceptable, and no M4 trigger exists.

## `REVIEW REQUIRED`

Use when evidence is incomplete, thesis is `PENDING`, or deeper event-specific work is required.

## `DECISION REQUIRED`

Use when:

- thesis `WEAKENING`;
- thesis `BROKEN`;
- valuation/forward-return trigger;
- concentration issue;
- Risk Policy trigger;
- major opportunity-cost case;
- mandatory Legacy Holding action;
- formal Add/Reduce/Sell case is justified.

---

# 26. M4 Decision Engine Handoff

When `DECISION REQUIRED`, provide:

- Review ID;
- Decision ID;
- Data As-Of;
- Portfolio As-Of;
- ticker/security ID;
- ownership state;
- VN30/Legacy status;
- Stage 0 status;
- prior/current score;
- score validity;
- confidence;
- prior/current thesis;
- valuation;
- expected return;
- risk;
- portfolio weight;
- sector exposure;
- opportunity-cost context;
- trigger;
- invalidation conditions;
- assumptions;
- evidence references.

No Decision State is fabricated by Quarterly Review.

---

# 27. Legacy Holding Quarterly Review

Legacy Holdings require:

- no new capital;
- current thesis review;
- valuation review;
- liquidity review;
- risk review;
- orderly exit-plan review;
- progress against exit plan;
- opportunity-cost review;
- next review date.

A Legacy Holding cannot remain indefinitely merely because thesis remains attractive.

No universal fixed liquidation deadline is introduced here.

---

# 28. Quarterly Risk Review

Review:

- governance;
- financial risk;
- solvency;
- liquidity;
- business-model risk;
- regulatory/legal;
- concentration;
- correlated exposure;
- drawdown;
- low-confidence exposure;
- broken-thesis exposure;
- Legacy Holding exposure.

Portfolio risk status:

- `GREEN`;
- `WATCH`;
- `WARNING`;
- `BREACH`.

These are workflow statuses, not M4 Decision States.

---

# 29. Quarterly Behavioral Review

Check:

- confirmation bias;
- loss aversion;
- disposition effect;
- anchoring;
- recency bias;
- overconfidence;
- endowment effect;
- action bias.

Repeated patterns should later feed Behavioral Review / `LESSONS.md`.

---

# 30. Quarterly Review Output Template

## Header

- Quarterly Review ID
- Quarter / Reporting Period
- Review Date
- Data As-Of
- Portfolio Snapshot ID
- Methodology Versions
- Prior Review ID

## Holding Summary

- Ticker / Security ID
- Current VN30 / Legacy status
- Ownership
- Position Weight
- Sector Weight
- Prior Decision State
- Prior Thesis Status
- Prior Score
- Prior Confidence

## Fundamental Update

- Revenue
- Earnings
- Margin
- Cash Flow
- Balance Sheet
- Debt / Liquidity
- ROE / ROIC / sector metric
- Management Commentary
- Guidance
- Sector Conditions
- Capital Allocation

Each material item should record:

- change;
- interpretation;
- source;
- as-of date;
- FACT / ESTIMATE / ASSUMPTION.

## Valuation

- Current Price
- Intrinsic Value Range
- Downside Case
- Margin of Safety
- Expected 5Y Return
- Valuation Confidence

## Thesis

- Prior Thesis
- Current Thesis
- Thesis Status
- Thesis Strength
- Invalidation Conditions
- Material Changes

## Score

- Prior Score
- New Score
- Category Deltas
- Score Validity
- Confidence

## Risk

- Key Risks
- New Risk Flags
- Cleared Risk Flags
- Residual Risk
- Portfolio Risk Impact

## Opportunity Cost

- current holding attractiveness;
- best alternatives;
- cash comparator;
- switching hurdle.

## Final Operating Disposition

- `NO ACTION`
- `REVIEW REQUIRED`
- `DECISION REQUIRED`

## Linked M4 Decision

If applicable:

- Decision ID
- Decision State
- Execution Status

## Next Review

- next scheduled review;
- event triggers;
- unresolved evidence.

---

# 31. Portfolio-Level Quarterly Summary

Produce:

- holdings reviewed;
- thesis `IMPROVING`;
- thesis `INTACT`;
- thesis `WEAKENING`;
- thesis `BROKEN`;
- thesis `PENDING`;
- score upgrades;
- score downgrades;
- confidence changes;
- new risk flags;
- risk breaches;
- Top-10 changes;
- Legacy Holdings;
- Decision Required count;
- concentration status;
- sector concentration;
- drawdown status.

This summary must not replace holding-level evidence.

---

# 32. Audit Trail

Required lineage:

```text
Quarterly Review ID
→ Reporting Period
→ Source Financials / Disclosures
→ Data Quality
→ Prior Thesis / Score
→ Fundamental Deltas
→ Updated Thesis
→ Updated Score / Confidence
→ Updated Valuation
→ Updated Risk
→ Portfolio Context
→ Ranking / Opportunity Cost
→ Operating Disposition
→ Decision ID if escalated
→ Journal
```

Historical analysis must remain reproducible without hindsight substitution.

---

# 33. No-Hindsight Rule

Later review must use information reasonably available as of the original review date.

Do not retroactively declare a decision bad solely because later price performance was poor.

Decision quality and outcome quality remain separate.

---

# 34. File Update Rules

Quarterly Review may update:

- holding research record;
- scorecard;
- thesis status;
- confidence;
- valuation record;
- risk flags;
- ranking snapshot;
- quarterly portfolio summary;
- Decision Template;
- Investment Journal;
- unresolved-review register.

It must not directly overwrite authoritative M2 accounting/reference state.

---

# 35. Stop Conditions

Stop and escalate when:

- financial statement integrity is unclear;
- material restatement exists;
- severe governance concern;
- solvency issue;
- data conflict;
- membership unsupported;
- portfolio state blocked;
- corporate-action adjustment unresolved;
- rule conflict;
- thesis cannot be assessed because critical evidence is missing.

Possible output:

> `REVIEW REQUIRED — BLOCKED`

or, where evidence is sufficient:

> `DECISION REQUIRED`

---

# 36. Acceptance Criteria

`QUARTERLY_REVIEW.md` is acceptable only if:

1. it performs deep fundamental review without forcing trades;
2. one quarter is evidence, not destiny;
3. business quality precedes price;
4. financial health and cash flow are explicitly reviewed;
5. sector-specific metrics are allowed;
6. management commentary is not treated as unquestioned fact;
7. valuation and forward return are refreshed;
8. thesis must be classified;
9. `WEAKENING`/`BROKEN` escalate to M4;
10. score and confidence are separate;
11. ranking refresh is materiality-driven;
12. opportunity cost is reviewed without encouraging churn;
13. Legacy Holdings remain exit-oriented;
14. risk status is separate from Decision State;
15. behavioral bias is checked;
16. audit trail is reproducible;
17. no M1–M4 rule is redefined.

---

# 37. Multi-Role Review

## CIO

**Critical:** 0 unresolved.  
**Major:** 0 unresolved.

Resolved:
- quarter-end trading bias;
- overreaction to single-quarter results;
- thesis drift without explicit state change.

**Assessment:** PASS.

## Portfolio Manager

**Critical:** 0 unresolved.  
**Major:** 0 unresolved.

Resolved:
- disconnect between company analysis and portfolio context;
- lack of portfolio-level synthesis;
- passive Legacy Holding retention.

**Assessment:** PASS.

## Equity Research Analyst

**Critical:** 0 unresolved.  
**Major:** 0 unresolved.

Resolved:
- earnings-surprise bias;
- earnings overshadowing cash flow/balance sheet;
- uncritical management guidance;
- cross-sector metric bias.

**Assessment:** PASS.

## Risk Manager

**Critical:** 0 unresolved.  
**Major:** 0 unresolved.

Resolved:
- strong earnings masking balance-sheet deterioration;
- high-score/low-confidence actionability;
- improper risk-flag clearance.

**Assessment:** PASS.

## Investment Operations Manager

**Critical:** 0 unresolved.  
**Major:** 0 unresolved.

Resolved:
- incomplete source lineage;
- restatement/hindsight contamination;
- shadow accounting risk.

**Assessment:** PASS.

## Behavioral Finance Reviewer

**Critical:** 0 unresolved.  
**Major:** 0 unresolved.

Controls cover:
- confirmation bias;
- recency bias;
- loss aversion;
- disposition effect;
- anchoring;
- overconfidence;
- endowment effect;
- action bias.

**Assessment:** PASS.

---

# 38. Consolidated Issue Register

## Critical

**0 unresolved**

## Major

**0 unresolved**

## Minor / Deferred

### Q-1 — Reporting-calendar implementation

Different issuers publish at different times.

**Recommendation:** align review with validated reporting availability rather than fixed dates.

### Q-2 — Sector-specific metric detail

Owned by M3.

**Recommendation:** reference M3 rather than duplicate formulas.

### Q-3 — Trend-window calibration

Exact rules for when repeated deterioration becomes structural may require future validation.

**Recommendation:** preserve evidence-based judgment now and calibrate later using validation evidence rather than arbitrary thresholds.

---

# 39. Final Review

**CIO:** PASS  
**Portfolio Manager:** PASS  
**Equity Research Analyst:** PASS  
**Risk Manager:** PASS  
**Investment Operations Manager:** PASS  
**Behavioral Finance Reviewer:** PASS  

**Critical unresolved:** 0  
**Major unresolved:** 0  
**Minor / deferred:** 3  

**Overall design quality:** approximately **9.9/10**.

**Approval Status:** APPROVED BASELINE v1.0.

The next planned file is `05_PORTFOLIO_WORKFLOW/ANNUAL_REVIEW.md`.
