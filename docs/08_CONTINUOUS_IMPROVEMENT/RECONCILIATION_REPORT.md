# VN30 Value Investing OS --- Reconciliation Report

**Path:** `08_PRODUCTION/RECONCILIATION_REPORT.md`\
**Milestone:** M8 --- Live Portfolio Onboarding\
**Version:** 0.1 --- Approval Candidate\
**Status:** READY FOR APPROVAL REVIEW --- EXECUTION PENDING\
**Governing baselines:** `PRODUCTION_READINESS.md` v1.0,
`VERSION_BASELINE.md` v1.0, `BACKUP_RECOVERY.md` v1.0,
`PORTFOLIO_IMPORT_PLAN.md` v1.0

------------------------------------------------------------------------

## 1. Purpose

Define the authoritative reconciliation procedure and report used after
a controlled portfolio import.

This file currently defines the **report contract and acceptance
logic**. It does not claim that a real portfolio has been imported or
reconciled.

No MATCH/PASS result may be entered without execution evidence.

------------------------------------------------------------------------

## 2. Objective

Reconciliation must independently answer:

> Does the portfolio reconstructed by VVIOS from authoritative
> transaction history agree with independent broker/current evidence,
> and can every material difference be explained?

Required domains:

1.  holdings;
2.  cash;
3.  cost basis;
4.  contributions/withdrawals;
5.  dividends;
6.  fees/taxes where independently comparable;
7.  realized P&L where comparable;
8.  corporate-action effects;
9.  portfolio NAV/market value as-of a common timestamp where
    applicable.

------------------------------------------------------------------------

## 3. Preconditions

Execution of live reconciliation requires:

-   authorized live import;
-   exact Import Batch ID;
-   successful persistence;
-   portfolio reconstructed from authoritative ledger;
-   broker/current evidence captured with `as_of`;
-   release/build/schema identity recorded;
-   source data lineage retained;
-   no upstream blocker that invalidates financial truth.

If live import has not occurred, report execution status remains **NOT
EXECUTED**.

------------------------------------------------------------------------

## 4. Evidence Hierarchy

### System side

Primary system evidence:

**Persisted authoritative transactions → approved reconstruction logic →
expected portfolio state**

### External side

Independent evidence may include:

-   broker holdings statement/export;
-   broker cash statement;
-   broker transaction/cash history;
-   broker cost-basis/reference information;
-   official corporate-action evidence.

Broker aggregate values are reconciliation references; they do not
automatically override correctly reconstructed historical truth.

------------------------------------------------------------------------

## 5. Common As-Of Boundary

System and broker values must be compared at a compatible effective
time.

Record:

-   system reconstruction `as_of`;
-   broker evidence `as_of`;
-   market-price `as_of`, if NAV/market value is compared;
-   settlement timing assumptions;
-   pending/unsettled transactions;
-   corporate actions/dividends not yet posted.

A timing mismatch must not be mislabeled as unexplained financial error.

------------------------------------------------------------------------

## 6. Classification

Every difference receives exactly one status:

### MATCH

Values agree within a **predefined** legitimate precision/rounding
tolerance.

### EXPLAINED_DIFFERENCE

Difference is supported by evidence and a deterministic explanation,
such as timing, broker methodology, pending settlement, cost-basis
convention, or documented historical-data limitation.

### UNEXPLAINED_DIFFERENCE

No sufficient evidence explains the difference.

`EXPLAINED_DIFFERENCE` is not a euphemism for "small enough to ignore."

------------------------------------------------------------------------

## 7. Materiality

Materiality must be defined **before** using it for go-live acceptance.

Two dimensions apply:

-   **absolute financial materiality**;
-   **control/audit materiality**.

A small amount may still be control-material if it indicates:

-   missing transaction;
-   duplicate transaction;
-   incorrect corporate action;
-   broken fee/tax logic;
-   ledger mutation;
-   unexplained source-line loss;
-   reconciliation algorithm defect.

