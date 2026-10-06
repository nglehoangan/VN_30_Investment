# VN30 Value Investing OS --- Data Initialization

**Path:** `08_PRODUCTION/DATA_INITIALIZATION.md`\
**Milestone:** M8 --- Production Readiness & Live Portfolio Onboarding\
**Version:** 0.1 --- Approval Candidate\
**Status:** READY FOR APPROVAL REVIEW --- LIVE DATASET NOT INITIALIZED\
**Governing baselines:** M1--M7 VVIOS v1.0 baseline and approved M8
readiness/onboarding documents

------------------------------------------------------------------------

## 1. Purpose

Define the controlled initialization and validation of data required for
live VN30 scoring, ranking, portfolio review, and DCA decision support.

The system must know not only a value, but also:

-   where it came from;
-   what period/date it represents;
-   when it was imported;
-   whether it is complete;
-   whether it is stale;
-   whether it is internally consistent;
-   how confident the system is in using it.

No recommendation may be produced when required data fails a mandatory
gate.

------------------------------------------------------------------------

## 2. Scope

Initialization covers:

1.  VN30 universe/master;
2.  sector classification;
3.  market prices and relevant market data;
4.  financial statements/fundamental metrics;
5.  valuation inputs;
6.  growth/quality/financial-health inputs;
7.  market/money-flow inputs required by the approved model;
8.  technical-entry inputs where required;
9.  benchmark/reference data where applicable;
10. data lineage, freshness, quality, confidence, and exceptions.

This document does not change any M3 scoring metric or threshold.

------------------------------------------------------------------------

## 3. Core Data Record

Every decision-relevant datum must be traceable to:

-   `source`;
-   `source_record/reference` where available;
-   `as_of_date` or reporting period;
-   `imported_at`;
-   unit/currency;
-   raw or normalized value;
-   transformation/version where applicable;
-   quality status;
-   freshness status;
-   confidence;
-   notes/exception where applicable.

A value without sufficient temporal/provenance context is not
automatically usable.

------------------------------------------------------------------------

## 4. Fact / Estimate / Assumption

Every decision-relevant input must be classified where applicable:

-   **FACT** --- reported/observed evidence;
-   **ESTIMATE** --- forecast or analyst/model estimate;
-   **ASSUMPTION** --- explicit analytical assumption.

The system must not present estimates or assumptions as reported facts.

Valuation using forward estimates must retain the estimate source and
period.

------------------------------------------------------------------------

## 5. VN30 Universe Initialization

For every constituent record capture:

-   ticker;
-   company name;
-   sector;
-   membership status;
-   effective-from date;
-   effective-to date if known;
-   source;
-   source as-of/effective date;
-   imported_at.

Required checks:

-   exactly the expected current constituent count under the
    authoritative index definition;
-   no duplicate active ticker;
-   ticker identity valid;
-   sector mapping present;
-   membership effective dates coherent;
-   additions/removals represented explicitly.

Current VN30 membership is **not** historical membership truth.

------------------------------------------------------------------------

## 6. Universe Change Handling

When VN30 composition changes:

1.  ingest authoritative membership update;
2.  retain prior membership history;
3.  update effective dates;
4.  identify portfolio holdings affected;
5.  trigger review under approved policy;
6.  do not rewrite historical eligibility;
7.  do not automatically sell solely because the master changed unless
    governing policy requires the resulting decision.

Universe changes require data refresh and portfolio review, not model
retuning.

------------------------------------------------------------------------

## 7. Sector Master

Sector classification must match the approved sector-normalization
framework.

Checks:

-   each active VN30 ticker maps to one valid sector classification;
-   no unmapped active constituent;
-   mapping changes are dated;
-   sector changes do not silently rewrite prior scoring evidence where
    historical reproducibility matters.

------------------------------------------------------------------------

## 8. Market Price Data

Each price requires:

-   ticker;
-   price;
-   price type/field;
-   trading date/time as applicable;
-   source;
-   imported_at;
-   adjustment status where relevant;
-   quality/freshness status.

Checks:

-   positive/plausible price;
-   no future timestamp;
-   trading date plausible;
-   corporate-action adjustments handled consistently;
-   stale price detected;
-   duplicate/conflicting records resolved explicitly.

Missing required price blocks valuation-dependent live outputs.

------------------------------------------------------------------------

## 9. Fundamental Data

For each required fundamental item capture:

-   ticker;
-   metric/raw statement item;
-   reporting period;
-   period type (quarter, annual, TTM, etc.);
-   fiscal year/quarter;
-   report publication/availability date where obtainable;
-   source;
-   imported_at;
-   restatement status where known;
-   value/unit/currency;
-   quality status.

The system must distinguish **reporting period end** from **information
availability date** to avoid future-information leakage in historical
validation.

------------------------------------------------------------------------

## 10. Period Consistency

Metrics combined in a score must use compatible periods according to M3
definitions.

Detect:

-   annual mixed with quarterly without approved transformation;
-   stale denominator/new numerator mismatch;
-   duplicate fiscal periods;
-   missing intermediate periods;
-   TTM assembled from incompatible quarters;
-   restated and original data mixed inconsistently.

Period inconsistency is a data-quality issue, not a reason to improvise
a metric.

------------------------------------------------------------------------

## 11. Restatements

When a company restates historical financials:

-   retain provenance;
-   identify restated status/version;
-   use latest valid restated data for current analysis where
    appropriate;
-   preserve point-in-time truth for historical validation;
-   never backfill a later restatement into a historical decision
    simulation as if it were known then.

------------------------------------------------------------------------

## 12. Units and Currency

Normalize units deterministically.

Checks include:

-   VND vs thousand/million/billion VND;
-   percentages vs decimals;
-   shares vs thousand shares;
-   per-share values;
-   currency consistency.

Unit conversion must be auditable.

A 1,000× or 1,000,000× unit error is a critical data defect.

------------------------------------------------------------------------

## 13. Derived Metrics

Derived values must record:

-   input references;
-   formula/metric version;
-   calculation timestamp;
-   output;
-   quality inherited from inputs.

Derived metrics cannot have higher effective confidence than materially
weak required inputs without explicit approved logic.

------------------------------------------------------------------------

## 14. Freshness Framework

Freshness is metric-class specific. One universal "N days" rule is
inappropriate.

Classes:

### A. Market / price / technical data

Expected to update on trading-day cadence appropriate to the approved
workflow.

### B. Financial statements

Freshness tied to latest publicly available reporting period and
publication availability, not daily age alone.

### C. VN30 membership

Freshness tied to effective index review/change.

### D. Sector/reference master

Refresh when authoritative classification changes or scheduled
verification occurs.

### E. Estimates/forward data

Freshness tied to estimate date/version and approved valuation use.

Exact thresholds must come from approved data rules/model definitions or
be operationally defined without changing investment semantics. Missing
threshold ownership is a blocker, not permission to invent a favorable
threshold after seeing results.

------------------------------------------------------------------------

## 15. Freshness Status

Use deterministic states:

-   `CURRENT`
-   `AGING`
-   `STALE`
-   `UNKNOWN`

`UNKNOWN` is not equivalent to `CURRENT`.

For required inputs, `STALE` or `UNKNOWN` blocks affected
recommendation/scoring components unless baseline rules explicitly
define a permitted fallback.

------------------------------------------------------------------------

## 16. Quality Status

Each record/dataset may use:

-   `VALID`
-   `WARNING`
-   `INVALID`
-   `MISSING`
-   `CONFLICTING`
-   `STALE`
-   `UNKNOWN`

Blocking behavior must be deterministic.

No silent imputation unless explicitly defined by approved M3 rules.

------------------------------------------------------------------------

## 17. Confidence

Confidence describes evidence quality, not attractiveness of the stock.

Recommended operational levels:

-   `HIGH`
-   `MEDIUM`
-   `LOW`
-   `INSUFFICIENT`

Confidence must consider:

-   source quality;
-   completeness;
-   freshness;
-   consistency;
-   transformation complexity;
-   unresolved conflicts.

Existing M1/M3/M4 rules governing LOW confidence/new capital remain
authoritative.

------------------------------------------------------------------------

## 18. Missing Data

For required data:

1.  mark missing explicitly;
2.  identify affected metric/component;
3.  apply only approved fallback if one exists;
4.  reduce confidence where required;
5.  block recommendation when governing gates require it.

Do not replace missing values with zero, sector average, last known
value, or estimate unless approved logic explicitly permits that
transformation.

------------------------------------------------------------------------

## 19. Conflicting Sources

If two credible sources conflict:

-   retain both evidence references;
-   apply documented source hierarchy if approved;
-   quantify discrepancy;
-   determine whether difference is timing, restatement, methodology, or
    error;
