# Repository and retained-document maintenance — 2026-11-18

This package consolidates reusable maintenance behavior and removes verified redundant storage. It preserves approved source evidence, financial values, investment calculations, source authority, scoring authority and publication state.

## Implemented

- Extracted canonical JSON, hashing, scalar ticker validation and atomic writes into `tools/maintenance/common.py`. The sequential rollout implementation retains its existing public functions and deterministic IDs through shared imports.
- Added one-ticker content-addressed PDF storage, exact-byte deduplication, retained-receipt indexing and a direct Vietstock URL downloader. The downloader reuses the existing source-domain/redirect policy and versioned single-ticker guard.
- Created separate catalogs/inventories for all 30 existing ticker directories: 545 documents, 419 with indexed source receipts and 126 without a matching receipt in the scanned download manifests. All 545 remain listed; missing index metadata was not invented. Root-level manifests remain shared source inventories. Receipt references retain their original JSON pointer and manifest hash; incomplete metadata stays unknown.
- Removed 20 redundant physical PDF copies representing 87,639,090 logical bytes. Referenced legacy filenames remain as hardlink aliases, so source pointers still resolve. This is not a claim that 20 filenames were deleted or that the filesystem released exactly that many physical bytes. Deduplication replay made zero further changes.
- Added a standard for new filenames: `TICKER__TYPE__PERIOD__SCOPE__sha12.pdf`, full hash and original receipts in the ticker catalog. Existing pinned filenames stay unchanged. The download Skill records this convention for future work.
- Added a shared explicit-config TypeScript runner. It matches the retained PUB04 runner's PASS result, 264-source selection and source-set hash exactly: `3d1bb1251c6b49e9c943cc8766fcccca19da33f32cb42cdd18260f2ee6f57a2a`.
- Retired nine byte-identical one-off typecheck runners and the explicitly superseded pre-rebuild cleanup script; see `MAINTENANCE_RESULT.json#/sections/RETIRED_FILES` for exact original identity and replacement routes. Original bytes remain available from Git history.
- Added central script/storage navigation rather than rewriting historical research and approval Markdown.

## Evidence distinctions retained

Identical VIB PDFs have both consolidated and parent-company filenames. Their byte identity does not establish the correct financial scope. Both logical observations remain visible; no automatic financial mapping or scope reconciliation was performed.

Catalog receipt hashes imported from historical manifests are explicitly claims until checked against retained bytes. Cache reuse performs that check. A catalog, filename, source URL or successful download does not grant financial admission or scoring permission.

Historical results, source pins, approval receipts, recovery backups and user deliverables are retained. A task-specific filename or age alone is not sufficient proof that a script is unused. Dependency inventory is an engineering check, not renewed qualification of already accepted financial evidence.

## Validation and protected state

See `MAINTENANCE_RESULT.json#/sections/VALIDATION`, `MAINTENANCE_RESULT.json#/sections/TYPECHECK`, `MAINTENANCE_RESULT.json#/sections/DEDUPLICATION_REPLAY`, `MAINTENANCE_RESULT.json#/sections/EXECUTABLE_PIN_PRESERVATION` and `MAINTENANCE_RESULT.json#/sections/PROTECTED_STATE`.

The live database remains SHA-256 `0876f70a76b8d89efe1d33559ff2d68b4f8b50bdccb2e510562fd4dc748d8e51`. The PUB04 server registration remains unchanged. The historical manifest's active-authority configuration pin differs from its current successor, but the current bytes exactly match pre-maintenance HEAD; no approval was rehashed.

No financial reports were downloaded, no scoring/deployment/publication was executed, and no portfolio, transaction or NAV record was changed.

## Audit scope and retained scripts

`REFERENCE_AUDIT.json` is the pre-retirement dependency snapshot: 11,964 paths inventoried, 2,839 source/specification files read, 2,164 hash-referenced paths identified, zero read errors. Generated dependencies and Git internals were excluded. Historical financial result payloads, recovery databases and raw source bodies were inventoried and protected rather than requalified.

The static graph identified 218 root-script candidates outside its active reachability set. This does not prove they are obsolete: the list includes manual governance commands and historical release/replay tools. They are retained, with reasons in `MAINTENANCE_RESULT.json#/sections/AUDIT_SUMMARY`; no claim is made that every historical task script can safely be deleted. The nine retired runners had identical bytes, no active code/test/Skill caller and no inspected explicit pin. Their original configs and validation receipts remain in place; migration commands are recorded per file.

Local document indexes and hardlink relationships remain in ignored `data/`; this commit records their migration receipts and reproducible tools, not a new copy of the financial corpus.

Maintenance results are consolidated into one `MAINTENANCE_RESULT.json`; the detailed reusable reference graph and test-engine report remain separate artifacts. Historical signed/approved evidence was not consolidated or rewritten.

## Final test result

- Python maintenance/storage: **17/17 PASS**; sequential rollout: **18/18 PASS**.
- Strict TypeScript: **264 source files, zero diagnostics**; retained source-set fingerprint reproduced exactly.
- Download Skill validation and syntax checks: **PASS**.
- Normal bootstrap/publication regressions: **22/23 unique tests PASS** after fixing the shared runner's duplicate React tree. The remaining bootstrap test exceeded the unchanged 60-second timeout (about 239 seconds).
- A separate **360-second diagnostic run passed both bootstrap tests** with the same assertions and hash checks. Original timeout reports are preserved; this does not claim the original 60-second suite passed. No application or investment logic was changed to address test setup/I/O latency.
- Live database and PUB04 registration fingerprints still match their pre-maintenance baselines; no SQLite WAL/SHM sidecars remain.

The broader production test suite was not rerun and this engineering package grants no new production authority.
