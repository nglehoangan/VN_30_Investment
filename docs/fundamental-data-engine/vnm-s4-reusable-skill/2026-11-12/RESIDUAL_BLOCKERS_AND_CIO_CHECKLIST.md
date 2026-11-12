# VNM S4 — reusable skill and final residual assessment

Baseline: `d6299899a2145899197b0bc2507e58e0d1277ff8`. The owner's **conditional approval is recorded for the exact17-fact retrospective VNM research proposal only** in [the receipt](../../governance/VNM_S4_CONDITIONAL_RESEARCH_APPROVAL_2026-11-12.json). This is not approval of formal execution, future skill outputs or other ticker facts. The receipt preserves the conditions and exact proposal hash; original source-admission proposal/receipts remain unchanged.

| Use / item | Current decision |
| --- | --- |
| R1 / shares | **CLOSED_BY_OWNER_APPROVED_CARRY_FORWARD_POLICY** —2,089,955,445; original limited documentary coverage retained. No new certificate required. |
| R4 / adjusted prices | **CLOSED_BY_SCOPE_EXCLUSION** — unchanged. CaféF `GiaDongCua` only; adjusted evidence audit-only. |
| R3 / missing sessions | **RESTRICTED_TO_HISTORICAL_COMPLETENESS** — provider gaps remain separate from the3 owner XLS observations. No new cutoff-price or denominator veto; no new history retrieval. |
| Retrospective research | **CONDITIONALLY_APPROVED_RETROSPECTIVE_RESEARCH_ONLY** —56,900VND raw close,15 historical gross cash terms and carried-forward shares, actual later knowledge. Skill validation is complete; final package remains for CIO review. |
| F1 formal market admission | **OPEN — executable acceptance/binding absent**. |
| F2 formal financial-fact time/run admission | **OPEN — exact assessments/run bindings absent; specific publication unknowns retained below**. |
| Historical PIT / total return | **NOT_QUALIFIED** by this package; no historical operational chain or complete return-input certification. |
| S4 formal overall | **NOT_CLOSED; STOP_FOR_CIO_REVIEW**. |

## Smallest F1 closure requirement

Retained economic evidence is sufficient; no new price discovery is needed. Qualify **one VNM30Oct raw-close observation** under the existing source contract:

1. Bind an independently reviewed CaféF `QualifiedMarketAdapter` for the retained schema, exact normalizer/identity/semantics versions, RAW/CLOSE/VND units and `VALUATION` purpose. Reuse the current selector rather than another price calculation. `app/server/tcbs-boundary-services.ts` currently composes TCBS only; the new offline review is not that trusted binding.
2. Supply the accepted source/request, unit/identity and dated30Oct HOSE session/calendar/observation-time convention pins. A daily date is known; a source observation instant/session convention is not manufactured by this skill. Approve the actual required request/capability evidence at actual knownAt, not backdated dates.
3. Replay the real retained bytes and accept the `CAPABILITY` and `MARKET` records through `BoundaryLifecycle.qualifyCapability` / `acceptMarket`, then purpose-specific consumption validation. Preserve original embedded raw-response SHA and full-file SHA separately. The existing CaféF per-ticker file is1,307,812bytes, below the authority's4,000,000-byte read limit: an adapter can consume the retained collection and validate its embedded request. No split raw-response copies or new storage pipeline are required.

Exact existing rules: [`RetainedMarketAuthority`](../../../../src/infrastructure/market-boundary-authority.ts) `approve` lines30–31 (`INDEPENDENT_APPROVAL_REQUIRED`), `adapter` lines33–35 (`NO_QUALIFIED_REAL_SOURCE_ADAPTER`), `raw` lines37–42 and `replayCapability/replayMarket` lines44–56; [`BoundaryLifecycle`](../../../../src/application/market-boundary/lifecycle.ts) `qualifyCapability`, `acceptMarket`, `validateAnalysisForConsumption`; [`validation.ts`](../../../../src/domain/market-boundary/validation.ts) `CAPABILITY`/`MARKET` semantics, observation/time/source rules. The shared raw-close selector refactor changes no approved manifest or authority registration; eventual executable acceptance must bind the actual new code bytes.

## Smallest F2 closure requirement

