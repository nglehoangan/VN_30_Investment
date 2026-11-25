# Single-ticker Skill invocation — v1

Applies to repository ticker-processing Skills, including manual PDF processing. Universe-wide inventory/readiness is a separate read-only operation and must not invoke a worker, download/extract reports or write issuer results.

Each execution requires one scalar `ticker`, `skill`, `referenceDate`, `purpose` and selected `universeVersion`. Exchange/security identity comes from the pinned universe. S1–S5 and Structural N/R remediation additionally require an approved sector enum resolved from the issuer's economics; the guard checks the enum, not the correctness of the analyst's sector assignment. Retain existing economic cutoff, knownAt, calculatedAt, review/source clocks and purpose semantics in the worker's own contract.

`ticker` is normalized to uppercase and must be one three-character VN30 symbol. Reject missing values, arrays (even one element), ALL/VN30, wildcard characters, comma/slash/space-separated symbols, path syntax, Unicode lookalikes and repeated `--ticker` options. Hidden ticker/symbol/batch overrides in operation parameters are rejected. The orchestrator may accept a queue of requests, but every request has exactly one ticker.

Run `runtime.py prepare --skill <skill-name> --ticker <one-ticker> --reference-date <date> --purpose <purpose> --universe-version <version> [--sector <approved-sector>]` before processing. `--parameters-json` is operation metadata, not arbitrary shell arguments or authority. The command is an offline identity guard and returns an execution envelope, not an analysis/admission result.

The versioned registry is trusted repository configuration, not a caller-supplied membership claim. It pins retained profile bytes, the official composition/reconciled history and security identities. Membership intervals are half-open when an actual effectiveTo exists; verified coverage is checked separately. Outside retained coverage return UNVERIFIED, not "ticker removed". Append a legitimately qualified version when needed; never extend dates or silently replace hashes. This foundation grants no historical PIT qualification from later membership knowledge.

The initial profile lives in a VNM work package but its membership section represents all 30 constituents. Only membership/security identity is reused. Its VNM price, share-count, F1/F2 admissions, financial inputs, scoring/AI binding and PUB-04 permission are **not** imported for another ticker.

`prepare` returns `single-ticker-execution-v1`: deterministic executionId/operationKey, canonical one-ticker request, pinned universe, securityId and all permissions false. IDs bind ticker, Skill, reference date, purpose, sector, parameters and candidate binding hashes. A source/policy/input revision requires a new bound request/ID, not overwriting prior evidence.

Candidate binding rows are `{kind,subjectTicker,reference,sha256}` with kind SOURCE / ASSESSMENT / DEPLOYMENT / PUBLICATION. All must target this ticker. These are provenance candidates, not trusted authorizations. Existing governed adapters independently verify actual source, authority, original receipts, observation identity, scope/time, revocation and purpose. Common provider-policy references do not transfer another ticker's admitted observations or permission.

Before calling a retained JSON worker, use `require_input_identity(context, packet)` to match ticker/cutoff, then its original issuer/document/period/unit/hash validators. Other input layouts must be checked by their existing adapters. Output evidence must tag subjectTicker; peer-context evidence may remain in payload but cannot become the target issuer's authority or financial fact. Worker result ticker/executionId must exactly match the envelope.

Hash-pinned legacy `fetch.py`/`runtime.mjs` are preserved processors/replay paths, not independent active Skill entrypoints. Do not call them to bypass the guard. Manual Skills must use the same prepared context. Live host-adapter registration is future integration; this foundation neither automatically invokes those processors nor grants permission to do so.

Output/readiness/COMPLETED means a bounded workflow step finished. It never means analyst assessment approved, scoring authorized, deployment authorized, publication authorized, trading enabled or historical PIT established. Keep those gates in the original trusted workflows and require actual ticker-scoped authorization there.
