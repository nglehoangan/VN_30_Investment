# M6.4 audit and prerequisite-stop report

Date: 2026-09-17. **M6.4 NOT IMPLEMENTED / NOT READY FOR APPROVAL.**

The audit reached the user's missing-rule stop condition before application implementation. Two Major methodology prerequisites are recorded in [CHANGE_REQUESTS.md](CHANGE_REQUESTS.md). This is an audit deliverable, not a completed M6.4 implementation or a replacement scoring model.

## A. Repository audit

Starting commit: `42afdf5 Complete M6.3.1`. Working tree was clean. No scoring/ranking domain, application use case, scorecard store, or maintained M3 golden suite exists in the inspected source tree.

Actual M3 baseline locations differ from the logical paths in the task:

- `docs/03 SCORING/SCORING_ENGINE.md` — seven-category composition, evidence pipeline, accounting firewall, confidence/validity and gates. Header says Draft v0.2 while the final status says approved v1.0 and dependent documents cite approved v0.2; retain content identity when pinning the future methodology, rather than silently selecting a version label.
- `docs/03 SCORING/METRIC_DEFINITIONS.md` — formulas, qualitative assessments, sector substitutions, missing-data and source requirements; final status approved v1.0.
- `docs/03 SCORING/SECTOR_NORMALIZATION.md` — principle-equivalent sector treatment, peer/cycle rules, corporate-action comparability; approved v1.0.
- `docs/03 SCORING/SCORECARD_TEMPLATE.md` — artifact, required narrative/QA and lineage; approved v1.0.
- `docs/03 SCORING/RANKING_RULES_v1.0.md` — separate fundamental/investable/portfolio-aware outputs, gates, tie-break order and Top 10.
- `docs/03 SCORING/VALIDATION_CASES_v1.0.md` — approved behavioral cases, not an already-executed automated golden suite.

Relevant cross-baseline contracts inspected: M1 `SCORING_MODEL_v1.0.md`; M2 `DATA_MODEL.md` scoring ownership, `DATA_RULES.md` historical/time rules, `SECTOR_MASTER.md` assignment/lookup/restatement contracts, and `VN30_MASTER.md` universe/reference contract; M6.1 `ARCHITECTURE_v1.0.md` and `DOMAIN_MODEL_v1.0.md` scoring/ranking and persistence contracts. The authoritative M6.1 directory is under `docs/06_DASHBOARD/`, not its sibling copy.

Existing implementation boundaries:

- ADR 0001 and `scripts/check-boundaries.mjs` enforce inward dependencies for both value and type imports. Pure domain has no external IO/UI dependencies.
- M6.3 `src/domain/portfolio/values.ts` provides exact decimal12 BigInt arithmetic; division uses half-even rounding. No JS floating-point score/financial computation should be introduced.
- `src/domain/portfolio/reference.ts` owns effective-dated reference resolution. M2 assignment intervals are half-open; missing/provisional/current-sector shortcuts cannot establish historical classification.
- `src/application/portfolio/engine.ts` orchestrates derived snapshots via `src/ports/portfolio.ts`. Scoring must consume an application read boundary, never ledger tables or the mutation port.
- `src/domain/portfolio/reconciliation.ts` exposes derived evidence and a conservative actionability block. Field-scoped consumption is needed for the approved cost-basis-only exception.
- `src/domain/methodology/record.ts`, registry ports and the immutable SQLite registry preserve approval/configuration/build identity. A record stores approval evidence; it cannot grant approval.
- Existing migrations cover registry and portfolio ledger only. M6.1 Domain Model §§14–15 describes persisted scorecard/ranking artifacts; no M6.4 schema is introduced before their methodology prerequisites are settled.
- Local Next.js installation guidance was inspected. No Next/React code changed.

## B. Files changed

Only this directory is added:

- `CHANGE_REQUESTS.md`: missing-rubric and near-tie prerequisites with concrete examples and acceptance criteria.
- `IMPLEMENTATION_REPORT.md`: audit, proposed domain mapping, scope and review status.
- `verification-evidence/results.json`: command exit codes, durations and working directories.
- `verification-evidence/*.log`: raw validation outputs, one file per command; see validation summary for exact inventory.
- `verification-evidence/source-comparison.json`: source/config/test equivalence with isolated validation checkout.
- `verification-evidence/VALIDATION.md`: environment, command/test counts and final Git evidence.

No source, tests, package scripts, dependencies, baseline policy, Prisma schema or migration changes. No production methodology is registered. No commit or push.

## C. Approved rule → owner → domain implementation → test mapping

The implementation/test paths below are **proposed, not created or passing**. This mapping does not pretend an audit is executable coverage.

