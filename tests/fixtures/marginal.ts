import type { MarginalCommand, MarginalFrame } from "@/domain/decision/marginal";
import { projectAllocation, type ProposedLot } from "@/domain/portfolio/allocation-projection";
import type { PinnedReview } from "@/domain/workflow/contracts";
import type { Mutable } from "./workflow";
export function marginalFrame(p: PinnedReview, prior: readonly number[] = []): Mutable<MarginalFrame> {
  const lots: ProposedLot[] = prior.map(index => {
    const d = p.decisions[index], s = d.input.assessment.sizing;
    return { securityId: d.securityId, sector: d.input.scorecard.reference.sector!, quantity: s.boardLot, price: s.price, fees: s.fees };
  });
  return structuredClone({ projection: projectAllocation(p.portfolio.decisionContext, lots), candidates: p.decisions.map(d => ({ decisionId: d.id, assessment: d.input.assessment, evidence: d.input.evidence })) }) as Mutable<MarginalFrame>;
}
export function marginalCommand(p: PinnedReview, frames: readonly MarginalFrame[]): MarginalCommand {
  return { id: "marginal-1", baseDecisionIds: p.command.decisionIds, evidenceCutoff: p.command.evidenceCutoff, frames };
}
/** Fresh human comparison claims; M6.5 must derive/validate all ordering outputs. */
export function prefer(p: PinnedReview, frame: Mutable<MarginalFrame>, index: number) {
  for (const [n, candidate] of frame.candidates.entries()) {
    candidate.assessment.valuation.expectedReturn = n === index ? "0.17" : "0.16";
    candidate.assessment.opportunity.comparators = n === index ? [] : [{ analyst: "Scenario analyst", source: "HUMAN", assessedAt: p.command.evidenceCutoff, evidenceRefs: ["decision-evidence"], rationale: "Fresh comparison on this explicit projection; uncertainty, risk and fit reviewed", securityId: p.decisions[index].securityId, scorecardId: p.decisions[index].lineage.scorecardId, decisionId: p.decisions[index].id, kind: frame.projection.context.positions.some(x => x.securityId === p.decisions[index].securityId) ? "ADD" : "NEW", expectedReturn: "0.17", lowerReturn: "0.12", upperReturn: "0.22", eligible: true, qualityNoWorse: true, riskNoWorse: true, confidenceNoLower: true, thesisNoWorse: true, fitNoWorse: true, robustlySuperior: true, marginalCapacity: "100" }];
  }
  return frame;
}

export function substitutionEvidence(p: PinnedReview, decisionIndex = 1) {
  return { analyst: "Scenario analyst", source: "HUMAN" as const, assessedAt: p.command.evidenceCutoff, evidenceRefs: ["decision-evidence"], rationale: "MOS and concentration no worse; no recurring starvation pattern after reviewing full prior proposal history", decisionId: p.decisions[decisionIndex].id,
    mosNotMateriallyWeaker: true, clearlySuperiorPortfolioFit: false, riskAdjustedEvidenceStronglyFavors: false, concentrationNotWorse: true, diversionDoesNotStarvePreferred: true, historyIds: [] as string[], patternReview: "NO RECURRING PATTERN" as const, remainsCompetitiveAfterFreshReview: null };
}
