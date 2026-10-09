# Slice 06 implementation report — 2026-10-09

Authorization: user requested “Implement slice 6”. Baseline HEAD `7090d3a7952f6ce062d46416cea8d8f5c7fd385d` contains the Slice 05 remediation; working tree was clean. The earlier reviewed Slice 05 commit is `86a2755cbca1b4aa502ee1cfc72eb8fba936e0d5`; approved Slice 04 baseline remains `ded76d9d45da0837ab426a24442a4e6ff2eb4cb5`. This implementation instruction authorizes Slice 06 work; it does not create external data/methodology approvals or certify previous review status. No staging, commit or push.

Authority: AGENTS.md, the installed Next route guide, DESIGN_REVIEW.md sections A/D/F/G and Slice 03–05 reports; existing ScoreInput/Evidence/MetricRequest, scoring/golden/sector methodology, canonical registry, derivation and snapshot contracts; DATA_INITIALIZATION.md and INITIAL_SCORING_REPORT.md. No route/UI changes. No skills or delegated agents used.

## Delivered boundary

`ScoringEngine.score(input, selection)` now requires a trusted `ScoringDatasets` capability and `{snapshotRunId, acceptanceId}` for FORMAL. Default engine construction fails closed for FORMAL. The repository independently loads and verifies the sealed snapshot, DI acceptance, exact external review/methodology/requirements binding, reviewed input and computed ticker readiness. The application cannot rely on a caller READY flag. Existing synthetic scoring remains explicitly SYNTHETIC_TEST with TEST_ONLY methodology and no dataset selector. Domain ScoreInput/Evidence/MetricRequest fields, formulas, weights, rubrics and score calculations are unchanged.

The generic analytical artifact repository rejects new FORMAL scorecard writes; the dataset repository atomically writes the immutable domain scorecard and its dataset binding. It independently replays authorization and calculateScorecard, including when invoked directly. A binding failure rolls back the score write. Historical score artifacts remain readable without links; no retrospective readiness binding is invented. Existing ranking application admission checks require a verified binding for FORMAL cards before the unchanged whole-universe ranking rules execute. This is an upstream authority check, not a new ranking policy or ranking run.

## DI acceptance and requirements

`independent-di-acceptance-v1` pins exact snapshot runId/contentHash/manifest digest, approved requirements/hash, scoring methodology hash and universe reference hash. Equal contentHash on another build/run does not transfer review. AS_REVISED is diagnostic and cannot authorize FORMAL scoring. A snapshot with blockers, unknown policy ownership, incomplete required financial coverage or non-30-member universe is rejected.

All DI1–DI15 must be explicitly PASS with evidence references, independent producer/reviewer identities, a review artifact reference and an issue register without unresolved Critical/Major issues. These are externally reviewed inputs; this implementation neither runs nor self-certifies those gates. An independently verified review capability supplied through trusted repository construction pins the exact acceptance hash, reviewer and approval reference. A stored self-authored PASS body, including one with a recomputed hash, does not confer authority.

The existing methodology registry validates canonical metadata on lookup. Acceptance requires an APPROVED/PRODUCTION record with exact approval reference and `configurationReference = di-acceptance-sha256:<acceptanceHash>`. Requirements independently require an APPROVED/PRODUCTION record with exact approval reference and `readiness-requirements-sha256:<requirementsHash>`, with recording/effective chronology. Readiness requirements use the fixed `strict-canonical-m3-readiness-v1` algorithm, approved document references, explicit sector canonical items, required existing MetricIds and required market/valuation observation routes. Required items must resolve to active applicable registry definitions. Industrial substitutes for bank metrics are prohibited; unresolved sector routes remain blocked. No production requirements manifest or approval is seeded.

The immutable acceptance includes reviewed per-security input/bridge packages, or explicit missing-input rows, for exactly the same 30 securities. New score IDs and calculation clocks can reuse the same reviewed investment semantics on that accepted run; every other ScoreInput field must match the reviewed package. The final binding hashes the full actual input, including its execution metadata. Review acceptance must exist at/before calculatedAt. Semantic equality does not transfer review to another snapshot run.

Operational scoring binds asOf to decisionAsOf and knownAt to snapshot systemKnownAt. Combined with the unchanged score-input asOf <= knownAt and snapshot systemKnownAt <= decisionAsOf contracts, this initial operational bridge requires coincident scoring/knowledge cutoffs. Later calculation or independent-review execution cannot enlarge the historical information set. Requirements/methodology knowledge and every underlying observation/adjustment remain cutoff-constrained.

## Strict canonical bridge

