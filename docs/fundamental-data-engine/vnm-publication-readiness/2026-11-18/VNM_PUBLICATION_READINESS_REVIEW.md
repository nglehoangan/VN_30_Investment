# VNM production score publication readiness

**Decision: VALIDATION_FAILED. Do not publish.** This is not a case where only owner publication approval remains. A concrete production-bootstrap validation failure and missing current-purpose publication/deployment prerequisites remain.

The prior Step4 result remains intact: **43/100, LOW, VALID — NON-ACTIONABLE**, economic cutoff30October2026,23 rubrics/83 topics. Its original input, review, dataset and scorecard hashes match the retained baseline `b9b2ee6e22ffc0015f9f1e29324ac105b02a7ab4`. The approved current-purpose executable verifier and the separately configured11 accepted static heads pass. No VNM research or scoring was repeated; checking the stored category sum is integrity verification, not rescoring.

## Existing entry points and the missing connection

| Layer | Actual implementation | Review result |
|---|---|---|
| Public read-only pages | `app/[screen]/page.tsx`, `app/[screen]/[id]/page.tsx` → `app/server/dashboard.ts` | `/scoring` selects `analytical_artifact` and decodes through `PrismaAnalyticalArtifacts.find`. |
| Current-purpose storage/read | `src/infrastructure/source-admission/current-scoring.ts` | `score` persists `current_score_artifact`; `find` reauthorizes the exact current dataset/review/executable. Dashboard does not call it. The SQL extension is explicitly an isolated-only proposal. |
| Existing production publication | `src/application/dependencies/service.ts` → `PrismaDependencyRegistry.publish` | `resolveProductionAnalysisDependencies` / `sealAnalysis` publish sealed ANALYSIS snapshots under accepted/current dependency releases and lifecycle validation. They are not a raw scorecard upload endpoint. No current-score-to-ANALYSIS/read-model bridge was found. |
| Other AI storage | `src/infrastructure/personal-ai/artifact-store.ts`, `scoring-datasets.ts` | Historical AI file namespace and DI contracts; not a current-purpose publication shortcut or a dashboard connection. |

Reuse the existing publication/dependency/read architecture when closing the gap. Do not create a parallel publication system or insert the JSON into the legacy catalog to bypass FORMAL admission. The existing resolver uses LIVE freshness and effective-head semantics; a dated CURRENT_FORMAL_VALUATION artifact requires explicit purpose/time qualification. Its original cutoff/knownAt/calculatedAt must not be relabelled current market freshness or historical PIT.

## Material blockers

1. **PUB-01 — Major: actual bootstrap source-pin failure.** All14 `tests/integration/dependency-head.test.ts` cases stop at `SOURCE_HASH_MISMATCH:src/domain/market-boundary/validation.ts`. The actual exported `productionBootstrapInventory()` reproduces it. The accepted20Oct predecessor capsule pins `abab4e0b2d8b02b915cba483f76861ae2be546c87ddb5be8df482511fa85ce87`; current/baseline bytes are `420cf4eeace8a4416654ad86f103692165c4cea6e8f1309eb3fb7e1652bc1d9b`. This is an existing bootstrap/version integration defect, not evidence that the newly approved executable was tampered with. **Action:** use a legitimate accepted successor/current-version bootstrap route, or exact historical code for historical replay; retain the old receipt unchanged. The dependency integration maintainer owns the correction under existing release governance.
2. **PUB-02 — Major: current publication/read contract not implemented.** The real FORMAL legacy writer rejects the current card, and the real dashboard returns zero cards even when its exact cache body exists in disposable current storage. Latest published revision selection and revocation-aware readback therefore cannot be proved. **Action:** connect the qualified current artifact to the existing publication/read flow, retain purpose/time/identity, and exercise persistence/readback/idempotency plus latest/revocation controls. Publication/read-model maintainers own this work.
3. **PUB-03 — Major: live governed state and registration absent.** Read-only inspection of the actual configured database finds none of the required current financial/dataset/enrichment/data-acceptance/score tables, and no registered `current-scoring-proposed-20261117` method. There are zero analytical/publication rows; an older dependency projection does exist. Active static scoring head uses `m64-clarification-1-production-20261117-step3`, not the separately approved current method. **Action:** prepare an authorized deployment/materialization of the exact retained current release and version/trust bindings, preserving IDs/hashes/original receipts. This is deployment/registration work, not missing BCTCs, new research or a new provider approval. No such write was performed here.
4. **PUB-04 — Publication permission absent.** The owner expressly limits this task to readiness and states publication NOT AUTHORIZED. Existing executable approval and AI self-review permission cover their recorded scopes; the Step4 binding was applied only in disposable validation. **Action:** owner/CIO publication authorization is required after the other prerequisites pass. It does not retrospectively cure missing implementation or failed validation.

## What the safety review actually proves

- Exact retained cutoff, knownAt, calculatedAt, LOW confidence, NON-ACTIONABLE validity and source/assessment hashes are preserved. No score recomputation or data-purpose substitution was performed.
- Existing scoring UI code renders confidence, validity, cutoff and knownAt. However no current-purpose published card reaches that consumer today; source inspection is not claimed as a successful published-view rehearsal.
- Existing ranking/decision/DCA controls exclude LOW/non-actionable inputs from new capital; those scoped domain regressions pass. The card grants no operational authorization. No BUY, ACCUMULATE, DCA or transaction was invoked by the rehearsal.
- Same-ID current storage replacement is rejected by its immutable trigger. This is not proof of publication ordering across distinct revisions: the legacy catalog orders by `asOf DESC,id ASC`, and no current-purpose published-latest selector is wired.
- `CurrentPurposeScoring.find` reauthorizes reads; an exact cached body without its registered governed method is rejected. The dashboard currently uses checksum-decoded legacy reads, not that current service. Published current data/authority revocation remains unproved. The14 failed dependency tests stop before their intended CAS/supersession assertions.

## Validation and rehearsal

Scoped Vitest: **234 total,220 PASS,14 FAIL**, all14 from the same bootstrap mismatch. Results are retained without exclusions or a false overall PASS. The exact production-oriented failure is reproduced separately from synthetic regression fixtures.

A disposable database exercised the actual legacy FORMAL writer, production dependency resolver, dashboard reader and current-purpose reader. Only the exact retained unpublished cache body was reconstructed to test routing; no source facts, governed admissions, active heads or approval fixtures were invented. No publication row was created. Missing-head/method and wrong-writer paths rejected as expected; the actual dashboard showed zero current cards. Successful publication/readback/idempotency through a current publication bridge is **NOT CLAIMED**.

The actual production SQLite file and every table fingerprint, holdings/transactions/NAV state and live configuration remain unchanged. No source acquisition, S1–S5/23-rubric rework, production activation, trust installation or trading occurred.

Machine-readable detail: `PUBLICATION_CONTRACT_MAP.json`, `PRODUCTION_DEPENDENCY_CHECK.json`, `AUTHORITY_AND_TRUST_VALIDATION.json`, `SCORECARD_INTEGRITY_VALIDATION.json`, `PUBLICATION_SAFETY_VALIDATION.json`, `ISOLATED_PUBLICATION_REHEARSAL.json`, `PUBLICATION_DECISION.json`, `CURRENT_BLOCKER_REGISTER.md`, `VALIDATION.json`.

**STOP for CIO review.**
