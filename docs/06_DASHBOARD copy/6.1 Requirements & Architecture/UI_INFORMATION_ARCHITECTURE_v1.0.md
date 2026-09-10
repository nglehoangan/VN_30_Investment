# VN30 Value Investing OS — UI Information Architecture

**Document:** `06_DASHBOARD/UI_INFORMATION_ARCHITECTURE.md`  
**Milestone:** 6 — Dashboard & Automation  
**Sub-milestone:** M6.1 — Requirements & Architecture  
**Status:** Approved Baseline  
**Version:** 1.0  
**Date:** 2026-09-09  

## Governing Baselines

This document operationalizes:

- `06_DASHBOARD/REQUIREMENTS.md` — Approved Baseline v1.0
- `06_DASHBOARD/ARCHITECTURE.md` — Approved Baseline v1.0
- `06_DASHBOARD/DOMAIN_MODEL.md` — Approved Baseline v1.0
- `06_DASHBOARD/DATA_FLOW.md` — Approved Baseline v1.0
- all approved M1–M5 baselines

This document defines information architecture and workflow presentation only.

It does **not** create or alter:

- investment rules;
- scoring thresholds;
- ranking rules;
- Decision States;
- risk thresholds;
- accounting formulas;
- DCA eligibility;
- review semantics.

---

# 1. Purpose

The purpose of the UI Information Architecture is to make VN30 Value Investing OS operational without exposing internal architectural complexity to the user.

The UI must help the user answer, quickly and safely:

1. What is my portfolio state now?
2. Is the data trustworthy/current enough?
3. Where is the risk?
4. What changed?
5. What opportunities are currently strongest?
6. What does the Decision Engine recommend?
7. Should new DCA cash be deployed or held?
8. Which review workflow is due or triggered?
9. Why was a historical decision made?
10. Is an action recommended, merely actionable, or actually executed?

---

# 2. UX Principles

## UX-P1 — Portfolio first

The primary navigation should start from portfolio state, not from individual-stock research.

## UX-P2 — Trust state is always visible

Critical views must expose:

- data as-of;
- freshness;
- reconciliation status;
- methodology/version context where relevant.

## UX-P3 — Recommendation != execution

UI must visually distinguish:

- recommendation;
- execution/actionability status;
- actual transaction.

## UX-P4 — Warnings are semantic, not decorative

GREEN/WATCH/WARNING/BREACH and stale/blocking states must not rely on color alone.

## UX-P5 — No forced complexity

Advanced lineage may be collapsible, but it must remain accessible.

## UX-P6 — No accidental trade action

The product does not place real broker orders.

Any action that writes to the authoritative ledger requires explicit user confirmation.

## UX-P7 — Review calendar is not trading calendar

Scheduled review screens should naturally support `NO ACTION` and `HOLD CASH`.

---

# 3. Primary Navigation

The MVP should avoid a flat 14-item navigation because that creates unnecessary cognitive load and makes operational priorities harder to see.

Recommended grouped navigation:

```text
1. Overview
   - Dashboard
   - Holdings
   - Risk
   - Performance

2. Research & Decisions
   - VN30 Universe
   - Scoring & Ranking
   - Decision Center
   - DCA Planner

3. Operations
   - Transactions
   - Reviews
   - Journal

4. Data
   - Imports
   - Reconciliation
   - Data Freshness
   - Audit / Methodology

5. Settings
```

Desktop navigation may render these groups as sections or expandable groups.

The information architecture remains workflow-oriented rather than database-oriented.

The default landing page is `Dashboard`, but operationally blocking states may surface a prominent direct link to the affected Reconciliation/Review/Data screen.

---

# 4. Global Shell

## 4.1 Header

Recommended persistent header elements:

- portfolio selector if more than one portfolio is later supported;
- current portfolio name;
- latest valid data as-of;
- reconciliation indicator;
- global data freshness indicator;
- pending critical review count;
- optional import/update shortcut.