No post-hoc threshold may be invented merely to obtain PASS.

For first live onboarding, target is exact quantity reconciliation and
explainable cash/cost-basis differences subject only to approved
financial precision/rounding rules.

------------------------------------------------------------------------

## 8. Holdings Reconciliation

For every instrument:

  ----------------------------------------------------------------------------------------
  Ticker          System Qty    Broker Qty    Difference Status     Explanation/Evidence
  ------------ ------------- ------------- ------------- ---------- ----------------------
  *Execution                                                        
  pending*                                                          

  ----------------------------------------------------------------------------------------

Checks:

-   all system holdings appear in broker evidence;
-   all broker holdings appear in system reconstruction;
-   zero positions handled consistently;
-   no negative quantity unless explicitly valid;
-   corporate actions reflected once;
-   transfers identified rather than disguised as BUY/SELL.

**Acceptance target:** quantity differences = 0 unless an evidenced
timing/settlement state explicitly explains them.

------------------------------------------------------------------------

## 9. Cash Reconciliation

  Measure        System   Broker/Actual   Difference Status   Evidence
  --------- ----------- --------------- ------------ -------- ----------
  Cash        *Pending*       *Pending*                       

Reconstruct system cash from:

**Deposits − Withdrawals − Buy cash effects + Sell cash effects +
Dividends − Fees − Taxes ± approved corporate-action cash effects**

Check:

-   unsettled cash;
-   blocked/available cash distinction;
-   fees/taxes posting timing;
-   dividend payment timing;
-   withdrawal/deposit posting date;
-   broker rounding.

Material unexplained cash difference blocks go-live.

------------------------------------------------------------------------

## 10. Cost-Basis Reconciliation

For each holding:

  -------------------------------------------------------------------------------
  Ticker         System Cost        Broker    Difference Methodology   Status
                       Basis     Reference               Difference?   
  ------------ ------------- ------------- ------------- ------------- ----------
  *Execution                                                           
  pending*                                                             

  -------------------------------------------------------------------------------

Broker cost basis may differ because of methodology. Therefore:

1.  verify VVIOS calculation against approved M2 rules;
2.  identify broker methodology if available;
3.  compare underlying transaction evidence;
4.  classify methodology-driven differences as explained only with
    evidence.

Never change approved VVIOS cost-basis rules solely to match broker
display.

------------------------------------------------------------------------

## 11. Contributions and Withdrawals

Reconcile cumulative:

-   cash deposits;
-   cash withdrawals;
-   net contributions.

These values are essential to performance/NAV interpretation.

Any unexplained contribution difference is material because it can
distort investment performance.

------------------------------------------------------------------------

## 12. Dividends

Reconcile:

-   gross dividend where available;
-   withholding/tax;
-   net cash received;
-   payment date;
-   ticker/source;
-   corporate-action linkage where relevant.

Prevent double counting when broker export includes both dividend and
related tax rows.

------------------------------------------------------------------------

## 13. Fees and Taxes

Where independent evidence permits:

-   trade fees;
-   taxes;
-   custody/other portfolio fees if within model scope;
-   dividend taxes.

Difference classification must consider embedded vs separate broker
entries.

------------------------------------------------------------------------

## 14. Realized P&L

If broker realized P&L is available, compare it as reference evidence
only after confirming methodology compatibility.

A mismatch may arise from cost-basis methodology rather than ledger
error.

VVIOS approved accounting rules remain authoritative for system
calculations unless a formal Change Request changes them.

------------------------------------------------------------------------

## 15. Corporate Actions

Create a specific reconciliation record for every material corporate
action.

  ------------------------------------------------------------------------
  Event        Ticker      Effective   System      Broker      Status
                           Date        Effect      Evidence    
  ------------ ----------- ----------- ----------- ----------- -----------
  *Execution                                                   
  pending*                                                     

  ------------------------------------------------------------------------

Verify:

-   quantity adjustment;
-   cash component;
-   cost-basis treatment;
-   ticker/security conversion;
-   event applied exactly once.

Unknown or unexplained corporate-action effects are blocking.

------------------------------------------------------------------------

## 16. NAV and Market Value

NAV/market value reconciliation is meaningful only when:

-   holdings and cash are already reconciled;
-   market prices use compatible timestamps;
-   price source is documented;
-   stale/missing price handling is explicit.

Do not use NAV agreement to mask underlying quantity or cash
disagreement.

------------------------------------------------------------------------

## 17. Row/Batch Accounting Cross-Check

Before accepting reconciliation:

`source rows = classified import rows`

and:

`persisted accepted records = confirmed accepted payload`

and:

`reconstruction inputs = expected persisted authoritative records`

Any mismatch between these layers is a control failure even if final
holdings happen to match broker values.

------------------------------------------------------------------------

## 18. Difference Register

Every non-MATCH item must enter the difference register.

  -------------------------------------------------------------------------------------------------------
  Difference   Domain     Amount/Qty Classification   Root    Evidence   Material?   Owner   Resolution
  ID                                                  Cause                                  
  ------------ -------- ------------ ---------------- ------- ---------- ----------- ------- ------------
  *Execution                                                                                 
  pending*                                                                                   

  -------------------------------------------------------------------------------------------------------

No difference may disappear between review iterations.

------------------------------------------------------------------------

## 19. Explained Difference Requirements

An `EXPLAINED_DIFFERENCE` requires:

-   specific root cause;
-   supporting source/evidence;
-   quantified impact;
-   determination of whether it affects financial truth;
-   reviewer acceptance;
-   resolution or explicit ongoing treatment.

"Broker differs" is not an explanation.

------------------------------------------------------------------------

## 20. Unexplained Difference Escalation

For an `UNEXPLAINED_DIFFERENCE`:

1.  freeze onboarding progression;
2.  preserve current evidence;
3.  do not edit ledger manually;
4.  trace source → normalized row → persisted record → reconstruction;
5.  inspect corporate actions, fees, taxes, transfers and timing;
6.  correct through approved auditable mechanism if source/import error
    is proven;
7.  rerun reconstruction and reconciliation;
8.  retain previous failed report.

Material unexplained differences prohibit go-live.

------------------------------------------------------------------------

## 21. Reconciliation Corrections

Corrections must preserve history.

Required linkage:

**Original record → issue evidence → correction/reversal → new
reconstruction → new reconciliation**

Direct database editing to make numbers match is prohibited.

------------------------------------------------------------------------

## 22. Reconciliation Summary

Execution report must include:

  Metric                             Result
  ---------------------------------- --------------
  Import Batch ID                    NOT EXECUTED
  Reconciliation As-Of               NOT EXECUTED
  Release/Build                      NOT EXECUTED
  Schema/Migration                   NOT EXECUTED
  Holdings                           NOT EXECUTED
  Cash                               NOT EXECUTED
  Cost Basis                         NOT EXECUTED
  Contributions                      NOT EXECUTED
  Dividends                          NOT EXECUTED
  Corporate Actions                  NOT EXECUTED
  Material Unexplained Differences   NOT EXECUTED
  Overall Status                     NOT EXECUTED

Valid overall states:

-   `PASS`
-   `CONDITIONAL_PASS` --- only if all remaining differences are
    non-material, fully explained, and explicitly accepted by governing
    rules;
-   `FAIL`
-   `NOT_EXECUTED`

`CONDITIONAL_PASS` cannot bypass a gate that explicitly requires PASS.

------------------------------------------------------------------------

