# VN30 Value Investing OS --- Initial Portfolio Snapshot

**Path:** `08_PRODUCTION/INITIAL_PORTFOLIO_SNAPSHOT.md`\
**Milestone:** M8 --- Production Readiness & Live Portfolio Onboarding\
**Version:** 0.1 --- Approval Candidate\
**Status:** READY FOR APPROVAL REVIEW --- SNAPSHOT NOT CREATED\
**Governing baselines:** `PRODUCTION_READINESS.md` v1.0,
`VERSION_BASELINE.md` v1.0, `BACKUP_RECOVERY.md` v1.0,
`PORTFOLIO_IMPORT_PLAN.md` v1.0, `RECONCILIATION_REPORT.md` v1.0

------------------------------------------------------------------------

## 1. Purpose

Define the immutable initial operational portfolio snapshot that
establishes the financial starting state for live VN30 Value Investing
OS operation.

This document currently defines the **snapshot contract, calculation
boundaries, evidence requirements, and creation gates**.

It does not claim that a real portfolio snapshot exists.

> The initial snapshot is a consequence of a reconciled ledger. It is
> not a substitute for reconciliation.

------------------------------------------------------------------------

## 2. Snapshot Role

The initial operational snapshot serves as:

1.  the first formally accepted live portfolio state;
2.  a reproducible reference for future weekly/monthly/quarterly
    reviews;
3.  the anchor for portfolio allocation and risk analysis;
4.  evidence for subsequent DCA decisions;
5.  a comparison point for future NAV and cash movements;
6.  an audit artifact tied to a specific release, dataset, and
    reconciliation state.

It must remain reproducible from authoritative historical records.

------------------------------------------------------------------------

## 3. Creation Preconditions

The live initial snapshot may be created only after:

-   authorized live portfolio import completed;
-   portfolio reconstructed from authoritative ledger;
-   required reconciliation gates RC1--RC12 PASS;
-   no material unexplained holdings/cash discrepancy;
-   release/build/schema identity verified;
-   required market data available with explicit `as_of`;
-   portfolio valuation data passes freshness/quality rules applicable
    at snapshot creation;
-   backup/recovery controls remain valid;
-   no Critical/Major onboarding blocker unresolved.

If these are not satisfied, status remains **SNAPSHOT NOT CREATED**.

------------------------------------------------------------------------

## 4. Immutability

Once accepted, the initial snapshot is immutable.

Corrections to historical data do not silently overwrite it.

If a material correction is later required:

1.  preserve the original snapshot;
2.  create correction evidence;
3.  correct the authoritative ledger through approved mechanisms;
4.  rerun reconciliation;
5.  create a new corrected snapshot/version;
6.  link old and new snapshots;
7.  explain the impact.

No destructive replacement.

------------------------------------------------------------------------

## 5. Snapshot Identity

Every snapshot requires:

-   Snapshot ID;
-   snapshot type (`INITIAL_OPERATIONAL`);
-   effective `as_of`;
-   generated_at;
-   accepted_at;
-   portfolio identifier;
-   Import Batch ID(s);
-   reconciliation report/version;
-   system release version;
-   application/build/commit identity;
-   policy/model baseline;
-   schema/migration identity;
-   market-data dataset identity;
-   operator/reviewer;
-   snapshot status.

Valid status:

-   `DRAFT`
-   `VALIDATED`
-   `ACCEPTED`
-   `SUPERSEDED`
-   `REJECTED`

Only `ACCEPTED` may serve as the initial live operational baseline.

------------------------------------------------------------------------

## 6. Time Boundary

All snapshot values must refer to a clearly defined effective boundary.

Record:

-   portfolio ledger cutoff;
-   holdings/cash `as_of`;
-   market price `as_of`;
-   fundamental-data `as_of` where referenced;
-   unresolved settlement items, if any.

Do not combine today's holdings with an unrelated historical cash
balance or stale market price without disclosure.

------------------------------------------------------------------------

## 7. Required Portfolio Summary

