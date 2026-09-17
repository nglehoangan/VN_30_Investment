# M6.3 — Independent Review Remediation

Reviewed commit: `6f4af0c5122eaf6b642ec6d6e6ce72a93780b335` (`6f4af0c Complete M6.3`). Date: 2026-09-17.

**All six findings CLOSED in implementation and regression verification. Critical unresolved = 0; Major unresolved = 0 within the reviewed/remediated scope. Ready for independent ChatGPT review; independent acceptance is not assumed.**

## A. Findings closure

### M63-R2-C01 — CLOSED — future-effective invariant validation

Files: `src/application/portfolio/candidate.ts` (new), `engine.ts`, `src/domain/portfolio/transaction.ts`, `tests/integration/portfolio-review-remediation.test.ts` (new).

The reviewed builder rejected all future effective timestamps, so the original future-oversell example was rejected by a blanket date guard rather than validated economically. The review also explicitly requires valid confirmed future transitions to be supported. This remediation removes that blanket effective-date restriction while preserving `eventAt <= now`, source evidence, all accounting checks and M2's ban on speculative announced balance changes. Approved M2/M6.1 baselines are not edited.

Candidate preparation occurs inside the claimed-revision database transaction. It builds all proposed transactions and replays through the latest leg effective time in the **entire candidate history**, or now if later. The ordered replay checks each economic event/correction-group boundary. Therefore it validates new future transitions, intermediate invalid states and already committed later transitions affected by a newly inserted earlier event. Merely checking final quantity would be insufficient; a dedicated regression shows a later BUY cannot repair an earlier oversell. This single full replay avoids repeatedly replaying every prefix and preserves same-effective-time correction atomicity.

Regression evidence (11 tests):

- Current 100 shares → future SELL 200 rejects with NEGATIVE_POSITION_ERROR; row count/watermark/history unchanged, current quantity remains 100.
- Confirmed future BUY 100 → SELL 100 → both settlements accepted. Current holdings remain empty before effective time; future cash/receivable/payable/realized state matches independent expected amounts.
- Duplicate future corporate EFFECTIVE stage rejects before commit.
- Future unfunded payable, excessive/early settlement, invalidating reversal and new earlier sale which breaks an existing later sale reject atomically.
- Future settled-trade correction succeeds with original/reversal lineage preserved.
- Future speculative eventAt remains rejected.

### M63-R2-M01 — CLOSED — separate post-commit failure classes

Files: `src/application/portfolio/post-commit.ts` (new), `engine.ts`, review-remediation integration tests.

| Condition | Transaction | Projection | Accounting trust | Actionability | Reason |
|---|---|---|---|---|---|
| Normal post-commit completion | POSTED | VALID | VALID | Not blocked by posting layer | null |
| Ordinary projection infrastructure failure | POSTED | BLOCKED | VALID | BLOCKED | PROJECTION_REBUILD_REQUIRED |
| Concurrent ledger advancement, including rebuild ConflictError | POSTED | STALE | STALE | BLOCKED | LEDGER_ADVANCED |
| Reconstruction failure, typed projection integrity/domain error, or failed post-commit ledger read | POSTED | BLOCKED | BLOCKED | BLOCKED | POST_COMMIT_INTEGRITY_FAILURE |

The committed watermark remains in every response; no economic compensation or retry is emitted. Classification occurs at explicit reconstruction/projection/currentness boundaries. Currentness is checked even after a projection conflict. An integrity failure is not collapsed into ordinary projection failure.

Diagnostics preserve allowlisted `phase` and typed `code` plus the committed watermark. The error payload uses existing DataIntegrityError and safe public serialization. No raw message, cause, stack, SQL, DB path or secrets are returned. The normal posting-layer accounting trust does not replace full snapshot valuation/reference/reconciliation gates.

Regression evidence (6 tests): ordinary projection failure; concurrent advancement both with and without rebuild ConflictError; a real successful DB commit followed by corrupted adapter return causing reconstruction failure; typed projection integrity failure; post-commit currentness read failure. All applicable tests assert committed rows remain; error tests check sanitized output.

### M63-R2-M02 — CLOSED — economic P&L semantics

Files: `src/domain/portfolio/valuation.ts`, `tests/unit/portfolio-read-models.test.ts`, `docs/adr/0004-portfolio-ledger-and-accounting.md`.

Preferred field: `economicGainSinceSupportedInception`. Formula unchanged: `NAV − supportedInceptionNAV − netContributions`. `economicPnl` remains a deprecated compatible alias; existing callers/tests continue to work. `economicGainSemantics` pins `ACCOUNTING_VALUATION_NAV_BRIDGE`, VND units, since-supported-inception scope and literal false return/objective flags.

**This is an accounting/valuation NAV bridge. It is NOT TWR, CAGR, XIRR, annualized return, benchmark-relative return, or evidence that the 15–20% annual investment objective has been achieved.** It may include explicit accounting adjustments; it is not a return percentage or time-normalized performance measure.

Regression/type evidence: independently expected 920 VND bridge, alias equality, missing-price null behavior, exact metadata and literal `false` type for investment-return semantics. Existing imported inception tests remain green. No M6.8 analytics implemented.

