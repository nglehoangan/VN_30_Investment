# VN30 Value Investing OS — Operating Model

**Document:** `05_PORTFOLIO_WORKFLOW/OPERATING_MODEL.md`  
**Milestone:** 5 — Portfolio Management Workflow  
**Status:** Approved Baseline  
**Version:** 1.0  
**Date:** 2026-09-07  

**Governing Baselines:** Milestones 1–4, as explicitly approved by the user.  
**Primary Dependencies:**  
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

This document defines the operating architecture for managing the VN30 Value Investing OS after the investment constitution, data model, scoring engine, and Buy / Hold / Sell Decision Engine have already been approved.

Its purpose is to ensure that portfolio management is:

- consistent with a 5–10+ year Value Investing horizon;
- sufficiently attentive to material change without requiring daily monitoring;
- auditable from source data to final decision;
- resistant to action bias and overtrading;
- capable of escalating rapidly when material risk or thesis changes occur;
- compatible with monthly DCA contributions without forcing deployment;
- reproducible from approved portfolio, reference, market, scoring, and decision inputs.

This file defines **when and how the system reviews**.

It does **not** redefine:

- scoring weights or score thresholds;
- ranking methodology;
- hard risk vetoes;
- concentration limits;
- Buy / Accumulate rules;
- Reduce / Sell rules;
- DCA eligibility rules;
- position-sizing formulas;
- opportunity-cost logic;
- accounting truth;
- market-data truth.

If a workflow requires one of those rules, it must call the approved owning document.

---

# 2. Operating Philosophy

## 2.1 Long-term by default

The system is designed for long-term ownership.

Normal operating behavior is therefore:

> **Observe → verify materiality → review only what changed → escalate only when required → trade only when an approved trigger and decision process justify it.**

The operating model must never create a trade simply because a scheduled review occurred.

Valid outcomes include:

- `HOLD POSITION`;
- `HOLD CASH`;
- `NO ACTION`;
- `REVIEW REQUIRED`;
- `DECISION REQUIRED`.

## 2.2 Review frequency must match the strategy

The user normally checks the market approximately two to three times per week.

Therefore:

- daily full-portfolio review is not required;
- daily price monitoring is not a mandatory operating dependency;
- weekly review is the normal surveillance layer;
- monthly review is the normal capital-allocation layer;
- quarterly review is the normal deep fundamental layer;
- annual review is the strategic learning/governance layer;
- event-driven review overrides calendar cadence when a material trigger occurs.

## 2.3 Fundamentals dominate price action

Review priority is:

1. mandate / eligibility;
2. business and thesis;
3. financial health;
4. material fundamental change;
5. valuation and expected return;
6. risk;
7. portfolio allocation and concentration;
8. opportunity cost;
9. market / money flow;
10. technical entry.

Short-term price action is a **review input**, not a thesis.

## 2.4 No forced action

The absence of an eligible opportunity is itself a valid operating result.

Monthly cash contribution does not imply monthly purchase.

A scheduled review that finds no material change should normally end as:

> `NO ACTION — EXISTING THESIS / RISK / ALLOCATION REMAIN WITHIN APPROVED BOUNDS`

---

# 3. Governance and Rule Precedence

## 3.1 Governing hierarchy

M5 is an orchestration layer.

When a workflow invokes an approved rule, authority remains with the source document that owns that rule.

High-level precedence:

1. `INVESTMENT_POLICY.md`
2. `RISK_POLICY.md`
3. approved concept-owning M1–M4 documents
4. `OPERATING_MODEL.md`
5. workflow-specific M5 files
6. templates / checklists / implementation artifacts

M5 must not silently override a higher-precedence rule.

## 3.2 Conflict handling

If two approved documents appear to conflict:

1. identify the exact rules;
2. identify the owning document for each concept;
3. stop the affected calculation, recommendation, or workflow step if the conflict is decision-material;
4. classify the issue as `RULE CONFLICT`;
5. escalate for explicit resolution;
6. do not invent a compromise;
7. preserve the prior approved baseline until a new approved rule supersedes it.

## 3.3 Baseline identity requirement

Every operational review must record the methodology/baseline versions used.

At minimum:

- Investment Policy version;
- Risk Policy version;
- Decision Framework version;
- Scoring Engine / scoring methodology version;
- Ranking Rules version;
- Decision Engine version;
- relevant M4 rule-file versions;
- data-method/accounting versions when material.

A workflow cannot be fully auditable if the applicable baseline cannot be identified.

---

# 4. M1–M4 Integration Findings

## 4.1 Confirmed operating principles

The approved upstream architecture establishes the following constraints that M5 must preserve:

- only current VN30 constituents may receive new capital;
- removed constituents become Legacy Holdings;
- Legacy Holdings cannot receive additional capital;
- Legacy Holdings require an orderly exit plan and periodic review;
- a VN30 addition does not automatically justify purchase;
- a score is decision support, not automatic trading authority;
- portfolio accounting must be reconstructed from authoritative M2 sources;
- missing/conflicting data must be surfaced, not guessed;
- portfolio actionability can be blocked by unreconciled portfolio state;
- cash is a valid capital-allocation alternative;
- a board-lot constraint affects execution, not intrinsic investment merit;
- monthly contributions do not force deployment;
- price decline alone does not justify averaging down;
- price appreciation alone does not justify selling;
- opportunity cost is mandatory for capital allocation;
- risk vetoes and portfolio limits take precedence over attractiveness.

## 4.2 VN30 removal policy interpretation

The governing Investment Policy already establishes a mandatory **orderly-exit obligation** for Legacy Holdings.

Therefore M5 must not treat a removed holding as eligible for indefinite HOLD.

However, the upstream policy does not establish a universal numeric grace period.

M5 therefore defines:

- immediate reclassification to `LEGACY HOLDING`;
- prohibition on new capital;
- mandatory exit-plan creation;
- periodic review;
- escalation if the exit plan becomes stale or is not progressing;

but does **not** invent a fixed 30/60/90-day liquidation deadline.

A numeric grace period, if desired later, requires explicit policy approval.

## 4.3 Version-metadata control

Operational audit must distinguish:

- **project approval state**; and
- **metadata shown in a particular stored file snapshot**.

If a stored copy still shows `Draft` / `Awaiting Approval` after explicit approval, it is a document-governance metadata issue, not authority to silently downgrade the approved project baseline.

Before implementation, the canonical baseline registry should be synchronized so each production workflow can pin one unambiguous version.

---

# 5. Standard Operating Cycle

The standard cycle is:

```text
EVENT-DRIVEN SURVEILLANCE
          ↓
WEEKLY REVIEW
          ↓
MONTHLY DCA REVIEW
          ↓
QUARTERLY FUNDAMENTAL REVIEW
          ↓
ANNUAL STRATEGIC REVIEW
```

Event-driven review may occur at any point and may bypass the normal schedule when a material trigger is detected.

The cycle is cumulative, not duplicative.

A quarterly review should reuse valid weekly/monthly inputs rather than re-entering identical data.

An annual review should reuse validated portfolio-performance and decision-audit records rather than reconstructing them informally.

---

# 6. Review Types and Cadence

| Review | Default cadence | Primary purpose | Normal depth | Can create Decision Engine trigger? |
|---|---|---|---|---|
| Weekly Review | Weekly | Material-change surveillance | Light / exception-based | Yes |
| Monthly DCA Review | Monthly | Allocate new/carry cash | Medium | Yes |
| Quarterly Fundamental Review | Quarterly | Full holding underwriting refresh | Deep | Yes |
| Annual Strategic Review | Annually | Performance, system, policy-assumption review | Strategic | Yes, but not automatic policy change |
| Event-Driven Review | Any time | Investigate material event | Variable / priority-based | Yes |
| VN30 Reconstitution Review | Each official composition change | Membership governance | Deep for affected names | Yes |
| Portfolio Risk Review | Embedded weekly/monthly + deep quarterly | Portfolio-level risk surveillance | Variable | Yes |
| Investment Journal | At every material decision | Audit record | Record-keeping | No, records outcome |
| Decision Audit | ~3/6/12 months after decision | Process-quality review | Retrospective | May create learning/escalation, not hindsight trade |
| Performance Review | Monthly summary / quarterly / annual | Measure results correctly | Analytical | May inform review, not direct trade |

---

# 7. Review Outcome Taxonomy

Every review must end in exactly one operating disposition.

## 7.1 `NO ACTION`

Use when:

- no material thesis change;
- no material risk change;
- no mandate change;
- no relevant concentration breach;
- no decision-critical data problem;
- no valuation/expected-return trigger requiring reassessment;
- no DCA deployment opportunity that passes approved gates;
- no material event requiring deeper work.

`NO ACTION` is not equivalent to “nothing was checked.”

The review record must state what was checked and why no escalation was needed.

## 7.2 `REVIEW REQUIRED`

Use when a trigger exists but the system does not yet have sufficient validated evidence for a formal portfolio decision.

Examples:

- material news requiring fact verification;
- unusual earnings result requiring normalized analysis;
- major price movement requiring valuation refresh;
- data discrepancy;
- VN30 membership transition;
- concentration approaching a threshold;
- possible thesis weakening;
- governance/legal report requiring investigation.

`REVIEW REQUIRED` must name:

- trigger;
- affected ticker/portfolio area;
- required data;
- review owner;
- priority;
- next review state.

It does not authorize a trade.

## 7.3 `DECISION REQUIRED`

Use when validated evidence indicates that an approved M4 decision process must be run.

Examples:

- thesis becomes `WEAKENING`, `BROKEN`, or materially `IMPROVING`;
- hard-risk or portfolio-rule trigger;
- valid Buy / Accumulate candidate emerges during DCA review;
- valuation crosses a decision-relevant threshold;
- mandatory Legacy Holding exit decision;
- concentration breach;
- formal switching/opportunity-cost case;
- material business deterioration;
- mandatory risk escalation.

`DECISION REQUIRED` calls the approved M4 Decision Engine.

It does not predetermine the resulting Decision State.

---

# 8. Trigger Hierarchy

Triggers are prioritized by **decision importance**, not by price magnitude.

## Level T0 — Informational

Examples:

- immaterial normal price movement;
- routine company announcement;
- expected dividend timetable;
- non-material market commentary.

Default:

> `NO ACTION`

unless combined with other evidence.

## Level T1 — Monitor

Examples:

- moderate price change without fundamental evidence;
- sector news with uncertain issuer impact;
- valuation movement toward a known review zone;
- position/sector weight approaching a limit.

Default:

> `NO ACTION` or `REVIEW REQUIRED` at next scheduled review.

## Level T2 — Material Review

Examples:

- major earnings surprise;
- significant margin/cash-flow deterioration;
- management change;
- material capital raise/debt issuance;
- major acquisition;
- regulatory/legal development;
- price movement large enough to materially change valuation or portfolio weight;
- score/rank change driven by new validated evidence.

Default:

> `REVIEW REQUIRED`

Perform Deep Review for affected areas.

## Level T3 — Decision Escalation

Examples:

- thesis `WEAKENING`;
- valuation reaches an approved Buy / Reduce / Sell review threshold;
- position/sector concentration breach or required remediation;
- current DCA candidate passes all pre-decision gates;
- Legacy Holding requires exit action;
- material opportunity-cost switch case;
- mandatory portfolio drawdown review requiring allocation decision.

Default:

> `DECISION REQUIRED`

Invoke M4.

## Level T4 — Critical / Immediate Governance-Risk Review

Examples:

- fraud/governance integrity issue;
- severe solvency/liquidity deterioration;
- trading suspension or major legal sanction;
- confirmed hard-veto condition;
- severe accounting/data integrity failure affecting portfolio truth;
- material portfolio-risk breach requiring immediate diagnosis.

Default:

> immediate `REVIEW REQUIRED` or `DECISION REQUIRED` depending evidence sufficiency.

T4 does not mean “automatic SELL.”

The approved Risk Policy / Decision Engine determines the final state.

---

# 9. Materiality Principle

M5 must avoid hard-coding new thresholds already owned by M1–M4.

Therefore materiality is determined using the following precedence:

1. explicit threshold in an approved governing document;
2. documented company/thesis invalidation condition;
3. documented portfolio risk threshold;
4. documented valuation/expected-return threshold;
5. evidence that could reasonably change score validity, thesis status, risk classification, portfolio fit, or final Decision State;
6. if none applies, analyst judgment with explicit rationale.

A price move such as approximately ±15–20% is a **review trigger candidate**, not a trade trigger.

---

# 10. Data Dependency Architecture

## 10.1 Authoritative data classes

### A. Portfolio / accounting state

Required as applicable:

- transaction ledger;
- settled/unsettled cash;
- position quantities;
- cost basis;
- market value;
- realized/unrealized P&L;
- dividends;
- NAV;
- portfolio weights;
- sector weights;
- contributions/withdrawals.

Authority remains with M2.

### B. Reference data

Required:

- Security Master;
- effective-dated VN30 membership;
- effective-dated sector classification;
- corporate actions;
- benchmark identity/methodology.

### C. Market data

Required as applicable:

- dated security prices;
- benchmark observations;
- market/liquidity data;
- technical-entry data if relevant.

### D. Fundamental data

Required as applicable:

- financial statements;
- earnings releases;
- annual reports;
- management commentary;
- guidance;
- company disclosures;
- regulatory disclosures;
- material news.

### E. Analytical data

Derived from approved models:

- score;
- score validity;
- data confidence;
- thesis status;
- valuation range;
- expected forward return;
- risk flags;
- Top-10 ranking;
- opportunity-cost comparison.

## 10.2 Data-quality gate

Before a workflow may produce an actionable decision:

- data lineage must be identifiable;
- `as-of` dates must be recorded;
- required fields must satisfy approved freshness rules;
- portfolio state must be sufficiently reconciled for the intended action;
- material missing/conflicting data must be surfaced;
- facts, estimates, and assumptions must remain distinguishable.

If data quality could materially change the decision:

> `REVIEW STATUS = PENDING / ESCALATED`

and new capital must not be authorized until resolved under approved M4 rules.

## 10.3 Do not refresh everything unnecessarily

Weekly operation should be exception-driven.

The system should not re-download or re-underwrite every fundamental metric merely because seven calendar days passed.

Refresh only when:

- source data changed;
- freshness policy requires it;
- a review trigger exists;
- the review type requires a full refresh.

Monthly and quarterly workflows may have broader refresh requirements.

---

# 11. Canonical Operating Workflow

