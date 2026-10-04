# Exact Git-baseline populated and restored database protocol

Approved starting application code: f609a94d610705f3897e86b914fa4de5055833ce. An isolated git archive of that exact commit was extracted under an owned mkdtemp directory. The existing frozen node_modules installation and generated Prisma client were reused through symlinks; the Prisma schema and migration files have no M6.8 change. No Next build was run in the archive. Baseline application/domain/repository code and baseline fixtures ran under that archive's alias/config/cwd. The only added file was the validation helper, not a production change.

The helper in validation-tools/populated-baseline-check.test.ts.txt is copied temporarily to tests/integration/m68-baseline-proof.test.ts for each invocation. M68_POPULATED_PHASE=baseline uses the baseline's testDatabase, initializes an identity-only portfolio, posts contribution and BUY, persists baseline score/rank/decision artifacts, creates original and superseding marginal review/proposal, and writes a private handoff containing exact rows and replay expectations. It disconnects without removing that test-owned database. M68_POPULATED_HANDOFF points at the private handoff, never at user portfolio configuration.

M68_POPULATED_PHASE=current opens only the handoff's disposable path through current code, deploys/status-checks twice, compares every logical row (including migrations), reconstructs accounting and replays decision, analytical, marginal and original/superseding workflow records using the existing owners. M68_POPULATED_REPORT points at the public test evidence JSON, which omits the disposable DB path and records counts/hashes/exits. The temporary helper is removed from the repository before the full aggregate suite.

The same baseline-created database was then passed to supported `node scripts/backup.mjs backup <private target>` with explicit disposable DATABASE_URL, followed by `node scripts/backup.mjs restore <backup> <separate private candidate>`. The helper's current phase was repeated against the restored candidate with unchanged baseline expectations. Thus nonempty marginal allocations, embedded journal/review/proposal history, methods and ledger facts are preserved, not just empty table schemas. The source was not replaced or activated. All owned DB, backup, handoff and archive directories were cleaned after successful evidence collection.

| Supplemental command | Exit | Result | Passed tests |
|---|---:|---|---:|
| Baseline Node Vitest helper, baseline phase | 0 | PASS | 1 |
| Current Node Vitest helper, current phase (two deploy/status repeats) | 0 | PASS | 1 |
| Supported backup CLI on baseline-populated disposable DB | 0 | PASS | — |
| Supported restore CLI to separate disposable candidate | 0 | PASS | — |
| Current Node Vitest helper, restored phase (two deploy/status repeats) | 0 | PASS | 1 |

Actual outputs: populated-baseline-create.log, populated-baseline-replay.log, populated-backup.log, populated-restore.log, populated-restored-replay.log. Logical row counts/hash and actual migration exits: populated-baseline-evidence.json and populated-restored-replay-evidence.json. These three supplemental tests are separate from, and not added into, the unique aggregate-suite count. This protocol tests application/schema compatibility; it does not supply genuine production approvals, vendor sources or broker reconciliation.
