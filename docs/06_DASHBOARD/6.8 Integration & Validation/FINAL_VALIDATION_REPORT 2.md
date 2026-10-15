# M6.8 completion and independent-review report

A. Commit and scope

Base: `f609a94d610705f3897e86b914fa4de5055833ce` (clean approved starting tree). The delivery commit is the commit containing this report; its SHA and exact files-changed count are reported in the completion response, avoiding a self-referential commit hash. Changes comprise current review/server integration and marginal-repository catalog integrity, private backup/restore commands, validation harness, focused regression/architecture/browser fixtures, keyboard focus target, README and this evidence directory. No migration, upstream policy, dependency lockfile or M7 feature changed. Files changed: **173** (14 implementation/test/README/package files; 159 reports, logs, manifests and screenshots); exact inventory: [FILES_CHANGED.txt](FILES_CHANGED.txt).

B. Findings before fixes

Critical **0**, Major **4**, Minor **6**. Three Major findings came from existing integration/operation gaps; the fourth was caught in the new catalog during hardening (see INTEGRITY_PREFILTER_REPRODUCTION.md). Counts are bounded implementation/audit findings, not a claim that every deferred broader M6 capability exists. Upstream dependency advisory severities are separately recorded, including one externally labelled Critical with no exposed next/og surface here.

C. Confirmed Major fixes

| Finding | Root cause / effect | Fix | Regression evidence |
|---|---|---|---|
| M68-M01: persisted marginal authority absent from current monthly initiation | M6.7 server composed only rank/base decisions; approved M6.5 sequential authority could not reach M6.6 proposal | Server resolves one matching formal persisted artifact, replays/verifies lineage and freshness, adds ID to immutable identity and delegates to WorkflowEngine; ambiguous/missing/corrupt authority fails closed | m68 formal two-lot + stop/residual, production server composition, tamper/ambiguity, no ledger side effect |
| M68-M02: required backup/restore operational capability missing | Prior foundation deferral did not fulfill M6.1 backup gate | Read-only SQLite VACUUM INTO; private no-overwrite staged publication; exact schema/migration/version/watermark/row/body checks; mandatory checksum-verified separate restore candidate | m68-backup exact rows/IDs/hashes and existing owner replay; corruption/overwrite/public/symlink/missing/manifest rejection |
| M68-M04: corrupted marginal body hidden by selection | New catalog filtered embedded scope/snapshot before verifying its hash, permitting fallback when corruption changed selection fields | Verify the persisted marginal inventory hashes before body-derived selection, then replay selected authority through existing owners | Production catalog corruption reproduction fails before fix and passes after; no review/ledger write |
| M68-M03: calculation issuance confused with source receipt; revised current proposal linkage missing | Review cutoff fixed at source receipt excluded valid later calculations; later wall-clock retry or attached marginal plan had no stable command/linkage handling | Capture issuance time separately; pin original marginal cutoff; reuse immutable issuance fields on deterministic retry; explicitly supersede the single prior current monthly plan, preserving originals; ambiguity blocks | delayed-calculation production-composition test: score/decision after receipt, retry after clock advance, new two-lot marginal review/proposal links, original rows unchanged, no transaction |

Minor M68-N01 fixed: skip-to-content target was not keyboard-focusable; tabindex=-1 added; browser checks wait for visible streamed content before native activation, with actual focus asserted at desktop/mobile widths. Remaining five Minor categories: dense mobile navigation/evidence scrolling; repeated/full-history reads and large artifact payloads; defensive filesystem build-tracing warnings; non-reachable dependency advisories requiring maintenance; experimental Node SQLite/runtime-version maintenance. No suppression of a failing correctness test or permission guard was used.

D. End-to-end A–X

