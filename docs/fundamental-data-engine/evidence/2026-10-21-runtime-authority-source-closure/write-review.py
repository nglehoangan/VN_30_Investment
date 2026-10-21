from pathlib import Path
import json,hashlib
P=Path(__file__).resolve().parent
if (P/'ARTIFACT_HASHES.json').exists():raise SystemExit('SEALED_EVIDENCE')
texts={
'README.md':'''# Runtime authority and source availability closure

**BLOCKED — AUTHORITY_OR_SOURCE_GAPS_REMAIN**

Owner decision: CONDITIONAL APPROVAL — INFRASTRUCTURE ONLY. No production authority activation or HUMAN approval is granted by this package.

All five candidates now have immutable payloads, explicit dependency hashes, applicability, compatibility checks and actionable specification gaps. That does not make all five complete production configurations. The registry retains the eight existing definitions without inventing missing definitions. Four approved debt definitions stay a separate scoped authority. The derivation proposal replaces generic bank null operands with exact logical names from the approved CASA/NPL source contract, but cannot execute while broad definitions and bank-specific perimeter mappings are absent. Required readiness alternatives/preferences are preserved; no anyOf group is flattened into a mandatory conjunction. The reusable DI review method is explicitly separate from a nonexistent dataset-specific receipt.

Native validation: registry and availability schemas pass as PROPOSED; crosswalk semantic validation rejects missing canonical items; readiness is a full reusable specification that still does not fit the flat native requirements contract; DI method specification is not an acceptance object. None were registered, approved or activated. See AUTHORITY_COMPATIBILITY_MATRIX.json, AUTHORITY_CANDIDATES_FINAL.json, NATIVE_AUTHORITY_VALIDATION.json and SECTOR_COVERAGE_REPORT.json. All nine sectors represented among 29 eligible securities have remaining formal-scoring specification gaps.

Source review inspects all1,754 eligible canonical candidates,2,112 retained JSON files and metadata of337 PDFs (DocInfo plus XMP where present).0 proven availability;16 VHM facts have a preserved date-only publication assertion tied to the exact document hash and need original publication evidence;1,738 remain UNPROVEN. PROVABLE_WITH_ADDITIONAL_SOURCE is an actionable lead, not a promise that the old asserted date will be confirmed. No retrieval, report/signing, creation/modification or ingestion clock is promoted to publication. No PDF visual/OCR/accounting re-review is claimed; no removed readers are recreated. All original financial values stay unchanged.

New assessSourcePublication/PinnedSourcePublication implements an explicitly configured publication-evidence adapter. Exact source contract/method, source identity, captured metadata hash, trusted metadata-to-document-hash mapping and timestamps are required. Known non-publication clock fields are rejected. Timestamp and date-only provenance remain distinct. The adapter grants no historical or FORMAL admission and is not composed into production. Existing availability, registry, snapshot and Policy-B acceptance gates remain in force. Tests use synthetic capabilities only.

Completed21 October EOD REST data was acquired through the existing TCBS entrypoint and built/replayed by the existing pipeline:93 REST200,61/61 required EOD requests,30 observations, freshness PASS. WSS has0 frames after the session; overall capture is partial, while the REST EOD subset independently meets the existing EOD profile. No WSS certification is claimed. Exact market/session/capability/initialization pins and expected prior release are in MARKET_BINDING_CANDIDATE.json. Independent acceptance and Owner activation are still absent. No CAS or active-head edit occurred; actual production VALUATION resolution stays blocked.

Human workflow is specified in HUMAN_REVIEW_WORKFLOW.md for separate Owner approval.667 actual rubric approvals remain absent; MBB remains DEFERRED with score=null/rank=null. No scoring, decisions, allocations, DCA, transactions or orders occurred. Production database byte and logical integrity are audited in PRODUCTION_MUTATION_AUDIT.json. Final gates and18 explicitly historical failures are kept separate in QUALITY_GATE_RESULTS.json and QUALITY_GATE_RECONCILIATION.json.

Reproduction: `python3 scripts/close-runtime-authority-sources.py --out=<new unsealed directory>` then `node scripts/verify-runtime-authority-closure.mjs --out=<same directory>` using supported Node22.23.2. PDF metadata reader: pypdf installed in an isolated temporary directory; no project dependency change. Original evidence packages are not rewritten.
''',
'HUMAN_REVIEW_WORKFLOW.md':'''# Authenticated HUMAN review workflow — specification for separate approval

Status: PROPOSED_NOT_DEPLOYED. Conditional infrastructure approval does not approve identity providers, role assignments, source authorities, owner gates or actual assessments. Current production approvals=0. All23 rubrics ×29 issuers=667 slots remain; H1=232,H2=406,H3=0,H4=29. MBB has no review/score input.

## Trust and authentication

The existing RuntimeReviewerIdentity port must be implemented by a trusted server composition, not request JSON. Owner must separately select the identity provider/trust root, issuer/audience verification, session expiry/revocation and credential security, and approve a server-side subject→role authorization policy. Do not accept subject/analyst/HUMAN/owner/role text from a form as authentication. Mutating review requests must be protected against cross-site request forgery and bound to the authenticated session and expected current record hash. No public endpoint or new authentication authority is deployed here.

Named analyst accounts author formal outcomes. OWNER capabilities authorize the required M1 Stage0/hard-veto/residual-risk gates. INDEPENDENT_DATASET_REVIEWER must be distinct from the producer at the required acceptance boundary. A service/AI identity may prepare evidence/untrusted drafts but receives no HUMAN/OWNER/reviewer approval capability. Reviewer role membership and authenticated session provenance must be independently resolvable, not invented by an AI draft or arbitrary approval reference.

## Evidence to explicit review

1. Prepare a qualified FORMAL AS_KNOWN snapshot and29 machine dossiers only after exact source, registry, availability and derivation checks. Preserve the full source→import→normalization→canonical→availability→observation→derivation→snapshot→bridge lineage. Candidate dossiers without a formal snapshot remain clearly blocked.
2. Present issuer, period, consolidation scope, source/publication times, original values/units, links/hashes, conflicts, missing inputs and counterevidence. Show all23 rubric definitions and existing allowed bands/points without preselecting formal outcomes. AI narrative is UNTRUSTED_ANALYST_DRAFT, visually and semantically separate from a reviewed assessment.
3. The named analyst explicitly selects/attests band and points, rationale, evidence-topic references, sector/economic channel, counterevidence and maximum prerequisites when applicable. Never turn AI-selected points into formal HUMAN points by toggling a flag. Unchanged evidence can be referenced; it need not be retyped.
4. Existing ReviewAssessment enforces DRAFT→REVIEWED→APPROVED, named authenticated analyst and immutable context. Reject/invalidated states remain terminal; changing content creates a new record/identity. Rejection needs a reason and reviewer receipt in the deployed workflow; owner invalidation records the evidence/change trigger. This reason-bearing receipt requirement is a deployment specification, not a claim that existing staging alone is production authentication.
5. Stage0, hard veto and residual risk need separately authenticated M1 authorization, exact current asOf, method version, evidence hashes, outcome and receipt. RG-RISK must agree with the same residual-risk decision; no duplicate independent economic assessment is invented. Do not roll an old gate to a new date. Confidence/thesis/valuation/normalization and double-count review remain part of the exact reviewed input.

## Immutable receipts and independent acceptance

A deployed review receipt binds authenticated subject/session, authorization capability, security/rubric, method/executable, assessment/evidence/derivation hashes, asOf/knownAt, validity, selected outcome, rationale/counterevidence/prerequisites, previous event hash, decision/status, invalidation/rejection reason and receipt integrity. Receipt authenticity must be verified by trusted composition, not only by rehashing caller content. The existing FileHumanReviews is isolated CAS staging, not an authentication or signature service; production trust/persistence/retention and recovery policy require Owner review.

Producer prepares the exact acceptance packet only after all667 actual selections and required M1/auxiliary inputs are complete. Independent reviewer replays snapshot, authorities, publication evidence, derivations,29 dossiers, assessments, valuation/normalization and current owner gates. Exact independent evidence hash is bound in reviewArtifactReference; actual receipt hash must be pinned in the existing independently configured Policy-B repository and methodology record. Dataset-specific approval is never pre-issued for a reusable method specification. Acceptance may not be fabricated to satisfy a schema. No scores/ranks are published by preparation.

Reuse remains candidate-only and automaticReuseAuthorized=false. Changed source/evidence/formula/method/sector/market dependencies, expiry, revocation, corrections or owner invalidation require fresh review. Price-sensitive valuation reviews cannot survive changed market evidence merely because qualitative text is unchanged. Source validity is never extended by a review TTL.

Separate approval checklist: identity/session trust; role grants and M1 ownership; exact authenticated receipt format/verifier and storage; request/CAS controls; revocation/invalidation/recovery; independent reviewer separation; final authority and source contracts; any future cross-cycle reuse policy. None are activated by this document.
''',
'FINAL_REVIEW.md':'''# Final review

Final status: BLOCKED — AUTHORITY_OR_SOURCE_GAPS_REMAIN. Infrastructure tests cannot substitute for missing definitions, actual publication evidence or human/independent approvals.

Authority descriptions and exact payload hashes are prepared for Owner/CIO review.0/5 new runtime authorities are approved or active; all five still have material production-completeness dependencies. Two native proposed schemas validate; crosswalk registry compatibility remains blocked; readiness preserves unresolved alternative-group/sector-model semantics; DI reusable policy is separated from a dataset receipt. Missing definitions are specification gaps, not guessed financial meanings or aliases. Separate approved debt/CASA-NPL source contracts do not globally approve the broad registry or bank-specific mapping.

All1,754 eligible fact candidates were individually classified.0 availability PROVEN;16 VHM facts have an exact-hash-linked historical date-only assertion requiring the original authoritative disclosure;1,738 are UNPROVEN. No date/time was fabricated, copied from a report/retrieval/creation clock or written back to accounting data. Source-publication adapter is tested and inactive in production. Source primary evidence, compatible source scope and exact normalization/import lineage remain prerequisites.

MARKET progressed from unavailable to a completed-session technically qualified candidate with30 observations and a precise proposed binding. Independent acceptance and authorization are absent; expected-prior-head CAS was only prepared. Active release/VALUATION did not change. WSS0-frame limitation remains visible and is not presented as a streaming success.

Actual HUMAN approvals=0/667; formal observations/snapshots/acceptances=0; scorecards/rankings=0. MBB DEFERRED,score=null,rank=null. No scoring/decision/capital/trading side effect. No production DB mutation or authority activation. Required next step is Owner/CIO review of exact specifications/gaps, source-publication requirements, HUMAN authentication/authorization design and MARKET candidate before any activation path can resume.
'''}
for n,t in texts.items():(P/n).write_text(t)
# Source authority is a bound existing ingestion/qualification policy, not a new freely asserted publisher.
p=P/'AUTHORITY_CANDIDATES_FINAL.json';d=json.loads(p.read_text());source='src/domain/fundamentals/source-authority.ts';reference={'path':source,'sha256':hashlib.sha256(Path(source).read_bytes()).hexdigest()}
for a in d['candidates']:a['sourceAuthority']={'existingFinancialSourcePolicy':reference,'perFactAccountingQualificationRequired':True,'publicationSourceContract':'UNRESOLVED_APPROVED_METADATA_CAPTURE_BINDINGS','newSourceApproved':False}
p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n');p=P/'AUTHORITY_COMPATIBILITY_MATRIX.json';m=json.loads(p.read_text());
for row in m['rows']:row['sourceAuthority']=next(a['sourceAuthority'] for a in d['candidates'] if a['kind']==row['kind'])
p.write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n')
