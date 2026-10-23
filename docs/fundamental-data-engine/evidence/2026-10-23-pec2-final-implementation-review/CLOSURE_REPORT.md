# PEC-2 — Final Implementation Validation & Evidence Closure

**Final status: IMPLEMENTATION_READY_DEPENDENCY_BLOCKED.**

## 1. Executive summary

Target commit `cceffa32439b2acdb448f2175520178fd8d87d46` passes its original 47-test suite and integrity verifier, but the implementation is incomplete against the required admission invariants. This review reproduced six defects: four Major and two Minor. The target as committed is therefore REWORK_REQUIRED. All six are corrected in a new, explicitly selected v2 offline evaluator; the original target implementation and sealed evidence remain byte-identical for audit.

The corrected worktree is IMPLEMENTATION_READY_DEPENDENCY_BLOCKED. PEC-1 has no authenticated source owner approval. All eight real source candidates remain DEFERRED, with zero effective source admissions and all production authorization flags false. The original defects were latent offline-contract defects, not observed production admissions or scoring activation. This review grants no source authority or production approval.

## 2. Commit and changed-file inventory

Target: `cceffa32439b2acdb448f2175520178fd8d87d46`. Parent: `380305854a0105b843e92be9a01dede92e4894f0`. Target commit authored/committed 2026-10-23 11:21:38 +0700. Initial HEAD equals target and working tree was clean.

The parent-to-target diff adds 28 files: four Python implementation/test tools and 24 contract/evidence/validation artifacts. No existing file is modified or deleted. No TypeScript investment/runtime source, production configuration, package/dependency file, database schema, source acquisition policy or runtime composition is changed by the commit. COMMIT_INVENTORY.json records every path, classification, byte size and SHA-256, verified against `git show TARGET:path`.

Implementation additions and actual behavior:

- `scripts/lib/pec2_admission.py`: deterministic evidence/identity/scope/publication/knowledge/owner/acceptance/revocation checks; admission states and offline consumption check; production permissions always false.
- `scripts/prepare-pec2-evidence.py`: read-only inspection and eight deferred previews; empty real trust, null owner/admission receipts; no source acquisition or authority write.
- `scripts/test-pec2-admission.py`: 47 synthetic temporary-fixture tests, including simulated approval/admission; no production authority records.
- `scripts/verify-pec2-evidence.py`: sealed bytes, database, prior package and expected-deferred replay. Its exhaustive namespace comparison is historical: the baseline command passes before review artifacts are added. The current review verifier permits only this authorized review directory as additional evidence while pinning all original bytes.
- Contract/evidence artifacts: explicit field rules, eight immutable cores and preview records, dependency/selection boundaries, test logs, database/data snapshots, integrity inventory and seal. These are not authentication or runtime configuration.

Implementation differences from the required design: the target omitted unconditional rehash of mandatory source pins, immutable proofs for additional knowledge events, exact inventory membership and whole-report conflict detection, authenticated state-history enforcement, INSTANT-frame consistency and strict array JSON Pointer syntax. All are corrected in v2. An actual authentication provider, persisted authority/history registry and production adapter remain absent by design because PEC-1 approval is missing; this review does not claim an operational production admission service.

## 3. PEC-1 dependency verification

PEC-1 implementation, decision register and integrity seal exist and pass current technical verification. The register still has eight DEFERRED recommendations with ownerDecision, ownerIdentity, decisionTimestamp and ownerReceipt all null. Source approval evidence is absent, cannot be authenticated, and therefore cannot establish a matching approval scope. Independent technical replay passed; authenticated independent human acceptance remains zero. Current native exact source-publication/identity authority lookups remain empty.

Existing approved static scoring executable/methodology authority is separate from approval of the proposed sources. Neither commit existence, a recommendation, a technical PASS nor this review instruction approves a source. PEC-1 dependency remains BLOCKED. New history/revocation trust is also empty; no simulated proof is copied into real composition.

PE4 current replay remains eight technically verified chains, 45 mappings/51 operands, zero complete approved authority/knowledge chains and zero AS_KNOWN/formally accepted/admitted obligations. The minimum dataset remains 216 unresolved obligations, including 171 outside the reviewed 45 and a missing VNM comprehensive-debt candidate. The 104 exact retained Vietstock document matches are a separate coverage dimension, not approved publication/fact coverage.

## 4. Gate-by-gate PEC-2 validation

