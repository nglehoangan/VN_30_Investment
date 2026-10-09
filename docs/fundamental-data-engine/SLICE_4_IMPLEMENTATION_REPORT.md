# Slice 04 implementation report — 2026-10-09

Authorization: user approved Slice 03 and requested Slice 04. Initial HEAD/baseline was `addaf5bbf06fe772822bbd557ec7110b477c4e55`, working tree clean. During implementation HEAD advanced externally to `0a3c67c80514685748a45993381bdc6db0bd6b9d` (Update Fundamental Data Engine Slice 4), containing the initial 18-file implementation. The agent issued no git commit, staging or push commands. Further hardening and this report are part of the final reviewed tree; compare against the initial baseline for the complete Slice 04 scope.

AGENTS.md, installed Next backend-for-frontend guide, approved fundamental design (especially Slice 04 and derivation/availability boundaries), existing registry/contracts/repositories, Slice 01–03 implementation reports, M3 metric definitions, sector normalization, existing calculateMetrics/Evidence, and isolated database/migration test patterns were reviewed. No Next route or UI was changed.

## Delivered behavior

Slice 04 prepares explicitly pinned canonical operands and delegates ROE, FCF, CASA and NPL arithmetic to **existing calculateMetrics**. It does not implement a competing formula catalogue. A small generic typing change permits calculateMetrics to consume the minimal arithmetic fields it actually reads, while preserving full Evidence types for existing scoring callers. Evidence availability checks and all formula bodies remain unchanged. The internal arithmetic projection contains no invented publishedAt, provider receipt or canonical availableAt; it is neither persisted as scoring Evidence nor offered as PIT-eligible input.

An immutable versioned sector/operand crosswalk pins registry hash, formula version, precision policy, source-document/code hashes, recording/effective dates and approval reference/status. The initial crosswalk is **PROPOSED**. It maps non-financial ROE to explicitly reviewed normalized common-attributable profit and average common equity; FCF uses issuer CFO and reconciled positive issuer capex. Bank ROE uses the common-profit/equity route. Bank CASA/NPL component mappings remain unresolved because the production registry has no approved canonical bank-component definitions. Insurance/securities routes remain unresolved rather than imposing generic industrial mandatory metrics. No readiness or DI policy is invented.

Production FORMAL derivation requires approved registry/crosswalk and existing exact registry/methodology binding. Crosswalk recording/effective dates must be known by calculation execution. Source mapping/registry/crosswalk approvals are external governance dependencies; Slice 04 approval does not self-approve those releases. Numeric synthetic CASA/NPL tests use an explicitly isolated test registry containing test-only bank components; these definitions are absent from the production manifest.

Every request names its security, sector, economic window, cycle context, ordered operand IDs and exact observation IDs. There is no querying for latest values or choosing a favorable revision. Facts must match security/scope/sector, exist exactly once in the supplied manifest and be ingested by execution. Each operand requires its explicit crosswalk item and operation; constituent source/mapping/calendar/accounting/scope/currency contexts must be comparable. Missing, conflicting, invalid, unresolved and incompatible inputs produce null/N_R with retained reasons and LOW calculation confidence, rather than imputation.

## Operand preparation and financial review

Supported operand primitives:

- REPORTED: one canonical fact covering the exact requested window.
- AVERAGE_ENDPOINTS: two STOCK/INSTANT common-equity endpoints, immediately before the economic start and at its end; exact add/divide under the declared decimal policy.
- TTM_QUARTERS: exactly four explicitly ordered, contiguous native three-month FLOW quarters, covering the requested twelve-month window with consistent fiscal sequence, source/mapping/calendar and item identity. No balance-sheet stock summation or duplicate/gapped constituents.
- QUARTER_FROM_YTD: later minus earlier explicitly ordered compatible YTD flows with a common fiscal start, consecutive fiscal quarters and explicitly supplied target dates. Revision kinds and correction evidence/knowledge must be compatible; changed mappings or incompatible vintages fail closed.
- HUMAN_NORMALIZED: an explicitly reviewed additive adjustment to a pinned fact, with retained amount, rationale, reviewer, evidence, review time and confidence. The engine invents no earnings adjustment.
- ACTION_ADJUSTED: an explicitly reviewed positive factor applied only to a per-share input, retaining original units and full adjustment evidence. No production EPS/action route is approved in this registry. Arithmetic preparation can be exercised synthetically; a per-share result cannot be relabeled as currency to calculate FCF/ROE/CASA/NPL.

The default proposed FCF crosswalk permits REPORTED operands; TTM/YTD alternatives require a separately versioned explicit crosswalk and approval for FORMAL use. The current calendar primitive supports native three-month quarters in a twelve-month fiscal year. Unresolved irregular/52–53-week calendars need separately governed support, not guessed dates.

Formula operands must share reporting scope, segment, accounting basis, fiscal calendar, units and currency. The four current wrappers require monetary VND components; USD is never relabeled or converted to VND. ROE uses reviewed common-attributable profit, not total NPAT. Zero/nonpositive denominators retain existing N/R behavior. An explicitly cyclical request without financial normalization retains the existing cycle-normalization N/R rule.

Independent fixtures reconcile ROE `(24 − 6) / ((100 + 140) / 2) = 0.15`, FCF `100 − 30 = 70`, CASA `30 / 200 = 0.15`, NPL `4 / 200 = 0.02`, four-quarter FCF `40 − 8 = 32`, and quarter-from-YTD FCF `(50 − 20) − (9 − 5) = 26`. Review confidence propagates by the weakest adjustment/validity contribution; N/R is LOW. This is calculation confidence, not an investment score or a production data-quality acceptance verdict. A future human review is rejected even when the route is unresolved.

