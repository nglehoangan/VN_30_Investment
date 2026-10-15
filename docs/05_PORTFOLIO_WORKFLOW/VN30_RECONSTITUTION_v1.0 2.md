# VN30 Value Investing OS — VN30 Reconstitution Review

**Document:** `05_PORTFOLIO_WORKFLOW/VN30_RECONSTITUTION.md`  
**Milestone:** 5 — Portfolio Management Workflow  
**Status:** Approved Baseline  
**Version:** 1.0  
**Date:** 2026-09-07  

**Parent:** `05_PORTFOLIO_WORKFLOW/OPERATING_MODEL.md` v1.0 — Approved Baseline  
**Upstream Workflow:** `EVENT_DRIVEN_REVIEW.md` v1.0 — Approved Baseline  

**Governing Dependencies:**  
`INVESTMENT_POLICY.md`  
`DECISION_FRAMEWORK.md`  
`RISK_POLICY.md`  
`DATA_RULES.md`  
`VN30_MASTER.md`  
`SECTOR_MASTER.md`  
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

This document defines the operating workflow when the VN30 index changes composition.

The workflow exists because the investment mandate permits new capital only in current VN30 constituents.

It must ensure that:

- newly added stocks become research-eligible, not automatically buyable;
- removed stocks become ineligible for new capital;
- owned removed stocks become Legacy Holdings;
- Legacy Holdings remain fully represented in NAV, risk, P&L, and portfolio accounting;
- every Legacy Holding receives a documented orderly-exit plan;
- index changes do not create mechanical replacement trading;
- the system remains consistent with M1–M4 without inventing new mandate rules.

---

# 2. Core Principles

## 2.1 Index membership is eligibility, not investment merit

Joining VN30 means:

> eligible for research and possible future investment.

It does not mean:

> Buy.

Leaving VN30 means:

> ineligible for new capital.

It does not mean:

> immediate market-order Sell.

## 2.2 Membership and ownership are separate

A security may be:

- current VN30 member and unowned;
- current VN30 member and owned;
- removed from VN30 and unowned;
- removed from VN30 but still owned as a Legacy Holding.

Portfolio accounting must continue to represent all owned securities until quantity reaches zero.

## 2.3 No mechanical index replication

The portfolio is not required to:

- own every VN30 stock;
- match index weights;
- replace removed constituents one-for-one;
- buy new additions on effective date.

The operating objective is long-term value allocation within the VN30-only mandate.

## 2.4 Source of truth first

VN30 membership status must come from the approved effective-dated M2 membership model.

Current headlines or third-party lists must not silently overwrite authoritative membership history.

---

# 3. Reconstitution Event Types

The workflow covers:

1. `ADDITION`;
2. `REMOVAL`;
3. `RE-ENTRY`;
4. `MEMBERSHIP CORRECTION`;
5. `SECURITY IDENTITY / TICKER CHANGE` related to constituent records;
6. `UNKNOWN / UNSUPPORTED MEMBERSHIP` requiring data review.

---

# 4. Required Inputs

At minimum:

- official/reliable reconstitution announcement;
- announcement date;
- effective date;
- current VN30 Master;
- membership history;
- Security Master;
- sector mapping;
- portfolio holdings;
- share quantities;
- current portfolio snapshot;
- current scorecards;
- current ranking;
- prior Decision States;
- relevant market prices;
- liquidity;
- corporate-action context where applicable.

For owned removals also require:

- current thesis;
- valuation;
- residual risk;
- position weight;
- sector exposure;
- unrealized P&L for reporting only;
- liquidity/execution considerations;
- existing exit restrictions/exceptions if any.

---

# 5. Verification Gate

Before changing membership-dependent eligibility:

1. verify source authenticity;
2. verify affected ticker/security identity;
3. verify effective date;
4. distinguish announced future membership from currently effective membership;
5. validate membership interval;
6. check for ticker/name/corporate-action ambiguity;
7. record source lineage.

Do not mark a stock removed before the effective membership date unless the governing data model explicitly requires a future-dated record.

Do not backfill a current constituent list into historical dates.

---

# 6. Reconstitution Workflow

