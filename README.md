# VN30 Value Investing OS

A local portfolio-management system for long-term VN30 Value Investing. It combines an approved investment constitution with immutable portfolio accounting, scoring/ranking, formal decisions, reviews/DCA proposals and a dashboard.

Current actionability requires externally approved methodologies, source evidence and reconciliation; unavailable inputs fail closed. The 15%–20% CAGR objective is an investment target, not a guaranteed return.

This README combines the investment baseline and application guide. Investment rules remain subject to the authority hierarchy below; this merge does not approve or change any policy. The former `README_v1.0.md` content is incorporated here, with historical Milestone 1 metadata distinguished from current project status.

## Navigation

- [Current status and review evidence](#current-status-and-review-evidence)
- [Development and local setup](#development)
- [Configuration and diagnostics](#slice-3--configuration-and-safe-diagnostics)
- [Local persistence and backup](#slice-4--local-persistence)
- [Verification commands](#final-m62-verification)
- [Investment overview](#1-project-overview)
- [Approved policy documents](#3-approved-milestone-1-documents)
- [Document authority](#4-document-authority-hierarchy)
- [Stock-review workflow](#6-standard-stock-review-workflow)
- [Risk framework](#8-risk-framework-summary)
- [Roadmap](#16-roadmap)
- [How to use the investment framework](#17-how-to-use-this-project)

## Current status and review evidence

M1–M5 are approved documentation baselines. M6 provides the local application; its implementation and verification must be read within each report's supported scope. Historical progress entries describe their own dates, not necessarily the current state.

- M6.2: approved on 2026-09-10; [foundation final review](<docs/06_DASHBOARD/6.2 Project Foundation/M6_2_FINAL_REVIEW.md>).
- M6.3: implemented and verified within supported accounting scope; [remediation report](<docs/06_DASHBOARD/6.3 Portfolio & Transaction Engine/R2_REMEDIATION_REPORT.md>).
- M6.4–M6.7: implementation baseline used by the M6.8 integration gate.
- M6.8: ready for independent review within approved bounded scope; [final validation report](<docs/06_DASHBOARD/6.8 Integration & Validation/FINAL_VALIDATION_REPORT.md>) and [acceptance matrix](<docs/06_DASHBOARD/6.8 Integration & Validation/M6_ACCEPTANCE_MATRIX.md>).
- Broader M6: **PASS WITH LIMITATION**. Real-data operational acceptance: **BLOCKED / NOT VALIDATED**. Import, benchmark, historical analytics and corporate-action limitations are recorded in the acceptance matrix and [change requests](<docs/06_DASHBOARD/6.8 Integration & Validation/CHANGE_REQUESTS.md>).
- M7–M8: future roadmap; no M7 functionality is claimed.

The former Milestone 1 “start Milestone 2” next step is historical and has been replaced by this status. Continue with M6.8 independent review and its recorded operational prerequisites before treating the system as accepted for real-data operation.

## Development

Use Node **22.23.2** (`.nvmrc`) and pnpm **10.34.5**. Switch your Node version using your existing version manager before running commands; the system Node 22.12.0 observed during audit is below this project's supported runtime.

```sh
pnpm install --frozen-lockfile
pnpm db:generate
pnpm dev
```

Open http://127.0.0.1:3000. Both `dev` and `start` bind only to loopback. No secrets are needed. Optional server-only `LOG_LEVEL` is validated at startup; unset defaults to `info`. See `.env.example` and configuration below.

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:smoke
pnpm start
```

`test:unit` runs the component unit suite. `typecheck` generates Next route types before checking TypeScript, including on a clean checkout. `test:smoke` starts the real production build on a temporary loopback port, checks HTTP content and listener ownership, and cleans up its process. On macOS it uses `/usr/sbin/lsof`; support for other operating systems is not yet validated. Use `node scripts/smoke-app.mjs --dev` for the development boot check. Run boot checks sequentially, outside an existing build/dev process.

No remote fonts, provider APIs, AI, telemetry integration or market data are required by application code. Next's optional framework telemetry can be disabled with `NEXT_TELEMETRY_DISABLED=1` in your shell.

## Scope and quality

The application shell and module/clock/ID/registry contracts are implemented. Validation/errors/config/logging are included; SQLite/Prisma/migrations and methodology persistence are included; Playwright Chromium shell smoke is included. There are no reset or seed commands.

Lockfile and direct versions are pinned. Reviewed native build scripts are limited to sharp, unrs-resolver, better-sqlite3, @prisma/engines and prisma. No global runtime is installed by project scripts.

Ignore rules exclude secrets, local databases/sidecars and runtime import/export/backup directories while retaining fixtures and migrations. Do not add personal financial exports to source directories.

See [progress](docs/PROGRESS.md) and [Slice 1 review](<docs/06_DASHBOARD/6.2 Project Foundation/SLICE_1_REVIEW.md>). Each slice requires review before work proceeds to the next.

## Slice 2 — Module foundation

The shell now delegates to `src/ui/`. Pure methodology contracts live in `src/domain/`; read orchestration in `src/application/`; clock/ID/registry interfaces in `src/ports/`; native adapters in `src/infrastructure/`; nominal IDs/time representations in `src/shared/`. `app/server/runtime.ts` is the server-only composition root. Persistence is composed separately in `app/server/persistence.ts`; no registry write endpoint exists.

```sh
pnpm test:boundaries
```

`pnpm lint` also checks dependency directions and client transitive imports. `pnpm test` runs all unit/architecture suites; `pnpm test:unit` selects unit suites. Typecheck includes negative nominal-type/readonly contracts. See [boundary ADR](docs/adr/0001-module-boundaries.md) for rules, limitations and allowed extensions. Clock/ID fixtures are test-only; no production approval seed is supplied.


## Slice 3 — Configuration and safe diagnostics

Optional `LOG_LEVEL` accepts `debug`, `info`, `warn`, `error`, or `silent`. An empty/unknown value is invalid. Leave it unset for `info`, or set a value in your shell / local `.env.local`; never commit secret environment files. Restart the server after changing configuration. Optional server-only `DATABASE_URL` is also validated; no provider variables are required.

The Next startup hook validates config before readiness; request errors are logged with safe category/correlation metadata only. An invalid config can leave Next's process listening while requests fail: correct the setting and restart. No raw request/error/environment data is emitted by the application logger. This is basic operational logging, not investment audit history.

```sh
node scripts/smoke-app.mjs --invalid-config
node scripts/smoke-app.mjs --dev --invalid-config
```

Smoke subprocesses explicitly use info or a synthetic invalid value, without changing your shell environment. These checks prove startup validation and no config-canary leak. Next permits only one dev instance per workspace: run dev smoke in a separate checkout if your own dev server is running. The checks never stop that existing server.

Shared validation uses Zod; core modules remain independent of it. Public error mapping returns fixed messages; diagnostics redact by selecting known fields rather than serializing raw payloads. See [validation/diagnostics ADR](docs/adr/0002-validation-errors-config-logging.md) and [Slice 3 review](<docs/06_DASHBOARD/6.2 Project Foundation/SLICE_3_REVIEW.md>).

## Slice 4 — Local persistence

The shell does not open a database. When persistence is needed, explicitly initialize it:

```sh
pnpm db:validate
pnpm db:generate
pnpm db:migrate
pnpm db:status
pnpm test:integration
```

`db:migrate` applies committed migrations with Prisma migrate deploy; it creates the default private `data/vn30.sqlite` when absent. It preserves existing records and supplies no approval seed. Run migrations before calling `openPersistence()` and call its `close()` when finished. There is no automatic migration during application startup. Validate/generate/build do not create or open a database.

Unset `DATABASE_URL` uses that project-relative default, resolved to an absolute path. For an override, use `file:` followed by an absolute local path ending in `.sqlite`, `.sqlite3` or `.db`. The path is raw text (spaces allowed), not a percent-encoded URI; remote hosts, query strings and fragment markers are rejected. Keep the immediate parent directory owner-only (0700) and an existing DB owner-only (0600); public and .next locations, symlink files and hard-linked files are rejected. Scripts do not change existing permissions or truncate files. These filesystem checks are validated on macOS/POSIX.

Next and the DB wrapper read local `.env.local`; explicit shell variables take precedence. Never commit that file or a personal DB. Restart after config changes. Do not use reset/db push as an upgrade procedure. Local SQLite snapshot/restore commands and their safety limits are documented in [M6.8 backup operation](<docs/06_DASHBOARD/6.8 Integration & Validation/BACKUP_OPERATION.md>). They preserve source history and restore only to a separate candidate database.

Integration tests always allocate private temporary databases, override inherited DATABASE_URL, skip `.env.local`, migrate, disconnect and clean up. The numeric probe table exists only there. Exact decimals use validated strings persisted as SQLite TEXT, including values beyond JavaScript's safe integer range; no monetary rounding policy is introduced. The initial M6.2 production schema contained only methodology metadata and migration bookkeeping. Later M6 migrations add accounting and investment artifact persistence; see the current committed migrations and M6.8 acceptance matrix.

Prisma Client is generated inside infrastructure and ignored by Git/ESLint. Build, lint, typecheck and test commands generate it as needed. Security overrides pin Prisma's transitive deepmerge-ts 8.0.0 and mysql2 3.23.1; revisit when upstream adopts patched versions. See [persistence ADR](docs/adr/0003-sqlite-prisma-persistence.md) and [Slice 4 review](<docs/06_DASHBOARD/6.2 Project Foundation/SLICE_4_REVIEW.md>).

## Slice 5 — Deterministic foundation gate

Install the pinned browser once, then run the combined gate:

```sh
pnpm exec playwright install chromium
pnpm test:foundation
```

The combined gate runs unit/architecture/real SQLite tests, builds production, runs a real Chromium shell test and checks invalid startup configuration. `pnpm test:e2e` builds and runs only production/browser smoke. It allocates a temporary loopback port, starts its own server, verifies listener ownership and then passes that URL to Playwright. It never reuses your port-3000 server. Run build-based gates sequentially; use a separate checkout if your dev/build process writes the same Next output directory.

Chromium verifies the visible product heading and empty state, including after reload, and rejects external page requests and uncaught browser errors. Retries are disabled, timeouts bounded, and cleanup targets only test-owned process groups. Direct Playwright execution requires the harness-provided URL; use the package script. Traces on failure are local in ignored `test-results/`; they may contain page content and are not automatically published.

Vitest runs in UTC, and browser context uses UTC/vi-VN. Existing fixed clock and sequence ID doubles remain test-only. The integration isolation test uses two independent databases, verifies records cannot cross between them, and checks independent cleanup. `test:unit`, `test:integration` and `test:boundaries` remain separate selectors. The browser gate now includes controlled dashboard, historical proposal/review inspection, explicit contribution confirmation, desktop/mobile and keyboard coverage. Formal authority-chain proof uses disposable application integration tests; real-data operational acceptance and additional browser/platform coverage remain unverified.

## Final M6.2 verification

The six foundation slices are implemented; M6.2 was explicitly approved by the user on 2026-09-10. See [final review and evidence](<docs/06_DASHBOARD/6.2 Project Foundation/M6_2_FINAL_REVIEW.md>). M6.3 implementation and verification are complete within its supported accounting scope; see [independent-review remediation report](<docs/06_DASHBOARD/6.3 Portfolio & Transaction Engine/R2_REMEDIATION_REPORT.md>). Unsupported policy cases remain explicitly blocked by CR. M6.4–M6.7 are the approved implementation baseline for the M6.8 integration gate; their current reports and the M6.8 acceptance matrix state the supported scope.

For a full local verification after selecting the pinned runtime and installing dependencies/browser:

```sh
pnpm db:validate
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm test:integration
pnpm test:boundaries
pnpm test:foundation
pnpm audit
```

The integrated gate includes production build and browser/startup checks. No personal database or live provider is needed. Use a fresh checkout with its own frozen dependency installation for clean-build evidence; Turbopack rejects a node_modules symlink pointing outside its project root. Numbered duplicate files in generated .next/types can cause duplicate-declaration errors; do not run concurrent build/dev writers in that checkout. Preserve user source and diagnose generated cache separately rather than suppressing TypeScript errors.

## M6.8 integration and validation

`pnpm test:m68` exercises the formal authority chain, immutable history, input tampering and disposable backup/restore. `node scripts/validate-m68.mjs` runs the complete requested command sequence using its own disposable database, overrides inherited data/source paths, and records exit codes/counts under the M6.8 validation directory. Use Node 22.23.2 and allow the local loopback listener required by E2E. It never targets actual portfolio data.

The final report and acceptance matrix distinguish tested architecture/implementation from real-data operational readiness and preserve accepted import/benchmark/history/corporate-action limitations. Milestone 7 is outside this work.

---

## 1. Project Overview

VN30 Value Investing OS is a long-term portfolio-management system for investing only in VN30 constituents using a disciplined Value Investing framework.

The system is designed to support:

- long-term holding periods of 5–10 years or longer;
- a target portfolio total-return CAGR of approximately 15%–20% over a full investment cycle;
- no margin or leverage;
- selective DCA rather than forced monthly deployment;
- portfolio-level drawdown discipline;
- thesis-driven adding rather than mechanical averaging down;
- sector-aware analysis across banks, real estate, retail, technology, and other VN30 industries;
- explicit separation between business quality, intrinsic value, market price, risk, and portfolio action.

The system is intended to operate as an **AI Portfolio Manager** with CIO, Portfolio Manager, Equity Research, Risk Management, and Investment System Architecture responsibilities.

---

## 2. Milestone 1 Objective

Milestone 1 establishes the **Investment Constitution** of the project.

It defines the rules that future portfolio data models, scoring engines, dashboards, workflows, and automation must obey.

Milestone 1 is complete only when the following baseline documents are internally consistent and approved:

- `INVESTMENT_POLICY.md`
- `DECISION_FRAMEWORK.md`
- `RISK_POLICY.md`
- `SCORING_MODEL.md`
- `SYSTEM_PROMPT.md`
- `README.md`

No future milestone may silently weaken these rules.

---

## 3. Approved Milestone 1 Documents

### [INVESTMENT_POLICY.md](<docs/01 SYSTEM/INVESTMENT_POLICY.md>) — v1.1

Defines the highest-level investment philosophy and constitutional rules.

Key responsibilities:

- VN30-only mandate;
- long-term Value Investing objective;
- return target;
- capital-preservation hierarchy;
- no margin;
- optional DCA;
- cash discipline;
- long holding horizon;
- thesis-based adding;
- no mechanical profit-taking;
- behavioral discipline;
- document authority.

### [RISK_POLICY.md](<docs/01 SYSTEM/RISK_POLICY_v1.0.md>) — v1.0

Defines the authoritative risk boundaries and escalation rules.

Key responsibilities:

- drawdown rules;
- single-name concentration;
- sector concentration;
- small-NAV / board-lot exceptions;
- cash / liquidity discipline;
- residual-risk taxonomy;
- hard vetoes;
- STOP-BUY rules;
- mandatory thesis-review triggers;
- forward-return hurdles;
- exception governance.

### [DECISION_FRAMEWORK.md](<docs/01 SYSTEM/DECISION_FRAMEWORK_v1.0.md>) — v1.0

Defines how a real stock decision is made.

Required flow:

> Stage 0\
> → Business Quality\
> → Financial Health\
> → Growth Quality\
> → Industry & Competitive Position\
> → Valuation & Forward Return\
> → Full Risk Analysis\
> → Market / Money Flow\
> → Technical Entry\
> → Portfolio Impact\
> → Opportunity Cost\
> → Final Decision

Final Decision States:

- STRONG BUY
- BUY
- ACCUMULATE
- HOLD
- REDUCE
- SELL
- AVOID

The framework also defines:

- ownership-aware state semantics;
- execution sub-status;
- Provisional HOLD;
- Stage 0 outcomes;
- actionable-state requirements;
- residual-thesis logic;
- switching hurdle;
- final decision record.

### [SCORING_MODEL.md](<docs/01 SYSTEM/SCORING_MODEL_v1.0.md>) — v1.0

Defines the 100-point cross-sector scoring model.

Weights:

| Category | Weight |
|---|---:|
| Business Quality | 25 |
| Financial Health | 15 |
| Growth Quality | 15 |
| Industry & Competitive Position | 10 |
| Valuation & Forward Return | 20 |
| Risk & Governance | 10 |
| Capital Allocation Quality | 5 |
| **Total** | **100** |

The score is decision support only.

It cannot override:

- Stage 0;
- Risk Policy;
- portfolio constraints;
- ownership state;
- final qualitative judgment.

The model includes sector-aware rules for banks, property, retail, technology, and other sectors through principle-equivalent metrics.

### [SYSTEM_PROMPT.md](<docs/01 SYSTEM/SYSTEM_PROMPT_v1.0.md>) — v1.0

Operational synthesis used by the AI Portfolio Manager.

It converts the approved source documents into an executable operating instruction set.

The System Prompt does not create independent investment authority.

If it conflicts with another approved document, the higher-authority source document wins.

---

## 4. Document Authority Hierarchy

When rules conflict, apply this hierarchy:

1. `INVESTMENT_POLICY.md`
2. `RISK_POLICY.md`
3. `DECISION_FRAMEWORK.md`
4. `SCORING_MODEL.md`
5. `SYSTEM_PROMPT.md`
6. Implementation workflows / dashboards / automation

A lower-level document may operationalize a higher-level rule, but may not silently override it.

Any material change to a higher-level document requires review of all dependent documents.

---

## 5. Core Investment Principles

The system must always preserve the following:

### Business before price

A low P/E, low P/B, or falling share price does not mean a stock is cheap.

### Risk before return optimization

The hierarchy is:

1. mandate compliance;
2. avoid unacceptable permanent capital loss;
3. preserve portfolio resilience and liquidity;
4. optimize long-term forward return.

### No leverage

If cash is insufficient:

> wait.

### DCA is optional

Monthly contributions are capital inflow, not a requirement to buy.

### No mechanical averaging down

Every add requires fresh underwriting.

### No mechanical profit-taking

A 20% gain triggers review, not SELL.

### Forward return matters more than historical P/L

The system asks:

> Is continued ownership attractive from today's price?

not:

> How much profit or loss is currently showing?

---

## 6. Standard Stock-Review Workflow

### Step 0 — Eligibility / Investability / Veto

Determine:

- current VN30 eligibility;
- basic business viability;
- minimum financial health;
- governance/reporting reliability;
- evidence sufficiency;
- Risk Policy veto status.

Produce one Composite Stage 0 Outcome.

### Step 1 — Business Quality

Evaluate:

- economics;
- moat;
- earnings quality;
- resilience.

### Step 2 — Financial Health

Evaluate:

- balance sheet;
- liquidity;
- funding;
- stress survivability.

### Step 3 — Growth Quality

Evaluate:

- historical growth;
- forward runway;
- incremental returns.

### Step 4 — Industry

Evaluate:

- industry structure;
- competitive position;
- cycle position.

### Step 5 — Valuation

Estimate:

- intrinsic-value range;
- expected 5-year annualized total return;
- downside case;
- margin of safety.

### Step 6 — Risk

Classify residual risk:

- LOW
- MODERATE
- ELEVATED
- HIGH
- UNACCEPTABLE

### Step 7 — Market / Money Flow

Use only as secondary context.

### Step 8 — Technical Entry

Use only for execution timing and staging.

### Step 9 — Portfolio Impact

Check:

- current position size;
- sector exposure;
- cash;
- drawdown;
- concentration;
- STOP-BUY conditions.

### Step 10 — Opportunity Cost

Compare:

- new cash alternatives;
- existing holdings;
- switching hurdle;
- cash.

### Step 11 — Final Decision

Assign exactly one Decision State and an execution plan.

---

## 7. Decision-State Semantics

### STRONG BUY

Rare, exceptional opportunity with high confidence, acceptable portfolio capacity, strong score, and LOW/MODERATE residual risk.

For an owned stock:

> exceptional add-capital state above ACCUMULATE.

### BUY

Unowned security only.

Means:

> initiate a position.

### ACCUMULATE

Owned security only.

Means:

> add capital after fresh underwriting.

### HOLD

Owned security only.

Means:

> continued ownership remains justified.

### REDUCE

Means:

> smaller position is preferable but residual ownership thesis remains defensible.

### SELL

Means:

> zero position is preferable or policy requires exit.

### AVOID

Unowned security only.

Always state the reason.

---

## 8. Risk Framework Summary

### Drawdown

Cash-flow-adjusted portfolio drawdown bands:

- NORMAL: `DD > -10%`
- WATCH: `-15% < DD ≤ -10%`
- ELEVATED: `-20% < DD ≤ -15%`
- CRITICAL: `-25% < DD ≤ -20%`
- SEVERE: `DD ≤ -25%`

The 20% level is an escalation threshold, not an automatic stop-loss.

### Single-name concentration

Normal strategic framework:

- ≤10% NAV: normal
- >10–15%: elevated
- >15%: normally no-add
- 20%: strategic ceiling under normal conditions

Small-NAV board-lot exception:

- requires explicit user approval;
- absolute emergency ceiling = 30% NAV.

### Sector concentration

Provisional framework:

- ≤25%: normal
- >25–30%: elevated
- >30–35%: high
- >35–40%: mandatory review
- 40%: provisional sector ceiling

Sector parameters are subject to later empirical calibration.

---

## 9. Return Hurdles

Expected 5-year annualized total return:

- **15%+**: normal BUY hurdle
- **12%–15%**: exceptional zone only
- **<12%**: normally insufficient for new capital

Lower-quality or higher-risk companies require higher hurdles.

A BUY below 15% must be explicitly flagged:

> `Hurdle Exception = YES`

---

## 10. Scoring and Ranking

The scoring system ranks the opportunity set but does not mechanically determine portfolio action.

Only:

> `Score Validity Status = VALID — ACTIONABLE`

may enter the investable Top-10.

Other statuses:

- VALID — NON-ACTIONABLE
- RESEARCH ONLY
- NOT RELIABLY SCORABLE

Differences of 1–2 points are normally treated as effectively tied.

Do not rotate holdings merely because another stock scores slightly higher.

---

## 11. Data and Evidence Requirements

For every real market decision:

- use latest authoritative data;
- record analysis date;
- record market-price date;
- record financial reporting period;
- distinguish Fact / Estimate / Assumption;
- record Analysis Data Status;
- flag stale or conflicting data;
- do not invent missing information.

If decision-critical data is unavailable:

> do not manufacture an actionable investment decision.

---

## 12. Portfolio Context Requirements

An actionable portfolio decision requires sufficient current information, including where applicable:

- portfolio NAV;
- available cash;
- ownership status;
- position size;
- sector exposure;
- drawdown status;
- STOP-BUY status;
- risk exceptions;
- concentration constraints.

If portfolio context is insufficient:

- complete research where possible;
- do not guess;
- classify the result as non-actionable or pending;
- use ownership-consistent defensive state logic from the Decision Framework.

---

## 13. Risk Exceptions

The AI may recommend an exception.

The AI may **not** self-approve one.

A policy exception requires:

1. CIO/Risk recommendation;
2. explicit user approval;
3. documented rationale;
4. exposure limit;
5. risk analysis;
6. expiry / review trigger;
7. normalization / exit plan.

No approval may be inferred from silence.

---

## 14. Target Operating Workflow

The cadence below is the operating model derived from Milestone 1. Detailed workflow mechanics, ownership, checklists, and automation are defined in the Milestone 5 baseline; application support is bounded by the M6 acceptance matrix linked above.


### Weekly / event-driven research

Use when:

- material company news appears;
- new financial reports are published;
- thesis trigger occurs;
- valuation changes materially;
- price-decline review threshold is reached.

### Monthly capital allocation

When DCA cash arrives:

1. update portfolio data;
2. update VN30 opportunity ranking where necessary;
3. review STOP-BUY conditions;
4. review cash / concentration / drawdown;
5. identify the best eligible use of new capital;
6. deploy only when return/risk requirements are met;
7. otherwise retain cash.

### Quarterly review

Review:

- all holdings;
- thesis status;
- valuation;
- risk;
- concentration;
- sector exposure;
- portfolio drawdown;
- score changes;
- cash;
- opportunity cost.

### Annual review

Review:

- Investment Policy effectiveness;
- scoring calibration;
- realized decision quality;
- behavioral mistakes;
- benchmark comparison;
- risk-rule effectiveness.

Material policy changes require versioned document updates.

---

## 15. Project Lifecycle

Every milestone follows:

> Requirement Analysis\
> → Architecture / Framework Design\
> → Implementation Plan\
> → Implementation\
> → Validation\
> → Review\
> → Documentation Update\
> → Next Milestone

Do not work on multiple major milestones simultaneously unless explicitly requested.

---

## 16. Roadmap

### Milestone 1 — Investment Constitution

Status:

> **Complete — final cross-document review passed with 0 Critical and 0 Major issues**

Deliverables:

- Investment Policy
- Decision Framework
- Risk Policy
- Scoring Model
- System Prompt
- README

### Milestone 2 — Portfolio Data Model

Status: approved documentation baseline.

Design:

- Portfolio
- Cash
- Transactions
- Dividends
- VN30 Master
- Sector
- Benchmark
- NAV
- Cost basis
- risk / review status fields required by Milestone 1

### Milestone 3 — VN30 Scoring Engine

Status: approved documentation baseline; application implementation is covered by M6.4.

Implement:

- normalized metrics;
- sector-specific scoring;
- full VN30 ranking;
- Top-10 opportunity list;
- score calibration.

### Milestone 4 — Buy / Hold / Sell Engine

Status: approved documentation baseline; application implementation is covered by M6.5.

Implement:

- DCA logic;
- entry;
- add;
- hold;
- reduce;
- exit;
- execution workflow.

### Milestone 5 — Portfolio Management Workflow

Status: approved documentation baseline; application implementation is covered by M6.6.

Implement:

- weekly review;
- monthly allocation review;
- quarterly portfolio review;
- annual system review.

### Milestone 6 — Dashboard & Automation

Implement portfolio-management application and operational automation. M6.2 is approved; M6.3 accounting is implemented and verified; M6.4–M6.7 are the implementation baseline for M6.8. M6.8 is ready for independent review within its bounded scope. Broader M6 remains PASS WITH LIMITATION; real-data operational acceptance is BLOCKED / NOT VALIDATED.

### Milestone 7 — Validation

Status: outside the current implemented scope.

Perform:

- historical logic review;
- backtest where appropriate;
- paper portfolio testing;
- decision-quality validation.

### Milestone 8 — Continuous Improvement

Status: future roadmap.

Use real outcomes and decision-journal evidence to improve the system.

---

## 17. How to Use This Project

### Analyze one VN30 stock

Provide:

- ticker;
- current portfolio ownership if known;
- current position size if owned;
- portfolio NAV / cash if an actionable allocation decision is required.

The AI should run the approved Decision Framework.

### Rank the VN30

Request:

> Rank the current VN30 using the approved Scoring Model and Risk Policy.

The AI should use comparable data cut-offs and separate:

- investable Top-10;
- constrained/watch candidates;
- research-only / insufficient-data cases.

### Review a DCA decision

Provide:

- available new cash;
- current holdings;
- position sizes;
- portfolio NAV;
- relevant recent trades.

The AI should determine whether deployment is justified or cash should remain uninvested.

### Review an existing holding

The AI should assess:

- thesis status;
- current valuation;
- expected forward return;
- residual risk;
- portfolio concentration;
- opportunity cost;

then return exactly one formal Decision State.

---

## 18. Milestone 1 Completion Criteria

Milestone 1 may be declared complete only if:

- all constitution documents are approved;
- no Critical cross-document conflict remains;
- no Major cross-document conflict remains;
- document authority is unambiguous;
- Decision States are consistent across files;
- hard vetoes are owned by Risk Policy;
- scoring cannot override policy;
- exception governance requires explicit user approval;
- data and portfolio-context requirements are auditable;
- downstream Milestone 2 requirements can be derived from the constitution.

---

## 19. Approved Milestone 1 Baseline

Historical baseline: version 1.0, dated 2026-09-04, Milestone 1 complete. Versions below refer to that approved baseline, not a new policy revision from this README merge.

Approved baseline at Milestone 1 completion review:

- `INVESTMENT_POLICY.md` v1.1
- `RISK_POLICY.md` v1.0
- `DECISION_FRAMEWORK.md` v1.0
- `SCORING_MODEL.md` v1.0
- `SYSTEM_PROMPT.md` v1.0
- `README.md` v1.0

---

### Historical documentation note

The Milestone 1 README recorded a Minor issue in `DECISION_FRAMEWORK.md` v1.0: a legacy sentence kept possible hard-veto issues pending until Risk Policy approval, although Risk Policy v1.0 was already approved. That historical note did not block M2 or change decision logic. Consult the source document and its review history for the current disposition.
