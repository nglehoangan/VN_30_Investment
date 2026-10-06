# VN30 Value Investing OS --- Operational Runbook

**Path:** `08_PRODUCTION/OPERATIONAL_RUNBOOK.md`\
**Milestone:** M8 --- Production Readiness & Live Portfolio Onboarding\
**Version:** 0.1 --- Approval Candidate\
**Status:** READY FOR APPROVAL REVIEW --- LIVE OPERATIONS NOT
AUTHORIZED\
**Governing baseline:** Frozen VVIOS v1.0 M1--M7 plus approved M8
production/onboarding contracts

## 1. Purpose

Define the standard operating procedure for running VN30 Value Investing
OS after production acceptance.

This runbook orchestrates approved controls. It does **not** create new
investment logic, relax gates, or authorize automated trading.

## 2. Operating Principles

1.  Financial truth comes from the authoritative ledger and controlled
    reconstruction.
2.  Decision truth is bound to exact policy/model/data/release
    identities.
3.  Required stale, missing, conflicting or invalid data fails closed.
4.  Recommendations are not executions.
5.  Human approval and manual broker execution remain mandatory.
6.  Actual executions are recorded from actual fills, never
    recommendation assumptions.
7.  Reconciliation follows material financial changes.
8.  Cash may remain undeployed.
9.  No silent model/configuration drift.
10. Incidents preserve evidence before correction.

## 3. Roles

### System

Validate, reconstruct, calculate, score, rank, analyze, recommend,
explain, log.

### User / Portfolio Owner

Review recommendations, approve/reject, execute broker trades manually,
provide/confirm authoritative evidence where required.

### Reviewer

Independently verify critical financial/model/operational evidence where
required.

No role may bypass frozen gates merely for convenience.

## 4. Production Start / Preflight

Before a production session that may influence a capital decision,
verify:

-   approved release/build/commit;
-   compatible schema/migrations;
-   database/storage health;
-   backup/recovery status;
-   audit logging available;
-   secrets/config loaded through approved mechanism;
-   no unresolved Critical/Major incident;
-   portfolio state/reconciliation status valid;
-   current data readiness status;
-   system clock/timezone/date handling valid.

If a required check fails, enter `BLOCKED` operating state.

## 5. Operating States

Use:

-   `READY`
-   `DEGRADED`
-   `BLOCKED`
-   `MAINTENANCE`

`DEGRADED` may permit read-only/non-affected functions only when
documented controls allow them.

`BLOCKED` prohibits affected financial/recommendation workflows.

## 6. Daily / Event-Driven Operations

No mandatory daily trading activity.

Event-driven checks may include:

-   new transaction/execution;
-   cash contribution/withdrawal;
-   dividend;
-   corporate action;
-   VN30 constituent change;
-   material company disclosure;
-   material data-source issue;
-   production incident.

For material ledger events: capture → validate → persist → reconstruct →
reconcile → audit.

## 7. Weekly Review

Run the approved M5 Weekly Review workflow.

At minimum:

-   verify portfolio state;
-   review material thesis/news changes;
-   inspect risk/concentration/drawdown;
-   identify stale/failed data;
-   review decision triggers;
-   document no-action outcome where appropriate.

Weekly review does not require rescoring every ticker unless governing
workflow/data triggers require it.

## 8. Monthly DCA Review

Follow `FIRST_DCA_REVIEW.md` contract:

**Contribution → Cash → Refresh → Scoring → Ranking → Eligibility →
Decision Engine → Position Sizing → Risk → Opportunity Cost → Lot
Constraint → Recommendation → Human Confirmation**

Valid outcomes include `DEPLOY`, `HOLD CASH`, `DEFER`, `BLOCKED`.

Never force deployment.

## 9. Quarterly / Reporting-Cycle Review

Run the approved M5 quarterly workflow after sufficient reporting data
becomes available.

Focus on:

