> Successor decision: owner conditionally approved the exact retrospective research proposal; [receipt](../../governance/VNM_S4_CONDITIONAL_RESEARCH_APPROVAL_2026-11-12.json). F1/F2 formal admission remain OPEN. The [reusable-skill residual report and final CIO checklist](../../vnm-s4-reusable-skill/2026-11-12/RESIDUAL_BLOCKERS_AND_CIO_CHECKLIST.md) is current. The original proposal below is preserved; its null approval fields describe preparation before this owner decision.

# VNM S4 — final owner source-admission decision sheet

Baseline: `a693aed5aecb0753b2dea842e26a28f041e2140c`. Economic valuation date: **30Oct2026**. This proposal uses actual later receipt/review times; it does not describe information known at that historical cutoff.

**Decision requested: admit the17 exact facts below for retrospective valuation research only, or defer.** All three input groups are **READY_FOR_OWNER_ADMISSION** for that use; no economic-evidence blocker remains in that bounded scope. No approval has been recorded. Exact source URLs, original receipt timestamps, hashes, PDF pages, raw pointers, owner-policy bindings and per-fact/per-use decisions: [ADMISSION_DECISIONS.json](ADMISSION_DECISIONS.json), SHA-256 `a67690fe8b6a6299ebe60b8a9701997ea18e4c4a73dde267b5712c79f23bd7aa`.

| Fact / bounded use | Retrospective valuation research | Formal valuation consumption through existing contracts | Historical PIT backtesting |
| --- | --- | --- | --- |
| CaféF VNM/HOSE daily RAW close30Oct2026: **56,900VND/share** (`GiaDongCua56.9×1000`) | **READY_FOR_OWNER_ADMISSION**. Original request/body hash and unit declaration retained. No adjusted fallback. | **NOT_READY_FOR_GOVERNED_CONSUMPTION**: F1 below. | **NOT_QUALIFIED**: T1. |
| **15 reviewed gross cash-dividend components**, selected total **18,750VND/share** across the reviewed history | **READY_FOR_OWNER_ADMISSION** as historical issuer terms only. This sum is not one payment, an investor receipt or an annual forecast. | **NOT_READY_FOR_GOVERNED_CONSUMPTION**: F2 below. | **NOT_QUALIFIED**: T1 at each relevant decision time. |
| **2,089,955,445 outstanding shares**, Q3 ending count carried to30Oct | **READY_FOR_OWNER_ADMISSION** under the existing approved carry-forward rule; incomplete reviewed-document coverage remains explicit. | **NOT_READY_FOR_GOVERNED_CONSUMPTION**: F2 time/run binding only. No new share certification. | **NOT_QUALIFIED**: T1; Q3 listing31Oct, PDF receipt2Nov, owner carry-forward12Nov. |

## Exact cash components to admit

Each event ID resolves to its selected review pointer and PDF/page/hash in the JSON. Gross amounts remain distinct even where components share one PDF or payment date.

| Event ID | Fiscal year | Selected VND/share | Ex-rights | Record | Payment |
| --- | --- | --- | --- | --- | --- |
| 222269 | 2025 | 1850 | 2026-06-26 | 2026-06-29 | 2026-07-17 |
| 209559 | 2024 | 350 | 2025-10-16 | 2025-10-17 | 2025-10-24 |
| 209560 | 2025 | 2500 | 2025-10-16 | 2025-10-17 | 2025-10-24 |
| 201036 | 2024 | 2000 | 2025-05-14 | 2025-05-15 | 2025-05-23 |
| 194066 | 2024 | 500 | 2024-12-26 | 2024-12-27 | 2025-02-28 |
| 190659 | 2023 | 950 | 2024-09-24 | 2024-09-25 | 2024-10-24 |
| 190660 | 2024 | 1500 | 2024-09-24 | 2024-09-25 | 2024-10-24 |
| 181931 | 2023 | 900 | 2024-03-15 | 2024-03-18 | 2024-04-26 |
| 178865 | 2023 | 500 | 2023-12-27 | 2023-12-28 | 2024-02-28 |
| 173284 | 2022 | 950 | 2023-08-03 | 2023-08-04 | 2023-10-05 |
| 173285 | 2023 | 1500 | 2023-08-03 | 2023-08-04 | 2023-10-05 |
| 163678 | 2022 | 1400 | 2022-12-22 | 2022-12-23 | 2023-02-28 |
| 157497 | 2021 | 950 | 2022-07-06 | 2022-07-07 | 2022-08-19 |
| 157500 | 2022 | 1500 | 2022-07-06 | 2022-07-07 | 2022-08-19 |
| 147849 | 2021 | 1400 | 2022-01-10 | 2022-01-11 | 2022-02-25 |

Event222269 adopts **1,850**, as already visually reviewed against the issuer PDF and retained VSDC cross-check. Provider1,800 remains immutable conflicting raw evidence; it is not an additional distribution. The future2,500 interim2026 dividend remains outside these15 components and is not received cash at cutoff.

## Only unsatisfied formal-use requirements

