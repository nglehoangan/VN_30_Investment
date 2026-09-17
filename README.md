# VN30 Value Investing OS

M6.2 Project Foundation provides a local Next.js application shell with an explicit empty state. SQLite methodology persistence is available; investment workflows and financial calculations remain future work. The approved investment baseline starts at [README_v1.0.md](README_v1.0.md).

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

Next and the DB wrapper read local `.env.local`; explicit shell variables take precedence. Never commit that file or a personal DB. Restart after config changes. Do not use reset/db push as an upgrade procedure. Backup/restore workflows are deferred; this slice uses DELETE journal mode and makes no WAL backup guarantee.

Integration tests always allocate private temporary databases, override inherited DATABASE_URL, skip `.env.local`, migrate, disconnect and clean up. The numeric probe table exists only there. Exact decimals use validated strings persisted as SQLite TEXT, including values beyond JavaScript's safe integer range; no monetary rounding policy is introduced. The production schema contains only methodology metadata and migration bookkeeping.

Prisma Client is generated inside infrastructure and ignored by Git/ESLint. Build, lint, typecheck and test commands generate it as needed. Security overrides pin Prisma's transitive deepmerge-ts 8.0.0 and mysql2 3.23.1; revisit when upstream adopts patched versions. See [persistence ADR](docs/adr/0003-sqlite-prisma-persistence.md) and [Slice 4 review](<docs/06_DASHBOARD/6.2 Project Foundation/SLICE_4_REVIEW.md>).

## Slice 5 — Deterministic foundation gate

Install the pinned browser once, then run the combined gate:

```sh
pnpm exec playwright install chromium
pnpm test:foundation
```

The combined gate runs unit/architecture/real SQLite tests, builds production, runs a real Chromium shell test and checks invalid startup configuration. `pnpm test:e2e` builds and runs only production/browser smoke. It allocates a temporary loopback port, starts its own server, verifies listener ownership and then passes that URL to Playwright. It never reuses your port-3000 server. Run build-based gates sequentially; use a separate checkout if your dev/build process writes the same Next output directory.

Chromium verifies the visible product heading and empty state, including after reload, and rejects external page requests and uncaught browser errors. Retries are disabled, timeouts bounded, and cleanup targets only test-owned process groups. Direct Playwright execution requires the harness-provided URL; use the package script. Traces on failure are local in ignored `test-results/`; they may contain page content and are not automatically published.

Vitest runs in UTC, and browser context uses UTC/vi-VN. Existing fixed clock and sequence ID doubles remain test-only. The integration isolation test uses two independent databases, verifies records cannot cross between them, and checks independent cleanup. `test:unit`, `test:integration` and `test:boundaries` remain separate selectors. Financial workflow E2E and additional browser/platform coverage are deferred to their corresponding features; this is the foundation shell check.

## Final M6.2 verification

The six foundation slices are implemented; M6.2 was explicitly approved by the user on 2026-09-10. See [final review and evidence](<docs/06_DASHBOARD/6.2 Project Foundation/M6_2_FINAL_REVIEW.md>). M6.3 implementation and verification are complete within its supported accounting scope; see [independent-review remediation report](<docs/06_DASHBOARD/6.3 Portfolio & Transaction Engine/R2_REMEDIATION_REPORT.md>). Unsupported policy cases remain explicitly blocked by CR; no M6.4+ functionality is implemented.

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