-   thesis evolution;
-   financial health;
-   growth;
-   industry changes;
-   valuation;
-   risk;
-   portfolio construction;
-   opportunity cost;
-   decision-state validity.

Do not review merely on quarter-end calendar date if required company
information is not yet publicly available.

## 10. VN30 Membership Change

When authoritative VN30 membership changes:

1.  ingest/update membership with effective date;
2.  preserve membership history;
3.  validate sector/master data;
4.  identify portfolio impact;
5.  refresh affected scoring/review inputs;
6.  review impacted holdings/candidates under approved rules;
7.  do not rewrite historical eligibility;
8.  do not auto-sell solely from the data update unless governing policy
    yields that decision.

## 11. Market/Fundamental Data Refresh

For each refresh:

1.  identify source and cutoff;
2.  ingest;
3.  validate units/periods;
4.  check missing/stale/conflicting/impossible values;
5.  compute only approved derived metrics;
6.  create new Data Snapshot ID;
7.  run quality gates;
8.  mark PASS/BLOCKED.

Do not overwrite the evidence identity used by prior decisions.

## 12. Scoring Run

Before scoring verify the required data gates.

Then:

1.  bind Data Snapshot ID;
2.  bind model/release identity;
3.  account for entire eligible VN30 universe;
4.  score under frozen M3;
5.  normalize by approved sector rules;
6.  apply confidence/ranking rules;
7.  generate full ranking and Top 10;
8.  run reproducibility/QA checks where required;
9.  preserve run evidence.

No manual Top 10 reorder.

## 13. Portfolio Decision Workflow

For a security decision apply:

**Business Quality → Financial Health → Growth → Industry → Valuation →
Risks → Market/Money Flow → Technical Entry → Existing Portfolio →
Opportunity Cost → Final Decision**

Record score, thesis, positives, risks, valuation, action and thesis
invalidation conditions.

Only approved final states may be used.

## 14. Recommendation → Execution

A recommendation record must exist before treating an action as
system-recommended.

Human workflow:

1.  review recommendation/evidence;
2.  approve or reject;
3.  execute manually at broker if approved;
4.  capture actual fill(s);
5.  record actual fees/taxes;
6.  persist actual transaction;
7.  reconstruct;
8.  reconcile;
9.  close/link recommendation and execution records.

Never write a recommended price/quantity as actual execution unless it
matches broker evidence.

## 15. Transaction Capture

Supported transaction semantics follow the approved import/data model.

For each actual transaction retain source/evidence, dates, ticker,
quantity, price, fees/taxes, cash effect and linkage.

Corrections use approved correction/reversal mechanisms. Direct database
edits to "fix" financial truth are prohibited.

## 16. Reconciliation

Reconcile after live onboarding and after material
transaction/import/recovery events as required.

Classification:

-   `MATCH`
-   `EXPLAINED_DIFFERENCE`
-   `UNEXPLAINED_DIFFERENCE`

Material unexplained differences block affected live operation.

## 17. Backup

Use approved `BACKUP_RECOVERY.md`.

Required operational behavior includes:

-   pre-change backup for material risky changes;
-   scheduled backups;
-   event-driven backup where specified;
-   manifest/checksum;
-   protected storage;
-   retention;
-   restore-test evidence.

A backup that has never been successfully restored is not sufficient
recovery evidence.

## 18. Restore / Recovery

Recovery sequence:

**Select Recovery Point → Verify Manifest → Verify Release/Schema
Compatibility → Isolated Restore → Integrity Checks → Reconstruct →
Financial Invariants → Reconcile → Audit Validation → Approve/Reject**

Never use application rollback as a substitute for financial-data
recovery.

## 19. Incident Severity

### Critical

Potential corruption/loss of authoritative financial truth, unauthorized
transaction creation, security compromise affecting portfolio integrity,
or material model/policy bypass.

### Major

Material incorrect calculation/recommendation, unreconciled financial
discrepancy, broken mandatory gate, reproducibility failure,
backup/recovery failure affecting readiness.