The accepted snapshot must contain:

  Field                            Required
  -------------------------------- -------------------------------------------
  Snapshot ID                      Yes
  As-Of                            Yes
  NAV                              Yes
  Cash                             Yes
  Invested market value            Yes
  Cash weight                      Yes
  Number of holdings               Yes
  Total contributions              Yes
  Total withdrawals                Yes
  Net contributions                Yes
  Cumulative dividends             Yes
  Realized P&L                     Yes where calculable under approved rules
  Unrealized P&L                   Yes where calculable
  Total P&L / performance fields   Only per approved methodology
  Reconciliation status            Yes
  Data quality/freshness status    Yes

No unavailable metric may be silently replaced by zero.

Use `NOT_AVAILABLE`, `NOT_APPLICABLE`, or equivalent explicit state
where necessary.

------------------------------------------------------------------------

## 8. Holding-Level Snapshot

For each holding:

  Field                                       Required
  ------------------------------------------- ----------
  Ticker                                      Yes
  Company/reference identity                  Yes
  Quantity                                    Yes
  Cost basis                                  Yes
  Average cost if defined by approved rules   Yes
  Market price                                Yes
  Price as-of                                 Yes
  Market value                                Yes
  Unrealized P&L                              Yes
  Portfolio weight                            Yes
  Sector                                      Yes
  VN30 membership status at snapshot date     Yes
  Data confidence/status                      Yes

Historical acquisition truth must not be altered because a company later
enters/exits VN30.

------------------------------------------------------------------------

## 9. Cash

Cash must be derived/reconciled under approved portfolio rules.

Record at least:

-   total portfolio cash;
-   available vs unsettled/restricted cash if the data model
    distinguishes them;
-   cash weight;
-   reconciliation evidence/reference.

Cash cannot be inferred as `NAV - broker holdings value` merely to force
balance.

------------------------------------------------------------------------

## 10. NAV

At the snapshot boundary:

**NAV = reconciled cash + market value of holdings + other approved
portfolio assets/liabilities within scope**

The exact formula follows approved M2 rules.

Checks:

-   no double counting;
-   market prices have documented source/as-of;
-   missing price does not silently become zero;
-   unsettled items handled consistently;
-   rounding rules deterministic.

------------------------------------------------------------------------

## 11. Cost Basis

Cost basis must come from reconstructed authoritative history under the
approved accounting methodology.

Broker displayed average cost is reference evidence only where
methodology may differ.

Any known explained methodology difference must remain linked to
reconciliation evidence.

------------------------------------------------------------------------

## 12. Realized and Unrealized P&L

P&L must use approved accounting/data rules.

Unrealized P&L must use:

-   approved cost basis;
-   valid snapshot market price;
-   consistent quantity.

Realized P&L must be reconstructed from historical disposals and
applicable costs according to baseline rules.

Do not infer missing realized P&L from broker lifetime summary if
underlying system history cannot support it.

------------------------------------------------------------------------

## 13. Contributions, Withdrawals and Dividends

Snapshot must retain cumulative values required to distinguish:

-   investment performance;
-   external capital flows;
-   income distributions.

At minimum:

-   cumulative deposits/contributions;
-   cumulative withdrawals;
-   net contributions;
-   cumulative dividends, with gross/net distinction if approved data
    rules support it.

This prevents cash injections from being mistaken for investment return.

------------------------------------------------------------------------

## 14. Allocation

Compute:

-   holding weights;
-   sector weights;
-   cash weight.

Required invariant:

`sum(holding weights) + cash weight + other in-scope asset/liability weights = portfolio total`,
subject only to documented rounding.

Allocation must use the same NAV and price boundary as the snapshot.

------------------------------------------------------------------------

## 15. Concentration and Risk Context

Snapshot should capture the portfolio state needed for M5/M4 review
without issuing a new investment recommendation.

Include:

-   largest positions;
-   sector concentration;
-   cash level;
-   applicable risk-limit observations;
-   any approved small-NAV exception currently relevant;
-   unresolved operational/risk flags.

A snapshot records state. It does not itself change a holding to
BUY/SELL.

------------------------------------------------------------------------

## 16. VN30 Membership Context

For every holding, record membership status/effective-date evidence
relevant to snapshot date.

Current VN30 membership must not rewrite historical transaction
validity.

Any holding that is outside the current eligible universe must be
surfaced for the subsequent portfolio review under approved policy---not
automatically sold by the snapshot process.

------------------------------------------------------------------------

## 17. Market Price Requirements

