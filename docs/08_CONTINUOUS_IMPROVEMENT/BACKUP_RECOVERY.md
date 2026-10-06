# VN30 Value Investing OS --- Backup & Recovery

**Path:** `08_PRODUCTION/BACKUP_RECOVERY.md`\
**Milestone:** M8.1 --- Production Readiness & Baseline Freeze\
**Version:** 0.1 --- Approval Candidate\
**Status:** READY FOR APPROVAL REVIEW\
**Governing documents:**\
- `08_PRODUCTION/PRODUCTION_READINESS.md` --- Approved Baseline v1.0\
- `08_PRODUCTION/VERSION_BASELINE.md` --- Approved Baseline v1.0

------------------------------------------------------------------------

## 1. Purpose

This document defines the backup, restore, disaster-recovery, and
recovery-validation controls required before VN30 Value Investing OS
(VVIOS) may contain real portfolio data.

The core rule is:

> A backup is not considered operationally valid until a restore from
> that backup has been successfully demonstrated and validated.

This document does not authorize live portfolio import. It defines the
controls that must PASS before such import is permitted.

------------------------------------------------------------------------

## 2. Recovery Objectives

VVIOS is a long-horizon decision-support system, but its transaction
ledger and decision evidence are financially sensitive records. Recovery
must prioritize **financial truth and auditability** over convenience.

Recovery objectives:

1.  prevent irreversible loss of portfolio history;
2.  reconstruct holdings, cash, cost basis, NAV, contributions,
    dividends, and realized/unrealized P&L from authoritative records;
3.  preserve decision and audit evidence;
4.  prevent a restore from silently reverting or duplicating legitimate
    transactions;
5.  recover to a known release/schema identity;
6.  prove restored data is internally consistent before production use
    resumes.

------------------------------------------------------------------------

## 3. Recovery Principles

### 3.1 Ledger-first recovery

Historical transactions are the primary reconstruction source when
available.

Current holdings are reconciliation evidence, not a replacement for
transaction history.

### 3.2 No silent repair

Recovery must never silently:

-   delete an invalid transaction;
-   rewrite transaction dates;
-   change quantities or prices;
-   alter cost basis;
-   invent cash movements;
-   suppress reconciliation differences;
-   change investment logic to make recovered output match expectations.

### 3.3 Separate application rollback from financial-data recovery

Rolling application code back to a previous release is not equivalent to
restoring the database.

A code rollback must not automatically overwrite newer valid financial
records.

### 3.4 Restore before trust

Existence, timestamp, or file size of a backup is insufficient. Recovery
capability is PASS only after restoration and validation.

------------------------------------------------------------------------

## 4. Protected Data Inventory

Backup scope must include all authoritative state required to reproduce
portfolio and decision history.

At minimum:

  ------------------------------------------------------------------------------
  Data class                                      Required Recovery importance
  --------------------------- ---------------------------- ---------------------
  Transaction ledger                                   Yes Critical

  Cash ledger/state derived                            Yes Critical
  from authoritative records                               

  Holdings/reconstruction                              Yes Critical
  inputs                                                   

  Corporate actions                                    Yes Critical

  Fees and taxes                                       Yes Critical

  Contributions/withdrawals                            Yes Critical

  Dividends                                            Yes Critical

  Portfolio snapshots                                  Yes High

  Decision records                                     Yes Critical

  Audit logs required for                              Yes Critical
  financial traceability                                   

  Imported source-file                                 Yes High
  metadata / import IDs                                    

  Reconciliation records                               Yes Critical

  VN30 universe/master state                           Yes High
  used by decisions                                        

  Market/fundamental dataset                           Yes High
  provenance and as-of                                     
  metadata                                                 

  Schema/migration history                             Yes Critical

  Release/model/policy                                 Yes Critical
  identity referenced by                                   
  decisions                                                

  Application configuration   Yes, excluding secret values High
  required to reproduce                                    
  runtime                                                  
  ------------------------------------------------------------------------------

Secrets are not copied into ordinary data backups unless an approved
encrypted secret-recovery mechanism explicitly requires it.

------------------------------------------------------------------------

## 5. Source-of-Truth Classification

Every backed-up dataset must be classified:

-   **AUTHORITATIVE** --- source required to reconstruct financial
    truth;
