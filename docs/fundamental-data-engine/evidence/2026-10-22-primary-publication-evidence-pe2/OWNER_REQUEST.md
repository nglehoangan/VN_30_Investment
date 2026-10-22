# VN30 Value Investing OS
# Milestone 8 — PRIMARY_PUBLICATION_EVIDENCE Resolution
# PE2 — Publication & Document Identity Qualification

Repository:
https://github.com/nglehoangan/VN_30_Investment

ROLE

Act as:
- Senior Financial Data Engineer
- Data Provenance Architect
- Financial Reporting Analyst
- Independent Evidence Validation Engineer
- Production Risk Reviewer

GOVERNANCE

PE1 Source Discovery & Evidence Inventory:
APPROVED.

D2 Conservative DATE_ONLY Policy Semantics:
OWNER APPROVED.

D2 Implementation Candidate v1.0.0:
CONDITIONALLY APPROVED.

D2 Production Activation:
NOT APPROVED.

Production Scoring:
BLOCKED.

MISSION

Qualify the eight PE1 evidence-backed disclosures into
immutable, independently reviewable source evidence packages.

The objective is to establish exact publication,
document identity, source authority, knowledge boundaries
and minimum dataset obligation mappings.

Do not activate or admit data into production.

Do not expand the scope beyond the eight selected
disclosures unless necessary to validate their identity.

BASELINE

PE1 evidence:

docs/fundamental-data-engine/evidence/
2026-10-21-primary-publication-evidence-pe1/

PE1 results:

- 34 successful official PDF captures.
- 30 unique official PDF hashes.
- 9 independently verified report identities.
- 7 exact retained PDF byte matches.
- 8 verified dated disclosures.
- 45/216 minimum obligations with source evidence.
- 171 unresolved minimum obligations.
- 0 formal source admissions.

PE1 source evidence is discovery evidence,
not production approval.

D2 candidate:

Policy:
d2-conservative-date-only-availability-v1

Version:
1.0.0

Canonical policy SHA256:
1738c2b0f46dfb618fe51aceaa002bd2bc55db182837dc72ee0d6b1b346eafad

Implementation SHA256:
7405b633a7cea0777e180588469a444de6a61c4382118c02d4b02e04ee827f97

Verify these identities against actual repository bytes
before relying on them.

SCOPE — EXACT EIGHT DISCLOSURES

Use the exact disclosure IDs recorded in PE1
FINAL_STATUS.json:

1. GVR 6T2026
2. GAS 6T2026
3. VRE 6T2026
4. VNM Q2/6T2026
5. SSB 6T2026
6. VJC 6T2026
7. HPG FY2025
8. VJC FY2025

Resolve exact identities by disclosure ID.

Do not rely only on ticker or filename.

PHASE 1 — BASELINE VERIFICATION

Read and verify:

- PE1 EVIDENCE_SEAL.json
- PE1 PACKAGE_VERIFICATION.json
- PE1 OFFICIAL_DISCLOSURE_DISCOVERY.json
- PE1 DOCUMENT_IDENTITY_MATCHES.json
- PE1 MINIMUM_DATASET_SOURCE_COVERAGE.json
- PE1 D2_DATE_ONLY_CANDIDATES.json
- PE1 SOURCE_DOCUMENT_INVENTORY.json
- PE1 FINAL_STATUS.json

Recompute relevant SHA256 values from actual bytes.

Verify:

- source capture bytes;
- official PDF bytes;
- retained PDF bytes, when available;
- parent HTML captures;
- disclosure IDs;
- issuer identity;
- fiscal period;
- reporting scope.

If PE1 evidence is inconsistent, stop qualification
for the affected disclosure.

Do not modify sealed PE1 evidence.

PHASE 2 — PUBLICATION QUALIFICATION

For each selected disclosure:

Establish an exact binding between:

- authoritative issuer/exchange source;
- captured disclosure record;
- publication date;
- linked original financial document;
- immutable document SHA256.

