# PEC-2 — Source Authority Admission & Evidence Binding

**Final status: IMPLEMENTATION_READY_DEPENDENCY_BLOCKED. PEC-1 dependency: BLOCKED.**

## 1. Executive summary

Implemented a deterministic offline admission evaluator, exact evidence bindings, scope enforcement, revocation checks, a proposed consumption interface and a sealed review packet. All eight real candidates are recommended DEFERRED and effectively DEFERRED. Effective source admissions: zero. No owner approval, acceptance or production activation was created. This is non-production preparation explicitly permitted by the PEC-2 request when PEC-1 approval is missing.

## 2. PEC-1 dependency status

Current PEC-1 verifier passes, including its protected inputs, sealed package inventory, original PE3 candidates and PE4 replay. Its final status is PARTIALLY_READY, all eight recommendations are DEFERRED, and every owner decision/identity/timestamp/receipt is still null. The real authenticated trust configuration remains empty. The current database has no exact source-publication/identity authority approvals; existing static executable/methodology production authority is separate. Source approval cannot be inferred from that authority, a file, implementation completion or this mission request.

PE4 replay still reports eight technically verified source chains, 45 mappings, 51 source operands, zero approved authority chains, zero complete knowledge chains, zero AS_KNOWN eligible obligations, zero formal acceptance/admission, and 216 unresolved minimum obligations. It records 104 exact retained Vietstock document matches, which are neither approved facts nor additive to the 45 reviewed mapping links. Full replay and dependency results are retained in PEC1_VERIFICATION.json, PE4_CURRENT_REPLAY.json and DEPENDENCY_STATUS.json.

## 3. Admission contract

ADMISSION_CONTRACT.json defines every required record field and its validation rule. A record contains identity, owner reference, exact bundle reference/hash, publisher/source/document identities, dataset scope, ticker/period/statement/metric coverage, publication timestamp, cutoff, restrictions, status, validation result, timestamp, revocation status and audit references. Unknown owner references, cutoffs and timestamps remain null in previews. DATE_ONLY publication preserves its verified date and next-local-day boundary; it never acquires an invented timestamp.

Admission ID is canonical SHA-256 of candidate ID, core evidence hash and dataset scope. Evidence hash is canonical SHA-256 of the immutable core. Receipts sit outside the core to avoid circular hashing. The original PEC-1 bundle hash remains a separate identity. A separate admission event binds admission ID, candidate ID, evidence hash, exact scope, restrictions and owner reference.

All prerequisites must pass before ELIGIBLE. ELIGIBLE grants no use. ADMITTED or RESTRICTED in offline replay additionally requires an independently authenticated, explicit owner admission event; no automatic transition occurs. Missing dependencies produce DEFERRED; invalid/changed/unsupported/conflicting inputs produce REJECTED; authoritative revocation produces REVOKED. Caller status, PASS flags and timestamps cannot grant admission. Actual effective states live in the evaluation envelope, separate from recommendations and input preview fields.

## 4. Evidence binding results

Every core binds the original PEC-1 snapshot and PE3 candidate hash, archived publisher/source/document, original publication-method identity, immutable file hashes and exact JSON Pointers. Each knowledge clock has its own pinned evidence pointer. Financial mappings retain the PE4 mapping body digest, canonical concept, exact period/scope and original source-cell document hash. Missing or modified files, pointer substitution, wrong publisher/publication identity, relabelled mappings or mismatched owner/acceptance hashes are rejected. No alternate bundle or latest-wins selection is supported.

Technical integrity of all eight real bundles is verified. Their mandatory governance bindings fail closed: no authenticated PEC-1 owner receipt, accepted financial mapping receipt, independent acceptance, complete knowledge/cutoff chain, approved validity or fresh revocation snapshot. No technical PASS is converted into human acceptance. See EVIDENCE_BINDING_RESULTS.json and per-candidate evaluation blockers.

## 5. Dataset scope validation

An admission is limited to one retained research ticker, exact reporting period/frame, statement type, consolidated/standalone scope, source version and sorted metric set. Owner approval and both acceptance receipts must bind the identical scope. Each proposed consumption must match that scope, publication date and actual cutoff; new metrics, periods, datasets, tickers or versions cannot inherit admission. Unsupported tickers are rejected and MBB remains deferred. The retained basket is not a claim of current exchange constituent certification.