The bridge reconstructs financial Evidence and ordered MetricRequests from selected snapshot members/derivations, not provider ratios or caller values. Inputs are reread through existing raw/body/index/revision/derivation integrity owners. The evidence manifest accounts for every input row: canonical facts, governed derived operands or explicitly reviewed external HUMAN/MARKET/VALUATION evidence. HUMAN cannot introduce a numeric reported FACT; market FACT origins have an explicit observation/unit allowlist; valuation remains explicit ESTIMATE/ASSUMPTION. External review pins the complete human/market/valuation package; the bridge does not fetch or independently certify it.

Canonical values remain exact strings; null is rejected as missing, zero stays zero, currency/scopes/periods remain explicit and non-VND monetary values cannot be relabeled or implicitly converted. A selected fact must have valid quality/applicability, known operational availability and exact VERIFIED TIMESTAMP publication. DATE_ONLY and UNKNOWN remain unrepresentable at the existing Evidence boundary, even when Slice 05 can determine a DATE_ONLY operational boundary. No publishedAt is fabricated and signing/fiscal/provider/local clocks do not fill it. A canonical fact must support a registry-governed rubric/topic; it does not assign points.

Derived bridging reuses the existing Slice 04 executable routes (ROE, FCF, CASA, NPL), ordered role values and calculateMetrics. Every constituent must be selected and timestamp-eligible; reviewed normalization and crosswalk knowledge must be known at cutoff. Composite operand publication is the latest exact constituent publication; receivedAt is the conservative operational/adjustment knowledge maximum. Periods, normalization kind, dimensions, currency, confidence and exact formula result are checked. Raw and derived Evidence retain the canonical-item family so existing double-count/channel review cannot be evaded by changing operand labels. Unselected/forged results, stale evidence, later review knowledge and unsupported routes fail closed. No new MetricId, arithmetic formula, automatic normalization judgment or human assessment is introduced.

## All-input readiness

Every accepted universe member receives computed dimensions: universe, market, fundamentals, valuation, flow/technical, confidence, assessments/gates, dataReady, readyForScoring and reproducible blockers. Whole-universe data acceptance does not imply all 30 have human score inputs. Missing-input members retain their fundamental coverage dimension, while market/valuation/input completeness and score readiness remain blocked. Per-ticker market and valuation readiness require the policy-declared observations in explicitly reviewed origin routes; global DI4 alone never marks an input package complete. Supplied inputs additionally undergo strict bridge matching and the unchanged score-input/domain completeness checks.

Human rubric evidence, valuation/expected-return inputs, confidence, critical missing inputs and known external gate assessments remain visible constraints. A known active veto/high risk can be complete evidence while remaining non-actionable under existing scoring rules; readiness grants no investment permission. Flow/technical is NOT_APPLICABLE for the permanent M3 score, with the governing baseline pinned in requirements. No M4 optionality/workflow or technical scoring points are added.

Snapshot manifests retain their original DEFERRED_SLICE_06 marker and bytes: readiness is a separate immutable authorization/binding, not a rewrite of Slice 05 content. Acceptance and binding JSON are versioned, hashed and replayed. Content, run/review and score execution identities remain distinct.

## Additive persistence and migration

Reviewed migration `202610090004_scoring_readiness` adds only:

- `data_initialization_acceptance`: immutable acceptance body/hash, exact snapshot run FK, acceptance time and run/time index.
- `scoring_dataset_binding`: immutable scorecard/input hash, exact run/acceptance FKs, creation time and computed full-universe readiness/authorization body/hash.

All foreign keys restrict deletion/update; UPDATE/DELETE/REPLACE and ON CONFLICT mutation are rejected. Admission checks bind the link to a FORMAL SCORECARD and the acceptance's exact snapshot run and body metadata. Read replay independently verifies transport hashes/indexes, external approval capabilities, snapshot/raw/derivation lineage, computed readiness and the original score calculation. Raw SQL checks do not replace external review verification.

There is no historical backfill, destructive migration, altered old table/trigger, production approval seed or private database operation. Populated Slice 05 upgrade tests retain all old table rows and DDL/triggers, exact snapshot replay and historical score bytes, repeat deployment/status and foreign-key integrity. Earlier populated migration inventories and the fresh-registry inventory are extended for the two additional tables.

Decision/current/workflow/backup regression fixtures now seed pre-Slice06 historical upstream scorecards explicitly in their owned TEMP database rather than bypassing the new FORMAL write gate. All existing downstream decision/current/workflow/backup assertions and production decision/domain code remain unchanged; the corrected-dataset test additionally checks that default FORMAL scoring is blocked. These fixtures do not create retrospective DI bindings.

## File scope

