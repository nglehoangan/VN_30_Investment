# Local backup and restore operation

Owning requirements: M6.1 REQUIREMENTS FR-19, NFR-7, IB-5; IMPLEMENTATION_PLAN §9 backup proof; SECURITY §§22–24. This addresses an initially Major missing operational capability without changing accounting or investment policy.

Use the pinned Node 22.23.2 runtime. The command uses Node's bundled SQLite implementation (experimental in this runtime), read-only source connections and SQLite `VACUUM INTO`. SQLite documents this as a consistent snapshot operation that leaves the source unchanged: https://www.sqlite.org/lang_vacuum.html. It does not copy a live database file or promise support for arbitrary off-device backup systems.

```sh
# Explicit private destination; DATABASE_URL or .env.local selects the existing source.
pnpm db:backup /absolute/private/directory/backup.sqlite

# Explicitly create a separate restore candidate. Never replace an existing database.
pnpm db:restore /absolute/private/directory/backup.sqlite /absolute/private/directory/restored.sqlite
```

The destination and its parent must be private (file 0600, directory 0700); public/build paths and physical symlink aliases are rejected. Existing targets, sidecars, source/target identity, source symlinks and hardlinks are rejected. The command stages the snapshot privately, validates SQLite integrity and foreign keys, checks artifact IDs/hashes and approved installed migration checksums, records app/schema identity and portfolio ledger watermarks, fsyncs data, and publishes with atomic no-overwrite hard links. A checksum manifest is mandatory for restore. Schema, table counts and every exact logical row digest must match before publication. An invalid snapshot is removed without touching source history.

The database and `.manifest.json` sidecar are a pair. Missing/tampered manifests or changed database bytes block restore. Checksums detect corruption; they are not signatures authenticating an untrusted third-party backup. Keep both files on trusted, private local storage. No automatic upload, network provider, broker credential or encryption-key mechanism is added. The approved security baseline permits reliance on encrypted local device storage; shared/cloud/removable destinations need the separate data-protection review already specified by that baseline.

Restore invocation explicitly requests a **candidate**; it never changes DATABASE_URL or activates capital actions. Before activation, run migration status with the candidate path, deliberately configure the candidate, restart, and inspect authoritative reconstructed holdings/cash plus current reconciliation/data status. Current NAV/actionability still require the externally configured normalized current-source dataset, fresh prices/reference data and independent reconciliation. Missing or inconsistent evidence blocks current capital actions. A backup includes embedded historical analytical evidence; it does not copy `.env.local`, credentials or an external current-source file. Retain original source datasets under their existing privacy/provenance controls.

Application reads reconstruct from M6.3 ledger facts and do not trust backed-up projection payloads. Tests restore into disposable databases, compare exact ledger/leg/method/score/rank/decision/review/proposal rows, reconstruct identical accounting state, replay historical artifacts and confirm immutability triggers still reject destructive edits. The exact Git-baseline protocol additionally backs up/restores nonempty marginal and original/superseding review history, then repeats all owner replay checks; see POPULATED_BASELINE_PROTOCOL.md. No real portfolio DB is used during validation.

An interrupted operation can leave an incomplete private staging directory or, between the two hard-link publications/unlinks, a target without its complete sidecar or with multiple links. Such files are not successful backups and fail the existing private-file/manifest checks. Retain the original, remove only the failed operation's disposable output after inspection, and rerun to a new destination. No command treats incomplete output as usable. Power-loss recovery and off-device restore are not claimed beyond SQLite/fsync guarantees and this local validation.