| Gate | Review result | Effective real admission result |
|---|---|---|
| Source identity | PASS: original candidate/source/document identities and mandatory byte pins rehashed; F001 fixed | Source approval still required |
| Publisher identity | PASS: exact original issuer/legal identity, source and document binding | No inferred publisher authority |
| Publication evidence | PASS technical: original date, precision, timezone and next-local-day DATE_ONLY boundary | No invented timestamp or D2 activation |
| Bundle hash | PASS: canonical core digest, exact bundle reference and strict JSON Pointer; F006 fixed | Missing/modified proofs deny admission |
| Financial mapping | PASS technical binding/negative tests; real acceptance PENDING; F003 conflicts fixed | DEFERRED |
| Knowledge/cutoff | PASS fail-closed enforcement, including pinned additional events; F002 fixed | Missing formal clocks/cutoffs remain DEFERRED |
| Independent acceptance | PASS receipt digest/scope/identity/cutoff negative tests | PENDING authenticated human acceptance |
| Owner approval | PASS fail-closed exact PEC-1 receipt/scope/effectivity checks | BLOCKED: no authenticated owner receipt |
| State history/revocation | PASS fresh history/terminal-state/transition checks; F004 fixed | PENDING external authenticated history/revocation service |

Changing mandatory source bytes, publisher/publication identity, core hash/reference, accepted mapping, knowledge evidence, independent receipt or owner receipt invalidates eligibility/admission in the adversarial suite. No fallback bundle, latest-wins or source replacement is selected. INSTANT requires one date; unknown periods, cutoffs, validity and required event lists remain explicit and blocking.

## 5. Critical / Major / Minor findings

Code findings: zero Critical, four Major and two Minor. All six are fixed in the reviewed v2 implementation. Open Critical items below are readiness dependencies, not evidence of a production bypass.

| ID | Severity | Confirmed defect at target | Fix |
|---|---|---|
| F001 | MAJOR | Mandatory archived source evidence could escape rehashing | Always rehash mandatory PEC-1 pins, independent of optional pin trees. |
| F002 | MAJOR | Additional required knowledge events accepted unproven references | Require pinned bytes/pointer and exact clock/reference binding for each additional required event. |
| F003 | MAJOR | Inventory alias and whole-report conflicts were not rejected | Require exact unique inventory membership; whole-report scopes conflict with component scopes. |
| F004 | MAJOR | State history was not enforced across admission evaluations | Require fresh authenticated history; terminal rejection/revocation and restrictions persist; revoked validation fails. |
| F005 | MINOR | INSTANT reporting frame allowed a range spanning a year | Require equal start/end for INSTANT. |
| F006 | MINOR | JSON Pointer accepted negative Python array indices | Use strict RFC 6901 escaping and canonical nonnegative array indices. |

FINDINGS.json includes reproducing test names, original and fixed source references/hashes, severity rationale and disposition. The original suite missed these invariants: the expanded 62-test suite against v1 yields 26 failed assertions/subtests, including transition-matrix failures and one v2-only positive proof schema case. This is not a claim of 26 independent defects. The corrected v2 suite has zero failures/errors.

## 6. Fixes and admission state-machine review

Corrective implementation: `scripts/lib/pec2_admission_v2.py`. Current selection and source hash: IMPLEMENTATION_SELECTION.json. The original v1 is retained for historical sealed replay only and must not be selected for new operational decisions. The review verifier imports v2 explicitly; the test-only PEC2_REVIEW_ENGINE selector cannot change runtime composition. No production adapter selects either evaluator.

V2 requires independently authenticated composition to supply a fresh admissionHistory snapshot with asOf, validThrough and per-admission state/evidenceHash/recordedAt. A missing/stale snapshot or digest mismatch blocks. An authoritative REVOKED history cannot reactivate when a later current revocation list omits the ID; an authenticated REJECTED history also requires a new reviewed evidence version/ID. RESTRICTED cannot become unrestricted under the same ID. Active histories require their authenticated event, and an event cannot predate history, approval effectivity, acceptance or knowledge.

The 24-case transition matrix covers all six states with/without an admission event and restrictions. DEFERRED/ELIGIBLE require all mandatory gates before eligibility; explicit authenticated events are required for ADMITTED/RESTRICTED. Active states lose effectivity when required evidence/events disappear. Terminal states cannot reopen under the same ID. Caller recommended/effective status claims, timestamps and PASS strings are never authorization. Every consumption rechecks evidence, exact dataset scope, cutoff, history and revocation; scoring/ranking/Top 10/D2/investment actions remain prohibited.

