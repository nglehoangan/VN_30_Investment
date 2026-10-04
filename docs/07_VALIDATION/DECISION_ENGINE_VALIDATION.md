# VN30 Value Investing OS --- Decision Engine Validation

**Document:** `07_VALIDATION/DECISION_ENGINE_VALIDATION.md`\
**Milestone:** M7.4 --- Decision Engine Validation\
**Status:** Baseline Candidate --- Awaiting User Approval\
**Version:** 0.1\
**Date:** 2026-10-04\
**Parents:** `VALIDATION_STRATEGY.md` v1.0; `TRACEABILITY_MATRIX.md`
v1.0; `ACCOUNTING_VALIDATION.md` v1.0; `DATA_VALIDATION.md` v1.0;
`SCORING_VALIDATION.md` v1.0

## 1. Objective

Independently validate that the executable Decision Engine implements
the approved M1/M4 decision constitution and cannot convert score, price
movement, technical signals, available DCA cash, portfolio P&L or
execution convenience into unauthorized capital action.

The engine must emit exactly one economic Decision State:

`STRONG BUY | BUY | ACCUMULATE | HOLD | REDUCE | SELL | AVOID`

Execution status, review status and decision qualifiers are orthogonal
controls and must not silently redefine the economic state.

## 2. Oracle independence

Expected decisions must be derived from a validation-only precedence
table transcribed from approved M1/M4 baselines.

The oracle must not import production `decide()`, production decision
constants, production gate helpers or production state-mapping tables.

Production code calculates Actual only.

Each golden case must show:

`facts → precedence/gates → ownership semantics → economic state → execution sub-status → authorization`

## 3. Constitutional precedence

Validate this order:

0.  mandate / operational legality;
1.  hard Risk Policy veto;
2.  Stage 0 / evidence actionability;
3.  thesis;
4.  minimum fundamental/category gates;
5.  valuation / required return;
6.  residual risk / confidence;
7.  portfolio constraints;
8.  opportunity cost;
9.  economic Decision State;
10. execution feasibility/timing.

Lower levels cannot repair a higher-level failure.

Execution feasibility may defer/block a valid economic state where
approved; it must not make a weak business attractive.

## 4. State semantics

### STRONG BUY

Exceptional positive allocation merit. Requires the stricter approved
quality, confidence, valuation/asymmetry and risk conditions. May apply
to unowned or owned security only under approved ownership semantics.

### BUY

Positive initiation state for an unowned security. BUY and ACCUMULATE
are mutually exclusive by ownership.

### ACCUMULATE

Positive add state for an already-owned security with intact/improving
thesis and all add gates satisfied.

### HOLD

Continued ownership remains justified but no current positive
add/reduce/exit authorization. HOLD cannot hide unresolved
PENDING/ESCALATED semantics.

### REDUCE

Continued ownership remains partially justified, but exposure should be
reduced for approved thesis/risk/valuation/portfolio reasons.

### SELL

Target residual ownership is zero under approved exit logic. Broken
thesis normally routes here unless a specific approved rule requires
staged reduction.

### AVOID

Unowned security should receive no new capital. AVOID is not the normal
state for an owned security.

## 5. Ownership truth table

  ----------------------------------------------------------------------------
  Ownership      Positive       Positive add   No-action      Exit/reduction
                 initiation                                   
  -------------- -------------- -------------- -------------- ----------------
  UNOWNED        BUY / STRONG   invalid        AVOID          N/A
                 BUY                                          

  OWNED          invalid        ACCUMULATE /   HOLD           REDUCE / SELL
                                STRONG BUY                    

  LEGACY OWNED   no new capital prohibited     HOLD where     REDUCE / SELL
                                               residual       
                                               thesis         
                                               supports       

  ZERO after     BUY / STRONG   invalid        AVOID          N/A
  prior exit     BUY if                                       
                 re-entry gates                               
                 pass                                         
  ----------------------------------------------------------------------------

M7 must reject impossible combinations such as unowned ACCUMULATE or
owned ordinary BUY.

## 6. Mandatory positive-capital gates

