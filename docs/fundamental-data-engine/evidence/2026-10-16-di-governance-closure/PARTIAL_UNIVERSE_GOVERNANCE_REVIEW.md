# Partial-universe policy proposal — NOT APPROVED

**OWNER_DECISION_REQUIRED. DI15 remains FAIL under current policy.** No Constitution, M3 scoring model, acceptance contract, production registry or capital gate is amended.

The existing M8 gate says no Critical/Major data issue unresolved. Its implementation (`scoring-readiness.ts:53–63`) validates all15 PASS gates and requires a resolutionReference for every Critical/Major in the acceptance register. It still accounts for all30 security IDs, even when input/bridge is null. Therefore partial inputs are representable, but null input does not grant permission to hide or reclassify an unresolved Major issue. INITIAL_SCORING_REPORT.md §7 allows blocked/deferred/excluded members only under approved rules, not a waiver of DI15. Current authority implements A for the full initialization scope; B needs an explicit Owner amendment. Ambiguity about a future exception cannot confer current permission.

## Proposal for Owner consideration

FULL_UNIVERSE is the independently certified effective VN30 membership. SCORABLE_UNIVERSE and DEFERRED_UNIVERSE form a disjoint, complete partition by mandatory Level1 evidence gates. CLOSED indicates Level1 evidence closure only; market, valuation, qualitative, confidence, DI and investment gates remain additional requirements, so25 CLOSED does not automatically mean25 production-scorable.

Every current member remains visible in full denominator reporting. Each deferred member shows INSUFFICIENT / NOT_SCORABLE, a null score (never neutral fill), exact blocker and next-review trigger. It cannot enter Top10, receive STRONG BUY/BUY/ACCUMULATE or consume new capital. Missing weights are not redistributed. This proposal makes no portfolio action or recommendation.

Owner must explicitly choose whether DI15 remains A (no Major anywhere in full scope) or is amended to B (no unresolved Major inside admitted scorable scope, with approved quarantine of every deferred member). A keeps this release blocked. B requires an exact approved scope definition, exception register, quarantine invariants, expiry/review trigger, independent review, and compatible implementation/acceptance tests before any production admission. Quarantine is not resolution, and historical issue records retain their real severity.

No choice is inferred from this work request. No production scoring/ranking/Top10 or capital decision is authorized. All candidate readyForScoring and decisionReady flags remain false.

## Authority trace

- M1: `docs/01 SYSTEM/INVESTMENT_POLICY.md` — VN30-only investability and evidence/risk governance; no partial-release waiver.
- M2: `docs/02 DATABASE/VN30_MASTER.md` — Effective-dated membership/coverage is authority, not mutable current flag or unversioned API.
- M3: `docs/01 SYSTEM/SCORING_MODEL_v1.0.md` — No missing-weight redistribution, fabricated complete scores or implied new-capital approval.
- M4: `docs/04_DECISION_ENGINE/BUY_RULES.md` — Readiness and risk gates precede positive capital states.
- M5: `docs/05_PORTFOLIO_WORKFLOW/REVIEW_TEMPLATES_v1.0.md` — Review states do not override evidence or actionability gates.
- M6: `docs/fundamental-data-engine/SLICE_6_IMPLEMENTATION_REPORT.md` — All DI1–15 PASS with independent trusted acceptance and exact full universe binding.
- M7: `docs/07_VALIDATION/DATA_VALIDATION.md` — Missing/conflict/PIT provenance checks are not waived by partial disposition.
- M8: `docs/08_CONTINUOUS_IMPROVEMENT/DATA_INITIALIZATION.md` — DI15 No Critical/Major data issue unresolved; downstream scoring prohibited until required DI gates PASS.
- M8 implementation: `src/domain/fundamentals/scoring-readiness.ts` — All15 gates PASS; any CRITICAL/MAJOR issue in complete acceptance register must have resolutionReference; all30 members accounted, null input/bridge allowed but does not quarantine unresolved Major out of issue register.