## 4.2 Global Status Strip

A compact status strip should expose at minimum:

- Portfolio: VALID / PROVISIONAL / BLOCKED
- Reconciliation: PASS / WARNING / BLOCKED
- Price data freshness
- Fundamental data freshness
- Latest scoring run
- Latest ranking run

This prevents users from interpreting stale dashboard values as current.

## 4.3 Breadcrumb / Context

Deep pages should show context:

```text
VN30 Universe > FPT > Decision
```

or

```text
Reviews > Monthly DCA > 2026-09
```


## 4.4 Operational Context Mode

The UI must explicitly distinguish two contexts:

- **CURRENT OPERATIONAL VIEW** — intended for today’s monitoring, DCA, risk, and new decisions;
- **HISTORICAL AS-OF VIEW** — intended for reconstruction, audit, and historical analysis.

When a user changes the global/as-of date away from the latest supported operational state:

- show a persistent `HISTORICAL AS-OF` banner;
- disable or clearly gate actions that would otherwise imply current actionability;
- do not label historical recommendations, cash, prices, or risk states as “current”;
- require an explicit return to Current Operational View before creating a new execution-oriented transaction from analytical screens.

A historical view may still allow correction/reversal workflows that are explicitly tied to historical ledger events.

---

# 5. Dashboard

## 5.1 Objective

Answer:

> “What is the overall portfolio state and what needs attention?”

## 5.2 Recommended layout

### Row A — Portfolio summary cards

- Total NAV
- Cash
- Market Value
- Total Contributed Capital
- Unrealized P&L
- Realized P&L
- Dividend Income

### Row B — Performance

- Total Return
- XIRR
- CAGR where applicable
- Current Drawdown
- Maximum Drawdown
- VN30 comparison

### Row C — Risk & Allocation

- Largest Position
- Top 3 Concentration
- Cash %
- Sector exposure chart
- risk status

### Row D — Attention Needed

Prioritized alerts should be ordered by operational severity, not merely by recency:

1. accounting/reconciliation block;
2. data-quality or methodology block affecting actionability;
3. thesis broken / mandatory exit-risk condition;
4. hard concentration/risk breach;
5. Legacy Holding requiring review;
6. event-driven or overdue review;
7. non-blocking stale data;
8. unresolved import issue.

Each alert must state whether it:

- blocks actionability;
- requires review;
- is informational only.

### Row E — Opportunity Snapshot

- Top 5 / Top 10 opportunities
- score
- rank
- recommendation
- confidence
- affordability/lot status

This is a summary only.

Official ranking remains owned by Ranking.

---

# 6. Holdings

## 6.1 Primary table

Columns:

- Ticker
- Company
- Sector
- Quantity
- Average Cost
- Current Price
- Price As-Of
- Market Value
- Unrealized P&L
- Unrealized P&L %
- Portfolio Weight
- Score
- Rank
- Thesis Status
- Last Formal Decision
- Decision As-Of
- Execution Status
- Confidence
- Data Status

## 6.2 Filters

At minimum:

- sector;
- recommendation;
- thesis status;
- confidence;
- risk flag;
- Legacy Holding;
- stale data;
- owned status.

## 6.3 Row click

Ticker row opens a security detail context, not a transaction editor.

---

# 7. Security Detail

Recommended tabs:

```text
Overview
Scorecard
Valuation
Decision
Risk
History
Journal
```

## 7.1 Overview

Show:

- company identity;
- sector;
- VN30 status;
- ownership;
- quantity/weight;
- score/rank;
- last formal Decision State;
- Decision As-Of;
- confidence;
- thesis summary;
- latest data freshness.

## 7.2 Scorecard

Display full decomposition.

Answer:

> “Why is this stock scored 84?”

## 7.3 Valuation

Display:

- valuation state;
- expected return range;
- key assumptions;
- as-of;
- sensitivity;
- evidence confidence.

## 7.4 Decision