Normal BUY/ACCUMULATE requires:

-   current VN30 eligibility for new capital;
-   Stage 0 permitted state;
-   score validity sufficient for action;
-   confidence MEDIUM/HIGH;
-   BQ \>=13/25;
-   FH \>=8/15;
-   RG \>=5/10;
-   VAL \>=10/20;
-   thesis INTACT or IMPROVING;
-   no hard veto/unresolved mandatory veto review;
-   acceptable residual risk;
-   required-return hurdle;
-   portfolio impact not prohibited;
-   opportunity cost acceptable.

STRONG BUY must additionally satisfy its approved stricter gates,
including HIGH confidence and stronger category/risk-return
requirements.

No excess Total Score can compensate for a failed non-compensable gate.

## 7. Stage 0 validation

Required cases:

-   PASS → may proceed.
-   PASS WITH CONDITIONS → only approved narrow path; must not support
    STRONG BUY or averaging down and must carry explicit mitigation.
-   FAIL --- INVESTABILITY → no new capital.
-   PENDING → no new capital.
-   definitive FAIL must not be re-opened by score/valuation/technical
    strength.

Owned Stage-0 failure must trigger explicit residual-ownership/reduction
review; it cannot silently become ordinary HOLD.

## 8. Thesis validation

  -----------------------------------------------------------------------
  Thesis                  New capital             Owned-state expectation
  ----------------------- ----------------------- -----------------------
  IMPROVING               eligible subject to all ACCUMULATE/STRONG BUY
                          gates                   possible

  INTACT                  eligible subject to all ACCUMULATE/HOLD
                          gates                   possible

  WEAKENING               no automatic add        HOLD/REDUCE after
                                                  re-underwrite

  BROKEN                  prohibited              normally SELL; no
                                                  averaging down

  PENDING                 prohibited              provisional
                                                  state/review, not
                                                  normal HOLD
  -----------------------------------------------------------------------

Mandatory adversaries:

-   price falls 30% while thesis BROKEN;
-   price falls while thesis INTACT but forward economics worsen;
-   loss position with unchanged valuation;
-   +20% gain with thesis intact and attractive forward return;
-   technical weakness with thesis intact;
-   technical strength with broken thesis.

Expected: price/P&L/technical facts alone cannot override thesis.

## 9. Required-return validation

Normal new capital hurdle: expected 5Y annualized total return \>=15%.

Approved exceptional 12% to \<15% route must satisfy every frozen
exception condition and retain explicit evidence/rationale. Missing one
required condition restores the normal hurdle.

Expected return \<12% cannot support normal new capital.

STRONG BUY normally requires \>=18% plus approved exceptional
asymmetry/MOS conditions.

Boundary oracle cases:

-   11.999%;
-   12.000%;
-   14.999%;
-   15.000%;
-   17.999%;
-   18.000%;
-   missing expected return;
-   LOW valuation confidence;
-   downside-dominated forecast.

M7 must verify exact inclusivity against the frozen baseline.

## 10. Valuation-only exit and switching hurdle

A good owned business is not sold merely because it became less cheap.

For valuation-only SELL/REDUCE:

-   residual ownership economics must be evaluated;
-   friction/tax must be considered where applicable;
-   switching requires a sufficiently superior destination under the
    approved switching hurdle;
-   cash is a valid destination when zero ownership is robustly superior
    after friction;
-   stale/missing comparator cannot authorize a switch;
-   valuation-only SELL cannot be inferred from +20% gain.

Broken thesis/risk exit does not require finding a replacement
investment.

## 11. Averaging-down firewall

AVERAGE DOWN is descriptive, never a reason.

Allowed only if:

-   owned;
-   thesis remains INTACT/IMPROVING;
-   no veto;
-   confidence sufficient;
-   forward economics/MOS are genuinely more attractive;
-   category gates pass;
-   concentration/portfolio limits pass;
-   opportunity cost supports the add.

Mandatory negative cases:

-   lower price only;
-   unrealized loss only;
-   desire to reach break-even;
-   monthly cash available;
-   thesis WEAKENING/BROKEN/PENDING;
-   valuation cheaper because fundamentals deteriorated proportionally
    or worse.

## 12. Economic state vs execution status

Validate independent axes.

A valid economic BUY/ACCUMULATE/STRONG BUY may have:

-   EXECUTE;
-   STAGED;
-   REQUIRES CASH ACCUMULATION;
-   TEMPORARILY DEFERRED;
-   BLOCKED --- PORTFOLIO/RISK;

only where approved semantics allow.

Examples:

-   insufficient cash for one board lot: economic BUY may remain BUY; no
    trade authorization.
-   board-lot clipping: cannot round upward beyond risk capacity.
-   trading halt on broken thesis: economic SELL remains SELL;
    executable quantity is unavailable/blocked.
-   technical WAIT: execution timing only; cannot turn BUY into HOLD or
    broken-thesis SELL into HOLD.
-   temporary deferral requires concrete risk, resume condition and
    expiry/review trigger.

## 13. Portfolio-integrity boundary

If portfolio state is materially unreconciled:

-   no fabricated executable quantity;
-   no fabricated cash/weight/concentration;
-   issuer analysis may continue;
-   positive portfolio-aware actionability is blocked;
-   an economically necessary SELL may remain SELL, while execution
    sizing is blocked if quantity truth is unavailable.

Cost-basis failure alone must not change intrinsic value or thesis.

## 14. Concentration and sizing boundary

Decision validation checks state semantics; detailed sizing is validated
later in M7.5.

Required decision-layer invariants:

-   risk-compliant capacity clips requested size before lot rounding;
-   lot rounding never exceeds capacity;
-   insufficient sub-lot capacity means no executable trade, not
    permission to exceed risk;
-   small-NAV exception requires approved evidence and never exceeds
    emergency ceiling;
-   sector/single-name constraints can block allocation without
    rewriting fundamental score;
-   affordability cannot upgrade merit.

## 15. PENDING, ESCALATED and provisional states

PENDING is not a positive capital state.

ESCALATED review must be visible and cannot masquerade as ordinary HOLD.

Where the approved model uses `Provisional HOLD`, validate that:

-   qualifier is explicit;
-   review status remains ESCALATED/PENDING;
-   no new capital is authorized;
-   unresolved condition and next review trigger are retained;
-   downstream UI/API cannot drop the qualifier and display only HOLD.

## 16. Legacy holdings

When a security leaves VN30:

-   no new capital;
-   ownership does not force immediate sale solely due to index exit
    unless approved policy says so;
-   residual thesis/risk/valuation determines HOLD/REDUCE/SELL;
-   re-entry into VN30 requires current eligibility before new capital;
-   legacy status must be effective-dated.

## 17. Opportunity-cost validation

Compare positive allocation with:

1.  HOLD CASH;
2.  eligible existing holdings;
3.  actionable VN30 alternatives;
4.  for switches, the source holding.

Required adversaries:

-   candidate affordable but materially inferior;
-   best candidate unaffordable this month;
-   cash has superior risk-adjusted value;
-   current holding has better marginal economics;
-   stale comparator;
-   comparator uses different methodology/as-of;
-   prior ownership receives artificial priority.

Expected: HOLD CASH is a valid outcome; monthly DCA need not be
deployed.

## 18. Anti-behavioral-shortcut cases

The following alone can never authorize the listed action:

  Shortcut               Forbidden inference
  ---------------------- ---------------------
  Low P/E                BUY
  Large price fall       BUY/ACCUMULATE
  +20% gain              REDUCE/SELL
  Unrealized loss        ACCUMULATE
  Break-even desire      HOLD/ADD
  Technical strength     BUY
  Technical weakness     SELL
  Top-10 rank            BUY
  Monthly DCA cash       BUY
  Affordable board lot   BUY
  Existing ownership     ACCUMULATE
  High score             BUY

Each becomes an explicit negative regression.

## 19. Golden decision matrix