| Approved rule | Owning document/section | Proposed implementation | Required maintained tests |
| --- | --- | --- | --- |
| 25/15/15/10/20/10/5; subcategory decomposition | Engine §§2,4; Metrics §3.5 | `domain/scoring/methodology.ts`, `scorecard.ts`; total only from supported rubric results | VC-001; maxima sum 100; category/subcategory sums |
| Traceable metric formulas and units | Metrics §§2,12,17 | `domain/scoring/metrics.ts`; typed, exact values and pinned observation versions | formula/zero-denominator/unit tests; deterministic replay |
| Bounded point assignment, no evidence-signal shortcut | Engine §§5–6; Metrics §§4.3–4.4 | **Stopped: CR-M64-01** | approved worked rubric fixtures; VC-031/032/034 |
| Sector-equivalent principles, no percentile-only scoring | Sector Normalization §§2–3,5–18 | `domain/scoring/normalization.ts`; versioned peer/cycle context | VC-030–036; peer size <4; bank/CFO prohibition |
| Historical sector and universe | M2 Sector Master §§9–10,17; VN30 Master §§7,9,12 | application reference inputs + existing reference domain | VC-110/111; exact boundary, gaps, overlap, provisional and later revision |
| Missing/stale/conflicting inputs remain explicit | Engine §§9–12; Metrics §§13–15 | `domain/scoring/evidence.ts` and validity gate | VC-020–023; no zero/midpoint/weight redistribution |
| Confidence gates, no numerical haircut | Engine §11; Ranking §§5,14,30.3 | scoring confidence evidence; ranking eligibility | VC-008/045; same total at HIGH/MEDIUM/LOW |
| No compensating category score; veto wins | Ranking §§2–7 | `domain/ranking/eligibility.ts` | VC-004–008; gate equality and below-boundary cases |
| Official near-ties and ordered Top 10 | Ranking §§8–16,22,33 | **Stopped for ambiguous clusters: CR-M64-02** | VC-100–106; chain/band/cutoff and input permutation tests |
| Field-scoped portfolio integrity, no shadow accounting | Engine §3A; Ranking §§18,32; Scorecard §21 | `ports/scoring-context.ts`, application adapter to M6.3 derived result | VC-050–064,120–125; no ledger writes |
| Immutable formal artifact, as-calculated vs recomputed | Scorecard §§24–26; M6.1 Architecture AP-8, Domain §§14–15 | application orchestration + append-only artifact port/adapter | VC-090–093,110–114,124; later method/evidence cannot overwrite prior result |
| Corporate actions, no duplicated economic channel | Metrics §3A; Sector §§19–20A; Scorecard §§17–18 | versioned issuer comparability/evidence ownership validation | VC-040–045,070–076; use existing M6.3 accounting regressions for VC-080–086 |
| Untrusted input cannot supply formulas, weights or executable method | M6.1 layer/validation rules; immutable methodology | infrastructure strict input schemas + domain invariants; registry allowlist | malformed dates/units/numbers, duplicate/conflicting facts, unknown method, formula/weight injection |
| Score and Top 10 are not decisions | Engine §§1–2; M1 Scoring §§2–3 | no decision-state output or transaction command dependency | high score != BUY; low PE != max; price drop != reason; Top 10 != naive sort |

## D. Scoring evidence

No complete calculated score fixture is claimed. CR-M64-01's **synthetic** CFO 120 / NPAT 100 example yields a mathematical ratio of 1.2 and the documented Strong signal, but cannot lawfully continue to a /6 award without the missing rubric. It is an audit counterexample, not an executed test, real VN30 market data, or an official scorecard. A fabricated complete 100-point demonstration would violate the requested stop condition.

## E. Ranking evidence

The baseline requires a synthetic 90-point LOW-confidence name to be excluded from investable ranking while an otherwise eligible 82-point MEDIUM-confidence name remains eligible (VC-008). A naive descending score sort would lead with 90. This is a required future test expectation, **not an executed M6.4 result**. Ambiguous near-tie cases must be resolved before claiming complete ranking coverage.

## F. Top 10 evidence

No Top 10 has been generated. Future outputs must retain M3 exclusion reasons for failed Stage 0, hard veto, LOW confidence, missing critical evidence, failed category gates, unsupported universe and relevant blocked portfolio state. Fewer than ten eligible names is valid. No invented reason enum or selection rule is registered by this audit.

## G. Validation

See [verification-evidence/VALIDATION.md](verification-evidence/VALIDATION.md) and raw logs. Existing regression execution establishes only the existing baseline's behavior, not M6.4 correctness. There is no dedicated M6.4 test command or new migration. No M3 golden case has been newly ported or claimed green.

## H. Issues

- Critical introduced runtime defects: none identified; no runtime changed. This is not an M6.4 critical-test pass claim.
- **Major unresolved: 2** — CR-M64-01, CR-M64-02. Completion gate fails.
- Minor: Scoring Engine's header/footer/cross-document version labels need consistent identity annotation when the executable method is pinned; no baseline text edited.
- Deferred implementation: scoring evidence/metric/normalization services, formal artifacts and persistence, scoped M6.3 read adapter, official ranking, Top 10 and all maintained M3 tests. They are unimplemented work, not minor completed capabilities.

## I. Scope confirmation

**M6.5+ functionality implemented: NO.**

No Decision States, DCA, trading, transaction posting, broker integration, AI score override, dashboard expansion or performance analytics. M6.4 is not ready for independent implementation approval; the Change Requests are ready for methodology review.

## J. Git evidence

Recorded in the validation summary: `git status --short`, `git diff --stat`, `git diff --check`, `git log -1 --oneline`. New untracked documentation does not appear in ordinary `git diff --stat`; the report's file inventory accounts for it. No files were staged, committed or pushed.