See [SCENARIO_MATRIX.md](SCENARIO_MATRIX.md) for every scenario and named evidence. A/C/D/E/F/G/H/J/K/M/N/O/P/Q/S/T/U/V/W pass controlled gates. B/I/L/R are PASS WITH LIMITATION for explicitly stated browser composition, historical analytics, manual detection and supported accounting capability bounds. X passes the absence/no-bypass audit; live AI operation is not applicable. Synthetic browser evidence and formal-path simulated approvals are not a real-data production session.

E. Authority audit

[RULE_OWNERSHIP_MATRIX.md](RULE_OWNERSHIP_MATRIX.md), [SOURCE_SCAN.json](SOURCE_SCAN.json), installed-resolver boundary checks and authority regressions establish M6.3 accounting/posting, M6.4 score/rank, M6.5 decision/risk/marginal authorization, M6.6 workflow/proposal/HOLD CASH and M6.7 current/presentation ownership. The new integration resolves persisted owners; it introduces no investment formula. No cash contribution, price decline, profit threshold or Top10 shortcut authorizes investment. No proposal or review auto-posts a ledger transaction. Historical defective methods remain replay-only.

F. Security audit

[SECURITY_AND_OPERATIONS_AUDIT.md](SECURITY_AND_OPERATIONS_AUDIT.md) records browser authority injection, signed-confirmation tamper/expiry/repetition, origin guards, stale/unreconciled/future/source corruption, immutable hash/lineage checks, private storage and backup/restore adversarial cases. No client/AI authority bypass was found. Supplemental `pnpm audit --json` exit **1** (FAIL / advisories, no test count) reported **1 Critical / 5 High / 3 Moderate upstream advisories**; this is not a clean dependency audit. Critical Next ImageResponse advisory has no exposed application surface, enforced by a regression. Targeted maintenance is recommended before introducing such a surface; no broad upgrades were made.

G. Historical and migration audit

No M6.8 migration is needed. Fresh disposable deployment and status pass; repeated populated deployment/status preserve exact transactions, methods, IDs/hashes/versions and accounting/decision/marginal/review replay. Existing staged M6.3–M6.6 upgrade regressions remain enabled. Actual approved Git-baseline population and M6.8 replay are independently recorded in populated-baseline-evidence.json, with helper/logs retained. The supplemental protocol and its five command exits/three individual test counts are in [POPULATED_BASELINE_PROTOCOL.md](POPULATED_BASELINE_PROTOCOL.md). Backup restoration proves exact rows plus unchanged active source and immutable triggers. Current version B cannot restate historical A, and old ranking/context cannot authorize B.

H. Sequential final validation

Supported runtime: Node **22.23.2**. The harness uses only owned disposable database/source paths and cleans them. All required checks pass at their final attempts. The sequential harness itself exited 1 because it retained an earlier placement lint failure; corrected lint/typecheck checks then passed after the repository move. Every attempt is shown below, including that failure. Commands below ran sequentially; focused suites overlap, so their counts must not be added to claim unique tests. Full suite is the unique aggregate for its run. Repeat runs demonstrate deterministic artifact/replay behavior.

| Command | Exit | Result | Passed tests |
|---|---:|---|---:|
| `fresh-db-migrate` | 0 | PASS | — (not a test suite) |
| `pnpm lint` | 1 | FAIL | — (not a test suite) |
| `pnpm typecheck` | 0 | PASS | — (not a test suite) |
| `pnpm test` | 0 | PASS | 761 |
| `pnpm test:portfolio` | 0 | PASS | 136 |
| `pnpm test:integration` | 0 | PASS | 164 |
| `pnpm prisma validate` | 0 | PASS | — (not a test suite) |
| `pnpm prisma migrate status` | 0 | PASS | — (not a test suite) |
| `pnpm build` | 0 | PASS | — (not a test suite) |
| `pnpm test:e2e` | 0 | PASS | 10 |
| `pnpm test:decision` | 0 | PASS | 218 |
| `pnpm test:workflow` | 0 | PASS | 74 |
| `pnpm test:dca` | 0 | PASS | 54 |
| `pnpm test:ui` | 0 | PASS | 35 |
| `pnpm test:current` | 0 | PASS | 15 |
| `git diff --check` | 0 | PASS | — (not a test suite) |
| `pnpm test:m68` | 0 | PASS | 22 |
| `pnpm test:m68 repeat` | 0 | PASS | 22 |
| `fresh-db-status-repeat` | 0 | PASS | — (not a test suite) |
| `pnpm lint recheck` | 0 | PASS | — (not a test suite) |
| `pnpm typecheck recheck` | 0 | PASS | — (not a test suite) |
| `invalid-config startup` | 0 | PASS | — (not a test suite) |
| `git diff --check final` | 0 | PASS | — (not a test suite) |

