# Minimal implementation plan — authorization not granted

2026-10-27 · Phase 3.1 DESIGN PROPOSAL ONLY. No calculator, adapter, schema validator, snapshot store, migration, acceptance artifact or Phase 3.2 implementation is created. Proposed amendments require explicit owner review.

Phase3.2 is NOT_STARTED. This plan does not commission it.

|Work class|Smallest future work|Prerequisite / boundary|
|---|---|---|
|A — Isolated code/tests|Versioned CurrentNavRequest/component/result DTOs; pure gate assessment; deterministic input manifest; exact arithmetic over one existing reconstructed book; nullable blocked/indicative branches; planned22cases|Explicit3.2authorization and approved scope/amendments; syntheticdisposablefixtures, no realauthority/artifacts/provider/network/DBwrites|
|B — External evidence|Exact account/market identity, current dated status/claims/debt/cash cutoff, accepted RAWfinalEOD/session/calendar/source evidence|Owner-targeted broker/market records and existing acquisition capability only when separately authorized; no fabricated times or approvals|
|C — Independent acceptance|Producer-distinct qualification of methods/profiles, identity/source/price/calendar/CA/perimeter/completeness, negativecase and operational audit evidence|Authentic acceptance/revocation mechanism and exact hashes/scope; no-login decision persists; implementation tests are not acceptance|
|D — Production authorization|Actual target/migration/deployment/window/backups/restore, NAVonly publication and applicable release approvals|B7/M7requirements and explicitownerdecision; qualifiedarithmetic alone cannot turnoncurrent/decision/scoring|

Minimal sequence after authorization:
1. Freeze reviewed contract decisions and classification table. Define separate NAVpurpose/gate-profile versions and methodregistry requirements; retain legacycontracts.
2. Add domain contracts/qualification/plannednegative tests in isolation. Existing Decimal/reconstructPortfolio and immutable sources remain singletruth. Do not implement genericpendingpricing or liabilities ledger in calculator.
3. Application CurrentNavReadService assembles a readonly input plan at one revision. Portfolio read, completeness/reconciliation, verifiedidentity, NAVqualifiedprice and authenticauthority/revocation readers are ports. Acquisition happens separately. No write command/posting permission in the service. Preserve rawhash replay, exact evidence manifests and final revision/head recheck.
4. Compute only after required gates; legacy valuePortfolio reused only where compatible and never as authority. If needed, purecomponent sum uses same Decimal without anotheraccounting engine. Export new NAVonlyDTO; do not feed CurrentReadService.context or overwrite legacyFORMAL/nav/PASS. Preserve source/status/inception/risk distinctions.
5. Run plannedfixture suite + legacy regressions + readonly actual replay/hashchecks after futureimplementation. Independent expectedtables and failurecases, no actualfinancialposts. Present concrete change for independent/owner review before any external integration/activation.

Repository dependencies: existing readonly ledger/version reads and sourcebyte/hashreplay; accepted accounting/completeness/status proofs; source/identity/calendar/price authority ports. Existing RetainedMarketAuthority validates configured pins and normalization; it is **not by itself an authenticated identity/revocation/independence system**. Approval pins cannot be supplied from a submitted snapshot or treated as acceptance just by being in localJSON.

Initial isolatedcalculator needs no migration/storage/provider/library/login and no snapshot table. Phase2.1/2.2draft migrations remain deployment dependencies for eventual realforwardaccounting, not permission to execute them. Missing liability/pending accounting terms remain separate contract work, never expanded under a NAVimplementation task by inference. Snapshot persistence is a later separately authorized slice.

Deployment/rollback: defaultoff/unwired feature; code rollback removes new readonlypath without touchingledger/evidence. If no outputs persisted, no data migration rollback is needed. Laterstorage requires append-onlylineage, atomic audit/CAS, reviewed recovery/restore oncopy and separate migration executionapproval; never deletefinancialhistory to roll back a UIfeature. No APIrequest, startupactivation or currentmarket binding planned as a sideeffect.
