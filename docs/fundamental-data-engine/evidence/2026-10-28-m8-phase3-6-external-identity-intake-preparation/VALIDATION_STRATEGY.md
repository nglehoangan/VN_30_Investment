# Planned negative validation

2026-10-28 · PREPARATION ONLY · NO REAL EVIDENCE INTAKE OR ACCEPTANCE

All cases are **PLANNED**. No operational execution, document intake or acceptance is claimed. Proposed outcome/reason labels belong to future intake design, not newly implemented runtime code. Static schema/package checks in VALIDATION_RESULTS.json are distinct from these scenarios.

**NEG-01 — Wrong account**

Input: Package privately belongs to a different full broker account. Expected: REJECTED_INTAKE. Reason: EXACT_ACCOUNT_MISMATCH. Control: Compare authentic private account source, not alias. Status: PLANNED.

**NEG-02 — Masked account ambiguity**

Input: Only last-four or masked account and similar balances. Expected: RECEIVED_UNVERIFIED; readiness BLOCKED. Reason: EXACT_ACCOUNT_PROOF_MISSING. Control: Require full private account/ownership binding. Status: PLANNED.

**NEG-03 — Wrong portfolio**

Input: Source account/perimeter not linked to requested portfolio. Expected: REJECTED_INTAKE. Reason: PORTFOLIO_SCOPE_MISMATCH. Control: Preserve exact portfolio/perimeter scope. Status: PLANNED.

**NEG-04 — Missing document identity**

Input: Original source has no attributable document/request/response reference. Expected: RECEIVED_UNVERIFIED; readiness BLOCKED. Reason: DOCUMENT_ID_MISSING. Control: Require genuine original identity or attributable cross-reference. Status: PLANNED.

**NEG-05 — Missing issuer attribution**

Input: Letterhead/image or file hash presented as sole issuer proof. Expected: RECEIVED_UNVERIFIED; readiness BLOCKED. Reason: ISSUER_AUTHENTICITY_UNVERIFIED. Control: Require genuine issuer-controlled source and authorized review. Status: PLANNED.

**NEG-06 — Missing instrument code**

Input: Only symbol, quantity or unexplained ID supplied. Expected: RECEIVED_UNVERIFIED; readiness BLOCKED. Reason: STABLE_INSTRUMENT_LINK_MISSING. Control: No ticker-only substitute; exact stable code/cross-reference required. Status: PLANNED.

**NEG-07 — Ticker-only matching**

Input: Same ticker and quantity across account/master. Expected: RECEIVED_UNVERIFIED; readiness BLOCKED. Reason: TICKER_ONLY_NOT_PROOF. Control: Do not manufacture mapping. Status: PLANNED.

**NEG-08 — Conflicting ISIN**

Input: Account annex and instrument source disagree. Expected: RECEIVED_UNVERIFIED; readiness BLOCKED. Reason: IDENTIFIER_CONFLICT. Control: Retain both sources; no preferred-field override. Status: PLANNED.

**NEG-09 — Missing effective interval**

Input: No witnessed applicability dates or end UNKNOWN. Expected: RECEIVED_UNVERIFIED; readiness BLOCKED. Reason: INTERVAL_UNPROVEN. Control: Do not use opening/listing/retrieval as inferred effective date. Status: PLANNED.

**NEG-10 — Current snapshot substituted**

Input: New snapshot offered as opening-to-23Oct continuity. Expected: RECEIVED_UNVERIFIED; readiness BLOCKED. Reason: HISTORICAL_CONTINUITY_MISSING. Control: Request exact historical source/attestation; honest later knowledge. Status: PLANNED.

**NEG-11 — FPT lifecycle ambiguity**

Input: 200 ordinary plus 20 pending, no credit/availability witness. Expected: RECEIVED_UNVERIFIED; readiness BLOCKED. Reason: FPT_LIFECYCLE_UNKNOWN. Control: Keep 220 total and unknown conversion/date; no tradability assumption. Status: PLANNED.

**NEG-12 — Duplicate position identity**

Input: Two overlapping rows claim the same economic allocation. Expected: RECEIVED_UNVERIFIED; readiness BLOCKED. Reason: DUPLICATE_ECONOMIC_IDENTITY. Control: Reject duplicate qualification; preserve separate source rows. Status: PLANNED.

**NEG-13 — Modified source bytes**

Input: Private file differs from original pinned bytes. Expected: REJECTED_INTAKE. Reason: CONTENT_CHANGED. Control: Quarantine and investigate; never rewrite pin to hide alteration. Status: PLANNED.

**NEG-14 — Incorrect SHA-256**

Input: Manifest checksum not equal to original byte digest. Expected: REJECTED_INTAKE. Reason: CONTENT_HASH_MISMATCH. Control: Recompute exact original bytes under authorized custody. Status: PLANNED.

**NEG-15 — Superseded document**

Input: Old version presented without current revision scope. Expected: SUPERSEDED if genuinely verified; otherwise readiness BLOCKED. Reason: SOURCE_SUPERSESSION_UNVERIFIED. Control: Retain original and replacement; no latest-wins. Status: PLANNED.

**NEG-16 — Revoked document**

Input: Genuine source/acceptance revocation affects scope, or current revocation unknown. Expected: REJECTED_INTAKE if genuinely invalid; otherwise readiness BLOCKED. Reason: SOURCE_REVOKED_OR_UNKNOWN. Control: No reuse of stale authority; preserve audit. Status: PLANNED.

**NEG-17 — Synthetic approval**

Input: Test verifier or local accepted=true presented as real approval. Expected: REJECTED_INTAKE for attempted authority; readiness BLOCKED. Reason: SYNTHETIC_APPROVAL_PROHIBITED. Control: Clearly labelled synthetic metadata is planning only, never real receipt. Status: PLANNED.

**NEG-18 — Missing independent reviewer**

Input: No genuinely distinct authenticated authorized reviewer available. Expected: INTEGRITY_VERIFIED at most; readiness BLOCKED. Reason: INDEPENDENT_REVIEWER_UNAVAILABLE. Control: Do not fabricate a role or self-approve. Status: PLANNED.

**NEG-19 — Cross-account contamination**

Input: Documents or fields from multiple private accounts blended. Expected: REJECTED_INTAKE or quarantine; readiness BLOCKED. Reason: CROSS_ACCOUNT_CONTAMINATION. Control: Keep originals separate, verify exact account for every row. Status: PLANNED.

**NEG-20 — Unauthorized publication**

Input: Original statement, account ID or private path proposed for GitHub/logs. Expected: REJECTED_INTAKE for unsafe export; readiness BLOCKED. Reason: PRIVATE_EVIDENCE_PUBLICATION_PROHIBITED. Control: Do not commit/export; private custody and reviewed metadata projection only. Status: PLANNED.

A future authorized validation should distinguish technical byte/schema checks, private authenticity/account review, identity matching and independent acceptance. Synthetic fixtures must stay isolated and labelled; real originals must never become test fixtures or repository artifacts. Privacy export failures must block sharing even if financial data appear correct. No test success grants financial acceptance, NAV publication or release.
