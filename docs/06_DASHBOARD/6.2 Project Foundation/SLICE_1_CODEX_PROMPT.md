# Codex prompt — M6.2 / Slice 1

2026-09-10: **Ready for handoff; chưa execute.** CR-01/02 đã CLOSED sau đối chiếu hai artifact approved. Chỉ triển khai Slice 1 khi thực hiện prompt này.

## Objective và source

Bạn là Implementation Engineer. Tại `/Users/nglehoangan/Documents/Working/VN30_Investment`, chỉ thực hiện M6.2 Slice 1: repository/toolchain/minimal application shell.

Đọc audit và slice plan trong `docs/06_DASHBOARD/6.2 Project Foundation/`, `docs/PROGRESS.md`, và toàn bộ baseline áp dụng trong `docs/06_DASHBOARD/6.1 Requirements & Architecture/`:

- REQUIREMENTS.md
- ARCHITECTURE_v1.0.md (§4–7, §25, §31, §34)
- DOMAIN_MODEL_v1.0.md
- DATA_FLOW_v1.0.md
- UI_INFORMATION_ARCHITECTURE_v1.0.md
- MARKET_DATA_ADAPTER_v1.0.md
- NTEGRATION_v1.0.md (AI Integration)
- SECURITY_v1.0.md
- TEST_STRATEGY_v1.0.md (§36, §39–42)
- IMPLEMENTATION_PLAN_v1.0.md (§3, §10–14)
- VALIDATION_CASES_v1.0.md

Audit lại tree, Git status và AGENTS.md nếu mới xuất hiện. Không overwrite code phù hợp thêm sau audit. Missing/conflicting baseline: ghi source/section, Critical/Major/Minor và proposed CR; không suy đoán hoặc redesign. Tuyên bố baseline approved của user được tôn trọng dù metadata cũ.

## Allowed changes

Chỉ được tạo/sửa:

```text
package.json
pnpm-lock.yaml
.nvmrc
.gitignore
.env.example
tsconfig.json
next-env.d.ts
next.config.ts
eslint.config.mjs
vitest.config.ts
app/layout.tsx
app/page.tsx
app/globals.css
tests/setup.ts
tests/unit/app-shell.test.tsx
scripts/smoke-app.mjs
README.md
docs/PROGRESS.md
docs/06_DASHBOARD/6.2 Project Foundation/SLICE_1_REVIEW.md
```

Được git init nếu chưa repository; không stage toàn bộ, commit, remote hoặc push. Generated node_modules/.next/coverage được ignore, không hand-edit hoặc commit. Không sửa/rename baseline M1–M6.1, README_v1.0.md, audit/plan. Nếu cần thay ngoài allowlist, ghi concrete delta trước mở scope.

## Toolchain

