# VN30 Value Investing OS --- First DCA Review

**Path:** `08_PRODUCTION/FIRST_DCA_REVIEW.md`\
**Milestone:** M8 --- Production Readiness & Live Portfolio Onboarding\
**Version:** 0.1 --- Approval Candidate\
**Status:** READY FOR APPROVAL REVIEW --- FIRST LIVE DCA NOT EXECUTED\
**Governing baselines:** VVIOS v1.0 M1--M7 and approved M8
production/onboarding contracts

## 1. Purpose

Define the first live Monthly DCA Review under VVIOS v1.0.

This document freezes the DCA execution/recommendation contract. It does
not recommend a live purchase and does not require monthly cash to be
deployed.

**DCA is a capital-allocation opportunity, not a forced purchase
schedule.**

## 2. Core Workflow

**Contribution → Cash → Refresh → Scoring → Ranking → Eligibility →
Decision Engine → Position Sizing → Risk → Opportunity Cost → Lot
Constraint → Final Recommendation → Human Confirmation**

No stage may be skipped merely because monthly cash is available.

## 3. Preconditions

The first live DCA review requires, as applicable:

-   accepted/reconciled portfolio state;
-   accepted initial portfolio snapshot;
-   valid current VN30 universe;
-   required data initialization gates PASS;
-   accepted current scoring/ranking evidence;
-   accepted initial portfolio review;
-   available cash verified;
-   current risk/concentration state available;
-   exact release/model/data identities;
-   no Critical/Major blocker invalidating decision support.

If required evidence is unavailable, do not force a purchase.

## 4. Monthly Contribution

The operating plan currently expects approximately **5,000,000
VND/month**, but the actual contribution must be read from authoritative
portfolio/cash records.

Never assume that exactly 5,000,000 VND arrived.

Record:

-   contribution amount;
-   contribution date;
-   cash before contribution;
-   cash after contribution;
-   accumulated undeployed cash;
-   source transaction/reference.

Contribution and deployment are separate events.

## 5. Cash Accumulation

Unused DCA cash may accumulate across months.

There is no requirement to spend monthly cash simply because:

-   the month is ending;
-   cash weight increased;
-   no purchase was made last month;
-   a ticker price fell;
-   the system wants continuous activity.

Cash is an explicit portfolio state and may be the optimal outcome when
opportunity quality is insufficient.

## 6. Candidate Universe

Candidates must come only from the eligible VN30 universe under
governing policy.

A high-ranked ticker that fails investability, confidence, valuation,
risk, ownership/decision-state or other mandatory gates is not an
executable DCA candidate.

## 7. Scoring and Ranking

Use the accepted current scoring run.

Ranking is a discovery/prioritization layer, not a purchase instruction.

Do not:

-   buy Rank #1 automatically;
-   split DCA mechanically across Top 10;
-   alter scores to fit available cash;
-   prefer a ticker solely because its share price permits a 100-share
    lot.

## 8. Eligibility

Before allocating new capital, each candidate must satisfy the
applicable M4 BUY/ACCUMULATE eligibility rules.

A candidate may be:

-   eligible;
-   temporarily deferred;
-   blocked;
-   rejected/avoid under governing semantics.

Eligibility must be evidence-based.

## 9. BUY vs ACCUMULATE

Apply ownership semantics:

-   unowned eligible security → `BUY` where governing rules support it;
-   already-owned eligible security → `ACCUMULATE` where governing rules
    support adding capital.

Do not label an existing position BUY merely to simplify DCA output.

## 10. Thesis and Valuation

New capital requires an intact/sufficient thesis and attractive enough
valuation under approved required-return rules.

A price decline alone is not evidence of improved intrinsic value.

A lower price can support an add only when the thesis remains valid and
valuation becomes sufficiently attractive under the approved framework.

## 11. Position Sizing

For each eligible candidate, calculate the proposed post-trade position
using approved M4/risk rules.

Consider:

-   current holding quantity/value;
-   current portfolio weight;
-   proposed lot quantity;
-   proposed trade value;
-   post-trade weight;
-   sector exposure;
-   available cash;
-   risk caps/exceptions.

Do not size from conviction alone.

## 12. Minimum Lot Constraint

Each trade must respect the project's minimum lot constraint of **100
shares**.

For each candidate calculate:

`Minimum Executable Trade Value = 100 × executable/reference price + applicable estimated transaction costs`

If available allocable cash cannot support a valid minimum lot without
violating cash/risk rules, the candidate is not executable in that
cycle.

Do not reduce the lot below the allowed minimum to force deployment.

## 13. Risk Gate

Before final recommendation verify:

-   single-name exposure;
-   sector concentration;
-   portfolio drawdown state;
-   residual risk;
-   cash/liquidity;
-   applicable small-NAV exception;
-   other M1/M4 risk constraints.

A STRONG BUY/BUY/ACCUMULATE analytical state does not override portfolio
risk controls.

## 14. Opportunity Cost

Compare executable candidates, including the option to hold cash.

Assess:

-   forward expected return;
-   valuation margin/safety;
-   business/thesis quality;
-   confidence;
-   portfolio diversification/concentration effect;
-   lot-size efficiency;
-   risk;
-   switching hurdle if capital would come from selling another holding.

**Cash must remain in the opportunity set.**

## 15. No Forced Switching

Monthly DCA normally evaluates new available cash.

Do not sell an existing good holding merely to fund a monthly DCA
purchase unless an independently valid M4 REDUCE/SELL/switching decision
exists.

A new attractive candidate does not itself create a SELL signal
elsewhere.

## 16. Technical Entry

Technical analysis may optimize timing after fundamental/valuation/risk
eligibility.

It may support an execution state such as waiting for an entry condition
where approved.

It must not turn an ineligible investment into an eligible one.

## 17. Valid Portfolio-Level Outcomes

The DCA cycle may conclude with:

-   `DEPLOY` --- one or more explicitly approved executable allocations;
-   `HOLD CASH` --- no sufficiently attractive/executable opportunity;
-   `DEFER` --- potentially attractive opportunity exists but a required
    execution/data condition is not yet satisfied;
-   `BLOCKED` --- system/data/risk/governance issue prevents a reliable
    recommendation.

`HOLD CASH` is a successful decision outcome, not a failed DCA cycle.

## 18. Candidate Table

  ---------------------------------------------------------------------------------------------------------------------------
     Rank Ticker     Ownership   Score/Confidence   Decision   Valuation   Risk   Min Lot   Post-Trade Executable?   Reason
                                                    State                           Value       Weight               
  ------- ---------- ----------- ------------------ ---------- ----------- ------ ------- ------------ ------------- --------
      --- NOT        ---         ---                ---        ---         ---        ---          --- ---           ---
          EXECUTED                                                                                                   

  ---------------------------------------------------------------------------------------------------------------------------

No live candidate is prefilled.

## 19. DCA Allocation Table

  ------------------------------------------------------------------------------------
  Ticker           Qty   Reference      Est.      Est.      Cash   Post-Trade Status
                             Price     Trade     Costs     After       Weight 
                                       Value                                  
  ---------- --------- ----------- --------- --------- --------- ------------ --------
  NOT              ---         ---       ---       ---       ---          --- ---
  EXECUTED                                                                    

  ------------------------------------------------------------------------------------

This table is populated only for evidence-backed proposed allocations.

## 20. Cash Outcome

If `HOLD CASH`, record:

-   cash available;
-   why candidates failed or were inferior;
-   next review trigger;
-   data/valuation/price conditions that may change the result.

Do not invent a future buy price unless produced by approved
valuation/entry logic.

## 21. DCA Decision Record

Record:

-   DCA Review ID;
-   timestamp;
-   portfolio snapshot/state reference;
-   Data Snapshot ID;
-   Scoring Run ID;
-   policy/model/release versions;
-   contribution amount;
-   available cash;
-   candidate set;
-   eligibility outcomes;
-   position-sizing calculations;
-   risk checks;
-   opportunity-cost comparison;
-   lot checks;
-   final portfolio-level outcome;
-   proposed allocation, if any;
-   alternatives considered;
-   invalidation conditions;
-   review trigger;
-   human approval status.

## 22. Human Confirmation Gate

**System → Analyze → Recommend → Explain**\
**User → Review → Approve/Reject → Execute manually**\
**After execution → Actual Transaction → Ledger → Reconciliation**

A DCA recommendation is never an executed transaction.

If user executes a different quantity/price from the recommendation,
record the actual transaction rather than rewriting the recommendation.

## 23. Post-Execution Control

After a user-approved manual trade:

1.  capture actual execution;
2.  persist the actual transaction under approved ledger rules;
3.  update/reconstruct portfolio;
4.  reconcile holdings/cash;
5.  update audit trail;
6.  preserve linkage from recommendation → approval → actual execution.

Do not mark the recommendation price as the actual fill price.

## 24. Behavioral Review

Before approval, check:

-   FOMO because cash has accumulated;
-   action bias because this is the "monthly DCA" date;
-   anchoring to previous purchase price;
-   averaging-down impulse;
-   chasing a recent winner;
-   desire to deploy all cash;
-   loss aversion blocking rational switching where switching is
    independently justified.

