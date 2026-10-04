# VN30 Value Investing OS --- Paper Portfolio / Forward Validation Plan

**Document:** `07_VALIDATION/PAPER_PORTFOLIO_PLAN.md`\
**Milestone:** M7.7 --- Paper Portfolio / Forward Validation\
**Status:** Baseline Candidate --- Awaiting User Approval\
**Version:** 0.1\
**Date:** 2026-10-04\
**Parents:** Approved M7 validation specifications through
`HISTORICAL_RESULTS.md` v1.0 (`BLOCKED / NOT EXECUTED`)

## 1. Purpose

Define a prospective paper-portfolio protocol that tests VN30 Value
Investing OS using decisions frozen **before** outcomes are known.

Paper validation is not simulated hindsight and is not live trading.

Its central question is:

> Can the frozen system repeatedly ingest information available at the
> time, produce policy-compliant decisions, allocate paper capital,
> preserve auditability, and behave sensibly as new facts arrive?

## 2. Governance boundary

Paper validation:

-   does not authorize real trades;
-   does not authorize auto-trading;
-   does not make Gate 7 historical validation PASS;
-   does not repair missing historical evidence retroactively;
-   does not permit rule tuning from observed forward outcomes;
-   does not replace deterministic validation.

`HISTORICAL_RESULTS.md` remains `BLOCKED / NOT EXECUTED` until its own
prerequisites are satisfied.

## 3. Entry conditions

Before formal forward observations count as validation evidence, freeze:

-   code commit SHA;
-   Baseline Manifest;
-   scoring methodology/config;
-   decision methodology/config;
-   risk methodology/config;
-   portfolio/DCA methodology;
-   paper-portfolio initial state;
-   data-source manifest;
-   decision/review schedule;
-   transaction-cost assumptions;
-   benchmark methodology;
-   paper-run ID.

If deterministic Gates 1--6 remain incomplete, forward observations may
be collected as **PROVISIONAL EVIDENCE** only and cannot certify
release.

## 4. No-hindsight rule

A paper decision becomes immutable at its decision cutoff.

After cutoff, the system may:

-   append new evidence;
-   create a new review;
-   supersede a decision through a new dated decision artifact.

It may not:

-   edit the old thesis because price later moved;
-   rewrite valuation assumptions;
-   change the old score;
-   change the old state;
-   backdate a SELL/BUY;
-   delete an unfavorable decision;
-   substitute a later publication into an earlier review.

Corrections to factual ingestion require explicit correction lineage and
cannot pretend the corrected fact was known earlier.

## 5. Paper portfolio initial state

Use one registered portfolio.

Preferred clean start:

-   cash-only opening portfolio;
-   no leverage;
-   explicit opening NAV;
-   zero holdings;
-   monthly contribution approximately VND 5,000,000 according to the
    approved DCA cadence;
-   board-lot/effective trading rules from authoritative reference data;
-   transaction costs/taxes modeled under frozen assumptions.

A migrated existing portfolio may be a separate secondary paper track,
not a replacement chosen after seeing outcomes.

## 6. Funding protocol

Monthly contribution is recorded as external capital flow.

Rules:

-   contribution is not return;
-   contribution is not forced investment;
-   unused cash carries forward;
-   no borrowing;
-   no synthetic top-up to make a lot affordable;
-   settlement rules apply;
-   HOLD CASH is valid.

The paper portfolio must show both cash received and cash actually
deployed.

## 7. Universe

At each decision timestamp:

-   derive current VN30 membership from effective-dated evidence;
-   new capital only to eligible current VN30 members;
-   prior holdings removed from VN30 become Legacy holdings;
-   Legacy holdings receive no new capital;
-   Legacy ownership is reviewed by thesis/risk/valuation, not
    automatically sold solely because of index exit;
-   UNKNOWN membership blocks new capital.

## 8. Data cutoff

Every formal paper review has:

-   review ID;
-   decision timestamp;
-   evidence cutoff;
-   source snapshot/version;
-   market-price cutoff;
-   fundamental publication timestamps;
-   benchmark cutoff;
-   portfolio snapshot/watermark.

