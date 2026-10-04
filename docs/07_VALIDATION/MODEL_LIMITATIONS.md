# VN30 Value Investing OS --- Model Limitations

**Document:** `07_VALIDATION/MODEL_LIMITATIONS.md`\
**Milestone:** M7 --- System Validation & Investment Logic Verification\
**Status:** Baseline Candidate --- Awaiting User Approval\
**Version:** 0.1\
**Date:** 2026-10-04\
**Parents:** Approved M7 validation documents through
`PAPER_PORTFOLIO_PLAN.md` v1.0

## 1. Purpose

Maintain a transparent register of what VN30 Value Investing OS does
**not** currently prove, cannot reliably know, intentionally does not
do, or still requires validation evidence for.

A limitation is not automatically a defect.

Conversely, a missing validation result must never be presented as a
validated capability.

## 2. Classification

Each item is classified as one of:

-   **DESIGN CONSTRAINT** --- intentional scope/policy boundary;
-   **DATA LIMITATION** --- source coverage, timing, quality or
    provenance constraint;
-   **MODEL LIMITATION** --- investment-model simplification or
    uncertainty;
-   **VALIDATION DEPENDENCY** --- specified behavior not yet
    independently execution-proven;
-   **OPERATIONAL LIMITATION** --- real-world execution/integration not
    validated;
-   **GOVERNANCE LIMITATION** --- approval/version/evidence dependency;
-   **KNOWN DEFECT** --- confirmed incorrect implementation behavior.

Severity is separate:

-   Critical;
-   Major;
-   Minor;
-   Informational / inherent uncertainty.

## 3. Release interpretation

The register must distinguish:

-   `OPEN — BLOCKING`
-   `OPEN — NON-BLOCKING`
-   `ACCEPTED LIMITATION`
-   `RESOLVED — RETAINED FOR AUDIT`

"Accepted" means consciously tolerated within defined use, not
technically solved.

## 4. Investment-return uncertainty

**ML-01 --- 15--20% annual return is aspirational, not validated.**\
Class: MODEL LIMITATION\
Status: ACCEPTED LIMITATION

The OS cannot guarantee or currently prove 15--20% annualized return.
Historical validation has not executed and forward evidence has not
matured.

No release statement may imply guaranteed alpha or return.

## 5. Historical validation unavailable

**ML-02 --- Historical PIT validation is BLOCKED / NOT EXECUTED.**\
Class: VALIDATION DEPENDENCY\
Status: OPEN --- BLOCKING for historical-performance claims

`HISTORICAL_RESULTS.md` v1.0 contains no CAGR, alpha, max drawdown or
simulated historical trade result because deterministic prerequisite
evidence and a frozen historical Dataset Manifest are not yet
sufficient.

Gate 7 remains NOT ENTERED.

## 6. Real-data operational acceptance

**ML-03 --- Real-data operational acceptance is not validated.**\
Class: OPERATIONAL LIMITATION\
Status: OPEN --- BLOCKING for production-grade real-data certification

M6 completed product/integration work with documented limitations, but
M7 has not independently certified end-to-end operation using a
production-quality real VN30 dataset.

Synthetic/golden success cannot be described as real-data acceptance.

## 7. Deterministic M7 execution evidence

**ML-04 --- M7 specifications are stronger than current independent
execution evidence.**\
Class: VALIDATION DEPENDENCY\
Status: OPEN --- BLOCKING for final release certification

Accounting, Data, Scoring, Decision, Portfolio/DCA and Risk validation
documents define independent oracles and adversarial tests, but formal
E3 Expected-vs-Actual execution packages remain required before their
gates can be declared PASS.

## 8. Flow-adjusted drawdown

**ML-05 --- Flow-adjusted drawdown requires independent execution
proof.**\
Class: VALIDATION DEPENDENCY\
Status: OPEN --- BLOCKING for certified drawdown analytics

Contributions/withdrawals must not masquerade as performance.

Until independent cases prove the approved timing convention, drawdown
analytics used in release claims remain provisional.

## 9. Historical fundamental availability

**ML-06 --- Publication/availability timestamps may be incomplete
historically.**\
Class: DATA LIMITATION\
Status: OPEN --- potentially blocking by period