```text
1. INGEST / RECORD NEW FACTS
        ↓
2. VALIDATE + RECONCILE DATA
        ↓
3. RECONSTRUCT PORTFOLIO SNAPSHOT
        ↓
4. CLASSIFY REVIEW TYPE
        ↓
5. DETECT MATERIAL TRIGGERS
        ↓
6. UPDATE AFFECTED THESIS / RISK / VALUATION / SCORE
        ↓
7. REFRESH RANKING WHEN REQUIRED
        ↓
8. CLASSIFY:
   NO ACTION
   REVIEW REQUIRED
   DECISION REQUIRED
        ↓
9A. NO ACTION
    → record review result
        ↓
9B. REVIEW REQUIRED
    → Deep Review
    → collect missing evidence
    → return to Step 6
        ↓
9C. DECISION REQUIRED
    → invoke M4 Decision Engine
        ↓
10. APPLY BUY/SELL/DCA/SIZING/OPPORTUNITY-COST RULES
        ↓
11. CREATE DECISION RECORD
        ↓
12. EXECUTE ONLY IF AUTHORIZED
        ↓
13. RECORD TRANSACTION IN AUTHORITATIVE LEDGER
        ↓
14. RECONCILE POST-TRADE STATE
        ↓
15. UPDATE JOURNAL + AUDIT LINKS
        ↓
16. SCHEDULE FOLLOW-UP / DECISION AUDIT
```

---

# 12. Escalation: Weekly → Deep Review → Decision Engine

## 12.1 Weekly Review

Weekly Review is a surveillance layer.

It should answer:

> “Did anything material change enough to require deeper work?”

It should not routinely re-underwrite every holding.

Possible outcome:

- `NO ACTION`;
- `REVIEW REQUIRED`;
- `DECISION REQUIRED`.

## 12.2 Deep Review

Deep Review is not a new Decision State.

It is an analysis intensity used when Weekly/Event Review finds a material issue.

Deep Review may include:

- updated financial analysis;
- thesis reconstruction;
- valuation update;
- risk diagnosis;
- management/governance review;
- sector review;
- portfolio-impact reconstruction;
- score refresh;
- ranking refresh;
- opportunity-cost analysis.

Possible outcome:

- return to `NO ACTION`;
- remain `REVIEW REQUIRED` because evidence is incomplete;
- escalate to `DECISION REQUIRED`.

## 12.3 Decision Engine

Only after evidence is sufficient should the workflow invoke the approved M4 Decision Engine.

The engine then returns one approved portfolio Decision State:

- `STRONG BUY`
- `BUY`
- `ACCUMULATE`
- `HOLD`
- `REDUCE`
- `SELL`
- `AVOID`

The M5 workflow must not invent an eighth portfolio Decision State.

---

# 13. Weekly Review Operating Contract

## Required inputs

- latest reconstructable portfolio snapshot;
- cash;
- position weights;
- sector weights;
- relevant latest prices;
- material company/regulatory news since prior review;
- earnings/calendar events;
- VN30 membership status;
- last thesis status;
- current risk flags;
- latest valid ranking;
- prior unresolved review items.

## Required checks

1. NAV.
2. Cash.
3. Position weights.
4. Sector weights.
5. material price changes.
6. material company news.
7. regulatory/legal events.
8. earnings announcements.
9. VN30 membership changes.
10. thesis status.
11. risk flags.
12. Top-10 opportunity ranking status.
13. decision triggers.

## Output

Exactly one operating disposition per issue and an overall weekly disposition:

- `NO ACTION`
- `REVIEW REQUIRED`
- `DECISION REQUIRED`

Detailed mechanics belong in `WEEKLY_REVIEW.md`.

---

# 14. Monthly DCA Operating Contract

Monthly DCA Review is the standard new-cash allocation process.

## Sequence

1. confirm planned contribution;
2. confirm actual contribution from authoritative transaction/ledger data;
3. reconcile executable cash;
4. refresh required data;
5. refresh VN30 ranking;
6. identify eligible candidates;
7. apply approved Buy / Accumulate gates;
8. apply Position Sizing;
9. apply concentration rules;
10. apply Opportunity Cost;
11. apply board-lot constraints;
12. compare best valid deployment against cash;
13. produce final recommendation;
14. journal a material `HOLD CASH` decision.

## Permitted results

- Buy approved board-lot(s);
- Accumulate approved board-lot(s);
- split deployment if permitted by approved sizing/DCA rules;
- `HOLD CASH`.

Monthly DCA Review must not force full contribution deployment.

Detailed mechanics belong in `MONTHLY_DCA_REVIEW.md`.

---

# 15. Quarterly Fundamental Operating Contract

Quarterly review is the primary deep fundamental refresh for each holding.

For each holding, review as applicable:

- revenue;
- earnings;
- margins;
- cash flow;
- balance sheet;
- debt;
- ROE / ROIC or sector-specific metrics;
- management commentary;
- guidance;
- sector conditions;
- valuation;
- thesis;
- risk;
- updated score;
- confidence.

