# VN30 Value Investing OS --- Data Validation

**Document:** `07_VALIDATION/DATA_VALIDATION.md`\
**Milestone:** M7.2 --- Accounting & Data Validation\
**Status:** Baseline Candidate --- Awaiting User Approval\
**Version:** 0.1\
**Date:** 2026-10-04\
**Parents:** `VALIDATION_STRATEGY.md` v1.0; `TRACEABILITY_MATRIX.md`
v1.0; `ACCOUNTING_VALIDATION.md` v1.0

## 1. Purpose

This document defines the independent validation contract for data
integrity, provenance, temporal correctness and fail-closed behavior.

Gate 3 exists to prevent a numerically correct system from making
decisions from the wrong facts, wrong dates, incomplete universes,
silently revised history or future information.

A data defect is **Critical** when it can create look-ahead,
survivorship bias, wrong VN30 eligibility, materially wrong
score/decision/NAV, or destroy reconstructability.

## 2. Core data doctrine

The governing rule is:

> A fact has exactly one authoritative owner. A calculated state is
> reproducible from authoritative facts. Missing or conflicting facts
> are surfaced, never guessed.

Required separation:

-   raw economic facts;
-   reference/master facts;
-   market/benchmark observations;
-   calculated state;
-   persisted rebuildable snapshots;
-   assumptions/estimates.

A field must not silently change class. A derived value cannot become
authoritative merely because it is stored.

## 3. Data dimensions to validate

Every material input is tested across:

1.  **Identity** --- correct durable entity/security/method ID.
2.  **Ownership** --- exactly one authoritative source.
3.  **Validity** --- schema/domain constraints.
4.  **Completeness** --- enough evidence to make the claimed assertion.
5.  **Uniqueness** --- no conflicting active truth.
6.  **Temporal validity** --- effective at the relevant date/time.
7.  **Availability** --- legitimately known by decision time.
8.  **Freshness** --- not older than allowed policy.
9.  **Provenance** --- source and lineage retained.
10. **Versioning/correction** --- revisions do not erase history.
11. **Reproducibility** --- same frozen inputs reconstruct same output.
12. **Quality state propagation** --- UNKNOWN/BLOCKED cannot become
    confident output downstream.

## 4. Required temporal model

For historical validation, material data should distinguish at minimum:

-   `reporting_period` / period end;
-   `publication_or_availability_timestamp`;
-   `decision_timestamp`.

Where applicable also retain:

-   event timestamp;
-   effective-from/effective-to;
-   observation timestamp/date;
-   received/ingested timestamp;
-   valid-through/freshness boundary;
-   correction/supersession timestamp;
-   calculation timestamp.

### PIT admissibility rule

A fact is admissible for a historical decision only if:

`effective_for_decision = true` AND
`availability_timestamp <= decision_timestamp` AND the selected
record/version is the one legitimately available under the frozen PIT
policy.

A fiscal quarter ending before the decision date is **not sufficient**
if the filing/result had not yet been published.

If availability time cannot be established reliably, the fact must be
excluded, conservatively delayed, or explicitly classified as a
limitation. It must not be assumed available.

## 5. Security identity

`security_id` is durable identity. Ticker/company name/sector are
attributes that can change.

Required tests:

-   ticker rename does not break historical transactions;
-   current ticker is not backfilled into earlier history as identity;
-   ticker reuse cannot join two economic securities;
-   historical identifier intervals do not overlap where uniqueness is
    required;
-   invalid/missing identity blocks dependent analytics;
-   no ID reuse after supersession/deletion.

**Critical failure:** joining historical
accounting/fundamentals/membership by current ticker when durable
identity is required.

## 6. VN30 membership and coverage

VN30 membership must be effective-dated. Announcement date and effective
date are distinct.

Membership lookup is tri-state:

-   `TRUE`: active membership interval exists.
-   `FALSE`: no active interval **and authoritative coverage for that
    date is COMPLETE_CONFIRMED**.
-   `UNKNOWN`: no active interval and coverage is
    absent/incomplete/unsupported.

Absence of a row is never automatically FALSE.

