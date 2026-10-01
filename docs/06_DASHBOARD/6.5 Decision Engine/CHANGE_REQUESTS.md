# M6.5 policy conflict register — aligned M6.5.2

CR-01, CR-02 and CR-03 are **APPROVED / IMPLEMENTED** following explicit project-owner approval after independent M6.5.1 review. The actual instruction was **“Approve 3 resolutions”**. The approved semantics are those defined in the immediately preceding independent review, with CR-01 approved as modified. The durable [owner approval record](M652_OWNER_APPROVAL.md) records the instruction, scope and review base without inventing a quotation.

| ID | Governance state | Original source conflict | Approved resolution | Implementation evidence |
| --- | --- | --- | --- | --- |
| CR-01 | APPROVED | DECISION_ENGINE.md §6 and §10 versus VALIDATION_CASES.md VC-062 | Economic state and execution/sizing remain separate. Clip to compliant positive capacity before lot rounding; preserve BUY, STRONG BUY or ACCUMULATE when smaller compliant capacity exists. No capacity or explicit prohibition authorizes no additional capital. Board lot is execution feasibility only. | Approved-identity sizing branch; M6.5.2 A–F and boundary tests |
| CR-02 | APPROVED | DECISION_ENGINE.md §7.4 versus SELL_RULES.md §8.4 | Owned BROKEN thesis requires SELL. Staging changes Execution Status only, never SELL to REDUCE/HOLD. | Existing engine retained; approved-identity SELL/staging tests |
| CR-03 | APPROVED | M1 RISK_POLICY_v1.0.md §14.2 versus VALIDATION_CASES.md VC-009/060 | All qualifying exceptional-floor conditions may activate the floor without separate manual approval. Independent risk exceptions still require their own approval. Evidence and rationale remain mandatory. | Existing deterministic hurdle retained; qualification, independent risk approval and lineage tests |

Source paths: `docs/04_DECISION_ENGINE/` and `docs/01 SYSTEM/RISK_POLICY_v1.0.md`. This approved register resolves the listed conflicts; it does not change unrelated baseline policy.

## Traceability and activation

1. M6.5 initial conflicts and unsupported approval claim: withdrawn by M6.5.1.
2. [M6.5.1 remediation](M651_GOVERNANCE_REMEDIATION.md): proposed semantics, production blocked; retained as a historical report.
3. [Explicit governance approval](M652_OWNER_APPROVAL.md): supplied after independent review of `4f672ade122733ee54bfefa649b882ef692bf20b` (Critical 0, Major 0, Minor blocking 0).
4. [M6.5.2 implementation alignment](M652_GOVERNANCE_ALIGNMENT.md): new immutable `m65-decision-v1-approved-resolutions-20260930`, APPROVED/PRODUCTION, effective 2026-09-30. Only this decision implementation may issue production decisions, subject to all upstream and domain gates.

`m65-decision-v1-session-resolutions-20260920` and `m65-decision-v1-proposed-resolutions-20260920` remain non-production. Their synthetic artifacts and original calculations are not rewritten, promoted or silently upgraded.

GOV-01: M6.4 production methodology approval remains an independent upstream dependency. Synthetic tests grant no approval. M65-R1-m01 remains OPEN/non-blocking technical debt for later controlled decomposition of `decision/engine.ts`; no broad refactor is included. M6.6+ functionality implemented: NO.
