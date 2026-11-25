# Public Data Proxy Adoption Closure

**Verdict: PASS WITH LIMITATIONS**  
**Date:** 2026-11-25  
**Candidate commit:** `225988bc3fd80abde8c3afb9587c4694aa96736d`  
**Methodology:** `m3-public-data-proxy-v1.0.0`  
**Executable candidate:** `m64-public-data-proxy-candidate-1`

## Approval and scope

The owner approved PX01–PX05, including the reviewed CA-DIL no-event interpretation, and reuse of the 23 public-data routes in the existing scoring skills. The approval identifies audit baseline `eb529bf4f108806aa5142ae360c2b69d2cbd8397`. The original specification was committed at `c9ca610f2417dc7bc09401f2a8effb8213e618de`. The [owner receipt](PUBLIC_DATA_PROXY_OWNER_APPROVAL.json) records the scope and original specification hash. The [Approved Baseline v1.0](PUBLIC_DATA_PROXY_SPECIFICATION_23_RUBRICS.md) is the common route reference. The [canonical registry](../../src/domain/scoring/methodology.ts#L4) continues to control rubric IDs, weights and bands.

D1–D3 are implemented within PX01, PX02 and PX04. PX03 and PX05 carry the separately authorized relative position and dilution interpretations. F5 uses existing packet dispositions for supporting metrics. D4 document-status reconciliation and broad D5 schema changes fall outside the approved work. The unrelated research-only successor remains separate.

## Implementation and candidate boundary

Each proxy binds an evidence-backed review to the existing assessment and topic references. The declaration is a TEXT estimate included in the reviewed input hash. The [candidate validator](../../src/domain/current-scoring/public-proxy-review.ts) checks the declaration, applicable sector controls, supported topic refs, counterevidence review, unresolved material dependencies and the bounded-discovery record. It validates a reviewed claim's structure and ties it to evidence. Economic sufficiency and source authenticity still require the existing preparation, admission and challenge process. A usable declaration by itself cannot satisfy a topic.

| Proxy | Exact candidate behavior | Limits retained |
|---|---|---|
| PX01 FH-LIQ | Checks timed obligations, usable resources, overlap, one explicit covenant disposition, and a BANK funding review when applicable. A bounded nondisclosure disposition cannot support maximum. | An unresolved material trigger, uncertain drawable resources or unbounded due-date gap leaves N/R. |
| PX02 GQ-INC | Checks aligned operands, scope bridge, persistence, independent corroboration and granularity review. BANK must use capital efficiency. RETAIL covers material cohorts or substantiates their immateriality. | No project IRR requirement where issuer productivity is sufficient. A volatile capital denominator or unbounded scope change leaves N/R. |
| PX03 IC-POS | Requires a defined comparator population, matched position, independent cost and distribution. Maximum also requires representative market leadership. | Listed-peer rank is scoped. It cannot establish whole-market leadership on its own. |
| PX04 CA-REINV | Requires event coverage, observed outcomes, allocation linkage, action-scope review and cash CAPEX or BANK capital deployment. The candidate omits the unconditional action gate only for an eligible consolidated outcome review. Any linked share/per-share evidence, action-sensitive metric or its normalization evidence retains the gate, as does a declared per-share or scope-affected assessment. | Existing requests still have their metric-level comparability gates. Unsupported event coverage or allocation attribution leaves N/R. The seven other unconditional action gates are unchanged. |
| PX05 CA-DIL | Requires event coverage and shareholder-protection review. Evidenced harm is compatible with 0; reviewed neutral/accretive economics or a reconciled no-material-dilution window with maximum support can qualify for 1. Event-based paths also need terms, net proceeds, event-aligned value and rights/offsets. | Unresolved event coverage or economics leaves N/R. Silence and mechanical share changes cannot establish the outcome. The action gate remains applicable. |

The [isolated candidate entry point](../../src/domain/current-scoring/public-proxy-candidate.ts) is a deliberate fork of the hash-pinned native scorer. Keeping that fork separate preserves byte-for-byte replay of the existing production implementation. The candidate requires its exact implementation/configuration identities and synthetic scope. It uses the same rubric registry, metric and time validators, range/maximum checks, action rules where applicable, and incomplete-total and risk controls. The only result-level predicate added is proxy eligibility and the scoped action dependency above. Candidate artifacts have a distinct contract and no operational authority. No production route, executable pin, database, stored result or publication was changed.

## Complete public-data route matrix

The [baseline matrix](PUBLIC_DATA_PROXY_SPECIFICATION_23_RUBRICS.md#canonical-input-matrix) owns each route's topics, fields, sources, estimates, maximum conditions, counterevidence and N/R conditions. This table indexes the routes reachable from the common scoring guidance.

| Rubric | Max | Authority / route | Public evidence or analyst output |
|---|---:|---|---|
| BQ-EQ | 8 | Existing proxy | Consolidated normalized returns, economic cost and sector profitability |
| BQ-MOAT | 6 | Existing proxy | Observable competitive mechanism, repeated economics and persistence |
| BQ-CASH | 6 | Existing proxy | Cash realization and total cash CAPEX or bank/property equivalents |
| BQ-RES | 5 | Existing proxy | Public concentration, pricing behavior and stress response |
| FH-BS | 6 | Existing proxy | Sector capital, asset quality, funding and leverage evidence |
| FH-LIQ | 4 | PX01 | Timed liquidity and covenant review |
| FH-STRESS | 5 | Existing model | Independent severe stress with funding and capital response |
| GQ-HIST | 5 | Existing direct | Comparable reports and effective action history |
| GQ-FWD | 5 | Existing model | Public-data growth, funding and execution scenario |
| GQ-INC | 5 | PX02 | Scope-aligned incremental capital productivity |
| IC-IND | 4 | Existing direct | Official demand/competition data and regulation |
| IC-POS | 4 | PX03 | Defined public comparators with cost and distribution corroboration |
| IC-CYCLE | 2 | Existing model | Normalized cycle, asymmetry and survivability |
| VAL-PRIMARY | 8 | Existing model | Approved sector valuation and independent cross-check |
| VAL-RET | 8 | Existing model | Five-year return from eligible price and cash-flow assumptions |
| VAL-MOS | 4 | Existing model | Conservative intrinsic value, downside and balance-sheet evidence |
| RG-GOV | 4 | Existing direct | Governance, audit, related-party and resolution evidence |
| RG-RISK | 4 | Existing model | Bounded exposures, mitigation and distinct residual channels |
| RG-UNC | 2 | Existing model | Sensitivity, assumption dependencies and supported range |
| CA-REINV | 2 | PX04 | Allocated capital, event scope and observed operating outcomes |
| CA-DIST | 1 | Existing direct | Issuer retention, distribution, buyback and resilience |
| CA-DIL | 1 | PX05 | Event economics or verified no-material-dilution coverage |
| CA-PSV | 1 | Existing direct | Comparable normalized per-share outcomes |

Totals reconcile to 23 rubrics, seven categories and 100 points. Five approved additions and all 18 existing routes are documented.

## Skills and stopping rules

All six updated skills point to the same approved reference. The orchestrator keeps one ticker per execution, incremental scoring uses admitted evidence and metrics first, structural N/R closes with a reopening trigger, and evidence coverage tests the alternative before targeted acquisition. S1–S5 routes estimates through the qualified sector. Publication hygiene and its formal handoff keep preparation, scoring authority and publication distinct.

Use sufficient direct evidence or an authorized proxy immediately, then stop searching for the inaccessible original. Construct forecasts, valuations, stress and risk assessments from admitted operands. Preserve existing dispositions for optional metrics and all decision-critical data controls. Allow at most one bounded improvement round. Close with N/R and a precise reopening trigger when no defensible band is supported. The candidate validates recovery rounds and rejects declarations that report searching for the original after sufficient evidence or searching for a company output required only as an analyst model.

## Validation and retained limitations

The focused Node-environment run passed **134/134 tests** in five suites: `public-proxy-candidate`, `scoring`, `scoring-golden`, `scoring-evidence-time` and `scoring-ai-review`. The candidate suite has **23 tests**. Each proxy has positive verified/conservative cases, missing or unresolved evidence cases producing N/R with a null total, and a maximum-precondition rejection. Additional cases cover BANK and RETAIL substitutions, PX01 bounded nondisclosure, PX03 market representation, PX04 legacy/per-share/scope gates, PX05 no-event/harm and coverage, search-stop rules, legacy parity and rejection of formal execution. Fixture data is synthetic. Existing period, risk and evidence control regressions ran alongside the candidate suite.

The repository-wide TypeScript check did not pass. It reported five diagnostics outside candidate files, including two clock type errors in `app/server/acb-bank-admission.ts` and three test imports of retired root scripts. The focused run used a temporary Node/threads Vitest configuration because the default config did not yield a result during validation.

- **VNM:** retained baseline matched its pinned hash. The retained dated cash ladder and CAPEX components support proxy construction, but financing timing and the parent/group capital bridge limit scope. The RETAIL research mapping differs from the INDUSTRIAL diagnostic binding and cannot override the actual scoring sector.
- **ACB:** retained V4 readback matched its pin. The 30-day timing, covenant and collateral overlap, and subsidiary deployment inputs remain constrained. The new BANK routes do not supply these facts.
- **TCB:** retained isolated artifact matched its pin. ESOP issue evidence does not establish the net per-share range where event-value or offsets are unbounded. The retained 20 rated rows remain undisturbed.
- **FPT:** verified V8 readback retained its two rated rows. The retained cash/CAPEX products are constructible, while comparable operating scopes, exact event value and independent cost or share comparisons still limit other proxies.

The [approved reference's retained-data matrix](PUBLIC_DATA_PROXY_SPECIFICATION_23_RUBRICS.md#retained-data-construction-checks) records which components were demonstrated for each issuer. The retained cross-check was read-only and did not treat an existing public field or preview score as a complete approved assessment. No new issuer evidence was collected and no production scores were recalculated.

## Exact changed files and candidate pins

Candidate commit paths:

- `docs/03 SCORING/PUBLIC_DATA_PROXY_OWNER_APPROVAL.json`
- `docs/03 SCORING/PUBLIC_DATA_PROXY_SPECIFICATION_23_RUBRICS.md`
- `skills/equity-s1-s5-assessment/SKILL.md`
- `skills/vn30-evidence-coverage-closure/SKILL.md`
- `skills/vn30-incremental-scoring/SKILL.md`
- `skills/vn30-rollout-orchestrator/SKILL.md`
- `skills/vn30-scoring-publication-hygiene/SKILL.md`
- `skills/vn30-scoring-publication-hygiene/references/formal-scoring-handoff.md`
- `skills/vn30-structural-nr-remediation/SKILL.md`
- `src/domain/current-scoring/public-proxy-candidate.ts`
- `src/domain/current-scoring/public-proxy-review.ts`
- `tests/unit/public-proxy-candidate.test.ts`

This closure report records the completed commit separately.

| Source file | SHA-256 |
|---|---|
| `src/domain/current-scoring/public-proxy-candidate.ts` | `0333e78cfc85963dc28c6ae1d59d8ea207fae9d42ec7ed004c1037f81d8365f1` |
| `src/domain/current-scoring/public-proxy-review.ts` | `84fc3bd779238188b260b167329b032f26712aec8b879ff19e392573ecbf254f` |
| `src/domain/current-scoring/scorecard.ts` | `2bfa9a95660e65c8ab757352284325e720d27ec91c60fdb72af58327138ed16a` |
| `src/domain/current-scoring/action-dependencies.ts` | `abe3d094bbe4483bf39ec7353e4a20ff85adc82243582fb2644cb704e4d75ff9` |
| `src/domain/scoring/methodology.ts` | `e7031bf6b00e38670016888928ceb941e5c3a524016a1f8ce84123aca6c7da41` |
| `docs/03 SCORING/PUBLIC_DATA_PROXY_OWNER_APPROVAL.json` | `0edd2e81d930d4134b6228a80d34a9473ab0a0633130a9c947c7d54437300b5a` |
| `docs/03 SCORING/PUBLIC_DATA_PROXY_SPECIFICATION_23_RUBRICS.md` | `b0e27c9bed0f63942c72dd81494db5be23cd0ce4da720a418a6b42b7b19a7682` |

## Required production approval

The candidate is executable in synthetic scope only. Formal use requires a separate owner-approved activation package binding the final reviewed source graph, release and methodology identities, including the formal adapter's treatment of proxy declarations as reviewed analytical evidence. The activation package must explicitly review the formal-scope integration, revocation, time, dataset and adoption bindings. The synthetic candidate hashes above identify the reviewed implementation work and do not substitute for final production artifact pins.

Each future formal score still needs exact ticker, sector, cutoff, dataset, preparation/challenge and scoring authority. Publication requires separate authority over the resulting persisted artifact. Existing production authority and prior published records remain active in their original scopes.
