# Proposed qualification state model

2026-10-28 · SOURCE_IDENTITY_QUALIFICATION_PLANNING_ONLY · DESIGN, NOT ACCEPTANCE

These states describe a future identity relationship/version and effective eligibility view, not a new column in an existing DTO. Recorded authenticated decisions are immutable. Effective qualification is reevaluated at use using evidence/grant/interval/revocation heads; it can become UNRESOLVED immediately without rewriting or fabricating a formal revocation decision. REJECTED/REVOKEDdecisions need real authority; a technical parser rejection is merely an input diagnostic.

## UNRESOLVED

**Entry:** Missing/contradictory account, security, interval or authority evidence; default. **Transitions:** OBSERVED, REJECTED.

**Evidence:** Gap list and exact source references where available. **Reviewer:** No reviewer inferred; objective failure recorded only as technical result.

**Permissions / revocation:** No operational use; keep blocked on missing/revoked dependency.

## OBSERVED

**Entry:** Integrity/schema validated retained fact and honest times; identity relation not proved. **Transitions:** MATCH_CANDIDATE, REJECTED, UNRESOLVED.

**Evidence:** Pinned original bytes, account/perimeter observations and provenance. **Reviewer:** Technical validation may be automated; no human acceptance inferred.

**Permissions / revocation:** Read/research observation only, never automatic qualification.

## MATCH_CANDIDATE

**Entry:** Unique scoped proposed relationship supported by required technical identifiers and interval witnesses, no unresolved contradiction. **Transitions:** QUALIFIED, REJECTED, UNRESOLVED.

**Evidence:** Exact ledger/account/market anchors, venue/class, interval/action continuity and no duplicates. **Reviewer:** Producer proposes; distinct authenticated reviewers still required.

**Permissions / revocation:** Candidate only; no NAV/full-plan/authority grant.

## QUALIFIED

**Entry:** Exact relationship scope with authentic source/identity interpretation and producer-distinct acceptance; all required intervals/current grants valid. **Transitions:** REVOKED, UNRESOLVED.

**Evidence:** Exact accepted subject/hash, reviewer/role/audit, scope, expiry/revocation and validation pins. **Reviewer:** Authorized authenticated identity reviewer distinct from producer; independence verified as persons not aliases.

**Permissions / revocation:** Identity scope only; NAVeconomics/price/publication gates remain independent.

## REJECTED

**Entry:** Documented decision that this exact candidate/version is incorrect or unacceptable. **Transitions:** No same-version reactivation; new version starts UNRESOLVED.

**Evidence:** Exact rejected subject/reasons and decision provenance. **Reviewer:** Authenticated authorized review for a formal rejection; local parse failure is only blocked diagnostic.

**Permissions / revocation:** No use; preserve immutable rejected version.

## REVOKED

**Entry:** Previously accepted mapping invalidated by authentic revocation/supersession within exact scope. **Transitions:** No same-version reactivation; new version starts UNRESOLVED.

**Evidence:** Prior decision and bound revocation/correction/supersession event. **Reviewer:** Authorized authenticated revoker and current audit/role verification.

**Permissions / revocation:** Deny downstream use immediately; retain historical audit.

UNRESOLVED→QUALIFIED and OBSERVED→QUALIFIED are forbidden shortcuts. MATCH_CANDIDATE→QUALIFIED requires independent authentic scoped acceptance; auto matching/testPASS/owner design approval cannot promote. Revoked or rejected immutable versions cannot return toQUALIFIED; new evidence creates a new version and fresh review. Same-version arbitrary edits, overlapping unresolved mappings and silent supersession are forbidden.

Expiry, unknown revocation head, new conflict or broken dependency immediately denies effective use and reports UNRESOLVED/blocked pending review, while original recorded decision remains audit history. Formal revocation is appended only with authentic authority. IdentityQUALIFIEDnever grants market-price authority, complete accounting, full NAV, dashboard publication, returns/drawdown/scoring or investment decisions. All operational V1flags stay false. No live state transition or accepted mapping is created by this package.
