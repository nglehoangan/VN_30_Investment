# Slice 05 implementation report — 2026-10-09

Authorization: user requested “Implement Slice 05” after the Slice 04 review/remediation sequence. Baseline HEAD is `ded76d9d45da0837ab426a24442a4e6ff2eb4cb5`; the working tree was clean. No commit, staging or push was performed.

Authority: `DESIGN_REVIEW.md` §D–H and the repository's existing fundamental contracts, immutable repositories, financial derivations, strict scoring Evidence and isolated migration patterns. AGENTS.md and the installed Next route guide were reviewed. No route, UI, scoring formula or scoring Evidence contract is changed.

## Delivered behavior

### Operational availability

`assessAvailability` produces a new immutable `AvailabilityAssessment` pinned to the observation's canonical body hash, explicit operational AS_KNOWN mode, normalized policy manifest/hash, assessment execution time, public boundary, availability boundary, status/finding and evidence references. Foundation observations retain their original null/UNKNOWN availability; derivation artifacts also retain their original null/UNKNOWN availability.

Verified timestamp publication uses the issuer publication instant. Verified DATE_ONLY disclosure uses the next local calendar midnight only when both the policy and that timezone are approved. Version one supports UTC and Asia/Ho_Chi_Minh explicitly; unsupported/unknown timezone or unapproved date-only policy remains UNKNOWN. No `publishedAt` is invented. Report signing date and fiscal period never substitute for disclosure.

For valid chronology, operational availability is the maximum of the public boundary, actual local retrieval/ingestion, optional verified provider receipt and explicit correction knowledge. Existing observation validators reject impossible exact publication/provider/local chronology and fabricated foundation availableAt. Date-only receipt before the start of the stated publication day produces INVALID with a retained chronology finding; conservative next-midnight policy is not misclassified as an actual publication timestamp. Missing optional provider receipt is permitted; an inconsistent supplied receipt cannot be silently removed by the evaluator.

FORMAL assessment/snapshot persistence requires the existing approved registry hash/crosswalk/methodology binding **and a separate trusted external availability-policy binding**. The latter pins `snapshotHash(validateAvailabilityPolicy(policy))`, approval reference and methodology ID to an APPROVED/PRODUCTION methodology record with `configurationReference = availability-sha256:<policyHash>`. Registry and policy methodology recording/effective dates must be known at the selection cutoff. Request JSON cannot supply this trusted binding. This implementation grants no real registry, mapping, crosswalk, timezone or policy approval.

### PIT and revision selection

`BuildFundamentalSnapshot` delegates to the repository, which enumerates all stored matching candidates at frozen cutoffs. The caller pins an assessment for **every** candidate in that scope/window; omitting a competing fact or pin fails rather than hiding a conflict. Every observation is reloaded through the original raw/body/index/revision integrity checks, and every assessment is independently replayed.

AS_KNOWN requires the availability boundary at/before both systemKnownAt and fundamentalCutoff, with systemKnownAt at/before decisionAsOf. Economic periods, registry/policy knowledge, reporting scope, universe/sector binding, applicability, data presence, quality and versioned maximum-age requirements are checked separately. Later builtAt never extends the knowledge window. Missing/unknown/not-yet-available/stale/invalid facts remain explicit exclusions/blockers, without zero substitution.

Only explicit comparable predecessor chains admit issuer restatement/provider correction/mapping correction. Issuer restatement must retain its own disclosure evidence; provider/mapping correction cannot invent new issuer publication. Missing/incomparable predecessors and cycles fail closed. Eligible ancestors may be superseded within that chain. Unrelated roots and forked eligible revisions block the affected requirement, including retained unknown-publication competing evidence; no source override, averaging or favorable-value selection is added.

AS_REVISED has its own mandatory revisionCutoff and a deterministic `diagnosticOnly: true` manifest label. It selects the latest valid eligible chain vintage at that cutoff while retaining exclusions. Its later revision knowledge is never substituted into AS_KNOWN. Unknown publication remains unknown in either mode. Historical-public research backdating is not implemented.

Derived results are reloaded/replayed through Slice 04's immutable derivation repository. Every constituent must be selected by PIT and every human adjustment/crosswalk knowledge boundary must be eligible. Snapshot derived availability inherits the maximum operand/review boundary. Ordered roles/operations/fingerprints, adjustment dimensions/evidence, financial result/null, confidence, formula and precision governance remain content. Calculation execution timestamps and physical derived artifact IDs are run provenance. No new calculation formula is introduced.

### Content identity and run identity

