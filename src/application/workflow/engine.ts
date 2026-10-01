import type { AnalyticalArtifacts } from "@/ports/scoring";
import type { DecisionArtifacts } from "@/ports/decision";
import type { MethodologyRegistry } from "@/ports/methodology-registry";
import type { WorkflowArtifacts, WorkflowPortfolioRead } from "@/ports/workflow";
import type { Clock } from "@/ports/runtime";
import type { ReviewCommand, FollowUpCommand, ExecutionLink, ReviewType } from "@/domain/workflow/contracts";
import { validateReview, validateFollowUp, exact, requireWorkflow } from "@/domain/workflow/validation";
import { createReview, suggestedAuditDate } from "@/domain/workflow/reviews";
import { deepFreeze } from "@/domain/portfolio/transaction";
import { id, text, snapshot } from "@/domain/scoring/validation";
import { ConflictError } from "@/shared/errors";

/** No write-capable ledger, pricing provider, score calculator or decision calculator is available here. */
export class WorkflowEngine {
  constructor(private readonly artifacts: WorkflowArtifacts, private readonly portfolio: WorkflowPortfolioRead,
    private readonly decisions: DecisionArtifacts, private readonly analytical: AnalyticalArtifacts,
    private readonly registry: MethodologyRegistry, private readonly clock: Clock,
    private readonly scope: "FORMAL" | "SYNTHETIC_TEST" = "FORMAL") {}

  async create(raw: ReviewCommand) {
    const c = validateReview(raw); requireWorkflow(c.scope === this.scope, "WORKFLOW_SCOPE_MISMATCH");
    const existing = await this.artifacts.find(c.id);
    if (existing) { if (JSON.stringify(existing.command) !== JSON.stringify(c)) throw new ConflictError(); return existing; }
    const portfolio = await this.portfolio.read(c.snapshotId, c.asOf, c.contributionId, c.evidenceCutoff);
    requireWorkflow(await this.portfolio.isCurrent(portfolio), "STALE_PORTFOLIO");
    requireWorkflow(portfolio.contribution?.transactionId === c.contributionId || (portfolio.contribution === null && c.contributionId === null), "CONTRIBUTION_REFERENCE_MISMATCH");
    requireWorkflow(!portfolio.contribution || portfolio.contribution.recordedAt <= c.evidenceCutoff, "FUTURE_CONTRIBUTION");
    const decisions = [];
    for (const decisionId of c.decisionIds) {
      const d = await this.decisions.find(decisionId); requireWorkflow(d && d.scope === this.scope, "PERSISTED_FORMAL_DECISION_REQUIRED");
      requireWorkflow(d.input.portfolio.integrity.portfolioId === c.portfolioId && d.recordedAt <= c.evidenceCutoff, "DECISION_LINEAGE_MISMATCH");
      const card = await this.analytical.find(d.lineage.scorecardId);
      requireWorkflow(card && "totalScore" in card && JSON.stringify(card) === JSON.stringify(d.input.scorecard), "PERSISTED_SCORECARD_MISMATCH");
      for (const method of [card.methodology, ...Object.values(d.input.methods)]) {
        const stored = await this.registry.findById(method.methodologyId);
        requireWorkflow(stored && Object.entries(stored).every(([key, value]) => method[key as keyof typeof method] === value), "REGISTERED_METHOD_REQUIRED");
        if (this.scope === "FORMAL") requireWorkflow(stored.governanceStatus === "APPROVED" && stored.intendedUse === "PRODUCTION", "APPROVED_PRODUCTION_METHOD_REQUIRED");
      }
      // Every comparator qualification is a real immutable upstream decision, even if it is outside the selected set.
      for (const comparator of d.input.assessment.opportunity.comparators.filter(x => x.eligible)) {
        const q = await this.decisions.find(comparator.decisionId);
        requireWorkflow(q && q.scope === this.scope && q.securityId === comparator.securityId && q.lineage.scorecardId === comparator.scorecardId && q.lineage.snapshotId === c.snapshotId && q.asOf === c.asOf && q.recordedAt <= c.evidenceCutoff, "COMPARATOR_LINEAGE_MISMATCH");
        requireWorkflow(c.decisionIds.includes(q.id) && q.reviewStatus === "FINAL" && ["BUY", "STRONG BUY", "ACCUMULATE"].includes(q.decisionState) && comparator.expectedReturn === q.requiredReturn.expectedReturn, "QUALIFIED_PINNED_COMPARATOR_REQUIRED");
      }
      decisions.push(d);
    }
    const ranking = c.rankingId === null ? null : await this.analytical.find(c.rankingId);
    requireWorkflow(c.rankingId === null || (ranking && "entries" in ranking), "PERSISTED_RANKING_REQUIRED");
    if (ranking && "entries" in ranking) {
      for (const card of ranking.input.cards) {
        const stored = await this.analytical.find(card.id);
        requireWorkflow(stored && JSON.stringify(stored) === JSON.stringify(card), "RANKING_SCORECARD_LINEAGE_MISMATCH");
        if (this.scope === "FORMAL") requireWorkflow(card.input.artifactScope === "FORMAL", "FORMAL_RANKING_REQUIRED");
      }
    }
    let supersedesProposalId: string | null = null;
    for (const priorId of [c.priorReviewId, c.supersedesReviewId]) if (priorId) {
      const prior = await this.artifacts.find(priorId);
      requireWorkflow(prior && prior.command.portfolioId === c.portfolioId && prior.command.scope === c.scope && prior.recordedAt <= c.evidenceCutoff && prior.command.asOf <= c.asOf, "PRIOR_REVIEW_LINEAGE_MISMATCH");
      if (priorId === c.supersedesReviewId) {
        requireWorkflow(prior.command.type === c.type || c.type === "EVENT_DRIVEN", "INVALID_SUPERSEDES_TYPE");
        supersedesProposalId = prior.proposal?.id ?? null;
      }
    }
    const events = await this.artifacts.openEvents(c.portfolioId);
    const expectedEvents = events.map(e => e.id).sort();
    const result = createReview({ command: c, portfolio, decisions, ranking: ranking && "entries" in ranking ? ranking : null,
      recordedAt: this.clock.now(), openEventReviewIds: expectedEvents.filter(x => x !== c.supersedesReviewId) }, supersedesProposalId);
    const duplicate = await this.artifacts.findIdentity(result.idempotencyKey);
    if (duplicate) return duplicate;
    requireWorkflow(await this.portfolio.isCurrent(portfolio), "STALE_PORTFOLIO");
    return this.artifacts.append(result, expectedEvents);
  }
  private scheduled(type: ReviewType, c: Omit<ReviewCommand, "type">) { return this.create({ ...c, type }); }
  createWeeklyReview(c: Omit<ReviewCommand, "type">) { return this.scheduled("WEEKLY", c); }
  createMonthlyReview(c: Omit<ReviewCommand, "type">) { return this.scheduled("MONTHLY_DCA", c); }
  createQuarterlyReview(c: Omit<ReviewCommand, "type">) { return this.scheduled("QUARTERLY", c); }
  createAnnualReview(c: Omit<ReviewCommand, "type">) { return this.scheduled("ANNUAL", c); }
  createEventDrivenReview(c: Omit<ReviewCommand, "type">) { return this.scheduled("EVENT_DRIVEN", c); }

