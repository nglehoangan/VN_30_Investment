# VN30 Value Investing OS --- Traceability Matrix

**Document:** `07_VALIDATION/TRACEABILITY_MATRIX.md`\
**Milestone:** M7.1 --- Baseline Integrity Audit\
**Status:** Baseline Candidate --- Awaiting User Approval\
**Version:** 0.1\
**Date:** 2026-10-04\
**Parent:** `07_VALIDATION/VALIDATION_STRATEGY.md` --- Approved Baseline
v1.0

------------------------------------------------------------------------

## 1. Purpose

This document establishes bidirectional traceability between the
approved investment-system baseline (M1--M5), the executable
implementation delivered in M6, and validation evidence.

The matrix is deliberately **falsification-first**. Its purpose is not
to prove that M6 is correct because M6 tests passed. It asks whether
every material executable investment behavior can be traced to an
approved rule, and whether every material approved rule has an
identifiable implementation and test/evidence path.

A traceability row may therefore fail even when the implementation is
internally consistent.

This document does **not** silently amend M1--M6. Any ambiguity,
conflict, missing implementation, or undocumented investment behavior is
a validation finding/change proposal.

------------------------------------------------------------------------

## 2. Source-of-Truth and Baseline Freeze Rules

### 2.1 Governance precedence

For investment logic, authority follows the approved ownership
hierarchy:

1.  Investment Policy / mandate.
2.  Risk Policy and hard vetoes.
3.  Approved concept-owning M1--M4 documents.
4.  M5 orchestration/workflow.
5.  M6 architecture and executable implementation.
6.  UI, templates, reports, and prior test evidence.

Code is **not** automatically correct when it conflicts with an approved
rule.

### 2.2 Baseline identity

M7 must freeze a machine-verifiable baseline manifest before
deterministic release-gate testing. Each material source shall record,
where available:

-   repository path;
-   document/version identity;
-   approval/governance evidence;
-   Git/blob SHA or equivalent content hash;
-   implementation owner;
-   relevant test/evidence owner.

A document header alone is not sufficient proof of approval where
repository metadata and governance history disagree.

Observed example: some approved historical artifacts retain
stale/draft-like metadata while later approved artifacts and M6
governance records identify them as approved. M7 must preserve content
identity and resolve approval identity explicitly rather than choosing
whichever label is convenient.

### 2.3 Implementation evidence status

M6 reports and test logs are **prior evidence**, not independent M7
proof. They may identify implementation owners and historical
remediation, but M7 deterministic validation must recreate independent
expected results where required.

------------------------------------------------------------------------

## 3. Status Vocabulary

  -----------------------------------------------------------------------
  Status                              Meaning
  ----------------------------------- -----------------------------------
  **PASS**                            Approved requirement has a mapped
                                      implementation and adequate
                                      existing evidence path; no material
                                      divergence identified by this M7.1
                                      audit.

  **PARTIAL**                         Some behavior is
                                      implemented/evidenced, but scope,
                                      evidence, or requirement coverage
                                      is incomplete.

  **FAIL**                            Material conflict, incorrect
                                      implementation, or unapproved
                                      behavior is identified.

  **NOT IMPLEMENTED**                 Approved requirement has no
                                      executable implementation where
                                      implementation is required.

  **NOT APPLICABLE**                  Requirement is intentionally
                                      outside executable scope or is
                                      documentation/governance-only for
                                      the mapped component.
  -----------------------------------------------------------------------

`PASS` here means **traceability pass**, not final correctness
certification. Accounting, scoring, decisions, DCA/risk, and historical
correctness remain subject to M7.2--M7.6.

------------------------------------------------------------------------

## 4. Baseline Inventory

### 4.1 M1 --- Investment Constitution

  -------------------------------------------------------------------------------
  Baseline                       Repository identity     Traceability role
                                 observed                
  ------------------------------ ----------------------- ------------------------
  `INVESTMENT_POLICY.md`         Approved Constitution   Highest
                                 Baseline v1.1           investment-policy
                                                         authority

  `DECISION_FRAMEWORK_v1.0.md`   Approved baseline       Canonical decision
                                                         sequence/state semantics

  `RISK_POLICY_v1.0.md`          Approved Constitution   Risk vetoes, limits,
                                 Baseline v1.0           escalation, hurdle
                                                         ownership

  `SCORING_MODEL_v1.0.md`        Approved Constitution   100-point architecture
                                 Baseline v1.0           and score gates

  `SYSTEM_PROMPT_v1.0.md`        Approved baseline       AI operating guidance;
                                                         must not override owning
                                                         rules

  `README` / governance docs     Approved project        Navigation/governance,
                                 documentation           not investment-rule
                                                         owner
  -------------------------------------------------------------------------------

### 4.2 M2 --- Portfolio Data Model & Database

Material approved baseline set:

`DATA_MODEL.md`, `PORTFOLIO.md`, `TRANSACTIONS.md`, `VN30_MASTER.md`,
`SECTOR_MASTER.md`, `BENCHMARK.md`, `DATA_RULES.md`.

These own accounting/data definitions, effective-dated reference rules,
portfolio truth, transaction semantics, benchmark/reference semantics,
and data-quality rules.

### 4.3 M3 --- VN30 Scoring Engine

Material approved baseline set:

`SCORING_ENGINE.md`, `METRIC_DEFINITIONS.md`, `SECTOR_NORMALIZATION.md`,
`SCORECARD_TEMPLATE.md`, `RANKING_RULES_v1.0.md`,
`VALIDATION_CASES_v1.0.md`.

Repository history contains version-label inconsistencies in some M3
headers; M6.4 explicitly preserved content identity rather than silently
selecting a different methodology.

### 4.4 M4 --- Buy / Hold / Sell Decision Engine

Approved baseline set:

`DECISION_ENGINE.md`, `BUY_RULES.md`, `SELL_RULES.md`, `DCA_RULES.md`,
`POSITION_SIZING.md`, `OPPORTUNITY_COST.md`, `DECISION_TEMPLATE.md`,
`VALIDATION_CASES.md`, plus approved M4 final review.

### 4.5 M5 --- Portfolio Management Workflow

Approved baseline set includes:

`OPERATING_MODEL.md`, `WEEKLY_REVIEW.md`, `MONTHLY_DCA_REVIEW_v1.0.md`,
`QUARTERLY_REVIEW_v1.0.md`, `ANNUAL_REVIEW_v1.0.md`,
`EVENT_DRIVEN_REVIEW_v1.0.md`, `PORTFOLIO_RISK_REVIEW_v1.0.md`,
`PERFORMANCE_REVIEW_v1.0.md`, `VN30_RECONSTITUTION_v1.0.md`,
`INVESTMENT_JOURNAL_v1.0.md`, `BEHAVIORAL_REVIEW_v1.0.md`,
`REVIEW_TEMPLATES_v1.0.md`, `VALIDATION_CASES_v1.0.md`.

### 4.6 M6 --- Executable implementation

Primary implementation ownership observed:

-   M6.3 --- portfolio ledger, accounting, valuation, reconciliation,
    effective references.
-   M6.4 --- scoring/ranking methodology and artifacts.
-   M6.5 / M6.5.x --- decision engine, risk/decision governance,
    marginal allocation.
-   M6.6 / M6.6.1 --- DCA and portfolio workflow, marginal-allocation
    remediation.
-   M6.7 --- dashboard/current presentation.
-   M6.8 --- cross-layer integration, authority audit,
    replay/backup/restore, final integration validation.

M6.8 reports 0 unresolved Critical/Major product findings in its bounded
implementation scope, while explicitly stating that real-data
operational acceptance remains blocked/not validated. M7 does not
convert that report into independent certification.

------------------------------------------------------------------------

# 5. Core Traceability Matrix

