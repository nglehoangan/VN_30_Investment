# VN30 Value Investing OS --- Scoring Validation

**Document:** `07_VALIDATION/SCORING_VALIDATION.md`\
**Milestone:** M7.3 --- Scoring Validation\
**Status:** Baseline Candidate --- Awaiting User Approval\
**Version:** 0.1\
**Date:** 2026-10-04\
**Parents:** `VALIDATION_STRATEGY.md` v1.0; `TRACEABILITY_MATRIX.md`
v1.0; `ACCOUNTING_VALIDATION.md` v1.0; `DATA_VALIDATION.md` v1.0

## 1. Objective

Validate that M6 implements the approved M1/M3 scoring constitution
faithfully, deterministically and without hidden economic shortcuts.

This stage validates the scoring/ranking mechanism. It does **not** tune
weights, thresholds or sector treatment to improve historical returns.

## 2. Frozen constitutional architecture

The permanent Investment Score is exactly 100 points:

  Category                                      Max
  --------------------------------------- ---------
  Business Quality (BQ)                          25
  Financial Health (FH)                          15
  Growth Quality (GQ)                            15
  Industry & Competitive Position (ICP)          10
  Valuation & Forward Return (VAL)               20
  Risk & Governance (RG)                         10
  Capital Allocation Quality (CA)                 5
  **Total**                                 **100**

Market/Money Flow and Technical Entry remain outside the 100-point
fundamental score. Portfolio exposure, investor cost basis, unrealized
P&L and DCA status also cannot inject fundamental points.

A score is decision support, never BUY/HOLD/SELL authority.

## 3. Independent validation principle

Production tests are supporting evidence, not the oracle.

M7 Expected results must come from:

-   frozen scoring methodology tables;
-   independently transcribed category/subcategory maxima and gates;
-   manual arithmetic for golden cases;
-   validation-only boundary generators that do not import production
    scoring/ranking functions.

Actual results come from production code.

Any Expected table derived by importing the same production methodology
constants used by Actual is not independent E3 evidence.

## 4. Structural invariants

SC-V01 total category maxima = 100 exactly.\
SC-V02 category maxima equal 25/15/15/10/20/10/5.\
SC-V03 no subcategory can exceed its approved maximum.\
SC-V04 missing evidence cannot become zero, midpoint or redistributed
points unless explicitly approved.\
SC-V05 confidence does not multiply or rewrite score.\
SC-V06 Stage 0/hard veto cannot be compensated by score.\
SC-V07 score does not directly emit a decision state.\
SC-V08 technical/money-flow/portfolio fields cannot alter the 100-point
score.\
SC-V09 investor cost basis cannot affect valuation points.\
SC-V10 current price decline alone cannot add points.\
SC-V11 low P/E alone cannot establish cheapness.\
SC-V12 duplicate economic evidence cannot receive duplicate scoring
credit.\
SC-V13 methodology identity/version is pinned in artifact lineage.\
SC-V14 later evidence/methodology cannot mutate a prior immutable score
artifact.

Failure of V01--V14 is Major or Critical if it can authorize materially
wrong capital action.

## 5. Scoreability and category gates

Validate the Layer-0 states:

-   VALID --- ACTIONABLE
-   VALID --- NON-ACTIONABLE
-   RESEARCH ONLY
-   NOT RELIABLY SCORABLE

Required category gates currently implemented for investable ranking:

-   BQ \>= 13
-   FH \>= 8
-   RG \>= 5
-   VAL \>= 10

M7 must verify these thresholds against the frozen approved methodology
rather than treating code as authority.

Boundary cases for each gate: `min−1`, `min`, `min+1`.

Expected: - below gate: excluded from actionable investable ranking; -
exactly at gate: treatment follows approved inclusive rule; - above
gate: gate passes, but other gates may still block.

## 6. Metric semantics

For every production metric, validate:

`source → raw observation → normalization → metric value → bounded assessment → subcategory → category → total`

Tests must cover:

-   formula operands;
-   units and scale;
-   sign convention;
-   period definition;
-   TTM/3Y/5Y behavior;
-   denominator;
-   normalized vs as-reported treatment;
-   corporate-action comparability;
-   missing rule;
-   sector applicability;
-   evidence lineage;
-   no automatic point award from a raw metric unless approved rubric
    explicitly defines it.

