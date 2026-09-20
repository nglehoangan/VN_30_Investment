# M6.5 validation report

Date: 2026-09-20. Result: ready for independent review; no production activation performed.

## F. Required sequential commands

Commands ran in the order below. Counts overlap across suites and must not be summed as unique tests.

| Command | Exit code | Result | Test count |
| --- | --- | --- | --- |
| pnpm db:migrate | 0 | PASS | — |
| pnpm lint | 0 | PASS | — |
| pnpm typecheck | 0 | PASS | — |
| pnpm test | 0 | PASS | 485 |
| pnpm test:portfolio | 0 | PASS | 136 |
| pnpm test:integration | 0 | PASS | 105 |
| pnpm prisma validate | 0 | PASS | — |
| pnpm prisma migrate status | 0 | PASS | — |
| pnpm build | 0 | PASS | — |
| pnpm test:e2e | 0 | PASS | 1 |
| git diff --check | 0 | PASS | — |
| pnpm test:decision | 0 | PASS | 95 |

All seven states, negative/ownership gates, A–J cases, anti-shortcuts, strict validation, execution separation, immutable lineage and migrations are covered. The decision suite comprises 89 decision unit cases, two M6.3 adapter cases and four SQLite/application integration cases. The main suite contains 485 tests; browser smoke adds one test.

## Environment and source equivalence

Validation used Node 22.23.2 in an isolated temporary checkout at `/private/tmp/vn30-m65-clean.9IMWQN`. The workspace dependency installation stalled while loading Prisma/jsdom before assertions; a cached dependency installation with byte-identical pnpm lockfile and matching package dependencies/devDependencies/pnpm configuration was copied into the isolated checkout. No dependency or lockfile upgrade was made.

`verification-evidence/source-manifest.json` records SHA-256 hashes for all 123 matching source/test/schema/script/public/configuration files. Generated Prisma output, node_modules, build output, local environment files and databases were excluded from source comparison. Prisma Client was generated in the temporary checkout. `git diff --check` ran in the original workspace. Logs and machine-readable command results are under `verification-evidence/`.

Verification database: `/private/tmp/vn30-m65-db-v7p_g_pz/verification.sqlite`. Individual integration tests create additional disposable SQLite databases. No real portfolio database was read or changed for validation.

## Migration and persistence evidence

- Fresh database: all migrations deploy; schema and migration status pass; expected-table regression includes decision_artifact.
- Populated M6.4 baseline: the existing M6.4 migration chain is applied first, upstream methodology/analytical rows populated, then M6.5 deployed. Exact upstream rows remain unchanged.
- Repeat deployment: migrations can be deployed again without data mutation.
- Decision history: duplicate ID, SQL UPDATE, DELETE and INSERT OR REPLACE are rejected; later score/evidence/snapshot/methodology revisions preserve earlier artifacts; read verifies checksum and deterministic replay.

The first broad run exposed only an outdated schema table-list expectation. It was corrected to include the intentional new table. Review then corrected lot feasibility to execution-only and added a conditional Stage 0 compatibility test. The complete final sequential run above passed after both changes.

## G. Findings

| Severity / register | Unresolved count | Disposition |
| --- | --- | --- |
| Critical | 0 | No known unresolved implementation finding |
| Major | 0 | No known unresolved implementation finding |
| Minor | 0 | No known unresolved implementation finding |
| Deferred policy change requests | 0 | Three conflicts resolved by explicit user approval; no invented policy change |
| Production governance dependency | 1 | GOV-01: approved upstream/M6.5 methodology registration remains required before formal issuance |

These are implementation self-review findings, not a substitute for independent CIO/architecture approval. Production governance is enforced by the code and has not been bypassed. Qualitative assessments and risk calibrations remain externally owned, with required provenance, as documented in IMPLEMENTATION_REPORT.md.

## H. Scope

**M6.6+ functionality implemented: NO**
