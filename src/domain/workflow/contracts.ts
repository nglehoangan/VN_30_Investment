import type { MarginalAllocation } from "@/domain/decision/marginal";
import type { DecisionPortfolio, Evidence } from "@/domain/decision/contracts";
import type { Decision } from "@/domain/decision/engine";
import type { Ranking } from "@/domain/ranking/rank";

export const MARGINAL_WORKFLOW_METHOD = "m661-marginal-orchestration-v1";
export const WORKFLOW_METHOD = "m66-m5-orchestration-v1";
export const REVIEW_TYPES = ["WEEKLY", "MONTHLY_DCA", "QUARTERLY", "ANNUAL", "EVENT_DRIVEN"] as const;
export type ReviewType = typeof REVIEW_TYPES[number];
export type Disposition = "NO ACTION" | "REVIEW REQUIRED" | "DECISION REQUIRED";
export const EVENT_CATEGORIES = ["COMPANY", "MARKET", "POSITION", "MANDATE / REFERENCE", "PORTFOLIO INTEGRITY"] as const;
export const EVENT_PRIORITIES = ["HARD RISK / SOLVENCY / GOVERNANCE", "MANDATE / ELIGIBILITY", "PORTFOLIO INTEGRITY / RECONCILIATION", "THESIS-BREAK RISK", "CONCENTRATION / RISK BREACH", "MATERIAL FUNDAMENTAL DETERIORATION", "VALUATION / EXPECTED RETURN", "OPPORTUNITY REVIEW", "TECHNICAL EXECUTION"] as const;
export interface ReviewTrigger {
  readonly id: string; readonly category: typeof EVENT_CATEGORIES[number];
  readonly priority: typeof EVENT_PRIORITIES[number]; readonly severity: "T0" | "T1" | "T2" | "T3" | "T4";
  readonly effectiveAt: string; readonly evidenceRefs: readonly string[];
  readonly verified: boolean; readonly decisionReady: boolean; readonly governingRule: string;
  readonly affectedSecurityId: string | null; readonly requiredEvidence: string; readonly rationale: string;
}
export const BIASES = ["FOMO", "Anchoring", "Loss Aversion", "Disposition Effect", "Confirmation Bias", "Recency Bias", "Overconfidence", "Action Bias", "Endowment Effect", "Sunk-Cost Bias", "Availability Bias", "Self-Attribution Bias", "Benchmark Envy", "Herding / Consensus Bias", "Narrative Bias"] as const;
export interface BehavioralObservation {
  readonly bias: typeof BIASES[number]; readonly evidenceRefs: readonly string[]; readonly originalWording: string;
  readonly indicator: "PRICE DECLINE ONLY" | "FORCED MONTHLY DEPLOYMENT" | "PROFIT THRESHOLD ONLY" | "DOCUMENTED PROCESS DEVIATION";
  readonly controlApplied: boolean; readonly control: string;
}
export interface ReviewSection {
  readonly area: string; readonly securityId: string | null; readonly evidenceRefs: readonly string[];
  readonly finding: "UNCHANGED" | "MATERIAL CHANGE" | "MISSING" | "NOT APPLICABLE";
  readonly rationale: string;
}
export interface ThesisReview {
  readonly securityId: string; readonly prior: "INTACT" | "IMPROVING" | "WEAKENING" | "BROKEN" | "PENDING";
  readonly current: "INTACT" | "IMPROVING" | "WEAKENING" | "BROKEN" | "PENDING";
  readonly evidenceRefs: readonly string[]; readonly rationale: string;
}
export interface ReviewCommand {
  readonly marginalAllocationId?: string;
  readonly id: string; readonly type: ReviewType; readonly portfolioId: string; readonly period: string;
  readonly reviewDate: string; readonly asOf: string; readonly evidenceCutoff: string; readonly snapshotId: string;
  readonly scope: "FORMAL" | "SYNTHETIC_TEST"; readonly reviewer: string;
  readonly priorReviewId: string | null; readonly supersedesReviewId: string | null;
  readonly decisionIds: readonly string[]; readonly rankingId: string | null;
  readonly contributionId: string | null; readonly plannedContribution: string | null;
  readonly evidence: readonly Evidence[]; readonly triggers: readonly ReviewTrigger[];
  readonly sections: readonly ReviewSection[]; readonly theses: readonly ThesisReview[];
  readonly behavioral: readonly BehavioralObservation[]; readonly nextReview: string;
  readonly governance: "NO POLICY CHANGE" | "OPERATIONAL IMPROVEMENTS ONLY" | "MODEL/RULE VALIDATION REQUIRED" | "POLICY REVIEW PROPOSAL REQUIRED" | null;
}
/** Supplied only by M6.3/application adapter. Proposal cash never changes these values. */
export interface WorkflowPortfolio {
  readonly decisionContext: DecisionPortfolio;
  readonly ledgerCash: string; readonly reservedCash: string;
  readonly contribution: { readonly transactionId: string; readonly amount: string; readonly recordedAt: string } | null;
}
export interface PinnedReview {
  readonly marginalAllocation?: MarginalAllocation;
  readonly command: ReviewCommand; readonly portfolio: WorkflowPortfolio;
  readonly decisions: readonly Decision[]; readonly ranking: Ranking | null;
  readonly recordedAt: string; readonly openEventReviewIds: readonly string[];
}
export interface ProposalCandidate {
  readonly decisionId: string; readonly securityId: string; readonly scorecardId: string;
  readonly decisionState: Decision["decisionState"]; readonly executionStatus: Decision["executionStatus"];
  readonly displayRank: number | null; readonly economicPriority: number | null;
  readonly marginalCapacity: string | null; readonly eligible: boolean; readonly reasons: readonly string[];
}
export interface AllocationProposal {
  readonly marginalAllocation?: MarginalAllocation;
  readonly id: string; readonly reviewId: string; readonly supersedesProposalId: string | null;
  readonly portfolioSnapshotReference: string; readonly portfolioAsOf: string; readonly cashAsOf: string;
  readonly evidenceCutoff: string; readonly contributionReference: string | null;
  readonly availableCapital: string | null; readonly ledgerCash: string; readonly reservedCash: string;
  readonly newMonthlyContribution: string | null; readonly contributionEmbeddedInCash: true;
  readonly rankingReference: string | null; readonly methodologyVersions: readonly string[];
  readonly candidates: readonly ProposalCandidate[];
  readonly items: readonly { readonly decisionId: string; readonly securityId: string; readonly projectedStep?: number; readonly marginalAssessmentReference?: string; readonly quantity: string; readonly estimatedCapitalRequired: string; readonly riskEvidenceReference: string; readonly opportunityEvidenceReference: string }[];
  readonly proposedAllocation: string; readonly unallocatedCash: string | null;
  readonly outcome: "BUY" | "ACCUMULATE" | "HOLD CASH" | "REVIEW REQUIRED" | "DECISION REQUIRED";
  readonly rationale: readonly string[]; readonly dataQuality: "VALID" | "BLOCKED"; readonly recordedAt: string;
}
export interface ReviewArtifact {
  readonly id: string; readonly idempotencyKey: string; readonly methodology: typeof WORKFLOW_METHOD | typeof MARGINAL_WORKFLOW_METHOD;
  readonly command: ReviewCommand; readonly portfolio: WorkflowPortfolio; readonly recordedAt: string;
  readonly disposition: Disposition; readonly status: "FINAL" | "PENDING" | "ESCALATED";
  readonly reasons: readonly string[]; readonly linkedEventReviewIds: readonly string[];
  readonly refresh: { readonly score: boolean; readonly ranking: boolean; readonly valuation: boolean; readonly decision: boolean };
  readonly proposal: AllocationProposal | null;
  readonly journal: { readonly id: string; readonly entryType: "HOLD_CASH" | "TRADE_DECISION" | "RISK_ESCALATION"; readonly decisionIds: readonly string[]; readonly rationale: readonly string[]; readonly nextReview: string } | null;
}
export interface FollowUpCommand {
  readonly id: string; readonly reviewId: string; readonly journalId: string; readonly decisionId: string;
  readonly horizon: 3 | 6 | 12; readonly auditDate: string; readonly evidence: readonly Evidence[];
  readonly processQuality: "GOOD" | "BAD" | "UNKNOWN"; readonly decisionQuality: "GOOD" | "BAD" | "UNKNOWN";
  readonly evidenceQuality: "GOOD" | "BAD" | "UNKNOWN"; readonly thesisAccuracy: "GOOD" | "BAD" | "UNKNOWN";
  readonly riskAssessmentQuality: "GOOD" | "BAD" | "UNKNOWN"; readonly executionQuality: "GOOD" | "BAD" | "UNKNOWN";
  readonly outcomeQuality: "GOOD" | "BAD" | "UNKNOWN"; readonly rationale: string;
}
export interface FollowUpArtifact { readonly command: FollowUpCommand; readonly recordedAt: string; readonly originalEvidenceCutoff: string; readonly classification: string; readonly suggestedDate: string; }
export interface ExecutionLink { readonly marginalAssessmentReference?: string; readonly id: string; readonly reviewId: string; readonly proposalId: string; readonly decisionId: string; readonly transactionId: string; readonly recordedAt: string; readonly variance: string; }