**F1 — CaféF executable admission binding, not a missing price.** The exact value/date/unit/raw lineage is present. The pure CaféF field normalizer is not a registered qualified adapter or accepted `CAPABILITY`/`MARKET` envelope. The trusted composition currently supplies `createTcbsEodAdapter` only ([composition](../../../../app/server/tcbs-boundary-services.ts), lines10–18). Missing are the exact independently accepted CaféF source/request/capability and valuation-purpose binding, including the dated30Oct HOSE session/observation-time policy and deterministic retained-raw replay acceptance. Mandatory rules: [`RetainedMarketAuthority.approve`, `.adapter`, `.replayCapability`, `.replayMarket`](../../../../src/infrastructure/market-boundary-authority.ts), lines30–56 (`INDEPENDENT_APPROVAL_REQUIRED`, `NO_QUALIFIED_REAL_SOURCE_ADAPTER`, replay hash checks); [`BoundaryLifecycle.acceptMarket`](../../../../src/application/market-boundary/lifecycle.ts), lines24–27; [`validation.ts` MARKET](../../../../src/domain/market-boundary/validation.ts), `OBSERVATION_TIME` and source/capability checks. The selected provider row supplies a daily date, not an independently qualified observation instant/session binding. No new price retrieval, broad pipeline, adjusted method or complete history is proposed here.

**F2 — sixteen financial-fact publication/availability assessments and formal-run bindings, not new economic terms.** The15 PDF components and share selection have document dates, original receipts and reviewed values. Their retained selected rows do not contain admitted `Evidence` time records. Missing is a qualified publication timestamp **or** verified publication **date + timezone**, with the applicable assessment/provenance and actual availability/review/cutoff binding. This is not a universal intraday-timestamp requirement. Exact alternatives: [`evidence.ts::validateTime`](../../../../src/domain/scoring/evidence.ts), line44 (legacy exact `publishedAt` ordering), lines52–57 (canonical `publicationStatus=VERIFIED`, `assessmentId`, `availabilityProvenance`; `DATE_ONLY` allowed), line61 (availability/review/knownAt/fundamentalCutoff ordering). [Vietstock-only policy](../../VIETSTOCK_ONLY_SOURCE_POLICY.md), final paragraph, explicitly distinguishes mirror dates from original publication and acquisition from admission. Qualify the retained evidence first; if publication date cannot be established from it, that date is the precise unknown. Document signing/notice dates must not silently become publication timestamps. No fresh issuer certificate, changed share denominator or repeated dividend reconciliation is required.

Existing retained date evidence is **not missing** for eight cash components:222269→17Jun2026;209559/209560→2Oct2025;201036→29Apr2025;194066→10Dec2024;190659/190660→30Aug2024;181931→7Mar2024. These are explicit VSDC “Cập nhật ngày” cross-check dates, with retained text/source hashes and original receipts. Reuse and assess them; do not ask for those dates again. For178865,173284,173285,163678,157497,157500,147849 and the selected Q3 PDF, an original-publication date is not established in the reviewed bindings. Their document dates or mirror timestamps remain distinct. Where an existing permitted official corroboration route suffices, qualification may use it; the report does not demand PDF publication proof in addition to a legitimately qualified replacement route. No such assessments/formal-run bindings are admitted here.

For a retrospective formal run, **economicAsOf30Oct and actual later knowledge are separate**. November receipt alone is not a prohibition on retrospective research or a demand to prove October receipt. If an existing formal run fixes `fundamentalCutoff=30Oct`, post-cutoff availability cannot pass line61; no approved later-knowledge run binding is supplied here. This proposal neither changes that cutoff nor invents timestamps or assessments.

**T1 — PIT only.** [`FINANCIAL_SOURCE_POLICY.historicalReplay`](../../../../src/domain/fundamentals/source-authority.ts), line3, requires `EXACT_PUBLICATION_AND_REVISION_PROOF_REQUIRED`; `validateTime` line61 and [`marketFreshness`](../../../../src/domain/market-boundary/freshness.ts) enforce historical availability (`PIT_MARKET_UNAVAILABLE`, `FUTURE_OBSERVATION`). The exact source versions received11Nov, Q3 mirror update31Oct/receipt2Nov and12Nov review/policy records do not establish operational availability at30Oct or every prior backtest decision. Retained receipts cannot be backdated. This blocks a PIT claim, **not this research admission**. No complete historical price coverage requirement is added.

The prior29Oct executable approval explicitly excludes `market/data admission` ([receipt](../../evidence/2026-10-29-approved-authority-activation/OWNER_APPROVAL_RECEIPT.json), `approvalScope`/`excluded`). It cannot substitute for this owner decision or F1/F2. These are existing operational contract requirements; this report does not claim they are new owner-approved methodology rules or request an exception.

## Owner decision — currently unselected

- Selection: **null** — `ADMIT_RETROSPECTIVE_RESEARCH_ONLY` / `DEFER`.
- Owner/CIO identity: **null**. Actual approval timestamp: **null**. Approval evidence: **null**.
- Exact permitted statement if admitted: “Admit the17 source-pinned facts in the JSON identified above for retrospective VNM valuation research at30Oct2026, using actual later knowledge and all retained limitations. This is not formal executable consumption, a PIT/backtest certificate, source-wide promotion, portfolio posting or production activation.”

**S4-R1 remains CLOSED_BY_OWNER_APPROVED_CARRY_FORWARD_POLICY. S4-R4 remains CLOSED_BY_SCOPE_EXCLUSION.** The remaining S4-R2 research decision is ready for owner admission; formal consumption is limited only by F1/F2 above. Approval must be recorded by the owner; this preparation grants none. **STOP for CIO review.**
