# M6.4 audit: baseline verification

This verifies the unchanged M6.2/M6.3 application, **not M6.4**. No M3 golden tests were added or executed as an M6.4 suite.

Environment: Node 22.23.2 from `/private/tmp/node-v22.23.2-darwin-arm64/bin`, pnpm 10.34.5. Shell default Node 22.12.0 does not meet package engines, so it was not used for validation. Existing M6.3 verification documents report workspace dependency-read stalls; the existing isolated checkout `/private/tmp/vn30-m63-validation` was reused after checking 81 tracked source/config/schema/test files. All SHA-256 values matched, including after validation; see `source-comparison.json`. Generated/vendor contents and docs are outside that comparison.

Commands ran sequentially in the requested order, preceded by temporary database setup. No production portfolio database was targeted. Integration tests create their own private temporary SQLite databases. The explicit CLI target was a newly allocated `vn30-m64-baseline-*` private temporary directory.

| Command | Initial exit | Final exit | Test count | Result |
| --- | ---: | ---: | --- | --- |
| pnpm lint | 0 | 0 | N/A; includes boundary checker | PASS |
| pnpm typecheck | 0 | 0 | N/A | PASS |
| pnpm test | 0 | 0 | 285 passed, 18 files | PASS |
| pnpm test:portfolio | 0 | 0 | 136 passed, 7 files | PASS |
| pnpm test:integration | 0 | 0 | 97 passed, 8 files | PASS |
| pnpm prisma validate | 0 | 0 | N/A | PASS |
| pnpm prisma migrate status | 1 | 0 | 2 baseline migrations, up to date after setup repair | PASS on retry |
| pnpm build | 0 | 0 | N/A | PASS |
| pnpm test:e2e | 1 | 0 | 1 Chromium test plus production HTTP smoke | PASS on retry |
| git diff --check | 0 | 0 | N/A | PASS |

Counts overlap: portfolio and integration tests are subsets of the main suite. Do not add them as unique cases.

Initial temporary setup through direct `pnpm prisma migrate deploy` failed with a schema-engine error, leaving migrate status unable to inspect a migrated database. Using the existing `scripts/database.mjs migrate --no-env-file` wrapper and the canonical `/private/var/...` temporary path prepared the SQLite file and applied both baseline migrations successfully. Status then passed. No new migration was introduced; fresh/populated/repeat M6.4 migration validation is not applicable. Existing portfolio migration regression tests ran in the suites above.

Initial E2E failed before browser tests because the sandbox denied a `127.0.0.1` listener (`EPERM`). An authorized outside-sandbox retry passed. Original failures are retained in logs. A harmless existing FORCE_COLOR/NO_COLOR warning appeared during the browser run.

Git evidence, after documentation creation:

```text
$ git status --short
?? "docs/06_DASHBOARD/6.4 Scoring & Ranking/"

$ git diff --stat
(no output; additions are untracked)

$ git diff --check
(no output; exit 0)

$ git log -1 --oneline
42afdf5 Complete M6.3.1
```

`git diff --check` does not inspect untracked files. New Markdown was additionally checked for trailing whitespace; no failures. No staging, commit or push.

Exact evidence inventory:

- `build.log`
- `diff-check.log`
- `lint.log`
- `prisma-status-retry.log`
- `prisma-status.log`
- `prisma-validate.log`
- `results.json`
- `setup-temporary-database.log`
- `source-comparison.json`
- `test-e2e-retry.log`
- `test-e2e.log`
- `test-integration.log`
- `test-portfolio.log`
- `test.log`
- `typecheck.log`
- `VALIDATION.md` (this summary)