Embed or link to official Decision Center output.

## 7.5 Risk

Security-specific risk flags and portfolio contribution.

## 7.6 History

Historical:

- scores;
- ranks;
- recommendations;
- decisions;
- major review events.

Must distinguish historical as-calculated from restated/recomputed views.

---

# 8. Transactions

## 8.1 Transaction list

Columns:

- Transaction ID
- Type
- Date
- Ticker
- Quantity
- Price
- Gross Amount
- Fee/Tax
- Settlement Status
- Source
- Decision Link
- Correction/Reversal Status

## 8.2 Actions

Allowed:

- View
- Create new transaction
- Reverse/correct
- Link decision/reference
- Export

Not allowed:

- inline destructive edit of posted transaction;
- delete posted history.

## 8.3 Transaction detail

Show:

- event header;
- posting legs;
- source;
- timestamps;
- settlement;
- reversal lineage;
- resulting watermark/rebuild status.

---

# 9. VN30 Universe

## 9.1 Table

Columns:

- Ticker
- Company
- Sector
- Current Member
- Membership Effective Date
- Owned
- Legacy
- Score
- Rank
- Confidence
- Investability
- Last Formal Decision
- Decision As-Of
- Data Status

## 9.2 Views

Tabs or toggles:

- Current VN30
- Historical Membership
- Entrants/Exits
- Legacy Holdings

## 9.3 Reconstitution action

A detected change should present:

> “VN30 Reconstitution Review Required”

not “Sell” or “Buy”.

---

# 10. Scoring & Ranking

Recommended top-level tabs:

```text
Ranking
Top 10
Scorecards
Methodology
```

## 10.1 Ranking

Official Rank 1–30.

Columns:

- Rank
- Ticker
- Score
- Confidence
- Validity
- Expected Return
- Valuation
- Residual Risk
- Actionability

## 10.2 Top 10

Must explicitly show:

- official Top 10 selection;
- excluded high-score names and reason where relevant;
- research vs actionable context.

## 10.3 Scorecards

Browse completed scorecards.

## 10.4 Methodology

Read-only display of active approved methodology identities.

No casual production editing.

---

# 11. Decision Center

## 11.1 Objective

Answer:

> “Given everything we know, what is the official M4 decision and why?”

## 11.2 Layout

### Section A — Decision Summary

- Decision State
- Decision Qualifier
- Execution Status
- Confidence
- Decision Date
- Data As-Of
- Portfolio Snapshot As-Of
- Current Validity: CURRENT / STALE / SUPERSEDED / BLOCKED
- Methodology Version

The screen must make clear whether the displayed decision is:

- the latest formal decision;
- a historical decision;
- stale because decision-critical inputs changed;
- superseded by a later DecisionRecord.

### Section B — Core Inputs

- Stage 0
- Score
- Rank
- Thesis
- Valuation
- Expected Return
- Risk
- Ownership
- VN30 status

### Section C — Portfolio Context

- Current position
- Current weight
- Post-trade weight
- Sector exposure
- Cash
- Lot cost
- concentration impact

### Section D — Opportunity Cost

- current candidate
- alternatives
- cash comparator
- reason chosen/not chosen

### Section E — Rationale

- thesis;
- positives;
- risks;
- invalidation conditions;
- review triggers.

### Section F — Execution Link

If action is executable:

- `Create Transaction Draft`

The draft may prefill values from the DecisionRecord, but **no decision-time execution value is trusted blindly**.

Before the draft can be confirmed, the application must revalidate against the latest current operational state, including where applicable:

- ledger watermark;
- available/executable cash;
- current holdings;
- current VN30/Legacy status;
- current risk/concentration constraints;
- approved lot-size/quantity rules;
- price/reference-price freshness;
- whether the DecisionRecord remains valid and unsuperseded.

If revalidation fails, the transaction must remain unconfirmed and the UI must state whether a new decision/review is required.

---

# 12. DCA Planner

