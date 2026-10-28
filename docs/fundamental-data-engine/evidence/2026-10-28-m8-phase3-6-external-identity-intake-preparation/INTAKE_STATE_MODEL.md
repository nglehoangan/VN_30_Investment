# Proposed intake states — not identity qualification

2026-10-28 · PREPARATION ONLY · NO REAL EVIDENCE INTAKE OR ACCEPTANCE

Intake status tracks request/custody/technical-review preparation. It does not represent Phase 3.5 identity states, source authority, financial acceptance or production admission. No state machine, store or real transition is implemented. The only example is clearly synthetic request-preparation metadata.

## REQUEST_PREPARED

**Entry:** A draft request/checklist exists; no evidence acquisition or receipt is implied.

**Transitions:** AWAITING_SOURCE after separate owner acquisition authorization and actual sending; RECEIVED_UNVERIFIED only for separately authorized intake of originals already privately held.

**Required evidence:** Draft scope, owner authorization and actual action reference kept private; never invent a sent request. **Permissions:** no identity, financial, NAV, publication, scoring or posting authority.

## AWAITING_SOURCE

**Entry:** A separately authorized request was actually sent and source delivery is pending.

**Transitions:** RECEIVED_UNVERIFIED on separately authorized actual private receipt; REQUEST_PREPARED for revised unsent scope.

**Required evidence:** Private request/channel reference, scope and honest dates; no source assumed available. **Permissions:** no identity, financial, NAV, publication, scoring or posting authority.

## RECEIVED_UNVERIFIED

**Entry:** Original bytes privately received under separate authorization, quarantined; no identity or source acceptance.

**Transitions:** INTEGRITY_VERIFIED after technical byte/custody checks; REJECTED_INTAKE on failed safety/scope checks; SUPERSEDED when a genuine replacement is documented.

**Required evidence:** Private custody receipt, original byte identity/size, schema and outstanding issues; no original contents in logs. **Permissions:** no identity, financial, NAV, publication, scoring or posting authority.

## INTEGRITY_VERIFIED

**Entry:** Original retained bytes and manifest pins/schema/custody have passed technical integrity checks only.

**Transitions:** IDENTITY_REVIEW_PENDING only when every mandatory qualification-readiness gate is met; REJECTED_INTAKE for new invalidity; SUPERSEDED on evidenced revision.

**Required evidence:** Exact original/derivative hashes, technical validation reference and current issues; issuer authenticity and identity are separate. **Permissions:** no identity, financial, NAV, publication, scoring or posting authority.

## IDENTITY_REVIEW_PENDING

**Entry:** All review-entry gates supported, no unresolved mandatory issue, real authorized reviewer available; review not yet acceptance.

**Transitions:** RECEIVED_UNVERIFIED if new uncertainty requires quarantine; REJECTED_INTAKE for invalid input; SUPERSEDED on replacement.

**Required evidence:** Gate bundle, scope, authentic reviewer-availability proof and private source references; no invented reviewer identity. **Permissions:** no identity, financial, NAV, publication, scoring or posting authority.

## REJECTED_INTAKE

**Entry:** An authorized intake operator declines unsafe, corrupt, wrong-scope or otherwise unsuitable intake; this is not a financial rejection decision.

**Transitions:** Terminal for this evidence version; a corrected new version starts separately.

**Required evidence:** Safe issue codes, private rationale/custody record, original bytes preserved according to future approved policy. **Permissions:** no identity, financial, NAV, publication, scoring or posting authority.

## SUPERSEDED

**Entry:** A genuine source revision/replacement and its exact affected scope are documented.

**Transitions:** Terminal for this evidence version; replacement has a new opaque evidence ID and fresh checks.

**Required evidence:** Predecessor/replacement references and issuer revision provenance; no latest-wins or deletion of original audit. **Permissions:** no identity, financial, NAV, publication, scoring or posting authority.

Forbidden shortcuts: REQUEST_PREPARED/AWAITING_SOURCE directly to integrity or review-pending without actual authorized custody; integrity verification directly to identity-qualified or financial-accepted; a draft request implying it was sent; synthetic metadata treated as a real receipt; reactivating a rejected/superseded version without a new source/version and checks.

Future status changes must preserve an append-only audit with actual operator/authorization/time and predecessor/source references. A newly invalid file is quarantined, not used while the status is stale. Unknown supersession/revocation prevents readiness; formal identity revocation/acceptance remains a separate authenticated workflow. No financial or ledger data is changed by an intake status.
