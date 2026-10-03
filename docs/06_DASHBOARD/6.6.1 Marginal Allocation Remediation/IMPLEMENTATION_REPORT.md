# M6.6.1 — Marginal allocation and opportunity-cost remediation

Date: 2026-10-03. Review base: `84ab7c4f53b4ee70f74897a89e3a5a6efbe61f6c`.

## M66-R1-M01 — sequential marginal allocation

Implemented an M6.5-owned, typed marginal assessment boundary and additive immutable storage. M6.6 accepts only a persisted `marginalAllocationId`; it cannot submit a preferred candidate, authorization result or quantity. The M6.5 analyst command accepts evidence frames tied to exact projected contexts and derives the entire authorization chain by calling the existing `decide`/`incrementalSize` logic at every step. These existing functions are unchanged.

An evidence frame covers the complete pinned candidate set, not only the candidate selected for a lot. It supplies fresh analyst assessments on that specific projection. M6.5 derives the economic winner, checks the lot, updates the hypothetical context and evaluates the next frame. The batch ends at the first non-authorization. Missing next-step evidence produces REVIEW REQUIRED; its authorized prefix remains in the audit trace but produces no executable proposal items. This prevents a truncated plan from silently becoming a deployment instruction.

M6.6 assembles proposal items from the persisted authoritative chain. It performs no risk sizing, concentration calculation, required-return calculation, score/ranking calculation or state selection. Cash remainder is a proposal estimate; no transaction or cost-basis record is created.

### Marginal trace: two lots, same candidate

Synthetic test: NAV 100,000,000 VND; initial executable cash 80,000,000 VND; board lot 100 shares at 20,000 VND; fee estimate 0; approved economic target upper bound 4%.

| Step | Candidate | Projected cash before step | Position exposure before step | M6.5 assessment | Authorized quantity | Stop reason |
|---|---|---:|---:|---|---:|---|
| 0 | `workflow-decision-0` | 80,000,000 | 0 | AUTHORIZED | 100 | — |
| 1 | `workflow-decision-0` | 78,000,000 | 2,000,000 | AUTHORIZED | 100 | — |
| 2 | `workflow-decision-0` | 76,000,000 | 4,000,000 | HOLD CASH | 0 | Economic target reached; no marginal capacity |

Final proposal: two individually referenced lots, 4,000,000 VND estimated capital, 76,000,000 VND residual cash. Test A/B asserts every value and the two marginal assessment references. Other tests cover sector exhaustion, insufficient cash, fees, non-executable board lots, unavailable evidence, changed priority A → B, a new tie and 15 qualified candidates.

### Ownership and artifact layout

- `src/domain/portfolio/allocation-projection.ts`: explicit hypothetical cash/NAV/exposure helper; no ledger or accounting-truth output.
- `src/domain/decision/marginal.ts`: typed analyst evidence, per-step M6.5 evaluation, approved opportunity comparison and substitution conditions.
- `src/application/decision/marginal.ts`: persisted decision/card/method checks, scope/current-snapshot checks, complete substitution history and controlled clock.
- `src/infrastructure/repositories/marginal-artifacts.ts`: replay-validated, hashed, immutable marginal artifacts.
- `src/domain/workflow/allocation.ts`: consumes the marginal trace and retains separate proposal/review outcomes.
- `app/server/marginal.ts`: trusted local analyst composition; no public HTTP action or ledger writer.

The projected context retains base snapshot, base ledger watermark, projected cash/NAV, positions, sectors and step. Every authorized lot retains its base Decision ID, derived decision/method identities, assessment reference, requested/authorized lot, cost and source evidence. The terminal assessment explains why allocation stopped. Method `m65-marginal-allocation-v1` versions this contract; it does not approve a new risk policy or replace the existing decision methodology.

## M66-R1-M02 — affordable substitution

**Resolved through existing source semantics.** M4 `OPPORTUNITY_COST.md` §12.2 already permits qualified substitution subject to a conjunction of explicit conditions; §12.3 governs recurring diversion. [Policy audit](POLICY_AUDIT.md) quotes the exact wording and maps each condition to implementation. No new policy approval was needed or claimed; CR-M66-01 is not opened.

M6.5 first derives A's economic priority. If A requires cash accumulation, B may receive a lot only if both its base and projected decisions qualify, it beats cash, its lot is executable, score/return/risk/confidence comparisons pass and the required qualitative findings are evidenced. Missing MOS, concentration or starvation findings retain cash. Recurring diversion requires a fresh competitive review. Several equally qualified substitutes require review rather than ticker-based selection.

Prior substitution proposals are retained and must be referenced in later reviews. Intra-plan substitutions are also included in later frame history. Persistence checks this history inside the append transaction. Pattern classification stays an explicit analyst finding with evidence; the implementation adds no numeric recurrence threshold. These records represent proposals, and reviewers must distinguish them from actual execution using transaction/journal evidence.

Tests J/K/L prove: an unqualified affordable alternative receives no capital; B satisfying the approved conjunction can receive an authorized lot; a lower share price alone grants no authority. Further tests cover missing qualitative evidence, recurrence and omitted prior history.

## Security and historical compatibility

Commands use exact fields and reject injected PASS, quantity, preference, ordering or approval fields. Projected contexts must exactly match the projection derived from prior authorized lots. Sizing parameters stay pinned. Only the trusted M6.5 evidence boundary can issue marginal artifacts. Repository append and read replay all derived outputs from persisted base decisions; forged results and corrupted hashes are rejected.

The additive migration creates `marginal_allocation` with immutable insert/update/delete protections. It also adds a unique index for optional marginal references inside execution-link bodies; legacy bodies are untouched. New reviews use `m661-marginal-orchestration-v1`. Old M6.6 reviews keep their original method and replay behavior. New marginal runs require new review IDs; prior artifacts remain unchanged.

Actual trades are posted separately through M6.3. New marginal execution links identify an individual assessment/lot and reject duplicate linkage; legacy execution links remain readable. Readiness continues to require current actual portfolio state and valid evidence. Linking a trade is an audit operation, not execution authorization.

Upgrade tests cover fresh databases, populated M6.5 databases and a populated M6.6 database with reviews, proposals, embedded journals, audit records, actual transactions, execution links, decisions and scorecards. Historical rows are compared before and after repeated migrations; no real portfolio database is used.

## Findings and scope

- M66-R1-M01: implemented; see trace and validation.
- M66-R1-M02: implemented under existing M4 §12 semantics; no pending governance blocker introduced.
- Critical unresolved: **0 identified**.
- Major unresolved: **0 identified**.
- Minor unresolved: **0 identified**.
- Change requests: prior M6.6 CR-01 and CR-02 addressed by this remediation. Existing unrelated governance/calibration dependencies remain unchanged. Their historical reports were not rewritten.
- Practical limits: evidence frames are authored through the trusted server/application boundary, not generated automatically; upstream production methods still require their existing approvals. Storage includes full replay evidence and may grow with candidate/step count. The 1,000-frame bound is an operational input limit; exhaustion without a terminal assessment fails closed.

See [validation results](VALIDATION_REPORT.md). Findings reflect implementation self-review and tests; independent review remains separate.

**M6.7+ functionality implemented: NO.** Periodic reviews, behavioral controls, journals and post-decision review retain their existing behavior except references needed for marginal evidence and per-lot execution links.