No code gate was weakened, historical seal rewritten, frozen investment policy changed, source fact admitted or simulated approval converted to a real record. CONTRACT_AMENDMENT_V2.json documents the stricter proof contract and its compatibility boundary. New proof content changes core hashes and requires new actual approvals; no approval is reused across scopes.

## 7. Tests executed

Exact commands, environments, durations, exit codes and logs are retained in REVIEW_TEST_COMMANDS.json, NATIVE_TEST_RESULTS.json and validation/. Commands used supported Node v22.23.2/pnpm 10.34.5 for native checks.

| Command/check | Fresh result |
|---|---|
| `python3 scripts/test-pec2-admission.py` at target | 47 passed |
| `PEC2_REVIEW_ENGINE=v1 python3 scripts/test-pec2-final-review.py --json …` | 62 run; 26 failed assertions/subtests; expected defect/migration reproduction |
| `PEC2_REVIEW_ENGINE=v2 python3 scripts/test-pec2-final-review.py --json …` | 62 passed, including inherited 47 and 24-case state matrix |
| `python3 scripts/test-pec1-authority.py` | 13 passed |
| `python3 scripts/test-pe4-evidence.py` | 43 passed |
| `python3 scripts/verify-pec1-evidence.py` | PASS, before and during review |
| `python3 scripts/verify-pec2-evidence.py` before additive review files | PASS historical target integrity/deferred replay |
| `pnpm typecheck` | PASS |
| `pnpm build` | PASS |
| `pnpm test:boundaries` | 101 passed |
| `pnpm lint` | FAIL: same one unused-binding warning, zero errors; zero-warning threshold preserved |
| `pnpm test --reporter=json --outputFile=/private/tmp/pec2-final-review-work/full-results.json` | 2,167 passed / 18 failed; 2,185 total |
| `python3 scripts/verify-pec2-final-review.py` | Final sealed current review replay; result in validation/final-verification.json |

Tests include all requested negatives: absent/revoked owner approval, wrong evidence digest, invalid publication identity, conflicting mapping, unsupported ticker/period, future knowledge, duplicate admission and unauthorized production activation. They also cover omitted source pins, additional event proofs, inventory aliasing, whole-report conflicts, terminal history, restrictions, stale history/revocation, malformed input, backdating and JSON Pointer aliases. All approval/admission-positive fixtures remain temporary synthetic test data; no real owner approval is manufactured.

## 8. Pass/fail summary and baseline reconciliation

PEC-2 corrected tests, original target tests, PEC-1/PE4 tests, current integrity replays, typecheck, build and boundary tests pass. The full application suite is not green: all 18 current failures match PE4 by exact file and full test name, with zero new or resolved failure identities. FULL_SUITE_COMPARISON.json retains that comparison, individual current failure messages and the raw report hashes. No test assertions, timeouts, golden artifacts, investment contracts or thresholds were changed to make checks pass.

Lint still fails on `docs/fundamental-data-engine/evidence/2026-10-21-escalated-blocker-resolution/verify-engineering.mjs:7` for unused `instantiateSectorRequirements`. It is an older sealed helper outside PEC-2. Historical artifact/hash/path failures and this warning require a separate maintenance workstream. The user-authorized data cleanup/rebuild must not be reversed by fabricating old source evidence or extracted accounting amounts. These failures are disclosed, not waived or relabelled PASS.

## 9. Remaining blockers and real candidate inventory

| Ticker | Document period end | Effective state |
|---|---|
| GVR | 2026-06-30 | DEFERRED |
| HPG | 2025-12-31 | DEFERRED |
| VRE | 2026-06-30 | DEFERRED |
| VNM | 2026-06-30 | DEFERRED |
| VJC | 2026-06-30 | DEFERRED |
| VJC | 2025-12-31 | DEFERRED |
| SSB | 2026-06-30 | DEFERRED |
| GAS | 2026-06-30 | DEFERRED |

Every real candidate lacks authenticated PEC-1 approval and scope/effectivity/validity proof, accepted financial mapping, complete formal knowledge/cutoffs, independent human acceptance, authenticated history/revocation and a separate owner admission event. HPG FY2025 and VJC FY2025 have no mappings in PE4’s 45-obligation review. Six financial perimeter limitations remain unaccepted. Document-level envelopes cannot replace fact-level instant/flow/statement/metric qualification.

