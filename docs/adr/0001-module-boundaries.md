# ADR 0001 — Foundation dependency boundaries

Date: 2026-09-10. Implementation choice within approved Architecture §4–7, §33; M6.2 Slice 2. This ADR does not change investment policy.

## Decision

Retain root `app/` and use `src/domain`, `src/application`, `src/ports`, `src/infrastructure`, `src/ui`, `src/shared`. Pure modules depend inward. `app/server/` is the server composition root, marked with Next's `server-only`. It wires clock/ID adapters without putting IO in a React component. Presentation delegates from `app/page.tsx` to `src/ui/foundation-shell.tsx` with unchanged output.

| Source layer | Allowed local targets |
| --- | --- |
| shared | shared |
| domain | domain, shared |
| ports | ports, domain, shared |
| application | application, ports, domain, shared |
| infrastructure | infrastructure, ports, domain, shared |
| ui | ui, application, domain, shared |
| app (route shell) | app, server, ui, application, domain, shared |
| app/server | server, application, infrastructure, ports, domain, shared |

Type-only and runtime edges follow the same policy. A Client Component's transitive graph cannot reach infrastructure, composition root or identified server-only APIs. Pure layers have no external package imports in this slice. React/Next are limited to presentation/route layers; node builtins to infrastructure. Adding a legitimate dependency (e.g. exact decimal arithmetic later) requires an explicit policy update and tests; no wildcard domain package access.

## Enforcement

`scripts/check-boundaries.mjs` uses the already installed TypeScript compiler API for parsing and module resolution. It checks all app/src modules, including disconnected files, aliases, relative imports, re-exports, dynamic imports, CommonJS import forms and type imports. Unclassified or unresolved local dependencies fail. Computed import specifiers, aliased require loaders and source symlinks are unsupported and rejected rather than skipped. Representative ambient IO and uncontrolled time/random access in pure layers fail too.

`pnpm lint` runs this gate after ESLint; `pnpm test:boundaries` runs the real graph check plus positive/negative temporary graph fixtures. `pnpm test` also includes these tests. Temporary fixture trees are removed after each test; tests cannot be imported from production layers.

This is a development dependency guard, not a JavaScript security sandbox or proof of arbitrary code purity. Runtime validation of user/provider inputs belongs to Slice 3; persistence invariants and DB immutability belong to Slice 4. Framework `server-only` provides an additional build guard. No assertion is made that string-based malicious evaluation or every future Next server API can be discovered automatically; new import forms/APIs require review.

## Alternatives and consequences

ESLint import patterns alone do not resolve transitive client graphs or alias/relative equivalence. A dedicated dependency-analysis library would add a dependency for a small graph. Using TypeScript already present in the toolchain keeps resolution consistent and adds no package, at the cost of maintaining a small checker with adversarial regression fixtures.

If the graph grows beyond this checker, replace it with dedicated tooling while retaining the same behavioral tests and direction rules. The approved architecture remains unchanged.

## Primitives and methodology contract

Only MethodologyId, calendar DateOnly and canonical millisecond UTC Instant are introduced because registry/clock consumers need them. Constructors reject malformed values and never coerce; field nominal types are distinct. The instant representation is a foundation serialization choice, not a policy to round or truncate incoming timestamps. Noncanonical provider inputs must be normalized explicitly by later adapters.

Clock and IdGenerator ports have controlled test doubles; system adapters alone read native time/UUID APIs. A read-only registry port and application lookup preserve the exact supplied methodology identity and return null for absence. MethodologyRecord has readonly scalar metadata, external approval reference, immutable configuration reference, build identity and document reference. It records governance evidence; it cannot approve a method. It is a TypeScript contract, not runtime validation or persistence enforcement. No production records, version regex, family enum, Money, currency or financial formula is invented.