The versioned `fundamental-snapshot-content-v1` contract uses code-point sorted keys, explicit fixed fields, sorted unordered requirements/references/findings/exclusions, canonical decimal/UTC values and ordered formula operands. There is no caller-configurable exclusion list.

The manifest pins decision/knowledge/market/fundamental/revision cutoffs, mode, governed registry/policy/requirements versions and hashes, universe/sector/market/reference content, canonical fact fingerprints and financial context, full publication precision/receipt/correction boundaries, quality/freshness findings, required missing states and derived semantics. A predecessor contributes its semantic fingerprint rather than its physical storage ID. Selected observation/capture/assessment/derived storage IDs, build/operator/software execution metadata and calculation execution clocks do not manufacture new content identity. Evidence/qualification/transformation references are preserved as interpretation-relevant provenance; the fixed v1 classifier removes only the known `normalization-run:` execution marker from content while retaining it in immutable observation/assessment run provenance.

Run ID, builtAt, exact manifest digest, source/import/capture IDs, original observation/capture/source/import body and raw payload hashes, canonical import/derived integrity hashes, all selected/excluded assessment pins, validation-run reference and review context remain in a separate immutable run envelope. Rebuilds may reuse a verified content row but always create a new run. Read replay verifies the run/content/digest/index binding, membership manifests, pinned lineage and raw integrity; equal contentHash alone cannot accept a missing/tampered storage reference.

Pinned reference content and requirements are build inputs, not independent validation certificates. `scoringReadiness: DEFERRED_SLICE_06` is fixed in the manifest. Validation/review references are provenance only; they do not assert DI PASS, score readiness or acceptance transfer between runs.

## Storage and migration

`202610090003_fundamental_snapshot` adds five tables:

- `fundamental_availability_assessment`: immutable observation FK, policy version, assessment time, boundary, canonical body/hash.
- `fundamental_snapshot_content`: content hash, canonical manifest and exact-byte digest.
- `fundamental_snapshot_run`: immutable run/content FK, build time and provenance envelope/hash.
- `fundamental_snapshot_member`: all selected/excluded observation/assessment pins, restrictive FKs, run-manifest/assessment-observation admission checks.
- `fundamental_snapshot_derived_member`: all selected/excluded derivation pins, restrictive FKs and run-manifest admission check.

Content, run, deterministic blockers and all membership/provenance are sealed in one transaction. Duplicate or invalid writes roll back without partial content/runs. SQL update/delete/replace guards preserve each table's records and links; manifest checks reject undeclared additional member IDs. Existing physical tables, old rows, triggers and foundational availability columns are neither altered nor backfilled.

Migration testing upgrades a populated Slice 04 baseline containing canonical source/import/raw/fact and prior derivation/input rows, compares every old table row and DDL/trigger unchanged, repeats deployment and verifies foreign keys/status. Earlier populated foundation/normalization/derivation migration inventories were extended for the latest additive schema.

## Verification

Runtime: Node 22.23.2, pnpm 10.34.5. Client generation/schema validation used an explicit harmless temporary DATABASE_URL with `--no-env-file`; integration migrations use owned private temporary directories. No private database or personal .env.local was read or migrated.

Final verification:

- Focused PIT/snapshot/derived/persistence/populated-migration regression: **4 files / 32 tests passed**.
- Final frozen-code unit/integration/architecture regression: **63 files / 888 tests passed**, including existing scoring/golden/decision/portfolio suites. Run started `2026-10-09 09:56:13 UTC`; duration 271.74 seconds.
- TypeScript `tsc --noEmit`, ESLint zero warnings and architecture boundary checks (**132 modules**) passed.
- Prisma schema validation/client generation with the isolated explicit URL passed.
- Token-session regression: **3 tests passed**.
- Final diff/whitespace checks passed; baseline HEAD remained unchanged. No implementation/test/schema edits followed the final full run; this report was updated with completed results.

Early synthetic crosswalk/policy-hash fixture mismatches were corrected. An intermediate broad run overlapped the comparator/new Unicode regression edits and loaded the previous module with the new test; that failed run was discarded. The final broad run above used the frozen implementation and all 888 tests passed. Failed attempts are not claimed as passing checks.

## Acceptance coverage