Facts arriving after cutoff belong to the next review unless an approved
event-driven review is triggered.

## 9. Review cadence

Use the approved operating model.

At minimum:

-   Weekly Review;
-   Monthly DCA Review;
-   Quarterly Review;
-   Annual Review;
-   Event-Driven Review when a supported material event occurs;
-   VN30 Reconstitution Review on effective membership change.

Do not increase review frequency merely because prices become volatile
unless the approved event-driven rules justify it.

## 10. Decision pipeline

For each security requiring formal review:

`Stage 0 → Business Quality → Financial Health → Growth → Industry → Valuation → Risks → Market/Money Flow → Technical Entry → Existing Portfolio → Opportunity Cost → Final Decision`

Final state must be exactly one of:

-   STRONG BUY
-   BUY
-   ACCUMULATE
-   HOLD
-   REDUCE
-   SELL
-   AVOID

Review/execution qualifiers remain orthogonal.

## 11. Score and ranking capture

Each formal scoring date retains:

-   metric inputs/evidence;
-   category scores;
-   total score;
-   confidence;
-   scoreability/actionability;
-   sector-normalization context;
-   methodology version;
-   ranking;
-   gate failures;
-   Top-10 display.

Top-10 is not automatic allocation authority.

## 12. Thesis record

For every owned or actionable security record:

-   thesis;
-   key positives;
-   key risks;
-   valuation assessment;
-   expected return/range where supported;
-   invalidation conditions;
-   confidence;
-   evidence cutoff.

A later review must state what changed rather than silently replace the
prior thesis.

## 13. Paper execution model

Economic decision and paper execution remain separate.

A paper trade occurs only when:

-   economic state authorizes capital/action;
-   risk capacity permits;
-   settled paper cash permits;
-   lot feasibility permits;
-   evidence is current;
-   execution status permits.

Use a pre-registered execution convention, for example the next eligible
market observation after decision cutoff. The exact convention must be
frozen before formal execution evidence begins.

Never fill at a price that was unavailable when the paper order could
have been placed.

## 14. Monthly DCA allocation

At each DCA review:

1.  determine executable paper cash;
2.  identify eligible candidates;
3.  compare opportunity cost including cash;
4.  select preferred marginal use;
5.  calculate risk capacity;
6.  test lot feasibility;
7.  authorize one marginal lot or HOLD CASH;
8.  update projected portfolio;
9.  recompute before any next lot.

No forced deployment and no stale-state multi-lot allocation.

## 15. Affordable substitution

If the best candidate is unaffordable, cheaper alternatives require the
complete approved substitution conjunction.

Paper validation explicitly records:

-   preferred candidate;
-   why it is not executable;
-   alternative;
-   economic comparison;
-   concentration impact;
-   starvation/diversion test;
-   authorization or HOLD CASH.

This tests affordability bias prospectively.

## 16. Risk controls

Every formal paper allocation records:

-   pre/post single-name exposure;
-   pre/post sector exposure;
-   hidden-factor concerns;
-   residual risk;
-   drawdown regime;
-   exception state;
-   liquidity/cash state;
-   risk capacity;
-   required approval.

Small-NAV exceptions require the same explicit approval/governance as
the real decision-support system; the paper engine cannot self-approve
them.

## 17. Drawdown tracking

Track:

-   paper NAV;
-   external contributions/withdrawals;
-   approved flow-adjusted performance;
-   peak NAV/performance index;
-   flow-adjusted drawdown;
-   risk regime.

Drawdown triggers review/risk controls, not automatic panic liquidation.

Until the independent flow-adjusted drawdown prerequisite is certified,
paper drawdown analytics are labeled **PROVISIONAL / NOT
RELEASE-CERTIFIED**.

## 18. Benchmark tracking

Track the frozen VN30 benchmark methodology prospectively.

Disclose:

-   price-return vs total-return;
-   dividend treatment;
-   observation alignment;
-   data quality;
-   comparability limitation.

Portfolio TWR/unitization is the primary portfolio performance method.

## 19. Decision journal