Canonical thesis states:

- `IMPROVING`
- `INTACT`
- `WEAKENING`
- `BROKEN`
- `PENDING` where evidence is insufficient

`WEAKENING` or `BROKEN` must escalate under the approved Decision Engine.

Quarterly review should also refresh ranking where changed evidence is material to relative attractiveness.

Detailed mechanics belong in `QUARTERLY_REVIEW.md`.

---

# 16. Annual Strategic Operating Contract

Annual review evaluates whether the investment system is working, not merely whether prices went up.

Review at minimum:

- portfolio CAGR;
- XIRR / investor-experience return;
- TWR where required for manager-versus-benchmark comparison;
- VN30 benchmark return;
- drawdown;
- cash drag;
- sector allocation;
- concentration;
- turnover;
- realized return;
- unrealized return;
- dividends;
- decision quality;
- behavioral mistakes;
- scoring effectiveness;
- Investment Policy assumptions.

One-year underperformance is insufficient evidence to change the Investment Policy.

Any policy change must:

- be supported by evidence;
- identify the rule being changed;
- identify expected benefit and risk;
- be versioned;
- be separately approved.

Detailed mechanics belong in `ANNUAL_REVIEW.md`.

---

# 17. Event-Driven Review Architecture

Event review may occur at any time.

## Company events

Examples:

- CEO/chairman change;
- fraud/governance concern;
- major acquisition;
- large capital raise;
- dividend-policy change;
- major debt issuance;
- legal problem;
- earnings warning;
- regulatory sanction;
- unexpected business deterioration.

## Market events

Examples:

- market crash;
- liquidity shock;
- interest-rate shock;
- major policy change;
- currency shock.

## Position events

Examples:

- material price move;
- decision-relevant valuation threshold reached;
- material portfolio-weight change;
- concentration threshold event;
- thesis invalidation condition;
- risk threshold event.

Event detection creates a review.

It does not automatically create a trade.

Detailed trigger catalog belongs in `EVENT_DRIVEN_REVIEW.md`.

---

# 18. VN30 Reconstitution Operating Contract

## 18.1 Stock added

When a security enters VN30:

1. verify official/effective membership;
2. update VN30 Master using approved M2 rules;
3. establish research eligibility;
4. perform full scoring;
5. determine score validity/confidence;
6. rank against current opportunities;
7. run M4 Decision Engine only if allocation is being considered.

Result must not default to BUY.

## 18.2 Stock removed

When an owned security leaves VN30:

1. confirm effective removal;
2. classify as `LEGACY HOLDING`;
3. block all new purchases/additions;
4. preserve position in NAV/risk/performance;
5. perform an exit-oriented review;
6. create documented orderly exit plan;
7. consider thesis, valuation, liquidity, fees/taxes where relevant, risk, and opportunity cost;
8. set next review date;
9. escalate overdue/stale exit plan;
10. continue periodic review until fully exited.

No universal liquidation deadline is introduced by M5 unless a higher-level policy later approves one.

Detailed mechanics belong in `VN30_RECONSTITUTION.md`.

---

# 19. Portfolio Risk Review Architecture

Risk review is embedded in every cadence.

At minimum monitor:

- Total NAV;
- cash percentage;
- largest position;
- Top-3 concentration;
- sector concentration;
- number of holdings;
- portfolio drawdown;
- unrealized-loss exposures;
- thesis-broken positions;
- low-confidence positions;
- overvalued positions;
- high-risk flags;
- Legacy Holdings;
- unresolved data-integrity flags.

Risk status taxonomy:

- `GREEN`
- `WATCH`
- `WARNING`
- `BREACH`

These are **workflow/risk-dashboard statuses**, not M4 portfolio Decision States.

A `BREACH` must invoke the relevant approved risk escalation.

A risk dashboard must not automatically map:

- `WATCH → REDUCE`;
- `WARNING → SELL`;
- `BREACH → SELL`.

The M4 Decision Engine remains responsible for security-level final action.

Detailed mechanics belong in `PORTFOLIO_RISK_REVIEW.md`.

---

# 20. Investment Journal Architecture

A journal record is required for:

- executed purchases;
- executed reductions;
- executed sells;
- material HOLD decisions;
- material monthly `HOLD CASH`;
- Legacy Holding exit decisions;
- major rejected opportunities where future audit value is high;
- policy exceptions/approvals where applicable.

Minimum fields:

- Decision ID;
- Date;
- Data As-Of Date;
- Portfolio Snapshot ID;
- Ticker / Security ID;
- Action / Decision State;
- Shares;
- Price;
- Score;
- Score Validity;
- Confidence;
- Thesis;
- Valuation;
- Risk;
- Portfolio context;
- Opportunity-cost context;
- reason;
- expected outcome;
- invalidation condition;
- review date;
- methodology versions;
- links to source evidence;
- execution status;
- linked transaction ID if executed.