## 5.1 Mandate and Investment Policy

  --------------------------------------------------------------------------------------------------------------------------------------------
  ID         Requirement /     Source           Implementation owner            Existing test/evidence  Status     M7 note
             intended rule                                                      path                               
  ---------- ----------------- ---------------- ------------------------------- ----------------------- ---------- ---------------------------
  IP-01      New capital only  Investment       effective references +          M6.3 reference tests;   PASS       Re-test membership as-of
             to current VN30   Policy §3        scoring/decision eligibility    M6.5 decision tests                boundaries in M7.3/M7.4.
             constituents                                                                                          

  IP-02      Removed           Investment       reference/eligibility +         decision negative gates PASS       Historical reconstitution
             constituent       Policy §3.2      decision gates                                                     workflow still needs
             becomes Legacy                                                                                        dedicated M7 evidence.
             Holding; no new                                                                                       
             capital                                                                                               

  IP-03      Cash is           Investment       opportunity-cost/DCA/workflow   DCA/workflow tests;     PASS       HOLD CASH must be
             preferable to     Policy §3.3                                      M6.8 authority audit               independently
             unattractive                                                                                          scenario-tested.
             investment                                                                                            

  IP-04      Value ≠ low       Investment       scoring + decision composition  scoring/decision suites PASS       Metamorphic/anti-shortcut
             multiple; no      Policy §4                                                                           tests required in
             single-metric                                                                                         M7.3--M7.4.
             decision                                                                                              

  IP-05      Stage 0 precedes  Investment       decision domain                 M6.5 decision suite     PASS       Precedence to be
             positive          Policy §4.2;                                                                        independently tested.
             allocation        Decision                                                                            
                               Framework                                                                           

  IP-06      Canonical         Investment       decision artifact/workflow      M6.5/M6.6 artifact      PARTIAL    Execution captures
             analysis sequence Policy §4.2                                      tests                              gates/artifacts, but M7
             preserved                                                                                             must verify full semantic
                                                                                                                   sequence, not merely
                                                                                                                   fields.

  IP-07      Price, quality,   Investment       scoring/decision contracts      scoring/decision tests  PASS       Metamorphic tests will
             intrinsic value,  Policy §4.3                                                                         verify non-coupling.
             thesis remain                                                                                         
             separate                                                                                              

  IP-08      No                Investment       cash-constrained                portfolio +             PASS       M7.2/M7.5 must
             margin/leverage   Policy; Risk     execution/portfolio engine      decision/DCA tests                 independently prove no
                               Policy §4                                                                           negative financing path.

  IP-09      100-share board   Investment       decision sizing/marginal        M6.5/M6.6.1 tests       PASS       Explicit Top-1-unaffordable
             lot affects       Policy/M4 sizing allocation                                                         scenarios required.
             execution, not                                                                                        
             merit                                                                                                 

  IP-10      Monthly           Investment       workflow/DCA                    M6.6/M6.8               PASS       HOLD CASH is required
             contribution does Policy/M4 DCA/M5                                                                    positive outcome.
             not force                                                                                             
             investment                                                                                            

  IP-11      +20% profit       Investment       decision/workflow               decision anti-shortcut  PASS       Required M7.4 scenario.
             triggers review,  Policy/M4 Sell                                   tests                              
             not automatic                                                                                         
             sell                                                                                                  

  IP-12      Price decline     Investment       decision/DCA                    decision + DCA tests    PASS       Thesis intact vs broken
             alone does not    Policy/Risk/M4                                                                      pair required.
             justify averaging Buy/DCA                                                                             
             down                                                                                                  

  IP-13      15--20% CAGR is   Investment       governance/risk precedence      authority tests/reports PASS       Historical results may not
             objective, not    Policy §2                                                                           tune baseline.
             rule to increase                                                                                      
             risk                                                                                                  

  IP-14      No automatic      Investment       workflow → proposal → explicit  M6.8                    PASS       Any auto-post path would be
             trading           Policy/M6 scope  execution boundary              no-ledger-side-effect              Critical.
                                                                                tests                              
  --------------------------------------------------------------------------------------------------------------------------------------------

## 5.2 Risk Policy

  -------------------------------------------------------------------------------------------------------------------------------------
  ID         Requirement                 Source        Implementation owner       Existing evidence    Status     M7 note
  ---------- --------------------------- ------------- -------------------------- -------------------- ---------- ---------------------
  RP-01      Hard veto overrides         Risk Policy   decision engine            decision precedence  PASS       Independent
             score/valuation             §3                                       tests                           adversarial
                                                                                                                  high-score/veto test
                                                                                                                  required.

  RP-02      Risk precedence is          Risk Policy   decision/portfolio context M6.5 tests           PASS       Boundary/precedence
             deterministic               §3.2                                                                     matrix required.

  RP-03      No borrowing when lot       Risk Policy   execution feasibility      portfolio/DCA tests  PASS       Re-test exact cash
             unaffordable                §4                                                                       boundary.

  RP-04      Drawdown is cash-flow       Risk Policy   portfolio/performance read M6                   PARTIAL    M7.2/M7.5 must
             adjusted                    §5.2          models                     accounting/current              independently verify
                                                                                  implementation                  flow-adjusted
                                                                                                                  drawdown; trace
                                                                                                                  evidence is not yet
                                                                                                                  sufficient for final
                                                                                                                  PASS.

  RP-05      Contributions/withdrawals   Risk Policy   portfolio accounting       M6.3 opening/current PASS       Golden fixture manual
             are capital flows, not P&L  §5.2; M2                                 NAV and economic P&L            calculation
                                                                                  tests                           mandatory.

  RP-06      Single-name concentration   Risk Policy + decision portfolio context decision portfolio   PASS       Boundary tests around
             bands/ceilings              M4 sizing                                tests                           each operative limit
                                                                                                                  required.

  RP-07      Sector concentration        Risk Policy + decision sector context    decision sector      PASS       Include sector
             bands/ceilings              M4 sizing                                tests                           headroom +
                                                                                                                  hidden-correlation
                                                                                                                  limitation.

  RP-08      Small-NAV exception is      Risk          sizing/authorization       decision tests       PASS       Must prove exception
             explicit and bounded        Policy/M4                                                                cannot become default
                                         sizing                                                                   target.

  RP-09      Thesis-broken position      Risk          decision/DCA               negative decision    PASS       Critical scenario in
             cannot receive new capital  Policy/M4                                tests                           M7.4/M7.5.

  RP-10      LOW confidence blocks       M1/M4         decision engine            decision tests       PASS       High score + LOW
             normal new capital                                                                                   confidence required.

  RP-11      Stale/insufficient data     Risk          scoring/decision/current   M6.4--M6.8 tests     PASS       M7 data freshness and
             fails safely                Policy/Data                                                              temporal tests
                                         Rules                                                                    required.

  RP-12      Portfolio drawdown          Risk Policy   workflow/decision          workflow tests       PARTIAL    Requires explicit
             escalation does not         §5                                                                       independent scenario
             mechanically stop-loss                                                                               evidence in M7.5.
             sound holdings                                                                                       
  -------------------------------------------------------------------------------------------------------------------------------------