Financial reporting periods are not equivalent to dates the information
became investable knowledge.

Where reliable availability cannot be established, the observation must
be excluded, conservatively delayed or explicitly limited.

## 10. Restatements and revisions

**ML-07 --- AS-KNOWN historical reconstruction depends on revision
lineage.**\
Class: DATA LIMITATION\
Status: OPEN

Later restatements/corrections cannot be injected into earlier
decisions.

Where source systems do not preserve old versions, exact AS-KNOWN
reconstruction may be impossible for affected periods.

## 11. Historical VN30 membership coverage

**ML-08 --- Exact historical constituent coverage must be evidenced.**\
Class: DATA LIMITATION\
Status: OPEN

The model supports TRUE/FALSE/UNKNOWN membership and effective-dated
history, but a historical run requires actual COMPLETE_CONFIRMED
coverage.

Current VN30 membership cannot substitute for missing history.

## 12. Security identity history

**ML-09 --- Historical ticker/name changes and corporate identity events
require durable mapping.**\
Class: DATA LIMITATION\
Status: OPEN

Ticker-based ingestion can be ambiguous. Unresolved identity blocks
historical evidence rather than permitting a guess.

## 13. Historical sector classification

**ML-10 --- Current sector classification cannot safely substitute for
historical sector truth.**\
Class: DATA LIMITATION\
Status: OPEN

Sector changes affect normalization and concentration. Historical use
requires effective-dated classification evidence.

## 14. Benchmark comparability

**ML-11 --- VN30 price-return and total-return series are not
interchangeable.**\
Class: MODEL/DATA LIMITATION\
Status: ACCEPTED LIMITATION with required disclosure

A dividend-receiving portfolio compared with price-only VN30 has a
methodology mismatch.

Every performance claim must disclose benchmark return type and
comparability.

## 15. Benchmark corrections

**ML-12 --- Historical benchmark revisions require version lineage.**\
Class: DATA LIMITATION\
Status: OPEN

AS-KNOWN and AS-REVISED benchmark views may differ. Corrected
observations cannot silently rewrite prior validation artifacts.

## 16. Corporate actions

**ML-13 --- Unsupported or ambiguous corporate actions can invalidate
NAV history.**\
Class: DATA/OPERATIONAL LIMITATION\
Status: OPEN by event

Splits, rights, spin-offs, mergers, special distributions and unusual
actions require exact economic treatment. Unsupported material events
block affected validation periods.

## 17. Transaction-cost realism

**ML-14 --- Paper/historical transaction costs are model assumptions
unless sourced as effective-dated facts.**\
Class: MODEL LIMITATION\
Status: ACCEPTED with disclosure

Fees, taxes, slippage and liquidity can change over time.

Historical/paper results must disclose the convention and must not claim
broker-exact execution unless proven.

## 18. Market liquidity and market impact

**ML-15 --- The OS does not model institutional-scale market impact.**\
Class: DESIGN CONSTRAINT\
Status: ACCEPTED LIMITATION

At the user's current capital scale and minimum-lot context, this is
normally less material than for large institutional portfolios, but the
model is not a general institutional execution simulator.

## 19. Execution price uncertainty

**ML-16 --- Decision merit does not guarantee achievable fill price.**\
Class: MODEL/OPERATIONAL LIMITATION\
Status: ACCEPTED

Gaps, halts, auction behavior and fast markets may cause realized
execution to differ from modeled execution.

## 20. No automatic trading

**ML-17 --- The system is decision support, not an autonomous trading
authority.**\
Class: DESIGN CONSTRAINT\
Status: ACCEPTED

No validation result authorizes automatic broker execution.

Human authorization and operational controls remain required.

## 21. VN30-only opportunity set

**ML-18 --- The mandate intentionally excludes non-VN30
opportunities.**\
Class: DESIGN CONSTRAINT\
Status: ACCEPTED

Opportunity cost is evaluated within the mandate plus cash. The OS
cannot claim globally optimal security selection.

## 22. Index composition dependency

**ML-19 --- VN30 reconstitution can force a mandate distinction between
current eligibility and legacy ownership.**\
Class: DESIGN CONSTRAINT\
Status: ACCEPTED

