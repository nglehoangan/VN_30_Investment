# VN30 Value Investing OS --- Historical Validation Plan

**Document:** `07_VALIDATION/HISTORICAL_VALIDATION_PLAN.md`\
**Milestone:** M7.6 --- Historical Point-in-Time Validation\
**Status:** Baseline Candidate --- Awaiting User Approval\
**Version:** 0.1\
**Date:** 2026-10-04\
**Parents:** Approved M7 validation specifications through
`RISK_VALIDATION.md` v1.0

## 1. Purpose

Define a falsification-first, point-in-time historical validation
protocol for VN30 Value Investing OS.

This document authorizes **planning only**. It does not authorize
running a backtest or declaring historical performance.

Historical validation asks:

> Given only information legitimately available at each historical
> decision timestamp, would the frozen system have produced internally
> correct, policy-compliant, reconstructable decisions?

It does **not** ask whether weights/thresholds can be tuned to maximize
CAGR.

## 2. Entry Gate

M7.6 execution is blocked until deterministic Gates 1--6 have sufficient
execution evidence and no unresolved Critical/Major defect that can
affect:

-   accounting/NAV/performance;
-   data timing/provenance;
-   scoring/ranking;
-   decision state;
-   DCA/position sizing/opportunity cost;
-   risk;
-   audit reconstruction.

Specification approval alone does not satisfy this gate.

## 3. Frozen system

Before any historical run freeze:

-   Git commit SHA;
-   Baseline Manifest and document hashes;
-   scoring methodology/config;
-   decision methodology/config;
-   risk policy/config;
-   ranking rules;
-   DCA/sizing rules;
-   schemas/migrations;
-   benchmark methodology;
-   dataset manifest;
-   code/test environment.

No model/rule change is allowed after observing historical outcomes
within a registered run.

Any proposed change becomes a separate future model version and requires
a new validation cycle; it cannot overwrite the frozen run.

## 4. Primary validation objective

Primary endpoints are process integrity, not return:

1.  point-in-time data admissibility;
2.  VN30 universe reconstruction;
3.  score reproducibility;
4.  decision reproducibility;
5.  policy compliance;
6.  portfolio/risk/DCA compliance;
7.  audit reconstruction;
8.  deterministic replay.

Performance is a secondary diagnostic.

## 5. Temporal truth model

Every material historical input must carry:

-   `reporting_period` or economic observation period;
-   `publication_or_availability_timestamp`;
-   `decision_timestamp`.

Where relevant also retain:

-   event/announcement timestamp;
-   effective date;
-   observation timestamp;
-   received-at timestamp;
-   correction/restatement timestamp;
-   valid-through/freshness;
-   methodology effective interval.

Rule:

`availability_timestamp <= decision_timestamp`

is necessary for AS-KNOWN use, but not sufficient if effective-date or
quality rules fail.

Unknown availability must be excluded, conservatively delayed, or
explicitly marked as a limitation. It must never be assumed available at
period end.

## 6. AS-KNOWN vs AS-REVISED

**AS-KNOWN** is the primary historical decision mode.

It uses only the version of facts legitimately available at the decision
timestamp.

**AS-REVISED** is a separate diagnostic mode using later
corrected/restated data.

AS-REVISED results:

-   must be labeled;
-   cannot replace AS-KNOWN;
-   cannot be used to claim the historical engine "would have known" the
    correction;
-   may quantify revision sensitivity.

## 7. Historical VN30 universe

For every decision date reconstruct membership using effective-dated
authoritative evidence.

Required tri-state:

-   TRUE --- active membership interval;
-   FALSE --- no active interval and coverage COMPLETE_CONFIRMED;
-   UNKNOWN --- absence with incomplete/unsupported coverage.

Rules:

-   current constituent list cannot backfill history;
-   announcement date is not effective date;
-   re-entry creates a new interval;
-   Legacy holdings remain holdings after exit but receive no new
    capital;
-   a historical "30-member universe" claim requires confirmed complete
    coverage.

UNKNOWN material universe coverage blocks affected formal ranking/Top-10
validation.

## 8. Security identity and survivorship control

Use durable `security_id`, not current ticker.

Dataset must preserve:

-   ticker/name changes;
-   delisted/merged/replaced securities relevant to historical VN30
    membership;
-   exits and re-entries;
-   corporate actions;
-   historical sector assignment.

The historical sample cannot be built from "companies that survive
today."

Any survivorship filter that materially improves apparent results is
Critical.

## 9. Fundamental data admissibility