## 5.3 Accounting and Data Rules

  ------------------------------------------------------------------------------------------------------------------------------------------------------
  ID         Requirement                        Source              Implementation               Existing evidence    Status     M7 note
  ---------- ---------------------------------- ------------------- ---------------------------- -------------------- ---------- -----------------------
  AD-01      Immutable transaction ledger       M2                  `portfolio-ledger` +         M6.3 tests           PASS       M7.2 independent
                                                Transactions/Data   transaction domain                                           fixture/replay.
                                                Model                                                                            

  AD-02      Derived cash/holdings, not         M2                  reconstruction/ledger        M6.3                 PASS       Reconciliation must not
             editable balances                                                                                                   silently repair.

  AD-03      Deterministic cost basis / MWAC    M2                  reconstruction/values        M6.3                 PASS       Manual Expected vs
                                                                                                                                 Actual required.

  AD-04      Realized P&L deterministic         M2                  reconstruction               M6.3                 PASS       Partial/full sell
                                                                                                                                 fixture required.

  AD-05      Unrealized P&L from current        M2                  valuation/read model         M6.3                 PASS       Independent calculation
             valuation vs open cost                                                                                              required.

  AD-06      Dividend/withholding semantics     M2                  ledger/reconstruction        M6.3                 PASS       M7.2 fixture.
             preserved                                                                                                           

  AD-07      Fees/taxes handled without double  M2                  transaction/reconstruction   M6.3                 PASS       Exact tolerance must be
             count                                                                                                               declared.

  AD-08      NAV = economic portfolio value;    M2/Risk             valuation                    M6.3 M03 remediation PASS       Golden fixture must
             cost basis not NAV                                                                                                  explicitly prove.

  AD-09      Contributions increase capital/NAV M2/Risk             inception/valuation          M6.3                 PASS       Release-critical M7.2
             but not investment profit                                                                                           invariant.

  AD-10      Historical reconstruction          M2                  reconstruct                  M6.3                 PASS       M7 independent replay.
             deterministic                                                                       permutation/cutoff              
                                                                                                 tests                           

  AD-11      Effective-dated                    M2                  reference resolver           M6.3                 PASS       PIT boundary tests
             VN30/sector/reference resolution                                                                                    required.

  AD-12      Missing/stale/future/conflicting   Data Rules          validation/read models       M6.3/M6.8            PASS       Data validation owns
             inputs fail safely                                                                                                  final certification.

  AD-13      Production data not silently       Data Rules          reconciliation               M6.3                 PASS       Any
             repaired                                                                                                            mutation-on-reconcile
                                                                                                                                 is Critical.

  AD-14      Reversal/correction preserves      M2                  ledger/reconstruct           M6.3                 PASS       M7.2 edge case.
             history                                                                                                             

  AD-15      Exact monetary arithmetic; no      M2/M6 architecture  decimal-string/BigInt        numeric tests        PASS       Independent
             binary-float money path                                                                                             tolerance/rounding
                                                                                                                                 review required.

  AD-16      Benchmark data has correct as-of   M2 Benchmark        current/reference layer      bounded              PARTIAL    Historical benchmark
             identity                                                                            implementation                  correctness deferred to
                                                                                                                                 M7.6; live completeness
                                                                                                                                 not established here.
  ------------------------------------------------------------------------------------------------------------------------------------------------------