A real authenticated identity/trust provider, append-only history/revocation registry, production adapter and activation decision remain outside this review’s implementation scope while PEC-1 is blocked. Empty production trust is preserved. No synthetic service or approval is created to fill those gaps. The full-suite/lint baseline issues also remain open.

## 10. Repeated blocker escalation

REPEATED_BLOCKER_ESCALATION.json retains first-observation references, inherited review counts, root causes, attempted resolutions, current impact, owners, decisions and recommendations. The authoritative historical root-cause count is five; it is not reset or represented as five independent human approvals. Later technical persistence through PE3, PE4, PEC-1, PEC-2 and this review is recorded separately and not blindly added to that count. The existing global register remains unchanged.

| Blocker | Earliest explicit component step in this lineage | Inherited root-cause cycles | Current review severity | Disposition |
|---|---|---:|---|---|
| PE3_EXACT_SOURCE_AUTHORITY | PE1 | 5 | CRITICAL | ESCALATED |
| PE3_FORMAL_KNOWLEDGE | PE1 | 5 | CRITICAL | ESCALATED |
| PE3_ACTUAL_DATASET_CUTOFFS | PE2 | 5 | CRITICAL | ESCALATED |
| PE3_ECONOMIC_PERIMETER_LIMITATIONS | PE3 | 5 | MAJOR | ESCALATED |
| PE3_INDEPENDENT_ACCEPTANCE_AND_D2_ACTIVATION | PE1 | 5 | CRITICAL | ESCALATED |
| MINIMUM_DATASET_OUTSIDE_PE4_REVIEW_SCOPE | PE1 | 5 | CRITICAL | ESCALATED |

The parent root cause was already observed before PE1 as RUNTIME_SOURCE_AVAILABILITY in production-scoring-blocker-resolution evidence; that exact reference is retained. Component IDs were introduced at PE3. Critical here means a missing mandatory production-readiness prerequisite; the historical parent register’s MAJOR severity is preserved. Unresolved repeated Critical dependencies are explicitly ESCALATED. The inherited digit/box subblocker is technically closed by PE4 and is not reopened from stale GVR prose.

Required resolutions: the Investment System Owner supplies authenticated exact source decisions; lineage/mapping/methodology owners supply immutable clocks; the dataset owner supplies actual cutoffs; the Data Quality Owner resolves financial perimeter and coverage; the Independent Validator supplies human acceptance. A separate owner-authorized Vietstock-only coverage workstream is required for remaining obligations. No source-admission/D2/scoring relaxation follows from those decisions. Repeated baseline QA/lint issues are separately escalated with their documented technical review-step count and maintenance recommendations.

## 11. Production safety, files and evidence hashes

All 5952 preexisting protected files and all 28 target commit files are byte-identical. Database byte hash, logical dump, table counts and methodology/authority rows are unchanged. Source acquisition and runtime configuration, frozen investment source, all previous evidence seals and the global escalation register are preserved. Database SHA-256: `45fa5e849a38367ceef78d6fb0d38c98853ee0ebd03ad7eb35eed33fc8228210`.

The final inventory check observed 92 additional ignored generated TypeScript files ending in space-2.ts or space-3.ts. Each was absent from the initial inventory and byte-identical to its unchanged canonical generated counterpart. Only those verified disposable duplicates were removed; cause is not attributed. GENERATED_DUPLICATE_CLEANUP.json records every path/hash/counterpart. No preexisting or custom source was removed. Final protected inventory and database checks pass.

No unapproved/pending/revoked source becomes usable in production; all evaluator and consumption results retain productionUseAuthorized=false, runtimeActivationAuthorized=false and scoringAuthorized=false. No source was admitted, no source authority/acceptance written, no D2 activation performed, and no scoring, ranking, Top 10, allocation or investment decision generated. No new financial PDF acquisition occurred; Vietstock-only discovery/redirect policy remains unchanged.

Corrective files added (no existing implementation file modified):

- `scripts/lib/pec2_admission_v2.py` — corrected, versioned offline evaluator.
- `scripts/test-pec2-final-review.py` — target reproduction and current regression suite; exact engine is explicit/test-only.
- `scripts/verify-pec2-final-review.py` — current sealed review verification with preserved target/source/database evidence.
- `docs/fundamental-data-engine/evidence/2026-10-23-pec2-final-implementation-review/` — commit inventory, findings, contract amendment, current evaluations, test results, escalation/audit ledgers, report and integrity seal.

