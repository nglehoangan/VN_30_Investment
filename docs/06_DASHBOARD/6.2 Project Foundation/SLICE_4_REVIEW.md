# M6.2 Slice 4 — Persistence foundation review

2026-09-10. Slice 3 approved by user; Slice 4 implemented and ready for review. This report is implementation self-review, not independent approval. Slice 5/M6.3 have not started.

## Delivered

- Prisma SQLite schema and initial migration for methodology metadata only; explicit validate/generate/migrate/status commands.
- Private local DB configuration, safe creation and server-only lifecycle composition. No default production DB, seed or CRUD endpoint was created.
- Append/read repository with complete lineage validation, duplicate conflict, application missing-record error and database immutability triggers.
- Real temporary SQLite integration fixtures and exact numeric TEXT round-trip proof through Prisma. Numeric probe is absent from production migrations/schema.
- [ADR 0003](../../adr/0003-sqlite-prisma-persistence.md) and root README cover representation, operations, isolation and limitations.

## Validation evidence

Runtime: Node 22.23.2, pnpm 10.34.5 (temporary local runtime; system Node unchanged). Prisma/client/adapter 7.10.0; better-sqlite3 12.11.1. Existing Next 16.3.4, React 19.3.0, TypeScript 6.0.3, Vitest 5.0.0.

| Gate | Result |
| --- | --- |
| pnpm install --offline --frozen-lockfile | PASS, final lockfile unchanged |
| pnpm db:validate / db:generate | PASS, valid schema and generated client |
| pnpm lint | PASS, zero warnings; 25 source modules checked |
| pnpm typecheck | PASS including generated client and route types |
| pnpm test | PASS, 148 tests / 10 files after dependency remediation |
| pnpm build | PASS, static shell and not-found routes |
| pnpm test:smoke | PASS, real HTTP 200, heading, startup hook, owned loopback listener |
| node scripts/smoke-app.mjs --invalid-config | PASS, config failure blocks readiness/success and no canary leakage |
| pnpm audit --json | PASS, 0 vulnerabilities after scoped overrides |
| Empty DB migrate deploy / migrate status | PASS in temporary DB fixtures |
| Repeated deploy, rollback, reopen/disconnect | PASS, original records preserved |
| Previous supported schema upgrade | N/A: first migration |
| FK relationship integrity | N/A: no relationships in schema; foreign keys enabled |
| Playwright | Deferred to Slice 5 as planned |

Integration evidence includes actual physical TEXT columns/names, private permissions, malformed metadata rejection before write, invalid stored-row detection, append/read, duplicate preservation, null vs NotFound contract, transaction rollback, update/delete/replace rejection, stable effective-date filtering, independent reopen and migration idempotence. File tests reject unsafe URL shapes/locations, aliases into public storage, symlinks and unsafe permissions without truncating existing content. Test factories override inherited DB targets and skip local env files.

Numeric tests use parameterized SQL through the actual Prisma SQLite adapter. Eight values cover whole amounts, huge integers, fractional price/fee, tiny values, negative values and significant scale. JSON and persisted round-trips compare exact strings and typeof=text. An independent BigInt rational computation confirms a fee product remains exact; invalid numbers, exponent/locale text and corrupt stored values fail. No approximate comparisons or financial rounding rules are used.

## Findings and resolution

| Severity / status | Location | Finding, fix and evidence |
| --- | --- | --- |
| Major / fixed | package.json pnpm.overrides; pnpm-lock.yaml | Initial audit reported 2 high + 1 moderate in Prisma CLI transitives. Scoped deepmerge-ts 8.0.0 and mysql2 3.23.1 overrides remove all three. Full validation, migration tests and build pass; final audit 0. ADR records upstream references and compatibility limit. |
| Major / fixed | .next/types generated cache | Duplicate generated `* 2.ts` files caused typecheck errors. Moved only duplicate generated files to temporary storage; canonical files retained. Type generation/typecheck pass; user source and running dev server preserved. |
| Minor / open | package.json ESLint 9; lockfile prebuild-install | Existing ESLint lifecycle constraint and native transitive package deprecation remain. No reported audit vulnerabilities. Revisit with compatible upstream tooling. |
| Minor / open | src/infrastructure/db/files.ts; scripts/smoke-app.mjs | Permission/listener checks validated on macOS/POSIX only. Cross-platform operation is not claimed. |

No Critical/Major unresolved within Slice 4. Local file owner tampering, external verification of methodology references, backup/restore and future financial arithmetic are outside this slice's guarantee.

## Review perspectives

| Perspective | Assessment |
| --- | --- |
| Software Architect | Minimal schema and explicit server composition match Slice 4; application/domain do not import Prisma. Generated adapter imports remain enforced. |
| TypeScript Engineer | Strict types and generated-client checks pass; separate read/write ports preserve nullable lookup. CLI uses supported Node type stripping for shared config. |
| Data Engineer | Snake-case physical fields, canonical date/instant TEXT, append-only lineage, exact decimals and real migrations verified; no financial schema added. |
| Security Reviewer | Private paths/perms, no seed or generic endpoint, safe public errors, loopback smoke and patched dependency graph checked. Filesystem protections assume trusted local OS access. |
| QA Engineer | Meaningful negative and real SQLite tests pass after final dependency changes; isolated targets, cleanup, migration status and reopen verified. E2E remains the next approved slice. |

Approved baseline SHA256 hashes are unchanged. No default data directory was created. Git remains uncommitted/untracked as in prior slices; no staging, commit or push. Diff whitespace check is supplemented by a direct check of new source/docs because untracked files are not covered by git diff.