### Minor

Non-material issue that does not compromise financial truth, decision
logic or required controls.

Critical/Major issues block affected production workflows until resolved
and revalidated.

## 20. Incident Response

**Detect → Contain → Preserve Evidence → Classify → Identify Scope →
Root Cause → Correct Through Approved Mechanism → Revalidate → Reconcile
if Financially Relevant → Review → Close**

Do not delete failed evidence or logs merely to restore a clean
dashboard.

## 21. Data Incident

For stale/missing/conflicting/incorrect data:

-   identify affected Data Snapshot IDs and decisions;
-   stop affected recommendations;
-   preserve source evidence;
-   correct source/mapping/transformation;
-   create new dataset identity;
-   rerun validation/scoring as required;
-   identify whether prior recommendations require review.

Do not fix data incidents by tuning the scoring model.

## 22. Financial Integrity Incident

For unexplained holdings/cash/cost-basis differences:

-   freeze affected write/decision workflow;
-   preserve broker/system evidence;
-   trace source → normalized → persisted → reconstructed state;
-   use correction/reversal/recovery controls;
-   rerun reconstruction and reconciliation;
-   require reviewer sign-off.

## 23. Security Incident

If credentials/secrets or unauthorized access may be compromised:

-   stop affected integrations;
-   preserve logs;
-   rotate/revoke affected credentials through approved channels;
-   verify data integrity;
-   assess unauthorized writes/actions;
-   restore/reconcile where needed;
-   document incident and closure evidence.

Never place secrets in incident reports committed to source control.

## 24. Change Control

Frozen investment/system behavior changes require:

**Change Request → Impact Analysis → Validation Plan → Implementation →
Regression Validation → Independent Review where required → Explicit
Approval → New Version**

No production hotfix may silently change policy, scoring weights,
thresholds, risk limits, DCA rules, lot rules or decision semantics.

Emergency operational fixes that do not change investment semantics
still require traceable change/release evidence.

## 25. Configuration Control

Distinguish:

-   baseline-controlled investment configuration;
-   operational configuration;
-   secrets/environment configuration.

Operational convenience must not be used to mutate baseline-controlled
behavior.

## 26. Audit Trail

Retain sufficient evidence to answer:

-   what happened;
-   when;
-   who/what initiated it;
-   which release/model/data were used;
-   what recommendation was made;
-   whether the user approved;
-   what was actually executed;
-   how portfolio state changed;
-   whether reconciliation passed.

Audit records must not be silently rewritten.

## 27. Decision Reconstruction

For any historical decision, reconstruct from:

-   Decision ID;
-   timestamp;
-   Data Snapshot ID;
-   Scoring Run ID;
-   portfolio snapshot/state;
-   policy/model versions;
-   application/build identity;
-   analytical assumptions;
-   recommendation;
-   human outcome;
-   actual execution if any.

If exact reconstruction is impossible, record the missing dependency
explicitly.

## 28. Operational Checklists

### Session Preflight

-   release/schema verified;
-   health/logging available;
-   backup state acceptable;
-   portfolio integrity valid;
-   data status known;
-   no blocking incident.

### Before Recommendation

-   data gates valid;
-   scoring evidence current;
-   portfolio/risk context current;
-   mandatory decision sequence complete;
-   audit identity complete.

### Before Manual Trade

-   recommendation reviewed;
-   human approval explicit;
-   quantity/lot/risk valid;
-   recommendation still current.

### After Trade

-   actual fill captured;
-   ledger updated;
-   reconstruction complete;
-   reconciliation complete;
-   audit linkage complete.

## 29. Routine Evidence

Each operational cycle should preserve the applicable review/report
artifact rather than only UI state.

At minimum retain identifiers for:

-   portfolio snapshot/state;
-   data snapshot;
-   scoring run;
-   decision/DCA review;
-   actual transaction;
-   reconciliation;
-   backup/recovery evidence where applicable.