Each valuation price requires:

-   ticker;
-   source;
-   value;
-   `as_of`;
-   imported_at/retrieved_at where available;
-   freshness status;
-   confidence/quality status.

If required market data fails the applicable freshness/data gate, the
snapshot cannot be `ACCEPTED`.

------------------------------------------------------------------------

## 18. Data Lineage

For every material snapshot value, lineage must be traceable to one or
more of:

-   authoritative transaction ledger;
-   reconstructed portfolio state;
-   reconciliation evidence;
-   VN30/sector master;
-   market-data record;
-   approved calculation logic.

Manual values require explicit provenance and must not bypass
calculation rules.

------------------------------------------------------------------------

## 19. Snapshot Financial Invariants

Before acceptance, verify at least:

1.  holdings quantities equal reconciled quantities;
2.  cash equals reconciled cash;
3.  cost basis agrees with validated reconstruction;
4.  NAV recomputes from components;
5.  holding market values recompute from quantity × valid price under
    approved precision;
6.  weights recompute from NAV;
7.  allocation sums reconcile within approved rounding tolerance;
8.  contribution/withdrawal totals trace to ledger;
9.  dividend totals trace to ledger;
10. no duplicate holding identity;
11. required P&L values recompute;
12. no required value is silently null/zero-filled;
13. snapshot release/data identities are complete.

Any material invariant failure = `REJECTED`.

------------------------------------------------------------------------

## 20. Snapshot Generation Workflow

**Verify Upstream Gates\
→ Select Reconciled Portfolio State\
→ Freeze Ledger Cutoff\
→ Load Valid Market/VN30/Sector Data\
→ Compute Snapshot\
→ Run Financial Invariants\
→ Generate Draft\
→ Independent Review\
→ Accept/Reject\
→ Persist Immutable Snapshot\
→ Backup/Export Evidence**

No recommendation engine execution is required merely to create the
snapshot.

------------------------------------------------------------------------

## 21. Review Separation

Where practical:

-   generator/operator prepares snapshot;
-   reviewer independently verifies critical totals and identities.

At minimum independently recompute:

-   cash;
-   aggregate holdings market value;
-   NAV;
-   allocation total;
-   largest positions;
-   selected cost-basis/P&L samples.

------------------------------------------------------------------------

## 22. Snapshot Report --- Execution Section

### 22.1 Identity

  Field                      Value
  -------------------------- ----------------------
  Snapshot ID                NOT CREATED
  As-Of                      NOT CREATED
  Generated At               NOT CREATED
  Accepted At                NOT CREATED
  Release/Build              NOT CREATED
  Schema/Migration           NOT CREATED
  Import Batch               NOT CREATED
  Reconciliation Reference   NOT CREATED
  Data Dataset Identity      NOT CREATED
  Status                     SNAPSHOT NOT CREATED

### 22.2 Portfolio Summary

  Metric                          Value
  ----------------------- -------------
  NAV                       NOT CREATED
  Cash                      NOT CREATED
  Invested Market Value     NOT CREATED
  Cash Weight               NOT CREATED
  Holdings Count            NOT CREATED
  Net Contributions         NOT CREATED
  Dividends                 NOT CREATED
  Realized P&L              NOT CREATED
  Unrealized P&L            NOT CREATED

### 22.3 Holdings

No live holdings are populated before authorized execution.

### 22.4 Sector Allocation

NOT CREATED.

### 22.5 Risk/Concentration Context

NOT CREATED.

------------------------------------------------------------------------

## 23. Acceptance Gates

  -----------------------------------------------------------------------------
  Gate                    Requirement                   Current State
  ----------------------- ----------------------------- -----------------------
  IS1                     Upstream                      NOT EXECUTED
                          import/reconciliation gates   
                          PASS                          

  IS2                     Snapshot identity complete    NOT EXECUTED

  IS3                     Ledger cutoff/as-of           NOT EXECUTED
                          deterministic                 

  IS4                     Holdings equal reconciled     NOT EXECUTED
                          state                         

  IS5                     Cash equals reconciled state  NOT EXECUTED

  IS6                     Cost basis validated          NOT EXECUTED

  IS7                     Market data passes required   NOT EXECUTED
                          gates                         

  IS8                     NAV and market values         NOT EXECUTED
                          recompute                     

  IS9                     Contributions/dividends/P&L   NOT EXECUTED
                          traceable                     

  IS10                    Allocation/risk context       NOT EXECUTED
                          recomputes                    

  IS11                    Release/data lineage complete NOT EXECUTED

  IS12                    Independent review PASS       NOT EXECUTED

  IS13                    Immutable persistence +       NOT EXECUTED
                          evidence backup complete      

  IS14                    No Critical/Major or material NOT EXECUTED
                          unexplained discrepancy       
  -----------------------------------------------------------------------------