Each formal decision creates an immutable journal record containing:

-   timestamp;
-   security;
-   ownership state;
-   score/rank;
-   thesis;
-   valuation;
-   risks;
-   opportunity cost;
-   final state;
-   requested action;
-   execution status;
-   expected outcome range/horizon where appropriate;
-   invalidation conditions;
-   evidence refs;
-   methodology IDs;
-   portfolio snapshot;
-   behavioral-bias checklist.

No outcome fields are added until their predefined evaluation date or
event.

## 20. Behavioral controls

Prospectively test for:

-   FOMO after price rises;
-   loss aversion;
-   anchoring to purchase price;
-   break-even bias;
-   averaging down because price fell;
-   premature profit taking;
-   disposition effect;
-   action bias from monthly cash;
-   affordability bias;
-   ownership bias;
-   recency bias.

A detected bias is recorded even when the final system decision remains
correct.

## 21. Outcome horizons

Do not judge a 5--10 year value thesis by a few weeks of price movement.

Pre-register multiple evaluation horizons:

-   process check: immediately/next review;
-   short diagnostic: \~3 months;
-   intermediate diagnostic: \~6 and 12 months;
-   long-term thesis evaluation: multi-year as evidence accumulates.

Short-horizon returns may diagnose execution/timing but cannot alone
validate/invalidate long-term intrinsic-value reasoning.

## 22. Decision-quality evaluation

For each matured observation evaluate separately:

1.  **Process correctness** --- did the decision follow policy?
2.  **Information correctness** --- were only available facts used?
3.  **Thesis evolution** --- did identified positives/risks develop as
    expected?
4.  **Valuation discipline** --- was the margin/return logic reasonable
    under known facts?
5.  **Portfolio construction** --- was capital allocated better than
    alternatives/cash under the method?
6.  **Outcome** --- what happened afterward?

A good process with a bad outcome is not automatically a bad decision; a
policy violation with a lucky gain is not a good decision.

## 23. Outcome attribution

When enough evidence exists, classify outcome drivers:

-   thesis correct / incorrect;
-   valuation error;
-   timing/execution effect;
-   unexpected exogenous event;
-   data-quality problem;
-   risk-control benefit/cost;
-   opportunity-cost error;
-   model limitation;
-   luck/noise.

Do not rewrite the original decision to fit attribution.

## 24. Forward negative controls

Periodically run shadow controls that must not influence formal paper
capital:

-   price-decline-only add;
-   low-P/E-only buy;
-   +20%-gain auto-sell;
-   technical-signal-only buy/sell;
-   Top-10-only allocation;
-   cheapest-affordable candidate;
-   existing-holding-first;
-   forced monthly deployment.

Formal engine must reject these shortcuts.

## 25. Paper evidence package

Each formal review retains:

-   run/review ID;
-   code SHA;
-   baseline/config hashes;
-   data snapshot hash;
-   decision timestamp/cutoff;
-   portfolio pre-state;
-   scorecards;
-   decisions;
-   risk results;
-   marginal allocation;
-   paper orders/fills;
-   portfolio post-state;
-   journal;
-   logs;
-   exceptions;
-   reviewer.

Evidence must be replayable.

## 26. Performance reporting

Report prospectively without optimization:

-   portfolio TWR;
-   benchmark return;
-   active return;
-   flow-adjusted drawdown;
-   cash weight;
-   DCA deployment rate;
-   turnover;
-   concentration;
-   state counts/transitions;
-   HOLD CASH frequency;
-   exception frequency;
-   thesis breaks;
-   policy violations;
-   reconstruction failures.

The 15--20% annual return aspiration is not a pass/fail threshold.

## 27. Minimum observation requirement

Forward validation cannot be "completed" after one or two trades.

Release conclusions require sufficient observations across:

-   multiple monthly DCA cycles;
-   at least one quarterly review;
-   both invested and HOLD CASH decisions where naturally occurring;
-   more than one decision state;
-   at least one material thesis/risk update if naturally occurring.

No event should be manufactured merely to satisfy sample count.

