# Personal AI scoring and acceptance contract v1

Date: 2026-11-01 (Asia/Ho_Chi_Minh). Implementation baseline: `6dbdf2c4c53af1bd4aa3fba505fec6d12009fd33`.

**Status: implemented and tested; not activated in production.** Owner scope is the explicit request to implement a versioned AI assessment contract, validator, provenance and compatible acceptance path without changing financial criteria, weights or evidence. This authorizes code and disposable tests, not acceptance of current research data, methodology registration, source promotion, NAV, ranking, Buy/Sell publication or production deployment.

## Contracts and entry points

| Contract | Purpose |
| --- | --- |
| `personal-ai-score-input-v1` | Same financial input fields as M3, plus a mandatory AI review envelope. Assessment source is `AI`, analyst is `CHATGPT`. |
| `personal-ai-review-provenance-v1` | Explicit `OWNER_AUTHORIZED_AI_SELF_REVIEW`, `independentHumanReviewClaimed=false`, owner authorization reference, input/evidence/methodology/financial-rule hashes, per-rubric hashes and two recorded passes. |
| `personal-ai-pass-artifact-v1` | Preparation or challenge artifact: actual model/session/tool references, time, dataset hashes, expected/actual check hashes and evidence references. |
| `personal-ai-di-acceptance-v1` | New acceptance namespace retaining all 15 DI gates, all 30 universe members, strict-v2 financial requirements, unresolved Critical/Major rejection and exact sealed snapshot/bridge binding. Producer and reviewer are truthfully `CHATGPT`; no artificial independent actor is required. |
| `personal-ai-scoring-dataset-binding-v1` | Binds the reviewed input, review, acceptance, requirements and recomputed per-ticker readiness. |
| `personal-ai-scorecard-v1` / `personal-ai-score-artifact-v1` | Frozen result and immutable stored result/binding. Explicit self-review and no operational authorization. |

Main entry point: `src/application/personal-ai/scoring-engine.ts` → `PersonalAiScoringEngine.score(input, selection)` / `find(id)`. The application delegates acceptance to `PersonalAiScoringDatasets`, verifies the registered methodology, uses the financial scorer, reauthorizes before append and replays both score and binding on read.

The existing HUMAN scorer, HUMAN runtime review and `independent-di-acceptance-v1/v2` repositories remain byte-identical. Neither accepts the new AI contracts. No AI assessment is relabeled HUMAN, including temporary calculations. Existing research contract `owner-authorized-ai-score-review-v1` remains a research candidate and is not automatically converted to an accepted score input.

## Financial equivalence and version isolation

The approved legacy calculator/bridge/readiness files are pinned by existing authority. The new compatibility modules are mechanically derived at build time by `scripts/generate-personal-ai-compatibility.mjs`. Its explicit anchored adaptations cover only the namespace, AI origin/provenance validation, implementation identity and truthful self-review metadata. The new path rejects historical readiness-v1 for new acceptance, retaining the existing strict-v2 financial route. It does not relax an old financial branch.

`node scripts/generate-personal-ai-compatibility.mjs --check` verifies the complete generated financial code, rather than checking only sample scores. A changed formula, gate, unreviewed edit or changed baseline causes a parity failure. No runtime eval/source rewriting is used. Generating compatibility code never registers methodology or activates authority.

All seven category maxima remain BQ25/FH15/GQ15/IC10/VAL20/RG10/CA5. The 23 rubrics, bands, maximum prerequisites, double-counting checks, risk veto, confidence, expected-return bands, missing/stale/conflicting evidence handling and canonical metric/valuation/PIT checks remain the original algorithms. Missing values remain N/R/null, not zeros or redistributed weights. Canonical financial facts retain their real source identity; AI qualitative external evidence uses `AI_REVIEW` and cannot supply reported numeric facts. Existing reviewed financial normalization classifications are not renamed or reauthorized.

The AI implementation identity is `m64-clarification-1-ai-origin-v1`, with the unchanged financial model version `1.0.0`. A separate, exact registered methodology record is required. An existing approved HUMAN record does not authorize the new origin merely because its points would match.

## Provenance and trust boundary