Required cases:

  ------------------------------------------------------------------------
  ID                Case              Expected           Severity
  ----------------- ----------------- ------------------ -----------------
  DV-01             Active interval   TRUE               Critical

  DV-02             No interval +     FALSE              Critical
                    complete coverage                    

  DV-03             No interval +     UNKNOWN/BLOCKED    Critical
                    incomplete                           
                    coverage                             

  DV-04             Entry             not yet eligible   Critical
                    announcement                         
                    before effective                     
                    date                                 

  DV-05             Entry effective   eligible           Critical
                    date                                 

  DV-06             Exit effective    no new-capital     Critical
                    date              eligibility;       
                                      holding may become 
                                      Legacy             

  DV-07             Re-entry          new interval; old  Major
                                      interval preserved 

  DV-08             Overlapping       reject/ambiguous   Critical
                    authoritative                        
                    intervals                            

  DV-09             Current VN30 list reject as PIT      Critical
                    used for old date contamination      

  DV-10             Constituent count cannot assert      Major/Critical if
                    claim without     exactly 30         used for universe
                    complete coverage                    
  ------------------------------------------------------------------------

Historical validation cannot proceed on dates where the investable
universe cannot be reconstructed sufficiently for the intended
conclusion.

## 7. Sector taxonomy and assignment

Historical sector truth is effective-dated `SecuritySectorAssignment`,
not a mutable current sector field.

Required cases:

-   \[start,end) boundary correctness;
-   exactly one authoritative CURRENT+CONFIRMED assignment at the
    assignable reporting level;
-   overlap → ambiguous/blocked;
-   explicit UNCLASSIFIED differs from missing coverage;
-   PROVISIONAL does not masquerade as confirmed;
-   assignment sector belongs to same taxonomy;
-   assignment occurs only while category is valid;
-   taxonomy version changes preserve lineage;
-   parent rollups do not become direct assignments unless taxonomy
    explicitly allows;
-   historical portfolio concentration uses historical sector, not
    current sector.

Wrong historical sector that changes risk-cap or sector-normalized
scoring is Critical.

## 8. Market-price observations

Every price used for valuation/entry context must carry security
identity, value/currency, observation time, received/availability time,
source lineage and freshness/valid-through state.

Required cases:

  -----------------------------------------------------------------------
  ID                      Case                    Expected
  ----------------------- ----------------------- -----------------------
  DV-20                   valid latest admissible VALID
                          observation             

  DV-21                   missing required price  BLOCKED

  DV-22                   stale price             STALE, not silently
                                                  current

  DV-23                   two conflicting         CONFLICTING/BLOCKED
                          authoritative prices    
                          same timestamp          

  DV-24                   future observation      excluded

  DV-25                   future-received         excluded from PIT
                          observation with        decision
                          earlier market date     

  DV-26                   wrong currency          reject

  DV-27                   no provenance           reject/block per
                                                  baseline

  DV-28                   later corrected price   preserve lineage;
                                                  as-known history not
                                                  silently rewritten
  -----------------------------------------------------------------------

For current analytical recomputation, corrected data may be used only
under an explicitly declared **as-revised** mode. It must never be
confused with **as-known** historical evidence.

## 9. Fundamental and scoring inputs

M7.3 will validate formulas; Gate 3 validates whether their inputs are
legitimate.

Each material fundamental input should retain:

-   metric identity;
-   security ID;
-   reporting period;
-   value/unit/currency;
-   source;
-   publication/availability timestamp where obtainable;
-   ingestion timestamp;
-   record/version status;
-   correction/restatement lineage;
-   quality status.

Required failure modes:

-   quarter-end treated as publication date;
-   annual report used before publication;
-   restated historical number injected into an as-known decision
    without labeling;
-   trailing metrics containing future periods;
-   inconsistent units/scales;
-   duplicate current observations;
-   missing denominator silently converted to zero;
-   estimate presented as fact;
-   missing value imputed without approved rule;
-   cross-security/period join error.

Any such defect that can materially alter a score/ranking/decision is
Critical or Major according to impact.

## 10. Benchmark data

Benchmark series identity includes methodology. Price-return and
total-return series are not interchangeable.

Required tests:

-   exactly one CURRENT observation per benchmark/date/type;
-   observation belongs to effective benchmark-method version;
-   corrections preserve superseded observation and invalidate affected
    derived analytics;