The earlier sandbox-only run could not bind the loopback server (EPERM); authorized local-loopback runs then exposed the new skip-target test failure and identified a premature test activation against an attached but not yet laid-out streamed target. The first integrity-hardening lint attempt also rejected a misplaced node:crypto import in app/server; moving the integrity read into PrismaMarginalArtifacts preserved the enforced boundary. Corrected lint/typecheck rechecks are recorded after the sequential suites. Those actual failures are retained in initial-validation-evidence, pre-temporal-fix-validation-evidence and pre-skip-focus-validation-evidence; the final table is from validation-evidence/results.json after fixes. After evidence-format cleanup, `node --check scripts/validate-m68.mjs` and `pnpm lint` both exited 0 (no test count; 102 modules passed the boundary scan). Console log evidence is normalized only for trailing whitespace and excess blank EOF lines before committing; command messages, exits and counts are retained. Generated duplicate Next type outputs were moved aside before verification, with no source type suppression. Desktop/mobile visual evidence is in visual-evidence; [UI_AND_PERFORMANCE_AUDIT.md](UI_AND_PERFORMANCE_AUDIT.md) and performance.json state measured VN30-scale timings and limits.

I. Remaining findings and seven-role review

Remaining product findings: Critical **0**, Major **0**, Minor **5**. Retained change requests and wider-scope limits are [CHANGE_REQUESTS.md](CHANGE_REQUESTS.md), and every numbered M6.1 requirement/acceptance clause is reconciled in [M6_ACCEPTANCE_MATRIX.md](M6_ACCEPTANCE_MATRIX.md). No unresolved confirmed Major is relabelled as a future enhancement. Broader M6 remains PASS WITH LIMITATION under the existing deferred scope; real-data operational acceptance is **BLOCKED / NOT VALIDATED**, not READY.

| Review role | Final gate evidence and limitation |
|---|---|
| CIO | No forced cash deployment, rank/price/profit shortcut or annual policy mutation; approved methodology gates retained |
| Portfolio Manager | Marginal lot reassessment, affordability/capacity separation, event precedence, independent reconciliation and explicit execution; corporate-action source limits retained |
| Software Architect | One authority per concept, resolver/client import guards, persisted replay, no new calculator or external service |
| Data Engineer | Exact Decimal accounting; distinct as-of/receipt/issuance/cutoff times; immutable revisions; fresh/populated/restore checks; manual source/production approval prerequisites explicit |
| Security Reviewer | Adversarial injection/origin/storage/error tests pass; upstream advisories and local storage limitations disclosed |
| QA Engineer | Requested command exits/counts retained, repeat critical suites, baseline/restore replay, no real DB touched; no claim of exhaustive real-data acceptance |
| UX Reviewer | Desktop/mobile screenshots, keyboard/errors/status tests, visible proposal/execution and stale/synthetic distinction; dense mobile and assistive-technology coverage limits recorded |

J. Milestone statement

M6.8 is ready for independent review within the approved bounded scope with zero remaining Critical/Major implementation findings, subject to the explicit broader-product and operational limitations above.

**Milestone 7 functionality implemented: NO.** Work stops at M6.8.