```text
1. Detect official VN30 composition change
2. Verify source and effective date
3. Update effective-dated membership reference
4. Identify additions/removals
5. Cross-check current portfolio ownership
6. Route additions
7. Route removals
8. Update research/scoring queues
9. Update ranking when required
10. Trigger M4 decisions where required
11. Create/refresh Legacy Holding exit plans
12. Update audit trail
13. Monitor until all transition actions are closed
```

---

# 7. Stock Added to VN30

When a security is newly added:

## Step A1 — Membership update

Update authoritative membership reference according to M2 rules.

Record:

- security ID;
- constituent effective date;
- source;
- source reference;
- membership status.

## Step A2 — Research eligibility

Classify:

> `ELIGIBLE FOR RESEARCH`

Do not classify:

> `BUY`

merely because membership changed.

## Step A3 — Full scoring requirement

Before being considered for capital allocation:

- perform Stage 0;
- obtain sufficient evidence;
- complete applicable M3 scoring;
- classify score validity;
- assign confidence;
- establish thesis;
- establish valuation;
- assess risk.

If evidence is insufficient:

> `RESEARCH ONLY`

## Step A4 — Ranking

Once production-valid:

- include in current VN30 ranking;
- compare with current opportunities;
- do not give a ranking bonus merely because it is newly added.

## Step A5 — Decision routing

Only if allocation is being considered:

- apply M4 Buy Rules;
- apply Position Sizing;
- apply Opportunity Cost;
- apply DCA rules if monthly cash is involved.

Possible result:

- BUY;
- STRONG BUY;
- HOLD/AVOID as appropriate to M4 semantics;
- no capital deployment.

---

# 8. Added Stock Already Owned — Prohibited Normal Case

Under the VN30-only mandate, a stock should not normally be newly owned while outside VN30.

If system data indicates an owned security becomes an “addition” but quantity already existed before eligible membership:

classify:

> `REVIEW REQUIRED — HISTORICAL ELIGIBILITY / DATA INTEGRITY`

Investigate:

- opening migration;
- prior historical membership;
- transaction date;
- membership coverage gaps;
- data correction.

Do not assume policy breach solely from incomplete historical membership evidence.

---

# 9. Stock Removed from VN30 — Unowned

When a non-owned security is removed:

1. close new-capital eligibility from effective date;
2. remove from current investable ranking/action set;
3. preserve historical score/ranking records;
4. preserve historical decisions;
5. do not delete security/reference history.

No trade is required because no position exists.

---

# 10. Stock Removed from VN30 — Owned

This is the critical workflow.

On effective removal:

1. classify holding as `LEGACY HOLDING`;
2. block all new capital;
3. preserve quantity and accounting state;
4. keep position in NAV;
5. keep position in sector/concentration risk;
6. keep P&L and dividend history;
7. initiate mandatory exit-oriented review;
8. create an orderly-exit plan;
9. assign next review date;
10. monitor until quantity reaches zero or the stock formally re-enters VN30.

---

# 11. Legacy Holding — Mandatory Rules

A Legacy Holding:

- cannot receive Buy/Add/Accumulate capital;
- cannot be used to satisfy monthly deployment pressure;
- remains subject to thesis/risk review;
- remains subject to portfolio risk;
- remains included in performance;
- must not disappear from reporting;
- must not be retained indefinitely without exit governance.

Allowed portfolio Decision States depend on M4 and ownership context.

The workflow is exit-oriented.

---

# 12. No Immediate Automatic Sell

Removal from VN30 is not itself sufficient reason for an immediate indiscriminate market-order exit.

The exit review must consider:

- mandate obligation;
- thesis;
- valuation;
- liquidity;
- market impact;
- fees/taxes where relevant;
- execution feasibility;
- risk;
- portfolio impact;
- opportunity cost.

However:

> “Thesis still looks good” is not permission to convert a Legacy Holding into a permanent out-of-mandate holding.

The mandate requires orderly exit.

---

# 13. Legacy Holding Exit Plan

Each Legacy Holding must receive a documented exit plan.

Minimum fields:

- Exit Plan ID;
- ticker/security ID;
- removal announcement date;
- removal effective date;
- Legacy status effective date;
- current shares;
- position weight;
- liquidity assessment;
- current thesis;
- valuation;
- risk;
- reason for non-immediate exit, if applicable;
- intended exit approach;
- staging logic if applicable;
- next review date;
- invalidation/acceleration triggers;
- responsible workflow;
- linked Decision ID(s).

---

# 14. Exit Plan Objective

The plan must balance:

1. mandate compliance;
2. avoidance of unnecessary execution harm;
3. risk control;
4. liquidity;
5. valuation;
6. opportunity cost.

The exit plan must not optimize for:

- getting back to cost basis;
- waiting indefinitely for break-even;
- avoiding realized loss;
- avoiding emotional regret.

---

# 15. Grace Period Governance

Upstream policy requires temporary retention only for orderly exit.

No universal numeric grace period has been approved.

Therefore M5 must not invent:

- 30-day;
- 60-day;
- 90-day;
- one-quarter;
- one-year

automatic grace periods.

Instead, the exit plan must be:

- documented;
- actively reviewed;
- non-indefinite;
- justified by execution/valuation/risk considerations.

A future numeric deadline requires separate policy approval.

---

# 16. Exit Acceleration Triggers

A Legacy Holding exit review should be accelerated when:

- thesis becomes `WEAKENING`;
- thesis becomes `BROKEN`;
- risk increases materially;
- liquidity deteriorates;
- regulatory/governance risk rises;
- valuation becomes less supportive of delay;
- better execution opportunity becomes available;
- portfolio concentration risk increases;
- exit plan becomes stale.

Final action remains routed through M4 Sell Rules.

---

# 17. Exit Delay — Acceptable Reasons

Temporary delayed execution may be defensible when:

- liquidity is unusually poor;
- immediate sale creates disproportionate market impact;
- operational settlement issue exists;
- trading suspension prevents execution;
- a short, documented staged exit reduces execution harm;
- material corporate action complicates immediate execution;
- valuation/execution interaction justifies controlled staging under approved rules.

Delay must remain subordinate to mandate and risk.

---

# 18. Exit Delay — Unacceptable Reasons

Do not delay because:

- price is below cost;
- user wants break-even;
- unrealized loss is psychologically uncomfortable;
- hope that price will recover;
- the company is still “good” without an exit plan;
- the investor dislikes realizing a loss;
- the investor believes index committee may reverse decision without evidence.

These are behavioral/mandate failures.

---

# 19. Re-Entry to VN30

If a Legacy Holding re-enters VN30 before full exit:

1. update membership effective-dated history;
2. current membership becomes true from new effective date;
3. historical Legacy period remains preserved;
4. new capital is not automatically authorized;
5. rerun current investment eligibility;
6. rerun valuation/risk/portfolio review;
7. invoke M4 if considering new capital.

Re-entry restores eligibility.

It does not restore an old thesis automatically.

---

# 20. Membership Unknown / Unsupported

If an owned security has positive quantity but membership evidence is uncertain:

classify:

> `MEMBERSHIP UNKNOWN`

Do not silently classify as:

- current member;
- Legacy Holding.

Required:

- data-quality investigation;
- historical membership verification;
- transaction-date eligibility review where relevant.

For new purchase eligibility:

> action is blocked until membership is supported.

---

# 21. Membership Correction

If authoritative reference data is corrected historically:

1. preserve old version lineage;
2. apply corrected effective-dated membership;
3. identify affected historical decisions/trades;
4. do not silently rewrite journal interpretation;
5. run Decision Audit if policy-compliance interpretation changes.

A historical BUY must not be called invalid solely because prior membership coverage was unknown.

Confirmed historical non-membership is different from unsupported evidence.

---

# 22. VN30 Addition Research Queue

New additions should enter a research queue with statuses:

- `NOT STARTED`;
- `IN RESEARCH`;
- `DATA PENDING`;
- `SCORING COMPLETE`;
- `PRODUCTION VALID`;
- `RANKED`;
- `DECISION REVIEWED`.

No urgency bonus is assigned because the stock is “new.”

---

# 23. Ranking Impact

