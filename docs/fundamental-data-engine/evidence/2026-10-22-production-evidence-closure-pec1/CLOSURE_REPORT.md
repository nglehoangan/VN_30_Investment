# PEC-1 — Source Authority Owner Decision

**Final status: PARTIALLY_READY.** Eight recommendations are prepared for owner review; all recommend DEFERRED. No source authority has been approved. PRIMARY_PUBLICATION_EVIDENCE remains BLOCKED. PEC-2 was not started.

## Executive summary

Current read-only replay verified PE1–PE4 seals (235 sealed artifacts), eight exact source authority candidates and 45 financial mappings with 51 source operands. No prior approval or acceptance was inferred from technical verification. All eight candidates have G1/G2/G4 PASS and G3/G5/G6/G7/G8 PENDING. All effective states remain PENDING_REQUIRED_EVIDENCE.

## Actual PE4 baseline and reconciliation

PE4 FINAL_STATUS.json was recorded at 2026-10-22T14:12:59.529464+00:00 (21:12:59 Asia/Ho_Chi_Minh). The current replay agrees with its technical counts. PE3 proposed eight bundles containing 24 subcomponents; PE4 technically verifies eight chains, while zero have complete approved authority qualifications. Eight authority chains and all eight knowledge chains remain pending.

| Measure | Current evidence |
|---|---:|
| Authority candidates / technical chains verified | 8 / 8 |
| Owner-approved / complete approved authority chains | 0 / 0 |
| Complete knowledge chains / AS_KNOWN eligible | 0 / 0 |
| Source mappings technically verified / source operands | 45 / 51 |
| PE3 pending digit mappings now resolved | 7 |
| Limited mappings fully resolved | 0 of 6 |
| Independent human acceptance / formal acceptance / admission | 0 / 0 / 0 |
| Minimum obligations / canonical candidates / missing candidate | 216 / 215 / 1 |
| Outside archived financial review | 171 |
| Current exact Vietstock document matches / unmatched | 104 / 112 |
| Production-ready minimum obligations / unresolved | 0 / 216 |

The denominator covers 29 eligible stocks; MBB remains deferred. Coverage sets overlap and must not be added. The missing canonical candidate is VNM COMPREHENSIVE_FINANCIAL_DEBT, obligation 185. Six limited mappings remain unaccepted; narrow reported-borrowing recommendations do not establish comprehensive debt, and SSB accounting populations do not establish regulatory/NPL populations. GVR borrowing perimeter remains restricted.

PE3 reported 32 VERIFIED, six VERIFIED_WITH_LIMITATIONS and seven PENDING_EVIDENCE mappings. PE4 resolves the seven digit/box checks and technically verifies all 45 without closing financial governance acceptance. Two stale PE4 blocker narratives still mention GVR105 digit-pending and reviewing PE3 before PE4. These inconsistencies are preserved in PE4_RECONCILIATION.json; no sealed artifact was edited. The more specific PE4 cell receipts and current replay establish technical status.

## Candidate inventory and gates

Gate meanings: G1 Source Identity; G2 Publication Identity; G3 Publisher Authority; G4 Document Provenance; G5 Financial Mapping; G6 Knowledge/Cutoff Evidence; G7 Independent Validation; G8 Owner Approval. All eight are mandatory. NOT_APPLICABLE cannot bypass a mandatory gate. PASS for G1/G2/G4 concerns exact archived technical evidence only.

| Ticker | Period end | PE4 mapped obligations | G1 | G2 | G3 | G4 | G5 | G6 | G7 | G8 | Recommendation |
|---|---|---:|---|---|---|---|---|---|---|---|---|
| GVR | 2026-06-30 | 8 | PASS | PASS | PENDING | PASS | PENDING | PENDING | PENDING | PENDING | DEFERRED |
| HPG | 2025-12-31 | 0 | PASS | PASS | PENDING | PASS | PENDING | PENDING | PENDING | PENDING | DEFERRED |
| VRE | 2026-06-30 | 8 | PASS | PASS | PENDING | PASS | PENDING | PENDING | PENDING | PENDING | DEFERRED |
| VNM | 2026-06-30 | 7 | PASS | PASS | PENDING | PASS | PENDING | PENDING | PENDING | PENDING | DEFERRED |
| VJC | 2026-06-30 | 8 | PASS | PASS | PENDING | PASS | PENDING | PENDING | PENDING | PENDING | DEFERRED |
| VJC | 2025-12-31 | 0 | PASS | PASS | PENDING | PASS | PENDING | PENDING | PENDING | PENDING | DEFERRED |
| SSB | 2026-06-30 | 6 | PASS | PASS | PENDING | PASS | PENDING | PENDING | PENDING | PENDING | DEFERRED |
| GAS | 2026-06-30 | 8 | PASS | PASS | PENDING | PASS | PENDING | PENDING | PENDING | PENDING | DEFERRED |

HPG FY2025 and VJC FY2025 have no financial mappings within the PE4 reviewed 45. Their financial gate is PENDING for missing mapping evidence, rather than being treated as verified. The register binds each candidate to the exact issuer name, URL, report period/scope, PE3 candidate hash and PE4 evidence JSON Pointers. It records per-candidate reasons and restrictions.

