# M6.2 Slice 2 — Boundaries and primitive contracts

Date: 2026-09-10. **Implemented — ready for review**. User approved Slice 1 and authorized continuing; Slice 2 acceptance approval is not assumed.

## Scope and result

Implemented approved slice plan §Slice 2 and Implementation Plan §3: actual layer modules, dependency enforcement, controlled clock/ID interfaces/adapters, read-only methodology registry contract and required nominal identity/time primitives. No financial engines, database/schema, Zod/config/logger implementation, production registry seed, or methodology approval flow was added.

The app page delegates existing markup to src/ui with unchanged user-visible behavior. app/server/runtime.ts is the server-only composition root for native runtime adapters. This wiring is available to future server application use cases; it is not exposed through a page or generic API.

## Changed files

- src/shared/ids.ts and time.ts: MethodologyId, DateOnly, Instant with explicit no-coercion factories.
- src/domain/methodology/record.ts: readonly metadata contract with external approval/configuration/build/document references.
- src/ports/runtime.ts and methodology-registry.ts: framework/ORM-independent interfaces.
- src/application/methodology/find-methodology.ts: exact-ID lookup, null stays missing; no current-version/approval fallback.
- src/infrastructure/runtime.ts: native clock and UUID implementations.
- app/server/runtime.ts and app/page.tsx; src/ui/foundation-shell.tsx: server composition and presentation separation.
- scripts/check-boundaries.mjs: TypeScript AST/resolution-based graph gate.
- tests/architecture/boundaries.test.mjs and contracts.typecheck.ts: real graph, adversarial fixtures, nominal/readonly compile checks.
- tests/fixtures/runtime.ts and tests/unit/foundation.test.ts: deterministic doubles, malformed-value rejection, serialization and lookup tests.
- package.json, vitest.config.ts: boundary gate in lint, dedicated command and expanded test discovery. No dependency/lockfile change.
- README.md, docs/adr/0001-module-boundaries.md, docs/PROGRESS.md and this report.

Existing AGENTS.md/CLAUDE.md were discovered at turn start and preserved; AGENTS says Next dev generates them. Relevant bundled Next server/client guides were read before changing app code. No baseline document, Slice 1 audit/plan/prompt or review was modified.

## Decisions and limits

The [boundary ADR](../../adr/0001-module-boundaries.md) documents allowed edges, alternatives, reversal path and limits. Existing TypeScript compiler API avoids adding a separate dependency. Aliases and relative paths resolve through project tsconfig. Type-only imports, re-exports, literal dynamic imports and require/import-equals forms are checked. Computed imports, aliased require and symlinks are rejected. Client traversal includes app barrels and known Next server API dependencies; shared cannot pull infrastructure into pure code. New external packages require explicit policy extension.

Static checks are development guardrails, not a malicious-code sandbox or a complete proof of all possible JavaScript effects. They intentionally reject representative ambient IO/time/random in pure layers; new APIs/forms need review.

MethodologyRecord uses readonly scalar fields and immutable reference semantics; TypeScript does not enforce database immutability or validate strings such as semantic version/config references at runtime. Those gates remain Slice 3/4. A registry read does not grant approval; no APPROVED production record is created. Tests use explicitly test-only governance references.

Only identity/time primitives with actual consumers were introduced. Canonical date-only has no timezone conversion; Instant accepts UTC millisecond serialization only and rejects incompatible shape instead of rounding. Normalizing provider formats is future adapter work. No Money, Percentage, Currency enum or financial policy was needed.

## Validation evidence

Runtime unchanged from Slice 1: Node 22.23.2 and pnpm 10.34.5, selected via temporary runtime PATH for these commands; global Node unchanged.

| Command / check | Final actual result |
| --- | --- |
| pnpm install --offline --frozen-lockfile | Exit 0, no dependency/lockfile changes |
| pnpm lint | Exit 0, zero ESLint warnings; graph checks 11 app/src modules |
| pnpm typecheck | Exit 0, includes expected-error contracts for IDs/date/instant and readonly identity |
| pnpm test | Exit 0, 3 files / 43 tests passed |
| pnpm test:boundaries | Exit 0, actual graph plus 27 positive/negative architecture tests |
| pnpm build | Exit 0; / and framework /_not-found statically rendered |
| pnpm test:smoke | Exit 0; actual production HTTP 200, product heading, owned 127.0.0.1 listener, cleanup |
| git diff --check | Exit 0; tracked diff remains empty because no commits/staging exist |
| Supplemental source/docs checks | Whitespace, links and baseline hash comparison checked separately for untracked files |

An initial crypto mock omitted the default export required by native module interop; fixed with both exports referencing the deterministic stub, then all relevant gates reran. No test calls live market/AI APIs or relies on current date/random expected values. Temporary architecture fixture directories are isolated and cleaned after each test.

Frozen install initially aborted under sandbox store mismatch/no TTY; repeating with the same store access used in Slice 1 passed without deleting node_modules. Production boot needed the same local bind permission as Slice 1. No automatic approval rejection occurred.

## Review by perspective

| Perspective | Result |
| --- | --- |
| Software Architect | PASS: layer direction, pure ports, composition root and transitive client checks; no database/UI shortcut |
| Senior TypeScript Engineer | PASS: strict compile, nominal types, readonly registry identity, malformed primitive inputs rejected |
| Data Engineer | PASS within scope: separate calendar/instant semantics, opaque IDs, exact registry ID lookup, no invented financial data or approved methodology seed |
| Security Reviewer | PASS within scope: no new external integration/secret surface; client cannot traverse to server composition through allowed app barrels; source guards are not represented as a security sandbox |
| QA Engineer | PASS: real nonempty graph and independent forbidden-edge fixtures; compile negative cases, deterministic clock/ID tests and shell regression smoke |

Self-review findings: **0 Critical / 0 Major unresolved**. Inherited Minor constraints remain: ESLint 9 compatibility/lifecycle and macOS/POSIX smoke tooling, plus baseline metadata/naming issues. No new architectural change request.

## Handoff

Slice 2 awaits ChatGPT Project/user review. Next authorized slice after approval is Slice 3 — validation/config/errors/logging. Do not proceed to persistence or M6.3 from this handoff. M6.2 remains incomplete.
