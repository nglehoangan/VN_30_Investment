# End-to-end validation plan

2026-10-27 · Phase 3.3 · DESIGN ONLY — NOT IMPLEMENTED / NOT ACCEPTED

All24scenarios below are **planned, not executed in Phase3.3**. Phase3.2 retained262unique passing tests (211legacy +51NAV across documented validation segments) remain historical synthetic/disposable evidence, not operational acceptance. No production tests or local application startup are performed here.

Each row defines input, expected state, blocker, evidence and test type; exact criteria are in END_TO_END_SCENARIOS.json. “Proposed” reasons belong to future adapter/publication contracts and must not be reported as already implemented. Positive synthetic scenarios can exercise contracts only; they never accept real broker/market data.

## E2E-01 — Fully qualified synthetic NAV

**Input:** Complete fictional pinned1220 fixture, accepted test-only source/identity/calendar/methodology/independent scope.

**Expected:** QUALIFIED_NAV=1220; official publication DENY.

**Reasons:** none for calculation; PUBLICATION_NOT_AUTHORIZED for publication.

**Evidence:** Synthetic exact manifest and independent test-role separation.

**Type:** ISOLATED_UNIT_AND_SERVICE. **Acceptance:** Exact expected states/amounts/nulls/reasons and denied permissions verified; all required evidence immutable and scope-bound; no side effects. QUALIFIED_NAV=1220; official publication DENY

## E2E-02 — Missing broker source authority

**Input:** Complete amounts but no exact broker/account source grant.

**Expected:** NAV_BLOCKED; full totals null.

**Reasons:** ACCOUNTING_SCOPE_MISSING / proposed BROKER_SOURCE_AUTHORITY_MISSING.

**Evidence:** Broker bytes/account/scope and source acceptance subject.

**Type:** ISOLATED_AUTHORITY_NEGATIVE. **Acceptance:** Exact expected states/amounts/nulls/reasons and denied permissions verified; all required evidence immutable and scope-bound; no side effects. NAV_BLOCKED; full totals null

## E2E-03 — Missing market price authority

**Input:** Exact observed prices but no PRICE_SOURCE grant; QUALIFIED_ONLY.

**Expected:** NAV_BLOCKED, no indicative downgrade.

**Reasons:** PRICE_SOURCE_MISSING.

**Evidence:** Raw/price hash, NAV-purpose grant.

**Type:** ISOLATED_AUTHORITY_NEGATIVE. **Acceptance:** Exact expected states/amounts/nulls/reasons and denied permissions verified; all required evidence immutable and scope-bound; no side effects. NAV_BLOCKED, no indicative downgrade

## E2E-04 — Unknown liability

**Input:** Recordedpayable0,105external unresolved obligation.

**Expected:** NAV_BLOCKED including indicative.

**Reasons:** UNKNOWN_LIABILITY or ACCOUNTING_INCOMPLETE:liabilities.

**Evidence:** Complete debt/fee ledger and disjoint field definitions.

**Type:** ISOLATED_ECONOMIC_NEGATIVE. **Acceptance:** Exact expected states/amounts/nulls/reasons and denied permissions verified; all required evidence immutable and scope-bound; no side effects. NAV_BLOCKED including indicative

## E2E-05 — Unaccepted receivable

**Input:** 570000aggregate lacks exact accepted claim/allocation.

**Expected:** NAV_BLOCKED; no invented settlement.

**Reasons:** ACCOUNTING_INCOMPLETE:receivables.

**Evidence:** Claim/action/net/tax/payment/source linkage.

**Type:** ISOLATED_ECONOMIC_NEGATIVE. **Acceptance:** Exact expected states/amounts/nulls/reasons and denied permissions verified; all required evidence immutable and scope-bound; no side effects. NAV_BLOCKED; no invented settlement

## E2E-06 — Missing security identity

**Input:** Ticker/code correspondence but no accepted account continuity.

**Expected:** NAV_BLOCKED.

**Reasons:** IDENTITY_UNRESOLVED or IDENTITY_MISSING.

**Evidence:** All-held account/market anchors and intervals.