-   **DERIVED** --- reproducible from authoritative records;
-   **REFERENCE** --- external/reference evidence;
-   **AUDIT** --- evidence of actions/decisions;
-   **CACHE/REGENERABLE** --- may be rebuilt and need not drive
    recovery.

Recovery must never prefer a derived value over conflicting
authoritative ledger evidence without explicit reconciliation.

------------------------------------------------------------------------

## 6. Backup Types

The implementation may use database-native or file-level mechanisms
appropriate to the actual production database, but must provide
equivalent controls.

Required capabilities:

### 6.1 Pre-change backup

Create a verified recovery point before:

-   first live portfolio import;
-   destructive or financially material migration;
-   bulk correction/import;
-   recovery-sensitive maintenance.

### 6.2 Scheduled operational backup

Once live data exists, backups must run on a documented schedule.

Default target for a local-production deployment:

-   backup after each materially completed ledger/import session where
    practical;
-   at least one daily backup on days the production system changes.

A different cadence requires documented justification against the RPO.

### 6.3 Export

Provide a human-inspectable export path for critical financial records
in addition to native database backup where feasible.

Export is complementary evidence; it is not automatically a full
disaster-recovery substitute.

------------------------------------------------------------------------

## 7. Backup Atomicity and Consistency

A backup must represent a consistent state.

The process must prevent or detect backups taken midway through a
financial write sequence.

At backup time, record:

-   backup ID;
-   creation timestamp;
-   application/release identity;
-   schema/migration version;
-   database identity;
-   last known transaction/import identifier where applicable;
-   record counts for critical tables/entities;
-   integrity/checksum information;
-   backup status.

A backup whose consistency cannot be established is **INVALID**.

------------------------------------------------------------------------

## 8. Backup Storage and Isolation

Production data and all backup copies must not share a single failure
domain.

For local-production use, the minimum design is:

-   primary production datastore; and
-   at least one backup copy stored separately from the primary database
    location/device or otherwise protected from the same accidental
    deletion/corruption event.

Preferred stronger control:

**3-2-1 principle:** multiple copies, more than one storage
medium/failure domain, with at least one sufficiently
isolated/off-device copy.

The exact implementation must be documented before go-live.

------------------------------------------------------------------------

## 9. Encryption and Access Control

Backups containing real portfolio data are sensitive.

Controls must include:

-   least-privilege access;
-   encryption at rest where supported/appropriate;
-   secure transfer if backup leaves the host;
-   no plaintext credentials embedded in backup scripts or manifests;
-   no secrets printed to logs;
-   restricted restore permission;
-   documented ownership of backup and restore operations.

A backup location that is broadly accessible or accidentally
synchronized to an uncontrolled public location is a go-live blocker.

------------------------------------------------------------------------

## 10. Backup Naming and Manifest

Each backup must be uniquely identifiable.

Recommended logical identity:

`VVIOS_<environment>_<timestamp>_<release>_<backup-id>`

Each backup must have a manifest containing at least:

-   backup ID;
-   environment;
-   created at;
-   backup method/type;
-   source database identifier;
-   release/commit identity;
-   schema/migration version;
-   size;
-   checksum/integrity value;
-   critical record counts;
-   storage location reference;
-   encryption status;
-   verification status;
-   restore-test status;
-   retention/expiry class.

Do not put secret values into the manifest.

------------------------------------------------------------------------

## 11. Integrity Verification

Immediately after creation, the backup process must verify:

1.  backup operation completed successfully;
2.  output exists and is non-empty where applicable;
3.  checksum/integrity metadata can be calculated;
4.  backup can be opened/read by the expected restore mechanism;
5.  manifest matches the backup;
6.  critical record counts are plausible.

This is **backup verification**, not restore validation.

------------------------------------------------------------------------

## 12. Restore Procedure

Restore must be performed into an isolated recovery/test target first.

Required sequence:

**Select Recovery Point\
→ Verify Backup Manifest & Checksum\
→ Verify Compatible Release/Schema Path\
→ Provision Isolated Restore Target\
→ Restore\
→ Apply only documented compatible migration/recovery steps\
→ Run Database Integrity Checks\
→ Reconstruct Portfolio\
→ Validate Financial Invariants\
→ Compare Against Backup Manifest / Known Snapshot\
→ Validate Audit/Decision Evidence\
→ Produce Restore Report\
→ Approve or Reject Restored State**

