# CaféF VN30 standing source — CIO review

Standing source policy is **IMPLEMENTED** as the owner's authorized principle. The governed pipeline is implemented and scoped validation passes. **F1 remains BLOCKED, F2 OPEN, formal S4 NOT_CLOSED.** No production activation or application database migration was performed.

| Decision | Result |
|---|---|
| Standing Source Policy | IMPLEMENTED |
| Ingest Transformation | PASS |
| Automatic Capability Validation | FAIL — real admission blocked |
| Automatic Market Validation | FAIL — real admission blocked |
| Deterministic Replay | PASS |
| Migration | PARTIAL |
| Multi-Ticker Pilot | PARTIAL |
| F1 | BLOCKED |
| F2 | OPEN |
| Formal S4 | NOT_CLOSED |

The two FAIL decisions refer to unavailable real admission authority. The actual Capability/Market lifecycle passes integration tests using explicitly synthetic independent-acceptance and capture-provenance fixtures. Test success does not authorize real records.

Exact proposed material SHA-256: `ccf6c25079c703b1acbd4a1e46d715766740916b2f156ea8320e164ed8b55412`.

## Evidence and results

- 145/145 scoped TypeScript tests: 119 retained checks plus 26 integration cases. Python: 34/34. Scoped typecheck, architecture (295 modules), Prisma schema validation, skill validation and 117 package governance checks pass. Full application suite and lint were not executed. See [VALIDATION.json](VALIDATION.json) for scope and changed-file list.
- Retained CaféF VNM: 1,197 rows, 49 requests, immutable source SHA-256 `d8a40adcbec57691eeeef89164f842a89b077de1a96edbea98cc9fa96f353887`. The combined 1,200-row VNM index also includes three separate-provider observations; they were not relabelled CaféF.
- Dry-run: 52 original raw-close observations normalized and deterministically replayed. 1,145 dates fall outside the retained verified VN30 membership interval. **Zero real observations accepted or committed.** Quarantine in the migration report is dry-run disposition, not active SQL writes.
- VNM retained S4 regression: 56,900 VND raw close, 15 reviewed cash components and 2,089,955,445 carried-forward shares unchanged. This is a research replay, without new financial-fact or source admission.
- Retained membership review covers 3 August–16 October 2026. It is not extended to 30 October. FPT/HPG/VCB appear in the retained composition, but no eligible CaféF history exists in checked inventories. Four-ticker tests are synthetic, not real pilot acceptance.
- [PRESERVATION.json](PRESERVATION.json) verifies unchanged SQLite, original CaféF collection, combined VNM index and 17-fact admission packet. Source and policy pins in that packet were checked. The authority module intentionally changed to support trusted retained DB bytes: its historical hash still matches the baseline Git bytes; current code requires independent requalification. No historical packet was resealed.

## Remaining issues

**Critical: none observed in scoped validation.**

**Major M1 — independent material acceptance and capture provenance absent.** The exact code/schema/normalizer/calendar/identity/unit bundle is proposed in [MATERIAL_REVIEW_PROPOSAL.json](MATERIAL_REVIEW_PROPOSAL.json), not independently accepted. An independent reviewer must verify that bundle and capture origin, record a dated ACCEPTED reference for its material hash, and configure trusted authorization/material/capture resolvers. This is code/evidence integrity verification, not a renewed per-ticker owner-policy approval. A changed bundle suspends admission until requalified.

**Major M2 — cutoff membership coverage.** The retained verified interval ends 16 October. A 30 October observation cannot enter this standing VN30 route until dated membership evidence covers it and the revised bundle is qualified. This does not overturn the existing VNM raw-price research observation.

**Minor L1 — additional real pilot unavailable.** FPT/HPG/VCB lack eligible retained CaféF PriceHistory in checked inventories. Use retained evidence when available; do not force success with financial PDFs or another provider's prices.

F2 remains the separate formal financial-evidence contract blocker documented by the existing S4 package. This change supplies no missing original publication/availability evidence and grants no PIT status. R1 and R4 stay CLOSED; R3 remains historical completeness only. The VNM 17-fact research proposal remains PENDING_EXPLICIT_OWNER_APPROVAL.

## Implementation and storage

See [INGEST_TRANSFORM_CONTRACT.md](INGEST_TRANSFORM_CONTRACT.md) for the exact ingest/consume entry points, trust interfaces, five append-only SQLite tables, migration, reprocessing and rollback. Existing BoundaryLifecycle, RetainedMarketAuthority, normalizer and market store are reused. Only GiaDongCua enters calculations; original GiaDieuChinh remains in immutable raw bytes.

Runtime persistence extends the existing Prisma database, not a parallel database. Current changes are code/schema only. SQLite atomicity, idempotence, raw linkage, quarantine, corroborating receipts and rollback were tested in temporary databases. Consumption rechecks standing material, accepted links, revocations, source bytes and time/purpose/security constraints. A trusted clock prevents caller-supplied historical time from granting freshness.

Reproduce read-only workbench: `node scripts/cafef-standing.mjs --package docs/fundamental-data-engine/cafef-standing-source/2026-11-12`. Run `python3 docs/fundamental-data-engine/cafef-standing-source/2026-11-12/validate-package.py` for preservation, current/historical pins and byte-identical output replay. Keep PROFILE_INPUT fixed for deterministic replay; modifying material requires requalification.

Rollback appends revocations to accepted ingest links and preserves raw evidence. Rebuild uses retained raw and a newly qualified policy/material namespace. Do not delete audit rows, overwrite original source receipts or restore application SQLite from test fixtures.

## CIO checklist

- [ ] Review the principle authorization scope; do not infer code, financial-fact, PIT or production approval.
- [ ] Obtain independent acceptance of the exact proposed material and trusted legacy capture handoff (M1).
- [ ] Resolve dated membership coverage for each intended observation, including 30 October (M2).
- [ ] Review PARTIAL migration/pilot results and absence of an additional real ticker pilot (L1).
- [ ] Keep F2 and the separate 17-fact admission pending under their existing contracts.
- [ ] Authorize any later production migration/activation separately after required gates pass.

**STOP for CIO review.** No M3/M4, portfolio/accounting transaction, new financial-document acquisition or production activation is included.
