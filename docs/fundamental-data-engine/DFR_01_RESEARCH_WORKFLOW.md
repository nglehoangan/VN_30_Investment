# Data-First Research — DFR-01

Owner approved the proposal and six-issuer read-only pilot on 2026-11-04. See the [approval and M1–M8 successor impact](dfr-01/APPROVAL.md) and [original proposal](dfr-01/PROPOSAL-v0.1.md).

Start with the [pilot report](dfr-01/2026-11-04/REPORT.md). Each issuer has readable Markdown plus a JSON dossier with exact row/variant/pointer identity, native values, source evidence, dependency references, rubric dispositions and deferred prerequisites. The [exception queue](dfr-01/2026-11-04/exceptions.json) identifies review work without converting gaps into zero scores.

The pilot reuses `readRetainedResearch` and exact pinned `investment-research-v2`/R4 inputs. Checked capital readings are predecessor overlays, not a new full-statement image review. API replay compares original numeric tokens without JavaScript number conversion. Neither original extraction JSON nor approved financial contracts are edited.

Run on the project's supported Node 22:

```sh
node scripts/build-dfr01-pilot.mjs
node --test scripts/test-dfr01-pilot.mjs
```

The fixed run is FY2025 AS_REVISED, with cutoff at the end of 2026-11-04 Vietnam time. This is a research snapshot cutoff, not proof of issuer publication or historical availability. `AS_KNOWN` and different cutoffs are rejected; a different research snapshot requires a new run directory and review. Retrieval timestamps stay distinct from reporting dates and execution timestamps. `EXECUTION.json` records the actual local execution time and manifest hash without claiming authenticated model/session attestation.

Publication requires input hashes and protected application/baseline/database bytes to remain unchanged. Read only a run whose manifest hashes validate. If a replay fails, its run manifest is invalidated; prior artifacts remain audit history until a successful corrected replay. Do not use these exports as formal scorer, ranking, decision, DCA, ledger or NAV inputs.

Owner dossier review and the decision to expand to 30 issuers remain the next stage. Formal route-specific acceptance, DI1–DI15, strict-v2 and relevant share/action/market/valuation prerequisites remain separate. This pilot does not close production-release gates.