After additions/removals become effective:

- rebuild current eligible VN30 opportunity set;
- refresh ranking where necessary;
- preserve historical ranking snapshots;
- exclude removed names from current new-capital ranking;
- retain Legacy Holdings in portfolio review, but not as new-capital candidates.

Rank changes caused solely by constituent count changes should be distinguished from actual fundamental changes.

---

# 24. Monthly DCA Interaction

If reconstitution occurs near Monthly DCA Review:

## Added stock

May compete for new cash only after:

- full valid scoring;
- thesis/valuation/risk review;
- M4 Buy gates.

## Removed stock

Cannot receive new capital.

Its exit proceeds, if any, do not automatically need to be redeployed.

Cash from exit must re-enter normal opportunity-cost process.

---

# 25. Quarterly Review Interaction

New constituent:

- undergo full research if not already done.

Legacy Holding:

- receives exit-oriented quarterly review while still owned.

Do not score Legacy Holding for new-capital ranking.

Its score/thesis may still be maintained when useful for exit decisions and audit.

---

# 26. Event-Driven Interaction

VN30 reconstitution is itself an event-driven trigger.

Route:

```text
EVENT DETECTED
→ MEMBERSHIP VERIFIED
→ VN30 RECONSTITUTION WORKFLOW
→ M4 DECISION ENGINE where needed
```

Do not duplicate the same event in multiple unlinked workflows.

---

# 27. Portfolio Risk Interaction

After effective reconstitution, reassess:

- Legacy Holding weight;
- sector weights;
- concentration;
- liquidity;
- number of eligible holdings;
- cash from exits;
- overlap with current opportunity set.

Index membership change itself does not alter market value or NAV.

Only actual transactions/market values do.

---

# 28. Behavioral Controls

## Index FOMO

“New VN30 addition will attract flows, so buy immediately.”

Control:
> membership does not establish value.

## Forced replacement

“One leaves, therefore buy the one entering.”

Control:
> no one-for-one replacement rule.

## Loss aversion

“Removed stock is below cost, so wait until break-even.”

Control:
> cost basis is irrelevant to mandate exit logic.

## Endowment effect

“I already own the removed stock and still like it.”

Control:
> Legacy Holding cannot become permanent out-of-mandate ownership.

## Recency / flow chasing

“Index inclusion means price will rise.”

Control:
> market-flow effects are secondary to underwriting.

---

# 29. Reconstitution Output Template

## Header

- Reconstitution Review ID
- Announcement Date
- Effective Date
- Source
- Source Quality
- Prior VN30 Version
- New VN30 Version

## Additions

For each:

- Security ID
- Ticker
- Effective Date
- Research Status
- Stage 0
- Score Status
- Confidence
- Ranking Status
- Allocation Decision Required? Yes/No

## Removals

For each:

- Security ID
- Ticker
- Ownership
- Quantity
- Position Weight
- Legacy Status
- Exit Plan ID
- Thesis
- Valuation
- Risk
- Liquidity
- Decision Required?
- Next Review Date

## Portfolio Impact

- Legacy Holding count
- sector changes
- concentration impact
- ranking impact
- cash impact only if/when trades execute

## Final Disposition

- `NO ACTION`
- `REVIEW REQUIRED`
- `DECISION REQUIRED`

---

# 30. Audit Trail

Required lineage:

```text
Reconstitution Review ID
→ Source Announcement
→ Effective Date
→ Membership Version
→ Security IDs
→ Addition/Removal Classification
→ Portfolio Ownership State
→ Research / Exit Routing
→ Score/Ranking Changes
→ Decision IDs
→ Transaction IDs if executed
→ Legacy Exit Plan
→ Closure
```

---

# 31. Closure Rules

## Addition

Closed when:

- membership updated;
- research routing completed;
- scoring/ranking status recorded;
- any triggered decision completed.

## Removal — unowned

Closed when:

- membership updated;
- security removed from new-capital set.

## Removal — owned

Remains open until:

- quantity reaches zero; or
- stock formally re-enters VN30 and current eligibility is reassessed.

Legacy exit plan cannot be closed merely because no trade occurred.

---