Index exit blocks new capital but does not by itself prove the business
should be immediately sold.

## 23. Small-NAV / board-lot distortion

**ML-20 --- Board lots can create temporarily concentrated
portfolios.**\
Class: MODEL/OPERATIONAL LIMITATION\
Status: ACCEPTED only under approved exception governance

A 100-share/effective lot may be economically indivisible relative to
NAV.

Small-NAV exceptions are not target allocations and cannot bypass
emergency ceilings or approval requirements.

## 24. Cash drag

**ML-21 --- Value discipline can create long periods of high cash.**\
Class: DESIGN CONSTRAINT\
Status: ACCEPTED

The OS explicitly allows HOLD CASH when opportunities are inadequate or
unaffordable.

This may underperform a rising market and is not automatically a model
failure.

## 25. Concentration versus diversification

**ML-22 --- VN30-only and value selection can create sector/factor
concentration pressure.**\
Class: MODEL LIMITATION\
Status: ACCEPTED subject to Risk Policy

Formal sector limits cannot capture every hidden economic factor.
Qualitative factor evidence remains necessary.

## 26. Correlation instability

**ML-23 --- Historical correlation is not stable structural truth.**\
Class: MODEL LIMITATION\
Status: ACCEPTED

Hidden-factor review should not rely on one estimated correlation
coefficient as permanent truth.

## 27. Intrinsic-value uncertainty

**ML-24 --- Intrinsic value is an estimate, not an observable fact.**\
Class: MODEL LIMITATION\
Status: INHERENT / ACCEPTED

Forecasts of normalized earnings, growth, margins, reinvestment and
required return can be wrong.

The scoring/decision framework reduces single-metric dependence but
cannot eliminate estimation error.

## 28. Cyclical normalization

**ML-25 --- Normalized economics for cyclical businesses remain
judgment-sensitive.**\
Class: MODEL LIMITATION\
Status: OPEN validation dependency + inherent uncertainty

Sector normalization reduces structural bias but cannot perfectly
identify cycle peaks/troughs.

M7 scoring validation requires independent cyclical paired cases.

## 29. Bank/non-bank comparability

**ML-26 --- Financial institutions require sector-specific metric
translation.**\
Class: MODEL LIMITATION\
Status: ACCEPTED with methodology controls

Weights should remain governed, but identical raw metrics are not always
economically meaningful across banks and industrial companies.

## 30. Qualitative governance risk

**ML-27 --- Governance quality cannot be fully reduced to deterministic
numeric inputs.**\
Class: MODEL LIMITATION\
Status: ACCEPTED

Material governance/accounting-integrity evidence may require analyst
judgment and source verification.

Hard-veto authority must still be evidence-based.

## 31. Data confidence

**ML-28 --- Confidence classification does not eliminate unknown
unknowns.**\
Class: MODEL LIMITATION\
Status: INHERENT

MEDIUM/HIGH confidence means evidence meets defined standards, not that
the thesis is certain.

LOW confidence blocks normal new capital but cannot guarantee that
higher-confidence conclusions are correct.

## 32. Technical analysis scope

**ML-29 --- Technical analysis is intentionally limited to entry/timing
support.**\
Class: DESIGN CONSTRAINT\
Status: ACCEPTED

Technical signals cannot create the long-term thesis, override
valuation, override risk or independently authorize ownership.

## 33. Market/money-flow scope

**ML-30 --- Market/money flow is contextual, not permanent fundamental
score.**\
Class: DESIGN CONSTRAINT\
Status: ACCEPTED

Short-term flow signals may improve execution context but are not proof
of intrinsic value.

## 34. Behavioral controls

**ML-31 --- Behavioral-bias detection cannot guarantee unbiased human
decisions.**\
Class: MODEL LIMITATION\
Status: ACCEPTED

The OS can flag FOMO, anchoring, loss aversion, action bias and
disposition effects, but user judgment remains part of the process.

## 35. Long feedback horizon

**ML-32 --- A 5--10+ year strategy has slow empirical learning.**\
Class: MODEL LIMITATION\
Status: INHERENT