## 12.1 Objective

Answer:

> “What is the best use of this month’s incremental capital?”

## 12.2 Input panel

- planned contribution;
- actual contribution;
- existing cash;
- latest price as-of;
- selected valid portfolio snapshot;
- snapshot ledger watermark;
- ranking/data as-of.

Actual contribution is read-only from ledger-derived data where available.

The DCA Planner must not operate as actionable when the selected portfolio snapshot, ranking, or required prices are stale/blocked under approved rules.

## 12.3 Candidate table

Columns:

- Rank
- Ticker
- Recommendation
- Lot Cost
- Cash Feasible
- Post-Trade Weight
- Sector Impact
- Risk Impact
- Opportunity Cost Result
- Eligibility

## 12.4 Outcome panel

Possible outputs:

- BUY — proposed executable quantity;
- ACCUMULATE — proposed executable quantity;
- HOLD CASH.

For the current project, the proposed quantity must respect the approved minimum-lot/trade constraints and will commonly be 100 shares or another approved compliant quantity.

The UI must not hard-code `100` as an investment rule if the governing execution/position-sizing baseline returns a different compliant quantity.

Every outcome must explain why.

## 12.5 Safety

No “Buy Now” broker action.

Only:

> “Create transaction draft”

after formal decision/actionability requirements pass.

---

# 13. Risk Dashboard

## 13.1 Summary

Top cards:

- Overall Risk Status
- Cash %
- Largest Position
- Top 3 Concentration
- Current Drawdown
- Max Drawdown

## 13.2 Risk sections

- Position concentration
- Sector exposure
- Thesis status
- Confidence
- Valuation risk
- Legacy Holdings
- Data/reconciliation risk
- Drawdown

## 13.3 Status language

Each flag must include:

- state;
- reason;
- source rule;
- affected securities;
- required review or governing-rule response.

The UI must not invent an action from a risk flag. Any Buy/Reduce/Sell conclusion must come from the owning M4/M5 workflow.

---

# 14. Reviews

Recommended landing page:

```text
Review Center
```

Cards:

- Weekly Review
- Monthly DCA Review
- Quarterly Review
- Annual Review
- Event-Driven Review
- VN30 Reconstitution
- Portfolio Risk Review
- Performance Review
- Behavioral Review
- Decision Audit

Each shows:

- last completed;
- next due where cadence-based;
- open/overdue;
- unresolved actions.

---

# 15. Review Workspace

Common layout:

### Header

- Review ID
- Type
- Trigger
- Review Date
- Data As-Of
- Portfolio Snapshot
- Data Quality

### Checklist / workflow

Review-specific steps.

### Findings

- material changes;
- risk;
- thesis;
- data issues;
- unresolved prior actions.

### Outcome

Examples:

- NO ACTION
- HOLD CASH
- REVIEW REQUIRED
- DECISION REQUIRED


### Completion Gate

A review cannot be marked `FINAL/COMPLETED` while a mandatory data-quality, reconciliation, or required-checklist item is unresolved unless the owning M5 workflow explicitly permits an escalated/pending completion state.

If a review escalates to `DECISION REQUIRED`, completing the review does not imply that a DecisionRecord or transaction already exists.

### Links

- DecisionRecord
- JournalEntry
- Transaction
- Follow-up review

---

# 16. Journal

## 16.1 Journal list

Columns:

- Date
- Ticker
- Decision
- Review Type
- Thesis Status
- Confidence
- Outcome Review Status

## 16.2 Journal detail

Show:

- original decision context;
- thesis;
- valuation;
- portfolio context;
- risks;
- invalidation;
- behavioral notes;
- execution link;
- 3/6/12-month review links.

## 16.3 Decision audit

Historical decision page must make visible:

- what data existed then;
- what methodology version was used;
- what happened later;
- process quality vs outcome quality.

---

# 17. Performance

## 17.1 Summary