## 5.4 Scoring and Ranking

  ------------------------------------------------------------------------------------------------------------------------------------------
  ID         Requirement                  Source          Implementation          Existing evidence      Status     M7 note
  ---------- ---------------------------- --------------- ----------------------- ---------------------- ---------- ------------------------
  SC-01      100-point seven-category     M1 Scoring      scoring                 scoring golden/unit    PASS       Recalculate
             architecture                 Model           domain/methodology      tests                             independently.

  SC-02      Category weights sum to      M1/M3           scoring methodology     scoring tests          PASS       Boundary exactness
             approved total                                                                                         required.

  SC-03      Category gates prevent       M1/M3           eligibility/scorecard   scoring + decision     PASS       High total / failed
             compensating critical                                                tests                             category adversarial
             weakness                                                                                               case.

  SC-04      Sector-equivalent economics, M3              sector methodology      scoring sector tests   PASS       Representative sector
             not naive accounting         normalization                                                             cases required.
             comparison                                                                                             

  SC-05      Bank leverage treated        M3              sector methodology      scoring tests          PASS       M7 representative bank
             structurally appropriately                                                                             case.

  SC-06      Cyclicals use normalized     M3              metric/sector           scoring validation     PARTIAL    Must prove with
             economics / avoid peak-cycle                 methodology                                               independent peak-cycle
             inflation                                                                                              case.

  SC-07      Missing data handled by      M3              evidence/validation     scoring tests          PASS       Missing ≠ automatically
             approved validity/confidence                                                                           poor unless baseline
             rules                                                                                                  says so.

  SC-08      Confidence HIGH/MEDIUM/LOW   M3              scorecard/evidence      scoring tests          PASS       Downstream
             preserved                                                                                              low-confidence behavior
                                                                                                                    tested in M7.4.

  SC-09      Score validity/actionability M3              scoring                 tests                  PASS       Required for safe
             separated from numeric score                 validation/contracts                                      downstream use.

  SC-10      Ranking separate from        M3 Ranking      ranking domain          ranking/scoring tests  PASS       Top 10 cannot bypass
             fundamental score            Rules                                                                     gates.

  SC-11      Top 10 is research           M3/M4           ranking + opportunity   M6.5/M6.8              PASS       DCA scenarios required.
             prioritization, not                          cost                                                      
             mandatory allocation                                                                                   

  SC-12      Market/technical/portfolio   M1/M3           scoring boundaries      architecture/scoring   PASS       Metamorphic price/cash
             inputs do not contaminate                                            tests                             tests required.
             fundamental score                                                                                      

  SC-13      Score artifact preserves     M3/M6.1         analytical              integration tests      PASS       Audit reconstruction
             evidence/methodology lineage                 artifacts/methodology                                     required.
                                                          registry                                                  

  SC-14      Threshold behavior follows   M3              scoring/decision        unit tests             PARTIAL    M7.3 must enumerate
             baseline exactly                                                                                       actual thresholds and
                                                                                                                    test
                                                                                                                    ε-below/exact/ε-above.
  ------------------------------------------------------------------------------------------------------------------------------------------

## 5.5 Decision Engine / Buy / Sell

  ---------------------------------------------------------------------------------------------------------------------------------------------------
  ID         Requirement                                 Source       Implementation         Existing         Status     M7 note
                                                                                             evidence                    
  ---------- ------------------------------------------- ------------ ---------------------- ---------------- ---------- ----------------------------
  DE-01      Exactly approved final states: STRONG       M1/M4        decision               M6.5 all-state   PASS       Positive/negative/boundary
             BUY/BUY/ACCUMULATE/HOLD/REDUCE/SELL/AVOID                contracts/domain       tests                       per state required.

  DE-02      BUY vs ACCUMULATE ownership semantics       M4           decision engine        M6.5             PASS       Ownership boundary test.

  DE-03      AVOID applies to unowned non-investable     M4           decision engine        M6.5             PASS       Existing holding must map
             candidate                                                                                                   through hold/reduce/sell
                                                                                                                         logic.

  DE-04      Score alone cannot create BUY               M1/M4        decision engine        M6.5             PASS       High score + extreme
                                                                                             anti-shortcuts              valuation mandatory.

  DE-05      Valuation/forward-return hurdle required    Risk/M4      decision engine        M6.5             PASS       Actual threshold sourced
                                                                                                                         from baseline, not example.

  DE-06      Thesis broken blocks averaging down         M4           decision/DCA           M6.5/M6.6        PASS       Mandatory pair test.

  DE-07      +20% profit is review trigger only          M4 Sell      decision/workflow      M6.5             PASS       Mandatory scenario.

  DE-08      Valuation-only SELL respects switching      M4           decision/opportunity   M6.5             PASS       Independent reallocation
             hurdle                                                   cost                                               case required.

  DE-09      PENDING/ESCALATED/review status cannot      M4           decision               M6.5/M6.6        PASS       Fail-closed test required.
             masquerade as positive capital state                     validation/workflow                                

  DE-10      Technical WAIT cannot override fundamental  M4           decision execution     M6.5             PASS       Execution sub-status must
             ownership decision                                       separation                                         remain separate.

  DE-11      Economic target separate from executable    M4 sizing    decision/marginal      M6.5/M6.6.1      PASS       Lot/cash constraints cannot
             trade size                                                                                                  rewrite merit.

  DE-12      Insufficient cash cannot create invalid BUY Risk/M4      marginal/workflow      M6.6.1/M6.8      PASS       Required M7.4 case.
             execution                                                                                                   

  DE-13      Decision artifact is immutable/auditable    M4/M6        decision artifacts     integration      PASS       Reconstruct one full
             with methodology lineage                                                        tests                       decision in M7.4.

  DE-14      Undocumented implementation rule cannot     M1--M4       authority/resolver     M6.8 authority   PASS       M7 trace scan must continue;
             authorize capital                           governance   boundaries             audit                       any discovered authorization
                                                                                                                         shortcut = Critical/Major.
  ---------------------------------------------------------------------------------------------------------------------------------------------------

