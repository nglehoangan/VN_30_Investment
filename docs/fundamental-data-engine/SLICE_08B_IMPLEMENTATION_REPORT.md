# Slice 08B — controlled real initialization, partial raw stage

Baseline: `28773bc` (Slice 8 preparation). User selected new `data/initialization-08b.sqlite`, the existing issuer source links and reporting coverage from 2025 through Q2/2026. In the absence of a separate historical cutoff, collection uses current operational knowledge; original publication time is not inferred. **Full VN30 initialization is incomplete.**

## Executed on 2026-10-10 (Asia/Ho_Chi_Minh)

The existing FPT collector fetched the official investor page and Q2/2026 PDF, then nine consolidated-report candidates discovered on the official disclosure page. Candidate labels cover Q1–Q4/2025, reviewed H1/2025, audited FY2025, Q1/Q2/2026 and reviewed H1/2026. Labels/discovery do not independently qualify report contents, precise publication clocks or normalization. Original and reviewed vintages remain separate. Q2/2026 was retrieved in both executions; identical PDF body hashes are retained with distinct execution/capture lineage. There are nine distinct PDF URLs, ten PDF retrieval instances and two landing-page retrievals, represented by 52 immutable chunk/envelope captures.

A new initialization database was installed through existing migrations with an explicit URL and `--no-env-file`. One FPT source, two PARTIAL imports and 52 raw captures were appended using the existing application ingest/repository. **Canonical observations 0; sealed snapshots 0; DI acceptances 0.** No portfolio DB, private account capture, environment file, real score/rank, Top 10 or trade execution was accessed. Raw files/DB and receipts remain ignored under private `data/`, with owner-only database/capture permissions.

Public redacted evidence: `evidence/2026-10-10-08b-raw-initialization.json`. It records actual manifest/document hashes, capture IDs, public issuer URLs, exact retrieval clocks, counts, every source-register candidate's raw status/blockers and NOT_EXECUTED gates. The 30 research/four supplemental candidates are not asserted as an official universe. Only FPT has collected report history in this run; other candidates explicitly remain NOT_COLLECTED.

## Code and concrete commands

`initialize-08b-raw.mjs` requires explicit absolute database and manifest-directory arguments. It checks manifest SHA-256, exact FPT source metadata, capture/batch bindings and resource allowlist, then reconstructs successful complete PDF chunks with the existing reader before any initialization write. PUBLIC_HTTP is transport metadata, not independent authenticity or entitlement certification. A new target is required by default; existing files/journals/receipts are refused. No .env loading, canonical observation, qualification, snapshot, DI or scoring options exist.

Explicit `--append-raw` is limited to an already marked raw initialization target with zero observations/snapshots/acceptances/portfolios. Existing import/capture/source records stay immutable. Each execution has an exclusive new receipt; the initial receipt is preserved. A failed run is not erased or silently retried as a new database. The existing collector's Node TypeScript hook was moved to a shared CLI runtime, preserving its behavior.

Executed commands, after isolated synthetic tests:

```sh
node scripts/initialize-08b-raw.mjs \
  --database /Users/nglehoangan/Documents/Working/VN_30_Investment/data/initialization-08b.sqlite \
  --manifest-dir /Users/nglehoangan/Documents/Working/VN_30_Investment/data/initialization-08b-captures/fpt-20261010-01

node scripts/initialize-08b-raw.mjs \
  --database /Users/nglehoangan/Documents/Working/VN_30_Investment/data/initialization-08b.sqlite \
  --manifest-dir /Users/nglehoangan/Documents/Working/VN_30_Investment/data/initialization-08b-captures/fpt-20261010-history \
  --append-raw
```

These have already run; do not rerun them. Duplicate batch identities are rejected. Private manifest hashes and import receipts are preserved. Python's local TLS trust store failed for a discovery request; the Node TLS stack succeeded with certificate verification retained. No insecure TLS override was used.

## Remaining blockers

No official universe/sector/market package or independent document, normalization, formula, publication/receipt, registry/mapping/crosswalk/policy/requirements review capabilities were supplied. Existing links authorize discovery/collection but do not establish these independent approvals. FPT mapping and canonical releases still declare PROPOSED; they are unchanged. Other issuers lack executed collection/qualified routes in this run. Financial calculations cannot be admitted without manufacturing authority or changing approved fail-closed controls.

DI1–DI15 remain NOT_EXECUTED. No qualified canonical dataset, snapshot or reviewer sign-off is claimed. Raw PDF hash integrity is measured evidence for collection, not DI5/DI6/DI11 PASS. Current retrieval cannot prove local operational knowledge in 2025 or June 2026. Do not use these raw records for FORMAL scoring. Next execution needs reviewed issuer routes and exact interpretation/document packages, official membership/sector/market inputs and independent DI review. No Slice 9 or downstream investment logic.

## Frozen-tree verification gates

This handoff is released only after actual results match:

| Check | Required result |
| --- | --- |
| Raw initializer plus existing FPT CLI/collector | 3 files / 10 tests passed |
| Complete unit/integration/architecture | 75 files / 955 tests passed |
| TypeScript, ESLint zero warnings, boundaries | Passed; 139 source modules |
| Token-session regression | 3 passed |
| Prisma validate/generate, explicit harmless URL and --no-env-file | Passed |
| git diff --check and new-file whitespace | Passed |
| Source/test/config/report SHA-256 inventory before/after full run | Identical |

Tests use owned temporary synthetic databases/captures and verify new-target creation, checksum rejection before DB creation, no inherited DB use, zero canonical/snapshot/DI records, overwrite rejection without changing DB bytes, explicit raw append and preservation of the first receipt. Real execution is separately evidenced above; synthetic PUBLIC_HTTP labels grant no qualification. No UI/Next/schema/formula change. Logs are outside the repo at `/private/tmp/vn30-08b-*`.

Serial self-review: existing immutable repositories and generic chunk integrity remain authority; source discovery is separate from financial qualification; operational knowledge and vintages remain explicit; unresolved real initialization blockers are retained. This is implementation self-review, not independent data-quality acceptance. Status: partial raw-stage execution complete; **Slice 08B full initialization BLOCKED** pending the listed inputs/reviews. No commit or push.
