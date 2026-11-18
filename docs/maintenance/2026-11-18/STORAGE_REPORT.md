# Project storage reduction — 2026-11-18

The approximately 15 GB project folder contains far more than application source. Application/scripts/tests account for roughly 14 MB. The main contributors before cleanup were:

| Group | Logical size |
| --- | ---: |
| Downloaded PDFs/archives and receipts | 3.81 GB |
| PDF extraction JSON | 1.93 GB |
| Combined presentation JSON | 1.37 GB |
| Old backups | 2.50 GB |
| Documentation and historical evidence | 1.95 GB |
| Git object store/history | 1.58 GB |
| Dependencies | 0.79 GB |
| Next.js generated output | 0.56 GB |

Sizes are decimal GB. The managed filesystem uses placeholders: allocated blocks in this environment differ from logical file sizes and may not represent host/cloud storage consumption directly.

## Executed cleanup

Archived 56 large, cold `backups/**/presentation-before/**/*.json` snapshots: **2,364,863,315 bytes → 155,217,025 bytes**. Every entry was decompressed and matched to its original SHA-256 before uncompressed copies were removed. A real snapshot was subsequently restored into disposable storage with an exact hash match; all 56 archive entries were checked again. Seven SQLite recovery backups and their small metadata files remain uncompressed and in place.

Archive: `backups/cold-presentation-2026-11-18.zip`.
Integrity/recovery index: `backups/cold-presentation-2026-11-18.manifest.json`.
Keep both files together. The archive is local retained backup data, outside Git tracking.

Removed **556,856,308 bytes** of regenerable `.next/cache` and inactive `.next/dev` output. Production `BUILD_ID`, `server/` and `static/` were preserved. The installed Next.js version's caching guide was checked before removal. No Next.js server was running.

The explicit cleanup removed **2,766,502,598 logical bytes net**. The measured project total moved from approximately **14.78 GB to 11.62 GB**; about **0.40 GB** of the additional reduction came from pre-existing Git maintenance completing concurrently. No Git history, refs or objects were manually deleted. Minor new source/receipt sizes are included in the observed total.

## Why original PDFs were retained

Current inventory has 518 PDFs; the main extraction manifest represents 379 physical PDFs. Supplemental extractions exist, so this is not an assertion that exactly 139 documents lack JSON. A complete document/version/scope and source-image equivalence check for the entire current corpus has not been established. Bulk extraction also retains explicit review limitations.

Original PDFs remain direct, hash-bound evidence and support source-image checks that extracted text cannot reproduce. Current financial JSON, raw API responses, accepted financial facts and production database state were preserved. This storage decision does not reopen previously accepted VNM research or question the owner's source confirmation.

## Recovery and validation

Use `tools/maintenance/archive_backups.py --restore --apply` with the archive and optional exact `--path`; see the shared maintenance README. Recovery refuses to overwrite different existing content and is confined to the historical backup tree. Original native decimal strings, whitespace, metadata and source references survive byte-for-byte.

Nine archive safety/recovery tests pass, including corruption, changed source content, metadata drift, path escape, idempotent retry and overwrite prevention. Initial metadata/hydration failures were handled before accepting recovery; no failure was relabeled as success without actual full-byte verification.

Exact measurements, checksums, protected production fingerprints and recovery proof are in `MAINTENANCE_RESULT.json#/sections/STORAGE_CLEANUP`; the preflight target list is `STORAGE_COMPACTION_PLAN.json`.
