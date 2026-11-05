# DFR-05 readiness plan — proposal only

Baseline: `4e718504b460c27fbf5d95bd6f0a442d8d87923b`. **READY FOR OWNER REVIEW; NOT AUTHORIZED TO IMPLEMENT.** This document proposes a reusable research pipeline capable of covering an owner-approved retained 30-issuer VN30 universe. This task creates no pipeline code, new issuer dossier, source acquisition or assessment. The six pilot outputs remain the preserved regression contract.

## Scope and gates

Proposed work is divided into independently authorized packages below. Approval must identify package IDs, exact universe identity/date/reference hash, source authority, bounded batch/output limits and acceptance criteria. Approval of a package need not resolve every deferred research or valuation topic. Data gaps may remain explicit; engineering success cannot be represented as completed investment assessment.

| Package | Proposed deliverable after authorization | Dependency | Exit / stop |
|---|---|---|---|
| P1 Contract and retained-source inventory | Deterministic source adapters, dependency graph and exact disposition contract; six-pilot parity first | Explicit implementation authorization; unchanged M3 bands/weights; pinned DFR01–04 inputs | Pass pilot replay before any additional issuer processing; stop on global schema/unit/identity drift |
| P2 Sector routes and extension | One owner-approved dated list of 30; explicit route for each member; retained-input processing in at most four additional batches of six | P1 parity and sector-route review; no automatic latest universe | Stop each batch for validation; isolate local gaps, stop shared defects; no claim of 30 assessed scorecards |
| P3 Retained-topic products | Reusable obligations/availability, action/scope, common-owner and investment-cohort reconciliation products | Named unresolved fields and eligible retained sources | Assess only complete rubric topics after preparation/challenge; otherwise retain exact blocker, without another generic closure phase |
| P4 New nonfinancial evidence, optional | Qualify specifically approved external topic evidence | Separate owner source-scope approval | Existing proposal is six pilots only, maximum20 documents overall, two issuer documents per pilot and two per five sectors; not a 30-issuer source authority. Stop at cap or out-of-policy redirect/source |
| P5 Conditional valuation, optional | Sector-specific research valuation with fully specified market/share/actions and economic assumptions | Separate owner cutoff/source/assumption choices and compatible qualified inputs | Defer entire dependent valuation rubric if inputs incompatible or absent; no default date, shares, price or rates |
| P6 Research handover | Versioned provisional dossiers, dispositions, evidence ledger, challenge and validation manifest | Package-specific tests and owner review | Stop at research handover. Formal scoring, ranking, decisions, DCA, NAV and ledger are excluded |

No batch or package starts in this task. All proposed reviewer roles are responsibilities, not appointments or approvals.

## Reusable financial metrics and evidence flow

Reuse `data/manual-extracted-pdf/`, its `notes/`, `data/manual-extracted-api/`, `data/combine/` and prior DFR provenance. Reuse DFR02 metric selection/calculation logic and DFR03/04 complete-topic validators, preparation/challenge rules and production rejection fixtures. Separate extraction, qualification, computation and judgment; coverage is not topic sufficiency. Do not rerun the old closure builder against its hardcoded historical HEAD or reseal historical outputs.

Proposed source identity: provider/document hash + issuer + native concept/code and occurrence + period/window + scope + unit + revision. Preserve original decimal strings, captions, raw cells, exact JSON Pointers and PDF path/physical-page/boxes. Retain every capture variant; no latest-wins selection. Unknown units, ambiguous columns, explicit null, missing and printed dash remain distinct from numeric zero. Verified numeric PDF values, including zero, take priority; CaféF provides labelled fallback/crosscheck only when dimensions are compatible. OCR candidates do not become qualified facts automatically. Unknown publication timestamps stay null.

Use exact decimal arithmetic with explicit unit conversion factors and rounding policy for displayed derived values. A metric records kind (reported/derived/assumption/estimate), original operands, dimensions, formula, dependencies and disposition. FY2022–FY2025 comparisons require aligned annual windows, issuer scope, revision and units; YTD/quarterly data, scope changes, restatements and corporate actions require explicit bridges. A reported group trend does not establish comparable per-share owner growth.

Reuse qualified evidence by hash and exact topic eligibility. A document/page used by one issuer/rubric is not a universal qualitative assertion. Distinguish source candidates from qualified topic proof, reported facts from conditional estimates, and pipeline availability from formal admission. Changed/conflicting sources invalidate only dependent metrics, topic bindings and rubrics; shared mapping defects stop the shared path.

