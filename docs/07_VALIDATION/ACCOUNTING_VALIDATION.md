# VN30 Value Investing OS --- Accounting Validation

**Document:** `07_VALIDATION/ACCOUNTING_VALIDATION.md`\
**Milestone:** M7.2 --- Accounting & Data Validation\
**Status:** Baseline Candidate --- Awaiting User Approval\
**Version:** 0.1\
**Date:** 2026-10-04\
**Parents:** `VALIDATION_STRATEGY.md` v1.0; `TRACEABILITY_MATRIX.md`
v1.0

## 1. Purpose

This document defines the independent validation contract for the
accounting layer. Accounting is release-critical because defects can
misstate cash, holdings, cost basis, realized/unrealized P&L, dividends,
NAV, portfolio weights, capital flows, risk inputs and downstream
allocation decisions.

M6.3 tests are prior evidence only. Gate 2 does not PASS because M6.3
passed. M7 must compare executable Actual results with independently
derived Expected results.

## 2. Governing accounting truth

Authority is: immutable Transaction facts → immutable TransactionLeg
balance effects → versioned accounting policy → deterministic
reconstruction → market/reference facts for valuation → derived
Portfolio/Position/NAV views → reconciliation evidence.

Required invariants:

-   Cash is derived from posted cash legs; quantity from
    security-quantity legs.
-   BUY/SELL open cost and realized P&L are derived, never editable
    truth.
-   Contributions/withdrawals are capital flows, not investment
    gains/losses.
-   NAV uses market value, not cost basis.
-   Reconciliation detects differences but never silently repairs ledger
    truth.
-   Historical reconstruction uses only events effective by cutoff.
-   Reversal/correction preserves original history.
-   Unsupported accounting policy fails closed.
-   Unsettled receivables are not spendable cash under the no-margin
    capability.
-   Missing/stale/conflicting required valuation evidence cannot produce
    fabricated NAV.

Current implementation owners: `transaction.ts`, `reconstruct.ts`,
`values.ts`, `valuation.ts`, `inception.ts`, `reconciliation.ts`,
`portfolio-ledger.ts`, and `portfolio/engine.ts`.

Observed numeric policy is exact decimal input, 12-decimal accounting
scale, BigInt arithmetic, and half-even rounding at division boundaries.
`valuation.ts` explicitly classifies economic gain as an accounting NAV
bridge, not TWR/CAGR/XIRR or evidence of achieving the 15--20% return
objective.

## 3. Independent Golden Portfolio Fixture

All values are VND. This fixture is simple enough to calculate without
production accounting helpers.

  Step   Event
  ------ ------------------------------------------------
  T0     Contribution +100,000 cash
  T1     BUY A: 100 × 200 = 20,000; fee 20
  T2     BUY A: 100 × 300 = 30,000; fee 30
  T3     Dividend: gross 1,000; withholding 50; net 950
  T4     SELL A: 100 × 400 = 40,000; fee 40; tax 40
  T5     Contribution +10,000
  T6     Value remaining 100 shares at 350

Independent Expected calculations:

-   T1 acquisition cost = 20,020; cash = 79,980; average cost = 200.20.
-   T2 acquisition cost = 30,030; quantity = 200; open cost = 50,050;
    MWAC = 250.25; cash = 49,950.
-   T3 cash = 50,900; gross dividend = 1,000; withholding = 50; net
    dividend = 950; quantity/cost unchanged.
-   T4 released cost = 100/200 × 50,050 = 25,025. Net proceeds = 40,000
    − 40 − 40 = 39,920. Realized P&L = 39,920 − 25,025 = 14,895.
    Remaining quantity = 100; open cost = 25,025; cash = 90,820.
-   T5 net contributed capital = 110,000; cash = 100,820. The 10,000 is
    not investment profit.
-   T6 market value = 35,000; unrealized P&L = 9,975; NAV = 135,820;
    economic gain since zero-state inception = 135,820 − 110,000 =
    25,820.
-   Conservation cross-check: 14,895 realized + 9,975 unrealized + 950
    net dividend = 25,820.

  Output                      Expected
  ------------------------- ----------
  Cash                         100,820
  Quantity A                       100
  Open cost A                   25,025
  Average cost A                250.25
  Realized trading P&L          14,895
  Gross dividends                1,000
  Dividend withholding              50
  Net dividends                    950
  Market value                  35,000
  Unrealized P&L                 9,975
  Net contributed capital      110,000
  NAV                          135,820
  Economic gain                 25,820

Any different final economics is a Gate 2 failure unless an approved
baseline rule explicitly changes fee/tax posting timing. Timing may
change intermediate cash, never final conservation once all legs are
effective.

