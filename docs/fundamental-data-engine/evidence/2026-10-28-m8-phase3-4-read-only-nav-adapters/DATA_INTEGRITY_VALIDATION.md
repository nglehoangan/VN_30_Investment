# Data integrity validation

2026-10-28 · Phase3.4 SliceA · READ_ONLY_ADAPTERS_ONLY

Validation covers original byte pins/size/paths, strict schema/source identity, lossless decimal lexemes, duplicate IDs/keys, knowledge/asOf, exact ledger revision/state/facts and repeatable derived heads. Deep freezing follows cloning so caller/source data is neither rewritten nor unexpectedly frozen. Broker fields retain source order and exact decimal lexemes; ledger derived history and multi-document inventories have deterministic ordering.

Negative cases include symlink final/intermediate/root traversal, path traversal/backslashes/absolute paths, nonregular files, oversized/deceptive-size input, modified or incorrectly hashed bytes, wrong document/account/perimeter, unsupported encoding/BOM, duplicate JSON keys and evidence identifiers, future observations, unsupported precision/lifecycle, inconsistent source dates, stale/same-revision ledger replacements and evidence-head mismatch. TOCTOU test uses a test-only mock of Node open that replaces the path after obtaining a descriptor; there is no hook/backdoor in production reader code.

Parsed conflicts are retained but rejected. Cross-document repeated field/security claims are not merged or latest-selected. Missing liabilities/claims/cash remain unknown; pending shares cannot become ordinary shares or additional ledger quantities. The broker reader verifies envelope-byte provenance only; original real-source semantic qualification remains absent.

Actual immutable opening replay and adapter snapshot checks are under validation/. Synthetic expected/actual preparation/nav objects and repeat hashes are recorded separately. Hashes are integrity metadata, not proof of publication, authority, identity continuity, human acceptance or complete forward accounting.