### M63-R2-m01 — CLOSED — PortfolioEngine cohesion

Files: `candidate.ts`, `post-commit.ts`, `engine.ts`.

Two small application functions isolate the high-risk candidate-validation and post-commit classification paths. Engine retains orchestration, snapshot assembly and currentness. No service framework, new persistence layer or generic abstraction. All existing application tests remain green.

### M63-R2-m02 — CLOSED — reconstruction auditability

File: `src/domain/portfolio/reconstruct.ts`.

Extracted pure `applyObligationLeg` with readonly map/set inputs and a replacement-entry output. It isolates obligation creation/clearing and settlement-origin checks. Replay ordering, correction grouping, MWAC, cash and position behavior are retained. Existing net/split settlement, reversal, rights, numerical and historical tests plus new future-obligation tests pass. No wholesale accounting rewrite.

### M63-R2-m03 — CLOSED — integrity/security regressions

File: `tests/integration/portfolio-review-remediation.test.ts`.

Five maintained real-SQLite cases deliberately damage only disposable fixtures: malformed facts JSON, facts/normalized-column mismatch, facts/persisted-leg mismatch, unknown accounting method and corporate-action terms mismatch. Normal repository read and application reconstruction reject with DataIntegrityError; public errors contain only safe code/message. Production guards remain intact. Tests disable selected triggers/checks only inside owned fixture databases to emulate restore/tampering damage.

## B. Validation

Commands were executed sequentially in the required order. Node 22.23.2 / pnpm 10.34.5, unchanged locked dependencies. Validation checkout: `/private/tmp/vn30-m63-validation`; SHA-256 comparison: **82 files, 0 mismatches** against final workspace source/config/test/schema/script files, excluding generated/vendor files. Existing workspace dependency reads stall; the identical-source checkout remains the documented environment workaround.

| Command | Exit | Status | Count/result |
|---|---:|---|---|
| `pnpm lint` | 0 | PASS | ESLint + 40 source modules |
| `pnpm typecheck` | 0 | PASS | Prisma/Next type generation + tsc |
| `pnpm test --reporter=default --reporter=json --outputFile=/private/tmp/m63-r2-tests.json` | 0 | PASS | 285 tests / 18 files |
| `pnpm test:portfolio` | 0 | PASS | 136 tests / 7 files |
| `pnpm test:integration` | 0 | PASS | 97 tests / 8 files |
| `pnpm prisma validate` | 0 | PASS | Schema valid |
| `pnpm db:migrate` | 0 | PASS | Both existing migrations applied to fresh private SQLite |
| `pnpm prisma migrate status` | 0 | PASS | Two migrations, up to date |
| `pnpm build` | 0 | PASS | Production compilation/typecheck/static generation |
| `pnpm test:e2e` | 0 | PASS | Production rebuild; HTTP 200; 1 Chromium test |
| `git diff --check` | 0 | PASS | No output |

`pnpm test` only has reporter/output flags for evidence. E2e used approved permission for an owned 127.0.0.1 listener because the sandbox is known to reject local listen; all previous commands completed before e2e. No real user DB was opened, reset or migrated. No dependency updates were performed in response to the Prisma update notice. No assertion was weakened or test skipped.

Full counts include 149 foundation/architecture tests and 136 M6.3 tests. The 97 integration tests overlap those totals and must not be added again. New R2 coverage: 22 integration tests + 1 valuation/type test. The 20 previous closure regressions are unchanged and pass.

### Independent regression matrix

| Required scenario | Status | Evidence |
|---|---|---|
| Future oversell rejected before commit | PASS | R2 future oversell; unchanged watermark/rows/100 shares |
| Future valid transitions accepted | PASS | R2 BUY→SELL→settlements and future atomic correction |
| Future duplicate corporate action rejected | PASS | R2 issuer-action duplicate EFFECTIVE stage |
| Projection failure preserves authoritative ledger | PASS | R2 infrastructure failure and existing VC-L07 |
| Concurrent watermark produces STALE | PASS | Two R2 races, with/without rebuild ConflictError |
| Post-commit integrity failure produces explicit trust failure | PASS | R2 reconstruction/projection/currentness phases |
| Imported inception NAV remains correct | PASS | Previous M03 priced opening baseline 2,500; gain 1,000; reload/version cases |
| Pre-inception reconstruction blocked | PASS | Previous M02 snapshot/reconstruct/watermark guards |
| Vietnam effective-date boundary remains correct | PASS | Previous M01 UTC 17:00 boundary and identifier/sector cases |
| Reversal/correction lineage preserved | PASS | VC-L06 plus future settled correction |
| Duplicate economic event rejected | PASS | VC-L05, prior C01 temporal stage tests, R2 future stage |
| Malformed persisted facts rejected | PASS | R2 malformed-json DataIntegrityError |
| Persisted leg mismatch rejected | PASS | R2 leg-mismatch DataIntegrityError |
| Corporate-action terms mismatch rejected | PASS | R2 action-terms DataIntegrityError |
| Missing price never becomes zero | PASS | VC-MD03 and R2 semantics null case |
| Reconciliation never auto-fixes ledger | PASS | Existing VC-RC01–04 and unresolved/mismatch tests |

