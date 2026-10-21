from pathlib import Path
import json,datetime
P=Path(__file__).resolve().parent
texts={
'README.md':'''# Production runtime scoring readiness implementation

Status: **BLOCKED — RUNTIME READINESS INCOMPLETE**. Architecture direction is approved; no new production authority, factual availability, HUMAN assessment or independent acceptance was approved by this implementation.

The new application services connect the existing FundamentalObservation, availability, governed derivation, FORMAL AS_KNOWN snapshot and independent-di-acceptance-v2 / Policy-B contracts. They expose no scoring, transaction or order method. Default production scoring and app acceptance guards are unchanged. No database migration or production write is required for this blocked rollout.

`RuntimeReadiness` verifies configured authority method/hash pins, immutable raw/import/canonical/normalization/publication receipts, prepares FORMAL observations, delegates governed arithmetic, builds exactly 29 evidence dossiers and a content-addressed envelope. The existing snapshot repository remains the authoritative complete-candidate enumeration and atomic persistence boundary; no caller may declare a dataset READY. Its existing direct entrypoints retain their original governance checks.

`ReviewAssessment` uses a server-configured identity provider and append-only CAS staging. AI text is UNTRUSTED_ANALYST_DRAFT. A HUMAN must submit their own named assessment before REVIEWED, then explicitly approve it. Approved content cannot be edited; owner invalidation is terminal. `AcceptRuntimeDataset` verifies 667 approvals against exact ScoreInput evidence/context, trusted current M1 owner-gate receipts, all 29 dossier hashes, source/availability/derivation/method/market hashes, and existing Policy-B readiness before handing an acceptance to the existing independently configured repository. The independent evidence hash is bound in reviewArtifactReference; the final packet additionally binds the exact acceptance hash without a circular self-hash.

Production-data results: 1,754 eligible CURRENT_ANALYSIS facts; all UNPROVEN for this formal availability path. Twenty-nine candidate dossiers under dossiers/ retain amounts as strings and exact canonical/source pointers; they are not FORMAL snapshots or HUMAN reviews. MBB has no dossier/input/score/rank. Five exact proposed authority candidates are PENDING_OWNER_APPROVAL. Broad source/sector routes remain incomplete; this is not READY_FOR_OWNER_AUTHORITY_APPROVAL for the entire runtime release.

Review source/availability/authority candidates first, supply certified publication and lineage evidence, then compose authenticated human/M1 capabilities, complete actual reviews and independently accept the exact dataset. No approval UI or authentication provider is deployed by this task. FileHumanReviews is isolated staging, never an auth system or a production dataset acceptance store. Source and reviewer capabilities are supplied by trusted composition, not request JSON. There is deliberately no public route or CLI that accepts caller-provided approval pins.

Run read-only inventory: `python3 scripts/inventory-runtime-scoring-readiness.py` (writes this unsealed working package; do not run over a sealed package). New tests: `pnpm exec vitest run tests/unit/runtime-*.test.ts tests/integration/runtime-evidence.test.ts`. Production DB remains untouched. Historical 18 failures remain HISTORICAL_REPLAY_LIMITATIONS, separate from new CURRENT_RUNTIME_GATES.
''',
'RUNTIME_AUTHORITY_REVIEW.md':'''# Runtime authority review

The existing MethodologyRecord registry, RegistryApprovalBinding, AvailabilityApprovalBinding and IndependentDIReviewBinding remain the governance mechanisms. No parallel mutable authority registry, self-approval, head change or production registration was added. RuntimeAuthorityPin is a trusted selection/effective-interval/dependency envelope over those existing immutable method records. bindRuntimeAuthority rejects PROPOSED, mismatched hashes, wrong use, expired/future records. RuntimeReadiness resolves dependencies recursively and rejects cycles/missing dependencies.

PROPOSED is a candidate. APPROVED requires real approval provenance and exact approved method configuration. ACTIVE additionally requires explicit trusted composition selecting that pin, compatible dependencies and a valid effective interval. This task has no activation API. The new pin representation is an implementation candidate until its governance wiring is approved; the type alone does not activate production authority.

See RUNTIME_AUTHORITY_CANDIDATES.json for five exact candidate IDs and content hashes. The broad existing registry contains only eight items and is PROPOSED; debt-only approval is not full-registry approval. Registry and generic derivation candidate payloads reuse existing definitions without approving them. Availability candidate deliberately permits timestamp proof only in this new adapter, leaving other existing approved routes intact. Readiness and per-dataset DI entries are incomplete specifications, not registrable ScoringReadinessRequirements or fake acceptance objects. Required source/sector/item compatibility must be resolved before a final exact approved release and method registrations can exist. No missing field was defaulted to a financial value.

Method configuration bindings remain registry-sha256, availability-sha256, readiness-requirements-sha256 and dataset-specific di-acceptance-sha256. The new governed-derivation orchestration also requires an exact derivation-crosswalk-sha256 method selection; existing derivation repositories are unchanged. A change from PROPOSED metadata to an approved release changes its hash and requires review of the exact final payload. Candidate hashes are review identities, not an approved production allowlist.
''',
'AVAILABILITY_MODEL.md':'''# Availability and clocks

Each candidate inventory row separately records periodStart, periodEnd, reportAsOf, sourcePublishedAt, sourceRetrievedAt, systemIngestedAt, correctedAt, knownAt, validFrom and validThrough. Unknown values stay null; multiple historical retrieval receipts stay a list. Retained-download retrieval metadata is kept in its own source inventory, not copied onto historical canonical imports.

The FORMAL adapter requires a trusted, exact publication receipt from issuer disclosure, exchange disclosure, official metadata or an approved API contract. Report/signing dates, period ends, filesystem clocks, local retrieval and ingestion cannot establish publication. The existing assessAvailability operation still calculates operational availability including retrieval, ingestion and correction knowledge. Receipt verification must be no later than ingestion; a later discovery requires a new actual ingestion/evidence occurrence rather than backdating. knownAt is the maximum defensible evidence boundary; not a guessed earliest public date. The new strict adapter requires timestamp publication proof. Existing date-only/provider/live policies retain their explicit independent requirements and are not silently enabled here.

PinnedRuntimeEvidence replays exact canonical JSON Pointer and fact identity, normalized item/value/issuer/period/scope, raw JSON lexical cell (lossless numbers), import/source hashes and a source publication pointer. For direct PDFs it requires raw PDF hash plus an externally reviewed, explicitly pinned cell qualification with physical page, normalized box, native value, period/scope/item/unit and approval reference. This is replay of accepted source review, not fresh PDF/OCR extraction or automatic visual verification. No removed OCR reader is recreated. A pin supplied in a request cannot register itself as a trusted receipt.

All 1,754 eligible retained candidates are UNPROVEN in this path. No PROVEN or DERIVABLE_FROM_APPROVED_EVIDENCE fact was manufactured. Matching a currently retained file hash helps source replay, but cannot establish publication or transfer old admission to a different source. Publication-like metadata candidates, if discovered, remain uncertified until their source semantics are reviewed.
''',
'HUMAN_REVIEW_CONTRACT.md':'''# Human review binding

The approved 23-rubric Assessment schema, bands, points, evidence topics, maximum prerequisites and sector requirements are preserved. DRAFT → REVIEWED → APPROVED is explicit. DRAFT/REVIEWED may be rejected; REVIEWED/APPROVED may be invalidated by an OWNER capability. REJECTED and INVALIDATED are terminal. Modification requires a new identity/evidence binding; no approved history is overwritten.

The trusted RuntimeReviewerIdentity port supplies authenticated subject/session/roles independently from requests. A free-text analyst name, HUMAN flag or approval reference alone grants no permission. REVIEWED requires actor == Assessment.analyst and source HUMAN, existing band/point constraints and evidence/rationale. APPROVED requires a separate explicit transition and valid context. The final existing scoring-readiness evaluator checks full method-specific semantics, evidence completeness, owner gates and current asOf. Early draft validation never substitutes for those checks.

Context binds security, rubric, assessment asOf, methodology and executable hashes, evidence and derivation hash sets, sector/normalization context, market hash, validity end and invalidation triggers. Record also binds assessment timestamp, authenticated reviewer/session, previous record hash and status. FileHumanReviews writes immutable content-addressed events under an isolated directory, using exclusive lock, expected-head CAS and atomic head replacement. It is not configured for production here. A stale/crashed staging lock requires operator investigation; this code does not discard it or assume approval.

All 667 production selections remain absent. Synthetic tests exercise the full 29×23 flow with explicit test-only authenticated capabilities and temporary/in-memory staging. None are persisted to production. Confidence, thesis, normalization and valuation remain part of the exact independently reviewed ScoreInput; Stage 0/hard veto/residual risk additionally need trusted current M1 receipts. No request-controlled PASS status grants owner authority.
''',
'ASSESSMENT_REUSE_REVIEW.md':'''# Assessment reuse foundation

assessmentReuseCandidate only reports eligibleForOwnerReview and always automaticReuseAuthorized=false. It requires approved intact content, unexpired chronology and exact issuer/rubric/method/executable/evidence/derivation/sector/market/trigger/asOf/validThrough bindings. Any required dependency change rejects eligibility, including a valuation price/market change. Owner gates retain exact current asOf and are never rolled forward.

This deliberately conservative foundation does not implement cross-cycle reuse or a new TTL. The 174 persistent-potential and 493 refresh-sensitive slots from the accepted architecture classification remain planning counts; actual approved reusable production assessments = 0. A future approved reuse policy can permit specified stable dependencies while preserving source validity and re-attestation. Until then no old assessment is automatically selected or relabelled.
''',
'FINAL_REVIEW.md':'''# Runtime readiness final review

Infrastructure connects existing governed contracts and is tested with isolated synthetic sources and capabilities. Production authority and data remain blocked. RUNTIME_AUTHORITY_CANDIDATES.json contains exact pending candidate IDs/hashes; AVAILABILITY_INVENTORY.json contains all canonical candidates grouped by issuer/metric/period/source and explicit missing reasons. dossiers/ contains 29 unapproved evidence organizers, not reviews or scorecards.

No production source/import/observation/availability/derivation/snapshot/acceptance, HUMAN approval, scoring binding or analytical output was fabricated. MBB remains excluded. No investment transaction, allocation, DCA, decision or order occurred. No current-source interpretation, scoring band, weight or threshold was changed.

Required next steps: Owner/CIO resolve broad canonical registry and sector requirements and review final exact authorities/source contracts; supply defensible publication plus current raw/import/canonical/normalization lineage; deploy a separately authenticated reviewer/M1 composition; complete actual human selections; independently verify and accept the exact immutable dataset; close accepted MARKET/session authority through the existing qualification/CAS flow. Existence of code alone grants none of these approvals.

Final numerical quality-gate results, current versus historical failure comparison, production byte/logical-state audit and final readiness dimensions are in FINAL_STATUS.json, TEST_RESULTS.json, QUALITY_GATE_RECONCILIATION.json and PRODUCTION_MUTATION_AUDIT.json.
'''}
for n,t in texts.items():(P/n).write_text(t)
now=datetime.datetime.now(datetime.timezone.utc);local=now+datetime.timedelta(hours=7)
market={'status':'WAITING_FOR_COMPLETED_SESSION' if local.hour<15 else 'NOT_RESUMED_WITHOUT_INDEPENDENT_ACCEPTANCE','checkedAt':now.isoformat(),'completionBoundary':'15:00 Asia/Ho_Chi_Minh','apiCalls':0,'qualificationExecuted':False,'headChanged':False,'priorCompletedSessionSelection':'2026-10-20 (before 21 October completion)','remainingPriorSessionBlocker':'COMPLETED_SESSION_BOARD_EVIDENCE_MISSING','note':'No repeated TCBS call while today is unfinished; runtime authority/data/HUMAN work continues independently. Existing session selector and approved boundary unchanged.'}
(P/'MARKET_STATUS.json').write_text(json.dumps(market,indent=2)+'\n')