Production must not be overwritten as the first restore attempt.

------------------------------------------------------------------------

## 13. Financial Restore Validation

A restore test is not PASS merely because the database starts.

Validate, at minimum:

### 13.1 Ledger integrity

-   expected transaction count;
-   unique transaction identifiers;
-   no unexpected duplicates;
-   valid transaction ordering/semantics;
-   fees/taxes/corporate actions retained.

### 13.2 Holdings reconstruction

Reconstruct holdings from authoritative history and compare with the
expected pre-backup state.

### 13.3 Cash reconstruction

Recalculate expected cash from deposits, withdrawals, trades, fees,
taxes, dividends, and applicable corporate actions.

### 13.4 Cost basis

Recalculate cost basis using the approved VVIOS accounting/data rules.

### 13.5 Portfolio-level checks

Validate where applicable:

-   NAV;
-   holdings quantities;
-   cash;
-   realized P&L;
-   unrealized P&L;
-   contributions;
-   dividends;
-   sector/position allocations.

### 13.6 Auditability

Verify decision records retain:

-   Decision ID;
-   timestamps;
-   data as-of;
-   model/policy/release identity;
-   recommendation and reason;
-   relevant portfolio context.

------------------------------------------------------------------------

## 14. Recovery Invariants

The restore validation suite must explicitly test invariants such as:

-   no negative share quantity unless the approved model explicitly
    permits it;
-   no duplicate authoritative transaction identity;
-   reconstructed holdings equal expected holdings for the recovery
    point;
-   reconstructed cash equals expected cash within documented rounding
    tolerance;
-   transaction chronology remains intact;
-   required foreign/reference keys remain valid;
-   decision records remain linked to valid release/model/policy
    identities;
-   migration state is internally consistent;
-   audit records are not silently lost.

Tolerance must never be used to hide material discrepancies.

------------------------------------------------------------------------

## 15. RPO --- Recovery Point Objective

### Pre-live / first import

**RPO target: zero committed live portfolio records lost.**

A verified pre-import backup is mandatory. After first successful
import/reconciliation, a new recovery point must be created before
subsequent materially risky changes.

### Normal local-production operation

Initial target:

**RPO ≤ 24 hours, with event-driven backup after material ledger/import
sessions where practical.**

If operational behavior shows that 24 hours could lose manually
expensive or financially material records, the cadence must be tightened
through operational configuration---not by changing investment logic.

------------------------------------------------------------------------

## 16. RTO --- Recovery Time Objective

Initial local-production target:

**RTO ≤ 4 hours for restoration of decision-support capability**,
assuming required hardware/storage and valid backup are available.

This is an operational target, not permission to bypass validation.

If integrity cannot be established within the RTO, the system remains
unavailable rather than resuming from an untrusted state.

------------------------------------------------------------------------

## 17. Retention Policy

Until empirical storage requirements are known, use a conservative
policy.

Minimum initial retention:

-   recent daily recovery points: 30 days;
-   month-end recovery points: 12 months;
-   pre-migration / pre-major-import recovery points: retain through
    successful validation plus a documented safety period;
-   initial operational baseline snapshot/recovery evidence: retain as
    long-term audit evidence.

Retention may be refined later through controlled operational review,
provided financial/audit obligations are not weakened.

Deletion of backups must be intentional and auditable.

------------------------------------------------------------------------

## 18. Restore Drill

A successful restore drill is mandatory **before live portfolio
import**.

The drill must use non-live or approved test data until authorization to
handle live data exists.

Evidence must record:

  Field                        Required
  ---------------------------- -------------
  Drill ID                     Yes
  Date/time                    Yes
  Operator                     Yes
  Source backup ID             Yes
  Backup checksum verified     Yes
  Restore target               Yes
  Release/schema identity      Yes
  Restore start/end time       Yes
  Database integrity result    Yes
  Financial invariant result   Yes
  Reconstruction result        Yes
  Audit-record result          Yes
  Discrepancies                Yes
  Final status                 PASS / FAIL
  Reviewer/approval            Yes

A partial restore or startup-only test is not sufficient.

------------------------------------------------------------------------

