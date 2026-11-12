# Unified F1/F2 standing source — final CIO review

Standing source principles for CaféF raw close and financial sources for Current Formal Valuation are **authorized and implemented**. Source approvals are not being requested again. Actual code/material and fact-level admission remain governed independently.

| Decision | Status |
|---|---|
| F1 | BLOCKED |
| F2 | PARTIALLY_CLOSED |
| Current Formal Valuation | NOT_READY |
| Historical PIT | NOT_QUALIFIED |
| Production Activation | NOT_AUTHORIZED |

## Implemented behavior

The shared server composition reuses Market Boundary for F1 and existing hybrid financial admission, native decimal normalization, Evidence validation and fundamental repositories for F2. Current valuation has a new explicit operational-knowledge contract; missing publication is not a current-use time blocker when other fact controls pass. Default scoring and PIT paths reject that contract. Original publication, receipt/import, review and new ingestion times remain distinct; the trusted server clock stamps new financial knowledge. Idempotent retries preserve the original availability.

Financial ingestion verifies raw native cells by exact JSON pointer or reviewed direct-PDF page/box witness, normalizes units, reconciles them with existing domain-qualified canonical facts and atomically stores linked raw/canonical evidence in the existing database. Cash events and share-count reviews remain separate from prices. Pending actions reject; confirmed changes/conflicts cannot trigger no-change carry-forward. Quarantine and revocation are append-only. No alternate price calculation, parallel database, M3/M4 rule changes or portfolio mutation was introduced.

See [INGEST_TRANSFORM_ARCHITECTURE.md](INGEST_TRANSFORM_ARCHITECTURE.md) for input contracts, affected tables, migration, trusted composition, idempotency and rollback. [VALIDATION.json](VALIDATION.json) contains exact package/schema hashes and the full changed-file list, including the prior uncommitted F1 implementation.

## Validation and real evidence

- **219/219 TypeScript tests**, including 25 new unified integration/domain cases; **34/34 Python tests**. Scoped typecheck, architecture (301 modules), Prisma schema and 142 preservation/governance checks pass. Full application suite/lint were not run. Skill frontmatter/reference and runtime checks pass; optional Python skill validator could not run because PyYAML is unavailable.
- CaféF VNM: 1,197 original rows retained; 52 observations within evidenced membership dates normalize/replay identically. 1,145 dates remain outside that verified interval. Zero real observations committed. FPT/HPG/VCB have no eligible retained CaféF price history in the checked inventories.
- Financial real retained-input replay: VNM 65, FPT 88, HPG 84 and VCB 64 canonical facts. These are deterministic replays of existing domain validation at original knowledge times, **not newly admitted current facts**.
- Exact-hash matching reused rebuilt source locations: 5 VNM, 4 FPT, 4 HPG and 11 VCB required legacy bindings. After matching, 8/9/10/9 respective legacy source bindings remain unresolved. Exact original paths/hashes and retained aliases are listed in [DATA_MIGRATION_REPORT.json](DATA_MIGRATION_REPORT.json). No source was downloaded or original receipt rewritten. Missing full historical bundles do not imply that every missing historical raw is mandatory for a separately qualified current fact.
- Actual SQLite atomicity, consumption, idempotent retries, policy invalidation, raw linkage and rollback were exercised in disposable **synthetic** databases. Zero real records admitted; active SQLite, source data and original VNM17 packet remain hash-unchanged. Existing historical code pins are preserved and checked against baseline bytes; the deliberate authority/time-contract code amendments are not retroactively resealed.
- VNM S4 replay keeps R1/R4 CLOSED and R3 restricted to historical completeness. The 17-fact proposal remains PENDING_EXPLICIT_OWNER_APPROVAL. Source principles do not approve it or grant PIT eligibility.

## Exact remaining blockers

**U1 — independent implementation/material acceptance.** The pinned bundle in [MATERIAL_REVIEW_PROPOSAL.json](MATERIAL_REVIEW_PROPOSAL.json) is proposed, not independently accepted. Configure independently verified material/capture/semantic references under existing integrity controls. Passing synthetic tests and owner source-principle approval do not create this evidence. No additional per-ticker owner source approval is needed for unchanged authorized scope.

**U2 — F1 dated membership at requested cutoff.** Retained certified membership is bounded to 3 August–16 October 2026. The 30 October standing-policy observation still needs dated membership evidence covering that date; no indefinite extension is inferred. This does not revoke its separate raw-price research observation.

**U3 — F2 selected current native-evidence binding.** No actual selected-current-fact bundle with qualified native cells, source roles, operational times and trusted accepted material has yet been registered through the new route. Bind only the selected current operands to available retained JSON/PDF/review evidence; quarantine unsupported/conflicting values. The old bundle's missing files are itemized for replay coverage, not a generic demand to rebuild history. Existing issuer-only/subset inputs can be used where their contracts suffice. Do not silently admit VNM17 or treat presentation/OCR candidates as qualified extractions.

No publication-methodology request is added for current use. Historical PIT remains separately NOT_QUALIFIED: later operational evidence cannot establish prior public availability. R1/R4 are not reopened. See [F1_F2_ACCEPTANCE_MATRIX.json](F1_F2_ACCEPTANCE_MATRIX.json) for purpose-specific requirements and closure boundaries.

## CIO checklist and rollback

- [ ] Review the exact implementation/material and obtain its independent integrity acceptance (U1), without repeating standing source approvals.
- [ ] Review the bounded membership requirement for intended F1 dates (U2).
- [ ] Review a selected current F2 native-evidence bundle and its actual validator results (U3); keep unsupported facts quarantined.
- [ ] Keep pending VNM17 admission and Historical PIT separate from current source principles.
- [ ] Authorize any later production migration/activation separately after mandatory gates pass.

No active database migration or production activation occurred. For future accepted records, rollback appends revocations and retains original raw/canonical records; consumption and reingestion of revoked identities reject. Rebuild uses a newly qualified namespace, not deletion or replacement of historical evidence.

**STOP for CIO review.**