-   mark unresolved material conflict as blocking.

Do not cherry-pick the value that produces a more attractive score.

------------------------------------------------------------------------

## 20. Impossible / Suspicious Values

Detect at least:

-   negative values where economically impossible;
-   impossible ratios;
-   zero denominator;
-   extreme unit-scale shifts;
-   market cap inconsistent with price/share count;
-   period duplication;
-   future dates;
-   price discontinuity potentially caused by unhandled corporate
    action.

Outlier detection is a review trigger, not automatic deletion.

------------------------------------------------------------------------

## 21. Source Hierarchy

Source hierarchy must favor authoritative/primary evidence where
practical.

Conceptual priority:

1.  official exchange/index/company/regulatory disclosure;
2.  high-quality licensed/established structured provider;
3.  reputable secondary source;
4.  analyst/user-derived data with explicit provenance.

The exact source stack must be documented during implementation.

No source may be treated as authoritative merely because it is easiest
to scrape.

------------------------------------------------------------------------

## 22. Data Snapshot Identity

Every scoring/recommendation run must bind to a deterministic dataset
identity.

Record:

-   Data Snapshot ID;
-   universe version/as-of;
-   market-data cutoff;
-   fundamental-data cutoff;
-   source versions/import batch IDs;
-   generated_at;
-   quality summary;
-   freshness summary;
-   exceptions.

This enables exact decision reconstruction.

------------------------------------------------------------------------

## 23. Point-in-Time Safety

For historical validation or replay:

`information availability date <= simulated decision timestamp`

must hold for decision inputs.

Current analysis may use latest valid available information.

Historical and current modes must not share a query that accidentally
introduces future data.

------------------------------------------------------------------------

## 24. Portfolio Data Boundary

Portfolio financial truth and market/fundamental analytical data are
separate domains.

A market-data refresh must not mutate:

-   transaction history;
-   reconstructed cash;
-   cost basis;
-   contributions;
-   dividends.

Likewise, portfolio import must not silently overwrite
fundamental/market datasets.

------------------------------------------------------------------------

## 25. Initialization Workflow

**Verify Release/Gates\
→ Initialize VN30 Master\
→ Validate Sector Mapping\
→ Load Market Data\
→ Load Fundamental Data\
→ Normalize Units/Periods\
→ Compute Approved Derived Metrics\
→ Run Missing/Stale/Conflict/Impossible Checks\
→ Build Data Snapshot\
→ Independent Quality Review\
→ PASS/BLOCK**

Only after PASS may downstream initial scoring execute.

------------------------------------------------------------------------

## 26. Dataset Quality Summary

The live execution report must include:

  Metric                        Value
  ----------------------------- -----------------
  Data Snapshot ID              NOT INITIALIZED
  VN30 Universe As-Of           NOT INITIALIZED
  Active Constituents           NOT INITIALIZED
  Market Data Cutoff            NOT INITIALIZED
  Fundamental Data Cutoff       NOT INITIALIZED
  Missing Required Inputs       NOT INITIALIZED
  Stale Required Inputs         NOT INITIALIZED
  Conflicting Required Inputs   NOT INITIALIZED
  Invalid Required Inputs       NOT INITIALIZED
  Overall Confidence            NOT INITIALIZED
  Overall Status                NOT INITIALIZED

No placeholder may be interpreted as PASS.

------------------------------------------------------------------------

## 27. Per-Ticker Readiness

For all VN30 names, produce:

  ----------------------------------------------------------------------------------------------------
  Ticker       Universe   Market   Fundamentals   Valuation   Flow/Technical   Confidence   Ready for
                                                  Inputs      Inputs                        Scoring?
  ------------ ---------- -------- -------------- ----------- ---------------- ------------ ----------
  *Execution                                                                                
  pending*                                                                                  

  ----------------------------------------------------------------------------------------------------

A ticker that lacks mandatory scoring inputs must not receive a
fabricated complete score.

------------------------------------------------------------------------