-   no fabricated level on non-trading/missing date;
-   stale level not treated as current;
-   base date inside supported coverage;
-   portfolio/benchmark dates aligned under approved policy;
-   return type/dividend treatment disclosed;
-   current benchmark revisions do not silently rewrite as-known
    historical comparison.

Benchmark raw data never modifies portfolio accounting.

## 11. Source precedence and conflicts

When multiple sources disagree:

1.  identify concept owner;
2.  apply approved source hierarchy;
3.  retain conflicting evidence;
4.  do not average or choose the favorable value;
5.  classify quality;
6.  block affected calculation if authoritative resolution is
    unavailable;
7.  document correction lineage if later resolved.

For VN30 membership, prefer authoritative index/exchange publication,
then official review/constituent notice or official machine-readable
source, then identifiable trusted secondary source only when official
data is unavailable.

A secondary source must not silently become equivalent to official
evidence.

## 12. Missing-data behavior

Missing data is a first-class state.

Permitted outcomes are baseline-specific, but may include:

-   UNKNOWN;
-   INCOMPLETE;
-   STALE;
-   CONFLICTING;
-   PROVISIONAL;
-   BLOCKED;
-   NOT APPLICABLE.

Forbidden behaviors:

-   missing → zero unless zero is economically proven;
-   missing membership → FALSE without complete coverage;
-   missing sector → current sector backfill;
-   missing price → cost basis;
-   missing publication timestamp → period-end timestamp;
-   missing benchmark → forward/backfill presented as observed;
-   missing metric → peer median unless explicitly approved and
    disclosed;
-   missing evidence → confident decision.

## 13. Correction and revision modes

M7 distinguishes:

**AS-KNOWN:** reproduce what could legitimately have been known at
decision time.

**AS-REVISED:** recompute using later corrected/restated authoritative
data, explicitly labeled.

Both can be useful, but they answer different questions. Historical
decision validation must use AS-KNOWN as primary evidence.

A correction must preserve:

-   prior record/version;
-   replacement record/version;
-   supersedes relation;
-   correction reason where applicable;
-   recorded/received time;
-   affected derived artifact invalidation/recalculation.

## 14. Dataset manifests

Every M7 historical or golden dataset must have a manifest containing at
least:

-   dataset ID/version;
-   purpose;
-   extraction/freeze timestamp;
-   source names/references;
-   covered securities;
-   covered dates;
-   field dictionary/units;
-   PIT availability policy;
-   known missingness;
-   correction/restatement policy;
-   hashes for immutable fixture files;
-   methodology/config version;
-   exclusions with reasons;
-   validator/reviewer.

Unmanifested data cannot be E3 evidence.

## 15. Required adversarial injections

M7 must intentionally inject:

1.  a future quarterly result;
2.  current VN30 membership into a historical date;
3.  current sector into a pre-reclassification date;
4.  later corrected price into AS-KNOWN history;
5.  duplicate same-date authoritative price;
6.  stale price;
7.  missing membership coverage;
8.  overlapping membership periods;
9.  provisional sector assignment;
10. ticker rename/reuse case;
11. benchmark methodology mismatch;
12. restatement published after decision;
13. missing publication timestamp;
14. wrong unit/scale;
15. derived snapshot with stale input-version lineage.

Each must be rejected, blocked, downgraded, or explicitly limited
according to baseline. Silent acceptance is a failure.

## 16. Metamorphic/invariant tests

**DM-01 Current-reference mutation:** changing today's
ticker/sector/member state must not alter frozen historical outputs.

**DM-02 Future-data injection:** adding data with availability after
decision time must not alter AS-KNOWN output.

**DM-03 Source-order permutation:** input order must not determine
authoritative result.

**DM-04 Correction lineage:** adding a later correction may change
AS-REVISED output but must not silently change the prior AS-KNOWN
artifact.

**DM-05 Cache deletion:** deleting derived cache cannot delete
authoritative raw/reference history.

**DM-06 Missingness monotonicity:** removing required evidence cannot
improve confidence/actionability.

**DM-07 Coverage monotonicity:** upgrading membership coverage from
unknown to complete may resolve UNKNOWN to TRUE/FALSE; it must not
rewrite the underlying membership event.

## 17. Evidence per case

Each release-critical case records:

-   Case ID and requirement ID;
-   baseline source/version/hash;
-   implementation SHA;
-   dataset/fixture manifest and hash;
-   data source/provenance;
-   reporting/effective/availability/decision timestamps;
-   selected version and selection rationale;
-   Expected state;
-   Actual state;
-   Difference;
-   quality status;
-   PASS/FAIL;
-   logs/artifacts;
-   reviewer/timestamp;
-   issue/remediation link.

Critical data integrity requires E3 evidence.

## 18. Gate 3 pass/fail

### PASS requires

-   no unresolved Critical/Major data defect;
-   source-of-truth ownership validated;
-   durable identity validated;
-   VN30 tri-state membership/coverage validated;
-   sector effective dating validated;
-   price freshness/conflict/future controls validated;
-   fundamental publication/availability controls validated before
    historical use;
-   benchmark methodology/version lineage validated;
-   correction modes distinguished;
-   missing-data behavior fails safely;
-   all adversarial future-data injections are caught;
-   datasets used for later M7 stages have manifests.

### FAIL if

-   future data can enter an earlier decision;
-   current VN30/sector/ticker state rewrites history;
-   missing coverage becomes confident non-membership;
-   restatement/current correction silently rewrites AS-KNOWN evidence;
-   missing/conflicting material data produces confident output;
-   source lineage cannot reconstruct a material decision input;
-   unit/identity/join defects can materially alter results;
-   data correction destroys prior evidence;
-   a dataset needed for historical validation cannot establish adequate
    PIT semantics.

Gate 3 failure blocks M7.3+ where affected and always blocks M7.6
historical validation.

## 19. Current independent findings

**DV-F01 --- Approval metadata inconsistency.** Some approved M2
repository files retain "Awaiting Approval" headers. **Major
governance/data-lineage risk.** Resolved at M7 strategy level by frozen
baseline manifest + content hash + approval evidence; embedded status
alone is non-authoritative.

**DV-F02 --- Historical membership requires coverage evidence.** The M2
contract correctly defines TRUE/FALSE/UNKNOWN. **Critical if
implementation or historical dataset collapses UNKNOWN to FALSE.**
Mandatory Gate 3 test.

**DV-F03 --- Publication-time completeness is a historical-data
dependency.** The logical data model strongly requires
effective/received timestamps, but M7 cannot assume all future
historical fundamental datasets contain reliable public-availability
timestamps. **Open validation dependency, not a PASS claim.** M7.6 is
blocked for affected periods until this is evidenced or documented as a
limiting exclusion.

**DV-F04 --- Benchmark revisions and return-type compatibility.**
Correctly modeled in M2, but historical dataset evidence must prove
method/version and availability. Mandatory Gate 3/M7.6 evidence.

**DV-F05 --- Existing M6 reference tests are supporting evidence only.**
Vietnam business-date and inception/reference regressions are useful
regression targets but do not independently certify Gate 3.

## 20. Multi-role review

-   **CIO --- PASS:** bad data cannot become a confident
    capital-allocation recommendation.
-   **Independent Model Validator --- PASS:** explicit future-data
    injections can falsify PIT controls.
-   **Quantitative Analyst --- PASS:** AS-KNOWN vs AS-REVISED prevents
    restatement/revision leakage.
-   **Data Engineer --- PASS:** identity, ownership, effective dating,
    provenance, correction and manifests are explicit.
-   **Financial Systems Engineer --- PASS:** derived caches cannot
    become authoritative truth.
-   **Risk Manager --- PASS:** missingness/conflict cannot improve
    actionability.
-   **QA Lead --- PASS:** boundary, negative, metamorphic and
    adversarial cases are specified.

**Critical unresolved in this validation specification: 0.**\
**Major unresolved in this validation specification: 0.**

`DV-F03` and `DV-F04` remain **open evidence dependencies**, not
unresolved defects in the validation specification. They must be
resolved with evidence or documented limitations before affected
historical validation can PASS.

## 21. Approval Gate

**Document state:** `BASELINE CANDIDATE — READY FOR USER APPROVAL`

On approval:

1.  promote `DATA_VALIDATION.md` to **Approved Baseline v1.0**;
2.  proceed only to `07_VALIDATION/SCORING_VALIDATION.md`;
3.  do not begin Decision Engine validation early;
4.  do not begin historical validation until deterministic release gates
    permit it.
