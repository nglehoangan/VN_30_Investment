# Maintenance records

See [shared tools and storage conventions](../../tools/maintenance/README.md),
[script routing](../../scripts/README.md), and the [2026-11-18 cleanup report](2026-11-18/REFACTOR_REPORT.md).

This directory records engineering cleanup. Approved research, source authority, scoring authority and publication evidence retain their original identities and locations.

## Owner backup removal — 2026-11-19

The owner explicitly requested deletion of existing backups and archives. `backups/` and `data/deployment-backups/`, including the cold presentation ZIP and its manifest, were removed. The 2026-11-18 archive recovery instructions are historical; those copies are no longer available. Live database and source PDF/JSON were preserved. See [removal receipt](2026-11-19/BACKUP_REMOVAL.json). This records removal of existing copies and does not waive backup prerequisites for a separately authorized future deployment.
