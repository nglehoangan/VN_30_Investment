# Authenticated HUMAN review workflow — specification for separate approval

Status: PROPOSED_NOT_DEPLOYED. Conditional infrastructure approval does not approve identity providers, role assignments, source authorities, owner gates or actual assessments. Current production approvals=0. All 23 rubrics × 29 issuers=667 slots remain; H1=232, H2=406, H3=0, H4=29. MBB has no review/score input.

## Trust and authentication

The existing RuntimeReviewerIdentity port must be implemented by a trusted server composition, not request JSON. Owner must separately select the identity provider/trust root, issuer/audience verification, session expiry/revocation and credential security, and approve a server-side subject→role authorization policy. Do not accept subject/analyst/HUMAN/owner/role text from a form as authentication. Mutating review requests must be protected against cross-site request forgery and bound to the authenticated session and expected current record hash. No public endpoint or new authentication authority is deployed here.

Named analyst accounts author formal outcomes. OWNER capabilities authorize the required M1 Stage0/hard-veto/residual-risk gates. INDEPENDENT_DATASET_REVIEWER must be distinct from the producer at the required acceptance boundary. A service/AI identity may prepare evidence/untrusted drafts but receives no HUMAN/OWNER/reviewer approval capability. Reviewer role membership and authenticated session provenance must be independently resolvable, not invented by an AI draft or arbitrary approval reference.

## Evidence to explicit review

1. Prepare a qualified FORMAL AS_KNOWN snapshot and 29 machine dossiers only after exact source, registry, availability and derivation checks. Preserve the full source→import→normalization→canonical→availability→observation→derivation→snapshot→bridge lineage. Candidate dossiers without a formal snapshot remain clearly blocked.
2. Present issuer, period, consolidation scope, source/publication times, original values/units, links/hashes, conflicts, missing inputs and counterevidence. Show all 23 rubric definitions and existing allowed bands/points without preselecting formal outcomes. AI narrative is UNTRUSTED_ANALYST_DRAFT, visually and semantically separate from a reviewed assessment.
3. The named analyst explicitly selects/attests band and points, rationale, evidence-topic references, sector/economic channel, counterevidence and maximum prerequisites when applicable. Never turn AI-selected points into formal HUMAN points by toggling a flag. Unchanged evidence can be referenced; it need not be retyped.
4. Existing ReviewAssessment enforces DRAFT→REVIEWED→APPROVED, named authenticated analyst and immutable context. Reject/invalidated states remain terminal; changing content creates a new record/identity. Rejection needs a reason and reviewer receipt in the deployed workflow; owner invalidation records the evidence/change trigger. This reason-bearing receipt requirement is a deployment specification, not a claim that existing staging alone is production authentication.
5. Stage0, hard veto and residual risk need separately authenticated M1 authorization, exact current asOf, method version, evidence hashes, outcome and receipt. RG-RISK must agree with the same residual-risk decision; no duplicate independent economic assessment is invented. Do not roll an old gate to a new date. Confidence/thesis/valuation/normalization and double-count review remain part of the exact reviewed input.

## Immutable receipts and independent acceptance

A deployed review receipt binds authenticated subject/session, authorization capability, security/rubric, method/executable, assessment/evidence/derivation hashes, asOf/knownAt, validity, selected outcome, rationale/counterevidence/prerequisites, previous event hash, decision/status, invalidation/rejection reason and receipt integrity. Receipt authenticity must be verified by trusted composition, not only by rehashing caller content. The existing FileHumanReviews is isolated CAS staging, not an authentication or signature service; production trust/persistence/retention and recovery policy require Owner review.

Producer prepares the exact acceptance packet only after all 667 actual selections and required M1/auxiliary inputs are complete. Independent reviewer replays snapshot, authorities, publication evidence, derivations,29 dossiers, assessments, valuation/normalization and current owner gates. Exact independent evidence hash is bound in reviewArtifactReference; actual receipt hash must be pinned in the existing independently configured Policy-B repository and methodology record. Dataset-specific approval is never pre-issued for a reusable method specification. Acceptance may not be fabricated to satisfy a schema. No scores/ranks are published by preparation.

Reuse remains candidate-only and automaticReuseAuthorized=false. Changed source/evidence/formula/method/sector/market dependencies, expiry, revocation, corrections or owner invalidation require fresh review. Price-sensitive valuation reviews cannot survive changed market evidence merely because qualitative text is unchanged. Source validity is never extended by a review TTL.

Separate approval checklist: identity/session trust; role grants and M1 ownership; exact authenticated receipt format/verifier and storage; request/CAS controls; revocation/invalidation/recovery; independent reviewer separation; final authority and source contracts; any future cross-cycle reuse policy. None are activated by this document.


## Independent deployment review and ordered onboarding

Review result: SPECIFICATION_ONLY_NOT_DEPLOYED. Existing FileHumanReviews and trusted RuntimeReviewerIdentity port provide staging/transition boundaries, not an identity provider or a deployed authentication verifier. No evidence establishes production IdP, role membership or cryptographically authentic receipt issuance. A caller-supplied identity or hash is insufficient. All667 requirements remain (232 H1,406 H2,0 H3,29 H4); actual approvals0, actual independent dataset acceptances0.

Deployment order:
1. Owner selects identity/session trust and accountable security administrator; inventory issuer/audience/expiry/revocation requirements. Security administrator configures server-only subject-to-capability grants with named analyst, Owner/M1 and independent reviewer accounts; AI/service accounts cannot approve.
2. Implement trusted identity composition, request/session/CSRF protections, expected-current-hash mutation checks, immutable authenticated receipts with reasons, audit retention and recovery. Owner approves exact receipt contract and verifier before deployment; staging hashes alone do not establish authenticity.
3. Validate role denial, forged subject/capability, session expiry/revocation, replay, concurrent CAS, evidence mutation, terminal rejection/invalidation, audit recovery and producer/reviewer separation in isolated fixtures. No fixtures are production approvals.
4. Deploy behind an explicit reviewed release; onboard accounts with grant audit. Perform read-only dossier training first. No mass-approve defaults or preselected formal points.
5. After FORMAL qualified dossiers exist, named analysts explicitly complete667 rubric assessments; authenticated Owner/M1 reviewers complete current Stage0, hard-veto and residual-risk gates. Qualification and risk authority remain independent of attractive valuation. Auxiliary evidence and all M1 requirements remain intact.
6. Independent reviewer distinct from producer replays exact snapshot/authority/market/evidence/assessment hashes, required DI gates and current cutoff. Only an explicit authorized receipt can accept that dataset. Any changed dependency or expiry triggers invalidation/review; no automatic cross-cycle reuse.

Readiness decisions: authentication/authorization/role grants, signed or otherwise independently authentic receipt verifier, immutable storage/audit/revocation/recovery and deployment release require separate approval (OD-06). Runtime workflow can be implemented without changing scoring bands, but deployment does not create actual reviews. No production endpoint, roles or approvals were created by this review.