The target commit’s complete 28-path inventory is appended below and in COMMIT_INVENTORY.json. ARTIFACT_HASHES.json pins every new sealed review artifact and all three corrective tools. EVIDENCE_SEAL.json pins that inventory; neither is owner approval. Post-seal validation/final-verification.json is excluded from its own inventory to avoid self-hashing. Each original source/candidate/evidence hash remains separately traceable; current candidate digests are in CURRENT_CANDIDATE_RESULTS.json.

## 12. Final recommendation and owner decisions

Accept the v2 fixes for owner review as IMPLEMENTATION_READY_DEPENDENCY_BLOCKED; do not treat the original target commit alone as successfully closed, and do not mark PEC-2 APPROVED. Select only the reviewed v2 evaluator for new offline admission work. Keep the real admission path and all scoring dependencies blocked until authenticated owner/source decisions and the mandatory independent evidence are supplied.

The Investment System Owner must review each exact PEC-1 candidate and evidence hash, approve/restrict/defer/reject through authenticated evidence, and provide prospective validity/effectivity and real knowledge proofs. Independent mapping/perimeter/coverage/cutoff acceptance is separately required. A real history/revocation service and any production adapter/activation must receive their own authorized implementation and review. No approval is inferred from this implementation review.

Stop after PEC-2. PEC-3 was not started.

### Complete target changed-file inventory

