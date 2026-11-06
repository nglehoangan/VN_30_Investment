# Acceptance criteria — planning checks versus future execution tests

The thresholds below are proposed implementation acceptance, not claims that24 issuer computations were executed. Current planning validation checks static identities/routes/source shapes and approved P1 regressions only. READY is route-method readiness, not an eligibility shortcut.

| ID | Test | Exact threshold | Fail-closed behavior |
|---|---|---|---|
|A01|Approved universe/identity|Exact universe SHA931e8355854bccc45918b38f2c5061bfda0786bf4bb8779fbe213be8e5107d56;24 exact non-pilot stable IDs;0 duplicates; exact authorized batch subset.|Any mismatch blocks all batch execution; no live universe refresh.|
|A02|Route/sector dispatch|24 rows keep accepted M3 sectors; fixed subtype map; correct bank/securities/economic route; zero ticker-hardcoded or scope-default shortcuts.|Unknown/ambiguous route fails closed; no corporate fallback for financials.|
|A03|Period/scope/unit/revision|Every selected amount carries annual/instant/quarter/YTD, issuer scope, native unit/scale, fiscal window and revision;100% incompatible joins rejected.|Unknown/mixed dimensions cannot produce derived metrics or bands.|
|A04|Immutable provenance|100% selected cells/notes resolve to original hash, exact pointer and PDF physical evidence/raw provider locator; zero changed source bytes.|Broken lineage stops affected source; shared source/hash drift stops publication.|
|A05|Decimal precision|Lossless decimal-string operands beyond2^53; exact add/subtract; DFR02 ratios retain12dp HALF_EVEN and exact fractions.|Binary-float financial operands, nonfinite or guessed conversion factors rejected.|
|A06|Missing/null/zero|Distinct zero/null/missing/dash/unreadable; verified PDF zero retained; unknown CaféF units reference-only.|No zero filling or provider equality mapping.|
|A07|Sector calculations|Bank loan/deposit versus regulatory LDR; reserve/gross loans versus NPL coverage; NII/assets versus NIM distinct. Broker margin/AFS/HTM versus industrial WC distinct. All conditional subtype fixtures pass.|No bank CFO/NPAT or current/debt-equity substitution; unsupported diagnostics remain unqualified.|
|A08|Actions/share basis|Effective action terms, timing, restatement, scope and share denominator align before per-share metrics; original and adjusted series both traceable.|Missing chain blocks only per-share/growth/dilution/valuation dependencies; no synthetic share counts.|
|A09|Conflict locality|Inject one source/metric conflict: exactly authoritative descendants block; unrelated issuer/topic states unchanged; candidate edges non-authoritative.|Blanket issuer veto or missed material descendant fails the graph test.|
|A10|Deterministic replay|Two same-input/same-code executions have identical canonical core source/metric/graph/disposition hashes; only explicit receipt timestamps excluded.|Any unexplained nondeterminism blocks publication.|
|A11|P1 parity|All six789 metric objects, provider crosschecks,25 assessment objects and113 deferred rows match approved P1; no historical resealing.|Any unexplained pilot delta stops shared implementation.|
|A12|Rubric and score discipline|New assessments only if explicitly in future scope and all unchanged M3 topics/bands/counterevidence/confidence/invalidation qualify; zero synthetic category/total scores.|NOT_RATED points/bands null; no missing-as-zero, redistributed weights, invented NA or partial total.|
|A13|Production rejection|At least54 six-pilot boundary probes, plus9 for each authorized new research dossier, reject direct/nested formal scorer/ranking/decision/DCA/NAV/ledger/DI/AI admission.|Any admission is a global stop; no accepted research-to-formal conversion.|
|A14|No unauthorized source|Only existing pinned retained sources; PDF-first with reviewed zero; CaféF labelled fallback/crosscheck; new source acquisition count0.|Missing source remains deferred; no silent issuer/HOSE financial-PDF fallback or network collection.|
|A15|Protected baseline|All M1–M8/methodology/authority, approved universe, P1/P2.0 and database/sidecar fingerprints unchanged; zero DB writes.|Any protected mutation blocks handover; no historical seal rewrite.|
|A16|Conditions and bounded stop|Every conditional bridge and exact local gap logged; each authorized batch has explicit exit receipt and stop; no next package automatically starts.|Unchanged dependency keeps existing blocker ID; no new evidence-closure phase or administrative closure.|

## Required subtype fixtures

- BSR: reported inventory/crack/cycle effects remain distinct; no normalized margin from spot earnings. HPG: trough/cycle and capacity cohorts, including a missing longer-cycle window.
- GAS: mixed commodity/contracted segments, restricted project funds and unmatched DSCR operands. GVR: rubber versus land/industrial-park gains and NCI/common allocations.
- MSN: holding versus operating debt/cash, associate/subsidiary overlap and layered NCI. MCH/SAB: manufacturer price/volume instead of same-store metrics. MWG: mature/new store and working-capital double-count controls.
- VJC: aircraft SLB versus transport profit, lease/deposit/return obligations and FX. VPL: hospitality/development/unallocated common earnings. VRE: rental/operating assets versus development handovers, no unauthorized required-INVENTORY substitution.
- All: candidate annual-year labels do not prove comparable FY2022–25 scope or action-adjusted per-share growth; scope must be selected explicitly, especially SSI versus TCX.

Current task must leave all24 financial metrics/assessments/scorecards unexecuted. Source structural counts and narrative route-context indexing are permitted inspection, never qualified financial coverage. No approved P1/P2.0 gate is reopened.
