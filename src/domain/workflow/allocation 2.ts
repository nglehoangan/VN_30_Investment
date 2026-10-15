import { MONOTONIC_METHOD } from "@/domain/decision/approved-methodology";
import { decimal } from "@/domain/portfolio/values";
import type { Decision } from "@/domain/decision/engine";
import type { AllocationProposal, PinnedReview, ProposalCandidate } from "./contracts";
import { WORKFLOW_METHOD, MARGINAL_WORKFLOW_METHOD } from "./contracts";

export function capitalIssues(p: PinnedReview): string[] {
  const { command: c, portfolio: { decisionContext: s }, ranking: r } = p;
  const issues: string[] = [];
  if (s.integrity.status !== "PASS" || s.executableCash === null) issues.push("PORTFOLIO STATE BLOCKED");
  if (s.integrity.asOf !== c.asOf || s.integrity.snapshotId !== c.snapshotId || s.capturedAt > c.evidenceCutoff) issues.push("PORTFOLIO CUTOFF MISMATCH");
  if (!r || r.status !== "VALID") issues.push("CURRENT FORMAL RANKING REQUIRED");
  if (r && (r.asOf !== c.asOf || r.calculatedAt > c.evidenceCutoff || !r.portfolio || r.portfolio.portfolioId !== c.portfolioId || r.portfolio.ledgerWatermark !== s.integrity.ledgerWatermark || r.portfolio.priceVersion !== s.integrity.priceVersion || r.portfolio.referenceVersion !== s.integrity.referenceVersion)) issues.push("RANKING CONTEXT MISMATCH");
  if (r && r.entries.some(e => !p.decisions.some(d => d.securityId === e.securityId && d.lineage.scorecardId === e.scorecardId))) issues.push("DECISION REQUIRED FOR RANKED CANDIDATES");
  for (const d of p.decisions) {
    if (d.scope !== c.scope || d.methodology !== MONOTONIC_METHOD) issues.push(`INVALID METHODOLOGY OR SCOPE:${d.id}`);
    if (d.asOf !== c.asOf || d.recordedAt > c.evidenceCutoff || d.knownAt > c.evidenceCutoff || d.lineage.snapshotId !== c.snapshotId || d.lineage.ledgerWatermark !== s.integrity.ledgerWatermark || JSON.stringify(d.input.portfolio) !== JSON.stringify(s)) issues.push(`STALE DECISION CONTEXT:${d.id}`);
    if (d.lineage.rankingId !== c.rankingId) issues.push(`DECISION RANKING MISMATCH:${d.id}`);
    const evidence = d.input.evidence;
    if (evidence.some(e => e.validThrough < c.reviewDate) || d.input.scorecard.input.evidence.some(e => e.critical && (e.validThrough < c.reviewDate || e.quality !== "VALID"))) issues.push(`STALE EVIDENCE:${d.id}`);
    if (d.reviewStatus !== "FINAL" || d.missingEvidence.length > 0) issues.push(`DECISION EVIDENCE PENDING:${d.id}`);
  }
  if (c.evidence.some(e => e.validThrough < c.reviewDate)) issues.push("STALE REVIEW EVIDENCE");
  return issues;
}
function eligible(d: Decision) {
  return (d.decisionState === "STRONG BUY" || (d.ownership === "OWNED" ? d.decisionState === "ACCUMULATE" : d.decisionState === "BUY")) &&
    d.membership === "CURRENT" && d.reviewStatus === "FINAL" && d.requiredReturn.status === "PASS" &&
    d.opportunityCost.incrementalEligible && !d.portfolioImpact.allocationBlocked && d.portfolioImpact.status === "PASS";
}
/** Compare M6.5's derived robust/no-worse conclusions. Never rank by score, ticker or P&L. */
function better(a: Decision, b: Decision) {
  const linked = b.input.assessment.opportunity.comparators.some(c => c.decisionId === a.id && c.scorecardId === a.lineage.scorecardId && c.expectedReturn === a.requiredReturn.expectedReturn);
  return linked && b.opportunityCost.comparators.some(x => x.securityId === a.securityId && x.scorecardId === a.lineage.scorecardId && x.eligible && x.noWorse && x.robust && x.advantage !== null && decimal(x.advantage).positive);
}
export function allocate(p: PinnedReview, workflowBlocks: readonly string[], supersedesProposalId: string | null): AllocationProposal {
  const c = p.command, s = p.portfolio.decisionContext;
  const issues = [...capitalIssues(p), ...workflowBlocks];
  const qualified = p.decisions.filter(eligible);
  const candidates: ProposalCandidate[] = p.decisions.map(d => {
    const sizing = "sizing" in d.portfolioImpact ? d.portfolioImpact.sizing : null;
    return { decisionId: d.id, securityId: d.securityId, scorecardId: d.lineage.scorecardId, decisionState: d.decisionState, executionStatus: d.executionStatus,
      displayRank: p.ranking?.entries.find(e => e.securityId === d.securityId)?.displayRank ?? null,
      economicPriority: eligible(d) ? 1 + qualified.filter(other => better(other, d)).length : null,
      marginalCapacity: sizing?.riskCompliantShares ?? null, eligible: eligible(d), reasons: [...d.reasons] };
  });
  const best = qualified.filter(d => !qualified.some(other => other.id !== d.id && better(other, d)));
  let outcome: AllocationProposal["outcome"] = "HOLD CASH";
  const rationale: string[] = [];
  const items: AllocationProposal["items"][number][] = [];
  if (issues.length) { outcome = issues.some(i => i.startsWith("DECISION REQUIRED")) ? "DECISION REQUIRED" : "REVIEW REQUIRED"; rationale.push(...issues); }
  else if (c.marginalAllocationId) {
    const m = p.marginalAllocation;
    const matches = m && m.id === c.marginalAllocationId && m.scope === c.scope && m.baseSnapshotId === c.snapshotId && m.baseLedgerWatermark === s.integrity.ledgerWatermark && m.command.evidenceCutoff === c.evidenceCutoff && m.recordedAt <= c.reviewDate && JSON.stringify([...m.command.baseDecisionIds].sort()) === JSON.stringify([...c.decisionIds].sort());
    const fresh = m && m.steps.every(step => step.assessments.every(a => a.decision.input.evidence.every(e => e.validThrough >= c.reviewDate) && a.decision.input.scorecard.input.evidence.every(e => !e.critical || e.validThrough >= c.reviewDate)));
    if (!matches || !fresh) { outcome = "REVIEW REQUIRED"; rationale.push("CURRENT M6.5 MARGINAL AUTHORITY REQUIRED"); }
    else {
      const stop = m.steps[m.steps.length - 1];
      rationale.push(...stop.reasons);
      if (stop.result === "REVIEW REQUIRED") outcome = "REVIEW REQUIRED";
      else {
        for (const step of m.steps) if (step.result === "AUTHORIZED" && step.authorizedLot) {
          const lot = step.authorizedLot;
          items.push({ decisionId: lot.decisionId, securityId: lot.securityId, quantity: lot.quantity, estimatedCapitalRequired: lot.capital, projectedStep: step.projection.step, marginalAssessmentReference: step.id, riskEvidenceReference: step.id, opportunityEvidenceReference: step.id });
        }
        if (items.length) outcome = items.some(item => p.decisions.find(d => d.id === item.decisionId)?.ownership === "UNOWNED") ? "BUY" : "ACCUMULATE";
      }
    }
  }
  else if (!qualified.length) rationale.push("NO QUALIFIED CANDIDATE; CONTRIBUTION DOES NOT REQUIRE DEPLOYMENT");
  else if (best.length !== 1) { outcome = "REVIEW REQUIRED"; rationale.push("ECONOMIC TIE OR CONTRADICTORY COMPARISON — MANUAL OPPORTUNITY REVIEW REQUIRED"); }
  else {
    const d = best[0];
    if (d.opportunityCost.cash !== "INFERIOR" || d.opportunityCost.relativeMerit !== "SUPERIOR") rationale.push("ROBUST SUPERIORITY TO CASH NOT ESTABLISHED");
    else if (!["EXECUTE", "STAGED"].includes(d.executionStatus) || d.tradeAuthorization !== "AUTHORIZED" || !d.executableShares || !d.portfolioImpact.cashSufficient) rationale.push(`PREFERRED CANDIDATE ${d.id}: ${d.executionStatus}; NO AUTOMATIC AFFORDABLE SUBSTITUTION`);
    else if (d.executableShares !== d.input.assessment.sizing.boardLot) { outcome = "REVIEW REQUIRED"; rationale.push("CR-01: PER-LOT UPSTREAM MARGINAL SIMULATION REQUIRED"); }
    else if (s.executableCash === null || decimal(d.portfolioImpact.cashRequired).units > decimal(s.executableCash).units) { outcome = "REVIEW REQUIRED"; rationale.push("EXECUTABLE CASH MISMATCH"); }
    else {
      outcome = d.ownership === "OWNED" ? "ACCUMULATE" : "BUY";
      items.push({ decisionId: d.id, securityId: d.securityId, quantity: d.executableShares, estimatedCapitalRequired: d.portfolioImpact.cashRequired, riskEvidenceReference: d.id, opportunityEvidenceReference: d.id });
      rationale.push("M6.5 APPROVED LOT; FRESH REVIEW REQUIRED BEFORE ANY FURTHER ALLOCATION");
    }
  }
  const cost = items.reduce((n, item) => n.add(decimal(item.estimatedCapitalRequired)), decimal("0")).toString();
  return { ...(p.marginalAllocation ? { marginalAllocation: p.marginalAllocation } : {}), id: `${c.id}:allocation`, reviewId: c.id, supersedesProposalId, portfolioSnapshotReference: c.snapshotId, portfolioAsOf: s.integrity.asOf, cashAsOf: s.integrity.asOf, evidenceCutoff: c.evidenceCutoff,
    contributionReference: p.portfolio.contribution?.transactionId ?? null, availableCapital: s.executableCash, ledgerCash: p.portfolio.ledgerCash, reservedCash: p.portfolio.reservedCash,
    newMonthlyContribution: p.portfolio.contribution?.amount ?? null, contributionEmbeddedInCash: true, rankingReference: c.rankingId,
    methodologyVersions: [...new Set([...(p.marginalAllocation ? [MARGINAL_WORKFLOW_METHOD, p.marginalAllocation.methodology] : []), WORKFLOW_METHOD, s.integrity.reconstructionMethod, p.ranking?.methodology ?? "UNKNOWN", ...p.decisions.flatMap(d => [d.methodology, d.input.scorecard.methodology.methodologyId, ...Object.values(d.input.methods).map(m => m.methodologyId)])])],
    candidates, items, proposedAllocation: cost, unallocatedCash: s.executableCash === null ? null : decimal(s.executableCash).sub(decimal(cost)).toString(), outcome, rationale, dataQuality: issues.length || (c.marginalAllocationId && outcome === "REVIEW REQUIRED") ? "BLOCKED" : "VALID", recordedAt: p.recordedAt };
}
