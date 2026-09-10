# M6.2 — Repository audit

Audit ban đầu: 2026-09-09. Reconciliation: 2026-09-10. Phạm vi foundation, không tái-approve baseline hoặc review mọi công thức đầu tư.

## Repository inventory và quyết định

Workspace `/Users/nglehoangan/Documents/Working/VN30_Investment` hiện chỉ có tài liệu và .DS_Store; chưa Git repository, manifest/lockfile, framework code, TypeScript/lint/test config, CI, database/schema/migrations hoặc environment config. Không có code phù hợp cần overwrite. Chưa thấy AGENTS.md trong workspace. Không có hosting config, không deploy cloud.

Runtime quan sát ngày 2026-09-09: Node v22.12.0, npm 11.6.2, pnpm 10.34.5. Phải kiểm tra lại compatibility lúc implementation, không suy ra tất cả package hiện tại tương thích runtime này.

Giữ approved Next.js/React/TypeScript modular monolith, SQLite/Prisma, Zod, Vitest/RTL/Playwright. Chọn pnpm theo IMPLEMENTATION_PLAN §12 (thay đề xuất npm ban đầu vì trước đó thiếu file này); chỉ pnpm-lock.yaml. Root app/, src/domain/application/ports/infrastructure/ui/shared theo Architecture §6; domain không phụ thuộc framework/ORM/IO, UI không investment rules hoặc trực tiếp DB. Git init và toolchain chỉ thực hiện trong Slice 1, chưa commit/remote/push.

## Source mapping và ràng buộc

M1–M5 nằm tại `docs/01 SYSTEM/`, `docs/02 DATABASE/`, `docs/03 SCORING/`, `docs/04_DECISION_ENGINE/`, `docs/05_PORTFOLIO_WORKFLOW/`. M2 DATA_MODEL v1.2 sở hữu naming, VND/exact precision, stable IDs, date semantics và source-of-truth. Không lưu cash/NAV như authoritative Portfolio fields. M3 scoring, M4 decision, M5 review workflows không thuộc M6.2.

M6.1 physical directory: `docs/06_DASHBOARD/6.1 Requirements & Architecture/`.

| Logical artifact | Physical filename |
| --- | --- |
| REQUIREMENTS.md | REQUIREMENTS.md |
| ARCHITECTURE.md | ARCHITECTURE_v1.0.md |
| DOMAIN_MODEL.md | DOMAIN_MODEL_v1.0.md |
| DATA_FLOW.md | DATA_FLOW_v1.0.md |
| UI_INFORMATION_ARCHITECTURE.md | UI_INFORMATION_ARCHITECTURE_v1.0.md |
| MARKET_DATA_ADAPTER.md | MARKET_DATA_ADAPTER_v1.0.md |
| AI_INTEGRATION.md | NTEGRATION_v1.0.md |
| SECURITY.md | SECURITY_v1.0.md |
| TEST_STRATEGY.md | TEST_STRATEGY_v1.0.md |
| IMPLEMENTATION_PLAN.md | IMPLEMENTATION_PLAN_v1.0.md |
| VALIDATION_CASES.md | VALIDATION_CASES_v1.0.md |

Architecture §10/Domain Model §27 yêu cầu numeric exact round-trip; Data Flow source-before-derived và explicit stale/watermark không bị thay bằng UI state. Market adapter giữ provenance/as-of, AI không ledger authority; Security yêu cầu loopback, server-only secrets, safe errors và structured redaction. Shell không fake data hoặc recommendation.

## Issue history

- CR-01 Major: TEST_STRATEGY thiếu ngày 2026-09-09. Đề xuất cung cấp đúng approved artifact; đã CLOSED sau đọc/đối chiếu ngày 2026-09-10.
- CR-02 Major: IMPLEMENTATION_PLAN thiếu ngày 2026-09-09. Đề xuất cung cấp đúng approved artifact; đã CLOSED sau đọc/đối chiếu ngày 2026-09-10.
- CR-03 Minor: REQUIREMENTS.md header/approval gate vẫn Draft v0.1; SCORING_ENGINE.md header Draft v0.2. User approval được tôn trọng, không yêu cầu approve lại. Đề xuất owner đồng bộ metadata/approval manifest trong thay đổi riêng; không tự sửa baseline.
- CR-04 Minor: logical IDs khác physical filenames, AI file mang tên NTEGRATION. Mapping trên được dùng để truy xuất; rename nếu cần là thay đổi riêng, không tạo duplicate source of truth.