[Machine-readable commands and named R2 regressions](verification-evidence/r2-remediation-results.json), [source hashes](verification-evidence/r2-source-sha256.json). Full raw test JSON is `/private/tmp/m63-r2-tests.json`; command logs are `/private/tmp/m63-r2-check-0.log` through `8.log` and `m63-r2-e2e.log`.

### Complete change inventory for this remediation

- New: `src/application/portfolio/candidate.ts`, `src/application/portfolio/post-commit.ts`, `tests/integration/portfolio-review-remediation.test.ts`.
- Modified implementation: `src/application/portfolio/engine.ts`, `src/domain/portfolio/transaction.ts`, `src/domain/portfolio/reconstruct.ts`, `src/domain/portfolio/valuation.ts`.
- Modified tests/script: `tests/unit/portfolio-read-models.test.ts`, `package.json` (include R2 tests in maintained portfolio suite).
- Modified docs: `README.md`, `docs/PROGRESS.md`, `docs/adr/0004-portfolio-ledger-and-accounting.md`, M6.3 `COMPLETION_REPORT_2026-09-17.md`, `REVERIFICATION_2026-09-17.md`, `verification-evidence/README.md`.
- New docs/evidence: this report, `verification-evidence/r2-remediation-results.json`, `verification-evidence/r2-source-sha256.json`.
- Schema/migrations and approved M1–M5 policies: unchanged.

## C. Remaining issues

- Critical: **0 unresolved** in reviewed/remediated scope.
- Major: **0 unresolved** in reviewed/remediated scope.
- Minor code findings: **0 unresolved**; all three review minors addressed. Environment limitation remains: root dependency reads stall, handled with pinned-runtime identical-source checkout; Chromium emits the existing harmless color-environment warning.
- Deferred / Change Requests: CR-M63-01 bonus/stock-dividend basis; CR-M63-02 fractional entitlement/cash-in-lieu/tax; CR-M63-03 partial split-payment charge allocation. They remain fail-closed and unchanged. No policy guessed.

## D. Scope

**M6.4+ functionality implemented: NO.** No TWR/CAGR/XIRR/benchmark or M6.8 performance analytics. No commit/push. Work stops here for independent ChatGPT review; no approval or subsequent milestone is fabricated.

## E. Git evidence

Captured after implementation/docs/evidence. `git diff --stat` shows tracked-file changes; new untracked files are explicitly listed by status and inventory above.

`git status --short` — exit 0

```text
 M README.md
 M "docs/06_DASHBOARD/6.3 Portfolio & Transaction Engine/COMPLETION_REPORT_2026-09-17.md"
 M "docs/06_DASHBOARD/6.3 Portfolio & Transaction Engine/REVERIFICATION_2026-09-17.md"
 M "docs/06_DASHBOARD/6.3 Portfolio & Transaction Engine/verification-evidence/README.md"
 M docs/PROGRESS.md
 M docs/adr/0004-portfolio-ledger-and-accounting.md
 M package.json
 M src/application/portfolio/engine.ts
 M src/domain/portfolio/reconstruct.ts
 M src/domain/portfolio/transaction.ts
 M src/domain/portfolio/valuation.ts
 M tests/unit/portfolio-read-models.test.ts
?? "docs/06_DASHBOARD/6.3 Portfolio & Transaction Engine/R2_REMEDIATION_REPORT.md"
?? "docs/06_DASHBOARD/6.3 Portfolio & Transaction Engine/verification-evidence/r2-remediation-results.json"
?? "docs/06_DASHBOARD/6.3 Portfolio & Transaction Engine/verification-evidence/r2-source-sha256.json"
?? src/application/portfolio/candidate.ts
?? src/application/portfolio/post-commit.ts
?? tests/integration/portfolio-review-remediation.test.ts
```

`git diff --stat` — exit 0

```text
 README.md                                          |  2 +-
 .../COMPLETION_REPORT_2026-09-17.md                |  2 ++
 .../REVERIFICATION_2026-09-17.md                   |  2 ++
 .../verification-evidence/README.md                |  2 ++
 docs/PROGRESS.md                                   |  8 ++++++
 docs/adr/0004-portfolio-ledger-and-accounting.md   | 29 ++++++++++++++++++++++
 package.json                                       |  2 +-
 src/application/portfolio/engine.ts                | 26 ++++++-------------
 src/domain/portfolio/reconstruct.ts                | 23 +++++++++++------
 src/domain/portfolio/transaction.ts                |  4 ++-
 src/domain/portfolio/valuation.ts                  | 12 ++++++++-
 tests/unit/portfolio-read-models.test.ts           | 11 ++++++++
 12 files changed, 93 insertions(+), 30 deletions(-)
```

`git diff --check` — exit 0

```text
(no output)
```

`git log -1 --oneline` — exit 0

```text
6f4af0c Complete M6.3
```