M7 must independently calculate at least:

  -----------------------------------------------------------------------
  ID                      Scenario                Expected
  ----------------------- ----------------------- -----------------------
  DG-01                   unowned, all normal     BUY
                          gates pass              

  DG-02                   owned, all add gates    ACCUMULATE
                          pass                    

  DG-03                   exceptional unowned,    STRONG BUY
                          strong gates pass       

  DG-04                   owned, thesis intact,   HOLD
                          no add merit            

  DG-05                   owned, residual thesis  REDUCE
                          but reduction reason    

  DG-06                   owned, BROKEN thesis    SELL

  DG-07                   unowned, no positive    AVOID
                          merit                   

  DG-08                   high score + hard veto  AVOID/no new capital

  DG-09                   owned high score +      SELL
                          broken thesis           

  DG-10                   LOW confidence +        no new capital
                          attractive valuation    

  DG-11                   PENDING thesis          no new capital;
                                                  provisional review

  DG-12                   PASS WITH CONDITIONS    BUY only if all
                          unowned narrow          exception rules pass
                          exception               

  DG-13                   PASS WITH CONDITIONS    no ACCUMULATE
                          owned add               

  DG-14                   legacy owned, thesis    HOLD/no new capital
                          intact                  

  DG-15                   BUY merit but cash \<   BUY + REQUIRES CASH
                          board lot               ACCUMULATION

  DG-16                   broken thesis + trading SELL + execution
                          halt                    BLOCKED

  DG-17                   +20% gain, thesis       not auto SELL
                          intact, return          
                          attractive              

  DG-18                   -30% price, thesis      SELL, not average down
                          broken                  

  DG-19                   valuation-only exit     no switch authorization
                          with stale switch       
                          comparator              

  DG-20                   cash robustly superior  valuation-only SELL may
                          after friction          be valid under approved
                                                  rules
  -----------------------------------------------------------------------

## 20. Metamorphic tests

**DM-01 Score increase under active hard veto:** state cannot become
positive capital.

**DM-02 Price decline only:** cannot create ACCUMULATE.

**DM-03 Investor cost-basis mutation:** cannot change
intrinsic-value/thesis decision.

**DM-04 Technical overlay mutation:** may change execution timing, not
fundamental state.

**DM-05 Cash mutation:** insufficient cash changes execution, not
economic merit.

**DM-06 Ownership mutation:** same positive economics maps UNOWNED→BUY
and OWNED→ACCUMULATE, absent STRONG BUY exception.

**DM-07 Future evidence injection:** AS-KNOWN decision
unchanged/rejected.

**DM-08 Portfolio-integrity degradation:** executable
sizing/actionability blocks; issuer thesis remains unchanged.

**DM-09 Comparator staleness:** cannot improve switch eligibility.

**DM-10 Gain/loss mutation:** changing only portfolio P&L cannot cause
BUY/SELL.

## 21. Mutation tests

Validation suite should kill mutations that:

-   map score \>= threshold directly to BUY;
-   permit LOW-confidence new capital;
-   ignore hard veto;
-   permit BROKEN averaging down;
-   convert PENDING to ordinary HOLD;
-   map owned BUY instead of ACCUMULATE;
-   map unowned HOLD instead of AVOID;
-   make +20% an automatic SELL;
-   make price decline an automatic ADD;
-   let technical WAIT rewrite economic state;
-   round board lot above risk capacity;
-   use unsettled cash;
-   accept stale switch comparator;
-   allow client-supplied final state;
-   allow future evidence;
-   allow undocumented methodology identity.

## 22. Audit/reconstruction requirements

Every formal decision artifact must retain enough lineage to reproduce:

-   decision ID/prior decision/revision reason;
-   security/ownership/membership;
-   as-of/calculated-at;
-   scorecard ID/methodology;
-   portfolio snapshot/watermark;
-   thesis and break conditions;
-   valuation/expected return;
-   risk/veto;
-   opportunity-cost evidence;
-   economic state;
-   qualifier/review status;
-   execution status;
-   requested/risk-compliant/lot-executable size where applicable;
-   evidence refs;
-   methodology/governance identity.