### Required metric adversaries

-   denominator zero;
-   negative denominator where economically invalid;
-   percentage supplied as 20 vs 0.20;
-   VND vs million/billion VND scale error;
-   TTM mixed with FY;
-   restated value unavailable at cutoff;
-   one-off gain embedded in earnings;
-   split-distorted per-share history;
-   peak-cycle earnings used unnormalized;
-   estimate mislabeled FACT.

## 7. Threshold and band validation

`METRIC_DEFINITIONS.md` requires band-based scoring and conservative
treatment at exact thresholds unless rubric explicitly says otherwise.

For every numeric rubric boundary M7 must generate:

-   just below;
-   exactly equal;
-   just above;
-   missing;
-   stale;
-   conflicting.

No floating-point epsilon may accidentally cross a band.

A threshold implementation is Major if wrong locally and Critical if
systematic enough to materially change ranking/decision authorization.

## 8. Sector normalization

Core invariant:

> Weights and economic principles remain constant; sector-appropriate
> metrics/normalization may differ.

Required sector families include at least the implemented VN30 mappings
for banks, real estate, retail, technology, materials/industrial and
other configured sectors.

### Mandatory cross-sector cases

**Bank:** high ROE caused by weak provisioning/low capital cannot
automatically receive maximum economics/financial-health credit.

**Real estate:** low market price cannot repair weak cash realization,
legal/funding risk or poor balance-sheet quality.

**Technology:** low tangible book value is not automatically a weakness.

**Retail:** growth with adverse store/unit economics receives weaker
growth-quality assessment.

**Materials/cyclicals:** both peak and trough require symmetric
normalization; spot peak earnings cannot drive cheap valuation/high
quality.

**Small peer set:** fewer than four genuinely comparable VN30 names
cannot use VN30-only percentile as primary evidence; expand peer set or
use absolute/own-history anchors.

**No forced equalization:** sector average scores need not converge.

## 9. Cycle-normalization falsification

The same normalized through-cycle economics should not receive
materially different scores merely because the current spot period is
peak versus trough.

Construct paired synthetic cases:

-   identical normalized mid-cycle economics;
-   one with temporary peak margins;
-   one with temporary trough margins.

Expected: - normalization treatment is symmetric; - peak does not
receive windfall points; - trough is not mechanically punished when
approved normalized evidence supports durability; - uncertainty may
reduce confidence where normalization evidence is weak.

This directly closes the TRACEABILITY_MATRIX open obligation on
peak-cycle behavior.

## 10. Missing data and confidence

Required transformations:

-   missing decision-critical evidence → N/R or NOT RELIABLY SCORABLE;
-   stale/conflicting critical evidence → explicit quality
    degradation/block;
-   LOW confidence cannot be upgraded by a high score;
-   removing required evidence cannot improve score
    validity/actionability;
-   no redistribution of missing subcategory weight;
-   no implicit neutral midpoint.

Confidence is an orthogonal control, not a hidden eighth score category.

## 11. Double-count validation

Adversarially reuse the same evidence/economic channel across:

-   earnings quality and capital allocation;
-   dividend evidence and cash generation;
-   growth and business quality;
-   governance and risk;
-   valuation and expected return.

Expected: the system rejects or explicitly assigns a single primary
scoring home where the methodology prohibits duplicate credit.

Portfolio realized/unrealized P&L is never issuer evidence.

## 12. Corporate-action comparability

Per-share history must be comparable across
split/bonus/rights/ESOP/merger/spinoff events.

Required:

-   mechanical split changes denominator but is not economic dilution;
-   rights/issuance assessed on per-share value impact, not share-count
    growth alone;
-   missing material terms → N/R/block;
-   current shares outstanding cannot reconstruct historical denominator
    by assumption;
-   portfolio corporate-action accounting cannot be reused as
    issuer-quality evidence.

## 13. Independent golden scorecards

