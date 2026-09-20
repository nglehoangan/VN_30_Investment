# M6.5 pre-implementation rule ownership audit

Date: 2026-09-20. Created before decision-domain implementation. M6.5 only.

## Sources

All nine files in `docs/04_DECISION_ENGINE/` were inspected: DECISION_ENGINE, BUY_RULES, SELL_RULES, DCA_RULES, POSITION_SIZING, OPPORTUNITY_COST, DECISION_TEMPLATE, VALIDATION_CASES and M4_FINAL_REVIEW. The final review identifies all eight policy files as Approved Baseline v1.0; stale draft footers are not separate baselines.

Relevant upstream sections inspected: M1 Investment Policy §4.2; Decision Framework §§4,12–27; Risk Policy §14; Scoring Model §§3–4; M2 Data Model/Data Rules source ownership; M3 Scoring Engine §§1–3A and Ranking Rules §18; M5 Operating Model; M6.1 Domain Model §§16,26.3 and Security §§18,30; M6.2 final review; M6.3 PortfolioEngine snapshot and read ports; M6.4 scorecard, eligibility, ranking, artifact repository, portfolio-context adapter and methodology clarification/approval handoff.

## Rule ownership

“Calculates” identifies executable ownership, not permission to invent an analyst judgment. Qualitative evidence must be explicit, dated, attributable and reproducible.

| Rule | Owning baseline | M6.5 calculates? | Consumes external evidence? | Output |
| --- | --- | --- | --- | --- |
| Canonical analysis sequence | M1 Investment Policy §4.2; M4 Template §14 | Records ordered trace | M6.4 category evidence, valuation, risk, portfolio, opportunity assessments | Audit trace |
| Seven states / ownership | M1 Framework §§16,19; M4 Engine §13 | Yes | Derived ownership | One of seven states; INITIATE versus ADD |
| Stage 0 composition / precedence | M1 Framework §4.7 | Validates/consumes owner assessment | Full composite outcome and secondary findings | Early termination / no-new-capital gate |
| Scoring / confidence / data quality | M3 Engine; M6.4 | No | Immutable scorecard | Preserved scorecard reference |
| Fundamental ranking / tie clusters | M3 Ranking; M6.4 | No | Immutable ranking, exclusions and coverage | Evidence only, never capital authority |
| Normal required return | M1 Risk §14.2; M4 Engine §8 | Yes: 15% normal hurdle | Five-year return estimate | Versioned required-return result |
| Exceptional floor | M1 Risk §14.2; M4 Buy §6.3 | Yes: 12% floor, all exception conditions | Quality, low risk, high confidence, downside, resilience, rationale | Explicit exception flag; no silent lowering |
| Risk-adjusted hurdle | M1 Risk §14.3 | Compares an evidenced higher hurdle; does not invent premiums | Versioned risk assessment/calibration | Missing calibration cannot pass |
| STRONG BUY | M4 Engine §13.1; Buy §7 | Yes | Strong category gates, HIGH confidence, LOW/MODERATE risk, exceptional asymmetry, normally ≥18%, top-tier opportunity cost | STRONG BUY, INITIATE or ADD |
| BUY | M4 Buy §§5–6 | Yes | Unowned; Stage 0 PASS or strictly permitted conditional case; all gates | BUY |
| ACCUMULATE / averaging down | M4 Buy §§8–10 | Yes | Owned; PASS; fresh thesis; decline review; improved forward economics | ACCUMULATE; never from loss/price alone |
| HOLD / provisional HOLD | M4 Engine §§7,13.4; Template §12 | Yes | Continued ownership rationale, why not add/exit, pending evidence | HOLD with separate review status |
| REDUCE | M4 Sell §§6,10–15 | Yes | Independently justified smaller exposure, residual thesis and target | REDUCE |
| SELL / mandatory exit | M4 Sell §§4,7–9,22 | Yes | Ownership prohibition, broken thesis, zero-target risk case | SELL; target zero |
| Valuation-only SELL / switch | M1 Framework §16.6; M4 Sell §§11,14; Opportunity §13 | Yes, after evidence-backed switching test | Scenarios, sensitivity, uncertainty/friction, cash, alternatives | No point-estimate-only SELL |
| AVOID | M1 Framework §16.7; M4 Engine §13.7 | Yes | Unowned; specific structural/valuation/risk/evidence reason | AVOID; pending evidence expressly qualified |
| Portfolio accounting / integrity | M2; M6.3; M4 Engine §3 | No ledger reconstruction | Application-derived snapshot, watermark, quantity/cash, scoped integrity | Fail closed on required fields; cost-only exception |
| Position/sector limits / sizing | M1 Risk; M4 Sizing §§6–15 | Applies limits / validates proposed size | Economic target, factor risk, approvals, lot and settlement parameters | Compliant exposure; separate feasibility |
| Opportunity cost | M4 Opportunity §§4–16 | Applies comparisons and materiality controls | Scoped candidates, owned adds, cash, comparable estimates and qualitative robustness | SUPERIOR/COMPETITIVE/INFERIOR/INDETERMINATE; HOLD CASH |
| Technical entry | M1 Framework §12; M4 Buy §14 | Execution routing only | Concrete risk, expiry/re-entry conditions | STAGED / TEMPORARILY DEFERRED |
| Execution status | M4 Engine §19; Template §3.2 | Yes | Cash, current lot rules, operational/approval constraints | Exact approved execution vocabulary |
| Review status | M1 Framework §20.4; M5 | Consumes/records; no workflow scheduler | FINAL/PENDING/ESCALATED | Separate from Decision State |
| Immutable formal record | M4 Template §§2–24; M6.1 Domain §16 | Yes | Scorecard/ranking/snapshot/evidence/methodology/prior IDs | Append-only DecisionRecord |
| Monthly DCA / review workflows | M5; M6.6+ | NO | Boundary only | No allocator/scheduler/UI |
| AI / security | M6.1 Security §§18,30 | Deterministic validation only | Human-attributed assessments | No AI authority, ledger writes or generic CRUD |

