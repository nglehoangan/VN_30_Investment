import type { Scorecard } from "@/domain/scoring/scorecard";
import type { Ranking, PortfolioIntegrity } from "@/domain/ranking/rank";
import type { MethodologyRecord } from "@/domain/methodology/record";

export const STATES = ["STRONG BUY", "BUY", "ACCUMULATE", "HOLD", "REDUCE", "SELL", "AVOID"] as const;
export type DecisionState = typeof STATES[number];
export const EXECUTION = ["EXECUTE", "STAGED", "TEMPORARILY DEFERRED", "REQUIRES CASH ACCUMULATION", "BLOCKED — PORTFOLIO/RISK", "NOT ACTIONABLE", "NO EXECUTION — CASH/SETTLEMENT INSUFFICIENT"] as const;
export const STAGE0 = ["FAIL — INELIGIBLE", "FAIL — RISK VETO", "FAIL — INVESTABILITY", "PENDING — RISK POLICY REVIEW", "PENDING — INSUFFICIENT EVIDENCE", "PASS WITH CONDITIONS", "PASS"] as const;
export const METHOD = "m65-decision-v1-session-resolutions-20260920";
export interface Evidence {
  readonly id: string; readonly source: string; readonly asOf: string; readonly receivedAt: string;
  readonly validThrough: string; readonly classification: "FACT" | "ESTIMATE" | "ASSUMPTION";
  readonly summary: string;
}
export interface Assessment {
  readonly analyst: string; readonly source: "HUMAN"; readonly assessedAt: string;
  readonly evidenceRefs: readonly string[]; readonly rationale: string;
}
export interface DecisionEvidence extends Assessment {
  readonly stage0: { readonly outcome: typeof STAGE0[number]; readonly findings: readonly typeof STAGE0[number][]; readonly methodologyId: string; readonly conditionalBuyPermitted: boolean; readonly conditionalMitigation: string | null };
  readonly reviewStatus: "FINAL" | "PENDING" | "ESCALATED";
  readonly thesis: { readonly original: string; readonly current: string; readonly status: "INTACT" | "IMPROVING" | "WEAKENING" | "BROKEN" | "PENDING"; readonly strength: "HIGH" | "MEDIUM" | "LOW"; readonly breakConditions: readonly string[]; readonly violatedCondition: string | null; readonly changes: string; readonly freshUnderwriting: boolean; readonly incrementalCase: string | null; readonly declineReviewComplete: boolean; readonly averagingDown: boolean; readonly forwardEconomicsImproved: boolean; readonly valueTrap: boolean };
  readonly valuation: { readonly status: "DEEPLY ATTRACTIVE" | "ATTRACTIVE" | "FAIR" | "EXPENSIVE" | "EXTREME" | "UNRELIABLE / PENDING"; readonly expectedReturn: string | null; readonly lowerReturn: string | null; readonly upperReturn: string | null; readonly primaryMethod: string; readonly crossChecks: readonly string[]; readonly intrinsicLow: string | null; readonly intrinsicHigh: string | null; readonly downside: string; readonly upside: string; readonly assumptions: string; readonly sensitivity: string; readonly confidence: "HIGH" | "MEDIUM" | "LOW"; readonly significantMos: boolean; readonly exceptionalAsymmetry: boolean; readonly aggressiveExpansion: boolean; readonly extremeRobust: boolean; readonly returnInadequate: boolean };
  readonly requiredReturn: { readonly riskAdjustmentRequired: boolean; readonly adjustedHurdle: string | null; readonly calibrationReference: string | null; readonly exceptionRequested: boolean; readonly veryHighQuality: boolean; readonly strongFinancialResilience: boolean; readonly strongDownsideProtection: boolean; readonly resilienceBenefit: boolean; readonly noBetterQualifiedAlternative: boolean; readonly rationale: string };
  readonly risk: { readonly veto: "NONE" | "CAPITAL-ALLOCATION VETO" | "OWNERSHIP VETO" | "POSSIBLE / UNRESOLVED VETO"; readonly ownershipProhibited: boolean; readonly mandatoryReview: boolean; readonly materialDeterioration: boolean; readonly hiddenFactorBlocksAdd: boolean; readonly drawdown: "NORMAL" | "WATCH" | "ELEVATED" | "CRITICAL" | "SEVERE"; readonly riskIncreasing: boolean; readonly approvalReference: string | null; readonly smallNavException: boolean; readonly normalizationPlan: string | null; readonly elevatedSizeJustification: string | null };
  readonly ownershipCase: { readonly continuedOwnership: boolean; readonly whyNotAdd: string; readonly whyNotExit: string; readonly whyHoldVersusAlternatives: string; readonly reductionReason: "NONE" | "CONCENTRATION" | "RISK" | "THESIS" | "VALUATION" | "OPPORTUNITY COST" | "LEGACY"; readonly zeroOwnershipReason: "NONE" | "RISK" | "VALUATION" | "OPPORTUNITY COST" | "LEGACY"; readonly residualRationale: string | null; readonly targetShares: string | null; readonly legacyExitPlan: string | null };
  readonly opportunity: { readonly mode: "INCREMENTAL CAPITAL" | "EXISTING CAPITAL REALLOCATION"; readonly comparisonScope: string; readonly excludedComparators: readonly string[]; readonly cash: "BETTER" | "COMPETITIVE" | "INFERIOR"; readonly cashRationale: string; readonly cashExpectedReturn: string | null; readonly relativeMerit: "SUPERIOR" | "COMPETITIVE" | "INFERIOR" | "INDETERMINATE"; readonly topTier: boolean; readonly comparators: readonly Comparator[]; readonly switchingTo: string | null; readonly robustAfterFriction: boolean; readonly frictionAndUncertainty: string; readonly zeroSuperiorToResidual: boolean };
  readonly technical: { readonly status: "FAVORABLE" | "NEUTRAL" | "UNFAVORABLE" | "NOT ASSESSED"; readonly timing: "EXECUTE" | "STAGED" | "TEMPORARILY DEFERRED"; readonly concreteRisk: string | null; readonly resumeCondition: string | null; readonly expiryTrigger: string | null; readonly mandatoryExitDelaySafe: boolean; readonly marketMoneyFlow: string };
  readonly sizing: { readonly proposedShares: string; readonly boardLot: string; readonly price: string; readonly fees: string; readonly economicTargetUpper: string; readonly portfolioImpact: "IMPROVES PORTFOLIO" | "NEUTRAL / ACCEPTABLE" | "CONSTRAINED — SMALLER SIZE REQUIRED" | "NEGATIVE — DO NOT ADD" | "REQUIRES REDUCTION"; readonly whyNotLarger: string; readonly whyNotSmaller: string; readonly operationalBlock: string | null };
  readonly keyPositives: readonly string[]; readonly keyRisks: readonly string[];
  readonly invalidationConditions: readonly string[]; readonly nextReviewTrigger: string;
  readonly missingCritical: readonly string[];
}
export interface Comparator extends Assessment {
  readonly securityId: string; readonly scorecardId: string; readonly decisionId: string; readonly kind: "NEW" | "ADD";
  readonly expectedReturn: string; readonly lowerReturn: string; readonly upperReturn: string;
  readonly eligible: boolean; readonly qualityNoWorse: boolean; readonly riskNoWorse: boolean;
  readonly confidenceNoLower: boolean; readonly thesisNoWorse: boolean; readonly fitNoWorse: boolean;
  readonly robustlySuperior: boolean; readonly marginalCapacity: string;
}
/** Already-derived M6.3 facts. No transaction history is accepted by M6.5. */
export interface DecisionPortfolio {
  readonly integrity: PortfolioIntegrity;
  readonly capturedAt: string;
  readonly nav: string | null; readonly executableCash: string | null;
  readonly positions: readonly { readonly securityId: string; readonly shares: string; readonly marketValue: string | null; readonly sector: string | null }[];
}
export interface DecisionInput {
  readonly id: string; readonly securityId: string; readonly asOf: string; readonly knownAt: string; readonly recordedAt: string;
  readonly priorDecisionId: string | null; readonly revisionReason: string | null;
  readonly reviewType: "INITIAL" | "SCHEDULED" | "TRIGGERED" | "DCA" | "REBALANCE" | "EXIT" | "OTHER";
  readonly scope: "FORMAL" | "SYNTHETIC_TEST";
  readonly methods: { readonly decision: MethodologyRecord; readonly risk: MethodologyRecord; readonly requiredReturn: MethodologyRecord; readonly stage0: MethodologyRecord };
  readonly scorecard: Scorecard; readonly ranking: Ranking | null;
  readonly comparatorScorecards: readonly Scorecard[];
  readonly portfolio: DecisionPortfolio; readonly evidence: readonly Evidence[]; readonly assessment: DecisionEvidence;
}
