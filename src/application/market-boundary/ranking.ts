import { rankPolicyB, type RankInput } from '@/domain/ranking/rank';
import type { Consumption, Pin } from '@/domain/market-boundary/contracts';
import { requireBoundary, same } from '@/domain/market-boundary/validation';
import type { BoundaryAuthority, BoundaryStore } from '@/ports/market-boundary';
import type { AnalyticalArtifacts } from '@/ports/scoring';
import type { Clock } from '@/ports/runtime';
import { BoundaryLifecycle } from './lifecycle';
/** Separate versioned publication path; never persists partial coverage as a legacy all30 Ranking. */
export class PolicyBRankingEngine {
  constructor(private readonly boundary: BoundaryLifecycle,private readonly artifacts: AnalyticalArtifacts,
    private readonly authority: BoundaryAuthority,private readonly store: BoundaryStore,private readonly clock: Clock) {}
  async publish(input: RankInput, analysisPin: Pin, request: Consumption) {
    requireBoundary(request.mode==='LIVE'&&request.purpose==='RANKING','RANKING_PURPOSE');
    const expected=await this.authority.currentDependencies();
    const {analysis,initialization}=await this.boundary.validateAnalysisForConsumption(analysisPin,request);
    const ids=initialization.body.members.filter(m=>m.state==='SCORABLE').map(m=>m.securityId).sort();
    requireBoundary(same(ids,[...request.securityIds].sort())&&input.asOf===analysis.body.analysisTimestamp,'RANKING_FULL_ELIGIBLE_COVERAGE');
    requireBoundary(same(analysis.body.inputArtifacts,input.cards.map(c=>({id:c.id,hash:this.authority.hash(c)}))),'RANKING_ANALYSIS_INPUT_BINDING');
    for(const c of input.cards){const stored=await this.artifacts.find(c.id);requireBoundary(stored&&same(stored,c)&&c.input.artifactScope==='FORMAL','PERSISTED_FORMAL_RANKING_INPUT');}
    const output=rankPolicyB(input,initialization,this.authority.hash);
    const final=await this.boundary.validateAnalysisForConsumption(analysisPin,request);
    requireBoundary((await this.authority.currentDependencies()).hash===expected.hash,'RANKING_DEPENDENCIES_CHANGED');
    const payload={id:input.id,contractVersion:'policy-b-ranking-publication-v1' as const,analysis:analysisPin,initialization:analysis.body.initialization,
      dependenciesHash:expected.hash,createdAt:this.clock.now(),freshness:final.freshness,output};
    const publication={...payload,contentHash:this.authority.hash(payload)};
    await this.store.sealRanking(publication,expected);return publication;
  }
}