- NAV
- Total Return
- TWR
- XIRR
- CAGR
- Realized P&L
- Unrealized P&L
- Dividends
- Current Drawdown
- Max Drawdown

## 17.2 Charts

Recommended:

- NAV over time
- unitized/TWR performance
- portfolio vs VN30
- drawdown
- contributions vs portfolio value

## 17.3 Methodology disclosure

Each performance view should expose:

- portfolio method;
- benchmark method;
- comparison compatibility;
- calculation run;
- portfolio/benchmark as-of alignment;
- whether the view is historical as-calculated or recomputed/restated.

The UI must not silently mix portfolio and benchmark series with incompatible dates or methodologies.

---

# 18. Imports

Landing page by import type:

- Transactions
- Prices
- VN30 Membership
- Sector
- Benchmark
- Fundamental Data
- Score Inputs

Each import uses:

```text
Select file
 -> Parse
 -> Validate
 -> Preview
 -> Fix/reject errors
 -> Commit
 -> Audit report
```

Import summary must clearly show:

- accepted;
- rejected;
- duplicates;
- conflicts;
- committed;
- whether commit is all-or-nothing or an explicitly supported partial commit;
- authoritative records/observations created by the commit.

The import UI must never imply that a successfully parsed row is already authoritative before commit succeeds.

---

# 19. Data & Audit

This area supports advanced traceability.

Recommended sections:

```text
Data Freshness
Reconciliation
Calculation Runs
Methodology Registry
Import History
Audit Lineage
Backups
```

## 19.1 Data Freshness

Show by dataset:

- source;
- as-of;
- imported_at;
- freshness;
- affected outputs;
- whether actionability is blocked;
- refresh/review path.

The user should be able to drill from a stale/blocking output to the dataset or evidence that caused it.

## 19.2 Calculation Runs

Browse:

- portfolio reconstruction;
- scoring;
- ranking;
- risk;
- performance.

## 19.3 Methodology Registry

Read-only active/historical approved method identities.

---

# 20. Settings

MVP settings should remain narrow.

Allowed examples:

- portfolio display name;
- local import folder preferences;
- export folder preference;
- UI display preferences;
- provider configuration later.

Do not expose upstream investment-policy thresholds as casual settings.

Any methodology/policy change belongs to governance, not Settings.

---

# 21. Alert Prioritization

Recommended priority order:

## Priority 1 — BLOCKING

Examples:

- reconciliation blocked;
- corrupted/missing authoritative transaction data;
- methodology identity mismatch;
- critical stale data preventing actionability.

## Priority 2 — RISK / REVIEW REQUIRED

Examples:

- thesis broken;
- concentration breach;
- Legacy Holding review;
- event-driven review trigger.

## Priority 3 — DATA WARNING

Examples:

- stale non-critical source;
- incomplete scorecard;
- benchmark mismatch.

## Priority 4 — INFORMATIONAL

Examples:

- review due soon;
- new valid import available;
- price update without material thesis effect.

---

# 22. Empty States

Empty state must describe what is missing and how to resolve it.

Examples:

Instead of:

> “No data”

Use:

> “No market price is available for this security as of the selected valuation date. Import a valid price observation or choose a supported earlier date.”

Instead of:

> “No ranking”

Use:

> “Official ranking is unavailable because one or more required scorecards are blocked.”

---

# 23. Loading States

Avoid showing stale data without context while recalculating.

If old data remains visible during refresh:

- label it as prior/as-of;
- show recalculation status;
- do not present it as newly current.

---

# 24. Error States

Error state should answer:

1. What failed?
2. What remains valid?
3. Is actionability affected?
4. What can the user do next?

Example:

```text
Portfolio reconstruction failed after transaction T123.
The transaction is recorded successfully.
Derived holdings/NAV are temporarily blocked until reconstruction succeeds.
```

This is better than a generic “Something went wrong”.

---

# 25. Cross-Page Context Rules

The user should not have to repeatedly reconstruct context manually.