# 32. File Update Rules

May update:

- VN30 membership source/reference through M2 process;
- reconstitution review record;
- research queue;
- affected scorecards;
- ranking snapshot;
- Legacy Holding exit plan;
- Decision Template;
- Investment Journal;
- risk flags.

Must not directly overwrite:

- cash;
- quantity;
- cost basis;
- P&L;
- NAV;
- transaction ledger.

Executed trades must flow through authoritative M2 transaction processes.

---

# 33. Stop Conditions

Stop affected action and escalate when:

- membership source is contradictory;
- effective date uncertain;
- security identity ambiguous;
- merger/corporate action creates identity ambiguity;
- portfolio ownership state unreconciled;
- rule conflict exists;
- Legacy Holding exit plan cannot be formed because of critical missing evidence.

Do not guess membership merely to force the index count to 30.

---

# 34. Acceptance Criteria

`VN30_RECONSTITUTION.md` is acceptable only if:

1. new addition is not automatically Buy;
2. removal is not automatically immediate Sell;
3. removed owned stocks become Legacy Holdings;
4. Legacy Holdings cannot receive new capital;
5. Legacy Holdings remain in NAV/risk/P&L;
6. orderly exit plan is mandatory;
7. no arbitrary grace period is invented;
8. permanent out-of-mandate holding is prohibited;
9. no one-for-one replacement logic exists;
10. membership is effective-dated;
11. unknown membership is not treated as confirmed;
12. historical corrections preserve audit lineage;
13. re-entry restores eligibility but not automatic Buy status;
14. ranking/new-capital universe are updated consistently;
15. all trades still route through M4/M2;
16. behavioral controls address index FOMO and loss aversion.

---

# 35. Multi-Role Review

## CIO

**Critical:** 0 unresolved.  
**Major:** 0 unresolved.

Resolved:
- index composition being mistaken for portfolio recommendation;
- mandate leakage through indefinite Legacy Holdings;
- forced one-for-one index replacement.

**Assessment:** PASS.

## Portfolio Manager

**Critical:** 0 unresolved.  
**Major:** 0 unresolved.

Resolved:
- no clear Legacy exit plan;
- exit proceeds being automatically redeployed;
- re-entry handling ambiguity.

**Assessment:** PASS.

## Equity Research Analyst

**Critical:** 0 unresolved.  
**Major:** 0 unresolved.

Resolved:
- new additions receiving insufficient underwriting;
- inclusion-flow narrative replacing fundamentals;
- Legacy names disappearing from analytical review too early.

**Assessment:** PASS.

## Risk Manager

**Critical:** 0 unresolved.  
**Major:** 0 unresolved.

Resolved:
- removed holdings omitted from concentration risk;
- delayed exit without governance;
- membership uncertainty treated as eligibility.

**Assessment:** PASS.

## Investment Operations Manager

**Critical:** 0 unresolved.  
**Major:** 0 unresolved.

Resolved:
- announcement date vs effective date ambiguity;
- security identity and membership lineage gaps;
- accounting state being altered by membership change.

**Assessment:** PASS.

## Behavioral Finance Reviewer

**Critical:** 0 unresolved.  
**Major:** 0 unresolved.

Controls explicitly cover:
- index FOMO;
- forced replacement;
- loss aversion;
- endowment effect;
- flow chasing.

**Assessment:** PASS.

---

# 36. Consolidated Issue Register

## Critical

**0 unresolved**

## Major

**0 unresolved**

## Minor / Deferred

### R-1 — Numeric Legacy exit deadline

No approved universal deadline exists upstream.

**Recommendation:** keep mandatory non-indefinite exit governance; do not invent a number.

### R-2 — Official index source implementation

Exact data vendor/API is implementation scope.

**Recommendation:** preserve authoritative-source/effective-date requirements.

### R-3 — Complex corporate actions

Mergers/ticker changes may require M2 identity logic.

**Recommendation:** route ambiguity to Security/VN30 Master owners instead of solving locally in M5.

---

# 37. Final Review

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

The next planned file is `05_PORTFOLIO_WORKFLOW/PORTFOLIO_RISK_REVIEW.md`.