  async executionReadiness(reviewId: string) {
    id(reviewId); const review = await this.artifacts.find(reviewId);
    requireWorkflow(review && review.command.scope === this.scope, "REVIEW_REQUIRED");
    const reasons: string[] = [];
    if (!review.proposal?.items.length) reasons.push("NO PROPOSED ALLOCATION");
    if (await this.artifacts.isSuperseded(reviewId)) reasons.push("SUPERSEDED REVIEW");
    if (await this.artifacts.hasExecution(reviewId)) reasons.push("EXECUTION ALREADY LINKED");
    if (!(await this.portfolio.isCurrent(review.portfolio))) reasons.push("STALE PORTFOLIO");
    if ((await this.artifacts.openEvents(review.command.portfolioId)).length) reasons.push("OPEN EVENT REVIEW");
    for (const decisionId of review.command.decisionIds) {
      const d = await this.decisions.find(decisionId);
      if (!d || d.input.evidence.some(e => e.validThrough < this.clock.now()) || d.input.scorecard.input.evidence.some(e => e.critical && e.validThrough < this.clock.now())) reasons.push("STALE DECISION EVIDENCE");
    }
    return deepFreeze({ reviewId, ready: reasons.length === 0, reasons, requiresUserConfirmation: true });
  }

  async followUp(raw: FollowUpCommand) {
    const c = validateFollowUp(raw), review = await this.artifacts.find(c.reviewId), decision = await this.decisions.find(c.decisionId);
    requireWorkflow(review && review.command.scope === this.scope && review.journal?.id === c.journalId && review.command.decisionIds.includes(c.decisionId) && decision, "AUDIT_ORIGINAL_LINEAGE_REQUIRED");
    requireWorkflow(c.auditDate >= review.recordedAt && c.auditDate <= this.clock.now(), "INVALID_AUDIT_TIME");
    const limited = [c.processQuality, c.decisionQuality, c.evidenceQuality, c.thesisAccuracy, c.riskAssessmentQuality, c.executionQuality, c.outcomeQuality].includes("UNKNOWN");
    const result = deepFreeze({ command: c, recordedAt: this.clock.now(), originalEvidenceCutoff: decision.lineage.evidenceCutoff,
      suggestedDate: suggestedAuditDate(decision.asOf, c.horizon), classification: limited ? "PARTIALLY BLOCKED" : `${c.decisionQuality} DECISION / ${c.outcomeQuality} OUTCOME` });
    await this.artifacts.appendFollowUp(result); return result;
  }
  async linkExecution(raw: Omit<ExecutionLink, "recordedAt">) {
    const c = snapshot(raw); exact(c, "id reviewId proposalId decisionId transactionId variance");
    [c.id, c.reviewId, c.proposalId, c.decisionId, c.transactionId].forEach(id); text(c.variance);
    const review = await this.artifacts.find(c.reviewId);
    requireWorkflow(review && review.command.scope === this.scope && review.proposal?.id === c.proposalId, "PROPOSAL_REFERENCE_REQUIRED");
    const item = review.proposal.items.find(i => i.decisionId === c.decisionId);
    requireWorkflow(item, "PROPOSED_DECISION_REQUIRED");
    const transaction = await this.portfolio.transaction(review.command.portfolioId, c.transactionId);
    requireWorkflow(transaction && transaction.facts.portfolioId === review.command.portfolioId && transaction.facts.securityId === item.securityId && transaction.facts.type === "BUY" && transaction.createdAt >= review.recordedAt, "EXECUTION_TRANSACTION_MISMATCH");
    const result = deepFreeze({ ...c, recordedAt: this.clock.now() });
    await this.artifacts.appendExecution(result); return result;
  }
}
