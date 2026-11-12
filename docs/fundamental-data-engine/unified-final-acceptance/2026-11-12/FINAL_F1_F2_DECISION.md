# Final F1/F2 acceptance remediation — CIO review

The CIO acceptance of the **unified architecture** is recorded. Existing owner standing-source approvals remain valid. This package requests no repeated source approval and grants no independent material or production approval.

| Final decision | Status |
|---|---|
| F1 | BLOCKED |
| F2 | PARTIALLY_CLOSED |
| Current Formal Valuation | NOT_READY |
| Historical PIT | NOT_QUALIFIED |
| Production Activation | NOT_AUTHORIZED |

## Real-data results

**F1:** retained CaféF VNM raw close at **16 October 2026 = 57,800 VND/share** passes raw identity, units, normalization and deterministic candidate replay inside the certified membership window. The actual ingestion entry point runs against a disposable SQLite database and returns `QUARANTINED / CAFEF_INDEPENDENT_MATERIAL_ACCEPTANCE_REQUIRED`. No accepted Capability/Market records exist from this run. The requested **30 October** candidate separately rejects `VN30_MEMBERSHIP_OUTSIDE_VERIFIED_INTERVAL`; it is not substituted with the 16 October observation. The separately qualified 30 October raw-price research observation is unchanged.

**F2:** one actual selected fact, VNM consolidated `TOTAL_ASSETS` at **30 June 2026 = 57,451,803,693,875 VND**. The subset uses one reviewed issuer statement, one retained original PDF and its native cell; it requires none of the unrelated historical CaféF files. Exact source hash `a6155aa757b320b893a78093b0454473f4a581aead225af4eb4ef1fbd6628561` matches the old reviewed document and its rebuilt alias. Physical PDF page9 (printed page8), consolidated caption, date column, VND heading, native lexeme and box were checked. The original candidate JSON stays UNREVIEWED; a separate bounded cell-check receipt explicitly grants no independent authority.

The actual existing hybrid financial validator, native decimal normalizer and current-use Evidence validator pass for this fact with no quarantined data defects. New native review/operational availability uses the recorded current time, while original import/review metadata and reacquisition receipts remain separate. Default/PIT use and a pre-knowledge cutoff reject. The actual financial ingest entry point rejects `INDEPENDENT_SOURCE_MATERIAL_ACCEPTANCE_REQUIRED`; **zero real financial admission rows** were written. This is a bounded admission test, not a claim that one asset balance supplies a complete valuation.

See [REAL_ADMISSION_VALIDATION.json](REAL_ADMISSION_VALIDATION.json) and [U3_SELECTED_FINANCIAL_FACTS.json](U3_SELECTED_FINANCIAL_FACTS.json). Real-data validation and a correctly blocked real admission are not labelled successful formal admission. Accepted storage/consumption/rollback remains demonstrated with synthetic authority fixtures only.

## U1 — one exact independent-review packet pending

Implemented `PinnedStandingRegistry` as the trusted host binding for both domains. It snapshots configured authorization pins and independently registered receipt hashes/reviewer/domain/policy. A JSON claiming `ACCEPTED` or `REVIEWED` cannot register itself. Unknown material, stale/mismatched hashes, superseded decisions, wrong policy/domain/reviewer/authorization and altered receipt bytes reject. A self-authored PDF witness can produce a provisional data check, but cannot independently reach financial storage or consumption. Future PDF witness review timestamps also quarantine. F1 now binds the shared registry and policy dependencies into its code material, so changing that boundary requires requalification.

[U1_MATERIAL_ACCEPTANCE.json](U1_MATERIAL_ACCEPTANCE.json) contains the exact two-domain packet, source/capture graph, versioned policies and **PENDING** decision templates with null reviewer/time. Material hashes:

- F1 bounded-window material: `25385db33db13403bca8d528515ea2ea4ce7be422f9abce308da4180d6ddd10a`.
- F2 selected-fact material: `d689b320da94fad044cc536e707296f115cd7ebd5c9aaf553abaa81c4ba018d0`.

**Contract:** `PinnedStandingRegistry`, `assertSourceMaterial`, `assertStandingTrust`; existing independent material/capture integrity gates are preserved. **Responsible authority:** CIO-designated independent source/material reviewer; trusted server composition custodian registers the resulting exact receipt hashes. **Smallest action:** independently review and accept this exact material/semantic/capture packet and record actual reviewer/time. No standing-source reapproval. Current code/normalizer hashes are not proof that the original collector executed those bytes; the retained capture handoff remains part of that review.

