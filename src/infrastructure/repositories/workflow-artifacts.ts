import { createHash } from "node:crypto";
import type { PrismaClient } from "@/infrastructure/db/generated/client";
import type { WorkflowArtifacts } from "@/ports/workflow";
import type { ReviewArtifact, FollowUpArtifact, ExecutionLink } from "@/domain/workflow/contracts";
import { createReview } from "@/domain/workflow/reviews";
import { validateFollowUp, requireWorkflow } from "@/domain/workflow/validation";
import { deepFreeze } from "@/domain/portfolio/transaction";
import { id, snapshot } from "@/domain/scoring/validation";
import { PrismaDecisionArtifacts } from "./decision-artifacts";
import { PrismaAnalyticalArtifacts } from "./analytical-artifacts";
import { ConflictError, DataIntegrityError } from "@/shared/errors";
const hash = (body: string) => createHash("sha256").update(body).digest("hex");
function parse<T>(row: { body: string; bodyHash: string }): T {
  if (hash(row.body) !== row.bodyHash) throw new DataIntegrityError();
  return deepFreeze(snapshot(JSON.parse(row.body))) as T;
}
function open(rows: readonly ReviewArtifact[]) {
  return rows.filter(r => r.command.type === "EVENT_DRIVEN" && r.disposition !== "NO ACTION" && !rows.some(next => next.command.supersedesReviewId === r.id));
}
export class PrismaWorkflowArtifacts implements WorkflowArtifacts {
  constructor(private readonly client: PrismaClient) {}
  async find(idValue: string) {
    id(idValue); const row = await this.client.workflowReview.findUnique({ where: { id: idValue } });
    if (!row) return null;
    try {
      const review = parse<ReviewArtifact>(row);
      requireWorkflow(review.id === row.id && review.command.id === row.id && review.command.portfolioId === row.portfolioId && review.command.type === row.type && review.command.supersedesReviewId === row.supersedesId && review.recordedAt === row.recordedAt && hash(review.idempotencyKey) === row.identityHash, "REVIEW_METADATA_MISMATCH");
      const proposal = await this.client.workflowProposal.findUnique({ where: { reviewId: row.id } });
      requireWorkflow(review.proposal ? proposal && JSON.stringify(parse(proposal)) === JSON.stringify(review.proposal) : !proposal, "PROPOSAL_LINEAGE_MISMATCH");
      return review;
    } catch (error) { throw new DataIntegrityError({ cause: error }); }
  }
  async findIdentity(identity: string) {
    const row = await this.client.workflowReview.findUnique({ where: { identityHash: hash(identity) } });
    return row ? this.find(row.id) : null;
  }
  async openEvents(portfolioId: string) {
    const rows = await this.client.workflowReview.findMany({ where: { portfolioId } });
    return open(await Promise.all(rows.map(async row => (await this.find(row.id))!)));
  }
  async isSuperseded(idValue: string) { id(idValue); return !!(await this.client.workflowReview.findFirst({ where: { supersedesId: idValue } })); }
  async hasExecution(reviewId: string) { id(reviewId); return !!(await this.client.workflowExecution.findFirst({ where: { reviewId } })); }
  async append(raw: ReviewArtifact, expectedOpenEvents: readonly string[]) {
    const review = snapshot(raw), decisions = new PrismaDecisionArtifacts(this.client), cards = new PrismaAnalyticalArtifacts(this.client);
    const inputs = [];
    for (const ref of review.command.decisionIds) { const d = await decisions.find(ref); requireWorkflow(d, "PERSISTED_DECISION_REQUIRED"); inputs.push(d); }
    const rank = review.command.rankingId ? await cards.find(review.command.rankingId) : null;
    requireWorkflow(!rank || "entries" in rank, "RANKING_REQUIRED");
    const replay = createReview({ command: review.command, portfolio: review.portfolio, decisions: inputs, ranking: rank && "entries" in rank ? rank : null, recordedAt: review.recordedAt, openEventReviewIds: review.linkedEventReviewIds }, review.proposal?.supersedesProposalId ?? null);
    requireWorkflow(JSON.stringify(replay) === JSON.stringify(review), "WORKFLOW_REVALIDATION_FAILED");
    for (const ref of [review.command.priorReviewId, review.command.supersedesReviewId]) if (ref) {
      const prior = await this.find(ref);
      requireWorkflow(prior && prior.command.portfolioId === review.command.portfolioId && prior.command.scope === review.command.scope && prior.recordedAt <= review.command.evidenceCutoff, "PRIOR_REVIEW_LINEAGE_MISMATCH");
    }
    try {
      return await this.client.$transaction(async tx => {
        const existing = await tx.workflowReview.findUnique({ where: { identityHash: hash(review.idempotencyKey) } });
        if (existing) return parse<ReviewArtifact>(existing);
        if (await tx.workflowReview.findUnique({ where: { id: review.id } })) throw new ConflictError();
        const events = await tx.workflowReview.findMany({ where: { portfolioId: review.command.portfolioId } });
        const active = open(events.map(row => parse<ReviewArtifact>(row))).map(r => r.id).sort();
        if (JSON.stringify(active) !== JSON.stringify([...expectedOpenEvents].sort())) throw new ConflictError();
        if (review.command.supersedesReviewId && events.some(row => row.supersedesId === review.command.supersedesReviewId)) throw new ConflictError();
        const portfolio = await tx.portfolio.findUnique({ where: { id: review.command.portfolioId } });
        requireWorkflow(portfolio || review.command.scope === "SYNTHETIC_TEST", "PERSISTED_PORTFOLIO_REQUIRED");
        if (portfolio && portfolio.revision !== review.portfolio.decisionContext.integrity.ledgerWatermark) throw new ConflictError();
        const body = JSON.stringify(review);
        await tx.workflowReview.create({ data: { id: review.id, portfolioId: review.command.portfolioId, type: review.command.type, supersedesId: review.command.supersedesReviewId, recordedAt: review.recordedAt, identityHash: hash(review.idempotencyKey), body, bodyHash: hash(body) } });
        if (review.proposal) { const body = JSON.stringify(review.proposal); await tx.workflowProposal.create({ data: { id: review.proposal.id, reviewId: review.id, body, bodyHash: hash(body) } }); }
        return deepFreeze(review);
      });
    } catch (error) { if (error instanceof ConflictError) throw error; throw new DataIntegrityError({ cause: error }); }
  }
  async appendFollowUp(audit: FollowUpArtifact) {
    validateFollowUp(audit.command); const review = await this.find(audit.command.reviewId);
    requireWorkflow(review?.journal?.id === audit.command.journalId && review.command.decisionIds.includes(audit.command.decisionId), "AUDIT_LINEAGE_MISMATCH");
    if (await this.client.workflowAudit.findUnique({ where: { id: audit.command.id } })) throw new ConflictError();
    const body = JSON.stringify(audit);
    try { await this.client.workflowAudit.create({ data: { id: audit.command.id, reviewId: audit.command.reviewId, body, bodyHash: hash(body) } }); }
    catch (error) { throw new DataIntegrityError({ cause: error }); }
  }
  async findFollowUp(idValue: string) { id(idValue); const row = await this.client.workflowAudit.findUnique({ where: { id: idValue } }); return row ? parse<FollowUpArtifact>(row) : null; }
  async appendExecution(link: ExecutionLink) {
    const review = await this.find(link.reviewId);
    requireWorkflow(review?.proposal?.id === link.proposalId && review.proposal.items.some(i => i.decisionId === link.decisionId), "EXECUTION_LINEAGE_MISMATCH");
    if (await this.client.workflowExecution.findFirst({ where: { OR: [{ id: link.id }, { transactionId: link.transactionId }] } })) throw new ConflictError();
    const body = JSON.stringify(link);
    try { await this.client.workflowExecution.create({ data: { id: link.id, reviewId: link.reviewId, transactionId: link.transactionId, body, bodyHash: hash(body) } }); }
    catch (error) { throw new DataIntegrityError({ cause: error }); }
  }
  async findExecution(idValue: string) { id(idValue); const row = await this.client.workflowExecution.findUnique({ where: { id: idValue } }); return row ? parse<ExecutionLink>(row) : null; }
}
