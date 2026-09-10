# M6.2 — Implementation Slice Plan

Cập nhật: 2026-09-10. **Reconciled with approved baseline — ready for Slice 1 handoff; chưa implementation/approval.**

Đầu vào: [Repository audit](REPOSITORY_AUDIT.md). Plan này là tài liệu implementation mới, không thay thế `docs/06_DASHBOARD/6.1 Requirements & Architecture/IMPLEMENTATION_PLAN.md` đã approve, hiện có tại `docs/06_DASHBOARD/6.1 Requirements & Architecture/IMPLEMENTATION_PLAN_v1.0.md`. Test strategy: `docs/06_DASHBOARD/6.1 Requirements & Architecture/TEST_STRATEGY_v1.0.md`.

## Entry gate

1. CR-01/CR-02 đã resolve ngày 2026-09-10: đọc đầy đủ hai artifact approved và đối chiếu §3/§12 Implementation Plan, §12/§28–29/§31/§36/§39–42 Test Strategy. Đọc lại source áp dụng trước từng slice.
2. Nếu phát hiện conflict: ghi file/section, severity, đề xuất CR; không silently redesign.
3. Chỉ triển khai Slice 1 trong lần implementation đầu. Kết thúc mỗi slice bằng review và evidence; chỉ chuyển slice khi reviewer approve và không còn Critical/Major unresolved.

## Slice 1 — Repository / toolchain / minimal shell

**Output:** Git local nếu vẫn chưa tồn tại; pnpm manifest/lockfile; runtime pin; Next.js + React app root; strict TypeScript; ESLint; Vitest và một component smoke; `.env.example`, `.gitignore`, README, progress.

**Scope:** Trang `/` tĩnh, tiêu đề sản phẩm và thông báo chưa có dữ liệu; CSS tối thiểu. Scripts dev/start bind `127.0.0.1`. Không font/CDN/network fetch. Chưa tạo domain entities, ORM, schema hoặc routes nghiệp vụ.

**Acceptance:** clean install, lint/typecheck/test/build pass; production HTTP smoke thành công; xác minh dev và production listener chỉ ở loopback; example không có secret/URL DB thật; không overwrite baseline. Prompt đầy đủ tại [SLICE_1_CODEX_PROMPT.md](SLICE_1_CODEX_PROMPT.md).

## Slice 2 — Dependency boundaries / minimum primitives

**Depends:** Slice 1 approved.

**Files:** `src/domain/`, `src/application/`, `src/ports/`, `src/infrastructure/`, `src/ui/`, `src/shared/`, lint/boundary config, `tests/unit/`, `tests/architecture/`, docs. Chỉ tạo file có mục đích, không scaffold tất cả domain module rỗng.

**Output:** quy tắc dependency có enforcement cho cả relative import, aliases, type-only imports, re-exports và dynamic imports nếu được dùng. Composition root server-side được chỉ rõ; không cho Client Component import hạ tầng. Shared không trở thành đường vòng kéo IO vào domain.

Bắt buộc controlled Clock/IdGenerator ports thuần và adapter hạ tầng, deterministic doubles trong tests. Methodology registry skeleton contract theo DOMAIN_MODEL §22: immutable identity, family/type, semantic version, approval/baseline identity, effective date, immutable configuration reference/snapshot và implementation/build identity. Không registry production seed hoặc gán APPROVED cho logic chưa tồn tại.

Primitive chỉ khi có consumer trong foundation: stable ID (không dùng ticker làm ID), VND currency, date-only khác instant/as-of. Money/percentage nếu thực sự cần: ghi exact representation/units và conversion contract trước, không thêm tính toán accounting. Không mặc định mọi percentage nằm trong 0–100 vì return có thể âm hoặc >100%; validation phụ thuộc owning field.

**Acceptance:** positive import fixture pass, cố tình tạo forbidden imports phải fail, không chỉ kiểm tra thư mục rỗng; compile tests phân biệt IDs/time types; round-trip primitive exact và reject malformed values khi primitive được thêm. Không policy thresholds/enums tự suy diễn.

## Slice 3 — Configuration / validation / errors / logging

**Depends:** Slice 2 approved. Đặt trước persistence để DB dùng chung validated config/error contract.