**Type:** ISOLATED_IDENTITY_NEGATIVE. **Acceptance:** Exact expected states/amounts/nulls/reasons and denied permissions verified; all required evidence immutable and scope-bound; no side effects. NAV_BLOCKED

## E2E-07 — Pending corporate-action shares

**Input:** Synthetic200ordinary+20pending partition inside220.

**Expected:** NAV_BLOCKED; supported subtotal only; no240.

**Reasons:** PENDING_RIGHTS_UNSUPPORTED.

**Evidence:** Exact partition/lifecycle/action and eligibility.

**Type:** ISOLATED_CA_NEGATIVE. **Acceptance:** Exact expected states/amounts/nulls/reasons and denied permissions verified; all required evidence immutable and scope-bound; no side effects. NAV_BLOCKED; supported subtotal only; no240

## E2E-08 — Incomplete transaction continuity

**Input:** Valid opening and replay but forward sequence/date interval gap.

**Expected:** NAV_BLOCKED even if balances match.

**Reasons:** ACCOUNTING_INCOMPLETE:transactions; proposed FORWARD_COVERAGE_GAP.

**Evidence:** Accepted opening and complete interval/sequence witnesses.

**Type:** ISOLATED_ACCOUNTING_ADAPTER. **Acceptance:** Exact expected states/amounts/nulls/reasons and denied permissions verified; all required evidence immutable and scope-bound; no side effects. NAV_BLOCKED even if balances match

## E2E-09 — Conflicting market prices

**Input:** Two nonidentical close revisions same unit/session without accepted supersession.

**Expected:** NAV_BLOCKED; no averaging/latest wins.

**Reasons:** CONFLICTING_PRICES or SOURCE_CONFLICT.

**Evidence:** Both raw/source hashes and explicit conflict decision.

**Type:** ISOLATED_PRICE_NEGATIVE. **Acceptance:** Exact expected states/amounts/nulls/reasons and denied permissions verified; all required evidence immutable and scope-bound; no side effects. NAV_BLOCKED; no averaging/latest wins

## E2E-10 — Stale trading session

**Input:** C/request reaches accepted next-completed boundary.

**Expected:** NAV_BLOCKED; no old-price fallback.

**Reasons:** STALE_SESSION / STALE_PRICE.

**Evidence:** Calendar/session boundary and source-time evidence.

**Type:** ISOLATED_TIME_BOUNDARY. **Acceptance:** Exact expected states/amounts/nulls/reasons and denied permissions verified; all required evidence immutable and scope-bound; no side effects. NAV_BLOCKED; no old-price fallback

## E2E-11 — Revoked source evidence

**Input:** Previously bound source or role revoked beforeC/P.

**Expected:** NAV_BLOCKED or publicationDENY; invalidate cache.

**Reasons:** REVOKED_EVIDENCE / *_REVOKED; proposed PUBLICATION_AUTHORITY_REVOKED.

**Evidence:** Exact revocation event, current authenticated head.

**Type:** ISOLATED_AUTHORITY_AND_PUBLICATION. **Acceptance:** Exact expected states/amounts/nulls/reasons and denied permissions verified; all required evidence immutable and scope-bound; no side effects. NAV_BLOCKED or publicationDENY; invalidate cache

## E2E-12 — Ledger revision changes

**Input:** Revision differs before plan or after source read.

**Expected:** NAV_BLOCKED, no mixed result.

**Reasons:** LEDGER_REVISION_MISMATCH / LEDGER_REVISION_CHANGED.

**Evidence:** Before/after revisions/facts hashes.

**Type:** DISPOSABLE_SQLITE_CONCURRENCY. **Acceptance:** Exact expected states/amounts/nulls/reasons and denied permissions verified; all required evidence immutable and scope-bound; no side effects. NAV_BLOCKED, no mixed result

## E2E-13 — Evidence-head changes

**Input:** Price/identity/authority head changes after plan.

**Expected:** NAV_BLOCKED or publicationDENY.

**Reasons:** EVIDENCE_HEAD_CHANGED; proposed PUBLICATION_DEPENDENCY_CHANGED.

