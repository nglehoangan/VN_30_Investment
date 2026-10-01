import type { ReviewArtifact, WorkflowPortfolio, FollowUpArtifact, ExecutionLink } from "@/domain/workflow/contracts";
import type { Transaction } from "@/domain/portfolio/transaction";
export interface WorkflowPortfolioRead {
  read(snapshotId: string, asOf: string, contributionId: string | null, evidenceCutoff: string): Promise<WorkflowPortfolio>;
  isCurrent(portfolio: WorkflowPortfolio): Promise<boolean>;
  transaction(portfolioId: string, transactionId: string): Promise<Transaction | null>;
}
export interface WorkflowArtifacts {
  find(id: string): Promise<ReviewArtifact | null>;
  findIdentity(identity: string): Promise<ReviewArtifact | null>;
  openEvents(portfolioId: string): Promise<readonly ReviewArtifact[]>;
  isSuperseded(id: string): Promise<boolean>;
  hasExecution(reviewId: string): Promise<boolean>;
  append(review: ReviewArtifact, expectedOpenEvents: readonly string[]): Promise<ReviewArtifact>;
  appendFollowUp(audit: FollowUpArtifact): Promise<void>;
  findFollowUp(id: string): Promise<FollowUpArtifact | null>;
  appendExecution(link: ExecutionLink): Promise<void>;
  findExecution(id: string): Promise<ExecutionLink | null>;
}