## 19. Restore-Test Acceptance Criteria

Restore test is **PASS** only when all are true:

-   backup checksum/identity verified;
-   isolated restore completed without undocumented manual repair;
-   schema/migration state valid;
-   critical record counts match expectations;
-   transaction ledger intact;
-   holdings reconstruct correctly;
-   cash reconstructs correctly;
-   cost basis reconstructs correctly where test data covers it;
-   audit/decision records remain usable;
-   no material unexplained discrepancy;
-   restore procedure is repeatable from the documented runbook;
-   evidence is retained.

Any material unexplained difference is **FAIL**.

------------------------------------------------------------------------

## 20. Corrupt or Missing Backup Handling

If the selected backup is corrupt:

1.  mark it INVALID;
2.  preserve evidence;
3.  do not overwrite it;
4.  attempt the next valid recovery point;
5.  assess RPO breach;
6.  open an incident record;
7.  keep production blocked until financial integrity is demonstrated.

If no valid recovery point exists, the system is **NOT PRODUCTION
READY**.

------------------------------------------------------------------------

## 21. Failed Restore Handling

If restore fails:

-   do not modify the source backup;
-   capture error and environment evidence;
-   determine whether failure is backup corruption, version
    incompatibility, schema issue, configuration issue, or procedure
    defect;
-   fix the recovery mechanism, not financial records;
-   rerun from a clean isolated target;
-   retain failed-run evidence.

Manual database edits made solely to obtain a PASS are prohibited.

------------------------------------------------------------------------

## 22. Recovery From Accidental Financial Mutation

If production financial data is accidentally altered:

1.  stop further financial writes;
2.  preserve current database and logs as incident evidence;
3.  identify last known-good recovery point;
4.  identify legitimate transactions after that point;
5.  restore to isolated environment;
6.  replay/reconcile legitimate post-backup records using authoritative
    evidence;
7.  validate all financial invariants;
8.  review before replacing/resuming production.

Never restore an old database over production and silently discard newer
valid transactions.

------------------------------------------------------------------------

## 23. Migration Recovery

Before a financially material migration:

-   create verified backup;
-   record source schema version;
-   validate migration on representative restored data;
-   define forward and rollback/recovery path;
-   prove financial invariants before and after migration.

Once a migration is applied to production, its history must remain
auditable.

A migration rollback that would destroy valid newer records must use
recovery/reconciliation rather than destructive reversal.

------------------------------------------------------------------------

## 24. Export Capability

Critical records must be exportable into an inspectable format suitable
for independent reconciliation.

At minimum, export should cover:

-   transactions;
-   cash movements;
-   holdings/reconstruction output;
-   decisions;
-   reconciliation records;
-   snapshots where applicable.

Exports must include stable identifiers and timestamps.

An export must not silently omit invalid/problematic records.

------------------------------------------------------------------------

## 25. Audit Logging for Backup/Restore

Record at least:

-   backup created;
-   backup verification result;
-   backup deletion/expiry;
-   restore initiated;
-   restore completed/failed;
-   recovery point selected;
-   recovery validation result;
-   operator/reviewer;
-   relevant release/schema identity.

Logs must not expose secrets.

------------------------------------------------------------------------

## 26. Automation Safety

Backup automation is allowed.

Restore into production must not be automatically triggered by an
application error.

Automatic recovery that can overwrite financial truth is prohibited for
v1.0 unless separately designed, validated, and approved in a future
controlled release.

------------------------------------------------------------------------

## 27. Pre-Import Backup/Recovery Gates

Live portfolio import remains prohibited until all gates below are PASS.

  -----------------------------------------------------------------------
  Gate                    Requirement             Current state
  ----------------------- ----------------------- -----------------------
  BR1                     Actual production       PENDING EVIDENCE
                          database/storage        
                          identified              

  BR2                     Complete protected-data PENDING EVIDENCE
                          inventory mapped to     
                          implementation          

  BR3                     Backup mechanism        PENDING EVIDENCE
                          implemented             

  BR4                     Backup                  PENDING EVIDENCE
                          manifest/checksum       
                          mechanism works         

  BR5                     Backup stored outside   PENDING EVIDENCE
                          single primary failure  
                          domain                  

  BR6                     Access/encryption       PENDING EVIDENCE
                          controls verified       

  BR7                     Isolated restore        PENDING EVIDENCE
                          procedure implemented   

  BR8                     Restore drill completed PENDING EVIDENCE

  BR9                     Financial invariants    PENDING EVIDENCE
                          pass after restore      

  BR10                    Audit/decision evidence PENDING EVIDENCE
                          survives restore        

  BR11                    Export capability       PENDING EVIDENCE
                          verified                

  BR12                    RPO/RTO and retention   PENDING EVIDENCE
                          operationalized         

  BR13                    No Critical/Major       PENDING EVIDENCE
                          recovery issue          
                          unresolved              
  -----------------------------------------------------------------------

