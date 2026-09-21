# M6.5 policy conflict register — remediated M6.5.1

Independent review M65-R1-M01 found the prior approval claim unverifiable. It is withdrawn. M6.5 is NOT APPROVED. None of the following proposals is an approved governance fact.

| ID | Governance state | Exact source conflict | PROPOSED RESOLUTION | Affected tests in tests/unit/decision.test.ts |
| --- | --- | --- | --- | --- |
| CR-01 | PENDING GOVERNANCE APPROVAL | DECISION_ENGINE.md §6 capital-allocation blockers and §10 concentration versus VALIDATION_CASES.md VC-062, which permits STRONG BUY with blocked/clipped execution | A binding concentration/risk limit blocks the positive capital-allocation state for the proposed size. A compliant smaller size may preserve the positive economic state. | concentration resolution blocks owned STRONG BUY; same score different portfolio impact; 31% lot cannot be authorized by an exception |
| CR-02 | PENDING GOVERNANCE APPROVAL | DECISION_ENGINE.md §7.4 permits residual REDUCE for a broken thesis versus SELL_RULES.md §8.4 mandatory SELL with staging only | BROKEN investment thesis requires SELL for an owned security. Execution may be staged where operationally necessary, but staging must not rewrite SELL into REDUCE/HOLD. | E broken thesis zero target even without replacement cash; broken-thesis resolution cannot REDUCE; SELL survives blocked accounting but executable quantity does not |
| CR-03 | PENDING GOVERNANCE APPROVAL | M1 RISK_POLICY_v1.0.md §14.2 qualifying 12% exception versus VALIDATION_CASES.md VC-009 and VC-060 requiring an approval/reference | The approved qualifying conditions themselves may activate the exceptional floor. A separate approval reference is not required unless another explicit risk exception independently requires approval. | exception rationale does not need user approval; hurdle boundary cases; critical drawdown needs explicit risk approval |

Source paths: `docs/04_DECISION_ENGINE/` and `docs/01 SYSTEM/RISK_POLICY_v1.0.md`. The wording “approved qualifying conditions” in CR-03 describes the existing baseline conditions, not approval of this conflict resolution. All three await independent CIO/user governance approval.

Candidate implementation: `m65-decision-v1-proposed-resolutions-20260920`, PROPOSED/TEST with an empty approval reference. The former session-named identity is retained solely for immutable synthetic replay; its name establishes no approval. No existing artifact is rewritten.

Formal production issuance is blocked for both identities, even if metadata is relabeled APPROVED/PRODUCTION. The existing registry validation also rejects such promotion. Future activation requires externally verifiable governance evidence resolving all three conflicts, a controlled approved implementation identity and immutable methodology registration through existing governance. This remediation neither grants approval nor creates that future identity.

GOV-01: M6.4 production methodology approval remains an additional upstream dependency. Synthetic tests are not governance evidence. M65-R1-m01 architecture decomposition remains OPEN/non-blocking; no refactor is performed.
