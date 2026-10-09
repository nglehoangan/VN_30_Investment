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
