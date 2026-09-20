import { decide } from "@/domain/decision/engine";
import type { DecisionInput } from "@/domain/decision/contracts";
import { identifier, requireDecision } from "@/domain/decision/validation";
import { snapshot } from "@/domain/scoring/validation";
import type { MethodologyRegistry } from "@/ports/methodology-registry";
import type { AnalyticalArtifacts } from "@/ports/scoring";
import type { DecisionArtifacts, DecisionPortfolioRead } from "@/ports/decision";
import type { Clock } from "@/ports/runtime";
export type DecisionCommand = Omit<DecisionInput, "portfolio" | "scorecard" | "ranking" | "comparatorScorecards" | "recordedAt"> & {
  readonly scorecardId: string; readonly rankingId: string | null; readonly comparatorScorecardIds: readonly string[];
};
/** Server/application command. No client-supplied final state, balances or score artifacts are accepted. */
export class DecisionEngine {
  constructor(private readonly registry: MethodologyRegistry, private readonly analytical: AnalyticalArtifacts,
    private readonly artifacts: DecisionArtifacts, private readonly portfolio: DecisionPortfolioRead, private readonly clock: Clock) {}
  async create(raw: DecisionCommand) {
    const command = snapshot(raw);
    identifier(command.scorecardId);
    const card = await this.analytical.find(command.scorecardId);
    requireDecision(card && "totalScore" in card, "PERSISTED_SCORECARD_REQUIRED");
    const ranking = command.rankingId === null ? null : await this.analytical.find(command.rankingId);
    requireDecision(command.rankingId === null || (ranking && "entries" in ranking), "PERSISTED_RANKING_REQUIRED");
    const comparators = [];
    for (const id of command.comparatorScorecardIds) {
      const card = await this.analytical.find(id);
      requireDecision(card && "totalScore" in card, "PERSISTED_COMPARATOR_REQUIRED"); comparators.push(card);
    }
    for (const method of [...Object.values(command.methods), card.methodology, ...comparators.map(c => c.methodology)]) {
      const stored = await this.registry.findById(method.methodologyId);
      requireDecision(stored && Object.entries(stored).every(([key, value]) => method[key as keyof typeof method] === value), "REGISTERED_METHOD_REQUIRED");
    }
    if (command.priorDecisionId !== null) {
      const prior = await this.artifacts.find(command.priorDecisionId);
      requireDecision(prior && prior.securityId === command.securityId && prior.scope === command.scope && prior.asOf <= command.asOf && prior.recordedAt <= command.knownAt, "PRIOR_DECISION_LINEAGE_MISMATCH");
    }
    const portfolio = await this.portfolio.read(command.asOf);
    requireDecision(await this.portfolio.isCurrent(portfolio), "STALE_PORTFOLIO");
    for (const comparator of command.assessment.opportunity.comparators) {
      if (!comparator.eligible) continue;
      const qualification = await this.artifacts.find(comparator.decisionId);
      requireDecision(qualification && qualification.securityId === comparator.securityId && qualification.lineage.scorecardId === comparator.scorecardId &&
        qualification.scope === command.scope && qualification.asOf === command.asOf && qualification.recordedAt <= command.knownAt && qualification.reviewStatus === "FINAL" &&
        qualification.input.portfolio.integrity.portfolioId === portfolio.integrity.portfolioId && qualification.lineage.ledgerWatermark === portfolio.integrity.ledgerWatermark &&
        ["BUY", "ACCUMULATE", "STRONG BUY"].includes(qualification.decisionState) && qualification.executionStatus !== "BLOCKED — PORTFOLIO/RISK",
        "QUALIFIED_COMPARATOR_DECISION_REQUIRED");
    }

    const { scorecardId: _score, rankingId: _ranking, comparatorScorecardIds: _comparators, ...input } = command;
    void _score; void _ranking; void _comparators;
    const result = decide({ ...input, recordedAt: this.clock.now(), scorecard: card, ranking: ranking && "entries" in ranking ? ranking : null, comparatorScorecards: comparators, portfolio });
    requireDecision(await this.portfolio.isCurrent(portfolio), "STALE_PORTFOLIO");
    await this.artifacts.append(result);
    return result;
  }
}