Verify that publication date belongs to the exact
disclosure item.

Do not infer publication date from:

- filename;
- PDF creation date;
- signature date;
- HTTP Last-Modified;
- search snippets;
- neighboring disclosure items;
- document upload directory.

Classify publication evidence:

VERIFIED_TIMESTAMP
VERIFIED_DATE_ONLY
UNVERIFIED
CONFLICTED

For DATE_ONLY:

- preserve publishedAt = null;
- preserve original date precision;
- use Asia/Ho_Chi_Minh;
- calculate next-local-day 00:00 boundary;
- never manufacture an intraday timestamp.

PHASE 3 — DOCUMENT IDENTITY QUALIFICATION

For each disclosure verify:

- exact issuer legal identity;
- ticker;
- reporting period;
- consolidated/separate scope;
- document type;
- document SHA256;
- source URL;
- capture identity;
- retained document relationship.

Identity classes:

EXACT_BYTE_MATCH
VERIFIED_DOCUMENT_IDENTITY
POSSIBLE_MATCH
MISMATCH
UNVERIFIED

Do not treat VERIFIED_DOCUMENT_IDENTITY as
EXACT_BYTE_MATCH.

For SSB and VJC 6T2026:

Preserve the fact that PE1 verified the official
document identity but did not establish an exact
retained physical PDF pair.

Do not fabricate retained-byte equality.

PHASE 4 — IMMUTABLE SOURCE BINDING

Create an immutable candidate receipt for each
qualified disclosure.

Bind:

- disclosure ID;
- issuer;
- reporting period;
- reporting scope;
- official source URL;
- official source capture SHA256;
- official document SHA256;
- publication evidence locator;
- publication precision;
- original publication date;
- D2 boundary;
- retrieval time;
- verification time;
- source identity method;
- policy identity;
- relevant source contract identity.

Use deterministic canonical serialization.

Record:

- schema version;
- receipt ID;
- content hash;
- exact evidence references;
- validation status;
- missing dependencies.

A candidate receipt must not claim approval
from an independent reviewer.

No synthetic HUMAN signature is permitted.

PHASE 5 — KNOWLEDGE BOUNDARIES

For each candidate determine:

- publication boundary;
- source retrieval time;
- document retrieval time;
- source verification time;
- document verification time;
- ingestion time;
- mappingKnownAt;
- methodologyKnownAt;
- registryKnownAt;
- source contract knownAt;
- identity method knownAt;
- other required knowledge boundaries.

Use existing authoritative evidence only.

Do not backdate timestamps.

If a required boundary is missing:

- record the exact missing field;
- set effectiveKnownAt = null;
- mark the candidate as blocked for AS_KNOWN admission.

Calculate effectiveKnownAt only when all
required knowledge evidence is present.

Validate:

effectiveKnownAt <= systemKnownAt
systemKnownAt <= decisionAsOf
decisionAsOf <= assessedAt

Apply the existing contract's additional economic-period
and authority-effectivity checks.

Never relax these checks to increase coverage.

PHASE 6 — MINIMUM DATASET OBLIGATION QUALIFICATION

Read the approved minimum dataset source plan.

Evaluate the 45 PE1 source-evidence-covered obligations.

For each obligation verify:

- ticker;
- concept;
- period;
- reporting scope;
- unit;
- source document;
- source identity;
- applicable normalization requirements;
- knowledge boundaries.

Distinguish:

SOURCE_DOCUMENT_VERIFIED
OBLIGATION_MAPPING_VERIFIED
AS_KNOWN_ELIGIBLE
ELIGIBLE_FOR_INDEPENDENT_ACCEPTANCE
FORMALLY_ADMITTED

These states are not interchangeable.

Do not assume that a verified PDF proves
the financial value of an observation.

Do not invent missing financial operands.