1. Equivalent input ordering, observation/crosswalk JSON key ordering and JSON whitespace retain content identity.
2. Different builtAt/operator/assessment execution ID retains contentHash with a distinct run ID.
3. Selected normalized value/currency/receipt changes alter contentHash.
4. Mapping, registry/methodology interpretation and availability-policy changes alter contentHash.
5. Forged assessment, run provenance, manifest or raw/derived storage binding fails closed, including adversarial recalculation of transport hashes.
6. New imports after frozen cutoffs retain the original contentHash and selected original capture/observation lineage in a new run; old runs still replay.
7. July 10/July 22/July 25 cutoffs exclude Q2 reported June 30, signed July 22, published/provider-received July 25 and locally retrieved/ingested July 26. Exact local ingestion admits it; later builtAt cannot backdate it.
8. Date-only July 25 maps to July 26 local midnight (July 25 17:00Z for Vietnam), with exclusion immediately before and inclusion at the exact boundary; `publishedAt` remains null.
9. Unknown publication, optional missing provider receipt, disputed chronology, false availableAt, stale/quality/scope/missing requirements, all three revision kinds, forks, missing predecessors, AS_REVISED diagnostic vintage and derived operand eligibility are covered.
10. Additive populated migration, reopen/replay, transactional duplicate/invalid rollback, immutable SQL guards, restrictive links and synthetic exact FORMAL approval-binding gate are covered.

All financial and approval fixtures are synthetic. The July PIT fixtures use a separately constructed synthetic registry with a January recording date; the repository's October PROPOSED production registry is unchanged. Synthetic TEMP FORMAL-contract approval records are not real approvals or financial evidence.

## Files and remaining boundaries

Domain: `availability.ts`, `snapshot.ts`. Application: `build-snapshot.ts`. Port: the new snapshot repository interface. Infrastructure: `snapshot-hash.ts`, `fundamental-snapshot.ts`, and transaction-client read support in `fundamental-derivation.ts`. Storage: Prisma relationships/models and the one new additive migration. Tests: shared snapshot fixtures, two unit suites, snapshot persistence and populated migration suites, and earlier migration inventories. This report is the review handoff.

No source fetch/cron/UI composition, scoring bridge, per-ticker scoring readiness or independent DI acceptance is added. Existing bank-component/insurance/securities governance gaps remain unresolved; this slice cannot make them ready by supplying a snapshot. Policy approval and supported date-only timezone governance remain external. Stop here for Slice 05 review before Slice 06.

## Slice 05 remediation — external conditional review, 2026-10-09

### Review baseline and scope

The external review of HEAD `86a2755cbca1b4aa502ee1cfc72eb8fba936e0d5` returned **CONDITIONAL APPROVAL: Critical 0 / Major 1 / Minor 2**. The approved Slice 04 baseline remains `ded76d9d45da0837ab426a24442a4e6ff2eb4cb5`. HEAD matched the reviewed commit and the remediation started from a clean tree. The original implementation and verification history above is retained; its unconditional v1 next-midnight interpretation is historical, not the new v2 behavior.

The audit covered AGENTS.md, DESIGN_REVIEW.md, Slice 03–05 reports, availability/snapshot contracts and hashing, publication/provider/revision validation, immutable repositories, migrations and PIT tests. The installed Next route guide was read; there are no Next route changes. This is Slice 05 remediation only. No commit or push is authorized or performed.

Major: conservative DATE_ONLY fallback must not erase stronger approved same-day public-receivable evidence. Minor #1 (clarified by the user): evidence authority must be machine-readable and distinguish trusted filing feeds from generic scraper/cache receipts. Minor #2: correctionKnownAt must mean actual system knowledge of revision semantics, not public disclosure. All three are addressed together under a separately versioned policy; no source-ranking framework is introduced.

### Governed evidence semantics and availability

New `operational-evidence-v2` policy explicitly declares `dateOnlyEvidenceClasses`. Its only permitted public-strengthening class is `TRUSTED_PROVIDER_RECEIPT`; an empty list retains the fallback. LOCAL_RETRIEVAL, LOCAL_INGESTION and CORRECTION_KNOWLEDGE cannot be authorized as public disclosure substitutes. Assessment JSON records each evidence class, timestamp, evidence reference, authority hash, proof knownAt and public-boundary role. Other classes are ISSUER_PUBLICATION_TIMESTAMP and UNTRUSTED_PROVIDER_RECEIPT.

VERIFIED DATE_ONLY keeps publishedAt null. Approved UTC/Vietnam policy yields next local midnight as `publicFallbackBoundary`. With no qualifying proof, `publicBoundary` equals that fallback. A governed, VERIFIED, exactly bound receipt of a PUBLICLY_RECEIVABLE_DOCUMENT within the publication day may establish `evidenceBackedBoundary` before the fallback when policy permits it. The selected boundary and `boundaryBasis` are explicit. Mere providerReceivedAt, local retrieval or ingestion never grants this authority.

