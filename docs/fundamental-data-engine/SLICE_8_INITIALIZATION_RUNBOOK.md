# Slice 8 — controlled initialization runbook

Status: preparation implemented; real dataset initialization BLOCKED. The source register is discovery evidence, not an approved constituent master, source license, publication proof or initialized dataset.

## Repository preflight (implemented, read only)

Run from any directory with Node 22:

```sh
node /absolute/path/to/VN_30_Investment/scripts/fundamental-initialization-preflight.mjs
```

To prepare a particular target/as-of for review (this still does not open the target):

```sh
node scripts/fundamental-initialization-preflight.mjs \
  --target /absolute/private/initialization.sqlite \
  --as-of 2026-10-09T10:00:00.000Z
```

The second invocation is an illustrative planning command, not approval of that target/date. stdout is a redacted JSON packet; stderr rejects invalid arguments without printing their contents. A successful process exit means preflight completed, **not initialization PASS**. Consumers must inspect `kind`, `status`, `dataset`, `formalUniverseCount` and DI statuses. There is no `--execute`/`--approve`, network fetch, environment loading, database connection, scoring or automatic PASS path. Target paths are hashed and withheld. Fixed repository files are pinned by SHA-256; the packet has its own hash. Regenerate after source/governance documents change.

The dated checked-in packet has no target or dataset. It accounts for every research/supplemental candidate separately with explicit unknown readiness and blockers. A count of 30 research candidates does not establish current official VN30 membership. All DI1–DI15 remain NOT_EXECUTED with no measured dataset evidence or reviewer sign-off. Repository preflight is not financial-data validation.

## Inputs before real execution

Owner supplies the reporting windows, decision/system-known/fundamental/market cutoffs, exact database path and isolation/backup plan. Supply official dated universe membership with stable Security identifiers and effective intervals; approved dated sector mappings; market inputs and adjustment/freshness policy; required issuer reports/capture history. Market/fundamental observations must cover the entire official universe independently of portfolio holdings.

Source owners supply access/raw-retention evidence and approved issuer/provider configuration. Discovery URLs alone do not grant source qualification. Existing FPT collection and reviewed mapping are not a generic VN30 parser; other issuers need independently reviewed routes rather than FPT labels applied to every company. Capture original document bytes, complete import/error manifests and exact vintages. Missing original publication/history remains unknown; a fresh retrieval cannot create earlier operational knowledge.

Independent reviewers supply document qualification, exact source/registry/mapping/crosswalk/availability/sector/requirements/methodology hash bindings and publication evidence authority. Canonical/mapping/crosswalk PROPOSED releases must not be edited to APPROVED merely to unblock a run. Compose trusted repository capabilities independently; caller JSON/env approval claims cannot establish authority. Distinguish actual issuer timestamp, date-only public fallback/trusted receipt, local retrieval and ingestion. Reconcile normalization and formulas independently, preserving scopes, units, currencies and revisions. Unsupported sector routes remain blocked.

## Controlled execution sequence (not yet executable as a real import command)

1. Prepare a concrete command package containing exact source configurations, document/vintage list, membership/sector/market evidence, reporting windows/cutoffs, existing repository capability composition, DB target and backup/recovery steps. The public report includes redacted references and hashes, never credentials or account capture.
2. Obtain review of that exact package and command. DESIGN_REVIEW.md §G requires: “A controlled real import command must be reviewed with its actual source/database target before execution.” No real-import CLI is supplied yet because its sources, target, contracts and independent reviews are missing.
3. In an approved isolated target, preserve existing Security identities and use existing immutable ingestion, document qualification, normalization, derivation, availability and snapshot repositories. Enumerate all official members. Never overwrite source captures, canonical revisions or historical scores. Stop before writes if capability checks, target guards or source coverage fail. Partial imports retain error manifests and explicit blockers; retry uses new execution identity.
4. Independently reconcile each required fact to report page/field, normalization and sector route. Validate missing/null versus zero, FLOW/STOCK, standalone/consolidated, annual/YTD/TTM, capex sign, FX lineage, conflicting sources, corrections and latest constituent/review availability. Do not invent a fallback to obtain completeness.
5. Seal exact AS_KNOWN request through the existing snapshot repository with all immutable references, pins, versions, hash and cutoffs. Record actual runId/contentHash and replay/reopen evidence. A diagnostic AS_REVISED snapshot cannot substitute for FORMAL eligibility.
6. Produce a dataset-bound measured evidence report for each DI gate and each official ticker. Include unresolved issue register and reviewer roles/sign-offs. Explicitly mark unexecuted gates and missing/stale/unsupported tickers. Execute independent acceptance only with existing trusted DI review capability and exact reviewed input package; never manufacture all-PASS evidence.
7. Read the sealed run via `/data/<runId>`; select its exact independently verified acceptance if present. Historical readiness is not current actionability. Stop at Slice 8 review. Real scoring/ranking/Top 10 and live decisions require a separately approved INITIAL_SCORING_REPORT task.

## Evidence required by gate

| Gate | Dataset-specific evidence needed |
| --- | --- |
| DI1 | Official dated universe source/effective membership and independent verification |
| DI2 | Exact active member identities/count, duplicate/interval checks |
| DI3 | Complete approved dated sector mapping |
| DI4 | Required market records, source/adjustment/period/freshness checks |
| DI5 | Required issuer facts, source captures/qualification and completeness |
| DI6 | Independently reconciled period/unit/currency/scope normalization |
| DI7 | Required-item null/missing coverage with explicit exclusions |
| DI8 | Pinned-policy freshness and actual cutoff checks |
| DI9 | Conflict/impossible-value exceptions and resolution evidence |
| DI10 | Governed formulas, exact ordered canonical operands/review knowledge |
| DI11 | Original publication/receipt/local knowledge and cutoff/revision replay |
| DI12 | Exact sealed manifest/content hash, run envelope and reproducibility |
| DI13 | Every official ticker's verified all-input readiness or blockers |
| DI14 | Independent data-quality review bound to exact dataset and inputs |
| DI15 | Dataset issue register, no unresolved Critical/Major, independent closure |

Tests validate software contracts with isolated synthetic fixtures. They do not satisfy these gates for a real dataset.