## Immutable persistence and migration

One additive migration creates `fundamental_derivation` and `fundamental_derivation_input`. The artifact retains request, crosswalk and registry manifests/hashes, original canonical observation bodies/hashes, ordered constituent IDs, adjustment evidence, prepared operand values/reasons, formula identity, precision policy, execution time and result/null. Restrictive Security/observation/derivation foreign keys and update/delete/replace guards preserve old rows and input links. No existing table is altered or backfilled.

The application loads only the named observations. The repository independently reloads/replays them inside the append transaction, checks the complete result hash and atomically inserts the artifact plus ordered input links. Missing inputs, forged outputs and duplicate append fail without partial writes. Reads verify immutable body hash/indexed metadata, exact ordered link manifest, raw-backed observation integrity, registry/methodology binding and independent calculation replay; reopened databases reproduce the same result. Raw facts, revision chains, qualifications and old normalization assessments remain unchanged.

Migration checks upgrade a populated Slice 03 baseline containing prior canonical facts and a synthetic prior normalization storage row, compare all old table rows/DDL/guards unchanged, repeat deployment and check foreign keys/status. Earlier populated portfolio/fundamental migration regressions also run against the new latest schema. Schema validation and generation used an explicit harmless temporary DATABASE_URL and `--no-env-file`; operational migrations were executed only by owned temporary test fixtures.

## Verification

Required runtime: Node 22.23.2 and pnpm 10.34.5. No production/private database or environment file was accessed. The scoring/decision script test lists were executed directly with vitest after isolated client generation, avoiding their default database-generation wrappers that read .env.local.

- Focused derivation, populated migrations, registry and architecture: **9 files / 62 tests passed**.
- TypeScript `tsc --noEmit`, ESLint zero warnings, architecture boundary checks **127 modules**, Prisma validate/generate and git diff checks passed.
- Existing scoring/decision script test lists: **12 files / 345 tests passed**.
- Full final-code unit/integration/architecture regression: **58 files / 847 tests passed**.
- Token-session regression: **3 tests passed**.
- Final typecheck, lint, boundaries and diff checks passed after the full suite. This report was then updated with completed execution counts; no implementation/test/schema change followed that run.

Initial typecheck errors in callback annotations and confidence return inference were fixed before passing verification. All new arithmetic fixtures, immutable persistence/reopen, forged/missing input, FORMAL gate, N/R retention, SQL mutation/FK and legacy migration checks pass. No failing initial check is claimed as PASS.

## Exact implementation files

1. `src/domain/fundamentals/derivation.ts`
2. `src/application/fundamentals/derive.ts`
3. `src/ports/fundamentals.ts`
4. `src/domain/scoring/metrics.ts` — narrow generic arithmetic operand type; formulas unchanged.
5. `src/domain/scoring/evidence.ts` — available() accepts the fields it reads; logic unchanged.
6. `src/infrastructure/fundamentals/derivation-crosswalk-v1.json`
7. `src/infrastructure/fundamentals/derivation-crosswalk.ts`
8. `src/infrastructure/repositories/fundamental-derivation.ts`
9. `prisma/schema.prisma`
10. `prisma/migrations/202610090002_fundamental_derivation/migration.sql`
11. `tests/fixtures/database.ts`
12. `tests/fixtures/derivation.ts`
13. `tests/unit/fundamentals-derivation.test.ts`
14. `tests/integration/fundamentals-derivation.test.ts`
15. `tests/integration/fundamentals-derivation-migration.test.ts`
16. `tests/integration/fundamentals-migration.test.ts`
17. `tests/integration/fundamentals-normalization-migration.test.ts`
18. `tests/integration/registry.test.ts`
19. `docs/fundamental-data-engine/SLICE_4_IMPLEMENTATION_REPORT.md`

## Review boundaries

Technical self-review: the arithmetic wrapper preserves investment formulas, explicit ordered lineage, immutable predecessors and no latest-wins behavior; financial tests distinguish common profit, stock averaging, native-quarter sums, compatible YTD subtraction, currency and sector economics; Risk/QA negative controls block missing/invalid evidence, future review, tampering and production gate bypass. These implementation checks are not independent CIO/Data Architect/Financial Data Engineer/Risk sign-off.

Mapping, registry and derivation crosswalk are not self-approved. Real reviewed issuer data, banking definitions, complete sector requirements/coverage, reviewer authenticity, source access/retention/storage qualification and governed production release remain pending. A reviewer/evidence reference is a trusted local declaration, not cryptographic authentication. No live issuer derivation or private DB migration was performed.

No Slice 05 work: no availability evaluator, publication fallback, AS-KNOWN/AS-REVISED/latest selector, snapshot builder or snapshot content identity. Every derived artifact keeps availableAt null/UNKNOWN. No production scoring/ranking/Top 10, valuation engine, portfolio decision or investment recommendation was run. Existing scoring/decision test fixtures were executed solely as regression checks. DI1–DI15 statuses are unchanged; no DI gate becomes PASS from this implementation.

Recommendation after completed regression evidence: **READY FOR SLICE 04 IMPLEMENTATION REVIEW**, within the proposed-crosswalk/pinned-arithmetic scope above. Stop before Slice 05.