Short forward-validation windows can test process and controls but
cannot establish long-term alpha.

## 36. Regime dependence

**ML-33 --- Model behavior may vary materially across market regimes.**\
Class: MODEL LIMITATION\
Status: ACCEPTED / requires ongoing validation

A model robust in one credit, rate or liquidity regime may behave
differently in another.

Regime analysis diagnoses this but must not become cherry-picking.

## 37. Tail events

**ML-34 --- Extreme political, legal, fraud, exchange, liquidity or
macro events may exceed modeled scenarios.**\
Class: MODEL LIMITATION\
Status: INHERENT

Risk controls reduce exposure but cannot guarantee portfolio drawdown
remains below \~20%.

## 38. Drawdown target

**ML-35 --- \~20% drawdown is a governance target, not a guarantee.**\
Class: MODEL LIMITATION\
Status: ACCEPTED

The OS must not represent it as a hard promise or mechanical stop-loss.

## 39. Required-return estimates

**ML-36 --- Expected return / IRR estimates are model-dependent.**\
Class: MODEL LIMITATION\
Status: INHERENT

The 15% normal hurdle and exceptional floor rules discipline decisions
but do not guarantee realized returns.

## 40. Opportunity-cost estimates

**ML-37 --- Opportunity cost depends on contemporaneous
comparability.**\
Class: MODEL LIMITATION\
Status: ACCEPTED

Stale or incomplete comparator evidence can require refresh/review/HOLD
CASH rather than a forced switch.

## 41. Valuation-only switching

**ML-38 --- Switching superiority can be uncertain after friction and
estimation error.**\
Class: MODEL LIMITATION\
Status: ACCEPTED

A valuation-only SELL/REDUCE requires a robust switching hurdle; small
estimated differences should not create excessive turnover.

## 42. Ranking interpretation

**ML-39 --- Rank is relative, not absolute investment merit.**\
Class: DESIGN CONSTRAINT\
Status: ACCEPTED

Rank #1 can still be AVOID/HOLD CASH if hard gates or valuation/risk
conditions fail.

Top 10 is display, not allocation authority.

## 43. Score precision

**ML-40 --- A 100-point score is a structured decision aid, not a
continuous measure of truth.**\
Class: MODEL LIMITATION\
Status: ACCEPTED

Small score differences can reflect discretization and should not be
interpreted as exact differences in intrinsic value or future return.

## 44. Threshold discontinuity

**ML-41 --- Policy thresholds create deliberate discrete changes near
boundaries.**\
Class: DESIGN CONSTRAINT\
Status: ACCEPTED

Boundary tests ensure determinism, but economic reality itself is
continuous. Human review remains important near material thresholds.

## 45. Data-source dependency

**ML-42 --- The system's quality is bounded by source reliability and
timeliness.**\
Class: DATA LIMITATION\
Status: INHERENT

Fail-closed behavior prevents invented facts but can reduce
actionability when sources are incomplete.

## 46. Repository baseline metadata

**ML-43 --- Some historical repository documents contain status/version
metadata inconsistent with user-approved baseline state.**\
Class: GOVERNANCE LIMITATION\
Status: OPEN --- must be controlled by Baseline Manifest

Filename/header text alone is insufficient evidence of approval.

Formal validation must pin approved version, approval evidence and blob
hash.

## 47. Prior M6 evidence

**ML-44 --- M6 tests are supporting evidence, not independent M7
proof.**\
Class: GOVERNANCE/VALIDATION LIMITATION\
Status: ACCEPTED RULE

A production test cannot serve as both implementation and independent
Expected oracle where independence is required.

## 48. Paper portfolio evidence

**ML-45 --- Paper validation has not yet accumulated forward
observations.**\
Class: VALIDATION DEPENDENCY\
Status: OPEN

`PAPER_PORTFOLIO_PLAN.md` defines the protocol only.

No forward CAGR, decision hit rate or long-term alpha may currently be
claimed.

## 49. Real portfolio transferability

**ML-46 --- Paper results may differ from actual investor
behavior/execution.**\
Class: OPERATIONAL/MODEL LIMITATION\
Status: ACCEPTED

