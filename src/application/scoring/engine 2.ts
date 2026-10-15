import { calculateScorecard, type ScoreInput } from "@/domain/scoring/scorecard";
import { rankScorecards, type RankInput } from "@/domain/ranking/rank";
import { check } from "@/domain/scoring/validation";
import type { MethodologyRegistry } from "@/ports/methodology-registry";
import type { AnalyticalArtifacts, ScoringPortfolioRead, ScoringDatasets, ScoringDatasetSelection } from "@/ports/scoring";
export class ScoringEngine {
  constructor(private readonly registry:MethodologyRegistry,private readonly artifacts:AnalyticalArtifacts,private readonly datasets?:ScoringDatasets){}
  async score(input:ScoreInput,selection?:ScoringDatasetSelection){
    const registered=await this.registry.findById(input.methodology.methodologyId);
    check(registered&&Object.entries(registered).every(([k,v])=>input.methodology[k as keyof typeof registered]===v),"UNREGISTERED_METHODOLOGY");
    if(input.artifactScope==='FORMAL'){
      check(this.datasets&&selection,'FORMAL_SCORING_DATASET_REQUIRED');
      const authorization=await this.datasets.authorize(input,selection);
      const result=calculateScorecard(input);await this.datasets.append(result,authorization);return result;
    }
    check(input.artifactScope==='SYNTHETIC_TEST'&&!selection,'EXPLICIT_SYNTHETIC_SCORING_PATH');
    const result=calculateScorecard(input);await this.artifacts.append(result);return result;
  }
  async rank(input:Omit<RankInput,"portfolio">,portfolio?:ScoringPortfolioRead){
    for(const card of input.cards){
      if(card.input.artifactScope==='FORMAL')check(this.datasets&&await this.datasets.findBinding(card.id),'REVIEWED_SCORECARD_DATASET_REQUIRED');
      const stored=await this.artifacts.find(card.id);
      check(stored&&"totalScore" in stored&&JSON.stringify(stored)===JSON.stringify(card),"FORMAL_SCORECARD_REQUIRED");
    }
    const result=rankScorecards({...input,portfolio:portfolio?await portfolio.read(input.asOf):null});
    await this.artifacts.append(result);return result;
  }
}
