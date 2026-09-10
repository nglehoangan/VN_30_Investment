# M6.2 Slice 3 — Validation, errors, config and logging

Date: 2026-09-10. **Implemented — ready for review**. User approved Slice 2; continuing with Slice 3 follows the approved slice plan. Slice 3 acceptance approval is not assumed.

## Result and changed files

- src/shared/errors/index.ts: six requested typed categories, immutable field issue copies and coarse safe public-error mapping.
- src/shared/validation/parse.ts and decimal-string.ts: Zod boundary validation, field/reason/expected diagnostics and exact decimal text syntax without financial conversion or policy.
- src/infrastructure/config/environment.ts: explicit LOG_LEVEL selection, immutable validated config; unknown/empty values fail without echoing them.
- src/infrastructure/logging/logger.ts: structured allowlist output with injectable clock/sink, levels and safe metadata. Raw requests/errors/headers/causes/environment never serialized.
- app/server/bootstrap.ts and root instrumentation.ts: server-only startup validation/log initialization and safe request-error hook. These are concrete consumers, not unused scaffolding.
- scripts/check-boundaries.mjs: narrow Zod import exception, transitive core-to-validation prohibition and startup-entrypoint coverage.
- tests/unit/validation.test.ts, config-errors.test.ts, logging.test.ts; tests/architecture/boundaries.test.mjs: valid/invalid inputs, malformed/coercible finance strings, config secrecy, typed errors/public mapping, allowlist/redaction, known/unknown/circular causes, sink failures and dependency guards.
- scripts/smoke-app.mjs: deterministic LOG_LEVEL for test subprocesses and --invalid-config startup/leak check.
- package.json/pnpm-lock.yaml: exactly one direct dependency added, Zod 4.6.1.
- .env.example, README.md, docs/adr/0002-validation-errors-config-logging.md, docs/PROGRESS.md and this report.

No persistence/schema, financial engine, provider SDK/key, broker integration, investment audit event or UI workflow was added. Existing approved baselines and Slice 1/2 review reports remain unchanged.

## Design and compatibility

[ADR 0002](../../adr/0002-validation-errors-config-logging.md) records the narrow extension to ADR 0001's dependency policy, startup semantics, safe serialization decisions and alternatives. Core domain/ports/application cannot import Zod through the shared validation helper. Existing defensive primitive TypeErrors remain programmer-facing; untrusted payloads use structured boundary validation.

Zod version/engines were checked through package metadata, then installed and frozen with the existing Node 22.23.2 / pnpm 10.34.5 runtime. The [official Zod error documentation](https://zod.dev/error-customization) and [schema API](https://zod.dev/api) were consulted. No raw Zod messages/input/cause are forwarded; developer-defined field descriptions provide expected shapes. The generic helper follows the supplied synchronous schema, so callers must not introduce unsafe coercion schemas themselves.

Bundled Next 16.3.4 documentation for instrumentation and environment loading was used. Register initializes only the Node server runtime, and no client environment variable was introduced. One startup config consumer exists: LOG_LEVEL; missing defaults to info, blank is invalid. No speculative DB/provider config.

Public errors contain only a known code, fixed message and optional validated server-generated UUID. Detailed sanitized validation issues are separate, not automatically echoed through the generic UI error serializer. Logger outputs only timestamp, fixed event/level, category and optional correlation ID. Additional/nested arbitrary fields are dropped. Logging is best-effort operational diagnostics; durable investment audit is deferred.

## Validation evidence

All final commands used Node 22.23.2 and pnpm 10.34.5, with the same temporary validation runtime as prior slices. Global Node unchanged.

| Check | Actual result |
| --- | --- |
| pnpm install --offline --frozen-lockfile | Exit 0; lockfile matches added Zod dependency |
| pnpm lint | Exit 0; zero ESLint warnings; 18 app/src/startup modules pass boundary checks |
| pnpm typecheck | Exit 0, including existing nominal/readonly compile checks |
| pnpm test | Exit 0; 6 files / 99 tests passed |
| pnpm test:boundaries | Exit 0; real graph + 31 architecture tests passed |
| pnpm build | Exit 0; / and framework /_not-found generated |
| pnpm test:smoke | Exit 0; HTTP 200, heading, startup log hook and owned loopback listener |
| node scripts/smoke-app.mjs --invalid-config | Exit 0; production startup rejects config/readiness, no healthy response or config-canary leakage |
| Dev smoke (isolated checkout) | Exit 0; startup hook, HTTP 200 and owned loopback listener |
| Dev --invalid-config (isolated checkout) | Exit 0; rejects config/readiness, no healthy response or config-canary leakage |
| pnpm audit --json | Exit 0; 0 vulnerabilities across all reported severities |
| git diff --check | Exit 0; tracked diff still empty because workspace has no commit/staging |
| Supplemental checks | New-file whitespace/links, unchanged baseline hashes and browser-asset server-config separation scan |

The production invalid-config smoke initially expected immediate process exit. Actual Next behavior keeps the process listening while readiness fails. The test now verifies the required failure behavior (ConfigurationError, no successful response, no canary in logs/body) and cleans up its process group; no startup validation was disabled.

A pre-existing user dev process on port 3000 prevented a second dev instance in the workspace. It was not stopped or reused for tests. Dev checks ran in an isolated temporary copy containing only app/src/scripts/config/manifests, with cached offline dependencies; no .env/personal data was copied. Application source, startup hook and smoke script matched byte-for-byte. That test copy was removed after validation. This is a test-environment limitation, not a waived dev check.

Production build/smoke passed with normal source; no cloud/LAN binding. Framework internal diagnostics can include local stack paths; application public mapping and logger do not expose them or raw config. No automatic approval rejection occurred.

## Review perspectives

| Perspective | Assessment |
| --- | --- |
| Software Architect | PASS: Zod at explicit trust boundaries, domain stays pure; server-only startup composition, no persistence scope creep |
| Senior TypeScript Engineer | PASS: inferred validated outputs, unknown inputs/errors, immutable config/issues, fixed error categories; no new unsafe type bypass |
| Data Engineer | PASS within foundation: exact decimal syntax/round-trip, no number coercion or financial thresholds; this is not numeric DB persistence proof |
| Security Reviewer | PASS: config values excluded from exceptions/logs, unknown key/message redaction, canary and nested secret tests, no raw error/payload logging, client cannot reach config/bootstrap |
| QA Engineer | PASS: 99 deterministic tests, negative boundary cases, real dev/production startup failure proof, environment isolation and actual gate evidence |

Self-review: **0 Critical / 0 Major unresolved** in Slice 3. Inherited Minor limitations remain: ESLint 9 lifecycle compatibility and macOS/POSIX smoke tooling. Static dependency checks are development guards, not a sandbox against arbitrary malicious JS; logger delivery is best-effort. Registry persistence, Zod validation for future entity-specific fields, numeric DB round-trip and durable audit are not claimed complete.

## Handoff

Slice 3 awaits ChatGPT Project/user review. After approval, Slice 4 introduces SQLite/Prisma and methodology persistence with exact numeric round-trip proofs. M6.2 is still incomplete; M6.3 has not started.