- Dùng pnpm và duy nhất pnpm-lock.yaml theo IMPLEMENTATION_PLAN §12. Chưa pin dependency version: kiểm tra official docs, engines/peer dependencies và advisories, ghi exact compatible versions/nguồn trong review. Runtime đã quan sát Node v22.12.0 không được mặc định tương thích mọi version; không sửa global runtime.
- Package private, pin runtime/package manager được kiểm chứng. Lần đầu `pnpm install` tạo lockfile thật; sau đó kiểm chứng frozen install. Không fabricate lockfile, force hoặc bypass peer conflicts. Review/allowlist chỉ dependency build scripts cần thiết nếu pnpm yêu cầu, không approve mọi scripts.
- Minimal deps: Next.js/React/React DOM; TypeScript/types, ESLint/Next config, Vitest, React Testing Library, DOM test environment và matchers nếu dùng. Không form/chart/query/Prisma/Zod/provider/AI packages ở slice này.
- Strict TypeScript, không ignoreBuildErrors/unsafe casts để che lỗi. Alias @/* → ./src/* nhất quán TS/Vitest; chưa tạo domain chỉ để dùng alias. ESLint zero warnings.
- Typecheck từ clean checkout phải pass; generate Next route types trước nếu phiên bản chọn cần, không dựa .next cũ.

## Shell/config

Root App Router page/layout/CSS tối thiểu, heading `VN30 Value Investing OS`, empty state rõ chưa dữ liệu. Không fake NAV/price/risk/decision hoặc navigation feature chưa có. Không business calculations, server actions, API routes, DB hoặc remote fonts/CDN/network fetch.

Dev/start explicit `--hostname 127.0.0.1`. Không LAN/cloud deployment, broker/auth/auto-trade.

.env.example chỉ comments/tên biến với giá trị trống; không real DB URL/key hoặc public secrets. Không required secret để boot shell. Nếu chưa custom variable thì comments-only hợp lệ, document config validation thuộc Slice 3.

.gitignore bao gồm .env* ngoại trừ .env.example, node_modules/build/coverage/tsbuildinfo, .DS_Store, SQLite DB và WAL/SHM/journal, runtime data/import/export/backup directories. Không ignore migrations/lockfile/toàn bộ CSV/JSON/test fixtures.

README mới dẫn README_v1.0.md, hướng dẫn runtime/pnpm/install/dev/prod/tests/binding và deferred features.

## Scripts/tests

Bắt buộc dev, start, build, lint, typecheck, test (Vitest run, fail if no tests), test:unit, test:smoke (`node scripts/smoke-app.mjs`). Không suppression để xanh gates.

RTL component smoke assert heading và empty state bằng semantic queries, không snapshot-only hoặc assert hằng số. Deterministic DOM setup; không live API/AI hoặc wall-clock expected output.

smoke-app.mjs chạy production app từ build trên port test riêng ở loopback; bounded readiness timeout; HTTP GET / kiểm 200 và heading. Fail khi boot/status/content sai, cleanup child do mình tạo trên success/failure/timeout. Không reuse/kill server người dùng, không mock Next runtime.

## Validation và acceptance

```sh
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:smoke
git diff --check
```

Thêm dev HTTP smoke; xác minh listeners của cả dev/start chỉ ở 127.0.0.1 bằng lsof hoặc tương đương, không suy luận từ HTTP pass. Cleanup processes do mình tạo.

Dùng git check-ignore --no-index kiểm hypothetical .env.local/SQLite sidecars bị ignore, .env.example/lockfile/migration path không bị ignore. Không tạo secrets thật. Review source/file list/browser assets tránh sensitive configuration/debug artifacts, không in secrets.

Git mới có thể chưa tracked files: git diff --check pass rỗng không đủ; kiểm whitespace của file mới riêng, không git add . để tạo diff. Nếu install/network/runtime thiếu thì ghi BLOCKED/NOT RUN, không fake PASS. Chạy dependency audit nếu khả dụng; không auto-force upgrade. Evidence có command, exit, test count, versions và limitations.

## Scope boundaries và review

Controlled clock/ID + methodology registry contract thuộc Slice 2, config/Zod/errors/logging Slice 3, SQLite/Prisma/registry persistence + mandatory numeric round-trip proof Slice 4, Playwright setup/browser smoke Slice 5. Đây đều là yêu cầu M6.2, không bỏ hoặc kéo vào Slice 1. Full Money/Portfolio/Transaction/Scoring/Decision/DCA/Risk/Journal/business E2E thuộc milestone sau.

Review 5 góc: Software Architect, Senior TypeScript Engineer, Data Engineer, Security Reviewer, QA Engineer. SLICE_1_REVIEW.md ghi summary, changed files, design choices, actual tests, Critical/Major/Minor, limitations. Sửa Critical/Major trong scope, re-run và review lại. DB migration/E2E chưa có là deferred tới slice tương ứng, không PASS giả.

Update progress thành “Slice 1 implemented — ready for review” chỉ khi acceptance pass; không tự ghi user approval. Dừng và handoff cho ChatGPT Project review; không Slice 2 hoặc M6.3 trước approval.
