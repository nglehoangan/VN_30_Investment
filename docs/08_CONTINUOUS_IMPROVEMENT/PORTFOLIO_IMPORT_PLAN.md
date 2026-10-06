# VN30 Value Investing OS --- Portfolio Import Plan

**Path:** `08_PRODUCTION/PORTFOLIO_IMPORT_PLAN.md`\
**Milestone:** M8 --- Live Portfolio Onboarding\
**Version:** 0.1 --- Approval Candidate\
**Status:** READY FOR APPROVAL REVIEW\
**Governing baselines:** `PRODUCTION_READINESS.md` v1.0,
`VERSION_BASELINE.md` v1.0, `BACKUP_RECOVERY.md` v1.0

------------------------------------------------------------------------

## 1. Purpose

Define the controlled process for importing a real portfolio into VN30
Value Investing OS (VVIOS) while preserving historical financial truth.

This document specifies the import contract and acceptance gates. It
does **not** authorize import execution.

Core principle:

> Historical Transactions → Validate → Preview → Human Confirm → Persist
> → Reconstruct → Reconcile.

Broker current holdings are reconciliation evidence, not a substitute
for available transaction history.

------------------------------------------------------------------------

## 2. Preconditions

A live import may begin only when all applicable pre-import gates in
`PRODUCTION_READINESS.md`, `VERSION_BASELINE.md`, and
`BACKUP_RECOVERY.md` have evidence-backed PASS status.

At minimum:

-   approved/frozen release identity;
-   production datastore identified and ready;
-   migrations validated;
-   secrets/security controls ready;
-   verified pre-import backup;
-   successful restore drill;
-   export/recovery capability verified;
-   audit logging ready;
-   no unresolved Critical/Major readiness issue.

**PENDING ≠ PASS.**

If these conditions are not met, only synthetic/test import rehearsal is
permitted.

------------------------------------------------------------------------

## 3. Import Objectives

The import must:

1.  preserve source records;
2.  preserve transaction chronology;
3.  detect invalid/ambiguous records;
4.  never silently drop records;
5.  be repeatable and idempotent;
6.  support preview before persistence;
7.  require explicit human confirmation;
8.  reconstruct portfolio from ledger history;
9.  produce reconciliation evidence;
10. retain lineage from source row to persisted record;
11. be reversible/recoverable without rewriting historical truth.

------------------------------------------------------------------------

## 4. Supported Transaction Classes

The importer must support or explicitly classify at least:

-   `CASH_DEPOSIT`
-   `CASH_WITHDRAWAL`
-   `BUY`
-   `SELL`
-   `DIVIDEND`
-   `FEE`
-   `TAX`
-   `CORPORATE_ACTION`

Unknown transaction types must become **REJECTED/REQUIRES_MAPPING**,
never silently ignored.

Corporate actions may require explicit subtypes such as stock dividend,
split, bonus issue, rights issue, merger/exchange, ticker change, or
other approved events. Unsupported semantics block affected records
until mapped.

------------------------------------------------------------------------

## 5. Source Evidence

Preferred evidence order:

1.  broker transaction/export history;
2.  broker cash ledger/statements;
3.  official transaction confirmations/statements;
4.  user-maintained records with traceable source;
5.  broker current holdings/cash for reconciliation.

Current average cost must not replace reconstructable historical
transactions.

Original source files must be retained unchanged or represented by
immutable source identity/checksum. Raw source evidence and normalized
import records are separate layers.

------------------------------------------------------------------------

## 6. Import Batch Identity

Every import attempt receives an immutable `Import Batch ID`.

Record:

-   batch ID;
-   source file/reference;
-   source checksum;
-   broker/account alias or non-sensitive portfolio identifier;
-   source period;
-   imported_at;
-   parser/mapping version;
-   application/release identity;
-   row count;
-   validation status;
-   confirmation status;
-   persistence status;
-   operator;
-   notes.

Never store credentials or unnecessary account secrets in import
metadata.