## 30. Prohibited Operations

-   automatic broker trading;
-   forced monthly deployment;
-   direct DB edits to make balances match;
-   silent transaction deletion;
-   silent data imputation outside approved rules;
-   silent scoring/model changes;
-   manual ranking reorder;
-   future-information use in historical validation;
-   overwriting immutable accepted snapshots;
-   treating PENDING/UNKNOWN as PASS;
-   storing secrets in repository/audit exports.

## 31. Runbook Acceptance Gates

  Gate   Requirement                                  Current State
  ------ -------------------------------------------- ---------------
  OR1    Production preflight procedure defined       SPEC PASS
  OR2    Weekly/monthly/quarterly cadence mapped      SPEC PASS
  OR3    Data/scoring workflow mapped                 SPEC PASS
  OR4    Decision/human confirmation mapped           SPEC PASS
  OR5    Transaction/reconciliation workflow mapped   SPEC PASS
  OR6    Backup/restore procedure mapped              SPEC PASS
  OR7    Incident response defined                    SPEC PASS
  OR8    Change/config control defined                SPEC PASS
  OR9    Audit/reconstruction requirements defined    SPEC PASS
  OR10   Prohibited operations explicit               SPEC PASS
  OR11   Live operational rehearsal completed         NOT EXECUTED
  OR12   No Critical/Major unresolved                 SPEC PASS

Approval of this document does not convert OR11 to PASS.

## 32. Operational Rehearsal

Before full production acceptance, perform a controlled rehearsal using
approved non-live/synthetic or authorized evidence as applicable:

1.  preflight;
2.  data refresh;
3.  scoring/review flow;
4.  recommendation without auto-execution;
5.  simulated/manual-confirmation boundary;
6.  transaction/reconciliation test where permitted;
7.  backup/restore evidence;
8.  incident/failure-path check;
9.  audit reconstruction.

Record failures and rerun after correction.

## 33. Multi-Role Review

**Software Architect:** Risk of disconnected SOPs causing inconsistent
execution. Fixed with end-to-end state/workflow mapping and identities.
Critical 0; Major 0.

**Financial Systems Engineer:** Risk that recommendations and actual
fills diverge in ledger. Fixed with explicit actual-fill capture and
post-trade reconstruction/reconciliation. Critical 0; Major 0.

**Security Reviewer:** Risk of secrets in operational evidence and
incident handling. Fixed with secret separation, credential response and
no-secret audit exports. Critical 0; Major 0.

**QA Lead:** Risk that runbook approval is confused with operational
rehearsal. Fixed by OR11 remaining NOT EXECUTED. Critical 0; Major 0.

**Portfolio Manager / Risk Manager:** Risk that operational cadence
creates trading pressure or bypasses investment gates. Fixed by no
mandatory daily trading, HOLD CASH, frozen decision sequence and human
gate. Critical 0; Major 0.

## 34. Re-Review Result

**Critical specification issues:** 0 unresolved\
**Major specification issues:** 0 unresolved\
**Runbook specification:** READY\
**Operational rehearsal:** NOT EXECUTED\
**Live operations authorization:** NOT GRANTED

## 35. Current Decision

**Document quality:** PASS FOR APPROVAL REVIEW\
**Operational SOP:** READY\
**Production operation:** remains subject to evidence-backed production
acceptance\
**Automated trading:** PROHIBITED

## 36. Approval Effect

When explicitly approved:

1.  promote `OPERATIONAL_RUNBOOK.md` to **Approved Baseline v1.0**;
2.  approval freezes the operational SOP;
3.  OR11 and all evidence-dependent production gates remain pending
    until executed;
4.  approval does not authorize real-money operation by itself;
5.  proceed only to `PRODUCTION_ACCEPTANCE.md`;
6.  final production acceptance must aggregate all M8 and
    carried-forward M7 evidence and may remain BLOCKED if required proof
    is missing.

**END OF DOCUMENT**
