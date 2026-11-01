import type { MethodologyRegistry } from "@/ports/methodology-registry";
import type { AiScoringDatasets, AiDatasetSelection } from "@/ports/personal-ai-scoring";
import { calculateScorecard, type ScoreInput } from "@/domain/personal-ai/scorecard";
import type { AiHash } from "@/domain/personal-ai/provenance";
import { check, snapshot } from "@/domain/scoring/validation";
import { deepFreeze } from "@/domain/portfolio/transaction";
export class PersonalAiScoringEngine {
  constructor(private readonly registry: MethodologyRegistry, private readonly datasets: AiScoringDatasets, private readonly hash: AiHash) {}
  async score(raw: ScoreInput, selection: AiDatasetSelection) {
    const input = deepFreeze(snapshot(raw));
    const method = await this.registry.findById(input.methodology.methodologyId);
    check(method && this.hash(method) === this.hash(input.methodology), "UNREGISTERED_AI_METHODOLOGY");
    const binding = await this.datasets.authorize(input, selection), card = calculateScorecard(input, this.hash);
    await this.datasets.append(card, binding); return card;
  }
  async find(id: string) { return this.datasets.find(id); }
}
