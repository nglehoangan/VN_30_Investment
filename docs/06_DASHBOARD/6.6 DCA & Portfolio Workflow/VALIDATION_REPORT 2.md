# M6.6 validation report

Validated 2026-10-01 using Node 22.23.2 and pnpm 10.34.5. The default Node 22.12.0 does not satisfy the repository runtime requirement; validation used the existing temporary Node 22.23.2 installation.

Commands ran sequentially with an explicit temporary SQLite DATABASE_URL. Integration fixtures independently create private temporary databases. No destructive validation ran against the real portfolio database.

| Command | Exit | Result | Test count | Evidence |
|---|---:|---|---:|---|
| `pnpm db:migrate` | 0 | PASS | N/A | [00.log](validation/00.log) |
| `pnpm lint` | 0 | PASS | N/A | [01.log](validation/01.log) |
| `pnpm typecheck` | 0 | PASS | N/A | [02.log](validation/02.log) |
| `pnpm test` | 0 | PASS | 660 | [03.log](validation/03.log) |
| `pnpm test:portfolio` | 0 | PASS | 136 | [04.log](validation/04.log) |
| `pnpm test:integration` | 0 | PASS | 126 | [05.log](validation/05.log) |
| `pnpm prisma validate` | 0 | PASS | N/A | [06.log](validation/06.log) |
| `pnpm prisma migrate status` | 0 | PASS | N/A | [07.log](validation/07.log) |
| `pnpm build` | 0 | PASS | N/A | [08.log](validation/08.log) |
| `pnpm test:e2e` | 0 | PASS | 1 | [13-e2e-retry.log](validation/13-e2e-retry.log) |
| `pnpm test:workflow` | 0 | PASS | 47 | [10.log](validation/10.log) |
| `pnpm test:dca` | 0 | PASS | 32 | [11.log](validation/11.log) |
| `git diff --check` | 0 | PASS | N/A | [12.log](validation/12.log) |

Counts overlap: the full suite includes the focused suites. The 79 workflow/DCA tests comprise 36 workflow unit cases, 32 DCA unit cases and 11 integration cases. E2E covers the existing production shell; the new application commands are exercised by integration tests.

## Failures resolved during validation

- The initial full-suite run found an outdated table-list assertion in `tests/integration/registry.test.ts`. It now includes the four additive workflow tables. The final full suite passes 660 tests.
- The sandbox E2E attempt exited 1 because listening on `127.0.0.1` was denied (EPERM). The permitted retry used another fresh temporary database and passed the HTTP/owned-loopback smoke check and Chromium test. The original failure log remains `09.log`; the successful retry is `13-e2e-retry.log`.

## Persistence evidence

Fresh migrations, migration status and repeated deploys pass. A populated M6.5 baseline contains an actual M6.3 cash deposit plus persisted methodology, scorecard/ranking and decision rows. The upgrade test compares all those rows before and after two migrations. Reviews/proposals resist update/delete/replacement; repeated commands deduplicate; new monthly artifacts preserve prior review/proposal bodies. A separately posted M6.3 trade links without changing ledger history or the original proposal.

## Limits and gate

Passing tests validate the implemented conservative behavior. They do not validate sequential multi-lot deployment or affordable substitution, which remain blocked under CR-01 and CR-02. Critical findings: 0 identified. Major findings: 2. **M6.6 completion gate: NOT MET.** No M6.7 functionality was implemented.

Machine-readable final results: [final-results.json](validation/final-results.json). The earlier sequential-run results retain the sandbox-only E2E failure for traceability.