## 23. Go-Live Reconciliation Gates

  Gate   Requirement                                  Current State
  ------ -------------------------------------------- ---------------
  RC1    Import lineage complete                      NOT EXECUTED
  RC2    Source/persisted row accounting reconciled   NOT EXECUTED
  RC3    Holdings reconciled                          NOT EXECUTED
  RC4    Cash reconciled                              NOT EXECUTED
  RC5    Cost basis validated/reconciled              NOT EXECUTED
  RC6    Contributions/withdrawals reconciled         NOT EXECUTED
  RC7    Dividends validated                          NOT EXECUTED
  RC8    Corporate actions validated                  NOT EXECUTED
  RC9    All non-MATCH differences registered         NOT EXECUTED
  RC10   No material unexplained difference           NOT EXECUTED
  RC11   Audit trail complete                         NOT EXECUTED
  RC12   Independent reviewer sign-off                NOT EXECUTED

Live onboarding cannot progress to the immutable initial operational
snapshot until required RC gates PASS.

------------------------------------------------------------------------

## 24. Evidence Package

Retain:

-   broker/current evidence identity/checksum where feasible;
-   import batch reference;
-   system reconstruction output;
-   holdings comparison;
-   cash comparison;
-   cost-basis analysis;
-   difference register;
-   corporate-action reconciliation;
-   reviewer notes;
-   final signed status.

Sensitive broker evidence must not be placed in an uncontrolled/public
repository.

------------------------------------------------------------------------

## 25. Independent Review

A reconciliation reviewer should not merely confirm that the import
process reported success.

Reviewer must independently inspect:

-   source totals;
-   reconstructed totals;
-   differences;
-   materiality;
-   root-cause evidence;
-   audit lineage.

Where practical, critical totals should be independently recomputed.

------------------------------------------------------------------------

## 26. Multi-Role Review

### Software Architect

**Issue:** Final matching values could hide broken import lineage.\
**Fix:** Added source → accepted payload → persisted records →
reconstruction cross-check.\
**Critical:** 0 unresolved. **Major:** 0 unresolved.

### Financial Systems Engineer

**Issue:** Broker cost basis and system methodology may legitimately
differ.\
**Fix:** Separated financial truth validation from broker methodology
matching; evidence required for explained differences.\
**Critical:** 0 unresolved. **Major:** 0 unresolved.

### Security Reviewer

**Issue:** Reconciliation evidence can expose broker/account data.\
**Fix:** Restricted evidence handling and prohibited uncontrolled/public
storage.\
**Critical:** 0 unresolved. **Major:** 0 unresolved.

### QA Lead

**Issue:** Template could accidentally imply a successful live
reconciliation.\
**Fix:** All execution fields explicitly `NOT EXECUTED`; PASS requires
evidence-backed RC gates.\
**Critical:** 0 unresolved. **Major:** 0 unresolved.

### Portfolio Manager

**Issue:** Small unexplained differences could be ignored because
portfolio-level NAV looks close.\
**Fix:** Control materiality added; NAV cannot mask holdings/cash/ledger
defects.\
**Critical:** 0 unresolved. **Major:** 0 unresolved.

------------------------------------------------------------------------

## 27. Re-Review Result

**Critical specification issues:** 0 unresolved\
**Major specification issues:** 0 unresolved\
**Execution status:** NOT EXECUTED\
**Live reconciliation result:** NOT CLAIMED

------------------------------------------------------------------------

## 28. Current Decision

**Document quality:** PASS FOR APPROVAL REVIEW\
**Reconciliation framework:** READY\
**Real portfolio reconciliation:** NOT EXECUTED\
**Initial operational snapshot authorization:** NOT GRANTED

------------------------------------------------------------------------

## 29. Approval Effect

When explicitly approved:

1.  promote `RECONCILIATION_REPORT.md` to **Approved Baseline v1.0**;
2.  approval freezes the reconciliation contract, not a reconciliation
    result;
3.  RC1--RC12 remain `NOT EXECUTED` until real authorized onboarding
    occurs;
4.  no MATCH/PASS may be prefilled without evidence;
5.  proceed to the next M8 deliverable only under upstream gates.

------------------------------------------------------------------------

**END OF DOCUMENT**