## 4. Required accounting cases

  ----------------------------------------------------------------------------------------
  ID                Case                       Expected                  Severity
  ----------------- -------------------------- ------------------------- -----------------
  AC-01             Empty zero inception       zero                      Critical
                                               cash/positions/baseline   

  AC-02             Contribution               cash and capital rise     Critical
                                               equally; gain unchanged   

  AC-03             Withdrawal                 cash/capital fall; no     Critical
                                               fake loss                 

  AC-04             Single BUY                 exact quantity/cost/cash  Critical

  AC-05             Multiple BUY               exact MWAC                Critical

  AC-06             Partial SELL               exact proportional cost   Critical
                                               release/P&L               

  AC-07             Full SELL                  quantity and residual     Critical
                                               open cost = 0             

  AC-08             Rebuy after full exit      new cycle not             Critical
                                               contaminated              

  AC-09             Dividend                   exact income/cash;        Major/Critical if
                                               quantity/cost unchanged   NAV wrong

  AC-10             Fee/tax                    applied exactly once      Critical

  AC-11             Net vs split settlement    same final economics      Critical

  AC-12             Receivable/payable         not spendable/labeled as  Critical
                                               settled cash              

  AC-13             Oversell                   atomic rejection          Critical

  AC-14             Insufficient settled cash  reject; receivable cannot Critical
                                               finance                   

  AC-15             Imported opening holdings  opening NAV uses market   Critical
                                               evidence, not cost        

  AC-16             Same-instant contribution  not double-counted as     Critical
                    at inception               opening capital           

  AC-17             Missing inception price    economic gain BLOCKED     Critical

  AC-18             Stale/future/conflicting   BLOCKED                   Critical
                    inception evidence                                   

  AC-19             Reversal                   history preserved;        Critical
                                               current state inverted    

  AC-20             Replacement after reversal exactly one active        Critical
                                               corrected event           

  AC-21             Duplicate corporate action reject                    Critical

  AC-22             Split/reverse split        ratio correct; basis      Critical
                                               conserved                 

  AC-23             Supported merger/spinoff   quantity/basis            Critical
                                               conservation              

  AC-24             Unsupported action/method  fail closed               Major/Critical

  AC-25             Historical cutoff          future event cannot alter Critical
                                               prior state               

  AC-26             Input permutation          same economics            Critical

  AC-27             Replay repeat              deterministic output      Critical

  AC-28             Stale                      cannot overwrite newer    Critical
                    watermark/concurrency      truth                     

  AC-29             Reconciliation match       MATCHED                   Major

  AC-30             Reconciliation mismatch    visible; no auto-fix      Critical

  AC-31             Stale/missing              block/escalate correctly  Major
                    reconciliation evidence                              

  AC-32             Missing current price      valuation BLOCKED         Critical

  AC-33             Stale current price        not silently VALID        Major

  AC-34             Conflicting prices         no fabricated value       Critical

  AC-35             Position/NAV weights       exact from valid NAV      Major

  AC-36             Large VND values           no float drift/overflow   Critical
                                               in supported range        

  AC-37             Repeating-decimal MWAC     half-even only at         Major
                                               approved boundary         

  AC-38             Full exit after rounded    residual basis fully      Critical
                    partial exits              released                  

  AC-39             Negative cash path         prohibited                Critical

  AC-40             Delete/rebuild derived     ledger reproduces state   Critical
                    cache                                                
  ----------------------------------------------------------------------------------------

## 5. Metamorphic tests

**MT-A Contribution neutrality:** add external contribution C. Cash, NAV
and contributed capital rise C; investment gain does not.

**MT-B Price-only change:** with ledger fixed, quantity/open
cost/realized P&L/contribution stay fixed; market value/NAV/unrealized
P&L change consistently.

**MT-C Event-order permutation:** storage/input order changes cannot
change economics when effective/event ordering facts are unchanged.

**MT-D Replay repeat:** same immutable ledger + input versions must
reproduce identical economics.

**MT-E Reversal history:** reversal changes state only from its
effective time onward.

**MT-F Reconciliation independence:** changing broker evidence cannot
alter ledger cash/quantity/cost.

**MT-G Cache independence:** deleting/rebuilding derived snapshots
cannot change authoritative accounting.

## 6. Numeric precision and tolerances

Share quantity, cash legs, contributions, gross values, supplied
fees/taxes, identities and zero position after full exit require exact
comparison.

For MWAC/proportional basis division, M7 must independently compute the
rational value, apply approved half-even rounding only at the documented
division boundary, and compare at the approved 12-decimal accounting
scale.

Default tolerance after approved rounding is **zero accounting units**.
Non-zero tolerance requires a field-specific approved rationale and may
never conceal wrong sign, formula, double charge or timing.

## 7. Independent oracle