1. Review hashes bind the semantic input (excluding only artifact ID/calculation time and the review envelope itself), every assessment, the full evidence array, methodology and financial rules. Altering as-of, known-at, sector, source, evidence, rubric, selected points or methodology requires a new review.
2. Preparation and challenge are both mandatory recorded artifacts; they may truthfully use the same ChatGPT/session. They must have distinct artifact references/hashes and ordered explicit timestamps. Null, guessed or future review timestamps are rejected. Distinct strings are not claimed as independent human review.
3. `PinnedAiReviewVerifier` accepts only exact review hashes and owner scopes configured by the trusted server. It reopens pinned pass artifacts and every referenced pinned tool/check-evidence artifact. Hashes, model/session/tool context, dataset bindings and expected/actual checks must agree. Request-supplied acceptance flags, changed files and missing bindings cannot grant trust.
4. `PinnedAiAcceptanceReader` loads an exact acceptance file from trusted configured pins. It does not create approval receipts from request JSON. The repository independently reopens native sealed snapshots, observations, availability assessments, derivations, registry and registered requirements/acceptance methodologies.
5. The acceptance methodology must be APPROVED/PRODUCTION and exactly bind `personal-ai-di-acceptance-sha256:<acceptance hash>`. Existing requirements need their unchanged `readiness-requirements-sha256:<hash>` binding; source/availability/financial qualification remains native. A pinned JSON saying DI PASS cannot replace these checks or missing valuation evidence.
6. Local hashes/attestations establish retained byte/content bindings, not a cryptographic signature from OpenAI, proof of external tool execution or original issuer authenticity. Actual sessions/tool logs must exist and be reviewed before trusted bindings are configured. No such real binding is fabricated by this implementation.

No production trusted AI binding, acceptance pin, method registration or acceptance record was installed. Defaults contain no trust grants. There is no fallback to legacy human approval or a different dataset.

## Persistence and assembly

`FileAiScoreArtifactStore` writes a dedicated private derived-artifact namespace, not the legacy `analytical_artifact` table. Publication is atomic/no-overwrite using a private temporary file, fsync and hard link; duplicates reject. Files are mode0600, directory creation uses0700, and public/build directories, symbolic-link artifacts and malformed/hash-mismatched records reject. Reads through the repository also recompute financial output and source/provenance authorization. A removed trusted review binding invalidates reuse/read through that repository.

This separation avoids inserting AI JSON under a HUMAN decoder or requiring a production schema migration. It is not an alternative API capture store: broker observations/raw API results stay in their existing SQLite workflow. No source responses are duplicated. The new store contains only newly derived AI score/binding artifacts when explicitly invoked.

Trusted composition must supply:

```ts
const datasets = new PersonalAiScoringDatasets(
  client, snapshots, facts, derivations, registry,
  new PinnedAiAcceptanceReader(evidenceRoot, reviewedAcceptancePins),
  new PinnedAiReviewVerifier(evidenceRoot, reviewedAiBindings),
  new FileAiScoreArtifactStore(privateArtifactDirectory, projectRoot),
);
const engine = new PersonalAiScoringEngine(methodologyRegistry, datasets, snapshotHash);
const card = await engine.score(input, { snapshotRunId, acceptanceId });
```

The values `reviewedAcceptancePins` and `reviewedAiBindings` must come from reviewed server configuration, never the scoring request. Callers consume the new typed scorecard/contract; legacy dashboards/ranking/decision decoding are not silently widened. No live composition is wired here. Full-production activation and downstream publication remain separate changes after actual financial data acceptance.

## Validation and current data status

**313/313 tests passed across 18 files, zero failures/skips.** [VALIDATION.json](evidence/2026-11-01-personal-ai-scoring-v1/VALIDATION.json) records executed commands, per-test outcomes and exact artifact/baseline hashes. Financial regression/parity, complete synthetic acceptance/scoring/reopen, all-sector numerical comparison, immutable append/duplicate rejection, revoked/missing trust, changed input/sessions/tool bytes/output, owner-scope mismatch, failed checks, unknown/future time, path/symlink controls, missing valuation, full universe/DI gates and HUMAN legacy rejection are covered.

The first focused run exposed a macOS `/var` versus `/private/var` path alias in the artifact directory guard; fixed by canonicalizing the configured directory and rechecking private-location restrictions while retaining symlink rejection. Initial checks also caught a test-fixture missing-review type assertion and an ESLint-reserved loop name; both fixed without touching legacy code or policy. Final typecheck, scoped lint, architecture, generated parity and approved-authority verification pass. The broader suite and supplementary provenance suite have disjoint test identities; earlier focused runs overlap and are not added to their total.

Current R4 remains `NOT_COMPLETE`, production scoring remains false, and no actual issuer is accepted by this implementation. Existing conditional models, unresolved source conflicts and 688/690 unassessed rubrics are not repaired by changing review origin. No current valuation/point or Buy/Sell decision is manufactured. Before real use, complete the substantive financial analysis, perform and retain actual two-pass review, bind real approved requirements/sources and the new methodology/acceptance, then review the separately scoped activation proposal.

This task changes only additive code, tests, documentation and implementation evidence. Production DB/account data, old code/contracts, rubric/weights, authority heads/receipts, seals and prior evidence remain unchanged. WP1, NAV, trading and production publication are not activated.
