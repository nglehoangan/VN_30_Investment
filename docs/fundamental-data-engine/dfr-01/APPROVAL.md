# DFR-01 — approved design and pilot

Owner approval received in this session on **2026-11-04**: “Approve bản dự thảo hãy thực hiện nó”. The approved proposal is preserved byte-for-byte in [PROPOSAL-v0.1.md](PROPOSAL-v0.1.md); its original pending-review disposition is historical and superseded by this receipt.

Authorized: the two-track research design and read-only pilot for **FPT, VNM, BID, TCX, VIC, VHM**, 30-issuer inventory, item provenance, exception queue and replay validation. Research defaults to FY2025 AS_REVISED. FY2022–FY2024 and interim variants remain separate until comparability is qualified. Existing M1–M8 baselines and seals remain historical records.

Implementation is an isolated file-export workflow using the existing retained-research loader. No application route, database persistence, production scorer, registry, weight, investment rule, decision, DCA, cash, ledger or NAV change is part of this pilot. No external acquisition is necessary. Any later acquisition follows the current Vietstock-only policy.

After pilot: owner reviews the dossiers and validation before expansion to 30 issuers. Formal acceptance, production activation and deployment remain separate decisions under existing contracts. This approval does not authenticate model/session provenance or close any formal gate.

Run with supported Node 22: `node scripts/build-dfr01-pilot.mjs`. Validate with `node --test scripts/test-dfr01-pilot.mjs`. Output entry point: [pilot report](2026-11-04/REPORT.md).

## Successor impact on M1–M8

| Milestone | Pilot implementation and boundary |
|---|---|
| M1 | Approved rubric definitions/bands read unchanged; each judgment retains rubric identity and predecessor. No weights or policy amendment. |
| M2 | Thirty-shard inventories per layer verified; row IDs use variant and exact pointer, not label/amount equality. Native decimal strings, units, scope and period retained. |
| M3 | Exact reviewed capital operands replayed with integer arithmetic and explicit scale; no generic provider-unit inference. Unsupported metrics/rubrics remain deferred. |
| M4 | Dossiers export references only; no decision artifact, Buy/Sell or sizing input. |
| M5 | Thesis, counterevidence and item exception queue retained in separate dossiers; protected-state fingerprints cover operating code and SQLite. |
| M6 | Existing retained-research loader reused; isolated JSON/Markdown exports. No dashboard activation is needed for this file-based pilot. Formal DI and AI validators reject pilot objects. |
| M7 | Deterministic replay, source-pin verification, adverse fixtures and protected-state comparison; scoped verification does not close historical/forward/release tests. |
| M8 | Reused R4 judgment remains provisional. Evidence handoff requires independent route-specific revalidation, exact snapshot/seal and authenticated sign-off; research statuses cannot be copied as acceptance. |

Stop publication on lineage/protected-state failure. Exports are first built in memory and the manifest is written last. A failed replay invalidates the existing run manifest, preserves prior artifacts as audit history, and requires corrected inputs plus a new successful replay before use.