Expected values must be manually derived or generated by validation-only
code that does not import production reconstruction/valuation helpers.
Production `Decimal`, reconstruction, valuation, repositories or shared
investment formulas may calculate Actual only.

Every release-critical case records formula/intermediates, Expected,
Actual, Difference, tolerance, fixture hash, implementation SHA,
methodology ID, as-of timestamp and evidence.

## 8. Temporal controls

Evidence must retain event timestamp, leg effective timestamp,
settlement time where applicable, valuation as-of, price
observed/received/valid-through times, reference effective dates,
inception, watermark and accounting method.

Future legs, prices, references, reversals or corrections must not alter
an earlier reconstruction. Missing imported-inception market evidence
blocks inception economic gain; cost basis cannot substitute.

## 9. Reconciliation contract

Broker/import evidence is a comparator, never ledger owner. Test exact
match, cash/quantity/cost/obligation mismatches, stale/missing evidence
and unresolved discrepancy.

Mismatch must preserve ledger truth, preserve evidence, expose
difference and block/escalate as required. Any routine that mutates
authoritative balances to "make them match" is **Critical**.

## 10. Corporate-action scope

Current M6 supports defined paths for split/reverse split, rights
subscription, merger/spinoff and reversal. M6.3 also documents
unsupported/change-request cases including some bonus/stock-dividend
basis, fractional/cash-in-lieu/tax-specific actions and partial
categorized split settlements.

Unsupported policy cases must fail closed. M7 must not invent accounting
rules to increase coverage.

## 11. Evidence record

Each release-critical case retains Case ID, requirement ID, baseline
version/hash, implementation SHA, method ID, fixture/hash, as-of,
independent Expected derivation, Actual, Difference, tolerance, status,
logs/artifacts, reviewer/timestamp and issue/remediation link. Critical
accounting correctness requires E3 evidence.

## 12. Gate 2

Accounting PASS requires all Critical cases PASS, zero unresolved Major
defects, Golden Portfolio Expected = Actual, deterministic replay,
contribution neutrality, NAV/cost separation, no-auto-fix
reconciliation, historical cutoff/reversal, numeric precision and
fail-closed unsupported cases.

Accounting FAIL occurs for material cash/NAV/quantity/cost/P&L
misstatement; contribution counted as gain; cost basis used as market
value; material fee/tax error; future information affecting prior state;
reconciliation mutation; oversell/negative financing acceptance;
history-destructive reversal; nondeterministic replay; guessed
unsupported accounting; or failure of the independent oracle.

No downstream scoring/decision result can compensate for Accounting Gate
2 failure.

## 13. Current findings

**AC-F01 --- Historical M6.3 defects.** Duplicate corporate-action
stage, Vietnam reference-day boundary, pre-inception state and imported
opening-NAV issues were previously discovered/remediated. They remain
mandatory M7 regressions.

**AC-F02 --- Production tests are not independent oracle.** Major
validation-design risk resolved by the independent Expected requirement.

**AC-F03 --- Economic gain vs investment return.** Major if confused.
Current `valuation.ts` explicitly distinguishes the accounting NAV
bridge from TWR/CAGR/XIRR; M7 must preserve this.

**AC-F04 --- Unsupported corporate actions.** Major if guessed. Safe
rejection remains correct pending approved upstream policy.

**AC-F05 --- Baseline metadata inconsistency.** Some M2 headers retain
"Awaiting Approval" wording despite project governance approval. Use
frozen content hash + governance evidence, never header alone.

## 14. Multi-role review

-   **CIO --- PASS:** capital flows cannot masquerade as performance.
-   **Independent Model Validator --- PASS:** independent oracle and
    failure injection prevent M6 self-certification.
-   **Quantitative Analyst --- PASS:** algebraic conservation and
    rounding rules are explicit.
-   **Financial Systems Engineer --- PASS:**
    ledger/replay/lineage/valuation/reconciliation are testable.
-   **Risk Manager --- PASS:** negative cash, stale data, inception and
    reconciliation failures are release-critical.
-   **QA Lead --- PASS:** 40 cases plus metamorphic tests form a
    rejection-capable validation contract.

**Critical unresolved in this validation specification: 0.**\
**Major unresolved in this validation specification: 0.**

This document validates the test contract and independent expected
accounting results. It does not claim all M7 cases have already executed
against a frozen M7 build. Formal Expected-vs-Actual execution evidence
is required before `FINAL_VALIDATION_REPORT.md` can declare Gate 2 PASS.

## 15. Approval Gate

**Document state:** `BASELINE CANDIDATE — READY FOR USER APPROVAL`

On approval, promote to **Approved Baseline v1.0** and proceed only to
`07_VALIDATION/DATA_VALIDATION.md`. Do not begin scoring or historical
validation early.