For the requested Vietnam example, July 25 fallback is `2026-07-25T17:00:00.000Z`; trusted public receipt is 15:00Z and becomes publicBoundary; retrieval is 16:00Z and ingestion is 16:01Z. Final availableAt is **16:01Z**, never 15:00Z. The maximum also includes provider receipt, correction knowledge, authority recording and verified receipt-proof knownAt. A proof learned at 16:02Z cannot yield 16:01Z availability. Neither assessment execution time nor later build time establishes knowledge. Before-start-of-local-day provider/local evidence is retained and marked INVALID, including v2 policies that cannot authorize a boundary; it is never silently removed.

Provider authority pins source version and canonical source hash, provider, authority version/reference, APPROVED governance/approval reference, methodology identity, public-receivable semantics and authority recording time. Receipt proof pins the full canonical immutable observation hash, exact receivedAt and receipt evidence reference, VERIFIED status and actual proof knownAt. The repository verifies the stored source/provider/hash and source knowledge chronology. Trusted composition supplies these bindings through repository construction; request JSON has no trust field and cannot inject one. A stored self-declared trusted assessment, even with a recomputed transport hash, cannot pass replay without the independently configured binding.

FORMAL also requires the existing exact external registry and availability-policy approval bindings. Provider authority must independently match an APPROVED/PRODUCTION methodology record, exact approval reference and `configurationReference = provider-receipt-authority-sha256:<canonicalAuthorityHash>`, with recording/effective chronology. No real approval is created. All approved metadata used by tests exists only in isolated synthetic fixtures/databases.

VERIFIED TIMESTAMP retains issuer/publicBoundary equal to exact publishedAt and respects subsequent system/proof floors. Exact chronology is unchanged. UNKNOWN publication remains UNKNOWN even with a trusted provider proof; v2 deliberately supplies no provider-only UNKNOWN override. Report signing/fiscal dates, corrections and local clocks remain prohibited generic substitutes.

correctionKnownAt is documented as actual system knowledge of the explicit revision semantics, supported by revisionEvidenceReference. Its evidence class never establishes publicBoundary; it participates only in the operational maximum. Existing immutable-observation/revision chronology is retained: correction knowledge cannot follow that corrected observation's ingestion, and must respect predecessor ingestion. Tests exercise correction knowledge before and after local retrieval, but at/before corrected ingestion. Knowledge obtained after ingestion requires a new revision, not a rewritten historical observation.

### Historical selection, persistence and identity

AS_KNOWN still requires availableAt <= systemKnownAt **and** availableAt <= fundamentalCutoff. Later builtAt does not expand that set. Explicit chain/fork/conflict rules and authoritative enumeration are unchanged. AS_REVISED still requires explicit revisionCutoff and diagnosticOnly=true; revised/proof knowledge does not leak into AS_KNOWN. Derived PIT inherits the maximum eligible constituent knowledge: a delayed trusted proof on one CFO/CAPEX operand excludes FCF until that boundary. No formula or investment rule changes.

V2 uses `fundamental-snapshot-content-v2`. Canonical identity pins policy/hash, authority classification/full governed authority, fallback and evidence-backed boundaries, chosen basis, final availability, proof knowledge and evidence lineage. Policy exclusion of trusted receipts or a governed authority version change alters contentHash. Physical observation/capture/assessment IDs and build clocks remain run provenance; local evidence storage references and the binding's physical observation transport hash are excluded from semantic content, while exact immutable assessment/run replay still checks them. No caller-defined hash exclusion is added.

V1 `operational-max-v1` assessments and `fundamental-snapshot-content-v1` retain their exact historical shapes and hashes. A static golden assessment and full snapshot were generated with availability.ts/snapshot.ts extracted from reviewed commit `86a2755`; the temporary legacy generator was deleted. The checked-in golden regression matches the new code's v1 replay exactly. Persistence tests also prove that configuring a trusted binding later does not upgrade an already pinned v2 fallback or a v1 artifact. A new assessment/run must explicitly pin changed evidence semantics. Trusted v2 runs require their original governed bindings to reopen; a different/missing binding fails closed rather than reinterpreting old content.

**No schema or migration changes.** New semantics fit immutable assessment/manifest JSON. Existing table guards, restrictive FKs, transactional sealing and populated Slice 01–05 migrations remain tested. No historical trust backfill or assessment mutation is performed. Foundation observations and derivation artifacts retain their original null/UNKNOWN availability.