Detailed schema belongs in `INVESTMENT_JOURNAL.md`.

---

# 21. Decision Audit Architecture

Decision Audit should normally be scheduled around:

- ~3 months;
- ~6 months;
- ~12 months;

where meaningful.

Review categories:

1. data quality at decision time;
2. logic quality;
3. policy compliance;
4. risk handling;
5. valuation discipline;
6. portfolio context;
7. opportunity-cost reasoning;
8. execution discipline;
9. behavioral bias;
10. outcome.

Outcome must be separated from decision quality.

Required classification framework:

| Decision quality | Outcome | Interpretation |
|---|---|---|
| Good | Good | Correct process, favorable outcome |
| Good | Bad | Correct process, unfavorable outcome |
| Bad | Good | Process error masked by favorable outcome |
| Bad | Bad | Process error and unfavorable outcome |

No hindsight-only rule may be used to declare an old decision wrong.

The audit should compare the decision with information reasonably available **at that time**.

---

# 22. Behavioral Review Architecture

Monitor at minimum:

- FOMO;
- anchoring;
- loss aversion;
- disposition effect;
- confirmation bias;
- recency bias;
- overconfidence;
- action bias.

Behavioral controls apply to both trades and non-trades.

Examples:

- repeatedly delaying a required sell because of break-even anchoring;
- buying because monthly cash is available;
- chasing the current Top-1 rank after a recent price surge;
- holding a deteriorating company because of sunk cost;
- selling a strong compounder merely to lock in profit;
- repeatedly overriding cash because of discomfort with inactivity.

Repeated patterns must be logged in `LESSONS.md` once that artifact is defined.

Detailed workflow belongs in `BEHAVIORAL_REVIEW.md`.

---

# 23. Performance Review Architecture

M5 must distinguish capital flows from investment performance.

Minimum measures:

- Contributions;
- Withdrawals;
- NAV;
- Total Return;
- XIRR;
- CAGR;
- Realized P&L;
- Unrealized P&L;
- Dividends;
- Maximum Drawdown;
- VN30 benchmark return.

Where upstream M2 benchmark methodology requires TWR/unitization for manager-versus-benchmark comparison, that methodology remains authoritative.

Performance review must not equate:

> higher NAV = better investment performance

when external contributions occurred.

It must also disclose benchmark-methodology limitations where portfolio and benchmark return definitions differ.

---

# 24. Audit Trail Requirements

Every material review must be reconstructable through:

```text
Review ID
→ Review Type
→ Review Date
→ Data As-Of
→ Portfolio Snapshot
→ Source Evidence
→ Data-Quality Status
→ Trigger(s)
→ Prior Thesis / Score / Rank
→ Updated Thesis / Score / Rank if applicable
→ Risk Status
→ Operating Disposition
→ Decision ID if escalated
→ Execution / Transaction ID if executed
→ Post-Decision Review Date
```

## 24.1 Required identifiers

At minimum:

- `review_id`;
- `decision_id` where applicable;
- `portfolio_snapshot_id`;
- `transaction_id` where applicable;
- `security_id`;
- source/evidence references;
- methodology versions.

## 24.2 As-of integrity

The system must distinguish:

- event date;
- source publication date;
- data as-of date;
- review date;
- decision date;
- trade date;
- settlement date;
- performance period.

No workflow may present stale data as current merely because it was retrieved recently.

## 24.3 Facts / estimates / assumptions

Material analytical inputs should be classified as:

- `FACT`;
- `ESTIMATE`;
- `ASSUMPTION`.

A decision-critical assumption must be visible in the audit record.

---

# 25. Files Updated by Workflow

| Workflow | Mandatory / expected updates |
|---|---|
| Weekly Review | Weekly review record; risk flags; unresolved-review register; journal only if material decision |
| Monthly DCA Review | DCA review record; contribution/cash reconciliation reference; ranking snapshot; decision record; journal; transaction ledger only if executed |
| Quarterly Review | holding research/scorecards; thesis status; risk status; ranking snapshot; decision record if triggered |
| Annual Review | performance record; decision-audit summary; behavioral review; policy-assumption review; lessons |
| Event-Driven Review | event record; affected thesis/risk/valuation; decision record if escalated |
| VN30 Reconstitution | VN30 Master reference/update; membership review; Legacy Holding exit plan; scorecard for additions; decision records |
| Portfolio Risk Review | portfolio-risk snapshot/status; breach/escalation record |
| Investment Journal | immutable/append-oriented journal entry |
| Decision Audit | audit entry linked to original Decision ID |
| Performance Review | performance-period snapshot and benchmark-comparison record |

## 25.1 Source-of-truth firewall

M5 review files must never directly overwrite:

- cash;
- share quantity;
- cost basis;
- realized P&L;
- NAV;
- VN30 membership;
- sector classification;
- benchmark observations.

