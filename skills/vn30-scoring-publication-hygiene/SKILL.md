---
name: vn30-scoring-publication-hygiene
description: Preserve canonical and replay evidence while planning safe cleanup after verified VN30 website publication. Use for single-ticker publication handoff, audit retention and approved scratch removal.
---

# VN30 scoring publication and retention

Use the [single-ticker contract](../vn30-rollout-orchestrator/references/single-ticker-contract.md). Each ticker retains its own route, approvals, result and readback. Keep scratch and failed diagnostics in one private temporary directory per execution. Persist only artifacts needed for decisions, recovery or replay.

Follow assessment → two reviews → prepare → exact CIO approval → authorized check → score → separate publication approval → website publication → website readback → safe cleanup. A SQLite publication envelope, a renderer test or a completed scoring command alone does not establish successful website readback. Verify HTTP on the intended website, the scorecard ID and cutoff, exact publication hash, coverage/interval/N/R presentation, version and allocation restrictions. Display previous published versions and reassessment tracking independently of draft research.

| Class | Retain |
| --- | --- |
| KEEP_CANONICAL | Published artifact, publication manifest, receipt, website readback and Future Evidence Register |
| KEEP_ARCHIVE | Unique source, dataset, methodology/executable, assessment and review pins, owner approvals, preflight, execution evidence and historical versions |
| PRUNE_CANDIDATE | Explicitly listed, redundant and unreferenced working files whose bytes are known |

Use [the cleanup operation](../../tools/maintenance/scoring_cleanup.py) and its [operating guide](../../tools/maintenance/SCORING_CLEANUP.md). Build an explicit SHA-256 allowlist. Inventory and classify first. Resolve references by path/basename and digest, including stored lineage, before treating a file as disposable. Retain unclear or undiscoverable dependencies. Dry-run is the default. After matching website readback, show the exact dry-run plan to the owner and obtain approval for its digest before apply. Copy and verify the rollback archive before removing any file. Use rollback for a mistaken or interrupted apply. Preserve Git history and approvals throughout.