Each metric observation requires sufficient lineage to know when it
became usable.

Reject or delay:

-   financial statements before publication;
-   restatements before restatement date;
-   estimates mislabeled as facts;
-   TTM windows containing future periods;
-   later-normalized values without historical availability;
-   current sector/peer classification substituted historically;
-   unknown unit/scale;
-   untraceable manual values.

When exact publication timestamps are unavailable, use a registered
conservative lag only if justified and disclosed. Sensitivity analysis
must test reasonable alternative lags.

## 10. Market-price timing

Define one explicit price convention before execution, such as:

-   decision after official close using same-day close only if decision
    timestamp is after availability; or
-   next-session executable price for a decision made after close.

Do not mix conventions opportunistically.

A signal computed with close `t` cannot trade at an earlier price from
`t`.

Fees, taxes, board lots, trading halts and settlement constraints must
follow the historical effective rules supported by the dataset;
unsupported details become documented limitations.

## 11. Benchmark methodology

Primary benchmark is the appropriately defined VN30 series.

Historical comparison must freeze:

-   benchmark identity;
-   PRICE_RETURN vs TOTAL_RETURN;
-   dividend/tax treatment;
-   methodology version;
-   observation alignment;
-   base date;
-   correction mode;
-   quality state.

Portfolio performance must be cash-flow adjusted using the approved
unitized/TWR method.

A portfolio return including dividends cannot be presented as fully
comparable to a price-only benchmark without explicit limitation.

Benchmark data never modifies portfolio accounting truth.

## 12. Decision schedule

The historical schedule must approximate the approved operating model,
not maximize hindsight opportunities.

Pre-register:

-   periodic review dates;
-   monthly DCA review cadence;
-   quarterly/annual reviews;
-   supported event-driven triggers;
-   VN30 reconstitution effective dates.

If reliable historical event timestamps are unavailable, do not simulate
omniscient event-driven reviews. Restrict the run to supported periodic
information and document the limitation.

## 13. Initial conditions

Pre-register:

-   validation start date;
-   initial cash/NAV;
-   opening holdings, if any;
-   contribution schedule;
-   contribution timing;
-   fees/taxes;
-   lot rules;
-   treatment of pre-existing positions.

Preferred primary experiment should use a simple reproducible initial
condition rather than one selected because it backtests well.

Multiple initial conditions may be robustness checks, not cherry-picked
replacements.

## 14. DCA simulation

Use the approved DCA doctrine:

-   monthly cash is not forced deployment;
-   unused cash carries forward;
-   no leverage;
-   only authorized BUY/ACCUMULATE/STRONG BUY receives capital;
-   HOLD CASH is valid;
-   sequential marginal allocation refreshes after each lot;
-   affordable substitution requires complete approved evidence;
-   lot/risk constraints use historical effective inputs;
-   Legacy holdings receive no new capital.

Do not retroactively deploy idle cash because later returns were strong.

## 15. Portfolio accounting and performance

Historical ledger must reproduce:

-   contributions/withdrawals;
-   buys/sells;
-   fees/taxes;
-   dividends/withholding;
-   corporate actions;
-   settlements;
-   cash;
-   holdings;
-   cost basis;
-   realized/unrealized P&L;
-   NAV.

Official manager-vs-benchmark performance uses approved
cash-flow-adjusted TWR/unitization.

Secondary diagnostics may include money-weighted return/XIRR only if
clearly labeled and independently validated; they cannot replace the
official method by convenience.

## 16. Anti-look-ahead negative controls

Each formal historical suite injects known-invalid future information
and proves it cannot change an earlier AS-KNOWN result.

Inject at least:

1.  future quarterly result;
2.  future annual report;
3.  later restatement;
4.  current VN30 membership;
5.  future sector reclassification;
6.  corrected historical price received later;
7.  later benchmark correction;
8.  future corporate-action terms;
9.  future analyst estimate;
10. next-session price.

Silent acceptance of any material injected future fact is Critical.

## 17. Anti-survivorship controls

Required comparisons:

-   full reconstructed historical universe vs current-member-only
    pseudo-universe;
-   securities that later exit VN30 remain present while historically
    eligible;
-   Legacy holdings remain in portfolio accounting after index exit;
-   merger/delist histories are not deleted.

The current-member-only pseudo-universe is a negative control, never a
valid performance run.

## 18. Anti-optimization protocol

Forbidden after outcomes are observed:

-   changing score weights;
-   changing thresholds/gates;
-   changing required-return hurdle;
-   relaxing concentration;
-   changing DCA rules;
-   selecting favorable start/end dates;
-   deleting bad periods/securities;
-   changing benchmark;
-   changing publication lags;
-   changing transaction timing;
-   rewriting old decisions.

Any exploratory alternative must be labeled a new research hypothesis
and kept outside the frozen validation result.

## 19. Pre-registered historical windows

Before seeing results, select windows using objective data-coverage and
regime criteria.

Target structure, subject to trustworthy PIT coverage:

-   longest continuous supported primary window;
-   at least one severe market drawdown/stress segment;
-   at least one strong bull segment;
-   at least one sideways/mean-reverting segment;
-   at least one VN30 reconstitution segment;
-   at least one sector-cycle segment.

If Vietnam PIT data cannot support a segment reliably, mark it
unavailable rather than substitute a favorable period.

## 20. Decision-level sample audit

In addition to full replay, manually audit a stratified sample of
decision dates.

Include:

-   highest-ranked candidate;
-   candidate just outside Top 10;
-   BUY;
-   ACCUMULATE;
-   HOLD;
-   REDUCE;
-   SELL;
-   AVOID;
-   HOLD CASH month;
-   VN30 entry/exit;
-   high drawdown;
-   concentration boundary;
-   missing-data case.

For each, reconstruct Expected independently from source evidence and
compare to stored engine output.

## 21. Required historical outputs

Produce without interpretation bias:

-   decision count by state;
-   state transitions;
-   HOLD CASH frequency;
-   DCA deployment rate;
-   average cash weight;
-   turnover;
-   concentration path;
-   sector exposure path;
-   drawdown path;
-   score/rank distribution;
-   confidence/data-quality distribution;
-   veto/gate frequency;
-   Legacy holding episodes;
-   policy exceptions;
-   benchmark-relative TWR;
-   data exclusions/UNKNOWN periods;
-   reconstruction failures.

Returns are reported alongside, not above, these controls.

## 22. Performance diagnostics

Secondary metrics may include:

-   cumulative TWR;
-   annualized TWR where horizon supports it;
-   VN30 benchmark return;
-   active return;
-   max flow-adjusted drawdown;
-   recovery time;
-   volatility/downside diagnostics if methodology is pre-specified;
-   turnover;
-   cash drag;
-   hit rate only with clear definition.

The aspirational 15--20% long-term return target is **not** a pass/fail
criterion.

A historically lower return does not authorize model tuning.

## 23. Regime analysis

Partition results only using pre-defined, outcome-independent regimes.

Possible dimensions:

-   market drawdown regime;
-   valuation regime;
-   interest-rate/macro regime where reliable PIT data exists;
-   sector cycle;
-   VN30 reconstitution periods.

Regime analysis diagnoses behavior; it cannot be used to discard
unfavorable observations.

## 24. Sensitivity without tuning

Sensitivity analysis is allowed only to test data/method uncertainty,
not to optimize investment rules.

Examples:

-   conservative publication lag alternatives;
-   AS-KNOWN vs AS-REVISED;
-   benchmark price-return vs total-return comparability;
-   transaction at next open vs next close if both conventions are
    defensible;
-   missing-data exclusion bounds.

Do not vary score weights/risk limits to seek better return.

## 25. Data-quality acceptance

Every historical run has a Dataset Manifest containing:

-   dataset ID/version/hash;
-   freeze timestamp;
-   sources;
-   coverage dates;
-   constituent coverage;
-   publication-time coverage;
-   sector history coverage;
-   prices;
-   fundamentals;
-   corporate actions;
-   benchmark;
-   units/currency;
-   correction policy;
-   missingness;
-   exclusions;
-   reviewer.

Define quantitative coverage statistics before execution.

No E3 historical evidence may come from an unmanifested dataset.

## 26. Stop conditions

Stop the historical run and open an issue if:

-   future data is admitted;
-   universe reconstruction is materially UNKNOWN;
-   accounting cannot reconcile;
-   benchmark method is incompatible/untraceable;
-   a production decision cannot be reconstructed;
-   methodology/config changes mid-run;
-   unsupported corporate action materially affects NAV;
-   external flows contaminate return;
-   code/data version cannot be reproduced.

Do not "work around" a stop condition silently.

## 27. Historical issue classification

**Critical:** look-ahead, survivorship bias, materially wrong
NAV/performance, materially wrong BUY/SELL, policy bypass,
unreconstructable authority.

**Major:** material ranking/allocation/risk/performance distortion
without direct Critical impact.