A calendar date is not an investment thesis.

## 25. First DCA Execution Summary

  Field                   Value
  ----------------------- --------------
  DCA Review ID           NOT EXECUTED
  Review As-Of            NOT EXECUTED
  Contribution            NOT EXECUTED
  Available Cash          NOT EXECUTED
  Data Snapshot ID        NOT EXECUTED
  Scoring Run ID          NOT EXECUTED
  Eligible Candidates     NOT EXECUTED
  Executable Candidates   NOT EXECUTED
  Final Outcome           NOT EXECUTED
  Human Approval          NOT EXECUTED
  Actual Execution        NOT EXECUTED

## 26. Acceptance Gates

  -------------------------------------------------------------------------------
  Gate                    Requirement                     Current State
  ----------------------- ------------------------------- -----------------------
  DC1                     Upstream                        NOT EXECUTED
                          portfolio/data/scoring/review   
                          evidence valid                  

  DC2                     Actual contribution/cash        NOT EXECUTED
                          verified                        

  DC3                     Candidate universe/ranking      NOT EXECUTED
                          current                         

  DC4                     Eligibility/decision states     NOT EXECUTED
                          valid                           

  DC5                     Thesis/valuation gates applied  NOT EXECUTED

  DC6                     Position sizing computed        NOT EXECUTED

  DC7                     Portfolio risk checks PASS      NOT EXECUTED

  DC8                     Opportunity cost including cash NOT EXECUTED
                          evaluated                       

  DC9                     100-share lot constraint        NOT EXECUTED
                          applied                         

  DC10                    Technical execution layer used  NOT EXECUTED
                          only within mandate             

  DC11                    Behavioral review complete      NOT EXECUTED

  DC12                    Recommendation/audit record     NOT EXECUTED
                          complete                        

  DC13                    Human confirmation boundary     NOT EXECUTED
                          preserved                       

  DC14                    Post-execution reconciliation   NOT EXECUTED
                          defined/completed if trade      
                          occurs                          

  DC15                    No Critical/Major unresolved    NOT EXECUTED
  -------------------------------------------------------------------------------

A completed DCA review can PASS even when final outcome is `HOLD CASH`,
provided all applicable gates are satisfied.

## 27. Failure and Escalation

Use `BLOCKED` or governing escalation mechanisms when:

-   required data is stale/missing;
-   portfolio state is unreconciled;
-   scoring/decision implementation diverges from baseline;
-   risk calculation is unavailable;
-   lot/price information is unreliable;
-   policy ambiguity affects the result.

Never convert uncertainty into a purchase to complete the monthly
workflow.

## 28. Multi-Role Review

**CIO:** Monthly cadence can create forced-deployment bias. Fixed by
making HOLD CASH a first-class successful outcome. Critical 0; Major 0.

**Portfolio Manager:** Ranking may bypass portfolio construction. Fixed
by position sizing, risk, opportunity-cost and lot gates after ranking.
Critical 0; Major 0.

**Risk Manager:** Small NAV and 100-share lots can create concentration.
Fixed by mandatory post-trade weight/sector/risk checks. Critical 0;
Major 0.

**Equity Research Analyst:** Falling price could be misused as DCA
justification. Fixed by requiring intact thesis plus attractive
valuation. Critical 0; Major 0.

**Behavioral Finance Reviewer:** Accumulated cash may trigger
FOMO/action bias. Fixed by explicit cash alternative and behavioral
checklist. Critical 0; Major 0.

**Financial Systems / QA:** Recommendation could be confused with
execution. Fixed by human gate and recommendation → approval → actual
transaction → reconciliation lineage. Critical 0; Major 0.

## 29. Re-Review Result

**Critical specification issues:** 0 unresolved\
**Major specification issues:** 0 unresolved\
**First live DCA review:** NOT EXECUTED\
**Capital deployment:** NOT AUTHORIZED\
**HOLD CASH:** VALID outcome

## 30. Current Decision

**Document quality:** PASS FOR APPROVAL REVIEW\
**First DCA contract:** READY\
**Live DCA recommendation:** BLOCKED pending upstream evidence\
**Forced deployment:** PROHIBITED

## 31. Approval Effect

When explicitly approved:

1.  promote `FIRST_DCA_REVIEW.md` to **Approved Baseline v1.0**;
2.  approval freezes the DCA review contract, not a live allocation;
3.  DC1--DC15 remain evidence-dependent;
4.  no live purchase or cash amount may be fabricated;
5.  proceed only to the next M8 deliverable;
6.  live deployment remains subject to human approval and manual
    execution.

**END OF DOCUMENT**