## 5.6 DCA, Position Sizing, Opportunity Cost

  --------------------------------------------------------------------------------------------------------------------
  ID         Requirement     Source        Implementation       Existing        Status     M7 note
                                                                evidence                   
  ---------- --------------- ------------- -------------------- --------------- ---------- ---------------------------
  DC-01      DCA             M4 DCA/M5     workflow             M6.6            PASS       Case F/no opportunity.
             contribution is                                                               
             funding event,                                                                
             not buy signal                                                                

  DC-02      Unused cash     M4            portfolio/workflow   M6.6            PASS       Multi-month case required.
             carries forward                                                               

  DC-03      No forced       M4/M5         workflow             M6.6/M6.8       PASS       HOLD CASH must be explicit.
             deployment                                                                    

  DC-04      Compare new     Opportunity   marginal allocation  M6.5.x/M6.6.1   PASS       Case H required.
             position,       Cost                                                          
             existing add,                                                                 
             and cash                                                                      

  DC-05      Existing        Opportunity   marginal             tests           PASS       Compare existing vs new.
             ownership       Cost                                                          
             creates no                                                                    
             automatic                                                                     
             priority                                                                      

  DC-06      Affordability   Opportunity   marginal             M6.6.1          PASS       Top1 unaffordable / Top2
             does not        Cost                                                          affordable case.
             improve                                                                       
             economic                                                                      
             ranking                                                                       

  DC-07      Board lot       Position      marginal             M6.5/M6.6.1     PASS       Metamorphic lot/cash test.
             affects         Sizing                                                        
             execution only                                                                

  DC-08      Position        Risk/Sizing   decision portfolio   tests           PASS       Boundary case required.
             concentration                 context                                         
             clips/blocks                                                                  
             add                                                                           

  DC-09      Sector          Risk/Sizing   decision sector      tests           PASS       Boundary case required.
             concentration                 context                                         
             clips/blocks                                                                  
             add                                                                           

  DC-10      Small-NAV       Risk/Sizing   decision/marginal    tests           PASS       No silent exception.
             exception                                                                     
             requires                                                                      
             explicit                                                                      
             authorization                                                                 

  DC-11      Switching uses  Opportunity   marginal             M6.5.x          PASS       Independent switching case.
             higher hurdle   Cost                                                          
             than                                                                          
             incremental                                                                   
             cash                                                                          

  DC-12      Cash is         Opportunity   marginal/workflow    M6.6/M6.8       PASS       No-attractive-opportunity
             explicit        Cost                                                          case.
             comparator                                                                    

  DC-13      Sequential      M4/M6.6.1     marginal             M6.8 formal     PASS       Historical M6.6 blocker
             multi-lot       governance    artifacts/workflow   two-lot tests              retained as prior failure;
             marginal                                                                      current remediation must be
             allocation                                                                    independently retested.
             follows                                                                       
             approved                                                                      
             remediation                                                                   
  --------------------------------------------------------------------------------------------------------------------

## 5.7 Portfolio Workflow and Behavioral Controls

  ------------------------------------------------------------------------------------------------------------------------------
  ID         Requirement                    Source       Implementation           Existing         Status     M7 note
                                                                                  evidence                    
  ---------- ------------------------------ ------------ ------------------------ ---------------- ---------- ------------------
  WF-01      Weekly surveillance, not       M5           workflow engine          workflow tests   PASS       Scheduled review
             forced trading                                                                                   must permit NO
                                                                                                              ACTION.

  WF-02      Monthly review is              M5           workflow/DCA             M6.6             PASS       Monthly DCA cases
             capital-allocation layer                                                                         required.

  WF-03      Quarterly deep fundamental     M5           workflow reviews         workflow         PASS       Verify
             review                                                               tests/UI                    trigger/output
                                                                                                              semantics.

  WF-04      Annual strategic               M5           workflow reviews         M6.7/M6.8        PASS       No automatic
             learning/governance                                                                              baseline mutation
                                                                                                              allowed.

  WF-05      Event-driven review overrides  M5           workflow                 tests            PASS       Event precedence
             cadence for material trigger                                                                     case required.

  WF-06      Workflow calls owning rule;    M5 §3        architecture/authority   M6.8 authority   PASS       Any duplicate
             does not redefine it                        boundaries               audit                       investment formula
                                                                                                              is a divergence.

  WF-07      Methodology/baseline identity  M5 §3.3      methodology              integration      PASS       M7 audit
             recorded                                    registry/artifacts       tests                       reconstruction
                                                                                                              required.

  WF-08      Conflict causes                M5 §3.2      validation/governance    fail-closed      PARTIAL    M7 needs explicit
             stop/escalation, not invented                                        paths                       conflicting-rule
             compromise                                                                                       fixture.

  WF-09      Investment journal/audit       M5           workflow/decision        M6.7/M6.8        PASS       Paper portfolio
             record preserved                            artifacts/UI                                         immutability later
                                                                                                              in M7.7.

  WF-10      Behavioral review detects      M5           workflow/UI evidence     bounded workflow PARTIAL    Detection/review
             action bias/FOMO/loss          Behavioral                            implementation              workflow trace
             aversion/anchoring/premature   Review                                                            exists, but
             profit-taking                                                                                    effectiveness
                                                                                                              cannot be
                                                                                                              certified by
                                                                                                              implementation
                                                                                                              tests alone.

  WF-11      Review occurrence alone never  M5           workflow →               M6.8             PASS       Auto-trade path
             creates trade                               proposal/execution                                   forbidden.
                                                         separation                                           
  ------------------------------------------------------------------------------------------------------------------------------

