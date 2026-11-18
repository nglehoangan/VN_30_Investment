# Repository maintenance

Shared tools live here; domain calculations and approved executable bytes stay in their existing modules. Run from the repository root.

| Operation | Entry point | Writes |
| --- | --- | --- |
| File/reference inventory | `python3 -B tools/maintenance/audit.py --out /tmp/audit.json` | Only the specified report |
| One-ticker download index | `python3 -B tools/maintenance/catalog.py --ticker VNM` | Two indexes in that ticker directory |
| One-ticker verified PDF download | `python3 -B tools/maintenance/download.py --help` | PDF revision and receipt catalog for one ticker |
| Strict TypeScript validation | `node tools/maintenance/typecheck.mjs --help` | Explicit report destination; no emitted application code |
| Isolated regression tests | `node tools/maintenance/tests.mjs --help` | A required fresh report directory |

`common.py` contains canonical JSON, hashing, atomic writes and scalar ticker validation shared with the sequential rollout foundation. `documents.py` supplies content deduplication, canonical names and original-receipt reuse. Existing source-domain and redirect validation remains in `scripts/lib/vietstock_source_policy.py`; it is not duplicated here.

## Storage

- `data/manual-download/<TICKER>/`: source documents and ticker-local indexes. New PDFs use `TICKER__TYPE__PERIOD__SCOPE__sha12.pdf`. Unknown metadata stays `UNKNOWN`. Keep original URLs, receipts, source names and full SHA-256 in the catalog.
- Existing pinned source paths stay valid. Exact duplicate bytes may use hardlink aliases; never edit a retained PDF in place. Create a new revision instead. Same bytes do not resolve conflicting scope labels.
- `document-catalog.json` indexes individual receipts; `document-inventory.json` also lists files without an indexed receipt. Receipt hash claims are verified against bytes before cache reuse. An index grants no admission authority.
- `data/manual-extracted-pdf/`, `manual-extracted-api/`, `combine/`: retained source extraction and derived data. Do not rename these without updating actual consumers and respecting immutable source pins.
- `docs/`: approved contracts and historical execution evidence. Current maintenance navigation/results are under `docs/maintenance/`; do not rewrite historical approval receipts to make paths look uniform.
- `outputs/`: user deliverables. `backups/`: recovery material. Neither directory is disposable merely because its files are old.

## Retiring scripts

Inventory references from source, tests, package commands, Skills, policy and authority bindings before removal. An unreachable candidate is not proof of disuse: dynamic paths, historical replay and hash maps require review. Record retired path, original hash, Git identity and replacement command. Preserve a script required by an immutable approved artifact unless a governed successor legitimately replaces it. Do not run old one-off deployment/reset scripts during cleanup.

The audit inventories all non-generated paths, scans source/document references, and reports unreadable local placeholders. Tracked placeholders can be examined from Git blobs; unmaterialized untracked files are retained. This is a dependency and storage audit, not a claim that every historical financial judgment was requalified.

The default scan protects historical result payloads. `--include-historical-payloads` adds their reference inspection explicitly. Concurrent filesystem reads are confined to inventory; ticker workers retain concurrency one.

## Validation

```sh
python3 -B -m unittest discover -s tests/unit -p 'test_document_store.py' -v
python3 -B -m unittest discover -s tests/unit -p 'test_single_ticker_rollout.py' -v
node tools/maintenance/typecheck.mjs --config <existing-config> --out /tmp/typecheck.json --dependencies <frozen-dependency-root>
node tools/maintenance/tests.mjs --config <existing-validation.config.mjs> --dependencies <frozen-dependency-root> --out-dir /tmp/new-validation-report -- <test-file>
```

No maintenance tool authorizes scoring, deployment, publication, trading or historical PIT. Universe membership is checked by the download execution guard at the supplied version/reference date; read-only cataloging does not infer membership.

`tests.mjs --diagnostic-timeout-ms <milliseconds>` records a separate diagnostic run with unchanged assertions and integrity controls. Retain the original timeout result; a diagnostic run does not rewrite it or grant release authority.