## Ownership and approval mechanism

Investment System Owner has final approval authority. Data Evidence Reviewer verifies publication and provenance. Data Quality Owner verifies completeness and mapping. Independent Validator verifies independent acceptance. Codex prepares evidence and implements tooling only. AI Portfolio Manager provides risk assessment and recommendations only. No human identity is assigned or impersonated.

OWNER_DECISION_REGISTER.json keeps ownerDecision, ownerIdentity, decisionTimestamp and ownerReceipt null for every candidate. DEFERRED is a recommendation, not an owner decision. The offline evaluator defaults to an empty authenticated receipt trust set. Candidate-supplied identity/approval claims cannot authenticate themselves. A subsequent authorized human reviewer must authenticate the decision evidence externally and pin its exact receipt digest independently of the candidate. This work introduces no approval intake endpoint or runtime integration.

For any future review result, all mandatory gates must PASS; the exact evidence hash, candidate identity, unique authority key, validity interval and owner receipt must agree. The evaluator requires a prospective decision/effective interval, forbids backdating and preserves restrictions. Null validity remains unapproved rather than inventing an expiry date. Synthetic approval fixtures test the evaluator only and create no real approval. Even an authenticated APPROVED or APPROVED_WITH_RESTRICTIONS review result has productionAccess=false. Separate authorized activation and existing admission checks remain necessary.

## Explicit owner decisions and evidence required

For each of the eight exact hashes below, the Investment System Owner must decide APPROVED, APPROVED_WITH_RESTRICTIONS, DEFERRED or REJECTED after reviewing the specified evidence. Current recommendation for each is DEFERRED. Any later approval needs authenticated owner identity/authority, decision time, approval evidence reference, exact candidate version and evidence bundle hash, prospective effective interval, approved knownAt evidence, evidence validity and explicit scope/restrictions. The mission request is not approval evidence.

The Data Evidence Reviewer must sign off exact archived publisher/publication/provenance evidence. The Data Quality Owner must supply accepted financial mappings, perimeter decisions and minimum coverage evidence; the Independent Validator must supply independent acceptance. Formal ingestion, mapping, methodology, registry, source/publication/identity-method events and actual systemKnownAt/decisionAsOf receipts remain missing. Those clocks must not be reconstructed from publication, Git, mtime or this execution time.

Acquisition stays restricted to finance.vietstock.vn and static2.vietstock.vn with redirect validation. Reading archived issuer captures does not authorize new issuer/exchange acquisition. No network acquisition occurred.

## Tests and production safety

Current runs: 13 PEC-1 tests PASS; 43 PE4 adversarial tests PASS; 75 runtime safety tests PASS (D2, source evidence, production authority and scoring readiness). All ten requested scenarios are covered: missing owner, incomplete provenance, missing publication, failed independent validation, restricted approval, changed evidence hash, expiry, duplicate candidate, conflicting authority and automatic admission. Additional tests cover mandatory NOT_APPLICABLE, impersonation and backdating. The final packet verifier rehashes protected inputs, evidence references and implementation pins and replays PE4.

Runtime checks used the project-supported Node v22.23.2 from /private/tmp; default shell Node v22.12.0 was not used for them. No full application build/typecheck/lint rerun was needed for isolated Python evidence tooling. Historical PE4 results remain explicitly historical: typecheck/build PASS, full suite 2167 passed/18 failed and lint failed for a known warning. They are not claimed as new passes. See TEST_RESULTS.json and the sealed PE4 quality gate logs.

After validation, 5906 protected files across data, source code, prior evidence and source policy pins match the pre-work hashes. Database bytes, all investment source code, frozen baselines and all prior seals are unchanged. Existing static production executable authority (including m64-clarification-1) remains distinct from new source approval. There was no automatic admission, scoring activation/execution, ranking/Top 10 generation, D2 activation, pending-to-accepted promotion, retroactive approval or owner impersonation.

## Evidence references and hashes

Full byte hashes and versions/timestamps are retained in BASELINE_PINS.json, PRIOR_EVIDENCE_VERIFICATION.json, the per-candidate evidencePins and the prior sealed packages. Evidence bundle hash means canonical SHA-256 of the candidate evidence reference map; candidateSha256 separately preserves the original PE3 body hash. Hashes establish integrity, not owner authentication.

### GVR 2026-06-30

Candidate ID: `pe3-authority-sha256:9a5fe661ffafce3dc26b4cd450fa33a654f3d040b32d9041267c03d9daa5298b`
Evidence bundle SHA-256: `c44a552b5cbd7eeb54a1096903442063ede988bba7795661a2b61fd4c3a7ebb6`

### HPG 2025-12-31

Candidate ID: `pe3-authority-sha256:946b69a338ca98faa556801409e5acc006f44157e5bb69cf709660b89a4ad0fd`
Evidence bundle SHA-256: `ac8eaec3299aef8ce84a45a8e9e24e61519e3393ad33ca3aa5d03f5ff70331cf`

### VRE 2026-06-30