### Verification of the final tree

Runtime remains Node 22.23.2 / pnpm 10.34.5. Integration tests create their own temporary databases and migrations with --no-env-file; Prisma validation uses an explicit harmless /private/tmp URL. No personal .env.local or production/private database is read or migrated.

Added **16 tests** in three suites: ten evidence/PIT/hash/derived unit tests covering A–N, one reviewed-v1 golden test, and five persistence/governance/adversarial integration tests. Synthetic fixture and static golden bytes accompany them. Coverage includes fallback, untrusted/local receipts, invalid chronology, immediately-before/exact operational cutoffs, later proof knowledge, request self-trust rejection, exact source/provider/reference/hash binding, independent FORMAL authority, immutable pinned replay, correction distinction, TIMESTAMP/UNKNOWN, AS_KNOWN/AS_REVISED and deterministic content identity.

Final verification release criterion and results:

- Focused fundamental Slice 01–05 / registry / architecture regression: **23 files / 161 tests passed**.
- Existing scoring/golden/marginal/decision/registry regression: **12 files / 345 tests passed**.
- Complete unit/integration/architecture regression on the frozen final tree: **66 files / 904 tests passed**.
- Token-session regression: **3 tests passed**.
- TypeScript noEmit, ESLint zero warnings, architecture boundaries (**133 modules**), Prisma schema validation, tracked/untracked whitespace checks and git diff --check passed. No Prisma generation is needed because schema/generated client contracts are unchanged.
- Populated snapshot/derivation/normalization/foundation migration regressions are included in focused and complete runs. Existing rows/DDL/immutable guards/FKs remain covered.

All implementation, tests, fixture bytes and this appendix are finalized before the final complete regression. A deterministic SHA-256 inventory of tracked plus new source/test/schema/scripts/relevant reports/configuration is captured before the run and compared afterwards; no covered file changes during verification. Final command output and inventory are temporary verification artifacts outside the repository. This report is delivered only after these release checks succeed; failed attempts do not count as passes. An intermediate whitespace check found one extra EOF blank line; it was corrected before freezing the final tree.

### Four-role review and remaining boundaries

These are serial implementation self-reviews, not independent owner acceptance or external policy/DI approval. Scores use a 10-point scale for this remediation's implementation and evidence coverage.

| Role | Score | Assessment |
| --- | --- | --- |
| CIO | 9/10 | Same-day approved public evidence is preserved without backdating actual system knowledge; no decision/scoring logic added. |
| Data Architect | 9/10 | V2 is explicitly versioned/content-addressed; old artifact golden replay and pinned fallback remain stable; trusted composition is separate from request/run identity. |
| Financial Data Engineer | 9/10 | DATE_ONLY is not fabricated time; public feed authority is explicit; correction/local knowledge stays distinct; exact/unknown publication remains conservative. |
| Risk/QA | 9/10 | Fail-closed chronology and source/proof/governance replay are tested; later proof and revised knowledge cannot broaden AS_KNOWN; exact-final-tree regression is required and passed. |

Internal remediation review: **Critical 0 / Major 0 / Minor 0 remaining identified findings**. This does not replace the historical external CONDITIONAL APPROVAL or confer external acceptance. Recommendation: **READY FOR SLICE 05 FINAL REVIEW**.

Real provider/public-receivable entitlement and authority proof, registry/mapping/crosswalk/methodology/timezone/policy approval, and operational source validation remain external responsibilities. Timezone support is deliberately limited to UTC and Asia/Ho_Chi_Minh. UNKNOWN provider-only substitution is not authorized. Authority revocation/ranking and source fetch are outside this slice. Existing bank/insurance/securities governance gaps remain unresolved. Synthetic tests demonstrate the contract, not real financial evidence or production readiness.

No DI gate is promoted to PASS. DI11 implementation improved; operational validation is not certified. scoringReadiness stays DEFERRED_SLICE_06. No Slice 06, scoring bridge/readiness engine, VN30 ranking, Top 10, valuation, portfolio decision, DCA recommendation, UI, cron or source fetch; no production DB, self-approval, commit or push. Stop for Slice 05 final review.

Remediation files: domain availability.ts, availability-evidence.ts, contracts.ts and snapshot.ts; infrastructure fundamental-snapshot.ts; tests/fixtures/availability-evidence.ts and reviewed-slice5-v1-golden.json; tests/unit/fundamentals-availability-evidence.test.ts and fundamentals-availability-legacy.test.ts; tests/integration/fundamentals-availability-evidence.test.ts; this report.