Client/UI supplied final states or authority fields must be rejected.

## 23. Gate 5 PASS/FAIL

### PASS requires

-   all seven states reachable only under approved semantics;
-   ownership mapping correct;
-   precedence correct;
-   hard veto/Stage0/thesis/category/return gates correct;
-   PENDING/ESCALATED cannot masquerade as normal positive state;
-   valuation-only switching hurdle correct;
-   averaging-down firewall correct;
-   economic state separated from execution;
-   legacy handling correct;
-   HOLD CASH preserved;
-   anti-shortcut cases pass;
-   future evidence rejected;
-   artifact reconstructable;
-   independent golden matrix matches Actual;
-   required mutations detected;
-   zero unresolved Critical/Major defects.

### FAIL if

-   materially wrong BUY/SELL can be produced;
-   veto can be overridden by score/price/technical;
-   broken thesis can receive new capital;
-   LOW confidence can receive normal new capital;
-   ownership semantics are violated;
-   PENDING becomes ordinary actionable HOLD/BUY;
-   valuation-only SELL bypasses switching requirements;
-   execution constraint changes business merit;
-   future information changes historical decision;
-   decision cannot be reconstructed;
-   client can inject final authority;
-   undocumented methodology can authorize capital.

## 24. Current source-review findings

**DE-F01 --- Approved M4 decision baseline is explicit.**
`DECISION_ENGINE.md` and `BUY_RULES.md` carry Approved Baseline v1.0 and
encode the intended precedence/state separation.

**DE-F02 --- Existing M6 tests cover many critical anti-shortcuts.**
They include future-evidence rejection, client-state rejection,
conditional Stage0, broken-thesis SELL, LOW-confidence/new-capital
controls, legacy no-add, cash switching and execution clipping. These
remain supporting evidence only.

**DE-F03 --- Historical M6.5.2 test preserves a reviewed 32%--37%
concentration defect for replay.** This historical artifact must never
be mistaken for current formal issuance correctness. M7.5 must
independently validate current concentration behavior and remediation
lineage.

**DE-F04 --- Economic state/execution separation is material.** Existing
implementation intentionally allows economic BUY with insufficient lot
cash and SELL with blocked execution. M7 oracle must verify each
permitted pairing against approved M4, not infer that `BLOCKED` means
HOLD/AVOID.

**DE-F05 --- Required-return exception is implementation-sensitive.**
Existing tests show the 12--15% exception depends on a complete
condition set. M7 must independently test all boundaries and ensure
missing one condition restores the normal 15% hurdle.

## 25. Multi-role review

-   **CIO --- PASS:** economic merit, ownership and opportunity cost
    remain distinct.
-   **Portfolio Manager --- PASS:** HOLD CASH, switching and execution
    constraints are preserved.
-   **Equity Research Analyst --- PASS:** thesis/valuation cannot be
    replaced by price or score shortcuts.
-   **Independent Model Validator --- PASS:** golden truth table,
    metamorphic and mutation cases can falsify precedence.
-   **Risk Manager --- PASS:** veto, confidence, drawdown/concentration
    interfaces remain superior to score.
-   **Behavioral Finance Reviewer --- PASS:** averaging-down,
    break-even, FOMO and premature-profit-taking shortcuts are explicit
    negatives.
-   **QA Lead --- PASS:** state reachability, boundaries, pairwise
    conflicts and authority-injection paths are covered.

**Critical unresolved in this validation specification: 0.**\
**Major unresolved in this validation specification: 0.**

Gate 5 is **not yet declared PASS**. Formal execution against a frozen
M7 build with independent Expected-vs-Actual evidence is required.

## 26. Approval Gate

**Document state:** `BASELINE CANDIDATE — READY FOR USER APPROVAL`

On explicit approval:

1.  promote `DECISION_ENGINE_VALIDATION.md` to **Approved Baseline
    v1.0**;
2.  proceed only to `07_VALIDATION/PORTFOLIO_DCA_VALIDATION.md`;
3.  do not begin `RISK_VALIDATION.md` early;
4.  do not begin historical validation.