Those remain owned by M2.

---

# 26. When Ranking Must Be Refreshed

Ranking refresh is required when:

- monthly DCA Review needs current opportunity comparison;
- quarterly fundamental changes materially affect scores or forward returns;
- a new VN30 constituent enters;
- an existing scored security has material new evidence;
- a material valuation move changes relative opportunity;
- an event changes thesis/risk/score validity;
- a prior Top-10 candidate becomes non-actionable;
- data correction materially changes scoring inputs.

Ranking refresh is not required solely because a week elapsed if inputs remain valid and no material ranking driver changed.

---

# 27. When Score Must Be Refreshed

A full or affected score refresh is required when new validated evidence could materially change:

- Business Quality;
- Financial Health;
- Growth;
- Industry / Competitive Position;
- Valuation & Forward Return;
- Risk & Governance;
- Capital Allocation Quality;
- score validity;
- confidence.

A short-term price move may require only valuation/forward-return refresh first.

Do not mechanically rescore stable non-price categories because the market price moved.

---

# 28. When No Action Is the Preferred Outcome

`NO ACTION` should normally be preferred when:

- thesis remains intact;
- valuation remains within a non-trigger range;
- no material risk event exists;
- allocation remains compliant;
- no superior capital action passes approved opportunity-cost hurdles;
- new DCA cash has no eligible deployment;
- price movement is not accompanied by decision-relevant evidence;
- technical signals conflict with no fundamental trigger;
- current information is merely noise.

This rule exists to prevent the review calendar from becoming a trading calendar.

---

# 29. Operating Exceptions

Any workflow exception that bypasses a normal step must record:

- reason;
- approving authority where required;
- rule being bypassed;
- why bypass is permitted;
- duration;
- compensating control;
- next review date.

No recurring exception may silently become a new policy.

Repeated exceptions require governance review.

---

# 30. M5 File Architecture

Recommended structure remains:

```text
05_PORTFOLIO_WORKFLOW/
├── OPERATING_MODEL.md
├── WEEKLY_REVIEW.md
├── MONTHLY_DCA_REVIEW.md
├── QUARTERLY_REVIEW.md
├── ANNUAL_REVIEW.md
├── EVENT_DRIVEN_REVIEW.md
├── VN30_RECONSTITUTION.md
├── PORTFOLIO_RISK_REVIEW.md
├── INVESTMENT_JOURNAL.md
├── PERFORMANCE_REVIEW.md
├── BEHAVIORAL_REVIEW.md
├── REVIEW_TEMPLATES.md
└── VALIDATION_CASES.md
```

## 30.1 Recommendation

Keep the proposed structure.

Reason:

- each file has one clear operating responsibility;
- scheduled reviews are separated from event-driven reviews;
- risk/journal/performance are cross-cutting but independently auditable;
- templates remain separate from rules;
- validation cases remain separate from production workflow definitions;
- the structure avoids redesigning M3/M4.

One optional future artifact may be added only if needed:

`LESSONS.md`

This should be an append-oriented learning record referenced by Behavioral Review, not a new policy source.

---

# 31. Operating Acceptance Criteria

`OPERATING_MODEL.md` is acceptable only if:

1. no M1–M4 rule is silently changed;
2. scheduled review does not imply scheduled trading;
3. weekly review is exception-based;
4. DCA may result in `HOLD CASH`;
5. event detection creates review, not automatic Buy/Sell;
6. only the M4 Decision Engine assigns portfolio Decision States;
7. Legacy Holdings cannot receive new capital;
8. Legacy Holdings have an orderly-exit workflow without an invented grace period;
9. authoritative M2 state is not duplicated;
10. score/ranking refresh is conditional on materiality/cadence;
11. data-quality failure can block actionability;
12. all material decisions have an audit trail;
13. behavioral review assesses both action and inaction;
14. performance separates contributions from investment return;
15. rule/version lineage is reproducible.

---

# 32. Multi-Role Review

## 32.1 CIO Review

### Critical issues
- **0 unresolved.**

### Major issues found and addressed
1. **Risk of turning calendar reviews into trading cadence.**  
   Resolved by explicit `NO ACTION / REVIEW REQUIRED / DECISION REQUIRED` operating outcomes and by requiring M4 escalation before trading.

2. **Risk of M5 redefining M4 decision logic.**  
   Resolved by source ownership, precedence, and Decision Engine boundaries.

3. **Ambiguity around VN30 removals.**  
   Resolved by enforcing mandatory orderly-exit planning while refusing to invent a grace period.

### Minor issues
- Exact operational schedule day/time is intentionally not fixed at Operating Model level.
- Exact event thresholds remain owned by approved upstream rules or later M5 workflow files.

**Assessment:** PASS.

---

## 32.2 Portfolio Manager Review

### Critical issues
- **0 unresolved.**

### Major issues found and addressed
1. **DCA action bias.**  
   Resolved by making cash an explicit competing allocation and allowing material `HOLD CASH` decisions.