M7 must build at least these validation-only golden scorecards:

  -----------------------------------------------------------------------
  ID                      Design                  Expected purpose
  ----------------------- ----------------------- -----------------------
  SG-01                   Complete mid-quality    manual 100-point
                          industrial              arithmetic

  SG-02                   Same evidence, bank     sector-equivalent
                          translation             economics

  SG-03                   High total but BQ below excluded
                          gate                    

  SG-04                   High total but FH below excluded
                          gate                    

  SG-05                   High total but VAL      excluded
                          below gate              

  SG-06                   High total but RG below excluded
                          gate                    

  SG-07                   Missing critical        no fabricated
                          evidence                total/actionability

  SG-08                   LOW confidence high     no actionable
                          score                   investable ranking

  SG-09                   Hard veto high score    excluded

  SG-10                   Peak cyclical           normalized, no peak
                                                  reward

  SG-11                   Trough cyclical         symmetric normalization

  SG-12                   Duplicate evidence      reject/downgrade

  SG-13                   Corporate-action        N/R/block
                          incomparable            

  SG-14                   Technical momentum      total unchanged
                          changed only            

  SG-15                   Investor cost basis     total unchanged
                          changed only            
  -----------------------------------------------------------------------

At least one golden scorecard must manually sum every subcategory,
category and total without production constants.

## 14. Ranking validation

Ranking is separate from score.

Validate:

-   complete dated VN30 universe required;
-   exactly 30-member coverage where claimed;
-   mixed scoring methodologies rejected;
-   non-members excluded;
-   Stage 0/hard veto/residual-risk restrictions preserved;
-   LOW confidence excluded from actionable investable ranking;
-   missing/blocking evidence excluded;
-   category gates enforced;
-   M4 required-return assessment is consumed, not recalculated by M3;
-   portfolio constraint can block allocation without rewriting
    fundamental score;
-   accounting-blocked portfolio state blocks portfolio-aware ranking,
    not valid issuer score.

### Ranking clusters/ties

Current implementation groups scores within a two-point cluster and uses
controlled tie-breaks. M7 must independently verify the approved ranking
contract before accepting this behavior.

Boundary tests include:

-   84/82/80;
-   83/82/81;
-   82/81;
-   82/80;
-   82/79;
-   exact equal scores;
-   positions 9--12 in the same boundary cluster.

A Top-10 display cutoff must not imply economic superiority when a
boundary tie/cluster spans the cutoff.

## 15. Expected-return tie-break firewall

Expected return may be used as a tie-break only when approved
comparability requirements are satisfied.

Validate that differing:

-   model confidence;
-   assumption basis;
-   aggressive multiple expansion;
-   downside dominance;

prevent a superficially higher expected-return number from winning
automatically.

M3 must not recalculate M4's required-return hurdle.

## 16. Metamorphic tests

**SM-01 Timing-overlay invariance:** change only technical/money flow →
score unchanged.

**SM-02 Portfolio invariance:** change only investor cash/cost/P&L →
issuer score unchanged.

**SM-03 Evidence removal monotonicity:** removing required evidence
cannot improve validity/confidence.

**SM-04 Sector-label integrity:** changing sector without corresponding
approved economic translation cannot preserve a falsely valid score.

**SM-05 Future-evidence invariance:** adding evidence published after
cutoff cannot change AS-KNOWN score.

**SM-06 Method immutability:** later methodology cannot mutate old
artifact.

**SM-07 Input-order invariance:** evidence order cannot change result.

**SM-08 Duplicate-evidence invariance:** duplicating the same fact
cannot increase score.

**SM-09 Price-only non-valuation case:** price movement without changed
approved valuation economics cannot mechanically change non-price
categories.

**SM-10 Peer drift:** moving company to a more favorable peer set
without approved classification/version must fail.

## 17. Mutation tests

Where practical, deliberately mutate validation copies of implementation
logic:

-   category weight +1;
-   gate threshold ±1;
-   reverse conservative threshold inclusivity;
-   allow missing as zero;
-   permit technical field;
-   disable double-count check;
-   use current sector historically;
-   permit future evidence;
-   multiply total by confidence;
-   sort ranking by investor gain.

The M7 suite must kill these mutations. A suite that cannot detect them
is insufficient even if normal tests pass.

## 18. Evidence requirements

Each release-critical scoring case retains:

-   Case ID;
-   governing rule ID and frozen hash;
-   implementation SHA;
-   methodology ID/hash;
-   sector/peer-set version;
-   input fixture/hash;
-   as-of/availability timestamps;
-   independent Expected calculation;
-   Actual;
-   Difference;
-   PASS/FAIL;
-   score validity/confidence;
-   logs/artifacts;
-   reviewer/time;
-   issue/remediation.

Gate 4 requires E3 evidence for Critical scoring rules.

## 19. Gate 4 PASS/FAIL

### PASS requires

-   100-point architecture exact;
-   all category/subcategory maxima correct;
-   all approved gates/boundaries correct;
-   missing/stale/conflicting behavior correct;
-   sector normalization economically equivalent without weight drift;
-   peak/trough normalization symmetric;
-   double-count controls pass;
-   corporate-action comparability pass;
-   score independent of technical/portfolio/cost-basis shortcuts;
-   ranking separate from scoring;
-   tie/boundary semantics correct;
-   independent golden scorecards match Actual;
-   required mutations are detected;
-   zero unresolved Critical/Major scoring defects.

### FAIL if

-   score can exceed constitutional bounds;
-   wrong weights/gates materially alter eligibility/rank;
-   missing evidence fabricates points;
-   sector structure creates systematic inappropriate bias;
-   future evidence enters score;
-   high score overrides veto/gate;
-   technical/portfolio P&L/cost basis changes fundamental score;
-   same evidence receives prohibited duplicate credit;
-   ranking silently changes score;
-   Top 10 is presented as mandatory capital deployment;
-   production code and oracle disagree materially.

## 20. Current source-review findings

**SC-F01 --- M3 document metadata inconsistency.** `SCORING_ENGINE.md`
repository header still says Draft v0.2 although project governance
approved the M3 baseline. **Major governance risk if header is used as
methodology authority.** Use frozen M7 manifest/hash + approval
evidence.

**SC-F02 --- Production tests contain strong anti-shortcut coverage.**
Existing tests reject technical/money-flow/cost-basis injection, future
evidence, missing-data fabrication, double counting, sector backfill and
mixed methodologies. **Supporting evidence only**, not Gate 4
certification.

**SC-F03 --- Current ranking code hard-codes BQ13/FH8/RG5/VAL10 and
two-point clusters.** These are implementation facts, not
self-validating requirements. M7 must verify them against the frozen
approved ranking methodology.

**SC-F04 --- Current tests include a synthetic 82/100 scorecard across
sectors.** Useful regression evidence, but the M7 independent golden
oracle must not import production rubric constants.

**SC-F05 --- Cyclical normalization is explicitly tested for peak/trough
handling.** The TRACEABILITY_MATRIX obligation remains open until an
independent paired oracle demonstrates symmetric economic treatment.

## 21. Multi-role review

-   **CIO --- PASS:** score remains subordinate to investment thesis,
    risk veto and decision engine.
-   **Independent Model Validator --- PASS:** oracle independence,
    adversarial cases and mutation testing can falsify implementation.
-   **Quantitative Analyst --- PASS:** thresholds, units, normalization,
    peer sets and cycle symmetry are explicitly testable.
-   **Equity Research Analyst --- PASS:** sector-equivalent economics
    preserve fundamental meaning.
-   **Risk Manager --- PASS:** high score cannot compensate for veto,
    missing evidence or category failure.
-   **QA Lead --- PASS:** structural, boundary, metamorphic and mutation
    suites close major false-confidence paths.

**Critical unresolved in this validation specification: 0.**\
**Major unresolved in this validation specification: 0.**

Gate 4 is **not yet declared PASS**. Formal execution against the frozen
M7 implementation with independent Expected-vs-Actual evidence is still
required.

## 22. Approval Gate

**Document state:** `BASELINE CANDIDATE — READY FOR USER APPROVAL`

On explicit approval:

1.  promote `SCORING_VALIDATION.md` to **Approved Baseline v1.0**;
2.  proceed only to `07_VALIDATION/DECISION_ENGINE_VALIDATION.md`;
3.  do not begin Portfolio/DCA/Risk validation early;
4.  do not begin historical validation.