------------------------------------------------------------------------

# 6. Bidirectional Orphan Analysis

## 6.1 Approved-rule → implementation orphans

No confirmed **Critical/Major** approved investment rule is currently
identified as wholly absent from M6 within the bounded implemented
scope.

The following are **PARTIAL** and require later M7 evidence before
release:

1.  cash-flow-adjusted drawdown correctness;
2.  full semantic enforcement of canonical analysis sequence;
3.  cyclical peak normalization behavior;
4.  exact threshold boundary coverage;
5.  workflow rule-conflict fixture;
6.  behavioral-control effectiveness;
7.  historical benchmark/PIT correctness.

These are validation gaps, not silent approvals.

## 6.2 Implementation → approved-rule orphans

M6.8's authority audit states that M6.3 owns accounting, M6.4
score/rank, M6.5 decision/risk/marginal authorization, M6.6
workflow/proposal/HOLD CASH, and M6.7 current/presentation behavior. No
new investment formula was reported in M6.8 integration.

M7.1 therefore identifies **no confirmed undocumented executable
investment rule** at this stage.

This conclusion is provisional until source-level trace scanning is
completed for all material authorization branches. If M7 later finds a
code path that can alter investment merit, authorization, sizing, or
sell/reduce behavior without an approved owner, it must be registered as
a divergence and may not be legitimized by existing tests.

------------------------------------------------------------------------

# 7. Historical Findings That Must Remain Visible

Traceability must not rewrite history.

-   M6.3 previously identified accounting/reference/inception issues and
    later closed them with regression evidence.
-   M6.4 initially stopped on methodology prerequisites; later M6
    implementation introduced governed scoring artifacts/methodology.
-   M6.5 had governance remediation stages before the current decision
    authority was established.
-   M6.6 originally reported two Major blockers around sequential
    multi-lot deployment/affordable substitution. M6.6.1 and M6.8
    contain the later marginal-allocation remediation and formal two-lot
    integration evidence.
-   M6.8 itself found four Major integration issues before fixing them
    and retained the failed attempts/evidence rather than rewriting them
    as initial passes.

These failures are valuable M7 regression targets. A current PASS must
mean "the current approved/remediated implementation is traceable," not
"the system never failed."

------------------------------------------------------------------------

# 8. Material Divergence Register

  ---------------------------------------------------------------------------------------------------------------------
  ID          Severity        Finding              Affected outputs              Required disposition    Current state
  ----------- --------------- -------------------- ----------------------------- ----------------------- --------------
  DIV-01      Major if        Baseline/version     scoring, decision lineage,    Freeze manifest using   **OPEN CONTROL
              unresolved at   metadata is          historical reconstruction     content hash +          / not yet a
              freeze          inconsistent in                                    governance evidence;    release
                              portions of                                        reject ambiguous active failure**
                              repository history;                                methodology             
                              header labels alone                                                        
                              can misidentify                                                            
                              approved                                                                   
                              methodology.                                                               

  DIV-02      Major if        M6 final report      production readiness          M7 must not infer       **OPEN
              treated as      explicitly says                                    production              VALIDATION
              certified       real-data                                          decision-support        DEPENDENCY**
                              operational                                        readiness from          
                              acceptance is                                      synthetic/integration   
                              blocked/not                                        tests                   
                              validated.                                                                 

  DIV-03      Major if not    Flow-adjusted        risk state, allocation        Validate in M7.2/M7.5   **OPEN
              independently   drawdown             restrictions                                          VALIDATION
              proven          traceability exists                                                        DEPENDENCY**
                              but independent                                                            
                              correctness evidence                                                       
                              is incomplete at                                                           
                              M7.1.                                                                      

  DIV-04      Major if not    Historical/PIT       M7.6                          Require PIT dataset     **OPEN
              independently   benchmark and        returns/benchmark/decisions   provenance and          VALIDATION
              proven          market/fundamental                                 availability-date       DEPENDENCY**
                              availability                                       controls                
                              correctness cannot                                                         
                              be certified from M6                                                       
                              bounded evidence.                                                          
  ---------------------------------------------------------------------------------------------------------------------

