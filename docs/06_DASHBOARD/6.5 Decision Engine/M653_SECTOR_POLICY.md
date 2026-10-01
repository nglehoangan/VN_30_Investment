# M6.5.3 sector policy audit and implementation correction

Date: 2026-10-01. Review target: `56b267274c888708970493159e20398702866bb9`.
Finding: M65-R3-M01. Supplied independent review: Critical 0, Major 1, Minor blocking 0, Minor non-blocking 1.

This artifact records the policy audit and authorized implementation defect correction requested in M6.5.3. It grants no new policy approval. CR-01/02/03 retain their existing [project-owner approval](M652_OWNER_APPROVAL.md). The correction restores approved CR-01's risk-compliant sizing semantics without broadening risk authority.

## Exact policy ownership and wording

Authoritative owner: [M1 RISK_POLICY_v1.0.md](../../01%20SYSTEM/RISK_POLICY_v1.0.md). M4 consumes these limits; the implementation does not define new ones.

M1 §7.2, “Default sector limits,” states:

> - **0%–25% NAV:** normal;
> - **>25%–30% NAV:** elevated; requires explicit justification;
> - **>30%–35% NAV:** high concentration; normally no additional capital;
> - **>35%–40% NAV:** mandatory CIO/Risk review; new capital requires explicit approval and hidden-factor analysis;
> - **40% NAV:** provisional sector ceiling under normal conditions.
>
> Exposure above 35% is therefore a mandatory-review zone, not an automatic forced-reduction trigger.

M1 §7.3, “Sector-ceiling exceptions,” states:

> The system may not self-approve a sector-concentration exception.

Before approval:

> Review Status = ESCALATED and no new sector capital may be deployed under the requested exception.

After explicit user approval:

> Review Status = FINAL  
> Risk Exception Status = APPROVED — SECTOR_CONCENTRATION

It requires:

> - rationale;
> - current exposure;
> - **maximum approved temporary exposure** (the exception is never open-ended);
> - expiry/review trigger;
> - hidden-factor analysis;
> - and de-concentration / normalization plan.

Section 7.3 additionally requires a structurally concentrated mandate universe, materially different business risk drivers, acceptable portfolio/hidden-factor correlation, and CIO/Risk recommendation for explicit user approval. Permission to remain concentrated, avoid automatic forced selling, or normalize over time does not itself grant permission to add capital.

[M4 BUY_RULES.md §12.2](../../04_DECISION_ENGINE/BUY_RULES.md) states:

> If sector concentration is already in a no-add zone, new capital in the sector is blocked unless a permitted explicit exception is approved under Risk Policy.

[M4 SELL_RULES.md §10.2](../../04_DECISION_ENGINE/SELL_RULES.md) repeats the sector bands and requires consideration of underlying correlated exposures rather than automatic reduction based only on sector labels. This correction changes incremental capacity, not SELL/REDUCE policy.

### Ceiling distinction

M1 §7.2 calls 40% the **provisional sector ceiling under normal conditions**; §7.3 explicitly contemplates separately approved sector-ceiling exceptions. It is not described as an absolute emergency ceiling. M6.5.3 cannot validate such an exception and authorizes no sector addition above the ordinary 30% no-add boundary, including at or beyond 40%.

The absolute emergency ceiling belongs to **single-name Small-NAV risk**, M1 §6.3:

> The **30% Small-NAV emergency ceiling is absolute under the current policy**. It is an operational backstop, not a target allocation, and it may not be exceeded through an ordinary Risk Policy exception.

Section 6.3 also requires no further capital while the position is above the normal 15% no-add threshold, a dilution/normalization plan, and acceptable sector/hidden-factor concentration. A Small-NAV approval does not supply sector-add authority. These single-name calculations are unchanged.

## Contract audit and fail-closed interpretation

`DecisionEvidence.risk` has one nullable `approvalReference` string, `smallNavException`, a drawdown classification, `normalizationPlan`, `elevatedSizeJustification`, and risk flags. It has no validated sector exception kind, sector identity, permission to add versus tolerate/normalize, maximum approved sector exposure, expiry, or link that authenticates the approval's scope. Validation checks these strings as optional text; it cannot establish sector-add authority. The small-NAV flag and drawdown context provide partial context, not a scoped sector grant.

The approved documents permit narrowly qualified exceptions; they do not make the existing generic reference sufficient. They do not specify how this contract could validate sector additions above 30%, including the interaction between the 30–35% no-add band and the 35–40% review/approval band. M6.5.3 therefore fails closed: **validated sector-add exception scope = NONE** for all currently representable inputs. A future typed evidence contract needs separate controlled governance review; see CR-04 below.

Under the corrected identity, the sector capacity term is always:

`max(0, (0.30 × (NAV − fixed fees) − current sector market value) / candidate price)`

It is rounded downward at the existing 12-decimal precision and intersected with unchanged single-name/economic constraints. Requested shares cap the quantity; board-lot rounding happens afterward. Zero requested shares does not imply zero portfolio capacity. Worsening sector exposure with every other input fixed can only decrease or preserve capacity: subtracting a larger sector value decreases this term, and intersection/lot rounding cannot reverse that order.

The elevated band remains subject to documented justification in M1. Test fixtures keep an explicit, unchanged elevated-exposure justification. This remediation does not add a new approval workflow or reinterpret independent drawdown and small-NAV controls.

## CR-04 — PROPOSED / NOT APPROVED: typed sector risk-exception evidence

Narrow future scope: represent and validate externally approved sector exceptions before permitting sector additions beyond ordinary capacity. Evidence must identify the sector and permission granted (additional capital versus tolerance/normalization only), external approving authority/reference, maximum exposure, validity/expiry/review trigger, applicable risk/hidden-factor assessment, rationale and normalization conditions. Clarify treatment of the 30–35% and 35–40% bands together so changing exposure alone never changes approval scope.

No such authority, contract, exception workflow, or permission is implemented in M6.5.3. Arbitrary strings, including the literal `APPROVED — SECTOR_CONCENTRATION`, remain insufficient. CR-04 is a future request, not a new policy resolution or blocker to this fail-closed correction.

## Immutable version and activation boundary

New methodology/implementation/configuration identity: `m65-decision-v1-sector-monotonicity-20261001`; semantic version `1.0.2`; APPROVED/PRODUCTION; effective date 2026-10-01; recordedAt `2026-10-01T00:00:00.000Z` (deterministic recording-date marker, not a newly claimed approval time). Its governing reference is this artifact; its approval reference remains `M652_OWNER_APPROVAL.md`, recording the existing CR-01/02/03 approval.

The existing registry receives a new row through an append-only migration. All three older identity records remain unchanged. Pure deterministic replay retains old semantics, including the M6.5.2 defect. Application creation and repository append accept new FORMAL decisions only under M6.5.3. The old approved record retains APPROVED/PRODUCTION as historical metadata; that metadata does not override its superseded issuance status. Reads never rewrite history or substitute a newer implementation.

No new Decision State or Execution Status is introduced. CR-02/CR-03 are unchanged. M65-R1-m01 remains non-blocking debt; no broad engine refactor is included.

**M6.6+ functionality implemented: NO**