Domain: `src/domain/fundamentals/scoring-readiness.ts`, `scoring-bridge.ts`. Application/ports: `src/application/scoring/engine.ts`, `src/ports/scoring.ts`. Infrastructure: `src/infrastructure/repositories/scoring-datasets.ts`, `analytical-artifacts.ts`. Storage: `prisma/schema.prisma` and the one new migration. Tests: four new readiness/derived bridge/persistence/migration suites, three new synthetic/historical fixtures, the isolated database fixture, four older migration inventories and registry/decision/current/M6.8 fixture compatibility. This report is the review handoff; existing investment-domain source files are unchanged.

## Verification

Runtime: Node 22.23.2 / pnpm 10.34.5. Prisma validate/generate used explicit harmless `/private/tmp` DATABASE_URL with --no-env-file. Integration tests own their temporary database directories, migrations and cleanup. No personal .env.local, production/private database, source credential or live financial data was read.

Added four suites / **20 tests**: eight readiness/DI/input/clock/bridge unit cases, three derived-bridge cases, eight actual-SQLite governance/bypass/reopen/rollback/tamper/legacy-admission cases and one populated Slice 05 migration case. Coverage includes full 30-member accounting, data-ready versus score-ready, missing human/valuation/confidence/gates, all DI gates, independent review, issue closure requirements, exact run/model/policy/universe binding, JSON self-trust, canonical value/zero/null/currency rules, DATE_ONLY/UNKNOWN, ordered FCF inputs and formula replay, historical cutoffs, append atomicity, immutable/FK guards, adversarial recomputed hashes and old artifact replay.

Release checks on the final implementation:

- Focused Slice 01–06 fundamentals/readiness/bridge/registry/architecture: **27 files / 181 tests passed**.
- Downstream current/M6.8/backup compatibility regression: **3 files / 27 tests passed** with all original expectations retained.
- Existing scoring/golden/marginal/decision/registry: **12 files / 345 tests passed**, with decision expectations unchanged.
- Complete unit/integration/architecture regression: **70 files / 924 tests passed**, including current/UI/read-model/portfolio/decision regressions.
- TypeScript noEmit, ESLint zero warnings, architecture boundaries (**136 modules**), Prisma validation/client generation, token-session regression (**3 tests**), changed tracked/untracked whitespace and git diff --check passed.

All code, tests, SQL/schema and this report are finalized before the final complete suite. A SHA-256 inventory of source/tests/schema/scripts/relevant reports/config is captured before and compared after the final run. No covered file changes during that verification. Temporary logs/inventories remain outside the repository. This report is delivered only after release checks pass. Early failures were a synthetic sector mismatch, a legacy/new fixture score-ID collision, an unused import, missing fresh-table inventory entries and downstream decision/current/M6.8 fixtures using the now-prohibited writer (including a subsequently corrected missing helper import); those runs are not claimed as passes. The first full frozen-tree run returned 908 passed / 16 failed: all failures were downstream fixtures attempting default FORMAL scoring or the old FORMAL writer. It is discarded; after explicitly converting those upstream inputs to historical TEMP fixtures, all original downstream expectations are retained and the final full run uses a newly frozen inventory.

## Review and limits

Serial implementation self-review, not independent data-quality/owner acceptance:

| Role | Score / 10 | Conclusion |
| --- | --- | --- |
| CIO | 9 | Readiness cannot backdate information or create points; human assessment and existing actionability gates remain separate. |
| Data Architect | 9 | Versioned exact run/content/review/model/policy linkage; immutable atomic writes; old artifacts/DDL remain intact. |
| Financial Data Engineer | 9 | Strict publication/currency/scope/operand lineage; null/zero distinction and existing formulas preserved; unresolved routes blocked. |
| Risk/QA | 9 | Default/direct FORMAL bypass, injected trust, stale/later evidence, mismatched review and tampering fail closed; isolated migration and final-tree regression verified. |

Internal in-scope findings after checks: Critical 0 / Major 0 / Minor 0 identified. Recommendation: **READY FOR SLICE 06 REVIEW**, not production activation or DI acceptance.

Actual independent reviewer authority, source qualification, complete approved sector/history/freshness/market/valuation requirements, registry/crosswalk/policy approvals and real DI execution remain external evidence requirements. This implementation provides no production bundle and no operational all-PASS claim. References and review capabilities must be independently verified by the future trusted composition owner; declaration strings alone are insufficient. The existing derivation-route/sector gaps remain blocked; DATE_ONLY requires a separately approved future Evidence-contract change before bridging. The initial bridge is operational AS_KNOWN, not an AS_REVISED or historical-public research bridge.

No DI gate is promoted to PASS in project records. No real scoring/ranking/Top 10, valuation/portfolio decision/DCA recommendation, investment rule change, source fetch, cron, UI, production migration, self-approval, commit or push. Runtime production wiring is intentionally inactive without externally supplied review capabilities and a real approved bundle. No Slice 07/08 implementation. Stop for Slice 06 review.
