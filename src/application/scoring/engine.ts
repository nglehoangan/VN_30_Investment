import { calculateScorecard, type ScoreInput } from "@/domain/scoring/scorecard";
import { rankScorecards, type RankInput } from "@/domain/ranking/rank";
import { check } from "@/domain/scoring/validation";
import type { MethodologyRegistry } from "@/ports/methodology-registry";
import type { AnalyticalArtifacts, ScoringPortfolioRead } from "@/ports/scoring";
export class ScoringEngine {
  constructor(private readonly registry:MethodologyRegistry,private readonly artifacts:AnalyticalArtifacts){}
  async score(input:ScoreInput){
    const registered=await this.registry.findById(input.methodology.methodologyId);
    check(registered&&Object.entries(registered).every(([k,v])=>input.methodology[k as keyof typeof registered]===v),"UNREGISTERED_METHODOLOGY");
    const result=calculateScorecard(input);await this.artifacts.append(result);return result;
  }
  async rank(input:Omit<RankInput,"portfolio">,portfolio?:ScoringPortfolioRead){
    for(const card of input.cards){
      const stored=await this.artifacts.find(card.id);
      check(stored&&"totalScore" in stored&&JSON.stringify(stored)===JSON.stringify(card),"FORMAL_SCORECARD_REQUIRED");
    }
    const result=rankScorecards({...input,portfolio:portfolio?await portfolio.read(input.asOf):null});
    await this.artifacts.append(result);return result;
  }
}