Because the strategy horizon is long, early paper evidence primarily
validates **process and control behavior**, not long-term alpha.

## 28. Stop / escalation conditions

Pause new paper allocation and open an issue if:

-   accounting does not reconcile;
-   data cutoff is violated;
-   future information enters a decision;
-   methodology changes without versioning;
-   risk capacity cannot be reproduced;
-   client/user input overrides authoritative decision fields;
-   paper fill uses impossible price/timing;
-   decision artifact cannot replay;
-   unresolved Critical/Major defect could contaminate subsequent
    observations.

Preserve existing evidence; do not restart history to erase the failure.

## 29. Change control

If forward evidence suggests a model weakness:

1.  record issue;
2.  classify severity;
3.  diagnose without changing frozen run;
4.  propose a future methodology version;
5.  review/approve separately;
6.  start prospective evidence for the new version from its effective
    date.

Never back-apply the new model to claim the old paper decisions were
different.

## 30. Relationship to real portfolio

Paper decisions are validation artifacts only.

They must not:

-   post real ledger transactions;
-   place broker orders;
-   create real cash movements;
-   be represented as actual user holdings.

If the user independently executes a similar real trade, the real
portfolio transaction remains a separate accounting event.

## 31. Forward-validation outputs

M7.7 should eventually produce evidence for:

-   decision consistency;
-   DCA discipline;
-   risk-control behavior;
-   audit/replay;
-   behavioral discipline;
-   data timeliness;
-   model limitations.

It is not a shortcut around the blocked historical dataset problem.

## 32. Current planning findings

**PP-F01 --- Prospective capture is valuable because availability
timestamps are naturally observable going forward.** This can reduce
ambiguity that blocks some historical PIT evidence.

**PP-F02 --- Forward evidence cannot retroactively certify historical
performance.** Gate 7 remains independent.

**PP-F03 --- Flow-adjusted drawdown remains provisional until
deterministic risk validation is executed.**

**PP-F04 --- A cash-only paper start gives the cleanest primary
experiment.** A migrated portfolio can be secondary if separately
registered.

**PP-F05 --- Long investment horizon limits early outcome claims.**
Initial validation should emphasize process, policy compliance and
reconstructability.

## 33. M7.7 success criteria

Paper/forward validation is healthy when:

-   no future data contamination;
-   every decision is frozen before outcome;
-   every revision is append-only/versioned;
-   accounting reconciles;
-   DCA is not forced;
-   HOLD CASH works;
-   sequential marginal allocation works;
-   risk constraints work;
-   paper fills follow registered timing;
-   decisions replay deterministically;
-   behavioral shortcuts are rejected;
-   no unresolved Critical/Major defect contaminates evidence.

This does not by itself prove long-term alpha.

## 34. Multi-role review

-   **CIO --- PASS:** preserves long-horizon decision discipline.
-   **Portfolio Manager --- PASS:** paper capital follows the same
    cash/lot/opportunity constraints.
-   **Equity Research Analyst --- PASS:** thesis evolution is frozen and
    reviewed prospectively.
-   **Independent Model Validator --- PASS:** hindsight rewriting is
    explicitly prohibited.
-   **Risk Manager --- PASS:** forward allocations retain
    veto/concentration/drawdown controls.
-   **Behavioral Finance Reviewer --- PASS:** outcome bias and action
    bias are directly testable.
-   **QA Lead --- PASS:** evidence, stop conditions and replay are
    explicit.

**Critical unresolved in this plan specification: 0.**\
**Major unresolved in this plan specification: 0.**

## 35. Approval Gate

**Document state:** `BASELINE CANDIDATE — READY FOR USER APPROVAL`

On explicit approval:

1.  promote `PAPER_PORTFOLIO_PLAN.md` to **Approved Baseline v1.0**;
2.  proceed only to `07_VALIDATION/MODEL_LIMITATIONS.md`;
3.  do not claim forward performance evidence that has not actually
    elapsed;
4.  do not proceed to `FINAL_VALIDATION_REPORT.md` until
    `MODEL_LIMITATIONS.md` is reviewed and approved.