Examples:

From Holdings → Decision Center:

carry:

- SecurityId
- selected portfolio
- selected as-of where valid

From DCA → Decision:

carry:

- candidate
- relevant ranking run
- portfolio snapshot
- opportunity-cost context

From Decision → Transaction Draft:

carry:

- DecisionId
- SecurityId
- proposed quantity
- reference price
- decision-time portfolio snapshot/watermark

But carried values remain draft/reference only.

Before confirmation, the application must reload/revalidate current authoritative state. A carried reference price or quantity must never bypass current cash, eligibility, risk, lot, or stale-decision checks.

---

# 26. Action Labels

Recommended semantic labels:

- View
- Review
- Recalculate
- Create Decision
- Create Transaction Draft
- Confirm Transaction
- Reverse Transaction
- Import
- Commit Import
- Export
- Create Follow-up

Avoid misleading labels:

- “Auto Buy”
- “Execute AI”
- “Fix Portfolio”
- “Sync Everything”

---

# 27. Mobile / Responsive Priority

MVP remains desktop-first because the product is data-dense.

Responsive behavior should still support:

- dashboard summary;
- blocking alert/reconciliation review;
- security summary;
- Decision State + validity/as-of;
- review status;
- journal reading.

Complex tables may use:

- horizontal scroll;
- column prioritization;
- detail drawers/cards.

Do not compromise audit fields merely to fit a mobile table.

---

# 28. Accessibility

At minimum:

- keyboard accessible controls;
- explicit labels;
- status icon + text;
- no color-only warnings;
- accessible table headers;
- modal/dialog focus handling;
- clear confirmation language;
- sufficient contrast.

---

# 29. Information Density Strategy

Use progressive disclosure.

Default screens show:

- decision-relevant information;
- risk/freshness warnings;
- summary metrics.

Expandable details show:

- source lineage;
- methodology;
- raw evidence;
- calculation IDs.

This balances auditability and usability.

---

# 30. Navigation Relationships

Conceptual relationships:

```text
Dashboard
  |
  +--> Holdings --> Security Detail --> Decision
  |
  +--> Risk
  |
  +--> Reviews
  |
  +--> Top 10 --> Decision --> Transaction Draft
  |
  +--> DCA Planner --> Decision

Transactions
  |
  +--> Transaction Detail
  +--> Reconciliation

VN30 Universe
  |
  +--> Security Detail
  +--> Reconstitution Review

Journal
  |
  +--> Decision Audit
```

---

# 31. UI State Ownership

UI state may own:

- current route;
- sort/filter;
- expanded rows;
- selected tab;
- draft form values.

UI state may not own authoritative or official domain outputs such as:

- holdings;
- cash;
- official score;
- official rank;
- Decision State;
- risk status;
- reconciliation status;
- transaction lifecycle.

These come from application/domain results and retain their as-of/lineage metadata.

---

# 32. Critical Confirmation Flows

Explicit confirmation required for:

- posting transaction;
- reversing/correcting transaction;
- committing authoritative import;
- restoring backup;
- destructive deletion of rebuildable non-authoritative caches if exposed;
- future methodology activation if governance UI ever exists.

Confirmation must summarize consequences and be based on a server-side/current-state revalidation performed immediately before authoritative commit.

If the state changed after preview in a way that affects validity, confirmation must fail safely and require the user to review the updated state.

Example transaction confirmation:

```text
You are about to record:
BUY 100 FPT @ 123,000 VND
Fee: ...
Trade date: ...
Settlement date: ...
Linked Decision: D-...
```

---

# 33. Recommended MVP Route Map

Conceptually:

```text
/
 /dashboard
 /holdings
 /holdings/[securityId]
 /transactions
 /transactions/new
 /transactions/[transactionId]
 /vn30
 /scoring
 /ranking
 /decisions
 /decisions/[decisionId]
 /dca
 /risk
 /reviews
 /reviews/[reviewId]
 /journal
 /journal/[entryId]
 /performance
 /imports
 /data
 /data/freshness
 /data/reconciliation
 /audit
 /settings
```