- `A docs/fundamental-data-engine/evidence/2026-10-23-production-evidence-closure-pec2/ADMISSION_CANDIDATES.json` — SHA-256 `524a0be40362dd6e6097749626518d8f798cc584ae34dc0190c92b6788e7eef5`
- `A docs/fundamental-data-engine/evidence/2026-10-23-production-evidence-closure-pec2/ADMISSION_CONTRACT.json` — SHA-256 `0fd6a624f17b58d5b71e65ee67863beedb10aba0e5fdf110dbc1d987a08a796e`
- `A docs/fundamental-data-engine/evidence/2026-10-23-production-evidence-closure-pec2/ARTIFACT_HASHES.json` — SHA-256 `f9a0288d0c65332173c95c9d41c35e928c88f99050baa539945063321219e969`
- `A docs/fundamental-data-engine/evidence/2026-10-23-production-evidence-closure-pec2/BASELINE_PINS.json` — SHA-256 `6fd535221bdbaaa9a63e94a37a08c479892c4f91922e9105622be6a3a56bfa22`
- `A docs/fundamental-data-engine/evidence/2026-10-23-production-evidence-closure-pec2/CLOSURE_REPORT.md` — SHA-256 `2a05ed03d4f29fe836ecda83536d16388ea7285bbb709fe00806cd3568a06d05`
- `A docs/fundamental-data-engine/evidence/2026-10-23-production-evidence-closure-pec2/DATABASE_BASELINE.json` — SHA-256 `d6628ae8a3886264fd35fec00cefa71c85ab726e3153e317de100f8fe7e02f89`
- `A docs/fundamental-data-engine/evidence/2026-10-23-production-evidence-closure-pec2/DEPENDENCY_STATUS.json` — SHA-256 `54d54ea6784b800d8aaf96f4cf2d137282055ba0628d7d1a7763ce0fd81eac86`
- `A docs/fundamental-data-engine/evidence/2026-10-23-production-evidence-closure-pec2/EVIDENCE_BINDING_RESULTS.json` — SHA-256 `bd1c1760078b56d57e325e8a6aaf05147da49102be0f26d10d24c28166adb80a`
- `A docs/fundamental-data-engine/evidence/2026-10-23-production-evidence-closure-pec2/EVIDENCE_BUNDLES.json` — SHA-256 `21c5fd90c7a1dab3d24621499d31fed21651610486502cbd1328a9731f1db828`
- `A docs/fundamental-data-engine/evidence/2026-10-23-production-evidence-closure-pec2/EVIDENCE_SEAL.json` — SHA-256 `5d652b6889d59eb00aacbdcc9cf680c83eebdb7ca55917584cf4f9a0b8f8f197`
- `A docs/fundamental-data-engine/evidence/2026-10-23-production-evidence-closure-pec2/FINAL_STATUS.json` — SHA-256 `a516fc273b7bbb71bcd11a2226ffa7a9f3e1159e4ee7ee3849555f287205f2ce`
- `A docs/fundamental-data-engine/evidence/2026-10-23-production-evidence-closure-pec2/INTEGRATION_BOUNDARY.md` — SHA-256 `1794f699b53d4556b7900f5cab570215bba950c1219e94fe6e67d493a618d035`
- `A docs/fundamental-data-engine/evidence/2026-10-23-production-evidence-closure-pec2/OWNER_REQUEST.md` — SHA-256 `aa8c885b30e25820864c284c743d9283f2303e0bef38fb88a0a01538af35d46c`
- `A docs/fundamental-data-engine/evidence/2026-10-23-production-evidence-closure-pec2/PE4_CURRENT_REPLAY.json` — SHA-256 `e84360eed5f15edac2dc58302c1767512c1580cb965f81461841b63f7c1e6f21`
- `A docs/fundamental-data-engine/evidence/2026-10-23-production-evidence-closure-pec2/PEC1_VERIFICATION.json` — SHA-256 `75a17048cd8a877b7cfdb1a515b31efe9dcf258c0a473d7d5c2a98a7d4e5570e`
- `A docs/fundamental-data-engine/evidence/2026-10-23-production-evidence-closure-pec2/PRODUCTION_MUTATION_AUDIT.json` — SHA-256 `07c196ffeac2cefeabd207a1b23673fff960689daa1dc247309007975c909938`
- `A docs/fundamental-data-engine/evidence/2026-10-23-production-evidence-closure-pec2/TEST_RESULTS.json` — SHA-256 `a9d6df9913efc5543fdb88c246ebcadbd5678a7f43f0e0295141061a26b9037e`
- `A docs/fundamental-data-engine/evidence/2026-10-23-production-evidence-closure-pec2/TRUST_BOUNDARY.json` — SHA-256 `7d8f63af795e03b2aa8fd5b94b03280f28db4b8ee4d1f18fe0d8b93c2d832dfe`
- `A docs/fundamental-data-engine/evidence/2026-10-23-production-evidence-closure-pec2/validation/pe4.log` — SHA-256 `25cbcfd9ce40178797bc10a2f2360535b2a8f5cff32d5805f2363f572d9a9dc9`
- `A docs/fundamental-data-engine/evidence/2026-10-23-production-evidence-closure-pec2/validation/pec1.log` — SHA-256 `b986091cdd4d7aeb1185de9a51d74065913d71702d10fa5dada3e4c584a2ddd7`
- `A docs/fundamental-data-engine/evidence/2026-10-23-production-evidence-closure-pec2/validation/pec2-verification.json` — SHA-256 `0f6e83d704d2014744bf79c82affa5bc522eb83a995a0f5d5f9f5d37c9e7c224`
- `A docs/fundamental-data-engine/evidence/2026-10-23-production-evidence-closure-pec2/validation/pec2.log` — SHA-256 `e7c32202161db268497bf493d9ca01190dc347bd4f24689531022e409e69f218`
- `A docs/fundamental-data-engine/evidence/2026-10-23-production-evidence-closure-pec2/validation/runtime-results.json` — SHA-256 `5e3527e4c71d7c0e5f7baa95c0f766efcafb7a01fa9818e46effe7ec4dac6b2b`
- `A docs/fundamental-data-engine/evidence/2026-10-23-production-evidence-closure-pec2/validation/runtime-safety.log` — SHA-256 `cbe924390b091a8acdeead7315eafe3d4db8e1004a18596780d905eb2ef907c5`
- `A scripts/lib/pec2_admission.py` — SHA-256 `c99daf18a0a79f2d73fb4118fbffa9cf9e224481bceaa8a3e08a980eaa6b2f98`
- `A scripts/prepare-pec2-evidence.py` — SHA-256 `802d08185da16b9985d5b9011cdda379a6cfa83d0d7dc85f0dbea309aa2dfe72`
- `A scripts/test-pec2-admission.py` — SHA-256 `7e76efb0dca9cd330400cf7853f61b88834f89b6951d99f4ba4df5865f79ca4f`
- `A scripts/verify-pec2-evidence.py` — SHA-256 `8995f3045e47e940941ebe30ae51dcc192b98c15c25fc6f0e8c8aad675024043`