2. **Unnecessary weekly full rescoring.**  
   Resolved by materiality-based refresh rules.

3. **Potential duplicate work between weekly/monthly/quarterly reviews.**  
   Resolved by cumulative reuse of validated inputs and cadence-specific depth.

### Minor issues
- Exact review calendar and cutoff conventions belong in workflow-specific files.

**Assessment:** PASS.

---

## 32.3 Equity Research Analyst Review

### Critical issues
- **0 unresolved.**

### Major issues found and addressed
1. **Price movement could dominate review behavior.**  
   Resolved by fundamental-first trigger hierarchy.

2. **Quarterly review could mechanically apply generic metrics to all sectors.**  
   Resolved by explicitly retaining sector-specific metrics under approved M3 logic.

3. **Event review could jump directly from headline to decision.**  
   Resolved by Deep Review and evidence-sufficiency gates.

### Minor issues
- Detailed evidence checklist by event type belongs in `EVENT_DRIVEN_REVIEW.md`.

**Assessment:** PASS.

---

## 32.4 Risk Manager Review

### Critical issues
- **0 unresolved.**

### Major issues found and addressed
1. **Risk-dashboard status could accidentally become a trading state.**  
   Resolved by separating `GREEN/WATCH/WARNING/BREACH` from M4 Decision States.

2. **Data-quality failure could produce fabricated actionability.**  
   Resolved by data-quality gates and M2 source-of-truth firewall.

3. **Critical event might wait for scheduled review.**  
   Resolved by T4 event escalation.

### Minor issues
- Exact quantitative risk thresholds remain owned by Risk Policy and must not be duplicated here.

**Assessment:** PASS.

---

## 32.5 Investment Operations Manager Review

### Critical issues
- **0 unresolved.**

### Major issues found and addressed
1. **Audit records lacked a canonical lineage chain.**  
   Resolved with Review ID → Snapshot → Evidence → Trigger → Decision → Transaction → Follow-up linkage.

2. **Review artifacts could accidentally become shadow accounting data.**  
   Resolved with source-of-truth firewall.

3. **Approval/version drift could impair audit reproducibility.**  
   Resolved at M5 design level by mandatory baseline-version pinning; canonical file metadata should be synchronized before implementation.

### Minor issues
- Physical storage, naming convention, and immutable append mechanism remain implementation concerns for later milestones.

**Assessment:** PASS WITH MINOR GOVERNANCE FOLLOW-UP.

---

## 32.6 Behavioral Finance Reviewer

### Critical issues
- **0 unresolved.**

### Major issues found and addressed
1. **Action bias from frequent review.**  
   Resolved through `NO ACTION` as a first-class result.

2. **Outcome bias in Decision Audit.**  
   Resolved through decision-quality/outcome matrix and no-hindsight rule.

3. **Loss aversion / disposition effect on Legacy Holdings.**  
   Resolved by mandatory exit-plan governance rather than indefinite HOLD.

4. **Confirmation bias after material event.**  
   Resolved by requiring new validated evidence before decision escalation.

### Minor issues
- Bias scoring/measurement method may be added later only if it does not create false precision.

**Assessment:** PASS.

---

# 33. Consolidated Issue Register

## Critical
**0 unresolved.**

## Major
**0 unresolved within `OPERATING_MODEL.md`.**

## Minor / Deferred

### M-1 — Canonical baseline metadata synchronization
Some stored artifact snapshots may retain pre-approval status/version labels even though the project baseline has been explicitly approved.

**Recommendation:** before implementation/automation, maintain a canonical baseline registry or synchronize file headers so audit records can pin one unambiguous approved version.

This does not alter any M1–M4 investment rule.

### M-2 — Legacy Holding numeric grace period
No universal numeric grace period is defined upstream.

**Recommendation:** do not invent one in M5. Validate the orderly-exit workflow first. Add a quantitative deadline only through a separately approved policy amendment if later evidence shows it is needed.

### M-3 — Exact schedule timing
This Operating Model defines cadence but not exact weekday/time.

**Recommendation:** define practical timing in each workflow file while preserving the user's 2–3-times/week monitoring preference.

---

# 34. Final Review Result

**CIO:** PASS  
**Portfolio Manager:** PASS  
**Equity Research Analyst:** PASS  
**Risk Manager:** PASS  
**Investment Operations Manager:** PASS WITH MINOR GOVERNANCE FOLLOW-UP  
**Behavioral Finance Reviewer:** PASS  

**Critical unresolved:** 0  
**Major unresolved:** 0  
**Minor / deferred:** 3  

**Overall quality target:** approximately **9.9/10 at design level**.

**Approval Status:** APPROVED BASELINE v1.0.

The next planned file is `05_PORTFOLIO_WORKFLOW/WEEKLY_REVIEW.md`.

Do not proceed beyond `WEEKLY_REVIEW.md` until that file is reviewed and explicitly approved.