------------------------------------------------------------------------

## 7. Canonical Record Requirements

Each normalized transaction should contain sufficient fields for its
type.

Common fields:

-   source row/reference ID;
-   transaction type;
-   trade/effective date;
-   settlement date if applicable;
-   ticker/instrument if applicable;
-   quantity if applicable;
-   price if applicable;
-   gross amount if applicable;
-   fee;
-   tax;
-   net cash effect;
-   currency;
-   corporate-action subtype/reference if applicable;
-   source description;
-   normalization status;
-   lineage to source batch/row.

Amounts must use approved financial precision; binary floating-point
must not introduce financial drift.

------------------------------------------------------------------------

## 8. Date Semantics

Do not collapse distinct dates when the source distinguishes them.

Possible dates:

-   trade date;
-   settlement date;
-   ex-date;
-   record date;
-   payment/effective date;
-   source posting date.

The approved M2 accounting/data rules determine which date affects
ledger/accounting semantics.

If source date semantics are ambiguous, classify the record as
**AMBIGUOUS** and require resolution rather than guessing.

------------------------------------------------------------------------

## 9. Sign and Cash-Effect Rules

Normalization must make cash effects deterministic.

Examples conceptually:

-   deposit → increases cash;
-   withdrawal → decreases cash;
-   buy → decreases cash by purchase consideration plus applicable
    fee/tax;
-   sell → increases cash by sale proceeds net of applicable fee/tax;
-   cash dividend → increases cash net of applicable tax;
-   fee/tax → decreases cash unless already embedded in another
    transaction according to approved data rules.

The importer must prevent double-counting fees/taxes when broker exports
include both embedded and separate records.

Exact formulas must conform to M2/M4 approved semantics; this plan does
not redefine them.

------------------------------------------------------------------------

## 10. Validation Layers

### Layer 1 --- File/Batch validation

Check:

-   readable format;
-   expected encoding/schema;
-   non-empty;
-   source identity/checksum;
-   duplicate batch detection;
-   declared period plausibility.

### Layer 2 --- Row validation

Check:

-   required fields;
-   supported transaction type;
-   valid date;
-   valid numeric values;
-   quantity/price rules;
-   currency;
-   ticker format;
-   impossible values;
-   internal arithmetic where source provides components.

### Layer 3 --- Semantic validation

Check:

-   transaction sequence plausibility;
-   sell quantity versus reconstructed availability;
-   cash effects;
-   fee/tax treatment;
-   corporate-action semantics;
-   duplicate economic events;
-   VN30/universe implications according to historical membership rules.

A ticker's current VN30 membership must not be projected backward as
historical truth.

### Layer 4 --- Portfolio validation

Dry-run reconstruct:

-   holdings;
-   cash;
-   cost basis;
-   contributions;
-   withdrawals;
-   dividends;
-   realized P&L where applicable.

Validation failure must be visible at record and batch level.

------------------------------------------------------------------------

## 11. Validation Statuses

Each row receives one deterministic status:

-   `VALID`
-   `WARNING`
-   `AMBIGUOUS`
-   `INVALID`
-   `DUPLICATE`
-   `REQUIRES_MAPPING`

Rules:

-   `INVALID`, unresolved `AMBIGUOUS`, or `REQUIRES_MAPPING` records
    cannot silently persist.
-   `DUPLICATE` must identify the suspected original/economic event.
-   `WARNING` may proceed only if the warning class is explicitly
    non-blocking.
-   Batch acceptance criteria must be documented before confirmation.

------------------------------------------------------------------------

## 12. No Silent Drop Rule

For every source row:

`source rows = valid + warning + ambiguous + invalid + duplicate + requires_mapping`

The importer must produce a row-accounting summary.

If source row count cannot be reconciled to classified rows, the batch
is **FAIL**.

Filtering malformed rows without reporting them is prohibited.

------------------------------------------------------------------------

## 13. Duplicate Detection and Idempotency

Re-running the same source must not duplicate transactions.

Use, where available:

-   broker transaction ID;
-   source record ID;
-   source batch checksum + row identity;
-   deterministic economic-event fingerprint.

A fingerprint alone must be handled carefully because legitimate
transactions can share ticker/date/quantity/price.

Import behavior must distinguish:

-   exact replay;
-   likely duplicate;
-   legitimate repeated transaction.

Ambiguous duplicates require human resolution.

------------------------------------------------------------------------

## 14. Preview

Before persistence, generate a complete preview showing at least:

-   source batch identity;
-   counts by transaction type;
-   counts by validation status;
-   earliest/latest dates;
-   cash deposits/withdrawals totals;
-   buy/sell gross/net totals;
-   fees/taxes;
-   dividends;
-   corporate actions;
-   proposed reconstructed holdings;
-   proposed reconstructed cash;
-   material warnings/errors;
-   records requiring resolution.

Preview must be derived from the exact normalized payload intended for
confirmation.

------------------------------------------------------------------------

## 15. Human Confirmation Gate

Persistence requires explicit user/operator confirmation after preview.

Required flow:

**Import → Validate → Preview → Confirm → Persist**

Not:

**Upload → Persist → Explain later**

Confirmation must bind to the exact batch/payload identity. If the
normalized payload changes after preview, previous confirmation is
invalid and a new preview/confirmation is required.

------------------------------------------------------------------------

## 16. Atomic Persistence

Persistence must be atomic at the approved transaction boundary.

If the batch cannot be safely committed, it must not leave a partially
accepted financial ledger without explicit recoverable state.

On failure:

-   record failure;
-   preserve source and validation evidence;
-   roll back incomplete database write where technically applicable;
-   do not mark batch completed.

------------------------------------------------------------------------

## 17. Post-Persist Reconstruction

After successful persistence, reconstruct the portfolio from
authoritative records.

Compute according to approved M2 rules:

-   holdings quantities;
-   cash;
-   cost basis;
-   contributions;
-   withdrawals;
-   dividends;
-   realized P&L where applicable;
-   other required portfolio state.

Do not import broker-calculated aggregate values as replacements for
these computations when underlying history is available.

------------------------------------------------------------------------

## 18. Reconciliation Handoff

After reconstruction, compare against independent current evidence.

### Holdings

`System Expected Holdings vs Broker Current Holdings`

### Cash

`System Expected Cash vs Actual Portfolio Cash`

### Cost basis

`System Calculated Cost Basis vs Broker/reference data`, where
comparable.

Classify each discrepancy:

-   `MATCH`
-   `EXPLAINED_DIFFERENCE`
-   `UNEXPLAINED_DIFFERENCE`

A broker cost-basis difference is not automatically a system error;
methodology, fees, corporate actions, transfers, or historical source
completeness must be investigated.

Materiality criteria must be explicit and may not be invented after
seeing the discrepancy merely to obtain PASS.

------------------------------------------------------------------------

## 19. Missing History

If full historical transactions are unavailable:

1.  document missing period/data;
2.  attempt retrieval from broker/statements;
3.  identify what financial truth cannot be independently reconstructed;
4.  classify confidence and reconciliation impact;
5.  do not fabricate synthetic transactions to force current holdings to
    match.

Opening-balance or migration transactions may be used only if the
approved data model supports them and they are explicitly identified as
migration/reconstruction records with provenance---not disguised as
historical trades.

Material missing history may block go-live.

------------------------------------------------------------------------

## 20. Corporate Actions

Corporate actions are a high-risk import area.

For each action:

-   preserve source evidence;
-   identify effective date;
-   identify subtype;
-   capture quantity/cash impact;
-   link related records where possible;
-   validate pre/post holdings;
-   prevent double application.

Unknown corporate-action semantics are blocking for affected
reconstruction.

------------------------------------------------------------------------

## 21. Transfers and Broker Migration

Transfers can create holdings without ordinary BUY transactions.

If encountered:

-   do not label transfers as BUY merely to satisfy quantity;
-   retain transfer provenance;
-   preserve original acquisition/cost evidence where available;
-   classify incomplete cost basis explicitly;
-   reconcile against statements.

Transfer handling must follow approved data rules or trigger a
controlled gap/change review.

------------------------------------------------------------------------

## 22. Fees and Taxes

Fees/taxes must remain traceable.

Importer must determine whether source provides them:

-   embedded in net amount;
-   as explicit fields;
-   as separate ledger rows;
-   in multiple forms.

No double counting.

Unexplained fee/tax discrepancies must be surfaced.

------------------------------------------------------------------------

## 23. Currency

VVIOS VN30 portfolio base currency is expected to be VND unless
governing data rules state otherwise.

Any non-VND source record requires explicit supported conversion
semantics and exchange-rate provenance. No ad-hoc FX assumption is
allowed.

Unsupported currency is blocking for the affected record.

------------------------------------------------------------------------

## 24. Import Corrections

Never overwrite a persisted historical transaction merely because it was
imported incorrectly.

Correction workflow should preserve audit history, using the approved
correction/reversal mechanism.

At minimum record:

-   original record;
-   reason;
-   correcting/reversal record;
-   operator;
-   timestamp;
-   evidence;
-   impact on reconstruction/reconciliation.

If the approved data model lacks adequate correction semantics, this
becomes a blocker/change request rather than an excuse for direct
database editing.

------------------------------------------------------------------------

## 25. Audit Trail

Record:

-   batch creation;
-   source identity;
-   validation results;
-   preview identity;
-   human confirmation;
-   persistence result;
-   persisted record IDs;
-   reconstruction result;
-   reconciliation handoff;
-   correction/rejection events;
-   operator and timestamps;
-   release/model/schema identity.

No sensitive credentials in audit logs.

------------------------------------------------------------------------

## 26. Security and Privacy

Real broker exports may contain personal/account information.

Controls:

-   least-privilege access;
-   minimize retained PII;
-   do not commit raw live portfolio exports to a public repository;
-   redact unnecessary account identifiers from screenshots/evidence;
-   encrypt/protect backups according to `BACKUP_RECOVERY.md`;
-   avoid logging entire raw source rows when unnecessary;
-   securely handle temporary files.

------------------------------------------------------------------------

## 27. Rehearsal Requirement

Before first live import, execute the complete workflow with
synthetic/approved test data:

**Import → Validate → Preview → Confirm → Persist → Reconstruct →
Reconcile**

The rehearsal must demonstrate:

-   invalid record rejection;
-   duplicate handling;
-   no-silent-drop accounting;
-   confirmation binding;
-   atomic persistence/failure behavior;
-   reconstruction;
-   reconciliation classification;
-   audit evidence.

Live data is not the first test of the importer.

------------------------------------------------------------------------

## 28. Pre-Live Import Gates

  ---------------------------------------------------------------------------
  Gate                    Requirement                 Current state
  ----------------------- --------------------------- -----------------------
  PI1                     Governing M8                PASS (document
                          readiness/freeze/recovery   baselines)
                          documents approved          

  PI2                     All operational pre-import  PENDING
                          gates evidenced PASS        

  PI3                     Canonical import schema     PENDING
                          implemented                 

  PI4                     Transaction-type mappings   PENDING
                          verified                    

  PI5                     Validation statuses and     PENDING
                          no-silent-drop rule         
                          implemented                 

  PI6                     Duplicate/idempotency       PENDING
                          behavior tested             

  PI7                     Preview binds exact payload PENDING

  PI8                     Human confirmation gate     PENDING
                          tested                      

  PI9                     Atomic persistence/failure  PENDING
                          behavior tested             

  PI10                    Portfolio reconstruction    PENDING
                          tested                      

  PI11                    Reconciliation handoff      PENDING
                          tested                      

  PI12                    Corporate-action handling   PENDING
                          tested or explicitly        
                          blocked                     

  PI13                    Correction/audit mechanism  PENDING
                          verified                    

  PI14                    Synthetic end-to-end        PENDING
                          rehearsal PASS              

  PI15                    No Critical/Major           PENDING
                          unresolved                  
  ---------------------------------------------------------------------------