## Sector-specific routes

Use existing `src/domain/scoring/methodology.ts`, `methodology/sectors.ts` and `src/domain/fundamentals/sector-requirement-templates.ts` as unchanged constraints. Financial admission templates explicitly do not establish full scoring sufficiency. Review each issuer's actual sector and reporting scope; do not force consumer, conglomerate or insurance cases through an unrelated approved template.

| Route | Required economic lens and reuse | Additional topic gaps that remain explicit |
|---|---|---|
| Bank — BID pilot | Loan groups, provision roll-forward, cash/accrual interest, deposits, regulatory CAR/Tier1 distinct from book equity | Collateral recoveries, behavioral maturity and capital deductions; no industrial CFO/FCF shortcut |
| Securities — TCX pilot | Margin/AFS/HTM exposures, pledged investments, credit/market/FX risks and borrowing cash-flow ladder | Collateral stress recovery, hedge/rollover terms and action-adjusted shares; expected sale proceeds are not free cash |
| Technology — FPT pilot | Service/contract recognition, cash collection and telecom funding; FTEL scope bridge | Constant-scope annual cash/earnings, customer/concentration evidence and realized reinvestment returns |
| Consumer/dairy — VNM pilot | Price/volume, deposits, operating cash and actual JV outcomes; consumer route must be explicitly mapped within approved taxonomy | Independent competition/cost/share evidence and complete investment cohorts; do not infer a moat from margins |
| Property — VHM pilot | Handover cycle, advances/cooperation receivables, project restrictions/pledges, NCI/common-owner waterfall | Full project obligations, unrestricted funds and common-owner realization; group CFO is not group FCFE or parent cash |
| Diversified/property/EV — VIC pilot | Segment and scope bridges, creditor puts/support and encumbrances; no pure-property simplification | Segment common-owner losses, contingent support and sustainable investment outcomes |
| Other retained sectors | Industrial, materials, utilities, energy and retail use separately checked sector requirements and issuer definitions | Working-capital/cycle, maintenance capex, regulation/commodity exposures and cohort returns require appropriate proof; no pilot crosswalk by equal amounts |
| Unsupported/ambiguous route | Explicit sector/definition blocker, e.g. where no approved insurance/conglomerate admission template exists | Owner/methodology review required; fail closed instead of inventing a template, bands or weights |

## Deferred output contract and preserved assessment policy

Keep RESEARCH_PROVISIONAL and separate financial dispositions (READY_FOR_REVIEW, SUPPORTED, REFERENCE_ONLY, CONFLICT, MISSING) from rubric topic readiness and assessment status. READY_FOR_ASSESSMENT requires every approved topic to have qualified same-issuer support and counterevidence. Missing topics, analyst judgment, material conflicts and valuation/market dependencies retain exact fields and a concrete reopen trigger. NOT_APPLICABLE is permitted only by an explicit approved methodology clause; never use it to remove a weight.

Only complete-topic assessments receive an unchanged M3 band and allowed points, issuer-specific evidence/counterevidence, assumptions, confidence and invalidation. Preserve separate preparation/challenge passes; AI self-challenge is not independent human acceptance. Deferred points and incomplete totalScore/ranking/valuation/currentSignal stay null. Never zero-fill, redistribute weights or rank an incomplete research dossier. Thirty issuers ×23 unchanged rubrics would mean690 dispositions only after an approved universe/contract, not690 scores or a current completed output.

Preserve all25 completed pilot assessment objects byte/semantic-equivalent, and all113 deferred dispositions. Do not rerate them to test infrastructure. A later explicitly authorized assessment of a deferred item must create a versioned delta linked to materially new qualified evidence or a completed reconciliation product; the sealed DFR04 record remains unchanged.

## Resolution approach and stop rule

Use the existing113-row register as the backlog, with reusable analytical products across issuers. A retry is permitted only when the required source/contract, owner choice, implemented mapping product or validated signed mapping product is supplied and identified. If the same dependency is unchanged, retain its issue ID and stop that branch. No DFR04.1/04.2-style evidence-closure campaign, repeated inventory, or generated document count qualifies as progress. Report engineering coverage, supported metric count, newly completed rubrics and unresolved blockers separately.

Legacy debt corrections are separate versioned definition bridges (LEG-VIC / LEG-VHM); they are not a pretext to reopen completed provisional research or overwrite DFR02. Formal production acceptance is outside all packages. Proposed checkpoints require the acceptance criteria and issue-register stop conditions before proceeding.