Only when IS1--IS14 PASS may status become `ACCEPTED`.

------------------------------------------------------------------------

## 24. Failure Handling

If snapshot validation fails:

-   mark draft `REJECTED`;
-   preserve evidence;
-   do not edit final values manually to force PASS;
-   identify whether issue belongs to ledger, reconciliation, market
    data, calculation, or snapshot generation;
-   correct at authoritative source/process layer;
-   rerun affected upstream validation;
-   generate a new snapshot candidate.

------------------------------------------------------------------------

## 25. Relationship to Subsequent M8 Work

An `ACCEPTED` initial snapshot becomes the portfolio-state input for:

-   data initialization validation;
-   initial scoring context;
-   initial portfolio review;
-   first DCA review;
-   subsequent operational reviews.

However, snapshot acceptance does not imply that fundamental/scoring
data is fresh enough for recommendations. Those gates are evaluated
separately.

------------------------------------------------------------------------

## 26. Multi-Role Review

### Software Architect

**Issue:** A mutable "current portfolio" record could be mistaken for an
auditable baseline.\
**Fix:** Added immutable Snapshot ID, release/data identities,
supersession instead of overwrite, and deterministic generation
workflow.

**Critical:** 0 unresolved. **Major:** 0 unresolved.

### Financial Systems Engineer

**Issue:** Snapshot could reproduce broker aggregates instead of
ledger-derived financial truth.\
**Fix:** Holdings, cash, cost basis, contributions and P&L must trace to
reconciled reconstruction; broker values remain reconciliation evidence.

**Critical:** 0 unresolved. **Major:** 0 unresolved.

### Security Reviewer

**Issue:** Snapshot/evidence may expose sensitive portfolio data.\
**Fix:** Requires controlled evidence handling inherited from M8
security/backup controls; no live values are inserted into this
specification.

**Critical:** 0 unresolved. **Major:** 0 unresolved.

### QA Lead

**Issue:** Template approval could be misread as snapshot execution.\
**Fix:** Every execution field and IS gate is explicitly
`NOT CREATED`/`NOT EXECUTED`; acceptance requires evidence.

**Critical:** 0 unresolved. **Major:** 0 unresolved.

### Portfolio Manager

**Issue:** Snapshot might accidentally generate investment actions or
treat non-VN30 holding as automatic SELL.\
**Fix:** Snapshot records state only; decisions remain governed by M4/M5
and occur in later review.

**Critical:** 0 unresolved. **Major:** 0 unresolved.

------------------------------------------------------------------------

## 27. Re-Review Result

**Critical specification issues:** 0 unresolved\
**Major specification issues:** 0 unresolved\
**Live snapshot:** NOT CREATED\
**Snapshot acceptance:** NOT CLAIMED

------------------------------------------------------------------------

## 28. Current Decision

**Document quality:** PASS FOR APPROVAL REVIEW\
**Snapshot contract:** READY\
**Initial live operational snapshot:** NOT CREATED\
**Authorization for scoring/recommendations from live portfolio:** NOT
IMPLIED

------------------------------------------------------------------------

## 29. Approval Effect

When explicitly approved:

1.  promote `INITIAL_PORTFOLIO_SNAPSHOT.md` to **Approved Baseline
    v1.0**;
2.  approval freezes the snapshot contract, not live portfolio values;
3.  IS1--IS14 remain evidence-dependent;
4.  no portfolio values may be fabricated or prefilled;
5.  proceed only to the next M8 deliverable in sequence;
6.  an initial snapshot becomes `ACCEPTED` only after authorized live
    onboarding and evidence-backed IS1--IS14 PASS.

------------------------------------------------------------------------

**END OF DOCUMENT**
