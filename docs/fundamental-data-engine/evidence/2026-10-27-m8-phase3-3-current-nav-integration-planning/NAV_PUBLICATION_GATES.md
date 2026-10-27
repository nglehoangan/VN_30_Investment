# Publication gates and purpose separation

2026-10-27 · Phase 3.3 · DESIGN ONLY — NOT IMPLEMENTED / NOT ACCEPTED

Default is DENY. CurrentNavResultV1 literal false permissions remain immutable, even for QUALIFIED_NAV. CurrentNavReadService remains unconnected. No approved operational output type or trust mechanism currently exists.

## Research component subtotal

**Result:** SECURITIES_SUBTOTAL — NOT NAV. **Required:** Only proved included units, explicit exclusions and source/asOf/limitations. **Future scope:** Named local research view only, after separately authorized UI integration. **Prohibited:** No official NAV, return, risk, drawdown or actionability.

## Indicative NAV

**Result:** INDICATIVE_NAV. **Required:** Explicit opt-in, complete coherent observed economics and fresh exact held prices; formal missing proofs only as calculator permits. **Future scope:** Clearly labelled research value in separate field; totalNav stays null. **Prohibited:** No official dashboard NAV/performance/risk/scoring/decisions.

## Qualified calculation

**Result:** QUALIFIED_NAV. **Required:** All exact mandatory economic and trusted scoped proof gates. **Future scope:** Technical result/evidence inspection only under currentV1. **Prohibited:** No publication/release automatically; allV1permissions false.

## Official dashboard NAV

**Result:** separate proposed publication envelope. **Required:** Qualified result plus O/R decisions, approved new publication semantics, final heads/current validity, no M7 conflict. **Future scope:** Only exact portfolio/destination/purpose/date scope after later implementation authorization. **Prohibited:** No performance/risk/actionability/scoring expansion.

## Performance metrics

**Result:** separate future contract. **Required:** Accepted terminal/snapshot valuation, complete external flows, basis for realized/unrealized P&L, validated methodology and separate permission. **Future scope:** Only explicitly approved metrics, time span and limitations. **Prohibited:** No synthetic daily NAV/TWR/CAGR or full drawdown inferred from sparse snapshots.

## Risk analytics

**Result:** separate future contract. **Required:** Qualified exposures, obligations, appropriate approved risk inputs/time basis and separate acceptance. **Future scope:** Only approved risk measure and scope. **Prohibited:** Point NAV alone does not authorize risk/observed drawdown or policy changes.

## Investment decision support

**Result:** existing restricted M7 path. **Required:** All existing decision/risk/data/M7 release authorities plus explicitly scoped permitted NAV use. **Future scope:** No grant from Phase3.3. **Prohibited:** No scoring, Buy/Sell, live-trading or D2 from QUALIFIED_NAV.

Proposed NavPublicationDecisionV1 is a separate future contract: version, exact resultHash/runHash, portfolio/perimeter, destination, purpose, publicationAtP, validity interval, ledger/evidence/authority/release dependency token, typed authenticated operational and release receipt references, accepted limitations, decision DENY|PERMIT and stable reasons. None is instantiated here. It must not mutate false V1 permissions, treat research origin as production or claim a new envelope overrides a denial without an explicitly approved amendment.

Final publication check atP>=C: confirm result/input/proof hashes, entire dependency heads and current role/grant/revocation/expiry; session still latest/valid, correct destination scope, applicable M7 release satisfied. If any mismatch, deny official value, explain blocked status and calculate again only from a coherent fresh plan. Cache keys include all dependency tokens and purpose; revoke/expire invalidates views. Old persisted evidence, if a later phase authorizes storage, remains audit-only with superseded status, never current fallback.

Do not populate legacy CurrentModel.nav from the new result or coerce its VALID/PASS/actionability. A future explicitly authorized dashboard DTO must present currentEOD valuationDate and restrictions separately. Local portfolio viewing remains available; no login requirement is added to ordinary views. INDICATIVE_BROKER_VALUE, PORTFOLIO_NAV, INVESTMENT_ACTIONABILITY and PRODUCTION_SCORING remain separate purposes. M7 DO_NOT_RELEASE remains authoritative for formal real-money decision support; read-only research is not that release.
