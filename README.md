# VN30 Value Investing OS

VVIOS là hệ thống hỗ trợ quản lý danh mục đầu tư giá trị dài hạn trong VN30. Project kết hợp bộ nguyên tắc đầu tư M1–M5 với ứng dụng local: sổ giao dịch bất biến, tái dựng danh mục, scoring/ranking, quyết định đầu tư, review/DCA và dashboard có truy xuất bằng chứng.

**Trạng thái ngày 2026-10-07:** đã có implementation M6 và bộ tài liệu validation/production readiness M7–M8. Production acceptance vẫn **NO-GO — EVIDENCE PENDING**. Hệ thống tiếp tục phục vụ nghiên cứu, phát triển và validation; chưa được chứng nhận cho real-money decision support. Mục tiêu CAGR 15%–20% là mục tiêu đầu tư, không phải kết quả đã chứng minh.

Hệ thống phân tích, đề xuất và giải thích; người dùng review, phê duyệt hoặc từ chối và thực hiện giao dịch thủ công. Recommendation, approval và giao dịch thực tế được quản lý riêng.

## Navigation

- [Current status and review evidence](#current-status-and-review-evidence)
- [Implemented capabilities](#implemented-capabilities)
- [Architecture and repository map](#architecture-and-repository-map)
- [Development](#development)
- [Configuration and local data](#configuration-and-local-data)
- [Local persistence and backup](#local-persistence-and-backup)
- [Verification commands](#verification-commands)
- [Release identity and freeze status](#release-identity-and-freeze-status)
- [Investment overview](#1-project-overview)
- [Approved policy documents](#3-approved-milestone-1-documents)
- [Document authority](#4-document-authority-hierarchy)
- [Stock-review workflow](#6-standard-stock-review-workflow)
- [Risk framework](#8-risk-framework-summary)
- [Roadmap](#16-roadmap)
- [How to use the investment framework](#17-how-to-use-this-project)

## Current status and review evidence

| Milestone | Nội dung và trạng thái | Tài liệu tham chiếu |
|---|---|---|
| M1–M5 | Baseline tài liệu về constitution, data model, scoring, decision và portfolio workflow | [M1](<docs/01 SYSTEM/>), [M2](<docs/02 DATABASE/>), [M3](<docs/03 SCORING/>), [M4](docs/04_DECISION_ENGINE/), [M5](docs/05_PORTFOLIO_WORKFLOW/) |
| M6.1–M6.3 | Requirements/architecture, foundation và accounting implementation trong phạm vi được hỗ trợ | [Architecture](<docs/06_DASHBOARD/6.1 Requirements & Architecture/ARCHITECTURE_v1.0.md>), [foundation review](<docs/06_DASHBOARD/6.2 Project Foundation/M6_2_FINAL_REVIEW.md>), [accounting remediation](<docs/06_DASHBOARD/6.3 Portfolio & Transaction Engine/R2_REMEDIATION_REPORT.md>) |
| M6.4–M6.6.1 | Scoring/ranking, decision, portfolio review/DCA và marginal allocation | [Scoring](<docs/06_DASHBOARD/6.4 Scoring & Ranking/IMPLEMENTATION_REPORT.md>), [decision](<docs/06_DASHBOARD/6.5 Decision Engine/IMPLEMENTATION_REPORT.md>), [workflow](<docs/06_DASHBOARD/6.6 DCA & Portfolio Workflow/IMPLEMENTATION_REPORT.md>), [marginal allocation](<docs/06_DASHBOARD/6.6.1 Marginal Allocation Remediation/IMPLEMENTATION_REPORT.md>) |
| M6.7–M6.8 | Dashboard, current read model, integration/hardening; broader M6 **PASS WITH LIMITATION**, real-data operational acceptance **BLOCKED / NOT VALIDATED** | [UI](<docs/06_DASHBOARD/6.7 Dashboard UI/IMPLEMENTATION_REPORT.md>), [current data](<docs/06_DASHBOARD/6.7.1 Current Read Model/IMPLEMENTATION_REPORT.md>), [M6 final validation](<docs/06_DASHBOARD/6.8 Integration & Validation/FINAL_VALIDATION_REPORT.md>), [acceptance matrix](<docs/06_DASHBOARD/6.8 Integration & Validation/M6_ACCEPTANCE_MATRIX.md>) |
| M7 | Validation specifications và final report đã có; independent deterministic evidence chưa đóng đủ gate, historical validation **BLOCKED / NOT EXECUTED**, paper/forward observations chưa tích lũy | [M7 final report](docs/07_VALIDATION/FINAL_VALIDATION_REPORT.md), [model limitations](docs/07_VALIDATION/MODEL_LIMITATIONS.md) |
| M8 | Production/onboarding specifications đã có; acceptance document là approval candidate, live gates còn pending/not executed; **NO-GO** | [Production acceptance](docs/08_CONTINUOUS_IMPROVEMENT/PRODUCTION_ACCEPTANCE.md), [operational runbook](docs/08_CONTINUOUS_IMPROVEMENT/OPERATIONAL_RUNBOOK.md) |

Tên commit “Complete M7/M8” ghi nhận deliverable trong Git; trạng thái acceptance được xác định theo evidence và sign-off trong tài liệu. [PROGRESS.md](docs/PROGRESS.md) giữ lịch sử đến M6.3; các entry cũ không mô tả trạng thái hiện tại của toàn project. Một số tài liệu còn logical path hoặc metadata lịch sử; dùng đường dẫn vật lý trong bảng trên và đọc cả verdict cuối cùng.

## Implemented capabilities

| Module | Chức năng hiện có |
|---|---|
| Portfolio/accounting | Immutable transaction/leg ledger; cash/quantity/cost basis, MWAC, realized P&L, valuation, reconciliation và tái dựng theo as-of; các trường hợp policy không được hỗ trợ bị chặn |
| Methodology | Registry có version, approval/effective identity và kiểm tra lineage; không cung cấp production approval seed |
| Scoring/ranking | Evidence/metric validation, sector methodology, scorecard, confidence/eligibility, ranking và Top 10; Top 10 không tự tạo quyền BUY |
| Decision | Decision states, valuation/return hurdle, risk, portfolio impact, sizing và opportunity cost với reference/approval gates |
| Review/DCA | Weekly, monthly DCA, quarterly, annual, event-driven review; proposal, marginal reassessment theo từng lot, HOLD CASH, human outcome và follow-up audit |
| Current data | Dataset local do server đọc; kiểm tra schema, portfolio identity, freshness, reconciliation và current actionability; không dùng synthetic fallback khi thiếu dữ liệu |
| Dashboard | Overview/holdings/risk/performance; VN30/ranking/decisions/DCA; transactions/reviews/journal; imports/data/audit/settings và artifact details |
| Operations | Boundary checks, safe logging, local SQLite migration, snapshot/restore với checksum và kiểm tra schema/migration/artifact integrity |

Trang `/transactions/new` cung cấp manual transaction flow có xác nhận; `/reviews/new` khởi tạo review theo dữ liệu server. Khả năng có route không đồng nghĩa mọi loại giao dịch, import hoặc analytics đều operationally accepted. Các giới hạn import, benchmark, historical analytics, corporate action, security/platform và UX được ghi trong [M6 acceptance matrix](<docs/06_DASHBOARD/6.8 Integration & Validation/M6_ACCEPTANCE_MATRIX.md>) và [change requests](<docs/06_DASHBOARD/6.8 Integration & Validation/CHANGE_REQUESTS.md>).

## Architecture and repository map

Ứng dụng dùng Next.js **16.3.4**, React **19.3.0**, TypeScript **6.0.3**, Prisma **7.10.0** và SQLite qua `better-sqlite3`. Financial decimals được biểu diễn bằng validated strings và lưu bằng SQLite TEXT để giữ precision. Domain không phụ thuộc UI hoặc persistence; server composition nối application services với các adapter.

| Đường dẫn | Vai trò |
|---|---|
| `app/` | App Router pages, error/loading UI và server actions/composition |
| `src/domain/` | Portfolio, methodology, scoring/ranking, decision và workflow rules |
| `src/application/` | Use cases, current read/review initiation và dashboard models |
| `src/ports/` | Contracts cho storage, runtime và các service dependencies |
| `src/infrastructure/` | SQLite/Prisma, repositories, current-source reader, config và logging |
| `src/shared/`, `src/ui/` | IDs/time/errors/validation và dashboard/forms/evidence UI |
| `prisma/` | Schema và 9 committed migrations; generated client nằm trong infrastructure, được Git ignore |
| `tests/` | Unit, integration, architecture và E2E suites |
| `scripts/` | Database, backup/restore, smoke, boundary và M6.8 validation harness |
| `docs/` | M1–M8 specifications, reviews, validation evidence, release manifest và [ADRs](docs/adr/) |

Trước khi sửa Next.js code, đọc guide phù hợp trong `node_modules/next/dist/docs/` theo [AGENTS.md](AGENTS.md). Project kiểm tra dependency direction và client transitive imports qua `scripts/check-boundaries.mjs`.

## Development

Chọn Node **22.23.2** theo `.nvmrc` bằng version manager đang dùng; `package.json` yêu cầu `>=22.23.2 <23`. Dùng pnpm **10.34.5**. Node local `22.12.0` được quan sát khi kiểm tra manifest không đạt yêu cầu.

```sh
pnpm install --frozen-lockfile
pnpm db:generate
pnpm dev
```

Mở http://127.0.0.1:3000. `dev` và `start` bind loopback. Có thể xem empty state khi chưa có database; app không tự seed danh mục hoặc approved methodology. Để dùng persistence, chạy migration riêng theo phần dưới. Không cần provider key hoặc broker credential.

```sh
pnpm build
pnpm start
```

Lockfile/direct dependencies được pin. Native build scripts được cho phép trong `package.json`; project scripts không cài global runtime. Application code không cần remote fonts, market provider API hoặc AI API để khởi động. Có thể đặt `NEXT_TELEMETRY_DISABLED=1` trong shell để tắt Next telemetry.

## Configuration and local data

Xem [.env.example](.env.example). Next và database wrapper đọc `.env.local`; shell variables đã đặt có precedence. Restart server sau khi thay đổi cấu hình.

| Biến | Giá trị / hành vi |
|---|---|
| `LOG_LEVEL` | Optional: `debug`, `info`, `warn`, `error`, `silent`; default `info`; giá trị rỗng/không hợp lệ bị từ chối |
| `DATABASE_URL` | Optional: default `data/vn30.sqlite`; override bằng `file:` + absolute private local path có đuôi `.sqlite`, `.sqlite3` hoặc `.db` |
| `VN30_CURRENT_SOURCE_FILE` | Optional: absolute path đến normalized current-source JSON; server đọc tối đa 4 MB và kiểm tra portfolio identity/schema |
| `VN30_BROKER_SNAPSHOT_FILE` | Optional: absolute private path đến snapshot broker với holdings/cash riêng ngày; hiển thị trong dashboard/holdings/data/imports, không cấp quyền giao dịch |

Current-source contract ở [current-source.ts](src/shared/validation/current-source.ts), gồm version/scope/as-of, ledger watermark, prices, reference intervals, reconciliation và analyst evidence. `FORMAL` và `SYNTHETIC_TEST` là scope riêng. Thiếu, invalid hoặc stale evidence có thể làm current actionability bị chặn dù historical artifact vẫn xem được. Methodology approval và production data readiness vẫn là prerequisite bên ngoài.

Logging chọn safe category/correlation fields; không serialize raw payload/environment. Đây là operational diagnostics, còn investment audit được quản lý trong persisted artifacts. Không commit `.env.local`, live DB, current-source dataset cá nhân hoặc financial exports; ignore rules loại runtime data/import/export/backup directories khỏi Git.

## Local persistence and backup

```sh
pnpm db:validate
pnpm db:generate
pnpm db:migrate
pnpm db:status
```

`db:migrate` dùng Prisma migrate deploy để áp dụng committed migrations, tạo private default DB nếu chưa có. App startup không tự migrate. Dashboard đọc database hiện có; nếu chưa có DB trả empty state, nếu không đọc được trả trạng thái blocked. Generate/build không tạo portfolio database. Không có reset hoặc seed command.

Override DB path dùng raw absolute path, không phải percent-encoded URI; remote host, query/fragment, public/build locations, symlink và hardlink bị từ chối. Immediate parent phải owner-only `0700`, file DB hiện có `0600`. Scripts không tự sửa permission của dữ liệu hiện có. Filesystem controls được kiểm tra trên macOS/POSIX. Integration tests dùng private disposable DB và không dựa vào `.env.local` hay personal database.

Backup và restore cần absolute private paths. Ví dụ, thay đường dẫn bên dưới bằng thư mục private của bạn:

```sh
pnpm db:backup /absolute/private/backups/vvios-snapshot.sqlite
pnpm db:restore /absolute/private/backups/vvios-snapshot.sqlite /absolute/private/restore/vvios-candidate.sqlite
```

Backup dùng SQLite `VACUUM INTO`, tạo sidecar manifest/checksum và từ chối ghi đè target. Restore kiểm tra snapshot và tạo **candidate DB riêng**; không tự kích hoạt. Phải kiểm tra current source, reconstruct/reconcile và cấu hình `DATABASE_URL` rõ ràng trước khi dùng candidate. Xem [backup operation](<docs/06_DASHBOARD/6.8 Integration & Validation/BACKUP_OPERATION.md>) và [M8 recovery requirements](docs/08_CONTINUOUS_IMPROVEMENT/BACKUP_RECOVERY.md). Local technical checks chưa thay thế production restore-drill acceptance.

## Verification commands

Chạy các gate ghi `.next` tuần tự trong checkout không có dev/build writer đồng thời. E2E dùng own temporary loopback server; trên macOS smoke harness cần `/usr/sbin/lsof`. Các platform khác chưa được xác nhận đầy đủ.

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm db:validate
pnpm build
pnpm test:smoke
pnpm exec playwright install chromium
pnpm test:e2e
```

| Command | Phạm vi |
|---|---|
| `pnpm test:unit`, `pnpm test:integration`, `pnpm test:boundaries` | Unit / disposable SQLite integration / architecture contracts |
| `pnpm test:portfolio`, `pnpm test:scoring`, `pnpm test:decision` | Accounting, analytical artifacts và decision/marginal logic |
| `pnpm test:workflow`, `pnpm test:dca` | Review, allocation và cash outcomes |
| `pnpm test:ui`, `pnpm test:current` | Dashboard UI và current data/actionability |
| `pnpm test:m68` | Authority chain, immutable history, adversarial inputs và backup/restore |
| `pnpm test:foundation` | Full tests + production/browser smoke + invalid configuration |
| `node scripts/smoke-app.mjs --dev` | Development boot smoke |
| `node scripts/smoke-app.mjs --invalid-config` | Production startup config rejection; cần build trước |
| `pnpm audit` | Dependency audit tại thời điểm chạy |

`typecheck` generate Next route types trước `tsc`; lint/typecheck/test/build generate Prisma Client khi cần. Vitest chạy UTC; browser context dùng UTC/vi-VN. `node scripts/validate-m68.mjs` chạy M6.8 sequential harness bằng disposable data/source paths và ghi evidence trong thư mục M6.8; đọc script trước khi chạy vì sẽ tạo/cập nhật evidence files.

M6.8 final report ghi full suite **761 tests**, E2E **10 tests**, lint/typecheck/build và các final gate PASS trong lần validation được lưu. Focused suites có overlap nên không cộng counts. Đây là historical evidence của M6.8, không phải kết quả test mới cho README này hoặc chứng nhận exact release build. M7 vẫn cần independent Expected-vs-Actual/oracle evidence, historical point-in-time validation và các acceptance gate riêng.

## Release identity and freeze status

[VVIOS v1.0 Release Manifest](docs/08_CONTINUOUS_IMPROVEMENT/release-manifest-v1.0/README.md) pin source commit:

```text
14aa8b2b1052ffb297edadd298ce90c0fb246779
```

Manifest gồm Git tree/SHA, inventory **758 artifacts** với size/SHA-256, **11 schema/migration artifacts**, package/build source identity và freeze status. Release target `VVIOS v1.0` khác package version `0.1.0`. Các commit chứa manifest hoặc cập nhật README về sau không thay thế source SHA đã pin.

```sh
python3 docs/08_CONTINUOUS_IMPROVEMENT/release-manifest-v1.0/verify.py
```

**Source identity/hashes: verified. Production release: NOT FROZEN / NOT AUTHORIZED.** Compiled build provenance/output hashes, live applied schema, production configuration, active policy/model approvals, còn thiếu M7/M8 evidence và reviewer/final approval vẫn pending. Checksum xác minh consistency, không phải digital signature hay approval. Giữ nguyên **NO-GO — EVIDENCE PENDING** theo [production acceptance](docs/08_CONTINUOUS_IMPROVEMENT/PRODUCTION_ACCEPTANCE.md).

Phần dưới giữ bản tóm tắt investment framework từng được hợp nhất từ `README_v1.0.md`. Tài liệu policy gốc và authority hierarchy quyết định quy tắc; README không phê duyệt hoặc thay đổi baseline.

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

Validation specifications and the final report are present in `docs/07_VALIDATION/`. Independent executable/oracle evidence remains incomplete; historical validation is BLOCKED / NOT EXECUTED, paper/forward observations have not accumulated, and real-data operational acceptance is unvalidated. The final report prohibits release as validated for real-money decision support. Prior M6 tests are supporting evidence.

### Milestone 8 — Production Readiness & Live Portfolio Onboarding

Production/onboarding specifications are present in `docs/08_CONTINUOUS_IMPROVEMENT/`, covering import, reconciliation, initial snapshot/data/scoring/review/DCA, backup/recovery and operational runbook. Production acceptance remains an approval candidate with NO-GO — EVIDENCE PENDING. The exact-commit release manifest verifies source identity; compiled build, runtime, live onboarding evidence and final sign-offs remain pending. Continuous improvement must follow controlled validation and change approval.

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