Không chạy code quality gates vì chưa source/toolchain; Git diff check không khả dụng vì chưa Git. Không tuyên bố audit mọi secret ngoài workspace.


## 6. Reconciliation — 2026-09-10 (current status)

Các mục ngày 2026-09-09 ở trên là audit lịch sử. Workspace đã được user tổ chức lại: M1–M5 nằm dưới `docs/`; M6.1 nằm dưới `docs/06_DASHBOARD/6.1 Requirements & Architecture/`; tài liệu chuẩn bị M6.2 nằm dưới `docs/06_DASHBOARD/6.2 Project Foundation/`. Các logical document IDs trong baseline giữ nguyên, không rename baseline.

Đã đọc đầy đủ hai artifact mới:

- `docs/06_DASHBOARD/6.1 Requirements & Architecture/TEST_STRATEGY_v1.0.md` — Approved Baseline v1.0, 2026-09-09.
- `docs/06_DASHBOARD/6.1 Requirements & Architecture/IMPLEMENTATION_PLAN_v1.0.md` — Approved Baseline v1.0, 2026-09-09.

**CR-01 và CR-02: CLOSED** — artifact đã có và plan/prompt đã đối chiếu. Hiện không còn Critical/Major unresolved trong phạm vi preparation. CR-03/04 vẫn Minor về metadata và logical/physical naming; mapping hiện tại giải quyết việc truy xuất, không tự thay đổi baseline.

| Finding khi đối chiếu | Severity | Source | Resolution trong implementation slice plan |
| --- | --- | --- | --- |
| Playwright setup trước đây có điều kiện | Major, resolved | IMPLEMENTATION_PLAN §3; TEST_STRATEGY §31 | Slice 5 bắt buộc Playwright setup + browser shell smoke; business E2E thuộc milestone có feature |
| Methodology registry skeleton chưa có | Major, resolved | IMPLEMENTATION_PLAN §3; DOMAIN_MODEL §22 | Slice 2 contract; Slice 4 migration/persistence skeleton; không production methodology seed giả |
| Numeric persistence proof trước đây chưa bắt buộc trong M6.2 | Major, resolved | IMPLEMENTATION_PLAN §3 early proofs; TEST_STRATEGY §12, §28 | Slice 4 bắt buộc actual SQLite exact round-trip proof, không chờ M6.3 |
| Clock/ID abstraction chưa thành explicit deliverable | Major, resolved | IMPLEMENTATION_PLAN §3; TEST_STRATEGY §36 | Slice 2 controlled interfaces/adapters và deterministic test doubles |
| npm khác commands baseline, chưa có lockfile để giữ | Minor, resolved | IMPLEMENTATION_PLAN §12 | Chọn pnpm + pnpm-lock.yaml; bỏ đề xuất npm cũ; chưa cài dependency |
| Links bị stale sau user di chuyển tài liệu | Minor, resolved | docs/PROGRESS.md và prompt Slice 1 | Cập nhật physical paths và links; không di chuyển lại file |

Không có architecture change request mới: đây là sửa plan triển khai để đáp ứng baseline. Portfolio/Security minimums và financial value objects đầy đủ được xếp M6.3 (§4); M6.2 dùng methodology registry skeleton làm persistence vertical proof, không thêm Portfolio CRUD.

Re-audit inventory: vẫn chưa package manifest, lockfile, app/source, database hay Git repository. Runtime observations ở §1 là kết quả ngày 2026-09-09, cần kiểm tra lại lúc implementation. Handoff: prompt Slice 1 đã sẵn sàng; lần này chỉ cập nhật tài liệu, chưa execute Slice 1.