**Files:** `src/shared/errors/`, `src/shared/validation/`, `src/infrastructure/config/`, `src/infrastructure/logging/`, tests, `.env.example`, README. Config/logging có IO không thuộc pure domain.

**Output:** Zod trust-boundary helper nhận unknown, kết quả có `field`, `reason`, `expected`; dùng được cho input/import/provider mà chưa triển khai endpoint/parser/provider. Không coerce chuỗi rỗng thành 0, không parseFloat để nhận financial facts. Config invalid fail với ConfigurationError và không echo giá trị nhạy cảm.

Error categories tối thiểu: ValidationError, NotFoundError, ConflictError, DataIntegrityError, ExternalProviderError, ConfigurationError. Map tới broad categories Architecture §23, không ép chúng thay thế domain errors của milestone sau. UI mapper chỉ trả safe code/message/correlation ID; không trả SQL, paths, stack hoặc raw cause.

Logging dạng cấu trúc, ưu tiên allowlist metadata; clock/sink injectable. Không log arbitrary request body/environment/error message vì redact theo key không bảo vệ secret nằm trong chuỗi tự do. Không audit investment decisions trong slice này.

**Acceptance:** valid/invalid config, nested field path và expected shape, financial coercion rejection; safe UI error; logger tests với nested secrets, auth header, password, OTP và raw cause bảo đảm không xuất giá trị. Không provider key bắt buộc khi chưa có provider.

## Slice 4 — SQLite / Prisma persistence foundation

**Depends:** Slice 3 approved; registry contract Slice 2 được review theo DOMAIN_MODEL §22.

**Files:** `prisma/`, config Prisma phù hợp phiên bản chọn, `src/infrastructure/db/`, adapter/repository tối thiểu, port/domain type thực sự cần, `tests/integration/`, fixtures, scripts DB, docs.

**Output:** server-only connection lifecycle, migration và schema validation/generation, test DB tách biệt dùng temporary path. Không generic CRUD endpoint. Không chạy reset vào DB người dùng.

**Schema scope:** methodology registry skeleton theo IMPLEMENTATION_PLAN §3 và DOMAIN_MODEL §22; map đúng logical fields và immutable identity/config/build lineage, migration và repository port tối thiểu chỉ phục vụ skeleton. Không Portfolio/Security/ledger CRUD, vì §4 xếp chúng vào M6.3. Không tự tạo bảng test hoặc monetary columns trong production schema.

**Acceptance:** migrate empty temporary DB, migration status/generate/validate pass; registry adapter write/read, duplicate→Conflict, missing→NotFound, rollback, reopen persistence, disconnect/cleanup. Test FK nếu schema có relationship; không tạo relationship giả để đủ test. Migration tiếp theo phải kiểm tra upgrade từ previous supported schema và giữ records; với migration đầu ghi previous-schema test N/A.

Numeric round-trip là **early proof bắt buộc trong Slice 4**: dùng isolated test-only schema/table với physical representation và Prisma/SQLite adapter dự kiến cho authoritative numbers, serialize → persist → read exact. Kiểm tra whole VND, vượt JS safe integer, fractional price/rate, scale và invalid input; không qua JS number/REAL hoặc approximate equality. Ghi ADR storage choice khi proof thực tế có kết quả. Đây là technical precision fixture, không Money/MWAC/TWR/XIRR engine hoặc rule rounding của M6.3+. Phải chứng minh isolation khỏi production schema/DB; không chỉ test in-memory serialization. Nếu proof fail, sửa representation trong approved semantic contract hoặc raise CR trước khi approve Slice 4.

## Slice 5 — Deterministic test foundation / integrated smoke

**Depends:** Slice 4 approved. Các slice trước đã có test riêng; đây không phải lần đầu mới viết test.

**Files:** test configs, `tests/unit/`, `tests/integration/`, `tests/architecture/`, `tests/fixtures/`, factories, `tests/smoke/`, `tests/e2e/`, `playwright.config.ts`, scripts, docs.

**Output:** tách unit/integration; clocks/IDs cố định qua injection; UTC cho test instants, explicit timezone tests khi liên quan; unique temp DB per worker. Không live market API, provider SDK network hoặc shared development DB.