**No live import unless PI1--PI15 and all upstream mandatory gates
PASS.**

------------------------------------------------------------------------

## 29. Import Execution Record

For the eventual first live import, retain:

-   Import Batch ID;
-   source checksum/reference;
-   source period;
-   row-accounting summary;
-   validation report;
-   preview;
-   confirmation evidence;
-   persistence result;
-   transaction IDs/range;
-   reconstruction result;
-   reconciliation report reference;
-   backup ID immediately before import;
-   release/build/schema identity;
-   operator/reviewer;
-   timestamps.

------------------------------------------------------------------------

## 30. Abort / Rollback Criteria

Abort before persistence if:

-   source cannot be authenticated/identified sufficiently;
-   material rows are invalid or ambiguous;
-   duplicate state unresolved;
-   preview totals cannot be explained;
-   required transaction semantics unsupported;
-   pre-import backup/recovery gate not PASS;
-   release/schema identity mismatched.

After persistence, do not "rollback" by deleting financial history
casually. Use transactionally safe rollback before commit, or approved
correction/recovery mechanisms after commit while preserving audit
truth.

------------------------------------------------------------------------

## 31. Multi-Role Review

### Software Architect

**Issue:** Re-import and partial commits could corrupt state.\
**Fix:** Batch identity, idempotency, confirmation binding, atomic
persistence and correction semantics added.\
**Critical unresolved:** 0. **Major unresolved:** 0.

### Financial Systems Engineer

**Issue:** Broker aggregates could replace reconstructable ledger
history or fees could double count.\
**Fix:** Ledger-first reconstruction, explicit cash-effect treatment,
fee/tax controls and reconciliation handoff.\
**Critical unresolved:** 0. **Major unresolved:** 0.

### Security Reviewer

**Issue:** Broker exports can contain sensitive identifiers.\
**Fix:** Data minimization, no public-repo live exports, restricted logs
and protected temporary/backup data.\
**Critical unresolved:** 0. **Major unresolved:** 0.

### QA Lead

**Issue:** Invalid rows could disappear or live data could become the
first integration test.\
**Fix:** Row-accounting invariant, deterministic statuses and mandatory
synthetic end-to-end rehearsal.\
**Critical unresolved:** 0. **Major unresolved:** 0.

### Portfolio Manager

**Issue:** Current holdings/average cost could tempt shortcut
onboarding.\
**Fix:** Historical truth remains primary; current broker state is
reconciliation evidence only. Missing history is explicit and may block
go-live.\
**Critical unresolved:** 0. **Major unresolved:** 0.

------------------------------------------------------------------------

## 32. Re-Review Result

### Critical

None unresolved in this specification.

### Major

None unresolved in this specification.

### Execution evidence still required

PI2--PI15 remain PENDING until demonstrated against the actual
implementation. They are not document defects and cannot be converted to
PASS by assertion.

------------------------------------------------------------------------

## 33. Current Decision

**Document quality:** PASS FOR APPROVAL REVIEW\
**Critical specification issues:** 0 unresolved\
**Major specification issues:** 0 unresolved\
**Live portfolio import authorization:** NOT GRANTED\
**Synthetic import rehearsal:** permitted after upstream environment
gates allow it\
**Real portfolio data:** must not be imported yet

------------------------------------------------------------------------

## 34. Approval Effect

When explicitly approved:

1.  promote `PORTFOLIO_IMPORT_PLAN.md` to **Approved Baseline v1.0**;
2.  PI gates remain evidence-dependent;
3.  approval does not authorize live import;
4.  proceed only to the next M8 deliverable in sequence;
5.  actual live import occurs only after all upstream and PI gates are
    evidence-backed PASS.

------------------------------------------------------------------------

**END OF DOCUMENT**
