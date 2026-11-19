# Single-ticker VN30 scoring CLI

Run from the repository root with Python 3. The cutoff and approved universe version are both required. The examples use a covered economic date. Membership coverage ends on 15 November 2026 in this version.

```sh
python3 scripts/vn30_score.py --ticker ACB --mode check  --universe-version vn30-20260803-reviewed-20261115 --cutoff 2026-10-30
python3 scripts/vn30_score.py --ticker ACB --mode status --universe-version vn30-20260803-reviewed-20261115 --cutoff 2026-10-30
python3 scripts/vn30_score.py --ticker ACB --mode score  --universe-version vn30-20260803-reviewed-20261115 --cutoff 2026-10-30
python3 scripts/vn30_score.py --ticker ACB --mode resume --universe-version vn30-20260803-reviewed-20261115 --cutoff 2026-10-30
```

- `check` reports source inventory, admitted data at the exact cutoff, the qualified sector, and mapping and authority blockers. When a route is registered and the inventory gates pass, it calls the governed preflight through a SQLite read-only connection. The evidence file inventory reports presence and size. It does not qualify file contents or period coverage.
- `status` reads the exact execution checkpoint and verifies any result hash through the orchestrator. `NOT_STARTED` applies only to this CLI's execution. Existing score inventory is available via `check`.
- `score` creates a one-ticker plan, checkpoints prerequisite checks, and dispatches the governed engine only after preflight and exact authority pass. A completed execution returns its recorded result. A blocked, failed or interrupted execution requires `resume`.
- `resume` uses the same execution and operation key. The engine accepts a duplicate artifact write only if the stored body and hash are identical. An authority, route or input revision changes the execution identity and requires a new `score` invocation. Previous attempts remain in the execution store.

Output is JSON. Exit code 0 means a successful read, a ready preflight, or a completed execution. Code 1 means blocked or incomplete. Code 2 means invalid arguments, invalid scope, or an unreadable control dependency. An uncovered date is unverified coverage.

The sequential store is `outputs/vn30-rollout/`. The SQLite target is `data/vn30.sqlite`. Inventory expects a quiescent SQLite database and stops if a rollback journal or WAL sidecar is present. The CLI uses the existing S1–S5 guard and current-purpose engine. Ticker research, source ingestion, dataset preparation and assessment adoption remain in their existing workflows. The CLI cannot confer deployment, publication, trading, portfolio or NAV permissions.

## Registering a governed route after CIO review

`scripts/vn30-score-routes.json` is reviewed repository configuration. It has no enabled entries in this delivery. A registration must include the following:

- `subject` binds ticker, security ID, exchange, qualified sector, universe version and registry hash, cutoff and current-formal purpose.
- `database` binds the repository's exact SQLite target.
- `adapter` pins the ticker-specific module. Its `createCurrentDatasetConsumer(reader, root, subject)` factory composes the existing `CurrentPurposeScoringConsumer` with the original governed admission, market, share and binding services. The expected data-acceptance receipt must already exist. Use the same dependency pattern as the retained VNM reader with independently qualified ticker inputs.
- `assessment` pins the exact adoption packet, including its reference ID. `reference` pins the pre-scoring dataset reference. `reviewBindings` carry the original review trust pins. `executable` pins the approved scoring executable and methodology authority.
- `preflightHash` is the existing scoring engine's canonical authorization hash for these inputs. `authorization` pins a separate owner receipt with contract `vn30-single-ticker-score-approval-v1`, authority `PROJECT_OWNER`, scope `CURRENT_SCORE_ARTIFACT_ONLY`, `recordedAt`, `approvalHash`, exact `statement`, and a hash-pinned verbatim `source`. The approval hash covers the canonical registration excluding the authorization pin. The statement format is `Approve exact single-ticker VN30 score <approvalHash> for <TICKER> at <YYYY-MM-DD>`. The revocation target is `vn30-score-approval:<approvalHash>`.

The Node bridge uses the repository's supported Node version, installed dependencies and generated Prisma client. It checks the approved route and re-verifies the existing assessment, dataset and executable authority. A new registration also needs a complete verified executable bundle. The retained VNM executable pins `scripts/generate-current-scoring.mjs`, which is absent after the owner-requested root scripts removal. Preserve the historical pin and resolve the executable dependency through the existing governance workflow before any live use.

## Readiness recommendation

The [review queue](SCORING_ROLLOUT_QUEUE.json) covers all 30 constituents at the explicit 30 October cutoff. Retained report artifacts were present for all 30. The current dataset and score inventory has one ticker, VNM, which belongs in readback only. The other 29 had no exact-cutoff current dataset or registered scoring authority. Alternate retained evidence may still support their preparation.

Prioritize **ACB**, then **HPG**, for route preparation and CIO review. ACB has the retained bank-group Level 1 review, and HPG has separate decision-grade and debt-contract evidence. Since no separate provisional order was supplied, the ACB example breaks the tie. The remaining closure candidates follow alphabetically until ticker-specific readiness evidence justifies reordering. MBB is last because the Level 1 evidence still lists it as deferred. There is no live execution priority.

**STOP for CIO review before live execution.**

## Validation on 19 November 2026

- Six CLI tests and 18 orchestrator tests passed. Successful scoring and interrupted retries used synthetic workers. The real Node bridge rejected an unregistered ACB preflight.
- The read-only audit completed for 30 securities. The SQLite SHA-256 after validation was `0876f70a76b8d89efe1d33559ff2d68b4f8b50bdccb2e510562fd4dc748d8e51`. Node syntax and Git whitespace checks passed.
- No new ticker was scored. The registered-route success path was not exercised against live data.
