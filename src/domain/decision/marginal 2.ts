import { decide, type Decision } from "./engine";
import type { Assessment, DecisionEvidence, Evidence } from "./contracts";
import { fields, identifier, requireDecision, text } from "./validation";
import { MONOTONIC_METHOD } from "./approved-methodology";
import { projectAllocation, type AllocationProjection, type ProposedLot } from "@/domain/portfolio/allocation-projection";
import { deepFreeze } from "@/domain/portfolio/transaction";
import { decimal } from "@/domain/portfolio/values";
import { snapshot } from "@/domain/scoring/validation";
import { instant } from "@/shared/time";
export const MARGINAL_METHOD = "m65-marginal-allocation-v1";
export const SUBSTITUTION_POLICY = "M4 OPPORTUNITY_COST.md §12.1–12.3; M5 MONTHLY_DCA_REVIEW_v1.0 §19–23";
export interface SubstitutionEvidence extends Assessment {
  readonly decisionId: string;
  readonly mosNotMateriallyWeaker: boolean | null;
  readonly clearlySuperiorPortfolioFit: boolean | null;
  readonly riskAdjustedEvidenceStronglyFavors: boolean | null;
  readonly concentrationNotWorse: boolean | null;
  readonly diversionDoesNotStarvePreferred: boolean | null;
  readonly historyIds: readonly string[];
  readonly patternReview: "NO RECURRING PATTERN" | "RECURRING — FRESH COMPETITIVE REVIEW" | "UNKNOWN";
  readonly remainsCompetitiveAfterFreshReview: boolean | null;
}
export interface MarginalFrame {
  readonly substitutionEvidence?: readonly SubstitutionEvidence[];
  readonly projection: AllocationProjection;
  readonly candidates: readonly { readonly decisionId: string; readonly assessment: DecisionEvidence; readonly evidence: readonly Evidence[] }[];
}
/** Analyst evidence only; no preferred candidate, result, or authorized quantity can be submitted. */
export interface MarginalCommand {
  readonly id: string; readonly baseDecisionIds: readonly string[];
  readonly evidenceCutoff: string; readonly frames: readonly MarginalFrame[];
}
export interface MarginalStep {
  readonly id: string; readonly projection: AllocationProjection; readonly priorAssessmentIds: readonly string[];
  readonly assessments: readonly { readonly baseDecisionId: string; readonly decision: Decision }[];
  readonly preferredDecisionId: string | null;
  readonly result: "AUTHORIZED" | "HOLD CASH" | "REVIEW REQUIRED";
  readonly authorizedLot: (ProposedLot & { readonly decisionId: string; readonly capital: string }) | null;
  readonly reasons: readonly string[];
  readonly substitution?: { readonly policy: typeof SUBSTITUTION_POLICY; readonly preferredDecisionId: string; readonly selectedDecisionId: string; readonly historyIds: readonly string[] };
}
export interface MarginalAllocation {
  readonly id: string; readonly methodology: typeof MARGINAL_METHOD; readonly command: MarginalCommand;
  readonly recordedAt: string; readonly scope: Decision["scope"]; readonly baseSnapshotId: string; readonly baseLedgerWatermark: string;
  readonly steps: readonly MarginalStep[]; readonly finalProjection: AllocationProjection;
}
const positive = (d: Decision) => ["BUY", "ACCUMULATE", "STRONG BUY"].includes(d.decisionState) && d.reviewStatus === "FINAL" && d.requiredReturn.status === "PASS" && d.opportunityCost.incrementalEligible && !d.portfolioImpact.allocationBlocked;
function better(a: { baseDecisionId: string; decision: Decision }, b: { baseDecisionId: string; decision: Decision }) {
  return b.decision.input.assessment.opportunity.comparators.some(c => c.decisionId === a.baseDecisionId && c.expectedReturn === a.decision.requiredReturn.expectedReturn) &&
    b.decision.opportunityCost.comparators.some(c => c.securityId === a.decision.securityId && c.robust && c.noWorse && c.eligible && c.advantage !== null && decimal(c.advantage).positive);
}
export function validateMarginalCommand(raw: MarginalCommand) {
  const c = snapshot(raw); fields(c, "id baseDecisionIds evidenceCutoff frames"); identifier(c.id); instant(c.evidenceCutoff);
  requireDecision(c.id.length <= 80 && Array.isArray(c.baseDecisionIds) && c.baseDecisionIds.length > 0 && c.baseDecisionIds.length <= 30 && new Set(c.baseDecisionIds).size === c.baseDecisionIds.length, "MARGINAL_CANDIDATES_REQUIRED"); c.baseDecisionIds.forEach(identifier);
  requireDecision(Array.isArray(c.frames) && c.frames.length <= 1000, "BOUNDED_MARGINAL_FRAMES_REQUIRED");
  for (const frame of c.frames) {
    fields(frame, (frame.substitutionEvidence !== undefined ? "substitutionEvidence " : "") + "projection candidates"); requireDecision(Array.isArray(frame.candidates) && frame.candidates.length === c.baseDecisionIds.length && new Set(frame.candidates.map((x: MarginalFrame["candidates"][number]) => x.decisionId)).size === c.baseDecisionIds.length, "COMPLETE_MARGINAL_CANDIDATES_REQUIRED");
    if (frame.substitutionEvidence !== undefined) {
      requireDecision(Array.isArray(frame.substitutionEvidence) && frame.substitutionEvidence.length <= 30 && new Set(frame.substitutionEvidence.map((e: SubstitutionEvidence) => e.decisionId)).size === frame.substitutionEvidence.length, "BOUNDED_SUBSTITUTION_EVIDENCE_REQUIRED");
      for (const e of frame.substitutionEvidence) {
        fields(e, "analyst source assessedAt evidenceRefs rationale decisionId mosNotMateriallyWeaker clearlySuperiorPortfolioFit riskAdjustedEvidenceStronglyFavors concentrationNotWorse diversionDoesNotStarvePreferred historyIds patternReview remainsCompetitiveAfterFreshReview");
        identifier(e.decisionId); text(e.analyst); text(e.rationale); instant(e.assessedAt);
        requireDecision(c.baseDecisionIds.includes(e.decisionId) && e.source === "HUMAN" && e.assessedAt <= c.evidenceCutoff, "SUBSTITUTION_PROVENANCE_REQUIRED");
        for (const flag of [e.mosNotMateriallyWeaker, e.clearlySuperiorPortfolioFit, e.riskAdjustedEvidenceStronglyFavors, e.concentrationNotWorse, e.diversionDoesNotStarvePreferred, e.remainsCompetitiveAfterFreshReview]) requireDecision(flag === null || typeof flag === "boolean", "SUBSTITUTION_FINDING_REQUIRED");
        requireDecision(["NO RECURRING PATTERN", "RECURRING — FRESH COMPETITIVE REVIEW", "UNKNOWN"].includes(e.patternReview), "SUBSTITUTION_PATTERN_REVIEW_REQUIRED");
        requireDecision(Array.isArray(e.evidenceRefs) && e.evidenceRefs.length > 0 && e.evidenceRefs.length <= 100 && Array.isArray(e.historyIds) && e.historyIds.length <= 1000 && new Set(e.historyIds).size === e.historyIds.length, "SUBSTITUTION_REFERENCES_REQUIRED");
        e.historyIds.forEach(identifier); e.evidenceRefs.forEach(identifier);
        const candidate = frame.candidates.find((x: MarginalFrame["candidates"][number]) => x.decisionId === e.decisionId)!;
        requireDecision(e.evidenceRefs.every((ref: string) => candidate.evidence.some((v: Evidence) => v.id === ref && v.validThrough >= c.evidenceCutoff)), "SUBSTITUTION_EVIDENCE_MISSING");
      }
    }
    for (const x of frame.candidates) { fields(x, "decisionId assessment evidence"); requireDecision(c.baseDecisionIds.includes(x.decisionId), "UNKNOWN_MARGINAL_CANDIDATE"); }
  }
  return c;
}
/** M6.5 owns all risk, state and economic ordering. Reuses decide/incrementalSize unchanged. */
export function assessMarginalAllocation(raw: MarginalCommand, bases: readonly Decision[], recordedAt: string): MarginalAllocation {
  const command = validateMarginalCommand(raw); instant(recordedAt);
  requireDecision(command.evidenceCutoff <= recordedAt && bases.length === command.baseDecisionIds.length && new Set(bases.map(d => d.securityId)).size === bases.length, "MARGINAL_BASE_SET_MISMATCH");
  const base = bases[0], portfolio = base.input.portfolio;
  for (const d of bases) requireDecision(command.baseDecisionIds.includes(d.id) && d.methodology === MONOTONIC_METHOD && d.scope === base.scope && d.asOf === base.asOf && d.recordedAt <= command.evidenceCutoff && JSON.stringify(d.input.portfolio) === JSON.stringify(portfolio), "MARGINAL_BASE_LINEAGE_MISMATCH");
  const lots: ProposedLot[] = [], steps: MarginalStep[] = [];
  for (let index = 0; index <= command.frames.length; index++) {
    const projection = projectAllocation(portfolio, lots), frame = command.frames[index], id = `${command.id}:step:${index}`;
    const assessments: { baseDecisionId: string; decision: Decision }[] = [];
    let substitution: MarginalStep["substitution"];
    let reasons: string[] = [], result: MarginalStep["result"] = "HOLD CASH", preferredDecisionId: string | null = null, authorizedLot: MarginalStep["authorizedLot"] = null;
    if (!frame) { result = "REVIEW REQUIRED"; reasons = ["MARGINAL ASSESSMENT UNAVAILABLE"]; }
    else {
      for (const e of frame.substitutionEvidence ?? []) requireDecision(JSON.stringify(e.historyIds.filter(id => id.startsWith(`${command.id}:step:`)).sort()) === JSON.stringify(steps.filter(s => s.substitution).map(s => s.id).sort()), "COMPLETE_INTRA_PLAN_SUBSTITUTION_HISTORY_REQUIRED");
      requireDecision(JSON.stringify(frame.projection) === JSON.stringify(projection), "MARGINAL_PROJECTION_MISMATCH");
      for (const d of bases) {
        const source = frame.candidates.find(x => x.decisionId === d.id)!;
        // Price, lot, fees and economic target remain pinned; incremental request is exactly one lot.
        const sizing = d.input.assessment.sizing;
        requireDecision(JSON.stringify(source.assessment.sizing) === JSON.stringify(sizing), "PINNED_SIZING_REQUIRED");
        const decision = decide({ ...d.input, id: `${id}:${assessments.length}`, knownAt: command.evidenceCutoff, recordedAt,
          portfolio: projection.context, evidence: source.evidence, comparatorScorecards: bases.filter(x => x.id !== d.id).map(x => x.input.scorecard),
          assessment: { ...source.assessment, sizing: { ...sizing, proposedShares: sizing.boardLot } } });
        assessments.push({ baseDecisionId: d.id, decision });
      }
      for (const a of assessments) for (const comparator of a.decision.input.assessment.opportunity.comparators) {
        const target = assessments.find(d => d.baseDecisionId === comparator.decisionId);
        requireDecision(target && target.decision.securityId === comparator.securityId && target.decision.lineage.scorecardId === comparator.scorecardId && target.decision.requiredReturn.expectedReturn === comparator.expectedReturn, "MARGINAL_COMPARATOR_MISMATCH");
        if (comparator.eligible) requireDecision(positive(target.decision), "MARGINAL_COMPARATOR_NOT_QUALIFIED");
      }
      const stale = assessments.some(a => a.decision.input.evidence.some(e => e.validThrough < recordedAt) || a.decision.input.scorecard.input.evidence.some(e => e.critical && e.validThrough < recordedAt) || a.decision.reviewStatus !== "FINAL" || a.decision.missingEvidence.length > 0);
      const qualified = assessments.filter(a => positive(a.decision) && positive(bases.find(d => d.id === a.baseDecisionId)!));
      const preferred = qualified.filter(a => !qualified.some(b => a !== b && better(b, a)));
      if (stale) { result = "REVIEW REQUIRED"; reasons = ["MARGINAL EVIDENCE INVALID"]; }
      else if (!qualified.length) reasons = ["NO MARGINALLY QUALIFIED CANDIDATE", ...assessments.flatMap(a => a.decision.reasons), ...assessments.flatMap(a => a.decision.portfolioImpact.reasons)];
      else if (preferred.length !== 1) { result = "REVIEW REQUIRED"; reasons = ["MATERIAL TIE / OPPORTUNITY REASSESSMENT REQUIRED"]; }
      else {
        let selected = preferred[0]; const preferredDecision = selected; preferredDecisionId = selected.baseDecisionId;
        const executable = (d: Decision) => d.tradeAuthorization === "AUTHORIZED" && ["EXECUTE", "STAGED"].includes(d.executionStatus) && d.executableShares === d.input.assessment.sizing.boardLot;
        if (selected.decision.opportunityCost.cash !== "INFERIOR" || selected.decision.opportunityCost.relativeMerit !== "SUPERIOR") reasons = ["ROBUST SUPERIORITY TO CASH NOT ESTABLISHED"];
        else {
          if (!executable(selected.decision)) {
            const alternatives = qualified.filter(candidate => {
              const b = candidate.decision, a = selected.decision, e = frame.substitutionEvidence?.find(e => e.decisionId === candidate.baseDecisionId);
              if (a.executionStatus !== "REQUIRES CASH ACCUMULATION" || candidate === selected || !e || !executable(b) || b.opportunityCost.cash !== "INFERIOR" || !["SUPERIOR", "COMPETITIVE"].includes(b.opportunityCost.relativeMerit)) return false;
              const scoreClose = a.input.scorecard.totalScore !== null && b.input.scorecard.totalScore !== null && decimal(a.input.scorecard.totalScore).sub(decimal(b.input.scorecard.totalScore)).units <= decimal("2").units && decimal(b.input.scorecard.totalScore).sub(decimal(a.input.scorecard.totalScore)).units <= decimal("2").units;
              const returnClose = decimal(a.requiredReturn.expectedReturn!).sub(decimal(b.requiredReturn.expectedReturn!)).units <= decimal("0.02").units;
              const risk = ["LOW", "MODERATE", "ELEVATED_CONTROLLED", "ELEVATED_WEAK", "HIGH", "UNACCEPTABLE"], confidence = ["HIGH", "MEDIUM", "LOW"];
              return (scoreClose || e.clearlySuperiorPortfolioFit === true) && (returnClose || e.riskAdjustedEvidenceStronglyFavors === true) &&
                risk.indexOf(b.input.scorecard.input.residualRisk.status) <= risk.indexOf(a.input.scorecard.input.residualRisk.status) && confidence.indexOf(b.input.scorecard.confidence) <= confidence.indexOf(a.input.scorecard.confidence) &&
                e.mosNotMateriallyWeaker === true && e.concentrationNotWorse === true && e.diversionDoesNotStarvePreferred === true && e.patternReview !== "UNKNOWN" &&
                (e.patternReview !== "RECURRING — FRESH COMPETITIVE REVIEW" || e.remainsCompetitiveAfterFreshReview === true);
            });
            const next = alternatives.filter(a => !alternatives.some(b => a !== b && better(b, a)));
            if (next.length > 1) { result = "REVIEW REQUIRED"; reasons = ["SUBSTITUTION TIE — MANUAL REVIEW REQUIRED"]; }
            else if (next.length === 1) {
              selected = next[0]; const e = frame.substitutionEvidence!.find(e => e.decisionId === selected.baseDecisionId)!;
              substitution = { policy: SUBSTITUTION_POLICY, preferredDecisionId, selectedDecisionId: selected.baseDecisionId, historyIds: [...e.historyIds] };
            } else reasons = [preferredDecision.decision.executionStatus, "SUBSTITUTION CONDITIONS NOT ESTABLISHED — HOLD CASH"];
          }
          if (executable(selected.decision) && result !== "REVIEW REQUIRED") {
            const d = selected.decision, s = d.input.assessment.sizing;
            authorizedLot = { decisionId: selected.baseDecisionId, securityId: d.securityId, sector: d.input.scorecard.reference.sector!, quantity: d.executableShares!, price: s.price, fees: s.fees, capital: d.portfolioImpact.cashRequired };
            result = "AUTHORIZED"; reasons = ["M6.5 MARGINAL LOT AUTHORIZED", ...(substitution ? [SUBSTITUTION_POLICY] : [])];
          }
        }
      }
    }
    steps.push({ ...(substitution ? { substitution } : {}), id, projection, priorAssessmentIds: steps.map(s => s.id), assessments, preferredDecisionId, result, authorizedLot, reasons });
    if (!authorizedLot) { requireDecision(index >= command.frames.length - 1, "EVIDENCE_AFTER_TERMINAL_STEP"); break; }
    lots.push(authorizedLot);
  }
  return deepFreeze({ id: command.id, methodology: MARGINAL_METHOD, command, recordedAt, scope: base.scope, baseSnapshotId: portfolio.integrity.snapshotId, baseLedgerWatermark: portfolio.integrity.ledgerWatermark, steps, finalProjection: projectAllocation(portfolio, lots) });
}