These eight previews are document-level FINANCIAL_STATEMENTS proposals. PE4 instant stock periods and flow periods are preserved separately in the mapping references; no source period or financial value was rewritten. Before any future fact admission, the Data Quality Owner must provide appropriately narrowed period/frame/statement/metric scopes and accepted mappings. HPG FY2025 and VJC FY2025 have no mappings in PE4’s reviewed 45 and retain empty, unqualified metric coverage. No scope inference or financial mapping approval was performed.

## 6. Admission candidate inventory

| Ticker | Document period end | Proposed mapped metrics | Recommended | Effective | Owner approval |
|---|---|---:|---|---|---|
| GVR | 2026-06-30 | 8 | DEFERRED | DEFERRED | Missing |
| HPG | 2025-12-31 | 0 | DEFERRED | DEFERRED | Missing |
| VRE | 2026-06-30 | 8 | DEFERRED | DEFERRED | Missing |
| VNM | 2026-06-30 | 7 | DEFERRED | DEFERRED | Missing |
| VJC | 2026-06-30 | 8 | DEFERRED | DEFERRED | Missing |
| VJC | 2025-12-31 | 0 | DEFERRED | DEFERRED | Missing |
| SSB | 2026-06-30 | 6 | DEFERRED | DEFERRED | Missing |
| GAS | 2026-06-30 | 8 | DEFERRED | DEFERRED | Missing |

The inventory is one proposal per original source bundle, not eight production authority records. Exact candidate/admission IDs, restrictions, source paths and hashes are in ADMISSION_CANDIDATES.json and EVIDENCE_BUNDLES.json.

## 7. Validation results

Current runs: 47 PEC-2 tests PASS, 13 PEC-1 tests PASS, 43 PE4 adversarial tests PASS and 76 runtime safety/integration tests PASS; 179 tests total. All commands, exit codes and logs are recorded in TEST_RESULTS.json. Runtime tests used project-supported Node v22.23.2 and pnpm 10.34.5.

Tests cover a valid approved synthetic source (ELIGIBLE only), separately admitted synthetic source, missing/expired/revoked owner approval, modified bytes/digests/bundle pointers, wrong publisher/publication identity, unverified/future publication, financial mapping conflicts, accepted-mapping metadata substitution, null/modified knowledge evidence, cutoff violations, restricted scope, every scope dimension, unsupported ticker/period, duplicate admission, conflicting authority, missing/failed independent acceptance, stale/unknown revocation, post-admission revocation, backdating, admission-before-acceptance, approval-after-source-knowledge, malformed input and unauthorized scoring/ranking/Top 10/D2/investment activation. They also verify caller ADMITTED/PASS/timestamp claims cannot grant authority.

Positive approval/admission fixtures exist only in temporary test directories and use explicit simulated authentication. They are not real owner evidence and never become production records. No authentication provider, authority writer or production adapter is installed. Full application build/lint/typecheck/full-suite were not rerun for isolated Python tooling; historical PE4 results are not claimed as fresh passes. Prior known full-suite and lint failures remain historical open issues.

## 8. Remaining blockers

- Authenticated PEC-1 owner decisions, exact source/publication/identity methods, validity and prospective effectivity remain absent for all eight candidates.
- Formal ingestion, mapping, methodology, registry, source/publication/identity method clocks and other required boundaries remain incomplete; actual systemKnownAt and decisionAsOf remain null.
- Financial mapping acceptance and independent human acceptance are absent. Six limited mappings remain unaccepted; broader comprehensive-debt and SSB regulatory/NPL interpretations remain restricted.
- Document-level previews require explicit fact-level scope and mapping qualification; HPG FY2025 and VJC FY2025 lack mappings in PE4’s review.
- No independently authenticated fresh revocation service/snapshot or separate owner admission events are supplied.
- A production adapter and activation review remain outside authorized scope while PEC-1 is blocked. No integration may treat the offline result as runtime permission.
- The inherited 216-obligation minimum dataset is not closed; 171 obligations remain outside PE4’s financial review and VNM comprehensive debt has no canonical candidate.

## 9. Files created or modified

No pre-existing file was modified. New implementation files:

- `scripts/lib/pec2_admission.py` — offline evaluator, immutable evidence checks and proposed consumption boundary.
- `scripts/prepare-pec2-evidence.py` — read-only dependency inspection and non-production preview builder; refuses overwrite of an existing candidate packet.
- `scripts/test-pec2-admission.py` — 47 temporary synthetic-fixture tests.
- `scripts/verify-pec2-evidence.py` — packet, original evidence, database and deterministic-result replay.

New packet artifacts:

- `docs/fundamental-data-engine/evidence/2026-10-23-production-evidence-closure-pec2/ADMISSION_CANDIDATES.json`
- `docs/fundamental-data-engine/evidence/2026-10-23-production-evidence-closure-pec2/ADMISSION_CONTRACT.json`
- `docs/fundamental-data-engine/evidence/2026-10-23-production-evidence-closure-pec2/ARTIFACT_HASHES.json`
- `docs/fundamental-data-engine/evidence/2026-10-23-production-evidence-closure-pec2/BASELINE_PINS.json`
- `docs/fundamental-data-engine/evidence/2026-10-23-production-evidence-closure-pec2/CLOSURE_REPORT.md`
- `docs/fundamental-data-engine/evidence/2026-10-23-production-evidence-closure-pec2/DATABASE_BASELINE.json`
- `docs/fundamental-data-engine/evidence/2026-10-23-production-evidence-closure-pec2/DEPENDENCY_STATUS.json`
- `docs/fundamental-data-engine/evidence/2026-10-23-production-evidence-closure-pec2/EVIDENCE_BINDING_RESULTS.json`
- `docs/fundamental-data-engine/evidence/2026-10-23-production-evidence-closure-pec2/EVIDENCE_BUNDLES.json`
- `docs/fundamental-data-engine/evidence/2026-10-23-production-evidence-closure-pec2/EVIDENCE_SEAL.json`
- `docs/fundamental-data-engine/evidence/2026-10-23-production-evidence-closure-pec2/FINAL_STATUS.json`
- `docs/fundamental-data-engine/evidence/2026-10-23-production-evidence-closure-pec2/INTEGRATION_BOUNDARY.md`
- `docs/fundamental-data-engine/evidence/2026-10-23-production-evidence-closure-pec2/OWNER_REQUEST.md`
- `docs/fundamental-data-engine/evidence/2026-10-23-production-evidence-closure-pec2/PE4_CURRENT_REPLAY.json`
- `docs/fundamental-data-engine/evidence/2026-10-23-production-evidence-closure-pec2/PEC1_VERIFICATION.json`
- `docs/fundamental-data-engine/evidence/2026-10-23-production-evidence-closure-pec2/PRODUCTION_MUTATION_AUDIT.json`
- `docs/fundamental-data-engine/evidence/2026-10-23-production-evidence-closure-pec2/TEST_RESULTS.json`
- `docs/fundamental-data-engine/evidence/2026-10-23-production-evidence-closure-pec2/TRUST_BOUNDARY.json`
- `docs/fundamental-data-engine/evidence/2026-10-23-production-evidence-closure-pec2/validation/pe4.log`
- `docs/fundamental-data-engine/evidence/2026-10-23-production-evidence-closure-pec2/validation/pec1.log`
- `docs/fundamental-data-engine/evidence/2026-10-23-production-evidence-closure-pec2/validation/pec2-verification.json`
- `docs/fundamental-data-engine/evidence/2026-10-23-production-evidence-closure-pec2/validation/pec2.log`
- `docs/fundamental-data-engine/evidence/2026-10-23-production-evidence-closure-pec2/validation/runtime-results.json`
- `docs/fundamental-data-engine/evidence/2026-10-23-production-evidence-closure-pec2/validation/runtime-safety.log`

## 10. Evidence hashes

ARTIFACT_HASHES.json pins every sealed packet artifact and all four implementation files. EVIDENCE_SEAL.json pins that inventory; it establishes integrity only, not approval. BASELINE_PINS.json retains the original data/source/evidence/policy byte hashes; full database byte/logical/table-count evidence is in DATABASE_BASELINE.json. Post-seal validation/pec2-verification.json is excluded from its own inventory to avoid a self-hash.

