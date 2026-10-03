# M6.6.1 validation results

Date: 2026-10-03. Runtime: Node 22.23.2, pnpm 10.34.5. Base: `84ab7c4f53b4ee70f74897a89e3a5a6efbe61f6c`.

All requested commands have a passing final result. Commands ran sequentially with a fresh temporary SQLite DATABASE_URL. Test fixtures independently create private temporary databases. No real portfolio database was modified.

| Command | Exit | Result | Test count | Log |
|---|---:|---|---:|---|
| `pnpm db:migrate` | 0 | PASS | N/A | [00.log](validation/00.log) |
| `pnpm lint` | 0 | PASS | N/A | [01.log](validation/01.log) |
| `pnpm typecheck` | 0 | PASS | N/A | [02.log](validation/02.log) |
| `pnpm test` | 0 | PASS | 687 | [03.log](validation/03.log) |
| `pnpm test:portfolio` | 0 | PASS | 136 | [04.log](validation/04.log) |
| `pnpm test:integration` | 0 | PASS | 131 | [05.log](validation/05.log) |
| `pnpm prisma validate` | 0 | PASS | N/A | [06.log](validation/06.log) |
| `pnpm prisma migrate status` | 0 | PASS | N/A | [07.log](validation/07.log) |
| `pnpm build` | 0 | PASS | N/A | [08.log](validation/08.log) |
| `pnpm test:e2e` | 0 | PASS | 1 | [14-e2e-retry.log](validation/14-e2e-retry.log) |
| `pnpm test:decision` | 0 | PASS | 218 | [10.log](validation/10.log) |
| `pnpm test:workflow` | 0 | PASS | 74 | [11.log](validation/11.log) |
| `pnpm test:dca` | 0 | PASS | 54 | [12.log](validation/12.log) |
| `git diff --check` | 0 | PASS | N/A | [13.log](validation/13.log) |

Counts overlap; focused suites are included in the full 687-test run. This remediation adds 22 marginal unit cases and 5 integration cases. E2E is the existing production-shell browser smoke test; marginal application behavior is verified through unit/integration tests.

## Required case coverage

| Cases | Evidence |
|---|---|
| A/B | Two independently authorized lots; third blocked at economic target; exact post-lot cash/exposure and lot references |
| C | Projected sector capacity exhausted after first lot |
| D | One funded lot then cash accumulation; residual cash includes fee deduction |
| E | Non-executable board lot retains economic merit and produces no fractional lot |
| F | Missing next assessment produces REVIEW REQUIRED and no executable proposal items |
| G | Fresh M6.5 comparison changes preference from A to B |
| H | New tie requires review; no alphabetical winner |
| I | 15-candidate evidence-driven ordering with deterministic replay |
| J | Affordable alternative failing the required-return gate receives no substitution |
| K | Alternative satisfying all approved §12 conditions receives a lot; original preferred candidate remains in the trace |
| L | Lower share price alone cannot authorize substitution |
| Security | Injected result/quantity/preference/ordering/approval rejected; forged/corrupt persistence, stale base, mismatched projection and scope crossing rejected |
| History | Later substitution reviews must reference prior records; recurring diversion requires fresh evidence |
| Execution | Separately posted fills link to individual lots; duplicate/missing references rejected; ledger and proposal remain unchanged |
| Compatibility | Fresh, populated M6.5 and populated M6.6 upgrades, repeated migration, immutable historical rows |

The existing M6.6 anti-shortcut tests remain unchanged and pass. Weekly/monthly/quarterly/annual/event, behavioral, journal and post-decision regressions also pass.

## Browser retry

The sandbox attempt exited 1 before the test server could bind to `127.0.0.1` (EPERM). With localhost permission, the retry passed the owned-loopback/HTTP check and one Chromium test against another fresh temporary database. Both attempt logs are retained; `final-results.json` records the successful result and original attempt.

## Review status

M66-R1-M01 and M66-R1-M02 are implemented and covered by the tests above. Self-review findings: Critical 0, Major 0, Minor 0 identified. No new governance approval was assumed. The exact approved substitution semantics are documented in [POLICY_AUDIT.md](POLICY_AUDIT.md). Independent review remains separate from this implementation validation.

**M6.7+ functionality implemented: NO.**