## 28. Initialization Gates

  Gate   Requirement                                  Current State
  ------ -------------------------------------------- ---------------
  DI1    VN30 master source/effective date verified   NOT EXECUTED
  DI2    Active universe complete/no duplicates       NOT EXECUTED
  DI3    Sector mapping complete                      NOT EXECUTED
  DI4    Required market data loaded                  NOT EXECUTED
  DI5    Required fundamentals loaded                 NOT EXECUTED
  DI6    Period/unit normalization validated          NOT EXECUTED
  DI7    Missing-data checks PASS                     NOT EXECUTED
  DI8    Freshness checks PASS                        NOT EXECUTED
  DI9    Conflict/impossible-value checks PASS        NOT EXECUTED
  DI10   Derived metric lineage verified              NOT EXECUTED
  DI11   Point-in-time controls verified              NOT EXECUTED
  DI12   Data Snapshot ID reproducible                NOT EXECUTED
  DI13   Required per-ticker readiness determined     NOT EXECUTED
  DI14   Independent data-quality review PASS         NOT EXECUTED
  DI15   No Critical/Major data issue unresolved      NOT EXECUTED

Downstream live scoring is prohibited until required DI gates PASS.

------------------------------------------------------------------------

## 29. Failure Handling

If initialization fails:

-   preserve source evidence;
-   record failed checks;
-   do not alter scoring weights or thresholds;
-   fix source/mapping/transformation;
-   rerun validation;
-   create a new dataset snapshot identity;
-   retain prior failed evidence.

Data defects must not be "fixed" by tuning the investment model.

------------------------------------------------------------------------

## 30. Audit Requirements

Record:

-   source imports;
-   normalization transformations;
-   rejected/conflicting records;
-   manual resolutions;
-   freshness calculations;
-   derived metric versions;
-   dataset snapshot creation;
-   reviewer;
-   timestamps.

Manual correction requires reason and evidence.

------------------------------------------------------------------------

## 31. Security

Data-source credentials/API keys must:

-   remain outside source-controlled plaintext;
-   not appear in logs or reports;
-   use least privilege;
-   be separated from exported decision evidence.

Data initialization evidence should contain provenance, not secrets.

------------------------------------------------------------------------

## 32. Multi-Role Review

### Software Architect

**Issue:** Without dataset identity, decisions cannot be reproduced
after refresh.\
**Fix:** Added immutable Data Snapshot ID and separation of portfolio vs
analytical data domains.\
**Critical:** 0 unresolved. **Major:** 0 unresolved.

### Financial Systems / Data Engineer

**Issue:** Period, unit, restatement and derived-metric errors can
produce plausible but wrong scores.\
**Fix:** Added period consistency, unit controls, restatement handling
and input lineage.\
**Critical:** 0 unresolved. **Major:** 0 unresolved.

### Security Reviewer

**Issue:** Data-provider credentials could leak into provenance/audit
evidence.\
**Fix:** Explicit secret separation and least-privilege controls.\
**Critical:** 0 unresolved. **Major:** 0 unresolved.

### QA Lead

**Issue:** Missing/stale inputs could silently become zero/last-known
and still produce rankings.\
**Fix:** Fail-closed statuses, per-ticker readiness and DI1--DI15
gates.\
**Critical:** 0 unresolved. **Major:** 0 unresolved.

### Portfolio Manager

**Issue:** Source selection or missing-data handling could bias rankings
toward desired names.\
**Fix:** Source hierarchy, no cherry-picking, no model tuning to data
defects, fact/estimate/assumption separation.\
**Critical:** 0 unresolved. **Major:** 0 unresolved.

------------------------------------------------------------------------

## 33. Re-Review Result

**Critical specification issues:** 0 unresolved\
**Major specification issues:** 0 unresolved\
**Live data initialization:** NOT EXECUTED\
**Authorization for live scoring:** NOT GRANTED

------------------------------------------------------------------------

## 34. Current Decision

**Document quality:** PASS FOR APPROVAL REVIEW\
**Data initialization contract:** READY\
**Live VN30 analytical dataset:** NOT INITIALIZED\
**Initial scoring:** BLOCKED until evidence-backed data gates PASS

------------------------------------------------------------------------

## 35. Approval Effect

When explicitly approved:

1.  promote `DATA_INITIALIZATION.md` to **Approved Baseline v1.0**;
2.  approval freezes the data initialization contract, not live dataset
    contents;
3.  DI1--DI15 remain evidence-dependent;
4.  no stale/missing/conflicting data may be silently converted to PASS;
5.  proceed only to the next M8 deliverable;
6.  `INITIAL_SCORING_REPORT.md` may define/report scoring only when
    required data gates permit execution.

------------------------------------------------------------------------

**END OF DOCUMENT**