**Fail-closed rule:** PENDING is not PASS.

------------------------------------------------------------------------

## 28. Evidence Directory / Record Structure

Implementation may choose repository or protected operational storage
appropriate to evidence sensitivity.

Recommended logical structure:

``` text
recovery-evidence/
  <drill-id>/
    backup-manifest
    checksum
    restore-log
    integrity-results
    financial-invariant-results
    reconstruction-results
    audit-validation
    restore-report
```

Real portfolio data or secrets must not be committed to a public
repository merely to satisfy evidence requirements.

------------------------------------------------------------------------

## 29. Multi-Role Review

### Software Architect

**Issue:** Backup design could become database-specific before runtime
architecture is finalized.\
**Fix:** Defined required capabilities and invariants rather than
inventing database commands; implementation must bind them to the actual
datastore.

**Critical unresolved:** 0\
**Major unresolved:** 0

### Financial Systems Engineer

**Issue:** Conventional "database restored successfully" testing is
insufficient for portfolio truth.\
**Fix:** Added ledger, holdings, cash, cost-basis, NAV/P&L, and audit
validation plus protection against destructive rollback.

**Critical unresolved:** 0\
**Major unresolved:** 0

### Security Reviewer

**Issue:** Backup copies can become an uncontrolled second copy of
sensitive portfolio data.\
**Fix:** Added isolation, least privilege, encryption expectations,
secret exclusion, and audit logging.

**Critical unresolved:** 0\
**Major unresolved:** 0

### QA Lead

**Issue:** Backup presence could be falsely classified as readiness.\
**Fix:** Separated backup verification from restore validation and
introduced BR1--BR13 fail-closed gates.

**Critical unresolved:** 0\
**Major unresolved:** 0

### Portfolio Manager

**Issue:** Recovery errors could change economic history while leaving
the application apparently functional.\
**Fix:** Financial truth is an explicit acceptance criterion; material
unexplained discrepancy blocks operation.

**Critical unresolved:** 0\
**Major unresolved:** 0

------------------------------------------------------------------------

## 30. Re-Review Classification

### Critical

None unresolved in this specification.

### Major

None unresolved in this specification.

### Minor / Execution Evidence Required

Not specification defects; required before live import:

-   bind procedure to actual production database and storage;
-   implement backup mechanism;
-   implement manifest/checksum;
-   configure isolated backup location;
-   verify security controls;
-   execute isolated restore drill;
-   run financial invariant validation;
-   verify export;
-   record measured restore duration and achieved RPO/RTO evidence.

These remain **PENDING EVIDENCE**, not PASS.

------------------------------------------------------------------------

## 31. Current Decision

**Document quality:** PASS FOR APPROVAL REVIEW\
**Critical specification issues:** 0 unresolved\
**Major specification issues:** 0 unresolved\
**Backup/restore operational gate:** NOT YET PASS --- implementation
evidence pending\
**Live portfolio import:** PROHIBITED

No real portfolio data may be imported merely because this document is
approved.

------------------------------------------------------------------------

## 32. Approval Effect

When explicitly approved:

1.  promote `08_PRODUCTION/BACKUP_RECOVERY.md` to **Approved Baseline
    v1.0**;
2.  BR1--BR13 remain PENDING until demonstrated with actual
    implementation evidence;
3.  approval does not authorize live portfolio import;
4.  proceed only to the next approved M8 step;
5.  before live import, an actual restore drill must demonstrate
    BR1--BR13 as applicable and all pre-import gates in
    `PRODUCTION_READINESS.md` must PASS.

------------------------------------------------------------------------

**END OF DOCUMENT**