Fixture đặt rõ test-only; demo seed nếu thật sự cần phải opt-in, deterministic, có nhãn demo và target riêng; mặc định không production seed. Không dữ liệu giá hiện tại hoặc NAV giả trong shell.

**Acceptance:** app boot smoke, validation smoke, real SQLite persistence smoke và non-vacuous boundary checks đều pass. Chạy lại test để chứng minh isolation khi có thay đổi harness. Playwright setup và browser shell smoke bắt buộc theo IMPLEMENTATION_PLAN §3: browser thật kiểm tra heading/empty state trên production app loopback, bounded startup/cleanup, không reuse nhầm server khác. `test:e2e` phải pass trong M6.2; critical business E2E được deferred đến feature tương ứng, không tạo workflow giả để đủ test.

## Slice 6 — Final quality gates / documentation / review

**Depends:** Slice 5 approved.

**Files:** README, docs/progress, scoped gate scripts/config fixes; không mở thêm tính năng.

**Commands dự kiến tại root (pin theo toolchain đã chọn):**

```sh
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm test:integration
pnpm test:boundaries
pnpm build
pnpm test:smoke
pnpm test:e2e
pnpm db:validate
pnpm db:generate
git diff --check
```

`db:validate`/`db:generate` dùng Prisma CLI; migration deploy/status chạy chỉ trên disposable test DB thông qua integration harness. `test` cũng phải tồn tại và chạy relevant deterministic suites. Typecheck chạy được từ clean checkout, không phụ thuộc `.next` cũ. Không PASS do `passWithNoTests`, lint warning bỏ qua hoặc type/build suppression.

**Acceptance:** mọi gate có command, exit/result, test count, migration status, E2E status, phiên bản và giới hạn trong report (TEST_STRATEGY §42). Chạy `pnpm audit` và ghi actual dependency findings/remediation; không auto-force upgrade hoặc gọi PASS nếu audit không chạy được. ADR chỉ tạo khi có quyết định thực tế, theo IMPLEMENTATION_PLAN §13, không tạo sẵn 10 ADR speculative. Review tracked/untracked files, lockfile, `.gitignore`, secrets/debug artifacts; `git diff --check` không kiểm tra untracked file nên cần kiểm tra whitespace riêng cho file mới. README có install/dev/prod/test/DB migration/config/reset-safe hướng dẫn; không document destructive reset mặc định. M6.2 chỉ ready for approval sau khi không còn Critical/Major, không tự declare user approval hoặc chuyển M6.3.

## Review protocol cho từng slice

| Góc review | Cần xác minh |
| --- | --- |
| Software Architect | Scope, layer graph, composition root, không silent redesign |
| Senior TypeScript Engineer | Strict types, runtime compatibility, không duplicate/unsafe casts che lỗi |
| Data Engineer | M2 naming, units, exact values, timestamps, migration/fixture isolation |
| Security Reviewer | Loopback, no secrets, safe error/logging, no arbitrary persistence API |
| QA Engineer | Meaningful tests, clean environment, negative tests, actual gate evidence |

Reviewer report phải có findings Critical/Major/Minor, source file/line, fix và validation evidence. Sửa/re-run/re-review nếu còn Critical/Major. Một implementation report “ready for review” không thay thế approval của ChatGPT Project/user. Không giao agent chạy slice sau trong lúc slice trước chưa approve.


## Traceability M6.2 scope — IMPLEMENTATION_PLAN §3

| Approved scope / proof | Slice chịu trách nhiệm |
| --- | --- |
| Next/TS, lint/typecheck/test/build, loopback, secret exclusion | 1; tổng kiểm 6 |
| domain/application/ports/infrastructure/ui/shared boundaries | 2 |
| Controlled clock/ID abstractions | 2; isolation kiểm 5 |
| Methodology registry skeleton | 2 contract, 4 persistence |
| Zod, environment config, typed errors | 3 |
| SQLite/Prisma migration và numeric round-trip proof | 4 |
| Vitest + React Testing Library + Playwright setup | 1 Vitest/RTL; 5 Playwright |
| Test DB isolation, actual integration tests | 4; tổng kiểm 5/6 |

Full financial value objects, Portfolio/Transaction Engine, reconstruction và business E2E không được kéo từ M6.3+ vào foundation. Review gate giữa các slice giữ nguyên.