Real fills, taxes, timing, missed orders, emotions and discretionary
overrides can diverge from paper behavior.

## 50. Model change risk

**ML-47 --- Future methodology changes break direct comparability unless
versioned.**\
Class: GOVERNANCE LIMITATION\
Status: ACCEPTED with control

Every model/rule change must have an effective version and prospective
validation. Historical artifacts remain pinned to the methodology that
produced them.

## 51. Automation risk

**ML-48 --- Automation can reproduce an error consistently.**\
Class: OPERATIONAL LIMITATION\
Status: ACCEPTED with controls

Determinism is not correctness. Independent oracles, mutation tests,
audit artifacts and human review remain necessary.

## 52. Limitation-to-claim matrix

  -----------------------------------------------------------------------
  Claim                               Current allowed statement
  ----------------------------------- -----------------------------------
  "System implements documented       Supported at M6 level; M7
  architecture"                       independent execution still
                                      required

  "Accounting is independently        NOT YET
  validated"                          

  "PIT data is independently          NOT YET
  validated"                          

  "Scoring is independently           NOT YET
  validated"                          

  "Decision Engine is independently   NOT YET
  validated"                          

  "Portfolio/DCA/Risk is              NOT YET
  independently validated"            

  "Historical performance is          NO --- BLOCKED / NOT EXECUTED
  validated"                          

  "15--20% CAGR is validated"         NO

  "Max drawdown will stay \<=20%"     NO

  "Paper portfolio proves alpha"      NO

  "Ready for autonomous trading"      NO

  "Can be used as a structured        Subject to final M7 release
  decision-support research system"   conclusion and stated limitations
  -----------------------------------------------------------------------

## 53. Release-critical open items

The final M7 report must not issue an unrestricted validated release
while these remain blocking:

1.  deterministic M7 execution gates not formally evidenced;
2.  flow-adjusted drawdown not independently proven;
3.  real-data operational acceptance not validated;
4.  historical validation blocked/not executed;
5.  historical Dataset Manifest absent for Gate 7;
6.  paper forward evidence not yet accumulated.

Some items may justify `DO NOT RELEASE` or a tightly bounded
`RELEASE WITH DOCUMENTED LIMITATIONS`; the final independent review must
decide without weakening gate definitions.

## 54. Monitoring and retirement

A limitation can be retired only when:

-   objective evidence addresses it;
-   the relevant validation case passes;
-   issue/remediation is documented;
-   affected artifacts are re-run if necessary;
-   status becomes `RESOLVED — RETAINED FOR AUDIT`.

Never delete the historical limitation record.

## 55. Multi-role review

-   **CIO --- PASS:** return and drawdown aspirations are not
    misrepresented as guarantees.
-   **Portfolio Manager --- PASS:** operational constraints and cash/lot
    effects are explicit.
-   **Equity Research Analyst --- PASS:** intrinsic-value and
    qualitative judgment uncertainty are disclosed.
-   **Independent Model Validator --- PASS:** unvalidated capability is
    not promoted to validated capability.
-   **Quantitative Analyst --- PASS:** benchmark, regime and statistical
    limitations are explicit.
-   **Data Engineer --- PASS:** PIT, revision and identity limitations
    are visible.
-   **Risk Manager --- PASS:** drawdown/tail/concentration uncertainty
    is not hidden.
-   **Behavioral Finance Reviewer --- PASS:** human bias remains
    recognized.
-   **QA Lead --- PASS:** open vs accepted vs resolved states are
    auditable.

**Critical unresolved in this limitation specification: 0.**\
**Major unresolved in this limitation specification: 0.**

This statement evaluates the quality of the **limitation
specification**, not the unresolved validation dependencies listed
within it.

## 56. Approval Gate

**Document state:** `BASELINE CANDIDATE — READY FOR USER APPROVAL`

On explicit approval:

1.  promote `MODEL_LIMITATIONS.md` to **Approved Baseline v1.0**;
2.  proceed only to `07_VALIDATION/FINAL_VALIDATION_REPORT.md`;
3.  final report must incorporate all blocking limitations without
    softening their status;
4.  final release state must follow evidence, not project-completion
    pressure.