**Evidence:** Whole dependency token and final head reads.

**Type:** ISOLATED_RACE_TEST. **Acceptance:** Exact expected states/amounts/nulls/reasons and denied permissions verified; all required evidence immutable and scope-bound; no side effects. NAV_BLOCKED or publicationDENY

## E2E-14 — Independent acceptance missing

**Input:** All technical tests pass but no producer-distinct authentic decision.

**Expected:** NAV_BLOCKED for QUALIFIED_ONLY.

**Reasons:** INDEPENDENT_NAV_ACCEPTANCE_MISSING.

**Evidence:** Exact input subject, reviewer identity/role, audit.

**Type:** ISOLATED_ACCEPTANCE_NEGATIVE. **Acceptance:** Exact expected states/amounts/nulls/reasons and denied permissions verified; all required evidence immutable and scope-bound; no side effects. NAV_BLOCKED for QUALIFIED_ONLY

## E2E-15 — Production publication unauthorized

**Input:** Qualified synthetic result, no O/R decisions.

**Expected:** Calculation mayQ, publicationDENY; no route output.

**Reasons:** proposed PUBLICATION_NOT_AUTHORIZED / RELEASE_NOT_AUTHORIZED.

**Evidence:** Denied V1 permissions and separate decision absence.

**Type:** FUTURE_PUBLICATION_CONTRACT. **Acceptance:** Exact expected states/amounts/nulls/reasons and denied permissions verified; all required evidence immutable and scope-bound; no side effects. Calculation mayQ, publicationDENY; no route output

## E2E-16 — Late-arriving transaction

**Input:** Fact effective<=T arrives later than oldK; new revision.

**Expected:** OldK request blocked; later honestK/newrevision produces different manifest.

**Reasons:** FUTURE_LEDGER_KNOWLEDGE / LEDGER_REVISION_MISMATCH.

**Evidence:** Immutable original plus append, exact knowledge times.

**Type:** DISPOSABLE_SQLITE_AND_UNIT. **Acceptance:** Exact expected states/amounts/nulls/reasons and denied permissions verified; all required evidence immutable and scope-bound; no side effects. OldK request blocked; later honestK/newrevision produces different manifest

## E2E-17 — Corrected historical price

**Input:** New retained price revision with explicit authenticated supersession.

**Expected:** New retrospective result/hash if all gates valid; never rewrite old/current fallback.

**Reasons:** CONFLICTING_PRICES until exact accepted supersession; stale current remains blocked.

**Evidence:** Both raw hashes, supersession scope and new validation.

**Type:** ISOLATED_VERSIONING. **Acceptance:** Exact expected states/amounts/nulls/reasons and denied permissions verified; all required evidence immutable and scope-bound; no side effects. New retrospective result/hash if all gates valid; never rewrite old/current fallback

## E2E-18 — Duplicate market identity

**Input:** Two ledger IDs resolve same UUID/provider/ISIN.

**Expected:** NAV_BLOCKED; no double valuation.

**Reasons:** DUPLICATE_MARKET_IDENTITY.

**Evidence:** Complete held set and mapping intervals.

**Type:** ISOLATED_IDENTITY_NEGATIVE. **Acceptance:** Exact expected states/amounts/nulls/reasons and denied permissions verified; all required evidence immutable and scope-bound; no side effects. NAV_BLOCKED; no double valuation

## E2E-19 — Partial accounting completeness

**Input:** Missing cash/claims/quantity or uncertain basis economic effect.

**Expected:** NAV_BLOCKED; separate optional supported subtotal.

**Reasons:** ACCOUNTING_INCOMPLETE:* / BASIS_AFFECTS_ECONOMIC_OWNERSHIP.

**Evidence:** Ten dimensions and exact disjoint evidence.

**Type:** ISOLATED_COMPLETENESS_MATRIX. **Acceptance:** Exact expected states/amounts/nulls/reasons and denied permissions verified; all required evidence immutable and scope-bound; no side effects. NAV_BLOCKED; separate optional supported subtotal