No Critical divergence is confirmed by this traceability audit.

------------------------------------------------------------------------

# 9. M7 Downstream Validation Obligations

The matrix creates the following mandatory hand-offs:

### M7.2 Accounting & Data

Must independently validate AD-01--AD-16 and RP-04/RP-05 with a manually
calculated Golden Portfolio Fixture, explicit tolerances, data-quality
adversarial cases, and reconciliation without silent repair.

### M7.3 Scoring

Must independently validate SC-01--SC-14, including representative
sector cases, cycle normalization, missing-data behavior, score
confidence, actual baseline thresholds, and score composition.

### M7.4 Decision Engine

Must validate DE-01--DE-14 and relevant IP/RP rules with positive,
negative, and boundary cases for all seven states plus metamorphic
tests.

### M7.5 Portfolio / DCA / Risk

Must validate DC-01--DC-13, concentration/drawdown/risk behavior,
carry-forward cash, opportunity-cost comparisons, and HOLD CASH.

### M7.6 Historical PIT

May begin only after deterministic M7.1--M7.5 gates pass. It must close
DIV-04 or explicitly downgrade the gate to PASS WITH DOCUMENTED
LIMITATIONS where permitted.

### M7.7 Paper Portfolio

Must prove immutable timestamped recommendations and outcome-independent
review.

### M7.8 Independent Review

Must re-open any assumption above if evidence is insufficient. Prior
approval is not a defense.

------------------------------------------------------------------------

# 10. M7.1 Baseline Integrity Gate

## 10.1 Gate criteria

Gate 1 --- Baseline Integrity may pass only when:

-   all material approved M1--M5 rules are inventoried;
-   every material executable rule has an identified approved owner;
-   every material implementation authorization path maps to an approved
    owner;
-   version/content identity is frozen;
-   no Critical divergence remains;
-   no Major divergence remains unresolved;
-   PARTIAL rows are explicitly assigned to downstream deterministic
    validation rather than silently treated as correctness PASS.

## 10.2 Current assessment

**M7.1 TRACEABILITY MATRIX RESULT: PASS WITH OPEN VALIDATION
DEPENDENCIES**

Interpretation:

-   **Critical unresolved:** 0 identified.
-   **Major confirmed unresolved implementation divergence:** 0
    identified.
-   **Open controls/dependencies:** 4, explicitly assigned to M7
    baseline freeze and downstream validation.
-   **Undocumented investment-rule authorization:** none confirmed.
-   **Historical failures:** retained and designated as regression
    targets.
-   **Historical validation authorization:** **NOT YET GRANTED**.

This result does **not** authorize M7.6. Deterministic validation
M7.2--M7.5 must pass first.

------------------------------------------------------------------------

# 11. Multi-Role Review

## CIO

**PASS.** The matrix preserves mandate/risk precedence, HOLD CASH, no
forced DCA, no automatic +20% sell, and no performance-target tuning.

## Independent Model Validator

**PASS after hardening.** Historical M6 PASS claims are treated as prior
evidence only. Historical failures are retained. PARTIAL rows cannot be
averaged away. The matrix can reject the model if downstream independent
evidence fails.

## Quantitative Analyst

**PASS.** Accounting, scoring boundaries, metamorphic obligations, exact
threshold tests, PIT controls, and benchmark limitations are routed to
explicit downstream tests rather than inferred from test counts.

## Financial Systems Engineer

**PASS.** Accounting authority, immutable ledger/replay, methodology
identity, source lineage, reconciliation, exact arithmetic, and
execution separation are traceable. Baseline hash/manifest remains
mandatory.

## Risk Manager

**PASS.** Veto/concentration/confidence/drawdown/thesis-broken controls
remain higher precedence than attractiveness. Drawdown is intentionally
PARTIAL pending independent verification.

## QA Lead

**PASS.** Requirement → implementation → evidence mapping is explicit;
PASS is scoped to traceability; open dependencies have owners; prior
failed runs remain regression evidence.

------------------------------------------------------------------------

# 12. Findings After Review/Fix Loop

### Critical

**0 unresolved**

### Major

**0 confirmed unresolved**

### Minor / governance-quality observations

-   Repository naming/version metadata is not perfectly uniform across
    milestones.
-   Some historical implementation reports are superseded by later
    remediation; consumers must use lineage rather than the
    newest-looking filename alone.
-   Real-data operational acceptance remains outside what M6 evidence
    proves.

These observations are controlled by the baseline manifest and
downstream M7 gates.

------------------------------------------------------------------------

# 13. Approval Gate

**Document state:** `BASELINE CANDIDATE — READY FOR USER APPROVAL`

If approved:

-   promote this document to **Approved Baseline v1.0**;
-   freeze its traceability obligations;
-   proceed to **`07_VALIDATION/ACCOUNTING_VALIDATION.md`** only;
-   do not begin historical performance validation;
-   do not silently modify M1--M6 baseline.
