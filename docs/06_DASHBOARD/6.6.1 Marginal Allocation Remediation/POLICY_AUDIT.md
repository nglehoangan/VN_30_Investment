# M6.6.1 source and ownership audit

Date: 2026-10-03. Reviewed base: `84ab7c4f53b4ee70f74897a89e3a5a6efbe61f6c`.

## M66-R1-M01: marginal allocation

M5 `MONTHLY_DCA_REVIEW_v1.0.md` §22 says: “After each lot, the workflow must update remaining cash and portfolio weights before considering the next lot.” §23 requires: “Select best valid marginal use of capital → simulate post-trade portfolio → update remaining cash → update position/sector weights → re-check risk and concentration → re-run marginal opportunity cost → decide next lot”.

M4 `OPPORTUNITY_COST.md` §8.1 says: “Opportunity cost is evaluated at the **margin**, not once for the entire cash balance.” It requires refreshed cash, position weight, marginal capacity, single-name/sector/factor exposure, remaining target range and competing affordability. Priority must be reconsidered when these changes affect it.

Implementation ownership:

| Concern | Owner | Implementation |
|---|---|---|
| Authoritative starting context and actual ledger | M6.3 | Existing portfolio readers; no ledger writer given to marginal commands |
| Hypothetical cash/NAV/exposure arithmetic | M6.3 domain scenario helper | `src/domain/portfolio/allocation-projection.ts` |
| Required return, states, risk capacity, sector limits and lot execution | M6.5 | Existing `decide` and `incrementalSize`, unchanged |
| Fresh marginal evidence and economic ordering | M6.5 | `src/domain/decision/marginal.ts`, `src/application/decision/marginal.ts` |
| Scorecard and ranking facts | M6.4 | Persisted cards/ranking; no recalculation |
| Proposal assembly, references and cash remainder | M6.6 | Existing workflow allocator consumes persisted marginal authorization |

Each scenario is labelled `HYPOTHETICAL — NOT ACCOUNTING TRUTH`. Its derived context uses a `projected:` snapshot identifier and retains the base snapshot/watermark separately. It is never stored as a ledger transaction or as an ordinary M6.5 decision. Price, fee estimate, board lot and economic target are pinned to the base decision; each incremental request is exactly one board lot. Any changed projection must receive its own explicit analyst assessment frame. Missing frames, stale evidence and unresolved economic ties fail closed.

## M66-R1-M02: existing approved semantics resolve substitution

The full owner section is M4 `OPPORTUNITY_COST.md` §12, which explicitly states: “This section owns the economic comparison used by DCA and board-lot execution.” It assumes A has higher economic merit but cannot be purchased without waiting for more cash; B is affordable now.

Exact §12.2 wording:

> B may be selected now only when all apply:
>
> - B independently passes all buy/add gates;
> - B is economically close to A, normally within the same <=2-point score tie cluster **or** has clearly superior portfolio fit;
> - expected-return difference is <=2pp, unless risk-adjusted evidence strongly favors B;
> - B's residual risk is no worse;
> - confidence is no lower;
> - MOS is not materially weaker;
> - post-trade concentration remains acceptable;
> - buying B does not create a repeated pattern of starving superior opportunities.

Exact §12.3 wording:

> The engine must track repeated cases where capital is diverted from a superior but temporarily unaffordable opportunity into second-best affordable names.
>
> If this pattern recurs, the default changes toward `HOLD CASH — ACCUMULATE FOR SUPERIOR CANDIDATE` unless the lower-ranked allocations remain genuinely competitive after fresh review.

M5 Monthly §19 says “do not automatically buy the next affordable candidate”, requires comparison with cash, and forbids “Buy what fits the available cash.” §21 permits deployment only when opportunity cost is robustly superior to cash.

### Implementation of the existing conjunction

| Condition | M6.5 representation / enforcement |
|---|---|
| A economically preferred but cash-constrained | Derived ordering and `REQUIRES CASH ACCUMULATION`; technical or risk blockers do not invoke this substitution route |
| B independently qualified | Both pinned base decision and projected M6.5 decision must qualify; existing return/risk/state gates remain authoritative |
| Economic closeness | Exact decimal score difference within 2 points, or evidenced clearly superior portfolio fit |
| Return comparison | Difference within 2 percentage points, or explicit risk-adjusted evidence strongly favoring B; cannot bypass M6.5 buy/add gates |
| Risk and confidence | Compare persisted scorecard categories; neither may be worse |
| MOS and relative concentration | Evidence-backed analyst findings must explicitly establish no material deterioration; projected risk must also authorize the exact lot |
| Cash and execution | B must beat cash and have an executable, authorized board lot |
| Starvation/recurrence | Explicit reviewed finding, evidence references and complete prior substitution-proposal history; recurring patterns require fresh competitive review |
| Multiple qualifying substitutes | Use marginal comparator evidence; unresolved tie requires manual review |

Qualitative judgments remain human evidence, as they already do at the M6.5 decision boundary. No new numeric recurrence count or materiality threshold is introduced. Unknown/missing findings do not authorize substitution. Proposed substitutions are tracked even before execution; reviewers use journal/transaction evidence to distinguish proposals from actual diversion. Including all prior proposals is a conservative evidence collection requirement, not a declaration that repeated proposals are a recurring investment pattern.

**Conclusion:** the baseline already resolves the substantive policy question. No candidate policy is activated and no new approval is claimed. `CR-M66-01 — Affordable Qualified Alternative` is not required. Earlier M6.6 CR-02 was a missing representation/evidence contract; this remediation supplies it under the existing owner section. The old report remains unchanged as historical evidence.
