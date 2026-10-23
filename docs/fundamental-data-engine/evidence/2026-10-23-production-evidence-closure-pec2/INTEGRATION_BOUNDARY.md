# PEC-2 production integration boundary

This packet implements an offline admission contract and evaluator. No production adapter, API endpoint, registry entry, source version, database migration or source-admission writer is installed. The real trust configuration is empty. PEC-1 approval remains absent. All real evaluations are DEFERRED.

## Proposed interface

`evaluate(record, core, receipts, inventory, now, *, trust, root)` deterministically returns recommended and effective admission states, blockers, derived timestamp and revocation status. It never returns production authorization. `check_consumption(...)` rechecks these prerequisites and accepts only an exact `FUNDAMENTAL_EVIDENCE_REVIEW` request within an explicitly admitted scope in offline replay. Its `withinOfflineAdmissionScope` field is not production permission. Any scoring, ranking, Top 10, D2 activation or investment-decision action is denied.

The host must obtain the inventory, current clock, trust and revocation snapshot from independently authenticated composition. They are not request authority. No such authenticated real composition is supplied here. The positive test harness simulates it only in temporary directories.

An owner source approval can produce ELIGIBLE only after all eight PEC-1 gates, evidence/identity/scope/publication/knowledge checks, accepted financial mapping, independent acceptance, inventory uniqueness and fresh revocation checks pass. Effective ADMITTED or RESTRICTED additionally requires a separate authenticated Investment System Owner admission event. The admission event must occur after owner effectivity, acceptance and all required knowledge events; an earlier event cannot become valid retroactively. Owner approval must be known by the declared source knowledge/cutoff. The event binds the admission ID and a digest of candidate ID, evidence hash, exact dataset scope, restrictions and owner approval reference. Even those offline states leave all production flags false.

## Fundamental Data Engine

Inspected `src/domain/fundamentals/hybrid-admission.ts`, `src/infrastructure/repositories/fundamental-admission.ts`, `src/domain/fundamentals/d2-availability.ts` and `src/infrastructure/fundamentals/d2-source-evidence.ts`. Existing `PrismaFinancialAdmission.append` stores an append-only candidate/canonical run and explicitly requires `readyForScoring=false`; it is not a formal source-authority approval endpoint. PEC-2 does not call it.

A future authorized integration would need to verify an admitted record and exact consumption scope before invoking the existing qualified statement, mapping, registry, normalization and availability checks. Source admission alone cannot manufacture accounting facts, source contracts, D2 identity approvals or FORMAL availability receipts. Existing guards remain mandatory.

The eight previews describe archived financial-statement documents. Financial mapping periods from PE4 are preserved exactly, including instant stock periods that differ from a document's flow reporting period. No stock period is rewritten to annual/YTD. These report-level proposals cannot be admitted as a substitute for accepted fact-level scopes: a later review must explicitly narrow period/frame/statement/metric scopes, bind accepted mappings and issue new hashes. Empty metric coverage for HPG FY2025 and VJC FY2025 stays unqualified. No accepted financial mappings are created in PEC-2.

## Market Data Boundary

Inspected `src/infrastructure/market-boundary-authority.ts`. `RetainedMarketAuthority` uses configured exact approval pins and raw byte replay. Financial publisher/source approval does not authorize a price adapter, security identity, calendar, corporate-action policy or market dataset. PEC-2 does not alter `BoundaryBindings`, dependency heads, market authority or any retained market data.

## Scoring Engine

Inspected `src/domain/fundamentals/scoring-readiness.ts` and `src/application/fundamentals/accept-runtime-dataset.ts`. Existing DI requirements, accepted snapshots, human reviews, market evidence, exact hashes, dataset owner gates and readiness checks still apply. PEC-2 supplies none of those missing dependencies, invokes no scorecard and produces no ranking, Top 10, allocation or investment decision.

## Production Runtime Authority

Inspected `src/domain/fundamentals/runtime-authority.ts`, `src/infrastructure/dependencies/production-authority.ts` and `src/infrastructure/runtime.ts`. Existing approved static executable/methodology authority is independent of approval of a new source. `bindRuntimeAuthority` still requires exact approved production methodology/configuration, effectivity and knowledge. PEC-2 does not edit trusted composition, fixed authority pins, active dependency heads or runtime activation records. No TypeScript runtime imports the offline Python evaluator.

## Revocation and restrictions

Every evaluation and consumption rechecks an independently authenticated, current revocation snapshot covering candidate IDs, admission IDs and owner approval digests. Missing/stale snapshots block. Revocation denies later reuse of a previously eligible/admitted synthetic record without editing historical evidence or backdating a decision. Changed evidence or expired approval requires new review; no latest-wins replacement or silent substitution is supported.

Exact scope equality and metric membership are machine enforced. Additional free-text owner restrictions are carried unchanged and never interpreted as permission to use data in production. A future production adapter must enforce each restriction explicitly or deny use. No effective production admission can occur until authenticated PEC-1 approval, acceptance and a separately authorized adapter/activation review are completed.

Live financial PDF acquisition remains restricted to `finance.vietstock.vn` and `static2.vietstock.vn`, validating every redirect. Archived issuer evidence is read locally; this work makes no network acquisition and restores no issuer/exchange collection path.