**Minor:** non-material reporting/coverage issue with bounded impact.

Historical Gate 7 cannot pass with unresolved Critical. Major issues
require remediation or explicit limitation only where Gate policy
permits and impact is bounded/non-misleading.

## 28. Reproducibility package

A formal run must retain:

-   run ID;
-   code SHA;
-   baseline manifest hash;
-   dataset manifest/hash;
-   configuration hash;
-   random seed if any;
-   commands;
-   environment;
-   start/end;
-   decision schedule;
-   all artifacts;
-   ledger;
-   scorecards;
-   decisions;
-   marginal allocations;
-   risk reviews;
-   benchmark series;
-   logs;
-   exclusions;
-   issue register.

A second clean replay must reproduce material outputs.

## 29. Historical Results contract

`HISTORICAL_RESULTS.md` must report:

1.  authorization/entry-gate evidence;
2.  frozen manifests;
3.  coverage;
4.  exclusions/limitations;
5.  PIT controls;
6.  negative-control results;
7.  accounting reconciliation;
8.  score/decision reconstruction;
9.  policy violations;
10. portfolio/risk behavior;
11. benchmark comparability;
12. performance diagnostics;
13. regime diagnostics;
14. issue register;
15. Gate 7 conclusion.

Failed tests and unfavorable outcomes remain visible.

## 30. Gate 7 criteria

Possible outcomes:

-   **PASS**
-   **PASS WITH DOCUMENTED LIMITATIONS**
-   **FAIL / DO NOT RELY ON HISTORICAL RESULTS**

PASS requires reliable PIT controls, reconstructable universe/decisions,
reconciled accounting, no material leakage/survivorship error,
reproducibility, and no unresolved Critical/Major issue that invalidates
conclusions.

PASS WITH DOCUMENTED LIMITATIONS is allowed only when limitations are
bounded, disclosed and do not create a misleading investment-performance
claim.

Good CAGR alone can never create PASS.

## 31. Current planning findings

**HV-F01 --- VN30 membership model supports the required PIT concept.**
Effective-dated membership, coverage completeness and TRUE/FALSE/UNKNOWN
semantics are explicitly defined. Historical execution still requires
actual coverage evidence.

**HV-F02 --- Benchmark model explicitly requires TWR/unitization.** It
also distinguishes price-return from total-return and retains
methodology/correction lineage. Actual historical benchmark data must
still prove compatibility.

**HV-F03 --- Publication/availability timestamps remain the highest-risk
external-data dependency.** If reliable timestamps are unavailable for
material fundamental observations, affected dates must be
delayed/excluded or Gate 7 limited.

**HV-F04 --- M7.6 must not inherit current membership or revised
fundamentals.** AS-KNOWN is the primary mode; AS-REVISED is diagnostic
only.

**HV-F05 --- Historical return is secondary.** The plan deliberately
contains no target CAGR acceptance threshold and no optimization loop.

## 32. Multi-role review

-   **CIO --- PASS:** validates decision discipline rather than chasing
    historical CAGR.
-   **Independent Model Validator --- PASS:** look-ahead, survivorship
    and revision leakage are explicit falsification targets.
-   **Quantitative Analyst --- PASS:** timing, benchmark, flow and
    sensitivity conventions are pre-registered.
-   **Data Engineer --- PASS:** dataset manifests and temporal lineage
    are mandatory.
-   **Equity Research Analyst --- PASS:** publication timing/restatement
    handling preserves what could actually have been known.
-   **Risk Manager --- PASS:** historical stress diagnoses controls
    without relaxing them.
-   **QA Lead --- PASS:** stop conditions, negative controls and clean
    replay are explicit.

**Critical unresolved in this plan specification: 0.**\
**Major unresolved in this plan specification: 0.**

Historical execution remains **NOT AUTHORIZED** until prerequisite
deterministic execution gates are satisfied.

## 33. Approval Gate

**Document state:** `BASELINE CANDIDATE — READY FOR USER APPROVAL`

On explicit approval:

1.  promote `HISTORICAL_VALIDATION_PLAN.md` to **Approved Baseline
    v1.0**;
2.  proceed only to `07_VALIDATION/HISTORICAL_RESULTS.md`;
3.  before producing actual historical results, verify M7.6 entry-gate
    authorization;
4.  if prerequisites are not satisfied, `HISTORICAL_RESULTS.md` must
    record `BLOCKED / NOT EXECUTED` rather than fabricate results;
5.  do not proceed to paper portfolio planning until the Historical
    Results file is reviewed and approved.