HPG FY2025 must remain outside current-period
obligation coverage unless an existing approved
contract explicitly includes that period.

PHASE 7 — INDEPENDENT REPLAY

Implement read-only deterministic verification.

The verifier must:

- load immutable evidence;
- recompute source hashes;
- recompute receipt content hashes;
- verify publication locators;
- verify document identity;
- verify D2 boundary;
- verify required knowledge clocks;
- validate obligation mapping;
- produce identical results on repeated runs.

Test:

- document replacement;
- metadata replacement;
- publication-date conflict;
- source URL substitution;
- retained PDF mismatch;
- missing knowledge timestamps;
- incorrect issuer;
- incorrect period;
- incorrect consolidation scope;
- incorrect units;
- historical cutoff before knownAt;
- invalid authority identity.

Fail closed on any material inconsistency.

PHASE 8 — INDEPENDENT ACCEPTANCE PACKET

Prepare a reviewer packet containing:

- eight disclosure candidates;
- exact evidence references;
- content hashes;
- publication dates;
- identity qualification results;
- obligation qualification results;
- unresolved dependencies;
- recommended acceptance decisions.

Possible recommendations:

READY_FOR_INDEPENDENT_REVIEW
PENDING_REQUIRED_EVIDENCE
REJECTED_EVIDENCE_CONFLICT

Do not create actual independent approvals.

Do not change production authorities.

PHASE 9 — VALIDATION

Run:

pnpm lint
pnpm typecheck
pnpm build
pnpm test:scoring

Run relevant:

- D2 availability tests;
- source identity tests;
- source publication tests;
- AS_KNOWN tests;
- integration tests;
- deterministic replay tests.

Run the full test suite.

Compare failures against the previous approved baseline.

The prior baseline contained 18 historical failures.

Do not suppress or remove them.

Report every new failure separately.

Verify:

- production database byte hash;
- logical database hash;
- protected data-file hashes;
- previous evidence seals;
- existing runtime authority identities.

Require zero unauthorized production mutations.

PHASE 10 — EVIDENCE PACKAGE

Create:

docs/fundamental-data-engine/evidence/
<date>-primary-publication-evidence-pe2/

Required artifacts:

BASELINE_IDENTITY.json
PE1_EVIDENCE_VERIFICATION.json
PUBLICATION_QUALIFICATION.json
DOCUMENT_IDENTITY_QUALIFICATION.json
SOURCE_BINDING_CANDIDATES.json
KNOWLEDGE_BOUNDARY_ASSESSMENT.json
OBLIGATION_QUALIFICATION.json
D2_AS_KNOWN_VALIDATION.json
INDEPENDENT_REPLAY.json
INDEPENDENT_ACCEPTANCE_PACKET.md
TEST_RESULTS.json
PRODUCTION_MUTATION_AUDIT.json
ESCALATION_UPDATE.json
ISSUES.json
FINAL_REVIEW.md
FINAL_STATUS.json

Each evidence artifact must be traceable to
actual repository/source bytes.

Record exact SHA256 values.

FINAL REPORT

Report:

1. Eight disclosure qualification results.
2. Number of publication-qualified disclosures.
3. Number of identity-qualified disclosures.
4. Number of complete immutable candidate receipts.
5. Number of obligations with verified mappings.
6. Number of AS_KNOWN eligible obligations.
7. Number ready for independent acceptance.
8. Number formally admitted.
9. Remaining knowledge/source dependencies.
10. Validation and regression results.
11. Production integrity.
12. Exact proposed PE3 scope.

IMPORTANT GOVERNANCE

PE2 may prepare evidence for independent acceptance.

PE2 must NOT:

- grant HUMAN approvals;
- activate D2;
- activate runtime authorities;
- execute MARKET CAS;
- admit production financial facts;
- create production scorecards;
- publish rankings;
- execute transactions;
- submit orders.

MBB remains DEFERRED.

STOP after PE2.

Wait for independent CIO review.