Exact Next.js route grouping belongs to implementation.

---

# 34. MVP UI Scope

Must exist by M6 completion:

- Dashboard
- Holdings
- Transactions
- VN30 Universe
- Scoring
- Ranking/Top 10
- Decision Center
- DCA Planner
- Risk
- Reviews
- Journal
- Performance
- Imports
- Reconciliation/Data Freshness
- Audit/Methodology visibility

May be deferred:

- advanced customization;
- multi-monitor layouts;
- mobile-native app;
- PDF report designer;
- alerts/push notifications;
- real-time ticker streaming.

---

# 35. UI Acceptance Criteria

`UI_INFORMATION_ARCHITECTURE.md` is acceptable only if:

1. primary navigation maps to actual M6 workflows without unnecessary flat-menu overload;
2. portfolio health/trust state is visible globally;
3. Current Operational View is clearly distinguished from Historical As-Of View;
4. recommendation, actionability/execution status, and actual transaction are visually distinct;
5. transaction history cannot be destructively edited from UI;
6. Holdings exposes score/rank/thesis/last formal decision/confidence with as-of context;
7. Security Detail explains score and decision;
8. Top 10 is distinguished from simple sorting;
9. Decision Center exposes M4 inputs/output and decision validity/supersession;
10. Decision → Transaction Draft requires current-state revalidation before commit;
11. DCA can end with HOLD CASH and does not hard-code quantity outside governing rules;
12. Risk states include reason/source without inventing Buy/Sell actions;
13. Review Center supports NO ACTION and cannot silently complete with unresolved mandatory blockers;
14. journal supports historical decision audit;
15. imports use preview/errors/commit and distinguish parsed from authoritative;
16. stale data warnings are visible with affected outputs/actionability;
17. reconciliation block is visible and drillable;
18. methodology lineage is accessible;
19. UI state does not become source truth;
20. no broker order execution exists;
21. critical authoritative writes require explicit confirmation after current-state revalidation;
22. historical performance views disclose as-calculated vs recomputed/restated context;
23. no M1–M5 rule is changed.

---

# 36. Multi-Role Re-Review — v0.2

## 36.1 Product Manager

### Critical
**0 unresolved.**

### Major issues found and resolved

**PM-M1 — Primary navigation was too flat and cognitively expensive.**  
Resolution: 14 top-level destinations are now grouped into five operational areas: Overview, Research & Decisions, Operations, Data, and Settings.

**PM-M2 — Historical as-of analysis could be confused with current operational state.**  
Resolution: introduced explicit `CURRENT OPERATIONAL VIEW` vs `HISTORICAL AS-OF VIEW`, including persistent historical-context warning and gating of execution-oriented actions.

**PM-M3 — Dashboard attention list lacked explicit operational severity.**  
Resolution: alerts are now ordered by blocking/risk/review/data/informational priority and must state actionability impact.

**Result:** **9.9/10 — PASS.**

---

## 36.2 Software Architect

### Critical
**0 unresolved.**

### Major issues found and resolved

**SA-M1 — Cross-page context could accidentally become trusted execution state.**  
Resolution: Decision/DCA context carried into Transaction Draft is explicitly reference-only and must be revalidated against current authoritative state.

**SA-M2 — UI terminology could imply that stale analytical output was “current.”**  
Resolution: Holdings, VN30 Universe, Security Detail, and Decision Center now expose Decision As-Of / validity instead of an ambiguous current recommendation label.

**SA-M3 — Official domain outputs and transient UI state were not sharply separated enough.**  
Resolution: official score/rank/decision/risk/reconciliation outputs are explicitly domain-owned with retained lineage.

**Result:** **9.9/10 — PASS.**

---

## 36.3 Portfolio Manager

### Critical
**0 unresolved.**

### Major issues found and resolved

