import { assessMarginalAllocation, validateMarginalCommand, type MarginalCommand } from "@/domain/decision/marginal";
import { requireDecision } from "@/domain/decision/validation";
import type { MarginalArtifacts } from "@/ports/marginal";
import type { DecisionArtifacts, DecisionPortfolioRead } from "@/ports/decision";
import type { AnalyticalArtifacts } from "@/ports/scoring";
import type { MethodologyRegistry } from "@/ports/methodology-registry";
import type { Clock } from "@/ports/runtime";
import { ConflictError } from "@/shared/errors";
/** Trusted analyst command boundary. It accepts evidence, never authorization or ordering outputs. */
export class MarginalDecisionEngine {
  constructor(private readonly artifacts: MarginalArtifacts, private readonly decisions: DecisionArtifacts,
    private readonly analytical: AnalyticalArtifacts, private readonly registry: MethodologyRegistry,
    private readonly portfolio: DecisionPortfolioRead, private readonly clock: Clock,
    private readonly scope: "FORMAL" | "SYNTHETIC_TEST" = "FORMAL") {}
  async create(raw: MarginalCommand) {
    const c = validateMarginalCommand(raw), existing = await this.artifacts.find(c.id);
    if (existing) { requireDecision(existing.scope === this.scope, "MARGINAL_SCOPE_MISMATCH"); if (JSON.stringify(existing.command) !== JSON.stringify(c)) throw new ConflictError(); return existing; }
    const bases = [];
    for (const id of c.baseDecisionIds) {
      const d = await this.decisions.find(id); requireDecision(d && d.scope === this.scope, "PERSISTED_MARGINAL_DECISION_REQUIRED");
      const card = await this.analytical.find(d.lineage.scorecardId);
      requireDecision(card && JSON.stringify(card) === JSON.stringify(d.input.scorecard), "PERSISTED_MARGINAL_SCORECARD_REQUIRED");
      for (const method of [d.input.scorecard.methodology, ...Object.values(d.input.methods)]) {
        const stored = await this.registry.findById(method.methodologyId);
        requireDecision(stored && Object.entries(stored).every(([key, value]) => method[key as keyof typeof method] === value), "REGISTERED_MARGINAL_METHOD_REQUIRED");
        if (this.scope === "FORMAL") requireDecision(stored.governanceStatus === "APPROVED" && stored.intendedUse === "PRODUCTION", "APPROVED_MARGINAL_METHOD_REQUIRED");
      }
      bases.push(d);
    }
    const pinned = await this.portfolio.read(bases[0].asOf);
    requireDecision(JSON.stringify(pinned) === JSON.stringify(bases[0].input.portfolio) && await this.portfolio.isCurrent(pinned), "CURRENT_MARGINAL_BASE_REQUIRED");
    const history = await this.artifacts.substitutionHistory(pinned.integrity.portfolioId, this.scope, c.evidenceCutoff);
    for (const frame of c.frames) for (const e of frame.substitutionEvidence ?? []) requireDecision(JSON.stringify(e.historyIds.filter(id => !id.startsWith(`${c.id}:step:`)).sort()) === JSON.stringify(history), "COMPLETE_SUBSTITUTION_HISTORY_REQUIRED");
    const result = assessMarginalAllocation(c, bases, this.clock.now());
    requireDecision(await this.portfolio.isCurrent(pinned), "STALE_MARGINAL_BASE");
    await this.artifacts.append(result); return result;
  }
}