Candidate ID: `pe3-authority-sha256:e947fc59175f939f95fddb5713868840a4e8e276c5df3785ac0e622d18654b5e`
Evidence bundle SHA-256: `3c8d7a4b47bf8fde14ddcbcd28f21862318c5f935a1489dfbde7666fd1d0c1e1`

### VNM 2026-06-30

Candidate ID: `pe3-authority-sha256:d7b5ce47bbeb11a958802819f0a716c78b71458bb37f22529329d0c3b7ffa1ff`
Evidence bundle SHA-256: `afb4817aac08b6a73b32f64696f5e58f2532aab6cdf280d72dfc5b68a76aed16`

### VJC 2026-06-30

Candidate ID: `pe3-authority-sha256:eb03a9b2c508090c2a1ac5ac82492658df86a8623ba24f9846fa073f7b317c99`
Evidence bundle SHA-256: `86d4ec0e40298419bfe821cc289b1ab37ce9c22185a16b6ba87c01eb802996b4`

### VJC 2025-12-31

Candidate ID: `pe3-authority-sha256:84e9cefb5eeeb12e709d6aab7ce298c16c63ba972f6964c60b0d585bca3cd703`
Evidence bundle SHA-256: `00fc4f6bbceecfbca6cce902ad433e6dd22e9135a4d90d7fba1676890f96410e`

### SSB 2026-06-30

Candidate ID: `pe3-authority-sha256:324c614b92383b66e25da5cb7d266ba3c4967253f4b8471a8197e190c75ea4b9`
Evidence bundle SHA-256: `304a630ecbc0187dd5ee4915ef2298036209cde6ca20d56e4ba9669d9894af76`

### GAS 2026-06-30

Candidate ID: `pe3-authority-sha256:e72cdd928a21eb3cc1cd0fa12c16ab29b9b0c01d4e79715f95fa60fd449cddb5`
Evidence bundle SHA-256: `65cfb15b0909c8b5c49f9aff34505387f2d1c5844f0b4dac3d3de4d97f4ca156`

## Files created

No pre-existing file was modified. Packet artifacts:

- `docs/fundamental-data-engine/evidence/2026-10-22-production-evidence-closure-pec1/BASELINE_PINS.json`
- `docs/fundamental-data-engine/evidence/2026-10-22-production-evidence-closure-pec1/EXISTING_PRODUCTION_AUTHORITY.json`
- `docs/fundamental-data-engine/evidence/2026-10-22-production-evidence-closure-pec1/FINAL_STATUS.json`
- `docs/fundamental-data-engine/evidence/2026-10-22-production-evidence-closure-pec1/OWNERSHIP_AND_APPROVAL_POLICY.json`
- `docs/fundamental-data-engine/evidence/2026-10-22-production-evidence-closure-pec1/OWNER_DECISION_REGISTER.json`
- `docs/fundamental-data-engine/evidence/2026-10-22-production-evidence-closure-pec1/OWNER_REQUEST.md`
- `docs/fundamental-data-engine/evidence/2026-10-22-production-evidence-closure-pec1/PE4_CURRENT_REPLAY.json`
- `docs/fundamental-data-engine/evidence/2026-10-22-production-evidence-closure-pec1/PE4_RECONCILIATION.json`
- `docs/fundamental-data-engine/evidence/2026-10-22-production-evidence-closure-pec1/PRIOR_EVIDENCE_VERIFICATION.json`
- `docs/fundamental-data-engine/evidence/2026-10-22-production-evidence-closure-pec1/PRODUCTION_MUTATION_AUDIT.json`
- `docs/fundamental-data-engine/evidence/2026-10-22-production-evidence-closure-pec1/TEST_RESULTS.json`
- `docs/fundamental-data-engine/evidence/2026-10-22-production-evidence-closure-pec1/validation/pe4.log`
- `docs/fundamental-data-engine/evidence/2026-10-22-production-evidence-closure-pec1/validation/pec1.log`
- `docs/fundamental-data-engine/evidence/2026-10-22-production-evidence-closure-pec1/validation/runtime-results.json`
- `docs/fundamental-data-engine/evidence/2026-10-22-production-evidence-closure-pec1/validation/runtime-safety.log`
- `docs/fundamental-data-engine/evidence/2026-10-22-production-evidence-closure-pec1/CLOSURE_REPORT.md`
- `docs/fundamental-data-engine/evidence/2026-10-22-production-evidence-closure-pec1/ARTIFACT_HASHES.json`
- `docs/fundamental-data-engine/evidence/2026-10-22-production-evidence-closure-pec1/EVIDENCE_SEAL.json`
- `docs/fundamental-data-engine/evidence/2026-10-22-production-evidence-closure-pec1/validation/pec1-verification.json` (post-seal verifier output; not included in its own inventory)

Implementation and tests:

- `scripts/lib/pec1_authority.py`
- `scripts/prepare-pec1-evidence.py`
- `scripts/test-pec1-authority.py`
- `scripts/verify-pec1-evidence.py`

Stop boundary: PEC-1 completed as an evidence preparation step with PARTIALLY_READY status. Required production evidence closure remains BLOCKED; no owner decision was fabricated. PEC-2 requires explicit owner authorization.