This packet can support the bounded 16 October F1 demonstration and the selected F2 fact. It cannot authorize a 30 October F1 observation while U2 remains unresolved. Resolve U2 and refresh the F1 profile/hash before seeking requested-cutoff material acceptance; do not backdate the eventual independent approval or rewrite this review's times. Actual accepted ingestion after approval must use its new operational execution time.

## U2 — exact missing membership interval

The retained official July notice has announcement date **15 July** and effective date **3 August**. Both official history-review packages establish complete subsequent-change history through **16 October** only, including the package replayed on 17 October. A document review date is not an effective exit date. The initialization identity rows label their start as version coverage and have null ends; those rows do not independently certify subsequent-change coverage after the reviewed interval.

No qualified timeline extending across **17–30 October 2026 inclusive** was located in the inspected Master, initialization and two official reconstitution-history packages. Active SQLite contains security identity but no membership/coverage/index-event timeline tables. This is a bounded finding, not a corpus-wide negative search. The Master's rule that a genuinely qualified open membership interval continues until an authoritative exit remains intact; an as-of snapshot is not silently promoted into that missing qualified interval.

**Contract:** `VN30_MASTER` §5.4 index-event provenance, §11 reconstruction, §12 coverage; standing profile `membership.from/through`. **Responsible authority:** VN30 reference-data steward and independent official-source reviewer. **Smallest action:** qualify official change/constituent coverage for **17–30 October**, or bind an already qualified effective-event timeline demonstrably covering those dates. No Master rebuild or unrelated financial acquisition. Exact retained references and dates: [U2_MEMBERSHIP_COVERAGE.json](U2_MEMBERSHIP_COVERAGE.json).

## U3 — data binding resolved up to the shared U1 gate

The selected current fact's identity, native unit/value, scope/period, exact source alias, import boundary, retained review and new native-review time are bound and replayable. Its remaining formal blocker is **U1**, not missing historical files or publication evidence for current use. **Responsible authority/action:** the same independent financial-material reviewer and host custodian accept/register the exact F2 material above. Do not convert the assistant's bounded visual review into independent acceptance.

The VNM17 pending price/dividend/share proposal is not used as financial authorization. No cash dividend/share-count reconciliation was repeated. R1 and R4 remain CLOSED; R3 remains historical completeness only. Existing strict historical publication/availability contracts stay unchanged.

## Validation and preservation

- **232/232 TypeScript tests; 34/34 Python tests.** Scoped typecheck, architecture (301 modules), Prisma schema validation and **203 governance/preservation checks** pass.
- Eight real-source workbench outputs replay byte-identically with the frozen actual review time. The reviewed DDL runs both in the real-source disposable test database and on a **private copy of active SQLite**. On the copy, the two pending market-ingest/unified-audit migrations apply; integrity is `ok` and foreign-key violations are zero. No migration is applied to the active database.
- Active SQLite SHA-256 stays `47d1dd391afb895e70d942f96f148e16d9982646998f9c59b5b36cc59ca2cb65`. Original CaféF bytes, combined VNM index, extracted VNM JSON and VNM17 packet remain unchanged. No source acquisition, ledger/portfolio/cost-basis/NAV change or production activation.
- Full application test suite/typecheck/build/lint were not run. Detailed scope, negative controls, source hashes, migration and replay evidence: [VALIDATION.json](VALIDATION.json).

Changed implementation: shared registry binding; native PDF review chronology; F1 registry/dependency pins; scoped integration tests; bounded offline workbench. No investment rule changes or new runtime tables/migrations in this remediation.

Reproduce: `node scripts/final-f1-f2-acceptance.mjs`; `python3 docs/fundamental-data-engine/unified-final-acceptance/2026-11-12/validate-package.py`; `python3 docs/fundamental-data-engine/unified-final-acceptance/2026-11-12/validate-migration.py`. The workbench uses an explicitly isolated Node server-marker alias and disposable database; it does not wire an application route. Preserve RUN_CONTEXT for deterministic replay; a future actual admission requires its actual new clock and independently registered authority.

**STOP for CIO review and the appropriate independent material authority.** No formal closure or production activation is self-approved.