**PMGR-M1 — Decision-to-transaction handoff could use decision-time price/cash after market or portfolio state changed.**  
Resolution: immediate pre-commit revalidation is mandatory for cash, holdings, eligibility, risk, lot rules, price freshness, watermark, and decision validity.

**PMGR-M2 — DCA UI hard-coded `BUY 100 / ACCUMULATE 100` too strongly.**  
Resolution: UI now displays the approved executable quantity from governing M4 sizing/execution rules; 100 shares remains a common compliant outcome, not an independent UI rule.

**PMGR-M3 — Risk UI wording could imply the UI determines the investment action.**  
Resolution: risk flags may require review/governing-rule response, but Buy/Reduce/Sell remains owned by M4/M5.

**Result:** **9.9/10 — PASS.**

---

## 36.4 Data Engineer

### Critical
**0 unresolved.**

### Major issues found and resolved

**DE-M1 — Import UI did not clearly distinguish parsed rows from committed authoritative records.**  
Resolution: import summary now explicitly separates accepted/rejected/duplicate/conflict from committed authoritative records and partial-vs-atomic commit semantics.

**DE-M2 — Freshness screen lacked dependency/actionability impact.**  
Resolution: Data Freshness now shows affected outputs, actionability block, and drill-down path to the causing dataset/evidence.

**DE-M3 — Performance UI did not explicitly label historical as-calculated vs recomputed/restated series.**  
Resolution: method/alignment/calculation-run and historical basis are mandatory disclosures.

**Result:** **9.9/10 — PASS.**

---

## 36.5 Security Reviewer

### Critical
**0 unresolved.**

### Major issues found and resolved

**SEC-M1 — Explicit confirmation alone was insufficient against stale multi-tab/browser state.**  
Resolution: authoritative commit now requires current-state server/application revalidation immediately before commit.

**SEC-M2 — Historical analytical screens could expose execution-oriented affordances without enough context.**  
Resolution: Historical As-Of mode gates execution-oriented actions and requires return to Current Operational View.

**SEC-M3 — Import success language could encourage trusting merely parsed data.**  
Resolution: parsed/validated/committed states are clearly separated.

### Minor
- detailed session/access control remains owned by `SECURITY.md`;
- exact anti-double-submit UI behavior belongs to implementation/test strategy.

**Result:** **9.9/10 — PASS.**

---

# 37. Consolidated Issue Register — Post Review

## Critical unresolved

**0**

## Major unresolved

**0**

## Major issues resolved in v0.2

1. flat 14-item navigation overload;
2. historical as-of vs current operational context ambiguity;
3. dashboard alert priority/actionability ambiguity;
4. stale “current recommendation” semantics;
5. Decision/DCA → Transaction Draft stale-state risk;
6. DCA quantity hard-coding risk;
7. risk UI accidentally implying decision authority;
8. parsed import vs authoritative commit ambiguity;
9. freshness dependency/actionability visibility gap;
10. performance historical-basis disclosure gap;
11. confirmation without immediate current-state revalidation.

## Minor / Deferred

1. final component library;
2. final visual design system;
3. exact responsive breakpoints;
4. exact alert iconography;
5. exact table virtualization requirement;
6. exact chart interaction behavior;
7. exact keyboard shortcut scope;
8. exact settings structure for future providers;
9. exact anti-double-submit interaction pattern;
10. exact navigation component implementation.

These are implementation/UI design details and do not affect investment semantics.

# 38. Approval Gate

Current state:

> **APPROVED BASELINE v1.0**

If approved:

1. promote `06_DASHBOARD/UI_INFORMATION_ARCHITECTURE.md` to **Approved Baseline v1.0**;
2. create/update its approved baseline artifact;
3. continue automatically to:
   **`06_DASHBOARD/MARKET_DATA_ADAPTER.md`**;
4. do not move beyond `MARKET_DATA_ADAPTER.md` until reviewed and approved.
