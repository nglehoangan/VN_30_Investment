# Producer-distinct acceptance workflow

2026-10-27 · Phase 3.3 · DESIGN ONLY — NOT IMPLEMENTED / NOT ACCEPTED

1. Producer freezes the complete input/validation bundle, original sources and all hashes. The calculation remains derived; no posting or acceptance occurs on read.
2. Independent reviewer establishes authenticated identity/role and verifies actual-person separation from producer. A test verifier or implementer’s multi-role review cannot serve as that reviewer.
3. Reproduce retained raw normalization, identity/CA intervals, exact ledger replay atT, full legacy reconciliation plus NAV-economic addendum, complete forward coverage and all three state/permission controls. Inspect required limitations and reject unresolved economic gaps.
4. Review each decision type separately below; bind the full subject fields in ACCEPTANCE_MATRIX.json. An approval must name exact artifacts/scope and record decision time, effective/expiry interval and revocation/supersession. No approval is recorded in this phase.
5. An authorized verifier checks authentic decision/audit, role/independence, exact subject bytes/hash and current revocation. Only then can trusted composition project the exact existing NavAuthorityProofV1 shape. Upstream manifest/audit retains the richer evidence; do not add fields to V1 or use boolean JSON as verifier.
6. Owner/release roles separately review publication and deployment. Revalidate ledger/evidence/authority/release heads at publication; any change denies. Revocation invalidates dependencies and cached current views, while old audit remains preserved and visibly invalidated.

|Decision|Scope|Does not grant|
|---|---|---|
|Technical acceptance|exact code/calculator build, source bytes/schema/replay, tests and manifest|Any other decision type|
|Financial source acceptance|broker account/fields/coverage/reconciliation; market identity/price semantics/source scope|Any other decision type|
|NAV methodology acceptance|accounting implementation, NAV_ECONOMIC_POINT_V1, calculation, price/finality/calendar policies|Any other decision type|
|Operational publication acceptance|exact eligible result and destination/purpose/time/dependency-head/permitted limitations|Any other decision type|
|Production release authorization|executed independent release gates, deployment/build/config/schema/registry and recovery|Any other decision type|

Acceptance binds all exact source hashes, ledger revision/facts/state, calculation version, accounting methodology ID+implementation, NAV profile, market-price policy/calendar, mappings/intervals/actions, broker reconciliation and continuity witnesses, validation results, accepted limitations, reviewer identity/role, decision time and revocation/supersession. Actual no-login deployment presently cannot issue new authenticated decisions. Keep acceptance BLOCKED; design approval is not receipt creation.

Methodology proof is scoped to exact implementation/profile; registered PROPOSED opening method is not upgraded by owner approval of specs. Cost-basis limitations may be accepted only for point NAV with ownership complete, preserving P&L gates. Unknown liabilities/rights/claims cannot be accepted as a limitation to pass arithmetic.

Acceptance dependency cycle resolution: source/methodology/calendar/mapping qualification precedes a complete calculation; independent acceptance reviews the canonical input subject and validation manifest without including its own receipt hash. Result hash subsequently binds the returned proof references. Operational acceptance binds the resulting resultHash and final dependency token. Do not define a receipt whose subject includes its own signature/hash or the final result that already contains that receipt. Future adapter must map the existing inputHash/session/unit/price proof subjects exactly, preserving Phase3.2 deterministic serialization.
