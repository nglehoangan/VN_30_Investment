# Standing authority per version — CIO review

**Implemented the explicit owner amendment. U1's mandatory independent per-material gate is CLOSED/SUPERSEDED.** Approved version scopes now drive automated source trust, per-observation validation, replay and governed admission. No independent approval is fabricated and no source approval is requested again.

## Real-data acceptance

| Scope | Actual result in isolated SQLite |
|---|---|
| F1 CaféF VNM, 16 October 2026 | ADMITTED_AND_CONSUMED; RAW CLOSE **57,800 VND/share**; freshness/replay PASS |
| F1 requested cutoff, 30 October | **BLOCKED_U2**; retained membership coverage stops 16 October; no substitution of 16 October for the requested cutoff |
| F2 selected statement fact | ADMITTED_AND_CONSUMED; VNM consolidated TOTAL_ASSETS, 30 June 2026, **57,451,803,693,875 VND** |
| Duplicate ingestion | Returns original market/financial admission; accepted counts unchanged |
| Independent material receipts | **0 required; 0 created** |
| Historical PIT | NOT_QUALIFIED; current-only financial evidence rejected |
| Production activation | NOT_AUTHORIZED |

Actual stores contain two Capability/Market boundary records for one market observation, one financial admission run and eight bounded financial raw captures. The 4.35 MB original PDF is retained losslessly in three parts, with ordered reconstruction and whole-file SHA verification; the existing 4,000,000-character payload bound was not raised. Source URL/receipt, exact receipt catalog pointer and authority version are retained in the admitted financial verification result.

This demonstrates real ingestion and consumption through the existing lifecycle/repository/Evidence boundaries. The database is disposable, the Next server-marker alias is confined to the Node verification harness, and no application route is activated. The F2 demonstration is one bounded fact, not a complete current valuation or /100 score. Snapshot-wide DI14/DI15/scoring flags are preserved; they are not fabricated as approved or used to reintroduce the superseded per-material source gate. The current source-native financial adapter supports retained qualified statement/direct-PDF TOTAL_ASSETS; other concepts/actions/API-native adapters remain unqualified unless their own controls and version qualification are established.

## Controls and validation

**253/253 scoped TypeScript tests**, including21 new version-authority cases, and **34/34 Python tests** pass. Scoped typecheck, architecture (302 modules), Prisma schema, **144 governance/preservation checks** and skill validation pass. Four real-workbench outputs replay byte-identically. The existing migration dry-run also passes on a private copy of active SQLite; integrity is `ok`, foreign-key violations zero. No new schema/table/migration is added by this amendment. Full application suite/typecheck/build/lint were not run.

Negative tests cover all four source states, untrusted/spoofed URLs, issuer/security spoofing, changed schema (including extraction schema), changed raw/code hash, financial conflicts within a batch and across accepted snapshots, duplicates, authority/record revocation, PIT and membership enforcement. A new material hash/file alias under the same approved version requires no independent material registration. A user REVIEWED/PASS claim cannot replace trusted capture, native or qualified semantic evidence. Source trust by itself does not satisfy domain validation.

The final immutable definition is [VERSIONED_SOURCE_REGISTRY.json](VERSIONED_SOURCE_REGISTRY.json), `owner-standing-authority-v4`, authority entries version 4. Initial implementation trials are preserved for audit. These version bindings implement the current owner's explicit policy decision; they do not claim personal owner code inspection, independent material signoff or production release. Changed implementation bytes/schema/roles/policy suspend ordinary admission until a controlled approved version exists; ordinary ingestion never rewrites the registry.

## Preserved boundaries

- **U2 stays separate:** exact missing membership interval 17–30 October 2026. No Master rebuild, interval extrapolation or unrelated downloads.
- **VNM17 remains pending.** The selected financial fact is TOTAL_ASSETS, not a dividend/share-count fact from that proposal. The 30 October price in that proposal is not admitted here. R1/R4 remain CLOSED; R3 remains historical completeness only.
- Current formal evidence uses actual recorded operational knowledge, preserves original receipts/reviews and does not invent publication time. Historical PIT requires its separate publication/availability contracts.
- Active SQLite stays SHA-256 `47d1dd391afb895e70d942f96f148e16d9982646998f9c59b5b36cc59ca2cb65`. Original raw/extracted inputs, combined VNM data and the VNM17 packet remain unchanged. No portfolio transactions, cost basis, NAV or M3/M4 logic changed.

## Review artifacts and next actions

- [STANDING_AUTHORITY_AMENDMENT.md](STANDING_AUTHORITY_AMENDMENT.md): exact amendment, compatibility and initial revision notes.
- [VERSIONED_SOURCE_REGISTRY.json](VERSIONED_SOURCE_REGISTRY.json): code/provider/adapter/schema/role/policy bindings and owner-decision provenance.
- [SOURCE_TRUST_POLICY.md](SOURCE_TRUST_POLICY.md): verification rules, trusted catalogs and scope limits.
- [F1_F2_REAL_ADMISSION_VALIDATION.json](F1_F2_REAL_ADMISSION_VALIDATION.json): actual successful admissions, consumption, duplicates and U2 rejection.
- [U1_FINAL_CLOSURE.md](U1_FINAL_CLOSURE.md): closure basis and preserved pending states.
- [VALIDATION.json](VALIDATION.json): exact test scope, implementation file list, hashes, replay, migration and preservation evidence.

Reproduce the isolated demonstration with `node scripts/validate-standing-authority.mjs`; verify invariants with `python3 docs/fundamental-data-engine/standing-authority-version/2026-11-12/validate-package.py`. Do not rerun authority initialization as a way to admit changed code. New trusted capture/extraction catalog snapshots are evidence updates, not per-material source-approval requests.

CIO review should assess the implemented version bounds and real-source evidence, resolve U2 independently before 30 October F1 use, and keep unsupported mappings quarantined. No repeated standing-source or per-material approval is requested for unchanged approved scope. Any later production migration/activation requires separate authorization.

**STOP for CIO review. Production activation remains NOT_AUTHORIZED.**