## E2E-20 — Qualified arithmetic but blocked operational use

**Input:** All synthetic arithmetic gates pass, M7 release stillrestricted.

**Expected:** Qtechnical possible; operational/performance/risk/scoringDENY.

**Reasons:** proposed M7_RELEASE_RESTRICTED; V1rightsfalse.

**Evidence:** Qualified manifest and unchanged restrictive release pins.

**Type:** FUTURE_PUBLICATION_CONTRACT. **Acceptance:** Exact expected states/amounts/nulls/reasons and denied permissions verified; all required evidence immutable and scope-bound; no side effects. Qtechnical possible; operational/performance/risk/scoringDENY

## E2E-21 — Indicative publication restrictions

**Input:** Explicit research opt-in coherent complete observations; missing formal proof.

**Expected:** INDICATIVE_NAV, totalNavnull, indicativeValue1220; no official metrics.

**Reasons:** proposed INDICATIVE_OFFICIAL_USE_PROHIBITED.

**Evidence:** Opt-in, completeness, source/date labels and purpose matrix.

**Type:** ISOLATED_RESEARCH_AND_FUTURE_VIEW. **Acceptance:** Exact expected states/amounts/nulls/reasons and denied permissions verified; all required evidence immutable and scope-bound; no side effects. INDICATIVE_NAV, totalNavnull, indicativeValue1220; no official metrics

## E2E-22 — Full audit reconstruction

**Input:** Exact source→normalizer→ledger→mapping→plan→proof→result→publication decision chain.

**Expected:** Same semantic resultHash; distinct runHash ifCchangeswithinvalidity; verify Pdecision separately.

**Reasons:** proposed AUDIT_REPLAY_MISMATCH on any tampering/missing link.

**Evidence:** All byte pins, versions, decision/revocation heads, result/run references.

**Type:** OFFLINE_REPLAY_AND_TAMPER_TEST. **Acceptance:** Exact expected states/amounts/nulls/reasons and denied permissions verified; all required evidence immutable and scope-bound; no side effects. Same semantic resultHash; distinct runHash ifCchangeswithinvalidity; verify Pdecision separately

## E2E-23 — Actual portfolio remains NAV_BLOCKED

**Input:** Retained real12/24/11ledger and openB1–B7, no operational provider/authority.

**Expected:** NAV_BLOCKED, both full totalsnull; no fake broker passing fixture.

**Reasons:** INPUT_PLAN_UNAVAILABLE plus external dependency reasons when evaluator implemented.

**Evidence:** Actual ledger read-only manifest, blocker report, database hash.

**Type:** FUTURE_AUTHORIZED_ACTUAL_READ_ONLY_NOT_RUN_PHASE33. **Acceptance:** Exact expected states/amounts/nulls/reasons and denied permissions verified; all required evidence immutable and scope-bound; no side effects. NAV_BLOCKED, both full totalsnull; no fake broker passing fixture

## E2E-24 — No production data mutation

**Input:** Run future authorized readonly integration under failure/races and compareprotectedhashes.

**Expected:** No ledger/source/candidate/approval/policy mutations; no posting or persistence.

**Reasons:** proposed READ_ONLY_BOUNDARY_VIOLATION if any mutation.

**Evidence:** Before/after database/sidecars/source/hash inventory and write-port exclusion.

**Type:** DISPOSABLE_WRITE_TRAP_AND_AUTHORIZED_READ_ONLY_AUDIT. **Acceptance:** Exact expected states/amounts/nulls/reasons and denied permissions verified; all required evidence immutable and scope-bound; no side effects. No ledger/source/candidate/approval/policy mutations; no posting or persistence

Validation sequencing: contract/unit and byte-tampering negatives first; isolated SQLite integration/races next; producer-distinct financial and security review after real prerequisite evidence; only separately authorized read-only actual replay once those inputs exist. Any production publication/deployment test requires its own owner authorization and scoped release gates. Independent acceptance cannot be satisfied by implementation-agent execution. Retain exact command/version/config/hash, expected/actual, failures/fixes and reviewer receipts for future execution.