## Approved conflict resolutions

The user explicitly approved these three resolutions in this implementation session on 2026-09-20:

1. Binding concentration blocks the positive Decision State. A compliant smaller size can preserve it. M4 VC-062 is interpreted only for compliant clipping, not a hard no-add override.
2. BROKEN thesis requires SELL; staging affects execution only. This resolves Engine §7.4 versus Sell §8.4 in favor of the latter.
3. Qualifying 12–15% hurdle exceptions require documented rationale but no separate user approval unless another risk exception requires it. M4 VC-009/060 must distinguish hurdle classification from risk-policy overrides.

Original approved files are not overwritten. These resolutions must be pinned in the M6.5 methodology.

## Upstream limitations

M6.4 clarification identity `m64-clarification-1` remains PROPOSED / TEST with production approval pending. Implementing M6.5 does not approve it. Formal issuance must require registered APPROVED / PRODUCTION methods; synthetic validation must remain explicitly synthetic.

M6.4 Stage0Assessment currently compresses status to PASS/FAIL/UNKNOWN and HardVetoAssessment to CLEAR/ACTIVE/PENDING. Those fields alone cannot distinguish conditional PASS, investability versus eligibility failure, or capital-allocation versus ownership veto. M6.5 needs the full dated owner assessment in addition to the pinned scorecard and must reject contradictory evidence. TEMPORARILY DEFERRED is an execution status, not a canonical Stage 0 outcome.

No numeric risk premium, HOLD floor, fixed target sizing formula, uncertainty-overlap formula or utility score is invented. Where the baseline delegates qualitative judgment, consume explicit evidence-backed assessments. Where a needed calibration/assessment is absent, record the gap and prohibit the dependent capital action.
