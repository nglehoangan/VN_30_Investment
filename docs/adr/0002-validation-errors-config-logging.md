# ADR 0002 — Trust-boundary validation and safe diagnostics

Date: 2026-09-10. M6.2 Slice 3. Implements Architecture §5.4, §23, §25, §27 and Security §14–17 without changing the approved architecture or investment policy.

## Validation and dependency policy

Use pinned Zod 4.6.1 at trust boundaries. `parseBoundary` accepts a synchronous schema, unknown input and developer-authored expected-shape descriptions. It returns inferred output or ValidationError with field/reason/expected entries. Array indices are retained for known schema paths such as rows[].price. Unknown map keys, unexpected key names, custom Zod messages, raw inputs and raw Zod errors are not copied into diagnostics.

Schemas must explicitly choose allowed structure and transformations; supplied examples/tests use strict objects. The generic helper is not a policy engine and cannot make an arbitrary caller's coercing schema safe. The supplied decimalString schema accepts exact signed decimal text only, preserves scale/sign verbatim and rejects JS numbers, exponent/locale formats and whitespace. It does not calculate, round, pick units or impose financial ranges. Unit/currency/economic validation remains with owning M2/domain rules and future adapters. Async schemas are not part of this initial helper.

ADR 0001's external-dependency rule now has a narrow exception: Zod imports in src/shared/validation and src/infrastructure/config only. Pure domain/ports/application and other shared modules may not reach shared/validation even indirectly. Pure shared/errors has no Zod/framework/IO dependency. Positive/negative boundary fixtures cover the exception and transitive restriction; no broad package wildcard was introduced.

## Errors and UI safety

Six requested categories have typed classes: ValidationError, NotFoundError, ConflictError, DataIntegrityError, ExternalProviderError, ConfigurationError. Constructors use fixed safe messages. Local non-validation exceptions may retain a cause for controlled debugging, but public/log serializers never inspect or forward it. Validation/config errors copy only field/reason/expected and retain no ZodError cause.

`toPublicError` returns only a known category, fixed Vietnamese message and optional valid server-issued UUID correlation ID. Unknown errors map to INTERNAL_ERROR. It never reflects stack, SQL, filesystem paths, custom messages or validation issue text. Consumers needing per-field form feedback use the sanitized parseBoundary issues with developer-authored schemas; new UI flows are not added here.

Existing pure primitive TypeErrors from Slice 2 remain defensive programmer-facing contracts; untrusted boundary input uses the new structured validation path. This does not redefine later domain-invariant/reconciliation error semantics.

## Configuration and startup

Only LOG_LEVEL is consumed because it has a real logging consumer. Unset defaults to info; debug/info/warn/error/silent are valid; empty or unknown values raise ConfigurationError without echoing values. Unrelated environment variables are neither copied nor serialized. Config is immutable per server instance. No DB URL, API keys or broker credentials are introduced prematurely.

The root Next instrumentation.ts register hook initializes app/server/bootstrap before requests become ready; onRequestError records only an error category and generated correlation ID. The hook is restricted to Node runtime. Both files carry server-only markers and are covered by the boundary graph. Node/environment/console IO stays outside pure code. Follow bundled Next 16.3.4 instrumentation documentation rather than obsolete framework assumptions.

A failed register hook in this Next version can retain a listening process while rejecting readiness. The required invariant is no successful application response with invalid config, not an assumed immediate process exit. Fix configuration and restart the server; smoke cleanup terminates only its own process group. The isolated invalid-config checks confirm no canary leakage in captured server output or response body.

## Structured logging

Use a small logger with injected Clock and line sink, not an external logging platform. Allowlist redaction creates a new record containing only validated timestamp, known level/event, optional UUID and fixed error category. Free-form messages, requests, headers, raw causes/stacks, arbitrary nested fields and financial payloads are not serialized. Event names are a fixed operational set, not investment decision audit events.

Levels filter output; silent suppresses all normal logging. Bootstrap config failure uses an error-level diagnostic even when the requested setting is invalid. Logger returns false on filtered/rejected records or sink/clock failure and never creates a second application error. Diagnostic delivery is best-effort, not a durable audit guarantee. Correlation IDs must come from the server runtime; shape validation is not permission to log external credentials that happen to resemble UUIDs.

## Alternatives and consequences

Copying raw Zod/error messages or recursively redacting only familiar secret key names could leak secrets embedded in free text or unknown property names. Allowlisting avoids that risk at the cost of less verbose diagnostics. A mature logging package can replace this implementation later if real needs grow; retain the canary tests and public-error contract.

No HTTP route, form, provider, import parser, persistence or investment audit subsystem is added just to exercise the foundation. Those features can consume these contracts in their own approved slices.