Prior dependency seal SHA-256:

- `2026-10-21-primary-publication-evidence-pe1`: `667e6ac04f8a9170090965f84caa22cc85e6b963009bda9758a119780f701596`
- `2026-10-22-primary-publication-evidence-pe2`: `2e2000fbdb128e8841d5836400a43cc61e4182f83314a16b98ea61fa19d6c94c`
- `2026-10-22-primary-publication-evidence-pe3`: `fd44a3f90692e5d1e1d46cb6ce6ca92f26d26710232bb230ec93fa783aa721d4`
- `2026-10-22-primary-publication-evidence-pe4`: `ce3587ec4552a015506a18feaaaa81b12cd2af12f129343969527cd1677fb3fe`
- `2026-10-22-production-evidence-closure-pec1`: `f683e37714c63cf41771a231b3db58c10d2de7fb252f2effcf68a35727cc2fd9`

PEC-2 core SHA-256 per candidate:

- GVR 2026-06-30: `ae27ae29228ee66b3d35f66f61b2d8e421e22115d6d90e9681935743d60c6313`
- HPG 2025-12-31: `17f61c430296806bf8ee2133ce36d98f39c768a9d03a7be0d6336fc956911f03`
- VRE 2026-06-30: `ea0db0d6395dba2becd9af288d5aaf5ce3db078a731aa1b23066f4605eecd6d9`
- VNM 2026-06-30: `36577b0b90eba2af39ae1321f8aae534b891c5f75da9c1b355e683c3e6275e56`
- VJC 2026-06-30: `44dc2f0392fd4ad7fc0a5b392d629d0576e68a7c080da69a6bb081e2a2ea4893`
- VJC 2025-12-31: `aa946e90d20f4796302e172dc3040c84b7f1e5c4524cdae7a2b5f3dd5738d282`
- SSB 2026-06-30: `a7b0260c5a8340dbe278b261dd21df7b472f8876966dff3d53ddd104a50d75c5`
- GAS 2026-06-30: `4441061f4cb0af3c575fed276a2567a21a3bfc0ffa02f50c45247a2c2943c507`

## 11. Production safety confirmation

All 5928 protected files match the pre-work inventory. Database bytes, logical dump, table counts and methodology/authority rows are unchanged. PE1–PE4 and PEC-1 remain unchanged and replayable. Investment source code, source acquisition policy, dependency heads, runtime authority and frozen investment baselines are unchanged. No source was admitted; no FORMAL facts, source approvals, acceptance records, D2 activation, scoring, ranking, Top 10 or investment decisions were created.

Existing static production authority is not new source approval. The inspected Fundamental Data Engine, Market Data Boundary, Scoring Engine and Production Runtime Authority interfaces and future adapter requirements are documented in INTEGRATION_BOUNDARY.md. All evaluator and consumption results retain productionUseAuthorized=false, runtimeActivationAuthorized=false and scoringAuthorized=false. No runtime source imports the new Python tooling.

Financial document discovery/acquisition remains Vietstock-only, including every redirect. This work read archived local evidence and made no network acquisition. No issuer/exchange collection was restored. Pending evidence was not promoted, decisions were not backdated, owner identities were not impersonated and no schema status was treated as authentication.

## 12. Owner decisions required

The Investment System Owner must review the PEC-2 contract and each exact PEC-1 candidate/evidence hash. The current source recommendations remain DEFERRED. A later approved/restricted decision requires independently authenticated owner identity/authority, exact candidate and bundle versions/hashes, actual decision/knowledge events, prospective effective interval, evidence validity and explicit restrictions. Preserve old seals and append a new versioned decision; do not fill historical placeholders or treat this request as source approval.

The Data Evidence Reviewer must verify original publisher/publication/provenance; the Data Quality Owner must provide accepted exact financial scopes/mappings and completeness/perimeter decisions; the Independent Validator must supply independent human acceptance. Actual cutoff receipts and a fresh authenticated revocation source must be supplied before eligibility. Effective admission additionally requires a separate owner instruction/event, and production integration requires its own authorized review.

Stop boundary: PEC-2 only. Final status is IMPLEMENTATION_READY_DEPENDENCY_BLOCKED, not APPROVED. PEC-3 was not started and requires explicit authorization.
