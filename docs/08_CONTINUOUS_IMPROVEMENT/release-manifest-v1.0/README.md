# VVIOS v1.0 Release Manifest

Exact source commit: `14aa8b2b1052ffb297edadd298ce90c0fb246779` (`Complete M8`).
This detached evidence package was created after that commit. It is not part of
its inventory and does not change its identity. A later commit containing this
package must not be substituted for the release source SHA.

Verification: **PASS for source identity and hashes**. All 758 regular artifacts
from `git archive` were independently read again and checked, including 11
Prisma schema/migration artifacts. Inventory covers application source, build
configuration/lockfile, tests, policy/model source, documentation and committed
validation evidence. Coverage is not approval of every document or endorsement
of historical validation results.

- `manifest.json`: exact Git commit/tree, categorized artifact inventory with
  byte sizes and SHA-256, schema/migration digest, package/build source identity,
  local build observations and freeze status.
- `manifest.sha256`: SHA-256 of the manifest bytes.
- `verify.py`: rerunnable verification using Git objects without checking out or
  executing the release application.
- `verification.json`: captured verification result.

Run from the repository:

```sh
python3 docs/08_CONTINUOUS_IMPROVEMENT/release-manifest-v1.0/verify.py
```

The checksum proves consistency when its expected value is trusted; it is not a
digital signature or reviewer approval. The verifier pins the named commit,
regardless of current HEAD or working-tree changes. A complete production
verification additionally needs trusted signed evidence and deployed artifacts.

## Schema and build identity

Schema identity includes `prisma/schema.prisma`, all nine migration SQL files,
and `migration_lock.toml`. This identifies migration source, not the applied
migration state or logical schema of any live database.

Release target `VVIOS v1.0` is distinct from package version `0.1.0`.
Build source identity is `git:14aa8b2b1052ffb297edadd298ce90c0fb246779`;
Next.js is pinned to `16.3.4`, Prisma to `7.10.0`, and the lockfile is inventoried.
No compiled build is certified. The existing local `.next/BUILD_ID` has no
verified provenance linking it to this commit, so it is only an observation.
Local Node `v22.12.0` does not meet the declared `>=22.23.2 <23` requirement.
Build execution and compiled artifact hashes remain pending in a compatible
runtime with controlled configuration and captured exact-commit provenance.

## Freeze status

**Source: pinned. Production release: NOT FROZEN / NOT AUTHORIZED.**
The commit provides immutable source identity; this package freezes its inventory
by content hashes. No release tag points at the commit at capture time.
Production acceptance remains **NO-GO — EVIDENCE PENDING**, as stated in
`../PRODUCTION_ACCEPTANCE.md`. PA1 is not promoted to PASS by source verification:
compiled build, runtime/schema/configuration identities, active policy/model
registry approvals and final sign-offs remain pending. Other M7/M8 gates are
unchanged. In particular, historical validation remains BLOCKED / NOT EXECUTED.

Runtime secrets, live portfolio databases, backups and generated outputs are
excluded from this source inventory. Their controlled identities/evidence must
be added to a separately authorized production release package before GO.