Reuse the selected15 cash components and share carry-forward result; do not reconcile amounts again. For each selected fact, bind a legitimately qualified source-role/publication/availability assessment and the **actual formal run**:

- Eight components already have retained VSDC update-date clues:222269→17Jun2026;209559/209560→2Oct2025;201036→29Apr2025;194066→10Dec2024;190659/190660→30Aug2024;181931→7Mar2024. They are carried through the new output as `UPDATE_CLUE`, not missing and not silently original-PDF publication. Qualify the permitted corroborating-source role and bind the assessments; do not discover these dates again.
- For178865,173284,173285,163678,157497,157500,147849 and the selected Q3 PDF, original-publication date is not established in the reviewed bindings. These are the exact unresolved publication facts, not a demand for a blanket new source chain. Qualify a permitted retained corroboration route where sufficient; otherwise leave the precise date unknown. Q3's31Oct mirror update and2Nov receipt are retained; they do not prove30Oct issuer publication/availability.
- Use the existing canonical `DATE_ONLY` path when justified: date, timezone, evidence/assessment identity, observation/policy hashes, availability provenance and review/run bindings. An exact intraday timestamp is not universally required. Preserve native receipt precision and actual later review times.
- Keep `economicAsOf=30Oct` separate from actual later knowledge. A formal run fixed to an October `fundamentalCutoff` cannot accept November availability. This skill does not alter cutoffs; it cannot invent an approved later-knowledge run or waive the existing ordering rule.

Exact rules: [`Evidence::validateTime`](../../../../src/domain/scoring/evidence.ts) line44 (legacy exact publication path) or lines52–61 (canonical source/publication/DATE_ONLY and `INVALID_OPERATIONAL_KNOWLEDGE` ordering); [`FINANCIAL_SOURCE_POLICY`](../../../../src/domain/fundamentals/source-authority.ts) line3 (per-fact authority/conflict route; exact historical replay proof); [Vietstock-only policy](../../VIETSTOCK_ONLY_SOURCE_POLICY.md) (mirror dates/acquisition do not grant original-publication or formal authority). The new tests exercise the **actual** `validateEvidence` contract with synthetic DATE_ONLY success, missing-date rejection and post-cutoff-availability rejection. They grant no real source authority.

## Reusable implementation and validation

- [SKILL.md](../../../../skills/vn30-market-price-corporate-actions/SKILL.md) routes retained evidence, current fetch skills and domain contracts.
- [Input/output contract](../../../../skills/vn30-market-price-corporate-actions/references/contract.md) defines scope, dates, source pins, null/conflict behavior and deterministic output.
- [Migration notes](../../../../skills/vn30-market-price-corporate-actions/references/migration.md) preserve existing fetch/storage/share algorithms and authority boundaries.
- [VNM input](VNM_INPUT.json) uses original1197-row price corpus, the existing15-component review, share decision and eight VSDC clues. The [replay](replay/VNM/2026-10-30/EVIDENCE.json) reproduces selected facts; it grants no approval itself. No new live ticker research was initiated.
- [Validation results](VALIDATION.json) cover the requested14 scenarios, VNM and two synthetic tickers, actual time contract behavior, source/receipt replay and cross-ticker/output isolation. Source/database preservation is checked against the existing45-file receipt, not another broad inventory. See [test command configuration](vitest.config.mjs).

## Final CIO approval checklist

- [x] Conditional owner research approval recorded against the exact baseline17-fact proposal, with formal/PIT/production exclusions.
- [x] R1/R4 remain closed; R3 limited to historical completeness; no repeated source discovery/economic reconciliation.
- [x] Review the reusable skill, I/O contract, migration notes, scoped tests and retained-byte validation.
- [ ] CIO accepts the final reusable-skill/research package. This checklist item remains unapproved by the agent.
- [ ] F1: independently qualify and bind the exact CaféF adapter/capability/request/session-purpose replay under existing authority; attach acceptance pins.
- [ ] F2: bind the16 qualified financial-fact publication/availability/run records, using retained eight date clues and explicit remaining unknowns; attach the real qualification records.
- [ ] Only after F1/F2 pass, issue a separate exact formal source/purpose acceptance decision. Until then S4 formal closure remains prohibited.

No /100 score, M3/M4 rule edit, portfolio transaction, SQL/source-authority update or production activation. No blanket VN30 approval is implied. **STOP for CIO review.**
